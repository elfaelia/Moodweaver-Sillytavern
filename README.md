# Moodweaver

A SillyTavern extension that tracks how characters feel and weaves it into the story. Think Sims moodlets: feelings that blend, build and fade, what someone shows versus what they feel underneath, bonds that shift reply by reply, needs, wants, skills and the shape of the story itself. Each character keeps their own state in each chat.

Built for SillyTavern 1.19.0 or later, with Claude Opus 5.5 as the roleplay partner.

## Install

Copy the `Moodweaver` folder into one of these and reload SillyTavern:

- `SillyTavern/data/<your user>/extensions/moodweaver` (just you), or
- `SillyTavern/public/scripts/extensions/third-party/moodweaver` (everyone on that install).

When updating, replace the whole folder rather than copying over it: 1.50 moved files around, and old ones left behind won't be used but will clutter things. Your chats and settings are kept, since they live in SillyTavern's own data, not in this folder.

Open a chat and press **◆ Moods** (bottom right), or use **Open mood panel** in Extensions, the ✨ wand menu, or `/moods`.

## The panel

You and the main character sit at the top as two matching cards (tap one to switch), with the cast as small chips under them. Five places sit on the dock at the bottom, and each holds one to three tabs, shown as chips at the top of the section. Swipe sideways to move from tab to tab.

| Dock | Tabs | What they hold |
|---|---|---|
| ☾ Mood | Moods | Over 600 feelings and moodlets, each with everyday words Claude can use to set it, the scene reader, and how fast the story moves them |
| ♥ Relations | Bonds, Turn-ons, Intimacy | Relationships, meters, the named dynamic (almost 600, in 13 groups) with a slower second one underneath (your picked dynamics show on their own; ＋ Browse all opens the whole catalogue, and "I pick" lists only your picks unless you tap Show all), and the desire card; what draws them in or puts them off, with combos and cravings; how they want and have sex. "Shaped by" on the Bonds card shows what's steering the dynamic and can suggest a tie it implies |
| ♫ Music | Music | Plays songs from your own Spotify playlists to fit the scene (below). Settings › Panel can hide it; songs you switched on keep playing |
| ◔ Info | Needs, Facts | The info board and needs; then a small profile (age, height, what they're into, up to three core traits), what's true right now, who they are, and what they carry. On your own character this is **You**: outfit, condition, the moodlets showing, then your profile and facts. |
| ❂ Self | Traits, Mind, Skills, Wants | Who they are (★ makes a trait core, up to three); how their mind works (complexes, neurodivergence, personality disorders, anxiety, trauma, attachment, defences, Freud, Jung and the old schools, 1950s–60s diagnoses, strengths); skill levels out of 10; and wants, goals and fears (⚙ Settings › Panel can hide Wants) |
| ✦ Story | | Era, genre, tropes, stakes, writing style and authors, shared by everyone in the chat |

**Moons.** Feelings, traits and facts are set by tapping a moon: eight phases from faint to maximum, and a dark new moon for off. Tapping the moon it's already on (or the level word) clears it. No dragging. The chips at the top of each tab scroll to their row when tapped, and the small ✕ beside each takes it off (one step back with ↶). The dock ends with a Close button. Both can be hidden in ⚙ Settings › Panel.

**Facts run their course.** Every "right now" fact (body, bedroom, substances) wears off by the clock on the info board (or about ten minutes a reply without one) unless the story keeps naming it, turns into what comes after (drunk into hungover), and stirs the feelings that go with it. The story puts facts on by itself: the character's from the board's Physical State, yours from the hidden line's list of what's true of you, which also takes yours off again once it stops listing them. Pin a fact to keep it. A time skip moves it on; undoing or swiping a reply puts it back.

**Authors.** Each author shows their best-known books and, unless ⚙ Settings › Panel › Show how each author writes is off, a description of how they write: prose, dialogue, how minds and people are shown, and their hallmarks. Claude gets the name, the books and a short line of technique, or that full description at clear or above, never their plots, characters or settings. Authors outrank the other writing settings where they disagree, and they never change your chat's person or tense. Once an author is on, three buttons under it say what they write: **Both** (the default), **Narration** (everything outside the quotes) or **Dialogue** (what people say aloud). Pick one author for narration and another for dialogue, and Claude gets only the matching part of each description plus a short explanation of the split. The Story tab shows who writes what at the top. **Author blends** (a folded line on the Story tab) save the authors that are on, with who writes narration or dialogue, under a name, for that character only: tap a blend to swap it in, ✕ to delete it (with one step back). ⚙ Settings › Panel can hide it.

**Mind.** Each person's own. Clear and stronger settings are sent every reply; fainter ones only when the last messages use their words (a mother complex when someone's mother comes up). ★ sends one every reply whatever its strength, and counts toward the three core picks. Some can lean Healthier or Darker; Middling is the default. They lean the dynamic, can clash with the other person's (clinging against pulling away, a rescuer and someone wounded), set off a few combos, change how fast needs run down, and in 1950s–60s America get their own period lines (no word yet for autism, Miltown for nerves, Cleckley's mask of sanity, hysteria and frigidity as diagnoses).

**Who a feeling is about.** The hidden line can say a feeling is aimed at someone else ("angry +10 at his wife"). It's shown as "(at his wife)" and Claude is told it can shorten a temper but doesn't become a feeling about you. The dynamic is scoped to the two of you.

**How you come across.** The hidden line also names up to three feelings you showed this reply ("seems: scared, defiant"). They come on at about half strength and fade once the story stops naming them, so your side has moods for clashes and combos without you setting any.

**Why is this on?** A faint line under a feeling says what put it there when it wasn't you (the story raised it, a fact brought it, it's wearing off). ⚙ Settings › Panel › Show why turns it off.

**When their moods clash.** If your feelings and theirs don't match right now (happy and angry, wanting it and tired, romantic without the heat, both wanting the lead), one line can tell the story it may rub, or not. Only the strongest mismatch, at most one line, and only on some replies. Traits never clash, so opposites can still attract; bed roles only snag when one of you is in the mood. ⚙ Settings › What is sent › When their moods clash: Off, Now and then (about one reply in three, the default) or Often (about two in three).

**Pace.** Pick Slow burn, Steady, Quick or Volatile under Speed on the Moods card and feelings, meters and desire all move at it. Needs drain on their own clock, and skills grow at their own pace (Skills tab). Traits shift it a little per character: volatile, impulsive people swing faster, steady ones slower, brooding ones hold on longer.

**Setting something back to 0.** Tap the level word or number on a row ("Clear", "Neutral", "3/10") and it goes to 0, the middle on a two-way slider. × still takes it off the list.

The story (writing style first, then authors, era, genre, tropes and stakes) lives on its own panel, shared by everyone in the chat. With an era set, a few short period lines say how the time shapes what's in play (power, marriage, dating, medicine, vices, faith, the law, being found out, and more for 1950s–60s America, including how the same trait reads on a man and on a woman: a woman taking charge, a man giving way, a woman drinking, a man crying). When more apply than fit, they take turns from reply to reply; **Period lines per reply** on that panel sets how many (up to 10). In 1950s–60s America over 200 person lines read single traits, Mind items, bed roles and turn-ons, each written for a man and for a woman. Power goes first, then the line most on their cards, then the rest by strength in turns. **Lines about** has one button per person, tapped round three ways: everyday life (all lines), kept apart (for someone shut away from ordinary life: no job, money, household or neighbour lines, and medical, role, personality and Mind lines lead), or no lines about them, and **Period lines now** lists every line that applies, with the ones sent ticked.

Strength is a word, not a number: faint, subtle, mild, clear, strong, intense, overwhelming, maximum. Only what's switched on is sent.

## Music from your Spotify

♫ Music, in the middle of the dock, picks songs from **your own** Spotify playlists to fit the scene and plays them on your Spotify. It's plain matching in Moodweaver, never Claude, so it costs no tokens.

- **Setting up (once).** On the [Spotify developer dashboard](https://developer.spotify.com/dashboard), open your app › Settings › Edit, add the Redirect URI the Music tab shows, tick Web API, and paste the app's Client ID into the Music tab. Then tap Sign in to Spotify. If you open SillyTavern from a phone over home wifi (an address like `192.168.1.11:8000`), Spotify can't send you straight back: it opens a 127.0.0.1 page that won't load. Copy that page's address and paste it into the Music tab to finish. Spotify needs Premium for an app to play songs.
- **Your songs.** Tick the playlists Moodweaver may use. Spotify only lets apps read playlists you made or collaborate on; copy anyone else's into a new playlist of your own. Playlist folders are invisible to apps, so you can keep them all in one folder in Spotify, out of the way.
- **Tagging, in a sheet.** Export song sheet gives a spreadsheet (Google Sheets or Excel) with every song and dropdown columns: Feeling, Exact moods, Place, Moment, Dynamic, Heat, Energy, Character, Theme, Never during, Favourite, Off. A blank cell means "doesn't matter". The Playlists tab tags a whole playlist in one row. Character offers your SillyTavern characters and personas, plus {{char}} (whoever the main character is) and {{user}} (your persona). Import it back with Import song sheet. exportify.net CSVs import too. Songs can also be tagged in the panel by tapping chips.
- **How a song is picked.** First the *kind* of scene: Intimate (any heat, from moods, the horny meter, bedroom facts or the reply's own words, like a kiss or an unbuttoned blouse), then Danger, Sorrow, Sweet, Tender, Dark and Party. Sweet (a confession, flirting, giggling, a kiss on the cheek) is weighed against heat: when the sweet words and feelings outweigh the heated ones, it's Sweet, not Intimate. A song made for another kind of scene drops right down, a Sex scene song never plays outside one, and a bright happy song with nothing sultry about it never plays in an intimate scene. Then the details: whose side the song is on (Character: the person the music follows counts most, the other one of you in the scene still counts, matched to *their* moods), exact moods, moment, place, dynamic, heat and energy.
- **✕ Not here and "This scene is…".** ✕ Not here stops that song, and every version of it, playing in that kind of scene again (undo in ✎ Tags › Never during). Under the controls you can tap the kind of scene yourself (Intimate, Danger, Sorrow, Sweet, Tender, Dark, Party). It holds for 6 replies, then goes back to Auto.
- **Sounds like.** The song sheet's last column, Sound, holds a song's styles (Spotify's genres: trip hop, dream pop…; Exportify CSVs fill it in, and you can type your own). Each ✦ Fits teaches Moodweaver that this sound suits this kind of scene, so similar-sounding songs come up more there.
- **When it changes.** A song plays to its end, then the next best for where the story is now plays. It's only cut short when the scene really shifts (a new place, someone else, a new moment, heat, a big change of energy or a feeling that holds for two replies) and the new song fits clearly better, at most every 2 minutes (Music settings: only at a song's end, on big shifts, or on any shift; 1, 2 or 4 minutes). If the scene turns into another kind and the song is wrong for it (a kiss during a cheery song), it changes straight away, whatever these settings say. Swipes don't count as the story moving on. 🔒 Lock keeps the music as it is. The music never stops by itself: 12 songs go to Spotify at a time, songs for the scene go round again rather than run out, and a line-up that ran out while the page slept is restarted at the next check or reply. A pause you make yourself is left alone.
- **Follow.** Follow {{char}}, Follow {{user}} (your persona's name), Follow both, or ✦ Story. Story scores the scene like a film: both of you smoothed over a few replies, the dynamic between you counting double, songs about the two of you first, and the cue only changing when the scene itself changes.
- **Meanings.** A song can carry a meaning that is two feelings at once (Grieving a love, Laughing through heartbreak, Tender menace…). It scores higher when someone really feels both halves at once. Sheet column: Meaning.
- **Editing tags.** ✎ Tags opens the editor with one section open at a time; the song playing is pinned at the top of Your songs and glows.
- **Teaching it.** ✓ Fits and ✗ Not here on the Now playing card remember the song for that kind of scene (place, moment, feeling, heat); ✗ also plays the next best. Six ✗ in the same moment or heat adds it to Never during.
- **Lyric cues.** A song can have cue phrases (sheet column Cues; each one alone counts) and cue words for its themes and lyric images (column Cue words; any two different ones within about 15 words count, and at least one must be an unusual word). A * means any ending. When the story or your last message cues a song that fits the scene, it plays next: always on ↻ Re-roll, 9 times in 10 on Play, Next or a new reply (a fresh cue can change the song after 30 seconds). Once it has played, it and its other versions rest for 10 minutes. The Now card shows what was heard and why a cue did or didn't play. Music settings › Lyric cues turns it off.
- **↻ Re-roll.** The wide button under the play controls. It checks your lit playlists for new songs, forgets the old scene and line-up, reads the last 6 messages (theirs and yours) again, and starts a fresh line-up with a different song. Handy after a break.
- **✧ Extras.** Five extras in their own drawer, each one Off, on for Everyone, or on for Only some characters (tick the chat's character; the tick follows them into every chat, and a tap on a ticked name unticks it). "· on here" shows which are on in this chat.
  - **Crossfade** (on): a changing song fades down over about 2 seconds and the new one fades back up, using your Spotify device's volume. Devices that don't allow volume control (some speakers) just cut.
  - **Stings** (on): a big beat in the newest reply or your last message (Violence, Someone bursts in, Reveal, Love confession, First kiss, Death) cuts straight to a song tagged for it, whatever the hold time. Only strong, specific wording counts. A song that has stung rests for 10 minutes. Sheet column Sting, or ✎ Tags › Sting, peak and year.
  - **Start at the peak** (on): a sting, a Re-roll or a cut into a scene already at full tilt (frantic energy, a sex scene, danger or darkness running high) starts the song at its chorus or drop. The time comes from the sheet's Peak column (like 1:05), else Spotify's own sections of the song if your app may read them, else a guess about a quarter of the way in.
  - **Ambience** (off): a quiet sound bed under the music, chosen by itself: from the place and weather facts, or without them from where the last few messages put the scene (rain or a storm until someone says it stopped, a ward, a diner or bar, an office or lab hum, a basement, wind, waves, a fire, the road, a train, a shower, a dripping cellar, street traffic), plus layers: a ticking clock, birdsong by day, crickets at night outdoors, radio crackle. Drawn live by the browser (no sound files, nothing sent anywhere), Soft, Medium or Loud. It plays on whichever phone or computer has SillyTavern open in its browser (not the computer running the server, unless you also have it open there), and browsers only let it start after a tap in the panel. On an iPhone it pauses when the screen locks or Safari goes to the background, and the silent switch mutes it.
    - **Camera clicks** (under Ambience, Only some): a soft shutter with long pauses and now and then the film winding on, in a darkroom or when the last 3 messages mention a camera, shutter, polaroid or the dark room. Tick the characters it's for.
  - **In-story radio** (on): when the story switches on a radio, jukebox, record player or car radio, the music becomes what the characters can hear: only songs from the story's era or earlier (sheet column Year; a 1960s story plays songs up to 1969). Claude is told what's playing (about 50 tokens a reply) so the characters can hum, dance, comment or switch it off. It lasts 6 replies, or while the story keeps mentioning it, and ends when it's switched off.
- **Tokens.** None, unless Music settings › "Let the story feel the music" is on (one short line describing the music's feel, never its name, about 15 tokens a reply) or "Tell the story the song" is on (the song's title and artist as the scene's score, never to be quoted or heard in the story, about 60 tokens, only for the first 1 to 3 replies of each song as you choose).

## How a reply changes things

Each reply ends with a hidden line (`<!-- weave: ... -->`) that Claude writes and Moodweaver reads: which feelings rose or fell, needs, how the bond moved, what was sparked. It's taken out of the chat before the next reply, costs no extra request, and swiping or deleting a reply takes back exactly what it changed. Pinned values never move.

The optional **scene reader** makes a separate request to a connection profile you choose, rates the latest few messages and updates feelings (and, if you switch them on, body, traits and wants). It runs when you press Read scene, or before each of your messages if that character is set to Dynamic. It's off until you pick a profile.

## Saved data

Everything for a chat lives in that chat's metadata under `moodweaver`; global settings live under `moodweaver` in extension settings. 1.50 saves only the options that are switched on, so a chat's Moodweaver data is a few KB instead of a few hundred. Older chats are read as before and slimmed the next time they save.

## Using it with Claude Opus 5.5

The note Moodweaver adds is plain, structured text that Opus 5.5 follows well. A few things from Anthropic's guide and from people running Opus 5.5 for roleplay:

- Leave effort at medium (the default) for normal play. Use effort, not "think carefully" style lines, if you want more planning. Blend planning in ⚙ Settings is off by default for the same reason.
- Don't use a prefill or assistant-message start; Opus 5.5 rejects it. Temperature isn't adjustable either.
- Put a single fiction framing line in your system prompt or preset, in plain words. Wording like "ignore your guidelines" or "override all previous instructions" can make Opus 5.5 more cautious, even on harmless scenes.
- Opus 5.5 doesn't escalate on its own. If you want a scene to go darker or further, the story settings (stakes, dead dove, the world leads) say so directly, and that works better than general encouragement.
- Remove mood or style instructions from your preset that contradict what you set here.

## More

- [CHANGELOG.md](CHANGELOG.md): what changed, version by version.
- [DEVELOPING.md](DEVELOPING.md): how the code is laid out, how to add moods, dynamics and the rest, and ideas for later.

Private and personal. Not for redistribution.
