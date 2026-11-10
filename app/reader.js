// The scene reader: one request to your reader connection that reads moods or bond meters from
// the latest messages.
import { getState, getUserState, identity, persist, playerName, selectedCast, target } from './chat.js';
import { syncPrompt } from './note.js';
import { bondAxes, bondData, bondList, editBond } from './replies.js';
import { settings } from './settings.js';
import { KEY, ctx, run, ui } from './state.js';
import { METERS, computeBond, dynamicRows, paceOf, setMeter } from '../engine/bond.js';
import { bondReadMessages, parseBondRead } from '../engine/bondread.js';
import { analysisMessages, applyAnalysis, fingerprint, parseAnalysis, sceneData } from '../engine/reader.js';
import { cleanScope } from '../engine/state.js';
import { shortName } from '../engine/util.js';
import { fill as fillDynamic } from '../engine/dynamics.js';
import { MORE_METERS, cleanMore, setMore } from '../engine/meters.js';
import { render, renderStatus } from '../panel/render.js';
import { SCOPES } from '../panel/sections.js';

export function cancelAnalysis() {
    run.pending?.controller.abort();
}
// ---- Scene reader ----
// Works for whoever is open (not the story), in manual mode too: tap Read, keep editing by hand.
export const readerProfile = () => settings().readerProfile || getState()?.profile || '';
export const sceneStart = () => Number(ctx().chatMetadata[KEY]?.sceneStart) || 0;
export function readerSubject(whom = ui.who, ch = target()) {
    if (whom === 'user') {
        const pu = ctx().powerUserSettings;
        return { state: getUserState(), person: { name: playerName(), description: pu?.persona_description ?? '' }, key: 'user' };
    }
    if (whom === 'cast') { const p = selectedCast(); return p ? { state: p.state, person: { name: p.name }, key: `cast:${p.id}` } : null; }
    return { state: getState(ch), person: ch, key: `char:${ch?.avatar}` };
}
export function readerRequest(subject, scope) {
    const data = sceneData(ctx().chat, subject.person, subject.state, settings(), { sceneStart: sceneStart(), scope });
    return { data, messages: analysisMessages(data) };
}
// Rough count for the panel only (about 3.6 characters per token), so cost is visible before tapping.
export const roughTokens = messages => Math.round(messages.reduce((n, m) => n + m.content.length, 0) / 3.6);
export async function analyse(force = false, whom = ui.who, ch = target()) {
    const c = ctx(), subject = readerSubject(whom, ch);
    const state = subject?.state;
    if (run.suspended || !state || !state.enabled || run.pending || whom === 'story') return;
    // Nothing ticked means nothing to read; don't pay for an empty request.
    if (!SCOPES.some(([k]) => cleanScope(state.readScope)[k])) { if (force) { run.status = `Nothing to read: tick Moodlets, Body, Traits or Wants under ✧ Scene reader first.`; renderStatus(); } return; }
    const profile = readerProfile();
    if (!profile) { run.status = 'Pick a reader connection under ✧ Scene reader first.'; renderStatus(); return; }
    const snapshot = identity(ch) + subject.key, revision = state.revision, metadata = c.chatMetadata;
    const fp = fingerprint(c.chat), userCount = c.chat.filter(m => m.is_user && !m.is_system).length;
    if (!force && (fp === state.lastFingerprint || (state.lastUserCount >= 0 && userCount > state.lastUserCount && userCount - state.lastUserCount < state.interval))) return;
    const scope = cleanScope(state.readScope);
    const { data, messages } = readerRequest(subject, scope);
    const controller = new AbortController();
    run.pending = { controller, snapshot };
    const timer = setTimeout(() => controller.abort(), 45000);
    run.status = `Reading the scene for ${subject.person.name}…`; render();
    try {
        // No fallback to the main model: a missing or invalid profile is an error.
        const response = await c.ConnectionManagerRequestService.sendRequest(profile, messages, settings().outputTokens,
            { stream: false, signal: controller.signal, extractData: true, includePreset: false, includeInstruct: true });
        if (controller.signal.aborted || metadata !== ctx().chatMetadata || snapshot !== identity(ch) + readerSubject(whom, ch)?.key || revision !== state.revision || fp !== fingerprint(ctx().chat)) {
            run.status = 'The scene or your settings changed while reading, so that read was thrown away.'; return;
        }
        const result = parseAnalysis(response?.content ?? '', data);
        state.history = [...(state.history || []).slice(-9), { moods: { ...state.moods },
            wants: structuredClone(state.wants ?? []), reason: state.reason, updatedAt: state.updatedAt }];
        applyAnalysis(state, result, scope);
        state.reason = result.reason; state.updatedAt = Date.now(); state.lastFingerprint = fp; state.lastUserCount = userCount;
        await persist(state);
        run.status = `Updated from the scene${Object.values(state.pins).some(Boolean) ? '; pinned ones were left alone' : ''}.${result.added?.length ? ` ${result.added.length} new want${result.added.length > 1 ? 's' : ''} or fear${result.added.length > 1 ? 's' : ''} added.` : ''}`;
    } catch (error) {
        run.status = controller.signal.aborted ? 'Reading stopped or timed out. Nothing changed.' : (error.message || 'Reading failed. Nothing changed.');
    } finally {
        clearTimeout(timer); run.pending = null;
        await syncPrompt(); render();
    }
}
// Bonds → Re-read the scene. One request to the reader's connection, only when tapped: where the
// character and your persona stand now, from the latest messages. The meters are set there (pinned ones are
// left alone) and, in story mode, the dynamic the reader names holds until a reply names another.
export async function readBond(ch = target()) {
    const c = ctx(), bond = bondData(ch), profile = readerProfile();
    if (run.suspended || !ch || !bond.on || run.pending) return;
    if (!profile) { run.status = 'Pick a reader connection under ✧ Scene reader (Moods tab) first.'; renderStatus(); return; }
    const n = shortName(ch.name), u = shortName(playerName()), list = bondList(ch), now = computeBond(bond, Infinity, n, u, bondAxes(ch), list);
    const on = cleanMore(bond.more).on, meters = on.map(k => { const m = MORE_METERS.find(x => x[0] === k); return { key: k, word: m[4], two: m[2] }; });
    const names = (bond.pool.length ? dynamicRows().filter(r => bond.pool.includes(r[0])) : dynamicRows()).map(r => fillDynamic(r[0], n, u));
    const data = sceneData(c.chat, ch, getState(ch), settings(), { sceneStart: sceneStart() });
    const current = { friendship: now.friend, romance: now.romance, ...(bond.extra ? { trust: now.trust, control: now.control, pull: now.pull } : {}), dynamic: now.dynamic.name,
        ...Object.fromEntries(meters.map(m => [m.word, now.more[m.key]])) };
    const messages = bondReadMessages({ n, u, notes: data.character.notes, scene: data.scene, current, meters, names, extra: bond.extra });
    const controller = new AbortController(), snapshot = identity(ch), fp = fingerprint(c.chat), metadata = c.chatMetadata;
    run.pending = { controller, snapshot };
    const timer = setTimeout(() => controller.abort(), 45000);
    run.status = `Reading where ${n} and ${u} stand…`; render();
    try {
        const response = await c.ConnectionManagerRequestService.sendRequest(profile, messages, settings().outputTokens,
            { stream: false, signal: controller.signal, extractData: true, includePreset: false, includeInstruct: true });
        if (controller.signal.aborted || metadata !== ctx().chatMetadata || snapshot !== identity(ch) || fp !== fingerprint(ctx().chat)) {
            run.status = 'The scene changed while reading, so that read was thrown away.'; return;
        }
        const read = parseBondRead(response?.content ?? '', meters), cap = paceOf(bond).cap;
        await editBond((b, steps) => {
            for (const k of METERS) if (read[k] !== null && b.pins[k] === null && (bond.extra || ['f', 'r'].includes(k))) setMeter(b, k, read[k], steps);
            for (const [k, v] of Object.entries(read.m)) if (cleanMore(b.more).pins[k] === null) setMore(b, k, v, steps, cap);
            const last = steps.at(-1);
            if (read.dynamic) b.read = { name: read.dynamic, why: read.why, key: last?.key ?? '', pos: last?.pos ?? -1 };
        });
        run.status = `Re-read: ${read.dynamic || 'meters updated'}${read.why ? `. ${read.why}` : ''}`;
    } catch (error) {
        run.status = controller.signal.aborted ? 'Reading stopped or timed out. Nothing changed.' : (error.message || 'Reading failed. Nothing changed.');
    } finally {
        clearTimeout(timer); run.pending = null; render();
    }
}
