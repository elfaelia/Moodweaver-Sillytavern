import { MOODS } from '../data/catalogue.js';
// Feelings the reply already reports also nudge the Bonds meters, for free (no extra prompt text). If he
// bathes her, feeds her and gives orders, the hidden line says caring, controlling, in control; those push
// Care, Discipline and Control up, so the dynamic moves to Kept and tended without the story naming it.
// Only feelings that rose count, each one a small step, and a meter the line moved by itself is left alone.
// Keys: f friendship, r romance, t trust, p control (+ means the character holds it), l pull (+ means the
// player is hooked on the character), and the optional meters by their keys (ca care, di discipline, ...).
// A meter that's switched off simply ignores its nudge.

// Every feeling in these families nudges this way unless NUDGES below says otherwise. Sad, calm, energy and
// headspace feelings are mostly about the character's own state, so only the ones listed below count.
const FAMILY = {
    happy: { f: 1 },
    bold: { p: 1 },
    closeness: { f: 1, ca: 1 },
    desire: { lu: 1 },
    attachment: { de: 1, ob: 1 },
    cold: { f: -1, op: -1 },
    scared: { p: -1 },
    angry: { rs: 1, vo: 1 },
    cruel: { hu: 1, p: 1 },
    masks: { op: -1 },
};
// Named feelings. A feeling listed here uses only what's listed (summed over its rows), not its family's
// default; {} means it moves nothing.
const NUDGES = [
    // care, rules and control
    [['caretaker', 'caring', 'aftercare_mode', 'cherishing', 'soft_spot', 'protective', 'reassuring', 'helpful', 'indulgent', 'wants_comfort', 'keeping_vigil'], { ca: 2, f: 1 }],
    [['nesting', 'homey', 'comforting_presence'], { ca: 1, t: 1 }],
    [['controlling', 'commanding', 'in_control', 'paternalistic_control', 'stern', 'domspace', 'power_drunk', 'playing_god', 'reasserting', 'demanding'], { p: 2, di: 2 }],
    [['punitive', 'dangling_it', 'withheld_recognition', 'clinical_cruelty', 'testing_limits', 'nitpicking'], { di: 2, p: 1 }],
    [['intimidating', 'terrorising', 'abusive', 'blackmailing', 'coercive', 'breaking_will', 'breaking_them', 'one_step_ahead', 'superior_cool', 'teasing_them', 'dominant_hunger', 'wants_to_take'], { p: 2 }],
    [['cowed', 'helpless', 'vulnerable', 'pleading', 'desperate_for_approval', 'fawning', 'performing_obedience', 'trapped', 'cornered', 'hostage_calm', 'prey_instinct', 'subspace', 'submissive_longing'], { p: -2 }],
    [['wants_to_be_taken', 'craving_pain', 'wants_praise', 'teased_to_breaking', 'wheedling', 'bratty_defiance', 'feeling_small', 'pathetic', 'worthless', 'defeated', 'one_step_behind', 'losing_control', 'desperate', 'petulant', 'temper_tantrum', 'hypnotised', 'broken_mind', 'afraid', 'hunted', 'terrified_awe', 'dread_of_them', 'eggshells', 'dreading_punishment', 'wanting_to_belong_to'], { p: -1 }],
    [['dreading_punishment', 'breaking_will'], { di: 1 }],
    // heat
    [['horny', 'heated', 'craving', 'desperate_for_it', 'insatiable', 'sexually_frustrated', 'wants_to_take', 'wants_to_be_taken', 'possessive_lust', 'hiding_arousal', 'checking_out', 'seductive', 'flirty', 'leering', 'lust_at_first_sight', 'starved_for_them', 'primal', 'teased_to_breaking'], { lu: 2 }],
    [['hungry_to_ruin', 'forbidden_want', 'jealous_lust', 'admiration_to_desire', 'intellectual_chemistry', 'aesthetic_fascination', 'conflicted_attraction', 'reverent_desire', 'voyeuristic', 'wants_to_be_watched', 'craving_pain', 'wants_praise', 'teasing_them', 'lovestruck_lust', 'shy_desire', 'dominant_hunger', 'submissive_longing', 'guilty_lust', 'needy_for_touch', 'desperate_closeness', 'coy', 'touch_starved', 'butterflies', 'butterflies_kiss', 'swaggering_flirt', 'provocative', 'naughty_fun', 'seductive_act', 'fantasising'], { lu: 1 }],
    [['sated'], { lu: -1 }],
    [['turned_off'], { lu: -1, r: -1 }],
    // ownership, jealousy, obsession
    [['possessive', 'possessive_tenderness', 'possessive_lust', 'territorial', 'jealous_fury', 'staking_a_claim', 'isolating', 'possessive_cruelty'], { po: 2 }],
    [['rescue_entitlement', 'protective_jealousy'], { po: 1, pr: 1 }],
    [['jealous', 'jealous_lust', 'jealous_fury', 'retroactive_jealousy'], { je: 2 }],
    [['envious', 'competing_for_them', 'afraid_to_be_replaced', 'replaceable', 'protective_jealousy'], { je: 1 }],
    [['obsessed', 'cant_let_go', 'keeping_tabs', 'shrine_keeping', 'limerent', 'hooked', 'tunnel_vision', 'obsessive_thinking'], { ob: 2 }],
    [['rescue_fixation', 'fixated_watching', 'love_addiction', 'devotion_cult', 'obsessive_collecting', 'replaying_the_moment', 'fantasising'], { ob: 1 }],
    [['keeping_tabs', 'sneaking_close', 'fixated_watching', 'obsessive_collecting', 'watchful_quiet', 'detective_mind', 'observant', 'blackmailing'], { kn: 1 }],
    [['hooked', 'love_addiction'], { l: -1 }],
    // protecting and loyalty
    [['protective', 'protective_rage', 'angry_for_them', 'watching_over', 'vigilant', 'holding_it_together_for_them', 'rescue_fixation'], { pr: 2 }],
    [['ride_or_die_energy', 'covering_for_them', 'chosen_belonging'], { ly: 2 }],
    [['devoted', 'platonic_love', 'devotion_quiet', 'trauma_bonded'], { ly: 1 }],
    // guilt and grudges
    [['guilty', 'guilt_sick', 'contrite', 'ashamed', 'self_directed_rage', 'forbidden_want', 'guilty_lust', 'regretful_longing'], { gu: 2 }],
    [['remorseless'], { gu: -2, hu: 1 }],
    [['resentful', 'spiteful', 'vengeful', 'hateful', 'revenge_fantasy', 'cheated'], { rs: 2, f: -1 }],
    [['grudge_holding', 'humiliated_rage', 'jilted'], { rs: 2 }],
    [['hurt', 'used', 'rejected', 'left_behind', 'sulking', 'sour', 'wounded_pride', 'insulted', 'envious', 'petty', 'petty_rage', 'schadenfreude', 'malicious_compliance', 'scapegoating', 'sabotaging', 'passive_aggressive', 'sullen', 'conflicted_attraction', 'murderous_glare', 'abandonment_rage', 'trauma_bonded'], { rs: 1 }],
    [['forgiving'], { rs: -2, t: 1 }],
    // dependence
    [['clingy', 'codependent', 'resentful_need', 'holding_on_too_tight', 'cant_lose_another', 'terrified_of_losing', 'separation_anxiety', 'identity_merging', 'love_addiction', 'trauma_bonded'], { de: 2 }],
    [['lonely', 'lovesick', 'missing_them', 'waiting_on_them', 'reassurance_loop', 'testing_attachment', 'abandonment_rage', 'inseparable', 'imprinting', 'afraid_to_be_replaced', 'replaceable', 'insecure', 'desperate', 'desperate_for_approval', 'wheedling', 'rejected', 'forsaken', 'unwanted', 'left_behind', 'sub_drop', 'needy_for_touch', 'touch_starved', 'starved_for_them', 'desperate_closeness', 'wanting_to_belong_to', 'held_together', 'nesting', 'sneaking_close', 'resentful_need'], { de: 1 }],
    [['avoidant', 'fear_of_burdening'], { de: -1 }],
    // fascination, pedestal, corruption, hurting, teaching
    [['curious', 'morbid_curiosity', 'taking_notes', 'aesthetic_fascination'], { fa: 2 }],
    [['intellectual_chemistry', 'voyeuristic', 'thrill_of_chase', 'charmed', 'fixated_watching', 'predatory_patience', 'hypnotised'], { fa: 1 }],
    [['worshipful', 'devoted', 'basking', 'idealised_stranger', 'devotion_cult'], { pe: 2 }],
    [['reverent_desire', 'shrine_keeping', 'terrified_awe', 'desperate_for_approval'], { pe: 1 }],
    [['disenchanted', 'disappointed_in_them'], { pe: -2 }],
    [['corrupting', 'toying', 'manipulative', 'gaslighting', 'dividing_loyalties', 'breaking_them'], { co: 2 }],
    [['hungry_to_ruin', 'love_bombing', 'divide_and_rule', 'weaponised_kindness', 'sabotaging', 'coercive', 'isolating', 'exploiting_weakness', 'false_mercy', 'calculating_coldness', 'strategic_vulnerability', 'breaking_will'], { co: 1 }],
    [['sadistic_glee', 'enjoying_their_fear', 'cruel', 'mocking', 'bloodthirsty', 'menacing', 'predatory', 'murderous', 'violent', 'abusive', 'terrorising', 'murderous_glare', 'bloodlust_haze'], { hu: 2 }],
    [['hungry_to_ruin', 'wicked_delight', 'thrill_of_chase', 'predatory_patience', 'possessive_cruelty', 'public_humiliation', 'humiliating_them', 'dehumanising', 'silent_menace', 'teasing_cruelly', 'smiling_threat', 'breaking_them', 'calculating_cruelty', 'harsh', 'ruthless', 'whatever_it_takes'], { hu: 1 }],
    [['teaching'], { gd: 2 }],
    [['proud_of_them'], { gd: 1, re: 2 }],
    // respect
    [['contemptuous', 'icy_contempt', 'condescending', 'belittling', 'dehumanising', 'degrading'], { re: -2 }],
    [['snarky', 'mean_jokes', 'nitpicking', 'dismissive', 'unimpressed', 'insulted', 'public_humiliation', 'humiliating_them'], { re: -1 }],
    [['admiration_to_desire', 'competing_for_them', 'competitive_streak', 'dared', 'defiant'], { re: 1 }],
    // volatility
    [['push_pull', 'spoiling_for_fight', 'seeing_red', 'temper_tantrum', 'abandonment_rage'], { vo: 2 }],
    [['grumpy', 'huffy', 'impatient', 'frustrated', 'irritable', 'exasperated', 'provoked', 'petulant', 'defensive', 'bratty_defiance', 'provocative', 'testing_attachment', 'eggshells', 'losing_control', 'unhinged', 'primal', 'violent', 'bloodthirsty', 'humiliated_rage'], { vo: 1 }],
    // trust
    [['trusting', 'feels_safe', 'opening_up', 'grateful', 'grateful_joy', 'at_ease_with_them', 'imprinting', 'held_together', 'subspace', 'afterglow'], { t: 1 }],
    [['suspicious', 'paranoid', 'guarded', 'hurt', 'used', 'jilted', 'forsaken', 'skin_crawling', 'uneasy', 'creeped_out', 'horror_struck', 'afraid', 'hunted', 'eggshells', 'prey_instinct', 'arms_length'], { t: -1 }],
    [['betrayed', 'dread_of_them'], { t: -2 }],
    // openness
    [['opening_up', 'mask_slip', 'openhearted'], { op: 2 }],
    [['expressive', 'cant_hold_it_in', 'confession_close', 'emotional', 'deeply_moved', 'alive_again', 'wants_to_be_watched', 'shameless'], { op: 1 }],
    [['silent_treatment', 'emotionally_unavailable'], { op: -2 }],
    [['guarded', 'arms_length', 'shy', 'embarrassed', 'awkward', 'clammed_up', 'fear_of_being_found_out', 'never_said_it', 'quietly_breaking', 'shy_desire', 'coy', 'in_denial', 'defensive', 'passive_aggressive', 'sullen', 'smiling_threat', 'performing_obedience', 'seductive_act', 'holding_it_together_for_them', 'calculating_coldness', 'fear_of_burdening', 'hiding_arousal'], { op: -1 }],
    // warmth and romance
    [['affectionate', 'warm', 'tender_after_cruelty', 'melting', 'romantic', 'lovesick', 'yearning', 'giddy_in_love', 'smitten', 'sweet_on_them', 'tender_teasing', 'reunited', 'missing_them', 'heartsick', 'never_said_it', 'regretful_longing', 'sentimental', 'deeply_moved', 'making_it_count', 'devotion_quiet', 'butterflies', 'butterflies_kiss', 'lovestruck_lust', 'charmed', 'flirty', 'love_bombing', 'afterglow'], { r: 1 }],
    [['new_relationship_energy'], { r: 2 }],
    [['mourning_the_relationship', 'emotionally_unavailable'], { r: -1 }],
    [['icy', 'icy_contempt', 'contemptuous', 'dismissive', 'unmoved', 'bored_of_them', 'disgusted', 'creeped_out'], { f: -1, r: -1 }],
    [['grateful', 'grateful_joy', 'platonic_love', 'grudging_fondness', 'fond_exasperation', 'welcoming', 'tender_teasing', 'reunited', 'inseparable', 'chosen_belonging', 'contagious_possibility', 'naughty_fun'], { f: 1 }],
    [['ghosting', 'avoidant', 'withdrawn', 'closed_off', 'distant', 'detached', 'frosty_politeness', 'stonewalling', 'indifferent'], { f: -1, op: -1 }],
    // feelings with a family default that aren't really about the player
    [['unbothered', 'dead_eyed', 'empty', 'numbed_out', 'emotionally_starved_cold', 'caught_out', 'devoted_to_a_ghost', 'status_panic', 'fear_of_owing', 'out_of_place', 'squeamish', 'waiting_for_bad_news', 'disoriented', 'spooked', 'stage_fright', 'second_guessing', 'hangry', 'angry_at_the_dead', 'hiding_it_from_family', 'partying_it_off', 'confessing_to_no_one', 'hiding_evidence', 'righteous', 'vindicated'], {}],
];
const LISTED = new Map();
for (const [ids, nudge] of NUDGES) for (const id of ids) {
    const sum = LISTED.get(id) ?? {};
    for (const [k, v] of Object.entries(nudge)) sum[k] = (sum[k] ?? 0) + v;
    LISTED.set(id, sum);
}
const BY_MOOD = new Map();
for (const m of MOODS) {
    if (m.kind !== 'mood') continue;
    const own = LISTED.get(m.id) ?? FAMILY[m.category];
    if (own && Object.values(own).some(Boolean)) BY_MOOD.set(m.id, own);
}
// Feelings that count as wanting: rising, they warm the Desire arousal bar when the line gave it no step.
const WANTING = new Set(MOODS.filter(m => m.kind === 'mood' && m.category === 'desire').map(m => m.id));
const BASE = ['f', 'r', 't', 'p', 'l'];
// ids: feelings that rose this reply. scale is the pace's lean (Slow burn 0.5, Steady 1, Quick 1.5, Volatile 2).
// Returns { f, r, t, p, l, m: { meter: step }, a: arousal step }, each step at most 4 times the scale.
function moodNudges(ids = [], scale = 1) {
    const total = {}, set = new Set(ids);
    for (const id of set) for (const [k, v] of Object.entries(BY_MOOD.get(id) ?? {})) total[k] = (total[k] ?? 0) + v;
    const cap = v => { const c = Math.round(4 * scale), x = Math.round(v * scale) || Math.sign(v); return Math.max(-c, Math.min(c, x)); };
    const out = { m: {}, a: cap(2 * [...set].filter(id => WANTING.has(id)).length) };
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
    if (n.a && !step.d?.a && !step.d?.release) out.d = { ...(step.d ?? {}), a: n.a };
    return out;
}
// Facts that newly come on move meters too, when the line didn't: someone hurt draws Care and
// Protectiveness from the other, someone drunk lowers their own guard. his: facts that came on for the
// character this reply; yours: facts that came on for the player. Optional meters that are off ignore it.
const HURT = ['injured', 'bleeding', 'concussed', 'burned', 'sick', 'weak', 'nosebleed', 'post_seizure', 'withdrawal', 'drugged', 'sedated'];
const UNDER = ['tipsy', 'drunk', 'blackout_drunk', 'high', 'stoned', 'rolling', 'tripping', 'crossfaded', 'on_shrooms'];
export function factNudges(his = [], yours = [], scale = 1) {
    const has = (list, ids) => list.some(id => ids.includes(id)), out = { m: {} }, step = v => Math.max(1, Math.round(v * scale));
    if (has(yours, HURT)) { out.m.ca = step(2); out.m.pr = step(2); }
    if (has(yours, UNDER)) out.m.pr = Math.max(out.m.pr ?? 0, step(1));
    if (has(his, HURT)) out.m.de = step(1);
    if (has(his, UNDER)) out.m.op = step(2);
    return out;
}
// Folds fact nudges into a step the same way: whatever the line (or the feelings) said wins.
export function withFacts(step, his, yours, scale = 1) {
    const n = factNudges(his, yours, scale); if (!Object.keys(n.m).length) return step;
    const out = { ...step }, m = { ...(step.m ?? {}) };
    for (const [k, v] of Object.entries(n.m)) if (!m[k]) m[k] = v;
    out.m = Object.keys(m).length ? m : step.m ?? null;
    return out;
}
// How many feelings move a meter (for DEVELOPING and the checks).
export const nudgedMoods = () => BY_MOOD;
