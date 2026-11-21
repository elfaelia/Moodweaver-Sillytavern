// Ambience: a quiet sound bed under the music, made from the scene's place (rain, a hospital's hum, a diner's
// murmur, wind, a campfire, a car on the road, radio crackle). Spotify can only play one song at a time, so this is
// drawn live in the browser with the Web Audio API: no sound files, nothing downloaded, nothing sent anywhere.
// It plays on the device that has SillyTavern open (which may not be the one Spotify plays on).
// Browsers only allow sound after a tap, so unlock() runs on every tap in the Music tab.

// Which bed each place gets. Weather (rain, storm) is a second layer on top of the place.
export const PLACE_BEDS = {
    hospital_ward: 'monitor', asylum_ward: 'hum', operating_theatre: 'monitor', observation_room: 'hum', sleep_room: 'monitor', facility: 'hum', morgue: 'hum',
    records_room: 'hum', padded_cell: 'hum', corporate_office: 'hum', lecture_hall: 'hum', darkroom: 'hum', interrogation_room: 'hum', glass_cage: 'hum', hydrotherapy_room: 'drip',
    boiler_room: 'machine', basement: 'machine', garage_lab: 'machine', fallout_shelter: 'machine',
    late_night_diner: 'crowd', bar_club: 'crowd', jazz_club: 'crowd', party: 'crowd', fancy_restaurant: 'crowd', shopping_mall: 'crowd', internet_cafe: 'crowd', public: 'crowd', club_bathroom: 'crowd',
    outdoors: 'wind', rooftop_night: 'wind', graveside: 'wind', isolated: 'wind', abandoned: 'wind', snowed_in: 'wind', beach: 'waves', campfire: 'fire',
    in_a_car: 'car', drive_in: 'car', crypt: 'drip', temple: 'drip', hospital_chapel: 'drip', funeral: 'drip',
};
export const BED_LABELS = { rain: 'rain', storm: 'a storm', monitor: 'a ward’s hum and monitor', hum: 'fluorescent hum', machine: 'machinery', crowd: 'a murmuring room', wind: 'wind', waves: 'waves', fire: 'a crackling fire', car: 'the road', drip: 'a cold, dripping room', crickets: 'crickets', crackle: 'radio crackle',
    camera: 'a camera clicking', clock: 'a ticking clock', city: 'street traffic', birds: 'birdsong', train: 'a train', shower: 'running water',
    wet: 'wet, slick sounds', skin: 'skin slapping', breath: 'breathing', heart: 'a heartbeat', vent: 'a facility’s vents and distant doors', buzz: 'electrical buzz', alarm: 'a distant alarm',
    fingers: 'slick fingers', rub: 'skin rubbing', spank: 'spanking', whip: 'a whip or belt', voice: 'her moans and whimpers',
    bed: 'a creaking bed', chair: 'a squeaking office chair', desk: 'a rattling desk', wall: 'thuds against the wall', springs: 'a rocking car', couch: 'a creaking couch', floor: 'creaking floorboards' };
// During sex (1.80): what they're on, from the last 3 messages, else the place. Newest message wins. These beds
// keep a rhythm (setBeds' pace), with small human unevenness and now and then a pause.
export const LOVE_WORDS = [
    ['bed', /\b(?:headboard|bed ?springs|mattress|bed ?frame|bedposts?)\b/i],
    ['chair', /\b(?:office chair|desk chair|swivel chair|swivel(?:s|ing)?|(?:his|her|the|a) chair|in (?:his|her|the) lap at (?:the|his|her) desk)\b/i],
    ['desk', /\b(?:(?:on|over|across|against) (?:the|his|her|a) (?:desk|table|counter|workbench|vanity|dresser|piano)|desk|kitchen table|countertop)\b/i],
    ['springs', /\b(?:back ?seat|front seat|passenger seat|driver'?s seat|in the (?:car|truck|cab|pickup)|steamed[- ]up windows?|the car rocks?)\b/i],
    ['couch', /\b(?:couch|sofa|settee|chaise|loveseat|armchair|daybed)\b/i],
    ['wall', /\b(?:against the (?:wall|door|bookcase|bookshelf|shelf|lockers?|tiles?)|(?:pinned|pressed|shoved|slammed) (?:to|against|into) the (?:wall|door))\b/i],
    ['floor', /\b(?:on the floor(?:boards)?|floorboards|on the rug|on the carpet)\b/i],
    ['bed', /\b(?:bed(?:s|sheets|springs|frame|post|posts)?|mattress|headboard|sheets|four-poster|bunk|cot|on the pillows?)\b/i],
];
export const LOVE_PLACES = { bedroom_place: 'bed', hotel_room: 'bed', cheap_motel: 'bed', dorm_room: 'bed', upscale_apartment: 'bed', sleep_room: 'bed', suburban_home: 'bed', corporate_office: 'chair', at_work: 'chair', in_a_car: 'springs', drive_in: 'springs', parking_lot: 'springs', living_room: 'couch', friends_place: 'couch', kitchen: 'desk', photo_studio: 'couch' };
const LOVE_BEDS = new Set(LOVE_WORDS.map(([k]) => k));
// More layers (1.81): rough sex, breath, a heartbeat in fear, a facility, live wires, an alarm.
// How fast they're moving (1.83): words in the newest messages push the pace up or down on top of the scene's energy.
export const PACE_WORDS = {
    up: /\b(?:fast(?:er)?|quick(?:er|ens?|ening)?|hard(?:er)?|harsh(?:er)?|frantic(?:ally)?|frenzied|desperate(?:ly)?|relentless(?:ly)?|pound(?:s|ing|ed)?|slam(?:s|ming|med)|rut(?:s|ting|ted)?|rough(?:er|ly)?|brutal(?:ly)?|speed(?:s|ing)? up|picks? up (?:the |his |her )?pace|wild(?:ly)?|erratic|faltering rhythm|chasing it)\b/gi,
    down: /\b(?:slow(?:s|ly|er|ing|ed)?|languid(?:ly)?|lazy|lazily|unhurried|gentl(?:e|y|er)|tender(?:ly)?|sweet(?:ly)?|savou?r(?:s|ing|ed)?|leisurely|deep and slow|rocking|grind(?:s|ing)?|stills?|stilled|pauses?|paused|holds? (?:still|there))\b/gi,
};
// -2..+2 from the newest message that says anything about pace (weighted toward the newest).
export function paceNudge(texts = []) {
    for (const t of texts.slice(0, 2)) { const up = (t.match(PACE_WORDS.up) ?? []).length, down = (t.match(PACE_WORDS.down) ?? []).length; if (up || down) return Math.max(-2, Math.min(2, (up - down) * 0.75)); }
    return 0;
}
export const MORE_WORDS = {
    // 1.85: acts with their own layer, from her recordings.
    fingers: /\b(?:finger(?:s|ing|ed)? (?:her|him|them|inside|into|deep|slick|wet)|(?:two|three) fingers|fingers? (?:curl|curling|crook|crooking|pump|pumping|thrust|thrusting|slide|sliding|work|working)\w*|knuckle[- ]deep|fingered)\b/i,
    rub: /\b(?:grind(?:s|ing)?|ground (?:against|into|down)|rub(?:s|bing|bed)? (?:against|over|along|herself|himself)|rock(?:s|ing)? (?:against|into) (?:him|her|them)|dry[- ]hump\w*|straddl\w+|writh\w+)\b/i,
    spank: /\b(?:spank(?:s|ed|ing)?|(?:slap|smack)(?:s|ed|ping)? (?:her|his|their) (?:ass|arse|backside|rear|bottom|thighs?|cheek)|over (?:his|her|their) knee|paddl(?:e|es|ed|ing))\b/i,
    whip: /\b(?:whip(?:s|ped|ping)?|lash(?:es|ed|ing)?|flog(?:s|ged|ging|ger)?|riding crop|(?:the|his|her|a) crop|cane(?:s|d)?|caning|(?:the|his|her|a) belt (?:cracks|bites|comes down|lands|strikes)|belt(?:s|ed|ing)? (?:her|him|them)|strap(?:s|ped)? (?:her|him|them) (?:across|with))\b/i,
    wet: /\b(?:wet(?:ness)?|slick|soaked|dripping|slippery|squelch(?:es|ing)?|messy|lube|spit|saliva)\b/i,
    skin: /\b(?:slap(?:s|ping|ped)? of (?:skin|flesh|hips|thighs)|skin (?:slapping|slaps) (?:against|on)|pound(?:s|ing|ed)|rough(?:er|ly)?|hard(?:er)? and fast(?:er)?|thrust(?:s|ing|ed)? (?:hard|harder|faster|deep))\b/i,
    heart: /\b(?:heart (?:pounding|hammering|racing|thudding|thundering|slamming)|pulse (?:racing|pounding|hammering)|(?:pounding|hammering|racing) heart|heartbeat (?:loud|in (?:his|her|their) ears))\b/i,
    buzz: /\b(?:electri(?:c|city|cal|fied)|live wires?|wires? (?:spark|hiss|crackle)|transformer|electrodes?|shock machine|electroshock|ect|tesla|power (?:hum|surge)|arc(?:s|ing)?)\b/i,
    alarm: /\b(?:alarms?|siren(?:s)?|klaxon|lockdown|alert (?:blares|sounds|wails)|the bell (?:rings|shrills))\b/i,
    vent: /\b(?:facility|compound|lab(?:oratory)?|ventilation|air vents?|corridors?|containment|observation (?:room|window)|test chamber)\b/i,
};
export const VENT_PLACES = new Set(['facility', 'observation_room', 'records_room', 'glass_cage', 'padded_cell', 'boiler_room', 'garage_lab', 'fallout_shelter', 'asylum_ward', 'interrogation_room']);
// One-off sounds for what just happened in the newest reply: played once, a moment apart.
export const SHOT_WORDS = [
    ['zap', /\b(?:zap(?:s|ped|ping)?|electrocut\w*|(?:shock|jolt)(?:s|ed)? (?:him|her|them|through)|taser\w*|cattle prod|volts?|electroshock|current (?:surges|rips|jolts))\b/i],
    ['whip', /\b(?:whip(?:s|ped)? (?:cracks?|lands?|across|down)|crack of (?:a|the) (?:whip|belt)|lash(?:es|ed)? (?:her|him|them|across)|belt (?:cracks|lands|comes down))\b/i],
    ['slap', /\b(?:slap(?:s|ped)? (?:him|her|them|his|her|their|across)|backhand(?:s|ed)?|spank(?:s|ed|ing)?|smack(?:s|ed)? (?:him|her|them|his|her|their))\b/i],
    ['door', /\b(?:door (?:slams?|slammed|bangs?|banged|crashes)|slam(?:s|med)? the door|kick(?:s|ed) the door|door (?:bursts|flies) open)\b/i],
    ['clang', /\b(?:clang(?:s|ed|ing)?|metal (?:door|gate|bars?) (?:slams?|clangs?|shuts?)|cell door|bars rattle|chains? (?:rattle|clink|jangle)\w*)\b/i],
    ['glass', /\b(?:glass (?:shatters|shattered|breaks|smashes)|(?:shatter|smash)(?:s|es|ed|ing)? (?:on|against|across) the (?:floor|wall|tiles)|smash(?:es|ed)? (?:the|a) (?:glass|window|bottle|mirror)|window breaks)\b/i],
    ['shot', /\b(?:gunshots?|gun ?fire|shots? (?:ring|rang) out|fired? (?:the|a|his|her|their) (?:gun|pistol|revolver|rifle)|pull(?:s|ed)? the trigger|the gun (?:goes|went) off)\b/i],
    ['thunder', /\b(?:thunder (?:cracks|crashes|booms|rolls)|crack of thunder|lightning (?:strikes|cracks))\b/i],
    ['flatline', /\b(?:flat ?line[sd]?|monitor (?:screams|flatlines)|no pulse|code blue)\b/i],
    ['defib', /\b(?:defibrillat\w*|paddles (?:to|on|against) (?:his|her|their|the) chest|(?:shouts?|calls?|yells?) ['"“]?clear)\b/i],
    ['drill', /\b(?:(?:the|a) drill (?:whines|whirs|screams|bites|spins|starts)|drill(?:s|ed|ing)? into|bone ?saw|whirr?(?:s|ing)? of (?:a|the) (?:drill|saw)|dentist['’]?s drill)\b/i],
];
// The scene's own words, for when no place fact is set: a bed lasts while recent replies keep it in view. Weather and
// layers (a clock, birds, the camera) sit on top of the place. Only the story's words count, not hidden notes.
export const WEATHER_WORDS = [
    ['storm', /\b(?:thunder\w*|lightning|storm(?:s|ing|y)?|gale)\b/i],
    ['rain', /\b(?:rain(?:s|ing|ed|drops?|water)?|downpour|drizzl\w*|rain-?soaked)\b/i],
];
export const WEATHER_STOP = /\b(?:(?:rain|storm|thunder)\w* (?:has |had )?(?:stopped|stops|eased|eases|passed|passes|let up|lets up|died down|dies down)|stopped raining)\b/i;
export const PLACE_WORDS = [
    ['monitor', /\b(?:heart monitor|monitor(?:s)? beep\w*|iv drip|hospital bed|hospital ward|the ward|infirmary|intensive care)\b/i],
    ['shower', /\b(?:shower(?:s|ing|head)?|bath ?tub|running water|the tap runs|bathwater)\b/i],
    ['train', /\b(?:train(?:s)? (?:car|carriage|station|platform|track)|on the train|subway|railway|rail car|boxcar)\b/i],
    ['car', /\b(?:driv(?:ing|es) (?:down|through|along|home|fast)|passenger seat|driver'?s seat|steering wheel|highway|back ?seat of (?:the|his|her) (?:car|truck)|in the (?:car|truck|pickup))\b/i],
    ['crowd', /\b(?:diner|bar ?stool|the bar\b|pub|nightclub|club|restaurant|caf[eé]|cafeteria|party|crowded room|dance floor|booth)\b/i],
    ['waves', /\b(?:beach|waves?|shore(?:line)?|ocean|seaside|the tide|surf)\b/i],
    ['fire', /\b(?:camp ?fire|fire ?place|bonfire|hearth|crackling fire|the fire crackles)\b/i],
    ['drip', /\b(?:cave|crypt|cellar|sewer|tunnel|catacomb\w*|dripping|drip(?:s)? from the)\b/i],
    ['machine', /\b(?:boiler|generator|machinery|factory floor|engine room|furnace room)\b/i],
    ['hum', /\b(?:fluorescent|cubicle|laboratory|the lab\b|interrogation room|office|dark ?room|bunker|white room)\b/i],
    ['city', /\b(?:street ?lights?|traffic|sidewalk|alley(?:way)?|downtown|crosswalk|city street|the street)\b/i],
    ['wind', /\b(?:wind(?:s|y|swept)?|gusts?|cliff(?:side|top)?|lighthouse|rooftop|blizzard)\b/i],
];
export const LAYER_WORDS = [
    ['camera', /\b(?:dark ?room|camera|shutter|polaroid|flash ?bulb|snaps? (?:a|another|the) (?:photo|picture|shot)|developing (?:the )?(?:photos|prints|film))\b/i],
    ['clock', /\b(?:clock|ticking|grandfather clock|metronome)\b/i],
    ['birds', /\b(?:birds?|birdsong|songbirds?|forest|woods|meadow|orchard)\b/i],
];
const LEVELS = { 1: 0.22, 2: 0.45, 3: 0.8 };

let ac = null, master = null, noise = null;
const layers = new Map(); // name -> { gain, stop() }
let wanted = { beds: [], level: 2 }, strokeRate = 1.2, targetRate = 1.2;

export function unlock() {
    try {
        // iPhone Safari: "ambient" mixes with Spotify playing in its own app instead of pausing it.
        try { if (globalThis.navigator?.audioSession) globalThis.navigator.audioSession.type = 'ambient'; } catch { /* older Safari */ }
        if (!ac) { const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext; if (!AC) return false; ac = new AC(); master = ac.createGain(); master.gain.value = 0;
            // 1.85: a gentle limiter, so seven layers stacked at Loud never crackle.
            const lim = ac.createDynamicsCompressor(); lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2; const trim = ac.createGain(); trim.gain.value = 0.6; master.connect(lim).connect(trim).connect(ac.destination); }
        // Safari parks the sound as "interrupted" after a call or a locked screen; a tap brings it back.
        ['spank', 'whip-1', 'whip-2'].forEach(sample);
        if (ac.state === 'suspended' || ac.state === 'interrupted') void ac.resume().then(apply).catch(() => {});
        else apply();
        return true;
    } catch { return false; }
}
// True when sound is wanted but the browser is still waiting for a tap.
export const needsTap = () => wanted.beds.length > 0 && (!ac || ac.state !== 'running');
export const playing = () => [...layers.keys()];
export const MAX_BEDS = 7;
export const isLoveBed = name => LOVE_BEDS.has(name);

// beds: names from BED_LABELS (at most MAX_BEDS), level 1-3. [] fades everything out. energy (1-5) plus nudge
// (-2..+2, from paceNudge): how fast the bodies and furniture keep time. The pace glides there over a few strokes.
export function setBeds(beds, level = 2, energy = 3, nudge = 0) {
    wanted = { beds: [...new Set(beds)].slice(0, MAX_BEDS), level: LEVELS[level] ? level : 2 };
    const pace = Math.max(0.5, Math.min(6.5, (Number(energy) || 3) + (Number(nudge) || 0)));
    targetRate = 0.38 + 0.34 * pace; // about 0.55 a second at its slowest, 1.4 at an even pace, 2.6 at its wildest
    if (!wanted.beds.some(b => LOVE_BEDS.has(b) || b === 'wet' || b === 'skin')) strokeRate = targetRate;
    if (ac && ac.state === 'running') apply();
}
function apply() {
    if (!ac || ac.state !== 'running') return;
    const now = ac.currentTime;
    master.gain.cancelScheduledValues(now); master.gain.setTargetAtTime(wanted.beds.length ? LEVELS[wanted.level] : 0, now, 0.8);
    for (const [name, layer] of layers) if (!wanted.beds.includes(name)) { layer.gain.gain.setTargetAtTime(0, now, 0.7); setTimeout(() => { layer.stop(); }, 4000); layers.delete(name); }
    for (const name of wanted.beds) if (!layers.has(name)) { const layer = build(name); if (layer) { layer.gain.gain.value = 0; layer.gain.gain.setTargetAtTime(1, now, 1.2); layers.set(name, layer); } }
}

// One-off sounds (1.81): names from SHOT_WORDS, played once each, a moment apart, over whatever is playing.
export function oneShots(names = []) {
    if (!ac || ac.state !== 'running' || !names.length) return;
    const out = gainOf(LEVELS[wanted.level] ?? 0.45); out.connect(ac.destination);
    names.slice(0, 3).forEach((name, i) => { try { SHOTS[name]?.(out, ac.currentTime + 0.3 + i * 1.6); } catch { /* fine */ } });
    setTimeout(() => { try { out.disconnect(); } catch { /* fine */ } }, 9000);
}
const SHOTS = {
    zap(out, at) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(90, at); const lfo = ac.createOscillator(), lg = gainOf(400); lfo.frequency.value = 37; lfo.connect(lg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.18, at + 0.02); g.gain.setValueAtTime(0.18, at + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.75);
        o.connect(filter('highpass', 300)).connect(g).connect(out); o.start(at); lfo.start(at); o.stop(at + 0.8); lfo.stop(at + 0.8);
        for (let i = 0; i < 14; i++) burst(out, at + Math.random() * 0.7, 0.008, 0.25, 2500); },
    slap(out, at) { if (buffers.has('spank')) grain(out, 'spank', at, { vol: 1.1, len: 1.2 }); else { burst(out, at, 0.06, 0.85, 700); burst(out, at + 0.003, 0.03, 0.4, 3000); } },
    whip(out, at) { const n = buffers.has('whip-1') ? 'whip-1' : 'whip-2'; if (buffers.has(n)) grain(out, n, at, { vol: 1.1, len: 1.2 }); else burst(out, at, 0.03, 0.7, 2500); },
    door(out, at) { thud(out, at, 0.7, 60); burst(out, at + 0.01, 0.25, 0.12, 300); },
    clang(out, at) { for (const [f, v] of [[340, 0.12], [512, 0.08], [873, 0.05], [1310, 0.03]]) ping(out, f, at, 1.6, v, f * 0.995, 'triangle'); burst(out, at, 0.05, 0.3, 1500); },
    glass(out, at) { for (let i = 0; i < 26; i++) { const t = at + Math.random() * 0.5; ping(out, 2500 + Math.random() * 4500, t, 0.08 + Math.random() * 0.15, 0.04 + Math.random() * 0.04); } burst(out, at, 0.12, 0.35, 2000); },
    shot(out, at) { burst(out, at, 0.08, 0.7, 200); thud(out, at, 0.9, 50); const s = ac.createBufferSource(), f = filter('lowpass', 500), g = ac.createGain(); s.buffer = noiseBuffer(); g.gain.setValueAtTime(0.25, at + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, at + 2.2); s.connect(f).connect(g).connect(out); s.start(at + 0.05, Math.random() * 2, 2.3); },
    thunder(out, at) { burst(out, at, 0.15, 0.6, 400); const s = ac.createBufferSource(), f = filter('lowpass', 140), g = ac.createGain(); s.buffer = noiseBuffer(); g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(1.8, at + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, at + 4.5); s.connect(f).connect(g).connect(out); s.start(at, Math.random() * 2, 4.6); },
    flatline(out, at) { ping(out, 880, at, 3.5, 0.12, 0, 'sine'); },
    defib(out, at) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(400, at); o.frequency.exponentialRampToValueAtTime(3200, at + 1.4); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.03, at + 0.2); g.gain.setValueAtTime(0.03, at + 1.4); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.5); o.connect(g).connect(out); o.start(at); o.stop(at + 1.55); thud(out, at + 1.6, 0.8, 55); burst(out, at + 1.6, 0.06, 0.3, 1200); },
    drill(out, at) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(380, at); o.frequency.linearRampToValueAtTime(520, at + 0.4); o.frequency.setValueAtTime(520, at + 1.6); o.frequency.linearRampToValueAtTime(300, at + 2);
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.15, at + 0.3); g.gain.setValueAtTime(0.15, at + 1.7); g.gain.exponentialRampToValueAtTime(0.0001, at + 2); o.connect(filter('bandpass', 1400, 1.5)).connect(g).connect(out); o.start(at); o.stop(at + 2.05); },
};
// ---- Building blocks ----
function noiseBuffer() {
    if (noise) return noise;
    const len = ac.sampleRate * 3; noise = ac.createBuffer(1, len, ac.sampleRate);
    const d = noise.getChannelData(0); let b = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b = 0.97 * b + 0.03 * w; d[i] = w * 0.5 + b * 2.5; } // a little pinker than white
    return noise;
}
const src = () => { const s = ac.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true; s.loopStart = Math.random(); s.start(0, Math.random() * 2); return s; };
const filter = (type, freq, q = 0.7) => { const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };
const gainOf = v => { const g = ac.createGain(); g.gain.value = v; return g; };
const osc = (type, freq) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = freq; o.start(); return o; };
const chain = (...nodes) => { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes.at(-1); };
// A slow wobble on an AudioParam: centre ± depth at rate Hz.
function wobble(param, centre, depth, rate) { const o = osc('sine', rate), g = gainOf(depth); param.value = centre; o.connect(g).connect(param); return o; }
// Something that happens now and then (a drip, a beep, a clink): fn(time) every min..max seconds.
function every(min, max, fn) {
    let t = 0, alive = true;
    const tick = () => { if (!alive || !ac) return; try { fn(ac.currentTime + 0.05); } catch { /* closed */ } t = setTimeout(tick, (min + Math.random() * (max - min)) * 1000); };
    t = setTimeout(tick, Math.random() * max * 1000);
    return () => { alive = false; clearTimeout(t); };
}
function ping(out, freq, at, len, vol, toFreq = 0, type = 'sine') {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(freq, at); if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, at + len);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(out); o.start(at); o.stop(at + len + 0.05);
}
function burst(out, at, len, vol, hp = 2000) {
    const s = ac.createBufferSource(), g = ac.createGain(), f = filter('highpass', hp); s.buffer = noiseBuffer();
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    s.connect(f).connect(g).connect(out); s.start(at, Math.random() * 2, len + 0.05);
}

// A dull knock: something solid meeting a wall or a desk.
function thud(out, at, vol, hz = 95) {
    ping(out, hz, at, 0.16, vol, hz * 0.55);
    const s = ac.createBufferSource(), f = filter('lowpass', 420), g = ac.createGain(); s.buffer = noiseBuffer();
    g.gain.setValueAtTime(vol * 0.8, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09); s.connect(f).connect(g).connect(out); s.start(at, Math.random() * 2, 0.12);
}
// Keeps time: fn(at, i) on each stroke at strokeRate a second, a little uneven, with a pause now and then.
function strokes(fn) {
    let alive = true, t = 0, i = 0, pauseAt = Date.now() + 15000 + Math.random() * 30000;
    const born = Date.now(), wave = 18000 + Math.random() * 20000;
    const tick = () => {
        if (!alive || !ac) return;
        // Glide toward the scene's pace (1.83): a new pace takes about six strokes to settle, like speeding up for real.
        strokeRate += (targetRate - strokeRate) * 0.28;
        // A slow build and ease (±12% over 18-38 s) and a slight push-pull between strokes, like people, not a metronome.
        const drift = 1 + 0.12 * Math.sin((Date.now() - born) / wave * 2 * Math.PI);
        let wait = 1 / (strokeRate * drift) * (i % 2 ? 1.06 : 0.94);
        if (Date.now() > pauseAt) { pauseAt = Date.now() + 20000 + Math.random() * 40000; wait = 2 + Math.random() * 4; }
        else { try { fn(ac.currentTime + 0.03, i++); } catch { /* closed */ } wait *= 0.88 + Math.random() * 0.24; }
        t = setTimeout(tick, wait * 1000);
    };
    t = setTimeout(tick, 400);
    return () => { alive = false; clearTimeout(t); };
}
const fast = () => strokeRate >= 1.5;

// ---- Recorded sounds (1.83) ----
// Real recordings in sounds/ (made with ElevenLabs), cut into single strokes: [start s, end s, gain to even them out].
// Each stroke plays one cut picked at random (never the same one twice running), a touch faster or slower and
// louder or softer each time, so it never sounds like a loop. Loaded the first time a bed needs them.
export const GRAINS = {
    'bed-creak': [[1.247,1.686,1.56],[1.686,2.255,1.52],[2.255,2.659,1.37],[2.659,2.843,1.3],[2.843,3.322,1.08],[3.322,3.522,1.08],[3.522,3.876,0.95],[3.876,4.45,0.71],[4.45,4.974,0.97],[4.974,5.627,1.01],[5.627,6.086,1.01],[6.086,6.62,1.09],[6.62,6.829,0.75],[6.829,7.169,0.8],[7.169,7.413,0.56],[7.413,7.687,1.17],[7.687,7.887,0.73],[7.887,8.75,1.0],[8.75,8.94,0.75],[8.94,9.274,0.82],[9.274,9.543,0.62],[9.543,9.758,1.49],[9.758,9.947,0.84],[9.947,10.386,0.97],[10.386,10.586,0.51],[10.586,10.805,1.11],[10.805,11.025,0.86],[11.025,11.314,0.85],[11.314,11.559,1.01],[11.559,11.788,1.67],[11.788,12.069,2.5]],
    'bed-frame': [[0.733,1.327,2.3],[1.327,1.886,1.24],[1.886,2.484,1.0],[2.484,3.093,1.92],[3.093,3.657,1.24],[3.657,4.235,0.74],[4.235,4.814,1.35],[4.814,5.393,0.98],[5.393,5.976,1.1],[5.976,6.56,1.53],[6.56,7.199,0.92],[7.199,7.877,0.94],[7.877,8.54,1.0],[8.54,9.129,0.82],[9.129,9.793,0.81],[9.793,10.426,1.28],[10.426,11.045,0.9],[11.045,11.688,2.09],[11.688,12.282,0.96],[12.282,12.911,0.68],[12.911,13.559,1.07],[13.559,14.262,0.96],[14.262,15.0,1.31]],
    'bed-thump': [[0.519,1.013,2.5],[1.013,1.571,2.32],[1.571,2.13,0.79],[2.13,2.694,1.27],[2.694,3.287,1.17],[3.287,3.866,1.11],[3.866,4.45,1.09],[4.45,5.023,0.95],[5.023,5.577,0.94],[5.577,6.166,1.04],[6.166,6.755,0.96],[6.755,7.323,0.81],[7.323,7.892,0.99],[7.892,8.471,0.9],[8.471,9.034,1.03],[9.034,9.603,0.94],[9.603,10.167,1.06],[10.167,10.736,0.89],[10.736,11.304,1.21],[11.304,11.878,0.88],[11.878,12.462,0.94],[12.462,13.03,1.29],[13.03,13.624,0.7],[13.624,14.824,1.01]],
    'wet-1': [[0.239,0.579,1.78],[0.579,0.883,2.0],[0.883,1.377,1.6],[1.377,1.911,0.64],[1.911,2.484,0.94],[2.484,2.828,0.8],[2.828,3.218,1.0],[3.218,3.667,0.94],[3.667,4.041,0.67],[4.041,4.285,2.0],[4.285,4.634,0.73],[4.634,4.869,2.29],[4.869,5.238,0.73],[5.238,5.458,2.29],[5.458,5.707,0.94],[5.707,6.056,1.33],[6.056,6.46,0.4],[6.46,6.73,1.45],[6.73,7.164,1.0],[7.164,7.468,2.29],[7.468,8.0,1.0]],
    'wet-2': [[0.544,0.733,0.7],[0.733,1.147,0.47],[1.147,1.352,0.76],[1.352,1.631,0.73],[1.631,2.24,1.33],[2.24,2.559,1.0],[2.559,2.858,2.0],[2.858,3.522,1.07],[3.522,4.006,1.0],[4.006,4.285,1.0],[4.285,4.834,1.14],[4.834,5.193,0.55],[5.193,5.492,1.6],[5.492,6.176,0.76],[6.176,6.859,0.67],[6.859,7.298,0.73],[7.298,7.483,1.33],[7.483,7.852,0.62],[7.852,8.141,1.78],[8.141,8.506,0.64],[8.506,8.85,1.14],[8.85,9.568,0.7],[9.568,10.027,0.59],[10.027,10.267,1.23],[10.267,10.676,0.4],[10.676,10.88,1.14],[10.88,11.314,0.73],[11.314,11.549,1.23],[11.549,12.222,1.07],[12.222,12.581,0.73],[12.581,12.906,2.0],[12.906,13.384,0.94],[13.384,13.589,1.78],[13.589,14.789,1.23]],
    // 1.85: her second batch (headboard, bouncing, sofa, desk, truck, body on a wall, slaps, fingers, spanking, whips,
    // skin rubbing, moans and whimpers).
    'bed-headboard': [[0.863,1.492,0.95],[1.492,2.095,0.83],[2.095,2.594,0.87],[2.594,3.223,1.06],[3.223,3.407,0.71],[3.407,3.731,1.85],[3.731,3.866,1.22],[3.866,4.34,2.5],[4.34,4.51,0.8],[4.51,4.824,1.26],[4.824,5.537,0.84],[5.537,5.672,0.8],[5.672,5.961,1.55],[5.961,6.101,0.7],[6.101,6.745,1.96],[6.745,7.745,1.42]],
    'bed-bounce': [[0.015,0.175,1.86],[0.175,0.319,0.4],[0.319,0.459,0.78],[0.459,0.718,1.23],[0.718,0.928,0.4],[0.928,1.107,0.96],[1.107,1.247,2.43],[1.247,1.382,1.73],[1.382,2.04,0.57],[2.04,2.654,0.75],[2.654,3.277,0.98],[3.277,3.532,1.0],[3.532,4.046,1.48],[4.046,4.18,0.97],[4.18,4.355,1.41],[4.355,4.709,1.87],[4.709,4.939,1.07],[4.939,5.233,1.88],[5.233,5.522,2.33],[5.522,5.717,1.0],[5.717,6.39,1.64],[6.39,6.54,0.83],[6.54,6.804,1.5],[7.134,7.323,0.57],[7.323,7.687,1.65],[7.687,7.847,1.92],[7.847,8.161,0.74],[8.161,8.57,2.46],[8.57,9.334,0.94],[9.334,10.182,1.66],[10.182,10.741,1.27],[11.005,11.818,1.09],[11.818,12.053,0.48],[12.053,12.601,1.53],[12.601,12.756,0.4],[12.756,13.045,0.8],[13.045,13.33,2.18],[13.33,13.479,0.4],[13.479,13.799,0.4],[13.799,13.953,1.47],[13.953,14.088,0.4],[14.088,14.277,0.42],[14.277,14.497,1.08],[14.497,14.642,0.4],[14.642,14.776,0.4],[14.776,14.916,0.85],[14.916,15.056,1.31],[15.056,15.255,0.4],[15.255,15.395,0.76]],
    'couch-1': [[0.08,0.399,1.92],[0.399,0.629,1.59],[0.629,0.808,1.29],[0.808,0.963,1.18],[0.963,1.147,1.41],[1.147,1.412,0.77],[1.412,2.16,1.02],[2.16,2.614,1.0],[2.614,3.098,1.51],[3.098,4.096,1.02],[4.096,4.23,0.89],[4.23,4.505,0.85],[4.505,5.133,1.52],[5.133,5.278,1.08],[5.278,5.567,0.79],[5.567,6.341,0.9],[6.341,6.475,0.89],[6.475,6.67,0.94],[6.67,6.974,0.79],[6.974,7.129,1.87],[7.129,7.273,1.0],[7.273,7.692,0.97],[7.692,7.832,1.26],[7.832,7.972,0.77],[7.972,8.146,0.64],[8.146,8.356,1.8],[8.356,8.506,0.9],[8.506,8.665,0.74],[8.665,9.084,0.65],[9.084,9.219,1.11],[9.219,9.384,0.64],[9.384,9.528,1.33],[9.528,9.703,1.13],[9.703,9.843,0.92],[9.843,10.042,1.01],[10.042,10.481,0.75],[10.481,10.875,1.04],[10.875,11.185,0.83],[11.185,11.319,0.52],[11.319,11.584,1.16],[11.584,11.863,2.07],[11.863,12.087,0.89],[12.087,12.247,0.72],[12.247,12.427,0.85],[12.427,12.691,1.43],[12.691,12.861,0.65],[12.861,13.03,1.24],[13.03,13.235,1.15],[13.235,13.48,1.09]],
    'couch-2': [[0,0.479,1.42],[0.479,0.688,0.95],[0.688,1.267,1.18],[1.267,1.432,1.32],[1.432,1.646,1.36],[1.646,2.01,2.03],[2.01,2.205,0.91],[2.205,3.083,0.65],[3.083,3.258,0.56],[3.258,4.255,0.74],[4.255,4.425,0.89],[4.425,5.108,1.55],[5.108,5.278,0.81],[5.278,5.448,0.85],[5.448,5.682,1.48],[5.682,5.872,1.92],[5.872,6.006,1.35],[6.006,6.156,0.75],[6.156,6.291,0.55],[6.291,6.475,1.2],[6.475,6.67,1.61],[6.67,6.844,0.87],[6.844,7.039,0.64],[7.039,7.398,1.04],[7.398,7.568,1.49],[7.568,7.747,0.9],[7.747,8.421,0.89],[8.421,8.605,1.09],[8.605,9.204,1.07],[9.204,9.424,0.96],[9.424,9.882,1.0],[9.882,10.032,0.94],[10.032,10.192,0.76],[10.192,10.521,0.83],[10.521,10.661,0.83],[10.661,10.885,0.88],[10.885,11.234,1.21],[11.234,11.454,0.98],[11.454,11.938,1.1],[11.938,12.072,1.1],[12.072,12.561,1.0],[12.561,13.22,1.2],[13.22,13.429,1.25]],
    'desk-rock': [[0.08,0.359,1.63],[0.359,0.693,0.54],[0.693,1.157,0.84],[1.157,1.566,0.83],[1.566,1.901,1.06],[1.901,2.075,2.5],[2.075,2.305,1.36],[2.305,2.829,0.8],[2.829,3.502,1.4],[3.502,3.846,1.57],[3.846,4.21,1.06],[4.21,4.575,1.56],[4.575,4.919,1.17],[4.919,5.293,0.62],[5.293,5.637,0.9],[5.637,6.001,0.98],[6.001,6.256,0.77],[6.256,6.435,0.78],[6.435,6.59,1.1],[6.59,6.755,0.89],[6.755,6.909,0.51],[6.909,7.104,1.16],[7.104,7.273,1.06],[7.273,7.453,1.71],[7.453,7.792,0.98],[7.792,8.201,1.14],[8.201,8.521,1.0],[8.521,8.97,1.1],[8.97,9.359,0.84],[9.359,9.848,0.53],[9.848,10.0,0.49]],
    'car-1': [[0.394,1.162,1.96],[1.162,1.636,2.5],[1.636,2.724,2.5],[2.724,2.893,0.84],[2.893,3.053,2.42],[3.053,3.203,0.77],[3.203,3.342,0.95],[3.342,3.542,2.25],[3.542,3.721,0.56],[3.721,3.946,1.05],[3.946,4.146,2.06],[4.146,4.485,0.66],[4.485,4.989,0.73],[4.989,5.592,0.42],[5.592,5.88,1.0]],
    'car-2': [[0.01,0.16,0.78],[0.16,0.464,0.95],[0.464,0.609,0.96],[0.609,0.943,0.83],[0.943,1.097,0.89],[1.097,1.417,0.94],[1.417,1.581,1.0],[1.581,1.916,1.14],[1.916,2.08,1.1],[2.08,2.444,1.17],[2.444,2.609,1.07],[2.609,2.973,0.91],[2.973,3.128,0.71],[3.128,3.567,1.0],[3.567,3.707,1.49],[3.707,4.111,1.22],[4.111,4.53,1.55],[4.53,4.944,1.3],[4.944,5.093,1.19],[5.093,5.403,1.29],[5.403,5.577,0.99],[5.577,5.88,0.92]],
    'wall-1': [[0.025,0.369,0.64],[0.369,0.663,1.49],[0.663,1.292,1.43],[1.292,2.519,1.56],[2.519,3.083,1.62],[3.083,3.711,0.89],[3.711,4.046,0.99],[4.046,4.325,1.0],[4.325,4.664,0.57],[4.664,4.954,0.77],[4.954,5.293,0.96],[5.293,5.567,0.91],[5.567,5.902,0.65],[5.902,6.201,1.04],[6.201,6.819,1.1],[6.819,7.154,1.31],[7.154,7.478,2.5],[7.478,7.827,0.82],[7.827,8.261,2.5],[8.261,8.89,0.53],[8.89,9.259,1.08],[9.259,10.172,0.45],[10.172,10.48,2.23]],
    'wall-2': [[0.18,0.793,1.21],[1.077,1.217,1.32],[2.04,2.26,0.53],[2.988,3.622,0.68],[3.981,4.624,0.4],[4.929,5.343,1.0],[5.892,6.75,0.67],[6.75,6.969,1.44],[7.408,7.687,2.5],[7.687,7.837,0.4],[7.837,8.36,2.5]],
    'wall-3': [[0.609,1.516,1.66],[1.516,2.095,1.08],[2.24,2.404,0.74],[3.033,3.228,0.54],[3.841,4.5,0.55],[4.634,5.428,1.36],[5.428,5.622,1.29],[6.231,7.079,0.98],[7.079,8.012,0.5],[8.012,8.36,1.02]],
    'slap-1': [[0.209,0.524,1.91],[0.524,0.848,1.69],[0.848,1.187,1.7],[1.187,1.507,2.12],[4.949,5.273,1.79],[5.273,5.612,1.42],[5.612,5.956,1.4],[5.956,6.306,0.7],[6.306,6.65,0.58],[6.65,6.989,0.58],[6.989,7.338,0.4],[7.338,7.692,0.49],[7.692,8.037,0.59],[8.037,8.381,0.4],[8.381,8.73,0.4],[8.73,9.064,0.4],[9.064,9.399,0.72],[9.399,9.743,0.4],[9.743,10.087,0.63],[10.087,10.436,0.46],[10.436,10.78,0.4],[10.78,11.13,0.41],[11.13,11.479,0.41],[11.479,11.768,0.74],[11.768,12.063,1.38],[12.063,12.352,2.5],[12.352,12.601,1.0],[12.601,12.965,1.05],[12.965,13.28,0.98],[13.28,13.579,1.0],[13.579,13.878,2.26],[13.878,14.173,1.63],[14.173,14.462,2.04],[14.462,14.766,1.38],[14.766,15.066,2.5],[15.066,15.37,1.14],[15.37,15.48,1.29]],
    'slap-2': [[0.294,0.549,1.83],[0.983,1.307,2.5],[1.511,1.901,1.35],[1.901,2.11,1.18],[2.26,2.429,0.95],[2.789,3.332,0.44],[3.332,3.472,0.64],[3.801,4.285,2.5],[4.285,4.754,2.07],[4.754,4.914,0.4],[5.283,5.512,0.4],[6.725,6.869,0.61],[7.413,7.822,0.8],[8.022,8.536,0.53],[8.93,9.094,0.4],[9.987,10.341,1.05],[11.384,11.833,2.5],[12.033,12.302,1.1],[12.731,13.03,2.5],[13.19,13.48,0.62]],
    'fingers-1': [[0.07,0.309,2.5],[0.309,1.432,1.0],[1.432,1.931,0.4],[1.931,2.968,2.5],[2.968,3.622,0.74],[3.622,4.679,0.71],[4.679,4.834,1.21],[4.834,5.448,0.5],[5.448,5.657,1.72],[5.657,5.802,0.74],[5.802,6.316,0.69],[6.316,6.45,2.31],[6.45,6.665,2.05],[6.665,7.084,0.75],[7.084,7.278,2.5],[7.278,7.578,1.52],[7.578,8.476,0.7],[8.476,9.114,0.84],[9.114,9.299,1.7],[9.299,9.493,1.2],[9.493,10.092,2.18],[10.092,10.242,0.69],[10.242,11.055,0.52],[11.055,11.439,0.44],[11.439,11.833,2.34],[11.833,12.013,0.49],[12.013,12.147,0.77],[12.147,12.302,0.61],[12.302,13.12,1.48],[13.12,13.474,1.32],[13.474,14.474,1.55]],
    'fingers-2': [[0.249,0.993,2.07],[0.993,1.402,2.25],[1.402,1.741,1.0],[1.741,2.175,1.17],[2.175,2.589,1.58],[2.589,2.978,1.55],[2.978,3.372,0.85],[3.372,3.726,1.8],[3.726,4.126,1.34],[4.126,4.425,1.15],[4.425,4.804,0.6],[4.804,5.173,0.46],[5.173,5.557,1.19],[5.557,5.897,0.59],[5.897,6.106,1.35],[6.261,6.645,0.42],[6.645,7.029,0.4],[7.029,7.423,0.9],[7.423,7.802,0.4],[7.802,8.022,0.46],[8.196,8.55,0.92],[8.55,8.935,0.58],[8.935,9.309,0.48],[9.309,9.503,1.0],[9.503,9.703,2.5],[9.703,10.027,0.4],[10.027,10.401,1.07],[10.401,10.75,0.64],[10.75,11.434,0.4],[11.434,11.663,0.4],[11.663,11.878,1.94],[11.878,12.267,0.4],[12.267,12.666,0.97],[12.666,13.1,0.4],[13.1,13.404,2.18],[13.404,13.804,1.13],[13.804,14.203,2.0],[14.203,14.577,1.0],[14.577,14.956,2.23],[14.956,15.34,1.97],[15.34,15.48,2.0]],
    'spank': [[1.836,3.236,2.08],[4.32,5.72,0.55],[6.36,7.76,0.8],[8.161,8.925,1.34]],
    'whip-1': [[0.773,1.008,1.04],[1.696,1.851,1.86],[1.851,2.749,0.89],[3.168,4.345,0.82],[4.345,4.674,0.96],[5.463,5.707,1.52]],
    'whip-2': [[1.237,2.105,2.15],[2.105,2.769,0.87],[3.532,4.051,0.74],[4.535,5.702,1.85],[5.702,5.88,1.0]],
    'rub': [[0.2,2.4,1.13],[1.1,3.3,1.04],[2.0,4.2,0.96],[2.9,5.1,0.9],[3.8,6.0,0.86],[4.7,6.9,0.92],[5.6,7.8,1.1],[6.5,8.36,1.16]],
    'moan': [[0,0.34,0.4],[0.254,0.619,2.41],[0.693,1.462,0.4],[1.382,1.946,1.06],[1.886,2.44,0.41],[2.444,3.033,1.52],[3.058,3.692,0.4],[3.672,3.991,2.5],[4.041,4.58,0.41],[4.584,5.049,1.68],[5.068,5.578,0.48],[5.527,5.887,2.14],[5.872,6.421,0.48],[6.4,7.084,1.44],[7.149,7.773,0.4],[7.722,8.137,1.67],[8.226,8.87,0.4],[8.88,9.374,1.11],[9.658,10.267,0.4],[10.217,10.521,2.33],[10.631,11.085,0.4],[11.12,11.439,1.72],[11.309,11.684,2.5],[12.003,12.477,1.0],[12.985,13.395,0.71]],
    'whimper': [[0.085,0.873,0.65],[0.983,1.427,2.5],[1.826,2.554,1.16],[3.098,3.822,2.01],[4.525,5.298,0.51],[5.482,6.052,1.89],[6.48,7.219,0.61],[7.373,7.942,1.03],[8.381,9.309,0.4],[9.453,10.097,1.39],[10.541,11.374,0.44],[11.329,11.868,0.97],[12.062,12.821,0.42],[12.866,13.355,1.35]],
};

const buffers = new Map(), loading = new Map(), lastGrain = {};
function sample(name) {
    if (buffers.has(name) || !ac) return buffers.get(name);
    if (!loading.has(name)) loading.set(name, fetch(new URL(`../sounds/${name}.mp3`, import.meta.url)).then(r => r.arrayBuffer())
        .then(b => new Promise((ok, no) => ac.decodeAudioData(b, ok, no))).then(buf => { buffers.set(name, buf); return buf; }).catch(() => null));
    return undefined;
}
export const SAMPLE_NAMES = Object.keys(GRAINS);
// One stroke of a recording at time at. rate: playback speed (higher is squeakier and shorter); vol: loudness;
// len: the longest it may ring (cut with a short fade, so quick strokes don't smear together); lp/hp: muffle or thin it.
function grain(out, name, at, { rate = 1, vol = 1, len = 0.9, lp = 0, hp = 0, jitter = 0.05 } = {}) {
    const buf = sample(name), list = GRAINS[name]; if (!buf || !list?.length) return;
    let k = Math.floor(Math.random() * list.length); if (k === lastGrain[name] && list.length > 1) k = (k + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length; lastGrain[name] = k;
    const [from, to, even] = list[k], r = rate * (1 - jitter + Math.random() * jitter * 2), dur = Math.min((to - from) / r, len);
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; src.playbackRate.value = r;
    const v = vol * even * (0.8 + Math.random() * 0.35); let node = src;
    if (lp) node = node.connect(filter('lowpass', lp)); if (hp) node = node.connect(filter('highpass', hp));
    g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(v, at + 0.006); g.gain.setValueAtTime(v, at + Math.max(0.01, dur - 0.05)); g.gain.linearRampToValueAtTime(0.0001, at + dur);
    node.connect(g).connect(out); src.start(at, from, dur * r + 0.02); src.stop(at + dur + 0.05);
}
const one = (...names) => names[Math.floor(Math.random() * names.length)];
// Now and then, not every stroke: fn(at) after a wait of min-max seconds, shortened as the pace rises.
function hits(min, max, fn) {
    let alive = true, t = 0;
    const tick = () => { if (!alive || !ac) return; try { fn(ac.currentTime + 0.03); } catch { /* closed */ } t = setTimeout(tick, (min + Math.random() * (max - min)) / Math.max(0.6, strokeRate / 1.3) * 1000); };
    t = setTimeout(tick, 600 + Math.random() * 1500);
    return () => { alive = false; clearTimeout(t); };
}
const wetOne = (out, at, o = {}) => grain(out, Math.random() < 0.5 ? 'wet-1' : 'wet-2', at, o);

// ---- The beds ----
function build(name) {
    const out = gainOf(0); out.connect(master);
    const stops = [], nodes = [];
    const keep = (...n) => { nodes.push(...n); return n[0]; };
    const B = {
        rain() { chain(keep(src()), filter('highpass', 500), filter('lowpass', 7000), gainOf(0.22), out); stops.push(every(0.05, 0.4, at => burst(out, at, 0.03, 0.05, 3500))); },
        storm() { chain(keep(src()), filter('highpass', 300), filter('lowpass', 5000), gainOf(0.3), out);
            const rumble = gainOf(0); chain(keep(src()), filter('lowpass', 90), rumble, out);
            stops.push(every(14, 35, at => { rumble.gain.setValueAtTime(0, at); rumble.gain.linearRampToValueAtTime(1.6, at + 0.6); rumble.gain.exponentialRampToValueAtTime(0.01, at + 6); })); },
        hum() { for (const [f, v] of [[60, 0.06], [120, 0.035], [180, 0.012]]) chain(keep(osc('sine', f)), gainOf(v), out); chain(keep(osc('sawtooth', 120)), filter('bandpass', 2600, 6), gainOf(0.006), out); chain(keep(src()), filter('lowpass', 400), gainOf(0.05), out); },
        monitor() { B.hum(); let t = 0, alive = true; const beep = () => { if (!alive || !ac) return; try { ping(out, 880, ac.currentTime + 0.05, 0.12, 0.035); } catch { /* closed */ } t = setTimeout(beep, 1000 / (0.7 + strokeRate * 0.45)); }; t = setTimeout(beep, 500); stops.push(() => { alive = false; clearTimeout(t); }); },
        machine() { chain(keep(src()), filter('lowpass', 180), gainOf(0.5), out); const g = gainOf(0.09); chain(keep(osc('sine', 46)), g, out); keep(wobble(g.gain, 0.09, 0.04, 0.3)); stops.push(every(4, 11, at => burst(out, at, 0.08, 0.04, 800))); },
        crowd() { for (const f of [320, 650, 1100]) { const g = gainOf(0.1); chain(keep(src()), filter('bandpass', f, 1.2), g, out); keep(wobble(g.gain, 0.08, 0.06, 0.2 + Math.random() * 0.5)); }
            stops.push(every(2.5, 7, at => ping(out, 2600 + Math.random() * 1600, at, 0.25, 0.012))); },
        wind() { const f = filter('bandpass', 450, 0.6), g = gainOf(0.35); chain(keep(src()), f, g, out); keep(wobble(f.frequency, 450, 220, 0.05)); keep(wobble(g.gain, 0.3, 0.18, 0.08)); },
        waves() { const g = gainOf(0.3); chain(keep(src()), filter('lowpass', 900), g, out); keep(wobble(g.gain, 0.3, 0.26, 0.11)); },
        fire() { chain(keep(src()), filter('lowpass', 320), gainOf(0.25), out); stops.push(every(0.04, 0.35, at => burst(out, at, 0.015 + Math.random() * 0.03, 0.08 + Math.random() * 0.1, 1800))); },
        car() { chain(keep(src()), filter('lowpass', 170), gainOf(0.55), out); chain(keep(osc('sine', 38)), gainOf(0.07), out); chain(keep(src()), filter('highpass', 3000), gainOf(0.025), out); },
        drip() { chain(keep(src()), filter('lowpass', 260), gainOf(0.12), out); stops.push(every(1.5, 5, at => ping(out, 1300 + Math.random() * 500, at, 0.08, 0.05, 520))); },
        crickets() { const g = gainOf(0); chain(keep(osc('square', 4600)), filter('bandpass', 4600, 8), g, out); stops.push(every(0.6, 1.4, at => { for (let i = 0; i < 3; i++) { g.gain.setValueAtTime(0.02, at + i * 0.06); g.gain.setValueAtTime(0, at + i * 0.06 + 0.035); } })); },
        // A camera in a quiet room: a soft shutter (two curtains, a low thunk), long pauses, and now and then the film
        // being wound on.
        camera() { chain(keep(src()), filter('lowpass', 300), gainOf(0.03), out);
            stops.push(every(3.5, 10, at => { burst(out, at, 0.012, 0.22, 2600); burst(out, at + 0.055, 0.018, 0.12, 1800); ping(out, 170, at, 0.06, 0.05);
                if (Math.random() < 0.35) for (let i = 0; i < 6; i++) burst(out, at + 0.7 + i * 0.045, 0.008, 0.05, 3200); })); },
        clock() { let tock = false; stops.push(every(1, 1, at => { tock = !tock; burst(out, at, 0.012, tock ? 0.09 : 0.12, tock ? 1600 : 2600); })); },
        city() { const g = gainOf(0.32); chain(keep(src()), filter('lowpass', 320), g, out); keep(wobble(g.gain, 0.3, 0.08, 0.07));
            stops.push(every(6, 15, at => { const s = ac.createBufferSource(), f = filter('bandpass', 500, 0.8), v = ac.createGain(); s.buffer = noiseBuffer();
                v.gain.setValueAtTime(0.0001, at); v.gain.exponentialRampToValueAtTime(0.35, at + 1.6); v.gain.exponentialRampToValueAtTime(0.0001, at + 3.6);
                f.frequency.setValueAtTime(380, at); f.frequency.linearRampToValueAtTime(700, at + 1.6); f.frequency.linearRampToValueAtTime(320, at + 3.6);
                s.connect(f).connect(v).connect(out); s.start(at, Math.random() * 2, 3.8); }));
            stops.push(every(35, 80, at => { ping(out, 415, at, 0.35, 0.012, 0, 'sawtooth'); ping(out, 415, at + 0.45, 0.25, 0.01, 0, 'sawtooth'); })); },
        birds() { chain(keep(src()), filter('bandpass', 500, 0.5), gainOf(0.05), out);
            stops.push(every(1.2, 5, at => { const n = 1 + Math.floor(Math.random() * 3), f = 2800 + Math.random() * 1800; for (let i = 0; i < n; i++) ping(out, f, at + i * 0.11, 0.07, 0.016, f * 1.35); })); },
        train() { chain(keep(src()), filter('lowpass', 220), gainOf(0.45), out); chain(keep(osc('sine', 52)), gainOf(0.05), out);
            stops.push(every(1.15, 1.15, at => { burst(out, at, 0.04, 0.1, 500); burst(out, at + 0.17, 0.04, 0.08, 500); })); },
        shower() { const g = gainOf(0.2); chain(keep(src()), filter('highpass', 1200), filter('lowpass', 9000), g, out); keep(wobble(g.gain, 0.2, 0.02, 0.3)); },
        // Sex (1.83, recorded): each stroke picks fresh cuts from the bed recordings, shaped for what they're on. A
        // quicker scene plays them faster and adds the harder hits (the frame, the headboard, the desk).
        bed() { ['bed-thump', 'bed-creak', 'bed-frame', 'bed-bounce', 'bed-headboard'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-thump', at, { vol: fast() ? 0.7 : 0.5, len: gap * 1.05 });
            if (Math.random() < 0.7) grain(out, 'bed-bounce', at + 0.01, { vol: 0.5, len: gap });
            if (Math.random() < 0.75) grain(out, 'bed-creak', at + 0.02 + Math.random() * 0.05, { vol: 0.7, len: gap * 1.2 });
            if (fast() ? Math.random() < 0.6 : i % 4 === 0) grain(out, 'bed-headboard', at + 0.04, { vol: fast() ? 0.6 : 0.4, len: gap });
            else if (i % 3 === 0) grain(out, 'bed-frame', at + 0.03, { vol: 0.55, len: gap }); })); },
        chair() { ['bed-creak', 'bed-frame'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-creak', at, { rate: 1.55, vol: 1.05, len: gap * 0.9, hp: 500, jitter: 0.08 });
            if (i % 2 === 0) grain(out, 'bed-frame', at + 0.02, { rate: 1.7, vol: 0.3, len: 0.25, hp: 300 }); })); },
        // 1.85: the desk, sofa, car and wall now play her own recordings of each.
        desk() { ['desk-rock', 'bed-frame'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'desk-rock', at, { vol: fast() ? 0.9 : 0.7, len: gap * 1.1 });
            if (fast() && i % 2 === 0) grain(out, 'bed-frame', at + 0.02, { rate: 1.3, vol: 0.3, len: 0.3, hp: 200 });
            if (fast() && i % 3 === 0) for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) burst(out, at + 0.02 + k * 0.03 + Math.random() * 0.02, 0.01, 0.04, 3200); })); },
        wall() { ['wall-1', 'wall-2', 'wall-3'].forEach(sample); stops.push(strokes(at => {
            grain(out, one('wall-1', 'wall-2', 'wall-3'), at, { vol: fast() ? 0.85 : 0.65, len: 1 / strokeRate }); })); },
        springs() { ['car-1', 'car-2'].forEach(sample); stops.push(strokes(at => {
            grain(out, one('car-1', 'car-2'), at, { vol: 0.75, len: 1.1 / strokeRate }); })); },
        couch() { ['couch-1', 'couch-2', 'bed-thump'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, one('couch-1', 'couch-2'), at, { vol: 0.75, len: gap });
            if (i % 2 === 0) grain(out, 'bed-thump', at + 0.02, { rate: 0.75, vol: 0.3, len: gap, lp: 500 }); })); },
        floor() { ['bed-creak', 'bed-frame'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-creak', at, { rate: 0.72, vol: 0.75, len: gap * 1.2, lp: 1800 });
            if (i % 2 === 0) grain(out, 'bed-frame', at + 0.03, { rate: 0.65, vol: 0.5, len: gap, lp: 900 }); })); },
        // Wet: slick strokes, its own layer under the furniture, quicker and shorter as the pace rises.
        wet() { ['wet-1', 'wet-2', 'fingers-1', 'fingers-2'].forEach(sample); stops.push(strokes(at => {
            const gap = 1 / strokeRate, o = { vol: 1.15 + Math.min(0.25, (strokeRate - 1) * 0.15), len: gap * 1.1 };
            // Mostly the wet recordings, with a slicker cut from the finger recordings one stroke in four, for variety.
            if (Math.random() < 0.25) grain(out, one('fingers-1', 'fingers-2'), at + 0.01, { ...o, vol: o.vol * 0.7, rate: 0.9 });
            else wetOne(out, at + 0.01 + Math.random() * 0.03, o); })); },
        // Skin slapping (1.85: her recordings): on most strokes when it's rough or quick, louder the faster they go.
        skin() { ['slap-1', 'slap-2'].forEach(sample); stops.push(strokes((at, i) => {
            const hard = Math.max(0, Math.min(1, (strokeRate - 0.9) / 1.5));
            if (fast() || i % 2 === 0 || Math.random() < 0.5) grain(out, one('slap-1', 'slap-2'), at + 0.03, { vol: 0.75 + 0.6 * hard, len: 0.6 / Math.max(1, strokeRate) + 0.15 }); })); },
        // 1.85: Acts with their own layer: fingers keep time, rubbing is a slow continuous slide, spanking and the whip
        // land now and then (sooner the faster the scene runs), her voice comes and goes.
        fingers() { ['fingers-1', 'fingers-2'].forEach(sample); stops.push(strokes(at => {
            grain(out, one('fingers-1', 'fingers-2'), at + 0.01, { vol: 1.1, len: 1.05 / strokeRate }); })); },
        rub() { sample('rub'); stops.push(every(1.5, 2.0, at => grain(out, 'rub', at, { vol: 0.6, len: 2.2, jitter: 0.03 }))); },
        spank() { sample('spank'); stops.push(hits(2.2, 5.5, at => { grain(out, 'spank', at, { vol: 0.95, len: 1.0 }); if (Math.random() < 0.25) grain(out, 'spank', at + 0.45 + Math.random() * 0.3, { vol: 0.8, len: 1.0 }); })); },
        whip() { ['whip-1', 'whip-2'].forEach(sample); stops.push(hits(2.5, 6, at => grain(out, one('whip-1', 'whip-2'), at, { vol: 0.9, len: 1.0 }))); },
        voice() { ['moan', 'whimper'].forEach(sample); stops.push(hits(1.8, 5, at => {
            if (Math.random() < 0.2) return; // a breath's silence now and then
            grain(out, fast() || Math.random() < 0.4 ? 'moan' : 'whimper', at, { vol: 0.8 + (fast() ? 0.2 : 0), len: 2.6, jitter: 0.02 }); })); },
        breath() { let t = 0, alive = true, inhale = true;
            const go = () => { if (!alive || !ac) return; const at = ac.currentTime + 0.05, len = Math.max(0.35, (inhale ? 0.55 : 0.75) / Math.max(0.6, strokeRate * 0.75));
                const s = ac.createBufferSource(), f = filter('bandpass', inhale ? 1500 : 900, 0.9), g = ac.createGain(); s.buffer = noiseBuffer();
                g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(inhale ? 0.35 : 0.5, at + len * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
                s.connect(f).connect(g).connect(out); s.start(at, Math.random() * 2, len + 0.05); inhale = !inhale; t = setTimeout(go, (len + (inhale ? 0.15 : 0.05)) * 1000); };
            t = setTimeout(go, 300); stops.push(() => { alive = false; clearTimeout(t); }); },
        heart() { let t = 0, alive = true;
            const go = () => { if (!alive || !ac) return; const at = ac.currentTime + 0.05; ping(out, 62, at, 0.12, 0.45, 40); ping(out, 55, at + 0.18, 0.1, 0.3, 38); t = setTimeout(go, 1000 / (1 + strokeRate * 0.55)); };
            t = setTimeout(go, 300); stops.push(() => { alive = false; clearTimeout(t); }); },
        vent() { chain(keep(src()), filter('lowpass', 240), gainOf(0.32), out); chain(keep(src()), filter('bandpass', 1200, 0.5), gainOf(0.03), out); chain(keep(osc('sine', 50)), gainOf(0.04), out);
            stops.push(every(9, 25, at => { thud(out, at, 0.08, 70); burst(out, at + 0.05, 0.25, 0.015, 600); }));
            stops.push(every(30, 70, at => { for (let i = 0; i < 3; i++) ping(out, 520, at + i * 0.5, 0.3, 0.008, 0, 'square'); })); },
        buzz() { const g = gainOf(0.08); chain(keep(osc('sawtooth', 60)), filter('bandpass', 180, 3), g, out); chain(keep(osc('sawtooth', 120)), filter('highpass', 1500), gainOf(0.004), out); keep(wobble(g.gain, 0.08, 0.03, 0.4));
            stops.push(every(2, 7, at => { for (let i = 0; i < 4 + Math.floor(Math.random() * 6); i++) burst(out, at + i * 0.02 + Math.random() * 0.03, 0.006, 0.12, 3000); })); },
        alarm() { stops.push(every(2.4, 2.4, at => { const o = ac.createOscillator(), g = ac.createGain(), f = filter('lowpass', 1800); o.type = 'square'; o.frequency.setValueAtTime(600, at); o.frequency.linearRampToValueAtTime(950, at + 0.9); o.frequency.linearRampToValueAtTime(600, at + 1.8);
            g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.05, at + 0.1); g.gain.setValueAtTime(0.05, at + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.85); o.connect(f).connect(g).connect(out); o.start(at); o.stop(at + 1.9); })); },
        crackle() { chain(keep(src()), filter('highpass', 2500), gainOf(0.03), out); stops.push(every(0.03, 0.25, at => burst(out, at, 0.006, 0.12, 1500))); },
    };
    if (!B[name]) { out.disconnect(); return null; }
    B[name]();
    return { gain: out, stop() { stops.forEach(s => s()); for (const n of nodes) { try { n.stop?.(); } catch { /* already stopped */ } try { n.disconnect(); } catch { /* fine */ } } try { out.disconnect(); } catch { /* fine */ } } };
}
