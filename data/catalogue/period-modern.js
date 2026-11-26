// Setting lines for the 1980s, 1990s, 2010s and 2020s (2.0.6), in America, England, or both. They work exactly like
// the 1950s\u201360s lines in period.js (same triggers, when, group, w and world fields; see the notes there), with two
// more fields: era ('80s', '90s', '10s', '20s') and place ('us' or 'uk'; no place means both). They describe the
// world around a person, never who the person is, and leave it to the story whether anyone defies it.
//
// Researched against: PACE 1984 and the end of the sus law (1981); the Anti-Drug Abuse Act 1986 (100 to 1 crack
// sentencing, five grams of crack carrying five years) and Bowers v. Hardwick (1986); the 1987 British Social
// Attitudes survey (about three quarters said sex between men was always or mostly wrong) and Section 28
// (1988, repealed 2000 in Scotland and 2003 in England); Don't Ask, Don't Tell (1993), DOMA (1996) and the
// Matthew Shepard killing (1998); the UK age of consent for gay men (21, cut to 18 in 1994, equal in 2000); the
// Criminal Justice and Public Order Act 1994 (raves); the national DNA database (UK 1995, CODIS 1998); three-strikes
// laws and New York's broken-windows policing; lad culture and Loaded (1994) and ladettes; heroin chic; county lines
// (named by the NCA around 2015), cuckooing and the Modern Slavery Act 2015; drill videos used as evidence;
// Stingray cell-site simulators and Carpenter v. US (2018, warrants for phone location records); same-sex
// marriage (England 2014, US 2015); #MeToo (2017); the opioid wave from prescription pills to heroin to fentanyl;
// EncroChat (Operation Venetic, 2020, 746 UK arrests in the first wave) and Sky ECC (2021); live facial
// recognition vans in London; Gallup's trend on gay relations (about 40% acceptable in 2001, over 50% from 2010,
// around two thirds in the 2020s).

const L = (era, cat, sub, id, label, texts, on = {}) => ({ era, cat, sub, id, label, ...texts, ...on });

// Shared triggers.
const DEALING = ['drug_dealer', 'known_dealer', 'dealer_mindset', 'turf_minded', 'trap_house', 'dealers_flat', 'hustler'];
const CRIME = ['wanted', 'suspected', 'arrested', 'out_on_bail', 'on_parole', 'under_investigation', 'on_the_run', 'ex_convict', 'juvie', 'mob_enforcer', 'crime_family', 'enforcer', 'debt_collector', 'con_artist', 'hitman', 'mob_boss', 'informant', 'crime_scene', 'police_station', 'interrogation_room', 'cops_closing_in', 'dealing_life', 'drug_world_violence'];
const COPS = ['police_officer', 'corrupt_cop', 'detective_mind'];
const LEAD = ['taking_charge', 'commanding', 'demanding', 'controlling', 'assertive', 'in_control', 'ruthless_ambition', 'ambitious', 'boss'];
const LOW = ['depressed', 'general_anxiety', 'social_anxiety', 'ptsd', 'complex_ptsd', 'bipolar', 'adhd', 'autistic', 'nervous_breakdown'];
const GAZE_M = ['male_gaze', 'womaniser', 'dirty_minded', 'chick_magnet', 'voyeur'];
const GAZE_F = ['female_gaze'];
const CLOSET = ['closeted', 'secret_lifestyle', 'homophobic'];
const RICH = ['wealth', 'new_money', 'old_money', 'yuppie', 'materialistic', 'status_obsessed', 'greedy', 'investment_banker'];
const POOR = ['poor', 'grew_up_poor', 'in_debt', 'unemployed', 'just_fired', 'evicted', 'bankrupt'];
const SLEEPS = ['womaniser', 'slutty', 'loose', 'chick_magnet', 'hedonistic', 'party_animal'];

export const PERIOD_MODERN = [
    // ================= 1980s =================
    L('80s', 'power', 'Who leads', 'e80_takes_charge', 'Getting ahead', {
        he: 'Money, confidence and winning are what people admire now. A man like {who} who takes charge is called a go-getter, and few ask how he got there.',
        she: 'Women are moving into offices in big-shouldered suits, but one who takes charge like {who} still gets called a ball-breaker behind her back, and is expected to stay feminine while she does it.' },
    { ids: LEAD }),
    L('80s', 'seen', 'What men and women are meant to be', 'e80_hard_men', 'Hard men', {
        he: 'The ideal man of the decade is muscled, tough and unbothered, the action-film hero. Hurt or fear showing in {who} reads to other men as weakness, so it comes out as anger, drink or silence.',
        she: 'Women are told they can have it all, a career, a family and a perfect body, and are blamed when they can\u2019t. {who} is expected to manage everything and make it look easy.' },
    { cats: ['sad', 'scared'] }),
    L('80s', 'queer', 'Read as queer', 'e80_too_soft', 'Too soft for a man', {
        he: 'A man who is gentle, dresses with care, wears a little make-up or doesn\u2019t chase women gets called gay as an insult, and in the AIDS years that word carries fear as well as contempt. {who} may be shoved, mocked or kept at arm\u2019s length for it.',
        she: 'A woman with short hair, no make-up and no boyfriend gets called a dyke. {who} is more likely to be laughed at than hit, but she hears it.' },
    { when: ['againstType'], group: 'queer' }),
    L('80s', 'queer', 'Two of them together', 'e80_aids', 'The AIDS years', {
        he: 'AIDS is in the news constantly and blamed on gay men. Two men together like {who} and {other} draw fear and disgust as well as mockery; some people won\u2019t share a cup or shake a hand.',
        she: 'Two women together are mostly invisible, or a joke to men. That invisibility protects {who} as much as it hurts, but family and work would still treat it as a scandal.' },
    { when: ['sameSex', 'romance'], group: 'queer', w: 85 }),
    L('80s', 'queer', 'The law', 'e80_law_uk', 'Section 28', {
        any: 'Sex between men is legal only at 21 and in private, and from 1988 councils and schools are banned from presenting gay relationships as normal family life. Most people tell surveys gay sex is wrong, so {who} keeps it hidden from nearly everyone.' },
    { place: 'uk', ids: CLOSET, when: ['sameSex'], group: 'queer_law' }),
    L('80s', 'queer', 'The law', 'e80_law_us', 'Still a crime', {
        any: 'In about half the states sex between men is still a crime, and the Supreme Court upheld that in 1986. Being found out can cost {who} a job, a home or family, with no law to stop it.' },
    { place: 'us', ids: CLOSET, when: ['sameSex'], group: 'queer_law' }),
    L('80s', 'seen', 'Looking', 'e80_gaze_m', 'A man\u2019s eye', {
        he: 'Pin-ups, swimsuit calendars and music videos make a man staring at a woman look normal, even flattering. {who}\u2019s looking is rarely questioned, and a woman who objects is called uptight.',
        she: 'Pin-ups and calendars are everywhere, and {who} has learnt to check how she looks to men without thinking about it. Being looked at is treated as a compliment she should take.' },
    { ids: GAZE_M }),
    L('80s', 'seen', 'Looking', 'e80_gaze_f', 'A woman looking back', {
        she: 'Women openly eyeing men is still more joke than right: male strippers and beefcake posters are a giggle for a hen night. {who}\u2019s frank looking will surprise men, and some will like it more than they admit.' },
    { ids: GAZE_F }),
    L('80s', 'money', 'Money', 'e80_greed', 'Flash money', {
        any: 'Making money fast is admired and showing it is fine: the car, the watch, the brick of a car phone. People judge {who} by what they own.' },
    { ids: RICH, world: true }),
    L('80s', 'money', 'Money', 'e80_skint_uk', 'On the dole', {
        any: 'Unemployment passes three million; pits, docks and factories close. Being out of work is common and bitter where {who} lives, and the papers call people like {who} scroungers.' },
    { place: 'uk', ids: POOR, world: true }),
    L('80s', 'money', 'Money', 'e80_skint_us', 'Left behind', {
        any: 'Factories close across the old industrial towns and politicians talk about welfare cheats. Being poor like {who} is treated as a personal failing.' },
    { place: 'us', ids: POOR, world: true }),
    L('80s', 'dating', 'Keeping in touch', 'e80_landline', 'The landline', {
        any: 'Most people have no mobile. Plans are made on the house phone, often with family listening, and once {who} is out the door nobody can reach them until they turn up or find a payphone.' },
    { when: ['romance'], w: 50 }),
    L('80s', 'bed', 'Sex', 'e80_safe_sex', 'The new fear', {
        any: 'Since AIDS arrived, condoms are on posters and in the news, and sleeping around carries a new fear on top of the old worry about getting pregnant.' },
    { when: ['heat'], w: 50 }),
    L('80s', 'name', 'Reputation', 'e80_slag', 'Sleeping around', {
        he: 'A man who sleeps around is a lad or a stud, and other men are half envious. {who} loses nothing by it.',
        she: 'A woman who sleeps around gets called a slag or a slut and it follows her. {who} is judged for what a man would be cheered for.' },
    { ids: SLEEPS }),
    L('80s', 'vices', 'Drugs', 'e80_coke', 'Cocaine', {
        any: 'Cocaine is the glamour drug of money, clubs and the music business. Using it marks {who} as fast-living rather than a junkie, as long as the money lasts.' },
    { ids: ['coked_up', 'party_scene_regular', 'yuppie', 'club_promoter'] }),
    L('80s', 'vices', 'Drugs', 'e80_crack', 'Crack', {
        any: 'Crack spreads through the cities from 1985. The news paints users as monsters, police sweep the corners, and five grams of it brings the same federal sentence as half a kilo of powder cocaine.' },
    { place: 'us', ids: ['on_crack', 'tweaking', 'trap_house', ...DEALING] }),
    L('80s', 'vices', 'Drugs', 'e80_smack_uk', 'Heroin', {
        any: 'Cheap heroin floods poorer towns and estates. Shared needles spread HIV fast, and a user like {who} is treated as a lost cause by most people around them.' },
    { place: 'uk', ids: ['on_heroin', 'needs_a_fix', 'nodding_off', 'junkie', 'withdrawal'] }),
    L('80s', 'vices', 'Smoking', 'e80_smoke', 'Smoke everywhere', {
        any: 'Smoking is allowed almost everywhere, in pubs, offices, cars and on planes. Nobody thinks twice about {who} lighting up.' },
    { ids: ['smoker', 'chain_smoking', 'nicotine_craving'], w: 45 }),
    L('80s', 'crime', 'The police', 'e80_police_uk', 'Stop and search', {
        any: 'The old sus law went after the 1981 riots, but police still stop and search on suspicion, and young black men far more than anyone. Under the new 1984 rules interviews are taped and suspects can ask for a solicitor, which a careful {who} knows to do.' },
    { place: 'uk', ids: [...CRIME, ...DEALING], group: 'police' }),
    L('80s', 'crime', 'The police', 'e80_police_us', 'The war on drugs', {
        any: 'The war on drugs is at full tilt: street sweeps, raids that break doors down, cars and cash seized, and long mandatory sentences from 1986. Police lean hard on informants and undercover buys, and a dealer like {who} knows any customer could be wearing a wire.' },
    { place: 'us', ids: [...CRIME, ...DEALING], group: 'police' }),
    L('80s', 'crime', 'What the police have', 'e80_tech', 'Before DNA', {
        any: 'Police work runs on informants, stake-outs, phone taps that need a warrant, and fingerprints on cards. There\u2019s no DNA testing until the decade\u2019s end, few cameras on the street and no mobile phone trail, so someone careful like {who} can stay a step ahead.' },
    { ids: [...CRIME, ...DEALING, ...COPS] }),
    L('80s', 'crime', 'The trade', 'e80_pager', 'Pagers and payphones', {
        any: 'A pager on the belt marks a doctor or a dealer. Customers page {who}, then call back from a payphone, because house phones can be tapped and traced.' },
    { ids: DEALING }),
    L('80s', 'scene', 'Cliques', 'e80_alt', 'Punks and goths', {
        any: 'Punks and goths are stared at in the street and blamed by worried parents for drugs, suicide and even devil worship. Looking like {who} gets you followed round shops and moved on by police.' },
    { ids: ['punk', 'goth', 'romantic_goth', 'goth_masc', 'alt'] }),
    L('80s', 'scene', 'Cliques', 'e80_preppy', 'Preppies and yuppies', {
        any: 'Polo shirts, money and the right schools set the tone. {who}\u2019s kind are envied and resented in equal measure, and they look down on anyone without them.' },
    { ids: ['preppy', 'yuppie', 'ivy_league', 'old_money', 'country_club'] }),
    L('80s', 'scene', 'Cliques', 'e80_rave_uk', 'Acid house', {
        any: 'Acid house parties in warehouses and fields, ecstasy and smiley faces; the papers are horrified and police set up roadblocks to stop them. {who} is part of something the grown-ups don\u2019t understand.' },
    { place: 'uk', ids: ['raver', 'rolling', 'party_scene_regular'] }),
    L('80s', 'scene', 'Cliques', 'e80_hiphop_us', 'Hip-hop', {
        any: 'Hip-hop is rising out of New York: tracksuits, gold chains and sneakers. Older people and police read {who}\u2019s style as trouble before they hear a word.' },
    { place: 'us', ids: ['streetwear', 'street_smart', 'street_code'] }),
    L('80s', 'mind', 'Help', 'e80_therapy', 'Pull yourself together', {
        he: 'Therapy is for the rich or the mad in most people\u2019s eyes. A man like {who} is told to pull himself together, and a doctor might offer pills before anyone asks what happened.',
        she: 'Therapy is for the rich or the mad in most people\u2019s eyes. A woman like {who} is more likely to get tranquillisers and be called highly strung.' },
    { ids: LOW }),
    L('80s', 'body', 'Looks', 'e80_body', 'The ideal body', {
        he: 'Action-film muscle and gym bodies set the bar, and {who}\u2019s build is measured against it by men and women alike.',
        she: 'Aerobics, leotards and diet shakes: thin and toned is the ideal and people comment on a woman\u2019s weight to her face. {who} hears about hers.' },
    { ids: ['muscular', 'athletic', 'chubby', 'curvy', 'lanky', 'petite', 'gaunt'], w: 50 }),
    L('80s', 'power', 'Who leads', 'e80_she_leads', 'A woman in charge', {
        he: 'A man taking orders from a woman gets ribbed by other men. {who} may play it down in public whatever he feels about it.',
        she: 'Women bosses are newer and rarer, and men look for a reason: that {who} slept her way up, or that {other} is soft.' },
    { when: ['mixed'], ids: ['boss'], ties: ['boss_of', 'works_for'], world: true }),

    // ================= 1990s =================
    L('90s', 'seen', 'What men and women are meant to be', 'e90_lads', 'Lads', {
        he: 'Lad culture rules: lager, football and magazines with half-dressed women on the cover. Being crude about women is passed off as a joke, and {who} gets a laugh for it.',
        she: 'Ladettes drink pints and swear like the lads; {who} is cheered for keeping up, and still called a slag if she sleeps around like them.' },
    { place: 'uk', ids: ['crude', 'vulgar', 'party_animal', 'life_of_party', 'swagger', 'bragging'] }),
    L('90s', 'seen', 'What men and women are meant to be', 'e90_roles', 'New roles', {
        he: 'Men are told to be more sensitive and mocked when they are. {who} can cry at a funeral now, but other men still notice if he cries anywhere else.',
        she: 'More women work and manage than ever, but the top jobs stay mostly male, and a woman like {who} who wants both a career and children is told she has to choose.' },
    { cats: ['sad', 'scared'], world: true }),
    L('90s', 'queer', 'Read as queer', 'e90_too_soft', 'Called gay', {
        he: 'Pop stars wear eyeliner on stage, but off stage a soft, careful or well-groomed man like {who} still has gay thrown at him as an everyday insult, and some men will want to prove a point with their fists.',
        she: 'Short hair, baggy clothes and no interest in boys get a woman like {who} called a lesbian, as a joke or a warning.' },
    { when: ['againstType'], group: 'queer' }),
    L('90s', 'queer', 'Two of them together', 'e90_couple', 'Two of them out', {
        he: 'More people have a gay friend or relative now, and a few gay characters are on television, but two men like {who} and {other} holding hands in most towns still draw stares, comments or worse.',
        she: 'Two women together like {who} and {other} are more visible than before, and men still treat it as a show put on for them.' },
    { when: ['sameSex', 'romance'], group: 'queer', w: 85 }),
    L('90s', 'queer', 'The law', 'e90_law_us', 'Don\u2019t ask, don\u2019t tell', {
        any: 'Gay soldiers can serve only in silence, federal law defines marriage as a man and a woman, and in most states being gay can still get {who} fired. The 1998 killing of a gay student in Wyoming is a fresh reminder of the risk.' },
    { place: 'us', ids: CLOSET, when: ['sameSex'], group: 'queer_law' }),
    L('90s', 'queer', 'The law', 'e90_law_uk', 'Unequal law', {
        any: 'Section 28 is still law in England, and gay men can\u2019t legally have sex until 18 (16 for everyone else from 2000). Out at work is a risk {who} weighs carefully.' },
    { place: 'uk', ids: CLOSET, when: ['sameSex'], group: 'queer_law' }),
    L('90s', 'seen', 'Looking', 'e90_gaze_m', 'Supermodels and lads\u2019 mags', {
        he: 'Supermodels, lads\u2019 mags and beach-babe television put women\u2019s bodies everywhere, and rating them out loud is normal among men like {who}.',
        she: 'Supermodels set an impossible standard and {who} is measured against it by men and other women; being thin is treated as being good.' },
    { ids: GAZE_M }),
    L('90s', 'seen', 'Looking', 'e90_gaze_f', 'Girl power', {
        she: 'Girl power and franker magazines make women\u2019s wanting louder: women talk openly about men\u2019s bodies and their own pleasure, and {who} doesn\u2019t pretend not to look.' },
    { ids: GAZE_F }),
    L('90s', 'body', 'Looks', 'e90_chic', 'Heroin chic', {
        any: 'Thin, pale and hollow-eyed is fashionable, sold in magazines as heroin chic. {who}\u2019s look reads as cool rather than ill, until it doesn\u2019t.' },
    { ids: ['heroin_chic', 'gaunt', 'hollow_eyed', 'party_wrecked'] }),
    L('90s', 'vices', 'Drugs', 'e90_e', 'Ecstasy', {
        any: 'Ecstasy is the drug of a generation and the papers run panics about deaths at clubs. Among {who}\u2019s crowd a pill on a Saturday is ordinary, and everyone knows someone who went too far.' },
    { ids: ['rolling', 'raver', 'party_scene_regular', 'coming_down'] }),
    L('90s', 'vices', 'Drugs', 'e90_skag', 'Heroin and crack', {
        any: 'Heroin and crack still wreck poorer streets, and users are treated as criminals first. Methadone and needle exchanges exist, but a user like {who} mostly meets the police before any help.' },
    { ids: ['on_heroin', 'on_crack', 'needs_a_fix', 'junkie', 'withdrawal', 'nodding_off'] }),
    L('90s', 'crime', 'The police', 'e90_police_uk', 'Cameras and DNA', {
        any: 'CCTV is going up on high streets and in shopping centres, the national DNA database starts in 1995, and a 1994 law lets police break up raves and stop people heading to them. A careful {who} wears a hood and keeps away from cameras.' },
    { place: 'uk', ids: [...CRIME, ...DEALING], group: 'police' }),
    L('90s', 'crime', 'The police', 'e90_police_us', 'Zero tolerance', {
        any: 'Zero-tolerance policing and stop-and-frisk in the big cities, three-strikes laws that can mean life, and crack still sentenced a hundred times harder than powder. A DNA database goes national in 1998. A dealer like {who} assumes any street stop could end in a search.' },
    { place: 'us', ids: [...CRIME, ...DEALING], group: 'police' }),
    L('90s', 'crime', 'The trade', 'e90_phones', 'Pagers and first mobiles', {
        any: 'Pagers give way to the first mobiles and pay-as-you-go phones. Police can trace and tap them, so careful dealers like {who} change numbers often and say as little as possible on any line.' },
    { ids: DEALING }),
    L('90s', 'scene', 'Cliques', 'e90_grunge', 'Grunge and slackers', {
        any: 'Not trying is cool: flannel, ripped jeans, unwashed hair and a shrug. {who}\u2019s look says they don\u2019t care, which older people read as lazy and dirty.' },
    { ids: ['grunge', 'skater', 'burnout', 'dressed_down'] }),
    L('90s', 'scene', 'Cliques', 'e90_hiphop', 'Gangsta rap', {
        any: 'Baggy jeans, gold and gangsta rap; politicians and preachers blame the music for violence, and police read {who}\u2019s look as gang before anything else.' },
    { place: 'us', ids: ['streetwear', 'street_code', 'street_smart', 'turf_minded'] }),
    L('90s', 'scene', 'Cliques', 'e90_rave', 'Rave', {
        any: 'Raves in fields and warehouses until police shut them down; dance music, whistles and pills. {who} belongs to a scene the papers call a menace.' },
    { place: 'uk', ids: ['raver', 'party_scene_regular', 'club_promoter'] }),
    L('90s', 'world', 'New things', 'e90_net', 'Going online', {
        any: 'Dial-up internet and chatrooms are new and a little strange; people panic about strangers met online. Someone at ease there like {who} is called a geek.' },
    { ids: ['hacker', 'nerdy', 'internet_cafe', 'dorky'] }),
    L('90s', 'home', 'Family', 'e90_single_mum', 'Single mothers', {
        she: 'Politicians and papers blame single mothers for crime and the welfare bill. {who} is judged by strangers, doctors and her own family.' },
    { ids: ['single_mother', 'teen_parent', 'unwed_mother', 'expecting'] }),
    L('90s', 'mind', 'Help', 'e90_prozac', 'Prozac', {
        any: 'Antidepressants are a household word now, and people joke about them. At work, though, {who} still keeps depression or anxiety quiet, because it marks you as unreliable.' },
    { ids: LOW }),
    L('90s', 'dating', 'Keeping in touch', 'e90_answerphone', 'Answerphones and pagers', {
        any: 'Messages wait on answering machines, and late in the decade on a first mobile. {who} can leave a message for {other} and spend the evening waiting to hear back.' },
    { when: ['romance'], w: 50 }),
    L('90s', 'name', 'Reputation', 'e90_slag', 'Sleeping around', {
        he: 'A man who sleeps around is a player, and other men are envious. {who} loses nothing by it.',
        she: 'A woman who sleeps around is a slag or a slut, whatever girl power says. {who} is judged for what a man would be cheered for.' },
    { ids: SLEEPS }),

    // ================= 2010s =================
    L('10s', 'dating', 'Keeping in touch', 'e10_phones', 'Always reachable', {
        any: 'Everyone has a smartphone. Read receipts, last-seen times and stories mean {who} and {other} can always see whether the other has been online, and silence is noticed and taken personally.' },
    { when: ['romance'], w: 55 }),
    L('10s', 'dating', 'Meeting people', 'e10_apps', 'Dating apps', {
        any: 'Swipe apps have made hook-ups easy to arrange and easy to drop; ghosting is normal. {who} is never far from someone new on a screen.' },
    { ids: ['newly_single', 'womaniser', 'chick_magnet', 'hedonistic', 'slutty', 'loose'] }),
    L('10s', 'queer', 'Read as queer', 'e10_too_soft', 'Soft boys', {
        he: 'Skincare, painted nails and soft looks are fashionable online, but in plenty of pubs, gyms and families a man like {who} still has his manhood questioned for it, and gay is still a common put-down.',
        she: 'Short hair, no make-up and no interest in men get a woman like {who} read as a lesbian; more people shrug, but she still gets asked about it by strangers.' },
    { when: ['againstType'], group: 'queer' }),
    L('10s', 'queer', 'Two of them together', 'e10_couple_us', 'Legal, not ordinary', {
        he: 'Gay marriage is legal nationwide from 2015 and most young people shrug at it, but in many towns, churches and families two men like {who} and {other} holding hands still stand out, and some men will say something.',
        she: 'Gay marriage is legal nationwide from 2015. Two women like {who} and {other} are accepted in cities and gossiped about in small towns, and men still treat it as something staged for them.' },
    { place: 'us', when: ['sameSex', 'romance'], group: 'queer', w: 85 }),
    L('10s', 'queer', 'Two of them together', 'e10_couple_uk', 'Legal, not ordinary', {
        he: 'Gay marriage is legal from 2014 and mostly accepted, but on football terraces, building sites and some estates two men like {who} and {other} still draw comments, and casual homophobia is laughed off as banter.',
        she: 'Gay marriage is legal from 2014. Two women like {who} and {other} draw less hostility than two men, and more men who think it\u2019s for them.' },
    { place: 'uk', when: ['sameSex', 'romance'], group: 'queer', w: 85 }),
    L('10s', 'queer', 'Hiding it', 'e10_closet', 'Still in the closet', {
        any: 'It\u2019s easier to be out than ever, so staying hidden like {who} now usually means a family, a job or a crowd that wouldn\u2019t take it: religion, sport, the street.' },
    { ids: CLOSET, group: 'queer_law' }),
    L('10s', 'seen', 'Looking', 'e10_gaze_m', 'Every phone a magazine', {
        he: 'Porn and filtered bodies are on every phone, and rating women in group chats is ordinary among men like {who}. After 2017, though, a leer or a pushy message can be screenshotted and posted, and men are newly careful about being seen to look.',
        she: '{who} is used to being rated: likes, comments and messages from strangers measure her looks every day, and she curates how she\u2019s seen.' },
    { ids: GAZE_M }),
    L('10s', 'seen', 'Looking', 'e10_gaze_f', 'Women thirsting', {
        she: 'Women talk openly about wanting men now, online and with friends; a man\u2019s body is fair game for comment, and {who} doesn\u2019t hide that she\u2019s looking.' },
    { ids: GAZE_F }),
    L('10s', 'name', 'Reputation', 'e10_metoo', 'Screenshots last forever', {
        any: 'After #MeToo, behaviour once laughed off can end a job or a reputation, and messages last forever. What {who} does to someone can come back on a screen years later.' },
    { ids: ['womaniser', 'sleazy', 'dirty_old_man', 'charming_predator', 'pervy_drunk', 'manipulator'] }),
    L('10s', 'power', 'Who leads', 'e10_lead', 'Girlbosses and alphas', {
        he: 'Hustle culture and self-styled alpha talk reward a man like {who} who takes charge, though people are quicker now to call it toxic.',
        she: 'Women in charge are celebrated in slogans and resented in practice. {who} is called inspiring by some and a nightmare by others for the same behaviour.' },
    { ids: LEAD }),
    L('10s', 'money', 'Money', 'e10_skint', 'Gig work and rent', {
        any: 'Zero-hours shifts, delivery apps, high rents and debt; owning a home is a fantasy for most young people. {who} lives month to month like a lot of people their age.' },
    { ids: POOR, world: true }),
    L('10s', 'body', 'Looks', 'e10_gym', 'Gym bodies and filters', {
        he: 'Gym culture, protein shakes and shirtless selfies set the bar; {who}\u2019s body is judged against it online and off.',
        she: 'Filters, curves and fitness accounts set the bar; {who}\u2019s body is commented on online by strangers and in person by friends.' },
    { ids: ['muscular', 'athletic', 'chubby', 'curvy', 'lanky', 'petite', 'hourglass_figure'], w: 50 }),
    L('10s', 'mind', 'Help', 'e10_mental', 'Talking about it', {
        he: 'Anxiety and depression are talked about openly online and therapy is more normal, but men like {who} are still slower to say it out loud or get help.',
        she: 'Anxiety and depression are talked about openly, therapy is normal and the words for it are everywhere. {who} has the language for what she feels, whether or not it helps.' },
    { ids: [...LOW, 'therapy_speak'] }),
    L('10s', 'vices', 'Drugs', 'e10_opioids', 'Pills to heroin to fentanyl', {
        any: 'The opioid wave: painkillers from doctors turn into street heroin, and by the decade\u2019s end fentanyl is cut into the supply and overdoses are everywhere. A user like {who} never quite knows what they\u2019re taking.' },
    { place: 'us', ids: ['on_heroin', 'on_painkillers', 'needs_a_fix', 'nodding_off', 'overdosing', 'withdrawal', 'junkie'] }),
    L('10s', 'vices', 'Drugs', 'e10_uk_drugs', 'Cheap coke and spice', {
        any: 'Cocaine is cheap and ordinary in pubs and toilets, nitrous canisters litter parks, and spice leaves people frozen in city centres. {who}\u2019s using barely raises an eyebrow in their crowd.' },
    { place: 'uk', ids: ['coked_up', 'high', 'laughing_gas', 'party_scene_regular', 'substance_abuser'] }),
    L('10s', 'vices', 'Drugs', 'e10_weed_us', 'Legal weed', {
        any: 'Cannabis becomes legal in more states from 2012, so in some places {who}\u2019s weed is bought in a shop and in others it\u2019s still an arrest; other drugs still carry heavy sentences everywhere.' },
    { place: 'us', ids: ['stoned', 'high'] }),
    L('10s', 'crime', 'The police', 'e10_police_uk', 'County lines', {
        any: 'Dealers run deal lines from the cities into small towns, using young runners and taking over vulnerable people\u2019s flats. Police treat the runners as victims and the bosses as traffickers under the 2015 slavery law, so someone like {who} running a line risks far more than a possession charge.' },
    { place: 'uk', ids: [...CRIME, ...DEALING], group: 'police' }),
    L('10s', 'crime', 'The police', 'e10_police_us', 'Phones and plates', {
        any: 'Police pull phone records and locations, use devices that pretend to be phone masts, read number plates automatically and wear body cameras. Since 2018 they need a warrant for location history, but {who}\u2019s own phone is still the best witness the police have.' },
    { place: 'us', ids: [...CRIME, ...DEALING], group: 'police' }),
    L('10s', 'crime', 'What the police have', 'e10_tech_uk', 'Cameras everywhere', {
        any: 'CCTV covers most streets, plate cameras log cars on main roads, and phones seized in an arrest are downloaded in full. A careful {who} uses burners, cash and a car in someone else\u2019s name.' },
    { place: 'uk', ids: [...CRIME, ...DEALING, ...COPS] }),
    L('10s', 'crime', 'The trade', 'e10_social', 'Menus on social media', {
        any: 'Dealers advertise on Snapchat and Instagram with emoji menus and disappearing messages, and still keep a cheap burner for the line. Customers expect {who} to answer fast and deliver like a takeaway.' },
    { ids: DEALING }),
    L('10s', 'scene', 'Cliques', 'e10_drill_uk', 'Drill', {
        any: 'Drill music and its videos are treated by police and courts as evidence of gang life; lyrics and a video can be read out at a trial. {who}\u2019s crowd and look draw attention before anything is done.' },
    { place: 'uk', ids: ['streetwear', 'street_code', 'turf_minded', 'no_snitching'] }),
    L('10s', 'scene', 'Cliques', 'e10_gangs_us', 'Gang databases', {
        any: 'Police gang databases list people for the clothes they wear, the friends they keep or a photo online, often without them knowing. Being on one follows {who} into every stop.' },
    { place: 'us', ids: ['streetwear', 'street_code', 'turf_minded', 'no_snitching', 'tattooed'] }),
    L('10s', 'scene', 'Cliques', 'e10_scenes', 'Online tribes', {
        any: 'Style tribes live online now: hipsters, scene kids, hypebeasts and tumblr girls. {who}\u2019s look says which feeds they live on, and people judge them by it.' },
    { ids: ['hipster', 'scene_kid', 'tumblr_girl', 'indie_sleaze', 'emo', 'streetwear', 'alt'] }),
    L('10s', 'name', 'Reputation', 'e10_slag', 'Body count', {
        he: 'A man who sleeps around is a player and mostly envied. {who} loses little by it.',
        she: 'Women are told to own their sex lives, yet {who} is still judged for a number a man would brag about, and nudes she sent can be shared without her say.' },
    { ids: SLEEPS }),

    // ================= 2020s =================
    L('20s', 'crime', 'The police', 'e20_encro', 'Nothing is safe to type', {
        any: 'After police secretly read the EncroChat and Sky ECC phones in 2020 and 2021, thousands were convicted on their own messages. Nobody in {who}\u2019s world fully trusts any app, and the careful ones say the real things face to face.' },
    { ids: [...CRIME, ...DEALING], group: 'police_tech' }),
    L('20s', 'crime', 'The police', 'e20_police_uk', 'Lines and faces', {
        any: 'Police shut down deal lines by the hundred, cameras read faces in some city centres, and every arrest means a phone download. A dealer like {who} runs on burners, cash, runners and silence.' },
    { place: 'uk', ids: [...CRIME, ...DEALING], group: 'police' }),
    L('20s', 'crime', 'The police', 'e20_police_us', 'Every street watched', {
        any: 'Doorbell cameras on every porch, plate readers on main roads, phone location requests and social media searches. Police rarely need an informant to put {who} at a scene now; a phone or a camera usually does it.' },
    { place: 'us', ids: [...CRIME, ...DEALING], group: 'police' }),
    L('20s', 'vices', 'Drugs', 'e20_fent', 'Fentanyl', {
        any: 'Fentanyl is in pressed pills and much of the street supply; a counterfeit pill can kill. Users carry naloxone, dealers like {who} can be charged over a death, and everyone has lost someone.' },
    { place: 'us', ids: ['on_heroin', 'on_painkillers', 'needs_a_fix', 'nodding_off', 'overdosing', 'withdrawal', 'junkie', ...DEALING] }),
    L('20s', 'vices', 'Drugs', 'e20_uk_drugs', 'Ket and coke', {
        any: 'Cocaine is everywhere from pubs to offices, ketamine is the young crowd\u2019s drug, and synthetic opioids are turning up in the heroin supply. {who}\u2019s using is ordinary in their circle and deadly at the edges.' },
    { place: 'uk', ids: ['coked_up', 'k_holed', 'high', 'on_heroin', 'party_scene_regular', 'substance_abuser'] }),
    L('20s', 'crime', 'The trade', 'e20_apps', 'Delivery dealing', {
        any: 'Drugs are ordered like takeaway on Telegram and Snapchat, with menus, deals and drop-offs. {who}\u2019s customers expect speed, and every message is a risk.' },
    { ids: DEALING }),
    L('20s', 'queer', 'Two of them together', 'e20_couple', 'Ordinary, mostly', {
        he: 'For most younger people two men like {who} and {other} together are ordinary, but there\u2019s been a backlash, and in some towns, families and crowds they still get stares and comments.',
        she: 'For most younger people two women like {who} and {other} together are ordinary; men treating it as a show for them haven\u2019t gone away.' },
    { when: ['sameSex', 'romance'], group: 'queer', w: 80 }),
    L('20s', 'queer', 'Read as queer', 'e20_too_soft', 'Pearls and nail polish', {
        he: 'Men in pearls and nail polish are on red carpets and all over social media, yet a soft man like {who} can still be mocked by the wrong crowd, and some young men push back against it hard.',
        she: 'A masculine woman like {who} gets read as queer quickly, and more people think nothing of it.' },
    { when: ['againstType'], group: 'queer' }),
    L('20s', 'queer', 'Hiding it', 'e20_closet', 'Still hiding', {
        any: 'Being out is easier than ever for most, so staying hidden like {who} usually means a family, faith or world that wouldn\u2019t accept it, or a reputation that depends on seeming straight.' },
    { ids: CLOSET, group: 'queer_law' }),
    L('20s', 'seen', 'Looking', 'e20_gaze_m', 'Filmed looking', {
        he: 'Porn and paid content are a tap away, and young men are fed influencers who sell dominance over women. But a leer can be filmed and posted in seconds, and {who} knows any woman might be recording.',
        she: '{who} is looked at through a phone as much as in person; her looks are rated, clipped and shared, and she controls what she can of her image.' },
    { ids: GAZE_M }),
    L('20s', 'seen', 'Looking', 'e20_gaze_f', 'Women looking', {
        she: 'Women rank and thirst over men openly, from book boyfriends to strangers online; {who} judges a man\u2019s body as freely as hers is judged.' },
    { ids: GAZE_F }),
    L('20s', 'seen', 'What men and women are meant to be', 'e20_manosphere', 'The manosphere', {
        he: 'Online influencers sell young men a world of alphas, high-value men and women who can\u2019t be trusted. {who}\u2019s views have a ready audience online and draw instant pile-ons too.',
        she: 'Online influencers sell women soft-life and trad-wife fantasies on one feed and girlboss advice on the next. {who}\u2019s choices get judged from both sides.' },
    { ids: ['misogynist', 'chauvinist', 'anti_feminist', 'judgemental_misogyny', 'traditional', 'misandrist'] }),
    L('20s', 'dating', 'Meeting people', 'e20_situationship', 'Situationships', {
        any: 'Dating apps feel tired, labels are avoided and situationships drag on. Between {who} and {other}, what they are to each other may never be said out loud.' },
    { when: ['romance'], w: 50 }),
    L('20s', 'mind', 'Help', 'e20_therapy', 'Therapy words', {
        any: 'Words like trauma, narcissist, gaslighting and red flags are used about everything. {who} is easily labelled, and can label others back.' },
    { ids: [...LOW, 'therapy_speak', 'manipulator', 'gaslighting'] }),
    L('20s', 'money', 'Money', 'e20_skint', 'Cost of living', {
        any: 'Prices and rents have jumped, and many people work two jobs or move back in with family. {who}\u2019s money worries are shared by nearly everyone they know.' },
    { ids: POOR, world: true }),
    L('20s', 'money', 'Money', 'e20_flex', 'Flexing', {
        any: 'Designer clothes, watches and cars are shown off online, real or rented. What {who} owns is judged in a scroll, and so is how they got it.' },
    { ids: RICH, world: true }),
    L('20s', 'name', 'Reputation', 'e20_clip', 'Going viral', {
        any: 'One clip can make {who} briefly famous or permanently hated; strangers dig up old posts within hours.' },
    { ids: ['controversial', 'notorious', 'politically_incorrect', 'fame', 'disgraced'] }),
    L('20s', 'body', 'Looks', 'e20_looks', 'Looksmaxxing and jabs', {
        he: 'Young men talk openly about jawlines, height and looksmaxxing, and {who} is judged against a gym-and-filter standard.',
        she: 'Weight-loss jabs, fillers and filters set the bar, and {who}\u2019s face and body are compared to edited ones every day.' },
    { ids: ['muscular', 'athletic', 'chubby', 'curvy', 'lanky', 'petite', 'beautiful', 'handsome', 'ugly'], w: 50 }),
    L('20s', 'world', 'Recent past', 'e20_covid', 'After lockdown', {
        any: 'Lockdowns are in recent memory: lost years, people who got used to staying in, and a jumpiness about crowds and coughing. {who} came out of it changed in some way.' },
    { ids: ['social_anxiety', 'introverted', 'isolated'], w: 45 }),
    L('20s', 'scene', 'Cliques', 'e20_scenes', 'Feeds and aesthetics', {
        any: 'Style tribes change every few months on TikTok, and old looks come back as aesthetics. {who}\u2019s style is read as a statement about which corner of the internet they live in.' },
    { ids: ['alt', 'y2k', 'cottagecore', 'streetwear', 'goth', 'emo', 'indie_sleaze', 'kawaii'] }),
    L('20s', 'power', 'Who leads', 'e20_lead', 'Taking charge', {
        he: 'A man like {who} who takes charge is admired by some and called controlling by others, and he hears both.',
        she: 'A woman like {who} who takes charge is a boss to some and difficult to others, and she\u2019s used to both.' },
    { ids: LEAD }),
];
