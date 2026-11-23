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
const how = level => ({ 3: ', best of 3', 2: ', best of 2', '-2': ', worst of 2', '-3': ', worst of 3' })[DICE(level)] ?? '';
// attacker skills \u2192 the skills that resist them, and how each outcome reads. {a} attacker, {d} defender.
const CONTESTS = [
    { att: ['lying', 'con_artistry', 'masking_emotions', 'manipulation', 'gaslighting', 'disguise', 'forgery', 'faking_it', 'playing_victim', 'love_bombing', 'appearances'], def: ['reading_people', 'psychology', 'psychiatry', 'intuition', 'interrogation'],
        moods: ['lying', 'compulsive_liar', 'two_faced', 'manipulative', 'manipulator', 'secretive', 'scheming', 'gaslighting', 'masking'],
        verb: 'deceives', win: '{d} believes it', lose: '{d} sees through it, or senses something is off', what: 'deceiving' },
    { att: ['stealth', 'hiding', 'stalking', 'pickpocketing', 'sleight_of_hand', 'drugging'], def: ['surveillance', 'intuition', 'reading_people'],
        verb: 'sneaks or palms something', win: '{d} doesn\u2019t notice', lose: '{d} notices', what: 'sneaking past' },
    { att: ['seduction', 'charm', 'charisma', 'negotiation', 'salesmanship', 'begging', 'courtship', 'guilt_tripping', 'jealousy_games', 'debate'], def: ['reading_people', 'psychology', 'intuition'],
        verb: 'tries to win over or persuade', win: 'it works on {d}', lose: '{d} isn\u2019t moved, and may see the effort', what: 'persuading' },
    { att: ['intimidation', 'interrogation', 'mental_torture', 'terrorising', 'disciplining'], def: ['masking_emotions', 'lying', 'emotional_maturity'],
        verb: 'tries to break or frighten', win: '{d} cracks or gives something away', lose: '{d} holds firm', what: 'pressuring' },
    { att: ['restraining', 'rope_work', 'captivity'], def: ['escape_artistry', 'strength', 'self_defence'],
        verb: 'tries to hold or tie', win: '{d} can\u2019t get free', lose: '{d} slips loose', what: 'holding' },
    { att: ['violence', 'knife_fighting', 'swordsmanship', 'ambush', 'strangling', 'blunt_weapons', 'boxing', 'martial_arts'], def: ['self_defence', 'violence', 'fitness', 'boxing', 'martial_arts'],
        verb: 'attacks', win: 'it lands on {d}', lose: '{d} gets clear or turns it', what: 'attacking' },
    { att: ['bratting'], def: ['brat_taming', 'domination', 'emotional_maturity'],
        verb: 'pushes the buttons of', win: '{d} rises to it, and the provocation gets the reaction it wanted', lose: '{d} stays amused and in control', what: 'provoking' },
];
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
const best = (all, ids) => all.filter(x => ids.includes(x.id)).sort((a, b) => b.level - a.level)[0];
// people: [{ name, all: skillsOf(), lit: litSkills(), moods }]; two people at most are compared (the first two).
// Returns { lines, rolls }: lines for the note, rolls for the panel.
export function checkLines(people = [], seed = 0, { max = 3, player = '' } = {}) {
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
            text: `If ${a.name} ${c.verb} ${d.name} this reply: ${a.name} rolls ${ta} (${ra}${sk.level < 0 ? '' : '+'}${sk.level} ${sk.prompt ?? sk.id}${how(sk.level)}) against ${d.name}'s ${td} (${rd}${dk.level < 0 ? '' : '+'}${dk.level} ${dk.prompt ?? dk.id}${how(dk.level)}), so ${(win ? c.win : c.lose).replaceAll('{d}', d.name).replaceAll('{a}', a.name)}.` });
    }
    for (const person of people.slice(0, 2)) for (const sk of person.lit ?? []) {
        if (used.has(`${person.name}:${sk.id}`) || rolls.some(r => r.a === person.name && r.skill === sk.prompt)) continue;
        const r = roll(seed, `${person.name}:${sk.id}`, sk.level), total = r + sk.level, t = tier(r, total, DC);
        rolls.push({ kind: 'check', a: person.name, skill: sk.prompt, level: sk.level, roll: r, total, tier: t,
            text: `If ${person.name} tries ${sk.prompt} this reply, it ${PLAIN[t][r % PLAIN[t].length]} (rolled ${total}: ${r}${sk.level < 0 ? '' : '+'}${sk.level}${how(sk.level)}, needs ${DC}).` });
    }
    // Contests first (they're the ones between the two of you), then the plain checks, worst and best rolls first.
    const order = rolls.sort((x, y) => (x.kind === 'contest' ? 0 : 1) - (y.kind === 'contest' ? 0 : 1) || Math.abs(y.total - DC) - Math.abs(x.total - DC)).slice(0, max);
    if (!order.length) return { lines: [], rolls: [] };
    const lines = ['Dice for this reply (rolled before writing; only use one if that action happens, and play the result faithfully, a failure included). The dice say how well, not how: the details are yours, fresh each time and in character.', ...order.map(r => `- ${r.text}`)];
    const fooled = order.find(r => r.hide);
    if (fooled) lines.push(`- If ${fooled.a}'s deception does happen, the reader must be fooled along with ${player}: write it so it reads as true on the page, with no knowing narration, hints or tells pointed out. Let it surface later only through what happens.`);
    return { lines, rolls: order };
}
