import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWeave, stripWeave, weavePrompt, applyChanges, traitKey } from '../weave.js';
import { stripBoard, feelingId, relationId, cleanBoardMeta, liveBoard } from '../board.js';
import { cleanBond, computeBond, bondStanding, turnIdFor } from '../bond.js';
import { composePrompt, freshState } from '../core.js';

const line = '<!-- weave: moods desperate -10, hollowed out +15 | needs hunger low | toward obsessed with Lamb +5 | friendship +1 | romance +2 | trust -3 | power +4 | thinks: she\'s stubborn, his | sparked: her defiance | remember: she woke to his humming -->';
test('weave line parses every field and old bond lines still read', () => {
    const p = parseWeave(`He hums.\n${line}`);
    assert.deepEqual([p.f, p.r, p.t, p.p], [1, 2, -3, 4]);
    assert.deepEqual(p.moods, [{ name: 'desperate', delta: -10 }, { name: 'hollowed out', delta: 15 }]);
    assert.deepEqual(p.needs, { hunger: 30 });
    assert.deepEqual(p.thinks, ['stubborn', 'his']);
    assert.equal(p.sparked[0].text, 'her defiance');
    assert.equal(p.remember, 'she woke to his humming');
    assert.deepEqual(parseWeave('<!-- bond: friendship +2 | feels: wary -->').feels, ['wary']);
    assert.equal(stripWeave(`He hums.\n${line}`), 'He hums.');
});
test('a swipe replaces its own change, a deletion undoes it, pins hold', () => {
    const v = { a: 50, b: 40 }, pins = { b: true };
    const t = { get: i => v[i] ?? 0, set: (i, x) => { v[i] = x; }, pinned: i => Boolean(pins[i]) };
    let r = applyChanges(t, {}, 5, [{ name: 'a', delta: 10 }, { name: 'b', delta: 10 }], n => n);
    assert.deepEqual(v, { a: 60, b: 40 });
    r = applyChanges(t, r.ledger, 5, [{ name: 'a', delta: -20 }], n => n); assert.equal(v.a, 30);
    r = applyChanges(t, r.ledger, 7, [{ name: 'a', delta: 5 }], n => n); assert.equal(v.a, 35);
    applyChanges(t, r.ledger, 5, [], n => n); assert.equal(v.a, 30);
});
test('power names who gained it, and off ends a feeling', async () => {
    const { powerChange } = await import('../weave.js');
    assert.equal(powerChange('Lamb +3', 'Doctor Easterman', 'Lamb'), -3);
    assert.equal(powerChange('Easterman +2', 'Doctor Easterman', 'Lamb'), 2);
    const both = parseWeave('<!-- weave: control Easterman +1 | pull Lamb +2 -->');
    assert.equal(powerChange(both.pRaw, 'Doctor Easterman', 'Lamb'), 1);
    assert.equal(powerChange(both.lRaw, 'Doctor Easterman', 'Lamb'), -2);
    assert.deepEqual(parseWeave('<!-- weave: moods afraid off -->').moods, [{ name: 'afraid', delta: -100 }]);
    assert.deepEqual(parseWeave('<!-- weave: none -->').moods, []);
});
test('sliders shape the dynamic: obsessed plus distrust reads as toxic obsession', async () => {
    const { sliderAxes } = await import('../bond.js');
    const d = computeBond(cleanBond({}), 9, 'Easterman', 'Lamb', sliderAxes({ obsessed: 88, distrusts: 40 }));
    assert.equal(d.dynamic.name, 'Toxic obsession');
});
test('names resolve to catalogue feelings and relationship types', () => {
    assert.equal(feelingId('Clingy / needy'), 'clingy');
    assert.equal(feelingId('terror'), 'afraid');
    assert.equal(feelingId('hollowed out'), null);
    assert.equal(relationId('obsessed with Lamb', 'Lamb'), 'obsessed');
    assert.equal(traitKey('So stubborn!'), traitKey('stubborn'));
    assert.equal(turnIdFor('her defiance', { defiance: 70 }), 'defiance');
});
test('old boards leave the prompt, and an empty reply keeps its board', () => {
    const board = '<div class="ihyll-style">\n📅 <b>Date:</b> Tue<br>\n🧠 <b>State:</b> calm\n</div>\n\nHe waits.';
    assert.equal(stripBoard(board), 'He waits.');
    assert.equal(stripBoard('no board'), 'no board');
});
test('weave needs beat older board words', () => {
    const found = { board: { physical: 'well fed', outfits: [] }, index: 2, name: 'E' };
    const live = liveBoard(found, cleanBoardMeta({}), {}, { 3: { hunger: 30 } });
    assert.equal(live.needs.find(n => n.id === 'hunger').value, 30);
});
test('meters: four bars, a named dynamic, and the standing sits under the relationship', () => {
    const bond = cleanBond({ base: { r: 80, t: -30 }, steps: { 1: { f: 1, r: 1 } } });
    const d = computeBond(bond, 9, 'Easterman', 'Lamb');
    assert.equal(d.dynamic.name, 'Toxic obsession');
    const standing = bondStanding({ bond, chatLength: 9, n: 'Easterman', u: 'Lamb' });
    const prompt = composePrompt(freshState({ moods: { anxious: 50 } }), 'Easterman', { player: { name: 'Lamb', state: freshState() }, standing, weave: weavePrompt({ n: 'Easterman', u: 'Lamb' }) });
    assert.match(prompt, /<relationships>\nEasterman toward Lamb:\n- where it stands now: friendship: acquaintances; romance: soulmates; trust: wary/);
    assert.match(prompt, /- their dynamic, toxic obsession: Easterman keeps Lamb close/);
    assert.match(prompt, /both are true/);
    assert.match(prompt, /<!-- weave: moods/);
    assert.match(prompt, /no closing paragraph of reflection/);
});

test('Easterman and Lamb: he holds the keys, she has the pull, and the dynamic is a gilded cage', async () => {
    const { sliderAxes } = await import('../bond.js');
    const axes = sliderAxes({ obsessed: 88, captor_of: 90, indulges: 75, lets_them_win: 60 });
    assert.ok(axes.p > 50 && axes.l < -40);
    assert.equal(computeBond(cleanBond({}), 9, 'Easterman', 'Lamb', axes).dynamic.name, 'Gilded cage');
});
test('Rick: love without trust reads as guarded love; a chosen dynamic and pinned meters win', async () => {
    const { sliderAxes } = await import('../bond.js');
    assert.equal(computeBond(cleanBond({ base: { r: 65, t: -30, f: 5, l: 20 } }), 9, 'Rick', 'Beth').dynamic.name, 'Guarded love');
    assert.equal(computeBond(cleanBond({ fixed: 'Worship' }), 9).dynamic.name, 'Worship');
    assert.equal(computeBond(cleanBond({ base: { r: 60 }, pins: { p: 70 } }), 9, 'E', 'L', sliderAxes({ submits_to: 90 })).dynamic.name, 'Possession');
});
test('the upper hand changing hands is noticed', () => {
    const d = computeBond(cleanBond({ base: { r: 60 }, steps: { 1: { p: 3 }, 2: { p: -3 }, 3: { p: 2 } } }), 9);
    assert.equal(d.swing, true);
});
