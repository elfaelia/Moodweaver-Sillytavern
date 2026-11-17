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
