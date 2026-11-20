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
    skin: 'skin on skin', breath: 'breathing', heart: 'a heartbeat', vent: 'a facility’s vents and distant doors', buzz: 'electrical buzz', alarm: 'a distant alarm',
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
export const MORE_WORDS = {
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
let wanted = { beds: [], level: 2 }, strokeRate = 1.2;

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
export const MAX_BEDS = 4;
export const isLoveBed = name => LOVE_BEDS.has(name);

// beds: names from BED_LABELS (at most MAX_BEDS), level 1-3. [] fades everything out. energy (1-5): how fast the
// furniture keeps time during sex.
export function setBeds(beds, level = 2, energy = 3) {
    wanted = { beds: [...new Set(beds)].slice(0, MAX_BEDS), level: LEVELS[level] ? level : 2 };
    strokeRate = 0.55 + 0.24 * Math.max(1, Math.min(5, Number(energy) || 3));
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

// A creak: wood or a spring catching and slipping. A buzz of clicks (pulse Hz, gliding) rung through the
// furniture's own resonance (res Hz). Squeak: metal or plastic, a thin rising tone.
function creak(out, at, len, pulse0, pulse1, res, vol, q = 9) {
    const o = ac.createOscillator(), g = ac.createGain(), f1 = filter('bandpass', res, q), f2 = filter('bandpass', res * 2.3, q), m = gainOf(0.45);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(pulse0, at); o.frequency.linearRampToValueAtTime(pulse1, at + len);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + Math.min(0.04, len / 4)); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(f1).connect(g); o.connect(f2).connect(m).connect(g); g.connect(out); o.start(at); o.stop(at + len + 0.05);
}
function squeak(out, at, len, f0, f1, vol) {
    const o = ac.createOscillator(), g = ac.createGain(), v = ac.createOscillator(), vg = gainOf(f0 * 0.02);
    o.type = 'triangle'; o.frequency.setValueAtTime(f0, at); o.frequency.linearRampToValueAtTime(f1, at + len);
    v.frequency.value = 28 + Math.random() * 10; v.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(out); o.start(at); v.start(at); o.stop(at + len + 0.05); v.stop(at + len + 0.05);
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
    const tick = () => {
        if (!alive || !ac) return;
        let wait = 1 / strokeRate;
        if (Date.now() > pauseAt) { pauseAt = Date.now() + 20000 + Math.random() * 40000; wait = 2 + Math.random() * 4; }
        else { try { fn(ac.currentTime + 0.03, i++); } catch { /* closed */ } wait *= 0.88 + Math.random() * 0.24; }
        t = setTimeout(tick, wait * 1000);
    };
    t = setTimeout(tick, 400);
    return () => { alive = false; clearTimeout(t); };
}
const fast = () => strokeRate >= 1.5;

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
        bed() { stops.push(strokes((at, i) => {
            if (i % 2) creak(out, at, 0.16, 95, 80, 560, 0.45); else creak(out, at, 0.22, 70, 96, 430, 0.7);
            if (Math.random() < 0.3) ping(out, 1700 + Math.random() * 500, at + 0.03, 0.18, 0.006);
            if (fast() && i % 2 === 0) thud(out, at + 0.06, 0.22, 85); })); },
        chair() { stops.push(strokes((at, i) => {
            if (i % 2) squeak(out, at, 0.13, 1250, 1010, 0.11); else squeak(out, at, 0.15, 1080, 1360, 0.14);
            if (i % 2 === 0) creak(out, at + 0.02, 0.12, 55, 70, 300, 0.6, 5);
            if (Math.random() < 0.08) { const s = ac.createBufferSource(), f = filter('bandpass', 900, 0.8), g = ac.createGain(); s.buffer = noiseBuffer(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.05, at + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45); s.connect(f).connect(g).connect(out); s.start(at, Math.random() * 2, 0.5); } })); },
        desk() { stops.push(strokes((at, i) => {
            thud(out, at, fast() ? 0.3 : 0.18, 150);
            if (i % 2 === 0 || fast()) for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) burst(out, at + 0.015 + k * 0.03 + Math.random() * 0.02, 0.01, 0.06, 3200);
            if (Math.random() < 0.25) creak(out, at + 0.01, 0.12, 80, 70, 650, 0.15); })); },
        wall() { stops.push(strokes((at, i) => { if (i % 2 === 0 || fast()) thud(out, at, fast() ? 0.4 : 0.25, 75); })); },
        springs() { stops.push(strokes((at, i) => {
            if (i % 2) squeak(out, at, 0.16, 780, 690, 0.08); else squeak(out, at, 0.18, 640, 760, 0.1);
            if (fast()) thud(out, at + 0.04, 0.12, 60); })); },
        couch() { stops.push(strokes((at, i) => {
            creak(out, at, 0.2, i % 2 ? 62 : 52, i % 2 ? 54 : 68, 260, 0.9, 4);
            if (Math.random() < 0.4) { const s = ac.createBufferSource(), f = filter('bandpass', 2400, 1.2), g = ac.createGain(); s.buffer = noiseBuffer(); g.gain.setValueAtTime(0.03, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18); s.connect(f).connect(g).connect(out); s.start(at, Math.random() * 2, 0.2); } })); },
        floor() { stops.push(strokes((at, i) => { if (i % 2 === 0) creak(out, at, 0.3, 38, 58, 340, 0.95, 6); })); },
        // 1.81. Skin: hips meeting, in time, harder when quicker. Breath: in and out, faster with the pace.
        skin() { stops.push(strokes((at, i) => { burst(out, at + 0.04, 0.035, fast() ? 0.55 : 0.38, 900); if (i % 3 === 0) burst(out, at + 0.045, 0.02, 0.18, 2600); })); },
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
