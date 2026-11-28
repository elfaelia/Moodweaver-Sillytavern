// Drawing the panel, keeping search filters and scroll position, and the status lines.
import { findView } from './find.js';
import { autoOpened, currentPeer, getKnowledge, getState, identity, keyForTarget, members, migratePairs, openRelationGroups, peers, persist, personKeyOfSubject, playerName, selectedCast, subjectName, swapTarget, target, viewState } from '../app/chat.js';
import { syncPrompt } from '../app/note.js';
import { readerProfile } from '../app/reader.js';
import { boardMemoryCount, boardPeople, boardSend, bondAxes, bondData, bondDrivers, whyMap, bondList, bondOverlaps, liveFor, needOpts, overlapNames, reactionTally, reactions, stressNow } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { SELF, VERSION, ctx, folderOf, generationSnapshots, run, tintLauncher, ui } from '../app/state.js';
import { boardView, stressCard } from './needs-tab.js';
import { matchMood } from '../engine/board.js';
import { bondMini, bondView } from './bonds-tab.js';
import { activeMoods } from '../engine/state.js';
import { escapeHtml as esc, shortName } from '../engine/util.js';
import { BY_ID, sectionOf } from '../data/catalogue.js';
import { effectiveChat } from '../engine/ledger.js';
import { capturePanel, restorePanelFields, restorePanelPosition, savedPanel } from './scroll-memory.js';
import { PLUMBOB, dockBar, dockOf, personCard, tabBar, tabsFor, usSides } from './header.js';
import { tonightView } from './tonight.js';
import { TONES, moodTone } from '../engine/tone.js';
import { factsContent, sectionContent, tabKind } from './sections.js';
import { settingsView } from './settings-sheet.js';
import { morphChildren } from './morph.js';
import { filterSkills, skillsView } from './skills-tab.js';
import { wantsView, youView } from './wants-tab.js';
import { periodView } from './period-tab.js';
import { filterPersonality } from './personality-tab.js';
import { activePersonalities } from '../engine/personality.js';
import { relationshipView } from './relationships-tab.js';
import { musicView } from './music-tab.js';
import { activeRelationshipTags, activeSharedTags } from '../engine/relationships.js';
import { skillsOf } from '../engine/skills.js';

// The token meter: the header pill and the footer give the total; Settings \u203a What is sent splits it into the
// guide (the same every reply, so cached after the first) and what's sent fresh, against your target.
const kTokens = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
export function renderPreview() {
    if (!ui.panel) return;
    const info = run.promptInfo, guide = info.fixedTokens ?? 0, fresh = info.liveTokens ?? info.tokens;
    const pill = ui.panel.querySelector('[data-token-pill]');
    if (pill) { pill.hidden = !info.tokens; pill.querySelector('b').textContent = kTokens(info.tokens || 0); pill.title = guide ? `About ${info.tokens} tokens a reply: ${guide} in the cached guide, ${fresh} sent fresh. Tap for details.` : `About ${info.tokens} tokens a reply. Tap for details.`; pill.classList.toggle('is-over', Boolean(info.overBudget)); }
    const mini = ui.panel.querySelector('[data-token-mini]');
    if (mini) { mini.textContent = info.tokens ? `\u2248 ${info.tokens} tokens sent${guide ? ` (${guide} cached)` : ''}${info.overBudget ? ` \u00b7 ${info.overBudget} over your ${info.target} target` : ''}` : ''; mini.classList.toggle('is-over', Boolean(info.overBudget)); }
    const count = ui.panel.querySelector('[data-token-count]');
    if (count) {
        const max = Math.max((info.target || 1) + guide, info.tokens || 0), w = n => `${Math.round(n / max * 100)}%`;
        count.innerHTML = `<div class="mw-token-meter" role="img" aria-label="${info.tokens} tokens: ${guide} cached guide, ${fresh} fresh"><i class="is-guide" style="width:${w(guide)}"></i><i class="is-fresh" style="width:${w(fresh)}"></i>${info.target ? `<b style="left:${w(info.target + (guide ? guide : 0))}" title="Your target"></b>` : ''}</div>
            <p class="mw-token-legend">${guide ? `<span class="is-guide">Guide ${guide}</span> the same every reply, cached after the first \u00b7 ` : ''}<span class="is-fresh">Right now ${fresh}</span> sent fresh each reply \u00b7 warning at ${info.target ?? '\u2014'} \u00b7 ${info.selectedIds?.length || 0} settings in play</p>`;
    }
    const preview = ui.panel.querySelector('[data-preview]');
    if (preview) preview.textContent = info.prompt ? `${info.fixed ? `${info.fixed}\n\n` : ''}${info.prompt}${info.tail ? `\n\n[your message goes here]\n\n${info.tail}` : ''}` : 'No mood directions are being sent.';
    const audit = ui.panel.querySelector('[data-audit]');
    if (audit) audit.textContent = `Every active mood, fact, relationship feeling and story setting is sent, using the same strength words shown on the sliders. Paused relationships and cast members off scene are left out. Numbers are not sent.\nFormat: ${info.fixed ? 'guide in the prompt above the chat (system role), notes as ' : ''}user role \u00b7 ${PLACE_WORDS[settings().noteOrder] ?? PLACE_WORDS.after}${info.overBudget ? `\n${info.overBudget} tokens above the ${info.target}-token target; nothing was dropped or shortened.` : ''}`;
    const last = ui.panel.querySelector('[data-last-prompt]');
    if (last) {
        const snapshot = generationSnapshots.get(identity());
        last.textContent = snapshot ? `${snapshot.at}\nUser role \u00b7 ${PLACE_WORDS[snapshot.order] ?? PLACE_WORDS.after}\n${snapshot.fixed ? `${snapshot.fixed}\n\n` : ''}${snapshot.prompt || '(No mood injection)'}` : 'No generation prepared for this chat/character since this page loaded.';
    }
    const warning = ui.panel.querySelector('[data-budget-warning]');
    if (warning) {
        warning.hidden = !info.overBudget;
        warning.textContent = `Full blend kept: ${guide ? fresh : info.tokens} tokens${guide ? ' sent fresh' : ''} (${info.overBudget} above target). Nothing is cut; the details are in \u201cWhat\u2019s sent, in full\u201d below.`;
    }
}
const PLACE_WORDS = { after: 'after your message', rules: 'around your message', before: 'before your message' };
export function renderStatus() {
    if (ui.panel?.querySelector('[data-status]')) ui.panel.querySelector('[data-status]').textContent = run.status;
}
// A redraw that fails shows the error in the panel, so \u25c6 Moods always opens and the cause is visible.

// A redraw that comes from the chat (a reply arriving, a swipe) waits while you're typing in
// the panel, so it can't wipe a half-written board correction or note. It runs when you leave the field.
// A finger down in the panel (dragging a slider, mid-tap) holds it too, so the button under it isn't rebuilt.

export const typingInPanel = () => { const a = document.activeElement; return ui.pointerInPanel || Boolean(ui.panel && a && ui.panel.contains(a) && a.matches('textarea, input[type=text], input[type=search], input:not([type])')); };
// 2.0.38: a tap that has already drawn its own change (a moon, a step) lets the phone show it first; the full
// redraw follows right after the next frame, and taps in quick succession share one redraw.
let soon = 0;
export function renderSoon() {
    if (soon) return;
    soon = requestAnimationFrame(() => setTimeout(() => { soon = 0; render(); }, 0));
}
// A closed panel isn't drawn at all: opening it draws it fresh.
export function render(background = false, force = false) {
    if (soon) { cancelAnimationFrame(soon); soon = 0; }
    if (!ui.panel || (!ui.panel.open && !force)) return;
    if (background && ui.panel.open && typingInPanel()) { ui.renderLater = true; return; }
    ui.renderLater = false;
    try { drawPanel(); ui.lastDrawError = ''; } catch (err) {
        ui.lastDrawError = String(err?.message ?? err);
        console.error('[Moodweaver] could not draw the panel', err);
        globalThis.toastr?.error(String(err?.message ?? err), 'Moodweaver hit an error', { preventDuplicates: true });
        const where = String(err?.stack ?? '').split('\n').find(l => /\.js:\d+/.test(l))?.trim() ?? '';
        ui.panel.dataset.view = '';
        ui.panel.innerHTML = `<div class="mw-top"><div class="mw-brand"><div class="mw-brand-text"><h2>Moodweaver</h2></div></div><div class="mw-top-actions"><button type="button" class="mw-close" data-action="close" aria-label="Close Moodweaver">\u00d7</button></div></div>
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
    // Items live on Facts now, and your facts on the You tab; a hidden Wants tab falls back to Moods.
    if (ui.tab === 'inv' || (ui.tab === 'state' && ui.who === 'user')) ui.tab = ui.who === 'user' ? 'needs' : 'state';
    if (ui.tab === 'wants' && settings().wantsTab === false) ui.tab = 'mood';
    if (ui.tab === 'music' && settings().musicTab === false) ui.tab = 'mood';
    const kind = tabKind();
    // The faint "why" lines under rows and on chips (Settings \u203a Show why).
    ui.why = state && charState && settings().whyOn !== false && ['char', 'user'].includes(ui.who) && ['mood', 'trait', 'psyche', 'intimacy', 'state'].includes(kind) ? whyMap(ch, ui.who) : new Map();
    const active = state ? activeMoods(state) : [];
    const live = charState ? liveFor(ch) : null;
    const relationshipCount = state && ui.who !== 'story' ? peers().reduce((n, p) => n + (p.relation?.enabled !== false && p.relation ? activeRelationshipTags(p.relation).length : 0) + (p.pair ? activeSharedTags(p.pair).length : 0), 0) : 0;
    const counts = { mood: active.filter(m => sectionOf(m) === 'mood').length, trait: active.filter(m => sectionOf(m) === 'trait').length + activePersonalities(state).length, psyche: active.filter(m => sectionOf(m) === 'psyche').length, intimacy: active.filter(m => sectionOf(m) === 'intimacy').length, turn: Object.values(state?.prefs ?? {}).filter(Boolean).length,
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
    // A new tab slides in from the side it lives on (swiping left brings the next one in from the right).
    const order = ['tonight', ...tabsFor(ui.who).map(([k]) => k).filter(k => dockOf(k) === 'person'), 'rel', 'turn', 'intimacy', 'story', 'music'], at = ui.who === 'story' ? 'story' : ui.tab, was = ui.drawnTab ?? at;
    const anim = at === was ? '' : order.indexOf(at) > order.indexOf(was) ? 'next' : 'prev'; ui.drawnTab = at;
    // No chat open means no state: build nothing, or the person card throws and the panel never opens.
    const body = !state ? '' : ui.settingsOpen ? settingsView(state)
        : ui.tab === 'tonight' ? `${findView()}<div class="mw-view" data-anim="${anim}">${tonightView(ch, charState, live)}</div>`
        : `${findView()}${dockOf(ui.tab) === 'us' && ui.who !== 'story' ? usSides(ch) : dockOf(ui.tab) === 'music' && ui.who !== 'story' ? '' : personCard(ch, state, live)}${ui.who === 'story' ? '' : tabBar(counts)}
        <div class="mw-view" data-anim="${anim}">${ui.who === 'user' && ui.tab === 'needs' ? youView(state, ch, live, boardPeople(ch)) + factsContent(state, ch, active)
        : ui.who !== 'story' && ui.tab === 'needs' ? boardView({ needOpts: needOpts(), live, send: boardSend(), sync: settings().boardPresent, charName: ch.name, userName: playerName(), people: boardPeople(ch), editing: ui.boardEditing && settings().boardPins, focus: ui.boardFocus, pinsOn: settings().boardPins, memoriesOn: settings().boardMemories, withWeave: settings().boardWithWeave, weaveOn: bondData(ch).on, savedMemories: boardMemoryCount(ch) })
        : ui.who !== 'story' && ui.tab === 'music' ? musicView()
        : ui.who !== 'story' && ui.tab === 'wants' ? wantsView(state, ch)
        : ['char', 'user'].includes(ui.who) && ui.tab === 'period' ? periodView(state, ch)
        : ui.who !== 'story' && ui.tab === 'skills' ? skillsView(state, ch)
        : ui.who !== 'story' && ui.tab === 'rel' ? (ui.who === 'char' && peer?.key === '{{user}}' ? bondView({ bond: bondData(ch), charName: shortName(ch.name), userName: shortName(playerName()), chatLength: Infinity, axes: bondAxes(ch), list: bondList(ch), tally: reactionTally(ch), canRead: Boolean(readerProfile()), pending: Boolean(run.pending), savedPool: settings().dynamicPools?.[`char:${ch.avatar}`] ?? null, overlaps: overlapNames(bondOverlaps(ch, effectiveChat(ctx().chat ?? [])), shortName(ch.name), shortName(playerName())), drivers: bondDrivers(ch) }) : '') + relationshipView({
            lazyBodies: ui.lazyBodies, peerExtra: ui.who === 'char' && bondData(ch).on ? { '{{user}}': bondMini(bondData(ch), Infinity, bondAxes(ch), bondList(ch)) } : {}, subject: subjectName(), peers: peers(), selectedKey: peer?.key, relation: peer?.relation, pair: peer?.pair, view: ui.pairView, selfKey: personKeyOfSubject(), otherKey: peer ? keyForTarget(peer.key) : '', knowledge: getKnowledge(ch), isPlayer: ui.who === 'user', focus: ch.name, openGroups: openRelationGroups, swapLabel: peer && swapTarget(peer) ? `${peer.name}\u2019s side` : '', removing: ui.removingRelation, meterRows: ui.who === 'char' && peer?.key === '{{user}}' && bondData(ch).on })
        // Stress and coping live on Mind (2.0.24), at the top.
        : `${kind === 'psyche' && ui.who === 'char' ? stressCard(stressNow(ch, effectiveChat(ctx().chat ?? [])), shortName(ch.name)) : ''}${sectionContent(state, kind, ch, active)}`}</div>`;
    const where = live?.found ? [live.time, live.location.split(',')[0]].filter(Boolean).join(' \u00b7 ') : '';
    const html = `<div class="mw-top" data-sky="${live?.sky.time ?? ''}" data-weather="${live?.sky.weather ?? ''}"><div class="mw-brand">${PLUMBOB(plumbob)}<div class="mw-brand-text"><h2>Moodweaver</h2>${where ? `<small class="mw-where-now">${esc(where)}</small>` : ''}</div></div>
        <div class="mw-top-actions"><button type="button" class="mw-token-pill" data-action="tokens" data-token-pill hidden><i aria-hidden="true">\u25f7</i><b></b></button><button type="button" class="mw-icon-btn" data-action="find" aria-pressed="${Boolean(ui.findOpen)}" aria-label="Search every tab" title="Search every tab">\u2315</button><button type="button" class="mw-icon-btn" data-action="${ui.settingsOpen ? 'settings-close' : 'settings'}" aria-pressed="${ui.settingsOpen}" aria-label="Settings and what\u2019s sent" title="Settings and what\u2019s sent">\u2699</button><button type="button" class="mw-close" data-action="close" aria-label="Close Moodweaver">\u00d7</button></div></div>
    ${!charState ? '<div class="mw-empty">Open a character chat to start weaving a mood.</div>' : `
    ${members().length > 1 ? `<div class="mw-context"><label>Group chat \u00b7 main character<select data-field="character" aria-label="Main character">${members().map(m => `<option value="${esc(m.avatar)}" ${m.avatar === ch.avatar ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label></div>` : ''}
    ${state ? body : ''}
    ${state && !ui.settingsOpen ? dockBar(ch) : ''}`}
    <div data-status role="status" class="mw-status">${esc(run.status)}</div><div class="mw-footer"><span data-token-mini></span>Small shifts. Complicated feelings. \u00b7 v${VERSION}</div><button class="mw-to-top" data-action="top" aria-label="Back to top" title="Back to top" hidden>\u2191</button>`;
    // 2.0.40: built aside, then laid over what's on screen so only what changed is touched (panel/morph.js).
    const tpl = document.createElement('template'); tpl.innerHTML = html; const fresh = tpl.content;
    moonify(fresh); pillify(fresh); foldNotes(fresh);
    // A folded group you've opened keeps its rows: they're drawn into the new page before it's laid over.
    for (const body of fresh.querySelectorAll('details > [data-lazy]')) {
        const d = body.parentElement, attr = [...d.attributes].find(a => a.name.startsWith('data-'));
        const was = attr && ui.panel.querySelector(`details[${attr.name}="${CSS.escape(attr.value)}"]`);
        if (was?.open) fillLazy(body);
    }
    morphChildren(ui.panel, fresh);
    restorePanelFields(ui.panel, snapshot); moonify(ui.panel); pillify(ui.panel); foldNotes(ui.panel); reglow(ui.panel);
    filterRows(); filterRelationships(ui.panel.querySelector('[data-relation-search]')?.value ?? ''); filterLocalLists(); filterPersonality(ui.panel);
    renderPreview(); filterSkills(); restorePanelPosition(ui.panel, snapshot, sameView); if (keepPlace && !ui.panel.querySelector(snapshot?.anchor || '[data-none]')) ui.panel.scrollTop = prevScroll; toggleTop();
}
// Draw the rows of folded groups that were left empty (all of them in scope, or the one just opened).
export function fillLazy(scope) {
    const bodies = scope?.matches?.('[data-lazy]') ? [scope] : [...(scope?.querySelectorAll('[data-lazy]') ?? [])];
    for (const el of bodies) { const rows = ui.lazyBodies?.get(el.dataset.lazy); el.removeAttribute('data-lazy'); if (rows) { el.innerHTML = rows(); moonify(el); pillify(el); foldNotes(el); } }
}
// Every slider in the panel is shown as moons to tap, no dragging. The slider stays in the page, hidden, and a tap
// sets it and sends the same input and change events a drag would, so each tab's own handling is unchanged.
// One-sided sliders get a new moon (off) and eight phases; ones that go below zero get four moons each side of
// a middle new moon. Tapping the moon it's already at goes back to off (or the middle).
const MOON_AT = [5, 15, 30, 50, 70, 85, 95, 100], MOON_FROM = [1, 11, 21, 41, 61, 81, 91, 100];
// The Bonds tab's smaller meters (1.91.6): five stars, one per word, so no two stars read the same (1-20, 21-40 \u2026 81-100).
const FIVE_AT = [10, 30, 50, 70, 90], FIVE_FROM = [1, 21, 41, 61, 81];
const moonScale = el => el?.closest?.('.mw-more-meter') ? [FIVE_AT, FIVE_FROM] : [MOON_AT, MOON_FROM];
const POLE_AT = [30, 50, 70, 95], POLE_FROM = [1, 35, 60, 85];
export function moonify(root) {
    for (const input of root?.querySelectorAll?.('input[type="range"]:not([data-moons])') ?? []) {
        input.dataset.moons = '1'; input.tabIndex = -1; input.setAttribute('aria-hidden', 'true');
        const box = document.createElement('div');
        box.className = `mw-moons mw-range-moons${Number(input.min) < 0 ? ' mw-poles' : ''}`; box.setAttribute('role', 'group');
        if (input.getAttribute('aria-label')) box.setAttribute('aria-label', input.getAttribute('aria-label'));
        // On the Bonds tab the moons are drawn as a constellation: an arc of stars for the main meters, a straight
        // row for the smaller ones, with a line joining the lit stars. Same taps, same values.
        const bond = input.closest('.mw-bond-meter');
        if (bond) box.classList.add('mw-stars', bond.classList.contains('mw-more-meter') ? 'mw-stars-line' : 'mw-stars-arc');
        else if (/^mw-(rel|pair|compare)-slider/.test(input.id)) box.classList.add('mw-stars', 'mw-stars-line');
        // \u2212 and + either side (1.82): a step to the next moon down or up, so nothing small has to be aimed at.
        const row = document.createElement('div'), step = (d, t) => `<button type="button" class="mw-step" data-range-step="${d}" aria-label="${t}" title="${t}"${input.disabled ? ' disabled' : ''}>${d < 0 ? '\u2212' : '+'}</button>`;
        row.className = 'mw-stepped'; input.after(row); row.insertAdjacentHTML('afterbegin', step(-1, 'Less')); row.append(box); row.insertAdjacentHTML('beforeend', step(1, 'More'));
        drawMoons(input, box);
    }
}
// Short choices (1.82): a dropdown with up to five short options shows as a row of pills instead, so a choice is one
// tap and not the phone's wheel picker. The select stays, hidden, and a tap sets it and fires its change event.
export function pillify(root) {
    for (const sel of root?.querySelectorAll?.('select:not([data-pills]):not([multiple])') ?? []) {
        const opts = [...sel.options].filter(o => !o.hidden && !(o.disabled && !o.value));
        const short = (opts.length >= 2 && opts.length <= 5 && opts.every(o => o.text.trim().length <= 16) && opts.reduce((n, o) => n + o.text.trim().length, 0) <= 46 || opts.length >= 2 && opts.length <= 9 && opts.every(o => o.text.trim().length <= 4)) && !opts.some(o => o.value === '' && /\u2026|\.\.\./.test(o.text));
        if (!short) continue;
        sel.dataset.pills = '1'; sel.hidden = true; sel.tabIndex = -1;
        const row = document.createElement('div');
        row.className = 'mw-pills'; row.setAttribute('role', 'radiogroup'); if (sel.getAttribute('aria-label')) row.setAttribute('aria-label', sel.getAttribute('aria-label'));
        row.innerHTML = opts.map(o => `<button type="button" role="radio" data-pill="${esc(o.value)}" aria-checked="${o.selected}" class="${o.selected ? 'is-on' : ''}"${sel.disabled || o.disabled ? ' disabled' : ''}>${esc(o.text.trim())}</button>`).join('');
        sel.after(row);
    }
}
// Long explanations (1.82) fold to one faint line with an \u24d8; a tap opens them. Short notes, warnings and empty-list
// lines stay as they are. Which ones are open is remembered by their first words, so a re-render keeps them open.
const NOTE_SEL = 'p.mw-fine, p.mw-explainer, p.mw-music-note';
const noteKey = el => el.textContent.trim().slice(0, 60);
export function foldNotes(root) {
    ui.openNotes ??= new Set();
    for (const p of root?.querySelectorAll?.(NOTE_SEL) ?? []) {
        if (p.dataset.fold || p.matches('.mw-keep, .mw-period-warn, .mw-empty-list, .mw-scope-none, [data-filter-empty]') || p.closest('[role="status"], .mw-want-empty')) continue;
        if (p.textContent.trim().length < 70 || p.querySelector('input, select, button, textarea')) continue;
        p.dataset.fold = '1'; p.classList.add('mw-foldable'); p.classList.toggle('is-open', ui.openNotes.has(noteKey(p)));
        p.setAttribute('role', 'button'); p.tabIndex = 0; p.setAttribute('aria-expanded', String(p.classList.contains('is-open')));
    }
}
export function toggleNote(p) {
    const open = p.classList.toggle('is-open'); p.setAttribute('aria-expanded', String(open));
    ui.openNotes ??= new Set(); if (open) ui.openNotes.add(noteKey(p)); else ui.openNotes.delete(noteKey(p));
}
export function tapPill(button) {
    const sel = button.closest('.mw-pills')?.previousElementSibling;
    if (!sel || sel.tagName !== 'SELECT' || sel.disabled) return;
    sel.value = button.dataset.pill;
    for (const b of button.parentElement.children) { const on = b === button; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(on)); }
    sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true }));
}
// The stops the moons stand for, lowest first, and which one the slider is at now.
function moonStops(input) {
    const min = Number(input.min) || 0, v = Number(input.value) || 0;
    if (min < 0) { const at = POLE_FROM.reduce((k, f, i) => Math.abs(v) >= f ? i : k, -1); return { stops: [...POLE_AT.map(t => -t).reverse(), 0, ...POLE_AT], i: at < 0 ? 4 : 4 + (v < 0 ? -1 : 1) * (at + 1) }; }
    const [AT, FROM] = moonScale(input), at = FROM.reduce((k, f, i) => v >= f ? i : k, -1);
    return { stops: [min, ...AT.map(t => Math.max(min, t))], i: at < 0 || v <= min ? 0 : at + 1 };
}
const inputOf = el => el.closest('.mw-stepped')?.previousElementSibling;
function setRange(input, to) {
    input.value = String(to);
    const box = input.nextElementSibling?.querySelector('.mw-range-moons');
    if (box) drawMoons(input, box);
    ui.tapDrawnAt = Date.now();
    input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
}
export function stepRangeMoon(button) {
    const input = inputOf(button);
    if (!input || input.type !== 'range' || input.disabled) return;
    const { stops, i } = moonStops(input), j = Math.max(0, Math.min(stops.length - 1, i + Number(button.dataset.rangeStep)));
    if (j !== i) setRange(input, stops[j]);
}
function drawMoons(input, box) {
    const min = Number(input.min) || 0, v = Number(input.value) || 0, off = input.disabled, two = min < 0;
    const btn = (to, lit, now, cls = '', phase = '') => `<button type="button" class="mw-moon ${cls} ${lit ? 'is-lit' : ''} ${now ? 'is-now' : ''}" data-range-moon="${to}" aria-pressed="${now}" aria-label="${to}" title="${to}"${off ? ' disabled' : ''}${phase ? ` style="--mw-phase:${phase}"` : ''}><span></span></button>`;
    if (two) {
        const at = POLE_FROM.reduce((k, f, i) => Math.abs(v) >= f ? i : k, -1), side = v < 0 ? -1 : 1;
        const half = s => POLE_AT.map((to, i) => btn(s * to, side === s && at >= i, side === s && at === i, s < 0 ? 'mw-pole-dark' : 'mw-pole-light', `${Math.round((i + 1) / 4 * 100)}%`));
        box.innerHTML = `${half(-1).reverse().join('')}${btn(0, false, at < 0, 'is-new')}${half(1).join('')}`;
    } else {
        const [AT, FROM] = moonScale(input), at = FROM.reduce((k, f, i) => v >= f ? i : k, -1);
        box.innerHTML = `${btn(min, false, at < 0 || v <= min, 'is-new')}${AT.map((to, i) => btn(Math.max(min, to), at >= i && v > min, at === i && v > min, '', `${Math.round((i + 1) / AT.length * 100)}%`)).join('')}`;
    }
    if (box.classList.contains('mw-stars')) box.insertAdjacentHTML('afterbegin', starLines(box));
}
// The line that joins the lit stars, from the middle (or the left end for a one-sided meter) out to the value.
// Star i sits at the middle of grid column i; on the arc it's raised by STAR_RISE[i] pixels (the CSS does the same).
const STAR_RISE = [0, 5, 10, 13, 14, 13, 10, 5, 0];
function starLines(box) {
    const stars = [...box.querySelectorAll('.mw-moon')], now = stars.findIndex(b => b.classList.contains('is-now'));
    const start = box.classList.contains('mw-poles') ? 4 : 0, arc = box.classList.contains('mw-stars-arc');
    // One even column per star across the whole row, so the lines below land exactly on the stars (2.0.3).
    box.style.setProperty('--mw-n', stars.length);
    const pt = i => `${(i + 0.5) * 100},${arc ? 32 - STAR_RISE[i] : 15}`, run = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => pt(a + k)).join(' ');
    // A faint track joins every star, so the unlit ones read as the rest of the same path, not loose dots.
    const track = `<polyline class="mw-star-track" points="${run(0, stars.length - 1)}" vector-effect="non-scaling-stroke"/>`;
    const lit = now < 0 || now === start ? '' : `<polyline points="${now > start ? run(start, now) : run(now, start)}" vector-effect="non-scaling-stroke"/>`;
    return `<svg class="mw-star-lines${now >= 0 && now < start ? ' is-cool' : ''}" viewBox="0 0 ${stars.length * 100} ${arc ? 44 : 30}" preserveAspectRatio="none" aria-hidden="true">${track}${lit}</svg>`;
}
// A tap on one of those moons: set the slider, fire its events, redraw the moons (a re-render may replace them anyway).
export function tapRangeMoon(button) {
    const input = inputOf(button);
    if (!input || input.type !== 'range' || input.disabled) return;
    const min = Number(input.min) || 0, rest = min < 0 ? 0 : min;
    setRange(input, button.classList.contains('is-now') ? rest : Number(button.dataset.rangeMoon));
}
export function onGroupToggle(e) {
    // The story dials' fold (2.0.40) is remembered across reloads.
    if (e.target.matches?.('[data-dial-fold]') && Boolean(settings().dialsOpen) !== e.target.open) { settings().dialsOpen = e.target.open; ctx().saveSettingsDebounced(); }
    if (e.target.matches?.('details') && e.target.open) { const b = e.target.querySelector(':scope > [data-lazy]'); if (b) { fillLazy(b); filterRows(); } } }
export function toggleTop() { const b = ui.panel?.querySelector('.mw-to-top'); if (b) b.hidden = ui.panel.scrollTop < 500; }
function showGroupMatches(group, count, term) {
    const badge = group.querySelector('summary small');
    if (!badge) return;
    badge.dataset.unfiltered ??= badge.textContent;
    badge.textContent = term ? `${count} ${count === 1 ? 'match' : 'matches'}` : badge.dataset.unfiltered;
}
export function filterRelationships(value) {
    const term = value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (term) ui.panel.querySelectorAll('[data-relation-group] > [data-lazy]').forEach(b => fillLazy(b));
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
        d.querySelectorAll('.mw-sub').forEach(sub => { sub.hidden = !sub.querySelector('[data-mood]:not([hidden])'); });
        const waiting = d.querySelector('[data-lazy]'); if (waiting) count = Number(waiting.dataset.count) || 0;
        const inTab = ui.who === 'story' ? d.dataset.kind === 'story' : d.dataset.kind !== 'story' && d.dataset.kind === tabKind();
        d.hidden = count === 0 || !inTab; if (inTab) shown += count;
        // While searching, open groups with matches so results are one tap away; fold them back after.
        const key = d.dataset.category;
        if (term && count && inTab && !d.open) { d.open = true; autoOpened.add(key); }
        else if (!term && autoOpened.has(key)) { d.open = false; autoOpened.delete(key); }
        showGroupMatches(d, count, term);
    });
    const none = ui.panel.querySelector('.mw-no-results'); if (none) none.hidden = shown > 0 || !term;
}
// The panel redraws straight away and the chat is saved after, so a tap (taking something off especially, which
// used to wait for the save) shows at once. Saving a long chat can take a moment on a phone.
export async function changeState(mutator) {
    const s = viewState(); if (!s) return;
    // A moon or step tap has already drawn itself, so the full redraw can wait a frame (2.0.38).
    mutator(s); if (Date.now() - (ui.tapDrawnAt ?? 0) < 400) renderSoon(); else render(); await persist(s); await syncPrompt();
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
    const lines = [`v${VERSION} from \u201c${folderOf(SELF)}\u201d`];
    if (!ui.panel?.isConnected) return [...lines, 'The panel is missing from the page.'].join('\n');
    const cs = getComputedStyle(ui.panel), r = ui.panel.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    lines.push(`open: ${ui.panel.open ? 'yes' : 'no'}`);
    if (ui.lastDrawError) lines.push(`drawing failed: ${ui.lastDrawError}`);
    if (showError) lines.push(`showing failed: ${showError}`);
    lines.push(`box: left ${Math.round(r.left)}, top ${Math.round(r.top)}, ${Math.round(r.width)}\u00d7${Math.round(r.height)} on a ${vw}\u00d7${vh} screen`);
    lines.push(`style: display ${cs.display}, visibility ${cs.visibility}, opacity ${cs.opacity}, z-index ${cs.zIndex}, position ${cs.position}${ui.panel.hidden ? ', hidden attribute set' : ''}`);
    // Name the stylesheet rule that hides it, so a theme or another extension can be found.
    if (cs.display === 'none') lines.push(`hidden by: ${hidingRules(ui.panel).join(' | ') || 'no stylesheet rule found (inline style or a script)'}`);
    const x = Math.min(vw - 2, Math.max(1, r.left + r.width / 2)), y = Math.min(vh - 2, Math.max(1, r.top + Math.min(40, r.height / 2)));
    const hit = document.elementFromPoint(x, y);
    lines.push(`on top there: ${!hit ? 'nothing' : ui.panel.contains(hit) ? 'the panel' : describe(hit)}`);
    return lines.join('\n');
}
// The phone sheet sits at the bottom by moving up its own height. A height like 786.6px leaves every line of text
// between pixels, and Safari draws the dock and tab labels soft. This nudges it back onto whole pixels whenever the
// sheet changes size.
let snapWatch = null;
export function snapToPixels(el) {
    if (!el) return;
    const fix = () => { el.style.setProperty('--mw-snap', '0px'); const top = el.getBoundingClientRect().top, off = top - Math.round(top);
        if (Math.abs(off) > 0.01) el.style.setProperty('--mw-snap', `${-off}px`); };
    fix();
    if (!snapWatch && typeof ResizeObserver === 'function') { snapWatch = new ResizeObserver(() => requestAnimationFrame(fix)); snapWatch.observe(el); window.addEventListener('resize', () => requestAnimationFrame(fix)); }
}
export function openPanel() {
    note('Pressed. Opening\u2026');
    if (run.suspended) { note('Moodweaver is switched off in Manage extensions.', true); globalThis.toastr?.info('Moodweaver is switched off. Turn it back on in Manage extensions.'); return; }
    let showError = '';
    try {
        render(false, true);
        if (ui.panel.hidden) ui.panel.hidden = false;
        if (!ui.panel.open) { ui.panel.show(); ui.panel.focus({ preventScroll: true }); } snapToPixels(ui.panel);
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

// 1.86: a soft glow on whatever was just tapped (a button, a moon, a step, a pill, a star), so a tap shows it
// registered. The panel often redraws on a tap, so the glow is found again after each draw by the element's
// data attributes and carries on from where it was.
const GLOW_MS = 900, GLOWABLE = 'button, input[type=checkbox], .mw-moon, [data-pill], [data-range-step], label.mw-toggle';
const glowKey = el => {
    const attrs = [...el.attributes].filter(a => a.name.startsWith('data-') || a.name === 'id').map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join('');
    return attrs ? `${el.tagName.toLowerCase()}${attrs}` : '';
};
export function tapGlow(e) {
    const el = e.target?.closest?.(GLOWABLE); if (!el || !ui.panel?.contains(el)) return;
    const target = el.matches('input[type=checkbox]') ? el.closest('label') ?? el : el;
    const key = glowKey(target), nth = key ? [...ui.panel.querySelectorAll(key)].indexOf(target) : -1;
    ui.glow = { key, nth, at: Date.now() }; light(target, 0);
}
// 2.0.38: no forced layout to restart the glow (reading offsetWidth made the phone lay out the whole panel on
// every tap): a fresh element just gets the class, and one already glowing restarts on the next frame.
function light(el, skip) {
    const go = () => { el.style.setProperty('--mw-glow-skip', `${-skip}ms`); el.classList.add('mw-tapglow');
        clearTimeout(el.mwGlow); el.mwGlow = setTimeout(() => el.classList.remove('mw-tapglow'), GLOW_MS - skip + 50); };
    if (el.classList.contains('mw-tapglow')) { el.classList.remove('mw-tapglow'); requestAnimationFrame(go); } else go();
}
export function reglow(root) {
    const g = ui.glow; if (!g?.key) return; const ago = Date.now() - g.at; if (ago >= GLOW_MS - 80) return;
    try { const all = root.querySelectorAll(g.key), el = all[g.nth] ?? (all.length === 1 ? all[0] : null); if (el) light(el, ago); } catch { /* odd attribute value */ }
}
