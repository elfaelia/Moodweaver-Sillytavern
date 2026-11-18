# Changelog

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
