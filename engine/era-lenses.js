// The period, said plainly, and what it does to the things that are switched on. Opus 5.5 does better with
// one clear instruction ("Set in 1960s America") and a short line than with a long list of period props. A
// lens is one line about how the period shapes something already in play (power, medicine, queer desire,
// secret kinks, sex and reputation, money and work), and only shows when that thing is on. Gender comes from
// the Pronouns picker on the Bonds tab: he is a man, she is a woman. Pure data and functions; index.js decides
// what's on and core.js places the lines.

// Era → period group, for the lenses.
function eraGroup(id = '') {
    const y = Number(String(id).match(/era_(\d{4})s/)?.[1]);
    return !y ? '' : y < 1950 ? '' : y < 1970 ? 'midcentury' : y < 1980 ? 'seventies' : y < 1990 ? 'eighties' : y < 2010 ? 'nineties' : 'modern';
}

// Each lens: text by period group. Power has three shapes: a man over a woman (mw), a woman over a man (wm),
// and anything else (any). {top} holds the power, {low} is under it; {n} and {u} are the character and player.
const POWER = {
    midcentury: { mw: ['{top}’s power over {low} is backed by everyone: a man’s word outranks hers with police, doctors and family, and she needs a man to sign for credit or a lease', ', and a woman who fusses gets called hysterical and can be sedated or committed'],
        wm: 'a woman over a man is a scandal people explain away: they say she’s unnatural or he’s weak, and the moment he pushes back the world takes his side',
        any: 'power runs on rank, money and respectability: the boss, the doctor and the family name are obeyed, and questioning them marks you as trouble' },
    seventies: { mw: 'women’s liberation is loud but the old rules still hold: a husband’s say, a boss’s hands, police who call it a domestic and leave',
        wm: 'a woman in charge of a man is new and resented; people call her a ball-breaker and wait for her to fail',
        any: 'power runs on money, connections and who knows the police or the union' },
    eighties: { mw: ['men run the money and the boardroom and harassment is a joke', ', and a woman who complains is difficult'],
        wm: 'a powerful woman in a power suit is resented by men who wait for her to slip',
        any: 'power is money and status: who owns, who’s rising, who can make one call' },
    nineties: { any: 'equality on paper; in practice money, contacts and reputation decide who gets believed' },
    modern: { any: 'the law takes the weaker side on paper; real power runs through money, isolation, phones, passwords and who people believe online' },
};
const LENSES = {
    medicine: { label: 'Medicine',
        midcentury: 'a doctor’s word is law: patients aren’t told, a husband or father signs consent, and ECT, sedation, restraints and lobotomy are routine, with a state hospital the threat behind every visit',
        seventies: 'doctors are gods in white coats: Valium for unhappy wives, institutions closing and patients dumped, consent mostly a form',
        eighties: 'doctors still talk over patients; a frightened or difficult one gets a prescription, and AIDS fear makes some of them cruel',
        nineties: 'patients have rights and records now; a doctor’s power is the chart, the prescription pad and being believed',
        modern: 'patients have rights and records; a doctor’s power is the chart, the prescription pad and being believed' },
    queer: { label: 'Queer desire',
        midcentury: 'being queer is an illness, a sin and a crime: bar raids, firings, blackmail and aversion therapy, so it lives in coded looks, false names and back rooms',
        seventies: 'queer people are coming out after Stonewall but most still pass; families disown, bosses fire and police raid',
        eighties: 'AIDS and fear: being out costs jobs and family, so desire hides behind jokes and sudden coldness',
        nineties: 'out in some places and a slur in others; most still choose carefully who knows',
        modern: 'mostly open, though family, faith or reputation can still make it a secret' },
    manSub: { label: 'Secret desires',
        midcentury: '{who} wanting to kneel, be dressed up or be hurt is a shameful secret that could ruin or commit a man of his standing, so most men keep it behind locked doors and in denial',
        seventies: '{who} wanting to submit is a private shame and a joke if found out; it happens in secret clubs and paid rooms',
        eighties: '{who} wanting to submit is a private shame and a joke if found out; it happens in secret clubs and paid rooms',
        nineties: '{who} wanting to submit is something he would tell almost nobody, and it could still shame him if it got out',
        modern: '{who} wanting to submit is something he would tell almost nobody, and it could still shame him if it got out' },
    womanDom: { label: 'Secret desires',
        midcentury: '{who} wanting to dominate or hurt is unnatural to everyone else, the mark of a madwoman or a whore, so she hides it or keeps it to a role nobody sees',
        seventies: '{who} liking to dominate is something men pay for in private and fear in a wife',
        eighties: '{who} liking to dominate is something men pay for in private and fear in a wife',
        nineties: '{who} liking to dominate is a fantasy for some men and a threat to others',
        modern: '{who} liking to dominate is a fantasy for some men and a threat to others' },
    sex: { label: 'Sex and reputation',
        midcentury: 'good girls wait, wives don’t stray and a woman who wants it gets talked about; sex outside marriage is hidden, guilty and thrilling for it',
        seventies: 'the sexual revolution is in full swing but the double standard isn’t: he’s a stud and she’s easy',
        eighties: 'sex sells and AIDS scares; she gets judged for wanting it and for not wanting it',
        nineties: 'she still gets judged for wanting it, just more quietly',
        modern: 'sex is talked about openly; shame survives in families and screenshots' },
    money: { label: 'Money and work',
        midcentury: 'a secretary can be fired for marrying, getting pregnant or saying no, and everyone knows whose job keeps the house',
        seventies: 'women are paid less and bosses take liberties, and there’s no word yet for harassment',
        eighties: 'greed is good: money buys silence and loyalty, and being poor is a personal failing',
        nineties: 'money buys lawyers, silence and the benefit of the doubt',
        modern: 'money buys lawyers, silence and the benefit of the doubt' },
    // These show only when something on the cards touches them (LENS_TRIGGERS).
    vice: { label: 'Vices',
        midcentury: 'everyone smokes, everywhere: offices, hospitals, in bed; a drink at lunch is normal, pills for nerves come from the family doctor, and drugs belong to jazz clubs and beatniks',
        seventies: 'cigarettes everywhere, Quaaludes and cocaine at parties, pot in every dorm, and drink-driving is a joke',
        eighties: 'cocaine for the rich, crack in the papers, smoke in every bar and Just Say No on the television',
        nineties: 'smoking still allowed in bars and cars, raves and ecstasy, heroin chic in the magazines',
        modern: 'vapes instead of cigarettes, weed often legal, pills traded quietly, and everything ends up on someone’s phone' },
    secrets: { label: 'Being found out',
        midcentury: 'party lines and operators listen in, motels want a married name, neighbours watch through the curtains, and a private eye costs a few dollars a day',
        seventies: 'phones can be tapped, photos are developed by a stranger at the chemist, and neighbours still talk',
        eighties: 'answering machines keep messages anyone can play back, and a credit card bill can give the game away',
        nineties: 'pagers, caller ID and call-back give people away, and an unlocked email account or a saved chat log is a confession',
        modern: 'phones keep everything: locations, messages and photos, and a screenshot travels fast' },
    affair: { label: 'Marriage and straying',
        midcentury: 'divorce means proving adultery or cruelty in court; a man’s affairs get a wink, a woman who strays is a tramp, and the motel register is the risk',
        seventies: 'no-fault divorce has arrived and swinging gets talked about, but the one who was cheated on still gets the sympathy and the house',
        eighties: 'affairs are a soap-opera staple, and alimony and custody make leaving expensive',
        nineties: 'talk shows air every betrayal; a caught affair means lawyers and splitting the CD collection',
        modern: 'affairs live and die in phones; one message thread can end a marriage' },
    faith: { label: 'Faith and sin',
        midcentury: 'church is social standing: everyone goes, divorce and sex outside marriage are sins, and the priest or pastor knows every family’s business',
        seventies: 'faith is fading for some and turning loud for others, and guilt still runs the family',
        eighties: 'television evangelists and the satanic panic: sin is a public accusation',
        nineties: 'fewer people go to church, but the guilt they were raised with still runs the family',
        modern: 'faith is a choice now, though the guilt from an upbringing still bites' },
    law: { label: 'The law',
        midcentury: 'police beat confessions out of people, there is no DNA testing and the chair waits; who you know decides how a case goes',
        seventies: 'police are corrupt as often as not, forensics means fingerprints and blood type, and a killer can move freely between states',
        eighties: 'forensics is young and there are no linked databases, so someone who moves around can stay unknown for years',
        nineties: 'DNA evidence is new and doesn’t always convince a jury, cameras are grainy and rare, and phone records need a warrant',
        modern: 'cameras, phones and DNA make hiding hard; money and good lawyers still buy time' },
    discipline: { label: 'Discipline',
        midcentury: 'the belt, the paddle and the ruler are normal discipline at home and at school, so spanking a grown-up is half shame and half something remembered',
        seventies: 'corporal punishment is still everywhere in schools and homes, and adults who play with it keep it to mail-order magazines',
        eighties: 'schools argue over paddling and caning; for adults it is a private kink found through personal ads and specialist shops',
        nineties: 'school canings are banned or dying out; adults who want it find each other through personal ads and early internet forums',
        modern: 'it is a known kink with its own toys and forums, though most still keep it secret' },
};
// America in the 1950s and 60s only (not Britain), each shown only when something on the cards touches
// it. mw is used when the pair is a man and a woman, with {man} and {woman} as their names; any otherwise.
const SIXTIES = {
    home: { label: 'Home and marriage',
        mw: 'a woman like {woman} is expected to marry, keep house, cook and look pretty when her husband gets home; a wife’s money is an allowance, and no state will charge a husband for forcing his wife',
        any: 'marriage is for life and the home is a wife’s whole job; what a husband does behind his own front door is nobody else’s business' },
    courting: { label: 'Dating',
        mw: '{man} asks, pays, drives and decides; going steady means {woman} wears his ring or his jacket, and if she goes all the way before marriage it is her name that gets ruined',
        any: 'dating has rules: the man asks, pays and drives, going steady means wearing his ring, and petting in a parked car is as far as nice people admit to' },
    babies: { label: 'Pregnancy',
        any: 'the Pill is brand new and only for wives whose doctor agrees; abortion is a crime done in back rooms, and an unmarried girl who is expecting gets sent away and made to give the baby up' },
    bedroom: { label: 'What nobody says',
        any: 'nobody talks about sex: brides learn on the wedding night, men learned from buddies and magazines, and oral or anal sex counts as a perversion and a crime in nearly every state' },
    dress: { label: 'Dressing',
        mw: '{man} goes out in a hat, a pressed suit and Brylcreem, {woman} in a girdle, stockings, gloves and set hair, so seeing each other undressed or undone is a real intimacy',
        any: 'everyone dresses: men in hats, pressed suits and Brylcreem, women in girdles, stockings, gloves and set hair, so being seen undressed or undone is a real intimacy' },
    pictures: { label: 'Pictures',
        any: 'dirty pictures come by mail in plain envelopes and the man at the camera shop sees every print, so a Polaroid that develops in a minute, unseen, is worth a great deal' },
    war: { label: 'The war',
        any: 'most men over thirty fought in the war or in Korea and don’t talk about it; drinking, temper and nightmares are just how fathers are' },
    appearances: { label: 'Appearances',
        any: 'what the neighbours think rules everything: the lawn, the church pew, the right club; a scandal follows a family for years, so trouble is hushed up rather than fixed' },
    suspicion: { label: 'Suspicion',
        any: 'the Red Scare taught people to report each other: the FBI keeps files, a man can lose his job over who he drank with, and anyone different can be called a communist or a pervert' },
    guns: { label: 'Guns',
        any: 'guns are ordinary: a revolver in the nightstand, a rifle in the truck, a war pistol in a drawer, and no licence needed to buy one' },
    road: { label: 'Cars and roads',
        any: 'the car means freedom and privacy: lovers’ lanes, drive-ins and motels that ask no questions, no seatbelts, and hitchhikers that people still pick up' },
    youth: { label: 'Teenagers',
        any: 'teenagers have money, cars and rock and roll for the first time; parents and newspapers fear delinquents, and a girl seen with a bad boy gets talked about' },
    experiments: { label: 'Experiments',
        any: 'doctors and the government quietly test LSD, shock treatment and hypnosis on patients, prisoners and paid volunteers, and the subjects are rarely told the truth' },
};
// What the darker, gendered tags mean in an older period, folded into the one Power line so the
// sexism is specific to what's on instead of repeated. Up to two, for a man over a woman before the 1990s.
// [key, text]; index.js says which keys are on.
const POWER_TINTS = {
    trapped: 'she has nowhere to run: no money of her own, no shelter that would take her, and police who would bring her back',
    gaze: 'his eyes on her body are the normal order of things, and she is meant to take it as a compliment',
    possessive: 'his possessiveness passes for devotion, and nobody steps in',
    gaslight: 'if she says it didn’t happen that way, she is the one who sounds unwell',
    stalking: 'a man watching and following a woman gets called persistence',
    contempt: 'his contempt for women is ordinary talk at work and at the bar',
};
const OLD = new Set(['midcentury', 'seventies', 'eighties']);
// A woman over a man, with her looking openly: the one gendered tint that runs the other way.
const WM_TINTS = { gaze: 'her open looking at a man gets her called fast, or worse' };
const fillIn = (text, map) => text.replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
// The harshest clause of a Power line ("called hysterical and committed") only goes in when the one holding
// power is in a cold, cruel, angry or controlling mood (ctx.harsh). Otherwise it's the world, not how he treats her.
// ctx: { era, n, u, gn, gu ('he' | 'she' | 'they'), top: 'n' | 'u' | '', harsh, medicine, romance, money, manSub, womanDom, tints: [POWER_TINTS keys] }
// manSub / womanDom: the name of the person, or ''. Returns up to three lines, most important first.
// A small seeded shuffle, so the same reply always gets the same lines (a swipe or a re-read of the note
// shows the same ones) but the next reply can bring different ones.
function seededOrder(list, seed) {
    let x = Math.imul((Number(seed) || 0) + 1, 0x9E3779B9) >>> 0;
    const next = () => { x = (x + 0x6D2B79F5) >>> 0; let t = Math.imul(x ^ (x >>> 15), x | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
}
export const ERA_LINE_CHOICES = [1, 2, 3, 4, 5, 6];
const AMERICAN = id => !/britain|scotland/.test(id);
// manSub / womanDom: the name of the person, or ''. cap: how many lines at most (default 3). seed: the reply
// number, which picks which lines show when more apply than fit. Power, when it applies, always comes first.
export function eraLenses(ctx) {
    const group = eraGroup(ctx.era); if (!group) return [];
    const out = [], name = { n: ctx.n, u: ctx.u }, gender = { n: ctx.gn, u: ctx.gu };
    let power = null;
    if (ctx.top) {
        const low = ctx.top === 'n' ? 'u' : 'n', shape = gender[ctx.top] === 'he' && gender[low] === 'she' ? 'mw' : gender[ctx.top] === 'she' && gender[low] === 'he' ? 'wm' : 'any';
        const raw = POWER[group][shape] ?? POWER[group].any, text = Array.isArray(raw) ? raw[0] + (ctx.harsh ? raw[1] : '') : raw;
        const tints = !OLD.has(group) ? [] : (ctx.tints ?? []).map(k => shape === 'mw' ? POWER_TINTS[k] : shape === 'wm' ? WM_TINTS[k] : '').filter(Boolean).slice(0, 2);
        power = ['Power', fillIn(text, { top: name[ctx.top], low: name[low] }) + (tints.length ? `. Here, ${tints.join('; ')}` : '')];
    }
    if (ctx.manSub) out.push([LENSES.manSub.label, fillIn(LENSES.manSub[group], { who: ctx.manSub })]);
    else if (ctx.womanDom) out.push([LENSES.womanDom.label, fillIn(LENSES.womanDom[group], { who: ctx.womanDom })]);
    if (ctx.romance && gender.n === gender.u && ['he', 'she'].includes(gender.n)) out.push([LENSES.queer.label, LENSES.queer[`${group}${gender.n === 'he' ? 'Men' : 'Women'}`] ?? LENSES.queer[group]]);
    if (ctx.medicine) out.push([LENSES.medicine.label, LENSES.medicine[group]]);
    if (ctx.romance && new Set([gender.n, gender.u]).size === 2 && [gender.n, gender.u].includes('she') && [gender.n, gender.u].includes('he')) out.push([LENSES.sex.label, LENSES.sex[group]]);
    if (ctx.money) out.push([LENSES.money.label, LENSES.money[group]]);
    for (const key of ['affair', 'secrets', 'discipline', 'vice', 'faith', 'law']) if (ctx[key]) out.push([LENSES[key].label, LENSES[key][group]]);
    if (group === 'midcentury' && AMERICAN(ctx.era)) {
        const man = ['n', 'u'].find(k => gender[k] === 'he'), woman = ['n', 'u'].find(k => gender[k] === 'she');
        for (const [key, lens] of Object.entries(SIXTIES)) if (ctx[key]) out.push([lens.label, man && woman && lens.mw ? fillIn(lens.mw, { man: name[man], woman: name[woman] }) : lens.any]);
    }
    const cap = ERA_LINE_CHOICES.includes(Number(ctx.cap)) ? Number(ctx.cap) : 3, room = cap - (power ? 1 : 0);
    // More than fit: a different handful each reply, so a long period story keeps meeting new sides of it.
    const rest = out.length > room ? seededOrder(out, ctx.seed).slice(0, room) : out;
    return [...(power ? [power] : []), ...rest].map(([label, text]) => `- ${label}: ${text}.`);
}

// What turns a lens on. Ids from the relationship tags, traits and turn-ons that already exist.
export const POWER_ROLES = ['has_power_over', 'boss_of', 'captor_of', 'doctor_of', 'guardian_of', 'employs_in_house', 'parent_of', 'teacher_of', 'mentor', 'leads', 'creator_of', 'deals_to'];
export const UNDER_ROLES = ['under_power', 'works_for', 'captive_of', 'patient_of', 'ward_of', 'in_service_to', 'child_of', 'student_of', 'follows', 'creation_of', 'buys_from'];
export const POWER_PAIRS = ['married', 'engaged', 'arranged_marriage', 'marriage_of_convenience', 'power_imbalance', 'age_gap', 'captor_captive', 'gilded_cage', 'spoiled_captive', 'bought_and_paid', 'sugar', 'office_romance', 'held_by_threat'];
export const MEDICINE_ROLES = ['doctor_of', 'patient_of'];
export const MEDICINE_PAIRS = ['scientist_and_subject'];
export const ROMANCE_PAIRS = ['dating', 'engaged', 'married', 'lovers', 'long_term_partners', 'affair', 'secret_relationship', 'friends_with_benefits', 'situationship', 'courting_pair', 'forbidden_love', 'slow_burn', 'mutual_pining', 'obsessive_love', 'love_hate'];
export const MONEY_ROLES = ['boss_of', 'works_for', 'employs_in_house', 'in_service_to'];
export const MONEY_STANDING = ['wealth', 'poor', 'in_debt', 'pampered', 'owes_dangerous_people'];
export const SUB_TRAITS = ['soft_sub', 'slave_role', 'living_statue_role', 'human_furniture_role', 'task_focused_sub', 'submissive', 'bottom', 'service_submissive', 'obedient', 'owned', 'doll', 'pet_kitten', 'pet_puppy', 'pet_doe', 'pet_pig', 'pet_cow', 'pet_pony', 'ravished', 'role_reversal_sub', 'rope_bunny'];
export const SUB_TURNS = ['being_humiliated', 'being_dressed', 'masochist', 'crossdressing_play', 'degradation_in_bed', 'spanking_receiving', 'caning_receiving', 'whipping_receiving', 'being_made_dumb', 'being_dehumanised'];
export const DOM_TRAITS = ['pleasure_dom', 'courtly_dom', 'disciplinarian', 'princess_dominance', 'dominant', 'top', 'mistress', 'mommy', 'gentle_dominant', 'owner', 'brat_tamer', 'doll_keeper', 'ravishing', 'role_reversal_dom', 'rigger'];
export const DOM_TURNS = ['sadist', 'humiliating_others', 'degrading', 'spanking_giving', 'caning_giving', 'whipping_giving', 'dumbification', 'dehumanising_others'];
// What switches on a lens: a turn-on of either person at clear or stronger (turns), a mood, trait or state of
// either person at clear or stronger (moods), a skill of either at 5 or more (skills), a tie between them
// (ties) or something on the Story tab (story).
export const LENS_TRIGGERS = {
    money: { skills: ['typing', 'negotiation', 'gambling'] },
    medicine: { skills: ['medicine', 'surgery', 'psychiatry'], turns: ['doctors', 'hospital_gowns', 'gurneys', 'straitjackets', 'clinical_voice', 'medplay_giving', 'medplay_receiving'],
        moods: ['sedated', 'hospital_ward', 'hysterical'], story: ['asylum_horror'] },
    vice: { skills: ['holding_liquor', 'bartending', 'drug_dealing'], turns: ['smoking', 'drunkenness', 'someone_high', 'shotgunning', 'smoke_breath', 'smoke_scent'],
        moods: ['party_brain', 'drinking_to_forget', 'strung_out', 'comedown', 'hazy_drunk', 'blackout_drunk', 'euphoric_high'] },
    secrets: { skills: ['wiretapping', 'stalking', 'blackmail', 'disguise'], turns: ['almost_caught', 'risky_places', 'being_followed', 'polaroids', 'tape_recordings', 'filming_someone', 'being_filmed', 'love_letters'],
        moods: ['fear_of_being_found_out', 'hiding_evidence', 'false_persona', 'keeping_tabs', 'hiding_it_from_family', 'covering_for_them'], ties: ['stalks', 'secret_relationship'] },
    affair: { turns: ['taken_people', 'being_the_other_woman', 'being_cheated_on', 'cuckolding', 'wedding_rings'],
        moods: ['forbidden_want', 'jilted', 'betrayed'], ties: ['affair'] },
    faith: { turns: ['piety', 'hierophilia', 'sinfulness', 'clergy', 'penance'], moods: ['guilt_sick', 'forsaken', 'righteous', 'guilty_lust'] },
    law: { skills: ['murder', 'burglary', 'safecracking', 'forgery', 'con_artistry', 'bribery', 'body_disposal'], turns: ['killers', 'criminals', 'mobsters', 'detectives', 'con_artists', 'erotophonophilia', 'hybristophilia'],
        moods: ['murderous', 'hiding_evidence', 'calm_after_violence', 'bloodthirsty', 'blackmailing'] },
    discipline: { turns: ['spanking_giving', 'spanking_receiving', 'caning_giving', 'caning_receiving', 'whipping_giving', 'whipping_receiving', 'crop_play', 'being_punished', 'being_scolded', 'canes'],
        moods: ['punitive', 'dreading_punishment'] },
    // America in the 1950s and 60s only.
    home: { skills: ['housekeeping', 'cooking', 'parenting'], turns: ['housewives', 'domesticity', 'wedding_rings'], moods: ['married_status', 'domestic_tyrant', 'domestic'], ties: ['married', 'engaged', 'arranged_marriage', 'marriage_of_convenience'], story: ['domestic_thriller'] },
    courting: { turns: ['being_courted', 'being_taken_out', 'girl_boy_next_door', 'first_times'], ties: ['dating', 'courting_pair', 'courting', 'slow_burn', 'mutual_pining'] },
    babies: { turns: ['breeding_giving', 'breeding_receiving', 'pregnant_bellies', 'lactation'] },
    bedroom: { turns: ['giving_oral', 'receiving_oral', 'anal_giving', 'anal_receiving', 'inexperienced_partners', 'innocence', 'corruption_kink'], moods: ['innocent'] },
    dress: { skills: ['fashion_sense', 'hairdressing', 'sewing'], turns: ['set_hair_pearls', 'stocking_fetish', 'glove_fetish', 'corsetry_fetish', 'lipstick', 'sharp_suits', 'undone_ties', 'waistcoats_braces', 'greased_hair', 'slow_undressing', 'lingerie'], moods: ['well_dressed', 'vain'] },
    pictures: { skills: ['photography'], turns: ['polaroids', 'filming_someone', 'being_filmed', 'exhibitionist', 'voyeur', 'burlesque_attraction', 'posing_someone'] },
    war: { turns: ['scars', 'uniformed_people', 'dog_tags'], moods: ['traumatised', 'scarred'] },
    appearances: { turns: ['social_climbing', 'meticulous_presentation', 'rule_followers', 'preppy_types', 'rich_people'], moods: ['keeps_up_appearances', 'respectability_obsessed', 'gossipy', 'hiding_it_from_family'], ties: ['neighbours'] },
    suspicion: { skills: ['wiretapping'], turns: ['being_followed', 'detectives'], moods: ['paranoid', 'suspicious', 'false_persona', 'keeping_tabs'], ties: ['suspicious_of'], story: ['cold_war_horror'] },
    guns: { skills: ['marksmanship'], turns: ['gun_play', 'hoplophilia', 'gun_oil_smell'] },
    road: { skills: ['driving'], turns: ['backseat', 'bikers', 'strangers', 'being_kidnapped'], moods: ['in_a_car'] },
    youth: { skills: ['guitar', 'bass', 'drums', 'dancing'], turns: ['greasers', 'beatniks', 'cheerleaders_jocks', 'rock_stars', 'bad_boy_girl', 'rebelliousness'], moods: ['rebellious'] },
    experiments: { skills: ['hypnosis', 'psychiatry', 'chemistry'], turns: ['being_experimented_on', 'hypnotising', 'being_hypnotised', 'conditioning_kink', 'scientists'], moods: ['test_subject', 'experimenter_role', 'lab_subject'], ties: ['scientist_and_subject'], story: ['unethical_experiments', 'experiment', 'subject_and_scientist'] },
};
