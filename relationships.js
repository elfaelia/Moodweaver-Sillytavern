// A separate blend for each person this character has feelings about.
export const RELATIONSHIP_CATEGORIES = [
    ['First impressions', '✧', '#d7afd4', [
        ['finds_ugly', 'Finds ugly', 'finds them unattractive'],
        ['finds_attractive', 'Finds attractive', 'feels attracted to them'],
        ['finds_pretty', 'Finds pretty', 'finds them lovely to look at'],
        ['finds_cute', 'Finds cute', 'finds their looks or little habits endearing'],
        ['grossed_out', 'Grossed out by', 'feels disgust toward them'],
        ['offputting', 'Finds offputting', 'something about them rubs the wrong way'],
        ['fascinated', 'Fascinated by', 'finds them hard to figure out and wants to know more'],
    ]],
    ['Affection & trust', '♡', '#dba6b9', [
        ['admires', 'Admires', 'looks up to them and values what they do'],
        ['loves', 'Loves', 'loves them; their relationship decides what kind of love'],
        ['cherishes', 'Cherishes', 'holds them dear and treats their presence as precious'],
        ['protects', 'Wants to protect', 'wants to keep them safe and steps in when they are threatened'],
        ['trusts', 'Trusts', 'trusts their intentions and is willing to rely on them'],
        ['dotes', 'Dotes on', 'wants to spoil them with attention and little favours'],
        ['misses', 'Misses', 'misses their company and wants that closeness back'],
        ['proud', 'Proud of', 'takes pride in them and what they have done'],
        ['safe_with', 'Feels safe with', 'feels safe enough around them to let their guard down'],
        ['understands', 'Feels understood by', 'feels they get a side of them most people miss'],
        ['forgives', 'Wants to forgive', 'wants to forgive them, even if the hurt is still there'],
    ]],
    ['Attachment & power', '◆', '#c0acd9', [
        ['obsessed', 'Obsessed with', 'fixates on them; attention keeps circling back to them'],
        ['preserves', 'Wants to preserve', 'wants to keep them just as they are; change or loss feels like a threat'],
        ['wrapped', 'Wrapped around their finger', 'is easily swayed by them and bends to their wishes'],
        ['possessive', 'Possessive of', 'wants them to themselves and resents sharing their attention'],
        ['jealous', 'Jealous over', 'feels threatened by someone else getting close to them'],
        ['envies', 'Envies', 'wants something they have and feels the comparison keenly'],
        ['rival', 'Competes with', 'treats them as a rival and wants to come out ahead'],
        ['approval', 'Wants their approval', 'cares about their opinion and wants to win their approval'],
        ['impresses', 'Wants to impress', 'plays up what might impress them'],
        ['depends', 'Depends on', 'leans on them and struggles with the thought of managing without them'],
        ['controls', 'Wants to control', 'wants a say over their choices and tries to steer them'],
    ]],
    ['Friction & hostility', '↯', '#d69d95', [
        ['judges', 'Judgemental of', 'judges them by exacting personal standards and notices where they fall short'],
        ['despises', 'Despises', 'holds them in contempt'],
        ['hates', 'Hates', 'feels hatred toward them'],
        ['wants_kill', 'Wants to kill', 'wants them dead and considers acting on it'],
        ['resents', 'Resents', 'carries a grievance against them that colours the interaction'],
        ['distrusts', 'Distrusts', 'questions their motives and looks for what they are hiding'],
        ['fears', 'Afraid of', 'sees them as a threat and feels afraid of them'],
        ['looks_down', 'Looks down on', 'sees them as beneath them and treats them accordingly'],
        ['disappointed', 'Disappointed in', 'feels they have fallen short of what was hoped for'],
        ['blames', 'Blames', 'holds them responsible for what went wrong'],
        ['avoids', 'Wants to avoid', 'wants distance from them and looks for ways out of their company'],
        ['revenge', 'Wants revenge on', 'wants to make them pay for a perceived wrong'],
    ]],
];
export const RELATIONSHIP_TAGS = RELATIONSHIP_CATEGORIES.flatMap(([category, , color, rows]) =>
    rows.map(([id, label, cue]) => ({ id, label, cue, category, color })));
export const RELATIONSHIP_BY_ID = Object.fromEntries(RELATIONSHIP_TAGS.map(tag => [tag.id, tag]));
const strength = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : 0;
export const relationshipName = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
export const relationshipKey = (relation, tagId) => `relationship:${relation.id}:${tagId}`;
export function cloneRelationships(list) {
    return (Array.isArray(list) ? list : []).map(relation => ({
        id: String(relation.id ?? ''), target: relationshipName(relation.target),
        enabled: relation.enabled !== false,
        moods: Object.fromEntries(RELATIONSHIP_TAGS.map(tag => [tag.id, strength(relation.moods?.[tag.id])])),
    }));
}
export const activeRelationshipTags = relation => RELATIONSHIP_TAGS
    .filter(tag => strength(relation?.moods?.[tag.id]) > 0)
    .sort((a, b) => relation.moods[b.id] - relation.moods[a.id]);

export function relationshipCue(tag, value) {
    if (tag.id === 'wants_kill') return value <= 10 ? 'a fleeting wish that they were dead'
        : value <= 40 ? 'sometimes wishes they were dead, but other wants usually take precedence'
        : value <= 80 ? 'wants them dead; that desire weighs on choices and plans'
        : value < 100 ? 'intends to kill them and looks for a chance to act'
        : 'killing them is a driving goal; choices and action work toward it';
    if (tag.id === 'hates') return value <= 10 ? 'feels a flicker of hostility toward them'
        : value <= 40 ? 'dislikes them' : value <= 80 ? 'hates them' : value < 100 ? 'loathes them' : 'is consumed by hatred for them';
    return tag.cue;
}

// Includes relationship-only profiles. A cast member switched off scene is not a live target.
export function relationshipSets(state, name, extras = {}) {
    const player = extras.player?.name || 'the player’s character';
    const cast = Array.isArray(extras.cast) ? extras.cast : [];
    const resolve = value => relationshipName(value).replaceAll('{{char}}', name).replaceAll('{{user}}', player);
    const owners = [{ name, state }, { name: player, state: extras.player?.state, isPlayer: true },
        ...cast.filter(p => p.inScene).map(p => ({ name: p.name, state: p.state }))];
    return owners.flatMap(owner => !owner.state?.enabled ? [] : cloneRelationships(owner.state.relationships).flatMap(relation => {
        const target = resolve(relation.target), tags = activeRelationshipTags(relation);
        const targetCast = cast.find(p => p.name.toLowerCase() === target.toLowerCase());
        if (!relation.enabled || !target || !tags.length || target.toLowerCase() === owner.name.toLowerCase()
            || (targetCast && !targetCast.inScene)) return [];
        return [{ ...owner, relation, target, tags }];
    }));
}
