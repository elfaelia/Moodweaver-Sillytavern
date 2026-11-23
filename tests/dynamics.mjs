// Run with: node tests/dynamics.mjs
// Plays a long chat through the dynamic: scenes of tenderness, heat, fights, coldness and control, each a few
// replies long, after the meters have filled. The main dynamic must follow the scenes, the one underneath must
// change less often than the main one (it's hidden while it's the same as the main one, so those replies don't count), and an old story call must not hold the dynamic for good.
import { cleanBond, computeBond, dynamicLean } from '../engine/bond.js';

const ON = ['ob', 'po', 'je', 'pr', 'rs', 'vo', 'ca', 'de', 'gu', 'lu', 'ts', 'pa'];
const PH = {
    tender: [{ f: 3, r: 4, t: 2, p: 0, l: 1, m: { ca: 3, pr: 2, de: 1 } }, ['cuddly', 'feels_safe', 'affectionate']],
    heat: [{ f: 1, r: 4, t: 1, p: 2, l: 3, m: { ob: 3, po: 2, lu: 3 } }, ['heated', 'starved_for_them', 'possessive']],
    fight: [{ f: -3, r: -1, t: -5, p: 3, l: -2, m: { po: 3, rs: 3, vo: 3, je: 2 } }, ['seething', 'humiliated_rage', 'jealous']],
    cold: [{ f: -2, r: -2, t: -1, p: 1, l: -3, m: { gu: 3, pa: 3 } }, ['icy_contempt', 'withdrawn', 'guilty']],
};
const SEQ = 'tender:30,heat:30,fight:8,tender:8,cold:8,heat:8,fight:8,tender:8,cold:8'.split(',').map(x => x.split(':')).flatMap(([k, n]) => Array(+n).fill(k));
let fails = 0;
const check = (ok, what) => { if (!ok) { fails++; console.log(`✕ ${what}`); } else console.log(`✓ ${what}`); };
for (const pace of ['slow', 'steady', 'quick']) {
    const bond = cleanBond({ on: true, extra: true, pace, more: { on: ON } }), list = [], main = [], under = [];
    SEQ.forEach((ph, i) => {
        list.push({ pos: i, key: `k${i}`, s: { ...PH[ph][0], thinks: [], sparks: [] } });
        const lean = dynamicLean([Object.fromEntries(PH[ph][1].map(id => [id, 65]))], {}, '', '');
        const b = computeBond(bond, i + 1, 'Easterman', 'Lamb', { f: 0, r: 0, t: 0, p: 0, l: 0, lean }, list);
        main.push(b.dynamic.name); if (b.under) under.push(b.under.name);
    });
    const changes = a => a.slice(1).filter((x, i) => x !== a[i]).length;
    // After the meters fill (reply 60 on), each 8-reply scene should show a dynamic the scene before didn't end on.
    const ends = [], late = main.slice(60);
    for (let k = 0; k < late.length; k += 8) ends.push(late[k + 7]);
    const turned = ends.slice(1).filter((x, i) => x !== ends[i]).length;
    check(turned >= ends.length - 3, `${pace}: the main dynamic follows the scenes after the meters fill (${turned} of ${ends.length - 1} scene changes show)`);
    check(changes(under) < changes(main), `${pace}: the one underneath changes less often than the main one (${changes(under)} vs ${changes(main)})`);
}
{
    const bond = cleanBond({ on: true, extra: true, pace: 'steady', mode: 'story', more: { on: ON } });
    const list = Array.from({ length: 40 }, (_, i) => ({ pos: i, key: `k${i}`, s: { f: 2, r: 3, t: 1, p: 1, l: 0, thinks: [], sparks: [], dy: i === 2 ? 'Enemies to lovers' : '' } }));
    const b = computeBond(bond, 99, 'E', 'L', null, list);
    check(b.source === 'meters', `an old story call wears off (now from ${b.source}: ${b.dynamic.name})`);
}
{
    // 1.91.6: a close old friendship early in a chat (low meters, no drop) never has "Fading out" or "Drifting apart"
    // underneath; a real drop over the last dozen replies still can.
    const ON2 = ['hi', 'ly', 'op'];
    const bond = cleanBond({ on: true, extra: true, pace: 'steady', more: { on: ON2, val: { hi: 70 } } });
    const warm = Array.from({ length: 6 }, (_, i) => ({ pos: i, key: `w${i}`, s: { f: 2, r: 0, t: 1, p: 0, l: 0, m: { ly: 1 }, thinks: [], sparks: [] } }));
    const lean = dynamicLean([{ affectionate: 65, feels_safe: 65 }], { childhood_friends: 70 }, '', '');
    const early = computeBond(bond, 7, 'Kenny', 'Ellie', { f: 0, r: 0, t: 0, p: 0, l: 0, lean }, warm);
    check(!['Fading out', 'Drifting apart'].includes(early.under?.name ?? early.underRaw?.name), `early friendship isn't read as fading (main ${early.dynamic.name}, under ${early.under?.name ?? 'none'})`);
    const cool = Array.from({ length: 14 }, (_, i) => ({ pos: i, key: `c${i}`, s: { f: i < 4 ? 6 : -3, r: 0, t: 0, p: 0, l: 0, m: { ly: i < 4 ? 2 : -2, op: -3 }, thinks: [], sparks: [] } }));
    const later = computeBond(bond, 15, 'Kenny', 'Ellie', { f: 0, r: 0, t: 0, p: 0, l: 0, lean: null }, cool);
    check(later.scene.fall >= 8, `a real drop is measured (fall ${later.scene.fall}, under ${later.underRaw?.name ?? 'none'})`);
}
console.log(fails ? `${fails} failed` : 'All passed.');
process.exitCode = fails ? 1 : 0;
