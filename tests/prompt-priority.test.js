import test from 'node:test';
import assert from 'node:assert/strict';
import { composePrompt, freshState } from '../core.js';

test('overwhelming player traits lead grounded interpretation without taking player control', () => {
    const character = freshState({ moods: { likes_younger_women: 96, male_gaze: 79 } });
    const player = freshState({ moods: { likes_older_men: 96, voice_high: 84, bedroom_tight: 70 } });
    const story = freshState({ moods: { character_driven_smut: 92, visceral: 62 } });
    const prompt = composePrompt(character, 'Mark', { player: { state: player, name: 'Ellie' }, story });

    assert.match(prompt, /<player_character name="Ellie" controlled_by="player">/);
    assert.match(prompt, /overwhelming: drawn to older men/);
    assert.match(prompt, /use present evidence/);
    assert.match(prompt, /Stronger settings deserve more weight/);
    assert.match(prompt, /never invent their speech, actions or thoughts/);
    assert.match(prompt, /Apply each listed strength separately/);
    assert.match(prompt, /overwhelming story setting is an organising principle for nearly every beat/);
});

test('the added priority follows the overwhelming and maximum boundaries', () => {
    const character = freshState({ moods: { calm: 50 } });
    const at90 = composePrompt(character, 'Mark', { player: { state: freshState({ moods: { likes_older_men: 90 } }), name: 'Ellie' } });
    const at91 = composePrompt(character, 'Mark', { player: { state: freshState({ moods: { likes_older_men: 91 } }), name: 'Ellie' } });
    const at100 = composePrompt(character, 'Mark', { player: { state: freshState({ moods: { likes_older_men: 100 } }), name: 'Ellie' } });

    assert.match(at90, /intense: drawn to older men/);
    assert.match(at91, /overwhelming: drawn to older men/);
    assert.match(at100, /maximum: drawn to older men/);
});

