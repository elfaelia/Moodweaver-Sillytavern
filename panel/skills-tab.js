// The Skills tab.
import { subjectName } from '../app/chat.js';
import { panelSkillContext, skillScene } from '../app/note.js';
import { liveChat } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { ui } from '../app/state.js';
import { escapeHtml as esc } from '../engine/util.js';
import { fillLazy, searchText } from './render.js';
import { SKILL_BY_ID, SKILL_GROUPS, SKILL_PACE, cleanPins, cleanSkillPace, cleanSkills, litSkills, skillProgress, skillWord, skillsOf } from '../engine/skills.js';

export function skillsView(state, ch) {
    const whose = esc(subjectName()), set = cleanSkills(state.skills), pins = cleanPins(state.skillPins), pace = cleanSkillPace(state.skillPace);
    const { scene, used } = skillScene(ch, liveChat()), going = litSkills(state, scene, used, 5, panelSkillContext(ch)), lit = new Map(going.map(x => [x.id, x.why]));
    const why = { used: 'Used in the last reply', scene: 'The scene calls for it', context: 'Fits what’s happening' };
    // Ten taps instead of a slider: tap a level to set it, tap the one it's at to take the skill off.
    const pips = (s, value) => `<div class="mw-pips" role="group" aria-label="${esc(s.label)} level">${Array.from({ length: 10 }, (_, i) => i + 1).map(v => `<button type="button" class="mw-pip ${v <= value ? 'is-lit' : ''} ${v === value ? 'is-now' : ''}" data-skill-set="${s.id}" data-v="${v}" aria-pressed="${v === value}" aria-label="${v}, ${skillWord(v)}" title="${v}: ${skillWord(v)}${v === value ? ' (tap again to remove)' : ''}">${v}</button>`).join('')}</div>`;
    const row = s => { const value = set[s.id] ?? 0, pinned = Boolean(pins[s.id]), prog = skillProgress(state, s.id);
        return `<div class="mw-mood mw-skill-row ${lit.has(s.id) ? 'is-lit' : ''} ${value ? 'is-set' : ''}" data-skill-row="${s.id}" data-search="${esc(`${s.label} ${s.cue}`)}">
        <div class="mw-row-head"><label>${lit.has(s.id) ? '✧ ' : ''}${esc(s.label)}</label><span data-skill-word>${value ? `${skillWord(value)} · ${value}/10` : 'not theirs'}</span>
            ${value ? `<button type="button" class="mw-need-pin" data-skill-pin="${s.id}" aria-pressed="${pinned}" title="${pinned ? 'Unpin: let it grow and slip with use again' : 'Pin: hold it at this level'}" aria-label="${pinned ? `Unpin ${esc(s.label)}` : `Pin ${esc(s.label)}`}">${pinned ? '◆' : '◇'}</button>` : ''}</div>
        ${pips(s, value)}
        <small>${esc(s.cue)}${prog ? ` · ${prog[0]}/${prog[1]} uses to ${value + 1}` : ''}${lit.has(s.id) ? ` · <b>${why[lit.get(s.id)]}</b>` : ''}</small></div>`; };
    const chips = skillsOf(state).map(x => `<button type="button" data-skill-jump="${x.id}" class="mw-chip ${lit.has(x.id) ? 'is-lit' : ''}" style="--mw-accent:${SKILL_BY_ID[x.id].color}" title="${lit.has(x.id) ? `${why[lit.get(x.id)]}. ` : ''}Adjust ${esc(x.label)}"><span>${lit.has(x.id) ? '✧ ' : ''}${x.pinned ? '◆ ' : ''}${esc(x.label)}</span><b>${x.level}</b><i style="width:${x.level * 10}%"></i></button>`).join('');
    // Their own list shows only the skills they have, open. "＋ Add skills" opens the whole catalogue, folded
    // by group and drawn when a group is opened (fillLazy), like the long lists on other tabs.
    const browsing = ui.browsing;
    const groups = SKILL_GROUPS.map(g => { const mine = g.rows.filter(r => set[r.id]), on = mine.length, key = `skills-${g.name}`, open = ui.openGroups?.[`details[data-skill-group="${CSS.escape(g.name)}"]`];
        if (!browsing) return on ? `<div class="mw-skill-mine" data-skill-group="${esc(g.name)}" style="--mw-accent:${g.color}"><h5 class="mw-subhead"><span class="mw-category-icon">${g.icon}</span> ${esc(g.name)}</h5>${mine.map(row).join('')}</div>` : '';
        ui.lazyBodies.set(key, () => g.rows.map(row).join(''));
        return `<details data-skill-group="${esc(g.name)}" style="--mw-accent:${g.color}"><summary><span class="mw-category-icon">${g.icon}</span><span>${esc(g.name)}</span><small>${on ? `${on} of ${g.rows.length}` : g.rows.length}</small></summary><div class="mw-category-body" ${open ? '' : `data-lazy="${esc(key)}"`}>${open ? g.rows.map(row).join('') : ''}</div></details>`; }).join('');
    return `<div class="mw-summary"><div class="mw-section-label">${chips ? 'Skills' : 'No skills yet'}<span>${skillsOf(state).length} set</span></div>
        <div class="mw-chips">${chips || `<p>Nothing set. Tap “＋ Add skills” and pick what ${whose} can do.</p>`}</div>
        <p class="mw-skill-now">${going.length ? `Going to Claude this reply: ${going.map(x => `${esc(x.label)} ${x.level}`).join(', ')}` : 'None this reply: skills go when the scene calls for them.'}</p></div>
    <div class="mw-tools"><input type="search" class="mw-search" data-skill-search placeholder="${browsing ? 'Search all skills…' : `Search ${whose}’s skills…`}" aria-label="Search skills">${browsing ? '<button data-action="browse-done" class="mw-primary">✓ Done</button>' : '<button data-action="browse" class="mw-primary">＋ Add skills</button>'}</div>
    ${browsing ? `<p class="mw-explainer">Tap a number to give ${whose} the skill at that level. Tap the lit number again to take it away.</p>` : `<p class="mw-explainer">Sent only when the scene calls for one. ✧ means it’s in play this reply. Skills grow slowly with use; ◆ pins one.</p>`}
    <div class="mw-categories">${groups || `<p class="mw-explainer mw-empty-list">Nothing on ${whose}’s list yet. Tap “＋ Add skills”.</p>`}</div>
    <p class="mw-fine" data-skill-empty hidden>No matching skills.</p>
    ${browsing ? '' : `<div class="mw-skill-opts"><label class="mw-field">Growth<select data-skill-pace aria-label="How fast skills grow and slip">${Object.entries(SKILL_PACE).map(([k, p]) => `<option value="${k}" ${pace === k ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}</select></label>
        <label class="mw-field">Look back<select data-skill-lookback aria-label="How far back skills look">${[[1, 'Your message + the last reply'], [2, '+ the last 2 replies'], [3, '+ the last 3 replies']].map(([v, l]) => `<option value="${v}" ${settings().skillLookback === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>`}`;
}
export function filterSkills() {
    const input = ui.panel?.querySelector('[data-skill-search]'); if (!input) return;
    const term = input.value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (term) fillLazy(ui.panel);
    let shown = 0;
    ui.panel.querySelectorAll('[data-skill-group]').forEach(group => {
        let visible = 0;
        group.querySelectorAll('[data-skill-row]').forEach(row => { row.hidden = Boolean(term) && !searchText(row).includes(term); if (!row.hidden) visible++; });
        group.hidden = Boolean(term) && !visible; if (term && group.tagName === 'DETAILS') group.open = visible > 0; shown += visible;
    });
    const none = ui.panel.querySelector('[data-skill-empty]'); if (none) none.hidden = !term || shown > 0;
}
