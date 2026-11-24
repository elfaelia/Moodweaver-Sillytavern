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
// Pet names (what this person calls the other) and sayings (phrases they really use): one per line, or pet names
// separated by commas. Kept as typed; split only when sent.
export const cleanWords = (v, max = 400) => String(v ?? '').replace(/[<>]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim().slice(0, max);
const wordList = (v, commas) => cleanWords(v).split(commas ? /[\n,;]+/ : /\n+/).map(x => x.trim().replace(/^["\u201c'\u2018]+|["\u201d'\u2019]+$/g, '')).filter(Boolean).slice(0, 12);
export const petNames = st => wordList(st?.petNames, true);
export const sayings = st => wordList(st?.sayings, false);
export const cleanInterests = v => String(v ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
// Height as written ("6'1", "5 ft 10", "185 cm", "1.85 m", "185") \u2192 centimetres, or 0.
export function heightCm(text) {
    const t = String(text ?? '').toLowerCase().replace(/[\u2019\u2032]/g, "'").replace(/[\u201d\u2033]/g, '"');
    const ft = t.match(/(\d)\s*(?:'|ft|foot|feet)\s*(\d{1,2})?/); if (ft) return Math.round(Number(ft[1]) * 30.48 + Number(ft[2] ?? 0) * 2.54);
    const m = t.match(/\b([12])[.,](\d{1,2})\s*m\b/); if (m) return Math.round(Number(`${m[1]}.${m[2]}`) * 100);
    const cm = t.match(/\b(\d{2,3})\s*(?:cm)?\b/); const n = cm ? Number(cm[1]) : 0;
    return n >= 50 && n <= 260 ? n : 0;
}
// "38", "6'1" and "guitar, chess" \u2192 "38, 6'1, into guitar, chess". Empty when nothing's filled in.
// Favourites: food, drink, colour and style. Sent only when the scene comes near them (a meal, a bar, a gift,
// getting dressed) or every few replies, so they colour choices without being repeated each time.
export const FAVS = [
    ['food', 'Favourite food', 'cherry pie', /\b(eat\w*|ate|food|dinner|lunch|breakfast|supper|meal|hungry|cook\w*|restaurant|diner|kitchen|snack\w*|dessert|order\w*|menu|bak\w*)\b/i],
    ['drink', 'Favourite drink', 'bourbon', /\b(drink\w*|drank|bar|pour\w*|coffee|tea|wine|whisk(e)?y|bourbon|beer|cocktail\w*|thirst\w*|glass|bottle|cup|toast)\b/i],
    ['colour', 'Favourite colour', 'deep green', /\b(colou?r\w*|paint\w*|flowers?|gift\w*|present|ribbon|dress\w*|lipstick|decorat\w*)\b/i],
    ['style', 'Style', 'sharp suits', /\b(cloth\w*|dress\w*|wear\w*|wore|outfit|suit|shop\w*|style|look\w*|mirror|wardrobe|shoes|jacket|hair)\b/i],
];
export const cleanFavs = v => Object.fromEntries(FAVS.map(([k]) => [k, String(v?.[k] ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)]).filter(([, t]) => t));
export const favText = (st, scene = '', all = false) => FAVS.filter(([k, , , topic]) => st?.favs?.[k] && (all || topic.test(scene)))
    .map(([k, label]) => `${label.replace('Favourite ', '').toLowerCase()} ${st.favs[k]}`).join('; ');
// Family (2.0): one box per person (role, name, about them), stored as lines "Role: Name, about them" so older chats
// read the same. A person is sent only when the latest messages name their role (mom, mum and mother all count) or
// their name; nothing goes on general family talk or as a reminder, so the card and scenario never pull them in.
export const KIN = [['mother', 'mom', 'mum', 'mama', 'mommy', 'mummy', 'ma'], ['father', 'dad', 'daddy', 'papa', 'pa', 'pop', 'pops'], ['sister', 'sis'], ['brother', 'bro'],
    ['son'], ['daughter'], ['wife'], ['husband'], ['grandmother', 'grandma', 'granny', 'nan', 'nana', 'gran'], ['grandfather', 'grandpa', 'granddad', 'grandad', 'gramps'],
    ['aunt', 'auntie', 'aunty'], ['uncle'], ['cousin'], ['niece'], ['nephew'], ['stepmother', 'stepmom', 'stepmum'], ['stepfather', 'stepdad'], ['twin'],
    ['fianc\u00e9', 'fianc\u00e9e', 'fiance', 'fiancee'], ['in-laws', 'mother-in-law', 'father-in-law'], ['kids', 'children', 'baby', 'child']];
export const FAMILY_MAX = 12;
export const familyMembers = st => (cleanWords(st?.family, 1600) ? cleanWords(st.family, 1600).split(/\n/) : []).slice(0, FAMILY_MAX).map(line => {
    const [role, rest = ''] = line.includes(':') ? line.split(/:(.*)/s) : ['', line];
    const parts = rest.split(','), first = parts[0].trim();
    // An older free line ("Dad: drunk, violent") has no name: a lower-case start means it's all about them.
    const named = /^[A-Z\u00c0-\u00de]/.test(first);
    return { role: role.trim(), name: named ? first : '', info: (named ? parts.slice(1) : parts).join(',').trim() };
});
const flat = v => String(v ?? '').replace(/[\n:<>]/g, ' ').replace(/\s+/g, ' ').trim();
export const familyString = list => list.slice(0, FAMILY_MAX).map(m => `${flat(m.role)}: ${flat(m.name).replace(/,/g, ' ')}${flat(m.info) ? `, ${flat(m.info)}` : ''}`).join('\n');
const filled = m => m.role || m.name || m.info;
export const familyLines = st => familyMembers(st).filter(filled).map(m => `${m.role || 'Family'}: ${[m.name, m.info].filter(Boolean).join(', ')}`);
export function familyText(st, scene = '') {
    const t = ` ${String(scene ?? '').toLowerCase().replace(/[^a-z\u00e0-\u00ff' -]/g, ' ')} `;
    const said = w => w.length >= 2 && [` ${w} `, ` ${w}'s `, ` ${w}s `].some(x => t.includes(x));
    return familyMembers(st).filter(filled).filter(m => {
        const kin = KIN.filter(g => g.some(w => new RegExp(`\\b${w}s?\\b`, 'i').test(m.role))).flat();
        const own = m.role.toLowerCase().split(/[^a-z\u00e0-\u00ff'-]+/).filter(w => w.length >= 3);
        const names = m.name.toLowerCase().split(/[^a-z\u00e0-\u00ff'-]+/).filter(w => w.length >= 3);
        return [...kin, ...own, ...names].some(said);
    }).map(m => `${m.role || 'family'}${m.name ? ` (${m.name})` : ''}${m.info ? `: ${m.info}` : ''}`).join('; ');
}
export const profileText = st => { const parts = [cleanAge(st?.age), cleanHeight(st?.height)].filter(Boolean).join(', '), into = cleanInterests(st?.interests);
    return [parts, into ? `into ${into} (when the scene gives it room)` : ''].filter(Boolean).join('; '); };
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
// Returns Map(turn id \u2192 { v, is: [labels], not: [labels] }) for the person's turn-ons and turn-offs that
// the other person shows. For turn-offs, `not` is the opposite showing instead, which counts in their favour.
// Opposites attract: pairs of traits that are each other's opposite. "contrast" in a turn-on's signs counts when the
// other person has one side of a pair and this person the other.
export const CONTRASTS = [['introverted', 'extroverted'], ['wallflower', 'life_of_party'], ['sunshine', 'cynical'], ['sunshine', 'jaded'], ['sunshine', 'brooding_hero'],
    ['innocent', 'corrupted'], ['sheltered', 'feral'], ['good_girl', 'bad_boy'], ['good_girl', 'wild_child'], ['boy_next_door', 'bad_boy'], ['girl_next_door', 'bad_boy'],
    ['uptight', 'hedonistic'], ['uptight', 'chaotic_energy'], ['disciplined', 'impulsive'], ['methodical', 'reckless'], ['logical', 'intuitive'], ['idealistic', 'cynical'],
    ['hopeless_romantic', 'cynical'], ['soft_hearted', 'cold_blooded'], ['soft_hearted', 'callous'], ['puritanical', 'slutty'], ['traditional', 'rebellious'],
    ['traditional', 'anti_authoritarian'], ['dutiful', 'rebellious'], ['devout', 'nihilistic'], ['skeptical', 'superstitious'], ['bookish', 'party_animal'],
    ['frugal', 'spendthrift'], ['classy', 'trashy'], ['polite', 'crude'], ['gentlemanly', 'crude'], ['sim_neat', 'sim_slob'], ['ice_queen', 'sunshine'],
    ['princess', 'feral'], ['mature', 'immature'], ['people_pleaser', 'blunt'], ['workaholic', 'lazy'], ['uptight', 'lovable_degenerate'], ['sensitive', 'insensitive'],
    ['respectability_obsessed', 'trashy'], ['lawful_good', 'chaotic_neutral'], ['sim_loner', 'sim_friendly'], ['sim_no_humour', 'sim_good_humour']];
const NO_SIGNS = { is: [], not: [] }, STOP = new Set(['with', 'about', 'other', 'people', 'things', 'their', 'being', 'someone', 'the', 'and', 'her', 'his', 'for', 'old', 'new', 'small', 'little']);
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
        if (x === 'contrast') { const has = (who, id) => (who?.moods?.[id] ?? 0) > 0 && BY_ID[id];
            const hit = CONTRASTS.flatMap(([p, q]) => [[p, q], [q, p]]).filter(([mine, theirs]) => has(self.state, mine) && has(st, theirs));
            return hit.slice(0, 2).map(([mine, theirs]) => `${BY_ID[theirs].label.toLowerCase()} to their ${BY_ID[mine].label.toLowerCase()}`).join(', '); }
        if (x.startsWith('tie:')) { const t = RELATIONSHIP_BY_ID[x.slice(4)]; return t && (ties[t.id] ?? 0) > 0 ? t.label.toLowerCase() : ''; }
        const m = BY_ID[x], v = moods[x] ?? 0;
        return m && (analysed(m) ? v >= 41 : v > 0) ? m.label.toLowerCase() : '';
    };
    // "Older men" needs a man as well as the age.
    // Their interests: "guitar, old films" counts toward musicians or film buffs when a word starts the same.
    const words = cleanInterests(st.interests).toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 4 && !STOP.has(w));
    const intoIt = id => { if (!words.length) return ''; const t = TURN_BY_ID[id], names = `${t.noun} ${t.keys}`.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 4);
        const hit = words.find(w => names.some(n => n.startsWith(w.slice(0, 5)) || w.startsWith(n.slice(0, 5)))); return hit ? `into ${hit}` : ''; };
    // What they carry: a revolver counts toward gun turn-ons, a flask toward drinkers, the same way.
    const carried = (st.inventory ?? []).filter(i => i?.carried && i.text).map(i => ({ text: String(i.text).toLowerCase().slice(0, 40), words: String(i.text).toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3 && !STOP.has(w)) }));
    const carries = id => { if (!carried.length) return ''; const t = TURN_BY_ID[id], names = `${t.noun} ${t.keys}`.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3);
        const hit = carried.find(c => c.words.some(w => names.some(n => n === w || (w.length >= 5 && n.startsWith(w.slice(0, 5)))))); return hit ? `carries ${hit.text}` : ''; };
    const fits = id => !/_(men|women)$/.test(id) || (id.endsWith('_women') ? other.he === 'she' : other.he === 'he');
    const out = new Map();
    for (const [id, v] of Object.entries(prefs)) {
        const sign = v && (SIGNS[id] ?? NO_SIGNS); if (!sign || !fits(id)) continue;
        const into = intoIt(id), carry = carries(id);
        const is = [...new Set([...sign.is.map(label), into, carry].filter(Boolean))].slice(0, 2), not = v < 0 ? [...new Set(sign.not.map(label).filter(Boolean))].slice(0, 2) : [];
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
