import { KNOWLEDGE_MODES, knowledgeEntry, MERGED_SEARCH_NAMES, CATEGORIES, MOODS, BY_ID, TRAIT_CATEGORIES, sectionOf, RECIPES, activeMoods, freshState, extendCatalogue, migrateCatalogue, isExtended, shortName, level, escapeHtml as esc, clamp, budgetPrompt, parseAnalysis, applyAnalysis, sceneData, analysisMessages, fingerprint, cleanScope, cleanWants, WANT_KINDS } from './core.js';
import { latestBoard, liveBoard, cleanBoardMeta, boardPromptLines, namedIn, matchMood, needWord, EDIT_FIELDS } from './board.js';
import { boardView } from './board-ui.js';
import { applyLibrary, cleanLibrary, libraryPrompt, librarySections, newLibraryId, isTurnGroup, turnGroupKey } from './library.js';

import { castFor, addCastMember, castDefaults, castName, newCastId } from './cast.js';
import { RELATIONSHIP_BY_ID, SHARED_BY_ID, SHARED_IDS, activeRelationshipTags, activeSharedTags, cloneRelationships, cleanCompare, relationshipKey } from './relationships.js';
import { relationshipView } from './relationship-ui.js';
import { TURN_CATEGORIES, TURN_BY_ID } from './turns.js';
import { cleanPersonality, cleanEnneagram, activePersonalities } from './personality.js';
import { personalityView, filterPersonality } from './personality-ui.js';
import { capturePanel, savedPanel, restorePanelFields, restorePanelPosition, clearPanelSearch, rememberGroupChoice } from './panel-state.js';

const KEY = 'moodweaver';
const PROMPT_KEY = 'moodweaver-state';
const ctx = () => SillyTavern.getContext();
const VERSION = '1.23.0';
const defaults = { tokenBudget: 2000, depth: 0, placementVersion: 1, sceneMessages: 6, sceneChars: 8000, outputTokens: 800, baselines: {}, promptVersion: 4, library: [], readerProfile: '', boardSend: true, boardPresent: true };
let panel, selectedAvatar = '', selectedCastId = '', castAction = '', pending = null, promptVersion = 0, suspended = false;
let promptInfo = { prompt: '', tokens: 0, omitted: 0 }, status = '', search = '', tab = 'mood', who = 'char';
// UI-only: the settings sheet, and the "make your own" editor ({ kind, id? editing a library entry, fromOwn? promoting a one-off row }).
let settingsOpen = false, maker = null, appliedLibrary = null;
// Needs board UI: editing the scene text, and which tile's actions are open ('state:text').
let boardEditing = false, boardFocus = '', boardTimer = 0;
const generationSnapshots = new Map();
let selectedPeer = '', removingRelation = '', pairView = 'mine', browsing = false;
const newId = () => Math.random().toString(36).slice(2, 10);
const openRelationGroups = new Set(), autoOpened = new Set();
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
    // 1.22: the target matches the ~2000-token goal, and the reader looks at fewer, more recent messages.
    if (saved.promptVersion < 4) {
        if ((saved.tokenBudget ?? 800) === 800) saved.tokenBudget = 2000;
        if ((saved.sceneMessages ?? 8) === 8) saved.sceneMessages = 6;
        if ((saved.sceneChars ?? 12000) === 12000) saved.sceneChars = 8000;
        saved.promptVersion = 4; c.saveSettingsDebounced();
    }
    // Your library has to be in the catalogue before any saved state is cleaned, or its values would be dropped.
    saved.library = Array.isArray(saved.library) ? saved.library : [];
    if (appliedLibrary !== saved.library) { saved.library = applyLibrary(saved.library); appliedLibrary = saved.library; }
    // Move the former default after the latest message once; keep other custom depths.
    if (!saved.placementVersion) {
        if (saved.depth == null || Number(saved.depth) === 1) saved.depth = 0;
        saved.placementVersion = 1;
        c.saveSettingsDebounced();
    }
    return Object.assign(saved, {
        tokenBudget: clamp(saved.tokenBudget ?? 800, 160, 3000),
        depth: Math.round(clamp(saved.depth ?? 0, 0, 10)),
        sceneMessages: Math.round(clamp(c.extensionSettings[KEY].sceneMessages ?? 6, 2, 20)),
        sceneChars: clamp(c.extensionSettings[KEY].sceneChars ?? 8000, 2000, 40000),
        outputTokens: clamp(c.extensionSettings[KEY].outputTokens ?? 800, 300, 4000),
        baselines: c.extensionSettings[KEY].baselines ?? {},
        castDefaults: c.extensionSettings[KEY].castDefaults ?? {},
        boardSend: saved.boardSend !== false, boardPresent: saved.boardPresent !== false,
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
    if (!isExtended(meta.user)) migrateCatalogue(meta.user, Object.values(meta.personaKnowledge ?? {}));
    const state = movePairFacts(extendCatalogue(meta.user), '{{char}}');
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
        <input type="search" id="mw-knowledge-search" data-filter-list="knowledge" placeholder="Find an active trait or mood…" aria-label="Search persona knowledge">
        ${active.length ? active.map(m => {
            const entry = knowledgeEntry(knowledge[m.id]);
            return `<div class="mw-knowledge-row" data-knowledge-row="${m.id}" data-filter-item="knowledge" data-search="${esc(tagLabel(m) + ' ' + m.cue + ' ' + (MERGED_SEARCH_NAMES[m.id] ?? []).join(' '))}"><label for="mw-knowledge-${m.id}">${esc(tagLabel(m))} <small>${level(state.moods[m.id])} · ${state.moods[m.id]}%</small></label>
                <select id="mw-knowledge-${m.id}" data-knowledge="${m.id}" aria-label="What ${esc(ch.name)} knows: ${esc(m.label)}">${KNOWLEDGE_MODES.map((mode, i) => `<option value="${mode}" ${entry.mode === mode ? 'selected' : ''}>${['Scene only', 'Private', 'Suspected', 'Known'][i]}</option>`).join('')}</select>
                ${['known', 'suspected'].includes(entry.mode) ? `<input type="text" maxlength="120" data-knowledge-source="${m.id}" aria-label="Source for ${esc(m.label)}" placeholder="How they learned it (optional)" value="${esc(entry.source)}">` : ''}</div>`;
        }).join('') : '<p class="mw-fine">Enable a persona tag and it will appear here.</p>'}
        <p class="mw-fine" data-filter-empty="knowledge" hidden>No matching active traits or moods.</p>
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
// ---- Needs board: read from the latest info board in the chat, plus the player's edits ----
const boardMeta = () => ctx().chatMetadata?.[KEY]?.board;
const boardSend = () => Boolean(ctx().chatId) && (boardMeta()?.send ?? settings().boardSend);
function liveFor(ch = target(), chat = ctx().chat) {
    return liveBoard(latestBoard(chat), boardMeta(), { char: ch?.name ?? '', user: playerName() });
}
async function editBoard(mutate) {
    const meta = ctx().chatMetadata?.[KEY]; if (!meta) return;
    const b = cleanBoardMeta(meta.board); mutate(b); meta.board = b;
    await persist(); await syncPrompt(); render();
}
// A new board arrived (or one was swiped, edited or deleted). Cut phrases the bot already dropped,
// and let the Present line move cast members in and out of the scene.
async function boardChanged() {
    const c = ctx(), meta = c.chatMetadata?.[KEY], ch = target();
    const found = meta && ch ? latestBoard(c.chat) : null;
    if (found && found.key !== meta.board?.syncedKey) {
        const b = cleanBoardMeta(meta.board), text = `${found.board.state ?? ''} ${found.board.physical ?? ''}`.toLowerCase();
        for (const kind of ['state', 'physical']) b.mute[kind] = b.mute[kind].filter(p => text.includes(p.toLowerCase()));
        b.syncedKey = found.key; meta.board = b;
        const moved = [];
        if (settings().boardPresent && found.board.present !== undefined) for (const person of getCast(ch)) {
            const here = namedIn(found.board.present, person.name);
            if (here !== person.inScene) { person.inScene = here; moved.push(`${person.name} ${here ? 'in' : 'out'}`); }
        }
        if (moved.length) status = `Board: ${moved.join(', ')}.`;
        await persist();
    }
    if (panel?.open) render();
    await syncPrompt();
}
// People the Present line can point at: tap to open their panel.
function boardPeople(ch) {
    const list = [{ name: ch.name, attrs: 'data-who="char"' }, { name: playerName(), attrs: 'data-who="user"' },
        ...getCast(ch).map(p => ({ name: p.name, attrs: `data-who="cast" data-cast-id="${esc(p.id)}"`, away: !p.inScene }))];
    return list.map(p => ({ ...p, match: fragment => namedIn(fragment, p.name) }));
}
const queueBoard = () => { clearTimeout(boardTimer); boardTimer = setTimeout(() => void boardChanged(), 150); };
function profiles() {
    try { return ctx().ConnectionManagerRequestService.getSupportedProfiles(); } catch { return []; }
}
async function persist(state) {
    if (state) state.revision = (state.revision || 0) + 1;
    try { await ctx().saveMetadata(); } catch { status = 'Could not save chat metadata. Try again before switching chats.'; renderStatus(); }
}
async function syncPrompt(forGeneration = false, chat = null) {
    const version = ++promptVersion;
    const c = ctx(), ch = target(forGeneration), state = getState(ch), id = identity(ch), mine = getUserState(), story = getStoryState(ch);
    if (suspended || !state) {
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        promptInfo = { prompt: '', tokens: 0, omitted: 0 }; renderPreview(); return;
    }
    try {
        migratePairs(ch);
        const name = String(ch.name).slice(0, 100), player = playerName().slice(0, 100);
        const board = boardPromptLines({ send: boardSend(), live: liveFor(ch, chat ?? c.chat), char: name, user: player, n: shortName(name), u: shortName(player) });
        const result = await budgetPrompt(state, name, settings().tokenBudget, text => c.getTokenCountAsync(text), { player: { state: mine, name: player, knowledge: getKnowledge(ch) }, story, cast: getCast(ch), pairs: pairExtras(ch), board });
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
    const mini = panel.querySelector('[data-token-mini]');
    if (mini) { mini.textContent = promptInfo.tokens ? `≈ ${promptInfo.tokens} tokens sent${promptInfo.overBudget ? ` · ${promptInfo.overBudget} over your ${promptInfo.target} target` : ''}` : ''; mini.classList.toggle('is-over', Boolean(promptInfo.overBudget)); }
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
// ---- Scene reader ----
// Works for whoever is open (not the story), in manual mode too: tap Read, keep editing by hand.
const readerProfile = () => settings().readerProfile || getState()?.profile || '';
const sceneStart = () => Number(ctx().chatMetadata[KEY]?.sceneStart) || 0;
function readerSubject(whom = who, ch = target()) {
    if (whom === 'user') {
        const pu = ctx().powerUserSettings;
        return { state: getUserState(), person: { name: playerName(), description: pu?.persona_description ?? '' }, key: 'user' };
    }
    if (whom === 'cast') { const p = selectedCast(); return p ? { state: p.state, person: { name: p.name }, key: `cast:${p.id}` } : null; }
    return { state: getState(ch), person: ch, key: `char:${ch?.avatar}` };
}
function readerRequest(subject, scope) {
    const data = sceneData(ctx().chat, subject.person, subject.state, settings(), { sceneStart: sceneStart(), scope });
    return { data, messages: analysisMessages(data) };
}
// Rough count for the panel only (about 3.6 characters per token), so cost is visible before tapping.
const roughTokens = messages => Math.round(messages.reduce((n, m) => n + m.content.length, 0) / 3.6);
async function analyse(force = false, whom = who, ch = target()) {
    const c = ctx(), subject = readerSubject(whom, ch);
    const state = subject?.state;
    if (suspended || !state || !state.enabled || pending || whom === 'story') return;
    const profile = readerProfile();
    if (!profile) { status = 'Pick a reader connection under ✧ Scene reader first.'; renderStatus(); return; }
    const snapshot = identity(ch) + subject.key, revision = state.revision, metadata = c.chatMetadata;
    const fp = fingerprint(c.chat), userCount = c.chat.filter(m => m.is_user && !m.is_system).length;
    if (!force && (fp === state.lastFingerprint || (state.lastUserCount >= 0 && userCount > state.lastUserCount && userCount - state.lastUserCount < state.interval))) return;
    const scope = cleanScope(state.readScope);
    const { data, messages } = readerRequest(subject, scope);
    const controller = new AbortController();
    pending = { controller, snapshot };
    const timer = setTimeout(() => controller.abort(), 45000);
    status = `Reading the scene for ${subject.person.name}…`; render();
    try {
        // No fallback to the main model: a missing or invalid profile is an error.
        const response = await c.ConnectionManagerRequestService.sendRequest(profile, messages, settings().outputTokens,
            { stream: false, signal: controller.signal, extractData: true, includePreset: false, includeInstruct: true });
        if (controller.signal.aborted || metadata !== ctx().chatMetadata || snapshot !== identity(ch) + readerSubject(whom, ch)?.key || revision !== state.revision || fp !== fingerprint(ctx().chat)) {
            status = 'The scene or your settings changed while reading, so that read was thrown away.'; return;
        }
        const result = parseAnalysis(response?.content ?? '', data);
        state.history = [...(state.history || []).slice(-9), { moods: { ...state.moods }, custom: state.custom.map(r => ({ id: r.id, value: r.value })),
            wants: structuredClone(state.wants ?? []), reason: state.reason, updatedAt: state.updatedAt }];
        applyAnalysis(state, result, scope);
        state.reason = result.reason; state.updatedAt = Date.now(); state.lastFingerprint = fp; state.lastUserCount = userCount;
        await persist(state);
        status = `Updated from the scene${Object.values(state.pins).some(Boolean) ? '; pinned ones were left alone' : ''}.${result.added?.length ? ` ${result.added.length} new want${result.added.length > 1 ? 's' : ''} or fear${result.added.length > 1 ? 's' : ''} added.` : ''}`;
    } catch (error) {
        status = controller.signal.aborted ? 'Reading stopped or timed out. Nothing changed.' : (error.message || 'Reading failed. Nothing changed.');
    } finally {
        clearTimeout(timer); pending = null;
        await syncPrompt(); render();
    }
}

globalThis.moodweaverBeforeGeneration = async (chat, _contextSize, _abort, type) => {
    if (suspended || ['quiet', 'impersonate'].includes(type)) {
        ++promptVersion; ctx().setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1); return;
    }
    const ch = target(true), state = getState(ch);
    if (state?.enabled && state.mode === 'dynamic' && !['swipe', 'regenerate', 'continue'].includes(type)) await analyse(false, 'char', ch);
    await syncPrompt(true, chat);
    generationSnapshots.set(identity(ch), { at: new Date().toLocaleString(), depth: settings().depth, prompt: promptInfo.prompt });
    if (generationSnapshots.size > 20) generationSnapshots.delete(generationSnapshots.keys().next().value);
    renderPreview();
};

const tagLabel = m => m.label.replaceAll('{{user}}', playerName()).replaceAll('{{char}}', target()?.name ?? 'main character');
const fmtTokens = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
function targetFields(m, state) {
    if (!state.moods[m.id]) return '';
    const fields = m.id === 'hates_other' ? [['hate', 'Who?', 'Name of someone in the scene']]
        : m.id === 'comparing_people' ? [['compareA', 'Compare', 'Someone in the scene'], ['compareB', 'With', '{{user}}']] : [];
    return fields.length ? `<div class="mw-target-fields">${fields.map(([key, label, placeholder]) => `<label>${label}<input type="text" data-target="${key}" maxlength="80" list="${key === 'hate' ? 'mw-hate-names' : 'mw-cast-names'}" placeholder="${esc(placeholder)}" value="${esc(state.targets?.[key] ?? '')}"></label>`).join('')}</div>` : '';
}
// Your library options get a ✎ so you can fix their wording or move them to another section.
const editButton = (id, label) => `<button type="button" class="mw-edit" data-lib-edit="${esc(id)}" title="Edit your option" aria-label="Edit ${esc(label)}">✎</button>`;
function row(m, state) {
    const value = state.moods[m.id], pin = state.pins[m.id];
    return `<div class="mw-mood ${m.custom ? 'is-yours' : ''}" data-mood="${m.id}" data-aliases="${esc((MERGED_SEARCH_NAMES[m.id] ?? []).join(' '))}" style="--mw-accent:${m.color}">
        <div class="mw-row-head"><label for="mw-${m.id}">${esc(tagLabel(m))}</label><span data-level="${m.id}">${level(value)}</span>
        <output for="mw-${m.id}" data-value="${m.id}">${value}%</output>
        <button type="button" class="mw-pin ${pin ? 'is-pinned' : ''}" data-pin="${m.id}" aria-pressed="${pin}" aria-label="${pin ? 'Unpin' : 'Pin'} ${esc(tagLabel(m))}" title="Pin: the scene reader leaves it alone">${pin ? '◆' : '◇'}</button>${m.custom ? editButton(m.id, m.label) : ''}${listButton(m.id, state)}</div>
        <input id="mw-${m.id}" type="range" min="0" max="100" step="1" value="${value}" data-slider="${m.id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
        <small>${esc(m.cue)}</small>${targetFields(m, state)}${value ? causeBox(`data-cause="${m.id}"`, state.causes?.[m.id]) : ''}</div>`;
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
    return `<div class="mw-mood mw-turn ${t.custom ? 'is-yours' : ''}" data-mood="turn:${t.id}" style="--mw-accent:${t.color}"><div class="mw-row-head"><label for="mw-turn-${t.id}">${esc(t.label)}</label><span data-lvl>${turnLevel(v)}</span>${t.custom ? editButton(t.id, t.label) : ''}${listButton(`turn:${t.id}`, state)}</div>
        <input id="mw-turn-${t.id}" type="range" min="-100" max="100" step="1" value="${v}" data-turn="${t.id}" style="${turnFill(v)}" aria-valuetext="${turnLevel(v)}">
        <div class="mw-turn-ends"><span>✕ Turn-off</span><span>Turn-on ♡</span></div><small>${esc(t.cue)}</small></div>`;
}
// Inventory: things this person has. Ticked items are sent; unticked ones stay saved for later.
function inventoryView(state, ch) {
    const items = state.inventory ?? [], name = subjectName(), carried = items.filter(i => i.carried).length;
    const intro = who === 'user' ? `Things ${esc(playerName())} has. You decide when you use them; ${esc(ch.name)} only knows about what they could see or already know of.`
        : `Things ${esc(name)} has. The AI can use them when the moment fits, never just to show them off.`;
    return `<section class="mw-inventory">
        <div class="mw-summary"><div class="mw-section-label">${items.length ? 'INVENTORY' : 'EMPTY POCKETS'}<span>${carried} carried${items.length > carried ? ` · ${items.length - carried} stored` : ''}</span></div>
        <p class="mw-fine">${intro} Untick an item to keep it saved without sending it.</p></div>
        <div class="mw-inv-list">${items.map(i => `<div class="mw-inv-item ${i.carried ? '' : 'is-stored'}" data-inv-row="${esc(i.id)}">
            <label class="mw-inv-check" title="${i.carried ? 'Carried: sent to the AI' : 'Stored: not sent'}"><input type="checkbox" data-inv-carried="${esc(i.id)}" ${i.carried ? 'checked' : ''} aria-label="Carry ${esc(i.text)}"><span></span></label>
            <div class="mw-inv-fields"><input type="text" class="mw-inv-name" data-inv-text="${esc(i.id)}" maxlength="60" value="${esc(i.text)}" aria-label="Item">
            <input type="text" class="mw-inv-note" data-inv-note="${esc(i.id)}" maxlength="80" value="${esc(i.note)}" placeholder="where / details (optional)" aria-label="Where or details"></div>
            <button type="button" class="mw-list" data-inv-remove="${esc(i.id)}" title="Delete" aria-label="Delete ${esc(i.text)}">×</button></div>`).join('')}</div>
        <div class="mw-cast-add mw-inv-add"><input type="text" data-inv-new maxlength="60" enterkeyhint="done" placeholder="Add an item…" aria-label="New item"><button data-action="inv-add" class="mw-primary">＋ Add</button></div>
    </section>`;
}
// ---- Make your own ----
const MAKER_HINT = {
    mood: ['e.g. Smitten and terrified', 'falling for them and scared of it'],
    trait: ['e.g. Breeding', 'wants to get someone pregnant, and says so'],
    turn: ['e.g. Rings on fingers', 'heavy rings on someone’s hands'],
    state: ['e.g. Wearing his jacket', 'still wearing the jacket he lent her'],
    story: ['e.g. Everything after dark', 'every scene happens at night'],
};
const lastGroup = { trait: 'appetites' };
const libraryEntry = id => settings().library.find(e => e.id === id);
function makerDraft() {
    const d = maker?.draft ?? {};
    return { label: String(d.label ?? '').replace(/\s+/g, ' ').trim().slice(0, 60), cue: String(d.cue ?? '').replace(/\s+/g, ' ').trim().slice(0, 160), group: d.group, dark: d.dark === true };
}
function openMaker(kind, { id = '', fromOwn = '' } = {}) {
    const sections = librarySections(kind, TRAIT_CATEGORIES), entry = id ? libraryEntry(id) : null;
    const own = fromOwn ? viewState()?.custom.find(r => r.id === fromOwn) : null;
    const group = entry?.group ?? lastGroup[kind] ?? sections[0]?.[0];
    maker = { kind, id, fromOwn, draft: entry ? { ...entry } : { label: own?.text ?? '', cue: '', group, dark: false } };
}
const makerPreview = d => !d.label ? '…' : isTurnGroup(d.group) ? `turn-on: ${libraryPrompt(d)}` : libraryPrompt(d);
function makerView(kind, whose) {
    if (!maker || maker.kind !== kind) return `<button type="button" class="mw-maker-open" data-action="maker-open" data-kind="${kind}"><span>✎</span> Make your own</button>`;
    const d = maker.draft, sections = librarySections(kind, TRAIT_CATEGORIES), [hintName, hintCue] = MAKER_HINT[kind];
    const editing = Boolean(maker.id);
    return `<section class="mw-maker" id="mw-maker">
        <div class="mw-maker-head"><span class="mw-maker-icon">✎</span><div><b>${editing ? 'Edit your option' : maker.fromOwn ? 'Save to your library' : 'Make your own'}</b>
            <small>${editing ? 'Changes apply everywhere it’s used.' : 'Library options join the list for every character and stay searchable.'}</small></div></div>
        <label class="mw-field">Name<input type="text" data-maker="label" maxlength="60" value="${esc(d.label)}" placeholder="${esc(hintName)}"></label>
        <label class="mw-field">What it means <small>optional · sent to the AI</small><input type="text" data-maker="cue" maxlength="160" value="${esc(d.cue)}" placeholder="${esc(hintCue)}"></label>
        <label class="mw-field">Goes under<select data-maker="group">${sections.map(([id, name]) => `<option value="${esc(id)}" ${id === d.group ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
        ${kind === 'turn' ? '' : `<label class="mw-toggle mw-dark-toggle"><input type="checkbox" data-maker="dark" ${d.dark ? 'checked' : ''}> ☠ Dark: the AI actually follows through</label>`}
        <p class="mw-sent">Sent as <q data-maker-preview>${esc(makerPreview(makerDraft()))}</q></p>
        <div class="mw-actions">${editing ? `<button class="mw-primary" data-action="maker-save">Save changes</button><button class="mw-danger" data-action="maker-delete">Delete</button>`
            : `<button class="mw-primary" data-action="maker-save">＋ Save to library</button>${kind === 'turn' || maker.fromOwn ? '' : `<button data-action="maker-once">Just for ${esc(whose)}</button>`}`}<button data-action="maker-cancel">Cancel</button></div>
    </section>`;
}
// One-off rows written for one person, plus the editor.
function customBlock(state, kind, whose) {
    const rows = kind === 'turn' ? [] : (state.custom ?? []).filter(r => r.kind === kind);
    return `<div class="mw-custom">${rows.length ? `<div class="mw-section-label">Just for ${esc(whose)}<span>sent as written</span></div>` : ''}
        ${rows.map(r => `<div class="mw-mood mw-own" data-custom-row="${esc(r.id)}" data-search="${esc(r.text)}"><div class="mw-row-head"><input type="text" class="mw-own-text" data-custom-text="${esc(r.id)}" maxlength="100" value="${esc(r.text)}" aria-label="Your own setting"><span data-lvl>${level(r.value)}</span><output>${r.value}%</output><button type="button" class="mw-list" data-own-promote="${esc(r.id)}" title="Save to your library for every character" aria-label="Save to library">⇪</button><button type="button" class="mw-list" data-custom-remove="${esc(r.id)}" title="Delete" aria-label="Delete">×</button></div>
            <input type="range" min="0" max="100" step="1" value="${r.value}" data-custom="${esc(r.id)}" style="--mw-fill:${r.value}%" aria-label="Strength">
            ${r.value ? causeBox(`data-custom-cause="${esc(r.id)}"`, r.cause) : ''}</div>`).join('')}
        ${makerView(kind, whose)}</div>`;
}
const SECTION_LABEL = { mood: 'moodlets', trait: 'traits', turn: 'turn-ons', state: 'facts', story: 'story settings' };
// While the board is in play, the Body list is redundant: needs and physical state come from the board.
// Body options you'd already switched on still show and still send.
const boardCoversBody = () => boardSend() || Boolean(latestBoard(ctx().chat));
// Each person only shows their own list until you go looking for more.
function catalogueBlock(state, kind, ch, whose) { // kind is the tab's section: mood, trait, turn, state or story
    const listed = new Set([...(state.loadout ?? []), ...MOODS.filter(m => state.moods[m.id] > 0).map(m => m.id),
        ...Object.keys(state.prefs ?? {}).filter(id => state.prefs[id]).map(id => `turn:${id}`)]);
    const show = id => browsing || listed.has(id);
    const sectionOfCategory = (id, k) => k === 'story' ? 'story' : TRAIT_CATEGORIES.has(id) ? 'trait' : k;
    const hideBody = kind === 'state' && boardCoversBody();
    const cats = kind === 'turn' ? '' : CATEGORIES.filter(([id, , , , , k = 'mood']) => sectionOfCategory(id, k) === kind).map(([id, name, icon, color, , k = 'mood']) => {
        const list = MOODS.filter(m => m.category === id && show(m.id) && !(hideBody && id === 'body' && !state.moods[m.id])), n = list.filter(m => state.moods[m.id]).length;
        if (!list.length) return '';
        return `<details data-category="${id}" data-kind="${sectionOfCategory(id, k)}" style="--mw-accent:${color}"><summary><span class="mw-category-icon">${icon}</span><span>${name}</span><small>${n ? `${n} on` : list.length}</small></summary><div class="mw-category-body">${list.map(m => row(m, state)).join('')}</div></details>`;
    }).join('');
    const turns = kind !== 'turn' ? '' : TURN_CATEGORIES.map(([group, icon, color, rows]) => {
        const list = rows.filter(([id]) => show(`turn:${id}`) && TURN_BY_ID[id]), key = turnGroupKey(group);
        if (!list.length) return '';
        const n = list.filter(([id]) => state.prefs?.[id]).length;
        return `<details data-category="${key}" data-kind="turn" class="mw-turn-group" style="--mw-accent:${color}"><summary><span class="mw-category-icon">${icon}</span><span>${group}</span><small>${n ? `${n} set` : list.length}</small></summary><div class="mw-category-body">${list.map(([id]) => turnRow(TURN_BY_ID[id], state)).join('')}</div></details>`;
    }).join('');
    const label = SECTION_LABEL[kind];
    return `<div class="mw-tools"><input id="mw-catalogue-search" class="mw-search" type="search" placeholder="${browsing ? 'Search all ' : 'Search your '}${label}…" aria-label="Search ${label}" value="${esc(search)}">${browsing ? `<button data-action="browse-done" class="mw-primary">✓ Done</button>`
            : `<button data-action="browse" class="mw-primary">＋ Add ${label}</button>${kind === 'mood' ? `<select data-field="recipe" aria-label="Add a starter blend"><option value="">Starter blend…</option>${Object.keys(RECIPES).map(r => `<option>${r}</option>`).join('')}</select>` : ''}`}</div>
    ${browsing ? `<p class="mw-explainer">Everything available, your own options included. Tap ＋ or move a slider to put it on ${esc(whose)}’s list.${hideBody ? ' Body is left out while the Needs board covers it.' : ''}</p>` : ''}
    <datalist id="mw-cast-names">${[ch.name, playerName(), ...getCast(ch).map(p => p.name)].map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist>
    <datalist id="mw-hate-names">${getCast(ch).filter(p => who !== 'cast' || p.id !== selectedCast()?.id).map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
    ${!browsing && !cats && !turns ? `<p class="mw-explainer mw-empty-list">Nothing on ${esc(whose)}’s list yet. Tap “＋ Add ${label}” to pick from everything, or make your own below.</p>` : ''}
    <div class="mw-categories ${kind === 'turn' ? 'mw-turn-categories' : ''}">${cats}${turns}</div><p class="mw-no-results" hidden>Nothing matches.</p>
    ${browsing ? '' : customBlock(state, kind, whose)}`;
}
// ---- Scene reader card (Moodlets tab) ----
const SCOPES = [['mood', '✦', 'Moodlets'], ['body', '✚', 'Body'], ['trait', '❂', 'Traits'], ['wants', '☆', 'Wants']];
function readerBlock(state) {
    if (who === 'story') return '';
    const allProfiles = profiles(), profile = readerProfile(), scope = cleanScope(state.readScope), subject = readerSubject();
    const anyScope = SCOPES.some(([k]) => scope[k]);
    const est = subject && anyScope ? roughTokens(readerRequest(subject, scope).messages) : 0;
    const start = sceneStart(), chatLen = ctx().chat?.length ?? 0;
    return `<section class="mw-reader">
        <div class="mw-reader-head"><span class="mw-reader-icon">✧</span><div><b>Scene reader</b><small>Reads the latest messages and moves ${esc(subjectName())}’s sliders to match. Pinned ◆ ones stay put.</small></div></div>
        <div class="mw-scope" role="group" aria-label="What to read">${SCOPES.map(([k, icon, label]) => `<button type="button" class="mw-scope-chip" data-scope="${k}" aria-pressed="${scope[k]}">${icon} ${label}</button>`).join('')}</div>
        <div class="mw-reader-go"><button class="mw-primary mw-read" data-action="analyse" ${pending || !profile || !state.enabled || !anyScope ? 'disabled' : ''}>${pending ? 'Reading…' : '✧ Read the scene'}</button>${pending ? '<button data-action="cancel">Stop</button>' : `<button data-action="undo" ${!state.history?.length ? 'disabled' : ''} title="Undo the last read">↶ Undo</button>`}</div>
        <p class="mw-reader-meta">Last ${settings().sceneMessages} messages${start ? ' since your scene marker' : ''} · about ${fmtTokens(est)} tokens a read${scope.trait ? ' · traits roughly double it' : ''}</p>
        ${!profile ? '<p class="mw-fine mw-warn">Pick a connection for the reader below. A small, cheap model does the job.</p>' : ''}
        <details class="mw-tuning" data-reader-tuning ${!profile ? 'open' : ''}><summary>Reader settings</summary>
            <label>Connection<select data-reader="profile"><option value="">Choose a connection profile…</option>${profile && !allProfiles.some(p => p.id === profile) ? `<option selected value="${esc(profile)}">Unavailable profile, choose another</option>` : ''}${allProfiles.map(p => `<option value="${esc(p.id)}" ${p.id === profile ? 'selected' : ''}>${esc(p.name)} · ${esc(p.model)}</option>`).join('')}</select></label>
            <div class="mw-seg-label">Recent messages it reads</div>
            <div class="mw-seg" role="group" aria-label="Recent messages">${[4, 6, 10, 16].map(n => `<button type="button" data-reader-msgs="${n}" aria-pressed="${settings().sceneMessages === n}">${n}</button>`).join('')}</div>
            <div class="mw-scene-mark">${start && start < chatLen ? `<span>⟲ Scene starts at message ${start + 1} of ${chatLen}</span><button type="button" data-action="scene-clear">Remove</button>`
                : `<button type="button" data-action="scene-mark">⟲ New scene starts at the latest message</button>`}</div>
            <p class="mw-fine">Mark the start of a new scene and nothing older ever gets read, however long the chat is.</p>
            <label>Follow the read <output data-follow-out>${state.follow}%</output><input type="range" min="10" max="100" data-field="follow" value="${state.follow}" style="--mw-fill:${(state.follow - 10) / .9}%" aria-label="Follow the read"></label>
            <p class="mw-fine">100 sets sliders exactly to what the reader sees. Lower keeps some of what you had.</p>
            <label class="mw-inline">Fade feelings the scene stops showing by <input aria-label="Fade rate" type="number" min="0" max="20" data-field="decay" value="${state.decay}"> a read</label>
            ${who === 'char' ? `<label class="mw-toggle"><input type="checkbox" data-auto-read ${state.mode === 'dynamic' ? 'checked' : ''}> Read automatically before each reply</label>
            ${state.mode === 'dynamic' ? `<label class="mw-inline">Every <input aria-label="Read interval" type="number" min="1" max="10" data-field="interval" value="${state.interval}"> of your messages</label>` : ''}` : ''}
            <p class="mw-fine">Sends recent chat text${who === 'char' ? ' and a short card excerpt' : ''} to that connection. One extra request per read.</p>
        </details>
    </section>`;
}
// ---- Wants, goals & fears ----
const WANT_META = {
    want: ['☆', 'Wants', 'What they’re after right now', '#e5ca7f', 'e.g. get him to admit it'],
    goal: ['⚑', 'Goals', 'Bigger aims that play out over time', '#8fcebc', 'e.g. take over the family firm'],
    fear: ['☾', 'Fears', 'What they dread or avoid', '#b0a5e8', 'e.g. being left again'],
};
function wantRow(w) {
    return `<div class="mw-mood mw-want" data-want-row="${esc(w.id)}" data-filter-item="wants"><textarea class="mw-want-text" data-want-text="${esc(w.id)}" maxlength="120" rows="1" aria-label="${esc(w.kind)}">${esc(w.text)}</textarea>
        <div class="mw-want-controls"><input type="range" min="0" max="100" step="1" value="${w.value}" data-want-value="${esc(w.id)}" style="--mw-fill:${w.value}%" aria-label="How much it drives them">
        <span data-lvl>${level(w.value)}</span><output>${w.value}%</output>
        <button type="button" class="mw-list mw-tick" data-want-done="${esc(w.id)}" title="${w.kind === 'fear' ? 'Over it: stop sending' : 'Came true: stop sending'}" aria-label="Done">✓</button><button type="button" class="mw-list" data-want-remove="${esc(w.id)}" title="Delete" aria-label="Delete">×</button></div>
        ${w.read ? '<small class="mw-from-scene">✧ picked up from the scene</small>' : ''}</div>`;
}
function wantsView(state, ch) {
    const items = state.wants ?? [], name = subjectName(), done = items.filter(w => w.done);
    const intro = who === 'user' ? `What ${esc(name)} is after and afraid of. ${esc(ch.name)} doesn’t know these unless you show them, but the story gives you openings now and then and brushes up against your fears.`
        : `What drives ${esc(name)} underneath. These steer choices when the moment touches them and never get announced or recapped. Strength is how hard it pulls.`;
    return `<section class="mw-wants"><p class="mw-explainer">${intro}</p>
        ${WANT_KINDS.map(kind => {
            const [icon, title, sub, color, hint] = WANT_META[kind], list = items.filter(w => w.kind === kind && !w.done);
            return `<div class="mw-want-card" style="--mw-accent:${color}">
                <div class="mw-want-head"><span class="mw-want-icon">${icon}</span><div><b>${title}</b><small>${sub}</small></div>${list.length ? `<em>${list.length}</em>` : ''}</div>
                ${list.map(wantRow).join('') || `<p class="mw-want-empty">${kind === 'fear' ? 'Nothing scares them yet.' : kind === 'goal' ? 'No big plans yet.' : 'Nothing they’re after yet.'}</p>`}
                <div class="mw-cast-add mw-want-add"><input type="text" data-want-new="${kind}" maxlength="120" enterkeyhint="done" placeholder="${esc(hint)}" aria-label="New ${title.toLowerCase().slice(0, -1)}"><button type="button" data-action="want-add" data-kind="${kind}" aria-label="Add">＋</button></div></div>`;
        }).join('')}
        ${done.length ? `<details class="mw-want-done" data-want-done-list><summary>Came true or let go <small>${done.length}</small></summary>${done.map(w => `<div class="mw-done-row"><span>${WANT_META[w.kind][0]} ${esc(w.text)}</span><button type="button" class="mw-list" data-want-restore="${esc(w.id)}" title="Bring back">↺</button><button type="button" class="mw-list" data-want-remove="${esc(w.id)}" title="Delete">×</button></div>`).join('')}</details>` : ''}
        <p class="mw-fine mw-wants-tip">Tip: switch on ☆ Wants in the scene reader (Moods tab) and it’ll update strengths, tick off what came true and suggest new ones.</p>
    </section>`;
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

// Sims plumbob: two facets lit, two in shade.
const PLUMBOB = colour => `<svg class="mw-plumbob" style="--mw-plumbob:${colour}" viewBox="0 0 24 40" aria-hidden="true"><path d="M12 1 2 15h9z" opacity=".95"/><path d="M12 1l10 14h-11z" opacity=".7"/><path d="M2 15h9l1 24z" opacity=".55"/><path d="M11 15h11L12 39z" opacity=".35"/></svg>`;
function personCard(ch, state, live) {
    const person = who === 'cast' ? selectedCast() : null;
    const name = who === 'story' ? 'The story' : subjectName();
    const role = who === 'char' ? 'Main character' : who === 'user' ? 'Your character · you write them' : who === 'story' ? 'Genre, tropes and style for this chat' : `Side character · ${person?.inScene ? 'in this scene' : 'off scene'}`;
    const top = activeMoods(state).find(m => sectionOf(m) === 'mood');
    const boardState = who === 'char' && live?.state.length ? live.state.slice(0, 3).map(t => t.text).join(', ') : '';
    const feeling = who === 'story' ? '' : top ? `<span class="mw-feeling" style="--mw-accent:${top.color}">Feeling <b>${esc(tagLabel(top).toLowerCase())}</b> · ${level(state.moods[top.id]).toLowerCase()}</span>`
        : boardState ? `<span class="mw-feeling">Board says <b>${esc(boardState)}</b></span>` : '<span class="mw-feeling">No moodlets yet</span>';
    const canRead = who !== 'story' && readerProfile() && state.enabled;
    return `<div class="mw-person-card" style="--mw-accent:${top?.color ?? '#a8cdb1'}">
        <span class="mw-avatar mw-avatar-lg">${who === 'story' ? '❖' : esc(String(name).trim()[0]?.toUpperCase() ?? '?')}</span>
        <div class="mw-person-info"><b>${esc(name)}</b><small>${esc(role)}</small>${feeling}</div>
        <div class="mw-person-toggles"><label class="mw-toggle"><input type="checkbox" data-field="enabled" ${state.enabled ? 'checked' : ''}> ${who === 'char' ? 'On' : 'Send'}</label>
        ${person ? `<label class="mw-toggle"><input type="checkbox" data-field="castInScene" ${person.inScene ? 'checked' : ''}> In scene</label>` : ''}
        ${canRead ? `<button type="button" class="mw-quick-read" data-action="analyse" ${pending ? 'disabled' : ''} title="Read the scene now (settings in the Moods tab)">${pending ? '…' : '✧ Read'}</button>` : ''}</div>
    </div>
    ${person ? `<details class="mw-cast-edit mw-manage"><summary>Manage ${esc(person.name)} and the cast</summary>
        <div class="mw-cast-add"><input type="text" data-field="castName" maxlength="80" aria-label="Supporting character name" value="${esc(person.name)}"><button data-action="cast-remove">Remove</button></div>
        <div class="mw-actions"><button data-action="cast-default">Save cast for ${esc(ch.name)}</button>${settings().castDefaults[`char:${ch.avatar}`]?.length ? '<button data-action="cast-load">Load saved cast</button>' : ''}</div>
        <p class="mw-fine">The cast belongs to ${esc(ch.name)}’s chats. Saving it gives new ${esc(ch.name)} chats the same people, starting off scene. Rename by editing the name; relationships follow.</p></details>` : ''}
    ${castAction && castAction !== 'adding' ? `<div class="mw-cast-confirm" role="group" aria-label="Confirm cast change"><p class="mw-fine">${castAction === 'load' ? 'Replace this chat’s cast and its sliders with the saved version? Everyone will start off scene.' : `Remove ${esc(person?.name ?? '')} from this chat’s cast? The saved default will stay as it is.`}</p><div class="mw-actions"><button data-action="cast-${castAction}-confirm">${castAction === 'load' ? 'Load saved cast' : 'Remove'}</button><button data-action="cast-cancel">Cancel</button></div></div>` : ''}`;
}
// One sticky row of icon tabs: fits a phone screen and stays reachable while scrolling long lists.
// Needs is the live board; Facts is the old needs-and-facts list; personality types sit at the top of Traits.
const TABS = [['mood', '✦', 'Moods', '#b5d9a6'], ['needs', '◔', 'Needs', '#8fd18a'], ['trait', '❂', 'Traits', '#d6b58f'], ['turn', '⇋', 'Turn-ons', '#e0a3bb'],
    ['rel', '♡', 'Bonds', '#e8a7bb'], ['state', '⌂', 'Facts', '#9fc6c0'], ['inv', '❒', 'Items', '#c9b37e'], ['wants', '☆', 'Wants', '#e5ca7f']];
const tabBar = counts => `<nav class="mw-tabbar" role="tablist" aria-label="Section">${TABS.map(([k, icon, label, color]) =>
    `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}" aria-pressed="${tab === k}" style="--mw-tab:${color}"><span class="mw-tab-icon">${icon}</span><span class="mw-tab-label">${label}</span>${counts[k] ? `<i>${counts[k]}</i>` : ''}</button>`).join('')}</nav>`;
// ---- Settings sheet (⚙): what's sent, your library, defaults and limits ----
function libraryList() {
    const lib = settings().library;
    if (!lib.length) return '<p class="mw-fine">Nothing yet. Use “✎ Make your own” at the bottom of any tab, or ⇪ on a one-off row.</p>';
    const groupName = id => { const c = CATEGORIES.find(row => row[0] === id); if (c) return `${c[2]} ${c[1]}`; const t = TURN_CATEGORIES.find(([g]) => turnGroupKey(g) === id); return t ? `${t[1]} Turn-ons · ${t[0]}` : id; };
    return `<input type="search" data-filter-list="library" placeholder="Find one of yours…" aria-label="Search your library"><div class="mw-lib-list">${lib.map(e => `<div class="mw-lib-row" data-filter-item="library"><div><b>${esc(e.label)}${e.dark ? ' <em>☠</em>' : ''}</b><small>${esc(groupName(e.group))}</small></div>${editButton(e.id, e.label)}</div>`).join('')}</div><p class="mw-fine" data-filter-empty="library" hidden>No matches.</p>`;
}
function settingsView(state) {
    const whose = who === 'user' ? playerName() : who === 'story' ? 'the story' : subjectName();
    return `<section class="mw-settings">
        <div class="mw-settings-head"><button type="button" class="mw-back" data-action="settings-close">‹ Back</button><b>Settings</b><small>${esc(whose)}</small></div>
        <details class="mw-advanced" data-settings="sent" open><summary>What is sent to the model</summary>
            <p class="mw-fine">Moodweaver’s own note only. Your card, preset, lore and chat history get sent too.</p>
            <label class="mw-toggle"><input type="checkbox" data-field="sceneBreathing" ${state.sceneBreathing !== false ? 'checked' : ''}> Tell it to keep scenes moving</label>
            <div data-token-count class="mw-token-count"></div><p data-budget-warning class="mw-fine" hidden></p><pre data-audit></pre>
            <b class="mw-pre-label">Ready to send</b><pre data-preview></pre>
            <b class="mw-pre-label">Last reply</b><pre data-last-prompt></pre></details>
        <details class="mw-advanced" data-settings="board"><summary>Info board</summary>
            <p class="mw-fine">Every chat follows these until you flip its own switch on the Needs tab.</p>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardSend" ${settings().boardSend ? 'checked' : ''}> Send the board prompt</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardPresent" ${settings().boardPresent ? 'checked' : ''}> Present line moves the cast in and out</label>
            <p class="mw-fine">With the prompt on, delete INFO BOARD from your preset so it isn’t sent twice. The HTML is identical, so your regex keeps working.</p></details>
        <details class="mw-advanced" data-settings="library"><summary>Your library <small>${settings().library.length} options</small></summary>${libraryList()}</details>
        <details class="mw-advanced" data-settings="defaults"><summary>Defaults for new chats</summary>
            <p class="mw-fine">Each chat keeps its own settings. Saving a default seeds ${esc(whose)}’s future chats; existing chats stay as they are.</p>
            <div class="mw-actions"><button data-action="baseline">${who === 'cast' ? 'Save the whole cast' : who === 'user' ? 'Save persona default' : who === 'story' ? 'Save story default' : 'Save character default'}</button><button data-action="reset">Clear unpinned moodlets</button></div></details>
        <details class="mw-advanced" data-settings="limits"><summary>Prompt & reader limits</summary>
            <label>Token target <input type="number" data-setting="tokenBudget" min="160" max="3000" value="${settings().tokenBudget}"></label>
            <label>Depth from the end <input type="number" data-setting="depth" min="0" max="10" step="1" value="${settings().depth}"></label>
            <p class="mw-fine">The target only warns; nothing is cut. Depth 0 puts the note after your latest message (best); 1 puts it before.</p>
            <label>Reader text cap <input type="number" data-setting="sceneChars" min="2000" max="40000" step="1000" value="${settings().sceneChars}"></label>
            <label>Reader reply cap <input type="number" data-setting="outputTokens" min="300" max="4000" step="100" value="${settings().outputTokens}"></label>
            <p class="mw-fine">Text cap is in characters. Raise the reply cap if a thinking model runs out before it answers.</p></details>
    </section>`;
}
// What "Clear all" touches: this tab's sliders, pins, because-notes and own rows. Nothing else.
function clearSection(s, kind) {
    if (kind === 'turn') { s.prefs = {}; return; }
    const causes = { ...s.causes };
    for (const m of MOODS) if (sectionOf(m) === kind) { s.moods[m.id] = 0; s.pins[m.id] = false; delete causes[m.id]; }
    s.causes = causes;
    for (const r of s.custom ?? []) if (r.kind === kind) { r.value = 0; r.cause = ''; }
    if (kind === 'mood') s.reason = '';
}
const sectionCount = (s, kind) => kind === 'turn' ? Object.values(s.prefs ?? {}).filter(Boolean).length
    : MOODS.filter(m => s.moods[m.id] > 0 && sectionOf(m) === kind).length + (s.custom ?? []).filter(r => r.kind === kind && r.value > 0).length;
function typesBlock(state, ch) {
    const types = activePersonalities(state);
    return `<details class="mw-types" data-types><summary><span class="mw-category-icon">◈</span><span>Personality type</span><small>${types.length ? types.map(p => p.system === 'enneagram' ? `${p.type}${p.wing ? `w${p.wing}` : ''}` : p.type).join(' · ') : 'none'}</small></summary>
        ${personalityView({ state, isPlayer: who === 'user', focus: ch.name, knowledge: getKnowledge(ch) })}</details>`;
}
function sectionContent(state, kind, ch, active) {
    const shown = kind === 'turn' ? [] : active.filter(m => sectionOf(m) === kind && m.category !== 'relationship');
    const turnsSet = kind === 'turn' ? Object.entries(state.prefs ?? {}).filter(([id, v]) => v && TURN_BY_ID[id]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])) : [];
    const whose = who === 'story' ? 'the story' : subjectName();
    const heading = { mood: 'Active moodlets', trait: 'Who they are', turn: 'Turn-ons & turn-offs', state: 'Facts', story: 'The story so far' }[kind];
    const empty = { mood: 'Nothing set. Start with a starter blend, move a slider or read the scene.', trait: 'Nothing set yet. Kinks, roles, temperament and morals go here.', turn: 'Nothing set yet. What they like or can’t stand in other people goes here.', state: 'Nothing set. Looks, background, job and the scene go here.', story: 'No genre or style set for this chat yet.' }[kind];
    const onHere = sectionCount(state, kind), what = { mood: 'moodlets', trait: 'traits', turn: 'turn-ons', state: 'facts', story: 'story settings' }[kind];
    const chips = turnsSet.map(([id, v]) => `<button data-jump="turn:${id}" class="mw-chip mw-chip-turn ${v < 0 ? 'is-off' : ''}" style="--mw-accent:${TURN_BY_ID[id].color}" title="Adjust ${esc(TURN_BY_ID[id].label)}"><span>${v > 0 ? '♡' : '✕'} ${esc(TURN_BY_ID[id].label)}</span><b>${Math.abs(v)}</b><i style="width:${Math.abs(v)}%"></i></button>`).join('')
        + shown.map(m => `<button data-jump="${m.id}" class="mw-chip" style="--mw-accent:${m.color}" title="Adjust ${esc(m.label)}"><span>${state.pins[m.id] ? '◆ ' : ''}${esc(tagLabel(m))}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`).join('');
    const explainer = who === 'user' && kind === 'turn' ? `What ${esc(playerName())} likes or can’t stand in other people. The story works these in now and then; ${esc(ch.name)} only learns them from how you react.`
        : kind === 'turn' ? `What ${esc(whose)} likes or can’t stand in <em>other people</em>. Slide right for a turn-on, left for a turn-off.`
        : who === 'user' && ['mood', 'trait'].includes(kind) ? `How ${esc(playerName())} comes across. ${esc(ch.name)} reacts to it but never writes for you. Choose what ${esc(ch.name)} knows below.`
        : kind === 'trait' ? `Who ${esc(whose)} is underneath. Traits stay put unless you switch on ❂ Traits in the scene reader.` : '';
    return `<div class="mw-summary"><div class="mw-section-label">${shown.length || turnsSet.length ? heading : 'A clean slate'}<span>${shown.length + turnsSet.length} on${onHere ? ` · <button class="mw-clear" data-action="clear" title="Turn off this tab’s ${what}, pins too. Other tabs stay as they are">Clear ${what}</button>` : ''}</span></div>
        <div class="mw-chips">${chips || `<p>${empty}</p>`}</div>
        ${kind === 'mood' && state.reason ? `<div class="mw-observation">✧ ${esc(state.reason)}<small>Last scene read · ${esc(new Date(state.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</small></div>` : ''}</div>
    ${kind === 'mood' ? readerBlock(state) : ''}
    ${explainer ? `<p class="mw-explainer">${explainer}</p>` : ''}
    ${kind === 'trait' ? typesBlock(state, ch) : ''}
    ${['mood', 'trait'].includes(kind) && who === 'user' ? knowledgePanel(state, ch) : ''}
    ${catalogueBlock(state, kind, ch, whose)}`;
}
function render() {
    if (!panel) return;
    capturePanel(panel);
    const ch = target(), charState = getState(ch);
    if (charState) migratePairs(ch);
    if (who === 'cast' && !selectedCast()) who = 'char';
    const state = charState ? viewState() : null;
    if (who === 'story') tab = 'mood';
    if (tab === 'personality') tab = 'trait';
    const kind = who === 'story' ? 'story' : ['state', 'trait', 'turn'].includes(tab) ? tab : 'mood';
    const active = state ? activeMoods(state) : [];
    const live = charState ? liveFor(ch) : null;
    const relationshipCount = state && who !== 'story' ? peers().reduce((n, p) => n + (p.relation?.enabled !== false && p.relation ? activeRelationshipTags(p.relation).length : 0) + (p.pair ? activeSharedTags(p.pair).length : 0), 0) : 0;
    const counts = { mood: active.filter(m => sectionOf(m) === 'mood').length, trait: active.filter(m => sectionOf(m) === 'trait').length + activePersonalities(state).length, turn: Object.values(state?.prefs ?? {}).filter(Boolean).length,
        rel: relationshipCount, state: active.filter(m => m.kind === 'state' && sectionOf(m) === 'state').length,
        needs: live?.needs.filter(n => n.known && n.value <= 35).length ?? 0,
        inv: (state?.inventory ?? []).filter(i => i.carried).length, wants: (state?.wants ?? []).filter(w => !w.done && w.value > 0).length };
    const peer = state && who !== 'story' ? currentPeer() : null;
    const view = JSON.stringify([identity(ch), who, who === 'cast' ? selectedCast()?.id : '', settingsOpen ? 'settings' : tab, browsing, tab === 'rel' ? peer?.key : '', tab === 'rel' ? pairView : '']);
    const snapshot = savedPanel(view), sameView = panel.dataset.view === view;
    search = snapshot?.searches['#mw-catalogue-search'] ?? '';
    panel.dataset.view = view;
    // The plumbob takes the lead moodlet's colour, or the board's mood when nothing is set by hand.
    const lead = active.find(m => sectionOf(m) === 'mood');
    const boardMood = live?.state.map(t => matchMood(t.text)).find(m => m && m.kind === 'mood');
    const plumbob = lead?.color ?? boardMood?.color ?? '#b5d9a6';
    const body = settingsOpen ? settingsView(state)
        : `${personCard(ch, state, live)}${who === 'story' ? '' : tabBar(counts)}
        ${who !== 'story' && tab === 'inv' ? inventoryView(state, ch)
        : who !== 'story' && tab === 'needs' ? boardView({ live, send: boardSend(), sync: settings().boardPresent, charName: ch.name, userName: playerName(), people: boardPeople(ch), editing: boardEditing, focus: boardFocus })
        : who !== 'story' && tab === 'wants' ? wantsView(state, ch)
        : who !== 'story' && tab === 'rel' ? relationshipView({ subject: subjectName(), peers: peers(), selectedKey: peer?.key, relation: peer?.relation, pair: peer?.pair, view: pairView, selfKey: personKeyOfSubject(), otherKey: peer ? keyForTarget(peer.key) : '', knowledge: getKnowledge(ch), isPlayer: who === 'user', focus: ch.name, openGroups: openRelationGroups, swapLabel: peer && swapTarget(peer) ? `${peer.name}’s side` : '', removing: removingRelation })
        : sectionContent(state, kind, ch, active)}`;
    const where = live?.found ? [live.time, live.location.split(',')[0]].filter(Boolean).join(' · ') : '';
    panel.innerHTML = `<div class="mw-top" data-sky="${live?.sky.time ?? ''}" data-weather="${live?.sky.weather ?? ''}"><div class="mw-brand">${PLUMBOB(plumbob)}<div class="mw-brand-text"><h2>Moodweaver</h2>${where ? `<small class="mw-where-now">${esc(where)}</small>` : ''}</div></div>
        <div class="mw-top-actions"><button type="button" class="mw-icon-btn" data-action="${settingsOpen ? 'settings-close' : 'settings'}" aria-pressed="${settingsOpen}" aria-label="Settings and what’s sent" title="Settings and what’s sent">⚙</button><button type="button" class="mw-close" data-action="close" aria-label="Close Moodweaver">×</button></div></div>
    ${!charState ? '<div class="mw-empty">Open a character chat to start weaving a mood.</div>' : `
    ${members().length > 1 ? `<div class="mw-context"><label>Group chat · main character<select data-field="character" aria-label="Main character">${members().map(m => `<option value="${esc(m.avatar)}" ${m.avatar === ch.avatar ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label></div>` : ''}
    ${peopleBar(ch)}
    ${state ? body : ''}`}
    <div data-status role="status" class="mw-status">${esc(status)}</div><div class="mw-footer"><span data-token-mini></span>Small shifts. Complicated feelings. · v${VERSION}</div><button class="mw-to-top" data-action="top" aria-label="Back to top" title="Back to top" hidden>↑</button>`;
    restorePanelFields(panel, snapshot);
    filterRows(); filterRelationships(panel.querySelector('[data-relation-search]')?.value ?? ''); filterLocalLists(); filterPersonality(panel);
    renderPreview(); restorePanelPosition(panel, snapshot, sameView); toggleTop();
}
function toggleTop() { const b = panel?.querySelector('.mw-to-top'); if (b) b.hidden = panel.scrollTop < 500; }
function showGroupMatches(group, count, term) {
    const badge = group.querySelector('summary small');
    if (!badge) return;
    badge.dataset.unfiltered ??= badge.textContent;
    badge.textContent = term ? `${count} ${count === 1 ? 'match' : 'matches'}` : badge.dataset.unfiltered;
}
function filterRelationships(value) {
    const term = value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let shown = 0;
    panel.querySelectorAll('[data-relation-group]').forEach(group => {
        let visible = 0;
        group.querySelectorAll('[data-relation-row]').forEach(row => { row.hidden = !searchText(row).includes(term); if (!row.hidden) visible++; });
        group.hidden = !visible; shown += visible;
        showGroupMatches(group, visible, term);
    });
    const none = panel.querySelector('[data-relation-empty]'); if (none) none.hidden = shown > 0;
}
const searchText = row => [row.textContent, row.dataset.aliases ?? '', row.dataset.search ?? '', ...[...row.querySelectorAll('input[type="text"]')].map(i => i.value)].join(' ').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function filterLocalLists() {
    panel.querySelectorAll('[data-filter-list]').forEach(input => {
        const key = input.dataset.filterList, term = input.value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        let count = 0;
        panel.querySelectorAll(`[data-filter-item="${key}"]`).forEach(row => { row.hidden = !searchText(row).includes(term); if (!row.hidden) count++; });
        const none = panel.querySelector(`[data-filter-empty="${key}"]`); if (none) none.hidden = count > 0;
    });
}
function filterRows() {
    const term = search.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let shown = 0;
    panel.querySelectorAll('[data-category]').forEach(d => {
        let count = 0;
        d.querySelectorAll('[data-mood]').forEach(row => {
            row.hidden = !searchText(row).includes(term); if (!row.hidden) count++;
        });
        const inTab = who === 'story' ? d.dataset.kind === 'story' : d.dataset.kind !== 'story' && d.dataset.kind === tab;
        d.hidden = count === 0 || !inTab; if (inTab) shown += count;
        // While searching, open groups with matches so results are one tap away; fold them back after.
        const key = d.dataset.category;
        if (term && count && inTab && !d.open) { d.open = true; autoOpened.add(key); }
        else if (!term && autoOpened.has(key)) { d.open = false; autoOpened.delete(key); }
        showGroupMatches(d, count, term);
    });
    panel.querySelectorAll('[data-custom-row]').forEach(row => { row.hidden = !searchText(row).includes(term); if (!row.hidden) shown++; });
    const none = panel.querySelector('.mw-no-results'); if (none) none.hidden = shown > 0 || !term;
}
async function changeState(mutator) {
    const s = viewState(); if (!s) return;
    mutator(s); await persist(s); await syncPrompt(); render();
}
function openPanel() {
    if (suspended) return;
    render(); if (!panel.open) { panel.show(); panel.focus({ preventScroll: true }); } void syncPrompt();
}
function setup() {
    if (document.getElementById('moodweaver-panel')) return;
    settings();
    panel = document.createElement('dialog'); panel.id = 'moodweaver-panel'; panel.className = 'mw-panel'; panel.tabIndex = -1;
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
        if (e.target.hasAttribute('data-filter-list')) { filterLocalLists(); return; }
        if (e.target.dataset.maker && maker) {
            const f = e.target.dataset.maker; maker.draft[f] = f === 'dark' ? e.target.checked : e.target.value;
            if (f === 'group') lastGroup[maker.kind] = e.target.value;
            const q = panel.querySelector('[data-maker-preview]'); if (q) q.textContent = makerPreview(makerDraft()); return;
        }
        if (e.target.dataset.wantValue !== undefined || e.target.dataset.field === 'follow') {
            const v = Number(e.target.value), row = e.target.closest('.mw-mood');
            if (row) { row.querySelector('output').textContent = `${v}%`; row.querySelector('[data-lvl]').textContent = level(v); e.target.style.setProperty('--mw-fill', `${v}%`); }
            else { panel.querySelector('[data-follow-out]').textContent = `${v}%`; e.target.style.setProperty('--mw-fill', `${(v - 10) / .9}%`); }
            return;
        }
        if (e.target.dataset.need) {
            const id = e.target.dataset.need, v = Number(e.target.value), word = id === 'horny' ? level(v) : needWord(v);
            const label = panel.querySelector(`[data-need-word="${id}"]`); if (label) label.textContent = word;
            e.target.style.setProperty('--mw-fill', `${v}%`); e.target.setAttribute('aria-valuetext', word);
            e.target.closest('.mw-need')?.style.setProperty('--mw-need', v <= 15 ? '#e46a6a' : v <= 35 ? '#e79a5c' : v <= 65 ? '#dfc56c' : '#8fd18a');
            return;
        }
        if (['mw-type-search', 'mw-enneagram-search'].includes(e.target.id)) { filterPersonality(panel); return; }
        if (e.target.dataset.personality === 'strength') {
            const v = Number(e.target.value), row = e.target.closest('.mw-mood');
            row.querySelector('output').textContent = `${v}%`; row.querySelector('[data-lvl]').textContent = level(v);
            e.target.style.setProperty('--mw-fill', `${v}%`); e.target.setAttribute('aria-valuetext', `${v} percent, ${level(v)}`); return;
        }
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
        if (sourceId && who === 'user' && (BY_ID[sourceId] || ['personality', 'enneagram'].includes(sourceId))) {
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
    panel.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.hasAttribute('data-inv-new')) { e.preventDefault(); panel.querySelector('[data-action="inv-add"]')?.click(); }
        if (e.key === 'Enter' && e.target.dataset.wantNew) { e.preventDefault(); panel.querySelector(`[data-action="want-add"][data-kind="${e.target.dataset.wantNew}"]`)?.click(); }
        if (e.key === 'Enter' && e.target.dataset.maker === 'label') { e.preventDefault(); panel.querySelector('[data-maker="cue"]')?.focus(); }
        if (e.key === 'Enter' && (e.target.dataset.boardAdd || e.target.dataset.boardField)) { e.preventDefault(); e.target.blur(); }
    });
    panel.addEventListener('change', async e => {
        const input = e.target;
        if (input.dataset.maker) return; // drafts live in memory until saved
        if (input.dataset.need) { const id = input.dataset.need, v = Number(input.value); await editBoard(b => { b.needs[id] = v; }); return; }
        if (input.hasAttribute('data-board-send')) { await editBoard(b => { b.send = input.checked; }); return; }
        if (input.hasAttribute('data-board-sync')) { settings().boardPresent = input.checked; ctx().saveSettingsDebounced(); render(); return; }
        if (input.dataset.boardAdd) {
            const kind = input.dataset.boardAdd, t = input.value.replace(/\s+/g, ' ').trim().slice(0, 60); if (!t || !['state', 'physical'].includes(kind)) return;
            await editBoard(b => { b.keep[kind] = [...b.keep[kind], t]; b.mute[kind] = b.mute[kind].filter(x => x.toLowerCase() !== t.toLowerCase()); }); return;
        }
        if (input.dataset.boardField && EDIT_FIELDS.includes(input.dataset.boardField)) {
            const key = input.dataset.boardField, value = input.value.replace(/\s+/g, ' ').trim().slice(0, 200);
            const raw = liveBoard(latestBoard(ctx().chat), {}, { char: target()?.name ?? '', user: playerName() });
            const own = key === 'date' ? raw.day : raw[key] ?? '';
            await editBoard(b => { if (!value || value === own) delete b.pins[key]; else b.pins[key] = value; }); return;
        }
        if (input.dataset.settingBool) { settings()[input.dataset.settingBool] = input.checked; ctx().saveSettingsDebounced(); await syncPrompt(); render(); return; }
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
        if (input.dataset.relKnowledge && who === 'user' && RELATIONSHIP_BY_ID[input.dataset.relKnowledge]) {
            const relation = selectedRelation(); if (!relation) return;
            const knowledge = getKnowledge(target(), true), key = relationshipKey(relation, input.dataset.relKnowledge);
            if (input.value === 'scene') delete knowledge[key]; else knowledge[key] = knowledgeEntry({ ...knowledge[key], mode: input.value });
            await persist(); await syncPrompt(); render(); return;
        }
        if (input.dataset.target) return;
        const knowledgeId = input.dataset.knowledge || input.dataset.knowledgeSource;
        if (knowledgeId && who === 'user' && (['personality', 'enneagram'].includes(knowledgeId) || BY_ID[knowledgeId] && BY_ID[knowledgeId].kind !== 'story')) {
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
            if (field === 'follow') s[field] = clamp(s[field], 10, 100);
        });
    });
    panel.addEventListener('click', async e => {
        const summary = e.target.closest('summary');
        if (summary?.parentElement.matches('details')) rememberGroupChoice(panel, summary.parentElement);
        const button = e.target.closest('button'); if (!button) return;
        if (button.dataset.who) {
            if (button.closest('.mw-board')) tab = 'mood';
            who = button.dataset.who; browsing = false; maker = null; settingsOpen = false; boardFocus = ''; if (button.dataset.castId) selectedCastId = button.dataset.castId;
            selectedPeer = ''; removingRelation = ''; castAction = ''; status = ''; render(); return;
        }
        if (button.dataset.boardTile) { boardFocus = boardFocus === button.dataset.boardTile ? '' : button.dataset.boardTile; render(); return; }
        if (button.dataset.boardKeep || button.dataset.boardCut) {
            const kind = button.dataset.boardKeep || button.dataset.boardCut, text = boardFocus.slice(boardFocus.indexOf(':') + 1), same = x => x.toLowerCase() === text.toLowerCase();
            if (!text || !['state', 'physical'].includes(kind)) return;
            const keep = Boolean(button.dataset.boardKeep);
            if (!keep) boardFocus = '';
            await editBoard(b => {
                const kept = b.keep[kind].some(same);
                if (keep) b.keep[kind] = kept ? b.keep[kind].filter(x => !same(x)) : [...b.keep[kind], text];
                else { b.keep[kind] = b.keep[kind].filter(x => !same(x)); if (String(liveFor().board?.[kind] ?? '').toLowerCase().includes(text.toLowerCase())) b.mute[kind] = [...b.mute[kind], text]; }
            }); return;
        }
        if (button.hasAttribute('data-board-promote')) {
            const text = boardFocus.slice(boardFocus.indexOf(':') + 1).slice(0, 100), main = getState(); if (!text || !main) return;
            if (!main.custom.some(r => r.kind === 'mood' && r.text.toLowerCase() === text.toLowerCase())) main.custom.push({ id: newId(), kind: 'mood', text, value: 60, cause: '' });
            boardFocus = ''; status = `“${text}” is now one of ${target().name}’s moodlets (Moods tab, under Just for ${target().name}).`;
            await persist(main); await syncPrompt(); render(); return;
        }
        if (button.dataset.boardUnpin) { const key = button.dataset.boardUnpin; await editBoard(b => { delete b.pins[key]; }); return; }
        if (button.dataset.needUnpin) { const id = button.dataset.needUnpin; await editBoard(b => { delete b.needs[id]; }); return; }
        if (button.dataset.boardAddcast) {
            try {
                const person = addCastMember(getCast(), button.dataset.boardAddcast, newCastId(), [playerName(), ...members().map(ch => ch.name)]);
                status = `${person.name} added to the cast, in this scene.`; await persist(); await syncPrompt(); render();
            } catch (error) { status = error.message; renderStatus(); }
            return;
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
        if (button.dataset.invRemove) { const id = button.dataset.invRemove; await changeState(s => { s.inventory = (s.inventory ?? []).filter(i => i.id !== id); }); return; }
        if (button.dataset.customRemove) { const id = button.dataset.customRemove; await changeState(s => { s.custom = s.custom.filter(r => r.id !== id); }); return; }
        if (button.dataset.memRemove) {
            const pair = currentPeer()?.pair; if (!pair) return;
            pair.memories = (pair.memories ?? []).filter(m => m.id !== button.dataset.memRemove); await persist(); await syncPrompt(); render(); return;
        }
        if (button.dataset.mode) { await changeState(s => { s.mode = button.dataset.mode; }); return; }
        if (button.dataset.wing !== undefined) { await changeState(s => { s.enneagram = cleanEnneagram({ ...cleanEnneagram(s.enneagram), wing: button.dataset.wing }); }); return; }
        if (button.dataset.scope) { const k = button.dataset.scope; await changeState(s => { s.readScope = cleanScope({ ...s.readScope, [k]: !cleanScope(s.readScope)[k] }); }); return; }
        if (button.dataset.readerMsgs) { settings().sceneMessages = Number(button.dataset.readerMsgs); ctx().saveSettingsDebounced(); render(); return; }
        if (button.dataset.libEdit) {
            const entry = libraryEntry(button.dataset.libEdit); if (!entry) return;
            const m = BY_ID[entry.id], kindOf = isTurnGroup(entry.group) ? 'turn' : sectionOf(m);
            if (kindOf === 'story') who = 'story'; else { if (who === 'story') who = 'char'; tab = kindOf; }
            settingsOpen = false; browsing = false; openMaker(kindOf, { id: entry.id }); render();
            panel.querySelector('#mw-maker')?.scrollIntoView({ block: 'center' }); return;
        }
        if (button.dataset.ownPromote) { openMaker(who === 'story' ? 'story' : tab, { fromOwn: button.dataset.ownPromote }); render(); panel.querySelector('#mw-maker')?.scrollIntoView({ block: 'center' }); return; }
        if (button.dataset.wantDone || button.dataset.wantRestore) {
            const id = button.dataset.wantDone || button.dataset.wantRestore;
            await changeState(s => { const w = s.wants.find(x => x.id === id); if (w) w.done = Boolean(button.dataset.wantDone); }); return;
        }
        if (button.dataset.wantRemove) { const id = button.dataset.wantRemove; await changeState(s => { s.wants = s.wants.filter(w => w.id !== id); }); return; }
        if (button.dataset.tab) { tab = button.dataset.tab; search = ''; browsing = false; removingRelation = ''; maker = null; render(); return; }
        if (button.dataset.pin) { await changeState(s => { s.pins[button.dataset.pin] = !s.pins[button.dataset.pin]; }); return; }
        if (button.dataset.jump) {
            clearPanelSearch(panel, '.mw-search'); search = ''; if (who !== 'story') tab = button.dataset.jump.startsWith('turn:') ? 'turn' : sectionOf(BY_ID[button.dataset.jump]); render();
            const row = panel.querySelector(`[data-mood="${button.dataset.jump}"]`), category = row.closest('details');
            category.open = true; row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.querySelector('input').focus(); return;
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
            case 'settings': settingsOpen = true; maker = null; render(); panel.scrollTo({ top: 0 }); break;
            case 'board-edit': boardEditing = true; boardFocus = ''; render(); panel.querySelector('[data-board-field]')?.scrollIntoView({ block: 'center' }); break;
            case 'board-edit-done': boardEditing = false; render(); break;
            case 'settings-close': settingsOpen = false; render(); break;
            case 'maker-open': openMaker(button.dataset.kind); render(); panel.querySelector('[data-maker="label"]')?.focus(); break;
            case 'maker-cancel': maker = null; render(); break;
            case 'maker-save': {
                const d = makerDraft(); if (!maker) break;
                if (!d.label) { status = 'Give it a name first.'; renderStatus(); panel.querySelector('[data-maker="label"]')?.focus(); break; }
                const lib = settings().library, editing = maker.id, id = editing || newLibraryId();
                if (!editing && lib.some(e => e.label.toLowerCase() === d.label.toLowerCase() && e.group === d.group)) { status = 'You already have one with that name in that section.'; renderStatus(); break; }
                settings().library = cleanLibrary(editing ? lib.map(e => e.id === id ? { ...e, ...d, id } : e) : [...lib, { id, ...d }]);
                settings(); ctx().saveSettingsDebounced(); lastGroup[maker.kind] = d.group;
                const fromOwn = maker.fromOwn; maker = null;
                if (!editing) await changeState(s => {
                    const own = fromOwn ? s.custom.find(r => r.id === fromOwn) : null, value = own?.value || 50;
                    if (isTurnGroup(d.group)) { s.prefs = { ...s.prefs, [id]: value }; s.loadout.push(`turn:${id}`); }
                    else { s.moods[id] = value; s.loadout.push(id); if (own?.cause) s.causes = { ...s.causes, [id]: own.cause }; }
                    if (own) s.custom = s.custom.filter(r => r !== own);
                });
                status = editing ? `“${d.label}” updated everywhere.` : `“${d.label}” saved to your library and switched on here.`;
                await syncPrompt(); render();
                const saved = panel.querySelector(`[data-mood="${isTurnGroup(d.group) ? `turn:${id}` : id}"]`);
                if (saved) { saved.closest('details').open = true; saved.scrollIntoView({ block: 'center' }); }
                break;
            }
            case 'maker-once': {
                const d = makerDraft(), kind = maker?.kind; if (!kind) break;
                if (!d.label) { status = 'Give it a name first.'; renderStatus(); break; }
                maker = null;
                await changeState(s => { s.custom.push({ id: newId(), kind, text: (d.cue ? `${d.label}: ${d.cue}` : d.label).slice(0, 100), value: 50, cause: '' }); }); break;
            }
            case 'maker-delete': {
                const entry = maker?.id && libraryEntry(maker.id); if (!entry) break;
                if (!confirm(`Delete “${entry.label}” from your library? It disappears from every character.`)) break;
                settings().library = cleanLibrary(settings().library.filter(e => e.id !== entry.id)); settings(); ctx().saveSettingsDebounced();
                maker = null; status = `“${entry.label}” deleted.`; await syncPrompt(); render(); break;
            }
            case 'want-add': {
                const kind = button.dataset.kind, field = panel.querySelector(`[data-want-new="${kind}"]`);
                const t = field?.value.replace(/\s+/g, ' ').trim().slice(0, 120); if (!t || !WANT_KINDS.includes(kind)) break;
                await changeState(s => { s.wants = cleanWants([...s.wants, { id: newId(), kind, text: t, value: 50 }]); });
                panel.querySelector(`[data-want-new="${kind}"]`)?.focus(); break;
            }
            case 'scene-mark': { const meta = ctx().chatMetadata[KEY]; if (!meta) break; meta.sceneStart = Math.max(0, ctx().chat.length - 1); status = 'New scene marked. The reader ignores everything before it.'; await persist(); render(); break; }
            case 'scene-clear': { const meta = ctx().chatMetadata[KEY]; if (meta) delete meta.sceneStart; await persist(); render(); break; }
            case 'browse': browsing = true; maker = null; search = ''; render(); panel.querySelector('.mw-search')?.focus(); break;
            case 'browse-done': browsing = false; search = ''; render(); break;
            case 'inv-add': {
                const t = panel.querySelector('[data-inv-new]')?.value.replace(/\s+/g, ' ').trim().slice(0, 60); if (!t) break;
                await changeState(s => { (s.inventory ??= []).push({ id: newId(), text: t, note: '', carried: true }); });
                panel.querySelector('[data-inv-new]')?.focus(); break;
            }
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
            case 'analyse': await analyse(true); break;
            case 'clear': {
                const whose = who === 'user' ? `${playerName()}’s` : who === 'story' ? 'the story’s' : `${who === 'cast' ? selectedCast()?.name : target()?.name}’s`;
                const kind = who === 'story' ? 'story' : ['trait', 'turn', 'state'].includes(tab) ? tab : 'mood';
                const what = { mood: 'moodlets', trait: 'traits', turn: 'turn-ons and turn-offs', state: 'facts', story: 'story settings' }[kind];
                if (!confirm(`Clear ${whose} ${what}? Their sliders go to 0 and pins come off. Everything in the other tabs stays, and the list stays so you can set a new scene quickly.`)) break;
                await changeState(s => clearSection(s, kind)); break;
            }
            case 'reset': await changeState(s => { for (const m of MOODS) if (sectionOf(m) === 'mood' && !s.pins[m.id]) s.moods[m.id] = 0; s.reason = ''; }); break;
            case 'undo': await changeState(s => {
                const previous = s.history.pop(); if (!previous) return;
                for (const m of MOODS) if (!s.pins[m.id]) s.moods[m.id] = previous.moods[m.id] ?? 0;
                for (const r of previous.custom ?? []) { const row = s.custom.find(x => x.id === r.id); if (row) row.value = r.value; }
                if (previous.wants) s.wants = cleanWants(previous.wants);
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
        cancelAnalysis(); selectedAvatar = ''; selectedCastId = ''; selectedPeer = ''; removingRelation = ''; castAction = ''; status = ''; boardEditing = false; boardFocus = '';
        ++promptVersion; c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        render(); void syncPrompt();
    });
    c.eventSource.on(c.eventTypes.GENERATION_STOPPED, cancelAnalysis);
    c.eventSource.on(c.eventTypes.GENERATION_ENDED, queueBoard);
    for (const event of ['MESSAGE_RECEIVED', 'CHARACTER_MESSAGE_RENDERED', 'MESSAGE_SWIPED', 'MESSAGE_EDITED', 'MESSAGE_UPDATED', 'MESSAGE_DELETED']) {
        if (c.eventTypes[event]) c.eventSource.on(c.eventTypes[event], queueBoard);
    }
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
