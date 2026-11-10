import { REL_PRONOUN_PROMPTS, REL_PRONOUN_SCALED, fillPronouns } from './rel-pronouns.js';
import { pronounOf } from './pronouns.js';
// Relationships come in two kinds.
// Shared ("between them"): true for both people and sent once, like dating or enemies to lovers.
// Directed: one person's side only, like a crush, an opinion or "they're mine".
// Each row: id, label, description for the panel, wording sent to the model ({other} becomes their name).
import { RELATIONSHIP_GROUPS, SHARED_GROUPS } from '../data/catalogue/relationships.js';
// [name, icon, colour, rows]; rows are [id, label, cue, prompt].
const asRows = groups => groups.map(g => [g.name, g.icon, g.color, g.rows.map(r => 'prompt' in r ? [r.id, r.label, r.cue, r.prompt] : [r.id, r.label, r.cue])]);
export const SHARED_CATEGORIES = asRows(SHARED_GROUPS);
export const RELATIONSHIP_CATEGORIES = asRows(RELATIONSHIP_GROUPS);
const tags = cats => cats.flatMap(([category, , color, rows]) => rows.map(([id, label, cue, prompt]) => ({ id, label, cue, prompt, category, color })));
export const RELATIONSHIP_TAGS = tags(RELATIONSHIP_CATEGORIES);
const SHARED_TAGS = tags(SHARED_CATEGORIES);
export const RELATIONSHIP_BY_ID = Object.fromEntries(RELATIONSHIP_TAGS.map(tag => [tag.id, tag]));
export const SHARED_BY_ID = Object.fromEntries(SHARED_TAGS.map(tag => [tag.id, tag]));
export const SHARED_IDS = new Set(SHARED_TAGS.map(tag => tag.id));
// Both-ways tags where the two people play different parts. Opus 5.5 is weaker at inferring who's who unprompted.
export const TWO_ROLE_SHARED = new Set(['monster_on_leash', 'gilded_cage', 'spoiled_captive', 'unrequited_love', 'secret_admirer', 'hurt_comfort', 'hurt_no_comfort', 'bodyguard', 'villain_romance', 'beauty_and_beast',
    'captor_captive', 'stockholm', 'corrupting_love', 'redeeming_love', 'power_imbalance', 'grumpy_sunshine', 'who_did_this', 'touch_and_die',
    'scientist_and_subject', 'sugar', 'size_difference', 'age_gap', 'if_i_cant_have_you', 'class_divide',
    'one_loves_harder', 'predator_and_prey', 'love_bomb_cycle', 'worship_and_ruin', 'hunter_hunted', 'nurse_and_wreck', 'bought_and_paid', 'revenge_romance', 'stalker_romance', 'made_to_need', 'held_by_threat', 'knows_what_they_are']);

// Moods and story tropes that were really about one particular person now live in relationships.
// Old values move automatically: '{{other}}' means "whoever this sheet used to point at".
export const MOVED_TO_RELATIONSHIPS = {
    enamoured: 'smitten', in_love: 'in_love', star_struck: 'star_struck_by', charmed: 'charmed_by',
    wrapped_around_finger: 'wrapped', worshipful: 'idolises', sees_muse: 'sees_as_muse', idealising: 'idealises',
    preserving: 'preserves', making_worse: 'brings_out_worst', being_made_worse: 'worst_in_them',
    hates_user: 'hates', hates_char: 'hates', hates_other: 'hates',
    // The old Facts & scene "Relationship" section and the pair-level romance tropes.
    friends: 'friends', childhood_friends: 'childhood_friends', roommates: 'roommates', coworkers: 'coworkers',
    neighbours: 'neighbours', rivals: 'rivals', enemies: 'enemies', partners_in_crime: 'partners_in_crime',
    one_night_stand: 'one_night_stand', casual: 'casual', dating: 'dating', engaged: 'engaged', married: 'married',
    exes: 'exes', affair: 'affair', secret_relationship: 'secret_relationship', sugar: 'sugar', first_time: 'first_time',
    is_muse: 'is_muse', power_imbalance: 'power_imbalance', age_gap: 'age_gap', older: 'older', younger: 'younger',
    taller: 'taller', shorter: 'shorter', bigger: 'bigger', smaller: 'smaller', stronger: 'stronger', smarter: 'smarter',
    slow_burn: 'slow_burn', mutual_pining: 'mutual_pining', unrequited_love: 'unrequited_love', secret_admirer: 'secret_admirer',
    first_love: 'first_love', confession: 'confession', friends_to_lovers: 'friends_to_lovers', enemies_to_lovers: 'enemies_to_lovers',
    opposites_attract: 'opposites_attract', grumpy_sunshine: 'grumpy_sunshine', forbidden_love: 'forbidden_love',
    second_chance: 'second_chance', fake_dating: 'fake_dating', forced_proximity: 'forced_proximity', only_one_bed: 'only_one_bed',
    arranged_marriage: 'arranged_marriage', marriage_of_convenience: 'marriage_of_convenience', office_romance: 'office_romance',
    size_difference: 'size_difference', beauty_and_beast: 'beauty_and_beast', hurt_comfort: 'hurt_comfort', who_did_this: 'who_did_this',
    villain_romance: 'villain_romance', obsessive_love: 'obsessive_love', if_i_cant_have_you: 'if_i_cant_have_you',
    captor_captive: 'captor_captive', stockholm: 'stockholm', trauma_bond: 'trauma_bond',
};
export const MOVED_TARGET = { hates_user: '{{user}}', hates_char: '{{char}}' };

const strength = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : 0;
const relationshipName = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
export const relationshipKey = (relation, tagId) => `relationship:${relation.id}:${tagId}`;
const cleanNote = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);
const FAVOURS = ['them', 'other', 'neither'];
export function cleanCompare(compare) {
    return { with: relationshipName(compare?.with), favours: FAVOURS.includes(compare?.favours) ? compare.favours : 'them', value: strength(compare?.value) };
}
// Shared labels are kept on a relation too, so older saves never lose a value before they're moved.
export function cloneRelationships(list) {
    return (Array.isArray(list) ? list : []).map(relation => ({
        id: String(relation.id ?? ''), target: relationshipName(relation.target),
        enabled: relation.enabled !== false,
        moods: Object.fromEntries([...RELATIONSHIP_TAGS, ...SHARED_TAGS].map(tag => [tag.id, strength(relation.moods?.[tag.id])])),
        compare: cleanCompare(relation.compare), note: cleanNote(relation.note),
    }));
}
export const activeRelationshipTags = relation => RELATIONSHIP_TAGS
    .filter(tag => strength(relation?.moods?.[tag.id]) > 0)
    .sort((a, b) => relation.moods[b.id] - relation.moods[a.id]);
export const activeSharedTags = pair => SHARED_TAGS
    .filter(tag => strength(pair?.moods?.[tag.id]) > 0)
    .sort((a, b) => pair.moods[b.id] - pair.moods[a.id]);

// Hate and murderous intent change kind, not just amount, as they rise.
const SCALED = {
    hates: [[100, 'is consumed by hatred for {other}'], [81, 'loathes {other}'], [41, 'hates {other}'], [11, 'dislikes {other}'], [1, 'feels a flicker of hostility toward {other}']],
    wants_kill: [[100, 'killing {other} is a driving goal; their choices and actions work toward it'], [81, 'intends to kill {other} and looks for the chance'],
        [41, 'wants {other} dead, and it weighs on their choices'], [11, 'sometimes wishes {other} were dead'], [1, 'has a fleeting wish that {other} were dead']],
};
export function relationshipCue(tag, value) {
    const scaled = SCALED[tag.id]?.find(([min]) => value >= min)?.[1];
    return scaled ? scaled.replaceAll('{other}', 'them') : tag.cue;
}
// Subject is the one the line is about; their pronouns and the other person's come from the Pronouns
// picker, so "in charge of their treatment" reads "in charge of her treatment".
export function relationshipText(tag, value, other, subject = '') {
    const full = RELATIONSHIP_BY_ID[tag.id] ?? SHARED_BY_ID[tag.id] ?? tag;
    const marked = REL_PRONOUN_SCALED[tag.id]?.find(([min]) => value >= min)?.[1] ?? REL_PRONOUN_PROMPTS[tag.id];
    if (marked) return fillPronouns(marked, pronounOf(subject), pronounOf(other)).replaceAll('{other}', other);
    const scaled = SCALED[tag.id]?.find(([min]) => value >= min)?.[1];
    return (scaled ?? full.prompt ?? full.cue).replaceAll('{other}', other);
}
export function compareText(subject, target, compare) {
    const { with: other, favours } = compare;
    return favours === 'them' ? `keeps comparing ${target} with ${other}, and ${target} comes out better`
        : favours === 'other' ? `keeps comparing ${target} with ${other}, and ${target} comes off worse`
        : `keeps weighing ${target} against ${other}`;
}

// One person's side toward everyone else. Absent people still count: they get woven in, not summoned.
export function relationshipSets(state, name, extras = {}) {
    const player = extras.player?.name || 'the player’s character';
    const cast = Array.isArray(extras.cast) ? extras.cast : [];
    const resolve = value => relationshipName(value).replaceAll('{{char}}', name).replaceAll('{{user}}', player);
    const owners = [{ name, state }, { name: player, state: extras.player?.state, isPlayer: true },
        ...cast.filter(p => p.inScene).map(p => ({ name: p.name, state: p.state }))];
    return owners.flatMap(owner => !owner.state?.enabled ? [] : cloneRelationships(owner.state.relationships).flatMap(relation => {
        const target = resolve(relation.target), tags = activeRelationshipTags(relation);
        const compare = relation.compare.value && relation.compare.with ? { ...relation.compare, with: resolve(relation.compare.with) } : null;
        const usable = compare && compare.with.toLowerCase() !== target.toLowerCase() ? compare : null;
        if (!relation.enabled || !target || target.toLowerCase() === owner.name.toLowerCase() || (!tags.length && !usable && !relation.note)) return [];
        return [{ ...owner, relation, target, tags, compare: usable, note: relation.note }];
    }));
}
