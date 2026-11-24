import { extendCatalogue, freshState } from './state.js';
import { BY_ID, sectionOf } from '../data/catalogue.js';

export const castName = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
// LAN connections can use plain HTTP, where randomUUID is unavailable.
export const newCastId = (cryptoApi = globalThis.crypto) => cryptoApi?.randomUUID?.()
    ?? `cast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

// Each main character gets a separate cast in each chat. Defaults only seed new chats.
export function castFor(metadata, defaults, owner) {
    metadata.cast ??= {};
    if (!metadata.cast[owner]) metadata.cast[owner] = (defaults[owner] ?? []).map(person => ({
        id: person.id, name: person.name, inScene: false, ...(person.tier ? { tier: person.tier } : {}), state: freshState(person.state),
    }));
    const cast = metadata.cast[owner];
    for (const person of cast) {
        person.name = castName(person.name);
        person.state ??= freshState();
        extendCatalogue(person.state);
        person.state.mode = 'manual';
    }
    return cast;
}

export function addCastMember(cast, value, id, reservedNames = []) {
    const name = castName(value);
    if (!name) throw new Error('Give the character a name first.');
    if ([...cast.map(person => person.name), ...reservedNames].some(n => n.toLowerCase() === name.toLowerCase())) {
        throw new Error('That name already has a character panel.');
    }
    const person = { id, name, inScene: true, state: freshState() };
    cast.push(person);
    return person;
}

export function castDefaults(cast) {
    return cast.map(person => ({ id: person.id, name: person.name, inScene: false, ...(person.tier ? { tier: person.tier } : {}), state: freshState(person.state) }));
}

// 2.0 cast tiers. A side character is slim: feelings, facts and core traits, and how they feel about people. One
// switched up to a full page (tier 'full') keeps everything the main two have. Passing characters (named on the
// board's Present line but not in the cast) have no state at all.
export const isFull = person => person?.tier === 'full';
const SLIM = new Set(['mood', 'state', 'trait']);
export function slimState(st) {
    if (!st) return st;
    const moods = Object.fromEntries(Object.entries(st.moods ?? {}).filter(([id]) => BY_ID[id] && SLIM.has(sectionOf(BY_ID[id]))));
    return { ...st, moods, loadout: (st.loadout ?? []).filter(id => id in moods), prefs: {}, wants: [], skills: {}, inventory: [] };
}
// The cast as the note sees it: side characters slimmed, full ones as they are.
export const castForNote = cast => (cast ?? []).map(p => isFull(p) ? p : { ...p, state: slimState(p.state) });
