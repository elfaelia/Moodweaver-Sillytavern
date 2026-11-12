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
