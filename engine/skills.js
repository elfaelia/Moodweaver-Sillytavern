// Skills. A level out of 10 per person, from The Sims 3 and 4 (packs included) and from outside them.
// A skill costs nothing until the scene calls for it: its words come up in the player's latest message or the
// last reply, the hidden line says someone used it last reply, or it's set to always. Then it goes to Claude
// with its level, which decides how attempts go. Pure functions; index.js does the reading.
const norm = s => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’‘]/g, "'");
// Rows: id, label, what it covers, where it's from, words that call for it ('|' between, '*' ends a stem),
// optional wording for the prompt when the label alone could be misread.
const S3 = 'The Sims 3', S4 = 'The Sims 4', BOTH = 'The Sims 3 and 4';
export const SKILL_CATEGORIES = [
    ['Sims · home & hands', '⌂', '#c9b37e', [
        ['cooking', 'Cooking', 'everyday meals, from burnt toast to a proper roast', BOTH, 'cook*|kitchen|stove*|recipe*|simmer*|fry|frying|fried|saucepan|skillet|chop*|diced|dinner|breakfast|lunch|meal*|stew|soup|omelet*|seasoning|knead*'],
        ['gourmet_cooking', 'Gourmet cooking', 'restaurant food, plating and fine technique', S4, 'gourmet|souffle*|flambe*|plating|plated|sous vide|fine dining|chef*|caviar|tasting menu|reduction'],
        ['baking', 'Baking', 'bread, cakes and pastry', `${S4} · Get to Work`, 'bake*|baking|bakery|cake*|bread|pastr*|dough|oven|cookie*|pie|pies|muffin*|frosting|icing'],
        ['mixology', 'Mixology', 'mixing drinks behind a bar', `${S3} · Late Night, ${S4}`, 'cocktail*|bartend*|martini*|shaker|whiskey|whisky|gin|vodka|rum|tequila|poured a drink|pours a drink|on the rocks|garnish*|mix a drink|mixed a drink'],
        ['handiness', 'Handiness', 'fixing, building and wiring things', BOTH, 'fix*|repair*|wrench|screwdriver|hammer*|toolbox|tools|pipes|leaking pipe|wiring|fuse box|plumb*|carpent*|sawing|workbench'],
        ['gardening', 'Gardening', 'growing things and keeping them alive', BOTH, 'garden*|plant*|soil|seeds|seedling*|weeding|prune*|pruning|harvest*|compost|greenhouse|flowerbed*|trowel'],
        ['herbalism', 'Herbalism', 'herbs, poultices and wild remedies', `${S4} · Outdoor Retreat`, 'herb*|poultice*|tincture*|salve*|forag*|medicinal plant*|wild remed*'],
        ['fishing', 'Fishing', 'rods, bait and patience', BOTH, 'fishing|fished|fish|fishing rod|bait|angler*|catch of the day'],
        ['flower_arranging', 'Flower arranging', 'bouquets, wreaths and making flowers say something', `${S4} · Seasons`, 'bouquet*|flower arrang*|arranging flowers|vase|ikebana|corsage*|wreath*'],
        ['knitting', 'Knitting', 'needles, yarn and something warm by winter', `${S4} · Nifty Knitting`, 'knit*|yarn|crochet*|purl|wool|knitting needle*'],
        ['cross_stitch', 'Cross-stitch', 'embroidery hoops and samplers', `${S4} · Cottage Living`, 'cross-stitch*|cross stitch*|embroider*|needlework|embroidery hoop'],
        ['fabrication', 'Fabrication', 'making things from scrap on a fabricator', `${S4} · Eco Lifestyle`, 'fabricat*|3d print*|recycl*|scrap metal|salvag*'],
        ['juice_fizzing', 'Juice fizzing', 'fizzy juices, ferments and kombucha', `${S4} · Eco Lifestyle`, 'fizz*|kombucha|ferment*|carbonat*|juicing'],
        ['nectar_making', 'Nectar making', 'wine and nectar from fruit', `${S3} · World Adventures, ${S4} · Horse Ranch`, 'nectar*|wine*|winery|vineyard|grapes|vintage|cask*|cellar'],
        ['pottery', 'Pottery', 'throwing clay, glazing and firing', `${S4} · Businesses & Hobbies`, 'potter*|clay|kiln|glaze*|ceramic*|wheel-thrown'],
        ['tattooing', 'Tattooing', 'needles, ink and steady hands', `${S4} · Businesses & Hobbies`, 'tattoo*|ink gun|inking|stencil|flash sheet'],
        ['gemology', 'Gemology', 'cutting and knowing stones', `${S4} · Crystal Creations`, 'gemstone*|crystal*|jewel*|diamond*|ruby|rubies|emerald*|sapphire*|carat*|loupe'],
        ['apothecary', 'Apothecary', 'remedies, elixirs and the less wholesome things', `${S4} · Enchanted by Nature`, 'apothecar*|elixir*|tonic*|remed*|potion*|concoct*|tincture*|vial*|draught*'],
        ['natural_living', 'Natural living', 'living off the land and liking it', `${S4} · Enchanted by Nature`, 'forag*|off the grid|off-grid|living off the land|campfire|bathe in the river|wild water'],
    ]],
    ['Sims · mind & making', '✎', '#b9c9e0', [
        ['logic', 'Logic', 'reasoning, puzzles and chess', BOTH, 'logic*|chess|puzzle*|deduc*|equation*|riddle*|calculat*|reason it out'],
        ['programming', 'Programming', 'code, computers and breaking into them', S4, 'program*|code|coding|coded|computer*|software|terminal|debug*|script*|laptop'],
        ['rocket_science', 'Rocket science', 'rockets and the maths that flies them', S4, 'rocket*|aerospace|propulsion|thruster*|orbit*|launch pad'],
        ['research_debate', 'Research and debate', 'digging up facts and winning arguments', `${S4} · Discover University`, 'debat*|argue*|argument*|research*|thesis|evidence|rebut*|cross-examin*'],
        ['robotics', 'Robotics', 'building robots and machines that move', `${S4} · Discover University`, 'robot*|servo*|circuit*|android*|drone*'],
        ['writing', 'Writing', 'novels, letters, poems and journals', BOTH, 'write|writes|writing|wrote|written|writer*|novel*|manuscript*|poem*|poetry|journal*|essay*|typewriter*|draft*|letter*'],
        ['painting', 'Painting', 'canvas, oils and portraits', BOTH, 'paint*|canvas*|easel*|portrait*|watercolo*|sketch*'],
        ['photography', 'Photography', 'cameras, darkrooms and the right moment', BOTH, 'photo*|camera*|lens*|shutter|darkroom|snapshot*|polaroid*|film roll'],
        ['sculpting', 'Sculpting', 'chisel, marble and clay', `${S3} · Ambitions`, 'sculpt*|chisel*|marble|statue*|bust of'],
        ['inventing', 'Inventing', 'contraptions, prototypes and workbenches', `${S3} · Ambitions`, 'invent*|contraption*|prototype*|gadget*|blueprint*|workbench'],
        ['science', 'Science', 'experiments, labs and specimens', `${S3} · University Life`, 'science|scientific|scientist*|experiment*|lab|labs|laborator*|chemical*|specimen*|microscope*|beaker*|petri'],
        ['advanced_tech', 'Advanced technology', 'future tech: holograms, lasers, plasma', `${S3} · Into the Future`, 'futuristic|hologra*|plasma|nanit*|hoverboard*|jetpack*|laser*'],
        ['bot_building', 'Bot building', 'building and programming bots', `${S3} · Into the Future`, 'bots|robot*|plumbot*|servo*'],
        ['mischief', 'Mischief', 'pranks, trouble-making and petty sabotage', S4, 'prank*|mischie*|sabotag*|practical joke*|whoopee', 'mischief and pranks'],
        ['media_production', 'Media production', 'filming, editing and putting it out', `${S4} · Get Famous`, 'video*|filming|filmed|footage|vlog*|livestream*|editing the|recording'],
        ['acting', 'Acting', 'playing a part on stage, on screen or in life', `${S4} · Get Famous`, 'act*|acting|actor*|actress*|audition*|stage|script|role|perform*|pretend*|in character'],
        ['entrepreneur', 'Entrepreneurship', 'running a business and making it pay', `${S4} · High School Years`, 'business*|startup|profit*|invest*|pitch*|customers|market*|shop|store'],
        ['thanatology', 'Thanatology', 'death, dying, grief and the dead', `${S4} · Life & Death`, 'death|dying|dead|corpse*|funeral*|grief|griev*|morgue|embalm*|autopsy|afterlife|mourn*|reaper', 'thanatology (death and the dead)'],
        ['medium', 'Mediumship', 'séances and talking to ghosts', `${S4} · Paranormal Stuff`, 'ghost*|spirit*|seance*|haunt*|ouija|the dead|possess*|apparition*', 'mediumship (talking to the dead)'],
        ['vampire_lore', 'Vampire lore', 'what vampires are and how to handle them', `${S4} · Vampires`, 'vampir*|undead|fang*|stake|garlic|blood-drinker*'],
        ['alchemy', 'Alchemy', 'elixirs, transmutation and strange brews', `${S3} · Supernatural`, 'alchem*|transmut*|philosopher*s stone|elixir*|potion*'],
        ['archaeology', 'Archaeology', 'digs, relics and old ruins', `${S4} · Jungle Adventure`, 'archaeolog*|excavat*|dig site|artifact*|artefact*|relic*|ruins|tomb*|fossil*'],
        ['street_art', 'Street art', 'graffiti, stencils and murals', `${S3} · University Life`, 'graffiti|spray paint*|spray-paint*|mural*|stencil*'],
        ['social_networking', 'Social networking', 'followers, posts and going viral', `${S3} · University Life`, 'social media|followers|online|viral|influencer*|instagram|tiktok|twitter'],
    ]],
    ['Sims · body & play', '✦', '#9fd3b4', [
        ['fitness', 'Fitness', 'strength, stamina and training', `${S4}; Athletic in ${S3}`, 'run|runs|ran|running|sprint*|lift weights|lifting|workout*|work out|exercis*|push-up*|press-up*|jog*|stamina|gym|train*|chase*|chasing|climb*|endurance'],
        ['dancing', 'Dancing', 'from slow dances to the club floor', `${S4} · Get Together`, 'danc*|waltz*|tango|ballroom|twirl*|dance floor'],
        ['dj_mixing', 'DJ mixing', 'decks, mixing and reading a crowd', `${S4} · Get Together`, 'dj|turntable*|decks|mixing desk|playlist*'],
        ['singing', 'Singing', 'voice, pitch and holding a note', `${S3} · Showtime, ${S4} · City Living`, 'sing|sings|singing|sang|sung|song*|singer*|karaoke|lullab*|choir|aria*|hums|humming|hummed'],
        ['guitar', 'Guitar', 'strumming, chords and riffs', BOTH, 'guitar*|strum*|chord*|riff*'],
        ['piano', 'Piano', 'keys, sonatas and late-night playing', `${S3} · Late Night, ${S4}`, 'piano*|pianist*|sonata*|nocturne*|ivories|grand piano'],
        ['violin', 'Violin', 'bow, strings and practice', S4, 'violin*|fiddle|fiddler|cello*|viola'],
        ['bass_drums', 'Bass and drums', 'the rhythm section', `${S3} · Late Night`, 'drum*|bass guitar|bassist*|percussion|snare'],
        ['charisma', 'Charisma', 'charm, small talk and working a room', BOTH, 'charm*|charisma*|small talk|smooth-talk*|schmooz*|win them over|work the room|working the room'],
        ['comedy', 'Comedy', 'timing, jokes and making a room laugh', S4, 'joke*|joking|punchline*|stand-up|standup|comedian*|comic timing|quip*|funny'],
        ['video_gaming', 'Video gaming', 'consoles, controllers and high scores', S4, 'video game*|gaming|gamer*|console|controller|arcade|high score'],
        ['bowling', 'Bowling', 'lanes, pins and strikes', `${S4} · Bowling Night`, 'bowling|bowled|bowling alley|bowling ball|gutter ball'],
        ['rock_climbing', 'Rock climbing', 'cliffs, ropes and handholds', `${S4} · Snowy Escape`, 'climb*|cliff*|ledge*|harness|handhold*|rappel*|abseil*|scale the|scaled the'],
        ['skiing', 'Skiing', 'slopes and powder', `${S4} · Snowy Escape`, 'ski|skis|skiing|skied|slope*|piste*|chairlift*'],
        ['snowboarding', 'Snowboarding', 'boards, tricks and half-pipes', `${S4} · Snowy Escape`, 'snowboard*|half-pipe|halfpipe'],
        ['martial_arts', 'Martial arts', 'disciplined fighting, kicks and throws', `${S3} · World Adventures`, 'martial art*|kung fu|karate|judo|jiu-jitsu|jujitsu|taekwondo|kick*|sparr*|dojo|throw*|grapple*'],
        ['scuba_diving', 'Scuba diving', 'tanks, depth and staying calm underwater', `${S3} · Island Paradise`, 'scuba|dive*|diving|underwater|oxygen tank|wetsuit|reef*'],
        ['horse_riding', 'Horse riding', 'saddles, reins and staying on', `${S3} · Pets, ${S4} · Horse Ranch`, 'horse*|horseback|saddle*|gallop*|canter*|trot*|stirrup*|mare|stallion*|bridle*'],
        ['wellness', 'Wellness', 'yoga, meditation and massage', `${S4} · Spa Day`, 'yoga|meditat*|massag*|spa day|mindful*|breathwork'],
        ['pet_training', 'Pet training', 'getting animals to listen', `${S4} · Cats & Dogs`, 'dog*|puppy|puppies|pupp*|kitten*|cats|fetch|leash*|good boy|good girl|obedience'],
        ['veterinarian', 'Veterinary medicine', 'treating animals', `${S4} · Cats & Dogs`, 'vet|vets|veterinar*|animal hospital|paw*|muzzle'],
        ['parenting', 'Parenting', 'raising children and handling them', `${S4} · Parenthood`, 'child*|kids|toddler*|parent*|bedtime story|tantrum*|nappy|diaper*'],
    ]],
    ['Not in the Sims · work & life', '☰', '#a8bfe0', [
        ['teaching', 'Teaching', 'explaining things so they land, and patience', 'not in the Sims', 'teach*|taught|lesson*|tutor*|classroom|student*|explain*|show you how|homework|lecture*'],
        ['medicine', 'Medicine', 'diagnosing and treating people', 'not in the Sims', 'doctor*|medic*|diagnos*|patient*|prescri*|symptom*|dosage|stethoscope|fever|infection|clinic*|pulse'],
        ['surgery', 'Surgery', 'cutting people open and closing them up', 'not in the Sims', 'surg*|scalpel*|incision*|operat*|suture*|stitch*|anesthe*|anaesthe*|lobotom*|amputat*|forceps|retractor*'],
        ['first_aid', 'First aid', 'bandaging, setting bones, stopping bleeding', 'not in the Sims', 'first aid|bandag*|tourniquet*|splint*|wound*|bleeding|antiseptic|cpr|stitches|pressure on the'],
        ['psychiatry', 'Psychiatry and therapy', 'reading minds for a living: diagnosing, treating, or breaking them', 'not in the Sims', 'therap*|psychiatr*|psycholog*|session*|diagnos*|patient*|analys*|shrink|delusion*|hysteri*|treatment|electroshock|asylum'],
        ['hypnosis', 'Hypnosis', 'putting people under and steering them', 'not in the Sims', 'hypno*|trance*|mesmer*|suggestib*|pendulum|go under|going under'],
        ['driving', 'Driving', 'cars, chases and getaways', 'not in the Sims', 'driv*|car|cars|steering wheel|steer*|accelerat*|brake*|gearstick|engine|swerv*|getaway'],
        ['swimming', 'Swimming', 'staying afloat and moving fast in water', 'not in the Sims', 'swim*|swam|pool|drown*|current|tread water|treading water|lake|river|the sea'],
        ['languages', 'Languages', 'speaking, reading and faking other tongues', 'not in the Sims', 'language*|accent*|translat*|fluent|french|german|russian|spanish|italian|latin|foreign'],
        ['negotiation', 'Negotiation', 'bargaining and getting what they want out of a deal', 'not in the Sims', 'negotiat*|bargain*|haggl*|deal|terms|offer*|counteroffer|leverage|compromise'],
        ['leadership', 'Leadership', 'getting people to follow', 'not in the Sims', 'lead*|command*|orders|follow me|rally*|in charge|take charge|crew|team'],
        ['reading_people', 'Reading people', 'tells, lies and what someone really wants', 'not in the Sims', 'read her|read him|read them|reads her|reads him|reading her|reading him|body language|poker face|see through|seeing through|tells'],
        ['sewing', 'Sewing and tailoring', 'needle, thread and a perfect fit', 'not in the Sims', 'sew*|tailor*|hem|hemmed|hemming|seam*|needle and thread|mend*'],
        ['housekeeping', 'Housekeeping', 'cleaning, laundry and keeping a house', 'not in the Sims', 'clean*|scrub*|laundry|dusting|mop*|sweep*|tidy*|tidied|dishes|polish*|vacuum*'],
        ['etiquette', 'Etiquette', 'manners, rank and saying the right thing', 'not in the Sims', 'etiquette|manners|proper|decorum|curts*|dinner party|gala|introduc*|bow|bowed'],
        ['hunting', 'Hunting', 'tracking and killing game', 'not in the Sims', 'hunt*|prey|deer|rifle|trap*|snare*|skinning|gutting'],
        ['tracking', 'Tracking', 'following trails and finding people', 'not in the Sims', 'track*|trail*|footprint*|prints|follow the|find her|find him|blood trail|where did she|where did he'],
        ['survival', 'Survival', 'shelter, fire, water: staying alive out there', 'not in the Sims', 'surviv*|wilderness|shelter|campfire|start a fire|forag*|ration*|starv*|lost in|exposure'],
        ['self_defence', 'Self-defence', 'getting loose and getting away', 'not in the Sims', 'self-defen*|defend herself|defend himself|fight back|fought back|break free|broke free|elbow*|knee to|block*|escape*'],
    ]],
    ['Not in the Sims · dark & criminal', '☠', '#c27a9a', [
        ['lying', 'Lying', 'convincing lies, cover stories and keeping them straight', 'not in the Sims', 'lie to|lied to|lying to|lies|a lie|liar*|cover story|alibi*|deceiv*|decepti*|fib*|truth|honest*|believe me|trust me|swear|bluff*'],
        ['manipulation', 'Manipulation', 'guilt, flattery and pressure: getting people to do what they want', 'not in the Sims', 'manipulat*|guilt*|convinc*|persuad*|flatter*|coax*|sweet-talk*|pressure*|leverage|gaslight*|talk her into|talk him into|charm*|play her|play him|played her|played him'],
        ['seduction', 'Seduction', 'getting someone into bed, or under their spell', 'not in the Sims', 'seduc*|flirt*|tempt*|lure|lured|luring|kiss*|undress*|bed|bedroom|attract*|desire*'],
        ['promiscuity', 'Promiscuity', 'sexual experience: how much they’ve done and with how many', 'not in the Sims', 'sex|sexual*|fuck*|naked|nude|undress*|orgasm*|climax*|aroused|arousal|lover*|one-night|hook up|hookup|virgin*|in bed', 'sexual experience (promiscuity)'],
        ['violence', 'Violence', 'fists, fights and hurting people up close', 'not in the Sims', 'hit|hits|hitting|punch*|kick*|slap*|fight*|fought|brawl*|beat*|attack*|strike*|struck|shove*|throttl*|headbutt*|stomp*|hurt*|violen*'],
        ['murder', 'Murder', 'killing people, and getting it done', 'not in the Sims', 'kill*|murder*|body|bodies|corpse*|strangl*|stab*|shoot*|shot|slit*|dead|die|dying|weapon*|knife|gun'],
        ['torture', 'Torture', 'drawing out pain on purpose', 'not in the Sims', 'tortur*|torment*|interrogat*|pliers|electrod*|waterboard*|burn*|scream*|pain|confess*'],
        ['interrogation', 'Interrogation', 'questions and pressure until the truth comes out', 'not in the Sims', 'interrogat*|question*|confess*|truth|answers|tell me|who sent|where is|cooperat*|statement'],
        ['intimidation', 'Intimidation', 'threats, looming and making people afraid', 'not in the Sims', 'threat*|intimidat*|scare*|frighten*|loom*|menac*|warn*|or else|afraid|fear'],
        ['drug_dealing', 'Drug dealing', 'moving product, reading buyers, staying ahead of the police', 'not in the Sims', 'deal|deals|dealer*|dealing|drug*|product|stash|grams|ounce*|baggie*|score|buyer*|corner|supplier*|cops|narc*|pills|heroin|cocaine|coke|meth|weed|dope|smack'],
        ['drug_cooking', 'Cooking drugs', 'making the product: dirty and dangerous at low levels, pure at high', 'not in the Sims', 'cook meth|cooking meth|cooked meth|batch|meth lab|purity|fumes|chemist*'],
        ['poisoning', 'Poisoning', 'choosing it, slipping it in and making it look natural', 'not in the Sims', 'poison*|toxin*|venom*|arsenic|cyanide|strychnine|laced|spike*|drugged|in her drink|in his drink|tasteless'],
        ['lockpicking', 'Lockpicking', 'locks, picks and getting through doors', 'not in the Sims', 'lock*|unlock*|pick the|lockpick*|bobby pin*|hairpin*|deadbolt*|padlock*|key|keys|handcuff*'],
        ['pickpocketing', 'Pickpocketing', 'lifting wallets, keys and phones unnoticed', 'not in the Sims', 'pickpocket*|wallet*|purse*|pocket*|swipe*|filch*|sleight of hand'],
        ['burglary', 'Burglary', 'breaking in and getting out with it', 'not in the Sims', 'break in|breaks in|broke in|breaking in|burglar*|burgl*|alarm*|sneak in|snuck in|loot*|rob|robs|robbed|robbing|robber*|robbery|heist*|steal*|stole*'],
        ['safecracking', 'Safecracking', 'safes, vaults and combinations', 'not in the Sims', 'safecrack*|a safe|the safe|vault*|combination lock|tumbler*'],
        ['forgery', 'Forgery', 'fake papers, signatures and money', 'not in the Sims', 'forge|forged|forger*|forgery|forging|counterfeit*|signature*|papers|documents|passport*|fake id'],
        ['hacking', 'Hacking', 'getting into systems, phones and accounts', 'not in the Sims', 'hack*|password*|firewall*|encrypt*|server*|phone*|account*|security system*|backdoor*|malware'],
        ['con_artistry', 'Con artistry', 'long cons, marks and fake identities', 'not in the Sims', 'con|cons|conned|con man|con artist|grift*|scam*|swindl*|hustl*|fake name|alias*'],
        ['blackmail', 'Blackmail', 'leverage and secrets, and making them pay', 'not in the Sims', 'blackmail*|extort*|secret*|evidence|leverage|or i tell|expose*|keep quiet|hush money'],
        ['stealth', 'Stealth', 'moving unseen and unheard', 'not in the Sims', 'sneak*|snuck|creep*|crept|tiptoe*|quiet*|silent*|unseen|hide|hid|hiding|shadow*|lurk*|stealth*|locker*'],
        ['stalking', 'Stalking', 'following, watching and learning someone’s life', 'not in the Sims', 'stalk*|follow*|watch her|watch him|watching her|watching him|tail*|surveil*|binocular*|routine'],
        ['kidnapping', 'Kidnapping', 'taking someone and keeping them', 'not in the Sims', 'kidnap*|abduct*|snatch*|grab her|grab him|grabbed her|grabbed him|van|chloroform|gag*|tie her up|tied her up|tie him up|tied him up|ransom|captive*|taken'],
        ['body_disposal', 'Covering tracks', 'cleaning up, body disposal, leaving no evidence', 'not in the Sims', 'dispos*|clean up|cleaning up|cleaned up|bleach|evidence|bury|buried|grave|lye|acid|fingerprint*|dna|forensic*|body|bodies|hide the', 'covering tracks (cleanup and body disposal)'],
        ['knife_fighting', 'Knife fighting', 'blades up close', 'not in the Sims', 'knife|knives|blade*|stab*|slash*|switchblade*|dagger*|scalpel*'],
        ['marksmanship', 'Shooting', 'guns, aim and nerve', 'not in the Sims', 'gun*|shoot*|shot*|aim*|rifle*|pistol*|revolver*|trigger|bullet*|scope|sniper*'],
        ['smuggling', 'Smuggling', 'moving things past borders, guards and checkpoints', 'not in the Sims', 'smuggl*|contraband|border*|checkpoint*|customs|stash*|hidden compartment*|shipment*|cargo'],
        ['gambling', 'Gambling and cheating at cards', 'cards, dice, odds and sleight of hand', 'not in the Sims', 'gambl*|cards|poker|bet|bets|betting|wager*|dice|casino*|blackjack|odds|chips|deck|cheat*'],
        ['gaslighting', 'Gaslighting', 'making someone doubt their own mind', 'not in the Sims', 'gaslight*|imagining|that never happened|never said that|misremember*|crazy|confus*|your mind|doubt*'],
    ]],
];
const SKILL_TAGS = SKILL_CATEGORIES.flatMap(([group, icon, color, rows]) => rows.map(([id, label, cue, from, words, prompt]) => ({ id, label, cue, from, words, prompt: prompt || label.toLowerCase(), group, icon, color })));
export const SKILL_BY_ID = Object.fromEntries(SKILL_TAGS.map(s => [s.id, s]));

// 1–10, worded so the number and the word agree; the rule line in the note says what a level does.
const SKILL_LEVELS = [[10, 'master'], [9, 'expert'], [7, 'skilled'], [5, 'competent'], [3, 'amateur'], [1, 'novice']];
export const skillWord = v => SKILL_LEVELS.find(([min]) => v >= min)?.[1] ?? 'off';
const level = v => Math.max(0, Math.min(10, Math.round(Number(v) || 0)));
export function cleanSkills(obj = {}) {
    return Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).filter(([id, v]) => SKILL_BY_ID[id] && level(v) > 0).map(([id, v]) => [id, level(v)]));
}
export function cleanAlways(obj = {}) {
    return Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).filter(([id, v]) => v && SKILL_BY_ID[id]).map(([id]) => [id, true]));
}
// Words → one pattern. "a|b c|stem*": whole words, spaces match any gap, '*' allows any ending.
const patterns = new Map();
const escapeRe = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function patternFor(words) {
    if (patterns.has(words)) return patterns.get(words);
    const parts = norm(words).split(/[|,;]/).map(w => w.trim()).filter(w => w.length > 1)
        .map(w => escapeRe(w.replace(/\*$/, '')).replace(/\s+/g, "[\\s-]+") + (w.endsWith('*') ? "[a-z']*" : ''));
    const re = parts.length ? new RegExp(`(?:^|[^a-z'])(?:${parts.join('|')})(?![a-z])`, 'i') : null;
    patterns.set(words, re); return re;
}
const calledFor = (words, scene) => Boolean(patternFor(words)?.test(scene));
// Everything this person has set, strongest first.
export function skillsOf(state) {
    if (!state) return [];
    const set = cleanSkills(state.skills), always = cleanAlways(state.skillAlways);
    return Object.entries(set).map(([id, v]) => { const s = SKILL_BY_ID[id]; return { id, label: s.label, prompt: s.prompt, words: s.words, level: v, always: Boolean(always[id]) }; })
        .sort((a, b) => b.level - a.level);
}
// Which of them the scene calls for. scene: the player's latest message and the last reply(s).
// used: what the hidden line says was used last reply (Claude names skills by label, so labels count there). At most `cap`, always-on first, then the highest.
export function litSkills(state, scene = '', used = '', cap = 6) {
    const s = norm(scene), u = norm(used);
    return skillsOf(state).map(x => ({ ...x, why: x.always ? 'always' : u && calledFor(`${x.label}|${x.prompt}|${x.words}`, u) ? 'used' : s && calledFor(x.words, s) ? 'scene' : '' }))
        .filter(x => x.why).sort((a, b) => Number(b.why === 'always') - Number(a.why === 'always') || b.level - a.level).slice(0, cap);
}
const pt = v => String(v ?? '').replace(/</g, '‹').replace(/>/g, '›');
// people: [{ name, lit: [...] }]. One line per person, then one rule. Nothing at all when nothing is lit.
export function skillLines(people = [], u = 'the player’s character') {
    const rows = people.filter(p => p.lit?.length).map(p => `- ${pt(p.name)}: ${p.lit.map(x => `${pt(x.prompt)} ${x.level}/10 (${skillWord(x.level)})`).join(', ')}`);
    if (!rows.length) return [];
    return ['Skills this scene calls on:', ...rows,
        `Levels decide how attempts go, ${pt(u)}'s included: a novice or amateur fumbles, stalls or pays for it; skilled and above make it look easy. Nobody succeeds past their level because the scene needs it, and someone good at a skill reaches for it unasked when it fits.`];
}
