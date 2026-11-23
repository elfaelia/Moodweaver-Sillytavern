# Changelog

## 1.96.3: dice that really roll, steadier for experts
- Every new reply, swipe and regenerate now rolls fresh dice. Before, the dice were tied to the reply number on purpose, so swiping gave exactly the same roll and the same failure every time. A continue still keeps the reply's dice.
- Skill steadies the dice. From level 4 a person rolls twice and keeps the better; from 8, three times. From -4 they keep the worse of two, and from -8 the worst of three. So the better someone is, the more often they succeed and the less luck matters. A plain check at 7 now succeeds about 96% of the time and almost never goes badly. The note to the model shows "best of 2" and so on next to each roll.
- Contests stay fair between equals: reading people at 7 against masking at 7 is about even, and the side with the higher level wins more, more reliably.

## 1.96.2: the hidden line comes back
- The request for the hidden line now comes last of all in the note, right before the reply, as a firm line: after the story's last line, on its own line after a blank line, every reply, or `none` when nothing changed. It used to sit far up in the cached guide, while the last things before the reply told the model to end on an action or image and never mention the notes, so Opus 5.5 often ended on the story and left the line out.
- "End on an action" now says end the *story* on one, and "never mention these notes" says in the story, so neither clashes with the hidden line.
- If the model wrote the hidden line in its thinking instead of the reply, Moodweaver now finds it there, adds it to the reply and reads it, with no button tap.
- The line is read even when the model drops the colon after weave.

## 1.96.1: a phone on a speaker counts, and music you start yourself isn't paused
- Why the Pixies didn't count: the reply said "He hits shuffle. The Flip crackles once... and then the Pixies come up out of it... He turns it up two notches." None of those were words Moodweaver knew. It only knew "plays", "puts on", "turns on the radio" and the like, and it didn't know a Flip is a speaker. So it thought nothing was playing, and paused everything.
- New signs that music is on: hitting shuffle or play, "on shuffle", a speaker (Flip, JBL, Sonos, Bluetooth speaker, boombox, soundbar) crackling, playing, thumping or coming to life, and turning it up a notch or two.
- A band or artist "coming up", "coming on" or "coming through" ("the Pixies come up out of it", "Nirvana comes on") is now a named artist, but only when music is on in that reply, so "Clyde comes in" is never read as a band.
- Songs films made famous: when the story names the artist and the film ("the Pixies... after she made him watch Fight Club"), that exact song plays (Where Is My Mind?). "Hums the song from Fight Club" works too. About 25 well-known film songs are listed (Pulp Fiction, Reservoir Dogs, Donnie Darko, The Graduate, Say Anything, The Breakfast Club, Dirty Dancing, Top Gun, Trainspotting, Perks of Being a Wallflower, Easy Rider, Ghost, Wayne's World, Garden State, The Royal Tenenbaums, Lost in Translation, Apocalypse Now, Goodfellas, American Psycho, Drive).
- Music you start yourself in Spotify (the app, the lock screen, a headphone tap) after Moodweaver paused it is no longer paused again a few seconds later. It plays on like \u25b6 does, until the next reply. Then the story decides again: if music is on in the story it keeps playing, and if nothing is, it pauses.
- The Now card names a speaker as "a speaker" and shuffle as "a playlist on shuffle".

## 1.96.0: no bedroom dynamics before they've been to bed
- 18 dynamics take for granted that the two have already slept together (Comfort in bed, Easy in bed, Afterglow lovers, Fight and bed, Friends with benefits, Learned their body, Teacher in bed, Past lovers now strangers and the like). They now only come up once there's real evidence: a tie that means it (lovers, married, exes, an affair, a secret relationship, friends with benefits, a one-night stand, long-term partners) or a message earlier in the chat where sex plainly happened (two or more sentences of it, none imagined, wished or remembered).
- This holds for the meters, the story's own call in Story mode and the scene reader. A dynamic you pick yourself with I pick always stays.

## 1.95.2: phones, earbuds, car stereos, live bands, DJs and karaoke count as in-story music
- In-story music is no longer only radios, jukeboxes and record players. Music that is playing counts from: a phone or laptop ("plays a song off her phone", "his phone is playing"), earbuds or headphones ("pops her earbuds in", "music in his headphones"), a car stereo, aux cord or Bluetooth speaker ("plugs his phone into the aux", "turns up the stereo"), live music (a band, singer, quartet or pianist playing, "the band launches into", "the set starts"), a busker or street musician, a DJ ("the DJ drops", "the beat drops"), and karaoke ("grabs the mic", "gets up to sing").
- Each one needs a real sign that it's on. Checking a phone, headphones round someone's neck, a stage with nobody on it, or a DJ booth in the corner don't count.
- It goes off on signs like pulling out earbuds, "the music stops", "the band takes a break", "the set ends", "karaoke's over", or a phone dying. Otherwise it stays on for 4 replies (In-story music only) or 6, and any new mention of it playing keeps it on.
- Songs the story names through these work too: "the band launches into Creep", "the busker covers Wonderwall", "puts on \u201cHurt\u201d on her phone", "sings Dancing Queen at karaoke". A sung title that isn't a singer plays that song (yours first, else the best-known version on Spotify).
- The Now card says where it's coming from ("Playing in the story: a busker...").

## 1.95.1: In-story music only holds, no song is banned
- In-story music only now really holds. Only these can play: a radio, jukebox or venue the story has on, a song the story names (until it ends), or something you start yourself with \u25b6 or a song's own play button (until the next reply). Anything else is paused within seconds, including Spotify's own autoplay after a line-up runs out. Lyric cues, stings and scene changes never start music in this mode.
- With it on, a radio or jukebox nobody mentions again goes quiet after 4 replies (6 without it); any new mention of it playing keeps it on.
- The switch is now also on the Now card, under the scene dropdown, with a line saying what's playing in the story and when it stops, or that nothing is.
- Undone from 1.95.0: the shock-title and grim-song ban for the radio, jukebox and venues. No song is ever banned: only the story's era and how well a song fits the scene decide, as everywhere else. The jukebox fix stays (it has to be playing to count).

## 1.95.0: in-story music, overhauled
- Why "Violent Pornography" played in the bar: the reply said "a couple at the high-top by the jukebox". Just naming the jukebox switched the in-story radio on, and the radio then played the best fit for the scene (an argument, angry moods) from all your songs: a frantic, angry System Of A Down song. Nothing checked whether the jukebox was actually playing, or whether a song like that could ever be on in the background.
- A radio, jukebox, stereo or record player now has to be on or playing: turned on, playing, crackling, a quarter dropped in, a song punched in, something "on the radio" or "from the speakers", a record put on. Just being in the room isn't music.
- A song or artist the story names now plays: hummed, sung, whistled, played, put on, punched in, or "on the radio". "Hums Taylor Swift" plays a Taylor Swift song (one of yours if you have any, else one of her best known from Spotify search); "punches in \u201cCome As You Are\u201d" plays that exact song; "Fleetwood Mac's \u201cDreams\u201d", "\u201cLove Story\u201d by Taylor Swift", "a Ramones record" all work. Artists not in your playlists are found through Spotify search. The Now card's reasons show the story's own words ("hums Taylor Swift" in the story).
- Nothing shock-value in the background: the radio, a jukebox and venues never pick a song with a title there to shock (porn, murder, rape, torture, slurs and the like), or one made for violence, captivity, cruelty or a breakdown, unless the scene itself is Danger, Dark or Action. A song the story names is exempt.
- The radio and jukebox now work like venues: your songs that fit the scene and the era come first, Spotify search mixes in, and the line-up plays on (the film score doesn't cut in while it's on).
- New: Mix (Music settings, under In-story radio): Mostly my songs (3 of yours to 1 found), Half and half, or Mostly Spotify search (1 to 3). A song the story names always plays first.

## 1.94.0: every turn-on says who does what
- What the AI is sent for each turn-on now says plainly who does it: "(they do it)", "(done to them)", or "(both do it)" for the mutual ones. 197 descriptions were rewritten so none are vague.
- 87 new giving or receiving sides, next to their partners: holding, carrying, claiming, owning, keeping, giving orders, scolding, punishing, setting rules, hunting, cornering; undressing someone, tearing clothes, neck kisses, hickeys, hands under clothes, lap dances, stripping; fingering, nipples, scratching, deep throat, swallowing, facials, squirting, toys, strap-ons, thigh riding; positions (from behind, against a wall, bent over a desk, riding, missionary, spooning, standing, legs over shoulders); worship, begging, hand over the mouth, dirty talk, aftercare, fucked out; crops, branding, needles, shocks, hot and cold, textures, wax, clamps, ravishing, struggling, giving in, knives, guns, soft bondage, overstimulation, withholding, posing, conditioning, talking through, serving, dirtying, writing on skin, cross-dressing, public and size humiliation, corruption, cruel choices, experiments, sleep, feeding up, nursing, watersports, vore, collars, leashes, gags, blindfolds, handcuffs.
- Saved values stay where they were. Turn-ons that used to read either way now name one side; the reply lists them so you can check yours.

## 1.93.0: turn-ons sent your way, reminders for both, opposites attract
- Settings › What is sent › Turn-ons sent, now the same for you, the character and anyone else in the scene:
  - When they fit the moment (default): all of them in an intimate scene; otherwise only one the story touches, one the other person shows, one that lit last reply, and on reminder replies a random two. The character's own used to go every reply; now they follow this too.
  - Only in intimate scenes: none at all outside one.
  - All of them, every reply.
- Turn-on reminder: every 2, 3, 4, 5, 6, 8 or 10 replies, or off. The two sent are picked at random each time, separately for each person.
- Strong turn-ons only: a switch that leaves out every turn-on and turn-off below the third moon, whatever the choice above.
- New turn-on: Opposites (Personality › Quirks). It lights from who the other person is when one of their traits is the opposite of one of yours (43 pairs, e.g. introverted and extroverted, good girl and bad boy, uptight and hedonistic, sunshine and cynical, sheltered and feral).

## 1.92.0: two male gaze filters
- Two new rows under Story › Point of view & tense: **Male gaze, artful** and **Male gaze, leering**. One at a time; either goes with any narrator and tense.
- Artful: the narration looks at you (and anyone else the character wants) the way a painter or a camera would, lingering on light, the lines of the body, clothes, posture and small unguarded habits, slow and admiring, never crude. One or two lingering looks a reply, set into the action.
- Leering: the narration looks through a leering man's eyes: body before face, crude and possessive sizing up, eyes sliding back mid-conversation, in everyday scenes too. Plain grammar, coarse words from the character's own time, no trendy slang, and the narration never judges or softens it. Your character's actions and feelings stay yours to write.
- With close third or first person the gaze is the character's; with omniscient or outside view it's the narration's own eye, the character's whenever the scene is with him. The reminder at the end of the notes names the gaze too.

## 1.91.6: tab rows fit, no false Fading out, quiet care moves meters, One-sided flipped, a word per star
- Tab rows never cut off: with three or more tabs each one stacks its icon over its name, so Self (Traits, Mind, Skills, Period, Wants) fits on a 320-wide phone with counts showing. The Mind icon no longer draws a purple emoji box.
- Fading out: the dynamic underneath was read from the slow meters alone, and early in a chat those are low, which matched Fading out even for childhood friends. Now Fading out and Drifting apart need friendship, romance or loyalty to have actually dropped over recent replies. Ties that mean a shared past (childhood friends, family, siblings, chosen family) keep History high.
- Quiet care counts: the hidden line now tells the model how big a usual step and a turning-point step are for the pace, and that small acts of care, standing between you and trouble, and loyalty shown not said move the meters as much as declarations.
- One-sided is now "Thinks it's mutual" read the right way: it starts at "thinks it's one-sided" and climbs to "knows it's mutual". Saved values are turned over once. Nine dynamics that read it were flipped to match. The other meters were checked: none started at their endgame.
- Every star has its own word: extra meters show five stars with a different word on each, and Friendship, Romance, Trust, Respect and Pressure have nine different words across their range.

## 1.91.5: Erotic needs a real act, Hanging out, In-story music only
- Erotic, audited. The bar scene still read as Erotic from the words "wet", "sweat", "neck", "mouth" and "flushed": everyday body words counted half each and added up past the line. Now the words that only describe a body (a flushed neck, a wet coat, sweat in a hot room, a mouth that talks) can only ever add to a plain act, never make one. Erotic needs at least one clear act in the story: making out, undressing someone, a hand under clothes, kissing down a neck, grinding against someone, thrusting and so on.
- Words that read sexual but often aren't were narrowed: "fuck you" in a row, "inside her coat", "cocks the gun", "arouse suspicion", a heart or rain pounding, "rolling his eyes", "lean against", "the spoon" in a kitchen, whimpering in grief, a breath catching in panic, someone pinned in a fight. Grief or fear leading the moods, a fight, or a public row or grief scene are never Erotic unless sex is plainly happening.
- Tested on 21 everyday scenes full of body words (bar, spilt drink, dead relative, funeral, hospital, fistfight, row, gym, rain, bath, panic attack, deal, kitchen, nightmare, dance floor, tattoo) with heavy desire and the horny meter at 70: none read as Erotic. All 10 real foreplay and sex scenes still do.
- Grief reads better: passed away, lost my grandma, my late dad, "the booth goes quiet", awkward silences, sorry for your loss.
- New scene kind: Hanging out. Friends at ease together: a booth at the bar, jokes and banter, a game of pool, another round, catching up. Auto picks it when nothing heavier is going on; a row, grief, danger, a fight, real drunkenness, a wild party or flirting still win. 43 songs are tagged for it (41 of Kenny's, 2 of Easterman's), and untagged easy-going songs fit too. The sheets have the new Moment "Hanging out".
- New: In-story music only (Music settings, under In-story radio). Spotify plays only what the characters can hear: a radio, jukebox, record player, or a bar, club or gig's own music. The rest of the time it is paused instead of scoring the scene. Ambience carries on as usual. Turning it on switches In-story radio on if it was off.

## 1.91.4: a glance isn't heat
- The other half of the spilt-drink mix-up: "wet" is read as arousal when the person is heated, and a single desire feeling named in the latest reply counted as heated at any level. Kenny's "Checking them out 15" was enough.
- Now light wants (checking them out, flirty, coy, teasing and the like) never count as heated, and a stronger desire feeling named in the reply only counts once it is at 21 or more. A desire feeling at 41 or more still counts as before.

## 1.91.3: a spilt drink can't make a bar argument Erotic
- The bar argument still read as Erotic. The cause: a drink spilt on her coat ("a wet spot", "soaks through"). When a reply's hidden line or the board says someone is "wet" with no other words around it, and that person is feeling heated, Moodweaver turns on the fact Wet (aroused). That fact alone made the scene Erotic, and the bar wasn't noticed as public because no place fact was on.
- A public argument is now never Erotic, whatever facts are on, unless sex is plainly happening in the story. A sex fact on its own only counts away from an argument.
- "Wet" next to a drink, a spill, a glass, a napkin, a jacket, jeans and so on now means wet from water.
- The bar is noticed from the story's words too (jukebox, high-top, bar stools, pool table, last call, bouncer), and more argument wording counts ("his voice came out bigger", heads turning, "brings it down", "keep your voice down", "dickhead").
- When Auto reads a scene as Erotic, the Music tab now says why under the dropdown: the exact words, any sex fact (with where to turn it off), and the feelings.

## 1.91.2: sitting in a lap is sweet, not erotic
- Sitting on someone's lap (sits in, curls up in, plops into, pulled into his lap) now counts toward Sweet instead of foreplay. Cute lap scenes read as Sweet.
- A lap scene only turns Erotic with real sexual cues alongside it: grinding, a hard or deep kiss, hands roaming under clothes, moaning, arousal words. A lap dance or grinding in a lap still counts as foreplay.

## 1.91.1: feelings alone never make a scene Erotic
- A bar argument played sex music. The cause: the music turned Erotic whenever someone's desire feeling was 31 or more, or the horny meter was 41 or more, whatever the story said. Kenny wants someone most of the time, so almost any scene could read as Erotic.
- Now the story has to agree. Heat from feelings or the meter only counts when the newest messages have some touch, kissing or undressing in them (a hand stroking a thigh, a kiss on the neck). Feelings still shape everything else: whose song, which mood.
- In public (a bar, a booth, a restaurant, a crowd, or a public place fact) it takes plain foreplay or sex words (making out, hands under a shirt, moaning). An argument in public is never Erotic unless sex is plainly happening.
- Rows read better: arguing, bickering, snapping at someone, "let me out", "you're drunk", "leave me alone", storming off, and tipsy or glaring count towards Drama.
- "His lap" on its own (sliding past him out of a booth) no longer counts as foreplay. Being pulled into or sitting in his lap still does.

## 1.91.0: add a missing hidden line
- When a reply comes back without Moodweaver's hidden line, a big ◆ Add the hidden line button now shows right under that reply in the chat. One tap asks your roleplay model for that line only (your normal connection, preset and chat, with Moodweaver's notes), adds it to the end of the reply (hidden, as always) and reads it straight away, so the reply moves feelings, meters, needs and the rest like any other. The story text isn't touched.
- If the model answers without a line, the button says Try again. It never shows under the opening message, during a reply, or when the hidden line is switched off.
- Settings › What is sent › "Offer to add a missing hidden line" hides the button.

## 1.90.6: a deal is the job, not danger
- A buyer turning up no longer reads as Danger. Everyday street words were counting as threat: "the corner" (where dealers stand) counted as being cornered, "hide the stash" as hiding from someone, and "a hit", "crack" and "a shot" as violence. Now only "cornered", "hiding from", "hunting him down", "shot him", "kill her" and the like count.
- When the story is about dealing (someone wanting to buy or score, "you got anything?", a sale, a dime bag, cash) and nothing truly threatening is said, Danger stays out: a calm deal is Street, and a deal with unease in it (paranoia, a hand drifting to a waistband, someone watching warily) is Tense. A gun pulled, blood, a real beating or real fear in the moods still make it Danger, and a police chase is Action.
- Escape needs fear or flight in the scene too, not just a rough part of town and high energy.

## 1.90.5: Kenny's songs double-checked
- The 149 Kenny songs that 1.90.0 marked "not web-verified" were researched again online. 138 are now confirmed from real sources (Wikipedia, Songfacts, Last.fm, Bandcamp, AllMusic, soundtrack listings), with their tags corrected where the research changed the picture. 11 small or obscure tracks still couldn't be found anywhere and keep the "not web-verified" note.
- One correction: Deftones' "Do You Believe" is a Cardigans cover, and is tagged that way.
- These merge in by themselves. Songs you've changed yourself keep your tags.

## 1.90.4
- Fixed: SillyTavern stuck on "Initializing…" on iPhone. Safari misread one character in data/catalogue/story.js (the authors and writing styles), so none of Moodweaver could load, and SillyTavern waited for it forever. Every code file is now plain ASCII (curly quotes, stars and accents written as \u escapes, which mean exactly the same), checked by tests/ascii.mjs.
- The front door from 1.90.3 stays: Moodweaver loads in the background, so SillyTavern never waits for it. Its strip now only appears when loading takes over 3 seconds or a file fails.

## 1.90.3
- The iPhone hang: with the Moodweaver folder taken out, the phone loads, so something in Moodweaver's files stops Safari while they load (before ?mwoff can act). Moodweaver now loads through a small front door (index.js) that brings in its files one at a time, in the background, so SillyTavern never waits for it. A strip at the top of the screen shows each file as it loads; if one is slow or fails it says which, and if the counting stops the page itself froze. It disappears once everything has loaded. The start-up itself moved to main.js.
- The 1.90.2 startup log is gone (it couldn't write its file); ?mwoff stays.

## 1.90.2
- To find why the iPhone sticks on "Initializing…": for the first minute after the page opens, Moodweaver writes a startup log to the PC (data/default-user/user/files/moodweaver-startup-iphone.txt, or -computer), with each step's time, the size of its saved settings, any page errors from any extension, and whether the loading screen is still up at 2, 5, 10, 20 and 40 seconds. Open it on the PC at http://127.0.0.1:8000/user/files/moodweaver-startup-iphone.txt.
- Add ?mwoff to the end of the address (192.168.1.11:8000/?mwoff) to open SillyTavern with Moodweaver switched off on that device only, for that visit.
- Nothing else changed.

## 1.90.1: lighter start on phones
- After 1.90.0, SillyTavern on an iPhone stuck on "Initializing…" (the laptop was fine). The 1,084 built-in songs are now stored as one JSON string, which Safari reads much faster and with far less memory than the big block of code it was before. They also merge in 8 seconds after SillyTavern has loaded, never while it's loading, in small steps so the page never freezes.

## 1.90.0: Kenny's playlist and 13 kinds of scene
- **13 kinds of scene instead of 7**, chosen from a dropdown ("This scene is…") with a one-line hint for each: Erotic (was Intimate), Romantic (new), Sweet, Tender, Danger, Action (new: chase, fight, job), Drama (new: row, betrayal, confrontation), Tense (new: a normal drug deal, a standoff, waiting), Street (new: hustling, cruising), High (new), Sorrow, Dark, Party.
- **Erotic and Romantic are really split.** Songs that sound sexual are Erotic; love and longing songs that don't are Romantic and never play during sex. A love scene with no heat now reads as Romantic, not Erotic.
- **Kinds of high**: stoned, rolling, tripping, wired, nodding, drunk, comedown, read from the story's words (a line of coke reads wired, "dope sick" reads comedown, not nodding).
- **Heard in the room**: a new tag (sheet column "Heard in", ✎ Tags chips) for songs that play inside the scene: punk shows, clubs, house parties, bars, car stereos, radios. Those songs lead at that kind of place.
- **🪦 SOLAD built in**: 853 songs for Kenny, 555 newly researched (lyrics, sound of that exact recording, film and TV use), each tagged {{char}} (Kenny), {{user}} (you) or both. Songs the research couldn't confirm online say "not web-verified" in their note.
- **Easterman's songs re-sorted** into the new kinds: 80 made Romantic (heat removed), 51 kept Erotic, 27 both, plus new moments like standoff, nodding and drunk where they fit.

## 1.89.0
- Gender on the profile (Info › Facts for the character, You for you): Auto, Man, Woman or Non-binary. It sets the pronouns every line uses, which period lines apply, the Body row and the women-only sounds. Non-binary sends "they/them". The Pronouns box left Bonds; this replaces it.
- Cleaner writing, 8 new rows: No forced jokes (tone from your story, not the jokey source), People not their famous traits, No punchline endings, People get it wrong, Ordinary moments too, No parroting, Let them stay hard, Leave it unresolved.
- Writing style, 9 gritty rows: Junkie clock, Written high, Comedowns, Body keeps score, Nihilist one-liners, Dissociated, Bar-stool voice, From inside the scene, No redemption arc.
- 12 gritty American authors: Robert Stone, Craig Clevenger, Will Christopher Baer, Tao Lin, Dan Fante, James Frey, Joshua Mohr, Sam Pink, Richard Hell, David Foster Wallace (Infinite Jest), Don Carpenter, Andrew Vachss (360 authors).

## 1.88.5
- Star switches no longer show a tick inside. SillyTavern draws its own tick in every checkbox; the panel now hides it, so the lit star is the tick. The Carrying box shows a star too.
- Fewer repeated names in dynamic, meter, link and period lines. When both people share a pronoun, or one is "They / names", a repeat becomes he/she/they only where it can mean one person (the other name hasn't come up since). "They" gets its verb to agree ("they are", "they keep") and keeps the name where it can't. "likes Kenny and acts…" can now be "likes him and acts…"; "can't bear Ellie" → "can't bear her"; "that Kenny wants" → "that he wants".
- tests/pronouns.mjs also checks they/they.

## 1.88.4: sex sounds only when sex is actually happening

- **No more moaning and thumping when someone is only imagining it.** Sex sounds (the bed and furniture, wet, skin, her voice and breathing, fingers, spanking, the whip) used to follow the scene's heat, so a character fantasising in a diner set them all off. Now they need sex happening in the last two messages, read sentence by sentence: anything imagined, pictured, daydreamed, wished, wanted, remembered, thought about or hypothetical ("would", "could", "in his head") doesn't count.
- **Public places hold back harder.** In a bar, diner, café, restaurant, campus, lobby, street, beach, hospital and the like, it takes at least two sentences of plain, happening sex before any of it plays, and warmer sounds (wet, fingers, grinding) stay off there unless sex is really happening.
- One-off slaps and whip cracks follow the same rule.
- When no furniture is named, the room they're in picks it: a bedroom, dorm or motel room is the bed, a house the couch, a back room the desk.
- "The busy bar" or "the bar restroom" now count as a bar.

## 1.88.3: breathing from your own recordings, in waves

- **Breathing is now your recordings, not made-up noise.** Your two breathy panting clips are cut into 20 single breaths (only the breathy parts, not the moans), each played a touch faster or slower and louder or softer so it never repeats exactly.
- **It comes in waves, not constantly.** A run of 3 to 7 breaths swells in and fades out, quicker when the scene is fast, then it goes quiet. When the story mentions panting, gasping or breathing hard, the runs come every 8 to 20 seconds while the mention is in the last two messages. In sex without a mention, a run only now and then (every 25 to 55 seconds).
- **Female breathing only:** it plays only when you or the character is a she, like her moans.

## 1.88.2: no more whooshing and crackle on top of the bar

- **The breathing layer was the whoosh.** It was made from puffs of filtered noise and played in any scene with a little heat, so a flirty bar scene got a constant rhythmic whoosh over the voices. It now plays only in sex, or when the last two messages say someone is panting, gasping or breathing hard, and it's much softer and rounder.
- **Rain indoors** is now a soft, muffled wash on the windows instead of a hissing downpour with crackly drops on top of the room. Outdoors it's unchanged.
- **Radio crackle** only plays for a real radio, record player or gramophone, never for a band, a DJ or venue music (1.88.1's venues could switch it on in a bar).
- Two other noise layers fired too easily and are tighter now: live-wire buzz needed only the word "electric" (now an electric chair, shock, current or fence), and facility vents fired on any "corridor".

## 1.88.1: venues play their own music from Spotify, and the place recordings used far more widely

- **Venue music (in-story, from your Spotify).** A club, a jazz bar, a cocktail bar, a dance (prom, sock hop, ballroom), a party or a gig now switches the music by itself from film score to what the characters can hear there, and Claude is told what's playing so they can react to it. It all plays through your Spotify like the rest of the music:
  - **Your playlists first:** songs whose Spotify genres fit the venue (jazz, swing and blues for a jazz bar; dance, house and disco for a club; upbeat pop and R&B for a cocktail bar; rock and roll, doo-wop and soul for a dance; rock and punk at a gig).
  - **Then Spotify search** fills the rest with real tracks of those genres, within the story's era when one is set, a few pages from a random start so it's fresh each time. You don't need to make any venue playlists.
  - **A named band at a gig** ("a Descendents show", "the Misfits take the stage") plays that band: your songs by them, then their tracks from Spotify.
  - While they stay in the venue its line-up keeps playing. Leaving (or "the band stops"), or the scene turning to sex, brings the film score back.
  - Music › Extras › In-story radio › "Venues play their own music" (on).
- **Second takes:** a bar, a busy bar, a café-cafeteria, a diner, the campus, the sea, the woods, a camp at nightfall, the carnival and the junkyard each have a second 40-second cut from a different part of your clip, picked at random.
- **New versions made from the same recordings**, shaped live (no extra download): heard through a wall, from a distance, or in a big echoing room:
  - A party or club through the wall (next door, music from downstairs, the club bathroom). Outside a club (the queue, the alley behind the bar, bouncers).
  - Big echoing halls (prisons, mess halls, gyms, locker rooms, warehouses, train and bus stations, airports, auditoriums), school hallways, echoing lobbies (hotels, waiting rooms, banks, foyers, police stations, cinemas), an echoing ward (asylums, psych wards, hospital corridors).
  - The back room (store rooms, staff rooms, behind the counter), a motel room (the motel fact now plays this), the sea through the walls (beach houses, inside the lighthouse, below deck), wind against the windows (snowed in, storms battering the house), night outside the tent or cabin, a fair in the distance, distant machinery and trains.

- **Every recording now covers every place it can pass for**, not just the one it came from:
  - **Restaurants** (bistros, steakhouses, pizzerias, delis, a dinner date, the waiter) play the diner, the café or the busy restaurant-bar, one picked each time; the fancy restaurant fact does the same.
  - **Bars:** any bar (hotel, dive, piano, local), lounges, saloons, taverns, speakeasies, jukeboxes, last call, the country club. **Busy rooms:** clubs, parties, dance floors and halls, casinos, frat houses, ballrooms, galas, receptions, the club bathroom.
  - **Diner:** also truck stops, burger joints, fast food, drive-thrus. **Café:** bakeries, tea rooms, bookshops. **Cafeteria:** malls, lobbies, waiting rooms, police stations and bullpens, the cinema.
  - **Bedroom:** anyone's room (a friend's, "Chloe's room"), hotel rooms, guest rooms, apartments, flats, lofts, penthouses, in bed, bathrooms. **House:** any house or home (yours, theirs, someone's parents'), dining rooms, hallways, dealers' flats and trap houses. **Dorm:** also boarding schools, barracks and bunk rooms.
  - **Campus:** high school, college, university, lockers, the school. **Outdoors by day:** your Before the Storm title clip (birdsong) plus the woods, for parks, gardens, fields, meadows, picnics, farms, riverbanks, pools and the outdoors fact. **Neighbourhood:** front yards, porches, driveways, cul-de-sacs, walking someone home, by day the birdsong and by night the suburb at night.
  - **Roadside** (outside Two Whales): parking garages, bus stops, phone booths, laundromats, outside any shop or bar; at night it becomes the motel. **Motel:** inns too. **Junkyard:** rail yards, train tracks, trailer parks, abandoned lots, the train fact.
  - **The sea:** marinas, coastlines, boats. **Clifftop:** lookouts, hilltops, ridges. **Wind:** the rooftop or the overlook.
  - **Old stone hall:** museums, galleries, libraries, manors, stately homes, chapels, funerals. **The city after dark:** any street at night, crime scenes and dangerous places at night.
- **Quiet rooms stay quiet.** Chloe's room and Max's dorm were nearly silent recordings, and 1.88.0 turned them up to match the bar, which would have meant a loud hiss. They're now cut at a quiet room level.

## 1.88.0: real place recordings, and everyday and erotic sounds on their own switches

- **Why your bar sounded like snow on a beach:** the "murmuring room" under bars, diners and clubs was made up from filtered noise, and on a phone it read as surf or wind. It's gone. Bars, diners, cafés and clubs now play real recordings.
- **26 real place recordings from your clips**, each cut into a seamless 40-second loop, started at a random point each time with a slow swell so the join never shows: a bar, a busy bar or club (parties, dance halls), a café or restaurant, a cafeteria (also malls and public places), a diner, outside by the road (parking lots, gas stations), two dorms, a quiet house (kitchen, living room, a friend's place), a bedroom, a campus by day and one at night, a hospital room, the sea (beaches, harbours, piers), a windy clifftop or lighthouse (two takes), a rooftop in the wind (also graveyards, snowed-in and abandoned places), the woods, a camp at nightfall (the woods or a campfire at night), a quiet suburb at night, a junkyard, a motel at night, a carnival or boardwalk, the city after dark, and an old stone hall (churches, chapels, cathedrals, mansions, castles).
- **Night and day:** a campus, the woods, a suburb and the city each switch to their night recording when the board says it's night.
- **Everyday and erotic sounds can each be switched off.** Music › Extras › Ambience › What plays: "Everyday sounds" (places, weather, a heartbeat in danger, doors, gunshots) and "Erotic sounds" (the bed and furniture, bodies, breath, fingers, spanking, the whip and her voice). In a heated scene a slap or the whip counts as erotic; outside one it's everyday.
- Synthetic crickets no longer play on top of an outdoor recording that already has its own night sounds.

## 1.87.0: the story moves the cast too

- **Cast members in the scene now get automatic feelings and facts, like the character does.** When someone from your cast is in the scene, the hidden line can say how they changed this reply: one feeling (wary +10, scared off) and one lasting fact (in uniform, arrested, or that fact off). It's asked for only when something actually changed for them, so most replies add nothing, and a person costs roughly 10 to 20 tokens when they do.
- **Only people who are really there.** Anyone out of the scene is left exactly as they are, so talking about someone, remembering them or thinking about them never changes them. The board's Present line (people currently visible) already moves the cast in and out of the scene on its own, and the hidden line is told to leave out anyone only mentioned.
- **They settle down on their own.** Feelings the story gave a cast member fade when the story stops naming them (on the chat's pace), and facts that run a course (drunk, bleeding) wear off for them too. Anything you set by hand or pinned on them is left alone, and a fact you set yourself is never taken off by the story.
- **No feedback loop:** the cast gets no feelings-toward or meters from this, just their own feelings and facts.
- Swipes, edits and Undo put all of it back, same as for the character.
- ⚙ Settings › under "Present line moves the cast in and out": "The story moves the cast's feelings and facts" (on).

## 1.86.2: a crush stays its own feeling

- **"Has a crush on" is a feeling tag again, not part of the Romance meter.** A crush is its own thing: giddy, nervous, overthinking every exchange, half hoping nothing comes of it. Romance only says how much love there is. So on the character's side toward you it's back in Feelings toward › Attraction & romance as its own row, even with the meters on, and the character can set it or let it go through the hidden line like any other feeling there.
- It still counts as romance for dynamics (the crush dynamics like "has a crush and isn't handling it well" read it), so you lose nothing by keeping it as a tag.
- If you'd set it before 1.86.0, that update moved it into Romance; set it again if you want the tag back.

## 1.86.1: known turn-ons stay known, and are sent only when they fit

- **Nothing the character learns about you fades any more.** 1.86.0 capped learned turn-ons at 8 and let them drop back to suspected, which made no sense in the story: once he knows, he knows. That's undone. Known stays known, suspected stays suspected until he sees it again, and there's no cap.
- **Your turn-ons are sent only when they fit the moment, to save tokens.** Each one (known, suspected or unknown to him) goes in the note when the scene is intimate, when the last messages touch it (its name or its words), when the other person shows it, and your two strongest one reply in six as a reminder. The rest wait without being forgotten. ⚙ Settings › What is sent › "Send your turn-ons only when they fit the moment" (on). Off sends them all every reply, as before.

## 1.86.0: feelings that double the meters move into them, many more turn-ons, Saturn's ring and tap glow

- **No more double-ups between feelings and meters.** I checked every one of the character's feelings toward you against the meters and dynamics. 69 of them only said how much the character likes, loves, trusts, wants, fears or is hooked on you, which is exactly what a meter tracks. On the character's side toward you (with the meters on), each of these now *is* its meter, including the negative ones:
  - Likes, enjoys their company and loves are Friendship; can't stand, hates and despises push Friendship down. Trusts and feels safe are Trust; distrusts and suspicious push it down.
  - Finds attractive, has a crush, smitten and in love are Romance; not attracted, finds plain or ugly, turned off and grossed out push it down. Finds hot, turned on by and lusts after are Lust.
  - Respects, admires and impressed are Respect; looks down on pushes it below zero. Idolises and idealises are Pedestal. Fascinated and curious are Fascination.
  - Obsessed is Obsession; possessive, they're mine and wants to own are Possessiveness; jealous is Jealousy; depends and can't live without are Dependence; dominates and controls push Control his way, and submits to pushes it yours.
  - Protects and watches over are Protectiveness; would die for is Sacrifice; worries about, cherishes and dotes are Care; loyal is Loyalty; devoted is Devotion; proud is Pride in them; teases is Playfulness; comfortable with is Ease; confides in is Openness.
  - Resents is Resentment; irritated and sick of are Exasperation; afraid, intimidated and walking on eggshells are Fear; feels guilty is Guilt; feels inferior is Unworthiness; hides their life from them is Secrecy; competes is Rivalry; wants to corrupt is Corruption; wants to break or hurt is Urge to hurt; covers for is Complicity; studies is Clinical eye; keeps testing is Testing; attracted but won't act is Restraint.
- **Nothing you set is lost.** Any of these you'd set moves into its meter once (the meter takes it if that's further along), a side meter that was off comes on, and a short note says which. Dynamics, period lines and scene links that looked for "possessive" or "trusts" now read it from the meter, so they still fire.
- **The feelings-toward section is now for specific feelings:** roles, what they think of you, what happened between you (betrayed by, owes their life to, can't forgive), and how it shows. A line at the top says the rest are the meters on Bonds. Your own side, and anyone's side toward someone other than you, keep every row, since meters only exist between the character and you.
- **A smaller hidden line.** The character no longer writes the same feeling twice (once as a feeling toward you, once as a meter). "toward" now only asks for the specific kind; if it still names one that's a meter, the meter moves instead.
- **Learned turn-ons cap and fade.** The character keeps at most 8 of your turn-ons learned from how you react, the most recently seen first. One not seen for 60 messages drops from known to suspected, and after 120 it's forgotten. Anything you set by hand never fades.
- **218 more turn-ons (787 in all), normal and niche.** New ones in every group: lashes, a crooked nose, broad shoulders, the small of the back, hip bones, curly and red and silver hair, split lips, leather jackets, turtlenecks, a towel only, stammering, moaning, whisky on the breath, clean laundry, good with animals, street smarts, a poker face, thrill-seekers, chivalry, night owls, a sibling's best friend, nurses, pilots, mechanics, bartenders, photographers, hitmen, crooked cops, goths, ad men, werewolves, witches, back rubs, slow dancing, being introduced as theirs, having rules, being dared, neck kisses, hickeys, lap dances, rimming, sixty-nine, toys, strap-ons, riding, legs over shoulders, hotel rooms, reunion and goodbye sex, having to be quiet, bossy bottoms, gentle dominance, a cigarette after, face slapping, wax, pinning down, public humiliation, role-play, garters, fishnets, spreader bars, leashes, candlelight, jazz clubs and many more.
- **Saturn's ring on Music.** The cover art now has a tilted ring that passes behind it and in front of it, with bands and glints that turn while a song plays (and rest when it's paused).
- **Taps glow.** Whatever you tap (Fits, Not here, a moon, − and +, a pill, a star switch, any button) glows softly and fades, so you can see it registered, even when the panel redraws. Not here glows rose; everything else glows gold.

## 1.85.0: your second batch of sounds, and new layers for particular acts

- **More of your recordings in.** Your twenty new clips (a few arrived twice, so I used one copy of each) are cut into 460 short pieces, levelled against each other, and played the same way as before: a fresh piece each stroke, never the same twice in a row, all keeping pace with how fast they're moving.
- **Bed.** It now also has the bouncing springs from "Two people bouncing" on most strokes and the headboard from "Bed creaking headboard", which knocks on most strokes when it's fast and now and then when it's slow.
- **Sofa, desk, car and wall now use their own recordings**, not reshaped bed sounds: your leather sofa cushion clips, "Desk rocking against", both truck creak clips, and the three "body thumping against" clips. The office chair and floor still use the reshaped bed sounds until you send recordings of those.
- **Real skin slaps.** The slapping layer now plays "Skin on skin getting faster" and "Skin slapping rhythm" in place of the made-up slap, getting louder as the pace climbs. The wet layer also mixes in a slicker cut from the finger clips one stroke in four.
- **New layers that come in when the story names them (last two messages):** slick fingers (fingering words), skin rubbing (grinding, straddling, rubbing against), spanking (spank, over his knee, a slap on her backside), and a whip or belt (whip, lash, flog, crop, cane, a belt landing). Fingers keep time with the strokes. Rubbing is a slow continuous slide. Spanking and the whip land now and then, sooner the faster the scene is going.
- **Her voice.** Your moaning and whimpering clips play in sex scenes when you or the character is a she: moans come more often when it's fast, whimpers more when it's slow, with silences in between.
- **One-off sounds.** A slap or spank in a new reply now plays your recorded spank once; a whip or belt landing plays your whip once.
- Up to seven layers can now play at once, with a gentle limiter on top so they never crackle when they stack up at Loud.

## 1.84.3: no example words, no "Suits" hints

- **Every "Suits …" hint is gone.** All 348 author notes lost their "Suits …" line, and the era notes no longer name characters ("Easterman's era", "Patrick Bateman's decade", "Chloe Price, Joe Goldberg"). The notes keep what the author or era is like.
- **Rows no longer hand Claude words to say.** Quoted lines and word lists that Opus 5.5 would echo are now described instead:
  - Uses pet names: "calls people by pet names in their own way", with no list. The pet names box on a profile still sends your own names.
  - How feelings show: 23 feelings had a line in quotes ("for god's sake", "who, me?", "I'm fine", "mine", "fine", "just kidding" and so on). Each now says what happens, not the words.
  - Fatherly, Experimental, Smothering mother figure, Gaslit reality, the turn-ons for pet names and mock pity, three relationship ties ("touch them and die" and the like) and six skills (love bombing, guilt tripping, playing the victim, obedience, reading limits, protecting someone) lost their quoted lines too.
  - Eras: the 1990s, 2010s and 2020s rows dropped their slang lists ("whatever", "on fleek", "no cap", "it's giving" and so on). They keep the phones, apps, music and news of the time.
  - Authors: famous lines and catchphrases are out of the author briefs ("So it goes", "what ho", Hemingway's last line, Marty's "what do you feel like doing tonight" and a few more), so they can't turn up in your story. The technique is still described.
- **Kept on purpose:** examples that define a rule. The ban lists in No AI tells, No similes and No stock senses, the "saw her" versus "seen her" line in Close third, with attitude, the "are you alright" check-ins that No check-ins leaves out, the American and British word lists, and the 1960s period lines (historical facts, such as what doctors called things then).
- **One new line in the guide:** these notes say what to show, never words to use, and whatever anyone says or calls someone comes in that person's own words, from their own era, place and card.

## 1.84.2: no fake-cool words

- **"Clocked" is gone from Close third, with attitude.** Its example of fine narration is now the plain "saw her" (against "seen her", which isn't), with the chat's own character name filled in. The slang it allows is the character's own, from their time, place and kind of life, and it now names the fake-cool words to leave out: clocked, the audacity, lowkey, zero chill, a whole thing.
- **No AI tells now covers fake-cool words everywhere:** clocked (for noticed or recognised), the audacity, lowkey, not gonna lie, zero chill, a whole thing, it's giving, rent-free, chef's kiss and main character energy. They never go in the narration. In dialogue, they only appear when the era or the card shows that person really talks that way.
- **Everything sent to Claude fits any character.** I checked every writing, story, point of view, author and dynamic line for names or one-story wording. The point of view lines use whoever the chat's character is. Two things were tied to one story, and both are now generic:
  - "Uses pet names" said "darling, pet, little lamb". It now says "darling, pet, doll, sweetheart", so no chat gets nudged toward "little lamb".
  - The clinic dynamic "Reagent and keeper" is now "Subject and keeper", because "reagent" is one game's word. If you'd picked it, the pick follows the new name.
  - Character names that show only in the panel (such as "Easterman's era" under 1960s) are hints for you and are never sent to Claude.

## 1.84.1: close third, with attitude

- **A new narrator in Point of view & tense: Close third, with attitude.** It sits in between plain close third and deep third. The narration keeps normal, correct grammar and never does the character's accent ("clocked her" yes, "seen her" or "ain't" no). Their way of seeing the world leaks in a touch or two a paragraph: the odd swear word or bit of their slang, a blunt or crude description, and their gaze in what gets noticed and lingered on, including how they look at someone they want. Their full slang and accent stay in what they say aloud.
- Plain **Close third person** is unchanged. The new row is one of the narrators that switch each other off, and it gets its own one-line reminder at the end of the note like the others.

## 1.84.0: point of view and tense

- **A new Story section, Point of view & tense.** Find it under Story › ＋ Add. It sits first among the writing sections. Any moon turns a row on, because point of view isn't something to do a little of. It holds for every reply.
  - **Close third person.** The narration says he or she and stays with the main character. It shows only what they see, hear and know, and describes people and places the way they size them up. The narrator's own sentences stay plain narrative prose, so their slang, accent and swearing live in what they say aloud and the odd short thought in italics, never in the narration. This is the one you use most.
  - **First person.** The main character narrates as "I", in their own voice and grammar, and doesn't explain their feelings in tidy modern language.
  - **Omniscient third.** A narrator outside everyone who can move between people, but never writes your character's thoughts.
  - **Outside view.** Like a camera: only what could be seen and heard, with nobody's thoughts.
  - **Second person** (moved here from Writing style). Your character is "you". It goes with any of the narrators above.
  - **Present tense** (moved here from Writing style) and **Past tense.**
- **One at a time.** Turning on a narrator turns the other narrators off, and the same goes for the two tenses.
- **Sent firmly, for Opus 5.5.** Point of view and tense now go as a full instruction rather than a weighted setting. They're spelled out with the guide, and a one-line reminder is sent last, next to your prose rules, because earlier replies in another point of view pull hard. When one is set, the author notes say to keep it. Authors who wrote in first person no longer pull a third-person chat their way.

## 1.83.0: real bed sounds that keep pace, ambience on its own, twelve explicit authors

- **Real recorded sounds in sex scenes.** The bed sounds are now built from your five ElevenLabs clips, cut into 133 short pieces (creaks, frame knocks, thumps, wet strokes). Every stroke picks a fresh piece, never the same one twice running, and varies its pitch, loudness and length a little, so it never settles into two beats on repeat. The pace also drifts slowly (a build, an ease) and pauses now and then, like people rather than a metronome.
- **Every surface rebuilt from those clips.** Bed (thump, creak, and the frame knocking on harder strokes), office chair (higher, squeakier creaks), desk (a hard knock with things rattling on top), wall (deep thuds), car (springy rocking), sofa (soft, muffled thumps with a cushion creak) and floorboards (low creaks).
- **Speed follows them.** The sounds go faster the faster they're moving. The scene's energy sets the pace, and words in the newest message push it further: faster, harder, frantic, pounding, desperate and similar speed it up; slow, gentle, languid, savouring, grinding and similar ease it down. A change glides in over about six strokes instead of jumping. At its slowest it's about one stroke every two seconds, at its wildest about two and a half a second.
- **Layers that play together.** Wet, slick sounds are now their own layer, under the furniture in any sex scene (and in other heat when the story says wet, slick or similar). Skin slapping is a separate layer that joins when it's rough or fast, and hits louder and sharper as the pace climbs. With breathing, up to five layers play at once.
- **Ambience runs on its own.** It has its own line on the Music tab (☁ with what's playing, ❚❚ to pause just the ambience, ⌄ for its settings). It plays without Spotify signed in, keeps playing while the music is paused, and the music's pause no longer stops it.
- **Twelve more authors who write sex on the page, no fade-outs.** 1920s to 1960s: Jean de Berg, Frank Harris, Philip José Farmer (his late-60s horror novels), Clarence Major, Phil Andros. 1970s to now: Gordon Merrick, John Preston, Larry Townsend, Pat Califia, Lauren Blakely, Ana Huang, Navessa Allen. All male, dual or women-loving-women point of view, with books and full style descriptions like the others (348 authors).

## 1.82.0: the new look, step one (stars, − and +, pills, folded explanations, a slimmer top)

The first half of the UI overhaul, on every page at once. Each page's own piece of the sky, the Sky overview and the regrouped Settings come in step two.

- **− and + on every scale.** Every moon scale in the panel (moods, needs, relationship sliders, meters, desire, wants and the rest) now has a round − on the left and + on the right. Each tap steps to the next moon down or up, so nothing small has to be aimed at. Tapping a moon directly still works, and tapping the lit one still clears it.
- **Star switches.** Every tickbox is now a four-point star: a dim outline when off, lit gold and turned a little when on. Same switches, same places.
- **Pills instead of short dropdowns.** A dropdown with up to five short choices (Speed, Your sliders, When their moods clash and others) is now a row of pills: one tap picks, and the picked one glows. Long lists (authors, which feelings, starter blends) keep their dropdown.
- **Explanations fold away.** A long explanation under a setting or at the top of a tab now shows as one faint line with a gold ⓘ. Tap it to read the whole thing, tap again to fold it. Short notes, warnings and empty-list lines stay open. The full prompt preview in Settings › What is sent sits under "What's sent, in full".
- **A slimmer top.** You and the main character are now two slim pills with your leading feeling, and the cast sits beside them in the same row, which gives back about a fifth of the screen on every page.

## 1.81.0: more sounds, one Ambience switch, size facts in the background

- **Many more sounds, all reacting to the scene.** New layers that come and go with the story, at most four at once (during sex the bodies come first, then the weather and the place):
  - **Skin on skin** during sex when it gets rough or fast (the words "pounding", "harder and faster", "the slap of skin", or the scene's energy running high), in time with the furniture.
  - **Breathing** in any heat, foreplay or sex, quicker as it gets more intense.
  - **A heartbeat** when a dangerous scene runs high, or when the story says a heart is pounding or racing.
  - **A facility**: vents, a low hum, distant doors and an odd beep, for a facility, observation room, cell, lab, boiler room, interrogation room or shelter (the place fact, or the last four messages naming one).
  - **Live wires**: an electrical buzz with sparks, when wires, electrodes or a shock machine are in the last three messages.
  - **A distant alarm** when an alarm, siren or lockdown is in the last two messages.
  - The hospital monitor now beeps faster when the scene is tense.
- **One-off sounds for big moments.** When a new reply has a slap or a spanking, a door slamming, a zap or a jolt of current, a gunshot, breaking glass, a metal door or chains clanging, a crack of thunder, a flatline, a defibrillator charging and firing, or a drill, it plays once over everything, a moment after the reply arrives (up to three, one after the other). Never on a swipe, an edit or your own message, and only while Ambience is on and the music isn't paused by you.

- **Ambience is one thing now.** Camera clicks and Bed and furniture sounds were their own rows under Ambience, while every other sound came with it. They're folded in: with Ambience on, every sound plays when the scene calls for it (a camera when one is in use or in a darkroom or studio, the furniture during sex). Ambience keeps Off, Everyone and Only some.
- **Size facts stay in the background.** In an intimate scene a size fact went to Claude every reply, and with a touchy character (Easterman's small size) that made him bring it up in almost every message. Now it goes only when the scene draws attention to size (the words size, inches, a comparison, "small cock" and the like) or one reply in five as a reminder. Its wording also says it isn't mentioned in most replies and comes up once when something draws attention to it, not over and over. Still there, just not in every message.

## 1.80.0: bed and furniture sounds, a clear ✦ Fits, no old-time pop under sex, skips refresh the line-up

- **Bed and furniture sounds.** A new part of Ambience (Music › Extras, on for everyone, under Ambience). During a sex scene, what they're on keeps time with them: a creaking bed, and the headboard knocking when it gets rough; a squeaking office chair; a desk or table thudding with things rattling on it; thuds against a wall or door; a car rocking on its springs; a couch; the floorboards. It's picked from the last three messages ("bent over the desk", "the office chair creaked", "the back seat"), else from the place (a bedroom, hotel or motel is a bed, an office a chair, a car a car, a living room the couch). It only plays while the scene reads as sex, gets quicker as it gets more intense, is a little uneven like people are, and pauses now and then. Like the rest of the ambience it's made live in the browser, so nothing is downloaded.
- **On iPhone Safari.** The ambience now tells Safari it's background sound, so it mixes with Spotify playing in its own app instead of pausing it. Any tap on the page starts it (before, only taps on the Music tab did), and it wakes again after a call or a locked screen with the next tap. iPhones mute this kind of browser sound when the ringer switch is on silent, and Safari pauses it while the screen is locked.
- **✦ Fits shows it took.** The button turns green and reads ✓ Noted, with a short pop, and a line under it says what was saved ("this song fits intimate scenes like this one"). It stays that way while the song plays. If nothing is playing, it says so instead of doing nothing.
- **No old-time pop under foreplay or sex.** Songs that sound like the 1940s to early 60s (crooners, doo-wop, swing, rockabilly, by their Spotify genres) no longer play in intimate scenes, whatever their tags, unless they're slow, sultry and led by desire (Peggy Lee's Fever stays). During sex, bright, fast pop led by happiness is out too. Out now: Funnel of Love, Put Your Head On My Shoulder, Only You, La vie en rose, I Don't Want to Set the World on Fire, and during sex You Spin Me Round, Silly Girl and Are You Gonna Be My Girl. The in-story radio still plays them, and a song you've marked ✦ Fits for that heat still plays.
- **Skipping refreshes the line-up.** Moodweaver sends Spotify a line-up of 12 songs. Before, skipping through it in Spotify changed nothing until the end; now a song changed before its last few seconds counts as a skip and sits out for half an hour. Two skips in one line-up start a fresh one from the scene as it is now (straight away if the song you landed on only just began, else when it ends), and reaching the last song of a line-up always builds a fresh one. ⏭ in Moodweaver counts as a skip too.

## 1.79.1: the dynamic follows the scene, the one underneath stays put

A full check of how the dynamic changes, run through long test chats (`tests/dynamics.mjs`). Three things kept it stuck or jumpy:

- **Once the meters filled up, scenes stopped changing the main dynamic.** The main dynamic is the meters plus a pull from the last few replies, but that pull was capped at 35 points. After a long run of tender or heated replies the meters sit near the top, and a fight or a cold spell couldn't pull them far enough to read as a fight. The pull is now stronger (up to 60, and about three times the size for the same steps), and the feelings on the cards weigh about twice as much against how specific a dynamic is. The meters themselves move exactly as before; only the reading of the scene changed. It still waits two replies before switching (Volatile switches at once), so one odd reply doesn't flip it.
- **The one underneath changed as often as the main one.** It was picked as "the best dynamic of a different kind than the main one", so every time the main one changed kind it was forced to change too, and its two-replies-back check let it flicker. Now it's read on its own from where the meters have settled (the scene doesn't pull it, and passing feelings count for little), and it's the one that led most of the last 12 replies (16 on Slow burn, 8 on Quick, 6 on Volatile). It changes only when something has truly taken over for a while. When the scene is the same as what runs underneath, only one is shown.
- **With "The story names it" on, an old call held for good.** The hidden line names the dynamic only when it shifts, and the last name it gave stayed until it gave another, even 200 replies later. A call now lasts 10 replies (16 on Slow burn, 6 on Quick, 4 on Volatile); after that the meters and the scene take over until the story names a new one. The scene reader's call works the same way.
- **Strangers** (the fallback when nothing else fits) is never lifted by the scene over a dynamic that does fit.

## 1.79.0: stress and breaking points, feelings about others, secrets and leverage, wants from the meters

- **Stress.** The character now carries stress that builds and eases over the chat. It builds when they act against their starred beliefs or their nature (the hidden line has a short **stress** field for that), when fear, guilt, shame or feeling trapped keep rising, and when needs run empty. It eases with rest, comfort, good feelings and release. High-strung people (anxious, perfectionist, volatile, paranoid, traumatised…) take it harder; stoic, unflappable or cold-blooded ones shrug more off. Shown as a star row on Info › Needs, with **Let it go** to start it again from now.
- **Coping in character.** Strained (34+), and again badly strained (67+), one short line tells Claude how this person copes: drinks more and earlier, tightens control and routine, prays and judges harder, works late, takes it out on someone weaker, snaps and picks fights, goes looking for sex or attention, polishes the surface, disappears, does something reckless, fusses over everyone else, chain-smokes, eats too much or too little, stops sleeping. Picked from their strongest trait. Nothing is sent below 34.
- **Breaking point.** At 90 (75 when two needs are empty) they break once, in their own way: a binge, something cold and cruel, a frantic grab for control, a frenzy of guilt, the mask slipping in public, vanishing for a night, clinging and accusing, a manic spree, burning a bridge, crying where they least want to, or by what's been building (a full rage, a collapse, a panic). The reply after, they come down from it, drained and raw. Stress then drops to 45, and no new break comes for six replies.
- **Feelings about other people.** Feelings the story aims at someone else ("angry at his wife") now add up over the chat into how the character feels about that person: adores, fond of, warm toward, torn about, cool toward, resents, hates, with the two strongest feelings. Names are matched to the Family box, so "his wife" and "Margaret" are one person. Shown on the profile card as "Feelings about others"; a line goes to Claude only when the scene names that person. It fades slowly if they stop coming up.
- **Secrets and leverage.** A new **Secrets** box on the profile card (the character's on Info › Facts, yours on You), one secret a line. Each secret has four taps: Hidden, Suspected, Known (the other person found out: a hook they hold) and Out (everyone knows). The story moves them too: while any secret exists, the hidden line has a short **secrets** field ("affair suspected") listing them by short name; the newer of the story and your tap wins, and swiping takes the story's step back. A hidden secret is sent only when the scene comes near it (the character guards it, deflects or lies, and it costs something); suspected and known are sent every reply; out is sent for 16 messages. When the character's secret is found out they lose a little control and hide harder (Secrecy), and it weighs on their stress; out brings Shame. When yours is found out they gain control and Knows about you rises. Settings › What is sent › Secrets and leverage.
- **Wants from the meters.** On Self › Wants, a new card **From the meters** with its own switch (off by default, character only). When a Bonds meter runs at 61 or more (or a two-sided one at −61 or below), the character wants what follows from it: Obsession → to know where you are and who with, every hour; Lust → to get you into bed; low Trust → to catch you in a lie; Secrecy → to keep you from finding out; about forty in all. Two at most, the strongest meters first. They're sent like the wants you write, and when the story marks one done it goes (shown as "came true" for a while) and doesn't come back from that meter for 40 messages. Nothing is stored, so swiping takes it with it.

## 1.78.0: arousal, fun and giddy fixes, plain size facts, starred beliefs, 215 facts, 72 dynamics, 8 meters, family

- **Fixed: his arousal dropped to the bottom when she climaxed.** Three causes. The hidden line's desire field counted any mention of "came", "climax" or "orgasm" as *his* release, and the instruction ("release if they climaxed") didn't say whose. A release resets arousal to the bottom with an afterglow. Now only the word "release" counts, the instruction says plainly that the other person climaxing is not his release and usually makes him want more, and a release is ignored when the same reply's board still has him hard, aching or throbbing, or his desire feelings rose.
- **Fixed: Fun stayed low during foreplay.** Fun drains by the hour and only filled from food, sleep, washing and company, and "rough sex" was listed as something that drains it. The instruction now says fun fills from whatever this person enjoys (play, teasing, flirting, foreplay and sex they want, a thrill, a win), and only sex they don't want drains it. When the line doesn't score fun at all, rising desire feelings add a little and happy ones a little less.
- **Fixed: always giddy.** Three causes. The hidden line's own list of example feelings named giddiness every reply; the board word "smitten" was mapped to Giddy in love instead of Smitten; and romance dynamics held every happy feeling, so giddiness faded half as fast. The example is gone (contempt is there instead), smitten means Smitten, romance holds closeness and desire only, and the line now asks for feelings named the way this person would have them: the same delight is giddy in one man and smug, possessive or hungry in another. No cooldown.
- **Size, in plain words, on the profile.** Penis size (small, average, large, very large, with inches) for a man and bust size (small, medium, large, very large) for a woman now sit on the profile card on Info, chosen by pronouns (both when they aren't set). They're written as plain physical facts and say that how the person feels about it, and how a partner reacts, follows their personalities and moods, not a script. Still sent only in private or intimate moments.
- **Starred beliefs.** On Self › Traits, rows in Morals & views and Alignment get a ✦ instead of the core ★: up to three per person. They go in the note every reply as "What they believe most, and act on", above passing feelings, and they bend the dynamic (a misogynist who wants her still doesn't see her as an equal; an evil man's tenderness never makes him safe; a puritan judges his own wanting). Beliefs you'd starred as core before move over by themselves. They show on the profile card beside Core.
- **215 new facts, and every fact can be set by the story.** 17 to 19 more in every section: wounds and illness (stab wound, cracked ribs, fever, migraine), bed (love bites, fingerprint bruises, spanked, giving and getting oral, lipstick on the collar), substances (martini lunch, chain-smoking, insulin shock, spiked drink, mescaline), looks (mascara running, hair down, stubble, slicked-back hair), clothes right now (hospital gown, straitjacket, his jacket on her, mourning black), voices (choked up, morning voice, Brooklyn accent), past (childhood friend, juvie, Catholic school, Korean War), jobs (ad man, switchboard operator, stewardess, bookie, just fired), weapons (revolver, scalpel, ice pick, garrote), standing (arrested, having an affair, under someone's protection, protégé), archetypes (dirty-handed protector, pervy drunk, Svengali, ingénue, man in the grey flannel suit) and places (photo studio, art gallery, school, trap house, lighthouse, police station). Before this only body, bed, substance and place facts could come on by themselves. Now the hidden line has a short **facts** field for changes to the character ("fired, in uniform, engaged off"), and your "you" list matches every fact by name. Who-they-are facts stay until the story says off, an opposite comes on, or more than 8 have built up.
- **72 new dynamics (665 in all) and 8 new meters (44).** The meters: **Thinks it's one-sided**, **Crudeness**, **Paternalism**, **Grooming**, **Playfulness**, **Pride in them**, **Ease** and **Testing**. Dynamics for the childhood friend turned dealer (Angel and the gutter, Drunk and handsy sorry by morning, Leering protector, Thinks it's only them, Both pretending, Keeping them pure, Does the dirty work, Will they won't they, Old crush grown up), for a 1950s–60s husband or doctor (Father knows best, Treated like porcelain, Proper on the surface, Dinner at six, For their nerves, Kept a child, Gentleman by day), for a photographer or tutor and protégé (Grooming the talent, Only I see it in you, Earn my approval, Behind the lens, Lessons that go too far, Grooming in plain sight, Gifts with strings), and wholesome or in-between ones (Silly together, Comfortable silence, Easy in bed, Proud of you, Rough-edged care, Safe enough to sleep). New presets: Photographer & protégé and 1950s marriage; Dealer friend, Childhood friends, Easterman, Jefferson, Romance and Mentor include the new meters.
- **Meters weigh evenly.** Feelings move the meters for free, but the meters added since 1.65 were fed by only 0 to 4 feelings each against 10 to 50 for the old ones, and appeared in fewer dynamics. Every meter, old and new, is now fed by about 8 or more feelings and appears in about 8 or more dynamics, so a new meter means as much as an old one. A few facts feed them too (a childhood friend fills Shared past; someone under protection or on the run raises Protectiveness and Sacrifice; a drunk character gets cruder).
- **Family.** A short box on the profile card, one person a line ("Mother: Ruth, strict, dead since 1951"). A line is sent only when the scene names that person or their relation (mom, mum and mother all count); the whole list goes when the scene talks about family in general and on the every-few-replies reminder. Nothing is sent otherwise.

## 1.77.1: tidy search results

- **⌕ Search results no longer overlap.** On iPhone the result cards were squashed so titles and descriptions were drawn on top of each other. The list now lays out card by card, and each description is cut to two lines.
- **Grouped by tab.** Results sit under a small heading for each tab (Relationships, Story, Period, Skills…), the tab with the best match first, at most six each. "Affair" under Relationships, Story and Period now reads as three places to find it rather than three repeats.
- **Fixed: "If them is caught".** Period lines in search results named the person "them", which broke the grammar. They now read "the woman", "the man" or "this person". (Only the search preview was affected; the lines sent to Claude use names.)

## 1.77.0: 55 new skills (bed, era, dark), open-ended outcomes, swipe-down sheet, even dock

- **Power & bed, 27 new skills.** Oral; With their hands; Topping and Bottoming (who does what physically, separate from who's in charge); Riding; Staying power; Edging and orgasm control; Spanking and impact play; Choking and breath play; Marking; Sensation play; Blindfolds and sensory deprivation; Knife and blood play; Praise; Degradation; Worship; Roleplay and scenes; Medical play; Pet play; Primal play; Bratting; Brat taming; Reading limits; Faking it; Dressing and undressing someone; Obedience; Discipline and punishment.
- **Dark skills, 17 new.** Mind games: Isolating someone, Love bombing, Guilt-tripping, Making them jealous, The silent treatment, Playing the victim, Hot and cold, Terrorising. Violence: Strangling, Blunt weapons, Butchery, Protecting someone. Crime: Drugging someone, Keeping someone captive, Covering tracks, Arson. Body: Taking pain.
- **1950s–60s and modern, 11 new.** Keeping up appearances, Telephone manner, Debate and arguing, Waiting on someone, Flower arranging, Embroidery and needlepoint, Smoking with style, Golf, Texting, Dating apps, Video games. 245 skills in all, each checked against a sample scene (tests/skill-words.mjs, 160 passages).
- **Bad at it, in many ways.** A minus skill no longer comes with fixed examples. Claude is told to invent how it goes wrong, differently each time, shaped by the person's personality and mood (pride covers it, shyness apologises, cruelty blames the other person), with the other person reacting in character, and that a fumble can shift the scene or the dynamic without ending it. The new bed and dark skills carry a few ideas each (teeth, a lost rhythm, a spank far too hard or so soft it's a pat, a bra clasp that won't give), and two of them are offered per reply as examples only, changing from reply to reply. Good levels get the same freedom: "the level sets how well; the how is yours".
- **Dice say how well, not how.** Each outcome has a few wordings that change with the roll, and Claude is told the details are its own to write. New contests: faking it, playing the victim, love bombing and keeping up appearances against reading people; drugging against watching; guilt-tripping, jealousy and debate as persuasion; terrorising and discipline as pressure; keeping someone captive as a hold; strangling, blunt weapons, boxing and martial arts as attacks; and bratting against brat taming or domination.
- **Swipe the skill sheet down to close it.** It follows your finger and closes when pulled far or flicked; a short pull springs back.
- **Even dock.** The dock is a solid full-width bar at the bottom: nothing shows around or under it, and the gaps between labels are the same whether a label is short (Music, Info) or long (Relations).

## 1.76.0: a new Skills screen, −10 to +10, skills that light when they should, 35 new skills, traits that don't take over

- **New Skills screen (star list and sheet).** Each skill is one slim row: its name, its level word (or why it's in play), a small balanced meter with 0 in the middle (gold to the right for good at it, rose to the left for bad at it) and the number. Tap a row, or a chip at the top, and a sheet rises from the bottom with a half-orbit dial: −10 on the left, 0 at the top, +10 on the right, the arc glowing up to the level and a small planet sitting on it. Either side are big − and ＋ buttons; underneath, quick jumps to −10, −5, Off, +5 and +10; then ◇ Pin and Done. Nothing is dragged, and nothing on the list changes by accident while you scroll. "＋ Add skills" opens the whole catalogue the same way: tap any skill to set it.
- **An even scale, −10 to +10.** Skills now run from hopeless (−10) through terrible, bad, poor and shaky, 0 (not theirs), then novice, amateur, competent, skilled and expert to master (+10). Old minus levels are doubled once so they keep their meaning (−5 hopeless stays hopeless at −10). Claude is told "−1 to −10, bad at it down to hopeless", and dice add the minus to the roll, so a −8 liar against a decent reader nearly always gets caught.
- **Skills light when the scene is about them.** Every skill's words were compared against the others. Words that many skills share (touch, hands, look) now count for very little; words that belong to one skill (adrenaline, sutures, carburettor) count a lot, and a phrase counts most. Everyday words count a quarter. The skills sent are the ones the scene calls for most, then the strongest or weakest, so a −6 cook in a kitchen scene gets sent as surely as a master. About 150 skills got wider words, and Biology now covers how bodies work (heart, lungs, blood, hormones, adrenaline, pupils, nerves), apart from Medicine. A test (tests/skill-words.mjs) runs 105 real-sounding passages, one per skill, plus plain ones that should light nothing.
- **35 new skills, modern and 1950s, in their groups.** Charm & people: Social media. Manners of the day: Letter writing. Power & bed: Striptease and burlesque. Medicine & the mind: Nursing, Embalming and undertaking, Counselling. Violence: Boxing, Martial arts, Soldiering, Guns and gunsmithing. Crime: Hacking, Digging people up online, Cooking drugs, Car theft. Body: Bowling, Yoga and flexibility, Climbing. Animals & outdoors: Taxidermy, Boats and sailing. Knowledge: Astronomy, Law. Work, money & machines: Coding and computers, Hot rods and cars, Radios and ham radio, Advertising. Style & taste: Modelling and posing, Tailoring. Arts & music: DJing, Making beats and records, Rapping, Filmmaking, Broadcasting, Records and music lore, Saxophone and horns. Home & care: Canning and preserving. 190 skills in all.
- **Traits no longer take over.** Each reply, three traits go in full ("in focus"): the ones the scene touches first, then the strongest, taking turns from reply to reply. The rest go as a short line of names, "true but in the background this reply". Trait strength is sent as how deep it runs (a touch, somewhat, clearly, very, deeply) rather than "steers the scene", and Claude is told traits colour how feelings come out but don't set the reply's mood or override the feelings or the dynamic. Core traits are still always there. ⚙ Settings › What is sent › Traits in focus turns it off and sends every trait in full, as before.

## 1.75.0: pet names and catchphrases

- **Pet names.** Each profile card (the character's Facts tab and your You tab) has a "Pet names for …" box: the endearments that person uses for the other, separated by commas or one per line. They go with every reply. For the character, Claude is told these are the only endearments they use, picked to suit the moment, with nothing invented and no stock ones. For your character, Claude is told the character knows them and reacts to being called them.
- **Catchphrases.** Under it, a "Catchphrases" box, one per line: phrases that person really says. For the character, Claude works one in now and then, word for word, where it fits, at most one a reply and not every reply, so they stay theirs without turning into a tic. Yours are noted as yours to use, and the character knows them as your phrases.

## 1.74.0: steadier swipes, a new Skills screen, song counts, 84 more period lines, wet fixed

- **Swiping is less slippery.** Changing tab now takes a deliberate sideways swipe across about a third of the panel, kept level and under about 0.7 seconds. A touch that scrolls the panel, drifts up or down, or lingers no longer changes tab, and the panel can no longer slide sideways under your thumb. ⚙ Settings › Panel › Swipe sideways to change tab turns swiping off altogether.
- **New Skills screen.** The rows of pips that ran off the left edge are gone. Each skill is a card in the same style as the rest of the panel: its name, its level word (tap it to take the skill off) and the pin on top, a short note on what it covers, then big − and ＋ buttons either side of a line of stars: five dim red diamonds for "bad at it" and ten stars for skill. The current level glows. No small targets and no dragging.
- **▦ Song counts** on the Music tab: how many songs in your lit playlists fit each kind of scene (intimate, danger, sorrow, sweet, tender, dark, party), how many are tagged, favourites, theme songs, off or cued, and the counts by heat, energy, whose song, feeling, moment, meaning, dynamic and place, as bars.
- **84 more period lines (240 in all).** Checked every mood, trait, Mind setting, bed role, bedroom state, tie, turn-on and dynamic against the period lines, and wrote new ones for what had none: being held, wards, nursing someone, pupils, fans, sex for money or safety, a wife's body in law; possessiveness, wanting to fix someone, no stalking laws, protecting, needing, waiting, being sure you're loved; thinking someone loose or mad; keeping a face on, damsels, the nice girl or boy next door, the older lech; gaslighting (the 1944 film, no word for it yet), control at home, cruelty behind closed doors, blackmail; daddy and baby, collars by mail order, bondage and the 1955 Senate hearing, lights off, thin walls, marks, taking turns to lead, being swept away, fighting and wanting, hiding the want, falling for the doctor; uniforms, older and younger lovers, wanting a baby, sin and penance, being kept, wanting the bad ones; bonding with a captor (no name until 1973), not being believed, feeling a fraud, the old diagnostic labels, Freud at parties, brainwashing, kleptomania, gambling, loners, people wired differently; heirs and debutantes, disgrace, starting over under a new name, parole, the Mob, killers with no trail, MKUltra, strange churches, priests, Vietnam veterans, foster children, war brides; beatniks, greasers, hippies; knockout drops; the drive-in, jazz clubs and the bomb. Older lines now also wake for OCD, phobias, social anxiety, dissociation, survivor's guilt, mother and father issues and sixties clothes.
- **Lines for your dynamic.** A new "The two of them" group on the Period tab has one line for each kind of dynamic (captor, obsession, power, romance, heat, toxic, friends and rivals, roles, distance, clinic, mind games, secrets, society). One of them can go with a reply when the dynamic between you is of that kind.
- **Fixed: wet from the shower when aroused.** Wet, soaked, soaking wet and dripping are now read with the words around them. Water words (shower, bath, rain, towel, hair, clothes) mean water; words of wanting mean aroused; and with nothing to tell them apart, it is aroused when that person is feeling desire and water when they aren't.

## 1.73.0: period lines rewritten, a Period tab, dice, search, constellations

- **Period lines, rewritten from scratch.** Every old period line and combo is gone. In their place are 156 new lines for 1950s–60s America, in plain sentences, most with one version for a man and one for a woman: power and roles, how men and women are seen (the good and the bad side of it for both), money and work, home and marriage, dating, sex and who leads in bed, secret tastes, affairs, body, looks and age gaps, medicine and the mind, reputation, personality, vices and places. Researched against Kinsey, the credit and equal pay laws, the Pill and Griswold, divorce law, the diagnostic manuals of 1952 and 1968, the tranquilliser years and more (sources at the top of data/catalogue/period.js). Doctors are treated as doctors, and men caring for women count as providing.
- **❦ Period tab** under Self, for each of you. It shows only the lines written for that person's gender (and the ones for anyone), by category with sub-headings. Tap a line to switch it off for that person; each category has an all on/off switch; ✓ All on, ◐ Kept apart and ○ All off are presets. Lines per reply and the lines that apply right now moved here from the Story tab. Your old "Lines about" choice carries over.
- **Fixed: lines about submitting while leading.** Bed lines now follow who is actually leading in the scene (their moods, then the Control meter, then a bed role), so a man with a submissive streak who is on top in foreplay gets a line about leading, not kneeling.
- **Skills below zero.** Every skill has a "Bad at it" row, shaky (−1) to hopeless (−5). Claude is told they really are bad at it, and practice brings it back quickly.
- **Dice checks.** Before each reply a d20 is rolled for the skills in play, plus the level. Contests (a lie against reading people, sneaking against watching, persuading, pressuring, holding, attacking) and plain checks against 12, botch to brilliant. Claude is told the outcome in advance and plays it. If your character is fooled, the lie reads as true to you too. Swipes keep the roll. Settings › What is sent › Dice checks; Settings › Panel › Show dice rolls.
- **⌕ Search every tab**, beside ⚙: feelings, traits, Mind, Intimacy, facts, story settings, turn-ons, skills, dynamics, relationship tags and period lines. Tap a result to go straight to it.
- **Constellation bond meters.** The main meters are an arc of stars joined by a faint line up to the current level; the smaller meters are a slim row of stars (one-sided from the left, two-sided from the centre).
- **More Mind settings, researched:** eight complexes (Jocasta, Laius, Don Juan, Icarus, Jonah, Adonis, Ophelia, Hero), dysthymia, cyclothymia, PMDD, functional neurological disorder, dissociative fugue, a new "Impulse and obsession" group (explosive rage, kleptomania, gambling, sex compulsion, limerence, maladaptive daydreaming), and ten 1950s–60s diagnoses (anxiety neurosis, hysterical personality, passive-dependent, passive-aggressive, explosive personality, asthenic personality, sociopathic personality, homosexuality as a diagnosis, the blamed mother, marital maladjustment).
- **Affair tags.** Romance tropes now have Affair, Cheating, The other woman / other man and Found out.
- **Facts about you from every kind.** The hidden line can now add facts about your character from body, bed, substances, looks and clothes, voice, standing and secrets, and work.
- **Faster removal.** Taking off a trait or mood redraws the panel straight away and saves after.
- **Even dock.** The Info icon is a clear ◈ and every dock button has the same width, so there's no gap after Music.

## 1.72.7: ⓘ for why, 🗑 remove songs, tags built in

- **The "why is this playing" text is hidden.** The Now card shows only the song, its path and the buttons. Tap ⓘ (beside ✦ Fits, ✕ Not here and ✎ Tags) to show what was heard, why the song was picked and how the scene reads; tap it again to hide it. Errors still show.
- **🗑 Remove a song.** In ✎ Tags, tap 🗑 Remove this song, then tap again to confirm (or Keep it). It comes out of your own Spotify playlists and out of Moodweaver, and never comes back from a reload, a sheet import or a new version, unless you add it back on Spotify yourself. Spotify needs a new permission for this: Music settings shows "Sign in again" until you have signed in once more.
- **Song tags are built in.** The tagged songs now come inside the extension (data/song-tags.js) and merge in by themselves on load. New songs are added, songs you never changed get the new tags, and anything you changed in Moodweaver is kept (your Never during, Favourite, Off, Theme and peaks are always kept). No more exporting and importing to get new tags.
- **Copy songs without tags.** Song sheet › ✧ Copy songs without tags gives a plain list to paste to Claude; they come back tagged in the next version.
- Built-in songs only count while their playlist (by name) is lit, so lighting another playlist doesn't bring them all in.

## 1.72.6: no lullabies in foreplay, jump within a song, mark peaks yourself

- **Fixed: Avril 14th in foreplay.** It counted as an intimate song only because it's tagged for Afterglow (lying together after). Now a song whose only tie to intimacy is Afterglow fits the afterglow itself, not foreplay or sex while the heat is still building. 14 songs are affected (Avril 14th, Stones, Wonderful Tonight, Five String Serenade, Turning Page (Instrumental), Eternal Flame, It's Only Time and others); songs tagged with heat, desire or Seduction are unchanged.
- **Jump within the playing song.** Tap anywhere on the song's path to jump there, or use the big −15s and +15s chips under it. No dragging.
- **◆ Mark peak here.** Tap it while the song is at its chorus or drop, and that spot becomes the song's peak (saved in its tags and in the sheet's Peak column when you export). A small gold diamond shows the peak on the path. Change or clear it in ✎ Tags › Sting, peak and year (empty the box to clear).

## 1.72.5: edits keep the song, ▶ pick a song yourself, a quieter Now card

- **Fixed: editing a message no longer changes the song.** Moodweaver re-reads the board when you edit a message, and it was treating that like a new reply. Now an edit (same message, same place in the chat) updates the moods and ambience but never cuts the song, just like a swipe.
- **Fixed: the cue rest no longer knocks out the song it started.** The 10-minute rest only stops a cued song coming back. While it's still playing, it keeps its cue, so it still counts as fitting the scene.
- **▶ Pick a song yourself.** Every song in ✦ Songs has a big ▶ beside it (and the tag editor has one too). Search, tap ▶, and it plays straight away, whatever its rest or the scene, and holds until it ends: no reply, cue or sting cuts it. Then the scene picks again. The Now card says "you picked it".
- **A quieter Now card.** Everything under Re-roll (what was heard, the Re-roll note, the radio, stings, ambience) is now one short line, like "♪ “like a dog” → I Wanna Be Your Dog · resting 9m". Tap it to open the full detail, tap again to close it. Errors still show in full.

## 1.72.4: the strongest cue wins

- **Fixed: "like a dog" lost to weaker cues.** The dog line was heard, but when several songs were cued at once, the one that fitted the scene best on paper won, even if its cue was two everyday words ("pull + pinned" picked Change). Now an exact cue phrase ("like a dog", "on a leash") always beats a pair of theme words, then the newest message wins, then the best fit.
- **Weak cues are gone.** Everyday words of roleplay prose (pull, pinned, something, little, forgot, photograph, watch, hold, touch…) no longer count as the unusual half of a pair, a word with a * counts as everyday when an everyday word starts with it (someth* → something), and a one-word cue phrase that's an everyday word ("just") no longer fires.
- **↻ Re-roll reads the last 6 messages**, yours and theirs, instead of two replies and your last message. A new reply still reads just the newest reply and your last message.
- **"Heard in the story" lists the strongest cues first**, so the one that matters is never cut off the end.

## 1.72.3: the playlist link survives sheets and Spotify hiccups

- **Importing a song sheet now keeps every song linked to its playlist.** Each row's "From playlist" cell (Spider. Eye. Lamb. in your sheet) links the song back to your Spotify playlist of that name, so replacing the sheet can never leave songs outside your lit playlist.
- **Two playlists with the same name count as one.** If a sheet or CSV import ever made a second "Spider. Eye. Lamb." next to your Spotify one, lighting either lights both.
- **A half answer from Spotify no longer empties the playlist.** When Spotify says a playlist changed but sends back far fewer songs than it holds (it said 560 and sent 1), Moodweaver adds any new songs and removes none, and tries the full reload again next time. Re-roll's note says when this happened.

## 1.72.2: songs no longer drop out of the pool

- **Fixed: Re-roll could end up choosing from just 1 song.** Re-roll asks Spotify for your playlist list first. If a lit playlist wasn't in what Spotify sent back, Moodweaver forgot that playlist, and every song in it (your whole tagged sheet) quietly stopped counting, so only songs from some other lit playlist were left. Lyric cues went quiet too, because the cued songs were among the missing ones. Now a lit playlist Spotify doesn't list is kept (shown as "not found on Spotify" under ✦ Playlists), and tagged songs whose playlists are all gone still play, like sheet songs.
- **An empty answer from Spotify for a playlist that had songs is treated as a hiccup**, and the songs are kept.
- **When the pool is tiny, Re-roll says so plainly**: how many songs there are, which playlists are lit with how many songs each, and how many tagged songs you have, instead of a cheerful "1 songs".

## 1.72.1: ambience that follows the story, and camera clicks

- **Ambience now picks its sounds from the story's own words**, not only from place facts. When no place fact is set, it uses where the last 4 messages put the scene; rain or a storm counts for the last 6 messages until someone says it has stopped. A place fact still comes first.
- **Six new sounds:** a camera clicking, a ticking clock, street traffic (cars passing, a far-off horn now and then), birdsong by day, a train, and a shower or running water. Up to three play at once: the weather, the place, then a layer (radio crackle, the camera, a clock, birds or crickets).
- **Camera clicks**, a new setting under Ambience (shown when Ambience isn't Off): a camera's shutter clicking softly with long pauses, and now and then the film winding on. It plays in a darkroom, or when the last 3 messages mention a camera, a shutter, a polaroid or the dark room. It starts as Only some with nobody ticked, so it only plays for the characters you tick (for example your Life is Strange character, not Easterman).
- **Where it plays:** on the phone or computer that has SillyTavern open in its browser, not on the computer running the server.

## 1.72.0: five music extras, each per character

All five live in a new **✧ Extras** drawer on the Music tab. Each one has three big chips: **Off**, **Everyone**, or **Only some**. Only some shows a chip with the chat's character's name: tap it to switch that extra on for them. The tick is saved with the character, so it follows them into every chat; other ticked characters show as chips too (tap to untick). The old "Fade on a cut" chip in Music settings moved here as Crossfade.

- **Crossfade** (on for everyone at first). When the song changes in the middle of a scene, Spotify's volume slides down to about an eighth over 2.4 seconds, the new song starts, and the volume slides back up over about 3 seconds. Spotify's app has no crossfade it lets other apps use, so this is done with the device's volume. A speaker that doesn't allow volume control just cuts.
- **Stings** (on for everyone at first). Six big beats: Violence (a slap, a gunshot, a stabbing), Someone bursts in (a door kicked in, someone storming in), Reveal (the truth comes out, a mask comes off), Love confession ("I love you"), First kiss, Death. When the newest reply or your last message has one, Moodweaver cuts straight to the best-fitting song tagged for that beat, whatever the hold time, and the Now card says "⚡ Sting: …". Only strong, specific wording counts, so an everyday reply won't set one off. A song that has stung rests for 10 minutes. New sheet column **Sting** (a dropdown), and in ✎ Tags a new section **Sting, peak and year**.
- **Start at the peak** (on for everyone at first). Stings, ↻ Re-roll and cuts into a scene already at full tilt start the song at its chorus or drop instead of its intro. Where that is: the sheet's new **Peak** column (like 1:05) if you set it; otherwise Spotify's own analysis of the song's sections (the loudest one after the intro), if Spotify still lets your app read that; otherwise a guess about a quarter of the way in. Calm scenes and songs under 100 seconds always start at the beginning.
- **Ambience** (off at first). A quiet sound bed under the music, from the scene's place and weather facts: rain or a storm, a ward's hum with a monitor beep, fluorescent hum, machinery, a murmuring room with the odd clink, wind, waves, a crackling fire, the road, a cold dripping room, crickets at night outdoors, and radio crackle while the in-story radio is on. It's drawn live by the browser (Web Audio): no sound files, nothing downloaded or sent anywhere. Soft, Medium or Loud. It plays on the device with SillyTavern open, which may not be your Spotify device, and browsers only allow it after a tap: the Now card shows "Tap to start the ambience" when it's waiting. It fades out when the music is switched off or paused by you.
- **In-story radio** (on for everyone at first). When the story turns on a radio, a jukebox, a record player or the car radio, the music becomes what the characters can hear: only songs from the story's era or earlier, read from the new sheet column **Year** (a story set in the 1960s plays songs up to 1969; with no era set, any song). The song changes straight away, the Now card shows "📻 A jukebox is playing in the story", and Claude gets one line naming the song so the characters can notice it, hum, dance or switch it off (about 50 tokens a reply, never quoting lyrics). It lasts 6 replies, longer while the story keeps mentioning it, and ends when someone switches it off; then the film-score music comes back.
- **Your song sheet** (same name, Easterman-song-sheet-tagged.xlsx) now has Sting, Peak and Year. Stings were tagged by hand from the research notes: 26 Violence, 18 Someone bursts in, 21 Reveal, 21 Love confession, 35 First kiss, 31 Death. Years are when each recording first came out, with compilations and reissues corrected (Peggy Lee's Fever 1958, the Ink Spots 1941, Only You by the Platters 1955, and so on); 44 songs are from 1969 or earlier. Peak is left empty for you to fill where you care.

## 1.71.3: cues that actually react

- **A cued song now almost always plays.** Before, a cued song that fitted the scene was only lifted to near the top and had a 50/50 chance, so a close rival (like Touch Myself in a foreplay scene) still often won. Now:
  - **↻ Re-roll** always starts with the cued song when one fits the scene and isn't resting.
  - **Play, Next and a new reply** pick it 9 times in 10.
  - **A new reply with a fresh cue** can change the song after 30 seconds of the current one, instead of waiting out the usual hold time ("Only when a song ends" is still respected).
- **The rest after a cued song plays is 10 minutes, not 3 hours.** Repeats now and then are fine.
- **The Now card says why when a cue doesn't play.** "Heard in the story" now sits right under Re-roll and also lists a cue whose song is resting, with the minutes left. After a Re-roll the note says what it found: the cued song, a cue that's resting or doesn't fit, or no lyric cues in the last two replies.

## 1.71.2: ↻ Re-roll

- **A big "↻ Re-roll for the story now" button under the play controls.** For when you come back after SillyTavern was closed, or the music just feels stale. One tap:
  1. looks in your lit Spotify playlists for songs added since last time and loads them (sheet songs you imported are already there);
  2. forgets the old scene, the old line-up and the old smoothed-over mood, so nothing from before the break carries over;
  3. reads the newest reply, the reply before it, and your last message again: the kind of scene, moods, heat and lyric cues;
  4. starts a fresh line-up, with a different song from the one that was on.
- What you set yourself still counts: a "This scene is…" choice, ✕ Not here, Never during, Off, and the 3-hour rest after a cued song has played.
- **Theme words written with their own ending now count as unusual words.** "watering" or "drooling" in a song's Cue words was being treated like the everyday "water" or "drool", so "watering … like a dog" needed the exact phrase. Now dog + watering is enough by itself. The false-positive tests came out the same as before.

## 1.71.1: looser lyric cues that follow themes, and Play listens too

- **Cues now follow themes, not just exact phrases.** Each song has a second list, Cue words: the images and themes of its lyrics (I Wanna Be Your Dog has dog, hound, leash, collar, beg, drool, water, fetch, whimper and more). When any two different cue words of one song turn up within about 15 words of each other in the newest reply or your last message, that counts as a cue, just like a phrase. One word alone never does, and at least one of the two has to be an unusual word, so everyday pairs like "hand" and "night" can't set songs off. Word endings are allowed: "drool*" catches drools, drooled, drooling.
- **Every song's lyrics were looked at again for this,** for their themes and images and not only their title lines, and cue words were added for nearly all of them.
- **Play and Next hear the story too.** Before, cues were only read when a new reply came in, so pressing Play right after a cued line did nothing. Now Play, Next and the start of a line-up read the last reply and your last message first.
- **A cued song is a real contender now.** A cued song that fits the scene is lifted to just under the leading song, and on Play, Next, or a cue that changes the scene, it has an even (50/50) chance of being picked. So it often comes on, but not every time, and the 3-hour rest after it plays still stops repeats.
- **The Now card says what it heard.** A line "Heard in the story: “like a dog” → I Wanna Be Your Dog" shows whether that song is playing, resting, nudged, or doesn't fit this scene.
- **The sheet has a new Cue words column** (after Cues), and ✎ Tags › Cues has a second box for them. Re-import the new tagged sheet to get them.

## 1.71.0: lyric cues

- **When the story echoes a song, that song gets a nudge.** Each song can have a few cue phrases ("like a dog", "salivat*" for I Wanna Be Your Dog; "lithium" for Lithium; "eyes without a face"). When the newest reply or your last message says one, that song scores 5 points more for that reply and the next two. It's a nudge, not a takeover: the song still has to fit the kind of scene (no I Wanna Be Your Dog in a sweet confession), and Not here, Never during and Off still win. If the cued song now leads, it counts as a real shift, so it can come in on the next cut (the hold time still applies; "Only when a song ends" waits for the end).
- **No repeats from cues.** Once a song has played because of a cue, its cues (and every other version of it with the same title) rest for 3 hours.
- **Cues in the editor and the sheet.** A new Cues section in ✎ Tags (phrases separated by commas; a * means any ending) and a Cues column on the song sheet, before Notes. Music settings › "Lyric cues" turns it all off. No tokens.
- **The tagged sheet now has 529 songs:** the 121 new ones from your latest playlist export, researched like the rest, and cue phrases for 333 songs, with everyday words left out so they don't fire all the time.
- **Fixes:** tapping a Meaning chip in the editor now saves it (it silently did nothing), and typing Exact moods by name now keeps them (they were dropped).

## 1.70.1: kept apart, not switched off

- **Lines about now has a middle setting: Kept apart.** Each person's button goes round three ways with a tap: ✓ everyday life, ◐ kept apart, ○ no lines. Kept apart is for someone shut away from ordinary 1960s American life, like Lamb in Sinyala. She still gets period lines, but none that assume a job, money or credit, a household, neighbours or public life (36 such lines are left out for her, among them Work, Money, Keeping house, Lonely, Boredom, Married, Divorced and the coffee-morning ones). Lines about how doctors, psychiatry and the asylum treated a woman like her count a little more, so what's left leans on medicine, roles in bed and in the pair, personality, Mind and moods. Power, the dynamic and lines about the pair still go.
- A line under the buttons says what Kept apart leaves out whenever someone is set to it. If you'd switched someone off in 1.70.0, they stay off (○); one tap from ✓ now gives Kept apart.

## 1.70.0: author blends, a dynamic catalogue and a fuller 1960s

- **Author blends.** On the Story tab, a folded "✒ Author blends" line saves the authors that are on now (with who writes narration and who writes dialogue) under a name you type. Blends are saved for that character only. Tap one to swap it in; the authors that were on are turned off. Tap its ✕ to delete it, and "↶ Bring back" undoes that. It stays hidden until an author is on or a blend is saved, and ⚙ Settings › Panel can hide it altogether.
- **A quick ✕ on the chips at the top.** Every mood, trait, Mind, Intimacy, turn-on and Story chip has a ✕ beside it that takes it off. Tapping the chip itself still scrolls to its row. "↶ Put … back" brings the last one back.
- **Close on the dock.** The dock now ends with a Close button, right under your thumb. ⚙ Settings › Panel can hide it, and the ✕ on the chips too.
- **A dynamic catalogue.** "Dynamics for these two" shows only the ones you've picked, grouped. "＋ Browse all 593" opens every group with search, and ✓ Done goes back. With "I pick" on, the dropdown lists only your picks plus the one that's on now, and "Show all" opens the full list.
- **Turn-ons glow when the other person shows them.** Before, a turn-on chip only glowed when the last reply set it off, so "Younger women" stayed dark even though Lamb is younger. Now a turn-on the other person shows right now (younger, taller, a uniform, a skill) glows softly and steadily, and the chip's note says why. The ✧ glow of a reply that just set one off still wins.
- **83 more 1960s person lines, 200 in all.** Each reads one thing on someone's cards: a trait (soft-hearted, artistic, arrogant, stiff, frugal, a romantic), a Mind item (narcissism, hysteria, nerves, depression, trauma, attachment, Freud on the couch), an archetype (the company man, the ice queen, the cult leader, the domestic tyrant), a bed role or desire (a man who wants to be ruled, a woman who rules, frigidity and nymphomania as diagnoses) or a turn-on they hold (liking to be ruled or to rule, pain, dressing, older or younger partners, danger, babies, what the law called unnatural). Every line is written twice, once for a man and once for a woman, the way the period would actually treat each: a soft-hearted man gets called a sissy and blamed on his mother; a woman with low spirits gets Friedan's "problem that has no name" and a prescription. They were checked against period histories: the credit and jury laws, Griswold (1965), Miltown and Valium (1963), hysteria in the diagnostic manuals, lobotomy consent by husbands, the lavender scare, momism, Playboy and Sex and the Single Girl (1962), Kinsey (1953) and the marriage laws.
- **Turn-ons now count for period lines,** not just traits and feelings.
- **Which lines go, in order.** Power goes first when it applies. Then comes the single line most on their cards right now (the strongest matching trait or turn-on, with the character a little ahead of you). The rest take turns by strength: stronger things come up more often, and the reply number shuffles lines of similar strength, so a long story keeps meeting new sides. Two lines that read the same trait of the same person never both go; the better match does. Period lines sit after both character blocks in the note, so Claude reads the trait first and then how the period treats it.
- **Period lines now.** On the Story tab, a folded list shows every period line that applies right now, with ✓ on the ones sent with the latest note. Period lines per reply can now go up to 8 or 10.
- **Lines about.** Two buttons switch off the period lines about one of you, for someone the period doesn't reach (Lamb in Sinyala). Lines about the pair, the place and the power still go.

## 1.69.2: sweet isn't intimate, and the music never stops

- **A new kind of scene: Sweet.** For a shy confession, playful flirting, giggling, holding hands, a kiss on the cheek or anything wholesome and romantic. It sits between Sorrow and Tender, and has a chip of its own under the controls. Three new moments go with it: Love confession, Flirting / teasing and Sweet / wholesome.
- **Sweet or intimate is now weighed, not guessed.** Before, any desire feeling at 31 or any kiss made a scene Intimate. Now Moodweaver weighs what pulls towards bed (heated words like undressing, moaning or a kiss down the neck; hot desire feelings; the horny meter) against what is sweet (a confession, laughing softly, blushing, a forehead kiss; feelings like Smitten, Giddy in love, Playful). A flirt or a shy want counts only half as heat. A plain kiss or cupping a face counts a little to both. When sweet outweighs heat it's a Sweet scene, so no Glory Box in the middle of an adorable confession. A plainly sexual scene is always Intimate, and the Intimate chip still overrides it.
- **Sweet never wins while cruelty, fear or anger leads.** Lamb giggling on the operating table is still a Dark scene with the ironic cheery songs, not a love song.
- **A love confession isn't a sad confession.** "I love you" in a sweet scene sets Love confession instead of the sorrowful Confession moment, unless sadness leads.
- **✦ Story reads one reply further back,** so the scene's turn carries (a confession building, a chase starting) instead of hanging on one line.
- **The music never stops by itself.** Spotify now gets 12 songs at a time instead of 8. When the songs for this kind of scene run short, they go round again (a repeat beats silence), and only when nothing at all fits this kind do the next best others fill in. If the line-up still runs out while the page is asleep, Moodweaver notices when it next checks (or after your next reply) and starts a fresh one. Pausing it yourself is respected, in Moodweaver or in Spotify.
- **Song sheet:** Sweet scenes in Never during, the three new moments in Moment. The tagged Easterman sheet is rebuilt with them (same file name). The ironic cheery songs never play in Sweet scenes.

## 1.69.1: pronouns that read right

- **He, she, him and her are only used where they can't be wrong.** Lines are written with names, and when the two of you have different pronouns, later mentions turn into he or she so the note doesn't repeat "Doctor Easterman" five times. The old step guessed, and it guessed badly in places: "taught Lamb its rules" read "its" as a verb and gave "taught she its rules", and "what Lamb became" didn't know "became" was a verb and gave "what her became". Now a name only becomes a pronoun when the sentence makes it certain: "Lamb's" becomes "her"; a name that opens a clause with a verb after it becomes "she" ("because she can't"); a name right after a preposition or after a verb with nothing verb-like following becomes "her" ("for her", "keeps her close", "taught her its rules"). Everywhere else the name stays, because repeating a name is never wrong. Names used as nouns ("the other Doctor Easterman"), pairs ("Easterman and Lamb") and "Lamb's feeling" (which might mean "Lamb is feeling") keep the name too.
- **Every line was checked.** A new test, `tests/pronouns.mjs`, renders every line that names both of you (all 593 dynamics, the meter lines, the combos, the role, tie and core-trait links, the skill combos and the turn-ons line) for he/she, she/he, he/he, she/she and they on either side, in both directions, and fails on grammar that can only be wrong ("for he", "taught she", "her became", "the other he"). The old step fails it 24 times; this one passes, and the he/she lines were also read through by hand. The Pronouns picker on the Bonds tab works as before.

## 1.69.0: two voices, better steam, and dynamics for your pairings

- **Narration and dialogue can have different authors.** Once an author is on (Story tab), three wide buttons sit under it: Both, Narration and Dialogue. Set one author to Narration and another to Dialogue, for example Michael Ondaatje narrating and George V. Higgins writing the talk. Claude then gets only the dialogue part of the dialogue author's description and everything except the dialogue part of the narration author's, plus one short paragraph explaining the split: narration is everything outside the quotes, dialogue is what people say aloud, everyone still talks like themselves, and neither voice borrows the other's rhythm. The top of the Story tab shows who writes what. Authors left on Both work as before.
- **61 new authors (336 in all).** Gritty American dialogue (Dashiell Hammett, George V. Higgins, Richard Price, David Mamet, Ben Hecht, Clifford Odets, Budd Schulberg, Paddy Chayefsky, Ross Thomas, Patrick deWitt), 1950s and 60s talk and grit (Chester Himes, Iceberg Slim, W. R. Burnett, Horace McCoy, Paul Cain, Walter Tevis, James Jones, Walter Mosley, Colson Whitehead), drug dealers and addicts (Donald Goines, Edward Bunker, George Pelecanos, Jim Carroll, Eddie Little, Jerry Stahl, Nico Walker, Jordan Harper, Ryan Gattis, Marlon James, Nick Tosches), inventive narration (George Saunders, Max Porter, Jesse Ball, Samanta Schweblin, Ottessa Moshfegh, Donald Barthelme, Richard Brautigan, Victor LaValle, Stephen Graham Jones, Jeff VanderMeer, Ryū Murakami, Kathy Acker, Samuel R. Delany), creative steam without the stock scenes (Milan Kundera, Yasunari Kawabata, Michael Ondaatje, Alan Hollinghurst, André Aciman, Gabriel García Márquez, Tom Robbins, Rupert Thomson) and 2010s dark romance (Kitty Thomas, Skye Warren, Tillie Cole, K. Webster, Belle Aurora, J. M. Darhower, Cora Reilly, Nina G. Jones, Stylo Fantôme, J. J. McAvoy). Each has a panel note saying what it's like and what it suits, and a full description with a strong Dialogue part, so they work as dialogue-only picks.
- **Two new Cleaner writing rows for sex scenes.** "Sex in character, not a script" asks for steam that grows out of who these two people are (their pace, humour, nerves, imperfect moments, power shifting during it, something changed after) and drops the stock narration readers complain about most (growling and purring, waves of pleasure, shattering, slick folds, kiss-bruised lips and the like). "Bed talk in their own voice" has people talk in bed the way they talk everywhere else, usually saying less, and drops the stock porn lines (you like that, good girl, mine, come for me and so on) unless that exact person would really say them; a controlling character's control shows in what he does, not in commentary. Both are sent only while the scene is intimate or someone is aroused, so they cost nothing the rest of the time.
- **132 new dynamics, at least ten in every group (593 in all).** Drawn from dark romance and AO3 relationship tags and from your own pairings: a devotee who learns to steer the cult leader she still kneels to, a secretary who cleans up after a killer until he doubts his own mind, a scientist who has to choose between her and his wife, a mentor whose student watches him back, and a cursed dealer protecting his childhood friend from himself (Saving them from me, Won't touch them, Crude on purpose, Spite move, Worse apart, Kept out of it and more). Every row has open keywords, so the story's own words help it come up.
- **Seven new meters:** Sway (how much you can steer them, even when they hold the power), Complicity (tied together by crimes and cover-ups), Unworthiness (they think they're bad for you), Pushing away, Exasperation, Shared past and Sacrifice. They're off until switched on in Bonds, the hidden line moves them like the others, and a few feelings nudge them for free. New quick picks: Easterman & Lamb, Bateman & secretary, Joe (mentor), Dealer friend, Childhood friends and Partners in crime; Rick gains Fascination, Exasperation and Sacrifice.
- The new dynamics were placed by simulating 200,000 meter readings, so each one can actually show for its own situation without crowding out the older ones.

## 1.68.0: music that scores the story

- **✦ Story, a film-score mode.** Follow now has a fourth choice beside {{char}}, {{user}} and both. Story blends both of your moods, smoothed over a few replies so one swing doesn't yank the music around, gives the dynamic between you double weight, and favours songs about the two of you. The cue only changes when the scene itself changes (a new kind of scene, place or moment), the way a film holds its music through a scene instead of jumping at every feeling.
- **Tell the story the song (Music settings, off by default).** When it's on, Claude is told the exact song playing, title and artist, whatever the story's era, as the scene's score: let its mood, pace and imagery colour the writing, never quote or paraphrase it, never name it, no one in the story hears it, and the story keeps moving. "Tell it for" sets how long: the first 1, 2 or 3 replies of each song, or the whole song. About 60 tokens on those replies only.
- **The song playing sits at the top.** In Your songs, the song now playing is pinned first and glows softly, so ✎ editing it is one tap.
- **A shorter tag editor.** One section open at a time, behind bright full-width bars (Side, Feeling, Meaning, Moment, Dynamic, Heat, Place, Never during, Exact moods). Tapping a bar opens it and closes the others. Character shows only {{char}}, {{user}}, Any and this chat's two people (plus anyone already ticked), with "All names…" to see the rest. The song's research note shows at the top. Picking a song to edit scrolls straight up to the editor.
- **Meanings: songs that are two feelings at once.** 21 meanings like Grieving a love, Laughing through heartbreak, Devotion that is madness, Tender menace, Sweet but sinister, Possessive tenderness and Wanting what's wrong. A song with a meaning scores higher when someone in the scene really feels both halves at once (each at 31 or more). New Meaning column on the song sheet and a Meaning section in the editor.
- **New moments:** Watching / stalking, Worship, Conditioning / brainwashing, Sedated / drugged drift and High / using. Sedated songs lean slow and quiet.
- **The tagged sheet is redone from research.** All 408 songs in your newest playlist export were looked up (lyrics meaning, what that exact recording or cover sounds like, and film, TV and game uses), then a second pass checked the thin ones. Same file name, Easterman-song-sheet-tagged.xlsx, so it replaces the old one.

## 1.67.1: Not here means not here

- **✕ Not here is final for that kind of scene.** One tap and the song never plays in that kind of scene again (Intimate, Danger, Sorrow, Tender, Dark or Party). Every other version of it with the same title goes too, like the Arcade Fire and Sara Lov "My Body Is a Cage". Before, it only nudged the song down a little, and the other version could take its place straight away. To undo it, open the song's ✎ Tags › Never during and tap the scene kind off.
- **Tell it what kind of scene this is.** Under the controls, "This scene reads as…" shows what Moodweaver thinks is happening. Tap Intimate, Danger, Sorrow, Tender, Dark or Party to set it yourself. It holds for the next 6 replies, then goes back to Auto. Tap Auto to hand it back sooner.
- **Slow burn is noticed sooner.** One desire feeling at 31 or more (either of you), or two that add up to 55, now counts. More tender touches in the reply count too, like brushing the hair from a face, cupping a cheek or a thumb across a lip.
- The song sheet's Never during column has the scene kinds too ("Intimate scenes", "Dark scenes"…).

## 1.67.0: songs that fit the scene

- **The kind of scene leads.** Every scene is now one of Intimate, Danger, Sorrow, Tender, Dark or Party, and a song made for another kind drops right down the list. A song tagged Sex scene never plays outside one, and a bright, happy song with nothing sultry about it never plays in an intimate scene, so no more It's My Party during foreplay.
- **The story's own words count.** The newest reply (and your last message) is read for what is actually happening: kissing, undressing and the like make it Intimate even before the moods catch up. Chases, blood, funerals, sleep, parties and driving switch on their moments the same way. No tokens.
- **Heat counts both of you,** whoever the music follows.
- **Whose side a song is on.** A song tagged for Lamb still plays while the music follows Easterman, matched to Lamb's own moods (and the other way round). Songs for someone not in the scene still drop away.
- **Wrong song, changed now.** When the scene turns into another kind and the song playing is wrong for it, it changes straight away, whatever the hold time or "Only when a song ends" says (🔒 Lock still keeps it).
- **Tighter line-ups.** Only songs for the same kind of scene, close behind the pick, are queued on Spotify, so it doesn't wander off by itself.
- **Sounds like.** New Sound column on the song sheet (Spotify's genres, filled in from Exportify CSVs). ✦ Fits teaches which sounds suit which kind of scene, so a Fits on Glory Box in a slow-burn scene brings up more trip hop there.

## 1.66.0: a night-sky Music tab

- The Music tab is redesigned to match the rest of the panel. The song now playing sits in the middle as a glowing planet (its album art), with a dashed orbit and a small moon that circles while music plays and stops when it pauses.
- Under it, a thin star path shows how far through the song you are, with a star at its tip.
- Play and pause is a big moon-gold button between Lock and Next. All three are clean line icons now instead of emoji.
- ✦ Fits, ✕ Not here and ✎ Tags sit just under the controls, and "Picked for" shows the feelings and moments that chose the song.
- "Follow whose moods" is three tappable planets (the character, you, or both together), coloured by each person's current mood like the cards at the top.
- Playlists, Songs, Song sheet and Music settings are tidy drawers that open with one tap. Ticked playlists glow as gold stars.
- Connecting Spotify for the first time is a short star path of steps.
- ✎ Tags now reliably opens the Songs drawer at that song.

## 1.65.3: finding playlists

- Music › Playlists no longer shows every playlist at once. The ones you've ticked sit on top as big rows; find the rest by typing part of the name (emoji work too), or tap "Show all" for a plain list.

## 1.65.2: song sheet fix

- Importing a song sheet now keeps the three dynamics whose names have a comma in them (Power, care & control; Toxic, broken & on-off; Friends, rivals & enemies). Before, they were dropped as unknown.

## 1.65.1: Music on the dock

- ♫ Music has its own button in the middle of the dock (Mood, Relations, Music, Info, Self, Story) instead of hiding under Info.
- Settings › Panel › "Show Music on the dock" hides it. Hiding only tidies the panel: music you switched on keeps playing.

## 1.65.0: music from your own Spotify playlists

- **New ♫ Music tab (Info › Music).** Moodweaver picks songs from your own Spotify playlists to fit the scene and plays them on your Spotify (phone, computer or speaker). The picking is plain matching inside Moodweaver, never Claude, so it costs no tokens.
- **Signing in works from your phone.** Spotify won't send a sign-in back to a home-wifi address like 192.168.1.11, so the Music tab shows the address to add in your Spotify app (http://127.0.0.1:8000/callback/spotify). After you agree on Spotify's page you land on a page that won't load; copy its address, paste it into the Music tab, and you're in. On a computer at 127.0.0.1 it comes straight back by itself. The sign-in is kept in SillyTavern's settings and refreshes itself, so it works on every device after that.
- **Only your playlists.** Tick the ones Moodweaver may use. Spotify only shares songs from playlists you made or collaborate on, so anyone else's shows greyed out; copy it into a playlist of your own to use it. Liked Songs works too.
- **The song sheet.** Export song sheet gives a spreadsheet for Google Sheets or Excel: every song, with dropdowns for Feeling, Exact moods, Place, Moment, Dynamic, Heat, Energy, Character, Theme, Never during, Favourite and Off. A blank cell means "doesn't matter". The Playlists tab tags a whole playlist in one row, and the Characters tab gives each character a default playlist and a theme song. Import song sheet brings it back (xlsx or CSV), and exportify.net CSVs import too.
- **Characters from SillyTavern.** The Character choices are your SillyTavern characters and personas, plus {{char}} (whoever the main character is) and {{user}} (whichever persona you're playing).
- **Follow {{char}}, Follow {{user}} or Follow both** decides whose moods and songs lead.
- **How a song is chosen.** After each reply every song scores points for what it shares with the scene: the person it's for, exact moods, feeling, place, moment (Being hunted, Captivity, Experiment, Confession, Sleep, Afterglow and 12 more, worked out from moods, facts and the dynamic), the dynamic, heat and energy. Songs for someone else, sex-scene songs outside one, and recently played songs lose points. Never during and Off rule a song out. If nothing fits well, the character's default playlist steps in. One of the best is picked and the next best are queued behind it, so Spotify keeps playing fitting songs even if your phone locks.
- **Music that doesn't jump around.** A song plays to its end, then the best song for where the story is now follows. It's only cut short (with a short fade on devices that allow it) when the scene really shifts and the new song fits clearly better, and at most every 2 minutes. Swiping a reply doesn't count. 🔒 Lock holds the music. Music settings change this: only at a song's end, on big shifts, or on any shift; 1, 2 or 4 minutes.
- **Teach it as you go.** ✓ Fits and ✗ Not here remember the song for that kind of scene. ✗ also skips to the next best. ✎ Tags opens the song's tags as tap chips.
- **No tokens** unless you switch on Music settings › "Let the story feel the music", which adds one short line describing the music's feel (never its name).

## 1.64.0: a cached guide, moons everywhere, and feelings that carry on

- **The note now comes in two parts, so most of it can be cached** (Settings › What is sent › "Split the note", on by default).
  - The guide holds the parts that read the same every reply: what the strength words mean, how to play feelings, traits, Mind and relationships, the info board's layout and rules, the hidden line's format, the period and the author notes. It goes once near the top of the prompt, above the chat, where caching can reuse it for much less.
  - The notes hold everything that's true right now, and anything meant to change the scene: moods, facts, needs, the last board, skills in play, period lines, dark and stakes settings, wildcards, the "turned up highest" list, and your prose rules. They still go last, right before the reply, where they land hardest.
  - A short line in the notes names the authors in play, so the voice stays in force even though their full notes live in the guide.
  - The guide only changes when you change settings (add a trait, switch an author, turn on a board row), so it stays cached between replies. Turn the setting off to send everything in one block at the end, as before.
- **Every slider is now moons.** Turn-ons, the Bonds meters, Desire, Needs, Wants, relationship feelings, memories, personality strength and "Follow the read" all use taps.
  - One-sided ones have a new moon (off) and eight phases.
  - Ones that go below zero (turn-on to turn-off, the Bonds meters) have four moons on each side of a middle moon.
  - Tapping the moon it's already on goes back to off or the middle.
  - Needs and the Bonds meters are now one per row, so the moons are bigger.
- **Opposite facts switch each other off** (Settings › What is sent, on by default). Putting on Hot takes off Cold; Hard takes off Soft; Drunk takes off Tipsy; Critical takes off Stable; Well endowed takes off Small. This works whether you set the fact or the story does, and pinned facts stay.
- **Your feelings can rub off on them** (Settings › What is sent › "Your feelings rubbing off").
  - When the hidden line reads a feeling in you (scared, sad, happy, wanting, angry), a character with the empathy for it now and then feels a faint echo of it.
  - Warm traits and caring moods make it likelier. Cold-blooded, callous, psychopathic, narcissistic or cruel settings stop it entirely. Selective empathy only works if they're close to you.
  - Set it to Off to stop it.
- **Aftermath** (on by default). When fear, rage, grief, desire or cruelty at strong or above has just ended, it leaves a wake for a reply or two. Fear leaves shaking hands and jumpiness; rage leaves a short fuse and pride or shame about it. Light feelings like amusement or boredom just stop.
- **Token meter.**
  - A small ◷ pill at the top of the panel shows roughly how many tokens each reply sends.
  - Tapping it opens Settings › What is sent, where a bar splits the count into the cached guide and the part sent fresh, against your target.
- **The note is built once, when it's needed.** Taps in the panel used to rebuild the whole note each time. Now a burst of taps is folded into one rebuild a moment after the last. The full note is always built fresh right before every reply.
- **Southern options removed:** the Southern gothic genre, the Southern accent, Truman Capote (early gothic) and Cormac McCarthy (baroque). Saved picks move to Gothic fiction, Accented, Truman Capote (chic) and Cormac McCarthy (late, spare).
- **Trimmed:** the needs explanation and the last-board explanation moved into the guide, so only the needs and the board record themselves are sent fresh.

## 1.63.0: a skills catalogue, mind-reading skills, facts that look after themselves, and a fuller Info tab

- **Skills work like the other catalogues now.**
  - The Skills tab shows only the skills this person has, grouped and open, so there's no long list to scroll.
  - "＋ Add skills" opens the full catalogue, folded by group, with a search box. "✓ Done" goes back to their own list.
  - Levels are set by tapping a number from 1 to 10 instead of dragging a slider. Tapping the number it's already on takes the skill away.
- **About 60 new skills, 155 in all, in 16 groups:**
  - Charm & people: Courtship, Small talk, Showmanship, Salesmanship.
  - Manners of the day (1950s–60s): A lady's graces, A gentleman's conduct, Poise and deportment, Man of the house, Homemaking, Hostessing, Bridge and party games.
  - Mind games: Conditioning, Reprogramming.
  - Power & bed: Kissing, Dirty talk, Aftercare.
  - Medicine & the mind: Pharmacology, Neurology, Sedation, Running experiments, Bedside manner, Case notes and records.
  - Violence: Restraining people, Swordsmanship, Archery, Ambush.
  - Crime & getting away: Hiding, Escape artistry, Surveillance.
  - Hands & dexterity: Dexterity, Sleight of hand, Magic tricks, Rolling smokes.
  - Body: Fitness, Skateboarding.
  - Animals & outdoors: A way with animals, Animal training, Animal care, Riding, Fishing.
  - Knowledge: Maths, Books and literature, History.
  - Work, money & machines: Bookkeeping, Finance, Running an institution, Carpentry and repairs.
  - Faith & the occult: Scripture and theology, Preaching, Occult and arcana, Spellcasting, Herbalism.
  - Style & taste: Grooming, Fine dining and wine, Music knowledge.
  - Arts & music: Graffiti and street art.
  - Home & care: Baking, Running the household money, Knitting and crafts, Gardening.
  - Baking, Herbalism and Fitness used to fold into Cooking, Chemistry and Strength; they're their own skills again.
- **Psychology and Psychiatry see what's underneath.**
  - When either is at 6 or more and in play, the person can see the other's Mind settings: complexes, anxieties, attachment and so on.
  - It happens when the scene touches one of those settings, or about one reply in three otherwise. It doesn't happen every reply.
  - At 9 or more they see two settings and roughly where they come from.
  - What they do with it follows who they are. They might soothe it, feed it, use it as a lever or keep quiet. The note says plainly that understanding a wound is not the same as wanting it healed.
- **Size, for men:** three new facts under Looks: Small, Average and Well endowed (down there).
  - Each is played by personality. A proud or insecure man is touchy and defensive about being smaller, and an easy one jokes it off.
  - They're only sent in private or intimate moments: undressing, showering, bathing, sex, or when someone is aroused.
- **Facts look after themselves more.**
  - Places now come on from the board's Location ("Murkoff Facility, Sleep Room" turns on Facility and Sleep room) and late night from the clock. They come off when the location changes.
  - A fact the story put on the character comes off once the board stops naming it. Facts that run a course still wear off by the clock.
  - The story keeps at most 8 facts on one person. Past that, the oldest one it added goes. Facts you set or pinned yourself are never touched.
- **Fewer repeated tokens.**
  - Who-they-are facts (looks, style, voice, past, job, fighting, status) now only go when the scene touches them, at overwhelming or maximum, and every sixth reply as a reminder.
  - Right-now facts and places always go. Age and height always go too.
  - So what's already in the character card or persona isn't repeated every reply, and you don't have to edit the cards.
  - You can switch this off in Settings › What is sent.
- **Info tab.**
  - Your own Info now opens with the same sky card as the character's board: clock, date, weather, place and who's there.
  - Below it come your mood, a single row of counts, how they see you, then Condition and Wearing in the board's style.
  - The Profile card, for both people, has Favourites: food, drink, colour and style. They're sent when the scene comes near them (a meal, a bar, a gift, getting dressed) and on the reminder replies.

## 1.62.0: skills that come up when they fit, and an author list built around his point of view

- **Skills come up far more often, without costing much.**
  - Every reply now carries one short line with everyone's skills and levels (names and numbers only), so Claude always knows what each person can do.
  - A skill's full description and the rule on how attempts go are only sent while that skill is in play.
  - Skills now come into play from what's happening, not only from keywords. For example, Psychology and Reading people come up when your character's feelings show, when a strong mood or Mind setting is on, or in a clinical or mind-game dynamic. Medicine comes up with injuries and drugs, and Control and Manipulation with power shifts. At most three come in this way per person, so it stays cheap.
  - Every skill's keywords now include everyday words. Psychology catches "why are you", "upset", "crying", "pretending" and so on.
  - Every skill's description covers all the ways it gets used. Psychology is now "working out what someone feels and why, spotting the mood under the mask, seeing old wounds, and using what they understand, gently or not".
  - 53 combos: when two of someone's skills are in play together, one line says how they work together (for example, he uses what he reads in her to steer her). The line rotates when several fit.
  - The Skills tab marks a skill that "fits what's happening".
- **Authors reshaped.**
  - 30 authors who write almost only from a woman's point of view were removed. Your picks move to the closest author still in the list.
  - Queer and WLW writers stay (Le Fanu, Woolf, Barnes, Waters, Machado, Arsan), along with anyone who writes both.
  - Wording that framed an author as being about women is gone from what's sent and from the panel.
  - 34 new authors:
    - 1950s–60s men's-eye: Irwin Shaw, Saul Bellow, Mario Puzo, Ed McBain, Richard S. Prather, Stan Barstow, David Storey, Keith Waterhouse, Frederick Exley, Alistair MacLean, Gore Vidal.
    - 1960 erotic and sleaze: Orrie Hitt, Lawrence Block's early paperbacks, Ann Bannon (lesbian pulp).
    - 1980s–2010s men: Raymond Carver, Richard Ford, Elmore Leonard, Hanif Kureishi, Karl Ove Knausgård, Lee Child, Philip Kerr.
    - 1984–90 erotic: Anne Rice as Anne Rampling, Jackie Collins, Sidney Sheldon, Dennis Cooper, Edmund White, Jeanette Winterson.
    - 2010s erotic, explicit and slow-burn: Garth Greenwell, Sierra Simone, Christina Lauren, Pam Godwin, Sylvain Reynard.
- **Back to the top:** tap the tab or dock button you're already on to scroll to the top.

## 1.61.0: moods that follow the scene, prose rules that hold, and a clearer Mind tab

- **Giddy (or any feeling) no longer sticks.**
  - The info board used to feed its own State words back into moods every reply, and that kept old feelings alive. Now it can only add a feeling that isn't already on.
  - A feeling you switch off stays off. It comes off the board and out of what's sent, and Claude is told it ended, unless something new in the scene clearly brings it back.
  - The board's State row is written fresh each reply, so a kiss reads as desire, not the giddiness of an hour ago.
  - Claude can now pick up to 14 feelings per reply (it was 10).
- **Every feeling can come from the scene,** not just from meters. The hidden line asks for the whole range by name, including desire, sexual frustration, jealousy, shame and spite. Kissing brings Heated and sex brings Horny on their own, and a scene that's interrupted or held back brings Sexual frustration.
- **Cleaner writing rewritten for Opus 5.5.**
  - Each setting is now a plain instruction that says what to do and why, the way Anthropic's own guidance says Opus follows best.
  - They are sent last as the player's rules for the prose. They hold in every paragraph, outrank any author or style, and ignore the layout of earlier replies.
  - Full paragraphs (was No fragment drama) asks for paragraphs of at least three sentences and says that a short beat sentence joins its paragraph instead of standing alone.
  - The panel now shows what each setting actually does.
  - New: No similes or metaphors, Don't point out the obvious (no "you're shivering"; he shows he noticed by doing something), Don't narrate my character, and No empty threats.
- **Details stay on the right person.** Your character's section and each side character's section now say whose details they hold, so a scar or a chipped tooth can't drift onto someone else. The board's body row covers only the main character.
- **The Mind tab, rewritten.**
  - All 178 entries are now described in plain words, checked against how each condition really works. For example, Social anxiety now covers dread before events, replaying afterwards, blushing and going blank, and looking cold to others. Borderline covers emotions that change fast, fear of being left, swinging between idealising people and feeling betrayed, an unstable sense of self, emptiness and impulsivity, and also how deeply they love.
  - Complexes and a few others (narcissistic, histrionic, and Jung's shadow, persona, anima, animus, eternal youth and old man) now have a meter that starts in the middle. Left is the unhealthy side, right is the healthy side, and the middle sends nothing. The panel and what Claude gets both describe the side you chose.

## 1.60.2: modern authors researched, and authors split by style

- **Authors with very different styles are now separate entries**, so Claude gets one clear voice instead of an average of two. Your existing picks keep the best-known style and are now named for it. 21 new style entries: Philip Roth (late), Truman Capote (early gothic) and (reportage), Evelyn Waugh (elegiac), William S. Burroughs (plain), Cormac McCarthy (baroque), Ian McEwan (early, macabre), Norman Mailer (reportage), Ken Kesey (chorus), Tanizaki (family realism), John Banville as Benjamin Black (1950s crime), Don DeLillo (late, spare), James Ellroy (early), Poppy Z. Brite (restaurant comedies), Nicholson Baker (minute), Michel Faber (cold, alien), J. M. Coetzee (allegory), Susanna Clarke (journal), Joyce Carol Oates (realist), Dennis Lehane (PI) and Lisa Kleypas (contemporary).
- **Modern authors looked up across their careers.** About 50 had useful sources on their whole body of work, and 20 descriptions were rewritten to cover more than one book or series: Le Guin, Carter, Wolfe, Tanith Lee, King, Ishiguro, Ligotti, Pratchett, Welsh, Palahniuk, Tana French, Moshfegh, Kepnes, Barker, Gaitskill, Coupland, Houellebecq, Nesbø, Hobb and Miéville. The rest found little beyond their famous titles and keep their earlier wording.

## 1.60.1: authors researched, not remembered

- **Looked up, then compared.** About 110 authors were checked against sources on their whole career: every 1950s–60s men's-eye writer, the other mid-century names, and the authors whose description only fit one famous book. 47 descriptions were rewritten where the research showed something different or broader (Roth's three different voices, Capote's three registers, Robbe-Grillet beyond one novel, John D. MacDonald's wry first person, Patrick Hamilton's comic Dickensian side, Sturgeon's hidden metre, Tanizaki's diaries and confessions, Bloch's black humour, and more). Notes are kept with the project files.
- **Character details taken out**, such as one character's broken English in Stoker's description and a famous well in Murakami's.
- **16 new researched authors.**
  - 1950s–60s, men's point of view: J. P. Donleavy, Kingsley Amis, Alan Sillitoe, Malcolm Lowry, James Salter (frank and erotic), Arthur Hailey (hospitals and institutions), John Hawkes, Charles Jackson, Colin Wilson, Gerald Kersh, Charles Willeford, Terry Southern.
  - Modern, the male gaze on purpose or by accident: Haruki Murakami, Martin Amis, Javier Marías, Jeffrey Eugenides.

## 1.60.0: authors rewritten from the ground up

- **Every author rewritten.** All 203 now have a description in five parts: prose (sentence shape, rhythm, punctuation, point of view), dialogue, minds (how inner life is shown), people (how characters are drawn, not which ones) and hallmarks. No plots, characters, settings or famous lines; the books only say which voice is meant.
- **Authors lead harder.** The full description goes to Claude at clear or above (it was strong), and the note says all five parts are technique to use, including how much of desire or violence is on the page.
- **Your chat's person and tense stay put.** First stays first, third stays third, past stays past, and the same people narrate. "First person" or "alternating chapters" in a description says how the author wrote, not what to write here.
- **35 new authors.**
  - 1920s–60s, written for men and through a man's eye (some examined, some not): Henry Miller, Norman Mailer, Philip Roth, Harold Robbins, Georges Simenon, Boileau-Narcejac, Alain Robbe-Grillet, Patrick Hamilton, John Braine, John le Carré.
  - 1920s–60s erotic, steamy to fully explicit: Alexander Trocchi, Emmanuelle Arsan, Grace Metalious, Jean Genet, Marco Vassi.
  - Modern, cold and male-gaze: J. M. Coetzee, Michel Houellebecq, Jo Nesbø, Don Winslow.
  - Modern dark romance: Emily McIntire, Katee Robert, L.J. Shen, Aleatha Romig, J.T. Geissinger, Sophie Lark.
  - Modern erotic, no fades: E. L. James, Tiffany Reisz, Joey W. Hill, Kitty Thomas, Mary Gaitskill, Erica Jong, Megan Hart, Nicholson Baker, Laura Antoniou, A. N. Roquelaure.
- Corrected after research: Aleatha Romig (close third, shifting tense), Rina Kent, Pepper Winters, CJ Roberts and others.

## 1.59.1: feelings that follow the scene

- **Desire and love reach the Moods tab.** The hidden line often put what he felt about you under "toward" (aroused, obsessed with her, in love), which only fed Bonds, so a kiss never showed as a feeling. Those words now count as feelings too (at half the step), and the line is told plainly that feelings about you belong under moods.
- **No more stuck leaders.** A feeling raised in four or more of his last eight replies, never lowered and still clear or stronger, is named back to Claude to lower unless the reply truly renews it. Claude is also asked to score what each reply stirs, not what the notes already say. Pinned feelings are left alone.
- **A plainly physical reply warms him.** Kissing or making out (a clear sign plus touch words like lips, throat, skin) with no desire named adds a little Heated.
- More everyday words land: passionate, arousal, desirous, enthralled, besotted, lovestruck, consumed (obsessed).

## 1.59.0: a Mind tab, feelings that know who they're about, and Restraint

### Mind
- **A new Mind tab under Self**, separate from traits and moods and set per person. 178 entries in 13 groups: complexes, neurodivergence, personality disorders, anxiety and mood, eating and body image, trauma and dissociation, attachment, delusion and psychosis, defences, thinking traps, Freud, Jung and the old schools (Adler, Horney, Fenichel, Reich, Winnicott, Kohut, Laing, behaviourism), old diagnoses (hysteria, nerves, melancholia, frigidity, dementia praecox, sexual psychopath and more), and strengths. The clinical entries that were scattered across Traits and Facts (narcissism, psychopathy, attachment styles, autism, ADHD and so on) moved here; what's left in Traits is now Patterns & coping.
- **Short lines, played from the inside.** Each entry is one plain line, and one paragraph asks Claude to show it in small choices and blind spots, let it vary with stress, have nobody name it unless someone in the story would, and skip the stock screen versions.
- **Sent when it makes sense.** Clear and stronger every reply; fainter ones only when the last messages touch their words. ★ always sends one.
- **Healthier or darker.** Complexes and some others lean either way; Middling is the default.
- **It weaves in:** it leans the dynamic, six new clashes (clinging against pulling away, a need for admiration against someone who gives themselves up, a rescuer and someone wounded, suspicion against a secret, order against impulse), five new combos (Clings harder, Cold method, The doctor's eye, Nerves in the body, Then and now), and needs drain faster or slower to fit (an insomniac tires sooner, a schizoid barely gets lonely).
- **1950s–60s lines for it**, researched, each written for him and for her: no word yet for autism (a rare children's diagnosis blamed on "refrigerator mothers"), a restless mind called lazy or minimal brain damage, self-regard, Cleckley's mask of sanity and the sexual-psychopath laws, borderline and hysteria, Miltown and Valium for nerves, Freud's complexes, figure and food, desire on file (frigid or nymphomaniac), and holding on. The madness, low spells and old wounds lines now cover the new entries too.

### Feelings that stay with the right person
- **A feeling can be about someone else.** The hidden line can say "angry +10 at his wife"; the panel shows it, and Claude is told it can shorten his temper but doesn't turn into anger at you. Relationships and dynamics are now said to be about the two of you only, so they don't spill onto the rest of the cast.

### Your side
- **How you come across.** The hidden line names up to three feelings you showed this reply. They're set at about half strength and fade once the story stops naming them. This is why clashes hadn't fired: your side never had moods unless you set them.

### Restraint
- **Restraint is back as a meter** (Relations › Bonds), with 17 dynamics for it: love held back out of guilt, a relationship that can't be seen, out of wedlock, saving it for the wedding, courting properly, duty first, and more. Guilty, repressed and forbidden feelings push it up. A new Forbidden love preset.

### Authors
- **Authors moved up**, right after Cleaner writing and Writing style.
- **19 new authors**, mostly men writing from a man's point of view, several in third person: John O'Hara, James M. Cain, Ross Macdonald, John D. MacDonald, Ian Fleming, Mickey Spillane, Graham Greene, Alberto Moravia, Kōbō Abe, Jun'ichirō Tanizaki, Richard Stark, W. Somerset Maugham, Frank G. Slaughter (a surgeon who wrote hospital novels), Albert Camus, Lawrence Durrell and John Cheever; and three modern ones who write the 1950s and 60s: Patrick McGrath (a psychiatrist narrating an asylum affair), James Ellroy and Dennis Lehane.
- **Authors lead the writing.** They now outrank the other writing settings where the two pull different ways, and a strong author (strong or above) sends its fuller description of how they write, so the voice should be recognisable in every paragraph. Every description is technique only (sentence shape, rhythm, point of view, what the eye lingers on), and Claude is told not to borrow plots, characters or personalities, or to make anyone more like one of theirs. Nearly a hundred descriptions that leaned on the books (their settings, plots or character types) were rewritten as pure technique.
- **Southern writers taken out of the 1950s–60s list:** Flannery O'Connor, Carson McCullers and Jim Thompson. If you had one on, it moves to Shirley Jackson (O'Connor, McCullers) or Dorothy B. Hughes (Thompson).

## 1.58.0: plainer words, a dynamics overhaul, facts that come and go, and authors described properly

### Plain wording
- **The dock reads Mood, Relations, Info, Self and Story.** Headings, empty-tab text and help lines across the panel are shorter and plainer, with the obvious explanations taken out.

### Dynamics
- **Four new groups:** Clinic & experiment, Mind games & conditioning, Secrets & double lives, and Society & reputation. **182 new dynamics** across all thirteen groups (444 in all), and more keywords for the old ones.
- **Eight new meters:** Conditioning, Clinical eye, Secrecy, Appearances, Fear, Rivalry, Shame and Devotion. Easterman's preset gets Conditioning and Clinical eye; there are new Experiment and Secret affair presets.
- **Picking reads the whole picture.** Every dynamic whose meter test fits is scored, not just the first one: both people's moods, a clash between them, the ties you've set and the words in the last two messages lean it toward the groups that fit, more strongly at faster paces. In testing, 409 of the 444 can come up.
- **A second dynamic underneath.** Slower to change and from a different group, it colours the main one rather than replacing it ("Captor, with Devotion underneath"). It works out on its own; Relations › Bonds can switch it off.

### Facts
- **172 new facts** across all twelve sections, mostly fitting 1950s–60s or 1990s–2010s: shock treatment, Thorazine, truth serum, an experimental drug, needle marks, rope burns, stitches; stockings and garters, a slip, handcuffs, tied to the bed; Miltown, diet pills, sleeping pills, Adderall, lean; Fifties New Look, Mod, Beatnik, Greaser, Y2K, Scene; a Mid-Atlantic or clinical voice; war veteran, institutionalised, polio survivor, blacklisted; nurse, orderly, secretary, housewife; committed, in a trial, someone else signs for them, in the closet, divorced, expecting; asylum ward, operating theatre, hydrotherapy room, drive-in, fallout shelter; Company man, Perfect wife, Handler, Cold surgeon and more.
- **Facts come and go on their own.** Every right-now fact wears off unless the story keeps it going. The character's come on from the board's Physical State; yours come on from the hidden line's list of what's true of you, and come off when it stops listing them. Your own hand-set and pinned facts stay put. Undo and swipes put everything back.

### Authors
- **Every author now says how they write**, in plain words, with their best-known books. ⚙ Settings › Panel › Show how each author writes turns the longer descriptions off.
- **13 new 1950s–60s authors**, mostly dark: Cornell Woolrich, Charles Beaumont, Margaret Millar, Georges Bataille, Paul Bowles, Joan Didion, Carson McCullers, Leonora Carrington, Janet Frame, Jerzy Kosiński, Theodore Sturgeon, Daniel Keyes and James Purdy.
- **What Claude gets is technique only:** the name, one or two books so it knows which voice is meant, and a short line on sentence shape, point of view and rhythm. Lines that described plots were rewritten, and the note tells Claude to take nothing from the books' plots or characters.

### The story prompt
- **New writing options:** Its own words (no lifting phrases from the notes or card, which Opus 5.5 tends to do), Unexpected choices, and Follow my lead.
- **Wildcards** (Stakes): Moodweaver picks a random twist for some replies (someone arrives, a lie, something breaks, an old detail comes back) and asks Claude to grow it from what's already in the scene. Its strength is how often.

### 1950s–60s
- **More 1960s lines** for the new facts: expecting, committed, signed for, in a trial, in the closet, divorced, nursing, secretary, keeping house, blacklisted, polio, police; and the new drugs, jobs, places and clothes wake the medicine, vice, secrets, home, law and dress lines.
- **Ten new combos:** Treatment plan, Subject or sweetheart, On schedule, After the treatment, Behind closed doors, Afraid of wanting, Prize, Devoted to a fault, Good wife's smile and Shamed into it.

## 1.57.0: when their moods clash

- **Mood clashes.** When what you feel and what they feel don't match, one line says it may rub, or not, and leaves it to the scene: happy against sad or angry, wanting it against romantic-without-heat, tired, sad or cold, reaching against pulling back, both angry, both wanting the lead, jealous against flirty, calm against angry, wired against worn out, chatty against wanting quiet, and more. 19 kinds, read from whole mood families, so all the feelings in the list are covered.
- **Never forced.** Only the strongest mismatch, one line at most, and only on some replies: ⚙ Settings › What is sent › When their moods clash: Off, Now and then (default, about one reply in three) or Often.
- **Opposites still attract.** Traits never clash. Bed roles do (two who lead, or two who wait to be led), but only while one of you is in the mood.

## 1.56.1: many more 1960s lines

The 1960s America lines now read almost everything on the cards, still under the same lines-per-reply cap, so each reply gets a different handful.

- **About 75 new he/she lines** for each person, covering body and health (hurt, ill, her monthly, scars and ink, figure, looks, grime, pills, drugs, hangovers, smoking, madness, low spells, grief, old wounds), background and work (service, a record, church upbringing, no family, foreign, selling it, a trade, waiting tables, college, dealing, married, in the papers, a secret life, missing), the bedroom (giving herself over, taking her, holding back, particular tastes, inexperience, two kinds of women), beliefs and manner (a woman's place, family first, disillusion, speaking out, wanting more, sacrifice, idleness, appetite, quiet ones, the life of the party, scatterbrained, exacting, scheming, mannish, soft ways, manners, a sharp tongue, leaning on someone, keeping face, showing love).
- **Needs:** low hunger, energy, hygiene, health, company, fun and bladder bring their own lines.
- **Roles:** each person's own ties toward the other (boss, working for, doctor, patient, teacher, parent, protecting, pursuing, rivalry, keeping someone) read differently for a man and a woman.
- **The dynamic:** romance, heat, toxic, allies, family roles, distance and obsession each get a line about how the period sees it.
- **Age and height** on their own: an unmarried woman at 27, a man of draft age, a woman past 45, a tall woman, a short man.
- **Places:** bars, hotel rooms, the all-night diner, the office, mourning, out of reach, dining out, in public, the police, after dark and the beach, from the setting facts.

## 1.56.0: the moon-phase panel, ties that talk to the dynamic, and a 1960s that reads him and her differently

### A new panel

- **Two matching cards at the top** for you and the main character, each with the feeling in front, and the cast as small chips under them.
- **A dock at the bottom** with five places: Heart (Moods), Between (Bonds, Turn-ons, Intimacy), Body (Needs and Facts, or You on your own character), Self (Traits, Skills, Wants) and Story. The tabs inside a place show as chips at the top. Each place remembers the tab you last used.
- **Swipe sideways** to move to the next or previous tab. A new tab slides in from the side it lives on.
- **Moons instead of sliders** on feelings, traits and facts: eight phases from faint to maximum, and a dark new moon for off. Tap to set; tap the moon it's already on, the new moon or the level word to clear it. No dragging.
- Animations are soft and switch off if your phone asks for reduced motion.

### Ties and the dynamic

- **The note now gives each its job:** ties are who they are to each other and change slowly; the dynamic is how it's going lately. Where they pull apart, Claude is asked to write the strain rather than drop one.
- **Clash lines.** When a tie and the dynamic pull against each other, one short line says how both are true. For example, "whoever holds the power between them, Easterman gives way to Lamb where it counts to Lamb: her wants, her comforts, her small demands", or "the fight between them is fought by someone in love". About 25 of these.
- **A suggested tie.** Once a dynamic has held for 12 replies, the Bonds card can offer the tie it implies ("＋ Has them on a string?"). Nothing changes unless you tap it, and × stops it being offered again. That keeps the dynamic from feeding itself.

### More linking

- **Core traits bend the dynamic.** A proud man who's giving way does it without looking like it; a soft-hearted one holds power gently; a disciplined one stays measured even in a heated dynamic. Core traits are now "under any mood or dynamic".
- **Facts move meters.** When a hurt fact comes on for you (bleeding, concussed, sick), his Care and Protectiveness rise; when he's drunk or high, his Openness does.
- **Carrying counts.** A revolver he carries counts toward gun turn-ons and wakes the period line on guns; a flask, cigarettes, a camera or a rosary do the same for theirs.
- **Lit turn-ons warm his desire,** and so do yours he sees land, when the line didn't move the Desire card itself.
- **Hungry, tired or uncomfortable** makes feelings quicker to flare. There's a switch under Needs › Needs over time.
- **What they're into comes up lightly.** When a reply touches one of his interests, he gets a little "in his element" (never past strong), and the profile line says the interest comes up when the scene gives it room.

### The 1960s, open both ways

- **22 new lines on how the same thing reads on a man and on a woman** in 1950s–60s America: taking charge, giving way, sass, ambition, drinking, temper, tears, wanting it, being alone, brains, coldness, looks, crude talk, caring, violence, rebelling, faith, nerves, pride, jealousy, money and work. They follow the Pronouns on the Bonds tab, whoever has the trait, so "Lamb giving orders gets her called bossy" and "a man who gives way to a woman is called henpecked".
- **An age-gap line** both ways, when ages are set and they're romantic.
- They join the rotation under **Period lines per reply**, so a reply still gets only that many.

### Story panel

- **Cleaner writing and Writing style come first**, then Smut style, Period, Genre, Stakes, Dark story pressure, the tropes, Combat and the authors.

## 1.55.0: facts that run their course, a profile, and the panel tidied

### Facts move feelings and wear off

- **Temporary facts run their course.** Drunk, bleeding, soaked, concussed, injured and about 50 others last a set time, fade, and turn into what comes after: drunk for about 6 hours, then hungover; bleeding, then bruised; concussed, then a headache. The time comes from the clock and date on the info board, so a time skip moves them on at once; without a clock each reply counts as about ten minutes, and a change of place as an hour or more.
- **They stir the feelings that go with them.** Drunk pushes hazy and emboldened, hungover grumpy and sluggish, and so on (about 45 facts), never past 70, and only while the fact is on. Pinned feelings stay put.
- **Undo, swipes and deletes take it all back**, for the main character and for you: the fact, its clock and the feelings it pushed.
- Claude can now name a fact on the hidden line (a nosebleed, soaked through), and it's switched on.

### A profile for both of you

- **The Facts tab starts with a small profile:** Age, Height and Into (main interests), and up to three **core traits**. Star a trait (☆ on the Traits tab) to make it core: it's always sent first, "under any mood", and never dropped. Other traits stay as they were.
- The note gets one short Profile line per person and a "Between them" line when it matters ("Easterman is 14 years older and much taller than Lamb"). Height and interests also light turn-ons: *tall people* for someone taller, a shared interest for "into guitar".

### Feelings, traits and turn-ons work together

- **Mood boosts turn-ons.** When he's horny a lit turn-on hits harder; when he's angry a lit turn-off bites harder and lingers.
- **Traits set the pace of feelings.** Volatile, impulsive or hot-headed people swing faster, steady and stoic ones slower, brooding or grudge-holding ones let go more slowly. The Moods card says when this is happening.
- **He learns your turn-ons from how you react.** The hidden line notes when he picked up on one of yours. Once makes it suspected, twice makes it known ("picked it up from how Lamb reacts"), and deleting those replies takes it back.

### Era lines don't decide who leads

- Who leads between them now comes from what you set and how they feel first: roles you set on Bonds, then the Control meter, then their moods (demanding, bratty, needy, yielding and so on). Only when none of those lean either way does the old default apply. So when Lamb is demanding her candies and soaps and he's soft and accommodating, he's not pushed into charge.
- Period lines are now framed as the world around them: what other people expect, say and risk, and now and then a little tension when they don't fit it. They stay on as before; they just no longer change who either of them is.

### Bonds and dynamics

- **"Shaped by"** on the Bonds card shows what's steering the dynamic: the strongest ties between them and turn-ons in play.
- **Your sliders** (Light, Balanced, Strong) sets how firmly the relationship sliders you set hold the meters and the dynamic, so the story and the moods can move it more or less. Pace is set once, on the Moods card.
- Ties don't get set from the dynamic, so there's no loop that could get a dynamic stuck.
- Pronouns fold away under the card.

### The panel

- **Tab order:** Moods, Needs, Bonds, Facts, Traits, Turn-ons, Intimacy, Skills, Wants. Intimacy now comes after Turn-ons, and Facts sits higher.
- **The Facts tab is rebuilt:** profile, then a summary of what's on in two rows (Right now, Who they are), then the list under the same two headings, then what they carry.
- **Your facts are on the You tab**, under your outfit and condition.
- **Items are now "Carrying"**, at the bottom of Facts: a short list with a tick to carry or put away. Same items as before, no separate tab.
- **Why is this on?** A faint "↳" line under a feeling says what put it there when it wasn't you: the story raised it, a fact brought it, or it's wearing off. ⚙ Settings › Panel › Show why turns it off.
- **Hide the Wants tab** in ⚙ Settings › Panel. With it hidden nothing about wants is suggested, and Claude decides what they want on its own.

## 1.54.0: turn-ons that react to who someone is

### Turn-ons light up from the other person

- **A turn-on now counts when the other person simply *is* it,** not only when a reply mentions it. If Easterman likes brattiness or dominance and your character is bratty or has princess dominance on, it's in play all the time: the note tells Claude "brattiness (in Lamb: bratty)", so it colours how he sees her from the start and builds over time. It works both ways, for his turn-ons and yours.
- It reads what's already on the cards, so there's no extra request and only a few words per line: moods and traits (feelings once they're at 41 or more), Intimacy options, facts, skills at 5 or more (*doctors* lights for someone with Medicine, *musicians* for Guitar), and ties (*captors* for someone who's your captor, *teachers* for your teacher). About 190 turn-ons know what to look for.
- **The Turn-ons tab shows them** under the chips: "In play from Ellie: ♡ Brattiness *bratty*".

### Turn-offs bite, and their opposite helps

- A turn-off the other person shows is marked the same way and keeps grating. For a few turn-offs with a clear opposite (prudishness and someone shameless, brattiness and someone obedient, shyness and someone outgoing, and so on), showing the opposite counts in their favour, marked ✓.
- **They move the relationship now.** His turn-ons you show warm the romance baseline, his turn-offs cool it, and an opposite warms it a little (at most 20 points either way). And each reply where his hidden line says a turn-on lit nudges romance up a point or two, a turn-off down, whenever the line didn't move romance itself.

### Age

- **An Age box on the Facts tab** for the main character and for you. With both set, *older men*, *younger women* and the rest count whenever the other one fits (two years apart or more, and a man or a woman by the Pronouns on the Bonds tab).

### Your turn-ons in the story

- Claude is now asked to bring your turn-ons in one or two at a time, giving each a few replies to build before the next, rather than all at once. Ones he knows about he uses on purpose and knowingly: the right words, timing and touch, teasing with them, holding them back, rewarding with them, watching what they do to you. Ones he suspects he tests quietly and reads your reaction.
- The last capital-letters marker in the note ("PRESSED last reply" on wants) is now plain lowercase, like the others.

### No more 1890s

- The 1890s and 1900s eras (with their Britain and Scotland versions), the Victorian drama, fantasy and erotica genres, and their period lines are gone. The 1910s era stays, without period lines. If a chat had one of them on, it's simply switched off.
- Four turn-ons that only fit then are merged into modern ones, with saved values moving over: bloomers and petticoats → lingerie, dandies → sharp suits, gentry → rich people, governesses and tutors → teachers. Caning now reads as school style rather than Victorian.

## 1.53.0: turn-ons sorted, skills rebuilt, more 1960s, one pace from the Moods card

Chats carry over: removed turn-ons and skills hand their saved values to the ones that replaced them.

### Turn-ons, sorted out

- **No more doubles.** About 70 turn-ons that repeated another or bundled two sides together are gone, and their saved values move over (the stronger value wins). "Hair pulling", "biting", "bondage", "choking", "CNC", "oral", "anal", "face sitting", "chastity", "breeding", "tickling", "hypnosis", "pet play", "fear play" and the like are now always a pair: doing it, and having it done (for example *pulling someone's hair* and *having their hair pulled*). A combined one you'd set goes to both sides; set either back to 0 if it only fits one.
- **31 new ones,** mostly the missing halves of pairs, plus a few like *being marked*, *drinking someone's blood* and *ravishing someone*.
- **Regrouped like the moods:** Looks & body, Voices, sounds & scents, Personality, Types of people, How they're treated, In bed, Kinks and Fetishes, each with small sub-headings (Face, Build, Hair & skin…; Pain and impact, Restraint and control, Mind and fear…). Pairs sit side by side. 573 in all.

### Setting things to 0

- **Tap the level word or number** on any row (a mood's "40%", a turn-on's "Neutral", a skill's "3/10", a Bonds meter's number) to put its slider at 0, the middle on a two-way slider. No more trying to hit the centre on a phone. × still takes it off the list.
- A mood set to 0 by hand in dynamic mode is no longer pinned at 0, so the story can bring it back.

### One pace, set from the Moods card

- **Speed on the Moods card now sets the pace for everything:** feelings, Bonds meters and desire. The Pace select on the Bonds tab is the same setting. The ⚙ Settings › Pace section and the Desire card's own pace are gone.

### More 1960s

- **13 new period lines for 1950s–60s America:** home and marriage, dating, pregnancy, what nobody says about sex, dressing, pictures, the war, appearances, suspicion (the Red Scare), guns, cars and roads, teenagers, and experiments. Each shows only when something on the cards touches it, and where the pair is a man and a woman it names them (who's expected to keep house, who asks and pays). Kept to the era in general, not to any one story.
- Skills can now bring on period lines too (a good shot brings Guns, a driver Cars and roads, hypnosis or psychiatry Experiments), and medical turn-ons bring Medicine.
- **Period lines per reply goes up to 6.** They still take turns from reply to reply when more apply than fit; Power always comes first.

### Skills, rebuilt

- **The Sims skills are gone.** 95 new ones in nine groups: Charm & people, Mind games, Power & bed, Violence, Crime, Body, Learning & trades, Arts & music, and Home & care. Your list is all there (seduction, manipulation, gaslighting, hypnosis, interrogation, mental and physical torture, lockpicking, gun use, guitar, bass, drums, etiquette, parkour and the rest), plus gritty and period ones: bribery, bugging and wiretaps, disguise, holding their liquor, typing and shorthand, electronics, psychiatry, surgery, first aid, hair and makeup, bartending. Levels you'd set on skills that carried over (medicine, hypnosis, lying…) are kept; the ones that merged go to their replacement.
- **Skills grow on their own, slowly.** Only the skills picked for someone: each time their words come up in that person's own message (or the hidden line says it was used), it counts as practice, and enough practice raises the level. Higher levels take longer. A skill left unused for a long stretch slips a level, never below 1. Growth has its own pace on the Skills tab (Off, Slow, Steady, Quick; Slow by default), separate from mood pace. Nothing extra is sent: it reads text that's already there, and a swipe takes it back.
- **◆ now pins a skill's level** so it doesn't grow or slip. Skills are only sent when the scene calls for them; "always send" is gone.

### Written for Opus 5.5

- The all-caps markers (LIT, CRAVING, COMBO) are now plain words. Anthropic's guidance for current models is that capitals and forceful wording make them overreact; plain statements with the reason attached work better. A combo now reads "Combo from what just lit up (Punishment): … Let it shape the next beat."

## 1.52.0: moods drive the dynamics, an Intimacy tab, and one pace

Builds on 1.51 without undoing any of its cleanup. Chats and settings carry over; no option id changed, so everything you'd set stays set.

### Moods and dynamics work together

- **Most moods now move the Bonds meters.** 472 of the 603 moods push something when they rise in a reply, up from about 110. Each family has a sensible default (happy warms Friendship, cruel raises Urge to hurt and Control, masks lower Openness, attachment raises Dependence and Obsession), and about 360 moods have their own (staking a claim raises Possessiveness, betrayed drops Trust, forgiving eases Resentment). The ones left out are about the character's own state (tired, grieving, zoned out), not about you. Since the meters pick the dynamic, the dynamic now follows the mood.
- **It's free.** The nudges read feelings the reply already reports; nothing extra is sent, and whatever the hidden line said about a meter itself still wins.
- **108 new dynamics,** at least 12 in every group, 262 in all. Captor & prey gets Taming, Sweet captivity, Escape artist and Cat and mouse; Obsession gets If not me, no one and Wearing their things; Power gets Gentle command, Leash and treat and Kingmaker; Romance gets Domestic bliss, Courtly love and Love despite everything; Lust gets Stolen moments, Claiming in bed and Rough and tender; Toxic gets Apology tour, Walking on eggshells and Scorekeepers; Friends & rivals gets Co-conspirators and Sworn enemies; Roles & family, which was empty, gets Surrogate parent, Head of the house, Black sheep and Chaperone; Distance gets Polite strangers, Frozen out and Drifting apart.
- Every new dynamic was checked to be reachable: each one actually comes up for some of the meter values it's written for, and the older ones keep most of theirs (the broad catch-alls like Falling, Friends and Hostile give some ground to the new, more specific ones, which is the point).

### An Intimacy tab

- **Roles & dynamics and Psychosexual have left Traits** for their own ⚘ Intimacy tab, in four groups:
  - **Roles in bed:** D/s, pet play, roleplay roles and kink practices (conditioning, camera control and the like moved here from Psychosexual).
  - **Sexual temperament:** vanilla, sex-positive, late bloomer, dirty minded, covert pervert, deviant, repressed, the gazes.
  - **What draws them:** responsive or spontaneous desire, distance, banter, being pursued, fear or obedience as arousal.
  - **Psychosexual,** now only what the word means: the psychology under someone's sex life (sex as comfort, as punishment or as currency, shame, the Madonna-whore complex, transference, parent issues, devouring desire).
- Six roles that weren't sexual (Fatherly, Big-sibling energy, Protector, Handler, Jester, Royal favourite) moved to Traits › Manner & presence.
- Intimacy options light up ✧ like turn-ons, and work in combos, exactly as before.

### The prompt for traits

- The line "These feelings are what make this reply different…" used to go out even when only traits were set. It now only goes with real feelings.
- Traits get one plain line of their own: who someone is underneath, shaping how each feeling comes out.
- Intimacy gets one too: it leads in intimate or charged moments and stays in the background otherwise. Both are written for Opus 5.5 (plain statements, nothing to override).

### One pace

- **Desire now runs at the Bonds pace.** It had its own Slow / Normal / Fast setting that defaulted to slow, which is why it read "normal" while everything else was Volatile. Its steps now match: up to 5, 10, 20 or 25 a reply, and the hidden line asks for steps that size.
- **⚙ Settings › Pace › One pace for the whole scene** (on by default): feelings, meters and desire all follow the pace on the Bonds tab, and the mood nudges scale with it. Switch it off to give the Moods card and the Desire card their own pace. This replaces the "same speed as Bonds" box on the Moods card.
- Needs drain on their own clock (Needs tab), since that's time passing rather than how fast the story moves.

### Free links between meters and moods

- Desire-family moods rising (horny, kiss-hungry, dominant hunger…) warm the Desire card's arousal when the line didn't move it.
- The dynamic in play keeps its own feelings going: under a romance, warm feelings wait twice as long before they fade; under a captor dynamic, cruelty, nerve and fear do; toxic ones keep anger and clinging alive. Nothing extra is sent.

### Smaller things

- The Bonds tab only draws its full list of dynamics when you open it, so it opens a little faster than 1.51 despite the longer list.
- With ten tabs, the open tab now stays in view in the tab bar after the panel redraws.

### Speed

Checked against 1.51 on the same 1,500-message chat with the CPU slowed 4× (two runs each; differences under about 40 ms are noise):

| | 1.51.0 | 1.52.0 |
|---|---|---|
| Opening the panel | about 320 to 420 ms | about 310 to 390 ms |
| Opening the Bonds tab | about 250 ms | about 235 ms |
| A reply arriving with the panel open | about 110 ms | about 85 ms |

## 1.51.0: more of everything, and a better look

Builds on 1.50 without undoing any of its cleanup. Chats and settings carry over; nothing is renamed.

### Looks

- **Padding fixed** on the You tab and the Skills tab, where text ran edge to edge. Every tab was screenshotted at phone width and checked for anything touching the sides.
- **You tab redone.** An orb in your mood's colours with what's showing right now, a row of counts that open their tabs (traits, turn-ons, wants, what they know about you), how the character sees you, what you're wearing and what's happened to you.
- **The diamond follows the mood.** Its top takes the colour of the strongest feeling's family, the lower facets the next one, and it glows brighter and bobs faster as the feeling gets stronger. The ◆ Moods button and the panel's header pick up the same colour.
- **A quiet galaxy** behind the panel: dim stars and two faint blue and violet clouds, kept dark enough for the text on top. The stars are six tiny repeating patterns of odd sizes, which costs about the same to draw as 1.50's handful.
- A soft fade at the end of the tab bar shows there are more tabs to scroll to.

### Speed

The lists are much longer now, so drawing was checked against 1.50 on the same 1,500-message chat with the CPU slowed 4×:

| | 1.50.0 | 1.51.0 |
|---|---|---|
| Opening the panel | about 415 ms | about 395 ms |
| Pressing ＋ Add to browse everything | about 280 ms | about 115 ms |
| Moving a slider while browsing | about 290 ms | about 310 ms |
| A reply arriving with the panel open | about 130 ms | about 130 ms |

How: while browsing everything, a folded group's rows are only drawn when you open it, and searching draws them all first so nothing is missed. The new word lists are looked up from the catalogue rather than written into every row.

### More moods

- **134 new moods**, about ten in each of the 14 families, from Smitten and In stitches to Frosty politeness, Sweetly unhinged, False mercy, Mind breaking and Teased to breaking.
- **Every mood (all 603) has a list of everyday words.** When Claude writes "fuming", "white-hot" or "out for blood" on the hidden line or the info board, it now lands on the right mood instead of being dropped. The words are only used for reading; they are never sent, so the note doesn't grow.
- Desire & attraction now sits right after Love & closeness.

### More turn-ons

- **187 new turn-ons, at least 20 in every group**, with the 1890s, the 1950s and 60s and the 1990s to 2000s in mind: pin-up curves, slicked-back hair, crooners, seamed nylons, greasers and housewives; petticoats, waistcoats, gentry, governesses and love letters sealed with wax; low-rise jeans, chokers, band tees, mixtapes and camcorders.
- **Both sides of the kinks**, as separate turn-ons: spanking someone and being spanked, and the same for caning, whipping, beating, torture, choking, spitting, milking and mind break, plus giving and receiving oral, being hand-fed, having hair pulled, being bitten and being tied up.
- Your list: bladder desperation, drool, riding crops, dehumanising (both sides), Lima and Stockholm syndrome, wrestling and fighting as foreplay, grinding, infidelity (cheating, being cheated on, being the other one), an oral fixation, shotgunning, smoke on the breath, almost getting caught, making someone dumb and being made dumb, and fake sympathy (giving it, getting it, and cooing over pain you're causing).
- They light up, crave and combo like the old ones. Matching what sparked is sharper: a word that is exactly one of a turn-on's words now beats one that only looks similar, so "spanked" finds Being spanked, and "scared" no longer lights Scars.

### Combos and period lines

- **Seven new combos** for the new turn-ons: Punishment, Near miss, Cooing cruelty, Mind going, Smoke and mouths, Captive heart and Brawl.
- **Six new period lines**, each shown only when something on the cards touches it: Vices, Being found out, Marriage and straying, Faith and sin, The law and Discipline, written for every period from the 1890s to now.
- **Period lines take turns.** Power always shows when it applies; when more lines apply than fit, a different handful shows each reply, so a long 1960s story keeps meeting new sides of its period. The same reply always gets the same lines, so swipes stay consistent. **Period lines per reply** (1 to 4, default 3) on the Story panel sets the cap.
- A combo that pointed at a mood merged away in 1.50 was cleaned up.

## 1.50.0: a clean base

Under-the-hood rework before new features. Your chats, settings, pins and character defaults carry over.

### Organised

- The catalogue is one set of data files in `data/catalogue/` instead of a base list plus ten layers of patches. Every mood, trait, relationship, turn-on and dynamic now has one place where it's written, with its final wording.
- The two giant files (`index.js` and `core.js`) are split by job into `app/` (talking to SillyTavern), `engine/` (the rules) and `panel/` (what you see). See [DEVELOPING.md](DEVELOPING.md) for the map.
- Unused code and old version stamps in comments are gone.

### Faster

Measured on a 1,500-message chat with the CPU slowed 4×, averaged over two runs each. The numbers swing from run to run, but the gaps hold:

| | 1.49.6 | 1.50.0 |
|---|---|---|
| Switching chats | about 330 ms | about 65 ms |
| A reply arriving with the panel open | about 230 ms | about 120 ms |
| Moving a slider while browsing everything | about 475 ms | about 350 ms |
| Moodweaver data saved in that chat | 237 KB | 4 KB |

How: parsed info boards are remembered instead of re-read on every change, the panel isn't redrawn while it's closed, and chats save only the options that are switched on.

### Removed: your own options

Your own moods, traits, turn-ons, dynamics and skills, the library, the "make your own" editor and "⇪ Moodlet for…" on the board are gone, and any you had are cleared when 1.50 first loads. This is a fresh start built on the built-in, meter-driven options. Feelings the story names that aren't in the catalogue are now ignored rather than turning into new rows. Your own combos on the Turn-ons tab are still there.

The idea isn't dropped for good: see "Ideas for later" in [DEVELOPING.md](DEVELOPING.md).

The 402 panel notes that only repeated the description and added "Fits: …" are gone too. The descriptions themselves, and what's sent to Claude, are unchanged.

### The note sent to Opus 5.5

Small, deliberate edits. Everything else in the note is word for word what 1.49.6 sent.

- **Opening line.** It now says the notes are current, without telling Claude to override anything.
  - Before: *The player's notes for this reply. They're newer than the card, the chat and earlier style rules, so where they differ, follow these.*
  - After: *Where things stand for this reply, set by the player. These are more current than the character card and earlier messages.*
- **Strength is explained once.** The key at the top already says what each strength means, so lines no longer repeat it in brackets. This saves up to about 90 tokens on a busy note.
  - Before: *- strong: owes Ellie his life (shows several times and decides a choice)*
  - After: *- strong: owes Ellie his life*
- **The feelings paragraph says what to do, not what to undo.**
  - Before: *Don't swap a listed feeling for the card's usual one; if the reply would read the same with a different blend, rewrite it.*
  - After: *Play this blend rather than the card's usual mood, so a different blend gives a visibly different reply.*
- **The dodge list isn't sent twice.** When Follow-through, No fade-out, No rescues, Full strength or Dead dove is on, the full list of dodges is already in that paragraph, so the dark-character line no longer repeats a shorter version of it.

Kept as they were, because they're what Anthropic's Opus 5.5 guide recommends: naming the specific dodges to avoid, plain statements of what the story needs, and blend planning off by default.

## Earlier versions

**1.49.0:** sections that work together. Eras are one plain instruction; era lenses say what the period does to power, medicine, queer desire, secret kinks, sex and money when those are in play; roles and the strongest feeling get one line each about how they meet the dynamic; and one speed covers the whole scene.

**1.48.0:** the dynamics list only holds dynamics the meters choose (154). The 27 roles (doctor and patient, boss and secretary, exes…) live in Relationships, and any you'd picked move there.

**1.47.0:** dynamics that follow the scene for fewer tokens. Feelings each reply reports push the matching meters, a new dynamic takes over after two replies agree (no flicker), Meters is the default mode, and the hidden-line instructions are about a third shorter.

**1.46.0:** one home per idea. 35 trait-like moodlets moved to Traits and 10 mood-like traits moved to Moods (same ids, values kept), 81 new moods leaning dark and adult (469 in all), and a choice between any mood or only the character’s list.

**1.45.0:** the story moves moods. Every reply moves feelings for free, with a speed per character (Slow burn to Volatile), fading on that speed, Undo, and fixes for the moods it used to ignore (Horny included).

**1.44.0:** pronouns in Bonds lines, 40 more dynamics, 50 more turn-ons, your turn-ons reaching the story whether or not the character knows them, and Cleaner writing options for Opus 5.5.

**1.43.0:** each idea is sent once, and the Bonds tab shows what’s doubled up with a Tidy button.

**1.42.0:** 141 dynamics, per-character picks, story-named dynamics, pace, recent replies counting more, Re-read the scene, and seven more meters.

**1.41.0:** a ✪ Skills tab (113 skills from The Sims 3 and 4 and beyond, levels out of 10, sent only when the scene calls for them), The world leads (no more stopping on the edge of something to hand you the choice), a Cleaner writing group with nine new fixes, 25 more turn-ons with a much wider net, AO3-style hurt/comfort, Clear everything with a way back, Bonds keeping your place, and a note about 350 tokens lighter.

**1.40.0:** combos and cravings on top of Lit, 13 optional Bonds meters with quick picks for Easterman, Jefferson, Joe, Bateman and Rick, 23 new named dynamics with their own backgrounds, and strength that shows in every feeling line.

**1.39.2:** the ♨ Desire card gets four new scales: Boldness, Tender ↔ rough, Fixation and Shame. Holding back now starts low and only comes up when it's high. Any scale can be switched off.

**1.39.1:** a ♨ Desire meter on the Bonds tab (arousal, holding back, frustration; slow burn by default, with a cap), 82 traits from The Sims 3 and 4, and a switch for how feelings show (default wording plus yours, only yours, or off).

**1.39.0:** everything reacts. Kinks are turn-ons that light up ✧ and count stronger next reply, along with 78 new turn-ons. Feelings say how they show, and you can set a character's own way. Hot buttons, wants that react, needs that follow in-world time and handle time jumps, a You tab for your character, a pattern breaker, every author rewritten by technique (15 new), and dead dove that names the dodges.

**1.38.1:** a bug sweep. The scene reader can no longer drain feelings with a broken reply, Continue keeps the board of the reply it's finishing, a name with a quote mark can't break the note, and redraws wait for your finger to lift.

**1.38.0:** the info board reads far more of what Claude writes. It understands phrases ("barely holding it together", "putty in her hands"), about 130 everyday words, American spellings and curly apostrophes, and the board's words now fill in feelings the hidden line didn't mention. Memories and board pins are switched off by default, each with its own switch.

**1.37.0:** 38 new options for dark romance, horror and grunge. They include Lamb's side of the leash (Has them on a string, Holds the emotional upper hand, Sweet-talks them) and Easterman's (Undone by their tears, Comes running when called), plus Makes demands of, Goth (masculine), Found footage and Asylum horror. Your persona's own side now counts toward Control and Pull.

**1.36.1:** ⚙ Settings → Pins in this chat → **Unpin everything** (or `/moods unpin`) clears every pin in the chat at once, for everyone in it. Values stay where they are.

**1.36.0:** swipes, regenerations and deletes now take back exactly what those replies changed (feelings, relationship, memories, needs, meters, the board summary), however many you remove, and the reply being written never sees the one it replaces. Board edits are one-time corrections instead of permanent pins. The ◆ Moods button can be hidden, made small or dragged anywhere, per device, and Moodweaver is in the ✨ wand menu and `/moods`. Old chats are updated automatically the first time you open them.

**1.35.3:** fixes the panel and the ◆ Moods button opening above the top of the screen on iPhone. **1.35.2:** the Extensions box shows the running version and, when you press Open mood panel, what happened; two installed copies are named. **1.35.1:** ◆ Moods always opens: with no chat open it says so, and if the panel ever hits an error it opens anyway and shows the error instead of doing nothing. **1.35.0:** Control and Pull replace Power, so a captive can still hold the emotional upper hand; new Gilded cage and Guarded love dynamics you can also pick yourself; a How it shows group for love that comes out as insults or gifts; new feelings, traits and tags. **1.34.1:** the relationship notes Claude reads are now plain words, one consistent story and a worked example. **1.34.0:** every reply now edits the panel. A hidden weave line moves feelings (catalogue or new), needs, relationship types, four meters (Friendship, Romance, Trust, Power) with a named dynamic, sparked turn-ons and memories. Pins hold. Old boards leave the prompt. New starry phone design, 26 new authors.

**1.33.0:** a Meters tab with Sims-style Friendship and Romance meters plus what the character thinks of your persona, driven by a hidden line in each reply: no extra request, nothing visible in chat, stripped from the prompt afterwards.

**1.32.0:** the info board now moves feelings and the relationship toward your persona (pins and your own values are respected), and a Remember row saves turning points as shared memories.

**1.31.0:** every built-in description read as the model sees it; about 175 vague ones rewritten (styles, pet play, archetypes, substances, genres, authors, relationships), the duplicate Wet merged.

**1.30.0:** maximums now stack and fuse instead of competing, Mild always tints, optional blend planning in Opus 5.5's thinking, a tighter info board, and new options: Giddy, Self-pitying, Walking on eggshells, Feral, Burned, Wet (two kinds), Takes advantage of. Desperate scales properly.

**1.29.0:** tuned for Claude Opus 5.5. Place-and-time locks (1960s America, 1890s Scotland and more) that pin dialect as well as period, 45 new relationships, clearer relationship wording and a higher reader cap for thinking models.

**1.19.0:** personality types are now labelled with whose they are, so a persona's type no longer gets read as the character's. About 70 vague prompt descriptions were rewritten in plain words, with matching panel text.

**1.17.0:** 90 new options at the requested category counts, with brief prompt descriptions and niche roles/preferences. Saved and searched categories now stay collapsed until you open them; search shows match counts without forcing groups open.

**1.16.0:** 100 new catalogue options across psychosexual patterns, kinks, roles, dark character traits and story pressure, everyday moods, individual personality traits and shared relationships. All start off and use the existing strength and knowledge rules.

**1.15.1:** fixes the mobile search field collapsing beside the Add button. Search now occupies a full-width row above the actions. Removed an older flex layout rule that overrode the intended grid.

**1.15.0:** search your saved lists as well as the catalogue; search relationship people, feelings, shared settings, memories, and persona knowledge. Selection updates preserve the visible row, focus, open categories and search. Each character, persona and cast member also has a separate **Personality** tab for an optional MBTI writing lens.
