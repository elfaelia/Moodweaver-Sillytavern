# Developing Moodweaver

How the code is laid out, where to add things, and ideas parked for later.

## The map

```
index.js            Front door: loads the files one at a time with a progress strip, never holding up SillyTavern
main.js             Start-up: connects to SillyTavern and hooks every reply
manifest.json       What SillyTavern reads to load the extension
style.css           The panel's look

data/               The catalogue: every option and its wording, no logic
  catalogue.js        Puts the section files together and answers "what is this id?"
  catalogue/
    mood.js           Moodlets: feelings the scene can move
    trait.js          Traits: who someone is
    psyche.js         Mind: complexes, neurodivergence, disorders, the old schools and 1960s diagnoses
    intimacy.js       Intimacy: roles in bed, sexual temperament, what draws them, psychosexual
    state.js          Facts: body, looks, condition, background, place
    story.js          Genre, tone, stakes, era, authors, point of view, writing style
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
  stress.js, opinions.js, secrets.js, auto-wants.js   Stress, feelings about others, secrets, wants from the meters (1.79)
  …                   One file per idea (skills, checks, cast, period, locale, moodpace, overlap, patterns…)

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
  header.js           Person cards, the dock, section chips and the swipe order
  sections.js         The Moods, Traits, Turn-ons, Facts and Story lists
  rows.js             Single rows: moons, pins, stars
  …-tab.js            One file per tab (music-tab.js is the ♫ Music tab)
  settings-sheet.js   ⚙ Settings
```

The rule of thumb: `data/` says *what exists*, `engine/` says *what it means*, `app/` says *when it happens*, `panel/` says *what you see*.

## Adding options

Each data file starts with a comment saying what each field is. In short:

- **A mood, trait, intimacy option, fact or story setting:** add a line to the right category in `data/catalogue/mood.js`, `trait.js`, `intimacy.js`, `state.js` or `story.js`. Psychosexual means the psychology under someone's sex life (what sex means to them, shame, coping, complexes); a kink practice or a role goes in Roles in bed instead. Give it a new `id` (never reuse or rename one: saved chats store values under it), a `label` for the panel and a `cue`, the plain description Claude reads. Nothing else needs touching; the panel, search, the scene reader and the note pick it up.
- **Words for a mood:** give it `words`, a comma-separated list of everyday words and phrases that mean it ("seething, white-hot, out for blood"). When Claude names one on the hidden line or the info board, it counts as that mood. Earlier lists win: a mood's own name first, then the built-in synonyms in `engine/board.js`, then `words` in catalogue order, so a word already taken by another mood does nothing.
- **A mind setting:** add a row to a `psy_*` group in `data/catalogue/psyche.js`: `cue` (what it is in plain words, shown in the panel and sent), `words` (specific words that call a faint one into the scene; leave out everyday ones like "leave" or "good", which would send it every reply), and `light`/`dark` (healthy and unhealthy side, full sentences) when it has two sides: such a row gets a meter that starts in the middle (off), with the unhealthy side to the left and the healthy side to the right (`poleMoons` in `panel/rows.js`; the side is `state.psyLean`). `mindOn` in `engine/prompt.js` decides what's sent; `FAMILY_LEAN`/`MOOD_LEAN` (`engine/bond.js`), the mind lists above `CLASHES` (`engine/links.js`), `COMBOS` (`engine/reactive.js`), `PERIOD` (`data/catalogue/period.js`) and `NEED_BIAS` (`engine/board.js`) tie it to the rest.
- **A relationship:** add a row to a group in `data/catalogue/relationships.js`. `{other}` stands for the other person. If it's really a meter (it only says how much they like, trust, want, fear… the player), add it to `TO_METER` instead of leaving it as a tie: on the character's side toward the player (with the bond on) those rows are hidden, their saved values move into the meter once (`moveFeelingsToMeters` in app/replies.js), a hidden-line `toward` naming one steps the meter (bondList), and `meterTies()` reads the meters back as tie strengths so dynamics, period `tie:` lines and scene links still find them.
- **Tap glow:** `tapGlow`/`reglow` in panel/render.js light the tapped control (`.mw-tapglow`) and find it again after a redraw by its data attributes and index.
- **A turn-on:** add a row to a sub-group (`subs`) of a group in `data/catalogue/turns.js`; sub-groups show as small headings once a list is longer than eight rows. `keys` are the words that point to it when Claude names what sparked. For two sides of one thing, make two rows (`spanking_giving` "spanking someone", `spanking_receiving` "being spanked") and give each the word forms that only fit its side ("spank spanking" against "spanked"): a word that is a key outright beats one that only shares a stem. Keep the pair next to each other, giving first. To retire a turn-on, list it in `TURN_MERGED` with the one(s) its saved value moves to; ids used in `engine/reactive.js` and `data/catalogue/period.js` must be live ones.
- **What counts toward a turn-on without being mentioned:** give its row `signs` (and, for a turn-off worth flipping, `opposite`): moods, traits or facts by id, `skill:<id>` at 5 or more, `tie:<id>` for the other person's tie toward them, or `older` / `younger` by the ages on the Facts tab. `turnSigns` in `engine/turns.js` reads them for the character and the player both ways; the note marks the lines ("in Lamb: bratty"), the Turn-ons tab shows them under "In play from…", and `signsPull` nudges the romance baseline (at most ±20). Point signs at things someone *is*, not things they happen to do in a scene: that's what the sparked list is for.
- **Facts the story can name (1.78):** every fact except places can be put on by name. `factId(name, hot, all)` in `engine/board.js` has two indexes: facts with `lasts`, `feels` or `words` are matched in free text (the board's Physical State, feelings on the hidden line), and every other fact is matched only by its exact label or id where a list is about facts (the hidden line's `facts` list for the character and `you` list for you, `all = true`). So give a new fact `words` only when they're precise phrases that can't mean something else ("bent over", "huffing", "exposed" and "shot up" were left out for that reason), and check new words against `feelingId` so a feeling's name isn't taken by a fact. The character's `facts` field reports changes only ("fired, engaged off"). Who-they-are facts (`lasting` in `app/replies.js`: not body, bed, substances or places, and no `lasts`) only come off when the line says "off", an opposite comes on, or they pass their own cap of 8.
- **Starred beliefs:** `state.beliefs` (up to `BELIEF_MAX`, 3), rows from the Morals & views and Alignment categories (`isBelief` in `engine/state.js`). They get a ✦ instead of the core ★, go in the note as "What they believe most", are left out of the trait list, and bend the dynamic through `CORE_BENDS` in `engine/links.js` (beliefs are checked first).
- **Family:** `state.family`, one person a line, on the profile card. `familyText` in `engine/turns.js` sends a line only when the scene names that person (the first capitalised word after the colon) or their relation (`KIN` lists the everyday words for each), all of them when the scene talks about family in general, and all of them on the every-few-replies reminder.
- **Facts the story puts on and takes off:** `fromStory` in `app/replies.js`. Facts named on the board's Physical State come on for the character, and places named in its Location come on too (`placesIn` in `engine/board.js` reads setting facts' `words`, longest first, plus late night from the clock). Facts in the hidden line's `you` list come on for you. The ones the story put on (`state.fromStory`) come off when it leaves them out: for the character only facts without `lasts` (those wear off by the clock), and places only while the board has a Location. At most `FACT_CAP` (8) story facts stay on one person; the oldest goes first. A fact is spotted by its label, its id, or its `words` when it has them (which replace the label, for labels that are everyday words like Hard). Give every right-now fact `lasts`, so it wears off when the story stops naming it.
- **Adding a missing hidden line (1.91):** `app/fill-in.js`. When the newest message is a character reply with no weave line (and the bond/line is on), `drawChip` puts a button inside that message's `.mes_block`. The tap runs `generateQuietPrompt` with `run.fillIn` set: `main.js` then keeps the notes for that quiet request (GENERATION_AFTER_COMMANDS skips `clearNotes`, and the interceptor builds the note with `syncPrompt(true, chat, 'quiet')`). `lineFrom` takes the `<!-- weave: ... -->` out of the answer (or wraps a bare `weave:`), the line is appended to `mes` and the current swipe, and `MESSAGE_EDITED` is emitted so `applyReply` reads it. Setting `fillInChip` (default on). Harness check: `fill191.mjs`.
- **The cast moved by the story (1.87):** the hidden line's `cast` field (`castOf` in `engine/weave.js`, "Mae: wary +10, in uniform; Joe: afraid off") is asked for only when cast members are in the scene (`cast` names passed to `weavePrompt` from `app/note.js`). In `applyReply` (`app/replies.js`) each in-scene person takes at most one feeling and one fact (a fact name with off takes off only one the story put on), their facts run their course (`runFacts`) and feelings the story gave them fade (`fadeStep`, kept in their `fromStory` and `moodQuiet`). Out-of-scene people are never touched. Recorded per cast id in `rec.cs`, undone in `undoReply`. Setting `castAuto` (default on). Harness check: `cast187.mjs`.
- **Opposite facts:** `OPPOSITE_FACTS` at the end of `data/catalogue/state.js` (groups where only one can be on). `OPPOSITE_OF` in `data/catalogue.js` indexes them; `clearOpposites` (engine/state.js) and `fromStory` (app/replies.js) apply them when `factOpposites` is on.
- **Which facts are sent:** `factOn` in `engine/prompt.js`. With Settings › What is sent › "who-they-are facts only when the scene touches them" on (`factsWhenRelevant`, on by default), facts in `STANDING_FACTS` categories go only when the scene (your message and the last reply) names them or their topic, at 81 or more, or on the first replies and every sixth one. A fact with `private: true` (the size facts) goes only in a private or intimate moment (`PRIVATE_SCENE`, a desire mood at 41+, or a bedroom fact on anyone). Favourites (`FAVS` in `engine/turns.js`, kept in `state.favs`) follow the same rule by their own topic words. Age and height always go. Pet names and catchphrases (`state.petNames`, `state.sayings`, kept as typed by `cleanWords`, split by `petNames` / `sayings` in `engine/turns.js`) go every reply through `voiceLines` in `engine/prompt.js`: for the character as the only endearments to use and phrases to work in now and then (at most one a reply), for your character as names and phrases the character knows.
- **A fact that runs its course:** give a fact in `data/catalogue/state.js` `lasts` (hours), optionally `then` (the fact it turns into, at 80% of its value) and `feels` ("hazy_drunk +4, emboldened +2", feelings it pushes each reply while it's on, never above 70). `factStep` and `factFeelings` in `engine/moodpace.js` run them; `replyHours` in `engine/board.js` reads the time from the board clocks. The clock lives in `state.factClock`, and `applyReply` records every change with the reply, so undo and swipes take it back.
- **An author:** add a row to an `authors_*` category in `data/catalogue/story.js` with `books` (one or two, separated by `; `), a `cue` that is technique only (sentence shape, point of view, rhythm, punctuation, what gets dwelt on; no plots or characters), a short `note` and a longer plain `style` for the panel. Keep the `style` in its five labelled parts (`Prose:`, `Dialogue:`, `Minds:`, `People:`, `Hallmarks:`): when the player sets an author to Narration or Dialogue only (`state.authorRole`, buttons in `panel/rows.js`), `briefFor` in `engine/prompt.js` sends just the `Dialogue:` part, or everything but it, and `AUTHOR_SPLIT` explains the split once.
- **A wildcard:** add a line to `WILDCARDS` in `data/catalogue/story.js`. `wildcardOf` in `engine/prompt.js` picks one from the reply number, as often as the Wildcards setting's strength (out of 100).
- **How traits change pace:** `TEMPERS` in `engine/moodpace.js` lists the traits that make feelings swing, steady or linger; `temperPace` applies them on top of the chat's pace (`movePace` in `app/note.js`).
- **A line where a tie and the dynamic meet:** `engine/links.js` has three tables. `ROLE_LINKS` (a role such as doctor or captor, and what happens inside it), `TIE_LINKS` (a tie someone set and a dynamic that pulls against it or fits it in a way worth saying: whose side, the dynamic groups or names, the line) and `CORE_BENDS` (a core trait and how it changes the way someone carries the dynamic, given who leads). First match wins in each; at most three link lines go under the dynamic. `tieOffer` picks the tie a long-running dynamic implies (after `OFFER_AFTER` replies), which the Bonds card only offers: nothing is set unless you tap it, so the dynamic can't feed itself.
- **When two moods clash:** `CLASHES` in `engine/links.js`: what one feels, what the other feels (mood family names or id lists), the line, and flags for same-kind pairs, "the other feels no desire" and "only while someone feels desire". `moodClash` picks the strongest pair at clear or above and only speaks on some replies (`CLASH_CHOICES`). Traits are left out on purpose.
- **What a fact does to the meters:** `factNudges` in `engine/mood-meters.js`: facts that newly came on this reply (his from the hidden line, yours when the "you" list gains one) push meters such as Care, Protectiveness, Dependence and Openness, when nothing else moved them.
- **A combo:** add a row to `COMBOS` in `engine/reactive.js`: a name, a test on what lit and how they feel, and the line Claude reads. At most two fire per reply, in list order.
- **A period line (1950s–60s America):** add a row to `PERIOD` in `data/catalogue/period.js` with `L(category, sub-heading, id, label, { he, she, any }, triggers)`. Write `he` and/or `she` (or `any` for everyone) as one or two plain sentences, using `{who}` for the person, `{other}` for the other one and `{age}` for their age. Triggers: `ids`, `cats`, `turns`, `ties`, `need`, `scene` (keys of `SCENE` in `engine/period.js`) and `dyn` (dynamic group keys from `DYNAMIC_GROUPS`; `app/note.js` passes the pair's group as `dynGroup`, and the `pair` lines share `group: 'dyn'` so only one goes per reply); `when` lists conditions that must all hold (`WHEN` in `engine/period.js`: who leads, who leads in bed, a sexual scene, married, ages, height…); `other` limits it to a man or a woman opposite; `world: true` marks everyday-life lines that ◐ Kept apart switches off; `w` is the weight when only `when` decides; `group` lets only one line of a group go per reply. Categories are `PERIOD_CATS`. The Period tab (`panel/period-tab.js`) shows the catalogue per person, filtered by gender; switched-off ids live in `settings().periodOff['char:<avatar>'][n|u]`. `periodLines` scores each line by the strength of what woke it, sends the strongest first and rotates the rest in bands of 20, seeded by the reply number. Run `node tests/pronouns.mjs` after adding lines that use `{other}`.
- **A dice contest:** add a row to `CONTESTS` in `engine/checks.js`: the attacking skills, the skills that resist them, optional moods that start the contest without a lit skill, and the words for winning and losing (`{d}` is the defender). Plain checks need nothing: any lit skill rolls against `DC`. `checkLines` is called from `app/note.js` with the reply number as the seed, so a swipe gets the same roll.
- **A dynamic:** add a row to `DYNAMICS` in `data/catalogue/dynamics.js`, in one of the `DYNAMIC_GROUPS`. Every row whose test passes is scored (`dynamicOf` in `engine/bond.js`): earlier rows score a little higher, and `dynamicLean` adds weight for groups that fit both people's moods (`FAMILY_LEAN`, `MOOD_LEAN`), the ties set (`TIE_LEAN`), a mood clash (the seventh field of each `CLASHES` row) and words from the last two messages that match the row's name and keys. Pace scales the lean. The second dynamic (`under`) is the same scoring on the settled meters, from a different group, and only changes when two readings a couple of replies apart agree. Order still matters, so put specific ones above general ones. The header lists every meter the test can read. Before adding one, check it can actually win: a row whose test sits entirely inside an earlier row's never shows (1.52's 108 new rows were each placed so it shows for a fair share of its own meter range, without crowding out the older ones). Mind defaults: Openness starts at 20, so a test like `op <= 25` is true for everyone who has the meter on.
- **How a mood moves the meters:** `engine/mood-meters.js`. `FAMILY` gives each mood family a default nudge (happy warms Friendship, cruel raises Urge to hurt and Control); `NUDGES` names moods that move something else, and a mood named there uses only its own rows (`{}` for none). Nudges are free: they read feelings the reply already reported, and a meter the line moved itself is left alone. Desire-family moods also warm the Desire card's arousal when the line gave it no step. To see coverage, `nudgedMoods()` returns every mood that moves something.
  `MORE_NUDGES` (1.78) adds on top of whatever a mood already moves, without replacing its family default. Use it to feed a meter that few feelings reach: every Bonds meter should be fed by roughly 8 or more feelings and appear in roughly 8 or more dynamics, so newer meters weigh the same as old ones (the count is in `Checking a change`).
- **A skill:** add a row to a group in `data/catalogue/skills.js`. `words` call for it in the scene and also count as practice, so keep them to things someone does with the skill; broad words ("read", "hair", "drink") would level it every reply. Words are weighed (`termsFor`): a phrase 3, a word of 4+ letters 2, else 1, divided by how many skills share it, and a quarter for everyday words (`COMMON`); a skill is called at a pull of 1 (`callStrength`). After changing words run `node tests/skill-words.mjs`, and add a passage for a new skill. Never put a comma inside a term: `termsOf` splits on commas, so "yes, sir" would become "yes" and "sir". An optional `bad` lists ways a minus level can show; `skillLines` offers two (picked by the reply number) as examples only. To retire one, add it to `SKILL_MERGED`. The Skills tab shows only the skills someone has; "＋ Add skills" (`ui.browsing`) opens the whole catalogue. Levels run −10 to +10 (`SKILL_MIN`, `SKILL_LEVELS` in `engine/skills.js`; saved chats from before 1.76 have their minus levels doubled once by `widenSkills`, marked by `state.skillScale`). The Skills tab (`panel/skills-tab.js`) is a list of rows (`data-skill-row` first, so scroll memory anchors on the row and not the chip); tapping one sets `ui.skillSheet` and draws a sticky sheet at the end of the view (swiped down to close by `sheetSwipe`, wired in `main.js`) with an SVG dial (`orbit`), − and ＋ and jumps, all `data-skill-to` with an exact `data-v` (0 takes the skill off). Every other slider in the panel is shown as moons by `moonify` in `panel/render.js`: the range input stays, hidden, and `tapRangeMoon` sets it and fires its events, so new sliders need no extra work; tapping the current one takes the skill off. Since 1.82 the moons sit in a `.mw-stepped` row with − and + (`data-range-step`, `stepRangeMoon` moves to the next stop in `moonStops`). The same pass turns short selects (2–5 options, short labels) into pills (`pillify`, `tapPill`; the select stays hidden and gets the change event; add `data-pills` to a select to keep it a dropdown) and folds long `.mw-fine`/`.mw-explainer`/`.mw-music-note` paragraphs (70+ characters) to one ⓘ line (`foldNotes`, `toggleNote`, remembered in `ui.openNotes`). Checkboxes are drawn as stars by CSS only. Psychology or Psychiatry at 6+, while in play, lets someone see the other person's Mind settings (`insightLines` in `engine/skills.js`, fed by `mindOf` in `app/note.js`): only when the scene touches one of them, or about one reply in three, and what they do with it is left to who they are. Growth (`SKILL_PACE`, `growSkills` in `engine/skills.js`) runs once per message in `applyReply` (`app/replies.js`) and is recorded with the reply, so a swipe takes it back.

Only options that are switched on are sent to Claude, so a bigger catalogue costs nothing in tokens on its own.

## Music

Songs from the player's own Spotify playlists, picked by plain code. Five files:

- `data/catalogue/music.js`: the Moments (kinds of scene) and how each is spotted (moods at 41+, setting facts, dynamic groups, an optional test on the snapshot), Heat, Energy, `FAMILY_ENERGY`, `SEX_FACTS`, and `POINTS` (what each match is worth). Add a moment here and the sheet, the panel chips and the picker all pick it up.
- `engine/music.js`: tags (`cleanTags`, `mergeTags`: a song's own tags on top of its playlists'), the scene snapshot (`snapshot`), scoring (`scoreSong`, `rank`, `pick`, `lineup`) and when to cut a song (`shiftOf`). Pure, so it runs in Node.
- `engine/sheet.js` and `engine/xlsx.js`: the song sheet. `sheetFile` writes an .xlsx with dropdowns (list validations pointing at the Lists tab); `readSheet` reads ours, a CSV of it, or an exportify.net CSV. `xlsx.js` is a small zip writer and reader (DecompressionStream for compressed files) with no outside libraries.
- `app/spotify.js`: sign-in (PKCE with its own SHA-256, because http on a home network has no `crypto.subtle`), the paste-the-address way back for addresses Spotify won't return to, refresh, and the Web API calls (playlists use `/playlists/{id}/items`, Spotify's 2026 name, with `/tracks` as a fallback).
- **Place recordings (1.88):** `LOOPS` in `app/ambience.js` maps a bed name to `[files, gain]`; files are 40 s seamless loops in `sounds/amb-*.mp3` (mono, 24 kHz, 40 kbps, equal-power crossfaded end-to-start, RMS -24 dB). `build()` plays a LOOPS bed with `loop()` instead of a synth. `NIGHT_BEDS` swaps a bed for its night take. `EROTIC_BEDS` decides which switch (`m.ambSex` or `m.ambPlaces`, Music › Ambience › What plays) a bed answers to. Harness check: `amb188.mjs`.
- **Loop versions and venue music (1.88.1):** a `LOOPS` entry's third value shapes it live (`'wall'` lowpass, `'far'` band-limited and quieter, `'hall'` a generated 2.2 s convolver echo). Venue music: `engine/venues.js` (`VENUES` with place facts, words, fitting genres and search genres; `venueNow`, `artistIn`, `searchesFor`), `sp.searchTracks` in `app/spotify.js` (pages of 10), and `venueHere`/`venueLineup`/`venuePlay` in `app/music.js`. A venue is kept on `mus.radio` with `venue`, `artist` and `key`, so the in-story line to Claude works unchanged. Searched tracks' names live in `mus.extra`. Setting `m.venues`. Harness: `venue188.mjs` (mocked search).
- `app/ambience.js`: the ambience, made with Web Audio. Most beds are synthesised; since 1.83 the sex beds play cuts of recordings in `sounds/` (mono mp3s, `GRAINS` lists each file's cuts as [start, end, gain]; `grain()` picks a random cut, never the same twice running, and shapes rate, filters and length per bed). `strokes()` keeps time; `setBeds(beds, level, energy, nudge)` sets `targetRate` from the scene's energy plus `paceNudge` (pace words in the newest message, `PACE_WORDS`) and `strokeRate` glides toward it. `wet` and `skin` (slaps) are separate layers. 1.85 added her second batch: `fingers`, `rub`, `spank`, `whip` (gated by `MORE_WORDS`) and `voice` (sex, and you or the character is a she); `hits()` plays sparse sounds sooner as the pace rises; `one()` picks between recordings of the same thing. `sounds/` cuts were made by onset detection, normalised by median cut peak (rhythmic) or RMS (voices, rubbing). Beds are builders in `build`; `ambienceBeds` in `app/music.js` picks at most `MAX_BEDS` (7) from place facts, word lists (`PLACE_WORDS`, `WEATHER_WORDS`, `LAYER_WORDS`, `LOVE_WORDS`, `MORE_WORDS`, `VENT_PLACES`) and the scene (`heat`, `mode`, `energy`, which sets `strokeRate`). `oneShots` plays `SHOT_WORDS` hits from a new reply once (`afterReply`, never on swipes or edits). Ambience runs apart from the music since 1.83: `ambienceAfterReply` runs first in `afterReply` (no Spotify needed) and `toggleAmbience` / `mus.ambPaused` pause it on its own. Measure new sounds' loudness against rain before shipping; everything sits under one Ambience switch.
- `app/music.js`: the library and tags (kept in extension settings under `moodweaver.music`, so every device shares them), `sceneNow` (moods of whoever Follow points at, facts, the board's Present, time and Horny, the dynamic), `afterReply` (run from `boardChanged` through `run.afterBoard`), `songEnding` (a timer a few seconds before the end of each song that re-picks the next one if the planned one no longer fits), feedback, import and export. `musicLine` is the optional feel line, added to the notes in `app/note.js` through `run.musicLine`.

Tags are ids, never labels, so renaming a label in the catalogue keeps saved tags. Character tags are names as typed (compared without case), plus `{{char}}`, `{{user}}` and `Any`.

## The note in two halves

With `splitNote` on (the default), `composePrompt` in `engine/prompt.js` returns `{ prompt, fixed }`. `guide(...)` pushes a paragraph to the guide (`fx`) when split, or to the note as before. The guide goes in with `GUIDE_KEY` at position 0, above the chat with the system role, so it sits in the cached prefix. The notes go with `PROMPT_KEY` at depth, as before. `boardPromptLines` puts its template and rules in `out.fixed`, and `weavePrompt` puts its per-reply parts (step sizes, feelings that ran high, the current dynamic) in `lines.live`.

Keep the guide's text the same from reply to reply. A change there invalidates the cache for the whole chat behind it. So its conditions follow what's set up (`setUp`: every option switched on, not filtered by the scene), never values that move each reply. Anything meant to change the scene stays in the notes.

`syncPrompt()` from a panel tap only schedules a preview rebuild (`NOTE_SETTLE_MS`). `syncPromptNow()` builds straight away, for a chat being opened or a reply arriving. `syncPrompt(true)` builds the note for a generation.

## Echoes

`engine/echoes.js`. `aftermathLines` reads the last two applied records (`chatMetadata.moodweaver.applied`). A feeling of a `WAKE` kind that was at 61+ and dropped by 30 or more gives one line. `contagionLine` reads the hidden line's `seems` and scores the character's empathy (`WARM`, `COLD`, selective empathy, closeness) before letting one `CATCHING` feeling rub off. Both go in the notes, late.

## Stress, opinions, secrets, wants from the meters (1.79)

All four are pure modules read back from the chat each time, so swipes take their share with them and nothing new is stored but hand taps.

- `engine/stress.js`: `computeStress(entries, st, from)` walks one entry per reply (`stress` from the hidden line, feelings that rose and aren't aimed at anyone, needs, release). `stressRate` (FASTER/SLOWER traits), `COPING` and `BREAKS` pick how they cope and break. `app/replies.js` `stressNow` feeds it; a secret step adds strain (`secretStrain`). `state.stressFrom` is the "Let it go" point.
- `engine/opinions.js`: `computeOpinions` adds up aimed feelings ("angry at his wife", via `aimed`) per person, fading 0.985 a reply, matched to the Family box (`familyPeople`, `KIN`). `opinionLines` only for people the scene names.
- `engine/secrets.js`: `secretList(st)` reads `st.secrets` (one a line, key = hash of the text). The hidden line's `secrets` field is parsed by `secretStep` ("affair suspected" → words + state) and matched to either person's list by `matchSecret`. `secretStates` takes the newer of the story's step and the hand tap (`st.secretSet`). `secretNudges` moves control, Secrecy, Shame and Knows about you inside `bondList`, only where the line didn't. `secretLines` writes the note lines.
- `engine/auto-wants.js`: `METER_WANTS` per meter (a `-` key for the low side). `autoWants` picks two from the meters at 61+, drops one the hidden line marked done (`REST` messages) or that a hand-written want already covers. `autoWantsNow` in `app/replies.js`; `app/note.js` adds them to the wants sent.

## How the dynamic changes (1.79.1)

`computeBond` in `engine/bond.js`. The **main** dynamic reads `axesNow`: the settled meters plus a pull from the last `pace.window` replies (`SCENE_GAIN`, capped at `SCENE_PULL`), with the cards' feelings and ties (`dynamicLean`) weighted by `ctxLean.weight`. It switches once a new one has led two replies running (Volatile at once). The **one underneath** reads the settled meters only, with the lean at a quarter of that, and is the one that led most of the last `UNDER_WINDOW` replies; it's hidden while it's the same as the main one. A story or reader call lasts `STORY_HOLD` replies. `tests/dynamics.mjs` plays long chats through it: run it after changing any of these numbers or adding dynamics.

## Pace

One pace per character and chat, kept as `bond.pace` (`PACE` in `engine/bond.js`: Slow burn, Steady, Quick, Volatile) and set from the Moods card's Speed (`data-pace`). Feelings (`scenePace` in `app/note.js`, which reads `MOOD_PACE`), the meters, mood nudges (scaled by the pace's `lean`) and desire all follow it, and the hidden line asks for steps that size. Traits then adjust it per character (`TEMPERS`). How firmly the relationship sliders hold the meters is `bond.ties` (`TIES` in `engine/bond.js`: light, balanced, strong). Two speeds stay separate on purpose: needs (time passing) and skill growth (Skills tab), which is learning, not mood.

## Profile, core traits and learning

Age, height and interests (`cleanAge`, `cleanHeight`, `cleanInterests` in `engine/turns.js`) feed `turnSigns` (`older`, `younger`, `taller`, `shorter`, and interest words) and `compareProfiles`, which writes the "Between them" line. Up to `CORE_MAX` (3) traits sit in `state.core` and go first in the note as "Core of who they are". The other traits go through `traitFocus` in `engine/prompt.js` (setting `traitFocus`): `TRAIT_FOCUS` (3) in full, picked by `traitTouched` (the scene names them) then a rotation seeded by the reply number and weighted by strength; the rest go as one line of labels. Trait strength is sent with `depthWord` (a touch … deeply), never the feelings' tier words. The hidden line's `noticed` field names the player's turn-ons the character picked up on; `knowledgeNow` in `app/replies.js` counts those against the chat, so one notice makes a turn-on suspected and a second makes it known, and deleting replies takes it back.

## Renaming or merging an option

Don't change an `id`. To retire one, add it to `MERGED_MOODS` in `data/catalogue/merged.js` with the id it folds into, and its saved values move over the next time a chat loads.

## Checking a change

`node tests/dynamics.mjs` checks the main dynamic still follows scenes and the one underneath stays slower.

The `engine/` and `data/` files load in plain Node, which makes the note easy to test without SillyTavern:

```js
import { budgetPrompt } from './engine/prompt.js';
import { freshState } from './engine/state.js';
const st = freshState({}); st.moods.defiant = 70; st.loadout = ['defiant'];
console.log((await budgetPrompt(st, 'Damien', 2000, async t => t.length / 4)).prompt);
```

Swiping between tabs is `onPanelSwipe` in `panel/events.js`, fed by the touch handlers in `main.js`: it needs a third of the panel's width (at least 90px), a mostly level path (the largest vertical drift is under 35% of the sideways distance), under 0.7 s, and no scrolling during the touch. `settings().swipeTabs === false` turns it off.

Wet, soaked and dripping can mean water or arousal. `TWINS` in `engine/board.js` maps each to both facts; `factId(name, hot)` and `factsIn(text, hot)` read four words either side: water words (shower, rain, towel, hair…) win, then arousal words, then `hot`. `app/replies.js` passes `hot` from `heated()`: a desire-family mood at 41+ on that person, or one named in the latest hidden line.

The ▦ Song counts drawer (`countsCard` in `panel/music-tab.js`) counts `usableSongs` with `fitsMode` for scene kinds and plain tag tests for the rest; it reads nothing new and stores nothing.

Period lines are data only (`data/catalogue/period.js`); the picking is `periodLines` in `engine/period.js`, which returns every line that applies with `sent` marked (the Period tab's "Lines about … now"). Bed lines read `bedTop` from `app/note.js`: their moods first (taking charge against giving way), then the Control meter, then a top or bottom bed role, then whoever holds power, so the lines follow who is actually leading in the scene.

Lines that name both people go through `pronounize` (`engine/pronouns.js`), which turns later mentions into he/she only where the grammar is certain and otherwise keeps the name. After adding or changing dynamics, meter lines, combos, links or skill combos, run `node tests/pronouns.mjs` (add `--show` to see every line it changed); it renders them all for every pronoun pair and fails on grammar that can only be wrong. Write those lines with names, never with he/she/they for one person.

To see how evenly the Bonds meters are fed (1.78 brought every one to roughly 8 or more feelings and 8 or more dynamics), count them in Node:

```js
import { nudgedMoods } from './engine/mood-meters.js';
import { MORE_METERS } from './engine/meters.js';
import { readFileSync } from 'node:fs';
const fed = {}; for (const n of nudgedMoods().values()) for (const [k, v] of Object.entries(n)) if (v > 0) fed[k] = (fed[k] ?? 0) + 1;
const src = readFileSync('data/catalogue/dynamics.js', 'utf8');
console.log(MORE_METERS.map(([k]) => `${k} ${fed[k] ?? 0}/${(src.match(new RegExp(`d\\.${k}\\b`, 'g')) ?? []).length}`).join('  '));
```

1.51's word lists were checked by mapping every word the old version knew through both versions and reviewing each one that changed. 1.50 was checked against 1.49.6 with a browser harness that drives the panel through the same random walks on both versions and compares every note, saved chat and setting. It lives outside this folder.

## Ideas for later

- **Many more built-in options.** More moods, relationships, bonds and dynamics in every section, with the meter-driven dynamics and the automatic moods at the front. Since only switched-on options are sent, the lists can grow without the note growing.
- **Not resending everything.** Find ways for automatic moods and dynamics to steer replies without the whole active list being reprinted in every note.
- **Your own options, done properly.** 1.50 removed them because they didn't behave like the built-in ones: they had no meter tests, no scaled wording, no "how it shows", and the scene reader couldn't weigh them the same way. A future version could bring them back only if a custom option gets the same machinery: a dynamic you write with a meter test, a mood with its own on-the-page wording, and so on.
- **Faster drawing of big lists.** Since 1.51, browsing everything leaves folded groups empty until they're opened (`fillLazy` in `panel/render.js`); since 1.52 the Bonds tab's list of dynamics does the same. A person's own list still draws every row up front.

## Plain ASCII code files
Every .js file must be plain ASCII: write characters like ’ “ ✦ as \u escapes. In 1.90 iPhone Safari misread a curly quote in `data/catalogue/story.js` ("Invalid character '\ufffd'"), Moodweaver's files failed to load, and SillyTavern hung on "Initializing…". `node tests/ascii.mjs` checks; `node tests/ascii.mjs --fix` rewrites them. Run it before every release (song-tags.js included).
