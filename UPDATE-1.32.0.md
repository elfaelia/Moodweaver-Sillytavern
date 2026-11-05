# Moodweaver 1.32.0 — the board drives the sliders

The info board already arrives at the top of every reply, so Moodweaver now reads it as a free scene reader. There's no extra request and no Dynamic mode needed. Switches for all of this are on the Needs tab, per chat, all on by default.

## Board updates feelings
- Words on the **State** row move the character's matching feelings. "terrified" lands higher than "afraid", "very" and "slightly" shift it, and the first word listed counts most.
- **Pinned sliders are never touched.** Values you set yourself are never lowered by the board; it can only raise them.
- What the board added fades again when later boards stop mentioning it.
- A swipe or edit just re-reads the new board; repeated swipes don't stack.

## Toward row → relationship
- New board row: **💞 Toward [you]:** 2–4 words for how the character feels about your persona right now.
- Those words feed that character's relationship toward you (obsessed, wary, fond, protective and so on), with the same rules as above. If there's no relationship toward you yet, one is made.

## Remember row → shared memories
- New board row: **📌 Remember:** usually "none". Filled in only for turning points: a confession, a promise, a betrayal, a first time, a secret learned.
- Each one is saved to the pair's existing **What they remember** list (marked 📌) and sent in every prompt after. Big moments survive after they fall out of a small context window.
- A swipe replaces that reply's memory instead of adding another. Only the newest 8 board memories are kept automatically; edit one or move its slider and it's yours to keep for good.

## Cost
- The two new rows add about 70 tokens to the prompt and roughly 20 output tokens per reply.
- Turning a row off removes it from the board and the prompt.

Tests show the same failures as 1.28.0 and no new ones.
