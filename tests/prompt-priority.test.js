import test from 'node:test';
import assert from 'node:assert/strict';
import { composePrompt, freshState } from '../core.js';
// "Likes older men" and similar have been turn-ons since they moved out of the slider catalogue; a saved
// value comes across as the matching turn-on at the same strength.
test('overwhelming player traits lead grounded interpretation without taking player control', () => {
    const character = freshState({ moods: { likes_younger_women: 96, male_gaze: 79 } });
    const player = freshState({ moods: { likes_older_men: 96, voice_high: 84, bedroom_tight: 70 } });
    const story = freshState({ moods: { character_driven_smut: 92, visceral: 62 } });
    const prompt = composePrompt(character, 'Mark', { player: { state: player, name: 'Ellie' }, story });
    assert.match(prompt, /<player_character name="Ellie" written_by="player">/);
    assert.match(prompt, /overwhelming turn-on: older men/);
    assert.match(prompt, /The player writes what Ellie says, chooses and thinks/);
    assert.match(prompt, /Private rows stay hidden until the player shows them/);
    assert.match(prompt, /Mark acts on the rows above at their strength/);
    assert.match(prompt, /don't water anything down because the list is long/);
    assert.match(prompt, /An overwhelming one shapes every sentence/);
});
test('the added priority follows the overwhelming and maximum boundaries', () => {
    const character = freshState({ moods: { calm: 50 } });
    const at = v => composePrompt(character, 'Mark', { player: { state: freshState({ moods: { likes_older_men: v } }), name: 'Ellie' } });
    assert.match(at(90), /intense turn-on: older men/);
    assert.match(at(91), /overwhelming turn-on: older men/);
    assert.match(at(100), /maximum turn-on: older men/);
    assert.doesNotMatch(at(90), /Turned up highest[^\n]*older men \(overwhelming/);
});
