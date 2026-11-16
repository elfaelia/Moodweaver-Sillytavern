// Music: your Spotify songs, picked for the scene by plain code (engine/music.js) and played on your Spotify.
// Runs after each reply (afterReply), at the end of each song (a timer) and when you tap in the Music tab.
// Nothing here is sent to Claude unless Settings › "Let the story feel the music" is on.
import { getCast, getState, getUserState, playerName, target } from './chat.js';
import { bondAxes, bondData, bondList, liveFor } from './replies.js';
import { KEY, ctx, run, ui } from './state.js';
import { BY_ID } from '../data/catalogue.js';
import { computeBond } from '../engine/bond.js';
import { GOOD_ENOUGH, cleanTags, describe, emptyTags, hasTags, learnKeys, lineup, mergeTags, norm, pick, rank, shiftOf, snapshot } from '../engine/music.js';
import { readSheet, sheetFile } from '../engine/sheet.js';
import { readCsv, readXlsx } from '../engine/xlsx.js';
import { shortName } from '../engine/util.js';
import * as sp from './spotify.js';

const DEFAULTS = { on: false, clientId: '', redirect: '', auth: null, pending: null, playlists: {}, songs: {}, tags: {}, ptags: {}, chars: {}, learn: {},
    follow: 'char', change: 'big', hold: 120, fade: true, themes: 'big', feel: false, device: '', deviceName: '', recent: [], loadedAt: 0 };
// Everything is kept in SillyTavern's extension settings (on your computer), so every device shares it.
export function music() {
    const all = ctx().extensionSettings[KEY] ??= {};
    const m = all.music && typeof all.music === 'object' ? all.music : (all.music = {});
    for (const [k, v] of Object.entries(DEFAULTS)) if (m[k] === undefined || m[k] === null && v !== null) m[k] = structuredClone(v);
    if (!['char', 'user', 'both'].includes(m.follow)) m.follow = 'char';
    if (!['end', 'big', 'any'].includes(m.change)) m.change = 'big';
    if (![60, 120, 240].includes(Number(m.hold))) m.hold = 120;
    if (!['big', 'always', 'off'].includes(m.themes)) m.themes = 'big';
    return m;
}
// Not saved: what's playing and why.
export const mus = { now: null, anchor: null, latest: null, lastFam: '', lineup: [], timer: 0, poll: 0, busy: false, status: '', error: '', cutAt: 0, locked: false, chatMark: '', present: '', devices: [], lastImport: null, loading: '' };
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
const factsOf = st => Object.fromEntries(Object.entries(st?.moods ?? {}).filter(([id, v]) => v > 0 && BY_ID[id]?.kind === 'state'));
export function sceneNow() {
    const ch = target(); if (!ch) return null;
    const st = getState(ch), you = getUserState(), m = music(), follow = m.follow;
    const people = [], who = [];
    if (follow !== 'user') { people.push({ name: ch.name, weight: 1, moods: st?.moods ?? {} }); who.push(ch.name, shortName(ch.name), '{{char}}'); }
    if (follow !== 'char' && you?.enabled !== false) { people.push({ name: playerName(), weight: follow === 'both' ? 0.8 : 1, moods: you?.moods ?? {} }); who.push(playerName(), shortName(playerName()), '{{user}}'); }
    const facts = { ...factsOf(you), ...factsOf(st) };
    for (const p of getCast(ch).filter(p => p.inScene)) Object.assign(facts, Object.fromEntries(Object.entries(factsOf(p.state)).filter(([id]) => BY_ID[id]?.category === 'setting')));
    const live = liveFor(ch), bond = bondData(ch);
    let dyn = '', under = '', meters = {};
    if (bond.on) { try { const bd = computeBond(bond, Infinity, shortName(ch.name), shortName(playerName()), bondAxes(ch), bondList(ch)); dyn = bd.dynamic?.group ?? ''; under = bd.under?.group ?? ''; meters = bd.more ?? {}; } catch { /* bonds off or new chat */ } }
    const chat = ctx().chat ?? [], replies = chat.filter(x => x && !x.is_user && !x.is_system).length;
    const present = String(live?.present ?? ''), before = mus.present; mus.present = present;
    const appear = [...new Set(characterNames().filter(n => present.toLowerCase().includes(n.toLowerCase()) && !before.toLowerCase().includes(n.toLowerCase())))];
    const snap = snapshot({ people, who, facts, dyn, under, meters, horny: Number.isFinite(live?.hornyValue) ? live.hornyValue : null, night: live?.sky?.time === 'night', replies, appear });
    snap.name = followName(follow === 'user' ? 'user' : 'char') + (follow === 'both' ? ` & ${shortName(playerName())}` : '');
    return snap;
}

// ---- The songs that count ----
// Songs from the playlists you ticked (and songs you tagged from a sheet), each with its playlists' tags under its own.
export function usableSongs(m = music()) {
    const on = new Set(Object.entries(m.playlists).filter(([, p]) => p.on).map(([id]) => id));
    return Object.entries(m.songs).filter(([uri, s]) => (s.pl ?? []).some(id => on.has(id)) || (hasTags(m.tags[uri]) && !(s.pl ?? []).length))
        .map(([uri, s]) => ({ uri, song: s, learn: m.learn[uri], tags: mergeTags(cleanTags(m.tags[uri] ?? {}), ...(s.pl ?? []).filter(id => on.has(id)).map(id => m.ptags[id] && cleanTags(m.ptags[id]))) }));
}
function ranked(snap, m = music(), exclude = []) {
    const songs = usableSongs(m).filter(s => !exclude.includes(s.uri)), recent = new Set(m.recent.slice(-20));
    let list = rank(songs, snap, { recent, themeOn: m.themes });
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
    mus.lineup = uris; mus.anchor = snap; mus.cutAt = Date.now(); mus.why = why;
    const s = m.songs[uris[0]];
    mus.now = { uri: uris[0], name: s?.n ?? '', artist: s?.a ?? '', art: '', ms: s?.ms ?? 0, started: Date.now(), progress: 0, playing: true };
    remember(m, uris[0]); say(''); setTimeout(() => void sync(), 1500);
}
function remember(m, uri) { if (!uri) return; m.recent = [...m.recent.filter(u => u !== uri), uri].slice(-40); save(); }
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
    if (!mus.now) { await sync(); if (!mus.now) return start(); }
    if (mus.locked || m.change === 'end' || swiped) { changed(); return; }
    const shift = shiftOf(mus.anchor, snap, famHeld), list = ranked(snap, m);
    if (!list.length) return;
    const current = list.find(x => x.uri === mus.now.uri)?.score ?? -Infinity, held = (Date.now() - mus.cutAt) / 1000 >= m.hold;
    if ((m.change === 'any' ? shift.any : shift.big) && held && list[0].score >= current + 4) {
        const first = pick(list);
        try { await playList(m, lineup(list, first), first.why, snap, true); } catch (err) { say(err.message, true); }
    } else changed();
}
// What Spotify is playing now; keeps the end-of-song timer right.
export async function sync() {
    const m = music(); if (!sp.signedIn(m)) return;
    let p; try { p = await sp.player(m); } catch (err) { if (err.code === 'signin') say(err.message, true); return; }
    clearTimeout(mus.timer);
    if (!p?.item) { if (mus.now) mus.now.playing = false; changed(); return; }
    const uri = p.item.uri, art = p.item.album?.images?.at(-1)?.url ?? p.item.album?.images?.[0]?.url ?? '';
    if (uri !== mus.now?.uri) { remember(m, uri); if (mus.now && !mus.lineup.includes(uri)) mus.why = []; }
    mus.now = { uri, name: p.item.name ?? '', artist: (p.item.artists ?? []).map(a => a.name).join(', '), art, ms: p.item.duration_ms ?? 0, progress: p.progress_ms ?? 0, started: Date.now() - (p.progress_ms ?? 0), playing: Boolean(p.is_playing), device: p.device?.name ?? '' };
    if (p.device?.id) { m.device = p.device.id; m.deviceName = p.device.name ?? ''; }
    const left = (p.item.duration_ms ?? 0) - (p.progress_ms ?? 0);
    if (p.is_playing && m.on && left > 0) mus.timer = setTimeout(() => void songEnding(), Math.max(1000, left - 3500));
    changed();
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
    try { if (!mus.now) return start(); const d = await deviceFor(m); if (mus.now.playing) await sp.pause(m, d.id); else await sp.resume(m, d.id); setTimeout(() => void sync(), 600); }
    catch (err) { say(err.message, true); }
}
export const nextBest = () => start(mus.now ? [mus.now.uri] : []);
export function toggleLock() { mus.locked = !mus.locked; changed(); }
export async function setOn(on) { const m = music(); m.on = on; save(); if (on) { await sync(); if (!mus.now?.playing) await start(); poller(); } else { clearTimeout(mus.timer); try { const d = await deviceFor(m); await sp.pause(m, d.id); } catch { /* nothing playing */ } changed(); } }
// ✓ Fits and ✗ Not here: remember it for this kind of scene. Five ✗ in the same moment or heat add it to Never during.
export async function feedback(good) {
    const m = music(), uri = mus.now?.uri, snap = mus.latest ?? sceneNow(); if (!uri || !snap) return;
    const learn = m.learn[uri] ??= {};
    for (const k of learnKeys(snap)) {
        learn[k] = Math.max(-6, Math.min(3, (learn[k] ?? 0) + (good ? 1 : -1.5)));
        if (!good && learn[k] <= -6 && /^(mo|h):/.test(k)) { const t = cleanTags(m.tags[uri] ?? emptyTags()); if (!t.nv.includes(k)) { t.nv.push(k); m.tags[uri] = t; } }
    }
    save(); say(good ? 'Noted: it fits scenes like this.' : 'Noted. Finding something better…');
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
            for (const t of songs) { const old = m.songs[t.uri]; m.songs[t.uri] = { n: t.n, a: t.a, al: t.al, ms: t.ms, pl: [...new Set([...(old?.pl ?? []), id])] }; }
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
    if (['f', 'p', 'mo', 'd', 'c', 'nv'].includes(kind)) t[kind] = t[kind].includes(value) ? t[kind].filter(x => x !== value) : [...t[kind], value];
    else if (kind === 'h') t.h = t.h === value ? '' : value;
    else if (kind === 'e') t.e = t.e === Number(value) ? 0 : Number(value);
    else if (['th', 'fav', 'off'].includes(kind)) t[kind] = !t[kind];
    else if (kind === 'm') t.m = String(value).split(',').map(s => s.trim()).filter(Boolean);
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
// Settings › Music › "Let the story feel the music": one short line describing the feel, never the song.
const ENERGY_WORDS = ['', 'hushed', 'slow', 'steady', 'driving', 'frantic'];
const FAMILY_WORDS = { happy: 'bright', bold: 'swaggering', closeness: 'tender', attachment: 'yearning', cold: 'cold', sad: 'melancholy', scared: 'uneasy', angry: 'harsh', cruel: 'menacing', calm: 'calm', masks: 'guarded', energy: 'restless', headspace: 'dreamlike', desire: 'sultry' };
export function musicLine() {
    const m = music(); if (!m.feel || !m.on || !mus.now?.playing) return '';
    const t = usableSongs(m).find(s => s.uri === mus.now.uri)?.tags; if (!t) return '';
    const words = [ENERGY_WORDS[t.e] ?? '', ...t.f.slice(0, 2).map(f => FAMILY_WORDS[f])].filter(Boolean);
    return words.length ? `Underscore under this scene (a soundtrack, never mention it or any music): ${words.join(', ')}.` : '';
}
export { describe, ui };
