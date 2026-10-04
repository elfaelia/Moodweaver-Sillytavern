import test from 'node:test';
import assert from 'node:assert/strict';
import { BY_ID, MERGED_MOODS, MERGED_SEARCH_NAMES, RECIPES, freshState, migrateCatalogue, composePrompt } from '../core.js';

test('all old IDs migrate straight to live sliders without changing strength or pins', () => {
    for (const [id, target] of Object.entries(MERGED_MOODS)) {
        assert.ok(BY_ID[target], target);
        assert.equal(MERGED_MOODS[target], undefined, 'No migration chains');
        for (const strength of [0, 4, 50, 100]) {
            const saved = { moods: { [id]: strength }, pins: { [id]: true } };
            const knowledge = { [id]: { mode: 'suspected', source: 'A conversation' } };
            migrateCatalogue(saved, [knowledge]);
            assert.equal(saved.moods[target], strength);
            assert.equal(saved.pins[target], true);
            assert.equal(knowledge[target].mode, 'suspected');
            assert.equal(knowledge[target].source, 'A conversation');
            assert.equal(saved.moods[id], undefined);
            const copy = structuredClone(saved);
            migrateCatalogue(saved, [knowledge]);
            assert.deepEqual(saved, copy);
        }
    }
});

test('a mixed older save combines once, never sums, and keeps the strongest knowledge', () => {
    const saved = { moods: { angry: 20, annoyed: 30, irked: 90, offended: 75, calm: 10, relaxed: 55, laidback: 40 },
        pins: { laidback: true }, history: [{ moods: { irked: 72, relaxed: 25 } }] };
    const knowledge = { irked: { mode: 'private' }, offended: { mode: 'known' } };
    migrateCatalogue(saved, [knowledge]);
    assert.equal(saved.moods.angry, 90);
    assert.equal(saved.moods.calm, 55);
    assert.equal(saved.pins.calm, true);
    assert.equal(knowledge.angry.mode, 'private');
    assert.equal(saved.history[0].moods.angry, 72);
    assert.equal(saved.history[0].moods.calm, 25);
});

test('strength selects one fitting phrase for both people, including the closing reminder', () => {
    const examples = [
        ['angry', 4, 'irritated', 'furious'],
        ['angry', 100, 'furious', 'irritated'],
        ['afraid', 4, 'uneasy and easily spooked', 'panicked with fear'],
        ['afraid', 85, 'terrified', 'panicked with fear'],
        ['afraid', 100, 'panicked with fear', 'uneasy and easily spooked'],
        ['sad', 4, 'down or disappointed', 'deeply sorrowful and dejected'],
        ['sad', 100, 'deeply sorrowful and dejected', 'down or disappointed'],
        ['enamoured', 4, 'has a crush', 'head over heels, infatuated'],
        ['enamoured', 100, 'head over heels, infatuated', 'has a crush'],
    ];
    for (const [id, strength, expected, absent] of examples) {
        const state = freshState({ moods: { [id]: strength } });
        const outputs = [composePrompt(state, 'Alex')];
        for (const mode of ['known', 'suspected', 'scene', 'private']) {
            outputs.push(composePrompt(freshState(), 'Alex', { player: { name: 'Sam', state, knowledge: { [id]: { mode } } } }));
        }
        for (const prompt of outputs) {
            assert.ok(prompt.includes(': ' + expected), `${id} ${strength}`);
            assert.ok(!prompt.includes(absent), `${id} must not print the other intensity`);
            if (strength >= 81) assert.ok(prompt.includes(`${expected} (`), 'Closing reminder uses the same phrase');
        }
    }
});

test('old names and renamed sliders remain searchable; distinct feelings remain separate', () => {
    for (const [name, values] of Object.entries(RECIPES)) for (const id of Object.keys(values)) assert.ok(BY_ID[id], `${name}: ${id}`);
    for (const [id, term] of [['angry', 'Irked'], ['afraid', 'Terrified'], ['enamoured', 'Enamoured'], ['calm', 'Relaxed'], ['caretaker', 'Caretaker']]) {
        assert.ok(MERGED_SEARCH_NAMES[id].some(name => name.toLowerCase() === term.toLowerCase()));
    }
    for (const id of ['grieving', 'lonely', 'betrayed', 'guilty', 'ashamed', 'jealous', 'possessive', 'stoic', 'emotionless', 'princess_dominance', 'masking_warmth']) assert.ok(BY_ID[id]);
});
