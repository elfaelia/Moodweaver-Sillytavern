// Your own options, saved once in extension settings and offered for every character.
// They register into the real catalogue, so they get sliders, search, defaults, the scene reader
// and prompt wording exactly like the built-in ones. Ids start with u_ and never change once made.
import { CATEGORIES, MOODS, BY_ID, FEELINGS, analysed, bumpCatalogue } from './core.js';
import { TURN_CATEGORIES, TURN_TAGS, TURN_BY_ID } from './turns.js';

export const turnGroupKey = name => `turn-${String(name).toLowerCase().replace(/\W+/g, '-')}`;
export const LIBRARY_ID = /^u_[a-z0-9]{4,16}$/;
export const newLibraryId = () => `u_${Math.random().toString(36).slice(2, 10)}`;
const CATEGORY_ROW = Object.fromEntries(CATEGORIES.map(row => [row[0], row]));
const TURN_GROUP = Object.fromEntries(TURN_CATEGORIES.map(row => [turnGroupKey(row[0]), row]));
const text = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
// "OCD" stays "OCD"; "Breeding" becomes "breeding" so it reads naturally mid-sentence.
const lowerFirst = s => /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;

export const isTurnGroup = group => Boolean(TURN_GROUP[group]);
export const groupExists = group => Boolean(CATEGORY_ROW[group] || TURN_GROUP[group]);

export function cleanLibrary(list) {
    const seen = new Set();
    return (Array.isArray(list) ? list : []).map(e => ({
        id: LIBRARY_ID.test(e?.id) ? e.id : '', group: String(e?.group ?? ''),
        label: text(e?.label, 60), cue: text(e?.cue, 160), dark: e?.dark === true,
    })).filter(e => e.id && e.label && groupExists(e.group) && !seen.has(e.id) && seen.add(e.id)).slice(0, 400);
}

// What actually gets sent, built the same way as the built-in PROMPT_NAME entries: "label: plain explanation".
export function libraryPrompt(e) {
    const name = lowerFirst(e.label);
    if (e.group === 'authors') return `write like ${e.label}${e.cue ? ` (${e.cue})` : ''}`;
    return e.cue ? `${name}: ${e.cue}` : name;
}

let applied = [];
// Safe to call again whenever the library changes: old registrations are removed first.
export function applyLibrary(list) {
    const entries = cleanLibrary(list);
    const drop = arr => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i]?.custom) arr.splice(i, 1); };
    drop(MOODS); drop(FEELINGS); drop(TURN_TAGS);
    for (const id of applied) { delete BY_ID[id]; delete TURN_BY_ID[id]; }
    for (const [, , , rows] of TURN_CATEGORIES) for (let i = rows.length - 1; i >= 0; i--) if (LIBRARY_ID.test(rows[i][0])) rows.splice(i, 1);
    applied = [];
    for (const e of entries) {
        if (BY_ID[e.id] && !BY_ID[e.id].custom) continue;
        const turn = TURN_GROUP[e.group];
        if (turn) {
            const prompt = e.cue ? `${lowerFirst(e.label)}: ${e.cue}` : lowerFirst(e.label);
            const tag = { id: e.id, noun: e.label, cue: e.cue || e.label, prompt, group: turn[0], color: turn[2], label: e.label, custom: true };
            turn[3].push([e.id, e.label, tag.cue, prompt]); TURN_TAGS.push(tag); TURN_BY_ID[e.id] = tag;
        } else {
            const [category, , , color, , kind = 'mood'] = CATEGORY_ROW[e.group];
            const m = { id: e.id, label: e.label, cue: e.cue || 'your own addition', category, color, kind, custom: true, dark: e.dark, prompt: libraryPrompt(e) };
            MOODS.push(m); BY_ID[e.id] = m;
            if (analysed(m)) FEELINGS.push(m);
        }
        applied.push(e.id);
    }
    bumpCatalogue();
    return entries;
}

// Sections a new entry can go into, for the section picker. kind is the panel tab.
export function librarySections(kind, traitIds) {
    if (kind === 'turn') return TURN_CATEGORIES.map(([name, icon]) => [turnGroupKey(name), `${icon} ${name}`]);
    return CATEGORIES.filter(([id, , , , , k = 'mood']) => {
        const section = k === 'story' ? 'story' : traitIds.has(id) ? 'trait' : k;
        return section === kind;
    }).map(([id, name, icon]) => [id, `${icon} ${name}`]);
}
