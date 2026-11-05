// Sims-style bond meters between a character and the player's character (1.33.0; 1.34.0 adds Trust,
// Power, a named dynamic and sparked turn-ons). The numbers arrive on the reply's hidden weave line
// (weave.js). 1.36.0: the steps are read straight from the chat every time, one per reply that still
// exists, so swipes, edits and deletions can't leave anything behind. No extra request is ever made.
import { parseWeave, hasWeave, stripWeave, traitKey } from './weave.js';
import { TURN_BY_ID } from './turns.js';
import { RELATIONSHIP_BY_ID } from './relationships.js';
export const parseBond = mes => parseWeave(mes);
export const hasBond = hasWeave;
export const stripBond = stripWeave;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// f friendship, r romance, t trust, p control (who really holds it; + is the character), l pull (who is
// hooked on whom; + means the player is hooked on the character). Control was "power" in 1.34.
export const METERS = ['f', 'r', 't', 'p', 'l'];

export const FRIEND_LEVELS = [[80, 'Best friends'], [50, 'Good friends'], [20, 'Friends'], [-19, 'Acquaintances'], [-59, 'Disliked'], [-100, 'Enemies']];
export const ROMANCE_LEVELS = [[80, 'Soulmates'], [55, 'In love'], [30, 'Sweethearts'], [10, 'A spark'], [-19, 'No spark'], [-59, 'Turned off'], [-100, 'Repulsed']];
export const TRUST_LEVELS = [[75, 'Complete'], [40, 'Trusting'], [10, 'Cautious'], [-19, 'Unsure'], [-54, 'Wary'], [-100, 'None']];
export const levelOf = (levels, v) => levels.find(([min]) => v >= min)?.[1] ?? levels.at(-1)[1];
// Control and pull are balances, so their words name who has them.
export const controlWord = (v, n, u) => v >= 60 ? `${n} holds it` : v >= 20 ? `${n} has the edge` : v > -20 ? 'Even' : v > -60 ? `${u} has the edge` : `${u} holds it`;
export const pullWord = (v, n, u) => v >= 60 ? `${u} is hooked on ${n}` : v >= 20 ? `${u} needs ${n} more` : v > -20 ? 'Even' : v > -60 ? `${n} needs ${u} more` : `${u} has ${n} hooked`;
export const powerWord = controlWord;

// 1.34.1: your relationship sliders count as well as the meters, so "intense: obsessed" and a low
// romance meter can't send Claude two different stories. Same four axes, -100..100.
const ROMANCE_OFF = new Set(['not_attracted', 'finds_plain', 'finds_ugly', 'turned_off_by', 'finds_creepy', 'grossed_out']);
const FRIEND_SHARED = ['friends', 'best_friends', 'childhood_friends', 'platonic_soulmates', 'chosen_family', 'ride_or_die'];
const OWN_AXIS = new Set(['trusts', 'distrusts', 'suspicious_of', 'fears']);
const ROMANCE_SHARED = ['dating', 'engaged', 'married', 'soulmates', 'lovers', 'mutual_pining', 'slow_burn'];
// 1.37.0: theirs is the player's own side toward the character (Lamb → Easterman), so a player who has
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
const blend = (v, axes, pins = {}) => !axes ? v : Object.fromEntries(METERS.map(k => [k, pins[k] === null && Math.abs(axes[k] ?? 0) > Math.abs(v[k]) ? Math.round(v[k] * 0.25 + axes[k] * 0.75) : v[k]]));

// The four axes combine into one Sims-style status. First match wins, darkest shapes first. Each cue
// says what the dynamic looks like on the page, because Opus 5.5 carries feeling best through small,
// ordinary actions. Names, not pronouns, so nobody is misgendered or confused with anyone else.
const DYNAMICS = [
    ['Gilded cage', d => d.r >= 40 && d.p >= 35 && d.l <= -30, (n, u) => `${n} holds every key to ${u}'s world and still acts like ${u}'s servant: gifts, good food and a softness nobody else gets, while the door stays locked. ${u} can win a demand; ${n} still decides what happens`],
    ['Captive’s hold', d => d.p <= -35 && d.l >= 30, (n, u) => `${u} holds the keys, but ${n} has ${u} hooked: ${n} pushes, sulks and demands, and ${u} keeps giving way`],
    ['Toxic obsession', d => d.r >= 55 && d.t <= -15 && d.l <= 0, (n, u) => `${n} keeps ${u} close and keeps testing ${u}'s story; tenderness and suspicion arrive in the same gesture`],
    ['Possession', d => d.r >= 45 && d.p >= 55, (n, u) => `${n} treats ${u} as something to keep: tending, arranging and guarding, care and control in the same hands`],
    ['Worship', d => d.r >= 45 && d.l <= -45, (n, u) => `${n} adores ${u} and gives way: watching for approval, giving in, grateful for scraps`],
    ['Hate-love', d => d.r >= 30 && d.f <= -20, (n, u) => `${n} wants ${u} and can't stand ${u}, often in the same moment: barbs that turn into lingering, closeness that turns into a fight`],
    ['Guarded love', d => d.r >= 40 && d.t < 15 && d.f < 30, (n, u) => `${n} loves ${u} and won't say so or trust it: it comes out sideways, in insults, rescues and staying when ${n} could leave`],
    ['Devoted', d => d.r >= 55 && d.f >= 45 && d.t >= 35, (n, u) => `${n} loves, likes and trusts ${u}: easy touches, private jokes, leaning on ${u} without asking`],
    ['Captor', d => d.p >= 55 && d.f <= 10 && d.r < 30, (n, u) => `${n} holds power over ${u} without warmth: rules, routines and watching, ${u} handled rather than met`],
    ['Nemesis', d => d.f <= -55 && d.t <= -20, (n, u) => `${n} sees ${u} as an enemy to beat or break: every exchange a move, every kindness a tactic`],
    ['Found family', d => d.f >= 50 && d.r < 20 && d.t >= 20, (n, u) => `${n} is loyal and protective toward ${u} with no romance in it: looking out, bickering, showing up`],
    ['Falling', d => d.r >= 30, (n, u) => `${n} is falling for ${u} and it shows more than ${n} would like: noticing too much, standing too close, covering it badly`],
    ['Uneasy alliance', d => d.f >= 10 && d.t <= -20, (n, u) => `${n} works alongside ${u} without trusting ${u}: watching hands, checking work, keeping something back`],
    ['Friends', d => d.f >= 20, (n, u) => `${n} likes ${u} and is easy around ${u}: teasing, sharing, small favours`],
    ['Power play', d => Math.abs(d.p) >= 45 || Math.abs(d.l) >= 45, (n, u) => `control between ${n} and ${u} is the real subject of every exchange: who waits, who gives way, who gets the last word`],
    ['Hostile', d => d.f <= -20 || d.r <= -30, (n, u) => `${n} is cold or hostile toward ${u}: short answers, distance, looking for faults`],
    ['Strangers', () => true, (n, u) => `${n} hasn't settled on what ${u} is yet: watching, testing, filing things away`],
];
export const DYNAMIC_NAMES = DYNAMICS.map(([name]) => name);
// fixed: a dynamic the player chose; it replaces the automatic reading.
export function dynamicOf(d, n = 'one', u = 'the other', fixed = '') {
    const [name, , cue] = DYNAMICS.find(([dn]) => dn === fixed) ?? DYNAMICS.find(([, test]) => test(d));
    return { name, cue: cue(n, u) };
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
            sparks: (Array.isArray(s.sparks) ? s.sparks : []).map(x => ({ text: text(x?.text, 60), off: x?.off === true, id: TURN_BY_ID[x?.id] ? x.id : '' })).filter(x => x.text).slice(0, 3) };
    const keep = Object.keys(steps).map(Number).sort((a, c) => c - a).slice(0, 120);
    // 1.36.0: a dragged meter is an anchor: "it stood at v just after this reply".
    const anchors = {};
    for (const k of METERS) {
        const a = b.anchors?.[k];
        if (a && typeof a === 'object' && Number.isFinite(Number(a.v))) anchors[k] = { v: n(a.v), key: text(a.key, 120), pos: Math.max(-1, Math.round(Number(a.pos) || 0)) };
    }
    return {
        on: typeof b.on === 'boolean' ? b.on : on, extra: b.extra !== false, fixed: DYNAMIC_NAMES.includes(b.fixed) ? b.fixed : '',
        v: b.v === 2 ? 2 : 1, anchors,
        base: Object.fromEntries(METERS.map(k => [k, n(b.base?.[k])])),
        pins: Object.fromEntries(METERS.map(k => [k, pin(b.pins?.[k])])),
        steps: b.v === 2 ? {} : Object.fromEntries(keep.map(i => [i, steps[i]])),
        muted: [...new Set((b.muted ?? []).map(t => text(t).toLowerCase()).filter(Boolean))].slice(0, 30),
        own: [...new Set((b.own ?? []).map(t => text(t)).filter(Boolean))].slice(0, 6),
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
export function meterValue(bond, k, steps) {
    if (bond.pins?.[k] !== null && bond.pins?.[k] !== undefined) return bond.pins[k];
    let [v, from] = startOf(bond, k, steps);
    for (let i = from; i < steps.length; i++) v = clamp(v + (steps[i].s?.[k] ?? 0), -100, 100);
    return v;
}
// list: [{ pos, key, s }] oldest first, read from the chat. Without one, older stored steps are used.
export function computeBond(bond, chatLength = Infinity, n = 'one', u = 'the other', axes = null, list = null) {
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
    return { ...v, thinks, sparks, recent, friend: levelOf(FRIEND_LEVELS, v.f), romance: levelOf(ROMANCE_LEVELS, v.r), trust: levelOf(TRUST_LEVELS, v.t),
        control: controlWord(v.p, n, u), pull: pullWord(v.l, n, u), power: controlWord(v.p, n, u), swing,
        dynamic: dynamicOf(blend(v, axes, bond.pins), n, u, bond.fixed), auto: dynamicOf(blend(v, axes, bond.pins), n, u).name };
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
export function turnIdFor(text, prefs = {}) {
    const words = String(text).toLowerCase().replace(/[^a-z' -]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const set = Object.keys(prefs).filter(id => prefs[id] && TURN_BY_ID[id]);
    const score = id => { const t = TURN_BY_ID[id], keys = `${t.noun} ${t.label} ${t.prompt}`.toLowerCase(); return words.filter(w => keys.includes(w)).length; };
    const best = set.map(id => [id, score(id)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1])[0];
    return best?.[0] ?? '';
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
    ];
}
