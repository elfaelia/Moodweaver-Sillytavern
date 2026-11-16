// Music: song tags, the scene snapshot and the song picker. Plain rules, no SillyTavern and no Spotify here,
// so it runs in Node too. app/music.js feeds it the scene and plays what it picks. Nothing here costs tokens.
import moodSection from '../data/catalogue/mood.js';
import stateSection from '../data/catalogue/state.js';
import { DYNAMIC_GROUPS } from '../data/catalogue/dynamics.js';
import { ENERGY, ENERGY_PUSH, FAMILY_ENERGY, GOOD_ENOUGH, HEAT, LINEUP, MOMENTS, POINTS, SEX_FACTS } from '../data/catalogue/music.js';

// ---- The names the sheet and the panel use ----
const FAMILY_ROWS = moodSection.filter(g => g.kind === 'mood');
export const FAMILIES = FAMILY_ROWS.map(g => ({ id: g.id, label: g.name }));
export const MOOD_LIST = FAMILY_ROWS.flatMap(g => g.rows.map(r => ({ id: r.id, label: r.label, family: g.id })));
const MOOD_FAMILY = Object.fromEntries(MOOD_LIST.map(m => [m.id, m.family]));
export const PLACES = (stateSection.find(g => g.id === 'setting')?.rows ?? []).map(r => ({ id: r.id, label: r.label }));
const PLACE_IDS = new Set(PLACES.map(p => p.id));
export const DYN_GROUPS = DYNAMIC_GROUPS.map(([id, label]) => ({ id, label }));
export { MOMENTS, HEAT, ENERGY };
const DYN_IDS = new Set(DYN_GROUPS.map(g => g.id));

// Names are compared without case, accents, quotes or extra spaces ("Dealer's flat" = "Dealer’s flat").
export const norm = s => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').toLowerCase().replace(/\s+/g, ' ').trim();
const byName = list => { const m = new Map(); for (const x of list) { m.set(norm(x.label), x.id); m.set(norm(x.id), x.id); } return m; };
const NAMES = { f: byName(FAMILIES), m: byName(MOOD_LIST), p: byName(PLACES), mo: byName(MOMENTS), d: byName(DYN_GROUPS), h: byName(HEAT) };
const LABEL = { f: Object.fromEntries(FAMILIES.map(x => [x.id, x.label])), m: Object.fromEntries(MOOD_LIST.map(x => [x.id, x.label])), p: Object.fromEntries(PLACES.map(x => [x.id, x.label])),
    mo: Object.fromEntries(MOMENTS.map(x => [x.id, x.label])), d: Object.fromEntries(DYN_GROUPS.map(x => [x.id, x.label])), h: Object.fromEntries(HEAT.map(x => [x.id, x.label])) };
export const labelOf = (kind, id) => LABEL[kind]?.[id] ?? id;
// A cell can hold several values: "Hunted, Dreading" (Google Sheets' multiple choice joins them the same way).
export const split = cell => String(cell ?? '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);

// ---- Tags ----
// One song's (or one playlist's) tags. Character names are kept as typed (compared without case);
// {{char}} and {{user}} stand for whoever the main character and your persona are in the chat.
// nv (Never during) holds 'f:<family>', 'mo:<moment>' and 'h:<heat>'.
export const emptyTags = () => ({ f: [], m: [], p: [], mo: [], d: [], h: '', e: 0, c: [], th: false, nv: [], fav: false, off: false, note: '' });
const ids = (list, ok) => [...new Set((Array.isArray(list) ? list : []).filter(x => typeof x === 'string' && ok(x)))];
export function cleanTags(t = {}) {
    return {
        f: ids(t.f, x => Boolean(LABEL.f[x])), m: ids(t.m, x => Boolean(MOOD_FAMILY[x])), p: ids(t.p, x => PLACE_IDS.has(x)), mo: ids(t.mo, x => Boolean(LABEL.mo[x])), d: ids(t.d, x => DYN_IDS.has(x)),
        h: LABEL.h[t.h] ? t.h : '', e: [1, 2, 3, 4, 5].includes(Number(t.e)) ? Number(t.e) : 0,
        c: [...new Set((Array.isArray(t.c) ? t.c : []).map(x => String(x).trim()).filter(Boolean).slice(0, 12))],
        th: t.th === true, nv: ids(t.nv, x => /^(f|mo|h):/.test(x)), fav: t.fav === true, off: t.off === true, note: String(t.note ?? '').slice(0, 300),
    };
}
export const hasTags = t => Boolean(t && (t.f?.length || t.m?.length || t.p?.length || t.mo?.length || t.d?.length || t.h || t.e || t.c?.length || t.th || t.nv?.length || t.fav || t.off));
// A song's own tags on top of its playlists': lists add up, a song's own Heat, Energy and Off win.
export function mergeTags(own, ...fromPlaylists) {
    const all = [...fromPlaylists.filter(Boolean), own].filter(Boolean), out = emptyTags();
    for (const t of all) {
        for (const k of ['f', 'm', 'p', 'mo', 'd', 'c', 'nv']) out[k] = [...new Set([...out[k], ...(t[k] ?? [])])];
        if (t.h) out.h = t.h; if (t.e) out.e = t.e; if (t.th) out.th = true; if (t.fav) out.fav = true; if (t.off) out.off = true;
    }
    return out;
}

// ---- The scene snapshot ----
// input: {
//   people: [{ name, role: 'char' | 'user', weight, moods: { id: value } }]  whose moods count (weight 1 or 0.5)
//   who: names and tokens the scene is about, e.g. ['Easterman', '{{char}}']
//   facts: { id: value } for everyone in the scene (places, bedroom facts…)
//   dyn: main dynamic group, under: second dynamic group, meters: { hu, … }, horny: 0-100 or null
//   night: the board says it's late, replies: how many replies the chat has, appear: names that just entered the scene }
export function snapshot(input = {}) {
    const moodVal = {};
    for (const p of input.people ?? []) for (const [id, v] of Object.entries(p.moods ?? {})) {
        if (!MOOD_FAMILY[id] || !(v > 0)) continue;
        moodVal[id] = Math.max(moodVal[id] ?? 0, v * (p.weight ?? 1));
    }
    const top = Object.entries(moodVal).filter(([, v]) => v >= 21).sort((a, b) => b[1] - a[1]);
    const famScore = {};
    for (const [id, v] of top.slice(0, 6)) famScore[MOOD_FAMILY[id]] = (famScore[MOOD_FAMILY[id]] ?? 0) + v;
    const fams = Object.entries(famScore).sort((a, b) => b[1] - a[1]).map(([f]) => f);
    const facts = new Set(Object.entries(input.facts ?? {}).filter(([, v]) => v >= 21).map(([id]) => id));
    const places = new Set([...facts].filter(id => PLACE_IDS.has(id)));
    const night = Boolean(input.night) || facts.has('late_night');
    // Energy: the strongest moods' families, then the places.
    const weighed = top.slice(0, 4);
    let energy = weighed.length ? weighed.reduce((s, [id, v]) => s + (FAMILY_ENERGY[MOOD_FAMILY[id]] ?? 2.5) * v, 0) / weighed.reduce((s, [, v]) => s + v, 0) : 2.5;
    for (const id of places) energy += ENERGY_PUSH[id] ?? 0;
    const desire = Math.max(0, ...top.filter(([id]) => MOOD_FAMILY[id] === 'desire').map(([, v]) => v));
    const horny = Number.isFinite(input.horny) ? input.horny : 0;
    const heat = SEX_FACTS.some(id => facts.has(id)) || (horny >= 81 && desire >= 61) ? 'sex' : desire >= 41 || horny >= 41 ? 'slow' : '';
    const snap = { moodVal, top: top.map(([id]) => id), fams, places, facts, night, heat, dyn: input.dyn || '', under: input.under || '', meters: input.meters ?? {}, replies: input.replies ?? 99,
        who: [...new Set((input.who ?? []).map(norm).filter(Boolean))], appear: (input.appear ?? []).map(norm), energy: Math.max(1, Math.min(5, Math.round(energy))), moments: new Set() };
    const moments = new Set();
    for (const mo of MOMENTS) {
        const hit = mo.moods.some(id => (moodVal[id] ?? 0) >= 41) || mo.places.some(id => places.has(id)) || (mo.dyn.length && (mo.dyn.includes(snap.dyn) || mo.dyn.includes(snap.under)));
        if (hit && (!mo.test || mo.test(snap))) moments.add(mo.id);
        else if (!mo.moods.length && !mo.places.length && !mo.dyn.length && mo.test?.(snap)) moments.add(mo.id);
    }
    if (heat === 'sex') moments.delete('seduction');
    for (const id of moments) energy += ENERGY_PUSH[id] ?? 0;
    snap.moments = moments; snap.energy = Math.max(1, Math.min(5, Math.round(energy)));
    return snap;
}
// What the snapshot says, in a few words, for the Now playing card.
export function describe(snap, whoName = '') {
    return [whoName, snap.places.size ? labelOf('p', [...snap.places][0]) : '', [...snap.moments].map(id => labelOf('mo', id))[0] ?? '', snap.fams[0] ? labelOf('f', snap.fams[0]) : '', snap.heat === 'sex' ? 'Sex scene' : '', `energy ${snap.energy}`].filter(Boolean).join(' · ');
}
// The things a ✓ Fits or ✗ Not here tap remembers about a scene.
export const learnKeys = snap => [...[...snap.places].map(p => `p:${p}`), ...[...snap.moments].map(m => `mo:${m}`), snap.fams[0] ? `f:${snap.fams[0]}` : '', snap.heat ? `h:${snap.heat}` : ''].filter(Boolean);

// ---- Scoring ----
const blocked = (nv, snap) => nv.some(x => {
    const [k, id] = [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)];
    return k === 'f' ? snap.fams.slice(0, 2).includes(id) : k === 'mo' ? snap.moments.has(id) : k === 'h' ? snap.heat === id : false;
});
// opts: { recent: Set of uris, learn: { key: n } for this song, themeOn: 'big' | 'always' | 'off' }
export function scoreSong(tags, snap, opts = {}) {
    if (tags.off || blocked(tags.nv, snap)) return { score: -Infinity, why: [] };
    let score = 0; const why = [], add = (n, w) => { score += n; if (w && n > 0) why.push(w); };
    const chars = tags.c.map(norm), mine = chars.length && !chars.includes('any') ? chars.some(c => snap.who.includes(c)) : null;
    if (mine === true) add(POINTS.char, tags.c.find(c => snap.who.includes(norm(c)))); else if (mine === false) add(POINTS.otherChar);
    const moods = tags.m.filter(id => (snap.moodVal[id] ?? 0) >= 21).slice(0, POINTS.moodMax);
    for (const id of moods) add(POINTS.mood, labelOf('m', id));
    if (snap.fams[0] && tags.f.includes(snap.fams[0])) add(POINTS.family1, moods.length ? '' : labelOf('f', snap.fams[0]));
    if (snap.fams[1] && tags.f.includes(snap.fams[1])) add(POINTS.family2);
    const place = tags.p.find(id => snap.places.has(id)); if (place) add(POINTS.place, labelOf('p', place));
    const moment = tags.mo.find(id => snap.moments.has(id)); if (moment) add(POINTS.moment, labelOf('mo', moment));
    if (snap.dyn && tags.d.includes(snap.dyn)) add(POINTS.dynamic, labelOf('d', snap.dyn)); else if (snap.under && tags.d.includes(snap.under)) add(POINTS.dynamic / 2);
    if (tags.h && tags.h === snap.heat) add(POINTS.heat, labelOf('h', tags.h)); else if (tags.h === 'sex') add(POINTS.sexOutside);
    if (tags.e) { const d = Math.abs(tags.e - snap.energy); add(d === 0 ? POINTS.energySame : d === 1 ? POINTS.energyNear : POINTS.energyFar * (d - 1)); }
    if (tags.fav) add(POINTS.favourite);
    if (opts.recent?.has(opts.uri)) add(POINTS.recent);
    if (tags.th && mine === true && opts.themeOn !== 'off') {
        const appears = snap.appear.some(a => chars.includes(a)), big = (snap.moodVal[snap.top[0]] ?? 0) >= 81;
        if (appears || (opts.themeOn === 'always' ? true : big)) add(POINTS.theme, 'theme');
    }
    if (opts.learn) {
        const keys = learnKeys(snap); let l = 0;
        for (const k of keys) l += opts.learn[k] ?? 0;
        if (l) add(Math.max(POINTS.notHereMin, Math.min(POINTS.fitsMax, l)), l > 0 ? 'you said it fits' : '');
    }
    return { score: Math.round(score * 10) / 10, why };
}
// songs: [{ uri, tags (merged), learn }] → best first, unplayable ones left out.
export function rank(songs, snap, opts = {}) {
    return songs.map(s => ({ uri: s.uri, ...scoreSong(s.tags, snap, { ...opts, uri: s.uri, learn: s.learn }) })).filter(x => x.score > -Infinity).sort((a, b) => b.score - a.score);
}
// One pick from the songs within a point of the best, more often the higher ones. rng is Math.random unless a test passes its own.
export function pick(ranked, rng = Math.random) {
    if (!ranked.length) return null;
    const best = ranked[0].score, near = ranked.filter(x => x.score >= best - 1).slice(0, 12);
    const weights = near.map(x => x.score - (best - 1) + 0.5), total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < near.length; i++) { r -= weights[i]; if (r <= 0) return near[i]; }
    return near.at(-1);
}
// The pick, then the best of the rest, so Spotify keeps playing fitting songs by itself.
export function lineup(ranked, first, size = LINEUP) {
    if (!first) return [];
    return [first.uri, ...ranked.filter(x => x.uri !== first.uri && x.score >= Math.min(first.score - 6, GOOD_ENOUGH)).slice(0, size - 1).map(x => x.uri)];
}
export { GOOD_ENOUGH };

// ---- When the music changes ----
// A real shift between two snapshots. Mood families only count once they've held for two replies, which
// app/music.js handles by passing the family it has seen twice (famHeld).
export function shiftOf(before, now, famHeld = now.fams[0]) {
    if (!before) return { big: true, any: true, why: 'start' };
    const same = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
    if (before.who.join('|') !== now.who.join('|')) return { big: true, any: true, why: 'someone else' };
    if (!same(before.places, now.places)) return { big: true, any: true, why: 'new place' };
    if (!same(before.moments, now.moments)) return { big: true, any: true, why: 'new moment' };
    if (before.heat !== now.heat) return { big: true, any: true, why: 'heat' };
    if (Math.abs(before.energy - now.energy) >= 2) return { big: true, any: true, why: 'energy' };
    if (famHeld && before.fams[0] !== famHeld) return { big: true, any: true, why: 'feeling' };
    if (before.energy !== now.energy || before.fams[0] !== now.fams[0] || before.dyn !== now.dyn) return { big: false, any: true, why: 'small' };
    return { big: false, any: false, why: '' };
}
