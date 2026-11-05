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
    context.chatMetadata.moodweaver.user = freshState({ moods: { anxious: 96 } });
    getKnowledge(undefined, true).anxious = { mode: 'known', source: 'Told Alex yesterday' };
    await syncPrompt(true);
    assert.match(injected, /Alex knows for sure[^]*how: Told Alex yesterday/);
    context.characterId = 1;
    await syncPrompt(true);
    assert.match(injected, /Robin can see or already knows:/, 'another observer has their own knowledge');
    assert.doesNotMatch(injected, /Told Alex yesterday/);
    context.characterId = 0;
    context.name1 = 'Another persona'; assert.deepEqual(getKnowledge(), {});
    context.name1 = 'Sam';
    const saved = JSON.parse(JSON.stringify(context.chatMetadata));
    context.chatId = 'B'; context.chatMetadata = {};
    getState(); assert.deepEqual(getKnowledge(), {});
    context.chatId = 'A'; context.chatMetadata = saved;
    await syncPrompt(true); assert.match(injected, /Told Alex yesterday/);
    context.chatMetadata.moodweaver.user.moods.anxious = 0;
    await syncPrompt(true); assert.doesNotMatch(injected, /Told Alex yesterday|player_character/, 'switched off, it isn’t sent');
    assert.equal(getKnowledge().anxious.mode, 'known', 'but the choice is kept for next time');
});
