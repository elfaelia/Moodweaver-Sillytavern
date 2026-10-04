# Verification — 1.10.0

- 25 focused tests pass across `cast.test.js`, `cast-integration.test.js`, `dark-content.test.js`, `catalogue-cleanup.test.js` and `mood-ranges.test.js`.
- The catalogue contains 927 unique settings across 44 categories, including all nine requested additions. Doe-eyed stays separate from Trusting during migration.
- Directed comparisons and hatred resolve names correctly for the main character, persona and supporting cast. Supporting-character hatred excludes the main and player characters. Names are escaped in the prompt.
- Cast profiles and saved defaults stay separate per main character and chat. New chats start their inherited cast off scene. Loading a saved cast restores its values and resets presence. Group generation uses the actual speaker's cast.
- Off-scene, disabled and empty profiles add no text or token count. Cast-only blends can still inject when the main character's blend is disabled. Quiet generation remains suppressed. There are no extra model requests for cast controls.
- Cast creation also works on plain HTTP LAN connections where the browser does not provide `crypto.randomUUID`.
- Browser preview checks covered adding multiple characters, selecting them, changing sliders, presence, saved defaults, restoring a saved cast through inline confirmation, named comparisons, prompt inspection and a 390px phone layout. No browser errors were reported in the final preview.
- Sample prompts without active cast remain identical to 1.9.16 for Calm, Affectionate, Masking (Outward Warmth), Horror and Jealous at maximum.
- JavaScript syntax checks and `git diff --check` pass.
- The full suite was checked before the final HTTP compatibility test was added: 37 passed and the same 19 legacy wording assertions failed as in 1.9.16. The final HTTP change and all related cast checks pass in the focused run above.

No live model requests were made. These checks verify saved state, UI behaviour and prompt construction, not how reliably a particular model will follow the settings.
