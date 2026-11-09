// 1.44.0: pronouns for the Bonds lines. Cues are written with names only, which gave "Lambself" and
// "Doctor Easterman keeps Lamb because Doctor Easterman can't bear Lamb out of reach". Each cue now keeps the
// first mention of each name and uses he/she after that, when the two people take different pronouns (so
// "she" can only mean one of them). Same pronouns or "they": names stay, and only "-self" is fixed.
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
// Words that only ever follow a subject ("she can't", "he never", "she said").
const STRONG = /^(is|isn't|has|hasn't|does|doesn't|can|can't|cannot|will|won't|would|wouldn't|could|couldn't|should|shouldn't|must|might|may|never|always|still|just|already|also|was|wasn't|did|didn't|had|hadn't|half|barely|simply|really|actually|[a-z]+n't|used|said|knew|went|came|gave|took|made|got|chose|meant|felt|kept|left|won|lost|ran|saw|heard|told|built|broke|woke|slept|bled|held|caught|taught|thought|bought|brought|sought|fought|hung|stood|understood|wrote|spoke|swore|drew|grew|threw|fell|found)$/;
// Words that usually do, but can also follow an object ("keeps her locked", "gives her gifts").
const WEAK = /^([a-z]{2,}s|[a-z]{2,}ed)$/;
const CLAUSE = new Set(['and', 'but', 'because', 'while', 'when', 'until', 'so', 'then', 'that', 'what', 'if', 'whether', 'where', 'how', 'as', 'than', 'though', 'before', 'after', 'once', 'unless', 'whenever',
    'whatever', 'since', 'or', 'whoever', 'wherever', 'which', 'who', 'till', 'yet', 'although', 'way', 'whose', 'everything', 'anything', 'nothing', 'something', 'all', 'time', 'thing', 'things', 'moment', 'day',
    'night', 'reason', 'why', 'like', 'more', 'everywhere', 'anywhere', 'place', 'person', 'one', 'much', 'far', 'long', 'soon', 'hard', 'whichever', 'however', 'not', 'even', 'only', 'now', 'here', 'there',
    'ones', 'words', 'decisions', 'lies', 'times', 'ways', 'days', 'nights', 'rules', 'secrets', 'places', 'moments', 'reasons', 'promises']);
export function pronounize(text, n, u) {
    let out = String(text ?? '');
    const people = [[n, pronounOf(n)], [u, pronounOf(u)]].filter(([name]) => name);
    for (const [name, which] of people) out = out.replace(new RegExp(`${esc(name)}self\\b`, 'g'), SETS[which]?.r ?? 'themselves');
    const [a, b] = people;
    if (!a || !b || !SETS[a[1]] || !SETS[b[1]] || a[1] === b[1]) return out;
    for (const [name, which] of people) {
        const set = SETS[which], re = new RegExp(`${esc(name)}(['’]s)?(?![\\w-])`, 'g');
        let seen = 0;
        out = out.replace(re, (hit, poss, at, whole) => {
            if (seen++ === 0) return hit;
            if (poss) return set.p;
            const before = whole.slice(0, at).trimEnd(), after = whole.slice(at + hit.length);
            const prev = (before.match(/([A-Za-z'’]+)$/)?.[1] ?? '').toLowerCase(), next = (after.match(/^\s+([A-Za-z'’]+)/)?.[1] ?? '').toLowerCase().replace('’', "'");
            const opens = !before || /[.:;!?,(]$/.test(before), strong = STRONG.test(next), verb = strong || WEAK.test(next);
            // "he and Lamb", "between them and Lamb": the name stays when a pronoun would read oddly.
            if ((prev === 'and' || prev === 'or') && !verb) return hit;
            const prep = /^(to|for|with|from|at|of|in|on|by|into|onto|about|around|over|under|near|toward|towards|without|against|behind|beside|through)$/.test(prev);
            const subject = !prep && ((verb && (opens || CLAUSE.has(prev) || strong || !/(s|ed|ing)$/.test(prev))) || (next === 'and' && CLAUSE.has(prev) && prev !== 'and'));
            const word = subject ? set.s : set.o;
            return !before || /[.!?]$/.test(before) ? word[0].toUpperCase() + word.slice(1) : word;
        });
    }
    return out;
}
