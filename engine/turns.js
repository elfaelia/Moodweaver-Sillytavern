// Turn-ons and turn-offs: one two-way slider per thing someone likes or dislikes IN OTHER PEOPLE.
// Right is a turn-on, left a turn-off. Each row: id, noun, panel description, optional short wording for the prompt.
import { TURN_GROUPS } from '../data/catalogue/turns.js';
import { BY_ID, analysed } from '../data/catalogue.js';
import { SKILL_BY_ID } from './skills.js';
import { RELATIONSHIP_BY_ID } from './relationships.js';
// [group, icon, colour, rows]; rows are [id, noun, cue, prompt, keys, sub-group].
export const TURN_CATEGORIES = TURN_GROUPS.map(g => [g.name, g.icon, g.color, g.subs.flatMap(sub => sub.rows.map(r => [r.id, r.noun, r.cue, r.prompt ?? r.noun, r.keys ?? '', sub.name]))]);
export const TURN_TAGS = TURN_CATEGORIES.flatMap(([group, , color, rows]) => rows.map(([id, noun, cue, prompt, keys, sub]) => ({ id, noun, cue, prompt, keys, group, sub, color,
    label: noun[0].toUpperCase() + noun.slice(1) })));
// The old Kinks traits (state.moods) become turn-ons (state.prefs) at the same strength; removed turn-ons merge into newer ones.
export { OLD_KINKS, TURN_MERGED } from '../data/catalogue/turns.js';
// The panel's key for a turn-on group, e.g. turn-kinks.
export const turnGroupKey = name => `turn-${String(name).toLowerCase().replace(/\W+/g, '-')}`;
export const TURN_BY_ID = Object.fromEntries(TURN_TAGS.map(t => [t.id, t]));

// The old "likes ___" moods and where they go. A minus sign means it was a dislike.
export const LIKES_TO_TURNS = {
    likes_older_men: 'older_men', likes_younger_men: 'younger_men', likes_older_women: 'older_women', likes_younger_women: 'younger_women',
    hot_for_teacher: 'teachers', likes_masculinity: 'masculinity', likes_femininity: 'femininity', likes_hands: 'hands', likes_feet: 'feet',
    likes_veins: 'veins', likes_eyes: 'eyes', likes_smiles: 'smiles', likes_lips: 'lips', likes_long_hair: 'long_hair', likes_short_hair: 'short_hair',
    likes_facial_hair: 'facial_hair', likes_body_hair: 'body_hair', likes_scars: 'scars', likes_tattoos: 'tattoos', likes_piercings: 'piercings',
    likes_soft_bodies: 'soft_bodies', likes_muscular_builds: 'muscular_builds', likes_tall_people: 'tall_people', likes_short_people: 'short_people',
    likes_deep_voices: 'deep_voices', likes_high_voices: 'high_voices', likes_raspy_voices: 'raspy_voices', likes_accents: 'accents',
    likes_confidence: 'confidence', likes_shyness: 'shyness', likes_kindness: 'kindness', likes_intelligence: 'intelligence', likes_humour: 'humour',
    drawn_to_innocent_people: 'innocence', drawn_to_evil_people: 'evil_people', attracted_to_crying: 'crying', attracted_to_laughing: 'laughter',
    likes_ruggedness: 'ruggedness', likes_their_smell: 'scent', likes_promiscuity: 'promiscuity', dislikes_promiscuity: '-promiscuity',
    dislikes_intelligence: '-intelligence', likes_shoulders: 'shoulders', likes_backs: 'backs', likes_necks: 'necks', likes_waists: 'waists',
    likes_freckles: 'freckles', likes_glasses: 'glasses', likes_elegance: 'elegance', likes_perfume: 'perfume', likes_expressive_faces: 'expressive_faces',
    likes_composure: 'composure', likes_awkwardness: 'awkwardness', likes_competence: 'competence', likes_ambition: 'ambition',
    likes_rebelliousness: 'rebelliousness', likes_mystery: 'mystery', likes_bluntness: 'bluntness',
};

// ---- Signs: turn-ons that count because of who the other person is ----
// A turn-on can be in play without anyone mentioning it: a character into brats, with a bratty player in
// the room. Each catalogue row's `signs` lists what in the other person counts, and `opposite` what counts
// as its opposite (data/catalogue/turns.js says how they're written). Read from what's already set, so it
// costs no request and only a few words in the note.
const SIGNS = Object.fromEntries(TURN_GROUPS.flatMap(g => g.subs.flatMap(sub => sub.rows.filter(r => r.signs || r.opposite)
    .map(r => [r.id, { is: String(r.signs ?? '').split(/\s+/).filter(Boolean), not: String(r.opposite ?? '').split(/\s+/).filter(Boolean) }]))));
// ---- Profile facts (the card on the Facts tab): age, height, interests ----
export const cleanAge = v => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 1 && n <= 999 ? n : ''; };
export const cleanHeight = v => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, 14);
export const cleanInterests = v => String(v ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
// Height as written ("6'1", "5 ft 10", "185 cm", "1.85 m", "185") → centimetres, or 0.
export function heightCm(text) {
    const t = String(text ?? '').toLowerCase().replace(/[’′]/g, "'").replace(/[”″]/g, '"');
    const ft = t.match(/(\d)\s*(?:'|ft|foot|feet)\s*(\d{1,2})?/); if (ft) return Math.round(Number(ft[1]) * 30.48 + Number(ft[2] ?? 0) * 2.54);
    const m = t.match(/\b([12])[.,](\d{1,2})\s*m\b/); if (m) return Math.round(Number(`${m[1]}.${m[2]}`) * 100);
    const cm = t.match(/\b(\d{2,3})\s*(?:cm)?\b/); const n = cm ? Number(cm[1]) : 0;
    return n >= 50 && n <= 260 ? n : 0;
}
// "38", "6'1" and "guitar, chess" → "38, 6'1, into guitar, chess". Empty when nothing's filled in.
export const profileText = st => { const parts = [cleanAge(st?.age), cleanHeight(st?.height)].filter(Boolean).join(', '), into = cleanInterests(st?.interests);
    return [parts, into ? `into ${into}` : ''].filter(Boolean).join('; '); };
// How two people compare: "14 years older and about a head taller". Only gaps worth saying.
export function compareProfiles(a, b) {
    const ages = cleanAge(a?.age) && cleanAge(b?.age) ? cleanAge(a.age) - cleanAge(b.age) : 0, cm = heightCm(a?.height) && heightCm(b?.height) ? heightCm(a.height) - heightCm(b.height) : 0;
    const age = Math.abs(ages) >= 3 ? `${Math.abs(ages)} years ${ages > 0 ? 'older' : 'younger'}` : '';
    const size = Math.abs(cm) < 5 ? '' : `${Math.abs(cm) < 12 ? 'a little' : Math.abs(cm) < 22 ? 'about a head' : 'much'} ${cm > 0 ? 'taller' : 'shorter'}`;
    return [age, size].filter(Boolean).join(' and ');
}
// Ages count as older or younger once they're at least this far apart; heights once they're this many cm apart.
const AGE_GAP = 2, HEIGHT_GAP = 5;
// self: { state }. other: { state, he: 'he' | 'she' | 'they' (their pronoun), ties: their ties toward self }.
// Ages, heights and interests come from each state's profile.
// Returns Map(turn id → { v, is: [labels], not: [labels] }) for the person's turn-ons and turn-offs that
// the other person shows. For turn-offs, `not` is the opposite showing instead, which counts in their favour.
const NO_SIGNS = { is: [], not: [] }, STOP = new Set(['with', 'about', 'other', 'people', 'things', 'their', 'being', 'someone']);
export function turnSigns(self, other) {
    const prefs = self?.state?.prefs ?? {}, st = other?.state;
    if (!self?.state?.enabled || !st?.enabled) return new Map();
    const moods = st.moods ?? {}, skills = st.skills ?? {}, ties = other.ties ?? {};
    const a = cleanAge(self.state.age), b = cleanAge(st.age), gap = a && b ? b - a : 0;
    const ha = heightCm(self.state.height), hb = heightCm(st.height), tall = ha && hb ? hb - ha : 0;
    const label = x => {
        if (x === 'older' || x === 'younger') return (x === 'older' ? gap >= AGE_GAP : gap <= -AGE_GAP) ? `${x} (${b})` : '';
        if (x === 'taller' || x === 'shorter') return (x === 'taller' ? tall >= HEIGHT_GAP : tall <= -HEIGHT_GAP) ? `${x} (${cleanHeight(st.height)})` : '';
        if (x.startsWith('skill:')) { const s = SKILL_BY_ID[x.slice(6)]; return s && (skills[s.id] ?? 0) >= 5 ? `${s.label.toLowerCase()} ${skills[s.id]}/10` : ''; }
        if (x.startsWith('tie:')) { const t = RELATIONSHIP_BY_ID[x.slice(4)]; return t && (ties[t.id] ?? 0) > 0 ? t.label.toLowerCase() : ''; }
        const m = BY_ID[x], v = moods[x] ?? 0;
        return m && (analysed(m) ? v >= 41 : v > 0) ? m.label.toLowerCase() : '';
    };
    // "Older men" needs a man as well as the age.
    // Their interests: "guitar, old films" counts toward musicians or film buffs when a word starts the same.
    const words = cleanInterests(st.interests).toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 4 && !STOP.has(w));
    const intoIt = id => { if (!words.length) return ''; const t = TURN_BY_ID[id], names = `${t.noun} ${t.keys}`.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 4);
        const hit = words.find(w => names.some(n => n.startsWith(w.slice(0, 5)) || w.startsWith(n.slice(0, 5)))); return hit ? `into ${hit}` : ''; };
    const fits = id => !/_(men|women)$/.test(id) || (id.endsWith('_women') ? other.he === 'she' : other.he === 'he');
    const out = new Map();
    for (const [id, v] of Object.entries(prefs)) {
        const sign = v && (SIGNS[id] ?? NO_SIGNS); if (!sign || !fits(id)) continue;
        const into = intoIt(id);
        const is = [...new Set([...sign.is.map(label), into].filter(Boolean))].slice(0, 2), not = v < 0 ? [...new Set(sign.not.map(label).filter(Boolean))].slice(0, 2) : [];
        if (is.length || not.length) out.set(id, { v, is, not });
    }
    return out;
}
// How much the signs warm or cool someone toward the other person, for the romance meter's baseline:
// a turn-on that shows pulls up, a turn-off pulls down, a turn-off's opposite helps a little. Capped.
export const SIGNS_CAP = 20;
export function signsPull(signs) {
    let sum = 0;
    for (const { v, is, not } of signs.values()) sum += is.length ? v / 15 : not.length ? Math.abs(v) / 30 : 0;
    return Math.max(-SIGNS_CAP, Math.min(SIGNS_CAP, Math.round(sum)));
}
