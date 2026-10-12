import { PERSONALITY_TYPES, PERSONALITY_BY_ID, cleanPersonality } from './personality.js';
import { escapeHtml as esc, level, KNOWLEDGE_MODES, knowledgeEntry } from './core.js';

export function personalityView({ state, isPlayer, focus, knowledge }) {
    const p = cleanPersonality(state.personality), type = PERSONALITY_BY_ID[p.type];
    const entry = knowledgeEntry(knowledge?.personality);
    return `<section class="mw-personality">
        <div class="mw-cast-presence"><b>Personality type</b><label class="mw-toggle"><input type="checkbox" data-personality="enabled" ${p.enabled ? 'checked' : ''}> Send type</label></div>
        <p class="mw-fine">A writing lens for this person. Pick a type, then choose which side of it comes through. Their moods and relationships still mix with it.</p>
        <input type="search" id="mw-type-search" placeholder="Find a type or quality…" aria-label="Search personality types">
        <label class="mw-type-label" for="mw-type">Myers-Briggs type</label>
        <select id="mw-type" data-personality="type"><option value="">No type selected</option>${PERSONALITY_TYPES.map(t => `<option value="${t.id}" ${p.type === t.id ? 'selected' : ''}>${t.id} · ${esc(t.label)}</option>`).join('')}</select>
        <p class="mw-fine" data-type-empty hidden>No matching types. Your current selection is kept.</p>
        ${type ? `<div class="mw-type-description"><b>${type.id} · ${esc(type.label)}</b><p>${esc(type.core)}.</p>
            <p><span>Positive:</span> ${esc(type.positive)}.</p><p><span>Negative:</span> ${esc(type.negative)}.</p></div>
        <label class="mw-type-label" for="mw-type-expression">Expression</label>
        <select id="mw-type-expression" data-personality="expression">${[['balanced', 'Balanced · strengths and flaws'], ['positive', 'Positive · their better side'], ['negative', 'Negative · their worse side']].map(([v, label]) => `<option value="${v}" ${v === p.expression ? 'selected' : ''}>${label}</option>`).join('')}</select>
        <div class="mw-mood"><div class="mw-row-head"><label for="mw-type-strength">How strongly it comes through</label><span data-lvl>${level(p.strength)}</span><output>${p.strength}%</output></div>
            <input id="mw-type-strength" type="range" min="0" max="100" value="${p.strength}" data-personality="strength" style="--mw-fill:${p.strength}%" aria-valuetext="${p.strength} percent, ${level(p.strength)}"></div>
        ${isPlayer ? `<div class="mw-knowledge-row"><label for="mw-type-knowledge">What ${esc(focus)} knows</label><select id="mw-type-knowledge" data-knowledge="personality">${KNOWLEDGE_MODES.map((v, i) => `<option value="${v}" ${v === entry.mode ? 'selected' : ''}>${['Scene only', 'Private', 'Suspected', 'Known'][i]}</option>`).join('')}</select>
            ${['known', 'suspected'].includes(entry.mode) ? `<input type="text" data-knowledge-source="personality" maxlength="120" value="${esc(entry.source)}" placeholder="How they learned it (optional)" aria-label="How they learned about this personality">` : ''}</div>` : ''}` : ''}
        <details id="mw-type-help"><summary>What the letters mean</summary><p class="mw-fine">E / I: drawn outward or inward. S / N: concrete details or patterns and possibilities. T / F: impersonal reasoning or personal values when deciding. J / P: structure or keeping options open.</p><p class="mw-fine">Positive and negative are writing choices, not diagnoses or extra MBTI types. Strength changes how much the type shapes the portrayal. Only the chosen type and expression are sent; off or 0 sends nothing.</p></details>
    </section>`;
}

export function filterPersonality(panel) {
    const input = panel.querySelector('#mw-type-search'), select = panel.querySelector('#mw-type');
    if (!input || !select) return;
    const term = input.value.trim().toLowerCase(), selected = select.value;
    const matches = PERSONALITY_TYPES.filter(t => [t.id, t.label, t.core, t.positive, t.negative].join(' ').toLowerCase().includes(term));
    const choices = PERSONALITY_TYPES.filter(t => t.id === selected || matches.includes(t));
    select.innerHTML = '<option value="">No type selected</option>' + choices.map(t => `<option value="${t.id}">${t.id} · ${esc(t.label)}</option>`).join('');
    select.value = selected;
    panel.querySelector('[data-type-empty]').hidden = matches.length > 0;
}
