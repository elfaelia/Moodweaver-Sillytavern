// Period lines for a story set in 1950s–60s America: how the world of the time treats a person because of what is
// on their cards. Each line is about one person ({who}); {other} is the other one of the pair and {age} their age.
// A line has a he text, a she text, or an any text (anyone, including someone set to they). The Period tab shows a
// person only the lines for their gender, and anything switched off there is never sent for them.
//
// Written fresh in 1.73 in plain, natural sentences. Researched against: Kinsey (1948, 1953) on affairs; the Equal
// Pay Act (1963), Title VII (1964), the Equal Credit Opportunity Act (1974) and the "help wanted: male / female"
// ads; Griswold v. Connecticut (1965) and Eisenstadt (1972) on the Pill; New York's adultery-only divorce law (to
// 1966); median age at first marriage in 1960 (20 for women, 23 for men); DSM-I (1952) and DSM-II (1968),
// including masochism, transvestism and homosexuality as "sexual deviations"; the "schizophrenogenic mother";
// Miltown (1955), Librium (1960) and Valium (1963); Oken's 1961 survey (most doctors didn't tell patients they had
// cancer); Cleckley's The Mask of Sanity; Friedan's The Feminine Mystique (1963); Gurley Brown's Sex and the Single
// Girl (1962); Masters and Johnson (1966); going steady (TIME, 1957); AFDC "midnight raids"; Miranda (1966).
//
// Triggers (any one of them wakes the line; nothing listed means the `when` conditions alone decide):
//   ids    a mood, trait, Mind, Intimacy or fact on this person's cards at clear (41) or above
//   cats   any feeling of one of these families at clear or above
//   turns  a turn-on this person holds above 40
//   ties   their own tie toward the other person, or one they share
//   need   a need that has run low on the info board
//   scene  something in play for both of them (engine/period.js SCENE keys: things carried, places, skills, tropes)
// when: every condition listed must hold (see engine/period.js WHEN). other: the other person's gender.
// world: assumes ordinary public life (a job, money, neighbours, going out); "kept apart" switches these off.
// w: the weight when nothing on the cards woke it (default 60). group: only one line of a group goes per reply.

export const PERIOD_CATS = [
    ['power', 'Power and roles'],
    ['seen', 'How men and women are seen'],
    ['money', 'Money and work'],
    ['home', 'Home and marriage'],
    ['dating', 'Dating and courting'],
    ['bed', 'Sex and the bedroom'],
    ['tastes', 'Secret tastes'],
    ['affairs', 'Affairs and getting caught'],
    ['body', 'Body, looks and age'],
    ['mind', 'Medicine and the mind'],
    ['name', 'Reputation and judgement'],
    ['temper', 'Personality'],
    ['vices', 'Drink, smoke and drugs'],
    ['world', 'Out in the world'],
];

const L = (cat, sub, id, label, texts, on = {}) => ({ cat, sub, id, label, ...texts, ...on });

export const PERIOD = [
    // ---- Power and roles ----
    L('power', 'Who decides', 'man_decides', 'A man’s say', {
        he: 'Most people take it for granted that a man has the final say over a woman. Police, doctors, banks and her own family will usually back {who} before they back {other}.' },
    { when: ['lead'], other: 'she', group: 'power', w: 95 }),
    L('power', 'Who decides', 'woman_under', 'Not being believed', {
        she: 'If {who} complains about how {other} treats her, she is likely to be told she is overwrought. Few people outside would step in between a woman and the man in charge of her.' },
    { when: ['under'], other: 'he', group: 'power', w: 92 }),
    L('power', 'Who decides', 'woman_leads', 'A woman in charge', {
        she: 'A woman giving orders to a man is unusual enough that people look for a reason. They tend to decide that {who} is hard and unwomanly, or that {other} is weak.' },
    { when: ['lead'], other: 'he', group: 'power', w: 95 }),
    L('power', 'Who decides', 'man_under', 'Letting her run things', {
        he: 'Other men would tease {who} for letting a woman run things, so he is likely to hide it in public, whatever he feels about it in private.' },
    { when: ['under'], other: 'she', group: 'power', w: 90 }),
    L('power', 'Who decides', 'rank', 'Rank', {
        any: 'People of the time defer to rank. The boss, the doctor and the older man are expected to be obeyed, and anyone who questions them gets called a troublemaker.' },
    { when: ['lead', 'notMixed'], group: 'power', w: 85 }),
    L('power', 'Taking charge and giving way', 'takes_charge', 'Taking charge', {
        he: 'People expect a man to take charge, so {who} is rarely questioned. That also means nobody tells him when he has gone too far.',
        she: 'A woman who takes charge gets called bossy or pushy. Men may follow {who}’s lead, but many will resent it, and some will find it exciting without admitting it.' },
    { ids: ['demanding', 'commanding', 'taking_charge', 'controlling', 'assertive', 'in_control', 'dominant', 'boss'] }),
    L('power', 'Taking charge and giving way', 'gives_way', 'Giving way', {
        he: 'People expect a man to make the decisions. If {who} gives way easily, other men may call him weak, and women may think less of him as a husband.',
        she: 'A woman who gives way is called sweet and sensible, so {who} gets praised for it. Nobody stops to ask whether she actually agrees.' },
    { ids: ['fawning', 'submissive', 'obedient', 'people_pleaser', 'soft'] }),
    L('power', 'Roles between them', 'boss', 'The boss', {
        he: 'As the boss, {who} has real power over {other}’s living. Letting someone go takes one word, and nobody would ask him to explain it.',
        she: 'A woman boss is rare. {who} will have worked twice as hard to get there, and men under her may resent taking her orders.' },
    { ties: ['boss_of', 'employs_in_house'], world: true }),
    L('power', 'Roles between them', 'staff', 'Working for them', {
        he: '{who} depends on {other} for his wages and his references, so he keeps his opinions to himself at work.',
        she: '{who} depends on {other} for her wages. Until 1964 no federal law stops an employer firing a woman for marrying, getting pregnant or turning down her boss.' },
    { ties: ['works_for', 'in_service_to'], world: true }),
    L('power', 'Roles between them', 'is_doctor', 'Their doctor', {
        he: 'As {other}’s doctor, {who} is trusted almost completely. Patients rarely question a doctor, and families tend to go along with whatever he decides.',
        she: 'A woman doctor is rare, about one in twenty. Patients may take {who} for the nurse, and some will ask for a man instead.' },
    { ties: ['doctor_of'] }),
    L('power', 'Roles between them', 'is_patient', 'The patient', {
        he: 'As a patient, {who} is expected to do as the doctor says and not ask many questions.',
        she: 'As a patient, {who} is often not told the whole truth about her own condition. Doctors routinely discuss a woman’s treatment with her husband or father and leave her out of it.' },
    { ties: ['patient_of'] }),
    L('power', 'Roles between them', 'keeper', 'Keeping someone', {
        any: 'Hiding someone is easier than it would be later. There are no computer records or cameras, and police often assume a missing adult left by choice.' },
    { ties: ['captor_of', 'keeps_them'] }),
    L('power', 'Roles between them', 'parent', 'Parenting', {
        he: 'A father is expected to earn the money, hand out discipline and stay a little distant. A man changing nappies is still a joke.',
        she: 'A mother gets the credit when her children turn out well and the blame when they don’t. Psychiatrists of the time often blame mothers for a child’s mental illness.' },
    { ties: ['parent_of', 'guardian_of'] }),
    L('power', 'Roles between them', 'teacher', 'Teaching', {
        any: 'A teacher or mentor is owed respect. Nobody expects {other} to argue with {who}, and few would believe a complaint about a respected teacher.' },
    { ties: ['teacher_of', 'mentor'] }),

    // ---- How men and women are seen ----
    L('seen', 'What men are expected to be', 'no_tears', 'Men don’t cry', {
        he: 'Men are not supposed to cry. If {who} is grieving or hurt, people expect him to keep it to himself, so it tends to come out as drink, anger or silence.',
        she: 'People expect a woman to cry, so they take it less seriously. {who}’s tears are likely to be put down to her being emotional rather than to what upset her.' },
    { cats: ['sad'], ids: ['teary', 'crying_alone', 'grieving'] }),
    L('seen', 'What men are expected to be', 'chivalry', 'A gentleman', {
        he: '{who} is expected to protect women. That means opening doors, walking on the street side, paying for dinner and stepping in if someone bothers her.',
        she: 'Men treat {who} with real courtesy because she is a woman. They open doors and stand when she comes in. The same men often assume she can’t handle money, machines or bad news.' },
    { ids: ['gentlemanly', 'protective', 'protector_role', 'feminine', 'girlish', 'polite', 'classy'], when: ['mixed'] }),
    L('seen', 'What men are expected to be', 'suspected', 'Who gets suspected', {
        he: 'When something goes wrong, people look at a man first. {who} would be suspected sooner than a woman and punished more harshly.',
        she: 'Nobody expects a woman to be dangerous. If {who} lies, steals or hurts someone, people are slow to suspect her, and juries are often reluctant to convict a woman.' },
    { ids: ['sadistic_personality', 'bloodthirsty', 'murderous', 'cold_blooded', 'compulsive_liar', 'manipulator', 'two_faced'] }),
    L('seen', 'What men are expected to be', 'young', 'Being young', {
        he: 'At {age}, {who} has to register for the draft, but he can’t vote until he is twenty-one and can’t buy a drink in most states.',
        she: 'At {age}, {who} is the age when many girls get engaged. Most women marry by twenty-one, so relatives are already asking about boyfriends.' },
    { when: ['young'] }),
    L('seen', 'Looking', 'looking', 'Looking', {
        he: 'Men looking openly at women is treated as normal. Whistles, comments and long stares are called compliments, and a woman is expected to smile or ignore them.',
        she: 'A woman who looks openly at a man is called forward or fast. {who} is expected to wait to be noticed, not to do the noticing.' },
    { ids: ['male_gaze', 'female_gaze', 'leering', 'checking_out'] }),
    L('seen', 'Views on women', 'old_views', 'A woman’s place', {
        he: 'Plenty of men think the way {who} does about women, so he is rarely challenged. Saying a woman’s place is in the home is ordinary talk at work and in bars.',
        she: 'Many women agree that a woman’s place is in the home, and {who} is one of them. She may judge women who break the rules more harshly than any man would.' },
    { ids: ['anti_feminist', 'chauvinist', 'misogynist', 'judgemental_misogyny', 'traditional'] }),
    L('seen', 'Views on women', 'feminist', 'Equal rights', {
        he: 'A man who thinks women should have the same rights as men is unusual. Other men may tease {who} about it or wonder who wears the trousers at home.',
        she: 'The Feminine Mystique comes out in 1963 and puts words to what many housewives feel. A woman who talks the way {who} does is still called a crank or a man-hater.' },
    { ids: ['feminist'] }),

    // ---- Money and work ----
    L('money', 'Providing', 'provider', 'Providing', {
        he: 'A man is judged by whether he can provide. If {who} keeps his family housed and fed, people respect him. If he can’t, it is a deep shame, whatever the reason.' },
    { ids: ['family_first', 'provider_pride', 'dutiful', 'married_status', 'protection_giving'], world: true }),
    L('money', 'Providing', 'out_of_work', 'Out of work', {
        he: 'A man without work feels like a failure. {who} may hide it from the neighbours, and some men in his place still leave the house every morning as if going to the office.',
        she: 'A poor woman on her own has few ways to earn. Factory work, cleaning and waitressing pay little, and welfare officers may search her home at night for signs of a man.' },
    { ids: ['poor', 'in_debt'], world: true }),
    L('money', 'Providing', 'rich', 'Money', {
        he: 'Money is how people measure a man. Bankers, waiters and policemen all treat {who} according to how much he seems to have.',
        she: 'Money a woman has is usually her father’s or her husband’s. However rich {who} is, a bank will want a man to sign for anything large.' },
    { ids: ['wealth', 'pampered', 'powerful'], world: true }),
    L('money', 'Her money', 'credit', 'Credit', {
        she: 'A woman can rarely get credit in her own name. Banks and stores usually want a husband or father to sign, and they often ignore a wife’s wages when deciding a loan.' },
    { ids: ['wealth', 'poor', 'in_debt', 'spendthrift', 'materialistic', 'independent'], world: true }),
    L('money', 'Her money', 'allowance', 'Housekeeping money', {
        he: 'Most husbands control the family money. {who} would give his wife an allowance for the house and make the big decisions himself.',
        she: 'Most wives are given a weekly allowance for the house. {who} may have to account for what she spends, and plenty of wives keep a little money hidden for emergencies.' },
    { ids: ['married_status', 'housewife', 'sixties_housewife', 'perfect_wife'], world: true }),
    L('money', 'Her money', 'spending', 'Spending', {
        he: 'It is {who}’s money to spend. A man who buys his wife a fur coat and his family a new car is showing everyone how well he is doing.',
        she: 'Store charge accounts are usually in the husband’s or father’s name. If {who} spends freely, the bill goes to the man, and he can close the account.' },
    { ids: ['spendthrift', 'hedonistic', 'materialistic'], world: true }),
    L('money', 'Her money', 'frugal', 'Careful with money', {
        he: '{who} counting every dollar is seen as careful and responsible. His wife may have to ask him for money and explain where every cent went.',
        she: 'Stretching the money is part of being a good housewife. {who} is expected to clip coupons, mend clothes and make leftovers last.' },
    { ids: ['frugal', 'hoarder'], world: true }),
    L('money', 'Work', 'career', 'A career', {
        he: 'A man’s job is a large part of who he is. {who}’s profession gives him a title and standing, and people defer to him because of it.',
        she: 'Most jobs open to women are nursing, teaching, typing or shop work. Women earn about sixty cents for every dollar a man earns, and job ads are split into “Help wanted: male” and “Help wanted: female”.' },
    { ids: ['lawyer', 'scientist', 'teacher', 'assistant', 'journalist', 'pharmacist', 'lab_technician', 'corporate_suit', 'company_man'], world: true }),
    L('money', 'Work', 'doctor_job', 'Being a doctor', {
        he: 'Doctors are among the most trusted men in the country. People call {who} Doctor, accept what he tells them and rarely ask for a second opinion.',
        she: 'A woman doctor is rare, about one in twenty. People may take {who} for a nurse, and male colleagues watch closely for her mistakes.' },
    { ids: ['doctor', 'surgeon', 'psychiatrist', 'cold_surgeon'] }),
    L('money', 'Work', 'nurse_job', 'Nursing', {
        he: 'A male nurse is rare. People may assume {who} couldn’t make it as a doctor, or wonder what else is different about him.',
        she: 'Nursing is one of the respectable jobs for a woman. {who} is expected to obey the doctors without question and to give it up once she has children.' },
    { ids: ['nurse', 'psychiatric_nurse', 'orderly'] }),
    L('money', 'Work', 'secretary_job', 'The secretary', {
        she: 'A secretary is expected to be pretty, discreet and loyal to her boss. Passes from the boss are treated as part of the job, and complaining could cost {who} her place.' },
    { ids: ['secretary', 'devoted_secretary'], world: true }),
    L('money', 'Work', 'ambition', 'Ambition', {
        he: 'Ambition is a man’s duty. {who} is expected to work long hours, know the right people and have a wife who can entertain the boss.',
        she: 'Ambition in a woman is frowned on. People expect {who} to give up work when she marries, and if she doesn’t, they pity her or wonder about her husband.' },
    { ids: ['ambitious', 'workaholic', 'status_obsessed'], world: true }),
    L('money', 'Work', 'greed', 'Wanting more', {
        he: 'Wanting more is called drive in a man. Getting rich is the whole point of the American dream, and nobody blames {who} for chasing it.',
        she: 'People are quick to call a woman who wants money a gold digger, even though marrying well is what most girls are told to do.' },
    { ids: ['greedy', 'gold_digger', 'opportunistic'], world: true }),

    // ---- Home and marriage ----
    L('home', 'Keeping house', 'housewife', 'Keeping house', {
        he: 'A man who cooks and cleans is unusual. People may tease {who} about wearing the apron, or assume he has no wife to do it.',
        she: 'Keeping house is a wife’s full-time job. {who} is expected to cook, clean, raise the children and look nice when her husband gets home, and nobody calls it work.' },
    { ids: ['housewife', 'sixties_housewife', 'perfect_wife', 'suburban_home'], world: true }),
    L('home', 'Married life', 'husband', 'Married', {
        he: 'A married man is seen as settled and reliable. {who} is head of the household in most people’s eyes and in some states’ laws, and he signs for the house, the car and the loans.',
        she: 'When {who} married, she took her husband’s name and, in most people’s eyes, his authority over her. In many places a wife can’t take out a loan or sign a lease without him.' },
    { ids: ['married_status'], when: ['wed'] }),
    L('home', 'Married life', 'engaged', 'Engaged', {
        he: 'An engaged man is expected to save for a house and give up his bachelor habits.',
        she: 'Once engaged, {who} is expected to plan the wedding, fill her hope chest and keep herself respectable until the day.' },
    { ids: ['engaged_status'] }),
    L('home', 'Married life', 'tyrant', 'Behind closed doors', {
        he: 'What a man does inside his own home is seen as his business. Neighbours who hear {who} shouting turn the radio up, and police tell him to cool off and leave.',
        she: 'Magazines and psychiatrists blame overbearing mothers for weak sons and nervous daughters. {who} is exactly the kind of mother they have in mind.' },
    { ids: ['domestic_tyrant', 'petty_tyrant', 'smother_mother', 'controlling'], when: ['wed'] }),
    L('home', 'Married life', 'bruised', 'Bruises', {
        she: 'If {who} turns up bruised, people ask whether she fell. Doctors and police tend to treat a husband’s violence as a private family matter and send her home.' },
    { ids: ['bruised', 'injured', 'bleeding', 'black_eye'] }),
    L('home', 'Single, divorced or widowed', 'single', 'Unmarried', {
        he: 'At {age} and unmarried, {who} is a confirmed bachelor in other people’s eyes. They wonder why he never settled down, and some of them whisper about it.',
        she: 'At {age} and still single, {who} is starting to be called an old maid. Relatives ask when she will settle down, and landlords and banks are wary of a woman alone.' },
    { when: ['single'] }),
    L('home', 'Single, divorced or widowed', 'alone', 'On their own', {
        he: 'A man on his own is a free bachelor, at least until people start asking why.',
        she: 'A woman on her own is either pitied or watched. Landlords, banks and neighbours all want to know where her man is.' },
    { ids: ['independent', 'hyper_independent', 'lone_wolf', 'newly_single'], world: true }),
    L('home', 'Single, divorced or widowed', 'divorced', 'Divorced', {
        he: 'A divorced man is pitied a little and forgiven quickly. He can usually marry again without much trouble.',
        she: 'A divorced woman is gossiped about. People assume {who} did something to deserve it, and married women may keep her away from their husbands.' },
    { ids: ['divorced'] }),
    L('home', 'Single, divorced or widowed', 'widowed', 'Widowed', {
        he: 'People expect a widower to marry again fairly soon, because they doubt a man can keep a house and raise children on his own.',
        she: 'A widow is treated kindly but watched. {who} is expected to wear black and mourn properly, and people will notice if she sees a man too soon.' },
    { ids: ['widowed'] }),
    L('home', 'Single, divorced or widowed', 'divorce_law', 'Getting divorced', {
        any: 'Divorce is hard to get. Most states want proof of adultery, cruelty or desertion, and in New York until 1966 adultery is the only grounds. Couples hire detectives or stage hotel photos to get one.' },
    { when: ['wed'], scene: ['affair'] }),
    L('home', 'Children', 'pregnant', 'Expecting', {
        she: 'A pregnant wife is congratulated, and if she works she is expected to quit as soon as she shows. An unmarried girl who gets pregnant is usually sent away and pushed to give the baby up.' },
    { ids: ['expecting'] }),
    L('home', 'Children', 'unwed_mother', 'An unmarried mother', {
        she: 'An unmarried mother is a disgrace in most people’s eyes. Her family may tell the neighbours she is visiting an aunt, and a home for unwed mothers may take the baby for adoption.' },
    { ids: ['unwed_mother'] }),

    // ---- Dating and courting ----
    L('dating', 'Dating rules', 'asks', 'Asking her out', {
        he: '{who} is expected to do the asking, pay for the evening and get her home at a decent hour. Her parents may want to know his intentions.',
        she: 'A girl is not supposed to ask a man out or propose. {who} has to wait to be asked, however long it takes.' },
    { ties: ['courting', 'dating', 'courting_pair', 'flirts_with', 'crush', 'smitten'], when: ['mixed', 'unwed'] }),
    L('dating', 'Dating rules', 'steady', 'Going steady', {
        any: 'Going steady means wearing his class ring or his jacket and not seeing anyone else. People expect an engagement to follow before long.' },
    { ties: ['dating', 'courting_pair'], when: ['mixed', 'unwed'] }),
    L('dating', 'How far', 'how_far', 'How far to go', {
        he: 'Other men expect {who} to try his luck, and if he succeeds they slap him on the back. Nobody calls a man cheap.',
        she: 'Nice girls are not supposed to go all the way before marriage. Kissing and petting are tolerated, but if people find out {who} went further, her name suffers far more than his.' },
    { when: ['mixed', 'unwed', 'heat'], w: 75 }),
    L('dating', 'How far', 'shotgun', 'If she falls pregnant', {
        he: 'If a girl he is seeing falls pregnant, {who} is expected to marry her. A quick wedding is the usual answer.',
        she: 'The Pill arrives in 1960, but many doctors only prescribe it to married women, and some states ban birth control outright until 1965. Abortion is illegal and dangerous, so a pregnancy could change {who}’s whole life.' },
    { when: ['mixed', 'unwed', 'heat'], scene: ['babies'], w: 65 }),
    L('dating', 'How far', 'innocent', 'Inexperience', {
        he: '{who} is expected to know what he is doing in bed, whether he does or not. Admitting he has little experience would embarrass him in front of other men.',
        she: 'Many girls are told almost nothing about sex before marriage. {who} may have only her mother’s warnings and a few whispered stories to go on.' },
    { ids: ['innocent', 'sheltered', 'first_time', 'late_bloomer'] }),

    // ---- Sex and the bedroom ----
    L('bed', 'Who leads in bed', 'man_leads_bed', 'Leading in bed', {
        he: 'A man is expected to lead in bed. {who} taking charge fits what everyone has been taught, including the marriage manuals, which tell husbands it is their job to guide their wives.' },
    { when: ['bedLead'], other: 'she', group: 'bed', w: 85 }),
    L('bed', 'Who leads in bed', 'woman_follows_bed', 'Letting him lead', {
        she: 'Women are taught to let the man lead in bed. {who} following his lead is what she has been told a good woman does, and she may feel she shouldn’t show how much she enjoys it.' },
    { when: ['bedYield'], other: 'he', group: 'bed', w: 80 }),
    L('bed', 'Who leads in bed', 'woman_leads_bed', 'Leading him in bed', {
        she: 'A woman who leads in bed surprises most men of the time. {other} might wonder where {who} learned it, and other people would call her forward or experienced.' },
    { when: ['bedLead'], other: 'he', group: 'bed', w: 85 }),
    L('bed', 'Who leads in bed', 'man_follows_bed', 'Letting her lead', {
        he: 'Most men of the time would never admit to letting a woman lead in bed. {who} would keep it strictly between the two of them.' },
    { when: ['bedYield'], other: 'she', group: 'bed', w: 80 }),
    L('bed', 'Who leads in bed', 'wife_duty', 'A wife’s duty', {
        she: 'Sex is seen as part of a wife’s duty, and no state treats it as a crime for a husband to force his wife. Whatever {who} feels about it, the law and her family would expect her to give way.' },
    { when: ['wed', 'heat', 'under'], other: 'he' }),
    L('bed', 'Wanting it', 'wanting', 'Wanting it', {
        he: 'A man wanting sex is seen as natural. {who} chasing a woman gets a wink from other men, and he is rarely blamed for trying.',
        she: 'A woman who openly wants sex risks being called cheap. {who} is supposed to be wanted, not to want, so she may hide how much she feels it.' },
    { cats: ['desire'], ids: ['horny', 'flirty', 'slutty', 'loose', 'swaggering_flirt', 'seductive_act', 'provocative'] }),
    L('bed', 'Wanting it', 'too_much', 'A big appetite', {
        he: 'A man with a big appetite is called a wolf or a ladies’ man. Doctors rarely see it as a problem unless it lands {who} in trouble with the law.',
        she: 'A woman with a strong appetite can be called a nymphomaniac, which doctors treat as a real illness. {who} could be sent to a psychiatrist, sedated or even committed for it.' },
    { ids: ['nymphomania', 'hypersexual_coping', 'compulsive_cheating', 'desire_as_validation', 'sex_compulsion'] }),
    L('bed', 'Wanting it', 'not_wanting', 'Not wanting it', {
        he: 'A man who can’t perform, or doesn’t want to, is deeply ashamed. A doctor may tell {who} it is his wife’s fault, or that it is all in his head.',
        she: 'A woman who doesn’t want sex is called frigid. Doctors and marriage counsellors treat it as her failing, and {who} may be told to see a psychiatrist to fix it.' },
    { ids: ['frigidity', 'intimacy_performance_anxiety', 'touch_averse'] }),
    L('bed', 'Wanting it', 'holding_back', 'Holding back', {
        he: 'A man is expected to want sex and to know what he is doing. If {who} holds back, he hides it, and people assume he simply hasn’t met the right girl.',
        she: 'Holding back is what a respectable woman is supposed to do, so {who}’s reserve is praised. A husband may still complain to the doctor that his wife is cold.' },
    { ids: ['repressed', 'sexual_shame', 'vanilla', 'guilty_lust'] }),
    L('bed', 'Wanting it', 'two_kinds', 'Two kinds of women', {
        he: 'Many men divide women into the kind you marry and the kind you sleep with. {who} may find it hard to want the woman he respects.',
        she: 'Women get sorted into good girls and bad girls, with little in between. Once {who} is seen as the second kind, it is very hard to go back.' },
    { ids: ['madonna_whore', 'madonna_whore_complex', 'sinful_desire'] }),
    L('bed', 'What nobody says', 'unspoken', 'What nobody says', {
        any: 'Sex is hardly ever talked about. Many brides learn about it on their wedding night, and many men learned what they know from friends and magazines.' },
    { when: ['heat'], w: 45 }),
    L('bed', 'What nobody says', 'unnatural', 'Against the law', {
        any: 'Oral and anal sex count as sodomy, a crime in almost every state, even between married people. {who} may find that thrilling or shameful.' },
    { turns: ['giving_oral', 'receiving_oral', 'anal_giving', 'anal_receiving'] }),
    L('bed', 'What nobody says', 'open_minded', 'Easy about sex', {
        any: 'Kinsey’s reports shocked the country by showing what Americans actually do in bed, and Masters and Johnson publish their study in 1966. Someone as relaxed about sex as {who} is still unusual.' },
    { ids: ['sex_positive', 'experimenter_role', 'novelty_led_desire'] }),

    // ---- Secret tastes ----
    L('tastes', 'A man who wants to give way', 'man_sub_wish', 'Wanting to be ruled', {
        he: 'A man wanting to be dominated is seen as shameful, even sick. Psychiatry lists masochism as a sexual deviation, so {who} would tell almost nobody about it.' },
    { when: ['subWish'], group: 'bed', w: 80 }),
    L('tastes', 'A man who wants to give way', 'man_dressing', 'Dressing up', {
        he: 'A man wearing women’s clothes is classed as a sexual deviant and can be arrested in some cities. {who} would keep it hidden from everyone.' },
    { turns: ['crossdressing_play', 'being_dressed'] }),
    L('tastes', 'A woman who wants to rule', 'woman_dom_wish', 'Wanting to rule', {
        she: 'A woman who wants to dominate a man is seen as unnatural, and the names for her are cruel ones. If {who} acts on it, it stays strictly behind closed doors.' },
    { when: ['domWish'], group: 'bed', w: 80 }),
    L('tastes', 'Rough and ruled', 'rough_man', 'Rough in bed', {
        he: 'Spanking is ordinary discipline for children, and magazine ads of the time even joke about husbands spanking their wives. A man wanting to be rough in bed sits close to things {who} grew up with.' },
    { turns: ['spanking_giving', 'rough_giving', 'rough_handling', 'ravishing_giving', 'caning_giving', 'whipping_giving'] }),
    L('tastes', 'Rough and ruled', 'ruled_woman', 'Liking to be ruled', {
        she: 'A woman who likes being dominated is close to what people expect of women, so few would question it. What would shock them is {who} admitting that she enjoys it.' },
    { turns: ['submissiveness', 'being_bossed', 'being_owned', 'spanking_receiving', 'masochist', 'being_punished'], ids: ['soft_sub', 'submissive', 'bottom', 'service_submissive'] }),
    L('tastes', 'Queer desire', 'queer', 'Queer desire', {
        he: 'Being gay is treated as an illness, a sin and a crime. Bars are raided, names are printed in the paper, and a man can lose his job for it, so {who} would keep it hidden.',
        she: 'Love between women is treated as an illness and a sin, though people are often slow to suspect it. Two women living together can pass as friends, and {who} would be careful nobody thinks otherwise.' },
    { when: ['sameSex', 'romance'], w: 85 }),
    L('tastes', 'Queer desire', 'closeted', 'In the closet', {
        any: 'The diagnostic manual lists homosexuality as a mental disorder. If {who} were found out, it could cost a job, family and freedom, and some are sent for aversion therapy.' },
    { ids: ['closeted', 'homosexuality_label'] }),
    L('tastes', 'Other tastes', 'odd_tastes', 'Particular tastes', {
        any: 'Any taste outside the ordinary is called a perversion. {who} could only find people who share it through mail-order magazines and coded ads in the back pages.' },
    { ids: ['perverted', 'deviant', 'fetishistic', 'covert_pervert', 'rigger', 'rope_bunny', 'pet_kitten', 'pet_puppy', 'total_power_exchange'] }),
    L('tastes', 'Other tastes', 'pictures', 'Pictures', {
        any: 'Photos are developed by someone at the camera shop, so private pictures are risky. A Polaroid, which develops in a minute with nobody else seeing it, is a real temptation.' },
    { turns: ['exhibitionist', 'being_filmed', 'polaroids', 'filming_someone'], scene: ['pictures'] }),

    // ---- Affairs and getting caught ----
    L('affairs', 'Affairs', 'affair', 'An affair', {
        he: 'Plenty of married men have affairs, and many people quietly accept it. If {who} is caught, he can expect a cold shoulder for a while and not much more.',
        she: 'A wife who has an affair risks her marriage, her children and her good name. If {who} is caught, a divorce court will be far harder on her than on him.' },
    { ties: ['affair', 'secret_relationship'], scene: ['affair'], w: 80 }),
    L('affairs', 'Affairs', 'common', 'How common it is', {
        any: 'Kinsey’s studies suggested that about half of married men and a quarter of married women had strayed. Nobody admits it, and everyone suspects someone.' },
    { scene: ['affair'], w: 50 }),
    L('affairs', 'Affairs', 'other_one', 'The other woman', {
        he: 'The other man is a scoundrel to the husband and a bit of a rogue to everyone else.',
        she: 'The other woman gets most of the blame. People call {who} a homewrecker even when the husband did the chasing.' },
    { scene: ['other_one'], w: 75 }),
    L('affairs', 'Affairs', 'office_affair', 'The boss and the secretary', {
        he: 'Affairs between bosses and secretaries are a running joke. {who} would face little trouble if it came out, while she would probably lose her job.',
        she: 'Affairs between bosses and secretaries are a running joke. If it came out, {who} would probably lose her job and he would keep his.' },
    { ties: ['office_romance'], when: ['mixed'] }),
    L('affairs', 'Getting caught', 'caught', 'Getting caught', {
        any: 'Getting caught is easy. Neighbours listen in on shared party lines, motels ask for a married name, and a private detective costs a few dollars a day.' },
    { scene: ['secrets', 'affair'], w: 65 }),
    L('affairs', 'Getting caught', 'found_out', 'Found out', {
        he: 'When an affair comes out, the man is mostly forgiven in time. People talk about {who} for a season and then move on.',
        she: 'When an affair comes out, the woman pays more. People will talk about {who} for years.' },
    { scene: ['found_out'], w: 75 }),
    L('affairs', 'Getting caught', 'hotel', 'Signing in', {
        he: 'Checking into a hotel with a woman means signing as Mr and Mrs and hoping the clerk doesn’t ask. Some hotels have a house detective who knocks on doors.',
        she: 'A woman checking into a hotel with a man who isn’t her husband risks a knock from the house detective, and her name is the one that gets ruined.' },
    { scene: ['rooms'], when: ['mixed', 'unwed'], world: true }),

    // ---- Body, looks and age ----
    L('body', 'Looks', 'beauty', 'Good looks', {
        he: 'A handsome man is trusted quickly and forgiven easily. Women aren’t supposed to chase {who}, so they find quieter ways to let him know.',
        she: 'A pretty woman gets attention wherever she goes. {who}’s looks open doors, but she is also blamed for the looks she gets and for what men do about them.' },
    { ids: ['beautiful', 'sexy', 'striking', 'handsome', 'cute', 'doe_eyed'] }),
    L('body', 'Looks', 'plain', 'Plain looks', {
        he: 'Looks matter less for a man. A steady job and a good suit count for more than {who}’s face.',
        she: 'A plain woman is told to make the most of herself and be grateful when a man shows interest. People are often less kind to {who} than to a prettier girl.' },
    { ids: ['average_looks', 'ugly'] }),
    L('body', 'Looks', 'figure', 'Figure', {
        he: 'Men size each other up by build. A big man is assumed to be capable, and a slight one is more likely to be pushed around.',
        she: 'Women’s figures are discussed openly, by men in the street and women at the bridge table. Girdles and diet pills are sold to fix any part {who} might worry about.' },
    { ids: ['petite', 'curvy', 'chubby', 'muscular', 'athletic', 'statuesque', 'gaunt'] }),
    L('body', 'Looks', 'grime', 'Looking a mess', {
        he: 'Dirt from work is honest for a man, and nobody minds {who} looking rough.',
        she: 'A woman is never supposed to be seen without her face on. If {who} is caught dirty or a mess, people think less of her for it.' },
    { ids: ['dirty', 'sweaty', 'messy', 'unkempt', 'party_wrecked'], need: 'hygiene' }),
    L('body', 'Looks', 'marked', 'Scars and tattoos', {
        he: 'People see a tattooed or scarred man and guess he was in the service, at sea or in prison.',
        she: 'Tattoos on a woman are almost unheard of in polite company. People would assume {who} had been with a carnival, in prison or with a sailor.' },
    { ids: ['scarred', 'tattooed', 'needle_marks', 'stitched_up'] }),
    L('body', 'Looks', 'dressed', 'Being dressed', {
        any: 'People dress formally. Men wear hats and pressed suits, and women wear girdles, stockings and set hair, so seeing {who} undressed or undone is a real intimacy.' },
    { scene: ['dress'], w: 55 }),
    L('body', 'Looks', 'height', 'Height', {
        he: 'Short men get teased by other men, and {who} may feel he has to make up for it in other ways.',
        she: 'Tall girls are told to wear flats, stand less straight and find a taller man. {who}’s height makes her stand out in any room.' },
    { when: ['heightOdd'] }),
    L('body', 'Age', 'older_man', 'An older man', {
        he: 'An older man with a much younger woman raises few eyebrows. People assume {who} chose her, and some men envy him.' },
    { when: ['older', 'romance'], other: 'she', w: 70 }),
    L('body', 'Age', 'younger_woman', 'A younger woman', {
        she: 'A young woman with an older man is common and often encouraged. Her family may see him as safe and settled, and people expect {who} to feel lucky.' },
    { when: ['younger', 'romance'], other: 'he', w: 65 }),
    L('body', 'Age', 'older_woman', 'An older woman', {
        she: 'An older woman with a younger man is a scandal. People call {who} desperate and him a kept boy.' },
    { when: ['older', 'romance'], other: 'he', w: 75 }),
    L('body', 'Age', 'younger_man', 'A younger man', {
        he: 'A young man with an older woman gets teased, and people assume she is the one in charge.' },
    { when: ['younger', 'romance'], other: 'she', w: 70 }),
    L('body', 'Age', 'midlife', 'Middle age', {
        he: 'At {age}, a man is in his prime. {who} is expected to be at the height of his career and his standing.',
        she: 'At {age}, a woman is thought to be past her best years. People expect {who} to step back behind her husband and children.' },
    { when: ['midlife'] }),
    L('body', 'Health', 'hurt', 'Getting hurt', {
        he: 'When {who} gets hurt, he is expected to shrug it off. A man who sees a doctor for anything less than a broken bone is called soft.' },
    { ids: ['injured', 'bleeding', 'bruised', 'concussed', 'burned', 'sore'] }),
    L('body', 'Health', 'ill', 'Being ill', {
        he: 'A man is expected to keep working when he is ill. If {who} has to stay in bed, his wife or mother is expected to nurse him.',
        she: '{who} still has a house to run when she is ill. Doctors are quick to blame a woman’s symptoms on her nerves and slow to look further.' },
    { ids: ['sick', 'weak', 'sickly', 'feverish', 'chronically_ill', 'terminally_ill', 'headache'], need: 'health' }),
    L('body', 'Health', 'monthly', 'Her period', {
        she: 'A woman’s period is never mentioned in company. Many men believe it makes a woman unfit to make decisions, and {who} may have been told not to bathe or swim during it.' },
    { ids: ['on_period'] }),
    L('body', 'Health', 'polio', 'Polio', {
        any: 'Polio was the great fear of the fifties until the vaccine arrived in 1955. People still stare at a brace or a limp, and some are kind in a way {who} may find harder to bear.' },
    { ids: ['polio_survivor'] }),
    L('body', 'Health', 'worn_out', 'Worn out', {
        he: 'Truck drivers, students and doctors on long shifts take Benzedrine to stay awake. {who} could get pep pills easily, and few people would call it a habit.',
        she: 'Doctors hand out diet pills and pep pills to tired housewives. {who} could get them from a single visit.' },
    { ids: ['tired', 'exhausted_to_the_bone', 'sleep_deprived', 'run_down'], need: 'energy' }),

    // ---- Medicine and the mind ----
    L('mind', 'Doctors and hospitals', 'doctors_rule', 'Doctors', {
        any: 'Doctors are close to all-powerful. Patients are often not told their own diagnosis, and a husband or father may sign consent for treatment on a woman’s behalf.' },
    { when: ['medicine'], w: 70 }),
    L('mind', 'Doctors and hospitals', 'committed', 'Committed', {
        he: 'Getting someone committed is easy. In most states a relative and a doctor or two can sign the papers, and getting out again is much harder than getting in.',
        she: 'Women are committed by husbands and fathers for depression, for wanting sex, for disobedience or for being inconvenient. Once inside, {who}’s word counts for very little.' },
    { ids: ['committed', 'institutionalised', 'asylum_ward', 'ward_of_someone'] }),
    L('mind', 'Doctors and hospitals', 'treatment', 'Treatment', {
        any: 'Treatment is harsh. Shock treatment, insulin comas, cold wet packs and heavy sedation are all normal, and lobotomies, though rarer than in the forties, still happen.' },
    { ids: ['after_shock_treatment', 'on_thorazine', 'sedated', 'hydrotherapy_room', 'committed'] }),
    L('mind', 'Doctors and hospitals', 'experiments', 'Experiments', {
        any: 'Doctors and the government quietly test LSD, shock treatment and hypnosis on patients and prisoners, and the people tested are rarely told the truth.' },
    { ids: ['enrolled_in_trial', 'willing_subject', 'test_subject', 'experimental_drug'], scene: ['experiments'] }),
    L('mind', 'What doctors call it', 'madness', 'Seeing things', {
        he: 'A man who sees or hears things that aren’t there can be committed on a relative’s or a doctor’s signature. Shock treatment is routine in state hospitals.',
        she: 'A woman who sees or hears things that aren’t there can be committed on her husband’s or father’s signature. Shock treatment is routine in state hospitals.' },
    { ids: ['hallucinating', 'delusional', 'manic', 'schizophrenic', 'hears_voices', 'persecutory_delusion', 'grandiose_delusion', 'dementia_praecox', 'bipolar', 'capgras', 'cotard', 'split_identity'] }),
    L('mind', 'What doctors call it', 'low', 'Feeling low', {
        he: 'Men aren’t supposed to get depressed. If {who} can’t get out of bed, people will call him lazy or assume he has been drinking.',
        she: 'When {who} is low, people call it the blues or her nerves. A doctor is likely to offer pills or rest and tell her to count her blessings.' },
    { ids: ['depressed', 'despairing', 'hollowed_out', 'melancholic', 'melancholia', 'postpartum_depression', 'dysthymia', 'change_of_life_melancholia'] }),
    L('mind', 'What doctors call it', 'nerves', 'Nerves', {
        he: 'Nerves in a man are a weakness to hide. A doctor might quietly prescribe Miltown, which is popular with businessmen.',
        she: 'Doctors expect women to have nerves. {who} might be given a tranquilliser like Miltown or Valium and told to rest and not upset her husband.' },
    { cats: ['scared'], ids: ['general_anxiety', 'panic_attacks', 'agoraphobic', 'neurasthenia', 'nervous_breakdown', 'anxiety_neurosis', 'nervous_wreck'] }),
    L('mind', 'What doctors call it', 'hysterical', 'Hysterical', {
        he: 'A man with stormy moods is called temperamental. People blame drink, the war or an artist’s nature before they think of {who} as ill.',
        she: 'A woman with strong feelings is quickly called hysterical. If {who} makes a scene, a husband or father can have her admitted for a rest cure.' },
    { ids: ['borderline', 'histrionic', 'hysteria', 'hysterical', 'hysterical_personality', 'idealise_devalue', 'explosive_rage'] }),
    L('mind', 'What doctors call it', 'complex', 'A complex', {
        he: 'Freud is everywhere, and people love to talk about complexes. Someone is bound to say {who} has one and blame his mother for it.',
        she: 'Freud is everywhere. A psychiatrist would likely tell {who} that her troubles come from envying men or from her father, and that marriage and a baby would settle her.' },
    { ids: ['god_complexed', 'messiah_complex', 'inferiority_complex', 'superiority_complex', 'oedipus_complex', 'electra_complex', 'mother_complex', 'father_complex', 'napoleon_complex', 'jocasta_complex', 'laius_complex', 'don_juan_complex', 'icarus_complex', 'jonah_complex', 'adonis_complex', 'ophelia_complex', 'hero_complex', 'id_driven', 'anal_retentive'] }),
    L('mind', 'What doctors call it', 'psychopath', 'The mask of sanity', {
        he: '{who} is the kind of man doctors call a psychopath. Cleckley’s The Mask of Sanity describes how such men pass for charming and normal, so most of them are never caught.',
        she: 'Nobody expects a woman to be a psychopath. A cold, charming woman gets believed, and that protects {who}.' },
    { ids: ['psychopathic', 'sociopathic', 'sociopathic_label', 'sexual_psychopath', 'malignant_narcissism', 'mask_of_sanity'] }),
    L('mind', 'What doctors call it', 'self_regard', 'Self-admiration', {
        he: 'A man as sure of himself as {who} is admired as a go-getter. There is no diagnosis for it, and the people around him are told to make allowances.',
        she: 'A woman who wants admiration as much as {who} does is called vain, spoiled or a prima donna.' },
    { ids: ['narcissistic', 'grandiose_narcissist', 'covert_narcissist', 'vulnerable_narcissist', 'high_functioning_narcissist', 'vain'] }),
    L('mind', 'What doctors call it', 'no_word', 'No word for it', {
        he: 'There is no word yet for an adult who thinks the way {who} does. Autism is a rare diagnosis for small children and gets blamed on cold mothers, so he is just called odd.',
        she: 'There is no word yet for a woman who thinks the way {who} does. Her bluntness is called rude and unladylike, and a doctor might say schizophrenia.' },
    { ids: ['autistic', 'hyperlexic', 'stimmer', 'alexithymic', 'face_blind', 'selective_mutism', 'literal_minded'] }),
    L('mind', 'What doctors call it', 'restless', 'Restless mind', {
        he: 'A restless, scattered boy was called lazy or a troublemaker. As a man, it shows in {who} as drive, drink or losing jobs.',
        she: 'A restless, scattered girl was called flighty. As a woman, {who} gets blamed for an untidy house and forgotten errands.' },
    { ids: ['adhd', 'minimal_brain_dysfunction', 'dyslexic', 'impulsive'] }),
    L('mind', 'What doctors call it', 'old_wounds', 'Old wounds', {
        he: 'Soldiers came home from the war with battle fatigue and were told to put it behind them. {who} is expected not to talk about what happened to him.',
        she: 'There is no name for what happened to {who}. She is told to put it behind her and not upset anyone.' },
    { ids: ['traumatised', 'ptsd', 'complex_ptsd', 'shell_shocked', 'battle_fatigue', 'hypervigilant', 'memory_gaps', 'depersonalised', 'fugue', 'functional_neuro'] }),
    L('mind', 'What doctors call it', 'eating', 'Food and figure', {
        he: 'A man who won’t eat is beyond most people’s understanding. They would call it an ulcer or nerves.',
        she: 'Women are praised for watching their figure. Nobody calls {who} starving herself an illness until she faints.' },
    { ids: ['anorexic', 'bulimic', 'body_dysmorphia', 'binge_eater'] }),
    L('mind', 'What doctors call it', 'blamed_mother', 'Blaming the mother', {
        she: 'Psychiatrists often blame a cold or smothering mother for her child’s illness. {who} carries that blame whether she deserves it or not.' },
    { ids: ['blamed_mother', 'smother_mother'] }),
    L('mind', 'What doctors call it', 'adjusting', 'A troubled marriage', {
        any: 'A marriage in trouble is treated as something to fix, and the usual fix is getting the wife to adjust. Counsellors ask what she is doing wrong.' },
    { ids: ['marital_maladjustment'] }),
    L('mind', 'Pills', 'pills', 'Pills', {
        he: '{who}’s pills came from a doctor, so nobody calls them a habit.',
        she: 'Tranquillisers are in half the medicine cabinets in the country, and housewives are the biggest customers. Nobody would call {who} an addict.' },
    { ids: ['medicated', 'on_benzos', 'on_tranquillisers', 'on_sleeping_pills', 'on_diet_pills', 'on_painkillers', 'self_medicating', 'functional_addict'] }),

    // ---- Reputation and judgement ----
    L('name', 'Neighbours', 'appearances', 'What the neighbours think', {
        any: 'What the neighbours think matters a great deal. A scandal can follow a family for years, so trouble is usually hushed up rather than dealt with.' },
    { ids: ['judgemental', 'respectability_obsessed', 'keeps_up_appearances', 'reputation_at_stake'], scene: ['appearances'], world: true }),
    L('name', 'Neighbours', 'gossip', 'Gossip', {
        any: 'Gossip keeps a neighbourhood in line. {who} knows everyone’s business, and everyone knows {who}’s.' },
    { ids: ['nosy', 'gossipy', 'shit_stirrer'], world: true }),
    L('name', 'Church', 'church', 'Church', {
        he: 'Almost everyone goes to church, and a man’s sins can be confessed and forgiven. People move on.',
        she: 'Almost everyone goes to church, and a woman’s sins tend to stick. The priest may forgive {who}, but the congregation won’t forget.' },
    { ids: ['devout', 'raised_religious', 'puritanical', 'guilty_lust'], scene: ['faith'] }),
    L('name', 'A past', 'record', 'A record', {
        he: 'A man with a record finds it hard to get work. {who} has to explain the gap on every job application.',
        she: 'A woman who has been in prison is seen as ruined. People assume the worst about {who}.' },
    { ids: ['ex_convict', 'wanted', 'suspected'], world: true }),
    L('name', 'A past', 'rebel', 'Rebelling', {
        he: 'A young man who kicks against the rules is called a rebel or a juvenile delinquent. People expect {who} to grow out of it.',
        she: 'A girl who breaks the rules is called a girl gone bad. People worry about her reputation before her safety.' },
    { ids: ['rebellious', 'anti_authoritarian', 'reckless', 'bad_boy', 'troublemaker'] }),
    L('name', 'A past', 'red_scare', 'Suspicion', {
        any: 'The Red Scare taught people to report on each other. Being different in almost any way can get someone called a communist or a pervert.' },
    { ids: ['blacklisted', 'under_observation', 'informant'], scene: ['suspicion'] }),
    L('name', 'A past', 'served', 'Service', {
        he: 'Most men over thirty served in the war or in Korea, and few of them talk about it. Drinking, temper and bad dreams are treated as just how fathers are.',
        she: 'A woman who served, as a WAC or a Navy nurse, is half admired and half suspected of being unwomanly.' },
    { ids: ['ex_military', 'war_veteran', 'trained_killer'], scene: ['war'] }),

    // ---- Personality ----
    L('temper', 'Feelings', 'temper', 'Temper', {
        he: 'A man’s temper is mostly accepted. Raised voices and slammed doors are seen as how husbands and fathers are.',
        she: 'When {who} gets angry, people blame her nerves or the time of the month. A doctor might prescribe something to calm her down.' },
    { cats: ['angry'], ids: ['hot_headed'] }),
    L('temper', 'Feelings', 'cold', 'Coldness', {
        he: 'Coldness in a man looks like strength and self-control.',
        she: 'A cold woman is called frigid, a cold fish or a career girl. People wonder what went wrong with {who}.' },
    { cats: ['cold'], ids: ['emotionless', 'stoic', 'cold_blooded', 'ice_queen'] }),
    L('temper', 'Feelings', 'jealous', 'Jealousy', {
        he: 'A man’s jealousy is often seen as a sign of love. People, and sometimes the courts, sympathise with a husband protecting what he sees as his.',
        she: 'A jealous woman is called a nag, and her husband’s friends make jokes about it.' },
    { ids: ['jealous', 'possessive'] }),
    L('temper', 'Feelings', 'soft_heart', 'A soft heart', {
        he: 'A soft-hearted man risks being called a sissy or a mama’s boy. {who} may hide it behind a joke or a drink.',
        she: 'Everyone expects a woman to be gentle, so {who}’s kindness is taken for granted. People lean on her and seldom ask how she is.' },
    { ids: ['soft_hearted', 'sunshine', 'sensitive', 'secretly_sentimental'] }),
    L('temper', 'Feelings', 'caring', 'Looking after someone', {
        he: 'Looking after someone fits what a man is supposed to be, a provider and protector. A husband or a doctor caring for a woman is respected for it.',
        she: 'Caring for others is simply expected of a woman, so few people thank {who} for it.' },
    { cats: ['closeness'], ids: ['protective', 'protector_role', 'service_giving'] }),
    L('temper', 'Feelings', 'sacrifice', 'Self-sacrifice', {
        he: 'A man who gives things up for his family is doing his duty, and people say so.',
        she: 'Self-sacrifice is held up as a woman’s greatest virtue. Everyone will praise {who} for putting others first, and nobody will tell her to stop.' },
    { ids: ['selfless', 'self_sacrificing', 'martyr_complex', 'loyal_to_a_fault'] }),
    L('temper', 'Manner', 'brains', 'Brains', {
        he: 'A clever man is admired, and {who}’s brains could take him to a degree and a profession.',
        she: 'Girls are told not to seem smarter than the man. {who} may hide how clever she is, especially on dates.' },
    { ids: ['genius', 'bookish', 'nerdy'] }),
    L('temper', 'Manner', 'pride', 'Pride', {
        he: 'A proud man is respected, so long as he can back it up.',
        she: 'A woman who is proud of herself is called stuck-up. {who} is supposed to wait to be praised.' },
    { ids: ['proud', 'confident', 'cocky', 'arrogant', 'superior', 'snobbish', 'egotistical'] }),
    L('temper', 'Manner', 'speaks_mind', 'Speaking out', {
        he: 'A man who speaks his mind is called straight-talking.',
        she: 'Women are expected to keep their opinions to themselves, especially in front of men. {who} speaking her mind will be called pushy or unladylike.' },
    { ids: ['stubborn', 'argumentative', 'blunt', 'contrarian', 'straightforward'] }),
    L('temper', 'Manner', 'sharp_tongue', 'A sharp tongue', {
        he: 'A sharp wit makes a man good company, as long as he doesn’t aim it at his boss.',
        she: 'A woman with a sharp tongue is called a shrew. Men may laugh at {who}’s jokes and still think she is too much.' },
    { ids: ['sarcastic', 'wry', 'deadpan', 'snarky', 'mocking'] }),
    L('temper', 'Manner', 'quiet', 'The quiet one', {
        he: 'A quiet man is respected as the strong, silent type.',
        she: 'Quiet girls are seen as nice girls, and {who}’s silence will often be taken as agreement.' },
    { ids: ['introverted', 'wallflower', 'shy'] }),
    L('temper', 'Manner', 'loud', 'Life of the party', {
        he: 'A man who is the life of the party is good company and good for business.',
        she: 'A woman who is the life of the party is fun on the night and talked about the next morning.' },
    { ids: ['extroverted', 'life_of_party', 'bubbly', 'party_animal'] }),
    L('temper', 'Manner', 'manners', 'Manners', {
        he: 'Good manners are part of being a gentleman. Standing when a woman comes in and walking her to her door are what people expect of {who}.',
        she: 'A lady is judged by her manners. {who}’s gloves, her posture and the way she speaks all tell people where she comes from.' },
    { ids: ['gentlemanly', 'classy', 'elegant', 'dignified', 'suave', 'voice_cultivated'] }),
    L('temper', 'Manner', 'crude', 'Crude talk', {
        he: 'Crude talk is fine among men, and {who} is expected to stop when ladies are present.',
        she: 'A woman who swears shocks the room. Nice women are not supposed to know those words.' },
    { ids: ['crude', 'vulgar', 'trashy'] }),
    L('temper', 'Manner', 'artistic', 'The artistic type', {
        he: 'An artistic man is a little suspect. Fathers want him to get a real job, and other men wonder about him, so only the Village and the gallery crowd let {who} be himself.',
        she: 'Painting or poetry is a nice hobby for a girl, to be put away once there are children. A woman who takes her art seriously is called selfish.' },
    { ids: ['artistic', 'poetic', 'tortured_artist', 'amoral_artist', 'mad_artist'] }),
    L('temper', 'Manner', 'gender_ways', 'Not like the others', {
        he: 'A man with soft or feminine ways is suspected of being queer. Other men may bully {who} or keep their distance.',
        she: 'A woman who dresses or carries herself like a man is quickly suspected of being a lesbian.' },
    { ids: ['feminine', 'girlish', 'prissy', 'masculine', 'swagger'], when: ['againstType'] }),
    L('temper', 'Manner', 'bad_boy', 'Trouble', {
        he: 'Girls are warned away from men like {who}, the type films like Rebel Without a Cause made famous. The warning only makes some of them more interested.',
        she: 'A cold, glamorous woman is the femme fatale of every film. People are drawn to {who} and don’t trust her.' },
    { ids: ['bad_boy', 'charming_rogue', 'chick_magnet', 'womaniser', 'femme_fatale', 'black_widow'] }),
    L('temper', 'Manner', 'immature', 'Never grown up', {
        he: 'Grown men are expected to settle down. People wonder when {who} is going to grow up.',
        she: 'A woman who never quite grows up is called flighty. People expect a husband to settle her.' },
    { ids: ['immature', 'puer_aeternus', 'peter_pan_complex'] }),

    // ---- Drink, smoke and drugs ----
    L('vices', 'Drink', 'drink', 'Drinking', {
        he: 'Heavy drinking is part of a man’s working life, from the three-martini lunch to the bar after work. People call {who} one of the boys until it costs him his job.',
        she: 'Ladies are supposed to sip. If {who} is seen drunk, people talk, and a woman who drinks alone is pitied and judged.' },
    { ids: ['hazy_drunk', 'drunk', 'alcoholic', 'tipsy', 'blackout_drunk', 'weepy_drunk', 'hungover'] }),
    L('vices', 'Smoke', 'smoke', 'Smoking', {
        he: 'Almost everyone smokes, in offices, in hospitals and in bed. Nobody would think twice about {who} lighting up.',
        she: 'Almost everyone smokes, and cigarette ads promise women it will keep them slim. {who} smoking is normal and a little glamorous.' },
    { ids: ['smoker'], turns: ['smoking', 'smoke_breath'] }),
    L('vices', 'Drugs', 'drugs', 'Drugs', {
        he: 'Drugs belong to jazz clubs, beatniks and the newspapers’ dope fiends. One arrest for marijuana can mean years in prison for {who}.',
        she: 'A woman on drugs is the ruined girl of every pulp novel. Police and parents would see {who} as lost.' },
    { ids: ['high', 'stoned', 'coked_up', 'tripping', 'junkie', 'withdrawal', 'substance_abuser', 'strung_out'] }),

    // ---- Out in the world ----
    L('world', 'Going out', 'bars', 'Bars', {
        he: 'Bars are a man’s world. {who} can drink there alone and nobody thinks twice.',
        she: 'Some bars won’t serve a woman on her own, and one who drinks alone is assumed to be looking for company.' },
    { scene: ['bars'], world: true }),
    L('world', 'Going out', 'dining', 'Dining out', {
        he: 'At a good restaurant, {who} orders for both of them, tastes the wine and pays.',
        she: 'At a good restaurant, the man orders for both of them and pays. A lady’s menu may not even show the prices.' },
    { scene: ['dining'], when: ['mixed'], world: true }),
    L('world', 'Going out', 'public', 'In public', {
        any: 'Couples keep affection modest in public. A kiss in the street draws looks, and anything more could bring the police.' },
    { scene: ['public'], when: ['romance'], world: true }),
    L('world', 'Going out', 'night', 'After dark', {
        he: 'A man out late is just out.',
        she: 'A woman out after midnight is assumed to be up to no good.' },
    { scene: ['night'], world: true }),
    L('world', 'Going out', 'road', 'Cars', {
        any: 'A car means freedom and privacy. There are drive-ins, lovers’ lanes and motels that ask no questions, and nobody wears a seatbelt.' },
    { scene: ['road'], world: true }),
    L('world', 'Going out', 'beach', 'The beach', {
        he: 'Nobody minds a man watching the girls at the beach.',
        she: 'Bikinis are new and still shocking. Most women wear one-pieces, and the boardwalk watches the ones who don’t.' },
    { scene: ['beach'], world: true }),
    L('world', 'Going out', 'diner', 'The diner', {
        any: 'The all-night diner is the one place anyone can sit. Truckers, cops, insomniacs and girls with nowhere else to go all drink the same coffee.' },
    { scene: ['diner'], world: true }),
    L('world', 'Work and the law', 'office', 'The office', {
        he: 'Office life runs on suits, cigarette smoke and long lunches with a drink. {who} is expected to fit in.',
        she: 'In the office, the men have the desks and the doors and the women type outside them. Passes from the boss are treated as part of a girl’s job.' },
    { scene: ['office'], world: true }),
    L('world', 'Work and the law', 'police', 'The police', {
        he: 'Police can be rough. Until 1966 nobody has to tell a suspect his rights, and confessions are sometimes beaten out of people.',
        she: 'A woman questioned by the police may face a room of men with no other woman present.' },
    { scene: ['police'], ids: ['police_officer', 'corrupt_cop'], world: true }),
    L('world', 'Work and the law', 'guns', 'Guns', {
        any: 'Guns are ordinary. Many homes keep a revolver in the nightstand or a rifle in the truck, and in most places no licence is needed to buy one.' },
    { scene: ['guns'], world: true }),
    L('world', 'Life around them', 'youth', 'Teenagers', {
        any: 'Teenagers have money, cars and rock and roll for the first time. Parents and newspapers worry about juvenile delinquents.' },
    { scene: ['youth'], world: true }),
    L('world', 'Life around them', 'mourning', 'Mourning', {
        any: 'Death has strict customs. There is a viewing at the funeral home, black clothes for weeks and casseroles from the neighbours.' },
    { scene: ['mourning'], world: true }),
    L('world', 'Life around them', 'far_out', 'Far from help', {
        any: 'Out here, help is far away. There is one phone line the neighbours listen in on, a sheriff who knows every family, and miles of dark road.' },
    { scene: ['nowhere'] }),
];
