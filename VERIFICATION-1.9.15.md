# Verification — 1.9.15

- Nine focused tests pass across catalogue-cleanup.test.js and mood-ranges.test.js.
- All 64 historical merge IDs point directly to live sliders. Checked migration at 0, 4, 50 and 100, pins, knowledge sources and repeated loading. Earlier saves containing Irked and Annoyed together migrate to Angry in one pass; values are never summed.
- Checked low and high wording in character prompts, all four persona knowledge modes, and the closing high-strength reminder. Fear, anger, sadness and romantic interest send the selected intensity phrase without printing the other levels.
- The catalogue has 843 unique options in 41 categories. 806 entries outside the merge groups are unchanged from 1.9.14; 37 remaining entries were clarified to cover their combined range.
- An unrelated prompt is unchanged, and an empty blend still sends nothing. Each enabled merged setting sends one selected phrase, plus the existing high-strength recap when applicable.
- Old and renamed labels remain available to search. All starter-blend IDs resolve; Trouble brewing now uses Anxious in place of Tense.
- JavaScript syntax checks and git diff --check passed.

No model requests were made. These checks verify prompt construction and migration, not model adherence. Older exact-wording tests were not represented as passing.
