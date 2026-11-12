// This chat's Moodweaver data: who's in the chat, each person's saved state, the cast,
// relationships between people, and saving.
import { untouchedMemory } from './replies.js';
import { settings } from './settings.js';
import { KEY, ctx, run, ui } from './state.js';
import { castDefaults, castFor, castName, newCastId } from '../engine/cast.js';
import { MOODS } from '../data/catalogue.js';
import { escapeHtml as esc } from '../engine/util.js';
import { extendCatalogue, freshState, isExtended, knowledgeEntry, migrateCatalogue } from '../engine/state.js';
import { renderStatus } from '../panel/render.js';
import { SHARED_IDS, activeSharedTags, cloneRelationships } from '../engine/relationships.js';
import { TURN_BY_ID } from '../engine/turns.js';

export const openRelationGroups = new Set(), autoOpened = new Set();
export const relationshipList = () => { const state = viewState(); return state ? (state.relationships ??= []) : []; };
// Everyone this person could feel something about: the main character, you, the rest of a group chat,
// the cast, and anyone typed in by hand. Nobody has to be added first.
const relationFor = key => { const want = resolveRelationName(key).toLowerCase(); return relationshipList().find(r => resolveRelationName(r.target).toLowerCase() === want); };
export function peers() {
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
export const currentPeer = () => { const all = peers(); return all.find(p => p.key === ui.selectedPeer) ?? all[0]; };
export const selectedRelation = () => currentPeer()?.relation;
export function ensureRelation(peer) {
    let relation = relationFor(peer.key);
    if (!relation) { relation = cloneRelationships([{ id: newCastId(), target: peer.key }])[0]; relationshipList().push(relation); }
    return relation;
}
// Where "their side" of a pairing lives, if that person has a panel of their own.
export function swapTarget(peer) {
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
export const personKeyOfSubject = () => ui.who === 'user' ? 'user' : ui.who === 'cast' ? `cast:${selectedCast()?.id}` : `char:${target()?.avatar}`;
export function keyForTarget(value, ch = target(), cast = getCast(ch)) {
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
export const pairId = (a, b) => [a, b].sort().join('|');
export function getPair(a, b, create = false, labels = {}) {
    const meta = ctx().chatMetadata[KEY]; if (!meta || !a || !b || a === b) return null;
    meta.pairs ??= {};
    const id = pairId(a, b);
    if (!meta.pairs[id] && create) meta.pairs[id] = { members: [a, b], labels: {}, enabled: true, moods: {} };
    const pair = meta.pairs[id];
    if (pair) Object.assign(pair.labels ??= {}, labels);
    return pair ?? null;
}
// Move shared labels (dating, enemies to lovers…) out of anyone's one-way side and into the pair.
export function migratePairs(ch = target()) {
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
export function pairExtras(ch) {
    const meta = ctx().chatMetadata[KEY], cast = getCast(ch);
    const present = new Set([`char:${ch.avatar}`, 'user', ...members().map(m => `char:${m.avatar}`), ...cast.filter(p => p.inScene).map(p => `cast:${p.id}`)]);
    const rank = key => key.startsWith('char:') ? 0 : key === 'user' ? 1 : 2;
    return Object.values(meta?.pairs ?? {}).filter(p => p.enabled !== false && p.members.some(k => present.has(k)) && (activeSharedTags(p).length || p.memories?.some(m => m.value >= 41)))
        .map(p => ({ names: [...p.members].sort((a, b) => rank(a) - rank(b)).map(k => nameForKey(k, ch, p.labels)), moods: p.moods,
            memories: (p.memories ?? []).filter(m => settings().boardMemories || !untouchedMemory(m)).map(m => ({ text: m.text, value: m.value, who: m.who === 'both' ? 'both' : nameForKey(m.who, ch, p.labels) })) }))
        .filter(p => p.names.every(Boolean));
}
export const subjectName = () => ui.who === 'user' ? playerName() : ui.who === 'cast' ? selectedCast()?.name : target()?.name;
export const resolveRelationName = name => castName(name).replaceAll('{{char}}', target()?.name ?? '').replaceAll('{{user}}', playerName());
export function validRelationName(value, exceptId = '') {
    const name = castName(value), resolved = resolveRelationName(name).toLowerCase();
    if (!name) throw new Error('Choose who this relationship is about.');
    if (resolved === subjectName()?.toLowerCase()) throw new Error('Choose someone other than the person whose feelings you’re editing.');
    if (relationshipList().some(r => r.id !== exceptId && resolveRelationName(r.target).toLowerCase() === resolved)) throw new Error('That person already has a relationship blend here. Pick them from the list.');
    return name;
}
export function members() {
    const c = ctx();
    if (c.groupId) {
        const group = c.groups.find(g => String(g.id) === String(c.groupId));
        return c.characters.filter(ch => group?.members?.includes(ch.avatar));
    }
    return c.characters[c.characterId] ? [c.characters[c.characterId]] : [];
}
export function target(forGeneration = false) {
    const c = ctx(), choices = members();
    if (forGeneration && c.characters[c.characterId] && choices.includes(c.characters[c.characterId])) return c.characters[c.characterId];
    return choices.find(ch => ch.avatar === ui.selectedAvatar) ?? choices[0];
}
export function identity(ch = target()) {
    return `${ctx().groupId || ''}/${ctx().chatId || ''}/${ch?.avatar || ''}`;
}
// A chat that starts on 1.36 or later has nothing to move over.
const freshMeta = () => ({ version: 1, characters: {}, ledger: 2 });
export function getState(ch = target()) {
    const c = ctx();
    if (!ch || !c.chatId) return null;
    c.chatMetadata[KEY] ??= freshMeta();
    const key = `char:${ch.avatar}`;
    const state = c.chatMetadata[KEY].characters[key] ??= freshState(settings().baselines[key]);
    // Before 1.50 the story could add its own feelings; this tracked which ones it added.
    if (c.chatMetadata[KEY].weave?.[key]?.auto) delete c.chatMetadata[KEY].weave[key].auto;
    return movePairFacts(extendCatalogue(state), '{{user}}');
}
// The player's own character is shared by every character in the chat, so it lives once per chat.
export const playerName = () => String(ctx().name1 || '').trim() || 'You';
export function getUserState() {
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
export function getStoryState(ch = target()) {
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
export function getKnowledge(ch = target(), create = false) {
    const meta = ctx().chatMetadata[KEY];
    if (!meta || !ch) return {};
    const key = JSON.stringify([ch.avatar, playerName()]);
    if (create) { meta.personaKnowledge ??= {}; meta.personaKnowledge[key] ??= {}; }
    return meta.personaKnowledge?.[key] ?? {};
}
// Your turn-ons, and whether the character knows them. Unknown ones still reach the story; known
// ones the character uses on purpose.
export function turnKnowledgeRows(state, ch, knowledge) {
    const prefs = Object.entries(state?.prefs ?? {}).filter(([id, v]) => v && TURN_BY_ID[id]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    if (!prefs.length) return '';
    const aware = prefs.filter(([id]) => ['known', 'suspected'].includes(knowledgeEntry(knowledge[`turn:${id}`]).mode)).length;
    return `<details class="mw-knowledge mw-advanced" data-anchor="turn-knowledge"><summary>Does ${esc(ch.name)} know? <small>${aware} of ${prefs.length} known or suspected</small></summary>
        <p class="mw-fine">All of your turn-ons reach the story either way. If ${esc(ch.name)} doesn’t know one, it turns up by chance. If they suspect, they test it. If they know, they play into it on purpose.</p>` + prefs.map(([id, v]) => {
        const key = `turn:${id}`, entry = knowledgeEntry(knowledge[key]), t = TURN_BY_ID[id];
        return `<div class="mw-knowledge-row" data-knowledge-row="${key}" data-filter-item="knowledge" data-search="${esc(t.label + ' ' + t.cue)}"><label for="mw-knowledge-${key}">${esc(t.label)} <small>turn-${v > 0 ? 'on' : 'off'} · ${Math.abs(v)}%${knowledge[key]?.learned ? ' · picked up in the story' : ''}</small></label>
            <select id="mw-knowledge-${key}" data-knowledge="${key}" aria-label="Does ${esc(ch.name)} know: ${esc(t.label)}">${[['scene', 'Unaware'], ['suspected', 'Suspects'], ['known', 'Knows']].map(([mode, label]) => `<option value="${mode}" ${(entry.mode === 'private' ? 'scene' : entry.mode) === mode ? 'selected' : ''}>${label}</option>`).join('')}</select>
            ${['known', 'suspected'].includes(entry.mode) ? `<input type="text" maxlength="120" data-knowledge-source="${key}" aria-label="Source for ${esc(t.label)}" placeholder="How they learned it (optional)" value="${esc(entry.source)}">` : ''}</div>`;
    }).join('') + '</details>';
}
export function getCast(ch = target()) {
    if (!ch || !ctx().chatId) return [];
    getState(ch);
    const cast = castFor(ctx().chatMetadata[KEY], settings().castDefaults, `char:${ch.avatar}`);
    for (const person of cast) movePairFacts(person.state, '{{user}}');
    return cast;
}
export const selectedCast = () => getCast().find(person => person.id === ui.selectedCastId) ?? getCast()[0];
export function saveCastDefault(ch = target()) {
    if (!ch) return;
    settings().castDefaults[`char:${ch.avatar}`] = castDefaults(getCast(ch));
    ctx().saveSettingsDebounced();
}
export function loadCastDefault(ch = target()) {
    if (!ch) return false;
    const saved = settings().castDefaults[`char:${ch.avatar}`];
    if (!saved?.length) return false;
    getCast(ch);
    ctx().chatMetadata[KEY].cast[`char:${ch.avatar}`] = castDefaults(saved);
    ui.selectedCastId = ''; ui.castAction = '';
    return true;
}
export const viewState = () => ui.who === 'user' ? getUserState() : ui.who === 'story' ? getStoryState() : ui.who === 'cast' ? selectedCast()?.state : getState();
export function profiles() {
    try { return ctx().ConnectionManagerRequestService.getSupportedProfiles(); } catch { return []; }
}
export async function persist(state) {
    if (state) state.revision = (state.revision || 0) + 1;
    try { await ctx().saveMetadata(); } catch { run.status = 'Could not save chat metadata. Try again before switching chats.'; renderStatus(); }
}
