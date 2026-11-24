// Read the card (2.0): one short request to the roleplay model, which already has the character card, scenario,
// persona and any active lore in front of it, asking for a starting setup in plain lines. Nothing goes in by itself:
// each suggestion comes back as a chip on the profile card, kept or tapped away, then added with one tap.
import { MOODS, isAuthor, lowerLabel, sectionOf } from '../data/catalogue.js';
import { cleanAge, cleanHeight, cleanInterests, cleanWords, familyMembers, familyString } from '../engine/turns.js';
import { ctx, ui } from './state.js';

const FIELDS = ['age', 'height', 'into', 'family', 'pet names', 'sayings', 'traits', 'looks', 'job', 'era'];
const ask = (who, lore = '') => `[Out of character. Don't continue the story. ${lore ? `This is ${who}'s lorebook entry:\n${lore}\n\nFrom it and` : 'From'} the character card, scenario, persona and lore you have, set down what they say about ${who}, in exactly these ten lines and nothing else. Use only what they state or clearly imply; leave the part after the colon empty when they don't say.
age: a number
height: like 6'1 or 185 cm
into: up to five interests, comma separated
family: each relative as Role, Name, a few words about them; relatives separated by |
pet names: what ${who} calls the other main character, comma separated
sayings: phrases ${who} really uses, separated by |
traits: up to eight one- or two-word personality traits, unpleasant ones included, comma separated
looks: up to six short visible facts, comma separated
job: one or two words
era: decade and country, if the setting has one]`;

// Catalogue names, lower-cased, to match what the model writes against: traits, then facts, then eras.
const norm = s => String(s ?? '').toLowerCase().replace(/\s*\(.*\)\s*$/, '').replace(/[^a-z0-9' -]/g, '').trim();
const byName = list => { const map = new Map(); for (const m of list) { map.set(norm(m.label), m); map.set(m.id.replace(/_/g, ' '), m); } return map; };
let TRAITS = null, FACTS = null, ERAS = null;
const lists = () => {
    TRAITS ??= byName(MOODS.filter(m => sectionOf(m) === 'trait' && !isAuthor(m)));
    FACTS ??= byName(MOODS.filter(m => m.kind === 'state' && sectionOf(m) === 'state' && !m.private));
    ERAS ??= MOODS.filter(m => m.category === 'era');
};
const find = (map, word) => { const w = norm(word); if (!w || w.length < 3) return null;
    return map.get(w) ?? map.get(w.replace(/s$/, '')) ?? map.get(`${w}ed`) ?? [...map].find(([k]) => k.startsWith(`${w} `))?.[1] ?? null; };

export function parseCard(text) {
    lists();
    const got = Object.fromEntries(FIELDS.map(f => [f, '']));
    for (const line of String(text ?? '').split('\n')) {
        const m = line.match(/^\s*[-*]?\s*([a-z ]+):\s*(.*)$/i); if (!m) continue;
        const key = m[1].trim().toLowerCase(); if (key in got && !got[key]) got[key] = m[2].trim().replace(/^(none|unknown|n\/a|-)\.?$/i, '');
    }
    const items = [];
    const add = (kind, label, value, extra = {}) => items.push({ kind, label, value, on: true, ...extra });
    if (cleanAge(got.age)) add('age', `Age ${cleanAge(got.age)}`, cleanAge(got.age));
    if (cleanHeight(got.height)) add('height', `Height ${cleanHeight(got.height)}`, cleanHeight(got.height));
    if (cleanInterests(got.into)) add('into', `Into ${cleanInterests(got.into)}`, cleanInterests(got.into));
    for (const part of got.family.split('|').map(x => x.trim()).filter(Boolean).slice(0, 8)) {
        const [role = '', name = '', ...info] = part.split(',').map(x => x.trim());
        const named = /^[A-Z]/.test(name), who = { role, name: named ? name : '', info: [named ? '' : name, ...info].filter(Boolean).join(', ') };
        if (role || name) add('family', `${role || 'Family'}${who.name ? ` ${who.name}` : ''}${who.info ? ` (${who.info})` : ''}`, who);
    }
    const pets = got['pet names'].split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean).slice(0, 6);
    if (pets.length) add('pets', `Calls them ${pets.join(', ')}`, pets.join(', '));
    const says = got.sayings.split('|').map(x => x.trim().replace(/^["\u201c']|["\u201d']$/g, '')).filter(Boolean).slice(0, 4);
    for (const x of says) add('saying', `\u201c${x}\u201d`, x);
    for (const w of got.traits.split(',').slice(0, 8)) { const m = find(TRAITS, w); if (m && !items.some(i => i.id === m.id)) add('trait', m.label, 60, { id: m.id }); }
    for (const w of [...got.looks.split(','), got.job].slice(0, 7)) { const m = find(FACTS, w); if (m && !items.some(i => i.id === m.id)) add('fact', m.label, 60, { id: m.id }); }
    const era = norm(got.era), decade = era.match(/\b(1[89]\d0|20[0-2]0)s?\b/)?.[1];
    if (decade) { const us = /america|usa|united states|\bus\b/.test(era), uk = /brit|england|uk|london/.test(era);
        const m = ERAS.find(e => e.label.startsWith(`${decade}s`) && (us ? /america/i.test(e.label) : uk ? /brit/i.test(e.label) : !/america|brit/i.test(e.label))) ?? ERAS.find(e => e.label.startsWith(`${decade}s`));
        if (m) add('era', `Story set in the ${m.label}`, 70, { id: m.id }); }
    return items;
}

// who: 'char' reads about the character; 'user' about your persona; 'cast' about a side character, with their
// lorebook entry when one fired this session (app/lore.js).
export async function readCard(who, name, lore = '') {
    const c = ctx(); ui.cardRead = { who, loading: true, items: [], note: '' };
    let text = '';
    try { text = await c.generateQuietPrompt({ quietPrompt: ask(name || (who === 'user' ? '{{user}}' : '{{char}}'), lore), responseLength: 500 }); }
    catch (err) { console.warn('[Moodweaver] read the card failed', err); }
    const items = parseCard(text);
    ui.cardRead = { who, loading: false, items, note: items.length ? '' : 'Nothing usable came back. The card may not say much, or the model answered in story. Tap to try again.' };
}

// Adds what's kept: profile boxes filled where they're empty (or replaced when you kept a new value), family people
// that aren't there yet, pet names and sayings added on, traits and facts at a clear 60, the first three traits as
// core when none are starred, the era on the Story tab.
export function applyCard(state, story) {
    const kept = (ui.cardRead?.items ?? []).filter(i => i.on);
    for (const i of kept) {
        if (i.kind === 'age') state.age = i.value; if (i.kind === 'height') state.height = i.value; if (i.kind === 'into') state.interests = i.value;
        if (i.kind === 'pets') state.petNames = cleanWords([state.petNames, i.value].filter(Boolean).join(', '));
        if (i.kind === 'saying') state.sayings = cleanWords([state.sayings, i.value].filter(Boolean).join('\n'));
        if ((i.kind === 'trait' || i.kind === 'fact') && !(state.moods[i.id] > 0)) { state.moods[i.id] = i.value; if (!state.loadout.includes(i.id)) state.loadout.push(i.id); }
        if (i.kind === 'era' && story && !(story.moods[i.id] > 0)) { story.enabled = true; story.moods[i.id] = i.value; if (!story.loadout.includes(i.id)) story.loadout.push(i.id); }
    }
    const fam = familyMembers(state), have = m => fam.some(f => lowerLabel(f.role) === lowerLabel(m.role) && f.name === m.name);
    for (const i of kept.filter(x => x.kind === 'family')) if (!have(i.value)) fam.push(i.value);
    state.family = familyString(fam);
    if (!(state.core ?? []).length) state.core = kept.filter(i => i.kind === 'trait').slice(0, 3).map(i => i.id);
    ui.cardRead = null;
}

export function cardReadBlock(who) {
    const r = ui.cardRead?.who === who ? ui.cardRead : null;
    const button = `<button type="button" class="mw-card-read" data-action="card-read"${r?.loading ? ' disabled' : ''}>${r?.loading ? '\u2726 Reading\u2026' : `\u2726 ${who === 'user' ? 'Read the persona' : who === 'cast' ? 'Read about them' : 'Read the card'}`}</button>`;
    if (!r || r.loading || !r.items.length) return `<div class="mw-card-read-box">${button}<small>${r?.note || `Suggests a starting setup from what ${who === 'user' ? 'your persona and the lore' : who === 'cast' ? 'their lorebook entry, the card and the lore' : 'the card, scenario and lore'} already say. Nothing goes in until you add it.`}</small></div>`;
    return `<div class="mw-card-read-box is-open"><p class="mw-fine">Tap any you don\u2019t want, then add the rest.</p><div class="mw-card-chips">${r.items.map((i, n) =>
        `<button type="button" class="mw-card-chip ${i.on ? 'is-on' : ''}" data-card-pick="${n}" aria-pressed="${i.on}">${i.label.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])}</button>`).join('')}</div>
        <div class="mw-card-actions"><button type="button" class="mw-primary" data-action="card-apply">\uff0b Add ${r.items.filter(i => i.on).length}</button><button type="button" data-action="card-cancel">Not now</button></div></div>`;
}
