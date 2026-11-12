// Moodweaver's global settings: defaults, and upgrading settings saved by older versions.
import { KEY, ctx } from './state.js';
import { clamp } from '../engine/util.js';

const defaults = { tokenBudget: 2000, depth: 0, placementVersion: 1, sceneMessages: 6, sceneChars: 8000, outputTokens: 800, baselines: {}, promptVersion: 6, readerProfile: '', boardSend: true, boardPresent: true, blendPlan: false, bondTrack: true, boardStrip: true, boardMemories: false, boardPins: false, boardWithWeave: true, needsDrift: true, needsSpeed: 'normal', needsSkips: true, needsFloor: true, youTrack: true, wantSuggest: true, showsMode: 'all', combosOn: true, cravingsOn: true, skillLookback: 1, eraLines: '3' };
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
        boardSend: saved.boardSend !== false, boardPresent: saved.boardPresent !== false, blendPlan: saved.blendPlan === true, bondTrack: saved.bondTrack !== false, boardStrip: saved.boardStrip !== false,
        // Board memories and board pins are opt-in; board words count alongside the hidden line.
        boardMemories: saved.boardMemories === true, boardPins: saved.boardPins === true, boardWithWeave: saved.boardWithWeave !== false,
        // Needs over in-world time, your character's condition, and wants the story suggests.
        needsDrift: saved.needsDrift !== false, needsSpeed: ['gentle', 'normal', 'harsh'].includes(saved.needsSpeed) ? saved.needsSpeed : 'normal',
        needsSkips: saved.needsSkips !== false, needsFloor: saved.needsFloor !== false, youTrack: saved.youTrack !== false, wantSuggest: saved.wantSuggest !== false,
        showsMode: ['all', 'mine', 'off'].includes(saved.showsMode) ? saved.showsMode : 'all',
        // Combos and cravings.
        combosOn: saved.combosOn !== false, cravingsOn: saved.cravingsOn !== false, skillLookback: [1, 2, 3].includes(Number(saved.skillLookback)) ? Number(saved.skillLookback) : 1,
        // How many period lines (Power, Medicine, Vices…) at most; when more apply, they take turns.
        eraLines: ['1', '2', '3', '4'].includes(String(saved.eraLines)) ? String(saved.eraLines) : '3',
    });
}
