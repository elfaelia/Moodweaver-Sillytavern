import { KNOWLEDGE_MODES, knowledgeEntry, MERGED_SEARCH_NAMES, CATEGORIES, MOODS, BY_ID, RECIPES, TIERS, activeMoods, freshState, extendCatalogue, migrateCatalogue, level, escapeHtml as esc, clamp, budgetPrompt, parseAnalysis, blendAnalysis, sceneData, analysisMessages, fingerprint } from './core.js';

import { castFor, addCastMember, castDefaults, castName, newCastId } from './cast.js';
import { RELATIONSHIP_BY_ID, SHARED_BY_ID, SHARED_IDS, activeRelationshipTags, activeSharedTags, cloneRelationships, cleanCompare, relationshipKey } from './relationships.js';
import { relationshipView } from './relationship-ui.js';
import { TURN_CATEGORIES, TURN_BY_ID } from './turns.js';

const KEY = 'moodweaver';
const PROMPT_KEY = 'moodweaver-state';
const ctx = () => SillyTavern.getContext();
const defaults = { tokenBudget: 800, depth: 0, placementVersion: 1, sceneMessages: 8, sceneChars: 12000, outputTokens: 800, baselines: {}, promptVersion: 3 };
let panel, selectedAvatar = '', selectedCastId = '', castAction = '', pending = null, promptVersion = 0, suspended = false;
let promptInfo = { prompt: '', tokens: 0, omitted: 0 }, status = '', search = '', tab = 'mood', who = 'char';
const generationSnapshots = new Map();
const openCategories = new Set();
let selectedPeer = '', removingRelation = '', pairView = 'mine', browsing = false;
const newId = () => Math.random().toString(36).slice(2, 10);
const openRelationGroups = new Set(['What they are']);
const relationshipList = () => { const state = viewState(); return state ? (state.relationships ??= []) : []; };
// Everyone this person could feel something about: the main character, you, the rest of a group chat,
// the cast, and anyone typed in by hand. Nobody has to be added first.
const relationFor = key => { const want = resolveRelationName(key).toLowerCase(); return relationshipList().find(r => resolveRelationName(r.target).toLowerCase() === want); };
function peers() {
    const ch = target(), self = (subjectName() ?? '').toLowerCase(), list = [];
    const push = (key, name, role, offScene = false) => {
        if (!name || name.toLowerCase() === self || list.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
        list.push({ key, name, role, offScene });
    };
    if (ch) push('{{char}}', ch.name, 'Main character');
    push('{{user}}', playerName(), 'Your character');
    for (const m of members()) push(m.name, m.name, 'In this group chat');
    for (const p of getCast(ch)) push(p.name, p.name, p.inScene ? 'Cast · in scene' : 'Cast · off scene', !p.inScene);
    for (const r of relationshipList()) push(r.target, resolveRelationName(r.target), 'Not in the cast');
    const me = personKeyOfSubject();
    for (const p of list) { p.relation = relationFor(p.key); p.pair = getPair(me, keyForTarget(p.key)); }
    return list;
}
const currentPeer = () => { const all = peers(); return all.find(p => p.key === selectedPeer) ?? all[0]; };
const selectedRelation = () => currentPeer()?.relation;
function ensureRelation(peer) {
    let relation = relationFor(peer.key);
    if (!relation) { relation = cloneRelationships([{ id: newCastId(), target: peer.key }])[0]; relationshipList().push(relation); }
    return relation;
}
// Where "their side" of a pairing lives, if that person has a panel of their own.
function swapTarget(peer) {
    if (peer.key === '{{char}}') return { who: 'char' };
    if (peer.key === '{{user}}') return { who: 'user' };
    const castMember = getCast().find(p => p.name.toLowerCase() === peer.name.toLowerCase());
    if (castMember) return { who: 'cast', castId: castMember.id };
    const member = members().find(m => m.name.toLowerCase() === peer.name.toLowerCase());
    return member ? { who: 'char', avatar: member.avatar } : null;
}
// Older saves kept some person-specific feelings on the sheet itself. They arrive as '{{other}}': whoever
// that sheet used to point at, which is you for characters and the main character for you.
function movePairFacts(state, targetKey) {
    const list = state?.relationships;
    if (!list?.some(r => r.target === '{{other}}')) return state;
    for (const moved of list.filter(r => r.target === '{{other}}')) {
        const existing = list.find(r => r !== moved && r.target === targetKey);
        if (!existing) { moved.target = targetKey; continue; }
        for (const [id, value] of Object.entries(moved.moods ?? {})) existing.moods[id] = Math.max(existing.moods[id] ?? 0, value);
        if (!existing.compare?.value && moved.compare?.value) existing.compare = moved.compare;
        list.splice(list.indexOf(moved), 1);
    }
    return state;
}
// "Both of them" labels live once per pair of people in the chat, not on either person.
const personKeyOfSubject = () => who === 'user' ? 'user' : who === 'cast' ? `cast:${selectedCast()?.id}` : `char:${target()?.avatar}`;
function keyForTarget(value, ch = target(), cast = getCast(ch)) {
    if (value === '{{char}}') return `char:${ch?.avatar}`;
    if (value === '{{user}}') return 'user';
    const name = resolveRelationName(value).toLowerCase();
    if (name === playerName().toLowerCase()) return 'user';
    const member = members().find(m => m.name.toLowerCase() === name);
    if (member) return `char:${member.avatar}`;
    const person = cast.find(p => p.name.toLowerCase() === name);
    return person ? `cast:${person.id}` : `name:${name}`;
}
function nameForKey(key, ch = target(), labels = {}) {
    if (key === 'user') return playerName();
    if (key.startsWith('char:')) return ctx().characters.find(c => c.avatar === key.slice(5))?.name;
    if (key.startsWith('cast:')) return getCast(ch).find(p => p.id === key.slice(5))?.name;
    return labels[key] ?? key.slice(5);
}
const pairId = (a, b) => [a, b].sort().join('|');
function getPair(a, b, create = false, labels = {}) {
    const meta = ctx().chatMetadata[KEY]; if (!meta || !a || !b || a === b) return null;
    meta.pairs ??= {};
    const id = pairId(a, b);
    if (!meta.pairs[id] && create) meta.pairs[id] = { members: [a, b], labels: {}, enabled: true, moods: {} };
    const pair = meta.pairs[id];
    if (pair) Object.assign(pair.labels ??= {}, labels);
    return pair ?? null;
}
// Move shared labels (dating, enemies to lovers…) out of anyone's one-way side and into the pair.
function migratePairs(ch = target()) {
    const meta = ctx().chatMetadata[KEY]; if (!meta || !ch) return;
    const cast = getCast(ch);
    const sheets = [[getState(ch), `char:${ch.avatar}`], [getUserState(), 'user'], ...cast.map(p => [p.state, `cast:${p.id}`])];
    for (const [state, owner] of sheets) for (const relation of state?.relationships ?? []) {
        const ids = Object.keys(relation.moods ?? {}).filter(id => SHARED_IDS.has(id) && relation.moods[id] > 0);
        if (!ids.length) continue;
        const other = keyForTarget(relation.target, ch, cast); if (other === owner) continue;
        const pair = getPair(owner, other, true, other.startsWith('name:') ? { [other]: resolveRelationName(relation.target) } : {});
        for (const id of ids) { pair.moods[id] = Math.max(pair.moods[id] ?? 0, relation.moods[id]); relation.moods[id] = 0; }
    }
    const story = getStoryState(ch);
    for (const relation of story?.relationships ?? []) {
        const pair = getPair(`char:${ch.avatar}`, 'user', true);
        for (const [id, value] of Object.entries(relation.moods ?? {})) if (SHARED_IDS.has(id) && value > 0) pair.moods[id] = Math.max(pair.moods[id] ?? 0, value);
    }
    if (story) story.relationships = [];
}
// Pairs that reach the prompt: switched on, something set, and at least one of the two is here.
function pairExtras(ch) {
    const meta = ctx().chatMetadata[KEY], cast = getCast(ch);
    const present = new Set([`char:${ch.avatar}`, 'user', ...members().map(m => `char:${m.avatar}`), ...cast.filter(p => p.inScene).map(p => `cast:${p.id}`)]);
    const rank = key => key.startsWith('char:') ? 0 : key === 'user' ? 1 : 2;
    return Object.values(meta?.pairs ?? {}).filter(p => p.enabled !== false && p.members.some(k => present.has(k)) && (activeSharedTags(p).length || p.memories?.some(m => m.value >= 41)))
        .map(p => ({ names: [...p.members].sort((a, b) => rank(a) - rank(b)).map(k => nameForKey(k, ch, p.labels)), moods: p.moods,
            memories: (p.memories ?? []).map(m => ({ text: m.text, value: m.value, who: m.who === 'both' ? 'both' : nameForKey(m.who, ch, p.labels) })) }))
        .filter(p => p.names.every(Boolean));
}
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
    return movePairFacts(extendCatalogue(state), '{{user}}');
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
    const state = movePairFacts(extendCatalogue(meta.user), '{{char}}', Object.values(meta.personaKnowledge ?? {}));
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
    const cast = castFor(ctx().chatMetadata[KEY], settings().castDefaults, `char:${ch.avatar}`);
    for (const person of cast) movePairFacts(person.state, '{{user}}');
    return cast;
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
        migratePairs(ch);
        const result = await budgetPrompt(state, String(ch.name).slice(0, 100), settings().tokenBudget, text => c.getTokenCountAsync(text), { player: { state: mine, name: playerName().slice(0, 100), knowledge: getKnowledge(ch) }, story, cast: getCast(ch), pairs: pairExtras(ch) });
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
function row(m, state) {
    const value = state.moods[m.id], pin = state.pins[m.id];
    return `<div class="mw-mood" data-mood="${m.id}" data-aliases="${esc((MERGED_SEARCH_NAMES[m.id] ?? []).join(' '))}" style="--mw-accent:${m.color}">
        <div class="mw-row-head"><label for="mw-${m.id}">${esc(tagLabel(m))}</label><span data-level="${m.id}">${level(value)}</span>
        <output for="mw-${m.id}" data-value="${m.id}">${value}%</output>
        <button type="button" class="mw-pin ${pin ? 'is-pinned' : ''}" data-pin="${m.id}" aria-pressed="${pin}" aria-label="${pin ? 'Unpin' : 'Pin'} ${esc(tagLabel(m))}" title="Pin this exact level in dynamic mode">${pin ? '◆' : '◇'}</button>${listButton(m.id, state)}</div>
        <input id="mw-${m.id}" type="range" min="0" max="100" step="1" value="${value}" data-slider="${m.id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
        <small>${m.cue}</small>${targetFields(m, state)}${value ? causeBox(`data-cause="${m.id}"`, state.causes?.[m.id]) : ''}</div>`;
}
const causeBox = (attr, value) => `<input type="text" class="mw-cause" ${attr} maxlength="100" value="${esc(value ?? '')}" placeholder="because… (optional)" aria-label="Because">`;
// In the list: × takes it off this person's list. While adding: ＋ puts it on, ✓ shows it's there.
function listButton(id, state) {
    const inList = state.loadout?.includes(id);
    return browsing ? `<button type="button" class="mw-list ${inList ? 'is-in' : ''}" data-loadout="${esc(id)}" aria-pressed="${!!inList}" title="${inList ? 'On the list' : 'Add to the list'}">${inList ? '✓' : '＋'}</button>`
        : `<button type="button" class="mw-list" data-unlist="${esc(id)}" title="Take off the list (sets it to 0)" aria-label="Take off the list">×</button>`;
}
const turnLevel = v => v === 0 ? 'Neutral' : `${level(Math.abs(v))} turn-${v > 0 ? 'on' : 'off'}`;
const turnFill = v => v >= 0 ? `--mw-from:50%;--mw-to:${50 + v / 2}%` : `--mw-from:${50 + v / 2}%;--mw-to:50%`;
function turnRow(t, state) {
    const v = state.prefs?.[t.id] ?? 0;
    return `<div class="mw-mood mw-turn" data-mood="turn:${t.id}" style="--mw-accent:${t.color}"><div class="mw-row-head"><label for="mw-turn-${t.id}">${esc(t.label)}</label><span data-lvl>${turnLevel(v)}</span>${listButton(`turn:${t.id}`, state)}</div>
        <input id="mw-turn-${t.id}" type="range" min="-100" max="100" step="1" value="${v}" data-turn="${t.id}" style="${turnFill(v)}" aria-valuetext="${turnLevel(v)}">
        <div class="mw-turn-ends"><span>Turn-off</span><span>Turn-on</span></div><small>${esc(t.cue)}</small></div>`;
}
const CUSTOM_HINT = { mood: 'e.g. needs control of the camera', state: 'e.g. still wearing his jacket', story: 'e.g. everything happens after dark' };
function customBlock(state, kind, whose) {
    const rows = (state.custom ?? []).filter(r => r.kind === kind);
    return `<div class="mw-custom"><div class="mw-section-label">YOUR OWN<span>sent exactly as you write it</span></div>
        ${rows.map(r => `<div class="mw-mood mw-own"><div class="mw-row-head"><input type="text" class="mw-own-text" data-custom-text="${esc(r.id)}" maxlength="100" value="${esc(r.text)}" aria-label="Your own setting"><span data-lvl>${level(r.value)}</span><output>${r.value}%</output><button type="button" class="mw-list" data-custom-remove="${esc(r.id)}" title="Delete" aria-label="Delete">×</button></div>
            <input type="range" min="0" max="100" step="1" value="${r.value}" data-custom="${esc(r.id)}" style="--mw-fill:${r.value}%" aria-label="Strength">
            ${r.value ? causeBox(`data-custom-cause="${esc(r.id)}"`, r.cause) : ''}</div>`).join('')}
        <div class="mw-cast-add"><input type="text" data-custom-new="${kind}" maxlength="100" placeholder="${CUSTOM_HINT[kind]}" aria-label="Write your own for ${esc(whose)}"><button data-action="custom-add" data-kind="${kind}">＋ Add</button></div></div>`;
}
// Each person only shows their own list until you go looking for more.
function catalogueBlock(state, kind, ch, whose) {
    const listed = new Set([...(state.loadout ?? []), ...MOODS.filter(m => state.moods[m.id] > 0).map(m => m.id),
        ...Object.keys(state.prefs ?? {}).filter(id => state.prefs[id]).map(id => `turn:${id}`)]);
    const show = id => browsing || listed.has(id);
    const cats = CATEGORIES.filter(([, , , , , k = 'mood']) => k === kind).map(([id, name, icon, color, , k = 'mood']) => {
        const list = MOODS.filter(m => m.category === id && show(m.id)), n = list.filter(m => state.moods[m.id]).length;
        if (!list.length) return '';
        return `<details data-category="${id}" data-kind="${k}" style="--mw-accent:${color}" ${openCategories.has(id) || !browsing ? 'open' : ''}><summary><span class="mw-category-icon">${icon}</span><span>${name}</span><small>${n ? `${n} active` : list.length}</small></summary><div class="mw-category-body">${list.map(m => row(m, state)).join('')}</div></details>`;
    }).join('');
    const turns = kind !== 'mood' ? '' : TURN_CATEGORIES.map(([group, icon, color, rows]) => {
        const list = rows.filter(([id]) => show(`turn:${id}`)), key = `turn-${group.toLowerCase().replace(/\W+/g, '-')}`;
        if (!list.length) return '';
        const n = list.filter(([id]) => state.prefs?.[id]).length;
        return `<details data-category="${key}" data-kind="mood" style="--mw-accent:${color}" ${openCategories.has(key) || !browsing ? 'open' : ''}><summary><span class="mw-category-icon">${icon}</span><span>Turn-ons & offs · ${group}</span><small>${n ? `${n} set` : list.length}</small></summary><div class="mw-category-body">${list.map(([id]) => turnRow(TURN_BY_ID[id], state)).join('')}</div></details>`;
    }).join('');
    const label = kind === 'mood' ? 'moodlets' : kind === 'state' ? 'needs and facts' : 'story settings';
    return `<div class="mw-tools">${browsing ? `<input class="mw-search" type="search" placeholder="Search everything…" aria-label="Search" value="${esc(search)}"><button data-action="browse-done" class="mw-primary">Done</button>`
            : `<button data-action="browse" class="mw-primary">＋ Add ${label}</button>${kind === 'mood' ? `<select data-field="recipe" aria-label="Add a starter blend"><option value="">Starter blend…</option>${Object.keys(RECIPES).map(r => `<option>${r}</option>`).join('')}</select>` : ''}`}</div>
    ${browsing ? `<p class="mw-explainer">Everything available. Tap ＋ or move a slider to put it on ${esc(whose)}’s list.</p>` : ''}
    <div class="mw-scale"><span>Off</span>${[...TIERS].reverse().map(t => `<span>${t.name}</span>`).join('')}</div>
    <datalist id="mw-cast-names">${[ch.name, playerName(), ...getCast(ch).map(p => p.name)].map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist>
    <datalist id="mw-hate-names">${getCast(ch).filter(p => who !== 'cast' || p.id !== selectedCast()?.id).map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
    ${!browsing && !cats && !turns ? `<p class="mw-explainer mw-empty-list">Nothing on ${esc(whose)}’s list yet. Tap “＋ Add ${label}” to pick from everything, or write your own below.</p>` : ''}
    <div class="mw-categories">${cats}${turns}</div><p class="mw-no-results" hidden>Nothing matches.</p>
    ${browsing ? '' : customBlock(state, kind, whose)}`;
}
function dynamicBlock(state, mine, allProfiles) {
    return !mine && state.mode === 'dynamic' ? `<div class="mw-dynamic"><label>Scene analyser<select data-field="profile"><option value="">Choose a connection profile…</option>${state.profile && !allProfiles.some(p => p.id === state.profile) ? '<option selected value="'+esc(state.profile)+'">Unavailable profile — choose another</option>' : ''}${allProfiles.map(p => `<option value="${esc(p.id)}" ${p.id === state.profile ? 'selected' : ''}>${esc(p.name)} · [${esc(p.model)}]</option>`).join('')}</select></label>
        <p class="mw-fine">Uses the actual model shown in brackets. Sends recent chat text and a short character excerpt to that profile. Your roleplay connection stays selected. One extra request per scene read; provider charges apply.</p>
        <div class="mw-actions"><button data-action="analyse" ${pending || !state.profile || !state.enabled ? 'disabled' : ''}>✧ Read scene now</button>${pending ? '<button data-action="cancel">Stop</button>' : ''}<button data-action="undo" ${!state.history?.length ? 'disabled' : ''}>Undo last read</button></div>
        <details class="mw-tuning"><summary>Emotional rhythm</summary><label>Sensitivity <output>${state.sensitivity}%</output><input aria-label="Sensitivity" type="range" min="10" max="100" value="${state.sensitivity}" data-field="sensitivity"></label>
        <label>Inertia <output>${state.inertia}%</output><input aria-label="Inertia" type="range" min="0" max="95" value="${state.inertia}" data-field="inertia"></label>
        <p class="mw-fine">Higher sensitivity allows stronger reactions. Higher inertia makes changes slower. Mood carryover advances on successful scene reads, not real-world time.</p>
        <label>Fade absent moods toward zero by <input aria-label="Fade rate" type="number" min="0" max="20" data-field="decay" value="${state.decay}"> points per read, before inertia</label>
        <label>Read every <input aria-label="Read interval" type="number" min="1" max="10" data-field="interval" value="${state.interval}"> new user turns</label></details></div>` : '';
}
function peopleBar(ch) {
    const cast = getCast(ch);
    const chip = (attrs, pressed, icon, name, extra = '') => `<button class="mw-person ${extra}" ${attrs} aria-pressed="${pressed}"><span class="mw-avatar">${icon}</span><span>${esc(name)}</span></button>`;
    return `<div class="mw-people" role="group" aria-label="Whose settings">
        ${chip('data-who="char"', who === 'char', esc(String(ch.name).trim()[0] ?? '◆').toUpperCase(), ch.name, 'is-main')}
        ${chip('data-who="user"', who === 'user', esc(playerName().trim()[0] ?? '◇').toUpperCase(), playerName(), 'is-you')}
        ${cast.map(p => chip(`data-who="cast" data-cast-id="${esc(p.id)}"`, who === 'cast' && selectedCast()?.id === p.id, esc(p.name.trim()[0]?.toUpperCase() ?? '♧'), p.name, p.inScene ? '' : 'is-away')).join('')}
        <button class="mw-person mw-person-add" data-action="cast-new" aria-pressed="${castAction === 'adding'}" title="Add a supporting character"><span class="mw-avatar">＋</span><span>Cast</span></button>
        ${chip('data-who="story"', who === 'story', '❖', 'Story', 'is-story')}
    </div>
    ${castAction === 'adding' ? `<div class="mw-cast-add mw-new-cast"><input type="text" data-cast-new maxlength="80" aria-label="New supporting character name" placeholder="Name, e.g. Chloe"><button data-action="cast-add">Add to cast</button></div>` : ''}`;
}
function personCard(ch, state) {
    const person = who === 'cast' ? selectedCast() : null;
    const name = who === 'story' ? 'The story' : subjectName();
    const role = who === 'char' ? 'Main character' : who === 'user' ? 'Your character · you write them' : who === 'story' ? 'Genre, tropes and style for this whole chat' : `Supporting character · ${person?.inScene ? 'in this scene' : 'off scene'}`;
    const top = activeMoods(state).find(m => m.kind === 'mood');
    const feeling = who === 'story' ? '' : top ? `<span class="mw-feeling" style="--mw-accent:${top.color}">Feeling <b>${esc(tagLabel(top).toLowerCase())}</b> · ${level(state.moods[top.id]).toLowerCase()}</span>` : '<span class="mw-feeling">No moodlets yet</span>';
    return `<div class="mw-person-card">
        <span class="mw-avatar mw-avatar-lg">${who === 'story' ? '❖' : esc(String(name).trim()[0]?.toUpperCase() ?? '?')}</span>
        <div class="mw-person-info"><b>${esc(name)}</b><small>${esc(role)}</small>${feeling}</div>
        <div class="mw-person-toggles"><label class="mw-toggle"><input type="checkbox" data-field="enabled" ${state.enabled ? 'checked' : ''}> ${who === 'char' ? 'On' : 'Send'}</label>
        ${person ? `<label class="mw-toggle"><input type="checkbox" data-field="castInScene" ${person.inScene ? 'checked' : ''}> In scene</label>` : ''}</div>
    </div>
    ${person ? `<details class="mw-cast-edit mw-manage"><summary>Manage ${esc(person.name)} and the cast</summary>
        <div class="mw-cast-add"><input type="text" data-field="castName" maxlength="80" aria-label="Supporting character name" value="${esc(person.name)}"><button data-action="cast-remove">Remove</button></div>
        <div class="mw-actions"><button data-action="cast-default">Save cast for ${esc(ch.name)}</button>${settings().castDefaults[`char:${ch.avatar}`]?.length ? '<button data-action="cast-load">Load saved cast</button>' : ''}</div>
        <p class="mw-fine">The cast belongs to ${esc(ch.name)}’s chats. Saving it gives new ${esc(ch.name)} chats the same people, starting off scene. Rename by editing the name; relationships follow.</p></details>` : ''}
    ${castAction && castAction !== 'adding' ? `<div class="mw-cast-confirm" role="group" aria-label="Confirm cast change"><p class="mw-fine">${castAction === 'load' ? 'Replace this chat’s cast and its sliders with the saved version? Everyone will start off scene.' : `Remove ${esc(person?.name ?? '')} from this chat’s cast? The saved default will stay as it is.`}</p><div class="mw-actions"><button data-action="cast-${castAction}-confirm">${castAction === 'load' ? 'Load saved cast' : 'Remove'}</button><button data-action="cast-cancel">Cancel</button></div></div>` : ''}`;
}
function render() {
    if (!panel) return;
    const scroll = panel.scrollTop;
    const advancedOpen = panel.querySelector('.mw-advanced:not(.mw-inspector):not(.mw-knowledge)')?.open;
    const tuningOpen = panel.querySelector('.mw-tuning')?.open;
    const inspectorOpen = panel.querySelector('.mw-inspector')?.open;
    const knowledgeOpen = panel.querySelector('.mw-knowledge')?.open;
    const manageOpen = panel.querySelector('.mw-manage')?.open;
    const relationSearch = panel.querySelector('[data-relation-search]')?.value ?? '';
    panel.querySelectorAll('[data-relation-group]').forEach(d => d.open ? openRelationGroups.add(d.dataset.relationGroup) : openRelationGroups.delete(d.dataset.relationGroup));
    panel.querySelectorAll('details[data-category]').forEach(d => d.open ? openCategories.add(d.dataset.category) : openCategories.delete(d.dataset.category));
    const ch = target(), charState = getState(ch), allProfiles = profiles();
    if (charState) migratePairs(ch);
    if (who === 'cast' && !selectedCast()) who = 'char';
    const state = charState ? viewState() : null, mine = who !== 'char';
    if (who === 'story') tab = 'mood';
    const kind = who === 'story' ? 'story' : tab === 'state' ? 'state' : 'mood';
    const active = state ? activeMoods(state) : [];
    const shown = active.filter(m => m.kind === kind && m.category !== 'relationship');
    const relationshipCount = state && who !== 'story' ? peers().reduce((n, p) => n + (p.relation?.enabled !== false && p.relation ? activeRelationshipTags(p.relation).length : 0) + (p.pair ? activeSharedTags(p.pair).length : 0), 0) : 0;
    const counts = { mood: active.filter(m => m.kind === 'mood').length, rel: relationshipCount, state: active.filter(m => m.kind === 'state' && m.category !== 'relationship').length };
    const peer = state && who !== 'story' ? currentPeer() : null;
    panel.innerHTML = `<div class="mw-top"><div class="mw-brand"><span class="mw-diamond">◆</span><div><span class="mw-eyebrow">A LITTLE INNER WEATHER</span><h2>Moodweaver</h2></div></div><button class="mw-close" data-action="close" aria-label="Close Moodweaver">×</button></div>
    ${!charState ? '<div class="mw-empty">Open a character chat to start weaving a mood.</div>' : `
    ${members().length > 1 ? `<div class="mw-context"><label>Group chat · main character<select data-field="character" aria-label="Main character">${members().map(m => `<option value="${esc(m.avatar)}" ${m.avatar === ch.avatar ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label></div>` : ''}
    ${peopleBar(ch)}
    ${state ? `${personCard(ch, state)}
    ${who === 'story' ? '' : `<div class="mw-mode mw-tabs" role="tablist" aria-label="Section">${[['mood', '✦', 'Moodlets'], ['rel', '♥', 'Relationships'], ['state', '⌂', 'Needs & facts']].map(([k, icon, label]) =>
        `<button role="tab" data-tab="${k}" aria-pressed="${tab === k}">${icon} ${label}${counts[k] ? ` <small>${counts[k]}</small>` : ''}</button>`).join('')}</div>`}
    ${tab === 'rel' && who !== 'story' ? relationshipView({ subject: subjectName(), peers: peers(), selectedKey: peer?.key, relation: peer?.relation, pair: peer?.pair, view: pairView, selfKey: personKeyOfSubject(), otherKey: peer ? keyForTarget(peer.key) : '', knowledge: getKnowledge(ch), isPlayer: who === 'user', focus: ch.name, openGroups: openRelationGroups, swapLabel: peer && swapTarget(peer) ? `${peer.name}’s side` : '', removing: removingRelation }) : `
    <div class="mw-summary"><div class="mw-section-label">${shown.length ? (kind === 'mood' ? 'ACTIVE MOODLETS' : kind === 'state' ? 'NEEDS & FACTS' : 'THE STORY SO FAR') : 'A CLEAN SLATE'}<span>${shown.length} active${active.length || relationshipCount ? ` · <button class="mw-clear" data-action="clear" title="Turn everything off for this person, pins too">Clear all</button>` : ''}</span></div>
        <div class="mw-chips">${shown.length ? shown.map(m => `<button data-jump="${m.id}" class="mw-chip" style="--mw-accent:${m.color}" title="Adjust ${esc(m.label)}"><span>${state.pins[m.id] ? '◆ ' : ''}${esc(tagLabel(m))}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`).join('') : `<p>${kind === 'mood' ? 'Nothing set. Start with a starter blend or move a slider.' : kind === 'state' ? 'Nothing set. Body, looks, background and the scene go here.' : 'No genre or style set for this chat yet.'}</p>`}</div>
        <p data-budget-warning class="mw-fine" hidden></p>
        ${kind === 'mood' && state.reason ? `<div class="mw-observation">${esc(state.reason)}<small>Last scene read · ${esc(new Date(state.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</small></div>` : ''}</div>
    ${kind === 'mood' && who === 'char' ? `<div class="mw-mode mw-small" role="group" aria-label="Mood mode"><button data-mode="manual" aria-pressed="${state.mode === 'manual'}">☷ Manual</button><button data-mode="dynamic" aria-pressed="${state.mode === 'dynamic'}">✧ Dynamic</button></div>
    <p class="mw-explainer">${state.mode === 'manual' ? 'You set the feeling. Mix as many as you like.' : 'The scene shapes the feeling. Pin anything you want to keep exactly as it is.'}</p>` : ''}
    ${kind === 'mood' && who === 'user' ? `<p class="mw-explainer">How ${esc(playerName())} comes across. ${esc(ch.name)} reacts to it but never writes for you. Choose what ${esc(ch.name)} knows below.</p>${knowledgePanel(state, ch)}` : ''}
    ${kind === 'mood' ? dynamicBlock(state, mine, allProfiles) : ''}
    ${catalogueBlock(state, kind, ch, who === 'story' ? 'the story' : subjectName())}`}
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
    <div data-status role="status" class="mw-status">${esc(status)}</div><div class="mw-footer">Small shifts. Complicated feelings. · v1.14.0</div><button class="mw-to-top" data-action="top" aria-label="Back to top" title="Back to top" hidden>↑</button>`;
    if (manageOpen && panel.querySelector('.mw-manage')) panel.querySelector('.mw-manage').open = true;
    if (advancedOpen && panel.querySelector('.mw-advanced:not(.mw-inspector):not(.mw-knowledge)')) panel.querySelector('.mw-advanced:not(.mw-inspector):not(.mw-knowledge)').open = true;
    if (tuningOpen && panel.querySelector('.mw-tuning')) panel.querySelector('.mw-tuning').open = true;
    if (inspectorOpen && panel.querySelector('.mw-inspector')) panel.querySelector('.mw-inspector').open = true;
    if (knowledgeOpen && panel.querySelector('.mw-knowledge')) panel.querySelector('.mw-knowledge').open = true;
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
        const inTab = who === 'story' ? d.dataset.kind === 'story' : d.dataset.kind !== 'story' && d.dataset.kind === tab;
        d.hidden = count === 0 || !inTab; if (inTab) shown += count;
        d.open = term ? count > 0 : !browsing || openCategories.has(d.dataset.category);
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
        if (e.target.dataset.turn !== undefined) {
            const v = Number(e.target.value), row = e.target.closest('.mw-mood');
            row.querySelector('[data-lvl]').textContent = turnLevel(v); e.target.setAttribute('style', turnFill(v)); return;
        }
        if (e.target.dataset.pairSlider || e.target.dataset.compareSlider || e.target.dataset.custom !== undefined || e.target.dataset.mem !== undefined) {
            const value = Number(e.target.value), row = e.target.closest('.mw-mood');
            row.querySelector('output').textContent = `${value}%`; row.querySelector('[data-lvl]').textContent = level(value);
            e.target.style.setProperty('--mw-fill', `${value}%`); return;
        }
        if (e.target.dataset.relSlider) {
            const id = e.target.dataset.relSlider, value = Number(e.target.value);
            const row = e.target.closest('.mw-mood');
            row.querySelector('output').textContent = `${value}%`; row.querySelector('[data-lvl]').textContent = level(value);
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
        if (input.dataset.cause !== undefined) { await changeState(s => { s.causes = { ...s.causes, [input.dataset.cause]: input.value.trim().slice(0, 100) }; }); return; }
        if (input.dataset.turn !== undefined && TURN_BY_ID[input.dataset.turn]) {
            const id = input.dataset.turn, v = Number(input.value);
            await changeState(s => { s.prefs = { ...s.prefs, [id]: v }; if (!s.loadout.includes(`turn:${id}`)) s.loadout.push(`turn:${id}`); }); return;
        }
        if (input.dataset.custom !== undefined || input.dataset.customText !== undefined || input.dataset.customCause !== undefined) {
            const id = input.dataset.custom ?? input.dataset.customText ?? input.dataset.customCause;
            await changeState(s => { const r = s.custom.find(x => x.id === id); if (!r) return;
                if (input.dataset.custom !== undefined) r.value = Number(input.value);
                else if (input.dataset.customText !== undefined) { const t = input.value.replace(/\s+/g, ' ').trim().slice(0, 100); if (t) r.text = t; }
                else r.cause = input.value.replace(/\s+/g, ' ').trim().slice(0, 100); }); return;
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
            await changeState(s => { s.moods[input.dataset.slider] = Number(input.value); if (!s.loadout.includes(input.dataset.slider)) s.loadout.push(input.dataset.slider); if (who === 'char' && s.mode === 'dynamic') s.pins[input.dataset.slider] = true; }); return;
        }
        if (input.dataset.setting) { settings()[input.dataset.setting] = Number(input.value); settings(); ctx().saveSettingsDebounced(); await syncPrompt(); render(); return; }
        const field = input.dataset.field;
        if (field === 'character') { selectedAvatar = input.value; selectedCastId = ''; selectedPeer = ''; removingRelation = ''; castAction = ''; status = ''; render(); await syncPrompt(); return; }
        if (field === 'cast') { selectedCastId = input.value; selectedPeer = ''; removingRelation = ''; castAction = ''; status = ''; render(); return; }
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
        if (field === 'recipe') { if (RECIPES[input.value]) await changeState(s => { for (const [k, v] of Object.entries(RECIPES[input.value])) if (!s.pins[k] && BY_ID[k]) { s.moods[k] = v; if (!s.loadout.includes(k)) s.loadout.push(k); } }); return; }
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
        if (button.dataset.who) {
            who = button.dataset.who; browsing = false; if (button.dataset.castId) selectedCastId = button.dataset.castId;
            selectedPeer = ''; removingRelation = ''; castAction = ''; status = ''; render(); return;
        }
        if (button.dataset.peer !== undefined) { selectedPeer = button.dataset.peer; removingRelation = ''; render(); return; }
        if (button.dataset.pairTab) { pairView = button.dataset.pairTab; removingRelation = ''; render(); return; }
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
        if (button.dataset.customRemove) { const id = button.dataset.customRemove; await changeState(s => { s.custom = s.custom.filter(r => r.id !== id); }); return; }
        if (button.dataset.memRemove) {
            const pair = currentPeer()?.pair; if (!pair) return;
            pair.memories = (pair.memories ?? []).filter(m => m.id !== button.dataset.memRemove); await persist(); await syncPrompt(); render(); return;
        }
        if (button.dataset.mode) { await changeState(s => { s.mode = button.dataset.mode; }); return; }
        if (button.dataset.tab) { tab = button.dataset.tab; search = ''; browsing = false; removingRelation = ''; render(); return; }
        if (button.dataset.pin) { await changeState(s => { s.pins[button.dataset.pin] = !s.pins[button.dataset.pin]; }); return; }
        if (button.dataset.jump) {
            search = ''; if (who !== 'story') tab = BY_ID[button.dataset.jump]?.kind === 'state' ? 'state' : 'mood'; render();
            const row = panel.querySelector(`[data-mood="${button.dataset.jump}"]`), category = row.closest('details');
            category.open = true; openCategories.add(category.dataset.category); row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.querySelector('input').focus(); return;
        }
        switch (button.dataset.action) {
            case 'relation-add': {
                try {
                    const typed = castName(panel.querySelector('[data-relation-new]').value);
                    const existing = peers().find(p => p.name.toLowerCase() === resolveRelationName(typed).toLowerCase());
                    if (existing) { selectedPeer = existing.key; removingRelation = ''; status = ''; render(); break; }
                    const name = validRelationName(typed);
                    const relation = cloneRelationships([{ id: newCastId(), target: name }])[0];
                    relationshipList().push(relation); selectedPeer = name; removingRelation = ''; status = '';
                    await persist(viewState()); await syncPrompt(); render();
                } catch (error) { status = error.message; renderStatus(); }
                break;
            }
            case 'rel-swap': {
                const peer = currentPeer(), next = peer && swapTarget(peer); if (!next) break;
                const fromKey = who === 'char' ? (members().length > 1 ? target().name : '{{char}}') : who === 'user' ? '{{user}}' : selectedCast()?.name;
                if (next.avatar) selectedAvatar = next.avatar;
                if (next.castId) selectedCastId = next.castId;
                who = next.who; selectedPeer = fromKey ?? ''; removingRelation = ''; tab = 'rel';
                render(); await syncPrompt(); break;
            }
            case 'browse': browsing = true; search = ''; render(); panel.querySelector('.mw-search')?.focus(); break;
            case 'browse-done': browsing = false; search = ''; render(); break;
            case 'custom-add': {
                const kind = button.dataset.kind, field = panel.querySelector(`[data-custom-new="${kind}"]`);
                const t = field?.value.replace(/\s+/g, ' ').trim().slice(0, 100); if (!t) break;
                await changeState(s => { s.custom.push({ id: newId(), kind, text: t, value: 50, cause: '' }); }); break;
            }
            case 'mem-add': {
                const peer = currentPeer(), field = panel.querySelector('[data-mem-new]');
                const t = field?.value.replace(/\s+/g, ' ').trim().slice(0, 160); if (!peer || !t) break;
                const other = keyForTarget(peer.key);
                const pair = getPair(personKeyOfSubject(), other, true, other.startsWith('name:') ? { [other]: peer.name } : {});
                (pair.memories ??= []).push({ id: newId(), text: t, value: 50, who: 'both' });
                await persist(); await syncPrompt(); render(); break;
            }
            case 'cast-new': castAction = castAction === 'adding' ? '' : 'adding'; render(); panel.querySelector('[data-cast-new]')?.focus(); break;
            case 'relation-rename': {
                try {
                    const relation = selectedRelation(); if (!relation) break;
                    relation.target = validRelationName(panel.querySelector('[data-relation-target]').value, relation.id);
                    await persist(viewState()); await syncPrompt(); render();
                } catch (error) { status = error.message; renderStatus(); }
                break;
            }
            case 'relation-remove': removingRelation = 'relation'; render(); break;
            case 'pair-clear': removingRelation = 'pair'; render(); break;
            case 'pair-clear-confirm': {
                const peer = currentPeer(); const meta = ctx().chatMetadata[KEY];
                if (peer && meta?.pairs) delete meta.pairs[pairId(personKeyOfSubject(), keyForTarget(peer.key))];
                removingRelation = ''; await persist(); await syncPrompt(); render(); break;
            }
            case 'relation-cancel': removingRelation = ''; render(); break;
            case 'relation-remove-confirm': {
                const relation = selectedRelation(); if (!relation) break;
                const list = relationshipList(); list.splice(list.indexOf(relation), 1);
                removingRelation = '';
                await persist(viewState()); await syncPrompt(); render(); break;
            }
            case 'cast-add': {
                try {
                    const person = addCastMember(getCast(), panel.querySelector('[data-cast-new]').value, newCastId(), [playerName(), ...members().map(ch => ch.name)]);
                    selectedCastId = person.id; who = 'cast'; selectedPeer = ''; castAction = ''; status = `${person.name} added to this chat’s cast.`;
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
                if (!confirm(`Clear everything for ${whose}? Every slider goes to 0 and pins are removed. Their list stays, so you can set a new scene quickly.`)) break;
                await changeState(s => { for (const m of MOODS) { s.moods[m.id] = 0; s.pins[m.id] = false; } for (const r of s.relationships ?? []) for (const key of Object.keys(r.moods)) r.moods[key] = 0;
                    s.causes = {}; s.prefs = {}; for (const r of s.custom ?? []) { r.value = 0; r.cause = ''; } s.reason = ''; }); break;
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
        cancelAnalysis(); selectedAvatar = ''; selectedCastId = ''; selectedPeer = ''; removingRelation = ''; castAction = ''; status = '';
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
