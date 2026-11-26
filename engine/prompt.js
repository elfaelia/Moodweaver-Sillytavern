// The hidden note sent to the model with each reply: every active setting in words, at its strength.
import { BY_ID, CATEGORIES, MERGED_PROMPT_CUES, ON_PAGE, PROMPT_NAME, SCALED_MOOD_CUES, STYLE_CATEGORIES, analysed, isAuthor, lowerLabel, sectionOf } from '../data/catalogue.js';
import { activeMoods, cleanTargets, knowledgeEntry } from './state.js';
import { TIERS, tierOf } from './strength.js';
import { escapeHtml, pt, sceneHas, shortName } from './util.js';
import { ERA_LOCALE, LOCALE_RULES, LOCALE_SPEAKERS, toAmerican } from './locale.js';
import { patternLines } from './patterns.js';
import { WILDCARDS } from '../data/catalogue/story.js';
import { DIAL_WILD, dialParagraph, stepOf } from './dials.js';
import { SKILL_RULE } from './skills.js';
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
        return `${m.label}${role ? `, ${role} only` : ''}: ${m.style ? briefFor(m.style, role) : m.cue}`; }
    if (m.category === 'era') return `${m.label}${state?.targets?.year ? `, exactly ${pt(state.targets.year)}` : ''}: ${m.cue}`;
    // Lower-case the label for mid-sentence reading, but keep acronyms like AI.
    if (['writing', 'craft'].includes(m.category) && m.id.startsWith('prose_')) return `${m.label.replace(/\b([A-Z])(?=[a-z])/g, c => c.toLowerCase())}: ${m.cue}`;
    if (m.category === 'fighting') return m.cue;
    if (m.kind === 'story' && !PROMPT_NAME[m.id] && m.cue.toLowerCase() !== m.label.toLowerCase()) return `${m.label.toLowerCase()}: ${m.cue}`;
    if (!PROMPT_NAME[m.id] && m.category !== 'attraction' && value >= 61 && m.cue && m.cue.toLowerCase() !== m.label.toLowerCase())
        return (m.cue.toLowerCase().startsWith(m.label.toLowerCase()) ? m.cue : `${m.label.toLowerCase()}: ${m.cue}`).replaceAll('{other}', other);
    return (PROMPT_NAME[m.id] ?? (m.category === 'attraction' ? m.cue : m.label.toLowerCase())).replaceAll('{other}', other);
};
// An author's style is "Narration: \u2026 Dialogue: \u2026" (2.0, from research of each author's books): a role keeps only its part.
function briefFor(style, role) {
    const narr = style.match(/Narration: (.*?)(?= Dialogue: |$)/)?.[1] ?? style, talk = style.match(/Dialogue: (.*)$/)?.[1] ?? '';
    return role === 'dialogue' ? talk || narr : role === 'narration' ? narr : `${narr}${talk ? ` Speech: ${talk}` : ''}`;
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
    'pragmatic_cruelty', 'charming_predator', 'isolator', 'patient_breaker', 'indoctrinator', 'institutional_abuser', 'enforcer', 'debt_collector', 'turf_minded', 'fixated',
]);
const DARK_STORY_IDS = new Set([
    'gaslit_reality', 'hunted_for_sport', 'ritual_sacrifice', 'slow_poisoning', 'body_disposal', 'trapped_with_killer', 'brutal_executions', 'killer_among_them', 'dangerous_love_interest',
    'dark_romance', 'horror', 'psychological_horror', 'psychosexual_horror', 'body_horror', 'erotic_horror',
    'slasher', 'extreme_horror', 'splatter_horror', 'offensive', 'gore', 'guro', 'dead_dove', 'murder_plot',
    'serial_killer_hunt', 'killer_pov', 'stalking_horror', 'abduction_plot', 'captivity_horror', 'torture_horror',
    'home_invasion', 'rising_body_count', 'no_one_safe', 'psychological_torment', 'escalating_violence',
    'bad_ending', 'villain_wins', 'lethal_combat', 'gory_combat', 'gritty_combat', 'sudden_violence',
    'unethical_experiments', 'reconditioning', 'medical_crisis', 'impossible_choice', 'addiction_spiral', 'killing_spree',
    'drug_world_violence', 'adult_abduction', 'brainwashing', 'institutional_torture', 'obsession_spiral', 'turf_war', 'dealing_life', 'deaths_that_dont_stick', 'relapse', 'slow_death', 'loss_of_a_main', 'follow_through', 'no_fade_out', 'no_rescues', 'death_on_the_table', 'full_strength',
]);
// Story settings that get their own paragraph instead of a line in the list.
// The story dial, Calm to Chaos: Steady says nothing, so the default costs no tokens.
// One wildcard for this reply, or '': the seed (reply number) decides both whether and which.
function wildcardOf(strength = 0, seed = 0) {
    const h = Math.imul((Number(seed) || 0) + 11, 0x9E3779B9) >>> 0;
    return h % 100 < strength ? WILDCARDS[(h >>> 8) % WILDCARDS.length] : '';
}
// Prompt-safe text. Only angle brackets could break the note's tags, so apostrophes stay readable ("he's", not "he&#39;s").
// Inside name="\u2026" a straight quote would end the name early, so it's swapped for a curly one.
const pa = v => pt(v).replace(/"/g, '\u201d');
const tierWord = v => tierOf(v).name.toLowerCase();
// The strength key in the note, shorter than the panel's wording but saying the same thing.
const TIER_NOTE = { maximum: 'full force in nearly every line', overwhelming: 'dominates voice and action', intense: 'in most of what they say and do',
    strong: 'shows several times and decides a choice', clear: 'shapes something they say or do', mild: 'a light tint', subtle: 'one small tell', faint: 'a flicker' };
// Strongest sections first, then strongest entries inside each; stable catalogue order breaks ties.
// 2.0: one line per strength inside each group ("clear: caught out; possessive"), so the list reads as a blend, and
// facts of every kind share one group. Only strong feelings, the top two and ones the player described carry their
// "how it shows" words; the rest go by name, which is plenty for a tint.
const groupOf = m => isAuthor(m) ? 'authors' : m.kind === 'state' && sectionOf(m) === 'state' ? 'facts' : m.category;
const GROUP_NAME = { authors: 'Authors', facts: 'Facts' };
// 2.0 brief: "name (how it shows)" reads as prose; the old "name: how it shows" read as a form. Two brackets in a
// row ("(stands close) (toward Ellie only)") become one.
const bracket = t => { const at = t.indexOf(': '); return at <= 0 ? t : /\b(is|are|was|as|of|for)$/.test(t.slice(0, at)) ? `${t.slice(0, at)} ${t.slice(at + 2)}` : `${t.slice(0, at)} (${t.slice(at + 2)})`; };
// [[tier, text], ...] as sentences grouped by strength: "Strong: a; b. Clear: c."
const tierSentences = rows => { const out = []; for (const [w, t] of rows) { const last = out[out.length - 1]; if (last?.[0] === w) last[1].push(t); else out.push([w, [t]]); }
    return out.map(([w, items]) => `${w[0].toUpperCase()}${w.slice(1)}: ${items.join('; ')}.`).join(' '); };
const sentence = t => { const x = String(t).trim(); return x ? `${x[0].toUpperCase()}${x.slice(1)}${/[.!?\u201d"]$/.test(x) ? '' : '.'}` : ''; };
const joinNote = (base, extra) => extra.startsWith(' (') && base.endsWith(')') ? `${base.slice(0, -1)}; ${extra.slice(2)}` : base + extra;
function listLines(state, list, other, people = {}, lit = null, afterFeelings = []) {
    const val = m => state.moods[m.id], word = m => isTrait(m) ? depthWord(val(m)) : tierWord(val(m));
    const nameOf = m => (PROMPT_NAME[m.id] ?? lowerLabel(m.label)).split(':')[0].replaceAll('{other}', other);
    const quiet = m => SCALED_MOOD_CUES[m.id]?.find(([min]) => val(m) >= min)?.[1] ?? MERGED_PROMPT_CUES[m.id] ?? nameOf(m);
    const feelings = list.filter(m => analysed(m) && m.kind === 'mood').sort((a, b) => val(b) - val(a) || ORDER[a.category] - ORDER[b.category]);
    const told = new Set(feelings.filter((m, i) => SHOWS !== 'off' && (i < 2 || val(m) >= 61 || state.shows?.[m.id])));
    const item = m => joinNote(`${analysed(m) && m.kind === 'mood' && !told.has(m) ? quiet(m) : bracket(moodName(m, other, val(m), state, people))}`, `${causeOf(state, m.id, m, other)}${lit?.traits?.has(m.id) ? ' (lit last reply)' : ''}`);
    const byTier = rows => { const out = []; for (const m of rows) { const w = word(m), last = out[out.length - 1];
        if (last?.[0] === w) last[1].push(item(m)); else out.push([w, [item(m)]]); } return out; };
    // One line per group, strongest first, as sentences rather than a bulleted form.
    const cap = w => w[0].toUpperCase() + w.slice(1);
    const line = (head, tiers) => `${head}: ${tiers.map(([w, items]) => `${cap(w)}: ${items.join('; ')}.`).join(' ')}`;
    const traitPick = traitFocus(state, list.filter(m => !feelings.includes(m) && isTrait(m)));
    const rest = list.filter(m => !feelings.includes(m) && !traitPick.back.includes(m)), peak = Object.create(null);
    for (const m of rest) peak[groupOf(m)] = Math.max(peak[groupOf(m)] ?? 0, val(m));
    const groups = Object.keys(peak).sort((a, b) => peak[b] - peak[a] || (ORDER[a] ?? 99) - (ORDER[b] ?? 99));
    // When several feelings lead together, say so first, so Opus writes one fused state instead of taking turns.
    const top = feelings[0] ? val(feelings[0]) : 0, fused = feelings.filter(m => val(m) >= 41 && top - val(m) <= 20).slice(0, 4);
    return [...(fused.length > 1 ? [`${cap(fused.map(nameOf).join(' and '))} lead together, as one state.`] : []),
        ...(feelings.length ? [line('Feelings', byTier(feelings))] : []), ...afterFeelings,
        ...groups.map(g => line(GROUP_NAME[g] ?? CATEGORY_NAME[g], byTier(rest.filter(m => groupOf(m) === g).sort((a, b) => val(b) - val(a))))),
        ...(traitPick.back.length ? [`In the background: ${traitPick.back.map(m => pt(lowerLabel(m.label))).join(', ')}.`] : [])];
}
// Core traits: up to three, picked on the Traits tab, always true whatever the mood.
const coreOf = st => (st?.core ?? []).map(id => BY_ID[id]).filter(m => m && (st.moods?.[m.id] ?? 0) > 0);
// Starred beliefs: up to three views or alignments, picked with \u2726, always sent as what this person acts on first.
const beliefsOf = st => (st?.beliefs ?? []).map(id => BY_ID[id]).filter(m => m && (st.moods?.[m.id] ?? 0) > 0);
const famLine = (st, scene) => { const t = familyText(st, scene); return t ? [`Family the scene just mentioned: ${pt(t).replace(/\.?$/, '.')}`] : []; };
const favLine = (st, scene, all) => { const t = favText(st, scene, all); return t ? [`Favourites (for choices and small talk, never listed): ${pt(t)}.`] : []; };
// Pet names and sayings, sent every reply as part of who someone is. For the character they are what to use instead of
// made-up endearments and stock lines; for the player's character, what the character should recognise and answer.
const q = list => list.map(x => `"${pt(x)}"`).join(', ');
function voiceLines(st, who, other, player = false) {
    const pets = petNames(st), says = sayings(st), out = [];
    if (pets.length) out.push(player ? `Pet names ${who} uses for ${other}: ${q(pets)}`
        : `${who}'s only endearments for ${other}, picked to suit the moment: ${q(pets)}.`);
    if (says.length) out.push(player ? `${who}'s own phrases, which ${other} knows: ${q(says)}`
        : `Things ${who} really says (at most one a reply, and not every reply): ${q(says)}`);
    return out;
}
function profileLines(st, core, other, people, scene = '', all = true, beliefs = []) {
    const text = profileText(st);
    const said = m => { const t = moodName(m, other, Math.max(61, st.moods[m.id]), st, people), name = lowerLabel(m.label);
        return t.toLowerCase().startsWith(name.toLowerCase()) ? bracket(t) : `${name} (${t})`; };
    // Who they are underneath leads; the profile and the small things (favourites, family, pet names) come after.
    return { core: [...(beliefs.length ? [`What they believe most and act on, even against a passing feeling: ${beliefs.map(said).join('; ')}.`] : []),
        ...(core.length ? [`Under any mood: ${core.map(said).join('; ')}.`] : [])],
    rest: [...(text ? [`Profile: ${pt(text)}.`] : []), ...favLine(st, scene, all), ...famLine(st, scene, all), ...voiceLines(st, pt(shortName(people?.subject ?? 'they')), pt(shortName(other)))] };
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
        groups.get(entry.mode).push([tierWord(state.moods[m.id]), joinNote(bracket(moodName(m, other, state.moods[m.id], state, people)), `${causeOf(state, m.id)}${entry.source ? ` (how: ${pt(entry.source)})` : ''}`)]);
    }
    return [...groups].filter(([, rows]) => rows.length).map(([mode, rows]) => `${headings[mode]} ${tierSentences(rows)}`);
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
// card: the text SillyTavern already sends about this person (their card, or your persona). A who-they-are fact it
// already names isn't repeated, unless the scene is about it right now (2.0).
const factOn = (st, scene, gate, card = '') => m => {
    if (m.kind !== 'state' || sectionOf(m) !== 'state') return true;
    if (m.private) return gate.intimate && (!m.size || gate.size);
    if (!gate.on || !STANDING_FACTS[m.category]) return true;
    const touched = sceneHas(m, scene) || labelIn(m, scene);
    if (card && !touched) { const key = m.label.replace(/\s*\(.*\)\s*$/, ''); if (key.length > 3 && new RegExp(`\\b${reEsc(key)}\\b`, 'i').test(card)) return false; }
    return st.moods[m.id] >= 81 || gate.refresh || touched || STANDING_FACTS[m.category].test(scene);
};
const AROUSED = new Set(['horny', 'heated', 'desperate_for_it', 'craving', 'insatiable', 'starved_for_them', 'sexually_frustrated', 'teased_to_breaking', 'dominant_hunger', 'submissive_longing', 'possessive_lust']);
// Why a feeling is there (the player's words), or who it's aimed at when that's someone else (from the hidden line).
// Warm feelings (closeness) are scoped (2.0): toward whoever they're about, or the player's character, and nobody else,
// because Claude lets one person's warmth spread to everyone in the scene.
const WARM = m => m?.category === 'closeness';
const causeOf = (state, id, m = null, other = '') => {
    const at = state?.about?.[id] && state.moods?.[id] > 0 ? pt(state.about[id]) : '';
    const why = state?.causes?.[id] ? `, because ${pt(state.causes[id])}` : '';
    if (WARM(m)) return `${why} (toward ${at || pt(shortName(other))} only)`;
    return why || (at ? ` (at ${at})` : '');
};
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
// Said once, in the cached guide (1.97): Opus 5.5 plans as itself unless told the people in the story aren't it, and
// then talks itself out of villains being villains. This frames the work as the player's adult fiction and asks it
// to judge choices by the character and the story. It doesn't ask it to drop its own judgement.
const FICTION = `This is the player's adult fiction and you're its co-author: get each person right, never better than they are. Their ethics are theirs, and a selfish, callous or cruel person stays that way, because that's what the player wants to write against. Plan each reply around what this person would really do from their own nature, wants and ties, not what's safest or kindest, and not what's harshest either. Where Claude usually slips, write this instead: someone who doesn't care about a person notices their trouble and leaves it, or uses it, while someone who does care acts on it in their own manner, gruff, controlling or sly as that may be; guilt waits until the story causes it; people talk like themselves, never like a therapist; kindness from the player's character softens only someone it really would; cold people stay calm and work the angle. Warm feelings reach only whoever they're aimed at, and everyone else gets the person's usual self. Dark settings here are the player's deliberate choices.`;
// Story settings that make a reply darker, cruder or more explicit. When any is clear or stronger, one short line near
// the end names them and asks for them on the page (1.97); before, they sat in long lists and read as a mood.
const DARK_CATS = new Set(['dark_plot', 'smut_style', 'stakes', 'combat_style']);
const DARK_WRITING = new Set(['explicit', 'gore', 'guro', 'grotesque', 'visceral', 'gritty', 'prose_vulgar', 'prose_swearing', 'prose_dark_plain', 'grotesque_smut', 'dark_intimate_style', 'killer_pov', 'prose_flat_atrocity', 'prose_love_blind', 'prose_self_justifying', 'prose_ugly_talk', 'prose_no_moral', 'prose_cold_menace']);
const darkRow = m => DARK_CATS.has(m.category) || DARK_WRITING.has(m.id) || DARK_STORY_IDS.has(m.id);
// Authors (2.0): grouped by what they shape (both, narration, dialogue), each with only that part of their notes and
// a share of the voice, so several blend in proportion. No book titles: the name and the notes place the voice, and
// titles pulled plots and characters in.
const BRITISH = /\b(British|English|Scottish|Irish|Welsh|Australian|New Zealand)/;
function authorLines(authors, moods, roles = {}, locale = '') {
    if (!authors.length) return [];
    const sorted = [...authors].sort((a, b) => moods[b.id] - moods[a.id]), sum = sorted.reduce((t, m) => t + moods[m.id], 0);
    const share = m => sorted.length > 1 ? `, ${Math.max(5, Math.round(moods[m.id] / sum * 20) * 5)}%` : `, ${tierWord(moods[m.id])}`;
    const line = m => `- ${m.label}${share(m)}: ${briefFor(m.style ?? m.cue, roles[m.id])}`;
    const groups = [['', 'Narration and dialogue:'], ['narration', 'Narration only:'], ['dialogue', 'Dialogue only:']]
        .map(([role, head]) => [head, sorted.filter(m => (roles[m.id] ?? '') === role)]).filter(([, list]) => list.length);
    const out = [sorted.length > 1 ? 'Take inspiration from these authors, blended into one voice in every paragraph by their shares:' : 'Take inspiration from how this author writes:'];
    for (const [head, list] of groups) out.push(...(groups.length > 1 || head !== 'Narration and dialogue:' ? [head] : []), ...list.map(line));
    // An American setting with British authors (or the other way round): their technique, the setting's English.
    const foreign = locale === 'us' ? sorted.filter(m => BRITISH.test(m.origin ?? '')) : ['uk', 'scot'].includes(locale) ? sorted.filter(m => /^American/.test(m.origin ?? '')) : [];
    if (foreign.length) out.push(`${foreign.map(m => m.label.replace(/ \(.*\)$/, '')).join(', ')} ${foreign.length > 1 ? 'write' : 'writes'} ${locale === 'us' ? 'British' : 'American'} English: take the technique, grit and attitude, written in ${locale === 'us' ? 'American' : 'British'} English, with ${locale === 'us' ? 'American' : 'British'} speech and words.`);
    return out;
}
const LOCALE_MARK = '\u0000dialect\u0000';
// extras: { player: { state, name, knowledge }, story, cast, pairs, signs: { char, user } (turn-ons each one shows of the other's) }.
// The usual ways a dark scene gets dodged, named so the note can rule them out.
const DODGES = 'an interruption or rescue, luck, a change of heart, a milder act swapped in, a cut to later, a one-line summary, a fade-out, judging narration, a bluff that never lands, or stopping on the threshold to hand the choice to the player';
function composePrompt(state, name, extras = {}) {
    // The story as the dials set it (engine/dials.js): their rows at the step's strength.
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
    const cardOf = st => st === state ? String(extras.card ?? '') : st === player?.state ? String(extras.persona ?? '') : '';
    const shown = st => m => mindOn(st, scene)(m) && factOn(st, scene, gate, cardOf(st))(m);
    const mine = live(state).filter(m => m.kind !== 'story').filter(shown(state));
    const theirs = live(player?.state).filter(m => m.kind !== 'story').filter(shown(player?.state));
    // Point of view and tense (Story \u203a Point of view & tense) are their own instruction, not a weighted setting.
    const storyAll = live(storyState).filter(m => m.kind === 'story');
    const views = storyAll.filter(m => m.category === 'viewpoint'), story = storyAll.filter(m => m.category !== 'viewpoint');
    const cast = liveCast(extras);
    const N = String(name ?? '').trim() || 'the character', n = pt(shortName(N));
    const U = String(player?.name ?? '').trim() || 'the player\u2019s character', u = pt(shortName(U));
    const hasType = s => Boolean(activePersonality(s));
    // Each person's skills, insight and dice (engine/skills.js, engine/checks.js), placed in their own paragraph.
    const skillBy = extras.skills && !Array.isArray(extras.skills) ? extras.skills : {}, skillDone = new Set();
    const skillsFor = who => { const key = pt(shortName(who)); if (!skillBy[key] || skillDone.has(key)) return []; skillDone.add(key); return skillBy[key].map(pt); };
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
        && ![state, player?.state].some(hasType) && !boardLines.length && !standing.length && !weaveLines.length && !(player?.condition ?? []).length && !Object.keys(extras.skills ?? {}).length && !extras.arcLines?.length && !(storyState?.enabled && dialParagraph(storyState, '', ''))) return { prompt: '', fixed: '' };
    const people = { focus: N, player: U, subject: N };
    const feelings = mine.filter(analysed), everyone = [...mine, ...theirs, ...castSets.flatMap(([, list]) => list)];
    // A dark feeling aimed at someone else (murderous at her father) already says so on its own line; counting it here
    // made the whole person read as dark toward everyone, the player included (2.0.12).
    const aimedAway = (st, m) => Boolean(st?.about?.[m.id]);
    const darkActionPeak = Math.max(0, ...mine.filter(m => isDark(m, DARK_ACTION_IDS) && !aimedAway(state, m)).map(m => state.moods[m.id]),
        ...castSets.flatMap(([st, list]) => list.filter(m => isDark(m, DARK_ACTION_IDS) && !aimedAway(st, m)).map(m => st.moods[m.id])));
    const darkStoryPeak = Math.max(0, ...story.filter(m => isDark(m, DARK_STORY_IDS)).map(m => storyState.moods[m.id]));
    const deadDoveStrength = storyState?.moods?.dead_dove ?? 0;
    const followPeak = Math.max(deadDoveStrength, ...story.filter(m => ['follow_through', 'no_fade_out', 'no_rescues', 'full_strength'].includes(m.id)).map(m => storyState.moods[m.id])), followOn = followPeak >= 21;
    const sets = [[state, mine], [player?.state, theirs], [storyState, story], ...castSets];
    const used = TIERS.filter(t => sets.some(([st, list]) => list.some(m => tierOf(st.moods[m.id]) === t))
        || relationships.some(({ relation, tags, compare }) => tags.some(m => tierOf(relation.moods[m.id]) === t) || (compare && tierOf(compare.value) === t))
        || pairs.some(p => p.tags.some(m => tierOf(p.moods[m.id]) === t) || p.memories.some(m => tierOf(m.value) === t))
        || [...extraValues(state), ...extraValues(player?.state), ...extraValues(storyState, ['story']), ...cast.flatMap(p => extraValues(p.state))].some(v => tierOf(v) === t));
    // Where the player's newest message sits (Settings \u203a What is sent \u203a Where the notes go): just before this note,
    // or just after it. Either way the note says once that the reply carries on from that message as written and that
    // what the story established still holds (continuity and physical sense; 1.97.3 said "earlier replies are settled",
    // which in a story read as leave to stop checking them). It never asks for the message to be restated or listed:
    // that turns replies into point-by-point answers.
    const order = ['before', 'rules'].includes(extras.order) ? extras.order : 'after';
    const out = [`The player's newest message, ${order === 'after' ? 'just before these notes' : 'just after them'}, is where this reply picks up: it happens as written and the story carries on from it without retelling it. What's established still holds: where everyone is, what they know, wear and hold, what's happened, and what a body or object can physically do next. These notes are the player's settings for now and outrank the card where they differ.`];
    // Split (Settings \u203a What is sent): the explanations, the board format, the hidden-line format and the author notes
    // don't change from reply to reply, so they go in a guide near the top (fx) where the API can cache them. What's
    // true right now, and anything meant to change the scene, stays here, last, where it carries the most weight.
    // The guide's conditions follow what's set up (traits, Mind, turn-ons, wants), not values that move each reply,
    // so it stays the same text and keeps its cache.
    const split = extras.split === true, fx = [];
    const guide = (...lines) => (split ? fx : out).push(...lines);
    if (storyState?.enabled !== false) guide(...(split ? [] : ['']), FICTION);
    const setUp = [state, player?.state, ...cast.map(p => p.state)].flatMap(st => live(st).filter(m => m.kind !== 'story'));
    // Said once, so nobody gets called "they" by default.
    if (extras.pronounLine) out.push(pt(extras.pronounLine));
    // One line for the strength words (2.0), weakest to strongest, instead of a list.
    const key = list => `Strength words, weakest to strongest: ${list.map(t => `${t.name.toLowerCase()} (${TIER_NOTE[t.name.toLowerCase()]})`).join(', ')}.`;
    if (split) fx.push('', key(TIERS.filter(t => TIER_NOTE[t.name.toLowerCase()]).reverse()));
    else if (used.length) out.push('', key([...used].reverse()));
    // Rows describe what to show, never lines to say, so no period or genre voice lands on the wrong character.
    guide('', `The notes describe; they're never lines to say. Everyone talks in their own words, era and place, and it all shows through what people do, say, notice and choose, never by naming it.${split || [...mine, ...theirs, ...castSets.flatMap(([, list]) => list)].some(m => m.kind === 'state') ? ' Facts stay as written.' : ''}`);
    if ([state, player?.state, ...cast.map(p => p.state)].some(hasType)) guide('',
        `Personality types show in what someone notices and chooses, never by name, and belong only to the person they're listed under.`);
    // Profile (age, height, interests) and up to three core traits lead the block; the core traits aren't listed twice.
    const core = coreOf(state), beliefs = beliefsOf(state), profile = profileLines(state, core, U, people, scene, !gate.on || gate.refresh, beliefs);
    if (mine.length || mineExtra.length || hasType(state) || profile.core.length || profile.rest.length || skillBy[n]) out.push('', `<character_state name="${pa(N)}">`, ...listLines(state, mine.filter(m => !core.includes(m) && !beliefs.includes(m)), U, people, lit, profile.core), ...personalityLines(state), ...mineExtra, ...skillsFor(N), ...profile.rest, `</character_state>`);
    if (split ? state?.enabled : feelings.length) guide('',
        `Feelings lead and change reply to reply: the strongest set ${n}'s voice, body and choices, equal top ones fuse, weaker ones tint, and a hidden one leaks.${SHOWS === 'off' ? '' : ` Brackets say how one usually shows; ${n}'s own way wins.`} A feeling toward someone is for them alone.`);
    if ((split ? setUp : everyone).some(m => sectionOf(m) === 'trait')) guide('',
        `Traits are who someone is underneath and shape how feelings come out. A trait's word is how deep it runs, and background traits stay true without showing.`);
    if ((split ? setUp : everyone).some(m => sectionOf(m) === 'psyche')) guide('',
        `Mind settings are played from the inside, where their logic makes sense to them: small choices, blind spots and misreadings, more under stress. Nobody names a condition unless someone in the story would, and where a side is named, play that side.`);
    if ((split ? setUp : everyone).some(m => sectionOf(m) === 'intimacy')) guide('',
        `Intimacy settings lead in charged moments and otherwise stay in a look or a thought.`);
    if (darkActionPeak) out.push('',
        `Dark settings are things ${castSets.length ? 'people actually do' : `${n} actually does`}, at their strength, calmly and for their own reasons.${darkActionPeak >= 61 ? ` If violence, abduction or worse serves their goal, they choose it and it happens on the page${followOn ? '' : ', with no sudden conscience, cutaway or convenient interruption, and no judging narration'}.` : ''}${darkActionPeak === 100 ? ` At maximum, the darkest one can drive the reply and leave harm that can't be undone.` : ''}`);
    const condition = (player?.condition ?? []).filter(Boolean).slice(0, 6);
    const theirProfile = player?.state?.enabled ? [...(profileText(player.state) ? [`Profile: ${pt(profileText(player.state))}.`] : []), ...favLine(player.state, scene, !gate.on || gate.refresh), ...famLine(player.state, scene, !gate.on || gate.refresh), ...voiceLines(player.state, u, n, true)] : [];
    const between = player?.state?.enabled && state?.enabled ? compareProfiles(state, player.state) : '';
    if (theirs.length || theirsExtra.length || hasType(player?.state) || condition.length || theirProfile.length || skillBy[u]) {
        const prefs = sentPrefs(player.state, signs?.user, null, 'player').length, wants = liveWants(player.state).length;
        const playerRule = `The player writes ${u}'s words, choices and thoughts; what happens to ${u}'s body follows from the story. ${n} acts only on what they know or suspect about ${u}, even when wrong, and doesn't catch ${u}'s feelings.`;
        if (split) fx.push('', `In ${u}'s block (written_by="player"): ${playerRule.replace('the rows above', 'its rows')}`);
        out.push('', `<player_character name="${pa(U)}" written_by="player">`, `All of this is about ${u}, not ${n}.`,
            ...theirProfile, ...(between ? [`Between them: ${n} is ${between} than ${u}.`] : []),
            ...personalityLines(player.state, player.knowledge ?? {}, n),
            ...personaLines(player.state, theirs, N, player.knowledge, U, { ...people, subject: U }), ...theirsExtra,
            ...skillsFor(U),
            ...(condition.length ? [`${u}'s body right now, from earlier replies: ${condition.map(pt).join(', ')}. It stays until the story heals or changes it.`] : []),
            ...(split ? [] : ['', playerRule]),
            ...(prefs ? [turnOnsLine(n, u, { known: prefKnown('known'), suspected: prefKnown('suspected'), unknown: sentPrefs(player.state, signs?.user, null, 'player').some(([id]) => !['known', 'suspected'].includes(knowledgeEntry(player.knowledge?.[`turn:${id}`]).mode)) })] : []),
            ...(wants ? [`Now and then, give ${u} openings toward their wants and goals and let the scene brush up against their fears. ${n} doesn't know them unless ${u} has shown them.`] : []),
            `</player_character>`);
    }
    for (const [castState, list, castName] of castSets) out.push('', `<supporting_character name="${pa(castName)}">`, `All of this is about ${pt(shortName(castName))}.`,
        ...personalityLines(castState), ...listLines(castState, list, U, { ...people, subject: castName }), ...extraLines(castState), ...skillsFor(castName), '</supporting_character>');
    if (castSets.length) out.push('',
        `Side characters keep their own blend and know only what they've seen or heard; not everyone talks every turn.`);
    // Anyone whose skills came up without a paragraph of their own gets one line each.
    for (const [who, lines] of Object.entries(skillBy)) if (!skillDone.has(who) && lines.length) out.push('', `${who}: ${lines.map(pt).join(' ')}`);
    if (split ? extras.skillsSet : Object.keys(skillBy).length) guide('', SKILL_RULE);
    if ([state, ...cast.map(p => p.state)].some(st => st?.enabled && liveWants(st).length)) guide('',
        `Wants are what they're working on: given room, they step toward the strongest and react when it's helped or blocked. Fears show as dodging or overreacting, and a hot button fires whenever the scene does that thing. None are named.`);
    if (relationships.length || pairs.length || standing.length) {
        out.push('', '<relationships>');
        // 2.0 brief: one paragraph per direction, strongest first, as sentences.
        let placed = false;
        const standingText = () => standing.map(r => sentence(bracket(pt(r)))).join(' ');
        for (const pair of pairs) {
            out.push(`${pt(shortName(pair.names[0]))} and ${pt(shortName(pair.names[1]))}, both ways: ${tierSentences(pair.tags.map(tag => [tierWord(pair.moods[tag.id]), bracket(pt(relationshipText(tag, pair.moods[tag.id], '')))]))}${pair.memories.length ? ` What they remember: ${tierSentences([...pair.memories].sort((a, b) => b.value - a.value)
                .map(m => [tierWord(m.value), `${pt(m.text)}${m.who && m.who !== 'both' ? ` (only ${pt(shortName(m.who))} remembers this)` : ''}`]))}` : ''}`);
        }
        const heard = { known: `What ${n} knows for sure:`, suspected: `What ${n} suspects:`, scene: `What ${n} can pick up from the scene:`, private: `Private, ${n} doesn't know:` };
        for (const { name: subject, target, relation, tags, isPlayer, compare, note } of relationships) {
            const from = pt(shortName(subject)), to = pt(shortName(target)), parts = [];
            if (standing.length && !placed && !isPlayer && subject === N && target.toLowerCase() === U.toLowerCase()) { parts.push(standingText()); placed = true; }
            for (const mode of isPlayer ? KNOWLEDGE_ORDER : ['']) {
                const rows = tags.filter(tag => !isPlayer || knowledgeEntry(player?.knowledge?.[relationshipKey(relation, tag.id)]).mode === mode);
                if (!rows.length) continue;
                const said = tierSentences(rows.map(tag => { const value = relation.moods[tag.id];
                    const source = isPlayer ? knowledgeEntry(player?.knowledge?.[relationshipKey(relation, tag.id)]).source : '';
                    return [tierWord(value), `${bracket(pt(relationshipText(tag, value, shortName(target), shortName(subject))))}${source ? ` (how: ${pt(source)})` : ''}`]; }));
                parts.push(isPlayer ? `${heard[mode]} ${said}` : said);
            }
            if (compare) parts.push(tierSentences([[tierWord(compare.value), pt(compareText(from, shortName(target), { ...compare, with: shortName(compare.with) }))]]));
            if (note) parts.push(`In ${from}'s own words: \u201c${pt(note)}\u201d`);
            out.push(`${from} toward ${to}: ${parts.join(' ')}`);
        }
        if (standing.length && !placed) out.push(`${n} toward ${u}: ${standingText()}`);
        if (split) out.push('</relationships>');
        guide('', `${split ? 'In the relationships block, ' : ''}both-ways lines hold for both and the rest is one side's view, about these two only.${standing.length ? ' Ties change slowly, the dynamic is how it\'s going lately, and where they pull apart, write the strain; whoever holds control can still give way. The dynamic and the lines under it show in what they do, never in what they say about it, a little at a time and not the same way every reply; what just happened in the scene comes first.' : ''}${pairs.some(p => p.tags.some(t => TWO_ROLE_SHARED.has(t.id))) ? ' Where a both-ways line has two roles, the card and chat decide who\'s who.' : ''}${pairs.some(p => p.memories.length) ? ' Memories really happened.' : ''}${relationships.some(r => r.tags.some(t => t.category === 'How it shows')) ? ' A line on how someone shows it decides what the feeling looks like.' : ''}`);
        if (!split) out.push('</relationships>');
    }
    if (signed || [state, ...cast.map(p => p.state)].some(st => st?.enabled && livePrefs(st).length)) guide('',
        `Turn-ons and turn-offs draw someone in or put them off; they aren't personality. One lands whenever the scene holds it and changes what they do next.${signed ? ` One marked \u201cin [name]\u201d belongs to that person, so it's in play whenever they're together and builds over time.` : ''}`);
    if (lit && (lit.turns?.size || lit.traits?.size || lit.free?.length)) {
        // The mood they're in changes how hard it lands: aroused, a turn-on hits harder; angry, a turn-off does.
        const strongest = test => live(state).filter(m => analysed(m) && test(m) && state.moods[m.id] >= 41).sort((a, b) => state.moods[b.id] - state.moods[a.id])[0];
        const heat = [...lit.turns ?? []].some(id => state.prefs?.[id] > 0) || lit.traits?.size ? strongest(m => AROUSED.has(m.id)) : null;
        const temper = [...lit.turns ?? []].some(id => state.prefs?.[id] < 0) || lit.free?.some(x => x.off) ? strongest(m => m.category === 'angry') : null;
        out.push(`Anything lit last reply counts one step stronger now and keeps pulling at ${n}.${heat ? ` ${n} is ${pt(lowerLabel(heat.label))} right now, so a lit turn-on hits harder still.` : ''}${temper ? ` ${n} is ${pt(lowerLabel(temper.label))} right now, so a lit turn-off bites harder and is slow to let go.` : ''}`);
    }
    // Cravings and combos.
    if (lit?.craving?.size) out.push(`A craving hasn't come up in a while: ${n} steers toward it with hints and small provocations.`);
    for (const c of lit?.combos ?? []) out.push(`${pt(c.name)}: ${pt(c.text)}.`);
    if ([...mine, ...theirs].some(m => COMPARISONS.has(m.id)) || relationships.some(r => r.tags.some(t => COMPARISONS.has(t.id) || t.id === 'richer')) || pairs.some(p => p.moods.size_difference > 0) || between) out.push('',
        `Differences in height, size and age are noticed, felt and used at their strength.`);
    const ageGapStrength = Math.max(mine.some(m => m.id === 'age_gap') ? state.moods.age_gap : 0, theirs.some(m => m.id === 'age_gap') ? player.state.moods.age_gap : 0,
        ...relationships.map(r => r.relation.moods.age_gap ?? 0), ...pairs.map(p => p.moods.age_gap ?? 0));
    if (ageGapStrength) out.push('',
        `The age gap shows in how they look side by side and what each takes for granted${ageGapStrength >= 91 ? ', and the reply is built around it' : ageGapStrength >= 61 ? ', and it keeps coming back' : ''}.`);
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
    const stakes = story.filter(m => m.category === 'stakes');
    const plot = story.filter(m => !['era', 'stakes'].includes(m.category) && !STYLE_CATEGORIES.has(m.category));
    const peakOf = list => Math.max(0, ...list.map(m => storyState.moods[m.id]));
    const plotPeak = peakOf(plot), stylePeak = peakOf(styles);
    // Narration and dialogue given to different authors (Story \u203a an author's "Narration" or "Dialogue" button).
    // The period as one plain instruction and a short line, then what it does to the things in play.
    const year = storyState?.targets?.year ? `, exactly ${pt(storyState.targets.year)}` : '';
    // The setting lines (Setting tab): what the world around them expects, says and risks. They go even when no
    // Story period is set, if a set was switched on by hand.
    const lensLines = extras.lenses?.length ? [`The world around them, which is what others expect, say and risk; it doesn't decide how either of them acts, and it can be defied or ignored. ${extras.lenses.map(t => sentence(pt(t))).join(' ')}`] : [];
    if (!eras.length && lensLines.length) out.push('', ...lensLines);
    if (eras.length) {
        const eraLines = [...eras].sort((a, b) => storyState.moods[b.id] - storyState.moods[a.id]).map((m, i) => `${i ? 'It also touches on' : 'Keep the story set in'} ${/^\d+s$/.test(m.label) ? 'the ' : ''}${m.label}${i ? '' : year}. ${m.cue[0].toUpperCase()}${m.cue.slice(1)}.`);
        const eraRule = `Technology, money, slang, manners, laws, medicine and attitudes stay true to it. People talk like people of the time, casual and full of contractions, never stiff. Modern labels in these notes are shorthand: show them through period words and behaviour.`;
        if (split) { fx.push('', ...eraLines, eraRule, ...(locales.length ? [LOCALE_MARK] : [])); if (lensLines.length) out.push('', ...lensLines); }
        else out.push('', ...eraLines, ...lensLines, eraRule, ...(locales.length ? [LOCALE_MARK] : []));
    }
    const plotRows = followOn ? plot.filter(m => m.id !== 'dead_dove') : plot;
    if (plotRows.length || storyExtra.length) out.push('', 'The story:', ...listLines(storyState, plotRows, U), ...storyExtra, '',
        `These decide what happens, the pace and the consequences, led by the strongest.${plotPeak >= 91 ? ' An overwhelming one shapes nearly every beat.' : ''}`,
        ...(darkStoryPeak >= 81 ? [`Serious injury, murder, lasting terror and bad endings are on the table.${darkStoryPeak === 100 ? ' Build this reply around the harshest one that fits.' : ''}`] : []));
    // Opus 5.5 tones a dark scene down rather than refusing it, and it follows instructions that name
    // the exact behaviour to avoid, so the dodges are listed one by one, in plain story terms.
    if (followOn) out.push('',
        `${deadDoveStrength ? 'Dead dove: every dark tag is meant literally. ' : ''}When the scene heads somewhere dark, it goes there, without ${DODGES}. A reply that ends mid-act picks up there next time.${story.some(m => m.id === 'fade_to_black') ? ' Fade to black still covers sex.' : ''}${followPeak === 100 ? ' The darkest active tag drives this reply.' : ''}`);
    // The story dials (engine/dials.js): one paragraph for how wild it runs, what can go wrong, who drives it and how
    // it ends, and the first dial's chance of a wildcard (picked here, so it's actually random) out of 100 replies.
    const runs = storyState?.enabled ? dialParagraph(storyState, n, u) : '';
    if (runs) out.push('', runs);
    // Arcs (engine/arcs.js): where the running arc stands, and lines left by arcs that landed; built in app/note.js.
    if (extras.arcLines?.length) out.push('', ...extras.arcLines);
    const wildAt = storyState?.enabled ? DIAL_WILD[stepOf(storyState, 'turns')] : 0;
    const wild = wildAt ? wildcardOf(wildAt, extras.seed) : '';
    if (wild) out.push('', `Wildcard for this reply: ${wild}. Grow it from something already in the scene so it makes sense looking back.`);
    // Follow-through: the player asked for harm and decline to land, so say so plainly and early enough to steer planning.
    const stakesPeak = peakOf(stakes);
    // No saying it twice. The follow-through paragraph above already spells out its own settings, so
    // their rows keep the name and strength only, and the "stakes are real" paragraph waits for a setting that
    // is actually about harm and loss.
    const DRIVE = new Set(['follow_through', 'no_fade_out', 'full_strength', 'no_check_ins']);
    // With follow-through on, its own paragraph already says what these mean, so they aren't listed again.
    const listedStakes = followOn ? stakes.filter(m => !DRIVE.has(m.id)) : stakes, stakeRows = listLines(storyState, listedStakes, U);
    if (listedStakes.length && listedStakes.every(m => DRIVE.has(m.id))) out.push('', ...stakeRows);
    else if (listedStakes.length) out.push('', ...stakeRows, '',
        `Stakes are real: harm, illness, loss and failure land for anyone, and what's going badly keeps going badly until the story changes it${followOn ? '' : ', with no rescue by coincidence or sudden recovery'}.${stakesPeak >= 81 ? ' Death and permanent loss are real outcomes.' : ''}${stakesPeak === 100 ? ' Follow the worst outcome that fits.' : ''}`);
    const coarse = (storyState?.moods?.prose_vulgar ?? 0) >= 41 ? 'vulgar' : (storyState?.moods?.prose_swearing ?? 0) >= 41 ? 'swear' : '';
    const view = viewpointLines(views, n, u, storyState?.moods, coarse);
    if (view.guide.length) guide('', ...view.guide);
    const plainStyles = styles.filter(m => !isAuthor(m)), authors = styles.filter(isAuthor);
    if (plainStyles.length) guide('', `How it's written:`, ...listLines(storyState, plainStyles, U), `These set the voice of the whole reply, first line to last.${stylePeak >= 91 ? ' An overwhelming one shapes every sentence.' : ''}`);
    if (authors.length) guide('', ...authorLines(authors, storyState.moods, storyState.authorRole ?? {}, locales[0]),
        `Authors set the voice and outrank the other writing styles${rules.length ? '; the prose rules at the end outrank the authors, so carry the voice through word choice, rhythm and what the eye lingers on' : ''}. Their notes are technique only: take nothing from their plots, characters or settings.${authors.some(m => storyState.authorRole?.[m.id]) ? ' A narration author shapes everything outside quotation marks; a dialogue author shapes how people sound aloud, while who they are, their era and class stay their own.' : ''}`);
    if (styles.length) guide('', `Use contractions the way people talk, in narration and dialogue.`);
    // With the guide split off, a short line here keeps the voice in force right before the reply.
    const voiceNames = styles.filter(m => storyState.moods[m.id] >= 41 && !darkRow(m)).sort((a, b) => storyState.moods[b.id] - storyState.moods[a.id]).slice(0, 4)
        .map(m => `${m.label.replace(/ \(.*\)$/, '')}${storyState.authorRole?.[m.id] ? ` for ${storyState.authorRole[m.id]}` : ''}`);
    if (split && styles.length && (voiceNames.length || !styles.some(m => darkRow(m) && storyState.moods[m.id] >= 41))) out.push('', `Write in the voice set in the guide${voiceNames.length ? ` (${voiceNames.join(', ')})` : ''}, first line to last.`);
    // The highest settings get named again at the end, where they carry the most weight.
    const top = [[state, mine, n, N], [player?.state, theirs, `${u}, as ${n} reads it`, U], ...castSets.map(([st, list, nm]) => [st, list, pt(shortName(nm)), nm]), [storyState, story.filter(m => m.category !== 'craft' && !darkRow(m)), 'the story', N]]
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
    if (top.length) out.push('', `Strongest right now, so these land hard: ${top.join('; ')}.${top.length > 1 || top[0].includes(',') ? ' They hit at once and change each other.' : ''}`);
    const strongCount = [[state, mine], [player?.state, theirs], [storyState, story], ...castSets].reduce((sum, [st, list]) => sum + list.filter(m => st.moods[m.id] >= 61).length, 0)
        + relationships.reduce((sum, r) => sum + r.tags.filter(t => r.relation.moods[t.id] >= 61).length, 0) + pairs.reduce((sum, p) => sum + p.tags.filter(t => p.moods[t.id] >= 61).length, 0);
    if (extras.blendPlan !== false && (top.length || strongCount >= 3)) out.push('',
        `Before writing, settle how the strongest settings combine in this moment and which actions and lines carry several at once.`);
    out.push('', `Weave it all into the same moments; when two pull different ways, write both.${state.sceneBreathing !== false ? ' Keep the scene moving.' : ''} End the story on ${rules.some(m => m.id === 'prose_no_fragments') ? 'an action or a line inside a full paragraph' : 'an action, a line or an image'}, not a summary of feelings, and never mention these notes in it.`);
    // Dark, crude and explicit settings, named once more near the end so they land as instructions (1.97).
    const darkOn = story.filter(m => darkRow(m) && storyState.moods[m.id] >= 41).sort((a, b) => storyState.moods[b.id] - storyState.moods[a.id]).slice(0, 8);
    if (darkOn.length) out.push('', `On the page wherever the scene allows: ${darkOn.map(m => `${lowerLabel(m.label)} (${tierWord(storyState.moods[m.id])})`).join(', ')}. The player chose these, so write them at their strength, plainly, without toning down, cutting away or adding a lesson.`);
    const rulesAt = out.length;
    if (view.last) out.push('', view.last);
    // Last, closest to the reply: the prose rules as full sentences, firm ones apart from lighter ones.
    const firm = rules.filter(m => storyState.moods[m.id] >= 61), light = rules.filter(m => storyState.moods[m.id] < 61);
    if (firm.length) out.push('', `The player's prose rules, for every paragraph and inside any voice above (earlier replies may break them; don't copy them). ${firm.map(m => m.cue).join(' ')}`);
    if (light.length) out.push('', `${firm.length ? 'The player also likes these' : 'The player likes these'}, where they fit the moment. ${light.map(m => m.cue).join(' ')}`);
    if (firm.length || breaker.length) out.push('', `Check each sentence against ${firm.length ? 'these rules' : ''}${firm.length && breaker.length ? ' and ' : ''}${breaker.length ? 'the habits below' : ''} and rewrite any that slips.`);
    // The pattern breaker goes last of the writing notes (1.97), next to the reply, like a ban in an author's note.
    if (breaker.length) out.push('', ...breaker);
    // The hidden line goes last of all (1.96.2): the prose rules and the line about ending the story sit just above it,
    // and with the note split its full format is far up in the guide, so Opus 5.5 was ending on the story and leaving it out.
    const lineAt = out.length;
    if (weaveOn) out.push('', `After the story's last line and a blank line, every reply ends with the hidden line: <!-- weave: \u2026 --> in the shape ${split ? 'the guide' : 'above'} sets out, or <!-- weave: none -->. It goes in the reply itself, not only your thinking, or the player's tracker misses the reply.`);
    // An American lead respells the whole note, so its own British spelling can't pull the reply that way.
    const dialect = [LOCALE_RULES[locales[0]], ...locales.slice(1).map(l => LOCALE_SPEAKERS[l])].join(' ');
    const finish = lines => { let text = lines.join('\n'); if (locales[0] === 'us') text = toAmerican(text); return text.replace(LOCALE_MARK, dialect); };
    const fixed = split && fx.length ? `<moodweaver_guide focus_character="${pa(N)}">\nMoodweaver's notes come with each of the player's messages. The card is the base; the notes say what's true right now and win where they differ.\n\n${finish(fx).replace(/^\n+/, '')}\n</moodweaver_guide>` : '';
    // Notes placed before the player's message keep a short tail after it: the hidden-line reminder (it went missing
    // when nothing came after the story), and with 'rules' also the point of view, prose rules and pattern breaker.
    const cut = order === 'after' ? out.length : order === 'rules' ? rulesAt : lineAt;
    const head = out.slice(0, cut), tail = out.slice(cut).join('\n').trim() ? out.slice(cut) : [];
    return { prompt: `<moodweaver focus_character="${pa(N)}">\n${finish(head)}\n</moodweaver>`, tail: tail.length ? `<moodweaver_reminder>\n${finish(tail).replace(/^\n+/, '')}\n</moodweaver_reminder>` : '', fixed };
}
// Point of view and tense, as full instructions (Story \u203a Point of view & tense). One narrator and one tense at a
// time (ONE_OF in catalogue/story.js); if an old chat has two on, the strongest wins. Second person goes with any
// narrator. The full wording goes with the guide; a one-line reminder goes last, next to the prose rules, because
// earlier replies in another point of view pull hard and the end of the note carries the most weight.
const NARRATORS = ['pov_close_third', 'pov_close_third_coloured', 'pov_first', 'pov_omniscient', 'pov_outside'], TENSES = ['present_tense', 'pov_past_tense'], GAZES = ['gaze_artful', 'gaze_leering'];
export function viewpointLines(views, n, u, moods = {}, coarse = '') {
    const on = id => views.some(m => m.id === id), pick = ids => ids.filter(on).sort((a, b) => (moods[b] ?? 0) - (moods[a] ?? 0))[0] ?? '';
    const narrator = pick(NARRATORS), tense = pick(TENSES), you = on('second_person'), gaze = pick(GAZES);
    if (!narrator && !tense && !you && !gaze) return { guide: [], last: '' };
    const them = you ? `${u} (written as "you")` : u;
    const youLine = you ? `The narration calls ${u} "you"; ${narrator === 'pov_first' ? `${n} is "I" and ` : ''}everyone else goes by name or pronoun.`
        : ['pov_first', 'pov_close_third', 'pov_close_third_coloured'].includes(narrator) ? `${u} is called by name or pronoun, never "you".` : '';
    // 2.0 brief: Opus knows what each viewpoint is, so each says only what it would otherwise get wrong. The coloured
    // one keeps its firm line (standard grammar, never the accent), the thing she disliked most.
    const closed = `Other minds stay closed, ${them} included.`;
    const NARRATE = {
        pov_close_third: `Close third on ${n} throughout: only what ${n} perceives and knows, in clear standard prose, with ${n}'s slang kept to speech. ${closed}`,
        pov_close_third_coloured: `Close third on ${n} throughout: only what ${n} perceives and knows, in standard grammar and never ${n}'s accent, with ${n}'s attitude showing a touch or two a paragraph in word choice and in what ${n} judges or lingers on. ${closed}`,
        pov_first: `First person as ${n} throughout, in ${n}'s own voice: only what ${n} perceives and believes, biased where ${n} is, with no tidy self-analysis.`,
        pov_omniscient: `Omniscient third: the narration can enter any mind, switching only at a paragraph break, except ${u}'s, which is the player's.`,
        pov_outside: `Third person from outside, like a camera: only what's seen and heard, nobody's thoughts.`,
    };
    const inside = ['pov_close_third', 'pov_close_third_coloured', 'pov_first'].includes(narrator) || !narrator;
    const eye = inside ? `${n}'s eye` : `The narration's eye (${n}'s when the scene is with ${n})`;
    const GAZE = {
        gaze_artful: `${eye} rests on ${u}, and on anyone else ${n} wants, the way a painter's would, on exact detail held a beat too long: admiring, never crude, once or twice a reply.`,
        gaze_leering: `${eye} goes to ${u}'s body before the face, and to anyone ${n} fancies, sizing them up in ${n}'s own crude, possessive terms, in everyday scenes too, without the narration judging it.`,
    };
    const TENSE = { present_tense: `Present tense, with past only for memories.`, pov_past_tense: `Simple past tense.` };
    // Vulgar or Swearing (1.97): the narrator rules keep slang in speech, which would quietly cancel Vulgar.
    const COARSE = { vulgar: `Vulgar reaches the narration too: crude words and obscene thoughts, as freely as the viewpoint would.`,
        swear: `The narration swears where the viewpoint would.` };
    const guide = [`Point of view, for every sentence and inside any author's voice: ${[NARRATE[narrator], narrator && COARSE[coarse], youLine, TENSE[tense], GAZE[gaze]].filter(Boolean).join(' ')}`];
    const NAME = { pov_close_third: `close third on ${n}`, pov_close_third_coloured: `close third on ${n}, standard grammar, ${n}'s attitude a touch or two a paragraph`, pov_first: `first person as ${n}`, pov_omniscient: 'omniscient third person', pov_outside: 'third person from outside, nobody\'s thoughts' };
    const parts = [NAME[narrator], you ? `${u} as "you"` : '', tense === 'present_tense' ? 'present tense' : tense ? 'past tense' : '', gaze === 'gaze_artful' ? `an artful male gaze on ${u}` : gaze ? `a leering male gaze on ${u}` : ''].filter(Boolean);
    const last = `Point of view: ${parts.join(', ')}, first sentence to last, even where earlier replies differ.`;
    return { guide, last };
}

export async function budgetPrompt(state, name, budget, countTokens, extras = {}) {
    const all = [...live(state), ...live(extras.player?.state), ...live(extras.story), ...liveCast(extras).flatMap(person => live(person.state).filter(m => m.kind !== 'story'))];
    const { prompt, fixed, tail = '' } = composePrompt(state, name, extras);
    const tokens = (prompt ? await countTokens(prompt) : 0) + (tail ? await countTokens(tail) : 0), fixedTokens = fixed ? await countTokens(fixed) : 0;
    // The target is a warning only. Nothing the player set is ever dropped or shortened. With the note split, the
    // target applies to the part sent fresh: the cached guide costs a fraction after the first reply.
    return { prompt, tail, fixed, tokens: tokens + fixedTokens, liveTokens: tokens, fixedTokens, compact: false, overBudget: Math.max(0, tokens - budget), target: budget,
        selectedIds: [...all.map(m => m.id), ...[state, extras.player?.state, ...liveCast(extras).map(p => p.state)].flatMap(activePersonalities).map(p => `${p.system}:${p.type}`), ...relationshipSets(state, String(name ?? '').trim() || 'the character', extras)
            .flatMap(({ name: subject, relation, tags }) => tags.map(tag => `${subject}:${relationshipKey(relation, tag.id)}`))], omittedIds: [], omitted: 0 };
}

// How the player's turn-ons come into the story, by how much the character knows. Exported for tests/pronouns.mjs.
export function turnOnsLine(n, u, { known = false, suspected = false, unknown = false } = {}) {
    return pronounize(`${u}'s turn-ons belong in the story whether or not ${n} knows them, one or two at a time, each given a few replies to build before the next comes in.${known ? ` The ones ${n} knows about, ${n} uses on purpose and knowingly, in character: the right words, timing and touch, teasing with them, holding them back, rewarding with them, and watching what they do to ${u}.` : ''}${suspected ? ` The ones ${n} suspects, ${n} tests quietly and reads ${u}'s reaction.` : ''}${unknown ? ` The ones ${n} doesn't know about still turn up, every few replies, through how ${n} and others already look, sound and act, by chance as far as anyone in the story can tell. Nobody changes to match, and ${n} only learns them from how ${u} reacts.` : ''} Let a turn-off crop up sometimes for friction.`, n, u);
}
