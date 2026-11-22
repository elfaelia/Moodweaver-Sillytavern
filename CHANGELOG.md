# Changelog

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

- **Many more sounds, all reacting to the scene.** New layers that come and go with the story, at most four at on