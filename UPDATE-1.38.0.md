# Moodweaver 1.38.0: let the board drive

## Everything the info board connects to
**Reads (from the newest board, every reply):**
- **State** row → the character's feelings, on the Moods tab.
- **Physical State** row → the eight Needs bars (hunger, energy, hygiene and so on).
- **Toward** row (optional) → their relationship sliders toward you.
- **Horny** row (optional) → the Horny bar.
- **Present** → which cast members are in the scene.
- **Time and weather** → the sky at the top of the panel.
- **Every row** → the one-line summary that replaces old boards in the prompt.

**Sends:**
- The board format.
- That summary of the last board.
- Low needs.
- Your corrections and kept tiles, only if board pins are on.

**Alongside the board, the hidden line moves:**
- feelings
- needs
- relationship types
- the Friendship, Romance, Trust, Control and Pull meters
- opinions and sparked turn-ons
- memories, only if memories are on

## Reading the board's words
Before, only single words that matched an option's name or a short list of synonyms counted. Now:
- **Phrases count, and they're read first.** "Barely holding it together" is Losing control, "cold fury" is Tranquil fury, "on edge" is Jumpy, "strung out" is Strung out. On the Toward row, "putty in her hands" and "wrapped around her finger" are Wrapped around their finger, and "terrified of losing her" is Terrified of losing them.
- **About 130 everyday words and phrases were added.** For example: numb, hollow, unsettled, jittery, maudlin, self-loathing, exasperated, besotted, cocky, paranoid, unhinged, sassy, bratty, sulky, brooding, giggly, triumphant. On the Toward row: amused, besotted, indulgent, aroused, whipped, clingy.
- **One piece of the State row can name up to three feelings,** so "tender but terrified" counts both.
- **American spellings work:** spiraling, patronizing.
- **Curly apostrophes work.** "hasn’t eaten" was being missed on the Physical row.
- **An option's own name wins:** "giddy" is Giddy, not a strong Excited.
- **New needs words:** munchies, hungover, freshly shaved, needs a smoke or a fix, withdrawal.

## How strength is decided
- **The word sets the level.** "Terrified" lands around 85, "afraid" around 60, "nervous" around 35.
- **Modifiers move it.** "Very", "utterly" or "so" push it to 85 or more; "slightly", "a little" or "a bit" bring it down to 30 or less.
- **Order matters.** The first feeling on the State row gets a little extra (+10).
- **"Not", "no longer" and "isn't" cancel it.**
- **Sliders move most of the way toward the reading each reply,** rather than jumping.
- **What the board raised fades** by 15 a reply once later boards stop mentioning it.
- **Pinned ◆ sliders never move,** and the board never lowers a value you set by hand.

## Board words count alongside the hidden line (new, on)
Before, a reply with a hidden line ignored its board's State words entirely. Now the board fills in any feeling the line didn't mention. That's most of them, since the line only reports changes. Anything the line names, the line decides. It's undone exactly like everything else when you swipe. Switch: ⚙ Settings → Info board, or Needs → Board settings.

## Memories: off by default
- Claude isn't asked for turning points, and the Remember row and `remember:` field aren't sent.
- Memories saved earlier are kept but not sent. Needs → Board settings offers to delete them.
- Memories you wrote or edited yourself still go out as before.
- Switch: **Save turning points as memories**.

## Board pins: off by default
- Edit the scene, Keep, Cut, adding tiles and dragging the Needs bars are hidden, and none of them are sent.
- Anything you'd already pinned is kept, and comes back if you switch pins on again.
- Switch: **Let me pin and correct things on the board**.

The three switches apply to every chat. New test file: `tests/board-1.38.test.js`. The older suite shows the same failures as 1.28.0 and no new ones.
