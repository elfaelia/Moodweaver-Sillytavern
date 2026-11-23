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
        W(1, 'make[s]? out|making out|lap ?danc\\w*|grind(?:s|ing|ed)? (?:on|in) (?:his|her) lap|undress(?:es|ed|ing)? (?:her|him|me|you|each other)|unbutton(?:s|ed|ing)? (?:her|his|my|your) (?:shirt|blouse|jeans|pants|trousers|dress)|unzip(?:s|ped|ping)? (?:her|his|my|your) (?:jeans|pants|trousers|dress|fly)|unclasp(?:s|ed)? (?:her|my) bra|unhook(?:s|ed)? (?:her|his|my) bra|straddl\\w*|grind(?:s|ing|ed)? (?:against|into) (?:her|him|me|you|each other|his|my|your)\\b|aroused|arousal|moan(?:s|ed|ing)? (?:his|her|my|your) name|moan(?:s|ed|ing)? (?:into|against) (?:his|her)|(?:soft|low|breathy|needy) moan|pull(?:s|ed)? (?:her|him) onto (?:the bed|the mattress|his body|her body)|lips? (?:trail\\w*|on|against) (?:her|his|my|your) (?:neck|throat|collarbone|chest|skin|shoulder)|kiss(?:es|ed|ing)? (?:down|along|up) (?:her|his) (?:neck|throat|jaw|chest|stomach|body|spine|thigh)|deepen(?:s|ed|ing)? the kiss|kiss(?:es|ed|ing)? (?:her|him) (?:hard|hungrily|deeply|roughly)|teeth (?:graz\\w*|on) (?:her|his) (?:neck|throat|lip|skin|ear|shoulder)|(?:his|her) mouth (?:on|against|finds|moves (?:down|over|along)) (?:hers|his|her|him)|foreplay|heat (?:between (?:her|his) (?:legs|thighs)|pool\\w* (?:low|between|in her))|hands? (?:slid\\w*|slip\\w*|roam\\w*) (?:under|beneath|up) (?:her|his) (?:shirt|dress|skirt|top|waistband|sweater|blouse|thighs?)|hands? roam\\w*|kiss(?:es|ed|ing)? (?:her|his) (?:neck|throat|collarbone|chest|stomach|inner thigh|thighs?)|strok(?:es|ed|ing) (?:her|his) (?:inner )?thighs?|(?:fingers|hand) (?:slid\\w*|creep\\w*|trail\\w*) up (?:her|his) (?:inner )?thighs?'),
        W(0.5, 'whimper\\w*|breath (?:hitch\\w*|catch\\w*|stutter\\w*)|want(?:s|ed)? (?:you|her|him) so|need(?:s|ed)? you (?:now|so)|pinn(?:ed|ing) (?:her|him) (?:to|against)|naked|nude|bare (?:skin|chest|shoulders?|thighs?)|moan\\w*|kiss(?:es|ed|ing)?\\b|lips?\\b|mouth\\b|tongue|neck\\b|collarbone|throat\\b|thighs?\\b|hips?\\b|waist\\b|breathless\\b|gasp\\w*|shiver\\w*|tremb\\w*|caress\\w*|strok(?:e|es|ed|ing)\\b|nuzzl\\w*|fingertips|skin\\b|flush(?:ed)?\\b|ache\\b|aching|hunger\\b|groan\\w*|bed\\b|sheets\\b|pressed against|cup(?:s|ped)? (?:her|his) (?:face|cheek|jaw)|thumb (?:along|over|across) (?:her|his) (?:lip|jaw|cheek)|trac(?:es|ed|ing) (?:her|his) (?:jaw|lips?|collarbone|spine)'),
    ],
    // Sweet, playful, wholesome: a confession, giggling, holding hands, a kiss on the cheek, sitting in a lap. Weighs against heat.
    sweet: [
        W(1, 'giggl\\w*|grin(?:s|ned|ning)?\\b|beam(?:s|ed|ing)\\b|adorabl\\w*|cute\\b|bashful\\w*|fluster\\w*|butterflies|heart (?:flutter\\w*|skip\\w*|swell\\w*)|hold(?:s|ing)? (?:her|his) hand|held (?:her|his) hand|holding hands|(?:lace|laces|laced|lacing|twin\\w*|interlac\\w*) (?:their|her|his) fingers|fingers (?:lace|laced|intertwin\\w*|interlac\\w*)|hug(?:s|ged|ging)?\\b|cuddl\\w*|snuggl\\w*|peck(?:s|ed)?\\b|kiss(?:es|ed)? (?:on )?(?:her|his|the) (?:cheek|forehead|nose|knuckles|hand|temple|hair)|playful\\w*|tickl\\w*|wink(?:s|ed|ing)?\\b|silly\\b|dork\\w*|teas(?:e|es|ed|ing)\\b|chuckl\\w*|laugh(?:s|ed|ing)? (?:softly|together|at (?:him|her))|shy(?:ly)?\\b|sweet(?:ly)?\\b|wholesome|(?:sits?|sat|sitting|settl\\w*|curl\\w*|perch\\w*|plop\\w*) (?:in|on|into) (?:his|her|my|your) lap|(?:into|onto) (?:his|her|my|your) lap|picnic|bouquet|flowers? for (?:her|him)'),
        W(0.5, 'smil(?:e|es|ed|ing)\\b|laugh\\w*|soft(?:ly)?\\b|gentl(?:e|y)\\b|warm(?:th)?\\b|blush\\w*|nervous\\w*|fond\\w*|happy|delight\\w*|forehead (?:to|against) (?:hers|his)|brush(?:es|ed)? (?:the )?hair (?:from|out of) (?:her|his) face|tuck(?:s|ed)? (?:a strand|her hair)'),
    ],
    // Saying it: a love confession (sets Love confession, and counts as Sweet).
    confess: [W(1, "i love you|i'm in love with you|i am in love with you|in love with (?:you|her|him)|love you\\b|confess(?:es|ed|ing)?\\b|confession|i like you|have feelings for|fallen for you|fell for you"), W(0.5, 'admit(?:s|ted|ting)?\\b|feelings\\b|heart\\b')],
    // Flirting: teasing, banter, a wink.
    flirt: [W(1, 'flirt\\w*|wink(?:s|ed|ing)?\\b|teas(?:e|es|ed|ing)\\b|smirk\\w*|banter\\w*|coy(?:ly)?\\b|bat(?:s|ted)? (?:her|his) (?:eye)?lashes'), W(0.5, 'grin\\w*|playful\\w*|cheek(?:y|ily)\\b')],
    // An actual sex scene.
    sex: [
        W(1, 'thrust(?:s|ed|ing)? (?:into|inside|deeper|harder|up into)|thrusts?\\b(?! (?:of|a|the|his hands?|her hands?|it))|inside (?:her|him|me|you)\\b(?! (?:coat|jacket|bag|purse|pocket|head|mind|chest|car|house|room|apartment|flat|shirt|hoodie|sweater|own|skull|body|ribs|throat|stomach|gut))|(?:his|your|my) cock\\b|cock (?:in|into|against|between|inside)|cunt\\b(?! (?:of|is|was|like))|puss(?:y|ies)\\b|clit\\w*|orgasm\\w*|climax(?:es|ed|ing)? (?:around|together|with|under|inside|hard)|come for me|cum(?:s|ming)?\\b|fuck(?:s|ed|ing) (?:her|him|me|you)\\b(?! (?:over|up|off|around|about|with|for|out))|penetrat\\w*|erection|rides? (?:him|her)\\b|riding (?:him|her)\\b|(?:his|her) length\\b|buried (?:himself|herself) (?:in|inside|deep)|buried deep (?:in|inside) (?:her|him)|spread(?:s)? her (?:legs|thighs)|between her legs'),
        W(0.5, 'wet for (?:him|her|me|you)|so wet|hard against|slick (?:with|between)|pound(?:s|ed|ing)? (?:into|her|him)|deeper\\b|harder\\b|rhythm of (?:his|her|their) hips|sweat-slick|sweaty sheets'),
    ],
    violence: [W(1, 'stab\\w*|blood(?:y|ied)?\\b|knife|blade\\b|gun\\b|gunshot|(?:was|been|got|getting|is) shot\\b|shot (?:him|her|them|me|you|at|dead|through|in the)|shoot(?:s|ing)? (?:him|her|them|me|you|at|up the)|punch(?:es|ed|ing)? (?:him|her|them|me|you)|beat(?:s|ing)? (?:her|him)|strangl\\w*|scream\\w*|kill(?:s|ed)? (?:him|her|them|me|you)|killing (?:him|her|them|me|you)|murder\\w*|wound\\w*|bone[s]? (?:crack|snap)\\w*'), W(0.5, 'slap\\w*|shove\\w*|bruis\\w*|choke\\w*|struggl\\w*')],
    hunted: [W(1, 'chas(?:e|es|ed|ing) (?:her|him|them|me|us|after)|footsteps|flee\\w*|fled\\b|run(?:s|ning)? (?:away|for (?:it|her|his|their|your) li)|ran (?:away|for it)|hid(?:e|es|ing)? from|hunt(?:s|ed|ing)? (?:her|him|them|me|us|down)|being hunted|behind (?:her|him) in the dark|cornered\\b|backed into a corner'), W(0.5, 'hide|hiding|run\\b|ran\\b|shadow\\w*|breath(?:ing)? (?:hard|fast)|heart pound\\w*')],
    grief: [W(1, 'funeral|grave(?:side|stone|yard)?\\b|mourn\\w*|coffin|casket|died\\b|death\\b|his body|her body was|wake for|eulogy|buried (?:her|him)|passed away|passed (?:last|this|in|on)\\b|(?:lost|losing) (?:my|her|his|their|your) (?:mom|mum|mother|dad|father|grandma|grandmother|gran|nana|grandpa|grandfather|brother|sister|son|daughter|baby|wife|husband|best friend|uncle|aunt|cousin)|(?:my|her|his|their|your) (?:late|dead) (?:mom|mum|mother|dad|father|grandma|grandmother|gran|nana|grandpa|grandfather|brother|sister|son|daughter|wife|husband|uncle|aunt|cousin|friend)'), W(0.5, 'shoulders shak\\w*|cr(?:y|ies|ied|ying)\\b|awkward\\w*|nobody knows what to say|no one knows what to say|(?:the )?(?:booth|table|room) goes quiet|sorry for your loss|condolence\\w*|tears?\\b|sob\\w*|wept\\b|weep\\w*|gone\\b|loss\\b')],
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
    row: [W(1, "how could you|you lied|liar\\b|i trusted you|get out\\b|i'm done|we're done|it's over|shout(?:s|ed|ing)?\\b|yell(?:s|ed|ing)?\\b|scream(?:s|ed)? at|slam(?:s|med)? the door|storm(?:s|ed)? out|ultimatum|don't you dare|what the hell is wrong with you|accus\\w*|argu(?:e|es|ed|ing|ment)\\b|bicker\\w*|snap(?:s|ped)? at|storm(?:s|ed|ing)? off|let me out|get out of my way|move,? (?:kenny|please|now)|you're drunk|you're being (?:ridiculous|an ass|a dick)|back off|leave me alone|don't touch me"), W(0.5, 'furious|glar\\w*|tipsy|voice (?:came|comes) out (?:bigger|louder|sharper|harder)|(?:heads?|people) (?:turn|turned|turning) (?:their heads|to look)|turned their heads|lowers? (?:his|her) voice|brings? it down|keep your voice down|so that\'s it|dickhead|asshole|prick\\b|fuck off|palms (?:flat )?on the table|drunk\\b|tense\\w*|scoff\\w*|snapp\\w*|huff\\w*|stiff\\w*|jaw (?:tight|clench\\w*)|voice (?:rises|cracks|breaks)|tears? (?:of rage|streaming)|throws? (?:the|a) (?:glass|plate|phone)')],
    betrayal: [W(1, "betray\\w*|cheat(?:s|ed|ing)? on|affair\\b|behind my back|went behind|caught (?:him|her|them)|found out (?:about|that)|lied to (?:me|you|her|him)|two-?tim\\w*|sold (?:me|us|him|her) out|ratted|snitch\\w*|rat\\b|turned on (?:me|him|her)"), W(0.5, 'lies\\b|lying\\b|secret\\w*|truth\\b')],
    // Tense: uneasy, nothing has happened yet.
    standoff: [W(1, "nobody moves|no one moves|don't move|hands where i can see|stand(?:s)? off|standoff|stares? (?:him|her) down|eyes (?:narrow|never leave)|holds? (?:his|her) breath|held (?:his|her) breath|too quiet|something's off|something is off|watching (?:him|her|them) closely|hand (?:drifts|moves|rests) (?:to|near|on) (?:the|his|her) (?:gun|knife|pocket|waistband)|wary|warily|suspicious\\w*|cops?\\b|police (?:car|cruiser|lights)|undercover"), W(0.5, 'tense\\w*|tension|silence\\b|careful\\w*|uneas\\w*|nervous\\w*|sweat\\w*|glanc\\w*')],
    deal: [W(1, "buy(?:s|ing)? (?:drugs|weed|coke|pills|molly|acid|dope|some|a bag|an? (?:eighth|ounce|gram|g\\b))|wan(?:ts|ted|ting|na) to buy|looking to (?:buy|score|cop)|to score\\b|score (?:some|off)|cop (?:some|from)|you got (?:anything|any|some)|got anything (?:for me)?|what (?:you|ya) need|fiend\\w*|resell\\w*|selling (?:to|him|her|drugs|weed|coke|pills)|sold (?:him|her|them) (?:a|an|some)|the sale\\b|make (?:a|the) sale|dime bag|bag of (?:weed|coke|pills)|grams?\\b|the deal\\b|a deal\\b|deal(?:s|ing)? (?:drugs|dope|weed|coke|pills|product)|the product|re-?up|front(?:ed)? (?:me|him|her)|counts? (?:the|out the) (?:cash|money|bills)|wad of (?:cash|bills)|baggie\\w*|ounce\\w*|eighth\\b|the stash|the plug\\b|my plug\\b|supplier|the buy\\b|cut (?:it|the) with|weigh(?:s|ed)? (?:it|out)|the scale\\b"), W(0.5, 'cash\\b|money\\b|buyer\\w*|customer\\w*|corner\\b|business\\b')],
    hustle: [W(1, "on the corner|corner boys?|hustl\\w*|slinging|the block\\b|cruis(?:e|es|ed|ing)\\b|hanging (?:out|around) (?:outside|on|by)|skat(?:e|es|ed|ing|eboard\\w*)\\b|smok(?:es|ed|ing) (?:a cigarette|a joint|outside)|lean(?:s|ed|ing)? against (?:the|his|her) (?:car|wall)"), W(0.5, 'street\\w*|alley\\w*|parking lot|gas station|cigarette\\w*|swagger\\w*')],
    // 1.91.1: out in public (a bar, a booth, a restaurant, people around). Erotic needs plain sex words here.
    // 1.91.5: friends at ease together (a booth of friends, beers on the porch, jokes and banter). Reads as Hanging out
    // when nothing heavier is going on.
    hangout: [W(1, "hang(?:s|ing)? out|hung out|chill(?:s|ed|ing)?\\b|banter\\w*|crack(?:s|ed|ing)? (?:a |up)|cracks? jokes?|(?:makes?|made|making) a joke|tell(?:s|ing)? (?:a |the )?(?:story|joke)|trad(?:e|es|ed|ing) (?:stories|jabs|insults)|ribb(?:ing|ed|s) (?:him|her|each other)|teas(?:e|es|ed|ing) each other|everyone laughs|they(?:'re| are)? all laughing|the (?:guys|gang|boys|girls|group|crew)\\b|(?:his|her|their) friends|old friends|round of (?:beers|drinks|shots)|another round|(?:a game of|shoots?|shooting|playing) (?:pool|darts|cards|poker)|shoot(?:ing)? the (?:shit|breeze)|catch(?:ing)? up\\b|loosen(?:s|ed)? up|the tension (?:breaks|eases|lifts)|eases? up"), W(0.5, "laugh\\w*|grin\\w*|joke\\w*|snort\\w*|chuckl\\w*|beers?\\b|booth\\b|couch\\b|porch\\b|fries|pizza|snacks?|smok(?:es|ing) (?:a|on the)|lazy|easy\\b|relax\\w*|comfortabl\\w*|kick(?:s|ed)? back")],
    public: [W(1, "bar\\b|booth\\b|bartender|barstool|the club\\b|restaurant|diner\\b|caf(?:e|\u00e9)\\b|pub\\b|crowd\\w*|dance ?floor|waiter|waitress|in public|everyone (?:is )?(?:watching|staring|looking)|people (?:around|staring|watching|nearby)|the table next|across the room|the party\\b|jukebox|high-?top|bar ?stools?|pool table|last call|bouncer|the bar\\b"), W(0.5, 'table\\b|drinks?\\b|music\\b|loud\\b|strangers?\\b')],
    // Kinds of high.
    stoned: [W(1, "joint\\b|blunt\\b|bong\\b|spliff|weed\\b|pot\\b|marijuana|stoned|baked\\b|high as|hits? the (?:joint|blunt|bong|pipe)|took a hit|takes a hit|edible\\w*|munchies"), W(0.5, 'smoke\\b|haze\\b|giggl\\w*|lazy\\b|mellow')],
    rolling: [W(1, "(?<!hips |eyes |hips slowly )rolling\\b(?! (?:his|her|my|their|your|over|down|in|up|out|a|the|off|back|on|around|away|toward|towards|across|along|into))|molly\\b|ecstasy|\\bmdma\\b|\\bx\\b pill|popped (?:a|some) (?:pill|molly|tab)|jaw clench\\w*|chewing (?:her|his) cheek|everything feels (?:so )?good|love everyone"), W(0.5, 'euphori\\w*|bass\\b|strobe\\w*|glow ?sticks?|pupils (?:huge|blown|wide)')],
    tripping: [W(1, "tripping|trippin|acid\\b|\\blsd\\b|tabs? of|shrooms|mushrooms|psilocybin|peyote|mescaline|\\bdmt\\b|hallucinat\\w*|the walls (?:breathe|breathing|melt\\w*)|colou?rs (?:bleed|melt|swirl)|melting|kaleidoscop\\w*"), W(0.5, 'swirl\\w*|breathing walls|patterns\\b|cosmic|ego\\b')],
    wired: [W(1, "coke\\b|cocaine|blow\\b|a line\\b|lines of|bump(?:s)? of|snort\\w*|speed\\b|amphetamine\\w*|meth\\b|crank\\b|crystal\\b|tweak\\w*|adderall|uppers|wired\\b|hasn't slept in|haven't slept in|grinding (?:his|her) teeth|jaw working|sniff(?:s|ed|ing)? hard|wipes? (?:his|her) nose"), W(0.5, "jitter\\w*|twitch\\w*|can't sit still|talking fast|racing\\b|paranoi\\w*")],
    nodding: [W(1, "heroin|smack\\b|junkie|dope\\b(?! ?sick)|nodding (?:off|out)|nods? off|nodded off|on the nod|opioid\\w*|oxy\\w*|percocet|codeine|fentanyl|morphine|sipp\\w* lean|cup of lean|purple drank|downers|quaaludes?|barbiturat\\w*|valium|xanax|ties? off|tied off|cooks? (?:it|the) (?:on|in) (?:a|the) spoon"), W(0.5, 'the spoon\\b|heavy-lidded|eyelids? (?:droop|heavy)|warm\\b|slump\\w*|drool\\w*')],
    drunk: [W(1, "drunk\\b|wasted\\b|hammered|plastered|tipsy|sloshed|bourbon|whiske?y|vodka|tequila|gin\\b|rum\\b|beers?\\b|six-?pack|shots?\\b of|takes a swig|took a swig|swig\\w*|bottle of|slurr\\w*|hiccup\\w*|stumbl\\w*"), W(0.5, 'drink(?:s|ing)?\\b|booze|liquor|glass\\b|bar\\b')],
    comedown: [W(1, "comedown|coming down|come down|crash(?:ing)? (?:hard|out)|withdrawal|dope ?sick|sick\\b and shaking|jonesing|cold sweat|the shakes|shaking hands|needs? a fix|need another|itch(?:es|ing)? (?:under|for)|hangover|hung ?over"), W(0.5, 'nause\\w*|shiver\\w*|grey\\b|hollow\\w*|empty\\b|sweat\\w*')],
};
// Strip HTML, hidden notes and code blocks so only the story's own words count.
export const plainStory = s => String(s ?? '').replace(/<!--[\s\S]*?-->/g, ' ').replace(/```[\s\S]*?```/g, ' ').replace(/<details[\s\S]*?<\/details>/gi, ' ').replace(/<[^>]+>/g, ' ');

// texts: [{ text, weight }]: the newest reply at weight 1, your last message at about 0.6.
// Returns { intimate, sex, violence, \u2026 } as scores, and on: the kinds at 2 or more.
export function readScene(texts = []) {
    const score = {}, strong = {};
    for (const [kind, lists] of Object.entries(SCENE_WORDS)) {
        let s = 0, st = 0;
        for (const { text, weight = 1 } of texts) {
            const t = plainStory(text);
            for (const [w, re] of lists) { const n = Math.min(6, (t.match(re) ?? []).length) * w * weight; s += n; if (w >= 1) st += n; }
        }
        score[kind] = Math.round(s * 10) / 10; strong[kind] = Math.round(st * 10) / 10;
    }
    // strong: only the full-weight words (a plain act: making out, unzipping, thrusting). Everyday body words (a
    // flushed face, a wet coat, a mouth that talks) count half and only ever add to a strong word (1.91.5).
    return { score, strong, on: new Set(Object.entries(score).filter(([, v]) => v >= 2).map(([k]) => k)) };
}

// The exact words that counted for some kinds of scene, for the Music tab's "why" line (first few, as written).
export function wordsFor(texts = [], kinds = []) {
    const out = [];
    for (const kind of kinds) for (const { text } of texts) {
        const t = plainStory(text);
        for (const [, re] of SCENE_WORDS[kind] ?? []) for (const m of t.match(re) ?? []) if (!out.includes(m.toLowerCase())) out.push(m.toLowerCase());
    }
    return out.slice(0, 5);
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
// 1.95: a device has to be on or playing, not just there ("the couple by the jukebox" isn't music).
const RADIO_ON = /\b(?:(?:plays?|played|playing|blasts?|blasted|blasting|puts? on|put on|queues? up|queued up|pulls? up|pulled up)\b(?:(?!\b(?:game|games|video|videos|solitaire|chess|wordle|tetris|with|photos?|pictures?|map|maps|texts?|messages?|email)\b)[^.!?\n]){1,70}\b(?:on|from|off|through) (?:his|her|their|my|your|kenny's|someone's|a|the) (?:phone|cell|iphone|ipod|walkman|discman|laptop|speaker|bluetooth speaker|earbuds|headphones|airpods)\b|(?:turns?|turned|turning|switch(?:es|ed|ing)?|flicks?|flicked|clicks?|clicked|cranks?|cranked|puts?|putting) (?:on )?(?:the |a |an |his |her |their |my |old |car )*(?:radio|jukebox|record player|phonograph|gramophone|turntable|hi-?fi|stereo|wireless|transistor|speakers?|boombox|tape deck|cassette player|record)(?: on| up)?\b(?<!(?:the|a|an|his|her|their|my|old|car) record)|(?:the |a |an |his |her |their |my |old |car )*(?:radio|jukebox|record player|phonograph|gramophone|turntable|hi-?fi|stereo|wireless|transistor|speakers?|boombox|tape deck|cassette player|record) (?:plays|playing|played|is playing|was playing|blares|blaring|blared|hums|crackles|crackling|crackled|spins|spinning|kicks in|kicked in|comes on|came on|comes to life|starts|started|switches on|clicks on|drones|thumps|thumping|pumps|pumping|spills|spilling|warbles|warbling)|(?:drops?|dropped|feeds?|fed|slides?|slid|puts?) (?:a |another |some )?(?:quarter|coin|nickel|dime|dollar|change)s? (?:in|into) the jukebox|punch(?:es|ed)? (?:in|up) (?:a |another )?(?:song|number|track|record)|on the (?:radio|jukebox|stereo|speakers|record player|turntable)\b|(?:along )?to the (?:radio|jukebox|stereo|record player)\b|puts? on (?:a|an|some|the|his|her|their|an old) (?:[A-Z][\w'.&-]* ){0,4}(?:record|album|tape|cassette|cd|vinyl|lp)\b|from the (?:radio|jukebox|stereo|speakers|record player|turntable)\b|over the (?:speakers|radio|stereo)|the needle (?:drops|settles)|drops? the needle|puts? (?:a|on a|the) record|record (?:spins|plays|crackles|skips)|on the record|band (?:plays|is playing|strikes up)|music (?:drifts|plays|crackles|spills) from|(?:phone|iphone|ipod|walkman|discman|laptop|bluetooth speaker|speaker|airpods|earbuds|headphones) (?:plays|playing|is playing|blares|blaring|starts playing|buzzes with music|leaks music)|(?:pops?|popped|puts?|stuffs?|stuffed|slips?|slipped|shoves?|shoved) (?:in |on )?(?:his |her |their |my |one )?(?:earbuds?|headphones|airpods|earphones)(?: in| on)?|(?:earbuds?|headphones|airpods|earphones) (?:in|on)\b(?=[^.]{0,40}\b(?:music|song|playing|volume|listen))|(?:music|a song|songs) (?:in|through) (?:his|her|their|my) (?:earbuds|headphones|airpods|earphones)|(?:the )?car (?:stereo|speakers) (?:plays|playing|blares|blaring|thumps|thumping|pumps|crackles)|(?:turns?|turned|cranks?|cranked) up the (?:car stereo|stereo|volume|music)|plugs? (?:in )?(?:his|her|their|my) phone(?: into the (?:aux|car))?|(?:the )?aux cord|(?:the |a |live )?(?:band|quartet|trio|orchestra|singer|guitarist|pianist|fiddler|busker|street musician) (?:plays|playing|is playing|was playing|starts|started|kicks into|launches into|tears into|strikes up|strums|strumming|sings|is singing|croons|belts)|live music|a live band|on stage,? (?:the )?(?:band|singer)|the (?:set|gig|show) (?:starts|kicks off|begins)|(?:the |a )?dj (?:drops|plays|spins|mixes|cues|is playing|puts on)|(?:drops|dropped) the beat|the beat drops|karaoke|takes? the mic\b|grabs? the mic\b|(?:gets?|got) up (?:on stage )?to sing|busker|buskers|street musician)/i;
const RADIO_OFF = /\b(?:karaoke(?:'s| is| was) (?:over|done|finished)|(?:phone|battery|speaker) (?:dies|died|is dead|goes dead|cuts out)|(?:turns?|switch(?:es)?|clicks?|shuts?|snaps?) (?:off |)(?:the )?(?:radio|jukebox|record player|music|stereo)(?: off)?|(?:radio|record|music|jukebox) (?:dies|cuts out|stops|goes quiet|falls silent)|lifts? the needle|unplugs? the|(?:takes?|took|pulls?|pulled|yanks?|yanked|tugs?|tugged) (?:out |off )?(?:his |her |their |my |one )?(?:earbuds?|headphones|airpods|earphones)(?: out| off)?|(?:pauses?|paused|stops?|stopped|kills?|killed) the (?:music|song|playlist|track)|(?:band|set|show|gig|karaoke|singer) (?:stops|ends|ended|finishes|finished|wraps up|is over|takes a break)|(?:dead|died|dies) (?:phone|battery))/i;
export const radioIn = text => { const t = plainStory(text); return RADIO_OFF.test(t) ? 'off' : RADIO_ON.test(t) ? 'on' : ''; };
// What the radio is, for the line to Claude ("a jukebox"), from the same words.
// 1.95: a song or artist the story names: hummed, sung, whistled, played, put on, on the radio. Returns
// { title, artist, phrase, device } or null. phrase is the story's own words, for the Now card's Why line.
const MUSIC_VERB = '(?:hum(?:s|med|ming)?|sing(?:s|ing)?|sang|sung|whistl(?:es|ed|ing)|croon(?:s|ed|ing)?|belt(?:s|ed|ing)? out|play(?:s|ed|ing)?|puts? on|put on|blast(?:s|ed|ing)?|queue(?:s|d)? up|cue(?:s|d)? up|picks?|picked|punch(?:es|ed)? in|request(?:s|ed)?|hums? along to|sing(?:s|ing)? along to|sang along to)';
const CAP = "(?:[A-Z][\\w'\u2019&.!-]*|\\d+)(?: (?:[A-Z][\\w'\u2019&.!-]*|of|the|and|&|de|la|\\d+)){0,4}";
const QUOTED = '[\u201c"\u2018\']([^\u201d"\u2019\'\\n]{2,60})[\u201d"\u2019\']';
const NOT_ARTIST = /^(?:The|A|An|He|She|They|It|His|Her|Their|This|That|Something|Some|Along|Softly|Quietly|Under|Again|Then|Now|Old|New|Every|Another|God|Jesus|Christ|Mom|Dad|Ma|Pa)$/;
const SONG_RES = [
    // "Title" by Artist
    [new RegExp(QUOTED + ' by (?:the )?(' + CAP + ')'), m => ({ title: m[1], artist: m[2] })],
    // Artist's "Title"
    [new RegExp('(' + CAP + ')\u2019s ' + QUOTED), m => ({ artist: m[1], title: m[2] })],
    [new RegExp("(" + CAP + ")'s " + QUOTED), m => ({ artist: m[1], title: m[2] })],
    // hums "Title" / "Title" comes on / "Title" on the jukebox
    [new RegExp('\\b' + MUSIC_VERB + ' (?:a few bars of |the opening of |the chorus of |a bit of |along to )?' + QUOTED), m => ({ title: m[1] })],
    [new RegExp(QUOTED + ' (?:comes on|came on|starts playing|is playing|was playing|plays|blares|crackles|kicks in|on the (?:radio|jukebox|stereo|speakers))'), m => ({ title: m[1] })],
    // a cover of Creep / launches into Wonderwall (a live band or a singer)
    [new RegExp('\\b(?:a cover of|covers?|covering|(?:launches|launched|kicks|kicked|tears|tore|breaks|broke) into) (?:the |a )?(' + CAP + ')'), m => ({ title: m[1] })],
    // a Taylor Swift song / some Taylor Swift
    [new RegExp('\\b(?:a|an|some|old|that|this|the new|another) (' + CAP + ') (?:song|tune|track|number|record|album|single|ballad|hit|cover)'), m => ({ artist: m[1] })],
    // humming Taylor Swift / puts on the Ramones
    [new RegExp('\\b' + MUSIC_VERB + ' (?:some |a little |a bit of |along to |old |early |the )?(' + CAP + ')'), m => ({ artist: m[1] })],
    // a song by Artist
    [new RegExp('\\b(?:song|tune|track|number|record|album) by (?:the )?(' + CAP + ')'), m => ({ artist: m[1] })],
];
export function songMention(text, people = []) {
    const t = plainStory(text), skip = new Set(people.map(p => String(p).toLowerCase()));
    for (const [re, get] of SONG_RES) {
        const m = t.match(re); if (!m) continue;
        const x = get(m), artist = String(x.artist ?? '').replace(/^the\s+/i, '').replace(/[.!?,;:]+$/, '').trim(), title = String(x.title ?? '').trim().replace(/(?:[\s.!?,;:]+|\s+(?:and|of|the|&|a|while|as))+$/i, '').trim();
        if (artist && (NOT_ARTIST.test(artist.split(' ')[0]) && artist.split(' ').length === 1 || skip.has(artist.toLowerCase()) || skip.has(artist.split(' ')[0].toLowerCase()))) continue;
        if (!artist && (!title || title.split(' ').length > 9)) continue;
        // A quoted line of dialogue right after "sings" is a song only if it is short.
        const start = Math.max(0, m.index - 40), phrase = t.slice(m.index, m.index + m[0].length).trim();
        void start;
        return { title, artist, phrase: phrase.length > 70 ? phrase.slice(0, 67) + '...' : phrase, device: radioIn(t) === 'on', kind: radioIn(t) === 'on' ? radioKind(t) : '' };
    }
    return null;
}
export function radioKind(text) {
    const t = plainStory(text).toLowerCase();
    for (const [k, label] of [['karaoke', 'karaoke'], ['busker', 'a busker'], ['street musician', 'a street musician'], ['dj ', 'the DJ'], ['earbud', 'earbuds'], ['airpods', 'earbuds'], ['headphones', 'headphones'], ['aux', 'the car stereo'], ['car stereo', 'the car stereo'], ['bluetooth', 'a speaker'], ['phone', 'a phone'], ['live band', 'a live band'], ['singer', 'a singer'], ['pianist', 'a pianist'], ['guitarist', 'a guitarist'], ['orchestra', 'an orchestra'], ['quartet', 'a band'], ['trio', 'a band'], ['jukebox', 'a jukebox'], ['record player', 'a record player'], ['phonograph', 'a phonograph'], ['gramophone', 'a gramophone'], ['turntable', 'a record player'], ['car radio', 'the car radio'], ['transistor', 'a transistor radio'], ['band', 'a band'], ['record', 'a record player'], ['stereo', 'a stereo'], ['radio', 'a radio'], ['wireless', 'a wireless']]) if (t.includes(k)) return label;
    return 'a radio';
}
