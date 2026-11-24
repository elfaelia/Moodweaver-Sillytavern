// Arcs on Scene (2.0, engine/arcs.js): the running arc with its stages, an arc the story has begun offered as one
// chip, or a quiet way to start one. Hold keeps it on its stage; Move on takes it one stage further by hand.
import { arcNow, arcOffer } from '../app/replies.js';
import { getStoryState } from '../app/chat.js';
import { ui } from '../app/state.js';
import { ARCS } from '../engine/arcs.js';
import { escapeHtml as esc } from '../engine/util.js';

export function arcsCard(ch) {
    const story = getStoryState(ch); if (!story) return '';
    const now = arcNow(ch), offer = arcOffer(ch), marks = story.arcMarks ?? [];
    const behind = marks.length ? `<div class="mw-arc-marks"><small>Behind them</small>${marks.map((m, i) => `<span class="mw-arc-mark">${esc(m)}<button type="button" data-arc-mark-off="${i}" aria-label="Forget this">\u2715</button></span>`).join('')}</div>` : '';
    if (now && !now.landed && !now.fizzled) {
        const { def, stage, held } = now;
        return `<section class="mw-arc"><header><small>Arc \u00b7 stage ${stage + 1} of ${def.stages.length}</small><h4>${esc(def.label)}</h4></header>
            <ol class="mw-arc-path">${def.stages.map((s, i) => `<li class="${i < stage ? 'is-past' : i === stage ? 'is-now' : ''}"><i aria-hidden="true"></i><span>${esc(s)}</span></li>`).join('')}</ol>
            ${now.away ? `<p class="mw-fine">The story has turned away from it ${now.away === 1 ? 'once' : 'twice'} in a row; a third time and it fizzles out.</p>` : ''}
            <div class="mw-card-actions"><button type="button" data-action="arc-hold" aria-pressed="${held}">${held ? '\u25c6 Held here' : 'Hold here'}</button><button type="button" data-action="arc-next">Move on \u203a</button><button type="button" data-action="arc-end">End</button></div>${behind}</section>`;
    }
    if (offer) return `<section class="mw-arc is-offer"><p>The story looks like it\u2019s starting an arc: <b>${esc(offer.label.toLowerCase())}</b>.</p>
        <div class="mw-card-actions"><button type="button" class="mw-primary" data-arc-start="${offer.id}">Follow it</button><button type="button" data-arc-skip="${offer.id}">Not this one</button></div>${behind}</section>`;
    return `<section class="mw-arc is-quiet"><button type="button" class="mw-arc-open" data-action="arc-pick" aria-expanded="${Boolean(ui.arcPick)}">\u2726 Start an arc</button>
        ${ui.arcPick ? `<div class="mw-card-chips">${ARCS.map(a => `<button type="button" class="mw-card-chip is-on" data-arc-start="${a.id}">${esc(a.label)}</button>`).join('')}</div><p class="mw-fine">It moves on only when the story gets to each stage.</p>` : ''}${behind}</section>`;
}
