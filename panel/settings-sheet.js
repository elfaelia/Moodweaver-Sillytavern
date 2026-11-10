// The settings sheet, and clearing pins or everything.
import { persist, personKeyOfSubject, playerName, subjectName, target } from '../app/chat.js';
import { launchSettings } from '../app/launcher.js';
import { syncPrompt } from '../app/note.js';
import { bondList } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { KEY, ctx, ui } from '../app/state.js';
import { cleanBoardMeta } from '../engine/board.js';
import { METERS, cleanBond, setMeter } from '../engine/bond.js';
import { escapeHtml as esc } from '../engine/util.js';
import { freshState } from '../engine/state.js';
import { changeState, render } from './render.js';

export function settingsView(state) {
    const whose = ui.who === 'user' ? playerName() : ui.who === 'story' ? 'the story' : subjectName();
    return `<section class="mw-settings">
        <div class="mw-settings-head"><button type="button" class="mw-back" data-action="settings-close">‹ Back</button><b>Settings</b><small>${esc(whose)}</small></div>
        <details class="mw-advanced" data-settings="launcher"><summary>◆ Moods button <small>this device</small></summary>${launchSettings()}</details>
        <details class="mw-advanced" data-settings="sent" open><summary>What is sent to the model</summary>
            <p class="mw-fine">Moodweaver’s own note only. Your card, preset, lore and chat history get sent too.</p>
            <label class="mw-toggle"><input type="checkbox" data-field="sceneBreathing" ${state.sceneBreathing !== false ? 'checked' : ''}> Tell it to keep scenes moving</label>
            <label class="mw-field mw-shows-mode">How feelings show<select data-setting-choice="showsMode" aria-label="How feelings show">${[['all', 'Default wording + yours'], ['mine', 'Only what you wrote'], ['off', 'Off: names only']].map(([v, l]) => `<option value="${v}" ${settings().showsMode === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            <p class="mw-fine">Every active feeling can tell Claude how it shows. “Only what you wrote” sends just the “shows as” boxes you filled in, for the feelings that need them. Nothing is deleted when you switch.</p>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="blendPlan" ${settings().blendPlan ? 'checked' : ''}> Ask it to plan the blend while thinking</label>
            <p class="mw-fine">Off by default. Opus 5.5 already decides how much to think; Anthropic found lines like this mostly add billed thinking and slower starts.</p>
            <div data-token-count class="mw-token-count"></div><p data-budget-warning class="mw-fine" hidden></p><pre data-audit></pre>
            <b class="mw-pre-label">Ready to send</b><pre data-preview></pre>
            <b class="mw-pre-label">Last reply</b><pre data-last-prompt></pre></details>
        <details class="mw-advanced" data-settings="board"><summary>Info board</summary>
            <p class="mw-fine">Every chat follows these until you flip its own switch on the Needs tab.</p>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardSend" ${settings().boardSend ? 'checked' : ''}> Send the board prompt</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardPresent" ${settings().boardPresent ? 'checked' : ''}> Present line moves the cast in and out</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardStrip" ${settings().boardStrip ? 'checked' : ''}> Keep old boards out of the prompt</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardWithWeave" ${settings().boardWithWeave ? 'checked' : ''}> Board words move feelings too, alongside the hidden line</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardPins" ${settings().boardPins ? 'checked' : ''}> Let me pin and correct things on the board</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardMemories" ${settings().boardMemories ? 'checked' : ''}> Save turning points as memories</label>
            <p class="mw-fine">Pins and memories are off by default. Off, nothing is asked for or sent, and what you'd already saved stays put for if you switch them back on.</p>
            <p class="mw-fine">Each board is about 200 tokens. The newest one is summarised in one line instead, so a long chat gets thousands of tokens back for story. You still see every board in the chat.</p>
            <p class="mw-fine">With the prompt on, delete INFO BOARD from your preset so it isn’t sent twice. The HTML is identical, so your regex keeps working.</p></details>
        ${(() => { const n = pinCounts(), words = n ? pinWords(n) : ''; return `<details class="mw-advanced" data-settings="pins"><summary>Pins in this chat <small>${words ? 'some set' : 'none'}</small></summary>
            <p class="mw-fine">${words ? `Right now: ${esc(words)}.` : 'Nothing is pinned in this chat.'} Unpinning everything covers everyone in this chat: ${esc(target()?.name ?? 'the character')}, ${esc(playerName())}, the cast and the story. Sliders and meters keep their values and can move again. Needs you set and board corrections go back to following the board. Saved defaults for new chats aren't changed.</p>
            <div class="mw-actions"><button type="button" class="mw-danger" data-action="unpin-all"${words ? '' : ' disabled'}>Unpin everything</button></div></details>`; })()}
        <details class="mw-advanced" data-settings="fresh"><summary>Clear everything <small>${esc(whose)}</small></summary>
            <p class="mw-fine">Turns off every moodlet, trait, turn-on, fact, want, item and skill for ${esc(whose)} in this chat, and their relationships (their side, both-ways and memories). Pins come off. Bonds meters, the board and saved defaults stay.</p>
            <label class="mw-toggle"><input type="checkbox" data-keep-types checked> Keep personality types</label>
            <div class="mw-actions"><button type="button" class="mw-danger" data-action="clear-everything">Clear everything</button>${state.lastCleared ? '<button type="button" data-action="clear-undo">↺ Bring it back</button>' : ''}</div></details>
        <details class="mw-advanced" data-settings="defaults"><summary>Defaults for new chats</summary>
            <p class="mw-fine">Each chat keeps its own settings. Saving a default seeds ${esc(whose)}’s future chats; existing chats stay as they are.</p>
            <div class="mw-actions"><button data-action="baseline">${ui.who === 'cast' ? 'Save the whole cast' : ui.who === 'user' ? 'Save persona default' : ui.who === 'story' ? 'Save story default' : 'Save character default'}</button><button data-action="reset">Clear unpinned moodlets</button></div></details>
        <details class="mw-advanced" data-settings="limits"><summary>Prompt & reader limits</summary>
            <label>Token target <input type="number" data-setting="tokenBudget" min="160" max="3000" value="${settings().tokenBudget}"></label>
            <label>Depth from the end <input type="number" data-setting="depth" min="0" max="10" step="1" value="${settings().depth}"></label>
            <p class="mw-fine">The target only warns; nothing is cut. Depth 0 puts the note after your latest message (best); 1 puts it before.</p>
            <label>Reader text cap <input type="number" data-setting="sceneChars" min="2000" max="40000" step="1000" value="${settings().sceneChars}"></label>
            <label title="Thinking models (Claude Opus 5.5 always thinks) spend part of this before writing the JSON. Around 4000 suits them.">Reader reply cap <input type="number" data-setting="outputTokens" min="300" max="16000" step="100" value="${settings().outputTokens}"></label>
            <p class="mw-fine">Text cap is in characters. Raise the reply cap if a thinking model runs out before it answers.</p></details>
    </section>`;
}
// Every pin in this chat, for everyone in it. Values stay where they are; they just stop being
// held. Needs you set and board corrections go back to following the board. Saved defaults aren't touched.
function chatStates(meta) {
    return [...Object.values(meta?.characters ?? {}), meta?.user, meta?.story, ...Object.values(meta?.cast ?? {}).flat().map(p => p?.state)].filter(st => st && typeof st === 'object');
}
export function pinCounts() {
    const meta = ctx().chatMetadata?.[KEY]; if (!meta) return null;
    const b = cleanBoardMeta(meta.board);
    return {
        sliders: chatStates(meta).reduce((n, st) => n + Object.values(st.pins ?? {}).filter(Boolean).length, 0),
        meters: Object.values(meta.bond ?? {}).reduce((n, bond) => n + Object.values(cleanBond(bond).pins).filter(v => v !== null).length, 0),
        ...(settings().boardPins ? { needs: Object.keys(b.needs).length, fixes: Object.keys(b.fix).length, kept: b.keep.state.length + b.keep.physical.length } : { needs: 0, fixes: 0, kept: 0 }),
    };
}
export const pinWords = n => [[n.sliders, 'slider'], [n.meters, 'meter'], [n.needs, 'need you set', 'needs you set'], [n.fixes, 'board correction'], [n.kept, 'kept board tile']]
    .filter(([v]) => v).map(([v, one, many]) => `${v} ${v === 1 ? one : many ?? `${one}s`}`).join(', ');
export async function clearAllPins() {
    const c = ctx(), meta = c.chatMetadata?.[KEY], n = pinCounts(); if (!meta || !n) return '';
    for (const st of chatStates(meta)) {
        let moved = false;
        for (const id of Object.keys(st.pins ?? {})) if (st.pins[id]) { st.pins[id] = false; moved = true; }
        if (moved) st.revision = (st.revision || 0) + 1;
    }
    // A meter keeps the value it was pinned at, and later replies move it from there.
    for (const [key, raw] of Object.entries(meta.bond ?? {})) {
        const bond = cleanBond(raw, settings().bondTrack), ch = c.characters.find(x => `char:${x.avatar}` === key);
        for (const k of METERS) if (bond.pins[k] !== null) { const v = bond.pins[k]; bond.pins[k] = null; if (ch) setMeter(bond, k, v, bondList(ch)); }
        meta.bond[key] = bond;
    }
    const b = cleanBoardMeta(meta.board); b.needs = {}; b.fix = {}; b.keep = { state: [], physical: [] }; meta.board = b;
    await persist(); await syncPrompt(); render();
    return pinWords(n);
}
// ---- Clear everything for one person, with a way back ----
export async function clearEverything(keepTypes) {
    const meta = ctx().chatMetadata?.[KEY], me = personKeyOfSubject();
    await changeState(s => {
        const pairs = Object.fromEntries(Object.entries(meta?.pairs ?? {}).filter(([, p]) => (p?.members ?? []).includes(me)));
        s.lastCleared = { at: Date.now(), state: structuredClone({ ...s, history: [], lastCleared: null }), pairs: structuredClone(pairs) };
        const blank = freshState({});
        for (const id of Object.keys(s.moods)) { s.moods[id] = 0; s.pins[id] = false; }
        Object.assign(s, { causes: {}, shows: {}, prefs: {}, inventory: [], wants: [], relationships: [], skills: {}, skillAlways: {}, reason: '', targets: blank.targets, loadout: [] });
        if (!keepTypes) Object.assign(s, { personality: blank.personality, enneagram: blank.enneagram });
        for (const id of Object.keys(pairs)) delete meta.pairs[id];
    });
}
export async function undoClear() {
    const meta = ctx().chatMetadata?.[KEY];
    await changeState(s => {
        const saved = s.lastCleared; if (!saved?.state) return;
        const history = s.history; Object.assign(s, saved.state, { history, lastCleared: null });
        for (const [id, p] of Object.entries(saved.pairs ?? {})) (meta.pairs ??= {})[id] = p;
    });
}
