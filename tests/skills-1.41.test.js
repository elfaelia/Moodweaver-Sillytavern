import test from 'node:test';
import assert from 'node:assert/strict';
import { composePrompt, freshState, BY_ID, CATEGORIES } from '../core.js';
import { SKILL_TAGS, litSkills, skillLines, skillWord, cleanOwnSkills, calledFor } from '../skills.js';
import { parseWeave, weavePrompt } from '../weave.js';
import { TURN_TAGS } from '../turns.js';
import { turnIdFor } from '../bond.js';
import { SHARED_BY_ID } from '../relationships.js';

test('skills: unique ids, Sims packs and dark skills both present', () => {
    assert.equal(new Set(SKILL_TAGS.map(s => s.id)).size, SKILL_TAGS.length);
    for (const id of ['romance', 'thanatology', 'pottery', 'tattooing', 'apothecary', 'natural_living', 'gemology', 'charisma', 'martial_arts', 'alchemy',
        'teaching', 'lying', 'manipulation', 'promiscuity', 'violence', 'murder', 'drug_dealing']) assert.ok(SKILL_TAGS.some(s => s.id === id) || id === 'romance', id);
});
test('skills light only when the scene calls for them, and avoid the obvious false alarms', () => {
    const st = { enabled: true, skills: { lying: 9, lockpicking: 3, horse_riding: 6, parenting: 4, writing: 5 }, skillAlways: {} };
    assert.deepEqual(litSkills(st, 'He picked the lock with a hairpin and lied to her face.').map(x => x.id).sort(), ['lockpicking', 'lying']);
    assert.deepEqual(litSkills(st, 'She was lying on the bed riding him, writhing. "Baby," he said.').map(x => x.id), [], 'lying on, riding, writhing and baby call for nothing');
    assert.deepEqual(litSkills(st, 'Nothing here.', 'lying').map(x => [x.id, x.why]), [['lying', 'used']], 'the hidden line keeps a used skill lit');
    st.skillAlways = { writing: true };
    assert.equal(litSkills(st, '').map(x => x.id)[0], 'writing', 'always-on goes first');
});
test('skill lines: one per person, the level and its word, and one rule; nothing when nothing is lit', () => {
    assert.deepEqual(skillLines([{ name: 'Eli', lit: [] }]), []);
    const lines = skillLines([{ name: 'Eli', lit: [{ prompt: 'lying', level: 9 }] }, { name: 'Lamb', lit: [{ prompt: 'first aid', level: 2 }] }], 'Lamb');
    assert.equal(lines[1], '- Eli: lying 9/10 (expert)'); assert.equal(lines[2], '- Lamb: first aid 2/10 (novice)');
    assert.match(lines.at(-1), /Lamb's included/);
    assert.equal(skillWord(10), 'master'); assert.equal(skillWord(5), 'competent');
    const own = cleanOwnSkills([{ label: 'Taxidermy', words: 'mount, stuffed, pelt*', level: 7 }]);
    assert.ok(calledFor(own[0].words, 'the pelts on the wall'));
});
test('skills reach the note in the right place and travel with the character default', () => {
    const s = freshState({ moods: { angry: 50 }, skills: { murder: 8 } });
    assert.equal(s.skills.murder, 8, 'freshState keeps skills');
    const p = composePrompt(s, 'Eli', { skills: skillLines([{ name: 'Eli', lit: [{ prompt: 'murder', level: 8 }] }]) });
    assert.match(p, /Skills this scene calls on:\n- Eli: murder 8\/10 \(skilled\)/);
    assert.ok(composePrompt(freshState({}), 'Eli', { skills: ['Skills this scene calls on:', '- Eli: x 1/10 (novice)'] }).length > 0, 'skills alone still make a note');
});
test('the hidden line reports skills used, and only asks when someone has skills', () => {
    assert.deepEqual(parseWeave('x <!-- weave: moods angry +5 | used: lying, lockpicking -->').used, ['lying', 'lockpicking']);
    assert.deepEqual(parseWeave('x <!-- weave: skills: first aid -->').used, ['first aid']);
    assert.ok(weavePrompt({ n: 'Eli', u: 'Lamb', skills: true }).some(l => l.startsWith('- used:')));
    assert.ok(!weavePrompt({ n: 'Eli', u: 'Lamb' }).some(l => l.startsWith('- used:')));
});
test('hurt/comfort is the fanfic kind, and hurt/no comfort exists', () => {
    assert.match(SHARED_BY_ID.hurt_comfort.prompt, /the fanfic kind/); assert.match(SHARED_BY_ID.hurt_comfort.prompt, /dwelt on in the body/);
    assert.ok(SHARED_BY_ID.hurt_no_comfort);
});
test('turn-ons: 25 new, no duplicates, and nearly all have extra words', () => {
    assert.equal(TURN_TAGS.length, 368); assert.equal(new Set(TURN_TAGS.map(t => t.id)).size, 368);
    assert.ok(TURN_TAGS.filter(t => t.keys).length >= 360);
    const prefs = { biting_kink: 70, impact_play: 80, blushing: 50, choking: 70, necks: 50, claustrophilia: 60 };
    assert.equal(turnIdFor('bit her lip', prefs), 'biting_kink'); assert.equal(turnIdFor('the slap stung', prefs), 'impact_play');
    assert.equal(turnIdFor('hand around her throat', prefs), 'choking'); assert.equal(turnIdFor('shoved into a locker', prefs), 'claustrophilia');
});
test('Cleaner writing holds the AI-tell fixes, and they read as plain instructions', () => {
    const craft = CATEGORIES.find(([id]) => id === 'craft');
    for (const id of ['prose_no_ai_tells', 'prose_unmannered', 'pattern_breaker', 'prose_no_echo', 'prose_trust_reader']) assert.equal(BY_ID[id].category, 'craft', id);
    assert.ok(craft[4].length >= 12);
    const p = composePrompt(freshState({}), 'Eli', { story: freshState({ moods: { prose_trust_reader: 70 } }) });
    assert.match(p, /How it's written:\nCleaner writing:\n- strong: trust the reader: once a moment shows something/);
});
test('the world leads names the handoffs, and stays out of the plain story list', () => {
    const p = composePrompt(freshState({}), 'Easterman', { story: freshState({ moods: { world_leads: 70 } }), player: { name: 'Lamb', state: freshState({}) } });
    assert.match(p, /The world leads\. Easterman, everyone else and events make the big moves/);
    assert.match(p, /Don't end on the threshold/); assert.match(p, /Push the story forward every reply/);
    assert.doesNotMatch(p, /- strong: the world leads/);
});
