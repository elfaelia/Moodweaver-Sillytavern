import { pronounize } from './pronouns.js';
// More Bonds meters, all off until you switch them on, and the dynamics they unlock. Each meter is
// how the character is toward your persona, moved by the reply's hidden line like Friendship and Romance.
// Data and small pure functions only; bond.js does the reading and the panel.
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// key, label, two-sided (-100..100) or not (0..100), start, hidden-line word, words by value, what Claude
// reads when it's strong (high, and low for two-sided ones), one-line panel description.
export const MORE_METERS = [
    ['ob', 'Obsession', false, 0, 'obsession', [[81, 'consumed'], [61, 'fixated'], [41, 'preoccupied'], [21, 'thinks about them a lot'], [1, 'curious'], [0, 'not obsessed']],
        (n, u) => `${u} is in every thought: ${n} replays, collects and plans around ${u}`, null, 'How much of their head you take up.'],
    ['po', 'Possessiveness', false, 0, 'possessive', [[81, 'treats them as property'], [61, 'openly possessive'], [41, 'possessive'], [21, 'a little territorial'], [0, 'not possessive']],
        (n, u) => `${n} acts like ${u} belongs to ${n}: hands on, deciding for ${u}, warning others off`, null, 'How much they think you’re theirs.'],
    ['je', 'Jealousy', false, 0, 'jealousy', [[81, 'seething'], [61, 'jealous'], [41, 'watchful'], [21, 'twinges'], [0, 'calm']],
        (n, u) => `anyone near ${u} is a rival: ${n} questions, goes cold, punishes ${u} or them`, null, 'How threatened they are by anyone near you.'],
    ['pr', 'Protectiveness', false, 0, 'protective', [[81, 'would kill for them'], [61, 'fiercely protective'], [41, 'protective'], [21, 'watches out for them'], [0, 'not protective']],
        (n, u) => `${n} puts ${n}self between ${u} and any harm, and calls the control that comes with it care`, null, 'How hard they guard you.'],
    ['re', 'Respect', true, 0, 'respect', [[60, 'admires them'], [25, 'respects them'], [-24, 'neutral'], [-59, 'looks down on them'], [-100, 'contempt']],
        (n, u) => `${n} takes ${u} seriously: listens, argues as an equal, is privately impressed`, (n, u) => `${n} holds ${u} in contempt: talks over, mocks, explains slowly`, 'From contempt to admiration.'],
    ['fa', 'Fascination', false, 0, 'fascination', [[81, 'can’t look away'], [61, 'fascinated'], [41, 'intrigued'], [21, 'curious'], [0, 'indifferent']],
        (n, u) => `${n} studies ${u}: watching reactions, testing, wanting to understand or capture ${u}`, null, 'How much they want to study or capture you.'],
    ['pe', 'Pedestal', true, 0, 'pedestal', [[60, 'worships the idea of them'], [25, 'idealises them'], [-24, 'sees them as they are'], [-59, 'disappointed'], [-100, 'disillusioned']],
        (n, u) => `${n} sees a perfect version of ${u} and edits out anything that doesn't fit`, (n, u) => `${u} has fallen off the pedestal: ${n} punishes ${u} for not being who ${n} imagined`, 'From disillusioned to worshipping an idea of you.'],
    ['de', 'Dependence', false, 0, 'dependence', [[81, 'can’t function without them'], [61, 'leans on them'], [41, 'relies on them'], [21, 'likes having them around'], [0, 'doesn’t need them']],
        (n, u) => `${n} needs ${u} to get through the day and resents needing anyone`, null, 'How much they need you.'],
    ['hu', 'Urge to hurt', false, 0, 'hurt', [[81, 'on the edge of violence'], [61, 'wants to hurt them'], [41, 'imagines hurting them'], [21, 'a flicker of violence'], [0, 'no urge to hurt']],
        (n, u) => `${n}'s urge to hurt ${u} is close to the surface: looks at throat and hands, a voice gone too calm`, null, 'How close they are to hurting you.'],
    ['op', 'Openness', false, 20, 'openness', [[81, 'nothing hidden'], [61, 'lets them see it'], [41, 'lets things slip'], [21, 'mostly masked'], [0, 'fully masked']],
        (n, u) => `${n} lets ${u} see what's under the mask, and both of them know how dangerous that is`, (n, u) => `${n} keeps the mask on with ${u}: performs, deflects, gives nothing real`, 'How much of the real them you get to see.'],
    ['gu', 'Guilt', false, 0, 'guilt', [[81, 'eaten by guilt'], [61, 'guilty'], [41, 'uneasy about it'], [21, 'a twinge'], [0, 'no guilt']],
        (n, u) => `${n} is trying to make up for what ${n} did to ${u}: softness, gifts, staying close, and it doesn't erase it`, null, 'What they feel about what they’ve done to you.'],
    ['co', 'Corruption', false, 0, 'corruption', [[81, 'has dragged them under'], [61, 'corrupting them'], [41, 'pulling them in'], [21, 'testing them'], [0, 'leaves them be']],
        (n, u) => `${n} is pulling ${u} into ${n}'s world one compromise at a time and savours each step down`, null, 'How far they’re dragging you into their world.'],
    ['kn', 'Knows about you', false, 0, 'knows', [[81, 'knows everything'], [61, 'knows far too much'], [41, 'knows a lot'], [21, 'has looked into them'], [0, 'knows what they’ve been told']],
        (n, u) => `${n} knows more about ${u} than ${u} has said: routines, secrets and small details used too casually`, null, 'How much they’ve found out by watching or digging.'],
    // Seven more, so care, rules, heat, grudges, chaos, loyalty and teaching can each steer a scene.
    ['ca', 'Care', false, 0, 'care', [[81, 'sees to their every need'], [61, 'tends to them'], [41, 'looks after them'], [21, 'checks on them'], [0, 'leaves them to it']],
        (n, u) => `${n} looks after ${u} with ${n}'s own hands: feeding, bathing, dressing, patching up, and the closeness that comes with it`, null, 'How much they look after you: feeding, bathing, dressing, nursing.'],
    ['di', 'Discipline', false, 0, 'discipline', [[81, 'rules everything they do'], [61, 'strict'], [41, 'sets rules'], [21, 'expects things'], [0, 'no rules']],
        (n, u) => `${n} holds ${u} to rules: expectations said plainly, rewards for doing well, consequences for slipping`, null, 'Rules, rewards and punishments they hold you to.'],
    ['lu', 'Lust', false, 0, 'lust', [[81, 'burning for them'], [61, 'wants them badly'], [41, 'wants them'], [21, 'notices them'], [0, 'no heat']],
        (n, u) => `${n} wants ${u} physically and it's never far from ${n}'s mind: looks, closeness, touches that linger`, null, 'How much they want you physically, over the whole relationship. The ♨ Desire card is arousal right now.'],
    ['rs', 'Resentment', false, 0, 'resentment', [[81, 'bitter to the core'], [61, 'resents them'], [41, 'holds a grudge'], [21, 'a sore spot'], [0, 'no grudge']],
        (n, u) => `${n} carries a grudge against ${u}: old wounds brought up, small paybacks, softness that gets punished`, null, 'Grudges and bitterness toward you, even alongside love.'],
    ['vo', 'Volatility', false, 0, 'volatility', [[81, 'about to blow'], [61, 'explosive'], [41, 'stormy'], [21, 'touchy'], [0, 'steady']],
        (n, u) => `things between ${n} and ${u} are about to blow: tempers spike over nothing, and the making up is as intense as the fight`, null, 'How unstable it is: fights, breakups and making up.'],
    ['ly', 'Loyalty', false, 0, 'loyalty', [[81, 'would die for them'], [61, 'fiercely loyal'], [41, 'loyal'], [21, 'sticks around'], [0, 'owes them nothing']],
        (n, u) => `${n} stands by ${u} whatever it costs: covering for ${u}, staying when anyone sane would leave`, null, 'How bound they feel to you, even when they don’t like you.'],
    ['gd', 'Guidance', false, 0, 'guidance', [[81, 'shaping who they become'], [61, 'teaching them'], [41, 'guides them'], [21, 'gives advice'], [0, 'not teaching']],
        (n, u) => `${n} is teaching ${u} and steering who ${u} becomes: lessons, corrections, standards, and pride or disappointment in the result`, null, 'How much they teach and steer you, for better or worse.'],
];
const MORE_KEYS = MORE_METERS.map(([k]) => k);
const DEF = Object.fromEntries(MORE_METERS.map(m => [m[0], m]));
export const moreWord = (k, v) => DEF[k][5].find(([min]) => v >= min)[1];
// Quick picks for the characters you play most. They only switch meters on; you can change any of them.
export const MORE_PRESETS = [
    ['Easterman', ['ob', 'po', 'pr', 'fa', 'de', 'gu', 'kn', 'ca', 'di']],
    ['Jefferson', ['fa', 'co', 're', 'hu', 'po', 'op', 'gd', 'lu']],
    ['Joe', ['ob', 'pe', 'je', 'pr', 'kn', 'hu', 'gu']],
    ['Bateman', ['re', 'hu', 'op', 'fa', 'je', 'lu']],
    ['Rick', ['re', 'de', 'op', 'pr', 'gu', 'rs', 'ly']],
    // By kind of relationship rather than by character.
    ['Captor', ['po', 'pr', 'ob', 'gu', 'ca', 'di', 'hu']],
    ['Toxic on-off', ['rs', 'vo', 'ly', 'de', 'lu', 'gu', 'je']],
    ['Romance', ['lu', 'ca', 'pr', 'je', 'op', 'ly']],
    ['Mentor', ['gd', 're', 'pr', 'ca', 'di', 'co']],
];
export function cleanMore(raw) {
    const x = raw && typeof raw === 'object' ? raw : {};
    const range = k => DEF[k][2] ? [-100, 100] : [0, 100];
    const n = (k, v, d) => Number.isFinite(Number(v)) && v !== null && v !== '' ? clamp(Math.round(Number(v)), ...range(k)) : d;
    const anchor = x.anchor && typeof x.anchor === 'object' ? { ...Object.fromEntries(MORE_KEYS.map(k => [k, n(k, x.anchor[k], DEF[k][3])])),
        key: String(x.anchor.key ?? '').slice(0, 120), pos: Number.isFinite(Number(x.anchor.pos)) ? Math.round(Number(x.anchor.pos)) : -1 } : null;
    return { on: [...new Set((Array.isArray(x.on) ? x.on : []).filter(k => DEF[k]))], anchor,
        pins: Object.fromEntries(MORE_KEYS.map(k => [k, x.pins?.[k] === null || x.pins?.[k] === undefined || x.pins?.[k] === '' ? null : n(k, x.pins[k], null)])) };
}
// list: [{ pos, key, s: { m: { ob: +3, ... } } }] oldest first. Meters that are off stay undefined, so
// nothing that depends on them can fire.
// cap: the largest step one reply can make, set by the chat's pace (bond.js PACE).
export function computeMore(raw, list = [], cap = 10) {
    const d = cleanMore(raw), v = Object.fromEntries(MORE_KEYS.map(k => [k, DEF[k][3]]));
    let start = 0;
    if (d.anchor) {
        let at = d.anchor.key ? list.findIndex(x => x.key === d.anchor.key) : -1;
        if (at < 0 && d.anchor.key) for (let i = list.length - 1; i >= 0; i--) if (list[i].pos <= d.anchor.pos) { at = i; break; }
        for (const k of MORE_KEYS) v[k] = d.anchor[k]; start = at + 1;
    }
    for (let i = start; i < list.length; i++) for (const k of d.on) {
        const step = list[i].s?.m?.[k]; if (!step) continue;
        v[k] = clamp(v[k] + clamp(step, -cap, cap), DEF[k][2] ? -100 : 0, 100);
    }
    for (const k of MORE_KEYS) if (d.pins[k] !== null) v[k] = d.pins[k];
    return { values: Object.fromEntries(d.on.map(k => [k, v[k]])), on: d.on, pins: d.pins };
}
// Dragging a bar sets every meter where it stands now; later replies move them from there.
export function setMore(bond, key, value, list = [], cap = 10) {
    if (!DEF[key]) return;
    const d = bond.more = cleanMore(bond.more), now = computeMore({ ...d, on: MORE_KEYS }, list, cap).values, last = list[list.length - 1];
    const v = clamp(Math.round(Number(value) || 0), DEF[key][2] ? -100 : 0, 100);
    d.anchor = { ...now, [key]: v, key: last?.key ?? '', pos: last?.pos ?? -1 };
    if (d.pins[key] !== null) d.pins[key] = v;
}
// What Claude reads under "[character] toward [player]": only meters that say something, in words.
const says = (k, v) => DEF[k][2] ? Math.abs(v) >= 25 : k === 'op' ? v >= 41 || v <= 20 : v >= 21;
// The meters that make it onto the line, with their values (the overlap check reads this).
export function saidMeters(raw, list = [], cap = 10) {
    const { values, on } = computeMore(raw, list, cap);
    return Object.fromEntries(on.filter(k => says(k, values[k])).map(k => [k, values[k]]));
}
export function moreLines(raw, list, n, u, cap = 10) {
    const { values, on } = computeMore(raw, list, cap);
    if (!on.length) return [];
    const said = on.filter(k => says(k, values[k]));
    if (!said.length) return [];
    const words = said.map(k => `${DEF[k][1].toLowerCase()}: ${moreWord(k, values[k]).replace(/\bthem\b/, u)}`);
    const strong = said.map(k => values[k] >= 61 ? DEF[k][6](n, u) : (DEF[k][2] && values[k] <= -60) || (k === 'op' && values[k] <= 20) ? DEF[k][7]?.(n, u) : '').filter(Boolean).map(s => pronounize(s, n, u));
    return [`${words.join('; ')}${strong.length ? `. ${strong.map(s => s[0].toUpperCase() + s.slice(1)).join('. ')}` : ''}`];
}
// Field names on the hidden line: "obsession +3, jealousy +5, respect -4".
export function metersOf(v) {
    const out = {};
    for (const part of String(v ?? '').toLowerCase().replace(/[−–]/g, '-').split(/[,;]/)) {
        const m = part.trim().match(/^([a-z ]+?)\s*:?\s*([+-]\s*\d{1,3})/); if (!m) continue;
        const word = m[1].trim(), hit = MORE_METERS.find(r => word.startsWith(r[4]) || word === r[1].toLowerCase()); if (!hit) continue;
        out[hit[0]] = (out[hit[0]] ?? 0) + clamp(Number(m[2].replace(/\s/g, '')), -25, 25);
    }
    return Object.keys(out).length ? out : null;
}
export const meterWeaveNames = on => on.filter(k => DEF[k]).map(k => DEF[k][4]);

