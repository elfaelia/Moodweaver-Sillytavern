import test from 'node:test';
import assert from 'node:assert/strict';

let context, request, injected, calls;
globalThis.jQuery = () => {}; // DOM initialisation is exercised by the browser preview.
globalThis.SillyTavern = { getContext: () => context };
const { analyse, getState, syncPrompt, stopGenerating } = await import('../index.js');
// Settings reach the note as strength words, not numbers: Calm at 60 is "- clear: calm and relaxed".
const line = (tier, word) => new RegExp(`- ${tier}: ${word}`, 'i');
function reset() {
    calls = 0; injected = ''; stopGenerating();
    request = async () => ({ content: '{"moods":{"playful":80},"reason":"A friendly joke."}' });
    context = {
        characterId: 0, characters: [{ avatar: 'alex.png', name: 'Alex' }, { avatar: 'robin.png', name: 'Robin' }],
        chatId: 'chat-A', chatMetadata: {}, extensionSettings: {},
        chat: [{ is_user: true, name: 'You', mes: 'A friendly greeting.' }],
        setExtensionPrompt: (_key, value) => { injected = value; },
        getTokenCountAsync: async text => Math.ceil(text.length / 4), saveMetadata: async () => {}, saveSettingsDebounced: () => {},
        ConnectionManagerRequestService: { sendRequest: async (...args) => { calls++; return request(...args); } },
    };
}
test('manual injection and chat/character isolation', async () => {
    reset(); getState().moods.calm = 60; await syncPrompt(); assert.match(injected, line('clear', 'calm'));
    // Another chat has its own state: Alex's calm doesn't follow. (Its note still carries the board and hidden-line instructions.)
    const saved = context.chatMetadata;
    context.chatMetadata = {}; context.chatId = 'chat-B'; await syncPrompt(); assert.doesNotMatch(injected, /calm/i);
    context.chatMetadata = saved; context.chatId = 'chat-A'; await syncPrompt(); assert.match(injected, line('clear', 'calm'));
    context.characterId = 1; context.chatMetadata = {}; await syncPrompt(); assert.doesNotMatch(injected, /calm/i);
});
test('dynamic uses chosen profile, no RP preset, and deduplicates same scene', async () => {
    reset(); const s = getState(); s.profile = 'cheap-model'; s.mode = 'dynamic';
    request = async (id, messages, max, options) => {
        assert.equal(id, 'cheap-model'); assert.equal(options.includePreset, false); assert.equal(max, 800);
        assert.equal(messages.length, 2); return { content: '{"moods":{"playful":80}}' };
    };
    // One read moves a feeling most of the way (follow 90%) to the reader's estimate; the same scene isn't read twice.
    await analyse(); assert.equal(s.moods.playful, 72); await analyse(); assert.equal(calls, 1);
});
test('failure preserves state; no automatic retry or fallback model', async () => {
    reset(); const s = getState(); s.profile = 'bad'; s.moods.calm = 70;
    request = async () => ({ content: 'not JSON' }); await analyse(); assert.equal(s.moods.calm, 70); assert.equal(calls, 1); assert.equal(s.history.length, 0);
});
test('late response after changing chats is discarded', async () => {
    reset(); const s = getState(); s.profile = 'cheap'; let finish;
    request = () => new Promise(resolve => { finish = resolve; });
    const run = analyse(); context.chatId = 'chat-B'; context.chatMetadata = {};
    finish({ content: '{"moods":{"angry":90}}' }); await run;
    assert.equal(s.moods.angry, 0); assert.equal(getState().moods.angry, 0); assert.doesNotMatch(injected, /angry|furious/i);
});
test('late response cannot overwrite a manual adjustment', async () => {
    reset(); const s = getState(); s.profile = 'cheap'; let finish;
    request = () => new Promise(resolve => { finish = resolve; });
    const run = analyse(); s.moods.calm = 88; s.revision++;
    finish({ content: '{"moods":{"calm":0}}' }); await run; assert.equal(s.moods.calm, 88);
});
test('generation hook suppresses quiet/impersonation and avoids charges on swipes', async () => {
    reset(); const s = getState(); s.profile = 'cheap'; s.mode = 'dynamic'; s.moods.calm = 60;
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'quiet'); assert.equal(injected, ''); assert.equal(calls, 0);
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'swipe'); stopGenerating(); assert.match(injected, line('clear', 'calm')); assert.equal(calls, 0);
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'normal'); stopGenerating(); assert.equal(calls, 1);
});
test('initial analysis runs even with multi-turn interval, then waits for interval', async () => {
    reset(); const s = getState(); s.profile = 'cheap'; s.interval = 3;
    await analyse(); assert.equal(calls, 1);
    context.chat.push({ is_user: true, mes: 'Next turn.' }); await analyse(); assert.equal(calls, 1);
    context.chat.push({ is_user: true, mes: 'Another.' }, { is_user: true, mes: 'Third.' }); await analyse(); assert.equal(calls, 2);
});
test('group characters have independent moods and injection follows drafted speaker', async () => {
    reset(); context.groupId = 'g'; context.groups = [{ id: 'g', members: ['alex.png', 'robin.png'] }];
    getState(context.characters[0]).moods.calm = 25; getState(context.characters[1]).moods.angry = 70;
    context.characterId = 1; await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'normal'); stopGenerating();
    assert.match(injected, /Robin/); assert.match(injected, line('strong', 'angry')); assert.doesNotMatch(injected, /- \w+: calm/);
});
