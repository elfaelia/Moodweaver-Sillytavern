// 1.49.0: lines that join sections that used to sit side by side without touching. Each one only shows when
// both halves are on, and they sit under the dynamic in the Bonds lines. Written with names; index.js runs them
// through the pronoun pass so they read "his" and "her".
//
// Role × dynamic: a role sets the frame (doctor, captor, boss), the dynamic says what's happening inside it.
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

// Mood × dynamic: how the strongest feeling shows inside the current dynamic, so neither one gets dropped.
// What the dynamic keeps doing, by group, and how each family of feelings bends it.
const HOLD = {
    captor: 'the routines and the locks stay', obsess: 'the fixation stays', power: 'who’s in charge doesn’t change', romance: 'the love underneath holds',
    heat: 'the pull between them stays', toxic: 'the cycle keeps turning', allies: 'they still have each other’s backs', roles: 'the roles still hold',
    distance: 'the gap between them stays', own: 'their dynamic holds',
};
const BEND = {
    angry: 'done with rougher hands, shorter words and quicker punishment', cruel: 'with a deliberate edge, testing how much it can hurt',
    sad: 'heavier and quieter, with cracks showing', scared: 'jumpy and defensive, ready to pull back or lash out', desire: 'charged, with touches that linger and everything leaning toward sex',
    happy: 'lighter and more playful than usual', closeness: 'softer, letting more tenderness through than usual', attachment: 'clingier and more possessive, unwilling to let go',
    cold: 'colder and more distant, done without warmth', calm: 'slower and more deliberate, perfectly controlled', bold: 'cockier and more forceful, pushing further',
    masks: 'behind a mask, so what shows isn’t what’s underneath', energy: 'at a different pace than usual, restless or drained', headspace: 'distracted and half lost in thought',
};
// Pairs that already say the same thing, so a line would only repeat the dynamic.
const SAME = new Set(['desire:heat', 'closeness:romance', 'attachment:obsess', 'cold:distance', 'cruel:toxic']);
// mood: { label, family (its Moods-tab category), value }. dynamic: { name, group }.
export function moodLink(mood, dynamic, n) {
    if (!mood || !dynamic || mood.value < 55 || !BEND[mood.family] || SAME.has(`${mood.family}:${dynamic.group}`)) return '';
    const word = mood.label.split('/')[0].trim().toLowerCase();
    return `${n} is ${word} inside ${dynamic.name.toLowerCase()}: ${HOLD[dynamic.group] ?? HOLD.own}, but ${BEND[mood.family]}`;
}
export const LINK_FAMILIES = Object.keys(BEND);
