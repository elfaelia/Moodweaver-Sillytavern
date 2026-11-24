// The Moods, Traits, Body, Turn-ons and Story tabs: the catalogue list, the scene reader card
// and the per-section tools.
import { getCast, getKnowledge, getState, getUserState, playerName, profiles, selectedCast, subjectName, turnKnowledgeRows } from '../app/chat.js';
import { FEELINGS_COUNT, listedFeelings, movePace, scenePace } from '../app/note.js';
import { readerProfile, readerRequest, readerSubject, roughTokens, sceneStart } from '../app/reader.js';
import { boardMeta, boardSend, bondData, bondList, chatSigns, knowledgeNow, opinionsNow, pronounsFor, secretsNow } from '../app/replies.js';
import { effectiveChat } from '../engine/ledger.js';
import { settings } from '../app/settings.js';
import { cardReadBlock } from '../app/card-read.js';
import { KEY, ctx, run, ui } from '../app/state.js';
import { cleanBoardMeta, latestBoard } from '../engine/board.js';
import { computeBond } from '../engine/bond.js';
import { DIALS, stepOf } from '../engine/dials.js';
import { BY_ID, CATEGORIES, MERGED_SEARCH_NAMES, MOODS, RECIPES, STORY_RECIPES, sectionOf } from '../data/catalogue.js';
import { KNOWLEDGE_MODES, activeMoods, cleanScope, knowledgeEntry } from '../engine/state.js';
import { escapeHtml as esc, shortName } from '../engine/util.js';
import { level } from '../engine/strength.js';
import { MOOD_PACE } from '../engine/moodpace.js';
import { courseNote, fmtTokens, inventoryView, row, tagLabel, turnRow } from './rows.js';
import { reactiveBlock } from './wants-tab.js';
import { personalityView } from './personality-tab.js';
import { activePersonalities } from '../engine/personality.js';
import { FAMILY_MAX, FAVS, TURN_BY_ID, TURN_CATEGORIES, cleanAge, compareProfiles, familyMembers, turnGroupKey } from '../engine/turns.js';
import { periodEra } from '../engine/period.js';

function knowledgePanel(state, ch) {
    const active = activeMoods(state).filter(m => m.kind !== 'story');
    const knowledge = getKnowledge(ch);
    return `<details class="mw-knowledge mw-advanced"><summary>What ${esc(ch.name)} knows <small>${active.length} active tags</small></summary>
        <p class="mw-fine">Scene: only what they can see. Private: they need clues from you. Suspected: a guess they can act on. Known: they know.</p>
        <input type="search" id="mw-knowledge-search" data-filter-list="knowledge" placeholder="Find an active trait or mood\u2026" aria-label="Search persona knowledge">
        ${active.length ? active.map(m => {
            const entry = knowledgeEntry(knowledge[m.id]);
            return `<div class="mw-knowledge-row" data-knowledge-row="${m.id}" data-filter-item="knowledge" data-search="${esc(tagLabel(m) + ' ' + m.cue + ' ' + (MERGED_SEARCH_NAMES[m.id] ?? []).join(' '))}"><label for="mw-knowledge-${m.id}">${esc(tagLabel(m))} <small>${level(state.moods[m.id])} \u00b7 ${state.moods[m.id]}%</small></label>
                <select id="mw-knowledge-${m.id}" data-knowledge="${m.id}" aria-label="What ${esc(ch.name)} knows: ${esc(m.label)}">${KNOWLEDGE_MODES.map((mode, i) => `<option value="${mode}" ${entry.mode === mode ? 'selected' : ''}>${['Scene only', 'Private', 'Suspected', 'Known'][i]}</option>`).join('')}</select>
                ${['known', 'suspected'].includes(entry.mode) ? `<input type="text" maxlength="120" data-knowledge-source="${m.id}" aria-label="Source for ${esc(m.label)}" placeholder="How they learned it (optional)" value="${esc(entry.source)}">` : ''}</div>`;
        }).join('') : '<p class="mw-fine">Nothing on yet.</p>'}
        <p class="mw-fine" data-filter-empty="knowledge" hidden>No matching active traits or moods.</p>
        </details>`;
}
const SECTION_LABEL = { mood: 'moodlets', trait: 'traits', psyche: 'mind settings', intimacy: 'intimacy', turn: 'turn-ons', state: 'facts', story: 'story settings' };
// Which catalogue list the open tab shows. Tabs that aren't a list (Needs, Bonds, Items...) fall back to moodlets.
// The catalogue section the open tab shows. Your You tab holds your facts.
export const tabKind = () => ui.who === 'story' ? 'story' : ui.who === 'user' && ui.tab === 'needs' ? 'state' : ['trait', 'psyche', 'intimacy', 'turn', 'state'].includes(ui.tab) ? ui.tab : 'mood';
// While the board is in play, the Body list is redundant: needs and physical state come from the board.
// Body options you'd already switched on still show and still send.
const boardCoversBody = () => boardSend() || Boolean(latestBoard(ctx().chat));
// Each person only shows their own list until you go looking for more.
function catalogueBlock(state, kind, ch, whose) { // kind is the tab's section: mood, trait, intimacy, turn, state or story
    const listed = new Set([...(state.loadout ?? []), ...MOODS.filter(m => state.moods[m.id] > 0).map(m => m.id),
        ...Object.keys(state.prefs ?? {}).filter(id => state.prefs[id]).map(id => `turn:${id}`)]);
    const show = id => ui.browsing || listed.has(id);
    const hideBody = kind === 'state' && boardCoversBody();
    // Story groups hidden in Settings \u203a Panel (old or modern authors, smut style\u2026) don't show here at all.
    const hiddenGroups = new Set(kind === 'story' ? settings().hiddenGroups ?? [] : []);
    // Browsing everything: a folded group's rows are only drawn when it's opened (see fillLazy), which keeps
    // a slider move in the full list quick now that the lists are long.
    const body = (key, count, rows) => {
        if (ui.browsing && !ui.search && !ui.openGroups?.[`details[data-category="${key}"]`]) { ui.lazyBodies.set(key, rows); return `<div class="mw-category-body" data-lazy="${key}" data-count="${count}"></div>`; }
        return `<div class="mw-category-body">${rows()}</div>`;
    };
    // Facts come in two halves: what's going on with their body right now, and who they are.
    let half = '';
    const halfHead = id => { if (kind !== 'state') return ''; const now = NOW_CATEGORIES.has(id) ? 'now' : 'who'; if (now === half) return ''; half = now; return `<h5 class="mw-fact-head">${now === 'now' ? 'Right now <small>wears off or changes as the story goes</small>' : 'Who they are <small>stays put</small>'}</h5>`; };
    const cats = kind === 'turn' ? '' : CATEGORIES.filter(([id, , , , , k = 'mood']) => sectionOf({ category: id, kind: k }) === kind).map(([id, name, icon, color]) => {
        if (kind === 'story' && hiddenGroups.has(id)) return '';
        const list = MOODS.filter(m => m.category === id && show(m.id) && !m.size && !(hideBody && id === 'body' && !state.moods[m.id])), n = list.filter(m => state.moods[m.id]).length;
        if (!list.length) return '';
        return `${halfHead(id)}<details data-category="${id}" data-kind="${kind}" style="--mw-accent:${color}"><summary><span class="mw-category-icon">${icon}</span><span>${name}</span><small>${n ? `${n} on` : list.length}</small></summary>${body(id, list.length, () => list.map(m => row(m, state)).join(''))}</details>`;
    }).join('');
    const turns = kind !== 'turn' ? '' : TURN_CATEGORIES.map(([group, icon, color, rows]) => {
        const list = rows.filter(([id]) => show(`turn:${id}`) && TURN_BY_ID[id]), key = turnGroupKey(group);
        if (!list.length) return '';
        const n = list.filter(([id]) => state.prefs?.[id]).length;
        // Long lists get a small heading per sub-group (Face, Build\u2026); a short personal list doesn't need them.
        const rowsHtml = () => list.length <= 8 ? list.map(([id]) => turnRow(TURN_BY_ID[id], state)).join('')
            : Object.entries(Object.groupBy(list, r => r[5])).map(([sub, subRows]) => `<div class="mw-sub"><h5 class="mw-subhead">${esc(sub)}</h5>${subRows.map(([id]) => turnRow(TURN_BY_ID[id], state)).join('')}</div>`).join('');
        return `<details data-category="${key}" data-kind="turn" class="mw-turn-group" style="--mw-accent:${color}"><summary><span class="mw-category-icon">${icon}</span><span>${group}</span><small>${n ? `${n} set` : list.length}</small></summary>${body(key, list.length, rowsHtml)}</details>`;
    }).join('');
    const label = SECTION_LABEL[kind];
    return `<div class="mw-tools"><input id="mw-catalogue-search" class="mw-search" type="search" placeholder="${ui.browsing ? 'Search all\u2026' : 'Search\u2026'}" aria-label="Search ${label}" value="${esc(ui.search)}">${ui.browsing ? `<button data-action="browse-done" class="mw-primary">\u2713 Done</button>`
            : `<button data-action="browse" class="mw-primary" aria-label="Add ${label}">\uff0b Add</button>${kind === 'mood' || kind === 'story' ? `<select data-field="recipe" aria-label="Add a starter blend"><option value="">Starter blend\u2026</option>${Object.keys(kind === 'story' ? STORY_RECIPES : RECIPES).map(r => `<option>${esc(r)}</option>`).join('')}</select>` : ''}`}</div>
    ${ui.browsing ? `<p class="mw-explainer">Tap a moon to add one to ${esc(whose)}\u2019s list.</p>` : ''}
    <datalist id="mw-cast-names">${[ch.name, playerName(), ...getCast(ch).map(p => p.name)].map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist>
    <datalist id="mw-hate-names">${getCast(ch).filter(p => ui.who !== 'cast' || p.id !== selectedCast()?.id).map(p => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
    <div class="mw-categories ${kind === 'turn' ? 'mw-turn-categories' : ''}">${cats}${turns}</div>${hiddenGroups.size ? `<p class="mw-fine mw-hidden-groups">${hiddenGroups.size} group${hiddenGroups.size > 1 ? 's' : ''} hidden. <button type="button" class="mw-link" data-action="settings-panel">\u2699 Settings \u203a Panel</button></p>` : ''}<p class="mw-no-results" hidden>Nothing matches.</p>`;
}
// ---- Scene reader card (Moodlets tab) ----
export const SCOPES = [['mood', '\u2726', 'Moodlets'], ['body', '\u271a', 'Body'], ['trait', '\u2742', 'Traits'], ['wants', '\u2606', 'Wants']];
function readerBlock(state) {
    if (ui.who === 'story') return '';
    const allProfiles = profiles(), profile = readerProfile(), scope = cleanScope(state.readScope), subject = readerSubject();
    const anyScope = SCOPES.some(([k]) => scope[k]);
    const est = subject && anyScope ? roughTokens(readerRequest(subject, scope).messages) : 0;
    const start = sceneStart(), chatLen = ctx().chat?.length ?? 0;
    return `<details class="mw-reader" data-reader ${profile ? 'open' : ''}>
        <summary class="mw-reader-head"><span class="mw-reader-icon">\u2727</span><div><b>Scene reader</b><small>${profile ? `Reads the latest messages and sets ${esc(subjectName())}\u2019s sliders. Pinned \u25c6 ones stay.` : 'Optional. Costs an extra request; the hidden line already does this each reply.'}</small></div></summary>
        <div class="mw-scope" role="group" aria-label="What to read">${SCOPES.map(([k, icon, label]) => `<button type="button" class="mw-scope-chip" data-scope="${k}" aria-pressed="${scope[k]}">${scope[k] ? '\u2713' : icon} ${label}</button>`).join('')}</div>${anyScope ? '' : '<p class="mw-fine mw-scope-none">Nothing ticked, so there\u2019s nothing to read. Tap Moodlets to read feelings.</p>'}
        <div class="mw-reader-go"><button class="mw-primary mw-read" data-action="analyse" ${run.pending || !profile || !state.enabled || !anyScope ? 'disabled' : ''}>${run.pending ? 'Reading\u2026' : '\u2727 Read the scene'}</button>${run.pending ? '<button data-action="cancel">Stop</button>' : `<button data-action="undo" ${!state.history?.length ? 'disabled' : ''} title="Undo the last read">\u21b6 Undo</button>`}</div>
        <p class="mw-reader-meta">Last ${settings().sceneMessages} messages${start ? ' since your scene marker' : ''} \u00b7 about ${fmtTokens(est)} tokens a read${scope.trait ? ' \u00b7 traits roughly double it' : ''}</p>
        ${!profile ? '<p class="mw-fine mw-warn">Pick a connection below. A small, cheap model is fine.</p>' : ''}
        <details class="mw-tuning" data-reader-tuning><summary>Reader settings</summary>
            <label>Connection<select data-reader="profile"><option value="">Choose a connection profile\u2026</option>${profile && !allProfiles.some(p => p.id === profile) ? `<option selected value="${esc(profile)}">Unavailable profile, choose another</option>` : ''}${allProfiles.map(p => `<option value="${esc(p.id)}" ${p.id === profile ? 'selected' : ''}>${esc(p.name)} \u00b7 ${esc(p.model)}</option>`).join('')}</select></label>
            <div class="mw-seg-label">Recent messages it reads</div>
            <div class="mw-seg" role="group" aria-label="Recent messages">${[4, 6, 10, 16].map(n => `<button type="button" data-reader-msgs="${n}" aria-pressed="${settings().sceneMessages === n}">${n}</button>`).join('')}</div>
            <div class="mw-scene-mark">${start && start < chatLen ? `<span>\u27f2 Scene starts at message ${start + 1} of ${chatLen}</span><button type="button" data-action="scene-clear">Remove</button>`
                : `<button type="button" data-action="scene-mark">\u27f2 New scene starts at the latest message</button>`}</div>
            <p class="mw-fine">Nothing before the mark gets read.</p>
            <label>Follow the read <output data-follow-out>${state.follow}%</output><input type="range" min="10" max="100" data-field="follow" value="${state.follow}" style="--mw-fill:${(state.follow - 10) / .9}%" aria-label="Follow the read"></label>
            <p class="mw-fine">100 copies the reader exactly; lower keeps some of yours.</p>
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
    return `<details class="mw-types" data-types><summary><span class="mw-category-icon">\u25c8</span><span>Personality type</span><small>${types.length ? types.map(p => p.system === 'enneagram' ? `${p.type}${p.wing ? `w${p.wing}` : ''}` : p.type).join(' \u00b7 ') : 'none'}</small></summary>
        ${personalityView({ state, isPlayer: ui.who === 'user', focus: ch.name, knowledge: getKnowledge(ch) })}</details>`;
}
// Turn-ons and turn-offs that are in play because of who the other one is (engine/turns.js), shown
// under the chips: \u2661 the other shows a turn-on, \u2715 a turn-off, \u2713 the opposite of a turn-off.
function signsBlock(ch) {
    if (!['char', 'user'].includes(ui.who)) return '';
    const map = chatSigns(ch)[ui.who], other = ui.who === 'char' ? playerName() : ch.name;
    if (!map.size) return '';
    // Each chip says why, since a phone has no hover: "\u2661 Brattiness bratty", "\u2713 Prudishness opposite: slutty".
    const chip = ([id, x]) => `<span class="mw-spark mw-sign ${x.is.length && x.v < 0 ? 'is-off' : ''}">${x.is.length ? x.v > 0 ? '\u2661' : '\u2715' : '\u2713'} ${esc(TURN_BY_ID[id].label)} <b>${esc(x.is.length ? x.is.join(', ') : `opposite: ${x.not.join(', ')}`)}</b></span>`;
    return `<div class="mw-sparks mw-signs"><small>In play from ${esc(shortName(other))}</small>${[...map].map(chip).join('')}</div>`;
}
// ---- Facts: the profile, what's going on with their body right now, who they are, what they carry ----
const NOW_CATEGORIES = new Set(['body', 'bedroom', 'substances']);
// The profile card: a few facts the extension checks for itself (turn-ons like older men or tall people,
// comparisons in the note), and the up to three core traits that are always sent.
function profileCard(state, ch) {
    const vs = ui.who === 'user' ? [getState(ch), shortName(ch.name)] : [getUserState(), shortName(playerName())];
    const gap = vs[0]?.enabled ? compareProfiles(state, vs[0]) : '';
    const core = (state.core ?? []).map(id => BY_ID[id]).filter(m => m && state.moods[m.id] > 0);
    const beliefs = (state.beliefs ?? []).map(id => BY_ID[id]).filter(m => m && state.moods[m.id] > 0);
    return `<section class="mw-profile" data-anchor="profile"><div class="mw-profile-head"><h4>Profile</h4><small>age and height always go; the rest when it fits</small></div>
        ${ui.who === 'cast' ? '' : cardReadBlock(ui.who === 'user' ? 'user' : 'char')}
        <div class="mw-profile-grid">
            <label class="mw-pf"><span>Age</span><input type="number" data-profile="age" min="1" max="999" inputmode="numeric" enterkeyhint="done" placeholder="\u2014" value="${cleanAge(state.age)}"></label>
            <label class="mw-pf"><span>Height</span><input type="text" data-profile="height" maxlength="14" enterkeyhint="done" placeholder="6'1 or 185 cm" value="${esc(state.height ?? '')}"></label>
            <label class="mw-pf mw-pf-wide"><span>Into</span><input type="text" data-profile="interests" maxlength="120" enterkeyhint="done" placeholder="guitar, old films, chess" value="${esc(state.interests ?? '')}"></label>
        </div>
        ${genderRow(ch)}
        ${sizeRow(state, ch)}
        <div class="mw-profile-favs"><span class="mw-profile-sub">Favourites <small>sent when the scene comes near them</small></span>
            <div class="mw-profile-grid">${FAVS.map(([k, label, hint]) => `<label class="mw-pf"><span>${esc(label.replace('Favourite ', ''))}</span><input type="text" data-fav="${k}" maxlength="60" enterkeyhint="done" placeholder="${esc(hint)}" value="${esc(state.favs?.[k] ?? '')}"></label>`).join('')}</div></div>
        <div class="mw-profile-voice"><span class="mw-profile-sub">Their words <small>sent every reply</small></span>
            <label class="mw-pf mw-pf-wide"><span>Pet names for ${esc(vs[1])}</span><textarea data-words="petNames" rows="2" maxlength="400" placeholder="doll, little lamb, sweetheart">${esc(state.petNames ?? '')}</textarea></label>
            <label class="mw-pf mw-pf-wide"><span>Catchphrases <small>one per line</small></span><textarea data-words="sayings" rows="3" maxlength="400" placeholder="Now, now.&#10;You'll do as you're told, won't you?">${esc(state.sayings ?? '')}</textarea></label></div>
        ${familyBlock(state)}
        ${secretBlock(state, ch, vs[1])}
        ${ui.who === 'char' ? opinionRow(ch) : ''}
        <div class="mw-profile-core"><span>Core</span>${core.length ? core.map(m => `<button type="button" class="mw-core-chip" data-tab="trait" style="--mw-accent:${m.color}">\u2605 ${esc(m.label)}</button>`).join('') : '<button type="button" class="mw-core-chip is-empty" data-tab="trait">\u2605 Star up to three traits</button>'}</div>
        <div class="mw-profile-core"><span>Beliefs</span>${beliefs.length ? beliefs.map(m => `<button type="button" class="mw-core-chip" data-tab="trait" style="--mw-accent:${m.color}">\u2726 ${esc(m.label)}</button>`).join('') : '<button type="button" class="mw-core-chip is-empty" data-tab="trait">\u2726 Star up to three in Morals &amp; views or Alignment</button>'}</div>
        ${gap ? `<p class="mw-profile-vs">${esc(shortName(subjectName()))} is ${esc(gap)} than ${esc(vs[1])}.</p>` : ''}
    </section>`;
}
// Secrets and leverage (1.79, engine/secrets.js): one secret a line, and where each stands. The story moves
// them; a tap sets one by hand until the story moves it again.
// Family (2.0): folded, one box per person (role, name, about them), \uff0b for another. Each is sent only when the
// latest messages name their role or their name.
function familyBlock(state) {
    const list = familyMembers(state), n = list.filter(m => m.role || m.name || m.info).length;
    const rows = list.map((m, i) => `<div class="mw-fam-row"><input type="text" data-fam-field="${i}:role" maxlength="40" enterkeyhint="next" placeholder="Role (Dad)" aria-label="Role" value="${esc(m.role)}"><input type="text" data-fam-field="${i}:name" maxlength="40" enterkeyhint="next" placeholder="Name" aria-label="Name" value="${esc(m.name)}"><button type="button" class="mw-fam-del" data-fam-del="${i}" aria-label="Remove">\u2715</button><textarea data-fam-field="${i}:info" rows="2" maxlength="300" placeholder="Who they are to them, what they're like" aria-label="About them">${esc(m.info)}</textarea></div>`).join('');
    return `<details class="mw-fam mw-profile-voice"><summary><span class="mw-profile-sub">Family <small>${n ? `${n} \u00b7 ` : ''}each sent only when the chat names their role or name</small></span></summary>
        ${rows}${list.length < FAMILY_MAX ? '<button type="button" class="mw-fam-add" data-action="fam-add">\uff0b Add a family member</button>' : ''}</details>`;
}
const SECRET_CHIPS = [['hidden', 'Hidden'], ['suspected', 'Suspected'], ['known', 'Known'], ['out', 'Out']];
function secretBlock(state, ch, other) {
    if (!['char', 'user'].includes(ui.who) || settings().secrets === false) return '';
    const sec = secretsNow(ch, effectiveChat(ctx().chat ?? [])), list = sec ? ui.who === 'char' ? sec.mine : sec.yours : [];
    const rows = list.map(x => `<div class="mw-secret"><p>${esc(x.text)}${x.by === 'story' ? ' <small>moved by the story</small>' : ''}</p>
        <div class="mw-secret-chips" role="group" aria-label="Where it stands">${SECRET_CHIPS.map(([k, label]) => `<button type="button" class="mw-chip-btn" data-secret-set="${x.key}" data-secret-state="${k}" aria-pressed="${x.state === k || (k === 'known' && x.state === 'used')}">${label}${k === 'known' && x.state === 'used' ? ' \u00b7 used' : ''}</button>`).join('')}</div></div>`).join('');
    return `<div class="mw-profile-voice mw-secrets"><span class="mw-profile-sub">Secrets <small>known means ${esc(other)} found out: a hook over them</small></span>
        <label class="mw-pf mw-pf-wide"><span>One secret a line</span><textarea data-secrets rows="3" maxlength="600" placeholder="Having an affair with his secretary&#10;Owes money to the wrong people">${esc(state.secrets ?? '')}</textarea></label>
        ${rows}</div>`;
}
// How they've come to feel about the people the story keeps bringing up (1.79, engine/opinions.js): read-only.
function opinionRow(ch) {
    const list = opinionsNow(ch, effectiveChat(ctx().chat ?? [])); if (!list.length) return '';
    return `<div class="mw-profile-voice mw-opinions"><span class="mw-profile-sub">Feelings about others <small>built from the story, sent when the scene names them</small></span>
        <div class="mw-opinion-list">${list.map(o => `<span class="mw-opinion ${o.score >= 0 ? 'is-warm' : 'is-cold'}"><b>${esc(o.name)}</b> ${esc(o.word)}${o.feel.length ? ` <small>${esc(o.feel.join(', '))}</small>` : ''}</span>`).join('')}</div></div>`;
}
// Gender (1.89): sets the pronouns every line uses (he/she/they), which period lines apply, the body-size row,
// and the women-only sounds. Auto reads the card or persona; a persona nobody described counts as a woman.
export const GENDERS = [['auto', 'Auto'], ['he', 'Man'], ['she', 'Woman'], ['they', 'Non-binary']];
const GENDER_WORD = { he: 'a man, he/him', she: 'a woman, she/her', they: 'they/them, or names' };
function genderRow(ch) {
    if (!ch || (ui.who !== 'user' && ui.who !== 'char')) return '';
    const k = ui.who === 'user' ? 'u' : 'n', bond = bondData(ch), v = bond[k === 'u' ? 'pu' : 'pn'] ?? 'auto', now = pronounsFor(ch, bond)[k];
    return `<div class="mw-profile-size mw-gender"><span class="mw-profile-sub">Gender <small>${v === 'auto' ? `Auto reads ${k === 'u' ? 'your persona' : 'the card'}: ${GENDER_WORD[now]}` : GENDER_WORD[v]}. Sets pronouns, period lines and body rows</small></span>
        <div class="mw-size-row" role="group" aria-label="Gender">${GENDERS.map(([id, label]) => `<button type="button" class="mw-size-chip" data-gender="${id}" aria-pressed="${v === id}">${label}</button>`).join('')}</div></div>`;
}
// Body size on the profile, by gender: penis size for a man, breast size for a woman, both when the pronouns
// don't say. Each is a private fact (sent only in intimate or private moments); tap one to set it, tap it again
// to clear. The story can set them too, by the words on each row.
const SIZES = { he: ['Size', MOODS.filter(m => m.size === 'he')], she: ['Bust', MOODS.filter(m => m.size === 'she')] };
function sizeRow(state, ch) {
    const g = ch ? pronounsFor(ch, bondData(ch))[ui.who === 'user' ? 'u' : 'n'] : '', which = g === 'he' || g === 'she' ? [g] : ['he', 'she'];
    return `<div class="mw-profile-size"><span class="mw-profile-sub">Body <small>only sent in intimate or private moments</small></span>${which.map(k => { const [label, rows] = SIZES[k];
        return `<div class="mw-size-row" role="group" aria-label="${label}"><span>${label}</span>${rows.map(m => `<button type="button" class="mw-size-chip" data-size="${m.id}" aria-pressed="${state.moods[m.id] > 0}">${esc(m.label.replace(/ (penis|breasts)$/, ''))}</button>`).join('')}</div>`; }).join('')}</div>`;
}
// The Facts tab (and the bottom of your You tab).
export function factsContent(state, ch, active) {
    const facts = active.filter(m => m.kind === 'state' && sectionOf(m) === 'state'), now = facts.filter(m => NOW_CATEGORIES.has(m.category)), who = facts.filter(m => !NOW_CATEGORIES.has(m.category));
    const chip = m => { const note = courseNote(state, m.id), why = ui.why?.get(m.id) ?? '';
        return `<button data-jump="${m.id}" class="mw-chip mw-fact-chip" style="--mw-accent:${m.color}" title="${esc(why || `Adjust ${m.label}`)}"><span>${state.pins[m.id] ? '\u25c6 ' : ''}${esc(tagLabel(m))}${note ? `<small>${esc(note)}</small>` : ''}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`; };
    const onHere = facts.length;
    return `${profileCard(state, ch)}
    <div class="mw-summary mw-facts-summary mw-hero" data-chapter="state"><i class="mw-hero-art" aria-hidden="true"></i><div class="mw-section-label">Facts<span>${onHere} on${onHere ? ` \u00b7 <button class="mw-clear" data-action="clear" title="Turn off the facts, pins too. Other tabs stay as they are">Clear facts</button>` : ''}</span></div>
        ${now.length ? `<div class="mw-fact-row"><small>Right now</small><div class="mw-chips">${now.map(chip).join('')}</div></div>` : ''}
        ${who.length ? `<div class="mw-fact-row"><small>Who they are</small><div class="mw-chips">${who.map(chip).join('')}</div></div>` : ''}
        ${!onHere ? `<p class="mw-fine">Nothing yet. Right now facts wear off or change as the story goes; the rest stay.</p>` : ''}</div>
    ${catalogueBlock(state, 'state', ch, ui.who === 'story' ? 'the story' : subjectName())}
    ${inventoryView(state, ch)}`;
}
const HERO_EMPTY = { mood: 'Feelings', trait: 'Traits', psyche: 'Mind', intimacy: 'Intimacy', turn: 'Turn-ons', story: 'The story' };
export function sectionContent(state, kind, ch, active) {
    if (kind === 'state') return factsContent(state, ch, active);
    const shown = kind === 'turn' ? [] : active.filter(m => sectionOf(m) === kind && m.category !== 'relationship');
    const turnsSet = kind === 'turn' ? Object.entries(state.prefs ?? {}).filter(([id, v]) => v && TURN_BY_ID[id]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])) : [];
    const whose = ui.who === 'story' ? 'the story' : subjectName();
    const heading = { mood: 'Feeling now', trait: 'Traits', psyche: 'Mind', intimacy: 'Intimacy', turn: 'Turn-ons & turn-offs', state: 'Facts', story: 'Story' }[kind];
    const empty = { mood: `No feelings set. ${ui.who === 'char' ? 'The story moves them as it goes, or add some below.' : 'Add some below.'}`, trait: 'No traits yet. Add who they are underneath, kind or cruel.', psyche: 'Nothing in the mind yet: fears, defences, the way they think.', intimacy: 'Nothing set. These lead only in intimate scenes.', turn: 'No turn-ons or turn-offs yet.', state: 'Nothing yet.', story: 'Nothing set for this chat yet: genre, authors, tone and rules all live here.' }[kind];
    const onHere = sectionCount(state, kind), what = SECTION_LABEL[kind];
    const sparks = ['turn', 'intimacy'].includes(kind) && ui.who === 'char' && bondData(ch).on ? computeBond(bondData(ch), Infinity, 'one', 'the other', null, bondList(ch)).sparks.filter(x => kind === 'turn' ? !x.trait : x.trait) : [];
    const lit = new Set(sparks.filter(x => x.fresh && x.id).map(x => x.id)), litTraits = new Set(sparks.filter(x => x.fresh && x.trait).map(x => x.trait));
    // The other person showing one of these turn-ons right now (they're younger, he's in a uniform) glows it softly,
    // steadier than the \u2727 of a reply that just set one off.
    const shows = new Map(kind === 'turn' && ['char', 'user'].includes(ui.who) ? [...chatSigns(ch)[ui.who]].filter(([, x]) => x.is.length && x.v > 0).map(([id, x]) => [id, `Shows now: ${x.is.join(', ')}`]) : []);
    // A small \u2715 beside each chip takes it off; the chip itself still scrolls to its row (Settings \u203a Panel can hide the \u2715).
    const xOn = settings().chipRemove !== false;
    const xWrap = (id, label, chip) => xOn ? `<span class="mw-chip-wrap">${chip}<button type="button" class="mw-chip-x" data-chip-off="${esc(id)}" aria-label="Take ${esc(label)} off" title="Take ${esc(label)} off">\u2715</button></span>` : chip;
    const undo = ui.chipUndo && ui.chipUndo.who === ui.who && ui.chipUndo.kind === kind ? `<button type="button" class="mw-chip-btn mw-chip-undo" data-action="chip-undo">\u21b6 Put ${esc(ui.chipUndo.label)} back</button>` : '';
    const chips = turnsSet.map(([id, v]) => xWrap(`turn:${id}`, TURN_BY_ID[id].label, `<button data-jump="turn:${id}" class="mw-chip mw-chip-turn ${v < 0 ? 'is-off' : ''} ${lit.has(id) ? 'is-lit' : ''} ${shows.has(id) && !lit.has(id) ? 'is-shown' : ''}" style="--mw-accent:${TURN_BY_ID[id].color}" title="${lit.has(id) ? 'Set off in the last reply. ' : shows.has(id) ? `${esc(shows.get(id))}. ` : ''}Adjust ${esc(TURN_BY_ID[id].label)}"><span>${lit.has(id) ? '\u2727' : v > 0 ? '\u2661' : '\u2715'} ${esc(TURN_BY_ID[id].label)}</span><b>${Math.abs(v)}</b><i style="width:${Math.abs(v)}%"></i></button>`)).join('')
        + shown.map(m => xWrap(m.id, m.label, `<button data-jump="${m.id}" class="mw-chip ${litTraits.has(m.id) ? 'is-lit' : ''}" style="--mw-accent:${m.color}" title="${litTraits.has(m.id) ? 'Set off in the last reply. ' : ''}Adjust ${esc(m.label)}"><span>${litTraits.has(m.id) ? '\u2727 ' : ''}${state.pins[m.id] ? '\u25c6 ' : ''}${esc(tagLabel(m))}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`)).join('');
    const explainer = ui.who === 'user' && kind === 'turn' ? `${esc(ch.name)} only learns these from how you react.`
        : kind === 'turn' ? 'Lit \u2727 means the last reply touched it.'
        : ui.who === 'user' && ['mood', 'trait', 'psyche', 'intimacy'].includes(kind) ? `${esc(ch.name)} reacts to these but never writes for you. Choose what ${esc(ch.name)} knows below.`
        : kind === 'psyche' ? 'Clear and stronger ones go with every reply; fainter ones only when the scene touches them. Star \u2605 one to send it every reply. Some can lean healthier or darker.' : '';
    return `<div class="mw-summary mw-hero" data-chapter="${kind}"><i class="mw-hero-art" aria-hidden="true"></i><div class="mw-section-label">${shown.length || turnsSet.length ? heading : HERO_EMPTY[kind] ?? heading}<span>${shown.length + turnsSet.length} on${onHere ? ` \u00b7 <button class="mw-clear" data-action="clear" title="Turn off this tab\u2019s ${what}, pins too. Other tabs stay as they are">Clear ${what}</button>` : ''}</span></div>
        <div class="mw-chips">${chips || `<p class="mw-hero-empty">${empty}</p>`}${undo}</div>
        ${kind === 'turn' && ui.who === 'char' ? reactiveBlock(state, ch) : ''}
        ${kind === 'turn' ? signsBlock(ch) : ''}
        ${sparks.length ? `<div class="mw-sparks"><small>Lit lately</small>${sparks.map(x => `<span class="mw-spark ${x.off ? 'is-off' : ''} ${x.fresh ? 'is-fresh' : ''}">${x.off ? '\u2715' : '\u2727'} ${esc(x.text)}</span>`).join('')}</div>` : ''}
        ${kind === 'mood' && state.reason ? `<div class="mw-observation">\u2727 ${esc(state.reason)}<small>Last scene read \u00b7 ${esc(new Date(state.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</small></div>` : ''}</div>
    ${kind === 'mood' && ui.who === 'char' ? storyMoodBlock(state, ch) : ''}
    ${kind === 'mood' ? readerBlock(state) : ''}
    ${explainer ? `<p class="mw-explainer">${explainer}</p>` : ''}
    ${kind === 'trait' ? typesBlock(state, ch) : ''}
    ${kind === 'story' ? dialBlock(state) : ''}
    ${kind === 'story' ? voicesBlock(state) : ''}
    ${kind === 'story' ? blendsBlock(state, ch) : ''}
    ${kind === 'story' ? eraBlock(state) : ''}
    ${['mood', 'trait', 'psyche', 'intimacy'].includes(kind) && ui.who === 'user' ? knowledgePanel(state, ch) : ''}${kind === 'turn' && ui.who === 'user' ? turnKnowledgeRows(state, ch, knowledgeNow(ch)) : ''}
    ${catalogueBlock(state, kind, ch, whose)}`;
}
// The story's dials (2.0): one tap each for how wild it runs, how much can go wrong, who drives it and how it
// ends up, instead of hunting rows to switch on. The last three own their rows (engine/dials.js).
const dialRow = (title, steps, at, attr) => `<div class="mw-dial-one"><div class="mw-dial-head"><b>${title}</b><small>${steps[at][2]}</small></div>
    <div class="mw-dial-row" role="radiogroup" aria-label="${title}" style="--mw-steps:${steps.length}">${steps.map(([icon, label], i) => `<button type="button" role="radio" ${attr}="${i}" aria-checked="${i === at}" class="${i === at ? 'is-on' : ''}"><span aria-hidden="true">${icon}</span>${label}</button>`).join('')}</div></div>`;
function dialBlock(state) {
    return `<div class="mw-dial">${DIALS.map(d => dialRow(d.title, d.steps, stepOf(state, d.key), d.key === 'turns' ? 'data-story-dial' : `data-story-dials="${d.key}" data-step`)).join('')}</div>`;
}
// Period lines now live on each person's Period tab (Self section); the Story tab just points there.
function eraBlock(state) {
    const era = MOODS.filter(m => m.category === 'era' && (state.moods?.[m.id] ?? 0) > 0).sort((a, b) => state.moods[b.id] - state.moods[a.id])[0];
    return era && periodEra(era.id) ? '<p class="mw-fine mw-era-note">\u2766 Period lines for each of you are on their own Period tab, under Self.</p>' : '';
}
// Saved author blends for this character: tap one to put its authors (and who writes narration or dialogue)
// back on, \u2715 to delete it. Folded into one line, and hidden until there's an author on or a blend saved.
function blendsBlock(state, ch) {
    const blends = settings().authorBlends?.[`char:${ch.avatar}`] ?? [], authors = MOODS.filter(m => m.books && state.moods[m.id] > 0);
    if (settings().blendsOn === false || (!blends.length && !authors.length && !ui.blendUndo)) return '';
    const current = blends.find(b => Object.keys(b.authors).length === authors.length && authors.every(m => b.authors[m.id] === state.moods[m.id] && (b.roles?.[m.id] ?? '') === (state.authorRole?.[m.id] ?? '')));
    const chip = (b, i) => `<span class="mw-blend ${b === current ? 'is-on' : ''}"><button type="button" class="mw-blend-use" data-blend-use="${i}" title="${esc(Object.keys(b.authors).map(id => BY_ID[id]?.label).filter(Boolean).join(', '))}">${esc(b.name)}</button><button type="button" class="mw-blend-x" data-blend-del="${i}" aria-label="Delete ${esc(b.name)}">\u2715</button></span>`;
    return `<details class="mw-blends" data-anchor="author-blends"><summary><span>\u2712 Author blends</span><small>${current ? esc(current.name) : blends.length ? `${blends.length} saved` : 'none saved'}</small></summary>
        ${blends.length ? `<div class="mw-blend-list">${blends.map(chip).join('')}</div>` : ''}
        ${ui.blendUndo?.avatar === ch.avatar ? `<button type="button" class="mw-chip-btn" data-action="blend-undo">\u21b6 Bring back ${esc(ui.blendUndo.blend.name)}</button>` : ''}
        ${authors.length ? `<div class="mw-blend-save"><input type="text" data-blend-name maxlength="40" placeholder="Name this blend" aria-label="Name for this author blend"><button type="button" class="mw-chip-btn" data-action="blend-save">Save ${authors.length} author${authors.length === 1 ? '' : 's'}</button></div>` : ''}
        <p class="mw-fine">Saved for ${esc(shortName(ch.name))} only. Using one swaps out the authors that are on now.</p></details>`;
}
// Who writes what, at a glance, once any author is on: narration, dialogue, or both.
function voicesBlock(state) {
    const on = MOODS.filter(m => m.books && state.moods[m.id] > 0).sort((a, b) => state.moods[b.id] - state.moods[a.id]);
    if (!on.length) return '';
    const of = role => on.filter(m => (state.authorRole?.[m.id] ?? '') === role).map(m => esc(m.label)).join(', ');
    const parts = [['Narration', of('narration')], ['Dialogue', of('dialogue')], ['Both', of('')]].filter(([, names]) => names);
    return `<div class="mw-voices">${parts.map(([k, names]) => `<span><b>${k}:</b> ${names}</span>`).join('')}</div>`;
}
export function lastMoodRec(ch) {
    const list = ctx().chatMetadata?.[KEY]?.applied?.[`char:${ch.avatar}`] ?? [];
    return list.at(-1) ?? null;
}
function storyMoodBlock(state, ch) {
    const bond = bondData(ch), feed = cleanBoardMeta(boardMeta()).feed, on = state.moodAuto !== false, fade = state.moodFade !== false, pace = scenePace(ch), moves = movePace(ch);
    const rec = lastMoodRec(ch), moved = Object.entries(rec?.m ?? {}).filter(([id]) => BY_ID[id]);
    const name = id => BY_ID[id].label;
    const step = ([id, [a, b]]) => `<span class="mw-moodstep ${rec.f?.includes(id) ? 'is-fade' : b > a ? 'is-up' : 'is-down'}">${esc(name(id))} ${b === 0 ? 'off' : `${b > a ? '+' : '\u2212'}${Math.abs(b - a)}`}${rec.f?.includes(id) ? ' \u00b7 fading' : ''}</span>`;
    const blocked = !bond.on ? 'Switch on Bonds for this character first.' : !feed ? 'Replies are set not to update feelings (Board settings), so this is paused.' : '';
    return `<details class="mw-storymood" data-anchor="story-moods" ${on ? 'open' : ''}><summary><span>\u263e The story moves moods</span><small>${on ? `${esc(pace.label)}${fade ? ', fading' : ''}` : 'off'}</small></summary>
        <label class="mw-toggle"><input type="checkbox" data-mood-auto ${on ? 'checked' : ''}> Each reply moves ${esc(ch.name)}\u2019s feelings (free, no extra request)</label>
        ${blocked ? `<p class="mw-fine mw-scope-none">${blocked}</p>` : ''}
        ${on ? `<div class="mw-storymood-row"><label>Speed<select data-pace aria-label="How fast everything moves: feelings, Bonds meters and desire">${Object.entries(MOOD_PACE).map(([k, v]) => `<option value="${k}" ${MOOD_PACE[k] === pace ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
            <label class="mw-toggle"><input type="checkbox" data-mood-fade ${fade ? 'checked' : ''}> Fade</label></div>
        ${on ? '<p class="mw-fine mw-storymood-link">Speed sets the pace for feelings, relationship meters and desire.</p>' : ''}
        <label class="mw-storymood-which">Which feelings<select data-mood-scope aria-label="Which feelings the story can set">
            <option value="any" ${state.moodScope !== 'list' ? 'selected' : ''}>Any of the ${FEELINGS_COUNT} moods</option>
            <option value="list" ${state.moodScope === 'list' ? 'selected' : ''}>Only ${esc(ch.name)}\u2019s list (${listedFeelings(state).length})</option></select></label>
        ${state.moodScope === 'list' ? `<p class="mw-fine">The story can only move feelings on this list. Add more from the list below.</p>` : ''}
        <p class="mw-fine">${esc(pace.label)}, ${esc(pace.hint)}: up to ${moves.step} a reply.${fade ? ` A feeling nobody mentions for ${moves.after} repl${moves.after === 1 ? 'y' : 'ies'} loses ${moves.fade} a reply after that.` : ' Feelings stay until the story turns them down.'} Pinned \u25c6 ones never move.${moves.temper ? ` ${esc(moves.temper.slice(0, 2).map(id => BY_ID[id].label).join(' and '))} ${moves.temper.length > 1 ? 'shift' : 'shifts'} this: ${moves.swings > 0.2 ? 'feelings swing harder and let go sooner' : moves.swings < -0.2 ? 'feelings move less and hold on longer' : 'feelings hang on longer'}.` : ''}${moves.low?.length ? ` Low ${esc(moves.low.join(' and '))} make${moves.low.length > 1 ? '' : 's'} them quicker to flare.` : ''}</p>
        ${moved.length ? `<div class="mw-moodlast"><small>Last reply</small><div>${moved.map(step).join('')}</div><button type="button" data-action="mood-undo-last">\u21b6 Undo</button></div>` : rec?.undone ? '<p class="mw-fine">Last reply\u2019s changes were undone.</p>' : ''}` : ''}</details>`;
}
