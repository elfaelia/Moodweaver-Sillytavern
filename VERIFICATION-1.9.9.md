# Current feelings and knowledge — 1.9.9

- Syntax checks passed for `core.js` and `index.js`; `git diff --check` passed.
- Seven focused tests passed: `node --test tests/prompt-priority.test.js tests/knowledge.test.js tests/knowledge-integration.test.js`.
- Inspected a mixed persona prompt with a maximum Known feeling, faint Suspected feeling, strong Private feeling and a Scene-only trait. Each setting remains in its own group at its own strength; the observer's moods stay separate.
- Known feelings now mean current feelings the observer knows about. Suspected feelings can affect their response without becoming certain. Their own settings decide the response, and the player still writes their own actions, speech and thoughts.
- Knowledge help text and the four age-preference descriptions match the revised guidance. No settings schema, persistence or layout changes.
- The extension prompt adds 81 tokens on one saved blend using SillyTavern's bundled Claude tokenizer. With the corresponding private preset wording shortened, the combined increase is 45 estimated tokens. No private preset or chat data is included here.

These checks cover prompt construction and persistence, not model adherence. No paid model generation was run. The legacy full suite's eleven pre-existing format assertion failures are documented in the 1.9.8 verification notes; it is not represented as passing.
