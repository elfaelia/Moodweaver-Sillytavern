# Moodweaver 1.33.0 — Meters

A new **Meters** tab (♥, next to Needs) gives each main character Sims-style bond meters with your persona. There's no extra request, and nothing new shows in chat.

## What you get
- **Friendship** and **Romance** meters, from -100 to 100, with levels:
  - Friendship: Enemies, Disliked, Acquaintances, Friends, Good friends, Best friends.
  - Romance: Repulsed, Turned off, No spark, A spark, Sweethearts, In love, Soulmates.
- **"[Character] thinks [you] are…"** opinion chips that grow stronger when they come up again and fade when they don't. Remove any with ×, or add your own.
- **Recent changes**: the last few moves, by message.
- Drag a meter to set it, or pin it (◆) to hold it there.
- New meters start from the relationship sliders you've already set toward your persona, so an existing romance doesn't open at "no spark".

## How it works without a call
- Each reply ends with one hidden line: `<!-- bond: friendship +1 | romance +2 | feels: … | thinks: … -->`.
- SillyTavern hides HTML comments in chat by default, so you don't see it.
- Moodweaver reads it, then strips old ones from everything sent to the model, so they never pile up in your context. Your saved chat keeps them, which is how swipes, edits and deletions recalculate correctly.
- The meters and opinions are sent back in Moodweaver's note, so they shape how the character treats you.
- **feels** also feeds the character's relationship sliders toward you, so the visible **Toward** board row from 1.32.0 is now off by default. You can switch it back on from the Needs tab.

## Cost
About 110 prompt tokens and roughly 25 output tokens per reply. Switch it off per chat at the top of the Meters tab, and then nothing is sent.

If you turned on "Show <tags> in responses" in SillyTavern's settings, the hidden line will show. That setting is off by default.

Tests show the same failures as 1.28.0 and no new ones.
