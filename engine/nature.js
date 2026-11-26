// 2.0.23: how their natures fit. Traits don't change from reply to reply, so this is its own slow layer: the
// strongest pairing of his traits against yours (core traits count most), shown on Bonds as "By nature", leaning
// the slower dynamic underneath, and sent as one short line only when the scene touches it or every few replies.
// Never written as a clash: opposites can attract. Rows: [name, his side, your side, text(a, b, x, y), both ways
// the same, kind of dynamic it leans, words that mean the scene is touching it].
const GRUFF = ['blunt', 'judgemental', 'argumentative', 'contrarian', 'stubborn', 'uptight', 'cynical', 'jaded', 'misanthropic', 'aloof', 'prissy'];
const SUNNY = ['sunshine', 'bubbly', 'optimistic', 'life_of_party', 'earnest', 'dorky', 'chaotic_energy', 'gremlin', 'good_sport'];
const ORDER = ['control_freak', 'perfectionist', 'disciplined', 'methodical', 'fastidious', 'pedantic', 'uptight', 'dutiful', 'traditional', 'respectability_obsessed', 'puritanical'];
const WILD = ['reckless', 'impulsive', 'thrill_seeker', 'hedonistic', 'chaotic_energy', 'rebellious', 'live_fast', 'flaky', 'careless', 'feral', 'anti_authoritarian', 'contempt_for_authority'];
const CARER = ['nurturing', 'kind_hearted', 'soft_hearted', 'gentle', 'protector_role', 'fatherly', 'big_sibling_energy', 'selfless', 'self_sacrificing', 'empathetic'];
const NEEDS_CARE = ['dependent', 'self_doubting', 'worrier', 'sensitive', 'self_conscious', 'immature', 'spoiled_brat', 'whiny', 'sheltered', 'innocent', 'gullible', 'ditsy', 'reckless'];
const COLD = ['cold_blooded', 'callous', 'emotionless', 'cold_calculator', 'contempt_for_weakness', 'not_my_problem', 'selective_empathy', 'insensitive'];
const WARM = ['kind_hearted', 'empathetic', 'soft_hearted', 'gentle', 'generous', 'forgiving_nature', 'trusting_nature', 'hidden_heart', 'secretly_sentimental', 'sunshine'];
const GUARDED = ['reserved', 'secretive', 'aloof', 'introverted', 'withholding', 'touch_averse', 'hyper_independent', 'love_isnt_trust', 'cant_say_it', 'mysterious'];
const OPEN = ['nosy', 'talkative', 'gossipy', 'extroverted', 'earnest', 'overexplainer', 'cold_reader'];
const PROUD = ['arrogant', 'prideful', 'vain', 'snobbish', 'entitled', 'elitist', 'status_obsessed', 'swagger', 'bragging', 'preening'];
const HUMBLE = ['humble', 'modest', 'self_deprecating', 'down_to_earth'];
const OLD_SCHOOL = ['chauvinist', 'misogynist', 'anti_feminist', 'traditional', 'provider_pride', 'judgemental_misogyny'];
const OWN_WOMAN = ['feminist', 'rebellious', 'independent', 'hyper_independent', 'sassy', 'contempt_for_authority', 'anti_authoritarian'];
const TRUSTING = ['trusting_nature', 'gullible', 'innocent', 'sheltered', 'earnest'];
const SCHEMER = ['manipulator', 'cunning', 'deceitful', 'compulsive_liar', 'two_faced', 'gaslighter', 'love_bomber', 'hustler', 'opportunistic', 'cold_reader'];
const DARK = ['morbid', 'morbid_humour', 'nihilistic', 'death_wish', 'fatalist', 'cynical', 'jaded'];
const BRIGHT = ['optimistic', 'idealistic', 'hopeless_romantic', 'sunshine', 'romanticising'];
const JEALOUS = ['possessive_nature', 'jealous_nature'];
const SOCIAL = ['slutty', 'loose', 'charismatic', 'suave', 'life_of_party', 'extroverted', 'social_chameleon'];
const STORMY = ['volatile', 'hot_headed', 'moody', 'unpredictable'];
const STEADY = ['even_tempered', 'mature', 'resilient', 'thick_skinned', 'adaptable'];
const DRY = ['morbid_humour', 'sarcastic', 'deadpan', 'wry', 'roaster'];
const MINDS = ['bookish', 'nerdy', 'genius', 'logical', 'imaginative', 'pop_critic'];
const HEADSTRONG = ['stubborn', 'argumentative', 'contrarian', 'prideful', 'competitive', 'sore_loser'];
const LOYAL = ['loyal', 'loyal_to_a_fault', 'family_first', 'street_code', 'no_snitching', 'loyal_outlaw'];
const ROMANTIC = ['hopeless_romantic', 'romanticising', 'fated_love', 'idealistic', 'poetic'];

const ROWS = [
    ['Gruff and sunny', GRUFF, SUNNY, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${b}'s brightness may wear on ${a}, or get under ${a}'s guard`, false, 'romance', 'smile laugh grump cheer'],
    ['Order and chaos', ORDER, WILD, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${a} may try to rein ${b} in, and ${b} may make ${a} loosen up`, false, 'power', 'rules mess reckless careful'],
    ['Carer and cared for', CARER, NEEDS_CARE, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${a} may look after ${b} without being asked, and ${b} may lean into it or chafe`, false, 'roles', 'look after take care fuss help'],
    ['Cold and warm', COLD, WARM, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${b}'s warmth may bounce off ${a}, or be the thing ${a} can't explain wanting`, false, 'romance', 'kind cold warm care'],
    ['Wall and door', GUARDED, OPEN, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${b} may keep knocking, and ${a} may give a little more each time or shut tighter`, false, 'distance', 'ask question secret open talk'],
    ['Proud and plain', PROUD, HUMBLE, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${a} may look down on it, or find it disarming`, false, 'society', 'proud show off brag humble'],
    ['Old-fashioned and their own person', OLD_SCHOOL, OWN_WOMAN, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${a} may expect ${b} to fall in line, and ${b} may refuse; it can draw ${a} as much as it rankles`, false, 'power', 'place woman man own mind rules'],
    ['Trusting and sly', SCHEMER, TRUSTING, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${a} may find ${b} easy to read and steer, or find that trust oddly hard to betray`, false, 'mind', 'trust lie believe'],
    ['Dark and bright', DARK, BRIGHT, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${a} may scoff at ${b}'s hope, or quietly borrow some of it`, false, 'romance', 'hope dark death future'],
    ['Watchful and easy', JEALOUS, SOCIAL, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${a} may keep an eye on who ${b} charms, and ${b} may not even notice`, false, 'obsess', 'flirt other people party talk to'],
    ['Storm and anchor', STORMY, STEADY, (a, b, x, y) => `${a} is ${x} by nature and ${b} is ${y}: ${b} may steady ${a}, or ${a}'s weather may test how steady ${b} really is`, false, 'toxic', 'temper calm mood'],
    // Kindred: the same streak in both.
    ['Same dark humour', DRY, DRY, (a, b, x, y) => `both have a dry, dark streak (${a} ${x}, ${b} ${y}): they may get each other's jokes when no one else does`, true, 'allies', 'joke laugh funny'],
    ['Two minds', MINDS, MINDS, (a, b, x, y) => `both live in their heads (${a} ${x}, ${b} ${y}): talk may run long and go places others can't follow`, true, 'romance', 'book read idea think'],
    ['Partners in crime', WILD, WILD, (a, b, x, y) => `both are wild by nature (${a} ${x}, ${b} ${y}): they may egg each other on, with no one to call it off`, true, 'allies', 'dare risk party run'],
    ['Two hard heads', HEADSTRONG, HEADSTRONG, (a, b, x, y) => `both are headstrong (${a} ${x}, ${b} ${y}): neither backs down easily, which can make for sparks either way`, true, 'allies', 'argue fight win right'],
    ['Two closed books', GUARDED, GUARDED, (a, b, x, y) => `both keep themselves close (${a} ${x}, ${b} ${y}): they may understand each other's silence, or never get past it`, true, 'distance', 'quiet secret silence'],
    ['Ride or die', LOYAL, LOYAL, (a, b, x, y) => `both are loyal to the bone (${a} ${x}, ${b} ${y}): once they're each other's, it holds`, true, 'allies', 'loyal side trust family'],
    ['Two romantics', ROMANTIC, ROMANTIC, (a, b, x, y) => `both are romantics at heart (${a} ${x}, ${b} ${y}): they may make more of each moment than it is, together`, true, 'romance', 'love romance fate'],
    ['Two carers', CARER, CARER, (a, b, x, y) => `both look after people (${a} ${x}, ${b} ${y}): each may forget to let the other look after them`, true, 'romance', 'care look after'],
];
// For tests/pronouns.mjs.
export const NATURE_ROWS = ROWS;
// his, yours: trait id -> strength; core: { n: Set, u: Set } of core trait ids (count most). Traits at clear (41+).
// Returns up to three pairings, strongest first: [{ name, line, group, words }].
export function natureOf(his = {}, yours = {}, core = {}, names = { n: 'one', u: 'the other' }, word = id => id) {
    const strong = (m, c) => Object.entries(m ?? {}).filter(([, v]) => v >= 41).map(([id, v]) => [id, v + (c?.has?.(id) ? 20 : 0)]);
    const side = { n: strong(his, core.n), u: strong(yours, core.u) }, found = new Map();
    for (const [name, sa, sb, text, same, group, words] of ROWS) for (const [a, b] of same ? [['n', 'u']] : [['n', 'u'], ['u', 'n']]) {
        for (const [x, vx] of side[a]) if (sa.includes(x)) for (const [y, vy] of side[b]) if (sb.includes(y)) {
            const score = Math.min(vx, vy);
            if (!found.has(name) || found.get(name).score < score) found.set(name, { name, score, group, words, line: text(names[a], names[b], word(x), word(y)) });
        }
    }
    return [...found.values()].sort((p, q) => q.score - p.score).slice(0, 3);
}
// The line for this reply, or '': when the latest text touches the top pairing's words, or every NATURE_EVERY replies.
const NATURE_EVERY = 6;
export function natureLine(pairs, text = '', seed = 0) {
    const top = pairs?.[0]; if (!top) return '';
    const t = ` ${String(text).toLowerCase()} `, touched = top.words.split(' ').some(w => t.includes(` ${w}`));
    return touched || seed % NATURE_EVERY === 0 ? `${top.line}. A standing part of how they are together, there to draw on when it fits` : '';
}
