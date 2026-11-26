import { clamp } from './util.js';
import { pronounize } from './pronouns.js';
// More Bonds meters, all off until you switch them on, and the dynamics they unlock. Each meter is
// how the character is toward your persona, moved by the reply's hidden line like Friendship and Romance.
// Data and small pure functions only; bond.js does the reading and the panel.

// key, label, two-sided (-100..100) or not (0..100), start, hidden-line word, words by value, what Claude
// reads when it's strong (high, and low for two-sided ones), one-line panel description.
export const MORE_METERS = [
    ['ob', 'Obsession', false, 0, 'obsession', [[81, 'consumed'], [61, 'fixated'], [41, 'preoccupied'], [21, 'thinks about them a lot'], [1, 'curious'], [0, 'not obsessed']],
        (n, u) => `${u} is in every thought: ${n} replays, collects and plans around ${u}`, null, 'How much of their head you take up.'],
    ['po', 'Possessiveness', false, 0, 'possessive', [[81, 'treats them as property'], [61, 'openly possessive'], [41, 'possessive'], [21, 'a little territorial'], [1, 'notices who they talk to'], [0, 'not possessive']],
        (n, u) => `${n} acts like ${u} belongs to ${n}: hands on, deciding for ${u}, warning others off`, null, 'How much they think you\u2019re theirs.'],
    ['je', 'Jealousy', false, 0, 'jealousy', [[81, 'seething'], [61, 'jealous'], [41, 'watchful'], [21, 'twinges'], [1, 'a flicker of it'], [0, 'calm']],
        (n, u) => `anyone near ${u} is a rival: ${n} questions, goes cold, punishes ${u} or them`, null, 'How threatened they are by anyone near you.'],
    ['pr', 'Protectiveness', false, 0, 'protective', [[81, 'would kill for them'], [61, 'fiercely protective'], [41, 'protective'], [21, 'watches out for them'], [1, 'keeps half an eye on them'], [0, 'not protective']],
        (n, u) => `${n} puts ${n}self between ${u} and any harm, and calls the control that comes with it care`, null, 'How hard they guard you.'],
    ['re', 'Respect', true, 0, 'respect', [[85, 'admires them'], [60, 'looks up to them'], [35, 'respects them'], [1, 'takes them seriously'], [0, 'neutral'], [-34, 'unconvinced by them'], [-59, 'looks down on them'], [-84, 'scornful'], [-100, 'contempt']],
        (n, u) => `${n} takes ${u} seriously: listens, argues as an equal, is privately impressed`, (n, u) => `${n} holds ${u} in contempt: talks over, mocks, explains slowly`, 'From contempt to admiration.'],
    ['fa', 'Fascination', false, 0, 'fascination', [[81, 'can\u2019t look away'], [61, 'fascinated'], [41, 'intrigued'], [21, 'curious'], [1, 'mildly interested'], [0, 'indifferent']],
        (n, u) => `${n} studies ${u}: watching reactions, testing, wanting to understand or capture ${u}`, null, 'How much they want to study or capture you.'],
    ['pe', 'Pedestal', true, 0, 'pedestal', [[85, 'worships the idea of them'], [60, 'idealises them'], [35, 'thinks the world of them'], [1, 'a little starry-eyed'], [0, 'sees them as they are'], [-34, 'a little let down'], [-59, 'disappointed'], [-84, 'disenchanted'], [-100, 'disillusioned']],
        (n, u) => `${n} sees a perfect version of ${u} and edits out anything that doesn't fit`, (n, u) => `${u} has fallen off the pedestal: ${n} punishes ${u} for not being who ${n} imagined`, 'From disillusioned to worshipping an idea of you.'],
    ['de', 'Dependence', false, 0, 'dependence', [[81, 'can\u2019t function without them'], [61, 'leans on them'], [41, 'relies on them'], [21, 'likes having them around'], [1, 'glad of them'], [0, 'doesn\u2019t need them']],
        (n, u) => `${n} needs ${u} to get through the day and resents needing anyone`, null, 'How much they need you.'],
    ['hu', 'Urge to hurt', false, 0, 'hurt', [[81, 'on the edge of violence'], [61, 'wants to hurt them'], [41, 'imagines hurting them'], [21, 'a flicker of violence'], [1, 'a cold thought, gone fast'], [0, 'no urge to hurt']],
        (n, u) => `${n}'s urge to hurt ${u} is close to the surface: looks at throat and hands, a voice gone too calm`, null, 'How close they are to hurting you.'],
    ['op', 'Openness', false, 20, 'openness', [[81, 'nothing hidden'], [61, 'lets them see it'], [41, 'lets things slip'], [21, 'mostly masked'], [1, 'lets very little show'], [0, 'fully masked']],
        (n, u) => `${n} lets ${u} see what's under the mask, and both of them know how dangerous that is`, (n, u) => `${n} keeps the mask on with ${u}: performs, deflects, gives nothing real`, 'How much of the real them you get to see.'],
    ['gu', 'Guilt', false, 0, 'guilt', [[81, 'eaten by guilt'], [61, 'guilty'], [41, 'uneasy about it'], [21, 'a twinge'], [1, 'a small itch of it'], [0, 'no guilt']],
        (n, u) => `${n} is trying to make up for what ${n} did to ${u}: softness, gifts, staying close, and it doesn't erase it`, null, 'What they feel about what they\u2019ve done to you.'],
    ['co', 'Corruption', false, 0, 'corruption', [[81, 'has dragged them under'], [61, 'corrupting them'], [41, 'pulling them in'], [21, 'testing them'], [1, 'wonders how far they\u2019d go'], [0, 'leaves them be']],
        (n, u) => `${n} is pulling ${u} into ${n}'s world one compromise at a time and savours each step down`, null, 'How far they\u2019re dragging you into their world.'],
    ['kn', 'Knows about you', false, 0, 'knows', [[81, 'knows everything'], [61, 'knows far too much'], [41, 'knows a lot'], [21, 'has looked into them'], [1, 'knows the basics'], [0, 'knows what they\u2019ve been told']],
        (n, u) => `${n} knows more about ${u} than ${u} has said: routines, secrets and small details used too casually`, null, 'How much they\u2019ve found out by watching or digging.'],
    // Seven more, so care, rules, heat, grudges, chaos, loyalty and teaching can each steer a scene.
    ['ca', 'Care', false, 0, 'care', [[81, 'sees to their every need'], [61, 'tends to them'], [41, 'looks after them'], [21, 'checks on them'], [1, 'notices how they are'], [0, 'leaves them to it']],
        (n, u) => `${n} looks after ${u} with ${n}'s own hands: feeding, bathing, dressing, patching up, and the closeness that comes with it`, null, 'How much they look after you: feeding, bathing, dressing, nursing.'],
    ['di', 'Discipline', false, 0, 'discipline', [[81, 'rules everything they do'], [61, 'strict'], [41, 'sets rules'], [21, 'expects things'], [1, 'has a few preferences'], [0, 'no rules']],
        (n, u) => `${n} holds ${u} to rules: expectations said plainly, rewards for doing well, consequences for slipping`, null, 'Rules, rewards and punishments they hold you to.'],
    ['lu', 'Lust', false, 0, 'lust', [[81, 'burning for them'], [61, 'wants them badly'], [41, 'wants them'], [21, 'notices them'], [1, 'aware of them'], [0, 'no heat']],
        (n, u) => `${n} wants ${u} physically and it's never far from ${n}'s mind: looks, closeness, touches that linger`, null, 'How much they want you physically, over the whole relationship. The \u2668 Desire card is arousal right now.'],
    ['rs', 'Resentment', false, 0, 'resentment', [[81, 'bitter to the core'], [61, 'resents them'], [41, 'holds a grudge'], [21, 'a sore spot'], [1, 'a little sore'], [0, 'no grudge']],
        (n, u) => `${n} carries a grudge against ${u}: old wounds brought up, small paybacks, softness that gets punished`, null, 'Grudges and bitterness toward you, even alongside love.'],
    ['vo', 'Volatility', false, 0, 'volatility', [[81, 'about to blow'], [61, 'explosive'], [41, 'stormy'], [21, 'touchy'], [1, 'a bit short'], [0, 'steady']],
        (n, u) => `things between ${n} and ${u} are about to blow: tempers spike over nothing, and the making up is as intense as the fight`, null, 'How unstable it is: fights, breakups and making up.'],
    ['ly', 'Loyalty', false, 0, 'loyalty', [[81, 'would die for them'], [61, 'fiercely loyal'], [41, 'loyal'], [21, 'sticks around'], [1, 'on their side, loosely'], [0, 'owes them nothing']],
        (n, u) => `${n} stands by ${u} whatever it costs: covering for ${u}, staying when anyone sane would leave`, null, 'How bound they feel to you, even when they don\u2019t like you.'],
    ['gd', 'Guidance', false, 0, 'guidance', [[81, 'shaping who they become'], [61, 'teaching them'], [41, 'guides them'], [21, 'gives advice'], [1, 'drops a hint now and then'], [0, 'not teaching']],
        (n, u) => `${n} is teaching ${u} and steering who ${u} becomes: lessons, corrections, standards, and pride or disappointment in the result`, null, 'How much they teach and steer you, for better or worse.'],
    // Eight for the clinic, the mind, secrets and society groups, and for fear, rivalry, shame and devotion anywhere.
    ['cd', 'Conditioning', false, 0, 'conditioning', [[81, 'rewiring them'], [61, 'conditioning them'], [41, 'training habits'], [21, 'testing responses'], [1, 'notices what works on them'], [0, 'not conditioning']],
        (n, u) => `${n} is reshaping how ${u} thinks and reacts: cues, rewards and repetition, until ${u}'s responses start to look like ${n}'s design`, null, 'How far they\u2019re reshaping your habits and mind.'],
    ['cl', 'Clinical eye', false, 0, 'clinical', [[81, 'sees only a subject'], [61, 'studies them coldly'], [41, 'takes notes'], [21, 'professional interest'], [1, 'a passing professional glance'], [0, 'sees a person']],
        (n, u) => `${n} looks at ${u} as a case: symptoms, measurements and responses, with the person behind them easy to forget`, null, 'How much they see you as a case or a subject.'],
    ['se', 'Secrecy', false, 0, 'secrecy', [[81, 'a whole hidden life'], [61, 'keeps big secrets'], [41, 'hides things'], [21, 'holds a little back'], [1, 'a few things unsaid'], [0, 'nothing hidden']],
        (n, u) => `${n} is hiding something real, from ${u} or with ${u} from everyone else: cover stories, lowered voices, things kept out of sight`, null, 'What\u2019s kept hidden, from you or with you.'],
    ['ap', 'Appearances', false, 0, 'appearances', [[81, 'ruled by what people think'], [61, 'keeps up a front'], [41, 'minds who\u2019s watching'], [21, 'aware of eyes'], [1, 'glances at who\u2019s around'], [0, 'doesn\u2019t care who sees']],
        (n, u) => `what other people would think shapes how ${n} treats ${u}: one face in public, another behind the door`, null, 'How much what other people think shapes it.'],
    ['fe', 'Fear', false, 0, 'fear', [[81, 'terrified of them'], [61, 'afraid of them'], [41, 'wary of them'], [21, 'uneasy around them'], [1, 'a little on edge'], [0, 'not afraid']],
        (n, u) => `${n} is afraid of ${u}: watches ${u}'s moods, picks words carefully, flinches or freezes`, null, 'How afraid they are of you.'],
    ['ri', 'Rivalry', false, 0, 'rivalry', [[81, 'has to beat them'], [61, 'competing hard'], [41, 'keeping score'], [21, 'a little competitive'], [1, 'a little sizing up'], [0, 'no contest']],
        (n, u) => `${n} has to win against ${u}: every exchange is a contest, and losing stings more than it should`, null, 'How much it\u2019s a contest.'],
    ['sh', 'Shame', false, 0, 'shame', [[81, 'ashamed of wanting them'], [61, 'ashamed'], [41, 'embarrassed by it'], [21, 'self-conscious'], [1, 'a flush of it'], [0, 'unashamed']],
        (n, u) => `${n} is ashamed of what ${n} feels or does with ${u}: hides it, punishes ${n}self or ${u} for it, and comes back anyway`, null, 'Shame about what\u2019s between you.'],
    ['dv', 'Devotion', false, 0, 'devotion', [[81, 'lives to serve them'], [61, 'devoted'], [41, 'eager to please'], [21, 'attentive'], [1, 'keen to help'], [0, 'goes their own way']],
        (n, u) => `${n} wants to please ${u} and serve ${u}'s wishes, and measures ${n}self by ${u}'s approval`, null, 'How much they live to please you.'],
    ['rt', 'Restraint', false, 0, 'restraint', [[81, 'won\u2019t let themselves'], [61, 'holding it in'], [41, 'careful'], [21, 'a little guarded'], [1, 'holds back a touch'], [0, 'unguarded']],
        (n, u) => `${n} holds back what ${n} feels for ${u}, out of guilt, duty, propriety or fear of what it would cost; it shows in what ${n} almost does`, null, 'How much they hold back what they feel for you.'],
    // Seven more (1.69), for push-pull love, shared crimes, history, sacrifice and who's steering whom.
    ['sw', 'Sway', false, 0, 'sway', [[81, 'putty in their hands'], [61, 'easily swayed by them'], [41, 'bends for them'], [21, 'listens to them'], [1, 'hears them out'], [0, 'unmoved']],
        (n, u) => `${u} can steer ${n}: a look, a word or a sulk from ${u} changes what ${n} does, even while ${n} still gives the orders`, null, 'How much you can steer them, even when they hold the power.'],
    ['cm', 'Complicity', false, 0, 'complicity', [[81, 'bound by what they\u2019ve hidden'], [61, 'partners in it'], [41, 'covering for each other'], [21, 'looking the other way'], [1, 'knows a little too much'], [0, 'clean hands']],
        (n, u) => `${n} and ${u} are tied together by things they've done or hidden for each other: evidence cleaned up, alibis kept, and neither can leave without the other falling`, null, 'How tied together you are by crimes, cover-ups and secrets kept for each other.'],
    ['uw', 'Unworthiness', false, 0, 'unworthy', [[81, 'sure they\u2019d ruin them'], [61, 'thinks they\u2019re bad for them'], [41, 'feels they don\u2019t deserve them'], [21, 'a flicker of doubt'], [1, 'a quiet doubt'], [0, 'feels good enough']],
        (n, u) => `${n} believes ${n} is bad for ${u}, dirty, cursed or dangerous, and acts on it: keeping ${u} out of ${n}'s world and refusing to let ${u} carry ${n}'s feelings`, null, 'How much they think they\u2019re bad for you or don\u2019t deserve you.'],
    ['pa', 'Pushing away', false, 0, 'pushing away', [[81, 'trying to drive them off'], [61, 'pushing them away'], [41, 'keeping them back'], [21, 'a little avoidant'], [1, 'a step back now and then'], [0, 'lets them close']],
        (n, u) => `${n} is pushing ${u} away on purpose: cancelling, going cold, being crude or cruel or simply absent, so ${u} will stop coming back, and it isn't working on either of them`, null, 'How hard they\u2019re trying to keep you away, whatever they feel.'],
    ['ex', 'Exasperation', false, 0, 'exasperation', [[81, 'driven up the wall'], [61, 'exasperated'], [41, 'annoyed by them'], [21, 'mildly put out'], [1, 'a sigh here and there'], [0, 'unbothered']],
        (n, u) => `${u} drives ${n} up the wall and ${n} keeps coming back for more: sighs, eye-rolls, complaints, and attention that never leaves ${u}`, null, 'How much you annoy them, which can sit right beside fascination or love.'],
    ['hi', 'Shared past', false, 0, 'history', [[81, 'a lifetime together'], [61, 'deep history'], [41, 'years between them'], [21, 'some history'], [1, 'a little history'], [0, 'no history']],
        (n, u) => `${n} and ${u} share a long past: old jokes, childhood places, things only the two of them remember, and that history pulls at everything they do now`, null, 'How much shared past weighs on you both: childhood, years, old promises.'],
    ['sc', 'Sacrifice', false, 0, 'sacrifice', [[81, 'would give anything'], [61, 'would give up a lot'], [41, 'would give something up'], [21, 'would go out of their way'], [1, 'would do them a favour'], [0, 'keeps what\u2019s theirs']],
        (n, u) => `${n} would give up something huge for ${u}, a life, a love, a future or ${n}'s own safety, and knows it, and resents or fears what that means`, null, 'What they would give up for you, and how close it comes to a real choice.'],
    // Eight more (1.78): a love they think runs one way, crude and leering moments, 1950s paternalism, grooming,
    // play, pride, ease and loyalty tests. Fed by feelings like every other meter (engine/mood-meters.js).
    // 1.91.6: flipped. It used to start at "knows it's mutual", which is where a slow burn ends, not where it starts.
    // Now it starts at "thinks it's one-sided" and the story moves it up as they come to believe it's returned.
    // Old hidden lines that said "unrequited +5" still count, the other way round (metersOf).
    ['os', 'Thinks it\u2019s mutual', false, 0, 'mutual', [[81, 'knows it\u2019s mutual'], [61, 'believes it\u2019s returned'], [41, 'starting to hope'], [21, 'not sure where they stand'], [1, 'doubts it\u2019s returned'], [0, 'thinks it\u2019s one-sided']],
        (n, u) => `${n} has stopped doubting it: ${u} feels the same, and ${n} has started to act like someone who knows it`,
        (n, u) => `${n} is sure ${n} feels more for ${u} than ${u} does back, hides it to save face, and misreads every sign ${u} gives`, 'How sure they are that what they feel for you is returned. It starts one-sided and grows as they come to believe it.'],
    ['cr', 'Crudeness', false, 0, 'crude', [[81, 'filthy and leering'], [61, 'crude with them'], [41, 'off-colour'], [21, 'a dirty joke or two'], [1, 'the odd crude word'], [0, 'clean-mouthed']],
        (n, u) => `${n} is crude with ${u}: leering, handsy, saying the filthy thing out loud, worse with drink, whatever else ${n} feels`, null, 'How crude, leering or handsy they get with you, drunk or sober.'],
    ['pt', 'Paternalism', false, 0, 'paternal', [[81, 'decides everything for them'], [61, 'treats them like a child'], [41, 'knows best'], [21, 'a little patronising'], [1, 'a touch fatherly'], [0, 'treats them as an adult']],
        (n, u) => `${n} decides what's best for ${u} and does it without asking, kindly and firmly: what ${u} knows, wears, takes and does, for ${u}'s own good`, null, 'How much they decide for you \u201cfor your own good\u201d.'],
    ['gr', 'Grooming', false, 0, 'grooming', [[81, 'has them where they want them'], [61, 'grooming them'], [41, 'building them up'], [21, 'singling them out'], [1, 'paying them special notice'], [0, 'no agenda']],
        (n, u) => `${n} is building ${u} up for ${n}'s own ends, step by step: praise, gifts, private time and shared secrets, each one tying ${u} closer and cutting ${u} off a little more`, null, 'How far they\u2019re building trust and dependence to use later.'],
    ['pl', 'Playfulness', false, 0, 'playful', [[81, 'pure mischief together'], [61, 'playful'], [41, 'teasing'], [21, 'a little banter'], [1, 'the odd joke'], [0, 'serious']],
        (n, u) => `${n} is playful with ${u}: teasing, dares, daft voices and games, and the fun is half of what holds them together`, null, 'Teasing, games and banter between you.'],
    ['pi', 'Pride in them', false, 0, 'pride', [[81, 'bursting with pride'], [61, 'proud of them'], [41, 'impressed'], [21, 'notices their wins'], [1, 'quietly pleased with them'], [0, 'not impressed']],
        (n, u) => `${n} is proud of ${u}, who ${u} is and what ${u} does, and it shows: praise, bragging, keeping ${u}'s small wins`, null, 'How proud they are of you and what you do.'],
    ['fm', 'Ease', false, 0, 'ease', [[81, 'completely at home with them'], [61, 'at ease'], [41, 'comfortable'], [21, 'loosening up'], [1, 'warming up a little'], [0, 'on guard']],
        (n, u) => `${n} is at home with ${u}: no performance, comfortable silences, old habits and bare feet`, null, 'How comfortable and unguarded they are around you.'],
    ['ts', 'Testing', false, 0, 'testing', [[81, 'everything is a test'], [61, 'testing them'], [41, 'sets little traps'], [21, 'watching how they react'], [1, 'a raised eyebrow'], [0, 'takes them at their word']],
        (n, u) => `${n} keeps testing ${u}: questions with right answers, small traps, orders that make no sense, all to see if ${u} is loyal or means it`, null, 'How much they test your loyalty, love or obedience.'],
];
const MORE_KEYS = MORE_METERS.map(([k]) => k);
const DEF = Object.fromEntries(MORE_METERS.map(m => [m[0], m]));
export const moreWord = (k, v) => DEF[k][5].find(([min]) => v >= min)[1];
// Quick picks for the characters you play most. They only switch meters on; you can change any of them.
export const MORE_PRESETS = [
    ['Easterman', ['ob', 'po', 'pr', 'fa', 'de', 'gu', 'kn', 'ca', 'di', 'cd', 'cl', 'pt']],
    ['Jefferson', ['fa', 'co', 're', 'hu', 'po', 'op', 'gd', 'lu', 'gr', 'pi']],
    ['Joe', ['ob', 'pe', 'je', 'pr', 'kn', 'hu', 'gu']],
    ['Bateman', ['re', 'hu', 'op', 'fa', 'je', 'lu']],
    ['Rick', ['re', 'de', 'op', 'pr', 'gu', 'rs', 'ly', 'fa', 'ex', 'sc']],
    ['Easterman & Lamb', ['po', 'pr', 'ob', 'pe', 'di', 'cd', 'sw', 'dv', 'pt', 'ap']],
    ['Bateman & secretary', ['hu', 're', 'kn', 'cm', 'fa', 'ex', 'op']],
    ['Joe (mentor)', ['gd', 'kn', 'fa', 'ob', 'co', 'cm', 're', 'gr']],
    ['Dealer friend', ['pr', 'uw', 'pa', 'hi', 'lu', 'je', 'pe', 'cr', 'os', 'rt', 'sc', 'fm']],
    // By kind of relationship rather than by character.
    ['Captor', ['po', 'pr', 'ob', 'gu', 'ca', 'di', 'hu', 'fe']],
    ['Experiment', ['cl', 'cd', 'fa', 'kn', 'ca', 'di', 'co']],
    ['Secret affair', ['se', 'ap', 'sh', 'lu', 'je', 'gu', 'rt']],
    ['Forbidden love', ['rt', 'gu', 'ap', 'se', 'ly', 'lu']],
    ['Toxic on-off', ['rs', 'vo', 'ly', 'de', 'lu', 'gu', 'je', 'ri']],
    ['Romance', ['lu', 'ca', 'pr', 'je', 'op', 'ly', 'dv', 'pl', 'pi', 'fm']],
    ['Mentor', ['gd', 're', 'pr', 'ca', 'di', 'co', 'pi', 'ts']],
    ['Photographer & prot\u00e9g\u00e9', ['fa', 'gd', 'gr', 'pi', 'co', 'lu', 'ts', 're', 'se']],
    ['1950s marriage', ['pt', 'ap', 'di', 'ca', 'po', 'rt', 'se']],
    ['Childhood friends', ['hi', 'ly', 'pr', 'je', 'pa', 'uw', 'os', 'pl', 'fm']],
    ['Partners in crime', ['cm', 'se', 'ly', 'kn', 'co']],
];
export function cleanMore(raw) {
    const x = raw && typeof raw === 'object' ? raw : {};
    const range = k => DEF[k][2] ? [-100, 100] : [0, 100];
    const n = (k, v, d) => Number.isFinite(Number(v)) && v !== null && v !== '' ? clamp(Math.round(Number(v)), ...range(k)) : d;
    const anchor = x.anchor && typeof x.anchor === 'object' ? { ...Object.fromEntries(MORE_KEYS.map(k => [k, n(k, x.anchor[k], DEF[k][3])])),
        key: String(x.anchor.key ?? '').slice(0, 120), pos: Number.isFinite(Number(x.anchor.pos)) ? Math.round(Number(x.anchor.pos)) : -1 } : null;
    const pins = Object.fromEntries(MORE_KEYS.map(k => [k, x.pins?.[k] === null || x.pins?.[k] === undefined || x.pins?.[k] === '' ? null : n(k, x.pins[k], null)]));
    // 1.91.6: One-sided became "Thinks it's mutual". A value you set that said something (one-sided, doubts, not sure)
    // turns round so it means the same; one below 21 was the old "knows it's mutual" start, and starts over at one-sided.
    if ((Number(x.ver) || 0) < 2) { const turn = v => v === null || v === undefined ? v : v >= 21 ? 100 - v : 0; if (anchor) anchor.os = turn(anchor.os); pins.os = turn(pins.os); }
    return { on: [...new Set((Array.isArray(x.on) ? x.on : []).filter(k => DEF[k]))], anchor, pins, ver: 2 };
}
// list: [{ pos, key, s: { m: { ob: +3, ... } } }] oldest first. Meters that are off stay undefined, so
// nothing that depends on them can fire.
// cap: the largest step one reply can make, set by the chat's pace (bond.js PACE).
const EASE = { vo: 3 };
// Meters that can give way at once when the moment breaks through (2.0.18): the largest drop one reply can make.
const BREAKS = { rt: 50 };
export function computeMore(raw, list = [], cap = 10) {
    const d = cleanMore(raw), v = Object.fromEntries(MORE_KEYS.map(k => [k, DEF[k][3]]));
    let start = 0;
    if (d.anchor) {
        let at = d.anchor.key ? list.findIndex(x => x.key === d.anchor.key) : -1;
        if (at < 0 && d.anchor.key) for (let i = list.length - 1; i >= 0; i--) if (list[i].pos <= d.anchor.pos) { at = i; break; }
        for (const k of MORE_KEYS) v[k] = d.anchor[k]; start = at + 1;
    }
    for (let i = start; i < list.length; i++) for (const k of d.on) {
        const step = list[i].s?.m?.[k];
        // Pressure that isn't kept up eases (2.0.18): a reply that doesn't push volatility lets it settle a little.
        if (!step) { if (EASE[k] && v[k] > 0) v[k] = Math.max(0, v[k] - EASE[k]); continue; }
        v[k] = clamp(v[k] + clamp(step, -Math.max(cap, BREAKS[k] ?? 0), cap), DEF[k][2] ? -100 : 0, 100);
    }
    for (const k of MORE_KEYS) if (d.pins[k] !== null) v[k] = d.pins[k];
    return { values: Object.fromEntries(d.on.map(k => [k, v[k]])), on: d.on, pins: d.pins };
}
// Dragging a bar sets every meter where it stands now; later replies move them from there.
export function setMore(bond, key, value, list = [], cap = 10) {
    if (!DEF[key]) return;
    const d = bond.more = cleanMore(bond.more), now = computeMore({ ...d, on: MORE_KEYS }, list, cap).values, last = list[list.length - 1];
    const v = clamp(Math.round(Number(value) || 0), DEF[key][2] ? -100 : 0, 100);
    d.anchor = { ...now, [key]: v, key: last?.key ?? '', pos: last?.pos ?? -1 };
    if (d.pins[key] !== null) d.pins[key] = v;
}
// What Claude reads under "[character] toward [player]": only meters that say something, in words.
// Openness and Thinks it's mutual say something at the low end too (fully masked; sure it's one-sided).
const LOW_SAYS = new Set(['op', 'os']);
const says = (k, v) => DEF[k][2] ? Math.abs(v) >= 25 : LOW_SAYS.has(k) ? v >= 41 || v <= 20 : v >= 21;
// The meters that make it onto the line, with their values (the overlap check reads this).
export function saidMeters(raw, list = [], cap = 10) {
    const { values, on } = computeMore(raw, list, cap);
    return Object.fromEntries(on.filter(k => says(k, values[k])).map(k => [k, values[k]]));
}
// The harsh, flaring meters (2.0.17) only act when a feeling in the moment wakes them: volatility needs anger, fear,
// coldness or clinging right now, jealousy needs clinging or anger, and so on. Asleep, they're listed as a tendency
// with "when something sets it off" and their behaviour line isn't sent, so a high meter stops making every reply
// the same. Feelings aimed at someone else don't wake them. moods: the character's feelings; about: who each is aimed at.
const WAKES = { vo: ['angry', 'scared', 'cold', 'attachment'], je: ['attachment', 'angry'], rs: ['angry', 'sad', 'cold'], hu: ['cruel', 'angry'], fe: ['scared'] };
const CARING = ['ly', 'pr', 'ca'];
export function meterAwake(k, moods = null, about = {}, family = () => '') {
    if (!WAKES[k] || !moods) return true;
    return Object.entries(moods).some(([id, v]) => v >= 41 && !about?.[id] && WAKES[k].includes(family(id)));
}
export function moreLines(raw, list, n, u, cap = 10, mood = null) {
    const { values, on } = computeMore(raw, list, cap);
    if (!on.length) return [];
    const said = on.filter(k => says(k, values[k]));
    if (!said.length) return [];
    const awake = k => meterAwake(k, mood?.moods, mood?.about, mood?.family);
    const words = said.map(k => `${DEF[k][1].toLowerCase()}: ${moreWord(k, values[k]).replace(/\bthem\b/, u)}${awake(k) ? '' : ' when something sets it off'}`);
    const strong = said.filter(awake).map(k => values[k] >= 61 ? DEF[k][6](n, u) : (DEF[k][2] && values[k] <= -60) || (LOW_SAYS.has(k) && values[k] <= 20) ? DEF[k][7]?.(n, u) : '').filter(Boolean).map(s => pronounize(s, n, u));
    // Strong care beside an awake harsh one: the care decides how far the harsh one goes with them.
    const harsh = said.some(k => WAKES[k] && awake(k) && values[k] >= 61), cares = said.some(k => CARING.includes(k) && values[k] >= 61);
    if (harsh && cares) strong.push(pronounize(`how much ${n} cares for ${u} decides how far the harsher ones go with ${u}`, n, u));
    return [`${words.join('; ')}${strong.length ? `. ${strong.map(s => s[0].toUpperCase() + s.slice(1)).join('. ')}` : ''}`];
}
// Field names on the hidden line: "obsession +3, jealousy +5, respect -4".
export function metersOf(v) {
    const out = {};
    for (const part of String(v ?? '').toLowerCase().replace(/[\u2212\u2013]/g, '-').split(/[,;]/)) {
        const m = part.trim().match(/^([a-z ]+?)\s*:?\s*([+-]\s*\d{1,3})/); if (!m) continue;
        const word = m[1].trim();
        // Older lines named the one-sided meter the other way round: "unrequited +5" now means 5 less sure it's mutual.
        const flipped = /^(unrequited|one[- ]sided)/.test(word), hit = flipped ? DEF.os : MORE_METERS.find(r => word.startsWith(r[4]) || word === r[1].toLowerCase()); if (!hit) continue;
        out[hit[0]] = (out[hit[0]] ?? 0) + clamp(Number(m[2].replace(/\s/g, '')) * (flipped ? -1 : 1), -25, 25);
    }
    return Object.keys(out).length ? out : null;
}
export const meterWeaveNames = on => on.filter(k => DEF[k]).map(k => DEF[k][4]);

