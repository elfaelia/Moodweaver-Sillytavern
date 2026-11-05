// 1.37.0: new dark romance, horror and grunge options. Unique, short, and wired into the meters and the weave line.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MOODS, BY_ID, analysed, composePrompt, freshState, REMOVED_MOODS, MERGED_MOODS } from '../core.js';
import { RELATIONSHIP_BY_ID, SHARED_BY_ID, RELATIONSHIP_TAGS, SHARED_TAGS } from '../relationships.js';
import { sliderAxes, computeBond, cleanBond } from '../bond.js';
import { feelingId, relationId } from '../board.js';

const moods = ['wheedling', 'gloating', 'fond_exasperation', 'contrite', 'euphoric', 'strung_out', 'spoiling_for_fight', 'mooch', 'burnout', 'washed_up_rocker', 'morally_black', 'goth_masc', 'slurred_drawl', 'hums', 'unkempt', 'junkie', 'found_footage', 'asylum_horror', 'he_falls_first', 'bully_romance', 'gross_out'];
const rels = ['makes_demands', 'expects_there', 'on_a_string', 'sweet_talks', 'rations_affection', 'upper_hand', 'plays_helpless', 'talks_down', 'gets_soft_side', 'undone_by_tears', 'comes_running', 'cant_stay_angry', 'wants_ruined_by', 'stalks', 'deals_to', 'buys_from'];

test('every new option exists once, with a short description, and no name is used twice', () => {
    for (const id of moods) assert.ok(BY_ID[id], id);
    for (const id of rels) assert.ok(RELATIONSHIP_BY_ID[id], id);
    assert.ok(SHARED_BY_ID.monster_on_leash);
    // New ones never reuse a retired or merged-away ID: old saves strip those on load.
    for (const id of moods) { assert.ok(!REMOVED_MOODS.includes(id), id); assert.ok(!Object.hasOwn(MERGED_MOODS, id), id); }
    for (const list of [MOODS, RELATIONSHIP_TAGS, SHARED_TAGS]) {
        assert.equal(new Set(list.map(x => x.id)).size, list.length);
        // The catalogue already had a few shared names (like Cold the feeling and Cold the body state); none is new.
        const fresh = new Set([...moods, ...rels, 'monster_on_leash']);
        for (const x of list.filter(y => fresh.has(y.id))) assert.equal(list.filter(y => y.label.toLowerCase() === x.label.toLowerCase()).length, 1, x.label);
    }
    for (const id of moods) assert.ok(BY_ID[id].cue.split(/\s+/).length <= 18, id);
    for (const id of rels) assert.ok(RELATIONSHIP_BY_ID[id].prompt.split(/\s+/).length <= 20, id);
});

test('the requested ones that already existed are still there, and retired ones stay retired', () => {
    for (const id of ['femme_fatale', 'cosmic_horror', 'self_loathing']) assert.equal(BY_ID[id], undefined, id);
    for (const [id, label] of [['petulant', 'Petulant'], ['grunge', 'Grunge'], ['goth', 'Goth'], ['punk', 'Punk'], ['demanding', 'Demanding']]) assert.equal(BY_ID[id].label, label);
});

test('Lamb on a string plus Easterman as captor reads as a gilded cage', () => {
    const easterman = { obsessed: 88, captor_of: 90, undone_by_tears: 70 }, lamb = { on_a_string: 80, upper_hand: 75 };
    const axes = sliderAxes(easterman, {}, lamb);
    assert.ok(axes.p > 50, 'he holds the keys'); assert.ok(axes.l < -50, 'she holds the pull');
    assert.equal(computeBond(cleanBond({}), 9, 'Easterman', 'Lamb', axes).dynamic.name, 'Gilded cage');
});

test('the weave line can name the new feelings and relationship types', () => {
    for (const id of ['wheedling', 'gloating', 'contrite', 'euphoric', 'strung_out', 'spoiling_for_fight', 'fond_exasperation']) {
        assert.ok(analysed(BY_ID[id]), id); assert.equal(feelingId(BY_ID[id].label), id);
    }
    assert.equal(relationId('undone by her tears', 'Lamb'), 'undone_by_tears');
    assert.equal(relationId('has him on a string', 'Lamb'), 'on_a_string');
});

test('a new option reaches the prompt as its short description', () => {
    const p = composePrompt(freshState({ moods: { wheedling: 60, goth_masc: 50 } }), 'Lamb');
    assert.match(p, /coaxing a yes with pouts, sweetness and little touches/);
    assert.match(p, /long coat, band tee, boots, rings/);
});
