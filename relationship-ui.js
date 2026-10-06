import { escapeHtml as esc, level, KNOWLEDGE_MODES, knowledgeEntry } from './core.js';
import { RELATIONSHIP_CATEGORIES, SHARED_CATEGORIES, RELATIONSHIP_BY_ID, SHARED_BY_ID, activeRelationshipTags, activeSharedTags, relationshipKey, relationshipCue } from './relationships.js';

const initial = name => esc((String(name).trim()[0] ?? '?').toUpperCase());
const KNOW_LABELS = ['Scene only', 'Private', 'Suspected', 'Known'];
const sliderRow = (attr, id, label, cue, value, extra = '') => `<div class="mw-mood" data-relation-row="${id}"><div class="mw-row-head"><label for="mw-${attr}-${id}">${esc(label)}</label><span data-lvl>${level(value)}</span><output for="mw-${attr}-${id}">${value}%</output></div>
    <input id="mw-${attr}-${id}" type="range" min="0" max="100" step="1" value="${value}" data-${attr}="${id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
    <small>${esc(cue)}</small>${extra}</div>`;
const groupsHtml = (cats, values, openGroups, row) => cats.map(([category, icon, color, rows]) => {
    const on = rows.filter(([id]) => values[id] > 0).length;
    return `<details data-relation-group="${esc(category)}" style="--mw-accent:${color}" ${openGroups.has(category) ? 'open' : ''}><summary><span class="mw-category-icon">${icon}</span><span>${category}</span><small>${on ? `${on} active` : rows.length}</small></summary><div class="mw-category-body">${rows.map(row).join('')}</div></details>`;
}).join('');

// Sims-style list of everyone else, then the selected pairing underneath: their side, or both of them.
export function relationshipView({ subject, peers, selectedKey, relation, pair, view, selfKey, otherKey, knowledge, isPlayer, focus, openGroups, swapLabel, removing }) {
    const selected = peers.find(p => p.key === selectedKey) ?? peers[0];
    const list = peers.map(p => {
        const shared = p.pair ? activeSharedTags(p.pair) : [], mine = p.relation ? activeRelationshipTags(p.relation) : [];
        const summary = [...shared.slice(0, 2), ...mine.slice(0, 3)].map(t => `${esc(t.label)} <em>${level((SHARED_BY_ID[t.id] ? p.pair : p.relation).moods[t.id]).toLowerCase()}</em>`).join(' · ');
        const more = shared.length + mine.length - Math.min(2, shared.length) - Math.min(3, mine.length);
        return `<button class="mw-peer ${p.key === selected?.key ? 'is-selected' : ''} ${p.offScene ? 'is-away' : ''}" data-peer="${esc(p.key)}" aria-pressed="${p.key === selected?.key}">
            <span class="mw-avatar">${initial(p.name)}</span><span class="mw-peer-text"><b>${esc(p.name)}</b><small>${esc(p.role)}</small>
            <span class="mw-peer-tags">${summary || '<i>Nothing set yet</i>'}${more > 0 ? ` · +${more}` : ''}</span></span></button>`;
    }).join('');
    const add = `<div class="mw-cast-add mw-peer-add"><input type="text" data-relation-new maxlength="80" aria-label="Someone not listed" placeholder="Someone not listed…"><button data-action="relation-add">＋ Add</button></div>`;
    if (!selected) return `<div class="mw-rel"><p class="mw-explainer">Nobody else is here yet. Add a cast member above, or type a name.</p>${add}</div>`;
    const mineCount = relation ? activeRelationshipTags(relation).length + (relation.compare?.value && relation.compare?.with ? 1 : 0) : 0;
    const bothCount = pair ? activeSharedTags(pair).length : 0;
    const values = relation?.moods ?? {}, shared = pair?.moods ?? {};
    const others = peers.filter(p => p.key !== selected.key);
    const compare = relation?.compare ?? { with: '', favours: 'them', value: 0 };
    const memories = pair?.memories ?? [];
    const whoOptions = [['both', 'Both remember'], [selfKey, `Only ${subject} remembers`], [otherKey, `Only ${selected.name} remembers`]];
    const body = view === 'mem' ? `
        <p class="mw-fine">Moments that really happened between them. Memories at clear or above are sent, and the stronger one is, the more it comes back.</p>
        ${memories.map(m => `<div class="mw-mood mw-own"><div class="mw-row-head"><input type="text" class="mw-own-text" data-mem-text="${esc(m.id)}" maxlength="160" value="${esc(m.text)}" aria-label="Memory"><span data-lvl>${level(m.value)}</span><output>${m.value}%</output><button type="button" class="mw-list" data-mem-remove="${esc(m.id)}" title="Forget this" aria-label="Forget this">×</button></div>
            <input type="range" min="0" max="100" step="1" value="${m.value}" data-mem="${esc(m.id)}" style="--mw-fill:${m.value}%" aria-label="How often it comes back">
            <select data-mem-who="${esc(m.id)}" aria-label="Who remembers">${whoOptions.map(([v, l]) => `<option value="${esc(v)}" ${m.who === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`).join('')}
        <div class="mw-cast-add"><input type="text" data-mem-new maxlength="160" placeholder="e.g. he caught her crying in the darkroom" aria-label="New memory"><button data-action="mem-add">＋ Remember</button></div>` : view === 'both' ? `
        <p class="mw-fine">True for both of them and sent once. Use ${esc(subject)}’s side for anything one-way.</p>
        ${pair ? `<div class="mw-cast-presence"><label class="mw-toggle"><input type="checkbox" data-pair-enabled ${pair.enabled !== false ? 'checked' : ''}> Send this</label><button data-action="pair-clear">Clear</button></div>` : ''}
        <input type="search" data-relation-search placeholder="Find a status or trope…" aria-label="Search">
        <div class="mw-categories mw-relation-groups">${groupsHtml(SHARED_CATEGORIES, shared, openGroups, ([id, label, cue]) => sliderRow('pair-slider', id, label, cue, shared[id] ?? 0))}</div>` : `
        <p class="mw-fine">Only ${esc(subject)}’s side. ${esc(selected.name)} doesn’t feel the same unless you set it on their side too.${isPlayer ? ` You still write ${esc(subject)}; each feeling also has a “what ${esc(focus)} knows” choice.` : ''}</p>
        ${relation ? `<div class="mw-cast-presence"><label class="mw-toggle"><input type="checkbox" data-relation-enabled ${relation.enabled !== false ? 'checked' : ''}> Send this side</label><button data-action="relation-remove">Clear</button></div>` : ''}
        <div class="mw-compare"><label>Compares ${esc(selected.name)} with<select data-compare-with><option value="">nobody</option>${others.map(p => `<option value="${esc(p.key)}" ${compare.with === p.key ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
            ${compare.with ? `<label>Who comes out better<select data-compare-favours>${[['them', `${selected.name}`], ['other', others.find(p => p.key === compare.with)?.name ?? 'the other one'], ['neither', 'neither, just weighing them']].map(([v, l]) => `<option value="${v}" ${compare.favours === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
            ${sliderRow('compare-slider', 'compare', 'How much they compare', 'from the odd passing thought to constantly measuring them against each other', compare.value ?? 0)}` : ''}</div>
        <label class="mw-note">In ${esc(subject)}’s own words <small>optional</small><input type="text" data-relation-note maxlength="160" value="${esc(relation?.note ?? '')}" placeholder="How they’d describe ${esc(selected.name)}"></label>
        <input type="search" data-relation-search placeholder="Find a feeling or opinion…" aria-label="Search relationship feelings">
        <div class="mw-categories mw-relation-groups">${groupsHtml(RELATIONSHIP_CATEGORIES, values, openGroups, ([id, label]) => {
            const value = values[id] ?? 0, entry = relation ? knowledgeEntry(knowledge[relationshipKey(relation, id)]) : knowledgeEntry();
            return sliderRow('rel-slider', id, label, relationshipCue(RELATIONSHIP_BY_ID[id], value || 50), value,
                isPlayer && value ? `<label class="mw-rel-knowledge">What ${esc(focus)} knows<select data-rel-knowledge="${id}" aria-label="What ${esc(focus)} knows: ${esc(label)}">${KNOWLEDGE_MODES.map((mode, i) => `<option value="${mode}" ${entry.mode === mode ? 'selected' : ''}>${KNOW_LABELS[i]}</option>`).join('')}</select></label>` : '');
        })}</div>`;
    return `<div class="mw-rel">
        <div class="mw-peers" role="list">${list}</div>${add}
        <div class="mw-pair">
            <div class="mw-pair-head"><div><span class="mw-eyebrow">${esc(subject.toUpperCase())} &amp; ${esc(selected.name.toUpperCase())}</span><h3>${esc(selected.name)}</h3></div>
                ${swapLabel ? `<button data-action="rel-swap" title="Switch to their side of this relationship">⇄ ${esc(swapLabel)}</button>` : ''}</div>
            <div class="mw-mode mw-small mw-pair-tabs" role="group" aria-label="Which side"><button data-pair-tab="mine" aria-pressed="${view === 'mine' || !['both', 'mem'].includes(view)}">→ ${esc(subject)}${mineCount ? ` <small>${mineCount}</small>` : ''}</button><button data-pair-tab="both" aria-pressed="${view === 'both'}">⚭ Both${bothCount ? ` <small>${bothCount}</small>` : ''}</button><button data-pair-tab="mem" aria-pressed="${view === 'mem'}">✎ Memories${memories.length ? ` <small>${memories.length}</small>` : ''}</button></div>
            ${removing ? `<div class="mw-cast-confirm"><p class="mw-fine">${removing === 'pair' ? `Clear everything set for both ${esc(subject)} and ${esc(selected.name)}?` : `Clear everything ${esc(subject)} feels about ${esc(selected.name)}?`}</p><div class="mw-actions"><button data-action="${removing === 'pair' ? 'pair-clear-confirm' : 'relation-remove-confirm'}">Clear it</button><button data-action="relation-cancel">Keep it</button></div></div>` : ''}
            ${body}
        </div></div>`;
}
