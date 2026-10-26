// Sims-style needs board: the latest info board, tidied into a scene card, moodlet tiles and need bars.
import { escapeHtml as esc, level, CATEGORIES } from './core.js';
import { matchMood, needWord } from './board.js';

const CATEGORY_LOOK = Object.fromEntries(CATEGORIES.map(([id, , icon, color]) => [id, [icon, color]]));
const P = {
    hunger: '<path d="M4 1.5v4.5a2 2 0 0 0 4 0V1.5M6 1.5v13M12 14.5v-13c-1.7.8-2.6 2.7-2.6 5 0 1.6.9 2.8 2.6 3.1"/>',
    energy: '<path d="M9.2 1.5 3.6 9h4l-.8 5.5L12.4 7h-4z"/>',
    bladder: '<path d="M8 1.8C6 4.6 3.8 7.3 3.8 9.8a4.2 4.2 0 0 0 8.4 0C12.2 7.3 10 4.6 8 1.8z"/>',
    hygiene: '<circle cx="6" cy="9.6" r="3.6"/><circle cx="11.6" cy="5" r="2.3"/><circle cx="12.3" cy="11.6" r="1.4"/>',
    comfort: '<path d="M3.5 7.5V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2.5M1 12.5V9.2a1.6 1.6 0 0 1 3.2 0v1.3h7.6V9.2a1.6 1.6 0 0 1 3.2 0v3.3zM3 12.5V14M13 12.5V14"/>',
    social: '<path d="M1.8 3h8.6v6.2H5.6L2.8 11.5V9.2h-1z"/><path d="M12.4 5.6h1.8v6h-1.2v2l-2.6-2H7.2"/>',
    fun: '<rect x="2.3" y="2.3" width="11.4" height="11.4" rx="2.6"/><circle cx="5.6" cy="5.6" r=".95" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r=".95" fill="currentColor" stroke="none"/><circle cx="10.4" cy="10.4" r=".95" fill="currentColor" stroke="none"/>',
    health: '<path d="M8 14S1.8 10.3 1.8 6.1A3.2 3.2 0 0 1 8 4.8a3.2 3.2 0 0 1 6.2 1.3C14.2 10.3 8 14 8 14z"/><path d="M3.6 8.2h2.1l1-1.8 1.6 3.6 1-1.8h3"/>',
    horny: '<path d="M8 14.6c-2.8 0-4.6-1.9-4.6-4.4 0-2.9 2.4-4.2 2.9-7.7 1.6 1 2.3 2.6 2.2 4.1.6-.4 1-1.2 1.1-2 1.8 1.4 3 3.3 3 5.6 0 2.5-1.8 4.4-4.6 4.4z"/>',
    pin: '<path d="M8 15s5-4.7 5-8.5a5 5 0 0 0-10 0C3 10.3 8 15 8 15z"/><circle cx="8" cy="6.5" r="1.8"/>',
    people: '<circle cx="6" cy="5" r="2.5"/><path d="M1.5 14c0-2.6 2-4.5 4.5-4.5s4.5 1.9 4.5 4.5M11 2.7a2.3 2.3 0 0 1 0 4.6M12.6 9.6c1.3.6 2 2 2 3.9"/>',
    hanger: '<path d="M6.6 3.4A1.5 1.5 0 1 1 8 5v1.2l-6.2 4.5a.8.8 0 0 0 .5 1.4h11.4a.8.8 0 0 0 .5-1.4L8 6.2"/>',
    mind: '<path d="M8 2.2a3.6 3.6 0 0 0-3.4 2.5A2.8 2.8 0 0 0 3 9.7a2.6 2.6 0 0 0 3.4 3.1L8 13.8l1.6-1a2.6 2.6 0 0 0 3.4-3.1 2.8 2.8 0 0 0-1.6-5A3.6 3.6 0 0 0 8 2.2zM8 2.2v11.6"/>',
    body: '<circle cx="8" cy="3.2" r="1.8"/><path d="M3 6.6h10M8 6.6v3.6M8 10.2l-2.6 4.3M8 10.2l2.6 4.3"/>',
    edit: '<path d="M10.8 2.4l2.8 2.8L6 12.8l-3.4.6.6-3.4z"/>',
};
export const icon = (name, cls = '') => `<svg class="mw-ic ${cls}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${P[name] ?? ''}</svg>`;
const needColour = v => v <= 15 ? '#e46a6a' : v <= 35 ? '#e79a5c' : v <= 65 ? '#dfc56c' : '#8fd18a';
const lc = s => String(s).toLowerCase();

function tile(kind, t, focus) {
    const m = matchMood(t.text), [glyph, colour] = m ? CATEGORY_LOOK[m.category] ?? [] : [];
    const id = `${kind}:${t.text}`;
    return `<button type="button" class="mw-tile ${t.kept ? 'is-kept' : ''} ${t.added ? 'is-added' : ''}" data-board-tile="${esc(id)}" aria-pressed="${focus === id}" style="--mw-accent:${colour ?? (kind === 'state' ? '#b7acd7' : '#d7a39b')}" title="${m ? esc(m.label) : 'Tap for options'}">
        <span class="mw-tile-icon">${glyph ? esc(glyph) : kind === 'state' ? '✦' : '✚'}</span><span class="mw-tile-text">${esc(t.text)}</span>${t.kept ? '<em>◆</em>' : ''}</button>`;
}
function tileGroup(kind, tiles, focus, ownerName) {
    const focused = tiles.find(t => focus === `${kind}:${t.text}`);
    return `<div class="mw-tiles">${tiles.map(t => tile(kind, t, focus)).join('')}
        <span class="mw-tile-add"><input type="text" data-board-add="${kind}" maxlength="60" enterkeyhint="done" placeholder="＋ add" aria-label="Add to ${kind === 'state' ? 'State' : 'Physical State'}"></span></div>
    ${focused ? `<div class="mw-tile-actions" role="group" aria-label="${esc(focused.text)}">
        <b>${esc(focused.text)}</b>
        <button type="button" data-board-keep="${esc(kind)}" aria-pressed="${focused.kept}">${focused.kept ? '◆ Kept' : '◇ Keep'}</button>
        <button type="button" data-board-cut="${esc(kind)}">✕ ${focused.added ? 'Remove' : 'Cut'}</button>
        ${kind === 'state' ? `<button type="button" data-board-promote>⇪ Moodlet for ${esc(ownerName)}</button>` : ''}
        <p class="mw-fine">${focused.kept ? 'Kept: sent every reply as part of the board until you let go.' : 'Keep sends it every reply. Cut tells the bot to drop it.'}${kind === 'state' ? ' A moodlet gets a slider in Moods.' : ''}</p></div>` : ''}`;
}
function needCell(nd) {
    const colour = needColour(nd.value), word = needWord(nd.value);
    return `<div class="mw-need ${nd.value <= 15 ? 'is-critical' : ''} ${nd.known ? '' : 'is-quiet'}" style="--mw-need:${colour}" data-need-row="${nd.id}">
        <div class="mw-need-head"><span class="mw-need-icon">${icon(nd.id)}</span><label for="mw-need-${nd.id}">${nd.label}</label>
            ${nd.pinned ? `<button type="button" class="mw-need-pin" data-need-unpin="${nd.id}" title="Set by you. Tap to follow the board again" aria-label="Unpin ${nd.label}">◆</button>` : ''}<span class="mw-need-word" data-need-word="${nd.id}">${word}</span></div>
        <input id="mw-need-${nd.id}" type="range" min="0" max="100" step="5" value="${nd.value}" data-need="${nd.id}" style="--mw-fill:${nd.value}%" aria-valuetext="${word}">
        ${nd.source ? `<small title="${esc(nd.source)}">“${esc(nd.source)}”</small>` : ''}</div>`;
}
function presentChips(live, people) {
    const raw = String(live.present ?? '');
    if (!raw || /^(none|no one|nobody|alone|n\/a|-)$/i.test(raw.trim())) return '<span class="mw-present-none">Nobody else</span>';
    const names = raw.split(/\s*(?:,|;|&|\band\b)\s*/i).map(s => s.trim()).filter(Boolean).slice(0, 8);
    return names.map(name => {
        const p = people.find(x => x.match(name));
        return p ? `<button type="button" class="mw-present ${p.away ? 'is-away' : ''}" ${p.attrs} title="Open ${esc(p.name)}">${esc(name)}</button>`
            : `<button type="button" class="mw-present is-new" data-board-addcast="${esc(name)}" title="Add ${esc(name)} to the cast">＋ ${esc(name)}</button>`;
    }).join('');
}
const editField = (key, label, value, max = 200) => max > 80
    ? `<label class="mw-field">${label}<textarea data-board-field="${key}" maxlength="${max}" rows="2" enterkeyhint="done">${esc(value)}</textarea></label>`
    : `<label class="mw-field">${label}<input type="text" data-board-field="${key}" maxlength="${max}" enterkeyhint="done" value="${esc(value)}"></label>`;
const pinMark = (pins, key) => pins[key] ? `<button type="button" class="mw-pinned" data-board-unpin="${key}" title="Set by you. Tap to follow the board again" aria-label="Unpin">◆</button>` : '';

// opts: { live, send, sync, charName, userName, people: [{ name, match(name), attrs, away }], editing, focus }
export function boardView({ live, send, sync, charName, userName, people, editing, focus }) {
    const pins = live.meta.pins, sky = live.sky;
    const [clock, ampm] = (() => { const m = String(live.time).match(/^(\d{1,2}:\d{2})\s*([AP]\.?M\.?)?(.*)$/i); return m ? [m[1], `${m[2] ?? ''}${m[3] ?? ''}`.trim()] : [live.time, '']; })();
    const owner = live.name || charName;
    const scene = live.found || editing ? `
        <div class="mw-sky-top"><div class="mw-clock"><b>${esc(clock || '—')}</b><span>${esc(ampm)}</span>${pinMark(pins, 'time')}</div>${live.emoji ? `<span class="mw-sky-emoji" aria-hidden="true">${esc(live.emoji)}</span>` : ''}</div>
        <div class="mw-sky-date">${esc(live.day)}${pinMark(pins, 'date')}</div>
        <div class="mw-sky-meta">${[live.season, live.temp].filter(Boolean).map(esc).join(' · ')}</div>
        ${live.forecast ? `<div class="mw-sky-forecast">${esc(live.forecast.replace(live.temp, '').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/^[\s,]+|[\s,]+$/g, ''))}</div>` : ''}
        <div class="mw-sky-where">
            ${live.location ? `<p class="mw-where">${icon('pin')}<span>${esc(live.location)}</span>${pinMark(pins, 'location')}</p>` : ''}
            <div class="mw-present-row">${icon('people')}<div class="mw-present-list">${presentChips(live, people)}</div></div>
            ${live.activity ? `<p class="mw-activity">${esc(live.activity)}${pinMark(pins, 'activity')}</p>` : ''}
        </div>` : `
        <div class="mw-sky-empty"><b>No board yet</b><p>${send ? 'The next reply starts with your info board, and it lands here.' : 'Turn on “Send the board prompt” below, or keep INFO BOARD in your preset. Either way the next board lands here.'}</p></div>`;
    const edit = editing ? `<section class="mw-board-edit">
        <p class="mw-fine">Anything you change here is pinned ◆ and sent as true until you unpin it. Clear a box to follow the board again.</p>
        ${editField('date', 'Date', pins.date || live.day, 80)}${editField('time', 'Time', pins.time || live.time, 40)}${editField('location', 'Location', live.location)}${editField('activity', 'Activity', live.activity)}
        ${editField('charOutfit', `${esc(charName)}’s outfit`, live.charOutfit)}${editField('userOutfit', `${esc(userName)}’s outfit`, live.userOutfit)}${editField('horny', 'Horny', live.horny)}
        <div class="mw-actions"><button class="mw-primary" data-action="board-edit-done">✓ Done</button></div></section>` : '';
    const hornyV = live.hornyValue;
    return `<section class="mw-board">
        <div class="mw-sky" data-sky="${sky.time}" data-weather="${sky.weather}"><i class="mw-sky-fx" aria-hidden="true"></i>${scene}</div>
        ${edit}
        <div class="mw-board-block"><h4>${icon('mind')} State <small>${esc(owner)}</small></h4>
            ${live.state.length || live.found ? tileGroup('state', live.state, focus, charName) : '<p class="mw-fine">The board’s State line shows up here as moodlets.</p>'}</div>
        <div class="mw-board-block"><h4>Needs <small>${esc(owner)} · drag to set</small></h4>
            <div class="mw-needs">${live.needs.map(needCell).join('')}</div>
            <p class="mw-fine">Read from the board’s words. Faded bars haven’t come up yet. Low and critical needs, and any you set, go to the bot as things that change what ${esc(charName)} does.</p></div>
        <div class="mw-board-block mw-desire"><h4>${icon('horny')} Horny ${live.hornyPinned ? `<button type="button" class="mw-need-pin" data-need-unpin="horny" aria-label="Unpin horny">◆</button>` : ''}<small data-need-word="horny">${hornyV == null ? '—' : level(hornyV)}</small></h4>
            <input type="range" min="0" max="100" step="5" value="${hornyV ?? 0}" data-need="horny" class="mw-horny-bar" style="--mw-fill:${hornyV ?? 0}%" aria-label="Horny">
            ${live.horny ? `<p class="mw-quote">${esc(live.horny)}${pinMark(pins, 'horny')}</p>` : ''}</div>
        <div class="mw-board-block"><h4>${icon('body')} Physical State</h4>${tileGroup('physical', live.physical, focus, charName)}</div>
        <div class="mw-board-block mw-outfits"><h4>${icon('hanger')} Outfits</h4>
            ${[['charOutfit', charName], ['userOutfit', userName]].map(([key, who]) => `<div class="mw-outfit"><b>${esc(who)}</b><p>${esc(live[key]) || '<i>Not on the board yet</i>'}${pinMark(pins, key)}</p></div>`).join('')}</div>
        <div class="mw-board-foot">
            <label class="mw-toggle"><input type="checkbox" data-board-send ${send ? 'checked' : ''}> Send the board prompt in this chat</label>
            <label class="mw-toggle"><input type="checkbox" data-board-sync ${sync ? 'checked' : ''}> Present line moves the cast in and out</label>
            ${editing ? '' : `<button type="button" data-action="board-edit">${icon('edit')} Edit the scene</button>`}
            <p class="mw-fine">${send ? 'Moodweaver sends your INFO BOARD format, so take it out of your preset.' : 'Using the board your preset asks for.'} Boards stay in your chat as they are; this only reads the latest one${live.found ? ` (${esc(owner)}’s last reply)` : ''}.</p>
        </div></section>`;
}
