# Changelog

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
