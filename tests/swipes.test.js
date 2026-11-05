// 1.36.0: swipes, regenerations, deletions and old saves. Each test drives the real index.js against a
// simulated SillyTavern chat, including how 1.19 holds the old swipe's text while a new one is written.
import test from 'node:test';
import assert from 'node:assert/strict';

let context, injected, writes;
globalThis.jQuery = () => {};
globalThis.SillyTavern = { getContext: () => context };
const mw = await import('../index.js');
const { settle, track, untrack, effectiveChat } = await import('../ledger.js');
const { computeBond } = await import('../bond.js');

let clock = Date.parse('2026-11-05T20:00:00.000Z');
const stamp = () => new Date(clock += 61000).toISOString();
const board = (time, activity, outfit, state = 'watchful') => `<div class="ihyll-style">
📅 <b>Date:</b> Sunday, March 27, 1960 | Spring | ☀️ | Forecast: 12°C (54°F)<br>
🕒 <b>Time:</b> ${time}<br>
🗺️ <b>Location:</b> Ward B | <b>Present:</b> Lamb | <b>Activity:</b> ${activity}<br>
👔 <b> Doctor Easterman’s Outfit:</b> ${outfit}<br>
👗 <b>Lamb’s Outfit:</b> ward gown<br>
🧠 <b>State:</b> ${state}<br>
💎 <b>Physical State:</b> damp hair
</div>`;
const text = (time, activity, outfit, weave) => `${board(time, activity, outfit)}\n\nHe waits.\n\n<!-- weave: ${weave} -->`;
function reply(time, activity, outfit, weave) {
    const mes = text(time, activity, outfit, weave), send_date = stamp();
    return { name: 'Doctor Easterman', is_user: false, mes, send_date, swipe_id: 0, swipes: [mes], swipe_info: [{ send_date }] };
}
const user = mes => ({ name: 'Lamb', is_user: true, mes, send_date: stamp() });
// SillyTavern's swipe right: the slot moves on and the old text stays until the new one streams in.
const startSwipe = m => { m.swipe_id = m.swipes.length; };
function finishSwipe(m, mes) { const send_date = stamp(); m.swipes.push(mes); m.swipe_info.push({ send_date }); m.swipe_id = m.swipes.length - 1; m.mes = mes; m.send_date = send_date; }
function swipeTo(m, id) { m.swipe_id = id; m.mes = m.swipes[id]; m.send_date = m.swipe_info[id].send_date; }
function reset(chat = []) {
    injected = ''; writes = 0; mw.stopGenerating();
    context = {
        characterId: 0, characters: [{ avatar: 'easterman.png', name: 'Doctor Easterman' }], name1: 'Lamb',
        // These tests cover memories and board corrections, which are opt-in since 1.38.
        chatId: `chat-${Math.random()}`, chatMetadata: {}, extensionSettings: { moodweaver: { boardMemories: true, boardPins: true } }, chat,
        setExtensionPrompt: (_key, value) => { injected = value; writes++; },
        getTokenCountAsync: async t => Math.ceil(t.length / 4), saveMetadata: async () => {}, saveSettingsDebounced: () => {},
    };
}
const st = () => mw.getState();
const memories = () => context.chatMetadata.moodweaver.pairs?.['char:easterman.png|user']?.memories ?? [];
const romance = () => computeBond(mw.bondData(context.characters[0]), Infinity, 'E', 'L', null, mw.bondList(context.characters[0])).r;
// One reply arriving, the way SillyTavern hands it over.
async function arrive(...messages) { context.chat.push(...messages); mw.reconcile(); }
const generate = async type => { await globalThis.moodweaverBeforeGeneration(effectiveChat(context.chat, type).map(m => ({ ...m })), 8000, () => {}, type); mw.stopGenerating(); };

test('ledger: a run of replies at the end is undone newest first; one missing from the middle is only forgotten', () => {
    const v = { a: 10 }, t = { get: i => v[i] ?? 0, set: (i, x) => { v[i] = x; }, pinned: () => false };
    const r1 = { k: '1', m: track(t, [{ name: 'a', delta: 10 }], n => n) }, r2 = { k: '2', m: track(t, [{ name: 'a', delta: 5 }], n => n) }, r3 = { k: '3', m: track(t, [{ name: 'a', delta: -7 }], n => n) };
    assert.equal(v.a, 18);
    let out = settle([r1, r2, r3], k => k === '1', rec => untrack(t, rec.m));
    assert.equal(v.a, 20); assert.equal(out.undone, 2); assert.deepEqual(out.kept.map(r => r.k), ['1']);
    out = settle([r1, r2], k => k === '2', rec => untrack(t, rec.m)); assert.equal(out.undone, 0); assert.equal(out.forgot, 1);
    // A value the player moved since is theirs.
    const w = { a: 0 }, u = { get: i => w[i] ?? 0, set: (i, x) => { w[i] = x; }, pinned: () => false };
    const rec = track(u, [{ name: 'a', delta: 30 }], n => n); w.a = 70; untrack(u, rec); assert.equal(w.a, 70);
});

test('a swipe in progress: nothing the replaced reply did reaches the new one, and swiping back restores it', async () => {
    reset([user('She calls for him.')]);
    await arrive(reply('9:30 AM', 'in the bath', 'nothing, in the bath', 'moods calm +20'));
    await arrive(user('Lamb screams in the hall.'), reply('9:52 AM', 'on the floor with Lamb in his lap', 'dressing gown', 'moods afraid +30 | romance +4 | remember: Lamb screamed in the hallway'));
    const r2 = context.chat[3];
    assert.equal(st().moods.afraid, 30); assert.equal(st().moods.calm, 20); assert.equal(memories().length, 1); assert.equal(romance(), 4);
    startSwipe(r2);
    await generate('swipe');
    assert.equal(st().moods.afraid, 0, 'the swiped reply\'s feeling is taken back'); assert.equal(st().moods.calm, 20);
    assert.equal(memories().length, 0, 'its memory is gone'); assert.equal(romance(), 0, 'its meter step is gone');
    assert.doesNotMatch(injected, /dressing gown|on the floor/); assert.match(injected, /in the bath/);
    assert.match(injected, /Where the chat shows something different, the chat is right/);
    finishSwipe(r2, text('9:41 AM', 'in the corridor', 'white shirt and suspenders', 'moods afraid +10 | romance +1'));
    mw.reconcile();
    assert.equal(st().moods.afraid, 10); assert.equal(romance(), 1); assert.equal(memories().length, 0);
    swipeTo(r2, 0); mw.reconcile();
    assert.equal(st().moods.afraid, 30); assert.equal(romance(), 4); assert.equal(memories().length, 1);
});

test('regenerate, and deleting several replies, undo each of them; deleting an old message undoes nothing', async () => {
    reset([user('Hello.')]);
    await arrive(reply('1:00 PM', 'reading', 'suit', 'moods calm +20'));
    await arrive(user('Again.'), reply('1:05 PM', 'pacing', 'suit', 'moods afraid +30'));
    await arrive(user('More.'), reply('1:10 PM', 'shouting', 'suit', 'moods angry +25 | remember: he broke the vase'));
    assert.deepEqual([st().moods.calm, st().moods.afraid, st().moods.angry], [20, 30, 25]);
    // Regenerate: SillyTavern deletes the reply, then the interceptor runs straight away.
    context.chat.pop(); await generate('regenerate');
    assert.equal(st().moods.angry, 0); assert.equal(memories().length, 0);
    assert.doesNotMatch(injected, /shouting/);
    // Two more gone: both undone, not just the newest.
    context.chat.splice(-3); mw.reconcile();
    assert.deepEqual([st().moods.calm, st().moods.afraid], [20, 0]);
    // Deleting an old message from the middle leaves the newest reply's changes alone.
    reset([user('Hello.')]);
    await arrive(reply('1:00 PM', 'reading', 'suit', 'moods calm +20'));
    await arrive(user('Again.'), reply('1:05 PM', 'pacing', 'suit', 'moods afraid +30 | romance +3'));
    context.chat.splice(0, 1); mw.reconcile();
    assert.deepEqual([st().moods.calm, st().moods.afraid], [20, 30]); assert.equal(romance(), 3);
    // A feeling you moved by hand stays yours when its reply goes.
    st().moods.afraid = 70; context.chat.splice(-1); mw.reconcile(); assert.equal(st().moods.afraid, 70);
});

test('a redraw that lands while the reply is being prepared cannot replace its note', async () => {
    reset([user('Hi.')]);
    await arrive(reply('9:30 AM', 'in the bath', 'nothing', 'moods calm +20'), user('Help!'), reply('9:52 AM', 'on the floor', 'dressing gown', 'moods afraid +30'));
    startSwipe(context.chat[3]);
    let release; context.getTokenCountAsync = t => new Promise(r => { release = () => r(Math.ceil(t.length / 4)); });
    const run = globalThis.moodweaverBeforeGeneration(effectiveChat(context.chat, 'swipe'), 8000, () => {}, 'swipe');
    await new Promise(r => setTimeout(r, 0));
    const before = writes; await Promise.race([mw.syncPrompt(), new Promise(r => setTimeout(r, 20))]);
    assert.equal(writes, before, 'the background redraw waits');
    release(); await run;
    assert.match(injected, /in the bath/); assert.doesNotMatch(injected, /dressing gown/);
    context.getTokenCountAsync = async t => Math.ceil(t.length / 4);
    mw.stopGenerating(); await new Promise(r => setTimeout(r, 0));
});

test('a board correction goes to the next reply and its swipes, then lets go', async () => {
    reset([user('Hi.')]);
    await arrive(reply('9:30 AM', 'in the bath', 'nothing', 'moods calm +20'));
    const meta = context.chatMetadata.moodweaver, found = { key: '', index: 1 };
    const { latestBoard } = await import('../board.js');
    Object.assign(found, latestBoard(context.chat));
    meta.board.fix = { charOutfit: { text: 'dressing gown', on: found.key, pos: found.index } };
    await generate('normal'); assert.match(injected, /The player corrected the last board[\s\S]*dressing gown/);
    await arrive(user('Next.'), reply('9:40 AM', 'drying off', 'dressing gown', 'moods calm +5'));
    await generate('normal'); assert.doesNotMatch(injected, /The player corrected/);
    startSwipe(context.chat[3]); await generate('swipe'); assert.match(injected, /The player corrected the last board[\s\S]*dressing gown/);
});

test('a continued reply keeps both weave lines', async () => {
    reset([user('Hi.')]);
    await arrive(reply('9:30 AM', 'in the bath', 'nothing', 'moods calm +20 | romance +2'));
    const r = context.chat[1]; r.mes += ' He stands. <!-- weave: moods relieved +15 | romance +1 -->'; r.swipes[0] = r.mes;
    mw.reconcile();
    assert.equal(st().moods.calm, 20); assert.equal(st().moods.relieved, 15); assert.equal(romance(), 3);
    // Moved by hand, then continued again: your value isn't bumped a second time.
    st().moods.calm = 50; r.mes += ' <!-- weave: moods tired +10 -->'; r.swipes[0] = r.mes; mw.reconcile();
    assert.equal(st().moods.calm, 50); assert.equal(st().moods.relieved, 15); assert.equal(st().moods.tired, 10);
});

test('meters fill and drain like a bar, and a dragged value survives swiping the reply it was set on', async () => {
    const { setMeter } = await import('../bond.js');
    reset([user('Hi.')]);
    const lines = Array.from({ length: 12 }, () => 'romance +10');
    for (const w of lines) await arrive(reply('9:30 AM', 'x', 'y', w), user('…'));
    assert.equal(romance(), 100);
    await arrive(reply('9:31 AM', 'x', 'y', 'romance -10'));
    assert.equal(romance(), 90, 'a full meter drops straight away instead of burning off banked points');
    const ch = context.characters[0], bond = mw.bondData(ch);
    setMeter(bond, 'r', 40, mw.bondList(ch)); assert.equal(romance(), 40);
    startSwipe(context.chat.at(-1)); mw.reconcile(); assert.equal(romance(), 40);
    finishSwipe(context.chat.at(-1), text('9:32 AM', 'x', 'y', 'romance +3')); mw.reconcile(); assert.equal(romance(), 43);
});

test('old saves move over: stale memories and needs go, pins become corrections, meters keep their value, and swiping then undoes exactly', async () => {
    const chat = [user('Hi.'), reply('9:30 AM', 'in the bath', 'nothing', 'moods calm +20 | romance +2'), user('Help!'),
        reply('9:52 AM', 'on the floor with Lamb in his lap', 'dressing gown', 'moods afraid +30 | romance +4 | remember: Lamb screamed in the hallway')];
    reset(chat);
    const { freshState } = await import('../core.js');
    context.chatMetadata.moodweaver = { version: 1,
        characters: { 'char:easterman.png': freshState({ moods: { calm: 20, afraid: 30 } }) },
        weave: { 'char:easterman.png': { auto: {}, moods: { index: 3, sig: JSON.stringify([{ name: 'afraid', delta: 30 }]), before: { afraid: 0 }, after: { afraid: 30 } } } },
        bond: { 'char:easterman.png': { base: { r: 10 }, steps: { 1: { r: 2 }, 3: { r: 4 }, 7: { r: 5 } } } },
        board: { pins: { charOutfit: 'dressing gown' }, needSteps: { 3: { hunger: 10 }, 9: { energy: 10 } }, syncedKey: 'old' },
        pairs: { 'char:easterman.png|user': { members: ['char:easterman.png', 'user'], labels: {}, enabled: true, moods: {}, memories: [
            { id: 'm1', text: 'Lamb screamed in the hallway', boardText: 'Lamb screamed in the hallway', value: 55, who: 'both', boardIndex: 3 },
            { id: 'm2', text: 'he kissed her in the lab', boardText: 'he kissed her in the lab', value: 55, who: 'both', boardIndex: 5 },
            { id: 'm3', text: 'they met in 1959', value: 70, who: 'both' }] } },
    };
    const out = mw.reconcile();
    const meta = context.chatMetadata.moodweaver;
    assert.equal(meta.ledger, 2); assert.match(out.notes.join(' '), /Updated this chat for 1\.36/);
    assert.deepEqual(memories().map(m => m.id), ['m1', 'm3'], 'the memory from a reply that is gone is removed; yours stays');
    assert.equal(meta.board.pins, undefined); assert.equal(meta.board.needSteps, undefined);
    assert.equal(meta.board.fix.charOutfit.text, 'dressing gown'); assert.notEqual(meta.board.fix.charOutfit.on, '?');
    assert.equal(romance(), 16, 'the meter shows what it showed before');
    assert.equal(st().moods.afraid, 30, 'nothing is applied twice');
    startSwipe(chat[3]); await generate('swipe');
    assert.equal(st().moods.afraid, 0); assert.equal(romance(), 12); assert.deepEqual(memories().map(m => m.id), ['m3']);
    assert.match(injected, /dressing gown/, 'the old pin goes out once more as a correction for this swipe');
    finishSwipe(chat[3], text('9:41 AM', 'in the corridor', 'white shirt and suspenders', 'moods afraid +10'));
    mw.reconcile(); await generate('normal');
    assert.doesNotMatch(injected, /The player corrected/, 'and then it lets go');
});

test('without the weave line, a swiped board\'s feelings are taken back too', async () => {
    reset([user('Hi.')]);
    mw.getState(); context.chatMetadata.moodweaver.bond = { 'char:easterman.png': { on: false, v: 2 } };
    const plain = (state, time) => { const mes = `${board(time, 'waiting', 'suit', state)}\n\nHe waits.`, send_date = stamp(); return { name: 'Doctor Easterman', is_user: false, mes, send_date, swipe_id: 0, swipes: [mes], swipe_info: [{ send_date }] }; };
    await arrive(plain('calm', '1:00 PM'));
    await arrive(user('Boo.'), plain('terrified', '1:05 PM'));
    const scared = st().moods.afraid; assert.ok(scared > 40);
    startSwipe(context.chat[3]); mw.reconcile();
    assert.equal(st().moods.afraid, 0);
});

test('hiding a reply is not taking it back', async () => {
    reset([user('Hi.')]);
    await arrive(reply('1:00 PM', 'reading', 'suit', 'moods calm +20 | romance +5'), user('Bye.'));
    context.chat[1].is_system = true; mw.reconcile();
    assert.equal(st().moods.calm, 20); assert.equal(romance(), 5);
});

test('unpin everything clears every kind of pin in the chat and leaves the values where they are', async () => {
    reset([user('Hi.')]);
    await arrive(reply('9:30 AM', 'in the bath', 'nothing', 'moods calm +20 | romance +3'));
    const meta = context.chatMetadata.moodweaver, ch = context.characters[0];
    st().moods.afraid = 40; st().pins.afraid = true; st().pins.sad = true;
    meta.user = (await import('../core.js')).freshState({ moods: { bratty: 60 }, pins: { bratty: true } });
    meta.bond['char:easterman.png'].pins = { r: 70 };
    meta.board.needs = { hunger: 10 }; meta.board.keep = { state: ['jittery'], physical: [] };
    meta.board.fix = { charOutfit: { text: 'dressing gown', on: 'x', pos: 1 } };
    assert.deepEqual(mw.pinCounts(), { sliders: 3, meters: 1, needs: 1, fixes: 1, kept: 1 });
    const done = await mw.clearAllPins();
    assert.match(done, /3 sliders, 1 meter, 1 need you set, 1 board correction, 1 kept board tile/);
    assert.deepEqual(mw.pinCounts(), { sliders: 0, meters: 0, needs: 0, fixes: 0, kept: 0 });
    assert.equal(st().moods.afraid, 40); assert.equal(meta.user.moods.bratty, 60);
    assert.equal(computeBond(mw.bondData(ch), Infinity, 'E', 'L', null, mw.bondList(ch)).r, 70, 'the meter stays where it was pinned');
    await arrive(user('Next.'), reply('9:35 AM', 'drying off', 'robe', 'romance +2 | moods afraid -10'));
    assert.equal(romance(), 72); assert.equal(st().moods.afraid, 30, 'and it can move again');
});
