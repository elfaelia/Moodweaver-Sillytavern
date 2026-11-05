import { computeBond } from './bond.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sign = v => v > 0 ? `+${v}` : `${v}`;
// -100..100 drawn as a centre-out bar, like the Sims relationship panel.
function meter(key, label, icon, value, level, pinned) {
    const pct = (value + 100) / 2;
    return `<div class="mw-bond-meter" data-bond-kind="${key}">
        <h4>${icon} ${label} <small data-bond-level="${key}">${esc(level)}</small>
            <button type="button" class="mw-need-pin" data-bond-pin="${key}" aria-pressed="${pinned}" title="${pinned ? 'Unpin: let replies move it again' : 'Pin: hold it here'}" aria-label="${pinned ? `Unpin ${label}` : `Pin ${label}`}">${pinned ? '◆' : '◇'}</button></h4>
        <input type="range" min="-100" max="100" step="1" value="${value}" data-bond-meter="${key}" class="mw-bond-bar" style="--mw-fill:${pct}%" aria-label="${label}" aria-valuetext="${esc(level)} (${value})">
        <div class="mw-bond-scale"><span>-100</span><output data-bond-out="${key}">${value}</output><span>100</span></div></div>`;
}
export function bondView({ bond, charName, userName, chatLength, levels }) {
    const data = computeBond(bond, chatLength);
    const changes = data.recent.filter(s => s.f || s.r);
    return `<section class="mw-bond">
        <label class="mw-toggle"><input type="checkbox" data-bond-on ${bond.on ? 'checked' : ''}> Track ${esc(charName)}’s bond with ${esc(userName)} in this chat</label>
        ${bond.on ? `
        ${meter('f', 'Friendship', '☺', data.f, data.friend, bond.pins.f !== null)}
        ${meter('r', 'Romance', '♥', data.r, data.romance, bond.pins.r !== null)}
        <div class="mw-board-block"><h4>${esc(charName)} thinks ${esc(userName)} is…</h4>
            <div class="mw-bond-thinks">${data.thinks.length ? data.thinks.map(t => `<span class="mw-bond-chip${t.own ? ' is-own' : ''}" title="${t.own ? 'Added by you' : `Strength ${Math.min(100, t.value)}`}">${esc(t.text)}<button type="button" data-bond-mute="${esc(t.text)}" aria-label="Remove ${esc(t.text)}">×</button></span>`).join('') : `<i class="mw-fine">Nothing yet. Opinions show up as the story gives ${esc(charName)} reasons.</i>`}</div>
            <div class="mw-bond-add"><input type="text" maxlength="40" data-bond-new placeholder="Add an opinion (e.g. reckless)" aria-label="Add an opinion"><button type="button" data-action="bond-add">Add</button></div></div>
        ${changes.length ? `<div class="mw-board-block"><h4>Recent changes</h4><ul class="mw-bond-recent">${changes.map(s => `<li>Message ${s.index + 1}: ${s.f ? `friendship ${sign(s.f)}` : ''}${s.f && s.r ? ', ' : ''}${s.r ? `romance ${sign(s.r)}` : ''}</li>`).join('')}</ul></div>` : ''}
        <p class="mw-fine">Each reply ends with one hidden line that only Moodweaver reads. SillyTavern hides it in chat, and Moodweaver strips old ones from the prompt so they don’t use up context. About 110 prompt tokens and 25 reply tokens. Drag a meter to set it; pin to hold it.</p>` : `<p class="mw-fine">Off for this chat. Nothing is sent.</p>`}
    </section>`;
}
