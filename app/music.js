// Music: your Spotify songs, picked for the scene by plain code (engine/music.js) and played on your Spotify.
// Runs after each reply (afterReply), at the end of each song (a timer) and when you tap in the Music tab.
// Nothing here is sent to Claude unless Settings \u203a "Let the story feel the music" is on.
import { PUBLIC_PLACES as CAT_PUBLIC } from '../data/catalogue/music.js';
import { getCast, getState, getUserState, playerName, target } from './chat.js';
import { bondAxes, bondData, bondList, liveFor } from './replies.js';
import { KEY, ctx, run, ui } from './state.js';
import { BY_ID } from '../data/catalogue.js';
import { computeBond } from '../engine/bond.js';
import { GOOD_ENOUGH, MODES, MOOD_LIST, cleanTags, cueHits, describe, emptyTags, hasTags, learnKeys, lineup, mergeTags, norm, pick, rank, shiftOf, snapshot } from '../engine/music.js';
import { readSheet, sheetFile } from '../engine/sheet.js';
import { readCsv, readXlsx } from '../engine/xlsx.js';
import { shortName } from '../engine/util.js';
import { pronounOf } from '../engine/pronouns.js';
import { BEATS, SCENE_WORDS, beatsIn, plainStory, radioIn, radioKind } from '../engine/scene-words.js';
import { VENUE_BY_ID, artistMatch, fitsVenue, searchesFor, venueNow } from '../engine/venues.js';
import * as amb from './ambience.js';
import * as sp from './spotify.js';

const DEFAULTS = { on: false, clientId: '', redirect: '', auth: null, pending: null, playlists: {}, songs: {}, tags: {}, ptags: {}, chars: {}, learn: {},
    follow: 'char', change: 'big', sound: {}, hold: 120, fade: true, themes: 'big', feel: false, tell: false, tellFor: 2, cues: true, cueAt: {}, tagEdited: {}, removed: {}, bundle: '', ambLevel: 2, stingAt: {}, peaks: {}, device: '', deviceName: '', recent: [], loadedAt: 0 };
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
    m.ambPlaces = m.ambPlaces !== false; m.ambSex = m.ambSex !== false; m.venues = m.venues !== false;
    return m;
}
// ---- Extras ----
// Crossfade, stings, peaks, ambience and the in-story radio. Each can be off, on for everyone, or on only for the
// characters ticked for it (saved with that character, so it follows them into every chat).
export const EXTRAS = [
    { id: 'fade', label: 'Crossfade', note: 'A changing song fades out and the new one fades in, instead of a hard cut.' },
    { id: 'sting', label: 'Stings', note: 'A big beat in the newest reply (a slap, a gunshot, a door kicked in, \u201cI love you\u201d, a death, a first kiss, a reveal) cuts straight to a song tagged for it, once, whatever the hold time.' },
    { id: 'peak', label: 'Start at the peak', note: 'When a scene is already at full tilt, or a sting hits, the new song starts at its chorus or drop instead of its intro.' },
    { id: 'amb', label: 'Ambience', note: 'Quiet sounds under the music, all picked by themselves from the place facts or, without them, from where the last few messages put you: rain or a storm; real recordings of a bar, a busy bar or club, a caf\u00e9 or restaurant, a cafeteria, a diner, outside by the road, a dorm, a quiet house, a bedroom, a campus by day or night, a hospital room, the sea, a windy clifftop or rooftop, the woods, a camp at nightfall, a junkyard, a motel at night, a carnival, the city after dark and an old stone hall; an office hum, a basement, a fire, the road, a train, a shower, a dripping cellar, street traffic, a ticking clock, birdsong by day and crickets at night, a camera clicking when one is in use, a facility\u2019s vents, live wires buzzing, a distant alarm, a heartbeat when it\u2019s frightening, breathing in any heat, and during sex whatever they\u2019re on (a creaking bed, an office chair, a desk, a wall, a car, a couch, the floorboards) plus wet, slick sounds, skin slapping when it\u2019s rough, fingers, grinding, spanking or a whip when the story names them, and her moans when one of you is a she, each its own layer, all in time with how fast they\u2019re moving. Big moments in a new reply (a slap, a door slamming, a zap, a gunshot, breaking glass, a clang of metal, thunder, a flatline, a drill) play once on top. It has its own line on the Music tab and plays with or without Spotify, even while the music is paused. It plays on the phone or computer you have SillyTavern open on: on iPhone any tap starts it, and the ringer switch must be off silent.' },
    { id: 'radio', label: 'In-story radio', note: 'When the story turns on a radio, jukebox or record player, the music becomes what they can hear: songs from the story\u2019s era, and Claude is told what\u2019s playing so the characters can react to it. Venues do the same by themselves: a club, a jazz bar, a cocktail bar, a dance, a party or a gig plays what would be on there, from your playlists when their genres fit and from Spotify search for the rest (in the story\u2019s era), or the band named at a gig. Leaving the venue, or a sex scene, brings the film score back.' },
];
const EXTRA_DEFAULTS = { fade: 'all', sting: 'all', peak: 'all', amb: 'off', radio: 'all' };
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
export function toggleVenues() { const m = music(); m.venues = !m.venues; if (!m.venues && mus.radio?.venue) mus.radio = null; save(); changed(); }
export function toggleAmbKind(kind) { const m = music(), k = kind === 'sex' ? 'ambSex' : 'ambPlaces'; m[k] = m[k] === false; save(); updateAmbience(); changed(); }
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
    // \u21bb Re-roll reads it too, whatever the music follows.
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
    // A tagged song whose playlists are all gone (deleted, renamed away, or never loaded) still counts, like a sheet song,
    // as long as the playlist it came from (by name) is lit.
    return Object.entries(m.songs).filter(([uri, s]) => (s.pl ?? []).some(id => on.has(id)) || (hasTags(m.tags[uri]) && !(s.pl ?? []).some(id => m.playlists[id]) && (!s.pln || [].concat(s.pln).some(n => litNames.has(norm(n))))))
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
    // A new reply: the newest reply and your last message. \u21bb Re-roll (deep): the last 6 messages, yours and theirs, so a
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
// \u21bb Re-roll always takes it. The 3-hour rest after it plays is what stops it coming back again and again.
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
    // Songs you skipped in the last half hour sit out, unless that would leave nothing to play.
    const skipped = skippedNow(), all = usableSongs(m).filter(s => !exclude.includes(s.uri)), rest = all.filter(s => !skipped.has(s.uri));
    const songs = rest.length >= 3 ? rest : all, recent = new Set(m.recent.slice(-20));
    let list = rank(songs, snap, { recent, themeOn: m.themes, sound: m.sound, cued: cuedNow(m), radio: radioOn(m) });
    // In-story radio: only songs from the story's era or earlier (by the sheet's Year), still in order of fit.
    if (radioOn(m) && !mus.radio.venue) {
        const end = eraEnd(), year = new Map(songs.map(s => [s.uri, s.tags.yr]));
        const period = list.filter(x => year.get(x.uri) && (!end || year.get(x.uri) <= end));
        mus.radio.empty = !period.length; if (period.length) list = period;
        // 1.89: songs you marked Heard in \u203a Radio (or Car stereo, in a car) come first.
        const want = /car/.test(mus.radio.kind ?? '') ? ['car', 'radio'] : ['radio'], heard = new Set(songs.filter(s => s.tags.dg?.some(d => want.includes(d))).map(s => s.uri));
        if (heard.size) list = [...list.filter(x => heard.has(x.uri)), ...list.filter(x => !heard.has(x.uri))];
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
// ---- Venue music (1.88.1) ----
// The venue the scene is in, when venue music is on and the scene isn't sex (the film score takes that back).
function venueHere(snap, m = music()) {
    if (!extraOn('radio', m) || m.venues === false || snap?.heat === 'sex') return null;
    return venueNow(snap?.places ?? new Set(), recentStory(6));
}
// A line-up for the venue: your fitting songs, then real tracks from Spotify search (cached for the session per venue,
// era and artist), never the last 20 played. A named artist leads with their own songs.
async function venueLineup(m, v, exclude = []) {
    const end = eraEnd(), recent = new Set([...m.recent.slice(-20), ...exclude]), shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
    const inEra = yr => !end || !yr || yr <= end;
    // 1.89: songs you marked Heard in for this kind of place lead, then songs whose genres fit it.
    const pool = usableSongs(m).filter(s => !recent.has(s.uri) && inEra(s.tags?.yr));
    const heardHere = v.artist ? [] : pool.filter(s => s.tags?.dg?.includes(v.id)).map(s => s.uri);
    const own = [...heardHere, ...pool.filter(s => !heardHere.includes(s.uri) && (v.artist ? artistMatch(s.a ?? m.songs[s.uri]?.a, v.artist) : fitsVenue(s.g, v.id))).map(s => s.uri)];
    const key = `${v.id}|${v.artist}|${end}`; mus.venueCache ??= new Map(); mus.extra ??= new Map();
    let found = mus.venueCache.get(key);
    if (!found || found.filter(t => !recent.has(t.uri)).length < 6) {
        found = [];
        for (const q of searchesFor(v.id, v.artist, end)) {
            try { found.push(...(await sp.searchTracks(m, q, v.artist ? 3 : 2))); } catch (err) { if (err.code === 'slow') break; }
            if (found.length >= 60) break;
        }
        found = [...new Map(found.filter(t => inEra(t.yr) && (!v.artist || artistMatch(t.a, v.artist))).map(t => [t.uri, t])).values()];
        mus.venueCache.set(key, found);
    }
    for (const t of found) mus.extra.set(t.uri, t);
    const searched = shuffle(found.filter(t => !recent.has(t.uri)).map(t => t.uri)), mine = [...shuffle(heardHere), ...shuffle(own.slice(heardHere.length))];
    // Mostly your songs when you have plenty, with search mixed in so it never runs dry.
    // With plenty of your own Heard in songs for this place, search only fills in when they run out.
    const plenty = heardHere.length >= 8;
    const out = []; while ((mine.length || searched.length) && out.length < 15) { if (mine.length) out.push(mine.shift()); if (searched.length && (!mine.length || v.artist || (!plenty && out.length % 3 === 2))) out.push(searched.shift()); }
    return [...new Set(out)].slice(0, 15);
}
async function venuePlay(m, snap, exclude = []) {
    const v = mus.radio, uris = await venueLineup(m, { id: v.venue, artist: v.artist }, exclude);
    if (!uris.length) { mus.radio.empty = true; return false; }
    mus.radio.empty = false;
    try { await playList(m, uris, [v.artist ? `${v.artist} at the gig` : VENUE_BY_ID[v.venue]?.label ?? 'music in the room'], snap, Boolean(mus.now)); m.on = true; save(); } catch (err) { say(err.message, true); }
    return true;
}
// The last year of the story's era (era_1960s\u2026 \u2192 1969), from either of you; 0 when no era is set.
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
// 1.88.4: sex sounds only for sex happening now. A sentence that's imagined, wished, remembered or hypothetical doesn't
// count, and in a public place it takes two sentences of plain sex in the last two messages.
const IMAGINED = /\b(?:imagin\w*|fantas\w*|daydream\w*|pictur(?:es|ed|ing)|envision\w*|dream(?:s|ed|ing|t)?|would|could|might|wants? to|wanted to|wish(?:es|ed)?|if only|what it would|what it'd|remember(?:s|ed|ing)?|memor(?:y|ies)|recall\w*|thinks? (?:about|of)|thought (?:about|of)|thinking (?:about|of)|in (?:his|her|their|my) (?:head|mind)|(?:his|her|their|my) mind|mind (?:wanders|wandered|drifts|drifted|goes|went)|later tonight|someday|one day|longs? to|craves?|craved|aches? to|ached to|tempted)\b/i;
const SEX_ACT = new RegExp(SCENE_WORDS.sex[0][1].source + '|\\b(?:moan(?:s|ed|ing)?|undress(?:es|ed|ing)?|naked|on top of (?:her|him)|hips (?:roll|rolled|buck|bucked|snap|snapped|stutter)|rock(?:s|ed|ing)? into (?:her|him))', 'i');
const PUBLIC_BEDS = new Set(['bar', 'barbusy', 'cafe', 'cafeteria', 'diner', 'restaurant', 'crowd', 'campus', 'campusnight', 'lobby', 'messhall', 'schoolhall', 'carnival', 'roadside', 'clubout', 'city', 'darkcity', 'waves', 'meadow', 'train', 'hospital', 'ward', 'chantry']);
const PUBLIC_PLACES = new Set(CAT_PUBLIC);
const realSentences = texts => texts.flatMap(t => String(t).split(/(?<=[.!?\u2026"\u201d])\s+|\n+/)).filter(x => x.trim() && !IMAGINED.test(x));
export function ambienceBeds(snap = mus.latest, m = music()) {
    if (!extraOn('amb', m) || mus.ambPaused) return [];
    const places = snap?.places ?? new Set(), texts = recentStory(6), beds = [];
    const near2 = realSentences(texts.slice(0, 2)), said = re => near2.some(t => re.test(t));
    const spot = [...places].map(p => amb.PLACE_BEDS[p]).find(Boolean) ?? newestHit(amb.PLACE_WORDS, texts.slice(0, 4))?.[0];
    const inPublic = [...places].some(p => PUBLIC_PLACES.has(p)) || PUBLIC_BEDS.has(spot);
    const sexNow = snap?.heat === 'sex' && near2.filter(t => SEX_ACT.test(t)).length >= (inPublic ? 2 : 1);
    // Warmth you can hear (wet, fingers, grinding\u2026): heat plus the words in a real sentence, never in public unless sex is happening.
    const heatNow = Boolean(snap?.heat) && (!inPublic || sexNow);
    // During sex, what they're on goes first: the newest of the last 3 messages to name it, else the place.
    if (sexNow) { const on = newestHit(amb.LOVE_WORDS, [realSentences(texts.slice(0, 3)).join(' ')])?.[0] ?? [...places].map(p => amb.LOVE_PLACES[p]).find(Boolean) ?? amb.LOVE_SPOTS[spot]; if (on) beds.push(on); }
    // The bodies: skin on skin when it's rough or fast (the words, or the scene running hot), breath in any heat,
    // a heartbeat when it's frightening and fast or the story names one. All keep time with the scene's energy.
    // Wet and skin are separate layers (1.83): wet in any sex scene, under the furniture; slaps join when it's rough or fast.
    const pace = (snap?.energy ?? 3) + amb.paceNudge(near2);
    if (sexNow || (heatNow && said(amb.MORE_WORDS.wet))) beds.push('wet');
    if (sexNow && (pace >= 4 || said(amb.MORE_WORDS.skin))) beds.push('skin');
    // 1.85: acts with their own layer when the last 2 messages name them (fingers, grinding, spanking, a whip or belt),
    // and her voice in sex when you or the character is a she.
    if (heatNow) for (const act of ['fingers', 'rub', 'spank', 'whip']) if (said(amb.MORE_WORDS[act])) beds.push(act);
    if (sexNow && [playerName(), ctx().name2].some(n => n && pronounOf(n) === 'she')) beds.push('voice');
    // Breathing (1.88.2): in sex, or when the last 2 messages say someone is panting or gasping. Not just for any warmth:
    // under a bar's voices it was a constant whoosh.
    // 1.88.3: her own recordings, so only when you or the character is a she, in runs that swell and fade.
    const she = [playerName(), ctx().name2].some(n => n && pronounOf(n) === 'she');
    if (she && heatNow && said(amb.MORE_WORDS.breath)) beds.push('breath'); else if (she && sexNow) beds.push('breathlow');
    if ((snap?.mode === 'danger' && (snap?.energy ?? 3) >= 4) || said(amb.MORE_WORDS.heart)) beds.push('heart');
    // Weather: the board's facts, else rain or a storm in the last 6 messages (until someone says it stopped).
    const stop = texts.findIndex(t => amb.WEATHER_STOP.test(t)), sky = newestHit(amb.WEATHER_WORDS, texts);
    if (places.has('stormy')) beds.push('storm'); else if (places.has('raining')) beds.push('rain');
    else if (sky && (stop < 0 || sky[1] < stop)) beds.push(sky[0]);
    // The place: a place fact first, else the place the last 4 messages most recently put them in.
    const where = [...places].map(p => amb.PLACE_BEDS[p]).find(Boolean) ?? newestHit(amb.PLACE_WORDS, texts.slice(0, 4))?.[0];
    const place = snap?.night && amb.NIGHT_BEDS[where] && !(where === 'fire' && !OUTSIDE.has([...places].find(p => amb.PLACE_BEDS[p] === 'fire') ?? 'campfire')) ? amb.NIGHT_BEDS[where] : where;
    if (place) beds.push(place);
    // Indoors, rain is a soft wash on the windows rather than a downpour on top of the room (1.88.2).
    if (place && !amb.OUTDOOR_BEDS.has(place) && beds.includes('rain')) beds.splice(beds.indexOf('rain'), 1, 'rainin');
    // A facility under it all (a facility place, or the last 4 messages put them in one), live wires, an alarm.
    if ([...places].some(p => amb.VENT_PLACES.has(p)) || texts.slice(0, 4).some(t => amb.MORE_WORDS.vent.test(t))) beds.push('vent');
    if (texts.slice(0, 3).some(t => amb.MORE_WORDS.buzz.test(t))) beds.push('buzz');
    if (said(amb.MORE_WORDS.alarm)) beds.push('alarm');
    // Crackle only for a real radio or record (1.88.2), never a band, a DJ or a venue.
    if (radioOn(m) && !mus.radio.venue && /radio|record|phonograph|gramophone|wireless|transistor/.test(mus.radio.kind ?? '')) beds.push('crackle');
    // Layers on top: a camera (a darkroom, a studio or a camera in the last 3 messages), a clock,
    // birds by day, crickets at night outdoors.
    const near = texts.slice(0, 3), has = id => amb.LAYER_WORDS.find(([k]) => k === id)[1];
    if (places.has('darkroom') || places.has('photo_studio') || near.some(t => has('camera').test(t))) beds.push('camera');
    if (near.slice(0, 2).some(t => has('clock').test(t))) beds.push('clock');
    const outside = ([...places].some(p => OUTSIDE.has(p)) || ['wind', 'waves', 'fire'].includes(place)) && !amb.LOOPS[place];
    if (!snap?.night && near.some(t => has('birds').test(t)) && !beds.includes('storm')) beds.push('birds');
    if (snap?.night && outside && !beds.includes('rain') && !beds.includes('storm')) beds.push('crickets');
    // 1.88: everyday and erotic sounds can each be switched off.
    return [...new Set(beds)].filter(b => amb.EROTIC_BEDS.has(b) ? m.ambSex !== false : m.ambPlaces !== false).slice(0, amb.MAX_BEDS);
}
// Ambience runs on its own line (1.83): with or without Spotify, whether the music is playing or paused. It has its
// own pause (mus.ambPaused, this session only). After each reply it re-reads the scene, and plays one-off sounds
// for what just happened in the newest reply (a slap, a door, a zap): once, never on a swipe or an edit.
function ambienceAfterReply(m) {
    if (!extraOn('amb', m)) { amb.setBeds([]); return; }
    const snap = sceneNow(); if (!snap) return;
    mus.latest = snap; updateAmbience(snap);
    const chat = ctx().chat ?? [], last = chat.at(-1), mark = `${ctx().chatId}|${chat.length}|${last?.send_date ?? ''}|${last?.swipe_id ?? 0}`, same = `${ctx().chatId}|${chat.length}`;
    const fresh = Boolean(mus.ambMark) && !mus.ambMark.startsWith(same + '|'); mus.ambMark = mark;
    if (fresh && !last?.is_user && !mus.ambPaused) { const said = realSentences([plainStory(last?.mes ?? '')]).join(' '); amb.oneShots(amb.SHOT_WORDS.filter(([id, re]) => re.test(said) && ((snap.heat && ['slap', 'whip'].includes(id)) ? m.ambSex !== false : m.ambPlaces !== false)).map(([id]) => id)); }
}
export function toggleAmbience() { mus.ambPaused = !mus.ambPaused; if (!mus.ambPaused) { amb.unlock(); mus.latest ??= sceneNow(); } updateAmbience(); changed(); }
export function updateAmbience(snap = mus.latest) { try { const m = music(); amb.setBeds(ambienceBeds(snap, m), m.ambLevel, snap?.energy ?? 3, amb.paceNudge(recentStory(2))); } catch { /* no sound here */ } }
export const unlockSound = () => { amb.unlock(); updateAmbience(); };

// ---- Playing ----
const deviceFor = async m => {
    const list = await sp.devices(m); mus.devices = list;
    const chosen = list.find(d => d.id === m.device) ?? list.find(d => d.is_active) ?? list[0];
    if (!chosen) throw Object.assign(new Error('Open Spotify on your phone or computer, play anything for a second, then tap \u25b6 again.'), { code: 'device' });
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
    const s = m.songs[uris[0]] ?? mus.extra?.get(uris[0]);
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
    if (mus.radio?.venue && radioOn(m) && await venuePlay(m, snap, exclude)) return;
    const list = ranked(snap, m, exclude);
    if (!list.length) return say('No songs yet: tick a playlist and tap Load songs, or import a song sheet.', true);
    const first = pickCued(list, null, sure ? 1 : CUE_CHANCE) ?? pick(list);
    const at = sure && fullTilt(snap) && extraOn('peak', m) ? await peakMs(m, first.uri) : 0;
    try { await playList(m, lineup(list, first), at ? [...first.why, 'started at its peak'] : first.why, snap, Boolean(mus.now), at); m.on = true; save(); }
    catch (err) { say(err.message, true); }
}
// After each reply: decide whether this is a real shift worth cutting the song for.
export async function afterReply() {
    const m = music(); if (run.suspended) return;
    ambienceAfterReply(m);
    if (!m.on || !sp.signedIn(m)) return;
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
    // Venue music: arriving at a venue (or the band named at a gig changing) switches to what's playing there; leaving
    // it, or the scene turning to sex, brings the film score back. While in the venue its line-up plays on.
    const venue = venueHere(snap, m), vKey = venue ? `${venue.id}|${venue.artist}` : '', wasVenue = mus.radio?.venue && radioOn(m) ? mus.radio.key : '';
    if (vKey !== wasVenue) {
        if (venue) { mus.radio = { chat: ctx().chatId, kind: venue.artist ? `${venue.artist}, live on stage,` : VENUE_BY_ID[venue.id].label, left: Infinity, venue: venue.id, artist: venue.artist, key: vKey }; if (await venuePlay(m, snap)) retu