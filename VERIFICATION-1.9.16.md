# Verification — 1.9.16

- Sixteen focused tests pass across `dark-content.test.js`, `catalogue-cleanup.test.js`, `migration-all-ids.test.js`, and `mood-ranges.test.js`.
- The catalogue has 918 unique sliders in 44 categories. This release adds 75 sliders, including three new collapsible sections: Fighting style, Combat direction, and Dark story pressure.
- Every new setting defaults to zero and unpinned in an older save. An empty blend still sends nothing, so the larger catalogue costs no roleplay tokens until something is enabled.
- Checked maximum Murderous, Serial killer, and Has killed before, will kill again together. The prompt describes each setting and adds shared instructions to make severe choices behavioural, allow follow-through, and permit irreversible harm or death at maximum.
- Checked Yandere at 4 and 100. The faint wording stays watchful and possessive; maximum explicitly covers stalking, abduction, and lethal violence for the fixation.
- Checked maximum Horror, Offensive fiction, Dead Dove, Murder plot, and Gory combat together. Each remains present at full strength, and the shared story instructions require concrete stakes and consequences instead of grim decoration.
- Checked character fighting styles and story combat direction in the same prompt. Krav Maga, Sudden combat, Remorseless, Realistic combat, Lasting injuries, and Combat aftermath all survive at their own strengths.
- Every new non-story setting has concrete prompt wording. New story settings use their catalogue descriptions in the generated prompt rather than sending labels alone.
- All old IDs still migrate to live sliders without changing their strengths or pins. Combined historical entries keep the strongest value rather than summing it.
- JavaScript syntax checks and `git diff --check` pass.
- The repository's full legacy suite has the same 19 stale exact-wording failures as 1.9.15. The seven new tests pass, and the catalogue-count assertion affected by this release was updated.

No model requests were made. These checks verify catalogue migration and prompt construction, not whether a particular model will always obey the prompt.
