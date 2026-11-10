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
        .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[ \t]+/g, ' ').trim();
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
const sentences = s => s.split(/(?<=[.!?…])\s+|\n+/).map(x => x.trim()).filter(x => x.length > 2);
const PET_ADJ = 'little|sweet|dear|darling|poor|precious|clever|wicked|cruel|naughty|silly|stupid|good|bad|pretty|beautiful|filthy|dirty|lovely|wretched|stubborn|brave|foolish|perfect';
const PET_NOUN = 'devil|monster|bully|brat|menace|beast|wretch|creature|thing|minx|vixen|lamb|dove|bird|pet|girl|boy|darling|dear|love|sweetheart|angel|doll|fool|idiot|liar|tyrant|terror|nightmare|tease|heathen|sinner|patient|subject|child|one|treasure|wonder|miracle';
const PET_RE = new RegExp(`\\b(?:oh,?\\s+)?(?:you|my)\\s+(?:(?:${PET_ADJ})\\s+)?(?:${PET_NOUN})\\b`, 'gi');
const EXCLAIM_RE = /\bwhat\s+a\s+(?:[a-z]+\s+){0,2}(?:thing|creature|sight|mess|girl|boy|man|woman|darling|devil|monster)\b/gi;
const PAIRED_RE = /\b(?:a|an|one|in one|with a|with one)\s+([a-z]+),\s+([a-z]+)\s+([a-z]+)/gi;
const MOTION_RE = /\b(?:in|with)\s+(?:one|a)\s+(?:[a-z]+[ ,]+){0,2}(?:motion|movement|gesture|flourish|sweep|move|twist|flick|stroke|jerk|pass)\b/gi;
const STOCK = [
    ['“not X, but Y” / “it’s not X, it’s Y” turns', /\b(?:it'?s|it was|this is|that'?s)\s+not\s+[^.?!]{1,40}[.,;—-]+\s*(?:it'?s|it was|but)\b|\bnot\s+[a-z]+,\s+but\s+[a-z]+/gi],
    ['“something [shifts/tightens/cracks]” vagueness', /\bsomething\s+(?:in\s+\w+\s+\w+\s+)?(?:shifts?|shifted|tightens?|tightened|cracks?|cracked|loosens?|loosened|settles?|settled|twists?|twisted|stirs?|stirred|flickers?|flickered|breaks?|broke)\b/gi],
    ['“the way [someone] …” fixation', /\bthe way (?:he|she|they|you|her|his|their)\s+\w+/gi],
    ['a breath they didn’t know they were holding / let out a breath', /\b(?:let(?:s)? out a breath|a breath (?:he|she|they) didn'?t know|breath (?:he|she|they)'?d been holding)\b/gi],
    ['eyes darkening / something flickering in the eyes', /\b(?:eyes|gaze)\s+(?:darken|darkened|darkening|flicker|flickered|glint|glinted)\b|\bsomething\s+flicker\w*\s+(?:in|behind|across)\s+(?:his|her|their)\s+(?:eyes|face|gaze)\b/gi],
];
const count = (map, key, example, reply) => { const e = map.get(key) ?? { n: 0, replies: new Set(), ex: [] }; e.n++; e.replies.add(reply); if (e.ex.length < 4 && !e.ex.some(x => x.toLowerCase() === example.toLowerCase())) e.ex.push(example); map.set(key, e); };
const tidy = s => s.replace(/\s+/g, ' ').trim();

// texts: the character's last replies, oldest first (raw message text is fine). names: words to ignore
// (character and player names). Returns [{ label, examples, n }], strongest first.
export function findPatterns(texts, { names = [], max = 6 } = {}) {
    const replies = (texts ?? []).map(proseOf).filter(t => t.length > 40).slice(-5);
    if (replies.length < 2) return [];
    const ignore = new Set(names.flatMap(n => words(String(n))));
    const out = [];
    // 1. Pet names and exclamations in dialogue.
    const pets = new Map();
    replies.forEach((t, r) => { for (const line of dialogue(t)) for (const re of [PET_RE, EXCLAIM_RE]) for (const m of line.matchAll(re)) count(pets, 'pet', tidy(m[0]), r); });
    const pet = pets.get('pet');
    if (pet && pet.n >= 3 && pet.replies.size >= 2) out.push({ label: 'calling someone by a pet name or epithet in the same shape (“you little ___”, “my ___”, “oh, you ___”, “what a ___ thing”)', examples: pet.ex, n: pet.n + 2 });
    // 2. Paired adjectives in front of a noun, and “in one ___ motion”.
    const shapes = new Map();
    replies.forEach((t, r) => {
        for (const m of t.matchAll(PAIRED_RE)) if (!STOP.has(m[1].toLowerCase()) && !STOP.has(m[2].toLowerCase())) count(shapes, 'paired', tidy(m[0]), r);
        for (const m of t.matchAll(MOTION_RE)) count(shapes, 'motion', tidy(m[0]), r);
    });
    const paired = shapes.get('paired'), motion = shapes.get('motion');
    if (paired && paired.n >= 3 && paired.replies.size >= 2) out.push({ label: 'two comma-joined adjectives in front of a noun (“a short, clean motion”)', examples: paired.ex, n: paired.n + 1 });
    if (motion && motion.n >= 2 && motion.replies.size >= 2) out.push({ label: 'describing a movement as “in one ___ motion / with a ___ flourish”', examples: motion.ex, n: motion.n + 1 });
    // 3. Stock constructions.
    for (const [label, re] of STOCK) {
        const hits = new Map();
        replies.forEach((t, r) => { for (const m of t.matchAll(re)) count(hits, 'x', tidy(m[0]), r); });
        const h = hits.get('x');
        if (h && h.n >= 3 && h.replies.size >= 2) out.push({ label, examples: h.ex.slice(0, 3), n: h.n });
    }
    // 4. The same sentence opening, and replies that all start the same way.
    const openers = new Map(); let total = 0;
    replies.forEach((t, r) => { for (const s of sentences(t)) { const w = words(s.replace(/^"/, '')).slice(0, 2); if (w.length < 2 || ignore.has(w[0])) continue; total++; count(openers, w.join(' '), s.split(/\s+/).slice(0, 5).join(' '), r); } });
    const topOpen = [...openers.entries()].filter(([k, e]) => e.n >= 4 && e.n / Math.max(total, 1) >= 0.08 && e.replies.size >= 3 && !/^(i |the )/.test(k)).sort((a, b) => b[1].n - a[1].n)[0];
    if (topOpen) out.push({ label: `sentences opening with “${topOpen[0]} …” (${topOpen[1].n} times)`, examples: topOpen[1].ex.slice(0, 3), n: topOpen[1].n });
    const firsts = replies.map(t => words(sentences(t)[0] ?? '').slice(0, 3).join(' ')).filter(Boolean);
    const sameStart = firsts.find((f, i) => firsts.filter(x => x === f).length >= 3 && firsts.indexOf(f) === i);
    if (sameStart) out.push({ label: `starting replies the same way (“${sameStart} …”)`, examples: [], n: 5 });
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
    if (kept.length) out.push({ label: 'phrases repeated across replies', examples: kept.slice(0, 4).map(k => `“${k}”`), n: 4, quoted: true });
    // 6. Distinctive words worn thin: in 4 or more of the last 5 replies.
    const vocab = new Map();
    replies.forEach((t, r) => { for (const w of new Set(words(t))) if (w.length >= 7 && !plain(w) && !ignore.has(w)) count(vocab, w, w, r); });
    const worn = [...vocab.entries()].filter(([, e]) => e.replies.size >= Math.min(4, replies.length) && e.n >= 4).map(([w]) => w).slice(0, 6);
    if (worn.length >= 2) out.push({ label: 'the same distinctive words in nearly every reply', examples: worn, n: 3 });
    return out.sort((a, b) => b.n - a.n).slice(0, max);
}

// The prompt block. strength: the Pattern breaker slider (1–100).
export function patternLines(found, strength = 60) {
    if (!found?.length) return [];
    const list = found.slice(0, strength >= 61 ? 6 : strength >= 21 ? 4 : 2);
    return [`Pattern breaker: the last few replies keep reusing these shapes. Don’t use them in this reply, not even with the words swapped, and don’t swap in a lookalike:`,
        ...list.map(p => `- ${p.label}${p.examples.length ? `: ${p.quoted ? p.examples.join(', ') : p.examples.map(e => `“${e}”`).join(', ')}` : ''}`),
        `Write those beats another way: a different sentence shape, a different kind of detail, or leave the beat out. Only these exact shapes are out: ordinary words and contractions (doesn't, can't, he's) stay as normal.${strength >= 81 ? ' Vary sentence length and paragraph openings across the whole reply too.' : ''}`];
}
