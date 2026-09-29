import { freshState } from './core.js';
const handlers = {};
const metadata = [{ moodweaver: { version: 1, characters: { 'char:alex.png': freshState({ moods: { affectionate: 68, jealous: 42, stoic: 55 } }) } } }, {}];
let which = 0;
const context = {
    characterId: 0, characters: [{ avatar: 'alex.png', name: 'Alex', personality: 'Reserved but warm.' }], chatId: 'rainy evening',
    chatMetadata: metadata[0], chat: [{ name: 'You', is_user: true, mes: 'I saved you a seat.' }], extensionSettings: {},
    eventTypes: Object.fromEntries(['CHAT_CHANGED','GENERATION_STOPPED','GENERATION_ENDED','GENERATION_AFTER_COMMANDS'].map(k => [k, k])),
    eventSource: { on: (e, fn) => { (handlers[e] ??= []).push(fn); } },
    saveMetadata: async () => {}, saveSettingsDebounced: () => {}, getTokenCountAsync: async t => Math.ceil(t.length / 4),
    setExtensionPrompt: (_key, text) => { document.querySelector('#preview-prompt').textContent = text; },
    ConnectionManagerRequestService: {
        getSupportedProfiles: () => [{ id: 'demo', name: 'Preview analyser', model: 'simulated · no API calls' }],
        sendRequest: async (_id, _prompt, _tokens, { signal }) => {
            await new Promise((resolve, reject) => { const t = setTimeout(resolve, 700); signal.addEventListener('abort', () => { clearTimeout(t); reject(new Error('Cancelled')); }); });
            return { content: '{"moods":{"affectionate":80,"calm":55,"jealous":20},"reason":"Being offered a seat eases the tension."}' };
        },
    },
};
globalThis.SillyTavern = { getContext: () => context };
await import('./index.js');
document.querySelector('#moodweaver-launcher').click();
document.querySelector('#switch-chat').onclick = async () => {
    which = 1 - which; context.chatMetadata = metadata[which]; context.chatId = which ? 'a fresh morning' : 'rainy evening';
    document.querySelector('#preview-chat').textContent = `Alex · ${context.chatId}`;
    for (const fn of handlers.CHAT_CHANGED ?? []) await fn();
};
document.querySelector('#fake-turn').onclick = async () => {
    context.chat.push({ name: 'You', is_user: true, mes: `Scene beat ${context.chat.length}.` });
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'normal');
    document.querySelector('#preview-result').textContent = 'Reply prepared. No real model request was made.';
};
