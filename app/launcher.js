// The floating launcher button, the Extensions menu entry and the /moodweaver command.
import { SELF, VERSION, ctx, folderOf, run, ui } from './state.js';
import { clamp, escapeHtml as esc } from '../engine/util.js';
import { openPanel } from '../panel/render.js';
import { clearAllPins } from '../panel/settings-sheet.js';

// ---- The ◆ Moods button, set per device ----
// Show or hide it, make it small, and drag it anywhere. Kept in this browser only, so hiding it on
// your phone doesn't hide it on your computer. The ✨ wand menu, /moods and Extensions always open
// the panel, so a hidden button never locks you out.
const LAUNCH_KEY = 'moodweaver.launcher';
export const launch = (() => {
    const base = { show: true, small: false, x: null, y: null };
    try { const saved = JSON.parse(localStorage.getItem(LAUNCH_KEY) || '{}'); return { ...base, ...(saved && typeof saved === 'object' ? saved : {}) }; } catch { return base; }
})();
function saveLaunch() { try { localStorage.setItem(LAUNCH_KEY, JSON.stringify(launch)); } catch { /* private browsing: kept for this visit */ } syncLaunchControls(); }
function safeInsets() {
    const probe = document.getElementById('moodweaver-safe');
    if (!probe) return { top: 0, right: 0, bottom: 0, left: 0 };
    const cs = getComputedStyle(probe), px = v => parseFloat(v) || 0;
    return { top: px(cs.paddingTop), right: px(cs.paddingRight), bottom: px(cs.paddingBottom), left: px(cs.paddingLeft) };
}
function launchBounds(el) {
    const s = safeInsets(), w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    const minX = s.left + 6, minY = s.top + 6;
    return { minX, minY, maxX: Math.max(minX, vw - s.right - w - 6), maxY: Math.max(minY, vh - s.bottom - h - 6) };
}
// SillyTavern puts a transform on <html>, which moves where "fixed" starts in Safari. Place it, see where
// it actually landed, and correct by the difference.
function moveLauncher(el, left, top) {
    el.style.left = `${left}px`; el.style.top = `${top}px`;
    const r = el.getBoundingClientRect(), dx = r.left - left, dy = r.top - top;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) { el.style.left = `${left - dx}px`; el.style.top = `${top - dy}px`; }
}
export function placeLauncher() {
    const el = document.getElementById('moodweaver-launcher'); if (!el) return;
    el.hidden = run.suspended || !launch.show;
    el.classList.toggle('is-small', Boolean(launch.small));
    el.innerHTML = `<span aria-hidden="true">◆</span>${launch.small ? '' : ' Moods'}`;
    if (el.hidden || launch.x == null || launch.y == null) { el.classList.remove('is-placed'); el.style.left = ''; el.style.top = ''; return; }
    el.classList.add('is-placed');
    const b = launchBounds(el);
    moveLauncher(el, b.minX + (b.maxX - b.minX) * clamp(launch.x, 0, 1), b.minY + (b.maxY - b.minY) * clamp(launch.y, 0, 1));
}
export function wireLauncher(el) {
    let drag = null;
    el.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        const r = el.getBoundingClientRect();
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, moved: false };
        try { el.setPointerCapture(e.pointerId); } catch { /* older browsers drag without capture */ }
    });
    el.addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        // A small wobble is still a tap.
        if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
        if (!drag.moved) { drag.moved = true; el.classList.add('is-placed', 'is-dragging'); }
        e.preventDefault();
        const b = launchBounds(el);
        moveLauncher(el, clamp(e.clientX - drag.ox, b.minX, b.maxX), clamp(e.clientY - drag.oy, b.minY, b.maxY));
    });
    const end = e => {
        if (!drag || e.pointerId !== drag.id) return;
        const moved = drag.moved; drag = null; el.classList.remove('is-dragging');
        if (!moved) return;
        ui.dragEndedAt = Date.now();
        const r = el.getBoundingClientRect(), b = launchBounds(el);
        launch.x = b.maxX > b.minX ? clamp((r.left - b.minX) / (b.maxX - b.minX), 0, 1) : 0;
        launch.y = b.maxY > b.minY ? clamp((r.top - b.minY) / (b.maxY - b.minY), 0, 1) : 0;
        saveLaunch();
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    // The tap that ends a drag isn't a press.
    el.addEventListener('click', e => { if (Date.now() - ui.dragEndedAt < 350) { e.preventDefault(); e.stopImmediatePropagation(); return; } openPanel(); });
    let frame = 0;
    const replace = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(placeLauncher); };
    window.addEventListener('resize', replace); window.addEventListener('orientationchange', replace);
}
export function setLaunch(changes) {
    Object.assign(launch, changes); saveLaunch(); placeLauncher();
}
// The switches in Extensions and in the panel's settings show the same thing.
function syncLaunchControls() {
    for (const box of document.querySelectorAll('[data-launch="show"]')) box.checked = Boolean(launch.show);
    for (const box of document.querySelectorAll('[data-launch="small"]')) box.checked = Boolean(launch.small);
}
export const launchSettings = () => `<label class="mw-toggle"><input type="checkbox" data-launch="show" ${launch.show ? 'checked' : ''}> Show the ◆ Moods button</label>
    <label class="mw-toggle"><input type="checkbox" data-launch="small" ${launch.small ? 'checked' : ''}> Small button (just ◆)</label>
    <p class="mw-fine">Drag the button anywhere to move it. This device remembers where. With it hidden, open Moodweaver from the ✨ wand menu next to the message box, with /moods, or from Extensions.</p>
    <div class="mw-actions"><button type="button" data-action="launch-reset"${launch.x == null ? ' disabled' : ''}>Put it back in the corner</button></div>`;
// A ◆ Moodweaver row in SillyTavern's ✨ wand menu.
export function addWandItem() {
    if (document.getElementById('moodweaver-wand')) return true;
    const menu = document.getElementById('extensionsMenu'); if (!menu) return false;
    const item = document.createElement('div');
    item.id = 'moodweaver-wand'; item.className = 'list-group-item flex-container flexGap5'; item.title = 'Open Moodweaver'; item.tabIndex = 0;
    item.innerHTML = '<div class="extensionsMenuExtensionButton fa-solid fa-gem"></div><span>Moodweaver</span>';
    item.hidden = run.suspended;
    item.addEventListener('click', () => openPanel());
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); } });
    menu.append(item);
    document.getElementById('extensionsMenuButton')?.style.removeProperty('display');
    return true;
}
// /moods opens the panel. /moods button on|off|small|big|reset changes the ◆ button on this device.
export function addSlashCommand() {
    try {
        const { SlashCommandParser, SlashCommand, SlashCommandArgument, ARGUMENT_TYPE } = ctx();
        if (!SlashCommandParser?.addCommandObject || !SlashCommand?.fromProps) return;
        const words = SlashCommandArgument?.fromProps && ARGUMENT_TYPE ? [SlashCommandArgument.fromProps({ description: 'unpin, or button on / off / small / big / reset', typeList: [ARGUMENT_TYPE.STRING], isRequired: false })] : [];
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'moods', returns: 'nothing', unnamedArgumentList: words,
            helpString: 'Opens the Moodweaver panel. <code>/moods unpin</code> unpins everything in this chat. <code>/moods button on</code>, <code>off</code>, <code>small</code>, <code>big</code> or <code>reset</code> changes the ◆ Moods button on this device.',
            callback: (_args, value) => {
                const words = String(value ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
                if (words[0] === 'unpin') { void clearAllPins().then(done => globalThis.toastr?.info(done ? `Unpinned ${done}.` : 'Nothing was pinned.', 'Moodweaver')); return ''; }
                if (words[0] !== 'button') { openPanel(); return ''; }
                const what = words[1] ?? (launch.show ? 'off' : 'on');
                if (what === 'on' || what === 'show') setLaunch({ show: true });
                else if (what === 'off' || what === 'hide') setLaunch({ show: false });
                else if (what === 'small') setLaunch({ small: true });
                else if (what === 'big') setLaunch({ small: false });
                else if (what === 'reset') setLaunch({ x: null, y: null, show: true });
                return '';
            },
        }));
    } catch (err) { console.warn('[Moodweaver] /moods is unavailable', err); }
}
// An older copy got here first. Say so where it can be seen, since only one copy can run.
export function warnDuplicate(existing) {
    const other = existing.dataset.source ? `v${existing.dataset.version} in “${folderOf(existing.dataset.source)}”` : 'an older copy';
    const msg = `Two copies of Moodweaver are installed. ${other} is the one running, so v${VERSION} in “${folderOf(SELF)}” is switched off. Delete the other one in Manage extensions, then reload.`;
    console.warn('[Moodweaver]', msg);
    globalThis.toastr?.warning(msg, 'Moodweaver', { timeOut: 0, extendedTimeOut: 0 });
    const show = () => { const entry = document.querySelector('.mw-settings-entry'); if (entry && !entry.querySelector('.mw-dup')) entry.insertAdjacentHTML('beforeend', `<p class="mw-diag mw-dup is-bad">${esc(msg)}</p>`); };
    show(); setTimeout(show, 1500);
}
