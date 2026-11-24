// Single rows in the panel: sliders, buttons and the inventory list.
import { playerName, subjectName, target } from '../app/chat.js';
import { settings } from '../app/settings.js';
import { ui } from '../app/state.js';
import { BY_ID, MERGED_SEARCH_NAMES, analysed, sectionOf } from '../data/catalogue.js';
import { escapeHtml as esc } from '../engine/util.js';
import { isBelief } from '../engine/state.js';
import { TIERS, level, tierOf } from '../engine/strength.js';
import { FACTS } from '../engine/moodpace.js';
import { ON_PAGE } from '../data/catalogue.js';

// "~3 h left, then hungover": how long a fact that runs its course has left (engine/moodpace.js).
export function courseNote(state, id) {
    const f = FACTS[id]; if (!f?.lasts) return '';
    const left = Math.max(0, f.lasts - (state.factClock?.[id]?.h ?? 0)), time = left >= 48 ? `${Math.round(left / 24)} days` : left >= 1 ? `${Math.round(left)} h` : `${Math.max(5, Math.round(left * 60 / 5) * 5)} min`;
    return `~${time} left${f.then ? `, then ${BY_ID[f.then].label.toLowerCase()}` : ''}`;
}
export const tagLabel = m => m.label.replaceAll('{{user}}', playerName()).replaceAll('{{char}}', target()?.name ?? 'main character');
export const fmtTokens = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
function targetFields(m, state) {
    if (!state.moods[m.id]) return '';
    const fields = m.id === 'hates_other' ? [['hate', 'Who?', 'Name of someone in the scene']]
        : m.id === 'comparing_people' ? [['compareA', 'Compare', 'Someone in the scene'], ['compareB', 'With', '{{user}}']]
        : m.category === 'era' ? [['year', 'Exact year (optional)', 'e.g. 1964']] : [];
    return fields.length ? `<div class="mw-target-fields">${fields.map(([key, label, placeholder]) => `<label>${label}<input type="text" data-target="${key}" maxlength="${key === 'year' ? 20 : 80}" ${key === 'year' ? 'inputmode="text"' : `list="${key === 'hate' ? 'mw-hate-names' : 'mw-cast-names'}"`} placeholder="${esc(placeholder)}" value="${esc(state.targets?.[key] ?? '')}"></label>`).join('')}</div>` : '';
}
// Why it's where it is, in one faint line: the story set it, a fact brought it, it's wearing off. Only when
// something other than you put it there (Settings \u203a Show why).
function whyLine(m, state) {
    const why = state.moods[m.id] > 0 ? [ui.why?.get(m.id), courseNote(state, m.id)].filter(Boolean).join(' \u00b7 ') : '';
    return why ? `<small class="mw-why">\u21b3 ${esc(why)}</small>` : '';
}
// Traits and mind settings get a star: up to three core ones, always sent first.
// Morals & views and Alignment rows get a belief star instead (\u2726): up to three, sent as what they act on first.
const coreButton = (m, state) => { if (!['trait', 'psyche'].includes(sectionOf(m))) return '';
    if (isBelief(m)) { const on = state.beliefs?.includes(m.id) && state.moods[m.id] > 0;
        return `<button type="button" class="mw-core mw-belief ${on ? 'is-core' : ''}" data-belief="${m.id}" aria-pressed="${on}" aria-label="${on ? 'Not a starred belief' : 'Make it a starred belief'}: ${esc(tagLabel(m))}" title="Starred belief: sent every reply as what they act on first (up to three)">${on ? '\u2726' : '\u2727'}</button>`; } const on = state.core?.includes(m.id) && state.moods[m.id] > 0;
    return `<button type="button" class="mw-core ${on ? 'is-core' : ''}" data-core="${m.id}" aria-pressed="${on}" aria-label="${on ? 'Not a core trait' : 'Make it a core trait'}: ${esc(tagLabel(m))}" title="Core trait: always sent, whatever the mood (up to three)">${on ? '\u2605' : '\u2606'}</button>`; };
// Strength as eight moons, faint to maximum, filling like the phases, with a dark new moon for 0. A tap sets
// that strength; tapping the one it's already at (or the new moon) clears it. No dragging.
const MOON_AT = [5, 15, 30, 50, 70, 85, 95, 100];
export function moons(m, value) {
    const now = tierOf(value);
    const phases = [...TIERS].reverse().map((t, i) => { const lit = value >= t.min, here = now === t;
        return `<button type="button" class="mw-moon ${lit ? 'is-lit' : ''} ${here ? 'is-now' : ''}" data-moon="${m.id}" data-v="${MOON_AT[i]}" aria-pressed="${here}" aria-label="${t.name}" title="${t.name}" style="--mw-phase:${Math.round((i + 1) / 8 * 100)}%"><span></span></button>`; });
    return `<div class="mw-moons" role="group" aria-labelledby="mw-${m.id}"><button type="button" class="mw-moon is-new ${value ? '' : 'is-now'}" data-moon="${m.id}" data-v="0" aria-pressed="${!value}" aria-label="Off" title="Off"><span></span></button>${phases.join('')}</div>`;
}
// Mind settings with two sides (complexes and a few others) get a meter that starts in the middle, which is
// off: tapping left sets the unhealthy side, tapping right the healthy one, further out is stronger. The side
// lives in state.psyLean, the strength in moods. Tapping the moon it's already at goes back to the middle.
export const twoSided = m => Boolean(m.light && m.dark);
const POLE_AT = [30, 50, 70, 95];
export const sideOf = (m, state) => twoSided(m) && state.moods[m.id] > 0 ? (state.psyLean?.[m.id] === 'light' ? 'light' : 'dark') : '';
export const SIDE_NAME = { dark: 'Unhealthy side', light: 'Healthy side' };
function poleMoons(m, state) {
    const value = state.moods[m.id] ?? 0, side = sideOf(m, state), now = tierOf(value);
    const moon = (s, v, i) => { const lit = side === s && value >= v - 1, here = lit && tierOf(v) === now;
        return `<button type="button" class="mw-moon mw-pole-${s} ${lit ? 'is-lit' : ''} ${here ? 'is-now' : ''}" data-pole="${m.id}" data-side="${s}" data-v="${v}" aria-pressed="${here}" aria-label="${SIDE_NAME[s]}, ${tierOf(v).name}" title="${SIDE_NAME[s]}: ${tierOf(v).name}" style="--mw-phase:${Math.round((i + 1) / 4 * 100)}%"><span></span></button>`; };
    const dark = POLE_AT.map((v, i) => moon('dark', v, i)).reverse(), light = POLE_AT.map((v, i) => moon('light', v, i));
    return `<div class="mw-moons mw-poles" role="group" aria-labelledby="mw-${m.id}">${dark.join('')}<button type="button" class="mw-moon is-new ${value ? '' : 'is-now'}" data-pole="${m.id}" data-side="" data-v="0" aria-pressed="${!value}" aria-label="Off" title="Off: nothing is sent"><span></span></button>${light.join('')}</div>
        <div class="mw-pole-legend" aria-hidden="true"><span>\u25c2 unhealthy</span><span>off</span><span>healthy \u25b8</span></div>`;
}
// What the panel says about a two-sided setting: what it is, then how its side plays out once one is chosen.
const sideText = (m, state) => { const side = sideOf(m, state); return side ? `<p class="mw-side mw-side-${side}"><b>${SIDE_NAME[side]}:</b> ${esc(m[side])}</p>` : ''; };
// An author's books, and (Settings \u203a Panel) how they write, under the row.
const authorLines = m => m.books ? `<small class="mw-books">${esc([m.era, m.origin].filter(Boolean).join(', '))}${m.era || m.origin ? ' \u00b7 ' : ''}${esc(m.books.replaceAll("; ", " \u00b7 "))}</small>${m.style && settings().authorStyle !== false ? `<p class="mw-style">${esc(m.style)}</p>` : ''}` : '';
// Once an author is on: what they write. Whole voice (both), narration only, or dialogue only. Three wide buttons.
const ROLE_CHOICES = [['', 'Both', 'Narration and dialogue'], ['narration', 'Narration', 'Everything outside the quotes'], ['dialogue', 'Dialogue', 'What people say aloud']];
const roleButtons = (m, state) => !m.books || !(state.moods[m.id] > 0) ? '' : `<div class="mw-author-role" role="group" aria-label="What ${esc(m.label)} writes">${ROLE_CHOICES.map(([v, name, hint]) => {
    const on = (state.authorRole?.[m.id] ?? '') === v;
    return `<button type="button" class="${on ? 'is-on' : ''}" data-author-role="${m.id}" data-role="${v}" aria-pressed="${on}" title="${hint}">${name}</button>`; }).join('')}</div>`;
export function row(m, state) {
    const value = state.moods[m.id], pin = state.pins[m.id];
    return `<div class="mw-mood" data-mood="${m.id}" data-aliases="${esc((MERGED_SEARCH_NAMES[m.id] ?? []).join(' '))}" style="--mw-accent:${m.color}">
        <div class="mw-row-head"><label id="mw-${m.id}">${esc(tagLabel(m))}</label><span data-level="${m.id}">${sideOf(m, state) ? `${sideOf(m, state) === 'dark' ? 'unhealthy' : 'healthy'} \u00b7 ` : ''}${level(value)}</span>
        <button type="button" class="mw-pin ${pin ? 'is-pinned' : ''}" data-pin="${m.id}" aria-pressed="${pin}" aria-label="${pin ? 'Unpin' : 'Pin'} ${esc(tagLabel(m))}" title="Pin: the scene reader leaves it alone">${pin ? '\u25c6' : '\u25c7'}</button>${coreButton(m, state)}${listButton(m.id, state)}</div>
        ${twoSided(m) ? poleMoons(m, state) : moons(m, value)}
        ${whyLine(m, state)}<small${m.note ? ` title="${esc(`Sent to the AI: ${m.cue}`)}"` : ''}>${esc(m.note ?? m.cue)}</small>${roleButtons(m, state)}${authorLines(m)}${sideText(m, state)}${targetFields(m, state)}${value ? causeBox(`data-cause="${m.id}"`, state.causes?.[m.id]) + showsBox(m, state) : ''}</div>`;
}
// On an active feeling, how it shows on this person. Empty uses the default wording (the placeholder).
const showsBox = (m, state) => analysed(m) && ON_PAGE[m.id] && settings().showsMode !== 'off' ? `<input type="text" class="mw-cause mw-shows" data-shows="${m.id}" maxlength="120" value="${esc(state.shows?.[m.id] ?? '')}" placeholder="${settings().showsMode === 'mine' ? 'your wording (default is off): ' : 'shows as: '}${esc(ON_PAGE[m.id])}" title="How it shows on ${esc(subjectName())}. Leave empty for: ${esc(ON_PAGE[m.id])}" aria-label="How it shows on them">` : '';
export const causeBox = (attr, value) => `<input type="text" class="mw-cause" ${attr} maxlength="100" value="${esc(value ?? '')}" placeholder="because\u2026 (optional)" aria-label="Because">`;
// In the list: \u00d7 takes it off this person's list. While adding: \uff0b puts it on, \u2713 shows it's there.
function listButton(id, state) {
    const inList = state.loadout?.includes(id);
    return ui.browsing ? `<button type="button" class="mw-list ${inList ? 'is-in' : ''}" data-loadout="${esc(id)}" aria-pressed="${!!inList}" title="${inList ? 'On the list' : 'Add to the list'}">${inList ? '\u2713' : '\uff0b'}</button>`
        : `<button type="button" class="mw-list" data-unlist="${esc(id)}" title="Take off the list (sets it to 0)" aria-label="Take off the list">\u00d7</button>`;
}
export const turnLevel = v => v === 0 ? 'Neutral' : `${level(Math.abs(v))} turn-${v > 0 ? 'on' : 'off'}`;
export const turnFill = v => v >= 0 ? `--mw-from:50%;--mw-to:${50 + v / 2}%` : `--mw-from:${50 + v / 2}%;--mw-to:50%`;
export function turnRow(t, state) {
    const v = state.prefs?.[t.id] ?? 0;
    return `<div class="mw-mood mw-turn" data-mood="turn:${t.id}" style="--mw-accent:${t.color}"><div class="mw-row-head"><label for="mw-turn-${t.id}">${esc(t.label)}</label><span data-lvl>${turnLevel(v)}</span>${listButton(`turn:${t.id}`, state)}</div>
        <input id="mw-turn-${t.id}" type="range" min="-100" max="100" step="1" value="${v}" data-turn="${t.id}" style="${turnFill(v)}" aria-valuetext="${turnLevel(v)}">
        <div class="mw-turn-ends"><span>\u2715 Turn-off</span><span>Turn-on \u2661</span></div><small>${esc(t.cue)}</small></div>`;
}
// What they carry, at the bottom of Facts (and your You tab). Ticked items are sent; unticked ones stay saved.
export function inventoryView(state, ch) {
    const items = state.inventory ?? [], carried = items.filter(i => i.carried).length;
    const intro = ui.who === 'user' ? `${esc(ch.name)} only knows what they could see.` : 'Used when the moment fits.';
    return `<section class="mw-inventory" data-anchor="carrying">
        <h5 class="mw-fact-head">Carrying <small>${items.length ? `${carried} sent${items.length > carried ? ` \u00b7 ${items.length - carried} put away` : ''}` : 'a gun, a key, a letter'}</small></h5>
        ${items.length ? `<div class="mw-inv-list">${items.map(i => `<div class="mw-inv-item ${i.carried ? '' : 'is-stored'}" data-inv-row="${esc(i.id)}">
            <label class="mw-inv-check" title="${i.carried ? 'Carried: sent' : 'Put away: not sent'}"><input type="checkbox" data-inv-carried="${esc(i.id)}" ${i.carried ? 'checked' : ''} aria-label="Carry ${esc(i.text)}"><span></span></label>
            <div class="mw-inv-fields"><input type="text" class="mw-inv-name" data-inv-text="${esc(i.id)}" maxlength="60" value="${esc(i.text)}" aria-label="Item">
            <input type="text" class="mw-inv-note" data-inv-note="${esc(i.id)}" maxlength="80" value="${esc(i.note)}" placeholder="where / details (optional)" aria-label="Where or details"></div>
            <button type="button" class="mw-list" data-inv-remove="${esc(i.id)}" title="Delete" aria-label="Delete ${esc(i.text)}">\u00d7</button></div>`).join('')}</div>` : ''}
        <div class="mw-cast-add mw-inv-add"><input type="text" data-inv-new maxlength="60" enterkeyhint="done" placeholder="Add something they carry\u2026" aria-label="New item"><button data-action="inv-add">\uff0b Add</button></div>
        <p class="mw-fine">${intro} Untick to put something away.</p>
    </section>`;
}
