import { MOODS } from '../data/catalogue.js';

// Lines that join sections that used to sit side by side without touching. Each one only shows when
// both halves are on, and they sit under the dynamic in the Bonds lines. Written with names; index.js runs them
// through the pronoun pass so they read "his" and "her".
//
// Role \u00d7 dynamic: a role sets the frame (doctor, captor, boss), the dynamic says what's happening inside it.
// [role ids (his side toward you or both ways), dynamic groups or names, text(n, u)]. First match wins.
const ROLE_LINKS = [
    [['doctor_of', 'patient_of', 'scientist_and_subject'], ['Kept and tended', 'Tending', 'Strict and tender', 'Lab pet', 'Doll and dresser', 'Guardian', 'For your own good', 'Conditioning captor', 'Breaking in', 'captor'],
        (n, u) => `${n}'s care for ${u} stays clinical: charts, temperatures, doses, a professional voice for intimate things, and treatment as the excuse for everything`],
    [['doctor_of', 'patient_of', 'scientist_and_subject'], ['romance', 'heat'],
        (n, u) => `desire breaks ${n}'s professional rules: examinations that linger, a bedside manner that slips, and both of them knowing a doctor shouldn't`],
    [['captor_of', 'captive_of', 'captor_captive', 'gilded_cage', 'spoiled_captive'], ['romance', 'heat'],
        (n, u) => `every tender or wanting moment between ${n} and ${u} happens behind a locked door, and both know who holds the key`],
    [['boss_of', 'works_for', 'office_romance'], ['heat', 'power', 'romance'],
        (n, u) => `the office is the board ${n} and ${u} play on: closed doors, dictation, staying late, and a job that depends on how it goes`],
    [['teacher_of', 'student_of', 'mentor'], ['romance', 'heat'],
        (n, u) => `lessons between ${n} and ${u} keep turning into something neither should allow, and the gap in rank makes every touch forbidden`],
    [['employs_in_house', 'in_service_to'], ['power', 'romance', 'heat', 'captor'],
        (n, u) => `service sets the rules between ${n} and ${u}: who knocks, who waits, who can be dismissed for a look`],
    [['deals_to', 'buys_from'], ['toxic', 'obsess', 'power'],
        (n, u) => `the supply is the leash: when ${u} needs it, ${n} can name the price`],
    [['sees_as_muse', 'is_muse'], ['obsess', 'power', 'heat'],
        (n, u) => `${u} is ${n}'s subject as much as anything else: posed, photographed, arranged and studied`],
    [['married', 'arranged_marriage', 'marriage_of_convenience'], ['toxic', 'distance', 'power'],
        (n, u) => `the marriage keeps ${n} and ${u} in the same house and bed whatever is happening between them, and leaving costs more than staying`],
    [['bodyguard'], ['romance', 'heat'],
        (n, u) => `wanting ${u} is a distraction ${n} can't afford on the job, so it comes out in how close ${n} stands and who ${n} won't let near`],
    [['exes'], ['romance', 'heat', 'toxic'],
        (n, u) => `old history is in every touch: ${n} and ${u} know each other's worst habits and best spots`],
    [['has_power_over', 'under_power', 'power_imbalance'], ['toxic', 'romance', 'heat'],
        (n, u) => `${n} holds the cards, so every fight and every tender moment ends where ${n} decides`],
];
// roles: { id: strength } for his side toward you and both ways together. dynamic: { name (catalogue key), group }.
export function roleLink(roles = {}, dynamic, n, u) {
    if (!dynamic) return '';
    const hit = ROLE_LINKS.find(([ids, targets]) => ids.some(id => (roles[id] ?? 0) >= 41) && (targets.includes(dynamic.key) || targets.includes(dynamic.group)));
    return hit ? hit[2](n, u) : '';
}

// Mood \u00d7 dynamic: how the strongest feeling shows inside the current dynamic, so neither one gets dropped.
// What the dynamic keeps doing, by group, and how each family of feelings bends it.
const HOLD = {
    captor: 'the routines and the locks stay', obsess: 'the fixation stays', power: 'who\u2019s in charge doesn\u2019t change', romance: 'the love underneath holds',
    heat: 'the pull between them stays', toxic: 'the cycle keeps turning', allies: 'they still have each other\u2019s backs', roles: 'the roles still hold',
    distance: 'the gap between them stays', own: 'their dynamic holds',
};
const BEND = {
    angry: 'done with rougher hands, shorter words and quicker punishment', cruel: 'with a deliberate edge, testing how much it can hurt',
    sad: 'heavier and quieter, with cracks showing', scared: 'jumpy and defensive, ready to pull back or lash out', desire: 'charged, with touches that linger and everything leaning toward sex',
    happy: 'lighter and more playful than usual, teasing rather than hurting', closeness: 'softer, letting more tenderness through than usual, and gentle with the body', attachment: 'clingier and more possessive, unwilling to let go',
    cold: 'colder and more distant, done without warmth', calm: 'slower and more deliberate, perfectly controlled', bold: 'cockier and more forceful, pushing further',
    masks: 'behind a mask, so what shows isn\u2019t what\u2019s underneath', energy: 'at a different pace than usual, restless or drained', headspace: 'distracted and half lost in thought',
};
// Pairs that already say the same thing, so a line would only repeat the dynamic.
const SAME = new Set(['desire:heat', 'closeness:romance', 'attachment:obsess', 'cold:distance', 'cruel:toxic']);
// mood: { label, family (its Moods-tab category), value }. dynamic: { name, group }.
export function moodLink(mood, dynamic, n) {
    if (!mood || !dynamic || mood.value < 55 || !BEND[mood.family] || SAME.has(`${mood.family}:${dynamic.group}`)) return '';
    const word = mood.label.split('/')[0].trim().toLowerCase();
    return `${n} is ${word} inside ${dynamic.name.toLowerCase()}: ${HOLD[dynamic.group] ?? HOLD.own}, but ${BEND[mood.family]}`;
}

// Tie \u00d7 dynamic: where a tie someone set and the current dynamic pull apart (or fit in a way worth saying),
// one line on how both are true at once, so Claude writes the strain instead of dropping either.
// [tie ids, whose side ('n' his side toward you, 'u' yours toward him; both-ways tags count for either),
//  dynamic groups or names, text(n, u)]. First match wins.
const LOVE = ['in_love', 'loves', 'devoted', 'cherishes', 'would_die_for'];
const FIGHTS = ['Cold war', 'Nemesis', 'Sworn enemies', 'Worthy rival', 'Mentor turned rival', 'Bickering friends', 'Frenemies', 'Sparring partners'];
const CLOSE = ['Found family', 'Old friends', 'Ride or die', 'Partners in crime', 'Brothers in arms'];
const GIVES_WAY = ['wrapped', 'indulges', 'comes_running', 'walks_on_eggshells', 'at_their_mercy', 'cant_stay_angry', 'undone_by_tears', 'submits_to'];
const TIE_LINKS = [
    [GIVES_WAY, 'n', ['power', 'captor'], (n, u) => `whoever holds the power between them, ${n} gives way to ${u} where it counts to ${u}: ${u}'s wants, ${u}'s comforts, ${u}'s small demands`],
    [['makes_demands', 'on_a_string', 'upper_hand', 'sweet_talks', 'plays_helpless'], 'u', ['power', 'captor'], (n, u) => `${u} has ways of getting what ${u} wants from ${n}, and they work even inside ${n}'s control: ${n} gives in on the small things and keeps the big ones`],
    [LOVE, 'n', ['distance'], (n, u) => `${n} still loves ${u} under the distance: the coldness costs ${n} more than it shows, and it cracks at small things`],
    [LOVE, 'n', FIGHTS, (n, u) => `the fight between ${n} and ${u} is fought by someone in love: ${n} aims to win, never to wound past repair`],
    [LOVE, 'n', ['toxic'], (n, u) => `${n} loves ${u} and still does the damage; both are true, and ${n} knows it in the quiet moments`],
    [['idolises', 'idealises', 'sees_as_miracle'], 'n', ['power', 'captor'], (n, u) => `${n} puts ${u} on a pedestal and still holds the reins: worship and control in the same hands`],
    [['sees_as_equal', 'respects', 'admires'], 'n', ['power', 'captor'], (n, u) => `${n} holds the upper hand but respects ${u} too much to treat ${u} as less: orders come as asks, and ${u}'s no counts`],
    [['protects', 'watches_over'], 'n', ['captor'], (n, u) => `${n} calls it protection: every lock and rule between them is, to ${n}, keeping ${u} safe`],
    [['protects', 'watches_over', 'would_die_for'], 'n', ['distance', 'toxic'], (n, u) => `whatever's wrong between them, ${n} still steps in the moment ${u} is in danger`],
    [['distrusts', 'suspicious_of', 'thinks_liar', 'betrayed_by'], 'n', ['romance', 'heat'], (n, u) => `${n} wants ${u} without trusting ${u}: closeness comes with checking, testing and holding something back`],
    [['trusts', 'safe_with', 'confides_in'], 'n', ['toxic'], (n, u) => `${n} trusts ${u}, which is exactly what makes what's happening between them hurt`],
    [['fears', 'intimidated_by', 'threatened_by'], 'n', ['romance', 'heat'], (n, u) => `fear sits under ${n}'s want for ${u}: every soft moment carries an edge of watching for the turn`],
    [['hates', 'despises', 'resents', 'cant_stand'], 'n', ['romance', 'heat'], (n, u) => `${n} resents ${u} and wants ${u} anyway, and each feeling gives the other teeth`],
    [['hates', 'despises', 'resents'], 'n', CLOSE, (n, u) => `${n} stands by ${u} with a grudge still alive: loyal in what ${n} does, sharp in what ${n} says`],
    [['hurt_by', 'heartbroken_over', 'rejected_by'], 'n', ['romance', 'heat'], (n, u) => `${n} lets ${u} close while braced for it to happen again`],
    [['guilty_toward', 'wants_to_apologise', 'regrets'], 'n', ['power', 'captor', 'toxic'], (n, u) => `${n} holds on knowing ${n} wronged ${u}: the guilt slips out as gentleness ${n} won't explain`],
    [['jealous', 'possessive', 'theyre_mine'], 'n', ['distance'], (n, u) => `${n} keeps ${u} at arm's length and still can't stand anyone else getting close to ${u}`],
    [['jealous', 'possessive', 'theyre_mine'], 'n', ['romance'], (n, u) => `${n}'s love for ${u} runs possessive: tender in private, a hand on ${u} in company`],
    [['depends', 'cant_live_without', 'cant_let_go'], 'n', [...FIGHTS, 'distance'], (n, u) => `${n} needs ${u} and is fighting ${u} anyway, which makes every round cost more`],
    [['rival', 'envies'], 'n', ['romance', 'heat'], (n, u) => `${n} keeps competing with ${u} even in love: who wants it more, who gives in first`],
    [['wants_to_hurt', 'wants_to_torment', 'wants_to_break'], 'n', ['romance'], (n, u) => `tenderness and the wish to hurt ${u} sit side by side in ${n}; neither cancels the other`],
    [['dominates', 'controls', 'upper_hand', 'makes_demands'], 'n', ['romance'], (n, u) => `${n} keeps the upper hand even in tenderness: care comes with terms`],
    [['distrusts', 'fears', 'suspicious_of'], 'u', ['romance', 'heat'], (n, u) => `${n} wants ${u} while ${u} stays wary, so ${n} has to keep earning the closeness`],
    [LOVE, 'u', ['distance'], (n, u) => `${u} still loves ${n} under the distance, and ${n} can tell, or almost can`],
];
// his: his side toward you plus both ways; yours: your side toward him plus both ways. { id: strength }.
export function tieLink(his = {}, yours = {}, dynamic, n, u) {
    if (!dynamic) return '';
    const hit = TIE_LINKS.find(([ids, side, targets]) => ids.some(id => ((side === 'u' ? yours : his)[id] ?? 0) >= 41) && (targets.includes(dynamic.group) || targets.includes(dynamic.key)));
    return hit ? hit[3](n, u) : '';
}

// Core traits \u00d7 dynamic: how who someone is at heart changes the way they carry the dynamic, without
// changing the dynamic. lead: 'n' when he holds the power right now, 'u' when you do, '' when nobody clearly does.
// [trait ids, test(dynamic, lead), text(n, u, name)]. First match wins.
const CORE_BENDS = [
    [['prideful', 'arrogant', 'superior', 'vain', 'dignified', 'stubborn', 'egotistical', 'snobbish', 'entitled'], (d, lead) => lead === 'u',
        (n, u) => `${n} gives way to ${u} but never looks like it: concessions come dressed as choices, and the pride stays intact`],
    [['soft_hearted', 'sunshine', 'selfless', 'self_sacrificing', 'gentlemanly', 'fatherly'], (d, lead) => lead === 'n' || ['power', 'captor'].includes(d.group),
        (n, u) => `${n} holds the power gently: firm where it counts, soft everywhere else`],
    [['disciplined', 'methodical', 'cold_blooded', 'uptight', 'clinical', 'professional'], d => ['romance', 'heat'].includes(d.group),
        (n, u, name) => `even in ${name}, ${n} stays measured: feeling shows in precision and restraint, not in losing control`],
    [['volatile', 'hot_headed', 'impulsive', 'reckless', 'unpredictable'], () => true,
        (n, u, name) => `${n} can't hold ${name} steady for long: it flares and swings with ${n}'s temper`],
    [['loyal', 'principled', 'honest', 'lawful_good'], d => d.group === 'toxic',
        (n) => `${n}'s loyalty keeps ${n} in it while ${n}'s principles keep objecting`],
    [['cunning', 'puppet_master', 'persuasive', 'opportunistic', 'transactional'], d => ['romance', 'heat'].includes(d.group),
        (n) => `${n} can't stop angling, even in love: tenderness with one eye on the board`],
    [['independent', 'hyper_independent', 'lone_wolf'], (d, lead) => lead === 'u' || ['obsess', 'toxic'].includes(d.group),
        (n, u) => `${n} resents needing ${u}, and it shows in how ${n} pulls back after every close moment`],
    [['wallflower', 'cant_say_it'], d => ['romance', 'heat'].includes(d.group),
        (n) => `${n} shows it in what ${n} does, not what ${n} says: the words stay stuck`],
];
// Starred beliefs bend the dynamic too (1.78): they're passed in with the core traits.
CORE_BENDS.push(
    [['misogynist', 'chauvinist', 'judgemental_misogyny', 'anti_feminist'], d => ['romance', 'heat', 'power', 'society', 'roles'].includes(d.group),
        (n, u) => `wanting ${u} doesn't make ${n} see ${u} as an equal: the desire comes with condescension and rules about how ${u} ought to behave`],
    [['lawful_evil', 'neutral_evil', 'chaotic_evil', 'evil_with_code', 'fallen_good', 'homicidal_fixation'], d => ['romance', 'heat', 'allies', 'roles'].includes(d.group),
        (n, u) => `whatever ${n} feels for ${u}, ${n} is still capable of real cruelty, and the softness never makes ${n} safe`],
    [['respectability_obsessed', 'keeps_up_appearances'], d => ['heat', 'secret', 'toxic', 'romance'].includes(d.group),
        (n, u) => `how it looks from outside matters to ${n} as much as what happens: ${n} manages ${u} in front of others`],
    [['puritanical', 'devout', 'dark_faith'], d => d.group === 'heat',
        (n) => `${n} wants it and judges the wanting: desire comes out tangled with shame and blame`],
    [['ends_justify_means', 'social_darwinist', 'research_absolutism'], d => ['power', 'clinic', 'mind', 'captor', 'obsess'].includes(d.group),
        (n, u) => `${n} can justify anything done to ${u} if it serves the goal, and believes it`],
);
export function coreLink(core = [], dynamic, lead, n, u) {
    if (!dynamic || !core.length) return '';
    const hit = CORE_BENDS.find(([ids, test]) => ids.some(id => core.includes(id)) && test(dynamic, lead));
    return hit ? hit[2](n, u, dynamic.name.toLowerCase()) : '';
}

// A tie a long-running dynamic implies, offered once on the Bonds card. Never set on its own: you tap it or not,
// so the dynamic can't feed itself. d: the bond's meters and dynamic. his: his ties toward you now.
export const OFFER_AFTER = 12;
export function tieOffer(d, his = {}, offered = []) {
    if (!d?.dynamic) return null;
    const g = d.dynamic.group;
    const ideas = [
        d.l >= 35 && 'on_a_string', d.l <= -35 && 'wrapped',
        g === 'captor' && d.p >= 30 && 'keeps_them', g === 'obsess' && 'obsessed',
        g === 'power' && (d.p >= 35 ? 'dominates' : d.p <= -35 ? 'submits_to' : ''),
        g === 'romance' && d.r >= 50 && 'in_love', g === 'heat' && 'lusts_after', g === 'toxic' && 'cant_let_go',
        g === 'allies' && (FIGHTS.includes(d.dynamic.key) ? 'rival' : d.f >= 30 ? 'loyal_to' : ''), g === 'distance' && 'cold_shoulder',
    ].filter(Boolean);
    const id = ideas.find(x => !(his[x] > 0) && !offered.includes(x));
    return id ? { id, value: 50 } : null;
}

// Mood \u00d7 mood: where what the two of them feel right now doesn't match, one line saying it can rub, or not.
// Only feelings at clear or above, only the strongest mismatch, and only on some replies (moodClash setting),
// so it's a chance of friction rather than a fight every turn. Traits never clash here: opposites can attract.
// Bed roles are the one exception, because two who both lead (or both wait to be led) is a real snag.
// [what the first one feels, what the other feels, text(a, b, x, y)]; a feeling is a family name or an id list.
// notWanting: the other one feels no desire at all, so the line is about being in different moods.
// inHeat: only while one of them feels desire, so bed roles that stay switched on don't snag every scene.
// The last field is the kind of dynamic the clash leans the Bonds reading toward (bond.js dynamicLean).
const CAT = new Map(MOODS.map(m => [m.id, m.category]));
const LEAD = ['commanding', 'taking_charge', 'demanding', 'in_control', 'dominant_hunger', 'power_drunk', 'territorial', 'assertive'];
const BED_LEAD = ['pleasure_dom', 'courtly_dom', 'dominant', 'top', 'master', 'mistress', 'daddy', 'mommy', 'gentle_dominant', 'owner', 'brat_tamer', 'ravishing', 'disciplinarian', 'princess_dominance', 'rigger', 'service_top'];
const BED_LED = ['soft_sub', 'submissive', 'bottom', 'obedient', 'service_submissive', 'little_girl', 'pillow_princess', 'owned', 'doll', 'ravished', 'rope_bunny', 'wants_to_be_taken', 'submissive_longing', 'wants_to_be_pursued'];
const WORN = ['tired', 'sleepy', 'exhausted_to_the_bone', 'sluggish', 'run_down', 'dragging', 'sleep_deprived', 'grief_tired', 'adrenaline_crash', 'sleepy_contentment', 'apathetic'];
const WIRED = ['hyper', 'wired', 'restless', 'bouncy', 'revved_up', 'buzzing_awake', 'feral_energy', 'frantic', 'energised', 'second_wind'];
const SOCIAL = ['chatty', 'party_mode', 'playful', 'bubbly', 'giddy', 'goofy', 'excited', 'celebratory'];
const QUIET = ['socially_drained', 'withdrawn', 'closed_off', 'clammed_up', 'wants_comfort', 'shut_down', 'numbed_out'];
const STIRRED = ['jealous', 'possessive', 'jealous_lust', 'protective_jealousy', 'jealous_fury', 'afraid_to_be_replaced'];
const LOOSE = ['flirty', 'swaggering_flirt', 'showing_off', 'seductive', 'provocative', 'teasing_them'];
// Mind settings that pull against each other.
const CLINGS = ['anxious_attachment', 'abandonment_issues', 'abandonment_dread', 'borderline', 'dependent_personality'];
const PULLS_AWAY = ['avoidant_attachment', 'avoidant_personality', 'fearful_avoidant', 'schizoid', 'moves_away'];
const NEEDS_MIRROR = ['narcissistic', 'grandiose_narcissist', 'covert_narcissist', 'vulnerable_narcissist', 'malignant_narcissism', 'mirror_hunger', 'god_complexed', 'histrionic'];
const GIVES_SELF = ['moves_toward', 'dependent_personality', 'fawns', 'codependent', 'martyr_complex', 'false_self'];
const RESCUER = ['saviour_complex', 'messiah_complex', 'florence_nightingale_effect'];
const WOUNDED = ['traumatised', 'ptsd', 'complex_ptsd', 'depressed', 'self_defeating', 'learned_helplessness', 'melancholia'];
const SUSPICIOUS = ['paranoid_personality', 'persecution_complex', 'hypervigilant', 'persecutory_delusion'];
const ORDERLY = ['obsessive_personality', 'anal_retentive', 'superego_ridden', 'ocd'];
const IMPULSIVE = ['id_driven', 'adhd', 'puer_aeternus', 'peter_pan_complex', 'bipolar'];
const CLASHES = [
    [LEAD, LEAD, (a, b, x, y) => `both want the lead (${a} ${x}, ${b} ${y}): they may butt heads, or one may give way for a price`, true, false, false, 'power'],
    [BED_LEAD, BED_LEAD, (a, b, x, y) => `both lean to leading in bed (${a} ${x}, ${b} ${y}): neither waits to be led, so it can turn into a contest, or a game of who gives first`, true, false, true, 'power'],
    [BED_LED, BED_LED, (a, b, x, y) => `both lean to being led (${a} ${x}, ${b} ${y}): each may wait on the other to take charge, or one may have to step up`, true, false, true, 'power'],
    [['angry'], ['angry'], (a, b, x, y) => `both are angry (${a} ${x}, ${b} ${y}): it can flare into a real fight or burn out fast`, true, false, false, 'toxic'],
    [STIRRED, LOOSE, (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${b}'s mood may feed ${a}'s, whether ${b} means it to or not`, false, false, false, 'obsess'],
    [['desire'], ['closeness', 'love'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y} without the heat: ${a} may want more than ${b} is in the mood for, or the tenderness may bring ${b} round`, false, true, false, 'heat'],
    [['desire'], WORN, (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${b} may be too worn out for it, or be talked round`, false, true, false, 'heat'],
    [['desire'], ['sad', 'scared', 'angry', 'cold'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${b} may not be in the mood, and how ${a} takes that matters`, false, true, false, 'heat'],
    [['closeness', 'attachment', 'love'], ['cold'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: one reaching, one pulling back; it can sting, or make ${a} try harder`, false, false, false, 'distance'],
    [['happy'], ['sad'], (a, b, x, y) => `${a} is ${x} while ${b} is ${y}: ${a}'s good mood may jar on ${b}, or lift ${b} a little`, false, false, false, 'allies'],
    [['happy'], ['angry'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${a}'s lightness may needle ${b}, or take the edge off`, false, false, false, 'toxic'],
    [['happy'], ['cold'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${a} may reach out and meet a wall, or thaw ${b} a little`, false, false, false, 'distance'],
    [['calm'], ['angry'], (a, b, x, y) => `${a} is ${x} while ${b} is ${y}: the calm may steady ${b}, or make ${b} angrier`, false, false, false, 'toxic'],
    [['angry'], ['sad'], (a, b, x, y) => `${a} is ${x} while ${b} is ${y}: ${a}'s temper may land hard on ${b}, or soften on seeing it`, false, false, false, 'toxic'],
    [['angry'], ['closeness', 'love'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${b}'s softness may get snapped at, or slowly disarm ${a}`, false, false, false, 'romance'],
    [['cruel'], ['closeness', 'love'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${b}'s warmth may meet ${a}'s edge, or catch ${a} off guard`, false, false, false, 'toxic'],
    [['scared'], ['happy', 'bold'], (a, b, x, y) => `${a} is ${x} while ${b} is ${y}: ${b} may miss it entirely, or see it and steady ${a}`, false, false, false, 'captor'],
    [WIRED, WORN, (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: they're at different speeds, and ${a} may wear ${b} out or get ${b} moving`, false, false, false, 'allies'],
    [SOCIAL, QUIET, (a, b, x, y) => `${a} is ${x} and ${b} wants quiet (${y}): ${a} may grate, or coax ${b} out`, false, false, false, 'distance'],
    // Mind settings (Mind tab), set at clear or above, against each other or against a mood.
    [CLINGS, PULLS_AWAY, (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: the more one reaches, the more the other backs off, and each move feeds the other's`, false, false, false, 'toxic'],
    [CLINGS, ['cold'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${b}'s coolness may read to ${a} as being left`, false, false, false, 'toxic'],
    [NEEDS_MIRROR, GIVES_SELF, (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${b} may feed what ${a} needs and lose a little of themselves each time`, false, false, false, 'mind'],
    [RESCUER, WOUNDED, (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${a} may want to fix ${b}, and ${b} may not want to be anyone's project`, false, false, false, 'romance'],
    [SUSPICIOUS, ['masks', 'secretive', 'lying', 'compartmentalising', 'false_self'], (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: ${a} may smell what ${b} is hiding, or invent worse`, false, false, false, 'secret'],
    [ORDERLY, IMPULSIVE, (a, b, x, y) => `${a} is ${x} and ${b} is ${y}: order meets impulse; it can grate, or loosen ${a} up`, false, false, false, 'allies'],
];
// For tests/pronouns.mjs, which renders every line.
export const LINK_LINES = { ROLE_LINKS, TIE_LINKS, CORE_BENDS };
export const CLASH_CHOICES = ['off', 'sometimes', 'often'];
const fits = (id, side) => side.includes(id) || side.includes(CAT.get(id));
// The strongest mismatch at clear or above, whether or not this reply speaks about it: { line, group } or null.
// moods: { n, u } each person's moods; names: { n, u }; word(id): the plain name of a feeling.
export function clashOf(moods, names, word) {
    const strong = { n: Object.entries(moods.n ?? {}).filter(([, v]) => v >= 41), u: Object.entries(moods.u ?? {}).filter(([, v]) => v >= 41) };
    if (!strong.n.length || !strong.u.length) return null;
    const desire = { n: strong.n.some(([id]) => CAT.get(id) === 'desire'), u: strong.u.some(([id]) => CAT.get(id) === 'desire') };
    const on = k => strong[k], wants = k => desire[k];
    let best = null;
    for (const [sa, sb, text, same, notWanting, inHeat, group] of CLASHES) for (const [a, b] of same ? [['n', 'u']] : [['n', 'u'], ['u', 'n']]) {
        if ((notWanting && wants(b)) || (inHeat && !wants('n') && !wants('u'))) continue;
        for (const [x, vx] of on(a)) if (fits(x, sa)) for (const [y, vy] of on(b)) if (fits(y, sb)) {
            const score = Math.min(vx, vy);
            if (!best || score > best.score) best = { score, group, line: text(names[a], names[b], word(x), word(y)) };
        }
    }
    return best;
}
// The line for this reply, or '': how is 'off' | 'sometimes' (about one reply in three) | 'often' (about two
// in three); seed is the reply number.
export function moodClash(moods, names, word, how = 'sometimes', seed = 0) {
    if (how === 'off') return '';
    const roll = (Math.imul((Number(seed) || 0) + 7, 0x9E3779B9) >>> 0) % 3;
    if (how === 'sometimes' ? roll !== 0 : roll === 2) return '';
    const best = clashOf(moods, names, word);
    return best ? `${best.line}. It may or may not come up; let the scene decide` : '';
}
