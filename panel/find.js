// Search everything: one box (the ⌕ at the top) that looks through every tab at once (feelings, traits, Mind,
// Intimacy, facts, story settings, turn-ons, skills, dynamics and relationship tags) and takes you to the one
// you tap, opening its tab and its group. Typing only redraws the list under the box.
import { MOODS, sectionOf } from '../data/catalogue.js';
import { DYNAMICS } from '../data/catalogue/dynamics.js';
import { TURN_TAGS } from '../engine/turns.js';
import { SKILL_BY_ID } from '../engine/skills.js';
import { RELATIONSHIP_TAGS, SHARED_TAGS } from '../engine/relationships.js';
import { fill } from '../engine/dynamics.js';
import { PERIOD } from '../data/catalogue/period.js';
import { escapeHtml as esc } from '../engine/util.js';
import { ui } from '../app/state.js';

const PLACE = { mood: 'Moods', trait: 'Traits', psyche: 'Mind', intimacy: 'Intimacy', state: 'Facts', story: 'Story' };
let index = null;
function build() {
    const out = [];
    for (const m of MOODS) out.push({ label: m.label, cue: m.cue ?? '', where: PLACE[sectionOf(m)] ?? 'Moods', go: `m:${m.id}` });
    for (const t of TURN_TAGS) out.push({ label: t.label ?? t.noun ?? t.id, cue: t.cue ?? '', where: 'Turn-ons', go: `turn:${t.id}` });
    for (const s of Object.values(SKILL_BY_ID)) out.push({ label: s.label, cue: s.cue ?? '', where: 'Skills', go: `skill:${s.id}` });
    for (const d of DYNAMICS) out.push({ label: fill(d[0], 'them', 'you'), cue: d[4] ?? '', where: 'Dynamics', go: `dyn:${d[0]}` });
    for (const l of PERIOD) out.push({ label: l.label, cue: (l.she ?? l.he ?? l.any ?? '').replace(/\{(who|other)\}/g, 'them').replace(/\{age\}/g, 'their age'), where: 'Period', go: `period:${l.id}` });
    const seen = new Set();
    for (const t of [...RELATIONSHIP_TAGS, ...SHARED_TAGS]) { if (seen.has(t.label)) continue; seen.add(t.label); out.push({ label: t.label, cue: t.cue ?? '', where: 'Relationships', go: `rel:${t.label}` }); }
    return out.map(e => ({ ...e, low: e.label.toLowerCase(), cueLow: String(e.cue).toLowerCase() }));
}
export function findResults(q) {
    const term = q.trim().toLowerCase(); if (term.length < 2) return [];
    index ??= build();
    const score = e => e.low.startsWith(term) ? 3 : e.low.split(/\W+/).some(w => w.startsWith(term)) ? 2 : e.low.includes(term) ? 1.5 : e.cueLow.includes(term) ? 1 : 0;
    return index.map(e => [e, score(e)]).filter(([, s]) => s).sort((a, b) => b[1] - a[1] || a[0].label.length - b[0].label.length).slice(0, 40).map(([e]) => e);
}
export function findList(q) {
    const hits = findResults(q);
    if (!q.trim()) return '<p class="mw-fine">Type a word, like jealous, liar, affair or doctor.</p>';
    if (!hits.length) return '<p class="mw-fine">Nothing matches that yet.</p>';
    return hits.map(e => `<button type="button" class="mw-find-hit" data-find-go="${esc(e.go)}"><b>${esc(e.label)}</b><small>${esc(e.where)}</small>${e.cue ? `<span>${esc(e.cue)}</span>` : ''}</button>`).join('');
}
export function findView() {
    if (!ui.findOpen) return '';
    return `<div class="mw-find" role="search"><input type="search" data-find placeholder="Search every tab…" aria-label="Search every tab" value="${esc(ui.findText ?? '')}">
        <div class="mw-find-list" data-find-list>${findList(ui.findText ?? '')}</div></div>`;
}
