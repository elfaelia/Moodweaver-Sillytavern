import { MORE_METERS, MORE_PRESETS, computeMore, moreWord } from '../engine/meters.js';
import { computeBond, computeDesire, DESIRE_CAPS, DESIRE_SCALES, scaleWord, frustrationWord, dynamicRows, DYNAMIC_GROUPS, PACE, TIES, paceOf } from '../engine/bond.js';
import { pronounize } from '../engine/pronouns.js';
import { fill } from '../engine/dynamics.js';
import { ui } from '../app/state.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sign = v => v > 0 ? `+${v}` : `${v}`;
// -100..100 drawn centre-out, like the Sims relationship panel.
function meter(key, label, value, level, pinned, ends = ['-100', '100']) {
    return `<div class="mw-bond-meter" data-bond-kind="${key}">
        <div class="mw-bond-head"><b>${label}</b><span data-bond-level="${key}">${esc(level)}</span>
            <button type="button" class="mw-need-pin" data-bond-pin="${key}" aria-pressed="${pinned}" title="${pinned ? 'Unpin: let replies move it again' : 'Pin: hold it here'}" aria-label="${pinned ? `Unpin ${label}` : `Pin ${label}`}">${pinned ? '\u25c6' : '\u25c7'}</button></div>
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
export function bondView({ bond, charName, userName, chatLength, axes = null, list = null, tally = null, canRead = false, pending = false, savedPool = null, overlaps = [], drivers = null }) {
    const d = computeBond(bond, chatLength, charName, userName, axes, list);
    const changes = d.recent.filter(s => s.f || s.r || s.t || s.p || s.l);
    const pin = k => bond.pins[k] !== null;
    if (!bond.on) return `<section class="mw-bond is-off">
        <label class="mw-toggle"><input type="checkbox" data-bond-on> Hidden weave line for ${esc(charName)} in this chat</label>
        <p class="mw-fine">Off. The info board updates feelings instead.</p></section>`;
    return `<section class="mw-bond">
        ${bond.extra ? dynCard(bond, d, charName, userName, { canRead, pending, savedPool, drivers }) : ''}
        ${overlapBlock(overlaps)}
        ${moreBlock(bond, list ?? [], userName)}
        ${desireCard(bond, list ?? [], charName, userName, d.sparks)}
        <div class="mw-bond-grid">
            ${meter('f', 'Friendship', d.f, d.friend, pin('f'))}
            ${meter('r', 'Romance', d.r, d.romance, pin('r'))}
            ${bond.extra ? `${meter('p', 'Control', d.p, d.control, pin('p'), [userName, charName])}${meter('l', 'Pull', d.l, d.pull, pin('l'), [userName, charName])}${meter('t', 'Trust', d.t, d.trust, pin('t'))}` : ''}
        </div>
        ${d.sparks.length ? `<div class="mw-bond-block" data-anchor="bond-lit"><h4>Lit lately <small>turn-ons and bedroom traits the last replies set off</small></h4><div class="mw-sparks">${d.sparks.map(x => `<span class="mw-spark ${x.off ? 'is-off' : ''} ${x.fresh ? 'is-fresh' : ''}" title="Message ${x.index + 1}">${x.off ? '\u2715' : '\u2727'} ${esc(x.text)}</span>`).join('')}</div></div>` : ''}
        ${tally?.sparks?.length ? `<div class="mw-bond-block" data-anchor="bond-tally"><h4>What gets to ${esc(charName)} <small>over this chat</small></h4><div class="mw-sparks">${tally.sparks.map(x => `<span class="mw-spark ${x.off ? 'is-off' : ''}">${x.off ? '\u2715' : '\u2727'} ${esc(x.text)} <b>\u00d7${x.count}</b></span>`).join('')}</div></div>` : ''}
        ${tally?.pressed?.length ? `<div class="mw-bond-block" data-anchor="bond-pressed"><h4>Hot buttons pressed</h4><div class="mw-sparks">${tally.pressed.map(x => `<span class="mw-spark is-off">\u26a1 ${esc(x.text)} <b>\u00d7${x.count}</b></span>`).join('')}</div></div>` : ''}
        <div class="mw-bond-block" data-anchor="bond-thinks"><h4>${esc(charName)} thinks ${esc(userName)} is\u2026</h4>
            <div class="mw-bond-thinks">${d.thinks.length ? d.thinks.map(t => `<span class="mw-bond-chip${t.own ? ' is-own' : ''}" title="${t.own ? 'Added by you' : `Strength ${Math.min(100, t.value)}`}">${esc(t.text)}<button type="button" data-bond-mute="${esc(t.text)}" aria-label="Remove ${esc(t.text)}">\u00d7</button></span>`).join('') : `<i class="mw-fine">Nothing yet.</i>`}</div>
            <div class="mw-bond-add"><input type="text" maxlength="40" data-bond-new placeholder="Add one (e.g. reckless)" aria-label="Add an opinion"><button type="button" data-action="bond-add">Add</button></div></div>
        ${changes.length ? `<div class="mw-bond-block" data-anchor="bond-recent"><h4>Recent changes</h4><ul class="mw-bond-recent">${changes.map(s => `<li><b>#${s.index + 1}</b>${[['f', 'friendship'], ['r', 'romance'], ['t', 'trust'], ['p', 'control'], ['l', 'pull']].filter(([k]) => s[k]).map(([k, w]) => `<span class="${s[k] > 0 ? 'is-up' : 'is-down'}">${w} ${sign(s[k])}</span>`).join('')}</li>`).join('')}</ul></div>` : ''}
        <details class="mw-bond-settings"><summary>Weave line settings</summary>
            <label class="mw-toggle"><input type="checkbox" data-bond-on checked> Hidden weave line for ${esc(charName)} in this chat</label>
            <label class="mw-toggle"><input type="checkbox" data-bond-extra ${bond.extra ? 'checked' : ''}> Trust, Control, Pull and the named dynamic</label>
            <p class="mw-fine">Control: who holds the doors, money and freedom. Pull: who\u2019s hooked on whom.</p>
            <p class="mw-fine">Each reply ends with a hidden line saying what changed. Swipes and deletes undo it. Pin \u25c6 a meter to hold it.</p>
        </details>
    </section>`;
}

// Ideas switched on in more than one place. The note already sends each once; this shows where, and
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
    return `<details class="mw-overlap" data-anchor="bond-overlap"><summary><span>\u29c9 Doubled up</span><small>${shown.length} idea${shown.length === 1 ? '' : 's'} in more than one place</small></summary>
        <p class="mw-fine">These say the same thing twice. Tidy switches off the crossed-out copies.</p>
        <ul class="mw-overlap-list">${shown.map(row).join('')}</ul>
        ${tidy.length > 1 ? `<button type="button" class="mw-overlap-all" data-overlap-tidy="">Tidy all ${tidy.length}</button>` : ''}</details>`;
}

// The desire card. Closed, it's one line: the stage, how it's showing and two thin bars. Open, every
// bar can be set with a tap and pinned like the other meters; scales you don't want can be switched off.
function desireCard(bond, list, charName, userName, sparks = []) {
    const d = bond.desire ?? {};
    if (!d.on) return `<details class="mw-desire-card is-off"><summary><span>\u2668 Desire</span><small>off in this chat</small></summary>
        <label class="mw-toggle"><input type="checkbox" data-desire-on> Track ${esc(charName)}\u2019s desire for ${esc(userName)} in this chat</label>
        <p class="mw-fine">Arousal and how it shows.</p></details>`;
    const x = computeDesire(bond, list), who = esc(userName);
    const word = (k, v) => k === 'a' ? x.stage : k === 'f' ? frustrationWord(v) : scaleWord(k, v).replace('them', who);
    const bar = (key, label) => `<div class="mw-desire-row" data-anchor="desire-${key}" data-tone="${key}"><div class="mw-bond-head"><b>${label}</b><span>${esc(word(key, x[key]))}</span>
        <button type="button" class="mw-need-pin" data-desire-pin="${key}" aria-pressed="${x.pins[key] !== null}" title="${x.pins[key] !== null ? 'Unpin: let replies move it again' : 'Pin: hold it here'}">${x.pins[key] !== null ? '\u25c6' : '\u25c7'}</button></div>
        <input type="range" min="0" max="100" step="1" value="${x[key]}" data-desire-bar="${key}" class="mw-desire-bar" style="--mw-fill:${x[key]}%" aria-label="${label}"></div>`;
    const mini = (v, tone) => `<i class="mw-desire-mini" data-tone="${tone}" style="--mw-fill:${v}%"></i>`;
    const shown = DESIRE_SCALES.filter(([k]) => x.scales[k]);
    const flavour = [x.scales.b ? scaleWord('b', x.b) : '', x.scales.t ? scaleWord('t', x.t) : ''].filter(w => w && x.a > 10).join(' \u00b7 ');
    const lit = sparks.filter(s => !s.off).slice(0, 4);
    return `<details class="mw-desire-card"><summary><span>\u2668 ${esc(x.stage)}${flavour ? ` <small>\u00b7 ${esc(flavour)}</small>` : ''}</span><span class="mw-desire-minis">${mini(x.a, 'a')}${mini(x.f, 'f')}</span></summary>
        ${bar('a', 'Arousal')}${shown.map(([k, label]) => bar(k, label)).join('')}${bar('f', 'Frustration')}
        ${lit.length ? `<div class="mw-sparks"><small>Lit lately</small>${lit.map(s => `<span class="mw-spark ${s.fresh ? 'is-fresh' : ''}">\u2727 ${esc(s.text)}</span>`).join('')}</div>` : ''}
        <div class="mw-desire-opts"><label>Tops out at<select data-desire-cap>${DESIRE_CAPS.map(([v, l]) => `<option value="${v}" ${x.cap === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <div class="mw-desire-scales"><small>Scales</small>${DESIRE_SCALES.map(([k, label]) => `<label class="mw-scale-chip"><input type="checkbox" data-desire-scale="${k}" ${x.scales[k] ? 'checked' : ''}> ${label}</label>`).join('')}</div>
        <p class="mw-fine">Release resets arousal and frustration. Pin \u25c6 to hold a bar.</p>
        <label class="mw-toggle"><input type="checkbox" data-desire-on checked> Track desire in this chat</label></details>`;
}

// The extra meters. Only the ones you switch on get a bar; quick picks switch on a set that suits
// a character. They shape the named dynamic and reach Claude only when they're saying something.
function moreBlock(bond, list, userName) {
    const d = computeMore(bond.more, list, paceOf(bond).cap), on = d.on;
    const bars = on.map(k => {
        const [, label, two] = MORE_METERS.find(m => m[0] === k), v = d.values[k], pinned = d.pins[k] !== null;
        return `<div class="mw-bond-meter mw-more-meter" data-anchor="more-${k}" data-tone="${k}"><div class="mw-bond-head"><b>${label}</b><span data-more-word="${k}">${esc(moreWord(k, v).replace(/\bthem\b/, userName))}</span>
            <button type="button" class="mw-need-pin" data-more-pin="${k}" aria-pressed="${pinned}" title="${pinned ? 'Unpin: let replies move it again' : 'Pin: hold it here'}">${pinned ? '\u25c6' : '\u25c7'}</button></div>
            <input type="range" min="${two ? -100 : 0}" max="100" step="1" value="${v}" data-more-meter="${k}" data-two="${two ? 1 : 0}" class="mw-bond-bar" style="--mw-fill:${two ? (v + 100) / 2 : v}%" aria-label="${label}"></div>`;
    }).join('');
    return `<div class="mw-more">${bars ? `<div class="mw-bond-grid">${bars}</div>` : ''}
        <details class="mw-more-pick"><summary>\uff0b Meters <small>${on.length ? `${on.length} on` : 'all off'}</small></summary>
            <div class="mw-more-presets"><small>Quick picks</small>${MORE_PRESETS.map(([name]) => `<button type="button" class="mw-chip-btn" data-more-preset="${esc(name)}">${esc(name)}</button>`).join('')}<button type="button" class="mw-chip-btn" data-more-preset="">None</button></div>
            ${MORE_METERS.map(([k, label, , , , , , , desc]) => `<label class="mw-toggle mw-more-opt"><input type="checkbox" data-more-on="${k}" ${on.includes(k) ? 'checked' : ''}> <span><b>${label}</b> <small>${esc(desc)}</small></span></label>`).join('')}
            <p class="mw-fine">Each meter you switch on opens up more dynamics.</p></details></div>`;
}

// The dynamic card. Who names it (the story, the meters or you), how fast things move, a fresh read
// of the scene, and the dynamics you've picked for this pair.
const groupRows = () => DYNAMIC_GROUPS.map(([id, label, icon]) => [id, label, icon, dynamicRows().filter(r => r[3] === id)]).filter(([, , , rows]) => rows.length);
// What's shaping where they stand: the strongest ties set between them, and how much his turn-ons that the
// player shows warm (or cool) the romance. Shown under the dynamic so the meters don't look like they come
// from nowhere.
function driversLine(drivers, n, u) {
    if (!drivers || (!drivers.ties.length && !drivers.warm && !drivers.offer)) return '';
    const o = drivers.offer, offer = o ? `<span class="mw-dyn-offer"><button type="button" class="mw-dyn-driver is-offer" data-tie-offer="${esc(o.id)}" title="${esc(`${o.dynamic} has held a while. Tap to add this on ${n}\u2019s side at 50; it isn\u2019t set unless you do`)}">\uff0b ${esc(o.label.replace(/\s*\{other\}\s*/g, ' ').trim())}?</button><button type="button" class="mw-dyn-offer-x" data-tie-skip="${esc(o.id)}" aria-label="Don\u2019t suggest this again">\u00d7</button></span>` : '';
    const side = { n: `${n}\u2019s side`, u: `${u}\u2019s side`, both: 'both ways' };
    return `<div class="mw-dyn-drivers"><small>Shaped by</small>${drivers.ties.map(t => `<span class="mw-dyn-driver">${esc(t.label)} <i>${esc(side[t.side])} \u00b7 ${t.value}</i></span>`).join('')}${drivers.warm ? `<span class="mw-dyn-driver ${drivers.warm < 0 ? 'is-off' : ''}">${drivers.warm > 0 ? '\u2661' : '\u2715'} turn-ons in play <i>romance ${drivers.warm > 0 ? '+' : ''}${drivers.warm}</i></span>` : ''}${offer}</div>`;
}
function dynCard(bond, d, n, u, { canRead, pending, savedPool, drivers }) {
    const mode = bond.fixed ? 'pick' : bond.mode, pool = new Set(bond.pool), pace = PACE[bond.pace] ? bond.pace : 'steady';
    const ago = d.call ? (d.call.ago === 0 ? 'in the last reply' : `${d.call.ago} repl${d.call.ago === 1 ? 'y' : 'ies'} ago`) : '';
    const why = mode === 'pick' ? 'Chosen by you; it stays until you switch back.'
        : d.source === 'reader' ? 'From the scene reader. Replies take over again from here.'
        : d.source === 'story' ? `The story named it ${ago}. It changes when a reply shows something different${pool.size ? `, from your ${pool.size} picks` : ''}.`
        : `${mode === 'story' ? 'No reply has named one yet, so it\u2019s ' : ''}${mode === 'story' ? 'read' : 'Read'} from the meters${PACE[pace].lean ? `, leaning on the last ${PACE[pace].window} replies` : ''}${bond.nudge !== false ? ', which feelings in each reply push too' : ''}. Pinned meters win${pool.size ? '; your picks come first' : ''}.${d.dynamic.toward ? ` Moving toward ${d.dynamic.toward}: it takes over if the next reply agrees.` : ''}`;
    // "I pick" lists only your picked dynamics when you have some (plus the one on now), so it isn't 600 long;
    // "Show all" opens the whole list.
    const onNow = bond.fixed || d.dynamic.key, narrow = pool.size > 0 && !ui.dynPickAll;
    const options = groupRows().map(([, label, , rows]) => { const list = narrow ? rows.filter(r => pool.has(r[0]) || r[0] === onNow) : rows;
        return list.length ? `<optgroup label="${esc(label)}">${list.map(r => `<option value="${esc(r[0])}" ${onNow === r[0] ? 'selected' : ''}>${esc(fill(r[0], n, u))}</option>`).join('')}</optgroup>` : ''; }).join('');
    const cap = t => t ? t[0].toUpperCase() + t.slice(1) : t;
    const short = t => t.length > 120 ? `${t.slice(0, 117).replace(/\s+\S*$/, '')}\u2026` : t;
    const row = r => `<label class="mw-toggle mw-dyn-opt" data-dyn-row="${esc(`${fill(r[0], n, u)} ${r[4] ?? ''}`.toLowerCase())}"><input type="checkbox" data-dyn-pool="${esc(r[0])}" ${pool.has(r[0]) ? 'checked' : ''}>
        <span><b>${esc(fill(r[0], n, u))}</b>${r[1] ? '' : ' <i class="mw-dyn-only">story or you</i>'}<small>${esc(short(cap(pronounize(r[2](n, u), n, u))))}</small></span></label>`;
    // Like the skills catalogue: your picks show on their own, grouped; "Browse all" opens every group, folded and
    // drawn only when opened. The full list is only drawn while browsing.
    const browsing = Boolean(ui.dynBrowse);
    const mine = () => groupRows().map(([, label, icon, rows]) => { const on = rows.filter(r => pool.has(r[0])); return on.length ? `<h5 class="mw-subhead">${icon} ${esc(label)}</h5>${on.map(row).join('')}` : ''; }).join('');
    const groups = () => groupRows().map(([id, label, icon, rows]) => {
        const picked = rows.filter(r => pool.has(r[0])).length;
        return `<details class="mw-dyn-group" data-anchor="dyn-group-${id}"><summary><span>${icon} ${esc(label)}</span><small>${picked ? `${picked} of ${rows.length}` : rows.length}</small></summary>
            <button type="button" class="mw-chip-btn mw-dyn-all" data-dyn-group-all="${id}">${picked === rows.length ? 'Unpick all' : 'Pick all'}</button>${rows.map(row).join('')}</details>`;
    }).join('');
    return `<div class="mw-dyn-card" data-anchor="bond-dynamic" data-dynamic="${slug(d.dynamic.key)}" data-tone="${d.dynamic.tone}"><small>${esc(n)} &amp; ${esc(u)}${d.swing ? ' <b class="mw-swing">\u21c4 swinging</b>' : ''}</small><h3>${esc(d.dynamic.name)}</h3><p>${esc(cap(d.dynamic.cue))}</p>
        ${d.under ? `<div class="mw-dyn-under" data-tone="${d.under.tone}"><small>Underneath</small><b>${esc(d.under.name)}</b><span>${esc(cap(d.under.cue))}</span></div>` : ''}
        ${d.moment ? `<div class="mw-dyn-under mw-dyn-moment"><small>Right now</small><b>${esc(d.moment.name)}</b><span>${esc(cap(pronounize(d.moment.line, n, u)))}</span></div>` : ''}
        ${driversLine(drivers, n, u)}
        <div class="mw-dyn-modes" role="group" aria-label="Who names the dynamic">${[['story', '\u2727 Story'], ['meters', '\u224b Meters'], ['pick', '\u270e I pick']].map(([k, label]) => `<button type="button" data-dyn-mode="${k}" aria-pressed="${mode === k}">${label}</button>`).join('')}</div>
        ${mode === 'pick' ? `<div class="mw-dyn-pickrow"><label class="mw-dyn-pick">Dynamic<select data-bond-dynamic aria-label="Their dynamic">${options}</select></label>${pool.size ? `<button type="button" class="mw-chip-btn" data-action="dyn-pick-all" aria-pressed="${!narrow}">${narrow ? `Show all ${dynamicRows().length}` : `Only my ${pool.size} picks`}</button>` : ''}</div>` : ''}
        <div class="mw-dyn-row"><label title="How much the relationship sliders you set between them hold the meters and the dynamic">Your sliders<select data-bond-ties aria-label="How much your relationship sliders weigh">${Object.entries(TIES).map(([k, t]) => `<option value="${k}" ${bond.ties === k ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select></label>
            <label class="mw-toggle mw-dyn-nudge" title="Feelings each reply reports push the matching meters: caring pushes Care, controlling pushes Control and Discipline, horny pushes Lust"><input type="checkbox" data-dyn-nudge ${bond.nudge !== false ? 'checked' : ''}> Feelings push meters</label>
            <label class="mw-toggle mw-dyn-nudge" title="A second, slower dynamic: where the two of them stand over the last dozen or so replies, read from where the meters have settled. The main one is the scene. Hidden while they're the same"><input type="checkbox" data-dyn-under ${bond.under !== false ? 'checked' : ''}> Second dynamic underneath</label>
            ${canRead ? `<button type="button" class="mw-chip-btn mw-dyn-read" data-action="bond-reread" ${pending ? 'disabled' : ''} title="Ask the scene reader where these two stand right now">${pending ? 'Reading\u2026' : '\u2727 Re-read the scene'}</button>` : ''}</div>
        <small class="mw-dyn-why">${esc(why)} Your sliders: ${esc(TIES[bond.ties]?.hint ?? TIES.balanced.hint)}. Pace (set on the Moods card): ${esc(PACE[pace].label)}.</small>
        <details class="mw-dyn-pool" data-anchor="dyn-pool"><summary>Dynamics for these two <small>${pool.size ? `${pool.size} picked${mode === 'story' && pool.size <= 25 ? ` \u00b7 about ${Math.ceil([...pool].map(x => fill(x, n, u)).join(', ').length / 3.6)} tokens a reply` : ''}` : 'none picked: any of them'}</small></summary>
            ${browsing ? `<p class="mw-fine">Tick the ones that fit ${esc(n)} and ${esc(u)}, then tap Done. Search looks through every group.</p>
            <div class="mw-tools"><input type="search" data-dyn-search placeholder="Find a dynamic (captor, crush, toxic\u2026)" aria-label="Find a dynamic"><button type="button" class="mw-primary" data-action="dyn-browse-done">\u2713 Done</button></div>
            ${groups()}`
            : `<p class="mw-fine">${pool.size ? 'Only your picks can come up. Untick one to drop it.' : 'None picked, so any of them can come up. Browse to pick the ones that fit.'}</p>
            ${pool.size ? `<div class="mw-dyn-mine">${mine()}</div>` : ''}
            <div class="mw-dyn-tools"><button type="button" class="mw-primary" data-action="dyn-browse">\uff0b Browse all ${dynamicRows().length}</button><button type="button" class="mw-chip-btn" data-action="dyn-pool-save">Save picks for ${esc(n)}\u2019s new chats</button>${savedPool?.length ? `<button type="button" class="mw-chip-btn" data-action="dyn-pool-load">Use saved (${savedPool.length})</button>` : ''}${pool.size ? '<button type="button" class="mw-chip-btn" data-action="dyn-pool-clear">Clear picks</button>' : ''}</div>`}</details></div>`;
}
