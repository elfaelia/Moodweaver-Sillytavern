// Skills: a level out of 10 per person, for the skills picked for them (data/catalogue/skills.js).
// A skill costs nothing until the scene calls for it: its words come up in the player's latest message or the
// last reply, or the hidden line says someone used it last reply. Then it goes to Claude with its level, which
// decides how attempts go. Picked skills also grow slowly with use and slip after long disuse, at their own
// pace; a pinned one stays where it is. Pure functions; app/ does the reading.
import { SKILL_GROUPS, SKILL_MERGED } from '../data/catalogue/skills.js';

const norm = s => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’‘]/g, "'");
export { SKILL_GROUPS };
export const SKILL_BY_ID = Object.fromEntries(SKILL_GROUPS.flatMap(g => g.rows.map(r => [r.id, { ...r, prompt: r.prompt || r.label.toLowerCase(), group: g.name, color: g.color }])));

// 1–10, worded so the number and the word agree; the rule line in the note says what a level does.
const SKILL_LEVELS = [[10, 'master'], [9, 'expert'], [7, 'skilled'], [5, 'competent'], [3, 'amateur'], [1, 'novice']];
export const skillWord = v => SKILL_LEVELS.find(([min]) => v >= min)?.[1] ?? 'off';
const level = v => Math.max(0, Math.min(10, Math.round(Number(v) || 0)));
const known = id => SKILL_BY_ID[id] ? id : SKILL_BY_ID[SKILL_MERGED[id]] ? SKILL_MERGED[id] : '';
// Levels by id. Skills from older versions move to the one that replaced them; the higher level wins.
export function cleanSkills(obj = {}) {
    const out = {};
    for (const [id, v] of Object.entries(obj && typeof obj === 'object' ? obj : {})) { const to = known(id); if (to && level(v) > 0) out[to] = Math.max(out[to] ?? 0, level(v)); }
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

// Words → one pattern. "a|b c|stem*": whole words, spaces match any gap, '*' allows any ending.
const patterns = new Map();
const escapeRe = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function patternFor(words) {
    if (patterns.has(words)) return patterns.get(words);
    const parts = norm(words).split(/[|,;]/).map(w => w.trim()).filter(w => w.length > 1)
        .map(w => escapeRe(w.replace(/\*$/, '')).replace(/\s+/g, "[\\s-]+") + (w.endsWith('*') ? "[a-z']*" : ''));
    const re = parts.length ? new RegExp(`(?:^|[^a-z'])(?:${parts.join('|')})(?![a-z])`, 'i') : null;
    patterns.set(words, re); return re;
}
const calledFor = (words, scene) => Boolean(patternFor(words)?.test(scene));
// The hidden line names skills by label, so labels count there as well as the skill's words.
const named = (s, used) => calledFor(`${s.label}|${s.prompt}|${s.words}`, used);
// Everything this person has, strongest first.
export function skillsOf(state) {
    if (!state) return [];
    const set = cleanSkills(state.skills), pins = cleanPins(state.skillPins);
    return Object.entries(set).map(([id, v]) => { const s = SKILL_BY_ID[id]; return { id, label: s.label, prompt: s.prompt, words: s.words, level: v, pinned: Boolean(pins[id]) }; })
        .sort((a, b) => b.level - a.level);
}
// Which of them the scene calls for. scene: the player's latest message and the last reply(s).
// used: what the hidden line says was used last reply. At most `cap`, the highest first.
export function litSkills(state, scene = '', used = '', cap = 6) {
    const s = norm(scene), u = norm(used);
    return skillsOf(state).map(x => ({ ...x, why: u && named(x, u) ? 'used' : s && calledFor(x.words, s) ? 'scene' : '' }))
        .filter(x => x.why).sort((a, b) => b.level - a.level).slice(0, cap);
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
        if ((s && calledFor(sk.words, s)) || (u && named(sk, u))) {
            const next = uses + 1, up = lv < 10 && next >= pace.per * lv;
            xp[id] = [up ? 0 : next, 0];
            if (up) levels[id] = [lv, lv + 1];
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
    return [cleanXp(state.skillXp)[id]?.[0] ?? 0, pace.per * lv];
}
const pt = v => String(v ?? '').replace(/</g, '‹').replace(/>/g, '›');
// people: [{ name, lit: [...] }]. One line per person, then one rule. Nothing at all when nothing is lit.
export function skillLines(people = [], u = 'the player’s character') {
    const rows = people.filter(p => p.lit?.length).map(p => `- ${pt(p.name)}: ${p.lit.map(x => `${pt(x.prompt)} ${x.level}/10 (${skillWord(x.level)})`).join(', ')}`);
    if (!rows.length) return [];
    return ['Skills this scene calls on:', ...rows,
        `Levels decide how attempts go, ${pt(u)}'s included: a novice or amateur fumbles, stalls or pays for it; skilled and above make it look easy. Nobody succeeds past their level because the scene needs it, and someone good at a skill reaches for it unasked when it fits.`];
}
