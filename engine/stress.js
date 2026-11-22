// Stress and breaking points (1.79), after Crusader Kings III's stress: acting against what someone believes or
// who they are, and strain they can't control, builds stress; at each level they cope the way that person would
// (drink, work, control, prayer, cruelty, withdrawal); past what they can hold, they break once, in character,
// and come down from it. Everything is read back from the hidden lines still in the chat, oldest first, so
// swiping or deleting a reply takes its stress with it. Data and pure functions; app/replies.js feeds them.
import { BY_ID } from '../data/catalogue.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pt = v => String(v ?? '').replace(/</g, '\u2039').replace(/>/g, '\u203a');

// Levels: 0\u201333 nothing is sent, then three levels, each with its own word.
export const STRESS_LEVELS = [[90, 3, 'at breaking point'], [67, 2, 'badly strained'], [34, 1, 'under strain'], [0, 0, 'steady']];
export const stressLevel = v => STRESS_LEVELS.find(([min]) => v >= min);
// After a break, stress falls to this and no new break comes for BREAK_REST replies.
const AFTER_BREAK = 45, BREAK_REST = 6;

// Feelings that rise under strain, and ones that let it out. Per reply, at most +6 and \u22124 from feelings.
const STRAIN_FAMILIES = new Set(['scared', 'sad', 'angry']);
const STRAIN_HARD = new Set(['guilty', 'guilt_sick', 'ashamed', 'self_directed_rage', 'trapped', 'cornered', 'losing_control', 'overwhelmed', 'humiliated_rage',
    'status_panic', 'fear_of_being_found_out', 'helpless', 'despairing', 'spiralling', 'catastrophising', 'nervous_wreck', 'quietly_breaking', 'pent_up', 'frustrated']);
const RELIEF_FAMILIES = new Set(['calm', 'happy', 'closeness']);
const RELIEF_HARD = new Set(['sated', 'relieved', 'at_ease_with_them', 'feels_safe', 'content', 'afterglow', 'peaceful']);
// How fast stress builds for this person: high-strung people take it harder, steady ones shrug more off.
const FASTER = ['anxious', 'hysteria', 'neurasthenia', 'borderline', 'ocd', 'perfectionist', 'uptight', 'volatile', 'sensitive', 'insomniac', 'paranoid_personality', 'traumatised', 'people_pleaser', 'obsessive_personality'];
const SLOWER = ['stoic', 'unflappable', 'cold_blooded', 'resilient', 'psychopathic', 'sociopathic'];
const on = (st, id) => (st?.moods?.[id] ?? 0) > 0;
export function stressRate(st) {
    const fast = FASTER.filter(id => on(st, id)).length, slow = SLOWER.filter(id => on(st, id)).length;
    return clamp(1 + 0.2 * fast - 0.25 * slow, 0.5, 1.6);
}

// How they cope while strained: the first that fits who they are, strongest trait first. [ids, how].
const COPING = [
    [['alcoholic', 'functional_addict', 'substance_abuser'], 'drinks or uses more than usual, and earlier in the day'],
    [['controlling', 'perfectionist', 'disciplined', 'ocd', 'uptight', 'stiff'], 'tightens control: rules, order, routine and other people put exactly where they belong'],
    [['devout', 'puritanical', 'fanatic', 'spiritual'], 'prays harder and judges harder, and punishes their own wanting'],
    [['workaholic'], 'buries themself in work and stays late'],
    [['sadistic_personality', 'psychopathic', 'sociopathic'], 'takes it out on someone who can\u2019t fight back, and feels calmer after'],
    [['hot_headed', 'volatile', 'violent', 'explosive_rage'], 'snaps, slams doors and picks fights over nothing'],
    [['womaniser', 'sim_flirty'], 'goes looking for sex or attention to feel in charge again'],
    [['keeps_up_appearances', 'repressed'], 'polishes the surface: perfect manners and a pressed shirt, and nothing allowed to show'],
    [['lone_wolf', 'withdrawn', 'introverted'], 'disappears for hours and answers in single words'],
    [['self_destructive', 'gambling_compulsion'], 'does something reckless just to feel something else'],
    [['soft_hearted', 'caretaker', 'people_pleaser'], 'fusses over everyone else so they don\u2019t have to look at themself'],
    [['smoker'], 'chain-smokes and paces'],
    [['binge_eater', 'bulimic', 'anorexic'], 'eats too much or not at all'],
    [['insomniac'], 'stops sleeping and wanders the house at night'],
];
const COPE_DEFAULT = 'is short with everyone, sleeps badly and loses the thread of things';
export function copingOf(st) {
    let best = null, bestV = 0;
    for (const [ids, how] of COPING) for (const id of ids) { const v = st?.moods?.[id] ?? 0; if (v > bestV) { best = how; bestV = v; } }
    return best ?? COPE_DEFAULT;
}

// What a break looks like: the first that fits, strongest first, else by what's been building (rage, grief, fear).
const BREAKS = [
    [['alcoholic', 'functional_addict', 'substance_abuser'], 'goes on a binge: drinks or uses until the edges blur, and does or says something they can\u2019t take back'],
    [['sadistic_personality', 'psychopathic', 'sociopathic', 'explosive_rage', 'violent'], 'goes cold and does something cruel and deliberate, worse than they\u2019ve shown before'],
    [['controlling', 'perfectionist', 'ocd', 'disciplined'], 'tries to seize control of everything at once: rules, locks, schedules, people, and comes apart when it won\u2019t hold'],
    [['devout', 'puritanical', 'fanatic'], 'falls into a frenzy of guilt and penance, confession or self-punishment'],
    [['repressed', 'keeps_up_appearances', 'stiff'], 'cracks in public: the mask slips where people can see, and they hate that most of all'],
    [['lone_wolf', 'withdrawn', 'introverted', 'avoidant_attachment'], 'vanishes: leaves without a word, for hours or a night, and won\u2019t say where'],
    [['borderline', 'anxious_attachment', 'codependent'], 'clings and accuses in turns: begging the other person not to leave, then pushing them away'],
    [['manic', 'bipolar'], 'goes manic: no sleep, big plans, money spent, risks taken'],
    [['self_destructive', 'gambling_compulsion'], 'throws something important away: a fight they can\u2019t win, a risk that costs them, a bridge burned'],
    [['soft_hearted', 'sensitive', 'people_pleaser'], 'breaks down crying where they least want to, and can\u2019t stop'],
];
const BREAK_BY_FAMILY = {
    angry: 'loses their temper completely: shouting, breaking things, saying the cruelest true thing they know',
    sad: 'collapses inward: can\u2019t get up, can\u2019t eat, can\u2019t talk, and lets everything go',
    scared: 'panics and runs, or freezes and shuts down until someone gets them out',
};
function breakOf(st, families) {
    let best = null, bestV = 0;
    for (const [ids, how] of BREAKS) for (const id of ids) { const v = st?.moods?.[id] ?? 0; if (v > bestV) { best = how; bestV = v; } }
    if (best) return best;
    const top = ['angry', 'sad', 'scared'].sort((a, b) => (families[b] ?? 0) - (families[a] ?? 0))[0];
    return BREAK_BY_FAMILY[top] ?? BREAK_BY_FAMILY.angry;
}

// entries: one per reply, oldest first: { pos, stress (the hidden line's own step, or 0), rose: [feeling ids that
// rose, with their step], needs: { hunger: 10, ... }, release }. from: ignore entries before this chat position
// ("Let it go" on the panel). Returns where stress stands now and whether a break is happening.
export function computeStress(entries = [], st = {}, from = -1) {
    const rate = stressRate(st), families = {};
    let v = 0, lastBreak = null, cooldown = 0;
    const trail = [];
    for (const e of entries) {
        if (e.pos <= from) continue;
        if (lastBreak && lastBreak.at === trail.length - 1) v = Math.min(v, AFTER_BREAK);
        let feel = 0, ease = 0;
        for (const [id, step] of e.rose ?? []) {
            const m = BY_ID[id]; if (!m) continue;
            if (STRAIN_HARD.has(id)) feel += 2; else if (STRAIN_FAMILIES.has(m.category) && step >= 5) feel += 1;
            if (RELIEF_HARD.has(id)) ease += 2; else if (RELIEF_FAMILIES.has(m.category) && step >= 5) ease += 1;
            if (STRAIN_FAMILIES.has(m.category)) families[m.category] = (families[m.category] ?? 0) * 0.8 + step;
        }
        const crit = Object.entries(e.needs ?? {}).filter(([k, x]) => ['hunger', 'energy', 'health', 'comfort', 'hygiene'].includes(k) && x <= 10).length;
        const low = Object.entries(e.needs ?? {}).filter(([k, x]) => ['hunger', 'energy', 'health', 'comfort'].includes(k) && x > 10 && x <= 30).length;
        const line = clamp(Number(e.stress) || 0, -20, 20);
        const up = Math.min(6, feel) + 2 * crit + low + Math.max(0, line), down = Math.min(4, ease) + Math.max(0, -line) + (e.release ? 8 : 0) + 1;
        v = clamp(v + up * rate - down, 0, 100);
        cooldown = Math.max(0, cooldown - 1);
        const edge = crit >= 2 ? 75 : 90;
        if (v >= edge && !cooldown) { lastBreak = { at: trail.length, how: breakOf(st, families) }; cooldown = BREAK_REST; }
        trail.push(Math.round(v));
    }
    const since = lastBreak ? trail.length - 1 - lastBreak.at : null;
    return { value: Math.round(v), level: stressLevel(v)[1], word: stressLevel(v)[2], rate, coping: copingOf(st), trail: trail.slice(-12),
        breaking: since === 0 ? lastBreak.how : '', after: since === 1 ? lastBreak.how : '' };
}

// The lines Claude reads: a break this reply, coming down from one, or the stress level and how they cope.
export function stressLines(s, n) {
    if (!s) return [];
    if (s.breaking) return [`Breaking point: ${pt(n)} has been pushed past what ${pt(n)} can hold. This reply ${pt(n)} ${s.breaking}. Make it ${pt(n)}'s own and let it land; it passes within a reply or two and leaves its mark.`];
    if (s.after) return [`After the break: ${pt(n)} is coming down from it, drained, raw and dealing with what was done or said. Let the cost show; don't wave it away.`];
    if (s.level < 1) return [];
    const how = s.level >= 2 ? 'It shows more than they want: in their temper, hands and choices.' : 'It leaks into small things and doesn\u2019t need naming.';
    return [`Stress: ${pt(n)} is ${s.word}. ${pt(n)} copes the way ${pt(n)} does: ${s.coping}. ${how}`];
}
