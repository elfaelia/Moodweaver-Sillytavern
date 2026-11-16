// Talking to Spotify: signing in (the browser sign-in Spotify recommends, "PKCE"), keeping the sign-in fresh,
// reading playlists and controlling playback. No tokens are ever sent to Claude.
//
// Sign-in has two ways back:
//  - Straight back: when SillyTavern is open at 127.0.0.1 or over https, Spotify returns to SillyTavern's own
//    /callback/spotify address, which hands the code back to the page (the same route the official Spotify
//    extension uses).
//  - Paste: from any other address (a phone on home wifi, http://192.168.x.x), Spotify refuses to return there.
//    The sign-in returns to http://127.0.0.1:<port>/callback/spotify instead, which the phone can't open; you copy
//    that page's address and paste it into the Music tab, which finishes the sign-in.
// The sign-in is kept in SillyTavern's settings (on your computer), so it works on every device after that.

const AUTH = 'https://accounts.spotify.com/authorize', TOKEN = 'https://accounts.spotify.com/api/token', API = 'https://api.spotify.com/v1';
export const SCOPES = ['playlist-read-private', 'playlist-read-collaborative', 'user-library-read', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing'];
const PENDING = 'moodweaver-spotify-signin';

// ---- SHA-256, for pages that aren't a "secure context" (http on a home network has no crypto.subtle) ----
function sha256(bytes) {
    const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const len = bytes.length, padded = new Uint8Array(Math.ceil((len + 9) / 64) * 64); padded.set(bytes); padded[len] = 0x80;
    const dv = new DataView(padded.buffer); dv.setUint32(padded.length - 4, len * 8 >>> 0); dv.setUint32(padded.length - 8, Math.floor(len / 0x20000000));
    const w = new Uint32Array(64), r = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < padded.length; o += 64) {
        for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
        for (let i = 16; i < 64; i++) w[i] = (w[i - 16] + (r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3)) + w[i - 7] + (r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10))) >>> 0;
        let [a, b, c, d, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
            const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
            h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    const out = new Uint8Array(32), ov = new DataView(out.buffer); H.forEach((v, i) => ov.setUint32(i * 4, v)); return out;
}
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomText = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a).slice(0, n); };

// ---- Where Spotify sends you back ----
const loopback = () => ['127.0.0.1', '[::1]', '::1'].includes(location.hostname);
export const canReturn = () => loopback() || location.protocol === 'https:';
export const autoRedirect = () => new URL('/callback/spotify', location.origin).toString();
export const pasteRedirect = () => `http://127.0.0.1:${location.port || (location.protocol === 'https:' ? '443' : '80')}/callback/spotify`;
export const redirectFor = store => canReturn() ? autoRedirect() : (String(store.redirect ?? '').trim() || pasteRedirect());

// Everything for a sign-in, made ahead of the tap so the link opens straight away (a phone blocks new tabs
// opened after a pause). Kept on the page and in settings, so it survives the trip to Spotify and back.
// A sign-in started in the last 20 minutes is reused, so redrawing the panel can't spoil one you're in the middle of.
export function prepareSignIn(store) {
    const redirect = redirectFor(store), clientId = String(store.clientId ?? '').trim(), old = store.pending;
    const reuse = old?.verifier && old.redirect === redirect && old.clientId === clientId && Date.now() - old.at < 20 * 60000;
    const verifier = reuse ? old.verifier : randomText(64), state = reuse ? old.state : randomText(16);
    const challenge = b64url(sha256(new TextEncoder().encode(verifier)));
    const url = `${AUTH}?${new URLSearchParams({ response_type: 'code', client_id: String(store.clientId ?? '').trim(), scope: SCOPES.join(' '), redirect_uri: redirect, code_challenge_method: 'S256', code_challenge: challenge, state })}`;
    if (reuse) return { url, redirect, paste: !canReturn() };
    const pending = { verifier, state, redirect, clientId, at: Date.now() };
    store.pending = pending; try { localStorage.setItem(PENDING, JSON.stringify(pending)); } catch { /* private mode */ }
    return { url, redirect, paste: !canReturn() };
}
const pendingOf = (store, state) => {
    let local = null; try { local = JSON.parse(localStorage.getItem(PENDING) ?? 'null'); } catch { /* none */ }
    return [store.pending, local].find(p => p?.verifier && (!state || p.state === state)) ?? null;
};
// The code and state from a pasted address, or from SillyTavern's own return (?source=spotify&query=…).
export function codeFrom(text) {
    const s = String(text ?? '').trim(); if (!s) return null;
    let url; try { url = new URL(s.includes('://') ? s : `http://x/?${s.replace(/^.*\?/, '')}`); } catch { return null; }
    let q = url.searchParams;
    if (q.get('source') === 'spotify' && q.get('query')) q = new URLSearchParams(q.get('query'));
    if (q.get('error')) return { error: q.get('error') };
    return q.get('code') ? { code: q.get('code'), state: q.get('state') ?? '' } : null;
}
async function tokenRequest(body) {
    const res = await fetch(TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) throw new Error(data.error_description || data.error || `Spotify said ${res.status}`);
    return data;
}
const keep = (store, data) => { store.auth = { access: data.access_token, refresh: data.refresh_token || store.auth?.refresh || '', exp: Date.now() + (Number(data.expires_in) || 3600) * 1000, scope: data.scope ?? '' }; };
// Finish a sign-in from a pasted address or the page's own return. Returns true when signed in.
export async function finishSignIn(store, text) {
    const got = codeFrom(text);
    if (!got) throw new Error('That address has no sign-in code in it. Copy the whole address from the page Spotify sent you to.');
    if (got.error) throw new Error(got.error === 'access_denied' ? 'Spotify says the sign-in was cancelled.' : `Spotify said: ${got.error}`);
    const p = pendingOf(store, got.state);
    if (!p) throw new Error('This sign-in was started somewhere else or has expired. Tap Sign in to Spotify again.');
    const data = await tokenRequest({ client_id: String(store.clientId ?? '').trim(), grant_type: 'authorization_code', code: got.code, redirect_uri: p.redirect, code_verifier: p.verifier });
    keep(store, data); store.pending = null; try { localStorage.removeItem(PENDING); } catch { /* fine */ }
    return true;
}
// SillyTavern's own return: the page loads with ?source=spotify. Only ours if the state matches one we started.
export function returnedCode() {
    const q = new URLSearchParams(location.search);
    if (q.get('source') !== 'spotify' || !q.get('query')) return '';
    return location.href;
}
export function clearReturn() { try { history.replaceState({}, document.title, location.pathname); } catch { /* fine */ } }
export const signedIn = store => Boolean(store.auth?.refresh || store.auth?.access);
export function signOut(store) { store.auth = null; store.pending = null; }

// ---- Calls ----
let refreshing = null, backoffUntil = 0, saveHook = () => {};
// app/music.js passes its save, so a refreshed sign-in is kept.
export const onSignInChange = fn => { saveHook = fn; };
async function token(store) {
    if (!store.auth) throw Object.assign(new Error('Not signed in to Spotify.'), { code: 'signin' });
    if (store.auth.access && store.auth.exp - Date.now() > 60000) return store.auth.access;
    refreshing ??= tokenRequest({ grant_type: 'refresh_token', refresh_token: store.auth.refresh, client_id: String(store.clientId ?? '').trim() })
        .then(data => { keep(store, data); saveHook(); return store.auth.access; })
        .catch(err => { if (/invalid_grant|revoked|expired/i.test(err.message)) { store.auth = null; saveHook(); throw Object.assign(new Error('The Spotify sign-in ran out. Sign in again from the Music tab.'), { code: 'signin' }); } throw err; })
        .finally(() => { refreshing = null; });
    return refreshing;
}
// One call. 401 refreshes once; 429 waits what Spotify asks (up to 20 s) once; a missing device says so plainly.
export async function call(store, method, path, { query, body } = {}, retried = false) {
    if (Date.now() < backoffUntil) throw Object.assign(new Error('Spotify asked Moodweaver to slow down for a moment.'), { code: 'slow' });
    const url = `${path.startsWith('http') ? path : API + path}${query ? `?${new URLSearchParams(query)}` : ''}`;
    const res = await fetch(url, { method, headers: { Authorization: `Bearer ${await token(store)}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 204 || res.status === 202) return null;
    if (res.status === 401 && !retried) { store.auth.exp = 0; return call(store, method, path, { query, body }, true); }
    if (res.status === 429) {
        const wait = Math.min(20, Number(res.headers.get('Retry-After')) || 5);
        if (!retried && wait <= 5) { await new Promise(r => setTimeout(r, wait * 1000)); return call(store, method, path, { query, body }, true); }
        backoffUntil = Date.now() + wait * 1000; throw Object.assign(new Error('Spotify asked Moodweaver to slow down for a moment.'), { code: 'slow' });
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const reason = data?.error?.reason ?? '', msg = data?.error?.message ?? `Spotify said ${res.status}`;
        if (reason === 'NO_ACTIVE_DEVICE' || /no active device/i.test(msg)) throw Object.assign(new Error('Open Spotify on your phone or computer first.'), { code: 'device' });
        if (reason === 'PREMIUM_REQUIRED') throw Object.assign(new Error('Playing songs from another app needs Spotify Premium.'), { code: 'premium' });
        throw Object.assign(new Error(msg), { code: String(res.status), status: res.status });
    }
    return data;
}
async function all(store, path, query = {}, cap = 4000) {
    const out = []; let next = null, page = await call(store, 'GET', path, { query: { limit: 50, ...query } });
    while (page) { out.push(...(page.items ?? [])); next = page.next; if (!next || out.length >= cap) break; page = await call(store, 'GET', next); }
    return out;
}

// ---- Library ----
export const me = store => call(store, 'GET', '/me');
// Your playlists, marked with whether Spotify lets an app read their songs (yours, or ones you collaborate on).
export async function playlists(store) {
    const who = await me(store), items = await all(store, '/me/playlists');
    return items.filter(Boolean).map(p => ({ id: p.id, name: p.name ?? 'Untitled', owned: p.owner?.id === who?.id || Boolean(p.collaborative), count: p.items?.total ?? p.tracks?.total ?? 0, snap: p.snapshot_id ?? '' }));
}
const trackOf = x => { const t = x?.item ?? x?.track; return t && t.type !== 'episode' && !t.is_local && t.uri?.startsWith('spotify:track:') ? { uri: t.uri, n: t.name ?? '', a: (t.artists ?? []).map(a => a.name).join(', '), al: t.album?.name ?? '', ms: t.duration_ms ?? 0 } : null; };
// A playlist's songs (Spotify renamed /tracks to /items in 2026; older apps still use /tracks). 'liked' is Liked Songs.
export async function songsOf(store, id) {
    if (id === 'liked') return (await all(store, '/me/tracks')).map(trackOf).filter(Boolean);
    try { return (await all(store, `/playlists/${encodeURIComponent(id)}/items`, { additional_types: 'track' })).map(trackOf).filter(Boolean); }
    catch (err) { if (![404, 400].includes(err.status)) throw err; return (await all(store, `/playlists/${encodeURIComponent(id)}/tracks`)).map(trackOf).filter(Boolean); }
}

// ---- Playback ----
export const player = store => call(store, 'GET', '/me/player', { query: { additional_types: 'track' } });
export const devices = async store => (await call(store, 'GET', '/me/player/devices'))?.devices ?? [];
export const play = (store, uris, device) => call(store, 'PUT', '/me/player/play', { query: device ? { device_id: device } : undefined, body: { uris } });
export const resume = (store, device) => call(store, 'PUT', '/me/player/play', { query: device ? { device_id: device } : undefined });
export const pause = (store, device) => call(store, 'PUT', '/me/player/pause', { query: device ? { device_id: device } : undefined });
export const volume = (store, v, device) => call(store, 'PUT', '/me/player/volume', { query: { volume_percent: Math.round(Math.max(0, Math.min(100, v))), ...(device ? { device_id: device } : {}) } });
export const repeatOff = (store, device) => call(store, 'PUT', '/me/player/repeat', { query: { state: 'off', ...(device ? { device_id: device } : {}) } }).catch(() => null);
export const shuffleOff = (store, device) => call(store, 'PUT', '/me/player/shuffle', { query: { state: 'false', ...(device ? { device_id: device } : {}) } }).catch(() => null);
