// Secrets and leverage (1.79), after Crusader Kings III's secrets and hooks. Each person keeps a few secrets, one a
// line on their profile card. A secret moves hidden \u2192 suspected \u2192 known (the other person knows: a hook they hold)
// \u2192 out (everyone knows), or "used" when someone plays it against them. The story moves it by naming it on the
// hidden line ("secrets: affair suspected"); you can also tap a state. The newer of the two wins. Read back from
// the chat each time, so swiping a reply takes its step with it. Data and pure functions.
import { pt } from './util.js';
export const SECRET_STATES = ['hidden', 'suspected', 'known', 'out', 'used'];
const STOP = new Set(['the', 'and', 'that', 'this', 'with', 'from', 'about', 'they', 'their', 'them', 'his', 'her', 'was', 'were', 'has', 'had', 'have', 'not', 'for', 'who', 'what', 'when', 'into', 'once', 'still']);
const wordsOf = t => String(t ?? '').toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
// A stable key for a line, so a tap or a story step stays with the secret when other lines are edited.
export const secretKey = t => { let h = 7; for (const c of String(t).toLowerCase().replace(/\s+/g, ' ').trim()) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); };
export const cleanSecrets = v => String(v ?? '').replace(/[<>]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim().slice(0, 600);
// A short name the hidden line can use: the first six words, without a dangling "with his" at the end.
const TAIL = /\s+(a|an|the|to|of|with|his|her|their|my|your|and|for|in|on|at|from|by|about)$/i;
function titleOf(text) { let t = text.split(/\s+/).slice(0, 6).join(' ').replace(/[,.;:]+$/, ''); while (TAIL.test(t)) t = t.replace(TAIL, ''); return t; }
export function secretList(st) {
    return cleanSecrets(st?.secrets).split(/\n+/).map(x => x.trim()).filter(Boolean).slice(0, 6)
        .map(text => ({ key: secretKey(text), text, title: titleOf(text), words: wordsOf(text) }));
}
// "affair suspected" or "Ruth known" \u2192 { words, state }.
export function secretStep(item) {
    const t = String(item ?? '').toLowerCase().trim(), m = t.match(/\b(suspected|suspects?|known|knows|found out|out|exposed|public|used|spent|hidden)\.?$/);
    if (!m) return null;
    const s = m[1], state = /^suspect/.test(s) ? 'suspected' : /^(known|knows|found out)$/.test(s) ? 'known' : /^(out|exposed|public)$/.test(s) ? 'out' : /^(used|spent)$/.test(s) ? 'used' : 'hidden';
    return { words: wordsOf(t.slice(0, m.index)), state };
}
// The secret a step means, from either list: the most words in common, at least one.
export function matchSecret(step, lists) {
    let best = null, score = 0;
    for (const [who, list] of lists) for (const s of list) {
        const n = step.words.filter(w => s.words.some(x => x === w || (w.length > 4 && x.startsWith(w.slice(0, 5))))).length;
        if (n > score) { best = { who, key: s.key }; score = n; }
    }
    return best;
}
// steps: [{ pos, who: 'n'|'u', key, state }] from the chat; set: { key: { state, pos } } tapped by hand.
export function secretStates(list, steps = [], set = {}, who = 'n') {
    return list.map(s => {
        const story = steps.filter(x => x.who === who && x.key === s.key).at(-1), hand = set?.[s.key];
        const pick = hand && (!story || hand.pos >= story.pos) ? { ...hand, by: 'you' } : story ? { ...story, by: 'story' } : { state: 'hidden', pos: -1, by: '' };
        return { ...s, state: pick.state, at: pick.pos, by: pick.by };
    });
}
// Lines Claude reads. n: the character, u: you. mine: the character's secrets, yours: yours. scene: recent text.
// Hidden secrets go only when the scene comes near them; a secret that's out stops after OUT_FOR messages.
const OUT_FOR = 16;
const near = (s, scene) => { const t = ` ${String(scene ?? '').toLowerCase().replace(/[^a-z' ]/g, ' ')} `; return s.words.filter(w => t.includes(` ${w}`)).length >= Math.min(2, s.words.length); };
export function secretLines({ mine = [], yours = [], n, u, scene = '', now = 0 }) {
    const out = [];
    for (const s of mine) {
        const x = pt(s.text);
        if (s.state === 'hidden' && near(s, scene)) out.push(`${pt(n)}'s secret, which ${pt(u)} doesn't know: ${x}. The scene is close to it: ${pt(n)} guards it, deflects or lies, and it costs something to.`);
        else if (s.state === 'suspected') out.push(`${pt(u)} suspects ${pt(n)}'s secret (${x}) without being sure. ${pt(n)} can feel it and watches what ${pt(u)} knows.`);
        else if (s.state === 'known') out.push(`${pt(u)} knows ${pt(n)}'s secret (${x}): a hook ${pt(u)} holds over ${pt(n)}. ${pt(n)} knows it, and it shifts the balance between them.`);
        else if (['out', 'used'].includes(s.state) && now - s.at <= OUT_FOR) out.push(`${pt(n)}'s secret is out${s.state === 'used' ? `, played against ${pt(n)}` : ''}: ${x}. ${pt(n)} lives with what that costs.`);
    }
    for (const s of yours) {
        const x = pt(s.text);
        if (s.state === 'hidden' && near(s, scene)) out.push(`True of ${pt(u)}, but ${pt(n)} doesn't know it: ${x}. ${pt(n)} only notices what anyone could.`);
        else if (s.state === 'suspected') out.push(`${pt(n)} suspects something about ${pt(u)} (${x}) without being sure, and is watching for proof.`);
        else if (s.state === 'known') out.push(`${pt(n)} knows ${pt(u)}'s secret (${x}): a hook ${pt(n)} holds over ${pt(u)}, to keep, hint at or use.`);
        else if (['out', 'used'].includes(s.state) && now - s.at <= OUT_FOR) out.push(`${pt(u)}'s secret is out${s.state === 'used' ? `, played against ${pt(u)}` : ''}: ${x}.`);
    }
    return out.slice(0, 4);
}
// Tapped states: { key: { state, pos } }, at most 12.
export function cleanSecretSet(v) {
    const out = {};
    for (const [k, x] of Object.entries(v && typeof v === 'object' ? v : {}).slice(0, 12)) {
        if (/^[a-z0-9]{1,12}$/.test(k) && SECRET_STATES.includes(x?.state)) out[k] = { state: x.state, pos: Number.isFinite(x.pos) ? x.pos : -1 };
    }
    return out;
}
// Steps the story took this reply move the meters, when the line didn't move them itself. Their secret found
// out: they lose a little control and hide harder; out: shame. Yours found out: they know more and hold a hook.
export function secretNudges(steps = []) {
    const out = { p: 0, m: {} }, add = (k, v) => { out.m[k] = Math.max(out.m[k] ?? 0, v); };
    for (const s of steps) {
        if (s.who === 'n') { if (s.state === 'suspected') add('se', 2); if (['known', 'used'].includes(s.state)) { out.p = Math.min(out.p, -3); add('se', 2); } if (s.state === 'out') add('sh', 2); }
        else { if (s.state === 'suspected') add('kn', 2); if (['known', 'used'].includes(s.state)) { out.p = Math.max(out.p, 3); add('kn', 4); } }
    }
    return out;
}
// How much a step weighs on the character: their own secret slipping is strain.
export const secretStrain = steps => steps.filter(s => s.who === 'n').reduce((a, s) => Math.max(a, s.state === 'suspected' ? 3 : ['known', 'out', 'used'].includes(s.state) ? 6 : 0), 0);
