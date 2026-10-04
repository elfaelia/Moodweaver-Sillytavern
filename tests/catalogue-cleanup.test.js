import test from 'node:test';
import assert from 'node:assert/strict';
import { BY_ID, MOODS, MERGED_MOODS, REMOVED_MOODS, migrateCatalogue, extendCatalogue, freshState, composePrompt } from '../core.js';

test('retired options disappear and merged strengths, pins and undo history survive', () => {
    const state = { moods: { annoyed: 20, irked: 85, insane: 70, maniacal: 95, unhinged: 40, freckled: 100 },
        pins: { irked: true, insane: true, freckled: true }, history: [{ moods: { irked: 44, writer: 50 }, reason: 'Earlier' }] };
    extendCatalogue(state);
    assert.equal(state.moods.angry, 85);
    assert.equal(state.pins.angry, true);
    assert.equal(state.moods.unhinged, 95);
    assert.equal(state.pins.unhinged, true);
    assert.equal(state.history[0].moods.angry, 44);
    assert.equal(state.history[0].reason, 'Earlier');
    assert.equal(state.history[0].moods.writer, undefined);
    for (const id of [...REMOVED_MOODS, ...Object.keys(MERGED_MOODS)]) {
        assert.equal(BY_ID[id], undefined, id);
        assert.equal(state.moods[id], undefined, id);
        assert.equal(state.pins[id], undefined, id);
    }
    state.moods.angry = 0;
    const saved = structuredClone(state);
    extendCatalogue(state);
    assert.deepEqual(state, saved, 'Reload must not revive retired values');
});

test('defaults migrate without changing the saved baseline or sharing objects', () => {
    const baseline = { moods: { irked: 64, nurse: 90 }, pins: { irked: true } };
    const before = structuredClone(baseline);
    const a = freshState(baseline), b = freshState(baseline);
    assert.deepEqual(baseline, before);
    assert.equal(a.moods.angry, 64);
    assert.equal(a.pins.angry, true);
    assert.equal(a.moods.nurse, undefined);
    a.moods.angry = 10;
    assert.equal(b.moods.angry, 64);
});

test('each observer keeps knowledge and source from the strongest merged setting', () => {
    const state = { moods: { annoyed: 20, irked: 95 }, pins: {} };
    const a = { annoyed: { mode: 'known', source: 'Yesterday' }, irked: { mode: 'private' } };
    const b = { irked: { mode: 'suspected', source: 'Their tone' }, writer: { mode: 'known' } };
    migrateCatalogue(state, [a, b]);
    assert.deepEqual(a.angry, { mode: 'private', source: '' });
    assert.deepEqual(b.angry, { mode: 'suspected', source: 'Their tone' });
    assert.equal(a.irked, undefined);
    assert.equal(b.writer, undefined);
});

test('knowledge ties prefer privacy, and missing knowledge stays scene-only', () => {
    const equal = { moods: { unhinged: 90, insane: 90, maniacal: 90 } };
    const map = { unhinged: { mode: 'known' }, insane: { mode: 'suspected' }, maniacal: { mode: 'private' } };
    migrateCatalogue(equal, [map]);
    assert.equal(map.unhinged.mode, 'private');
    const implicit = { moods: { annoyed: 20, irked: 80 } };
    const known = { annoyed: { mode: 'known' } };
    migrateCatalogue(implicit, [known]);
    assert.equal(known.angry, undefined);
    const inactive = { moods: { irked: 0, annoyed: 0 } };
    const remembered = { irked: { mode: 'suspected', source: 'An old conversation' } };
    migrateCatalogue(inactive, [remembered]);
    assert.equal(remembered.angry.source, 'An old conversation');
});

test('princess dominance uses natural wording for either person at different strengths', () => {
    assert.equal(BY_ID.princess_dominance.category, 'dynamics');
    assert.equal(MOODS.length, 918);
    assert.equal(new Set(MOODS.map(m => m.id)).size, MOODS.length);
    for (const [value, tier] of [[4, 'faint'], [50, 'clear'], [100, 'maximum']]) {
        const state = freshState({ moods: { princess_dominance: value } });
        const line = `- ${tier}: ${BY_ID.princess_dominance.cue}`;
        assert.ok(composePrompt(state, 'Alex').includes(line));
        for (const mode of ['known', 'suspected', 'private', 'scene']) {
            const prompt = composePrompt(freshState(), 'Alex', { player: { name: 'Sam', state, knowledge: { princess_dominance: { mode } } } });
            assert.ok(prompt.split('<player_character')[1].split('</player_character>')[0].includes(line));
            assert.ok(prompt.includes("the player writes everything Sam says, does and thinks"));
        }
    }
    assert.equal(composePrompt(freshState(), 'Alex'), '');
});
