// The ♫ Music tab: sign in to Spotify, what's playing and why, your playlists, the song sheet and song tags.
// Everything is a tap: chips and big buttons, no sliders or dragging.
import { characterNames, exportSheet, feedback, finishSignIn, followName, importSheet, loadPlaylists, mus, music, nextBest, setOn, setTag, signOut, start, sync, toggleLock, togglePlay, togglePlaylist, usableSongs } from '../app/music.js';
import { canReturn, prepareSignIn, redirectFor, signedIn } from '../app/spotify.js';
import { ctx, ui } from '../app/state.js';
import { CHANGE_CHOICES, HOLD_CHOICES, THEME_CHOICES } from '../data/catalogue/music.js';
import { DYN_GROUPS, ENERGY, FAMILIES, HEAT, MOMENTS, PLACES, cleanTags, describe, emptyTags, labelOf, norm } from '../engine/music.js';
import { escapeHtml as esc } from '../engine/util.js';

const chip = (attrs, on, label, title = '') => `<button type="button" class="mw-mchip" ${attrs} aria-pressed="${Boolean(on)}"${title ? ` title="${esc(title)}"` : ''}>${esc(label)}</button>`;
const choice = (field, value, now, label) => chip(`data-music="set" data-k="${field}" data-v="${esc(value)}"`, String(now) === String(value), label);

function setupCard(m) {
    const paste = !canReturn(), ready = Boolean(String(m.clientId).trim());
    let link = '';
    if (ready) { const p = prepareSignIn(m); ctx().saveSettingsDebounced(); link = p.url; }
    return `<section class="mw-music-card">
        <h3>Connect Spotify</h3>
        <ol class="mw-music-steps">
            <li>On the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">Spotify developer dashboard</a>, open your app › Settings › Edit. Under <b>Redirect URIs</b> add this address, press <b>Add</b>, then <b>Save</b>:
                <input type="text" readonly class="mw-music-copy" value="${esc(redirectFor(m))}" aria-label="Redirect address">
                ${paste ? `<span class="mw-fine">Type it exactly like this, with 127.0.0.1, even though you open SillyTavern at ${esc(location.host)}. Spotify only accepts this kind of address without https.</span>` : ''}</li>
            <li>Tick <b>Web API</b> in the same settings.</li>
            <li>Copy the <b>Client ID</b> from that page and paste it here:
                <input type="text" data-music-field="clientId" value="${esc(m.clientId)}" placeholder="Client ID" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Spotify Client ID"></li>
            <li>${ready ? `<a class="mw-music-big" href="${esc(link)}" ${paste ? 'target="_blank" rel="noopener"' : ''}>♫ Sign in to Spotify</a>` : '<span class="mw-fine">The sign-in button appears once the Client ID is in.</span>'}</li>
            ${paste && ready ? `<li>Spotify then opens a page that can't load (it says it can't connect to 127.0.0.1). That's expected. <b>Copy that page's whole address</b> (press and hold the address bar › Copy), come back here and paste it:
                <textarea data-music-field="paste" rows="3" placeholder="http://127.0.0.1:…/callback/spotify?code=…" aria-label="Paste the address here"></textarea>
                <button type="button" class="mw-music-big" data-music="finish">Finish sign-in</button></li>` : ''}
        </ol></section>`;
}
function nowCard(m) {
    const n = mus.now, snap = mus.latest;
    const why = (mus.why ?? []).filter(Boolean).slice(0, 4).join(' · ');
    return `<section class="mw-music-card mw-music-now">
        <div class="mw-music-np">${n?.art ? `<img src="${esc(n.art)}" alt="" width="64" height="64">` : '<span class="mw-music-art" aria-hidden="true">♫</span>'}
            <div><b>${esc(n?.name || (m.on ? 'Nothing playing yet' : 'Music is off'))}</b><small>${esc(n?.artist ?? '')}${n?.device ? ` · on ${esc(n.device)}` : ''}</small>
            ${why ? `<i>Picked for: ${esc(why)}</i>` : ''}${snap ? `<i class="mw-music-scene">Scene: ${esc(describe(snap, snap.name))}</i>` : ''}</div></div>
        <div class="mw-music-controls">
            ${chip('data-music="toggle-on"', m.on, m.on ? 'Music on' : 'Music off')}
            <button type="button" data-music="play" aria-label="${n?.playing ? 'Pause' : 'Play'}">${n?.playing ? '⏸' : '▶'}</button>
            <button type="button" data-music="next" aria-label="Next best song">⏭</button>
            ${chip('data-music="lock"', mus.locked, mus.locked ? '🔒 Locked' : '🔓 Lock')}
        </div>
        ${n ? `<div class="mw-music-controls"><button type="button" data-music="fits">✓ Fits</button><button type="button" data-music="nothere">✗ Not here</button><button type="button" data-music="edit-now">✎ Tags</button></div>` : ''}
        ${mus.error ? `<p class="mw-warn">${esc(mus.error)}</p>` : mus.status ? `<p class="mw-fine">${esc(mus.status)}</p>` : ''}
        ${mus.loading ? `<p class="mw-fine">${esc(mus.loading)}</p>` : ''}
    </section>`;
}
function followCard(m) {
    return `<section class="mw-music-card"><h3>Follow</h3><div class="mw-mchips">
        ${choice('follow', 'char', m.follow, `Follow ${followName('char')} ({{char}})`)}${choice('follow', 'user', m.follow, `Follow ${followName('user')} ({{user}})`)}${choice('follow', 'both', m.follow, 'Follow both')}</div>
        <p class="mw-fine">Whose moods pick the music. Songs tagged for that person (by name, {{char}} or {{user}}) win.</p></section>`;
}
function playlistCard(m) {
    const list = Object.entries(m.playlists).sort((a, b) => (b[1].on - a[1].on) || a[1].name.localeCompare(b[1].name)), on = list.filter(([, p]) => p.on).length;
    return `<details class="mw-music-card" ${ui.musicOpen?.playlists ? 'open' : ''} data-music-fold="playlists"><summary><h3>Playlists</h3><small>${on} ticked · ${usableSongs(m).length} songs</small></summary>
        <div class="mw-mchips">${list.map(([id, p]) => chip(`data-music="playlist" data-id="${esc(id)}"${!p.owned ? ' disabled' : ''}`, p.on, `${p.name}${p.count ? ` (${p.count})` : ''}`, p.owned ? '' : 'Spotify only lets apps read playlists you made. Copy it into a new playlist of your own to use it.')).join('') || '<span class="mw-fine">None loaded yet.</span>'}</div>
        <div class="mw-actions"><button type="button" data-music="load">↻ Load playlists and songs</button></div>
        <p class="mw-fine">Greyed ones were made by someone else: Spotify won't share their songs. In Spotify, select all their songs › Add to playlist › New playlist to make your own copy.</p></details>`;
}
function sheetCard(m) {
    const imp = mus.lastImport;
    return `<section class="mw-music-card"><h3>Song sheet</h3>
        <p class="mw-fine">Tag your songs in a spreadsheet with dropdowns (Google Sheets or Excel), then bring it back. exportify.net CSVs can be imported too: they add those songs straight away.</p>
        <div class="mw-music-controls"><button type="button" class="mw-music-big" data-music="export">⇩ Export song sheet</button>
        <label class="mw-music-big mw-music-file">⇧ Import song sheet<input type="file" data-music-field="import" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label></div>
        ${imp ? `<p class="mw-fine">Last import (${esc(imp.file)}): ${imp.songs} songs tagged${imp.added ? `, ${imp.added} songs added` : ''}${imp.playlists ? `, ${imp.playlists} playlists` : ''}${imp.chars ? `, ${imp.chars} characters` : ''}.${imp.unknown.length ? ` Not recognised: ${esc(imp.unknown.join(', '))}.` : ''}${imp.unmatched.length ? ` Not found: ${esc(imp.unmatched.join(', '))}.` : ''}</p>` : ''}</section>`;
}
function tagEditor(m, uri) {
    const s = m.songs[uri]; if (!s) return '';
    const t = cleanTags(m.tags[uri] ?? emptyTags()), tag = (k, v, label, on) => chip(`data-music="tag" data-uri="${esc(uri)}" data-k="${k}" data-v="${esc(v)}"`, on, label);
    const group = (title, body, open = true) => `<details class="mw-music-tags" data-music-group="${esc(title)}" ${open ? 'open' : ''}><summary>${title}</summary><div class="mw-mchips">${body}</div></details>`;
    const names = ['{{char}}', '{{user}}', 'Any', ...characterNames()];
    return `<div class="mw-music-editor"><div class="mw-music-editor-head"><b>${esc(s.n)}</b><small>${esc(s.a)}</small><button type="button" data-music="close-edit">Done</button></div>
        <p class="mw-fine">Tap to switch on or off. This song also gets its playlists' tags, and what you set here adds to them.</p>
        ${group('Feeling', FAMILIES.map(f => tag('f', f.id, f.label, t.f.includes(f.id))).join(''))}
        ${group('Moment', MOMENTS.map(x => tag('mo', x.id, x.label, t.mo.includes(x.id))).join(''))}
        ${group('Energy and heat', ENERGY.map(x => tag('e', x.id, x.label, t.e === x.id)).join('') + HEAT.map(x => tag('h', x.id, x.label, t.h === x.id)).join(''))}
        ${group('Character', names.map(n => tag('c', n, n, t.c.some(c => norm(c) === norm(n)))).join(''))}
        ${group('Dynamic', DYN_GROUPS.map(x => tag('d', x.id, x.label, t.d.includes(x.id))).join(''), false)}
        ${group('Place', PLACES.map(x => tag('p', x.id, x.label, t.p.includes(x.id))).join(''), false)}
        ${group('Never during', [...FAMILIES.map(x => tag('nv', `f:${x.id}`, x.label, t.nv.includes(`f:${x.id}`))), ...MOMENTS.map(x => tag('nv', `mo:${x.id}`, x.label, t.nv.includes(`mo:${x.id}`))), ...HEAT.map(x => tag('nv', `h:${x.id}`, x.label, t.nv.includes(`h:${x.id}`)))].join(''), false)}
        <label class="mw-fine">Exact moods (names separated by commas, as in the sheet)<input type="text" data-music-field="moods" data-uri="${esc(uri)}" value="${esc(t.m.map(id => labelOf('m', id)).join(', '))}"></label>
        <div class="mw-mchips">${tag('th', '1', '★ Theme song', t.th)}${tag('fav', '1', '♥ Favourite', t.fav)}${tag('off', '1', 'Off (never play)', t.off)}</div></div>`;
}
function songsCard(m) {
    const term = norm(ui.musicSearch ?? ''), songs = usableSongs(m);
    const hits = (term ? songs.filter(x => norm(`${x.song.n} ${x.song.a}`).includes(term)) : songs).slice(0, 40);
    const tagged = songs.filter(x => m.tags[x.uri]).length;
    return `<details class="mw-music-card" ${ui.musicOpen?.songs || ui.musicSong ? 'open' : ''} data-music-fold="songs"><summary><h3>Songs</h3><small>${songs.length} songs · ${tagged} with their own tags</small></summary>
        ${ui.musicSong ? tagEditor(m, ui.musicSong) : ''}
        <input type="search" data-music-field="search" value="${esc(ui.musicSearch ?? '')}" placeholder="Find a song or artist" aria-label="Find a song">
        <ul class="mw-music-list">${hits.map(x => `<li><button type="button" data-music="edit" data-uri="${esc(x.uri)}"><b>${esc(x.song.n)}</b><small>${esc(x.song.a)}${m.tags[x.uri] ? ' · tagged' : ''}</small></button></li>`).join('')}</ul>
        ${songs.length > hits.length ? `<p class="mw-fine">Showing ${hits.length} of ${songs.length}. Search to find others.</p>` : ''}</details>`;
}
function settingsCard(m) {
    return `<details class="mw-music-card" ${ui.musicOpen?.settings ? 'open' : ''} data-music-fold="settings"><summary><h3>Music settings</h3></summary>
        <p class="mw-music-label">Change songs</p><div class="mw-mchips">${CHANGE_CHOICES.map(([v, l]) => choice('change', v, m.change, l)).join('')}</div>
        <p class="mw-music-label">Shortest time before cutting a song</p><div class="mw-mchips">${HOLD_CHOICES.map(([v, l]) => choice('hold', v, m.hold, l)).join('')}</div>
        <p class="mw-music-label">Theme songs play</p><div class="mw-mchips">${THEME_CHOICES.map(([v, l]) => choice('themes', v, m.themes, l)).join('')}</div>
        <div class="mw-mchips">${chip('data-music="flag" data-k="fade"', m.fade, 'Fade on a cut')}${chip('data-music="flag" data-k="feel"', m.feel, 'Let the story feel the music')}</div>
        <p class="mw-fine">“Let the story feel the music” adds one short line (about 15 tokens) describing the music's feel, never its name, so Claude can match the mood. Off by default: the music otherwise costs no tokens at all.</p>
        <p class="mw-fine">Playing on: ${esc(m.deviceName || 'whichever Spotify is open')}${mus.devices.length > 1 ? '' : ''}</p>
        ${mus.devices.length > 1 ? `<div class="mw-mchips">${mus.devices.map(d => chip(`data-music="device" data-id="${esc(d.id)}"`, d.id === m.device, d.name)).join('')}</div>` : ''}
        <div class="mw-actions"><button type="button" data-music="devices">Find my Spotify devices</button><button type="button" data-music="signout">Sign out of Spotify</button></div></details>`;
}
export function musicView() {
    const m = music();
    const intro = `<p class="mw-explainer">Moodweaver picks songs from your own Spotify playlists to fit the scene, by plain matching: no tokens. Songs change when a song ends, or when the scene really shifts.</p>`;
    if (!signedIn(m)) return `${intro}${setupCard(m)}${sheetCard(m)}`;
    return `${intro}${nowCard(m)}${followCard(m)}${playlistCard(m)}${sheetCard(m)}${songsCard(m)}${settingsCard(m)}`;
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
    else if (a === 'playlist') togglePlaylist(el.dataset.id);
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
    return true;
}
export function musicInput(e, redraw) {
    const el = e.target.closest('[data-music-field="search"]'); if (!el) return false;
    ui.musicSearch = el.value; clearTimeout(ui.musicSearchTimer); ui.musicSearchTimer = setTimeout(() => { redraw(); const box = ui.panel?.querySelector('[data-music-field="search"]'); if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); } }, 400);
    return true;
}
export function musicFold(e) {
    const d = e.target; if (!d?.matches?.('[data-music-fold]')) return;
    ui.musicOpen = { ...(ui.musicOpen ?? {}), [d.dataset.musicFold]: d.open };
}
