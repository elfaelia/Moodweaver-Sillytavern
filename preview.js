// Phone preview: the real extension against a simulated SillyTavern chat (Easterman and Lamb).
// No model calls. Run `node preview-server.mjs` and open http://127.0.0.1:8768 (narrow the window to phone width).
import { freshState } from './core.js';
const handlers = {};
const board = (time, state, physical) => `<div class="ihyll-style">
📅 <b>Date:</b> Tuesday, October 3, 1961 | Autumn | 🌧️ | Forecast: 11°C (52°F), rain all night<br>
🕒 <b>Time:</b> ${time}<br>
🗺️ <b>Location:</b> Infirmary Ward, Murkoff Sanatorium | <b>Present:</b> Lamb, Irene | <b>Activity:</b> Easterman hunched over the bed rail, humming<br>
👔 <b> Doctor Easterman’s Outfit:</b> rumpled white coat, tie loosened, sleeves rolled<br>
👗 <b>Lamb’s Outfit:</b> thin ward gown, bare feet<br>
🧠 <b>State:</b> ${state}<br>
💎 <b>Physical State:</b> ${physical}
</div>`;
const reply = (time, state, physical, prose, weave) => ({ name: 'Doctor Easterman', is_user: false, mes: `${board(time, state, physical)}\n\n${prose}\n\n${weave}` });
const chat = [
    { name: 'Lamb', is_user: true, mes: 'She stirs, fingers twitching against the sheet.' },
    reply('1:40 AM', 'desperate, quietly elated', 'Voice worn to a croak from five hours of humming; spine locked from the stoop', 'He does not stop humming. He does not dare.', '<!-- weave: moods desperate +5, excited +10 | friendship 0 | romance +3 | feels: devoted, terrified | thinks: his, waking -->'),
    { name: 'Lamb', is_user: true, mes: 'Her eyes open, unfocused.' },
    reply('1:54 AM', 'desperate, overwhelming relief, clingy', 'Voice worn to a croak from five hours of humming; spine locked from the stoop; finger swollen to a sausage; stomach empty and sour', 'The tune catches in his throat and comes out as her name.', '<!-- weave: moods relieved +25, clingy +10 | toward protective +10 | romance +3 | trust -2 | control Easterman +2 | pull Lamb +3 | thinks: stubborn, his | sparked: Lamb\'s defiance | remember: Lamb woke to his humming after the seizure -->'),
];
const meta = { moodweaver: { version: 1,
    characters: { 'char:easterman.png': freshState({ moods: { desperate: 95, excited: 85, clingy: 79, possessive: 60, yearning: 37, codependent: 22, obsessed: 0 }, pins: { desperate: true },
        relationships: [{ id: 'r1', target: '{{user}}', enabled: true, moods: { obsessed: 88, captor_of: 90, indulges: 75, lets_them_win: 60, shows_spoiling: 70, above_spouse: 65 } }] }) },
    cast: { 'char:easterman.png': [{ id: 'c1', name: 'Irene', inScene: true, state: freshState({ moods: { anxious: 55 } }) }, { id: 'c2', name: 'Skinner Man', inScene: false, state: freshState({}) }] },
} };
const context = {
    characterId: 0, characters: [{ avatar: 'easterman.png', name: 'Doctor Easterman', personality: 'A devoted, unravelling scientist.' }], chatId: 'infirmary ward', name1: 'Lamb',
    chatMetadata: meta, chat, extensionSettings: {},
    eventTypes: Object.fromEntries(['CHAT_CHANGED', 'GENERATION_STOPPED', 'GENERATION_ENDED', 'GENERATION_AFTER_COMMANDS', 'MESSAGE_RECEIVED'].map(k => [k, k])),
    eventSource: { on: (e, fn) => { (handlers[e] ??= []).push(fn); } },
    saveMetadata: async () => {}, saveSettingsDebounced: () => {}, getTokenCountAsync: async t => Math.ceil(t.length / 3.6),
    setExtensionPrompt: (_key, text) => { const el = document.querySelector('#preview-prompt'); if (el) el.textContent = text; },
    ConnectionManagerRequestService: { getSupportedProfiles: () => [] },
};
globalThis.SillyTavern = { getContext: () => context };
globalThis.__mwPreview = { context, handlers, fire: async e => { for (const fn of handlers[e] ?? []) await fn(); } };
await import('./index.js');
await globalThis.__mwPreview.fire('MESSAGE_RECEIVED');
await new Promise(r => setTimeout(r, 300));
document.querySelector('#moodweaver-launcher').click();
document.querySelector('#fake-turn')?.addEventListener('click', async () => {
    const copy = structuredClone(context.chat);
    await globalThis.moodweaverBeforeGeneration(copy, 8000, () => {}, 'normal');
    document.querySelector('#preview-result').textContent = 'Reply prepared. No real model request was made.';
});
