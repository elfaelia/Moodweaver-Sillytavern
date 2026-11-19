// Skills: a level out of 10 per person, for the skills picked for them (data/catalogue/skills.js).
// Everyone's skills go as one short names-and-levels line. A skill's full description, the rule on how attempts go
// and any combo line only go when the scene calls for it: its words come up in the player's latest message or the
// last reply, the hidden line says someone used it last reply, or what's happening fits it (its `when` tokens:
// feelings, Mind settings, the dynamic, facts). Its level decides how attempts go. Picked skills also grow slowly with use and slip after long disuse, at their own
// pace; a pinned one stays where it is. Pure functions; app/ does the reading.
import { SKILL_COMBOS, SKILL_GROUPS, SKILL_MERGED } from '../data/catalogue/skills.js';
import { pronounize } from './pronouns.js';
import { sceneHas } from './util.js';

const norm = s => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’‘]/g, "'");
export { SKILL_GROUPS };
export const SKILL_BY_ID = Object.fromEntries(SKILL_GROUPS.flatMap(g => g.rows.map(r => [r.id, { ...r, prompt: r.prompt || r.label.toLowerCase(), group: g.name, color: g.color }])));

// 1–10, worded so the number and the word agree; the rule line in the note says what a level does. Below zero
// (-1 to -10, the same reach as the good side) someone is actively bad at it: a hopeless liar, a cook whose food
// tastes wrong.
const SKILL_LEVELS = [[10, 'master'], [9, 'expert'], [7, 'skilled'], [5, 'competent'], [3, 'amateur'], [1, 'novice'], [-2, 'shaky'], [-4, 'poor'], [-6, 'bad'], [-8, 'terrible'], [-10, 'hopeless']];
export const skillWord = v => v === 0 ? 'off' : SKILL_LEVELS.find(([min]) => v >= min)?.[1] ?? 'hopeless';
export const SKILL_MIN = -10;
// Before 1.76 the bad side went to −5. Saved levels from then are doubled once, so each keeps its word
// (−5 hopeless becomes −10 hopeless); state.skillScale = 2 marks a state as already on the even scale.
export const SKILL_SCALE = 2;
export const widenSkills = (obj, scale) => scale === SKILL_SCALE ? obj : Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).map(([id, v]) => [id, Number(v) < 0 ? Number(v) * 2 : v]));
const level = v => Math.max(SKILL_MIN, Math.min(10, Math.round(Number(v) || 0)));
const known = id => SKILL_BY_ID[id] ? id : SKILL_BY_ID[SKILL_MERGED[id]] ? SKILL_MERGED[id] : '';
// Levels by id. Skills from older versions move to the one that replaced them; the higher level wins.
export function cleanSkills(obj = {}) {
    const out = {};
    for (const [id, v] of Object.entries(obj && typeof obj === 'object' ? obj : {})) { const to = known(id); if (to && level(v) !== 0) out[to] = out[to] === undefined ? level(v) : Math.max(out[to], level(v)); }
    return out;
}
export const cleanPins = obj => Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).filter(([id, v]) => v && SKILL_BY_ID[id]).map(([id]) => [id, true]));
// Progress per skill: [uses toward the next level, replies since it was last used].
export const cleanXp = obj => Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).filter(([id, v]) => SKILL_BY_ID[id] && Array.isArray(v))
    .map(([id, [uses, idle]]) => [id, [Math.max(0, Math.round(Number(uses) || 0)), Math.max(0, Math.round(Number(idle) || 0))]]));

// How fast picked skills change by themselves. per: uses needed per level (times the current level, so
// 4 → 5 takes four times as long as 1 → 2). rust: replies without using it before it slips a level.
export const SKILL_PACE = {
    off: { label: 'Off: only by hand' },
    slow: { label: 'Slow', per: 8, rust: 150 },
    steady: { label: 'Steady', per: 4, rust: 100 },
    quick: { label: 'Quick', per: 2, rust: 50 },
};
export const cleanSkillPace = v => SKILL_PACE[v] ? v : 'slow';

// Words → patterns. "a|b c|stem*": whole words, spaces match any gap, '*' allows any ending.
const patterns = new Map();
const escapeRe = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const termsOf = words => [...new Set(norm(words).split(/[|,;]/).map(w => w.trim()).filter(w => w.length > 1))];
const termRe = w => new RegExp(`(?:^|[^a-z'])(?:${escapeRe(w.replace(/\*$/, '')).replace(/\s+/g, "[\\s-]+") + (w.endsWith('*') ? "[a-z']*" : '')})(?![a-z])`, 'i');
function patternFor(words) {
    if (patterns.has(words)) return patterns.get(words);
    const parts = termsOf(words);
    const re = parts.length ? new RegExp(parts.map(w => termRe(w).source).join('|'), 'i') : null;
    patterns.set(words, re); return re;
}
const calledFor = (words, scene) => Boolean(patternFor(words)?.test(scene));
// How strongly a passage calls for a skill. Each of its words that turns up counts once: a phrase 3, a word of four
// letters or more 2, a shorter one 1, divided by how many skills share that word, and a quarter for everyday words
// (COMMON). A skill is called for at 1 or more, so one telling word ("anatomy", "kiss") is enough while everyday
// ones ("body", "hand", "please") only count together. The strongest call comes first.
const COMMON = new Set([
    // questions and small words
    'how', 'why', 'what', 'who', 'where', 'please', "don't", 'sorry', 'after', 'again', 'under', 'good', 'help', 'unless', 'let me', 'let him', 'let her', 'tell me', 'trust me', 'are you okay', 'told you', 'get out', 'way out', 'let go', 'take her', 'take him',
    // the body, looks and feelings that turn up in any scene
    'body', 'blood', 'hands', 'fingers', 'lips', 'mouth', 'tongue', 'neck', 'breath', 'breath*', 'jaw', 'hair', 'nails', 'her eyes', 'his eyes', 'her face', 'his face', 'her hands', 'his hands', 'heart', 'pulse', 'bone*', 'flesh',
    'stomach', 'lungs', 'vein*', 'pupils', 'adrenaline', 'muscle*', 'pale', 'faint*', 'tired', 'hungry', 'sick', 'cold', 'hot', 'hurt', 'pain', 'tremb*', 'naked', 'closer', 'desire', 'want you',
    'nervous', 'tense', 'upset', 'scared', 'afraid', 'angry', 'cry', 'crying', 'tears', 'mood', 'anxious', 'defensive', 'ashamed', 'jealous', 'lonely', 'feel*', 'think*', 'smile*', 'grin*', 'laugh*', 'sweet', 'smooth', 'funny', 'clever', 'dry',
    'calm', 'blank', 'strong', 'heavy', 'confident', 'presence', 'hope', 'lost', 'quiet*', 'silent*', 'shadow*', 'routine', 'rest',
    // everyday verbs
    'look*', 'watch*', 'read*', 'write*', 'act*', 'play*', 'move*', 'run', 'run*', 'lift*', 'pin*', 'pick*', 'call*', 'listen*', 'follow', 'follow*', 'wait*', 'hide*', 'hiding', 'hidden', 'grab*', 'grip*', 'drag*', 'throw*', 'last*', 'longer',
    'catch', 'catch*', 'touch*', 'show* her', 'show* him', 'explain*', 'learn*', 'pretend*', 'struggl*', 'hit', 'hit*', 'swing*', 'beat*', 'fix*', 'mix*', 'pour*', 'save*', 'grow*', 'feed*', 'tuck*', 'look after', 'take care',
    'switch*', 'appear*', 'vanish*', 'swap*', 'lock*', 'check*', 'expose*', 'escape*', 'leap*', 'jump*', 'climb*', 'whisper*', 'admit*', 'question*', 'order*', 'command*', 'lead*', 'serve*', 'cut', 'speed*', 'count*', 'figure* out',
    'plan*', 'realis*', 'realiz*', 'look* up', 'look* into', 'chat*', 'date*', 'call on',
    // everyday things and people
    'water', 'old', 'war', 'door', 'window', 'wall', 'wall*', 'key*', 'keys', 'phone', 'line', 'record*', 'records', 'tape*', 'money', 'cash', 'pay', 'deal', 'deal*', 'offer*', 'price', 'price*', 'trade', 'words', 'voice', 'music',
    'beat', 'rhythm', 'mark', 'role', 'stage', 'show', 'file*', 'files', 'note*', 'notes', 'letter*', 'letters', 'page*', 'book*', 'books', 'drink', 'drink*', 'glass', 'bar', 'bottle', 'ice', 'food', 'dinner', 'breakfast', 'kitchen',
    'car', 'road', 'wheel', 'board', 'tie', 'tie*', 'tied', 'dress', 'coat', 'hat', 'shirt', 'suit', 'skirt', 'heels', 'clothes', 'wearing', 'mirror', 'mask', 'gas', 'lie', 'lies', 'lying', 'truth', 'honest', 'secret*', 'fire',
    'woods', 'snow', 'lake', 'river', 'sea', 'pool', 'bath', 'animal*', 'pet*', 'cat*', 'dog*', 'bird*', 'sit', 'stay', 'blanket', 'son', 'baby', 'mother', 'father', 'child*', 'kid*', 'children', 'men', 'man', 'team', 'staff', 'crew',
    'orders', 'wife', 'husband', 'lady', 'sir', 'proper', 'guest*', 'guests', 'host*', 'partner', 'party', 'weather', 'crowd', 'meeting', 'court', 'audience', 'van', 'trunk', 'basement', 'closet', 'bed', 'in bed', 'bedroom', 'sex',
    'police', 'evidence', 'papers', 'documents', 'envelope', 'cards', 'chips', 'dose', 'pills', 'drug*', 'lab', 'solution', 'formula', 'force', 'weight', 'pressure', 'current', 'machine*', 'doctor', 'patient*', 'ward', 'brain',
    'memory', 'shock', 'data', 'result*', 'subject*', 'test*', 'session*', 'treatment', 'therapy', 'dead', 'body', 'blade', 'shot', 'bow', 'tools', 'tool*', 'broken', 'television', 'tv', 'radio', 'film', 'picture*', 'photo*',
    'story', 'journal', 'keyboard', 'keys', 'organ', 'needle', 'stove', 'oven', 'flower*', 'flowers', 'tea', 'leaf', 'leaves', 'church', 'god', 'lord', 'heaven', 'hell', 'holy', 'number*', 'library', 'newspaper*', 'century',
    'accent', 'language', 'favour*', 'favor*', 'score', 'supply', 'border', 'costume', 'glasses', 'alibi', 'cigarette*', 'gloves', 'lawn', 'apron', 'sweetheart', 'kiss', 'chef', 'menu', 'dish', 'single', 'amp', 'stencil',
    'scarf', 'sweater', 'jumper', 'shopping', 'cheap', 'weed', 'bridge', 'rules', 'allowed', 'permission', 'schedule', 'my house', 'experienced', 'dirty', 'desire', 'complex', 'denial', 'drowsy', 'catch', 'trail', 'prey', 'rod',
    'heel', 'fetch', 'litter', 'birth', 'vet', 'cage*', 'bait', 'shelter', 'electric*', 'cell*', 'organ*', 'market', 'shares', 'director', 'department', 'facility', 'carbon', 'motor', 'single', 'twist', 'beer', 'wine', 'drunk',
    'joint*', 'tobacco', 'magic', 'coin*', 'safe', 'dial', 'combination*', 'con', 'leverage', 'fake*', 'wallet*', 'purse*', 'pocket*', 'mail', 'address', 'online', 'profile', 'rob', 'steal*', 'swipe*', 'card*', 'trick*']);
const DF = new Map();
for (const s of Object.values(SKILL_BY_ID)) for (const t of termsOf(s.words)) DF.set(t, (DF.get(t) ?? 0) + 1);
const weighed = new Map();
function termsFor(words) {
    if (weighed.has(words)) return weighed.get(words);
    const list = termsOf(words).map(t => ({ re: termRe(t), w: (t.includes(' ') ? 3 : t.replace(/\*$/, '').length >= 4 ? 2 : 1) / (DF.get(t) ?? 1) * (COMMON.has(t) ? 0.25 : 1) }));
    weighed.set(words, list); return list;
}
export function callStrength(words, scene) {
    if (!scene) return 0;
    return termsFor(words).reduce((sum, t) => sum + (t.re.test(scene) ? t.w : 0), 0);
}
const CALLED = 1;
// The hidden line names skills by label, so labels count there as well as the skill's words.
const named = (s, used) => calledFor(`${s.label}|${s.prompt}`, used) || callStrength(s.words, used) >= CALLED;
// Everything this person has, strongest first.
export function skillsOf(state) {
    if (!state) return [];
    const set = cleanSkills(state.skills), pins = cleanPins(state.skillPins);
    return Object.entries(set).map(([id, v]) => { const s = SKILL_BY_ID[id]; return { id, label: s.label, prompt: s.prompt, cue: s.cue, words: s.words, when: s.when ?? '', bad: s.bad ?? '', level: v, pinned: Boolean(pins[id]) }; })
        .sort((a, b) => b.level - a.level);
}
// Which of them the scene calls for. scene: the player's latest message and the last reply(s).
// used: what the hidden line says was used last reply. context: a Set of what's happening (app/note.js
// skillContext), matched against each skill's `when` tokens. At most `cap` (and three from context): used first, then words, then context,
// the highest level first within each.
const RANK = { used: 0, scene: 1, context: 2 };
export function litSkills(state, scene = '', used = '', cap = 5, context = null) {
    const s = norm(scene), u = norm(used), fits = x => Boolean(context?.size) && x.when.split(/\s+/).some(t => t && context.has(t));
    return skillsOf(state).map(x => { const pull = callStrength(x.words, s); return { ...x, pull, why: u && named(x, u) ? 'used' : pull >= CALLED ? 'scene' : fits(x) ? 'context' : '' }; })
        // Within the scene's calls, the strongest call first; then how far from untrained (a hopeless −8 is as
        // worth sending as an expert 8), so a skill they are bad at isn't always the one left out.
        .filter(x => x.why).sort((a, b) => RANK[a.why] - RANK[b.why] || (a.why === 'scene' ? b.pull - a.pull : 0) || Math.abs(b.level) - Math.abs(a.level))
        .filter((x, i, all) => x.why !== 'context' || all.slice(0, i).filter(y => y.why === 'context').length < 3).slice(0, cap);
}
// One message's worth of practice for one person: picked skills its words (or the hidden line) touch get a
// use, the rest a reply of disuse. Changes state in place and returns what to put back on a swipe:
// { xp: the progress before, levels: { id: [before, after] } }, or null when the pace is off.
export function growSkills(state, text = '', used = '') {
    const pace = SKILL_PACE[cleanSkillPace(state?.skillPace)], set = cleanSkills(state?.skills);
    if (!pace.per || !Object.keys(set).length) return null;
    const s = norm(text), u = norm(used), pins = cleanPins(state.skillPins), xp = cleanXp(state.skillXp), levels = {};
    const before = structuredClone(xp);
    for (const [id, lv] of Object.entries(set)) {
        if (pins[id]) continue;
        const sk = SKILL_BY_ID[id], [uses, idle] = xp[id] ?? [0, 0];
        if (callStrength(sk.words, s) >= CALLED || (u && named(sk, u))) {
            // Practice: a bad skill climbs out of the hole three times slower, and from -1 straight to novice.
            const next = uses + 1, up = lv < 10 && next >= pace.per * (lv < 0 ? Math.ceil(1.5 * -lv) : lv);
            xp[id] = [up ? 0 : next, 0];
            if (up) levels[id] = [lv, lv === -1 ? 1 : lv + 1];
        } else {
            const down = lv > 1 && idle + 1 >= pace.rust;
            xp[id] = [down ? 0 : uses, down ? 0 : idle + 1];
            if (down) levels[id] = [lv, lv - 1];
        }
    }
    state.skillXp = xp;
    state.skills = { ...set, ...Object.fromEntries(Object.entries(levels).map(([id, [, after]]) => [id, after])) };
    return { xp: before, levels };
}
// Puts back what growSkills did, leaving alone any level you've since changed by hand.
export function ungrowSkills(state, rec) {
    if (!rec) return;
    state.skillXp = structuredClone(rec.xp);
    const set = cleanSkills(state.skills);
    for (const [id, [before, after]] of Object.entries(rec.levels ?? {})) if (set[id] === after) set[id] = before;
    state.skills = set;
}
// How far a skill is toward its next level, for the panel: [uses so far, uses needed], or null.
export function skillProgress(state, id) {
    const pace = SKILL_PACE[cleanSkillPace(state?.skillPace)], lv = cleanSkills(state?.skills)[id];
    if (!pace.per || !lv || lv >= 10 || cleanPins(state?.skillPins)[id]) return null;
    return [cleanXp(state.skillXp)[id]?.[0] ?? 0, pace.per * (lv < 0 ? Math.ceil(1.5 * -lv) : lv)];
}
const pt = v => String(v ?? '').replace(/</g, '‹').replace(/>/g, '›');
// people: [{ name, all: skillsOf(...), lit: litSkills(...) }]. One short roster line for everyone (names and
// levels only), then, only for what's lit: each skill's description, one combo line, and the rule.
const roster = p => `${pt(p.name)}: ${p.all.map(x => `${pt(x.prompt)} ${x.level}`).join(', ')}`;
function comboOf(p, other, seed) {
    const ids = new Set(p.lit.map(x => x.id)), hits = SKILL_COMBOS.filter(([a, b]) => ids.has(a) && ids.has(b));
    if (!hits.length) return '';
    const text = hits[Math.abs(seed) % hits.length][2].replaceAll('{n}', p.name).replaceAll('{u}', other);
    return pronounize(text[0].toUpperCase() + text.slice(1), p.name, other);
}
export function skillLines(people = [], u = 'the player’s character', seed = 0, n = '') {
    const all = people.filter(p => p.all?.length);
    if (!all.length) return [];
    const out = [`Skills (10 master, 1 novice, 0 untrained, −1 to −10 bad at it down to hopeless): ${all.map(roster).join('; ')}.`];
    const lit = people.filter(p => p.lit?.length);
    if (!lit.length) return out;
    out.push('In play this reply:', ...lit.map(p => `- ${pt(p.name)}: ${p.lit.map(x => `${pt(x.prompt)} ${x.level > 0 ? `${x.level}/10` : x.level} (${skillWord(x.level)}), ${pt(x.cue)}`).join('; ')}`));
    // Below zero: how it goes wrong is left to Claude, shaped by who they are. A skill's `bad` ideas (two, picked by
    // the reply number) are offered as examples only, so the same fumble doesn't come back every time.
    const bad = lit.flatMap(p => p.lit.filter(x => x.level < 0).map(x => [p, x]));
    if (bad.length) {
        out.push('Below zero means genuinely bad at it, worse than untrained. How it goes wrong is yours to invent, and it should differ from last time: clumsy, too much or too little, bad timing, nerves, misreading the moment, overconfidence. Their personality and mood shape it (pride covers it, shyness apologises, cruelty blames the other person, a temper flares), and the other person reacts in character (laughs, softens, gets impatient, takes over). A fumble can shift the scene or the dynamic without ending it, and they may not notice it themselves.');
        const ideas = bad.map(([p, x], i) => { const opts = (x.bad || '').split('|').filter(Boolean); if (!opts.length) return '';
            const a = opts[(seed + i) % opts.length], b = opts[(seed + i + 1 + Math.floor(opts.length / 2)) % opts.length];
            return `${pt(p.name)}'s ${pt(x.prompt)} might show as ${pt(a)}${b !== a ? ` or ${pt(b)}` : ''}, or some other way that fits`; }).filter(Boolean);
        if (ideas.length) out.push(`For instance (ideas, not a script): ${ideas.join('; ')}.`);
    }
    const combos = lit.map((p, i) => comboOf(p, p.name === u ? (n || u) : u, seed + i)).filter(Boolean);
    if (combos.length) out.push(...combos.map(c => `${pt(c)}.`));
    out.push(`Levels decide how attempts go, ${pt(u)}'s included: a novice or amateur fumbles, stalls or pays for it; skilled and above make it look easy. Nobody succeeds past their level because the scene needs it, and someone good at a skill reaches for it unasked when it fits, in any kind of scene where it helps. The level sets how well; the how is yours, specific to this moment and this person, never the stock version.`);
    return out;
}

// Someone good at reading minds (Psychology or Psychiatry at 6+, while lit) sees what drives the other person
// underneath: their Mind settings. Only when the scene touches one of those settings' words, or now and then
// (about one reply in three) when it doesn't, so it stays a moment of insight rather than a running commentary.
// What they do with it is left to who they are: a caring person may soothe it, a cruel or controlling one feed it.
// people: [{ name, lit, mind: [{ label, side, words, v }] }] (mind = their settings at 21+).
const READERS = ['psychology', 'psychiatry'];
// Labels lower-cased mid-sentence, except names and initials (Stockholm, Oedipus, PTSD).
const NAMED = /^(Stockholm|Lima|Oedipus|Electra|Peter|Napoleon|Messiah|Medea|Madonna|Nightingale|Cinderella|Cassandra|Capgras|Cotard|Tourette|God\b|[A-Z]{2,})/;
const midLabel = l => NAMED.test(l) ? l : l.charAt(0).toLowerCase() + l.slice(1);
export function insightLines(people = [], scene = '', seed = 0) {
    const out = [];
    people.forEach((p, i) => {
        const reader = (p.lit ?? []).filter(x => READERS.includes(x.id) && x.level >= 6).sort((a, b) => b.level - a.level)[0];
        if (!reader) return;
        people.filter(o => o !== p && o.mind?.length).forEach((o, j) => {
            const touched = o.mind.filter(m => sceneHas(m, scene)), now = (seed + i * 3 + j) % 3 === 0;
            const seen = (touched.length ? touched : now ? o.mind : []).sort((a, b) => b.v - a.v).slice(0, reader.level >= 9 ? 2 : 1);
            if (!seen.length) return;
            const what = seen.map(m => `${midLabel(m.label)}${m.side ? ` (${m.side === 'light' ? 'healthy side' : 'unhealthy side'})` : ''}`).join(' and ');
            out.push(`With ${reader.prompt} at ${reader.level}/10, ${pt(p.name)} sees what is under ${pt(o.name)}'s behaviour right now: ${pt(what)}${reader.level >= 9 ? ', and roughly where it comes from' : ''}. It needn't be said aloud. What ${pt(p.name)} does with it follows ${pt(p.name)}'s own nature and what ${pt(p.name)} wants from ${pt(o.name)}: soothe it, feed it, use it as a lever, or keep it quiet. Understanding a wound is not the same as wanting it healed.`);
        });
    });
    return out;
}
