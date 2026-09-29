# Verification — Moodweaver 1.3.0, 29 September 2026

- Target: SillyTavern 1.19.0.
- Runtime syntax: node --check passes for index.js, core.js and preview.js.
- Automated tests: 25 passed, 0 failed. All 9,730 distinct catalogue pairs compile at 4/90 and 90/4 with both strengths retained. Tests also cover all 1–100 values, all 140 states together, disabled/all-zero prompts, conditional expression guidance, token-target overruns, old-state migration, dynamic faint values, pins, chat isolation, group speakers, failed and late analyses, and generation exclusions.
- Pair tests verify compiler inclusion, not the quality of every possible model portrayal or every larger combination.
- Offline tokenizer check: installed @agnai/web-tokenizers with SillyTavern's src/tokenizers/claude.json. No remote requests. Seven-state gallery fixture: 363 tokens, all seven values included. Unmasked three-state fixture: 298 tokens, full definitions. All 140 states at 50: 1,346 tokens, compact. Fixture character name: Alex. These are local tokenizer counts, not exact Opus 5.5 billing counts.
- Browser preview (simulated ST context): v1.3.0 loads; inspector starts collapsed, opens and shows the complete exact injection, selected count and explicit over-target report. Setting Stoic to zero removes its line and conditional guidance; no masking or lying guidance is inserted. Style/layout were not changed.
- Previous-version UI verification covered responsive layout, manual/dynamic modes, profile selection, pins, simulated scene reads, chat switching, and last-generation snapshots. This release retains the automated integration checks.
- No paid model requests made. Dynamic requests in tests are mocked. Live Opus 5.5 emotional fidelity and provider reliability are unmeasured; card/history/preset influences remain possible.
- Saved mood metadata, character cards, presets, roleplay messages and credentials were not edited. Updated files belong only to Moodweaver. Browser reload is required to load the new version.
- Integration verification uses authenticated, read-only HTTP discovery and SHA-256 comparison of the four served runtime files. The live authenticated ST UI is not available in the separate test browser; its UI checks use the local preview.

The token setting is now an explicit soft target: definitions compact first, and the complete blend may exceed the target. There is no silent state truncation. Scene and analyser output caps remain limits. Dynamic scene windows and chat-history rewind limitations remain documented in README.
