# Developing Moodweaver

How the code is laid out, where to add things, and ideas parked for later.

## The map

```
index.js            Start-up: connects to SillyTavern and hooks every reply
manifest.json       What SillyTavern reads to load the extension
style.css           The panel's look

data/               The catalogue: every option and its wording, no logic
  catalogue.js        Puts the section files together and answers "what is this id?"
  catalogue/
    mood.js           Moodlets: feelings the scene can move
    trait.js          Traits: who someone is
    intimacy.js       Intimacy: roles in bed, sexual temperament, what draws them, psychosexual
    state.js          Body, looks and condition
    story.js          Genre, tone, stakes, era, authors, writing style
    relationships.js  Feelings toward one person, and both-ways ones
    turns.js          Turn-ons and turn-offs, in groups and sub-groups
    skills.js         Skills
    dynamics.js       Named dynamics and the meter tests that pick them
    scaled.js         Wording that changes with strength
    merged.js         Old ids folded into new ones, so saved values follow
    recipes.js        Starter blends

engine/             The rules. No SillyTavern and no panel here, so it runs in plain Node too
  prompt.js           Builds the note sent to Claude
  state.js            One person's saved state: fresh, cleaned, upgraded from older versions
  strength.js         The strength words (faint … maximum)
  weave.js            The hidden line each reply ends with
  board.js            The info board at the top of each reply
  bond.js             Bond meters, dynamics and the desire card
  ledger.js           What each reply changed, so swipes and deletes take it back
  reader.js           The scene reader's request and how its answer is checked
  …                   One file per idea (skills, cast, era-lenses, locale, moodpace, overlap, patterns…)

app/                Talking to SillyTavern
  chat.js             This chat's data: who's here and each person's state
  replies.js          Reading replies as they arrive, swipes and deletes
  note.js             Sending the note before each reply
  reader.js           Running the scene reader
  settings.js         Global settings and their upgrades
  launcher.js         The ◆ Moods button, the menu entry and /moods
  state.js            What's open and running right now

panel/              What you see
  render.js           Draws the panel
  events.js           What every tap, slider and text box does
  header.js           People bar and tabs
  sections.js         The Moods, Traits, Turn-ons, Facts and Story lists
  rows.js             Single slider rows
  …-tab.js            One file per tab
  settings-sheet.js   ⚙ Settings
```

The rule of thumb: `data/` says *what exists*, `engine/` says *what it means*, `app/` says *when it happens*, `panel/` says *what you see*.

## Adding options

Each data file starts with a comment saying what each field is. In short:

- **A mood, trait, intimacy option, fact or story setting:** add a line to the right category in `data/catalogue/mood.js`, `trait.js`, `intimacy.js`, `state.js` or `story.js`. Psychosexual means the psychology under someone's sex life (what sex means to them, shame, coping, complexes); a kink practice or a role goes in Roles in bed instead. Give it a new `id` (never reuse or rename one: saved chats store values under it), a `label` for the panel and a `cue`, the plain description Claude reads. Nothing else needs touching; the panel, search, the scene reader and the note pick it up.
- **Words for a mood:** give it `words`, a comma-separated list of everyday words and phrases that mean it ("seething, white-hot, out for blood"). When Claude names one on the hidden line or the info board, it counts as that mood. Earlier lists win: a mood's own name first, then the built-in synonyms in `engine/board.js`, then `words` in catalogue order, so a word already taken by another mood does nothing.
- **A relationship:** add a row to a group in `data/catalogue/relationships.js`. `{other}` stands for the other person.
- **A turn-on:** add a row to a sub-group (`subs`) of a group in `data/catalogue/turns.js`; sub-groups show as small headings once a list is longer than eight rows. `keys` are the words that point to it when Claude names what sparked. For two sides of one thing, make two rows (`spanking_giving` "spanking someone", `spanking_receiving` "being spanked") and give each the word forms that only fit its side ("spank spanking" against "spanked"): a word that is a key outright beats one that only shares a stem. Keep the pair next to each other, giving first. To retire a turn-on, list it in `TURN_MERGED` with the one(s) its saved value moves to; ids used in `engine/reactive.js` and `engine/era-lenses.js` must be live ones.
- **A combo:** add a row to `COMBOS` in `engine/reactive.js`: a name, a test on what lit and how they feel, and the line Claude reads. At most two fire per reply, in list order.
- **A period line:** add a lens to `LENSES` in `engine/era-lenses.js` with a line for each period (or to `SIXTIES` for one that only fits 1950s–60s America, with an `mw` version naming the man and the woman), and what switches it on to `LENS_TRIGGERS`: turn-ons (`turns`), moods, traits or facts (`moods`), skills at 5 or more (`skills`), ties (`ties`) or Story settings (`story`). Power always shows when it applies; the rest take turns, seeded by the reply number, up to the cap set on the Story panel.
- **A dynamic:** add a row to `DYNAMICS` in `data/catalogue/dynamics.js`. Order matters: the first row whose test passes wins, so put specific ones above general ones. The header lists every meter the test can read. Before adding one, check it can actually win: a row whose test sits entirely inside an earlier row's never shows (1.52's 108 new rows were each placed so it shows for a fair share of its own meter range, without crowding out the older ones). Mind defaults: Openness starts at 20, so a test like `op <= 25` is true for everyone who has the meter on.
- **How a mood moves the meters:** `engine/mood-meters.js`. `FAMILY` gives each mood family a default nudge (happy warms Friendship, cruel raises Urge to hurt and Control); `NUDGES` names moods that move something else, and a mood named there uses only its own rows (`{}` for none). Nudges are free: they read feelings the reply already reported, and a meter the line moved itself is left alone. Desire-family moods also warm the Desire card's arousal when the line gave it no step. To see coverage, `nudgedMoods()` returns every mood that moves something.
- **A skill:** add a row to a group in `data/catalogue/skills.js`. `words` call for it in the scene and also count as practice, so keep them to things someone does with the skill; broad words ("read", "hair", "drink") would level it every reply. To retire one, add it to `SKILL_MERGED`. Growth (`SKILL_PACE`, `growSkills` in `engine/skills.js`) runs once per message in `applyReply` (`app/replies.js`) and is recorded with the reply, so a swipe takes it back.

Only options that are switched on are sent to Claude, so a bigger catalogue costs nothing in tokens on its own.

## Pace

One pace per character and chat, kept as `bond.pace` (`PACE` in `engine/bond.js`: Slow burn, Steady, Quick, Volatile) and set from the Moods card's Speed or the Bonds tab's Pace, which are the same setting (`data-pace`). Feelings (`scenePace` in `app/note.js`, which reads `MOOD_PACE`), the meters, mood nudges (scaled by the pace's `lean`) and desire all follow it, and the hidden line asks for steps that size. Two speeds stay separate on purpose: needs (time passing) and skill growth (Skills tab), which is learning, not mood.

## Renaming or merging an option

Don't change an `id`. To retire one, add it to `MERGED_MOODS` in `data/catalogue/merged.js` with the id it folds into, and its saved values move over the next time a chat loads.

## Checking a change

The `engine/` and `data/` files load in plain Node, which makes the note easy to test without SillyTavern:

```js
import { budgetPrompt } from './engine/prompt.js';
import { freshState } from './engine/state.js';
const st = freshState({}); st.moods.defiant = 70; st.loadout = ['defiant'];
console.log((await budgetPrompt(st, 'Damien', 2000, async t => t.length / 4)).prompt);
```

1.51's word lists were checked by mapping every word the old version knew through both versions and reviewing each one that changed. 1.50 was checked against 1.49.6 with a browser harness that drives the panel through the same random walks on both versions and compares every note, saved chat and setting. It lives outside this folder.

## Ideas for later

- **Many more built-in options.** More moods, relationships, bonds and dynamics in every section, with the meter-driven dynamics and the automatic moods at the front. Since only switched-on options are sent, the lists can grow without the note growing.
- **Not resending everything.** Find ways for automatic moods and dynamics to steer replies without the whole active list being reprinted in every note.
- **Your own options, done properly.** 1.50 removed them because they didn't behave like the built-in ones: they had no meter tests, no scaled wording, no "how it shows", and the scene reader couldn't weigh them the same way. A future version could bring them back only if a custom option gets the same machinery: a dynamic you write with a meter test, a mood with its own on-the-page wording, and so on.
- **Faster drawing of big lists.** Since 1.51, browsing everything leaves folded groups empty until they're opened (`fillLazy` in `panel/render.js`); since 1.52 the Bonds tab's list of dynamics does the same. A person's own list still draws every row up front.
