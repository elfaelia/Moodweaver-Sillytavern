// Run with: node tests/meter-words.mjs
// Every star on a meter has its own word (1.91.6), and "Thinks it's mutual" reads old one-sided lines and values
// the right way round.
import { MORE_METERS, moreWord, metersOf, cleanMore, computeMore } from '../engine/meters.js';

let fails = 0;
const check = (ok, what) => { if (!ok) { fails++; console.log(`✕ ${what}`); } };
const ONE = [0, 10, 30, 50, 70, 90], TWO = [-95, -70, -50, -30, 0, 30, 50, 70, 95];
for (const m of MORE_METERS) {
    const words = (m[2] ? TWO : ONE).map(v => moreWord(m[0], v));
    check(new Set(words).size === words.length, `${m[1]}: every star has its own word (${words.join(' / ')})`);
}
check(moreWord('os', 0) === 'thinks it’s one-sided' && moreWord('os', 90) === 'knows it’s mutual', 'Thinks it’s mutual starts one-sided and ends mutual');
check(metersOf('unrequited +5')?.os === -5 && metersOf('mutual +4')?.os === 4, 'old "unrequited" lines count the other way round');
const old = cleanMore({ on: ['os'], pins: { os: 70 }, anchor: { os: 10, key: '', pos: -1 } });
check(old.pins.os === 30 && old.anchor.os === 0 && old.ver === 2, `saved values turn round (pin 70 → ${old.pins.os}, anchor 10 → ${old.anchor.os})`);
check(cleanMore(old).pins.os === 30, 'turned only once');
check(computeMore({ on: ['os'] }, []).values.os === 0, 'a new chat starts at one-sided');
console.log(fails ? `${fails} failed` : `All passed (${MORE_METERS.length} meters).`);
process.exitCode = fails ? 1 : 0;
