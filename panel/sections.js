// The Moods, Traits, Body, Turn-ons and Story tabs: the catalogue list, the scene reader card
// and the per-section tools.
import { getCast, getKnowledge, playerName, profiles, selectedCast, subjectName, turnKnowledgeRows } from '../app/chat.js';
import { FEELINGS_COUNT, listedFeelings, scenePace } from '../app/note.js';
import { readerProfile, readerRequest, readerSubject, roughTokens, sceneStart } from '../app/reader.js';
import { boardMeta, boardSend, bondData, bondList } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { KEY, ctx, run, ui } from '../app/state.js';
import { cleanBoardMeta, latestBoard } from '../engine/board.js';
import { computeBond } from '../engine/bond.js';
import { BY_ID, CATEGORIES, MERGED_SEARCH_NAMES, MOODS, RECIPES, STORY_RECIPES, TRAIT_CATEGORIES, sectionOf } from '../data/catalogue.js';
import { KNOWLEDGE_MODES, activeMoods, cleanScope, knowledgeEntry } from '../engine/state.js';
import { escapeHtml as esc } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { MOOD_PACE } from '../engine/moodpace.js';
import { fmtTokens, row, tagLabel, turnRow } from './rows.js';
import { reactiveBlock } from './wants-tab.js';
import { personalityView } from './personality-tab.js';
import { activePersonalities } from '../engine/personality.js';
import { TURN_BY_ID, TURN_CATEGORIES, turnGroupKey } from '../engine/turns.js';

function knowledgePanel(state, ch) {
    const active = activeMoods(state).filter(m => m.kind !== 'story');
    const knowledge = getKnowledge(ch);
    return `<details class="mw-knowledge mw-advanced"><summary>What ${esc(ch.name)} knows <small>${active.length} active tags</small></summary>
        <p class="mw-fine">This covers your current feelings as well as traits and preferences. Scene only follows what they can see or already know. Private needs clues you actually give. Suspected is an impression they can act on but might get wrong. Known means they know, including how you feel now. Higher strengths should shape their response more; their own settings decide how. You still write your reactions.</p>
        <input type="search" id="mw-knowledge-search" data-filter-list="knowledge" placeholder="Find an active trait or mood…" aria-label="Search persona knowledge">
        ${active.length ? active.map(m => {
            const entry = knowledgeEntry(knowledge[m.id]);
            return `<div class="mw-knowledge-row" data-knowledge-row="${m.id}" data-filter-item="knowledge" data-search="${esc(tagLabel(m) + ' ' + m.cue + ' ' + (MERGED_SEARCH_NAMES[m.id] ?? []).join(' '))}"><label for="mw-knowledge-${m.id}">${esc(tagLabel(m))} <small>${level(state.moods[m.id])} · ${state.moods[m.id]}%</small></label>
                <select id="mw-knowledge-${m.id}" data-knowledge="${m.id}" aria-label="What ${esc(ch.name)} knows: ${esc(m.label)}">${KNOWLEDGE_MODES.map((mode, i) => `<option value="${mode}" ${entry.mode === mode ? 'selected' : ''}>${['Scene only', 'Private', 'Suspected', 'Known'][i]}</option>`).join('')}</select>
                ${['known', 'suspected'].includes(entry.mode) ? `<input type="text" maxlength="120" data-knowledge-source="${m.id}" aria-label="Source for ${esc(m.label)}" placeholder="How they learned it (optional)" value="${esc(entry.source)}">` : ''}</div>`;
        }).join('') : '<p class="mw-fine">Enable a persona tag and it will appear here.</p>'}
        <p class="mw-fine" data-filter-empty="knowledge" hidden>No matching active traits or moods.</p>
        <p class="mw-fine">Each active tag is sent once, with its existing strength. Source notes add tokens only when filled in. Turning a tag off stops sending it; its knowledge choice is kept for next time.</p></details>`;
}
const SECTION_LABEL = { mood: 'moodlets', trait: 'traits', turn: 'turn-ons', state: 'facts', story: 'story settings' };
// While the board is in play, the Body list is redundant: needs and physical state come from the board.
// Body options you'd already switched on still show and still send.
const boardCoversBody = () => boardSend() || Boolean(latestBoard(ctx().chat));
// Each person only shows their own list until you go looking for more.
function catalogueBlock(state, kind, ch, whose) { // kind is the tab's section: mood, trait, turn, state or story
    const listed = new Set([...(state.loadout ?? []), ...MOODS.filter(m => state.moods[m.id] > 0).map(m => m.id),
        ...Object.keys(state.prefs ?? {}).filter(id => state.prefs[id]).map(id => `turn:${id}`)]);
    const show = id => ui.browsing || listed.has(id);
    const sectionOfCategory = (id, k) => k === 'story' ? 'story' : TRAIT_CATEGORIES.has(id) ? 'trait' : k;
    const hideBody = kind === 'state' && boardCoversBody();
    const cats = kind === 'turn' ? '' : CATEGORIES.filter(([id, , , , , k = 'mood']) => sectionOfCategory(id, k) === kind).map(([id, name, icon, color, , k = 'mood']) => {
        const list = MOODS.filter(m => m.category === id && show(m.id) && !(hideBody && id === 'body' && !state.moods[m.id])), n = list.filter(m => state.moods[m.id]).length;
        if (!list.length) return '';
        return `<details data-category="${id}" data-kind="${sectionOfCategory(id, k)}" style="--mw-accent:${color}"><summary><span class="mw-category-icon">${icon}</span><span>${name}</span><small>${n ? `${n} on` : list.length}</small></summary><div class="mw-category-body">${list.map(m => row(m, state)).join('')}</div></details>`;
    }).join('');
    const turns = kind !== 'turn' ? '' : TURN_CATEGORIES.map(([group, icon, color, rows]) => {
        const list = rows.filter(([id]) => show(`turn:${id}`) && TURN_BY_ID[id]), key = turnGroupKey(group);
        if (!list.length) return '';
        const n = list.filter(([id]) => state.prefs?.[id]).length;
        return `<details data-category="${key}" data-kind="turn" class="mw-turn-group" style="--mw-accent:${color}"><summary><span class="mw-category-icon">${icon}</span><span>${group}</span><small>${n ? `${n} set` : list.length}</small></summary><div class="mw-category-body">${list.map(([id]) => turnRow(TURN_BY_ID[id], state)).join('')}</div></details>`;
    }).join('');
    const label = SECTION_LABEL[kind];
    return `<div class="mw-tools"><input id="mw-catalogue-search" class="mw-search" type="search" placeholder="${ui.browsing ? 'Search all ' : 'Search your '}${label}…" aria-label="Search ${label}" value="${esc(ui.search)}">${ui.browsing ? `<button data-action="browse-done" class="mw-primary">✓ Done</button>`
            : `<button data-action="browse" class="mw-primary">＋ Add ${label}</button>${kind === 'mood' || kind === 'story' ? `<select data-field="recipe" aria-label="Add a starter blend"><option value="">Starter blend…</option>${Object.keys(kind === 'story' ? STORY_RECIPES : RECIPES).map(r => `<option>${esc(r)}</option>`).join('')}</select>` : ''}`}</div>
    ${ui.browsing ? `<p class="mw-explainer">Everything available. Tap ＋ or move a slider to put it on ${esc(whose)}’s list.${hideBody ? ' Body is left out while the Needs board covers it.' : ''}</p>` : ''}
    <datalist id="mw-cast-names">${[ch.name, playerName(), ...getCast(ch).map(p => p.name)].map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist>
    <datalist id="mw-hate-names">${getCast(ch).filter(p => ui.who !== 'cast' || p.id !== selectedCast()?.id).map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
    ${!ui.browsing && !cats && !turns ? `<p class="mw-explainer mw-empty-list">Nothing on ${esc(whose)}’s list yet. Tap “＋ Add ${label}” to pick from everything.</p>` : ''}
    <div class="mw-categories ${kind === 'turn' ? 'mw-turn-categories' : ''}">${cats}${turns}</div><p class="mw-no-results" hidden>Nothing matches.</p>`;
}
// ---- Scene reader card (Moodlets tab) ----
export const SCOPES = [['mood', '✦', 'Moodlets'], ['body', '✚', 'Body'], ['trait', '❂', 'Traits'], ['wants', '☆', 'Wants']];
function readerBlock(state) {
    if (ui.who === 'story') return '';
    const allProfiles = profiles(), profile = readerProfile(), scope = cleanScope(state.readScope), subject = readerSubject();
    const anyScope = SCOPES.some(([k]) => scope[k]);
    const est = subject && anyScope ? roughTokens(readerRequest(subject, scope).messages) : 0;
    const start = sceneStart(), chatLen = ctx().chat?.length ?? 0;
    return `<details class="mw-reader" data-reader ${profile ? 'open' : ''}>
        <summary class="mw-reader-head"><span class="mw-reader-icon">✧</span><div><b>Scene reader</b><small>${profile ? `Reads the latest messages and moves ${esc(subjectName())}’s sliders. Pinned ◆ ones stay put.` : 'Optional, and an extra paid request per read. The hidden weave line already does this for free with every reply.'}</small></div></summary>
        <div class="mw-scope" role="group" aria-label="What to read">${SCOPES.map(([k, icon, label]) => `<button type="button" class="mw-scope-chip" data-scope="${k}" aria-pressed="${scope[k]}">${scope[k] ? '✓' : icon} ${label}</button>`).join('')}</div>${anyScope ? '' : '<p class="mw-fine mw-scope-none">Nothing ticked, so there’s nothing to read. Tap Moodlets to read feelings.</p>'}
        <div class="mw-reader-go"><button class="mw-primary mw-read" data-action="analyse" ${run.pending || !profile || !state.enabled || !anyScope ? 'disabled' : ''}>${run.pending ? 'Reading…' : '✧ Read the scene'}</button>${run.pending ? '<button data-action="cancel">Stop</button>' : `<button data-action="undo" ${!state.history?.length ? 'disabled' : ''} title="Undo the last read">↶ Undo</button>`}</div>
        <p class="mw-reader-meta">Last ${settings().sceneMessages} messages${start ? ' since your scene marker' : ''} · about ${fmtTokens(est)} tokens a read${scope.trait ? ' · traits roughly double it' : ''}</p>
        ${!profile ? '<p class="mw-fine mw-warn">Pick a connection for the reader below. A small, cheap model does the job.</p>' : ''}
        <details class="mw-tuning" data-reader-tuning><summary>Reader settings</summary>
            <label>Connection<select data-reader="profile"><option value="">Choose a connection profile…</option>${profile && !allProfiles.some(p => p.id === profile) ? `<option selected value="${esc(profile)}">Unavailable profile, choose another</option>` : ''}${allProfiles.map(p => `<option value="${esc(p.id)}" ${p.id === profile ? 'selected' : ''}>${esc(p.name)} · ${esc(p.model)}</option>`).join('')}</select></label>
            <div class="mw-seg-label">Recent messages it reads</div>
            <div class="mw-seg" role="group" aria-label="Recent messages">${[4, 6, 10, 16].map(n => `<button type="button" data-reader-msgs="${n}" aria-pressed="${settings().sceneMessages === n}">${n}</button>`).join('')}</div>
            <div class="mw-scene-mark">${start && start < chatLen ? `<span>⟲ Scene starts at message ${start + 1} of ${chatLen}</span><button type="button" data-action="scene-clear">Remove</button>`
                : `<button type="button" data-action="scene-mark">⟲ New scene starts at the latest message</button>`}</div>
            <p class="mw-fine">Mark the start of a new scene and nothing older ever gets read, however long the chat is.</p>
            <label>Follow the read <output data-follow-out>${state.follow}%</output><input type="range" min="10" max="100" data-field="follow" value="${state.follow}" style="--mw-fill:${(state.follow - 10) / .9}%" aria-label="Follow the read"></label>
            <p class="mw-fine">100 sets sliders exactly to what the reader sees. Lower keeps some of what you had.</p>
            <label class="mw-inline">Fade feelings the scene stops showing by <input aria-label="Fade rate" type="number" min="0" max="20" data-field="decay" value="${state.decay}"> a read</label>
            ${ui.who === 'char' ? `<label class="mw-toggle"><input type="checkbox" data-auto-read ${state.mode === 'dynamic' ? 'checked' : ''}> Read automatically before each reply</label>
            ${state.mode === 'dynamic' ? `<label class="mw-inline">Every <input aria-label="Read interval" type="number" min="1" max="10" data-field="interval" value="${state.interval}"> of your messages</label>` : ''}` : ''}
            <p class="mw-fine">Sends recent chat text${ui.who === 'char' ? ' and a short card excerpt' : ''} to that connection. One extra request per read.</p>
        </details>
    </details>`;
}
// What "Clear all" touches: this tab's sliders, pins and because-notes. Nothing else.
export function clearSection(s, kind) {
    if (kind === 'turn') { s.prefs = {}; return; }
    const causes = { ...s.causes };
    for (const m of MOODS) if (sectionOf(m) === kind) { s.moods[m.id] = 0; s.pins[m.id] = false; delete causes[m.id]; }
    s.causes = causes;
    if (kind === 'mood') s.reason = '';
}
const sectionCount = (s, kind) => kind === 'turn' ? Object.values(s.prefs ?? {}).filter(Boolean).length
    : MOODS.filter(m => s.moods[m.id] > 0 && sectionOf(m) === kind).length;
function typesBlock(state, ch) {
    const types = activePersonalities(state);
    return `<details class="mw-types" data-types><summary><span class="mw-category-icon">◈</span><span>Personality type</span><small>${types.length ? types.map(p => p.system === 'enneagram' ? `${p.type}${p.wing ? `w${p.wing}` : ''}` : p.type).join(' · ') : 'none'}</small></summary>
        ${personalityView({ state, isPlayer: ui.who === 'user', focus: ch.name, knowledge: getKnowledge(ch) })}</details>`;
}
export function sectionContent(state, kind, ch, active) {
    const shown = kind === 'turn' ? [] : active.filter(m => sectionOf(m) === kind && m.category !== 'relationship');
    const turnsSet = kind === 'turn' ? Object.entries(state.prefs ?? {}).filter(([id, v]) => v && TURN_BY_ID[id]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])) : [];
    const whose = ui.who === 'story' ? 'the story' : subjectName();
    const heading = { mood: 'Active moodlets', trait: 'Who they are', turn: 'Turn-ons & turn-offs', state: 'Facts', story: 'The story so far' }[kind];
    const empty = { mood: 'Nothing set. Start with a starter blend, move a slider or read the scene.', trait: 'Nothing set yet. Kinks, roles, temperament and morals go here.', turn: 'Nothing set yet. What they like or can’t stand in other people goes here.', state: 'Nothing set. Looks, background, job and the scene go here.', story: 'No genre or style set for this chat yet.' }[kind];
    const onHere = sectionCount(state, kind), what = { mood: 'moodlets', trait: 'traits', turn: 'turn-ons', state: 'facts', story: 'story settings' }[kind];
    const sparks = ['turn', 'trait'].includes(kind) && ui.who === 'char' && bondData(ch).on ? computeBond(bondData(ch), Infinity, 'one', 'the other', null, bondList(ch)).sparks.filter(x => kind === 'turn' ? !x.trait : x.trait) : [];
    const lit = new Set(sparks.filter(x => x.fresh && x.id).map(x => x.id)), litTraits = new Set(sparks.filter(x => x.fresh && x.trait).map(x => x.trait));
    const chips = turnsSet.map(([id, v]) => `<button data-jump="turn:${id}" class="mw-chip mw-chip-turn ${v < 0 ? 'is-off' : ''} ${lit.has(id) ? 'is-lit' : ''}" style="--mw-accent:${TURN_BY_ID[id].color}" title="${lit.has(id) ? 'Set off in the last reply. ' : ''}Adjust ${esc(TURN_BY_ID[id].label)}"><span>${lit.has(id) ? '✧' : v > 0 ? '♡' : '✕'} ${esc(TURN_BY_ID[id].label)}</span><b>${Math.abs(v)}</b><i style="width:${Math.abs(v)}%"></i></button>`).join('')
        + shown.map(m => `<button data-jump="${m.id}" class="mw-chip ${litTraits.has(m.id) ? 'is-lit' : ''}" style="--mw-accent:${m.color}" title="${litTraits.has(m.id) ? 'Set off in the last reply. ' : ''}Adjust ${esc(m.label)}"><span>${litTraits.has(m.id) ? '✧ ' : ''}${state.pins[m.id] ? '◆ ' : ''}${esc(tagLabel(m))}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`).join('');
    const explainer = ui.who === 'user' && kind === 'turn' ? `What ${esc(playerName())} likes or can’t stand in other people. The story works these in now and then; ${esc(ch.name)} only learns them from how you react.`
        : kind === 'turn' ? `What draws ${esc(whose)} in or puts them off: people, bodies, kinks, fetishes and acts. Slide right for a turn-on, left for a turn-off. When the story touches one it lights up ✧ and counts a step stronger next reply.`
        : ui.who === 'user' && ['mood', 'trait'].includes(kind) ? `How ${esc(playerName())} comes across. ${esc(ch.name)} reacts to it but never writes for you. Choose what ${esc(ch.name)} knows below.`
        : kind === 'trait' ? `Who ${esc(whose)} is underneath. Traits stay put unless you switch on ❂ Traits in the scene reader.` : '';
    return `<div class="mw-summary"><div class="mw-section-label">${shown.length || turnsSet.length ? heading : 'A clean slate'}<span>${shown.length + turnsSet.length} on${onHere ? ` · <button class="mw-clear" data-action="clear" title="Turn off this tab’s ${what}, pins too. Other tabs stay as they are">Clear ${what}</button>` : ''}</span></div>
        <div class="mw-chips">${chips || `<p>${empty}</p>`}</div>
        ${kind === 'turn' && ui.who === 'char' ? reactiveBlock(state, ch) : ''}
        ${sparks.length ? `<div class="mw-sparks"><small>Lit lately</small>${sparks.map(x => `<span class="mw-spark ${x.off ? 'is-off' : ''} ${x.fresh ? 'is-fresh' : ''}">${x.off ? '✕' : '✧'} ${esc(x.text)}</span>`).join('')}</div>` : ''}
        ${kind === 'mood' && state.reason ? `<div class="mw-observation">✧ ${esc(state.reason)}<small>Last scene read · ${esc(new Date(state.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</small></div>` : ''}</div>
    ${kind === 'mood' && ui.who === 'char' ? storyMoodBlock(state, ch) : ''}
    ${kind === 'mood' ? readerBlock(state) : ''}
    ${explainer ? `<p class="mw-explainer">${explainer}</p>` : ''}
    ${kind === 'trait' ? typesBlock(state, ch) : ''}
    ${['mood', 'trait'].includes(kind) && ui.who === 'user' ? knowledgePanel(state, ch) : ''}${kind === 'turn' && ui.who === 'user' ? turnKnowledgeRows(state, ch, getKnowledge(ch)) : ''}
    ${catalogueBlock(state, kind, ch, whose)}`;
}
export function lastMoodRec(ch) {
    const list = ctx().chatMetadata?.[KEY]?.applied?.[`char:${ch.avatar}`] ?? [];
    return list.at(-1) ?? null;
}
function storyMoodBlock(state, ch) {
    const bond = bondData(ch), feed = cleanBoardMeta(boardMeta()).feed, on = state.moodAuto !== false, fade = state.moodFade !== false, pace = scenePace(ch, state), linked = state.moodPaceLinked !== false && bond.on;
    const rec = lastMoodRec(ch), moved = Object.entries(rec?.m ?? {}).filter(([id]) => BY_ID[id]);
    const name = id => BY_ID[id].label;
    const step = ([id, [a, b]]) => `<span class="mw-moodstep ${rec.f?.includes(id) ? 'is-fade' : b > a ? 'is-up' : 'is-down'}">${esc(name(id))} ${b === 0 ? 'off' : `${b > a ? '+' : '−'}${Math.abs(b - a)}`}${rec.f?.includes(id) ? ' · fading' : ''}</span>`;
    const blocked = !bond.on ? 'Switch Bonds on for this character to use it: the hidden line comes with Bonds.' : !feed ? 'Replies are set not to update feelings (Board settings), so this is paused.' : '';
    return `<details class="mw-storymood" data-anchor="story-moods" ${on ? 'open' : ''}><summary><span>☾ The story moves moods</span><small>${on ? `${esc(pace.label)}${fade ? ', fading' : ''}` : 'off'}</small></summary>
        <label class="mw-toggle"><input type="checkbox" data-mood-auto ${on ? 'checked' : ''}> Each reply moves ${esc(ch.name)}’s feelings (free, no extra request)</label>
        ${blocked ? `<p class="mw-fine mw-scope-none">${blocked}</p>` : ''}
        ${on ? `<div class="mw-storymood-row"><label>Speed<select data-mood-pace aria-label="How fast feelings change" ${linked ? 'disabled' : ''}>${Object.entries(MOOD_PACE).map(([k, v]) => `<option value="${k}" ${(linked ? MOOD_PACE[k] === pace : state.moodPace === k || (!MOOD_PACE[state.moodPace] && k === 'steady')) ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
            <label class="mw-toggle"><input type="checkbox" data-mood-fade ${fade ? 'checked' : ''}> Fade</label></div>
        ${bond.on ? `<label class="mw-toggle mw-storymood-link"><input type="checkbox" data-mood-pace-link ${linked ? 'checked' : ''}> Same speed as Bonds (one speed for the whole scene)</label>` : ''}
        <label class="mw-storymood-which">Which feelings<select data-mood-scope aria-label="Which feelings the story can set">
            <option value="any" ${state.moodScope !== 'list' ? 'selected' : ''}>Any of the ${FEELINGS_COUNT} moods</option>
            <option value="list" ${state.moodScope === 'list' ? 'selected' : ''}>Only ${esc(ch.name)}’s list (${listedFeelings(state).length})</option></select></label>
        ${state.moodScope === 'list' ? `<p class="mw-fine">The hidden line is given the names on the list (about ${Math.ceil(listedFeelings(state).join(', ').length / 3.6)} tokens), and anything else it names is ignored. Add moods to the list from the catalogue below.</p>` : ''}
        <p class="mw-fine">${esc(pace.label)}, ${esc(pace.hint)}: up to ${pace.step} a reply.${fade ? ` A feeling nobody mentions for ${pace.after} repl${pace.after === 1 ? 'y' : 'ies'} loses ${pace.fade} a reply after that.` : ' Feelings stay until the story turns them down.'} Pinned ◆ ones never move.</p>
        ${moved.length ? `<div class="mw-moodlast"><small>Last reply</small><div>${moved.map(step).join('')}</div><button type="button" data-action="mood-undo-last">↶ Undo</button></div>` : rec?.undone ? '<p class="mw-fine">Last reply’s changes were undone.</p>' : ''}` : ''}</details>`;
}
