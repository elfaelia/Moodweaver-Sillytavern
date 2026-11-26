// The settings sheet, and clearing pins or everything.
import { persist, personKeyOfSubject, playerName, subjectName, target } from '../app/chat.js';
import { launchSettings } from '../app/launcher.js';
import { syncPrompt } from '../app/note.js';
import { bondList } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { KEY, ctx, ui } from '../app/state.js';
import { cleanBoardMeta } from '../engine/board.js';
import { METERS, cleanBond, setMeter } from '../engine/bond.js';
import { escapeHtml as esc } from '../engine/util.js';
import { CATEGORIES } from '../data/catalogue.js';
import { freshState } from '../engine/state.js';
import { changeState, render } from './render.js';
import { writerChoices, writerName } from '../app/writer.js';

// 2.0: Settings as an observatory. A small sky at the top, then one card per subject, each folded to a line that
// says what's inside. Switches sit on the right like every other switch in the panel; long explanations fold to an
// \u24d8 line. The data-settings names stay the same, so the token pill and the Settings \u203a Panel links still land.
const on = k => settings()[k] !== false, yes = k => settings()[k] === true;
const sw = (attr, checked, title, note = '') => `<label class="mw-toggle mw-set-row"><input type="checkbox" ${attr} ${checked ? 'checked' : ''}><span><b>${title}</b>${note ? `<small>${note}</small>` : ''}</span></label>`;
const choice = (key, title, options, note = '') => `<label class="mw-field mw-set-row mw-set-choice"><span><b>${title}</b>${note ? `<small>${note}</small>` : ''}</span><select data-setting-choice="${key}" aria-label="${title}">${options.map(([v, l]) => `<option value="${v}" ${String(settings()[key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
const card = (key, icon, color, title, sub, body, open = false) => `<details class="mw-advanced mw-set-card" data-settings="${key}" style="--mw-set:${color}"${open ? ' open' : ''}><summary><span class="mw-set-icon" aria-hidden="true">${icon}</span><span class="mw-set-title"><b>${title}</b><small>${sub}</small></span></summary><div class="mw-set-body">${body}</div></details>`;
export function settingsView(state) {
    const whose = ui.who === 'user' ? playerName() : ui.who === 'story' ? 'the story' : subjectName();
    const n = pinCounts(), words = n ? pinWords(n) : '';
    const feelingsOn = ['aftermath', 'snaps', 'stress', 'opinions', 'secrets', 'factOpposites'].filter(on).length;
    return `<section class="mw-settings">
        <div class="mw-settings-head mw-set-hero"><i class="mw-set-sky" aria-hidden="true"></i><button type="button" class="mw-back" data-action="settings-close">\u2039 Back</button><div><b>Settings</b><small>Most of these are for every chat. Clearing and defaults are for ${esc(whose)}.</small></div></div>
        ${card('sent', '\u25f7', '#efd59c', 'Tokens and the note', 'What goes to Claude each reply, and where', `
            <div data-token-count class="mw-token-count"></div><p data-budget-warning class="mw-fine" hidden></p>
            ${choice('noteOrder', 'Where the notes sit', [['after', 'After your message'], ['rules', 'Around your message'], ['before', 'Before your message']], 'Claude pays most attention to whatever it reads last.')}
            <p class="mw-fine mw-keep">${{ after: 'Everything Moodweaver sends comes after your newest message, so moods, settings and writing rules count most; a small detail in your message can get less attention.', rules: 'Moods, facts and the rest come before your message; only the point of view, writing rules and the hidden-line reminder come after it. A middle way.', before: 'Everything comes before your message except the hidden-line reminder, so your own message counts most.' }[settings().noteOrder] ?? ''}</p>
            ${sw('data-setting-bool="splitNote"', on('splitNote'), 'Cache the parts that never change', 'The rules that are the same every reply go once at the very top, where they\u2019re cached and cost about a tenth. Best on. It works with any of the three above.')}
            <label class="mw-set-num">Warn me when the fresh part passes <input type="number" data-setting="tokenBudget" min="160" max="3000" value="${settings().tokenBudget}" aria-label="Token warning"></label>
            <p class="mw-fine">In tokens. Only a warning: nothing you set is ever cut.</p>
            ${sw('data-field="sceneBreathing"', state.sceneBreathing !== false, 'Keep scenes moving', 'Tells Claude to move each scene along rather than linger in it.')}
            ${sw('data-setting-bool="fillInChip"', on('fillInChip'), 'Offer to add a missing hidden line', 'When Claude forgets the hidden line Moodweaver reads after a reply, a button under that reply adds it in one tap.')}
            ${sw('data-setting-bool="blendPlan"', yes('blendPlan'), 'Ask Claude to plan before writing', 'Asks Claude to work out how your strongest settings fit together before it writes. Opus 5.5 does this anyway, so best off.')}
            <details class="mw-sent-full"><summary>What\u2019s sent, in full</summary><pre data-audit></pre><b class="mw-pre-label">Ready to send</b><pre data-preview></pre><b class="mw-pre-label">Last reply</b><pre data-last-prompt></pre></details>
`)}
        ${card('writers', '\u270e', '#b9d7f2', 'Writers', settings().writerMain && settings().writerAlt ? `${esc(writerName(settings().writerMain) || 'Main')} and ${esc(writerName(settings().writerAlt) || 'stand-in')}` : 'Not set', `
            ${writerChoices().length ? `${choice('writerMain', 'Main writer', [['', 'Not set'], ...writerChoices()], 'The model that writes most replies.')}
            ${choice('writerAlt', 'Stand-in writer', [['', 'Not set'], ...writerChoices()], 'The one you switch to with one tap on the Scene page.')}
            <p class="mw-fine">These are SillyTavern Connection Profiles. Make one for each model in SillyTavern first (the plug icon \u203a Connection Profiles), then pick them here.</p>`
            : '<p class="mw-fine">Make a Connection Profile for each model in SillyTavern first (the plug icon \u203a Connection Profiles), then pick them here.</p>'}`)}
        ${card('feelings', '\u263e', '#c9b8f0', 'Feelings and people', `${feelingsOn} of 6 extras on`, `
            ${choice('showsMode', 'How feelings show', [['all', 'Default + yours'], ['mine', 'Only yours'], ['off', 'Names only']])}
            ${choice('moodClash', 'When their moods meet', [['off', 'Off'], ['sometimes', 'Now and then'], ['often', 'Often']], 'The moment between you: your strongest mood against theirs, whether it fits, leads or rubs. Shown on Bonds as Right now. Traits never count.')}
            ${choice('contagion', 'Your feelings rubbing off', [['scene', 'When it fits'], ['off', 'Off']])}
            <p class="mw-fine">When the story reads a feeling in you, a character with the empathy for it now and then feels a faint echo of it. Warm traits make it likelier; cold-blooded, psychopathic, narcissistic or cruel ones stop it.</p>
            ${sw('data-setting-bool="aftermath"', on('aftermath'), 'Strong feelings leave an aftermath', 'Shaking hands after terror, a short fuse after rage.')}
            ${sw('data-setting-bool="snaps"', on('snaps'), 'A shock can break a feeling at once', 'Strong anger, coldness, cruelty, cockiness, desire or joy get a roll each reply. If the moment really hits them, it breaks and something else takes its place, or it holds this time. Strong Restraint gets the same roll for giving way. Their personality, the dynamic, drink, desire and how close you are set the odds, shown on Moods.')}
            ${sw('data-setting-bool="stress"', on('stress'), 'Stress and breaking points', 'Builds against their beliefs and nature, eases with rest.')}
            ${sw('data-setting-bool="opinions"', on('opinions'), 'Feelings about other people build up', 'Sent only when the scene names that person.')}
            ${sw('data-setting-bool="secrets"', on('secrets'), 'Secrets and leverage', 'Hidden, suspected, known, out.')}
            ${sw('data-setting-bool="factOpposites"', on('factOpposites'), 'Opposite facts switch each other off', 'Hot takes off Cold, Drunk takes off Tipsy. Pinned ones stay.')}
            ${sw('data-setting-bool="factsWhenRelevant"', on('factsWhenRelevant'), 'Who-they-are facts only when the scene touches them', 'Looks, style, voice, job and past. Saves tokens when the card already says it.')}
            ${sw('data-setting-bool="traitFocus"', on('traitFocus'), 'Traits in focus', 'Three in full each reply, the rest as names in the background.')}
            ${sw('data-setting-bool="diceOn"', on('diceOn'), 'Dice checks for skills in play')}
            ${sw('data-setting-bool="arcOffers"', on('arcOffers'), 'Offer arcs the story starts', 'A chip on Scene when the story begins a slow burn, a corruption and so on.')}`)}
        ${card('turns', '\u21cb', '#e7a6c4', 'Turn-ons', ({ fit: 'Sent when they fit the moment', heat: 'Sent only in intimate scenes', all: 'Sent every reply' })[settings().turnsSend] ?? '', `
            ${choice('turnsSend', 'When they\u2019re sent', [['fit', 'When they fit'], ['heat', 'Intimate only'], ['all', 'Always']])}
            <p class="mw-fine">Turn-ons always stay on and saved; this only changes when they go into the note. <b>When they fit:</b> all of them in an intimate scene, otherwise only ones the scene touches.</p>
            ${choice('turnsEvery', 'A reminder every few replies', [[0, 'Off'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'], [8, '8'], [10, '10']])}
            ${sw('data-setting-bool="turnsStrong"', yes('turnsStrong'), 'Strong ones only', 'Third and fourth moon.')}`)}
        ${card('board', '\u2601', '#9fc6c0', 'Info board', on('boardSend') ? 'Sent with each reply' : 'Not sent', `
            ${sw('data-setting-bool="boardSend"', on('boardSend'), 'Send the board prompt', 'If this is on, take the info board out of your preset.')}
            ${sw('data-setting-bool="boardPresent"', on('boardPresent'), 'Present line moves the cast in and out')}
            ${sw('data-setting-bool="castAuto"', on('castAuto'), 'The story moves the cast\u2019s feelings and facts', 'Only for cast in the scene, one feeling and one fact at most.')}
            ${sw('data-setting-bool="boardStrip"', on('boardStrip'), 'Keep old boards out of the prompt', 'You still see them in the chat.')}
            ${sw('data-setting-bool="boardWithWeave"', on('boardWithWeave'), 'Board words move feelings too')}
            ${sw('data-setting-bool="boardPins"', yes('boardPins'), 'Let me pin and correct the board', 'Also lets you set needs by hand.')}
            ${sw('data-setting-bool="boardMemories"', yes('boardMemories'), 'Save turning points as memories')}`)}
        ${card('panel', '\u2726', '#9fd3c9', 'The panel', 'What shows, and how it moves', `
            ${sw('data-setting-bool="whyOn"', on('whyOn'), 'Show why', 'A faint line under moods and facts the story moved.')}
            ${sw('data-setting-bool="wantsTab"', on('wantsTab'), 'Wants chapter', 'Wants you already set still reach the story.')}
            ${sw('data-setting-bool="musicTab"', on('musicTab'), 'Music on the dock', 'Hidden, songs you switched on keep playing.')}
            ${sw('data-setting-bool="dockClose"', on('dockClose'), 'Close button on the dock')}
            ${sw('data-setting-bool="swipeTabs"', on('swipeTabs'), 'Swipe sideways between chapters')}
            ${sw('data-setting-bool="diceShow"', yes('diceShow'), 'Show the dice rolls on Skills', 'Spoils some surprises.')}
            ${sw('data-setting-bool="chipRemove"', on('chipRemove'), '\u2715 on chips to take them off')}
            ${sw('data-setting-bool="blendsOn"', on('blendsOn'), 'Author blends on Story')}
            ${sw('data-setting-bool="authorStyle"', on('authorStyle'), 'Show how each author writes')}
            <p class="mw-seg-label">Story groups to show <small>tap one to hide it</small></p>
            <div class="mw-group-picks">${CATEGORIES.filter(([, , , , , k]) => k === 'story').map(([id, name, icon]) => `<button type="button" class="mw-group-pick ${settings().hiddenGroups.includes(id) ? '' : 'is-on'}" data-group-hide="${id}" aria-pressed="${settings().hiddenGroups.includes(id) ? 'false' : 'true'}">${icon} ${esc(name)}</button>`).join('')}</div>
            <p class="mw-fine">A hidden group leaves the Story page and search. Anything already on in it still reaches the story.</p>`)}
        ${card('launcher', '\u25c6', '#efd59c', 'Moods button', 'On this device', launchSettings())}
        <p class="mw-set-zone">For ${esc(whose)} in this chat</p>
        ${card('pins', '\u25c7', '#e8936f', 'Pins', words ? esc(words) : 'Nothing pinned', `
            <p class="mw-fine">Unpinning covers everyone in this chat: ${esc(target()?.name ?? 'the character')}, ${esc(playerName())}, the cast and the story. Values stay and can move again.</p>
            <div class="mw-actions"><button type="button" class="mw-danger" data-action="unpin-all"${words ? '' : ' disabled'}>Unpin everything</button></div>`)}
        ${card('defaults', '\u2302', '#9fc0e8', 'Defaults for new chats', `Used for ${esc(whose)}\u2019s new chats`, `
            <div class="mw-actions"><button data-action="baseline">${ui.who === 'cast' ? 'Save the whole cast' : ui.who === 'user' ? 'Save persona default' : ui.who === 'story' ? 'Save story default' : 'Save character default'}</button><button data-action="reset">Clear unpinned moodlets</button></div>`)}
        ${card('fresh', '\u2715', '#e26d7a', 'Clear everything', `Every mood, trait, fact and more for ${esc(whose)}`, `
            <p class="mw-fine">Turns off every moodlet, trait, turn-on, fact, want, item and skill for ${esc(whose)} in this chat, and their relationships. Pins come off. Bonds meters, the board and saved defaults stay.</p>
            ${sw('data-keep-types', true, 'Keep personality types')}
            <div class="mw-actions"><button type="button" class="mw-danger" data-action="clear-everything">Clear everything</button>${state.lastCleared ? '<button type="button" data-action="clear-undo">\u21ba Bring it back</button>' : ''}</div>`)}
    </section>`;
}
// Every pin in this chat, for everyone in it. Values stay where they are; they just stop being
// held. Needs you set and board corrections go back to following the board. Saved defaults aren't touched.
function chatStates(meta) {
    return [...Object.values(meta?.characters ?? {}), meta?.user, meta?.story, ...Object.values(meta?.cast ?? {}).flat().map(p => p?.state)].filter(st => st && typeof st === 'object');
}
export function pinCounts() {
    const meta = ctx().chatMetadata?.[KEY]; if (!meta) return null;
    const b = cleanBoardMeta(meta.board);
    return {
        sliders: chatStates(meta).reduce((n, st) => n + Object.values(st.pins ?? {}).filter(Boolean).length, 0),
        meters: Object.values(meta.bond ?? {}).reduce((n, bond) => n + Object.values(cleanBond(bond).pins).filter(v => v !== null).length, 0),
        ...(settings().boardPins ? { needs: Object.keys(b.needs).length, fixes: Object.keys(b.fix).length, kept: b.keep.state.length + b.keep.physical.length } : { needs: 0, fixes: 0, kept: 0 }),
    };
}
export const pinWords = n => [[n.sliders, 'slider'], [n.meters, 'meter'], [n.needs, 'need you set', 'needs you set'], [n.fixes, 'board correction'], [n.kept, 'kept board tile']]
    .filter(([v]) => v).map(([v, one, many]) => `${v} ${v === 1 ? one : many ?? `${one}s`}`).join(', ');
export async function clearAllPins() {
    const c = ctx(), meta = c.chatMetadata?.[KEY], n = pinCounts(); if (!meta || !n) return '';
    for (const st of chatStates(meta)) {
        let moved = false;
        for (const id of Object.keys(st.pins ?? {})) if (st.pins[id]) { st.pins[id] = false; moved = true; }
        if (moved) st.revision = (st.revision || 0) + 1;
    }
    // A meter keeps the value it was pinned at, and later replies move it from there.
    for (const [key, raw] of Object.entries(meta.bond ?? {})) {
        const bond = cleanBond(raw, settings().bondTrack), ch = c.characters.find(x => `char:${x.avatar}` === key);
        for (const k of METERS) if (bond.pins[k] !== null) { const v = bond.pins[k]; bond.pins[k] = null; if (ch) setMeter(bond, k, v, bondList(ch)); }
        meta.bond[key] = bond;
    }
    const b = cleanBoardMeta(meta.board); b.needs = {}; b.fix = {}; b.keep = { state: [], physical: [] }; meta.board = b;
    render(); await persist(); await syncPrompt();
    return pinWords(n);
}
// ---- Clear everything for one person, with a way back ----
export async function clearEverything(keepTypes) {
    const meta = ctx().chatMetadata?.[KEY], me = personKeyOfSubject();
    await changeState(s => {
        const pairs = Object.fromEntries(Object.entries(meta?.pairs ?? {}).filter(([, p]) => (p?.members ?? []).includes(me)));
        s.lastCleared = { at: Date.now(), state: structuredClone({ ...s, history: [], lastCleared: null }), pairs: structuredClone(pairs) };
        const blank = freshState({});
        for (const id of Object.keys(s.moods)) { s.moods[id] = 0; s.pins[id] = false; }
        Object.assign(s, { causes: {}, shows: {}, prefs: {}, inventory: [], wants: [], relationships: [], skills: {}, skillPins: {}, skillXp: {}, reason: '', targets: blank.targets, loadout: [] });
        if (!keepTypes) Object.assign(s, { personality: blank.personality, enneagram: blank.enneagram });
        for (const id of Object.keys(pairs)) delete meta.pairs[id];
    });
}
export async function undoClear() {
    const meta = ctx().chatMetadata?.[KEY];
    await changeState(s => {
        const saved = s.lastCleared; if (!saved?.state) return;
        const history = s.history; Object.assign(s, saved.state, { history, lastCleared: null });
        for (const [id, p] of Object.entries(saved.pairs ?? {})) (meta.pairs ??= {})[id] = p;
    });
}
