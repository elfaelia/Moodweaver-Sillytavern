// The whole catalogue, put together from the files in ./catalogue. To add or change an option, edit the
// section file it belongs to; nothing else needs touching.
import moodSection from './catalogue/mood.js';
import traitSection from './catalogue/trait.js';
import stateSection from './catalogue/state.js';
import storySection from './catalogue/story.js';
export { SCALED_MOOD_CUES, MERGED_PROMPT_CUES } from './catalogue/scaled.js';
export { MERGED_MOODS, MERGED_SEARCH_NAMES, REMOVED_MOODS } from './catalogue/merged.js';
export { RECIPES, STORY_RECIPES } from './catalogue/recipes.js';

const SECTIONS = [...moodSection, ...traitSection, ...stateSection, ...storySection].sort((a, b) => a.order - b.order);

export const lowerLabel = label => label.replace(/\b([A-Z])(?=[a-z])/g, c => c.toLowerCase());

// [id, name, icon, colour, rows, kind]; rows are [id, label, cue, note].
export const CATEGORIES = SECTIONS.map(c => [c.id, c.name, c.icon, c.color, c.rows.map(r => r.note === undefined ? [r.id, r.label, r.cue] : [r.id, r.label, r.cue, r.note]), c.kind]);
export const MOODS = SECTIONS.flatMap(c => c.rows.map(r => ({ id: r.id, label: r.label, cue: r.cue, ...(r.note !== undefined ? { note: r.note } : {}), category: c.id, color: c.color, kind: c.kind })));
export const BY_ID = Object.fromEntries(MOODS.map(m => [m.id, m]));

// The wording sent for each option, where it has one, and how each feeling shows on the page.
export const PROMPT_NAME = {};
export const ON_PAGE = {};
for (const c of SECTIONS) for (const r of c.rows) {
    if (r.prompt !== undefined) PROMPT_NAME[r.id] = r.prompt === true ? `${lowerLabel(r.label)}: ${r.cue}` : r.prompt;
    if (r.onPage !== undefined) ON_PAGE[r.id] = r.onPage;
}

// Traits tab: who someone is, rather than how they feel right now. The scene reader never changes them.
export const TRAIT_CATEGORIES = new Set(['love', 'dynamics', 'appetites', 'sims', 'psychosexual', 'manner', 'temperament', 'views', 'alignment', 'psychology', 'archetype']);
export const sectionOf = m => m.kind === 'story' ? 'story' : TRAIT_CATEGORIES.has(m.category) ? 'trait' : m.kind;
// The scene reader only reads feelings; traits (love languages included) are standing, so it leaves them alone.
export const analysed = m => m?.kind === 'mood' && !TRAIT_CATEGORIES.has(m.category)
    && !['hates_user', 'hates_char', 'hates_other', 'comparing_people'].includes(m.id);
export const FEELINGS = MOODS.filter(analysed);

const AUTHOR_CATEGORIES = new Set(['authors_classic', 'authors_midcentury', 'authors']);
export const isAuthor = m => AUTHOR_CATEGORIES.has(m?.category);
// How-it's-written settings: these shape the voice rather than what happens.
export const STYLE_CATEGORIES = new Set(['craft', 'writing', 'smut_style', ...AUTHOR_CATEGORIES]);
