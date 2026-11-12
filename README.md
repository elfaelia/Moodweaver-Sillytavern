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

| Tab | What it holds |
|---|---|
| ✦ Moods | Over 600 feelings and moodlets, each with everyday words Claude can use to set it, the scene reader, and how fast the story moves them |
| ◔ Needs | The info board, needs (hunger, energy and the rest) and physical state |
| ♥ Bonds | Relationships, meters (friendship, romance, trust, control, pull and more), the named dynamic (over 250) and the desire card. Feelings in each reply push the meters, so the dynamic follows the mood |
| ❂ Traits | Who they are: temperament, manner, morals, mind, archetype, personality type |
| ⚘ Intimacy | How they want and have sex: roles in bed, sexual temperament, what draws them, and the psychosexual side |
| ⇋ Turn-ons | What draws them in or puts them off, with combos and cravings |
| ✪ Skills | Levels out of 10, sent only when the scene calls for them |
| ⌂ Facts | Looks, background, job, status |
| ☆ Wants | Wants, goals and fears |
| ◐ You | On your own character, Needs becomes You: outfit, condition and the moodlets showing. The Moods, Traits and Intimacy tabs there also set what the character knows about you |

**Pace.** Pick Slow burn, Steady, Quick or Volatile on the Bonds tab and feelings, meters and desire all move at it. To give the Moods card and the Desire card their own pace, switch off **One pace for the whole scene** in ⚙ Settings › Pace. Needs drain on their own clock.

The story (era, genre, tropes, stakes, authors and writing style) lives on its own panel, shared by everyone in the chat. With an era set, a few short period lines say how the time shapes what's in play (power, medicine, vices, faith, the law, being found out). When more apply than fit, they take turns from reply to reply; **Period lines per reply** on that panel sets how many.

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
