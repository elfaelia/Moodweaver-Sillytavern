// Music: your Spotify songs, picked for the scene by plain code (engine/music.js) and played on your Spotify.
// Runs after each reply (afterReply), at the end of each song (a timer) and when you tap in the Music tab.
// Nothing here is sent to Claude unless Settings › "Let the story feel the music" is on.
import { getCast, getState, getUserState, playerName, target } from './chat.js';
import { bondAxes, bondData, bondList, liveFor } from './replies.js';
import { KEY, ctx, run, ui } from './state.js';
import { BY_ID } from '../data/catalogue.js';
import { computeBond } from '../engine/bond.js';
import { GOOD_ENOUGH, MODES, MOOD_LIST, cleanTags, cueHits, describe, emptyTags, hasTags, learnKeys, lineup, mergeTags, norm, pick, rank, shiftOf, snapshot } from '../engine/music.js';
import { readSheet, sheetFile } from '../engine/sheet.js';
import { readCsv, readXlsx } from '../engine/xlsx.js';
import { shortName } from '../engine/util.js';
import { BEATS, beatsIn, plainStory, radioIn, radioKind } from '../engine/scene-words.js';
import * as amb from './ambience.js';
import * as sp from './spotify.js';

const DEFAULTS = { on: false, clientId: '', redirect: '', auth: null, pending: null, playlists: {}, songs: {}, tags: {}, ptags: {}, chars: {}, learn: {},
    follow: 'char', change: 'big', sound: {}, hold: 120, fade: true, themes: 'big', feel: false, tell: false, tellFor: 2, cues: true, cueAt: {}, ambLevel: 2, stingAt: {}, peaks: {}, device: '', deviceName: '', recent: [], loadedAt: 0 };
// Everything is kept in SillyTavern's extension settings (on your computer), so every device shares it.
export function music() {
    const all = ctx().extensionSettings[KEY] ??= {};
    const m = all.music && typeof all.music === 'object' ? all.music : (all.music = {});
    for (const [k, v] of Object.entries(DEFAULTS)) if (m[k] === undefined || m[k] === null && v !== null) m[k] = structuredClone(v);
    if (!['char', 'user', 'both', 'story'].includes(m.follow)) m.follow = 'char';
    if (![1, 2, 3, 0].includes(Number(m.tellFor))) m.tellFor = 2;
    if (!['end', 'big', 'any'].includes(m.change)) m.change = 'big';
    if (![60, 120, 240].includes(Number(m.hold))) m.hold = 120;
    if (!['big', 'always', 'off'].includes(m.themes)) m.themes = 'big';
    // Extras: each one Off, for Everyone, or Only some (the characters ticked for it, kept per character).
    if (!m.extras || typeof m.extras !== 'object') m.extras = { ...EXTRA_DEFAULTS, ...(m.fade === false ? { fade: 'off' } : {}) };
    for (const [k, v] of Object.entries(EXTRA_DEFAULTS)) if (!['off', 'all', 'some'].includes(m.extras[k])) m.extras[k] = v;
    if (![1, 2, 3].includes(Number(m.ambLevel))) m.ambLevel = 2;
    return m;
}
// ---- Extras ----
// Crossfade, stings, peaks, ambience and the in-story radio. Each can be off, on for everyone, or on only for the
// characters ticked for it (saved with that character, so it follows them into every chat).
export const EXTRAS = [
    { id: 'fade', label: 'Crossfade', note: 'A changing song fades out and the new one fades in, instead of a hard cut.' },
    { id: 'sting', label: 'Stings', note: 'A big beat in the newest reply (a slap, a gunshot, a door kicked in, “I love you”, a death, a first kiss, a reveal) cuts straight to a song tagged for it, once, whatever the hold time.' },
    { id: 'peak', label: 'Start at the peak', note: 'When a scene is already at full tilt, or a sting hits, the new song starts at its chorus or drop instead of its intro.' },
    { id: 'amb', label: 'Ambience', note: 'A quiet sound bed under the music, picked by itself from the place facts or, without them, from where the last few messages put you: rain or a storm, a ward, a diner, an office hum, a basement, wind, waves, a fire, the road, a train, a shower, a dripping cellar, street traffic, a ticking clock, birdsong by day and crickets at night. It plays on the phone or computer you have SillyTavern open on.' },
    { id: 'camera', label: 'Camera clicks', under: 'amb', note: 'Part of the ambience: a camera’s shutter clicking softly, with long pauses and now and then the film winding on, in a darkroom or when the last few messages mention a camera, a shutter, a polaroid or the dark room.' },
    { id: 'radio', label: 'In-story radio', note: 'When the story turns on a radio, jukebox or record player, the music becomes what they can hear: songs from the story’s era, and Claude is told what’s playing so the characters can react to it.' },
];
const EXTRA_DEFAULTS = { fade: 'all', sting: 'all', peak: 'all', amb: 'off', camera: 'some', radio: 'all' };
const charKey = () => norm(shortName(target()?.name ?? ''));
export function extraOn(id, m = music()) {
    const mode = m.extras?.[id] ?? 'off';
    return mode === 'all' || (mode === 'some' && Boolean(m.chars[charKey()]?.x?.[id]));
}
// Ticks or unticks a character for one extra (the main character of this chat unless a name is given).
export function toggleExtraFor(id, name = '') {
    const m = music(), key = name ? norm(name) : charKey(); if (!key) return;
    const c = m.chars[key] ??= { name: name || shortName(target()?.name ?? '') };
    c.x = { ...(c.x ?? {}), [id]: !c.x?.[id] }; save(); updateAmbience(); changed();
}
export const extraChars = id => Object.values(music().chars).filter(c => c.x?.[id]).map(c => c.name);
export const thisCharName = () => shortName(target()?.name ?? '');
export function setExtra(id, mode) { const m = music(); m.extras[id] = mode; save(); updateAmbience(); changed(); }
export function setAmbLevel(level) { const m = music(); m.ambLevel = Number(level); save(); updateAmbience(); changed(); }

// Not saved: what's playing and why.
export const mus = { forced: null, story: null, told: null, now: null, anchor: null, latest: null, lastFam: '', lineup: [], timer: 0, poll: 0, busy: false, status: '', error: '', cutAt: 0, locked: false, chatMark: '', present: '', devices: [], lastImport: null, loading: '', cues: new Map(), heard: [], radio: null, sting: null };
function save() { ctx().saveSettingsDebounced(); }
sp.onSignInChange(save);
let redraw = () => {};
export const onMusicChange = fn => { redraw = fn; };
const changed = () => { try { redraw(); } catch { /* panel closed */ } };
const say = (text, bad = false) => { mus.status = bad ? '' : text; mus.error = bad ? text : ''; changed(); };

// ---- Names ----
// Everyone the Character dropdown offers: SillyTavern's characters and your personas.
export function characterNames() {
    const c = ctx(), pu = c.powerUserSettings ?? globalThis.power_user ?? {};
    return [...new Set([...(c.characters ?? []).map(ch => shortName(ch?.name ?? '')).filter(Boolean), ...Object.values(pu.personas ?? {}).map(n => shortName(String(n ?? ''))).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
}
export const followName = who => who === 'user' ? shortName(playerName()) : shortName(target()?.name ?? 'the character');

// ---- The scene ----
export const modeLabel = id => (MODES.find(x => x.id === id)?.label ?? id).toLowerCase();
const factsOf = st => Object.fromEntries(Object.entries(st?.moods ?? {}).filter(([id, v]) => v > 0 && BY_ID[id]?.kind === 'state'));
export function sceneNow(deep = false) {
    const ch = target(); if (!ch) return null;
    const st = getState(ch), you = getUserState(), m = music(), follow = m.follow;
    const people = [], who = [];
    // Story (film score): both of you, as one scene. Feelings are averaged over the last few replies so the music
    // carries the scene's mood instead of jumping with each line, like a score that holds a cue.
    if (follow === 'story') {
        const blend = {};
        for (const moods of [st?.moods ?? {}, ...(you?.enabled !== false ? [you?.moods ?? {}] : [])]) for (const [id, v] of Object.entries(moods)) if (v > 0) blend[id] = Math.max(blend[id] ?? 0, v);
        const prev = mus.story?.chat === ctx().chatId ? mus.story.moods : null, smooth = {};
        for (const id of new Set([...Object.keys(blend), ...Object.keys(prev ?? {})])) { const v = prev ? (blend[id] ?? 0) * 0.5 + (prev[id] ?? 0) * 0.5 : blend[id] ?? 0; if (v >= 8) smooth[id] = Math.round(v); }
        mus.story = { chat: ctx().chatId, moods: smooth };
        people.push({ name: ch.name, weight: 1, moods: smooth });
        who.push(ch.name, shortName(ch.name), '{{char}}');
        if (you?.enabled !== false) who.push(playerName(), shortName(playerName()), '{{user}}');
    } else if (follow !== 'user') { people.push({ name: ch.name, weight: 1, moods: st?.moods ?? {} }); who.push(ch.name, shortName(ch.name), '{{char}}'); }
    if (follow !== 'char' && you?.enabled !== false) { people.push({ name: playerName(), weight: follow === 'both' ? 0.8 : 1, moods: you?.moods ?? {} }); who.push(playerName(), shortName(playerName()), '{{user}}'); }
    const facts = { ...factsOf(you), ...factsOf(st) };
    for (const p of getCast(ch).filter(p => p.inScene)) Object.assign(facts, Object.fromEntries(Object.entries(factsOf(p.state)).filter(([id]) => BY_ID[id]?.category === 'setting')));
    const live = liveFor(ch), bond = bondData(ch);
    let dyn = '', under = '', meters = {};
    if (bond.on) { try { const bd = computeBond(bond, Infinity, shortName(ch.name), shortName(playerName()), bondAxes(ch), bondList(ch)); dyn = bd.dynamic?.group ?? ''; under = bd.under?.group ?? ''; meters = bd.more ?? {}; } catch { /* bonds off or new chat */ } }
    const chat = ctx().chat ?? [], replies = chat.filter(x => x && !x.is_user && !x.is_system).length;
    const present = String(live?.present ?? ''), before = mus.present; mus.present = present;
    const appear = [...new Set(characterNames().filter(n => present.toLowerCase().includes(n.toLowerCase()) && !before.toLowerCase().includes(n.toLowerCase())))];
    // Heat counts both of you whoever the music follows, and the newest reply's own words say what is happening now.
    const everyone = [{ names: [ch.name, shortName(ch.name), '{{char}}'], moods: st?.moods ?? {} }, ...(you?.enabled !== false ? [{ names: [playerName(), shortName(playerName()), '{{user}}'], moods: you?.moods ?? {} }] : [])];
    const lastReply = [...chat].reverse().find(x => x && !x.is_user && !x.is_system), lastYou = [...chat].reverse().find(x => x && x.is_user);
    const texts = [{ text: lastReply?.mes ?? '', weight: 1 }, { text: lastYou?.mes ?? '', weight: 0.6 }];
    // Story mode reads one reply further back too, so the scene's turn (a confession building, a chase starting)
    // carries, the way a film cue follows the scene and not one line.
    // ↻ Re-roll reads it too, whatever the music follows.
    if (follow === 'story' || deep) { const prevReply = chat.filter(x => x && !x.is_user && !x.is_system).at(-2); if (prevReply) texts.push({ text: prevReply.mes ?? '', weight: follow === 'story' ? 0.4 : 0.5 }); }
    if (mus.forced && mus.forced.chat !== ctx().chatId) mus.forced = null;
    const snap = snapshot({ people, who, facts, dyn, under, meters, horny: Number.isFinite(live?.hornyValue) ? live.hornyValue : null, night: live?.sky?.time === 'night', replies, appear, everyone, texts, force: mus.forced?.mode ?? '' });
    snap.story = follow === 'story';
    snap.name = follow === 'story' ? 'The story' : followName(follow === 'user' ? 'user' : 'char') + (follow === 'both' ? ` & ${shortName(playerName())}` : '');
    return snap;
}

// ---- The songs that count ----
// Songs from the playlists you ticked (and songs you tagged from a sheet), each with its playlists' tags under its own.
export function usableSongs(m = music()) {
    // A playlist counts as lit when it, or one with the same name (a sheet import and the Spotify playlist), is ticked.
    const litNames = new Set(Object.values(m.playlists).filter(p => p.on).map(p => norm(p.name)));
    const on = new Set(Object.entries(m.playlists).filter(([, p]) => p.on || litNames.has(norm(p.name))).map(([id]) => id));
    // A tagged song whose playlists are all gone (deleted, renamed away, or never loaded) still counts, like a sheet song.
    return Object.entries(m.songs).filter(([uri, s]) => (s.pl ?? []).some(id => on.has(id)) || (hasTags(m.tags[uri]) && !(s.pl ?? []).some(id => m.playlists[id])))
        .map(([uri, s]) => ({ uri, song: s, g: s.g ?? [], learn: m.learn[uri], tags: mergeTags(cleanTags(m.tags[uri] ?? {}), ...(s.pl ?? []).filter(id => on.has(id)).map(id => m.ptags[id] && cleanTags(m.ptags[id]))) }));
}
// ---- Lyric cues ----
// When the story says a song's cue ("salivating like a dog"), that song gets a nudge for this reply and the next two,
// only if it fits the scene. Once it has played for a cue, its cues rest for 10 minutes so it doesn't keep coming back.
const CUE_REPLIES = 3, CUE_REST = 10 * 60 * 1000;
const replyCount = () => (ctx().chat ?? []).filter(x => x && !x.is_user && !x.is_system).length;
function readCues(m, deep = false) {
    if (!m.cues) { mus.cues.clear(); return []; }
    const chat = ctx().chat ?? [], at = replyCount(), id = ctx().chatId;
    for (const [uri, c] of mus.cues) if (c.chat !== id || at - c.at >= CUE_REPLIES) mus.cues.delete(uri);
    // A new reply: the newest reply and your last message. ↻ Re-roll (deep): the last 6 messages, yours and theirs, so a
    // line from a little while ago that's still the scene counts. Newer messages win a tie.
    const story = chat.filter(x => x && !x.is_system && x.mes), msgs = deep ? story.slice(-6).reverse() : [story.filter(x => !x.is_user).at(-1), story.filter(x => x.is_user).at(-1)].filter(Boolean);
    const songs = usableSongs(m), hits = new Map();
    msgs.forEach((x, back) => { for (const h of cueHits(songs, plainStory(x.mes))) if (!hits.has(h.uri)) hits.set(h.uri, { ...h, back }); });
    // Resting songs are kept too, so the Now card can say a cue was heard but its song is resting; they don't score.
    for (const h of hits.values()) mus.cues.set(h.uri, { cue: h.cue, at, chat: id, strength: h.strength, back: h.back });
    const hitList = [...hits.values()];
    return hitList.filter(h => Date.now() - (m.cueAt[h.uri] ?? 0) > CUE_REST).map(h => h.uri);
}
// The rest only stops a song coming BACK: while the song a cue started is still playing, it keeps its cue, so it still
// fits the scene and isn't cut for having "used up" its cue.
const cuedNow = m => {
    if (!m.cues) return new Map();
    const out = new Map([...mus.cues].filter(([uri]) => Date.now() - (m.cueAt[uri] ?? 0) > CUE_REST).map(([uri, c]) => [uri, c.cue]));
    if (mus.cuedSong && mus.cuedSong.uri === mus.now?.uri) out.set(mus.cuedSong.uri, mus.cuedSong.cue);
    return out;
};
// When the story has just cued a song that fits the scene and isn't resting, it is almost always the pick (9 in 10);
// ↻ Re-roll always takes it. The 3-hour rest after it plays is what stops it coming back again and again.
const CUE_CHANCE = 0.9;
// The strongest cue wins (an exact phrase like "like a dog" beats two theme words), then the newest, then the best fit.
const cueRank = x => { const c = mus.cues.get(x.uri) ?? {}; return (c.strength ?? 1) * 10 - (c.back ?? 0); };
function pickCued(list, only = null, chance = CUE_CHANCE) {
    const c = list.filter(x => x.cue && (!only || only.includes(x.uri)) && x.uri !== mus.now?.uri).map((x, i) => [x, cueRank(x), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(([x]) => x);
    return c.length && Math.random() < chance ? c[0] : null;
}
// A cued song that plays uses up its cue for a while.
function cuePlayed(m, uri) {
    if (!uri || !mus.cues.has(uri)) return;
    // Every version of the song (same title) rests too, so a cover doesn't follow straight after.
    mus.cuedSong = { uri, cue: mus.cues.get(uri).cue };
    const title = norm(m.songs[uri]?.n ?? '');
    for (const u of [...mus.cues.keys()]) if (u === uri || (title && norm(m.songs[u]?.n ?? '') === title)) { m.cueAt[u] = Date.now(); mus.cues.delete(u); }
    { for (const [u, t] of Object.entries(m.cueAt)) if (Date.now() - t > CUE_REST) delete m.cueAt[u]; } }

function ranked(snap, m = music(), exclude = []) {
    const songs = usableSongs(m).filter(s => !exclude.includes(s.uri)), recent = new Set(m.recent.slice(-20));
    let list = rank(songs, snap, { recent, themeOn: m.themes, sound: m.sound, cued: cuedNow(m) });
    // In-story radio: only songs from the story's era or earlier (by the sheet's Year), still in order of fit.
    if (radioOn(m)) {
        const end = eraEnd(), year = new Map(songs.map(s => [s.uri, s.tags.yr]));
        const period = list.filter(x => year.get(x.uri) && (!end || year.get(x.uri) <= end));
        mus.radio.empty = !period.length; if (period.length) list = period;
    }
    // What the cues did, for the Now playing card: heard, and whether the song fits this scene.
    mus.heard = [...mus.cues].sort((a, b) => (b[1].strength ?? 1) - (a[1].strength ?? 1) || (a[1].back ?? 0) - (b[1].back ?? 0)).map(([uri, c]) => ({ uri, cue: c.cue, name: m.songs[uri]?.n ?? '', resting: Date.now() - (m.cueAt[uri] ?? 0) <= CUE_REST, restLeft: Math.max(0, CUE_REST - (Date.now() - (m.cueAt[uri] ?? 0))), fits: Boolean(list.find(x => x.uri === uri)?.cue) }));
    // Nothing fits well: the character's own default playlist (Characters tab), then simply the best there is.
    if (!list.length || list[0].score < GOOD_ENOUGH) {
        const own = m.chars[norm(snap.name.split(' & ')[0])]?.pl;
        if (own) { const mine = list.filter(x => (m.songs[x.uri]?.pl ?? []).includes(own)); if (mine.length) list = [...mine, ...list.filter(x => !mine.includes(x))]; }
    }
    return list;
}

// ---- Radio, stings and peaks ----
const RADIO_REPLIES = 6, STING_REST = 10 * 60 * 1000;
export const radioOn = (m = music()) => Boolean(mus.radio && mus.radio.chat === ctx().chatId && extraOn('radio', m));
// The last year of the story's era (era_1960s… → 1969), from either of you; 0 when no era is set.
export function eraEnd() {
    const ch = target(), years = [];
    for (const moods of [getState(ch)?.moods ?? {}, getUserState()?.moods ?? {}]) for (const [id, v] of Object.entries(moods)) { const y = id.match(/^era_(\d{3})0s/); if (y && v > 0) years.push(Number(y[1]) * 10 + 9); }
    return years.length ? Math.max(...years) : 0;
}
// A scene already at full tilt: frantic energy, a sex scene, or danger and darkness running high.
const fullTilt = snap => Boolean(snap && (snap.energy >= 4 || snap.heat === 'sex' || (['danger', 'dark'].includes(snap.mode) && snap.energy >= 3)));
// Where a song's peak starts: the sheet's Peak, else Spotify's own sections (the loudest one after the intro), else
// a guess (most songs reach their first chorus a little over a quarter of the way in).
async function peakMs(m, uri) {
    const own = cleanTags(m.tags[uri] ?? {}).pk; if (own) return own * 1000;
    if (m.peaks[uri]) return m.peaks[uri] * 1000;
    const len = (m.songs[uri]?.ms ?? 0) / 1000;
    if (!mus.noAnalysis) {
        try {
            const a = await sp.analysis(m, uri), secs = (a?.sections ?? []).filter(x => x.start >= 20 && x.start <= Math.max(30, len * 0.7));
            if (secs.length) { const loud = Math.max(...secs.map(x => x.loudness)), best = secs.find(x => x.loudness >= loud - 1); m.peaks[uri] = Math.round(best.start); save(); return m.peaks[uri] * 1000; }
        } catch { mus.noAnalysis = true; }
    }
    if (len < 100) return 0;
    return Math.round(Math.min(Math.max(len * 0.28, 35), 95, len - 60)) * 1000;
}
// ---- Ambience ----
const OUTSIDE = new Set(['outdoors', 'rooftop_night', 'graveside', 'isolated', 'campfire', 'drive_in', 'beach', 'abandoned']);
// The story's own words, newest first (the last few replies and your messages), for scenes with no place fact set.
const recentStory = (n = 6) => (ctx().chat ?? []).filter(x => x && !x.is_system && x.mes).slice(-n).reverse().map(x => plainStory(x.mes));
// Which of these word lists the newest text matches: [id, how many messages back] for the most recent match.
const newestHit = (list, texts) => { let best = null; for (const [id, re] of list) { const i = texts.findIndex(t => re.test(t)); if (i >= 0 && (!best || i < best[1])) best = [id, i]; } return best; };
export function ambienceBeds(snap = mus.latest, m = music()) {
    if (!extraOn('amb', m) || !m.on || mus.userPaused) return [];
    const places = snap?.places ?? new Set(), texts = recentStory(6), beds = [];
    // Weather: the board's facts, else rain or a storm in the last 6 messages (until someone says it stopped).
    const stop = texts.findIndex(t => amb.WEATHER_STOP.test(t)), sky = newestHit(amb.WEATHER_WORDS, texts);
    if (places.has('stormy')) beds.push('storm'); else if (places.has('raining')) beds.push('rain');
    else if (sky && (stop < 0 || sky[1] < stop)) beds.push(sky[0]);
    // The place: a place fact first, else the place the last 4 messages most recently put them in.
    const place = [...places].map(p => amb.PLACE_BEDS[p]).find(Boolean) ?? newestHit(amb.PLACE_WORDS, texts.slice(0, 4))?.[0];
    if (place) beds.push(place);
    if (radioOn(m)) beds.push('crackle');
    // Layers on top: the camera (its own setting, for a darkroom or a camera in the last 3 messages), a clock,
    // birds by day, crickets at night outdoors.
    const near = texts.slice(0, 3), has = id => amb.LAYER_WORDS.find(([k]) => k === id)[1];
    if (extraOn('camera', m) && (places.has('darkroom') || near.some(t => has('camera').test(t)))) beds.push('camera');
    if (near.slice(0, 2).some(t => has('clock').test(t))) beds.push('clock');
    const outside = [...places].some(p => OUTSIDE.has(p)) || ['wind', 'waves', 'fire'].includes(place);
    if (!snap?.night && near.some(t => has('birds').test(t)) && !beds.includes('storm')) beds.push('birds');
    if (snap?.night && outside && !beds.includes('rain') && !beds.includes('storm')) beds.push('crickets');
    return [...new Set(beds)].slice(0, 3);
}
export function updateAmbience(snap = mus.latest) { try { const m = music(); amb.setBeds(ambienceBeds(snap, m), m.ambLevel); } catch { /* no sound here */ } }
export const unlockSound = () => { amb.unlock(); updateAmbience(); };

// ---- Playing ----
const deviceFor = async m => {
    const list = await sp.devices(m); mus.devices = list;
    const chosen = list.find(d => d.id === m.device) ?? list.find(d => d.is_active) ?? list[0];
    if (!chosen) throw Object.assign(new Error('Open Spotify on your phone or computer, play anything for a second, then tap ▶ again.'), { code: 'device' });
    return chosen;
};
// Volume in small steps (Spotify has no crossfade of its own through its API, so this is the next best thing).
async function ramp(m, device, from, to, ms, steps = 8) {
    for (let i = 1; i <= steps; i++) { await sp.volume(m, from + (to - from) * i / steps, device.id).catch(() => null); await new Promise(r => setTimeout(r, ms / steps)); }
}
// startMs: where in the first song to start (its peak), 0 for the beginning.
async function playList(m, uris, why, snap, cut = false, startMs = 0) {
    const device = await deviceFor(m);
    // While an earlier fade is still coming back up, Spotify reports the lowered volume: use the one from before it.
    const vol = Date.now() < (mus.fadeUntil ?? 0) ? mus.fullVol : device.volume_percent ?? 70, low = Math.round(vol * 0.12);
    const xfade = cut && mus.now?.playing && extraOn('fade', m) && device.supports_volume;
    if (xfade) { mus.fullVol = vol; mus.fadeUntil = Date.now() + 7000; await ramp(m, device, vol, low, 2400); }
    await sp.shuffleOff(m, device.id); await sp.repeatOff(m, device.id);
    await sp.play(m, uris, device.id, startMs);
    if (xfade) setTimeout(() => void ramp(m, device, low, vol, 3200), 300);
    mus.lineup = uris; mus.anchor = snap; mus.cutAt = Date.now(); mus.why = why; mus.userPaused = false; mus.wasPlaying = true;
    const s = m.songs[uris[0]];
    mus.now = { uri: uris[0], name: s?.n ?? '', artist: s?.a ?? '', art: '', ms: s?.ms ?? 0, started: Date.now() - startMs, progress: startMs, playing: true };
    updateAmbience(snap);
    remember(m, uris[0]); say(''); setTimeout(() => void sync(), 1500);
}
function remember(m, uri) { if (!uri) return; cuePlayed(m, uri); m.recent = [...m.recent.filter(u => u !== uri), uri].slice(-40); save(); }
// Start (or restart) with the best songs for the scene right now.
export async function start(exclude = [], deep = false, sure = false) {
    const m = music(); if (!sp.signedIn(m)) return say('Sign in to Spotify first.', true);
    const snap = sceneNow(deep) ?? snapshot({}); mus.latest = snap;
    readCues(m, deep); // Play and Next hear the story too, not only a new reply.
    const list = ranked(snap, m, exclude);
    if (!list.length) return say('No songs yet: tick a playlist and tap Load songs, or import a song sheet.', true);
    const first = pickCued(list, null, sure ? 1 : CUE_CHANCE) ?? pick(list);
    const at = sure && fullTilt(snap) && extraOn('peak', m) ? await peakMs(m, first.uri) : 0;
    try { await playList(m, lineup(list, first), at ? [...first.why, 'started at its peak'] : first.why, snap, Boolean(mus.now), at); m.on = true; save(); }
    catch (err) { say(err.message, true); }
}
// After each reply: decide whether this is a real shift worth cutting the song for.
export async function afterReply() {
    const m = music(); if (!m.on || !sp.signedIn(m) || run.suspended) return;
    const snap = sceneNow(); if (!snap) return;
    const famHeld = snap.fams[0] && snap.fams[0] === mus.lastFam ? snap.fams[0] : mus.anchor?.fams[0];
    mus.lastFam = snap.fams[0] ?? ''; mus.latest = snap;
    // A swipe or a regenerate of the same reply doesn't count as the story moving on.
    // An edit of a message already there (same chat length, same newest message) isn't the story moving on either: the
    // board and ambience update, but the song isn't changed for it.
    const chat = ctx().chat ?? [], last = chat.at(-1), mark = `${ctx().chatId}|${chat.length}`, stamp = `${last?.send_date ?? ''}|${last?.swipe_id ?? 0}`;
    const edited = mark === mus.chatMark && stamp === mus.lastStamp, swiped = edited || (mark === mus.chatMark && (last?.swipe_id ?? 0) > 0);
    mus.chatMark = mark; mus.lastStamp = stamp;
    if (mus.forced && !swiped && --mus.forced.left <= 0) mus.forced = null;
    const freshCues = readCues(m);
    if (!mus.now) { await sync(); if (!mus.now) return start(); }
    // Never silent: if the music ran out (not paused by you), sync sees it and starts it again (ranDry).
    if (!mus.now.playing && !mus.userPaused && !mus.locked) { await sync(); if (!mus.now?.playing) { changed(); return; } }
    updateAmbience(snap);
    // A song you picked yourself plays to its end: no reply, cue or sting cuts it.
    if (mus.locked || swiped || (mus.chosen && mus.chosen === mus.now?.uri)) { changed(); return; }
    // The words of this turn: the newest reply, and your message if it came just before it.
    const turn = [last?.is_user ? '' : last?.mes, chat.at(-2)?.is_user ? chat.at(-2).mes : ''].filter(Boolean).join('\n');
    // In-story radio: switched on, kept on (for a while, or while the story keeps mentioning it), or switched off.
    if (extraOn('radio', m)) {
        const said = radioIn(turn), was = radioOn(m);
        if (said === 'on') mus.radio = { chat: ctx().chatId, kind: was ? mus.radio.kind : radioKind(turn), left: RADIO_REPLIES };
        else if (said === 'off') mus.radio = null;
        else if (was && --mus.radio.left <= 0) mus.radio = null;
        if (radioOn(m) !== was) {
            const list = ranked(snap, m), first = list.length ? pick(list) : null;
            if (first) { try { await playList(m, lineup(list, first), radioOn(m) ? [`${mus.radio.kind} in the story`] : ['the radio went off'], snap, true); } catch (err) { say(err.message, true); } return; }
        }
    } else mus.radio = null;
    // Stings: a big beat cuts straight to a song tagged for it, once (not again for 10 minutes), whatever the hold.
    const beats = extraOn('sting', m) ? [...new Set(beatsIn(turn))] : [];
    if (beats.length && Date.now() - mus.cutAt > 8000) {
        const list = ranked(snap, m), tagsOf = new Map(usableSongs(m).map(x => [x.uri, x.tags]));
        const hit = list.find(x => x.uri !== mus.now.uri && Date.now() - (m.stingAt[x.uri] ?? 0) > STING_REST && (tagsOf.get(x.uri)?.st ?? []).some(b => beats.includes(b)));
        if (hit) {
            const beat = BEATS.find(b => beats.includes(b.id) && tagsOf.get(hit.uri).st.includes(b.id));
            m.stingAt[hit.uri] = Date.now(); for (const [u, t] of Object.entries(m.stingAt)) if (Date.now() - t > STING_REST) delete m.stingAt[u];
            mus.sting = { beat: beat?.label ?? '', name: m.songs[hit.uri]?.n ?? '', at: Date.now() };
            const at = extraOn('peak', m) ? await peakMs(m, hit.uri) : 0;
            try { await playList(m, lineup(list, hit), [`sting: ${(beat?.label ?? '').toLowerCase()}`, ...(at ? ['started at its peak'] : []), ...hit.why], snap, true, at); } catch (err) { say(err.message, true); }
            return;
        }
    }
    const shift = shiftOf(mus.anchor, snap, famHeld), list = ranked(snap, m);
    // The story just said a song's cue and that song now leads: that counts as a real shift (the hold time still applies).
    const cueShift = list.some(x => x.cue && freshCues.includes(x.uri) && x.uri !== mus.now.uri);
    if (!list.length) return;
    const now = list.find(x => x.uri === mus.now.uri), current = now?.score ?? -Infinity, held = (Date.now() - mus.cutAt) / 1000 >= m.hold;
    // The scene turned into another kind (a kiss, a chase, a death) and this song is wrong for it: change now,
    // whatever the hold time or "Only when a song ends" says. Otherwise the usual rules.
    const wrong = snap.mode && (!now || !now.fits) && list[0].fits && (Date.now() - mus.cutAt) > 15000;
    // A fresh cue doesn't wait for the full hold time: half a minute into a song is enough.
    const cueReady = cueShift && (Date.now() - mus.cutAt) > 30000;
    if (wrong || (m.change !== 'end' && (cueReady || (held && (m.change === 'any' ? shift.any : shift.big) && list[0].score >= current + 4)))) {
        const first = (cueShift && pickCued(list, freshCues)) || pick(list);
        const at = fullTilt(snap) && extraOn('peak', m) && !radioOn(m) ? await peakMs(m, first.uri) : 0;
        try { await playList(m, lineup(list, first), at ? [...first.why, 'started at its peak'] : first.why, snap, true, at); } catch (err) { say(err.message, true); }
    } else changed();
}
// What Spotify is playing now; keeps the end-of-song timer right.
export async function sync() {
    const m = music(); if (!sp.signedIn(m)) return;
    let p; try { p = await sp.player(m); } catch (err) { if (err.code === 'signin') say(err.message, true); return; }
    clearTimeout(mus.timer);
    if (!p?.item) { if (mus.now) mus.now.playing = false; changed(); if (ranDry(m, null)) void start(); return; }
    const uri = p.item.uri, art = p.item.album?.images?.at(-1)?.url ?? p.item.album?.images?.[0]?.url ?? '';
    if (uri !== mus.now?.uri) { remember(m, uri); if (mus.now && !mus.lineup.includes(uri)) mus.why = []; }
    mus.now = { uri, name: p.item.name ?? '', artist: (p.item.artists ?? []).map(a => a.name).join(', '), art, ms: p.item.duration_ms ?? 0, progress: p.progress_ms ?? 0, started: Date.now() - (p.progress_ms ?? 0), playing: Boolean(p.is_playing), device: p.device?.name ?? '' };
    if (p.device?.id) { m.device = p.device.id; m.deviceName = p.device.name ?? ''; }
    const left = (p.item.duration_ms ?? 0) - (p.progress_ms ?? 0);
    if (ranDry(m, p)) { void start(); return; }
    if (p.is_playing && m.on && left > 0) mus.timer = setTimeout(() => void songEnding(), Math.max(1000, left - 3500));
    changed();
}
// The music stopped by itself (the line-up ran out while the page slept), not because you paused it: start again.
// A song stopped part-way through counts as paused by you, in Moodweaver or in Spotify, and is left alone.
function ranDry(m, p) {
    if (!m.on || mus.userPaused || mus.locked || !mus.lineup?.length || (Date.now() - (mus.cutAt ?? 0)) < 20000) return false;
    if (!p) return Boolean(mus.wasPlaying);
    if (p.is_playing) { mus.wasPlaying = true; return false; }
    const atEdge = (p.progress_ms ?? 0) <= 1500 || (p.item.duration_ms ?? 0) - (p.progress_ms ?? 0) <= 4000;
    return Boolean(mus.wasPlaying) && atEdge && mus.lineup.includes(p.item.uri);
}
// A few seconds before a song ends: if what's next in the line-up no longer suits the scene, start a fresh line-up
// so the next song is the best one for where the story is now.
async function songEnding() {
    const m = music(); if (!m.on || mus.locked) return sync();
    let p; try { p = await sp.player(m); } catch { return; }
    const left = (p?.item?.duration_ms ?? 0) - (p?.progress_ms ?? 0);
    if (!p?.is_playing || left > 8000) return sync();
    const snap = mus.latest ?? sceneNow(); if (!snap) return sync();
    const list = ranked(snap, m, [p.item.uri]); if (!list.length) return sync();
    const at = mus.lineup.indexOf(p.item.uri), planned = at >= 0 ? mus.lineup[at + 1] : null, plannedScore = list.find(x => x.uri === planned)?.score ?? -Infinity;
    if (planned && plannedScore >= list[0].score - 2) { setTimeout(() => void sync(), left + 1500); return; }
    const first = pick(list);
    setTimeout(async () => { try { await playList(m, lineup(list, first), first.why, snap, false); } catch (err) { say(err.message, true); } }, Math.max(0, left - 1200));
}

// ---- Buttons ----
export async function togglePlay() {
    const m = music();
    try { if (!mus.now) return start(); const d = await deviceFor(m); if (mus.now.playing) { mus.userPaused = true; mus.wasPlaying = false; await sp.pause(m, d.id); } else { mus.userPaused = false; await sp.resume(m, d.id); } updateAmbience(); setTimeout(() => void sync(), 600); }
    catch (err) { say(err.message, true); }
}
// Jump within the playing song: to a spot (ms), or by a step (−15 s, +15 s).
export async function seekTo(ms) {
    const m = music(), n = mus.now; if (!n?.ms) return;
    const at = Math.max(0, Math.min(n.ms - 2000, Math.round(ms)));
    try { const d = await deviceFor(m); await sp.seek(m, at, d.id); n.started = Date.now() - at; n.progress = at; changed(); setTimeout(() => void sync(), 800); } catch (err) { say(err.message, true); }
}
export const nowAt = () => { const n = mus.now; return n ? (n.playing ? Date.now() - n.started : n.progress ?? 0) : 0; };
export const seekBy = sec => seekTo(nowAt() + sec * 1000);
// ◆ Mark peak here: the playing song's peak becomes where it is now (saved in its tags and the sheet's Peak column).
export function markPeak() {
    const uri = mus.now?.uri; if (!uri) return;
    const sec = Math.max(1, Math.round(nowAt() / 1000)); setTag(uri, 'pk', String(sec));
    say(`Peak set at ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} for ${mus.now.name}. Change or clear it in ✎ Tags › Sting, peak and year.`);
}
export const nextBest = () => start(mus.now ? [mus.now.uri] : []);
// ↻ Re-roll, for when you come back after a while: forget the old scene and line-up, look for songs added to your
// lit playlists while SillyTavern was closed, read the last 6 messages again (scene kind,
// moods, heat, lyric cues) and start a fresh line-up with a different song from the one that was on.
// "This scene is…" you set yourself and lyric-cue rests are kept; ✕ Not here and Never during still count.
export async function reRoll() {
    const m = music(); if (!sp.signedIn(m)) return say('Sign in to Spotify first.', true);
    if (mus.busy) return; mus.busy = true;
    try {
        if (Object.entries(m.playlists).some(([id, p]) => p.on && p.owned && !id.startsWith('csv:'))) {
            mus.loading = 'Looking for new songs in your playlists…'; changed();
            try { await loadPlaylists(); } catch { /* offline: use the songs already here */ }
        }
        mus.story = null; mus.anchor = null; mus.lineup = []; mus.cues.clear(); mus.why = []; mus.lastFam = ''; mus.loading = '';
        if (mus.forced && mus.forced.chat !== ctx().chatId) mus.forced = null;
        await start(mus.now ? [mus.now.uri] : [], true, true);
        if (!mus.error) {
            const live = (mus.heard ?? []).filter(h => !h.resting && h.fits);
            const cueNote = !m.cues ? 'lyric cues are off' : live.length ? `cued: ${live[0].name}` : mus.heard?.length ? 'a cue was heard but its song is resting or doesn\'t fit this scene' : 'no lyric cues in the last 6 messages';
            const n = usableSongs(m).length;
            say(n < 15 ? `Only ${n} ${n === 1 ? 'song' : 'songs'} to choose from, so the scene can't pick well. ${poolText(m)} Open ✦ Playlists below and light the playlist with your songs (or import your song sheet again).`
                : `Re-rolled from the last 6 messages · ${n} songs · ${cueNote}.`);
        }
    } finally { mus.busy = false; mus.loading = ''; changed(); }
}
// Which playlists are lit and how many songs each gives, for when the pool is suspiciously small.
function poolText(m) {
    const lit = Object.entries(m.playlists).filter(([, p]) => p.on).map(([id, p]) => `${p.name}${p.gone ? ' (not found on Spotify)' : ''}: ${Object.values(m.songs).filter(s => s.pl?.includes(id)).length}`);
    const tagged = Object.keys(m.tags).filter(u => m.songs[u]).length;
    return `${lit.length ? `Lit: ${lit.join(', ')}.` : 'No playlist is lit.'} ${tagged} tagged songs are in your library.${mus.partial ? ` Spotify only sent ${mus.partial.got} of the ${mus.partial.total} songs in ${mus.partial.name}, so none were removed.` : ''}`;
}
// The kind of scene, said by you: holds for the next 6 replies (or until you tap Auto), then Moodweaver reads it again.
export function forceMode(mode) {
    mus.forced = mode ? { mode, left: 6, chat: ctx().chatId } : null;
    const m = music(); if (m.on && sp.signedIn(m)) void start(); else changed();
}
// ▶ on a song: you pick it. It plays now (whatever its rest or the scene) and holds until it ends, then the scene
// picks again from there.
export async function playChosen(uri) {
    const m = music(); if (!sp.signedIn(m)) return say('Sign in to Spotify first.', true);
    if (!m.songs[uri]) return;
    const snap = mus.latest ?? sceneNow() ?? snapshot({}), list = ranked(snap, m, [uri]);
    mus.chosen = uri;
    try { await playList(m, [uri, ...lineup(list, list[0] ?? null).filter(u => u !== uri)].slice(0, 12), ['you picked it'], snap, Boolean(mus.now)); m.on = true; save(); }
    catch (err) { mus.chosen = null; say(err.message, true); }
}
export function toggleLock() { mus.locked = !mus.locked; changed(); }
export async function setOn(on) { const m = music(); m.on = on; save(); updateAmbience(); if (on) { await sync(); if (!mus.now?.playing) await start(); poller(); } else { clearTimeout(mus.timer); try { const d = await deviceFor(m); await sp.pause(m, d.id); } catch { /* nothing playing */ } changed(); } }
// ✓ Fits and ✗ Not here: remember it for this kind of scene. Five ✗ in the same moment or heat add it to Never during.
export async function feedback(good) {
    const m = music(), uri = mus.now?.uri, snap = sceneNow() ?? mus.latest; if (!uri || !snap) return;
    mus.latest = snap;
    // ✗ Not here is final for this kind of scene: the song (and every other version of it, like a cover with the
    // same title) is never played in this kind of scene again. Undo it in the song's tags (Never during).
    if (!good) {
        const title = norm(String(m.songs[uri]?.n ?? mus.now?.name ?? '').replace(/\s*[-(\[].*$/, ''));
        const versions = Object.entries(m.songs).filter(([u, s]) => u === uri || (title && norm(String(s.n).replace(/\s*[-(\[].*$/, '')) === title)).map(([u]) => u);
        const never = [snap.mode ? `k:${snap.mode}` : '', snap.heat ? `h:${snap.heat}` : '', ...[...snap.moments].slice(0, 2).map(x => `mo:${x}`)].filter(Boolean);
        for (const u of versions) { const t = cleanTags(m.tags[u] ?? emptyTags()); t.nv = [...new Set([...t.nv, ...(snap.mode ? [`k:${snap.mode}`] : never)])]; m.tags[u] = t; }
        save(); say(`Noted: ${versions.length > 1 ? `no version of this song` : 'this song'} will play in ${snap.mode ? `a ${modeLabel(snap.mode)} scene` : 'scenes like this'} again. Finding something better…`);
        return start(versions);
    }
    const learn = m.learn[uri] ??= {};
    for (const k of learnKeys(snap)) {
        learn[k] = Math.max(-6, Math.min(3, (learn[k] ?? 0) + (good ? 1 : -1.5)));
        if (!good && learn[k] <= -6 && /^(mo|h):/.test(k)) { const t = cleanTags(m.tags[uri] ?? emptyTags()); if (!t.nv.includes(k)) { t.nv.push(k); m.tags[uri] = t; } }
    }
    // The song's sound (its Spotify genres) counts for this kind of scene too, so songs that sound like it rise.
    const g = m.songs[uri]?.g ?? [], kind = snap.mode || 'any', sound = m.sound[kind] ??= {};
    for (const x of g) { const k = norm(x); sound[k] = Math.max(-3, Math.min(4, (sound[k] ?? 0) + (good ? 1 : -0.5))); }
    save(); say(good ? 'Noted: it fits scenes like this, and songs that sound like it will come up more.' : 'Noted. Finding something better…');
    if (!good) await start([uri]);
}

// ---- Library ----
export async function loadPlaylists() {
    const m = music(); mus.loading = 'Reading your playlists…'; changed();
    try {
        const list = await sp.playlists(m), seen = new Set(['liked']);
        m.playlists.liked ??= { name: 'Liked Songs', on: false, owned: true, count: 0 };
        for (const p of list) { seen.add(p.id); m.playlists[p.id] = { ...(m.playlists[p.id] ?? { on: false }), name: p.name, owned: p.owned, count: p.count, snapNew: p.snap }; }
        // A lit playlist Spotify didn't list this time is kept (marked missing) rather than dropped, so its songs don't
        // silently vanish from the music; others that are gone are forgotten.
        for (const [id, p] of Object.entries(m.playlists)) if (!seen.has(id) && !id.startsWith('csv:')) { if (p.on && Object.values(m.songs).some(s => s.pl?.includes(id))) p.gone = true; else delete m.playlists[id]; }
        for (const id of seen) if (m.playlists[id]) delete m.playlists[id].gone;
        save(); await loadSongs();
    } catch (err) { mus.loading = ''; say(err.message, true); }
}
// The songs of every ticked playlist whose contents changed since last time.
export async function loadSongs() {
    const m = music(), todo = Object.entries(m.playlists).filter(([id, p]) => p.on && !p.gone && p.owned && !id.startsWith('csv:') && (id === 'liked' || p.snap !== p.snapNew || !Object.values(m.songs).some(s => s.pl?.includes(id))));
    let n = 0;
    try {
        for (const [id, p] of todo) {
            mus.loading = `Loading ${p.name} (${++n} of ${todo.length})…`; changed();
            const songs = await sp.songsOf(m, id);
            // Only trust the answer to say what LEFT the playlist when it's complete. Spotify sometimes sends back far fewer
            // songs than the playlist holds (the count it gave a moment ago): then new songs are added and none are removed.
            const had = Object.values(m.songs).filter(s => s.pl?.includes(id)).length, total = Number(p.count) || 0;
            const complete = songs.length > 0 && (!total || songs.length >= total * 0.9) && (songs.length >= had * 0.5 || had < 20);
            if (!complete) mus.partial = { name: p.name, got: songs.length, total: total || had };
            if (complete) for (const s of Object.values(m.songs)) if (s.pl?.includes(id)) s.pl = s.pl.filter(x => x !== id);
            for (const t of songs) { const old = m.songs[t.uri]; m.songs[t.uri] = { n: t.n, a: t.a, al: t.al, ms: t.ms, ...(old?.g ? { g: old.g } : {}), pl: [...new Set([...(old?.pl ?? []), id])] }; }
            if (complete) { p.snap = p.snapNew; p.count = songs.length; }
        }
        // Songs in no playlist and with no tags of their own are dropped.
        for (const [uri, s] of Object.entries(m.songs)) if (!(s.pl ?? []).length && !hasTags(m.tags[uri])) delete m.songs[uri];
        m.loadedAt = Date.now(); save(); mus.loading = ''; say(`${usableSongs(m).length} songs ready.`);
    } catch (err) { mus.loading = ''; save(); say(err.message, true); }
}
export function togglePlaylist(id) { const m = music(), p = m.playlists[id]; if (!p) return; p.on = !p.on; save(); changed(); if (p.on && p.owned && !id.startsWith('csv:') && sp.signedIn(m)) void loadSongs(); }

// ---- The song sheet ----
export function exportSheet() {
    const bytes = sheetFile(music(), characterNames()), blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Moodweaver song sheet ${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    say('Song sheet saved to your downloads.');
}
export async function importSheet(file) {
    const m = music();
    try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const tables = /\.csv$/i.test(file.name) || file.type === 'text/csv' ? { [file.name]: readCsv(new TextDecoder().decode(bytes)) } : await readXlsx(bytes);
        const got = readSheet(tables, m, characterNames(), file.name);
        if (got.newPlaylist) m.playlists[got.newPlaylist.id] ??= { name: got.newPlaylist.name, on: true, owned: true, count: 0, csv: true };
        for (const [uri, s] of Object.entries(got.newSongs)) { const old = m.songs[uri]; m.songs[uri] = { ...s, ...(old ?? {}), pl: [...new Set([...(old?.pl ?? []), ...(s.pl ?? [])])] }; }
        // Link each song back to the playlist named in its "From playlist" cell (your Spotify one first, else a sheet one),
        // so replacing the sheet never leaves songs outside your lit playlist.
        const plIds = name => Object.entries(m.playlists).filter(([, p]) => norm(p.name) === norm(name)).sort((a, b) => Number(b[0].startsWith('csv:') ? 0 : 1) - Number(a[0].startsWith('csv:') ? 0 : 1)).map(([id]) => id);
        for (const [uri, name] of Object.entries(got.songPl ?? {})) { const ids = plIds(name), s = m.songs[uri]; if (s && ids.length) s.pl = [...new Set([...(s.pl ?? []), ids[0]])]; }
        for (const [uri, g] of Object.entries(got.sound ?? {})) if (m.songs[uri]) { if (g.length) m.songs[uri].g = g; else delete m.songs[uri].g; }
        if (got.newPlaylist) m.playlists[got.newPlaylist.id].count = Object.values(m.songs).filter(s => s.pl?.includes(got.newPlaylist.id)).length;
        for (const [uri, t] of Object.entries(got.tags)) { if (hasTags(t) || t.note) m.tags[uri] = t; else delete m.tags[uri]; }
        for (const [id, t] of Object.entries(got.ptags)) { if (hasTags(t)) m.ptags[id] = t; else delete m.ptags[id]; }
        for (const [k, c] of Object.entries(got.chars)) m.chars[k] = { ...c, ...(m.chars[k]?.x ? { x: m.chars[k].x } : {}) }; // keeps the Extras ticks
        save();
        mus.lastImport = { at: Date.now(), file: file.name, songs: Object.keys(got.tags).length, added: Object.keys(got.newSongs).length, playlists: Object.keys(got.ptags).length, chars: Object.keys(got.chars).length, unknown: [...got.unknown].slice(0, 12), unmatched: got.unmatched.slice(0, 8) };
        say(`Imported ${file.name}.`);
    } catch (err) { say(`Couldn’t read that file: ${err.message}`, true); }
}
export function setTag(uri, kind, value) {
    const m = music(), t = cleanTags(m.tags[uri] ?? emptyTags());
    if (['f', 'p', 'mo', 'd', 'c', 'nv', 'cm', 'st'].includes(kind)) t[kind] = t[kind].includes(value) ? t[kind].filter(x => x !== value) : [...t[kind], value];
    else if (kind === 'h') t.h = t.h === value ? '' : value;
    else if (kind === 'e') t.e = t.e === Number(value) ? 0 : Number(value);
    else if (['th', 'fav', 'off'].includes(kind)) t[kind] = !t[kind];
    else if (kind === 'm') t.m = String(value).split(',').map(s => norm(s)).filter(Boolean).map(s => MOOD_LIST.find(x => norm(x.label) === s || x.id === s)?.id).filter(Boolean);
    else if (kind === 'cue') t.cue = String(value).split(',');
    else if (kind === 'cw') t.cw = String(value).split(/[,\s]+/);
    else if (kind === 'pk') t.pk = value;
    else if (kind === 'yr') t.yr = value;
    m.tags[uri] = cleanTags(t); save(); changed();
}

// ---- Sign-in ----
export async function finishSignIn(text) {
    const m = music();
    try { await sp.finishSignIn(m, text); save(); say('Signed in to Spotify.'); await loadPlaylists(); }
    catch (err) { save(); say(err.message, true); }
}
// The page came back from Spotify by itself (SillyTavern at 127.0.0.1 or https).
export async function checkReturn() {
    const back = sp.returnedCode(); if (!back) return;
    const m = music(), got = sp.codeFrom(back);
    if (!got?.state || (m.pending?.state !== got.state && !(() => { try { return JSON.parse(localStorage.getItem('moodweaver-spotify-signin') ?? '{}').state === got.state; } catch { return false; } })())) return;
    sp.clearReturn(); await finishSignIn(back);
}
export function signOut() { const m = music(); sp.signOut(m); mus.now = null; clearTimeout(mus.timer); save(); changed(); }

// A gentle check every 45 seconds while music is on and the page is open, in case you changed songs in Spotify.
export function poller() {
    clearInterval(mus.poll);
    mus.poll = setInterval(() => { if (music().on && document.visibilityState === 'visible' && sp.signedIn(music())) void sync(); }, 45000);
}
export function initMusic() {
    music(); poller();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && music().on && sp.signedIn(music())) void sync(); });
    void checkReturn().then(() => { if (music().on && sp.signedIn(music())) void sync(); });
}
// Settings › Music: what the story is told about the music, at the end of the note. Two switches:
//   feel: a few words for the music's feel, never its name (about 15 tokens).
//   tell: the song itself, title and artist whatever the story's era, to score the scene by: never quoted, named
//         or heard by anyone, and only for the first replies of each song (tellFor: 1, 2 or 3; 0 = while it plays),
//         so one song can't hold the story in one place.
const ENERGY_WORDS = ['', 'hushed', 'slow', 'steady', 'driving', 'frantic'];
const FAMILY_WORDS = { happy: 'bright', bold: 'swaggering', closeness: 'tender', attachment: 'yearning', cold: 'cold', sad: 'melancholy', scared: 'uneasy', angry: 'harsh', cruel: 'menacing', calm: 'calm', masks: 'guarded', energy: 'restless', headspace: 'dreamlike', desire: 'sultry' };
export function musicLine() {
    const m = music();
    // In-story radio: the opposite of a film score. The characters hear it, so Claude is told what's on.
    if (m.on && mus.now?.playing && radioOn(m) && !mus.radio.empty) {
        const yr = cleanTags(m.tags[mus.now.uri] ?? {}).yr;
        return `Music in the scene: ${mus.radio.kind} is playing "${mus.now.name}" by ${mus.now.artist || 'unknown'}${yr ? ` (${yr})` : ''}. Everyone present can hear it. It can be noticed, mentioned, hummed, danced to or switched off when that fits, but it doesn't take over the scene. Don't quote its lyrics.`;
    }
    if ((!m.feel && !m.tell) || !m.on || !mus.now?.playing) return '';
    const t = usableSongs(m).find(s => s.uri === mus.now.uri)?.tags;
    const words = t ? [ENERGY_WORDS[t.e] ?? '', ...t.f.slice(0, 2).map(f => FAMILY_WORDS[f])].filter(Boolean) : [];
    let tellIt = false;
    if (m.tell && mus.now.name) {
        // Count the replies this song has been told for (a swipe of the same reply doesn't count again).
        const at = (ctx().chat ?? []).length;
        if (mus.told?.uri !== mus.now.uri) mus.told = { uri: mus.now.uri, replies: [] };
        if (!mus.told.replies.includes(at)) mus.told.replies.push(at);
        tellIt = !Number(m.tellFor) || mus.told.replies.indexOf(at) < Number(m.tellFor);
    }
    if (tellIt) return `Scene score: "${mus.now.name}" by ${mus.now.artist || 'unknown'} is underscoring this moment${words.length ? ` (${words.join(', ')})` : ''}. Let its mood, pace and imagery colour the prose the way a film score shapes a scene. Never quote or paraphrase its lyrics, never name the song, and no one in the story hears it, whatever the era. The story keeps moving: don't hold the scene in place for the music.`;
    return m.feel && words.length ? `Underscore under this scene (a soundtrack, never mention it or any music): ${words.join(', ')}.` : '';
}
export { describe, ui };
