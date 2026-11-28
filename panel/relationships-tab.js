import { escapeHtml as esc } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { KNOWLEDGE_MODES, knowledgeEntry } from '../engine/state.js';
import { TO_METER, RELATIONSHIP_CATEGORIES, SHARED_CATEGORIES, RELATIONSHIP_BY_ID, SHARED_BY_ID, activeRelationshipTags, activeSharedTags, relationshipKey, relationshipCue } from '../engine/relationships.js';

const initial = name => esc((String(name).trim()[0] ?? '?').toUpperCase());
const KNOW_LABELS = ['Scene only', 'Private', 'Suspected', 'Known'];
const sliderRow = (attr, id, label, cue, value, extra = '') => `<div class="mw-mood" data-relation-row="${id}"><div class="mw-row-head"><label for="mw-${attr}-${id}">${esc(label)}</label><span data-lvl>${level(value)}</span><output for="mw-${attr}-${id}">${value}%</output></div>
    <input id="mw-${attr}-${id}" type="range" min="0" max="100" step="1" value="${value}" data-${attr}="${id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
    <small>${esc(cue)}</small>${extra}</div>`;
// 2.0.38: a folded group's sliders are only drawn when it's opened (lazy holds them; see fillLazy), so a tap on
// Bonds doesn't rebuild hundreds of hidden meters.
let lazy = null;
const groupBody = (key, rows, open, row) => {
    if (!open && lazy) { lazy.set(key, () => rows.map(row).join('')); return `<div class="mw-category-body" data-lazy="${esc(key)}"></div>`; }
    return `<div class="mw-category-body">${rows.map(row).join('')}</div>`;
};
const groupsHtml = (cats, values, openGroups, row) => cats.map(([category, icon, color, rows]) => {
    const on = rows.filter(([id]) => values[id] > 0).length;
    return `<details data-relation-group="${esc(category)}" style="--mw-accent:${color}" ${openGroups.has(category) ? 'open' : ''}><summary><span class="mw-category-icon">${icon}</span><span>${category}</span><small>${on ? `${on} active` : rows.length}</small></summary>${groupBody(`rel:${category}`, rows, openGroups.has(category), row)}</details>`;
}).join('');

// Sims-style list of everyone else, then the selected pairing underneath: their side, or both of them.
export function relationshipView({ subject, peers, selectedKey, relation, pair, view, selfKey, otherKey, knowledge, isPlayer, focus, openGroups, swapLabel, removing, peerExtra = {}, meterRows = false, lazyBodies = null }) {
    lazy = lazyBodies;
    // 1.86: toward you, with the bond meters on, feelings that are really a meter live on Bonds above instead.
    const cats = meterRows ? RELATIONSHIP_CATEGORIES.map(([c, i, col, rows]) => [c, i, col, rows.filter(([id]) => !TO_METER[id])]).filter(([, , , rows]) => rows.length) : RELATIONSHIP_CATEGORIES;
    const selected = peers.find(p => p.key === selectedKey) ?? peers[0];
    const list = peers.map(p => {
        const shared = p.pair ? activeSharedTags(p.pair) : [], mine = p.relation ? activeRelationshipTags(p.relation) : [];
        const summary = [...shared.slice(0, 2), ...mine.slice(0, 3)].map(t => `${esc(t.label)} <em>${level((SHARED_BY_ID[t.id] ? p.pair : p.relation).moods[t.id]).toLowerCase()}</em>`).join(' \u00b7 ');
        const more = shared.length + mine.length - Math.min(2, shared.length) - Math.min(3, mine.length);
        return `<button class="mw-peer ${p.key === selected?.key ? 'is-selected' : ''} ${p.offScene ? 'is-away' : ''}" data-peer="${esc(p.key)}" data-filter-item="peers" aria-pressed="${p.key === selected?.key}">
            <span class="mw-avatar">${initial(p.name)}</span><span class="mw-peer-text"><b>${esc(p.name)}</b><small>${esc(p.role)}</small>
            <span class="mw-peer-tags">${summary || '<i>Nothing set yet</i>'}${more > 0 ? ` \u00b7 +${more}` : ''}</span>${peerExtra[p.key] ?? ''}</span></button>`;
    }).join('');
    const add = `<div class="mw-cast-add mw-peer-add"><input type="text" data-relation-new maxlength="80" aria-label="Someone not listed" placeholder="Someone not listed\u2026"><button data-action="relation-add">\uff0b Add</button></div>`;
    if (!selected) return `<div class="mw-rel"><p class="mw-explainer">Nobody else is here yet. Add a cast member above, or type a name.</p>${add}</div>`;
    const mineCount = relation ? activeRelationshipTags(relation).length + (relation.compare?.value && relation.compare?.with ? 1 : 0) : 0;
    const bothCount = pair ? activeSharedTags(pair).length : 0;
    const values = relation?.moods ?? {}, shared = pair?.moods ?? {};
    const others = peers.filter(p => p.key !== selected.key);
    const compare = relation?.compare ?? { with: '', favours: 'them', value: 0 };
    const memories = pair?.memories ?? [];
    const whoOptions = [['both', 'Both remember'], [selfKey, `Only ${subject} remembers`], [otherKey, `Only ${selected.name} remembers`]];
    const body = view === 'mem' ? `
        <p class="mw-fine">Moments that happened between them.</p>
        <input type="search" data-filter-list="memories" placeholder="Find a saved memory\u2026" aria-label="Search memories">
        ${memories.map(m => `<div class="mw-mood mw-own" data-memory-row="${esc(m.id)}" data-filter-item="memories" data-search="${esc(m.text)}"><div class="mw-row-head"><input type="text" class="mw-own-text" data-mem-text="${esc(m.id)}" maxlength="160" value="${esc(m.text)}" aria-label="Memory">${m.boardText && m.text === m.boardText ? '<small class="mw-fine" title="Saved from the info board. Edit it or move its slider to keep it for good.">\ud83d\udccc</small>' : ''}<span data-lvl>${level(m.value)}</span><output>${m.value}%</output><button type="button" class="mw-list" data-mem-remove="${esc(m.id)}" title="Forget this" aria-label="Forget this">\u00d7</button></div>
            <input type="range" min="0" max="100" step="1" value="${m.value}" data-mem="${esc(m.id)}" style="--mw-fill:${m.value}%" aria-label="How often it comes back">
            <select data-mem-who="${esc(m.id)}" aria-label="Who remembers">${whoOptions.map(([v, l]) => `<option value="${esc(v)}" ${m.who === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`).join('')}
        <p class="mw-fine" data-filter-empty="memories" hidden>No matching memories.</p>
        <div class="mw-cast-add"><input type="text" data-mem-new maxlength="160" placeholder="e.g. they met at the gallery opening" aria-label="New memory"><button data-action="mem-add">\uff0b Remember</button></div>` : view === 'both' ? `
        <p class="mw-fine">True for both of them.</p>
        ${pair ? `<div class="mw-cast-presence"><label class="mw-toggle"><input type="checkbox" data-pair-enabled ${pair.enabled !== false ? 'checked' : ''}> Send this</label><button data-action="pair-clear">Clear</button></div>` : ''}
        <input type="search" data-relation-search placeholder="Find a status or trope\u2026" aria-label="Search">
        <div class="mw-categories mw-relation-groups">${groupsHtml(SHARED_CATEGORIES, shared, openGroups, ([id, label, cue]) => sliderRow('pair-slider', id, label, cue, shared[id] ?? 0))}</div>` : `
        <p class="mw-fine">Only ${esc(subject)}\u2019s side. ${esc(selected.name)} doesn\u2019t feel the same unless you set it on their side too.${isPlayer ? ` You still write ${esc(subject)}; each feeling also has a \u201cwhat ${esc(focus)} knows\u201d choice.` : ''}</p>
        ${relation ? `<div class="mw-cast-presence"><label class="mw-toggle"><input type="checkbox" data-relation-enabled ${relation.enabled !== false ? 'checked' : ''}> Send this side</label><button data-action="relation-remove">Clear</button></div>` : ''}
        <div class="mw-compare"><label>Compares ${esc(selected.name)} with<select data-compare-with><option value="">nobody</option>${others.map(p => `<option value="${esc(p.key)}" ${compare.with === p.key ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
            ${compare.with ? `<label>Who comes out better<select data-compare-favours>${[['them', `${selected.name}`], ['other', others.find(p => p.key === compare.with)?.name ?? 'the other one'], ['neither', 'neither, just weighing them']].map(([v, l]) => `<option value="${v}" ${compare.favours === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
            ${sliderRow('compare-slider', 'compare', 'How much they compare', 'from the odd passing thought to constantly measuring them against each other', compare.value ?? 0)}` : ''}</div>
        <label class="mw-note">In ${esc(subject)}\u2019s own words <small>optional</small><input type="text" data-relation-note maxlength="160" value="${esc(relation?.note ?? '')}" placeholder="How they\u2019d describe ${esc(selected.name)}"></label>
        <input type="search" data-relation-search placeholder="Find a feeling or opinion\u2026" aria-label="Search relationship feelings">
        ${meterRows ? '<p class="mw-fine">Liking, love, trust, desire, obsession, jealousy, respect, fear and the other feelings that rise and fall are the meters on Bonds above. These are the specific ones: roles, what they think of them, what happened between them, and how it shows.</p>' : ''}
        <div class="mw-categories mw-relation-groups">${groupsHtml(cats, values, openGroups, ([id, label]) => {
            const value = values[id] ?? 0, entry = relation ? knowledgeEntry(knowledge[relationshipKey(relation, id)]) : knowledgeEntry();
            return sliderRow('rel-slider', id, label, relationshipCue(RELATIONSHIP_BY_ID[id], value || 50), value,
                isPlayer && value ? `<label class="mw-rel-knowledge">What ${esc(focus)} knows<select data-rel-knowledge="${id}" aria-label="What ${esc(focus)} knows: ${esc(label)}">${KNOWLEDGE_MODES.map((mode, i) => `<option value="${mode}" ${entry.mode === mode ? 'selected' : ''}>${KNOW_LABELS[i]}</option>`).join('')}</select></label>` : '');
        })}</div>`;
    return `<div class="mw-rel">
        <input type="search" data-filter-list="peers" placeholder="Find a person or relationship\u2026" aria-label="Search people and relationships">
        <div class="mw-peers" role="list">${list}</div><p class="mw-fine" data-filter-empty="peers" hidden>No matching people. The selected pairing stays open below.</p>${add}
        <div class="mw-pair">
            <div class="mw-pair-head"><div><span class="mw-eyebrow">${esc(subject)} &amp; ${esc(selected.name)}</span><h3>${esc(selected.name)}</h3></div>
                ${swapLabel ? `<button data-action="rel-swap" title="Switch to their side of this relationship">\u21c4 ${esc(swapLabel)}</button>` : ''}</div>
            <div class="mw-mode mw-small mw-pair-tabs" role="group" aria-label="Which side"><button data-pair-tab="mine" aria-pressed="${view === 'mine' || !['both', 'mem'].includes(view)}">\u2192 ${esc(subject)}${mineCount ? ` <small>${mineCount}</small>` : ''}</button><button data-pair-tab="both" aria-pressed="${view === 'both'}">\u26ad Both${bothCount ? ` <small>${bothCount}</small>` : ''}</button><button data-pair-tab="mem" aria-pressed="${view === 'mem'}">\u270e Memories${memories.length ? ` <small>${memories.length}</small>` : ''}</button></div>
            ${removing ? `<div class="mw-cast-confirm"><p class="mw-fine">${removing === 'pair' ? `Clear everything set for both ${esc(subject)} and ${esc(selected.name)}?` : `Clear everything ${esc(subject)} feels about ${esc(selected.name)}?`}</p><div class="mw-actions"><button data-action="${removing === 'pair' ? 'pair-clear-confirm' : 'relation-remove-confirm'}">Clear it</button><button data-action="relation-cancel">Keep it</button></div></div>` : ''}
            ${body}${view === 'mem' ? '' : '<p class="mw-fine" data-relation-empty hidden>No matching relationship settings.</p>'}
        </div></div>`;
}
