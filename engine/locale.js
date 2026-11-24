// Place-and-time locks. Each regional era is a full period cue plus a dialect.
// Rows: [id, label, cue sent to the AI, note shown to you (searchable), placed after this generic era].
const REGIONAL_ERAS = [
    ['era_1960s_america', '1960s America', 'Kennedy, then Vietnam, civil rights and the moon landing; rotary phones, typewriters and carbon paper, TV going color, no home computers; cigarettes everywhere, the Pill, LSD late in the decade; Cold War secrecy, state hospitals, ECT and new tranquilizers',
        'Kennedy to Woodstock, Cold War labs. Locks American English.', 'era_1960s'],
    ['era_1960s_britain', '1960s Britain', 'austerity giving way to Swinging London; red phone boxes, typewriters, black-and-white telly with two or three channels; the Beatles and the Stones, mods and rockers, the Profumo scandal, the Pill (married women first); grammar schools and pubs shut at eleven',
        'Swinging London, mods and rockers. Locks British English.', 'era_1960s'],
    ['era_1990s_america', '1990s America', 'dial-up AOL, chat rooms and early email, pagers, landlines and answering machines, cell phones only late; Blockbuster, VHS, CDs and malls; grunge, hip-hop and boy bands, Friends and Seinfeld; Clinton, the O.J. trial, Y2K jitters; flannel and baggy jeans',
        'Dial-up, Blockbuster, malls, grunge. Locks American English.', 'era_1990s'],
    ['era_2000s_america', '2000s America', 'flip phones and T9 texting, AIM and MySpace, then Facebook; iPods, burned CDs and Netflix by mail; post-9/11 airport security and Iraq; reality TV, emo and scene kids, low-rise jeans; the iPhone in 2007 but not everywhere yet, then the 2008 crash',
        'Flip phones, AIM, MySpace, emo. Locks American English.', 'era_2000s'],
    ['era_2010s_america', '2010s America', 'smartphones everywhere, Instagram, Snapchat, Tumblr, Tinder and group chats; Netflix streaming, Uber, Juuls late on; Obama to Trump, Vine to TikTok; selfies and memes',
        'Smartphones, Tumblr, Tinder, Juuls. Locks American English.', 'era_2010s'],
    ['era_2020s_america', '2020s America', 'TikTok, group chats, DoorDash, Venmo and tap-to-pay; COVID lockdowns and masks in recent memory; remote work, dating apps, streaming and vapes; AI chatbots turning up everywhere',
        'TikTok, DoorDash, post-COVID. Today. Locks American English.', 'era_2020s'],
];
export const ERA_LOCALE = Object.fromEntries(REGIONAL_ERAS.map(([id, , , , after]) => [id, { locale: id.endsWith('america') ? 'us' : id.endsWith('scotland') ? 'scot' : 'uk', replaces: after }]));

// Sent once, inside the period section.
const TECHNIQUE = 'Authors and styles in these notes shape technique, never accent, spelling or idiom.';
// 1.97.5: no lists of the other side's words. Naming them planted them (Opus echoes listed words), and "only a
// character the card makes British talks that way" read as leave to give that one character every word on the
// list, so an English character came out as a caricature. Now: the setting's English for narration and everyone
// raised there; a character from elsewhere sounds like a real person from there, lightly.
const AWAY = 'Someone from another country sounds like a real person from there: their accent and a few habits of speech where they would naturally come out, never a string of national slang, swearing or stereotypes, and never more of it as a scene heats up. The narration keeps the setting\u2019s words for everything, including that person\u2019s clothes, food and things.';
export const LOCALE_RULES = {
    us: `Narration and dialogue are American English in spelling, vocabulary and idiom (color, realize, Mom, apartment). ${AWAY} ${TECHNIQUE}`,
    uk: `Narration and dialogue are British English in spelling, vocabulary and idiom (colour, realise, Mum, flat). ${AWAY} ${TECHNIQUE}`,
    scot: `Narration is British English in spelling, vocabulary and idiom (colour, realise, Mum, flat). Scottish characters sound Scottish through a few Scots words and turns of phrase where that speaker would use them, broader for working folk and lighter for the educated, never phonetic spelling throughout. ${AWAY} ${TECHNIQUE}`,
};
// A second regional era only covers its own people; narration stays with the strongest.
export const LOCALE_SPEAKERS = {
    us: 'Americans in the story sound American, lightly.',
    uk: 'British people in the story sound British, lightly.',
    scot: 'Scots in the story sound Scottish, lightly.',
};

// When an American era leads, the note itself is respelled so its own wording doesn't pull the reply British.
const IZE = 'agoniz apologiz capitaliz catastrophiz categoriz characteriz civiliz compartmentaliz criticiz dehumaniz demoraliz desensitiz destabiliz dramatiz emphasiz energiz eroticiz fantasiz fetishiz finaliz glamoriz harmoniz humaniz hypnotiz idealiz idoliz immortaliz intellectualiz internaliz itemiz jeopardiz legitimiz memoriz mesmeriz minimiz mobiliz moraliz mythologiz neutraliz normaliz organiz patroniz personaliz philosophiz polariz prioritiz rationaliz realiz recogniz reorganiz ritualiz romanticiz sanitiz satiriz scandaliz scrutiniz sensitiz sentimentaliz sexualiz socializ specializ stabiliz steriliz stigmatiz styliz summariz sympathiz tantaliz terroriz theoriz traumatiz trivializ tyranniz utiliz vandaliz victimiz visualiz vocaliz weaponiz womaniz hypermentaliz defamiliariz'
    .split(' ').map(s => s.replace(/iz$/, ''));
const OUR = 'arbo ardo armo behavio cando clamo colo endeavo favo fervo flavo harbo hono humo labo neighbo odo parlo rumo savo splendo tumo valo vapo vigo';
const WORDS = {
    grey: 'gray', greys: 'grays', greyish: 'grayish', centre: 'center', centres: 'centers', centred: 'centered', theatre: 'theater', theatres: 'theaters',
    metre: 'meter', metres: 'meters', fibre: 'fiber', sombre: 'somber', spectre: 'specter', lustre: 'luster', calibre: 'caliber', sabre: 'saber',
    defence: 'defense', offence: 'offense', pretence: 'pretense', licence: 'license', judgement: 'judgment', judgemental: 'judgmental', judgements: 'judgments',
    spoilt: 'spoiled', learnt: 'learned', spelt: 'spelled', whilst: 'while', amongst: 'among', towards: 'toward', cosy: 'cozy', cosier: 'cozier',
    sceptical: 'skeptical', sceptic: 'skeptic', scepticism: 'skepticism', mould: 'mold', moulds: 'molds', moulded: 'molded', moulding: 'molding',
    smoulder: 'smolder', smouldering: 'smoldering', smoulders: 'smolders', moustache: 'mustache', jewellery: 'jewelry', jewelled: 'jeweled', pyjamas: 'pajamas',
    ageing: 'aging', programme: 'program', programmes: 'programs', practised: 'practiced', practising: 'practicing', practise: 'practice', manoeuvre: 'maneuver',
    manoeuvres: 'maneuvers', plough: 'plow', tyre: 'tire', tyres: 'tires', aluminium: 'aluminum', catalogue: 'catalog', tranquilliser: 'tranquilizer', tranquillisers: 'tranquilizers',
    dishevelled: 'disheveled', fulfil: 'fulfill', enrol: 'enroll', instalment: 'installment', analyse: 'analyze', analysed: 'analyzed', analyses: 'analyzes', analysing: 'analyzing',
    paralyse: 'paralyze', overanalysing: 'overanalyzing', overanalyse: 'overanalyze', paralysed: 'paralyzed', paralysing: 'paralyzing', mum: 'mom', mums: 'moms', mummy: 'mommy', arse: 'ass', arsehole: 'asshole', colourful: 'colorful',
};
const DOUBLE_L = 'travel cancel label model signal spiral unravel grovel marvel level duel channel counsel quarrel rival total equal dial panel fuel tunnel shovel snorkel swivel jewel';
const caseLike = (from, to) => from === from.toUpperCase() && from.length > 1 ? to.toUpperCase() : from[0] === from[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to;
const ize = new RegExp(`\\b(${IZE.join('|')})is(e|es|ed|ing|ation|ations|er|ers)\\b`, 'gi');
const our = new RegExp(`\\b(${OUR.split(' ').join('|')})ur(s|ed|ing|ite|ites|able|ably|al|ful|less|hood|ly)?\\b`, 'gi');
const ll = new RegExp(`\\b(${DOUBLE_L.split(' ').join('|')})l(ed|ing|er|ers)\\b`, 'gi');
const words = new RegExp(`\\b(${Object.keys(WORDS).join('|')})\\b`, 'gi');
function respell(text) {
    return text
        .replace(ize, (_, stem, end) => `${stem}iz${end}`)
        .replace(our, (_, stem, end = '') => `${stem}r${end}`)
        .replace(ll, (_, stem, end) => `${stem}${end}`)
        .replace(words, w => caseLike(w, WORDS[w.toLowerCase()]));
}
// Text the player typed inside \u201cquotes\u201d is left exactly as written.
export const toAmerican = text => String(text).split(/(\u201c[^\u201d]*\u201d)/).map((part, i) => i % 2 ? part : respell(part)).join('');
