// Sims-style bond meters between a character and the player's character (1.33.0; 1.34.0 adds Trust,
// Power, a named dynamic and sparked turn-ons). The numbers arrive on the reply's hidden weave line
// (weave.js). Each reply's step is stored by message index, so swipes, edits and deletions
// recalculate on their own. No extra request is ever made.
import { parseWeave, hasWeave, stripWeave, traitKey } from './weave.js';
import { TURN_BY_ID } from './turns.js';
export const parseBond = mes => parseWeave(mes);
export const hasBond = hasWeave;
export const stripBond = stripWeave;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const METERS = ['f', 'r', 't', 'p'];

export const FRIEND_LEVELS = [[80, 'Best friends'], [50, 'Good friends'], [20, 'Friends'], [-19, 'Acquaintances'], [-59, 'Disliked'], [-100, 'Enemies']];
export const ROMANCE_LEVELS = [[80, 'Soulmates'], [55, 'In love'], [30, 'Sweethearts'], [10, 'A spark'], [-19, 'No spark'], [-59, 'Turned off'], [-100, 'Repulsed']];
export const TRUST_LEVELS = [[75, 'Trusts completely'], [40, 'Trusts'], [10, 'Cautious'], [-19, 'Unsure'], [-54, 'Wary'], [-100, 'No trust']];
export const levelOf = (levels, v) => levels.find(([min]) => v >= min)?.[1] ?? levels.at(-1)[1];
// Power is a balance, so its words name who holds it.
export const powerWord = (v, n, u) => v >= 60 ? `${n} in control` : v >= 20 ? `${n} leads` : v > -20 ? 'Even' : v > -60 ? `${u} leads` : `${u} in control`;

// The bars combine into one Sims-style status. First match wins, darkest shapes first.
// Each has a short cue so the model plays the shape of the relationship, not just four numbers.
const DYNAMICS = [
    ['Toxic obsession', d => d.r >= 55 && d.t <= -15, (n, u) => `${n} wants ${u} badly and doesn't trust them; love and suspicion in the same breath`],
    ['Possession', d => d.r >= 45 && d.p >= 55, (n, u) => `${n} loves ${u} as something to keep; tenderness and control are the same gesture`],
    ['Worship', d => d.r >= 45 && d.p <= -55, (n, u) => `${n} adores ${u} and lets them hold the leash`],
    ['Hate-love', d => d.r >= 30 && d.f <= -20, (n, u) => `${n} is drawn to ${u} and can't stand them, often in the same moment`],
    ['Devoted', d => d.r >= 55 && d.f >= 45 && d.t >= 35, (n, u) => `${n} loves, likes and trusts ${u}; the bond is steady enough to lean on`],
    ['Captor', d => d.p >= 55 && d.f <= 10 && d.r < 30, (n, u) => `${n} holds power over ${u} without warmth; ${u} is kept, managed and watched`],
    ['Nemesis', d => d.f <= -55 && d.t <= -20, (n, u) => `${n} sees ${u} as an enemy to beat or break`],
    ['Found family', d => d.f >= 50 && d.r < 20 && d.t >= 20, (n, u) => `${n} is loyal and protective toward ${u} without romance; family by choice`],
    ['Falling', d => d.r >= 30, (n, u) => `${n} is falling for ${u} and it shows more than they'd like`],
    ['Uneasy alliance', d => d.f >= 10 && d.t <= -20, (n, u) => `${n} works alongside ${u} without trusting them`],
    ['Friends', d => d.f >= 20, (n, u) => `${n} likes ${u} and is easy around them`],
    ['Power play', d => Math.abs(d.p) >= 45, (n, u) => `control between ${n} and ${u} is the real subject of every exchange`],
    ['Hostile', d => d.f <= -20 || d.r <= -30, (n, u) => `${n} is cold or hostile toward ${u}`],
    ['Strangers', () => true, (n, u) => `${n} hasn't made up their mind about ${u} yet`],
];
export function dynamicOf(d, n = 'they', u = 'them') {
    const [name, , cue] = DYNAMICS.find(([, test]) => test(d));
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
        steps[i] = { f: step(s.f), r: step(s.r), t: step(s.t), p: step(s.p), thinks: (Array.isArray(s.thinks) ? s.thinks : []).map(t => text(t)).filter(Boolean).slice(0, 3),
            sparks: (Array.isArray(s.sparks) ? s.sparks : []).map(x => ({ text: text(x?.text, 60), off: x?.off === true, id: TURN_BY_ID[x?.id] ? x.id : '' })).filter(x => x.text).slice(0, 3) };
    const keep = Object.keys(steps).map(Number).sort((a, c) => c - a).slice(0, 120);
    return {
        on: typeof b.on === 'boolean' ? b.on : on, extra: b.extra !== false,
        base: Object.fromEntries(METERS.map(k => [k, n(b.base?.[k])])),
        pins: Object.fromEntries(METERS.map(k => [k, pin(b.pins?.[k])])),
        steps: Object.fromEntries(keep.map(i => [i, steps[i]])),
        muted: [...new Set((b.muted ?? []).map(t => text(t).toLowerCase()).filter(Boolean))].slice(0, 30),
        own: [...new Set((b.own ?? []).map(t => text(t)).filter(Boolean))].slice(0, 6),
    };
}
// Totals come from the steps of replies that still exist, so swipes, edits and deletions just work.
export function computeBond(bond, chatLength = Infinity, n = 'they', u = 'them') {
    const steps = Object.entries(bond.steps).map(([i, s]) => [Number(i), s]).filter(([i]) => i < chatLength).sort((a, c) => a[0] - c[0]);
    const total = key => bond.pins[key] ?? clamp(bond.base[key] + steps.reduce((sum, [, s]) => sum + (s[key] ?? 0), 0), -100, 100);
    const v = Object.fromEntries(METERS.map(k => [k, total(k)]));
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
    const recent = steps.slice(-5).reverse().map(([i, s]) => ({ index: i, f: s.f, r: s.r, t: s.t ?? 0, p: s.p ?? 0 }));
    return { ...v, thinks, sparks, recent, friend: levelOf(FRIEND_LEVELS, v.f), romance: levelOf(ROMANCE_LEVELS, v.r), trust: levelOf(TRUST_LEVELS, v.t),
        power: powerWord(v.p, n, u), dynamic: dynamicOf(v, n, u) };
}
// Dragging a meter sets where it stands now; later replies move it from there.
export function setMeter(bond, key, value, chatLength = Infinity) {
    if (!METERS.includes(key)) return;
    const v = clamp(Math.round(Number(value) || 0), -100, 100);
    const sum = Object.entries(bond.steps).filter(([i]) => Number(i) < chatLength).reduce((s, [, st]) => s + (st[key] ?? 0), 0);
    bond.base[key] = clamp(v - sum, -300, 300);
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
// One row for the relationships block, under "[character] toward [player]". The request for the
// hidden line itself is built in weave.js, alongside the other things the line carries.
export function bondStanding({ bond, chatLength, n, u }) {
    if (!bond?.on) return '';
    const d = computeBond(bond, chatLength, n, u);
    const bars = [`friendship ${d.f} (${d.friend.toLowerCase()})`, `romance ${d.r} (${d.romance.toLowerCase()})`,
        ...(bond.extra ? [`trust ${d.t} (${d.trust.toLowerCase()})`, `power ${d.p > 0 ? '+' : ''}${d.p} (${d.power === 'Even' ? 'even' : pt(d.power)})`] : [])];
    return `built up over the whole chat, each -100 to 100: ${bars.join(', ')}${bond.extra ? `. Their dynamic: ${d.dynamic.name.toLowerCase()}, ${pt(d.dynamic.cue)}` : ''}${d.thinks.length ? `. Thinks ${pt(u)} is ${d.thinks.map(t => pt(t.text)).join(', ')}` : ''}`;
}
