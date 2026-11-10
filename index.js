import { SKILL_CATEGORIES, SKILL_BY_ID, skillWord, skillsOf, litSkills, skillLines, cleanSkills, cleanAlways, cleanOwnSkills } from './skills.js';
import { analysed, KNOWLEDGE_MODES, knowledgeEntry, MERGED_SEARCH_NAMES, CATEGORIES, MOODS, BY_ID, TRAIT_CATEGORIES, sectionOf, RECIPES, STORY_RECIPES, activeMoods, freshState, extendCatalogue, migrateCatalogue, isExtended, shortName, level, escapeHtml as esc, clamp, budgetPrompt, parseAnalysis, applyAnalysis, sceneData, analysisMessages, fingerprint, cleanScope, cleanWants, WANT_KINDS } from './core.js';
import { latestBoard, liveBoard, cleanBoardMeta, boardPromptLines, namedIn, matchMood, needWord, EDIT_FIELDS, feelingsFromBoard, relationsFromBoard, feedValues, isNone, hasBoard, stripBoard, feelingId, relationId, parseBoard, boardKeyOf, NO_BOARD, fixActive } from './board.js';
import { boardView } from './board-ui.js';
import { cleanBond, setMeter, bondStanding, computeBond, turnIdFor, sparkTarget, sliderAxes, storedSteps, METERS, setDesire, cleanDesire, computeDesire, paceOf, dynamicRows, DYNAMIC_GROUPS } from './bond.js';
import { setOwnDynamics, cleanOwnDynamics, fill as fillDynamic } from './dynamics.js';
import { bondReadMessages, parseBondRead } from './bondread.js';
import { findPatterns } from './patterns.js';
import { MORE_PRESETS, MORE_METERS, cleanMore, setMore, meterWeaveNames, computeMore, saidMeters } from './meters.js';
import { findOverlaps, droppedIds } from './overlap.js';
import { setPronoun, guessPronoun, PRONOUN_CHOICES } from './pronouns.js';
import { cravingsFrom, findCombos, cleanCombos, COMBOS } from './reactive.js';
import { ON_PAGE } from './onpage.js';
import { bondView, bondMini } from './bond-ui.js';
import { parseWeave, hasWeave, stripWeave, weavePrompt, powerChange } from './weave.js';
import { weaveKey, effectiveChat, settle, track, untrack, diff } from './ledger.js';
import { MOOD_PACE, moodPaceOf, paceDelta, fadeStep } from './moodpace.js';
import { withNudges, PACE_SCALE } from './mood-meters.js';
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
const VERSION = '1.47.0';
// 1.35.2: which folder this copy runs from, so a second installed copy can be spotted and named.
const SELF = import.meta.url;
const folderOf = url => { try { return decodeURIComponent(new URL(url).pathname.split('/').slice(-2, -1)[0] || '?'); } catch { return '?'; } };
const defaults = { tokenBudget: 2000, depth: 0, placementVersion: 1, sceneMessages: 6, sceneChars: 8000, outputTokens: 800, baselines: {}, promptVersion: 5, library: [], readerProfile: '', boardSend: true, boardPresent: true, blendPlan: false, bondTrack: true, boardStrip: true, boardMemories: false, boardPins: false, boardWithWeave: true, needsDrift: true, needsSpeed: 'normal', needsSkips: true, needsFloor: true, youTrack: true, wantSuggest: true, showsMode: 'all', combosOn: true, cravingsOn: true, skillLookback: 1 };
let panel, selectedAvatar = '', selectedCastId = '', castAction = '', pending = null, promptVersion = 0, suspended = false;
let promptInfo = { prompt: '', tokens: 0, omitted: 0 }, status = '', search = '', tab = 'mood', who = 'char';
// UI-only: the settings sheet, and the "make your own" editor ({ kind, id? editing a library entry, fromOwn? promoting a one-off row }).
let settingsOpen = false, maker = null, appliedLibrary = null;
// Needs board UI: editing the scene text, and which tile's actions are open ('state:text').
let boardEditing = false, boardFocus = '', boardTimer = 0;
// 1.36.0: while a reply is being written, the note built for it stays put. Anything else that wants to
// redraw the note waits until the reply is done, so a late redraw can't swap in an older reading.
let generating = false, genTimer = 0, resyncAfter = false, renderLater = false;
const generationSnapshots = new Map();
let selectedPeer = '', removingRelation = '', pairView = 'mine', browsing = false;
const newId = () => Math.random().toString(36).slice(2, 10);
// Live slider readouts: if a redraw has replaced the row, there's simply nothing to update.
const put = (scope, selector, text) => { const el = scope?.querySelector(selector); if (el) el.textContent = text; };
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
            memories: (p.memories ?? []).filter(m => settings().boardMemories || !untouchedMemory(m)).map(m => ({ text: m.text, value: m.value, who: m.who === 'both' ? 'both' : nameForKey(m.who, ch, p.labels) })) }))
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
    // 1.34.0: Anthropic's Opus 5.5 guide says "think before answering" lines in chat apps add latency and
    // billed thinking without a clear quality gain, so blend planning starts off (it can be turned back on).
    if (saved.promptVersion < 5) { saved.blendPlan = false; saved.boardStrip ??= true; saved.promptVersion = 5; c.saveSettingsDebounced(); }
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
        outputTokens: clamp(c.extensionSettings[KEY].outputTokens ?? 800, 300, 16000),
        baselines: c.extensionSettings[KEY].baselines ?? {},
        castDefaults: c.extensionSettings[KEY].castDefaults ?? {},
        // 1.42.0: dynamics you've written, and the dynamics picked for each character's new chats.
        ownDynamics: (setOwnDynamics(saved.ownDynamics), cleanOwnDynamics(saved.ownDynamics)), dynamicPools: saved.dynamicPools && typeof saved.dynamicPools === 'object' ? saved.dynamicPools : {},
        boardSend: saved.boardSend !== false, boardPresent: saved.boardPresent !== false, blendPlan: saved.blendPlan === true, bondTrack: saved.bondTrack !== false, boardStrip: saved.boardStrip !== false,
        // 1.38.0: board memories and board pins are opt-in; board words count alongside the hidden line.
        boardMemories: saved.boardMemories === true, boardPins: saved.boardPins === true, boardWithWeave: saved.boardWithWeave !== false,
        // 1.39.0: needs over in-world time, your character's condition, and wants the story suggests.
        needsDrift: saved.needsDrift !== false, needsSpeed: ['gentle', 'normal', 'harsh'].includes(saved.needsSpeed) ? saved.needsSpeed : 'normal',
        needsSkips: saved.needsSkips !== false, needsFloor: saved.needsFloor !== false, youTrack: saved.youTrack !== false, wantSuggest: saved.wantSuggest !== false,
        showsMode: ['all', 'mine', 'off'].includes(saved.showsMode) ? saved.showsMode : 'all',
        // 1.40.0: combos and cravings.
        combosOn: saved.combosOn !== false, cravingsOn: saved.cravingsOn !== false, skillLookback: [1, 2, 3].includes(Number(saved.skillLookback)) ? Number(saved.skillLookback) : 1,
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
// A chat that starts on 1.36 or later has nothing to move over.
const freshMeta = () => ({ version: 1, characters: {}, ledger: 2 });
function getState(ch = target()) {
    const c = ctx();
    if (!ch || !c.chatId) return null;
    c.chatMetadata[KEY] ??= freshMeta();
    const key = `char:${ch.avatar}`;
    const state = c.chatMetadata[KEY].characters[key] ??= freshState(settings().baselines[key]);
    return movePairFacts(extendCatalogue(state), '{{user}}');
}
// The player's own character is shared by every character in the chat, so it lives once per chat.
const playerName = () => String(ctx().name1 || '').trim() || 'You';
function getUserState() {
    const c = ctx();
    if (!c.chatId) return null;
    c.chatMetadata[KEY] ??= freshMeta();
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
    c.chatMetadata[KEY] ??= freshMeta();
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
// 1.44.0: your turn-ons, and whether the character knows them. Unknown ones still reach the story; known
// ones the character uses on purpose.
function turnKnowledgeRows(state, ch, knowledge) {
    const prefs = Object.entries(state?.prefs ?? {}).filter(([id, v]) => v && TURN_BY_ID[id]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    if (!prefs.length) return '';
    const aware = prefs.filter(([id]) => ['known', 'suspected'].includes(knowledgeEntry(knowledge[`turn:${id}`]).mode)).length;
    return `<details class="mw-knowledge mw-advanced" data-anchor="turn-knowledge"><summary>Does ${esc(ch.name)} know? <small>${aware} of ${prefs.length} known or suspected</small></summary>
        <p class="mw-fine">All of your turn-ons reach the story either way. If ${esc(ch.name)} doesn’t know one, it turns up by chance. If they suspect, they test it. If they know, they play into it on purpose.</p>` + prefs.map(([id, v]) => {
        const key = `turn:${id}`, entry = knowledgeEntry(knowledge[key]), t = TURN_BY_ID[id];
        return `<div class="mw-knowledge-row" data-knowledge-row="${key}" data-filter-item="knowledge" data-search="${esc(t.label + ' ' + t.cue)}"><label for="mw-knowledge-${key}">${esc(t.label)} <small>turn-${v > 0 ? 'on' : 'off'} · ${Math.abs(v)}%</small></label>
            <select id="mw-knowledge-${key}" data-knowledge="${key}" aria-label="Does ${esc(ch.name)} know: ${esc(t.label)}">${[['scene', 'Unaware'], ['suspected', 'Suspects'], ['known', 'Knows']].map(([mode, label]) => `<option value="${mode}" ${(entry.mode === 'private' ? 'scene' : entry.mode) === mode ? 'selected' : ''}>${label}</option>`).join('')}</select>
            ${['known', 'suspected'].includes(entry.mode) ? `<input type="text" maxlength="120" data-knowledge-source="${key}" aria-label="Source for ${esc(t.label)}" placeholder="How they learned it (optional)" value="${esc(entry.source)}">` : ''}</div>`;
    }).join('') + '</details>';
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
// ---- 1.36.0: the chat as it stands for the next reply ----
// A swipe that's still being written doesn't count yet: SillyTavern leaves the old swipe's text in the
// chat until the new one starts streaming, and nothing that old swipe did should reach the new one.
const liveChat = (type = '') => effectiveChat(ctx().chat, type);
// Each message is read once per version of its text.
const readCache = new WeakMap();
function readOf(m) {
    if (!m || typeof m.mes !== 'string') return { weave: null, boardKey: '' };
    const hit = readCache.get(m);
    if (hit && hit.mes === m.mes && hit.date === m.send_date) return hit;
    const weave = hasWeave(m.mes) ? parseWeave(m.mes) : null;
    const next = { mes: m.mes, date: m.send_date, weave, wkey: weave ? weaveKey(m) : '', boardKey: boardKeyOf(m) };
    readCache.set(m, next); return next;
}
const weaveOf = m => readOf(m).weave;
// Every key a reply can be known by: its weave line and its board. Both count as "still here", so
// switching the weave line on or off never undoes a reply.
const keysOf = m => { const r = readOf(m); return [...(r.wkey ? [r.wkey] : []), ...(r.boardKey ? [`b|${r.boardKey}`] : [])]; };
const solo = () => !ctx().groupId;
const writes = ch => m => Boolean(m && ch && !m.is_user && (solo() || m.name === ch.name));
const writerOf = m => solo() ? target() : members().find(w => w.name === m?.name) ?? null;
function liveFor(ch = target(), chat = liveChat()) {
    return liveBoard(latestBoard(chat), boardMeta(), { char: ch?.name ?? '', user: playerName() }, needSteps(chat), { pins: settings().boardPins, timeline: needTimeline(ch, chat), needs: needOpts() });
}
// 1.39.0: each of the character's replies with a board or reported needs, oldest first, so needs can
// drain with in-world time and come back up after a time jump. Read from the chat every time.
function needTimeline(ch, chat = liveChat()) {
    if (!ch) return [];
    const mine = writes(ch), feed = cleanBoardMeta(boardMeta()).feed && bondData(ch).on, out = [];
    (chat ?? []).forEach((m, i) => {
        if (!mine(m) || m.is_system) return;
        const board = hasBoard(m.mes) ? parseBoard(m.mes) : null, w = feed ? weaveOf(m) : null;
        if (board || (w && (Object.keys(w.needs ?? {}).length || Object.keys(w.needDeltas ?? {}).length))) out.push({ index: i, board, needs: w?.needs ?? {}, deltas: w?.needDeltas ?? {} });
    });
    return out.slice(-40);
}
const needOpts = () => ({ drift: settings().needsDrift, speed: settings().needsSpeed, skips: settings().needsSkips, floor: settings().needsFloor });
// 1.39.0: roles and psychosexual entries that are on can light up like turn-ons.
const bedroomTraits = st => MOODS.filter(m => ['dynamics', 'psychosexual'].includes(m.category) && (st?.moods?.[m.id] ?? 0) > 0).map(m => ({ id: m.id, label: m.label }));
const WANT_STOP = new Set(['the', 'and', 'her', 'his', 'them', 'their', 'she', 'him', 'get', 'make', 'for', 'with', 'from', 'being']);
function wantMatch(text, wants) {
    const raw = String(text).toLowerCase().trim(), ws = raw.replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !WANT_STOP.has(w));
    let best = null, score = 0;
    for (const w of wants) {
        const keys = w.text.toLowerCase(), sc = keys.includes(raw) || raw.includes(keys) ? 1 : ws.filter(x => keys.includes(x)).length / Math.max(1, ws.length);
        if (sc > score) { score = sc; best = w; }
    }
    return score >= 0.5 ? best : null;
}
// What the story set off, read from the hidden lines still in the chat: lit turn-ons and traits, wants
// moved or blocked, fears touched, hot buttons pressed, wants that came true, wants it suggests, and
// what it has done to your character's body. Swiping a reply takes all of it with it.
function reactions(ch, chat = liveChat(), live = null) {
    const st = getState(ch), out = { turns: new Set(), traits: new Set(), free: [], wants: new Map(), done: new Set(), doneAt: new Map(), suggest: [], condition: [], craving: new Map(), cravingMet: new Set(), combos: [] };
    if (!st || !ch || !bondData(ch).on) return out;
    const mine = writes(ch), replies = [];
    (chat ?? []).forEach((m, i) => { if (mine(m) && !m.is_system) { const w = weaveOf(m); if (w) replies.push([i, w]); } });
    const wants = (st.wants ?? []).filter(w => !w.done && w.text), kind = (...k) => wants.filter(w => k.includes(w.kind));
    for (const [i, w] of replies) for (const x of w.wants ?? []) {
        if (x.status !== 'done') continue;
        const hit = wantMatch(x.text, kind('want', 'goal')); if (hit && i > (hit.after ?? -1)) { out.done.add(hit.id); out.doneAt.set(hit.id, i); }
    }
    const newest = replies.at(-1)?.[1];
    if (newest) {
        const traits = bedroomTraits(st);
        for (const sp of newest.sparked ?? []) { const t = sparkTarget(sp.text, st.prefs ?? {}, traits); if (t.id) out.turns.add(t.id); else if (t.trait) out.traits.add(t.trait); else out.free.push(sp); }
        for (const x of newest.wants ?? []) { if (x.status === 'done') continue; const hit = wantMatch(x.text, kind('want', 'goal')); if (hit) out.wants.set(hit.id, x.status); }
        for (const f of newest.fears ?? []) { const hit = wantMatch(f, kind('fear')); if (hit) out.wants.set(hit.id, 'touched'); }
        for (const b of newest.pressed ?? []) { const hit = wantMatch(b, kind('button')); if (hit) out.wants.set(hit.id, 'pressed'); }
    }
    const dismissed = new Set((st.wantsDismissed ?? []).map(t => String(t).toLowerCase()));
    for (const [i, w] of replies.slice(-6)) {
        const t = w.newWant; if (!t || dismissed.has(t.toLowerCase()) || wantMatch(t, st.wants ?? []) || out.suggest.some(x => x.text.toLowerCase() === t.toLowerCase())) continue;
        out.suggest.push({ text: t, index: i });
    }
    for (const [, w] of replies.slice(-12)) if (Array.isArray(w.you)) out.condition = w.you;
    // 1.40.0: cravings (strong turn-ons that haven't lit in a while) and combos (two things at once).
    const prefs = st.prefs ?? {}, bedroom = bedroomTraits(st);
    const litPer = replies.map(([, w]) => new Set((w.sparked ?? []).filter(sp => !sp.off).map(sp => sparkTarget(sp.text, prefs, bedroom).id).filter(Boolean)));
    if (settings().cravingsOn) {
        const before = cravingsFrom(prefs, litPer.slice(0, -1)), now = cravingsFrom(prefs, litPer);
        out.craving = new Map(now.map(c => [c.id, c.gap]));
        out.cravingMet = new Set(before.filter(c => litPer.at(-1)?.has(c.id)).map(c => c.id));
    }
    if (settings().combosOn && newest) {
        const list = bondList(ch, chat), bond = bondData(ch), statuses = [...out.wants.values()];
        out.combos = findCombos({ lit: litPer.at(-1) ?? new Set(), litTraits: out.traits, moods: st.moods, pressed: statuses.includes('pressed'), blocked: statuses.includes('-'),
            desire: bond.desire?.on ? computeDesire(bond.desire, list) : null, more: computeMore(bond.more, list, paceOf(bond).cap).values, cravingMet: out.cravingMet,
            needsLow: new Set((live?.needs ?? []).filter(nd => nd.known && nd.value <= 35).map(nd => nd.id)) }, cleanCombos(st.combos), shortName(ch.name), shortName(playerName()));
    }
    return out;
}
// For the Bonds tab: what has set the character off over the whole chat, and how often.
function reactionTally(ch, chat = liveChat()) {
    const st = getState(ch), traits = bedroomTraits(st), sparks = new Map(), pressed = new Map();
    if (!st || !ch || !bondData(ch).on) return { sparks: [], pressed: [] };
    const mine = writes(ch), buttons = (st.wants ?? []).filter(w => w.kind === 'button');
    (chat ?? []).forEach(m => {
        if (!mine(m) || m.is_system) return; const w = weaveOf(m); if (!w) return;
        for (const sp of w.sparked ?? []) {
            const t = sparkTarget(sp.text, st.prefs ?? {}, traits), key = t.id ? `t:${t.id}` : t.trait ? `r:${t.trait}` : `x:${sp.text.toLowerCase()}`;
            const e = sparks.get(key) ?? { text: t.id ? TURN_BY_ID[t.id].label : t.trait ? BY_ID[t.trait]?.label ?? sp.text : sp.text, off: sp.off, count: 0 }; e.count++; sparks.set(key, e);
        }
        for (const b of w.pressed ?? []) { const hit = wantMatch(b, buttons), k = (hit?.text ?? b).toLowerCase(); const e = pressed.get(k) ?? { text: hit?.text ?? b, count: 0 }; e.count++; pressed.set(k, e); }
    });
    const top = map => [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
    return { sparks: top(sparks), pressed: top(pressed) };
}
// Needs the weave line reported, by position, read from the chat every time (never stored).
function needSteps(chat = liveChat()) {
    const out = {};
    if (!cleanBoardMeta(boardMeta()).feed) return out;
    for (let i = chat.length - 1, seen = 0; i >= 0 && seen < 40; i--, seen++) {
        const m = chat[i]; if (!m || m.is_user || m.is_system) continue;
        const writer = writerOf(m); if (!writer || !bondData(writer).on) continue;
        const w = weaveOf(m); if (w && Object.keys(w.needs).length) out[i] = w.needs;
    }
    return out;
}
async function editBoard(mutate) {
    const meta = ctx().chatMetadata?.[KEY]; if (!meta) return;
    const b = cleanBoardMeta(meta.board); mutate(b); meta.board = b;
    await persist(); await syncPrompt(); render();
}
// A reply arrived, or one was swiped, edited, continued or deleted. Bring everything into line with
// the chat, save, and redraw.
async function boardChanged() {
    const out = reconcile();
    if (out.changed) { if (out.notes.length) status = out.notes.join(' '); await persist(); }
    if (panel?.open) render(true);
    await syncPrompt();
}
// 1.33.0: bond meters, kept per character per chat.
// 1.44.0: who's he and who's she, for the Bonds lines. Auto reads the card and the persona description;
// a persona nobody described counts as she.
function pronounsFor(ch, bond) {
    const pu = ctx().powerUserSettings ?? globalThis.power_user ?? {};
    // Sentences about your persona would count her pronouns as his, so only the ones that aren't are read.
    const about = String(`${ch.description ?? ''} ${ch.personality ?? ''} ${ch.scenario ?? ''} ${ch.first_mes ?? ''} ${ch.mes_example ?? ''}`).replace(/\{\{char\}\}/gi, ch.name ?? '').split(/(?<=[.!?\n])\s+/)
        .filter(x => !/\{\{user\}\}/i.test(x) && !(playerName() && x.toLowerCase().includes(playerName().toLowerCase()))).join(' ');
    return { n: bond.pn !== 'auto' ? bond.pn : guessPronoun(about) || 'they',
        u: bond.pu !== 'auto' ? bond.pu : guessPronoun(pu.persona_description ?? '') || 'she' };
}
function usePronouns(ch, bond) {
    const p = pronounsFor(ch, bond);
    for (const name of [ch.name, shortName(ch.name)]) setPronoun(name, p.n);
    for (const name of [playerName(), shortName(playerName())]) setPronoun(name, p.u);
}
function bondData(ch) {
    const meta = ctx().chatMetadata?.[KEY]; if (!meta || !ch) return cleanBond({}, false);
    meta.bond ??= {};
    const key = `char:${ch.avatar}`;
    if (!meta.bond[key]) meta.bond[key] = { base: seedBond(ch), v: 2, pool: [...(settings().dynamicPools?.[key] ?? [])] };
    let bond = cleanBond(meta.bond[key], settings().bondTrack);
    if (bond.v !== 2) bond = migrateBond(bond, ch);
    usePronouns(ch, bond);
    return (meta.bond[key] = bond);
}
// 1.36.0: meter steps used to be stored by message number, which deletions shifted and a long chat
// capped. Now they're read from the chat. Each meter keeps exactly the value it shows today, anchored
// just before the newest reply, so swiping that reply straight after updating takes its step away.
function migrateBond(bond, ch) {
    const chat = ctx().chat ?? [], list = bondList(ch, effectiveChat(chat)), old = storedSteps(bond, chat.length), last = list.at(-1), prev = list.at(-2);
    for (const k of METERS) {
        const shown = clamp(bond.base[k] + old.reduce((sum, x) => sum + (x.s[k] ?? 0), 0), -100, 100);
        bond.anchors[k] = last ? { v: clamp(shown - (bond.steps[last.pos]?.[k] ?? 0), -100, 100), key: prev?.key ?? '', pos: prev?.pos ?? -1 } : { v: shown, key: '', pos: -1 };
    }
    bond.steps = {}; bond.v = 2;
    return bond;
}
// One step per reply of this character's that has a weave line, oldest first, from the chat itself.
// Hidden messages still count: hiding a reply isn't taking it back.
function bondList(ch, chat = liveChat()) {
    if (!ch) return [];
    const stored = ctx().chatMetadata?.[KEY]?.bond?.[`char:${ch.avatar}`], mine = writes(ch), out = [], nudge = stored?.nudge !== false, scale = PACE_SCALE[stored?.pace] ?? 1;
    (chat ?? []).forEach((m, pos) => {
        if (!mine(m)) return;
        const w = weaveOf(m); if (!w) return;
        const step = { f: w.f, r: w.r, t: w.t, p: w.pRaw ? powerChange(w.pRaw, ch.name, playerName()) : w.p, l: w.lRaw ? powerChange(w.lRaw, ch.name, playerName()) : 0, thinks: w.thinks, sparks: w.sparked, d: w.desire ?? null, m: w.meters ?? null, dy: w.dynamic || '' };
        // 1.47.0: feelings that rose this reply nudge the matching meters, unless the line moved them itself.
        out.push({ pos, key: readOf(m).wkey, s: nudge ? withNudges(step, w.moods.filter(x => x.delta > 0).map(x => feelingId(x.name)).filter(Boolean), scale) : step });
    });
    if (out.length) { const st = getState(ch), prefs = st?.prefs ?? {}, traits = bedroomTraits(st); for (const x of out.slice(-3)) x.s = { ...x.s, sparks: x.s.sparks.map(sp => ({ ...sp, ...sparkTarget(sp.text, prefs, traits) })) }; }
    return out;
}
// A new meter starts from the relationship sliders already set toward the player, so an existing
// romance doesn't open at "no spark". Later replies move it from there.
// 1.34.1: the same reading of the sliders seeds new meters and shapes the named dynamic (bond.js).
function bondAxes(ch) {
    const st = getState(ch), rel = st ? userRelation(st) : null;
    const pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')];
    // 1.37.0: your persona's own side toward this character counts too (Has them on a string, Captor of…).
    const name = String(ch?.name ?? '').toLowerCase();
    const mine = (getUserState()?.relationships ?? []).find(r => r.target === '{{char}}' || resolveRelationName(r.target).toLowerCase() === name);
    return sliderAxes(rel && rel.enabled !== false ? rel.moods ?? {} : {}, pair?.enabled !== false ? pair?.moods ?? {} : {}, mine && mine.enabled !== false ? mine.moods ?? {} : {});
}
// 1.43.0: the same idea switched on in more than one place (a meter, the dynamic, his slider toward you, a
// both-ways tag, a story trope). Worked out from what the note would actually send; syncPrompt sends each
// idea once and the Bonds tab lists them with a tidy button.
function bondOverlaps(ch, history, bond = bondData(ch), list = null, bd = null) {
    if (!bond?.on) return [];
    const st = getState(ch), story = getStoryState(ch), rel = st ? userRelation(st) : null;
    const pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')];
    const steps = list ?? bondList(ch, history);
    const d = bd ?? (bond.extra ? computeBond(bond, history.length, shortName(ch.name), shortName(playerName()), bondAxes(ch), steps) : null);
    const sent = { meters: saidMeters(bond.more, steps, paceOf(bond).cap), base: d && (d.t >= 10 || d.t <= -20) ? { t: d.t } : {}, dynamic: d?.dynamic.key ?? '' };
    return findOverlaps({ sent, rel: rel && rel.enabled !== false ? rel.moods : {}, shared: pair && pair.enabled !== false ? pair.moods : {},
        story: story?.enabled ? story.moods : {}, moods: st?.moods ?? {} });
}
// Names for the Bonds tab's "Doubled up" list.
function overlapNames(list, n, u) {
    const name = x => x.kind === 'meter' ? `${MORE_METERS.find(m => m[0] === x.id)?.[1] ?? x.id} meter` : x.kind === 'base' ? 'Trust meter'
        : x.kind === 'dynamic' ? `${fillDynamic(x.id, n, u)} (dynamic)` : x.kind === 'rel' ? `${RELATIONSHIP_BY_ID[x.id]?.label ?? x.id} ${u} (${n}’s side)`
        : x.kind === 'shared' ? `${SHARED_BY_ID[x.id]?.label ?? x.id} (both ways)` : `${BY_ID[x.id]?.label ?? x.id} (${x.kind === 'story' ? 'story' : 'moodlet'})`;
    return list.map(o => ({ key: o.key, label: o.label, keep: name(o.keep), both: o.both.map(name), drop: o.drop.filter(x => !feedsMeters(x)).map(name),
        held: o.drop.filter(feedsMeters).map(name), also: o.also.map(name) }));
}
// Sliders and both-ways tags that also move the meters (trusts, obsessed, captor of…). The note can skip them,
// but Tidy leaves them on: turning them off would shift the meters and maybe the dynamic.
const feedsMeters = x => x.kind === 'rel' ? Object.values(sliderAxes({ [x.id]: 100 })).some(Boolean) : x.kind === 'shared' ? Object.values(sliderAxes({}, { [x.id]: 100 })).some(Boolean) : false;
const seedBond = ch => Object.fromEntries(Object.entries(bondAxes(ch)).map(([k, v]) => [k, Math.round(v * 0.8)]));
const userRelation = (st, create = false) => {
    const you = playerName().toLowerCase();
    let relation = (st.relationships ??= []).find(r => r.target === '{{user}}' || resolveRelationName(r.target).toLowerCase() === you);
    if (!relation && create) { relation = cloneRelationships([{ id: newId(), target: '{{user}}', enabled: true, moods: {} }])[0]; st.relationships.push(relation); }
    return relation;
};
// What a reply can move: the character's feelings (catalogue sliders and their own rows) and their
// relationship toward the player. Pinned sliders never move.
const moodTarget = st => ({
    get: id => id.startsWith('custom:') ? (st.custom ?? []).find(r => r.id === id.slice(7))?.value ?? 0 : st.moods[id] ?? 0,
    set: (id, v) => { if (!id.startsWith('custom:')) st.moods[id] = v; else { const r = (st.custom ?? []).find(x => x.id === id.slice(7)); if (r) r.value = v; } },
    pinned: id => !id.startsWith('custom:') && Boolean(st.pins?.[id]),
});
const relTarget = relation => ({ get: id => relation.moods[id] ?? 0, set: (id, v) => { relation.moods[id] = v; }, pinned: () => false });
const fedOf = (meta, writer) => ((meta.boardFed ??= {})[`char:${writer.avatar}`] ??= { moods: {}, rel: {} });
const labelOf = (st, id) => id.startsWith('custom:') ? (st.custom ?? []).find(r => r.id === id.slice(7))?.text ?? 'their own feeling' : BY_ID[id]?.label ?? RELATIONSHIP_BY_ID[id]?.label ?? id;
// Feelings the catalogue doesn't have become the character's own rows (three at most), and they go
// away again when they fade to nothing, unless you rename them.
function tidyAuto(meta, writer, st) {
    const led = ((meta.weave ??= {})[`char:${writer.avatar}`] ??= {}); led.auto ??= {};
    st.custom = (st.custom ?? []).filter(r => !(led.auto[r.id] === r.text && r.value === 0));
    for (const rid of Object.keys(led.auto)) if (!st.custom.some(r => r.id === rid)) delete led.auto[rid];
}
// ---- 1.36.0: what each reply changed, kept by the reply ----
// meta.applied['char:avatar'] lists, oldest first, every reply whose changes were applied:
// { k: reply key, m: { feeling: [before, after] }, r: { relationship: [before, after] }, fed: board bookkeeping before, mem: memory id }.
// A swiped, regenerated, edited or deleted reply at the end is undone exactly, however many there are.
const untouchedMemory = m => m?.boardText && m.text === m.boardText && m.value === 55;
function remember(writer, key, raw) {
    if (!writer || isNone(raw)) return '';
    const pair = getPair(`char:${writer.avatar}`, 'user', true); if (!pair) return '';
    const text = String(raw).replace(/^[\[(“"]+|[\])”"]+$/g, '').trim().slice(0, 160);
    pair.memories ??= [];
    if (!text || pair.memories.some(m => m.text.toLowerCase() === text.toLowerCase())) return '';
    const id = newId();
    pair.memories.push({ id, text, value: 55, who: 'both', src: key, boardText: text });
    // Only the newest 8 untouched ones are kept; edit or re-rate one and it's yours for good.
    const auto = pair.memories.filter(untouchedMemory);
    if (auto.length > 8) { const drop = new Set(auto.slice(0, auto.length - 8).map(m => m.id)); pair.memories = pair.memories.filter(m => !drop.has(m.id)); }
    return id;
}
function forget(writer, id) {
    const pair = id && writer ? getPair(`char:${writer.avatar}`, 'user') : null;
    if (pair?.memories) pair.memories = pair.memories.filter(m => !(m.id === id && untouchedMemory(m)));
}
// hold: feelings you moved by hand after an earlier version of this same swipe (before it was continued
// or its hidden line edited). They're yours now, so the new version leaves them alone.
function applyReply(meta, writer, st, m, b, hold = null) {
    const w = bondData(writer).on ? weaveOf(m) : null, boardKey = readOf(m).boardKey;
    const rec = { k: w ? readOf(m).wkey : boardKey ? `b|${boardKey}` : '', m: {}, r: {}, fed: null, mem: '' }, notes = [];
    if (!rec.k) return null;
    if (!st.enabled) return { rec, notes };
    if (w) {
        if (b.feed) {
            const led = ((meta.weave ??= {})[`char:${writer.avatar}`] ??= {}); led.auto ??= {};
            const custom = () => (st.custom ??= []);
            // Catalogue names first, then their own rows, then a new row of their own.
            // 1.46.0: "Only my list" keeps the story to the feelings on the character's list (and their own rows).
            const listOnly = st.moodScope === 'list', listed = id => !listOnly || st.loadout?.includes(id) || (st.moods[id] ?? 0) > 0;
            const resolve = (name, delta) => {
                const own = custom().find(r => r.kind === 'mood' && r.text.toLowerCase() === name); if (own) return `custom:${own.id}`;
                const id = feelingId(name); if (id) return listed(id) ? id : null;
                if (listOnly || delta <= 0 || name.length > 40 || name.split(' ').length > 4) return null;
                if (Object.entries(led.auto).filter(([rid, text]) => custom().some(r => r.id === rid && r.text === text)).length >= 3) return null;
                const row = { id: newId(), kind: 'mood', text: name, value: 0, cause: '' };
                custom().push(row); led.auto[row.id] = row.text; return `custom:${row.id}`;
            };
            // 1.45.0: the character's own switch, the pace cap, and arousal from the desire card reaching Horny
            // (the desire field used to take it, so Horny never moved while the card was on).
            const pace = moodPaceOf(st), named = new Set();
            const list = st.moodAuto === false ? [] : w.moods.map(x => ({ ...x, delta: paceDelta(x.delta, pace) }));
            if (st.moodAuto !== false && w.desire?.a && !list.some(x => feelingId(x.name) === 'horny')) list.push({ name: 'horny', delta: paceDelta(w.desire.a * 4, pace) });
            rec.m = track(moodTarget(st), list, (name, delta) => { const id = resolve(name, delta); if (id) named.add(id); return id && hold?.m?.has(id) ? null : id; });
            const relation = userRelation(st, Boolean(w.toward.length || w.feels.length));
            if (relation) {
                const before = { ...relation.moods };
                track(relTarget(relation), w.toward, name => { const id = relationId(name, playerName()); return id && hold?.r?.has(id) ? null : id; });
                // Older lines named feelings without numbers ("feels: wary, drawn").
                if (w.feels.length) { const fed = fedOf(meta, writer); rec.fed = structuredClone(fed); feedValues(relation.moods, {}, fed.rel, relationsFromBoard({ toward: w.feels.join(', ') }, playerName())); }
                rec.r = diff(before, relation.moods);
            }
            // 1.38.0: the board's State words fill in feelings the hidden line didn't name. The line wins for
            // anything it names, and those stop being the board's to fade.
            const board = settings().boardWithWeave ? parseBoard(m.mes) : null;
            if (board?.state) {
                const named = Object.fromEntries(w.moods.map(x => [feelingId(x.name), true]).filter(([id]) => id));
                const fed = fedOf(meta, writer); rec.fed ??= structuredClone(fed);
                const before = { ...st.moods };
                feedValues(st.moods, { ...st.pins, ...named }, fed.moods, feelingsFromBoard(board).filter(x => !named[x.id]));
                Object.assign(rec.m, diff(before, st.moods));
            }
            // 1.45.0: feelings nobody mentioned for a while fade, on the character's pace. Pinned ones and
            // traits never do. Recorded with the reply, so a swipe or Undo puts them back.
            if (st.moodAuto !== false && st.moodFade !== false) {
                for (const id of Object.keys(rec.m)) named.add(id);
                const values = {};
                for (const [id, v] of Object.entries(st.moods)) if (v > 0 && !st.pins?.[id] && analysed(BY_ID[id]) && !hold?.m?.has(id)) values[id] = v;
                for (const r of st.custom ?? []) if (r.kind === 'mood' && r.value > 0) values[`custom:${r.id}`] = r.value;
                rec.q = structuredClone(st.moodQuiet ?? {});
                const { faded, quiet } = fadeStep(values, named, st.moodQuiet ?? {}, moodPaceOf(st));
                st.moodQuiet = quiet;
                const target = moodTarget(st);
                for (const [id, v] of Object.entries(faded)) { rec.m[id] = [values[id], v]; target.set(id, v); rec.f = [...(rec.f ?? []), id]; }
            }
            notes.push(...Object.keys(rec.m).filter(id => !rec.f?.includes(id)).map(id => labelOf(st, id)), ...Object.keys(rec.r).map(id => labelOf(st, id)),
                ...Object.entries(w.needs).map(([k, v]) => `${k} ${needWord(v).toLowerCase()}`));
        }
        if (settings().boardMemories) rec.mem = remember(writer, rec.k, w.remember);
    } else {
        // No weave line: the board's State and Toward words nudge feelings instead.
        const board = parseBoard(m.mes);
        if (board && b.feed) {
            const fed = fedOf(meta, writer); rec.fed = structuredClone(fed);
            const before = { ...st.moods };
            feedValues(st.moods, st.pins, fed.moods, feelingsFromBoard(board));
            rec.m = diff(before, st.moods);
            if (board.toward !== undefined) {
                const readings = relationsFromBoard(board, playerName()), relation = userRelation(st, readings.length > 0);
                if (relation) { const was = { ...relation.moods }; feedValues(relation.moods, {}, fed.rel, readings); rec.r = diff(was, relation.moods); }
            }
            notes.push(...Object.keys(rec.m).filter(id => st.moods[id] > 0).slice(0, 4).map(id => labelOf(st, id)));
        }
        if (board && settings().boardMemories && board.remember !== undefined) rec.mem = remember(writer, rec.k, board.remember);
    }
    for (const id of Object.keys(rec.m)) if (!id.startsWith('custom:') && st.moods[id] > 0 && Array.isArray(st.loadout) && !st.loadout.includes(id)) st.loadout.push(id);
    if (rec.mem) notes.push('remembered a moment');
    if (Object.keys(rec.m).length || Object.keys(rec.r).length || rec.mem) st.revision = (st.revision || 0) + 1;
    tidyAuto(meta, writer, st);
    return { rec, notes: [...new Set(notes)] };
}
function undoReply(meta, writer, st, rec) {
    const backM = untrack(moodTarget(st), rec.m);
    if (rec.q) st.moodQuiet = structuredClone(rec.q);
    const relation = userRelation(st), backR = relation ? untrack(relTarget(relation), rec.r) : [];
    const kept = { m: new Set(Object.keys(rec.m ?? {}).filter(id => !backM.includes(id))), r: new Set(Object.keys(rec.r ?? {}).filter(id => !backR.includes(id))) };
    if (rec.fed) (meta.boardFed ??= {})[`char:${writer.avatar}`] = structuredClone(rec.fed);
    if (rec.mem) forget(writer, rec.mem);
    st.revision = (st.revision || 0) + 1;
    tidyAuto(meta, writer, st);
    return kept;
}
// "w|send time" names one swipe whatever its hidden line says now.
const swipeOf = key => String(key).startsWith('w|') ? key.split('|').slice(0, 2).join('|') : '';
// Brings the chat's own state into line with the chat. Runs after every change to the chat and right
// before every reply is written, so the reply always sees what's actually there.
function reconcile(type = '') {
    const c = ctx(), ch = target();
    if (suspended || !ch || !c.chatId || !getState(ch)) return { changed: false, notes: [] };
    const meta = c.chatMetadata[KEY];
    const chat = effectiveChat(c.chat, type), notes = [];
    let changed = migrateChat(meta, chat);
    const b = cleanBoardMeta(meta.board), found = latestBoard(chat);
    // Corrections from older versions are tied to the newest board now. A correction that a later board
    // has carried on, and whose own board is gone, can't come back, so it's dropped.
    const boardsHere = new Set(chat.slice(-40).map(m => readOf(m).boardKey).filter(Boolean));
    for (const [k, f] of Object.entries(b.fix)) {
        if (f.on === '?') { f.on = found?.key ?? NO_BOARD; f.pos = found?.index ?? chat.length; changed = true; }
        else if (!fixActive(f, found) && (f.on === NO_BOARD || !boardsHere.has(f.on))) { delete b.fix[k]; changed = true; }
    }
    // The newest board moves the cast in and out of the scene, and lets go of cut phrases it no longer says.
    if ((found?.key ?? '') !== b.syncedKey) {
        if (found) {
            const text = `${found.board.state ?? ''} ${found.board.physical ?? ''}`.toLowerCase();
            for (const kind of ['state', 'physical']) b.mute[kind] = b.mute[kind].filter(p => text.includes(p.toLowerCase()));
            const moved = [];
            if (settings().boardPresent && found.board.present !== undefined) for (const person of getCast(ch)) {
                const here = namedIn(found.board.present, person.name);
                if (here !== person.inScene) { person.inScene = here; moved.push(`${person.name} ${here ? 'in' : 'out'}`); }
            }
            if (moved.length) notes.push(`Board: ${moved.join(', ')}.`);
        }
        b.syncedKey = found?.key ?? ''; changed = true;
    }
    meta.board = b;
    // Each character's replies: undo the ones that are gone from the end, then apply any new ones.
    meta.applied ??= {};
    const recent = [];
    for (let i = chat.length - 1; i >= 0 && recent.length < 4; i--) { const m = chat[i]; if (m && !m.is_user && !m.is_system) recent.unshift([i, m]); }
    const moved = [];
    let undone = 0;
    // Only characters who have something to settle: a record, or a reply near the end.
    for (const writer of members().filter(w => meta.applied[`char:${w.avatar}`]?.length || recent.some(([, m]) => writes(w)(m)))) {
        const st = getState(writer); if (!st) continue;
        const wkey = `char:${writer.avatar}`, mine = writes(writer), here = new Set();
        for (const m of chat) if (mine(m)) for (const k of keysOf(m)) here.add(k);
        const held = new Map();
        const settled = settle(meta.applied[wkey], k => here.has(k), rec => { const kept = undoReply(meta, writer, st, rec); if (swipeOf(rec.k)) held.set(swipeOf(rec.k), kept); });
        if (settled.undone || settled.forgot) changed = true;
        undone += settled.undone;
        const list = settled.kept;
        if (!writingNow()) {
            const known = new Set(list.map(r => r.k));
            const newestKnown = Math.max(-1, ...recent.filter(([, m]) => mine(m) && keysOf(m).some(k => known.has(k))).map(([i]) => i));
            const todo = recent.filter(([i, m]) => mine(m) && i > newestKnown && !keysOf(m).some(k => known.has(k)));
            // A character with nothing recorded yet starts from their newest reply only.
            for (const [, m] of list.length ? todo : todo.slice(-1)) {
                const done = applyReply(meta, writer, st, m, b, held.get(swipeOf(readOf(m).wkey))); if (!done) continue;
                list.push(done.rec); moved.push(...done.notes); changed = true;
            }
        }
        meta.applied[wkey] = list.slice(-40);
    }
    if (undone) notes.push(`Took back what ${undone === 1 ? 'the replaced reply' : `${undone} replaced replies`} changed.`);
    if (moved.length) notes.push(`${bondData(ch).on ? 'Weave' : 'Board'}: ${[...new Set(moved)].slice(0, 5).join(', ')}.`);
    if (migrationNote) { notes.unshift(migrationNote); migrationNote = ''; }
    return { changed, notes };
}
// ---- 1.36.0: moving a chat from 1.35 and earlier ----
// Older versions kept what replies did by message number. Once per chat this:
// - records the newest replies as already applied, so nothing is applied twice;
// - keeps the newest reply's exact changes where the old record still matches it, so swiping it undoes it;
// - removes board memories whose reply isn't in the chat any more (left behind by swipes and deletes);
// - drops the stored needs (they're read from the chat now) and the old meter steps (bondData moves those);
// - turns old board pins into one-time corrections on the newest board.
let migrationNote = '';
const zip = (before = {}, after = {}) => Object.fromEntries(Object.keys(after).map(id => [id, [before[id] ?? 0, after[id]]]));
function migrateChat(meta, chat) {
    if (meta.ledger === 2) return false;
    meta.applied ??= {};
    let cleaned = 0;
    const oldPins = Object.keys(meta.board?.pins ?? {}).filter(k => String(meta.board.pins[k] ?? '').trim()).length;
    for (const writer of members().filter(w => chat.some(writes(w)))) {
        const st = getState(writer); if (!st) continue;
        const wkey = `char:${writer.avatar}`, mine = writes(writer), bond = bondData(writer), led = meta.weave?.[wkey];
        const recs = [];
        chat.forEach((m, i) => { if (mine(m) && !m.is_system) { const r = readOf(m), k = bond.on && r.wkey ? r.wkey : r.boardKey ? `b|${r.boardKey}` : ''; if (k) recs.push({ k, m: {}, r: {}, fed: null, mem: '', i }); } });
        const seeded = recs.slice(-6), newest = seeded.at(-1), w = newest ? weaveOf(chat[newest.i]) : null;
        if (newest && w && led?.moods?.index === newest.i && led.moods.sig === JSON.stringify(w.moods)) newest.m = zip(led.moods.before, led.moods.after);
        if (newest && w && led?.rel?.index === newest.i && led.rel.sig === JSON.stringify(w.toward)) newest.r = zip(led.rel.before, led.rel.after);
        if (led) { delete led.moods; delete led.rel; }
        // Board memories: keep the ones whose reply is still in the chat and link them to it.
        const pair = getPair(wkey, 'user');
        if (pair?.memories?.length) {
            const said = new Map();
            const norm = raw => isNone(raw) ? '' : String(raw).replace(/^[\[(“"]+|[\])”"]+$/g, '').trim().slice(0, 160).toLowerCase();
            chat.forEach((m, i) => {
                if (!mine(m)) return;
                for (const text of [norm(weaveOf(m)?.remember), norm(parseBoard(m.mes)?.remember)]) if (text) said.set(text, i);
            });
            pair.memories = pair.memories.filter(mem => {
                if (!untouchedMemory(mem)) { delete mem.boardIndex; return true; }
                const at = said.get(mem.text.toLowerCase());
                if (at === undefined) { cleaned++; return false; }
                const rec = seeded.find(r => r.i === at); if (rec && !rec.mem) rec.mem = mem.id;
                mem.src = rec?.k ?? ''; delete mem.boardIndex; return true;
            });
        }
        meta.applied[wkey] = seeded.map(({ i, ...rec }) => rec);
    }
    // Old pins become corrections waiting for the newest board (reconcile ties them to it).
    if (meta.board) meta.board = cleanBoardMeta(meta.board);
    meta.ledger = 2;
    const bits = [cleaned ? `${cleaned} memor${cleaned === 1 ? 'y' : 'ies'} from replies that are gone were removed` : '', oldPins ? `your ${oldPins} board edit${oldPins === 1 ? ' is' : 's are'} now a one-time correction for the next reply` : ''].filter(Boolean);
    migrationNote = `Updated this chat for 1.36: swipes and deletes now undo exactly${bits.length ? `; ${bits.join('; ')}` : ''}.`;
    return true;
}
async function editBond(mutate) {
    const ch = target(), bond = bondData(ch); if (!ch) return;
    mutate(bond, bondList(ch)); ctx().chatMetadata[KEY].bond[`char:${ch.avatar}`] = cleanBond(bond, settings().bondTrack);
    await persist(); await syncPrompt(); render();
}
// Memories the board or hidden line saved (and nobody has edited since) between this character and you.
const boardMemoryCount = ch => (getPair(`char:${ch?.avatar}`, 'user')?.memories ?? []).filter(untouchedMemory).length;
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
async function syncPrompt(forGeneration = false, chat = null, type = '') {
    // The note for a reply in progress stays as it was built; redraw it once that reply is done.
    if (!forGeneration && writingNow()) { resyncAfter = true; return; }
    const version = ++promptVersion;
    const c = ctx(), ch = target(forGeneration), state = getState(ch), id = identity(ch), mine = getUserState(), story = getStoryState(ch);
    if (suspended || !state) {
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        promptInfo = { prompt: '', tokens: 0, omitted: 0 }; renderPreview(); return;
    }
    try {
        migratePairs(ch);
        const name = String(ch.name).slice(0, 100), player = playerName().slice(0, 100);
        // Always the real chat (the generation copy has boards stripped and skips hidden messages), minus a
        // swipe in progress: the reply being replaced must not shape the one replacing it.
        const history = effectiveChat(c.chat ?? [], type);
        const n = shortName(name), u = shortName(player), bond = bondData(ch), bm = cleanBoardMeta(boardMeta());
        const memories = settings().boardMemories;
        const liveNow = liveFor(ch, history);
        const board = boardPromptLines({ send: boardSend(), live: liveNow, char: name, user: player, n, u, stripped: settings().boardStrip, remember: memories && !bond.on });
        const react = reactions(ch, history, liveNow), live = (state.wants ?? []).filter(w => !w.done && w.value > 0 && w.text && !react.done.has(w.id));
        // 1.42.0: the current dynamic, worked out once. The story is asked to rename it when it shifts, and
        // both-ways or story lines it already says are left out of this note.
        const bondList0 = bond.on ? bondList(ch, history) : [], bd = bond.on && bond.extra ? computeBond(bond, history.length, n, u, bondAxes(ch), bondList0) : null;
        // 1.46.2: picks are listed in the hidden line only up to 25 (about 3 tokens each). Past that the line names it in a
        // few words and the closest of your picks is used, so a big pick list costs nothing extra.
        const storyNames = bd && bond.mode === 'story' && !bond.fixed ? { now: bd.dynamic.name.toLowerCase(), pool: bond.pool.length <= 25 ? bond.pool.map(name => fillDynamic(name, n, u)) : [] } : null;
        const covered = new Set(bd?.dynamic.covers ?? []);
        // 1.43.0: one idea, one line. Whatever's doubled up is sent once, from the most specific place.
        const dropped = droppedIds(bondOverlaps(ch, history, bond, bondList0, bd));
        const pairDrop = new Set([...covered, ...dropped.shared]), storyDrop = new Set([...covered, ...dropped.story]);
        const zero = (moods, ids) => Object.fromEntries(Object.entries(moods ?? {}).map(([id, v]) => [id, ids.has(id) ? 0 : v]));
        const youRel = dropped.rel.size ? userRelation(state) : null;
        const stateNote = youRel ? { ...state, relationships: state.relationships.map(r => r === youRel ? { ...r, moods: zero(r.moods, dropped.rel) } : r) } : state;
        const weave = bond.on ? weavePrompt({ n, u, bond: true, extra: bond.extra, pace: bond.pace, dynamic: storyNames, moods: bm.feed, feelings: state.moodAuto !== false, moodPace: moodPaceOf(state), moodNames: state.moodScope === 'list' ? listedFeelings(state) : null, remember: memories, wants: live.some(w => ['want', 'goal'].includes(w.kind)),
            fears: live.some(w => w.kind === 'fear'), buttons: live.some(w => w.kind === 'button'), suggest: settings().wantSuggest && live.filter(w => w.kind === 'want').length < 3, you: settings().youTrack, desire: bond.desire?.on === true ? cleanDesire(bond.desire).scales : false, meters: meterWeaveNames(cleanMore(bond.more).on), skills: skillPeople(ch, state, mine).some(p => skillsOf(p.st).length) }) : [];
        // 1.41.0: skills go only when the scene calls for them.
        const skillScene0 = skillScene(ch, history), skills = skillLines(skillPeople(ch, state, mine).map(p => ({ name: p.name, lit: litSkills(p.st, skillScene0.scene, skillScene0.used) })), u);
        // Pattern breaker: the character's last five replies, read here, no extra request.
        const patterns = story?.enabled && (story.moods?.pattern_breaker ?? 0) > 0 ? findPatterns(history.filter(m => writes(ch)(m) && !m.is_system).slice(-5).map(m => m.mes), { names: [name, player] }) : [];
        // The count is only a report, so a tokenizer that can't be reached falls back to an estimate
        // instead of pausing the whole note for that reply.
        const count = async text => { try { const n = await c.getTokenCountAsync(text); return Number.isFinite(n) ? n : Math.ceil(text.length / 3.6); } catch { return Math.ceil(text.length / 3.6); } };
        const pairs = pairExtras(ch).map(p => pairDrop.size && p.names[0] === name && p.names[1] === player ? { ...p, moods: zero(p.moods, pairDrop) } : p);
        const storyNote = story && [...storyDrop].some(id => story.moods?.[id] > 0) ? { ...story, moods: zero(story.moods, storyDrop) } : story;
        const result = await budgetPrompt(stateNote, name, settings().tokenBudget, count, { player: { state: mine, name: player, knowledge: getKnowledge(ch), condition: settings().youTrack ? react.condition : [] }, story: storyNote, cast: getCast(ch), pairs, board, blendPlan: settings().blendPlan, lit: react, patterns, showsMode: settings().showsMode,
            standing: bondStanding({ bond, chatLength: history.length, n, u, axes: bondAxes(ch), list: bondList0 }), weave, skills });
        if (version !== promptVersion || id !== identity(target(forGeneration))) return;
        // In-chat, user role. Depth 0 puts the note after the latest chat message.
        // Preset instructions outside chat history can still follow it.
        c.setExtensionPrompt(PROMPT_KEY, result.prompt, 1, settings().depth, false, 1);
        promptInfo = result; renderPreview();
    } catch (err) {
        console.error('[Moodweaver] could not build the note', err);
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        promptInfo = { prompt: '', tokens: 0, omitted: 0 };
        renderPreview();
        status = `The mood note couldn't be built, so nothing was sent this time: ${err?.message ?? err}`; renderStatus();
    }
}
// True while a reply is being written. SillyTavern also marks <body data-generating> for exactly that
// time, so if our own end-of-reply event were ever missed, this still lets go.
function writingNow() {
    if (!generating) return false;
    if (typeof document === 'undefined' || document.body?.dataset?.generating === 'true') return true;
    generating = false; clearTimeout(genTimer); return false;
}
function startGenerating() {
    generating = true; clearTimeout(genTimer);
    // GENERATION_ENDED always follows, but never hold the note forever if something swallows it.
    genTimer = setTimeout(stopGenerating, 10 * 60 * 1000);
    genTimer?.unref?.(); // only matters under Node's test runner
}
function stopGenerating() {
    const was = generating; generating = false; clearTimeout(genTimer);
    if (was && resyncAfter) { resyncAfter = false; void syncPrompt(); }
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
    // 1.45.0: nothing ticked means nothing to read; don't pay for an empty request.
    if (!SCOPES.some(([k]) => cleanScope(state.readScope)[k])) { if (force) { status = `Nothing to read: tick Moodlets, Body, Traits or Wants under ✧ Scene reader first.`; renderStatus(); } return; }
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

// 1.42.0: Bonds → Re-read the scene. One request to the reader's connection, only when tapped: where the
// character and your persona stand now, from the latest messages. The meters are set there (pinned ones are
// left alone) and, in story mode, the dynamic the reader names holds until a reply names another.
async function readBond(ch = target()) {
    const c = ctx(), bond = bondData(ch), profile = readerProfile();
    if (suspended || !ch || !bond.on || pending) return;
    if (!profile) { status = 'Pick a reader connection under ✧ Scene reader (Moods tab) first.'; renderStatus(); return; }
    const n = shortName(ch.name), u = shortName(playerName()), list = bondList(ch), now = computeBond(bond, Infinity, n, u, bondAxes(ch), list);
    const on = cleanMore(bond.more).on, meters = on.map(k => { const m = MORE_METERS.find(x => x[0] === k); return { key: k, word: m[4], two: m[2] }; });
    const names = (bond.pool.length ? dynamicRows().filter(r => bond.pool.includes(r[0])) : dynamicRows()).map(r => fillDynamic(r[0], n, u));
    const data = sceneData(c.chat, ch, getState(ch), settings(), { sceneStart: sceneStart() });
    const current = { friendship: now.friend, romance: now.romance, ...(bond.extra ? { trust: now.trust, control: now.control, pull: now.pull } : {}), dynamic: now.dynamic.name,
        ...Object.fromEntries(meters.map(m => [m.word, now.more[m.key]])) };
    const messages = bondReadMessages({ n, u, notes: data.character.notes, scene: data.scene, current, meters, names, extra: bond.extra });
    const controller = new AbortController(), snapshot = identity(ch), fp = fingerprint(c.chat), metadata = c.chatMetadata;
    pending = { controller, snapshot };
    const timer = setTimeout(() => controller.abort(), 45000);
    status = `Reading where ${n} and ${u} stand…`; render();
    try {
        const response = await c.ConnectionManagerRequestService.sendRequest(profile, messages, settings().outputTokens,
            { stream: false, signal: controller.signal, extractData: true, includePreset: false, includeInstruct: true });
        if (controller.signal.aborted || metadata !== ctx().chatMetadata || snapshot !== identity(ch) || fp !== fingerprint(ctx().chat)) {
            status = 'The scene changed while reading, so that read was thrown away.'; return;
        }
        const read = parseBondRead(response?.content ?? '', meters), cap = paceOf(bond).cap;
        await editBond((b, steps) => {
            for (const k of METERS) if (read[k] !== null && b.pins[k] === null && (bond.extra || ['f', 'r'].includes(k))) setMeter(b, k, read[k], steps);
            for (const [k, v] of Object.entries(read.m)) if (cleanMore(b.more).pins[k] === null) setMore(b, k, v, steps, cap);
            const last = steps.at(-1);
            if (read.dynamic) b.read = { name: read.dynamic, why: read.why, key: last?.key ?? '', pos: last?.pos ?? -1 };
        });
        status = `Re-read: ${read.dynamic || 'meters updated'}${read.why ? `. ${read.why}` : ''}`;
    } catch (error) {
        status = controller.signal.aborted ? 'Reading stopped or timed out. Nothing changed.' : (error.message || 'Reading failed. Nothing changed.');
    } finally {
        clearTimeout(timer); pending = null; render();
    }
}

globalThis.moodweaverBeforeGeneration = async (chat, _contextSize, _abort, type) => {
    // Weave lines never reach the model, and neither do old boards (the newest is summarised in the note).
    // Every message is cleaned the same way every time, so history stays identical between turns and the cache keeps matching.
    const stripBoards = !suspended && settings().boardStrip && Boolean(getState(target(true)));
    if (Array.isArray(chat)) for (let i = 0; i < chat.length; i++) {
        const m = chat[i], mes = m?.mes; if (typeof mes !== 'string') continue;
        let next = hasWeave(mes) ? stripWeave(mes) : mes;
        // 1.38.1: on Continue, the reply being continued keeps its board, so a reply cut off inside its
        // board is finished from where it stopped.
        const continuing = type === 'continue' && i === chat.length - 1;
        if (stripBoards && !continuing && !m.is_user && hasBoard(next)) { const cut = stripBoard(next); if (cut.trim()) next = cut; }
        if (next !== mes) chat[i] = { ...structuredClone(m), mes: next };
    }
    if (suspended || ['quiet', 'impersonate'].includes(type)) {
        ++promptVersion; ctx().setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1); return;
    }
    // 1.36.0: settle the chat first. A regenerate deletes the old reply a moment before this runs and a
    // swipe still holds the old swipe's text, so without this the new reply would be written with the
    // old one's feelings, needs, memory and board still in place.
    const settled = reconcile(type);
    if (settled.changed) { if (settled.notes.length) status = settled.notes.join(' '); void persist(); }
    startGenerating();
    const ch = target(true), state = getState(ch);
    if (state?.enabled && state.mode === 'dynamic' && !['swipe', 'regenerate', 'continue'].includes(type)) await analyse(false, 'char', ch);
    await syncPrompt(true, chat, type);
    generationSnapshots.set(identity(ch), { at: new Date().toLocaleString(), depth: settings().depth, prompt: promptInfo.prompt });
    if (generationSnapshots.size > 20) generationSnapshots.delete(generationSnapshots.keys().next().value);
    renderPreview();
};

const tagLabel = m => m.label.replaceAll('{{user}}', playerName()).replaceAll('{{char}}', target()?.name ?? 'main character');
const fmtTokens = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
function targetFields(m, state) {
    if (!state.moods[m.id]) return '';
    const fields = m.id === 'hates_other' ? [['hate', 'Who?', 'Name of someone in the scene']]
        : m.id === 'comparing_people' ? [['compareA', 'Compare', 'Someone in the scene'], ['compareB', 'With', '{{user}}']]
        : m.category === 'era' ? [['year', 'Exact year (optional)', 'e.g. 1964']] : [];
    return fields.length ? `<div class="mw-target-fields">${fields.map(([key, label, placeholder]) => `<label>${label}<input type="text" data-target="${key}" maxlength="${key === 'year' ? 20 : 80}" ${key === 'year' ? 'inputmode="text"' : `list="${key === 'hate' ? 'mw-hate-names' : 'mw-cast-names'}"`} placeholder="${esc(placeholder)}" value="${esc(state.targets?.[key] ?? '')}"></label>`).join('')}</div>` : '';
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
        <small${m.note ? ` title="${esc(`Sent to the AI: ${m.cue}`)}"` : ''}>${esc(m.note ?? m.cue)}</small>${targetFields(m, state)}${value ? causeBox(`data-cause="${m.id}"`, state.causes?.[m.id]) + showsBox(m, state) : ''}</div>`;
}
// 1.39.0: on an active feeling, how it shows on this person. Empty uses the default wording (the placeholder).
const showsBox = (m, state) => analysed(m) && ON_PAGE[m.id] && settings().showsMode !== 'off' ? `<input type="text" class="mw-cause mw-shows" data-shows="${m.id}" maxlength="120" value="${esc(state.shows?.[m.id] ?? '')}" placeholder="${settings().showsMode === 'mine' ? 'your wording (default is off): ' : 'shows as: '}${esc(ON_PAGE[m.id])}" title="How it shows on ${esc(subjectName())}. Leave empty for: ${esc(ON_PAGE[m.id])}" aria-label="How it shows on them">` : '';
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
const lastGroup = { trait: 'dynamics', turn: 'turn-kinks' };
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
            : `<button data-action="browse" class="mw-primary">＋ Add ${label}</button>${kind === 'mood' || kind === 'story' ? `<select data-field="recipe" aria-label="Add a starter blend"><option value="">Starter blend…</option>${Object.keys(kind === 'story' ? STORY_RECIPES : RECIPES).map(r => `<option>${esc(r)}</option>`).join('')}</select>` : ''}`}</div>
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
    return `<details class="mw-reader" data-reader ${profile ? 'open' : ''}>
        <summary class="mw-reader-head"><span class="mw-reader-icon">✧</span><div><b>Scene reader</b><small>${profile ? `Reads the latest messages and moves ${esc(subjectName())}’s sliders. Pinned ◆ ones stay put.` : 'Optional, and an extra paid request per read. The hidden weave line already does this for free with every reply.'}</small></div></summary>
        <div class="mw-scope" role="group" aria-label="What to read">${SCOPES.map(([k, icon, label]) => `<button type="button" class="mw-scope-chip" data-scope="${k}" aria-pressed="${scope[k]}">${scope[k] ? '✓' : icon} ${label}</button>`).join('')}</div>${anyScope ? '' : '<p class="mw-fine mw-scope-none">Nothing ticked, so there’s nothing to read. Tap Moodlets to read feelings.</p>'}
        <div class="mw-reader-go"><button class="mw-primary mw-read" data-action="analyse" ${pending || !profile || !state.enabled || !anyScope ? 'disabled' : ''}>${pending ? 'Reading…' : '✧ Read the scene'}</button>${pending ? '<button data-action="cancel">Stop</button>' : `<button data-action="undo" ${!state.history?.length ? 'disabled' : ''} title="Undo the last read">↶ Undo</button>`}</div>
        <p class="mw-reader-meta">Last ${settings().sceneMessages} messages${start ? ' since your scene marker' : ''} · about ${fmtTokens(est)} tokens a read${scope.trait ? ' · traits roughly double it' : ''}</p>
        ${!profile ? '<p class="mw-fine mw-warn">Pick a connection for the reader below. A small, cheap model does the job.</p>' : ''}
        <details class="mw-tuning" data-reader-tuning><summary>Reader settings</summary>
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
    </details>`;
}
// ---- Wants, goals & fears ----
const WANT_META = {
    want: ['☆', 'Wants', 'What they’re after right now', '#e5ca7f', 'e.g. get him to admit it'],
    goal: ['⚑', 'Goals', 'Bigger aims that play out over time', '#8fcebc', 'e.g. take over the family firm'],
    fear: ['☾', 'Fears', 'What they dread or avoid', '#b0a5e8', 'e.g. being left again'],
    button: ['⚡', 'Hot buttons', 'When this happens → how they react', '#e79a7a', 'e.g. someone is kind to them → awkward, deflects with a joke'],
};
const STATUS_BADGE = { '+': ['is-up', '↑ closer last reply'], '-': ['is-down', '↓ blocked last reply'], touched: ['is-down', '☾ came near last reply'], pressed: ['is-hot', '⚡ pressed last reply'] };
function wantRow(w, status = '') {
    const badge = STATUS_BADGE[status];
    return `<div class="mw-mood mw-want ${badge ? `mw-want-lit ${badge[0]}` : ''}" data-want-row="${esc(w.id)}" data-filter-item="wants"><textarea class="mw-want-text" data-want-text="${esc(w.id)}" maxlength="120" rows="1" aria-label="${esc(w.kind)}">${esc(w.text)}</textarea>
        <div class="mw-want-controls"><input type="range" min="0" max="100" step="1" value="${w.value}" data-want-value="${esc(w.id)}" style="--mw-fill:${w.value}%" aria-label="How much it drives them">
        <span data-lvl>${level(w.value)}</span><o>${w.value}%</o>
        <button type="button" class="mw-list mw-tick" data-want-done="${esc(w.id)}" title="${['fear', 'button'].includes(w.kind) ? 'Over it: stop sending' : 'Came true: stop sending'}" aria-label="Done">✓</button><button type="button" class="mw-list" data-want-remove="${esc(w.id)}" title="Delete" aria-label="Delete">×</button></div>
        ${badge ? `<small class="mw-want-status">${badge[1]}</small>` : ''}${w.read ? '<small class="mw-from-scene">✧ picked up from the scene</small>' : ''}</div>`;
}
function wantsView(state, ch) {
    const items = state.wants ?? [], name = subjectName(), done = items.filter(w => w.done);
    const react = who === 'char' ? reactions(ch) : null, storyDone = react ? items.filter(w => !w.done && react.done.has(w.id)) : [];
    const intro = who === 'user' ? `What ${esc(name)} is after and afraid of. ${esc(ch.name)} doesn’t know these unless you show them, but the story gives you openings now and then and brushes up against your fears.`
        : `What drives ${esc(name)}. Each reply they take a step toward the strongest want when the scene allows, and the hidden line reports what moved: these light up when the story pushes them closer, blocks them, touches a fear or presses a hot button.`;
    return `<section class="mw-wants"><p class="mw-explainer">${intro}</p>
        ${storyDone.length ? `<div class="mw-want-card mw-want-story" style="--mw-accent:#8fd18a"><div class="mw-want-head"><span class="mw-want-icon">✓</span><div><b>The story says these came true</b><small>No longer sent. Swiping that reply brings them back.</small></div></div>
            ${storyDone.map(w => `<div class="mw-done-row"><span>${WANT_META[w.kind][0]} ${esc(w.text)}</span><button type="button" class="mw-list" data-want-done="${esc(w.id)}" title="Keep it done">✓</button><button type="button" class="mw-list" data-want-notyet="${esc(w.id)}" data-at="${react.doneAt.get(w.id) ?? -1}" title="Not yet: keep sending it">↺</button></div>`).join('')}</div>` : ''}
        ${react?.suggest.length ? `<div class="mw-want-card mw-want-suggest" style="--mw-accent:#e5ca7f"><div class="mw-want-head"><span class="mw-want-icon">✧</span><div><b>The story suggests</b><small>Things ${esc(name)} started wanting lately. Add one with a tap.</small></div></div>
            ${react.suggest.map(x => `<div class="mw-done-row"><span>☆ ${esc(x.text)}</span><button type="button" class="mw-list" data-want-suggest="${esc(x.text)}" title="Add as a want">＋</button><button type="button" class="mw-list" data-want-dismiss="${esc(x.text)}" title="Not this one">×</button></div>`).join('')}</div>` : ''}
        ${WANT_KINDS.map(kind => {
            const [icon, title, sub, color, hint] = WANT_META[kind], list = items.filter(w => w.kind === kind && !w.done && !storyDone.includes(w));
            return `<div class="mw-want-card" style="--mw-accent:${color}">
                <div class="mw-want-head"><span class="mw-want-icon">${icon}</span><div><b>${title}</b><small>${sub}</small></div>${list.length ? `<em>${list.length}</em>` : ''}</div>
                ${list.map(w => wantRow(w, react?.wants.get(w.id) ?? '')).join('') || `<p class="mw-want-empty">${kind === 'fear' ? 'Nothing scares them yet.' : kind === 'goal' ? 'No big plans yet.' : kind === 'button' ? 'Nothing sets them off yet. Write “when this happens → this reaction”.' : 'Nothing they’re after yet.'}</p>`}
                <div class="mw-cast-add mw-want-add"><input type="text" data-want-new="${kind}" maxlength="120" enterkeyhint="done" placeholder="${esc(hint)}" aria-label="New ${title.toLowerCase().slice(0, -1)}"><button type="button" data-action="want-add" data-kind="${kind}" aria-label="Add">＋</button></div></div>`;
        }).join('')}
        ${done.length ? `<details class="mw-want-done" data-want-done-list><summary>Came true or let go <small>${done.length}</small></summary>${done.map(w => `<div class="mw-done-row"><span>${WANT_META[w.kind][0]} ${esc(w.text)}</span><button type="button" class="mw-list" data-want-restore="${esc(w.id)}" title="Bring back">↺</button><button type="button" class="mw-list" data-want-remove="${esc(w.id)}" title="Delete">×</button></div>`).join('')}</details>` : ''}
        ${who === 'char' ? `<label class="mw-toggle mw-wants-tip"><input type="checkbox" data-setting-bool="wantSuggest" ${settings().wantSuggest ? 'checked' : ''}> Let the story suggest new wants (when there are fewer than three)</label>` : ''}
        <p class="mw-fine mw-wants-tip">Needs the hidden weave line (Bonds tab). The scene reader’s ☆ Wants switch still works too.</p>
    </section>`;
}
// 1.39.0: your own character's tab. No needs (you play them): what you're wearing, what the story has done
// to your body, and the moodlets you've set, at a glance.
// 1.40.0: combos firing now, cravings building, and your own combos, on the character's Turn-ons tab.
function reactiveBlock(state, ch) {
    if (!bondData(ch).on) return '';
    const r = reactions(ch, liveChat(), liveFor(ch)), name = esc(shortName(ch.name));
    const things = [...Object.entries(state.prefs ?? {}).filter(([id, v]) => v > 0 && TURN_BY_ID[id]).map(([id]) => [`turn:${id}`, `✧ ${TURN_BY_ID[id].label} lights up`]),
        ...activeMoods(state).filter(m => sectionOf(m) === 'mood').map(m => [`mood:${m.id}`, `◇ ${m.label} (clear or above)`]),
        ...activeMoods(state).filter(m => ['dynamics', 'psychosexual'].includes(m.category)).map(m => [`trait:${m.id}`, `❂ ${m.label} lights up`]),
        ['button', '⚡ a hot button goes off'], ...['hunger', 'energy', 'bladder', 'hygiene', 'comfort', 'social', 'fun', 'health'].map(id => [`need:${id}`, `◔ ${id} is low`])];
    const opts = attr => `<select ${attr}><option value="">Choose…</option>${things.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`;
    const label = token => things.find(([v]) => v === token)?.[1] ?? token;
    const own = cleanCombos(state.combos);
    return `${r.combos.length ? `<div class="mw-combo">${r.combos.map(c => `<div><b>⚡ ${esc(c.name)}</b><small>${esc(c.text)}</small></div>`).join('')}</div>` : ''}
        ${r.craving.size ? `<div class="mw-sparks mw-cravings"><small>Craving</small>${[...r.craving].map(([id, gap]) => `<span class="mw-spark is-craving" title="Not lit for ${gap} replies">◌ ${esc(TURN_BY_ID[id]?.label ?? id)} <b>${gap}</b></span>`).join('')}</div>` : ''}
        <details class="mw-combo-settings"><summary>Combos &amp; cravings</summary>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="combosOn" ${settings().combosOn ? 'checked' : ''}> Combos: two things at once fire a bigger effect</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="cravingsOn" ${settings().cravingsOn ? 'checked' : ''}> Cravings: strong turn-ons that haven’t lit in a while pull ${name} toward them</label>
            <p class="mw-fine">Built in: ${COMBOS.map(([n]) => esc(n)).join(', ')}. Strong turn-ons crave after 8 quiet replies, intense ones after 5. All ${settings().combosOn || settings().cravingsOn ? '' : 'off, so nothing is '}worked out from the replies still in the chat, so a swipe undoes it.</p>
            <b class="mw-pre-label">${name}’s own combos</b>
            ${own.map(c => `<div class="mw-done-row"><span><b>${esc(c.name)}</b>: ${esc(label(c.a))} + ${esc(label(c.b))}</span><button type="button" class="mw-list" data-combo-remove="${esc(c.id)}" title="Delete">×</button></div>`).join('') || '<p class="mw-fine">None yet.</p>'}
            <div class="mw-combo-maker">${opts('data-combo-a aria-label="First thing"')}<span>+</span>${opts('data-combo-b aria-label="Second thing"')}
                <input type="text" data-combo-name maxlength="40" placeholder="Name (e.g. Claim)"><input type="text" data-combo-text maxlength="160" placeholder="What happens (e.g. he has to put her back in her place)">
                <button type="button" data-action="combo-add" class="mw-primary">＋ Add combo</button></div>
        </details>`;
}
function youView(state, ch, live) {
    const react = settings().youTrack ? reactions(ch) : null, moods = activeMoods(state).filter(m => sectionOf(m) === 'mood').slice(0, 10);
    const where = live?.found ? [live.time, live.location].filter(Boolean).join(' · ') : '';
    return `<section class="mw-you">
        <div class="mw-board-block mw-outfits"><h4>${esc(playerName())}’s outfit</h4><div class="mw-outfit"><p>${esc(live?.userOutfit) || '<i>Not on the board yet</i>'}</p></div>${where ? `<small class="mw-fine">${esc(where)}</small>` : ''}</div>
        <div class="mw-board-block"><h4>Condition <small>what the story has done to you</small></h4>
            ${!settings().youTrack ? '<p class="mw-fine">Off. Switch it on below.</p>' : react.condition.length ? `<div class="mw-tiles">${react.condition.map(t => `<span class="mw-tile">${esc(t)}</span>`).join('')}</div>` : `<p class="mw-fine">Nothing lasting yet. Injuries, being drugged, soaked or tied show up here from the hidden line.</p>`}
            <p class="mw-fine">Sent each reply so a split lip or rope burns don’t vanish between messages. It clears when the story says you’ve healed.</p>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="youTrack" ${settings().youTrack ? 'checked' : ''}> Track ${esc(playerName())}’s condition (all chats)</label></div>
        <div class="mw-board-block"><h4>Moodlets showing</h4>
            ${moods.length ? `<div class="mw-chips">${moods.map(m => `<button type="button" class="mw-chip" data-tab="mood" style="--mw-accent:${m.color}"><span>${esc(m.label)}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`).join('')}</div>` : '<p class="mw-fine">None set. Add them on the Moods tab.</p>'}</div>
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
// 1.34.0: Meters live at the top of Bonds, beside the relationship they measure.
const TABS = [['mood', '✦', 'Moods', '#c9b8f0'], ['needs', '◔', 'Needs', '#9fd3b4'], ['rel', '♥', 'Bonds', '#ef9fbe'], ['trait', '❂', 'Traits', '#e3c38f'], ['turn', '⇋', 'Turn-ons', '#e7a6c4'], ['skills', '✪', 'Skills', '#9fc0e8'], ['state', '⌂', 'Facts', '#9fc6c0'], ['inv', '❒', 'Items', '#c9b37e'], ['wants', '☆', 'Wants', '#e5ca7f']];
// 1.39.0: on your own character the Needs tab becomes You: outfit, condition and the moodlets showing.
const tabBar = counts => `<nav class="mw-tabbar" role="tablist" aria-label="Section">${TABS.map(row => who === 'user' && row[0] === 'needs' ? ['needs', '◐', 'You', '#9fd3b4'] : row).map(([k, icon, label, color]) =>
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
        <details class="mw-advanced" data-settings="library"><summary>Your library <small>${settings().library.length} options</small></summary>${libraryList()}</details>
        ${(() => { const n = pinCounts(), words = n ? pinWords(n) : ''; return `<details class="mw-advanced" data-settings="pins"><summary>Pins in this chat <small>${words ? 'some set' : 'none'}</small></summary>
            <p class="mw-fine">${words ? `Right now: ${esc(words)}.` : 'Nothing is pinned in this chat.'} Unpinning everything covers everyone in this chat: ${esc(target()?.name ?? 'the character')}, ${esc(playerName())}, the cast and the story. Sliders and meters keep their values and can move again. Needs you set and board corrections go back to following the board. Saved defaults for new chats aren't changed.</p>
            <div class="mw-actions"><button type="button" class="mw-danger" data-action="unpin-all"${words ? '' : ' disabled'}>Unpin everything</button></div></details>`; })()}
        <details class="mw-advanced" data-settings="fresh"><summary>Clear everything <small>${esc(whose)}</small></summary>
            <p class="mw-fine">Turns off every moodlet, trait, turn-on, fact, want, item, skill and row of your own for ${esc(whose)} in this chat, and their relationships (their side, both-ways and memories). Pins come off. Bonds meters, the board and saved defaults stay.</p>
            <label class="mw-toggle"><input type="checkbox" data-keep-types checked> Keep personality types</label>
            <div class="mw-actions"><button type="button" class="mw-danger" data-action="clear-everything">Clear everything</button>${state.lastCleared ? '<button type="button" data-action="clear-undo">↺ Bring it back</button>' : ''}</div></details>
        <details class="mw-advanced" data-settings="defaults"><summary>Defaults for new chats</summary>
            <p class="mw-fine">Each chat keeps its own settings. Saving a default seeds ${esc(whose)}’s future chats; existing chats stay as they are.</p>
            <div class="mw-actions"><button data-action="baseline">${who === 'cast' ? 'Save the whole cast' : who === 'user' ? 'Save persona default' : who === 'story' ? 'Save story default' : 'Save character default'}</button><button data-action="reset">Clear unpinned moodlets</button></div></details>
        <details class="mw-advanced" data-settings="limits"><summary>Prompt & reader limits</summary>
            <label>Token target <input type="number" data-setting="tokenBudget" min="160" max="3000" value="${settings().tokenBudget}"></label>
            <label>Depth from the end <input type="number" data-setting="depth" min="0" max="10" step="1" value="${settings().depth}"></label>
            <p class="mw-fine">The target only warns; nothing is cut. Depth 0 puts the note after your latest message (best); 1 puts it before.</p>
            <label>Reader text cap <input type="number" data-setting="sceneChars" min="2000" max="40000" step="1000" value="${settings().sceneChars}"></label>
            <label title="Thinking models (Claude Opus 5.5 always thinks) spend part of this before writing the JSON. Around 4000 suits them.">Reader reply cap <input type="number" data-setting="outputTokens" min="300" max="16000" step="100" value="${settings().outputTokens}"></label>
            <p class="mw-fine">Text cap is in characters. Raise the reply cap if a thinking model runs out before it answers.</p></details>
    </section>`;
}
// 1.36.1: every pin in this chat, for everyone in it. Values stay where they are; they just stop being
// held. Needs you set and board corrections go back to following the board. Saved defaults aren't touched.
function chatStates(meta) {
    return [...Object.values(meta?.characters ?? {}), meta?.user, meta?.story, ...Object.values(meta?.cast ?? {}).flat().map(p => p?.state)].filter(st => st && typeof st === 'object');
}
function pinCounts() {
    const meta = ctx().chatMetadata?.[KEY]; if (!meta) return null;
    const b = cleanBoardMeta(meta.board);
    return {
        sliders: chatStates(meta).reduce((n, st) => n + Object.values(st.pins ?? {}).filter(Boolean).length, 0),
        meters: Object.values(meta.bond ?? {}).reduce((n, bond) => n + Object.values(cleanBond(bond).pins).filter(v => v !== null).length, 0),
        ...(settings().boardPins ? { needs: Object.keys(b.needs).length, fixes: Object.keys(b.fix).length, kept: b.keep.state.length + b.keep.physical.length } : { needs: 0, fixes: 0, kept: 0 }),
    };
}
const pinWords = n => [[n.sliders, 'slider'], [n.meters, 'meter'], [n.needs, 'need you set', 'needs you set'], [n.fixes, 'board correction'], [n.kept, 'kept board tile']]
    .filter(([v]) => v).map(([v, one, many]) => `${v} ${v === 1 ? one : many ?? `${one}s`}`).join(', ');
async function clearAllPins() {
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
    const sparks = ['turn', 'trait'].includes(kind) && who === 'char' && bondData(ch).on ? computeBond(bondData(ch), Infinity, 'one', 'the other', null, bondList(ch)).sparks.filter(x => kind === 'turn' ? !x.trait : x.trait) : [];
    const lit = new Set(sparks.filter(x => x.fresh && x.id).map(x => x.id)), litTraits = new Set(sparks.filter(x => x.fresh && x.trait).map(x => x.trait));
    const chips = turnsSet.map(([id, v]) => `<button data-jump="turn:${id}" class="mw-chip mw-chip-turn ${v < 0 ? 'is-off' : ''} ${lit.has(id) ? 'is-lit' : ''}" style="--mw-accent:${TURN_BY_ID[id].color}" title="${lit.has(id) ? 'Set off in the last reply. ' : ''}Adjust ${esc(TURN_BY_ID[id].label)}"><span>${lit.has(id) ? '✧' : v > 0 ? '♡' : '✕'} ${esc(TURN_BY_ID[id].label)}</span><b>${Math.abs(v)}</b><i style="width:${Math.abs(v)}%"></i></button>`).join('')
        + shown.map(m => `<button data-jump="${m.id}" class="mw-chip ${litTraits.has(m.id) ? 'is-lit' : ''}" style="--mw-accent:${m.color}" title="${litTraits.has(m.id) ? 'Set off in the last reply. ' : ''}Adjust ${esc(m.label)}"><span>${litTraits.has(m.id) ? '✧ ' : ''}${state.pins[m.id] ? '◆ ' : ''}${esc(tagLabel(m))}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`).join('');
    const explainer = who === 'user' && kind === 'turn' ? `What ${esc(playerName())} likes or can’t stand in other people. The story works these in now and then; ${esc(ch.name)} only learns them from how you react.`
        : kind === 'turn' ? `What draws ${esc(whose)} in or puts them off: people, bodies, kinks, fetishes and acts. Slide right for a turn-on, left for a turn-off. When the story touches one it lights up ✧ and counts a step stronger next reply.`
        : who === 'user' && ['mood', 'trait'].includes(kind) ? `How ${esc(playerName())} comes across. ${esc(ch.name)} reacts to it but never writes for you. Choose what ${esc(ch.name)} knows below.`
        : kind === 'trait' ? `Who ${esc(whose)} is underneath. Traits stay put unless you switch on ❂ Traits in the scene reader.` : '';
    return `<div class="mw-summary"><div class="mw-section-label">${shown.length || turnsSet.length ? heading : 'A clean slate'}<span>${shown.length + turnsSet.length} on${onHere ? ` · <button class="mw-clear" data-action="clear" title="Turn off this tab’s ${what}, pins too. Other tabs stay as they are">Clear ${what}</button>` : ''}</span></div>
        <div class="mw-chips">${chips || `<p>${empty}</p>`}</div>
        ${kind === 'turn' && who === 'char' ? reactiveBlock(state, ch) : ''}
        ${sparks.length ? `<div class="mw-sparks"><small>Lit lately</small>${sparks.map(x => `<span class="mw-spark ${x.off ? 'is-off' : ''} ${x.fresh ? 'is-fresh' : ''}">${x.off ? '✕' : '✧'} ${esc(x.text)}</span>`).join('')}</div>` : ''}
        ${kind === 'mood' && state.reason ? `<div class="mw-observation">✧ ${esc(state.reason)}<small>Last scene read · ${esc(new Date(state.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</small></div>` : ''}</div>
    ${kind === 'mood' && who === 'char' ? storyMoodBlock(state, ch) : ''}
    ${kind === 'mood' ? readerBlock(state) : ''}
    ${explainer ? `<p class="mw-explainer">${explainer}</p>` : ''}
    ${kind === 'trait' ? typesBlock(state, ch) : ''}
    ${['mood', 'trait'].includes(kind) && who === 'user' ? knowledgePanel(state, ch) : ''}${kind === 'turn' && who === 'user' ? turnKnowledgeRows(state, ch, getKnowledge(ch)) : ''}
    ${catalogueBlock(state, kind, ch, whose)}`;
}
// ---- 1.45.0: the story moves moods ----
// The hidden line at the end of each reply moves feelings for free. This card switches it on or off per
// character, sets how fast it moves and fades, and shows (and can undo) what the last reply did.
const FEELINGS_COUNT = MOODS.filter(analysed).length;
// The feelings on a character's list, as the plain names the hidden line uses (first part of the label).
function listedFeelings(st) {
    const ids = new Set([...(st.loadout ?? []), ...Object.keys(st.moods ?? {}).filter(id => st.moods[id] > 0)]);
    return [...ids].map(id => BY_ID[id]).filter(m => m && analysed(m)).map(m => m.label.split('/')[0].trim().toLowerCase())
        .concat((st.custom ?? []).filter(r => r.kind === 'mood').map(r => r.text.toLowerCase()));
}
function lastMoodRec(ch) {
    const list = ctx().chatMetadata?.[KEY]?.applied?.[`char:${ch.avatar}`] ?? [];
    return list.at(-1) ?? null;
}
function storyMoodBlock(state, ch) {
    const bond = bondData(ch), feed = cleanBoardMeta(boardMeta()).feed, on = state.moodAuto !== false, fade = state.moodFade !== false, pace = moodPaceOf(state);
    const rec = lastMoodRec(ch), moved = Object.entries(rec?.m ?? {}).filter(([id]) => !id.startsWith('custom:') || (state.custom ?? []).some(r => `custom:${r.id}` === id));
    const name = id => id.startsWith('custom:') ? (state.custom ?? []).find(r => `custom:${r.id}` === id)?.text ?? 'their own' : BY_ID[id]?.label ?? id;
    const step = ([id, [a, b]]) => `<span class="mw-moodstep ${rec.f?.includes(id) ? 'is-fade' : b > a ? 'is-up' : 'is-down'}">${esc(name(id))} ${b === 0 ? 'off' : `${b > a ? '+' : '−'}${Math.abs(b - a)}`}${rec.f?.includes(id) ? ' · fading' : ''}</span>`;
    const blocked = !bond.on ? 'Switch Bonds on for this character to use it: the hidden line comes with Bonds.' : !feed ? 'Replies are set not to update feelings (Board settings), so this is paused.' : '';
    return `<details class="mw-storymood" data-anchor="story-moods" ${on ? 'open' : ''}><summary><span>☾ The story moves moods</span><small>${on ? `${esc(pace.label)}${fade ? ', fading' : ''}` : 'off'}</small></summary>
        <label class="mw-toggle"><input type="checkbox" data-mood-auto ${on ? 'checked' : ''}> Each reply moves ${esc(ch.name)}’s feelings (free, no extra request)</label>
        ${blocked ? `<p class="mw-fine mw-scope-none">${blocked}</p>` : ''}
        ${on ? `<div class="mw-storymood-row"><label>Speed<select data-mood-pace aria-label="How fast feelings change">${Object.entries(MOOD_PACE).map(([k, v]) => `<option value="${k}" ${state.moodPace === k || (!MOOD_PACE[state.moodPace] && k === 'steady') ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
            <label class="mw-toggle"><input type="checkbox" data-mood-fade ${fade ? 'checked' : ''}> Fade</label></div>
        <label class="mw-storymood-which">Which feelings<select data-mood-scope aria-label="Which feelings the story can set">
            <option value="any" ${state.moodScope !== 'list' ? 'selected' : ''}>Any of the ${FEELINGS_COUNT} moods</option>
            <option value="list" ${state.moodScope === 'list' ? 'selected' : ''}>Only ${esc(ch.name)}’s list (${listedFeelings(state).length})</option></select></label>
        ${state.moodScope === 'list' ? `<p class="mw-fine">The hidden line is given the names on the list (about ${Math.ceil(listedFeelings(state).join(', ').length / 3.6)} tokens), and anything else it names is ignored. Add moods to the list from the catalogue below.</p>` : ''}
        <p class="mw-fine">${esc(pace.label)}, ${esc(pace.hint)}: up to ${pace.step} a reply.${fade ? ` A feeling nobody mentions for ${pace.after} repl${pace.after === 1 ? 'y' : 'ies'} loses ${pace.fade} a reply after that.` : ' Feelings stay until the story turns them down.'} Pinned ◆ ones never move.</p>
        ${moved.length ? `<div class="mw-moodlast"><small>Last reply</small><div>${moved.map(step).join('')}</div><button type="button" data-action="mood-undo-last">↶ Undo</button></div>` : rec?.undone ? '<p class="mw-fine">Last reply’s changes were undone.</p>' : ''}` : ''}</details>`;
}
// ---- 1.41.0: Skills ----
// Who can have skills in this reply: the character, your character and the cast in the scene.
function skillPeople(ch, state, mine) {
    return [{ name: shortName(ch?.name ?? ''), st: state }, { name: shortName(playerName()), st: mine },
        ...getCast(ch).filter(p => p.inScene).map(p => ({ name: shortName(p.name), st: p.state }))].filter(p => p.st?.enabled);
}
// What calls for a skill: your latest message and the character's last reply (or more, by the Look back setting),
// plus whatever the newest reply's hidden line says was used. Read from the chat each time, so swipes undo it.
function skillScene(ch, history = liveChat()) {
    const chat = (history ?? []).filter(m => m && !m.is_system), mine = writes(ch);
    const lastUser = [...chat].reverse().find(m => m.is_user), replies = chat.filter(m => mine(m));
    const scene = [lastUser, ...replies.slice(-settings().skillLookback)].filter(Boolean).map(m => stripWeave(m.mes)).join('\n');
    const newest = replies.at(-1), used = (newest ? weaveOf(newest)?.used ?? [] : []).join(', ');
    return { scene, used };
}
function skillsView(state, ch) {
    const whose = esc(subjectName()), set = cleanSkills(state.skills), always = cleanAlways(state.skillAlways), own = cleanOwnSkills(state.ownSkills);
    const { scene, used } = skillScene(ch, liveChat()), going = litSkills(state, scene, used), lit = new Map(going.map(x => [x.id, x.why]));
    const why = { always: 'Sent every reply', used: 'Used in the last reply', scene: 'The scene calls for it' };
    const row = (id, label, cue, from, value, isOwn = false) => `<div class="mw-mood mw-skill-row ${lit.has(id) ? 'is-lit' : ''}" data-skill-row="${id}" data-search="${esc(`${label} ${cue} ${from}`)}">
        <div class="mw-row-head"><label for="mw-skill-${id}">${lit.has(id) ? '✧ ' : ''}${esc(label)}</label><span data-skill-word>${value ? skillWord(value) : 'off'}</span><output for="mw-skill-${id}">${value}/10</output>
            <button type="button" class="mw-need-pin" data-skill-always="${id}" aria-pressed="${Boolean(always[id])}" title="${always[id] ? 'Stop sending it every reply' : 'Send it every reply, called for or not'}" aria-label="${always[id] ? `Stop always sending ${esc(label)}` : `Always send ${esc(label)}`}">${always[id] ? '◆' : '◇'}</button>${isOwn ? `<button type="button" class="mw-list" data-own-skill-remove="${id}" title="Remove" aria-label="Remove ${esc(label)}">×</button>` : ''}</div>
        <input id="mw-skill-${id}" type="range" min="0" max="10" step="1" value="${value}" ${isOwn ? 'data-own-skill' : 'data-skill'}="${id}" style="--mw-fill:${value * 10}%" aria-valuetext="${value} out of 10, ${value ? skillWord(value) : 'off'}">
        <small>${esc(cue)}${from ? ` · ${esc(from)}` : ''}${lit.has(id) ? ` · <b>${why[lit.get(id)]}</b>` : ''}</small></div>`;
    const chips = skillsOf(state).map(x => `<button type="button" data-skill-jump="${x.id}" class="mw-chip ${lit.has(x.id) ? 'is-lit' : ''}" style="--mw-accent:${SKILL_BY_ID[x.id]?.color ?? '#9fc0e8'}" title="${lit.has(x.id) ? `${why[lit.get(x.id)]}. ` : ''}Adjust ${esc(x.label)}"><span>${lit.has(x.id) ? '✧ ' : ''}${x.always ? '◆ ' : ''}${esc(x.label)}</span><b>${x.level}</b><i style="width:${x.level * 10}%"></i></button>`).join('');
    const groups = SKILL_CATEGORIES.map(([name, icon, color, rows]) => { const on = rows.filter(([id]) => set[id]).length;
        return `<details data-skill-group="${esc(name)}" style="--mw-accent:${color}"><summary><span class="mw-category-icon">${icon}</span><span>${esc(name)}</span><small>${on ? `${on} set` : rows.length}</small></summary><div class="mw-category-body">${rows.map(([id, label, cue, from]) => row(id, label, cue, from, set[id] ?? 0)).join('')}</div></details>`; }).join('');
    return `<div class="mw-summary"><div class="mw-section-label">${chips ? 'Skills' : 'No skills yet'}<span>${skillsOf(state).length} set</span></div>
        <div class="mw-chips">${chips || `<p>Nothing set. Pick a level out of 10 for anything ${whose} can do.</p>`}</div>
        <p class="mw-skill-now">${going.length ? `Going to Claude this reply: ${going.map(x => `${esc(x.label)} ${x.level}`).join(', ')}` : 'None going to Claude this reply. Each one waits until the scene calls for it.'}</p></div>
    <p class="mw-explainer">A skill only reaches Claude when the scene calls for it: its words turn up in your latest message or the last reply, or Claude says it was used. Then its level decides how attempts go, yours included. ◆ sends one every reply; ✧ means it’s going this reply.</p>
    <div class="mw-skill-opts"><label class="mw-field">Look back<select data-skill-lookback aria-label="How far back skills look">${[[1, 'Your message + the last reply'], [2, '+ the last 2 replies'], [3, '+ the last 3 replies']].map(([v, l]) => `<option value="${v}" ${settings().skillLookback === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <input type="search" data-skill-search placeholder="Find a skill…" aria-label="Search skills">
    <div class="mw-categories">${groups}
        <details data-skill-group="Your own" style="--mw-accent:#b9b3d6"><summary><span class="mw-category-icon">✎</span><span>Your own</span><small>${own.length || 'make one'}</small></summary><div class="mw-category-body">
            ${own.map(x => row(x.id, x.label, x.words ? `called for by: ${x.words}` : 'add words that call for it, or ◆ to always send it', 'yours', x.level, true)).join('')}
            <div class="mw-skill-add"><input type="text" data-skill-new-label maxlength="40" placeholder="Name it (e.g. Taxidermy)" aria-label="Skill name"><input type="text" data-skill-new-words maxlength="200" placeholder="Words that call for it: mount, stuffed, pelt*" aria-label="Words that call for it"><button type="button" data-action="skill-add">＋ Add skill</button></div>
            <p class="mw-fine">Separate words with commas. End a word with * to catch every ending (pelt* finds pelts and pelting).</p></div></details></div>
    <p class="mw-fine" data-skill-empty hidden>No matching skills.</p>`;
}
function filterSkills() {
    const input = panel?.querySelector('[data-skill-search]'); if (!input) return;
    const term = input.value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let shown = 0;
    panel.querySelectorAll('[data-skill-group]').forEach(group => {
        let visible = 0;
        group.querySelectorAll('[data-skill-row]').forEach(row => { row.hidden = Boolean(term) && !searchText(row).includes(term); if (!row.hidden) visible++; });
        group.hidden = Boolean(term) && !visible; if (term) group.open = visible > 0; shown += visible;
    });
    const none = panel.querySelector('[data-skill-empty]'); if (none) none.hidden = !term || shown > 0;
}
// ---- 1.41.0: clear everything for one person, with a way back ----
async function clearEverything(keepTypes) {
    const meta = ctx().chatMetadata?.[KEY], me = personKeyOfSubject();
    await changeState(s => {
        const pairs = Object.fromEntries(Object.entries(meta?.pairs ?? {}).filter(([, p]) => (p?.members ?? []).includes(me)));
        s.lastCleared = { at: Date.now(), state: structuredClone({ ...s, history: [], lastCleared: null }), pairs: structuredClone(pairs) };
        const blank = freshState({});
        for (const id of Object.keys(s.moods)) { s.moods[id] = 0; s.pins[id] = false; }
        Object.assign(s, { causes: {}, shows: {}, prefs: {}, custom: [], inventory: [], wants: [], relationships: [], skills: {}, skillAlways: {}, ownSkills: [], reason: '', targets: blank.targets, loadout: [] });
        if (!keepTypes) Object.assign(s, { personality: blank.personality, enneagram: blank.enneagram });
        for (const id of Object.keys(pairs)) delete meta.pairs[id];
    });
}
async function undoClear() {
    const meta = ctx().chatMetadata?.[KEY];
    await changeState(s => {
        const saved = s.lastCleared; if (!saved?.state) return;
        const history = s.history; Object.assign(s, saved.state, { history, lastCleared: null });
        for (const [id, p] of Object.entries(saved.pairs ?? {})) (meta.pairs ??= {})[id] = p;
    });
}
// 1.35.1: a redraw that fails shows the error in the panel, so ◆ Moods always opens and the cause is visible.
let lastDrawError = '';
// 1.36.0: a redraw that comes from the chat (a reply arriving, a swipe) waits while you're typing in
// the panel, so it can't wipe a half-written board correction or note. It runs when you leave the field.
// 1.38.1: a finger down in the panel (dragging a slider, mid-tap) holds it too, so the button under it isn't rebuilt.
let pointerInPanel = false, drawnPeer, drawnPairView;
const typingInPanel = () => { const a = document.activeElement; return pointerInPanel || Boolean(panel && a && panel.contains(a) && a.matches('textarea, input[type=text], input[type=search], input:not([type])')); };
function render(background = false) {
    if (!panel) return;
    if (background && panel.open && typingInPanel()) { renderLater = true; return; }
    renderLater = false;
    try { drawPanel(); lastDrawError = ''; } catch (err) {
        lastDrawError = String(err?.message ?? err);
        console.error('[Moodweaver] could not draw the panel', err);
        globalThis.toastr?.error(String(err?.message ?? err), 'Moodweaver hit an error', { preventDuplicates: true });
        const where = String(err?.stack ?? '').split('\n').find(l => /\.js:\d+/.test(l))?.trim() ?? '';
        panel.dataset.view = '';
        panel.innerHTML = `<div class="mw-top"><div class="mw-brand"><div class="mw-brand-text"><h2>Moodweaver</h2></div></div><div class="mw-top-actions"><button type="button" class="mw-close" data-action="close" aria-label="Close Moodweaver">×</button></div></div>
            <div class="mw-empty mw-error"><p>The panel hit an error while drawing. Nothing was changed or lost.</p><pre>${esc(err?.message ?? err)}${where ? `\n${esc(where)}` : ''}</pre><p class="mw-fine">A screenshot of this box is enough to track it down.</p></div>
            <div class="mw-footer">v${VERSION}</div>`;
    }
}
function drawPanel() {
    capturePanel(panel);
    const ch = target(), charState = getState(ch);
    if (charState) migratePairs(ch);
    if (who === 'cast' && !selectedCast()) who = 'char';
    const state = charState ? viewState() : null;
    if (who === 'story') tab = 'mood';
    if (tab === 'personality') tab = 'trait';
    if (tab === 'bond') tab = 'rel';
    const kind = who === 'story' ? 'story' : ['state', 'trait', 'turn'].includes(tab) ? tab : 'mood';
    const active = state ? activeMoods(state) : [];
    const live = charState ? liveFor(ch) : null;
    const relationshipCount = state && who !== 'story' ? peers().reduce((n, p) => n + (p.relation?.enabled !== false && p.relation ? activeRelationshipTags(p.relation).length : 0) + (p.pair ? activeSharedTags(p.pair).length : 0), 0) : 0;
    const counts = { mood: active.filter(m => sectionOf(m) === 'mood').length, trait: active.filter(m => sectionOf(m) === 'trait').length + activePersonalities(state).length, turn: Object.values(state?.prefs ?? {}).filter(Boolean).length,
        rel: relationshipCount, state: active.filter(m => m.kind === 'state' && sectionOf(m) === 'state').length,
        needs: who === 'user' ? (settings().youTrack && ch ? reactions(ch).condition.length : 0) : live?.needs.filter(n => n.known && n.value <= 35).length ?? 0,
        inv: (state?.inventory ?? []).filter(i => i.carried).length, wants: (state?.wants ?? []).filter(w => !w.done && w.value > 0).length, skills: state ? skillsOf(state).length : 0 };
    const peer = state && who !== 'story' ? currentPeer() : null;
    const view = JSON.stringify([identity(ch), who, who === 'cast' ? selectedCast()?.id : '', settingsOpen ? 'settings' : tab, browsing, tab === 'rel' ? peer?.key : '', tab === 'rel' ? pairView : '']);
    // 1.41.0: clearing the last thing set for someone can drop them from the people list, which used to count as
    // a new view and jump to the top. If you didn't pick another person or side, the redraw keeps your place.
    const coarse = JSON.stringify([identity(ch), who, who === 'cast' ? selectedCast()?.id : '', settingsOpen ? 'settings' : tab, browsing]);
    const oldView = panel.dataset.view, keepPlace = Boolean(oldView) && oldView !== view && panel.dataset.coarse === coarse && selectedPeer === drawnPeer && pairView === drawnPairView;
    const prevScroll = panel.scrollTop;
    const snapshot = savedPanel(keepPlace ? oldView : view), sameView = keepPlace || panel.dataset.view === view;
    panel.dataset.coarse = coarse; drawnPeer = selectedPeer; drawnPairView = pairView;
    search = snapshot?.searches['#mw-catalogue-search'] ?? '';
    panel.dataset.view = view;
    // The plumbob takes the lead moodlet's colour, or the board's mood when nothing is set by hand.
    const lead = active.find(m => sectionOf(m) === 'mood');
    const boardMood = live?.state.map(t => matchMood(t.text)).find(m => m && m.kind === 'mood');
    const plumbob = lead?.color ?? boardMood?.color ?? '#b5d9a6';
    // No chat open means no state: build nothing, or the person card throws and the panel never opens.
    const body = !state ? '' : settingsOpen ? settingsView(state)
        : `${personCard(ch, state, live)}${who === 'story' ? '' : tabBar(counts)}
        ${who !== 'story' && tab === 'inv' ? inventoryView(state, ch)
        : who === 'user' && tab === 'needs' ? youView(state, ch, live)
        : who !== 'story' && tab === 'needs' ? boardView({ needOpts: needOpts(), live, send: boardSend(), sync: settings().boardPresent, charName: ch.name, userName: playerName(), people: boardPeople(ch), editing: boardEditing && settings().boardPins, focus: boardFocus, pinsOn: settings().boardPins, memoriesOn: settings().boardMemories, withWeave: settings().boardWithWeave, weaveOn: bondData(ch).on, savedMemories: boardMemoryCount(ch) })
        : who !== 'story' && tab === 'wants' ? wantsView(state, ch)
        : who !== 'story' && tab === 'skills' ? skillsView(state, ch)
        : who !== 'story' && tab === 'rel' ? (who === 'char' && peer?.key === '{{user}}' ? bondView({ bond: bondData(ch), charName: shortName(ch.name), userName: shortName(playerName()), chatLength: Infinity, axes: bondAxes(ch), list: bondList(ch), tally: reactionTally(ch), canRead: Boolean(readerProfile()), pending: Boolean(pending), savedPool: settings().dynamicPools?.[`char:${ch.avatar}`] ?? null, overlaps: overlapNames(bondOverlaps(ch, effectiveChat(ctx().chat ?? [])), shortName(ch.name), shortName(playerName())) }) : '') + relationshipView({
            peerExtra: who === 'char' && bondData(ch).on ? { '{{user}}': bondMini(bondData(ch), Infinity, bondAxes(ch), bondList(ch)) } : {}, subject: subjectName(), peers: peers(), selectedKey: peer?.key, relation: peer?.relation, pair: peer?.pair, view: pairView, selfKey: personKeyOfSubject(), otherKey: peer ? keyForTarget(peer.key) : '', knowledge: getKnowledge(ch), isPlayer: who === 'user', focus: ch.name, openGroups: openRelationGroups, swapLabel: peer && swapTarget(peer) ? `${peer.name}’s side` : '', removing: removingRelation })
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
    renderPreview(); filterSkills(); restorePanelPosition(panel, snapshot, sameView); if (keepPlace && !panel.querySelector(snapshot?.anchor || '[data-none]')) panel.scrollTop = prevScroll; toggleTop();
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
// 1.35.2: every press writes what happened under the Open mood panel button in Extensions, so a phone
// with no console can still show why the panel isn't visible.
function note(text, bad = false) {
    const d = document.querySelector('[data-mw-diag]'); if (!d) return;
    d.hidden = false; d.textContent = text; d.classList.toggle('is-bad', bad);
}
const describe = el => { const chain = []; for (let e = el; e && e !== document.documentElement && chain.length < 3; e = e.parentElement) chain.push(e.localName + (e.id ? `#${e.id}` : '') + (e.classList.length ? `.${[...e.classList].slice(0, 2).join('.')}` : '')); return chain.join(' in ') || 'unknown'; };
function panelReport(showError) {
    const lines = [`v${VERSION} from “${folderOf(SELF)}”`];
    if (!panel?.isConnected) return [...lines, 'The panel is missing from the page.'].join('\n');
    const cs = getComputedStyle(panel), r = panel.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    lines.push(`open: ${panel.open ? 'yes' : 'no'}`);
    if (lastDrawError) lines.push(`drawing failed: ${lastDrawError}`);
    if (showError) lines.push(`showing failed: ${showError}`);
    lines.push(`box: left ${Math.round(r.left)}, top ${Math.round(r.top)}, ${Math.round(r.width)}×${Math.round(r.height)} on a ${vw}×${vh} screen`);
    lines.push(`style: display ${cs.display}, visibility ${cs.visibility}, opacity ${cs.opacity}, z-index ${cs.zIndex}, position ${cs.position}`);
    const x = Math.min(vw - 2, Math.max(1, r.left + r.width / 2)), y = Math.min(vh - 2, Math.max(1, r.top + Math.min(40, r.height / 2)));
    const hit = document.elementFromPoint(x, y);
    lines.push(`on top there: ${!hit ? 'nothing' : panel.contains(hit) ? 'the panel' : describe(hit)}`);
    return lines.join('\n');
}
function openPanel() {
    note('Pressed. Opening…');
    if (suspended) { note('Moodweaver is switched off in Manage extensions.', true); globalThis.toastr?.info('Moodweaver is switched off. Turn it back on in Manage extensions.'); return; }
    let showError = '';
    try {
        render();
        if (!panel.open) { panel.show(); panel.focus({ preventScroll: true }); }
    } catch (err) {
        showError = String(err?.message ?? err);
        try { panel.setAttribute('open', ''); } catch { /* nothing else to try */ }
        console.error('[Moodweaver] could not open the panel', err);
        globalThis.toastr?.error(showError, 'Moodweaver could not open');
    }
    void syncPrompt();
    // Quiet when it worked; a report under the button only when something's wrong.
    setTimeout(() => {
        try {
            const text = panelReport(showError), d = document.querySelector('[data-mw-diag]');
            if (lastDrawError || showError || !/on top there: the panel/.test(text)) note(text, true); else if (d) d.hidden = true;
        } catch (err) { note(`Report failed: ${err?.message ?? err}`, true); }
    }, 120);
}
// ---- 1.36.0: the ◆ Moods button, set per device ----
// Show or hide it, make it small, and drag it anywhere. Kept in this browser only, so hiding it on
// your phone doesn't hide it on your computer. The ✨ wand menu, /moods and Extensions always open
// the panel, so a hidden button never locks you out.
const LAUNCH_KEY = 'moodweaver.launcher';
const launch = (() => {
    const base = { show: true, small: false, x: null, y: null };
    try { const saved = JSON.parse(localStorage.getItem(LAUNCH_KEY) || '{}'); return { ...base, ...(saved && typeof saved === 'object' ? saved : {}) }; } catch { return base; }
})();
function saveLaunch() { try { localStorage.setItem(LAUNCH_KEY, JSON.stringify(launch)); } catch { /* private browsing: kept for this visit */ } syncLaunchControls(); }
let dragEndedAt = 0;
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
function placeLauncher() {
    const el = document.getElementById('moodweaver-launcher'); if (!el) return;
    el.hidden = suspended || !launch.show;
    el.classList.toggle('is-small', Boolean(launch.small));
    el.innerHTML = `<span aria-hidden="true">◆</span>${launch.small ? '' : ' Moods'}`;
    if (el.hidden || launch.x == null || launch.y == null) { el.classList.remove('is-placed'); el.style.left = ''; el.style.top = ''; return; }
    el.classList.add('is-placed');
    const b = launchBounds(el);
    moveLauncher(el, b.minX + (b.maxX - b.minX) * clamp(launch.x, 0, 1), b.minY + (b.maxY - b.minY) * clamp(launch.y, 0, 1));
}
function wireLauncher(el) {
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
        dragEndedAt = Date.now();
        const r = el.getBoundingClientRect(), b = launchBounds(el);
        launch.x = b.maxX > b.minX ? clamp((r.left - b.minX) / (b.maxX - b.minX), 0, 1) : 0;
        launch.y = b.maxY > b.minY ? clamp((r.top - b.minY) / (b.maxY - b.minY), 0, 1) : 0;
        saveLaunch();
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    // The tap that ends a drag isn't a press.
    el.addEventListener('click', e => { if (Date.now() - dragEndedAt < 350) { e.preventDefault(); e.stopImmediatePropagation(); return; } openPanel(); });
    let frame = 0;
    const replace = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(placeLauncher); };
    window.addEventListener('resize', replace); window.addEventListener('orientationchange', replace);
}
function setLaunch(changes) {
    Object.assign(launch, changes); saveLaunch(); placeLauncher();
}
// The switches in Extensions and in the panel's settings show the same thing.
function syncLaunchControls() {
    for (const box of document.querySelectorAll('[data-launch="show"]')) box.checked = Boolean(launch.show);
    for (const box of document.querySelectorAll('[data-launch="small"]')) box.checked = Boolean(launch.small);
}
const launchSettings = () => `<label class="mw-toggle"><input type="checkbox" data-launch="show" ${launch.show ? 'checked' : ''}> Show the ◆ Moods button</label>
    <label class="mw-toggle"><input type="checkbox" data-launch="small" ${launch.small ? 'checked' : ''}> Small button (just ◆)</label>
    <p class="mw-fine">Drag the button anywhere to move it. This device remembers where. With it hidden, open Moodweaver from the ✨ wand menu next to the message box, with /moods, or from Extensions.</p>
    <div class="mw-actions"><button type="button" data-action="launch-reset"${launch.x == null ? ' disabled' : ''}>Put it back in the corner</button></div>`;
// A ◆ Moodweaver row in SillyTavern's ✨ wand menu.
function addWandItem() {
    if (document.getElementById('moodweaver-wand')) return true;
    const menu = document.getElementById('extensionsMenu'); if (!menu) return false;
    const item = document.createElement('div');
    item.id = 'moodweaver-wand'; item.className = 'list-group-item flex-container flexGap5'; item.title = 'Open Moodweaver'; item.tabIndex = 0;
    item.innerHTML = '<div class="extensionsMenuExtensionButton fa-solid fa-gem"></div><span>Moodweaver</span>';
    item.hidden = suspended;
    item.addEventListener('click', () => openPanel());
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); } });
    menu.append(item);
    document.getElementById('extensionsMenuButton')?.style.removeProperty('display');
    return true;
}
// /moods opens the panel. /moods button on|off|small|big|reset changes the ◆ button on this device.
function addSlashCommand() {
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
function warnDuplicate(existing) {
    const other = existing.dataset.source ? `v${existing.dataset.version} in “${folderOf(existing.dataset.source)}”` : 'an older copy';
    const msg = `Two copies of Moodweaver are installed. ${other} is the one running, so v${VERSION} in “${folderOf(SELF)}” is switched off. Delete the other one in Manage extensions, then reload.`;
    console.warn('[Moodweaver]', msg);
    globalThis.toastr?.warning(msg, 'Moodweaver', { timeOut: 0, extendedTimeOut: 0 });
    const show = () => { const entry = document.querySelector('.mw-settings-entry'); if (entry && !entry.querySelector('.mw-dup')) entry.insertAdjacentHTML('beforeend', `<p class="mw-diag mw-dup is-bad">${esc(msg)}</p>`); };
    show(); setTimeout(show, 1500);
}
function setup() {
    const existing = document.getElementById('moodweaver-panel');
    if (existing) { if (existing.dataset.source !== SELF) warnDuplicate(existing); return; }
    settings();
    panel = document.createElement('dialog'); panel.id = 'moodweaver-panel'; panel.className = 'mw-panel'; panel.tabIndex = -1;
    panel.setAttribute('aria-label', 'Moodweaver character moods'); panel.dataset.version = VERSION; panel.dataset.source = SELF; document.body.append(panel);
    const probe = document.createElement('div'); probe.id = 'moodweaver-safe'; probe.setAttribute('aria-hidden', 'true'); document.body.append(probe);
    const launcher = document.createElement('button'); launcher.id = 'moodweaver-launcher'; launcher.type = 'button';
    launcher.title = 'Open Moodweaver (drag to move)'; launcher.setAttribute('aria-label', 'Open Moodweaver'); launcher.setAttribute('aria-controls', panel.id);
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
    const later = () => setTimeout(() => { if (renderLater && !typingInPanel()) render(); }, 350);
    panel.addEventListener('focusout', later);
    panel.addEventListener('pointerdown', () => { pointerInPanel = true; }, { passive: true });
    for (const type of ['pointerup', 'pointercancel']) window.addEventListener(type, () => { if (pointerInPanel) { pointerInPanel = false; later(); } }, { passive: true });
    panel.addEventListener('scroll', toggleTop, { passive: true });
    panel.addEventListener('input', e => {
        if (e.target.hasAttribute('data-filter-list')) { filterLocalLists(); return; }
        if (e.target.hasAttribute('data-skill-search')) { filterSkills(); return; }
        if (e.target.dataset.skill !== undefined || e.target.dataset.ownSkill !== undefined) {
            const v = Number(e.target.value), row = e.target.closest('.mw-skill-row');
            if (row) { put(row, 'output', `${v}/10`); put(row, '[data-skill-word]', v ? skillWord(v) : 'off'); }
            e.target.style.setProperty('--mw-fill', `${v * 10}%`); return;
        }
        if (e.target.dataset.maker && maker) {
            const f = e.target.dataset.maker; maker.draft[f] = f === 'dark' ? e.target.checked : e.target.value;
            if (f === 'group') lastGroup[maker.kind] = e.target.value;
            const q = panel.querySelector('[data-maker-preview]'); if (q) q.textContent = makerPreview(makerDraft()); return;
        }
        if (e.target.dataset.wantValue !== undefined || e.target.dataset.field === 'follow') {
            const v = Number(e.target.value), row = e.target.closest('.mw-mood');
            if (row) { put(row, 'output', `${v}%`); put(row, '[data-lvl]', level(v)); e.target.style.setProperty('--mw-fill', `${v}%`); }
            else { put(panel, '[data-follow-out]', `${v}%`); e.target.style.setProperty('--mw-fill', `${(v - 10) / .9}%`); }
            return;
        }
        if (e.target.hasAttribute('data-dyn-search')) {
            const q = e.target.value.trim().toLowerCase();
            panel.querySelectorAll('.mw-dyn-group').forEach(g => {
                let hits = 0;
                g.querySelectorAll('[data-dyn-row]').forEach(r => { const show = !q || r.dataset.dynRow.includes(q); r.hidden = !show; if (show) hits++; });
                g.hidden = Boolean(q) && !hits && !g.querySelector('[data-dyn-own-name]'); if (q && hits) g.open = true;
            });
            return;
        }
        if (e.target.dataset.moreMeter) { const v = Number(e.target.value); e.target.style.setProperty('--mw-fill', `${e.target.dataset.two === '1' ? (v + 100) / 2 : v}%`); return; }
        if (e.target.dataset.desireBar) { e.target.style.setProperty('--mw-fill', `${e.target.value}%`); return; }
        if (e.target.dataset.bondMeter) {
            const key = e.target.dataset.bondMeter, v = Number(e.target.value);
            e.target.style.setProperty('--mw-fill', `${(v + 100) / 2}%`);
            const out = panel.querySelector(`[data-bond-out="${key}"]`); if (out) out.textContent = v;
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
        if (e.target.dataset.pairSlider || e.target.dataset.compareSlider || e.target.dataset.custom !== undefined || e.target.dataset.mem !== undefined) {
            const value = Number(e.target.value), row = e.target.closest('.mw-mood');
            put(row, 'output', `${value}%`); put(row, '[data-lvl]', level(value));
            e.target.style.setProperty('--mw-fill', `${value}%`); return;
        }
        if (e.target.dataset.relSlider) {
            const id = e.target.dataset.relSlider, value = Number(e.target.value);
            const row = e.target.closest('.mw-mood');
            put(row, 'output', `${value}%`); put(row, '[data-lvl]', level(value));
            e.target.style.setProperty('--mw-fill', `${value}%`); e.target.setAttribute('aria-valuetext', `${value} percent, ${level(value)}`); return;
        }
        if (e.target.matches('.mw-search')) { search = e.target.value; filterRows(); return; }
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
        if (sourceId && who === 'user' && (BY_ID[sourceId] || sourceId.startsWith('turn:') && TURN_BY_ID[sourceId.slice(5)] || ['personality', 'enneagram'].includes(sourceId))) {
            const knowledge = getKnowledge(target(), true);
            knowledge[sourceId] = knowledgeEntry({ ...knowledgeEntry(knowledge[sourceId]), source: e.target.value });
            // Keep the draft in metadata before any other control can redraw the panel.
            void persist(); void syncPrompt(); return;
        }
        if (e.target.dataset.slider) {
            const id = e.target.dataset.slider, value = Number(e.target.value);
            put(panel, `[data-value="${id}"]`, `${value}%`);
            put(panel, `[data-level="${id}"]`, level(value));
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
        if (input.dataset.skill !== undefined) { const id = input.dataset.skill, v = Number(input.value); await changeState(s => { s.skills = cleanSkills(s.skills); if (v > 0) s.skills[id] = v; else delete s.skills[id]; }); return; }
        if (input.dataset.ownSkill !== undefined) { const id = input.dataset.ownSkill, v = Number(input.value); await changeState(s => { s.ownSkills = cleanOwnSkills(s.ownSkills).map(x => x.id === id ? { ...x, level: v } : x); }); return; }
        if (input.hasAttribute('data-skill-lookback')) { const c = ctx(); settings(); c.extensionSettings[KEY].skillLookback = Number(input.value) || 1; c.saveSettingsDebounced(); await syncPrompt(); render(); return; }
        if (input.dataset.launch === 'show') { setLaunch({ show: input.checked }); return; }
        if (input.dataset.launch === 'small') { setLaunch({ small: input.checked }); return; }
        if (input.dataset.need) { const id = input.dataset.need, v = Number(input.value); await editBoard(b => { b.needs[id] = v; }); return; }
        if (input.hasAttribute('data-board-send')) { await editBoard(b => { b.send = input.checked; }); return; }
        if (input.hasAttribute('data-board-horny')) { await editBoard(b => { b.includeHorny = input.checked; }); return; }
        if (input.dataset.bondMeter) { const key = input.dataset.bondMeter, v = Number(input.value); await editBond((b, list) => setMeter(b, key, v, list)); return; }
        if (input.hasAttribute('data-bond-on')) { await editBond(b => { b.on = input.checked; }); return; }
        // 1.39.1: the desire card.
        if (input.hasAttribute('data-mood-auto')) { await changeState(s => { s.moodAuto = input.checked; }); return; }
        if (input.hasAttribute('data-mood-fade')) { await changeState(s => { s.moodFade = input.checked; }); return; }
        if (input.hasAttribute('data-mood-scope')) { await changeState(s => { s.moodScope = input.value === 'list' ? 'list' : 'any'; }); return; }
        if (input.hasAttribute('data-mood-pace')) { await changeState(s => { s.moodPace = MOOD_PACE[input.value] ? input.value : 'steady'; }); return; }
        if (input.hasAttribute('data-desire-on')) { await editBond(b => { b.desire = { ...cleanDesire(b.desire), on: input.checked }; }); return; }
        if (input.hasAttribute('data-desire-pace')) { await editBond(b => { b.desire = { ...cleanDesire(b.desire), pace: input.value }; }); return; }
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
        if (input.dataset.relKnowledge && who === 'user' && RELATIONSHIP_BY_ID[input.dataset.relKnowledge]) {
            const relation = selectedRelation(); if (!relation) return;
            const knowledge = getKnowledge(target(), true), key = relationshipKey(relation, input.dataset.relKnowledge);
            if (input.value === 'scene') delete knowledge[key]; else knowledge[key] = knowledgeEntry({ ...knowledge[key], mode: input.value });
            await persist(); await syncPrompt(); render(); return;
        }
        if (input.dataset.target) return;
        const knowledgeId = input.dataset.knowledge || input.dataset.knowledgeSource;
        if (knowledgeId && who === 'user' && (['personality', 'enneagram'].includes(knowledgeId) || TURN_BY_ID[knowledgeId.replace(/^turn:/, '')] && knowledgeId.startsWith('turn:') || BY_ID[knowledgeId] && BY_ID[knowledgeId].kind !== 'story')) {
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
        if (field === 'recipe') { const recipe = (who === 'story' ? STORY_RECIPES : RECIPES)[input.value]; if (recipe) await changeState(s => { for (const [k, v] of Object.entries(recipe)) if (!s.pins[k] && BY_ID[k]) { s.moods[k] = v; if (!s.loadout.includes(k)) s.loadout.push(k); } }); return; }
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
        if (button.dataset.boardUnpin) { const key = button.dataset.boardUnpin; await editBoard(b => { delete b.fix[key]; }); return; }
        if (button.dataset.dynMode) {
            const mode = button.dataset.dynMode, ch = target();
            const now = computeBond(bondData(ch), Infinity, shortName(ch.name), shortName(playerName()), bondAxes(ch), bondList(ch)).dynamic.key;
            await editBond(b => { if (mode === 'pick') b.fixed = b.fixed || now; else { b.fixed = ''; b.mode = mode; } }); return;
        }
        if (button.dataset.dynGroupAll) {
            const names = dynamicRows().filter(r => (r[3] ?? 'own') === button.dataset.dynGroupAll).map(r => r[0]);
            await editBond(b => { const all = names.every(x => b.pool.includes(x)); b.pool = all ? b.pool.filter(x => !names.includes(x)) : [...new Set([...b.pool, ...names])]; }); return;
        }
        if (button.dataset.dynOwnRemove) {
            const name = button.dataset.dynOwnRemove;
            settings().ownDynamics = cleanOwnDynamics(settings().ownDynamics.filter(x => x.name !== name)); setOwnDynamics(settings().ownDynamics); ctx().saveSettingsDebounced();
            await editBond(b => { b.pool = b.pool.filter(x => x !== name); if (b.fixed === name) b.fixed = ''; }); return;
        }
        // 1.43.0: turn off the extra copies of a doubled-up idea (or all of them). Meters, the dynamic and
        // moodlets stay as they are; only the sliders, both-ways tags and story tropes the note was skipping go to 0.
        if (button.dataset.overlapTidy !== undefined) {
            const ch = target(), only = button.dataset.overlapTidy, st = getState(ch), story = getStoryState(ch);
            const list = bondOverlaps(ch, effectiveChat(ctx().chat ?? [])).filter(o => !only || o.key === only).map(o => ({ ...o, drop: o.drop.filter(x => !feedsMeters(x)) }));
            const ids = droppedIds(list), rel = st ? userRelation(st) : null, pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')];
            for (const id of ids.rel) if (rel?.moods) rel.moods[id] = 0;
            for (const id of ids.shared) if (pair?.moods) pair.moods[id] = 0;
            for (const id of ids.story) if (story?.moods) story.moods[id] = 0;
            const count = ids.rel.size + ids.shared.size + ids.story.size;
            status = count ? `Turned off ${count} extra cop${count === 1 ? 'y' : 'ies'}. Each idea now lives in one place.` : 'Nothing doubled up to tidy.';
            if (ids.story.size && story) story.revision = (story.revision || 0) + 1;
            await persist(ids.rel.size ? st : null); await syncPrompt(); render(); renderStatus(); return;
        }
        if (['dyn-pool-save', 'dyn-pool-load', 'dyn-pool-clear', 'dyn-own-add', 'bond-reread'].includes(button.dataset.action)) {
            const ch = target(), key = `char:${ch?.avatar}`, act = button.dataset.action;
            if (act === 'bond-reread') { await readBond(ch); return; }
            if (act === 'dyn-pool-save') { settings().dynamicPools[key] = [...bondData(ch).pool]; ctx().saveSettingsDebounced(); status = `Saved ${bondData(ch).pool.length} picks for ${ch.name}’s new chats.`; renderStatus(); return; }
            if (act === 'dyn-pool-load') { const saved = settings().dynamicPools?.[key] ?? []; await editBond(b => { b.pool = [...saved]; }); return; }
            if (act === 'dyn-pool-clear') { await editBond(b => { b.pool = []; }); return; }
            const name = String(panel.querySelector('[data-dyn-own-name]')?.value ?? '').trim(), cue = String(panel.querySelector('[data-dyn-own-cue]')?.value ?? '').trim();
            if (!name || !cue) { status = 'Give your dynamic a name and say what it looks like.'; renderStatus(); return; }
            if (dynamicRows().some(r => r[0].toLowerCase() === name.toLowerCase())) { status = 'There’s already a dynamic with that name.'; renderStatus(); return; }
            settings().ownDynamics = cleanOwnDynamics([...settings().ownDynamics, { name, cue }]); setOwnDynamics(settings().ownDynamics); ctx().saveSettingsDebounced();
            await editBond(b => { b.pool = [...b.pool, name]; }); status = `${name} added to your dynamics and picked for these two.`; renderStatus(); return;
        }
        if (button.dataset.morePreset !== undefined) {
            const pick = MORE_PRESETS.find(([name]) => name === button.dataset.morePreset)?.[1] ?? [];
            await editBond(b => { const d = cleanMore(b.more); d.on = [...pick]; b.more = d; }); return;
        }
        if (button.dataset.morePin) {
            const key = button.dataset.morePin;
            await editBond((b, list) => {
                const d = b.more = cleanMore(b.more);
                if (d.pins[key] === null) d.pins[key] = Number(panel.querySelector(`[data-more-meter="${key}"]`)?.value ?? 0);
                else { const v = d.pins[key]; d.pins[key] = null; setMore(b, key, v, list); }
            });
            return;
        }
        if (button.dataset.comboRemove) { const id = button.dataset.comboRemove; await changeState(s => { s.combos = cleanCombos(s.combos).filter(c => c.id !== id); }); return; }
        if (button.dataset.desirePin) {
            const key = button.dataset.desirePin;
            await editBond((b, list) => {
                const d = b.desire = cleanDesire(b.desire);
                if (d.pins[key] === null) d.pins[key] = Number(panel.querySelector(`[data-desire-bar="${key}"]`)?.value ?? 0);
                else { const v = d.pins[key]; d.pins[key] = null; setDesire(b, key, v, list); }
            });
            return;
        }
        if (button.dataset.bondPin) {
            const key = button.dataset.bondPin;
            // Unpinning leaves the meter where it was pinned; later replies move it from there.
            await editBond((b, list) => {
                if (b.pins[key] === null) b.pins[key] = Number(panel.querySelector(`[data-bond-meter="${key}"]`)?.value ?? 0);
                else { const v = b.pins[key]; b.pins[key] = null; setMeter(b, key, v, list); }
            }); return;
        }
        if (button.dataset.skillAlways) { const id = button.dataset.skillAlways; await changeState(s => { const a = cleanAlways(s.skillAlways); if (a[id]) delete a[id]; else a[id] = true; s.skillAlways = a; }); return; }
        if (button.dataset.ownSkillRemove) { const id = button.dataset.ownSkillRemove; await changeState(s => { s.ownSkills = cleanOwnSkills(s.ownSkills).filter(x => x.id !== id); const a = cleanAlways(s.skillAlways); delete a[id]; s.skillAlways = a; }); return; }
        if (button.dataset.skillJump) { const row = panel.querySelector(`[data-skill-row="${CSS.escape(button.dataset.skillJump)}"]`); if (row) { const fold = row.closest('details'); if (fold) fold.open = true; row.scrollIntoView({ block: 'center', behavior: 'smooth' }); } return; }
        if (button.dataset.bondMute) {
            const text = button.dataset.bondMute;
            await editBond(b => { b.own = b.own.filter(t => t.toLowerCase() !== text.toLowerCase()); b.muted.push(text.toLowerCase()); }); return;
        }
        if (button.dataset.action === 'bond-add') {
            const text = String(panel.querySelector('[data-bond-new]')?.value ?? '').trim(); if (!text) return;
            await editBond(b => { b.own.push(text); b.muted = b.muted.filter(t => t !== text.toLowerCase()); }); return;
        }
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
        if (button.dataset.action === 'mood-undo-last') {
            const ch = target(), st = getState(ch), rec = lastMoodRec(ch); if (!st || !rec) return;
            const back = untrack(moodTarget(st), rec.m);
            if (rec.q) st.moodQuiet = structuredClone(rec.q);
            // Kept in the record (so the reply isn't applied again), with nothing left to apply.
            rec.m = {}; rec.f = []; rec.undone = true; st.revision = (st.revision || 0) + 1;
            status = back.length ? `Undid what the last reply did to ${back.length} feeling${back.length === 1 ? '' : 's'}.` : 'Nothing to undo: those feelings were changed by hand since.';
            await persist(st); await syncPrompt(); render(); renderStatus(); return;
        }
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
        // 1.39.0: the story's suggestions and its "came true" calls.
        if (button.dataset.wantSuggest) { const t = button.dataset.wantSuggest; await changeState(s => { s.wants = cleanWants([...s.wants, { id: newId(), kind: 'want', text: t, value: 55 }]); }); return; }
        if (button.dataset.wantDismiss) { const t = button.dataset.wantDismiss; await changeState(s => { s.wantsDismissed = [...new Set([...(s.wantsDismissed ?? []), t.toLowerCase()])].slice(-40); }); return; }
        if (button.dataset.wantNotyet) { const id = button.dataset.wantNotyet, at = Number(button.dataset.at); await changeState(s => { const w = s.wants.find(x => x.id === id); if (w) w.after = at; }); return; }
        if (button.dataset.tab) { tab = button.dataset.tab; search = ''; browsing = false; removingRelation = ''; maker = null; render(); return; }
        if (button.dataset.pin) { await changeState(s => { s.pins[button.dataset.pin] = !s.pins[button.dataset.pin]; }); return; }
        if (button.dataset.jump) {
            clearPanelSearch(panel, '.mw-search'); search = ''; if (who !== 'story') tab = button.dataset.jump.startsWith('turn:') ? 'turn' : sectionOf(BY_ID[button.dataset.jump]); render();
            const row = panel.querySelector(`[data-mood="${button.dataset.jump}"]`); if (!row) return;
            const category = row.closest('details'); if (category) category.open = true;
            row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.querySelector('input')?.focus({ preventScroll: true }); return;
        }
        switch (button.dataset.action) {
            case 'relation-add': {
                try {
                    const typed = castName(panel.querySelector('[data-relation-new]')?.value ?? '');
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
            case 'launch-reset': setLaunch({ x: null, y: null, show: true }); render(); break;
            case 'board-memories-delete': {
                const ch = target(), pair = getPair(`char:${ch?.avatar}`, 'user'), n = boardMemoryCount(ch); if (!pair || !n) break;
                if (!confirm(`Delete the ${n} memor${n === 1 ? 'y' : 'ies'} the board saved for ${ch.name} and ${playerName()}? Memories you added or edited stay.`)) break;
                pair.memories = pair.memories.filter(m => !untouchedMemory(m));
                status = `Deleted ${n} saved memor${n === 1 ? 'y' : 'ies'}.`; await persist(); await syncPrompt(); render(); break;
            }
            case 'unpin-all': {
                const n = pinCounts(), words = n ? pinWords(n) : ''; if (!words) break;
                if (!confirm(`Unpin everything in this chat? That's ${words}. Values stay where they are and can move again.`)) break;
                status = `Unpinned ${await clearAllPins()}.`; renderStatus(); break;
            }
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
                if (saved) { const fold = saved.closest('details'); if (fold) fold.open = true; saved.scrollIntoView({ block: 'center' }); }
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
            case 'combo-add': {
                const val = sel => panel.querySelector(sel)?.value?.trim() ?? '';
                const combo = { id: newId(), a: val('[data-combo-a]'), b: val('[data-combo-b]'), name: val('[data-combo-name]'), text: val('[data-combo-text]') };
                if (!combo.a || !combo.b || !combo.name) { status = 'A combo needs two things and a name.'; renderStatus(); break; }
                await changeState(s => { s.combos = cleanCombos([...cleanCombos(s.combos), combo]); }); break;
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
                    relation.target = validRelationName(panel.querySelector('[data-relation-target]')?.value ?? '', relation.id);
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
                    const person = addCastMember(getCast(), panel.querySelector('[data-cast-new]')?.value ?? '', newCastId(), [playerName(), ...members().map(ch => ch.name)]);
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
            case 'close': { panel.close(); const l = document.getElementById('moodweaver-launcher'); if (l && !l.hidden) l.focus({ preventScroll: true }); break; }
            case 'cancel': cancelAnalysis(); break;
            case 'analyse': await analyse(true); break;
            case 'clear': {
                const whose = who === 'user' ? `${playerName()}’s` : who === 'story' ? 'the story’s' : `${who === 'cast' ? selectedCast()?.name : target()?.name}’s`;
                const kind = who === 'story' ? 'story' : ['trait', 'turn', 'state'].includes(tab) ? tab : 'mood';
                const what = { mood: 'moodlets', trait: 'traits', turn: 'turn-ons and turn-offs', state: 'facts', story: 'story settings' }[kind];
                if (!confirm(`Clear ${whose} ${what}? Their sliders go to 0 and pins come off. Everything in the other tabs stays, and the list stays so you can set a new scene quickly.`)) break;
                await changeState(s => clearSection(s, kind)); break;
            }
            case 'skill-add': {
                const label = String(panel.querySelector('[data-skill-new-label]')?.value ?? '').trim(); if (!label) break;
                const words = String(panel.querySelector('[data-skill-new-words]')?.value ?? '').trim();
                await changeState(s => { s.ownSkills = cleanOwnSkills([...(s.ownSkills ?? []), { label, words, level: 5 }]); }); break;
            }
            case 'clear-everything': {
                const keep = panel.querySelector('[data-keep-types]')?.checked !== false, whose = who === 'story' ? 'the story' : subjectName();
                if (!confirm(`Clear everything set for ${whose} in this chat? Moodlets, traits, turn-ons, facts, wants, items, skills, your own rows and relationships all go, pins too. ${keep ? 'Personality types stay.' : 'Personality types go too.'} “Bring it back” undoes it until you clear again.`)) break;
                await clearEverything(keep); status = `Cleared everything for ${whose}.`; renderStatus(); break;
            }
            case 'clear-undo': await undoClear(); status = 'Brought back what was cleared.'; renderStatus(); break;
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
        generating = false; resyncAfter = false; clearTimeout(genTimer);
        ++promptVersion; c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        render(); void syncPrompt();
        // Bring the newly opened chat up to date (and move it from older versions) straight away.
        queueBoard();
    });
    c.eventSource.on(c.eventTypes.GENERATION_STOPPED, () => { cancelAnalysis(); stopGenerating(); queueBoard(); });
    c.eventSource.on(c.eventTypes.GENERATION_ENDED, () => { stopGenerating(); queueBoard(); });
    for (const event of ['MESSAGE_RECEIVED', 'CHARACTER_MESSAGE_RENDERED', 'MESSAGE_SWIPED', 'MESSAGE_SWIPE_DELETED', 'MESSAGE_EDITED', 'MESSAGE_UPDATED', 'MESSAGE_DELETED', 'CHARACTER_FIRST_MESSAGE_SELECTED']) {
        if (c.eventTypes[event]) c.eventSource.on(c.eventTypes[event], queueBoard);
    }
    c.eventSource.on(c.eventTypes.GENERATION_AFTER_COMMANDS, (type, _args, dryRun) => {
        if (['quiet', 'impersonate'].includes(type)) { ++promptVersion; c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1); }
        else if (dryRun) return syncPrompt(true);
    });
    for (const event of ['CONNECTION_PROFILE_CREATED', 'CONNECTION_PROFILE_DELETED', 'CONNECTION_PROFILE_UPDATED']) {
        if (c.eventTypes[event]) c.eventSource.on(c.eventTypes[event], () => { if (panel.open) render(true); });
    }
    render(); void syncPrompt();
}
// jQuery ready also works when installed after APP_READY has fired.
if (typeof jQuery === 'function') jQuery(setup); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();

export { analyse, getState, getKnowledge, getCast, saveCastDefault, loadCastDefault, syncPrompt, boardChanged, reconcile, stopGenerating, bondData, bondList, clearAllPins, pinCounts, readBond };

export function onDisable() {
    suspended = true; ++promptVersion; cancelAnalysis();
    ctx().setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
    panel?.close();
    for (const node of document.querySelectorAll('#moodweaver-panel, #moodweaver-launcher, #moodweaver-wand, .mw-settings-entry')) node.hidden = true;
}
export function onEnable() {
    suspended = false;
    if (!panel) setup();
    for (const node of document.querySelectorAll('#moodweaver-panel, #moodweaver-wand, .mw-settings-entry')) node.hidden = false;
    placeLauncher(); queueBoard();
    void syncPrompt();
}
