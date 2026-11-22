# Changelog

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
- **Your turn-ons are sent only when they fit the moment, to save tokens.** Each one (known, suspected or unknown to him) goes in the note when the scene is intimate, when the last messages touch it (its name or its words), when the other person shows it, and your two strongest one reply in six as a reminder. The rest wait without being forgotten. ⚙ Settings › What is sent › "Send your turn-ons only when they fit the moment" (on). Off sends them all every reply, as 