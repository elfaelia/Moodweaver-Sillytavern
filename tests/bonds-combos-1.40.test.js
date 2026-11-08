// 1.40.0: extra Bonds meters and the dynamics they unlock, cravings, combos, and strength that shows in the line.
import test from 'node:test';
import assert from 'node:assert/strict';

let context, injected;
globalThis.jQuery = () => {};
globalThis.SillyTavern = { getContext: () => context };
const mw = await import('../index.js');
const { cleanBond, computeBond, bondStanding, DYNAMIC_NAMES } = await import('../bond.js');
const { MORE_METERS, computeMore, setMore, metersOf, moreLines } = await import('../meters.js');
const { cravingsFrom, findCombos } = await import('../reactive.js');
const { parseWeave, weavePrompt } = await import('../weave.js');
const { freshState, composePrompt } = await import('../core.js');

let clock = Date.parse('2026-11-08T10:00:00.000Z');
const stamp = () => new Date(clock += 61000).toISOString();
const reply = weave => ({ name: 'Joe', is_user: false, mes: `He waits.\n<!-- weave: ${weave} -->`, send_date: stamp(), swipe_id: 0 });
function reset() {
    injected = ''; mw.stopGenerating();
    context = { characterId: 0, characters: [{ avatar: 'joe.png', name: 'Joe' }], name1: 'Lamb', chatId: `c-${Math.random()}`, chatMetadata: {}, extensionSettings: {},
        chat: [{ is_user: true, name: 'Lamb', mes: 'Hi.', send_date: stamp() }], setExtensionPrompt: (_k, v) => { injected = v; },
        getTokenCountAsync: async t => Math.ceil(t.length / 4), saveMetadata: async () => {}, saveSettingsDebounced: () => {} };
    mw.bondData();
}
const step = (i, m) => ({ pos: i, key: `k${i}`, s: { f: 0, r: 0, t: 0, p: 0, l: 0, thinks: [], sparks: [], m } });

test('thirteen meters, off until switched on, moved by the hidden line', () => {
    assert.equal(MORE_METERS.length, 13);
    assert.deepEqual(metersOf('obsession +3, jealousy +5, respect -4, nonsense +2'), { ob: 3, je: 5, re: -4 });
    assert.deepEqual(parseWeave('x <!-- weave: meters: obsession +3, pedestal -2 -->').meters, { ob: 3, pe: -2 });
    const list = [step(1, { ob: 8, je: 5 }), step(2, { ob: 8 })];
    assert.deepEqual(computeMore({}, list).values, {}, 'off means nothing is tracked');
    assert.deepEqual(computeMore({ on: ['ob'] }, list).values, { ob: 16 });
    const bond = cleanBond({ more: { on: ['ob', 're'] } });
    setMore(bond, 're', -70, list);
    assert.equal(computeMore(bond.more, list).values.re, -70, 'two-sided meters go below zero');
    assert.ok(weavePrompt({ n: 'Joe', u: 'Lamb', meters: ['obsession', 'respect'] }).some(l => /- meters: any of obsession, respect that moved/.test(l)));
});

test('the meters unlock dynamics and change the background', () => {
    assert.ok(DYNAMIC_NAMES.length >= 40);
    const joe = cleanBond({ more: { on: ['ob', 'pe'], anchor: { ob: 80, pe: 60, key: '', pos: -1 } } });
    assert.equal(computeBond(joe, Infinity, 'Joe', 'Lamb', null, []).dynamic.name, 'Shrine');
    const bateman = cleanBond({ more: { on: ['hu'], anchor: { hu: 75, key: '', pos: -1 } } });
    assert.equal(computeBond(bateman, Infinity, 'Patrick', 'Lamb', null, []).dynamic.name, 'Prey');
    const rick = cleanBond({ more: { on: ['re'], anchor: { re: 50, key: '', pos: -1 } } });
    assert.equal(computeBond(rick, Infinity, 'Rick', 'Lamb', null, []).dynamic.name, 'Grudging respect');
    assert.equal(computeBond(cleanBond({}), Infinity, 'A', 'B', null, []).dynamic.name, 'Strangers', 'with the meters off nothing changes');
    const rows = bondStanding({ bond: joe, chatLength: Infinity, n: 'Joe', u: 'Lamb', list: [] });
    assert.ok(rows.some(r => /obsession: fixated; pedestal: worships the idea of Lamb/.test(r)));
    assert.deepEqual(moreLines({ on: ['ob'] }, [], 'Joe', 'Lamb'), [], 'a meter at rest says nothing');
});

test('a strong turn-on that hasn’t lit in a while turns into a craving', () => {
    const quiet = Array.from({ length: 9 }, () => new Set());
    assert.deepEqual(cravingsFrom({ choking: 85, defiance: 65, crying: 40 }, quiet).map(c => c.id), ['choking', 'defiance']);
    const lit = [...quiet.slice(0, 6), new Set(['choking']), new Set(), new Set()];
    assert.deepEqual(cravingsFrom({ choking: 85 }, lit), [], 'lit two replies ago: no craving yet');
    assert.deepEqual(cravingsFrom({ choking: 85 }, quiet.slice(0, 3)), [], 'too early in the chat');
});

test('combos fire from two things at once, built in or your own', () => {
    const claim = findCombos({ lit: new Set(['defiance']), moods: { possessive: 60 } }, [], 'Joe', 'Lamb');
    assert.equal(claim[0].name, 'Claim'); assert.match(claim[0].text, /put Lamb back in their place/);
    assert.deepEqual(findCombos({ lit: new Set(['defiance']), moods: {} }), [], 'one thing alone is not a combo');
    const mine = findCombos({ lit: new Set(['crying']), moods: { obsessed: 50 } }, [{ a: 'turn:crying', b: 'mood:obsessed', name: 'Collector', text: 'he wants to keep the tears' }]);
    assert.equal(mine[0].name, 'Collector');
    assert.equal(findCombos({ cravingMet: new Set(['choking']) })[0].name, 'Craving met');
});

test('in a chat: a craving builds, then a lit turn-on plus a feeling fires a combo', async () => {
    reset();
    const st = mw.getState(); st.prefs = { choking: 85, defiance: 60 }; st.moods.possessive = 60;
    for (let i = 0; i < 6; i++) context.chat.push(reply('moods calm +1'));
    await mw.syncPrompt();
    assert.match(injected, /choking \(CRAVING: not lit for \d+ replies\)/);
    assert.match(injected, /A CRAVING is a strong turn-on/);
    context.chat.push(reply('sparked: her defiance'));
    await mw.syncPrompt();
    assert.match(injected, /COMBO, from what just lit up: Claim/);
    context.chat.push(reply('sparked: choked her'));
    await mw.syncPrompt();
    assert.match(injected, /COMBO, from what just lit up: Craving met/);
    context.extensionSettings.moodweaver.combosOn = false; context.extensionSettings.moodweaver.cravingsOn = false;
    await mw.syncPrompt();
    assert.doesNotMatch(injected, /COMBO|CRAVING/, 'both can be switched off');
});

test('strength shows in the line itself, and feelings come strongest first', () => {
    const p = composePrompt(freshState({ moods: { happy: 25, angry: 95, jealous: 70, sad: 5 } }), 'Rick');
    const all = p.split('\n'), start = all.indexOf('Feelings, strongest first:'), lines = all.slice(start), at = id => lines.findIndex(l => l.includes(id));
    assert.ok(start >= 0);
    assert.ok(at('overwhelming: ') < at('strong: jealous') && at('strong: jealous') < at('mild: ') && at('mild: ') < at('faint: '));
    assert.match(p, /(takes over their voice and the main action)/);
    assert.match(p, /strong: jealous[^\n]*\(shows several times and decides a choice\)/);
    assert.match(p, /faint: [^\n]*\(a flicker at most\)/);
    assert.doesNotMatch(p, /mild: [^\n]*\(/, 'mild and clear need no reminder');
});
