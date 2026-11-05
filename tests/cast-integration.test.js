import test from 'node:test';
import assert from 'node:assert/strict';
import { addCastMember } from '../cast.js';

let context, injected = '', requests = 0;
globalThis.jQuery = () => {};
globalThis.SillyTavern = { getContext: () => context };
const { getCast, getState, saveCastDefault, loadCastDefault, syncPrompt, stopGenerating } = await import('../index.js');

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
    chloe.state.moods.angry = 100;
    getState().enabled = false;
    // The note always carries the board and hidden-line instructions, so "no Chloe" is checked by name.
    const hasChloe = () => /supporting_character name="Chloe"[^]*consumed by rage/.test(injected);
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'normal'); stopGenerating();
    assert.ok(hasChloe(), 'Mark’s cast is sent on Mark’s turn');
    assert.equal(requests, 0, 'no paid reader request');
    saveCastDefault();
    const chatA = JSON.parse(JSON.stringify(context.chatMetadata));
    context.characterId = 1;
    await syncPrompt(true);
    assert.ok(!hasChloe(), 'Alex’s turn doesn’t carry Mark’s cast');
    context.characterId = 0;
    context.chatMetadata = {}; context.chatId = 'B';
    await syncPrompt(true);
    assert.equal(getCast()[0].state.moods.angry, 100, 'a new chat starts from the saved cast');
    assert.equal(getCast()[0].inScene, false, 'but nobody is in the scene yet');
    assert.ok(!hasChloe());
    getCast()[0].state.moods.angry = 10;
    assert.equal(loadCastDefault(), true);
    assert.equal(getCast()[0].state.moods.angry, 100);
    assert.equal(getCast()[0].inScene, false);
    context.chatMetadata = chatA; context.chatId = 'A';
    await syncPrompt(true);
    assert.equal(getCast()[0].state.moods.angry, 100);
    assert.ok(hasChloe(), 'back in chat A, Chloe is there as she was');
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'quiet');
    assert.equal(injected, '', 'quiet generations get nothing');
    getCast()[0].inScene = false;
    await syncPrompt(); assert.ok(!hasChloe(), 'out of the scene, out of the note');
});
