// 1.47.0: feelings the reply already reports also nudge the Bonds meters, for free. If he bathes her, feeds her
// and gives orders, the hidden line says caring, controlling, in control; those push Care, Discipline and
// Control up, so the dynamic moves to Kept and tended without the story having to name it.
// Only feelings that rose count, each one a small step, and a meter the line moved by itself is left alone.
// Keys: f friendship, r romance, t trust, p control (+ means the character holds it), l pull (+ means the
// player is hooked on the character), and the optional meters by their keys (ca care, di discipline, ...).
const NUDGES = [
    [['caretaker', 'caring', 'aftercare_mode', 'cherishing', 'soft_spot', 'protective', 'reassuring', 'helpful', 'indulgent', 'wants_comfort', 'keeping_vigil'], { ca: 2, f: 1 }],
    [['controlling', 'commanding', 'in_control', 'paternalistic_control', 'stern', 'domspace', 'power_drunk', 'playing_god', 'reasserting', 'demanding'], { p: 2, di: 2 }],
    [['punitive', 'dangling_it', 'withheld_recognition', 'clinical_cruelty', 'testing_limits'], { di: 2, p: 1 }],
    [['cowed', 'helpless', 'vulnerable', 'pleading', 'desperate_for_approval', 'fawning', 'performing_obedience', 'trapped', 'cornered'], { p: -2 }],
    [['horny', 'heated', 'craving', 'desperate_for_it', 'insatiable', 'sexually_frustrated', 'wants_to_take', 'wants_to_be_taken', 'possessive_lust', 'hiding_arousal', 'checking_out', 'seductive', 'flirty', 'leering'], { lu: 2, r: 1 }],
    [['possessive', 'possessive_tenderness', 'possessive_lust', 'territorial', 'jealous_fury'], { po: 2 }],
    [['jealous', 'jealous_lust', 'jealous_fury', 'retroactive_jealousy'], { je: 2 }],
    [['obsessed', 'cant_let_go', 'keeping_tabs', 'shrine_keeping', 'limerent', 'hooked', 'tunnel_vision'], { ob: 2 }],
    [['protective', 'protective_rage', 'angry_for_them', 'watching_over'], { pr: 2 }],
    [['guilty', 'guilt_sick', 'contrite', 'ashamed'], { gu: 2 }],
    [['clingy', 'codependent', 'resentful_need', 'holding_on_too_tight', 'cant_lose_another', 'terrified_of_losing'], { de: 2 }],
    [['resentful', 'spiteful', 'vengeful', 'hateful', 'revenge_fantasy', 'cheated'], { rs: 2, f: -1 }],
    [['curious', 'morbid_curiosity', 'taking_notes', 'aesthetic_fascination'], { fa: 2 }],
    [['worshipful', 'devoted', 'basking'], { pe: 2 }],
    [['corrupting', 'toying', 'manipulative'], { co: 2 }],
    [['sadistic_glee', 'enjoying_their_fear', 'cruel', 'mocking', 'bloodthirsty', 'menacing', 'predatory', 'murderous'], { hu: 2 }],
    [['teaching'], { gd: 2 }],
    [['trusting', 'feels_safe', 'opening_up'], { t: 1 }],
    [['suspicious', 'paranoid', 'guarded'], { t: -1 }],
    [['affectionate', 'warm', 'tender_after_cruelty', 'melting', 'romantic', 'lovesick', 'yearning', 'giddy_in_love'], { r: 1 }],
    [['icy', 'icy_contempt', 'contemptuous', 'dismissive', 'unmoved', 'bored_of_them', 'turned_off', 'disgusted'], { f: -1, r: -1 }],
];
const BY_MOOD = new Map();
for (const [ids, nudge] of NUDGES) for (const id of ids) {
    const sum = BY_MOOD.get(id) ?? {};
    for (const [k, v] of Object.entries(nudge)) sum[k] = (sum[k] ?? 0) + v;
    BY_MOOD.set(id, sum);
}
export const NUDGE_MOODS = [...BY_MOOD.keys()];
const BASE = ['f', 'r', 't', 'p', 'l'];
// ids: feelings that rose this reply. scale follows the pace (Slow burn 0.5, Steady 1, Quick 1.5, Volatile 2).
// Returns { f, r, t, p, l, m: { meter: step } }, each step at most 4 times the scale.
export const PACE_SCALE = { slow: 0.5, steady: 1, quick: 1.5, volatile: 2 };
export function moodNudges(ids = [], scale = 1) {
    const total = {};
    for (const id of new Set(ids)) for (const [k, v] of Object.entries(BY_MOOD.get(id) ?? {})) total[k] = (total[k] ?? 0) + v;
    const cap = v => { const c = Math.round(4 * scale), x = Math.round(v * scale) || Math.sign(v); return Math.max(-c, Math.min(c, x)); };
    const out = { m: {} };
    for (const [k, v] of Object.entries(total)) { if (!v) continue; if (BASE.includes(k)) out[k] = cap(v); else out.m[k] = cap(v); }
    return out;
}
// Folds the nudges into one reply's step. Whatever the line said itself wins.
export function withNudges(step, ids, scale = 1) {
    const n = moodNudges(ids, scale), out = { ...step };
    for (const k of BASE) if (n[k] && !out[k]) out[k] = n[k];
    const m = { ...(step.m ?? {}) };
    for (const [k, v] of Object.entries(n.m)) if (!m[k]) m[k] = v;
    out.m = Object.keys(m).length ? m : step.m ?? null;
    return out;
}
