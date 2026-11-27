// 2.0.30: what someone owns, by kind and by where it is kept, and when each item is worth sending.
// Kinds and places are guessed from the item's name and note until the player taps their own.
// Weapons go in danger or violence; substances only when the scene touches them; things kept
// at home or in the car only when the scene is there. Data and pure functions.
export const INV_KINDS = [
    ['weapon', 'Weapon', '\u2694'], ['substance', 'Substance', '\u2668'], ['everyday', 'Everyday', '\u26b7'],
    ['tool', 'Tool', '\u2692'], ['keepsake', 'Keepsake', '\u2709'],
];
export const INV_PLACES = [['on', 'Carried'], ['car', 'Car'], ['home', 'Home'], ['else', 'Elsewhere']];
const GUESS = [
    ['weapon', /\b(guns?|pistols?|revolvers?|rifles?|shotguns?|handguns?|glock|colt|beretta|smith|magnum|\.?(22|38|45|357|9mm)|ammo|bullets?|rounds|magazines?|clips?|holster|knife|knives|blade|switchblade|pocketknife|pocket knife|razor|machete|bat|crowbar|brass knuckles|knuckle dusters?|taser|pepper spray|mace|club|baton|axe|hatchet|garrote|sword)\b/i],
    ['substance', /\b(cigs?|cigarettes?|smokes?|cigars?|tobacco|pack of|marlboros?|camels?|luckies|newports?|vapes?|weed|pot|joints?|blunts?|spliffs?|grass|reefer|stash|baggies?|bags? of|coke|cocaine|blow|heroin|pills?|xanax|oxy|percs?|tabs|acid|molly|vials?|powder|bottle of|flask|whiske?y|bourbon|vodka|gin|rum|beers?|booze|liquor|wine|lean|syrup|needles?|syringes?|rolling papers|papers|lighter|matches|zippo)\b/i],
    ['tool', /\b(tools?|toolbox|wrench|hammer|screwdriver|pliers|flashlight|torch|rope|duct tape|zip ties?|tape|shovel|jack|jumper cables|lockpicks?|crowbar|camera|radio|walkie|first aid|med kit|binoculars|map|cuffs|handcuffs)\b/i],
    ['keepsake', /\b(photos?|photographs?|pictures?|letters?|notes?|rings?|necklace|locket|chain|bracelet|watch|dog tags?|medals?|journal|diary|teddy|ribbon|charm|rosary|cross|pendant|keepsake|memento)\b/i],
];
export const guessKind = text => (GUESS.find(([, re]) => re.test(String(text ?? ''))) ?? ['everyday'])[0];
const PLACE_WORDS = {
    car: /\b(truck|car|cab|pickup|van|jeep|glove ?box|glove compartment|dash(board)?|trunk|bed of the truck|truck bed|under the seat|passenger seat|back seat|console|motorcycle|bike|saddlebags?)\b/i,
    home: /\b(home|apartment|flat|house|place|kitchen|bedroom|closet|drawer|nightstand|dresser|cabinet|safe|basement|garage|attic|shelf|under the bed|under the mattress|freezer|fridge|bathroom|medicine cabinet|living room|room)\b/i,
    on: /\b(on (him|her|them)|pocket|jacket|coat|waistband|belt|holster|boot|sock|wallet|purse|bag|backpack|sleeve|hand|neck|wrist|finger|always carries)\b/i,
};
// A place guessed from the note the player wrote (where / details). '' when it says nothing about a place.
export function guessPlace(note) {
    const t = String(note ?? '');
    for (const k of ['car', 'home', 'on']) if (PLACE_WORDS[k].test(t)) return k;
    return '';
}
export const kindOf = item => INV_KINDS.some(([k]) => k === item?.kind) ? item.kind : guessKind(`${item?.text ?? ''} ${item?.note ?? ''}`);
// Tapped place first, then where the story last put it, then the note's guess, then on them.
export const placeOf = item => INV_PLACES.some(([k]) => k === item?.where) ? item.where : item?.at || guessPlace(item?.note) || 'on';
// The scene is somewhere the thing could be reached: in or by the car, or at home.
const HERE = {
    car: /\b(truck|car|cab|pickup|van|jeep|glove ?box|trunk|passenger seat|back seat|driv(e|es|ing|en)|drove|parked|parking lot|engine|steering wheel|windshield|dashboard|road|highway|motorcycle|bike)\b/i,
    home: /\b(home|apartment|flat|house|his place|her place|their place|kitchen|bedroom|living room|couch|sofa|bathroom|hallway|front door|porch|garage|basement|bed)\b/i,
};
export const DANGER_SCENE = /\b(guns?|pistols?|shotguns?|rifles?|knife|knives|switchblade|weapons?|armed|shoot(s|ing|er)?|shot (him|her|them|you|me|at|dead)|fir(e|es|ed|ing) (at|a shot|off)|gunfire|gunshots?|bullets?|bleed(s|ing)|bled|stab\w*|fist ?fights?|fights? (him|her|them|you|me|back|off)|fighting (him|her|them|you|me|back|off)|punch(es|ed|ing)?|throws? a punch|brawl\w*|attack\w*|threat(en|ens|ened|ening)?|kill\w*|murder\w*|hurt (him|her|them|you|me)|beat\w* (him|her|them|you|me|up)|chok(e|es|ed|ing) (him|her|them|you|me)|strangl\w*|intruder|break-in|broke in|breaking in|burglar\w*|robb(ed|ing|ery|er)|mugg\w*|ambush\w*|chas(e|ed|es|ing) (him|her|them|you|me|after)|in danger|cops?|police|sirens?|gangs?|hostage|kidnap\w*|cornered|reach\w* for (his|her|their|the) (gun|knife|waistband|belt))\b/i;
const SUBST_SCENE = {
    smoke: /\b(cigs?|cigarettes?|smok(e|es|ed|ing)|a light|light (it|one|up)|lighter|tobacco|ashtray|drag|nicotine|vap(e|es|ing))\b/i,
    drug: /\b(weed|pot|joint|blunt|spliff|high|stoned|get high|getting high|roll (one|a joint|up)|stash|dealer|score|coke|cocaine|blow|line|bump|pills?|drugs?|fix|using|xanax|oxy|molly|acid|trip\w*|vial|powder|baggie|needle)\b/i,
    drink: /\b(drink\w*|drank|booze|liquor|beer|whiske?y|bourbon|vodka|gin|rum|wine|bottle|flask|shot|bar|thirsty|pour\w*)\b/i,
};
const words = t => String(t ?? '').toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3 && !/^(the|and|his|her|their|old|new|small|big|pack|bag|box|some|one|two)$/.test(w));
const named = (item, scene) => words(item.text).some(w => new RegExp(`\\b${w}(s|es)?\\b`, 'i').test(scene));
// Which substance talk an item answers to: a pack of cigarettes answers "got a light?", a flask answers drinks.
const substKind = item => SUBST_SCENE.smoke.test(item.text) || /\b(marlboro|camel|luck|newport|zippo|matches|papers)/i.test(item.text) ? 'smoke'
    : /\b(flask|bottle|whiske?y|bourbon|vodka|gin|rum|beer|booze|liquor|wine)\b/i.test(item.text) ? 'drink' : 'drug';
// Whether one carried item belongs in this reply's note. scene: the recent messages; gate.danger: danger or violence;
// refresh: the occasional reminder reply. Things named in the scene always go.
export function invSent(item, scene, gate = {}) {
    if (!item?.carried || !item.text) return false;
    if (named(item, scene)) return true;
    const where = placeOf(item);
    if (where === 'home' || where === 'car') { if (!HERE[where].test(scene)) return false; }
    else if (where === 'else') return false;
    const kind = kindOf(item);
    if (kind === 'weapon') return !!gate.danger;
    if (kind === 'substance') return SUBST_SCENE[substKind(item)].test(scene);
    if (kind === 'keepsake' || kind === 'tool') return !!gate.refresh || (kind === 'tool' && !!gate.danger);
    return true;
}
const PLACE_LINE = { on: 'on them', car: 'kept in the car', home: 'kept at home', else: 'kept elsewhere' };
// One line per item, saying where it is when that isn't on them. owner: whose things these are, for the wording.
export function invLine(item) {
    const where = placeOf(item), note = item.note ? item.note : '';
    const at = where === 'on' ? note : [PLACE_LINE[where], note].filter(Boolean).join(', ');
    return `${item.text}${at ? ` (${at})` : ''}`;
}
// Where the story moves a thing in his own sentences: left in the truck, put in a drawer, pocketed. Returns
// { id: place } for items whose name and a place share one of his sentences.
const PUT = /\b(leaves?|left|stash\w*|stows?|stowed|tucks?|tucked|puts?|shoves?|shoved|tosses|tossed|throws?|threw|drops?|dropped|locks?|locked|hides?|hid|keeps?|kept|stores?|stored|slips?|slipped|slides?|slid|sets?|stuffs?|stuffed|returns?|returned)\b/i;
const TAKE = /\b(grabs?|grabbed|takes?|took|pockets?|pocketed|picks? up|picked up|pulls? out|pulled out|brings?|brought|fetch\w*|retriev\w*|snatch\w*|straps? on|strapped on|holsters?|holstered)\b/i;
export function placesFrom(sentences, items) {
    const out = {};
    for (const s of sentences) for (const item of items) {
        if (!named(item, s)) continue;
        const into = /\b(in|into|inside|under|on|at|back in|back into|back at)\b/i.test(s);
        if (PUT.test(s) && into) { const k = ['car', 'home'].find(p => PLACE_WORDS[p].test(s)); if (k) { out[item.id] = k; continue; } }
        if (TAKE.test(s) || /\b(into|in) (his|her|their) (pocket|jacket|waistband|belt|boot|wallet|bag)\b/i.test(s)) out[item.id] = 'on';
    }
    return out;
}
