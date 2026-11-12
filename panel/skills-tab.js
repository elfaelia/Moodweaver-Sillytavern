// The Skills tab.
import { subjectName } from '../app/chat.js';
import { skillScene } from '../app/note.js';
import { liveChat } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { ui } from '../app/state.js';
import { escapeHtml as esc } from '../engine/util.js';
import { fillLazy, searchText } from './render.js';
import { SKILL_BY_ID, SKILL_GROUPS, SKILL_PACE, cleanPins, cleanSkillPace, cleanSkills, litSkills, skillProgress, skillWord, skillsOf } from '../engine/skills.js';

export function skillsView(state, ch) {
    const whose = esc(subjectName()), set = cleanSkills(state.skills), pins = cleanPins(state.skillPins), pace = cleanSkillPace(state.skillPace);
    const { scene, used } = skillScene(ch, liveChat()), going = litSkills(state, scene, used), lit = new Map(going.map(x => [x.id, x.why]));
    const why = { used: 'Used in the last reply', scene: 'The scene calls for it' };
    const row = s => { const value = set[s.id] ?? 0, pinned = Boolean(pins[s.id]), prog = skillProgress(state, s.id);
        return `<div class="mw-mood mw-skill-row ${lit.has(s.id) ? 'is-lit' : ''}" data-skill-row="${s.id}" data-search="${esc(`${s.label} ${s.cue}`)}">
        <div class="mw-row-head"><label for="mw-skill-${s.id}">${lit.has(s.id) ? '✧ ' : ''}${esc(s.label)}</label><span data-skill-word>${value ? skillWord(value) : 'off'}</span><output for="mw-skill-${s.id}">${value}/10</output>
            ${value ? `<button type="button" class="mw-need-pin" data-skill-pin="${s.id}" aria-pressed="${pinned}" title="${pinned ? 'Unpin: let it grow and slip with use again' : 'Pin: hold it at this level'}" aria-label="${pinned ? `Unpin ${esc(s.label)}` : `Pin ${esc(s.label)}`}">${pinned ? '◆' : '◇'}</button>` : ''}</div>
        <input id="mw-skill-${s.id}" type="range" min="0" max="10" step="1" value="${value}" data-skill="${s.id}" style="--mw-fill:${value * 10}%" aria-valuetext="${value} out of 10, ${value ? skillWord(value) : 'off'}">
        <small>${esc(s.cue)}${prog ? ` · ${prog[0]}/${prog[1]} uses to ${value + 1}` : ''}${lit.has(s.id) ? ` · <b>${why[lit.get(s.id)]}</b>` : ''}</small></div>`; };
    const chips = skillsOf(state).map(x => `<button type="button" data-skill-jump="${x.id}" class="mw-chip ${lit.has(x.id) ? 'is-lit' : ''}" style="--mw-accent:${SKILL_BY_ID[x.id].color}" title="${lit.has(x.id) ? `${why[lit.get(x.id)]}. ` : ''}Adjust ${esc(x.label)}"><span>${lit.has(x.id) ? '✧ ' : ''}${x.pinned ? '◆ ' : ''}${esc(x.label)}</span><b>${x.level}</b><i style="width:${x.level * 10}%"></i></button>`).join('');
    // Folded groups are drawn when opened (fillLazy), like the long lists on other tabs.
    const groups = SKILL_GROUPS.map(g => { const on = g.rows.filter(r => set[r.id]).length, key = `skills-${g.name}`, open = ui.openGroups?.[`details[data-skill-group="${CSS.escape(g.name)}"]`];
        ui.lazyBodies.set(key, () => g.rows.map(row).join(''));
        return `<details data-skill-group="${esc(g.name)}" style="--mw-accent:${g.color}"><summary><span class="mw-category-icon">${g.icon}</span><span>${esc(g.name)}</span><small>${on ? `${on} set` : g.rows.length}</small></summary><div class="mw-category-body" ${open ? '' : `data-lazy="${esc(key)}"`}>${open ? g.rows.map(row).join('') : ''}</div></details>`; }).join('');
    return `<div class="mw-summary"><div class="mw-section-label">${chips ? 'Skills' : 'No skills yet'}<span>${skillsOf(state).length} set</span></div>
        <div class="mw-chips">${chips || `<p>Nothing set. Pick the skills ${whose} has and a level out of 10.</p>`}</div>
        <p class="mw-skill-now">${going.length ? `Going to Claude this reply: ${going.map(x => `${esc(x.label)} ${x.level}`).join(', ')}` : 'None going to Claude this reply. Each one waits until the scene calls for it.'}</p></div>
    <p class="mw-explainer">A skill only reaches Claude when the scene calls for it: its words turn up in your latest message or the last reply, or Claude says it was used. Then its level decides how attempts go, yours included. Skills you’ve set also grow slowly with use and slip after long disuse; ◆ pins one where it is. ✧ means it’s going this reply.</p>
    <div class="mw-skill-opts"><label class="mw-field">Growth<select data-skill-pace aria-label="How fast skills grow and slip">${Object.entries(SKILL_PACE).map(([k, p]) => `<option value="${k}" ${pace === k ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}</select></label>
        <label class="mw-field">Look back<select data-skill-lookback aria-label="How far back skills look">${[[1, 'Your message + the last reply'], [2, '+ the last 2 replies'], [3, '+ the last 3 replies']].map(([v, l]) => `<option value="${v}" ${settings().skillLookback === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <input type="search" data-skill-search placeholder="Find a skill…" aria-label="Search skills">
    <div class="mw-categories">${groups}</div>
    <p class="mw-fine" data-skill-empty hidden>No matching skills.</p>`;
}
export function filterSkills() {
    const input = ui.panel?.querySelector('[data-skill-search]'); if (!input) return;
    const term = input.value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (term) fillLazy(ui.panel);
    let shown = 0;
    ui.panel.querySelectorAll('[data-skill-group]').forEach(group => {
        let visible = 0;
        group.querySelectorAll('[data-skill-row]').forEach(row => { row.hidden = Boolean(term) && !searchText(row).includes(term); if (!row.hidden) visible++; });
        group.hidden = Boolean(term) && !visible; if (term) group.open = visible > 0; shown += visible;
    });
    const none = ui.panel.querySelector('[data-skill-empty]'); if (none) none.hidden = !term || shown > 0;
}
