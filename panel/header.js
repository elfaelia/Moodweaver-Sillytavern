// The top of the panel: the people bar, the person card and the tab bar.
import { getCast, playerName, selectedCast, subjectName } from '../app/chat.js';
import { readerProfile } from '../app/reader.js';
import { settings } from '../app/settings.js';
import { run, ui } from '../app/state.js';
import { activeMoods } from '../engine/state.js';
import { escapeHtml as esc } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { sectionOf } from '../data/catalogue.js';
import { tagLabel } from './rows.js';

export function peopleBar(ch) {
    const cast = getCast(ch);
    const chip = (attrs, pressed, icon, name, extra = '') => `<button class="mw-person ${extra}" ${attrs} aria-pressed="${pressed}"><span class="mw-avatar">${icon}</span><span>${esc(name)}</span></button>`;
    return `<div class="mw-people" role="group" aria-label="Whose settings">
        ${chip('data-who="char"', ui.who === 'char', esc(String(ch.name).trim()[0] ?? '◆').toUpperCase(), ch.name, 'is-main')}
        ${chip('data-who="user"', ui.who === 'user', esc(playerName().trim()[0] ?? '◇').toUpperCase(), playerName(), 'is-you')}
        ${cast.map(p => chip(`data-who="cast" data-cast-id="${esc(p.id)}"`, ui.who === 'cast' && selectedCast()?.id === p.id, esc(p.name.trim()[0]?.toUpperCase() ?? '♧'), p.name, p.inScene ? '' : 'is-away')).join('')}
        <button class="mw-person mw-person-add" data-action="cast-new" aria-pressed="${ui.castAction === 'adding'}" title="Add a supporting character"><span class="mw-avatar">＋</span><span>Cast</span></button>
        ${chip('data-who="story"', ui.who === 'story', '❖', 'Story', 'is-story')}
    </div>
    ${ui.castAction === 'adding' ? `<div class="mw-cast-add mw-new-cast"><input type="text" data-cast-new maxlength="80" aria-label="New supporting character name" placeholder="Name, e.g. Chloe"><button data-action="cast-add">Add to cast</button></div>` : ''}`;
}
// Sims plumbob: two facets lit, two in shade.
export const PLUMBOB = colour => `<svg class="mw-plumbob" style="--mw-plumbob:${colour}" viewBox="0 0 24 40" aria-hidden="true"><path d="M12 1 2 15h9z" opacity=".95"/><path d="M12 1l10 14h-11z" opacity=".7"/><path d="M2 15h9l1 24z" opacity=".55"/><path d="M11 15h11L12 39z" opacity=".35"/></svg>`;
export function personCard(ch, state, live) {
    const person = ui.who === 'cast' ? selectedCast() : null;
    const name = ui.who === 'story' ? 'The story' : subjectName();
    const role = ui.who === 'char' ? 'Main character' : ui.who === 'user' ? 'Your character · you write them' : ui.who === 'story' ? 'Genre, tropes and style for this chat' : `Side character · ${person?.inScene ? 'in this scene' : 'off scene'}`;
    const top = activeMoods(state).find(m => sectionOf(m) === 'mood');
    const boardState = ui.who === 'char' && live?.state.length ? live.state.slice(0, 3).map(t => t.text).join(', ') : '';
    const feeling = ui.who === 'story' ? '' : top ? `<span class="mw-feeling" style="--mw-accent:${top.color}">Feeling <b>${esc(tagLabel(top).toLowerCase())}</b> · ${level(state.moods[top.id]).toLowerCase()}</span>`
        : boardState ? `<span class="mw-feeling">Board says <b>${esc(boardState)}</b></span>` : '<span class="mw-feeling">No moodlets yet</span>';
    const canRead = ui.who !== 'story' && readerProfile() && state.enabled;
    return `<div class="mw-person-card" style="--mw-accent:${top?.color ?? '#a8cdb1'}">
        <div class="mw-person-info"><b>${esc(name)}</b><small>${esc(role)}</small>${feeling}</div>
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
// One sticky row of icon tabs: fits a phone screen and stays reachable while scrolling long lists.
// Needs is the live board; Facts is the old needs-and-facts list; personality types sit at the top of Traits.
// Meters live at the top of Bonds, beside the relationship they measure.
const TABS = [['mood', '✦', 'Moods', '#c9b8f0'], ['needs', '◔', 'Needs', '#9fd3b4'], ['rel', '♥', 'Bonds', '#ef9fbe'], ['trait', '❂', 'Traits', '#e3c38f'], ['turn', '⇋', 'Turn-ons', '#e7a6c4'], ['skills', '✪', 'Skills', '#9fc0e8'], ['state', '⌂', 'Facts', '#9fc6c0'], ['inv', '❒', 'Items', '#c9b37e'], ['wants', '☆', 'Wants', '#e5ca7f']];
// On your own character the Needs tab becomes You: outfit, condition and the moodlets showing.
export const tabBar = counts => `<nav class="mw-tabbar" role="tablist" aria-label="Section">${TABS.map(row => ui.who === 'user' && row[0] === 'needs' ? ['needs', '◐', 'You', '#9fd3b4'] : row).map(([k, icon, label, color]) =>
    `<button type="button" role="tab" data-tab="${k}" aria-selected="${ui.tab === k}" aria-pressed="${ui.tab === k}" style="--mw-tab:${color}"><span class="mw-tab-icon">${icon}</span><span class="mw-tab-label">${label}</span>${counts[k] ? `<i>${counts[k]}</i>` : ''}</button>`).join('')}</nav>`;
