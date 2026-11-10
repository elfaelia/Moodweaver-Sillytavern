// Shared state: what the panel has open, what's running, and small helpers every part uses.


// Panel state (what's open and selected) and runtime state (requests in flight, the note's version).
export const ui = {
    panel: undefined,
    selectedAvatar: '',
    selectedCastId: '',
    castAction: '',
    search: '',
    tab: 'mood',
    who: 'char',
    settingsOpen: false,
    boardEditing: false,
    boardFocus: '',
    renderLater: false,
    selectedPeer: '',
    removingRelation: '',
    pairView: 'mine',
    browsing: false,
    lastDrawError: '',
    pointerInPanel: false,
    drawnPeer: undefined,
    drawnPairView: undefined,
    dragEndedAt: 0,
};
export const run = {
    pending: null,
    promptVersion: 0,
    suspended: false,
    promptInfo: { prompt: '', tokens: 0, omitted: 0 },
    status: '',
    boardTimer: 0,
    generating: false,
    genTimer: 0,
    resyncAfter: false,
    migrationNote: '',
};
export const KEY = 'moodweaver';
export const PROMPT_KEY = 'moodweaver-state';
export const ctx = () => SillyTavern.getContext();
export const VERSION = '1.50.0';
// Which folder this copy runs from, so a second installed copy can be spotted and named.
export const SELF = new URL('../index.js', import.meta.url).href;
export const folderOf = url => { try { return decodeURIComponent(new URL(url).pathname.split('/').slice(-2, -1)[0] || '?'); } catch { return '?'; } };

// Needs board UI: editing the scene text, and which tile's actions are open ('state:text').

// While a reply is being written, the note built for it stays put. Anything else that wants to
// redraw the note waits until the reply is done, so a late redraw can't swap in an older reading.

export const generationSnapshots = new Map();
export const newId = () => Math.random().toString(36).slice(2, 10);
// Live slider readouts: if a redraw has replaced the row, there's simply nothing to update.
export const put = (scope, selector, text) => { const el = scope?.querySelector(selector); if (el) el.textContent = text; };
