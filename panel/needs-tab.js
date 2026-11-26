// Sims-style needs board: the latest info board, tidied into a scene card, moodlet tiles and need bars.
import { settings } from '../app/settings.js';
import { escapeHtml as esc } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { CATEGORIES } from '../data/catalogue.js';
import { matchMood, needWord } from '../engine/board.js';
import { COPES } from '../engine/stress.js';

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

function tile(kind, t, focus) {
    const m = matchMood(t.text), [glyph, colour] = m ? CATEGORY_LOOK[m.category] ?? [] : [];
    const id = `${kind}:${t.text}`;
    return `<button type="button" class="mw-tile ${t.kept ? 'is-kept' : ''} ${t.added ? 'is-added' : ''}" data-board-tile="${esc(id)}" aria-pressed="${focus === id}" style="--mw-accent:${colour ?? (kind === 'state' ? '#b7acd7' : '#d7a39b')}" title="${m ? esc(m.label) : 'Tap for options'}">
        <span class="mw-tile-icon">${glyph ? esc(glyph) : kind === 'state' ? '\u2726' : '\u271a'}</span><span class="mw-tile-text">${esc(t.text)}</span>${t.kept ? '<em>\u25c6</em>' : ''}</button>`;
}
// pinsOn: false hides keeping, cutting and adding; a State tile can still become a moodlet.
function tileGroup(kind, tiles, focus, ownerName, pinsOn = true) {
    const focused = tiles.find(t => focus === `${kind}:${t.text}`);
    const actions = focused && (pinsOn || kind === 'state');
    return `<div class="mw-tiles">${tiles.map(t => tile(kind, t, focus)).join('')}
        ${pinsOn ? `<span class="mw-tile-add"><input type="text" data-board-add="${kind}" maxlength="60" enterkeyhint="done" placeholder="\uff0b add" aria-label="Add to ${kind === 'state' ? 'State' : 'Physical State'}"></span>` : ''}</div>
    ${actions ? `<div class="mw-tile-actions" role="group" aria-label="${esc(focused.text)}">
        <b>${esc(focused.text)}</b>
        ${pinsOn ? `<button type="button" data-board-keep="${esc(kind)}" aria-pressed="${focused.kept}">${focused.kept ? '\u25c6 Kept' : '\u25c7 Keep'}</button>
        <button type="button" data-board-cut="${esc(kind)}">\u2715 ${focused.added ? 'Remove' : 'Cut'}</button>` : ''}
        <p class="mw-fine">${pinsOn ? (focused.kept ? 'Kept: sent every reply as part of the board until you let go.' : 'Keep sends it every reply. Cut tells the bot to drop it.') : ''}</p></div>` : ''}`;
}
// 2.0: each need is a small planet tile; tapping one opens its moons to set it. A need at a critical low opens by
// itself, so trouble is never folded away.
function needCell(nd, pinsOn = true) {
    const colour = needColour(nd.value), word = needWord(nd.value);
    if (!pinsOn) return `<div class="mw-need is-flat ${nd.value <= 15 ? 'is-critical' : ''} ${nd.known ? '' : 'is-quiet'}" style="--mw-need:${colour};--mw-v:${nd.value}" data-need-row="${nd.id}" title="${esc(nd.source ? `\u201c${nd.source}\u201d` : nd.label)}"><div class="mw-need-head"><span class="mw-need-icon">${icon(nd.id)}</span><span class="mw-need-name"><span>${nd.label}</span><span class="mw-need-word" data-need-word="${nd.id}">${word}</span></span><i class="mw-need-bar" aria-hidden="true"></i></div></div>`;
    return `<details class="mw-need ${nd.value <= 15 ? 'is-critical' : ''} ${nd.known ? '' : 'is-quiet'}" style="--mw-need:${colour};--mw-v:${nd.value}" data-need-row="${nd.id}"${nd.value <= 15 && nd.known ? ' open' : ''}>
        <summary class="mw-need-head"><span class="mw-need-icon">${icon(nd.id)}</span><span class="mw-need-name"><label for="mw-need-${nd.id}">${nd.label}</label><span class="mw-need-word" data-need-word="${nd.id}">${word}</span></span>
            ${nd.pinned ? `<button type="button" class="mw-need-pin" data-need-unpin="${nd.id}" title="Set by you. Tap to follow the board again" aria-label="Unpin ${nd.label}">\u25c6</button>` : ''}<i class="mw-need-bar" aria-hidden="true"></i></summary>
        <input id="mw-need-${nd.id}" type="range" min="0" max="100" step="5" value="${nd.value}" data-need="${nd.id}" style="--mw-fill:${nd.value}%" aria-valuetext="${word}"${pinsOn ? '' : ' disabled'}>
        ${nd.source ? `<small title="${esc(nd.source)}">\u201c${esc(nd.source)}\u201d</small>` : ''}</details>`;
}
function presentChips(live, people) {
    const raw = String(live.present ?? '');
    if (!raw || /^(none|no one|nobody|alone|n\/a|-)$/i.test(raw.trim())) return '<span class="mw-present-none">Nobody else</span>';
    const names = raw.split(/\s*(?:,|;|&|\band\b)\s*/i).map(s => s.trim()).filter(Boolean).slice(0, 8);
    return names.map(name => {
        const p = people.find(x => x.match(name));
        return p ? `<button type="button" class="mw-present ${p.away ? 'is-away' : ''}" ${p.attrs} title="Open ${esc(p.name)}">${esc(name)}</button>`
            : `<button type="button" class="mw-present is-new" data-board-addcast="${esc(name)}" title="Add ${esc(name)} to the cast">\uff0b ${esc(name)}</button>`;
    }).join('');
}
const editField = (key, label, value, max = 200) => max > 80
    ? `<label class="mw-field">${label}<textarea data-board-field="${key}" maxlength="${max}" rows="2" enterkeyhint="done">${esc(value)}</textarea></label>`
    : `<label class="mw-field">${label}<input type="text" data-board-field="${key}" maxlength="${max}" enterkeyhint="done" value="${esc(value)}"></label>`;
// An edit is a correction to this board (\u270e), not a pin. The next reply takes it on and carries it.
const pinMark = (pins, key) => pins[key] ? `<button type="button" class="mw-pinned" data-board-unpin="${key}" title="Your correction, going to the next reply. Tap to undo it" aria-label="Undo your correction">\u270e</button>` : '';

// opts: { live, send, sync, charName, userName, people: [{ name, match(name), attrs, away }], editing, focus,
//   pinsOn, memoriesOn, withWeave, weaveOn, savedMemories } (1.38.0: the board switches, all chats)
// The sky card at the top of the Info tab: clock, date, weather, place and who's there. Shared by the
// character's board and your own Info, so both open the same way.
export function skyCard(live, people, { send = true, editing = false, extra = '' } = {}) {
    const pins = live.meta.pins, sky = live.sky;
    const [clock, ampm] = (() => { const m = String(live.time).match(/^(\d{1,2}:\d{2})\s*([AP]\.?M\.?)?(.*)$/i); return m ? [m[1], `${m[2] ?? ''}${m[3] ?? ''}`.trim()] : [live.time, '']; })();
    const scene = live.found || editing ? `
        <div class="mw-sky-top"><div class="mw-clock"><b>${esc(clock || '\u2014')}</b><span>${esc(ampm)}</span>${pinMark(pins, 'time')}</div>${live.emoji ? `<span class="mw-sky-emoji" aria-hidden="true">${esc(live.emoji)}</span>` : ''}</div>
        <div class="mw-sky-date">${esc(live.day)}${pinMark(pins, 'date')}</div>
        <div class="mw-sky-meta">${[live.season, live.temp].filter(Boolean).map(esc).join(' \u00b7 ')}</div>
        ${live.forecast ? `<div class="mw-sky-forecast">${esc(live.forecast.replace(live.temp, '').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/^[\s,]+|[\s,]+$/g, ''))}</div>` : ''}
        <div class="mw-sky-where">
            ${live.location ? `<p class="mw-where">${icon('pin')}<span>${esc(live.location)}</span>${pinMark(pins, 'location')}</p>` : ''}
            <div class="mw-present-row">${icon('people')}<div class="mw-present-list">${presentChips(live, people)}</div></div>
            ${live.activity ? `<p class="mw-activity">${esc(live.activity)}${pinMark(pins, 'activity')}</p>` : ''}
        </div>` : `
        <div class="mw-sky-empty"><b>No board yet</b><p>${send ? 'The next reply starts with your info board, and it lands here.' : 'Turn on \u201cSend the board prompt\u201d below, or keep INFO BOARD in your preset. Either way the next board lands here.'}</p></div>`;
    return `<div class="mw-sky" data-sky="${sky.time}" data-weather="${sky.weather}"><i class="mw-sky-fx" aria-hidden="true"></i>${scene}${extra}</div>`;
}
export function boardView({ live, send, sync, charName, userName, people, editing, focus, pinsOn = false, memoriesOn = false, withWeave = true, weaveOn = true, savedMemories = 0, needOpts = null }) {
    const pins = live.meta.pins, owner = live.name || charName;
    const edit = editing ? `<section class="mw-board-edit">
        <p class="mw-fine">Edits here correct the board \u270e for the next reply. Clear a box to undo.</p>
        ${editField('date', 'Date', pins.date || live.day, 80)}${editField('time', 'Time', pins.time || live.time, 40)}${editField('location', 'Location', live.location)}${editField('activity', 'Activity', live.activity)}
        ${editField('charOutfit', `${esc(charName)}\u2019s outfit`, live.charOutfit)}${editField('userOutfit', `${esc(userName)}\u2019s outfit`, live.userOutfit)}${live.meta.includeHorny ? editField('horny', 'Horny', live.horny) : ''}
        <div class="mw-actions"><button class="mw-primary" data-action="board-edit-done">\u2713 Done</button></div></section>` : '';
    const hornyV = live.hornyValue;
    return `<section class="mw-board">
        ${skyCard(live, people, { send, editing })}
        ${edit}
        <div class="mw-board-block"><h4>${icon('mind')} State <small>${esc(owner)}</small></h4>
            ${live.state.length || live.found ? tileGroup('state', live.state, focus, charName, pinsOn) : ''}</div>
        <div class="mw-board-block"><h4>Needs <small>${esc(owner)}${pinsOn ? ' \u00b7 tap one to set it' : ''}</small></h4>
            <div class="mw-needs">${live.needs.map(nd => needCell(nd, pinsOn)).join('')}</div>
            <p class="mw-fine">Read from the board\u2019s words${weaveOn ? ' and the hidden line' : ''}${needOpts?.drift ? ', and the board\u2019s clock: needs drain a little as in-world time passes and come back up after a time jump. Who they are changes the speed: an insomniac tires sooner, a clingy heart gets lonely faster' : ''}. Faded bars haven\u2019t come up yet. Low and critical needs${pinsOn ? ', and any you set,' : ''} go to the bot as things that change what ${esc(charName)} does; nothing extra is printed on your board.</p>
            ${needOpts ? `<details class="mw-need-settings"><summary>Needs over time <small>all chats</small></summary>
                <label class="mw-toggle"><input type="checkbox" data-setting-bool="needsSelf" ${needOpts.self !== false ? 'checked' : ''}> Everyday needs are seen to off-screen: only the story saying so keeps one low, and it comes back up once the story stops mentioning it</label>
                <label class="mw-toggle"><input type="checkbox" data-setting-bool="needsDrift" ${needOpts.drift ? 'checked' : ''}> Needs drain as in-world time passes</label>
                <label class="mw-field">How fast<select data-setting-choice="needsSpeed" aria-label="How fast needs drain">${[['gentle', 'Gentle'], ['normal', 'Normal'], ['harsh', 'Harsh']].map(([v, l]) => `<option value="${v}" ${needOpts.speed === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
                <label class="mw-toggle"><input type="checkbox" data-setting-bool="needsSkips" ${needOpts.skips ? 'checked' : ''}> Time jumps of more than 4 hours top needs back up, from the board\u2019s clock or words like \u201ca day later\u201d (they ate, slept and washed off-screen)</label>
                <label class="mw-toggle"><input type="checkbox" data-setting-bool="needsFloor" ${needOpts.floor ? 'checked' : ''}> Time alone never makes a need critical; only the story can</label>
                <label class="mw-toggle"><input type="checkbox" data-setting-bool="needsMood" ${settings().needsMood !== false ? 'checked' : ''}> Hungry, tired or uncomfortable makes feelings quicker to flare</label>
                <p class="mw-fine">Needs drain a little as story time passes and refill after a time skip.</p></details>` : ''}</div>
        ${live.meta.includeHorny ? `<div class="mw-board-block mw-desire"><h4>${icon('horny')} Horny ${live.hornyPinned ? `<button type="button" class="mw-need-pin" data-need-unpin="horny" aria-label="Unpin horny">\u25c6</button>` : ''}<small data-need-word="horny">${hornyV == null ? '\u2014' : level(hornyV)}</small></h4>
            <input type="range" min="0" max="100" step="5" value="${hornyV ?? 0}" data-need="horny" class="mw-horny-bar" style="--mw-fill:${hornyV ?? 0}%" aria-label="Horny"${pinsOn ? '' : ' disabled'}>
            ${live.horny ? `<p class="mw-quote">${esc(live.horny)}${pinMark(pins, 'horny')}</p>` : ''}</div>` : ''}
        <div class="mw-board-block"><h4>${icon('body')} Physical State</h4>${tileGroup('physical', live.physical, focus, charName, pinsOn)}</div>
        ${editing || !pinsOn ? '' : `<button type="button" class="mw-board-editbtn" data-action="board-edit">${icon('edit')} Edit the scene</button>`}
        <div class="mw-board-block mw-outfits"><h4>${icon('hanger')} Outfits</h4>
            ${[['charOutfit', charName], ['userOutfit', userName]].map(([key, who]) => `<div class="mw-outfit"><b>${esc(who)}</b><p>${esc(live[key]) || '<i>Not on the board yet</i>'}${pinMark(pins, key)}</p></div>`).join('')}</div>
        <details class="mw-board-foot" data-board-settings><summary>Board settings</summary>
            <label class="mw-toggle"><input type="checkbox" data-board-send ${send ? 'checked' : ''}> Send the board prompt in this chat</label>
            <label class="mw-toggle"><input type="checkbox" data-board-horny ${live.meta.includeHorny ? 'checked' : ''}> Include Horny on this chat\u2019s board</label>
            
            <label class="mw-toggle"><input type="checkbox" data-board-sync ${sync ? 'checked' : ''}> Present line moves the cast in and out</label>
            <label class="mw-toggle"><input type="checkbox" data-board-feed ${live.meta.feed !== false ? 'checked' : ''}> Replies update ${esc(charName)}\u2019s feelings, needs and relationship</label>
            <p class="mw-fine">${weaveOn ? `The hidden line reports what each reply changed and the sliders follow, up or down.${withWeave ? ' The board\u2019s State words fill in anything it didn\u2019t mention.' : ''}` : 'The board\u2019s State words move feelings, and the Toward row moves how they feel about you.'} Words like \u201cterrified\u201d land higher than \u201cafraid\u201d; \u201cvery\u201d and \u201cslightly\u201d shift them; the first one listed counts most. Pinned \u25c6 sliders never move, and what you set by hand is never lowered by the board.</p>
            <label class="mw-toggle"><input type="checkbox" data-board-toward ${live.meta.includeToward ? 'checked' : ''}> Visible Toward ${esc(userName)} row on the board</label>
            <p class="mw-fine"><b>All chats:</b></p>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardWithWeave" ${withWeave ? 'checked' : ''}> Board words move feelings too, alongside the hidden line</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardPins" ${pinsOn ? 'checked' : ''}> Let me pin and correct things on the board</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="boardMemories" ${memoriesOn ? 'checked' : ''}> Save turning points as memories</label>
            ${!memoriesOn && savedMemories ? `<p class="mw-fine">${savedMemories} memor${savedMemories === 1 ? 'y' : 'ies'} saved earlier ${savedMemories === 1 ? 'isn\u2019t' : 'aren\u2019t'} being sent. <button type="button" class="mw-clear" data-action="board-memories-delete">Delete ${savedMemories === 1 ? 'it' : 'them'}</button></p>` : ''}

            <p class="mw-fine">${send ? 'Moodweaver sends the info board prompt, so take it out of your preset.' : 'Using the board your preset asks for.'} Boards stay in your chat as they are; this only reads the latest one${live.found ? ` (${esc(owner)}\u2019s last reply)` : ''}.</p>
        </details></section>`;
}
// Stress (1.79): where it stands, how they cope, and a break when one is happening. Read-only, with a "Let it go"
// that starts the count again from the latest message (engine/stress.js).
export function stressCard(s, name) {
    if (!s) return '';
    const lit = Math.round(s.value / 10), word = s.breaking ? 'breaking now' : s.after ? 'coming down from a break' : s.word;
    const stars = Array.from({ length: 10 }, (_, i) => `<i class="${i < lit ? 'is-lit' : ''}${i >= 9 ? ' is-edge' : ''}"></i>`).join('');
    const note = s.breaking ? `This reply ${esc(name)} ${esc(s.breaking)}.` : s.after ? `${esc(name)} is drained and raw after the break.` : s.level ? `Copes the way they do: ${esc(s.coping)}.` : 'Nothing is sent below \u201cunder strain\u201d.';
    return `<section class="mw-board"><div class="mw-board-block mw-stress" data-anchor="stress"><h4>Stress <small>${esc(name)} \u00b7 ${esc(word)}</small></h4>
        <div class="mw-stress-stars" role="img" aria-label="Stress ${s.value} of 100">${stars}</div>
        <p class="mw-fine">${note}</p>
        <p class="mw-fine">Builds when they act against what they believe, want or feel about someone (the dynamic included), or when strain, fear, guilt and empty needs pile up; eases with rest, comfort, release and their own ways of coping.${s.rate !== 1 ? ` Their nature makes it build ${s.rate > 1 ? 'faster' : 'slower'}.` : ''} Past what they can hold, they break once, in character.</p>
        <details class="mw-copes"><summary>How ${esc(name)} copes: <b>${esc(s.copes?.ids.length ? s.copes.ids.map(id => COPES.find(c => c.id === id)?.label).join(', ') : 'not chosen')}</b><small>${s.copes?.auto ? 'from who they are \u00b7 tap to choose' : 'tap to change \u00b7 up to six'}</small></summary>${[['h', 'Healthier: ease it steadily, every time'], ['m', 'Mixed: fade to half when it\u2019s the same again; switch it up to refresh'], ['u', 'Unhealthy: ease it most, and being drunk or high is the cost']].map(([k, title]) =>
            `<p class="mw-fine">${title}</p><div class="mw-card-chips">${COPES.filter(c => c.kind === k).map(c =>
            `<button type="button" class="mw-card-chip${s.copes?.ids.includes(c.id) ? ' is-on' : ''}" data-cope="${c.id}" aria-pressed="${s.copes?.ids.includes(c.id) ?? false}">${esc(c.label)}</button>`).join('')}</div>`).join('')}
        <p class="mw-fine">When a reply shows ${esc(name)} coping one of these ways, stress comes down and doing it never counts as strain. Holding back by choice, for a reason they believe in, builds stress at half the rate.</p></details>
        ${s.value > 0 ? '<button type="button" class="mw-chip-btn" data-action="stress-reset">Let it go (start from 0)</button>' : ''}</div></section>`;
}
