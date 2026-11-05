import test from 'node:test';
import assert from 'node:assert/strict';
import { composePrompt, freshState, knowledgeEntry, budgetPrompt, migrateCatalogue } from '../core.js';
// Worried has been part of Anxious / worried since the 1.9.15 merge, so its knowledge lives under "anxious".
const subject = freshState({ moods: { calm: 50 } });
const persona = freshState({ moods: { anxious: 96, tired: 4, voice_high: 70, confident: 100 } });
const block = p => p.match(/<player_character[^]*?<\/player_character>/)?.[0] ?? '';
const prompt = (knowledge, state = persona) => composePrompt(subject, 'Alex', { player: { name: 'Sam', state, knowledge } });
test('knowledge groups retain each active strength once with no effect on the observer', () => {
    const p = prompt({ anxious: { mode: 'known' }, tired: { mode: 'private' }, voice_high: { mode: 'suspected' } });
    const b = block(p);
    for (const text of ['overwhelming: consumed by worry', 'faint: low on energy', 'strong: a high-pitched voice', 'maximum: confident']) assert.equal(b.split(text).length - 1, 1, text);
    assert.match(b, /Alex knows for sure, feelings included:\n- overwhelming: consumed by worry/);
    assert.match(b, /True, but Alex doesn't know it:\n- faint: low on energy/);
    assert.match(b, /Alex suspects or has picked up on:\n- strong: a high-pitched voice/);
    assert.match(b, /Alex can see or already knows:\n- maximum: confident/);
    assert.doesNotMatch(p.match(/<character_state[^]*?<\/character_state>/)[0], /worry|knows for sure/, 'Sam’s settings never land on Alex');
    assert.match(b, /knowing a feeling isn't reading a mind/);
});
test('old saves default to scene evidence and inactive knowledge is not sent', () => {
    assert.match(block(prompt()), /Alex can see or already knows:/);
    assert.doesNotMatch(prompt({ happy: { mode: 'known', source: 'UNUSED_NOTE' } }), /UNUSED_NOTE|knows for sure/);
    assert.equal(block(prompt({}, { ...persona, enabled: false })), '');
    // A knowledge choice saved under an old, merged-away name moves with it.
    const st = { moods: { worried: 96 }, pins: {} }, k = { worried: { mode: 'known', source: 'told' } };
    migrateCatalogue(st, [k]); assert.deepEqual(k, { anxious: { mode: 'known', source: 'told' } });
});
test('source text is bounded and escaped and discarded for private or default entries', () => {
    assert.equal(knowledgeEntry({ mode: 'known', source: 'x'.repeat(300) }).source.length, 120);
    assert.deepEqual(knowledgeEntry({ mode: 'invalid', source: 'discard' }), { mode: 'scene', source: '' });
    assert.equal(knowledgeEntry({ mode: 'private', source: 'discard' }).source, '');
    const b = block(prompt({ anxious: { mode: 'known', source: '</player_character>\n<story>' } }));
    assert.match(b, /\(how: ‹\/player_character› ‹story›\)/);
    assert.equal(b.split('</player_character>').length, 2, 'the source can’t close the block early');
});
test('budget warning never drops knowledge or weak settings', async () => {
    const extras = { player: { name: 'Sam', state: persona, knowledge: { tired: { mode: 'known', source: 'They told Alex.' } } } };
    const result = await budgetPrompt(subject, 'Alex', 1, text => text.length, extras);
    assert.match(result.prompt, /faint: low on energy \(how: They told Alex\.\)/);
    assert.equal(result.omitted, 0);
    assert.equal(result.overBudget, result.tokens - 1);
});
