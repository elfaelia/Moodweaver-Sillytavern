// A separate blend for each person this character has feelings about. Sims-style: what they are to each
// other first, then how they size each other up, then the feelings themselves from warm to hostile.
// Each row: id, label, description for the panel, wording sent to the model ({other} becomes their name).
export const RELATIONSHIP_CATEGORIES = [
    ['What they are', '⚭', '#d7a0b4', [
        ['strangers', 'Strangers', 'they don’t know each other yet', 'a stranger to {other}'],
        ['acquaintances', 'Acquaintances', 'they know each other a little, nothing more', 'only an acquaintance of {other}'],
        ['friends', 'Friends', 'a real friendship with history behind it', 'friends with {other}'],
        ['best_friends', 'Best friends', 'the closest friend they have', 'best friends with {other}'],
        ['childhood_friends', 'Childhood friends', 'friends since they were kids', 'childhood friends with {other}'],
        ['family', 'Family', 'related by blood or raised together', 'family to {other}'],
        ['roommates', 'Roommates', 'they live under the same roof', 'roommates with {other}'],
        ['coworkers', 'Coworkers', 'they work together', 'coworkers with {other}'],
        ['neighbours', 'Neighbours', 'they live next door to each other', 'neighbours with {other}'],
        ['mentor', 'Mentor to', 'teaches and guides them', 'a mentor to {other}'],
        ['rivals', 'Rivals', 'always competing and keeping score', 'rivals with {other}'],
        ['enemies', 'Enemies', 'openly against each other', 'enemies with {other}'],
        ['partners_in_crime', 'Partners in crime', 'in on something together, trouble included', 'partners in crime with {other}'],
        ['one_night_stand', 'One night stand', 'they slept together once, no promises', 'a one night stand with {other}'],
        ['casual', 'Casual', 'hooking up without strings', 'in a casual, no-strings thing with {other}'],
        ['situationship', 'Situationship', 'more than friends, never defined', 'in an undefined situationship with {other}'],
        ['dating', 'Dating', 'they’re together', 'dating {other}'],
        ['engaged', 'Engaged', 'promised to marry', 'engaged to {other}'],
        ['married', 'Married', 'married to each other', 'married to {other}'],
        ['exes', 'Exes', 'they used to be together', '{other}’s ex'],
        ['affair', 'Affair', 'sleeping together behind someone’s back', 'having an affair with {other}'],
        ['secret_relationship', 'Secret relationship', 'together, but hiding it from everyone', 'in a secret relationship with {other}'],
        ['sugar', 'Sugar arrangement', 'money and gifts in exchange for company', 'in a sugar arrangement with {other}'],
        ['first_time', 'First time together', 'their first time being intimate', 'having their first time with {other}'],
        ['is_muse', 'Their muse', 'the person who inspires their art', '{other}’s muse'],
        ['power_imbalance', 'Power imbalance', 'one of them has real power over the other', 'in a power imbalance with {other}'],
        ['has_power_over', 'Has power over', 'holds real power over them, like a boss, teacher or captor', 'holds power over {other}'],
        ['under_power', 'Under their power', 'the other person holds real power over them', 'under {other}’s power'],
    ]],
    ['Next to each other', '⇕', '#c9b9e0', [
        ['older', 'Older', 'older, and it shows in how they relate', 'older than {other}'],
        ['younger', 'Younger', 'younger, and it shows in how they relate', 'younger than {other}'],
        ['age_gap', 'Big age gap', 'a gap in age that both of them feel', 'a big age gap with {other}'],
        ['taller', 'Taller', 'towers over them', 'taller than {other}, a real height difference'],
        ['shorter', 'Shorter', 'has to look up at them', 'shorter than {other}, a real height difference'],
        ['bigger', 'Bigger', 'bigger built, takes up more space', 'bigger than {other}, a real size difference'],
        ['smaller', 'Smaller', 'smaller beside them, easy to overpower', 'smaller than {other}, a real size difference'],
        ['stronger', 'Stronger', 'physically stronger', 'stronger than {other}'],
        ['smarter', 'Smarter', 'sharper, and both can tell', 'smarter than {other}'],
        ['richer', 'Richer', 'has more money and the power that comes with it', 'richer than {other}'],
    ]],
    ['What they think of them', '◉', '#b9c9e0', [
        ['fascinated', 'Fascinated by', 'can’t figure them out and wants to', 'fascinated by {other} and wants to figure them out'],
        ['intrigued_by', 'Curious about', 'wants to know more about them', 'curious about {other}'],
        ['impressed_by', 'Impressed by', 'rates them more than expected', 'impressed by {other}'],
        ['respects', 'Respects', 'takes them seriously and gives them their due', 'respects {other}'],
        ['finds_funny', 'Finds funny', 'laughs at their jokes and their antics', 'finds {other} funny'],
        ['thinks_smart', 'Thinks they’re clever', 'rates their mind', 'thinks {other} is clever'],
        ['thinks_stupid', 'Thinks they’re stupid', 'thinks they’re slow or dim', 'thinks {other} is stupid'],
        ['thinks_weird', 'Thinks they’re weird', 'finds them odd, for better or worse', 'thinks {other} is weird'],
        ['thinks_boring', 'Finds boring', 'struggles to stay interested in them', 'finds {other} boring'],
        ['finds_annoying', 'Finds annoying', 'they get on their nerves', 'finds {other} annoying'],
        ['offputting', 'Finds offputting', 'something about them rubs the wrong way', 'finds something about {other} offputting'],
        ['thinks_dangerous', 'Thinks they’re dangerous', 'sees them as someone who could do real harm', 'thinks {other} is dangerous'],
        ['underestimates', 'Underestimates', 'assumes they’re less capable than they are', 'underestimates {other}'],
        ['pities', 'Pities', 'feels sorry for them, maybe a little condescendingly', 'pities {other}'],
        ['suspicious_of', 'Suspicious of', 'thinks they’re up to something', 'suspicious of {other}'],
    ]],
    ['Friendship & trust', '♡', '#dba6b9', [
        ['likes', 'Likes', 'enjoys them and is glad when they’re around', 'likes {other}'],
        ['enjoys_company', 'Enjoys their company', 'time with them is easy and fun', 'enjoys {other}’s company'],
        ['comfortable_with', 'Comfortable with', 'can relax and be themselves around them', 'comfortable around {other}'],
        ['trusts', 'Trusts', 'believes their intentions and will rely on them', 'trusts {other}'],
        ['confides_in', 'Confides in', 'tells them things they don’t tell others', 'confides in {other}'],
        ['safe_with', 'Feels safe with', 'lets their guard down around them', 'feels safe with {other}'],
        ['understands', 'Feels understood by', 'feels they get a side of them most people miss', 'feels understood by {other}'],
        ['admires', 'Admires', 'looks up to them and values what they do', 'admires {other}'],
        ['proud', 'Proud of', 'takes pride in them and what they’ve done', 'proud of {other}'],
        ['grateful_to', 'Grateful to', 'owes them thanks and feels it', 'grateful to {other}'],
        ['loves', 'Loves', 'loves them; what kind of love depends on what they are to each other', 'loves {other}'],
        ['cherishes', 'Cherishes', 'holds them dear; their presence feels precious', 'cherishes {other}'],
        ['dotes', 'Dotes on', 'spoils them with attention and little favours', 'dotes on {other}'],
        ['protects', 'Wants to protect', 'wants to keep them safe and steps in when they’re threatened', 'wants to protect {other}'],
        ['misses', 'Misses', 'misses their company and wants that closeness back', 'misses {other}'],
        ['forgives', 'Wants to forgive', 'wants to forgive them, even if the hurt is still there', 'wants to forgive {other}'],
    ]],
    ['Attraction & romance', '✧', '#d7afd4', [
        ['finds_attractive', 'Finds attractive', 'physically drawn to them', 'finds {other} attractive'],
        ['finds_hot', 'Finds hot', 'finds them sexy and it’s hard to ignore', 'finds {other} hot'],
        ['finds_pretty', 'Finds pretty', 'thinks they’re lovely to look at', 'finds {other} pretty'],
        ['finds_cute', 'Finds cute', 'finds their looks or little habits endearing', 'finds {other} cute'],
        ['finds_ugly', 'Finds ugly', 'doesn’t like how they look', 'finds {other} ugly'],
        ['grossed_out', 'Grossed out by', 'physically repelled by them', 'grossed out by {other}'],
        ['crush', 'Has a crush on', 'giddy and nervous about them', 'has a crush on {other}'],
        ['in_love', 'In love with', 'romantically, deeply in love', 'in love with {other}'],
        ['lusts_after', 'Lusts after', 'wants them sexually and badly', 'lusts after {other}'],
        ['fantasises', 'Fantasises about', 'pictures them in private and can’t stop', 'fantasises about {other}'],
        ['longs_for', 'Longs for', 'aches for them, especially when apart', 'longs for {other}'],
        ['flirts_with', 'Flirts with', 'can’t help flirting when they’re around', 'flirts with {other}'],
        ['heartbroken_over', 'Heartbroken over', 'they broke their heart, or losing them did', 'heartbroken over {other}'],
    ]],
    ['Attachment & power', '◆', '#c0acd9', [
        ['obsessed', 'Obsessed with', 'fixates on them; attention keeps circling back', 'obsessed with {other}'],
        ['idolises', 'Idolises', 'puts them on a pedestal and can’t see their flaws', 'idolises {other}'],
        ['cant_let_go', 'Can’t let go of', 'tries to move on and can’t', 'can’t let go of {other}'],
        ['preserves', 'Wants to preserve', 'wants to keep them just as they are; change or loss feels like a threat', 'wants to preserve {other} exactly as they are'],
        ['possessive', 'Possessive of', 'wants them to themselves and resents sharing them', 'possessive of {other}'],
        ['wants_to_own', 'Wants to own', 'wants them as theirs, completely', 'wants to own {other}'],
        ['jealous', 'Jealous over', 'threatened when anyone else gets close to them', 'jealous over {other}'],
        ['envies', 'Envies', 'wants what they have and feels the comparison', 'envies {other}'],
        ['rival', 'Competes with', 'needs to come out ahead of them', 'competes with {other}'],
        ['approval', 'Wants their approval', 'their opinion matters and they want it to be good', 'wants {other}’s approval'],
        ['impresses', 'Wants to impress', 'plays up whatever might impress them', 'wants to impress {other}'],
        ['depends', 'Depends on', 'leans on them and can’t picture managing without them', 'depends on {other}'],
        ['wrapped', 'Wrapped around their finger', 'bends to their wishes easily', 'wrapped around {other}’s finger'],
        ['submits_to', 'Submits to', 'yields to them and wants to be under their control', 'submits to {other}'],
        ['dominates', 'Dominates', 'takes charge of them and expects to be obeyed', 'dominates {other}'],
        ['controls', 'Wants to control', 'wants a say in their choices and steers them', 'wants to control {other}'],
        ['manipulates', 'Manipulates', 'plays them to get what they want', 'manipulates {other}'],
        ['uses', 'Uses', 'sees them as useful, more tool than person', 'uses {other}'],
        ['wants_to_corrupt', 'Wants to corrupt', 'wants to pull them into darker things', 'wants to corrupt {other}'],
        ['wants_to_break', 'Wants to break', 'wants to tear them down until they give in', 'wants to break {other}'],
        ['owes', 'Owes', 'in their debt, and both know it', 'owes {other}'],
    ]],
    ['Hurt & guilt', '☂', '#a5b5e3', [
        ['hurt_by', 'Hurt by', 'still stinging from something they did', 'hurt by {other}'],
        ['betrayed_by', 'Betrayed by', 'trusted them and got burned', 'betrayed by {other}'],
        ['used_by', 'Feels used by', 'feels like they only get used', 'feels used by {other}'],
        ['abandoned_by', 'Abandoned by', 'feels left behind by them', 'feels abandoned by {other}'],
        ['disappointed', 'Disappointed in', 'hoped for more from them', 'disappointed in {other}'],
        ['embarrassed_by', 'Embarrassed by', 'cringes at them, especially in front of others', 'embarrassed by {other}'],
        ['guilty_toward', 'Feels guilty toward', 'did them wrong and it weighs on them', 'feels guilty toward {other}'],
        ['regrets', 'Regrets', 'wishes things had gone differently with them', 'regrets how things went with {other}'],
    ]],
    ['Dislike & hostility', '↯', '#d69d95', [
        ['irritated_by', 'Irritated by', 'little things they do grate', 'irritated by {other}'],
        ['cant_stand', 'Can’t stand', 'their presence alone is too much', 'can’t stand {other}'],
        ['judges', 'Judgemental of', 'holds them to harsh standards and notices every failing', 'judgemental of {other}'],
        ['looks_down', 'Looks down on', 'sees them as beneath them', 'looks down on {other}'],
        ['distrusts', 'Distrusts', 'questions their motives and looks for what they’re hiding', 'distrusts {other}'],
        ['resents', 'Resents', 'carries a grudge that colours everything', 'resents {other}'],
        ['blames', 'Blames', 'holds them responsible for what went wrong', 'blames {other}'],
        ['intimidated_by', 'Intimidated by', 'feels small and wary around them', 'intimidated by {other}'],
        ['fears', 'Afraid of', 'sees them as a threat', 'afraid of {other}'],
        ['avoids', 'Wants to avoid', 'looks for ways out of their company', 'wants to avoid {other}'],
        ['mocks', 'Mocks', 'makes fun of them, to their face or behind their back', 'mocks {other}'],
        ['despises', 'Despises', 'holds them in contempt', 'despises {other}'],
        ['hates', 'Hates', 'feels hatred toward them', 'hates {other}'],
        ['wants_to_humiliate', 'Wants to humiliate', 'wants to see them shamed and brought low', 'wants to humiliate {other}'],
        ['wants_to_hurt', 'Wants to hurt', 'wants them to suffer', 'wants to hurt {other}'],
        ['revenge', 'Wants revenge on', 'wants to make them pay', 'wants revenge on {other}'],
        ['wants_kill', 'Wants to kill', 'wants them dead and considers acting on it', 'wants {other} dead'],
    ]],
];

// These used to live on each person's Facts & scene sheet; they now belong to a specific pairing.
export const PAIR_FACT_IDS = ['friends', 'childhood_friends', 'roommates', 'coworkers', 'neighbours', 'rivals', 'enemies',
    'partners_in_crime', 'one_night_stand', 'casual', 'dating', 'engaged', 'married', 'exes', 'affair', 'secret_relationship',
    'sugar', 'first_time', 'is_muse', 'power_imbalance', 'age_gap', 'older', 'younger', 'taller', 'shorter', 'bigger',
    'smaller', 'stronger', 'smarter'];
export const RELATIONSHIP_TAGS = RELATIONSHIP_CATEGORIES.flatMap(([category, , color, rows]) =>
    rows.map(([id, label, cue, prompt]) => ({ id, label, cue, prompt, category, color })));
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

// Hate and murderous intent change kind, not just amount, as they rise.
const SCALED = {
    hates: [[100, 'is consumed by hatred for {other}'], [81, 'loathes {other}'], [41, 'hates {other}'], [11, 'dislikes {other}'], [1, 'feels a flicker of hostility toward {other}']],
    wants_kill: [[100, 'killing {other} is a driving goal; their choices and actions work toward it'], [81, 'intends to kill {other} and looks for the chance'],
        [41, 'wants {other} dead, and it weighs on their choices'], [11, 'sometimes wishes {other} were dead'], [1, 'has a fleeting wish that {other} were dead']],
};
// The panel shows what a slider means; the model gets a line with the other person's name in it.
export function relationshipCue(tag, value) {
    const scaled = SCALED[tag.id]?.find(([min]) => value >= min)?.[1];
    return scaled ? scaled.replaceAll('{other}', 'them') : tag.cue;
}
export function relationshipText(tag, value, other) {
    const full = RELATIONSHIP_BY_ID[tag.id] ?? tag;
    const scaled = SCALED[tag.id]?.find(([min]) => value >= min)?.[1];
    return (scaled ?? full.prompt ?? full.cue).replaceAll('{other}', other);
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
