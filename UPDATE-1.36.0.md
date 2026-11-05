# Moodweaver 1.36.0: swipes that really swipe

## What was wrong
- **A swipe could be written with the reply it was replacing.** SillyTavern keeps the old swipe's text in the chat until the new one starts streaming. Moodweaver redrew its note from that old text a moment later, and that redraw replaced the note built for the swipe. So "where the last board left things" could describe the reply you'd just thrown away.
- **Regenerate had the same problem.** The deleted reply's feelings, needs and memory were taken back only after the new reply had been written.
- **Deleting more than one reply only undid the newest.** Memories from deleted replies were never removed.
- **Everything was kept by message number.** Deleting an older message shifted the numbers, so meters could count a reply twice and the newest reply's feelings could be undone by mistake.
- **Board edits were pinned forever.** "Edit the scene" sent your edits as permanent facts, through every later swipe and delete, so an outfit or activity could stay frozen.
- **The note told Opus 5.5 to trust it over the chat.** That's right for feelings, but a stale board summary then beat what had actually happened.

## What happens now
- **Each reply's changes are kept by the reply itself** (its send time plus its hidden line), not by its position.
- **When replies go from the end of the chat, their changes come back off,** newest first, however many there are. That covers swipes, regenerations, deletes and edits to the hidden line.
- **Swiping back to an earlier swipe brings its changes back.**
- **Deleting an older message to save space undoes nothing.**
- **Hiding a message with /hide is not taking it back.**
- **Anything you moved by hand stays yours.** Pinned sliders never move.
- **Right before every reply, Moodweaver brings the chat up to date first.** A swipe that's still being written counts as gone.
- **While a reply is being prepared, its note can't be replaced.** Any other redraw waits until the reply is done.
- **Needs and meters are read from the chat every time, not stored.** Meters now fill and drain like a real Sims bar: a full meter drops straight away instead of burning off banked points. A meter you drag keeps its value if you then swipe the reply you set it on.
- **A continued reply keeps both of its hidden lines.**
- **Board edits are corrections now (✎).** The next reply is told to use your correction and carry it forward, and its swipes get it too. Once a later board arrives, the story can change that detail again.
- **The summary of the last board now tells Claude** it's a record of the previous reply, and that the chat is right wherever they differ. The correction line says to use it now and let the story move it after.

## Your old chats
The first time you open a chat from an earlier version, Moodweaver updates it once and says so on the Needs tab:
- **The newest replies are recorded as already applied,** so nothing is applied twice.
- **The newest reply's exact changes are kept** where the old record still matches it, so swiping it right after updating undoes it properly.
- **Board memories whose reply isn't in the chat any more are removed.** These were left behind by swipes and deletes. Memories you've edited or re-rated stay.
- **Stored needs from swiped or deleted replies are dropped.** Needs are read from the chat now.
- **Meters keep exactly the value they show,** and are tied to the replies from here on.
- **Old board pins become one-time corrections** for your next reply. Tap ✎ on the Needs tab to drop one now.

Slider values themselves stay where they are. Older versions didn't keep enough to tell which past changes came from swiped replies, so those can't be rewound.

## The ◆ Moods button
- **Drag it anywhere.** It remembers the spot on this device.
- **Hide it, or make it just a small ◆,** from ⚙ Settings → ◆ Moods button, or from the Moodweaver box in Extensions.
- **With it hidden, you can still open Moodweaver** from the ✨ wand menu next to the message box, with `/moods`, or with Open mood panel in Extensions.
- **`/moods button on`, `off`, `small`, `big` or `reset` changes the button by command.**

## Other fixes
- If the tokenizer couldn't be reached, the whole mood note was left out of that reply. The count is only a report, so it now falls back to an estimate.
- Dragging a meter far from where its replies had taken it could snap it to a different value after saving.
- Meters slowly drifted once a chat had more than 120 replies.
- Deleting a swipe and choosing a different greeting now update the panel.
- "Despair" on the board pointed to a feeling that doesn't exist; it now means Despairing, and so does "hopeless".
- A redraw from the chat while you were typing in the panel wiped what you'd typed. It now waits until you leave the field.
- Tapping a chip for a slider that wasn't on screen could throw an error.

New file: `ledger.js`. Install it with the rest. New tests in `tests/swipes.test.js` pass; the older suite shows the same failures as 1.28.0 and no new ones.

## 1.36.1: unpin everything
- **⚙ Settings → Pins in this chat** shows what's pinned right now. **Unpin everything** clears all of it after one confirm. `/moods unpin` does the same.
- **It covers everyone in this chat:** the character, your persona, the cast and the story.
- **It clears every kind of pin:** ◆ slider pins, meter pins on Bonds, needs you set, ✎ board corrections and ◆ kept board tiles.
- **Sliders and meters keep their values and can move again.** Needs you set and board corrections go back to following the board.
- **Saved defaults for new chats aren't changed.**
