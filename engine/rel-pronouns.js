// One-sided relationship lines with pronouns that know whose they are. "{other}'s doctor, in charge of
// their treatment" left Claude guessing whose treatment, and taught it to call everyone "they". Here {o.*} is the
// other person and {s.*} is the one the line is about; {o.they:give|gives} picks the verb to match. Someone set to
// They / names keeps the old wording. Both-ways lines aren't here: their "their" really does mean both.
export const REL_PRONOUN_PROMPTS = {
    sees_as_muse: 'sees {other} as {s.their} muse',
    guardian_of: 'responsible for {other} as {o.their} guardian',
    ward_of: '{other}’s ward, under {o.their} care and authority',
    doctor_of: '{other}’s doctor, in charge of {o.their} treatment',
    creator_of: 'made or remade {other} and feels that gives {s.them} a claim',
    buys_from: 'buys drugs from {other} and needs {o.them} for it',
    idol_to: 'is famous to {other}, who adores {s.them} as a fan',
    fan_of: 'is a fan of {other}, adoring {o.them} from a distance',
    fascinated: 'fascinated by {other} and wants to figure {o.them} out',
    thinks_out_of_league: 'thinks {other} is out of {s.their} league',
    devoted: 'devoted to {other}; makes {o.them} a priority and follows through',
    never_pressures: 'never pressures {other} into anything, least of all {s.their} own habits',
    cheers_up: 'knows how to cheer {other} up and drag {o.them} out of boredom',
    owes_life: 'owes {other} {s.their} life',
    cant_look_away: 'can’t keep {s.their} eyes off {other}',
    drawn_despite: 'drawn to {other} despite {s.themselves}',
    theyre_mine: 'sees {other} as {s.theirs}, full stop',
    idolises: 'idolises {other} and can’t see {o.their} flaws',
    cant_let_go: 'can’t let go of {other}, try as {s.they} might',
    preserves: 'wants to preserve {other} exactly as {o.they:are|is}',
    wants_to_capture: 'wants to capture {other} in {s.their} art',
    wants_to_mould: 'wants to mould {other} into who {s.they:think|thinks} {o.they:should|should} be',
    depends: 'depends on {other} and can’t picture managing without {o.them}',
    wrapped: 'wrapped around {other}’s finger; bends to {o.their} wishes',
    submits_to: 'submits to {other} and wants to be under {o.their} control',
    controls: 'wants a say in {other}’s choices and steers {o.them}',
    manipulates: 'manipulates {other} to get {s.their} way',
    worst_in_them: '{other} brings out {s.their} worst',
    wants_to_break: 'wants to break {other} down until {o.they:give|gives} in',
    watches_over: 'watches over {other} constantly, even while {o.they:sleep|sleeps}, and calls it care',
    covers_for: 'covers for {other}, hiding and cleaning up after what {o.they:do|does}',
    studies: 'studies {other} like a subject, testing and recording {o.them}',
    cant_hurt: 'can’t bring {s.themselves} to hurt {other}, and it confuses {s.them}',
    walks_on_eggshells: 'walks on eggshells around {other}, careful not to set {o.them} off',
    indulges: 'indulges {other}: gives in to {o.their} demands, whims and sulks, even unreasonable ones',
    lets_them_win: 'lets {other} win the small fights: enjoys being pushed and demanded of while the real control stays in {s.their} own hands',
    at_their_mercy: 'at {other}’s mercy emotionally: {o.their} moods decide the day, and one cold look undoes {s.them}',
    keeps_them: 'keeps {other} where {o.they} can’t leave and calls it care',
    tests_them: 'keeps testing {other}: small traps and tests to see what {o.they} will do',
    on_a_string: 'has {other} on a string: knows which look, pout or touch makes {o.them} give in, and uses it',
    plays_helpless: 'plays helpless with {other}: tears, a small voice or helplessness when it gets {o.them} running',
    wants_ruined_by: 'wants {other} to wreck {s.them}, body and life, and knows it’s bad',
    stalks: 'stalks {other}: follows and watches unseen, learning {o.their} routines',
    wants_to_become: 'wants to become {other}: {o.their} life, {o.their} looks, {o.their} place',
    hides_life_from: 'hides how {s.they:really live|really lives} from {other}',
    already_mourning: 'is already mourning {other} while {o.they:are|is} still here',
    blames_self_for: 'blames {s.themselves} for what happened to {other}',
    cant_forgive: 'can’t forgive {other}, however much {s.they:want|wants} to',
    shows_control: 'shows care for {other} as rules, monitoring and decisions made for {o.them}',
    pushes_away: 'pushes {other} away on purpose, cold or cruel, because closeness feels dangerous for {s.them}',
    says_it_plainly: 'tells {other} plainly how {s.they:feel|feels}, often and without embarrassment',
};
// Strength-dependent lines with the same marks.
export const REL_PRONOUN_SCALED = {
    wants_kill: [[100, 'killing {other} is a driving goal; {s.their} choices and actions work toward it'], [81, 'intends to kill {other} and looks for the chance'],
        [41, 'wants {other} dead, and it weighs on {s.their} choices'], [11, 'sometimes wishes {other} were dead'], [1, 'has a fleeting wish that {other} were dead']],
};
const SETS = {
    he: { they: 'he', them: 'him', their: 'his', theirs: 'his', themselves: 'himself' },
    she: { they: 'she', them: 'her', their: 'her', theirs: 'hers', themselves: 'herself' },
    they: { they: 'they', them: 'them', their: 'their', theirs: 'theirs', themselves: 'themselves' },
};
// s, o: 'he' | 'she' | 'they' for the subject and the other person.
export function fillPronouns(text, s = 'they', o = 'they') {
    const who = { s: SETS[s] ? s : 'they', o: SETS[o] ? o : 'they' };
    return String(text)
        // "{o.they:give|gives}" is the pronoun with its verb: "she gives", "they give".
        .replace(/\{([so])\.they:([^|}]+)\|([^}]+)\}/g, (m, k, plural, single) => `${SETS[who[k]].they} ${who[k] === 'they' ? plural : single}`)
        .replace(/\{([so])\.(they|them|their|theirs|themselves)\}/g, (m, k, form) => SETS[who[k]][form]);
}
