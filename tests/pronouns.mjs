// Renders every line that names both people through the pronoun step, for he/she/they on each side, and
// fails on grammar that can only be wrong ("taught she its rules", "what her became", "for he").
// Run from the extension folder: node tests/pronouns.mjs        (add --show to print every changed line)
import { setPronoun, pronounize } from '../engine/pronouns.js';
import { fillPronouns, REL_PRONOUN_PROMPTS, REL_PRONOUN_SCALED } from '../engine/rel-pronouns.js';
import { DYNAMICS } from '../data/catalogue/dynamics.js';
import { MORE_METERS } from '../engine/meters.js';
import { COMBOS } from '../engine/reactive.js';
import { LINK_LINES } from '../engine/links.js';
import { NATURE_ROWS } from '../engine/nature.js';
import { SKILL_COMBOS } from '../data/catalogue/skills.js';
import { turnOnsLine } from '../engine/prompt.js';
import { PERIOD } from '../data/catalogue/period.js';

const N = 'Doctor Easterman', U = 'Lamb', show = process.argv.includes('--show');
const lines = [
    ...DYNAMICS.map(r => [`dynamic "${r[0]}"`, r[2]]),
    ...MORE_METERS.flatMap(m => [[`meter ${m[1]} high`, m[6]], [`meter ${m[1]} low`, m[7]]]).filter(([, f]) => f),
    ...COMBOS.map(r => [`combo "${r[0]}"`, r[2]]),
    ...LINK_LINES.ROLE_LINKS.map((r, i) => [`role link ${i + 1}`, r[2]]),
    ...LINK_LINES.TIE_LINKS.map((r, i) => [`tie link ${i + 1}`, r[3]]),
    ...LINK_LINES.CORE_BENDS.map((r, i) => [`core link ${i + 1}`, (n, u) => r[2](n, u, 'the slow burn')]),
    ...LINK_LINES.NATURE_MOOD.flatMap((r, i) => [[`nature-mood ${i + 1}`, (n, u) => r[2](n, u, 'stubborn', 'sad')], [`nature-mood ${i + 1} reversed`, (n, u) => r[2](u, n, 'stubborn', 'sad')]]),
    ...NATURE_ROWS.flatMap(r => [[`nature "${r[0]}"`, (n, u) => r[3](n, u, 'stubborn', 'warm')], [`nature "${r[0]}" reversed`, (n, u) => r[3](u, n, 'stubborn', 'warm')]]),
    ...SKILL_COMBOS.map(r => [`skill combo ${r[0]}+${r[1]}`, (n, u) => r[2].replaceAll('{n}', n).replaceAll('{u}', u)]),
    // Period lines: {who} is one of them, {other} the other, either way round.
    ...PERIOD.flatMap(l => ['he', 'she', 'any'].filter(g => l[g] && /\{other\}/.test(l[g])).flatMap(g => [
        [`period ${l.id} (${g}, about N)`, (n, u) => l[g].replaceAll('{who}', n).replaceAll('{other}', u).replaceAll('{age}', '30')],
        [`period ${l.id} (${g}, about U)`, (n, u) => l[g].replaceAll('{who}', u).replaceAll('{other}', n).replaceAll('{age}', '30')]])),
    ['turn-ons line', (n, u) => turnOnsLine(n, u, { known: true, suspected: true, unknown: true })],
];
// "her" is also the possessive ("her wants"), so it only counts before words that can't be nouns.
const SUBJ = 'is|was|has|had|does|did|can|can\'t|will|won\'t|would|wouldn\'t|could|couldn\'t|should|must|might|became|knew|went|came|said|never';
const BAD = [
    [/\b(to|for|with|from|at|of|into|onto|about|around|toward|towards|without|against|behind|beside|through|by)\s+(he|she)\b/i, 'subject pronoun after a preposition'],
    [/\b(other|another|same|whole|the|a|an)\s+(he|she|him)\b/i, 'pronoun used as a noun'],
    // "can't see her waiting for more" is an object, so "her" after a seeing/keeping verb is fine.
    [/(?<!\b(?:see|saw|seen|watch|watches|watched|hear|hears|heard|find|finds|found|catch|catches|caught|leave|leaves|left|keep|keeps|kept|feel|feels|felt|imagine|imagines|picture|pictures)\s)\b(his|her)\s+\w+ing\b(?=\s+(for|about|that|it|him|her))/i, 'possessive where "is" was meant'],
    [/\b(taught|told|gave|made|keeps|lets|makes|watches|raised|leaves|wants|needs)\s+(he|she)\b(?!\s+(is|was|has|had|does|did|can|will|would|could|should|must|might|never|always|still)\b)/i, 'subject pronoun where an object belongs'],
    [new RegExp(`(?<!\\b(?:with|for|to|from|of|at|by|about|without|against|near)\\s)\\b(him|her)\\s+(${SUBJ})\\b`, 'i'), 'object pronoun where a subject belongs'],
    [/\bhim\s+(thinks|knows|wants|needs|feels|keeps|says|does|gets|makes|takes)\b/i, 'object pronoun where a subject belongs'],
    [/\b(he|she)\s+(its|the|a|an|his|her|their|my|your|him|them)\b/i, 'subject pronoun followed by an object'],
    [/\b(\w+)self\b/, 'name-self left in'],
    [/\b(he|she|him|her|his)\s+and\s+(he|she|him|her)\b/i, 'two pronouns joined'],
];
const combos = [['he', 'she'], ['she', 'he'], ['he', 'he'], ['she', 'she'], ['they', 'she'], ['he', 'they'], ['they', 'they']];
let fails = 0, changed = 0;
for (const [pn, pu] of combos) {
    setPronoun(N, pn); setPronoun(U, pu);
    for (const [label, make] of lines) {
        for (const [n, u] of [[N, U], [U, N]]) {
            const raw = make(n, u), out = pronounize(raw, n, u);
            if (out !== raw) { changed++; if (show) console.log(`${pn}/${pu} ${label}\n  ${raw}\n  ${out}`); }
            for (const [re, why] of BAD) if (re.test(out) && !re.test(raw.replace(/\b(Doctor Easterman|Lamb)\b/g, 'X'))) { fails++; console.log(`✗ ${pn}/${pu} ${label}: ${why}\n  ${out}`); }
        }
    }
}
// The relationship lines mark their pronouns ({s.their}, {o.they:give|gives}), so nothing should be left over.
for (const s of ['he', 'she', 'they']) for (const o of ['he', 'she', 'they']) {
    for (const [id, text] of Object.entries({ ...REL_PRONOUN_PROMPTS, ...REL_PRONOUN_SCALED })) for (const t of Array.isArray(text) ? text.map(r => r[1]) : [text]) {
        const out = fillPronouns(t, s, o);
        if (/\{[so]\./.test(out)) { fails++; console.log(`✗ relationship ${id} ${s}/${o}: a marker was left in\n  ${out}`); }
    }
}
console.log(`${lines.length} lines × ${combos.length} pronoun pairs × both directions: ${changed} lines changed, ${fails} problems.`);
process.exit(fails ? 1 : 0);
