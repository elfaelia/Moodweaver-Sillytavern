// Pronouns for lines written with names only ("Doctor Easterman keeps Lamb because Doctor Easterman can't bear
// Lamb out of reach"). When the two people take different pronouns (so "she" can only mean one of them), each
// line keeps the first mention of each name and may use he/she after it, but only where the grammar is
// certain (see pronounize). Same pronouns or "they": the same, but only where the pronoun can mean one person.
const SETS = { he: { s: 'he', o: 'him', p: 'his', r: 'himself' }, she: { s: 'she', o: 'her', p: 'her', r: 'herself' } };
const known = new Map();
const keyOf = name => String(name ?? '').trim().toLowerCase();
export function setPronoun(name, which) { if (keyOf(name)) known.set(keyOf(name), ['he', 'she'].includes(which) ? which : 'they'); }
export const pronounOf = name => known.get(keyOf(name)) ?? 'they';
// A guess from a card or persona description: whichever of he/she the text leans on. '' when it can't tell.
export function guessPronoun(text) {
    const t = ` ${String(text ?? '').toLowerCase()} `;
    const he = (t.match(/\b(he|him|his|himself|man|male|boy|husband|father|mr)\b/g) ?? []).length, she = (t.match(/\b(she|her|hers|herself|woman|female|girl|wife|mother|mrs|miss|ms)\b/g) ?? []).length;
    return he > she * 1.3 && he >= 2 ? 'he' : she > he * 1.3 && she >= 2 ? 'she' : '';
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Pronouns only where the grammar is certain, and the name otherwise: a repeated name is never wrong, but
// "taught she its rules" and "what her became" were. A later mention becomes a pronoun in three places:
//  - possessive: "Lamb's" → "her";
//  - subject: it opens a clause ("…, Lamb", "because Lamb", "the way Lamb") and a verb follows, or a helper
//    verb follows wherever it is ("knows Lamb can't" → "knows she can't");
//  - object: right after a preposition ("for Lamb"), or right after a verb with no verb following
//    ("keeps Lamb close", "taught Lamb its rules").
// Anything else keeps the name. tests/pronouns.mjs renders every templated line through this for he/she/they.
const HELPER = /^(is|isn't|was|wasn't|has|hasn't|had|hadn't|does|doesn't|did|didn't|can|can't|cannot|will|won't|would|wouldn't|could|couldn't|should|shouldn't|must|might|may|ain't|[a-z]+n't|never|always|still|already|also|barely|simply|really|actually|just|only|half|finally|suddenly|quietly|secretly|privately|clearly)$/;
// Past tenses that don't end in -ed.
const IRREGULAR = /^(said|knew|went|came|became|began|gave|took|made|got|chose|meant|felt|kept|left|won|lost|ran|saw|heard|told|built|broke|woke|slept|bled|held|caught|taught|thought|bought|brought|sought|fought|hung|stood|understood|wrote|spoke|swore|drew|grew|threw|fell|found|ate|drank|drove|rode|fed|led|met|paid|sold|sent|spent|lent|bent|dealt|forgave|forgot|froze|hid|bit|shook|shot|slid|stole|stuck|struck|swung|tore|wore|wept|wound|sank|sat|rose|sang|rang|lay|laid|lit|fled|clung|crept|knelt|leapt|meant|owned|shrank|spun|sprang|swam)$/;
// Words ending in -s or -ed that are not verbs, so "Lamb its rules" or "his beloved Lamb" aren't read as one.
const NOT_VERB = new Set(['its', 'his', 'hers', 'this', 'thus', 'as', 'us', 'yes', 'less', 'unless', 'across', 'perhaps', 'always', 'sometimes', 'afterwards', 'towards', 'besides', 'whereas', 'nevertheless',
    'nonetheless', 'regardless', 'ones', 'years', 'days', 'nights', 'times', 'others', 'theirs', 'yours', 'ours', 'gods', 'needs', 'wants', 'rules', 'words', 'eyes', 'hands', 'lips', 'arms', 'things', 'ways', 'kids',
    'beloved', 'sacred', 'naked', 'wicked', 'kindred', 'rugged', 'jagged', 'wretched', 'crooked', 'cursed', 'blessed', 'damned', 'hundred', 'need', 'speed', 'greed', 'seed', 'feed', 'indeed', 'bed', 'red', 'shed',
    'aged', 'learned', 'ragged', 'scared', 'tired', 'bored', 'used', 'supposed', 'married', 'engaged', 'obsessed', 'possessed', 'twisted', 'devoted', 'tied', 'chained', 'locked', 'trapped', 'hooked', 'gifted',
    'one-sided', 'two-faced', 'red-handed', 'half-dressed', 'undressed', 'dressed', 'unwanted', 'wanted', 'unnamed', 'unspoken', 'unsaid']);
// Words after which the name is an object, never a subject.
const PREP = /^(to|for|with|from|at|of|in|on|by|into|onto|about|around|over|under|near|toward|towards|without|against|behind|beside|through|past|beneath|above|below|upon|within|after|before|like|than|between|among|despite|except|onto|off|via)$/;
// Words that open a clause, so a name right after them is its subject when a verb follows.
const CLAUSE = new Set(['and', 'but', 'because', 'while', 'when', 'until', 'so', 'then', 'that', 'what', 'if', 'whether', 'where', 'how', 'though', 'once', 'unless', 'whenever', 'whatever', 'since', 'or',
    'wherever', 'which', 'who', 'till', 'yet', 'although', 'way', 'everything', 'anything', 'nothing', 'something', 'all', 'time', 'thing', 'things', 'moment', 'day', 'night', 'reason', 'why', 'now', 'ones',
    'one', 'words', 'decisions', 'lies', 'times', 'ways', 'days', 'nights', 'rules', 'secrets', 'places', 'moments', 'reasons', 'promises', 'even', 'only', 'not', 'every', 'whoever', 'whichever', 'however']);
// "before Lamb wakes", "after Lamb leaves", "than Lamb does", "like Lamb is": a preposition word with a verb after.
const BOTH = new Set(['before', 'after', 'than', 'like', 'as', 'till', 'until', 'since']);
const ADJ = new Set(['other', 'another', 'same', 'whole', 'real', 'old', 'new', 'true', 'little', 'poor', 'dear', 'sweet', 'own', 'young', 'older', 'younger', 'first', 'last']);
const DETERMINER = /^(a|an|the|his|her|their|my|your|our|its|this|that|these|those|some|any|no|every|each)$/;
const ING_NOUN = new Set(['thing', 'nothing', 'something', 'anything', 'everything', 'morning', 'evening', 'darling', 'king', 'ring', 'wedding', 'feeling', 'being', 'ceiling', 'building', 'meaning', 'beginning',
    'ending', 'sibling', 'string', 'spring', 'wing', 'swing', 'during', 'nothing', 'sting', 'offspring', 'calling', 'longing', 'blessing', 'warning', 'understanding', 'upbringing', 'boring', 'loving', 'darling']);
const WANTS = new Set(['wants', 'needs']);
const verbLike = w => !!w && !NOT_VERB.has(w) && (HELPER.test(w) || IRREGULAR.test(w) || /^[a-z]{2,}(s|ed)$/.test(w));
// "they" as a subject needs the verb after it to agree ("Kenny is" → "they are", "Kenny keeps" → "they keep").
const THEY = { s: 'they', o: 'them', p: 'their', r: 'themselves' };
const THEY_VERB = { is: 'are', "isn't": "aren't", was: 'were', "wasn't": "weren't", has: 'have', "hasn't": "haven't", does: 'do', "doesn't": "don't" };
const SAME_VERB = /^(can|can't|cannot|will|won't|would|wouldn't|could|couldn't|should|shouldn't|must|might|may|had|hadn't|did|didn't)$/;
function theyVerb(w) {
    if (THEY_VERB[w]) return THEY_VERB[w];
    if (SAME_VERB.test(w) || IRREGULAR.test(w) || /^[a-z]{2,}ed$/.test(w)) return w;
    if (NOT_VERB.has(w) || !/^[a-z]{3,}s$/.test(w) || /ss$/.test(w)) return null;
    if (/^(lies|dies|ties|vies)$/.test(w)) return w.slice(0, -1);
    if (/[^aeiou]ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (/(ss|sh|ch|x|z|o)es$/.test(w)) return w.slice(0, -2);
    return w.slice(0, -1);
}
// One pass over both names in order. Different he/she: as above. The same pronoun on both sides, or "they":
// a repeat only turns into a pronoun when the other name hasn't come up since this name was last said, so
// "he" or "she" can only mean one person ("Kenny is sure his feelings…"; "Kenny tells Ellie Kenny…" keeps the name).
export function pronounize(text, n, u) {
    let out = String(text ?? '');
    const people = [[n, pronounOf(n)], [u, pronounOf(u)]].filter(([name]) => name);
    for (const [name, which] of people) out = out.replace(new RegExp(`${esc(name)}self\\b`, 'g'), SETS[which]?.r ?? 'themselves');
    const [a, b] = people;
    if (!a || !b || keyOf(a[0]) === keyOf(b[0])) return out;
    const same = a[1] === b[1];
    const setOf = which => SETS[which] ?? THEY;
    const firstWords = new Set(people.map(([name]) => keyOf(name).split(/\s+/)[0]));
    const names = [...people].sort((x, y) => y[0].length - x[0].length);
    const re = new RegExp(`(?<![\\w-])(${names.map(([name]) => esc(name)).join('|')})(['’]s)?(?![\\w-])`, 'g');
    const seen = new Set();
    let last = null, res = '', from = 0, m;
    while ((m = re.exec(out))) {
        const [hit, name, poss] = m, at = m.index, who = keyOf(name), which = people.find(([nm]) => keyOf(nm) === who)[1];
        const before = res + out.slice(from, at), after = out.slice(at + hit.length);
        const chosen = (() => {
            if (!seen.has(who)) return null;
            if (same && last !== who) return null;
            return pick(hit, poss, before, after, setOf(which), which === 'they' || !SETS[which], firstWords);
        })();
        seen.add(who); last = who;
        if (!chosen) { res = before + hit; from = at + hit.length; continue; }
        // chosen = [word, how many characters of `after` it replaced]
        res = before + chosen[0]; from = at + hit.length + chosen[1];
        re.lastIndex = from;
    }
    return res + out.slice(from);
}
function pick(hit, poss, before, after, set, they, firstWords) {
    const words = before.trimEnd().match(/([A-Za-z'’-]+)\s*$/), prev = (words?.[1] ?? '').toLowerCase().replace('’', "'");
    const trimmed = before.trimEnd();
    const prev2 = (trimmed.slice(0, trimmed.length - (words?.[0]?.length ?? 0)).match(/([A-Za-z'’-]+)\s*$/)?.[1] ?? '').toLowerCase();
    const nextM = after.match(/^(\s+)([A-Za-z'’-]+)/), next = (nextM?.[2] ?? '').toLowerCase().replace('’', "'");
    const next2 = (after.slice(nextM?.[0].length ?? 0).match(/^\s+([A-Za-z'’-]+)/)?.[1] ?? '').toLowerCase();
    const cap = w => !trimmed || /[.!?]$/.test(trimmed) ? w[0].toUpperCase() + w.slice(1) : w;
    // "Lamb's" stays a name when it means "Lamb is/has" ("Lamb's never been…").
    // "Lamb's feeling" may be "Lamb is feeling", so a word in -ing keeps the name too.
    if (poss) return /^(not|never|been|got|gone|always|still|just|already|the|a|an)$/.test(next) || (/^[a-z]{3,}ing$/.test(next) && !ING_NOUN.has(next)) ? null : [cap(set.p), 0];
    // "the other Lamb", "the old Lamb": a name used as a noun stays.
    if ((DETERMINER.test(prev) && prev !== 'that') || ADJ.has(prev)) return null;
    // "Easterman and Lamb", "Lamb or nobody": pairs read oddly with a pronoun.
    if (['and', 'or', 'nor'].includes(prev) && !verbLike(next)) return null;
    const pair = next === 'and' || next === 'or';
    // "Lamb and Easterman" stays; "likes Kenny and acts as if…" can be "likes him and acts…".
    const opens = !trimmed || /[.:;!?,(—–]$/.test(trimmed);
    if (pair && (firstWords.has(next2) || /^(the|a|an|his|her|their|everyone|anyone|nobody|no)$/.test(next2) || /^[A-Z]/.test(after.slice(nextM[0].length).trim()))) return null;
    // "wants"/"needs" are nouns in NOT_VERB, but straight after "that Kenny" or "Kenny wants" they're verbs.
    const verbNext = !pair && (verbLike(next) || (WANTS.has(next) && (opens || CLAUSE.has(prev))));
    const prep = PREP.test(prev) && !BOTH.has(prev);
    if (verbNext && (opens || CLAUSE.has(prev) || BOTH.has(prev) || (HELPER.test(next) && !prep))) {
        if (!they) return [cap(set.s), 0];
        // "they" only where the verb can be made to agree; "Kenny never says" keeps the name.
        const v = theyVerb(next); if (!v) return null;
        // "they complain and does it anyway" would need a second verb changed too, so a clause with a
        // later "and/or/but <verb>s" keeps the name, and so does "nobody, Lamb included,".
        const rest = after.slice(nextM[0].length), clause = rest.split(/[.;:!?—–]/)[0];
        if (/^\s*,/.test(rest) || [...clause.matchAll(/\b(?:and|or|but|nor)\s+(?:\w+ly\s+|never\s+|still\s+|always\s+)?([a-z']+)/g)].some(x => x[1] !== v && theyVerb(x[1]) && theyVerb(x[1]) !== x[1])) return null;
        return [`${cap('they')}${nextM[1]}${v}`, nextM[0].length];
    }
    if (prep) return [cap(set.o), 0];
    // "can't bear Lamb", "to keep Lamb": a plain verb after a helper or "to".
    const baseVerb = /^[a-z]{2,}$/.test(prev) && !PREP.test(prev) && !DETERMINER.test(prev) && !CLAUSE.has(prev) && !ADJ.has(prev) && (SAME_VERB.test(prev2) || /^(to|do|don't|doesn't|let|help|make|won't|can't|cannot)$/.test(prev2));
    const verbPrev = (verbLike(prev) || WANTS.has(prev) || baseVerb || (/^[a-z]{3,}ing$/.test(prev) && !ING_NOUN.has(prev))) && !DETERMINER.test(prev2) && !CLAUSE.has(prev);
    if (verbPrev && !verbNext && !/^(is|was|isn't|wasn't|are|were|be|been|being|becomes|became|seems|seemed)$/.test(prev)) return [cap(set.o), 0];
    return null;
}
