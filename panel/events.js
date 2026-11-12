// What happens when you type, tap or change something in the panel.
import { currentPeer, ensureRelation, getCast, getKnowledge, getPair, getState, getStoryState, getUserState, keyForTarget, loadCastDefault, members, pairId, peers, persist, personKeyOfSubject, playerName, relationshipList, resolveRelationName, saveCastDefault, selectedCast, selectedRelation, subjectName, swapTarget, target, validRelationName, viewState } from '../app/chat.js';
import { setLaunch } from '../app/launcher.js';
import { syncPrompt } from '../app/note.js';
import { analyse, cancelAnalysis, readBond } from '../app/reader.js';
import { boardMemoryCount, bondAxes, bondData, bondList, bondOverlaps, editBoard, editBond, feedsMeters, liveChat, liveFor, moodTarget, untouchedMemory, userRelation } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { KEY, ctx, newId, put, run, ui } from '../app/state.js';
import { EDIT_FIELDS, NO_BOARD, latestBoard, liveBoard, needWord } from '../engine/board.js';
import { cleanDesire, computeBond, dynamicRows, setDesire, setMeter } from '../engine/bond.js';
import { addCastMember, castName, newCastId } from '../engine/cast.js';
import { BY_ID, MOODS, RECIPES, STORY_RECIPES, sectionOf } from '../data/catalogue.js';
import { WANT_KINDS, cleanScope, cleanWants, freshState, knowledgeEntry } from '../engine/state.js';
import { clamp, shortName } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { effectiveChat, untrack } from '../engine/ledger.js';
import { MORE_PRESETS, cleanMore, setMore } from '../engine/meters.js';
import { MOOD_PACE } from '../engine/moodpace.js';
import { droppedIds } from '../engine/overlap.js';
import { clearPanelSearch, rememberGroupChoice } from './scroll-memory.js';
import { changeState, fillLazy, filterLocalLists, filterRelationships, filterRows, render, renderStatus } from './render.js';
import { turnFill, turnLevel } from './rows.js';
import { clearSection, lastMoodRec, tabKind } from './sections.js';
import { clearAllPins, clearEverything, pinCounts, pinWords, undoClear } from './settings-sheet.js';
import { filterSkills } from './skills-tab.js';
import { filterPersonality } from './personality-tab.js';
import { cleanEnneagram, cleanPersonality } from '../engine/personality.js';
import { cleanCombos } from '../engine/reactive.js';
import { RELATIONSHIP_BY_ID, SHARED_BY_ID, cleanCompare, cloneRelationships, relationshipKey } from '../engine/relationships.js';
import { cleanAlways, cleanSkills, skillWord } from '../engine/skills.js';
import { TURN_BY_ID } from '../engine/turns.js';

export function onPanelInput(e) {
    if (e.target.hasAttribute('data-filter-list')) { filterLocalLists(); return; }
    if (e.target.hasAttribute('data-skill-search')) { filterSkills(); return; }
    if (e.target.dataset.skill !== undefined) {
        const v = Number(e.target.value), row = e.target.closest('.mw-skill-row');
        if (row) { put(row, 'output', `${v}/10`); put(row, '[data-skill-word]', v ? skillWord(v) : 'off'); }
        e.target.style.setProperty('--mw-fill', `${v * 10}%`); return;
    }
    if (e.target.dataset.wantValue !== undefined || e.target.dataset.field === 'follow') {
        const v = Number(e.target.value), row = e.target.closest('.mw-mood');
        if (row) { put(row, 'output', `${v}%`); put(row, '[data-lvl]', level(v)); e.target.style.setProperty('--mw-fill', `${v}%`); }
        else { put(ui.panel, '[data-follow-out]', `${v}%`); e.target.style.setProperty('--mw-fill', `${(v - 10) / .9}%`); }
        return;
    }
    if (e.target.hasAttribute('data-dyn-search')) {
        const q = e.target.value.trim().toLowerCase();
        ui.panel.querySelectorAll('.mw-dyn-group').forEach(g => {
            let hits = 0;
            g.querySelectorAll('[data-dyn-row]').forEach(r => { const show = !q || r.dataset.dynRow.includes(q); r.hidden = !show; if (show) hits++; });
            g.hidden = Boolean(q) && !hits; if (q && hits) g.open = true;
        });
        return;
    }
    if (e.target.dataset.moreMeter) { const v = Number(e.target.value); e.target.style.setProperty('--mw-fill', `${e.target.dataset.two === '1' ? (v + 100) / 2 : v}%`); return; }
    if (e.target.dataset.desireBar) { e.target.style.setProperty('--mw-fill', `${e.target.value}%`); return; }
    if (e.target.dataset.bondMeter) {
        const key = e.target.dataset.bondMeter, v = Number(e.target.value);
        e.target.style.setProperty('--mw-fill', `${(v + 100) / 2}%`);
        const out = ui.panel.querySelector(`[data-bond-out="${key}"]`); if (out) out.textContent = v;
        return;
    }
    if (e.target.dataset.need) {
        const id = e.target.dataset.need, v = Number(e.target.value), word = id === 'horny' ? level(v) : needWord(v);
        const label = ui.panel.querySelector(`[data-need-word="${id}"]`); if (label) label.textContent = word;
        e.target.style.setProperty('--mw-fill', `${v}%`); e.target.setAttribute('aria-valuetext', word);
        e.target.closest('.mw-need')?.style.setProperty('--mw-need', v <= 15 ? '#e46a6a' : v <= 35 ? '#e79a5c' : v <= 65 ? '#dfc56c' : '#8fd18a');
        return;
    }
    if (['mw-type-search', 'mw-enneagram-search'].includes(e.target.id)) { filterPersonality(ui.panel); return; }
    if (e.target.dataset.personality === 'strength') {
        const v = Number(e.target.value), row = e.target.closest('.mw-mood');
        put(row, 'output', `${v}%`); put(row, '[data-lvl]', level(v));
        e.target.style.setProperty('--mw-fill', `${v}%`); e.target.setAttribute('aria-valuetext', `${v} percent, ${level(v)}`); return;
    }
    if (e.target.hasAttribute('data-relation-search')) {
        filterRelationships(e.target.value); return;
    }
    if (e.target.dataset.turn !== undefined) {
        const v = Number(e.target.value), row = e.target.closest('.mw-mood');
        put(row, '[data-lvl]', turnLevel(v)); e.target.setAttribute('style', turnFill(v)); return;
    }
    if (e.target.dataset.pairSlider || e.target.dataset.compareSlider || e.target.dataset.mem !== undefined) {
        const value = Number(e.target.value), row = e.target.closest('.mw-mood');
        put(row, 'output', `${value}%`); put(row, '[data-lvl]', level(value));
        e.target.style.setProperty('--mw-fill', `${value}%`); return;
    }
    if (e.target.dataset.relSlider) {
        const value = Number(e.target.value);
        const row = e.target.closest('.mw-mood');
        put(row, 'output', `${value}%`); put(row, '[data-lvl]', level(value));
        e.target.style.setProperty('--mw-fill', `${value}%`); e.target.setAttribute('aria-valuetext', `${value} percent, ${level(value)}`); return;
    }
    if (e.target.matches('.mw-search')) { ui.search = e.target.value; filterRows(); return; }
    if (e.target.dataset.target === 'year') {
        const state = viewState(); if (!state) return;
        state.targets ??= {};
        state.targets.year = e.target.value.replace(/\s+/g, ' ').trim().slice(0, 20);
        void persist(state); void syncPrompt(); return;
    }
    if (['hate', 'compareA', 'compareB'].includes(e.target.dataset.target)) {
        const state = viewState(); if (!state) return;
        state.targets ??= {};
        state.targets[e.target.dataset.target] = castName(e.target.value);
        void persist(state); void syncPrompt(); return;
    }
    const sourceId = e.target.dataset.knowledgeSource;
    if (sourceId && ui.who === 'user' && (BY_ID[sourceId] || sourceId.startsWith('turn:') && TURN_BY_ID[sourceId.slice(5)] || ['personality', 'enneagram'].includes(sourceId))) {
        const knowledge = getKnowledge(target(), true);
        knowledge[sourceId] = knowledgeEntry({ ...knowledgeEntry(knowledge[sourceId]), source: e.target.value });
        // Keep the draft in metadata before any other control can redraw the panel.
        void persist(); void syncPrompt(); return;
    }
    if (e.target.dataset.slider) {
        const id = e.target.dataset.slider, value = Number(e.target.value);
        put(ui.panel, `[data-value="${id}"]`, `${value}%`);
        put(ui.panel, `[data-level="${id}"]`, level(value));
        e.target.style.setProperty('--mw-fill', `${value}%`); e.target.setAttribute('aria-valuetext', `${value} percent, ${level(value)}`);
    }
}
export function onPanelKeydown(e) {
    if (e.key === 'Enter' && e.target.hasAttribute('data-inv-new')) { e.preventDefault(); ui.panel.querySelector('[data-action="inv-add"]')?.click(); }
    if (e.key === 'Enter' && e.target.dataset.wantNew) { e.preventDefault(); ui.panel.querySelector(`[data-action="want-add"][data-kind="${e.target.dataset.wantNew}"]`)?.click(); }
    if (e.key === 'Enter' && (e.target.dataset.boardAdd || e.target.dataset.boardField)) { e.preventDefault(); e.target.blur(); }
}
export async function onPanelChange(e) {
    const input = e.target;
    if (input.dataset.skill !== undefined) { const id = input.dataset.skill, v = Number(input.value); await changeState(s => { s.skills = cleanSkills(s.skills); if (v > 0) s.skills[id] = v; else delete s.skills[id]; }); return; }
    if (input.hasAttribute('data-skill-lookback')) { const c = ctx(); settings(); c.extensionSettings[KEY].skillLookback = Number(input.value) || 1; c.saveSettingsDebounced(); await syncPrompt(); render(); return; }
    if (input.dataset.launch === 'show') { setLaunch({ show: input.checked }); return; }
    if (input.dataset.launch === 'small') { setLaunch({ small: input.checked }); return; }
    if (input.dataset.need) { const id = input.dataset.need, v = Number(input.value); await editBoard(b => { b.needs[id] = v; }); return; }
    if (input.hasAttribute('data-board-send')) { await editBoard(b => { b.send = input.checked; }); return; }
    if (input.hasAttribute('data-board-horny')) { await editBoard(b => { b.includeHorny = input.checked; }); return; }
    if (input.dataset.bondMeter) { const key = input.dataset.bondMeter, v = Number(input.value); await editBond((b, list) => setMeter(b, key, v, list)); return; }
    if (input.hasAttribute('data-bond-on')) { await editBond(b => { b.on = input.checked; }); return; }
    // The desire card.
    if (input.hasAttribute('data-mood-auto')) { await changeState(s => { s.moodAuto = input.checked; }); return; }
    if (input.hasAttribute('data-mood-fade')) { await changeState(s => { s.moodFade = input.checked; }); return; }
    // One pace off: the Moods card starts from the Bonds pace, so nothing jumps until you change it.
    if (input.hasAttribute('data-one-pace')) { const pace = bondData(target()).pace; if (!input.checked) await changeState(s => { s.moodPace = MOOD_PACE[pace] ? pace : s.moodPace; }); await editBond(b => { b.onePace = input.checked; }); return; }
    if (input.hasAttribute('data-mood-scope')) { await changeState(s => { s.moodScope = input.value === 'list' ? 'list' : 'any'; }); return; }
    if (input.hasAttribute('data-mood-pace')) { await changeState(s => { s.moodPace = MOOD_PACE[input.value] ? input.value : 'steady'; }); return; }
    if (input.hasAttribute('data-desire-on')) { await editBond(b => { b.desire = { ...cleanDesire(b.desire), on: input.checked }; }); return; }
    if (input.hasAttribute('data-desire-pace')) { await editBond(b => { b.desire = { ...cleanDesire(b.desire), speed: input.value }; }); return; }
    if (input.hasAttribute('data-desire-cap')) { await editBond(b => { b.desire = { ...cleanDesire(b.desire), cap: Number(input.value) }; }); return; }
    if (input.dataset.moreOn) { const key = input.dataset.moreOn; await editBond(b => { const d = cleanMore(b.more); d.on = input.checked ? [...d.on, key] : d.on.filter(k => k !== key); b.more = d; }); return; }
    if (input.dataset.moreMeter) { const key = input.dataset.moreMeter, v = Number(input.value); await editBond((b, list) => setMore(b, key, v, list)); return; }
    if (input.dataset.desireScale) { const key = input.dataset.desireScale; await editBond(b => { const d = cleanDesire(b.desire); d.scales[key] = input.checked; b.desire = d; }); return; }
    if (input.dataset.desireBar) { const key = input.dataset.desireBar, v = Number(input.value); await editBond((b, list) => setDesire(b, key, v, list)); return; }
    if (input.hasAttribute('data-bond-extra')) { await editBond(b => { b.extra = input.checked; }); return; }
    if (input.hasAttribute('data-bond-dynamic')) { await editBond(b => { b.fixed = input.value; }); return; }
    if (input.hasAttribute('data-dyn-pace')) { await editBond(b => { b.pace = input.value; }); return; }
    if (input.hasAttribute('data-dyn-nudge')) { await editBond(b => { b.nudge = input.checked; }); return; }
    if (input.dataset.dynPronoun) { await editBond(b => { b[input.dataset.dynPronoun === 'u' ? 'pu' : 'pn'] = input.value; }); return; }
    if (input.dataset.dynPool) { const name = input.dataset.dynPool; await editBond(b => { b.pool = input.checked ? [...b.pool, name] : b.pool.filter(x => x !== name); }); return; }
    if (input.hasAttribute('data-board-feed')) { await editBoard(b => { b.feed = input.checked; }); return; }
    if (input.hasAttribute('data-board-toward')) { await editBoard(b => { b.includeToward = input.checked; }); return; }
    if (input.hasAttribute('data-board-sync')) { settings().boardPresent = input.checked; ctx().saveSettingsDebounced(); render(); return; }
    if (input.dataset.boardAdd) {
        const kind = input.dataset.boardAdd, t = input.value.replace(/\s+/g, ' ').trim().slice(0, 60); if (!t || !['state', 'physical'].includes(kind)) return;
        await editBoard(b => { b.keep[kind] = [...b.keep[kind], t]; b.mute[kind] = b.mute[kind].filter(x => x.toLowerCase() !== t.toLowerCase()); }); return;
    }
    if (input.dataset.boardField && EDIT_FIELDS.includes(input.dataset.boardField)) {
        // A correction to the newest board: the next reply uses it and carries it on.
        const key = input.dataset.boardField, value = input.value.replace(/\s+/g, ' ').trim().slice(0, 200);
        const found = latestBoard(liveChat()), raw = liveBoard(found, {}, { char: target()?.name ?? '', user: playerName() });
        const own = key === 'date' ? raw.day : raw[key] ?? '';
        await editBoard(b => { if (!value || value === own) delete b.fix[key]; else b.fix[key] = { text: value, on: found?.key ?? NO_BOARD, pos: found?.index ?? liveChat().length }; }); return;
    }
    if (input.dataset.settingBool) { settings()[input.dataset.settingBool] = input.checked; ctx().saveSettingsDebounced(); await syncPrompt(); render(); return; }
    if (input.dataset.settingChoice) { settings()[input.dataset.settingChoice] = input.value; ctx().saveSettingsDebounced(); await syncPrompt(); render(); return; }
    if (input.dataset.wantText !== undefined || input.dataset.wantValue !== undefined) {
        const id = input.dataset.wantText ?? input.dataset.wantValue;
        await changeState(s => { const w = s.wants.find(x => x.id === id); if (!w) return;
            if (input.dataset.wantValue !== undefined) w.value = Number(input.value);
            else { const t = input.value.replace(/\s+/g, ' ').trim().slice(0, 120); if (t) { w.text = t; w.read = false; } } }); return;
    }
    if (input.dataset.reader === 'profile') {
        settings().readerProfile = input.value; const main = getState(); if (main) main.profile = input.value;
        ctx().saveSettingsDebounced(); await persist(main); render(); return;
    }
    if (input.hasAttribute('data-auto-read')) { await changeState(s => { s.mode = input.checked ? 'dynamic' : 'manual'; s.lastFingerprint = ''; s.lastUserCount = -1; }); return; }
    if (input.dataset.personality) {
        const field = input.dataset.personality;
        const system = input.dataset.personalitySystem === 'enneagram' ? 'enneagram' : 'personality';
        const clean = system === 'enneagram' ? cleanEnneagram : cleanPersonality;
        if (!['enabled', 'type', 'expression', 'strength'].includes(field)) return;
        await changeState(s => {
            const p = clean(s[system]);
            p[field] = field === 'enabled' ? input.checked : field === 'strength' ? Number(input.value) : input.value;
            s[system] = clean(p);
        }); return;
    }
    if (input.hasAttribute('data-relation-enabled')) { const relation = selectedRelation(); if (relation) await changeState(() => { relation.enabled = input.checked; }); return; }
    if (input.dataset.pairSlider && SHARED_BY_ID[input.dataset.pairSlider]) {
        const peer = currentPeer(); if (!peer) return;
        const other = keyForTarget(peer.key);
        const pair = getPair(personKeyOfSubject(), other, true, other.startsWith('name:') ? { [other]: peer.name } : {});
        pair.moods[input.dataset.pairSlider] = Number(input.value); await persist(); await syncPrompt(); render(); return;
    }
    if (input.hasAttribute('data-pair-enabled')) { const pair = currentPeer()?.pair; if (pair) { pair.enabled = input.checked; await persist(); await syncPrompt(); render(); } return; }
    if (input.hasAttribute('data-compare-with') || input.hasAttribute('data-compare-favours') || input.dataset.compareSlider) {
        const peer = currentPeer(); if (!peer) return;
        await changeState(() => {
            const relation = ensureRelation(peer), compare = cleanCompare(relation.compare);
            if (input.hasAttribute('data-compare-with')) { compare.with = input.value; if (input.value && !compare.value) compare.value = 50; }
            else if (input.hasAttribute('data-compare-favours')) compare.favours = input.value;
            else compare.value = Number(input.value);
            relation.compare = compare;
        }); return;
    }
    if (input.hasAttribute('data-relation-note')) {
        const peer = currentPeer(); if (!peer) return;
        await changeState(() => { ensureRelation(peer).note = String(input.value).replace(/\s+/g, ' ').trim().slice(0, 160); }); return;
    }
    if (input.dataset.relSlider && RELATIONSHIP_BY_ID[input.dataset.relSlider]) {
        const peer = currentPeer(); if (!peer) return;
        await changeState(() => { ensureRelation(peer).moods[input.dataset.relSlider] = Number(input.value); }); return;
    }
    if (input.dataset.relKnowledge && ui.who === 'user' && RELATIONSHIP_BY_ID[input.dataset.relKnowledge]) {
        const relation = selectedRelation(); if (!relation) return;
        const knowledge = getKnowledge(target(), true), key = relationshipKey(relation, input.dataset.relKnowledge);
        if (input.value === 'scene') delete knowledge[key]; else knowledge[key] = knowledgeEntry({ ...knowledge[key], mode: input.value });
        await persist(); await syncPrompt(); render(); return;
    }
    if (input.dataset.target) return;
    const knowledgeId = input.dataset.knowledge || input.dataset.knowledgeSource;
    if (knowledgeId && ui.who === 'user' && (['personality', 'enneagram'].includes(knowledgeId) || TURN_BY_ID[knowledgeId.replace(/^turn:/, '')] && knowledgeId.startsWith('turn:') || BY_ID[knowledgeId] && BY_ID[knowledgeId].kind !== 'story')) {
        const knowledge = getKnowledge(target(), true);
        const previous = knowledgeEntry(knowledge[knowledgeId]);
        const next = knowledgeEntry(input.dataset.knowledge ? { ...previous, mode: input.value } : { ...previous, source: input.value });
        if (next.mode === 'scene') delete knowledge[knowledgeId]; else knowledge[knowledgeId] = next;
        await persist(); await syncPrompt(); render(); return;
    }
    if (input.dataset.invCarried !== undefined || input.dataset.invText !== undefined || input.dataset.invNote !== undefined) {
        const id = input.dataset.invCarried ?? input.dataset.invText ?? input.dataset.invNote;
        await changeState(s => { const item = (s.inventory ??= []).find(i => i.id === id); if (!item) return;
            if (input.dataset.invCarried !== undefined) item.carried = input.checked;
            else if (input.dataset.invText !== undefined) { const t = input.value.replace(/\s+/g, ' ').trim().slice(0, 60); if (t) item.text = t; }
            else item.note = input.value.replace(/\s+/g, ' ').trim().slice(0, 80); }); return;
    }
    if (input.dataset.shows !== undefined) { const id = input.dataset.shows; await changeState(s => { s.shows = { ...s.shows, [id]: input.value.trim().slice(0, 120) }; }); return; }
    if (input.dataset.cause !== undefined) { await changeState(s => { s.causes = { ...s.causes, [input.dataset.cause]: input.value.trim().slice(0, 100) }; }); return; }
    if (input.dataset.turn !== undefined && TURN_BY_ID[input.dataset.turn]) {
        const id = input.dataset.turn, v = Number(input.value);
        await changeState(s => { s.prefs = { ...s.prefs, [id]: v }; if (!s.loadout.includes(`turn:${id}`)) s.loadout.push(`turn:${id}`); }); return;
    }
    if (input.dataset.mem !== undefined || input.dataset.memText !== undefined || input.dataset.memWho !== undefined) {
        const pair = currentPeer()?.pair, id = input.dataset.mem ?? input.dataset.memText ?? input.dataset.memWho;
        const memory = pair?.memories?.find(m => m.id === id); if (!memory) return;
        if (input.dataset.mem !== undefined) memory.value = Number(input.value);
        else if (input.dataset.memText !== undefined) { const t = input.value.replace(/\s+/g, ' ').trim().slice(0, 160); if (t) memory.text = t; }
        else memory.who = input.value;
        await persist(); await syncPrompt(); render(); return;
    }
    if (input.dataset.slider) {
        await changeState(s => { s.moods[input.dataset.slider] = Number(input.value); if (!s.loadout.includes(input.dataset.slider)) s.loadout.push(input.dataset.slider); if (ui.who === 'char' && s.mode === 'dynamic') s.pins[input.dataset.slider] = true; }); return;
    }
    if (input.dataset.setting) { settings()[input.dataset.setting] = Number(input.value); settings(); ctx().saveSettingsDebounced(); await syncPrompt(); render(); return; }
    const field = input.dataset.field;
    if (field === 'character') { ui.selectedAvatar = input.value; ui.selectedCastId = ''; ui.selectedPeer = ''; ui.removingRelation = ''; ui.castAction = ''; run.status = ''; render(); await syncPrompt(); return; }
    if (field === 'cast') { ui.selectedCastId = input.value; ui.selectedPeer = ''; ui.removingRelation = ''; ui.castAction = ''; run.status = ''; render(); return; }
    if (field === 'castInScene') {
        const person = selectedCast(); if (!person) return;
        person.inScene = input.checked; await persist(); await syncPrompt(); render(); return;
    }
    if (field === 'castName') {
        const person = selectedCast(), name = castName(input.value);
        if (!person) return;
        if (!name || [playerName(), ...members().map(ch => ch.name), ...getCast().filter(p => p.id !== person.id).map(p => p.name)]
            .some(n => n.toLowerCase() === name.toLowerCase())) {
            run.status = 'Use a unique supporting-character name.'; render(); return;
        }
        const old = person.name; person.name = name;
        for (const s of [getState(), getUserState(), ...getCast().map(p => p.state)]) {
            for (const key of ['hate', 'compareA', 'compareB']) if (s?.targets?.[key] === old) s.targets[key] = name;
            for (const relation of s?.relationships ?? []) if (relation.target.toLowerCase() === old.toLowerCase()) relation.target = name;
        }
        await persist(); await syncPrompt(); render(); return;
    }
    if (field === 'recipe') { const recipe = (ui.who === 'story' ? STORY_RECIPES : RECIPES)[input.value]; if (recipe) await changeState(s => { for (const [k, v] of Object.entries(recipe)) if (!s.pins[k] && BY_ID[k]) { s.moods[k] = v; if (!s.loadout.includes(k)) s.loadout.push(k); } }); return; }
    if (field) await changeState(s => {
        s[field] = ['enabled', 'sceneBreathing'].includes(field) ? input.checked : field === 'profile' ? input.value : Number(input.value);
        if (['profile', 'interval'].includes(field)) { s.lastFingerprint = ''; s.lastUserCount = -1; }
        if (field === 'inertia') s[field] = clamp(s[field], 0, 95);
        if (field === 'sensitivity') s[field] = clamp(s[field], 10, 100);
        if (field === 'decay') s[field] = clamp(s[field], 0, 20);
        if (field === 'interval') s[field] = clamp(s[field], 1, 10);
        if (field === 'follow') s[field] = clamp(s[field], 10, 100);
    });
}
export async function onPanelClick(e) {
    const summary = e.target.closest('summary');
    if (summary?.parentElement.matches('details')) rememberGroupChoice(ui.panel, summary.parentElement);
    const button = e.target.closest('button'); if (!button) return;
    if (button.dataset.who) {
        if (button.closest('.mw-board')) ui.tab = 'mood';
        ui.who = button.dataset.who; ui.browsing = false; ui.settingsOpen = false; ui.boardFocus = ''; if (button.dataset.castId) ui.selectedCastId = button.dataset.castId;
        ui.selectedPeer = ''; ui.removingRelation = ''; ui.castAction = ''; run.status = ''; render(); return;
    }
    if (button.dataset.boardTile) { ui.boardFocus = ui.boardFocus === button.dataset.boardTile ? '' : button.dataset.boardTile; render(); return; }
    if (button.dataset.boardKeep || button.dataset.boardCut) {
        const kind = button.dataset.boardKeep || button.dataset.boardCut, text = ui.boardFocus.slice(ui.boardFocus.indexOf(':') + 1), same = x => x.toLowerCase() === text.toLowerCase();
        if (!text || !['state', 'physical'].includes(kind)) return;
        const keep = Boolean(button.dataset.boardKeep);
        if (!keep) ui.boardFocus = '';
        await editBoard(b => {
            const kept = b.keep[kind].some(same);
            if (keep) b.keep[kind] = kept ? b.keep[kind].filter(x => !same(x)) : [...b.keep[kind], text];
            else { b.keep[kind] = b.keep[kind].filter(x => !same(x)); if (String(liveFor().board?.[kind] ?? '').toLowerCase().includes(text.toLowerCase())) b.mute[kind] = [...b.mute[kind], text]; }
        }); return;
    }
    if (button.dataset.boardUnpin) { const key = button.dataset.boardUnpin; await editBoard(b => { delete b.fix[key]; }); return; }
    if (button.dataset.dynMode) {
        const mode = button.dataset.dynMode, ch = target();
        const now = computeBond(bondData(ch), Infinity, shortName(ch.name), shortName(playerName()), bondAxes(ch), bondList(ch)).dynamic.key;
        await editBond(b => { if (mode === 'pick') b.fixed = b.fixed || now; else { b.fixed = ''; b.mode = mode; } }); return;
    }
    if (button.dataset.dynGroupAll) {
        const names = dynamicRows().filter(r => r[3] === button.dataset.dynGroupAll).map(r => r[0]);
        await editBond(b => { const all = names.every(x => b.pool.includes(x)); b.pool = all ? b.pool.filter(x => !names.includes(x)) : [...new Set([...b.pool, ...names])]; }); return;
    }
    // Turn off the extra copies of a doubled-up idea (or all of them). Meters, the dynamic and
    // moodlets stay as they are; only the sliders, both-ways tags and story tropes the note was skipping go to 0.
    if (button.dataset.overlapTidy !== undefined) {
        const ch = target(), only = button.dataset.overlapTidy, st = getState(ch), story = getStoryState(ch);
        const list = bondOverlaps(ch, effectiveChat(ctx().chat ?? [])).filter(o => !only || o.key === only).map(o => ({ ...o, drop: o.drop.filter(x => !feedsMeters(x)) }));
        const ids = droppedIds(list), rel = st ? userRelation(st) : null, pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')];
        for (const id of ids.rel) if (rel?.moods) rel.moods[id] = 0;
        for (const id of ids.shared) if (pair?.moods) pair.moods[id] = 0;
        for (const id of ids.story) if (story?.moods) story.moods[id] = 0;
        const count = ids.rel.size + ids.shared.size + ids.story.size;
        run.status = count ? `Turned off ${count} extra cop${count === 1 ? 'y' : 'ies'}. Each idea now lives in one place.` : 'Nothing doubled up to tidy.';
        if (ids.story.size && story) story.revision = (story.revision || 0) + 1;
        await persist(ids.rel.size ? st : null); await syncPrompt(); render(); renderStatus(); return;
    }
    if (['dyn-pool-save', 'dyn-pool-load', 'dyn-pool-clear', 'bond-reread'].includes(button.dataset.action)) {
        const ch = target(), key = `char:${ch?.avatar}`, act = button.dataset.action;
        if (act === 'bond-reread') { await readBond(ch); return; }
        if (act === 'dyn-pool-save') { settings().dynamicPools[key] = [...bondData(ch).pool]; ctx().saveSettingsDebounced(); run.status = `Saved ${bondData(ch).pool.length} picks for ${ch.name}’s new chats.`; renderStatus(); return; }
        if (act === 'dyn-pool-load') { const saved = settings().dynamicPools?.[key] ?? []; await editBond(b => { b.pool = [...saved]; }); return; }
        await editBond(b => { b.pool = []; }); return;
    }
    if (button.dataset.morePreset !== undefined) {
        const pick = MORE_PRESETS.find(([name]) => name === button.dataset.morePreset)?.[1] ?? [];
        await editBond(b => { const d = cleanMore(b.more); d.on = [...pick]; b.more = d; }); return;
    }
    if (button.dataset.morePin) {
        const key = button.dataset.morePin;
        await editBond((b, list) => {
            const d = b.more = cleanMore(b.more);
            if (d.pins[key] === null) d.pins[key] = Number(ui.panel.querySelector(`[data-more-meter="${key}"]`)?.value ?? 0);
            else { const v = d.pins[key]; d.pins[key] = null; setMore(b, key, v, list); }
        });
        return;
    }
    if (button.dataset.comboRemove) { const id = button.dataset.comboRemove; await changeState(s => { s.combos = cleanCombos(s.combos).filter(c => c.id !== id); }); return; }
    if (button.dataset.desirePin) {
        const key = button.dataset.desirePin;
        await editBond((b, list) => {
            const d = b.desire = cleanDesire(b.desire);
            if (d.pins[key] === null) d.pins[key] = Number(ui.panel.querySelector(`[data-desire-bar="${key}"]`)?.value ?? 0);
            else { const v = d.pins[key]; d.pins[key] = null; setDesire(b, key, v, list); }
        });
        return;
    }
    if (button.dataset.bondPin) {
        const key = button.dataset.bondPin;
        // Unpinning leaves the meter where it was pinned; later replies move it from there.
        await editBond((b, list) => {
            if (b.pins[key] === null) b.pins[key] = Number(ui.panel.querySelector(`[data-bond-meter="${key}"]`)?.value ?? 0);
            else { const v = b.pins[key]; b.pins[key] = null; setMeter(b, key, v, list); }
        }); return;
    }
    if (button.dataset.skillAlways) { const id = button.dataset.skillAlways; await changeState(s => { const a = cleanAlways(s.skillAlways); if (a[id]) delete a[id]; else a[id] = true; s.skillAlways = a; }); return; }
    if (button.dataset.skillJump) { const row = ui.panel.querySelector(`[data-skill-row="${CSS.escape(button.dataset.skillJump)}"]`); if (row) { const fold = row.closest('details'); if (fold) fold.open = true; row.scrollIntoView({ block: 'center', behavior: 'smooth' }); } return; }
    if (button.dataset.bondMute) {
        const text = button.dataset.bondMute;
        await editBond(b => { b.own = b.own.filter(t => t.toLowerCase() !== text.toLowerCase()); b.muted.push(text.toLowerCase()); }); return;
    }
    if (button.dataset.action === 'bond-add') {
        const text = String(ui.panel.querySelector('[data-bond-new]')?.value ?? '').trim(); if (!text) return;
        await editBond(b => { b.own.push(text); b.muted = b.muted.filter(t => t !== text.toLowerCase()); }); return;
    }
    if (button.dataset.needUnpin) { const id = button.dataset.needUnpin; await editBoard(b => { delete b.needs[id]; }); return; }
    if (button.dataset.boardAddcast) {
        try {
            const person = addCastMember(getCast(), button.dataset.boardAddcast, newCastId(), [playerName(), ...members().map(ch => ch.name)]);
            run.status = `${person.name} added to the cast, in this scene.`; await persist(); await syncPrompt(); render();
        } catch (error) { run.status = error.message; renderStatus(); }
        return;
    }
    if (button.dataset.peer !== undefined) { ui.selectedPeer = button.dataset.peer; ui.removingRelation = ''; render(); return; }
    if (button.dataset.pairTab) { ui.pairView = button.dataset.pairTab; ui.removingRelation = ''; render(); return; }
    if (button.dataset.loadout) {
        const id = button.dataset.loadout;
        await changeState(s => { if (s.loadout.includes(id)) s.loadout = s.loadout.filter(x => x !== id); else s.loadout.push(id); }); return;
    }
    if (button.dataset.unlist) {
        const id = button.dataset.unlist;
        await changeState(s => { s.loadout = s.loadout.filter(x => x !== id);
            if (id.startsWith('turn:')) { const { [id.slice(5)]: _, ...rest } = s.prefs; s.prefs = rest; }
            else { s.moods[id] = 0; s.pins[id] = false; const { [id]: __, ...causes } = s.causes; s.causes = causes; } }); return;
    }
    if (button.dataset.invRemove) { const id = button.dataset.invRemove; await changeState(s => { s.inventory = (s.inventory ?? []).filter(i => i.id !== id); }); return; }
    if (button.dataset.memRemove) {
        const pair = currentPeer()?.pair; if (!pair) return;
        pair.memories = (pair.memories ?? []).filter(m => m.id !== button.dataset.memRemove); await persist(); await syncPrompt(); render(); return;
    }
    if (button.dataset.mode) { await changeState(s => { s.mode = button.dataset.mode; }); return; }
    if (button.dataset.wing !== undefined) { await changeState(s => { s.enneagram = cleanEnneagram({ ...cleanEnneagram(s.enneagram), wing: button.dataset.wing }); }); return; }
    if (button.dataset.action === 'mood-undo-last') {
        const ch = target(), st = getState(ch), rec = lastMoodRec(ch); if (!st || !rec) return;
        const back = untrack(moodTarget(st), rec.m);
        if (rec.q) st.moodQuiet = structuredClone(rec.q);
        // Kept in the record (so the reply isn't applied again), with nothing left to apply.
        rec.m = {}; rec.f = []; rec.undone = true; st.revision = (st.revision || 0) + 1;
        run.status = back.length ? `Undid what the last reply did to ${back.length} feeling${back.length === 1 ? '' : 's'}.` : 'Nothing to undo: those feelings were changed by hand since.';
        await persist(st); await syncPrompt(); render(); renderStatus(); return;
    }
    if (button.dataset.scope) { const k = button.dataset.scope; await changeState(s => { s.readScope = cleanScope({ ...s.readScope, [k]: !cleanScope(s.readScope)[k] }); }); return; }
    if (button.dataset.readerMsgs) { settings().sceneMessages = Number(button.dataset.readerMsgs); ctx().saveSettingsDebounced(); render(); return; }
    if (button.dataset.wantDone || button.dataset.wantRestore) {
        const id = button.dataset.wantDone || button.dataset.wantRestore;
        await changeState(s => { const w = s.wants.find(x => x.id === id); if (w) w.done = Boolean(button.dataset.wantDone); }); return;
    }
    if (button.dataset.wantRemove) { const id = button.dataset.wantRemove; await changeState(s => { s.wants = s.wants.filter(w => w.id !== id); }); return; }
    // The story's suggestions and its "came true" calls.
    if (button.dataset.wantSuggest) { const t = button.dataset.wantSuggest; await changeState(s => { s.wants = cleanWants([...s.wants, { id: newId(), kind: 'want', text: t, value: 55 }]); }); return; }
    if (button.dataset.wantDismiss) { const t = button.dataset.wantDismiss; await changeState(s => { s.wantsDismissed = [...new Set([...(s.wantsDismissed ?? []), t.toLowerCase()])].slice(-40); }); return; }
    if (button.dataset.wantNotyet) { const id = button.dataset.wantNotyet, at = Number(button.dataset.at); await changeState(s => { const w = s.wants.find(x => x.id === id); if (w) w.after = at; }); return; }
    if (button.dataset.tab) { ui.tab = button.dataset.tab; ui.search = ''; ui.browsing = false; ui.removingRelation = ''; render(); return; }
    if (button.dataset.pin) { await changeState(s => { s.pins[button.dataset.pin] = !s.pins[button.dataset.pin]; }); return; }
    if (button.dataset.jump) {
        clearPanelSearch(ui.panel, '.mw-search'); ui.search = ''; if (ui.who !== 'story') ui.tab = button.dataset.jump.startsWith('turn:') ? 'turn' : sectionOf(BY_ID[button.dataset.jump]); render(); fillLazy(ui.panel);
        const row = ui.panel.querySelector(`[data-mood="${button.dataset.jump}"]`); if (!row) return;
        const category = row.closest('details'); if (category) category.open = true;
        row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.querySelector('input')?.focus({ preventScroll: true }); return;
    }
    switch (button.dataset.action) {
        case 'relation-add': {
            try {
                const typed = castName(ui.panel.querySelector('[data-relation-new]')?.value ?? '');
                const existing = peers().find(p => p.name.toLowerCase() === resolveRelationName(typed).toLowerCase());
                if (existing) { ui.selectedPeer = existing.key; ui.removingRelation = ''; run.status = ''; render(); break; }
                const name = validRelationName(typed);
                const relation = cloneRelationships([{ id: newCastId(), target: name }])[0];
                relationshipList().push(relation); ui.selectedPeer = name; ui.removingRelation = ''; run.status = '';
                await persist(viewState()); await syncPrompt(); render();
            } catch (error) { run.status = error.message; renderStatus(); }
            break;
        }
        case 'rel-swap': {
            const peer = currentPeer(), next = peer && swapTarget(peer); if (!next) break;
            const fromKey = ui.who === 'char' ? (members().length > 1 ? target().name : '{{char}}') : ui.who === 'user' ? '{{user}}' : selectedCast()?.name;
            if (next.avatar) ui.selectedAvatar = next.avatar;
            if (next.castId) ui.selectedCastId = next.castId;
            ui.who = next.who; ui.selectedPeer = fromKey ?? ''; ui.removingRelation = ''; ui.tab = 'rel';
            render(); await syncPrompt(); break;
        }
        case 'settings': ui.settingsOpen = true; render(); ui.panel.scrollTo({ top: 0 }); break;
        case 'launch-reset': setLaunch({ x: null, y: null, show: true }); render(); break;
        case 'board-memories-delete': {
            const ch = target(), pair = getPair(`char:${ch?.avatar}`, 'user'), n = boardMemoryCount(ch); if (!pair || !n) break;
            if (!confirm(`Delete the ${n} memor${n === 1 ? 'y' : 'ies'} the board saved for ${ch.name} and ${playerName()}? Memories you added or edited stay.`)) break;
            pair.memories = pair.memories.filter(m => !untouchedMemory(m));
            run.status = `Deleted ${n} saved memor${n === 1 ? 'y' : 'ies'}.`; await persist(); await syncPrompt(); render(); break;
        }
        case 'unpin-all': {
            const n = pinCounts(), words = n ? pinWords(n) : ''; if (!words) break;
            if (!confirm(`Unpin everything in this chat? That's ${words}. Values stay where they are and can move again.`)) break;
            run.status = `Unpinned ${await clearAllPins()}.`; renderStatus(); break;
        }
        case 'board-edit': ui.boardEditing = true; ui.boardFocus = ''; render(); ui.panel.querySelector('[data-board-field]')?.scrollIntoView({ block: 'center' }); break;
        case 'board-edit-done': ui.boardEditing = false; render(); break;
        case 'settings-close': ui.settingsOpen = false; render(); break;
        case 'combo-add': {
            const val = sel => ui.panel.querySelector(sel)?.value?.trim() ?? '';
            const combo = { id: newId(), a: val('[data-combo-a]'), b: val('[data-combo-b]'), name: val('[data-combo-name]'), text: val('[data-combo-text]') };
            if (!combo.a || !combo.b || !combo.name) { run.status = 'A combo needs two things and a name.'; renderStatus(); break; }
            await changeState(s => { s.combos = cleanCombos([...cleanCombos(s.combos), combo]); }); break;
        }
        case 'want-add': {
            const kind = button.dataset.kind, field = ui.panel.querySelector(`[data-want-new="${kind}"]`);
            const t = field?.value.replace(/\s+/g, ' ').trim().slice(0, 120); if (!t || !WANT_KINDS.includes(kind)) break;
            await changeState(s => { s.wants = cleanWants([...s.wants, { id: newId(), kind, text: t, value: 50 }]); });
            ui.panel.querySelector(`[data-want-new="${kind}"]`)?.focus(); break;
        }
        case 'scene-mark': { const meta = ctx().chatMetadata[KEY]; if (!meta) break; meta.sceneStart = Math.max(0, ctx().chat.length - 1); run.status = 'New scene marked. The reader ignores everything before it.'; await persist(); render(); break; }
        case 'scene-clear': { const meta = ctx().chatMetadata[KEY]; if (meta) delete meta.sceneStart; await persist(); render(); break; }
        case 'browse': ui.browsing = true; ui.search = ''; render(); ui.panel.querySelector('.mw-search')?.focus(); break;
        case 'browse-done': ui.browsing = false; ui.search = ''; render(); break;
        case 'inv-add': {
            const t = ui.panel.querySelector('[data-inv-new]')?.value.replace(/\s+/g, ' ').trim().slice(0, 60); if (!t) break;
            await changeState(s => { (s.inventory ??= []).push({ id: newId(), text: t, note: '', carried: true }); });
            ui.panel.querySelector('[data-inv-new]')?.focus(); break;
        }
        case 'mem-add': {
            const peer = currentPeer(), field = ui.panel.querySelector('[data-mem-new]');
            const t = field?.value.replace(/\s+/g, ' ').trim().slice(0, 160); if (!peer || !t) break;
            const other = keyForTarget(peer.key);
            const pair = getPair(personKeyOfSubject(), other, true, other.startsWith('name:') ? { [other]: peer.name } : {});
            (pair.memories ??= []).push({ id: newId(), text: t, value: 50, who: 'both' });
            await persist(); await syncPrompt(); render(); break;
        }
        case 'cast-new': ui.castAction = ui.castAction === 'adding' ? '' : 'adding'; render(); ui.panel.querySelector('[data-cast-new]')?.focus(); break;
        case 'relation-rename': {
            try {
                const relation = selectedRelation(); if (!relation) break;
                relation.target = validRelationName(ui.panel.querySelector('[data-relation-target]')?.value ?? '', relation.id);
                await persist(viewState()); await syncPrompt(); render();
            } catch (error) { run.status = error.message; renderStatus(); }
            break;
        }
        case 'relation-remove': ui.removingRelation = 'relation'; render(); break;
        case 'pair-clear': ui.removingRelation = 'pair'; render(); break;
        case 'pair-clear-confirm': {
            const peer = currentPeer(); const meta = ctx().chatMetadata[KEY];
            if (peer && meta?.pairs) delete meta.pairs[pairId(personKeyOfSubject(), keyForTarget(peer.key))];
            ui.removingRelation = ''; await persist(); await syncPrompt(); render(); break;
        }
        case 'relation-cancel': ui.removingRelation = ''; render(); break;
        case 'relation-remove-confirm': {
            const relation = selectedRelation(); if (!relation) break;
            const list = relationshipList(); list.splice(list.indexOf(relation), 1);
            ui.removingRelation = '';
            await persist(viewState()); await syncPrompt(); render(); break;
        }
        case 'cast-add': {
            try {
                const person = addCastMember(getCast(), ui.panel.querySelector('[data-cast-new]')?.value ?? '', newCastId(), [playerName(), ...members().map(ch => ch.name)]);
                ui.selectedCastId = person.id; ui.who = 'cast'; ui.selectedPeer = ''; ui.castAction = ''; run.status = `${person.name} added to this chat’s cast.`;
                await persist(); await syncPrompt(); render();
            } catch (error) { run.status = error.message; renderStatus(); }
            break;
        }
        case 'cast-remove': ui.castAction = 'remove'; render(); break;
        case 'cast-cancel': ui.castAction = ''; render(); break;
        case 'cast-remove-confirm': {
            const person = selectedCast(); if (!person) break;
            const cast = getCast(); cast.splice(cast.indexOf(person), 1); ui.selectedCastId = ''; ui.castAction = '';
            await persist(); await syncPrompt(); render(); break;
        }
        case 'cast-default':
            saveCastDefault(); ui.castAction = ''; run.status = `Cast saved for ${target().name}’s future chats.`; render(); break;
        case 'cast-load': ui.castAction = 'load'; render(); break;
        case 'cast-load-confirm': {
            if (!loadCastDefault()) break;
            run.status = 'Saved cast loaded. Switch on whoever is in this scene.';
            await persist(); await syncPrompt(); render(); break;
        }
        case 'top': ui.panel.scrollTo({ top: 0, behavior: 'smooth' }); break;
        case 'close': { ui.panel.close(); const l = document.getElementById('moodweaver-launcher'); if (l && !l.hidden) l.focus({ preventScroll: true }); break; }
        case 'cancel': cancelAnalysis(); break;
        case 'analyse': await analyse(true); break;
        case 'clear': {
            const whose = ui.who === 'user' ? `${playerName()}’s` : ui.who === 'story' ? 'the story’s' : `${ui.who === 'cast' ? selectedCast()?.name : target()?.name}’s`;
            const kind = tabKind();
            const what = { mood: 'moodlets', trait: 'traits', intimacy: 'intimacy settings', turn: 'turn-ons and turn-offs', state: 'facts', story: 'story settings' }[kind];
            if (!confirm(`Clear ${whose} ${what}? Their sliders go to 0 and pins come off. Everything in the other tabs stays, and the list stays so you can set a new scene quickly.`)) break;
            await changeState(s => clearSection(s, kind)); break;
        }
        case 'clear-everything': {
            const keep = ui.panel.querySelector('[data-keep-types]')?.checked !== false, whose = ui.who === 'story' ? 'the story' : subjectName();
            if (!confirm(`Clear everything set for ${whose} in this chat? Moodlets, traits, turn-ons, facts, wants, items, skills and relationships all go, pins too. ${keep ? 'Personality types stay.' : 'Personality types go too.'} “Bring it back” undoes it until you clear again.`)) break;
            await clearEverything(keep); run.status = `Cleared everything for ${whose}.`; renderStatus(); break;
        }
        case 'clear-undo': await undoClear(); run.status = 'Brought back what was cleared.'; renderStatus(); break;
        case 'reset': await changeState(s => { for (const m of MOODS) if (sectionOf(m) === 'mood' && !s.pins[m.id]) s.moods[m.id] = 0; s.reason = ''; }); break;
        case 'undo': await changeState(s => {
            const previous = s.history.pop(); if (!previous) return;
            for (const m of MOODS) if (!s.pins[m.id]) s.moods[m.id] = previous.moods[m.id] ?? 0;
            if (previous.wants) s.wants = cleanWants(previous.wants);
            s.reason = previous.reason; s.updatedAt = previous.updatedAt;
        }); break;
        case 'baseline': {
            if (ui.who === 'cast') { saveCastDefault(); run.status = `Cast saved for ${target().name}’s future chats.`; renderStatus(); break; }
            const key = ui.who === 'user' ? `user:${playerName()}` : ui.who === 'story' ? `story:${target().avatar}` : `char:${target().avatar}`;
            settings().baselines[key] = freshState(viewState()); ctx().saveSettingsDebounced();
            run.status = ui.who === 'user' ? `Default saved for ${playerName()}’s future chats.` : ui.who === 'story' ? 'Story default saved for this character’s future chats.' : 'Default saved for this character’s future chats.'; renderStatus(); break;
        }
    }
}
