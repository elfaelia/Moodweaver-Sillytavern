// Place-and-time locks. Each regional era is a full period cue plus a dialect.
// Rows: [id, label, cue sent to the AI, note shown to you (searchable), placed after this generic era].
const REGIONAL_ERAS = [
    ['era_1960s_america', '1960s America', 'Kennedy, then Vietnam, civil rights and the moon landing; rotary phones, typewriters and carbon paper, TV going color, no home computers; cigarettes everywhere, the Pill, LSD late in the decade; Cold War secrecy, state hospitals, ECT and new tranquilizers',
        'Kennedy to Woodstock, Cold War labs. Locks American English. Easterman, the Outlast Trials.', 'era_1960s'],
    ['era_1960s_britain', '1960s Britain', 'austerity giving way to Swinging London; red phone boxes, typewriters, black-and-white telly with two or three channels; the Beatles and the Stones, mods and rockers, the Profumo scandal, the Pill (married women first); grammar schools and pubs shut at eleven',
        'Swinging London, mods and rockers. Locks British English.', 'era_1960s'],
    ['era_1990s_america', '1990s America', 'dial-up AOL, chat rooms and early email, pagers, landlines and answering machines, cell phones only late; Blockbuster, VHS, CDs and malls; grunge, hip-hop and boy bands, Friends and Seinfeld; Clinton, the O.J. trial, Y2K jitters; flannel, baggy jeans and ‘whatever’, ‘as if’',
        'Dial-up, Blockbuster, malls, grunge. Locks American English.', 'era_1990s'],
    ['era_2000s_america', '2000s America', 'flip phones and T9 texting, AIM and MySpace, then Facebook; iPods, burned CDs and Netflix by mail; post-9/11 airport security and Iraq; reality TV, emo and scene kids, low-rise jeans; the iPhone in 2007 but not everywhere yet, then the 2008 crash',
        'Flip phones, AIM, MySpace, emo. Locks American English.', 'era_2000s'],
    ['era_2010s_america', '2010s America', 'smartphones everywhere, Instagram, Snapchat, Tumblr, Tinder and group chats; Netflix streaming, Uber, Juuls late on; Obama to Trump, Vine to TikTok; selfies and memes; slang from ‘YOLO’ and ‘on fleek’ to ‘lit’, ‘basic’ and ‘extra’',
        'Smartphones, Tumblr, Tinder, Juuls. Locks American English. Chloe Price, Joe Goldberg.', 'era_2010s'],
    ['era_2020s_america', '2020s America', 'TikTok, group chats, DoorDash, Venmo and tap-to-pay; COVID lockdowns and masks in recent memory; remote work, dating apps, streaming and vapes; AI chatbots turning up everywhere; slang like ‘no cap’, ‘it’s giving’, ‘delulu’ and ‘rizz’',
        'TikTok, DoorDash, post-COVID. Today. Locks American English.', 'era_2020s'],
];
export const ERA_LOCALE = Object.fromEntries(REGIONAL_ERAS.map(([id, , , , after]) => [id, { locale: id.endsWith('america') ? 'us' : id.endsWith('scotland') ? 'scot' : 'uk', replaces: after }]));

// Sent once, inside the period section. Opus 5.5 follows named patterns far better than a general
// "write American": each line says what to use and names the opposite side's giveaways to leave out.
const TECHNIQUE = 'Authors and styles in these notes shape technique, never accent, spelling or idiom.';
export const LOCALE_RULES = {
    us: `Narration and dialogue are American English: color, realize, gray, center, toward; Mom, apartment, gas, elevator, sidewalk, trash, cookie, vacation, fall, the hospital. Leave out British giveaways: colour or realise spellings, Mum, flat, lift, pavement, rubbish, biscuit, holiday, “in hospital”, “bloody”, “mate”, “brilliant”, “fancy”, “reckon”, “whilst”, “cheers”, and “quite” or “rather” as intensifiers. Only a character the card makes British talks that way. ${TECHNIQUE}`,
    uk: `Narration and dialogue are British English: colour, realise, grey, centre, travelled; Mum, flat, lift, pavement, rubbish, biscuit, holiday, autumn, in hospital. Leave out American giveaways: color or realize spellings, Mom, apartment, elevator, sidewalk, trash, cookie, vacation, fall for autumn, “gotten”, “awesome”, “buddy”, “y’all”. Only a character the card makes American talks that way. ${TECHNIQUE}`,
    scot: `Narration uses British spelling and words: colour, realise, grey; Mum, flat, rubbish, holiday. Scottish characters sound Scottish where it fits the speaker: aye, wee, ken, lass, bairn, kirk, och, dinnae, cannae, outwith; broader for working folk, lighter for gentry and the educated. Use a few Scots words and turns of phrase, not phonetic spelling throughout. Leave out American giveaways: color, Mom, apartment, “gotten”, “okay”. ${TECHNIQUE}`,
};
// A second regional era only covers its own people; narration stays with the strongest.
export const LOCALE_SPEAKERS = {
    us: 'American characters still talk American (Mom, apartment, gas, okay).',
    uk: 'British characters still talk British (Mum, flat, petrol, rather).',
    scot: 'Scottish characters still sound Scottish (aye, wee, ken, dinnae).',
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
// Text the player typed inside “quotes” is left exactly as written.
export const toAmerican = text => String(text).split(/(“[^”]*”)/).map((part, i) => i % 2 ? part : respell(part)).join('');
