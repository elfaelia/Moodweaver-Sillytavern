// Single rows in the panel: sliders, buttons and the inventory list.
import { playerName, subjectName, target } from '../app/chat.js';
import { settings } from '../app/settings.js';
import { ui } from '../app/state.js';
import { BY_ID, MERGED_SEARCH_NAMES, analysed, sectionOf } from '../data/catalogue.js';
import { escapeHtml as esc } from '../engine/util.js';
import { level } from '../engine/strength.js';
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
// something other than you put it there (Settings › Show why).
function whyLine(m, state) {
    const why = state.moods[m.id] > 0 ? [ui.why?.get(m.id), courseNote(state, m.id)].filter(Boolean).join(' · ') : '';
    return why ? `<small class="mw-why">↳ ${esc(why)}</small>` : '';
}
// Traits get a star: up to three core traits, always sent first.
const coreButton = (m, state) => { if (sectionOf(m) !== 'trait') return ''; const on = state.core?.includes(m.id) && state.moods[m.id] > 0;
    return `<button type="button" class="mw-core ${on ? 'is-core' : ''}" data-core="${m.id}" aria-pressed="${on}" aria-label="${on ? 'Not a core trait' : 'Make it a core trait'}: ${esc(tagLabel(m))}" title="Core trait: always sent, whatever the mood (up to three)">${on ? '★' : '☆'}</button>`; };
export function row(m, state) {
    const value = state.moods[m.id], pin = state.pins[m.id];
    return `<div class="mw-mood" data-mood="${m.id}" data-aliases="${esc((MERGED_SEARCH_NAMES[m.id] ?? []).join(' '))}" style="--mw-accent:${m.color}">
        <div class="mw-row-head"><label for="mw-${m.id}">${esc(tagLabel(m))}</label><span data-level="${m.id}">${level(value)}</span>
        <output for="mw-${m.id}" data-value="${m.id}">${value}%</output>
        <button type="button" class="mw-pin ${pin ? 'is-pinned' : ''}" data-pin="${m.id}" aria-pressed="${pin}" aria-label="${pin ? 'Unpin' : 'Pin'} ${esc(tagLabel(m))}" title="Pin: the scene reader leaves it alone">${pin ? '◆' : '◇'}</button>${coreButton(m, state)}${listButton(m.id, state)}</div>
        <input id="mw-${m.id}" type="range" min="0" max="100" step="1" value="${value}" data-slider="${m.id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
        ${whyLine(m, state)}<small${m.note ? ` title="${esc(`Sent to the AI: ${m.cue}`)}"` : ''}>${esc(m.note ?? m.cue)}</small>${targetFields(m, state)}${value ? causeBox(`data-cause="${m.id}"`, state.causes?.[m.id]) + showsBox(m, state) : ''}</div>`;
}
// On an active feeling, how it shows on this person. Empty uses the default wording (the placeholder).
const showsBox = (m, state) => analysed(m) && ON_PAGE[m.id] && settings().showsMode !== 'off' ? `<input type="text" class="mw-cause mw-shows" data-shows="${m.id}" maxlength="120" value="${esc(state.shows?.[m.id] ?? '')}" placeholder="${settings().showsMode === 'mine' ? 'your wording (default is off): ' : 'shows as: '}${esc(ON_PAGE[m.id])}" title="How it shows on ${esc(subjectName())}. Leave empty for: ${esc(ON_PAGE[m.id])}" aria-label="How it shows on them">` : '';
export const causeBox = (attr, value) => `<input type="text" class="mw-cause" ${attr} maxlength="100" value="${esc(value ?? '')}" placeholder="because… (optional)" aria-label="Because">`;
// In the list: × takes it off this person's list. While adding: ＋ puts it on, ✓ shows it's there.
function listButton(id, state) {
    const inList = state.loadout?.includes(id);
    return ui.browsing ? `<button type="button" class="mw-list ${inList ? 'is-in' : ''}" data-loadout="${esc(id)}" aria-pressed="${!!inList}" title="${inList ? 'On the list' : 'Add to the list'}">${inList ? '✓' : '＋'}</button>`
        : `<button type="button" class="mw-list" data-unlist="${esc(id)}" title="Take off the list (sets it to 0)" aria-label="Take off the list">×</button>`;
}
export const turnLevel = v => v === 0 ? 'Neutral' : `${level(Math.abs(v))} turn-${v > 0 ? 'on' : 'off'}`;
export const turnFill = v => v >= 0 ? `--mw-from:50%;--mw-to:${50 + v / 2}%` : `--mw-from:${50 + v / 2}%;--mw-to:50%`;
export function turnRow(t, state) {
    const v = state.prefs?.[t.id] ?? 0;
    return `<div class="mw-mood mw-turn" data-mood="turn:${t.id}" style="--mw-accent:${t.color}"><div class="mw-row-head"><label for="mw-turn-${t.id}">${esc(t.label)}</label><span data-lvl>${turnLevel(v)}</span>${listButton(`turn:${t.id}`, state)}</div>
        <input id="mw-turn-${t.id}" type="range" min="-100" max="100" step="1" value="${v}" data-turn="${t.id}" style="${turnFill(v)}" aria-valuetext="${turnLevel(v)}">
        <div class="mw-turn-ends"><span>✕ Turn-off</span><span>Turn-on ♡</span></div><small>${esc(t.cue)}</small></div>`;
}
// What they carry, at the bottom of Facts (and your You tab). Ticked items are sent; unticked ones stay saved.
export function inventoryView(state, ch) {
    const items = state.inventory ?? [], carried = items.filter(i => i.carried).length;
    const intro = ui.who === 'user' ? `You decide when ${esc(playerName())} uses them; ${esc(ch.name)} only knows what they could see.`
        : 'Claude reaches for them when the moment fits, never just to show them off.';
    return `<section class="mw-inventory" data-anchor="carrying">
        <h5 class="mw-fact-head">Carrying <small>${items.length ? `${carried} sent${items.length > carried ? ` · ${items.length - carried} put away` : ''}` : 'a gun, a key, a letter'}</small></h5>
        ${items.length ? `<div class="mw-inv-list">${items.map(i => `<div class="mw-inv-item ${i.carried ? '' : 'is-stored'}" data-inv-row="${esc(i.id)}">
            <label class="mw-inv-check" title="${i.carried ? 'Carried: sent' : 'Put away: not sent'}"><input type="checkbox" data-inv-carried="${esc(i.id)}" ${i.carried ? 'checked' : ''} aria-label="Carry ${esc(i.text)}"><span></span></label>
            <div class="mw-inv-fields"><input type="text" class="mw-inv-name" data-inv-text="${esc(i.id)}" maxlength="60" value="${esc(i.text)}" aria-label="Item">
            <input type="text" class="mw-inv-note" data-inv-note="${esc(i.id)}" maxlength="80" value="${esc(i.note)}" placeholder="where / details (optional)" aria-label="Where or details"></div>
            <button type="button" class="mw-list" data-inv-remove="${esc(i.id)}" title="Delete" aria-label="Delete ${esc(i.text)}">×</button></div>`).join('')}</div>` : ''}
        <div class="mw-cast-add mw-inv-add"><input type="text" data-inv-new maxlength="60" enterkeyhint="done" placeholder="Add something they carry…" aria-label="New item"><button data-action="inv-add">＋ Add</button></div>
        <p class="mw-fine">${intro} Untick to put something away without deleting it.</p>
    </section>`;
}
