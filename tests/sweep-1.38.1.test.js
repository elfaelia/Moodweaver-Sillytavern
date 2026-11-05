// 1.38.1 sweep: a stricter scene-reader parser, and Continue keeping the board of the reply it continues.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalysis, applyAnalysis, freshState } from '../core.js';

let context;
globalThis.jQuery = () => {};
globalThis.SillyTavern = { getContext: () => context };
await import('../index.js');

test('a broken reader reply changes nothing; an empty feelings list is still an answer', () => {
    for (const bad of ['{}', '{"moods":[]}', '{"moods":{"angry":200}}', '{"moods":{"angry":-5}}']) assert.throws(() => parseAnalysis(bad), bad);
    assert.deepEqual(parseAnalysis('{"moods":{}}').moods, {});
    assert.deepEqual(parseAnalysis('{"moods":{"calm":40,"angry":150}}').moods, { calm: 40 });
    // Wants without a feelings list: the wants count and no feeling fades.
    const s = freshState({ moods: { calm: 60 } });
    const r = parseAnalysis('{"wants":[],"new":[{"kind":"fear","text":"being sent back"}]}', { wants: [] });
    applyAnalysis(s, r, { mood: true, wants: true });
    assert.equal(s.moods.calm, 60); assert.equal(r.added.length, 1);
});

test('Continue keeps the board of the reply being continued; older boards still leave the prompt', async () => {
    const board = t => `<div class="ihyll-style">\n🕒 <b>Time:</b> ${t}<br>\n🧠 <b>State:</b> calm\n</div>`;
    context = { characterId: 0, characters: [{ avatar: 'e.png', name: 'E' }], name1: 'L', chatId: 'c', chatMetadata: {}, extensionSettings: {},
        chat: [], setExtensionPrompt() {}, getTokenCountAsync: async () => 1, saveMetadata: async () => {}, saveSettingsDebounced() {} };
    const copy = [{ name: 'E', is_user: false, mes: `${board('1 PM')}\n\nOld reply.` }, { name: 'L', is_user: true, mes: 'Go on.' }, { name: 'E', is_user: false, mes: `${board('2 PM')}\n\nHe sta` }];
    context.chat = structuredClone(copy);
    await globalThis.moodweaverBeforeGeneration(copy, 8000, () => {}, 'continue');
    assert.doesNotMatch(copy[0].mes, /ihyll-style/, 'the old board leaves the prompt');
    assert.match(copy[2].mes, /2 PM/, 'the reply being continued keeps its board');
    const again = structuredClone(context.chat);
    await globalThis.moodweaverBeforeGeneration(again, 8000, () => {}, 'normal');
    assert.doesNotMatch(again[2].mes, /ihyll-style/, 'on a normal reply every board leaves');
});
