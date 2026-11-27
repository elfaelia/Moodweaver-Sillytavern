// 2.0.29: what the character takes in the story's own narration, for when the hidden line and the board don't
// name it as a fact: a drug snorted, smoked, swallowed or shot, and drinks counted over his recent replies.
// Only sentences where he is the one doing it (his name or his pronoun first). Data and pure functions.
const DRINK_VERB = /\b(sips?|sipped|sipping|swigs?|swigged|swigging|drinks?|drank|drinking|downs?|downed|downing|knocks? back|knocked back|chugs?|chugged|nurs(?:es|ed|ing)|tips? (?:back|up)|takes? a (?:pull|swallow|drink|sip|swig|mouthful|long pull|slug)|took a (?:pull|swallow|drink|sip|swig|mouthful|slug)|cracks? (?:open )?(?:a|another|his|her)|pours? (?:himself|herself|themself)|finishes (?:his|her|their|the) (?:beer|drink|glass|bottle|can))\b/i;
const BOOZE = /\b(beers?|brews?|whiske?y|bourbon|vodka|gin|rum|tequila|wine|scotch|brandy|liquor|booze|shots?|ale|lager|stout|cider|moonshine|martini|cocktail|highball|hooch|cognac|sake|mezcal|everclear|pbr|bud light|budweiser|coors|natty|four ?loko)\b/i;
const TAKE = [
    [/\b(snorts?|snorted|snorting|sniffs? (?:up|it|the|a)|sniffed (?:up|it|the|a)|does a (?:line|bump)|did a (?:line|bump)|takes? a (?:line|bump|hit)|took a (?:line|bump|hit)|keys? (?:a bump|it)|bumps? (?:of|it|off))\b/i, 'nose'],
    [/\b(shoots? up|shot up|injects?|injected|ties? off|tied off|cooks? (?:a|the) spoon)\b/i, 'vein'],
    [/\b(tokes?|toked|takes? a (?:drag|toke|rip)|took a (?:drag|toke|rip)|hits? the (?:joint|blunt|bong|pipe|vape|pen)|lights? (?:a|the|up a|up the) (?:joint|blunt|spliff|bowl|pipe)|smokes? (?:a |the |some )?(?:joint|blunt|spliff|weed|pot|bowl|bong|crack|meth|rock))\b/i, 'smoke'],
    [/\b(pops? (?:a|two|some|another|the)? ?(?:pills?|tabs?|xanny|xanax|bars?|molly|oxy|percs?)|swallows? (?:a|two|some|the)? ?(?:pills?|tabs?|capsules?)|dry-swallows?|drops? (?:a tab|acid)|takes? (?:a|two|some) (?:pills?|tabs?))\b/i, 'pill'],
];
const NOSE = /\b(vials?|powder|lines?|bumps?|key|baggie|bag|baggy|bill|note|straw|mirror|off (?:the|his|her|their|a) (?:back|table|counter|mirror|key|hand|thumb|knuckle|screen|phone)|white|crushed)\b/i;
const WHAT = [
    [/\b(coke|cocaine|blow|snow|yayo|nose candy)\b/i, 'coked_up'], [/\b(heroin|smack|junk|horse)\b/i, 'on_heroin'],
    [/\b(crack|rock)\b/i, 'on_crack'], [/\b(weed|pot|joint|blunt|spliff|reefer|marijuana|bong|bowl|grass|dope)\b/i, 'stoned'],
    [/\b(acid|lsd|tabs?|shrooms?|mushrooms)\b/i, 'tripping'], [/\b(molly|mdma|ecstasy|x pill|e pill)\b/i, 'rolling'],
    [/\b(oxy|oxycontin|percs?|percocet|vicodin|morphine)\b/i, 'on_painkillers'], [/\b(xanax|xanny|bars|valium|benzos?)\b/i, 'on_tranquillisers'],
    [/\b(adderall|ritalin)\b/i, 'on_adderall'], [/\b(lean|codeine|syrup)\b/i, 'sipping_lean'], [/\b(poppers)\b/i, 'poppers'],
];
const sentences = t => String(t ?? '').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/"[^"]*"|\u201c[^\u201d]*\u201d/g, ' ').split(/(?<=[.!?])\s+|\n+/);
// who: { name, pronoun: 'he' | 'she' | 'they' }. Sentences he leads: his name, or his pronoun, first.
export function his(text, who) {
    const first = String(who?.name ?? '').split(/\s+/)[0], p = { he: 'he|his', she: 'she|her', they: 'they|their' }[who?.pronoun] ?? 'he|she|they';
    const lead = new RegExp(`^\\s*(?:then |and |so |still |after(?: that)?,? )?(?:${first ? `${first.replace(/[^a-z]/gi, '')}|` : ''}${p})\\b`, 'i');
    return sentences(text).filter(s => lead.test(s));
}
// What a drug he takes in this reply is, as a fact id, or '' (a drug he took but nobody names reads as High).
export function drugTaken(text, who) {
    for (const s of his(text, who)) {
        const how = TAKE.find(([re]) => re.test(s)); if (!how) continue;
        // A snort is a laugh unless something says drugs: a vial, powder, a line, a key, a note, off a surface.
        if (how[1] === 'nose' && !NOSE.test(s) && !WHAT.some(([re]) => re.test(s))) continue;
        const what = WHAT.find(([re]) => re.test(s));
        return what ? what[1] : how[1] === 'smoke' && !/\b(crack|meth|rock)\b/i.test(s) ? 'stoned' : 'high';
    }
    return '';
}
// Whether he drinks alcohol in this reply.
export const drinksIn = (text, who) => his(text, who).some(s => DRINK_VERB.test(s) && BOOZE.test(s));
// Drinks over his recent replies (each reply he drinks in counts once): tipsy from 3, drunk from 7.
export const DRINKS_TIPSY = 3, DRINKS_DRUNK = 7, DRINKS_WINDOW = 12;
export function drinkFact(count) { return count >= DRINKS_DRUNK ? 'drunk' : count >= DRINKS_TIPSY ? 'tipsy' : ''; }
