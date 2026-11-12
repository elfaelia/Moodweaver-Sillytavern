// Drawing the panel, keeping search filters and scroll position, and the status lines.
import { autoOpened, currentPeer, getKnowledge, getState, identity, keyForTarget, members, migratePairs, openRelationGroups, peers, persist, personKeyOfSubject, playerName, selectedCast, subjectName, swapTarget, target, viewState } from '../app/chat.js';
import { syncPrompt } from '../app/note.js';
import { readerProfile } from '../app/reader.js';
import { boardMemoryCount, boardPeople, boardSend, bondAxes, bondData, bondList, bondOverlaps, liveFor, needOpts, overlapNames, reactionTally, reactions } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { SELF, VERSION, ctx, folderOf, generationSnapshots, run, tintLauncher, ui } from '../app/state.js';
import { boardView } from './needs-tab.js';
import { matchMood } from '../engine/board.js';
import { bondMini, bondView } from './bonds-tab.js';
import { activeMoods } from '../engine/state.js';
import { escapeHtml as esc, shortName } from '../engine/util.js';
import { BY_ID, sectionOf } from '../data/catalogue.js';
import { effectiveChat } from '../engine/ledger.js';
import { capturePanel, restorePanelFields, restorePanelPosition, savedPanel } from './scroll-memory.js';
import { PLUMBOB, peopleBar, personCard, tabBar } from './header.js';
import { TONES, moodTone } from '../engine/tone.js';
import { inventoryView } from './rows.js';
import { sectionContent } from './sections.js';
import { settingsView } from './settings-sheet.js';
import { filterSkills, skillsView } from './skills-tab.js';
import { wantsView, youView } from './wants-tab.js';
import { filterPersonality } from './personality-tab.js';
import { activePersonalities } from '../engine/personality.js';
import { relationshipView } from './relationships-tab.js';
import { activeRelationshipTags, activeSharedTags } from '../engine/relationships.js';
import { skillsOf } from '../engine/skills.js';

export function renderPreview() {
    if (!ui.panel) return;
    const mini = ui.panel.querySelector('[data-token-mini]');
    if (mini) { mini.textContent = run.promptInfo.tokens ? `≈ ${run.promptInfo.tokens} tokens sent${run.promptInfo.overBudget ? ` · ${run.promptInfo.overBudget} over your ${run.promptInfo.target} target` : ''}` : ''; mini.classList.toggle('is-over', Boolean(run.promptInfo.overBudget)); }
    const count = ui.panel.querySelector('[data-token-count]');
    if (count) count.textContent = `${run.promptInfo.tokens} counted tokens · ${run.promptInfo.selectedIds?.length || 0} active states sent`;
    const preview = ui.panel.querySelector('[data-preview]');
    if (preview) preview.textContent = run.promptInfo.prompt || 'No mood directions are being sent.';
    const audit = ui.panel.querySelector('[data-audit]');
    if (audit) audit.textContent = `Every active mood, fact, relationship feeling and story setting is sent, using the same strength words shown on the sliders. Paused relationships and cast members off scene are left out. Numbers are not sent.\nFormat: user role · depth ${settings().depth}${run.promptInfo.overBudget ? `\n${run.promptInfo.overBudget} tokens above the ${run.promptInfo.target}-token target; nothing was dropped or shortened.` : ''}`;
    const last = ui.panel.querySelector('[data-last-prompt]');
    if (last) {
        const snapshot = generationSnapshots.get(identity());
        last.textContent = snapshot ? `${snapshot.at}\nUser role · depth ${snapshot.depth}\n${snapshot.prompt || '(No mood injection)'}` : 'No generation prepared for this chat/character since this page loaded.';
    }
    const warning = ui.panel.querySelector('[data-budget-warning]');
    if (warning) {
        warning.hidden = !run.promptInfo.overBudget;
        warning.textContent = `Full blend kept: ${run.promptInfo.tokens} tokens (${run.promptInfo.overBudget} above target). Details are in “What is sent to the model?”`;
    }
}
export function renderStatus() {
    if (ui.panel?.querySelector('[data-status]')) ui.panel.querySelector('[data-status]').textContent = run.status;
}
// A redraw that fails shows the error in the panel, so ◆ Moods always opens and the cause is visible.

// A redraw that comes from the chat (a reply arriving, a swipe) waits while you're typing in
// the panel, so it can't wipe a half-written board correction or note. It runs when you leave the field.
// A finger down in the panel (dragging a slider, mid-tap) holds it too, so the button under it isn't rebuilt.

export const typingInPanel = () => { const a = document.activeElement; return ui.pointerInPanel || Boolean(ui.panel && a && ui.panel.contains(a) && a.matches('textarea, input[type=text], input[type=search], input:not([type])')); };
// A closed panel isn't drawn at all: opening it draws it fresh.
export function render(background = false, force = false) {
    if (!ui.panel || (!ui.panel.open && !force)) return;
    if (background && ui.panel.open && typingInPanel()) { ui.renderLater = true; return; }
    ui.renderLater = false;
    try { drawPanel(); ui.lastDrawError = ''; } catch (err) {
        ui.lastDrawError = String(err?.message ?? err);
        console.error('[Moodweaver] could not draw the panel', err);
        globalThis.toastr?.error(String(err?.message ?? err), 'Moodweaver hit an error', { preventDuplicates: true });
        const where = String(err?.stack ?? '').split('\n').find(l => /\.js:\d+/.test(l))?.trim() ?? '';
        ui.panel.dataset.view = '';
        ui.panel.innerHTML = `<div class="mw-top"><div class="mw-brand"><div class="mw-brand-text"><h2>Moodweaver</h2></div></div><div class="mw-top-actions"><button type="button" class="mw-close" data-action="close" aria-label="Close Moodweaver">×</button></div></div>
            <div class="mw-empty mw-error"><p>The panel hit an error while drawing. Nothing was changed or lost.</p><pre>${esc(err?.message ?? err)}${where ? `\n${esc(where)}` : ''}</pre><p class="mw-fine">A screenshot of this box is enough to track it down.</p></div>
            <div class="mw-footer">v${VERSION}</div>`;
    }
}
function drawPanel() {
    capturePanel(ui.panel);
    const ch = target(), charState = getState(ch);
    if (charState) migratePairs(ch);
    if (ui.who === 'cast' && !selectedCast()) ui.who = 'char';
    const state = charState ? viewState() : null;
    if (ui.who === 'story') ui.tab = 'mood';
    if (ui.tab === 'personality') ui.tab = 'trait';
    if (ui.tab === 'bond') ui.tab = 'rel';
    const kind = ui.who === 'story' ? 'story' : ['state', 'trait', 'turn'].includes(ui.tab) ? ui.tab : 'mood';
    const active = state ? activeMoods(state) : [];
    const live = charState ? liveFor(ch) : null;
    const relationshipCount = state && ui.who !== 'story' ? peers().reduce((n, p) => n + (p.relation?.enabled !== false && p.relation ? activeRelationshipTags(p.relation).length : 0) + (p.pair ? activeSharedTags(p.pair).length : 0), 0) : 0;
    const counts = { mood: active.filter(m => sectionOf(m) === 'mood').length, trait: active.filter(m => sectionOf(m) === 'trait').length + activePersonalities(state).length, turn: Object.values(state?.prefs ?? {}).filter(Boolean).length,
        rel: relationshipCount, state: active.filter(m => m.kind === 'state' && sectionOf(m) === 'state').length,
        needs: ui.who === 'user' ? (settings().youTrack && ch ? reactions(ch).condition.length : 0) : live?.needs.filter(n => n.known && n.value <= 35).length ?? 0,
        inv: (state?.inventory ?? []).filter(i => i.carried).length, wants: (state?.wants ?? []).filter(w => !w.done && w.value > 0).length, skills: state ? skillsOf(state).length : 0 };
    const peer = state && ui.who !== 'story' ? currentPeer() : null;
    const view = JSON.stringify([identity(ch), ui.who, ui.who === 'cast' ? selectedCast()?.id : '', ui.settingsOpen ? 'settings' : ui.tab, ui.browsing, ui.tab === 'rel' ? peer?.key : '', ui.tab === 'rel' ? ui.pairView : '']);
    // Clearing the last thing set for someone can drop them from the people list, which used to count as
    // a new view and jump to the top. If you didn't pick another person or side, the redraw keeps your place.
    const coarse = JSON.stringify([identity(ch), ui.who, ui.who === 'cast' ? selectedCast()?.id : '', ui.settingsOpen ? 'settings' : ui.tab, ui.browsing]);
    const oldView = ui.panel.dataset.view, keepPlace = Boolean(oldView) && oldView !== view && ui.panel.dataset.coarse === coarse && ui.selectedPeer === ui.drawnPeer && ui.pairView === ui.drawnPairView;
    const prevScroll = ui.panel.scrollTop;
    const snapshot = savedPanel(keepPlace ? oldView : view), sameView = keepPlace || ui.panel.dataset.view === view;
    ui.panel.dataset.coarse = coarse; ui.drawnPeer = ui.selectedPeer; ui.drawnPairView = ui.pairView;
    ui.search = snapshot?.searches['#mw-catalogue-search'] ?? '';
    ui.openGroups = snapshot?.details ?? {}; ui.lazyBodies = new Map();
    ui.panel.dataset.view = view;
    // The plumbob shows the leading feelings, or the board's mood when nothing is set by hand.
    let plumbob = moodTone(state?.moods);
    if (!plumbob.strength) { const boardMood = live?.state.map(t => matchMood(t.text)).find(m => m && TONES[m.category]); if (boardMood) plumbob = { lead: TONES[boardMood.category], shade: TONES[boardMood.category], strength: 40, id: boardMood.id }; }
    ui.panel.style.setProperty('--mw-mood', plumbob.lead); tintLauncher(plumbob.lead);
    // No chat open means no state: build nothing, or the person card throws and the panel never opens.
    const body = !state ? '' : ui.settingsOpen ? settingsView(state)
        : `${personCard(ch, state, live)}${ui.who === 'story' ? '' : tabBar(counts)}
        ${ui.who !== 'story' && ui.tab === 'inv' ? inventoryView(state, ch)
        : ui.who === 'user' && ui.tab === 'needs' ? youView(state, ch, live)
        : ui.who !== 'story' && ui.tab === 'needs' ? boardView({ needOpts: needOpts(), live, send: boardSend(), sync: settings().boardPresent, charName: ch.name, userName: playerName(), people: boardPeople(ch), editing: ui.boardEditing && settings().boardPins, focus: ui.boardFocus, pinsOn: settings().boardPins, memoriesOn: settings().boardMemories, withWeave: settings().boardWithWeave, weaveOn: bondData(ch).on, savedMemories: boardMemoryCount(ch) })
        : ui.who !== 'story' && ui.tab === 'wants' ? wantsView(state, ch)
        : ui.who !== 'story' && ui.tab === 'skills' ? skillsView(state, ch)
        : ui.who !== 'story' && ui.tab === 'rel' ? (ui.who === 'char' && peer?.key === '{{user}}' ? bondView({ bond: bondData(ch), charName: shortName(ch.name), userName: shortName(playerName()), chatLength: Infinity, axes: bondAxes(ch), list: bondList(ch), tally: reactionTally(ch), canRead: Boolean(readerProfile()), pending: Boolean(run.pending), savedPool: settings().dynamicPools?.[`char:${ch.avatar}`] ?? null, overlaps: overlapNames(bondOverlaps(ch, effectiveChat(ctx().chat ?? [])), shortName(ch.name), shortName(playerName())) }) : '') + relationshipView({
            peerExtra: ui.who === 'char' && bondData(ch).on ? { '{{user}}': bondMini(bondData(ch), Infinity, bondAxes(ch), bondList(ch)) } : {}, subject: subjectName(), peers: peers(), selectedKey: peer?.key, relation: peer?.relation, pair: peer?.pair, view: ui.pairView, selfKey: personKeyOfSubject(), otherKey: peer ? keyForTarget(peer.key) : '', knowledge: getKnowledge(ch), isPlayer: ui.who === 'user', focus: ch.name, openGroups: openRelationGroups, swapLabel: peer && swapTarget(peer) ? `${peer.name}’s side` : '', removing: ui.removingRelation })
        : sectionContent(state, kind, ch, active)}`;
    const where = live?.found ? [live.time, live.location.split(',')[0]].filter(Boolean).join(' · ') : '';
    ui.panel.innerHTML = `<div class="mw-top" data-sky="${live?.sky.time ?? ''}" data-weather="${live?.sky.weather ?? ''}"><div class="mw-brand">${PLUMBOB(plumbob)}<div class="mw-brand-text"><h2>Moodweaver</h2>${where ? `<small class="mw-where-now">${esc(where)}</small>` : ''}</div></div>
        <div class="mw-top-actions"><button type="button" class="mw-icon-btn" data-action="${ui.settingsOpen ? 'settings-close' : 'settings'}" aria-pressed="${ui.settingsOpen}" aria-label="Settings and what’s sent" title="Settings and what’s sent">⚙</button><button type="button" class="mw-close" data-action="close" aria-label="Close Moodweaver">×</button></div></div>
    ${!charState ? '<div class="mw-empty">Open a character chat to start weaving a mood.</div>' : `
    ${members().length > 1 ? `<div class="mw-context"><label>Group chat · main character<select data-field="character" aria-label="Main character">${members().map(m => `<option value="${esc(m.avatar)}" ${m.avatar === ch.avatar ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label></div>` : ''}
    ${peopleBar(ch)}
    ${state ? body : ''}`}
    <div data-status role="status" class="mw-status">${esc(run.status)}</div><div class="mw-footer"><span data-token-mini></span>Small shifts. Complicated feelings. · v${VERSION}</div><button class="mw-to-top" data-action="top" aria-label="Back to top" title="Back to top" hidden>↑</button>`;
    restorePanelFields(ui.panel, snapshot);
    filterRows(); filterRelationships(ui.panel.querySelector('[data-relation-search]')?.value ?? ''); filterLocalLists(); filterPersonality(ui.panel);
    renderPreview(); filterSkills(); restorePanelPosition(ui.panel, snapshot, sameView); if (keepPlace && !ui.panel.querySelector(snapshot?.anchor || '[data-none]')) ui.panel.scrollTop = prevScroll; toggleTop();
}
// Draw the rows of folded groups that were left empty (all of them in scope, or the one just opened).
export function fillLazy(scope) {
    const bodies = scope?.matches?.('[data-lazy]') ? [scope] : [...(scope?.querySelectorAll('[data-lazy]') ?? [])];
    for (const el of bodies) { const rows = ui.lazyBodies?.get(el.dataset.lazy); el.removeAttribute('data-lazy'); if (rows) el.innerHTML = rows(); }
}
export function onGroupToggle(e) { if (e.target.matches?.('details[data-category]') && e.target.open) { const b = e.target.querySelector(':scope > [data-lazy]'); if (b) { fillLazy(b); filterRows(); } } }
export function toggleTop() { const b = ui.panel?.querySelector('.mw-to-top'); if (b) b.hidden = ui.panel.scrollTop < 500; }
function showGroupMatches(group, count, term) {
    const badge = group.querySelector('summary small');
    if (!badge) return;
    badge.dataset.unfiltered ??= badge.textContent;
    badge.textContent = term ? `${count} ${count === 1 ? 'match' : 'matches'}` : badge.dataset.unfiltered;
}
export function filterRelationships(value) {
    const term = value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let shown = 0;
    ui.panel.querySelectorAll('[data-relation-group]').forEach(group => {
        let visible = 0;
        group.querySelectorAll('[data-relation-row]').forEach(row => { row.hidden = !searchText(row).includes(term); if (!row.hidden) visible++; });
        group.hidden = !visible; shown += visible;
        showGroupMatches(group, visible, term);
    });
    const none = ui.panel.querySelector('[data-relation-empty]'); if (none) none.hidden = shown > 0;
}
// A mood's everyday words come from the catalogue rather than the page, so the rows stay small.
export const searchText = row => [row.textContent, row.dataset.aliases ?? '', ...(BY_ID[row.dataset.mood]?.words ?? []), row.dataset.search ?? '', ...[...row.querySelectorAll('input[type="text"]')].map(i => i.value)].join(' ').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function filterLocalLists() {
    ui.panel.querySelectorAll('[data-filter-list]').forEach(input => {
        const key = input.dataset.filterList, term = input.value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        let count = 0;
        ui.panel.querySelectorAll(`[data-filter-item="${key}"]`).forEach(row => { row.hidden = !searchText(row).includes(term); if (!row.hidden) count++; });
        const none = ui.panel.querySelector(`[data-filter-empty="${key}"]`); if (none) none.hidden = count > 0;
    });
}
export function filterRows() {
    const term = ui.search.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (term) fillLazy(ui.panel);
    let shown = 0;
    ui.panel.querySelectorAll('[data-category]').forEach(d => {
        let count = 0;
        d.querySelectorAll('[data-mood]').forEach(row => {
            row.hidden = !searchText(row).includes(term); if (!row.hidden) count++;
        });
        const waiting = d.querySelector('[data-lazy]'); if (waiting) count = Number(waiting.dataset.count) || 0;
        const inTab = ui.who === 'story' ? d.dataset.kind === 'story' : d.dataset.kind !== 'story' && d.dataset.kind === ui.tab;
        d.hidden = count === 0 || !inTab; if (inTab) shown += count;
        // While searching, open groups with matches so results are one tap away; fold them back after.
        const key = d.dataset.category;
        if (term && count && inTab && !d.open) { d.open = true; autoOpened.add(key); }
        else if (!term && autoOpened.has(key)) { d.open = false; autoOpened.delete(key); }
        showGroupMatches(d, count, term);
    });
    const none = ui.panel.querySelector('.mw-no-results'); if (none) none.hidden = shown > 0 || !term;
}
export async function changeState(mutator) {
    const s = viewState(); if (!s) return;
    mutator(s); await persist(s); await syncPrompt(); render();
}
// Every press writes what happened under the Open mood panel button in Extensions, so a phone
// with no console can still show why the panel isn't visible.
function note(text, bad = false) {
    const d = document.querySelector('[data-mw-diag]'); if (!d) return;
    d.hidden = false; d.textContent = text; d.classList.toggle('is-bad', bad);
}
const describe = el => { const chain = []; for (let e = el; e && e !== document.documentElement && chain.length < 3; e = e.parentElement) chain.push(e.localName + (e.id ? `#${e.id}` : '') + (e.classList.length ? `.${[...e.classList].slice(0, 2).join('.')}` : '')); return chain.join(' in ') || 'unknown'; };
function hidingRules(el) {
    const out = [];
    const walk = (rules, from) => { for (const r of rules ?? []) {
        if (r.cssRules && !r.selectorText) { try { walk(r.cssRules, from); } catch { /* unreadable */ } continue; }
        if (r.style?.display !== 'none' || !r.selectorText) continue;
        try { if (el.matches(r.selectorText)) out.push(`${r.selectorText.slice(0, 80)} (${from})`); } catch { /* bad selector */ }
    } };
    for (const sheet of document.styleSheets) {
        const from = sheet.href ? sheet.href.split('/').slice(-2).join('/') : sheet.ownerNode?.id || 'inline <style>';
        try { walk(sheet.cssRules, from); } catch { /* cross-origin */ }
        if (out.length >= 3) break;
    }
    return out.slice(0, 3);
}
function panelReport(showError) {
    const lines = [`v${VERSION} from “${folderOf(SELF)}”`];
    if (!ui.panel?.isConnected) return [...lines, 'The panel is missing from the page.'].join('\n');
    const cs = getComputedStyle(ui.panel), r = ui.panel.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    lines.push(`open: ${ui.panel.open ? 'yes' : 'no'}`);
    if (ui.lastDrawError) lines.push(`drawing failed: ${ui.lastDrawError}`);
    if (showError) lines.push(`showing failed: ${showError}`);
    lines.push(`box: left ${Math.round(r.left)}, top ${Math.round(r.top)}, ${Math.round(r.width)}×${Math.round(r.height)} on a ${vw}×${vh} screen`);
    lines.push(`style: display ${cs.display}, visibility ${cs.visibility}, opacity ${cs.opacity}, z-index ${cs.zIndex}, position ${cs.position}${ui.panel.hidden ? ', hidden attribute set' : ''}`);
    // Name the stylesheet rule that hides it, so a theme or another extension can be found.
    if (cs.display === 'none') lines.push(`hidden by: ${hidingRules(ui.panel).join(' | ') || 'no stylesheet rule found (inline style or a script)'}`);
    const x = Math.min(vw - 2, Math.max(1, r.left + r.width / 2)), y = Math.min(vh - 2, Math.max(1, r.top + Math.min(40, r.height / 2)));
    const hit = document.elementFromPoint(x, y);
    lines.push(`on top there: ${!hit ? 'nothing' : ui.panel.contains(hit) ? 'the panel' : describe(hit)}`);
    return lines.join('\n');
}
export function openPanel() {
    note('Pressed. Opening…');
    if (run.suspended) { note('Moodweaver is switched off in Manage extensions.', true); globalThis.toastr?.info('Moodweaver is switched off. Turn it back on in Manage extensions.'); return; }
    let showError = '';
    try {
        render(false, true);
        if (ui.panel.hidden) ui.panel.hidden = false;
        if (!ui.panel.open) { ui.panel.show(); ui.panel.focus({ preventScroll: true }); }
    } catch (err) {
        showError = String(err?.message ?? err);
        try { ui.panel.setAttribute('open', ''); } catch { /* nothing else to try */ }
        console.error('[Moodweaver] could not open the panel', err);
        globalThis.toastr?.error(showError, 'Moodweaver could not open');
    }
    void syncPrompt();
    // Quiet when it worked; a report under the button only when something's wrong.
    setTimeout(() => {
        try {
            const text = panelReport(showError), d = document.querySelector('[data-mw-diag]');
            if (ui.lastDrawError || showError || !/on top there: the panel/.test(text)) note(text, true); else if (d) d.hidden = true;
        } catch (err) { note(`Report failed: ${err?.message ?? err}`, true); }
    }, 120);
}
