// Stress and breaking points (1.79), after Crusader Kings III's stress: acting against what someone believes or
// who they are, and strain they can't control, builds stress; at each level they cope the way that person would
// (drink, work, control, prayer, cruelty, withdrawal); past what they can hold, they break once, in character,
// and come down from it. Everything is read back from the hidden lines still in the chat, oldest first, so
// swiping or deleting a reply takes its stress with it. Data and pure functions; app/replies.js feeds them.
import { clamp, pt } from './util.js';
import { BY_ID } from '../data/catalogue.js';


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

// Ways of coping (2.0.3): up to three picked per person on the Stress card, or the one their traits suggest.
// When a reply shows them coping their own way, stress comes down (less each time in a row), and that act is
// never counted as strain. [id, label, how it shows, traits that suggest it].
export const COPES = [
    // Healthier: ease it a little each time, and keep working.
    ['exercise', 'Exercise', 'h', 'runs, lifts or trains until the body is too tired to think', ['disciplined']],
    ['art', 'Music or art', 'h', 'loses themself in music, drawing or writing', ['creative', 'artistic']],
    ['talk', 'Talking it out', 'h', 'talks to someone they trust until it eases', ['open', 'extroverted']],
    ['crying', 'Crying it out', 'h', 'lets it out in tears somewhere private, then breathes again', ['sensitive']],
    ['sleep', 'Sleep', 'h', 'sleeps it off', []],
    ['outdoors', 'Walks and fresh air', 'h', 'walks for miles or sits outside until it settles', []],
    ['faith', 'Faith', 'h', 'prays or sits somewhere quiet and holy until it settles', ['spiritual']],
    ['routine', 'Routine', 'h', 'leans on routine: the same small tasks, done properly, one after another', []],
    ['hands', 'Working with their hands', 'h', 'fixes, cleans, cooks or builds something until their hands are steady', []],
    ['humour', 'Humour', 'h', 'finds the joke in it and shares it', ['funny', 'witty']],
    // Mixed: work well enough, but lean on them too hard and they cost something.
    ['sex', 'Sex', 'm', 'goes looking for sex or someone\u2019s attention to feel in charge again', ['womaniser', 'sim_flirty']],
    ['work', 'Work', 'm', 'buries themself in work and stays late', ['workaholic']],
    ['distraction', 'Distraction', 'm', 'keeps busy with anything but the problem: TV, games, errands, noise', []],
    ['alone', 'Withdrawing', 'm', 'disappears for hours and comes back quieter', ['lone_wolf', 'withdrawn', 'introverted']],
    ['control', 'Control', 'm', 'tightens control: rules, order, routine and people put where they belong', ['controlling', 'perfectionist', 'ocd', 'uptight', 'stiff']],
    ['caring', 'Looking after others', 'm', 'fusses over everyone else so they don\u2019t have to look at themself', ['soft_hearted', 'caretaker', 'people_pleaser']],
    ['deflecting', 'Joking it away', 'm', 'jokes it away, louder the worse it gets', []],
    ['appearances', 'Keeping up appearances', 'm', 'polishes the surface until nothing is allowed to show', ['keeps_up_appearances', 'repressed']],
    ['comfort_food', 'Comfort eating', 'm', 'eats something rich and sweet, more than they meant to', []],
    ['driving', 'Driving', 'm', 'drives fast with nowhere to go', []],
    ['penance', 'Penance', 'm', 'prays harder, judges harder, and punishes their own wanting', ['devout', 'puritanical', 'fanatic']],
    // Unhealthy: ease it fast, then cost them: it comes back worse once it wears off.
    ['drink', 'Drinking', 'u', 'drinks more than usual, and earlier in the day', ['alcoholic']],
    ['drugs', 'Substance abuse', 'u', 'uses to take the edge off', ['functional_addict', 'substance_abuser']],
    ['smoke', 'Smoking', 'u', 'chain-smokes and paces', ['smoker']],
    ['avoidance', 'Avoidance', 'u', 'won\u2019t think about it, talk about it or go near anything that touches it', ['avoidant_attachment', 'in_denial']],
    ['numbing', 'Shutting down', 'u', 'goes numb and far away, and lets things happen around them', ['dissociative']],
    ['fight', 'Fighting', 'u', 'picks a fight or hits something until it\u2019s out of them', ['hot_headed', 'volatile', 'violent', 'explosive_rage']],
    ['lashing', 'Lashing out', 'u', 'snaps at whoever is closest and says the cruel thing first', ['bitter', 'spiteful']],
    ['cruelty', 'Cruelty', 'u', 'takes it out on someone who can\u2019t fight back, and feels calmer after', ['sadistic_personality', 'psychopathic', 'sociopathic']],
    ['reckless', 'Reckless thrills', 'u', 'does something reckless just to feel something else', ['self_destructive']],
    ['gambling', 'Gambling', 'u', 'bets money they can\u2019t lose, chasing the rush', ['gambling_compulsion']],
    ['spending', 'Spending', 'u', 'spends money they shouldn\u2019t on things they don\u2019t need', ['materialistic']],
    ['bingeing', 'Bingeing or starving', 'u', 'eats until they feel sick, or nothing at all', ['binge_eater', 'bulimic', 'anorexic']],
    ['self_harm', 'Hurting themself', 'u', 'hurts themself where nobody will see, to feel something they can control', []],
].map(([id, label, kind, how, traits]) => ({ id, label, kind, how, traits }));
const COPE_BY = Object.fromEntries(COPES.map(c => [c.id, c]));
const COPE_DEFAULT = 'is short with everyone, sleeps badly and loses the thread of things';
// The ways that count for this person: their picks, else the one their strongest matching trait suggests.
export function copesOf(st) {
    const picked = (Array.isArray(st?.copes) ? st.copes : []).filter(id => COPE_BY[id]).slice(0, 3);
    if (picked.length) return { ids: picked, auto: false };
    let best = null, bestV = 0;
    for (const c of COPES) for (const id of c.traits) { const v = st?.moods?.[id] ?? 0; if (v > bestV) { best = c.id; bestV = v; } }
    return { ids: best ? [best] : [], auto: true };
}
export function copingOf(st) {
    const { ids } = copesOf(st);
    return ids.length ? ids.map(id => COPE_BY[id].how).join('; or ') : COPE_DEFAULT;
}
export const copeLabels = st => copesOf(st).ids.map(id => COPE_BY[id].label.toLowerCase());
// How much coping eases, by kind and how many replies in a row it's the same thing again (2.0.4):
//  - healthier ways ease steadily;
//  - mixed ways ease well when fresh and fade to half if it's the same again, never to nothing. Switching it up
//    makes it fresh: another way, or the same way with something new in it (sex that lights a turn-on or kink
//    not lit in this run counts as fresh, and a little stronger);
//  - unhealthy ways ease a lot every time, with no fading or rebound: being drunk or high is its own cost, on the page.
const COPE_EASE = { h: [6, 6, 5, 5], m: [8, 6, 5, 4], u: [12, 12, 12, 12] }, SPARK_BONUS = 2;
// The way named after "coped" on the hidden line, else their first.
export function copeUsed(st, said) {
    const t = String(said ?? '').toLowerCase(), { ids } = copesOf(st);
    const hit = COPES.find(c => t.includes(c.label.toLowerCase()) || t.includes(c.id.replace('_', ' ')));
    return hit ?? COPE_BY[ids[0]] ?? null;
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
    let v = 0, lastBreak = null, cooldown = 0, streak = 0, lastWay = null, seen = new Set();
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
        // Coping their own way is never strain, and eases it; restraint they chose for a reason they believe in
        // still costs them, but half as much as strain they can't make sense of (2.0.3).
        const used = e.coped ? copeUsed(st, e.coped) : null, kind = used?.kind ?? 'm', sparks = e.coped ? (e.sparks ?? []) : [];
        const newSpark = sparks.some(k => !seen.has(k)), fresh = e.coped && (used?.id !== lastWay || newSpark);
        if (!e.coped) { streak = 0; lastWay = null; seen = new Set(); }
        else { streak = fresh ? 1 : streak + 1; if (fresh && !newSpark) seen = new Set(); sparks.forEach(k => seen.add(k)); lastWay = used?.id ?? null; }
        const pushed = e.coped ? 0 : Math.max(0, line);
        const cope = e.coped ? COPE_EASE[kind][Math.min(streak, 4) - 1] + (newSpark && streak === 1 ? SPARK_BONUS : 0) : 0;
        const up = (Math.min(6, feel) + 2 * crit + low + pushed) * (e.chose ? 0.5 : 1), down = Math.min(4, ease) + Math.max(0, -line) + (e.release ? 8 : 0) + cope + 1;
        v = clamp(v + up * rate - down, 0, 100);
        cooldown = Math.max(0, cooldown - 1);
        const edge = crit >= 2 ? 75 : 90;
        if (v >= edge && !cooldown) { lastBreak = { at: trail.length, how: breakOf(st, families) }; cooldown = BREAK_REST; }
        trail.push(Math.round(v));
    }
    const since = lastBreak ? trail.length - 1 - lastBreak.at : null;
    return { value: Math.round(v), level: stressLevel(v)[1], word: stressLevel(v)[2], rate, coping: copingOf(st), copes: copesOf(st), trail: trail.slice(-12),
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
