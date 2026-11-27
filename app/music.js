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
import { BEATS, SCENE_WORDS, beatsIn, plainStory, radioIn, radioKind, songMention } from '../engine/scene-words.js';
import { VENUE_BY_ID, artistMatch, fitsVenue, searchesFor, venueNow } from '../engine/venues.js';
import { fitsMode } from '../engine/music.js';
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
    { id: 'amb', label: 'Ambience', note: 'Quiet sounds under the music, all picked by themselves from the place facts or, without them, from where the last few messages put you: rain or a storm; real recordings of a bar, a busy bar or club, a caf\u00e9 or restaurant, a cafeteria, a diner, outside by the road, a dorm, a quiet house, a bedroom, a campus by day or night, a hospital room, the sea, a windy clifftop or rooftop, the woods, a camp at nightfall, a junkyard, a motel at night, a carnival, the city after dark and an old stone hall; an office hum, a basement, a fire, the road, a train, a shower, a running tap, a bath running, a scuffle, creaking footsteps, a rocking chair, someone shifting in bed, someone pulling at restraints, a truck\u2019s springs over bumps, a dripping cellar, street traffic, a ticking clock, birdsong by day and crickets at night, a camera clicking when one is in use, a facility\u2019s vents, live wires buzzing, a distant alarm, a heartbeat when it\u2019s frightening, breathing in any heat, and during sex whatever they\u2019re on (a creaking bed, an office chair, a desk, a wall, a car, a couch, the floorboards) plus wet, slick sounds, skin slapping when it\u2019s rough, fingers, grinding, spanking or a whip when the story names them, kissing, him or her touching themselves, a creaking toilet seat, and someone peeing (these with the erotic sounds), and her moans when one of you is a she, each its own layer, all in time with how fast they\u2019re moving. Big moments in a new reply (a slap, a door slamming, a zap, a gunshot, breaking glass, a clang of metal, thunder, a flatline, a drill, a knock at the door, a punch, someone shoved into a wall, a toilet flushing, a splash, a zip, a belt unbuckled, someone dropping onto a bed or couch, a chair taking weight) play once on top. It has its own line on the Music tab and plays with or without Spotify, even while the music is paused. It plays on the phone or computer you have SillyTavern open on: on iPhone any tap starts it, and the ringer switch must be off silent.' },
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
// 1.91.6 In-story music only: Spotify plays only what the characters can hear (a radio, jukebox, record player or
// a venue's own music). The rest of the time it is paused, not scoring the scene. Ambience carries on as usual.
export const storyOnly = (m = music()) => Boolean(m.storyOnly) && extraOn('radio', m);
const QUIET_NOTE = 'In-story music only: nothing is playing in the story right now, so the music is paused. It comes back when a radio, jukebox, record player or a venue\u2019s music does.';
async function hush(m) {
    mus.hushed = true; mus.hushedAt = Date.now();
    if (mus.now?.playing) { try { const d = await deviceFor(m); mus.wasPlaying = false; await sp.pause(m, d.id); mus.now.playing = false; } catch (err) { say(err.message, true); return; } }
    say(QUIET_NOTE); changed();
}
export function toggleStoryOnly() {
    const m = music(); m.storyOnly = !m.storyOnly;
    if (m.storyOnly && (m.extras.radio ?? 'off') === 'off') m.extras.radio = 'all';
    save(); changed();
    if (m.storyOnly && m.on && !radioOn(m)) { const v = venueHere(mus.latest ?? sceneNow(), m); if (v) void start(); else void hush(m); }
    else if (!m.storyOnly && mus.hushed) { mus.hushed = false; if (m.on) void start(); }
}
function enterVenue(venue) { mus.radio = { chat: ctx().chatId, kind: venue.artist ? `${venue.artist}, live on stage,` : VENUE_BY_ID[venue.id].label, left: Infinity, venue: venue.id, artist: venue.artist, key: `${venue.id}|${venue.artist}` }; }
export function setMix(v) { const m = music(); m.mix = MIX[v] ? v : 'mine'; save(); mus.venueCache = new Map(); changed(); }
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
// With In-story music only on, a radio or jukebox nobody mentions again goes quiet sooner (1.95.1).
const RADIO_REPLIES = 6, STORY_RADIO_REPLIES = 4, STING_REST = 10 * 60 * 1000;
export const radioOn = (m = music()) => Boolean(mus.radio && mus.radio.chat === ctx().chatId && extraOn('radio', m));
// ---- Venue music (1.88.1) ----
// The venue the scene is in, when venue music is on and the scene isn't sex (the film score takes that back).
function venueHere(snap, m = music()) {
    if (!extraOn('radio', m) || m.venues === false || snap?.heat === 'sex') return null;
    return venueNow(snap?.places ?? new Set(), recentStory(6));
}
// A line-up for the venue: your fitting songs, then real tracks from Spotify search (cached for the session per venue,
// era and artist), never the last 20 played. A named artist leads with their own songs.
// Your songs and Spotify's, in turns (1.95, Music settings \u203a In-story radio \u203a Mix): mine is 3 of yours to 1
// found, half is one each, search is 1 of yours to 3 found. Either side fills in when the other runs out.
const MIX = { mine: [3, 1], half: [1, 1], search: [1, 3] };
function interleave(mine, found, mix = 'mine', n = 15) {
    const [a, b] = MIX[mix] ?? MIX.mine, out = [];
    while ((mine.length || found.length) && out.length < n) {
        for (let i = 0; i < a && mine.length; i++) out.push(mine.shift());
        for (let i = 0; i < (mine.length ? b : n); i++) { if (!found.length) break; out.push(found.shift()); }
        if (!mine.length && !found.length) break;
    }
    return [...new Set(out)].slice(0, n);
}
// A line-up for the venue (or the radio, or a jukebox): your fitting songs, then real tracks from Spotify search (cached
// for the session per venue, era and artist), never the last 20 played. A named artist leads with their own songs.
async function venueLineup(m, v, exclude = [], snap = null) {
    const end = eraEnd(), recent = new Set([...m.recent.slice(-20), ...exclude]), shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
    const inEra = yr => !end || !yr || yr <= end;
    // 1.89: songs you marked Heard in for this kind of place lead, then songs whose genres fit it. 1.95: songs that suit
    // the scene come first (no song is ever banned: only the era and the fit decide).
    const pool = usableSongs(m).filter(s => !recent.has(s.uri) && inEra(s.tags?.yr));
    const heardIn = v.id === 'radio' ? ['radio', 'car'] : v.id === 'jukebox' ? ['radio', 'cocktail'] : [v.id];
    const heardHere = v.artist ? [] : pool.filter(s => s.tags?.dg?.some(d => heardIn.includes(d))).map(s => s.uri);
    let own = [...heardHere, ...pool.filter(s => !heardHere.includes(s.uri) && (v.artist ? artistMatch(s.a ?? m.songs[s.uri]?.a, v.artist) : fitsVenue(s.g, v.id))).map(s => s.uri)];
    if (snap?.mode && !v.artist) { const tagsOf = new Map(pool.map(s => [s.uri, s.tags])), fit = own.filter(u => fitsMode(tagsOf.get(u) ?? emptyTags(), snap.mode, snap)); if (fit.length >= 4) own = [...fit, ...own.filter(u => !fit.includes(u))]; }
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
    const searched = shuffle(found.filter(t => !recent.has(t.uri)).map(t => t.uri));
    // Heard in songs keep their order of fit; the rest are shuffled so each visit sounds different.
    const fitFirst = snap?.mode && !v.artist ? own : [...shuffle(heardHere), ...shuffle(own.slice(heardHere.length))];
    const mix = v.artist ? 'half' : (heardHere.length >= 8 && (m.mix ?? 'mine') === 'mine' ? 'mine' : m.mix ?? 'mine');
    return interleave([...fitFirst], searched, mix);
}
// 1.95: a song or artist the story names (hummed, sung, put on, on the radio): that exact song, from your songs or from
// Spotify search, then (when a device is playing) more like it. Returns true when it played.
async function namedPlay(m, snap, said) {
    const want = norm(said.title), byArtist = s => !said.artist || artistMatch(s.a ?? '', said.artist);
    const mine = usableSongs(m).map(s => ({ uri: s.uri, n: s.n ?? m.songs[s.uri]?.n ?? '', a: s.a ?? m.songs[s.uri]?.a ?? '' }));
    // "sings Dancing Queen" can name a song, not a singer: a song of yours with that exact name counts first.
    const asSong = !said.title && said.artist ? norm(said.artist) : '';
    let hit = said.title ? mine.find(s => norm(s.n).startsWith(want) && byArtist(s)) : (asSong ? mine.find(s => norm(s.n) === asSong) ?? null : null), found = [];
    if (!hit) {
        const qs = said.title ? [said.artist ? `track:"${said.title}" artist:"${said.artist}"` : `track:"${said.title}"`, `${said.title} ${said.artist}`.trim()] : [`artist:"${said.artist}"`, said.artist];
        for (const q of qs) { try { found = await sp.searchTracks(m, q, 1); } catch { found = []; } if (said.title) found = found.filter(t => norm(t.n).startsWith(want) && byArtist(t)); else if (q.startsWith('artist:')) found = found.filter(t => artistMatch(t.a, said.artist)); if (found.length) break; }
        found.sort((p, q) => (q.pop ?? 0) - (p.pop ?? 0));
        if (asSong && !found.some(t => artistMatch(t.a, said.artist))) { const named = found.filter(t => norm(t.n) === asSong); if (named.length) found = named.slice(0, 1); }
        mus.extra ??= new Map(); for (const t of found) mus.extra.set(t.uri, t);
        // An artist: one of their songs you have, else one of their best known (a little variety among the top few).
        const yours = !said.title ? mine.filter(s => artistMatch(s.a, said.artist)) : [];
        hit = yours.length ? yours[Math.floor(Math.random() * yours.length)] : found[Math.floor(Math.random() * Math.min(3, found.length))] ?? null;
    }
    if (!hit) return false;
    let rest = [];
    if (said.device || radioOn(m)) {
        if (said.device && !radioOn(m)) mus.radio = { chat: ctx().chatId, kind: said.kind || 'the music in the room', left: storyOnly(m) ? STORY_RADIO_REPLIES : RADIO_REPLIES, artist: said.artist };
        rest = await venueLineup(m, { id: /jukebox/.test(mus.radio?.kind ?? '') ? 'jukebox' : 'radio', artist: said.artist ?? '' }, [hit.uri], snap);
    } else if (!storyOnly(m)) { const list = ranked(snap, m, [hit.uri]); rest = list.length ? lineup(list, pick(list)) : []; }
    mus.named = { uri: hit.uri, phrase: said.phrase };
    try { await playList(m, [hit.uri, ...rest.filter(u => u !== hit.uri)].slice(0, 15), [`\u201c${said.phrase}\u201d in the story`], snap, true); m.on = true; save(); return true; }
    catch (err) { say(err.message, true); return false; }
}
// The in-story radio's own line-up: your songs that suit the scene and the era, mixed with Spotify search.
async function radioPlay(m, snap, why) {
    const uris = await venueLineup(m, { id: /jukebox/.test(mus.radio?.kind ?? '') ? 'jukebox' : 'radio', artist: mus.radio?.artist ?? '' }, [], snap);
    if (!uris.length) { mus.radio.empty = true; return false; }
    mus.radio.empty = false;
    try { await playList(m, uris, why, snap, true); } catch (err) { say(err.message, true); }
    return true;
}
async function venuePlay(m, snap, exclude = []) {
    const v = mus.radio, uris = await venueLineup(m, { id: v.venue, artist: v.artist }, exclude, snap);
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
const SEX_ACT = new RegExp(SCENE_WORDS.sex[0][1].source + '|\\b(?:moan(?:s|ed|ing)?|undress(?:es|ed|ing)?|naked|on top of (?:her|him)|hips (?:roll|rolled|buck|bucked|snap|snapped|stutter)|rock(?:s|ed|ing)? into (?:her|him)|thrust(?:s|ed|ing)?|(?:deep )?inside (?:her|him)|fuck(?:s|ed|ing)? (?:her|him|me|you)|rid(?:es|ing) (?:him|her)|rode (?:him|her)|sinks? (?:down )?onto (?:him|his)|sank (?:down )?onto (?:him|his)|pushes into (?:her|him)|pushed into (?:her|him)|bottoms? out|buried (?:to the hilt|inside)|(?:his|her) cock|grinding (?:down )?on (?:him|his))', 'i');
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
    // 2.0.32: touching themselves, him or her, with its own layer first (from the last 2 messages).
    // 2.0.33: or a body word and a stroking motion anywhere in those messages ("pumps it from the base", "spits in his
    // palm"), so the story's own wording counts. Heat isn't needed: the two together already say what's happening.
    const soloText = near2.join(' '), soloMoving = amb.MORE_WORDS.soloMove.test(soloText);
    const soloHim = said(amb.MORE_WORDS.solo) || (soloMoving && amb.MORE_WORDS.soloHim.test(soloText));
    const soloHer = said(amb.MORE_WORDS.soloher) || (soloMoving && amb.MORE_WORDS.soloHer.test(soloText) && !soloHim);
    if ((heatNow || !inPublic) && soloHer) beds.unshift('soloher');
    if ((heatNow || !inPublic) && soloHim) beds.unshift('solo');
    // On the toilet while at it: the seat creaks along.
    if ((soloHim || soloHer) && !beds.some(b => amb.LOVE_WORDS.some(([k]) => k === b)) && realSentences(texts.slice(0, 3)).some(t => amb.LOVE_WORDS.find(([k]) => k === 'seat')[1].test(t))) beds.push('seat');
    if (heatNow) for (const act of ['fingers', 'rub', 'spank', 'whip']) if (said(amb.MORE_WORDS[act])) beds.push(act);
    // 2.0.32 remixes: a scuffle, pulling at restraints, creaking footsteps, a rocking chair, someone shifting in bed (not
    // during sex), kissing (warm, before sex), a bath running.
    if (said(amb.MORE_WORDS.scuffle)) beds.push('scuffle');
    if (said(amb.MORE_WORDS.struggle)) beds.push('struggle');
    if (heatNow && !sexNow && said(amb.MORE_WORDS.kissing)) beds.push('kissing');
    if (said(amb.MORE_WORDS.steps)) beds.push('steps');
    if (realSentences(texts.slice(0, 3)).some(t => amb.MORE_WORDS.rocking.test(t))) beds.push('rocking');
    if (!sexNow && realSentences(texts.slice(0, 3)).some(t => amb.MORE_WORDS.restless.test(t))) beds.push('restless');
    if (said(amb.MORE_WORDS.bath)) beds.push('bath');
    // Peeing (on the erotic switch) and a tap running, when the last 2 messages say so.
    if (said(amb.MORE_WORDS.pee)) beds.push('pee');
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
    if (said(amb.MORE_WORDS.sink) && place !== 'shower') beds.push('sink');
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
    mus.hushed = false; mus.lineup = uris; mus.anchor = snap; mus.cutAt = Date.now(); mus.why = why; mus.userPaused = false; mus.wasPlaying = true;
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
    if (storyOnly(m) && !radioOn(m)) { const v = venueHere(snap, m); if (v) enterVenue(v); else { m.on = true; save(); return hush(m); } }
    mus.hushed = false;
    if (mus.radio?.venue && radioOn(m) && await venuePlay(m, snap, exclude)) return;
    if (radioOn(m) && !mus.radio.venue && await radioPlay(m, snap, [`${mus.radio.kind} in the story`])) { m.on = true; save(); return; }
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
    if (!swiped) mus.manual = false;
    const freshCues = readCues(m);
    if (!mus.now) { await sync(); if (!mus.now) return start(); }
    // Never silent: if the music ran out (not paused by you), sync sees it and starts it again (ranDry).
    if (!mus.now.playing && !mus.userPaused && !mus.locked && !storyOnly(m)) { await sync(); if (!mus.now?.playing) { changed(); return; } }
    updateAmbience(snap);
    // A song you picked yourself plays to its end: no reply, cue or sting cuts it.
    if (mus.locked || swiped || (mus.chosen && mus.chosen === mus.now?.uri)) { changed(); return; }
    // The words of this turn: the newest reply, and your message if it came just before it.
    const turn = [last?.is_user ? '' : last?.mes, chat.at(-2)?.is_user ? chat.at(-2).mes : ''].filter(Boolean).join('\n');
    // Venue music: arriving at a venue (or the band named at a gig changing) switches to what's playing there; leaving
    // it, or the scene turning to sex, brings the film score back. While in the venue its line-up plays on.
    // 1.95: a song or artist named in this turn (hummed, sung, put on, on the radio) plays, whatever else is going on.
    if (extraOn('radio', m)) {
        const said = songMention(turn, characterNames()), key = said ? `${mark}|${said.phrase}` : '';
        if (said && key !== mus.namedKey) { mus.namedKey = key; if (await namedPlay(m, snap, said)) return; }
    }
    const venue = venueHere(snap, m), vKey = venue ? `${venue.id}|${venue.artist}` : '', wasVenue = mus.radio?.venue && radioOn(m) ? mus.radio.key : '';
    if (vKey !== wasVenue) {
        if (venue) { mus.hushed = false; mus.radio = { chat: ctx().chatId, kind: venue.artist ? `${venue.artist}, live on stage,` : VENUE_BY_ID[venue.id].label, left: Infinity, venue: venue.id, artist: venue.artist, key: vKey }; if (await venuePlay(m, snap)) return; mus.radio = null; }
        else if (wasVenue) { mus.radio = null; if (storyOnly(m)) return hush(m); const list = ranked(snap, m), first = list.length ? pick(list) : null; if (first) { try { await playList(m, lineup(list, first), ['left the venue'], snap, true); } catch (err) { say(err.message, true); } return; } }
    } else if (venue) { changed(); return; }
    // In-story radio: switched on, kept on (for a while, or while the story keeps mentioning it), or switched off.
    if (extraOn('radio', m)) {
        const said = radioIn(turn), was = radioOn(m);
        if (said === 'on') mus.radio = { chat: ctx().chatId, kind: was ? mus.radio.kind : radioKind(turn), left: storyOnly(m) ? STORY_RADIO_REPLIES : RADIO_REPLIES, artist: was ? mus.radio.artist ?? '' : '' };
        else if (said === 'off') mus.radio = null;
        else if (was && --mus.radio.left <= 0) mus.radio = null;
        if (radioOn(m) !== was) {
            if (!radioOn(m) && storyOnly(m)) return hush(m);
            mus.hushed = false;
            if (radioOn(m) && await radioPlay(m, snap, [`${mus.radio.kind} in the story`])) return;
            const list = ranked(snap, m), first = list.length ? pick(list) : null;
            if (first) { try { await playList(m, lineup(list, first), radioOn(m) ? [`${mus.radio.kind} in the story`] : ['the radio went off'], snap, true); } catch (err) { say(err.message, true); } return; }
        }
    } else mus.radio = null;
    // In-story music only: with nothing playing in the story, stay quiet (no stings, no scoring).
    const namedOn = mus.named && mus.named.uri === mus.now?.uri && mus.now?.playing;
    if (storyOnly(m) && !radioOn(m)) { if (mus.now?.playing && !namedOn && !mus.locked && !(mus.chosen && mus.chosen === mus.now?.uri)) await hush(m); else changed(); return; }
    if (storyOnly(m) && radioOn(m) && !mus.now?.playing && !mus.userPaused) { mus.hushed = false; await radioPlay(m, snap, [`${mus.radio.kind} in the story`]); return; }
    // While a radio, jukebox or venue plays (or a named song), its line-up plays on: the film score doesn't cut in.
    if (radioOn(m) || namedOn) { changed(); return; }
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
// ---- Skips (1.80) ----
// A song that changed before it was nearly over, in the line-up's order (skipped in Spotify or with \u23ed here), is a
// skip. Skipped songs sit out for SKIP_REST. Two skips in one line-up, or reaching its last song, build a fresh
// line-up from the scene as it is now: straight away if the song that's on only just started, else when it ends.
const SKIP_REST = 30 * 60 * 1000;
function skippedNow() { const now = Date.now(); mus.skips = (mus.skips ?? []).filter(x => now - x.at < SKIP_REST); return new Set(mus.skips.map(x => x.uri)); }
function noteSkip(uri) { if (uri) mus.skips = [...(mus.skips ?? []).filter(x => x.uri !== uri), { uri, at: Date.now(), lineup: mus.cutAt }]; }
function watchSkips(p) {
    const uri = p.item.uri, was = mus.seen, at = mus.lineup.indexOf(uri);
    mus.seen = { uri, at, started: Date.now() - (p.progress_ms ?? 0), ms: p.item.duration_ms ?? 0, lineup: mus.cutAt };
    if (!was || was.uri === uri || was.lineup !== mus.cutAt || at < 0) return;
    // Moved on before the last 8 seconds: skipped. Songs jumped over in between were skipped too.
    if (was.at >= 0 && at > was.at && Date.now() - was.started < was.ms - 8000) { noteSkip(was.uri); for (const u of mus.lineup.slice(was.at + 1, at)) noteSkip(u); }
    const skips = (mus.skips ?? []).filter(x => x.lineup === mus.cutAt).length, last = at >= mus.lineup.length - 1;
    if (skips >= 2 || last) { if ((p.progress_ms ?? 0) < 25000 && skips >= 2) { mus.refresh = false; void start([uri]); } else mus.refresh = true; }
}
// What Spotify is playing now; keeps the end-of-song timer right.
export async function sync() {
    const m = music(); if (!sp.signedIn(m)) return;
    let p; try { p = await sp.player(m); } catch (err) { if (err.code === 'signin') say(err.message, true); return; }
    clearTimeout(mus.timer);
    if (!p?.item) { if (mus.now) mus.now.playing = false; changed(); if (ranDry(m, null)) void start(); return; }
    const uri = p.item.uri, art = p.item.album?.images?.at(-1)?.url ?? p.item.album?.images?.[0]?.url ?? '';
    if (uri !== mus.now?.uri) { remember(m, uri); if (mus.now && !mus.lineup.includes(uri)) mus.why = []; }
    if (p.is_playing) watchSkips(p);
    mus.now = { uri, name: p.item.name ?? '', artist: (p.item.artists ?? []).map(a => a.name).join(', '), art, ms: p.item.duration_ms ?? 0, progress: p.progress_ms ?? 0, started: Date.now() - (p.progress_ms ?? 0), playing: Boolean(p.is_playing), device: p.device?.name ?? '' };
    if (p.device?.id) { m.device = p.device.id; m.deviceName = p.device.name ?? ''; }
    const left = (p.item.duration_ms ?? 0) - (p.progress_ms ?? 0);
    if (ranDry(m, p)) { void start(); return; }
    // 1.95.1 In-story music only: nothing plays unless the story has music on (a radio, jukebox or venue), a song the
    // story named is still playing, or you started it yourself (\u25b6 or a song's play button). Anything else (Spotify's
    // own autoplay after a line-up, a leftover queue) is paused.
    // 1.96.1: music that starts again after Moodweaver paused it was started by you (in Spotify, Control Centre, a
    // headphone tap): Spotify never resumes a paused player by itself. It counts like \u25b6 and plays until the next reply.
    if (storyOnly(m) && p.is_playing && ((mus.hushed && Date.now() - (mus.hushedAt ?? 0) > 8000) || mus.userPaused)) { mus.hushed = false; mus.userPaused = false; mus.manual = true; }
    if (storyOnly(m) && !radioOn(m) && p.is_playing && !mus.manual && !(mus.named && mus.named.uri === uri) && !(mus.chosen && mus.chosen === uri)) { void hush(m); return; }
    if (p.is_playing && m.on && left > 0) mus.timer = setTimeout(() => void songEnding(), Math.max(1000, left - 3500));
    changed();
}
// The music stopped by itself (the line-up ran out while the page slept), not because you paused it: start again.
// A song stopped part-way through counts as paused by you, in Moodweaver or in Spotify, and is left alone.
function ranDry(m, p) {
    if (!m.on || mus.userPaused || mus.locked || mus.hushed || (storyOnly(m) && !radioOn(m)) || !mus.lineup?.length || (Date.now() - (mus.cutAt ?? 0)) < 20000) return false;
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
    // In-story music only: the radio or venue went quiet during this song, so let it finish and then pause.
    if (storyOnly(m) && !radioOn(m)) { setTimeout(() => void hush(m), Math.max(0, left - 600)); return; }
    // 1.95: a radio, jukebox or venue keeps its own line-up; when it runs out, a fresh one from the same place.
    if (radioOn(m)) {
        const at = mus.lineup.indexOf(p.item.uri);
        if (at >= 0 && at < mus.lineup.length - 1) { setTimeout(() => void sync(), left + 1500); return; }
        const snap = mus.latest ?? sceneNow();
        setTimeout(() => void (mus.radio?.venue ? venuePlay(m, snap, [p.item.uri]) : radioPlay(m, snap, [`${mus.radio.kind} in the story`])), Math.max(0, left - 1200));
        return;
    }
    const snap = mus.latest ?? sceneNow(); if (!snap) return sync();
    const list = ranked(snap, m, [p.item.uri]); if (!list.length) return sync();
    const at = mus.lineup.indexOf(p.item.uri), planned = at >= 0 ? mus.lineup[at + 1] : null, plannedScore = list.find(x => x.uri === planned)?.score ?? -Infinity;
    if (planned && !mus.refresh && plannedScore >= list[0].score - 2) { setTimeout(() => void sync(), left + 1500); return; }
    mus.refresh = false;
    const first = pick(list);
    setTimeout(async () => { try { await playList(m, lineup(list, first), first.why, snap, false); } catch (err) { say(err.message, true); } }, Math.max(0, left - 1200));
}

// ---- Buttons ----
export async function togglePlay() {
    const m = music();
    try { if (!mus.now) return start(); const d = await deviceFor(m); if (mus.now.playing) { mus.userPaused = true; mus.wasPlaying = false; await sp.pause(m, d.id); } else { mus.userPaused = false; mus.manual = storyOnly(m) && !radioOn(m); await sp.resume(m, d.id); } updateAmbience(); setTimeout(() => void sync(), 600); }
    catch (err) { say(err.message, true); }
}
// Jump within the playing song: to a spot (ms), or by a step (\u221215 s, +15 s).
export async function seekTo(ms) {
    const m = music(), n = mus.now; if (!n?.ms) return;
    const at = Math.max(0, Math.min(n.ms - 2000, Math.round(ms)));
    try { const d = await deviceFor(m); await sp.seek(m, at, d.id); n.started = Date.now() - at; n.progress = at; changed(); setTimeout(() => void sync(), 800); } catch (err) { say(err.message, true); }
}
export const nowAt = () => { const n = mus.now; return n ? (n.playing ? Date.now() - n.started : n.progress ?? 0) : 0; };
export const seekBy = sec => seekTo(nowAt() + sec * 1000);
// \u25c6 Mark peak here: the playing song's peak becomes where it is now (saved in its tags and the sheet's Peak column).
export function markPeak() {
    const uri = mus.now?.uri; if (!uri) return;
    const sec = Math.max(1, Math.round(nowAt() / 1000)); setTag(uri, 'pk', String(sec));
    say(`Peak set at ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} for ${mus.now.name}. Change or clear it in \u270e Tags \u203a Sting, peak and year.`);
}
export const nextBest = () => { if (mus.now?.uri && nowAt() < (mus.now.ms || Infinity) - 8000) noteSkip(mus.now.uri); return start(mus.now ? [mus.now.uri] : []); };
// \u21bb Re-roll, for when you come back after a while: forget the old scene and line-up, look for songs added to your
// lit playlists while SillyTavern was closed, read the last 6 messages again (scene kind,
// moods, heat, lyric cues) and start a fresh line-up with a different song from the one that was on.
// "This scene is\u2026" you set yourself and lyric-cue rests are kept; \u2715 Not here and Never during still count.
export async function reRoll() {
    const m = music(); if (!sp.signedIn(m)) return say('Sign in to Spotify first.', true);
    if (mus.busy) return; mus.busy = true;
    try {
        if (Object.entries(m.playlists).some(([id, p]) => p.on && p.owned && !id.startsWith('csv:'))) {
            mus.loading = 'Looking for new songs in your playlists\u2026'; changed();
            try { await loadPlaylists(); } catch { /* offline: use the songs already here */ }
        }
        mus.story = null; mus.anchor = null; mus.lineup = []; mus.cues.clear(); mus.why = []; mus.lastFam = ''; mus.loading = '';
        if (mus.forced && mus.forced.chat !== ctx().chatId) mus.forced = null;
        await start(mus.now ? [mus.now.uri] : [], true, true);
        if (!mus.error) {
            const live = (mus.heard ?? []).filter(h => !h.resting && h.fits);
            const cueNote = !m.cues ? 'lyric cues are off' : live.length ? `cued: ${live[0].name}` : mus.heard?.length ? 'a cue was heard but its song is resting or doesn\'t fit this scene' : 'no lyric cues in the last 6 messages';
            const n = usableSongs(m).length;
            say(n < 15 ? `Only ${n} ${n === 1 ? 'song' : 'songs'} to choose from, so the scene can't pick well. ${poolText(m)} Open \u2726 Playlists below and light the playlist with your songs (or import your song sheet again).`
                : `Re-rolled from the last 6 messages \u00b7 ${n} songs \u00b7 ${cueNote}.`);
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
// \u25b6 on a song: you pick it. It plays now (whatever its rest or the scene) and holds until it ends, then the scene
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
// \u2713 Fits and \u2717 Not here: remember it for this kind of scene. Five \u2717 in the same moment or heat add it to Never during.
export async function feedback(good) {
    const m = music(), uri = mus.now?.uri, snap = sceneNow() ?? mus.latest; if (!uri || !snap) return say('Nothing is playing to mark yet: tap \u25b6 first.', true);
    mus.latest = snap;
    // \u2717 Not here is final for this kind of scene: the song (and every other version of it, like a cover with the
    // same title) is never played in this kind of scene again. Undo it in the song's tags (Never during).
    if (!good) {
        const title = norm(String(m.songs[uri]?.n ?? mus.now?.name ?? '').replace(/\s*[-(\[].*$/, ''));
        const versions = Object.entries(m.songs).filter(([u, s]) => u === uri || (title && norm(String(s.n).replace(/\s*[-(\[].*$/, '')) === title)).map(([u]) => u);
        const never = [snap.mode ? `k:${snap.mode}` : '', snap.heat ? `h:${snap.heat}` : '', ...[...snap.moments].slice(0, 2).map(x => `mo:${x}`)].filter(Boolean);
        for (const u of versions) { const t = cleanTags(m.tags[u] ?? emptyTags()); t.nv = [...new Set([...t.nv, ...(snap.mode ? [`k:${snap.mode}`] : never)])]; m.tags[u] = t; youEdited(m, u); }
        save(); say(`Noted: ${versions.length > 1 ? `no version of this song` : 'this song'} will play in ${snap.mode ? `a ${modeLabel(snap.mode)} scene` : 'scenes like this'} again. Finding something better\u2026`);
        return start(versions);
    }
    const learn = m.learn[uri] ??= {};
    for (const k of learnKeys(snap)) {
        learn[k] = Math.max(-6, Math.min(3, (learn[k] ?? 0) + (good ? 1 : -1.5)));
        if (!good && learn[k] <= -6 && /^(mo|h):/.test(k)) { const t = cleanTags(m.tags[uri] ?? emptyTags()); if (!t.nv.includes(k)) { t.nv.push(k); m.tags[uri] = t; youEdited(m, uri); } }
    }
    // The song's sound (its Spotify genres) counts for this kind of scene too, so songs that sound like it rise.
    const g = m.songs[uri]?.g ?? [], kind = snap.mode || 'any', sound = m.sound[kind] ??= {};
    for (const x of g) { const k = norm(x); sound[k] = Math.max(-3, Math.min(4, (sound[k] ?? 0) + (good ? 1 : -0.5))); }
    // The \u2726 Fits button shows it took, for as long as this song plays (panel/music-tab.js).
    if (good) mus.fitsMark = { uri, at: Date.now(), scene: snap.mode ? modeLabel(snap.mode) : '' };
    save(); say(good ? 'Noted: it fits scenes like this, and songs that sound like it will come up more.' : 'Noted. Finding something better\u2026');
    if (!good) await start([uri]);
}

// ---- Library ----
export async function loadPlaylists() {
    const m = music(); mus.loading = 'Reading your playlists\u2026'; changed();
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
            mus.loading = `Loading ${p.name} (${++n} of ${todo.length})\u2026`; changed();
            const songs = await sp.songsOf(m, id);
            // Only trust the answer to say what LEFT the playlist when it's complete. Spotify sometimes sends back far fewer
            // songs than the playlist holds (the count it gave a moment ago): then new songs are added and none are removed.
            const had = Object.values(m.songs).filter(s => s.pl?.includes(id)).length, total = Number(p.count) || 0;
            const complete = songs.length > 0 && (!total || songs.length >= total * 0.9) && (songs.length >= had * 0.5 || had < 20);
            if (!complete) mus.partial = { name: p.name, got: songs.length, total: total || had };
            if (complete) for (const s of Object.values(m.songs)) if (s.pl?.includes(id)) s.pl = s.pl.filter(x => x !== id);
            // A removed song stays gone, unless you add it back on Spotify to a playlist Moodweaver took it out of.
            for (const t of songs) { const rm = m.removed[t.uri]; if (rm) { if ((rm.pl ?? []).includes(id)) delete m.removed[t.uri]; else continue; } }
            for (const t of songs) { if (m.removed[t.uri]) continue; const old = m.songs[t.uri]; m.songs[t.uri] = { n: t.n, a: t.a, al: t.al, ms: t.ms, ...(old?.g ? { g: old.g } : {}), ...(old?.pln ? { pln: old.pln } : {}), pl: [...new Set([...(old?.pl ?? []), id])] }; }
            if (complete) { p.snap = p.snapNew; p.count = songs.length; }
        }
        // Songs in no playlist and with no tags of their own are dropped.
        for (const [uri, s] of Object.entries(m.songs)) if (!(s.pl ?? []).length && !hasTags(m.tags[uri])) delete m.songs[uri];
        m.loadedAt = Date.now(); save(); mus.loading = ''; say(`${usableSongs(m).length} songs ready.`);
    } catch (err) { mus.loading = ''; save(); say(err.message, true); }
}
export function togglePlaylist(id) { const m = music(), p = m.playlists[id]; if (!p) return; p.on = !p.on; save(); changed(); if (p.on && p.owned && !id.startsWith('csv:') && sp.signedIn(m)) void loadSongs(); }

// ---- Your songs, kept up to date without the sheet ----
// Songs you tagged or changed in Moodweaver (\u270e Tags, \u2715 Not here) are yours: built-in tags never overwrite them.
const youEdited = (m, uri) => { m.tagEdited[uri] = Date.now(); };
// The tagged song list that comes with each version (data/song-tags.js). When a new version brings new or updated
// tags, they're merged in by themselves on load: new songs are added and linked to their playlist, songs you never
// changed get the new tags, and songs you changed or removed are left as they are. No import needed.
export async function applyBundle(force = false) {
    let B; try { B = (await import('../data/song-tags.js')).SONG_TAGS; } catch { return; }
    const m = music(); if (!B?.version || (!force && m.bundle === B.version)) return;
    const plFor = name => Object.entries(m.playlists).filter(([, p]) => norm(p.name) === norm(name)).sort((a, b) => Number(a[0].startsWith('csv:')) - Number(b[0].startsWith('csv:')))[0]?.[0];
    let added = 0, updated = 0, n = 0;
    for (const [uri, x] of Object.entries(B.songs)) {
        // Every 100 songs, let the page breathe, so a phone never freezes while 1,000+ songs merge in.
        if (++n % 100 === 0) await new Promise(r => setTimeout(r, 0));
        if (m.removed[uri]) continue;
        if (!m.songs[uri]) { m.songs[uri] = { n: x.n, a: x.a, al: x.al ?? '', ms: x.ms ?? 0, pl: [], ...(x.g?.length ? { g: x.g } : {}) }; added++; }
        // A song can be on more than one of your playlists (1.89: Easterman's and Kenny's).
        const names = [].concat(x.pl ?? []); if (names.length) m.songs[uri].pln = names.length > 1 ? names : names[0];
        for (const name of names) { const id = plFor(name); if (id && !m.songs[uri].pl?.includes(id)) m.songs[uri].pl = [...(m.songs[uri].pl ?? []), id]; }
        if (!m.tagEdited[uri]) {
            // Before 1.72.7 your own changes weren't marked, so anything that's clearly yours is kept on top: Never
            // during (\u2715 Not here), Favourite, Off, Theme and a peak you set.
            const t = cleanTags(x.t), old = cleanTags(m.tags[uri] ?? {});
            t.nv = [...new Set([...t.nv, ...old.nv])]; t.fav ||= old.fav; t.off ||= old.off; t.th ||= old.th; if (old.pk) t.pk = old.pk;
            if (JSON.stringify(cleanTags(t)) !== JSON.stringify(old)) { m.tags[uri] = cleanTags(t); updated++; }
        }
    }
    m.bundle = B.version; save();
    if (added || updated) say(`Your song tags are up to date (${B.version}): ${added} songs added, ${updated} updated. Songs you changed yourself were kept.`);
}
// \ud83d\uddd1 Remove a song: out of your Spotify playlists (the ones you made), out of Moodweaver, and never added back by a
// sheet or built-in tags. If it's playing, the next best song plays.
export async function removeSong(uri) {
    const m = music(), s = m.songs[uri]; if (!s) return;
    const spotify = (s.pl ?? []).filter(id => !id.startsWith('csv:') && id !== 'liked' && m.playlists[id]?.owned);
    if (spotify.length && !sp.canEdit(m)) return say('To remove songs from your Spotify playlists, Moodweaver needs permission to edit them: tap \u201cSign in again\u201d in Music settings once, then try again.', true);
    try { for (const id of spotify) await sp.removeFromPlaylist(m, id, uri); }
    catch (err) { return say(`Spotify wouldn\u2019t remove it: ${err.message}`, true); }
    const name = s.n; m.removed[uri] = { at: Date.now(), pl: spotify }; delete m.songs[uri]; delete m.tags[uri]; delete m.tagEdited[uri];
    for (const id of spotify) if (m.playlists[id]) m.playlists[id].count = Math.max(0, (m.playlists[id].count ?? 1) - 1);
    save(); say(`Removed \u201c${name}\u201d${spotify.length ? ' from your Spotify playlist' : ''}.`);
    if (mus.now?.uri === uri) await nextBest();
}
// Songs with no tags yet, as plain text to paste to Claude for tagging (then they arrive with the next version).
export function untaggedText() {
    const m = music();
    return usableSongs(m).filter(x => !hasTags(m.tags[x.uri])).map(x => `${x.song.n} \u2014 ${x.song.a} \u2014 ${x.uri}`).join('\n');
}
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
        for (const uri of Object.keys(got.newSongs)) if (m.removed[uri]) delete got.newSongs[uri];
        for (const uri of Object.keys(got.tags)) if (m.removed[uri]) delete got.tags[uri];
        for (const [uri, s] of Object.entries(got.newSongs)) { const old = m.songs[uri]; m.songs[uri] = { ...s, ...(old ?? {}), pl: [...new Set([...(old?.pl ?? []), ...(s.pl ?? [])])] }; }
        // Link each song back to the playlist named in its "From playlist" cell (your Spotify one first, else a sheet one),
        // so replacing the sheet never leaves songs outside your lit playlist.
        const plIds = name => Object.entries(m.playlists).filter(([, p]) => norm(p.name) === norm(name)).sort((a, b) => Number(b[0].startsWith('csv:') ? 0 : 1) - Number(a[0].startsWith('csv:') ? 0 : 1)).map(([id]) => id);
        for (const [uri, name] of Object.entries(got.songPl ?? {})) { const ids = plIds(name), s = m.songs[uri]; if (s && ids.length) s.pl = [...new Set([...(s.pl ?? []), ids[0]])]; }
        for (const [uri, g] of Object.entries(got.sound ?? {})) if (m.songs[uri]) { if (g.length) m.songs[uri].g = g; else delete m.songs[uri].g; }
        if (got.newPlaylist) m.playlists[got.newPlaylist.id].count = Object.values(m.songs).filter(s => s.pl?.includes(got.newPlaylist.id)).length;
        // Rows that differ from the built-in tags are your own changes: later versions keep them.
        let B = null; try { B = (await import('../data/song-tags.js')).SONG_TAGS; } catch { /* none built in */ }
        for (const [uri, t] of Object.entries(got.tags)) {
            if (hasTags(t) || t.note) m.tags[uri] = t; else delete m.tags[uri];
            const built = B?.songs?.[uri]?.t; if (!built || JSON.stringify(cleanTags(t)) !== JSON.stringify(cleanTags(built))) youEdited(m, uri);
        }
        for (const [id, t] of Object.entries(got.ptags)) { if (hasTags(t)) m.ptags[id] = t; else delete m.ptags[id]; }
        for (const [k, c] of Object.entries(got.chars)) m.chars[k] = { ...c, ...(m.chars[k]?.x ? { x: m.chars[k].x } : {}) }; // keeps the Extras ticks
        save();
        mus.lastImport = { at: Date.now(), file: file.name, songs: Object.keys(got.tags).length, added: Object.keys(got.newSongs).length, playlists: Object.keys(got.ptags).length, chars: Object.keys(got.chars).length, unknown: [...got.unknown].slice(0, 12), unmatched: got.unmatched.slice(0, 8) };
        say(`Imported ${file.name}.`);
    } catch (err) { say(`Couldn\u2019t read that file: ${err.message}`, true); }
}
export function setTag(uri, kind, value) {
    const m = music(), t = cleanTags(m.tags[uri] ?? emptyTags());
    if (['f', 'p', 'mo', 'd', 'c', 'nv', 'cm', 'st', 'dg'].includes(kind)) t[kind] = t[kind].includes(value) ? t[kind].filter(x => x !== value) : [...t[kind], value];
    else if (kind === 'h') t.h = t.h === value ? '' : value;
    else if (kind === 'e') t.e = t.e === Number(value) ? 0 : Number(value);
    else if (['th', 'fav', 'off'].includes(kind)) t[kind] = !t[kind];
    else if (kind === 'm') t.m = String(value).split(',').map(s => norm(s)).filter(Boolean).map(s => MOOD_LIST.find(x => norm(x.label) === s || x.id === s)?.id).filter(Boolean);
    else if (kind === 'cue') t.cue = String(value).split(',');
    else if (kind === 'cw') t.cw = String(value).split(/[,\s]+/);
    else if (kind === 'pk') t.pk = value;
    else if (kind === 'yr') t.yr = value;
    m.tags[uri] = cleanTags(t); youEdited(m, uri); save(); changed();
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
    // Built-in tags merge a little after SillyTavern has finished loading, never during it (1.90.1).
    setTimeout(() => void applyBundle().catch(err => console.warn('[Moodweaver] built-in song tags', err)), 8000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') return; if (music().on && sp.signedIn(music())) void sync(); updateAmbience(); });
    // iPhone Safari only lets sound start inside a tap. Any tap on the page (not only the Music tab) wakes the
    // ambience when it's waiting, including after the screen was locked.
    const wake = () => { if (amb.needsTap()) unlockSound(); };
    document.addEventListener('touchend', wake, { passive: true }); document.addEventListener('click', wake, { passive: true });
    void checkReturn().then(() => { if (music().on && sp.signedIn(music())) void sync(); });
}
// Settings \u203a Music: what the story is told about the music, at the end of the note. Two switches:
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
        const yr = cleanTags(m.tags[mus.now.uri] ?? {}).yr || mus.extra?.get(mus.now.uri)?.yr;
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
