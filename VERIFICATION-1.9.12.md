# Attraction preferences — 1.9.12

- Built on the installed 1.9.11 revision, preserving its prompt composition changes.
- Added 30 preferences to an adjacent collapsible category, alongside the five existing age/teacher preferences. Existing IDs, levels and pins are unchanged.
- Syntax checks for `core.js` and `index.js`, and `git diff --check`, passed.
- Checked every new preference at 4, 50 and 100 for the character and for all four persona knowledge modes: 450 prompt-construction cases. Each uses its short natural-language cue under the correct strength.
- Checked catalogue uniqueness, zero defaults for new entries in an old save, existing levels and pins, and a mixed five-setting prompt under a deliberately tiny token budget. Nothing was omitted.
- A blend with no attraction settings produces exactly the same prompt as 1.9.11. One clear preference added 35 estimated tokens to a simple existing blend, including the new category heading and shared preference guidance, using SillyTavern's bundled Claude tokenizer. Higher settings retain 1.9.11's closing reminder.

No model requests were made; these checks verify prompt construction, not model adherence. The older wording-specific test assertions were not rewritten or represented as passing against 1.9.11's changed headings.
