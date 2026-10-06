// Turn-ons and turn-offs: one two-way slider per thing. Right is a turn-on, left a turn-off.
// Each row: id, what it is (sent as written), description for the panel.
export const TURN_CATEGORIES = [
    ['Looks & body', '✦', '#d69bbb', [
        ['femininity', 'femininity', 'soft, feminine ways of looking and moving'], ['masculinity', 'masculinity', 'rugged, masculine ways of looking and moving'],
        ['androgyny', 'androgyny', 'looks that sit between masculine and feminine'], ['ruggedness', 'ruggedness', 'rough looks and a rough-around-the-edges manner'],
        ['elegance', 'elegance', 'grace in how someone dresses and moves'], ['makeup', 'makeup', 'a made-up face, from subtle to dramatic'],
        ['eyes', 'eyes', 'someone’s eyes and how they look at you'], ['lips', 'lips', 'the shape of someone’s mouth'], ['smiles', 'smiles', 'the way someone smiles'],
        ['hands', 'hands', 'someone’s hands'], ['necks', 'necks', 'the line of someone’s neck'], ['shoulders', 'shoulders', 'broad or delicate shoulders'],
        ['backs', 'backs', 'the shape of someone’s back'], ['waists', 'waists', 'the curve of someone’s waist'], ['feet', 'feet', 'someone’s feet'],
        ['veins', 'veins', 'visible veins on arms and hands'], ['long_hair', 'long hair', 'hair worn long'], ['short_hair', 'short hair', 'hair worn short'],
        ['facial_hair', 'facial hair', 'beards and stubble'], ['body_hair', 'body hair', 'hair on chest, arms and body'], ['freckles', 'freckles', 'a scattering of freckles'],
        ['pale_skin', 'pale skin', 'fair skin that shows every flush'], ['glasses', 'glasses', 'someone in glasses'], ['scars', 'scars', 'visible scars'],
        ['tattoos', 'tattoos', 'inked skin'], ['piercings', 'piercings', 'pierced ears, faces and bodies'], ['curves', 'curves', 'a curvy figure'],
        ['slim_builds', 'slim builds', 'a slim, slight frame'], ['soft_bodies', 'soft bodies', 'soft, cuddly bodies'], ['muscular_builds', 'muscular builds', 'a built, muscled body'],
        ['tall_people', 'tall people', 'someone who towers over them'], ['short_people', 'short people', 'someone they tower over'],
        ['lingerie', 'lingerie', 'someone dressed in lingerie'],
    ]],
    ['Voice & senses', '♪', '#9fc6c0', [
        ['deep_voices', 'deep voices', 'a low, deep voice'], ['high_voices', 'high voices', 'a light, high voice'], ['raspy_voices', 'raspy voices', 'a rough, raspy voice'],
        ['accents', 'accents', 'a distinctive accent'], ['scent', 'someone’s natural scent', 'how someone smells up close'], ['perfume', 'perfume or cologne', 'what someone wears to smell good'],
        ['laughter', 'laughter', 'the sound and sight of someone laughing'], ['crying', 'tears and crying', 'someone in tears'],
    ]],
    ['Personality & behaviour', '❦', '#c9b37e', [
        ['confidence', 'confidence', 'someone sure of themselves'], ['shyness', 'shyness', 'someone shy and easily flustered'], ['kindness', 'kindness', 'a kind heart'],
        ['intelligence', 'intelligence', 'a sharp mind'], ['humour', 'a sense of humour', 'someone who makes them laugh'], ['competence', 'competence', 'someone who knows what they’re doing'],
        ['ambition', 'ambition', 'big plans and the drive to chase them'], ['composure', 'composure', 'someone who keeps their cool'], ['awkwardness', 'awkwardness', 'fumbled words and awkward pauses'],
        ['bluntness', 'bluntness', 'someone who says exactly what they mean'], ['mystery', 'mystery', 'someone they can’t quite figure out'], ['expressive_faces', 'expressive faces', 'a face that shows every feeling'],
        ['rebelliousness', 'rebelliousness', 'someone who pushes back against rules'], ['defiance', 'defiance', 'someone who talks back and won’t give in'], ['obedience', 'obedience', 'someone who does as they’re told'],
        ['dominance', 'dominance in others', 'someone who takes charge'], ['submissiveness', 'submissiveness in others', 'someone who yields'], ['vulnerability', 'vulnerability', 'someone open, fragile or exposed'],
        ['neediness', 'neediness', 'someone who needs them'], ['arrogance', 'arrogance', 'someone full of themselves'], ['promiscuity', 'promiscuity', 'someone who sleeps around'],
        ['artistic_types', 'artistic types', 'artists, musicians and creative people'],
    ]],
    ['Types', '◇', '#c0acd9', [
        ['older_men', 'older men', 'men older than them'], ['younger_men', 'younger men', 'men younger than them'],
        ['older_women', 'older women', 'women older than them'], ['younger_women', 'younger women', 'women younger than them'],
        ['teachers', 'teachers and their authority', 'the teacher, the authority, the imbalance'], ['innocence', 'innocence', 'someone innocent and untouched'],
        ['evil_people', 'a cruel or wicked streak', 'someone with something dark in them'], ['danger', 'danger', 'someone who could hurt them'],
    ]],
];
export const TURN_TAGS = TURN_CATEGORIES.flatMap(([group, , color, rows]) => rows.map(([id, noun, cue]) => ({ id, noun, cue, group, color,
    label: noun[0].toUpperCase() + noun.slice(1) })));
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
