import test from 'node:test';
import assert from 'node:assert/strict';
import { composePrompt, freshState } from '../core.js';

test('overwhelming player traits lead grounded interpretation without taking player control', () => {
    const character = freshState({ moods: { likes_younger_women: 96, male_gaze: 79 } });
    const player = freshState({ moods: { likes_older_men: 96, voice_high: 84, bedroom_tight: 70 } });
    const story = freshState({ moods: { character_driven_smut: 92, visceral: 62 } });
    const prompt = composePrompt(character, 'Mark', { player: { state: player, name: 'Ellie' }, story });

    assert.match(prompt, /<player_character name="Ellie" controlled_by="player">/);
    assert.match(prompt, /Overwhelming traits should be one of the main lenses/);
    assert.match(prompt, /actual words, choices and visible responses/);
    assert.match(prompt, /Don't let an easier-to-describe physical detail crowd out/);
    assert.match(prompt, /player still owns everything Ellie says, does and thinks/);
    assert.match(prompt, /overwhelming feelings and preferences are a main thread/);
    assert.match(prompt, /overwhelming story setting is an organising principle for nearly every beat/);
});

test('the added priority follows the overwhelming and maximum boundaries', () => {
    const character = freshState({ moods: { calm: 50 } });
    const at90 = composePrompt(character, 'Mark', { player: { state: freshState({ moods: { likes_older_men: 90 } }), name: 'Ellie' } });
    const at91 = composePrompt(character, 'Mark', { player: { state: freshState({ moods: { likes_older_men: 91 } }), name: 'Ellie' } });
    const at100 = composePrompt(character, 'Mark', { player: { state: freshState({ moods: { likes_older_men: 100 } }), name: 'Ellie' } });

    assert.doesNotMatch(at90, /Overwhelming traits should be one of the main lenses/);
    assert.match(at91, /Overwhelming traits should be one of the main lenses/);
    assert.match(at100, /Maximum traits must meaningfully shape/);
});

