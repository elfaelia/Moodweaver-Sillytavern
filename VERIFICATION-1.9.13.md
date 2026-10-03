# Catalogue additions — 1.9.13

- Added 41 unique entries: 23 attraction preferences and 18 community-inspired options. Verified each category assignment. The catalogue now contains 940 entries in 41 categories.
- Compared all 899 previous entries and all previous prompt-name mappings against installed 1.9.12; all remain unchanged.
- Checked every addition at 4, 15, 30, 50, 70, 85, 95 and 100 for the character and for all four persona knowledge modes: 1,640 prompt-construction cases. Natural cues appear beneath the appropriate strength. The smell preference names the correct other person in both directions.
- Extended an old save and confirmed its previous strengths and pins survive; all new entries start at zero and unpinned.
- Verified an empty state still sends nothing, and a blend without attraction preferences produces the same prompt as before. Disabled additions contribute no roleplay text.
- Checked a mixed prompt with opposing maximum preferences, faint attraction, stoicism and masking under a deliberately tiny token budget. All five remain present at their chosen strengths; none are omitted.
- Syntax checks for core.js and index.js and git diff --check passed.

No model requests were made. These checks verify prompt construction and compatibility, not how consistently a particular model follows the wording. Older tests with stale exact-wording assertions were not represented as passing.
