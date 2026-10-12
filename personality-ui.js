import { PERSONALITY_TYPES, PERSONALITY_BY_ID, cleanPersonality, ENNEAGRAM_TYPES, ENNEAGRAM_BY_ID, cleanEnneagram } from './personality.js';
import { escapeHtml as esc, level, KNOWLEDGE_MODES, knowledgeEntry } from './core.js';

export function personalityView(options) {
    return '<p class="mw-fine">Types shape how someone acts, never get named in the story, and belong only to this person. At 70+ they drive their choices. Use one system or both.</p>'
        + (options.isPlayer ? `<p class="mw-fine">This is your persona’s type, not ${esc(options.focus)}’s. ${esc(options.focus)} only uses it to read how you come across.</p>` : '')
        + typeView(options, 'personality') + typeView(options, 'enneagram');
}
function typeView({ state, isPlayer, focus, knowledge }, system) {
    const en = system === 'enneagram', key = en ? 'mw-enneagram' : 'mw-type';
    const types = en ? ENNEAGRAM_TYPES : PERSONALITY_TYPES, catalogue = en ? ENNEAGRAM_BY_ID : PERSONALITY_BY_ID;
    const p = (en ? cleanEnneagram : cleanPersonality)(state[system]), type = catalogue[p.type];
    const entry = knowledgeEntry(knowledge?.[system]);
    return `<section class="mw-personality">
        <div class="mw-cast-presence"><b>${en ? "Enneagram" : "Myers-Briggs"}</b><label class="mw-toggle"><input type="checkbox" data-personality-system="${system}" data-personality="enabled" ${p.enabled ? 'checked' : ''}> Send type</label></div>
        <p class="mw-fine">${en ? "What drives them and what they struggle with." : "How they take things in and make decisions."} Pick which side comes through; their moods still mix in.</p>
        <input type="search" id="${key}-search" placeholder="Find a type or quality…" aria-label="Search personality types">
        <label class="mw-type-label" for="${key}">${en ? "Enneagram type" : "Myers-Briggs type"}</label>
        <select id="${key}" data-personality-system="${system}" data-personality="type"><option value="">No type selected</option>${types.map(t => `<option value="${t.id}" ${p.type === t.id ? 'selected' : ''}>${t.id} · ${esc(t.label)}</option>`).join('')}</select>
        <p class="mw-fine" data-type-empty hidden>No matching types. Your current selection is kept.</p>
        ${type ? `<div class="mw-type-description"><b>${type.id} · ${esc(type.label)}</b><p>${esc(type.core)}.</p>
            <p><span>Good side:</span> ${esc(type.positive)}.</p><p><span>Bad side:</span> ${esc(type.negative)}.</p></div>
        <label class="mw-type-label" for="${key}-expression">Expression</label>
        <select id="${key}-expression" data-personality-system="${system}" data-personality="expression">${[['balanced', 'Balanced · good and bad side'], ['positive', 'Good side · mostly their best'], ['negative', 'Bad side · mostly their worst']].map(([v, label]) => `<option value="${v}" ${v === p.expression ? 'selected' : ''}>${label}</option>`).join('')}</select>
        <div class="mw-mood"><div class="mw-row-head"><label for="${key}-strength">How strongly it comes through</label><span data-lvl>${level(p.strength)}</span><output>${p.strength}%</output></div>
            <input id="${key}-strength" type="range" min="0" max="100" value="${p.strength}" data-personality-system="${system}" data-personality="strength" style="--mw-fill:${p.strength}%" aria-valuetext="${p.strength} percent, ${level(p.strength)}"></div>
        ${isPlayer ? `<div class="mw-knowledge-row"><label for="${key}-knowledge">What ${esc(focus)} knows</label><select id="${key}-knowledge" data-knowledge="${system}">${KNOWLEDGE_MODES.map((v, i) => `<option value="${v}" ${v === entry.mode ? 'selected' : ''}>${['Scene only', 'Private', 'Suspected', 'Known'][i]}</option>`).join('')}</select>
            ${['known', 'suspected'].includes(entry.mode) ? `<input type="text" data-knowledge-source="${system}" maxlength="120" value="${esc(entry.source)}" placeholder="How they learned it (optional)" aria-label="How they learned about this personality">` : ''}</div>` : ''}` : ''}
        <details id="${key}-help"><summary>${en ? 'How Enneagram works' : 'What the letters mean'}</summary><p class="mw-fine">${en ? 'Nine core drives. Good and bad side are how that drive comes out, not whether someone is a good or bad person.' : 'E / I: outgoing or introverted. S / N: detail-focused or big-picture. T / F: logic-led or values-led. J / P: likes structure or goes with the flow.'}</p><p class="mw-fine">Writing lenses, not diagnoses. Off or 0 sends nothing. Each type is sent under its owner’s name, so a persona type is never read as the character’s. The player still writes their own character.</p></details>
    </section>`;
}

export function filterPersonality(panel) {
    for (const [key, types] of [['mw-type', PERSONALITY_TYPES], ['mw-enneagram', ENNEAGRAM_TYPES]]) {
        const input = panel.querySelector('#' + key + '-search'), select = panel.querySelector('#' + key);
        if (!input || !select) continue;
        const term = input.value.trim().toLowerCase(), selected = select.value;
        const matches = types.filter(t => [t.id, t.label, t.core, t.positive, t.negative].join(' ').toLowerCase().includes(term));
        const choices = types.filter(t => t.id === selected || matches.includes(t));
        select.innerHTML = '<option value="">No type selected</option>' + choices.map(t => `<option value="${t.id}">${t.id} · ${esc(t.label)}</option>`).join('');
        select.value = selected;
        input.closest('.mw-personality').querySelector('[data-type-empty]').hidden = matches.length > 0;
    }
}
