// Moodweaver's global settings: defaults, and upgrading settings saved by older versions.
import { KEY, ctx } from './state.js';
import { clamp } from '../engine/util.js';
import { ERA_LINE_CHOICES } from '../engine/period.js';
import { PERIOD } from '../data/catalogue/period.js';
// Before 1.73 each person had a three-way "Lines about" button; kept apart becomes every everyday-life line
// switched off, and no lines becomes all of them off.
function periodOffFrom(saved) {
    const out = saved.periodOff && typeof saved.periodOff === 'object' ? saved.periodOff : {};
    for (const [key, skip] of Object.entries(saved.eraSkip && typeof saved.eraSkip === 'object' ? saved.eraSkip : {}))
        for (const k of ['n', 'u']) if (skip?.[k] && !out[key]?.[k]) (out[key] ??= {})[k] = PERIOD.filter(l => skip[k] !== 'apart' || l.world).map(l => l.id);
    return out;
}
import { CLASH_CHOICES } from '../engine/links.js';

const defaults = { tokenBudget: 2000, depth: 0, placementVersion: 1, sceneMessages: 6, sceneChars: 8000, outputTokens: 800, baselines: {}, promptVersion: 6, readerProfile: '', boardSend: true, boardPresent: true, blendPlan: false, bondTrack: true, boardStrip: true, boardMemories: false, boardPins: false, boardWithWeave: true, needsDrift: true, needsSpeed: 'normal', needsSkips: true, needsFloor: true, youTrack: true, wantSuggest: true, showsMode: 'all', combosOn: true, cravingsOn: true, skillLookback: 1, eraLines: '3', wantsTab: true, whyOn: true, authorStyle: true, needsMood: true, moodClash: 'sometimes', natureFit: true, factsWhenRelevant: true, traitFocus: true, splitNote: true, factOpposites: true, contagion: 'scene', aftermath: true, snaps: true, writerMain: '', writerAlt: '', fillInWriter: '', dialsOpen: false, musicTab: true, blendsOn: true, dockClose: true, chipRemove: true, castAuto: true, fillInChip: true };
export function settings() {
    const c = ctx();
    c.extensionSettings[KEY] ??= structuredClone(defaults);
    const saved = c.extensionSettings[KEY];
    // The v2 prompt explains each strength tier in words, so the old 320 default is too tight.
    if ((saved.promptVersion ?? 1) < 3) { if ([320, 500].includes(saved.tokenBudget ?? 320)) saved.tokenBudget = 800; saved.promptVersion = 3; }
    // The target matches the ~2000-token goal, and the reader looks at fewer, more recent messages.
    if (saved.promptVersion < 4) {
        if ((saved.tokenBudget ?? 800) === 800) saved.tokenBudget = 2000;
        if ((saved.sceneMessages ?? 8) === 8) saved.sceneMessages = 6;
        if ((saved.sceneChars ?? 12000) === 12000) saved.sceneChars = 8000;
        saved.promptVersion = 4; c.saveSettingsDebounced();
    }
    // Anthropic's Opus 5.5 guide says "think before answering" lines in chat apps add latency and
    // billed thinking without a clear quality gain, so blend planning starts off (it can be turned back on).
    if (saved.promptVersion < 5) { saved.blendPlan = false; saved.boardStrip ??= true; saved.promptVersion = 5; c.saveSettingsDebounced(); }
    // 1.50 dropped your own options and dynamics for a fresh start with the built-in ones.
    if (saved.promptVersion < 6) { delete saved.library; delete saved.ownDynamics; saved.promptVersion = 6; c.saveSettingsDebounced(); }
    // Move the former default after the latest message once; keep other custom depths.
    if (!saved.placementVersion) {
        if (saved.depth == null || Number(saved.depth) === 1) saved.depth = 0;
        saved.placementVersion = 1;
        c.saveSettingsDebounced();
    }
    return Object.assign(saved, {
        tokenBudget: clamp(saved.tokenBudget ?? 800, 160, 3000),
        depth: Math.round(clamp(saved.depth ?? 0, 0, 10)),
        sceneMessages: Math.round(clamp(c.extensionSettings[KEY].sceneMessages ?? 6, 2, 20)),
        sceneChars: clamp(c.extensionSettings[KEY].sceneChars ?? 8000, 2000, 40000),
        outputTokens: clamp(c.extensionSettings[KEY].outputTokens ?? 800, 300, 16000),
        baselines: c.extensionSettings[KEY].baselines ?? {},
        castDefaults: c.extensionSettings[KEY].castDefaults ?? {},
        // The dynamics picked for each character's new chats.
        dynamicPools: saved.dynamicPools && typeof saved.dynamicPools === 'object' ? saved.dynamicPools : {},
        // Named author blends, per character: { 'char:<avatar>': [{ name, authors: { id: value }, roles: { id: role } }] }.
        authorBlends: saved.authorBlends && typeof saved.authorBlends === 'object' ? saved.authorBlends : {},
        // Setting lines switched off on each person's Setting tab, per character: { 'char:<avatar>': { n: [ids], u: [ids] } }.
        periodOff: periodOffFrom(saved),
        // The Setting tab's era sets switched on or off and the place, per character (2.0.6): { 'char:<avatar>': { on: { '80s': true }, place: 'uk' } }.
        periodSets: saved.periodSets && typeof saved.periodSets === 'object' ? saved.periodSets : {},
        boardSend: saved.boardSend !== false, boardPresent: saved.boardPresent !== false, castAuto: saved.castAuto !== false, blendPlan: saved.blendPlan === true, bondTrack: saved.bondTrack !== false, boardStrip: saved.boardStrip !== false,
        // Board memories and board pins are opt-in; board words count alongside the hidden line.
        boardMemories: saved.boardMemories === true, boardPins: saved.boardPins === true, boardWithWeave: saved.boardWithWeave !== false,
        // Needs over in-world time, your character's condition, and wants the story suggests.
        needsDrift: saved.needsDrift !== false, needsSpeed: ['gentle', 'normal', 'harsh'].includes(saved.needsSpeed) ? saved.needsSpeed : 'normal',
        needsSelf: saved.needsSelf !== false, needsSkips: saved.needsSkips !== false, needsFloor: saved.needsFloor !== false, youTrack: saved.youTrack !== false, wantSuggest: saved.wantSuggest !== false,
        showsMode: ['all', 'mine', 'off'].includes(saved.showsMode) ? saved.showsMode : 'all',
        moodClash: CLASH_CHOICES.includes(saved.moodClash) ? saved.moodClash : 'sometimes',
        // Who-they-are facts (looks, style, voice, job, past) only when the scene touches them, so the card isn't repeated.
        factsWhenRelevant: saved.factsWhenRelevant !== false,
        turnsWhenRelevant: saved.turnsWhenRelevant !== false,
        turnsSend: ['all', 'fit', 'heat'].includes(saved.turnsSend) ? saved.turnsSend : saved.turnsWhenRelevant === false ? 'all' : 'fit',
        turnsStrong: saved.turnsStrong === true,
        turnsEvery: [0, 2, 3, 4, 5, 6, 8, 10].includes(Number(saved.turnsEvery)) ? Number(saved.turnsEvery) : 6,
        traitFocus: saved.traitFocus !== false,
        // Story groups hidden from the Story tab and search (Settings \u203a Panel). Anything already on in them still sends.
        hiddenGroups: Array.isArray(saved.hiddenGroups) ? saved.hiddenGroups.filter(x => typeof x === 'string') : [],
        // The note in two halves: a guide that stays the same (cacheable) and what's true right now (last).
        splitNote: saved.splitNote !== false,
        // Opposite facts (Hot and Cold) switch each other off.
        factOpposites: saved.factOpposites !== false,
        // Feelings carrying on: the player's feeling rubbing off on an empathetic character, and a strong feeling's aftermath.
        contagion: saved.contagion === 'off' ? 'off' : 'scene', noteOrder: ['before', 'rules'].includes(saved.noteOrder) ? saved.noteOrder : 'after', aftermath: saved.aftermath !== false, snaps: saved.snaps !== false, stress: saved.stress !== false, opinions: saved.opinions !== false, secrets: saved.secrets !== false, arcOffers: saved.arcOffers !== false, autoWants: saved.autoWants === true,
        // Combos and cravings.
        combosOn: saved.combosOn !== false, cravingsOn: saved.cravingsOn !== false, skillLookback: [1, 2, 3].includes(Number(saved.skillLookback)) ? Number(saved.skillLookback) : 1,
        // How many period lines (Power, Medicine, Vices\u2026) at most; when more apply, they take turns.
        eraLines: ERA_LINE_CHOICES.includes(Number(saved.eraLines)) ? String(saved.eraLines) : '3',
        // The Wants tab can be hidden (wants you already set still go to the story), and the faint "why" lines too.
        fillInChip: saved.fillInChip !== false, wantsTab: saved.wantsTab !== false, musicTab: saved.musicTab !== false, blendsOn: saved.blendsOn !== false, dockClose: saved.dockClose !== false, swipeTabs: saved.swipeTabs !== false, diceOn: saved.diceOn !== false, diceShow: saved.diceShow === true, chipRemove: saved.chipRemove !== false, whyOn: saved.whyOn !== false, authorStyle: saved.authorStyle !== false, needsMood: saved.needsMood !== false,
    });
}
