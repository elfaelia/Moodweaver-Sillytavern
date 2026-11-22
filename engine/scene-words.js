// Music: what the story itself says is happening, read from the newest reply (and your last message) with plain
// word lists. Moods can lag a reply or two behind, and a kiss is a kiss whatever the mood sliders say, so the
// song picker trusts these words as well. Nothing here is sent to Claude and nothing costs tokens.
//
// Each list: [weight, regex]. A strong cue counts 1, a weaker one 0.5. A kind of scene is "on" at 2 or more.

const W = (weight, words) => [weight, new RegExp(`\\b(?:${words})`, 'gi')];

export const SCENE_WORDS = {
    // Slow burn and foreplay: closeness that is clearly heading to bed. A plain kiss or a soft touch counts only half
    // here (and half to Sweet too), so a first kiss in a sweet confession isn't read as foreplay.
    intimate: [
        W(1, 'make[s]? out|making out|undress(?:es|ed|ing)?|unbutton(?:s|ed|ing)?|unzip(?:s|ped|ping)?|unclasp|unhook(?:s|ed)? (?:her|his|my) bra|straddl\\w*|grind(?:s|ing)? (?:against|into)|arous\\w*|moan(?:s|ed|ing)?|whimper(?:s|ed|ing)?|naked|nude|bare (?:skin|chest|shoulders?|thighs?)|strip(?:s|ped|ping)? (?:off|her|him)|pull(?:s|ed)? (?:her|him) (?:into his lap|into her lap|onto)|(?:his|her) lap|lips? (?:trail\\w*|on|against) (?:her|his|my|your) (?:neck|throat|collarbone|chest|skin|shoulder)|kiss(?:es|ed|ing)? (?:down|along|up) (?:her|his)|deepen(?:s|ed|ing)? the kiss|kiss(?:es|ed|ing)? (?:her|him) (?:hard|hungrily|deeply|roughly)|teeth (?:graz\\w*|on) (?:her|his)|(?:his|her) mouth (?:on|against|finds|moves)|breath (?:hitch\\w*|catch\\w*|stutter\\w*)|foreplay|want(?:s|ed)? (?:you|her|him) so|need(?:s|ed)? you (?:now|so)|pinn(?:ed|ing) (?:her|him) (?:to|against)|heat (?:between|pool\\w*)|hands? (?:slid\\w*|slip\\w*|roam\\w*) (?:under|beneath|up)'),
        W(0.5, 'kiss(?:es|ed|ing)?\\b|lips?\\b|mouth\\b|tongue|neck\\b|collarbone|throat\\b|thighs?\\b|hips?\\b|waist\\b|breathless\\b|gasp\\w*|shiver\\w*|tremb\\w*|caress\\w*|strok(?:e|es|ed|ing)\\b|nuzzl\\w*|fingertips|skin\\b|flush(?:ed)?\\b|ache\\b|aching|hunger\\b|groan\\w*|bed\\b|sheets\\b|pressed against|cup(?:s|ped)? (?:her|his) (?:face|cheek|jaw)|thumb (?:along|over|across) (?:her|his) (?:lip|jaw|cheek)|trac(?:es|ed|ing) (?:her|his) (?:jaw|lips?|collarbone|spine)'),
    ],
    // Sweet, playful, wholesome: a confession, giggling, holding hands, a kiss on the cheek. Weighs against heat.
    sweet: [
        W(1, 'giggl\\w*|grin(?:s|ned|ning)?\\b|beam(?:s|ed|ing)\\b|adorabl\\w*|cute\\b|bashful\\w*|fluster\\w*|butterflies|heart (?:flutter\\w*|skip\\w*|swell\\w*)|hold(?:s|ing)? (?:her|his) hand|held (?:her|his) hand|holding hands|(?:lace|laces|laced|lacing|twin\\w*|interlac\\w*) (?:their|her|his) fingers|fingers (?:lace|laced|intertwin\\w*|interlac\\w*)|hug(?:s|ged|ging)?\\b|cuddl\\w*|snuggl\\w*|peck(?:s|ed)?\\b|kiss(?:es|ed)? (?:on )?(?:her|his|the) (?:cheek|forehead|nose|knuckles|hand|temple|hair)|playful\\w*|tickl\\w*|wink(?:s|ed|ing)?\\b|silly\\b|dork\\w*|teas(?:e|es|ed|ing)\\b|chuckl\\w*|laugh(?:s|ed|ing)? (?:softly|together|at (?:him|her))|shy(?:ly)?\\b|sweet(?:ly)?\\b|wholesome|picnic|bouquet|flowers? for (?:her|him)'),
        W(0.5, 'smil(?:e|es|ed|ing)\\b|laugh\\w*|soft(?:ly)?\\b|gentl(?:e|y)\\b|warm(?:th)?\\b|blush\\w*|nervous\\w*|fond\\w*|happy|delight\\w*|forehead (?:to|against) (?:hers|his)|brush(?:es|ed)? (?:the )?hair (?:from|out of) (?:her|his) face|tuck(?:s|ed)? (?:a strand|her hair)'),
    ],
    // Saying it: a love confession (sets Love confession, and counts as Sweet).
    confess: [W(1, "i love you|i'm in love with you|i am in love with you|in love with (?:you|her|him)|love you\\b|confess(?:es|ed|ing)?\\b|confession|i like you|have feelings for|fallen for you|fell for you"), W(0.5, 'admit(?:s|ted|ting)?\\b|feelings\\b|heart\\b')],
    // Flirting: teasing, banter, a wink.
    flirt: [W(1, 'flirt\\w*|wink(?:s|ed|ing)?\\b|teas(?:e|es|ed|ing)\\b|smirk\\w*|banter\\w*|coy(?:ly)?\\b|bat(?:s|ted)? (?:her|his) (?:eye)?lashes'), W(0.5, 'grin\\w*|playful\\w*|cheek(?:y|ily)\\b')],
    // An actual sex scene.
    sex: [
        W(1, 'thrust\\w*|inside (?:her|him|me|you)\\b|cock\\b|cunt\\b|puss(?:y|ies)\\b|clit\\w*|climax\\w*|orgasm\\w*|come for me|cum(?:s|ming)?\\b|fuck(?:s|ed|ing)? (?:her|him|me|you)\\b|penetrat\\w*|erection|rides? (?:him|her)\\b|riding (?:him|her)\\b|(?:his|her) length\\b|buried (?:himself|herself|deep)|spread(?:s)? her (?:legs|thighs)|between her legs'),
        W(0.5, 'wet\\b|hard against|slick\\w*|pound\\w*|deeper\\b|harder\\b|rhythm\\b|naked\\b|sweat\\w*'),
    ],
    violence: [W(1, 'stab\\w*|blood(?:y|ied)?\\b|knife|blade\\b|gun\\b|shot\\b|shoot\\w*|punch\\w*|beat(?:s|ing)? (?:her|him)|strangl\\w*|scream\\w*|kill\\w*|murder\\w*|wound\\w*|bone[s]? (?:crack|snap)\\w*'), W(0.5, 'hit\\b|slap\\w*|shove\\w*|bruis\\w*|crack\\w*|choke\\w*|struggl\\w*')],
    hunted: [W(1, 'chas(?:e|es|ed|ing)\\b|footsteps|flee\\w*|fled\\b|run(?:s|ning)? (?:away|for)|ran (?:away|for)|hide|hiding|hid\\b|hunt(?:s|ed|ing)?\\b|behind (?:her|him) in the dark|corner(?:ed)?\\b'), W(0.5, 'run\\b|ran\\b|dark\\b|shadow\\w*|breath(?:ing)? (?:hard|fast)|heart pound\\w*')],
    grief: [W(1, 'funeral|grave(?:side|stone|yard)?\\b|mourn\\w*|coffin|casket|died\\b|death\\b|his body|her body was|wake for|eulogy|buried (?:her|him)'), W(0.5, 'tears?\\b|sob\\w*|wept\\b|weep\\w*|gone\\b|loss\\b')],
    sleep: [W(1, 'asleep|falls? asleep|fell asleep|doz(?:e|es|ed|ing)\\b|drowsy|yawn\\w*|sleep(?:s|ing)?\\b'), W(0.5, 'tired|eyes? (?:closing|heavy)|bed\\b')],
    party: [W(1, 'party|dance floor|danc(?:e|es|ed|ing)\\b|nightclub|the club|music (?:blar|thump|pound)\\w*|cocktail\\w*'), W(0.5, 'drinks?\\b|crowd\\w*|bar\\b|laugh\\w*')],
    driving: [W(1, 'driv(?:e|es|ing)\\b|drove\\b|steering wheel|highway|passenger seat|the car\\b|backseat|back seat|windscreen|windshield'), W(0.5, 'road\\b|engine\\b|headlights')],
    // 1.89: romance apart from sex. A slow, earnest kiss, a slow dance, longing, "I love you" said with weight.
    romantic: [W(1, "slow dance|slow-danc\\w*|sway(?:s|ed|ing)? together|danc(?:e|es|ed|ing) slowly|kiss(?:es|ed)? (?:her|him) (?:slowly|softly|gently|tenderly)|tender(?:ly|ness)?\\b|adore(?:s|d)?\\b|devot\\w*|yearn\\w*|longing\\b|lovesick|cherish\\w*|my love\\b|my darling|my dear\\b|sweetheart|in love\\b|love (?:her|him) so|all (?:i|i've) ever wanted|stay with me|don't leave|missed you"), W(0.5, 'kiss\\w*|moonlight|candle\\w*|hand (?:on|over) (?:her|his) heart|forever\\b|always\\b|heart\\b|darling|whisper\\w*')],
    slowdance: [W(1, 'slow dance|slow-danc\\w*|sway(?:s|ed|ing)? (?:together|to the music)|danc(?:e|es|ed|ing) (?:slowly|close)|first dance|may i have this dance')],
    // Action: fast and physical.
    chase: [W(1, 'chas(?:e|es|ed|ing)\\b|sprint\\w*|tyres? screech\\w*|tires? screech\\w*|swerv\\w*|floor(?:s|ed)? it|getaway|pursu\\w*|sirens? (?:wail|scream|behind)|outrun\\w*|vault(?:s|ed)? (?:over|the)|dives? (?:for|behind)|ducks? (?:behind|under)'), W(0.5, 'run(?:s|ning)?\\b|ran\\b|faster\\b|adrenaline|engine roar\\w*|speed\\w*')],
    fight: [W(1, 'punch\\w*|brawl\\w*|fist ?fight|swing(?:s)? (?:at|for)|swung (?:at|for)|tackl\\w*|headbutt\\w*|elbow(?:s|ed)? (?:him|her)|knee(?:s|d)? (?:him|her)|throw(?:s)? a punch|threw a punch|jab\\w*|uppercut|choke ?hold|grappl\\w*'), W(0.5, 'fist\\w*|knuckles|shove\\w*|slam(?:s|med)? (?:him|her) (?:into|against)|bloody nose|split lip')],
    heist: [W(1, 'heist|rob(?:s|bed|bing|bery)\\b|hold ?up\\b|stick ?up|break(?:s|ing)? in\\b|broke in\\b|jimm(?:y|ied)|pick(?:s|ed)? the lock|crowbar|the safe\\b|the vault|ski masks?|cas(?:e|ed|ing) the|the job\\b|lookout'), W(0.5, 'alarm\\w*|security guards?|cameras?\\b|stash\\w*')],
    // Drama: a row between people who matter.
    row: [W(1, "how could you|you lied|liar\\b|i trusted you|get out\\b|i'm done|we're done|it's over|shout(?:s|ed|ing)?\\b|yell(?:s|ed|ing)?\\b|scream(?:s|ed)? at|slam(?:s|med)? the door|storm(?:s|ed)? out|ultimatum|don't you dare|what the hell is wrong with you|accus\\w*"), W(0.5, 'furious|glar\\w*|voice (?:rises|cracks|breaks)|tears? (?:of rage|streaming)|throws? (?:the|a) (?:glass|plate|phone)')],
    betrayal: [W(1, "betray\\w*|cheat(?:s|ed|ing)? on|affair\\b|behind my back|went behind|caught (?:him|her|them)|found out (?:about|that)|lied to (?:me|you|her|him)|two-?tim\\w*|sold (?:me|us|him|her) out|ratted|snitch\\w*|rat\\b|turned on (?:me|him|her)"), W(0.5, 'lies\\b|lying\\b|secret\\w*|truth\\b')],
    // Tense: uneasy, nothing has happened yet.
    standoff: [W(1, "nobody moves|no one moves|don't move|hands where i can see|stand(?:s)? off|standoff|stares? (?:him|her) down|eyes (?:narrow|never leave)|holds? (?:his|her) breath|held (?:his|her) breath|too quiet|something's off|something is off|watching (?:him|her|them) closely|hand (?:drifts|moves|rests) (?:to|near|on) (?:the|his|her) (?:gun|knife|pocket|waistband)|wary|warily|suspicious\\w*|cops?\\b|police (?:car|cruiser|lights)|undercover"), W(0.5, 'tense\\w*|tension|silence\\b|careful\\w*|uneas\\w*|nervous\\w*|sweat\\w*|glanc\\w*')],
    deal: [W(1, "the deal\\b|a deal\\b|deal(?:s|ing)? (?:drugs|dope|weed|coke|pills|product)|the product|re-?up|front(?:ed)? (?:me|him|her)|counts? (?:the|out the) (?:cash|money|bills)|wad of (?:cash|bills)|baggie\\w*|ounce\\w*|eighth\\b|the stash|the plug\\b|my plug\\b|supplier|the buy\\b|cut (?:it|the) with|weigh(?:s|ed)? (?:it|out)|the scale\\b"), W(0.5, 'cash\\b|money\\b|buyer\\w*|customer\\w*|corner\\b|business\\b')],
    hustle: [W(1, "on the corner|corner boys?|hustl\\w*|slinging|the block\\b|cruis(?:e|es|ed|ing)\\b|hanging (?:out|around) (?:outside|on|by)|skat(?:e|es|ed|ing|eboard\\w*)\\b|smok(?:es|ed|ing) (?:a cigarette|a joint|outside)|lean(?:s|ed|ing)? against (?:the|his|her) (?:car|wall)"), W(0.5, 'street\\w*|alley\\w*|parking lot|gas station|cigarette\\w*|swagger\\w*')],
    // Kinds of high.
    stoned: [W(1, "joint\\b|blunt\\b|bong\\b|spliff|weed\\b|pot\\b|marijuana|stoned|baked\\b|high as|hits? the (?:joint|blunt|bong|pipe)|took a hit|takes a hit|edible\\w*|munchies"), W(0.5, 'smoke\\b|haze\\b|giggl\\w*|lazy\\b|mellow')],
    rolling: [W(1, "rolling\\b|molly\\b|ecstasy|\\bmdma\\b|\\bx\\b pill|popped (?:a|some) (?:pill|molly|tab)|jaw clench\\w*|chewing (?:her|his) cheek|everything feels (?:so )?good|love everyone"), W(0.5, 'euphori\\w*|bass\\b|strobe\\w*|glow ?sticks?|pupils (?:huge|blown|wide)')],
    tripping: [W(1, "tripping|trippin|acid\\b|\\blsd\\b|tabs? of|shrooms|mushrooms|psilocybin|peyote|mescaline|\\bdmt\\b|hallucinat\\w*|the walls (?:breathe|breathing|melt\\w*)|colou?rs (?:bleed|melt|swirl)|melting|kaleidoscop\\w*"), W(0.5, 'swirl\\w*|breathing walls|patterns\\b|cosmic|ego\\b')],
    wired: [W(1, "coke\\b|cocaine|blow\\b|a line\\b|lines of|bump(?:s)? of|snort\\w*|speed\\b|amphetamine\\w*|meth\\b|crank\\b|crystal\\b|tweak\\w*|adderall|uppers|wired\\b|hasn't slept in|haven't slept in|grinding (?:his|her) teeth|jaw working|sniff(?:s|ed|ing)? hard|wipes? (?:his|her) nose"), W(0.5, "jitter\\w*|twitch\\w*|can't sit still|talking fast|racing\\b|paranoi\\w*")],
    nodding: [W(1, "heroin|smack\\b|junk\\b|junkie|dope\\b(?! ?sick)|nodding (?:off|out)|nods? off|nodded off|on the nod|opioid\\w*|oxy\\w*|percocet|codeine|fentanyl|morphine|lean\\b|downers|quaaludes?|barbiturat\\w*|valium|xanax|ties? off|tied off|cooks? (?:it|the) (?:on|in) (?:a|the) spoon|the spoon\\b"), W(0.5, 'heavy-lidded|eyelids? (?:droop|heavy)|warm\\b|slump\\w*|drool\\w*')],
    drunk: [W(1, "drunk\\b|wasted\\b|hammered|plastered|tipsy|sloshed|bourbon|whiske?y|vodka|tequila|gin\\b|rum\\b|beers?\\b|six-?pack|shots?\\b of|takes a swig|took a swig|swig\\w*|bottle of|slurr\\w*|hiccup\\w*|stumbl\\w*"), W(0.5, 'drink(?:s|ing)?\\b|booze|liquor|glass\\b|bar\\b')],
    comedown: [W(1, "comedown|coming down|come down|crash(?:ing)? (?:hard|out)|withdrawal|dope ?sick|sick\\b and shaking|jonesing|cold sweat|the shakes|shaking hands|needs? a fix|need another|itch(?:es|ing)? (?:under|for)|hangover|hung ?over"), W(0.5, 'nause\\w*|shiver\\w*|grey\\b|hollow\\w*|empty\\b|sweat\\w*')],
};
// Strip HTML, hidden notes and code blocks so only the story's own words count.
export const plainStory = s => String(s ?? '').replace(/<!--[\s\S]*?-->/g, ' ').replace(/```[\s\S]*?```/g, ' ').replace(/<details[\s\S]*?<\/details>/gi, ' ').replace(/<[^>]+>/g, ' ');

// texts: [{ text, weight }]: the newest reply at weight 1, your last message at about 0.6.
// Returns { intimate, sex, violence, … } as scores, and on: the kinds at 2 or more.
export function readScene(texts = []) {
    const score = {};
    for (const [kind, lists] of Object.entries(SCENE_WORDS)) {
        let s = 0;
        for (const { text, weight = 1 } of texts) {
            const t = plainStory(text);
            for (const [w, re] of lists) s += Math.min(6, (t.match(re) ?? []).length) * w * weight;
        }
        score[kind] = Math.round(s * 10) / 10;
    }
    return { score, on: new Set(Object.entries(score).filter(([, v]) => v >= 2).map(([k]) => k)) };
}

// ---- Stings: a big beat in the newest reply ----
// One sudden, unmistakable moment: a slap, a gunshot, a door kicked in, "I love you", a death, a first kiss, a
// mask coming off. Each has a song list of its own (sheet column Sting). Only strong, specific wording counts, so
// an ordinary reply doesn't set one off. Only the newest reply and your last message are read.
export const BEATS = [
    { id: 'violence', label: 'Violence', re: /\b(?:slap(?:s|ped)? (?:her|him|me|you)|backhand(?:s|ed)?|punch(?:es|ed)? (?:her|him|me|you)|gunshot|gun goes off|pulls? the trigger|pulled the trigger|fires? (?:a|the) (?:gun|shot)|stabs? (?:her|him|me|you)|stabbed|plunges? the (?:knife|blade|needle)|throat (?:is )?(?:cut|slit)|smash(?:es|ed)? (?:her|his|my|your) head|blood (?:sprays|spatters|splatters|pours))/i },
    { id: 'entrance', label: 'Someone bursts in', re: /\b(?:door (?:is )?(?:kicked|smashed|bursts?|slams?|flies|flew|crashes) (?:in|open)|kick(?:s|ed)? (?:the|a) door (?:in|open|down)|burst(?:s)? (?:in|into the room|through the door)|barg(?:es|ed) in|storm(?:s|ed) in(?:to)?\b|break(?:s)? down the door|broke down the door)/i },
    { id: 'reveal', label: 'Reveal', re: /\b(?:the truth (?:is|was|comes out|came out)|it was (?:you|him|her) all along|unmask(?:s|ed)?|recogni[sz]es? (?:the|his|her) (?:face|voice)|finds? out (?:that|who|what)|found out (?:that|who|what)|the file (?:says|reads)|discovers? (?:the body|the truth|what (?:he|she) did)|isn't who (?:he|she) said|wasn't who (?:he|she) said|(?:has|had) been lying (?:to (?:her|him|me|you) )?(?:all along|the whole time))/i },
    { id: 'confession', label: 'Love confession', re: /\b(?:i love you|i'm in love with you|i am in love with you|i've fallen for you|i have feelings for you|i want you\. only you|marry me)\b/i },
    { id: 'kiss', label: 'First kiss', re: /\b(?:first kiss|kiss(?:es|ed)? (?:her|him|me|you) (?:for the first time|hard|fiercely|desperately)|crash(?:es)? (?:his|her|their) (?:lips|mouth)|lips crash|mouth (?:crashes|slams) (?:into|against|onto))/i },
    { id: 'death', label: 'Death', re: /\b(?:dies\b|died\b|stops? breathing|stopped breathing|last breath|no pulse|flatlin\w*|heart (?:stops|stopped)|goes still forever|lifeless|is dead\b|was dead\b)/i },
];
export function beatsIn(text) { const t = plainStory(text); return BEATS.filter(b => b.re.test(t)).map(b => b.id); }

// ---- In-story radio: something in the scene is playing music the characters can hear ----
// on: a radio, jukebox or record player switched on or playing. off: switched off, smashed, the music stops.
const RADIO_ON = /\b(?:radio|jukebox|record player|phonograph|gramophone|turntable|hi-fi|hifi|stereo|wireless|transistor|car radio|the needle (?:drops|settles)|drops? the needle|puts? (?:a|on a|the) record|record (?:spins|plays|crackles|skips)|on the record|band (?:plays|is playing|strikes up)|music (?:drifts|plays|crackles|spills) from)/i;
const RADIO_OFF = /\b(?:(?:turns?|switch(?:es)?|clicks?|shuts?|snaps?) (?:off |)(?:the )?(?:radio|jukebox|record player|music|stereo)(?: off)?|(?:radio|record|music|jukebox) (?:dies|cuts out|stops|goes quiet|falls silent)|lifts? the needle|unplugs? the)/i;
export const radioIn = text => { const t = plainStory(text); return RADIO_OFF.test(t) ? 'off' : RADIO_ON.test(t) ? 'on' : ''; };
// What the radio is, for the line to Claude ("a jukebox"), from the same words.
export function radioKind(text) {
    const t = plainStory(text).toLowerCase();
    for (const [k, label] of [['jukebox', 'a jukebox'], ['record player', 'a record player'], ['phonograph', 'a phonograph'], ['gramophone', 'a gramophone'], ['turntable', 'a record player'], ['car radio', 'the car radio'], ['transistor', 'a transistor radio'], ['band', 'a band'], ['record', 'a record player'], ['stereo', 'a stereo'], ['radio', 'a radio'], ['wireless', 'a wireless']]) if (t.includes(k)) return label;
    return 'a radio';
}
