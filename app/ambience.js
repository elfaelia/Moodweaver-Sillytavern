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
    camera: 'a camera clicking', clock: 'a ticking clock', city: 'street traffic', birds: 'birdsong', train: 'a train', shower: 'running water' };
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
let wanted = { beds: [], level: 2 };

export function unlock() {
    try {
        if (!ac) { const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext; if (!AC) return false; ac = new AC(); master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination); }
        if (ac.state === 'suspended') void ac.resume().then(apply).catch(() => {});
        else apply();
        return true;
    } catch { return false; }
}
// True when sound is wanted but the browser is still waiting for a tap.
export const needsTap = () => wanted.beds.length > 0 && (!ac || ac.state !== 'running');
export const playing = () => [...layers.keys()];

// beds: names from BED_LABELS (at most 3), level 1-3. [] fades everything out.
export function setBeds(beds, level = 2) {
    wanted = { beds: [...new Set(beds)].slice(0, 3), level: LEVELS[level] ? level : 2 };
    if (ac && ac.state === 'running') apply();
}
function apply() {
    if (!ac || ac.state !== 'running') return;
    const now = ac.currentTime;
    master.gain.cancelScheduledValues(now); master.gain.setTargetAtTime(wanted.beds.length ? LEVELS[wanted.level] : 0, now, 0.8);
    for (const [name, layer] of layers) if (!wanted.beds.includes(name)) { layer.gain.gain.setTargetAtTime(0, now, 0.7); setTimeout(() => { layer.stop(); }, 4000); layers.delete(name); }
    for (const name of wanted.beds) if (!layers.has(name)) { const layer = build(name); if (layer) { layer.gain.gain.value = 0; layer.gain.gain.setTargetAtTime(1, now, 1.2); layers.set(name, layer); } }
}

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
        monitor() { B.hum(); stops.push(every(1.1, 1.1, at => ping(out, 880, at, 0.12, 0.035))); },
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
        crackle() { chain(keep(src()), filter('highpass', 2500), gainOf(0.03), out); stops.push(every(0.03, 0.25, at => burst(out, at, 0.006, 0.12, 1500))); },
    };
    if (!B[name]) { out.disconnect(); return null; }
    B[name]();
    return { gain: out, stop() { stops.forEach(s => s()); for (const n of nodes) { try { n.stop?.(); } catch { /* already stopped */ } try { n.disconnect(); } catch { /* fine */ } } try { out.disconnect(); } catch { /* fine */ } } };
}
