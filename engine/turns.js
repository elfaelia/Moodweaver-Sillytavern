// Turn-ons and turn-offs: one two-way slider per thing someone likes or dislikes IN OTHER PEOPLE.
// Right is a turn-on, left a turn-off. Each row: id, noun, panel description, optional short wording for the prompt.
import { TURN_GROUPS } from '../data/catalogue/turns.js';
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
