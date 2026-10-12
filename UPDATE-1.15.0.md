# Moodweaver 1.15.0

## Panel and search

The panel keeps a separate view snapshot for each person and menu. On redraw it restores the visible row's position, focused control, search, open groups and horizontal character strip. Search only filters the interface; it never resets strengths or disables settings.

Search now stays available on saved moodlet, attraction, needs/facts and story lists, including custom entries. Relationships still searches both directional feelings and shared settings, with additional search for people and memories. Persona knowledge and personality types also have search. Searching opens matching groups temporarily; clearing it returns to their previous open/closed state.

## Entries

- Wrapped around their finger already exists: Relationships → choose someone → the selected person's side → Attachment & power.
- Severe paranoia uses the existing Paranoid slider, with a search alias. Competence already exists under Turn-ons & offs.
- Devoted to is under Relationships → Friendship & trust. Giving the cold shoulder is under Dislike & hostility. Both apply toward the person selected in that pairing.
- Needs the toilet goes under Body; Literate and Illiterate under Background; Hard and Soft under In the bedroom.
- New moodlets and traits are grouped under Personality, Manner & presence, Hiding & showing, Love & closeness, Scared & uneasy, Mind & psychology, Morals & views, Psychosexual, Archetype and Substances.
- Repressive voyeurist is labelled Repressed voyeur and searchable by either wording. Masking (Hidden amusement) means finding something funny while trying not to show it.
- The existing -100 to +100 attraction scale is retained. New entries: desperation, musicians, visual artists, nerds, hipsters, criminals, messiness, anger in others, helplessness, introversion, extraversion and naivety. The six extras are patience, self-discipline, emotional openness, attentiveness, irreverence and precision. Artistic types remains the broader existing preference.

All additions start unset. Unused entries add no prompt tokens. Their short descriptions reach the prompt, rather than relying on ambiguous UI names alone.

## Personality types

Each main character, persona and supporting character gets its own optional Personality tab. Choose one of the 16 types, Balanced/Positive/Negative expression, a 0–100 strength and Send type. Selecting a type alone does not send it. Off, zero, a disabled person or an off-scene cast member sends nothing for that person's type. Defaults preserve the selection for future chats.

The type appears in a small Personality type section before that person's moods and facts. Only the selected type and expression are sent, with the existing strength word. A short explanation is shared once across all enabled types. Type strengths join the normal strength legend; no new scale or repeated full type catalogue is added. Moodlets and relationships still mix with the type.

For the player persona, Scene only/Private/Suspected/Known and an optional source are available inside Personality. Knowledge stays per observing character and persona, just like existing persona knowledge. A type does not let an NPC write the player's choices or know hidden thoughts.

The [Myers & Briggs preference pairs](https://www.myersbriggs.org/my-mbti-personality-type/the-mbti-preferences/) provide the four-letter structure. The positive/negative descriptions here are original fictional writing choices, not clinical assessments or official type variants. The OCD entry refers to intrusive thoughts and compulsions, including mental checking, following [NIMH's description](https://www.nimh.nih.gov/health/topics/obsessive-compulsive-disorder-ocd); it does not equate OCD with neatness.

## Installation

Use every file in the ZIP's Moodweaver folder: `index.js`, `core.js`, `cast.js`, `relationships.js`, `relationship-ui.js`, `turns.js`, `personality.js`, `personality-ui.js`, `panel-state.js`, `style.css`, and `manifest.json`.

No tests, browser runs or model requests were performed for this release, as requested. Existing scene/preset prompts were not edited.
