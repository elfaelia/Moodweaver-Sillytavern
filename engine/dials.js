// The story's dials (2.0): one tap each for how wild the story runs, how much can go wrong, who drives it and how
// it ends up. They replace the Story rows that were really one ladder (Wildcards, Real stakes, No one is safe, The
// world leads, Bad ending and so on), so those rows are gone. Every step but the middle one adds one plain sentence
// to a single "How this story runs" paragraph; the middle step sends nothing.
// A step: [icon, label, what it does (panel), sentence for the note (n = the character, u = the player's)].
const TURNS = { key: 'turns', title: 'How wild the story runs', steps: [
    ['\u263e', 'Calm', 'No sudden twists; things grow slowly out of what is there.', () => 'It grows slowly out of what\u2019s already there, with no outside shocks or sudden turns.'],
    ['\u25d0', 'Steady', 'The story as it comes, nothing added.'],
    ['\u2726', 'Restless', 'Now and then something unexpected.', () => 'Now and then something unplanned happens, grown out of what\u2019s already in the scene.'],
    ['\u26a1\ufe0e', 'Volatile', 'Turns often: reversals, interruptions, impulses.', () => 'It turns often: plans fail, people act on impulse, and things get interrupted or reversed.'],
    ['\u2604\ufe0e', 'Chaos', 'Shocks and reversals, often and hard.', () => 'Nothing stays settled for long. Reversals and shocks come often and hit hard, and each one grows out of who these people are and what has already happened.'],
] };
// The player-writes clause is left out when the drive dial already says it. Harm follows from the cause, never from
// Claude's discretion: handed a choice, Claude picks the kindest outcome.
// 2.0.16: it's about what happens, not how people treat her. Read literally, "wear her down... not mercy" made the
// people who love her the ones doing the wearing down.
const hurt = (u, led) => `Anyone can be badly hurt, ${u} included. When something that happens would injure, sicken or wear ${u} down, it does, as hard as it really would: what was done and where they are decide the damage, not mercy, luck or a softer outcome${led ? '' : `. The player still writes ${u}\u2019s choices`}. Being central to the story protects no one. This is about what happens, not how people treat ${u}: each person still treats ${u} the way their nature and their feelings for ${u} decide.`;
const lead = (n, u) => `${n}, the others and the world make the big moves, and the player only writes ${u}\u2019s words and choices. When something big is coming, it happens in this reply; stop only where the next beat has to be ${u}\u2019s, never on a threshold or a question to ${u}.`;
const ANGST = 'Angst here is about what stays unsaid, not about anyone being unkind. Feelings, motives and secrets stay mostly unsaid. They show in what someone does, avoids or lets slip, never in a speech that explains them, and hinting that there\u2019s something they\u2019ll never tell gives it away just the same. Arguments end unfinished, and nobody turns a fight into a confession. It isn\u2019t a fight every reply: quiet, ordinary moments and care that slips out come between the flare-ups, any distance someone keeps changes with the moment instead of repeating one move, and someone who cares shows it through what they do even while they won\u2019t say it. Outright cruelty is rare.';
export const DIALS = [TURNS,
    { key: 'danger', title: 'How much can go wrong', steps: [
        ['\u2661', 'Safe', 'Fear and setbacks, but nothing lasting or deadly.', () => 'Nobody comes to lasting or deadly harm. Fear, pain and setbacks are fine, and people recover.'],
        ['\u25d0', 'As it comes', 'The story decides; nothing added.'],
        ['\u2736', 'Real stakes', 'Anyone can be hurt, lose or fail.', () => 'Harm, loss and failure are real, and nobody\u2019s protected just because they matter to the story.'],
        ['\u2620\ufe0e', 'No one is safe', 'Anyone can be badly hurt, your character too.', (n, u, led) => hurt(u, led)],
        ['\u2604\ufe0e', 'Anything goes', 'Death and permanent loss are real outcomes.', (n, u, led) => `${hurt(u, led)} Death and permanent loss are real outcomes for anyone, main characters too; when a death fits, it\u2019s written, not dodged.`],
    ] },
    { key: 'drive', title: 'Who drives the story', steps: [
        ['\u270e', 'You lead', 'The story follows where your moves lean.', (n, u) => `Follow the player's lead: when ${u}'s moves lean the story a certain way, let it go that way rather than pulling it elsewhere. Everyone else still acts on their own wants, in character.`],
        ['\u25d0', 'Shared', 'The story as it comes.'],
        ['\u2609', 'The world leads', 'Others and events make the big moves.', lead],
        ['\u27a4', 'They push it', 'The story pushes on every reply, and they go further unasked.', (n, u) => `${lead(n, u)} Push forward every reply, and when someone would go further, they do it now instead of waiting for ${u} to raise it.`],
    ] },
    // 2.0.8: how much is said out loud, and how fast hurt and fights settle (her Kenny story kept confessing and
    // making up mid-argument). The angst steps also stop a character announcing that they have something to hide.
    { key: 'heart', title: 'How feelings come out', steps: [
        ['\u2600\ufe0e', 'Said plainly', 'People say what they feel and settle things.', () => 'People mostly say what they feel, and arguments get talked through and settled when the scene allows.'],
        ['\u25d0', 'As it comes', 'The story decides; nothing added.'],
        ['\u2767', 'Slow to settle', 'Hurt and fights don\u2019t settle in one scene.', () => 'Hurt and fights don\u2019t settle in one scene: people deflect, sulk, say the wrong thing or walk off, and making up comes later, once it\u2019s earned.'],
        ['\u2602\ufe0e', 'Angst', 'Feelings and secrets stay mostly unsaid; fights end unfinished.', () => ANGST],
        ['\u2620\ufe0e', 'Never said', 'The heart of it is never said; any confession comes out wrong or is taken back.', () => `${ANGST} What matters most stays unsaid; if a confession starts, it comes out partial or wrong, or is taken back, and the hurt stays.`],
    ] },
    { key: 'ending', title: 'How it ends up', steps: [
        ['\u2600\ufe0e', 'Hopeful', 'Things can come right when the story earns it.', () => 'Good endings, repair and hope stay open once the story has earned them.'],
        ['\u25d0', 'As it comes', 'The story decides; nothing added.'],
        ['\u2672\ufe0e', 'Bittersweet', 'Every win costs something that matters.', () => 'Every win costs something that matters.'],
        ['\u263e', 'Grim', 'Wins cost, and no hope the story hasn\u2019t earned.', () => 'Every win costs something, and nobody gets comfort or hope the scene hasn\u2019t earned.'],
        ['\u2620\ufe0e', 'Ruin', 'It heads for defeat or ruin, with no last-minute rescue.', () => 'It\u2019s heading for defeat, corruption or ruin, and nothing rescues it at the last moment. No comfort the scene hasn\u2019t earned.'],
    ] },
];
const MIDDLE = 1;
// How often a wildcard (picked by Moodweaver, so it's truly random) lands at each step of the first dial, out of 100.
export const DIAL_WILD = [0, 0, 12, 25, 45];
// The first dial lives in state.dial (it came first); the others in state.dials.
export const stepOf = (story, key) => { const v = key === 'turns' ? story?.dial : story?.dials?.[key]; return Number.isInteger(v) ? v : MIDDLE; };

// The rows the dials replaced, and the step each one moves its dial to when an old chat (or a starter blend) had it on.
const OLD_ROWS = {
    turns: { wildcards: 2 },
    danger: { real_stakes: 2, player_not_safe: 3, no_one_safe: 3, death_on_the_table: 4 },
    drive: { world_leads: 2, escalates_alone: 3 },
    ending: { costly_wins: 2, no_unearned_hope: 3, bad_ending: 4 },
};
export const DIAL_ROWS = new Set(Object.values(OLD_ROWS).flatMap(Object.keys));
export function dialsFromMoods(moods = {}) {
    const out = {};
    for (const [key, rows] of Object.entries(OLD_ROWS)) {
        let at = MIDDLE;
        for (const [id, step] of Object.entries(rows)) if ((moods[id] ?? 0) > 0) at = Math.max(at, step);
        // Strong or higher meant more: the world pushing every reply, and wildcards landing often.
        if (key === 'drive' && (moods.world_leads ?? 0) >= 61) at = 3;
        if (key === 'turns' && moods.wildcards > 0) at = moods.wildcards >= 50 ? 4 : moods.wildcards >= 25 ? 3 : 2;
        out[key] = at;
    }
    return out;
}
export function cleanDials(dials, moods) {
    const from = dials && typeof dials === 'object' ? null : dialsFromMoods(moods);
    return Object.fromEntries(DIALS.filter(d => d !== TURNS).map(d => { const v = from ? from[d.key] : dials[d.key];
        return [d.key, Number.isInteger(v) && v >= 0 && v < d.steps.length ? v : MIDDLE]; }));
}
export const cleanTurns = (dial, moods) => [0, 1, 2, 3, 4].includes(dial) ? dial : dialsFromMoods(moods).turns;
// The note's paragraph: one sentence per dial that's off the middle, or ''.
export function dialParagraph(story, n, u) {
    const led = stepOf(story, 'drive') >= 2, lines = DIALS.map(d => d.steps[stepOf(story, d.key)]?.[3]?.(n, u, led)).filter(Boolean);
    // 2.0.10: the dials set the weather, and each person meets it as who they are (her protective Kenny had turned
    // Angst into insults every reply).
    return lines.length ? `How this story runs: ${lines.join(' ')} Each person meets this in their own way, through their personality and their dynamic.` : '';
}
