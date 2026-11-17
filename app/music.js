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
import { plainStory } from '../engine/scene-words.js';
import * as sp from './spotify.js';

const DEFAULTS = { on: false, clientId: '', redirect: '', auth: null, pending: null, playlists: {}, songs: {}, tags: {}, ptags: {}, chars: {}, learn: {},
    follow: 'char', change: 'big', sound: {}, hold: 120, fade: true, themes: 'big', feel: false, tell: false, tellFor: 2, cues: true, cueAt: {}, device: '', deviceName: '', recent: [], loadedAt: 0 };
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
    return m;
}
// Not saved: what's playing and why.
export const mus = { forced: null, story: null, told: null, now: null, anchor: null, latest: null, lastFam: '', lineup: [], timer: 0, poll: 0, busy: false, status: '', error: '', cutAt: 0, locked: false, chatMark: '', present: '', devices: [], lastImport: null, loading: '', cues: new Map() };
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
export function sceneNow() {
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
    if (follow === 'story') { const prevReply = chat.filter(x => x && !x.is_user && !x.is_system).at(-2); if (prevReply) texts.push({ text: prevReply.mes ?? '', weight: 0.4 }); }
    if (mus.forced && mus.forced.chat !== ctx().chatId) mus.forced = null;
    const snap = snapshot({ people, who, facts, dyn, under, meters, horny: Number.isFinite(live?.hornyValue) ? live.hornyValue : null, night: live?.sky?.time === 'night', replies, appear, everyone, texts, force: mus.forced?.mode ?? '' });
    snap.story = follow === 'story';
    snap.name = follow === 'story' ? 'The story' : followName(follow === 'user' ? 'user' : 'char') + (follow === 'both' ? ` & ${shortName(playerName())}` : '');
    return snap;
}

// ---- The songs that count ----
// Songs from the playlists you ticked (and songs you tagged from a sheet), each with its playlists' tags under its own.
export function usableSongs(m = music()) {
    const on = new Set(Object.entries(m.playlists).filter(([, p]) => p.on).map(([id]) => id));
    return Object.entries(m.songs).filter(([uri, s]) => (s.pl ?? []).some(id => on.has(id)) || (hasTags(m.tags[uri]) && !(s.pl ?? []).length))
        .map(([uri, s]) => ({ uri, song: s, g: s.g ?? [], learn: m.learn[uri], tags: mergeTags(cleanTags(m.tags[uri] ?? {}), ...(s.pl ?? []).filter(id => on.has(id)).map(id => m.ptags[id] && cleanTags(m.ptags[id]))) }));
}
// ---- Lyric cues ----
// When the story says a song's cue ("salivating like a dog"), that song gets a nudge for this reply and the next two,
// only if it fits the scene. Once it has played for a cue, its cues rest for a few hours so it doesn't keep coming back.
const CUE_REPLIES = 3, CUE_REST = 3 * 3600 * 1000;
const replyCount = () => (ctx().chat ?? []).filter(x => x && !x.is_user && !x.is_system).length;
function readCues(m) {
    if (!m.cues) { mus.cues.clear(); return []; }
    const chat = ctx().chat ?? [], at = replyCount(), id = ctx().chatId;
    for (const [uri, c] of mus.cues) if (c.chat !== id || at - c.at >= CUE_REPLIES) mus.cues.delete(uri);
    const lastReply = [...chat].reverse().find(x => x && !x.is_user && !x.is_system), lastYou = [...chat].reverse().find(x => x && x.is_user);
    const text = `${plainStory(lastReply?.mes)}\n${plainStory(lastYou?.mes)}`;
    const fresh = cueHits(usableSongs(m), text).filter(h => Date.now() - (m.cueAt[h.uri] ?? 0) > CUE_REST);
    for (const h of fresh) mus.cues.set(h.uri, { cue: h.cue, at, chat: id });
    return fresh.map(h => h.uri);
}
const cuedNow = m => m.cues ? new Map([...mus.cues].filter(([uri]) => Date.now() - (m.cueAt[uri] ?? 0) > CUE_REST).map(([uri, c]) => [uri, c.cue])) : new Map();
// A cued song that plays uses up its cue for a while.
function cuePlayed(m, uri) {
    if (!uri || !mus.cues.has(uri)) return;
    // Every version of the song (same title) rests too, so a cover doesn't follow straight after.
    const title = norm(m.songs[uri]?.n ?? '');
    for (const u of [...mus.cues.keys()]) if (u === uri || (title && norm(m.songs[u]?.n ?? '') === title)) { m.cueAt[u] = Date.now(); mus.cues.delete(u); }
    { for (const [u, t] of Object.entries(m.cueAt)) if (Date.now() - t > CUE_REST) delete m.cueAt[u]; } }

function ranked(snap, m = music(), exclude = []) {
    const songs = usableSongs(m).filter(s => !exclude.includes(s.uri)), recent = new Set(m.recent.slice(-20));
    let list = rank(songs, snap, { recent, themeOn: m.themes, sound: m.sound, cued: cuedNow(m) });
    // Nothing fits well: the character's own default playlist (Characters tab), then simply the best there is.
    if (!list.length || list[0].score < GOOD_ENOUGH) {
        const own = m.chars[norm(snap.name.split(' & ')[0])]?.pl;
        if (own) { const mine = list.filter(x => (m.songs[x.uri]?.pl ?? []).includes(own)); if (mine.length) list = [...mine, ...list.filter(x => !mine.includes(x))]; }
    }
    return list;
}

// ---- Playing ----
const deviceFor = async m => {
    const list = await sp.devices(m); mus.devices = list;
    const chosen = list.find(d => d.id === m.device) ?? list.find(d => d.is_active) ?? list[0];
    if (!chosen) throw Object.assign(new Error('Open Spotify on your phone or computer, play anything for a second, then tap ▶ again.'), { code: 'device' });
    return chosen;
};
async function fadeTo(m, device, from, to) {
    if (!m.fade || !device?.supports_volume) return;
    for (const v of [0.66, 0.33, 0].map(f => to + (from - to) * f)) { await sp.volume(m, v, device.id).catch(() => null); await new Promise(r => setTimeout(r, 260)); }
}
async function playList(m, uris, why, snap, cut = false) {
    const device = await deviceFor(m), vol = device.volume_percent ?? 70;
    if (cut && mus.now) await fadeTo(m, device, vol, Math.round(vol * 0.15));
    await sp.shuffleOff(m, device.id); await sp.repeatOff(m, device.id);
    await sp.play(m, uris, device.id);
    if (cut && mus.now && m.fade && device.supports_volume) setTimeout(() => void sp.volume(m, vol, device.id).catch(() => null), 500);
    mus.lineup = uris; mus.anchor = snap; mus.cutAt = Date.now(); mus.why = why; mus.userPaused = false; mus.wasPlaying = true;
    const s = m.songs[uris[0]];
    mus.now = { uri: uris[0], name: s?.n ?? '', artist: s?.a ?? '', art: '', ms: s?.ms ?? 0, started: Date.now(), progress: 0, playing: true };
    remember(m, uris[0]); say(''); setTimeout(() => void sync(), 1500);
}
function remember(m, uri) { if (!uri) return; cuePlayed(m, uri); m.recent = [...m.recent.filter(u => u !== uri), uri].slice(-40); save(); }
// Start (or restart) with the best songs for the scene right now.
export async function start(exclude = []) {
    const m = music(); if (!sp.signedIn(m)) return say('Sign in to Spotify first.', true);
    const snap = sceneNow() ?? snapshot({}); mus.latest = snap;
    const list = ranked(snap, m, exclude);
    if (!list.length) return say('No songs yet: tick a playlist and tap Load songs, or import a song sheet.', true);
    const first = pick(list);
    try { await playList(m, lineup(list, first), first.why, snap, Boolean(mus.now)); m.on = true; save(); }
    catch (err) { say(err.message, true); }
}
// After each reply: decide whether this is a real shift worth cutting the song for.
export async function afterReply() {
    const m = music(); if (!m.on || !sp.signedIn(m) || run.suspended) return;
    const snap = sceneNow(); if (!snap) return;
    const famHeld = snap.fams[0] && snap.fams[0] === mus.lastFam ? snap.fams[0] : mus.anchor?.fams[0];
    mus.lastFam = snap.fams[0] ?? ''; mus.latest = snap;
    // A swipe or a regenerate of the same reply doesn't count as the story moving on.
    const chat = ctx().chat ?? [], last = chat.at(-1), mark = `${ctx().chatId}|${chat.length}`, swiped = mark === mus.chatMark && (last?.swipe_id ?? 0) > 0;
    mus.chatMark = mark;
    if (mus.forced && !swiped && --mus.forced.left <= 0) mus.forced = null;
    const freshCues = readCues(m);
    if (!mus.now) { await sync(); if (!mus.now) return start(); }
    // Never silent: if the music ran out (not paused by you), sync sees it and starts it again (ranDry).
    if (!mus.now.playing && !mus.userPaused && !mus.locked) { await sync(); if (!mus.now?.playing) { changed(); return; } }
    if (mus.locked || swiped) { changed(); return; }
    const shift = shiftOf(mus.anchor, snap, famHeld), list = ranked(snap, m);
    // The story just said a song's cue and that song now leads: that counts as a real shift (the hold time still applies).
    const cueShift = list[0]?.cue && freshCues.includes(list[0].uri) && list[0].uri !== mus.now.uri;
    if (!list.length) return;
    const now = list.find(x => x.uri === mus.now.uri), current = now?.score ?? -Infinity, held = (Date.now() - mus.cutAt) / 1000 >= m.hold;
    // The scene turned into another kind (a kiss, a chase, a death) and this song is wrong for it: change now,
    // whatever the hold time or "Only when a song ends" says. Otherwise the usual rules.
    const wrong = snap.mode && (!now || !now.fits) && list[0].fits && (Date.now() - mus.cutAt) > 15000;
    if (wrong || (m.change !== 'end' && (m.change === 'any' ? shift.any : shift.big || cueShift) && held && list[0].score >= current + 4)) {
        const first = pick(list);
        try { await playList(m, lineup(list, first), first.why, snap, true); } catch (err) { say(err.message, true); }
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
    try { if (!mus.now) return start(); const d = await deviceFor(m); if (mus.now.playing) { mus.userPaused = true; mus.wasPlaying = false; await sp.pause(m, d.id); } else { mus.userPaused = false; await sp.resume(m, d.id); } setTimeout(() => void sync(), 600); }
    catch (err) { say(err.message, true); }
}
export const nextBest = () => start(mus.now ? [mus.now.uri] : []);
// The kind of scene, said by you: holds for the next 6 replies (or until you tap Auto), then Moodweaver reads it again.
export function forceMode(mode) {
    mus.forced = mode ? { mode, left: 6, chat: ctx().chatId } : null;
    const m = music(); if (m.on && sp.signedIn(m)) void start(); else changed();
}
export function toggleLock() { mus.locked = !mus.locked; changed(); }
export async function setOn(on) { const m = music(); m.on = on; save(); if (on) { await sync(); if (!mus.now?.playing) await start(); poller(); } else { clearTimeout(mus.timer); try { const d = await deviceFor(m); await sp.pause(m, d.id); } catch { /* nothing playing */ } changed(); } }
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
        for (const id of Object.keys(m.playlists)) if (!seen.has(id) && !id.startsWith('csv:')) delete m.playlists[id];
        save(); await loadSongs();
    } catch (err) { mus.loading = ''; say(err.message, true); }
}
// The songs of every ticked playlist whose contents changed since last time.
export async function loadSongs() {
    const m = music(), todo = Object.entries(m.playlists).filter(([id, p]) => p.on && p.owned && !id.startsWith('csv:') && (id === 'liked' || p.snap !== p.snapNew || !Object.values(m.songs).some(s => s.pl?.includes(id))));
    let n = 0;
    try {
        for (const [id, p] of todo) {
            mus.loading = `Loading ${p.name} (${++n} of ${todo.length})…`; changed();
            const songs = await sp.songsOf(m, id);
            for (const s of Object.values(m.songs)) if (s.pl?.includes(id)) s.pl = s.pl.filter(x => x !== id);
            for (const t of songs) { const old = m.songs[t.uri]; m.songs[t.uri] = { n: t.n, a: t.a, al: t.al, ms: t.ms, ...(old?.g ? { g: old.g } : {}), pl: [...new Set([...(old?.pl ?? []), id])] }; }
            p.snap = p.snapNew; p.count = songs.length;
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
        for (const [uri, g] of Object.entries(got.sound ?? {})) if (m.songs[uri]) { if (g.length) m.songs[uri].g = g; else delete m.songs[uri].g; }
        if (got.newPlaylist) m.playlists[got.newPlaylist.id].count = Object.values(m.songs).filter(s => s.pl?.includes(got.newPlaylist.id)).length;
        for (const [uri, t] of Object.entries(got.tags)) { if (hasTags(t) || t.note) m.tags[uri] = t; else delete m.tags[uri]; }
        for (const [id, t] of Object.entries(got.ptags)) { if (hasTags(t)) m.ptags[id] = t; else delete m.ptags[id]; }
        Object.assign(m.chars, got.chars);
        save();
        mus.lastImport = { at: Date.now(), file: file.name, songs: Object.keys(got.tags).length, added: Object.keys(got.newSongs).length, playlists: Object.keys(got.ptags).length, chars: Object.keys(got.chars).length, unknown: [...got.unknown].slice(0, 12), unmatched: got.unmatched.slice(0, 8) };
        say(`Imported ${file.name}.`);
    } catch (err) { say(`Couldn’t read that file: ${err.message}`, true); }
}
export function setTag(uri, kind, value) {
    const m = music(), t = cleanTags(m.tags[uri] ?? emptyTags());
    if (['f', 'p', 'mo', 'd', 'c', 'nv', 'cm'].includes(kind)) t[kind] = t[kind].includes(value) ? t[kind].filter(x => x !== value) : [...t[kind], value];
    else if (kind === 'h') t.h = t.h === value ? '' : value;
    else if (kind === 'e') t.e = t.e === Number(value) ? 0 : Number(value);
    else if (['th', 'fav', 'off'].includes(kind)) t[kind] = !t[kind];
    else if (kind === 'm') t.m = String(value).split(',').map(s => norm(s)).filter(Boolean).map(s => MOOD_LIST.find(x => norm(x.label) === s || x.id === s)?.id).filter(Boolean);
    else if (kind === 'cue') t.cue = String(value).split(',');
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
    const m = music(); if ((!m.feel && !m.tell) || !m.on || !mus.now?.playing) return '';
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
