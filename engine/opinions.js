// Opinions of other people (1.79), after Dwarf Fortress and The Sims: how the character comes to feel about the
// family and side characters the story keeps bringing up. Built from the feelings the hidden line already aims at
// someone ("angry +10 at his wife"), so it costs nothing extra to collect. Names are matched to the Family box,
// so "his wife" and "Margaret" are the same person. A line goes to Claude only when the scene names them.
// Read back from the chat each time, so swiping a reply takes its share with it. Data and pure functions.
import { pt } from './util.js';
import { BY_ID } from '../data/catalogue.js';
import { KIN, familyMembers } from './turns.js';

const WARM = new Set(['happy', 'closeness', 'love', 'attachment', 'desire', 'calm']);
const COLD = new Set(['angry', 'cruel', 'cold', 'sad', 'scared']);
const FADE = 0.985, MIN = 8;
const STRIP = /^(his|her|their|my|your|the|that|this|a|an|old)\s+/i;
// "his wife" \u2192 { key: 'margaret', name: 'Margaret' } when the family box has "Wife: Margaret\u2026".
function who(about, family) {
    const raw = String(about ?? '').trim().replace(/[\u2019']s$/i, ''); let t = raw.toLowerCase();
    while (STRIP.test(t)) t = t.replace(STRIP, '');
    if (!t || t.length > 30) return null;
    for (const f of family) {
        if (f.name && (t === f.name.toLowerCase() || t.startsWith(`${f.name.toLowerCase()} `))) return { key: f.name.toLowerCase(), name: f.name, rel: f.rel };
        if (f.kin.includes(t)) return { key: (f.name || f.rel).toLowerCase(), name: f.name || f.rel, rel: f.rel };
    }
    // Only people (2.0.28): a name as the story wrote it (capital first), or a word for a person. Themselves,
    // feelings and things (affection, the job, the past) are not someone to have feelings about here.
    if (NOT_PEOPLE.has(t) || ABSTRACT.test(t)) return null;
    const head = t.split(/\s+/).at(-1);
    if (!/^[A-Z\u00c0-\u00de]/.test(raw.replace(STRIP_RAW, '')) && !PEOPLE.has(head) && !KIN.flat().includes(head)) return null;
    return { key: t, name: t.replace(/\b[a-z]/g, c => c.toUpperCase()), rel: '' };
}
const STRIP_RAW = /^(?:(?:his|her|their|my|your|the|that|this|a|an|old)\s+)+/i;
const NOT_PEOPLE = new Set(['themselves', 'himself', 'herself', 'itself', 'myself', 'yourself', 'oneself', 'themself', 'it', 'this', 'that', 'them', 'everything',
    'everyone', 'everybody', 'nothing', 'anything', 'something', 'life', 'world', 'future', 'past', 'work', 'job', 'money', 'god', 'fate', 'night', 'day', 'house', 'home']);
const ABSTRACT = /(tion|sion|ness|ment|ism)$/;
const PEOPLE = new Set(['boss', 'friend', 'friends', 'partner', 'girlfriend', 'boyfriend', 'ex', 'neighbour', 'neighbor', 'cop', 'cops', 'officer', 'doctor', 'nurse', 'teacher',
    'kid', 'man', 'woman', 'guy', 'girl', 'boy', 'stranger', 'landlord', 'dealer', 'buddy', 'pal', 'roommate', 'coworker', 'colleague', 'lover', 'mistress', 'secretary', 'gang', 'crew', 'priest', 'family']);
export function familyPeople(st) {
    return familyMembers(st).filter(m => m.role || m.name).map(m => ({ rel: m.role.toLowerCase(), name: m.name.split(/\s+/)[0] ?? '',
        kin: KIN.filter(g => g.some(w => new RegExp(`\\b${w}s?\\b`, 'i').test(m.role))).flat() }));
}
// entries: one per reply, oldest first: [{ about, id, delta }] feelings that rose toward someone else.
export function computeOpinions(entries = [], st = {}) {
    const fam = familyPeople(st), map = new Map();
    for (const list of entries) {
        for (const o of map.values()) { o.warm *= FADE; o.cold *= FADE; for (const k of Object.keys(o.feel)) o.feel[k] *= FADE; }
        for (const x of list) {
            const m = BY_ID[x.id], p = m && who(x.about, fam); if (!p || x.delta <= 0) continue;
            const side = WARM.has(m.category) ? 'warm' : COLD.has(m.category) ? 'cold' : ''; if (!side) continue;
            const o = map.get(p.key) ?? { ...p, warm: 0, cold: 0, feel: {} };
            o[side] += Math.min(20, x.delta) * 0.6;
            const word = m.label.split('/')[0].trim().toLowerCase(); o.feel[word] = (o.feel[word] ?? 0) + x.delta;
            map.set(p.key, o);
        }
    }
    return [...map.values()].map(o => ({ key: o.key, name: o.name, rel: o.rel, score: Math.round(o.warm - o.cold), warm: Math.round(o.warm), cold: Math.round(o.cold),
        feel: Object.entries(o.feel).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k), word: opinionWord(o.warm, o.cold) }))
        .filter(o => o.word).sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 12);
}
export function opinionWord(warm, cold) {
    if (warm >= 15 && cold >= 15) return 'torn about';
    const s = warm - cold;
    return s >= 50 ? 'adores' : s >= 25 ? 'fond of' : s >= MIN ? 'warm toward' : s <= -50 ? 'hates' : s <= -25 ? 'resents' : s <= -MIN ? 'cool toward' : '';
}
// Only people the scene names (by name or by relation) go to Claude.
export function opinionLines(list, n, scene = '') {
    const t = ` ${String(scene ?? '').toLowerCase().replace(/[^a-z\u00e0-\u00ff' -]/g, ' ')} `;
    const fam = list.filter(o => [o.name.toLowerCase().split(' ')[0], ...(o.rel ? [o.rel] : [])].some(w => w && (t.includes(` ${w} `) || t.includes(` ${w}'s `))));
    if (!fam.length) return [];
    return [`How ${pt(n)} has come to feel about others the scene brings up (from the story so far; let it colour how ${pt(n)} speaks of or to them): ${fam.slice(0, 4).map(o => `${pt(o.name)}: ${o.word}${o.feel.length ? ` (${o.feel.map(pt).join(', ')})` : ''}`).join('; ')}`];
}
