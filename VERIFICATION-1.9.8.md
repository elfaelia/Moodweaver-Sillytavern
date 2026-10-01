# Persona knowledge verification — 1.9.8

- Syntax checked with `node --check core.js` and `node --check index.js`.
- Seven focused tests passed: `node --test tests/prompt-priority.test.js tests/knowledge.test.js tests/knowledge-integration.test.js`.
- Checked independent strength retention, inactive/disabled omission, source bounds and escaping, soft-budget behavior, and knowledge isolation by chat, observer and persona through serialization/reload.
- Used the local interactive preview without model requests: enabled persona tags, changed knowledge choices, typed a source, changed another control, and confirmed the source remained and reached the prepared prompt. Checked layout at desktop and 390-pixel phone width.
- Compared old/new prompt output using the installed SillyTavern Claude tokenizer on a local saved blend. Persona instructions are shorter; all active rows remain. Source notes contribute only when supplied. Private chat contents are not included in this repository.

These checks validate UI, persistence and prompt construction, not model adherence. The legacy full suite predates the strength-word format and already had eleven failing assertions in 1.9.7; it has not been represented as passing.
