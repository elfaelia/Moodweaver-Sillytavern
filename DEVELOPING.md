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
    state.js          Body, looks and condition
    story.js          Genre, tone, stakes, era, authors, writing style
    relationships.js  Feelings toward one person, and both-ways ones
    turns.js          Turn-ons and turn-offs
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

- **A mood, trait, fact or story setting:** add a line to the right category in `data/catalogue/mood.js`, `trait.js`, `state.js` or `story.js`. Give it a new `id` (never reuse or rename one: saved chats store values under it), a `label` for the panel and a `cue`, the plain description Claude reads. Nothing else needs touching; the panel, search, the scene reader and the note pick it up.
- **A relationship:** add a row to a group in `data/catalogue/relationships.js`. `{other}` stands for the other person.
- **A turn-on:** add a row to a group in `data/catalogue/turns.js`. `keys` are the words in a reply that light it up.
- **A dynamic:** add a row to `DYNAMICS` in `data/catalogue/dynamics.js`. Order matters: the first row whose test passes wins, so put specific ones above general ones. The header lists every meter the test can read.
- **A skill:** add a row to a category in `SKILL_CATEGORIES` in `engine/skills.js`. `words` are what call for it in the scene.

Only options that are switched on are sent to Claude, so a bigger catalogue costs nothing in tokens on its own.

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

1.50 was checked against 1.49.6 with a browser harness that drives the panel through the same random walks on both versions and compares every note, saved chat and setting. It lives outside this folder.

## Ideas for later

- **Many more built-in options.** More moods, relationships, bonds and dynamics in every section, with the meter-driven dynamics and the automatic moods at the front. Since only switched-on options are sent, the lists can grow without the note growing.
- **Not resending everything.** Find ways for automatic moods and dynamics to steer replies without the whole active list being reprinted in every note.
- **Your own options, done properly.** 1.50 removed them because they didn't behave like the built-in ones: they had no meter tests, no scaled wording, no "how it shows", and the scene reader couldn't weigh them the same way. A future version could bring them back only if a custom option gets the same machinery: a dynamic you write with a meter test, a mood with its own on-the-page wording, and so on.
- **Faster drawing of big lists.** Opening the panel and the Bonds tab still draw every row up front. Drawing a folded group only when it's opened would cut that.
