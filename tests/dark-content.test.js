import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, MOODS, PROMPT_NAME, composePrompt, freshState } from '../core.js';

const addedToExistingCategories = [
    'unhesitating',
    'murderous', 'remorseless', 'sadistic_glee', 'dehumanising', 'calculating_cruelty', 'terrorising', 'coercive', 'whatever_it_takes',
    'judgemental_misogyny', 'judgemental_misandry',
    'malignant_narcissism', 'grandiose_narcissist', 'high_functioning_narcissist', 'sadistic_personality',
    'homicidal_fixation', 'moral_disengagement', 'compartmentalised_violence',
    'serial_killer', 'torturer', 'kidnapper', 'drugger', 'hitman', 'captor', 'vigilante_killer',
    'killed_will_again', 'killed_resisting', 'body_count', 'hidden_trophies', 'escaped_justice',
    'extreme_horror', 'splatter_horror',
];

const newCategoryIds = ['fighting', 'combat_style', 'dark_plot'];
const newIds = [
    ...addedToExistingCategories,
    ...MOODS.filter(m => newCategoryIds.includes(m.category)).map(m => m.id),
];

const stateWith = (entries) => {
    const state = freshState();
    for (const [id, strength] of Object.entries(entries)) state.moods[id] = strength;
    return state;
};

test('the 75 dark additions remain unique and their three sections are correctly typed', () => {
    assert.equal(MOODS.length, 927);
    assert.equal(CATEGORIES.length, 44);
    assert.equal(newIds.length, 75);
    assert.equal(new Set(newIds).size, 75);
    assert.equal(new Set(MOODS.map(m => m.id)).size, MOODS.length);
    assert.equal(MOODS.find(m => m.id === 'gutter_fighting').kind, 'state');
    assert.equal(MOODS.find(m => m.id === 'realistic_combat').kind, 'story');
    assert.equal(MOODS.find(m => m.id === 'murder_plot').kind, 'story');
});

test('old saves receive every new setting turned off and unpinned', () => {
    const state = freshState({ moods: { calm: 67 }, pins: { calm: true } });
    assert.equal(state.moods.calm, 67);
    assert.equal(state.pins.calm, true);
    for (const id of newIds) {
        assert.equal(state.moods[id], 0, id);
        assert.equal(state.pins[id], false, id);
    }
    assert.equal(composePrompt(freshState(), 'Alex'), '');
});

test('maximum violent character settings become action, not labels', () => {
    const prompt = composePrompt(stateWith({ murderous: 100, serial_killer: 100, killed_will_again: 100 }), 'Mark');
    assert.match(prompt, /murderous: wants to kill/);
    assert.match(prompt, /a serial killer: a practiced repeat murderer/);
    assert.match(prompt, /has killed before, accepts it and will kill again/);
    assert.match(prompt, /Dark character settings are behavioural, not private labels/);
    assert.match(prompt, /let Mark choose it and follow through/);
    assert.match(prompt, /central action and leave irreversible harm or death behind/);
});

test('yandere scales from a watchful edge to lethal possession', () => {
    const faint = composePrompt(stateWith({ yandere: 4 }), 'Alex');
    const maximum = composePrompt(stateWith({ yandere: 100 }), 'Alex');
    assert.match(faint, /sweetly attached with a possessive, watchful edge/);
    assert.doesNotMatch(faint, /central action and leave irreversible harm/);
    assert.match(maximum, /will stalk, abduct or kill rivals and perceived threats/);
    assert.match(maximum, /may turn that violence on their beloved rather than lose them/);
    assert.match(maximum, /let Alex choose it and follow through/);
});

test('maximum horror, offensive fiction and Dead Dove alter events and consequences', () => {
    const story = stateWith({ horror: 100, offensive: 100, dead_dove: 100, murder_plot: 100, gory_combat: 100 });
    const prompt = composePrompt(freshState(), 'Mark', { story });
    assert.match(prompt, /horror owns the reply: the threat follows through/);
    assert.match(prompt, /willing to use harsh, taboo or prejudiced language and behaviour/);
    assert.match(prompt, /hold nothing back inside what those warnings promise/);
    assert.match(prompt, /murder is an active part of the plot rather than a distant backstory/);
    assert.match(prompt, /graphic wounds, blood and bodily damage stay visible/);
    assert.match(prompt, /Serious injury, murder, lasting terror and bad outcomes remain live possibilities/);
    assert.match(prompt, /leave a concrete, irreversible consequence/);
    assert.match(prompt, /Dead Dove is an emphasis tag/);
});

test('character fighting skill and story combat direction mix without replacing each other', () => {
    const character = stateWith({ krav_maga: 70, sudden_combat: 45, remorseless: 25 });
    const story = stateWith({ realistic_combat: 80, lasting_injuries: 65, combat_aftermath: 40 });
    const prompt = composePrompt(character, 'Mark', { story });
    assert.match(prompt, /direct close-quarters self-defence built around fast survival/);
    assert.match(prompt, /uses surprise and immediate aggression before the enemy can settle/);
    assert.match(prompt, /feels no guilt after harm/);
    assert.match(prompt, /physical limits, fear, mistakes and consequences keep the fight believable/);
    assert.match(prompt, /damage changes movement, choices and later scenes instead of vanishing/);
    assert.match(prompt, /show the shock, mess, evidence and consequences left after violence/);
    assert.match(prompt, /Each keeps its full strength however many are on/);
});

test('each new non-story control has concrete prompt wording', () => {
    for (const id of addedToExistingCategories.filter(id => !['extreme_horror', 'splatter_horror'].includes(id))) {
        assert.ok(PROMPT_NAME[id], id);
        const prompt = composePrompt(stateWith({ [id]: 50 }), 'Alex');
        assert.ok(prompt.includes(PROMPT_NAME[id]), id);
    }
});
