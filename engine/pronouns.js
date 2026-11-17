// Pronouns for lines written with names only ("Doctor Easterman keeps Lamb because Doctor Easterman can't bear
// Lamb out of reach"). When the two people take different pronouns (so "she" can only mean one of them), each
// line keeps the first mention of each name and may use he/she after it, but only where the grammar is
// certain (see pronounize). Same pronouns or "they": names stay, and only "-self" is fixed.
const SETS = { he: { s: 'he', o: 'him', p: 'his', r: 'himself' }, she: { s: 'she', o: 'her', p: 'her', r: 'herself' } };
const known = new Map();
const keyOf = name => String(name ?? '').trim().toLowerCase();
export const PRONOUN_CHOICES = [['auto', 'Auto'], ['he', 'He'], ['she', 'She'], ['they', 'They / names']];
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
const verbLike = w => !!w && !NOT_VERB.has(w) && (HELPER.test(w) || IRREGULAR.test(w) || /^[a-z]{2,}(s|ed)$/.test(w));
export function pronounize(text, n, u) {
    let out = String(text ?? '');
    const people = [[n, pronounOf(n)], [u, pronounOf(u)]].filter(([name]) => name);
    for (const [name, which] of people) out = out.replace(new RegExp(`${esc(name)}self\\b`, 'g'), SETS[which]?.r ?? 'themselves');
    const [a, b] = people;
    if (!a || !b || !SETS[a[1]] || !SETS[b[1]] || a[1] === b[1] || keyOf(a[0]) === keyOf(b[0])) return out;
    for (const [name, which] of people) {
        const set = SETS[which], re = new RegExp(`(?<![\\w-])${esc(name)}(['’]s)?(?![\\w-])`, 'g');
        let seen = 0;
        out = out.replace(re, (hit, poss, at, whole) => {
            if (seen++ === 0) return hit;
            const before = whole.slice(0, at).trimEnd(), after = whole.slice(at + hit.length);
            const words = before.match(/([A-Za-z'’-]+)\s*$/), prev = (words?.[1] ?? '').toLowerCase().replace('’', "'");
            const prev2 = (before.slice(0, before.length - (words?.[0]?.length ?? 0)).match(/([A-Za-z'’-]+)\s*$/)?.[1] ?? '').toLowerCase();
            const next = (after.match(/^\s+([A-Za-z'’-]+)/)?.[1] ?? '').toLowerCase().replace('’', "'");
            const cap = w => !before || /[.!?]$/.test(before) ? w[0].toUpperCase() + w.slice(1) : w;
            // "Lamb's" stays a name when it means "Lamb is/has" ("Lamb's never been…").
            // "Lamb's feeling" may be "Lamb is feeling", so a word in -ing keeps the name too.
            if (poss) return /^(not|never|been|got|gone|always|still|just|already|the|a|an)$/.test(next) || (/^[a-z]{3,}ing$/.test(next) && !ING_NOUN.has(next)) ? hit : cap(set.p);
            // "the other Lamb", "the old Lamb": a name used as a noun stays.
            if ((DETERMINER.test(prev) && prev !== 'that') || ADJ.has(prev)) return hit;
            // "Easterman and Lamb", "Lamb or nobody": pairs read oddly with a pronoun.
            if (['and', 'or', 'nor'].includes(prev) && !verbLike(next)) return hit;
            if (next === 'and' || next === 'or') return hit;
            const opens = !before || /[.:;!?,(—–]$/.test(before);
            const verbNext = verbLike(next);
            const prep = PREP.test(prev) && !BOTH.has(prev);
            if (verbNext && (opens || CLAUSE.has(prev) || BOTH.has(prev) || (HELPER.test(next) && !prep))) return cap(set.s);
            if (prep) return cap(set.o);
            const verbPrev = (verbLike(prev) || (/^[a-z]{3,}ing$/.test(prev) && !ING_NOUN.has(prev))) && !DETERMINER.test(prev2) && !CLAUSE.has(prev);
            if (verbPrev && !verbNext && !/^(is|was|isn't|wasn't|be|been|being|becomes|became|seems|seemed)$/.test(prev)) return cap(set.o);
            return hit;
        });
    }
    return out;
}
