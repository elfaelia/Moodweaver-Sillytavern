# Moodweaver 1.34.0 — the weave

Every reply now edits the panel. Claude ends each reply with one hidden line, and Moodweaver moves the sliders to match. There's no extra request: the line rides on the reply you're already paying for (about 330 prompt and 60 reply tokens, roughly 0.2p at Opus 5.5 prices).

## What Claude can change each turn
- **Feelings.** Any catalogue feeling by name, up or down. One that isn't on the list gets added; one lowered to nothing goes off. A word the catalogue doesn't have (say "hollowed out") becomes one of the character's own moodlets, three at most, and clears itself when it fades out unless you rename it.
- **Needs.** Hunger, energy and the rest, in words (low, critical…). The newest report wins over older board words.
- **Relationship toward you.** Relationship types by name (obsessed with, wants to protect, distrusts…). One is created if there isn't one yet.
- **Meters, opinions, sparked turn-ons and turning points** (saved as shared memories).
- **Never:** traits, turn-ons, facts, items or story settings. Those are yours.
- **Pins ◆ always hold.** Anything unpinned can move up or down. A swipe or edit replaces that reply's own changes; deleting the newest reply undoes them.

## Meters, now inside Bonds
- **Trust** and **Power** join Friendship and Romance. Power is a balance: one end is you, the other is the character.
- **A named dynamic** (Toxic obsession, Possession, Worship, Hate-love, Devoted, Captor, Nemesis, Found family…) is worked out from the four bars and sent with a one-line cue, so Claude plays the shape of the relationship.
- **Sparked turn-ons:** when you do something that hits one of his turn-ons (from Moodweaver or his card), it lights up in Bonds and glows on the Turn-ons tab.
- Opinions are short traits now, so they read "Easterman thinks Lamb is… stubborn, his". Near-duplicates merge.
- Everything the character feels about you sits in one place in the prompt.

## Cheaper prompts
- **Old boards leave the prompt.** Each is about 200 tokens of HTML and emoji. The newest is summarised in one line instead. Every message is cleaned the same way every time, so the prompt cache keeps matching. Your chat and what you see are unchanged. Switch: Settings → Info board.
- **Blend planning is off by default.** Anthropic's Opus 5.5 guide says "think first" lines in chat apps add billed thinking and slower starts without a clear quality gain. Turn it back on in Settings if you miss it.
- **Scene endings:** the closing line now names Opus 5.5's known habit (a reflective last paragraph, or a last line naming a feeling the scene already showed) instead of a general "don't recap".

## Fixes
- Meters lost recent changes during generation if you'd `/hide`n old messages. They now always count from the real chat, and a swipe leaves out the reply it replaces.
- The footer showed 1.28.0.

## Look
Rebuilt stylesheet: a starry violet night to match a starry SillyTavern theme. On phones the panel is a bottom sheet with a single scrolling tab row. Names and headings use iOS's built-in New York serif, so no fonts load. The person card no longer repeats the avatar, and the paid Scene reader is folded away.

## 26 new authors
D. H. Lawrence, Anya Seton, Georgette Heyer, Mary Stewart, Richard Condon, Victoria Holt, Len Deighton, Charles Webb, John Rechy, Thomas Pynchon, Leonard Cohen, Tim Powers, Glen Cook, Kim Newman, Robin Hobb, China Miéville, Jacqueline Carey, Michel Faber, Joe Abercrombie, Lisa Kleypas, Gail Carriger, Tarryn Fisher, CJ Roberts, Sylvia Day, Anna Zaires, Colleen Hoover. Search finds them by character (Easterman, Joe, Rick, Chloe) or by genre.

New file: `weave.js`. Install it with the rest. New tests in `tests/weave.test.js` pass; the older suite shows the same failures as 1.28.0 and no new ones.

## 1.34.1: clearer for Claude (and for you)
What Claude reads about the relationship was confusing, so it's rewritten around how Opus 5.5 works best.

- **Words, not numbers.** The meters reach Claude as one line: *where it stands now: friendship: acquaintances; romance: in love; trust: wary; power: even.* "Wary" tells the model more than "-34" does.
- **One story, not two.** The named dynamic now reads your relationship sliders as well as the meters. "Intense: obsessed with Lamb" plus "distrusts" counts as romance and low trust, giving Toxic obsession, even if the romance meter is still low. One line tells Claude that the built-up standing and the current feelings are both true where they differ, and to let that tension show.
- **Dynamics described as behaviour.** Opus 5.5 carries feeling best through small, ordinary actions, so each dynamic says what it looks like on the page: *keeps Lamb close and keeps testing Lamb's story; tenderness and suspicion arrive in the same gesture.* The cues use names, never pronouns.
- **Power can't be read backwards.** The hidden line names who gained it (*power Lamb +2*) instead of using a sign. Older lines with a bare number still work.
- **A worked example instead of a template.** The hidden-line request shows one filled-in line and a short rule per field. It no longer uses `[brackets, …]`, since Anthropic's guidance for this model family finds positive examples work better.
- **Only what changed.** Fields that didn't move are left out, and a quiet reply writes `<!-- weave: none -->`. Opus 5.5 follows instructions literally, so asking for every meter on every reply invited small invented changes. It also makes replies a little shorter.
- **`afraid off`** ends a feeling outright. Claude only sees strength words like "intense", not numbers, so it can't know how big a minus would clear one.
- **Opinions** are asked for as words that finish "Easterman thinks Lamb is…" (stubborn, his, a liar).

Inspiration checked: BetterSimTracker (human-readable state, though it uses extra extraction requests, which Moodweaver avoids) and SillyBunny's relationship tracker (only meaningful shifts count).
