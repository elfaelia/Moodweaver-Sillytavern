// Reading the chat's replies: the needs board, hidden weave lines, bond meters, and keeping
// everything in line when replies are swiped, edited or deleted.
import { getCast, getKnowledge, getPair, getState, getStoryState, getUserState, members, pairId, persist, playerName, resolveRelationName, target } from './chat.js';
import { lastDynamic, movePace, syncPrompt, syncPromptNow, writingNow } from './note.js';
import { settings } from './settings.js';
import { KEY, ctx, newId, run, ui } from './state.js';
import { knowledgeEntry, listAuto, pruneAuto, trimFeelings } from '../engine/state.js';
import { NO_BOARD, hornyFromBoard, boardKeyOf, cleanBoardMeta, factId, factsIn, feedValues, placesIn, feelingId, feelingsFromBoard, fixActive, hasBoard, isNone, latestBoard, liveBoard, namedIn, needBias, needWord, parseBoard, relationId, relationsFromBoard, replyHours, needsInText, skipIn } from '../engine/board.js';
import { METERS, cleanBond, computeBond, computeDesire, dynamicLean, paceOf, setMeter, sliderAxes, sparkTarget, storedSteps } from '../engine/bond.js';
import { LIGHT_DESIRE } from '../data/catalogue/music.js';
import { sexHappened } from '../engine/scene-words.js';
import { BY_ID, INTIMACY_CATEGORIES, MOODS, OPPOSITE_OF, analysed, sectionOf } from '../data/catalogue.js';
import { clamp, escapeHtml as esc, shortName } from '../engine/util.js';
import { ROLE_HOMES, fill as fillDynamic } from '../engine/dynamics.js';
import { diff, effectiveChat, settle, track, untrack, weaveKey } from '../engine/ledger.js';
import { MORE_METERS, cleanMore, computeMore, saidMeters, setMore } from '../engine/meters.js';
import { meterShadow, withFacts, withNudges } from '../engine/mood-meters.js';
import { OFFER_AFTER, clashOf, tieOffer } from '../engine/links.js';
import { natureOf } from '../engine/nature.js';
import { DRINKS_WINDOW, drinkFact, drinksIn, drugTaken, his } from '../engine/intake.js';
import { placesFrom } from '../engine/inventory.js';
import { FACTS, REPLY_HOURS, factFeelings, factStep, fadeStep, heldBy, paceDelta, snapped } from '../engine/moodpace.js';
import { findOverlaps } from '../engine/overlap.js';
import { render, renderSoon } from '../panel/render.js';
import { guessPronoun, setPronoun } from '../engine/pronouns.js';
import { cleanCombos, cravingsFrom, findCombos } from '../engine/reactive.js';
import { RELATIONSHIP_BY_ID, SHARED_BY_ID, TO_METER, cloneRelationships, meterTies } from '../engine/relationships.js';
import { SKILL_BY_ID, growSkills, ungrowSkills, usedBy } from '../engine/skills.js';
import { TURN_BY_ID, cleanInterests, signsPull, turnSigns } from '../engine/turns.js';
import { hasWeave, parseWeave, powerChange, stripWeave } from '../engine/weave.js';
import { arcNamed, arcState } from '../engine/arcs.js';
import { computeStress } from '../engine/stress.js';
import { computeOpinions } from '../engine/opinions.js';
import { autoWants } from '../engine/auto-wants.js';
import { matchSecret, secretList, secretNudges, secretStates, secretStrain } from '../engine/secrets.js';

// ---- Needs board: read from the latest info board in the chat, plus the player's edits ----
export const boardMeta = () => ctx().chatMetadata?.[KEY]?.board;
export const boardSend = () => Boolean(ctx().chatId) && (boardMeta()?.send ?? settings().boardSend);
// ---- The chat as it stands for the next reply ----
// A swipe that's still being written doesn't count yet: SillyTavern leaves the old swipe's text in the
// chat until the new one starts streaming, and nothing that old swipe did should reach the new one.
export const liveChat = (type = '') => effectiveChat(ctx().chat, type);
// Each message is read once per version of its text.
const MAIN_METERS = new Set(METERS);
// 1.86: with the bond meters on, these feelings toward you are meters (TO_METER), not ties.
const asMeter = (ch, id) => Boolean(TO_METER[id] && bondData(ch)?.on);
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
    return liveBoard(latestBoard(chat), boardMeta(), { char: ch?.name ?? '', user: playerName() }, needSteps(chat), { pins: settings().boardPins, timeline: needTimeline(ch, chat), needs: needOpts(ch) });
}
// Each of the character's replies with a board or reported needs, oldest first, so needs can
// drain with in-world time and come back up after a time jump. Read from the chat every time.
function needTimeline(ch, chat = liveChat()) {
    if (!ch) return [];
    const mine = writes(ch), feed = cleanBoardMeta(boardMeta()).feed && bondData(ch).on, out = [];
    (chat ?? []).forEach((m, i) => {
        if (m?.is_system) return;
        // Your message can skip time too ("a day and a half later"): the reply that follows already starts after it,
        // with only the needs your words say went unmet still low.
        if (m?.is_user) { const skip = skipIn(m.mes); if (skip) out.push({ index: i, board: null, needs: needsInText(m.mes), deltas: {}, skip }); return; }
        if (!mine(m)) return;
        const board = hasBoard(m.mes) ? parseBoard(m.mes) : null, w = feed ? weaveOf(m) : null, skip = skipIn(m.mes);
        // Enjoying themselves fills Fun even when the line didn't score it: a reply that raised a happy or desire
        // feeling (playful, amused, heated, horny\u2026) tops it up a little, so foreplay or a good time isn't "bored" (1.78).
        const deltas = { ...(w?.needDeltas ?? {}) };
        if (w && w.needs?.fun === undefined && deltas.fun === undefined) { const cats = w.moods.filter(x => x.delta > 0).map(x => BY_ID[feelingId(x.name)]?.category);
            if (cats.includes('desire')) deltas.fun = 8; else if (cats.includes('happy')) deltas.fun = 5; }
        // Every reply counts as a step, so a need the story stops mentioning can be seen to off-screen.
        if (board || w || skip) out.push({ index: i, board, needs: w?.needs ?? {}, deltas, skip });
    });
    return out.slice(-40);
}
// Stress and opinions of other people (1.79), read from the hidden lines still in the chat, so a swipe takes its
// share with it. Stress counts feelings about anyone but someone named ("at his wife"); those build opinions.
export function stressNow(ch, chat = liveChat()) {
    const st = getState(ch); if (!st?.enabled || !ch || !bondData(ch).on || settings().stress === false) return null;
    const mine = writes(ch), entries = [], secret = secretSteps(ch, chat), bed = bedroomTraits(st);
    (chat ?? []).forEach((m, i) => { if (!mine(m) || m.is_system) return; const w = weaveOf(m); if (!w) return;
        entries.push({ pos: i, coped: w.coped || '', chose: Boolean(w.chose), sparks: w.coped ? (w.sparked ?? []).map(sp => { const t = sparkTarget(sp.text, st.prefs ?? {}, bed); return t.id ?? t.trait ?? String(sp.text).toLowerCase(); }) : [], stress: (w.stress ?? 0) + (w.stress > 0 ? 0 : secretStrain(secret.filter(x => x.pos === i))), rose: w.moods.map(aimed).filter(x => x.delta > 0 && !x.about).map(x => [feelingId(x.name), x.delta]).filter(([id]) => id),
            needs: w.needs ?? {}, release: Boolean(w.desire?.release) }); });
    return computeStress(entries, st, Number.isFinite(st.stressFrom) ? st.stressFrom : -1);
}
// Secrets and leverage (1.79, engine/secrets.js): each secret's state, from the story's steps in the chat and
// your taps. Steps are read back from the chat, so a swipe takes them with it.
function secretSteps(ch, chat = liveChat()) {
    const st = getState(ch), ust = getUserState(); if (!st?.enabled || !ch || settings().secrets === false) return [];
    const lists = [['n', secretList(st)], ['u', secretList(ust)]]; if (!lists[0][1].length && !lists[1][1].length) return [];
    const mine = writes(ch), out = [];
    (chat ?? []).forEach((m, pos) => { if (!mine(m) || m.is_system) return; const w = weaveOf(m);
        for (const step of w?.secrets ?? []) { const hit = matchSecret(step, lists); if (hit) out.push({ pos, who: hit.who, key: hit.key, state: step.state }); } });
    return out;
}
export function secretsNow(ch, chat = liveChat()) {
    const st = getState(ch), ust = getUserState(); if (!st?.enabled || !ch || settings().secrets === false) return null;
    const steps = secretSteps(ch, chat);
    return { mine: secretStates(secretList(st), steps, st.secretSet, 'n'), yours: secretStates(secretList(ust), steps, ust?.secretSet, 'u'), now: Math.max(0, (chat?.length ?? 1) - 1) };
}
export function opinionsNow(ch, chat = liveChat()) {
    const st = getState(ch); if (!st?.enabled || !ch || !bondData(ch).on || settings().opinions === false) return [];
    const mine = writes(ch), entries = [];
    (chat ?? []).forEach(m => { if (!mine(m) || m.is_system) return; const w = weaveOf(m); if (!w) return;
        entries.push(w.moods.map(aimed).filter(x => x.about && x.delta > 0 && aimedAway(x)).map(x => ({ about: x.about, id: feelingId(x.name), delta: x.delta })).filter(x => x.id)); });
    // Your corrections (2.0.26): a word you set holds until you tap Story decides; Not at all hides them.
    const set = st.opinionSet ?? {}, list = computeOpinions(entries, st), score = { adores: 60, 'fond of': 35, 'warm toward': 15, 'cool toward': -15, resents: -35, hates: -60, 'torn about': 0 };
    const known = new Set(list.map(o => o.key));
    const fixed = list.flatMap(o => !set[o.key] ? [o] : set[o.key] === 'off' ? [] : [{ ...o, word: set[o.key], score: score[set[o.key]] ?? 0, feel: [], yours: true }]);
    // A word you set for someone the story has stopped bringing up stays until you clear it.
    for (const [key, word] of Object.entries(set)) if (!known.has(key) && word !== 'off' && st.opinionNames?.[key]) fixed.push({ key, name: st.opinionNames[key], rel: '', word, score: score[word] ?? 0, warm: 0, cold: 0, feel: [], yours: true });
    return fixed;
}
export const needOpts = ch => ({ bias: ch ? needBias(getState(ch)?.moods) : {}, self: settings().needsSelf, drift: settings().needsDrift, speed: settings().needsSpeed, skips: settings().needsSkips, floor: settings().needsFloor });
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
// Wants from the meters (1.79, engine/auto-wants.js): character only, at most two, gone once the story marks one
// done. bd: the bond already worked out for this reply, when the caller has it.
export function autoWantsNow(ch, chat = liveChat(), bd = null) {
    const st = getState(ch), bond = ch ? bondData(ch) : null; if (!st?.enabled || !bond?.on || settings().autoWants !== true) return { live: [], done: [] };
    const b = bd ?? computeBond(bond, chat.length, shortName(ch.name), shortName(playerName()), bondAxes(ch), bondList(ch, chat));
    const mine = writes(ch), replies = [];
    (chat ?? []).forEach((m, i) => { if (mine(m) && !m.is_system) { const w = weaveOf(m); if (w?.wants?.length) replies.push([i, w]); } });
    return autoWants({ values: { r: b.r, t: b.t, ...(b.more ?? {}) }, u: shortName(playerName()), replies, manual: st.wants ?? [], match: wantMatch, now: Math.max(0, chat.length - 1) });
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
    // 2.0.38: drawn first, then saved; the note rebuilds a moment later (and always fresh before a reply).
    renderSoon(); await persist(); await syncPrompt();
}
// A reply arrived, or one was swiped, edited, continued or deleted. Bring everything into line with
// the chat, save, and redraw.
async function boardChanged() {
    const out = reconcile();
    if (out.changed) { if (out.notes.length) run.status = out.notes.join(' '); await persist(); }
    ui.litSeen = null; // what this reply lit pulses once more
    if (ui.panel?.open) render(true);
    await syncPromptNow();
    // Music listens for the story moving on (app/music.js, wired in index.js).
    run.afterBoard?.();
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
    const moved = moveFeelingsToMeters(ch, bond);
    if (moved.length) run.status = `Now meters on Bonds: ${moved.join(', ')}.`;
    return bond;
}
// 1.86: feelings toward you that are really a meter (TO_METER) move into that meter once: the meter takes the
// feeling's strength when that's further along than where it stands, a side meter that was off comes on, and
// the feeling leaves the list. Several feelings for one meter count as their strongest.
function moveFeelingsToMeters(ch, bond) {
    const st = getState(ch), rel = st ? userRelation(st) : null; if (!bond?.on || !rel?.moods) return [];
    const ids = Object.keys(rel.moods).filter(id => TO_METER[id] && rel.moods[id] > 0); if (!ids.length) return [];
    const list = bondList(ch), cap = paceOf(bond).cap, want = {};
    for (const id of ids) { const [k, sign] = TO_METER[id], v = Math.round(rel.moods[id] * sign); if (Math.abs(v) > Math.abs(want[k] ?? 0)) want[k] = v; }
    const main = computeBond(bond, Infinity, 'n', 'u', null, list, true), more = cleanMore(bond.more);
    const side = computeMore({ ...more, on: MORE_METERS.map(([k]) => k) }, list, cap).values, out = [];
    for (const [k, v] of Object.entries(want)) {
        const cur = MAIN_METERS.has(k) ? main[k] ?? 0 : side[k] ?? 0, further = v > 0 ? v > cur : v < cur;
        if (MAIN_METERS.has(k)) { if (further) setMeter(bond, k, v, list); }
        else { bond.more = cleanMore(bond.more); if (!bond.more.on.includes(k)) bond.more.on.push(k); if (further) setMore(bond, k, v, list, cap); }
        out.push(MAIN_METERS.has(k) ? ({ f: 'Friendship', r: 'Romance', t: 'Trust', p: 'Control', l: 'Pull' })[k] : MORE_METERS.find(m => m[0] === k)[1]);
    }
    for (const id of ids) delete rel.moods[id];
    return [...new Set(out)];
}
// Sets each role's Relationships tag (his side toward you, both ways, a trait or a feeling) to at least 70.
function moveRoles(ch, names) {
    const st = getState(ch), out = [];
    if (!st) return out;
    for (const name of names) {
        const [kind, id] = ROLE_HOMES[name], raise = (moods, label) => { moods[id] = Math.max(moods[id] ?? 0, 70); out.push(`${fillDynamic(name, shortName(ch.name), shortName(playerName()))} \u2192 ${label}`); };
        if (kind === 'rel') { const rel = userRelation(st, true); rel.moods ??= {}; raise(rel.moods, `${RELATIONSHIP_BY_ID[id].label} (${shortName(ch.name)}\u2019s side)`); }
        else if (kind === 'shared') { const pair = getPair(`char:${ch.avatar}`, 'user', true); if (pair) { pair.moods ??= {}; raise(pair.moods, `${SHARED_BY_ID[id].label} (both ways)`); } }
        else { raise(st.moods, `${BY_ID[id].label} (${({ trait: 'Traits', psyche: 'Mind', intimacy: 'Intimacy' })[sectionOf(BY_ID[id])] ?? 'Moods'})`); listAuto(st, id); }
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
// Romance points from what a reply lit: +1 per turn-on (+2 when it's strong), \u22121 per turn-off (\u22122 when strong),
// at most 3 either way. Each phrase is matched once per chat read.
function sparkRomance(prefs) {
    const seen = new Map();
    const one = sp => { const key = `${sp.off ? '-' : '+'}${sp.text}`;
        if (!seen.has(key)) { const v = prefs[sparkTarget(sp.text, prefs).id] ?? 0; seen.set(key, v ? Math.sign(v) * (Math.abs(v) >= 61 ? 2 : 1) : sp.off ? -1 : 0); }
        return seen.get(key); };
    return (sparks = []) => clamp(sparks.reduce((sum, sp) => sum + one(sp), 0), -3, 3);
}
// Whether a reply mentions one of the things someone is into (words of five letters or more, plurals and endings allowed).
function touchesInterest(st, text) {
    const into = cleanInterests(st?.interests).toLowerCase().split(/[^a-z]+/).filter(x => x.length >= 5).map(x => x.slice(0, Math.max(5, x.length - 1))); if (!into.length) return false;
    return stripWeave(String(text ?? '')).toLowerCase().split(/[^a-z]+/).some(x => into.some(stem => x.startsWith(stem)));
}
// Heated right now: a desire feeling at clear or above, or one the latest line names (it may not be saved yet).
// Used to read words like "wet" as arousal rather than water.
// 1.91.3: light wants (checking them out, flirty, coy) never count, and a desire feeling the latest line names only
// counts once it is already at 21 or more (a glance at 15 in a bar argument once read a spilt drink as arousal).
const LIGHT_WANT = new Set(LIGHT_DESIRE);
const DESIRE_IDS = new Set(MOODS.filter(m => m.category === 'desire' && !LIGHT_WANT.has(m.id)).map(m => m.id));
// base: whether a desire feeling is already at clear or above, worked out once by a caller that asks per message (2.0:
// bondList asked it per feeling per message over the whole chat, which made the Bonds tab take seconds on long chats).
const heatedBase = st => { const moods = st?.moods ?? {}; for (const id of DESIRE_IDS) if ((moods[id] ?? 0) >= 41) return true; return false; };
function heated(st, names = [], base = heatedBase(st)) {
    const moods = st?.moods ?? {};
    return base || (names ?? []).some(n => { const id = feelingId(n); return DESIRE_IDS.has(id) && (moods[id] ?? 0) >= 21; });
}
export function bondList(ch, chat = liveChat()) {
    if (!ch) return [];
    const stored = ctx().chatMetadata?.[KEY]?.bond?.[`char:${ch.avatar}`], mine = writes(ch), out = [], nudge = stored?.nudge !== false, scale = paceOf(stored).lean;
    // Read once, not per message (1.96.4): getState rebuilds its catalogue view every call, and this loop runs over the whole chat.
    const hisSt = getState(ch), yourSt = getUserState(), hisBase = heatedBase(hisSt), yourBase = heatedBase(yourSt);
    const prefs = hisSt?.prefs ?? {}, sparkPull = sparkRomance(prefs), yourPrefs = yourSt?.prefs ?? {};
    let youBefore = [];
    const secret = nudge ? secretSteps(ch, chat) : [];
    (chat ?? []).forEach((m, pos) => {
        if (!mine(m)) return;
        const w = weaveOf(m); if (!w) return;
        // A lit turn-on warms the romance a step and a lit turn-off cools it, when the line didn't move it itself.
        const step = { f: w.f, r: w.r || sparkPull(w.sparked), t: w.t, p: w.pRaw ? powerChange(w.pRaw, ch.name, playerName()) : w.p, l: w.lRaw ? powerChange(w.lRaw, ch.name, playerName()) : 0, thinks: w.thinks, sparks: w.sparked, d: w.desire ?? null, m: w.meters ?? null, dy: w.dynamic || '' };
        // 1.86: a "toward" feeling that is really a meter (obsessed, trusts, resents) moves that meter instead, unless
        // the line moved it itself. "off" drops a one-way feeling a good step.
        for (const x of w.toward ?? []) {
            const id = relationId(x.name, playerName()), to = id && TO_METER[id]; if (!to || (x.delta <= -100 && to[1] < 0)) continue;
            const [k, sign] = to, d = x.delta <= -100 ? -15 : Math.max(-25, Math.min(25, Math.round(x.delta * 0.6 * sign))) || sign * Math.sign(x.delta);
            if (MAIN_METERS.has(k)) { if (!step[k]) step[k] = d; } else if (!step.m?.[k]) step.m = { ...(step.m ?? {}), [k]: d };
        }
        // Feelings that rose this reply nudge the matching meters, unless the line moved them itself.
        // Facts that came on this reply (his from the line, yours when the "you" list gains one) nudge meters too.
        const youHot = w.you ? heated(yourSt, w.seems, yourBase) : false, hisHot = w.moods.some(x => x.delta > 0) ? heated(hisSt, w.moods.map(y => y.name), hisBase) : false;
        const you = w.you ? w.you.map(x => factId(x, youHot, true)).filter(Boolean) : youBefore, hisFacts = [...w.moods.filter(x => x.delta > 0).map(x => factId(x.name, hisHot)), ...(w.facts ?? []).filter(x => !x.off).map(x => factId(x.name, false, true))].filter(Boolean);
        const newYou = you.filter(id => !youBefore.includes(id)); youBefore = you;
        // His own lit turn-ons, and yours he saw land, warm his desire a little when the line gave it no step.
        const lit = (w.sparked ?? []).filter(sp => !sp.off).length + (w.noticed ?? []).filter(x => (yourPrefs[sparkTarget(x, yourPrefs).id] ?? 0) > 0).length;
        if (lit && !step.d?.a && !step.d?.release) step.d = { ...(step.d ?? {}), a: Math.min(6, 2 * lit) };
        // A release only counts when the reply agrees it was his: not when the same reply's board still has him
        // hard or aching, and not when the line raised his desire feelings (her climax read as his, 1.78).
        if (step.d?.release) { const b = parseBoard(m.mes), body = String(b?.physical ?? '').toLowerCase(), horny = /\b(hard|aching|throbbing|erection|straining)\b/.test(body) && !/\b(spent|sated|came|finished)\b/.test(body) ? 72 : hornyFromBoard(b), rising = w.moods.some(x => x.delta > 0 && DESIRE_IDS.has(feelingId(x.name)));
            if ((horny !== null && horny >= 61) || rising) step.d = { ...step.d, release: false, a: step.d.a || 4 }; }
        // A secret that moved this reply shifts control and the meters it belongs to, when the line didn't.
        const sn = secretNudges(secret.filter(x => x.pos === pos));
        if (sn.p && !step.p) step.p = Math.round(sn.p * scale) || Math.sign(sn.p);
        if (Object.keys(sn.m).length) step.m = { ...Object.fromEntries(Object.entries(sn.m).map(([k, v]) => [k, Math.max(1, Math.round(v * scale))])), ...(step.m ?? {}) };
        out.push({ pos, key: readOf(m).wkey, s: nudge ? withFacts(withNudges(step, w.moods.filter(x => x.delta > 0 && !aimedAway(x)).map(x => feelingId(aimed(x).name)).filter(Boolean), scale), hisFacts, newYou, scale) : step });
    });
    if (out.length) { const traits = bedroomTraits(getState(ch)); for (const x of out.slice(-3)) x.s = { ...x.s, sparks: x.s.sparks.map(sp => ({ ...sp, ...sparkTarget(sp.text, prefs, traits) })) }; }
    return out;
}
// Your persona's own side toward this character (Has them on a string, Captor of\u2026), or {}.
function yourSide(ch) {
    const name = String(ch?.name ?? '').toLowerCase();
    const mine = (getUserState()?.relationships ?? []).find(r => r.target === '{{char}}' || resolveRelationName(r.target).toLowerCase() === name);
    return mine && mine.enabled !== false ? mine.moods ?? {} : {};
}
// What each of you shows of the other's turn-ons and turn-offs (engine/turns.js), read from what's set:
// char: his turn-ons and turn-offs that you show; user: yours that he shows.
export function chatSigns(ch, bond = bondData(ch)) {
    const st = getState(ch), me = getUserState();
    if (!st || !me) return { char: new Map(), user: new Map() };
    const g = pronounsFor(ch, bond), rel = userRelation(st);
    return { char: turnSigns({ state: st }, { state: me, he: g.u, ties: yourSide(ch) }),
        user: turnSigns({ state: me }, { state: st, he: g.n, ties: rel && rel.enabled !== false ? rel.moods ?? {} : {} }) };
}
// Your turn-ons the character has picked up on from the story: the hidden line's "noticed" names them. Once
// makes it a suspicion and twice means he knows (a suspected one becomes known the first time). Read from the
// replies still in the chat, after the point you last set it by hand, so a swipe takes it back. Returns the
// knowledge with those raised (marked learned), for the note and the panel; what you set stays as it was.
export function knowledgeNow(ch, chat = liveChat()) {
    const known = getKnowledge(ch), prefs = getUserState()?.prefs ?? {};
    if (!ch || !bondData(ch).on || !Object.values(prefs).some(Boolean)) return known;
    const mine = writes(ch), counts = new Map();
    (chat ?? []).forEach((m, i) => {
        if (!mine(m) || m.is_system) return;
        for (const text of weaveOf(m)?.noticed ?? []) {
            const id = sparkTarget(text, prefs).id, key = `turn:${id}`;
            if (id && i >= (knowledgeEntry(known[key]).from ?? -1)) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
    });
    if (!counts.size) return known;
    const out = { ...known }, u = shortName(playerName());
    for (const [key, n] of counts) {
        const e = knowledgeEntry(known[key]); if (e.mode === 'known') continue;
        out[key] = { mode: e.mode === 'suspected' || n >= 2 ? 'known' : 'suspected', source: e.source || `picked it up from how ${u} reacts`, learned: true };
    }
    return out;
}
// A new meter starts from the relationship sliders already set toward the player, so an existing
// romance doesn't open at "no spark". Later replies move it from there.
// The same reading of the sliders seeds new meters and shapes the named dynamic (bond.js). His turn-ons
// that you show warm the romance a little, his turn-offs cool it, and their opposite helps.
export function bondAxes(ch, bond = null) {
    const st = getState(ch), rel = st ? userRelation(st) : null;
    const pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')];
    const his = rel && rel.enabled !== false ? rel.moods ?? {} : {}, shared = pair?.enabled !== false ? pair?.moods ?? {} : {}, yours = yourSide(ch);
    const axes = sliderAxes(his, shared, yours), me = getUserState(), myMoods = me?.enabled ? me.moods ?? {} : {};
    // What's on the cards leans the dynamic toward the kinds that fit it (moods, ties, a clash between their moods).
    // 2.0.20: the moment between them, mood against mood (only his feelings toward you, not ones aimed elsewhere).
    const hisNow = Object.fromEntries(Object.entries(st?.moods ?? {}).filter(([id]) => !st?.about?.[id]));
    const clash = clashOf({ n: hisNow, u: myMoods }, { n: shortName(ch.name), u: shortName(playerName()) }, id => (BY_ID[id]?.label ?? id).split('/')[0].trim().toLowerCase());
    const recent = (ctx().chat ?? []).slice(-4).filter(m => m && !m.is_system).slice(-2).map(m => m.mes ?? '').join(' ');
    // 1.86: feelings that became meters still lift the dynamics that fit them, read from the side meters.
    const b = bond ?? bondData(ch), fromMeters = b?.on ? meterTies({ more: computeMore(b.more, bondList(ch), paceOf(b).cap).values }) : {};
    const lean = dynamicLean([hisNow, myMoods], { ...fromMeters, ...shared, ...his, ...yours }, clash?.group ?? '', stripWeave(recent));
    return { ...axes, r: axes.r + signsPull(chatSigns(ch, bond ?? bondData(ch)).char), lean, slept: sleptTogether({ ...shared, ...his, ...yours }), moment: clash ? { name: clash.name, line: clash.line, group: clash.group } : null, nature: natureNow(ch, st, me), shadow: shadowMeters(b, st, { ...shared, ...his }) };
}
// 2.0.23: how their natures fit, from his traits and yours (core traits count most). Up to three pairings.
const traitsOf = st => Object.fromEntries(Object.entries(st?.moods ?? {}).filter(([id, v]) => v > 0 && BY_ID[id] && sectionOf(BY_ID[id]) === 'trait' && !st?.about?.[id]));
function natureNow(ch, st, me) {
    if (!st || !me?.enabled) return [];
    const word = id => (BY_ID[id]?.label ?? id).split('/')[0].trim().toLowerCase();
    return natureOf(traitsOf(st), traitsOf(me), { n: new Set(st.core ?? []), u: new Set(me.core ?? []) }, { n: shortName(ch.name), u: shortName(playerName()) }, word);
}
// 2.0.19: meters that are switched off still get a rough reading from his feelings and the ties set toward you,
// so a dynamic you turned on that tests them can come up. Only meters something speaks to; the rest stay unread.
function shadowMeters(bond, st, ties) {
    const on = new Set(bond?.on ? cleanMore(bond.more).on : []), delta = meterShadow(st?.moods, st?.about);
    for (const [id, [k, sign]] of Object.entries(TO_METER)) { const v = ties?.[id] ?? 0; if (v > 0) delta[k] = (delta[k] ?? 0) + v * sign * 0.5; }
    const out = {};
    for (const [k, d] of Object.entries(delta)) {
        const def = MORE_METERS.find(m => m[0] === k); if (!def || on.has(k) || !d) continue;
        out[k] = clamp(Math.round(def[3] + d), def[2] ? -100 : 0, 100);
    }
    return out;
}
// 1.96: whether the two have slept together yet, for the dynamics that assume it (NEEDS_SEX): a tie that means it, or
// a message earlier in this chat where sex plainly happened. Checked once per chat length.
const SLEPT_TIES = ['lovers', 'married', 'exes', 'affair', 'secret_relationship', 'friends_with_benefits', 'one_night_stand', 'long_term_partners'];
let sleptMemo = { key: '', yes: false };
function sleptTogether(ties) {
    if (SLEPT_TIES.some(id => (ties?.[id] ?? 0) > 0)) return true;
    const chat = ctx().chat ?? [], key = `${ctx().chatId ?? ''}:${chat.length}`;
    if (sleptMemo.key !== key) sleptMemo = { key, yes: chat.some(m => m && !m.is_system && typeof m.mes === 'string' && sexHappened(m.mes)) };
    return sleptMemo.yes;
}
// Why each mood or fact is where it is, from the replies still in the chat: raised by the story, brought by a
// fact, wearing off, fading. who: 'char' or 'user' (yours only change when a fact runs its course). Anything you
// changed by hand since gets no note. For the faint "why" lines in the panel (Settings \u203a Show why).
export function whyMap(ch, who = 'char') {
    const list = ctx().chatMetadata?.[KEY]?.applied?.[`char:${ch?.avatar}`] ?? [], st = who === 'user' ? getUserState() : getState(ch), out = new Map(), seen = new Set();
    for (let i = list.length - 1; i >= 0; i--) {
        const rec = list[i], ago = list.length - 1 - i, when = ago === 0 ? 'last reply' : `${ago + 1} replies ago`;
        for (const [id, [a, b]] of Object.entries((who === 'user' ? rec.um : rec.m) ?? {})) {
            if (seen.has(id)) continue; seen.add(id);
            if (!(st?.moods?.[id] > 0) || st.moods[id] !== b) continue;
            const fx = who === 'user' ? rec.ufx : rec.fx;
            out.set(id, `${fx?.[id] ?? (rec.f?.includes(id) ? 'fading, not mentioned lately' : b > a ? 'the story raised it' : 'the story eased it')}${st.about?.[id] ? ` (at ${st.about[id]})` : ''}, ${when}`);
        }
    }
    return out;
}
// What's shaping where they stand, for the Bonds card: the ties set between them at clear or above, strongest
// first (n: his side toward you, u: yours toward him, both: both ways), and his turn-ons' pull on romance.
export function bondDrivers(ch) {
    const st = getState(ch), rel = st ? userRelation(st) : null;
    const pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')];
    const from = (moods, side, byId) => Object.entries(moods ?? {}).filter(([id, v]) => v >= 41 && byId[id]).map(([id, value]) => ({ label: byId[id].label.replace(/\s*\{other\}\s*/g, ' ').trim(), side, value }));
    const ties = [...from(rel && rel.enabled !== false ? rel.moods : {}, 'n', RELATIONSHIP_BY_ID), ...from(pair && pair.enabled !== false ? pair.moods : {}, 'both', SHARED_BY_ID), ...from(yourSide(ch), 'u', RELATIONSHIP_BY_ID)]
        .sort((a, b) => b.value - a.value).slice(0, 4);
    return { ties, warm: signsPull(chatSigns(ch).char), offer: offerTie(ch, rel) };
}
// A tie the dynamic implies, once it has held for OFFER_AFTER replies (checked then and halfway). Only offered.
function offerTie(ch, rel) {
    const bond = bondData(ch); if (!bond?.on || !bond.extra || bond.fixed) return null;
    const list = bondList(ch); if (list.length < OFFER_AFTER) return null;
    const n = shortName(ch.name), u = shortName(playerName()), axes = bondAxes(ch, bond);
    const now = computeBond(bond, Infinity, n, u, axes, list), key = now.dynamic.key;
    const held = [OFFER_AFTER, OFFER_AFTER / 2].every(k => computeBond(bond, Infinity, n, u, axes, list.slice(0, -k), true).byMeters.key === key);
    const offer = held ? tieOffer(now, rel && rel.enabled !== false ? rel.moods : {}, bond.offered) : null;
    return offer && !TO_METER[offer.id] ? { ...offer, label: RELATIONSHIP_BY_ID[offer.id].label, dynamic: now.dynamic.name } : null;
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
        : x.kind === 'dynamic' ? `${fillDynamic(x.id, n, u)} (dynamic)` : x.kind === 'rel' ? `${RELATIONSHIP_BY_ID[x.id]?.label ?? x.id} ${u} (${n}\u2019s side)`
        : x.kind === 'shared' ? `${SHARED_BY_ID[x.id]?.label ?? x.id} (both ways)` : `${BY_ID[x.id]?.label ?? x.id} (${x.kind === 'story' ? 'story' : 'moodlet'})`;
    return list.map(o => ({ key: o.key, label: o.label, keep: name(o.keep), both: o.both.map(name), drop: o.drop.filter(x => !feedsMeters(x)).map(name),
        held: o.drop.filter(feedsMeters).map(name), also: o.also.map(name) }));
}
// Sliders and both-ways tags that also move the meters (trusts, obsessed, captor of\u2026). The note can skip them,
// but Tidy leaves them on: turning them off would shift the meters and maybe the dynamic.
export const feedsMeters = x => x.kind === 'rel' ? Object.values(sliderAxes({ [x.id]: 100 })).some(Boolean) : x.kind === 'shared' ? Object.values(sliderAxes({}, { [x.id]: 100 })).some(Boolean) : false;
// A new bond has no pronoun choices yet, so it's seeded with the guessed ones.
const seedBond = ch => Object.fromEntries(Object.entries(bondAxes(ch, cleanBond({}, false))).map(([k, v]) => [k, Math.round(v * 0.8)]));
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
    const text = String(raw).replace(/^[\[(\u201c"]+|[\])\u201d"]+$/g, '').trim().slice(0, 160);
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
// Facts running their course for one person over one reply, and (feel: true) the feelings they bring
// (engine/moodpace.js). Changes st in place. Returns { m: { id: [before, after] }, fx: { id: why }, fc: the
// clock before }, for the reply's record, so a swipe or Undo puts it all back.
function runFacts(st, hours, named, feel = false, hold = null) {
    const fc = structuredClone(st.factClock ?? {}), before = { ...st.moods }, fx = {};
    const step = factStep(st.moods, st.factClock ?? {}, hours, named, st.pins ?? {});
    st.factClock = step.clock;
    const after = new Map(step.ended.map(id => [FACTS[id].then, FACTS[id].label]));
    for (const [id, v] of Object.entries(step.set)) { if (hold?.m?.has(id)) continue; st.moods[id] = v; fx[id] = after.has(id) ? `after ${after.get(id).toLowerCase()}` : v ? 'wearing off' : 'wore off'; }
    if (feel) for (const [id, v, fact] of factFeelings(st.moods, id => !st.pins?.[id] && !hold?.m?.has(id))) { st.moods[id] = v; fx[id] = `from ${FACTS[fact].label.toLowerCase()}`; }
    const m = Object.fromEntries(Object.keys(fx).filter(id => (before[id] ?? 0) !== st.moods[id]).map(id => [id, [before[id] ?? 0, st.moods[id]]]));
    return { m, fx, fc };
}
const mergeMoved = (rec, moved) => { for (const [id, [a, b]] of Object.entries(moved)) rec.m[id] = [rec.m[id]?.[0] ?? a, b]; };
// What the story says is true of someone now: the character's facts from the board's Physical State, yours from
// the hidden line's "you" list (facts) and "seems" list (how you come across). A fact named comes on at STORY_ON
// and runs its course; a feeling named rises to it. When the line gives the whole list (full), the ones it put
// on and has since left off go: a fact comes off, a feeling fades a step each reply. Pinned ones and ones you set
// yourself stay. kind: 'state' for facts, 'mood' for feelings. Returns { id: [before, after] }; fx says why.
const STORY_ON = 50, STORY_FADE = 15, STORY_BUILD = 10, STORY_TOP = 80, YOURS_FADE = 5;
// Which feelings a read feeling pushes down (2.0.12): tears, fear or anger take the shine off happy and calm, and the reverse.
const MOOD_AGAINST = { sad: ['happy', 'calm'], scared: ['happy', 'calm'], angry: ['happy', 'calm'], happy: ['sad', 'scared', 'angry'], calm: ['scared', 'angry'] };
// full 'loose' (the character's board) only takes off facts that don't run a course: those wear off by the clock.
// The story keeps at most FACT_CAP facts on one person at a time; past that the oldest one it put on comes off.
// Who-they-are facts (a job, a past, a status, an accent: not body, bed, substances or places, and not ones that
// run a course) only come off when the line says so, an opposite comes on, or they pass their own cap of 8, so the
// board's Physical State dropping them never does (1.78).
const FACT_CAP = 8;
const lasting = id => { const m = BY_ID[id]; return Boolean(m) && m.kind === 'state' && !m.lasts && !['body', 'bedroom', 'substances', 'setting'].includes(m.category); };
function fromStory(st, named, fx, { kind = 'state', hold = null, full = false } = {}) {
    const moved = {}, set = (id, v, why) => { moved[id] = [st.moods[id] ?? 0, v]; st.moods[id] = v; fx[id] = why; };
    const mine = new Set(st.fromStory ?? []), fact = kind === 'state';
    for (const id of named) {
        const v = st.moods[id] ?? 0;
        // A feeling seen again while already strong builds a little (2.0.12), so crying reply after reply outweighs an old high.
        if (!fact && v >= STORY_ON && v < STORY_TOP && !st.pins?.[id] && !hold?.m?.has(id)) { set(id, Math.min(STORY_TOP, v + STORY_BUILD), 'how the story reads you'); continue; }
        if (st.pins?.[id] || hold?.m?.has(id) || (fact ? v > 0 : v >= STORY_ON)) continue;
        set(id, STORY_ON, fact ? 'the story put it on' : 'how the story reads you'); if (!v) mine.add(id);
        if (fact && settings().factOpposites !== false) for (const o of OPPOSITE_OF[id] ?? []) if ((st.moods[o] ?? 0) > 0 && !st.pins?.[o] && !named.has(o)) { set(o, 0, 'its opposite came on'); mine.delete(o); }
    }
    // Feelings that don't fit how the story reads you now (happy while it reads you crying or scared) drop a step a reply,
    // whoever set them, unless pinned or read again (2.0.12). They used to hold until changed by hand.
    if (!fact) {
        const kinds = new Set([...named].map(id => BY_ID[id]?.category)), against = new Set([...kinds].flatMap(k => MOOD_AGAINST[k] ?? []).filter(k => !kinds.has(k)));
        if (against.size) for (const [id, v] of Object.entries(st.moods)) {
            const m = BY_ID[id];
            if (!(v > 0) || !m || sectionOf(m) !== 'mood' || !against.has(m.category) || named.has(id) || st.pins?.[id] || hold?.m?.has(id)) continue;
            const to = Math.max(0, v - STORY_FADE); set(id, to, 'doesn\u2019t fit how the story reads you now'); if (!to) mine.delete(id);
        }
        // Feelings you set yourself are the story's to move too (2.0.13): while it doesn't read them in you they ease off
        // slowly, a few points a reply. Pinned ones stay; ones the story put on fade faster below.
        if (full) for (const [id, v] of Object.entries(st.moods)) {
            const m = BY_ID[id];
            if (!(v > 0) || !m || sectionOf(m) !== 'mood' || mine.has(id) || named.has(id) || id in moved || st.pins?.[id] || hold?.m?.has(id)) continue;
            set(id, Math.max(0, v - YOURS_FADE), 'easing off, not seen in you lately');
        }
    }
    if (full) for (const id of mine) {
        if ((BY_ID[id]?.kind === 'state') !== fact || named.has(id) || (full === 'loose' && (BY_ID[id]?.lasts || lasting(id)))) continue;
        const v = st.moods[id] ?? 0; if (!v || st.pins?.[id]) { mine.delete(id); continue; }
        const to = fact ? 0 : Math.max(0, v - STORY_FADE);
        set(id, to, to ? 'fading, not seen lately' : 'the story took it off'); if (!to) mine.delete(id);
    }
    if (fact) {
        const on = [...mine].filter(id => BY_ID[id]?.kind === 'state' && (st.moods[id] ?? 0) > 0 && !st.pins?.[id]);
        for (const group of [on.filter(id => !lasting(id)), on.filter(lasting)]) for (const id of group.slice(0, Math.max(0, group.length - FACT_CAP))) { set(id, 0, 'made room for newer facts'); mine.delete(id); }
    }
    st.fromStory = [...mine];
    return moved;
}
// Who a feeling is about, when the hidden line says it's someone other than you ("angry +10 at his wife"), so
// the note can say so and the feeling isn't turned on you. "angry at his wife +10" is split the same way, unless
// the whole phrase is a feeling's own name. A rise with nobody named means it's general again.
// Kissing or making out in a reply: one clear sign plus one more touch word, so a hand at a throat in a fight doesn't count.
const CUT_HOLD = 8; // messages (about four replies)
const KISS = /\b(kiss(?:es|ed|ing)?|making out|made out|moan(?:s|ed|ing)?|grind(?:s|ed|ing)?|straddl\w*|undress\w*)\b/i;
const TOUCH = /\b(lips?|mouth|tongue|throat|neck|collarbone|jaw|thighs?|hips?|breath|skin|chest)\b/gi;
const SEXUAL = /\b(naked|undress\w*|nipples?|thrust\w*|grind\w*|hard against|between (?:her|his|their) (?:legs|thighs)|moan\w*|gasp\w*|arch(?:es|ed|ing) into)\b/gi;
const DENIED = /\b(pull(?:s|ed)? away|pushe[sd]? (?:him|her|them) (?:away|back)|not yet|stops? (?:him|her|them)|stopped|interrupt\w*|knock(?:s|ed|ing) at|ache[sd]? for|frustrat\w*)\b/i;
// Free scene reading for the desire family, when the hidden line named none: kissing warms them, plainly sexual
// touch makes them horny, and being stopped mid-way leaves them frustrated.
export function sceneFeelings(text) {
    const t = String(text ?? '').replace(/<!--[\s\S]*?-->/g, ''), out = [];
    if (!intimate(t)) return out;
    const sexual = new Set((t.match(SEXUAL) ?? []).map(w => w.toLowerCase())).size;
    out.push(sexual >= 2 ? ['horny', 10] : ['heated', 6]);
    if (DENIED.test(t)) out.push(['sexually frustrated', 6]);
    return out;
}
export const intimate = text => { const t = String(text ?? '').replace(/<!--[\s\S]*?-->/g, ''); return KISS.test(t) && new Set((t.match(TOUCH) ?? []).map(w => w.toLowerCase())).size >= 2; };
// A feeling the line aims at someone other than you ("murderous +10 at her father") doesn't nudge the meters toward
// you (2.0.19): plans for her father were raising Urge to hurt toward her.
function aimedAway(x) {
    const about = aimed(x).about; if (!about) return false;
    return ![playerName(), shortName(playerName()), 'you', 'them', 'her', 'him'].some(v => String(v).toLowerCase() === about.toLowerCase());
}
// "angry at his wife +10": the feeling and who it's about. Split first (2.0.26): the loose name match used to read
// the whole phrase as the plain feeling, so a feeling about someone else landed on the player. A name that is a
// feeling's own label as written (one with "at" in it) stays whole.
const EXACT_NAME = new Set(MOODS.flatMap(m => [m.id.replace(/_/g, ' '), ...m.label.toLowerCase().split('/').map(t => t.trim())]));
function aimed(x) {
    if (x.about || EXACT_NAME.has(String(x.name).toLowerCase())) return x;
    // The raw text keeps the name's capital, which tells a person from a thing (opinions.js).
    const m = String(x.raw ?? x.name).match(/^(.+?)\s+(?:at|about|toward|towards|over|of|for|with)\s+(.+)$/i);
    return m && (feelingId(m[1].toLowerCase()) || factId(m[1].toLowerCase())) ? { ...x, name: m[1].toLowerCase(), about: m[2].slice(0, 40) } : x;
}
function aimAt(st, list, rec) {
    // A bare her or him in the hidden line is the player in a two-person scene, never someone else (2.0.27).
    const you = new Set([playerName(), shortName(playerName()), 'you', 'them', 'her', 'him'].map(v => String(v).toLowerCase()));
    for (const x of list) {
        const id = feelingId(x.name); if (!id || !rec.m[id] || x.delta <= 0) continue;
        const about = x.about && !you.has(x.about.toLowerCase()) ? x.about : '';
        if ((st.about?.[id] ?? '') === about) continue;
        (rec.ab ??= {})[id] = st.about?.[id] ?? '';
        st.about ??= {}; if (about) st.about[id] = about; else delete st.about[id];
    }
}
// hold: feelings you moved by hand after an earlier version of this same swipe (before it was continued
// or its hidden line edited). They're yours now, so the new version leaves them alone.
function intakeFacts(writer, st, m) {
    const who = { name: writer?.name ?? '', pronoun: pronounsFor(writer, bondData(writer)).n }, out = [];
    const drug = drugTaken(m.mes, who); if (drug && BY_ID[drug]) out.push(drug);
    const chat = ctx().chat ?? [], at = chat.indexOf(m), mine = writes(writer);
    if (drinksIn(m.mes, who)) {
        let n = 0, seen = 0;
        for (let i = at < 0 ? chat.length - 1 : at; i >= 0 && seen < DRINKS_WINDOW; i--) { const x = chat[i]; if (!x || x.is_system || !mine(x)) continue; seen++; if (drinksIn(x.mes, who)) n++; }
        const id = drinkFact(n); if (id && !((st.moods?.drunk ?? 0) > 0 && id === 'tipsy')) out.push(id);
    }
    return out;
}
// asked: your message this reply answers, when it comes straight before it (so your skills count it once).
function applyReply(meta, writer, st, m, b, hold = null, asked = null, prev = null) {
    const w = bondData(writer).on ? weaveOf(m) : null, boardKey = readOf(m).boardKey;
    const rec = { k: w ? readOf(m).wkey : boardKey ? `b|${boardKey}` : '', m: {}, r: {}, fed: null, mem: '' }, notes = [];
    if (!rec.k) return null;
    if (!st.enabled) return { rec, notes };
    // Where the story moves his things (2.0.30): left in the truck, put in a drawer, grabbed. Places you tapped stay yours.
    const moved = placesFrom(his(m.mes, { name: writer?.name ?? '', pronoun: pronounsFor(writer, bondData(writer)).n }), (st.inventory ?? []).filter(i => !i.where));
    for (const item of st.inventory ?? []) if (moved[item.id]) item.at = moved[item.id];
    // Time this reply covers, and the facts the story names in it, for facts running their course.
    const board = parseBoard(m.mes), hours = replyHours(prev ? parseBoard(prev.mes) : null, board, REPLY_HOURS);
    const hot = heated(st, w?.moods?.map(x => x.name)), factsNamed = new Set([...factsIn(board?.physical, hot), ...factsIn(board?.state, hot)]);
    const facts = feel => {
        if (!b.feed) return;
        // What the board's Physical State and Location name comes on first (the hidden line has had its say by now);
        // ones the story put on and the board has dropped come off, and a place goes when the Location changes.
        const fx = {};
        // The hidden line's own "facts" list (1.78): what it names comes on, and "\u2026 off" takes off one the story put on.
        const told = (w?.facts ?? []).filter(x => !x.off).flatMap(x => [...factsIn(x.name, hot, true)]), ended = (w?.facts ?? []).filter(x => x.off).flatMap(x => [...factsIn(x.name, hot, true)]);
        // What he takes in the narration itself (2.0.29), when the line and the board didn't name it: a drug, and drinks
        // counted over his recent replies.
        const taken = intakeFacts(writer, st, m); for (const id of taken) if (!told.includes(id)) told.push(id);
        for (const id of told) factsNamed.add(id);
        if (st.moodAuto !== false) for (const id of ended) if ((st.moods[id] ?? 0) > 0 && !st.pins?.[id] && (st.fromStory ?? []).includes(id)) { rec.m[id] = [rec.m[id]?.[0] ?? st.moods[id], 0]; st.moods[id] = 0; fx[id] = 'the story took it off'; st.fromStory = st.fromStory.filter(x => x !== id); }
        if (st.moodAuto !== false) { const was = structuredClone(st.fromStory ?? []); mergeMoved(rec, fromStory(st, new Set([...told, ...factsIn(board?.physical, hot), ...(board?.location ? placesIn(board.location, board.time) : (st.fromStory ?? []).filter(id => BY_ID[id]?.category === 'setting'))]), fx, { hold, full: board?.physical || board?.location ? 'loose' : false })); if (JSON.stringify(was) !== JSON.stringify(st.fromStory)) rec.sf = was; }
        const r = runFacts(st, hours, factsNamed, feel, hold); mergeMoved(rec, r.m); rec.fc = r.fc;
        Object.assign(fx, r.fx); if (Object.keys(fx).length) rec.fx = fx;
    };
    if (w) {
        if (b.feed) {
            // Feelings the story names are matched to the catalogue. "Only my list" keeps the story to the
            // feelings on the character's list.
            const listOnly = st.moodScope === 'list', listed = id => !listOnly || st.loadout?.includes(id) || (st.moods[id] ?? 0) > 0;
            // Body facts that come and go (drunk, bleeding, sore) can be named there too.
            // A feeling you ended by hand stays ended for the next few replies whatever the line says (it's often just
            // copying an older board); after that the story can bring it back, and doing so forgets the cut.
            const at = ctx().chat?.indexOf(m) ?? -1, fresh = id => st.cut?.[id] !== undefined && (at < 0 || at - st.cut[id] < CUT_HOLD);
            const resolve = name => { const fact = factId(name, hot); if (fact) { factsNamed.add(fact); return fact; } const id = feelingId(name); return id && listed(id) && !fresh(id) ? id : null; };
            // The character's own switch, the pace cap, and arousal from the desire card reaching Horny
            // (the desire field used to take it, so Horny never moved while the card was on).
            const pace = movePace(writer), named = new Set();
            const list = st.moodAuto === false ? [] : w.moods.map(x => ({ ...aimed(x), delta: paceDelta(x.delta, pace) }));
            // A snap (2.0.11): when the line breaks a strong hot or hard feeling outright, the one feeling it raised most
            // comes in at up to twice the usual step, taking its place.
            if (list.length && settings().snaps !== false && w.moods.some(x => { const id = feelingId(x.name), v = st.moods[id] ?? 0; return id && !hold?.m?.has(id) && snapped(id, v, x.delta <= -100 ? 0 : Math.max(0, v + x.delta)); })) {
                const top = w.moods.reduce((best, x, i) => x.delta > 0 && x.delta > (w.moods[best]?.delta ?? 0) ? i : best, -1);
                if (top >= 0) list[top].delta = paceDelta(w.moods[top].delta, { ...pace, step: pace.step * 2 });
            }
            if (st.moodAuto !== false && w.desire?.a && !list.some(x => feelingId(x.name) === 'horny')) list.push({ name: 'horny', delta: paceDelta(w.desire.a * 4, pace) });
            // Feelings the line put under "toward" (aroused, obsessed with her, in love) are feelings too, so they reach
            // the Moods tab as well as Bonds. Halved, since toward moves in bigger steps.
            if (st.moodAuto !== false) for (const x of w.toward) {
                const name = x.name.replace(/\s+(?:with|for|about|toward|towards|at|on|by|over)\s+.*$/, ''), id = feelingId(name);
                if (id && !list.some(y => feelingId(y.name) === id)) list.push({ name, delta: paceDelta(x.delta <= -100 ? x.delta : Math.round(x.delta / 2) || Math.sign(x.delta), pace) });
            }
            // A reply that's plainly physical (kissing, mouths on skin) with no desire named still warms them a little.
            if (st.moodAuto !== false && !list.some(x => BY_ID[feelingId(x.name)]?.category === 'desire')) for (const [name, delta] of sceneFeelings(m.mes)) list.push({ name, delta: paceDelta(delta, pace) });
            // The scene touching what they're into (Facts \u203a Into) puts them a little in their element, never past strong.
            if (st.moodAuto !== false && (st.moods.in_their_element ?? 0) < 41 && !list.some(x => feelingId(x.name) === 'in_their_element') && touchesInterest(st, m.mes)) list.push({ name: 'in their element', delta: paceDelta(8, pace) });
            rec.m = track(moodTarget(st), list, (name, delta) => { const id = resolve(name, delta); if (id) named.add(id); return id && hold?.m?.has(id) ? null : id; });
            aimAt(st, list, rec);
            for (const id of Object.keys(rec.m)) if (st.moods[id] > 0 && st.cut?.[id] !== undefined) { (rec.cu ??= {})[id] = st.cut[id]; delete st.cut[id]; }
            let fromBoard = new Set();
            const relation = userRelation(st, Boolean(w.toward.length || w.feels.length));
            if (relation) {
                const before = { ...relation.moods };
                track(relTarget(relation), w.toward, name => { const id = relationId(name, playerName()); return !id || asMeter(writer, id) || hold?.r?.has(id) ? null : id; });
                // Older lines named feelings without numbers ("feels: wary, drawn").
                if (w.feels.length) { const fed = fedOf(meta, writer); rec.fed = structuredClone(fed); feedValues(relation.moods, {}, fed.rel, relationsFromBoard({ toward: w.feels.join(', ') }, playerName()).filter(x => !asMeter(writer, x.id))); }
                rec.r = diff(before, relation.moods);
            }
            // The board's State words fill in feelings the hidden line didn't name. The line wins for
            // anything it names, and those stop being the board's to fade.
            if (settings().boardWithWeave && board?.state) {
                const named = Object.fromEntries(w.moods.map(x => [feelingId(x.name), true]).filter(([id]) => id));
                const fed = fedOf(meta, writer); rec.fed ??= structuredClone(fed);
                const before = { ...st.moods };
                // Only feelings that are off and weren't ended by hand: the board mostly echoes these notes, so letting it
                // hold up a live feeling kept one (giddy) going forever.
                feedValues(st.moods, { ...st.pins, ...named }, fed.moods, feelingsFromBoard(board).filter(x => !named[x.id] && !(before[x.id] > 0) && st.cut?.[x.id] === undefined));
                const boardMoved = diff(before, st.moods); Object.assign(rec.m, boardMoved); fromBoard = new Set(Object.keys(boardMoved));
            }
            facts(st.moodAuto !== false);
            // Feelings nobody mentioned for a while fade, on the character's pace. Pinned ones and
            // traits never do. Recorded with the reply, so a swipe or Undo puts them back.
            if (st.moodAuto !== false && st.moodFade !== false) {
                for (const id of Object.keys(rec.m)) if (!fromBoard.has(id)) named.add(id);
                const values = {};
                for (const [id, v] of Object.entries(st.moods)) if (v > 0 && !st.pins?.[id] && analysed(BY_ID[id]) && !hold?.m?.has(id)) values[id] = v;
                rec.q = structuredClone(st.moodQuiet ?? {});
                const keep = heldBy(lastDynamic.get(writer.avatar)), held = new Set(Object.keys(values).filter(id => keep.has(BY_ID[id].category)));
                const { faded, quiet } = fadeStep(values, named, st.moodQuiet ?? {}, movePace(writer), held);
                st.moodQuiet = quiet;
                const target = moodTarget(st);
                for (const [id, v] of Object.entries(faded)) { rec.m[id] = [values[id], v]; target.set(id, v); rec.f = [...(rec.f ?? []), id]; }
            }
            notes.push(...Object.keys(rec.m).filter(id => !rec.f?.includes(id) && rec.fx?.[id] !== 'wearing off').map(id => labelOf(st, id)), ...Object.keys(rec.r).map(id => labelOf(st, id)),
                ...Object.entries(w.needs).map(([k, v]) => `${k} ${needWord(v).toLowerCase()}`));
        }
        if (settings().boardMemories) rec.mem = remember(writer, rec.k, w.remember);
    } else {
        // No weave line: the board's State and Toward words nudge feelings instead.
        if (board && b.feed) {
            const fed = fedOf(meta, writer); rec.fed = structuredClone(fed);
            const before = { ...st.moods };
            feedValues(st.moods, st.pins, fed.moods, feelingsFromBoard(board).filter(x => st.cut?.[x.id] === undefined));
            rec.m = diff(before, st.moods);
            if (board.toward !== undefined) {
                const readings = relationsFromBoard(board, playerName()).filter(x => !asMeter(writer, x.id)), relation = userRelation(st, readings.length > 0);
                if (relation) { const was = { ...relation.moods }; feedValues(relation.moods, {}, fed.rel, readings); rec.r = diff(was, relation.moods); }
            }
            notes.push(...Object.keys(rec.m).filter(id => st.moods[id] > 0).slice(0, 4).map(id => labelOf(st, id)));
        }
        if (board && settings().boardMemories && board.remember !== undefined) rec.mem = remember(writer, rec.k, board.remember);
        facts(st.moodAuto !== false);
    }
    for (const id of Object.keys(rec.m)) if (st.moods[id] > 0) listAuto(st, id);
    pruneAuto(st);
    for (const [id, [a, z]] of Object.entries(trimFeelings(st))) rec.m[id] = [rec.m[id]?.[0] ?? a, z];
    if (rec.mem) notes.push('remembered a moment');
    // Your facts: what the hidden line's "you" list names comes on (and what it put on and then leaves off comes
    // off), then they run their course on the same clock. The list keeps the ones it names going.
    const me = getUserState();
    if (me?.enabled && b.feed) {
        const meHot = heated(me, w?.seems), listed = new Set((w?.you ?? []).flatMap(x => [...factsIn(x, meHot, true)])), seems = new Set((w?.seems ?? []).map(feelingId).filter(Boolean));
        const ufx = {}, sf = structuredClone(me.fromStory ?? []), fc = structuredClone(me.factClock ?? {});
        const um = { ...(w?.you ? fromStory(me, listed, ufx, { full: true }) : {}), ...(w?.seems ? fromStory(me, seems, ufx, { kind: 'mood', full: true }) : {}) };
        const r = runFacts(me, hours, new Set([...listed, ...factsIn(board?.physical, meHot)]));
        for (const [id, [a, z]] of Object.entries(r.m)) um[id] = [um[id]?.[0] ?? a, z];
        for (const [id, [a, z]] of Object.entries(trimFeelings(me))) um[id] = [um[id]?.[0] ?? a, z];
        Object.assign(ufx, r.fx);
        if (Object.keys(um).length) { rec.um = um; rec.ufx = ufx; me.revision = (me.revision || 0) + 1; notes.push(...Object.keys(um).filter(id => /^(the story|how the story)/.test(ufx[id] ?? '')).map(id => `${playerName()}: ${labelOf(me, id).toLowerCase()}${me.moods[id] ? '' : ' off'}`)); }
        if (rec.um || JSON.stringify(fc) !== JSON.stringify(me.factClock ?? {})) rec.uc = fc;
        if (JSON.stringify(sf) !== JSON.stringify(me.fromStory ?? [])) rec.usf = sf;
    }
    // The cast in the scene (1.87): the hidden line's "cast" list moves one feeling and one fact each, feelings the
    // story gave them fade when it stops naming them, and their facts run their course on the same clock. Anyone
    // out of the scene is left exactly as they are. Recorded per person, so a swipe or Undo puts it all back.
    if (w && b.feed && settings().castAuto !== false) {
        const pace = movePace(writer), said = w.cast ?? [];
        for (const p of getCast(target()).filter(p => p.inScene && p.state?.enabled !== false)) {
            const ps = p.state, line = said.find(c => namedIn(c.name, p.name) || namedIn(p.name, c.name)), r = { m: {}, q: structuredClone(ps.moodQuiet ?? {}), fc: structuredClone(ps.factClock ?? {}), sf: structuredClone(ps.fromStory ?? []) };
            const psHot = heated(ps), named = new Set(), fx = {};
            let feel = null, fact = null;
            for (const x of line?.items ?? []) {
                const fid = factId(x.name, psHot, true);
                if (fid && !fact) fact = { id: fid, off: x.delta !== null && x.delta < 0 };
                else if (!fid && x.delta !== null && !feel) { const id = feelingId(x.name); if (id) feel = { id, delta: x.delta }; }
            }
            if (feel && !ps.pins?.[feel.id]) {
                Object.assign(r.m, track(moodTarget(ps), [{ name: feel.id, delta: feel.delta <= -100 ? -100 : paceDelta(feel.delta, pace) }], id => id));
                named.add(feel.id);
                if ((ps.moods[feel.id] ?? 0) > 0) ps.fromStory = [...new Set([...(ps.fromStory ?? []), feel.id])]; else ps.fromStory = (ps.fromStory ?? []).filter(id => id !== feel.id);
            }
            if (fact?.off) { if ((ps.moods[fact.id] ?? 0) > 0 && !ps.pins?.[fact.id] && (ps.fromStory ?? []).includes(fact.id)) { r.m[fact.id] = [ps.moods[fact.id], 0]; ps.moods[fact.id] = 0; ps.fromStory = ps.fromStory.filter(id => id !== fact.id); } }
            else if (fact) { named.add(fact.id); for (const [id, [a, z]] of Object.entries(fromStory(ps, new Set([fact.id]), fx))) r.m[id] = [r.m[id]?.[0] ?? a, z]; }
            // Facts with a course (drunk, bleeding) wear off for them too, and feelings the story gave them fade.
            for (const [id, [a, z]] of Object.entries(runFacts(ps, hours, named).m)) r.m[id] = [r.m[id]?.[0] ?? a, z];
            const values = Object.fromEntries((ps.fromStory ?? []).filter(id => BY_ID[id]?.kind !== 'state' && (ps.moods[id] ?? 0) > 0 && !ps.pins?.[id]).map(id => [id, ps.moods[id]]));
            const { faded, quiet } = fadeStep(values, named, ps.moodQuiet ?? {}, pace);
            ps.moodQuiet = quiet;
            for (const [id, v] of Object.entries(faded)) { r.m[id] = [r.m[id]?.[0] ?? values[id], v]; ps.moods[id] = v; if (!v) ps.fromStory = ps.fromStory.filter(x => x !== id); }
            const moved = Object.keys(r.m).filter(id => r.m[id][0] !== r.m[id][1]);
            if (!moved.length && JSON.stringify(r.q) === JSON.stringify(ps.moodQuiet) && JSON.stringify(r.fc) === JSON.stringify(ps.factClock ?? {})) continue;
            (rec.cs ??= {})[p.id] = r; ps.revision = (ps.revision || 0) + 1;
            if (feel && r.m[feel.id]) notes.push(`${shortName(p.name)}: ${labelOf(ps, feel.id).toLowerCase()}${ps.moods[feel.id] ? '' : ' off'}`);
            if (fact && r.m[fact.id]) notes.push(`${shortName(p.name)}: ${labelOf(ps, fact.id).toLowerCase()}${ps.moods[fact.id] ? '' : ' off'}`);
        }
    }
    // Skills grow with use: the character's from this reply (and what its hidden line says was used), yours
    // from the message it answers.
    rec.sk = growSkills(st, stripWeave(m.mes), usedBy(w?.used, shortName(writer.name)));
    const you = asked ? getUserState() : null;
    // Yours (2.0.31) also from what the hidden line says you used, by your name: speech it read as a skill counts.
    if (you?.enabled) rec.su = growSkills(you, stripWeave(asked.mes), usedBy(w?.used, shortName(playerName()), true));
    for (const [who, r] of [[shortName(writer.name), rec.sk], [playerName(), rec.su]]) for (const [id, [a, z]] of Object.entries(r?.levels ?? {})) notes.push(`${who}'s ${SKILL_BY_ID[id].label.toLowerCase()} ${z > a ? 'up' : 'down'} to ${z}`);
    if (Object.keys(rec.m).length || Object.keys(rec.r).length || rec.mem) st.revision = (st.revision || 0) + 1;
    return { rec, notes: [...new Set(notes)] };
}
function undoReply(meta, writer, st, rec) {
    const backM = untrack(moodTarget(st), rec.m);
    for (const id of Object.keys(rec.m ?? {})) if (st.moods[id] > 0) listAuto(st, id);
    if (rec.q) st.moodQuiet = structuredClone(rec.q);
    if (rec.fc) st.factClock = structuredClone(rec.fc);
    if (rec.uc || rec.usf) { const me = getUserState(); if (me) { if (rec.um) { untrack(moodTarget(me), rec.um); for (const id of Object.keys(rec.um)) if (me.moods[id] > 0) listAuto(me, id); } if (rec.uc) me.factClock = structuredClone(rec.uc); if (rec.usf) me.fromStory = structuredClone(rec.usf); me.revision = (me.revision || 0) + 1; } }
    if (rec.sf) st.fromStory = structuredClone(rec.sf);
    if (rec.cs) for (const p of getCast(target())) {
        const r = rec.cs[p.id], ps = p.state; if (!r || !ps) continue;
        untrack(moodTarget(ps), r.m); ps.moodQuiet = structuredClone(r.q); ps.factClock = structuredClone(r.fc); ps.fromStory = structuredClone(r.sf); ps.revision = (ps.revision || 0) + 1;
    }
    for (const [id, was] of Object.entries(rec.ab ?? {})) { st.about ??= {}; if (was) st.about[id] = was; else delete st.about[id]; }
    for (const [id, at] of Object.entries(rec.cu ?? {})) (st.cut ??= {})[id] = at;
    const relation = userRelation(st), backR = relation ? untrack(relTarget(relation), rec.r) : [];
    const kept = { m: new Set(Object.keys(rec.m ?? {}).filter(id => !backM.includes(id))), r: new Set(Object.keys(rec.r ?? {}).filter(id => !backR.includes(id))) };
    if (rec.fed) (meta.boardFed ??= {})[`char:${writer.avatar}`] = structuredClone(rec.fed);
    if (rec.mem) forget(writer, rec.mem);
    ungrowSkills(st, rec.sk); if (rec.su) ungrowSkills(getUserState(), rec.su);
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
            for (const [i, m] of list.length ? todo : todo.slice(-1)) {
                const prev = chat.slice(0, i).findLast(x => mine(x) && !x.is_system) ?? null;
                const done = applyReply(meta, writer, st, m, b, held.get(swipeOf(readOf(m).wkey)), chat[i - 1]?.is_user ? chat[i - 1] : null, prev); if (!done) continue;
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
            const norm = raw => isNone(raw) ? '' : String(raw).replace(/^[\[(\u201c"]+|[\])\u201d"]+$/g, '').trim().slice(0, 160).toLowerCase();
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
    renderSoon(); await persist(); await syncPrompt();
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

// Arcs (2.0, engine/arcs.js): the running arc's stage, read back from the hidden lines after it began, and an arc
// the newest reply says the story has begun, offered when none is running.
export function arcNow(ch, chat = liveChat()) {
    const story = getStoryState(ch); if (!story?.arc || !ch) return null;
    const mine = writes(ch), steps = [];
    (chat ?? []).forEach((m, pos) => { if (!mine(m) || m.is_system) return; const w = weaveOf(m); if (w?.arc) steps.push({ pos, arc: w.arc }); });
    return arcState(story.arc, steps);
}
export function arcOffer(ch, chat = liveChat()) {
    const story = getStoryState(ch); if (!story || story.arc || settings().arcOffers === false) return null;
    const last = [...(chat ?? [])].reverse().find(writes(ch)), a = arcNamed(weaveOf(last)?.arc);
    return a && !(story.arcSkip ?? []).includes(a.id) ? a : null;
}
// A landed arc leaves its line behind (at most four kept) and steps aside; a fizzled one just steps aside and isn't
// offered again in this chat. Called before the note is built, so the next reply already knows.
export function settleArc(ch, chat = liveChat()) {
    const now = arcNow(ch, chat); if (!now || !(now.landed || now.fizzled)) return now;
    const story = getStoryState(ch);
    if (now.landed) story.arcMarks = [...(story.arcMarks ?? []), now.def.end].slice(-4);
    else story.arcSkip = [...new Set([...(story.arcSkip ?? []), now.def.id])];
    story.arc = null; persist(story);
    return null;
}
