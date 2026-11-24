// Search everything: one box (the \u2315 at the top) that looks through every tab at once (feelings, traits, Mind,
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
import { settings } from '../app/settings.js';

const PLACE = { mood: 'Moods', trait: 'Traits', psyche: 'Mind', intimacy: 'Intimacy', state: 'Facts', story: 'Story' };
let index = null;
function build() {
    const out = [];
    for (const m of MOODS.filter(x => !x.size)) out.push({ label: m.label, cue: m.cue ?? '', where: PLACE[sectionOf(m)] ?? 'Moods', go: `m:${m.id}`, cat: m.category });
    for (const t of TURN_TAGS) out.push({ label: t.label ?? t.noun ?? t.id, cue: t.cue ?? '', where: 'Turn-ons', go: `turn:${t.id}` });
    for (const s of Object.values(SKILL_BY_ID)) out.push({ label: s.label, cue: s.cue ?? '', where: 'Skills', go: `skill:${s.id}` });
    for (const d of DYNAMICS) out.push({ label: fill(d[0], 'them', 'you'), cue: d[4] ?? '', where: 'Dynamics', go: `dyn:${d[0]}` });
    // Period lines name the person ({who}) and the other ({other}); in a search result they read as "the woman",
    // "the man" or "this person", which fits any grammar the line uses ("If {who} is caught", "{who}'s husband").
    for (const l of PERIOD) { const [text, who] = l.she ? [l.she, 'the woman'] : l.he ? [l.he, 'the man'] : [l.any ?? '', 'this person'];
        out.push({ label: l.label, cue: text.replace(/\{who\}/g, who).replace(/\{other\}/g, 'the other').replace(/\{age\}/g, 'their age').replace(/^the /, 'The '), where: 'Period', go: `period:${l.id}` }); }
    const seen = new Set();
    for (const t of [...RELATIONSHIP_TAGS, ...SHARED_TAGS]) { if (seen.has(t.label)) continue; seen.add(t.label); out.push({ label: t.label, cue: t.cue ?? '', where: 'Relationships', go: `rel:${t.label}` }); }
    return out.map(e => ({ ...e, low: e.label.toLowerCase(), cueLow: String(e.cue).toLowerCase() }));
}
const ORDER = ['Moods', 'Traits', 'Mind', 'Intimacy', 'Facts', 'Turn-ons', 'Skills', 'Relationships', 'Dynamics', 'Story', 'Period'];
export function findResults(q) {
    const term = q.trim().toLowerCase(); if (term.length < 2) return [];
    index ??= build();
    const score = e => e.low.startsWith(term) ? 3 : e.low.split(/\W+/).some(w => w.startsWith(term)) ? 2 : e.low.includes(term) ? 1.5 : e.cueLow.includes(term) ? 1 : 0;
    const hidden = new Set(settings().hiddenGroups ?? []);
    return index.filter(e => !e.cat || !hidden.has(e.cat)).map(e => ({ ...e, score: score(e) })).filter(e => e.score).sort((a, b) => b.score - a.score || a.label.length - b.label.length).slice(0, 60);
}
// Results come grouped by tab: the tab with the best match first, at most six a tab (the best ones), each with a
// heading, so the same word under Story, Relationships and Period reads as three places rather than three repeats.
export function findList(q) {
    if (!q.trim()) return '<p class="mw-fine">Type a word, like jealous, liar, affair or doctor.</p>';
    const hits = findResults(q);
    if (!hits.length) return '<p class="mw-fine">Nothing matches that yet.</p>';
    const groups = new Map();
    for (const e of hits) { if (!groups.has(e.where)) groups.set(e.where, []); groups.get(e.where).push(e); }
    const best = list => Math.max(...list.map(e => e.score));
    return [...groups].sort(([a, x], [b, y]) => best(y) - best(x) || ORDER.indexOf(a) - ORDER.indexOf(b)).map(([where, list]) =>
        `<section class="mw-find-group"><h5>${esc(where)}${list.length > 6 ? ` <small>${list.length}</small>` : ''}</h5>${list.slice(0, 6).map(e =>
            `<button type="button" class="mw-find-hit" data-find-go="${esc(e.go)}"><b>${esc(e.label)}</b>${e.cue ? `<span>${esc(e.cue)}</span>` : ''}</button>`).join('')}</section>`).join('');
}
export function findView() {
    if (!ui.findOpen) return '';
    return `<div class="mw-find" role="search"><input type="search" data-find placeholder="Search every tab\u2026" aria-label="Search every tab" value="${esc(ui.findText ?? '')}">
        <div class="mw-find-list" data-find-list>${findList(ui.findText ?? '')}</div></div>`;
}
