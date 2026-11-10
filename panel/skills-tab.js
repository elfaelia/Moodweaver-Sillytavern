// The Skills tab.
import { subjectName } from '../app/chat.js';
import { skillScene } from '../app/note.js';
import { liveChat } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { ui } from '../app/state.js';
import { escapeHtml as esc } from '../engine/util.js';
import { searchText } from './render.js';
import { SKILL_BY_ID, SKILL_CATEGORIES, cleanAlways, cleanSkills, litSkills, skillWord, skillsOf } from '../engine/skills.js';

export function skillsView(state, ch) {
    const whose = esc(subjectName()), set = cleanSkills(state.skills), always = cleanAlways(state.skillAlways);
    const { scene, used } = skillScene(ch, liveChat()), going = litSkills(state, scene, used), lit = new Map(going.map(x => [x.id, x.why]));
    const why = { always: 'Sent every reply', used: 'Used in the last reply', scene: 'The scene calls for it' };
    const row = (id, label, cue, from, value) => `<div class="mw-mood mw-skill-row ${lit.has(id) ? 'is-lit' : ''}" data-skill-row="${id}" data-search="${esc(`${label} ${cue} ${from}`)}">
        <div class="mw-row-head"><label for="mw-skill-${id}">${lit.has(id) ? '✧ ' : ''}${esc(label)}</label><span data-skill-word>${value ? skillWord(value) : 'off'}</span><output for="mw-skill-${id}">${value}/10</output>
            <button type="button" class="mw-need-pin" data-skill-always="${id}" aria-pressed="${Boolean(always[id])}" title="${always[id] ? 'Stop sending it every reply' : 'Send it every reply, called for or not'}" aria-label="${always[id] ? `Stop always sending ${esc(label)}` : `Always send ${esc(label)}`}">${always[id] ? '◆' : '◇'}</button></div>
        <input id="mw-skill-${id}" type="range" min="0" max="10" step="1" value="${value}" data-skill="${id}" style="--mw-fill:${value * 10}%" aria-valuetext="${value} out of 10, ${value ? skillWord(value) : 'off'}">
        <small>${esc(cue)}${from ? ` · ${esc(from)}` : ''}${lit.has(id) ? ` · <b>${why[lit.get(id)]}</b>` : ''}</small></div>`;
    const chips = skillsOf(state).map(x => `<button type="button" data-skill-jump="${x.id}" class="mw-chip ${lit.has(x.id) ? 'is-lit' : ''}" style="--mw-accent:${SKILL_BY_ID[x.id]?.color ?? '#9fc0e8'}" title="${lit.has(x.id) ? `${why[lit.get(x.id)]}. ` : ''}Adjust ${esc(x.label)}"><span>${lit.has(x.id) ? '✧ ' : ''}${x.always ? '◆ ' : ''}${esc(x.label)}</span><b>${x.level}</b><i style="width:${x.level * 10}%"></i></button>`).join('');
    const groups = SKILL_CATEGORIES.map(([name, icon, color, rows]) => { const on = rows.filter(([id]) => set[id]).length;
        return `<details data-skill-group="${esc(name)}" style="--mw-accent:${color}"><summary><span class="mw-category-icon">${icon}</span><span>${esc(name)}</span><small>${on ? `${on} set` : rows.length}</small></summary><div class="mw-category-body">${rows.map(([id, label, cue, from]) => row(id, label, cue, from, set[id] ?? 0)).join('')}</div></details>`; }).join('');
    return `<div class="mw-summary"><div class="mw-section-label">${chips ? 'Skills' : 'No skills yet'}<span>${skillsOf(state).length} set</span></div>
        <div class="mw-chips">${chips || `<p>Nothing set. Pick a level out of 10 for anything ${whose} can do.</p>`}</div>
        <p class="mw-skill-now">${going.length ? `Going to Claude this reply: ${going.map(x => `${esc(x.label)} ${x.level}`).join(', ')}` : 'None going to Claude this reply. Each one waits until the scene calls for it.'}</p></div>
    <p class="mw-explainer">A skill only reaches Claude when the scene calls for it: its words turn up in your latest message or the last reply, or Claude says it was used. Then its level decides how attempts go, yours included. ◆ sends one every reply; ✧ means it’s going this reply.</p>
    <div class="mw-skill-opts"><label class="mw-field">Look back<select data-skill-lookback aria-label="How far back skills look">${[[1, 'Your message + the last reply'], [2, '+ the last 2 replies'], [3, '+ the last 3 replies']].map(([v, l]) => `<option value="${v}" ${settings().skillLookback === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <input type="search" data-skill-search placeholder="Find a skill…" aria-label="Search skills">
    <div class="mw-categories">${groups}</div>
    <p class="mw-fine" data-skill-empty hidden>No matching skills.</p>`;
}
export function filterSkills() {
    const input = ui.panel?.querySelector('[data-skill-search]'); if (!input) return;
    const term = input.value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let shown = 0;
    ui.panel.querySelectorAll('[data-skill-group]').forEach(group => {
        let visible = 0;
        group.querySelectorAll('[data-skill-row]').forEach(row => { row.hidden = Boolean(term) && !searchText(row).includes(term); if (!row.hidden) visible++; });
        group.hidden = Boolean(term) && !visible; if (term) group.open = visible > 0; shown += visible;
    });
    const none = ui.panel.querySelector('[data-skill-empty]'); if (none) none.hidden = !term || shown > 0;
}
