// Arcs (2.0): a story shape with stages and an end. Off unless the player starts one, or the story clearly begins one
// and the hidden line names it (offered as a chip). A stage moves on only when the hidden line says this reply got
// there ("arc: next"), so pace follows the story; never on a timer. Three replies in a row that turn away from it
// ("arc: away") let it fizzle. When the last stage is passed it lands, leaves one line behind for the story, and
// steps aside. Stages are read back from the chat, so a swipe or a delete takes a step with it.
// Each stage is what being there looks like, in plain words; n and u are filled in with the two names.
export const ARCS = [
    { id: 'slow_burn', label: 'Slow burn', stages: [
        'they notice each other and neither does anything about it',
        'small reasons to be close keep turning up, and both pretend they mean nothing',
        'one of them nearly says it or does it, and pulls back',
        'it can\u2019t be ignored any more and one of them acts on it',
    ], end: 'what was held back for so long finally happened between them' },
    { id: 'corruption', label: 'Slow corruption', stages: [
        'a small favour or a rule bent once, easy to explain away',
        'looking away from something wrong, and keeping quiet about it',
        'taking part, and finding reasons it was fine',
        'doing it without being asked, the old self hard to find',
        'no way back: they are what they were pulled into',
    ], end: 'one of them was pulled all the way into the other\u2019s world' },
    { id: 'obsession', label: 'Obsession deepening', stages: [
        'attention that is a little too close and a little too often',
        'keeping track: where they go, who they see, what they wear',
        'stepping in to manage their life, framed as care',
        'cutting others out, and jealousy that turns to action',
        'nothing of their life is theirs alone any more',
    ], end: 'the obsession took over the other person\u2019s life' },
    { id: 'conditioning', label: 'Conditioning', stages: [
        'routines and small rules set up, each one reasonable on its own',
        'reward for compliance and cold or pain for resistance',
        'doubt in their own memory and judgement, encouraged',
        'they start answering the way they were taught before they think',
        'the new beliefs feel like their own',
    ], end: 'someone was remade into what they were trained to be' },
    { id: 'breaking_point', label: 'Breaking point', stages: [
        'pressure building in small ways that keep being swallowed',
        'cracks showing: a temper, a slip, a night without sleep',
        'something gives way in front of someone',
        'the fallout, and nothing goes back to how it was',
    ], end: 'someone broke, and everyone saw it' },
    { id: 'affair', label: 'Affair coming apart', stages: [
        'the secret is kept, and the risk is part of the thrill',
        'small lies stack up and someone starts to notice',
        'proof is found or a lie collapses',
        'confrontation, and choices about who stays',
    ], end: 'the affair came out and its cost was paid' },
    { id: 'betrayal', label: 'Betrayal building', stages: [
        'trust given, and something quietly held back on one side',
        'a private deal, a hidden loyalty or a lie of omission',
        'the moment it\u2019s used against the one who trusted',
        'it\u2019s found out, and what\u2019s left between them',
    ], end: 'one of them betrayed the other and it can\u2019t be undone' },
    { id: 'redemption', label: 'Redemption', stages: [
        'the harm they did is plain, and so is a reason to change',
        'a first choice against their own habit, at a cost',
        'slipping back, and having to choose again',
        'a real act of repair that costs them something they wanted',
    ], end: 'someone paid for the harm they did and changed for it' },
    { id: 'escape', label: 'Escape', stages: [
        'trapped, and learning the routine and the gaps in it',
        'a plan forms and something is quietly gathered',
        'a first try, a near miss, or someone finds out',
        'the break itself, and what it costs',
    ], end: 'someone got out, or tried and paid for it' },
    { id: 'downward_spiral', label: 'Downward spiral', stages: [
        'a habit that still looks under control',
        'money, sleep and people start to go',
        'a low point that would scare anyone else straight, and doesn\u2019t',
        'rock bottom: what\u2019s left once everything is gone',
    ], end: 'someone hit bottom and the story saw what was left' },
    { id: 'revenge', label: 'Revenge', stages: [
        'the wrong done, and the cold decision to answer it',
        'watching and planning, close to the one who did it',
        'the trap set, and the first piece falls',
        'the reckoning, and what it costs the one taking it',
    ], end: 'the wrong was answered, at a price' },
];
export const ARC_BY_ID = Object.fromEntries(ARCS.map(a => [a.id, a]));
const key = s => String(s ?? '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
// A name from the hidden line ("slow burn", "Slow corruption") to an arc, or null.
export const arcNamed = text => { const t = key(text); if (!t || /^(none|no|next|away)$/.test(t)) return null;
    return ARCS.find(a => key(a.label) === t || t.includes(key(a.label)) || key(a.label).endsWith(t)) ?? null; };

// steps: [{ pos, arc }] where arc is the hidden line's word for each reply after the arc began.
// arc: { id, from, pushed, held }. held is a stage index it can't move past, or null.
export function arcState(arc, steps) {
    const def = ARC_BY_ID[arc?.id]; if (!def) return null;
    let stage = Math.max(0, arc.pushed ?? 0), away = 0;
    for (const s of steps.filter(x => x.pos > (arc.from ?? -1))) {
        const w = key(s.arc);
        if (w === 'next') { away = 0; stage++; if (Number.isInteger(arc.held)) stage = Math.min(stage, arc.held); }
        else if (w === 'away') away++;
        else if (w) away = 0;
    }
    if (Number.isInteger(arc.held)) stage = Math.min(stage, arc.held);
    const last = def.stages.length - 1;
    return { def, stage: Math.min(stage, last + 1), landed: stage > last, fizzled: away >= 3, away, held: Number.isInteger(arc.held) };
}

// The note's arc paragraph, or [] when no arc is running. marks: lines left by arcs that landed.
export function arcLines(now, marks = []) {
    const out = marks.length ? [`Behind them: ${marks.join('; ')}.`] : [];
    if (!now || now.landed || now.fizzled) return out;
    const { def, stage, held } = now, next = def.stages[stage + 1];
    out.push(`The story is in an arc, ${def.label.toLowerCase()} (stage ${stage + 1} of ${def.stages.length}): ${def.stages[stage]}.${held ? ' It stays at this stage for now.'
        : next ? ` Next it would be: ${next}. It moves on only when the story gets there, never forced.` : ' This is its last stage; it ends when the story gets there.'}`);
    return out;
}
