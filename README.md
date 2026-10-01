# Moodweaver

A SillyTavern mood panel inspired by Sims moodlets: blendable feelings, gradual changes, and a separate emotional state for each character in each chat. Built against SillyTavern **1.19.0** on 29 September 2026.

## Start here

Reload SillyTavern after installation, open a character chat, and click **◆ Moods** at the lower right. There is also an **Open mood panel** button in Extensions settings.

1. In **Manual**, move a slider or add a starter blend. Zero means that mood contributes no direction. Feelings do not need to add up to 100.
2. Use search or expand one of nine categories. Clicking a mood chip jumps to its slider.
3. In **Dynamic**, choose a saved **Connection Profile** for the scene analyser. The actual stored model is displayed in brackets after the profile name. A profile's name is not proof of which model it contains.
4. Click **Read scene now**, or send your next normal message. This makes an extra request to the selected profile. It does not change your selected roleplay model.
5. Pin moods with the diamond button. Moving a slider in Dynamic automatically pins that level. A pinned zero keeps a feeling absent. Unpin to allow automatic changes again.

The extension starts in Manual with no active moods and no analyser profile selected. It does not initiate paid requests on installation. To stop its prompt contribution for a chat/character, uncheck **Enabled**.

## What is included

Version 1.9.8 includes **869 sliders in 40 collapsible categories**. There are five additive starter blends; these preserve pinned values and leave unrelated moods alone.

### What the character knows about your persona

In your persona tab, expand **What [character] knows**. Only active persona tags appear, showing their existing strength alongside a knowledge selector. This applies to moods as well as traits and facts:

- **Scene only** (default): use visible evidence and what the chat already established.
- **Private**: the character does not know it; your visible words or behaviour can still give it away.
- **Suspected**: an existing impression, without certainty.
- **Known**: established knowledge. An optional source can explain whether they were told, witnessed something, or read a report; a report is not automatically true.

Strength describes the persona and how much an individual setting shapes the portrayal. Knowledge controls the observer's access to it, without revealing exact intensity or every later change of mood. The player keeps control of their speech, actions and thoughts. Knowledge choices are saved per chat, observing character avatar and persona name; they are not copied into character or persona defaults. Turning a tag off stops sending it and its source, while retaining its knowledge choice for reuse. Rename a persona and its knowledge choices start separately.

Each active persona tag appears once in the prompt, grouped by knowledge status with its existing strength word. No extra per-tag instructions or numerical scores are added. Optional source notes are capped at 120 characters. The persona guidance replaces the earlier longer paragraphs. Use the inspector for your exact token count; it remains a soft target, not a hard cap. UI and prompt-construction tests do not guarantee model adherence.

### Mixing and strengths

Moods reach the roleplay model as words, not numbers. Each active slider is placed under the same strength word shown in the panel: Faint 1–10, Subtle 11–20, Mild 21–40, Clear 41–60, Strong 61–80, Intense 81–90, Overwhelming 91–99, and Maximum 100. Each occupied band gets one plain sentence explaining how much attention and influence it should have. The prompt tells the model to weave compatible and conflicting settings together, with the strongest leading instead of being averaged down. Only active sliders are sent.

Labels that could be misread (masking, stoic, emotionless, lying, daddy, fatherly and a few others) carry a short note in brackets. Everything else is sent as its plain name, since the model already knows what "angry" means.

**Give scenes breathing room** remains a per-chat option in the inspector. It asks the model to weigh redirection against obligations, opportunities and the whole blend. It no longer contains scenario-specific prohibitions. This pacing preference does not activate a mood or expression modifier.

Expand **What is sent to the model?** below the categories to see the exact current Moodweaver contribution, included-state count, tokenizer count, and last generation preparation. Snapshots are held in memory for up to 20 chat/character combinations and disappear on refresh. They show what this extension queued, not proof of a successful API request or the complete assembled prompt. SillyTavern's own message prompt inspector also includes cards, presets, lore, history and other extensions.

The seven-state example blend is a regression fixture, including Enamoured 10 and Sexually frustrated 4. With the fixture name Alex, it measures **363 tokens** using the installed SillyTavern Claude tokenizer (about 430 by the test character estimate). The panel uses your selected tokenizer; provider billing counts may differ. Tests also check all 9,730 distinct pairs in both weak/strong orders. These are compiler tests, not paid Opus behaviour evaluations. See `example-blend.txt` for the compiled example.

Comparable work: [BetterSimTracker](https://github.com/ghostd93/BetterSimTracker) uses hidden numeric relationship guidance; its [prompt-system documentation](https://github.com/ghostd93/BetterSimTracker/blob/main/docs/prompt-system.md) distinguishes state extraction from behaviour injection. Moodweaver keeps every selected value instead of trimming state rows. [Anthropic's prompting guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) supports clear instructions, context and XML structure. This scale is Moodweaver's prompt design, not a documented Claude emotion-control API. The [Opus 5.5 guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5) does not provide measured emotional-slider fidelity.

New catalogue entries: Adoring, Content, Patient, Relaxed, Cynical, Grounded, Smug, Caring, Disappointed, Yearning, Aloof, Distant, Apprehensive, Hesitant, Delighted, Humble, Narcissistic, Psychopathic, Sociopathic, Maniacal, Deliberate, Argumentative, Assertive, Introverted, Extroverted, Intuitive, Egotistical, Fatherly, Paranoid, Unhinged, God Complexed, Histrionic and Clinical. **Mindsets & psychological states** groups dramatic psychological descriptors, including the existing Emotionless, Insane and Traumatised sliders. IDs stay stable so moving categories preserves saved levels. These labels are fictional portrayal cues, not diagnoses or automatic motives for violence.

New appetite options: Bratty, Brat tamer, Ritual oriented, Protocol oriented, Sensation seeking, Anticipation and Aftercare oriented.

**Appetites & dynamics:** Master, Daddy, Dominant, Submissive, Service top, Masochist, Sadist, Owner, Switch, Service submissive, Praise seeking, Praise giving, Teasing, and Gentle dominant. These use the same intensity, pinning, blending and per-chat persistence as moods. Intensity describes the strength of a current preference, not experience or an established relationship agreement.

New moods are grouped as follows:

- **Connection & closeness:** Helpful, Caretaker, Needy, Codependent, Soft.
- **Desire & attachment:** Sensual.
- **Friction & conflict:** Spiteful, Callous, Abusive, Controlling, Domineering, Ruthless.
- **Vulnerability & unease:** Desperate, Pleading, Losing control, Pathetic.
- **Spark & momentum:** Intrigued, Experimental.
- **Composure & intention:** Masking (Outward Warmth), Masking (Outward Coldness), Masking (Outwardly Emotive), Masking (Outwardly Less Emotive), Stern, Logical, Lying, Morbid.
- **Mindsets & psychological states:** Emotionless, Insane, Traumatised.
- **Energy & condition:** Careless.

Masking governs outward presentation while preserving other feelings underneath. Emotionless describes felt numbness, whereas Stoic describes restraint. Insane is used as a dramatic description of erratic thinking, not a diagnosis. Dynamic analysis distinguishes ordinary care/authority from adult role preferences and consensual dynamics from abuse. New sliders start at zero in existing chats; saved moods, pins, settings and history are preserved. Only selected states are sent to the roleplay model; adding catalogue options alone adds no prompt tokens. The analyser's vocabulary grows to recognise the new options.

The scale is **Off → Faint → Subtle → Mild → Clear → Strong → Intense → Overwhelming → Maximum**. Exact ranges are 0, 1–10, 11–20, 21–40, 41–60, 61–80, 81–90, 91–99, and 100. Intensity is a storytelling influence, not a probability or guaranteed action. “Stoic” describes outward restraint and can coexist with intense feelings. “Drunk” and “High” require established scene context.

## Separate chats and characters

Values, pins, mode, analyser profile, rhythm controls, and ten undo snapshots live in `chatMetadata.moodweaver.characters`, keyed by character avatar. Switching chats restores that chat's state automatically. Group chats keep independent character states; generation uses the drafted speaker's state. The panel's character selector lets you edit a group member independently.

**Save character default** stores a reusable starting configuration for that character's future chats in extension settings. Existing chats keep their own state. New characters start neutral. Chat duplication/branching copies the source metadata, so a branch starts with the original feelings and can then diverge. Renaming/changing a character's avatar file may give it a new state key. Mood history is not tied to message checkpoints: deleting or swiping a message does not rewind earlier moods. Use **Undo last read** or edit sliders when revising a scene.

## How dynamic mode works

A separate request receives the last eight visible messages (up to 12,000 text characters), a short character excerpt, current nonzero moods, and pinned IDs. It receives no worldbook, roleplay preset prompt, hidden system messages, images, attachments, or stored reasoning. It may therefore miss context established outside that window. Pins and manual corrections are useful for that limitation.

The analyser returns a small JSON mood map and a one-sentence scene observation. Only known mood IDs and numeric 0–100 values are accepted. Its prose is shown as plain text in the panel, not inserted into the roleplay prompt. Failures retain the previous moods. Requests time out after 45 seconds, can be stopped, and are discarded if the chat, scene text, or controls changed while they were running. There is no automatic fallback to a more expensive model and no retry loop.

At the defaults, **Sensitivity 50** permits a maximum movement of 20 points per read; **Inertia 60** applies 40% of the distance to the estimated target. Absent unpinned moods slowly fade, while explicit zero estimates resolve them faster. This is turn/read-based carryover, not wall-clock decay: leaving your computer overnight does not erase feelings. Manually pressing Read scene again can continue changing levels even without a new message. Normal generation deduplicates an unchanged scene. Swipes, regenerations, continuations, quiet generations, impersonations, and prompt dry runs do not trigger automatic analysis. The interval control reduces analysis frequency across new user turns.

## Hidden prompt and token budgets

The extension uses SillyTavern's `setExtensionPrompt` with an in-chat user-role injection, by default at **depth 0**, immediately after the latest chat message. Depth is adjustable under *Prompt, budgets & character defaults*. It never edits your card, preset, Author's Note or messages, and SillyTavern's prompt inspector can still show it.

The token target (default 800) is a soft warning. Active sliders and their wording are never dropped or shortened; the panel reports any overrun.

Analyser defaults: eight recent messages, 12,000 scene text characters, 4,000 character-description/personality characters combined, and an 800-output-token cap. The scene cap is characters, not tokens. The analyser also needs tokens for its instructions, mood vocabulary and current values. Budget settings are global. Reasoning models may consume their output allowance on thinking before returning JSON; use a small non-reasoning model or raise the analyser output cap if responses truncate.

## Claude Opus 5.5 notes

The current official model ID is `claude-opus-5-5`; a router may use a different prefixed ID. The mood prompt is model-agnostic and follows Anthropic's advice to give clear, structured instructions with descriptive XML tags. No special Opus-only mood syntax is required. Start with a few meaningful feelings rather than activating the entire catalogue. Disable overlapping mood toggles in your old preset if they contradict the extension; this extension does not rewrite your preset for you. [Anthropic prompting guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices).

Opus 5.5 requires adaptive thinking; do not send `thinking.type: disabled` or a manual thinking budget. Start at low or medium effort for chat and leave room in the main reply token allowance for thinking plus visible text. Moodweaver does not change those connection settings. The installed backend contains Claude 5/adaptive-thinking handling, but no live Opus 5.5 request was made during development. [Opus 5.5 prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5), [API changes](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5).

Preserved thinking is a separate integration concern: replaying signed reasoning after changing earlier context can be rejected on applicable API accounts. This implementation sends the current mood near the end of the prompt and never reads or edits reasoning blocks. The inspected SillyTavern source only enables encrypted reasoning signatures for Google/Gemini routes, not Claude. If a future version or your proxy preserves Claude thinking blocks, changing/removing old temporary injections can still change the signed prefix. Verify that route's supported handling before assuming compatibility. Moodweaver does not bypass or repair provider reasoning validation. [Preserved-thinking change](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5#thinking-blocks-are-tied-to-the-model-and-the-conversation).

For a cheaper classifier, Claude Haiku 4.5 is a reasonable starting candidate, not a tested quality guarantee: official base rates are $1/$5 per million input/output tokens versus Opus 5.5's $4/$20. A 2,000-input/150-output-token Haiku read would be about $0.00275 before router adjustments. Choose based on the stored model shown in brackets. Moodweaver deliberately ignores the profile's roleplay generation preset for analysis, while using its model, endpoint/proxy and saved secret reference through SillyTavern. [Official model comparison](https://platform.claude.com/docs/en/models/overview).

## Installation and removal

In SillyTavern, open **Extensions → Install extension** and paste:

```text
https://github.com/elfaelia/Moodweaver-Sillytavern
```

Reload SillyTavern, then open **◆ Moods**. Git installations can use SillyTavern's extension update controls. Private repositories require GitHub authentication on the machine running SillyTavern.

If upgrading from a manually copied Moodweaver folder, remove that old extension folder before installing from the URL so two copies do not run together. Keep chat metadata and extension settings; their stable Moodweaver keys preserve saved blends.

For manual installation, copy the repository contents into either:

- `SillyTavern/public/scripts/extensions/third-party/moodweaver` (all users), or
- `SillyTavern/data/<user-handle>/extensions/moodweaver` (one user).

The runtime needs `manifest.json`, `index.js`, `core.js` and `style.css`; include this README and LICENSE. Reload the browser. No server plugin, build step, new dependency, API key file, or SillyTavern source change is required.

To remove it, disable it in Manage Extensions and reload, or move its folder out of the extensions directory and reload. Existing mood metadata stays in your chat files but becomes inactive. Remove only the `moodweaver` metadata/settings entries if you want to erase that data; no other chat content needs changing.

## Development and verification

Run `node --test tests/*.test.js`. Tests cover the catalogue, complete blend preservation and token-target reporting, strict parsing, smoothing, pins, chat isolation, group speakers, late results, deduplication and generation exclusions.

Run `node preview-server.mjs` and open `http://127.0.0.1:8768` for a simulated interactive preview using the actual UI module. It makes no paid calls and does not use real chats. Desktop and 390px-wide layouts were inspected, including search, pins, mode changes, analysis and chat switching. The real SillyTavern load check is recorded in `VERIFICATION.md`.

Research references: [SillyTavern UI extensions](https://docs.sillytavern.app/for-contributors/writing-extensions/), [Connection Profiles](https://docs.sillytavern.app/usage/core-concepts/connection-profiles/). Local source contracts were checked in `public/scripts/st-context.js`, `public/scripts/extensions/shared.js`, `public/scripts/extensions.js`, `public/script.js`, `public/scripts/group-chats.js`, and `public/scripts/openai.js`.

