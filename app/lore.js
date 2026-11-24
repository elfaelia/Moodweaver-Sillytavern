// Lorebook cast (2.0): when SillyTavern activates lorebook entries for a reply, the ones about a person (a short
// capitalised name as the entry's title or first key, written about with he/she/they) are offered on Scene as side
// characters. Their entry text is kept for this session so Read the card can read it for that person.
import { getCast, members, playerName } from './chat.js';
import { run } from './state.js';

const NAME = /^[A-Z][A-Za-z'\u2019.-]{1,20}(?:\s[A-Z][A-Za-z'\u2019.-]{1,20}){0,2}$/;
const PERSON = /\b(he|she|his|her|him|they're|years old|aged? \d|born|wife|husband|mother|father|sister|brother|daughter|son)\b/i;
const NOT_PEOPLE = /\b(city|town|village|street|road|house|hospital|asylum|bar|club|church|school|company|corp|inc|ltd|hotel|motel|river|lake|island|county|state|war|era|rules?|setting|world|lore|faction|gang|family|kingdom|empire)\b/i;
const strip = s => String(s ?? '').replace(/\s*\(.*?\)\s*/g, ' ').trim();

// entries: what WORLD_INFO_ACTIVATED gives (an array of entry objects, or { entries }).
export function loreActivated(entries) {
    const list = Array.isArray(entries) ? entries : Array.isArray(entries?.entries) ? entries.entries : [];
    const people = new Map(run.lorePeople ?? []);
    for (const e of list) {
        const title = strip(e?.comment), first = strip(Array.isArray(e?.key) ? e.key[0] : String(e?.key ?? '').split(',')[0]);
        const name = [title, first].find(x => NAME.test(x) && !NOT_PEOPLE.test(x));
        const text = String(e?.content ?? '');
        if (!name || !PERSON.test(text.slice(0, 600))) continue;
        people.set(name, text.slice(0, 1500));
    }
    run.lorePeople = [...people].slice(-12);
}
// People from active lore who aren't the character, the player or already in the cast.
export function lorePeople(ch) {
    const taken = [playerName(), ...members().map(m => m.name), ...getCast(ch).map(p => p.name)].map(x => String(x ?? '').toLowerCase());
    return (run.lorePeople ?? []).map(([name]) => name).filter(n => !taken.some(t => t === n.toLowerCase() || t.split(' ')[0] === n.toLowerCase().split(' ')[0]));
}
export const loreFor = name => (run.lorePeople ?? []).find(([n]) => n.toLowerCase() === String(name ?? '').toLowerCase())?.[1] ?? '';
export const clearLore = () => { run.lorePeople = []; };
