// Direct the scene (2.0): the player says in her own words where she wants things to go. One short out-of-character
// request to the roleplay model turns that into plain lines, and Moodweaver matches those words to its own catalogue
// (feelings, facts, story rows, dial steps), so only real names come back. They show as chips; nothing goes in until
// she adds them. What's added is a starting point the story keeps moving, unless \u25c6 holds it (a pin).
import { BY_ID, MOODS, isAuthor } from '../data/catalogue.js';
import { factsIn, feelingsFromBoard } from '../engine/board.js';
import { DIALS } from '../engine/dials.js';
import { shortName } from '../engine/util.js';
import { getState, getStoryState, getUserState, persist, playerName, target } from './chat.js';
import { syncPrompt } from './note.js';
import { ctx, ui } from './state.js';

const LEVEL = { faint: 8, subtle: 15, mild: 30, clear: 50, strong: 70, intense: 85, overwhelming: 95, maximum: 100 };
const STRENGTH = 'faint, subtle, mild, clear, strong, intense, overwhelming or maximum';
const ask = (text, n, u) => `[Out of character. Don't continue the story. The player wants to steer the scene this way: ${text}
Turn that into exactly these five lines and nothing else, in plain words. Leave a line empty after its colon when the player's words don't touch it.
${n} feels: up to five feelings, each followed by a strength word (${STRENGTH}), comma separated
${n} facts: things that become true of ${n}'s body, clothes, condition or situation, comma separated
${u} feels: up to five feelings with a strength word each, comma separated
${u} facts: things that become true of ${u}, comma separated
story: up to three things about how the story runs or what it's about (genre, trope, theme, how wild, how dangerous, how feelings come out, how it ends), comma separated]`;

// Story rows by name: genres, tropes, dark pressure, stakes and writing rows, not authors, point of view or craft.
const norm = s => String(s ?? '').toLowerCase().replace(/\s*\(.*\)\s*$/, '').replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ').trim();
let STORY = null;
const storyRows = () => STORY ??= MOODS.filter(m => m.kind === 'story' && !isAuthor(m) && !['viewpoint', 'craft', 'era'].includes(m.category))
    .flatMap(m => [norm(m.label), ...(m.words ?? []).map(norm)].filter(k => k.length >= 4).map(k => [k, m])).sort((a, b) => b[0].length - a[0].length);
const DIAL_STEPS = DIALS.flatMap(d => d.steps.map((s, i) => [norm(s[1]), d, i]).filter(([, , i]) => i !== 1)).sort((a, b) => b[0].length - a[0].length);
function storyHits(line) {
    const out = [];
    for (const part of String(line ?? '').split(',').map(norm).filter(Boolean).slice(0, 3)) {
        const dial = DIAL_STEPS.find(([k]) => ` ${part} `.includes(` ${k} `));
        if (dial) { out.push({ kind: 'dial', key: dial[1].key, step: dial[2], label: `${dial[1].title}: ${dial[1].steps[dial[2]][1].toLowerCase()}` }); continue; }
        const row = storyRows().find(([k]) => ` ${part} `.includes(` ${k} `) || (part.length >= 5 && k.startsWith(part)));
        if (row) out.push({ kind: 'story', id: row[1].id, value: 60, label: row[1].label });
    }
    return out;
}

export function parseDirect(text, n, u) {
    const got = { cf: '', cx: '', uf: '', ux: '', story: '' }, nl = n.toLowerCase(), ul = u.toLowerCase();
    // "Damien feels", "Damien Vale feels" or "**Damien** feels": the name decides whose line it is.
    const keyOf = label => { const l = label.replace(/[*_]/g, '').trim().toLowerCase(), kind = l.match(/\b(feels|facts)$/)?.[1];
        if (l === 'story') return 'story'; if (!kind) return '';
        const who = l.startsWith(ul) ? 'u' : l.startsWith(nl) ? 'c' : ''; return who ? `${who}${kind === 'feels' ? 'f' : 'x'}` : ''; };
    for (const line of String(text ?? '').split('\n')) {
        const m = line.match(/^\s*[-*]?\s*([^:]{2,60}):\s*(.*)$/); if (!m) continue;
        const k = keyOf(m[1]); if (k && !got[k]) got[k] = m[2].trim().replace(/^(none|nothing|n\/a|-)\.?$/i, '');
    }
    const items = [], seen = new Set();
    const add = (who, item) => { const key = `${who}:${item.id ?? `${item.key}`}`; if (seen.has(key)) return; seen.add(key); items.push({ who, on: true, hold: false, ...item }); };
    for (const [who, feel, fact] of [['char', got.cf, got.cx], ['user', got.uf, got.ux]]) {
        // Each feeling is read on its own, so its strength word stays with it; the word sets the value.
        for (const part of feel.split(',').map(x => x.trim()).filter(Boolean).slice(0, 5)) {
            const said = part.toLowerCase().match(new RegExp(`\\b(${Object.keys(LEVEL).join('|')})\\b`))?.[1];
            const f = feelingsFromBoard({ state: said ? part.replace(new RegExp(`\\b${said}\\b`, 'i'), ' ') : part })[0], m = f && BY_ID[f.id];
            if (m) add(who, { kind: 'mood', id: m.id, value: said ? LEVEL[said] : f.value, label: `${m.label}${said ? `, ${said}` : ''}` });
        }
        for (const id of [...factsIn(fact, false, true)].slice(0, 4)) { const m = BY_ID[id]; if (m) add(who, { kind: 'fact', id, value: 60, label: m.label }); }
    }
    for (const hit of storyHits(got.story)) add('story', hit);
    return items;
}

export async function directScene(text) {
    const ch = target(), n = shortName(ch?.name ?? '{{char}}'), u = shortName(playerName());
    ui.direct = { text, loading: true, items: [], note: '' };
    let reply = '';
    try { reply = await ctx().generateQuietPrompt({ quietPrompt: ask(text, n, u), responseLength: 300 }); }
    catch (err) { console.warn('[Moodweaver] direct the scene failed', err); }
    const items = parseDirect(reply, n, u);
    ui.direct = { text, loading: false, items, note: items.length ? '' : 'Nothing in Moodweaver\u2019s lists matched that. Try saying it another way, or tap to try again.' };
}

// Adds what's kept to whoever it's about. Feelings and facts go in at their strength (never lowering one already
// higher); held ones are pinned. Dial steps move the story's dials.
export async function applyDirect() {
    const kept = (ui.direct?.items ?? []).filter(i => i.on), ch = target();
    const states = { char: getState(ch), user: getUserState(), story: getStoryState(ch) }, touched = new Set();
    for (const i of kept) {
        const st = states[i.who]; if (!st) continue;
        if (i.kind === 'dial') { if (i.key === 'turns') st.dial = i.step; else (st.dials ??= {})[i.key] = i.step; st.enabled = true; }
        else {
            st.enabled = true; st.moods[i.id] = Math.max(st.moods[i.id] ?? 0, i.value);
            if (!st.loadout.includes(i.id)) st.loadout.push(i.id);
            if (i.hold) (st.pins ??= {})[i.id] = true;
        }
        touched.add(st);
    }
    ui.direct = null;
    for (const st of touched) await persist(st);
    await syncPrompt();
}

const escAttr = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
export function directBlock(n, u) {
    const r = ui.direct, busy = r?.loading;
    const box = `<div class="mw-direct-row"><textarea data-direct-text rows="2" maxlength="400" aria-label="Direct the scene" placeholder="Where do you want the scene to go?"${busy ? ' disabled' : ''}>${escAttr(r?.text ?? '')}</textarea>
        <button type="button" class="mw-primary" data-action="direct"${busy ? ' disabled' : ''}>${busy ? '\u2726 Reading\u2026' : '\u2726 Direct'}</button></div>`;
    if (!r || busy || !r.items.length) return `<section class="mw-direct"><h4>Direct the scene</h4>${box}${r?.note ? `<small>${r.note}</small>` : ''}</section>`;
    const who = { char: n, user: u, story: 'The story' };
    const groups = ['char', 'user', 'story'].map(w => [w, r.items.map((i, k) => [i, k]).filter(([i]) => i.who === w)]).filter(([, l]) => l.length);
    return `<section class="mw-direct is-open"><h4>Direct the scene</h4>${box}<p class="mw-fine">Tap any you don\u2019t want. \u25c6 holds one so the story can\u2019t move it.</p>
        ${groups.map(([w, list]) => `<div class="mw-direct-group"><small>${escAttr(who[w])}</small><div class="mw-card-chips">${list.map(([i, k]) =>
            `<span class="mw-direct-chip"><button type="button" class="mw-card-chip ${i.on ? 'is-on' : ''}" data-direct-pick="${k}" aria-pressed="${i.on}">${escAttr(i.label)}</button>${i.kind === 'dial' ? '' : `<button type="button" class="mw-direct-hold${i.hold ? ' is-on' : ''}" data-direct-hold="${k}" aria-pressed="${i.hold}" aria-label="Hold ${escAttr(i.label)}">\u25c6</button>`}</span>`).join('')}</div></div>`).join('')}
        <div class="mw-card-actions"><button type="button" class="mw-primary" data-action="direct-apply">\uff0b Add ${r.items.filter(i => i.on).length}</button><button type="button" data-action="direct-cancel">Not now</button></div></section>`;
}
