// The ♫ Music tab: sign in to Spotify, what's playing and why, your playlists, the song sheet and song tags.
// Everything is a tap: chips and big buttons, no sliders or dragging.
import { characterNames, exportSheet, feedback, finishSignIn, followName, importSheet, loadPlaylists, mus, music, nextBest, setOn, setTag, signOut, start, sync, toggleLock, togglePlay, togglePlaylist, usableSongs } from '../app/music.js';
import { canReturn, prepareSignIn, redirectFor, signedIn } from '../app/spotify.js';
import { ctx, ui } from '../app/state.js';
import { CHANGE_CHOICES, HOLD_CHOICES, THEME_CHOICES } from '../data/catalogue/music.js';
import { DYN_GROUPS, ENERGY, FAMILIES, HEAT, MOMENTS, PLACES, cleanTags, describe, emptyTags, labelOf, norm } from '../engine/music.js';
import { escapeHtml as esc } from '../engine/util.js';
import { moodTone } from '../engine/tone.js';
import { getState, getUserState } from '../app/chat.js';

// The look: a small night sky of its own. What's playing is a planet (the cover art) with an orbit ring and a
// moon that circles while the song plays, lit in the colour of the followed person's leading feeling. Below it
// the song's path is a thin line with a star at its head. Each drawer opens on a little glowing orb, and
// ticked playlists are lit stars. Taps only, big targets.
const chip = (attrs, on, label, title = '') => `<button type="button" class="mw-mchip" ${attrs} aria-pressed="${Boolean(on)}"${title ? ` title="${esc(title)}"` : ''}>${esc(label)}</button>`;
const choice = (field, value, now, label) => chip(`data-music="set" data-k="${field}" data-v="${esc(value)}"`, String(now) === String(value), label);
const toneVars = t => `--mw-tone:${t.lead};--mw-shade:${t.shade}`;
function tones() {
    const char = moodTone(getState()?.moods), user = moodTone(getUserState()?.moods);
    return { char, user, both: char };
}
// A drawer: a glowing orb, the title, one quiet line under it, and a chevron.
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const drawer = (fold, icon, title, sub, body, open) => `<details class="mw-music-drawer" ${open ? 'open' : ''} data-music-fold="${fold}">
    <summary><span class="mw-music-orb" aria-hidden="true">${icon}</span><span class="mw-music-dt"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="mw-music-chev" aria-hidden="true">›</span></summary>
    <div class="mw-music-dbody">${body}</div></details>`;

function setupCard(m) {
    const paste = !canReturn(), ready = Boolean(String(m.clientId).trim());
    let link = '';
    if (ready) { const p = prepareSignIn(m); ctx().saveSettingsDebounced(); link = p.url; }
    const step = (n, body, lit) => `<li class="${lit ? 'is-lit' : ''}"><span class="mw-music-star" aria-hidden="true">${n}</span><div>${body}</div></li>`;
    return `<section class="mw-music-hero mw-music-setup">
        <div class="mw-music-planet is-idle" aria-hidden="true"><span class="mw-music-ring"></span><span class="mw-music-ball">♫</span></div>
        <h3 class="mw-music-title">Connect your Spotify</h3><p class="mw-music-sub">Once, about five minutes. Moodweaver only plays your own playlists.</p>
        <ol class="mw-music-path">
            ${step(1, `On the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">Spotify developer dashboard</a>, open your app › Settings › Edit. Under <b>Redirect URIs</b> add this address, press <b>Add</b>, then <b>Save</b>:
                <input type="text" readonly class="mw-music-copy" value="${esc(redirectFor(m))}" aria-label="Redirect address">
                ${paste ? `<span class="mw-fine">Type it exactly like this, with 127.0.0.1, even though you open SillyTavern at ${esc(location.host)}. Spotify only accepts this kind of address without https.</span>` : ''}`, true)}
            ${step(2, 'Tick <b>Web API</b> in the same settings.', true)}
            ${step(3, `Copy the <b>Client ID</b> from that page and paste it here:
                <input type="text" data-music-field="clientId" value="${esc(m.clientId)}" placeholder="Client ID" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Spotify Client ID">`, ready)}
            ${step(4, ready ? `<a class="mw-music-cta" href="${esc(link)}" ${paste ? 'target="_blank" rel="noopener"' : ''}>♫ Sign in to Spotify</a>` : '<span class="mw-fine">The sign-in button appears once the Client ID is in.</span>', ready)}
            ${paste && ready ? step(5, `Spotify then opens a page that can't load (it says it can't connect to 127.0.0.1). That's expected. <b>Copy that page's whole address</b> (press and hold the address bar › Copy), come back here and paste it:
                <textarea data-music-field="paste" rows="3" placeholder="http://127.0.0.1:…/callback/spotify?code=…" aria-label="Paste the address here"></textarea>
                <button type="button" class="mw-music-cta" data-music="finish">Finish sign-in</button>`, false) : ''}
        </ol></section>`;
}
// Small line icons drawn in the panel's own colours (emoji locks and arrows look out of place on a night sky).
const ICONS = {
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
    pause: '<rect x="7" y="5.5" width="3.6" height="13" rx="1" fill="currentColor"/><rect x="13.4" y="5.5" width="3.6" height="13" rx="1" fill="currentColor"/>',
    next: '<path d="M6 6.5v11l8-5.5z" fill="currentColor"/><path d="M17.5 6.5v11"/>',
};
const icon = k => `<svg class="mw-music-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
function nowCard(m, tone) {
    const n = mus.now, snap = mus.latest, playing = Boolean(n?.playing && m.on);
    const why = (mus.why ?? []).filter(Boolean).slice(0, 4);
    const elapsed = n ? (n.playing ? Date.now() - n.started : n.progress) : 0, pct = n?.ms ? Math.max(0, Math.min(100, elapsed / n.ms * 100)) : 0, left = n?.ms ? Math.max(0, n.ms - elapsed) : 0;
    return `<section class="mw-music-hero ${playing ? 'is-playing' : ''}" style="${toneVars(tone)}">
        <button type="button" class="mw-music-power" data-music="toggle-on" aria-pressed="${Boolean(m.on)}"><span aria-hidden="true"></span>${m.on ? 'Music on' : 'Music off'}</button>
        <div class="mw-music-planet ${n ? '' : 'is-idle'}" aria-hidden="true"><span class="mw-music-ring"><i></i></span>${n?.art ? `<img class="mw-music-ball" src="${esc(n.art)}" alt="">` : '<span class="mw-music-ball">♫</span>'}</div>
        <h3 class="mw-music-title">${esc(n?.name || (m.on ? 'Waiting for the next scene' : 'The music is resting'))}</h3>
        <p class="mw-music-sub">${n ? `${esc(n.artist ?? '')}${n.device ? ` · on ${esc(n.device)}` : ''}` : m.on ? 'A song starts after the next reply.' : 'Switch it on and the scene picks the songs.'}</p>
        ${n?.ms ? `<div class="mw-music-track" aria-hidden="true"><i style="width:${pct.toFixed(1)}%;animation-duration:${Math.round(left)}ms;animation-play-state:${playing ? 'running' : 'paused'}"></i></div>` : ''}
        <div class="mw-music-transport">
            <button type="button" class="mw-music-round" data-music="lock" aria-pressed="${mus.locked}" aria-label="${mus.locked ? 'Unlock: let the scene change songs again' : 'Lock: keep this music'}">${icon(mus.locked ? 'lock' : 'unlock')}</button>
            <button type="button" class="mw-music-round is-main" data-music="play" aria-label="${n?.playing ? 'Pause' : 'Play'}">${icon(n?.playing ? 'pause' : 'play')}</button>
            <button type="button" class="mw-music-round" data-music="next" aria-label="Next best song">${icon('next')}</button>
        </div>
        ${n ? `<div class="mw-music-verdict"><button type="button" data-music="fits">✦ Fits</button><button type="button" data-music="nothere">✕ Not here</button><button type="button" data-music="edit-now">✎ Tags</button></div>` : ''}
        ${why.length ? `<div class="mw-music-why"><small>Picked for</small>${why.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}
        ${snap ? `<p class="mw-music-scene">${esc(describe(snap, snap.name))}</p>` : ''}
        ${mus.error ? `<p class="mw-music-note is-warn">${esc(mus.error)}</p>` : mus.status ? `<p class="mw-music-note">${esc(mus.status)}</p>` : ''}
        ${mus.loading ? `<p class="mw-music-note">${esc(mus.loading)}</p>` : ''}
    </section>`;
}
// Whose moods pick the music: three little planets, the same orbs as the people at the top of the panel.
function followCard(m, t) {
    const orb = (who, name, tag, tone, two) => `<button type="button" class="mw-music-who" data-music="set" data-k="follow" data-v="${who}" aria-pressed="${m.follow === who}" style="${toneVars(tone)}">
        <span class="mw-music-who-orbs">${two ? `<i style="${toneVars(t.char)}">${esc(followName('char')[0] ?? '')}</i><i style="${toneVars(t.user)}">${esc(followName('user')[0] ?? '')}</i>` : `<i>${esc(String(name)[0] ?? '')}</i>`}</span>
        <b>${esc(name)}</b><small>${tag}</small></button>`;
    return `<section class="mw-music-follow"><p class="mw-music-label">Follow whose moods</p><div class="mw-music-whos">
        ${orb('char', followName('char'), '{{char}}', t.char)}${orb('user', followName('user'), '{{user}}', t.user)}${orb('both', 'Both', 'together', t.char, true)}</div></section>`;
}
// You may have hundreds of playlists: the ticked ones are lit stars on top, the rest are found by searching (or a
// tap on "Show all"), in one quiet list.
function playlistCard(m) {
    const all = Object.entries(m.playlists).sort((a, b) => a[1].name.localeCompare(b[1].name)), ticked = all.filter(([, p]) => p.on);
    const q = norm(ui.musicPlSearch ?? ''), others = all.filter(([, p]) => !p.on), found = q ? all.filter(([, p]) => norm(p.name).includes(q)) : ui.musicPlAll ? others : [];
    const row = ([id, p]) => `<button type="button" class="mw-music-row" data-music="playlist" data-id="${esc(id)}" aria-pressed="${Boolean(p.on)}"${p.owned ? '' : ' disabled title="Spotify only lets apps read playlists you made. Copy it into a new playlist of your own to use it."'}><span class="mw-music-tick" aria-hidden="true">${p.on ? '✦' : '✧'}</span><span class="mw-music-name">${esc(p.name)}</span><small>${p.count ? p.count : ''}</small></button>`;
    const body = `${ticked.length ? `<p class="mw-music-label">Playing from</p><div class="mw-music-rows">${ticked.map(row).join('')}</div>` : all.length ? '<p class="mw-music-note">Nothing lit yet: find a playlist and tap it.</p>' : ''}
        ${all.length ? `<input type="search" class="mw-music-search" data-music-field="plsearch" value="${esc(ui.musicPlSearch ?? '')}" placeholder="✧  Find a playlist by name or emoji" aria-label="Find a playlist">
        ${q ? `<div class="mw-music-rows">${found.slice(0, 40).map(row).join('') || '<p class="mw-music-note">No playlist with that in its name.</p>'}</div>${found.length > 40 ? `<p class="mw-music-note">${found.length - 40} more: type a little more.</p>` : ''}`
            : `<button type="button" class="mw-music-quiet" data-music="plall">${ui.musicPlAll ? 'Hide the rest' : `Show all ${others.length} others`}</button>${ui.musicPlAll ? `<div class="mw-music-rows">${found.map(row).join('')}</div>` : ''}`}` : '<p class="mw-music-note">None loaded yet.</p>'}
        <button type="button" class="mw-music-quiet" data-music="load">↻ Load playlists and songs from Spotify</button>
        <p class="mw-fine">Greyed ones were made by someone else: Spotify won't share their songs. In Spotify, select all their songs › Add to playlist › New playlist to make your own copy.</p>`;
    return drawer('playlists', '✦', 'Playlists', `${ticked.length} lit of ${all.length} · ${plural(usableSongs(m).length, 'song')}`, body, ui.musicOpen?.playlists);
}
function sheetCard(m, asDrawer = true) {
    const imp = mus.lastImport;
    const body = `<p class="mw-music-note">Tag songs in a spreadsheet with dropdowns (Google Sheets, Excel or Numbers), then bring it back. exportify.net CSVs work too.</p>
        <div class="mw-music-tiles"><button type="button" class="mw-music-tile" data-music="export"><span aria-hidden="true">☾</span><b>Export</b><small>the sheet to fill in</small></button>
        <label class="mw-music-tile mw-music-file"><span aria-hidden="true">☽</span><b>Import</b><small>a filled sheet or CSV</small><input type="file" data-music-field="import" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label></div>
        ${imp ? `<p class="mw-music-note">Last import (${esc(imp.file)}): ${imp.songs} songs tagged${imp.added ? `, ${imp.added} songs added` : ''}${imp.playlists ? `, ${imp.playlists} playlists` : ''}${imp.chars ? `, ${imp.chars} characters` : ''}.${imp.unknown.length ? ` Not recognised: ${esc(imp.unknown.join(', '))}.` : ''}${imp.unmatched.length ? ` Not found: ${esc(imp.unmatched.join(', '))}.` : ''}</p>` : ''}`;
    return asDrawer ? drawer('sheet', '◐', 'Song sheet', 'Sort and tag songs in a spreadsheet', body, ui.musicOpen?.sheet) : `<section class="mw-music-follow">${body}</section>`;
}
function tagEditor(m, uri) {
    const s = m.songs[uri]; if (!s) return '';
    const t = cleanTags(m.tags[uri] ?? emptyTags()), tag = (k, v, label, on) => chip(`data-music="tag" data-uri="${esc(uri)}" data-k="${k}" data-v="${esc(v)}"`, on, label);
    const group = (title, body, open = true) => `<details class="mw-music-tags" data-music-group="${esc(title)}" ${open ? 'open' : ''}><summary>${title}</summary><div class="mw-mchips">${body}</div></details>`;
    const names = ['{{char}}', '{{user}}', 'Any', ...characterNames()];
    return `<div class="mw-music-editor"><div class="mw-music-editor-head"><span class="mw-music-orb" aria-hidden="true">♪</span><span class="mw-music-dt"><b>${esc(s.n)}</b><small>${esc(s.a)}</small></span><button type="button" class="mw-music-quiet" data-music="close-edit">Done</button></div>
        <p class="mw-music-note">Tap to light or dim. This song also gets its playlists' tags; what you set here adds to them.</p>
        ${group('Feeling', FAMILIES.map(f => tag('f', f.id, f.label, t.f.includes(f.id))).join(''))}
        ${group('Moment', MOMENTS.map(x => tag('mo', x.id, x.label, t.mo.includes(x.id))).join(''))}
        ${group('Energy and heat', ENERGY.map(x => tag('e', x.id, x.label, t.e === x.id)).join('') + HEAT.map(x => tag('h', x.id, x.label, t.h === x.id)).join(''))}
        ${group('Character', names.map(n => tag('c', n, n, t.c.some(c => norm(c) === norm(n)))).join(''))}
        ${group('Dynamic', DYN_GROUPS.map(x => tag('d', x.id, x.label, t.d.includes(x.id))).join(''), false)}
        ${group('Place', PLACES.map(x => tag('p', x.id, x.label, t.p.includes(x.id))).join(''), false)}
        ${group('Never during', [...FAMILIES.map(x => tag('nv', `f:${x.id}`, x.label, t.nv.includes(`f:${x.id}`))), ...MOMENTS.map(x => tag('nv', `mo:${x.id}`, x.label, t.nv.includes(`mo:${x.id}`))), ...HEAT.map(x => tag('nv', `h:${x.id}`, x.label, t.nv.includes(`h:${x.id}`)))].join(''), false)}
        <label class="mw-music-note">Exact moods (names separated by commas, as in the sheet)<input type="text" data-music-field="moods" data-uri="${esc(uri)}" value="${esc(t.m.map(id => labelOf('m', id)).join(', '))}"></label>
        <div class="mw-mchips">${tag('th', '1', '★ Theme song', t.th)}${tag('fav', '1', '♥ Favourite', t.fav)}${tag('off', '1', 'Off (never play)', t.off)}</div></div>`;
}
function songsCard(m) {
    const term = norm(ui.musicSearch ?? ''), songs = usableSongs(m);
    const hits = (term ? songs.filter(x => norm(`${x.song.n} ${x.song.a}`).includes(term)) : songs).slice(0, 40);
    const tagged = songs.filter(x => m.tags[x.uri]).length;
    const body = `${ui.musicSong ? tagEditor(m, ui.musicSong) : ''}
        <input type="search" class="mw-music-search" data-music-field="search" value="${esc(ui.musicSearch ?? '')}" placeholder="✧  Find a song or artist" aria-label="Find a song">
        <div class="mw-music-rows">${hits.map(x => `<button type="button" class="mw-music-row is-song" data-music="edit" data-uri="${esc(x.uri)}" aria-pressed="${ui.musicSong === x.uri}"><span class="mw-music-tick" aria-hidden="true">${m.tags[x.uri] ? '✦' : '·'}</span><span class="mw-music-name"><b>${esc(x.song.n)}</b><small>${esc(x.song.a)}</small></span></button>`).join('')}</div>
        ${songs.length > hits.length ? `<p class="mw-music-note">Showing ${hits.length} of ${songs.length}. Search to find others.</p>` : ''}`;
    return drawer('songs', '♪', 'Songs', `${plural(songs.length, 'song')} · ${tagged} with their own tags`, body, ui.musicOpen?.songs || ui.musicSong);
}
function settingsCard(m) {
    const body = `<p class="mw-music-label">Change songs</p><div class="mw-mchips">${CHANGE_CHOICES.map(([v, l]) => choice('change', v, m.change, l)).join('')}</div>
        <p class="mw-music-label">Shortest time before cutting a song</p><div class="mw-mchips">${HOLD_CHOICES.map(([v, l]) => choice('hold', v, m.hold, l)).join('')}</div>
        <p class="mw-music-label">Theme songs play</p><div class="mw-mchips">${THEME_CHOICES.map(([v, l]) => choice('themes', v, m.themes, l)).join('')}</div>
        <p class="mw-music-label">Extras</p><div class="mw-mchips">${chip('data-music="flag" data-k="fade"', m.fade, 'Fade on a cut')}${chip('data-music="flag" data-k="feel"', m.feel, 'Let the story feel the music')}</div>
        <p class="mw-fine">“Let the story feel the music” adds one short line (about 15 tokens) describing the music's feel, never its name, so Claude can match the mood. Off by default: the music otherwise costs no tokens at all.</p>
        <p class="mw-music-label">Playing on</p><p class="mw-music-note">${esc(m.deviceName || 'Whichever Spotify is open')}</p>
        ${mus.devices.length > 1 ? `<div class="mw-mchips">${mus.devices.map(d => chip(`data-music="device" data-id="${esc(d.id)}"`, d.id === m.device, d.name)).join('')}</div>` : ''}
        <div class="mw-music-pair"><button type="button" class="mw-music-quiet" data-music="devices">Find my Spotify devices</button><button type="button" class="mw-music-quiet" data-music="signout">Sign out of Spotify</button></div>`;
    return drawer('settings', '☾', 'Music settings', `${(CHANGE_CHOICES.find(([v]) => v === m.change) ?? [, ''])[1]}`, body, ui.musicOpen?.settings);
}
export function musicView() {
    const m = music();
    if (!signedIn(m)) return `<div class="mw-music">${setupCard(m)}<div class="mw-music-drawers">${sheetCard(m)}</div></div>`;
    const t = tones(), lead = m.follow === 'user' ? t.user : t.char;
    return `<div class="mw-music">${nowCard(m, lead)}${followCard(m, t)}<div class="mw-music-drawers">${playlistCard(m)}${songsCard(m)}${sheetCard(m)}${settingsCard(m)}</div></div>`;
}

// ---- Taps ----
// Returns true when the tap was the Music tab's. redraw: the panel's render.
export async function musicClick(e, redraw) {
    const el = e.target.closest('[data-music]'); if (!el || !ui.panel?.contains(el)) return false;
    if (el.tagName === 'A') return true;
    const m = music(), a = el.dataset.music, save = () => ctx().saveSettingsDebounced();
    if (a === 'finish') { await finishSignIn(ui.panel.querySelector('[data-music-field="paste"]')?.value ?? ''); redraw(); }
    else if (a === 'toggle-on') await setOn(!m.on);
    else if (a === 'play') await togglePlay();
    else if (a === 'next') await nextBest();
    else if (a === 'lock') toggleLock();
    else if (a === 'fits') await feedback(true);
    else if (a === 'nothere') await feedback(false);
    else if (a === 'edit-now') { ui.musicSong = mus.now?.uri ?? ''; ui.musicOpen = { ...(ui.musicOpen ?? {}), songs: true }; redraw(); }
    else if (a === 'edit') { ui.musicSong = ui.musicSong === el.dataset.uri ? '' : el.dataset.uri; redraw(); }
    else if (a === 'close-edit') { ui.musicSong = ''; redraw(); }
    else if (a === 'tag') setTag(el.dataset.uri, el.dataset.k, el.dataset.v);
    else if (a === 'playlist') { togglePlaylist(el.dataset.id); redraw(); }
    else if (a === 'plall') { ui.musicPlAll = !ui.musicPlAll; redraw(); }
    else if (a === 'load') await loadPlaylists();
    else if (a === 'export') exportSheet();
    else if (a === 'set') { m[el.dataset.k] = ['hold'].includes(el.dataset.k) ? Number(el.dataset.v) : el.dataset.v; save(); redraw(); }
    else if (a === 'flag') { m[el.dataset.k] = !m[el.dataset.k]; save(); redraw(); }
    else if (a === 'devices') { await sync(); try { const { devices } = await import('../app/spotify.js'); mus.devices = await devices(m); } catch (err) { mus.error = err.message; } redraw(); }
    else if (a === 'device') { m.device = el.dataset.id; m.deviceName = mus.devices.find(d => d.id === el.dataset.id)?.name ?? ''; save(); if (m.on) await start(); redraw(); }
    else if (a === 'signout') signOut();
    return true;
}
export async function musicChange(e, redraw) {
    const el = e.target.closest('[data-music-field]'); if (!el) return false;
    const m = music(), f = el.dataset.musicField;
    if (f === 'clientId') { if (m.clientId === el.value.trim()) return true; m.clientId = el.value.trim(); m.pending = null; ctx().saveSettingsDebounced(); redraw(); }
    else if (f === 'import' && el.files?.[0]) { await importSheet(el.files[0]); el.value = ''; redraw(); }
    else if (f === 'moods') setTag(el.dataset.uri, 'm', el.value);
    else if (f === 'search') { ui.musicSearch = el.value; redraw(); }
    else if (f === 'plsearch') { ui.musicPlSearch = el.value; redraw(); }
    return true;
}
export function musicInput(e, redraw) {
    const el = e.target.closest('[data-music-field="search"],[data-music-field="plsearch"]'); if (!el) return false;
    const f = el.dataset.musicField; if (f === 'search') ui.musicSearch = el.value; else ui.musicPlSearch = el.value;
    clearTimeout(ui.musicSearchTimer); ui.musicSearchTimer = setTimeout(() => { redraw(); const box = ui.panel?.querySelector(`[data-music-field="${f}"]`); if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); } }, 400);
    return true;
}
export function musicFold(e) {
    const d = e.target; if (!d?.matches?.('[data-music-fold]')) return;
    ui.musicOpen = { ...(ui.musicOpen ?? {}), [d.dataset.musicFold]: d.open };
}
