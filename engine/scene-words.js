// Music: what the story itself says is happening, read from the newest reply (and your last message) with plain
// word lists. Moods can lag a reply or two behind, and a kiss is a kiss whatever the mood sliders say, so the
// song picker trusts these words as well. Nothing here is sent to Claude and nothing costs tokens.
//
// Each list: [weight, regex]. A strong cue counts 1, a weaker one 0.5. A kind of scene is "on" at 2 or more.

const W = (weight, words) => [weight, new RegExp(`\\b(?:${words})`, 'gi')];

export const SCENE_WORDS = {
    // Slow burn and foreplay: closeness that is clearly heading to bed.
    intimate: [
        W(1, 'kiss(?:es|ed|ing)?\\b|make[s]? out|making out|undress(?:es|ed|ing)?|unbutton(?:s|ed|ing)?|unzip(?:s|ped|ping)?|unclasp|unhook(?:s|ed)? (?:her|his|my) bra|straddl\\w*|grind(?:s|ing)? (?:against|into)|arous\\w*|moan(?:s|ed|ing)?|whimper(?:s|ed|ing)?|naked|nude|bare (?:skin|chest|shoulders?|thighs?)|strip(?:s|ped|ping)? (?:off|her|him)|pull(?:s|ed)? (?:her|him) (?:closer|into his lap|into her lap|onto)|(?:his|her) lap|lips? (?:on|against|trail\\w*|brush\\w*) (?:her|his|my|your)|teeth (?:graz\\w*|on) (?:her|his)|(?:his|her) mouth (?:on|against|finds|moves)|breath (?:hitch\\w*|catch\\w*|stutter\\w*)|foreplay|want(?:s|ed)? (?:you|her|him) so|need(?:s|ed)? you (?:now|so)|brush(?:es|ed)? (?:the )?hair (?:from|out of) (?:her|his) face|cup(?:s|ped)? (?:her|his) (?:face|cheek|jaw)|thumb (?:along|over|across) (?:her|his) (?:lip|jaw|cheek)|trac(?:es|ed|ing) (?:her|his) (?:jaw|lips?|collarbone|spine)|(?:his|her) forehead (?:to|against) (?:hers|his)'),
        W(0.5, 'lips?\\b|mouth\\b|tongue|neck\\b|collarbone|throat\\b|thighs?\\b|hips?\\b|waist\\b|breath(?:less|ing)?\\b|gasp\\w*|shiver\\w*|tremb\\w*|caress\\w*|strok(?:e|es|ed|ing)\\b|nuzzl\\w*|fingertips|touch(?:es|ed|ing)?\\b|skin\\b|flush(?:ed)?\\b|blush\\w*|ache\\b|aching|hunger\\b|groan\\w*|bed\\b|sheets\\b|pinn(?:ed|ing) (?:her|him) (?:to|against)|pressed against|heat (?:between|pool\\w*)'),
    ],
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
