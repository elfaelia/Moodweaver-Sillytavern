// 1.38.0: the info board as the main driver. Wider reading of its words, board words alongside the
// hidden line, and memories and board pins switched off unless you turn them on.
import test from 'node:test';
import assert from 'node:assert/strict';

let context, injected;
globalThis.jQuery = () => {};
globalThis.SillyTavern = { getContext: () => context };
const mw = await import('../index.js');
const { feelingsFromBoard, relationsFromBoard, needsFromBoard } = await import('../board.js');

let clock = Date.parse('2026-11-05T22:00:00.000Z');
const stamp = () => new Date(clock += 61000).toISOString();
const board = (state, outfit = 'suit') => `<div class="ihyll-style">
🕒 <b>Time:</b> 9:30 AM<br>
🗺️ <b>Location:</b> Ward B | <b>Present:</b> Lamb | <b>Activity:</b> waiting<br>
👔 <b> Doctor Easterman’s Outfit:</b> ${outfit}<br>
🧠 <b>State:</b> ${state}<br>
💎 <b>Physical State:</b> hasn’t eaten since yesterday
</div>`;
const reply = (state, weave, outfit) => { const mes = `${board(state, outfit)}\n\nHe waits.${weave ? `\n<!-- weave: ${weave} -->` : ''}`, send_date = stamp(); return { name: 'Doctor Easterman', is_user: false, mes, send_date, swipe_id: 0, swipes: [mes], swipe_info: [{ send_date }] }; };
function reset(settings = {}) {
    injected = ''; mw.stopGenerating();
    context = { characterId: 0, characters: [{ avatar: 'easterman.png', name: 'Doctor Easterman' }], name1: 'Lamb', chatId: `c-${Math.random()}`,
        chatMetadata: {}, extensionSettings: Object.keys(settings).length ? { moodweaver: settings } : {}, chat: [{ is_user: true, name: 'Lamb', mes: 'Hi.', send_date: stamp() }],
        setExtensionPrompt: (_k, v) => { injected = v; }, getTokenCountAsync: async t => Math.ceil(t.length / 4), saveMetadata: async () => {}, saveSettingsDebounced: () => {} };
}
const st = () => mw.getState();
const ids = list => list.map(x => x.id);

test('board words: phrases, everyday words, American spelling and curly apostrophes all land', () => {
    assert.deepEqual(ids(feelingsFromBoard({ state: 'barely holding it together, numb, on edge' })), ['losing_control', 'shut_down', 'jumpy']);
    assert.deepEqual(ids(feelingsFromBoard({ state: 'strung out, spiraling, self-loathing' })), ['strung_out', 'spiralling', 'ashamed']);
    assert.deepEqual(ids(feelingsFromBoard({ state: 'giddy, bratty, cold fury' })), ['giddy', 'cheeky', 'tranquil_fury']);
    assert.deepEqual(ids(relationsFromBoard({ toward: 'putty in her hands, terrified of losing her, besotted' }, 'Lamb')), ['wrapped', 'afraid_to_lose', 'smitten']);
    assert.deepEqual(ids(relationsFromBoard({ toward: 'obsessed with Lamb, can’t say no' }, 'Lamb')), ['obsessed', 'wrapped']);
    assert.equal(needsFromBoard({ physical: 'hasn’t eaten since yesterday' }).hunger.value, 30);
    // Strength: the stronger word lands higher, "slightly" lowers it, the first one listed counts most.
    const [terrified] = feelingsFromBoard({ state: 'calm, terrified' }).filter(x => x.id === 'afraid');
    const [afraid] = feelingsFromBoard({ state: 'calm, afraid' }).filter(x => x.id === 'afraid');
    assert.ok(terrified.value > afraid.value);
    assert.ok(feelingsFromBoard({ state: 'slightly afraid' })[0].value <= 40);
    assert.ok(feelingsFromBoard({ state: 'not afraid' }).length === 0, 'negated words are skipped');
});

test('board words fill in what the hidden line didn’t name; the line wins for what it names', async () => {
    reset();
    context.chat.push(reply('terrified, possessive, jealous', 'moods afraid +10'));
    mw.reconcile();
    assert.equal(st().moods.afraid, 10, 'the hidden line set afraid; the board doesn’t override it');
    assert.ok(st().moods.possessive > 40 && st().moods.jealous > 40, 'the board filled in the rest');
    // Switched off, only the hidden line counts.
    reset({ boardWithWeave: false });
    context.chat.push(reply('terrified, possessive, jealous', 'moods afraid +10'));
    mw.reconcile();
    assert.equal(st().moods.possessive, 0);
    // A swipe takes the board's part back too.
    reset();
    context.chat.push(reply('possessive, jealous', 'moods afraid +10'));
    mw.reconcile(); context.chat.at(-1).swipe_id = 1; mw.reconcile();
    assert.deepEqual([st().moods.afraid, st().moods.possessive, st().moods.jealous], [0, 0, 0]);
});

test('memories are off by default: nothing asked for, saved or sent', async () => {
    reset();
    context.chat.push(reply('calm', 'moods calm +10 | remember: Lamb told him her real name'));
    mw.reconcile();
    assert.equal(context.chatMetadata.moodweaver.pairs?.['char:easterman.png|user']?.memories?.length ?? 0, 0);
    await globalThis.moodweaverBeforeGeneration([], 8000, () => {}, 'normal'); mw.stopGenerating();
    assert.doesNotMatch(injected, /remember:/);
    // One saved earlier isn't sent while memories are off; one you wrote yourself still is.
    context.chatMetadata.moodweaver.pairs = { 'char:easterman.png|user': { members: ['char:easterman.png', 'user'], labels: {}, enabled: true, moods: {}, memories: [
        { id: 'a', text: 'she bit him in the lab', boardText: 'she bit him in the lab', value: 55, who: 'both' }, { id: 'b', text: 'they met in 1959', value: 70, who: 'both' }] } };
    await mw.syncPrompt();
    assert.doesNotMatch(injected, /she bit him/); assert.match(injected, /they met in 1959/);
    reset({ boardMemories: true });
    context.chat.push(reply('calm', 'moods calm +10 | remember: Lamb told him her real name'));
    mw.reconcile(); await mw.syncPrompt();
    assert.equal(context.chatMetadata.moodweaver.pairs['char:easterman.png|user'].memories.length, 1);
    assert.match(injected, /remember:/);
});

test('board pins are off by default: corrections, kept tiles and needs you set are left out, and come back when switched on', async () => {
    reset();
    context.chat.push(reply('calm', 'moods calm +10'));
    mw.reconcile();
    const meta = context.chatMetadata.moodweaver;
    meta.board.fix = { charOutfit: { text: 'dressing gown', on: '?', pos: -1 } };
    meta.board.keep = { state: ['jittery'], physical: [] }; meta.board.needs = { hunger: 5 };
    await mw.syncPrompt();
    assert.doesNotMatch(injected, /dressing gown|jittery|set by the player|The player corrected|The player keeps/);
    assert.deepEqual(mw.pinCounts(), { sliders: 0, meters: 0, needs: 0, fixes: 0, kept: 0 });
    context.extensionSettings.moodweaver.boardPins = true;
    await mw.syncPrompt();
    assert.match(injected, /The player corrected the last board[\s\S]*dressing gown/); assert.match(injected, /jittery/);
});
