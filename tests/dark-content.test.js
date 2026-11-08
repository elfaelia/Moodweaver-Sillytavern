import test from 'node:test';
import assert from 'node:assert/strict';
import { ON_PAGE } from '../onpage.js';
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
    // The catalogue has grown a lot since these were added; what matters is that all 75 are still there, once.
    // Those three sections have grown since (fighting, combat and dark plot options were added later), so it's at least 75.
    assert.ok(newIds.length >= 75);
    assert.equal(new Set(newIds).size, newIds.length);
    for (const id of addedToExistingCategories) assert.ok(MOODS.some(m => m.id === id), id);
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
    assert.match(prompt, /murderous: thinks about killing, measures it, moves toward it/);
    assert.match(prompt, /a serial killer: a practiced repeat murderer/);
    assert.match(prompt, /has killed before, accepts it and will kill again/);
    assert.match(prompt, /Dark settings are things Mark actually does, not just labels/);
    assert.match(prompt, /let them choose it and follow through/);
    assert.match(prompt, /Don't swap it for a threat, a sudden conscience, a cutaway or a convenient interruption/);
    assert.match(prompt, /the darkest one can drive the reply's main action and leave harm or death that can't be undone/);
});

test('yandere scales from a watchful edge to lethal possession', () => {
    const faint = composePrompt(stateWith({ yandere: 4 }), 'Alex');
    const maximum = composePrompt(stateWith({ yandere: 100 }), 'Alex');
    assert.match(faint, /sweetly attached with a possessive, watchful edge/);
    assert.doesNotMatch(faint, /main action and leave harm or death/);
    assert.match(maximum, /will stalk, abduct or kill rivals and perceived threats/);
    assert.match(maximum, /may turn that violence on their beloved rather than lose them/);
    assert.match(maximum, /let them choose it and follow through/);
});

test('maximum horror, offensive fiction and Dead Dove alter events and consequences', () => {
    const story = stateWith({ horror: 100, offensive: 100, dead_dove: 100, murder_plot: 100, gory_combat: 100 });
    const prompt = composePrompt(freshState(), 'Mark', { story });
    assert.match(prompt, /horror owns the reply: the threat follows through/);
    assert.match(prompt, /willing to use harsh, taboo or prejudiced language and behaviour/);
    assert.match(prompt, /every dark tag is a promise kept literally and in full/);
    assert.match(prompt, /Don't dodge it with any of these: someone knocking, calling or walking in/);
    assert.match(prompt, /a murder is being planned or carried out now/);
    assert.match(prompt, /wounds, blood and broken bodies stay visible/);
    assert.match(prompt, /Serious injury, murder, lasting terror and bad endings are on the table/);
    assert.match(prompt, /real consequence that can't be undone/);
    assert.match(prompt, /Dead dove means every dark tag is meant literally/);
});

test('character fighting skill and story combat direction mix without replacing each other', () => {
    const character = stateWith({ krav_maga: 70, sudden_combat: 45, remorseless: 25 });
    const story = stateWith({ realistic_combat: 80, lasting_injuries: 65, combat_aftermath: 40 });
    const prompt = composePrompt(character, 'Mark', { story });
    assert.match(prompt, /direct close-quarters self-defence built around fast survival/);
    assert.match(prompt, /uses surprise and immediate aggression before the enemy can settle/);
    assert.match(prompt, /no guilt after harm/);
    assert.match(prompt, /physical limits, fear, mistakes and consequences keep the fight believable/);
    assert.match(prompt, /damage changes movement, choices and later scenes instead of vanishing/);
    assert.match(prompt, /show the shock, mess, evidence and consequences left after violence/);
    assert.match(prompt, /Weave it all into the same moments instead of taking turns, and don't water anything down because the list is long/);
});

test('each new non-story control has concrete prompt wording', () => {
    for (const id of addedToExistingCategories.filter(id => !['extreme_horror', 'splatter_horror'].includes(id))) {
        assert.ok(PROMPT_NAME[id], id);
        const prompt = composePrompt(stateWith({ [id]: 50 }), 'Alex');
        // 1.39.0: feelings go out as "name: how it shows", so check for the how-it-shows part instead.
        assert.ok(prompt.includes(ON_PAGE[id] ?? PROMPT_NAME[id]), id);
    }
});
