// Reading the chat's replies: the needs board, hidden weave lines, bond meters, and keeping
// everything in line when replies are swiped, edited or deleted.
import { getCast, getPair, getState, getStoryState, getUserState, members, pairId, persist, playerName, resolveRelationName, target } from './chat.js';
import { lastDynamic, scenePace, syncPrompt, writingNow } from './note.js';
import { settings } from './settings.js';
import { KEY, ctx, newId, run, ui } from './state.js';
import { NO_BOARD, boardKeyOf, cleanBoardMeta, feedValues, feelingId, feelingsFromBoard, fixActive, hasBoard, isNone, latestBoard, liveBoard, namedIn, needWord, parseBoard, relationId, relationsFromBoard } from '../engine/board.js';
import { METERS, cleanBond, computeBond, computeDesire, paceOf, sliderAxes, sparkTarget, storedSteps } from '../engine/bond.js';
import { BY_ID, INTIMACY_CATEGORIES, MOODS, analysed, sectionOf } from '../data/catalogue.js';
import { clamp, escapeHtml as esc, shortName } from '../engine/util.js';
import { ROLE_HOMES, fill as fillDynamic } from '../engine/dynamics.js';
import { diff, effectiveChat, settle, track, untrack, weaveKey } from '../engine/ledger.js';
import { MORE_METERS, computeMore, saidMeters } from '../engine/meters.js';
import { withNudges } from '../engine/mood-meters.js';
import { fadeStep, heldBy, paceDelta } from '../engine/moodpace.js';
import { findOverlaps } from '../engine/overlap.js';
import { render } from '../panel/render.js';
import { guessPronoun, setPronoun } from '../engine/pronouns.js';
import { cleanCombos, cravingsFrom, findCombos } from '../engine/reactive.js';
import { RELATIONSHIP_BY_ID, SHARED_BY_ID, cloneRelationships } from '../engine/relationships.js';
import { TURN_BY_ID } from '../engine/turns.js';
import { hasWeave, parseWeave, powerChange } from '../engine/weave.js';

// ---- Needs board: read from the latest info board in the chat, plus the player's edits ----
export const boardMeta = () => ctx().chatMetadata?.[KEY]?.board;
export const boardSend = () => Boolean(ctx().chatId) && (boardMeta()?.send ?? settings().boardSend);
// ---- The chat as it stands for the next reply ----
// A swipe that's still being written doesn't count yet: SillyTavern leaves the old swipe's text in the
// chat until the new one starts streaming, and nothing that old swipe did should reach the new one.
export const liveChat = (type = '') => effectiveChat(ctx().chat, type);
// Each message is read once per version of its text.
const readCache = new WeakMap();
function readOf(m) {
    if (!m || typeof m.mes !== 'string') return { weave: null, boardKey: '' };
    const hit = readCache.get(m);
    if (hit && hit.mes === m.mes && hit.date === m.send_date) return hit;
    const weave = hasWeave(m.mes) ? parseWeave(m.mes) : null;
    const next = { mes: m.mes, date: m.send_date, weave, wkey: weave ? weaveKey(m) : '', boardKey: boardKeyOf(m) };
    readCache.set(m, next); return next;
}
export const weaveOf = m => readOf(m).weave;
// Every key a reply can be known by: its weave line and its board. Both count as "still here", so
// switching the weave line on or off never undoes a reply.
const keysOf = m => { const r = readOf(m); return [...(r.wkey ? [r.wkey] : []), ...(r.boardKey ? [`b|${r.boardKey}`] : [])]; };
const solo = () => !ctx().groupId;
export const writes = ch => m => Boolean(m && ch && !m.is_user && (solo() || m.name === ch.name));
const writerOf = m => solo() ? target() : members().find(w => w.name === m?.name) ?? null;
export function liveFor(ch = target(), chat = liveChat()) {
    return liveBoard(latestBoard(chat), boardMeta(), { char: ch?.name ?? '', user: playerName() }, needSteps(chat), { pins: settings().boardPins, timeline: needTimeline(ch, chat), needs: needOpts() });
}
// Each of the character's replies with a board or reported needs, oldest first, so needs can
// drain with in-world time and come back up after a time jump. Read from the chat every time.
function needTimeline(ch, chat = liveChat()) {
    if (!ch) return [];
    const mine = writes(ch), feed = cleanBoardMeta(boardMeta()).feed && bondData(ch).on, out = [];
    (chat ?? []).forEach((m, i) => {
        if (!mine(m) || m.is_system) return;
        const board = hasBoard(m.mes) ? parseBoard(m.mes) : null, w = feed ? weaveOf(m) : null;
        if (board || (w && (Object.keys(w.needs ?? {}).length || Object.keys(w.needDeltas ?? {}).length))) out.push({ index: i, board, needs: w?.needs ?? {}, deltas: w?.needDeltas ?? {} });
    });
    return out.slice(-40);
}
export const needOpts = () => ({ drift: settings().needsDrift, speed: settings().needsSpeed, skips: settings().needsSkips, floor: settings().needsFloor });
// Intimacy entries that are on can light up like turn-ons.
const bedroomTraits = st => MOODS.filter(m => INTIMACY_CATEGORIES.has(m.category) && (st?.moods?.[m.id] ?? 0) > 0).map(m => ({ id: m.id, label: m.label }));
const WANT_STOP = new Set(['the', 'and', 'her', 'his', 'them', 'their', 'she', 'him', 'get', 'make', 'for', 'with', 'from', 'being']);
function wantMatch(text, wants) {
    const raw = String(text).toLowerCase().trim(), ws = raw.replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !WANT_STOP.has(w));
    let best = null, score = 0;
    for (const w of wants) {
        const keys = w.text.toLowerCase(), sc = keys.includes(raw) || raw.includes(keys) ? 1 : ws.filter(x => keys.includes(x)).length / Math.max(1, ws.length);
        if (sc > score) { score = sc; best = w; }
    }
    return score >= 0.5 ? best : null;
}
// What the story set off, read from the hidden lines still in the chat: lit turn-ons and traits, wants
// moved or blocked, fears touched, hot buttons pressed, wants that came true, wants it suggests, and
// what it has done to your character's body. Swiping a reply takes all of it with it.
export function reactions(ch, chat = liveChat(), live = null) {
    const st = getState(ch), out = { turns: new Set(), traits: new Set(), free: [], wants: new Map(), done: new Set(), doneAt: new Map(), suggest: [], condition: [], craving: new Map(), cravingMet: new Set(), combos: [] };
    if (!st || !ch || !bondData(ch).on) return out;
    const mine = writes(ch), replies = [];
    (chat ?? []).forEach((m, i) => { if (mine(m) && !m.is_system) { const w = weaveOf(m); if (w) replies.push([i, w]); } });
    const wants = (st.wants ?? []).filter(w => !w.done && w.text), kind = (...k) => wants.filter(w => k.includes(w.kind));
    for (const [i, w] of replies) for (const x of w.wants ?? []) {
        if (x.status !== 'done') continue;
        const hit = wantMatch(x.text, kind('want', 'goal')); if (hit && i > (hit.after ?? -1)) { out.done.add(hit.id); out.doneAt.set(hit.id, i); }
    }
    const newest = replies.at(-1)?.[1];
    if (newest) {
        const traits = bedroomTraits(st);
        for (const sp of newest.sparked ?? []) { const t = sparkTarget(sp.text, st.prefs ?? {}, traits); if (t.id) out.turns.add(t.id); else if (t.trait) out.traits.add(t.trait); else out.free.push(sp); }
        for (const x of newest.wants ?? []) { if (x.status === 'done') continue; const hit = wantMatch(x.text, kind('want', 'goal')); if (hit) out.wants.set(hit.id, x.status); }
        for (const f of newest.fears ?? []) { const hit = wantMatch(f, kind('fear')); if (hit) out.wants.set(hit.id, 'touched'); }
        for (const b of newest.pressed ?? []) { const hit = wantMatch(b, kind('button')); if (hit) out.wants.set(hit.id, 'pressed'); }
    }
    const dismissed = new Set((st.wantsDismissed ?? []).map(t => String(t).toLowerCase()));
    for (const [i, w] of replies.slice(-6)) {
        const t = w.newWant; if (!t || dismissed.has(t.toLowerCase()) || wantMatch(t, st.wants ?? []) || out.suggest.some(x => x.text.toLowerCase() === t.toLowerCase())) continue;
        out.suggest.push({ text: t, index: i });
    }
    for (const [, w] of replies.slice(-12)) if (Array.isArray(w.you)) out.condition = w.you;
    // Cravings (strong turn-ons that haven't lit in a while) and combos (two things at once).
    const prefs = st.prefs ?? {}, bedroom = bedroomTraits(st);
    const litPer = replies.map(([, w]) => new Set((w.sparked ?? []).filter(sp => !sp.off).map(sp => sparkTarget(sp.text, prefs, bedroom).id).filter(Boolean)));
    if (settings().cravingsOn) {
        const before = cravingsFrom(prefs, litPer.slice(0, -1)), now = cravingsFrom(prefs, litPer);
        out.craving = new Map(now.map(c => [c.id, c.gap]));
        out.cravingMet = new Set(before.filter(c => litPer.at(-1)?.has(c.id)).map(c => c.id));
    }
    if (settings().combosOn && newest) {
        const list = bondList(ch, chat), bond = bondData(ch), statuses = [...out.wants.values()];
        out.combos = findCombos({ lit: litPer.at(-1) ?? new Set(), litTraits: out.traits, moods: st.moods, pressed: statuses.includes('pressed'), blocked: statuses.includes('-'),
            desire: bond.desire?.on ? computeDesire(bond, list) : null, more: computeMore(bond.more, list, paceOf(bond).cap).values, cravingMet: out.cravingMet,
            needsLow: new Set((live?.needs ?? []).filter(nd => nd.known && nd.value <= 35).map(nd => nd.id)) }, cleanCombos(st.combos), shortName(ch.name), shortName(playerName()));
    }
    return out;
}
// For the Bonds tab: what has set the character off over the whole chat, and how often.
export function reactionTally(ch, chat = liveChat()) {
    const st = getState(ch), traits = bedroomTraits(st), sparks = new Map(), pressed = new Map();
    if (!st || !ch || !bondData(ch).on) return { sparks: [], pressed: [] };
    const mine = writes(ch), buttons = (st.wants ?? []).filter(w => w.kind === 'button');
    (chat ?? []).forEach(m => {
        if (!mine(m) || m.is_system) return; const w = weaveOf(m); if (!w) return;
        for (const sp of w.sparked ?? []) {
            const t = sparkTarget(sp.text, st.prefs ?? {}, traits), key = t.id ? `t:${t.id}` : t.trait ? `r:${t.trait}` : `x:${sp.text.toLowerCase()}`;
            const e = sparks.get(key) ?? { text: t.id ? TURN_BY_ID[t.id].label : t.trait ? BY_ID[t.trait]?.label ?? sp.text : sp.text, off: sp.off, count: 0 }; e.count++; sparks.set(key, e);
        }
        for (const b of w.pressed ?? []) { const hit = wantMatch(b, buttons), k = (hit?.text ?? b).toLowerCase(); const e = pressed.get(k) ?? { text: hit?.text ?? b, count: 0 }; e.count++; pressed.set(k, e); }
    });
    const top = map => [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
    return { sparks: top(sparks), pressed: top(pressed) };
}
// Needs the weave line reported, by position, read from the chat every time (never stored).
function needSteps(chat = liveChat()) {
    const out = {};
    if (!cleanBoardMeta(boardMeta()).feed) return out;
    for (let i = chat.length - 1, seen = 0; i >= 0 && seen < 40; i--, seen++) {
        const m = chat[i]; if (!m || m.is_user || m.is_system) continue;
        const writer = writerOf(m); if (!writer || !bondData(writer).on) continue;
        const w = weaveOf(m); if (w && Object.keys(w.needs).length) out[i] = w.needs;
    }
    return out;
}
export async function editBoard(mutate) {
    const meta = ctx().chatMetadata?.[KEY]; if (!meta) return;
    const b = cleanBoardMeta(meta.board); mutate(b); meta.board = b;
    await persist(); await syncPrompt(); render();
}
// A reply arrived, or one was swiped, edited, continued or deleted. Bring everything into line with
// the chat, save, and redraw.
async function boardChanged() {
    const out = reconcile();
    if (out.changed) { if (out.notes.length) run.status = out.notes.join(' '); await persist(); }
    if (ui.panel?.open) render(true);
    await syncPrompt();
}
// Bond meters, kept per character per chat.
// Who's he and who's she, for the Bonds lines. Auto reads the card and the persona description;
// a persona nobody described counts as she.
export function pronounsFor(ch, bond) {
    const pu = ctx().powerUserSettings ?? globalThis.power_user ?? {};
    // Sentences about your persona would count her pronouns as his, so only the ones that aren't are read.
    const about = String(`${ch.description ?? ''} ${ch.personality ?? ''} ${ch.scenario ?? ''} ${ch.first_mes ?? ''} ${ch.mes_example ?? ''}`).replace(/\{\{char\}\}/gi, ch.name ?? '').split(/(?<=[.!?\n])\s+/)
        .filter(x => !/\{\{user\}\}/i.test(x) && !(playerName() && x.toLowerCase().includes(playerName().toLowerCase()))).join(' ');
    return { n: bond.pn !== 'auto' ? bond.pn : guessPronoun(about) || 'they',
        u: bond.pu !== 'auto' ? bond.pu : guessPronoun(pu.persona_description ?? '') || 'she' };
}
function usePronouns(ch, bond) {
    const p = pronounsFor(ch, bond);
    for (const name of [ch.name, shortName(ch.name)]) setPronoun(name, p.n);
    for (const name of [playerName(), shortName(playerName())]) setPronoun(name, p.u);
}
export function bondData(ch) {
    const meta = ctx().chatMetadata?.[KEY]; if (!meta || !ch) return cleanBond({}, false);
    meta.bond ??= {};
    const key = `char:${ch.avatar}`;
    if (!meta.bond[key]) meta.bond[key] = { base: seedBond(ch), v: 2, pool: [...(settings().dynamicPools?.[key] ?? [])] };
    let bond = cleanBond(meta.bond[key], settings().bondTrack);
    if (bond.v !== 2) bond = migrateBond(bond, ch);
    usePronouns(ch, bond);
    meta.bond[key] = bond;
    // Roles left the dynamics list. Any picked (or chosen with I pick) move to their Relationships tag.
    const roles = [...new Set([...bond.pool, bond.fixed].filter(name => ROLE_HOMES[name]))];
    if (roles.length) {
        bond.pool = bond.pool.filter(name => !ROLE_HOMES[name]);
        if (ROLE_HOMES[bond.fixed]) bond.fixed = '';
        const where = moveRoles(ch, roles);
        if (where.length) run.status = `Roles live in Relationships now: ${where.join(', ')}.`;
    }
    return bond;
}
// Sets each role's Relationships tag (his side toward you, both ways, a trait or a feeling) to at least 70.
function moveRoles(ch, names) {
    const st = getState(ch), out = [];
    if (!st) return out;
    for (const name of names) {
        const [kind, id] = ROLE_HOMES[name], raise = (moods, label) => { moods[id] = Math.max(moods[id] ?? 0, 70); out.push(`${fillDynamic(name, shortName(ch.name), shortName(playerName()))} → ${label}`); };
        if (kind === 'rel') { const rel = userRelation(st, true); rel.moods ??= {}; raise(rel.moods, `${RELATIONSHIP_BY_ID[id].label} (${shortName(ch.name)}’s side)`); }
        else if (kind === 'shared') { const pair = getPair(`char:${ch.avatar}`, 'user', true); if (pair) { pair.moods ??= {}; raise(pair.moods, `${SHARED_BY_ID[id].label} (both ways)`); } }
        else { raise(st.moods, `${BY_ID[id].label} (${({ trait: 'Traits', intimacy: 'Intimacy' })[sectionOf(BY_ID[id])] ?? 'Moods'})`); if (Array.isArray(st.loadout) && !st.loadout.includes(id)) st.loadout.push(id); }
    }
    for (const [k, list] of Object.entries(settings().dynamicPools ?? {})) settings().dynamicPools[k] = (list ?? []).filter(name => !ROLE_HOMES[name]);
    return out;
}
// Meter steps used to be stored by message number, which deletions shifted and a long chat
// capped. Now they're read from the chat. Each meter keeps exactly the value it shows today, anchored
// just before the newest reply, so swiping that reply straight after updating takes its step away.
function migrateBond(bond, ch) {
    const chat = ctx().chat ?? [], list = bondList(ch, effectiveChat(chat)), old = storedSteps(bond, chat.length), last = list.at(-1), prev = list.at(-2);
    for (const k of METERS) {
        const shown = clamp(bond.base[k] + old.reduce((sum, x) => sum + (x.s[k] ?? 0), 0), -100, 100);
        bond.anchors[k] = last ? { v: clamp(shown - (bond.steps[last.pos]?.[k] ?? 0), -100, 100), key: prev?.key ?? '', pos: prev?.pos ?? -1 } : { v: shown, key: '', pos: -1 };
    }
    bond.steps = {}; bond.v = 2;
    return bond;
}
// One step per reply of this character's that has a weave line, oldest first, from the chat itself.
// Hidden messages still count: hiding a reply isn't taking it back.
export function bondList(ch, chat = liveChat()) {
    if (!ch) return [];
    const stored = ctx().chatMetadata?.[KEY]?.bond?.[`char:${ch.avatar}`], mine = writes(ch), out = [], nudge = stored?.nudge !== false, scale = paceOf(stored).lean;
    (chat ?? []).forEach((m, pos) => {
        if (!mine(m)) return;
        const w = weaveOf(m); if (!w) return;
        const step = { f: w.f, r: w.r, t: w.t, p: w.pRaw ? powerChange(w.pRaw, ch.name, playerName()) : w.p, l: w.lRaw ? powerChange(w.lRaw, ch.name, playerName()) : 0, thinks: w.thinks, sparks: w.sparked, d: w.desire ?? null, m: w.meters ?? null, dy: w.dynamic || '' };
        // Feelings that rose this reply nudge the matching meters, unless the line moved them itself.
        out.push({ pos, key: readOf(m).wkey, s: nudge ? withNudges(step, w.moods.filter(x => x.delta > 0).map(x => feelingId(x.name)).filter(Boolean), scale) : step });
    });
    if (out.length) { const st = getState(ch), prefs = st?.prefs ?? {}, traits = bedroomTraits(st); for (const x of out.slice(-3)) x.s = { ...x.s, sparks: x.s.sparks.map(sp => ({ ...sp, ...sparkTarget(sp.text, prefs, traits) })) }; }
    return out;
}
// A new meter starts from the relationship sliders already set toward the player, so an existing
// romance doesn't open at "no spark". Later replies move it from there.
// The same reading of the sliders seeds new meters and shapes the named dynamic (bond.js).
export function bondAxes(ch) {
    const st = getState(ch), rel = st ? userRelation(st) : null;
    const pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')];
    // Your persona's own side toward this character counts too (Has them on a string, Captor of…).
    const name = String(ch?.name ?? '').toLowerCase();
    const mine = (getUserState()?.relationships ?? []).find(r => r.target === '{{char}}' || resolveRelationName(r.target).toLowerCase() === name);
    return sliderAxes(rel && rel.enabled !== false ? rel.moods ?? {} : {}, pair?.enabled !== false ? pair?.moods ?? {} : {}, mine && mine.enabled !== false ? mine.moods ?? {} : {});
}
// The same idea switched on in more than one place (a meter, the dynamic, his slider toward you, a
// both-ways tag, a story trope). Worked out from what the note would actually send; syncPrompt sends each
// idea once and the Bonds tab lists them with a tidy button.
export function bondOverlaps(ch, history, bond = bondData(ch), list = null, bd = null) {
    if (!bond?.on) return [];
    const st = getState(ch), story = getStoryState(ch), rel = st ? userRelation(st) : null;
    const pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')];
    const steps = list ?? bondList(ch, history);
    const d = bd ?? (bond.extra ? computeBond(bond, history.length, shortName(ch.name), shortName(playerName()), bondAxes(ch), steps) : null);
    const sent = { meters: saidMeters(bond.more, steps, paceOf(bond).cap), base: d && (d.t >= 10 || d.t <= -20) ? { t: d.t } : {}, dynamic: d?.dynamic.key ?? '' };
    return findOverlaps({ sent, rel: rel && rel.enabled !== false ? rel.moods : {}, shared: pair && pair.enabled !== false ? pair.moods : {},
        story: story?.enabled ? story.moods : {}, moods: st?.moods ?? {} });
}
// Names for the Bonds tab's "Doubled up" list.
export function overlapNames(list, n, u) {
    const name = x => x.kind === 'meter' ? `${MORE_METERS.find(m => m[0] === x.id)?.[1] ?? x.id} meter` : x.kind === 'base' ? 'Trust meter'
        : x.kind === 'dynamic' ? `${fillDynamic(x.id, n, u)} (dynamic)` : x.kind === 'rel' ? `${RELATIONSHIP_BY_ID[x.id]?.label ?? x.id} ${u} (${n}’s side)`
        : x.kind === 'shared' ? `${SHARED_BY_ID[x.id]?.label ?? x.id} (both ways)` : `${BY_ID[x.id]?.label ?? x.id} (${x.kind === 'story' ? 'story' : 'moodlet'})`;
    return list.map(o => ({ key: o.key, label: o.label, keep: name(o.keep), both: o.both.map(name), drop: o.drop.filter(x => !feedsMeters(x)).map(name),
        held: o.drop.filter(feedsMeters).map(name), also: o.also.map(name) }));
}
// Sliders and both-ways tags that also move the meters (trusts, obsessed, captor of…). The note can skip them,
// but Tidy leaves them on: turning them off would shift the meters and maybe the dynamic.
export const feedsMeters = x => x.kind === 'rel' ? Object.values(sliderAxes({ [x.id]: 100 })).some(Boolean) : x.kind === 'shared' ? Object.values(sliderAxes({}, { [x.id]: 100 })).some(Boolean) : false;
const seedBond = ch => Object.fromEntries(Object.entries(bondAxes(ch)).map(([k, v]) => [k, Math.round(v * 0.8)]));
export const userRelation = (st, create = false) => {
    const you = playerName().toLowerCase();
    let relation = (st.relationships ??= []).find(r => r.target === '{{user}}' || resolveRelationName(r.target).toLowerCase() === you);
    if (!relation && create) { relation = cloneRelationships([{ id: newId(), target: '{{user}}', enabled: true, moods: {} }])[0]; st.relationships.push(relation); }
    return relation;
};
// What a reply can move: the character's feelings and their relationship toward the player.
// Pinned sliders never move. Anything not in the catalogue stays put.
export const moodTarget = st => ({
    get: id => st.moods[id] ?? 0,
    set: (id, v) => { if (BY_ID[id]) st.moods[id] = v; },
    pinned: id => !BY_ID[id] || Boolean(st.pins?.[id]),
});
const relTarget = relation => ({ get: id => relation.moods[id] ?? 0, set: (id, v) => { relation.moods[id] = v; }, pinned: () => false });
const fedOf = (meta, writer) => ((meta.boardFed ??= {})[`char:${writer.avatar}`] ??= { moods: {}, rel: {} });
const labelOf = (st, id) => BY_ID[id]?.label ?? RELATIONSHIP_BY_ID[id]?.label ?? (id.startsWith('custom:') ? 'their own feeling' : id);
// ---- What each reply changed, kept by the reply ----
// meta.applied['char:avatar'] lists, oldest first, every reply whose changes were applied:
// { k: reply key, m: { feeling: [before, after] }, r: { relationship: [before, after] }, fed: board bookkeeping before, mem: memory id }.
// A swiped, regenerated, edited or deleted reply at the end is undone exactly, however many there are.
export const untouchedMemory = m => m?.boardText && m.text === m.boardText && m.value === 55;
function remember(writer, key, raw) {
    if (!writer || isNone(raw)) return '';
    const pair = getPair(`char:${writer.avatar}`, 'user', true); if (!pair) return '';
    const text = String(raw).replace(/^[\[(“"]+|[\])”"]+$/g, '').trim().slice(0, 160);
    pair.memories ??= [];
    if (!text || pair.memories.some(m => m.text.toLowerCase() === text.toLowerCase())) return '';
    const id = newId();
    pair.memories.push({ id, text, value: 55, who: 'both', src: key, boardText: text });
    // Only the newest 8 untouched ones are kept; edit or re-rate one and it's yours for good.
    const auto = pair.memories.filter(untouchedMemory);
    if (auto.length > 8) { const drop = new Set(auto.slice(0, auto.length - 8).map(m => m.id)); pair.memories = pair.memories.filter(m => !drop.has(m.id)); }
    return id;
}
function forget(writer, id) {
    const pair = id && writer ? getPair(`char:${writer.avatar}`, 'user') : null;
    if (pair?.memories) pair.memories = pair.memories.filter(m => !(m.id === id && untouchedMemory(m)));
}
// hold: feelings you moved by hand after an earlier version of this same swipe (before it was continued
// or its hidden line edited). They're yours now, so the new version leaves them alone.
function applyReply(meta, writer, st, m, b, hold = null) {
    const w = bondData(writer).on ? weaveOf(m) : null, boardKey = readOf(m).boardKey;
    const rec = { k: w ? readOf(m).wkey : boardKey ? `b|${boardKey}` : '', m: {}, r: {}, fed: null, mem: '' }, notes = [];
    if (!rec.k) return null;
    if (!st.enabled) return { rec, notes };
    if (w) {
        if (b.feed) {
            // Feelings the story names are matched to the catalogue. "Only my list" keeps the story to the
            // feelings on the character's list.
            const listOnly = st.moodScope === 'list', listed = id => !listOnly || st.loadout?.includes(id) || (st.moods[id] ?? 0) > 0;
            const resolve = name => { const id = feelingId(name); return id && listed(id) ? id : null; };
            // The character's own switch, the pace cap, and arousal from the desire card reaching Horny
            // (the desire field used to take it, so Horny never moved while the card was on).
            const pace = scenePace(writer, st), named = new Set();
            const list = st.moodAuto === false ? [] : w.moods.map(x => ({ ...x, delta: paceDelta(x.delta, pace) }));
            if (st.moodAuto !== false && w.desire?.a && !list.some(x => feelingId(x.name) === 'horny')) list.push({ name: 'horny', delta: paceDelta(w.desire.a * 4, pace) });
            rec.m = track(moodTarget(st), list, (name, delta) => { const id = resolve(name, delta); if (id) named.add(id); return id && hold?.m?.has(id) ? null : id; });
            const relation = userRelation(st, Boolean(w.toward.length || w.feels.length));
            if (relation) {
                const before = { ...relation.moods };
                track(relTarget(relation), w.toward, name => { const id = relationId(name, playerName()); return id && hold?.r?.has(id) ? null : id; });
                // Older lines named feelings without numbers ("feels: wary, drawn").
                if (w.feels.length) { const fed = fedOf(meta, writer); rec.fed = structuredClone(fed); feedValues(relation.moods, {}, fed.rel, relationsFromBoard({ toward: w.feels.join(', ') }, playerName())); }
                rec.r = diff(before, relation.moods);
            }
            // The board's State words fill in feelings the hidden line didn't name. The line wins for
            // anything it names, and those stop being the board's to fade.
            const board = settings().boardWithWeave ? parseBoard(m.mes) : null;
            if (board?.state) {
                const named = Object.fromEntries(w.moods.map(x => [feelingId(x.name), true]).filter(([id]) => id));
                const fed = fedOf(meta, writer); rec.fed ??= structuredClone(fed);
                const before = { ...st.moods };
                feedValues(st.moods, { ...st.pins, ...named }, fed.moods, feelingsFromBoard(board).filter(x => !named[x.id]));
                Object.assign(rec.m, diff(before, st.moods));
            }
            // Feelings nobody mentioned for a while fade, on the character's pace. Pinned ones and
            // traits never do. Recorded with the reply, so a swipe or Undo puts them back.
            if (st.moodAuto !== false && st.moodFade !== false) {
                for (const id of Object.keys(rec.m)) named.add(id);
                const values = {};
                for (const [id, v] of Object.entries(st.moods)) if (v > 0 && !st.pins?.[id] && analysed(BY_ID[id]) && !hold?.m?.has(id)) values[id] = v;
                rec.q = structuredClone(st.moodQuiet ?? {});
                const keep = heldBy(lastDynamic.get(writer.avatar)), held = new Set(Object.keys(values).filter(id => keep.has(BY_ID[id].category)));
                const { faded, quiet } = fadeStep(values, named, st.moodQuiet ?? {}, scenePace(writer, st), held);
                st.moodQuiet = quiet;
                const target = moodTarget(st);
                for (const [id, v] of Object.entries(faded)) { rec.m[id] = [values[id], v]; target.set(id, v); rec.f = [...(rec.f ?? []), id]; }
            }
            notes.push(...Object.keys(rec.m).filter(id => !rec.f?.includes(id)).map(id => labelOf(st, id)), ...Object.keys(rec.r).map(id => labelOf(st, id)),
                ...Object.entries(w.needs).map(([k, v]) => `${k} ${needWord(v).toLowerCase()}`));
        }
        if (settings().boardMemories) rec.mem = remember(writer, rec.k, w.remember);
    } else {
        // No weave line: the board's State and Toward words nudge feelings instead.
        const board = parseBoard(m.mes);
        if (board && b.feed) {
            const fed = fedOf(meta, writer); rec.fed = structuredClone(fed);
            const before = { ...st.moods };
            feedValues(st.moods, st.pins, fed.moods, feelingsFromBoard(board));
            rec.m = diff(before, st.moods);
            if (board.toward !== undefined) {
                const readings = relationsFromBoard(board, playerName()), relation = userRelation(st, readings.length > 0);
                if (relation) { const was = { ...relation.moods }; feedValues(relation.moods, {}, fed.rel, readings); rec.r = diff(was, relation.moods); }
            }
            notes.push(...Object.keys(rec.m).filter(id => st.moods[id] > 0).slice(0, 4).map(id => labelOf(st, id)));
        }
        if (board && settings().boardMemories && board.remember !== undefined) rec.mem = remember(writer, rec.k, board.remember);
    }
    for (const id of Object.keys(rec.m)) if (st.moods[id] > 0 && Array.isArray(st.loadout) && !st.loadout.includes(id)) st.loadout.push(id);
    if (rec.mem) notes.push('remembered a moment');
    if (Object.keys(rec.m).length || Object.keys(rec.r).length || rec.mem) st.revision = (st.revision || 0) + 1;
    return { rec, notes: [...new Set(notes)] };
}
function undoReply(meta, writer, st, rec) {
    const backM = untrack(moodTarget(st), rec.m);
    if (rec.q) st.moodQuiet = structuredClone(rec.q);
    const relation = userRelation(st), backR = relation ? untrack(relTarget(relation), rec.r) : [];
    const kept = { m: new Set(Object.keys(rec.m ?? {}).filter(id => !backM.includes(id))), r: new Set(Object.keys(rec.r ?? {}).filter(id => !backR.includes(id))) };
    if (rec.fed) (meta.boardFed ??= {})[`char:${writer.avatar}`] = structuredClone(rec.fed);
    if (rec.mem) forget(writer, rec.mem);
    st.revision = (st.revision || 0) + 1;
    return kept;
}
// "w|send time" names one swipe whatever its hidden line says now.
const swipeOf = key => String(key).startsWith('w|') ? key.split('|').slice(0, 2).join('|') : '';
// Brings the chat's own state into line with the chat. Runs after every change to the chat and right
// before every reply is written, so the reply always sees what's actually there.
export function reconcile(type = '') {
    const c = ctx(), ch = target();
    if (run.suspended || !ch || !c.chatId || !getState(ch)) return { changed: false, notes: [] };
    const meta = c.chatMetadata[KEY];
    const chat = effectiveChat(c.chat, type), notes = [];
    let changed = migrateChat(meta, chat);
    const b = cleanBoardMeta(meta.board), found = latestBoard(chat);
    // Corrections from older versions are tied to the newest board now. A correction that a later board
    // has carried on, and whose own board is gone, can't come back, so it's dropped.
    const boardsHere = new Set(chat.slice(-40).map(m => readOf(m).boardKey).filter(Boolean));
    for (const [k, f] of Object.entries(b.fix)) {
        if (f.on === '?') { f.on = found?.key ?? NO_BOARD; f.pos = found?.index ?? chat.length; changed = true; }
        else if (!fixActive(f, found) && (f.on === NO_BOARD || !boardsHere.has(f.on))) { delete b.fix[k]; changed = true; }
    }
    // The newest board moves the cast in and out of the scene, and lets go of cut phrases it no longer says.
    if ((found?.key ?? '') !== b.syncedKey) {
        if (found) {
            const text = `${found.board.state ?? ''} ${found.board.physical ?? ''}`.toLowerCase();
            for (const kind of ['state', 'physical']) b.mute[kind] = b.mute[kind].filter(p => text.includes(p.toLowerCase()));
            const moved = [];
            if (settings().boardPresent && found.board.present !== undefined) for (const person of getCast(ch)) {
                const here = namedIn(found.board.present, person.name);
                if (here !== person.inScene) { person.inScene = here; moved.push(`${person.name} ${here ? 'in' : 'out'}`); }
            }
            if (moved.length) notes.push(`Board: ${moved.join(', ')}.`);
        }
        b.syncedKey = found?.key ?? ''; changed = true;
    }
    meta.board = b;
    // Each character's replies: undo the ones that are gone from the end, then apply any new ones.
    meta.applied ??= {};
    const recent = [];
    for (let i = chat.length - 1; i >= 0 && recent.length < 4; i--) { const m = chat[i]; if (m && !m.is_user && !m.is_system) recent.unshift([i, m]); }
    const moved = [];
    let undone = 0;
    // Only characters who have something to settle: a record, or a reply near the end.
    for (const writer of members().filter(w => meta.applied[`char:${w.avatar}`]?.length || recent.some(([, m]) => writes(w)(m)))) {
        const st = getState(writer); if (!st) continue;
        const wkey = `char:${writer.avatar}`, mine = writes(writer), here = new Set();
        for (const m of chat) if (mine(m)) for (const k of keysOf(m)) here.add(k);
        const held = new Map();
        const settled = settle(meta.applied[wkey], k => here.has(k), rec => { const kept = undoReply(meta, writer, st, rec); if (swipeOf(rec.k)) held.set(swipeOf(rec.k), kept); });
        if (settled.undone || settled.forgot) changed = true;
        undone += settled.undone;
        const list = settled.kept;
        if (!writingNow()) {
            const known = new Set(list.map(r => r.k));
            const newestKnown = Math.max(-1, ...recent.filter(([, m]) => mine(m) && keysOf(m).some(k => known.has(k))).map(([i]) => i));
            const todo = recent.filter(([i, m]) => mine(m) && i > newestKnown && !keysOf(m).some(k => known.has(k)));
            // A character with nothing recorded yet starts from their newest reply only.
            for (const [, m] of list.length ? todo : todo.slice(-1)) {
                const done = applyReply(meta, writer, st, m, b, held.get(swipeOf(readOf(m).wkey))); if (!done) continue;
                list.push(done.rec); moved.push(...done.notes); changed = true;
            }
        }
        meta.applied[wkey] = list.slice(-40);
    }
    if (undone) notes.push(`Took back what ${undone === 1 ? 'the replaced reply' : `${undone} replaced replies`} changed.`);
    if (moved.length) notes.push(`${bondData(ch).on ? 'Weave' : 'Board'}: ${[...new Set(moved)].slice(0, 5).join(', ')}.`);
    if (run.migrationNote) { notes.unshift(run.migrationNote); run.migrationNote = ''; }
    return { changed, notes };
}
// ---- Moving a chat from 1.35 and earlier ----
// Older versions kept what replies did by message number. Once per chat this:
// - records the newest replies as already applied, so nothing is applied twice;
// - keeps the newest reply's exact changes where the old record still matches it, so swiping it undoes it;
// - removes board memories whose reply isn't in the chat any more (left behind by swipes and deletes);
// - drops the stored needs (they're read from the chat now) and the old meter steps (bondData moves those);
// - turns old board pins into one-time corrections on the newest board.

const zip = (before = {}, after = {}) => Object.fromEntries(Object.keys(after).map(id => [id, [before[id] ?? 0, after[id]]]));
function migrateChat(meta, chat) {
    if (meta.ledger === 2) return false;
    meta.applied ??= {};
    let cleaned = 0;
    const oldPins = Object.keys(meta.board?.pins ?? {}).filter(k => String(meta.board.pins[k] ?? '').trim()).length;
    for (const writer of members().filter(w => chat.some(writes(w)))) {
        const st = getState(writer); if (!st) continue;
        const wkey = `char:${writer.avatar}`, mine = writes(writer), bond = bondData(writer), led = meta.weave?.[wkey];
        const recs = [];
        chat.forEach((m, i) => { if (mine(m) && !m.is_system) { const r = readOf(m), k = bond.on && r.wkey ? r.wkey : r.boardKey ? `b|${r.boardKey}` : ''; if (k) recs.push({ k, m: {}, r: {}, fed: null, mem: '', i }); } });
        const seeded = recs.slice(-6), newest = seeded.at(-1), w = newest ? weaveOf(chat[newest.i]) : null;
        if (newest && w && led?.moods?.index === newest.i && led.moods.sig === JSON.stringify(w.moods)) newest.m = zip(led.moods.before, led.moods.after);
        if (newest && w && led?.rel?.index === newest.i && led.rel.sig === JSON.stringify(w.toward)) newest.r = zip(led.rel.before, led.rel.after);
        if (led) { delete led.moods; delete led.rel; }
        // Board memories: keep the ones whose reply is still in the chat and link them to it.
        const pair = getPair(wkey, 'user');
        if (pair?.memories?.length) {
            const said = new Map();
            const norm = raw => isNone(raw) ? '' : String(raw).replace(/^[\[(“"]+|[\])”"]+$/g, '').trim().slice(0, 160).toLowerCase();
            chat.forEach((m, i) => {
                if (!mine(m)) return;
                for (const text of [norm(weaveOf(m)?.remember), norm(parseBoard(m.mes)?.remember)]) if (text) said.set(text, i);
            });
            pair.memories = pair.memories.filter(mem => {
                if (!untouchedMemory(mem)) { delete mem.boardIndex; return true; }
                const at = said.get(mem.text.toLowerCase());
                if (at === undefined) { cleaned++; return false; }
                const rec = seeded.find(r => r.i === at); if (rec && !rec.mem) rec.mem = mem.id;
                mem.src = rec?.k ?? ''; delete mem.boardIndex; return true;
            });
        }
        meta.applied[wkey] = seeded.map(({ i, ...rec }) => rec);
    }
    // Old pins become corrections waiting for the newest board (reconcile ties them to it).
    if (meta.board) meta.board = cleanBoardMeta(meta.board);
    meta.ledger = 2;
    const bits = [cleaned ? `${cleaned} memor${cleaned === 1 ? 'y' : 'ies'} from replies that are gone were removed` : '', oldPins ? `your ${oldPins} board edit${oldPins === 1 ? ' is' : 's are'} now a one-time correction for the next reply` : ''].filter(Boolean);
    run.migrationNote = `Updated this chat for 1.36: swipes and deletes now undo exactly${bits.length ? `; ${bits.join('; ')}` : ''}.`;
    return true;
}
export async function editBond(mutate) {
    const ch = target(), bond = bondData(ch); if (!ch) return;
    mutate(bond, bondList(ch)); ctx().chatMetadata[KEY].bond[`char:${ch.avatar}`] = cleanBond(bond, settings().bondTrack);
    await persist(); await syncPrompt(); render();
}
// Memories the board or hidden line saved (and nobody has edited since) between this character and you.
export const boardMemoryCount = ch => (getPair(`char:${ch?.avatar}`, 'user')?.memories ?? []).filter(untouchedMemory).length;
// People the Present line can point at: tap to open their panel.
export function boardPeople(ch) {
    const list = [{ name: ch.name, attrs: 'data-who="char"' }, { name: playerName(), attrs: 'data-who="user"' },
        ...getCast(ch).map(p => ({ name: p.name, attrs: `data-who="cast" data-cast-id="${esc(p.id)}"`, away: !p.inScene }))];
    return list.map(p => ({ ...p, match: fragment => namedIn(fragment, p.name) }));
}
export const queueBoard = () => { clearTimeout(run.boardTimer); run.boardTimer = setTimeout(() => void boardChanged(), 150); };
