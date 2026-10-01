import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState } from '../core.js';
let context, injected;
globalThis.jQuery = () => {};
globalThis.SillyTavern = { getContext: () => context };
const { getState, getKnowledge, syncPrompt } = await import('../index.js');
test('knowledge survives reload and stays isolated by chat, observer and persona', async () => {
    context = {
        characterId: 0, name1: 'Sam', chatId: 'A', groupId: 'group',
        characters: [{ avatar: 'alex.png', name: 'Alex' }, { avatar: 'robin.png', name: 'Robin' }],
        groups: [{ id: 'group', members: ['alex.png', 'robin.png'] }],
        chatMetadata: {}, extensionSettings: {}, saveSettingsDebounced() {},
        getTokenCountAsync: async s => s.length,
        setExtensionPrompt: (_key, value) => { injected = value; },
    };
    getState();
    context.chatMetadata.moodweaver.user = freshState({ moods: { worried: 96 } });
    getKnowledge(undefined, true).worried = { mode: 'known', source: 'Told Alex yesterday' };
    await syncPrompt(true);
    assert.match(injected, /Known —[^]*Told Alex yesterday/);
    context.characterId = 1;
    await syncPrompt(true);
    assert.match(injected, /Scene only/);
    assert.doesNotMatch(injected, /Told Alex yesterday/);
    context.characterId = 0;
    context.name1 = 'Another persona'; assert.deepEqual(getKnowledge(), {});
    context.name1 = 'Sam';
    const saved = JSON.parse(JSON.stringify(context.chatMetadata));
    context.chatId = 'B'; context.chatMetadata = {};
    getState(); assert.deepEqual(getKnowledge(), {});
    context.chatId = 'A'; context.chatMetadata = saved;
    await syncPrompt(true); assert.match(injected, /Told Alex yesterday/);
    context.chatMetadata.moodweaver.user.moods.worried = 0;
    await syncPrompt(true); assert.equal(injected, '');
    assert.equal(getKnowledge().worried.mode, 'known');
});
