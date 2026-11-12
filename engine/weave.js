import { metersOf } from './meters.js';
// The weave line. One hidden HTML comment at the end of each reply carries what the roleplay
// model noticed about its own character this turn, so feelings, needs, relationships, meters and
// memories all update from the reply it was already writing. No tool call, no extra request.
//   <!-- weave: moods desperate -10, relieved +20 | needs hunger low | toward obsessed +5 | friendship +1 | romance +2 | trust -3 | power +2 | thinks: stubborn, his | sparked: her defiance | remember: none -->
// Older chats wrote <!-- bond: … --> (1.33.0); both are read, and both are stripped from the prompt.
const LINE = /<!--\s*(?:weave|bond)\s*:([\s\S]*?)-->/i;
const LINES = /<!--\s*(?:weave|bond)\s*:([\s\S]*?)-->/gi;
const LINE_ALL = /[ \t]*<!--\s*(?:weave|bond)\s*:[\s\S]*?-->[ \t]*\n?/gi;
export const hasWeave = text => typeof text === 'string' && LINE.test(text);
export const stripWeave = text => String(text ?? '').replace(LINE_ALL, '').replace(/\s+$/, '');
// Every weave line in a reply, in order. A continued reply can end up with two: the first
// reply's line and the continuation's. Both count, so nothing the first part changed is lost.
export const weaveLines = text => [...String(text ?? '').matchAll(LINES)].map(m => m[1].trim());

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const NONE = /^(none|nothing|n\/?a|no change|no|-|—|\[.*\])\.?$/i;
const num = v => { const x = String(v ?? '').replace(/[−–]/g, '-').match(/[+-]?\s*\d+/); return x ? Math.round(Number(x[0].replace(/\s/g, ''))) : 0; };
const unquote = s => String(s ?? '').trim().replace(/^["“'‘]+|["”'’.]+$/g, '').trim();
// "she's mine to the bone" → "mine to the bone": the chips already read "Easterman thinks Lamb is…".
const trait = s => unquote(s).replace(/^(?:(?:she|he|they|it|you)(?:['’]s|['’]re|\s+is|\s+are|\s+was)?|is|are)\s+/i, '').replace(/\s+/g, ' ').trim();
// Near-duplicates share a key: "stubborn", "Stubborn!", "so stubborn".
export const traitKey = s => trait(s).toLowerCase().replace(/^(so|very|really|too)\s+/, '').replace(/[^a-z0-9' ]/g, '').trim();
const list = (v, max, len) => NONE.test(String(v ?? '').trim()) ? [] : String(v ?? '').split(/[,;]/).map(unquote).filter(s => s && !NONE.test(s) && s.length <= len).slice(0, max);
// "desperate -10, Clingy / needy +5" → [{ name, delta }]. Entries without a number are skipped.
function changes(v, max = 5) {
    if (NONE.test(String(v ?? '').trim())) return [];
    return String(v ?? '').split(/[,;]/).map(part => {
        const m = part.trim().replace(/[−–]/g, '-').match(/^(.+?)\s*([+-]\s*\d+|\boff|\bgone)\s*$/i);
        // "afraid off" ends a feeling outright: the model only sees strength words, not numbers.
        return m ? { name: unquote(m[1]).toLowerCase(), delta: /off|gone/i.test(m[2]) ? -100 : clamp(num(m[2]), -40, 40) } : null;
    }).filter(x => x && x.name && x.delta).slice(0, max);
}
const NEED_WORDS = { critical: 10, low: 30, okay: 55, ok: 55, fine: 85, full: 95, met: 90 };
const NEED_NAMES = ['hunger', 'energy', 'bladder', 'hygiene', 'comfort', 'social', 'fun', 'health'];
// "hunger low, energy critical" → { hunger: 30, energy: 10 }. 1.39.0: "health -10" is a change, kept
// separately in deltas so older readers that only know levels never mistake it for one.
function needs(v, deltas = null) {
    const out = {};
    for (const part of NONE.test(String(v ?? '').trim()) ? [] : String(v ?? '').split(/[,;]/)) {
        const t = part.trim().toLowerCase().replace(/[−–]/g, '-');
        const d = t.match(/^([a-z]+)\s*:?\s*([+-])\s*(\d{1,3})\b/);
        if (d && NEED_NAMES.includes(d[1])) { if (deltas) deltas[d[1]] = clamp((deltas[d[1]] ?? 0) + Number(d[2] + d[3]), -100, 100); continue; }
        const m = t.match(/^([a-z]+)\s*:?\s*(critical|low|okay|ok|fine|full|met|\d{1,3})\b/);
        if (m && NEED_NAMES.includes(m[1])) out[m[1]] = /\d/.test(m[2]) ? clamp(Number(m[2]), 0, 100) : NEED_WORDS[m[2]];
    }
    return out;
}
// "get her to eat +, escape -, keep her safe done" → [{ text, status }]
const wantItems = v => list(v, 4, 80).map(s => {
    const m = s.replace(/[−–]/g, '-').match(/^(.+?)\s*(\+|-|\bdone\b|\bcame true\b|\bblocked\b|\bcloser\b)\s*$/i);
    if (!m) return { text: s, status: '+' };
    const k = m[2].toLowerCase();
    return { text: unquote(m[1]), status: k === '-' || k === 'blocked' ? '-' : k === '+' || k === 'closer' ? '+' : 'done' };
}).filter(w => w.text);
// "her defiance, her crying (off)" → [{ text, off }]
const sparks = v => list(v, 3, 60).map(s => ({ text: s.replace(/\s*\((?:off|turn-?off)\)\s*$/i, '').trim(), off: /\((?:off|turn-?off)\)\s*$/i.test(s) })).filter(s => s.text);
// "arousal +6, restraint -4, bold +5, tender +3, shame +4" or "release" → { a, s, b, t, x, h, release }.
// Tender counts as the opposite of rough.
const DESIRE_WORDS = [[/^(arousal|aroused|desire|horny)$/, 'a', 1], [/^(restraint|holding back|holding)$/, 's', 1], [/^(bold|boldness|forward)$/, 'b', 1],
    [/^(rough|roughness|cruel)$/, 't', 1], [/^(tender|gentle|soft)$/, 't', -1], [/^(fixation|fixated|fixed)$/, 'x', 1], [/^(shame|ashamed)$/, 'h', 1]];
function desireOf(v) {
    if (!v || NONE.test(String(v).trim())) return null;
    const t = String(v).toLowerCase().replace(/[−–]/g, '-'), out = { a: 0, s: 0, b: 0, t: 0, x: 0, h: 0, release: /\b(release|released|climax\w*|came|orgasm\w*)\b/.test(t) };
    for (const part of t.split(/[,;]/)) {
        const m = part.trim().match(/^([a-z ]+?)?\s*:?\s*([+-]\s*\d{1,3})/); if (!m) continue;
        const word = (m[1] ?? 'arousal').trim() || 'arousal', hit = DESIRE_WORDS.find(([re]) => re.test(word)); if (!hit) continue;
        out[hit[1]] += hit[2] * clamp(Number(m[2].replace(/\s/g, '')), -50, 50);
    }
    return ['a', 's', 'b', 't', 'x', 'h'].some(k => out[k]) || out.release ? out : null;
}
const FIELDS = /^(moods?|feelings|needs|toward|friendship|romance|trust|control|power|pull|feels|thinks|sparked|sparks|remember|wants|goals|fears|pressed|new\s+wants?|you|desire|meters|used|skills|dynamic)\b\s*:?\s*([\s\S]*)$/i;
// Fields are split on "|" and read by name, so a missing field or a different order still works.
function readLine(body) {
    const f = {};
    for (const part of body.split('|')) {
        const x = part.trim().match(FIELDS); if (!x) continue;
        const key = x[1].toLowerCase().replace(/^(mood|feelings)$/, 'moods').replace(/^sparks$/, 'sparked').replace(/^goals$/, 'wants').replace(/^new\s+wants?$/, 'newwant').replace(/^skills$/, 'used');
        f[key] ??= x[2].trim();
    }
    const remember = unquote(f.remember ?? '');
    // "toward" without numbers ("devoted, wary") is read like the old "feels" words.
    const toward = changes(f.toward, 3), feels = list(f.feels, 3, 40), deltas = {};
    if (!toward.length && f.toward && !feels.length) feels.push(...list(f.toward, 3, 40));
    return {
        f: clamp(num(f.friendship), -25, 25), r: clamp(num(f.romance), -25, 25), t: clamp(num(f.trust), -25, 25), p: clamp(num(f.power), -25, 25),
        // The story's own name for the dynamic, only when it shifted.
        dynamic: NONE.test(unquote(f.dynamic ?? '')) ? '' : unquote(f.dynamic ?? '').replace(/\s*\(.*$/, '').slice(0, 40),
        hasTrust: 'trust' in f, hasPower: 'control' in f || 'power' in f, pRaw: f.control ?? f.power ?? '', lRaw: f.pull ?? '',
        moods: changes(f.moods, 10), hasMoods: 'moods' in f, needs: needs(f.needs, deltas), needDeltas: deltas, toward, feels,
        wants: wantItems(f.wants), fears: list(f.fears, 3, 80), pressed: list(f.pressed, 3, 80),
        newWant: NONE.test(unquote(f.newwant ?? '')) ? '' : unquote(f.newwant ?? '').slice(0, 100),
        desire: desireOf(f.desire), meters: metersOf(f.meters), used: list(f.used, 6, 50),
        you: 'you' in f ? (NONE.test(String(f.you).trim()) || /^(healed|fine|nothing|unhurt)\.?$/i.test(String(f.you).trim()) ? [] : list(f.you, 5, 60)) : null,
        thinks: list(f.thinks, 3, 60).map(trait).filter(t => t && t.split(' ').length <= 4),
        sparked: sparks(f.sparked),
        remember: !remember || NONE.test(remember) ? '' : remember.slice(0, 160),
    };
}
// Every line in the reply is read and merged: meters add up, lists join, the newest need and memory win.
export function parseWeave(mes) {
    const parts = weaveLines(mes).map(readLine); if (!parts.length) return null;
    if (parts.length === 1) return parts[0];
    const out = parts[0];
    for (const x of parts.slice(1)) {
        for (const k of ['f', 'r', 't', 'p']) out[k] = clamp(out[k] + x[k], -25, 25);
        if (x.dynamic) out.dynamic = x.dynamic;
        out.hasTrust ||= x.hasTrust; out.hasPower ||= x.hasPower; out.hasMoods ||= x.hasMoods;
        out.pRaw = [out.pRaw, x.pRaw].filter(Boolean).join(' ; '); out.lRaw = [out.lRaw, x.lRaw].filter(Boolean).join(' ; ');
        out.moods = [...out.moods, ...x.moods].slice(0, 14); out.toward = [...out.toward, ...x.toward].slice(0, 6);
        out.feels = [...out.feels, ...x.feels].slice(0, 6); out.needs = { ...out.needs, ...x.needs };
        out.thinks = [...out.thinks, ...x.thinks].slice(0, 6); out.sparked = [...out.sparked, ...x.sparked].slice(0, 6);
        if (x.remember) out.remember = x.remember;
        for (const [k, d] of Object.entries(x.needDeltas ?? {})) out.needDeltas[k] = clamp((out.needDeltas[k] ?? 0) + d, -100, 100);
        out.wants = [...out.wants, ...x.wants].slice(0, 8); out.fears = [...out.fears, ...x.fears].slice(0, 6); out.pressed = [...out.pressed, ...x.pressed].slice(0, 6);
        if (x.newWant) out.newWant = x.newWant;
        out.used = [...(out.used ?? []), ...(x.used ?? [])].slice(0, 8);
        if (x.meters) { out.meters ??= {}; for (const [k, d] of Object.entries(x.meters)) out.meters[k] = (out.meters[k] ?? 0) + d; }
        if (x.desire) out.desire = out.desire ? { ...Object.fromEntries(['a', 's', 'b', 't', 'x', 'h'].map(k => [k, (out.desire[k] ?? 0) + (x.desire[k] ?? 0)])), release: out.desire.release || x.desire.release } : x.desire;
        if (x.you) out.you = x.you;
    }
    return out;
}

// Power names who gained it ("power Lamb +3"), so the direction can't be read backwards.
// A bare signed number from older lines still works: + toward the character, - toward the player.
export function powerChange(raw, charName = '', userName = '') {
    // Two weave lines in one reply arrive joined by " ; ", and each part counts.
    const parts = String(raw ?? '').split(';').map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) return clamp(parts.reduce((sum, part) => sum + powerChange(part, charName, userName), 0), -25, 25);
    const text = String(raw ?? '').toLowerCase(), size = Math.abs(num(text));
    const names = name => String(name).toLowerCase().split(/\s+/).filter(w => w.length > 2 && !['doctor', 'the', 'mr', 'mrs', 'miss', 'mother', 'father'].includes(w));
    const has = name => names(name).some(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
    if (!size || /\b(even|none|steady|no change)\b/.test(text) && !/\d/.test(text)) return 0;
    if (has(userName) && !has(charName)) return -clamp(size, 0, 25);
    if (has(charName)) return clamp(size, 0, 25);
    return clamp(num(text), -25, 25);
}

// What the line asks for. Opus 5.5 follows a filled-in example more reliably than a template of
// brackets, and it follows instructions literally, so unchanged fields are left out instead of being
// asked for every reply (which invites small invented changes). Values only, never reasons: asking a
// thinking model to write its reasoning into the reply can be refused.
// opts: { n, u, bond, extra (trust & power), moods (feelings, needs, relationship), remember }
const desireNames = d => { const names = [d.b !== false && 'bold', d.t !== false && 'rough or tender', d.x !== false && 'fixation', d.h !== false && 'shame', d.s !== false && 'restraint'].filter(Boolean);
    return names.length ? `, and any of ${names.join(', ')} that moved` : ''; };
// Step sizes follow the chat's pace, so long scenes drift and short ones turn.
const SIZES = {
    slow: { range: 5, ordinary: '1', turn: '3 to 5', step: 1 },
    steady: { range: 10, ordinary: '1 to 3', turn: 'more', step: 3 },
    quick: { range: 20, ordinary: '3 to 6', turn: '10 to 20', step: 6 },
    volatile: { range: 25, ordinary: '5 to 10', turn: '15 to 25', step: 10 },
};
// dynamic: { now, pool } when the story names the dynamic. pace: the chat's pace (bond.js PACE).
export function weavePrompt({ n, u, bond = true, extra = true, moods = true, feelings = true, moodPace = null, moodNames = null, remember = true, wants = false, fears = false, buttons = false, suggest = false, you = false, desire = false, desirePace = null, meters = [], skills = false, pace = 'steady', dynamic = null }) {
    const size = SIZES[pace] ?? SIZES.steady, mp = moodPace ?? { step: 20, ordinary: '5 to 10' };
    if (!bond && !moods && !remember) return [];
    // The same instructions in about half the words. The line Moodweaver reads is unchanged.
    const example = [
        ...(moods ? [...(feelings ? ['moods amused +10, wanting +5, afraid off'] : []), 'needs hunger low'] : []),
        ...(bond ? ['romance +2', ...(extra ? [`control ${n} +1`] : []), 'sparked: defiance'] : []),
        ...(remember ? [`remember: ${u} promised to stay`] : []),
    ];
    return [
        `End every reply with a hidden line for Moodweaver: only what changed for ${n} this reply, or <!-- weave: none -->. Shape:`,
        `<!-- weave: ${example.join(' | ')} -->`,
        ...(moods ? [...(feelings ? [`- moods: ${n}'s feelings that rose, fell or ended, up to eight, any kind (dark, sexual and ugly ones count), in plain words: ${mp.ordinary} usually, up to ${mp.step} for big moments, off when gone. Lower or end the ones the scene has moved past.${moodNames?.length ? ` Only these: ${moodNames.join(', ')}.` : ''}`] : []),
            `- needs: hunger, energy, bladder, hygiene, comfort, social, fun, health as critical, low, okay or fine, or a change (health -10). Food, sleep, washing and company fill them; filth, cold, restraints, withdrawal, isolation, boredom, injury and rough sex drain them; a beating costs health.`,
            `- toward: ${n}'s feelings about ${u} that moved (obsessed, protective, distrusts), -30 to +30.`] : []),
        ...(bond ? [`- friendship (liking, loyalty), romance (desire, love)${extra ? `, trust (relying on ${u})` : ''}: -${size.range} to +${size.range}, ${size.ordinary} usually, ${size.turn} for turning points. Score this reply, even against where they stand.`,
            ...(extra ? [`- control: who gained real power (doors, money, freedom, demands, rewards), as ${n} +3 or ${u} +3, up to ${size.range}. pull: who gained emotional hold, the same way. They can move opposite ways.`] : []),
            ...(dynamic ? [`- dynamic: only if it's no longer ${dynamic.now}, what it is now${dynamic.pool?.length ? `, from: ${dynamic.pool.join(', ')}` : ' in two or three words'}.`] : []),
            `- thinks: ${n} thinks ${u} is… (stubborn, his, a liar).`,
            `- sparked: ${n}'s turn-ons, turn-offs or bedroom traits this reply touched, by name; (off) for a turn-off.`] : []),
        ...(wants || fears || buttons || suggest ? [`- ${[wants ? 'wants: one this reply moved (+, -, done)' : '', fears ? 'fears: one the scene came near' : '', buttons ? 'pressed: a hot button that went off' : '', suggest ? 'new want: one they clearly started wanting' : ''].filter(Boolean).join('; ')}. In ${n}'s wording from these notes.`] : []),
        ...(meters.length ? [`- meters: any of ${meters.join(', ')} that moved toward ${u}, -${size.range} to +${size.range}${meters.some(m => ['respect', 'pedestal'].includes(m)) ? ' (respect and pedestal can go below zero)' : ''}.`] : []),
        ...(desire ? [`- desire: how this reply moved ${n}'s arousal toward ${u} (arousal +${(SIZES[desirePace] ?? size).step}, at most +${(SIZES[desirePace] ?? size).range})${desireNames(desire)}; release if they climaxed.`] : []),
        ...(you ? [`- you: lasting things done to ${u}'s body (injured, drugged, tied): the full current list, or none once healed.`] : []),
        ...(skills ? [`- used: skills someone used or was tested on, a word or two each.`] : []),
        ...(remember ? [`- remember: a turning point between them in one line (confession, promise, betrayal, first time, secret).`] : []),
    ];
}
