// One person's saved moods, traits, wants and notes: a fresh state, cleaning saved values, and
// moving values saved by older versions to where they live now.
import { cleanDials, cleanTurns } from './dials.js';
import { BY_ID, MERGED_MOODS, MOODS, OPPOSITE_OF, REMOVED_MOODS, analysed, isAuthor, sectionOf } from '../data/catalogue.js';
import { clamp, text } from './util.js';
import { cleanEnneagram, cleanPersonality } from './personality.js';
import { MOVED_TARGET, MOVED_TO_RELATIONSHIPS, cloneRelationships, relationshipKey } from './relationships.js';
import { SKILL_SCALE, cleanPins, cleanSkillPace, cleanSkills, cleanXp, widenSkills } from './skills.js';
import { cleanSecretSet, cleanSecrets } from './secrets.js';
import { LIKES_TO_TURNS, OLD_KINKS, TURN_BY_ID, TURN_MERGED, cleanAge, cleanFavs, cleanHeight, cleanInterests, cleanWords } from './turns.js';

// Feelings about one particular person, and pair tropes, now live in relationships. '{{other}}' stands for
// whoever that sheet used to point at; the panel resolves it for each person when the chat loads.
function moveToRelationships(state, knowledgeMaps = [], snapshot = false) {
    for (const [id, tag] of Object.entries(MOVED_TO_RELATIONSHIPS)) {
        if (BY_ID[id]) continue;
        const value = clamp(state.moods[id] ?? 0);
        if (value > 0 && !snapshot) {
            const target = MOVED_TARGET[id] ?? (id === 'hates_other' ? (state.targets?.hate || '{{other}}') : '{{other}}');
            state.relationships ??= [];
            let relation = state.relationships.find(r => r.target === target);
            if (!relation) { relation = { id: `moved-${target.replace(/\W+/g, '').toLowerCase() || 'other'}-${state.relationships.length}`, target, enabled: true, moods: {} }; state.relationships.push(relation); }
            relation.moods ??= {};
            relation.moods[tag] = Math.max(clamp(relation.moods[tag] ?? 0), value);
            for (const map of knowledgeMaps) if (map[id]) { map[relationshipKey(relation, tag)] = map[id]; }
        }
        delete state.moods[id]; delete state.pins?.[id];
        for (const map of knowledgeMaps) delete map[id];
    }
    const compare = clamp(state.moods.comparing_people ?? 0);
    if (!BY_ID.comparing_people && compare > 0 && !snapshot && state.targets?.compareA) {
        state.relationships ??= [];
        const target = state.targets.compareA;
        let relation = state.relationships.find(r => r.target === target);
        if (!relation) { relation = { id: `moved-compare-${state.relationships.length}`, target, enabled: true, moods: {} }; state.relationships.push(relation); }
        relation.compare = { with: state.targets.compareB || '{{user}}', favours: 'neither', value: compare };
    }
    if (!BY_ID.comparing_people) { delete state.moods.comparing_people; delete state.pins?.comparing_people; }
}
// Set a turn-on unless a stronger value is already saved, and show it on the person's list.
function addTurn(state, id, value) {
    state.prefs ??= {};
    if (Math.abs(value) > Math.abs(state.prefs[id] ?? 0)) state.prefs[id] = value;
    if (Array.isArray(state.loadout) && !state.loadout.includes(`turn:${id}`)) state.loadout.push(`turn:${id}`);
}
// Removed turn-ons hand their value, list place and knowledge to the ones that replaced them.
function mergeTurns(state, knowledgeMaps) {
    for (const [id, targets] of Object.entries(TURN_MERGED)) {
        const key = `turn:${id}`, value = state.prefs?.[id] ?? 0, listed = state.loadout?.includes?.(key);
        if (!value && !listed && !knowledgeMaps.some(map => Object.hasOwn(map, key))) continue;
        for (const to of targets) {
            if (value) addTurn(state, to, value);
            else if (listed && !state.loadout.includes(`turn:${to}`)) state.loadout.push(`turn:${to}`);
            for (const map of knowledgeMaps) if (map[key] && !map[`turn:${to}`]) map[`turn:${to}`] = map[key];
        }
        if (state.prefs) delete state.prefs[id];
        if (listed) state.loadout = state.loadout.filter(x => x !== key);
        for (const map of knowledgeMaps) delete map[key];
    }
}
const TRAIT_TO_COPE = { self_medicating: 'drugs', escapism: 'distraction', glutton_for_punishment: 'penance', self_destructive: 'reckless' };
export function migrateCatalogue(state, knowledgeMaps = [], snapshot = false) {
    state.moods ??= {};
    state.pins ??= {};
    const privacy = { private: 0, scene: 1, suspected: 2, known: 3 };
    for (const target of new Set(Object.values(MERGED_MOODS))) {
        const ids = [target, ...Object.keys(MERGED_MOODS).filter(id => MERGED_MOODS[id] === target)];
        if (!ids.slice(1).some(id => Object.hasOwn(state.moods, id) || Object.hasOwn(state.pins, id)
            || knowledgeMaps.some(map => Object.hasOwn(map, id)))) continue;
        const peak = Math.max(...ids.map(id => clamp(state.moods[id] ?? 0)));
        for (const map of knowledgeMaps) {
            // The strongest old setting supplies knowledge. Ties keep the more private choice.
            // With no active setting, preserve an explicitly saved knowledge choice for later.
            const candidates = peak > 0 ? ids.filter(id => clamp(state.moods[id] ?? 0) === peak)
                : ids.filter(id => Object.hasOwn(map, id));
            const chosen = candidates.sort((a, b) => privacy[knowledgeEntry(map[a]).mode] - privacy[knowledgeEntry(map[b]).mode])[0];
            if (chosen) {
                const entry = knowledgeEntry(map[chosen]);
                if (entry.mode === 'scene') delete map[target]; else map[target] = entry;
            }
            for (const id of ids.slice(1)) delete map[id];
        }
        state.moods[target] = peak;
        state.pins[target] = ids.some(id => Boolean(state.pins[id]));
        for (const id of ids.slice(1)) { delete state.moods[id]; delete state.pins[id]; }
    }
    // 2.0.8: traits that were really ways of coping move to the Stress card's ways of coping (up to six).
    for (const [id, cope] of Object.entries(TRAIT_TO_COPE)) {
        if (!Object.hasOwn(state.moods, id)) continue;
        if (!snapshot && clamp(state.moods[id]) > 0) state.copes = [...new Set([...(Array.isArray(state.copes) ? state.copes : []), cope])].slice(-6);
        delete state.moods[id]; delete state.pins[id];
        for (const map of knowledgeMaps) delete map[id];
    }
    for (const id of REMOVED_MOODS) {
        delete state.moods[id]; delete state.pins[id];
        for (const map of knowledgeMaps) delete map[id];
    }
    moveToRelationships(state, knowledgeMaps, snapshot);
    for (const [id, to] of Object.entries(LIKES_TO_TURNS)) {
        if (BY_ID[id]) continue;
        const value = clamp(state.moods[id] ?? 0);
        if (value > 0 && !snapshot) addTurn(state, to.replace('-', ''), to.startsWith('-') ? -value : value);
        delete state.moods[id]; delete state.pins?.[id];
        for (const map of knowledgeMaps) delete map[id];
    }
    // Kinks became turn-ons, at the same strength.
    for (const id of OLD_KINKS) {
        if (BY_ID[id] || !Object.hasOwn(state.moods, id)) continue;
        const value = clamp(state.moods[id] ?? 0);
        if (value > 0 && !snapshot) addTurn(state, id, value);
        delete state.moods[id]; delete state.pins?.[id]; for (const map of knowledgeMaps) delete map[id];
    }
    mergeTurns(state, knowledgeMaps);
    for (const old of state.history ?? []) migrateCatalogue(old, [], true);
    return state;
}
// The panel asks for the same states many times per redraw. Each state object is cleaned only the first
// time.
const extended = new WeakSet();
export const isExtended = state => extended.has(state);
// Add catalogue entries to old chats in place, preserving their history and settings.
// In memory every option has a value (0 when off) and a pin flag, in catalogue order. Saved chats and
// settings keep only the ones that are set, which takes a chat's Moodweaver data from hundreds of KB to a
// few, so every save is quicker. The missing ones are filled back in when the chat loads.
function saveSetOnly() { return Object.fromEntries(Object.entries(this).filter(([, v]) => v)); }
const sparse = obj => Object.defineProperty(obj, 'toJSON', { value: saveSetOnly, enumerable: false, configurable: true, writable: true });
// Every catalogue option in catalogue order. Values for anything else (own options from before 1.50)
// are dropped.
function canonical(obj, off) {
    const entries = MOODS.map(({ id }) => [id, obj[id] ?? off]);
    const sameOrder = Object.keys(obj).length === entries.length && Object.keys(obj).every((k, i) => k === entries[i][0]);
    if (!sameOrder) { for (const k of Object.keys(obj)) delete obj[k]; for (const [k, v] of entries) obj[k] = v; }
    return sparse(obj);
}
// Up to three core traits: ids from the Traits tab that are on. Always sent, first, whatever the mood.
export const CORE_MAX = 3;
export const isBelief = m => ['views', 'alignment'].includes(m?.category);
// Putting a fact on takes its opposites off (OPPOSITE_OF), except pinned ones. Returns the ids it turned off.
export function clearOpposites(st, id) {
    const off = (OPPOSITE_OF[id] ?? []).filter(o => (st.moods?.[o] ?? 0) > 0 && !st.pins?.[o]);
    for (const o of off) st.moods[o] = 0;
    return off;
}
// Which way a mind setting leans: 'light' (healthier) or 'dark'; missing means middling.
export const cleanLean = x => Object.fromEntries(Object.entries(x && typeof x === 'object' ? x : {}).filter(([id, v]) => BY_ID[id]?.light && ['light', 'dark'].includes(v)));
// Which part of the writing an author shapes: 'narration' (everything outside the quotes) or 'dialogue' (what
// people say aloud). Missing means both, as before.
export const AUTHOR_ROLES = ['narration', 'dialogue'];
export const cleanAuthorRole = x => Object.fromEntries(Object.entries(x && typeof x === 'object' ? x : {}).filter(([id, v]) => isAuthor(BY_ID[id]) && AUTHOR_ROLES.includes(v)));
export const cleanCore = (list, moods = {}) => [...new Set(Array.isArray(list) ? list : [])].filter(id => BY_ID[id] && ['trait', 'psyche'].includes(sectionOf(BY_ID[id])) && !isBelief(BY_ID[id]) && (moods[id] ?? 0) > 0).slice(0, CORE_MAX);
// Up to three starred beliefs: rows from Morals & views and Alignment that are on. Sent every reply as what the
// person acts on first (engine/prompt.js beliefLine). Before 1.78 these could be starred as core; they move here.
export const BELIEF_MAX = 3;
export const cleanBeliefs = (list, moods = {}) => [...new Set(Array.isArray(list) ? list : [])].filter(id => isBelief(BY_ID[id]) && (moods[id] ?? 0) > 0).slice(0, BELIEF_MAX);
// How long each fact that runs its course has run (engine/moodpace.js factStep). fromStory: facts and
// feelings the story put on, which it takes off again when its list leaves them out (app/replies.js).
const cleanClock = c => Object.fromEntries(Object.entries(c && typeof c === 'object' ? c : {}).filter(([id, v]) => BY_ID[id] && v && Number.isFinite(v.h) && Number.isFinite(v.v) && Number.isFinite(v.at)));
export function extendCatalogue(state) {
    if (!state || extended.has(state)) return state;
    migrateCatalogue(state);
    state.causes = cleanCauses(state.causes); state.about = Object.fromEntries(Object.entries(state.about && typeof state.about === 'object' ? state.about : {}).filter(([id, v]) => BY_ID[id] && typeof v === 'string' && v.trim()).map(([id, v]) => [id, v.trim().slice(0, 40)])); state.shows = cleanShows(state.shows);
    // Feelings ended by hand: { id: chat length when ended }. The board can't bring them back; the story can, by naming them anew.
    state.cut = Object.fromEntries(Object.entries(state.cut && typeof state.cut === 'object' ? state.cut : {}).filter(([id, v]) => BY_ID[id] && Number.isInteger(v) && v >= 0)); state.prefs = cleanPrefs(state.prefs);
    // Retired: own options (1.50); "always send" skills and a separate feelings pace (1.53: skills go only when
    // the scene calls for them, and one pace per chat is kept with the bond).
    delete state.custom; delete state.ownSkills; delete state.skillAlways; delete state.moodPace;
    state.skills = cleanSkills(widenSkills(state.skills, state.skillScale)); state.skillScale = SKILL_SCALE; state.skillPins = cleanPins(state.skillPins); state.skillXp = cleanXp(state.skillXp); state.skillPace = cleanSkillPace(state.skillPace);
    state.inventory = cleanInventory(state.inventory); state.age = cleanAge(state.age); state.height = cleanHeight(state.height); state.interests = cleanInterests(state.interests); state.favs = cleanFavs(state.favs); state.petNames = cleanWords(state.petNames); state.sayings = cleanWords(state.sayings); state.family = cleanWords(state.family, 1600); state.stressFrom = Number.isFinite(state.stressFrom) ? state.stressFrom : -1; state.secrets = cleanSecrets(state.secrets); state.secretSet = cleanSecretSet(state.secretSet);
    state.psyLean = cleanLean(state.psyLean); state.authorRole = cleanAuthorRole(state.authorRole);
    if (!Array.isArray(state.beliefs)) state.beliefs = (Array.isArray(state.core) ? state.core : []).filter(id => isBelief(BY_ID[id]));
    state.beliefs = cleanBeliefs(state.beliefs, state.moods); state.core = cleanCore(state.core, state.moods); state.factClock = cleanClock(state.factClock);
    // fromStory was storyFacts in 1.58 (facts only).
    state.fromStory = [...new Set([state.fromStory, state.storyFacts].flatMap(x => Array.isArray(x) ? x : []))].filter(id => BY_ID[id]); delete state.storyFacts;
    state.wants = cleanWants(state.wants); state.readScope = cleanScope(state.readScope);
    state.follow = clamp(state.follow ?? 90, 10, 100);
    state.loadout = cleanLoadout(state.loadout, state);
    state.sceneBreathing ??= true;
    state.personality = cleanPersonality(state.personality);
    state.enneagram = cleanEnneagram(state.enneagram);
    state.moods = canonical(state.moods ?? {}, 0);
    state.pins = canonical(state.pins ?? {}, false);
    extended.add(state);
    return state;
}
export function cleanTargets(targets = {}) {
    return Object.fromEntries(['hate', 'compareA', 'compareB', 'year'].map(key => [key,
        String(targets?.[key] ?? '').replace(/\s+/g, ' ').trim().slice(0, key === 'year' ? 20 : 80)]));
}
// "because\u2026" notes on individual moods and facts.
// How a feeling shows on this particular person, in the player's words. It replaces the default
// "how it shows" wording for that feeling, so Bateman's rage can be a pleasant smile.
function cleanShows(shows = {}) {
    return Object.fromEntries(Object.entries(shows ?? {}).filter(([id]) => BY_ID[id]).map(([id, v]) => [id, text(v, 120)]).filter(([, v]) => v));
}
function cleanCauses(causes = {}) {
    return Object.fromEntries(Object.entries(causes ?? {}).filter(([id]) => BY_ID[id]).map(([id, v]) => [id, text(v, 100)]).filter(([, v]) => v));
}
// Turn-ons are positive, turn-offs negative.
function cleanPrefs(prefs = {}) {
    return Object.fromEntries(Object.entries(prefs ?? {}).filter(([id]) => TURN_BY_ID[id])
        .map(([id, v]) => [id, Math.max(-100, Math.min(100, Math.round(Number(v) || 0)))]).filter(([, v]) => v));
}
// Inventory: things a person has. 'carried' off keeps the item saved but stops sending it.
function cleanInventory(list = []) {
    const t = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
    return (Array.isArray(list) ? list : []).slice(0, 30).map(item => ({ id: t(item?.id, 40) || Math.random().toString(36).slice(2, 10),
        text: t(item?.text, 60), note: t(item?.note, 80), carried: item?.carried !== false })).filter(item => item.text);
}
// Sims-style wants, goals and fears. Written by the player, optionally nudged by the scene reader.
export const WANT_KINDS = ['want', 'goal', 'fear', 'button'];
export function cleanWants(list = []) {
    return (Array.isArray(list) ? list : []).slice(0, 36).map(w => ({ id: text(w?.id, 40) || Math.random().toString(36).slice(2, 10),
        kind: WANT_KINDS.includes(w?.kind) ? w.kind : 'want', text: text(w?.text, 120), value: clamp(Math.round(Number(w?.value ?? 50) || 0)),
        done: w?.done === true, read: w?.read === true, after: Number.isFinite(Number(w?.after)) ? Number(w.after) : -1 })).filter(w => w.text);
}
// What a scene read looks at. Moodlets by default; the rest are opt-in per person.
export const BODY_CATEGORIES = new Set(['body', 'bedroom', 'substances']);
export function cleanScope(scope) {
    const s = scope && typeof scope === 'object' ? scope : {};
    return { mood: s.mood !== false, body: s.body === true, trait: s.trait === true, wants: s.wants === true };
}
// Which rows this person shows by default. Catalogue ids, plus 'turn:<id>' for turn-ons.
function cleanLoadout(list, state) {
    const valid = id => BY_ID[id] || (id.startsWith('turn:') && TURN_BY_ID[id.slice(5)]);
    const base = Array.isArray(list) ? list : [
        ...MOODS.filter(m => (state?.moods?.[m.id] ?? 0) > 0).map(m => m.id),
        ...Object.keys(state?.prefs ?? {}).filter(id => state.prefs[id]).map(id => `turn:${id}`)];
    return [...new Set(base.map(String).filter(valid))];
}
// Feelings and facts the story puts on (the hidden line, the reader) join the card's list while they're on, and
// leave it again once they're back at zero (1.96.4). Before, every one that ever came on stayed listed for good,
// so a long chat built up hundreds of rows at zero and the panel slowed down. Ones you add or tap yourself stay.
export function listAuto(state, id) {
    if (!Array.isArray(state.loadout) || state.loadout.includes(id)) return;
    state.loadout.push(id); state.autoList = [...new Set([...(state.autoList ?? []), id])];
}
export function pruneAuto(state) {
    if (!state.autoList?.length) return;
    const gone = new Set(state.autoList.filter(id => !((state.moods?.[id] ?? 0) > 0) && !state.pins?.[id]));
    if (!gone.size) return;
    state.loadout = (state.loadout ?? []).filter(id => !gone.has(id)); state.autoList = state.autoList.filter(id => !gone.has(id));
}
// Feelings that have faded to a flicker leave, and the list keeps room (1.97.4). After each reply, any feeling at
// Faint (10 or under) goes to 0 and off the list; then, past ROOM feelings, the weakest under Clear (41) make room,
// lowest first. Whoever set them, the story or the player; only pinned ones stay. Traits, intimacy, Mind, facts
// and turn-ons aren't feelings and are left alone. Returns { id: [before, 0] } so the reply's undo brings them back.
export const FEELING_FLOOR = 10, FEELING_ROOM = 12;
export function trimFeelings(state) {
    const out = {}, moods = state?.moods ?? {}, pinned = id => Boolean(state.pins?.[id]);
    const on = Object.keys(moods).filter(id => moods[id] > 0 && analysed(BY_ID[id]));
    const drop = id => { out[id] = [moods[id], 0]; moods[id] = 0; };
    for (const id of on) if (moods[id] <= FEELING_FLOOR && !pinned(id)) drop(id);
    const left = on.filter(id => moods[id] > 0);
    const spare = left.filter(id => !pinned(id) && moods[id] < 41).sort((a, b) => moods[a] - moods[b]);
    for (let extra = left.length - FEELING_ROOM; extra > 0 && spare.length; extra--) drop(spare.shift());
    const gone = new Set(Object.keys(out));
    if (gone.size) { state.loadout = (state.loadout ?? []).filter(id => !gone.has(id)); if (state.autoList) state.autoList = state.autoList.filter(id => !gone.has(id)); }
    return out;
}
// Once per character card (1.96.4): older chats kept every feeling and fact that ever came on. Ones now at zero
// that were set at some point (an explicit 0) and aren't pinned come off the list. Ones added from Browse all and
// never set have no value at all, so they stay.
// Turn-ons are left alone. Anything taken off is one tap away again in Browse all.
export function tidyList(state, keep = []) {
    if (state.listTidy >= 1964 || !Array.isArray(state.loadout)) return false;
    const hold = new Set(keep), before = state.loadout.length;
    state.loadout = state.loadout.filter(id => id.startsWith('turn:') || hold.has(id) || state.pins?.[id] || (state.moods?.[id] ?? 0) > 0 || !Object.hasOwn(state.moods ?? {}, id));
    state.listTidy = 1964;
    return state.loadout.length !== before;
}
export function freshState(base = {}) {
    // The story dials (engine/dials.js) replaced some Story rows: a chat that had them on starts on the matching step.
    const dial = cleanTurns(base.dial, base.moods), dials = cleanDials(base.dials, base.moods);
    base = migrateCatalogue({ ...base, moods: { ...base.moods }, pins: { ...base.pins }, history: [],
        relationships: (base.relationships ?? []).map(r => ({ ...r, moods: { ...r.moods } })) });
    return {
        enabled: base.enabled ?? true, sceneBreathing: base.sceneBreathing ?? true, mode: base.mode === 'dynamic' ? 'dynamic' : 'manual',
        moods: sparse(Object.fromEntries(MOODS.map(m => [m.id, Math.round(clamp(base.moods?.[m.id] ?? 0))]))),
        pins: sparse(Object.fromEntries(MOODS.map(m => [m.id, Boolean(base.pins?.[m.id])]))),
        targets: cleanTargets(base.targets),
        personality: cleanPersonality(base.personality),
        enneagram: cleanEnneagram(base.enneagram),
        relationships: cloneRelationships(base.relationships),
        causes: cleanCauses(base.causes), shows: cleanShows(base.shows), prefs: cleanPrefs(base.prefs), inventory: cleanInventory(base.inventory), age: cleanAge(base.age), height: cleanHeight(base.height), interests: cleanInterests(base.interests), favs: cleanFavs(base.favs), petNames: cleanWords(base.petNames), sayings: cleanWords(base.sayings), family: cleanWords(base.family, 1600), stressFrom: Number.isFinite(base.stressFrom) ? base.stressFrom : -1, secrets: cleanSecrets(base.secrets), secretSet: cleanSecretSet(base.secretSet), core: cleanCore(base.core, base.moods ?? {}), beliefs: cleanBeliefs(base.beliefs, base.moods ?? {}), psyLean: cleanLean(base.psyLean), authorRole: cleanAuthorRole(base.authorRole),
        skills: cleanSkills(widenSkills(base.skills, base.skillScale)), skillScale: SKILL_SCALE, skillPins: cleanPins(base.skillPins), skillXp: cleanXp(base.skillXp), skillPace: cleanSkillPace(base.skillPace),
        wants: cleanWants(base.wants), readScope: cleanScope(base.readScope), follow: clamp(base.follow ?? 90, 10, 100),
        loadout: cleanLoadout(base.loadout, base),
        sensitivity: clamp(base.sensitivity ?? 50, 10, 100), inertia: clamp(base.inertia ?? 60, 0, 95),
        decay: clamp(base.decay ?? 5, 0, 20), interval: clamp(base.interval ?? 1, 1, 10),
        // Feelings moved by the story's hidden line: on/off, fading on/off, and how fast.
        moodAuto: base.moodAuto !== false, moodFade: base.moodFade !== false, moodScope: base.moodScope === 'list' ? 'list' : 'any',
        // The story's dial (2.0): how restless the story is, Calm 0 to Chaos 4. Only the story's own state uses it.
        dial, dials,
        profile: String(base.profile ?? ''), lastFingerprint: '', lastUserCount: -1,
        reason: '', updatedAt: 0, history: [], revision: 0,
    };
}
export function activeMoods(state) {
    return MOODS.filter(m => state.moods[m.id] > 0).sort((a, b) => state.moods[b.id] - state.moods[a.id] || Number(state.pins[b.id]) - Number(state.pins[a.id]));
}
export const KNOWLEDGE_MODES = ['scene', 'private', 'suspected', 'known'];
export function knowledgeEntry(entry) {
    const mode = KNOWLEDGE_MODES.includes(entry?.mode) ? entry.mode : 'scene';
    // from: for a turn-on set by hand, the chat position it was set at; the story's notices before it don't count.
    return { mode, source: ['known', 'suspected'].includes(mode) ? String(entry?.source ?? '').replace(/\s+/g, ' ').trim().slice(0, 120) : '', ...(Number.isInteger(entry?.from) ? { from: entry.from } : {}) };
}
