# Blended responses and observer perspective — 1.9.10

- Syntax checks passed for `core.js` and `index.js`; `git diff --check` passed.
- Seven focused tests passed: `node --test tests/knowledge.test.js tests/knowledge-integration.test.js tests/prompt-priority.test.js`.
- Checked a ten-setting blend across character, persona and story, with all four knowledge modes. All ten settings survived a deliberately tiny token target, with no state changes or transfer of the observer's moods into the persona section. Persona output also remained present with no character moods enabled.
- Persona headings now name the observer and subject. Shared guidance asks for the observer's words, choices and thoughts to reflect known or suspected information at its strength while leaving the player's response open.
- Shared blending guidance keeps individual strengths when multiple tags are active and allows one setting to change another's expression without erasing it. Strong and subtle tiers no longer require an outward tell.
- Older-person preferences no longer assume emotional maturity. Age and personality are separate in the shared qualities guidance.
- On a saved blend, the extension prompt alone changed from 675 to 672 tokens using SillyTavern's bundled Claude tokenizer. Local preset and character-note cleanup reduced the combined prompt by about 1,400 estimated tokens. Private files are not included in this repository.

These checks validate prompt construction and persistence, not model adherence. No model requests were made. Pre-existing legacy format assertions are documented in the 1.9.8 notes; the legacy full suite is not represented as passing.
