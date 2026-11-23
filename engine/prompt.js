// The hidden note sent to the model with each reply: every active setting in words, at its strength.
import { BY_ID, CATEGORIES, MERGED_PROMPT_CUES, ON_PAGE, PROMPT_NAME, SCALED_MOOD_CUES, STYLE_CATEGORIES, analysed, isAuthor, lowerLabel, sectionOf } from '../data/catalogue.js';
import { activeMoods, cleanTargets, knowledgeEntry } from './state.js';
import { TIERS, tierOf } from './strength.js';
import { escapeHtml, sceneHas, shortName } from './util.js';
import { ERA_LOCALE, LOCALE_RULES, LOCALE_SPEAKERS, toAmerican } from './locale.js';
import { patternLines } from './patterns.js';
import { WILDCARDS } from '../data/catalogue/story.js';
import { activePersonalities, activePersonality, personalityCue } from './personality.js';
import { pronounize } from './pronouns.js';
import { TWO_ROLE_SHARED, activeSharedTags, compareText, relationshipKey, relationshipSets, relationshipText } from './relationships.js';
import { TURN_BY_ID, compareProfiles, familyText, favText, petNames, profileText, sayings } from './turns.js';

function directedCue(id, value, state, people) {
    if (!['comparing_people', 'hates_user', 'hates_char', 'hates_other'].includes(id)) return null;
    const { focus = 'the main character', player = 'the player\u2019s character', subject = focus } = people;
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
// Traits in focus (\u2699 Settings \u203a What is sent \u203a Traits): a few traits go in full each reply (the ones the scene
// names first, then the rest in turn, stronger ones more often) and the others go as one line of names, so traits
// stay part of who someone is without crowding out this reply's feelings and dynamic. Off sends every trait in full.
let TRAITS = { focus: true, scene: '', seed: 0 };
// How turn-ons are sent (Settings \u203a What is sent \u203a Turn-ons), the same for everyone (character, player, cast):
// mode 'fit': in an intimate scene, when the scene's words touch one, when the other person shows one, when it lit last
// reply, and every `every` replies a random two as a reminder; 'heat': only in an intimate scene; 'all': every reply.
// strong: only turn-ons and turn-offs at 60 and up (the third and fourth moon) are ever sent.
let TURNS = { mode: 'fit', strong: false, every: 6, seed: 0, intimate: false, scene: '' };
export const TURN_HEAT_MIN = 60;
const TRAIT_FOCUS = 3;
const isTrait = m => sectionOf(m) === 'trait' && !isAuthor(m);
// How deep a trait runs, in words that don't say how much of the reply it fills (feelings and the dynamic decide that).
const depthWord = v => v >= 81 ? 'deeply' : v >= 61 ? 'very' : v >= 41 ? 'clearly' : v >= 21 ? 'somewhat' : 'a touch';
const reEsc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// The scene touches a trait when it uses one of the trait's words or the first word of its name ("jealous").
const traitTouched = (m, scene) => { if (!scene) return false; if (sceneHas(m, scene)) return true;
    const head = lowerLabel(m.label).split(/[\s(/,:]+/)[0]; return head.length >= 5 && new RegExp(`(^|[^a-z])${reEsc(head.slice(0, Math.max(5, head.length - 2)))}[a-z]*`, 'i').test(scene); };
function traitFocus(state, traits) {
    if (!TRAITS.focus || traits.length <= TRAIT_FOCUS) return { focus: new Set(traits), back: [] };
    const touched = traits.filter(m => traitTouched(m, TRAITS.scene)).sort((a, b) => state.moods[b.id] - state.moods[a.id]);
    // The rest take turns: each reply shuffles them by the reply number, with a head start for deeper ones.
    const turn = m => state.moods[m.id] + ((TRAITS.seed * 97 + [...m.id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % 61);
    const rest = traits.filter(m => !touched.includes(m)).sort((a, b) => turn(b) - turn(a));
    const focus = new Set([...touched, ...rest].slice(0, TRAIT_FOCUS));
    return { focus, back: traits.filter(m => !focus.has(m)).sort((a, b) => state.moods[b.id] - state.moods[a.id]) };
}
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
    // Mind settings always say how they work, with the way they lean when it's set.
    // Two-sided ones (complexes and a few more) say what it is, then play only the side the player chose.
    if (sectionOf(m) === 'psyche') { const name = m.label.replace(/ \(Jung\)$/, '');
        if (!(m.light && m.dark)) return `${name}: ${m.cue}`;
        const side = state?.psyLean?.[m.id] === 'light' ? 'light' : 'dark';
        return `${name}, ${side === 'light' ? 'healthy' : 'unhealthy'} side: ${m.cue} Here it shows like this: ${m[side]}`; }
    // An author at clear or above gets the full brief of how they write, so the voice is unmistakable; fainter ones the short cue.
    // One set for narration or dialogue only sends just that part of the brief, marked, so nothing else leaks over.
    if (isAuthor(m)) { const role = state?.authorRole?.[m.id];
        return `${m.label}${m.books ? ` (${m.books.replaceAll('; ', ', ')})` : ''}${role ? `, ${role} only` : ''}: ${value >= 41 && m.style ? briefFor(m.style, role) : m.cue}`; }
    if (m.category === 'era') return `${m.label}${state?.targets?.year ? `, exactly ${pt(state.targets.year)}` : ''}: ${m.cue}`;
    // Lower-case the label for mid-sentence reading, but keep acronyms like AI.
    if (['writing', 'craft'].includes(m.category) && m.id.startsWith('prose_')) return `${m.label.replace(/\b([A-Z])(?=[a-z])/g, c => c.toLowerCase())}: ${m.cue}`;
    if (m.category === 'fighting') return m.cue;
    if (m.kind === 'story' && !PROMPT_NAME[m.id] && m.cue.toLowerCase() !== m.label.toLowerCase()) return `${m.label.toLowerCase()}: ${m.cue}`;
    if (!PROMPT_NAME[m.id] && m.category !== 'attraction' && value >= 61 && m.cue && m.cue.toLowerCase() !== m.label.toLowerCase())
        return (m.cue.toLowerCase().startsWith(m.label.toLowerCase()) ? m.cue : `${m.label.toLowerCase()}: ${m.cue}`).replaceAll('{other}', other);
    return (PROMPT_NAME[m.id] ?? (m.category === 'attraction' ? m.cue : m.label.toLowerCase())).replaceAll('{other}', other);
};
// Said once when narration and dialogue have their own authors. Opus 5.5 follows a split best when each side
// is defined by what it covers, and told what the other side must not borrow.
const AUTHOR_SPLIT = `Narration and dialogue are split between authors here. An author marked narration only shapes everything outside quotation marks: description, action, what the eye lingers on, inner life, sentence shape and paragraphing. An author marked dialogue only shapes what people say aloud: their vocabulary and slang, rhythm, interruptions, what they dodge or leave unsaid, and how they flirt, threaten, joke and ask for things. Everyone still talks like themselves, their era, class and history; the dialogue author decides how that sounds on the page, not who they are or what they want. Keep each voice on its own side: speech doesn't pick up the narration's sentence rhythm, and the narration doesn't start talking like the characters. Authors with no mark shape both.`;
// The parts of an author's brief ("Prose: \u2026 Dialogue: \u2026 Minds: \u2026 People: \u2026 Hallmarks: \u2026") that a role keeps:
// dialogue only keeps how people talk; narration only drops it.
const BRIEF_PART = /(?=\b(?:Prose|Dialogue|Minds|People|Hallmarks): )/;
function briefFor(style, role) {
    if (!role) return style;
    const parts = style.split(BRIEF_PART).map(x => x.trim()).filter(Boolean), talk = parts.filter(x => x.startsWith('Dialogue: '));
    if (role === 'dialogue') return talk.length ? talk.join(' ') : style;
    return parts.filter(x => !x.startsWith('Dialogue: ')).join(' ') || style;
}
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
// Story settings that get their own paragraph instead of a line in the list.
const OWN_LINE = new Set(['world_leads', 'wildcards']);
// One wildcard for this reply, or '': the seed (reply number) decides both whether and which.
function wildcardOf(strength = 0, seed = 0) {
    const h = Math.imul((Number(seed) || 0) + 11, 0x9E3779B9) >>> 0;
    return h % 100 < strength ? WILDCARDS[(h >>> 8) % WILDCARDS.length] : '';
}
// Prompt-safe text. Only angle brackets could break the note's tags, so apostrophes stay readable ("he's", not "he&#39;s").
const pt = v => String(v ?? '').replace(/</g, '\u2039').replace(/>/g, '\u203a');
// Inside name="\u2026" a straight quote would end the name early, so it's swapped for a curly one.
const pa = v => pt(v).replace(/"/g, '\u201d');
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
    const line = m => `- ${isTrait(m) ? depthWord(state.moods[m.id]) : tierWord(state.moods[m.id])}: ${quiet(m) ?? moodName(m, other, state.moods[m.id], state, people)}${causeOf(state, m.id)}${lit?.traits?.has(m.id) ? ' (lit last reply)' : ''}`;
    // Feelings come first, in one list, strongest first, so priority is plain whatever their category.
    const feelings = list.filter(m => analysed(m) && m.kind === 'mood').sort((a, b) => state.moods[b.id] - state.moods[a.id] || ORDER[a.category] - ORDER[b.category]);
    const traitPick = traitFocus(state, list.filter(m => !feelings.includes(m) && isTrait(m)));
    const rest = list.filter(m => !feelings.includes(m) && !traitPick.back.includes(m)), peak = Object.create(null);
    for (const m of rest) peak[groupOf(m)] = Math.max(peak[groupOf(m)] ?? 0, state.moods[m.id]);
    const groups = Object.keys(peak).sort((a, b) => peak[b] - peak[a] || ORDER[a] - ORDER[b]);
    // When several feelings lead together, say so first, so Opus writes one fused state instead of taking turns.
    const top = feelings[0] ? state.moods[feelings[0].id] : 0, fused = feelings.filter(m => state.moods[m.id] >= 41 && top - state.moods[m.id] <= 20).slice(0, 4);
    const nameOf = m => (PROMPT_NAME[m.id] ?? lowerLabel(m.label)).split(':')[0].replaceAll('{other}', other);
    return [...(fused.length > 1 ? [`Leading together, as one state: ${fused.map(nameOf).join(' + ')}`] : []),
        ...(feelings.length ? ['Feelings, strongest first:', ...feelings.map(line)] : []),
        ...groups.flatMap(g => [`${g === 'authors' ? 'Authors' : CATEGORY_NAME[g]}:`, ...rest.filter(m => groupOf(m) === g).sort((a, b) => state.moods[b.id] - state.moods[a.id]).map(line)]),
        ...(traitPick.back.length ? [`Other traits, true but in the background this reply: ${traitPick.back.map(m => `${pt(lowerLabel(m.label))}${state.moods[m.id] >= 61 ? ` (${depthWord(state.moods[m.id])})` : ''}`).join(', ')}`] : [])];
}
// Core traits: up to three, picked on the Traits tab, always true whatever the mood.
const coreOf = st => (st?.core ?? []).map(id => BY_ID[id]).filter(m => m && (st.moods?.[m.id] ?? 0) > 0);
// Starred beliefs: up to three views or alignments, picked with \u2726, always sent as what this person acts on first.
const beliefsOf = st => (st?.beliefs ?? []).map(id => BY_ID[id]).filter(m => m && (st.moods?.[m.id] ?? 0) > 0);
const famLine = (st, scene, all) => { const t = familyText(st, scene, all); return t ? [`Family (bring in only where it matters to this moment): ${pt(t)}`] : []; };
const favLine = (st, scene, all) => { const t = favText(st, scene, all); return t ? [`Favourites (for choices, gifts, orders and small talk, never listed): ${pt(t)}`] : []; };
// Pet names and sayings, sent every reply as part of who someone is. For the character they are what to use instead of
// made-up endearments and stock lines; for the player's character, what the character should recognise and answer.
const q = list => list.map(x => `"${pt(x)}"`).join(', ');
function voiceLines(st, who, other, player = false) {
    const pets = petNames(st), says = sayings(st), out = [];
    if (pets.length) out.push(player ? `Pet names ${who} uses for ${other} (${other} knows them and reacts to being called them): ${q(pets)}`
        : `Pet names ${who} uses for ${other} (when ${who} uses an endearment, it is one of these, picked to suit the moment; don't invent others or fall back on stock ones): ${q(pets)}`);
    if (says.length) out.push(player ? `Things ${who} really says (the player's to use; ${other} knows them as ${who}'s phrases): ${q(says)}`
        : `Things ${who} really says, word for word (work one in now and then where it fits naturally, at most one a reply and not every reply): ${q(says)}`);
    return out;
}
function profileLines(st, core, other, people, scene = '', all = true, beliefs = []) {
    const text = profileText(st);
    return [...(text ? [`Profile: ${pt(text)}`] : []), ...favLine(st, scene, all), ...famLine(st, scene, all), ...voiceLines(st, pt(shortName(people?.subject ?? 'they')), pt(shortName(other))),
        ...(beliefs.length ? [`What they believe most, and act on (it decides what they say and do when it's in play, even against a passing feeling, and colours how they see ${pt(shortName(other))}): ${beliefs.map(m => { const said = moodName(m, other, Math.max(61, st.moods[m.id]), st, people), name = lowerLabel(m.label); return said.toLowerCase().startsWith(name.toLowerCase()) ? said : `${name}: ${said}`; }).join('; ')}`] : []),
        ...(core.length ? [`Core of who they are, true under any mood or dynamic (it shapes how feelings come out, not which ones): ${core.map(m => { const said = moodName(m, other, Math.max(61, st.moods[m.id]), st, people), name = lowerLabel(m.label); return said.toLowerCase().startsWith(name.toLowerCase()) ? said : `${name}: ${said}`; }).join('; ')}`] : [])];
}
const KNOWLEDGE_ORDER = ['known', 'suspected', 'scene', 'private'];
function personaLines(state, list, other, knowledge = {}, subject = 'the player\u2019s character', people = {}) {
    const observer = pt(shortName(other));
    // Each heading names whose rows these are, so a scar or a chipped tooth here can't drift onto the observer.
    const who = pt(shortName(subject));
    const headings = { known: `About ${who}, ${observer} knows for sure, feelings included:`, suspected: `About ${who}, ${observer} suspects or has picked up on:`,
        scene: `About ${who}, ${observer} can see or already knows:`, private: `True of ${who}, but ${observer} doesn't know it:` };
    const groups = new Map(KNOWLEDGE_ORDER.map(mode => [mode, []]));
    for (const m of list) {
        const entry = knowledgeEntry(knowledge?.[m.id]);
        groups.get(entry.mode).push(`- ${tierWord(state.moods[m.id])}: ${moodName(m, other, state.moods[m.id], state, people)}${causeOf(state, m.id)}${entry.source ? ` (how: ${pt(entry.source)})` : ''}`);
    }
    return [...groups].filter(([, rows]) => rows.length).flatMap(([mode, rows]) => [headings[mode], ...rows]);
}
const live = s => s?.enabled ? activeMoods(s) : [];
// Mind settings at clear or above, or starred as core, go every reply; fainter ones only when the scene
// (the player's last message and the latest replies) uses one of their words.
const mindOn = (st, scene) => m => sectionOf(m) !== 'psyche' || st.moods[m.id] >= 41 || st.core?.includes(m.id) || sceneHas(m, scene);
// Who-they-are facts (looks, style, voice, past, job, fighting, standing) usually repeat the card, so with
// factsWhenRelevant on they go only when the scene touches them (their own name or their topic), at overwhelming
// or above, or every few replies as a reminder. Right-now facts and places always go; age and height are in the profile.
// Private facts (size) go only in private or intimate moments.
const STANDING_FACTS = {
    looks: /\b(look(s|ed|ing)?|face|eyes|mirror|stare[sd]?|staring|beautiful|handsome|pretty|ugly|gorgeous|glance[sd]?|gaze|appearance|features)\b/i,
    aesthetic: /\b(cloth(es|ing)|dress(ed|es)?|suit|outfit|wear(s|ing)?|wore|jacket|shirt|coat|shoes|boots|tie|skirt|style|uniform)\b/i,
    voice: /\b(voice|accent|sing(s|ing)?|tone|whisper(s|ed)?|drawl|sound(s|ed)? like|speech)\b/i,
    background: /\b(past|childhood|grew up|family|mother|father|parents|home ?town|war|school|before|history|remember)\b/i,
    job: /\b(work(s|ed|ing)?|job|office|boss|shift|career|patient|client|colleague|staff|duty|project)\b/i,
    fighting: /\b(fight(s|ing)?|punch\w*|hit(s|ting)?|attack\w*|gun|knife|blade|kill\w*|weapon|blood|grab(s|bed)?|struggle\w*)\b/i,
    standing: /\b(money|rich|poor|secret\w*|status|reputation|name|class|power|known|rank)\b/i,
};
const STEAM_RULES = new Set(['prose_steam_in_character', 'prose_bed_talk']);
const PRIVATE_SCENE = /\b(shower\w*|bath(e|es|ed|ing|tub)?|naked|nude|undress\w*|strip\w*|bed|bedroom|sex\w*|cock|dick|penis|crotch|groin|trousers|pants|zipper|erection|hard-on|kiss\w*|moan\w*|thighs?)\b/i;
const SIZE_SCENE = /\b(size|sized|inch(es)?|girth|measur\w*|endowed|hung|cup size|flat-chested|compar\w* (him|her|them|it|his|hers)|(small|smaller|little|tiny|big|bigger|huge|large|larger) (cock|dick|penis|prick|breasts|tits|chest))\b/i;
const labelIn = (m, scene) => { const key = m.label.replace(/\s*\(.*\)\s*$/, '').toLowerCase(); return key.length > 3 && scene.toLowerCase().includes(key); };
const factOn = (st, scene, gate) => m => {
    if (m.kind !== 'state' || sectionOf(m) !== 'state') return true;
    if (m.private) return gate.intimate && (!m.size || gate.size);
    if (!gate.on || !STANDING_FACTS[m.category]) return true;
    return st.moods[m.id] >= 81 || gate.refresh || sceneHas(m, scene) || labelIn(m, scene) || STANDING_FACTS[m.category].test(scene);
};
const AROUSED = new Set(['horny', 'heated', 'desperate_for_it', 'craving', 'insatiable', 'starved_for_them', 'sexually_frustrated', 'teased_to_breaking', 'dominant_hunger', 'submissive_longing', 'possessive_lust']);
// Why a feeling is there (the player's words), or who it's aimed at when that's someone else (from the hidden line).
const causeOf = (state, id) => state?.causes?.[id] ? `, because ${pt(state.causes[id])}` : state?.about?.[id] && state.moods?.[id] > 0 ? ` (at ${pt(state.about[id])})` : '';
const liveWants = (state, done = null) => (state?.wants ?? []).filter(w => !w.done && w.value > 0 && w.text && !done?.has(w.id)).sort((a, b) => b.value - a.value);
const WANT_WORD = { want: 'want', goal: 'goal', fear: 'fear', button: 'hot button' };
const STATUS_WORD = { '+': 'moved closer last reply', '-': 'blocked last reply', touched: 'touched last reply', pressed: 'pressed hard last reply' };
// Whether the scene's words touch a turn-on: its name or one of its extra words (whole words, endings allowed).
const touchesTurn = (id, scene) => { const t = TURN_BY_ID[id], text = String(scene ?? '').toLowerCase(); if (!t || !text) return false;
    return `${t.noun} ${t.keys ?? ''}`.toLowerCase().split(/[^a-z']+/).filter(w => w.length >= 4).some(w => new RegExp(`\\b${w.slice(0, Math.max(4, w.length - 2))}`).test(text)); };
const livePrefs = state => Object.entries(state?.prefs ?? {}).filter(([id, v]) => v && TURN_BY_ID[id] && (!TURNS.strong || Math.abs(v) >= TURN_HEAT_MIN) && (TURNS.mode !== 'heat' || TURNS.intimate)).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
// The reminder pick: a random two of someone's turn-ons, new each reminder reply (seeded by the reply number, so the
// same reply always picks the same two).
const turnRoll = (id, salt) => { let h = 2166136261; for (const c of `${TURNS.seed}:${salt}:${id}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const reminderDue = () => TURNS.every > 0 && (TURNS.seed < 3 || TURNS.seed % TURNS.every === 0);
// Which of someone's turn-ons go this reply. signs: Map(turn id \u2192 { is }) of what the other person shows; lit: Set lit last reply.
function sentPrefs(state, signsMap = null, lit = null, salt = '') {
    const prefs = livePrefs(state);
    if (TURNS.mode !== 'fit' || TURNS.intimate) return prefs;
    const due = reminderDue() ? new Set([...prefs].sort((a, b) => turnRoll(a[0], salt) - turnRoll(b[0], salt)).slice(0, 2).map(([id]) => id)) : new Set();
    return prefs.filter(([id]) => due.has(id) || touchesTurn(id, TURNS.scene) || signsMap?.get(id)?.is?.length || lit?.has(id));
}
// Turn-ons, wants, their own rows and inventory, for one person. Kinds pick which of their own rows belong here.
// lit (main character only): { turns: Set, free: [{ text, off }], wants: Map(id \u2192 status), done: Set }.
// signs: { map: Map(turn id \u2192 { is, not }) from engine/turns.js turnSigns, who: the other person's name }.
const signNote = (id, signs) => { const x = signs?.map?.get(id);
    return !x ? '' : x.is.length ? ` (in ${signs.who}: ${x.is.map(pt).join(', ')})` : ` (in ${signs.who}, the opposite: ${x.not.map(pt).join(', ')})`; };
function extraLines(state, kinds = ['mood', 'trait', 'state'], owner = '', lit = null, know = null, signs = null) {
    if (!state?.enabled) return [];
    const out = [], person = kinds.includes('mood');
    const prefs = person ? livePrefs(state) : [];
    // The player's turn-ons, split by what the character knows. Known ones are theirs to use on
    // purpose; the rest are for the story to bring in without anyone meaning to.
    if (prefs.length && know) {
        const row = ([id, v]) => { const e = knowledgeEntry(know.knowledge?.[`turn:${id}`]);
            return [e.mode, `- ${tierWord(Math.abs(v))} turn-${v > 0 ? 'on' : 'off'}: ${pt(TURN_BY_ID[id].prompt ?? TURN_BY_ID[id].noun)}${signNote(id, signs)}${e.source ? ` (how: ${pt(e.source)})` : ''}`]; };
        // 1.86: what the character knows stays known, but each one is only sent when it fits the moment: in an
        // intimate scene, when the scene's words touch it, when the other person shows it, or (the two strongest)
        // one reply in six as a reminder. Saves tokens on long lists without anyone forgetting anything.
        const sent = new Set(sentPrefs(state, signs?.map, null, 'player').map(([id]) => id));
        const rows = prefs.filter(([id]) => sent.has(id)).map(row), pick = modes => rows.filter(([m]) => modes.includes(m)).map(([, line]) => line);
        const known = pick(['known']), suspected = pick(['suspected']), unknown = pick(['scene', 'private']);
        if (known.length) out.push(`Turn-ons and turn-offs ${know.observer} knows about:`, ...known);
        if (suspected.length) out.push(`Turn-ons and turn-offs ${know.observer} suspects:`, ...suspected);
        if (unknown.length) out.push(`Turn-ons and turn-offs ${know.observer} doesn't know about:`, ...unknown);
    } else if (prefs.length && sentPrefs(state, signs?.map, lit?.turns, 'char').length) out.push('Turn-ons and turn-offs:', ...sentPrefs(state, signs?.map, lit?.turns, 'char').map(([id, v]) => `- ${tierWord(Math.abs(v))} turn-${v > 0 ? 'on' : 'off'}: ${pt(TURN_BY_ID[id].prompt ?? TURN_BY_ID[id].noun)}${signNote(id, signs)}${lit?.turns?.has(id) ? ' (lit last reply)' : lit?.craving?.has(id) ? ` (craving: not lit for ${lit.craving.get(id)} replies)` : ''}`));
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
// extras: { player: { state, name, knowledge }, story, cast, pairs, signs: { char, user } (turn-ons each one shows of the other's) }.
// The usual ways a dark scene gets dodged, named so the note can rule them out.
const DODGES = 'someone knocking, calling or walking in; a guard, alarm or rescuer arriving; the victim slipping free by luck; the attacker hesitating, softening or having a change of heart; a milder act or a smaller injury swapped in; cutting to later, to the aftermath or to another scene; summing the act up in one line; fading out; the narration judging it; turning it into a dream, a bluff or a threat that never lands; stopping on the threshold to hand the decision to the player';
function composePrompt(state, name, extras = {}) {
    const { player = null, story: storyState = null } = extras;
    SHOWS = ['all', 'mine', 'off'].includes(extras.showsMode) ? extras.showsMode : 'all';
    const scene = String(extras.scene ?? ''), seed = Number(extras.seed) || 0;
    TRAITS = { focus: extras.traitFocus !== false, scene, seed };
    const aroused = st => live(st).some(m => (AROUSED.has(m.id) && st.moods[m.id] >= 41) || (m.category === 'bedroom' && st.moods[m.id] > 0));
    const gate = { on: extras.factsWhenRelevant !== false, refresh: seed < 3 || seed % 6 === 0,
        // Size facts (1.80.1): in an intimate scene they'd go every reply, and Claude then brought them up every
        // reply. Now only when the scene draws attention to size, or one reply in five as a reminder.
        size: SIZE_SCENE.test(scene) || seed < 2 || seed % 5 === 0,
        intimate: PRIVATE_SCENE.test(scene) || [state, player?.state, ...(extras.cast ?? []).filter(p => p.inScene).map(p => p.state)].some(st => st?.enabled && aroused(st)) };
    TURNS = { mode: ['all', 'fit', 'heat'].includes(extras.turnsSend) ? extras.turnsSend : extras.turnsWhenRelevant === false ? 'all' : 'fit', strong: extras.turnsStrong === true,
        every: Number.isFinite(Number(extras.turnsEvery)) ? Math.max(0, Math.round(Number(extras.turnsEvery))) : 6, seed, intimate: gate.intimate, scene };
    const shown = st => m => mindOn(st, scene)(m) && factOn(st, scene, gate)(m);
    const mine = live(state).filter(m => m.kind !== 'story').filter(shown(state));
    const theirs = live(player?.state).filter(m => m.kind !== 'story').filter(shown(player?.state));
    // Point of view and tense (Story \u203a Point of view & tense) are their own instruction, not a weighted setting.
    const storyAll = live(storyState).filter(m => m.kind === 'story');
    const views = storyAll.filter(m => m.category === 'viewpoint'), story = storyAll.filter(m => m.category !== 'viewpoint');
    const cast = liveCast(extras);
    const N = String(name ?? '').trim() || 'the character', n = pt(shortName(N));
    const U = String(player?.name ?? '').trim() || 'the player\u2019s character', u = pt(shortName(U));
    const hasType = s => Boolean(activePersonality(s));
    const relationships = relationshipSets(state, N, extras);
    const pairs = (extras.pairs ?? []).map(p => ({ ...p, tags: activeSharedTags(p), memories: (p.memories ?? []).filter(m => m.value >= 41 && m.text) }))
        .filter(p => p.tags.length || p.memories.length);
    const lit = extras.lit ?? null;
    const signs = extras.signs ?? null, signed = Boolean(signs?.char?.size || signs?.user?.size);
    const mineExtra = extraLines(state, undefined, '', lit, null, { map: signs?.char, who: u }), storyExtra = extraLines(storyState, ['story']);
    const theirsExtra = extraLines(player?.state, ['mood', 'trait', 'state'], u, null, { knowledge: player?.knowledge ?? {}, observer: n, gate: {} }, { map: signs?.user, who: n });
    const prefKnown = mode => sentPrefs(player?.state, signs?.user, null, 'player').some(([id]) => knowledgeEntry(player?.knowledge?.[`turn:${id}`]).mode === mode);
    const castSets = cast.map(person => [person.state, live(person.state).filter(m => m.kind !== 'story').filter(shown(person.state)), String(person.name).trim().slice(0, 80)]);
    const boardLines = Array.isArray(extras.board) ? extras.board : [];
    // The meters sit with the rest of what the character feels about the player; the weave line request goes last.
    const standing = (Array.isArray(extras.standing) ? extras.standing : [extras.standing]).filter(Boolean), weaveLines = Array.isArray(extras.weave) ? extras.weave : [];
    const weaveOn = weaveLines.length > 0;
    if (!mine.length && !theirs.length && !story.length && !views.length && !cast.length && !relationships.length && !pairs.length && !mineExtra.length && !theirsExtra.length && !storyExtra.length
        && ![state, player?.state].some(hasType) && !boardLines.length && !standing.length && !weaveLines.length && !(player?.condition ?? []).length && !(extras.skills ?? []).length && !(storyState?.enabled && storyState.moods?.world_leads)) return { prompt: '', fixed: '' };
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
    // Split (Settings \u203a What is sent): the explanations, the board format, the hidden-line format and the author notes
    // don't change from reply to reply, so they go in a guide near the top (fx) where the API can cache them. What's
    // true right now, and anything meant to change the scene, stays here, last, where it carries the most weight.
    // The guide's conditions follow what's set up (traits, Mind, turn-ons, wants), not values that move each reply,
    // so it stays the same text and keeps its cache.
    const split = extras.split === true, fx = [];
    const guide = (...lines) => (split ? fx : out).push(...lines);
    const setUp = [state, player?.state, ...cast.map(p => p.state)].flatMap(st => live(st).filter(m => m.kind !== 'story'));
    // Said once, so nobody gets called "they" by default.
    if (extras.pronounLine) out.push(pt(extras.pronounLine));
    if (split) fx.push('', 'How strong each setting is:', ...TIERS.filter(t => TIER_NOTE[t.name.toLowerCase()]).map(t => `- ${t.name.toLowerCase()}: ${TIER_NOTE[t.name.toLowerCase()]}.`));
    else if (used.length) out.push('', 'How strong each setting is:', ...used.map(t => `- ${t.name.toLowerCase()}: ${TIER_NOTE[t.name.toLowerCase()]}.`));
    // Rows describe what to show, never lines to say, so no period or genre voice lands on the wrong character.
    guide('', `These notes say what to show, never words to use: whatever anyone says, or calls someone, comes in that person's own words, from their own era, place and card.`);
    if (story.length) guide('',
        `For period, story, stakes and writing settings, strength is how much of the reply they shape: faint or subtle is an occasional touch, mild colours it, clear shapes at least one beat, strong shapes most of it, intense runs the whole reply, and overwhelming or maximum means the reply is built around it, several at once if several are that high.`);
    if (split || [...mine, ...theirs, ...castSets.flatMap(([, list]) => list)].some(m => m.kind === 'state')) guide('',
        `For looks, body and facts, strength is how noticeable they are and how much weight they get. Facts stay as written, and age doesn't decide anyone's personality.`);
    if ([state, player?.state, ...cast.map(p => p.state)].some(hasType)) guide('',
        `Personality types show in what someone notices, wants and chooses, how they talk and argue and how they cope when things go wrong, never by naming the type. Each belongs only to the person it's listed under.${hasType(player?.state) ? ` For ${u}, strength is how plainly it comes across to ${n}.` : ''}`);
    // Profile (age, height, interests) and up to three core traits lead the block; the core traits aren't listed twice.
    const core = coreOf(state), beliefs = beliefsOf(state), profile = profileLines(state, core, U, people, scene, !gate.on || gate.refresh, beliefs);
    if (mine.length || mineExtra.length || hasType(state) || profile.length) out.push('', `<character_state name="${pa(N)}">`, ...profile, ...personalityLines(state), ...listLines(state, mine.filter(m => !core.includes(m) && !beliefs.includes(m)), U, people, lit), ...mineExtra, `</character_state>`);
    if (split ? state?.enabled : feelings.length) guide('',
        `These feelings are what make this reply different from the last: they set ${n}'s voice (how much, how fast, how kindly), body language, focus and choices.${SHOWS === 'off' ? '' : ` Words after a colon are how it shows on ${n}; if the card or traits show a feeling another way (rage as a pleasant smile), keep the strength and use ${n}'s way.`} Mix them like a real person: the strongest lead, equal top ones fuse, weaker ones tint, and a hidden one still leaks. A feeling marked (at someone) belongs to that person: it can shorten a temper with others, but it doesn't become a feeling about them. Play this blend rather than the card's usual mood, so a different blend gives a visibly different reply.`);
    // Standing settings get one plain line each, so they read as who someone is rather than as this reply's mood.
    if ((split ? setUp : everyone).some(m => sectionOf(m) === 'trait')) guide('',
        `Traits are who someone is underneath, whatever their mood: they shape how each feeling comes out and what that person notices and chooses. They don't set the reply's mood or main action, and they don't override the feelings or the dynamic: those lead, and traits colour them. A trait's word (a touch, somewhat, clearly, very, deeply) is how deep it runs, not how much of the reply it fills: even a deep one shows in a detail, a reaction or a choice, and comes forward fully only when the moment touches it. Background traits stay true without needing to show.${(split ? setUp : everyone).some(m => m.category === 'love') ? ' Love languages are how someone shows love and what makes them feel loved; their mood decides how openly.' : ''}`);
    if ((split ? setUp : everyone).some(m => sectionOf(m) === 'psyche')) guide('',
        `Mind settings are how someone's mind works underneath. Play them from the inside: their logic makes sense to them, and it shows in small specific choices, reactions, blind spots and what they misread, more under stress and less on a good day, often without anyone around noticing. Nobody names the condition unless someone in the story would. Where a setting names a healthy or unhealthy side, play that side only. Skip the stock screen versions (the twitchy movie psychopath, the robotic genius, the screaming "crazy" ex, therapy talk); real people with these are mostly ordinary between the moments that show it.`);
    if ((split ? setUp : everyone).some(m => sectionOf(m) === 'intimacy')) guide('',
        `Intimacy settings (roles in bed, sexual temperament, what draws someone, psychosexual) are how someone wants and has sex. They lead in intimate or charged moments and otherwise stay in the background: a look, a thought, a small choice.`);
    if (darkActionPeak) out.push('',
        `Dark settings are things ${castSets.length ? 'people actually do' : `${n} actually does`}, not just labels, at their strength. Don't soften a dark character into a secretly gentle one or hand them a change of heart nobody asked for.${darkActionPeak >= 61 ? ` If murder, abduction, torture or serious violence serves their goal and fits these settings, let them choose it and follow through on the page.${followOn ? '' : ` Don't swap it for a threat, a sudden conscience, a cutaway or a convenient interruption, and don't let the narration judge it.`}` : ''}${darkActionPeak === 100 ? ` At maximum, the darkest one can drive the reply's main action and leave harm or death that can't be undone.` : ''}`);
    const condition = (player?.condition ?? []).filter(Boolean).slice(0, 6);
    const theirProfile = player?.state?.enabled ? [...(profileText(player.state) ? [`Profile: ${pt(profileText(player.state))}`] : []), ...favLine(player.state, scene, !gate.on || gate.refresh), ...famLine(player.state, scene, !gate.on || gate.refresh), ...voiceLines(player.state, u, n, true)] : [];
    const between = player?.state?.enabled && state?.enabled ? compareProfiles(state, player.state) : '';
    if (theirs.length || theirsExtra.length || hasType(player?.state) || condition.length || theirProfile.length) {
        const prefs = sentPrefs(player.state, signs?.user, null, 'player').length, wants = liveWants(player.state).length;
        const playerRule = `The player writes what ${u} says, chooses and thinks; what happens to ${u}'s body and circumstances follows the story. ${n} acts on the rows above at their strength: if they suspect ${u} is angry, they push or try to work out why; if they think ${u} is lying, they test it, even if they're wrong. Private rows stay hidden until the player shows them, and knowing a feeling isn't reading a mind. ${n} reacts as themselves and doesn't catch ${u}'s feelings.`;
        if (split) fx.push('', `In ${u}'s block (written_by="player"): ${playerRule.replace('the rows above', 'its rows')}`);
        out.push('', `<player_character name="${pa(U)}" written_by="player">`, `Everything in this block is about ${u}, not ${n}: looks, marks and facts here belong to ${u} alone.`,
            ...theirProfile, ...(between ? [`Between them: ${n} is ${between} than ${u}.`] : []),
            ...personalityLines(player.state, player.knowledge ?? {}, n),
            ...personaLines(player.state, theirs, N, player.knowledge, U, { ...people, subject: U }), ...theirsExtra,
            ...(condition.length ? [`${u}'s body right now, from earlier replies: ${condition.map(pt).join(', ')}. It stays until the story heals or changes it.`] : []),
            ...(split ? [] : ['', playerRule]),
            ...(prefs ? [turnOnsLine(n, u, { known: prefKnown('known'), suspected: prefKnown('suspected'), unknown: sentPrefs(player.state, signs?.user, null, 'player').some(([id]) => !['known', 'suspected'].includes(knowledgeEntry(player.knowledge?.[`turn:${id}`]).mode)) })] : []),
            ...(wants ? [`Now and then, give ${u} openings toward their wants and goals and let the scene brush up against their fears. ${n} doesn't know them unless ${u} has shown them.`] : []),
            `</player_character>`);
    }
    for (const [castState, list, castName] of castSets) out.push('', `<supporting_character name="${pa(castName)}">`, `Everything in this block is about ${pt(shortName(castName))}, not ${n} or ${u}.`,
        ...personalityLines(castState), ...listLines(castState, list, U, { ...people, subject: castName }), ...extraLines(castState), '</supporting_character>');
    if (castSets.length) out.push('',
        `These side characters are in the scene. Each keeps their own blend and only knows what they could have seen or heard. Not everyone needs to talk every turn, and the player still writes ${u}.`);
    if (Array.isArray(extras.skills) && extras.skills.length) out.push('', ...extras.skills.map(pt));
    if ([state, ...cast.map(p => p.state)].some(st => st?.enabled && liveWants(st).length)) guide('',
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
            if (note) out.push(`- in ${from}'s own words: \u201c${pt(note)}\u201d`);
        }
        if (standing.length && !placed) out.push(`${n} toward ${u}:`, ...standing.map(r => `- ${pt(r)}`));
        if (split) out.push('</relationships>');
        guide('', `${split ? 'In the relationships block: ' : ''}"Both ways" lines are true for both; the rest is one side, and an opinion is a view, not a fact. They count when the other person is absent too, in thoughts, talk and memories. They're about these two only: with anyone else, people act from their own feelings and history, not this dynamic. Intense or above keeps coming back; maximum drives what they do around that person, whatever it costs.${pairs.some(p => p.tags.some(t => TWO_ROLE_SHARED.has(t.id))) ? ' Where a both-ways line gives them different parts (captor and captive, grumpy/sunshine, unrequited love), the card, the chat and the one-sided lines decide who\'s who.' : ''}${pairs.some(p => p.memories.length) ? ' Memories really happened and come back at their strength.' : ''}${relationships.some(r => r.isPlayer) ? ` On ${u}'s side, ${n} only acts on what they know or suspect.` : ''}${standing.length ? ` The ties are who they are to each other and change slowly; where it stands and the dynamic are how it's going lately. Where the two pull apart, write the strain between them rather than dropping either. Friendship, romance and trust move separately, and so do control and pull: whoever holds the keys can still be the one who gives way.` : ''}${relationships.some(r => r.tags.some(t => t.category === 'How it shows')) ? ` Lines on how someone shows it decide what a feeling looks like on the page: it can be strong and still come out as an insult, a gift or a locked door.` : ''}`);
        if (!split) out.push('</relationships>');
    }
    if (signed || [state, ...cast.map(p => p.state)].some(st => st?.enabled && livePrefs(st).length)) guide('',
        `Turn-ons and turn-offs are what draws someone in or puts them off in others, never what they're like themselves. One lands whenever the scene contains it, whoever brings it: attention snags, desire or disgust jumps, and it changes what they do next. At strong and above they steer toward their kinks when there's an opening.${signed ? ` One marked \u201cin [name]: \u2026\u201d is part of who that person is, so it's in play whenever they're together without anyone raising it: it colours how they're seen from the start and builds over time, and a turn-off keeps grating. \u201cThe opposite\u201d of a turn-off counts in their favour.` : ''}`);
    if (lit && (lit.turns?.size || lit.traits?.size || lit.free?.length)) {
        // The mood they're in changes how hard it lands: aroused, a turn-on hits harder; angry, a turn-off does.
        const strongest = test => live(state).filter(m => analysed(m) && test(m) && state.moods[m.id] >= 41).sort((a, b) => state.moods[b.id] - state.moods[a.id])[0];
        const heat = [...lit.turns ?? []].some(id => state.prefs?.[id] > 0) || lit.traits?.size ? strongest(m => AROUSED.has(m.id)) : null;
        const temper = [...lit.turns ?? []].some(id => state.prefs?.[id] < 0) || lit.free?.some(x => x.off) ? strongest(m => m.category === 'angry') : null;
        out.push(`Anything marked \u201clit last reply\u201d was set off by that reply: it counts one step stronger now, keeps pulling at ${n}'s attention and body, and ${n} goes after more of it (or away from a lit turn-off) if the scene allows.${heat ? ` ${n} is ${pt(lowerLabel(heat.label))} right now, so a lit turn-on hits harder still.` : ''}${temper ? ` ${n} is ${pt(lowerLabel(temper.label))} right now, so a lit turn-off bites harder and is slow to let go.` : ''}`);
    }
    // Cravings and combos.
    if (lit?.craving?.size) out.push(`A craving is a strong turn-on that hasn't come up in a while: ${n} starts steering toward it with hints, tests and small provocations, and gets restless when the scene won't give it.`);
    for (const c of lit?.combos ?? []) out.push(`Combo from what just lit up (${pt(c.name)}): ${pt(c.text)}. Let it shape the next beat.`);
    if ([...mine, ...theirs].some(m => COMPARISONS.has(m.id)) || relationships.some(r => r.tags.some(t => COMPARISONS.has(t.id) || t.id === 'richer')) || pairs.some(p => p.moods.size_difference > 0) || between) out.push('',
        `Differences in height, size, age and so on get played up as much as their strength says: noticed, felt and used.`);
    const ageGapStrength = Math.max(mine.some(m => m.id === 'age_gap') ? state.moods.age_gap : 0, theirs.some(m => m.id === 'age_gap') ? player.state.moods.age_gap : 0,
        ...relationships.map(r => r.relation.moods.age_gap ?? 0), ...pairs.map(p => p.moods.age_gap ?? 0));
    if (ageGapStrength) out.push('',
        `Keep their ages as written. The age gap shows at its strength in how they look side by side, the lives they've led and what each takes for granted${ageGapStrength >= 91 ? `, and at this strength the reply is built around that contrast` : ageGapStrength >= 61 ? `, and it keeps coming back` : ''}. Their other settings decide what they make of it.`);
    // Period first, then what happens, then how it reads: style settings aren't plot.
    // A regional era replaces its plain decade, so the period isn't described twice.
    const replaced = new Set(story.filter(m => ERA_LOCALE[m.id]).map(m => ERA_LOCALE[m.id].replaces));
    const eras = story.filter(m => m.category === 'era' && !replaced.has(m.id)), styles = story.filter(m => STYLE_CATEGORIES.has(m.category) && m.category !== 'craft');
    // Cleaner writing is the player's rules for the prose, so it goes last, as plain sentences, and outranks any author.
    // The two steam rules only go while the scene is intimate or someone's aroused, so they cost nothing otherwise.
    const rules = story.filter(m => m.category === 'craft' && m.id !== 'pattern_breaker' && (!STEAM_RULES.has(m.id) || gate.intimate)).sort((x, y) => storyState.moods[y.id] - storyState.moods[x.id]);
    const breaker = story.some(m => m.id === 'pattern_breaker') ? patternLines(extras.patterns, storyState.moods.pattern_breaker) : [];
    // Dialect: the strongest regional era sets narration; a second one only covers its own speakers.
    const locales = [...new Set(eras.filter(m => ERA_LOCALE[m.id]).sort((a, b) => storyState.moods[b.id] - storyState.moods[a.id]).map(m => ERA_LOCALE[m.id].locale))];
    const stakes = story.filter(m => m.category === 'stakes' && !OWN_LINE.has(m.id));
    const plot = story.filter(m => !['era', 'stakes'].includes(m.category) && !STYLE_CATEGORIES.has(m.category) && !OWN_LINE.has(m.id));
    const peakOf = list => Math.max(0, ...list.map(m => storyState.moods[m.id]));
    const plotPeak = peakOf(plot), stylePeak = peakOf(styles), authorPeak = peakOf(styles.filter(isAuthor));
    // Narration and dialogue given to different authors (Story \u203a an author's "Narration" or "Dialogue" button).
    const roleSplit = styles.some(m => isAuthor(m) && storyState.authorRole?.[m.id]);
    // The period as one plain instruction and a short line, then what it does to the things in play.
    const year = storyState?.targets?.year ? `, exactly ${pt(storyState.targets.year)}` : '';
    if (eras.length) {
        const eraLines = [...eras].sort((a, b) => storyState.moods[b.id] - storyState.moods[a.id]).map((m, i) => `${i ? 'It also touches on' : 'Keep the story set in'} ${/^\d+s$/.test(m.label) ? 'the ' : ''}${m.label}${i ? '' : year}. ${m.cue[0].toUpperCase()}${m.cue.slice(1)}.`);
        const eraRule = `Keep technology, money, slang, manners, laws, medicine and attitudes true to it, with no anachronisms. People talk like people of the time, casual and full of contractions, never stiff or archaic. Modern labels in these notes (trauma bond, gaslighting, narcissist) are shorthand: show them through period words and behaviour.`;
        const lensLines = extras.lenses?.length ? [`What the period does to what's in play. It's the world around them, not who they are: it shows up in what other people expect, say and risk, and now and then as tension when ${n} and ${u} don't fit it. It doesn't change how either of them acts or who leads between them; mood, wants and nature decide that, and the period can be defied, hidden or ignored:`, ...extras.lenses.map(pt)] : [];
        if (split) { fx.push('', ...eraLines, eraRule, ...(locales.length ? [LOCALE_MARK] : [])); if (lensLines.length) out.push('', ...lensLines); }
        else out.push('', ...eraLines, ...lensLines, eraRule, ...(locales.length ? [LOCALE_MARK] : []));
    }
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
    // A wildcard: picked here, not by Claude, so it's actually random; its strength is how often (out of 100 replies).
    const wild = story.some(m => m.id === 'wildcards') ? wildcardOf(storyState.moods.wildcards, extras.seed) : '';
    if (wild) out.push('', `Wildcard for this reply: ${wild}. Grow it from something already in the scene (a person, object, place or rule) so it makes sense looking back, and let it change what happens next. What the player wrote for ${u} still happens as written.`);
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
    const view = viewpointLines(views, n, u, storyState?.moods);
    if (view.guide.length) guide('', ...view.guide);
    if (styles.length) guide('', `How it's written:`, ...listLines(storyState, styles, U), '',
        `These set the voice of the whole reply, first line to last, with no drifting back to a default style. Use contractions (doesn't, can't, he's) the way people talk, in narration and dialogue.${stylePeak >= 91 ? ' An overwhelming one shapes every sentence.' : ''}`,
        ...(authorPeak ? [`Authors set the voice, and they outrank the other writing styles here: where a style and an author pull different ways on sentence length, rhythm or how much is described, follow the author.${rules.length ? ' The prose rules at the end of these notes outrank the authors: where an author is known for something a rule leaves out (fragments, one-line paragraphs, em dashes), follow the rule and carry the voice through word choice, rhythm and what the eye lingers on.' : ''} Each one's notes cover prose, dialogue, minds (how inner life is shown), people (how characters are drawn) and hallmarks, and all of it is technique to use: sentence length and shape, punctuation, paragraphing, rhythm, word choice, how people talk, how close the narration sits to a mind, what the eye lingers on, how much of desire or violence is on the page, and what gets left out. The books named only say which voice is meant; take nothing from their plots, characters, personalities, settings or famous lines, and don't make anyone here more like a character of theirs. ${views.length ? 'Keep the point of view and tense set in these notes exactly.' : `Keep this chat's own person and tense exactly: first stays first, third stays third, past stays past, present stays present, and the same people narrate.`} Words like first person, close third, present tense or alternating chapters in the notes describe how the author wrote, not what to write here; carry the voice into this chat's own point of view, characters, setting and era. Mix them at their strengths${authorPeak >= 61 ? '; the strongest should be recognisable in every paragraph, as if they wrote this reply' : ''}, and keep your own judgement about what the scene needs.`] : []),
        ...(roleSplit ? [AUTHOR_SPLIT] : []));
    // With the guide split off, a short line here keeps the voice in force right before the reply.
    if (split && styles.length) out.push('', `Write this reply in the voice set in the guide (${styles.filter(m => storyState.moods[m.id] >= 41).sort((a, b) => storyState.moods[b.id] - storyState.moods[a.id]).slice(0, 4).map(m => `${m.label}${storyState.authorRole?.[m.id] ? ` for ${storyState.authorRole[m.id]}` : ''}`).join(', ') || styles[0].label}), from the first line to the last.`);
    if (breaker.length) out.push('', ...breaker);
    // The highest settings get named again at the end, where they carry the most weight.
    const top = [[state, mine, n, N], [player?.state, theirs, `${u}, as ${n} reads it`, U], ...castSets.map(([st, list, nm]) => [st, list, pt(shortName(nm)), nm]), [storyState, story.filter(m => m.id !== 'wildcards' && m.category !== 'craft'), 'the story', N]]
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
            ...sentPrefs(st, st === state ? signs?.char : st === player?.state ? signs?.user : null, st === state ? lit?.turns : null, st === player?.state ? 'player' : 'char').filter(([, v]) => Math.abs(v) >= 81).map(([id, v]) => `turn-${v > 0 ? 'on' : 'off'}: ${pt(TURN_BY_ID[id].noun ?? TURN_BY_ID[id].prompt)} (${tierWord(Math.abs(v))})`),
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
    // Aftermath and contagion (engine/echoes.js): what a feeling leaves behind, and what rubs off.
    if (extras.echoes?.length) out.push('', ...extras.echoes);
    if (split) { if (boardLines.fixed?.length) fx.push('', ...boardLines.fixed); if (weaveLines.length) fx.push('', ...weaveLines); }
    if (boardLines.length) out.push('', ...boardLines);
    if (split ? weaveLines.live?.length : weaveLines.length) out.push('', ...(split ? weaveLines.live : weaveLines));
    if (top.length) out.push('', `Turned up highest, so these need to land hard: ${top.join('; ')}.${top.length > 1 || top[0].includes(',') ? ` They all hit at once and change each other${extras.blendPlan !== false ? '' : ': write the combined state, with single actions, lines and details that carry several of them together'}.` : ''}`);
    const strongCount = [[state, mine], [player?.state, theirs], [storyState, story], ...castSets].reduce((sum, [st, list]) => sum + list.filter(m => st.moods[m.id] >= 61).length, 0)
        + relationships.reduce((sum, r) => sum + r.tags.filter(t => r.relation.moods[t.id] >= 61).length, 0) + pairs.reduce((sum, p) => sum + p.tags.filter(t => p.moods[t.id] >= 61).length, 0);
    if (extras.blendPlan !== false && (top.length || strongCount >= 3)) out.push('',
        `Before you write, use your thinking to settle how the strongest settings combine in this exact moment: what each one looks like here, where they pull against each other, and which actions, lines and details carry several at once. Keep that planning in your thinking; the reply is the scene${weaveOn ? ', then the hidden line' : ''}.`);
    out.push('', `Weave it all into the same moments instead of taking turns, and don't water anything down because the list is long; when two strong ones pull different ways, write both. ${boardLines.length ? 'Outside the board, show' : 'Show'} it through what people do, say, think and notice, never by naming it.${state.sceneBreathing !== false ? ' Keep the scene moving.' : ''} End the story on ${rules.some(m => m.id === 'prose_no_fragments') ? 'an action or a line inside a full paragraph' : 'an action, a line or an image'}, with no closing paragraph that sums up or names a feeling the scene already showed. Never mention these notes in the story${weaveOn ? '; the hidden line after it is the one place they get an answer' : ''}.`);
    if (view.last) out.push('', view.last);
    // Last, closest to the reply: the prose rules as full sentences, firm ones apart from lighter ones.
    const firm = rules.filter(m => storyState.moods[m.id] >= 61), light = rules.filter(m => storyState.moods[m.id] < 61);
    if (firm.length) out.push('', `These are the player's rules for the prose. They hold in every paragraph of every reply, inside any author's voice or style above, and they matter more to the player than any single beat. Earlier replies in this chat may not follow them; write this one by the rules rather than copying their layout. ${firm.map(m => m.cue).join(' ')}`);
    if (light.length) out.push('', `${firm.length ? 'The player also likes these' : 'The player likes these'}, where they fit the moment. ${light.map(m => m.cue).join(' ')}`);
    // The hidden line goes last of all (1.96.2): the prose rules and the line about ending the story sit just above it,
    // and with the note split its full format is far up in the guide, so Opus 5.5 was ending on the story and leaving it out.
    if (weaveOn) out.push('', `Required in every reply, after the story's last line: the hidden line for Moodweaver, on its own line after a blank line, starting <!-- weave: and ending -->, with what changed this reply in the shape ${split ? 'the guide' : 'above'} sets out, or <!-- weave: none -->. Write it in the reply itself, never only in your thinking. Without it the player's tracker misses the whole reply.`);
    // An American lead respells the whole note, so its own British spelling can't pull the reply that way.
    const dialect = [LOCALE_RULES[locales[0]], ...locales.slice(1).map(l => LOCALE_SPEAKERS[l])].join(' ');
    const finish = lines => { let text = lines.join('\n'); if (locales[0] === 'us') text = toAmerican(text); return text.replace(LOCALE_MARK, dialect); };
    const fixed = split && fx.length ? `<moodweaver_guide focus_character="${pa(N)}">\nHow to read the Moodweaver notes that come just before each reply, and the formats they ask for. The notes say what is true right now and outrank this guide wherever the two differ.\n\n${finish(fx).replace(/^\n+/, '')}\n</moodweaver_guide>` : '';
    return { prompt: `<moodweaver focus_character="${pa(N)}">\n${finish(out)}\n</moodweaver>`, fixed };
}
// Point of view and tense, as full instructions (Story \u203a Point of view & tense). One narrator and one tense at a
// time (ONE_OF in catalogue/story.js); if an old chat has two on, the strongest wins. Second person goes with any
// narrator. The full wording goes with the guide; a one-line reminder goes last, next to the prose rules, because
// earlier replies in another point of view pull hard and the end of the note carries the most weight.
const NARRATORS = ['pov_close_third', 'pov_close_third_coloured', 'pov_first', 'pov_omniscient', 'pov_outside'], TENSES = ['present_tense', 'pov_past_tense'], GAZES = ['gaze_artful', 'gaze_leering'];
export function viewpointLines(views, n, u, moods = {}) {
    const on = id => views.some(m => m.id === id), pick = ids => ids.filter(on).sort((a, b) => (moods[b] ?? 0) - (moods[a] ?? 0))[0] ?? '';
    const narrator = pick(NARRATORS), tense = pick(TENSES), you = on('second_person'), gaze = pick(GAZES);
    if (!narrator && !tense && !you && !gaze) return { guide: [], last: '' };
    const them = you ? `${u} (written as "you")` : u;
    const youLine = you ? `The narration calls ${u} "you": you feel the cold, ${n} looks at you. ${narrator === 'pov_first' ? `${n} stays "I", and everyone else is` : `${n} and everyone else are`} called by name or pronoun.`
        : ['pov_first', 'pov_close_third', 'pov_close_third_coloured'].includes(narrator) ? `${u} is called by name or pronoun, never "you".` : '';
    const NARRATE = {
        pov_close_third: `Narrate in close third person from ${n}'s point of view. The narrator calls ${n} by name or pronoun, never "I", and stays with ${n} for the whole reply. Only what ${n} sees, hears, feels and knows reaches the page, in the order ${n} notices it, and people and places are described the way ${n} sizes them up, so the reader sees the world through ${n}'s eyes and attitudes. The narrator's own sentences stay clear, standard narrative prose, not ${n}'s speaking voice: ${n}'s slang, grammar, accent and swearing belong in what ${n} says aloud and, now and then, a short direct thought in italics. A narrator that slips into a character's accent reads like an impression of them, which the player dislikes. ${n}'s feelings come through in what ${n} notices, does and avoids thinking about, not in the narrator naming or explaining them. Everyone else's mind stays closed: ${them} and the others are known only by what ${n} sees, hears and guesses, and ${n} can guess wrong.`,
        pov_close_third_coloured: `Narrate in close third person from ${n}'s point of view, with ${n}'s attitude colouring the narration. The narrator calls ${n} by name or pronoun, never "I", and stays with ${n} for the whole reply. Only what ${n} sees, hears, feels and knows reaches the page, in the order ${n} notices it. The narration keeps normal, correct grammar and never writes ${n}'s accent or dialect: "${n} saw her" is fine, "${n} seen her" or "ain't" in the narration is not. Within that, ${n}'s way of seeing leaks in now and then: an occasional swear word or bit of ${n}'s own slang, from ${n}'s time, place and kind of life, a blunt, crude or judging description of a person or thing, and ${n}'s gaze in what gets noticed and lingered on, including how ${n} looks at someone ${n} wants. Keep these touches sparing, about one or two a paragraph set into otherwise plain narration, so they read as ${n}'s attitude showing through, never as the narrator putting on a voice, which the player finds cringe. Plain words beat trendy ones: leave out the fake-cool words a writer reaches for to sound edgy (clocked, the audacity, lowkey, zero chill, a whole thing), which read as the writer trying to be cool rather than as ${n}. ${n}'s full slang, grammar and accent stay in what ${n} says aloud. ${n}'s feelings come through in what ${n} notices and does, not in the narrator naming or explaining them. Everyone else's mind stays closed: ${them} and the others are known only by what ${n} sees, hears and guesses, and ${n} can guess wrong.`,
        pov_first: `Narrate in first person as ${n}. The narrator is ${n}, saying "I", and the whole reply, description included, is told in ${n}'s own voice: ${n}'s vocabulary, grammar, slang and rhythm, because the point of first person is hearing how ${n}'s mind works. Only what ${n} perceives, knows and believes reaches the page. ${n} can be biased, wrong or self-deceived, and the reader may see more than ${n} admits. ${n} doesn't explain or analyse feelings in tidy, modern language; they show in what ${n} notices, dwells on, skips over and does. ${them} and everyone else are seen from outside: ${n} knows only what they say and do, and what ${n} guesses.`,
        pov_omniscient: `Narrate in omniscient third person: a narrator outside everyone, who can move between the people in the scene, show what one of them can't see, and know more than any of them. Change whose thoughts are shown only at a paragraph break, so it's always clear whose head the reader is in. ${u}'s thoughts and feelings are the player's to write, so the narrator shows ${u} from outside and goes inside everyone else freely.`,
        pov_outside: `Narrate in third person from outside, like a camera in the room: only what could be seen and heard reaches the page, and nobody's thoughts or feelings are named, ${n}'s included. Inner life shows only through action, faces, voices, silences and what people do with their hands, so the reader reads people the way the characters have to.`,
    };
    // A male gaze goes with any narrator. It's whose eye the narration looks through, so with a narrator outside
    // everyone it's the narration's own eye. No sample words: Opus repeats any it's given.
    const inside = ['pov_close_third', 'pov_close_third_coloured', 'pov_first'].includes(narrator) || !narrator;
    const eye = inside ? `${n}'s eye` : `The narration's eye, ${n}'s whenever the scene is with ${n},`;
    const GAZE = {
        gaze_artful: `Male gaze, artful. ${eye} looks at ${u}, and at anyone else ${n} wants, the way a painter or a cameraman would. It lingers, frames and comes back: how the light falls on them, the shape and lines of their body, how their clothes sit and move, how they hold themselves, the small habits they don't know they have, all in close, exact physical detail held a beat longer than the scene strictly needs. The looking is slow, admiring and sensual, and it is the point: the person is studied as something beautiful, and what the eye keeps returning to says as much about ${n} as about them. Keep it precise and specific to this body in this light, never generic praise, and never crude. Set one or two of these lingering looks into each reply, woven into the action and talk, so the scene keeps moving.`,
        gaze_leering: `Male gaze, leering. ${eye} is a leering man's. It goes to ${u}'s body before the face, and to anyone else ${n} fancies the same way, sizes them up in crude, appraising, possessive terms, picks out what they might rather keep covered, and keeps sliding back to it while the talk is about something else. The descriptions are frankly sexual and objectifying, coarse rather than pretty, and the appetite shows in what gets picked out and how long it's held. It happens in everyday scenes and arguments too, not only in heated ones, and it colours the narration without pushing the plot toward sex. The narration keeps normal, correct grammar; the crudeness is in the choice of words and what is looked at, in plain coarse words from ${n}'s own time and kind of life, never trendy slang. The leer belongs to ${n}, so the narration never judges, excuses or softens it, and never turns it into romance. Keep it to the looking and the thoughts behind it: what ${u} does and feels stays the player's to write.`,
    };
    const TENSE = {
        present_tense: `Write the narration in present tense: she turns, he says, the door opens. Keep to it through the whole reply, action and sex included. Drop into past tense only for what happened before this scene (a memory, backstory), then come straight back to present. Dialogue uses whatever tense people would naturally speak in.`,
        pov_past_tense: `Write the narration in simple past tense: she turned, he said, the door opened. Keep to it through the whole reply. Use "had" only briefly to step back to something earlier, then return to simple past. Dialogue uses whatever tense people would naturally speak in.`,
    };
    const guide = [`Point of view and tense, set by the player for this chat. They hold in every sentence of every reply, inside any author's voice or style.`,
        ...[NARRATE[narrator], youLine, TENSE[tense], GAZE[gaze]].filter(Boolean)];
    const NAME = { pov_close_third: `close third person, staying with ${n}`, pov_close_third_coloured: `close third person, staying with ${n}, in plain grammar with ${n}'s attitude showing through a touch or two a paragraph`, pov_first: `first person as ${n}`, pov_omniscient: 'omniscient third person', pov_outside: 'third person from outside, nobody\'s thoughts' };
    const parts = [NAME[narrator], you ? `${u} as "you"` : '', tense === 'present_tense' ? 'present tense' : tense ? 'past tense' : '', gaze === 'gaze_artful' ? `an artful male gaze on ${u}` : gaze ? `a leering male gaze on ${u}` : ''].filter(Boolean);
    const last = `Point of view: ${parts.join(', ')}. Earlier replies may use a different one; write this reply in the one set here, from the first sentence to the last.`;
    return { guide, last };
}

export async function budgetPrompt(state, name, budget, countTokens, extras = {}) {
    const all = [...live(state), ...live(extras.player?.state), ...live(extras.story), ...liveCast(extras).flatMap(person => live(person.state).filter(m => m.kind !== 'story'))];
    const { prompt, fixed } = composePrompt(state, name, extras);
    const tokens = prompt ? await countTokens(prompt) : 0, fixedTokens = fixed ? await countTokens(fixed) : 0;
    // The target is a warning only. Nothing the player set is ever dropped or shortened. With the note split, the
    // target applies to the part sent fresh: the cached guide costs a fraction after the first reply.
    return { prompt, fixed, tokens: tokens + fixedTokens, liveTokens: tokens, fixedTokens, compact: false, overBudget: Math.max(0, tokens - budget), target: budget,
        selectedIds: [...all.map(m => m.id), ...[state, extras.player?.state, ...liveCast(extras).map(p => p.state)].flatMap(activePersonalities).map(p => `${p.system}:${p.type}`), ...relationshipSets(state, String(name ?? '').trim() || 'the character', extras)
            .flatMap(({ name: subject, relation, tags }) => tags.map(tag => `${subject}:${relationshipKey(relation, tag.id)}`))], omittedIds: [], omitted: 0 };
}

// How the player's turn-ons come into the story, by how much the character knows. Exported for tests/pronouns.mjs.
export function turnOnsLine(n, u, { known = false, suspected = false, unknown = false } = {}) {
    return pronounize(`${u}'s turn-ons belong in the story whether or not ${n} knows them, one or two at a time, each given a few replies to build before the next comes in.${known ? ` The ones ${n} knows about, ${n} uses on purpose and knowingly, in character: the right words, timing and touch, teasing with them, holding them back, rewarding with them, and watching what they do to ${u}.` : ''}${suspected ? ` The ones ${n} suspects, ${n} tests quietly and reads ${u}'s reaction.` : ''}${unknown ? ` The ones ${n} doesn't know about still turn up, every few replies, through how ${n} and others already look, sound and act, by chance as far as anyone in the story can tell. Nobody changes to match, and ${n} only learns them from how ${u} reacts.` : ''} Let a turn-off crop up sometimes for friction.`, n, u);
}
