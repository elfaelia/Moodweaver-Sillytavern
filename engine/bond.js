// Sims-style bond meters between a character and the player's character (1.33.0; 1.34.0 adds Trust,
// Power, a named dynamic and sparked turn-ons). The numbers arrive on the reply's hidden weave line
// (weave.js). 1.36.0: the steps are read straight from the chat every time, one per reply that still
// exists, so swipes, edits and deletions can't leave anything behind. No extra request is ever made.
import { stripWeave, traitKey } from './weave.js';
import { TURN_BY_ID } from './turns.js';
import { RELATIONSHIP_BY_ID } from './relationships.js';
import { cleanMore, computeMore, moreLines, MORE_METERS } from './meters.js';
import { pronounize } from './pronouns.js';
import { DYNAMICS, DYNAMIC_GROUPS } from '../data/catalogue/dynamics.js';
import { matchDynamic, fill } from './dynamics.js';
export const stripBond = stripWeave;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// f friendship, r romance, t trust, p control (who really holds it; + is the character), l pull (who is
// hooked on whom; + means the player is hooked on the character). Control was "power" in 1.34.
export const METERS = ['f', 'r', 't', 'p', 'l'];

const FRIEND_LEVELS = [[80, 'Best friends'], [50, 'Good friends'], [20, 'Friends'], [-19, 'Acquaintances'], [-59, 'Disliked'], [-100, 'Enemies']];
const ROMANCE_LEVELS = [[80, 'Soulmates'], [55, 'In love'], [30, 'Sweethearts'], [10, 'A spark'], [-19, 'No spark'], [-59, 'Turned off'], [-100, 'Repulsed']];
const TRUST_LEVELS = [[75, 'Complete'], [40, 'Trusting'], [10, 'Cautious'], [-19, 'Unsure'], [-54, 'Wary'], [-100, 'None']];
const levelOf = (levels, v) => levels.find(([min]) => v >= min)?.[1] ?? levels.at(-1)[1];
// Control and pull are balances, so their words name who has them.
const controlWord = (v, n, u) => v >= 60 ? `${n} holds it` : v >= 20 ? `${n} has the edge` : v > -20 ? 'Even' : v > -60 ? `${u} has the edge` : `${u} holds it`;
const pullWord = (v, n, u) => v >= 60 ? `${u} is hooked on ${n}` : v >= 20 ? `${u} needs ${n} more` : v > -20 ? 'Even' : v > -60 ? `${n} needs ${u} more` : `${u} has ${n} hooked`;

// Your relationship sliders count as well as the meters, so "intense: obsessed" and a low
// romance meter can't send Claude two different stories. Same four axes, -100..100.
const ROMANCE_OFF = new Set(['not_attracted', 'finds_plain', 'finds_ugly', 'turned_off_by', 'finds_creepy', 'grossed_out']);
const FRIEND_SHARED = ['friends', 'best_friends', 'childhood_friends', 'platonic_soulmates', 'chosen_family', 'ride_or_die'];
const OWN_AXIS = new Set(['trusts', 'distrusts', 'suspicious_of', 'fears']);
const ROMANCE_SHARED = ['dating', 'engaged', 'married', 'soulmates', 'lovers', 'mutual_pining', 'slow_burn'];
// Theirs is the player's own side toward the character (Lamb → Easterman), so a player who has
// the character on a string counts toward Pull, and one who holds the keys counts toward Control.
const CONTROL = [['controls'], ['dominates'], ['captor_of'], ['keeps_them'], ['guardian_of', 0.6], ['doctor_of', 0.5], ['employs_in_house', 0.6], ['lets_them_win', 0.5], ['snaps_back', 0.6], ['deals_to', 0.4]];
const UNDER = [['submits_to'], ['captive_of'], ['in_service_to', 0.6], ['ward_of', 0.6], ['patient_of', 0.5], ['fears', 0.5], ['buys_from', 0.4]];
// Holding someone emotionally, and being held.
const HOLDS = [['on_a_string'], ['upper_hand'], ['rations_affection', 0.8], ['sweet_talks', 0.6], ['plays_helpless', 0.6], ['talks_down', 0.5], ['gets_soft_side', 0.5]];
const HELD = [['idolises'], ['at_their_mercy'], ['indulges', 0.8], ['walks_on_eggshells', 0.8], ['above_spouse', 0.7], ['lets_them_win', 0.5], ['undone_by_tears', 0.8], ['comes_running', 0.8], ['cant_stay_angry', 0.6]];
export function sliderAxes(moods = {}, shared = {}, theirs = {}) {
    const peak = test => Math.max(0, ...Object.entries(moods).filter(([id, v]) => v > 0 && test(RELATIONSHIP_BY_ID[id], id)).map(([, v]) => v));
    const ids = (list, from = moods) => Math.max(0, ...list.map(([id, w = 1]) => Math.round((from?.[id] ?? 0) * w)));
    const both = list => Math.max(0, ...list.map(id => shared[id] ?? 0));
    return {
        // Trust and fear have their own axes, so they don't count as liking or disliking too.
        f: Math.max(peak((t, id) => t?.category === 'Friendship & trust' && id !== 'trusts'), both(FRIEND_SHARED)) - peak((t, id) => t?.category === 'Dislike & hostility' && !OWN_AXIS.has(id)),
        // In dark romance obsession and possession are the romance, so they count toward it.
        r: Math.max(peak((t, id) => t?.category === 'Attraction & romance' && !ROMANCE_OFF.has(id)), both(ROMANCE_SHARED), ids([['obsessed', 0.85], ['possessive', 0.85], ['devoted', 0.85], ['above_spouse', 0.8]])) - peak((t, id) => ROMANCE_OFF.has(id)),
        t: ids([['trusts']]) - ids([['distrusts'], ['suspicious_of']]),
        // Real control: who holds the keys, the money, the freedom. Either side can say so.
        p: Math.max(ids(CONTROL), ids(UNDER, theirs)) - Math.max(ids(UNDER), ids(CONTROL, theirs)),
        // Pull: who is hooked on whom. + means the player is hooked on the character.
        l: Math.max(ids(HOLDS), ids(HELD, theirs)) - Math.max(ids(HELD), ids(HOLDS, theirs)),
    };
}
// Where a slider says more than the meter, it pulls the dynamic toward it.
// A pinned meter is the player's word, so it always wins.
// Unless the last few replies have been pushing that meter the other way: then the story wins over
// a slider set long ago (Easterman bathing Lamb and making the demands can't stay "worship" forever).
const blend = (v, axes, pins = {}, trend = {}) => !axes ? v : Object.fromEntries(METERS.map(k => {
    const against = Math.sign(trend[k] ?? 0) !== 0 && Math.sign(trend[k]) !== Math.sign(axes[k] ?? 0) && Math.abs(trend[k]) >= 6;
    return [k, pins[k] === null && !against && Math.abs(axes[k] ?? 0) > Math.abs(v[k]) ? Math.round(v[k] * 0.25 + axes[k] * 0.75) : v[k]];
}));
// How fast things move in this chat. cap: the biggest step one reply can make. window and lean: how
// many recent replies the named dynamic leans on, and how hard, so a turn in the scene shows up quickly
// without the meters themselves jumping.
export const PACE = {
    slow: { label: 'Slow burn', cap: 5, window: 10, lean: 0.5, hint: 'for scenes that run fifty replies or more' },
    steady: { label: 'Steady', cap: 10, window: 6, lean: 1, hint: 'the default' },
    quick: { label: 'Quick scenes', cap: 20, window: 4, lean: 1.5, hint: 'for scenes of around ten replies' },
    volatile: { label: 'Volatile', cap: 25, window: 3, lean: 2, hint: 'big swings every reply' },
};
export const paceOf = bond => PACE[bond?.pace] ?? PACE.steady;
export { DYNAMIC_GROUPS };
// Every dynamic: [name, test, cue, group, keys, covers].
export const dynamicRows = () => DYNAMICS;
const groupTone = Object.fromEntries(DYNAMIC_GROUPS.map(([id, , , tone]) => [id, tone]));
const asDynamic = (row, n, u) => ({ name: fill(row[0], n, u), key: row[0], cue: pronounize(row[2](n, u), n, u), group: row[3] ?? 'own', tone: groupTone[row[3]] ?? 'rose', covers: row[5] ?? [] });
// A name the story or the reader wrote that isn't in the catalogue still works, in its own words.
const freeDynamic = (text, n, u) => {
    const t = String(text).replace(/\s+/g, ' ').trim().slice(0, 40), name = t.charAt(0).toUpperCase() + t.slice(1);
    return { name, key: name, cue: `${n} and ${u}: ${t.toLowerCase()}. It decides how they act together: who gives way, what gets said and how close they stand`, group: 'own', tone: 'rose', covers: [] };
};
// fixed: a dynamic the player chose; it replaces the automatic reading. pool: names the player picked for
// this pair; the meters try those first.
function dynamicOf(d, n = 'one', u = 'the other', fixed = '', pool = []) {
    const rows = dynamicRows();
    if (fixed) { const row = rows.find(([dn]) => dn === fixed); return row ? asDynamic(row, n, u) : freeDynamic(fixed, n, u); }
    const picked = new Set(pool), ordered = picked.size ? [...rows.filter(r => picked.has(r[0])), ...rows.filter(r => !picked.has(r[0]))] : rows;
    return asDynamic(ordered.find(([, test]) => test && test(d)), n, u);
}
// The story's newest call on the dynamic (a hidden line's "dynamic:"), or the scene reader's if that's newer.
// Read from the replies still in the chat, so a swipe takes its call with it.
function storyCall(bond, all = []) {
    let at = -1, text = '';
    for (let i = all.length - 1; i >= 0; i--) if (all[i].s?.dy) { at = i; text = all[i].s.dy; break; }
    const r = bond?.read;
    if (r?.name) {
        let ri = r.key ? all.findIndex(x => x.key === r.key) : -1;
        if (ri < 0 && r.key) for (let i = all.length - 1; i >= 0; i--) if (all[i].pos <= r.pos) { ri = i; break; }
        if (ri >= at) return { text: r.name, at: ri, by: 'reader', ago: Math.max(0, all.length - 1 - ri) };
    }
    return text ? { text, at, by: 'story', ago: all.length - 1 - at } : null;
}
// What the story said, as a catalogue dynamic. With picks, only those count.
function resolveCall(text, n, u, pool = []) {
    const rows = dynamicRows(), picked = pool.length ? rows.filter(r => pool.includes(r[0])) : rows;
    const row = matchDynamic(text, picked, n, u);
    if (row) return asDynamic(row, n, u);
    return pool.length ? null : freeDynamic(text, n, u);
}

export function cleanBond(raw = {}, on = true) {
    const b = raw && typeof raw === 'object' ? raw : {};
    const n = v => clamp(Math.round(Number(v) || 0), -100, 100);
    const pin = v => v === null || v === undefined || v === '' ? null : n(v);
    const text = (v, max = 40) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
    const step = v => clamp(Math.round(Number(v) || 0), -10, 10);
    const steps = {};
    for (const [i, s] of Object.entries(b.steps ?? {})) if (/^\d+$/.test(i) && s && typeof s === 'object')
        steps[i] = { f: step(s.f), r: step(s.r), t: step(s.t), p: step(s.p), l: step(s.l), thinks: (Array.isArray(s.thinks) ? s.thinks : []).map(t => text(t)).filter(Boolean).slice(0, 3),
            sparks: (Array.isArray(s.sparks) ? s.sparks : []).map(x => ({ text: text(x?.text, 60), off: x?.off === true, id: TURN_BY_ID[x?.id] ? x.id : '', trait: text(x?.trait, 60) })).filter(x => x.text).slice(0, 3) };
    const keep = Object.keys(steps).map(Number).sort((a, c) => c - a).slice(0, 120);
    // A dragged meter is an anchor: "it stood at v just after this reply".
    const anchors = {};
    for (const k of METERS) {
        const a = b.anchors?.[k];
        if (a && typeof a === 'object' && Number.isFinite(Number(a.v))) anchors[k] = { v: n(a.v), key: text(a.key, 120), pos: Math.max(-1, Math.round(Number(a.pos) || 0)) };
    }
    return {
        on: typeof b.on === 'boolean' ? b.on : on, extra: b.extra !== false, fixed: text(b.fixed, 60),
        // Who names the dynamic (story: the reply's hidden line; meters: the numbers), your picks for
        // this pair, how fast things move, and the scene reader's last call.
        // Meters is the default now that feelings feed the meters; Story costs a line of instructions a reply.
        mode: b.mode === 'story' ? 'story' : 'meters', pace: PACE[b.pace] ? b.pace : 'steady', nudge: b.nudge !== false,
        // Pronouns for the lines Claude reads (auto guesses from the card and persona).
        pn: ['he', 'she', 'they'].includes(b.pn) ? b.pn : 'auto', pu: ['he', 'she', 'they'].includes(b.pu) ? b.pu : 'auto',
        pool: [...new Set((Array.isArray(b.pool) ? b.pool : []).map(x => text(x, 60)).filter(Boolean))].slice(0, 240),  // Was 60, which silently dropped picks; now room for every dynamic plus 40 of your own
        read: b.read && typeof b.read === 'object' && text(b.read.name, 60) ? { name: text(b.read.name, 60), why: text(b.read.why, 160), key: text(b.read.key, 120), pos: Math.round(Number(b.read.pos) || -1) } : null,
        v: b.v === 2 ? 2 : 1, anchors,
        base: Object.fromEntries(METERS.map(k => [k, n(b.base?.[k])])),
        pins: Object.fromEntries(METERS.map(k => [k, pin(b.pins?.[k])])),
        steps: b.v === 2 ? {} : Object.fromEntries(keep.map(i => [i, steps[i]])),
        muted: [...new Set((b.muted ?? []).map(t => text(t).toLowerCase()).filter(Boolean))].slice(0, 30),
        own: [...new Set((b.own ?? []).map(t => text(t)).filter(Boolean))].slice(0, 6),
        desire: cleanDesire(b.desire), more: cleanMore(b.more),
    };
}
// Older saves kept steps by message number; they're still readable for the one-time move to 1.36.
export const storedSteps = (bond, chatLength = Infinity) => Object.entries(bond?.steps ?? {}).map(([i, s]) => ({ pos: Number(i), key: `i${i}`, s }))
    .filter(x => x.pos < chatLength).sort((a, c) => a.pos - c.pos);
// Where a meter starts: its anchor if it has one (just after the reply it was set on, or where that
// reply used to be), otherwise its base before the first reply.
function startOf(bond, k, steps) {
    const a = bond.anchors?.[k];
    if (!a) return [bond.base[k] ?? 0, 0];
    let at = a.key ? steps.findIndex(x => x.key === a.key) : -1;
    if (at < 0 && a.key) for (let i = steps.length - 1; i >= 0; i--) if (steps[i].pos < a.pos) { at = i; break; }
    return [a.v, at + 1];
}
// A meter fills and drains like a Sims bar: each reply moves it from where it is, and it can't go
// past the ends, so a long run of good replies doesn't bank hundreds of points against the next fight.
function meterValue(bond, k, steps) {
    if (bond.pins?.[k] !== null && bond.pins?.[k] !== undefined) return bond.pins[k];
    let [v, from] = startOf(bond, k, steps);
    const cap = paceOf(bond).cap;
    for (let i = from; i < steps.length; i++) v = clamp(v + clamp(steps[i].s?.[k] ?? 0, -cap, cap), -100, 100);
    return v;
}
// list: [{ pos, key, s }] oldest first, read from the chat. Without one, older stored steps are used.
export function computeBond(bond, chatLength = Infinity, n = 'one', u = 'the other', axes = null, list = null, raw = false) {
    const all = Array.isArray(list) ? list : storedSteps(bond, chatLength);
    const steps = all.map(x => [x.pos, x.s]);
    const v = Object.fromEntries(METERS.map(k => [k, meterValue(bond, k, all)]));
    // Opinions strengthen when repeated and fade when they stop coming up.
    const seen = new Map();
    for (const [, s] of steps) {
        for (const [k, o] of seen) seen.set(k, { ...o, value: o.value - 8 });
        for (const t of s.thinks) { const k = traitKey(t), old = seen.get(k); if (k) seen.set(k, { text: t, value: old && old.value > 0 ? Math.min(100, old.value + 20) : 55 }); }
    }
    const muted = new Set(bond.muted.map(traitKey)), own = new Set(bond.own.map(traitKey));
    const thinks = [...bond.own.map(t => ({ text: t, value: 70, own: true })),
        ...[...seen.entries()].filter(([k, t]) => t.value > 0 && !muted.has(k) && !own.has(k)).map(([, t]) => t).sort((a, c) => c.value - a.value)].slice(0, 6);
    // Sparked turn-ons from the last three replies; the newest glows brightest.
    const last = steps.length ? steps.at(-1)[0] : -1;
    const sparks = steps.slice(-3).reverse().flatMap(([i, s]) => (s.sparks ?? []).map(x => ({ ...x, fresh: i === last, index: i }))).slice(0, 6);
    const recent = steps.slice(-5).reverse().map(([i, s]) => ({ index: i, f: s.f, r: s.r, t: s.t ?? 0, p: s.p ?? 0, l: s.l ?? 0 }));
    // The upper hand keeps changing hands: control or pull flipped direction twice or more in the last eight replies.
    const flips = key => steps.slice(-8).map(([, s]) => Math.sign(s[key] ?? 0)).filter(Boolean).reduce((n, sign, i, all) => n + (i && sign !== all[i - 1] ? 1 : 0), 0);
    const swing = Math.max(flips('p'), flips('l')) >= 2;
    const pace = paceOf(bond), more = computeMore(bond.more, all, pace.cap).values;
    // The named dynamic leans on the last few replies, so a turn in the scene shows up fast.
    const recentSteps = all.slice(-pace.window), sum = get => recentSteps.reduce((t, x) => t + clamp(get(x.s) ?? 0, -pace.cap, pace.cap), 0);
    const trend = Object.fromEntries(METERS.map(k => [k, sum(s => s?.[k])]));
    const lean = (k, val, lo = -100) => clamp(Math.round(val + clamp(trend[k] * pace.lean, -35, 35)), lo, 100);
    const base = blend(v, axes, bond.pins, trend), eff = Object.fromEntries(METERS.map(k => [k, bond.pins[k] !== null ? base[k] : lean(k, base[k])]));
    const moreEff = Object.fromEntries(Object.entries(more).map(([k, val]) => {
        const def = MORE_METERS.find(m => m[0] === k), t = sum(s => s?.m?.[k]);
        return [k, bond.more?.pins?.[k] !== null && bond.more?.pins?.[k] !== undefined ? val : clamp(Math.round(val + clamp(t * pace.lean, -35, 35)), def?.[2] ? -100 : 0, 100)];
    }));
    const ds = bond.desire?.on ? computeDesire(bond.desire, all).a : undefined;
    const axesNow = { ...eff, ...moreEff, ...(ds !== undefined ? { ds } : {}) };
    const meters = dynamicOf(axesNow, n, u, '', bond.pool);
    const call = bond.mode === 'story' && !bond.fixed ? storyCall(bond, all) : null, called = call ? resolveCall(call.text, n, u, bond.pool) : null;
    // No flicker. A dynamic read from the meters takes over once it has won two replies running; until
    // then the last one holds and the card says what it's moving toward. Volatile switches straight away.
    let shown = meters;
    if (!raw && !bond.fixed && !called && bond.pace !== 'volatile' && all.length >= 2) {
        const before = computeBond(bond, chatLength, n, u, axes, all.slice(0, -1), true).byMeters;
        if (before.key !== meters.key) shown = { ...before, toward: meters.name };
    }
    const dynamic = bond.fixed ? dynamicOf(axesNow, n, u, bond.fixed) : called ?? shown;
    const source = bond.fixed ? 'you' : called ? call.by : 'meters';
    return { ...v, more, thinks, sparks, recent, friend: levelOf(FRIEND_LEVELS, v.f), romance: levelOf(ROMANCE_LEVELS, v.r), trust: levelOf(TRUST_LEVELS, v.t),
        control: controlWord(v.p, n, u), pull: pullWord(v.l, n, u), power: controlWord(v.p, n, u), swing,
        dynamic, auto: meters.name, byMeters: meters, source, call: called ? { ...call, name: called.name } : null, trend };
}
// Dragging a meter sets where it stands now; later replies move it from there. The anchor sits just
// after the newest reply, so swiping that reply keeps your value and the new swipe moves it.
export function setMeter(bond, key, value, list = []) {
    if (!METERS.includes(key)) return;
    const v = clamp(Math.round(Number(value) || 0), -100, 100), last = Array.isArray(list) ? list[list.length - 1] : null;
    (bond.anchors ??= {})[key] = { v, key: last?.key ?? '', pos: last?.pos ?? -1 };
    if (bond.pins[key] !== null) bond.pins[key] = v;
}
// A sparked phrase matched to one of the character's own turn-ons, if it names one.
// The turn-on's own name wins outright, then its extra words (kinks: "choked" finds Choking).
const sparkWords = text => String(text).toLowerCase().replace(/[^a-z' -]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !['the', 'and', 'her', 'his', 'their', 'with', 'being', 'someone'].includes(w));
const stem = w => w.replace(/(ing|ed|es|s)$/, '');
function bestMatch(text, items) {
    const raw = String(text).toLowerCase().trim(), words = sparkWords(text);
    // Whole words only, and the longest name wins, so "lipstick marks" isn't read as "lips".
    const whole = n => raw === n || (n.length > 3 && new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`).test(raw));
    const exact = items.map(x => [x.id, Math.max(0, ...x.names.filter(n => n && whole(n)).map(n => n.length))]).filter(([, len]) => len > 0).sort((a, b) => b[1] - a[1])[0];
    if (exact) return exact[0];
    const score = x => words.filter(w => x.keys.some(k => k === w || (w.length > 4 && stem(k) === stem(w)))).length;
    const best = items.map(x => [x.id, score(x)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1])[0];
    return best?.[0] ?? '';
}
const turnItem = id => { const t = TURN_BY_ID[id]; const names = [t.noun, t.label, t.prompt].map(x => String(x).toLowerCase().replace(/\s*\(.*?\)\s*/g, ' ').trim());
    return { id, names, keys: [...new Set(`${names.join(' ')} ${t.keys ?? ''}`.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 2))] }; };
function turnIdFor(text, prefs = {}) {
    return bestMatch(text, Object.keys(prefs).filter(id => prefs[id] && TURN_BY_ID[id]).map(turnItem));
}
// A sparked phrase matched to a turn-on first, then to one of their active bedroom traits (roles and
// psychosexual entries: traits = [{ id, label }]). Returns { id } for a turn-on or { trait } for a trait.
export function sparkTarget(text, prefs = {}, traits = []) {
    const id = turnIdFor(text, prefs);
    if (id) return { id, trait: '' };
    const items = traits.map(t => { const n = String(t.label).toLowerCase().replace(/\s*\(.*?\)\s*/g, ' ').trim(); return { id: t.id, names: [n], keys: n.split(/[\s/-]+/).filter(w => w.length > 3) }; });
    return { id: '', trait: bestMatch(text, items) };
}

const pt = v => String(v ?? '').replace(/</g, '‹').replace(/>/g, '›');
// Rows for the relationships block, under "[character] toward [player]". Words only: a number tells the
// model less than "wary" does. The request for the hidden line is built in weave.js.
export function bondStanding({ bond, chatLength, n, u, axes = null, list = null }) {
    if (!bond?.on) return [];
    const d = computeBond(bond, chatLength, n, u, axes, list), low = s => s.toLowerCase(), word = w => w === 'Even' ? 'even' : pt(w);
    return [
        `where it stands now: friendship: ${low(d.friend)}; romance: ${low(d.romance)}${bond.extra ? `; trust: ${low(d.trust)}; control: ${word(d.control)}; pull: ${word(d.pull)}` : ''}`,
        ...(bond.extra ? [`their dynamic, ${low(d.dynamic.name)}: ${pt(d.dynamic.cue)}${d.swing ? `. Lately the upper hand keeps changing hands, so either of them can take it in a scene` : ''}`] : []),
        ...(d.thinks.length ? [`${pt(n)} thinks ${pt(u)} is: ${d.thinks.map(t => pt(t.text)).join(', ')}`] : []),
        ...moreLines(bond.more, list ?? [], pt(n), pt(u), paceOf(bond).cap),
        ...desireLines(bond, list ?? [], pt(n), pt(u)),
    ];
}

// ---- The desire meter (1.39.1; scales added in 1.39.2) ----
// Arousal toward the player right now, plus scales for how it shows: boldness, tender ↔ rough, fixation on
// them, shame, and holding back. Frustration builds without release. Read from the hidden line reply by
// reply like the other meters, so swipes undo it. Pace caps how fast arousal climbs; a cap stops it at a stage.
const DESIRE_PACE = { slow: 5, normal: 10, fast: 20 };
export const DESIRE_CAPS = [[100, 'No limit'], [94, 'Desperate'], [80, 'Aching'], [60, 'Warm'], [40, 'Interested']];
const DESIRE_STAGES = [[95, 'Past thinking'], [81, 'Desperate'], [61, 'Aching'], [41, 'Warm'], [26, 'Interested'], [11, 'Noticing'], [0, 'Not in the mood']];
// key, label, starting value, words by strength.
export const DESIRE_SCALES = [
    ['b', 'Boldness', 50, [[81, 'predatory'], [61, 'forward'], [41, 'open about it'], [21, 'coy'], [0, 'shy']]],
    ['t', 'Tender ↔ rough', 45, [[81, 'cruel'], [61, 'rough'], [41, 'eager'], [21, 'sweet'], [0, 'tender']]],
    ['x', 'Fixation', 50, [[81, 'only them'], [61, 'fixed on them'], [41, 'mostly them'], [21, 'drawn to them'], [0, 'anyone would do']]],
    ['h', 'Shame', 0, [[81, 'hates themselves for it'], [61, 'sick with it'], [41, 'ashamed'], [21, 'uneasy about it'], [1, 'a twinge'], [0, 'none']]],
    ['s', 'Holding back', 25, [[81, 'fighting it with everything'], [61, 'holding back hard'], [41, 'holding back some'], [21, 'barely holding back'], [0, 'not holding back']]],
];
const SCALE = Object.fromEntries(DESIRE_SCALES.map(r => [r[0], r]));
const KEYS = ['a', 'f', ...DESIRE_SCALES.map(([k]) => k)];
const START = { a: 0, f: 0, ...Object.fromEntries(DESIRE_SCALES.map(([k, , v]) => [k, v])) };
const desireStage = (a, after = false) => after ? 'Afterglow' : DESIRE_STAGES.find(([min]) => a >= min)[1];
export const scaleWord = (key, v) => SCALE[key][3].find(([min]) => v >= min)[1];
export const frustrationWord = v => v >= 81 ? 'unbearable' : v >= 61 ? 'high' : v >= 31 ? 'building' : v >= 1 ? 'low' : 'none';
export function cleanDesire(raw) {
    const x = raw && typeof raw === 'object' ? raw : {};
    const n = (v, d) => Number.isFinite(Number(v)) && v !== null && v !== '' ? clamp(Math.round(Number(v)), 0, 100) : d;
    const pin = v => v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : n(v, 0);
    const anchor = x.anchor && typeof x.anchor === 'object' ? { ...Object.fromEntries(KEYS.map(k => [k, n(x.anchor[k], START[k])])),
        key: String(x.anchor.key ?? '').slice(0, 120), pos: Number.isFinite(Number(x.anchor.pos)) ? Math.round(Number(x.anchor.pos)) : -1 } : null;
    return { on: x.on === true, pace: DESIRE_PACE[x.pace] ? x.pace : 'slow', cap: DESIRE_CAPS.some(([c]) => c === Number(x.cap)) ? Number(x.cap) : 100,
        anchor, pins: Object.fromEntries(KEYS.map(k => [k, pin(x.pins?.[k])])), scales: Object.fromEntries(DESIRE_SCALES.map(([k]) => [k, x.scales?.[k] !== false])) };
}
// list: [{ pos, key, s: { d: { a, s, b, t, x, h, release } | null } }] oldest first.
export function computeDesire(desire, list = []) {
    const d = cleanDesire(desire), up = DESIRE_PACE[d.pace], side = Math.max(up, 10), v = { ...START };
    let after = 0, start = 0;
    if (d.anchor) {
        let at = d.anchor.key ? list.findIndex(x => x.key === d.anchor.key) : -1;
        if (at < 0 && d.anchor.key) for (let i = list.length - 1; i >= 0; i--) if (list[i].pos <= d.anchor.pos) { at = i; break; }
        for (const k of KEYS) v[k] = d.anchor[k]; start = at + 1;
    }
    for (let i = start; i < list.length; i++) {
        const x = list[i].s?.d;
        if (x?.release) { v.a = 15; v.f = 0; after = 2; } else after = Math.max(0, after - 1);
        if (x?.a) v.a = clamp(v.a + clamp(x.a, -40, up), 0, d.cap);
        else if (!x && v.a > 20) v.a -= 2;
        for (const [k] of DESIRE_SCALES) if (x?.[k] && d.scales[k]) v[k] = clamp(v[k] + clamp(x[k], -side, side), 0, 100);
        if (!x?.release) v.f = clamp(v.f + (v.a >= 41 ? Math.ceil((v.a - 35) / 8) : -3), 0, 100);
    }
    for (const k of KEYS) if (d.pins[k] !== null) v[k] = d.pins[k];
    v.a = Math.min(v.a, d.cap);
    const glow = after > 0 && d.pins.a === null;
    return { ...v, after: glow, stage: desireStage(v.a, glow), cap: d.cap, pace: d.pace, pins: d.pins, scales: d.scales };
}
// Dragging a bar sets them all where they stand now; later replies move them from there.
export function setDesire(bond, key, value, list = []) {
    const d = bond.desire = cleanDesire(bond.desire), now = computeDesire(d, list), last = list[list.length - 1];
    if (!KEYS.includes(key)) return;
    const val = clamp(Math.round(Number(value) || 0), 0, 100);
    d.anchor = { ...Object.fromEntries(KEYS.map(k => [k, now[k]])), [key]: val, key: last?.key ?? '', pos: last?.pos ?? -1 };
    if (d.pins[key] !== null) d.pins[key] = val;
}
const BOLD_HOW = { shy: (n, u) => `${n} wants ${u} but can't make the move: blushes, fumbles, waits to be led`, coy: (n, u) => `${n} hints with glances and half-touches and waits for ${u} to notice`,
    'open about it': n => `${n} lets it show and takes openings`, forward: n => `${n} makes the move and says what they want`, predatory: n => `${n} doesn't wait for an opening but makes one: corners, closes in, takes` };
const TOUCH_HOW = { tender: 'Touches are slow and gentle.', sweet: 'Warm and affectionate about it.', eager: '', rough: 'Grabby and hard: grips, pins, bites.', cruel: 'Wants it to hurt: cruel words, pain and marks.' };
// The rows Claude reads under "[character] toward [player]". Only scales that say something get a word.
function desireLines(bond, list, n, u) {
    if (!bond?.desire?.on) return [];
    const x = computeDesire(bond.desire, list), on = k => x.scales[k], live = x.a > 10 && !x.after;
    const cap = DESIRE_CAPS.find(([c]) => c === x.cap)?.[1];
    const tags = [x.stage.toLowerCase()];
    if (on('b') && live) tags.push(scaleWord('b', x.b));
    if (on('t') && live && (x.t <= 40 || x.t >= 61)) tags.push(scaleWord('t', x.t));
    if (on('x') && live && (x.x <= 20 || x.x >= 61)) tags.push(scaleWord('x', x.x).replace('them', u));
    if (on('h') && x.h >= 21) tags.push(scaleWord('h', x.h));
    if (on('s') && x.s >= 41 && live) tags.push(scaleWord('s', x.s));
    if (x.f >= 31) tags.push(`frustration ${frustrationWord(x.f)}`);
    const how = x.after ? `just after release: spent, loose and slow${on('h') && x.h >= 41 ? ', until the shame comes in' : ''}`
        : x.a <= 10 ? `desire isn't part of this moment; don't add it`
        : x.a <= 40 ? `a flicker: ${n} notices ${u}'s body in passing${on('b') && x.b <= 20 ? ' and hides it' : on('b') && x.b >= 61 ? ' and lets it show' : ''}`
        : on('s') && x.s >= 61 ? `${n} wants ${u} and is fighting it: it leaks into looks, standing too close and touches pulled back`
        : on('b') ? BOLD_HOW[scaleWord('b', x.b)](n, u) : `it shows in looks, closeness and loaded words, and ${n} takes openings`;
    const extra = [
        on('t') && live && x.a > 40 ? TOUCH_HOW[scaleWord('t', x.t)] : '',
        on('x') && live ? (x.x <= 20 ? `It isn't about ${u} in particular.` : x.x >= 81 ? `Only ${u} will do; anyone else is invisible.` : x.x >= 61 ? `It's all aimed at ${u}.` : '') : '',
        on('h') && live && x.h >= 41 ? (x.h >= 61 ? `${n} hates wanting it, and it comes out as anger, coldness or self-punishment.` : `${n} is ashamed of wanting it.`) : '',
        x.f >= 61 && !x.after ? `Pent-up frustration sharpens ${n}'s temper and makes small touches land hard.` : '',
        x.pace === 'slow' ? 'It builds slowly in this chat: a small step a reply at most.' : x.pace === 'fast' ? 'It can build fast.' : '',
        x.cap < 100 ? `For now it tops out at ${cap.toLowerCase()}; don't take it past that.` : '',
    ].filter(Boolean);
    return [`desire for ${u}: ${tags.join('; ')}. ${how[0].toUpperCase()}${how.slice(1)}.${extra.map(e => ` ${e}`).join('')}`];
}
