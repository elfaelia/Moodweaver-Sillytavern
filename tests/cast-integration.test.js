import test from 'node:test';
import assert from 'node:assert/strict';
import { addCastMember } from '../cast.js';

let context, injected = '', requests = 0;
globalThis.jQuery = () => {};
globalThis.SillyTavern = { getContext: () => context };
const { getCast, getState, saveCastDefault, loadCastDefault, syncPrompt } = await import('../index.js');

test('cast injection follows the actual speaker and survives saves without leaking between chats', async () => {
    context = {
        characterId: 0, name1: 'Ellie', chatId: 'A', groupId: 'g',
        characters: [{ avatar: 'mark.png', name: 'Mark' }, { avatar: 'alex.png', name: 'Alex' }],
        groups: [{ id: 'g', members: ['mark.png', 'alex.png'] }], chat: [],
        chatMetadata: {}, extensionSettings: {}, saveSettingsDebounced() {}, saveMetadata: async () => {},
        getTokenCountAsync: async s => s.length, setExtensionPrompt: (_key, value) => { injected = value; },
        ConnectionManagerRequestService: { sendRequest: async () => { requests++; } },
    };
    const chloe = addCastMember(getCast(), 'Chloe', 'chloe');
    chloe.state.moods.hates_char = 100;
    getState().enabled = false;
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'normal');
    assert.match(injected, /supporting_character name="Chloe"[^]*hatred for Mark/);
    assert.equal(requests, 0);
    saveCastDefault();
    const chatA = JSON.parse(JSON.stringify(context.chatMetadata));
    context.characterId = 1;
    await syncPrompt(true);
    assert.equal(injected, '');
    context.characterId = 0;
    context.chatMetadata = {}; context.chatId = 'B';
    await syncPrompt(true);
    assert.equal(getCast()[0].state.moods.hates_char, 100);
    assert.equal(getCast()[0].inScene, false);
    assert.equal(injected, '');
    getCast()[0].state.moods.hates_char = 10;
    assert.equal(loadCastDefault(), true);
    assert.equal(getCast()[0].state.moods.hates_char, 100);
    assert.equal(getCast()[0].inScene, false);
    context.chatMetadata = chatA; context.chatId = 'A';
    await syncPrompt(true);
    assert.equal(getCast()[0].state.moods.hates_char, 100);
    assert.match(injected, /hatred for Mark/);
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'quiet');
    assert.equal(injected, '');
    getCast()[0].inScene = false;
    await syncPrompt(); assert.equal(injected, '');
});
