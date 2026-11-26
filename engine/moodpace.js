import { BY_ID, MOODS, sectionOf } from '../data/catalogue.js';
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
    romance: ['closeness', 'desire'], heat: ['desire'], toxic: ['angry', 'attachment', 'sad', 'masks'],
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

// ---- Snaps: a feeling that breaks at once (2.0.11) ----
// A shock can knock a strong feeling out in one reply: an angry man hears she's going back to the father who hurt
// her, and the anger is simply gone, with something else in its place. Before each reply a strong hot or hard
// feeling gets one roll, so it isn't every time. The story still judges whether the moment is a shock at all: the
// note only says what happens if it is, breaking this time or holding. Personality, the dynamic and how much the
// other person means to them weight the roll. Light feelings and calm, sad or scared ones aren't rolled.
export const SNAP_KINDS = new Set(['angry', 'cold', 'cruel', 'bold', 'desire', 'happy']);
const SNAP_LIGHT = new Set(['butterflies', 'grumpy', 'huffy', 'indignant', 'snarky', 'petty', 'nitpicking', 'checking_out', 'mean_jokes', 'hangry', 'irritable']);
export const SNAP_AT = 50, SNAP_COOL = 6;
const SNAP_BASE = { slow: 30, steady: 40, quick: 50, volatile: 60 };
// Traits that let a shock through (protectors, soft hearts, people who flare and burn out) and ones that hold
// on whatever happens (stubborn, proud, vindictive, cold).
const SNAP_GIVES = { empathetic: 10, soft_hearted: 10, kind_hearted: 8, protector_role: 10, protection_giving: 8, dirty_handed_protector: 10, protective_best_friend: 8, hidden_heart: 8,
    one_person_exception: 10, loyal: 5, loyal_to_a_fault: 8, secretly_sentimental: 6, forgiving_nature: 8, mature: 5, sensitive: 6, volatile: 8, hot_headed: 6, impulsive: 6,
    unpredictable: 5, sim_over_emotional: 6, sim_dramatic: 5, abandonment_issues: 10, reluctant_guardian: 6, rescuer: 6 };
const SNAP_HOLDS = { stubborn: 12, prideful: 10, arrogant: 8, vindictive: 12, petty_by_nature: 6, emotional_scorekeeping: 8, contrarian: 6, argumentative: 6, sore_loser: 6,
    cold_blooded: 15, callous: 10, insensitive: 8, emotionless: 10, mask_of_sanity: 10, thick_skinned: 5, eye_for_an_eye: 6, contempt_for_weakness: 8, sim_mean_spirited: 6, sim_brooding: 6 };
// Feelings right now that make losing the other person land hard.
const SNAP_CARES = ['protective', 'caring', 'devoted', 'terrified_of_losing', 'cant_lose_another', 'cant_let_go', 'protective_rage', 'watching_over'];
const SNAP_DYNAMIC = { romance: 10, obsess: 10, toxic: 5, allies: 5, power: -5, captor: -10, distance: -10 };
const snapLabel = id => BY_ID[id]?.label.split('/')[0].trim().toLowerCase() ?? id;
const snappable = id => BY_ID[id] && SNAP_KINDS.has(BY_ID[id].category) && !SNAP_LIGHT.has(id) && sectionOf(BY_ID[id]) === 'mood';
// st: the character. pace: the chat's pace key. bond: { f, r, group } toward the player. recent: replies since their
// last snap (Infinity if none lately). Returns null when nothing is strong enough, else the feelings at stake, the
// chance (10 to 85) and the reasons for the panel.
export function snapOdds(st, { pace = 'steady', bond = null, recent = Infinity } = {}) {
    const m = st?.moods ?? {}, pins = st?.pins ?? {};
    const feel = Object.entries(m).filter(([id, v]) => v >= SNAP_AT && !pins[id] && snappable(id))
        .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
    if (!feel.length) return null;
    let chance = SNAP_BASE[pace] ?? SNAP_BASE.steady;
    const gives = [], holds = [];
    for (const [id, w] of Object.entries(SNAP_GIVES)) if ((m[id] ?? 0) >= 21) { chance += w; gives.push(id); }
    for (const [id, w] of Object.entries(SNAP_HOLDS)) if ((m[id] ?? 0) >= 21) { chance -= w; holds.push(id); }
    const cares = SNAP_CARES.filter(id => (m[id] ?? 0) >= 41);
    if (cares.length) { chance += 10; gives.push(cares[0]); }
    const close = Math.max(bond?.f ?? 0, bond?.r ?? 0), why = [];
    if (close >= 61) { chance += 15; why.push('close to you'); } else if (close >= 41) { chance += 8; why.push('fond of you'); } else if (bond && close <= -20) { chance -= 10; why.push('set against you'); }
    const dyn = SNAP_DYNAMIC[bond?.group] ?? 0; chance += dyn;
    if (recent < SNAP_COOL) { chance = Math.round(chance / 2); why.push('snapped a moment ago'); }
    chance = Math.max(10, Math.min(85, Math.round(chance)));
    return { feel, chance, gives, holds, why, dyn };
}
// One roll from the reply's seed, 0 to 99.
export const snapRoll = seed => { let h = 2166136261 ^ seed; for (const c of 'snap') h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 13; return Math.abs(Math.imul(h, 2654435761) >>> 0) % 100; };
// The line for the note: what happens if this reply's moment is a shock. No example feelings, since Opus copies them.
export function snapLine(odds, roll, n) {
    if (!odds) return '';
    const what = odds.feel.map(snapLabel).join(' and ');
    return roll < odds.chance
        ? `If something in this moment hits ${n} hard enough to cut through how ${n} feels now (${what}), as a real shock or a line crossed, not just being pushed back, it breaks at once this time: end it or drop it sharply in the hidden line, and whatever the moment stirs in ${n} instead takes its place, shown in ${n}'s own way. If nothing like that happens, it carries on as usual.`
        : `If something in this moment hits ${n} hard enough to cut through how ${n} feels now (${what}), it holds this time: it can shift, turn or show cracks, but it doesn't vanish in one reply.`;
}
// After a reply: did a rolled feeling break? before/after are the person's values. Used for the cool-down and to let
// the feeling that takes its place come in strongly.
export const snapped = (id, before, after) => before >= SNAP_AT && after <= 10 && snappable(id);

// ---- Restraint giving way (2.0.18) ----
// The same idea for the Restraint meter: while it's strong, one roll a reply decides whether, if the moment really
// breaks through (not a near miss), it gives way at once this time or holds. Desire, drink and an impulsive nature make
// it likelier; discipline, principles, propriety and guilt (often the reason for holding back) make it less likely.
// After it gives way the odds halve for six replies, so it isn't broken every night.
const GIVE_BASE = { slow: 20, steady: 30, quick: 40, volatile: 50 };
const GIVES_WAY = { impulsive: 10, reckless: 10, hedonistic: 8, thrill_seeker: 6, hot_headed: 5, volatile: 5, live_fast: 6, addictive_personality: 5, sim_flirty: 4 };
const HOLDS_BACK = { disciplined: 12, principled: 10, devout: 10, puritanical: 12, dutiful: 8, stiff: 6, uptight: 8, risk_averse: 6, control_freak: 8, respectability_obsessed: 8, keeps_up_appearances: 6, mature: 4 };
const DRINK = ['drunk', 'blackout_drunk', 'tipsy', 'crossfaded', 'hazy_drunk', 'party_brain', 'high', 'stoned'];
export const RESTRAINT_AT = 50, RESTRAINT_BREAK = 30;
// rt: the Restraint meter now. lust, guilt: those meters (0 if off). recent: replies since restraint last gave way.
export function restraintOdds(st, { pace = 'steady', rt = 0, lust = 0, guilt = 0, recent = Infinity } = {}) {
    if (!(rt >= RESTRAINT_AT)) return null;
    const m = st?.moods ?? {}, why = [];
    let chance = GIVE_BASE[pace] ?? GIVE_BASE.steady;
    for (const [id, w] of Object.entries(GIVES_WAY)) if ((m[id] ?? 0) >= 21) { chance += w; why.push(id); }
    for (const [id, w] of Object.entries(HOLDS_BACK)) if ((m[id] ?? 0) >= 21) chance -= w;
    if (Object.entries(m).some(([id, v]) => v >= 41 && BY_ID[id]?.category === 'desire') || lust >= 61) chance += 10;
    if (DRINK.some(id => (m[id] ?? 0) > 0)) chance += 10;
    if (Object.entries(m).some(([id, v]) => v >= 41 && /guilt/.test(id)) || guilt >= 61) chance -= 8;
    if (recent < SNAP_COOL) chance = Math.round(chance / 2);
    return { chance: Math.max(5, Math.min(80, Math.round(chance))), why };
}
export function restraintLine(odds, roll, n, u) {
    if (!odds) return '';
    return roll < odds.chance
        ? `If something in this moment breaks through ${n}'s restraint with ${u}, a moment ${n} can't hold back from rather than a near miss, it gives way at once this time: ${n} acts on what ${n} has been holding back, and the hidden line drops restraint by ${RESTRAINT_BREAK} or more. If nothing like that happens, ${n} holds back as usual.`
        : `If something in this moment tests ${n}'s restraint with ${u}, it holds this time: ${n} comes close and stops short.`;
}
