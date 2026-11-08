import test from 'node:test';
import assert from 'node:assert/strict';
import { BY_ID, FEELINGS, freshState, composePrompt, budgetPrompt, migrateCatalogue } from '../core.js';
import { castFor, addCastMember, castDefaults, newCastId } from '../cast.js';
import { relationshipKey } from '../relationships.js';

const state = moods => freshState({ moods });
const person = (name, moods, inScene = true) => ({ id: name, name, inScene, state: state(moods) });

test('cast can be added over a plain HTTP LAN connection without randomUUID', () => {
    const cast = [];
    const chloe = addCastMember(cast, 'Chloe', newCastId({}));
    const roy = addCastMember(cast, 'Roy', newCastId({}));
    assert.ok(chloe.id);
    assert.notEqual(chloe.id, roy.id);
    assert.equal(newCastId({ randomUUID: () => 'secure-id' }), 'secure-id');
});

test('doe-eyed survives migration as a separate look and does not turn on Trusting', () => {
    const saved = { moods: { doe_eyed: 75, trusting: 12 }, pins: { doe_eyed: true } };
    migrateCatalogue(saved);
    assert.equal(saved.moods.doe_eyed, 75);
    assert.equal(saved.moods.trusting, 12);
    assert.equal(saved.pins.doe_eyed, true);
    assert.equal(BY_ID.doe_eyed.category, 'looks');
    assert.match(composePrompt(freshState(saved), 'Alex'), /wide, soft, expressive eyes/);
    assert.equal(state({ trusting: 50 }).moods.doe_eyed, 0);
});

// Directed hatred and comparisons have been relationship tags since 1.11: each one names the person it's about.
const rel = (target, moods, extra = {}) => ({ id: `r-${target}-${Math.random()}`, target, enabled: true, moods, ...extra });
test('directed hatred and comparisons resolve the right people for main, player and cast', () => {
    const main = state({ calm: 40 });
    main.relationships = [rel('Chloe', { hates: 100 }, { compare: { with: '{{user}}', favours: 'neither', value: 60 } }), rel('{{user}}', { hates: 4 })];
    const mine = state({}); mine.relationships = [rel('{{char}}', { hates: 50 })];
    const chloe = person('Chloe', { one_step_ahead: 65 }); chloe.state.relationships = [rel('{{char}}', { hates: 90 })];
    const player = { name: 'Ellie', state: mine, knowledge: { [relationshipKey(mine.relationships[0], 'hates')]: { mode: 'suspected' } } };
    const prompt = composePrompt(main, 'Mark', { player, cast: [chloe] });
    assert.match(prompt, /Mark toward Chloe:\n- maximum: is consumed by hatred for Chloe \(full force in every line\)\n- clear: keeps weighing Chloe against Ellie/);
    assert.match(prompt, /Mark toward Ellie:\n- faint: feels a flicker of hostility toward Ellie/);
    assert.match(prompt, /Ellie toward Mark:\nWhat Mark suspects:\n- clear: hates Mark/);
    assert.match(prompt, /Chloe toward Mark:\n- intense: loathes Mark/);
    assert.match(prompt, /supporting_character name="Chloe"[^]*one step ahead/);
    assert.doesNotMatch(prompt, /\{\{user\}\}|\{\{char\}\}/);
});

test('relationships name real people, never a placeholder, whoever holds them', () => {
    for (const [target, name] of [['{{user}}', 'Ellie'], ['{{char}}', 'Mark']]) {
        const chloe = person('Chloe', { calm: 20 }); chloe.state.relationships = [rel(target, { hates: 70 })];
        const prompt = composePrompt(state({ calm: 10 }), 'Mark', { player: { name: 'Ellie', state: state({}) }, cast: [chloe] });
        assert.match(prompt, new RegExp(`Chloe toward ${name}:`)); assert.doesNotMatch(prompt, /\{\{/);
    }
    // The old one-slider versions are gone from the catalogue and migrate into relationships instead.
    for (const id of ['hates_other', 'hates_char', 'hates_user', 'comparing_people']) assert.ok(!FEELINGS.some(m => m.id === id));
});

test('absent, disabled and empty cast profiles add no prompt text or token count', async () => {
    const base = state({ calm: 45 });
    const disabled = person('Roy', { prissy: 100 }); disabled.state.enabled = false;
    const extras = { cast: [person('Chloe', { angry: 100 }, false), disabled, person('Amy', {})] };
    const expected = await budgetPrompt(base, 'Mark', 800, async t => t.length);
    const actual = await budgetPrompt(base, 'Mark', 800, async t => t.length, extras);
    assert.deepEqual(actual, expected);
    assert.equal(composePrompt(state({}), 'Mark', extras), '');
});

test('cast-only prompts preserve individual strengths, control and viewpoint in one shared scale', async () => {
    const chloe = person('Chloe', { angry: 100, prissy: 4 });
    const roy = person('Roy', { calm: 50, homophobic: 10 });
    const base = state({}); base.enabled = false;
    const result = await budgetPrompt(base, 'Mark', 1, async t => t.length, { player: { name: 'Ellie' }, cast: [chloe, roy] });
    assert.equal(result.selectedIds.length, 4);
    assert.equal(result.omitted, 0);
    assert.match(result.prompt, /supporting_character name="Chloe"[^]*maximum: consumed by rage[^]*faint: prissy/);
    assert.match(result.prompt, /supporting_character name="Roy"[^]*faint: homophobic/);
    assert.equal(result.prompt.split('How strong each setting is:').length, 2, 'one shared scale');
    assert.match(result.prompt, /only knows what they could have seen or heard/);
    assert.match(result.prompt, /the player still writes Ellie/);
});

test('cast defaults are independent per owner and chat, with presence reset only in new chats', () => {
    const first = {}, saved = {};
    const cast = castFor(first, saved, 'char:mark.png');
    const chloe = addCastMember(cast, ' Chloe ', 'chloe-id', ['Mark', 'Ellie']);
    chloe.state.moods.angry = 90;
    chloe.state.targets.compareA = 'Roy';
    chloe.state.pins.angry = true;
    saved['char:mark.png'] = castDefaults(cast);
    const second = {};
    const clone = castFor(second, saved, 'char:mark.png')[0];
    assert.equal(clone.inScene, false);
    assert.equal(clone.state.moods.angry, 90);
    assert.equal(clone.state.targets.compareA, 'Roy');
    assert.equal(clone.state.pins.angry, true);
    clone.state.moods.angry = 10;
    assert.equal(chloe.state.moods.angry, 90);
    assert.equal(saved['char:mark.png'][0].state.moods.angry, 90);
    assert.deepEqual(castFor(second, saved, 'char:someone-else.png'), []);
    const reloaded = JSON.parse(JSON.stringify(first));
    assert.equal(castFor(reloaded, saved, 'char:mark.png')[0].inScene, true);
    assert.throws(() => addCastMember(cast, 'cHLoE', 'duplicate'), /already/);
    assert.throws(() => addCastMember(cast, 'Ellie', 'player', ['Mark', 'Ellie']), /already/);
});

test('names and targets are escaped, so none can open, close or break a tag in the note', () => {
    const main = state({ calm: 30 });
    main.relationships = [rel('<fake>', { likes: 60 }, { compare: { with: 'Roy', favours: 'neither', value: 100 } })];
    const prompt = composePrompt(main, 'Al"ex', { cast: [person('X"/><bad>', { happy: 50 })] });
    assert.ok(prompt.includes('‹fake›'));
    assert.doesNotMatch(prompt, /<fake>|<bad>/);
    assert.match(prompt, /<supporting_character name="X”\/›‹bad›">/, 'a quote in a name stays inside the name');
    assert.match(prompt, /<character_state name="Al”ex">/);
});
