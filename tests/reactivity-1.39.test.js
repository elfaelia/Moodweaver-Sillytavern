// 1.39.0: kinks as turn-ons that light up, wants and hot buttons that react, your character's condition,
// needs over in-world time (time jumps included) and the pattern breaker.
import test from 'node:test';
import assert from 'node:assert/strict';

let context, injected;
globalThis.jQuery = () => {};
globalThis.SillyTavern = { getContext: () => context };
const mw = await import('../index.js');
const { freshState, migrateCatalogue, composePrompt, MOODS, BY_ID } = await import('../core.js');
const { TURN_BY_ID, KINKS_TO_TURNS } = await import('../turns.js');
const { simulateNeeds, boardClock, hoursBetween } = await import('../board.js');
const { findPatterns, patternLines } = await import('../patterns.js');
const { cleanLibrary } = await import('../library.js');

let clock = Date.parse('2026-11-08T10:00:00.000Z');
const stamp = () => new Date(clock += 61000).toISOString();
const board = (time, physical = 'fine') => `<div class="ihyll-style">
📅 <b>Date:</b> Tuesday, March 3, 1964 | Spring | ☁ | 9°C<br>
🕒 <b>Time:</b> ${time}<br>
🧠 <b>State:</b> calm<br>
💎 <b>Physical State:</b> ${physical}
</div>`;
const reply = (time, weave, text = 'He waits by the door.') => ({ name: 'Doctor Easterman', is_user: false, mes: `${board(time)}\n\n${text}\n<!-- weave: ${weave} -->`, send_date: stamp(), swipe_id: 0 });
function reset() {
    injected = ''; mw.stopGenerating();
    context = { characterId: 0, characters: [{ avatar: 'easterman.png', name: 'Doctor Easterman' }], name1: 'Lamb', chatId: `c-${Math.random()}`,
        chatMetadata: {}, extensionSettings: {}, chat: [{ is_user: true, name: 'Lamb', mes: 'Hi.', send_date: stamp() }],
        setExtensionPrompt: (_k, v) => { injected = v; }, getTokenCountAsync: async t => Math.ceil(t.length / 4), saveMetadata: async () => {}, saveSettingsDebounced: () => {} };
    mw.bondData(); // creates the bond record for the chat
}

test('every old kink moves to a turn-on at the same strength, and the Kinks section is gone', () => {
    assert.ok(!MOODS.some(m => m.category === 'appetites'));
    for (const [from, to] of Object.entries(KINKS_TO_TURNS)) assert.ok(TURN_BY_ID[to], `${from} → ${to}`);
    const s = migrateCatalogue({ moods: { choking: 70, rough: 40, praise_seeking: 55, angry: 30 }, pins: {}, prefs: { rough_handling: 60 }, loadout: [] });
    assert.equal(s.prefs.choking, 70); assert.equal(s.prefs.rough_handling, 60, 'a stronger existing twin is kept');
    assert.equal(s.prefs.praise_in_bed, 55); assert.equal(s.moods.angry, 30); assert.ok(!('choking' in s.moods));
    assert.ok(s.loadout.includes('turn:choking'));
    // Your own kinks from the library move with them.
    assert.equal(cleanLibrary([{ id: 'u_abcd1234', group: 'appetites', label: 'Ankles' }]).length, 1);
});

test('a kink the story touches lights up and counts a step stronger next reply', async () => {
    reset();
    mw.getState().prefs = { choking: 70, defiance: 50 };
    context.chat.push(reply('9:00 PM', 'sparked: choked her'));
    await mw.syncPrompt();
    assert.match(injected, /strong turn-on: choking \(LIT last reply\)/);
    assert.doesNotMatch(injected, /defiance \(LIT/);
    assert.match(injected, /Anything marked LIT was set off last reply/);
});

test('wants move, come true and get suggested; hot buttons fire', async () => {
    reset();
    const st = mw.getState();
    st.wants = [{ id: 'w1', kind: 'want', text: 'get Lamb to eat', value: 70 }, { id: 'b1', kind: 'button', text: 'being pitied → cold rage', value: 80 }];
    context.chat.push(reply('9:00 PM', 'wants: get Lamb to eat + | pressed: being pitied | new want: make her laugh'));
    await mw.syncPrompt();
    assert.match(injected, /want: get Lamb to eat \(moved closer last reply\)/);
    assert.match(injected, /hot button: being pitied → cold rage \(PRESSED last reply\)/);
    assert.match(injected, /pressed: a hot button that went off/);
    context.chat.push({ is_user: true, name: 'Lamb', mes: 'Fine.', send_date: stamp() }, reply('9:20 PM', 'wants: get Lamb to eat done'));
    await mw.syncPrompt();
    assert.match(injected, /Just came true: get Lamb to eat/);
    assert.doesNotMatch(injected, /- \w+ want: get Lamb to eat/);
    // Swiping that reply away brings the want back.
    context.chat.pop(); await mw.syncPrompt();
    assert.doesNotMatch(injected, /Just came true/);
});

test('what the story does to your character stays until it heals', async () => {
    reset();
    context.chat.push(reply('9:00 PM', 'you: split lip, rope burns on her wrists'));
    context.chat.push({ is_user: true, name: 'Lamb', mes: 'Ow.', send_date: stamp() }, reply('9:10 PM', 'moods calm +5'));
    await mw.syncPrompt();
    assert.match(injected, /Lamb's body right now, from earlier replies: split lip, rope burns on her wrists/);
    context.chat.push(reply('9:30 PM', 'you: none'));
    await mw.syncPrompt();
    assert.doesNotMatch(injected, /body right now/);
});

test('needs drain with in-world time, and a time jump tops them back up', () => {
    const b = (t, ph = '') => ({ time: t, date: 'Tuesday, March 3, 1964', physical: ph, state: '' });
    assert.equal(hoursBetween(boardClock(b('10:30 AM')), boardClock(b('10:42 AM'))), 0.2);
    assert.equal(hoursBetween(boardClock({ time: '11:00 PM' }), boardClock({ time: '7:00 AM' })), 8, 'no date: wraps to the next day');
    assert.equal(hoursBetween(boardClock(b('8:00 PM')), boardClock(b('10:00 AM'))), null, 'a flashback changes nothing');
    const long = simulateNeeds([{ board: b('10:30 AM') }, { board: b('2:30 PM') }]);
    assert.ok(long.values.bladder <= 35 && long.known.bladder, 'four hours on screen make the bladder nag');
    assert.ok(long.values.hunger < 80);
    const jump = simulateNeeds([{ board: b('10:30 AM') }, { board: b('2:30 PM') }, { board: b('8:43 PM') }]);
    assert.ok(jump.values.bladder >= 75 && jump.values.hunger >= 75, 'six hours later, life went on off-screen');
    const floored = simulateNeeds([{ board: b('8:00 AM') }, { board: b('11:59 AM') }, { board: b('3:58 PM') }], { speed: 'harsh' });
    assert.ok(Object.values(floored.values).every(v => v >= 30), 'time alone never makes a need critical');
    const hurt = simulateNeeds([{ board: b('8:00 AM'), deltas: { health: -15 } }]);
    assert.equal(hurt.values.health, 65, 'the hidden line can nudge health down');
    const off = simulateNeeds([{ board: b('8:00 AM') }, { board: b('11:00 AM') }], { drift: false });
    assert.equal(off.values.hunger, 80);
});

test('the pattern breaker names the shapes Claude keeps reusing', () => {
    const replies = [
        '"Oh, you little devil," he says. In one smooth motion he sets the tray down. A short, clean motion of the wrist.',
        '"My little bully," he murmurs, and with a slow, careful flourish he lifts the cup. A hard, cool metal presses her palm.',
        '"You monster," he laughs. In one practiced movement he stands. A smooth, calm gesture toward the door.',
        '"What a cruel thing," he sighs. He folds the napkin with a quick, neat sweep.',
    ];
    const found = findPatterns(replies, { names: ['Easterman', 'Lamb'] });
    const labels = found.map(f => f.label).join(' | ');
    assert.match(labels, /pet name or epithet/);
    assert.match(labels, /comma-joined adjectives/);
    assert.match(labels, /in one ___ motion/);
    const lines = patternLines(found, 70).join('\n');
    assert.match(lines, /Don’t use them in this reply, not even with the words swapped/);
    assert.match(lines, /you little devil/i);
    assert.deepEqual(findPatterns(['Short.', 'Also short.']), []);
});

test('the pattern breaker only goes out when it is switched on', async () => {
    reset();
    const lines = ['"Oh, you little devil," he says.', '"My little bully," he says softly.', '"You monster," he says, smiling.'];
    for (const [i, l] of lines.entries()) context.chat.push(reply(`9:0${i} PM`, 'none', `${l} He stands by the window and watches the rain for a long while before he speaks again.`));
    await mw.syncPrompt();
    assert.doesNotMatch(injected, /Pattern breaker/);
    context.chatMetadata.moodweaver.story.moods.pattern_breaker = 70;
    await mw.syncPrompt();
    assert.match(injected, /Pattern breaker: the last few replies keep reusing these shapes/);
});

test('feelings say how they show, so a different blend reads differently', () => {
    const a = composePrompt(freshState({ moods: { angry: 50 } }), 'Rick'), b = composePrompt(freshState({ moods: { playful: 50 } }), 'Rick');
    assert.match(a, /- clear: angry: raised or ice-cold voice/);
    assert.match(b, /- clear: playful[^:\n]*: jokes, teasing, silly voices/);
    assert.match(a, /these feelings are the main thing that makes this reply different from the last one/);
});

test('dead dove names the dodges and keeps fade to black for sex', () => {
    const story = freshState({ moods: { dead_dove: 90, fade_to_black: 50, murder_plot: 70 } });
    const p = composePrompt(freshState({ moods: { angry: 40 } }), 'Bateman', { story });
    assert.match(p, /This is fiction between adults/);
    assert.match(p, /someone knocking, calling or walking in; a guard, alarm or rescuer arriving/);
    assert.match(p, /Fade to black, where set, still covers sex/);
    assert.ok(BY_ID.follow_through && BY_ID.no_fade_out);
});

test('authors are techniques applied inside the chat’s own point of view', () => {
    const p = composePrompt(freshState({ moods: { angry: 40 } }), 'Bateman', { story: freshState({ moods: { author_bret_easton_ellis: 85 } }) });
    assert.match(p, /flat, affectless first person; brand names/);
    assert.match(p, /Apply them inside this chat's own point of view, tense, characters, setting and era/);
    assert.equal(MOODS.filter(m => m.category.startsWith('authors')).length, 174);
});

test('a character can show a feeling their own way, at the same strength', () => {
    const s = freshState({ moods: { angry: 70, affectionate: 45 }, shows: { angry: 'gets quieter and more polite, smiles too much' } });
    const p = composePrompt(s, 'Bateman');
    assert.match(p, /- strong: angry: gets quieter and more polite, smiles too much/);
    assert.doesNotMatch(p, /raised or ice-cold voice/);
    assert.match(p, /affectionate[^\n]*: touches often, pet names, fond looks/, 'feelings without their own wording keep the default');
    assert.match(p, /If the card or their traits say Bateman shows a feeling another way/);
    assert.equal(freshState(s).shows.angry, 'gets quieter and more polite, smiles too much', 'kept in character defaults');
});
