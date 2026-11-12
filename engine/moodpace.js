import { MOODS } from '../data/catalogue.js';
// How fast feelings move and fade when the story moves them (the hidden line), per character.
// step: the most one reply can move a feeling. ordinary: what the prompt asks for in an ordinary moment.
// after: replies a feeling can go unmentioned before it starts to fade. fade: points lost per reply after that.
export const MOOD_PACE = {
    slow: { label: 'Slow burn', step: 10, ordinary: '2 to 5', turn: '8 to 10', after: 8, fade: 2, hint: 'for long scenes of 40 or more replies' },
    steady: { label: 'Steady', step: 20, ordinary: '5 to 10', turn: '15 to 20', after: 4, fade: 4, hint: 'the default' },
    quick: { label: 'Quick', step: 30, ordinary: '10 to 15', turn: '20 to 30', after: 2, fade: 8, hint: 'for short scenes of around 10 replies' },
    volatile: { label: 'Volatile', step: 40, ordinary: '15 to 25', turn: '30 to 40', after: 1, fade: 12, hint: 'mood swings, every reply' },
};
// The pace cap on one change ("off" still ends a feeling outright).
export const paceDelta = (delta, pace) => delta <= -100 ? delta : Math.max(-pace.step, Math.min(pace.step, delta));
// The dynamic in play keeps the feelings that belong to it going: those wait twice as long before fading.
// A captor's cruelty and nerve, a romance's warmth, an on-off couple's anger and clinging. Free: nothing is sent.
const DYNAMIC_HOLDS = {
    captor: ['cruel', 'bold', 'scared'], obsess: ['attachment', 'desire'], power: ['bold', 'closeness', 'cruel'],
    romance: ['closeness', 'happy', 'desire'], heat: ['desire'], toxic: ['angry', 'attachment', 'sad', 'masks'],
    allies: ['happy', 'bold'], roles: ['closeness', 'calm'], distance: ['cold', 'masks'],
};
export const heldBy = group => new Set(DYNAMIC_HOLDS[group] ?? []);
// One reply's fading. values: { id: value } for feelings that can fade; named: ids this reply mentioned;
// quiet: { id: { n, v } } replies unmentioned and the value when last counted (a value that changed since,
// by hand or by the story, starts the count again). held: ids the current dynamic keeps going (wait twice as long).
// Returns the new values for ids that fade, and the new quiet.
export function fadeStep(values, named, quiet = {}, pace = MOOD_PACE.steady, held = new Set()) {
    const next = {}, out = {};
    for (const [id, v] of Object.entries(values)) {
        if (!(v > 0)) continue;
        if (named.has(id)) { next[id] = { n: 0, v }; continue; }
        const q = quiet[id], n = q && q.v === v ? q.n + 1 : 1;
        if (n > pace.after * (held.has(id) ? 2 : 1)) { const nv = Math.max(0, v - pace.fade); out[id] = nv; if (nv > 0) next[id] = { n, v: nv }; }
        else next[id] = { n, v };
    }
    return { faded: out, quiet: next };
}

// ---- Facts that run their course ----
// A fact with `lasts` (data/catalogue/state.js) wears off on its own as in-world time passes: drunk thins out
// over six hours and leaves a hangover, a nosebleed stops, a bruise fades in a week. Time comes from the info
// board's clock (a time skip moves everything on at once); without one, a reply counts as about ten minutes.
// The story naming a fact again keeps it going. Worked out reply by reply and recorded with the reply, so a
// swipe or Undo puts it back. Free: nothing is sent.
export const REPLY_HOURS = 1 / 6;
// The facts that run a course or bring feelings: { id: { lasts, then, feels, label } }.
export const FACTS = Object.fromEntries(MOODS.filter(m => m.lasts || m.feels).map(m => [m.id, { lasts: m.lasts ?? 0, then: m.then ?? '', feels: m.feels ?? null, label: m.label }]));
const LASTING = Object.fromEntries(Object.entries(FACTS).filter(([, f]) => f.lasts));
const HELD_BACK = 0.8; // what a fact leaves behind: drunk at 80 becomes hungover at 64
// moods: the person's values. clock: { id: { h, v, at } }: hours it has run, its value when the count started,
// and the value it was left at (a different value now means you or the story changed it: the count restarts).
// named: facts the story mentioned this reply. Returns { set: { id: value }, clock, ended: [id] }.
export function factStep(moods = {}, clock = {}, hours = REPLY_HOURS, named = new Set(), pins = {}, facts = LASTING) {
    const set = {}, next = {}, ended = [];
    for (const [id, f] of Object.entries(facts)) {
        const v = moods[id] ?? 0; if (!(v > 0) || pins[id] || id in set) continue;
        let c = clock[id]; if (!c || c.at !== v || named.has(id)) c = { h: 0, v, at: v };
        const h = c.h + Math.max(0, hours), left = h >= f.lasts ? 0 : Math.max(1, Math.round(c.v * (1 - h / f.lasts)));
        if (left !== v) set[id] = left;
        if (left) { next[id] = { h: Math.round(h * 100) / 100, v: c.v, at: left }; continue; }
        ended.push(id);
        if (f.then && !pins[f.then]) { const carry = Math.round(c.v * HELD_BACK); if (carry > (moods[f.then] ?? 0)) { set[f.then] = carry; next[f.then] = { h: 0, v: carry, at: carry }; } }
    }
    return { set, clock: next, ended };
}
// While a fact is on, the feelings it brings rise a little each reply, never past the fact's own strength (or
// 70). Returns [[feeling, new value, fact]] for the ones that move.
export const FEEL_CAP = 70;
export function factFeelings(moods = {}, can = () => true, facts = FACTS) {
    const out = new Map();
    for (const [id, f] of Object.entries(facts)) {
        const v = moods[id] ?? 0; if (!(v > 0) || !f.feels) continue;
        for (const [feel, step] of f.feels) {
            if (!can(feel)) continue;
            const cap = Math.min(v, FEEL_CAP), now = out.get(feel)?.[0] ?? moods[feel] ?? 0;
            if (now < cap) out.set(feel, [Math.min(cap, now + step), id]);
        }
    }
    return [...out].map(([feel, [value, fact]]) => [feel, value, fact]);
}
// ---- Temper: traits that change how fast feelings move ----
// Volatile, hot-headed or dramatic people swing harder and let go sooner; stoic, disciplined or cold-blooded
// ones move less and hold on longer; brooders and grudge-holders keep things going. On top of the chat's pace.
const TEMPERS = {
    swings: ['volatile', 'hot_headed', 'impulsive', 'reckless', 'unpredictable', 'sim_excitable', 'sim_over_emotional', 'sim_dramatic', 'histrionic', 'sim_erratic', 'sensitive', 'chaotic_energy', 'sim_neurotic', 'bubbly'],
    steady: ['disciplined', 'cold_blooded', 'stiff', 'deadpan', 'dignified', 'emotionless', 'methodical', 'mask_of_sanity', 'cool_vibes', 'resilient', 'compartmentalising', 'mature', 'unnervingly_polite'],
    lingers: ['vindictive', 'sore_loser', 'petty_by_nature', 'emotional_scorekeeping', 'sim_brooding', 'sim_gloomy', 'depressed', 'traumatised', 'catastrophiser', 'abandonment_issues'],
};
const temperOf = (moods, ids) => Math.min(1, ids.reduce((sum, id) => sum + (moods?.[id] ?? 0) / 100, 0));
// Returns the pace adjusted for this person, with `temper`: the traits behind it, strongest first, for the panel.
// low: needs that are running low (hungry, tired, uncomfortable): each makes feelings a little quicker to flare.
export const SHORT_FUSE = ['hunger', 'energy', 'comfort'];
export function temperPace(pace, moods = {}, low = []) {
    const worn = Math.min(0.6, 0.3 * low.length);
    const s = Math.min(1, temperOf(moods, TEMPERS.swings) + worn), d = temperOf(moods, TEMPERS.steady), l = temperOf(moods, TEMPERS.lingers);
    if (!s && !d && !l) return pace;
    const temper = Object.values(TEMPERS).flat().filter(id => (moods?.[id] ?? 0) > 0).sort((a, b) => moods[b] - moods[a]);
    return { ...pace, step: Math.max(5, Math.round(pace.step * (1 + 0.3 * s - 0.3 * d))), after: Math.max(1, Math.round(pace.after * (1 - 0.4 * s + 0.6 * d + 0.8 * l))),
        fade: Math.max(1, Math.round(pace.fade * (1 + 0.4 * s - 0.4 * d - 0.4 * l))), temper, swings: s - d, low };
}
