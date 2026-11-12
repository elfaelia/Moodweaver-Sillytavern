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
| ☾ Heart | Moods | Over 600 feelings and moodlets, each with everyday words Claude can use to set it, the scene reader, and how fast the story moves them |
| ♥ Between | Bonds, Turn-ons, Intimacy | Relationships, meters, the named dynamic (over 250) and the desire card; what draws them in or puts them off, with combos and cravings; how they want and have sex. "Shaped by" on the Bonds card shows what's steering the dynamic and can suggest a tie it implies |
| ◔ Body | Needs, Facts | The info board and needs; then a small profile (age, height, what they're into, up to three core traits), what's true right now, who they are, and what they carry. On your own character this is **You**: outfit, condition, the moodlets showing, then your profile and facts |
| ❂ Self | Traits, Skills, Wants | Who they are (★ makes a trait core, up to three), skill levels out of 10, and wants, goals and fears (⚙ Settings › Panel can hide Wants) |
| ✦ Story | | Era, genre, tropes, stakes, writing style and authors, shared by everyone in the chat |

**Moons.** Feelings, traits and facts are set by tapping a moon: eight phases from faint to maximum, and a dark new moon for off. Tapping the moon it's already on (or the level word) clears it. No dragging.

**Facts run their course.** Being drunk, bleeding, soaked or concussed wears off by the clock on the info board (or about ten minutes a reply without one), turns into what comes after (drunk into hungover), and stirs the feelings that go with it. A time skip moves it on; undoing or swiping a reply puts it back.

**Why is this on?** A faint line under a feeling says what put it there when it wasn't you (the story raised it, a fact brought it, it's wearing off). ⚙ Settings › Panel › Show why turns it off.

**Pace.** Pick Slow burn, Steady, Quick or Volatile under Speed on the Moods card and feelings, meters and desire all move at it. Needs drain on their own clock, and skills grow at their own pace (Skills tab). Traits shift it a little per character: volatile, impulsive people swing faster, steady ones slower, brooding ones hold on longer.

**Setting something back to 0.** Tap the level word or number on a row ("Clear", "Neutral", "3/10") and it goes to 0, the middle on a two-way slider. × still takes it off the list.

The story (writing style first, then era, genre, tropes, stakes and authors) lives on its own panel, shared by everyone in the chat. With an era set, a few short period lines say how the time shapes what's in play (power, marriage, dating, medicine, vices, faith, the law, being found out, and more for 1950s–60s America, including how the same trait reads on a man and on a woman: a woman taking charge, a man giving way, a woman drinking, a man crying). When more apply than fit, they take turns from reply to reply; **Period lines per reply** on that panel sets how many.

Strength is a word, not a number: faint, subtle, mild, clear, strong, intense, overwhelming, maximum. Only what's switched on is sent.

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
