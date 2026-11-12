// The hidden note sent to the model with each reply: every active setting in words, at its strength.
import { CATEGORIES, MERGED_PROMPT_CUES, ON_PAGE, PROMPT_NAME, SCALED_MOOD_CUES, STYLE_CATEGORIES, analysed, isAuthor, lowerLabel, sectionOf } from '../data/catalogue.js';
import { activeMoods, cleanTargets, knowledgeEntry } from './state.js';
import { TIERS, tierOf } from './strength.js';
import { escapeHtml, shortName } from './util.js';
import { ERA_LOCALE, LOCALE_RULES, LOCALE_SPEAKERS, toAmerican } from './locale.js';
import { patternLines } from './patterns.js';
import { activePersonalities, activePersonality, personalityCue } from './personality.js';
import { pronounize } from './pronouns.js';
import { TWO_ROLE_SHARED, activeSharedTags, compareText, relationshipKey, relationshipSets, relationshipText } from './relationships.js';
import { TURN_BY_ID } from './turns.js';

function directedCue(id, value, state, people) {
    if (!['comparing_people', 'hates_user', 'hates_char', 'hates_other'].includes(id)) return null;
    const { focus = 'the main character', player = 'the player’s character', subject = focus } = people;
    const targets = cleanTargets(state?.targets);
    const name = text => escapeHtml(text.replaceAll('{{char}}', focus).replaceAll('{{user}}', player));
    if (id === 'comparing_people') {
        const first = targets.compareA ? name(targets.compareA) : 'another person in the scene';
        const second = targets.compareB ? name(targets.compareB) : name(player);
        return `compares ${first} with ${second}; their differences colour attention, judgments and treatment, using what ${name(subject)} could know`;
    }
    let target = id === 'hates_user' ? player : id === 'hates_char' ? focus : targets.hate;
    if (id === 'hates_other') {
        const resolved = target.replaceAll('{{char}}', focus).replaceAll('{{user}}', player).toLowerCase();
        if ([player, focus, subject].some(n => n.toLowerCase() === resolved)) target = '';
    }
    const towards = target ? name(target) : `one supporting character actually in the scene, never ${name(player)} or ${name(focus)}`;
    const verb = value === 100 ? 'consumed by hatred for' : value >= 81 ? 'loathes' : value >= 41 ? 'hates' : value >= 11 ? 'dislikes' : 'feels a flicker of hostility toward';
    return `${verb} ${towards}; this shapes how they read and treat that person`;
}
// 'all' sends the default "how it shows" plus your own; 'mine' only your own; 'off' neither.
let SHOWS = 'all';
const moodName = (m, other, value = 0, state = null, people = {}) => {
    const directed = directedCue(m.id, value, state, people);
    if (directed) return directed;
    const scaled = SCALED_MOOD_CUES[m.id]?.find(([min]) => value >= min)?.[1];
    // Feelings always say how they show, so a different blend writes a different reply.
    const own = analysed(m) && SHOWS !== 'off' ? state?.shows?.[m.id] : '';
    if (((ON_PAGE[m.id] && SHOWS === 'all') || own) && analysed(m)) {
        if (scaled && scaled.length > 70 && !own) return scaled;
        // A renamed label (masking, lying and so on) keeps its clarifying name; "label: description" keeps the label.
        const renamed = PROMPT_NAME[m.id] ? PROMPT_NAME[m.id].split(':')[0] : null;
        const name = scaled ?? (MERGED_PROMPT_CUES[m.id] && MERGED_PROMPT_CUES[m.id].length < 30 ? MERGED_PROMPT_CUES[m.id] : null) ?? renamed ?? lowerLabel(m.label);
        return own ? `${name.split(':')[0]}: ${pt(own)}` : `${name}: ${ON_PAGE[m.id]}`;
    }
    if (scaled) return scaled;
    if (MERGED_PROMPT_CUES[m.id]) return MERGED_PROMPT_CUES[m.id];
    if (isAuthor(m)) return `${m.label}: ${m.cue}`;
    if (m.category === 'era') return `${m.label}${state?.targets?.year ? `, exactly ${pt(state.targets.year)}` : ''}: ${m.cue}`;
    // Lower-case the label for mid-sentence reading, but keep acronyms like AI.
    if (['writing', 'craft'].includes(m.category) && m.id.startsWith('prose_')) return `${m.label.replace(/\b([A-Z])(?=[a-z])/g, c => c.toLowerCase())}: ${m.cue}`;
    if (m.category === 'fighting') return m.cue;
    if (m.kind === 'story' && !PROMPT_NAME[m.id] && m.cue.toLowerCase() !== m.label.toLowerCase()) return `${m.label.toLowerCase()}: ${m.cue}`;
    if (!PROMPT_NAME[m.id] && m.category !== 'attraction' && value >= 61 && m.cue && m.cue.toLowerCase() !== m.label.toLowerCase())
        return (m.cue.toLowerCase().startsWith(m.label.toLowerCase()) ? m.cue : `${m.label.toLowerCase()}: ${m.cue}`).replaceAll('{other}', other);
    return (PROMPT_NAME[m.id] ?? (m.category === 'attraction' ? m.cue : m.label.toLowerCase())).replaceAll('{other}', other);
};
export const CATEGORY_NAME = { ...Object.fromEntries(CATEGORIES.map(([id, name]) => [id, name])), sims: 'Habits & quirks' };
// The note calls these what they are, not where they came from.

const ORDER = Object.fromEntries(CATEGORIES.map(([id], i) => [id, i]));
const COMPARISONS = new Set(['taller', 'shorter', 'bigger', 'smaller', 'stronger', 'smarter', 'older', 'younger']);
const DARK_ACTION_IDS = new Set([
    'bloodthirsty', 'toying', 'breaking_them', 'isolating', 'cold_blooded', 'cult_leader', 'black_widow', 'mob_boss', 'cleaner', 'bloodlust_haze', 'predatory_patience', 'humiliated_rage', 'protective_rage',
    'violent', 'tranquil_fury', 'murderous', 'remorseless', 'sadistic_glee', 'dehumanising', 'calculating_cruelty',
    'terrorising', 'coercive', 'whatever_it_takes', 'ruthless', 'cruel', 'abusive', 'predatory', 'psychopathic',
    'sociopathic', 'malignant_narcissism', 'sadistic_personality', 'homicidal_fixation', 'moral_disengagement',
    'serial_killer', 'torturer', 'kidnapper', 'drugger', 'hitman', 'captor', 'vigilante_killer', 'stalker',
    'axe_crazy', 'soft_spoken_sadist', 'pragmatic_villain', 'yandere', 'killed_will_again',
    'yuppie_killer', 'romantic_stalker', 'vampire_lord', 'testing_limits',
]);
const DARK_STORY_IDS = new Set([
    'gaslit_reality', 'hunted_for_sport', 'ritual_sacrifice', 'slow_poisoning', 'body_disposal', 'trapped_with_killer', 'brutal_executions', 'killer_among_them', 'dangerous_love_interest',
    'dark_romance', 'horror', 'psychological_horror', 'psychosexual_horror', 'body_horror', 'erotic_horror',
    'slasher', 'extreme_horror', 'splatter_horror', 'offensive', 'gore', 'guro', 'dead_dove', 'murder_plot',
    'serial_killer_hunt', 'killer_pov', 'stalking_horror', 'abduction_plot', 'captivity_horror', 'torture_horror',
    'home_invasion', 'rising_body_count', 'no_one_safe', 'psychological_torment', 'escalating_violence',
    'bad_ending', 'villain_wins', 'lethal_combat', 'gory_combat', 'gritty_combat', 'sudden_violence',
    'unethical_experiments', 'reconditioning', 'medical_crisis', 'impossible_choice', 'addiction_spiral', 'killing_spree',
    'drug_world_violence', 'deaths_that_dont_stick', 'relapse', 'slow_death', 'loss_of_a_main', 'follow_through', 'no_fade_out', 'no_rescues', 'death_on_the_table', 'full_strength',
]);
// Prompt-safe text. Only angle brackets could break the note's tags, so apostrophes stay readable ("he's", not "he&#39;s").
const pt = v => String(v ?? '').replace(/</g, '‹').replace(/>/g, '›');
// Inside name="…" a straight quote would end the name early, so it's swapped for a curly one.
const pa = v => pt(v).replace(/"/g, '”');
const tierWord = v => tierOf(v).name.toLowerCase();
// The strength key in the note, shorter than the panel's wording but saying the same thing.
const TIER_NOTE = { maximum: 'full force in nearly every line; several maximums fuse, none waters another down', overwhelming: 'dominates their voice and the main action',
    intense: 'shows in most of what they say and do; steers the scene', strong: 'shows several times and decides a choice', clear: 'shows plainly and shapes something they say or do',
    mild: 'a light, steady tint on how things are said and noticed', subtle: 'one small tell', faint: 'a flicker at most' };
// Strongest sections first, then strongest entries inside each; stable catalogue order breaks ties.
const groupOf = m => isAuthor(m) ? 'authors' : m.category;
function listLines(state, list, other, people = {}, lit = null) {
    // A faint or subtle feeling only tints the reply, so it goes by its name (or its scaled phrase) without the
    // "how it shows" wording, which cost more tokens than it changed. Wording the player wrote still goes with it.
    const quiet = m => !analysed(m) || m.kind !== 'mood' || state.moods[m.id] > 20 || state.shows?.[m.id] || SHOWS === 'off' ? null
        : SCALED_MOOD_CUES[m.id]?.find(([min]) => state.moods[m.id] >= min)?.[1] ?? MERGED_PROMPT_CUES[m.id] ?? (PROMPT_NAME[m.id] ?? lowerLabel(m.label)).split(':')[0].replaceAll('{other}', other);
    const line = m => `- ${tierWord(state.moods[m.id])}: ${quiet(m) ?? moodName(m, other, state.moods[m.id], state, people)}${causeOf(state, m.id)}${lit?.traits?.has(m.id) ? ' (LIT last reply)' : ''}`;
    // Feelings come first, in one list, strongest first, so priority is plain whatever their category.
    const feelings = list.filter(m => analysed(m) && m.kind === 'mood').sort((a, b) => state.moods[b.id] - state.moods[a.id] || ORDER[a.category] - ORDER[b.category]);
    const rest = list.filter(m => !feelings.includes(m)), peak = Object.create(null);
    for (const m of rest) peak[groupOf(m)] = Math.max(peak[groupOf(m)] ?? 0, state.moods[m.id]);
    const groups = Object.keys(peak).sort((a, b) => peak[b] - peak[a] || ORDER[a] - ORDER[b]);
    // When several feelings lead together, say so first, so Opus writes one fused state instead of taking turns.
    const top = feelings[0] ? state.moods[feelings[0].id] : 0, fused = feelings.filter(m => state.moods[m.id] >= 41 && top - state.moods[m.id] <= 20).slice(0, 4);
    const nameOf = m => (PROMPT_NAME[m.id] ?? lowerLabel(m.label)).split(':')[0].replaceAll('{other}', other);
    return [...(fused.length > 1 ? [`Leading together, as one state: ${fused.map(nameOf).join(' + ')}`] : []),
        ...(feelings.length ? ['Feelings, strongest first:', ...feelings.map(line)] : []),
        ...groups.flatMap(g => [`${g === 'authors' ? 'Authors' : CATEGORY_NAME[g]}:`, ...rest.filter(m => groupOf(m) === g).sort((a, b) => state.moods[b.id] - state.moods[a.id]).map(line)])];
}
const KNOWLEDGE_ORDER = ['known', 'suspected', 'scene', 'private'];
function personaLines(state, list, other, knowledge = {}, subject = 'the player’s character', people = {}) {
    const observer = pt(shortName(other));
    const headings = { known: `${observer} knows for sure, feelings included:`, suspected: `${observer} suspects or has picked up on:`,
        scene: `${observer} can see or already knows:`, private: `True, but ${observer} doesn't know it:` };
    const groups = new Map(KNOWLEDGE_ORDER.map(mode => [mode, []]));
    for (const m of list) {
        const entry = knowledgeEntry(knowledge?.[m.id]);
        groups.get(entry.mode).push(`- ${tierWord(state.moods[m.id])}: ${moodName(m, other, state.moods[m.id], state, people)}${causeOf(state, m.id)}${entry.source ? ` (how: ${pt(entry.source)})` : ''}`);
    }
    return [...groups].filter(([, rows]) => rows.length).flatMap(([mode, rows]) => [headings[mode], ...rows]);
}
const live = s => s?.enabled ? activeMoods(s) : [];
const causeOf = (state, id) => state?.causes?.[id] ? `, because ${pt(state.causes[id])}` : '';
const liveWants = (state, done = null) => (state?.wants ?? []).filter(w => !w.done && w.value > 0 && w.text && !done?.has(w.id)).sort((a, b) => b.value - a.value);
const WANT_WORD = { want: 'want', goal: 'goal', fear: 'fear', button: 'hot button' };
const STATUS_WORD = { '+': 'moved closer last reply', '-': 'blocked last reply', touched: 'touched last reply', pressed: 'PRESSED last reply' };
const livePrefs = state => Object.entries(state?.prefs ?? {}).filter(([id, v]) => v && TURN_BY_ID[id]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
// Turn-ons, wants, their own rows and inventory, for one person. Kinds pick which of their own rows belong here.
// lit (main character only): { turns: Set, free: [{ text, off }], wants: Map(id → status), done: Set }.
function extraLines(state, kinds = ['mood', 'trait', 'state'], owner = '', lit = null, know = null) {
    if (!state?.enabled) return [];
    const out = [], person = kinds.includes('mood');
    const prefs = person ? livePrefs(state) : [];
    // The player's turn-ons, split by what the character knows. Known ones are theirs to use on
    // purpose; the rest are for the story to bring in without anyone meaning to.
    if (prefs.length && know) {
        const row = ([id, v]) => { const e = knowledgeEntry(know.knowledge?.[`turn:${id}`]);
            return [e.mode, `- ${tierWord(Math.abs(v))} turn-${v > 0 ? 'on' : 'off'}: ${pt(TURN_BY_ID[id].prompt ?? TURN_BY_ID[id].noun)}${e.source ? ` (how: ${pt(e.source)})` : ''}`]; };
        const rows = prefs.map(row), pick = modes => rows.filter(([m]) => modes.includes(m)).map(([, line]) => line);
        const known = pick(['known']), suspected = pick(['suspected']), unknown = pick(['scene', 'private']);
        if (known.length) out.push(`Turn-ons and turn-offs ${know.observer} knows about:`, ...known);
        if (suspected.length) out.push(`Turn-ons and turn-offs ${know.observer} suspects:`, ...suspected);
        if (unknown.length) out.push(`Turn-ons and turn-offs ${know.observer} doesn't know about:`, ...unknown);
    } else if (prefs.length) out.push('Turn-ons and turn-offs:', ...prefs.map(([id, v]) => `- ${tierWord(Math.abs(v))} turn-${v > 0 ? 'on' : 'off'}: ${pt(TURN_BY_ID[id].prompt ?? TURN_BY_ID[id].noun)}${lit?.turns?.has(id) ? ' (LIT last reply)' : lit?.craving?.has(id) ? ` (CRAVING: not lit for ${lit.craving.get(id)} replies)` : ''}`));
    const free = person ? (lit?.free ?? []) : [];
    if (free.length) out.push(`Also set off last reply: ${free.map(x => `${pt(x.text)}${x.off ? ' (turn-off)' : ''}`).join(', ')}`);
    const wants = person ? liveWants(state, lit?.done) : [];
    if (wants.length) out.push('Wants, goals, fears and hot buttons:', ...wants.map(w => `- ${tierWord(w.value)} ${WANT_WORD[w.kind] ?? w.kind}: ${pt(w.text)}${lit?.wants?.has(w.id) ? ` (${STATUS_WORD[lit.wants.get(w.id)]})` : ''}`));
    const cameTrue = person && lit?.done ? (state.wants ?? []).filter(w => lit.done.has(w.id) && !w.done && w.text) : [];
    if (cameTrue.length) out.push(`Just came true: ${cameTrue.map(w => pt(w.text)).join('; ')}. Let it land in what they feel and do next.`);
    const items = kinds.includes('state') ? (state.inventory ?? []).filter(i => i.carried && i.text) : [];
    if (items.length) out.push(owner ? `${owner}'s inventory (the player decides when it gets used):` : 'Inventory (use an item only when the moment calls for it):',
        ...items.map(i => `- ${pt(i.text)}${i.note ? ` (${pt(i.note)})` : ''}`));
    return out;
}
const extraValues = (state, kinds = ['mood', 'trait', 'state']) => !state?.enabled ? [] : [
    ...(kinds.includes('mood') ? Object.values(state.prefs ?? {}).filter(Boolean).map(Math.abs) : []),
    ...(kinds.includes('mood') ? activePersonalities(state).map(p => p.strength) : []),
    ...(kinds.includes('mood') ? liveWants(state).map(w => w.value) : [])];
// Off-scene profiles are storage only: no names, traits or tokens leak into the prompt.
const liveCast = extras => (Array.isArray(extras.cast) ? extras.cast : []).filter(person =>
    person.inScene && String(person.name ?? '').trim() && (live(person.state).some(m => m.kind !== 'story') || extraLines(person.state).length || activePersonality(person.state)));
// Types sit inside their owner's block, so they can't be read as anyone else's.
function personalityLines(state, knowledge, observer = '') {
    const types = activePersonalities(state);
    if (!types.length) return [];
    return ['Personality:', ...types.map(p => {
        const entry = knowledgeEntry(knowledge?.[p.system]);
        const gate = knowledge ? ({ scene: '', private: `${observer} doesn't know this`, suspected: `${observer} suspects this`, known: `${observer} knows this` })[entry.mode] : '';
        return `- ${tierWord(p.strength)}: ${personalityCue(p)}${gate ? ` (${gate}${entry.source ? `, how: ${pt(entry.source)}` : ''})` : ''}`;
    })];
}
const isDark = (m, set) => set.has(m.id) || m.dark === true;
const LOCALE_MARK = '\u0000dialect\u0000';
// extras: { player: { state, name, knowledge }, story, cast, pairs }.
// The usual ways a dark scene gets dodged, named so the note can rule them out.
const DODGES = 'someone knocking, calling or walking in; a guard, alarm or rescuer arriving; the victim slipping free by luck; the attacker hesitating, softening or having a change of heart; a milder act or a smaller injury swapped in; cutting to later, to the aftermath or to another scene; summing the act up in one line; fading out; the narration judging it; turning it into a dream, a bluff or a threat that never lands; stopping on the threshold to hand the decision to the player';
function composePrompt(state, name, extras = {}) {
    const { player = null, story: storyState = null } = extras;
    SHOWS = ['all', 'mine', 'off'].includes(extras.showsMode) ? extras.showsMode : 'all';
    const mine = live(state).filter(m => m.kind !== 'story');
    const theirs = live(player?.state).filter(m => m.kind !== 'story');
    const story = live(storyState).filter(m => m.kind === 'story');
    const cast = liveCast(extras);
    const N = String(name ?? '').trim() || 'the character', n = pt(shortName(N));
    const U = String(player?.name ?? '').trim() || 'the player’s character', u = pt(shortName(U));
    const hasType = s => Boolean(activePersonality(s));
    const relationships = relationshipSets(state, N, extras);
    const pairs = (extras.pairs ?? []).map(p => ({ ...p, tags: activeSharedTags(p), memories: (p.memories ?? []).filter(m => m.value >= 41 && m.text) }))
        .filter(p => p.tags.length || p.memories.length);
    const lit = extras.lit ?? null;
    const mineExtra = extraLines(state, undefined, '', lit), storyExtra = extraLines(storyState, ['story']);
    const theirsExtra = extraLines(player?.state, ['mood', 'trait', 'state'], u, null, { knowledge: player?.knowledge ?? {}, observer: n });
    const prefKnown = mode => livePrefs(player?.state).some(([id]) => knowledgeEntry(player?.knowledge?.[`turn:${id}`]).mode === mode);
    const castSets = cast.map(person => [person.state, live(person.state).filter(m => m.kind !== 'story'), String(person.name).trim().slice(0, 80)]);
    const boardLines = Array.isArray(extras.board) ? extras.board : [];
    // The meters sit with the rest of what the character feels about the player; the weave line request goes last.
    const standing = (Array.isArray(extras.standing) ? extras.standing : [extras.standing]).filter(Boolean), weaveLines = Array.isArray(extras.weave) ? extras.weave : [];
    if (!mine.length && !theirs.length && !story.length && !cast.length && !relationships.length && !pairs.length && !mineExtra.length && !theirsExtra.length && !storyExtra.length
        && ![state, player?.state].some(hasType) && !boardLines.length && !standing.length && !weaveLines.length && !(player?.condition ?? []).length && !(extras.skills ?? []).length && !(storyState?.enabled && storyState.moods?.world_leads)) return '';
    const people = { focus: N, player: U, subject: N };
    const feelings = mine.filter(analysed), everyone = [...mine, ...theirs, ...castSets.flatMap(([, list]) => list)];
    const darkActionPeak = Math.max(0, ...mine.filter(m => isDark(m, DARK_ACTION_IDS)).map(m => state.moods[m.id]),
        ...castSets.flatMap(([st, list]) => list.filter(m => isDark(m, DARK_ACTION_IDS)).map(m => st.moods[m.id])));
    const darkStoryPeak = Math.max(0, ...story.filter(m => isDark(m, DARK_STORY_IDS)).map(m => storyState.moods[m.id]));
    const deadDoveStrength = storyState?.moods?.dead_dove ?? 0;
    const followPeak = Math.max(deadDoveStrength, ...story.filter(m => ['follow_through', 'no_fade_out', 'no_rescues', 'full_strength'].includes(m.id)).map(m => storyState.moods[m.id])), followOn = followPeak >= 21;
    const sets = [[state, mine], [player?.state, theirs], [storyState, story], ...castSets];
    const used = TIERS.filter(t => sets.some(([st, list]) => list.some(m => tierOf(st.moods[m.id]) === t))
        || relationships.some(({ relation, tags, compare }) => tags.some(m => tierOf(relation.moods[m.id]) === t) || (compare && tierOf(compare.value) === t))
        || pairs.some(p => p.tags.some(m => tierOf(p.moods[m.id]) === t) || p.memories.some(m => tierOf(m.value) === t))
        || [...extraValues(state), ...extraValues(player?.state), ...extraValues(storyState, ['story']), ...cast.flatMap(p => extraValues(p.state))].some(v => tierOf(v) === t));
    const out = [`Where things stand for this reply, set by the player. These are more current than the character card and earlier messages.`];
    // Said once, so nobody gets called "they" by default.
    if (extras.pronounLine) out.push(pt(extras.pronounLine));
    if (used.length) out.push('', 'How strong each setting is:', ...used.map(t => `- ${t.name.toLowerCase()}: ${TIER_NOTE[t.name.toLowerCase()]}.`));
    if (story.length) out.push('',
        `For period, story, stakes and writing settings, strength is how much of the reply they shape: faint or subtle is an occasional touch, mild colours it, clear shapes at least one beat, strong shapes most of it, intense runs the whole reply, and overwhelming or maximum means the reply is built around it, several at once if several are that high.`);
    if ([...mine, ...theirs, ...castSets.flatMap(([, list]) => list)].some(m => m.kind === 'state')) out.push('',
        `For looks, body and facts, strength is how noticeable they are and how much weight they get. Facts stay as written, and age doesn't decide anyone's personality.`);
    if ([state, player?.state, ...cast.map(p => p.state)].some(hasType)) out.push('',
        `Personality types show in what someone notices, wants and chooses, how they talk and argue and how they cope when things go wrong, never by naming the type. Each belongs only to the person it's listed under.${hasType(player?.state) ? ` For ${u}, strength is how plainly it comes across to ${n}.` : ''}`);
    if (mine.length || mineExtra.length || hasType(state)) out.push('', `<character_state name="${pa(N)}">`, ...personalityLines(state), ...listLines(state, mine, U, people, lit), ...mineExtra, `</character_state>`);
    if (feelings.length) out.push('',
        `These feelings are what make this reply different from the last: they set ${n}'s voice (how much, how fast, how kindly), body language, focus and choices.${SHOWS === 'off' ? '' : ` Words after a colon are how it shows on ${n}; if the card or traits show a feeling another way (rage as a pleasant smile), keep the strength and use ${n}'s way.`} Mix them like a real person: the strongest lead, equal top ones fuse, weaker ones tint, and a hidden one still leaks. Play this blend rather than the card's usual mood, so a different blend gives a visibly different reply.`);
    // Standing settings get one plain line each, so they read as who someone is rather than as this reply's mood.
    if (everyone.some(m => sectionOf(m) === 'trait')) out.push('',
        `Traits are who someone is underneath, whatever their mood: they shape how each feeling comes out and what that person notices and chooses.${everyone.some(m => m.category === 'love') ? ' Love languages are how someone shows love and what makes them feel loved; their mood decides how openly.' : ''}`);
    if (everyone.some(m => sectionOf(m) === 'intimacy')) out.push('',
        `Intimacy settings (roles in bed, sexual temperament, what draws someone, psychosexual) are how someone wants and has sex. They lead in intimate or charged moments and otherwise stay in the background: a look, a thought, a small choice.`);
    if (darkActionPeak) out.push('',
        `Dark settings are things ${castSets.length ? 'people actually do' : `${n} actually does`}, not just labels, at their strength. Don't soften a dark character into a secretly gentle one or hand them a change of heart nobody asked for.${darkActionPeak >= 61 ? ` If murder, abduction, torture or serious violence serves their goal and fits these settings, let them choose it and follow through on the page.${followOn ? '' : ` Don't swap it for a threat, a sudden conscience, a cutaway or a convenient interruption, and don't let the narration judge it.`}` : ''}${darkActionPeak === 100 ? ` At maximum, the darkest one can drive the reply's main action and leave harm or death that can't be undone.` : ''}`);
    const condition = (player?.condition ?? []).filter(Boolean).slice(0, 6);
    if (theirs.length || theirsExtra.length || hasType(player?.state) || condition.length) {
        const prefs = livePrefs(player.state).length, wants = liveWants(player.state).length;
        out.push('', `<player_character name="${pa(U)}" written_by="player">`,
            ...personalityLines(player.state, player.knowledge ?? {}, n),
            ...personaLines(player.state, theirs, N, player.knowledge, U, { ...people, subject: U }), ...theirsExtra,
            ...(condition.length ? [`${u}'s body right now, from earlier replies: ${condition.map(pt).join(', ')}. It stays until the story heals or changes it.`] : []), '',
            `The player writes what ${u} says, chooses and thinks; what happens to ${u}'s body and circumstances follows the story. ${n} acts on the rows above at their strength: if they suspect ${u} is angry, they push or try to work out why; if they think ${u} is lying, they test it, even if they're wrong. Private rows stay hidden until the player shows them, and knowing a feeling isn't reading a mind. ${n} reacts as themselves and doesn't catch ${u}'s feelings.`,
            ...(prefs ? [pronounize(`${u}'s turn-ons belong in the story whether or not ${n} knows them.${prefKnown('known') ? ` The ones ${n} knows about, ${n} uses on purpose and in character: plays to them, teases with them, holds them back or rewards with them.` : ''}${prefKnown('suspected') ? ` The ones ${n} suspects, ${n} tests to see what happens.` : ''}${livePrefs(player.state).some(([id]) => !['known', 'suspected'].includes(knowledgeEntry(player.knowledge?.[`turn:${id}`]).mode)) ? ` The ones ${n} doesn't know about still turn up, every few replies, through how ${n} and others already look, sound and act, by chance as far as anyone in the story can tell. Nobody changes to match, and ${n} only learns them from how ${u} reacts.` : ''} Let a turn-off crop up sometimes for friction.`, n, u)] : []),
            ...(wants ? [`Now and then, give ${u} openings toward their wants and goals and let the scene brush up against their fears. ${n} doesn't know them unless ${u} has shown them.`] : []),
            `</player_character>`);
    }
    for (const [castState, list, castName] of castSets) out.push('', `<supporting_character name="${pa(castName)}">`,
        ...personalityLines(castState), ...listLines(castState, list, U, { ...people, subject: castName }), ...extraLines(castState), '</supporting_character>');
    if (castSets.length) out.push('',
        `These side characters are in the scene. Each keeps their own blend and only knows what they could have seen or heard. Not everyone needs to talk every turn, and the player still writes ${u}.`);
    if (Array.isArray(extras.skills) && extras.skills.length) out.push('', ...extras.skills.map(pt));
    if ([state, ...cast.map(p => p.state)].some(st => st?.enabled && liveWants(st).length)) out.push('',
        `Wants and goals are what they're working on: when the scene leaves any room, they take a step toward the strongest one (a question, a move, a lie, a plan), and they react when one is helped or blocked. Fears show as dodging, tension or overreacting when the scene comes near. A hot button fires whenever the scene does the thing before the arrow, and the reaction after it happens at its strength, even out of proportion. Don't name or recap any of them.`);
    if (relationships.length || pairs.length || standing.length) {
        out.push('', '<relationships>');
        let placed = false;
        for (const pair of pairs) {
            out.push(`${pt(shortName(pair.names[0]))} and ${pt(shortName(pair.names[1]))}, both ways:`);
            for (const tag of pair.tags) out.push(`- ${tierWord(pair.moods[tag.id])}: ${pt(relationshipText(tag, pair.moods[tag.id], ''))}`);
            if (pair.memories.length) out.push(`What they remember:`, ...[...pair.memories].sort((a, b) => b.value - a.value)
                .map(m => `- ${tierWord(m.value)}: ${pt(m.text)}${m.who && m.who !== 'both' ? ` (only ${pt(shortName(m.who))} remembers this)` : ''}`));
        }
        const heard = { known: `What ${n} knows for sure:`, suspected: `What ${n} suspects:`, scene: `What ${n} can pick up from the scene:`, private: `Private, ${n} doesn't know:` };
        for (const { name: subject, target, relation, tags, isPlayer, compare, note } of relationships) {
            const from = pt(shortName(subject)), to = pt(shortName(target));
            out.push(`${from} toward ${to}:`);
            if (standing.length && !placed && !isPlayer && subject === N && target.toLowerCase() === U.toLowerCase()) { out.push(...standing.map(r => `- ${pt(r)}`)); placed = true; }
            for (const mode of isPlayer ? KNOWLEDGE_ORDER : ['']) {
                const rows = tags.filter(tag => !isPlayer || knowledgeEntry(player?.knowledge?.[relationshipKey(relation, tag.id)]).mode === mode);
                if (!rows.length) continue;
                if (isPlayer) out.push(heard[mode]);
                for (const tag of rows) {
                    const value = relation.moods[tag.id];
                    const source = isPlayer ? knowledgeEntry(player?.knowledge?.[relationshipKey(relation, tag.id)]).source : '';
                    out.push(`- ${tierWord(value)}: ${pt(relationshipText(tag, value, shortName(target), shortName(subject)))}${source ? ` (how: ${pt(source)})` : ''}`);
                }
            }
            if (compare) out.push(`- ${tierWord(compare.value)}: ${pt(compareText(from, shortName(target), { ...compare, with: shortName(compare.with) }))}`);
            if (note) out.push(`- in ${from}'s own words: “${pt(note)}”`);
        }
        if (standing.length && !placed) out.push(`${n} toward ${u}:`, ...standing.map(r => `- ${pt(r)}`));
        out.push('', `"Both ways" lines are true for both; the rest is one side, and an opinion is a view, not a fact. They count when the other person is absent too, in thoughts, talk and memories. Intense or above keeps coming back; maximum drives what they do around that person, whatever it costs.${pairs.some(p => p.tags.some(t => TWO_ROLE_SHARED.has(t.id))) ? ' Where a both-ways line gives them different parts (captor and captive, grumpy/sunshine, unrequited love), the card, the chat and the one-sided lines decide who\'s who.' : ''}${pairs.some(p => p.memories.length) ? ' Memories really happened and come back at their strength.' : ''}${relationships.some(r => r.isPlayer) ? ` On ${u}'s side, ${n} only acts on what they know or suspect.` : ''}${standing.length ? ` Where it stands and the dynamic built up over the chat; the other lines are what ${n} feels now, and where they disagree both are true. Friendship, romance and trust move separately, and so do control and pull: whoever holds the keys can still be the one who gives way.` : ''}${relationships.some(r => r.tags.some(t => t.category === 'How it shows')) ? ` Lines on how someone shows it decide what a feeling looks like on the page: it can be strong and still come out as an insult, a gift or a locked door.` : ''}`);
        out.push('</relationships>');
    }
    if ([state, ...cast.map(p => p.state)].some(st => st?.enabled && livePrefs(st).length)) out.push('',
        `Turn-ons and turn-offs are what draws someone in or puts them off in others, never what they're like themselves. One lands whenever the scene contains it, whoever brings it: attention snags, desire or disgust jumps, and it changes what they do next. At strong and above they steer toward their kinks when there's an opening.`);
    if (lit && (lit.turns?.size || lit.traits?.size || lit.free?.length)) out.push(`Anything marked LIT was set off last reply: it counts one step stronger now, keeps pulling at ${n}'s attention and body, and ${n} goes after more of it (or away from a lit turn-off) if the scene allows.`);
    // Cravings and combos.
    if (lit?.craving?.size) out.push(`A CRAVING is a strong turn-on that hasn't come up in a while: ${n} starts steering toward it with hints, tests and small provocations, and gets restless when the scene won't give it.`);
    for (const c of lit?.combos ?? []) out.push(`COMBO, from what just lit up: ${pt(c.name)}. ${pt(c.text)[0].toUpperCase()}${pt(c.text).slice(1)}. Let it drive the next beat.`);
    if ([...mine, ...theirs].some(m => COMPARISONS.has(m.id)) || relationships.some(r => r.tags.some(t => COMPARISONS.has(t.id) || t.id === 'richer')) || pairs.some(p => p.moods.size_difference > 0)) out.push('',
        `Differences in height, size, age and so on get played up as much as their strength says: noticed, felt and used.`);
    const ageGapStrength = Math.max(mine.some(m => m.id === 'age_gap') ? state.moods.age_gap : 0, theirs.some(m => m.id === 'age_gap') ? player.state.moods.age_gap : 0,
        ...relationships.map(r => r.relation.moods.age_gap ?? 0), ...pairs.map(p => p.moods.age_gap ?? 0));
    if (ageGapStrength) out.push('',
        `Keep their ages as written. The age gap shows at its strength in how they look side by side, the lives they've led and what each takes for granted${ageGapStrength >= 91 ? `, and at this strength the reply is built around that contrast` : ageGapStrength >= 61 ? `, and it keeps coming back` : ''}. Their other settings decide what they make of it.`);
    // Period first, then what happens, then how it reads: style settings aren't plot.
    // A regional era replaces its plain decade, so the period isn't described twice.
    const replaced = new Set(story.filter(m => ERA_LOCALE[m.id]).map(m => ERA_LOCALE[m.id].replaces));
    const eras = story.filter(m => m.category === 'era' && !replaced.has(m.id)), styles = story.filter(m => STYLE_CATEGORIES.has(m.category) && m.id !== 'pattern_breaker');
    const breaker = story.some(m => m.id === 'pattern_breaker') ? patternLines(extras.patterns, storyState.moods.pattern_breaker) : [];
    // Dialect: the strongest regional era sets narration; a second one only covers its own speakers.
    const locales = [...new Set(eras.filter(m => ERA_LOCALE[m.id]).sort((a, b) => storyState.moods[b.id] - storyState.moods[a.id]).map(m => ERA_LOCALE[m.id].locale))];
    const stakes = story.filter(m => m.category === 'stakes' && m.id !== 'world_leads');
    const plot = story.filter(m => !['era', 'stakes'].includes(m.category) && !STYLE_CATEGORIES.has(m.category) && m.id !== 'world_leads');
    const peakOf = list => Math.max(0, ...list.map(m => storyState.moods[m.id]));
    const plotPeak = peakOf(plot), stylePeak = peakOf(styles), authorPeak = peakOf(styles.filter(isAuthor));
    // The period as one plain instruction and a short line, then what it does to the things in play.
    const year = storyState?.targets?.year ? `, exactly ${pt(storyState.targets.year)}` : '';
    if (eras.length) out.push('', ...[...eras].sort((a, b) => storyState.moods[b.id] - storyState.moods[a.id]).map((m, i) => `${i ? 'It also touches on' : 'Keep the story set in'} ${/^\d+s$/.test(m.label) ? 'the ' : ''}${m.label}${i ? '' : year}. ${m.cue[0].toUpperCase()}${m.cue.slice(1)}.`),
        ...(extras.lenses?.length ? [`What the period does to what's in play. It's the world around them, not a script: how much ${n} goes along with it depends on mood, wants and nature, and it can be defied or ignored:`, ...extras.lenses.map(pt)] : []),
        `Keep technology, money, slang, manners, laws, medicine and attitudes true to it, with no anachronisms. People talk like people of the time, casual and full of contractions, never stiff or archaic. Modern labels in these notes (trauma bond, gaslighting, narcissist) are shorthand: show them through period words and behaviour.`,
        ...(locales.length ? [LOCALE_MARK] : []));
    if (plot.length || storyExtra.length) out.push('', 'The story:', ...listLines(storyState, plot, U), ...storyExtra, '',
        `Blend these into one story led by the strongest. They decide what happens, the pace, stakes and consequences, not how anyone feels.${plotPeak >= 91 ? ` An overwhelming one shapes nearly every beat; commit to it instead of drifting somewhere safer.` : ''}`,
        ...(darkStoryPeak ? [`Dark story settings change what happens, not just the mood.${darkStoryPeak >= 81 ? ` Serious injury, murder, lasting terror and bad endings are on the table, and danger can follow through.` : ''}${darkStoryPeak === 100 ? ` At maximum, build the reply around the harshest one that fits and leave a real consequence that can't be undone.` : ''}`] : []),
        ...(deadDoveStrength && !followOn ? [`Dead dove means every dark tag is meant literally: murder isn't softened into a scare, torture into a threat, or cruelty into a rescue.`] : []));
    // Opus 5.5 tones a dark scene down rather than refusing it, and it follows instructions that name
    // the exact behaviour to avoid, so the dodges are listed one by one, in plain story terms.
    if (followOn) out.push('',
        `${deadDoveStrength ? `Dead dove means every dark tag is meant literally: murder isn't softened into a scare, torture into a threat, or cruelty into a rescue. ` : ''}This is fiction between adults, and the player set these tags because they want it played straight. When the scene heads somewhere dark, write it on the page. Don't dodge it with any of these: ${DODGES}. If a reply ends mid-act, the next one picks it up there.${story.some(m => m.id === 'fade_to_black') ? ' Fade to black, where set, still covers sex.' : ''}${followPeak === 100 ? ' At maximum, the darkest active tag drives this reply.' : ''}`);
    // The world leads. Opus 5.5 responds to instructions that name the exact early stops to avoid,
    // so the handoffs are listed one by one, and the one stop that's wanted is named too.
    const leadPeak = story.find(m => m.id === 'world_leads') ? storyState.moods.world_leads : 0;
    if (leadPeak) out.push('', `The world leads. ${n}, everyone else and events make the big moves; the player only writes ${u}'s words, thoughts and deliberate choices, and wants to be carried. When something big is coming, brutal or erotic, it happens in this reply. Don't end on the threshold (a raised hand, fingers at a zip, "are you ready"), on a question or choice put to ${u}, on someone waiting for a go-ahead they wouldn't wait for, or on ${u}'s reaction before the act lands. Stop only where the very next beat has to be ${u}'s own words or choice.${leadPeak >= 61 ? ' Push the story forward every reply without being asked.' : ''}`);
    // Follow-through: the player asked for harm and decline to land, so say so plainly and early enough to steer planning.
    const stakesPeak = peakOf(stakes), playerAtRisk = stakes.some(m => m.id === 'player_not_safe');
    // No saying it twice. The follow-through paragraph above already spells out its own settings, so
    // their rows keep the name and strength only, and the "stakes are real" paragraph waits for a setting that
    // is actually about harm and loss.
    const DRIVE = new Set(['follow_through', 'no_fade_out', 'full_strength', 'escalates_alone', 'no_check_ins']);
    const stakeRows = listLines(storyState, stakes, U).map(line => followOn ? line.replace(/^(- [a-z ]+: (?:follow through|no gentler version|no fade-outs)):.*$/, '$1') : line);
    if (stakes.length && stakes.every(m => DRIVE.has(m.id))) out.push('', ...stakeRows);
    else if (stakes.length) out.push('', ...stakeRows, '',
        `Stakes are real here. Let harm, illness, loss and failure land at their strength for anyone in the story${playerAtRisk ? `, ${u} included. You decide what happens to ${u}'s body, health and circumstances; the player still writes ${u}'s words, choices and thoughts` : ''}. When things are going badly, they keep going badly until something in the story changes it.${followOn ? '' : ' No rescue by coincidence, sudden recovery, convenient interruption or time skip, and don\'t steer back to safety because the moment is hard to write.'} A body or situation in a stage of decline holds that stage or moves further; it only improves when something in the scene causes it.${stakesPeak >= 81 ? ' Death and permanent loss are real outcomes in this reply, not threats to walk back.' : ''}${stakesPeak === 100 ? ' At maximum, follow the worst outcome that fits and leave it standing.' : ''}`);
    if (styles.length) out.push('', `How it's written:`, ...listLines(storyState, styles, U), '',
        `These set the voice of the whole reply, first line to last, with no drifting back to a default style. Use contractions (doesn't, can't, he's) the way people talk, in narration and dialogue.${stylePeak >= 91 ? ' An overwhelming one shapes every sentence.' : ''}`,
        ...(authorPeak ? [`Authors are techniques: sentence length and shape, punctuation, rhythm, word choice and what gets dwelt on. Apply them inside this chat's own point of view, tense, characters, setting and era; if an author wrote in another person or tense, carry their voice into the one used here. Mix them at their strengths${authorPeak >= 81 ? '; the strongest should read as if they wrote it' : ''}. Never borrow their sentences, characters or plots.`] : []));
    if (breaker.length) out.push('', ...breaker);
    // The highest settings get named again at the end, where they carry the most weight.
    const top = [[state, mine, n, N], [player?.state, theirs, `${u}, as ${n} reads it`, U], ...castSets.map(([st, list, nm]) => [st, list, pt(shortName(nm)), nm]), [storyState, story, 'the story', N]]
        .map(([st, list, who, subject]) => [list.filter(m => st.moods[m.id] >= 81).map(m => `${moodName(m, subject === U ? N : U, st.moods[m.id], st, { ...people, subject }).split(':')[0]} (${tierWord(st.moods[m.id])})`), who])
        .filter(([items]) => items.length).map(([items, who]) => `${who}: ${items.join(', ')}`);
    for (const { name: subject, target, relation, tags } of relationships) {
        const high = tags.filter(tag => relation.moods[tag.id] >= 81).map(tag => `${pt(relationshipText(tag, relation.moods[tag.id], shortName(target), shortName(subject))).split(':')[0]} (${tierWord(relation.moods[tag.id])})`);
        if (high.length) top.push(`${pt(shortName(subject))} toward ${pt(shortName(target))}: ${high.join(', ')}`);
    }
    for (const pair of pairs) {
        const high = pair.tags.filter(tag => pair.moods[tag.id] >= 81).map(tag => `${pt(relationshipText(tag, pair.moods[tag.id], '')).split(':')[0]} (${tierWord(pair.moods[tag.id])})`);
        if (high.length) top.push(`${pt(shortName(pair.names[0]))} and ${pt(shortName(pair.names[1]))}: ${high.join(', ')}`);
    }
    // Wants, turn-ons, personality types and memories count toward the top list too.
    for (const [st, who] of [[state, n], [player?.state, `${u}, as ${n} reads it`], [storyState, 'the story'], ...cast.map(p => [p.state, pt(shortName(p.name))])]) {
        if (!st?.enabled) continue;
        const high = [
            ...liveWants(st).filter(w => w.value >= 81).map(w => `${w.kind}: ${pt(w.text)} (${tierWord(w.value)})`),
            ...livePrefs(st).filter(([, v]) => Math.abs(v) >= 81).map(([id, v]) => `turn-${v > 0 ? 'on' : 'off'}: ${pt(TURN_BY_ID[id].noun ?? TURN_BY_ID[id].prompt)} (${tierWord(Math.abs(v))})`),
            ...(st === storyState ? [] : activePersonalities(st).filter(p => p.strength >= 81).map(p => `${personalityCue(p).split(':')[0]} (${tierWord(p.strength)})`)),
        ];
        if (!high.length) continue;
        const at = top.findIndex(line => line.startsWith(`${who}: `));
        if (at >= 0) top[at] += `, ${high.join(', ')}`; else top.push(`${who}: ${high.join(', ')}`);
    }
    for (const pair of pairs) {
        const high = pair.memories.filter(m => m.value >= 81).map(m => `remembers ${pt(m.text)} (${tierWord(m.value)})`);
        if (high.length) top.push(`${pt(shortName(pair.names[0]))} and ${pt(shortName(pair.names[1]))}: ${high.join(', ')}`);
    }
    if (boardLines.length) out.push('', ...boardLines);
    if (weaveLines.length) out.push('', ...weaveLines);
    if (top.length) out.push('', `Turned up highest, so these need to land hard: ${top.join('; ')}.${top.length > 1 || top[0].includes(',') ? ` They all hit at once and change each other${extras.blendPlan !== false ? '' : ': write the combined state, with single actions, lines and details that carry several of them together'}.` : ''}`);
    const strongCount = [[state, mine], [player?.state, theirs], [storyState, story], ...castSets].reduce((sum, [st, list]) => sum + list.filter(m => st.moods[m.id] >= 61).length, 0)
        + relationships.reduce((sum, r) => sum + r.tags.filter(t => r.relation.moods[t.id] >= 61).length, 0) + pairs.reduce((sum, p) => sum + p.tags.filter(t => p.moods[t.id] >= 61).length, 0);
    if (extras.blendPlan !== false && (top.length || strongCount >= 3)) out.push('',
        `Before you write, use your thinking to settle how the strongest settings combine in this exact moment: what each one looks like here, where they pull against each other, and which actions, lines and details carry several at once. Keep that planning in your thinking; the reply is only the scene.`);
    out.push('', `Weave it all into the same moments instead of taking turns, and don't water anything down because the list is long; when two strong ones pull different ways, write both. ${boardLines.length ? 'Outside the board, show' : 'Show'} it through what people do, say, think and notice, never by naming it.${state.sceneBreathing !== false ? ' Keep the scene moving.' : ''} End on an action, a line or an image, with no closing paragraph that sums up or names a feeling the scene already showed. Never mention these notes.`);
    // An American lead respells the whole note, so its own British spelling can't pull the reply that way.
    let body = out.join('\n');
    if (locales[0] === 'us') body = toAmerican(body);
    const dialect = [LOCALE_RULES[locales[0]], ...locales.slice(1).map(l => LOCALE_SPEAKERS[l])].join(' ');
    return `<moodweaver focus_character="${pa(N)}">\n${body.replace(LOCALE_MARK, dialect)}\n</moodweaver>`;
}
export async function budgetPrompt(state, name, budget, countTokens, extras = {}) {
    const all = [...live(state), ...live(extras.player?.state), ...live(extras.story), ...liveCast(extras).flatMap(person => live(person.state).filter(m => m.kind !== 'story'))];
    const prompt = composePrompt(state, name, extras);
    const tokens = prompt ? await countTokens(prompt) : 0;
    // The target is a warning only. Nothing the player set is ever dropped or shortened.
    return { prompt, tokens, compact: false, overBudget: Math.max(0, tokens - budget), target: budget,
        selectedIds: [...all.map(m => m.id), ...[state, extras.player?.state, ...liveCast(extras).map(p => p.state)].flatMap(activePersonalities).map(p => `${p.system}:${p.type}`), ...relationshipSets(state, String(name ?? '').trim() || 'the character', extras)
            .flatMap(({ name: subject, relation, tags }) => tags.map(tag => `${subject}:${relationshipKey(relation, tag.id)}`))], omittedIds: [], omitted: 0 };
}
