import test from 'node:test';
import assert from 'node:assert/strict';
import { BY_ID, FEELINGS, freshState, composePrompt, budgetPrompt, migrateCatalogue } from '../core.js';
import { castFor, addCastMember, castDefaults, newCastId } from '../cast.js';

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

test('directed hatred and comparisons resolve the right people for main, player and cast', () => {
    const main = state({ hates_other: 100, comparing_people: 60, hates_user: 4 });
    main.targets = { hate: 'Chloe', compareA: 'Chloe', compareB: '{{user}}' };
    const player = { name: 'Ellie', state: state({ hates_char: 50 }), knowledge: { hates_char: { mode: 'suspected' } } };
    const chloe = person('Chloe', { hates_char: 90, one_step_ahead: 65 });
    const prompt = composePrompt(main, 'Mark', { player, cast: [chloe] });
    const mainBlock = prompt.split('<character_state')[1].split('</character_state>')[0];
    const playerBlock = prompt.split('<player_character')[1].split('</player_character>')[0];
    const castBlock = prompt.split('<supporting_character')[1].split('</supporting_character>')[0];
    assert.match(mainBlock, /consumed by hatred for Chloe/);
    assert.match(mainBlock, /compares Chloe with Ellie/);
    assert.match(mainBlock, /flicker of hostility toward Ellie/);
    assert.match(playerBlock, /What Mark suspects[^]*hates Mark/);
    assert.match(castBlock, /loathes Mark/);
    assert.match(castBlock, /one step ahead/);
    assert.doesNotMatch(prompt, /\{\{user\}\}|\{\{char\}\}/);
});

test('supporting-character hate cannot quietly target the player or main character', () => {
    for (const hate of ['{{user}}', 'Ellie', '{{char}}', 'Mark']) {
        const main = state({ hates_other: 100 }); main.targets = { hate };
        const prompt = composePrompt(main, 'Mark', { player: { name: 'Ellie', state: state({}) } });
        assert.match(prompt, /hatred for one supporting character actually in the scene, never Ellie or Mark/);
    }
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
    assert.match(result.prompt, /supporting_character name="Chloe"[^]*maximum: furious[^]*faint: prissy/);
    assert.match(result.prompt, /supporting_character name="Roy"[^]*faint: homophobic/);
    assert.equal(result.prompt.split('What each strength means:').length, 2);
    assert.match(result.prompt, /without changing the viewpoint/);
    assert.match(result.prompt, /The player still writes Ellie/);
});

test('cast defaults are independent per owner and chat, with presence reset only in new chats', () => {
    const first = {}, saved = {};
    const cast = castFor(first, saved, 'char:mark.png');
    const chloe = addCastMember(cast, ' Chloe ', 'chloe-id', ['Mark', 'Ellie']);
    chloe.state.moods.hates_char = 90;
    chloe.state.targets.compareA = 'Roy';
    chloe.state.pins.hates_char = true;
    saved['char:mark.png'] = castDefaults(cast);
    const second = {};
    const clone = castFor(second, saved, 'char:mark.png')[0];
    assert.equal(clone.inScene, false);
    assert.equal(clone.state.moods.hates_char, 90);
    assert.equal(clone.state.targets.compareA, 'Roy');
    assert.equal(clone.state.pins.hates_char, true);
    clone.state.moods.hates_char = 10;
    assert.equal(chloe.state.moods.hates_char, 90);
    assert.equal(saved['char:mark.png'][0].state.moods.hates_char, 90);
    assert.deepEqual(castFor(second, saved, 'char:someone-else.png'), []);
    const reloaded = JSON.parse(JSON.stringify(first));
    assert.equal(castFor(reloaded, saved, 'char:mark.png')[0].inScene, true);
    assert.throws(() => addCastMember(cast, 'cHLoE', 'duplicate'), /already/);
    assert.throws(() => addCastMember(cast, 'Ellie', 'player', ['Mark', 'Ellie']), /already/);
});

test('names and targets are escaped and directed controls stay manual', () => {
    const main = state({ comparing_people: 100 });
    main.targets = { compareA: '<fake>', compareB: 'A & B' };
    const prompt = composePrompt(main, 'Alex', { cast: [person('X"/><bad>', { happy: 50 })] });
    assert.ok(prompt.includes('&lt;fake&gt;'));
    assert.ok(prompt.includes('A &amp; B'));
    assert.doesNotMatch(prompt, /<fake>|<bad>/);
    for (const id of ['hates_other', 'hates_char', 'hates_user', 'comparing_people']) assert.ok(!FEELINGS.some(m => m.id === id));
});
