import test from 'node:test';
import assert from 'node:assert/strict';
import { MOODS, freshState, composePrompt, budgetPrompt, blendAnalysis, analysisMessages } from '../core.js';
const count = text => Math.ceil(text.length / 4);

test('token target trims definitions, never selected values, even with all 140 states', async () => {
    const s = freshState({ moods: Object.fromEntries(MOODS.map(m => [m.id, 80])) });
    const result = await budgetPrompt(s, 'Alex', 300, count);
    assert.equal(result.selectedIds.length, MOODS.length); assert.equal(result.omitted, 0);
    assert.equal(result.compact, true); assert.equal(result.overBudget, result.tokens - 300);
    for (const m of MOODS) assert.ok(result.prompt.includes(`${m.label} 80/100`), m.id);
    const tiny = await budgetPrompt(s, 'Alex', 1, count);
    assert.equal(tiny.prompt, result.prompt); assert.equal(tiny.overBudget, tiny.tokens - 1);
    const full = await budgetPrompt(s, 'Alex', 10000, count);
    assert.equal(full.compact, false); assert.ok(full.tokens > result.tokens);
    assert.deepEqual(full.selectedIds, result.selectedIds);
});

test('seven-state example blend keeps all seven exact strengths and reports token target overrun', async () => {
    const moods = { masking_warmth: 53, confident: 47, suave: 38, chatty: 27, stoic: 27, enamoured: 10, sexually_frustrated: 4 };
    const p = await budgetPrompt(freshState({ moods }), 'Alex', 320, count);
    assert.equal(p.omitted, 0); assert.equal(p.selectedIds.length, 7);
    for (const [id, value] of Object.entries(moods)) assert.ok(p.prompt.includes(`${MOODS.find(m => m.id === id).label} ${value}/100`));
    assert.doesNotMatch(p.prompt, /Jealous|Lying/);
    assert.ok(p.tokens < 500); assert.equal(p.overBudget, p.tokens - 320);
});

test('all 1–100 strengths survive exactly; pins do not amplify weakness', () => {
    const s = freshState({ moods: { calm: 90, horny: 15 }, pins: { horny: true } });
    const p = composePrompt(s, 'Alex'); assert.ok(p.indexOf('Calm 90') < p.indexOf('Horny 15'));
    for (let v = 1; v <= 100; v++) {
        s.moods.horny = v;
        assert.ok(composePrompt(s, 'Alex', true).includes(`Horny ${v}/100`));
    }
    s.moods.horny = 4; s.moods.calm = 0; assert.match(composePrompt(s, 'Alex'), /Horny 4\/100/);
    s.sceneBreathing = false; assert.doesNotMatch(composePrompt(s, 'Alex'), /separate conversations/);
});

test('every catalogue pair can coexist in either weak/strong order', () => {
    for (let a = 0; a < MOODS.length; a++) for (let b = a + 1; b < MOODS.length; b++) {
        const first = MOODS[a], second = MOODS[b];
        for (const [x, y] of [[4, 90], [90, 4]]) {
            const s = freshState({ moods: { [first.id]: x, [second.id]: y } });
            const p = composePrompt(s, 'Alex', true);
            assert.ok(p.includes(`${first.label} ${x}/100`), `${first.id} with ${second.id}`);
            assert.ok(p.includes(`${second.label} ${y}/100`), `${second.id} with ${first.id}`);
            assert.equal(s.moods[first.id], x); assert.equal(s.moods[second.id], y);
        }
    }
});

test('expression modifiers activate independently, never by default', () => {
    const rules = { masking_warmth: 'Active masking', masking_coldness: 'Active masking',
        masking_emotive: 'Active masking', masking_less_emotive: 'Active masking',
        stoic: 'Stoic scales', lying: 'Lying scales', emotionless: 'Emotionless adds' };
    const plain = composePrompt(freshState({ moods: { angry: 75, affectionate: 50 } }), 'Alex', true);
    for (const phrase of Object.values(rules)) assert.ok(!plain.includes(phrase));
    for (const [id, phrase] of Object.entries(rules)) {
        const s = freshState({ moods: { angry: 75, [id]: 1 } });
        assert.ok(composePrompt(s, 'Alex', true).includes(phrase));
        s.moods[id] = 0; assert.ok(!composePrompt(s, 'Alex', true).includes(phrase));
    }
});

test('disabled and all-zero states send nothing regardless of token target', async () => {
    for (const s of [freshState(), freshState({ enabled: false, moods: { angry: 90 } })]) {
        const p = await budgetPrompt(s, 'Alex', 1, () => { throw Error('No text should be counted'); });
        assert.equal(p.prompt, ''); assert.deepEqual(p.selectedIds, []); assert.equal(p.tokens, 0);
    }
});

test('dynamic mode shares intensity semantics and has no faint-value cutoff', () => {
    const s = freshState({ moods: { angry: 1, warm: 2 }, decay: 0 });
    const next = blendAnalysis(s, { moods: { angry: 1, warm: 2 } });
    assert.equal(next.angry, 1); assert.equal(next.warm, 2);
    const p = analysisMessages({})[0].content;
    assert.match(p, /1 barely present/); assert.match(p, /never by default/);
    assert.doesNotMatch(p, /at most 8/);
});
