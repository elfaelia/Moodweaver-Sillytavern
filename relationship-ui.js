import { escapeHtml as esc, level, KNOWLEDGE_MODES, knowledgeEntry } from './core.js';
import { RELATIONSHIP_CATEGORIES, activeRelationshipTags, relationshipKey, relationshipCue } from './relationships.js';

export function relationshipPanel(state, { subject, focus, player, names, selectedId, knowledge, isPlayer, remove, openGroups }) {
    const list = state.relationships ?? [];
    const selected = list.find(r => r.id === selectedId) ?? list[0];
    const display = name => name.replaceAll('{{char}}', focus).replaceAll('{{user}}', player);
    const count = list.filter(r => r.enabled !== false).reduce((n, r) => n + activeRelationshipTags(r).length, 0);
    return `<details class="mw-relationships"><summary>Relationships <small>${count ? `${count} active` : 'How they feel about someone'}</small></summary>
        <p class="mw-fine">${esc(subject)} → someone else. Give each person a separate blend. These feelings mix with ${esc(subject)}’s other settings; the other person doesn’t automatically feel the same.</p>
        <div class="mw-cast-add"><input type="text" data-relation-new list="mw-relationship-names" maxlength="80" aria-label="Relationship with whom" placeholder="Choose or type a name"><button data-action="relation-add">＋ Add</button></div>
        <datalist id="mw-relationship-names">${names.filter(n => n.toLowerCase() !== subject.toLowerCase()).map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>
        ${selected ? `<label class="mw-cast-picker">${esc(subject)}’s feelings toward<select data-relation-select>${list.map(r => `<option value="${esc(r.id)}" ${r.id === selected.id ? 'selected' : ''}>${esc(display(r.target))} · ${activeRelationshipTags(r).length} active${r.enabled === false ? ' · paused' : ''}</option>`).join('')}</select></label>
        <div class="mw-cast-presence"><label class="mw-toggle"><input type="checkbox" data-relation-enabled ${selected.enabled !== false ? 'checked' : ''}> Send this relationship</label><button data-action="relation-remove">Remove</button></div>
        ${remove ? `<div class="mw-cast-confirm"><p class="mw-fine">Remove ${esc(subject)} → ${esc(display(selected.target))} and its sliders?</p><div class="mw-actions"><button data-action="relation-remove-confirm">Remove pairing</button><button data-action="relation-cancel">Keep it</button></div></div>` : ''}
        <details class="mw-cast-edit"><summary>Change who this is about</summary><div class="mw-cast-add"><input type="text" data-relation-target maxlength="80" list="mw-relationship-names" value="${esc(selected.target)}" aria-label="Relationship target"><button data-action="relation-rename">Save name</button></div></details>
        ${isPlayer ? `<p class="mw-fine">You still write ${esc(subject)}. Each active feeling also has a knowledge choice for ${esc(focus)}: Scene only, Private, Suspected or Known.</p>` : ''}
        <p class="mw-fine">Same strength scale as moods. Saved with this person’s chat settings and defaults. Cast members marked off scene pause relationships involving them.</p>
        <input type="search" data-relation-search placeholder="Find a relationship feeling…" aria-label="Search relationship tags">
        <div class="mw-relation-groups">${RELATIONSHIP_CATEGORIES.map(([category, icon, color, rows]) => `<details data-relation-group="${esc(category)}" style="--mw-accent:${color}" ${openGroups.has(category) ? 'open' : ''}><summary><span>${icon}</span> ${category}<small>${rows.filter(([id]) => selected.moods[id] > 0).length || ''}</small></summary>${rows.map(([id, label, cue]) => {
            const value = selected.moods[id] ?? 0;
            const key = relationshipKey(selected, id), entry = knowledgeEntry(knowledge[key]);
            return `<div class="mw-mood" data-relation-row="${id}"><div class="mw-row-head"><label for="mw-rel-${id}">${label}</label><span data-rel-level="${id}">${level(value)}</span><output for="mw-rel-${id}" data-rel-value="${id}">${value}%</output></div>
                <input id="mw-rel-${id}" type="range" min="0" max="100" step="1" value="${value}" data-rel-slider="${id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
                <small>${esc(relationshipCue({ id, cue }, value || 50))}</small>
                ${isPlayer && value ? `<label class="mw-rel-knowledge">What ${esc(focus)} knows<select data-rel-knowledge="${id}" aria-label="What ${esc(focus)} knows: ${label}">${KNOWLEDGE_MODES.map((mode, i) => `<option value="${mode}" ${entry.mode === mode ? 'selected' : ''}>${['Scene only', 'Private', 'Suspected', 'Known'][i]}</option>`).join('')}</select></label>` : ''}</div>`;
        }).join('')}</details>`).join('')}</div>` : '<p class="mw-fine">Add a person to see the relationship sliders. You can add several people and switch between them here.</p>'}
    </details>`;
}
