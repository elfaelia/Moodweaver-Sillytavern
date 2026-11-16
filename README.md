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
| ♥ Relations | Bonds, Turn-ons, Intimacy | Relationships, meters, the named dynamic (over 460, in 13 groups) with a slower second one underneath, and the desire card; what draws them in or puts them off, with combos and cravings; how they want and have sex. "Shaped by" on the Bonds card shows what's steering the dynamic and can suggest a tie it implies |
| ◔ Info | Needs, Facts, Music | The info board and needs; then a small profile (age, height, what they're into, up to three core traits), what's true right now, who they are, and what they carry. On your own character this is **You**: outfit, condition, the moodlets showing, then your profile and facts. **♫ Music** plays songs from your own Spotify playlists to fit the scene (below) |
| ❂ Self | Traits, Mind, Skills, Wants | Who they are (★ makes a trait core, up to three); how their mind works (complexes, neurodivergence, personality disorders, anxiety, trauma, attachment, defences, Freud, Jung and the old schools, 1950s–60s diagnoses, strengths); skill levels out of 10; and wants, goals and fears (⚙ Settings › Panel can hide Wants) |
| ✦ Story | | Era, genre, tropes, stakes, writing style and authors, shared by everyone in the chat |

**Moons.** Feelings, traits and facts are set by tapping a moon: eight phases from faint to maximum, and a dark new moon for off. Tapping the moon it's already on (or the level word) clears it. No dragging.

**Facts run their course.** Every "right now" fact (body, bedroom, substances) wears off by the clock on the info board (or about ten minutes a reply without one) unless the story keeps naming it, turns into what comes after (drunk into hungover), and stirs the feelings that go with it. The story puts facts on by itself: the character's from the board's Physical State, yours from the hidden line's list of what's true of you, which also takes yours off again once it stops listing them. Pin a fact to keep it. A time skip moves it on; undoing or swiping a reply puts it back.

**Authors.** Each author shows their best-known books and, unless ⚙ Settings › Panel › Show how each author writes is off, a description of how they write: prose, dialogue, how minds and people are shown, and their hallmarks. Claude gets the name, the books and a short line of technique, or that full description at clear or above, never their plots, characters or settings. Authors outrank the other writing settings where they disagree, and they never change your chat's person or tense.

**Mind.** Each person's own. Clear and stronger settings are sent every reply; fainter ones only when the last messages use their words (a mother complex when someone's mother comes up). ★ sends one every reply whatever its strength, and counts toward the three core picks. Some can lean Healthier or Darker; Middling is the default. They lean the dynamic, can clash with the other person's (clinging against pulling away, a rescuer and someone wounded), set off a few combos, change how fast needs run down, and in 1950s–60s America get their own period lines (no word yet for autism, Miltown for nerves, Cleckley's mask of sanity, hysteria and frigidity as diagnoses).

**Who a feeling is about.** The hidden line can say a feeling is aimed at someone else ("angry +10 at his wife"). It's shown as "(at his wife)" and Claude is told it can shorten a temper but doesn't become a feeling about you. The dynamic is scoped to the two of you.

**How you come across.** The hidden line also names up to three feelings you showed this reply ("seems: scared, defiant"). They come on at about half strength and fade once the story stops naming them, so your side has moods for clashes and combos without you setting any.

**Why is this on?** A faint line under a feeling says what put it there when it wasn't you (the story raised it, a fact brought it, it's wearing off). ⚙ Settings › Panel › Show why turns it off.

**When their moods clash.** If your feelings and theirs don't match right now (happy and angry, wanting it and tired, romantic without the heat, both wanting the lead), one line can tell the story it may rub, or not. Only the strongest mismatch, at most one line, and only on some replies. Traits never clash, so opposites can still attract; bed roles only snag when one of you is in the mood. ⚙ Settings › What is sent › When their moods clash: Off, Now and then (about one reply in three, the default) or Often (about two in three).

**Pace.** Pick Slow burn, Steady, Quick or Volatile under Speed on the Moods card and feelings, meters and desire all move at it. Needs drain on their own clock, and skills grow at their own pace (Skills tab). Traits shift it a little per character: volatile, impulsive people swing faster, steady ones slower, brooding ones hold on longer.

**Setting something back to 0.** Tap the level word or number on a row ("Clear", "Neutral", "3/10") and it goes to 0, the middle on a two-way slider. × still takes it off the list.

The story (writing style first, then authors, era, genre, tropes and stakes) lives on its own panel, shared by everyone in the chat. With an era set, a few short period lines say how the time shapes what's in play (power, marriage, dating, medicine, vices, faith, the law, being found out, and more for 1950s–60s America, including how the same trait reads on a man and on a woman: a woman taking charge, a man giving way, a woman drinking, a man crying). When more apply than fit, they take turns from reply to reply; **Period lines per reply** on that panel sets how many.

Strength is a word, not a number: faint, subtle, mild, clear, strong, intense, overwhelming, maximum. Only what's switched on is sent.

## Music from your Spotify

Info › ♫ Music picks songs from **your own** Spotify playlists to fit the scene and plays them on your Spotify. It's plain matching in Moodweaver, never Claude, so it costs no tokens.

- **Setting up (once).** On the [Spotify developer dashboard](https://developer.spotify.com/dashboard), open your app › Settings › Edit, add the Redirect URI the Music tab shows, tick Web API, and paste the app's Client ID into the Music tab. Then tap Sign in to Spotify. If you open SillyTavern from a phone over home wifi (an address like `192.168.1.11:8000`), Spotify can't send you straight back: it opens a 127.0.0.1 page that won't load. Copy that page's address and paste it into the Music tab to finish. Spotify needs Premium for an app to play songs.
- **Your songs.** Tick the playlists Moodweaver may use. Spotify only lets apps read playlists you made or collaborate on; copy anyone else's into a new playlist of your own. Playlist folders are invisible to apps, so you can keep them all in one folder in Spotify, out of the way.
- **Tagging, in a sheet.** Export song sheet gives a spreadsheet (Google Sheets or Excel) with every song and dropdown columns: Feeling, Exact moods, Place, Moment, Dynamic, Heat, Energy, Character, Theme, Never during, Favourite, Off. A blank cell means "doesn't matter". The Playlists tab tags a whole playlist in one row. Character offers your SillyTavern characters and personas, plus {{char}} (whoever the main character is) and {{user}} (your persona). Import it back with Import song sheet. exportify.net CSVs import too. Songs can also be tagged in the panel by tapping chips.
- **How a song is picked.** After each reply, every song gets points for what it shares with the scene: who it's about, exact moods, feeling, place, moment (Being hunted, Captivity, Sleep, Confession…), dynamic, heat and energy. A song for someone else, a sex-scene song outside one, or one played recently loses points; Never during and Off rule it out. One of the best is picked, and the next best queue up behind it on Spotify.
- **When it changes.** A song plays to its end, then the next best for where the story is now plays. It's only cut short when the scene really shifts (a new place, someone else, a new moment, heat, a big change of energy or a feeling that holds for two replies) and the new song fits clearly better, at most every 2 minutes (Music settings: only at a song's end, on big shifts, or on any shift; 1, 2 or 4 minutes). Swipes don't count as the story moving on. 🔒 Lock keeps the music as it is.
- **Follow.** Follow {{char}}, Follow {{user}} (your persona's name) or Follow both: whose moods and whose songs lead.
- **Teaching it.** ✓ Fits and ✗ Not here on the Now playing card remember the song for that kind of scene (place, moment, feeling, heat); ✗ also plays the next best. Six ✗ in the same moment or heat adds it to Never during.
- **Tokens.** None, unless Music settings › "Let the story feel the music" is on: one short line describing the music's feel (never its name), about 15 tokens a reply.

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
