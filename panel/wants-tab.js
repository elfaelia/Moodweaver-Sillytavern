// The Wants tab and the You tab (your persona's condition).
import { getKnowledge, playerName, subjectName } from '../app/chat.js';
import { bondAxes, bondData, bondList, liveChat, liveFor, reactions } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { ui } from '../app/state.js';
import { WANT_KINDS, activeMoods, knowledgeEntry } from '../engine/state.js';
import { computeBond } from '../engine/bond.js';
import { moodTone } from '../engine/tone.js';
import { escapeHtml as esc, shortName } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { sectionOf } from '../data/catalogue.js';
import { COMBOS, cleanCombos } from '../engine/reactive.js';
import { TURN_BY_ID } from '../engine/turns.js';

// ---- Wants, goals & fears ----
const WANT_META = {
    want: ['☆', 'Wants', 'What they’re after right now', '#e5ca7f', 'e.g. get him to admit it'],
    goal: ['⚑', 'Goals', 'Bigger aims that play out over time', '#8fcebc', 'e.g. take over the family firm'],
    fear: ['☾', 'Fears', 'What they dread or avoid', '#b0a5e8', 'e.g. being left again'],
    button: ['⚡', 'Hot buttons', 'When this happens → how they react', '#e79a7a', 'e.g. someone is kind to them → awkward, deflects with a joke'],
};
const STATUS_BADGE = { '+': ['is-up', '↑ closer last reply'], '-': ['is-down', '↓ blocked last reply'], touched: ['is-down', '☾ came near last reply'], pressed: ['is-hot', '⚡ pressed last reply'] };
function wantRow(w, status = '') {
    const badge = STATUS_BADGE[status];
    return `<div class="mw-mood mw-want ${badge ? `mw-want-lit ${badge[0]}` : ''}" data-want-row="${esc(w.id)}" data-filter-item="wants"><textarea class="mw-want-text" data-want-text="${esc(w.id)}" maxlength="120" rows="1" aria-label="${esc(w.kind)}">${esc(w.text)}</textarea>
        <div class="mw-want-controls"><input type="range" min="0" max="100" step="1" value="${w.value}" data-want-value="${esc(w.id)}" style="--mw-fill:${w.value}%" aria-label="How much it drives them">
        <span data-lvl>${level(w.value)}</span><o>${w.value}%</o>
        <button type="button" class="mw-list mw-tick" data-want-done="${esc(w.id)}" title="${['fear', 'button'].includes(w.kind) ? 'Over it: stop sending' : 'Came true: stop sending'}" aria-label="Done">✓</button><button type="button" class="mw-list" data-want-remove="${esc(w.id)}" title="Delete" aria-label="Delete">×</button></div>
        ${badge ? `<small class="mw-want-status">${badge[1]}</small>` : ''}${w.read ? '<small class="mw-from-scene">✧ picked up from the scene</small>' : ''}</div>`;
}
export function wantsView(state, ch) {
    const items = state.wants ?? [], name = subjectName(), done = items.filter(w => w.done);
    const react = ui.who === 'char' ? reactions(ch) : null, storyDone = react ? items.filter(w => !w.done && react.done.has(w.id)) : [];
    const intro = ui.who === 'user' ? `What ${esc(name)} is after and afraid of. ${esc(ch.name)} doesn’t know these unless you show them, but the story gives you openings now and then and brushes up against your fears.`
        : `What drives ${esc(name)}. Each reply they take a step toward the strongest want when the scene allows, and the hidden line reports what moved: these light up when the story pushes them closer, blocks them, touches a fear or presses a hot button.`;
    return `<section class="mw-wants"><p class="mw-explainer">${intro}</p>
        ${storyDone.length ? `<div class="mw-want-card mw-want-story" style="--mw-accent:#8fd18a"><div class="mw-want-head"><span class="mw-want-icon">✓</span><div><b>The story says these came true</b><small>No longer sent. Swiping that reply brings them back.</small></div></div>
            ${storyDone.map(w => `<div class="mw-done-row"><span>${WANT_META[w.kind][0]} ${esc(w.text)}</span><button type="button" class="mw-list" data-want-done="${esc(w.id)}" title="Keep it done">✓</button><button type="button" class="mw-list" data-want-notyet="${esc(w.id)}" data-at="${react.doneAt.get(w.id) ?? -1}" title="Not yet: keep sending it">↺</button></div>`).join('')}</div>` : ''}
        ${react?.suggest.length ? `<div class="mw-want-card mw-want-suggest" style="--mw-accent:#e5ca7f"><div class="mw-want-head"><span class="mw-want-icon">✧</span><div><b>The story suggests</b><small>Things ${esc(name)} started wanting lately. Add one with a tap.</small></div></div>
            ${react.suggest.map(x => `<div class="mw-done-row"><span>☆ ${esc(x.text)}</span><button type="button" class="mw-list" data-want-suggest="${esc(x.text)}" title="Add as a want">＋</button><button type="button" class="mw-list" data-want-dismiss="${esc(x.text)}" title="Not this one">×</button></div>`).join('')}</div>` : ''}
        ${WANT_KINDS.map(kind => {
            const [icon, title, sub, color, hint] = WANT_META[kind], list = items.filter(w => w.kind === kind && !w.done && !storyDone.includes(w));
            return `<div class="mw-want-card" style="--mw-accent:${color}">
                <div class="mw-want-head"><span class="mw-want-icon">${icon}</span><div><b>${title}</b><small>${sub}</small></div>${list.length ? `<em>${list.length}</em>` : ''}</div>
                ${list.map(w => wantRow(w, react?.wants.get(w.id) ?? '')).join('') || `<p class="mw-want-empty">${kind === 'fear' ? 'Nothing scares them yet.' : kind === 'goal' ? 'No big plans yet.' : kind === 'button' ? 'Nothing sets them off yet. Write “when this happens → this reaction”.' : 'Nothing they’re after yet.'}</p>`}
                <div class="mw-cast-add mw-want-add"><input type="text" data-want-new="${kind}" maxlength="120" enterkeyhint="done" placeholder="${esc(hint)}" aria-label="New ${title.toLowerCase().slice(0, -1)}"><button type="button" data-action="want-add" data-kind="${kind}" aria-label="Add">＋</button></div></div>`;
        }).join('')}
        ${done.length ? `<details class="mw-want-done" data-want-done-list><summary>Came true or let go <small>${done.length}</small></summary>${done.map(w => `<div class="mw-done-row"><span>${WANT_META[w.kind][0]} ${esc(w.text)}</span><button type="button" class="mw-list" data-want-restore="${esc(w.id)}" title="Bring back">↺</button><button type="button" class="mw-list" data-want-remove="${esc(w.id)}" title="Delete">×</button></div>`).join('')}</details>` : ''}
        ${ui.who === 'char' ? `<label class="mw-toggle mw-wants-tip"><input type="checkbox" data-setting-bool="wantSuggest" ${settings().wantSuggest ? 'checked' : ''}> Let the story suggest new wants (when there are fewer than three)</label>` : ''}
        <p class="mw-fine mw-wants-tip">Needs the hidden weave line (Bonds tab). The scene reader’s ☆ Wants switch still works too.</p>
    </section>`;
}
// Your own character's tab. No needs (you play them): what you're wearing, what the story has done
// to your body, and the moodlets you've set, at a glance.
// Combos firing now, cravings building, and your own combos, on the character's Turn-ons tab.
export function reactiveBlock(state, ch) {
    if (!bondData(ch).on) return '';
    const r = reactions(ch, liveChat(), liveFor(ch)), name = esc(shortName(ch.name));
    const things = [...Object.entries(state.prefs ?? {}).filter(([id, v]) => v > 0 && TURN_BY_ID[id]).map(([id]) => [`turn:${id}`, `✧ ${TURN_BY_ID[id].label} lights up`]),
        ...activeMoods(state).filter(m => sectionOf(m) === 'mood').map(m => [`mood:${m.id}`, `◇ ${m.label} (clear or above)`]),
        ...activeMoods(state).filter(m => sectionOf(m) === 'intimacy').map(m => [`trait:${m.id}`, `❂ ${m.label} lights up`]),
        ['button', '⚡ a hot button goes off'], ...['hunger', 'energy', 'bladder', 'hygiene', 'comfort', 'social', 'fun', 'health'].map(id => [`need:${id}`, `◔ ${id} is low`])];
    const opts = attr => `<select ${attr}><option value="">Choose…</option>${things.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`;
    const label = token => things.find(([v]) => v === token)?.[1] ?? token;
    const own = cleanCombos(state.combos);
    return `${r.combos.length ? `<div class="mw-combo">${r.combos.map(c => `<div><b>⚡ ${esc(c.name)}</b><small>${esc(c.text)}</small></div>`).join('')}</div>` : ''}
        ${r.craving.size ? `<div class="mw-sparks mw-cravings"><small>Craving</small>${[...r.craving].map(([id, gap]) => `<span class="mw-spark is-craving" title="Not lit for ${gap} replies">◌ ${esc(TURN_BY_ID[id]?.label ?? id)} <b>${gap}</b></span>`).join('')}</div>` : ''}
        <details class="mw-combo-settings"><summary>Combos &amp; cravings</summary>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="combosOn" ${settings().combosOn ? 'checked' : ''}> Combos: two things at once fire a bigger effect</label>
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="cravingsOn" ${settings().cravingsOn ? 'checked' : ''}> Cravings: strong turn-ons that haven’t lit in a while pull ${name} toward them</label>
            <p class="mw-fine">Built in: ${COMBOS.map(([n]) => esc(n)).join(', ')}. Strong turn-ons crave after 8 quiet replies, intense ones after 5. All ${settings().combosOn || settings().cravingsOn ? '' : 'off, so nothing is '}worked out from the replies still in the chat, so a swipe undoes it.</p>
            <b class="mw-pre-label">${name}’s own combos</b>
            ${own.map(c => `<div class="mw-done-row"><span><b>${esc(c.name)}</b>: ${esc(label(c.a))} + ${esc(label(c.b))}</span><button type="button" class="mw-list" data-combo-remove="${esc(c.id)}" title="Delete">×</button></div>`).join('') || '<p class="mw-fine">None yet.</p>'}
            <div class="mw-combo-maker">${opts('data-combo-a aria-label="First thing"')}<span>+</span>${opts('data-combo-b aria-label="Second thing"')}
                <input type="text" data-combo-name maxlength="40" placeholder="Name (e.g. Claim)"><input type="text" data-combo-text maxlength="160" placeholder="What happens (e.g. he has to put her back in her place)">
                <button type="button" data-action="combo-add" class="mw-primary">＋ Add combo</button></div>
        </details>`;
}
export function youView(state, ch, live) {
    const me = playerName(), them = shortName(ch.name), track = settings().youTrack;
    const react = track ? reactions(ch) : null, tone = moodTone(state.moods);
    const moods = activeMoods(state).filter(m => sectionOf(m) === 'mood'), lead = moods[0];
    const where = live?.found ? [live.time, live.location].filter(Boolean).join(' · ') : '';
    const bond = bondData(ch), d = bond.on ? computeBond(bond, liveChat().length, them, shortName(me), bondAxes(ch), bondList(ch)) : null;
    // What the character has to go on: tags they know or suspect, out of everything set on you.
    const tags = [...activeMoods(state).map(m => m.id), ...Object.keys(state.prefs ?? {}).filter(id => state.prefs[id]).map(id => `turn:${id}`)];
    const knowledge = getKnowledge(ch), aware = tags.filter(k => ['known', 'suspected'].includes(knowledgeEntry(knowledge[k]).mode)).length;
    const counts = [['trait', '❂', 'Traits', activeMoods(state).filter(m => sectionOf(m) === 'trait').length],
        ['intimacy', '⚘', 'Intimacy', activeMoods(state).filter(m => sectionOf(m) === 'intimacy').length],
        ['turn', '⇋', 'Turn-ons', Object.values(state.prefs ?? {}).filter(Boolean).length],
        ['wants', '☆', 'Wants', (state.wants ?? []).filter(w => !w.done).length],
        ['mood', '◉', 'Known', tags.length ? `${aware}/${tags.length}` : '0']];
    const bar = (label, value, word) => `<div class="mw-you-bar"><span>${label}</span><i style="--mw-at:${Math.abs(value) / 2}%;--mw-side:${value < 0 ? 'right' : 'left'}" class="${value < 0 ? 'is-neg' : ''}"></i><b>${esc(word)}</b></div>`;
    return `<section class="mw-you" style="--mw-aura:${tone.lead};--mw-aura-2:${tone.shade}">
        <div class="mw-you-hero">
            <div class="mw-you-orb" aria-hidden="true"><span>${esc(me.charAt(0).toUpperCase())}</span></div>
            <div class="mw-you-id"><small class="mw-you-kicker">Right now</small><b>${lead ? esc(lead.label) : 'Even keel'}</b><small>${where ? esc(where) : 'No info board yet'}</small>
                ${lead ? `<button type="button" class="mw-you-mood" data-tab="mood" style="--mw-accent:${tone.lead}">${esc(level(state.moods[lead.id]))} · change</button>`
                : '<button type="button" class="mw-you-mood is-empty" data-tab="mood">＋ Set a mood</button>'}</div>
        </div>
        ${moods.length > 1 ? `<div class="mw-you-also">${moods.slice(1, 6).map(m => `<span style="--mw-accent:${m.color}">${esc(m.label)}</span>`).join('')}${moods.length > 6 ? `<span class="is-more">+${moods.length - 6}</span>` : ''}</div>` : ''}
        <div class="mw-you-glance">${counts.map(([tab, icon, label, n]) => `<button type="button" data-tab="${tab}"><b>${n}</b><span><i aria-hidden="true">${icon}</i>${label}</span></button>`).join('')}</div>
        ${d ? `<div class="mw-you-card mw-you-seen">
            <h4>How ${esc(them)} sees you${bond.extra ? `<small>${esc(d.dynamic.name)}</small>` : ''}<button type="button" class="mw-you-link" data-tab="rel">Bonds ›</button></h4>
            ${bar('Friendship', d.f, d.friend)}${bar('Romance', d.r, d.romance)}${bond.extra ? bar('Trust', d.t, d.trust) : ''}
            ${d.thinks.length ? `<p class="mw-you-thinks">${esc(them)} thinks you’re ${d.thinks.slice(0, 4).map(t => `<span>${esc(t.text)}</span>`).join('')}</p>` : ''}
        </div>` : ''}
        <div class="mw-you-card">
            <h4><span aria-hidden="true">🧥</span> Wearing</h4>
            <p class="${live?.userOutfit ? '' : 'is-empty'}">${esc(live?.userOutfit) || 'Nothing on the board yet. The next info board fills this in.'}</p>
        </div>
        <div class="mw-you-card">
            <h4><span aria-hidden="true">✚</span> Condition<small>${track ? 'what the story has done to you' : 'not tracked'}</small></h4>
            ${!track ? '<p class="is-empty">Off. Switch it on below to keep injuries and the like between replies.</p>'
            : react.condition.length ? `<div class="mw-you-tags">${react.condition.map(t => `<span>${esc(t)}</span>`).join('')}</div>`
            : '<p class="is-empty">Unhurt. Injuries, drugs, soaked clothes or rope burns land here from the hidden line and stay until you heal.</p>'}
            <label class="mw-toggle"><input type="checkbox" data-setting-bool="youTrack" ${track ? 'checked' : ''}> Track ${esc(me)}’s condition (all chats)</label>
        </div>
    </section>`;
}
