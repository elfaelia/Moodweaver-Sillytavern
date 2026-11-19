// Skill words against real-sounding scenes. Someone with every skill at the same level reads each passage; the
// skill the passage is about must be among the five sent (litSkills, cap 5), and plain passages with no skill in
// them should light very little. Run: node tests/skill-words.mjs   (prints misses and what plain text lights)
import { SKILL_BY_ID, litSkills } from '../engine/skills.js';

const everyone = Object.fromEntries(Object.keys(SKILL_BY_ID).map(id => [id, 5]));
const state = { skills: everyone, skillPins: {} };
const top = (text, cap = 5) => litSkills(state, text, '', cap).map(x => x.id);

// [passage, skill ids that must be lit (any one of the list counts when given as 'a/b')]
const CASES = [
    ['"Your heart is pumping harder now. Adrenaline. The body floods itself before it knows why." He presses two fingers under her jaw, counting.', ['biology']],
    ['He explains how the lungs pull oxygen into the blood, how the liver cleans it, how muscle tears and knits back stronger.', ['biology']],
    ['"The pupils dilate when you are frightened or aroused. The body cannot tell the difference," he murmured, tilting her chin to the lamp.', ['biology']],
    ['He talks about glands and hormones, the way the nervous system keeps the heart beating without asking permission.', ['biology']],
    ['He checks her pulse, writes down her temperature and prescribes something for the fever.', ['medicine']],
    ['He threads the needle and sutures the incision closed, the scalpel still on the tray.', ['surgery']],
    ['She lies to his face without blinking, inventing an alibi on the spot.', ['lying']],
    ['He reads the tremor in her hands and the way her eyes slide to the door. She is hiding something.', ['reading_people']],
    ['"You never said that. You are imagining things again, darling. You are tired."', ['gaslighting']],
    ['"Deeper now. Listen to my voice. Your eyelids are heavy," he said, the pendulum swinging.', ['hypnosis']],
    ['He towers over her, voice dropping. "Do that again and you will regret it."', ['intimidation']],
    ['"Who sent you? Answer me. Where were you on Tuesday night?"', ['interrogation']],
    ['He kisses her slowly, then harder, his mouth on her neck.', ['kissing/seduction']],
    ['He ties her wrists together with a neat knot and loops the rope to the headboard.', ['rope_work']],
    ['He loads a syringe from the vial and checks the dose of barbiturate twice.', ['pharmacology']],
    ['The EEG electrodes went on her temples; he wanted to see how her brain responded to the stimulus.', ['neurology']],
    ['He records the results in his notebook: subject seven, second trial, the control group unchanged.', ['experimentation']],
    ['He presses gauze to the cut and wraps a bandage tight around her arm to stop the bleeding.', ['first_aid']],
    ['He throws a right hook that splits the man\'s lip, then another to the gut.', ['violence']],
    ['She flicks the switchblade open and slashes at his arm.', ['knife_fighting']],
    ['He takes aim down the barrel of the revolver and squeezes the trigger.', ['marksmanship']],
    ['She creeps down the hall on bare feet, holding her breath past his door.', ['stealth']],
    ['She slides a bobby pin into the lock and works the tumblers until it clicks.', ['lockpicking']],
    ['He forges the signature on the letter, copying the loops of the original.', ['forgery']],
    ['"Pay up, or the photographs go to your wife." He slid the envelope across.', ['blackmail']],
    ['He shuffles, deals, and pushes his chips into the middle. "I raise."', ['gambling']],
    ['He plants a bug in the telephone and listens in from the van.', ['wiretapping']],
    ['He scrubs the floor with bleach and wraps the body in plastic sheeting.', ['body_disposal']],
    ['He swerves around the truck, floors it, and takes the corner on two wheels.', ['driving']],
    ['She whips the eggs, sets the roast in the oven and stirs the gravy on the stove.', ['cooking']],
    ['She rolls out the pastry, crimps the edges of the pie and slides it in to bake.', ['baking']],
    ['He sits at the piano and plays a slow nocturne in the dark.', ['piano']],
    ['She sings the old lullaby under her breath, soft and low.', ['singing']],
    ['They waltz across the ballroom, his hand at the small of her back.', ['dancing']],
    ['He develops the prints in the darkroom under the red light.', ['photography']],
    ['He sketches her face in charcoal, smudging the shadow under her cheekbone.', ['drawing']],
    ['He mixes the compound in a beaker and adds a drop of acid to the solution.', ['chemistry']],
    ['He quotes Keats and pulls a first edition of Dickens off the shelf.', ['literature']],
    ['She answers him in fluent French, then translates for the waiter.', ['languages']],
    ['He opens the hood, checks the spark plugs and tightens the carburettor with a wrench.', ['mechanics']],
    ['He solders the wires into the radio set and adjusts the vacuum tubes.', ['electronics']],
    ['She types the letter on the typewriter in shorthand from his dictation.', ['typing']],
    ['He works through the ledger, balancing the accounts and the invoices.', ['bookkeeping']],
    ['He kneels in the pew and recites a psalm from memory.', ['theology']],
    ['He preaches to the congregation about sin and salvation.', ['preaching']],
    ['He strokes the stray dog until it stops growling and licks his hand.', ['way_with_animals']],
    ['He saddles the horse and they gallop across the field.', ['horse_riding']],
    ['He follows the deer tracks through the snow to the snare.', ['hunting']],
    ['She mends the torn hem of her dress with a needle and thread.', ['sewing']],
    ['He mixes a martini, stirs it over ice and adds an olive.', ['bartending']],
    ['She sponge-bathes him, tucks the blanket around him and spoons broth into his mouth.', ['caretaking']],
    ['He works out the odds in his head and calculates the percentages before the next hand.', ['mathematics/gambling']],
    ['He chairs the board meeting, approves the budget and sends a memo to the department heads.', ['administration']],
    ['"I am sorry. I was wrong, and I should have listened. Can we talk it through?"', ['emotional_maturity']],
    ['He pours the bourbon and knocks back another glass without a flicker.', ['holding_liquor']],
    ['He bandages her and asks her to rate the pain from one to ten, his voice gentle. "There, there. You are safe."', ['bedside_manner/first_aid']],
    ['She curtsies, thanks him for the dance, and declines a second without giving offence.', ['etiquette/lady_manners']],
    ['He opens the car door for her, lights her cigarette and insists on paying.', ['gentleman_manners']],
    ['"On your knees," he says. She kneels, and he tells her to obey.', ['domination']],
    ['He holds her afterwards, wraps her in a blanket and brings her water. "You did so well."', ['aftercare']],
    ['She gives a speech to the crowd from the podium.', ['public_speaking']],
    ['He takes charge, barks orders at the orderlies and they rally around him.', ['leadership']],
    ['He haggles over the price until they agree on the terms of the deal.', ['negotiation']],
    ['He climbs the fire escape, vaults the wall and sprints across the rooftop.', ['parkour']],
    ['She swims out past the breakers and treads water in the dark sea.', ['swimming']],
    ['He lifts the crate onto his shoulder and carries her up the stairs without effort.', ['strength']],
    ['She notes it in his file, updates the chart and files the case notes.', ['record_keeping']],
    ['She puts on lipstick and pins her hair into curlers before setting it with hairspray.', ['hairdressing']],
    ['She chooses the tailored suit, matching gloves and the right hat for the luncheon.', ['fashion_sense']],
    ['He orders the wine, a vintage Bordeaux, and talks to the sommelier about the courses.', ['fine_dining']],
    // 1.76: modern and 1950s skills.
    ['She posts a selfie to her story and watches the likes on it climb; by morning it has gone viral.', ['social_media']],
    ['He writes her a love letter with his fountain pen and seals the envelope before he can change his mind.', ['letter_writing']],
    ['She rolls her stocking down slowly, a burlesque tease, never taking her eyes off him.', ['striptease']],
    ['The nurse changes the dressing, checks the catheter and writes it up at the nurse\'s station before the night shift ends.', ['nursing']],
    ['In the funeral parlour the undertaker embalms the body; the smell of formaldehyde never quite leaves the morgue.', ['embalming']],
    ['"How does that make you feel?" his therapist asks. "Let\'s unpack that. What are your boundaries here?"', ['counselling']],
    ['They are sparring in the gym, gloves on; he keeps his guard up, bobs and weaves, then throws a counterpunch.', ['boxing']],
    ['She takes him down with a judo throw and locks in an armbar before he can move.', ['martial_arts']],
    ['He still stands at attention when he hears the anthem; Korea never left him, the platoon, the foxhole, his dog tags.', ['soldiering']],
    ['He strips the gun on the kitchen table, oils the firing pin, and chambers a round.', ['gunsmithing']],
    ['She guesses his passcode, installs spyware on the phone and turns on location sharing.', ['hacking']],
    ['He looked her up that night, scrolled back through her old photos, and found her address in public records.', ['online_sleuthing']],
    ['He cooks meth in the trailer with a respirator on, checking the purity of every batch, the glassware fogged with fumes.', ['drug_cooking']],
    ['He jimmies the door with a slim jim, cracks the steering column and hotwires the Chevy.', ['car_theft']],
    ['They go bowling on league night; she rolls a strike in rented bowling shoes and he throws a gutter ball.', ['bowling']],
    ['She unrolls her yoga mat, slides into downward dog and holds the pose, breathing slowly.', ['yoga']],
    ['She chalks her hands, finds a handhold on the rock face and climbs while he belays her from below.', ['climbing']],
    ['In the cellar he skins the fox, sets the glass eyes and mounts it on a wire frame.', ['taxidermy']],
    ['He takes the helm, they cast off from the marina, and the mainsail fills as the tide turns.', ['sailing']],
    ['He points out Orion through the telescope, then the Big Dipper, and tells her about Sputnik and the space race.', ['astronomy']],
    ['"My lawyer will file the divorce papers. Read the clause in the prenup," she says. "Custody goes to court."', ['law']],
    ['He is debugging the software on his laptop, lines of code scrolling past, the database finally coming back up.', ['coding']],
    ['They souped up the V8 in the garage, chrome headers and a supercharger, then took it down to the drag strip.', ['hot_rods']],
    ['He tunes the shortwave receiver, gives his call sign, and listens to the static. "Over and out."', ['ham_radio']],
    ['The ad man pitches the campaign to the client: a slogan, a jingle and a billboard on Madison Avenue.', ['advertising']],
    ['She strikes a pose for the photo shoot, chin down, her best angle, like a pin-up on a magazine cover.', ['modelling']],
    ['The tailor measures him with a tape measure, chalk marks on the lapels, and pins the hem of the three-piece.', ['tailoring']],
    ['The DJ spins records at the sock hop, plays a request and the floor fills.', ['djing']],
    ['In the recording studio he makes beats on the 808, lays down a track and starts mastering.', ['music_production']],
    ['He freestyles over the beat in the cypher, spitting bars, rhymes landing one after another.', ['rapping']],
    ['She is filming him with the camcorder, footage for the edit, then sets up a tracking shot.', ['filmmaking']],
    ['"We\'re live," the announcer says into the microphone. "Stay with us after the commercial break."', ['broadcasting']],
    ['He flips the record on the hi-fi, a first pressing from his record collection, the B-side this time.', ['record_collecting']],
    ['In the jazz club he lifts the saxophone, wets the reed and plays a slow bebop solo.', ['horns']],
    ['She spends the afternoon canning peaches, filling mason jars and stacking the larder with marmalade and chutney.', ['preserving']],
];
// Passages about nothing in particular: they should light at most a couple of skills.
const PLAIN = [
    'She looks at him for a long moment, then turns away and stares out of the window. The rain has not stopped all day.',
    '"Are you hungry?" he asks. She shakes her head. He sits on the edge of the bed and waits.',
    'He smiles, slow and small, and says nothing. The clock on the wall ticks. Somewhere downstairs a door closes.',
    'It was late when they got home. She took off her coat and he hung it up, and neither of them said much.',
];

let miss = 0;
for (const [text, want] of CASES) {
    const lit = top(text);
    for (const w of want) if (!w.split('/').some(id => lit.includes(id))) { miss++; console.log(`MISS ${w}: ${text.slice(0, 70)}…\n   lit: ${lit.join(', ') || '(none)'}`); }
}
console.log(`\n${CASES.length - miss}/${CASES.length} passages lit the right skill.`);
let noise = 0;
for (const text of PLAIN) { const lit = top(text, 20); noise += lit.length; console.log(`plain (${lit.length}): ${lit.join(', ')}`); }
console.log(`Plain passages lit ${noise} skills in all.`);
for (const id of [...new Set(CASES.flatMap(([, w]) => w.flatMap(x => x.split('/'))))]) if (!SKILL_BY_ID[id]) console.log('unknown skill', id);
if (miss) process.exitCode = 1;

// Busier passages (an argument, a charged scene, a meal): a few skills at most, and the right ones.
const BUSY = [
    ['"Where were you?" he demands, backing her against the wall. "Don\'t lie to me." She lifts her chin and swears she was at her sister\'s.', ['intimidation', 'interrogation', 'lying']],
    ['He pulls her into his lap and kisses her neck, slow, his hand sliding up her stocking. She gasps his name.', ['kissing', 'seduction']],
    ['They eat in silence. He cuts his steak, pours more wine and asks about her day as if nothing happened.', []],
];
for (const [text, want] of BUSY) { const lit = top(text, 20); console.log(`busy (${lit.length}): ${lit.join(', ')}${want.length ? `   wanted any of: ${want.join(', ')}` : ''}`); }

// Levels: someone who is bad at a skill gets it sent as surely as someone good at it, whatever else they have.
const mixed = { skills: { cooking: -6, charm: 10, seduction: 10, leadership: 10, medicine: 10, surgery: 10, biology: 9, etiquette: 10, wit: 10 }, skillPins: {} };
const cookLit = litSkills(mixed, 'She burns the roast and the gravy goes lumpy on the stove while he watches, charmed.', '', 5).map(x => `${x.id} ${x.level}`);
console.log('bad cook in a kitchen scene:', cookLit.join(', '));
if (!cookLit.some(x => x.startsWith('cooking'))) { console.log('MISS: a −6 cook was left out of a cooking scene'); process.exitCode = 1; }
const bioLit = litSkills(mixed, '"Your heart is pumping harder now. Adrenaline. The body floods itself before it knows why," the doctor said, two fingers on her pulse.', '', 5).map(x => `${x.id} ${x.level}`);
console.log('biology talk with a doctor at 10 in medicine:', bioLit.join(', '));
if (!bioLit.some(x => x.startsWith('biology'))) { console.log('MISS: biology left out'); process.exitCode = 1; }
