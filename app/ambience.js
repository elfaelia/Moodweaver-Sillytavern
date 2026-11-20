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
        if (!ac) { const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext; if (!AC) return false; ac = new AC(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination); }
        // Safari parks the sound as "interrupted" after a call or a locked screen; a tap brings it back.
        if (ac.state === 'suspended' || ac.state === 'interrupted') void ac.resume().then(apply).catch(() => {});
        else apply();
        return true;
    } catch { return false; }
}
// True when sound is wanted but the browser is still waiting for a tap.
export const needsTap = () => wanted.beds.length > 0 && (!ac || ac.state !== 'running');
export const playing = () => [...layers.keys()];
export const MAX_BEDS = 5;
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
    slap(out, at) { burst(out, at, 0.06, 0.85, 700); burst(out, at + 0.003, 0.03, 0.4, 3000); },
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
        // Sex (1.80). Each keeps time with strokes(); a quicker pace adds the harder sounds (the headboard, the desk).
        // Sex (1.83, recorded): each stroke picks fresh cuts from the bed recordings, shaped for what they're on. A
        // quicker scene plays them faster and adds the harder hits (the frame, the headboard, the desk).
        bed() { ['bed-thump', 'bed-creak', 'bed-frame'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-thump', at, { vol: fast() ? 0.85 : 0.6, len: gap * 1.05 });
            if (Math.random() < 0.85) grain(out, 'bed-creak', at + 0.02 + Math.random() * 0.05, { vol: 0.75, len: gap * 1.2 });
            if (fast() ? i % 2 === 0 || Math.random() < 0.4 : i % 3 === 0) grain(out, 'bed-frame', at + 0.03, { vol: 0.7, len: gap }); })); },
        chair() { ['bed-creak', 'bed-frame'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-creak', at, { rate: 1.55, vol: 1.05, len: gap * 0.9, hp: 500, jitter: 0.08 });
            if (i % 2 === 0) grain(out, 'bed-frame', at + 0.02, { rate: 1.7, vol: 0.3, len: 0.25, hp: 300 }); })); },
        desk() { ['bed-frame', 'bed-thump'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-frame', at, { rate: 1.3, vol: fast() ? 0.95 : 0.7, len: gap, hp: 120 });
            if (fast() || i % 2 === 0) grain(out, 'bed-thump', at + 0.01, { rate: 1.45, vol: 0.3, len: 0.3, hp: 200 });
            if (i % 2 === 0 || fast()) for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) burst(out, at + 0.02 + k * 0.03 + Math.random() * 0.02, 0.01, 0.05, 3200); })); },
        wall() { ['bed-thump', 'bed-frame'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-thump', at, { rate: 0.8, vol: fast() ? 0.9 : 0.65, len: gap, lp: 700 });
            if (fast() && i % 2 === 0) grain(out, 'bed-frame', at + 0.02, { rate: 0.75, vol: 0.45, len: gap, lp: 1200 }); })); },
        springs() { ['bed-creak', 'bed-thump'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-creak', at, { rate: 1.2, vol: 0.7, len: gap * 1.1, hp: 250 });
            if (fast() || i % 2 === 0) grain(out, 'bed-thump', at + 0.03, { rate: 0.9, vol: 0.4, len: gap, lp: 450 }); })); },
        couch() { ['bed-thump', 'bed-creak'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-thump', at, { rate: 0.75, vol: 0.7, len: gap, lp: 500 });
            if (i % 2 === 0 || Math.random() < 0.3) grain(out, 'bed-creak', at + 0.04, { rate: 0.8, vol: 0.4, len: gap, lp: 1500 }); })); },
        floor() { ['bed-creak', 'bed-frame'].forEach(sample); stops.push(strokes((at, i) => {
            const gap = 1 / strokeRate;
            grain(out, 'bed-creak', at, { rate: 0.72, vol: 0.75, len: gap * 1.2, lp: 1800 });
            if (i % 2 === 0) grain(out, 'bed-frame', at + 0.03, { rate: 0.65, vol: 0.5, len: gap, lp: 900 }); })); },
        // 1.83. Wet: slick strokes from the recordings, its own layer under the furniture, quicker and shorter as the pace rises.
        wet() { ['wet-1', 'wet-2'].forEach(sample); stops.push(strokes(at => {
            const gap = 1 / strokeRate;
            wetOne(out, at + 0.01 + Math.random() * 0.03, { vol: 0.8 + Math.min(0.25, (strokeRate - 1) * 0.15), len: gap * 1.1 }); })); },
        // Skin slapping: a slap on most strokes when it's rough or quick, louder and sharper the faster they go.
        skin() { stops.push(strokes((at, i) => {
            const hard = Math.max(0, Math.min(1, (strokeRate - 0.9) / 1.5));
            if (fast() || i % 2 === 0 || Math.random() < 0.5) { burst(out, at + 0.03, 0.05, 0.3 + 0.45 * hard, 700 + 400 * hard); burst(out, at + 0.033, 0.02, 0.12 + 0.2 * hard, 2800); } })); },
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
