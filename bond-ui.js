import { computeBond, DYNAMIC_NAMES } from './bond.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sign = v => v > 0 ? `+${v}` : `${v}`;
// -100..100 drawn centre-out, like the Sims relationship panel.
function meter(key, label, value, level, pinned, ends = ['-100', '100']) {
    return `<div class="mw-bond-meter" data-bond-kind="${key}">
        <div class="mw-bond-head"><b>${label}</b><span data-bond-level="${key}">${esc(level)}</span>
            <button type="button" class="mw-need-pin" data-bond-pin="${key}" aria-pressed="${pinned}" title="${pinned ? 'Unpin: let replies move it again' : 'Pin: hold it here'}" aria-label="${pinned ? `Unpin ${label}` : `Pin ${label}`}">${pinned ? '◆' : '◇'}</button></div>
        <input type="range" min="-100" max="100" step="1" value="${value}" data-bond-meter="${key}" class="mw-bond-bar" style="--mw-fill:${(value + 100) / 2}%" aria-label="${label}" aria-valuetext="${esc(level)} (${value})">
        <div class="mw-bond-scale"><span>${esc(ends[0])}</span><output data-bond-out="${key}">${value}</output><span>${esc(ends[1])}</span></div></div>`;
}
const slug = s => String(s).toLowerCase().replace(/[^a-z]+/g, '-');
// Two thin bars under the player's row in the Bonds list.
export function bondMini(bond, chatLength, axes = null, list = null) {
    const d = computeBond(bond, chatLength, 'one', 'the other', axes, list);
    const bar = (cls, v) => `<i class="mw-mini ${cls}" style="--mw-at:${Math.abs(v) / 2}%;--mw-side:${v < 0 ? 'right' : 'left'}"></i>`;
    return `<span class="mw-mini-bars" aria-hidden="true">${bar('is-f', d.f)}${bar('is-r', d.r)}</span>${bond.extra ? `<span class="mw-mini-dyn">${esc(d.dynamic.name)}</span>` : ''}`;
}
export function bondView({ bond, charName, userName, chatLength, axes = null, list = null }) {
    const d = computeBond(bond, chatLength, charName, userName, axes, list);
    const changes = d.recent.filter(s => s.f || s.r || s.t || s.p || s.l);
    const pin = k => bond.pins[k] !== null;
    if (!bond.on) return `<section class="mw-bond is-off">
        <label class="mw-toggle"><input type="checkbox" data-bond-on> Hidden weave line for ${esc(charName)} in this chat</label>
        <p class="mw-fine">Off. Nothing is asked for or sent, and the info board’s words update feelings instead.</p></section>`;
    return `<section class="mw-bond">
        ${bond.extra ? `<div class="mw-dyn-card" data-dynamic="${slug(d.dynamic.name)}"><small>${esc(charName)} &amp; ${esc(userName)}${d.swing ? ' <b class="mw-swing">⇄ swinging</b>' : ''}</small><h3>${esc(d.dynamic.name)}</h3><p>${esc(d.dynamic.cue)}</p>
            <label class="mw-dyn-pick">Dynamic<select data-bond-dynamic aria-label="Their dynamic"><option value="">Read it from the story (${esc(d.auto)})</option>${DYNAMIC_NAMES.map(name => `<option value="${esc(name)}" ${bond.fixed === name ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
            <small class="mw-dyn-why">${bond.fixed ? 'Chosen by you; it stays until you switch back.' : `Read from these meters and ${esc(charName)}’s feelings toward ${esc(userName)} below. Pinned meters win.`}</small></div>` : ''}
        <div class="mw-bond-grid">
            ${meter('f', 'Friendship', d.f, d.friend, pin('f'))}
            ${meter('r', 'Romance', d.r, d.romance, pin('r'))}
            ${bond.extra ? `${meter('p', 'Control', d.p, d.control, pin('p'), [userName, charName])}${meter('l', 'Pull', d.l, d.pull, pin('l'), [userName, charName])}${meter('t', 'Trust', d.t, d.trust, pin('t'))}` : ''}
        </div>
        ${d.sparks.length ? `<div class="mw-bond-block"><h4>Lit lately <small>turn-ons ${esc(userName)} set off</small></h4><div class="mw-sparks">${d.sparks.map(x => `<span class="mw-spark ${x.off ? 'is-off' : ''} ${x.fresh ? 'is-fresh' : ''}" title="Message ${x.index + 1}">${x.off ? '✕' : '✧'} ${esc(x.text)}</span>`).join('')}</div></div>` : ''}
        <div class="mw-bond-block"><h4>${esc(charName)} thinks ${esc(userName)} is…</h4>
            <div class="mw-bond-thinks">${d.thinks.length ? d.thinks.map(t => `<span class="mw-bond-chip${t.own ? ' is-own' : ''}" title="${t.own ? 'Added by you' : `Strength ${Math.min(100, t.value)}`}">${esc(t.text)}<button type="button" data-bond-mute="${esc(t.text)}" aria-label="Remove ${esc(t.text)}">×</button></span>`).join('') : `<i class="mw-fine">Nothing yet. Opinions show up as the story gives ${esc(charName)} reasons.</i>`}</div>
            <div class="mw-bond-add"><input type="text" maxlength="40" data-bond-new placeholder="Add one (e.g. reckless)" aria-label="Add an opinion"><button type="button" data-action="bond-add">Add</button></div></div>
        ${changes.length ? `<div class="mw-bond-block"><h4>Recent changes</h4><ul class="mw-bond-recent">${changes.map(s => `<li><b>#${s.index + 1}</b>${[['f', 'friendship'], ['r', 'romance'], ['t', 'trust'], ['p', 'control'], ['l', 'pull']].filter(([k]) => s[k]).map(([k, w]) => `<span class="${s[k] > 0 ? 'is-up' : 'is-down'}">${w} ${sign(s[k])}</span>`).join('')}</li>`).join('')}</ul></div>` : ''}
        <details class="mw-bond-settings"><summary>Weave line settings</summary>
            <label class="mw-toggle"><input type="checkbox" data-bond-on checked> Hidden weave line for ${esc(charName)} in this chat</label>
            <label class="mw-toggle"><input type="checkbox" data-bond-extra ${bond.extra ? 'checked' : ''}> Trust, Control, Pull and the named dynamic</label>
            <p class="mw-fine">Control is who really holds it: doors, money, freedom. Pull is who’s hooked on whom. They can point opposite ways, like a captive who still gets what she demands.</p>
            <p class="mw-fine">Each reply ends with one hidden line that only Moodweaver reads: only what changed in feelings, needs, relationship, these meters, opinions, turn-ons set off and turning points. SillyTavern hides it in chat and Moodweaver strips it from the prompt. About 380 prompt and 20 to 60 reply tokens, no extra request. Drag a meter to set it; pin to hold it. Every meter is read from the replies still in the chat, so a swipe or a deleted reply takes its change with it.</p>
        </details>
    </section>`;
}
