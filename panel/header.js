// The top of the panel: the people bar, the person card and the tab bar.
import { getCast, getUserState, playerName, selectedCast, subjectName } from '../app/chat.js';
import { readerProfile } from '../app/reader.js';
import { settings } from '../app/settings.js';
import { run, ui } from '../app/state.js';
import { activeMoods } from '../engine/state.js';
import { moodTone } from '../engine/tone.js';
import { escapeHtml as esc } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { sectionOf } from '../data/catalogue.js';
import { tagLabel } from './rows.js';

// You and the main character as two matching cards (name, who they are to the chat, the feeling in front),
// with the cast as small chips under them. The Story lives on the dock at the bottom.
function personTile(who, name, role, st) {
    const top = st ? activeMoods(st).find(m => sectionOf(m) === 'mood') : null, tone = moodTone(st?.moods);
    const feeling = top ? `${tagLabel(top).toLowerCase()} · ${level(st.moods[top.id]).toLowerCase()}` : 'nothing set yet';
    return `<button type="button" class="mw-pcard" data-who="${who}" aria-pressed="${ui.who === who}" style="--mw-tone:${tone.lead};--mw-shade:${tone.shade}">
        <span class="mw-pcard-orb" aria-hidden="true">${esc(String(name).trim()[0]?.toUpperCase() ?? '◆')}</span>
        <span class="mw-pcard-text"><b>${esc(name)}</b><small>${esc(role)}</small><i>${esc(feeling)}</i></span></button>`;
}
export function peopleBar(ch, charState) {
    const cast = getCast(ch);
    const chip = (attrs, pressed, icon, name, extra = '') => `<button class="mw-person ${extra}" ${attrs} aria-pressed="${pressed}"><span class="mw-avatar">${icon}</span><span>${esc(name)}</span></button>`;
    return `<div class="mw-people" role="group" aria-label="Whose settings">
        ${personTile('char', ch.name, 'Main character', charState)}${personTile('user', playerName(), 'You', getUserState())}
    </div>
    <div class="mw-cast-row" role="group" aria-label="Side characters">
        ${cast.map(p => chip(`data-who="cast" data-cast-id="${esc(p.id)}"`, ui.who === 'cast' && selectedCast()?.id === p.id, esc(p.name.trim()[0]?.toUpperCase() ?? '♧'), p.name, p.inScene ? '' : 'is-away')).join('')}
        <button class="mw-person mw-person-add" data-action="cast-new" aria-pressed="${ui.castAction === 'adding'}" title="Add a supporting character"><span class="mw-avatar">＋</span><span>Cast</span></button>
    </div>
    ${ui.castAction === 'adding' ? `<div class="mw-cast-add mw-new-cast"><input type="text" data-cast-new maxlength="80" aria-label="New supporting character name" placeholder="Name, e.g. Chloe"><button data-action="cast-add">Add to cast</button></div>` : ''}`;
}
// Sims plumbob: the top facets in the leading feeling's tone, the lower ones in the next feeling's.
// tone: { lead, shade, strength } from engine/tone.js. Stronger feelings glow brighter and bob faster.
export const PLUMBOB = tone => `<svg class="mw-plumbob" style="--mw-plumbob:${tone.lead};--mw-shade:${tone.shade};--mw-glow:${Math.round(6 + tone.strength / 8)}px;--mw-bob:${(5.5 - tone.strength / 40).toFixed(1)}s" viewBox="0 0 24 40" aria-hidden="true"><path d="M12 1 2 15h9z" opacity=".95"/><path d="M12 1l10 14h-11z" opacity=".7"/><path class="mw-facet-low" d="M2 15h9l1 24z" opacity=".75"/><path class="mw-facet-low" d="M11 15h11L12 39z" opacity=".5"/></svg>`;
export function personCard(ch, state, live) {
    const person = ui.who === 'cast' ? selectedCast() : null;
    const name = ui.who === 'story' ? 'The story' : subjectName();
    const role = ui.who === 'char' ? 'Main character' : ui.who === 'user' ? 'Your character · you write them' : ui.who === 'story' ? 'Genre, tropes and style for this chat' : `Side character · ${person?.inScene ? 'in this scene' : 'off scene'}`;
    const top = activeMoods(state).find(m => sectionOf(m) === 'mood');
    const boardState = ui.who === 'char' && live?.state.length ? live.state.slice(0, 3).map(t => t.text).join(', ') : '';
    const feeling = ui.who === 'story' ? '' : top ? `<span class="mw-feeling" style="--mw-accent:${top.color}">Feeling <b>${esc(tagLabel(top).toLowerCase())}</b> · ${level(state.moods[top.id]).toLowerCase()}</span>`
        : boardState ? `<span class="mw-feeling">Board says <b>${esc(boardState)}</b></span>` : '<span class="mw-feeling">No moodlets yet</span>';
    const canRead = ui.who !== 'story' && readerProfile() && state.enabled;
    // You and the main character already have their cards above: just the switches here.
    const compact = ['char', 'user'].includes(ui.who);
    return `<div class="mw-person-card ${compact ? 'is-compact' : ''}" style="--mw-accent:${top?.color ?? '#a8cdb1'}">
        ${compact ? `<div class="mw-person-info">${feeling}</div>` : `<div class="mw-person-info"><b>${esc(name)}</b><small>${esc(role)}</small>${feeling}</div>`}
        <div class="mw-person-toggles"><label class="mw-toggle"><input type="checkbox" data-field="enabled" ${state.enabled ? 'checked' : ''}> ${ui.who === 'char' ? 'On' : 'Send'}</label>
        ${person ? `<label class="mw-toggle"><input type="checkbox" data-field="castInScene" ${person.inScene ? 'checked' : ''}> In scene</label>` : ''}
        ${canRead ? `<button type="button" class="mw-quick-read" data-action="analyse" ${run.pending ? 'disabled' : ''} title="Read the scene now (settings in the Moods tab)">${run.pending ? '…' : '✧ Read'}</button>` : ''}</div>
    </div>
    ${person ? `<details class="mw-cast-edit mw-manage"><summary>Manage ${esc(person.name)} and the cast</summary>
        <div class="mw-cast-add"><input type="text" data-field="castName" maxlength="80" aria-label="Supporting character name" value="${esc(person.name)}"><button data-action="cast-remove">Remove</button></div>
        <div class="mw-actions"><button data-action="cast-default">Save cast for ${esc(ch.name)}</button>${settings().castDefaults[`char:${ch.avatar}`]?.length ? '<button data-action="cast-load">Load saved cast</button>' : ''}</div>
        <p class="mw-fine">The cast belongs to ${esc(ch.name)}’s chats. Saving it gives new ${esc(ch.name)} chats the same people, starting off scene. Rename by editing the name; relationships follow.</p></details>` : ''}
    ${ui.castAction && ui.castAction !== 'adding' ? `<div class="mw-cast-confirm" role="group" aria-label="Confirm cast change"><p class="mw-fine">${ui.castAction === 'load' ? 'Replace this chat’s cast and its sliders with the saved version? Everyone will start off scene.' : `Remove ${esc(person?.name ?? '')} from this chat’s cast? The saved default will stay as it is.`}</p><div class="mw-actions"><button data-action="cast-${ui.castAction}-confirm">${ui.castAction === 'load' ? 'Load saved cast' : 'Remove'}</button><button data-action="cast-cancel">Cancel</button></div></div>` : ''}`;
}
// Five places on the dock at the bottom, each holding one to three tabs that show as chips at the top of
// the section. Swiping sideways walks through the tabs in this order. Body holds the live board (Needs) and
// Facts; on your own character Needs becomes You and your facts live there. Wants can be hidden in Settings.
const TABS = [['mood', '✦', 'Moods', '#c9b8f0'], ['rel', '♥', 'Bonds', '#ef9fbe'], ['turn', '⇋', 'Turn-ons', '#e7a6c4'], ['intimacy', '⚘', 'Intimacy', '#d49bc9'],
    ['needs', '◔', 'Needs', '#9fd3b4'], ['state', '⌂', 'Facts', '#9fc6c0'], ['trait', '❂', 'Traits', '#e3c38f'], ['skills', '✪', 'Skills', '#9fc0e8'], ['wants', '☆', 'Wants', '#e5ca7f']];
export const DOCK = [['heart', '☾', 'Heart', ['mood']], ['between', '♥', 'Between', ['rel', 'turn', 'intimacy']], ['body', '◔', 'Body', ['needs', 'state']], ['self', '❂', 'Self', ['trait', 'skills', 'wants']], ['story', '✦', 'Story', []]];
export const dockOf = tab => DOCK.find(([, , , tabs]) => tabs.includes(tab))?.[0] ?? 'heart';
export const tabsFor = who => TABS.filter(([k]) => !(k === 'wants' && settings().wantsTab === false) && !(k === 'state' && who === 'user'))
    .map(row => who === 'user' && row[0] === 'needs' ? ['needs', '◐', 'You', '#9fd3b4'] : row);
// The chips for the open section (none when it holds a single tab).
export function tabBar(counts) {
    const tabs = tabsFor(ui.who).filter(([k]) => dockOf(k) === dockOf(ui.tab));
    return tabs.length < 2 ? '' : `<nav class="mw-tabbar" role="tablist" aria-label="Section">${tabs.map(([k, icon, label, color]) =>
        `<button type="button" role="tab" data-tab="${k}" aria-selected="${ui.tab === k}" aria-pressed="${ui.tab === k}" style="--mw-tab:${color}"><span class="mw-tab-icon">${icon}</span><span class="mw-tab-label">${label}</span>${counts[k] ? `<i>${counts[k]}</i>` : ''}</button>`).join('')}</nav>`;
}
export function dockBar(counts) {
    const here = ui.who === 'story' ? 'story' : dockOf(ui.tab), have = new Set(tabsFor(ui.who === 'story' ? 'char' : ui.who).map(([k]) => k));
    return `<nav class="mw-dock" aria-label="Sections">${DOCK.map(([key, icon, label, tabs]) => {
        const n = tabs.filter(t => have.has(t)).reduce((sum, t) => sum + (counts[t] ?? 0), 0);
        return `<button type="button" data-dock="${key}" aria-pressed="${here === key}"><span class="mw-dock-icon" aria-hidden="true">${icon}</span><span>${label}</span>${n && key !== 'story' ? `<i>${n}</i>` : ''}</button>`; }).join('')}</nav>`;
}
// The tab one swipe away: dir 1 is the next, -1 the one before. Stays put at either end.
export function tabStep(dir) {
    const order = tabsFor(ui.who).map(([k]) => k), i = order.indexOf(ui.tab);
    return order[Math.max(0, Math.min(order.length - 1, (i < 0 ? 0 : i) + dir))];
}
