// The Skills tab.
import { subjectName } from '../app/chat.js';
import { panelLit } from '../app/note.js';
import { settings } from '../app/settings.js';
import { run, ui } from '../app/state.js';
import { escapeHtml as esc } from '../engine/util.js';
import { fillLazy, searchText } from './render.js';
import { SKILL_BY_ID, SKILL_GROUPS, SKILL_PACE, cleanPins, cleanSkillPace, cleanSkills, skillProgress, skillWord, skillsOf } from '../engine/skills.js';

// The last rolls (\u2699 Settings \u203a Panel \u203a Show the dice rolls), for the main character's chat.
function diceBox() {
    const rolls = settings().diceShow && run.rolls?.list?.length ? run.rolls.list : [];
    return rolls.length ? `<details class="mw-dice"><summary>\ud83c\udfb2 Dice for the next reply <small>${rolls.length}</small></summary><ul>${rolls.map(r => `<li>${esc(r.text)}</li>`).join('')}</ul></details>` : '';
}
// The star list: one slim row per skill (name, a small balanced meter, the number). Tapping a row or a chip
// opens a sheet at the bottom of the panel with a half-orbit dial from \u221210 on the left to +10 on the right,
// big \u2212 and \uff0b buttons, quick jumps to \u221210, \u22125, 0, +5, +10 and a pin. Nothing is dragged and nothing on the
// list changes by accident while scrolling. 0 takes the skill off them.
const signed = v => v > 0 ? `+${v}` : v < 0 ? `\u2212${-v}` : '0';
const tone = v => v > 0 ? 'is-good' : v < 0 ? 'is-bad' : 'is-zero';
const mini = v => `<span class="mw-sk-mini ${tone(v)}" aria-hidden="true"><i style="${v < 0 ? 'right:50%' : 'left:50%'};width:${Math.abs(v) * 5}%"></i></span>`;
// The orbit: 21 stars on a half circle, 0 at the top. The arc from 0 to the level glows gold (good at it)
// or rose (bad at it), and a small planet sits on the level.
function orbit(v) {
    const cx = 120, cy = 116, r = 96, at = n => { const a = Math.PI - (n + 10) / 20 * Math.PI; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
    const f = n => n.toFixed(1), [tx, ty] = at(0), [vx, vy] = at(v);
    const stars = Array.from({ length: 21 }, (_, i) => i - 10).filter(n => n).map(n => { const [x, y] = at(n), on = v > 0 ? n > 0 && n <= v : v < 0 && n < 0 && n >= v, big = n % 5 === 0;
        return `<circle cx="${f(x)}" cy="${f(y)}" r="${big ? 3.4 : 2.3}" class="${on ? (n > 0 ? 'is-good' : 'is-bad') : ''}"/>`; }).join('');
    const lit = v ? `<path d="M${f(tx)} ${f(ty)}A${r} ${r} 0 0 ${v > 0 ? 1 : 0} ${f(vx)} ${f(vy)}" class="mw-sk-arc ${tone(v)}"/>` : '';
    return `<svg class="mw-sk-orbit" viewBox="0 0 240 140" aria-hidden="true"><path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}" class="mw-sk-track"/>${lit}${stars}
        <text x="${cx - r}" y="${cy + 21}" text-anchor="middle">\u221210</text><text x="${cx}" y="${cy - r - 9}" text-anchor="middle">0</text><text x="${cx + r}" y="${cy + 21}" text-anchor="middle">+10</text>
        <circle cx="${f(vx)}" cy="${f(vy)}" r="10" class="mw-sk-planet ${tone(v)}"/><text x="${cx}" y="${cy - 14}" text-anchor="middle" class="mw-sk-big ${tone(v)}">${v ? signed(v) : '0'}</text></svg>`;
}
export function skillsView(state, ch) {
    const whose = esc(subjectName()), set = cleanSkills(state.skills), pins = cleanPins(state.skillPins), pace = cleanSkillPace(state.skillPace);
    const going = panelLit(ch, state, ui.who), lit = new Map(going.map(x => [x.id, x.why]));
    // Skills in play this reply come first, then the rest by level (1.96.4).
    const first = list => [...list].sort((a, b) => Number(lit.has(b.id)) - Number(lit.has(a.id)) || (set[b.id] ?? 0) - (set[a.id] ?? 0));
    const why = { used: 'Used in the last reply', scene: 'The scene calls for it', context: 'Fits what\u2019s happening' };
    const word = v => v ? skillWord(v) : 'not theirs';
    const row = s => { const value = set[s.id] ?? 0;
        return `<button type="button" data-skill-row="${s.id}" data-skill-open="${s.id}" class="mw-sk-row ${lit.has(s.id) ? 'is-lit' : ''} ${ui.skillSheet === s.id ? 'is-open' : ''}" data-search="${esc(`${s.label} ${s.cue}`)}" aria-label="${esc(s.label)}: ${word(value)}${value ? ` ${signed(value)}` : ''}. Tap to change">
        <span class="mw-sk-name"><b>${lit.has(s.id) ? '\u2727 ' : ''}${esc(s.label)}${pins[s.id] ? ' <em>\u25c6</em>' : ''}</b><small>${lit.has(s.id) ? why[lit.get(s.id)] : word(value)}</small></span>
        ${mini(value)}<span class="mw-sk-num ${tone(value)}">${value ? signed(value) : '0'}</span></button>`; };
    // The sheet for the skill you tapped.
    const open = ui.skillSheet && SKILL_BY_ID[ui.skillSheet] ? SKILL_BY_ID[ui.skillSheet] : null;
    const sheet = () => { const s = open, value = set[s.id] ?? 0, pinned = Boolean(pins[s.id]), prog = skillProgress(state, s.id), to = v => Math.max(-10, Math.min(10, v));
        const fresh = ui.skillSheetFresh; ui.skillSheetFresh = false;
        return `<section class="mw-sk-sheet ${fresh ? 'is-new' : ''}" data-noswipe role="dialog" aria-label="${esc(s.label)} level" style="--mw-accent:${s.color ?? 'var(--mw-moon)'}">
        <div class="mw-sk-sheet-head"><h4>${lit.has(s.id) ? '\u2727 ' : ''}${esc(s.label)}</h4><span class="mw-sk-word ${tone(value)}">${word(value)}</span></div>
        <p class="mw-sk-cue">${esc(s.cue)}${lit.has(s.id) ? ` \u00b7 <b>${why[lit.get(s.id)]}</b>` : ''}</p>
        <div class="mw-sk-dial"><button type="button" class="mw-sk-step" data-skill-to="${s.id}" data-v="${to(value - 1)}" ${value <= -10 ? 'disabled' : ''} aria-label="Lower ${esc(s.label)} to ${to(value - 1)}">\u2212</button>
            ${orbit(value)}
            <button type="button" class="mw-sk-step" data-skill-to="${s.id}" data-v="${to(value + 1)}" ${value >= 10 ? 'disabled' : ''} aria-label="Raise ${esc(s.label)} to ${to(value + 1)}">\uff0b</button></div>
        <div class="mw-sk-jumps">${[-10, -5, 0, 5, 10].map(j => `<button type="button" data-skill-to="${s.id}" data-v="${j}" aria-pressed="${value === j}" class="${tone(j)}">${j ? signed(j) : 'Off'}</button>`).join('')}</div>
        <p class="mw-sk-fine">${value ? `${prog ? `${prog[0]} of ${prog[1]} uses to reach ${signed(value === -1 ? 1 : value + 1)}. ` : ''}${pinned ? 'Pinned: it stays at this level.' : 'It grows and slips slowly with use.'}` : `${whose} doesn\u2019t have this. \uff0b makes them good at it, \u2212 bad at it.`}</p>
        <div class="mw-sk-sheet-foot">${value ? `<button type="button" class="mw-sk-pin" data-skill-pin="${s.id}" aria-pressed="${pinned}">${pinned ? '\u25c6 Pinned' : '\u25c7 Pin'}</button>` : ''}<button type="button" class="mw-primary mw-sk-done" data-skill-close>Done</button></div></section>`; };
    const chips = first(skillsOf(state)).map(x => `<button type="button" data-skill-open="${x.id}" class="mw-chip ${lit.has(x.id) ? 'is-lit' : ''}" style="--mw-accent:${x.level < 0 ? 'var(--mw-rose)' : 'var(--mw-moon)'}" title="${lit.has(x.id) ? `${why[lit.get(x.id)]}. ` : ''}Change ${esc(x.label)}"><span>${lit.has(x.id) ? '\u2727 ' : ''}${x.pinned ? '\u25c6 ' : ''}${esc(x.label)}</span><b>${signed(x.level)}</b></button>`).join('');
    // Their own list shows only the skills they have, open. "\uff0b Add skills" opens the whole catalogue, folded
    // by group and drawn when a group is opened (fillLazy), like the long lists on other tabs.
    const browsing = ui.browsing;
    const groups = SKILL_GROUPS.map(g => { const mine = first(g.rows.filter(r => set[r.id])), on = mine.length, key = `skills-${g.name}`, open = ui.openGroups?.[`details[data-skill-group="${CSS.escape(g.name)}"]`];
        if (!browsing) return on ? `<div class="mw-skill-mine" data-skill-group="${esc(g.name)}"><h5 class="mw-sk-group"><span>${g.icon}</span> ${esc(g.name)}</h5>${mine.map(row).join('')}</div>` : '';
        ui.lazyBodies.set(key, () => g.rows.map(row).join(''));
        return `<details data-skill-group="${esc(g.name)}" style="--mw-accent:${g.color}"><summary><span class="mw-category-icon">${g.icon}</span><span>${esc(g.name)}</span><small>${on ? `${on} of ${g.rows.length}` : g.rows.length}</small></summary><div class="mw-category-body mw-sk-list" ${open ? '' : `data-lazy="${esc(key)}"`}>${open ? g.rows.map(row).join('') : ''}</div></details>`; }).join('');
    return `<div class="mw-summary"><div class="mw-section-label">${chips ? 'Skills' : 'No skills yet'}<span>${skillsOf(state).length} set</span></div>
        <div class="mw-chips">${chips || `<p>Nothing set. Tap \u201c\uff0b Add skills\u201d and pick what ${whose} can do.</p>`}</div>
        ${diceBox()}
        <p class="mw-skill-now">${going.length ? `Going to Claude this reply: ${going.map(x => `${esc(x.label)} ${signed(x.level)}`).join(', ')}` : 'None this reply: skills go when the scene calls for them.'}</p></div>
    <div class="mw-tools"><input type="search" class="mw-search" data-skill-search placeholder="${browsing ? 'Search all skills\u2026' : `Search ${whose}\u2019s skills\u2026`}" aria-label="Search skills">${browsing ? '<button data-action="browse-done" class="mw-primary">\u2713 Done</button>' : '<button data-action="browse" class="mw-primary">\uff0b Add skills</button>'}</div>
    <p class="mw-explainer">${browsing ? `Tap a skill to give it to ${whose}: +1 to +10 for good at it, \u22121 to \u221210 for bad at it.` : `Every skill runs from \u221210 (hopeless) through 0 to +10 (master). Tap one to change it. \u2727 means it\u2019s in play this reply; \u25c6 means it\u2019s pinned.`}</p>
    <div class="mw-categories">${groups || `<p class="mw-explainer mw-empty-list">Nothing on ${whose}\u2019s list yet. Tap \u201c\uff0b Add skills\u201d.</p>`}</div>
    <p class="mw-fine" data-skill-empty hidden>No matching skills.</p>
    ${browsing ? '' : `<div class="mw-skill-opts"><label class="mw-field">Growth<select data-skill-pace aria-label="How fast skills grow and slip">${Object.entries(SKILL_PACE).map(([k, p]) => `<option value="${k}" ${pace === k ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}</select></label>
        <label class="mw-field">Look back<select data-skill-lookback aria-label="How far back skills look">${[[1, 'Your message + the last reply'], [2, '+ the last 2 replies'], [3, '+ the last 3 replies']].map(([v, l]) => `<option value="${v}" ${settings().skillLookback === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>`}
    ${open ? sheet() : ''}`;
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
// The sheet follows your finger down and closes when let go far enough or fast enough, like any iPhone sheet;
// a short pull springs back. Started anywhere on the sheet, so the handle, the title or the dial all work.
export function sheetSwipe(panel, redraw) {
    let drag = null;
    panel.addEventListener('touchstart', e => { const sheet = e.target.closest?.('.mw-sk-sheet');
        drag = sheet && e.touches.length === 1 ? { sheet, y: e.touches[0].clientY, x: e.touches[0].clientX, at: Date.now(), dy: 0, on: false } : null; }, { passive: true });
    panel.addEventListener('touchmove', e => { if (!drag) return; const t = e.touches[0], dy = t.clientY - drag.y, dx = t.clientX - drag.x;
        if (!drag.on) { if (dy < 8 || Math.abs(dx) > dy) { if (Math.abs(dx) > 12 || dy < -8) drag = null; return; } drag.on = true; drag.sheet.style.transition = 'none'; }
        e.preventDefault(); drag.dy = Math.max(0, dy); drag.sheet.style.transform = `translateY(${drag.dy}px)`; }, { passive: false });
    const end = () => { if (!drag?.on) { drag = null; return; } const { sheet, dy, at } = drag; drag = null;
        const fast = dy / Math.max(1, Date.now() - at) > 0.6, far = dy > Math.min(140, sheet.offsetHeight * 0.3);
        sheet.style.transition = 'transform .22s ease-out';
        if (fast || far) { sheet.style.transform = `translateY(${sheet.offsetHeight + 40}px)`; setTimeout(() => { ui.skillSheet = ''; redraw(); }, 200); }
        else sheet.style.transform = ''; };
    panel.addEventListener('touchend', end, { passive: true }); panel.addEventListener('touchcancel', end, { passive: true });
}
