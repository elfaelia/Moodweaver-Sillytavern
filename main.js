import { getState, identity, persist, target } from './app/chat.js';
import { addSlashCommand, addWandItem, launch, placeLauncher, setLaunch, warnDuplicate, wireLauncher } from './app/launcher.js';
import { startGenerating, stopGenerating, syncPrompt, syncPromptNow } from './app/note.js';
import { analyse, cancelAnalysis } from './app/reader.js';
import { queueBoard, reconcile } from './app/replies.js';
import { settings } from './app/settings.js';
import { SELF, VERSION, clearNotes, ctx, generationSnapshots, run, ui } from './app/state.js';
import { hasBoard, stripBoard } from './engine/board.js';
import { onPanelChange, onPanelClick, onPanelInput, onPanelKeydown, onPanelSwipe } from './panel/events.js';
import { onGroupToggle, openPanel, render, renderPreview, tapGlow, toggleTop, typingInPanel } from './panel/render.js';
import { sheetSwipe } from './panel/skills-tab.js';
import { hasWeave, stripWeave } from './engine/weave.js';
import { afterReply, initMusic, musicLine, onMusicChange } from './app/music.js';
import { musicFold } from './panel/music-tab.js';

// Open SillyTavern with ?mwoff on the end of the address to start it with Moodweaver switched off on that device.
const SAFE_OFF = /[?&]mwoff\b/i.test(location.search);

globalThis.moodweaverBeforeGeneration = async (chat, _contextSize, _abort, type) => {
    // Weave lines never reach the model, and neither do old boards (the newest is summarised in the note).
    // Every message is cleaned the same way every time, so history stays identical between turns and the cache keeps matching.
    const stripBoards = !run.suspended && settings().boardStrip && Boolean(getState(target(true)));
    if (Array.isArray(chat)) for (let i = 0; i < chat.length; i++) {
        const m = chat[i], mes = m?.mes; if (typeof mes !== 'string') continue;
        let next = hasWeave(mes) ? stripWeave(mes) : mes;
        // On Continue, the reply being continued keeps its board, so a reply cut off inside its
        // board is finished from where it stopped.
        const continuing = type === 'continue' && i === chat.length - 1;
        if (stripBoards && !continuing && !m.is_user && hasBoard(next)) { const cut = stripBoard(next); if (cut.trim()) next = cut; }
        if (next !== mes) chat[i] = { ...structuredClone(m), mes: next };
    }
    if (run.suspended || ['quiet', 'impersonate'].includes(type)) {
        ++run.promptVersion; clearNotes(ctx()); return;
    }
    // Settle the chat first. A regenerate deletes the old reply a moment before this runs and a
    // swipe still holds the old swipe's text, so without this the new reply would be written with the
    // old one's feelings, needs, memory and board still in place.
    const settled = reconcile(type);
    if (settled.changed) { if (settled.notes.length) run.status = settled.notes.join(' '); void persist(); }
    startGenerating();
    const ch = target(true), state = getState(ch);
    if (state?.enabled && state.mode === 'dynamic' && !['swipe', 'regenerate', 'continue'].includes(type)) await analyse(false, 'char', ch);
    await syncPrompt(true, chat, type);
    generationSnapshots.set(identity(ch), { at: new Date().toLocaleString(), depth: settings().depth, prompt: run.promptInfo.prompt, fixed: run.promptInfo.fixed ?? '' });
    if (generationSnapshots.size > 20) generationSnapshots.delete(generationSnapshots.keys().next().value);
    renderPreview();
};
function setup() {
    if (SAFE_OFF) return;
    const existing = document.getElementById('moodweaver-panel');
    if (existing) { if (existing.dataset.source !== SELF) warnDuplicate(existing); return; }
    settings();
    ui.panel = document.createElement('dialog'); ui.panel.id = 'moodweaver-panel'; ui.panel.className = 'mw-panel'; ui.panel.tabIndex = -1;
    ui.panel.setAttribute('aria-label', 'Moodweaver character moods'); ui.panel.dataset.version = VERSION; ui.panel.dataset.source = SELF; document.body.append(ui.panel);
    const probe = document.createElement('div'); probe.id = 'moodweaver-safe'; probe.setAttribute('aria-hidden', 'true'); document.body.append(probe);
    const launcher = document.createElement('button'); launcher.id = 'moodweaver-launcher'; launcher.type = 'button';
    launcher.title = 'Open Moodweaver (drag to move)'; launcher.setAttribute('aria-label', 'Open Moodweaver'); launcher.setAttribute('aria-controls', ui.panel.id);
    document.body.append(launcher); wireLauncher(launcher); placeLauncher();
    const settingsHost = document.querySelector('#extensions_settings2') ?? document.querySelector('#extensions_settings');
    if (settingsHost) {
        const entry = document.createElement('div'); entry.className = 'mw-settings-entry';
        entry.innerHTML = `<b>◆ Moodweaver</b> <small class="mw-ver">v${VERSION}</small><p>Character moods, blended your way.</p><button class="menu_button" data-mw-open>Open mood panel</button>
            <label class="checkbox_label mw-entry-toggle"><input type="checkbox" data-launch="show" ${launch.show ? 'checked' : ''}><span>Show the ◆ Moods button on this device</span></label><p class="mw-diag" data-mw-diag hidden></p>`;
        entry.querySelector('[data-mw-open]').onclick = openPanel;
        entry.querySelector('[data-launch="show"]').addEventListener('change', e => setLaunch({ show: e.target.checked }));
        settingsHost.append(entry);
    }
    if (!addWandItem()) { let tries = 0; const again = setInterval(() => { if (addWandItem() || ++tries > 20) clearInterval(again); }, 500); }
    addSlashCommand();
    // A chat redraw that waited for you runs a moment after you leave the field or lift your finger: long
    // enough for the tap that moved focus (on "＋ Remember", say) to land on the button it was aimed at.
    const later = () => setTimeout(() => { if (ui.renderLater && !typingInPanel()) render(); }, 350);
    ui.panel.addEventListener('focusout', later);
    ui.panel.addEventListener('pointerdown', () => { ui.pointerInPanel = true; }, { passive: true });
    for (const type of ['pointerup', 'pointercancel']) window.addEventListener(type, () => { if (ui.pointerInPanel) { ui.pointerInPanel = false; later(); } }, { passive: true });
    ui.panel.addEventListener('scroll', toggleTop, { passive: true });
    ui.panel.addEventListener('input', onPanelInput);
    ui.panel.addEventListener('keydown', onPanelKeydown);
    ui.panel.addEventListener('change', onPanelChange);
    ui.panel.addEventListener('click', tapGlow, true);
    ui.panel.addEventListener('click', onPanelClick);
    let touch = null;
    // A swipe is remembered from its start: where, when, and how far the panel was scrolled (a scroll is not a swipe).
    ui.panel.addEventListener('touchstart', e => { const t = e.touches[0]; touch = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, target: e.target, at: Date.now(), top: ui.panel.scrollTop, left: ui.panel.scrollLeft, maxDy: 0 } : null; }, { passive: true });
    ui.panel.addEventListener('touchmove', e => { const t = e.touches[0]; if (touch && t) touch.maxDy = Math.max(touch.maxDy, Math.abs(t.clientY - touch.y)); if (e.touches.length > 1) touch = null; }, { passive: true });
    ui.panel.addEventListener('touchend', e => { const t = e.changedTouches[0]; if (touch && t) onPanelSwipe({ ...touch, scrolled: ui.panel.scrollTop !== touch.top || ui.panel.scrollLeft !== touch.left, width: ui.panel.clientWidth }, { x: t.clientX, y: t.clientY, at: Date.now() }); touch = null; }, { passive: true });
    sheetSwipe(ui.panel, () => render());
    ui.panel.addEventListener('toggle', onGroupToggle, true);
    ui.panel.addEventListener('toggle', musicFold, true);
    // Music: songs from your Spotify playlists, picked for the scene after each reply (app/music.js).
    run.afterBoard = () => void afterReply().catch(err => console.warn('[Moodweaver] music', err));
    run.musicLine = musicLine;
    onMusicChange(() => { if (ui.panel?.open && ui.tab === 'music' && !ui.settingsOpen) render(true); });
    try { initMusic(); } catch (err) { console.warn('[Moodweaver] music could not start', err); }
    const c = ctx();
    c.eventSource.on(c.eventTypes.CHAT_CHANGED, () => {
        cancelAnalysis(); ui.selectedAvatar = ''; ui.selectedCastId = ''; ui.selectedPeer = ''; ui.removingRelation = ''; ui.castAction = ''; run.status = ''; ui.boardEditing = false; ui.boardFocus = '';
        run.generating = false; run.resyncAfter = false; clearTimeout(run.genTimer);
        ++run.promptVersion; clearNotes(c);
        render(); void syncPromptNow();
        // Bring the newly opened chat up to date (and move it from older versions) straight away.
        queueBoard();
    });
    c.eventSource.on(c.eventTypes.GENERATION_STOPPED, () => { cancelAnalysis(); stopGenerating(); queueBoard(); });
    c.eventSource.on(c.eventTypes.GENERATION_ENDED, () => { stopGenerating(); queueBoard(); });
    for (const event of ['MESSAGE_RECEIVED', 'CHARACTER_MESSAGE_RENDERED', 'MESSAGE_SWIPED', 'MESSAGE_SWIPE_DELETED', 'MESSAGE_EDITED', 'MESSAGE_UPDATED', 'MESSAGE_DELETED', 'CHARACTER_FIRST_MESSAGE_SELECTED']) {
        if (c.eventTypes[event]) c.eventSource.on(c.eventTypes[event], queueBoard);
    }
    c.eventSource.on(c.eventTypes.GENERATION_AFTER_COMMANDS, (type, _args, dryRun) => {
        if (['quiet', 'impersonate'].includes(type)) { ++run.promptVersion; clearNotes(c); }
        else if (dryRun) return syncPrompt(true);
    });
    for (const event of ['CONNECTION_PROFILE_CREATED', 'CONNECTION_PROFILE_DELETED', 'CONNECTION_PROFILE_UPDATED']) {
        if (c.eventTypes[event]) c.eventSource.on(c.eventTypes[event], () => { if (ui.panel.open) render(true); });
    }
    render(); void syncPromptNow();
}
// jQuery ready also works when installed after APP_READY has fired.
if (typeof jQuery === 'function') jQuery(setup); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();
export function onDisable() {
    run.suspended = true; ++run.promptVersion; cancelAnalysis();
    clearNotes(ctx());
    ui.panel?.close();
    for (const node of document.querySelectorAll('#moodweaver-panel, #moodweaver-launcher, #moodweaver-wand, .mw-settings-entry')) node.hidden = true;
}
export function onEnable() {
    run.suspended = false;
    if (!ui.panel) setup();
    for (const node of document.querySelectorAll('#moodweaver-panel, #moodweaver-wand, .mw-settings-entry')) node.hidden = false;
    placeLauncher(); queueBoard();
    void syncPromptNow();
}
