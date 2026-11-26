// Dice checks, a little like D&D: before each reply Moodweaver rolls a d20 for the skills the scene is calling
// on and adds the skill's level (\u221210 to +10) as the modifier. Claude is told the outcome in advance ("if she lies
// this reply, it fails: he sees through it"), so success and failure come from the dice and the levels, not
// from what the story would like. Contests pit one person's skill against the other's (a lie against reading
// people, sneaking against watching, a hold against slipping free); everything else is a plain check against 12.
// The seed is new for every reply, swipe and regenerate (a random salt from main.js, 1.96.3), so a re-roll really
// rolls again; it holds while one reply is written and through a continue. When the player's character loses a reading check, the narration has to hide the truth
// from the player too. Pure functions.
const d20 = (seed, key) => {
    let h = 2166136261 ^ seed;
    for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (Math.abs(h) % 20) + 1;
};
// Skill steadies the dice (1.96.3): from level 4 a person rolls twice and keeps the better, from 8 three times; from
// -4 they keep the worse of two, from -8 the worst of three. So the better someone is, the more often they succeed
// and the less luck matters (a natural 1 almost never comes up for an expert); the worse, the more it goes wrong.
const DICE = level => level >= 8 ? 3 : level >= 4 ? 2 : level <= -8 ? -3 : level <= -4 ? -2 : 1;
const roll = (seed, key, level) => {
    const n = DICE(level), all = Array.from({ length: Math.abs(n) }, (_, i) => d20(seed, i ? `${key}#${i}` : key));
    return n < 0 ? Math.min(...all) : Math.max(...all);
};
// attacker skills \u2192 the skills that resist them, and how each outcome reads. {a} attacker, {d} defender.
const CONTESTS = [
    { att: ['lying', 'con_artistry', 'masking_emotions', 'manipulation', 'gaslighting', 'disguise', 'forgery', 'faking_it', 'playing_victim', 'love_bombing', 'appearances'], def: ['reading_people', 'psychology', 'psychiatry', 'intuition', 'interrogation'],
        moods: ['lying', 'compulsive_liar', 'two_faced', 'manipulative', 'manipulator', 'secretive', 'scheming', 'gaslighting', 'poker_face', 'masking_amusement', 'masking_warmth', 'masking_coldness', 'masking_emotive', 'masking_less_emotive', 'hiding_arousal', 'hiding_fear', 'hidden_heart', 'guarded'],
        verb: 'deceives', win: '{d} believes it', lose: '{d} sees through it, or senses something is off', what: 'deceiving' },
    { att: ['stealth', 'hiding', 'stalking', 'pickpocketing', 'sleight_of_hand', 'drugging'], def: ['surveillance', 'intuition', 'reading_people'],
        verb: 'sneaks or palms something', win: '{d} doesn\u2019t notice', lose: '{d} notices', what: 'sneaking past' },
    { att: ['seduction', 'charm', 'charisma', 'negotiation', 'salesmanship', 'begging', 'courtship', 'guilt_tripping', 'jealousy_games', 'debate'], def: ['reading_people', 'psychology', 'intuition'],
        verb: 'tries to win over or persuade', win: 'it works on {d}', lose: '{d} isn\u2019t moved, and may see the effort', what: 'persuading' },
    { att: ['intimidation', 'interrogation', 'mental_torture', 'terrorising', 'disciplining'], def: ['masking_emotions', 'lying', 'emotional_maturity'],
        verb: 'tries to break or frighten', win: '{d} cracks or gives something away', lose: '{d} holds firm', what: 'pressuring' },
    { att: ['restraining', 'rope_work', 'captivity'], def: ['escape_artistry', 'strength', 'self_defence'],
        verb: 'tries to hold or tie', win: '{d} can\u2019t get free', lose: '{d} slips loose', what: 'holding', oa: '{a} tries to hold or tie', od: '{a} is held by, and tries to get free of,' },
    { att: ['violence', 'knife_fighting', 'swordsmanship', 'ambush', 'strangling', 'blunt_weapons', 'boxing', 'martial_arts'], def: ['self_defence', 'violence', 'fitness', 'boxing', 'martial_arts'],
        verb: 'attacks', win: 'it lands on {d}', lose: '{d} gets clear or turns it', what: 'attacking', oa: '{a} fights', od: '{a} is attacked by' },
    { att: ['bratting'], def: ['brat_taming', 'domination', 'emotional_maturity'],
        verb: 'pushes the buttons of', win: '{d} rises to it, and the provocation gets the reaction it wanted', lose: '{d} stays amused and in control', what: 'provoking' },
];
// Who is doing what (1.96.4). The scene's words call a skill for everyone who has it, so when one person is masking,
// "reading people" lit up for them too. In a contest, the one doing it is the one in a matching mood (masking,
// lying, poker-faced), or else the only one whose attacking skill the scene calls while the other's defending
// skill is called. The doer's defending skills for that contest and the other person's attacking skills come off
// their lit lists, unless both are doing it. Changes the lit lists in place. people: [{ lit, moods }].
export function sideLit(people = []) {
    const [p, q] = people; if (!p || !q) return people;
    for (const c of CONTESTS) {
        const has = (x, ids) => (x.lit ?? []).some(s => ids.includes(s.id)), moody = x => Boolean(c.moods?.some(id => (x.moods?.[id] ?? 0) >= 41));
        let doers = [p, q].filter(moody);
        if (!doers.length) doers = [p, q].filter(x => has(x, c.att) && !has(x === p ? q : p, c.att) && has(x === p ? q : p, c.def));
        if (doers.length !== 1) continue;
        const [doer] = doers, other = doer === p ? q : p;
        doer.lit = (doer.lit ?? []).filter(s => !c.def.includes(s.id) || c.att.includes(s.id));
        other.lit = (other.lit ?? []).filter(s => !c.att.includes(s.id) || c.def.includes(s.id));
    }
    return people;
}
const DC = 12;
const tier = (roll, total, dc) => roll === 1 ? 'botch' : roll === 20 ? 'crit' : total >= dc + 8 ? 'great' : total >= dc ? 'pass' : total <= dc - 8 ? 'bad' : 'fail';
// Each tier has a few ways to say it, picked by the roll, so the same outcome isn't worded the same way every reply.
// They say how well it goes, never exactly how: that is left to the writing.
const PLAIN = {
    botch: ['goes badly wrong, in a way people will remember', 'backfires on them', 'goes wrong and costs them something'],
    bad: ['goes clearly wrong', 'misfires, and it shows', 'goes wrong in a way the other person notices'],
    fail: ['falls short or comes out a little wrong', 'half works, with a catch', 'doesn\u2019t quite land'],
    pass: ['works', 'works, more or less as meant', 'gets there'],
    great: ['works well, better than expected', 'goes smoothly', 'goes better than hoped'],
    crit: ['works brilliantly', 'goes perfectly, with something extra', 'could hardly have gone better'],
};
// Against anyone else (2.0.5). Side characters have no skill lists, and a contest with them used to fall to the plain
// check against 12, so a skilled fighter won every fight and broke every hold. Now it's a contest with an unnamed
// other side: they roll too, with a hidden level that the story's "How much can go wrong" dial raises (edge 0 to 4),
// and the result only says who gets the better of it and how cleanly. Only for the physical contests (holds and
// fights); reading, lying and persuading someone else stay plain checks. Who that other person plainly is (size,
// strength, age, training, experience) is left to Claude to weigh on top. Skill helps less here than in a contest
// with the player's character: at most two dice, so a master still loses now and then.
const OTHER = [[-2, 4], [0, 5], [1, 6], [2, 7], [3, 8]];
const OPEN = {
    crit: ['{a} gets the better of it almost at once'],
    clear: ['{a} clearly has the upper hand, though it still takes effort and they fight it', '{a} comes out well ahead, not untouched'],
    edge: ['{a} gets the better of it, but not cleanly: they resist, counter or cost {a} something', '{a} edges it after a real struggle, and it costs something'],
    close: ['they get the better of it this time, and {a} pays for it', 'it goes their way, and {a} has to give ground'],
    lose: ['it goes badly against {a}', '{a} is clearly outmatched this time'],
};
const openContest = (seed, name, sk, c, side, edge = 1) => {
    const [lo, hi] = OTHER[Math.max(0, Math.min(4, edge))] ?? OTHER[1];
    const lv = lo + (d20(seed, `${name}:${sk.id}:other`) % (hi - lo + 1));
    const ra = roll(seed, `${name}:${sk.id}:open`, Math.max(-7, Math.min(7, sk.level))), rd = roll(seed, `${name}:${sk.id}:them`, lv);
    const m = (ra + sk.level) - (rd + lv);
    const t = ra === 20 && m >= 5 ? 'crit' : ra === 1 ? (m > 0 ? 'close' : 'lose') : m >= 10 ? 'clear' : m > 0 ? 'edge' : m > -7 ? 'close' : 'lose';
    return { win: m > 0, roll: ra, total: ra + sk.level, olevel: lv, oroll: rd,
        text: `If ${(side === 'a' ? c.oa : c.od).replaceAll('{a}', name)} anyone else, ${OPEN[t][ra % OPEN[t].length].replaceAll('{a}', name)}.` };
};
const contestOf = id => CONTESTS.find(c => c.oa && c.att.includes(id)) ?? CONTESTS.find(c => c.oa && c.def.includes(id));
const best = (all, ids) => all.filter(x => ids.includes(x.id)).sort((a, b) => b.level - a.level)[0];
// people: [{ name, all: skillsOf(), lit: litSkills(), moods }]; two people at most are compared (the first two).
// Returns { by, rolls }: sentences for each doer's paragraph, rolls for the panel.
export function checkLines(people = [], seed = 0, { max = 3, player = '', edge = 1 } = {}) {
    const rolls = [], used = new Set();
    const [p, q] = people;
    const pairs = q ? [[p, q], [q, p]] : [];
    for (const c of CONTESTS) for (const [a, d] of pairs) {
        const litA = best(a.lit ?? [], c.att), hasA = best(a.all ?? [], c.att);
        const moody = c.moods && c.moods.some(id => (a.moods?.[id] ?? 0) >= 41);
        const sk = litA ?? (moody ? hasA ?? { id: c.att[0], prompt: c.att[0].replace(/_/g, ' '), level: 0 } : null);
        if (!sk) continue;
        const dk = best(d.all ?? [], c.def) ?? { id: c.def[0], prompt: c.def[0].replace(/_/g, ' '), level: 0 };
        if (!(sk.level || dk.level)) continue;
        const ra = roll(seed, `${a.name}:${sk.id}`, sk.level), rd = roll(seed, `${d.name}:${dk.id}`, dk.level);
        const ta = ra + sk.level, td = rd + dk.level, win = ra === 20 || (ra !== 1 && ta > td);
        used.add(`${a.name}:${sk.id}`);
        rolls.push({ kind: 'contest', a: a.name, d: d.name, skill: sk.prompt ?? sk.id, level: sk.level, roll: ra, total: ta, dskill: dk.prompt ?? dk.id, dlevel: dk.level, droll: rd, dtotal: td, win, what: c.what,
            hide: win && d.name === player && c.what === 'deceiving',
            text: `If ${a.name} ${c.verb} ${d.name} (${sk.prompt ?? sk.id} against ${dk.prompt ?? dk.id}), ${(win ? c.win : c.lose).replaceAll('{d}', d.name).replaceAll('{a}', a.name)}.${c.oa && litA ? ` ${openContest(seed, a.name, sk, c, 'a', edge).text}` : ''}` });
    }
    for (const person of people.slice(0, 2)) for (const sk of person.lit ?? []) {
        if (used.has(`${person.name}:${sk.id}`) || rolls.some(r => r.a === person.name && r.skill === sk.prompt)) continue;
        const c = contestOf(sk.id);
        if (c) {
            const o = openContest(seed, person.name, sk, c, c.att.includes(sk.id) ? 'a' : 'd', edge);
            rolls.push({ kind: 'open', a: person.name, skill: sk.prompt, level: sk.level, roll: o.roll, total: o.total, olevel: o.olevel, oroll: o.oroll, win: o.win, text: o.text });
            continue;
        }
        const r = roll(seed, `${person.name}:${sk.id}`, sk.level), total = r + sk.level, t = tier(r, total, DC);
        rolls.push({ kind: 'check', a: person.name, skill: sk.prompt, level: sk.level, roll: r, total, tier: t,
            text: `If ${person.name} tries ${sk.prompt}, it ${PLAIN[t][r % PLAIN[t].length]}.` });
    }
    // Contests first (they're the ones between the two of you), then the plain checks, worst and best rolls first.
    const order = rolls.sort((x, y) => (x.kind === 'contest' ? 0 : 1) - (y.kind === 'contest' ? 0 : 1) || Math.abs(y.total - DC) - Math.abs(x.total - DC)).slice(0, max);
    if (!order.length) return { by: {}, rolls: [] };
    // 2.0 brief: no numbers in the note (they stay on the panel), each result in the doer's own paragraph.
    const by = {};
    for (const r of order) (by[r.a] ??= []).push(r.text);
    const fooled = order.find(r => r.hide);
    if (fooled) by[fooled.a].push(`If that deception happens, the reader is fooled along with ${player}: it reads as true on the page, with no knowing narration or tells pointed out, and surfaces later only through what happens.`);
    return { by, rolls: order };
}
