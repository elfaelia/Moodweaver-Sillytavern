// Period lines for 1950s–60s America: picks which lines from data/catalogue/period.js go with this reply. A line
// is about one person and only goes when something on the cards wakes it, the person's Period tab allows it, and
// it is written for their gender (he, she, or any). Opus 5.5 gets them as short plain sentences under one heading
// that says they are the world around the two of them, not who they are. Pure functions; app/note.js works out
// who leads, whether the scene is sexual and what is in play, and engine/prompt.js places the lines.

import { MOODS } from '../data/catalogue.js';
import { PERIOD } from '../data/catalogue/period.js';
const MOOD_CAT = new Map(MOODS.map(m => [m.id, m.category]));

export const ERA_LINE_CHOICES = [1, 2, 3, 4, 5, 6, 8, 10];
// The lines are written for America in the fifties and sixties; any other period gets only its own era sentence.
export const periodEra = id => /^era_19[56]0s/.test(id ?? '') && !/britain|scotland/.test(id);
// Soft or feminine ways on a man, and mannish ways on a woman (the "Not like the others" line).
const FEMININE = ['feminine', 'girlish', 'prissy'], MASCULINE = ['masculine', 'swagger'];
const at = (moods, ids, min = 41) => Math.max(0, ...ids.map(id => moods?.[id] ?? 0).filter(v => v >= min));

// When a line can go, for person k with the other person o. c is the context below.
const WHEN = {
    lead: (c, k, o) => c.top === k,
    under: (c, k, o) => c.top === o,
    mixed: c => new Set([c.g.n, c.g.u]).size === 2 && [c.g.n, c.g.u].every(x => x === 'he' || x === 'she'),
    notMixed: c => !WHEN.mixed(c),
    sameSex: c => c.g.n === c.g.u && ['he', 'she'].includes(c.g.n),
    romance: c => Boolean(c.romance),
    heat: c => Boolean(c.heat),
    wed: (c, k) => Boolean(c.wed) || (c.moods[k]?.married_status ?? 0) >= 41,
    unwed: (c, k) => !WHEN.wed(c, k),
    bedLead: (c, k) => Boolean(c.heat) && c.bedTop === k,
    bedYield: (c, k, o) => Boolean(c.heat) && c.bedTop === o,
    // Wanting to give way (or to rule) in bed: only while they aren't the one leading (or being led) right now,
    // so a man with a submissive streak who is on top in this scene doesn't get a line about kneeling.
    // In a sexual scene they only go while that person is actually being led (or leading).
    subWish: (c, k, o) => Boolean(c.sub[k]) && (c.heat ? c.bedTop === o : c.top !== k),
    domWish: (c, k, o) => Boolean(c.dom[k]) && (c.heat ? c.bedTop === k : c.top !== o),
    medicine: c => Boolean(c.medicine),
    young: (c, k) => c.ages[k] > 0 && c.ages[k] <= 20,
    single: (c, k) => c.ages[k] >= (c.g[k] === 'she' ? 25 : 30) && !WHEN.wed(c, k),
    midlife: (c, k) => c.ages[k] >= 45,
    older: (c, k, o) => c.ages[k] > 0 && c.ages[o] > 0 && c.ages[k] - c.ages[o] >= 8,
    younger: (c, k, o) => c.ages[k] > 0 && c.ages[o] > 0 && c.ages[o] - c.ages[k] >= 8,
    heightOdd: (c, k) => (c.g[k] === 'he' && c.heights[k] > 0 && c.heights[k] <= 168) || (c.g[k] === 'she' && c.heights[k] >= 175),
    againstType: (c, k) => (c.g[k] === 'he' && at(c.moods[k], FEMININE) > 0) || (c.g[k] === 'she' && at(c.moods[k], MASCULINE) > 0),
};
// How strongly a line's own triggers fire for this person (0: not at all).
function wake(line, c, k) {
    const moods = c.moods[k] ?? {}, prefs = c.prefs[k] ?? {};
    const hits = [];
    if (line.ids) hits.push(at(moods, line.ids));
    if (line.cats) hits.push(Math.max(0, ...Object.entries(moods).filter(([id, v]) => v >= 41 && line.cats.includes(MOOD_CAT.get(id))).map(([, v]) => v)));
    if (line.turns) hits.push(Math.max(0, ...line.turns.map(id => prefs[id] ?? 0).filter(v => v > 40)));
    if (line.ties && line.ties.some(id => (c.ties[k]?.[id] ?? 0) >= 41)) hits.push(70);
    if (line.need && (c.needs[k] ?? []).includes(line.need)) hits.push(60);
    if (line.scene && line.scene.some(key => c.scene[key])) hits.push(line.w ?? 60);
    return Math.max(0, ...hits);
}
const hasTriggers = line => ['ids', 'cats', 'turns', 'ties', 'need', 'scene'].some(key => line[key]);
// A small seeded shuffle, so the same reply always gets the same lines (a swipe or re-read shows the same ones)
// while the next reply can bring different ones.
function seededOrder(list, seed) {
    let x = Math.imul((Number(seed) || 0) + 1, 0x9E3779B9) >>> 0;
    const next = () => { x = (x + 0x6D2B79F5) >>> 0; let t = Math.imul(x ^ (x >>> 15), x | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
}
// The text of a line for someone: their gender's own version, or the one for anyone. '' when there is none.
export const periodText = (line, gender) => (gender === 'he' || gender === 'she' ? line[gender] : '') || line.any || '';
const fill = (text, map) => text.replace(/\{(\w+)\}/g, (m, key) => map[key] ?? m);

// c: { era, n, u (names), g: { n, u } ('he' | 'she' | 'they'), top / bedTop ('n' | 'u' | ''), heat, romance, wed,
//   medicine, sub / dom: { n, u } (has a submissive or dominant streak), scene: { key: true }, moods / prefs / ties /
//   needs / ages / heights: { n, u }, off: { n, u } (Sets of line ids switched off on their Period tab), cap, seed }.
// Returns every line that applies right now, most important first, with the ones sent this reply marked.
export function periodLines(c) {
    if (!periodEra(c.era)) return [];
    const found = new Map();
    for (const k of ['n', 'u']) {
        const o = k === 'n' ? 'u' : 'n', gender = c.g[k];
        for (const line of PERIOD) {
            const text = periodText(line, gender);
            if (!text || c.off?.[k]?.has(line.id)) continue;
            if (line.other && c.g[o] !== line.other) continue;
            if ((line.when ?? []).some(w => !WHEN[w]?.(c, k, o))) continue;
            const score = hasTriggers(line) ? wake(line, c, k) : (line.w ?? 60);
            if (!score) continue;
            const item = { id: line.id, who: k, label: line.label, group: line.group ?? '', score: score + (k === 'n' ? 5 : 0),
                text: fill(text, { who: c[k], other: c[o], age: c.ages[k] || '' }) };
            // The same line for both of them: keep the one it fits better.
            if (!found.has(line.id) || found.get(line.id).score < item.score) found.set(line.id, item);
        }
    }
    const all = [...found.values()];
    const cap = ERA_LINE_CHOICES.includes(Number(c.cap)) ? Number(c.cap) : 3;
    // The strongest line always goes first (power, when someone holds it, is weighted to lead); the rest take
    // turns in bands of 20, shuffled by the reply number, so a long story keeps meeting new sides. One line per group.
    const band = x => Math.floor(x.score / 20);
    const lead = [...all].sort((a, b) => b.score - a.score)[0];
    const order = lead ? [lead, ...seededOrder(all.filter(x => x !== lead), c.seed).sort((a, b) => band(b) - band(a))] : [];
    const groups = new Set();
    let sent = 0;
    return order.map(x => {
        const ok = sent < cap && !(x.group && groups.has(x.group));
        if (ok) { sent++; if (x.group) groups.add(x.group); }
        return { ...x, sent: ok };
    });
}

// Tie, trait and turn-on ids app/note.js reads to work out who leads, whether doctors are involved, whether it is
// a romance, and whether someone has a submissive or dominant streak.
export const POWER_ROLES = ['has_power_over', 'boss_of', 'captor_of', 'doctor_of', 'guardian_of', 'employs_in_house', 'parent_of', 'teacher_of', 'mentor', 'leads', 'creator_of', 'deals_to'];
export const UNDER_ROLES = ['under_power', 'works_for', 'captive_of', 'patient_of', 'ward_of', 'in_service_to', 'child_of', 'student_of', 'follows', 'creation_of', 'buys_from'];
export const POWER_PAIRS = ['married', 'engaged', 'arranged_marriage', 'marriage_of_convenience', 'power_imbalance', 'age_gap', 'captor_captive', 'gilded_cage', 'spoiled_captive', 'bought_and_paid', 'sugar', 'office_romance', 'held_by_threat'];
export const MEDICINE_ROLES = ['doctor_of', 'patient_of'];
export const MEDICINE_PAIRS = ['scientist_and_subject'];
export const ROMANCE_PAIRS = ['dating', 'engaged', 'married', 'lovers', 'long_term_partners', 'affair', 'secret_relationship', 'friends_with_benefits', 'situationship', 'courting_pair', 'forbidden_love', 'slow_burn', 'mutual_pining', 'obsessive_love', 'love_hate'];
export const SUB_TRAITS = ['soft_sub', 'slave_role', 'living_statue_role', 'human_furniture_role', 'task_focused_sub', 'submissive', 'bottom', 'service_submissive', 'obedient', 'owned', 'doll', 'pet_kitten', 'pet_puppy', 'pet_doe', 'pet_pig', 'pet_cow', 'pet_pony', 'ravished', 'role_reversal_sub', 'rope_bunny'];
export const SUB_TURNS = ['being_humiliated', 'being_dressed', 'masochist', 'crossdressing_play', 'degradation_in_bed', 'spanking_receiving', 'caning_receiving', 'whipping_receiving', 'being_made_dumb', 'being_dehumanised'];
export const DOM_TRAITS = ['pleasure_dom', 'courtly_dom', 'disciplinarian', 'princess_dominance', 'dominant', 'top', 'mistress', 'mommy', 'gentle_dominant', 'owner', 'brat_tamer', 'doll_keeper', 'ravishing', 'role_reversal_dom', 'rigger'];
export const DOM_TURNS = ['sadist', 'humiliating_others', 'degrading', 'spanking_giving', 'caning_giving', 'whipping_giving', 'dumbification', 'dehumanising_others'];
// What else is in play for both of them: something carried (items), a skill at 5 or more, a turn-on above 40, a
// mood, place or fact at clear or above, a tie between them, or something on the Story tab.
export const SCENE = {
    other_one: { story: ['trope_other_one'], turns: ['being_the_other_woman'] },
    found_out: { story: ['trope_found_out'] },
    medicine: { items: 'syringe pills stethoscope scalpel morphine', skills: ['medicine', 'surgery', 'psychiatry'], turns: ['doctors', 'hospital_gowns', 'gurneys', 'straitjackets', 'clinical_voice', 'medplay_giving', 'medplay_receiving'],
        moods: ['sedated', 'hospital_ward', 'hysterical', 'after_shock_treatment', 'on_thorazine', 'truth_serum', 'experimental_drug', 'needle_marks', 'asylum_ward', 'operating_theatre', 'hydrotherapy_room', 'morgue', 'committed', 'enrolled_in_trial', 'nurse', 'hysteria', 'nervous_breakdown', 'neurasthenia', 'sexual_psychopath', 'dementia_praecox', 'frigidity', 'psychiatric_nurse', 'orderly', 'lab_technician', 'lab_coat', 'cold_surgeon'], story: ['asylum_horror'] },
    secrets: { items: 'letter letters photograph photo key keys recorder diary', skills: ['wiretapping', 'stalking', 'blackmail', 'disguise'], turns: ['almost_caught', 'risky_places', 'being_followed', 'polaroids', 'tape_recordings', 'filming_someone', 'being_filmed', 'love_letters'],
        moods: ['fear_of_being_found_out', 'hiding_evidence', 'false_persona', 'keeping_tabs', 'hiding_it_from_family', 'covering_for_them', 'closeted', 'informant', 'kept', 'records_room', 'reputation_at_stake'], ties: ['stalks', 'secret_relationship'] },
    affair: { items: 'ring lipstick', turns: ['taken_people', 'being_the_other_woman', 'being_cheated_on', 'cuckolding', 'wedding_rings'],
        moods: ['forbidden_want', 'jilted', 'betrayed', 'lipstick_smeared'], ties: ['affair', 'secret_relationship'], story: ['trope_affair', 'trope_cheating', 'trope_other_one', 'trope_found_out'] },
    faith: { items: 'rosary bible cross crucifix', turns: ['piety', 'hierophilia', 'sinfulness', 'clergy', 'penance'], moods: ['guilt_sick', 'forsaken', 'righteous', 'guilty_lust'] },
    babies: { turns: ['breeding_giving', 'breeding_receiving', 'pregnant_bellies', 'lactation'] },
    dress: { skills: ['fashion_sense', 'hairdressing', 'sewing'], turns: ['set_hair_pearls', 'stocking_fetish', 'glove_fetish', 'corsetry_fetish', 'lipstick', 'sharp_suits', 'undone_ties', 'waistcoats_braces', 'greased_hair', 'slow_undressing', 'lingerie'], moods: ['well_dressed', 'vain'] },
    pictures: { items: 'camera polaroid film', skills: ['photography'], turns: ['polaroids', 'filming_someone', 'being_filmed', 'exhibitionist', 'voyeur', 'burlesque_attraction', 'posing_someone'] },
    war: { items: 'tags medal', turns: ['scars', 'uniformed_people', 'dog_tags'], moods: ['traumatised', 'scarred'] },
    appearances: { turns: ['social_climbing', 'meticulous_presentation', 'rule_followers', 'preppy_types', 'rich_people'], moods: ['keeps_up_appearances', 'respectability_obsessed', 'gossipy', 'hiding_it_from_family'], ties: ['neighbours'] },
    suspicion: { skills: ['wiretapping'], turns: ['being_followed', 'detectives'], moods: ['paranoid', 'suspicious', 'false_persona', 'keeping_tabs', 'paranoid_personality', 'persecution_complex', 'persecutory_delusion'], ties: ['suspicious_of'], story: ['cold_war_horror'] },
    guns: { items: 'gun revolver pistol rifle shotgun bullets', skills: ['marksmanship'], turns: ['gun_play', 'hoplophilia', 'gun_oil_smell'] },
    road: { items: 'keys car', skills: ['driving'], turns: ['backseat', 'bikers', 'strangers', 'being_kidnapped'], moods: ['in_a_car'] },
    youth: { skills: ['guitar', 'bass', 'drums', 'dancing'], turns: ['greasers', 'beatniks', 'cheerleaders_jocks', 'rock_stars', 'bad_boy_girl', 'rebelliousness'], moods: ['rebellious'] },
    experiments: { skills: ['hypnosis', 'psychiatry', 'chemistry'], turns: ['being_experimented_on', 'hypnotising', 'being_hypnotised', 'conditioning_kink', 'scientists'], moods: ['test_subject', 'experimenter_role', 'lab_subject'], ties: ['scientist_and_subject'], story: ['unethical_experiments', 'experiment', 'subject_and_scientist'] },
    bars: { moods: ['bar_club', 'party_scene_regular', 'club_bathroom'], skills: ['bartending'] },
    rooms: { moods: ['hotel_room', 'cheap_motel'] },
    diner: { moods: ['late_night_diner'] },
    office: { moods: ['at_work', 'corporate_office', 'corporate_suit', 'devoted_secretary'], ties: ['coworkers', 'office_romance'] },
    mourning: { moods: ['funeral', 'graveside', 'emptied_home', 'grieving', 'bereaved'] },
    nowhere: { moods: ['isolated', 'snowed_in', 'abandoned'] },
    dining: { moods: ['fancy_restaurant'] },
    public: { moods: ['public'] },
    police: { moods: ['interrogation_room', 'suspected', 'wanted', 'corrupt_cop'], ties: ['shared_alibi'] },
    night: { moods: ['late_night', 'rooftop_night', 'night_owl'] },
    beach: { moods: ['beach'] },
};
