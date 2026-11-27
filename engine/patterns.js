// The pattern breaker. Reads the character's last few replies (no extra request) and finds the
// shapes Claude keeps reusing: pet-name tics in dialogue, paired-adjective movement phrases, the same
// sentence openings, recurring word chunks and stock constructions. The Opus 5.5 prompting guide says
// naming the exact patterns to avoid works where a general "don't repeat yourself" just swaps one
// default for another, so each finding is quoted back with real examples.

// Plain prose from a stored reply: no board, weave line, HTML, reasoning or markdown emphasis.
function proseOf(mes) {
    return String(mes ?? '')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<div[^>]*ihyll-style[\s\S]*?<\/div>/gi, ' ')
        .replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/^[^\n<]{0,6}<b>[^<:]{1,60}:\s*<\/b>.*$/gm, ' ')
        .replace(/<[^>]+>/g, ' ').replace(/[*_~`]+/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/[\u2019\u2018]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[ \t]+/g, ' ').trim();
}
const STOP = new Set(('a an the and or but of to in on at for with from by as is was were be been it its it\'s he she they him her them his their hers theirs '
    + 'i you your my me we us our that this these those there then than so if not no do does did have has had into out up down over just '
    + 'what which who whom when where while like can could would should will one all some any more most very too also only even still').split(' '));
// Contractions and everyday words are never a pattern. "doesn't", "couldn't", "because" and "nothing" are
// seven letters long, so they used to be listed as "distinctive words worn thin", and Opus then wrote "does not".
const COMMON = new Set(('because nothing without through against another already himself herself between thought something anything '
    + 'everything someone anyone everyone looking another before around enough instead getting against whether nobody minute moment '
    + 'started turning towards toward across behind beneath inside outside further finally actually exactly probably perhaps').split(' '));
const plain = w => STOP.has(w) || COMMON.has(w) || w.includes("'");
const words = s => s.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean);
const dialogue = s => [...s.matchAll(/"([^"]{1,400})"/g)].map(m => m[1]);
const sentences = s => s.split(/(?<=[.!?\u2026])\s+|\n+/).map(x => x.trim()).filter(x => x.length > 2);
const PET_ADJ = 'little|sweet|dear|darling|poor|precious|clever|wicked|cruel|naughty|silly|stupid|good|bad|pretty|beautiful|filthy|dirty|lovely|wretched|stubborn|brave|foolish|perfect';
const PET_NOUN = 'devil|monster|bully|brat|menace|beast|wretch|creature|thing|minx|vixen|lamb|dove|bird|pet|girl|boy|darling|dear|love|sweetheart|angel|doll|fool|idiot|liar|tyrant|terror|nightmare|tease|heathen|sinner|patient|subject|child|one|treasure|wonder|miracle';
const PET_RE = new RegExp(`\\b(?:oh,?\\s+)?(?:you|my)\\s+(?:(?:${PET_ADJ})\\s+)?(?:${PET_NOUN})\\b`, 'gi');
const EXCLAIM_RE = /\bwhat\s+a\s+(?:[a-z]+\s+){0,2}(?:thing|creature|sight|mess|girl|boy|man|woman|darling|devil|monster)\b/gi;
const PAIRED_RE = /\b(?:a|an|one|in one|with a|with one)\s+([a-z]+),\s+([a-z]+)\s+([a-z]+)/gi;
const MOTION_RE = /\b(?:in|with)\s+(?:one|a)\s+(?:[a-z]+[ ,]+){0,2}(?:motion|movement|gesture|flourish|sweep|move|twist|flick|stroke|jerk|pass)\b/gi;
const STOCK = [
    ['\u201cnot X, but Y\u201d / \u201cit\u2019s not X, it\u2019s Y\u201d turns', /\b(?:it'?s|it was|this is|that'?s)\s+not\s+[^.?!]{1,40}[.,;\u2014-]+\s*(?:it'?s|it was|but)\b|\bnot\s+[a-z]+,\s+but\s+[a-z]+/gi],
    ['\u201csomething [shifts/tightens/cracks]\u201d vagueness', /\bsomething\s+(?:in\s+\w+\s+\w+\s+)?(?:shifts?|shifted|tightens?|tightened|cracks?|cracked|loosens?|loosened|settles?|settled|twists?|twisted|stirs?|stirred|flickers?|flickered|breaks?|broke)\b/gi],
    ['\u201cthe way [someone] \u2026\u201d fixation', /\bthe way (?:he|she|they|you|her|his|their)\s+\w+/gi],
    ['a breath they didn\u2019t know they were holding / let out a breath', /\b(?:let(?:s)? out a breath|a breath (?:he|she|they) didn'?t know|breath (?:he|she|they)'?d been holding)\b/gi],
    ['eyes darkening / something flickering in the eyes', /\b(?:eyes|gaze)\s+(?:darken|darkened|darkening|flicker|flickered|glint|glinted)\b|\bsomething\s+flicker\w*\s+(?:in|behind|across)\s+(?:his|her|their)\s+(?:eyes|face|gaze)\b/gi],
];
const count = (map, key, example, reply) => { const e = map.get(key) ?? { n: 0, replies: new Set(), ex: [] }; e.n++; e.replies.add(reply); if (e.ex.length < 4 && !e.ex.some(x => x.toLowerCase() === example.toLowerCase())) e.ex.push(example); map.set(key, e); };
// A beat: subject, then a plain verb or a negation, and done (\u201cHe doesn't wait.\u201d, \u201cShe doesn't answer.\u201d, \u201cHe stops.\u201d).
const BEAT_RE = /^(?:he|she|they|it|i|[A-Z][a-z]+)\s+(?:(?:does ?n[o']t|did ?n[o']t|do ?n[o']t|won'?t|can'?t|is ?n[o']t|was ?n[o']t|never|barely|just|only)\s+)?[a-z]+(?:\s+[a-z]+){0,2}[.!]$/;
const tidy = s => s.replace(/\s+/g, ' ').trim();

// texts: the character's last replies, oldest first (raw message text is fine). names: words to ignore
// (character and player names). Returns [{ label, examples, n }], strongest first.
export function findPatterns(texts, { names = [], max = 8 } = {}) {
    const replies = (texts ?? []).map(proseOf).filter(t => t.length > 40).slice(-5);
    if (replies.length < 2) return [];
    const ignore = new Set(names.flatMap(n => words(String(n))));
    const out = [];
    // 1. Pet names and exclamations in dialogue.
    const pets = new Map();
    replies.forEach((t, r) => { for (const line of dialogue(t)) for (const re of [PET_RE, EXCLAIM_RE]) for (const m of line.matchAll(re)) count(pets, 'pet', tidy(m[0]), r); });
    const pet = pets.get('pet');
    if (pet && pet.n >= 3 && pet.replies.size >= 2) out.push({ label: 'calling someone by a pet name or epithet in the same shape (\u201cyou little ___\u201d, \u201cmy ___\u201d, \u201coh, you ___\u201d, \u201cwhat a ___ thing\u201d)', examples: pet.ex, n: pet.n + 2 });
    // 2. Paired adjectives in front of a noun, and \u201cin one ___ motion\u201d.
    const shapes = new Map();
    replies.forEach((t, r) => {
        for (const m of t.matchAll(PAIRED_RE)) if (!STOP.has(m[1].toLowerCase()) && !STOP.has(m[2].toLowerCase())) count(shapes, 'paired', tidy(m[0]), r);
        for (const m of t.matchAll(MOTION_RE)) count(shapes, 'motion', tidy(m[0]), r);
    });
    const paired = shapes.get('paired'), motion = shapes.get('motion');
    if (paired && paired.n >= 3 && paired.replies.size >= 2) out.push({ label: 'two comma-joined adjectives in front of a noun (\u201ca short, clean motion\u201d)', examples: paired.ex, n: paired.n + 1 });
    if (motion && motion.n >= 2 && motion.replies.size >= 2) out.push({ label: 'describing a movement as \u201cin one ___ motion / with a ___ flourish\u201d', examples: motion.ex, n: motion.n + 1 });
    // 3. Stock constructions.
    for (const [label, re] of STOCK) {
        const hits = new Map();
        replies.forEach((t, r) => { for (const m of t.matchAll(re)) count(hits, 'x', tidy(m[0]), r); });
        const h = hits.get('x');
        if (h && h.n >= 3 && h.replies.size >= 2) out.push({ label, examples: h.ex.slice(0, 3), n: h.n });
    }
    // 3b. Beat sentences (2.0.25): a short narration sentence that sums up what someone does or doesn't do
    // (\u201cHe doesn't wait.\u201d), with the action that shows it in the next, longer sentence.
    const beats = new Map();
    replies.forEach((t, r) => {
        const ss = sentences(t.replace(/"[^"]*"/g, ' \n '));
        ss.forEach((x, i) => { const w = words(x); if (w.length >= 2 && w.length <= 5 && BEAT_RE.test(x) && words(ss[i + 1] ?? '').length >= 9) count(beats, 'beat', tidy(x), r); });
    });
    const beat = beats.get('beat');
    if (beat && beat.n >= 3 && beat.replies.size >= 2) out.push({ label: 'a short standalone beat sentence about what someone does or doesn\u2019t do, then a longer sentence that shows it', examples: beat.ex.slice(0, 3), n: beat.n });
    // 4. The same sentence opening, and replies that all start the same way.
    const openers = new Map(); let total = 0;
    replies.forEach((t, r) => { for (const s of sentences(t)) { const w = words(s.replace(/^"/, '')).slice(0, 2); if (w.length < 2 || ignore.has(w[0])) continue; total++; count(openers, w.join(' '), s.split(/\s+/).slice(0, 5).join(' '), r); } });
    const topOpen = [...openers.entries()].filter(([k, e]) => e.n >= 4 && e.n / Math.max(total, 1) >= 0.08 && e.replies.size >= 3 && !/^(i |the )/.test(k)).sort((a, b) => b[1].n - a[1].n)[0];
    if (topOpen) out.push({ label: `sentences opening with \u201c${topOpen[0]} \u2026\u201d (${topOpen[1].n} times)`, examples: topOpen[1].ex.slice(0, 3), n: topOpen[1].n });
    const firsts = replies.map(t => words(sentences(t)[0] ?? '').slice(0, 3).join(' ')).filter(Boolean);
    const sameStart = firsts.find((f, i) => firsts.filter(x => x === f).length >= 3 && firsts.indexOf(f) === i);
    if (sameStart) out.push({ label: `starting replies the same way (\u201c${sameStart} \u2026\u201d)`, examples: [], n: 5 });
    // 5. Word chunks (4 words) that keep coming back across replies.
    const grams = new Map();
    replies.forEach((t, r) => {
        const seen = new Set(), w = words(t);
        for (let i = 0; i + 4 <= w.length; i++) {
            const g = w.slice(i, i + 4);
            if (g.filter(x => !plain(x) && !ignore.has(x)).length < 2) continue;
            const k = g.join(' '); if (seen.has(k)) continue; seen.add(k); count(grams, k, k, r);
        }
    });
    const chunks = [...grams.entries()].filter(([, e]) => e.replies.size >= 3).sort((a, b) => b[1].replies.size - a[1].replies.size).map(([k]) => k);
    const kept = []; for (const c of chunks) if (!kept.some(k => k.includes(c.split(' ').slice(1, 3).join(' ')))) kept.push(c);
    if (kept.length) out.push({ label: 'phrases repeated across replies', examples: kept.slice(0, 4).map(k => `\u201c${k}\u201d`), n: 4, quoted: true });
    // 6. Distinctive words worn thin: in 4 or more of the last 5 replies.
    const vocab = new Map();
    replies.forEach((t, r) => { for (const w of new Set(words(t))) if (w.length >= 7 && !plain(w) && !ignore.has(w)) count(vocab, w, w, r); });
    const worn = [...vocab.entries()].filter(([, e]) => e.replies.size >= Math.min(4, replies.length) && e.n >= 4).map(([w]) => w).slice(0, 6);
    if (worn.length >= 2) out.push({ label: 'the same distinctive words in nearly every reply', examples: worn, n: 3 });
    // 7. Shapes of the writing itself (1.97), not just repeated words: the breaker missed a reply full of comparisons
    // because no single phrase came back. Each needs to show in most of the last replies.
    const many = k => replies.length >= 3 && k >= Math.min(4, replies.length);
    const paras = replies.map(t => t.split(/\n\s*\n|\n/).map(x => x.trim()).filter(x => x.length > 20));
    const sims = replies.map(t => [...t.matchAll(/\b(?:like (?:a|an|the|some|his|her|their)|as if|as though)\b[^.,;!?"]{0,24}/gi)].map(m => tidy(m[0])));
    if (many(sims.filter(x => x.length >= 2).length)) out.push({ label: 'comparisons in nearly every paragraph (like a\u2026, as if\u2026); use one at most this reply, or none', examples: sims.flat().slice(0, 3), n: 6, quoted: false });
    const shortEnds = paras.flat().filter(pg => { const last = sentences(pg).at(-1) ?? ''; return sentences(pg).length > 1 && words(last).length <= 6; }).length, allParas = paras.flat().filter(pg => sentences(pg).length > 1).length;
    if (allParas >= 8 && shortEnds / allParas >= 0.5) out.push({ label: 'paragraphs ending on a short punchy sentence; end them mid-flow this reply', examples: [], n: 5 });
    const endTalk = paras.filter(ps => /^"/.test(ps.at(-1) ?? '')).length, endAsk = replies.filter(t => /\?["\u201d]?\s*$/.test(t)).length;
    if (many(endTalk)) out.push({ label: 'ending every reply on a line of dialogue; end this one on an action', examples: [], n: 4 });
    if (endAsk >= 3) out.push({ label: 'ending replies on a question; end this one on an action or a statement', examples: [], n: 4 });
    const triads = replies.map(t => (t.match(/\b[a-z]+, (?:[a-z]+ ){0,2}[a-z]+,? and [a-z]+\b/gi) ?? []).length);
    if (many(triads.filter(k => k >= 2).length)) out.push({ label: 'lists of three (this, that, and the other); use pairs or single details this reply', examples: [], n: 4 });
    const ingOpen = replies.map(t => sentences(t).filter(x => /^[A-Z][a-z]+ing\b[^,.]{0,40},/.test(x)).length);
    if (many(ingOpen.filter(k => k >= 2).length)) out.push({ label: 'sentences opening on an -ing clause (Leaning in, he\u2026); open sentences on the subject or the action this reply', examples: [], n: 4 });
    const pro = replies.flatMap(t => sentences(t).filter(x => !x.startsWith('"'))), proStart = pro.filter(x => /^(he|she|they|his|her|their)\b/i.test(x) || ignore.has(words(x)[0] ?? '')).length;
    if (pro.length >= 20 && proStart / pro.length >= 0.45) out.push({ label: `most sentences starting with he, she or a name (${Math.round(100 * proStart / pro.length)}%); vary how sentences open`, examples: [], n: 5 });
    const counts = paras.map(ps => ps.length), lastFour = counts.slice(-4);
    if (lastFour.length >= 4 && lastFour.every(k => k === lastFour[0])) out.push({ label: `every reply ${lastFour[0]} paragraphs long; change the shape and length this reply`, examples: [], n: 3 });
    return out.sort((a, b) => b.n - a.n).slice(0, max);
}

// The prompt block. strength: the Pattern breaker slider (1\u2013100).
export function patternLines(found, strength = 60) {
    if (!found?.length) return [];
    const list = found.slice(0, strength >= 61 ? 8 : strength >= 21 ? 5 : 3);
    return [`Pattern breaker. The last few replies fell into these habits; break every one of them in this reply:`,
        ...list.map(p => `- ${p.label}${p.examples.length ? `: ${p.quoted ? p.examples.join(', ') : p.examples.map(e => `\u201c${e}\u201d`).join(', ')}` : ''}`),
        `Breaking a habit means doing something different in its place, not the same move in new words or a near lookalike. Only these habits are out; ordinary words and contractions stay as normal.${strength >= 81 ? ' Vary sentence length, sentence openings and paragraph shape across the whole reply too.' : ''}`];
}
