// 1.43.0: one idea, one line. The same thing can be switched on in several places at once (an Obsession
// meter, "obsessed with Lamb" on his side, Obsessive love both ways, the Obsessed dynamic). The note sends it
// once, from the most specific place that's actually being sent, and the Bonds tab shows what's doubled up
// so it can be tidied with one tap. Pure data and one function; index.js applies it.
// Order of what's kept: a meter that's saying something, then the dynamic, then his one-way slider, then a
// both-ways tag, then a story trope. Meters and the dynamic are never dropped; moodlets are only pointed out,
// because a moodlet can be about anyone.
export const CONCEPTS = [
    { key: 'obsession', label: 'Obsession', meter: 'ob', rel: ['obsessed', 'cant_let_go'], shared: ['obsessive_love'], dyn: ['Obsessed', 'Shrine', 'Fixated captor', 'Obsessive tenderness', 'Toxic obsession', 'Collector', 'Insatiable', 'Addicted', 'Stalker’s courtship'], mood: ['obsessed'] },
    { key: 'possessive', label: 'Possessiveness', meter: 'po', rel: ['possessive', 'theyre_mine', 'wants_to_own'], shared: ['mutually_possessive'], dyn: ['Claimed', 'Possession', 'Possessive worship', 'Owned', 'Trophy', 'Closing the circle', 'Saved and kept'], mood: ['possessive'] },
    { key: 'jealousy', label: 'Jealousy', meter: 'je', rel: ['jealous'], shared: ['jealousy_games'], story: ['jealousy_plot'], dyn: ['Jealous storm', 'Jealous devotion'], mood: ['jealous'] },
    { key: 'protective', label: 'Protectiveness', meter: 'pr', rel: ['protects', 'would_die_for'], shared: ['who_did_this', 'touch_and_die'], dyn: ['Protector', 'Protective love', 'For your own good', 'Guardian'], mood: ['protective'] },
    { key: 'guilt', label: 'Guilt', meter: 'gu', rel: ['guilty_toward'], story: ['tends_what_they_broke'], dyn: ['Penitent', 'Guilty captor', 'Guilty love'], mood: ['guilty'] },
    { key: 'dependence', label: 'Dependence', meter: 'de', rel: ['depends', 'cant_live_without'], shared: ['codependent_pair'], dyn: ['Codependent', 'Codependent spiral', 'Lifeline', 'Addicted', 'Trauma bond', 'Borrowed time'], mood: ['codependent'] },
    { key: 'care', label: 'Care', meter: 'ca', rel: ['caretaker_of', 'dotes'], dyn: ['Tending', 'Kept and tended', 'Obsessive tenderness', 'Strict and tender', 'Safe harbour', 'Provider and kept', 'Doll and dresser'], mood: ['caretaker'] },
    { key: 'discipline', label: 'Discipline', meter: 'di', shared: ['made_to_need'], dyn: ['Rules and rewards', 'Conditioning captor', 'Breaking in', 'Owned', 'Brat taming', 'Firm hand', 'Love as leverage'] },
    { key: 'lust', label: 'Lust', meter: 'lu', rel: ['lusts_after', 'turned_on_by'], dyn: ['In lust', 'Steamy love', 'Charged', 'Hate-lust', 'Insatiable', 'Tease and denial', 'Rivals in heat'] },
    { key: 'resentment', label: 'Resentment', meter: 'rs', rel: ['resents'], shared: ['bad_blood'], dyn: ['Grudge', 'Resentful devotion', 'Bitter history', 'Can’t quit you', 'Guilt trip'], mood: ['resentful'] },
    { key: 'respect', label: 'Respect', meter: 're', rel: ['respects', 'looks_down'], dyn: ['Grudging respect', 'Contempt'], neg: ['looks_down', 'Contempt'] },
    { key: 'fascination', label: 'Fascination', meter: 'fa', rel: ['fascinated', 'intrigued_by'], dyn: ['Specimen', 'Collector'] },
    { key: 'pedestal', label: 'Pedestal', meter: 'pe', rel: ['idolises'], shared: ['worship_and_ruin'], dyn: ['Worship', 'Shrine', 'Fallen idol'] },
    { key: 'corruption', label: 'Corruption', meter: 'co', rel: ['wants_to_corrupt'], shared: ['corrupting_love'], story: ['corruption_arc'], dyn: ['Corruption', 'Dark mentor', 'Puppet strings', 'Gaslit'] },
    { key: 'hurt', label: 'Urge to hurt', meter: 'hu', rel: ['wants_to_hurt'], dyn: ['Prey', 'Dangerous adoration', 'Breaking in', 'Tender sadist', 'Predatory patience'] },
    { key: 'loyalty', label: 'Loyalty', meter: 'ly', shared: ['ride_or_die'], dyn: ['Ride or die', 'Loyal to the end', 'Loyal love', 'Two against the world', 'Devoted servant'] },
    { key: 'guidance', label: 'Guidance', meter: 'gd', rel: ['mentor', 'teacher_of'], dyn: ['Under their wing', 'Teacher and student', 'Mentor and protégé', 'Dark mentor'] },
    { key: 'volatility', label: 'Volatility', meter: 'vo', shared: ['on_off', 'push_and_pull', 'love_bomb_cycle'], dyn: ['On again, off again', 'Powder keg', 'Push and pull', 'Love-bomb cycle'] },
    { key: 'trust', label: 'Trust', base: 't', rel: ['trusts', 'distrusts', 'suspicious_of'], neg: ['distrusts', 'suspicious_of'] },
    { key: 'captor', label: 'Captor and captive', rel: ['captor_of'], shared: ['captor_captive', 'spoiled_captive', 'gilded_cage', 'stockholm'], story: ['captivity_horror', 'abduction_plot'],
        dyn: ['Captor', 'Gilded cage', 'Captive’s hold', 'Guilty captor', 'Fixated captor', 'Conditioning captor', 'Romantic captor', 'Kept and tended', 'Princess and keeper', 'Breaking in', 'For your own good', 'Stockholm drift', 'Flight risk', 'Captor and captive'] },
];

// sent: { meters: { key: value } for meters on the line that are saying something, base: { t: value } when
// trust is far enough from even to mean something, dynamic: the current dynamic's catalogue name }. rel,
// shared, story, moods: { id: strength } for his side toward you, the two of you both ways, the story and his
// moodlets. Two-way ideas (trust, respect) only merge when they point the same way: "distrusts" next to a
// trusting meter is a contradiction worth keeping, not a repeat. Returns the ideas switched on in two places
// or more: what's kept, what's left out of the note, and moodlets that say the same (pointed out only).
export function findOverlaps({ sent = {}, rel = {}, shared = {}, story = {}, moods = {} }) {
    const on = (obj, ids = []) => ids.filter(id => (obj?.[id] ?? 0) > 0).map(id => ({ id, value: obj[id] })).sort((a, b) => b.value - a.value);
    const out = [];
    for (const c of CONCEPTS) {
        const way = id => (c.neg ?? []).includes(id) ? -1 : 1;
        const mv = c.meter ? sent.meters?.[c.meter] : c.base ? sent.base?.[c.base] : undefined;
        const meter = Number.isFinite(mv) ? [{ kind: c.meter ? 'meter' : 'base', id: c.meter ?? c.base, way: Math.sign(mv) || 1 }] : [];
        const dyn = sent.dynamic && (c.dyn ?? []).includes(sent.dynamic) ? [{ kind: 'dynamic', id: sent.dynamic, way: way(sent.dynamic) }] : [];
        const droppable = [...on(rel, c.rel).map(x => ({ kind: 'rel', ...x })), ...on(shared, c.shared).map(x => ({ kind: 'shared', ...x })), ...on(story, c.story).map(x => ({ kind: 'story', ...x }))].map(x => ({ ...x, way: way(x.id) }));
        const first = [...meter, ...dyn, ...droppable][0];
        if (!first) continue;
        // Only what points the same way as the strongest source counts as the same idea.
        const all = [...meter, ...dyn, ...droppable].filter(x => x.way === first.way);
        const also = first.way > 0 ? on(moods, c.mood).map(x => ({ kind: 'mood', ...x })) : [];
        if (all.length < 2 && !also.length) continue;
        const keep = all[0], drop = all.filter(x => x !== keep && ['rel', 'shared', 'story'].includes(x.kind));
        out.push({ key: c.key, label: c.label, keep, drop, both: all.filter(x => x !== keep && !drop.includes(x)), also });
    }
    return out;
}
// Everything left out of the note, by where it lives.
export function droppedIds(overlaps) {
    const ids = { rel: new Set(), shared: new Set(), story: new Set() };
    for (const o of overlaps) for (const x of o.drop) ids[x.kind]?.add(x.id);
    return ids;
}
