import test from 'node:test';
import assert from 'node:assert/strict';
import { ERA_LOCALE } from '../locale.js';
import { MOODS, freshState, composePrompt, budgetPrompt, blendAnalysis, analysisMessages, sceneData, activeMoods, tierOf } from '../core.js';
const count = text => Math.ceil(text.length / 4);
// Settings reach the note as strength words ("- clear: …"), not numbers.
const TIER_LINE = /^- (faint|subtle|mild|clear|strong|intense|overwhelming|maximum): /;
const SCALE_TEXT = /^- \w+: (a flicker|one small|a light|shows|full force|dominates|shows in)/;
const settingLines = (state, story = false) => (story ? composePrompt(freshState({}), 'Alex', { story: state }) : composePrompt(state, 'Alex'))
    .split('\n').filter(l => TIER_LINE.test(l) && !SCALE_TEXT.test(l));

test('the token target only warns: every setting is kept, even with the whole catalogue on', async () => {
    const s = freshState({ moods: Object.fromEntries(MOODS.map(m => [m.id, 80])) });
    const result = await budgetPrompt(s, 'Alex', 300, count);
    assert.equal(result.selectedIds.length, activeMoods(s).length); assert.equal(result.omitted, 0);
    assert.equal(result.overBudget, result.tokens - 300);
    const tiny = await budgetPrompt(s, 'Alex', 1, count), full = await budgetPrompt(s, 'Alex', 1e9, count);
    assert.equal(tiny.prompt, result.prompt); assert.equal(full.prompt, result.prompt, 'the target never changes what is sent');
    assert.equal(tiny.overBudget, tiny.tokens - 1); assert.equal(full.overBudget, 0);
});

test('a seven-setting blend keeps all seven at their own strength and reports going over the target', async () => {
    const moods = { masking_warmth: 53, confident: 47, suave: 38, chatty: 27, stoic: 27, yearning: 10, sexually_frustrated: 4 };
    const p = await budgetPrompt(freshState({ moods }), 'Alex', 320, count);
    assert.equal(p.omitted, 0); assert.equal(p.selectedIds.length, 7);
    for (const [id, value] of Object.entries(moods)) assert.ok(settingLines(freshState({ moods })).some(l => l.startsWith(`- ${tierOf(value).name.toLowerCase()}: `) && settingLines(freshState({ moods: { [id]: value } })).includes(l)), id);
    assert.doesNotMatch(p.prompt, /jealous|lying/i);
    assert.equal(p.overBudget, Math.max(0, p.tokens - 320));
});

test('every strength from 1 to 100 lands on the right word, strongest first', () => {
    const bands = [[1, 'faint'], [10, 'faint'], [11, 'subtle'], [20, 'subtle'], [21, 'mild'], [40, 'mild'], [41, 'clear'], [60, 'clear'],
        [61, 'strong'], [80, 'strong'], [81, 'intense'], [90, 'intense'], [91, 'overwhelming'], [99, 'overwhelming'], [100, 'maximum']];
    for (const [v, word] of bands) assert.ok(settingLines(freshState({ moods: { chatty: v } })).some(l => l.startsWith(`- ${word}: `)), `${v} → ${word}`);
    for (let v = 1; v <= 100; v++) assert.equal(settingLines(freshState({ moods: { chatty: v } })).length, 1, `chatty at ${v} is sent once`);
    const p = composePrompt(freshState({ moods: { calm: 90, horny: 15 }, pins: { horny: true } }), 'Alex');
    assert.ok(p.indexOf('- intense: calm') < p.indexOf('- subtle: horny'), 'stronger first; a pin doesn’t move a weak one up');
    const s = freshState({ moods: { calm: 50 } }); s.sceneBreathing = false;
    assert.doesNotMatch(composePrompt(s, 'Alex'), /Keep the scene moving/);
});

test('settings never crowd each other out, weak beside strong in either order', () => {
    let seed = 7; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
    for (let i = 0; i < 2500; i++) {
        const a = MOODS[rnd(MOODS.length)], b = MOODS[rnd(MOODS.length)];
        if (a.id === b.id || (a.kind === 'story') !== (b.kind === 'story')) continue;
        // An American place-and-time lock respells the whole note, so its partner's line legitimately changes.
        if ([a.id, b.id].some(id => ERA_LOCALE[id]?.locale === 'us')) continue;
        const story = a.kind === 'story';
        for (const [x, y] of [[4, 90], [90, 4]]) {
            const got = settingLines(freshState({ moods: { [a.id]: x, [b.id]: y } }), story);
            for (const [m, v] of [[a, x], [b, y]]) for (const l of settingLines(freshState({ moods: { [m.id]: v } }), story)) assert.ok(got.includes(l), `${m.id} at ${v} beside ${(m === a ? b : a).id}`);
        }
    }
});

test('hiding and mask settings only appear when switched on', () => {
    const plain = composePrompt(freshState({ moods: { angry: 75, affectionate: 50 } }), 'Alex');
    for (const id of ['masking_warmth', 'masking_coldness', 'masking_emotive', 'masking_less_emotive', 'stoic', 'lying', 'emotionless']) {
        const own = settingLines(freshState({ moods: { [id]: 30 } }))[0];
        assert.ok(own && !plain.includes(own), `${id} isn’t there by default`);
        const s = freshState({ moods: { angry: 75, [id]: 30 } });
        assert.ok(composePrompt(s, 'Alex').includes(own), `${id} shows when on`);
        s.moods[id] = 0; assert.ok(!composePrompt(s, 'Alex').includes(own), `${id} goes when off`);
    }
});

test('disabled and all-zero states send nothing regardless of token target', async () => {
    for (const s of [freshState(), freshState({ enabled: false, moods: { angry: 90 } })]) {
        const p = await budgetPrompt(s, 'Alex', 1, () => { throw Error('No text should be counted'); });
        assert.equal(p.prompt, ''); assert.deepEqual(p.selectedIds, []); assert.equal(p.tokens, 0);
    }
});

test('the scene reader uses the same scale and keeps faint values', () => {
    const s = freshState({ moods: { angry: 1, warm: 2 }, decay: 0 });
    const next = blendAnalysis(s, { moods: { angry: 1, warm: 2 } });
    assert.equal(next.angry, 1); assert.equal(next.warm, 2);
    const p = analysisMessages(sceneData([{ name: 'Alex', mes: 'Hi.' }], { name: 'Alex' }, freshState(), { sceneChars: 1000, sceneMessages: 4 }))[0].content;
    assert.match(p, /1-10 faint, 11-20 subtle, 21-40 mild, 41-60 clear, 61-80 strong, 81-90 intense, 91-99 overwhelming, 100/);
    assert.match(p, /opposite feelings can both be high/);
});
