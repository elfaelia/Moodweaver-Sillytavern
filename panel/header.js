// The top of the panel: the people bar, the person card and the tab bar.
import { cardReadBlock } from '../app/card-read.js';
import { playerName, selectedCast, subjectName } from '../app/chat.js';
import { readerProfile } from '../app/reader.js';
import { settings } from '../app/settings.js';
import { run, ui } from '../app/state.js';
import { activeMoods } from '../engine/state.js';
import { escapeHtml as esc, shortName } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { sectionOf } from '../data/catalogue.js';
import { tagLabel } from './rows.js';
import { isFull } from '../engine/cast.js';

// Sims plumbob: the top facets in the leading feeling's tone, the lower ones in the next feeling's.
// tone: { lead, shade, strength } from engine/tone.js. Stronger feelings glow brighter and bob faster.
export const PLUMBOB = tone => `<svg class="mw-plumbob" style="--mw-plumbob:${tone.lead};--mw-shade:${tone.shade};--mw-glow:${Math.round(6 + tone.strength / 8)}px;--mw-bob:${(5.5 - tone.strength / 40).toFixed(1)}s" viewBox="0 0 24 40" aria-hidden="true"><path d="M12 1 2 15h9z" opacity=".95"/><path d="M12 1l10 14h-11z" opacity=".7"/><path class="mw-facet-low" d="M2 15h9l1 24z" opacity=".75"/><path class="mw-facet-low" d="M11 15h11L12 39z" opacity=".5"/></svg>`;
export function personCard(ch, state, live) {
    const person = ui.who === 'cast' ? selectedCast() : null;
    const name = ui.who === 'story' ? 'The story' : subjectName();
    const role = ui.who === 'char' ? 'Main character' : ui.who === 'user' ? 'Your character \u00b7 you write them' : ui.who === 'story' ? 'Genre, tropes and style for this chat' : `Side character \u00b7 ${person?.inScene ? 'in this scene' : 'off scene'}`;
    const top = activeMoods(state).find(m => sectionOf(m) === 'mood');
    const boardState = ui.who === 'char' && live?.state.length ? live.state.slice(0, 3).map(t => t.text).join(', ') : '';
    const feeling = ui.who === 'story' ? '' : top ? `<span class="mw-feeling" style="--mw-accent:${top.color}">Feeling <b>${esc(tagLabel(top).toLowerCase())}</b> \u00b7 ${level(state.moods[top.id]).toLowerCase()}</span>`
        : boardState ? `<span class="mw-feeling">Board says <b>${esc(boardState)}</b></span>` : '<span class="mw-feeling">No moodlets yet</span>';
    const canRead = ui.who !== 'story' && readerProfile() && state.enabled;
    // You and the main character already have their cards above: just the switches here.
    return `<div class="mw-person-card${ui.who === 'story' ? ' is-story' : ''}" style="--mw-accent:${top?.color ?? '#a8cdb1'}">
        ${ui.who === 'story' ? '<div class="mw-person-info"><small>Genre, authors, tone and rules for this chat</small></div>' : `<span class="mw-person-orb" aria-hidden="true">${esc(String(name ?? '').trim()[0]?.toUpperCase() ?? '')}</span><div class="mw-person-info"><b>${esc(name)}</b><small>${esc(role)}</small>${feeling}</div>`}
        <div class="mw-person-toggles"><label class="mw-toggle"><input type="checkbox" data-field="enabled" ${state.enabled ? 'checked' : ''}> ${ui.who === 'char' ? 'On' : 'Send'}</label>
        ${person ? `<label class="mw-toggle"><input type="checkbox" data-field="castInScene" ${person.inScene ? 'checked' : ''}> In scene</label><label class="mw-toggle" title="A full page gives them everything the main two have"><input type="checkbox" data-field="castFull" ${isFull(person) ? 'checked' : ''}> Full page</label>` : ''}
        ${canRead ? `<button type="button" class="mw-quick-read" data-action="analyse" ${run.pending ? 'disabled' : ''} title="Read the scene now (settings in the Moods tab)">${run.pending ? '\u2026' : '\u2727 Read'}</button>` : ''}</div>
    </div>
    ${person ? `<div class="mw-cast-read">${cardReadBlock('cast')}</div>` : ''}
    ${person ? `<details class="mw-cast-edit mw-manage"><summary>Manage ${esc(person.name)} and the cast</summary>
        <div class="mw-cast-add"><input type="text" data-field="castName" maxlength="80" aria-label="Supporting character name" value="${esc(person.name)}"><button data-action="cast-remove">Remove</button></div>
        <div class="mw-actions"><button data-action="cast-default">Save cast for ${esc(ch.name)}</button>${settings().castDefaults[`char:${ch.avatar}`]?.length ? '<button data-action="cast-load">Load saved cast</button>' : ''}</div>
        <p class="mw-fine">Saved casts carry over to ${esc(ch.name)}\u2019s new chats.</p></details>` : ''}
    ${ui.castAction && ui.castAction !== 'adding' ? `<div class="mw-cast-confirm" role="group" aria-label="Confirm cast change"><p class="mw-fine">${ui.castAction === 'load' ? 'Replace this chat\u2019s cast and its sliders with the saved version? Everyone will start off scene.' : `Remove ${esc(person?.name ?? '')} from this chat\u2019s cast? The saved default will stay as it is.`}</p><div class="mw-actions"><button data-action="cast-${ui.castAction}-confirm">${ui.castAction === 'load' ? 'Load saved cast' : 'Remove'}</button><button data-action="cast-cancel">Cancel</button></div></div>` : ''}`;
}
// 2.0: the dock holds places and people, not categories. Tonight is the scene at a glance; each person is one
// page with chapters (the chips at the top); Us is the relationship from either side; then Story and Music.
const TABS = [['mood', '\u263e', 'Feels', '#c9b8f0'], ['needs', '\u25d4', 'Body', '#9fd3b4'], ['state', '\u2302', 'Facts', '#9fc6c0'], ['trait', '\u2742', 'Traits', '#e3c38f'], ['psyche', '\u262f\ufe0e', 'Mind', '#b8a6e0'], ['skills', '\u272a', 'Skills', '#9fc0e8'], ['period', '\u2766', 'Era', '#d9b98c'], ['wants', '\u2606', 'Wants', '#e5ca7f'],
    ['rel', '\u2665', 'Bonds', '#ef9fbe'], ['turn', '\u21cb', 'Turn-ons', '#e7a6c4'], ['intimacy', '\u2698', 'Intimacy', '#d49bc9'], ['music', '\u266b', 'Music', '#9fd3c9']];
const US = ['rel', 'turn', 'intimacy'];
// Which group of the dock a tab lives in: the scene, a person's page, the two of them, or music.
export const dockOf = tab => tab === 'tonight' ? 'tonight' : tab === 'music' ? 'music' : US.includes(tab) ? 'us' : 'person';
const musicShown = () => settings().musicTab !== false;
const SLIM_TABS = new Set(['mood', 'state', 'trait', 'rel']);
export const tabsFor = who => TABS.filter(([k]) => !(who === 'cast' && !isFull(selectedCast()) && !SLIM_TABS.has(k)) && !(k === 'wants' && settings().wantsTab === false) && !(k === 'music' && !musicShown()) && !(k === 'state' && who === 'user') && !(k === 'period' && !['char', 'user'].includes(who)))
    .map(row => who === 'user' && row[0] === 'needs' ? ['needs', '\u25d0', 'You', '#9fd3b4'] : row);
// Where the dock's light sits right now.
export const dockHere = () => ui.settingsOpen ? '' : ui.tab === 'tonight' ? 'tonight' : ui.who === 'story' ? 'story' : ui.tab === 'music' ? 'music' : US.includes(ui.tab) ? 'us' : ui.who === 'cast' ? '' : ui.who;
// The chapter chips for the open page (none when it holds a single tab). On a person's page they sit in two even
// rows, so every chapter is one tap and nothing scrolls sideways.
export function tabBar(counts) {
    const tabs = tabsFor(ui.who).filter(([k]) => dockOf(k) === dockOf(ui.tab));
    if (tabs.length < 2) return '';
    const cols = tabs.length > 4 ? Math.ceil(tabs.length / 2) : tabs.length;
    return `<nav class="mw-tabbar mw-chapters" style="--mw-cols:${cols}" role="tablist" aria-label="Chapters">${tabs.map(([k, icon, label, color]) =>
        `<button type="button" role="tab" data-tab="${k}" aria-selected="${ui.tab === k}" aria-pressed="${ui.tab === k}" style="--mw-tab:${color}"><span class="mw-tab-icon">${icon}</span><span class="mw-tab-label">${label}</span>${counts[k] ? `<i>${counts[k]}</i>` : ''}</button>`).join('')}</nav>`;
}
// On Us: whose side of the relationship you're looking at.
export function usSides(ch) {
    const cast = ui.who === 'cast' ? selectedCast() : null;
    const side = (who, name, extra = '') => `<button type="button" data-us-side="${who}"${extra} aria-pressed="${ui.who === who && (!cast || who !== 'cast' || cast.id === ui.selectedCastId)}">${esc(shortName(name))}</button>`;
    return `<div class="mw-us-sides" role="group" aria-label="Whose side"><span>Seen from</span>${side('char', ch.name)}${side('user', playerName())}${cast ? side('cast', cast.name, ` data-cast-id="${esc(cast.id)}"`) : ''}</div>`;
}
export function dockBar(ch, badges = {}) {
    const here = dockHere(), first = n => esc(shortName(n ?? '').split(/\s+/)[0] || n || '');
    const places = [['tonight', '\u2726', 'Scene', 0], ['char', '\u25d0', first(ch?.name) || 'Them', badges.char ?? 0], ['user', '\u25d1', first(playerName()), badges.user ?? 0], ['us', '\u27e1', 'Bond', 0], ['story', '\u2711', 'Story', 0], ...(musicShown() ? [['music', '\u266b', 'Music', 0]] : [])];
    const close = settings().dockClose !== false;
    return `<nav class="mw-dock" aria-label="Places">${places.map(([key, icon, label, n]) =>
        `<button type="button" data-dock="${key}" aria-pressed="${here === key}"><span class="mw-dock-icon" aria-hidden="true">${icon}${n ? `<i>${n}</i>` : ''}</span><span class="mw-dock-label">${label}</span></button>`).join('')}${close ? '<button type="button" class="mw-dock-close" data-action="close" aria-label="Close Moodweaver"><span class="mw-dock-icon" aria-hidden="true">\u2304</span><span class="mw-dock-label">Close</span></button>' : ''}</nav>`;
}
// The tab one swipe away: dir 1 is the next, -1 the one before. Stays put at either end.
export function tabStep(dir) {
    const order = tabsFor(ui.who).map(([k]) => k).filter(k => dockOf(k) === dockOf(ui.tab)), i = order.indexOf(ui.tab);
    return order[Math.max(0, Math.min(order.length - 1, (i < 0 ? 0 : i) + dir))];
}
