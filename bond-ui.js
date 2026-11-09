import { MORE_METERS, MORE_PRESETS, computeMore, moreWord } from './meters.js';
import { computeBond, computeDesire, DESIRE_CAPS, DESIRE_SCALES, scaleWord, frustrationWord, dynamicRows, DYNAMIC_GROUPS, PACE, paceOf } from './bond.js';
import { PRONOUN_CHOICES } from './pronouns.js';
import { fill } from './dynamics.js';

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
// opts: canRead (a scene reader is set up), pending (it's reading now), savedPool (picks saved for this character).
export function bondView({ bond, charName, userName, chatLength, axes = null, list = null, tally = null, canRead = false, pending = false, savedPool = null, overlaps = [] }) {
    const d = computeBond(bond, chatLength, charName, userName, axes, list);
    const changes = d.recent.filter(s => s.f || s.r || s.t || s.p || s.l);
    const pin = k => bond.pins[k] !== null;
    if (!bond.on) return `<section class="mw-bond is-off">
        <label class="mw-toggle"><input type="checkbox" data-bond-on> Hidden weave line for ${esc(charName)} in this chat</label>
        <p class="mw-fine">Off. Nothing is asked for or sent, and the info board’s words update feelings instead.</p></section>`;
    return `<section class="mw-bond">
        ${bond.extra ? dynCard(bond, d, charName, userName, { canRead, pending, savedPool }) : ''}
        ${overlapBlock(overlaps)}
        ${moreBlock(bond, list ?? [], userName)}
        ${desireCard(bond, list ?? [], charName, userName, d.sparks)}
        <div class="mw-bond-grid">
            ${meter('f', 'Friendship', d.f, d.friend, pin('f'))}
            ${meter('r', 'Romance', d.r, d.romance, pin('r'))}
            ${bond.extra ? `${meter('p', 'Control', d.p, d.control, pin('p'), [userName, charName])}${meter('l', 'Pull', d.l, d.pull, pin('l'), [userName, charName])}${meter('t', 'Trust', d.t, d.trust, pin('t'))}` : ''}
        </div>
        ${d.sparks.length ? `<div class="mw-bond-block" data-anchor="bond-lit"><h4>Lit lately <small>turn-ons and bedroom traits the last replies set off</small></h4><div class="mw-sparks">${d.sparks.map(x => `<span class="mw-spark ${x.off ? 'is-off' : ''} ${x.fresh ? 'is-fresh' : ''}" title="Message ${x.index + 1}">${x.off ? '✕' : '✧'} ${esc(x.text)}</span>`).join('')}</div></div>` : ''}
        ${tally?.sparks?.length ? `<div class="mw-bond-block" data-anchor="bond-tally"><h4>What gets to ${esc(charName)} <small>over this chat</small></h4><div class="mw-sparks">${tally.sparks.map(x => `<span class="mw-spark ${x.off ? 'is-off' : ''}">${x.off ? '✕' : '✧'} ${esc(x.text)} <b>×${x.count}</b></span>`).join('')}</div></div>` : ''}
        ${tally?.pressed?.length ? `<div class="mw-bond-block" data-anchor="bond-pressed"><h4>Hot buttons pressed</h4><div class="mw-sparks">${tally.pressed.map(x => `<span class="mw-spark is-off">⚡ ${esc(x.text)} <b>×${x.count}</b></span>`).join('')}</div></div>` : ''}
        <div class="mw-bond-block" data-anchor="bond-thinks"><h4>${esc(charName)} thinks ${esc(userName)} is…</h4>
            <div class="mw-bond-thinks">${d.thinks.length ? d.thinks.map(t => `<span class="mw-bond-chip${t.own ? ' is-own' : ''}" title="${t.own ? 'Added by you' : `Strength ${Math.min(100, t.value)}`}">${esc(t.text)}<button type="button" data-bond-mute="${esc(t.text)}" aria-label="Remove ${esc(t.text)}">×</button></span>`).join('') : `<i class="mw-fine">Nothing yet. Opinions show up as the story gives ${esc(charName)} reasons.</i>`}</div>
            <div class="mw-bond-add"><input type="text" maxlength="40" data-bond-new placeholder="Add one (e.g. reckless)" aria-label="Add an opinion"><button type="button" data-action="bond-add">Add</button></div></div>
        ${changes.length ? `<div class="mw-bond-block" data-anchor="bond-recent"><h4>Recent changes</h4><ul class="mw-bond-recent">${changes.map(s => `<li><b>#${s.index + 1}</b>${[['f', 'friendship'], ['r', 'romance'], ['t', 'trust'], ['p', 'control'], ['l', 'pull']].filter(([k]) => s[k]).map(([k, w]) => `<span class="${s[k] > 0 ? 'is-up' : 'is-down'}">${w} ${sign(s[k])}</span>`).join('')}</li>`).join('')}</ul></div>` : ''}
        <details class="mw-bond-settings"><summary>Weave line settings</summary>
            <label class="mw-toggle"><input type="checkbox" data-bond-on checked> Hidden weave line for ${esc(charName)} in this chat</label>
            <label class="mw-toggle"><input type="checkbox" data-bond-extra ${bond.extra ? 'checked' : ''}> Trust, Control, Pull and the named dynamic</label>
            <p class="mw-fine">Control is who really holds it: doors, money, freedom. Pull is who’s hooked on whom. They can point opposite ways, like a captive who still gets what she demands.</p>
            <p class="mw-fine">Each reply ends with one hidden line that only Moodweaver reads: only what changed in feelings, needs, relationship, these meters, opinions, turn-ons set off and turning points. SillyTavern hides it in chat and Moodweaver strips it from the prompt. About 380 prompt and 20 to 60 reply tokens, no extra request. Drag a meter to set it; pin to hold it. Every meter is read from the replies still in the chat, so a swipe or a deleted reply takes its change with it.</p>
        </details>
    </section>`;
}

// 1.43.0: ideas switched on in more than one place. The note already sends each once; this shows where, and
// the button turns the skipped copies off so the sliders match what's sent.
function overlapBlock(list = []) {
    const tidy = list.filter(o => o.drop.length);
    const shown = list.filter(o => o.drop.length || o.held?.length || o.also.length);
    if (!shown.length) return '';
    const row = o => `<li class="mw-overlap-row"><div><b>${esc(o.label)}</b>
        <span class="mw-overlap-keep">sent as ${esc(o.keep)}${o.both.length ? ` + ${o.both.map(esc).join(', ')}` : ''}</span>
        ${o.drop.length ? `<span class="mw-overlap-drop">not sent: ${o.drop.map(esc).join(', ')}</span>` : ''}
        ${o.held?.length ? `<span class="mw-overlap-held">not sent, but stays on because it feeds the meters: ${o.held.map(esc).join(', ')}</span>` : ''}
        ${o.also.length ? `<span class="mw-overlap-also">also a moodlet: ${o.also.map(esc).join(', ')}</span>` : ''}</div>
        ${o.drop.length ? `<button type="button" class="mw-overlap-tidy" data-overlap-tidy="${esc(o.key)}" aria-label="Turn off the extra ${esc(o.label)} copies">Tidy</button>` : ''}</li>`;
    return `<details class="mw-overlap" data-anchor="bond-overlap"><summary><span>⧉ Doubled up</span><small>${shown.length} idea${shown.length === 1 ? '' : 's'} in more than one place</small></summary>
        <p class="mw-fine">The note sends each of these once already. Tidy switches off the crossed-out copies so your sliders match what’s sent. Meters, the dynamic and moodlets are never touched.</p>
        <ul class="mw-overlap-list">${shown.map(row).join('')}</ul>
        ${tidy.length > 1 ? `<button type="button" class="mw-overlap-all" data-overlap-tidy="">Tidy all ${tidy.length}</button>` : ''}</details>`;
}

// 1.39.1: the desire card. Closed, it's one line: the stage, how it's showing and two thin bars. Open, every
// bar can be dragged and pinned like the other meters; scales you don't want can be switched off.
function desireCard(bond, list, charName, userName, sparks = []) {
    const d = bond.desire ?? {};
    if (!d.on) return `<details class="mw-desire-card is-off"><summary><span>♨ Desire</span><small>off in this chat</small></summary>
        <label class="mw-toggle"><input type="checkbox" data-desire-on> Track ${esc(charName)}’s desire for ${esc(userName)} in this chat</label>
        <p class="mw-fine">Arousal plus how it shows: boldness, tender or rough, fixation on you, shame and holding back. Moved by each reply’s hidden line, slow by default.</p></details>`;
    const x = computeDesire(d, list), who = esc(userName);
    const word = (k, v) => k === 'a' ? x.stage : k === 'f' ? frustrationWord(v) : scaleWord(k, v).replace('them', who);
    const bar = (key, label) => `<div class="mw-desire-row" data-anchor="desire-${key}" data-tone="${key}"><div class="mw-bond-head"><b>${label}</b><span>${esc(word(key, x[key]))}</span>
        <button type="button" class="mw-need-pin" data-desire-pin="${key}" aria-pressed="${x.pins[key] !== null}" title="${x.pins[key] !== null ? 'Unpin: let replies move it again' : 'Pin: hold it here'}">${x.pins[key] !== null ? '◆' : '◇'}</button></div>
        <input type="range" min="0" max="100" step="1" value="${x[key]}" data-desire-bar="${key}" class="mw-desire-bar" style="--mw-fill:${x[key]}%" aria-label="${label}"></div>`;
    const mini = (v, tone) => `<i class="mw-desire-mini" data-tone="${tone}" style="--mw-fill:${v}%"></i>`;
    const shown = DESIRE_SCALES.filter(([k]) => x.scales[k]);
    const flavour = [x.scales.b ? scaleWord('b', x.b) : '', x.scales.t ? scaleWord('t', x.t) : ''].filter(w => w && x.a > 10).join(' · ');
    const lit = sparks.filter(s => !s.off).slice(0, 4);
    return `<details class="mw-desire-card"><summary><span>♨ ${esc(x.stage)}${flavour ? ` <small>· ${esc(flavour)}</small>` : ''}</span><span class="mw-desire-minis">${mini(x.a, 'a')}${mini(x.f, 'f')}</span></summary>
        ${bar('a', 'Arousal')}${shown.map(([k, label]) => bar(k, label)).join('')}${bar('f', 'Frustration')}
        ${lit.length ? `<div class="mw-sparks"><small>Lit lately</small>${lit.map(s => `<span class="mw-spark ${s.fresh ? 'is-fresh' : ''}">✧ ${esc(s.text)}</span>`).join('')}</div>` : ''}
        <div class="mw-desire-opts"><label>Pace<select data-desire-pace>${[['slow', 'Slow burn'], ['normal', 'Normal'], ['fast', 'Fast']].map(([v, l]) => `<option value="${v}" ${x.pace === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            <label>Tops out at<select data-desire-cap>${DESIRE_CAPS.map(([v, l]) => `<option value="${v}" ${x.cap === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <div class="mw-desire-scales"><small>Scales</small>${DESIRE_SCALES.map(([k, label]) => `<label class="mw-scale-chip"><input type="checkbox" data-desire-scale="${k}" ${x.scales[k] ? 'checked' : ''}> ${label}</label>`).join('')}</div>
        <p class="mw-fine">Boldness decides how they act on it, unless holding back is high. Only scales that are saying something reach Claude. Slow burn lets arousal rise only a small step per reply. Release resets arousal and frustration, then a short afterglow. Drag a bar to set it; pin ◆ to hold it.</p>
        <label class="mw-toggle"><input type="checkbox" data-desire-on checked> Track desire in this chat</label></details>`;
}

// 1.40.0: the extra meters. Only the ones you switch on get a bar; quick picks switch on a set that suits
// a character. They shape the named dynamic and reach Claude only when they're saying something.
function moreBlock(bond, list, userName) {
    const d = computeMore(bond.more, list, paceOf(bond).cap), on = d.on;
    const bars = on.map(k => {
        const [, label, two] = MORE_METERS.find(m => m[0] === k), v = d.values[k], pinned = d.pins[k] !== null;
        return `<div class="mw-bond-meter mw-more-meter" data-anchor="more-${k}" data-tone="${k}"><div class="mw-bond-head"><b>${label}</b><span data-more-word="${k}">${esc(moreWord(k, v).replace(/\bthem\b/, userName))}</span>
            <button type="button" class="mw-need-pin" data-more-pin="${k}" aria-pressed="${pinned}" title="${pinned ? 'Unpin: let replies move it again' : 'Pin: hold it here'}">${pinned ? '◆' : '◇'}</button></div>
            <input type="range" min="${two ? -100 : 0}" max="100" step="1" value="${v}" data-more-meter="${k}" data-two="${two ? 1 : 0}" class="mw-bond-bar" style="--mw-fill:${two ? (v + 100) / 2 : v}%" aria-label="${label}"></div>`;
    }).join('');
    return `<div class="mw-more">${bars ? `<div class="mw-bond-grid">${bars}</div>` : ''}
        <details class="mw-more-pick"><summary>＋ Meters <small>${on.length ? `${on.length} on` : 'all off'}</small></summary>
            <div class="mw-more-presets"><small>Quick picks</small>${MORE_PRESETS.map(([name]) => `<button type="button" class="mw-chip-btn" data-more-preset="${esc(name)}">${esc(name)}</button>`).join('')}<button type="button" class="mw-chip-btn" data-more-preset="">None</button></div>
            ${MORE_METERS.map(([k, label, , , , , , , desc]) => `<label class="mw-toggle mw-more-opt"><input type="checkbox" data-more-on="${k}" ${on.includes(k) ? 'checked' : ''}> <span><b>${label}</b> <small>${esc(desc)}</small></span></label>`).join('')}
            <p class="mw-fine">For this chat. A quick pick replaces which meters are on. The hidden line moves the ones that are on, they unlock new named dynamics above, and they go to Claude only when they’re saying something.</p></details></div>`;
}

// 1.42.0: the dynamic card. Who names it (the story, the meters or you), how fast things move, a fresh read
// of the scene, and the dynamics you've picked for this pair.
const groupRows = () => DYNAMIC_GROUPS.map(([id, label, icon]) => [id, label, icon, dynamicRows().filter(r => (r[3] ?? 'own') === id)]).filter(([id, , , rows]) => rows.length || id === 'own');
function dynCard(bond, d, n, u, { canRead, pending, savedPool }) {
    const mode = bond.fixed ? 'pick' : bond.mode, pool = new Set(bond.pool), pace = PACE[bond.pace] ? bond.pace : 'steady';
    const ago = d.call ? (d.call.ago === 0 ? 'in the last reply' : `${d.call.ago} repl${d.call.ago === 1 ? 'y' : 'ies'} ago`) : '';
    const why = mode === 'pick' ? 'Chosen by you; it stays until you switch back.'
        : d.source === 'reader' ? 'From the scene reader. Replies take over again from here.'
        : d.source === 'story' ? `The story named it ${ago}. It changes when a reply shows something different${pool.size ? `, from your ${pool.size} picks` : ''}.`
        : `${mode === 'story' ? 'No reply has named one yet, so it’s ' : ''}${mode === 'story' ? 'read' : 'Read'} from the meters${PACE[pace].lean ? `, leaning on the last ${PACE[pace].window} replies` : ''}. Pinned meters win${pool.size ? '; your picks come first' : ''}.`;
    const options = groupRows().map(([, label, , rows]) => rows.length ? `<optgroup label="${esc(label)}">${rows.map(r => `<option value="${esc(r[0])}" ${(bond.fixed || d.dynamic.key) === r[0] ? 'selected' : ''}>${esc(fill(r[0], n, u))}</option>`).join('')}</optgroup>` : '').join('');
    const short = t => t.length > 120 ? `${t.slice(0, 117).replace(/\s+\S*$/, '')}…` : t;
    const row = r => `<label class="mw-toggle mw-dyn-opt" data-dyn-row="${esc(`${fill(r[0], n, u)} ${r[4] ?? ''}`.toLowerCase())}"><input type="checkbox" data-dyn-pool="${esc(r[0])}" ${pool.has(r[0]) ? 'checked' : ''}>
        <span><b>${esc(fill(r[0], n, u))}</b>${r[1] ? '' : ' <i class="mw-dyn-only">story or you</i>'}${r[3] === 'own' ? ` <button type="button" class="mw-dyn-x" data-dyn-own-remove="${esc(r[0])}" aria-label="Delete ${esc(r[0])}">×</button>` : ''}<small>${esc(short(r[2](n, u)))}</small></span></label>`;
    const groups = groupRows().map(([id, label, icon, rows]) => {
        const picked = rows.filter(r => pool.has(r[0])).length;
        return `<details class="mw-dyn-group" data-anchor="dyn-group-${id}"><summary><span>${icon} ${esc(label)}</span><small>${picked ? `${picked} of ${rows.length}` : rows.length}</small></summary>
            ${rows.length ? `<button type="button" class="mw-chip-btn mw-dyn-all" data-dyn-group-all="${id}">${picked === rows.length ? 'Unpick all' : 'Pick all'}</button>${rows.map(row).join('')}` : ''}
            ${id === 'own' ? `<div class="mw-dyn-own"><input type="text" maxlength="50" data-dyn-own-name placeholder="Name, e.g. Doll and keeper" aria-label="Your dynamic’s name">
                <textarea rows="2" maxlength="240" data-dyn-own-cue placeholder="What it looks like on the page. {n} is ${esc(n)}, {u} is ${esc(u)}." aria-label="What it looks like"></textarea>
                <button type="button" class="mw-chip-btn" data-action="dyn-own-add">＋ Add</button><small class="mw-fine">Yours are kept for every chat. Only you or the story pick them.</small></div>` : ''}</details>`;
    }).join('');
    return `<div class="mw-dyn-card" data-anchor="bond-dynamic" data-dynamic="${slug(d.dynamic.key)}" data-tone="${d.dynamic.tone}"><small>${esc(n)} &amp; ${esc(u)}${d.swing ? ' <b class="mw-swing">⇄ swinging</b>' : ''}</small><h3>${esc(d.dynamic.name)}</h3><p>${esc(d.dynamic.cue)}</p>
        <div class="mw-dyn-modes" role="group" aria-label="Who names the dynamic">${[['story', '✧ Story'], ['meters', '≋ Meters'], ['pick', '✎ I pick']].map(([k, label]) => `<button type="button" data-dyn-mode="${k}" aria-pressed="${mode === k}">${label}</button>`).join('')}</div>
        ${mode === 'pick' ? `<label class="mw-dyn-pick">Dynamic<select data-bond-dynamic aria-label="Their dynamic">${options}</select></label>` : ''}
        <div class="mw-dyn-row"><label>Pace<select data-dyn-pace aria-label="How fast things change">${Object.entries(PACE).map(([k, p]) => `<option value="${k}" ${pace === k ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}</select></label>
            ${canRead ? `<button type="button" class="mw-chip-btn mw-dyn-read" data-action="bond-reread" ${pending ? 'disabled' : ''} title="Ask the scene reader where these two stand right now">${pending ? 'Reading…' : '✧ Re-read the scene'}</button>` : ''}</div>
        <small class="mw-dyn-why">${esc(why)} ${esc(PACE[pace].label)}: ${esc(PACE[pace].hint)}.</small>
        <div class="mw-dyn-row mw-dyn-pronouns" title="So the lines Claude reads say he and she instead of repeating names">${[['n', n, bond.pn], ['u', u, bond.pu]].map(([k, who, v]) => `<label>${esc(who)} is<select data-dyn-pronoun="${k}" aria-label="Pronoun for ${esc(who)}">${PRONOUN_CHOICES.map(([id, label]) => `<option value="${id}" ${v === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`).join('')}</div>
        <details class="mw-dyn-pool" data-anchor="dyn-pool"><summary>Dynamics for these two <small>${pool.size ? `${pool.size} picked` : 'none picked: any of them'}</small></summary>
            <p class="mw-fine">Story mode: the hidden line chooses from your picks. Meters: your picks are tried first. With none picked, it can be any of them.</p>
            <input type="search" data-dyn-search placeholder="Find a dynamic (captor, crush, toxic…)" aria-label="Find a dynamic">
            <div class="mw-dyn-tools"><button type="button" class="mw-chip-btn" data-action="dyn-pool-save">Save picks for ${esc(n)}’s new chats</button>${savedPool?.length ? `<button type="button" class="mw-chip-btn" data-action="dyn-pool-load">Use saved (${savedPool.length})</button>` : ''}${pool.size ? '<button type="button" class="mw-chip-btn" data-action="dyn-pool-clear">Clear picks</button>' : ''}</div>
            ${groups}</details></div>`;
}
