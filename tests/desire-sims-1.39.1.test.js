// 1.39.1: the desire meter, the "how it shows" switch and the Sims traits.
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDesire, setDesire, desireLines, cleanDesire, cleanBond } from '../bond.js';
import { parseWeave, weavePrompt } from '../weave.js';
import { freshState, composePrompt, MOODS, MERGED_SEARCH_NAMES, sectionOf } from '../core.js';
import { SIMS_ALIASES } from '../sims.js';

const step = (i, d) => ({ pos: i, key: `k${i}`, s: { d } });

test('the hidden line reports desire, and pace caps how fast it climbs', () => {
    const w = parseWeave('x <!-- weave: desire: arousal +30, restraint -4 -->');
    assert.deepEqual(w.desire, { a: 30, s: -4, release: false });
    assert.equal(parseWeave('x <!-- weave: desire: release -->').desire.release, true);
    const list = [step(1, { a: 30, s: 0 }), step(2, { a: 30, s: 0 })];
    assert.equal(computeDesire({ on: true, pace: 'slow' }, list).a, 10, 'slow burn: five a reply at most');
    assert.equal(computeDesire({ on: true, pace: 'fast' }, list).a, 40);
    assert.equal(computeDesire({ on: true, pace: 'fast', cap: 40 }, [...list, step(3, { a: 20 })]).a, 40, 'the cap holds');
    assert.ok(weavePrompt({ n: 'Rick', u: 'Lamb', desire: true }).some(l => /desire: how this reply moved Rick's arousal/.test(l)));
});

test('frustration builds without release; release resets it into afterglow', () => {
    const hot = Array.from({ length: 8 }, (_, i) => step(i, { a: 10 }));
    const built = computeDesire({ on: true, pace: 'normal' }, hot);
    assert.ok(built.a >= 61 && built.f > 10, 'frustration builds while aroused');
    const after = computeDesire({ on: true, pace: 'normal' }, [...hot, step(9, { a: 0, release: true })]);
    assert.equal(after.a, 15); assert.equal(after.f, 0); assert.equal(after.stage, 'Afterglow');
    assert.ok(computeDesire({ on: true }, [step(1, null), step(2, null)]).a === 0, 'quiet replies fade it');
});

test('you can drag and pin it, and it still moves from where you put it', () => {
    const bond = cleanBond({ desire: { on: true, pace: 'normal' } });
    const list = [step(1, { a: 5 })];
    setDesire(bond, 'a', 70, list);
    assert.equal(computeDesire(bond.desire, list).a, 70);
    assert.equal(computeDesire(bond.desire, [...list, step(2, { a: 5 })]).a, 75, 'later replies move it from there');
    bond.desire.pins.s = 90;
    assert.equal(computeDesire(bond.desire, [...list, step(2, { s: -10 })]).s, 90, 'a pin holds');
});

test('the note says what it looks like, not a number', () => {
    const bond = cleanBond({ desire: { on: true, pace: 'slow', cap: 60, anchor: { a: 55, s: 75, f: 70, key: '', pos: -1 } } });
    const [line] = desireLines(bond, [], 'Easterman', 'Lamb');
    assert.match(line, /desire for Lamb: warm; holding back hard; frustration high/);
    assert.match(line, /wants Lamb and is fighting it/);
    assert.match(line, /builds slowly in this chat/);
    assert.match(line, /tops out at warm/);
    assert.deepEqual(desireLines(cleanBond({}), [], 'E', 'L'), [], 'off sends nothing');
    assert.equal(cleanDesire({}).on, false);
});

test('how feelings show: default plus yours, only yours, or off', () => {
    const s = freshState({ moods: { angry: 60, playful: 50 }, shows: { angry: 'goes very polite' } });
    const all = composePrompt(s, 'Rick', { showsMode: 'all' }), mine = composePrompt(s, 'Rick', { showsMode: 'mine' }), off = composePrompt(s, 'Rick', { showsMode: 'off' });
    assert.match(all, /angry: goes very polite/); assert.match(all, /playful[^\n]*: jokes, teasing/);
    assert.match(mine, /angry: goes very polite/); assert.doesNotMatch(mine, /jokes, teasing/);
    assert.doesNotMatch(off, /goes very polite|jokes, teasing/); assert.match(off, /- clear: angry\n/);
});

test('Sims traits are traits, with short descriptions, under a plain heading', () => {
    const sims = MOODS.filter(m => m.category === 'sims');
    assert.ok(sims.length >= 80);
    assert.ok(sims.every(m => sectionOf(m) === 'trait' && m.cue.split(' ').length <= 14 && /From The Sims (3|4|3 & 4)\.$/.test(m.note)));
    const p = composePrompt(freshState({ moods: { sim_childish: 70, sim_couch_potato: 40 } }), 'Rick');
    assert.match(p, /Habits & quirks:/); assert.doesNotMatch(p, /Sims traits/);
    for (const [label] of SIMS_ALIASES) assert.ok(MOODS.some(m => m.label === label), label);
    assert.ok(Object.values(MERGED_SEARCH_NAMES).some(names => names.includes('kleptomaniac')));
});
