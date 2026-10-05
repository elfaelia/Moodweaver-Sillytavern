import { escapeHtml as esc, level, KNOWLEDGE_MODES, knowledgeEntry } from './core.js';
import { RELATIONSHIP_CATEGORIES, RELATIONSHIP_BY_ID, activeRelationshipTags, relationshipKey, relationshipCue } from './relationships.js';

const initial = name => esc((String(name).trim()[0] ?? '?').toUpperCase());
const KNOW_LABELS = ['Scene only', 'Private', 'Suspected', 'Known'];

// Sims-style list of everyone else, then the selected pairing's sliders underneath.
export function relationshipView({ subject, peers, selectedKey, relation, knowledge, isPlayer, focus, openGroups, swapLabel, removing }) {
    const selected = peers.find(p => p.key === selectedKey) ?? peers[0];
    const list = peers.map(p => {
        const tags = p.relation ? activeRelationshipTags(p.relation) : [];
        const summary = tags.slice(0, 3).map(t => `${esc(t.label)} <em>${level(p.relation.moods[t.id]).toLowerCase()}</em>`).join(' · ');
        return `<button class="mw-peer ${p.key === selected?.key ? 'is-selected' : ''} ${p.offScene ? 'is-away' : ''}" data-peer="${esc(p.key)}" aria-pressed="${p.key === selected?.key}">
            <span class="mw-avatar">${initial(p.name)}</span><span class="mw-peer-text"><b>${esc(p.name)}</b><small>${esc(p.role)}${p.relation?.enabled === false ? ' · paused' : ''}</small>
            <span class="mw-peer-tags">${summary || '<i>Nothing set yet</i>'}${tags.length > 3 ? ` · +${tags.length - 3}` : ''}</span></span></button>`;
    }).join('');
    const add = `<div class="mw-cast-add mw-peer-add"><input type="text" data-relation-new maxlength="80" aria-label="Someone not listed" placeholder="Someone not listed…"><button data-action="relation-add">＋ Add</button></div>`;
    if (!selected) return `<div class="mw-rel"><p class="mw-explainer">Nobody else is here yet. Add a cast member above, or type a name.</p>${add}</div>`;
    const values = relation?.moods ?? {};
    const groups = RELATIONSHIP_CATEGORIES.map(([category, icon, color, rows]) => {
        const on = rows.filter(([id]) => values[id] > 0).length;
        return `<details data-relation-group="${esc(category)}" style="--mw-accent:${color}" ${openGroups.has(category) ? 'open' : ''}><summary><span class="mw-category-icon">${icon}</span><span>${category}</span><small>${on ? `${on} active` : rows.length}</small></summary><div class="mw-category-body">${rows.map(([id, label]) => {
            const value = values[id] ?? 0, entry = relation ? knowledgeEntry(knowledge[relationshipKey(relation, id)]) : knowledgeEntry();
            return `<div class="mw-mood" data-relation-row="${id}"><div class="mw-row-head"><label for="mw-rel-${id}">${esc(label)}</label><span data-rel-level="${id}">${level(value)}</span><output for="mw-rel-${id}" data-rel-value="${id}">${value}%</output></div>
                <input id="mw-rel-${id}" type="range" min="0" max="100" step="1" value="${value}" data-rel-slider="${id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
                <small>${esc(relationshipCue(RELATIONSHIP_BY_ID[id], value || 50))}</small>
                ${isPlayer && value ? `<label class="mw-rel-knowledge">What ${esc(focus)} knows<select data-rel-knowledge="${id}" aria-label="What ${esc(focus)} knows: ${esc(label)}">${KNOWLEDGE_MODES.map((mode, i) => `<option value="${mode}" ${entry.mode === mode ? 'selected' : ''}>${KNOW_LABELS[i]}</option>`).join('')}</select></label>` : ''}</div>`;
        }).join('')}</div></details>`;
    }).join('');
    return `<div class="mw-rel">
        <div class="mw-peers" role="list">${list}</div>${add}
        <div class="mw-pair">
            <div class="mw-pair-head"><div><span class="mw-eyebrow">HOW ${esc(subject.toUpperCase())} FEELS ABOUT</span><h3>${esc(selected.name)}</h3></div>
                ${swapLabel ? `<button data-action="rel-swap" title="Switch to their side of this relationship">⇄ ${esc(swapLabel)}</button>` : ''}</div>
            <p class="mw-fine">Only ${esc(subject)}’s side. ${esc(selected.name)} doesn’t feel the same unless you set it on their side too.${isPlayer ? ` You still write ${esc(subject)}; each feeling also has a “what ${esc(focus)} knows” choice.` : ''}</p>
            ${relation ? `<div class="mw-cast-presence"><label class="mw-toggle"><input type="checkbox" data-relation-enabled ${relation.enabled !== false ? 'checked' : ''}> Send this relationship</label><button data-action="relation-remove">Clear</button></div>` : ''}
            ${removing ? `<div class="mw-cast-confirm"><p class="mw-fine">Clear everything ${esc(subject)} feels about ${esc(selected.name)}?</p><div class="mw-actions"><button data-action="relation-remove-confirm">Clear it</button><button data-action="relation-cancel">Keep it</button></div></div>` : ''}
            <input type="search" data-relation-search placeholder="Find a feeling or status…" aria-label="Search relationship feelings">
            <div class="mw-categories mw-relation-groups">${groups}</div>
        </div></div>`;
}
