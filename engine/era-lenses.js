// The period, said plainly, and what it does to the things that are switched on. Opus 5.5 does better with
// one clear instruction ("Set in 1960s America") and a short line than with a long list of period props. A
// lens is one line about how the period shapes something already in play (power, medicine, queer desire,
// secret kinks, sex and reputation, money and work), and only shows when that thing is on. Gender comes from
// the Pronouns picker on the Bonds tab: he is a man, she is a woman. Pure data and functions (it reads the mood
// families from the catalogue); app/note.js decides what's on and engine/prompt.js places the lines.

import { MOODS } from '../data/catalogue.js';
const MOOD_CAT = new Map(MOODS.map(m => [m.id, m.category]));

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
    bars: { label: 'Bars',
        mw: '{woman} at a bar without a man is assumed to be working; some bars won’t serve a woman alone, and {man} is expected to buy her drinks',
        any: 'bars are a man’s world: some won’t serve a woman alone, and queer bars get raided with names printed in the paper' },
    rooms: { label: 'Hotel rooms',
        mw: 'checking in, {man} signs Mr and Mrs, and a clerk may ask to see a licence or send up the house detective',
        any: 'hotels ask questions: unmarried couples sign false names and house detectives knock' },
    diner: { label: 'The diner',
        any: 'the all-night diner is the one place anyone can sit: truckers, cops, insomniacs and girls with nowhere else to go, coffee refilled for a dime' },
    office: { label: 'The office',
        mw: 'at work {man} has the door and the desk and {woman} the typewriter outside it; passes, pats and dates with the boss come with a girl’s job',
        any: 'offices run on men in suits, women in the typing pool, cigarette smoke and three-martini lunches' },
    mourning: { label: 'Mourning',
        any: 'death has strict form: the body laid out at the funeral home or the front parlour, black for weeks, casseroles from neighbours and whispers about the will' },
    nowhere: { label: 'Out of reach',
        any: 'out here help is far: a party line the neighbours listen in on, a sheriff who knows every family, and miles of dark road' },
    dining: { label: 'Dining out',
        mw: '{man} orders for {woman}, tastes the wine and pays; her menu may not even show the prices',
        any: 'fine restaurants want jacket and tie and a man to pay; a lady’s menu has no prices on it' },
    public: { label: 'In public',
        mw: 'in public {man} and {woman} keep to an arm or a hand at most; a kiss on the street draws looks, and more draws the police',
        any: 'in public affection stays chaste; anything more risks a public decency charge' },
    police: { label: 'The police',
        any: 'police work rough: no warning of rights until 1966, confessions beaten out in back rooms, and a woman questioned alone by men with no matron present' },
    night: { label: 'After dark',
        mw: '{woman} out after midnight is assumed to be up to no good; {man} out late is just out',
        any: 'after midnight the town shuts; a decent woman isn’t out, and anyone who is gets asked why' },
    beach: { label: 'The beach',
        mw: '{woman} in a bikini is a talking point and {man} watching her is just a man at the beach',
        any: 'bikinis are new and still scandalous; most women wear one-pieces and the boardwalk watches' },
};
// The same trait reads differently on a man and a woman in 1950s–60s America. One line per person and
// lens, when that person has one of these (or any feeling in one of the families in `cats`) at clear or above.
// {who} is their name; he / she is from the Pronouns picker, so it works whichever of them it is. Someone
// set to they gets none. Like the rest, these join the rotation under the lines-per-reply cap.
const PEOPLE = [
    { key: 'leads', label: 'Taking charge', ids: ['demanding', 'commanding', 'taking_charge', 'controlling', 'assertive', 'in_control', 'dominant', 'boss'],
        he: '{who} taking charge is simply what a man is for; nobody questions it, which makes it easy to go too far without anyone saying so',
        she: '{who} giving orders gets her called bossy or a battle-axe; men obey and resent it, or find it thrilling and would never admit it' },
    { key: 'yields', label: 'Giving way', ids: ['fawning', 'submissive', 'obedient', 'people_pleaser', 'soft'],
        he: 'a man who gives way to a woman, as {who} does, is called henpecked by other men, so he does it in private and shrugs it off in public',
        she: '{who} deferring is what a good girl is praised for, and nobody stops to ask whether she means it' },
    { key: 'brat', label: 'Sass', ids: ['sassy', 'bratty_defiance', 'spoiled_brat', 'princess'],
        he: '{who} mouthing off is a boy who never grew up; charming in a bar, trouble at work',
        she: '{who}’s sass is cute in a girl and a problem in a wife: men laugh at it, then expect it to stop at the altar' },
    { key: 'ambition', label: 'Ambition', ids: ['ambitious', 'workaholic', 'cunning'],
        he: '{who}’s ambition is a man’s duty: long hours, the right handshake, a wife who entertains the boss',
        she: '{who} wanting a career is tolerated until she marries; after that she’s meant to quit, and one who doesn’t is pitied or suspected' },
    { key: 'drink', label: 'Drinking', ids: ['hazy_drunk', 'drunk', 'alcoholic', 'tipsy', 'blackout_drunk', 'weepy_drunk'],
        he: '{who} drinking hard is one of the boys, right up until it costs him his job or his licence',
        she: 'ladies sip; {who} seen drunk loses her good name, and a woman who drinks alone is talked about at church' },
    { key: 'anger', label: 'Temper', cats: ['angry'], ids: ['hot_headed'],
        he: '{who}’s temper is a man’s prerogative: slammed doors and raised voices are how husbands and fathers are',
        she: '{who}’s anger gets called nerves or that time of the month, and a doctor may write her something to calm her down' },
    { key: 'tears', label: 'Tears', cats: ['sad'], ids: ['teary', 'crying_alone'],
        he: 'men don’t cry, so {who}’s grief goes into drink, work or silence, and showing it would shame him',
        she: '{who}’s tears are expected and dismissed in the same breath: she’s just emotional' },
    { key: 'wanting', label: 'Wanting it', cats: ['desire'], ids: ['horny', 'flirty', 'slutty', 'loose', 'swaggering_flirt', 'seductive_act', 'provocative'],
        he: '{who} chasing women gets a wink and a slap on the back; what he wants is just a man’s nature',
        she: '{who} wanting it openly makes her a tramp: it can cost her a job, her family’s welcome and any decent marriage' },
    { key: 'alone', label: 'On their own', ids: ['independent', 'hyper_independent', 'lone_wolf', 'widowed', 'newly_single'],
        he: 'a man alone like {who} is a free bachelor, or a little suspect once he’s past thirty-five',
        she: 'a woman alone like {who} is pitied as an old maid or watched as a divorcee; landlords, banks and neighbours all want to know where her man is' },
    { key: 'brains', label: 'Brains', ids: ['genius', 'bookish', 'nerdy'],
        he: '{who}’s brains are an asset: a degree, a profession, a man people consult',
        she: '{who}’s brains are something to hide on a date; girls are told not to seem smarter than the man' },
    { key: 'cold', label: 'Coldness', cats: ['cold'], ids: ['emotionless', 'stoic', 'cold_blooded'],
        he: '{who}’s coldness reads as strength and self-control, the way a man is supposed to be',
        she: '{who}’s coldness makes her frigid or unwomanly in other people’s eyes: a cold fish, a career girl, a shrew' },
    { key: 'looks', label: 'Looks', ids: ['vain', 'glamouring', 'preening'],
        he: 'a man too careful of his looks, like {who}, gets called a dandy, or something worse said lower',
        she: '{who}’s looks are her currency and her duty, checked by every woman she meets and every man who passes' },
    { key: 'crude', label: 'Crude talk', ids: ['crude', 'vulgar', 'trashy'],
        he: '{who}’s crude talk is fine among men and gets bitten back around ladies',
        she: '{who} swearing shocks the room: nice women aren’t meant to know those words' },
    { key: 'care', label: 'Caring', cats: ['closeness'], ids: ['protective', 'protector_role'],
        he: '{who} tending someone is unusual enough to be noticed: doctors and soldiers may, husbands seldom do',
        she: '{who} caring for others is simply expected of a woman, so nobody thanks her for it' },
    { key: 'violence', label: 'Violence', cats: ['cruel'], ids: ['sadistic_personality', 'bloodthirsty', 'murderous'],
        he: '{who}’s violence is easily excused: a man keeping his house in order or settling a score',
        she: 'nobody believes a woman like {who} could be violent, which is its own kind of cover' },
    { key: 'rebel', label: 'Rebelling', ids: ['rebellious', 'anti_authoritarian', 'feminist', 'reckless', 'thrill_seeker'],
        he: '{who} kicking against the rules is a rebel without a cause: a phase, a leather jacket, a warning to other parents',
        she: '{who} breaking the rules is a girl going bad: people worry about her reputation before her safety' },
    { key: 'faith', label: 'Faith', ids: ['devout', 'guilty_lust', 'ashamed'],
        he: '{who}’s sins are a man’s to confess and be forgiven',
        she: '{who}’s sins stick to her: the priest forgives, the parish doesn’t' },
    { key: 'nerves', label: 'Nerves', cats: ['scared'], ids: ['hysterical', 'nervous_wreck'],
        he: '{who} cracking under nerves is a weakness he has to hide; they called it shell shock in the war and stopped asking',
        she: '{who}’s nerves get her a prescription, a rest cure or a husband’s signature on a form' },
    { key: 'pride', label: 'Pride', ids: ['proud', 'confident', 'cocky'],
        he: '{who}’s pride is respected, even admired, so long as he can back it up',
        she: '{who} being proud of herself is called stuck-up; a woman is meant to wait to be praised' },
    { key: 'jealousy', label: 'Jealousy', ids: ['jealous', 'possessive'],
        he: '{who}’s jealousy passes for love: a man protecting what’s his, and the law tends to agree',
        she: '{who}’s jealousy is a nag’s or a madwoman’s; her husband’s friends make jokes about it' },
    { key: 'money', label: 'Money', ids: ['wealth', 'poor', 'pampered'],
        he: '{who}’s money, or lack of it, is his measure as a man and a provider',
        she: '{who}’s money is really her father’s or her husband’s; a woman can’t easily get credit, a loan or a lease in her own name' },
    { key: 'job', label: 'Work', ids: ['doctor', 'surgeon', 'lawyer', 'psychiatrist', 'scientist', 'teacher', 'assistant', 'artist', 'musician'],
        he: '{who}’s profession is his rank: people stand when he enters, defer to his word and use his title',
        she: 'a working woman like {who} is in a few allowed jobs, nurse, teacher or secretary; anything higher, people test and doubt her at every turn' },
    // Body and health: facts on the Facts tab and the character's needs (need: one that has run low).
    { key: 'hurt', label: 'Getting hurt', ids: ['injured', 'bleeding', 'bruised', 'concussed', 'burned', 'sore', 'bitten'],
        he: '{who} hurt is told to walk it off; a man who sees a doctor for less than a broken bone is soft, and an emergency room asks few questions about a fight',
        she: 'a woman who turns up bruised like {who} is asked if she fell; doctors and police treat a husband’s hand as a family matter and send her home' },
    { key: 'sick', label: 'Being ill', ids: ['sick', 'weak', 'sickly', 'feverish', 'chronically_ill', 'terminally_ill', 'headache', 'deteriorating'], need: 'health',
        he: '{who} sick still goes to work; a man in bed past a day is malingering, and a wife or mother is expected to nurse him',
        she: '{who} ill still has a house to run, and doctors are quick to call a woman’s symptoms nerves and slow to look further' },
    { key: 'monthly', label: 'Her monthly', ids: ['on_period', 'ovulating'],
        she: '{who}’s monthly is never named aloud: pads bought at the counter with eyes down, girls told not to swim or wash their hair, and men who believe it makes a woman unfit to decide anything' },
    { key: 'marked', label: 'Scars and ink', ids: ['scarred', 'tattooed'],
        he: '{who}’s scars or ink mark him as a veteran, a sailor or a convict, and people quietly guess which',
        she: 'a woman with scars or a tattoo, like {who}, is unheard of in polite company; people assume carnival, prison or a sailor’s girl' },
    { key: 'figure', label: 'Figure', ids: ['petite', 'curvy', 'chubby', 'muscular', 'athletic', 'statuesque', 'gaunt'],
        he: '{who}’s build is how other men size him up: big means capable, slight means picked on',
        she: '{who}’s figure is discussed openly, by men on the street and women at the bridge table; girdles and diet pills exist to fix any part of it' },
    { key: 'beauty', label: 'Good looks', ids: ['beautiful', 'sexy', 'striking', 'handsome', 'cute', 'doe_eyed'],
        he: 'a handsome man like {who} is trusted faster and forgiven more, and women must chase him without seeming to',
        she: '{who}’s beauty opens doors and invites hands, and she is blamed for the looks she draws and for what men do about them' },
    { key: 'plain', label: 'Plain looks', ids: ['average_looks', 'ugly', 'hollow_eyed'],
        he: 'a plain man like {who} makes up for it with a steady job and a good suit',
        she: 'a plain woman like {who} is told to make the best of herself and be grateful for any proposal' },
    { key: 'grime', label: 'Grime', ids: ['dirty', 'sweaty', 'messy', 'unkempt', 'party_wrecked'], need: 'hygiene',
        he: '{who} rough and dirty is a working man’s honest grime',
        she: '{who} seen unwashed or a mess is a slattern; a woman is never meant to be caught without her face on' },
    { key: 'worn', label: 'Running on empty', ids: ['tired', 'exhausted_to_the_bone', 'sleep_deprived', 'run_down', 'dragging'], need: 'energy',
        he: '{who} running on no sleep takes a pep pill from the truck stop or the medicine cabinet; Benzedrine and coffee keep men going through shifts and long drives',
        she: '{who} worn out gets a doctor’s little something, Dexamyl to get going and Miltown to calm down, and nobody calls it a habit' },
    { key: 'hungry', label: 'Hunger', ids: ['hungry', 'hangry'], need: 'hunger',
        he: '{who} hungry expects a plate put in front of him; a man cooking for himself is a bachelor or a widower',
        she: '{who} hungry still eats like a lady in company, little and slowly, and minds her figure' },
    { key: 'pills', label: 'Pills', ids: ['medicated', 'sedated', 'on_benzos', 'self_medicating', 'functional_addict'],
        he: '{who}’s pills are doctor’s orders and nothing to be ashamed of, so long as nobody calls them a habit',
        she: '{who} is one of thousands of wives on mother’s little helpers; the doctor may give the bottle to her husband' },
    { key: 'drugs', label: 'Drugs', ids: ['high', 'stoned', 'coked_up', 'tripping', 'junkie', 'withdrawal', 'substance_abuser', 'strung_out'],
        he: '{who} on drugs is a beatnik, a jazzman or a dope fiend in the papers; one arrest for reefer can mean years inside',
        she: 'a woman on drugs like {who} is the fallen girl of every pulp novel; police, parents and doctors see her as ruined or to be locked away' },
    { key: 'hangover', label: 'The morning after', ids: ['hungover'],
        he: '{who} hungover is a joke at the office and a raw egg in tomato juice',
        she: '{who} hungover hides it under powder; a lady doesn’t have mornings like this' },
    { key: 'smoke', label: 'Smoking', ids: ['smoker'],
        he: '{who} smoking is as ordinary as breathing: doctors appear in cigarette ads and everyone lights up indoors',
        she: '{who} smoking is modern and a little daring, and the ads promise it keeps a girl slim' },
    { key: 'madness', label: 'Madness', ids: ['hallucinating', 'dissociating', 'broken_mind', 'delusional', 'split_identity', 'manic', 'unhinged'],
        he: '{who} seeing or saying strange things can get him committed on a relative’s or doctor’s signature, and shock treatment is routine',
        she: '{who} seeing or saying strange things can get her committed on her husband’s or father’s signature, and shock treatment or worse is routine' },
    { key: 'low', label: 'Low spells', ids: ['depressed', 'despairing', 'hollowed_out', 'melancholic', 'blue_mood', 'empty'],
        he: '{who}’s depression has no name he’d use; a man who can’t get out of bed is lazy or drinking',
        she: '{who}’s low spells get called the blues or nerves; a doctor offers pills or a rest and tells her to count her blessings' },
    { key: 'odd', label: 'Not fitting', ids: ['autistic', 'adhd', 'sensory_avoidant', 'sensory_seeking', 'quirky', 'lovable_weirdo'],
        he: 'a man like {who} who doesn’t fit is called odd or a genius; a harder family has him sent away',
        she: 'a girl like {who} who doesn’t fit is called strange or a problem, and someone may call in a psychiatrist' },
    { key: 'grief', label: 'Grief', ids: ['grieving', 'bereaved', 'numb_grief', 'complicated_grief', 'mourning_the_relationship', 'old_grief'],
        he: '{who} grieves in silence: a drink, the funeral, and back at work by Monday',
        she: '{who} is expected to wear black and show grief, but not too much, and to keep feeding everyone who calls' },
    { key: 'scarred_mind', label: 'Old wounds', ids: ['traumatised', 'survivors_guilt', 'memory_gaps', 'survival_habits'],
        he: '{who}’s old wounds have a war name, battle fatigue, and the advice is to stop dwelling on it',
        she: '{who}’s old wounds have no name at all; whatever happened to her, she is told to put it behind her and not upset anyone' },
    // Background, work and standing (the Facts tab).
    { key: 'served', label: 'Service', ids: ['ex_military', 'trained_killer'],
        he: '{who} came back from the war or Korea with the GI Bill, a trade, and things he won’t talk about',
        she: 'a woman who served like {who}, a WAC or a Navy nurse, is half admired and half suspected of being unwomanly' },
    { key: 'record', label: 'A record', ids: ['ex_convict', 'crime_family', 'wanted', 'suspected', 'known_dealer', 'escaped_justice'],
        he: 'a man with a record like {who} can’t get a decent job or a loan, and the local police know his face',
        she: 'a woman with a record like {who} is assumed to be a prostitute or a gangster’s moll, whatever she actually did' },
    { key: 'churched', label: 'Church upbringing', ids: ['raised_religious', 'puritanical', 'traditional'],
        he: '{who}’s upbringing says a man leads the family in prayer and keeps his urges for his wife',
        she: '{who}’s upbringing says a girl keeps her knees together, her head covered in church and her opinions to herself' },
    { key: 'orphan', label: 'No family', ids: ['orphaned', 'foster_kid', 'abusive_parents', 'neglectful_parents'],
        he: 'a boy raised like {who} went to the state or to a farm that wanted another pair of hands',
        she: 'a girl raised like {who} went to a home, or to a family that wanted help in the house and got it' },
    { key: 'abroad', label: 'Foreign', ids: ['from_abroad'],
        he: '{who}’s accent makes people ask where he’s from and decide if he’s a refugee, a war bride’s husband or a Red',
        she: '{who}’s accent makes her exotic to men and suspect to their wives' },
    { key: 'letters', label: 'Reading', ids: ['illiterate'],
        he: '{who} not reading is hidden behind forgotten glasses and a signed X; plenty of working men left school at fourteen',
        she: '{who} not reading is hidden carefully, and a woman who can’t is assumed simple' },
    { key: 'selling', label: 'Selling it', ids: ['stripper', 'escort'],
        he: 'a man who sells himself like {who} works the shadows of bus stations and bars, and the law calls him a deviant',
        she: '{who}’s work makes her a criminal to police, a joke to customers and unmarriageable to everyone else' },
    { key: 'trade', label: 'A trade', ids: ['mechanic', 'chef', 'tattoo_artist', 'mortician'],
        he: '{who} working with his hands is honest work and something he’s proud of',
        she: 'a woman in a man’s trade like {who} gets laughed at, then tested, then grudgingly called one of the boys' },
    { key: 'serving', label: 'Serving tables', ids: ['hospitality'],
        he: '{who} waiting on people is a step on the way to something else, or so he says',
        she: '{who} waiting tables lives on tips, a paper hat and putting up with hands' },
    { key: 'college', label: 'College', ids: ['student'],
        he: 'a college man like {who} is on his way up and dodging the draft board',
        she: '{who} at college is said to be there for her Mrs. degree' },
    { key: 'dealing', label: 'Dealing', ids: ['drug_dealer'], ties: ['deals_to'],
        he: '{who} dealing is a hoodlum to the papers and a federal case if he’s caught',
        she: 'nobody suspects a woman like {who} of dealing, which is exactly why it works' },
    { key: 'wed', label: 'Married', ids: ['married_status', 'engaged_status'],
        he: '{who} married is settled and trusted, a man with a family to support',
        she: '{who} married takes his name, his address and his credit, and signs little without him' },
    { key: 'famous', label: 'In the papers', ids: ['fame', 'notorious', 'controversial', 'powerful'],
        he: '{who}’s name in the papers is a reputation to trade on',
        she: '{who}’s name in the papers is a scandal waiting to happen; the gossip columns own her' },
    { key: 'hidden', label: 'A secret life', ids: ['secret_past', 'secret_lifestyle', 'blackmailed', 'under_observation'],
        he: '{who}’s secret life is safer behind a wedding ring and a church pew',
        she: '{who}’s secret, if it comes out, ends her; a woman doesn’t get a second reputation' },
    { key: 'missing', label: 'Missing', ids: ['missing', 'captive', 'presumed_dead'],
        he: 'a missing man like {who} is assumed to have walked out on his life',
        she: 'a missing woman like {who} is assumed to have run off with someone, and the police wait days to look' },
    // The bedroom and how they think about sex (Intimacy tab).
    { key: 'yields_bed', label: 'Giving herself over', ids: ['soft_sub', 'submissive', 'bottom', 'obedient', 'service_submissive', 'little_girl', 'pillow_princess'],
        she: '{who} giving herself over in bed is what she was raised to think sex is, which makes choosing it hard to tell from duty' },
    { key: 'leads_bed', label: 'Taking her', ids: ['dominant', 'top', 'master', 'daddy', 'gentle_dominant', 'pleasure_dom', 'ravishing'],
        he: '{who} taking charge in bed is what most think a husband is for, so few ask what the woman wants' },
    { key: 'holding_back', label: 'Holding back', ids: ['repressed', 'late_bloomer', 'sexual_shame', 'vanilla', 'intimacy_performance_anxiety'],
        he: '{who} holding back is a man saving it for the right girl, or one people start to wonder about',
        she: '{who} holding back is a good girl; the same thing in a wife gets called frigid' },
    { key: 'tastes', label: 'Particular tastes', ids: ['perverted', 'deviant', 'fetishistic', 'dirty_minded', 'covert_pervert', 'artistic_pervert'],
        he: '{who}’s tastes are a perversion in law and medicine; they live in mail-order catalogues, and one found could cost him his job',
        she: '{who} having tastes like that is unthinkable to most; men assume someone taught her, and a psychiatrist would call her sick' },
    { key: 'innocence', label: 'Inexperience', ids: ['innocent', 'sheltered', 'first_time'],
        he: 'a man like {who} without experience lies about it to his buddies',
        she: '{who}’s innocence is prized and policed: her father, her church and her date’s friends all keep score' },
    { key: 'two_kinds', label: 'Two kinds of women', ids: ['madonna_whore', 'sinful_desire'],
        he: '{who} splitting women into nice girls and the other kind is how most men his age were raised to think',
        she: '{who} knows there are two kinds of women and which kind she has to seem to be' },
    // What they believe and how they come across.
    { key: 'old_views', label: 'A woman’s place', ids: ['anti_feminist', 'chauvinist', 'misogynist', 'judgemental_misogyny'],
        he: '{who}’s views on women are mainstream; most men and plenty of women say the same over dinner',
        she: '{who} defending a woman’s place is praised at church and by her husband’s friends' },
    { key: 'provider', label: 'Family first', ids: ['family_first', 'provider_pride', 'dutiful'],
        he: '{who} providing is the measure of a man; a wife who has to work shames him',
        she: '{who} putting family first is what every magazine says a woman lives for' },
    { key: 'jaded', label: 'Disillusion', ids: ['cynical', 'jaded', 'nihilistic', 'disenchanted'],
        he: '{who}’s cynicism suits the man in the grey flannel suit who stopped believing in any of it',
        she: '{who}’s cynicism is unbecoming; a woman is meant to stay hopeful and pretty' },
    { key: 'speaks_mind', label: 'Speaking out', ids: ['stubborn', 'argumentative', 'blunt', 'contrarian', 'straightforward', 'honest'],
        he: '{who} speaking his mind is a straight shooter',
        she: '{who} speaking her mind is opinionated, a nag or a shrew' },
    { key: 'greed', label: 'Wanting more', ids: ['greedy', 'materialistic', 'gold_digger', 'opportunistic', 'status_obsessed'],
        he: '{who} chasing money and status is a go-getter',
        she: '{who} chasing money and status is a gold digger, whatever she does to earn it' },
    { key: 'sacrifice', label: 'Sacrifice', ids: ['selfless', 'self_sacrificing', 'loyal', 'loyal_to_a_fault', 'martyr_complex'],
        he: '{who}’s duty runs to his country, his company and his family, and a man is thanked for it',
        she: '{who}’s sacrifice is just what women do, and nobody keeps score of it' },
    { key: 'idle', label: 'Idleness', ids: ['lazy', 'careless', 'mooch'], need: 'fun',
        he: '{who} idle is a bum, or a rich man’s son',
        she: '{who} idle is a bad housekeeper, which the neighbours can see from the street' },
    { key: 'appetite', label: 'Appetite', ids: ['gluttonous', 'sweet_tooth'],
        he: '{who}’s appetite is a man’s healthy one',
        she: '{who}’s appetite is watched: dieting is a woman’s duty, and a second helping gets remarked on' },
    { key: 'quiet', label: 'Quiet ones', ids: ['introverted', 'wallflower', 'shy', 'cant_say_it', 'clammed_up'],
        he: 'a quiet man like {who} is steady and reliable',
        she: 'a quiet girl like {who} is a wallflower someone ought to bring out' },
    { key: 'loud', label: 'Life of the party', ids: ['extroverted', 'life_of_party', 'bubbly', 'charismatic', 'party_mode', 'party_animal'],
        he: '{who} working the room is good for business',
        she: '{who} being the life of the party is fun until it’s too much, and then she’s loud' },
    { key: 'scatter', label: 'Scatterbrained', ids: ['ditsy', 'gullible', 'oblivious', 'clumsy', 'head_in_clouds'],
        he: '{who} being slow or scattered makes him a fool',
        she: '{who} being scatterbrained is called cute, even expected, and it can be a useful cover' },
    { key: 'exacting', label: 'Exacting', ids: ['control_freak', 'perfectionist', 'fastidious', 'methodical', 'disciplined', 'ocd'],
        he: '{who} exacting is a good officer or a fine surgeon',
        she: '{who} exacting is a fussy housewife or a dragon of a secretary' },
    { key: 'scheming', label: 'Scheming', ids: ['secretive', 'compulsive_liar', 'two_faced', 'manipulator', 'manipulative', 'lying'],
        he: '{who}’s secrets are his own business',
        she: '{who}’s secrets make her scheming, and any lie she’s caught in proves what people thought of women all along' },
    { key: 'mannish', label: 'Mannish', ids: ['masculine', 'tactical', 'biker', 'swagger'],
        he: '{who}’s hard edges are just what a man should have',
        she: '{who}’s mannish ways get her called a tomboy at best, and worse behind her back' },
    { key: 'soft_ways', label: 'Soft ways', ids: ['feminine', 'girlish', 'prissy', 'dolly'],
        he: '{who} being soft or girlish draws sneers and suspicion; boys are beaten for less',
        she: '{who}’s softness is exactly what’s wanted, which can make her invisible' },
    { key: 'manners', label: 'Manners', ids: ['gentlemanly', 'polite', 'classy', 'elegant', 'dignified', 'suave', 'voice_cultivated'],
        he: '{who}’s manners open doors: hat off indoors, the chair pulled out, the check paid',
        she: '{who}’s manners are a lady’s armour and her ticket into better rooms' },
    { key: 'tongue', label: 'A sharp tongue', ids: ['sarcastic', 'wry', 'deadpan', 'snarky', 'roaster', 'mocking'],
        he: '{who}’s wit makes him good company at the bar',
        she: '{who}’s sharp tongue is unladylike; men take it as a challenge or a reason to cut her down' },
    { key: 'leaning', label: 'Leaning on someone', ids: ['dependent', 'codependent', 'clingy', 'needy_for_touch', 'separation_anxiety'],
        he: 'a man who leans like {who} needs a wife to run his life, and usually finds one',
        she: '{who} leaning on a man is the expected arrangement; leaving would mean no money, no name and no place to go' },
    { key: 'mask', label: 'Keeping face', cats: ['masks'],
        he: '{who} keeping his face straight is a man’s whole training: nothing shown, ever',
        she: '{who} smiling through it is what a woman is taught from girlhood: never let the company see' },
    { key: 'showing_love', label: 'Showing love', ids: ['service_giving', 'gifts_giving', 'protection_giving', 'provider_pride'],
        he: '{who} showing love by fixing, paying and protecting is how a man is supposed to love',
        she: '{who} showing love by cooking, mending and keeping house is what a woman is for, so it goes unthanked' },
    { key: 'lonely', label: 'Lonely', ids: ['lonely', 'lonely_in_a_crowd', 'socially_drained', 'homesick'], need: 'social',
        he: '{who} lonely goes to a bar or the lodge, where men talk for hours without saying anything',
        she: '{who} lonely has the telephone, the church circle and a neighbour’s kitchen, and every one of them talks' },
    { key: 'bored', label: 'Boredom', ids: ['bored', 'bored_stiff', 'restless', 'pent_up'], need: 'fun',
        he: '{who} bored has the bar, the ball game and the open road',
        she: '{who} bored at home has the soaps, the radio and housework that never ends' },
    { key: 'restroom', label: 'Excusing herself', need: 'bladder',
        she: 'a lady like {who} never says she needs the restroom; she excuses herself to powder her nose, and on a long drive she waits' },
    // Their own ties toward the other person (Bonds tab), read for each of them. {other} is the other one.
    { key: 'boss', label: 'The boss', ties: ['boss_of', 'employs_in_house'],
        he: '{who} as the boss is ordinary: the girl outside his door fetches coffee, takes dictation and takes his passes',
        she: 'a woman boss like {who} is nearly unheard of; the men under her call her a dragon lady and test her every day' },
    { key: 'staff', label: 'Working for them', ties: ['works_for', 'in_service_to'],
        he: '{who} answering to {other} is a rung on the ladder, and he means to climb it',
        she: '{who} working for {other} is a girl Friday: typing, coffee, his moods, and she can be let go for marrying' },
    { key: 'the_doctor', label: 'The doctor', ties: ['doctor_of'],
        he: '{who}’s word as a doctor is law; patients, wives above all, don’t question it',
        she: 'a woman doctor like {who} is mistaken for the nurse and second-guessed by every man in the ward' },
    { key: 'the_patient', label: 'The patient', ties: ['patient_of'],
        he: '{who} as a patient is told the truth man to man',
        she: '{who} as a patient gets talked over; the doctor may discuss her case with her husband or father instead of her' },
    { key: 'teaching', label: 'Teaching', ties: ['teacher_of', 'mentor'],
        he: 'a man teaching like {who} is respected, and seen as the principal in waiting',
        she: 'a woman teaching like {who} is expected to be a spinster or to quit when she marries, and some towns still make her' },
    { key: 'parent', label: 'Parenting', ties: ['parent_of', 'guardian_of'],
        he: '{who} as a father is the final word and the belt, home in time for dinner',
        she: '{who} as a mother is blamed for everything her child becomes, from a sissy to a delinquent' },
    { key: 'shielding', label: 'Protecting', ties: ['protects', 'watches_over', 'would_die_for'],
        he: '{who} protecting {other} is a man’s plain job, and nobody asks whether it was wanted',
        she: '{who} protecting a man would embarrass him in public, so she does it where nobody sees' },
    { key: 'pursuing', label: 'Pursuing', ties: ['courting', 'flirts_with', 'crush', 'smitten'],
        he: '{who} pursuing {other} is expected to ask, call, pay and keep calling',
        she: '{who} pursuing a man has to seem not to: a dropped glove, a well-timed hello, and never the first call' },
    { key: 'rivalry', label: 'Rivalry', ties: ['rival', 'rivals', 'competing_for_them'],
        he: '{who} as a rival is fair game for a fight or a bet',
        she: 'a woman rivalling a man like {who} is told she’s trying to be one, and winning makes it worse' },
    { key: 'keeper', label: 'Keeping someone', ties: ['captor_of', 'keeps_them'],
        she: 'nobody would suspect a woman like {who} of keeping someone, so nobody looks' },
];
// How the period reads the dynamic they're in right now, by its kind. mw when one is a man and one a woman.
// Power and captor dynamics are left out: the Power line already says that.
const DYN_LINES = {
    romance: { mw: 'love between {man} and {woman} is meant to head straight for the altar; her family wants to know his intentions, and his friends rib him for going soft',
        any: 'love is supposed to end in marriage, and quickly' },
    heat: { mw: 'wanting between {man} and {woman} outside marriage has to hide in motels, back seats and borrowed apartments, and if it’s found, she pays more',
        any: 'wanting outside marriage hides in motels, back seats and borrowed apartments' },
    toxic: { mw: 'a fight between {man} and {woman} behind closed doors is their own business; neighbours turn the radio up and police tell him to cool off',
        any: 'what happens inside a relationship stays there; nobody steps in' },
    allies: { mw: 'a man and a woman as friends or rivals, like {man} and {woman}, is something nobody quite believes; people assume one of them wants more',
        any: 'men have buddies and the lodge, women the coffee morning; rivalry is meant to stay polite' },
    roles: { mw: 'family roles are fixed: he decides and earns, she keeps the house and carries the feelings',
        any: 'family is duty first; you don’t walk away from blood or vows' },
    distance: { mw: 'distance between {man} and {woman} is simply proper: Mr and Miss, introductions, a hat tipped and nothing personal',
        any: 'strangers keep it formal: Mr, Mrs, Miss, and nothing personal' },
    obsess: { mw: 'a man’s fixation on a woman is called devotion and gets songs written about it; a woman’s on a man is called crazy',
        any: 'obsession reads as devotion in a love song and as madness in a doctor’s notes' },
};
// Age and height, read off each profile. [test(age or cm), he, she]; {age} is their age.
const AGE_LINES = [
    [(a, wed) => a >= 27 && !wed, 'a bachelor at {age} like {who} is free, though people begin to wonder why', '{who} at {age} and unmarried is getting called an old maid; aunts ask what’s wrong with her'],
    [a => a <= 20, 'at {age} {who} is draft age, can’t vote until twenty-one and can’t buy a drink in most states', 'at {age} {who} is of an age to marry; plenty of girls are wives by nineteen'],
    [a => a >= 45, 'at {age} {who} is in his prime, a man of standing', 'at {age} a woman like {who} is thought past it, her looks spent and her place behind her children'],
];
const HEIGHT_LINES = { he: [cm => cm <= 168, '{who} being short is a joke other men make, and he makes up for it'], she: [cm => cm >= 175, '{who}’s height makes her stand out; tall girls are told to slouch, wear flats and find a taller man'] };
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
// A person lens shows when they have one of its ids or a feeling in one of its families at clear or above, one of
// its ties toward the other person, or the need it names has run low.
const personHas = (moods, lens, ties = {}, needs = []) => Object.entries(moods).some(([id, v]) => v >= 41 && ((lens.ids ?? []).includes(id) || (lens.cats ?? []).includes(MOOD_CAT.get(id))))
    || (lens.ties ?? []).some(id => (ties[id] ?? 0) >= 41) || (lens.need ? needs.includes(lens.need) : false);
const fillIn = (text, map) => text.replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
// The harshest clause of a Power line ("called hysterical and committed") only goes in when the one holding
// power is in a cold, cruel, angry or controlling mood (ctx.harsh). Otherwise it's the world, not how he treats her.
// ctx: { era, n, u, gn, gu ('he' | 'she' | 'they'), top: 'n' | 'u' | '', harsh, medicine, romance, money, manSub, womanDom, tints: [POWER_TINTS keys] }
// moods, ties: { n, u } each person's cards and their own ties toward the other; needs: { n, u } ids run low;
// ages, heights: { n, u } in years and cm (0 or '' when not set); dynGroup: the dynamic's kind; wed: they're married or engaged.
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
        for (const k of ['n', 'u']) {
            const g = gender[k], who = name[k], other = name[k === 'n' ? 'u' : 'n'], st = ctx.moods?.[k] ?? {}; if (!['he', 'she'].includes(g)) continue;
            for (const lens of PEOPLE) if (lens[g] && personHas(st, lens, ctx.ties?.[k], ctx.needs?.[k])) out.push([lens.label, fillIn(lens[g], { who, other })]);
            const age = ctx.ages?.[k], cm = ctx.heights?.[k], wed = ['married_status', 'engaged_status'].some(id => (st[id] ?? 0) >= 41) || ctx.wed;
            const byAge = age ? AGE_LINES.find(([test]) => test(age, wed)) : null;
            if (byAge) out.push(['Age', fillIn(byAge[g === 'he' ? 1 : 2], { who, age })]);
            if (cm && HEIGHT_LINES[g][0](cm)) out.push(['Height', fillIn(HEIGHT_LINES[g][1], { who })]);
        }
        const dyn = DYN_LINES[ctx.dynGroup];
        if (dyn) out.push(['Their dynamic', man && woman ? fillIn(dyn.mw, { man: name[man], woman: name[woman] }) : dyn.any]);
        const older = ctx.ages?.n && ctx.ages?.u ? ctx.ages.n - ctx.ages.u : 0, elder = older >= 8 ? 'n' : older <= -8 ? 'u' : '';
        if (elder && ctx.romance && man && woman) out.push(['Age gap', elder === man ? `an older man like ${name[man]} with a much younger woman raises few eyebrows and some envy; people assume he chose and she was lucky` : `an older woman like ${name[woman]} with a younger man is a scandal and a joke: people call her desperate and him a kept boy`]);
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
// items: words in what someone carries (Facts › Carrying) that also wake the line.
export const LENS_TRIGGERS = {
    money: { items: 'cash money wallet checkbook chequebook', skills: ['typing', 'negotiation', 'gambling'] },
    medicine: { items: 'syringe pills stethoscope scalpel morphine', skills: ['medicine', 'surgery', 'psychiatry'], turns: ['doctors', 'hospital_gowns', 'gurneys', 'straitjackets', 'clinical_voice', 'medplay_giving', 'medplay_receiving'],
        moods: ['sedated', 'hospital_ward', 'hysterical'], story: ['asylum_horror'] },
    vice: { items: 'flask whiskey cigarettes cigarette cigar lighter bottle pills reefer', skills: ['holding_liquor', 'bartending', 'drug_dealing'], turns: ['smoking', 'drunkenness', 'someone_high', 'shotgunning', 'smoke_breath', 'smoke_scent'],
        moods: ['party_brain', 'drinking_to_forget', 'strung_out', 'comedown', 'hazy_drunk', 'blackout_drunk', 'euphoric_high'] },
    secrets: { items: 'letter letters photograph photo key keys recorder diary', skills: ['wiretapping', 'stalking', 'blackmail', 'disguise'], turns: ['almost_caught', 'risky_places', 'being_followed', 'polaroids', 'tape_recordings', 'filming_someone', 'being_filmed', 'love_letters'],
        moods: ['fear_of_being_found_out', 'hiding_evidence', 'false_persona', 'keeping_tabs', 'hiding_it_from_family', 'covering_for_them'], ties: ['stalks', 'secret_relationship'] },
    affair: { items: 'ring lipstick', turns: ['taken_people', 'being_the_other_woman', 'being_cheated_on', 'cuckolding', 'wedding_rings'],
        moods: ['forbidden_want', 'jilted', 'betrayed'], ties: ['affair'] },
    faith: { items: 'rosary bible cross crucifix', turns: ['piety', 'hierophilia', 'sinfulness', 'clergy', 'penance'], moods: ['guilt_sick', 'forsaken', 'righteous', 'guilty_lust'] },
    law: { items: 'knife switchblade badge handcuffs', skills: ['murder', 'burglary', 'safecracking', 'forgery', 'con_artistry', 'bribery', 'body_disposal'], turns: ['killers', 'criminals', 'mobsters', 'detectives', 'con_artists', 'erotophonophilia', 'hybristophilia'],
        moods: ['murderous', 'hiding_evidence', 'calm_after_violence', 'bloodthirsty', 'blackmailing'] },
    discipline: { turns: ['spanking_giving', 'spanking_receiving', 'caning_giving', 'caning_receiving', 'whipping_giving', 'whipping_receiving', 'crop_play', 'being_punished', 'being_scolded', 'canes'],
        moods: ['punitive', 'dreading_punishment'] },
    // America in the 1950s and 60s only.
    home: { skills: ['housekeeping', 'cooking', 'parenting'], turns: ['housewives', 'domesticity', 'wedding_rings'], moods: ['married_status', 'domestic_tyrant', 'domestic'], ties: ['married', 'engaged', 'arranged_marriage', 'marriage_of_convenience'], story: ['domestic_thriller'] },
    courting: { turns: ['being_courted', 'being_taken_out', 'girl_boy_next_door', 'first_times'], ties: ['dating', 'courting_pair', 'courting', 'slow_burn', 'mutual_pining'] },
    babies: { turns: ['breeding_giving', 'breeding_receiving', 'pregnant_bellies', 'lactation'] },
    bedroom: { turns: ['giving_oral', 'receiving_oral', 'anal_giving', 'anal_receiving', 'inexperienced_partners', 'innocence', 'corruption_kink'], moods: ['innocent'] },
    dress: { skills: ['fashion_sense', 'hairdressing', 'sewing'], turns: ['set_hair_pearls', 'stocking_fetish', 'glove_fetish', 'corsetry_fetish', 'lipstick', 'sharp_suits', 'undone_ties', 'waistcoats_braces', 'greased_hair', 'slow_undressing', 'lingerie'], moods: ['well_dressed', 'vain'] },
    pictures: { items: 'camera polaroid film', skills: ['photography'], turns: ['polaroids', 'filming_someone', 'being_filmed', 'exhibitionist', 'voyeur', 'burlesque_attraction', 'posing_someone'] },
    war: { items: 'tags medal', turns: ['scars', 'uniformed_people', 'dog_tags'], moods: ['traumatised', 'scarred'] },
    appearances: { turns: ['social_climbing', 'meticulous_presentation', 'rule_followers', 'preppy_types', 'rich_people'], moods: ['keeps_up_appearances', 'respectability_obsessed', 'gossipy', 'hiding_it_from_family'], ties: ['neighbours'] },
    suspicion: { skills: ['wiretapping'], turns: ['being_followed', 'detectives'], moods: ['paranoid', 'suspicious', 'false_persona', 'keeping_tabs'], ties: ['suspicious_of'], story: ['cold_war_horror'] },
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
