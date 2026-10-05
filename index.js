import { KNOWLEDGE_MODES, knowledgeEntry, MERGED_SEARCH_NAMES, CATEGORIES, MOODS, BY_ID, RECIPES, TIERS, activeMoods, freshState, extendCatalogue, migrateCatalogue, level, escapeHtml as esc, clamp, budgetPrompt, parseAnalysis, blendAnalysis, sceneData, analysisMessages, fingerprint } from './core.js';

import { castFor, addCastMember, castDefaults, castName, newCastId } from './cast.js';
import { RELATIONSHIP_BY_ID, activeRelationshipTags, cloneRelationships, relationshipKey } from './relationships.js';
import { relationshipPanel } from './relationship-ui.js';

const KEY = 'moodweaver';
const PROMPT_KEY = 'moodweaver-state';
const ctx = () => SillyTavern.getContext();
const defaults = { tokenBudget: 800, depth: 0, placementVersion: 1, sceneMessages: 8, sceneChars: 12000, outputTokens: 800, baselines: {}, promptVersion: 3 };
let panel, selectedAvatar = '', selectedCastId = '', castAction = '', pending = null, promptVersion = 0, suspended = false;
let promptInfo = { prompt: '', tokens: 0, omitted: 0 }, status = '', search = '', tab = 'mood', who = 'char';
const generationSnapshots = new Map();
const openCategories = new Set();
let selectedRelationId = '', removingRelation = false;
const openRelationGroups = new Set(['First impressions']);
const relationshipList = () => { const state = viewState(); return state ? (state.relationships ??= []) : []; };
const selectedRelation = () => relationshipList().find(r => r.id === selectedRelationId) ?? relationshipList()[0];
const subjectName = () => who === 'user' ? playerName() : who === 'cast' ? selectedCast()?.name : target()?.name;
const resolveRelationName = name => castName(name).replaceAll('{{char}}', target()?.name ?? '').replaceAll('{{user}}', playerName());
function validRelationName(value, exceptId = '') {
    const name = castName(value), resolved = resolveRelationName(name).toLowerCase();
    if (!name) throw new Error('Choose who this relationship is about.');
    if (resolved === subjectName()?.toLowerCase()) throw new Error('Choose someone other than the person whose feelings you’re editing.');
    if (relationshipList().some(r => r.id !== exceptId && resolveRelationName(r.target).toLowerCase() === resolved)) throw new Error('That person already has a relationship blend here. Pick them from the list.');
    return name;
}

function settings() {
    const c = ctx();
    c.extensionSettings[KEY] ??= structuredClone(defaults);
    const saved = c.extensionSettings[KEY];
    // The v2 prompt explains each strength tier in words, so the old 320 default is too tight.
    if ((saved.promptVersion ?? 1) < 3) { if ([320, 500].includes(saved.tokenBudget ?? 320)) saved.tokenBudget = 800; saved.promptVersion = 3; }
    // Move the former default after the latest message once; keep other custom depths.
    if (!saved.placementVersion) {
        if (saved.depth == null || Number(saved.depth) === 1) saved.depth = 0;
        saved.placementVersion = 1;
        c.saveSettingsDebounced();
    }
    return Object.assign(saved, {
        tokenBudget: clamp(saved.tokenBudget ?? 800, 160, 3000),
        depth: Math.round(clamp(saved.depth ?? 0, 0, 10)),
        sceneMessages: clamp(c.extensionSettings[KEY].sceneMessages ?? 8, 2, 30),
        sceneChars: clamp(c.extensionSettings[KEY].sceneChars ?? 12000, 2000, 40000),
        outputTokens: clamp(c.extensionSettings[KEY].outputTokens ?? 800, 300, 4000),
        baselines: c.extensionSettings[KEY].baselines ?? {},
        castDefaults: c.extensionSettings[KEY].castDefaults ?? {},
    });
}
function members() {
    const c = ctx();
    if (c.groupId) {
        const group = c.groups.find(g => String(g.id) === String(c.groupId));
        return c.characters.filter(ch => group?.members?.includes(ch.avatar));
    }
    return c.characters[c.characterId] ? [c.characters[c.characterId]] : [];
}
function target(forGeneration = false) {
    const c = ctx(), choices = members();
    if (forGeneration && c.characters[c.characterId] && choices.includes(c.characters[c.characterId])) return c.characters[c.characterId];
    return choices.find(ch => ch.avatar === selectedAvatar) ?? choices[0];
}
function identity(ch = target()) {
    return `${ctx().groupId || ''}/${ctx().chatId || ''}/${ch?.avatar || ''}`;
}
function getState(ch = target()) {
    const c = ctx();
    if (!ch || !c.chatId) return null;
    c.chatMetadata[KEY] ??= { version: 1, characters: {} };
    const key = `char:${ch.avatar}`;
    const state = c.chatMetadata[KEY].characters[key] ??= freshState(settings().baselines[key]);
    return extendCatalogue(state);
}
// The player's own character is shared by every character in the chat, so it lives once per chat.
const playerName = () => String(ctx().name1 || '').trim() || 'You';
function getUserState() {
    const c = ctx();
    if (!c.chatId) return null;
    c.chatMetadata[KEY] ??= { version: 1, characters: {} };
    c.chatMetadata[KEY].user ??= freshState(settings().baselines[`user:${playerName()}`]);
    // Knowledge must move with the old values before retired persona IDs are removed.
    const meta = c.chatMetadata[KEY];
    migrateCatalogue(meta.user, Object.values(meta.personaKnowledge ?? {}));
    const state = extendCatalogue(meta.user);
    state.mode = 'manual';
    return state;
}
// Story settings belong to the whole chat. Older chats kept them on the character, so move them over once.
function getStoryState(ch = target()) {
    const c = ctx();
    if (!c.chatId) return null;
    c.chatMetadata[KEY] ??= { version: 1, characters: {} };
    const meta = c.chatMetadata[KEY];
    if (!meta.story) {
        meta.story = freshState(settings().baselines[`story:${ch?.avatar}`]);
        const story = MOODS.filter(m => m.kind === 'story');
        for (const charState of Object.values(meta.characters ?? {})) for (const m of story) {
            if (charState.moods?.[m.id] && !meta.story.moods[m.id]) meta.story.moods[m.id] = charState.moods[m.id];
            if (charState.moods) charState.moods[m.id] = 0;
        }
    }
    const state = extendCatalogue(meta.story);
    state.mode = 'manual';
    return state;
}
// Knowledge is per chat, observing character and persona; it is not a persona default.
function getKnowledge(ch = target(), create = false) {
    const meta = ctx().chatMetadata[KEY];
    if (!meta || !ch) return {};
    const key = JSON.stringify([ch.avatar, playerName()]);
    if (create) { meta.personaKnowledge ??= {}; meta.personaKnowledge[key] ??= {}; }
    return meta.personaKnowledge?.[key] ?? {};
}
function knowledgePanel(state, ch) {
    const active = activeMoods(state).filter(m => m.kind !== 'story');
    const knowledge = getKnowledge(ch);
    return `<details class="mw-knowledge mw-advanced"><summary>What ${esc(ch.name)} knows <small>${active.length} active tags</small></summary>
        <p class="mw-fine">This covers your current feelings as well as traits and preferences. Scene only follows what they can see or already know. Private needs clues you actually give. Suspected is an impression they can act on but might get wrong. Known means they know, including how you feel now. Higher strengths should shape their response more; their own settings decide how. You still write your reactions.</p>
        ${active.length ? active.map(m => {
            const entry = knowledgeEntry(knowledge[m.id]);
            return `<div class="mw-knowledge-row"><label for="mw-knowledge-${m.id}">${esc(tagLabel(m))} <small>${level(state.moods[m.id])} · ${state.moods[m.id]}%</small></label>
                <select id="mw-knowledge-${m.id}" data-knowledge="${m.id}" aria-label="What ${esc(ch.name)} knows: ${esc(m.label)}">${KNOWLEDGE_MODES.map((mode, i) => `<option value="${mode}" ${entry.mode === mode ? 'selected' : ''}>${['Scene only', 'Private', 'Suspected', 'Known'][i]}</option>`).join('')}</select>
                ${['known', 'suspected'].includes(entry.mode) ? `<input type="text" maxlength="120" data-knowledge-source="${m.id}" aria-label="Source for ${esc(m.label)}" placeholder="How they learned it (optional)" value="${esc(entry.source)}">` : ''}</div>`;
        }).join('') : '<p class="mw-fine">Enable a persona tag and it will appear here.</p>'}
        <p class="mw-fine">Each active tag is sent once, with its existing strength. Source notes add tokens only when filled in. Turning a tag off stops sending it; its knowledge choice is kept for next time.</p></details>`;
}
function getCast(ch = target()) {
    if (!ch || !ctx().chatId) return [];
    getState(ch);
    return castFor(ctx().chatMetadata[KEY], settings().castDefaults, `char:${ch.avatar}`);
}
const selectedCast = () => getCast().find(person => person.id === selectedCastId) ?? getCast()[0];
function saveCastDefault(ch = target()) {
    if (!ch) return;
    settings().castDefaults[`char:${ch.avatar}`] = castDefaults(getCast(ch));
    ctx().saveSettingsDebounced();
}
function loadCastDefault(ch = target()) {
    if (!ch) return false;
    const saved = settings().castDefaults[`char:${ch.avatar}`];
    if (!saved?.length) return false;
    getCast(ch);
    ctx().chatMetadata[KEY].cast[`char:${ch.avatar}`] = castDefaults(saved);
    selectedCastId = ''; castAction = '';
    return true;
}
const viewState = () => who === 'user' ? getUserState() : who === 'story' ? getStoryState() : who === 'cast' ? selectedCast()?.state : getState();
function profiles() {
    try { return ctx().ConnectionManagerRequestService.getSupportedProfiles(); } catch { return []; }
}
async function persist(state) {
    if (state) state.revision = (state.revision || 0) + 1;
    try { await ctx().saveMetadata(); } catch { status = 'Could not save chat metadata. Try again before switching chats.'; renderStatus(); }
}
async function syncPrompt(forGeneration = false) {
    const version = ++promptVersion;
    const c = ctx(), ch = target(forGeneration), state = getState(ch), id = identity(ch), mine = getUserState(), story = getStoryState(ch);
    if (suspended || !state) {
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        promptInfo = { prompt: '', tokens: 0, omitted: 0 }; renderPreview(); return;
    }
    try {
        const result = await budgetPrompt(state, String(ch.name).slice(0, 100), settings().tokenBudget, text => c.getTokenCountAsync(text), { player: { state: mine, name: playerName().slice(0, 100), knowledge: getKnowledge(ch) }, story, cast: getCast(ch) });
        if (version !== promptVersion || id !== identity(target(forGeneration))) return;
        // In-chat, user role. Depth 0 puts the note after the latest chat message.
        // Preset instructions outside chat history can still follow it.
        c.setExtensionPrompt(PROMPT_KEY, result.prompt, 1, settings().depth, false, 1);
        promptInfo = result; renderPreview();
    } catch {
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        promptInfo = { prompt: '', tokens: 0, omitted: 0 };
        renderPreview();
        status = 'Token counting failed; mood injection is paused until it succeeds.'; renderStatus();
    }
}
function renderPreview() {
    if (!panel) return;
    const count = panel.querySelector('[data-token-count]');
    if (count) count.textContent = `${promptInfo.tokens} counted tokens · ${promptInfo.selectedIds?.length || 0} active states sent`;
    const preview = panel.querySelector('[data-preview]');
    if (preview) preview.textContent = promptInfo.prompt || 'No mood directions are being sent.';
    const audit = panel.querySelector('[data-audit]');
    if (audit) audit.textContent = `Every active mood, fact, relationship feeling and story setting is sent, using the same strength words shown on the sliders. Paused relationships and cast members off scene are left out. Numbers are not sent.\nFormat: user role · depth ${settings().depth}${promptInfo.overBudget ? `\n${promptInfo.overBudget} tokens above the ${promptInfo.target}-token target; nothing was dropped or shortened.` : ''}`;
    const last = panel.querySelector('[data-last-prompt]');
    if (last) {
        const snapshot = generationSnapshots.get(identity());
        last.textContent = snapshot ? `${snapshot.at}\nUser role · depth ${snapshot.depth}\n${snapshot.prompt || '(No mood injection)'}` : 'No generation prepared for this chat/character since this page loaded.';
    }
    const warning = panel.querySelector('[data-budget-warning]');
    if (warning) {
        warning.hidden = !promptInfo.overBudget;
        warning.textContent = `Full blend kept: ${promptInfo.tokens} tokens (${promptInfo.overBudget} above target). Details are in “What is sent to the model?”`;
    }
}
function renderStatus() {
    if (panel?.querySelector('[data-status]')) panel.querySelector('[data-status]').textContent = status;
}
function cancelAnalysis() {
    pending?.controller.abort();
}
async function analyse(ch = target(), force = false) {
    const state = getState(ch), c = ctx();
    if (suspended || !state || !state.enabled || pending) return;
    if (!state.profile) { status = 'Choose an analyser connection profile first.'; renderStatus(); return; }
    const snapshot = identity(ch), revision = state.revision, metadata = c.chatMetadata;
    const fp = fingerprint(c.chat), userCount = c.chat.filter(m => m.is_user && !m.is_system).length;
    if (!force && (fp === state.lastFingerprint || (state.lastUserCount >= 0 && userCount > state.lastUserCount && userCount - state.lastUserCount < state.interval))) return;
    const controller = new AbortController();
    pending = { controller, snapshot };
    const timer = setTimeout(() => controller.abort(), 45000);
    status = 'Reading the scene…'; render();
    try {
        const service = c.ConnectionManagerRequestService;
        // No fallback to the main model: a missing or invalid profile is an error.
        const response = await service.sendRequest(state.profile,
            analysisMessages(sceneData(c.chat, ch, state, settings())), settings().outputTokens,
            { stream: false, signal: controller.signal, extractData: true, includePreset: false, includeInstruct: true });
        if (controller.signal.aborted || metadata !== ctx().chatMetadata || snapshot !== identity(ch) || revision !== state.revision || fp !== fingerprint(ctx().chat)) {
            status = 'Scene or controls changed; the old analysis was discarded.'; return;
        }
        const result = parseAnalysis(response?.content ?? '');
        state.history = [...(state.history || []).slice(-9), { moods: { ...state.moods }, reason: state.reason, updatedAt: state.updatedAt }];
        state.moods = blendAnalysis(state, result);
        state.reason = result.reason; state.updatedAt = Date.now(); state.lastFingerprint = fp; state.lastUserCount = userCount;
        await persist(state);
        status = 'Moods updated. Pinned levels were kept.';
    } catch (error) {
        status = controller.signal.aborted ? 'Analysis stopped or timed out. Previous moods kept.' : (error.message || 'Analysis failed. Previous moods kept.');
    } finally {
        clearTimeout(timer); pending = null;
        await syncPrompt(); render();
    }
}

globalThis.moodweaverBeforeGeneration = async (_chat, _contextSize, _abort, type) => {
    if (suspended || ['quiet', 'impersonate'].includes(type)) {
        ++promptVersion; ctx().setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1); return;
    }
    const ch = target(true), state = getState(ch);
    if (state?.enabled && state.mode === 'dynamic' && !['swipe', 'regenerate', 'continue'].includes(type)) await analyse(ch);
    await syncPrompt(true);
    generationSnapshots.set(identity(ch), { at: new Date().toLocaleString(), depth: settings().depth, prompt: promptInfo.prompt });
    if (generationSnapshots.size > 20) generationSnapshots.delete(generationSnapshots.keys().next().value);
    renderPreview();
};

const tagLabel = m => m.label.replaceAll('{{user}}', playerName()).replaceAll('{{char}}', target()?.name ?? 'main character');
function targetFields(m, state) {
    if (!state.moods[m.id]) return '';
    const fields = m.id === 'hates_other' ? [['hate', 'Who?', 'Name of someone in the scene']]
        : m.id === 'comparing_people' ? [['compareA', 'Compare', 'Someone in the scene'], ['compareB', 'With', '{{user}}']] : [];
    return fields.length ? `<div class="mw-target-fields">${fields.map(([key, label, placeholder]) => `<label>${label}<input type="text" data-target="${key}" maxlength="80" list="${key === 'hate' ? 'mw-hate-names' : 'mw-cast-names'}" placeholder="${esc(placeholder)}" value="${esc(state.targets?.[key] ?? '')}"></label>`).join('')}</div>` : '';
}
function castPanel(ch) {
    const cast = getCast(ch), person = selectedCast();
    return `<div class="mw-cast"><p class="mw-fine">Supporting characters in ${esc(ch.name)}’s chats. Give each their own blend, then switch “In this scene” off when they leave. Manual controls; no extra model requests.</p>
        <div class="mw-cast-add"><input type="text" data-cast-new maxlength="80" aria-label="New supporting character name" placeholder="Add someone, e.g. Chloe"><button data-action="cast-add">＋ Add</button></div>
        ${person ? `<label class="mw-cast-picker">Edit character<select data-field="cast">${cast.map(p => `<option value="${esc(p.id)}" ${p.id === person.id ? 'selected' : ''}>${esc(p.name)}${p.inScene ? ' · in scene' : ' · off scene'}</option>`).join('')}</select></label>
        <div class="mw-cast-presence"><label class="mw-toggle"><input type="checkbox" data-field="castInScene" ${person.inScene ? 'checked' : ''}> In this scene</label><span class="mw-fine">${cast.filter(p => p.inScene && p.state.enabled).length} present</span></div>
        <details class="mw-cast-edit"><summary>Rename or remove ${esc(person.name)}</summary><div class="mw-cast-add"><input type="text" data-field="castName" maxlength="80" aria-label="Supporting character name" value="${esc(person.name)}"><button data-action="cast-remove">Remove</button></div></details>` : '<p class="mw-fine">Add a name to start. Their moods and facts will appear below.</p>'}
        <div class="mw-actions"><button data-action="cast-default">Save cast for ${esc(ch.name)}</button>${settings().castDefaults[`char:${ch.avatar}`]?.length ? '<button data-action="cast-load">Load saved cast</button>' : ''}</div>
        ${castAction ? `<div class="mw-cast-confirm" role="group" aria-label="Confirm cast change"><p class="mw-fine">${castAction === 'load' ? 'Replace this chat’s cast and its sliders with the saved version? Everyone will start off scene.' : `Remove ${esc(person?.name ?? '')} from this chat’s cast? The saved default will stay as it is.`}</p><div class="mw-actions"><button data-action="cast-${castAction}-confirm">${castAction === 'load' ? 'Replace this chat’s cast' : 'Remove from this chat'}</button><button data-action="cast-cancel">Cancel</button></div></div>` : ''}
        <p class="mw-fine">Saves all these profiles for new ${esc(ch.name)} chats. Existing chats keep their own versions; new chats start with everyone off scene.</p></div>`;
}
function row(m, state) {
    const value = state.moods[m.id], pin = state.pins[m.id];
    return `<div class="mw-mood" data-mood="${m.id}" data-aliases="${esc((MERGED_SEARCH_NAMES[m.id] ?? []).join(' '))}" style="--mw-accent:${m.color}">
        <div class="mw-row-head"><label for="mw-${m.id}">${esc(tagLabel(m))}</label><span data-level="${m.id}">${level(value)}</span>
        <output for="mw-${m.id}" data-value="${m.id}">${value}%</output>
        <button type="button" class="mw-pin ${pin ? 'is-pinned' : ''}" data-pin="${m.id}" aria-pressed="${pin}" aria-label="${pin ? 'Unpin' : 'Pin'} ${esc(tagLabel(m))}" title="Pin this exact level in dynamic mode">${pin ? '◆' : '◇'}</button></div>
        <input id="mw-${m.id}" type="range" min="0" max="100" step="1" value="${value}" data-slider="${m.id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
        <small>${m.cue}</small>${targetFields(m, state)}</div>`;
}
function render() {
    if (!panel) return;
    const scroll = panel.scrollTop;
    const advancedOpen = panel.querySelector('.mw-advanced:not(.mw-inspector):not(.mw-knowledge)')?.open;
    const tuningOpen = panel.querySelector('.mw-tuning')?.open;
    const inspectorOpen = panel.querySelector('.mw-inspector')?.open;
    const knowledgeOpen = panel.querySelector('.mw-knowledge')?.open;
    const relationshipsOpen = panel.querySelector('.mw-relationships')?.open;
    const relationSearch = panel.querySelector('[data-relation-search]')?.value ?? '';
    panel.querySelectorAll('[data-relation-group]').forEach(d => d.open ? openRelationGroups.add(d.dataset.relationGroup) : openRelationGroups.delete(d.dataset.relationGroup));
    panel.querySelectorAll('details[data-category]').forEach(d => d.open ? openCategories.add(d.dataset.category) : openCategories.delete(d.dataset.category));
    const ch = target(), charState = getState(ch), allProfiles = profiles();
    const state = charState ? viewState() : null, mine = who !== 'char';
    if (tab === 'story') tab = 'mood';
    const active = state ? activeMoods(state) : [];
    const relationshipCount = (state?.relationships ?? []).filter(r => r.enabled !== false).reduce((n, r) => n + activeRelationshipTags(r).length, 0);
    panel.innerHTML = `<div class="mw-top"><div class="mw-brand"><span class="mw-diamond">◆</span><div><span class="mw-eyebrow">A LITTLE INNER WEATHER</span><h2>Moodweaver</h2></div></div><button class="mw-close" data-action="close" aria-label="Close Moodweaver">×</button></div>
    ${!charState ? '<div class="mw-empty">Open a character chat to start weaving a mood.</div>' : `
    <div class="mw-context"><label>Character<select data-field="character" aria-label="Character">${members().map(m => `<option value="${esc(m.avatar)}" ${m.avatar === ch.avatar ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
        ${state ? `<label class="mw-toggle"><input type="checkbox" data-field="enabled" ${state.enabled ? 'checked' : ''}> ${who === 'char' ? 'Enabled' : 'Send'}</label>` : ''}</div>
    <div class="mw-mode mw-who" role="group" aria-label="Whose tags">${[['char', '◆', ch.name], ['user', '◇', playerName()], ['cast', '♧', 'Cast'], ['story', '❖', 'Story']].map(([k, icon, label]) => `<button data-who="${k}" aria-pressed="${who === k}">${icon} ${esc(label)}</button>`).join('')}</div>
    <div class="mw-chat-name" title="${esc(ctx().chatId)}">This chat · ${esc(ctx().chatId)}</div>
    ${who === 'user' ? `<p class="mw-explainer">Your sliders describe ${esc(playerName())} in this chat. Strength and what another character knows are separate; set their knowledge below. You still write your own words, actions and thoughts.</p>` : who === 'cast' ? castPanel(ch) : who === 'story' ? '<p class="mw-explainer">Genre, tropes, writing style and author influences for this whole chat.</p>' : `<div class="mw-mode" role="group" aria-label="Mood mode"><button data-mode="manual" aria-pressed="${state.mode === 'manual'}">☷ &nbsp; Manual</button><button data-mode="dynamic" aria-pressed="${state.mode === 'dynamic'}">✧ &nbsp; Dynamic</button></div>
    <p class="mw-explainer">${state.mode === 'manual' ? 'Set the feeling. Mix as many shades as you like.' : 'The scene shapes the feeling. Pin any mood to keep your say. Facts and story settings stay as you set them.'}</p>`}
    ${state ? `${who !== 'story' ? relationshipPanel(state, { subject: subjectName(), focus: ch.name, player: playerName(), names: [...new Set([playerName(), ...members().map(c => c.name), ...getCast(ch).map(p => p.name)])], selectedId: selectedRelationId, knowledge: getKnowledge(ch), isPlayer: who === 'user', remove: removingRelation, openGroups: openRelationGroups }) : ''}<div class="mw-summary"><div class="mw-section-label">${active.length || relationshipCount ? 'THE CURRENT BLEND' : 'A CLEAN SLATE'}<span>${active.length + relationshipCount} active${active.length || relationshipCount ? ` · <button class="mw-clear" data-action="clear" title="Turn everything off, pins too">Clear all</button>` : ''}</span></div>
        <div class="mw-chips">${active.length ? active.map(m => `<button data-jump="${m.id}" class="mw-chip" style="--mw-accent:${m.color}" title="Adjust ${m.label}"><span>${state.pins[m.id] ? '◆ ' : ''}${esc(tagLabel(m))}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`).join('') : `<p>${relationshipCount ? 'Relationship feelings are set above.' : 'No mood directions yet. Start with a blend or move a slider.'}</p>`}</div>
        <p data-budget-warning class="mw-fine" hidden></p>
        ${state.reason ? `<div class="mw-observation">${esc(state.reason)}<small>Last scene read · ${esc(new Date(state.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</small></div>` : ''}</div>
    ${who === 'user' ? knowledgePanel(state, ch) : ''}
    ${!mine && state.mode === 'dynamic' ? `<div class="mw-dynamic"><label>Scene analyser<select data-field="profile"><option value="">Choose a connection profile…</option>${state.profile && !allProfiles.some(p => p.id === state.profile) ? '<option selected value="'+esc(state.profile)+'">Unavailable profile — choose another</option>' : ''}${allProfiles.map(p => `<option value="${esc(p.id)}" ${p.id === state.profile ? 'selected' : ''}>${esc(p.name)} · [${esc(p.model)}]</option>`).join('')}</select></label>
        <p class="mw-fine">Uses the actual model shown in brackets. Sends recent chat text and a short character excerpt to that profile. Your roleplay connection stays selected. One extra request per scene read; provider charges apply.</p>
        <div class="mw-actions"><button data-action="analyse" ${pending || !state.profile || !state.enabled ? 'disabled' : ''}>✧ Read scene now</button>${pending ? '<button data-action="cancel">Stop</button>' : ''}<button data-action="undo" ${!state.history?.length ? 'disabled' : ''}>Undo last read</button></div>
        <details class="mw-tuning"><summary>Emotional rhythm</summary><label>Sensitivity <output>${state.sensitivity}%</output><input aria-label="Sensitivity" type="range" min="10" max="100" value="${state.sensitivity}" data-field="sensitivity"></label>
        <label>Inertia <output>${state.inertia}%</output><input aria-label="Inertia" type="range" min="0" max="95" value="${state.inertia}" data-field="inertia"></label>
        <p class="mw-fine">Higher sensitivity allows stronger reactions. Higher inertia makes changes slower. Mood carryover advances on successful scene reads, not real-world time.</p>
        <label>Fade absent moods toward zero by <input aria-label="Fade rate" type="number" min="0" max="20" data-field="decay" value="${state.decay}"> points per read, before inertia</label>
        <label>Read every <input aria-label="Read interval" type="number" min="1" max="10" data-field="interval" value="${state.interval}"> new user turns</label></details></div>` : ''}
    ${who === 'story' ? '' : `<div class="mw-mode mw-tabs" role="group" aria-label="Section">${[['mood', '♡ Moods & traits'], ['state', '⌂ Facts & scene']].map(([k, label]) => {
        const n = active.filter(m => m.kind === k).length;
        return `<button data-tab="${k}" aria-pressed="${tab === k}">${label}${n ? ` · ${n}` : ''}</button>`; }).join('')}</div>`}
    <div class="mw-tools"><input class="mw-search" type="search" placeholder="Search…" aria-label="Search moods and states" value="${esc(search)}"><select data-field="recipe" aria-label="Add a starter blend"><option value="">＋ Add a starter blend</option>${Object.keys(RECIPES).map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="mw-scale"><span>Off</span>${[...TIERS].reverse().map(t => `<span>${t.name}</span>`).join('')}</div>
    <datalist id="mw-cast-names">${[ch.name, playerName(), ...getCast(ch).map(p => p.name)].map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist>
    <datalist id="mw-hate-names">${getCast(ch).filter(p => who !== 'cast' || p.id !== selectedCast()?.id).map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist><div class="mw-categories">${CATEGORIES.map(([id, name, icon, color, , kind = 'mood']) => {
        const list = MOODS.filter(m => m.category === id && (state.moods[m.id] > 0 || !(who === 'char' && m.id === 'hates_char' || who === 'user' && m.id === 'hates_user'))), n = list.filter(m => state.moods[m.id]).length;
        return `<details data-category="${id}" data-kind="${kind}" style="--mw-accent:${color}" ${openCategories.has(id) ? 'open' : ''}><summary><span class="mw-category-icon">${icon}</span><span>${name}</span><small>${n ? `${n} active` : list.length}</small></summary><div class="mw-category-body">${list.map(m => row(m, state)).join('')}</div></details>`;
    }).join('')}</div><p class="mw-no-results" hidden>Nothing matches.</p>
    <details class="mw-inspector mw-advanced"><summary>What is sent to the model?</summary>
        <p class="mw-fine">Exact Moodweaver contribution, not the whole SillyTavern prompt. Character cards, presets, lore and chat history can also influence the reply.</p>
        <label class="mw-toggle"><input type="checkbox" data-field="sceneBreathing" ${state.sceneBreathing !== false ? 'checked' : ''}> Give scenes breathing room</label>
        <p class="mw-fine">Each line uses the strength word shown on its slider. 81–90 is intense, 91–99 is overwhelming, and 100 is maximum: a defining part of the whole reply. Values in the same band share wording. The strongest sections come first. Equally strong settings mix without being toned down; lower ones add smaller touches. Pins lock values; they don’t add importance.</p>
        <div data-token-count class="mw-token-count"></div><pre data-audit></pre>
        <b>Current prepared injection</b><pre data-preview></pre>
        <b>Last generation preparation</b><pre data-last-prompt></pre>
        <p class="mw-fine">The last preparation is kept in memory for this chat and character. It records what this extension queued, not proof of a completed API request. Use SillyTavern’s message prompt inspector for the complete assembled prompt.</p></details>
    <details class="mw-advanced"><summary>Prompt, budgets & character defaults</summary>
        <p class="mw-fine">Saved separately for each chat and character. Save this setup as a character default to seed their future chats; existing chats keep their own blend.</p>
        <div class="mw-actions"><button data-action="baseline">${who === 'cast' ? 'Save entire cast for this character' : who === 'user' ? 'Save persona default' : who === 'story' ? 'Save story default for this character' : 'Save character default'}</button><button data-action="reset">Clear unpinned moods</button></div>
        <label>Mood prompt token target <input type="number" data-setting="tokenBudget" min="160" max="3000" value="${settings().tokenBudget}"> tokens</label>
        <label>Prompt depth <input type="number" data-setting="depth" min="0" max="10" step="1" value="${settings().depth}"> messages from the end</label>
        <p class="mw-fine">0 puts Moodweaver after your latest message (recommended); 1 puts it before. Lower numbers keep the note closer to the reply. This changes its placement, not a guaranteed priority over your preset.</p>
        <label>Recent messages for analyser <input type="number" data-setting="sceneMessages" min="2" max="30" value="${settings().sceneMessages}"></label>
        <label>Scene text cap <input type="number" data-setting="sceneChars" min="2000" max="40000" step="1000" value="${settings().sceneChars}"> characters</label>
        <label>Analyser output cap <input type="number" data-setting="outputTokens" min="300" max="4000" step="100" value="${settings().outputTokens}"> tokens</label>
        <p class="mw-fine">Settings apply globally. The token target is only a warning; nothing is ever dropped or shortened. A large blend can exceed this target; the inspector shows the full count. Analyser caps remain limits. Counts use SillyTavern’s selected tokenizer; provider counts may differ.</p></details>` : ''}` }
    <div data-status role="status" class="mw-status">${esc(status)}</div><div class="mw-footer">Small shifts. Complicated feelings. · v1.11.0</div><button class="mw-to-top" data-action="top" aria-label="Back to top" title="Back to top" hidden>↑</button>`;
    if (advancedOpen && panel.querySelector('.mw-advanced:not(.mw-inspector):not(.mw-knowledge)')) panel.querySelector('.mw-advanced:not(.mw-inspector):not(.mw-knowledge)').open = true;
    if (tuningOpen && panel.querySelector('.mw-tuning')) panel.querySelector('.mw-tuning').open = true;
    if (inspectorOpen && panel.querySelector('.mw-inspector')) panel.querySelector('.mw-inspector').open = true;
    if (knowledgeOpen && panel.querySelector('.mw-knowledge')) panel.querySelector('.mw-knowledge').open = true;
    if (relationshipsOpen && panel.querySelector('.mw-relationships')) panel.querySelector('.mw-relationships').open = true;
    if (panel.querySelector('[data-relation-search]')) { panel.querySelector('[data-relation-search]').value = relationSearch; filterRelationships(relationSearch); }
    filterRows(); renderPreview(); panel.scrollTop = scroll; toggleTop();
}
function toggleTop() { const b = panel?.querySelector('.mw-to-top'); if (b) b.hidden = panel.scrollTop < 500; }
function filterRelationships(value) {
    const term = value.trim().toLowerCase();
    panel.querySelectorAll('[data-relation-group]').forEach(group => {
        let visible = 0;
        group.querySelectorAll('[data-relation-row]').forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(term); if (!row.hidden) visible++; });
        group.hidden = !visible; group.open = term ? visible > 0 : openRelationGroups.has(group.dataset.relationGroup);
    });
}
function filterRows() {
    const term = search.trim().toLowerCase();
    let shown = 0;
    panel.querySelectorAll('[data-category]').forEach(d => {
        let count = 0;
        d.querySelectorAll('[data-mood]').forEach(row => {
            row.hidden = !(row.textContent + ' ' + (row.dataset.aliases ?? '')).toLowerCase().includes(term); if (!row.hidden) count++;
        });
        const inTab = who === 'story' ? d.dataset.kind === 'story' : d.dataset.kind !== 'story' && (term || d.dataset.kind === tab);
        d.hidden = count === 0 || !inTab; if (inTab) shown += count;
        d.open = term ? count > 0 : openCategories.has(d.dataset.category);
    });
    const none = panel.querySelector('.mw-no-results'); if (none) none.hidden = shown > 0;
}
async function changeState(mutator) {
    const s = viewState(); if (!s) return;
    mutator(s); await persist(s); await syncPrompt(); render();
}
function openPanel() {
    if (suspended) return;
    render(); if (!panel.open) panel.show(); void syncPrompt();
}
function setup() {
    if (document.getElementById('moodweaver-panel')) return;
    settings();
    panel = document.createElement('dialog'); panel.id = 'moodweaver-panel'; panel.className = 'mw-panel';
    panel.setAttribute('aria-label', 'Moodweaver character moods'); document.body.append(panel);
    const launcher = document.createElement('button'); launcher.id = 'moodweaver-launcher'; launcher.innerHTML = '<span>◆</span> Moods';
    launcher.title = 'Open Moodweaver'; launcher.setAttribute('aria-controls', panel.id); launcher.onclick = openPanel; document.body.append(launcher);
    const settingsHost = document.querySelector('#extensions_settings2') ?? document.querySelector('#extensions_settings');
    if (settingsHost) {
        const entry = document.createElement('div'); entry.className = 'mw-settings-entry';
        entry.innerHTML = '<b>◆ Moodweaver</b><p>Character moods, blended your way.</p><button class="menu_button">Open mood panel</button>';
        entry.querySelector('button').onclick = openPanel; settingsHost.append(entry);
    }
    panel.addEventListener('scroll', toggleTop, { passive: true });
    panel.addEventListener('input', e => {
        if (e.target.hasAttribute('data-relation-search')) {
            filterRelationships(e.target.value); return;
        }
        if (e.target.dataset.relSlider) {
            const id = e.target.dataset.relSlider, value = Number(e.target.value);
            panel.querySelector(`[data-rel-value="${id}"]`).textContent = `${value}%`;
            panel.querySelector(`[data-rel-level="${id}"]`).textContent = level(value);
            e.target.style.setProperty('--mw-fill', `${value}%`); e.target.setAttribute('aria-valuetext', `${value} percent, ${level(value)}`); return;
        }
        if (e.target.matches('.mw-search')) { search = e.target.value; filterRows(); return; }
        if (['hate', 'compareA', 'compareB'].includes(e.target.dataset.target)) {
            const state = viewState(); if (!state) return;
            state.targets ??= {};
            state.targets[e.target.dataset.target] = castName(e.target.value);
            void persist(state); void syncPrompt(); return;
        }
        const sourceId = e.target.dataset.knowledgeSource;
        if (sourceId && who === 'user' && BY_ID[sourceId]) {
            const knowledge = getKnowledge(target(), true);
            knowledge[sourceId] = knowledgeEntry({ ...knowledgeEntry(knowledge[sourceId]), source: e.target.value });
            // Keep the draft in metadata before any other control can redraw the panel.
            void persist(); void syncPrompt(); return;
        }
        if (e.target.dataset.slider) {
            const id = e.target.dataset.slider, value = Number(e.target.value);
            panel.querySelector(`[data-value="${id}"]`).textContent = `${value}%`;
            panel.querySelector(`[data-level="${id}"]`).textContent = level(value);
            e.target.style.setProperty('--mw-fill', `${value}%`); e.target.setAttribute('aria-valuetext', `${value} percent, ${level(value)}`);
        }
    });
    panel.addEventListener('change', async e => {
        const input = e.target;
        if (input.hasAttribute('data-relation-select')) { selectedRelationId = input.value; removingRelation = false; render(); return; }
        if (input.hasAttribute('data-relation-enabled')) { const relation = selectedRelation(); if (relation) await changeState(() => { relation.enabled = input.checked; }); return; }
        if (input.dataset.relSlider && RELATIONSHIP_BY_ID[input.dataset.relSlider]) {
            const relation = selectedRelation(); if (relation) await changeState(() => { relation.moods[input.dataset.relSlider] = Number(input.value); }); return;
        }
        if (input.dataset.relKnowledge && who === 'user' && RELATIONSHIP_BY_ID[input.dataset.relKnowledge]) {
            const relation = selectedRelation(); if (!relation) return;
            const knowledge = getKnowledge(target(), true), key = relationshipKey(relation, input.dataset.relKnowledge);
            if (input.value === 'scene') delete knowledge[key]; else knowledge[key] = knowledgeEntry({ ...knowledge[key], mode: input.value });
            await persist(); await syncPrompt(); render(); return;
        }
        if (input.dataset.target) return;
        const knowledgeId = input.dataset.knowledge || input.dataset.knowledgeSource;
        if (knowledgeId && who === 'user' && BY_ID[knowledgeId]?.kind !== 'story' && BY_ID[knowledgeId]) {
            const knowledge = getKnowledge(target(), true);
            const previous = knowledgeEntry(knowledge[knowledgeId]);
            const next = knowledgeEntry(input.dataset.knowledge ? { ...previous, mode: input.value } : { ...previous, source: input.value });
            if (next.mode === 'scene') delete knowledge[knowledgeId]; else knowledge[knowledgeId] = next;
            await persist(); await syncPrompt(); render(); return;
        }
        if (input.dataset.slider) {
            await changeState(s => { s.moods[input.dataset.slider] = Number(input.value); if (who === 'char' && s.mode === 'dynamic') s.pins[input.dataset.slider] = true; }); return;
        }
        if (input.dataset.setting) { settings()[input.dataset.setting] = Number(input.value); settings(); ctx().saveSettingsDebounced(); await syncPrompt(); render(); return; }
        const field = input.dataset.field;
        if (field === 'character') { selectedAvatar = input.value; selectedCastId = ''; selectedRelationId = ''; removingRelation = false; castAction = ''; status = ''; render(); await syncPrompt(); return; }
        if (field === 'cast') { selectedCastId = input.value; selectedRelationId = ''; removingRelation = false; castAction = ''; status = ''; render(); return; }
        if (field === 'castInScene') {
            const person = selectedCast(); if (!person) return;
            person.inScene = input.checked; await persist(); await syncPrompt(); render(); return;
        }
        if (field === 'castName') {
            const person = selectedCast(), name = castName(input.value);
            if (!person) return;
            if (!name || [playerName(), ...members().map(ch => ch.name), ...getCast().filter(p => p.id !== person.id).map(p => p.name)]
                .some(n => n.toLowerCase() === name.toLowerCase())) {
                status = 'Use a unique supporting-character name.'; render(); return;
            }
            const old = person.name; person.name = name;
            for (const s of [getState(), getUserState(), ...getCast().map(p => p.state)]) {
                for (const key of ['hate', 'compareA', 'compareB']) if (s?.targets?.[key] === old) s.targets[key] = name;
                for (const relation of s?.relationships ?? []) if (relation.target.toLowerCase() === old.toLowerCase()) relation.target = name;
            }
            await persist(); await syncPrompt(); render(); return;
        }
        if (field === 'recipe') { if (RECIPES[input.value]) await changeState(s => { for (const [k, v] of Object.entries(RECIPES[input.value])) if (!s.pins[k]) s.moods[k] = v; }); return; }
        if (field) await changeState(s => {
            s[field] = ['enabled', 'sceneBreathing'].includes(field) ? input.checked : field === 'profile' ? input.value : Number(input.value);
            if (['profile', 'interval'].includes(field)) { s.lastFingerprint = ''; s.lastUserCount = -1; }
            if (field === 'inertia') s[field] = clamp(s[field], 0, 95);
            if (field === 'sensitivity') s[field] = clamp(s[field], 10, 100);
            if (field === 'decay') s[field] = clamp(s[field], 0, 20);
            if (field === 'interval') s[field] = clamp(s[field], 1, 10);
        });
    });
    panel.addEventListener('click', async e => {
        const button = e.target.closest('button'); if (!button) return;
        if (button.dataset.who) { who = button.dataset.who; selectedRelationId = ''; removingRelation = false; castAction = ''; status = ''; render(); return; }
        if (button.dataset.mode) { await changeState(s => { s.mode = button.dataset.mode; }); return; }
        if (button.dataset.tab) {
            tab = button.dataset.tab;
            panel.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
            filterRows(); return;
        }
        if (button.dataset.pin) { await changeState(s => { s.pins[button.dataset.pin] = !s.pins[button.dataset.pin]; }); return; }
        if (button.dataset.jump) {
            search = ''; panel.querySelector('.mw-search').value = ''; tab = BY_ID[button.dataset.jump]?.kind ?? tab;
            panel.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === tab))); filterRows();
            const row = panel.querySelector(`[data-mood="${button.dataset.jump}"]`), category = row.closest('details');
            category.open = true; openCategories.add(category.dataset.category); row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.querySelector('input').focus(); return;
        }
        switch (button.dataset.action) {
            case 'relation-add': {
                try {
                    const name = validRelationName(panel.querySelector('[data-relation-new]').value);
                    const relation = cloneRelationships([{ id: newCastId(), target: name }])[0];
                    relationshipList().push(relation); selectedRelationId = relation.id; removingRelation = false; status = '';
                    await persist(viewState()); await syncPrompt(); render();
                } catch (error) { status = error.message; renderStatus(); }
                break;
            }
            case 'relation-rename': {
                try {
                    const relation = selectedRelation(); if (!relation) break;
                    relation.target = validRelationName(panel.querySelector('[data-relation-target]').value, relation.id);
                    await persist(viewState()); await syncPrompt(); render();
                } catch (error) { status = error.message; renderStatus(); }
                break;
            }
            case 'relation-remove': removingRelation = true; render(); break;
            case 'relation-cancel': removingRelation = false; render(); break;
            case 'relation-remove-confirm': {
                const relation = selectedRelation(); if (!relation) break;
                const list = relationshipList(); list.splice(list.indexOf(relation), 1);
                selectedRelationId = ''; removingRelation = false;
                await persist(viewState()); await syncPrompt(); render(); break;
            }
            case 'cast-add': {
                try {
                    const person = addCastMember(getCast(), panel.querySelector('[data-cast-new]').value, newCastId(), [playerName(), ...members().map(ch => ch.name)]);
                    selectedCastId = person.id; castAction = ''; status = `${person.name} added to this chat’s cast.`;
                    await persist(); await syncPrompt(); render();
                } catch (error) { status = error.message; renderStatus(); }
                break;
            }
            case 'cast-remove': castAction = 'remove'; render(); break;
            case 'cast-cancel': castAction = ''; render(); break;
            case 'cast-remove-confirm': {
                const person = selectedCast(); if (!person) break;
                const cast = getCast(); cast.splice(cast.indexOf(person), 1); selectedCastId = ''; castAction = '';
                await persist(); await syncPrompt(); render(); break;
            }
            case 'cast-default':
                saveCastDefault(); castAction = ''; status = `Cast saved for ${target().name}’s future chats.`; render(); break;
            case 'cast-load': castAction = 'load'; render(); break;
            case 'cast-load-confirm': {
                if (!loadCastDefault()) break;
                status = 'Saved cast loaded. Switch on whoever is in this scene.';
                await persist(); await syncPrompt(); render(); break;
            }
            case 'top': panel.scrollTo({ top: 0, behavior: 'smooth' }); break;
            case 'close': panel.close(); document.getElementById('moodweaver-launcher').focus(); break;
            case 'cancel': cancelAnalysis(); break;
            case 'analyse': await analyse(target(), true); break;
            case 'clear': {
                const whose = who === 'user' ? playerName() : who === 'story' ? 'the story' : who === 'cast' ? selectedCast()?.name : target()?.name;
                if (!confirm(`Clear everything for ${whose}? Every slider goes to 0 and pins are removed.`)) break;
                await changeState(s => { for (const m of MOODS) { s.moods[m.id] = 0; s.pins[m.id] = false; } for (const r of s.relationships ?? []) for (const key of Object.keys(r.moods)) r.moods[key] = 0; s.reason = ''; }); break;
            }
            case 'reset': await changeState(s => { for (const m of MOODS) if (!s.pins[m.id]) s.moods[m.id] = 0; s.reason = ''; }); break;
            case 'undo': await changeState(s => {
                const previous = s.history.pop(); if (!previous) return;
                for (const m of MOODS) if (!s.pins[m.id]) s.moods[m.id] = previous.moods[m.id] ?? 0;
                s.reason = previous.reason; s.updatedAt = previous.updatedAt;
            }); break;
            case 'baseline': {
                if (who === 'cast') { saveCastDefault(); status = `Cast saved for ${target().name}’s future chats.`; renderStatus(); break; }
                const key = who === 'user' ? `user:${playerName()}` : who === 'story' ? `story:${target().avatar}` : `char:${target().avatar}`;
                settings().baselines[key] = freshState(viewState()); ctx().saveSettingsDebounced();
                status = who === 'user' ? `Default saved for ${playerName()}’s future chats.` : who === 'story' ? 'Story default saved for this character’s future chats.' : 'Default saved for this character’s future chats.'; renderStatus(); break;
            }
        }
    });
    const c = ctx();
    c.eventSource.on(c.eventTypes.CHAT_CHANGED, () => {
        cancelAnalysis(); selectedAvatar = ''; selectedCastId = ''; selectedRelationId = ''; removingRelation = false; castAction = ''; status = '';
        ++promptVersion; c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        render(); void syncPrompt();
    });
    c.eventSource.on(c.eventTypes.GENERATION_STOPPED, cancelAnalysis);
    c.eventSource.on(c.eventTypes.GENERATION_ENDED, () => { void syncPrompt(); });
    c.eventSource.on(c.eventTypes.GENERATION_AFTER_COMMANDS, (type, _args, dryRun) => {
        if (['quiet', 'impersonate'].includes(type)) { ++promptVersion; c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1); }
        else if (dryRun) return syncPrompt(true);
    });
    for (const event of ['CONNECTION_PROFILE_CREATED', 'CONNECTION_PROFILE_DELETED', 'CONNECTION_PROFILE_UPDATED']) {
        if (c.eventTypes[event]) c.eventSource.on(c.eventTypes[event], () => { if (panel.open) render(); });
    }
    render(); void syncPrompt();
}
// jQuery ready also works when installed after APP_READY has fired.
if (typeof jQuery === 'function') jQuery(setup); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();

export { analyse, getState, getKnowledge, getCast, saveCastDefault, loadCastDefault, syncPrompt };

export function onDisable() {
    suspended = true; ++promptVersion; cancelAnalysis();
    ctx().setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
    panel?.close();
    for (const node of document.querySelectorAll('#moodweaver-panel, #moodweaver-launcher, .mw-settings-entry')) node.hidden = true;
}
export function onEnable() {
    suspended = false;
    if (!panel) setup();
    for (const node of document.querySelectorAll('#moodweaver-panel, #moodweaver-launcher, .mw-settings-entry')) node.hidden = false;
    void syncPrompt();
}
