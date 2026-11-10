// 1.49.0: the period, said plainly, and what it does to the things that are switched on. Opus 5.5 does better with
// one clear instruction ("Set in 1960s America") and a short line than with a long list of period props. A
// lens is one line about how the period shapes something already in play (power, medicine, queer desire,
// secret kinks, sex and reputation, money and work), and only shows when that thing is on. Gender comes from
// the Pronouns picker on the Bonds tab: he is a man, she is a woman. Pure data and functions; index.js decides
// what's on and core.js places the lines.

// Short lines for every era: the feel and the few things that matter most, not a prop list.
export const ERA_CUES = {
    era_1890s: 'gaslight, telegrams and calling cards; strict class, chaperones and corsets; scandal ruins people and asylums take the inconvenient',
    era_1890s_britain: 'late Victorian London: servants, hansom cabs and several posts a day; rigid class, chaperones and corsets; the Wilde trials and the workhouse',
    era_1890s_scotland: 'late Victorian Scotland: Glasgow shipyards and tenements, Edinburgh gentry, the Kirk and the Sabbath; poorhouses, cleared glens and whisky',
    era_1900s: 'Edwardian: motorcars and telephones for the rich, telegrams for everyone else; servants, gloves and etiquette; suffragettes and music halls',
    era_1900s_britain: 'Edwardian Britain: country-house weekends, servants and the Tube; telephones for the rich; suffragettes and music halls',
    era_1900s_scotland: 'Edwardian Scotland: Clyde shipyards and smoky tenements, Edinburgh respectability, the Kirk and the pub, emigrant ships',
    era_1910s: 'the Great War, telegrams of the dead and shell shock, then the 1918 flu; operator telephones, silent films and mourning dress',
    era_1950s: 'Cold War fear and conformity: rotary phones, black-and-white TV, rigid gender roles, segregation and McCarthy-era suspicion',
    era_1960s: 'buttoned-up early, counterculture later: typewriters, rotary phones, cigarettes everywhere, Cold War secrecy, asylums and ECT',
    era_1960s_america: 'Kennedy to the moon landing: typewriters, rotary phones, cigarettes everywhere, Cold War secrecy, state hospitals and ECT',
    era_1960s_britain: 'austerity turning into Swinging London: red phone boxes, two TV channels, pubs shut at eleven, the Profumo scandal',
    era_1970s: 'payphones, cassettes and Polaroids, no internet or mobiles; disco then punk; smoking indoors, hitchhiking and serial-killer headlines',
    era_1980s: 'Walkmans, VHS and pagers, no internet for most; yuppie greed and power suits; cocaine, the AIDS crisis and satanic panic',
    era_1990s: 'dial-up, pagers and landlines, mobiles only late; video shops and CDs; grunge and Britpop; ‘whatever’',
    era_1990s_america: 'dial-up AOL, pagers and answering machines, cell phones only late; Blockbuster and malls; grunge and hip-hop; ‘whatever’',
    era_2000s: 'flip phones and T9, MSN then Facebook, iPods and digital cameras; post-9/11 nerves, reality TV and emo; the 2008 crash',
    era_2000s_america: 'flip phones and T9, AIM and MySpace then Facebook, iPods; post-9/11 airports and Iraq; reality TV and emo; the 2008 crash',
    era_2010s: 'smartphones everywhere: Instagram, Snapchat, Tinder and group chats, Uber and Netflix; selfies, memes and vapes',
    era_2010s_america: 'smartphones everywhere: Instagram, Tinder and group chats, Uber and Netflix; Obama to Trump; selfies, memes and Juuls',
    era_2020s: 'TikTok, group chats, delivery apps and tap-to-pay; lockdowns in recent memory; remote work, dating apps and vapes',
    era_2020s_america: 'TikTok, group chats, DoorDash and Venmo; COVID in recent memory; remote work, dating apps and AI chatbots everywhere',
};
// Era → period group, for the lenses.
export function eraGroup(id = '') {
    const y = Number(String(id).match(/era_(\d{4})s/)?.[1]);
    return !y ? '' : y < 1920 ? 'victorian' : y < 1970 ? 'midcentury' : y < 1980 ? 'seventies' : y < 1990 ? 'eighties' : y < 2010 ? 'nineties' : 'modern';
}

// Each lens: text by period group. Power has three shapes: a man over a woman (mw), a woman over a man (wm),
// and anything else (any). {top} holds the power, {low} is under it; {n} and {u} are the character and player.
const POWER = {
    victorian: { mw: ['{top} has the law and everyone’s assumptions behind him: a woman’s money, body and children belong to her husband or father, and her word counts for little against a man’s', ', and a woman who resists can be called hysterical and shut away'],
        wm: 'a woman holding power over a man is improper and fragile: it rests on money, title or secrets, and the law and sympathy are his the moment he turns on her',
        any: 'power runs on class and rank: servants, tenants and dependants owe obedience, and stepping out of place means ruin' },
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
        victorian: 'doctors decide what a woman’s nerves need: rest cures, laudanum, the asylum; nobody asks consent, and complaining proves the diagnosis',
        midcentury: 'a doctor’s word is law: patients aren’t told, a husband or father signs consent, and ECT, sedation, restraints and lobotomy are routine, with a state hospital the threat behind every visit',
        seventies: 'doctors are gods in white coats: Valium for unhappy wives, institutions closing and patients dumped, consent mostly a form',
        eighties: 'doctors still talk over patients; a frightened or difficult one gets a prescription, and AIDS fear makes some of them cruel',
        nineties: 'patients have rights and records now; a doctor’s power is the chart, the prescription pad and being believed',
        modern: 'patients have rights and records; a doctor’s power is the chart, the prescription pad and being believed' },
    queer: { label: 'Queer desire',
        victorian: 'love between women is a friendship nobody names and between men it is a crime; it lives in letters, looks and locked rooms',
        victorianMen: 'love between men is a crime, as the Wilde trials showed: it lives in coded looks, locked rooms and the constant risk of blackmail',
        victorianWomen: 'love between women is a romantic friendship nobody names: it lives in letters, shared beds and looks, and a husband or family can end it with one decision',
        midcentury: 'being queer is an illness, a sin and a crime: bar raids, firings, blackmail and aversion therapy, so it lives in coded looks, false names and back rooms',
        seventies: 'queer people are coming out after Stonewall but most still pass; families disown, bosses fire and police raid',
        eighties: 'AIDS and fear: being out costs jobs and family, so desire hides behind jokes and sudden coldness',
        nineties: 'out in some places and a slur in others; most still choose carefully who knows',
        modern: 'mostly open, though family, faith or reputation can still make it a secret' },
    manSub: { label: 'Secret desires',
        victorian: '{who} wanting to kneel, be dressed up or be hurt is a shameful secret that could ruin or commit a man of his standing, so most men keep it behind locked doors and in denial',
        midcentury: '{who} wanting to kneel, be dressed up or be hurt is a shameful secret that could ruin or commit a man of his standing, so most men keep it behind locked doors and in denial',
        seventies: '{who} wanting to submit is a private shame and a joke if found out; it happens in secret clubs and paid rooms',
        eighties: '{who} wanting to submit is a private shame and a joke if found out; it happens in secret clubs and paid rooms',
        nineties: '{who} wanting to submit is something he would tell almost nobody, and it could still shame him if it got out',
        modern: '{who} wanting to submit is something he would tell almost nobody, and it could still shame him if it got out' },
    womanDom: { label: 'Secret desires',
        victorian: '{who} wanting to dominate or hurt is unnatural to everyone else, the mark of a madwoman or a whore, so she hides it or keeps it to a role nobody sees',
        midcentury: '{who} wanting to dominate or hurt is unnatural to everyone else, the mark of a madwoman or a whore, so she hides it or keeps it to a role nobody sees',
        seventies: '{who} liking to dominate is something men pay for in private and fear in a wife',
        eighties: '{who} liking to dominate is something men pay for in private and fear in a wife',
        nineties: '{who} liking to dominate is a fantasy for some men and a threat to others',
        modern: '{who} liking to dominate is a fantasy for some men and a threat to others' },
    sex: { label: 'Sex and reputation',
        victorian: 'a woman’s reputation is everything and one rumour of desire ruins her, so wanting happens in glances, gloves and closed carriages',
        midcentury: 'good girls wait, wives don’t stray and a woman who wants it gets talked about; sex outside marriage is hidden, guilty and thrilling for it',
        seventies: 'the sexual revolution is in full swing but the double standard isn’t: he’s a stud and she’s easy',
        eighties: 'sex sells and AIDS scares; she gets judged for wanting it and for not wanting it',
        nineties: 'she still gets judged for wanting it, just more quietly',
        modern: 'sex is talked about openly; shame survives in families and screenshots' },
    money: { label: 'Money and work',
        victorian: 'service and class decide everything: a servant can be dismissed without a reference over a look or a rumour',
        midcentury: 'a secretary can be fired for marrying, getting pregnant or saying no, and everyone knows whose job keeps the house',
        seventies: 'women are paid less and bosses take liberties, and there’s no word yet for harassment',
        eighties: 'greed is good: money buys silence and loyalty, and being poor is a personal failing',
        nineties: 'money buys lawyers, silence and the benefit of the doubt',
        modern: 'money buys lawyers, silence and the benefit of the doubt' },
};
// 1.49.1: what the darker, gendered tags mean in an older period, folded into the one Power line so the
// sexism is specific to what's on instead of repeated. Up to two, for a man over a woman before the 1990s.
// [key, text]; index.js says which keys are on.
export const POWER_TINTS = {
    trapped: 'she has nowhere to run: no money of her own, no shelter that would take her, and police who would bring her back',
    gaze: 'his eyes on her body are the normal order of things, and she is meant to take it as a compliment',
    possessive: 'his possessiveness passes for devotion, and nobody steps in',
    gaslight: 'if she says it didn’t happen that way, she is the one who sounds unwell',
    stalking: 'a man watching and following a woman gets called persistence',
    contempt: 'his contempt for women is ordinary talk at work and at the bar',
};
const OLD = new Set(['victorian', 'midcentury', 'seventies', 'eighties']);
// A woman over a man, with her looking openly: the one gendered tint that runs the other way.
const WM_TINTS = { gaze: 'her open looking at a man gets her called fast, or worse' };
const fillIn = (text, map) => text.replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
// 1.49.4: the harshest clause of a Power line ("called hysterical and committed") only goes in when the one holding
// power is in a cold, cruel, angry or controlling mood (ctx.harsh). Otherwise it's the world, not how he treats her.
// ctx: { era, n, u, gn, gu ('he' | 'she' | 'they'), top: 'n' | 'u' | '', harsh, medicine, romance, money, manSub, womanDom, tints: [POWER_TINTS keys] }
// manSub / womanDom: the name of the person, or ''. Returns up to three lines, most important first.
export function eraLenses(ctx) {
    const group = eraGroup(ctx.era); if (!group) return [];
    const out = [], name = { n: ctx.n, u: ctx.u }, gender = { n: ctx.gn, u: ctx.gu };
    if (ctx.top) {
        const low = ctx.top === 'n' ? 'u' : 'n', shape = gender[ctx.top] === 'he' && gender[low] === 'she' ? 'mw' : gender[ctx.top] === 'she' && gender[low] === 'he' ? 'wm' : 'any';
        const raw = POWER[group][shape] ?? POWER[group].any, text = Array.isArray(raw) ? raw[0] + (ctx.harsh ? raw[1] : '') : raw;
        const tints = !OLD.has(group) ? [] : (ctx.tints ?? []).map(k => shape === 'mw' ? POWER_TINTS[k] : shape === 'wm' ? WM_TINTS[k] : '').filter(Boolean).slice(0, 2);
        out.push(['Power', fillIn(text, { top: name[ctx.top], low: name[low] }) + (tints.length ? `. Here, ${tints.join('; ')}` : '')]);
    }
    if (ctx.manSub) out.push([LENSES.manSub.label, fillIn(LENSES.manSub[group], { who: ctx.manSub })]);
    else if (ctx.womanDom) out.push([LENSES.womanDom.label, fillIn(LENSES.womanDom[group], { who: ctx.womanDom })]);
    if (ctx.romance && gender.n === gender.u && ['he', 'she'].includes(gender.n)) out.push([LENSES.queer.label, LENSES.queer[`${group}${gender.n === 'he' ? 'Men' : 'Women'}`] ?? LENSES.queer[group]]);
    if (ctx.medicine) out.push([LENSES.medicine.label, LENSES.medicine[group]]);
    if (ctx.romance && new Set([gender.n, gender.u]).size === 2 && [gender.n, gender.u].includes('she') && [gender.n, gender.u].includes('he')) out.push([LENSES.sex.label, LENSES.sex[group]]);
    if (ctx.money) out.push([LENSES.money.label, LENSES.money[group]]);
    return out.slice(0, 3).map(([label, text]) => `- ${label}: ${text}.`);
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
export const SUB_TURNS = ['being_humiliated', 'being_dressed', 'masochist', 'crossdressing_play', 'degradation_in_bed'];
export const DOM_TRAITS = ['pleasure_dom', 'courtly_dom', 'disciplinarian', 'princess_dominance', 'dominant', 'top', 'mistress', 'mommy', 'gentle_dominant', 'owner', 'brat_tamer', 'doll_keeper', 'ravishing', 'role_reversal_dom', 'rigger'];
export const DOM_TURNS = ['sadist', 'humiliating_others', 'degrading'];
