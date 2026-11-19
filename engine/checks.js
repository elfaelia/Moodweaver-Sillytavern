// Dice checks, a little like D&D: before each reply Moodweaver rolls a d20 for the skills the scene is calling
// on and adds the skill's level (−10 to +10) as the modifier. Claude is told the outcome in advance ("if she lies
// this reply, it fails: he sees through it"), so success and failure come from the dice and the levels, not
// from what the story would like. Contests pit one person's skill against the other's (a lie against reading
// people, sneaking against watching, a hold against slipping free); everything else is a plain check against 12.
// The roll is seeded by the reply number, so a swipe gets the same roll (no rerolling a bad result) and the next
// reply rolls fresh. When the player's character loses a reading check, the narration has to hide the truth
// from the player too. Pure functions.
const d20 = (seed, key) => {
    let h = 2166136261 ^ seed;
    for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (Math.abs(h) % 20) + 1;
};
// attacker skills → the skills that resist them, and how each outcome reads. {a} attacker, {d} defender.
const CONTESTS = [
    { att: ['lying', 'con_artistry', 'masking_emotions', 'manipulation', 'gaslighting', 'disguise', 'forgery'], def: ['reading_people', 'psychology', 'psychiatry', 'intuition', 'interrogation'],
        moods: ['lying', 'compulsive_liar', 'two_faced', 'manipulative', 'manipulator', 'secretive', 'scheming', 'gaslighting', 'masking'],
        verb: 'deceives', win: '{d} believes it', lose: '{d} sees through it, or senses something is off', what: 'deceiving' },
    { att: ['stealth', 'hiding', 'stalking', 'pickpocketing', 'sleight_of_hand'], def: ['surveillance', 'intuition', 'reading_people'],
        verb: 'sneaks or palms something', win: '{d} doesn’t notice', lose: '{d} notices', what: 'sneaking past' },
    { att: ['seduction', 'charm', 'charisma', 'negotiation', 'salesmanship', 'begging', 'courtship'], def: ['reading_people', 'psychology', 'intuition'],
        verb: 'tries to win over or persuade', win: 'it works on {d}', lose: '{d} isn’t moved, and may see the effort', what: 'persuading' },
    { att: ['intimidation', 'interrogation', 'mental_torture'], def: ['masking_emotions', 'lying', 'emotional_maturity'],
        verb: 'tries to break or frighten', win: '{d} cracks or gives something away', lose: '{d} holds firm', what: 'pressuring' },
    { att: ['restraining', 'rope_work'], def: ['escape_artistry', 'strength', 'self_defence'],
        verb: 'tries to hold or tie', win: '{d} can’t get free', lose: '{d} slips loose', what: 'holding' },
    { att: ['violence', 'knife_fighting', 'swordsmanship', 'ambush'], def: ['self_defence', 'violence', 'fitness'],
        verb: 'attacks', win: 'it lands on {d}', lose: '{d} gets clear or turns it', what: 'attacking' },
];
const DC = 12;
const tier = (roll, total, dc) => roll === 1 ? 'botch' : roll === 20 ? 'crit' : total >= dc + 8 ? 'great' : total >= dc ? 'pass' : total <= dc - 8 ? 'bad' : 'fail';
const PLAIN = {
    botch: 'goes badly wrong, in a way people will remember',
    bad: 'goes clearly wrong',
    fail: 'falls short or comes out a little wrong',
    pass: 'works',
    great: 'works well, better than expected',
    crit: 'works brilliantly',
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
        const ra = d20(seed, `${a.name}:${sk.id}`), rd = d20(seed, `${d.name}:${dk.id}`);
        const ta = ra + sk.level, td = rd + dk.level, win = ra === 20 || (ra !== 1 && ta > td);
        used.add(`${a.name}:${sk.id}`);
        rolls.push({ kind: 'contest', a: a.name, d: d.name, skill: sk.prompt ?? sk.id, level: sk.level, roll: ra, total: ta, dskill: dk.prompt ?? dk.id, dlevel: dk.level, droll: rd, dtotal: td, win, what: c.what,
            hide: win && d.name === player && c.what === 'deceiving',
            text: `If ${a.name} ${c.verb} ${d.name} this reply: ${a.name} rolls ${ta} (${ra}${sk.level < 0 ? '' : '+'}${sk.level} ${sk.prompt ?? sk.id}) against ${d.name}'s ${td} (${rd}${dk.level < 0 ? '' : '+'}${dk.level} ${dk.prompt ?? dk.id}), so ${(win ? c.win : c.lose).replaceAll('{d}', d.name).replaceAll('{a}', a.name)}.` });
    }
    for (const person of people.slice(0, 2)) for (const sk of person.lit ?? []) {
        if (used.has(`${person.name}:${sk.id}`) || rolls.some(r => r.a === person.name && r.skill === sk.prompt)) continue;
        const r = d20(seed, `${person.name}:${sk.id}`), total = r + sk.level, t = tier(r, total, DC);
        rolls.push({ kind: 'check', a: person.name, skill: sk.prompt, level: sk.level, roll: r, total, tier: t,
            text: `If ${person.name} tries ${sk.prompt} this reply, it ${PLAIN[t]} (rolled ${total}: ${r}${sk.level < 0 ? '' : '+'}${sk.level}, needs ${DC}).` });
    }
    // Contests first (they're the ones between the two of you), then the plain checks, worst and best rolls first.
    const order = rolls.sort((x, y) => (x.kind === 'contest' ? 0 : 1) - (y.kind === 'contest' ? 0 : 1) || Math.abs(y.total - DC) - Math.abs(x.total - DC)).slice(0, max);
    if (!order.length) return { lines: [], rolls: [] };
    const lines = ['Dice for this reply (rolled before writing; only use one if that action happens, and play the result faithfully, a failure included):', ...order.map(r => `- ${r.text}`)];
    const fooled = order.find(r => r.hide);
    if (fooled) lines.push(`- If ${fooled.a}'s deception does happen, the reader must be fooled along with ${player}: write it so it reads as true on the page, with no knowing narration, hints or tells pointed out. Let it surface later only through what happens.`);
    return { lines, rolls: order };
}
