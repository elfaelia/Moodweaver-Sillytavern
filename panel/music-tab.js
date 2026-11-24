// The \u266b Music tab: sign in to Spotify, what's playing and why, your playlists, the song sheet and song tags.
// Everything is a tap: chips and big buttons, no sliders or dragging.
import { setMix, toggleStoryOnly, EXTRAS, ambienceBeds, toggleAmbience, markPeak, nowAt, playChosen, removeSong, untaggedText, seekBy, seekTo, characterNames, eraEnd, exportSheet, extraChars, extraOn, feedback, finishSignIn, followName, forceMode, importSheet, loadPlaylists, mus, music, nextBest, radioOn, reRoll, setAmbLevel, toggleAmbKind, toggleVenues, setExtra, setOn, setTag, signOut, start, sync, thisCharName, toggleExtraFor, toggleLock, togglePlay, togglePlaylist, unlockSound, usableSongs } from '../app/music.js';
import { BED_LABELS, needsTap } from '../app/ambience.js';
import { canEdit, canReturn, prepareSignIn, redirectFor, signedIn } from '../app/spotify.js';
import { ctx, ui } from '../app/state.js';
import { CHANGE_CHOICES, HOLD_CHOICES, THEME_CHOICES } from '../data/catalogue/music.js';
import { BEATS, DYN_GROUPS, ENERGY, FAMILIES, HEARD_IN, HEAT, MEANINGS, MODES, MOMENTS, PLACES, cleanTags, describe, emptyTags, fitsMode, hasTags, labelOf, norm, peakText } from '../engine/music.js';
import { VENUE_BY_ID } from '../engine/venues.js';
import { escapeHtml as esc } from '../engine/util.js';
import { moodTone } from '../engine/tone.js';
import { getState, getUserState } from '../app/chat.js';

// The look: a small night sky of its own. What's playing is a planet (the cover art) with a Saturn ring (1.86: tilted,
// passing behind the cover and in front of it, turning while a song plays) and a
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
// \u2726 Fits, and once tapped for the song that's on, a lit \u2713 that says it took (with a short pop the first time).
function fitsButton() {
    const f = mus.fitsMark, on = Boolean(f && f.uri === mus.now?.uri), fresh = on && Date.now() - f.at < 1500;
    return `<button type="button" data-music="fits" class="${on ? 'is-noted' : ''}${fresh ? ' is-pop' : ''}" aria-pressed="${on}">${on ? '\u2713 Noted' : '\u2726 Fits'}</button>`;
}
// A drawer: a glowing orb, the title, one quiet line under it, and a chevron.
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const drawer = (fold, icon, title, sub, body, open) => `<details class="mw-music-drawer" ${open ? 'open' : ''} data-music-fold="${fold}">
    <summary><span class="mw-music-orb" aria-hidden="true">${icon}</span><span class="mw-music-dt"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="mw-music-chev" aria-hidden="true">\u203a</span></summary>
    <div class="mw-music-dbody">${body}</div></details>`;

function setupCard(m) {
    const paste = !canReturn(), ready = Boolean(String(m.clientId).trim());
    let link = '';
    if (ready) { const p = prepareSignIn(m); ctx().saveSettingsDebounced(); link = p.url; }
    const step = (n, body, lit) => `<li class="${lit ? 'is-lit' : ''}"><span class="mw-music-star" aria-hidden="true">${n}</span><div>${body}</div></li>`;
    return `<section class="mw-music-hero mw-music-setup">
        <div class="mw-music-planet is-idle" aria-hidden="true"><span class="mw-ring mw-ring-back"><b><i></i></b></span><span class="mw-music-ball">\u266b</span><span class="mw-ball-glaze"></span><span class="mw-ring mw-ring-front"><b><i></i></b></span></div>
        <h3 class="mw-music-title">Connect your Spotify</h3><p class="mw-music-sub">Once, about five minutes. Moodweaver only plays your own playlists.</p>
        <ol class="mw-music-path">
            ${step(1, `On the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">Spotify developer dashboard</a>, open your app \u203a Settings \u203a Edit. Under <b>Redirect URIs</b> add this address, press <b>Add</b>, then <b>Save</b>:
                <input type="text" readonly class="mw-music-copy" value="${esc(redirectFor(m))}" aria-label="Redirect address">
                ${paste ? `<span class="mw-fine">Type it exactly like this, with 127.0.0.1, even though you open SillyTavern at ${esc(location.host)}. Spotify only accepts this kind of address without https.</span>` : ''}`, true)}
            ${step(2, 'Tick <b>Web API</b> in the same settings.', true)}
            ${step(3, `Copy the <b>Client ID</b> from that page and paste it here:
                <input type="text" data-music-field="clientId" value="${esc(m.clientId)}" placeholder="Client ID" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Spotify Client ID">`, ready)}
            ${step(4, ready ? `<a class="mw-music-cta" href="${esc(link)}" ${paste ? 'target="_blank" rel="noopener"' : ''}>\u266b Sign in to Spotify</a>` : '<span class="mw-fine">The sign-in button appears once the Client ID is in.</span>', ready)}
            ${paste && ready ? step(5, `Spotify then opens a page that can't load (it says it can't connect to 127.0.0.1). That's expected. <b>Copy that page's whole address</b> (press and hold the address bar \u203a Copy), come back here and paste it:
                <textarea data-music-field="paste" rows="3" placeholder="http://127.0.0.1:\u2026/callback/spotify?code=\u2026" aria-label="Paste the address here"></textarea>
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
// "This scene is\u2026": what kind of scene Moodweaver thinks it is, and a tap to tell it (holds for 6 replies).
// 1.91.3: why Auto reads a scene as Erotic, so a wrong read can be traced: the words, a sex fact, the feelings.
function heatWhyLine(snap) {
    const w = snap?.heatWhy; if (!w) return '';
    const bits = [w.words.length ? `the words ${w.words.map(x => `\u201c${x}\u201d`).join(', ')}` : '', w.facts.length ? `the fact ${w.facts.join(', ')} (Info)` : '', w.feel.length ? `feelings (${w.feel.join(', ')})` : ''].filter(Boolean);
    return bits.length ? `<p class="mw-fine mw-music-kindhint">Why: ${esc(bits.join('; '))}. Wrong? Pick the right kind above, or turn the fact off in Info.</p>` : '';
}
function kindRow(snap) {
    const now = mus.forced?.mode ?? '', seen = snap?.mode ?? '', label = id => MODES.find(x => x.id === id)?.label ?? id, shown = now || seen;
    // 1.89: a dropdown (13 kinds of scene): one tap opens it, one tap picks. Auto lets Moodweaver read the scene.
    const opt = (id, text) => `<option value="${id}"${id === now ? ' selected' : ''}>${esc(text)}</option>`;
    return `<div class="mw-music-kind"><small>${now ? `This scene is ${esc(label(now))} for ${mus.forced.left} more ${mus.forced.left === 1 ? 'reply' : 'replies'}` : `This scene reads as ${seen ? esc(label(seen)) : 'nothing in particular'}`}</small>
        <select class="mw-music-kindpick" data-music-field="kind" data-pills aria-label="What kind of scene this is">${opt('', `Auto${!now && seen ? ` (reads as ${label(seen)})` : ''}`)}${MODES.map(x => opt(x.id, `${x.label}: ${x.hint}`)).join('')}</select>
        ${shown ? `<p class="mw-fine mw-music-kindhint">${esc(label(shown))}: ${esc(MODES.find(x => x.id === shown)?.hint ?? '')}</p>` : ''}${!now && seen === 'intimate' ? heatWhyLine(snap) : ''}</div>`;
}
// What the extras are doing right now: the in-story radio, a sting that just hit, and the ambience.
function extrasLines(m) {
    const out = [];
    if (radioOn(m)) {
        const end = eraEnd(), dated = usableSongs(m).filter(x => x.tags?.yr).length;
        out.push(`\ud83d\udcfb ${esc(mus.radio.kind[0].toUpperCase() + mus.radio.kind.slice(1))} is playing in the story${end ? ` \u00b7 songs from ${end} or earlier` : ''}${mus.radio.empty ? ' \u00b7 no song with a Year fits, so any song plays' : !dated ? ' \u00b7 no songs have a Year yet, so any song plays' : ''}`);
    }
    if (mus.sting && Date.now() - mus.sting.at < 5 * 60 * 1000) out.push(`\u26a1 Sting: ${esc(mus.sting.beat.toLowerCase())} \u2192 ${esc(mus.sting.name)}`);
    if (extraOn('amb', m) && !mus.ambPaused) {
        const beds = ambienceBeds(mus.latest, m);
        if (beds.length) out.push(`\u2601 Ambience: ${esc(beds.map(b => BED_LABELS[b] ?? b).join(', '))}${needsTap() ? ' \u00b7 <button type="button" class="mw-music-quiet mw-music-inline" data-music="sound">Tap to start the ambience</button>' : ''}`);
    }
    return out.map(l => `<p class="mw-music-note">${l}</p>`).join('');
}
// Under Re-roll: one short, quiet line (what was cued, a sting, the radio, the ambience). A tap opens the full detail.
function whyBlock(m, heardLine, why, snap) {
    if (!ui.musicNotes) return '';
    const extras = extrasLines(m), status = mus.status ?? '';
    const parts = [heardLine, extras, status ? `<p class="mw-music-note">${esc(status)}</p>` : '',
        why.length ? `<div class="mw-music-why"><small>Picked for</small>${why.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : '',
        snap ? `<p class="mw-music-scene">${esc(describe(snap, snap.name))}</p>` : ''].filter(Boolean).join('');
    return `<div class="mw-music-folded">${parts || '<p class="mw-music-note">Nothing to explain yet: the next reply picks a song.</p>'}</div>`;
}
// A small gold diamond on the path where the song's peak is (yours, from the sheet, or one Moodweaver found).
function peakMark(m, n) {
    const sec = cleanTags(m.tags[n.uri] ?? {}).pk || m.peaks?.[n.uri] || 0;
    return sec && n.ms ? `<b class="mw-music-peak" style="left:${Math.min(100, sec * 1000 / n.ms * 100).toFixed(1)}%" title="Peak ${peakText(sec)}"></b>` : '';
}
const restText = ms => { const min = Math.ceil((ms ?? 0) / 60000); return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m more` : `${min} min more`; };
function nowCard(m, tone) {
    const n = mus.now, snap = mus.latest, playing = Boolean(n?.playing && m.on);
    const why = (mus.why ?? []).filter(Boolean).slice(0, 4);
    // Lyric cues the story just said: one line, so you can see a cue was heard and why it did or didn't play.
    const seen = new Set(), heard = (mus.heard ?? []).filter(h => h.name && !seen.has(norm(h.name)) && seen.add(norm(h.name))).slice(0, 3);
    const heardLine = heard.length ? `<p class="mw-music-note">Heard in the story: ${heard.map(h => `\u201c${esc(h.cue)}\u201d \u2192 ${esc(h.name)}${h.uri === mus.now?.uri ? ' (playing)' : h.resting ? ` (resting ${restText(h.restLeft)}: it played for a cue not long ago)` : h.fits ? ' (nudged)' : " (doesn't fit this scene)"}`).join(' \u00b7 ')}</p>` : '';
    const elapsed = n ? (n.playing ? Date.now() - n.started : n.progress) : 0, pct = n?.ms ? Math.max(0, Math.min(100, elapsed / n.ms * 100)) : 0, left = n?.ms ? Math.max(0, n.ms - elapsed) : 0;
    return `<section class="mw-music-hero ${playing ? 'is-playing' : ''}" style="${toneVars(tone)}">
        <button type="button" class="mw-music-power" data-music="toggle-on" aria-pressed="${Boolean(m.on)}"><span aria-hidden="true"></span>${m.on ? 'Music on' : 'Music off'}</button>
        <div class="mw-music-planet ${n ? '' : 'is-idle'}" aria-hidden="true"><span class="mw-ring mw-ring-back"><b><i></i></b></span>${n?.art ? `<img class="mw-music-ball" src="${esc(n.art)}" alt="">` : '<span class="mw-music-ball">\u266b</span>'}<span class="mw-ball-glaze"></span><span class="mw-ring mw-ring-front"><b><i></i></b></span></div>
        <h3 class="mw-music-title">${esc(n?.name || (m.on ? 'Waiting for the next scene' : 'The music is resting'))}</h3>
        <p class="mw-music-sub">${n ? `${esc(n.artist ?? '')}${n.device ? ` \u00b7 on ${esc(n.device)}` : ''}` : m.on ? 'A song starts after the next reply.' : 'Switch it on and the scene picks the songs.'}</p>
        ${n?.ms ? `<button type="button" class="mw-music-seek" data-music="seekbar" aria-label="Tap the path to jump to that spot in the song"><span class="mw-music-track"><i style="width:${pct.toFixed(1)}%;animation-duration:${Math.round(left)}ms;animation-play-state:${playing ? 'running' : 'paused'}"></i>${peakMark(m, n)}</span></button>
        <div class="mw-music-seekrow"><button type="button" class="mw-mchip" data-music="back15">\u221215s</button><button type="button" class="mw-mchip" data-music="markpeak" title="Save where the song is now as its peak">\u25c6 Mark peak here</button><button type="button" class="mw-mchip" data-music="fwd15">+15s</button></div>` : ''}
        <div class="mw-music-transport">
            <button type="button" class="mw-music-round" data-music="lock" aria-pressed="${mus.locked}" aria-label="${mus.locked ? 'Unlock: let the scene change songs again' : 'Lock: keep this music'}">${icon(mus.locked ? 'lock' : 'unlock')}</button>
            <button type="button" class="mw-music-round is-main" data-music="play" aria-label="${n?.playing ? 'Pause' : 'Play'}">${icon(n?.playing ? 'pause' : 'play')}</button>
            <button type="button" class="mw-music-round" data-music="next" aria-label="Next best song">${icon('next')}</button>
        </div>
        <button type="button" class="mw-music-reroll" data-music="reroll"${mus.busy ? ' disabled' : ''}>\u21bb Re-roll for the story now</button>
        ${mus.error ? `<p class="mw-music-note is-warn">${esc(mus.error)}</p>` : ''}
        ${n ? `<div class="mw-music-verdict">${fitsButton()}<button type="button" data-music="nothere">\u2715 Not here</button><button type="button" data-music="edit-now">\u270e Tags</button><button type="button" data-music="notes" aria-pressed="${Boolean(ui.musicNotes)}" aria-label="Why this song">\u24d8</button></div>${mus.fitsMark?.uri === mus.now?.uri ? `<p class="mw-music-noted">\u2713 Saved: this song fits ${mus.fitsMark.scene ? `${esc(mus.fitsMark.scene.toLowerCase())} scenes` : 'scenes'} like this one.</p>` : ''}` : ''}
        ${whyBlock(m, heardLine, why, snap)}
        ${kindRow(snap)}
        <div class="mw-mchips">${chip('data-music="storyonly"', Boolean(m.storyOnly), `${m.storyOnly ? '\u2713' : '+'} In-story music only`, 'Play only music the characters can hear; pause the rest of the time')}</div>
        ${m.storyOnly ? `<p class="mw-fine">${radioOn(m) ? `Playing in the story: ${esc(mus.radio?.venue ? (VENUE_BY_ID[mus.radio.venue]?.label ?? 'music in the room') : mus.radio?.kind ?? 'music')}${Number.isFinite(mus.radio?.left) ? ` (stops after ${mus.radio.left} more ${mus.radio.left === 1 ? 'reply' : 'replies'} unless the story keeps it on)` : ''}.` : (mus.named && mus.named.uri === mus.now?.uri && mus.now?.playing) ? `Playing because of \u201c${esc(mus.named.phrase)}\u201d; it pauses when the song ends.` : 'Nothing is playing in the story, so the music is paused.'}</p>` : ''}
        ${mus.loading ? `<p class="mw-music-note">${esc(mus.loading)}</p>` : ''}
    </section>`;
}
// Whose moods pick the music: three little planets, the same orbs as the people at the top of the panel.
function followCard(m, t) {
    const orb = (who, name, tag, tone, two) => `<button type="button" class="mw-music-who" data-music="set" data-k="follow" data-v="${who}" aria-pressed="${m.follow === who}" style="${toneVars(tone)}">
        <span class="mw-music-who-orbs">${two ? `<i style="${toneVars(t.char)}">${esc(followName('char')[0] ?? '')}</i><i style="${toneVars(t.user)}">${esc(followName('user')[0] ?? '')}</i>` : `<i>${esc(who === 'story' ? '\u2726' : String(name)[0] ?? '')}</i>`}</span>
        <b>${esc(name)}</b><small>${tag}</small></button>`;
    return `<section class="mw-music-follow"><p class="mw-music-label">Music follows</p><div class="mw-music-whos">
        ${orb('char', followName('char'), 'their moods', t.char)}${orb('user', followName('user'), 'your moods', t.user)}${orb('both', 'Both', 'together', t.char, true)}${orb('story', 'Story', 'film score', t.char)}</div>
        ${m.follow === 'story' ? '<p class="mw-fine">Story: the music scores the whole scene, like a film. It holds one cue through a scene and changes when the scene does (a new place, kind of scene, someone arriving, heat), not with every passing feeling.</p>' : ''}</section>`;
}
// You may have hundreds of playlists: the ticked ones are lit stars on top, the rest are found by searching (or a
// tap on "Show all"), in one quiet list.
function playlistCard(m) {
    const all = Object.entries(m.playlists).sort((a, b) => a[1].name.localeCompare(b[1].name)), ticked = all.filter(([, p]) => p.on);
    const q = norm(ui.musicPlSearch ?? ''), others = all.filter(([, p]) => !p.on), found = q ? all.filter(([, p]) => norm(p.name).includes(q)) : ui.musicPlAll ? others : [];
    const row = ([id, p]) => `<button type="button" class="mw-music-row" data-music="playlist" data-id="${esc(id)}" aria-pressed="${Boolean(p.on)}"${p.owned ? '' : ' disabled title="Spotify only lets apps read playlists you made. Copy it into a new playlist of your own to use it."'}><span class="mw-music-tick" aria-hidden="true">${p.on ? '\u2726' : '\u2727'}</span><span class="mw-music-name">${esc(p.name)}${p.gone ? ' <small>(not found on Spotify)</small>' : ''}</span><small>${p.count ? p.count : ''}</small></button>`;
    const body = `${ticked.length ? `<p class="mw-music-label">Playing from</p><div class="mw-music-rows">${ticked.map(row).join('')}</div>` : all.length ? '<p class="mw-music-note">Nothing lit yet: find a playlist and tap it.</p>' : ''}
        ${all.length ? `<input type="search" class="mw-music-search" data-music-field="plsearch" value="${esc(ui.musicPlSearch ?? '')}" placeholder="\u2727  Find a playlist by name or emoji" aria-label="Find a playlist">
        ${q ? `<div class="mw-music-rows">${found.slice(0, 40).map(row).join('') || '<p class="mw-music-note">No playlist with that in its name.</p>'}</div>${found.length > 40 ? `<p class="mw-music-note">${found.length - 40} more: type a little more.</p>` : ''}`
            : `<button type="button" class="mw-music-quiet" data-music="plall">${ui.musicPlAll ? 'Hide the rest' : `Show all ${others.length} others`}</button>${ui.musicPlAll ? `<div class="mw-music-rows">${found.map(row).join('')}</div>` : ''}`}` : '<p class="mw-music-note">None loaded yet.</p>'}
        <button type="button" class="mw-music-quiet" data-music="load">\u21bb Load playlists and songs from Spotify</button>
        <p class="mw-fine">Greyed ones were made by someone else: Spotify won't share their songs. In Spotify, select all their songs \u203a Add to playlist \u203a New playlist to make your own copy.</p>`;
    return drawer('playlists', '\u2726', 'Playlists', `${ticked.length} lit of ${all.length} \u00b7 ${plural(usableSongs(m).length, 'song')}`, body, ui.musicOpen?.playlists);
}
function sheetCard(m, asDrawer = true) {
    const imp = mus.lastImport;
    const body = `<p class="mw-music-note">Tag songs in a spreadsheet with dropdowns (Google Sheets, Excel or Numbers), then bring it back. exportify.net CSVs work too.</p>
        <div class="mw-music-tiles"><button type="button" class="mw-music-tile" data-music="export"><span aria-hidden="true">\u263e</span><b>Export</b><small>the sheet to fill in</small></button>
        <label class="mw-music-tile mw-music-file"><span aria-hidden="true">\u263d</span><b>Import</b><small>a filled sheet or CSV</small><input type="file" data-music-field="import" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label></div>
        <p class="mw-music-note">You don't need to import my tags any more: they come built in with each new version, and your own edits are kept.</p>
        <button type="button" class="mw-music-quiet" data-music="untagged">\u2727 Copy songs without tags</button>
        ${ui.musicUntagged != null ? (ui.musicUntagged ? `<p class="mw-fine">${plural(ui.musicUntagged.split('\n').length, 'song')} without tags. Paste this list to Claude: they come back tagged in the next version.</p><textarea class="mw-music-copy" readonly rows="6">${esc(ui.musicUntagged)}</textarea>` : `<p class="mw-fine">Every song has tags.</p>`) : ''}
        ${imp ? `<p class="mw-music-note">Last import (${esc(imp.file)}): ${imp.songs} songs tagged${imp.added ? `, ${imp.added} songs added` : ''}${imp.playlists ? `, ${imp.playlists} playlists` : ''}${imp.chars ? `, ${imp.chars} characters` : ''}.${imp.unknown.length ? ` Not recognised: ${esc(imp.unknown.join(', '))}.` : ''}${imp.unmatched.length ? ` Not found: ${esc(imp.unmatched.join(', '))}.` : ''}</p>` : ''}`;
    return asDrawer ? drawer('sheet', '\u25d0', 'Song sheet', 'Sort and tag songs in a spreadsheet', body, ui.musicOpen?.sheet) : `<section class="mw-music-follow">${body}</section>`;
}
// The tag editor: one section open at a time (a tap on its bar opens it and closes the others), each bar saying
// what is lit inside, so the editor stays short. Bars are big, bright and plainly tappable.
const removable = (m, s) => (s.pl ?? []).some(id => !id.startsWith('csv:') && id !== 'liked' && m.playlists[id]?.owned);
function tagEditor(m, uri) {
    const s = m.songs[uri]; if (!s) return '';
    const t = cleanTags(m.tags[uri] ?? emptyTags()), tag = (k, v, label, on) => chip(`data-music="tag" data-uri="${esc(uri)}" data-k="${k}" data-v="${esc(v)}"`, on, label);
    const open = ui.musicGroup ?? 'feeling';
    const group = (id, title, lit, body) => `<div class="mw-music-group${open === id ? ' is-open' : ''}"><button type="button" class="mw-music-gbar" data-music="group" data-v="${id}" aria-expanded="${open === id}"><b>${title}</b><small>${lit.length ? esc(lit.slice(0, 3).join(', ')) + (lit.length > 3 ? ` +${lit.length - 3}` : '') : 'none'}</small><span aria-hidden="true">${open === id ? '\u2013' : '+'}</span></button>${open === id ? `<div class="mw-mchips">${body}</div>` : ''}</div>`;
    // Names: the chat's two, {{char}}/{{user}}/Any and whoever is already ticked; the rest on request.
    const here = [followName('char'), followName('user')], ticked = t.c.filter(c => !['{{char}}', '{{user}}', 'any'].includes(norm(c)));
    const all = characterNames(), base = [...new Set(['{{char}}', '{{user}}', 'Any', ...here, ...ticked])];
    const names = ui.musicAllNames ? [...new Set([...base, ...all])] : base;
    const neverAll = [...MODES.map(x => [`k:${x.id}`, `${x.label} scenes`]), ...FAMILIES.map(x => [`f:${x.id}`, x.label]), ...MOMENTS.map(x => [`mo:${x.id}`, x.label]), ...HEAT.map(x => [`h:${x.id}`, x.label])];
    const nowOn = mus.now?.uri === uri;
    return `<div class="mw-music-editor${nowOn ? ' is-now' : ''}"><div class="mw-music-editor-head"><span class="mw-music-orb" aria-hidden="true">${nowOn ? '\u266b' : '\u266a'}</span><span class="mw-music-dt"><b>${esc(s.n)}</b><small>${nowOn ? 'Playing now \u00b7 ' : ''}${esc(s.a)}</small></span>${nowOn ? '' : `<button type="button" class="mw-music-playit" data-music="playit" data-uri="${esc(uri)}" aria-label="Play it now">${icon('play')}</button>`}<button type="button" class="mw-music-quiet" data-music="close-edit">Done</button></div>
        ${group('side', 'Whose song', t.c, names.map(n => tag('c', n, n, t.c.some(c => norm(c) === norm(n)))).join('') + (all.length > base.length ? `<button type="button" class="mw-mchip is-more" data-music="allnames">${ui.musicAllNames ? 'Fewer names' : `All ${all.length} names\u2026`}</button>` : ''))}
        ${group('feeling', 'Feeling', t.f.map(id => labelOf('f', id)), FAMILIES.map(f => tag('f', f.id, f.label, t.f.includes(f.id))).join(''))}
        ${group('meaning', 'Meaning', t.cm.map(id => labelOf('cm', id)), MEANINGS.map(x => tag('cm', x.id, x.label, t.cm.includes(x.id))).join(''))}
        ${group('moment', 'Moment', t.mo.map(id => labelOf('mo', id)), MOMENTS.map(x => tag('mo', x.id, x.label, t.mo.includes(x.id))).join(''))}
        ${group('dynamic', 'Dynamic', t.d.map(id => labelOf('d', id)), DYN_GROUPS.map(x => tag('d', x.id, x.label, t.d.includes(x.id))).join(''))}
        ${group('heat', 'Energy and heat', [t.e ? `energy ${t.e}` : '', t.h ? labelOf('h', t.h) : ''].filter(Boolean), ENERGY.map(x => tag('e', x.id, x.label, t.e === x.id)).join('') + HEAT.map(x => tag('h', x.id, x.label, t.h === x.id)).join(''))}
        ${group('place', 'Place', t.p.map(id => labelOf('p', id)), PLACES.map(x => tag('p', x.id, x.label, t.p.includes(x.id))).join(''))}
        ${group('heard', 'Heard in the room', (t.dg ?? []).map(id => HEARD_IN.find(x => x.id === id)?.label ?? id), `<p class="mw-fine">Where the characters could hear this song playing (a punk show, a club, a house party, a car stereo). There it plays first, as if from the room.</p>${HEARD_IN.map(x => tag('dg', x.id, x.label, (t.dg ?? []).includes(x.id))).join('')}`)}
        ${group('never', 'Never during', t.nv.map(v => neverAll.find(([k]) => k === v)?.[1] ?? v), neverAll.map(([v, l]) => tag('nv', v, l, t.nv.includes(v))).join(''))}
        ${group('moods', 'Exact moods', t.m.map(id => labelOf('m', id)), `<label class="mw-music-note">Names separated by commas, as in the sheet<input type="text" data-music-field="moods" data-uri="${esc(uri)}" value="${esc(t.m.map(id => labelOf('m', id)).join(', '))}"></label>`)}
        ${group('cues', 'Cues', [...t.cue, ...t.cw], `<label class="mw-music-note">Phrases: each one alone nods to this song when the story says it (like a dog). Separate with commas.<input type="text" data-music-field="cues" data-uri="${esc(uri)}" value="${esc(t.cue.join(', '))}" autocapitalize="off" spellcheck="false"></label><label class="mw-music-note">Theme words: any two of these close together count (dog*, leash*, collar*, salivat*). A * means any ending.<input type="text" data-music-field="cuewords" data-uri="${esc(uri)}" value="${esc(t.cw.join(', '))}" autocapitalize="off" spellcheck="false"></label><p class="mw-fine">When the story cues this song and it fits the scene, it almost always plays next (always on \u21bb Re-roll), then rests for 10 minutes.</p>`)}
        ${group('sting', 'Sting, peak and year', [...t.st.map(id => BEATS.find(b => b.id === id)?.label ?? id), t.pk ? `peak ${peakText(t.pk)}` : '', t.yr ? String(t.yr) : ''].filter(Boolean), `<p class="mw-fine">Sting: a big beat this song can cut in on, straight away.</p>${BEATS.map(b => tag('st', b.id, b.label, t.st.includes(b.id))).join('')}<label class="mw-music-note">Peak: where its chorus or drop starts, like 1:05 (empty: Moodweaver finds or guesses it)<input type="text" inputmode="numeric" data-music-field="peak" data-uri="${esc(uri)}" value="${esc(peakText(t.pk))}" placeholder="1:05"></label><label class="mw-music-note">Year it first came out (for the in-story radio)<input type="text" inputmode="numeric" data-music-field="year" data-uri="${esc(uri)}" value="${t.yr || ''}" placeholder="1962"></label>`)}
        <div class="mw-mchips mw-music-flags">${tag('th', '1', '\u2605 Theme song', t.th)}${tag('fav', '1', '\u2665 Favourite', t.fav)}${tag('off', '1', 'Off (never play)', t.off)}</div>
        <div class="mw-music-remove">${ui.musicRemove === uri ? `<button type="button" class="mw-music-quiet is-danger" data-music="remove" data-uri="${esc(uri)}">Tap again to remove it${removable(m, s) ? ' from your Spotify playlist' : ''} for good</button><button type="button" class="mw-music-quiet" data-music="remove-cancel">Keep it</button>` : `<button type="button" class="mw-music-quiet" data-music="remove-ask" data-uri="${esc(uri)}">\ud83d\uddd1 Remove this song</button>`}</div>
        ${t.note ? `<p class="mw-fine">${esc(t.note)}</p>` : ''}</div>`;
}
// \u25a6 Song counts: how the songs in the lit playlists are tagged, so gaps show (plenty of sorrow, few intimate
// songs). Scene kinds are counted the way the picker counts them; the rest by tag. Each list shows the biggest
// first, as a bar, and leaves out anything with no songs.
function countsCard(m) {
    const songs = usableSongs(m), total = songs.length || 1, tags = songs.map(x => x.tags ?? emptyTags());
    const bar = (label, n) => `<div class="mw-count-row"><span>${esc(label)}</span><i style="--w:${Math.round(n / total * 100)}%"></i><b>${n}</b></div>`;
    const list = (title, rows, keepOrder = false) => { const shown = rows.filter(([, n]) => n); if (!shown.length) return '';
        return `<div class="mw-count-group"><h5>${esc(title)}</h5>${(keepOrder ? shown : shown.sort((a, b) => b[1] - a[1])).map(([l, n]) => bar(l, n)).join('')}</div>`; };
    const count = test => tags.filter(test).length;
    const whose = {}; for (const t of tags) for (const c of t.c) { const k = ['{{char}}', '{{user}}', 'any'].includes(norm(c)) ? ({ '{{char}}': followName('char'), '{{user}}': followName('user'), any: 'Anyone' })[norm(c)] : c; whose[k] = (whose[k] ?? 0) + 1; }
    const kinds = MODES.map(x => [x.label, count(t => fitsMode(t, x.id))]);
    const body = `<p class="mw-music-note">Counted from the ${plural(songs.length, 'song')} in your lit playlists. A song can count in more than one place.</p>
        ${list('Kind of scene', kinds, true)}
        ${list('Tagging', [['With tags', count(t => hasTags(t))], ['No tags yet', count(t => !hasTags(t))], ['\u2665 Favourites', count(t => t.fav)], ['\u2605 Theme songs', count(t => t.th)], ['Off', count(t => t.off)], ['With lyric cues', count(t => t.cue.length || t.cw.length)]], true)}
        ${list('Heat', HEAT.map(x => [x.label, count(t => t.h === x.id)]), true)}
        ${list('Energy', ENERGY.map(x => [x.label, count(t => t.e === x.id)]), true)}
        ${list('Whose song', Object.entries(whose))}
        ${list('Feeling', FAMILIES.map(x => [x.label, count(t => t.f.includes(x.id))]))}
        ${list('Moment', MOMENTS.map(x => [x.label, count(t => t.mo.includes(x.id))]))}
        ${list('Meaning', MEANINGS.map(x => [x.label, count(t => t.cm.includes(x.id))]))}
        ${list('Dynamic', DYN_GROUPS.map(x => [x.label, count(t => t.d.includes(x.id))]))}
        ${list('Place', PLACES.map(x => [x.label, count(t => t.p.includes(x.id))]))}`;
    const top = kinds.slice(0, 3).map(([l, n]) => `${n} ${l.toLowerCase()}`).join(' \u00b7 ');
    return drawer('counts', '\u25a6', 'Song counts', top, body, ui.musicOpen?.counts);
}
function songsCard(m) {
    const term = norm(ui.musicSearch ?? ''), songs = usableSongs(m);
    const hits = (term ? songs.filter(x => norm(`${x.song.n} ${x.song.a}`).includes(term)) : songs).slice(0, 40);
    const tagged = songs.filter(x => m.tags[x.uri]).length;
    // What's playing sits on top and glows, one tap from its tags.
    const now = mus.now?.uri ? songs.find(x => x.uri === mus.now.uri) ?? (m.songs[mus.now.uri] ? { uri: mus.now.uri, song: m.songs[mus.now.uri] } : null) : null;
    const nowRow = now ? `<div class="mw-music-rows"><button type="button" class="mw-music-row is-song is-now" data-music="edit" data-uri="${esc(now.uri)}" aria-pressed="${ui.musicSong === now.uri}"><span class="mw-music-tick" aria-hidden="true">\u266b</span><span class="mw-music-name"><b>${esc(now.song.n)}</b><small>Playing now \u00b7 ${esc(now.song.a)}</small></span></button></div>` : '';
    const body = `${ui.musicSong ? tagEditor(m, ui.musicSong) : ''}
        <input type="search" class="mw-music-search" data-music-field="search" value="${esc(ui.musicSearch ?? '')}" placeholder="\u2727  Find a song or artist" aria-label="Find a song">
        ${nowRow}
        <div class="mw-music-rows">${hits.filter(x => x.uri !== mus.now?.uri).map(x => `<div class="mw-music-songrow"><button type="button" class="mw-music-row is-song" data-music="edit" data-uri="${esc(x.uri)}" aria-pressed="${ui.musicSong === x.uri}"><span class="mw-music-tick" aria-hidden="true">${m.tags[x.uri] ? '\u2726' : '\u00b7'}</span><span class="mw-music-name"><b>${esc(x.song.n)}</b><small>${esc(x.song.a)}</small></span></button><button type="button" class="mw-music-playit" data-music="playit" data-uri="${esc(x.uri)}" aria-label="Play ${esc(x.song.n)} now">${icon('play')}</button></div>`).join('')}</div>
        ${songs.length > hits.length ? `<p class="mw-music-note">Showing ${hits.length} of ${songs.length}. Search to find others.</p>` : ''}`;
    return drawer('songs', '\u266a', 'Songs', `${plural(songs.length, 'song')} \u00b7 ${tagged} with their own tags`, body, ui.musicOpen?.songs || ui.musicSong);
}
function settingsCard(m) {
    const body = `<p class="mw-music-label">Change songs</p><div class="mw-mchips">${CHANGE_CHOICES.map(([v, l]) => choice('change', v, m.change, l)).join('')}</div>
        <p class="mw-music-label">Shortest time before cutting a song</p><div class="mw-mchips">${HOLD_CHOICES.map(([v, l]) => choice('hold', v, m.hold, l)).join('')}</div>
        <p class="mw-music-label">Theme songs play</p><div class="mw-mchips">${THEME_CHOICES.map(([v, l]) => choice('themes', v, m.themes, l)).join('')}</div>
        <p class="mw-music-label">Extras</p><div class="mw-mchips">${chip('data-music="flag" data-k="feel"', m.feel, 'Let the story feel the music')}${chip('data-music="flag" data-k="tell"', m.tell, 'Tell the story the song')}${chip('data-music="flag" data-k="cues"', m.cues, 'Lyric cues')}</div>
        <p class="mw-fine">\u201cLet the story feel the music\u201d adds a few words on the music's feel, never its name (about 15 tokens). \u201cTell the story the song\u201d gives Claude the song and artist, whatever the era, to score the scene by: never quoted, named or heard by anyone (about 70 tokens). Both are off by default: otherwise the music costs no tokens. \u201cLyric cues\u201d (on by default, no tokens): when the story says one of a song's cue phrases, that song almost always plays next if it fits the scene, then rests for 10 minutes.</p>
        ${m.tell ? `<p class="mw-music-label">Tell it for</p><div class="mw-mchips">${[[1, 'First reply of a song'], [2, '2 replies'], [3, '3 replies'], [0, 'While it plays']].map(([v, l]) => choice('tellFor', v, Number(m.tellFor), l)).join('')}</div><p class="mw-fine">Short is safest: the song sets the mood as it starts, then the story moves on freely.</p>` : ''}
        <p class="mw-music-label">Playing on</p><p class="mw-music-note">${esc(m.deviceName || 'Whichever Spotify is open')}</p>
        ${mus.devices.length > 1 ? `<div class="mw-mchips">${mus.devices.map(d => chip(`data-music="device" data-id="${esc(d.id)}"`, d.id === m.device, d.name)).join('')}</div>` : ''}
        <div class="mw-music-pair"><button type="button" class="mw-music-quiet" data-music="devices">Find my Spotify devices</button><button type="button" class="mw-music-quiet" data-music="signout">Sign out of Spotify</button></div>
        ${canEdit(m) ? '' : `<p class="mw-fine">To let \ud83d\uddd1 Remove take songs out of your Spotify playlists, Moodweaver needs one more permission. Sign out, then sign in again once.</p><button type="button" class="mw-music-quiet" data-music="signout">Sign in again (lets Moodweaver remove songs)</button>`}`;
    return drawer('settings', '\u263e', 'Music settings', `${(CHANGE_CHOICES.find(([v]) => v === m.change) ?? [, ''])[1]}`, body, ui.musicOpen?.settings);
}
// \u2727 Extras: each one Off, on for Everyone, or on for Only some characters (ticked one by one, saved with them).
const MODE_LABELS = [['off', 'Off'], ['all', 'Everyone'], ['some', 'Only some']];
function extraRow(m, x) {
    const me = thisCharName();
        const mode = m.extras[x.id] ?? 'off', ticked = extraChars(x.id), others = ticked.filter(n => norm(n) !== norm(me));
        const some = mode === 'some' ? `<div class="mw-mchips">${me ? chip(`data-music="extrachar" data-k="${x.id}"`, ticked.some(n => norm(n) === norm(me)), `${ticked.some(n => norm(n) === norm(me)) ? '\u2713' : '+'} ${me}`) : ''}${others.map(n => chip(`data-music="extrachar" data-k="${x.id}" data-v="${esc(n)}"`, true, `\u2713 ${n}`)).join('')}</div>
            <p class="mw-fine">${me ? `Tap ${esc(me)} to switch it on or off for them. ` : ''}It follows each ticked character into every chat. Tap a ticked name to untick it.</p>` : '';
        const level = x.id === 'amb' && mode !== 'off' ? `<p class="mw-music-label">How loud</p><div class="mw-mchips">${[[1, 'Soft'], [2, 'Medium'], [3, 'Loud']].map(([v, l]) => chip(`data-music="amblevel" data-v="${v}"`, Number(m.ambLevel) === v, l)).join('')}</div>
            <p class="mw-music-label">What plays</p><div class="mw-mchips">${chip('data-music="ambkind" data-v="places"', m.ambPlaces !== false, `${m.ambPlaces !== false ? '\u2713' : '+'} Everyday sounds`)}${chip('data-music="ambkind" data-v="sex"', m.ambSex !== false, `${m.ambSex !== false ? '\u2713' : '+'} Erotic sounds`)}</div>
            <p class="mw-fine">Everyday: places, weather, a heartbeat in danger, doors, gunshots. Erotic: the bed and furniture, bodies, breath, fingers, spanking, the whip and her voice. Tap one to switch it off.</p>` : '';
        const venues = x.id === 'radio' && mode !== 'off' ? `<div class="mw-mchips">${chip('data-music="venues"', m.venues !== false, `${m.venues !== false ? '\u2713' : '+'} Venues play their own music`)}${chip('data-music="storyonly"', Boolean(m.storyOnly), `${m.storyOnly ? '\u2713' : '+'} In-story music only`)}</div><p class="mw-music-label">Mix for the radio, jukebox and venues</p><div class="mw-mchips">${[['mine', 'Mostly my songs'], ['half', 'Half and half'], ['search', 'Mostly Spotify search']].map(([v, l]) => chip(`data-music="mix" data-v="${v}"`, (m.mix ?? 'mine') === v, l)).join('')}</div><p class="mw-fine">Your songs that fit come first and Spotify search mixes in to keep it fresh. A song the story names always plays first.</p><p class="mw-fine">In-story music only: songs play only when the characters can hear them (a radio, jukebox, record player, or a bar, club or gig\u2019s own music). The rest of the time Spotify is paused instead of scoring the scene. Ambience carries on.</p>` : '';
        return `<div class="mw-music-extra${x.under ? ' is-under' : ''}"><p class="mw-music-label">${esc(x.label)}${extraOn(x.id, m) ? ' <span class="mw-music-lit">\u00b7 on here</span>' : ''}</p><p class="mw-fine">${esc(x.note)}</p>
            <div class="mw-mchips">${MODE_LABELS.map(([v, l]) => chip(`data-music="extra" data-k="${x.id}" data-v="${v}"`, mode === v, l)).join('')}</div>${some}${level}${venues}</div>`;
    }
function extrasCard(m) {
    const row = x => extraRow(m, x);
    const lit = EXTRAS.filter(x => x.id !== 'amb' && extraOn(x.id, m)).map(x => x.label.toLowerCase());
    return drawer('extras', '\u2727', 'Extras', lit.length ? `On here: ${esc(lit.join(', '))}` : 'Crossfade, stings, peaks, radio', EXTRAS.filter(x => x.id !== 'amb' && (!x.under || (m.extras[x.under] ?? 'off') !== 'off')).map(row).join(''), ui.musicOpen?.extras);
}
// After picking a song, bring its editor into view.
function toEditor() { requestAnimationFrame(() => ui.panel?.querySelector('.mw-music-editor')?.scrollIntoView({ block: 'start', behavior: 'smooth' })); }
// \u2601 Ambience on its own line (1.83): what's playing, its own \u275a\u275a / \u25b6 (the music's pause doesn't touch it), and its
// settings one tap away. Shown whether or not Spotify is connected.
function ambienceLine(m) {
    const on = extraOn('amb', m), beds = on ? ambienceBeds(mus.latest, m) : [], paused = Boolean(mus.ambPaused), open = ui.musicOpen?.amb;
    const sub = !on ? ((m.extras.amb ?? 'off') === 'off' ? 'Off' : 'Off for this character') : paused ? 'Paused' : needsTap() && beds.length ? 'Tap anywhere to start it' : beds.length ? esc(beds.map(b => BED_LABELS[b] ?? b).join(' \u00b7 ')) : 'Quiet: nothing in the scene to hear yet';
    return `<div class="mw-amb-line${on && !paused && beds.length ? ' is-live' : ''}"><span class="mw-amb-orb" aria-hidden="true">\u2601</span><span class="mw-amb-text"><b>Ambience</b><small>${sub}</small></span>
        ${on ? `<button type="button" class="mw-amb-btn" data-music="amb-pause" aria-pressed="${!paused}" aria-label="${paused ? 'Play the ambience' : 'Pause the ambience'}">${paused ? '\u25b6' : '\u275a\u275a'}</button>` : ''}
        <button type="button" class="mw-amb-btn mw-amb-more" data-music="amb-more" aria-expanded="${Boolean(open)}" aria-label="Ambience settings">${open ? '\u2303' : '\u2304'}</button></div>
        ${open ? `<div class="mw-amb-body">${extraRow(m, EXTRAS.find(x => x.id === 'amb'))}</div>` : ''}`;
}
export function musicView() {
    const m = music();
    if (!signedIn(m)) return `<div class="mw-music">${setupCard(m)}${ambienceLine(m)}<div class="mw-music-drawers">${sheetCard(m)}</div></div>`;
    const t = tones(), lead = m.follow === 'user' ? t.user : t.char;
    return `<div class="mw-music">${nowCard(m, lead)}${ambienceLine(m)}${followCard(m, t)}<div class="mw-music-drawers">${playlistCard(m)}${songsCard(m)}${countsCard(m)}${sheetCard(m)}${extrasCard(m)}${settingsCard(m)}</div></div>`;
}

// ---- Taps ----
// Returns true when the tap was the Music tab's. redraw: the panel's render.
export async function musicClick(e, redraw) {
    const el = e.target.closest('[data-music]'); if (!el || !ui.panel?.contains(el)) return false;
    if (el.tagName === 'A') return true;
    unlockSound(); // browsers only allow the ambience after a tap
    const m = music(), a = el.dataset.music, save = () => ctx().saveSettingsDebounced();
    if (a === 'finish') { await finishSignIn(ui.panel.querySelector('[data-music-field="paste"]')?.value ?? ''); redraw(); }
    else if (a === 'toggle-on') await setOn(!m.on);
    else if (a === 'play') await togglePlay();
    else if (a === 'next') await nextBest();
    else if (a === 'reroll') { const p = reRoll(); redraw(); await p; }
    else if (a === 'lock') toggleLock();
    else if (a === 'kind') forceMode(el.dataset.v || '');
    else if (a === 'fits') await feedback(true);
    else if (a === 'nothere') await feedback(false);
    else if (a === 'edit-now') { ui.musicSong = mus.now?.uri ?? ''; ui.musicOpen = { ...(ui.musicOpen ?? {}), songs: true }; redraw(); toEditor(); }
    else if (a === 'edit') { ui.musicSong = ui.musicSong === el.dataset.uri ? '' : el.dataset.uri; redraw(); toEditor(); }
    else if (a === 'close-edit') { ui.musicSong = ''; redraw(); }
    else if (a === 'edit-now-row') { ui.musicSong = mus.now?.uri ?? ''; redraw(); toEditor(); }
    else if (a === 'tag') setTag(el.dataset.uri, el.dataset.k, el.dataset.v);
    else if (a === 'playlist') { togglePlaylist(el.dataset.id); redraw(); }
    else if (a === 'plall') { ui.musicPlAll = !ui.musicPlAll; redraw(); }
    else if (a === 'load') await loadPlaylists();
    else if (a === 'export') exportSheet();
    else if (a === 'set') { m[el.dataset.k] = ['hold', 'tellFor'].includes(el.dataset.k) ? Number(el.dataset.v) : el.dataset.v; save(); redraw(); }
    else if (a === 'group') { ui.musicGroup = ui.musicGroup === el.dataset.v || (!ui.musicGroup && el.dataset.v === 'feeling') ? 'none' : el.dataset.v; redraw(); }
    else if (a === 'allnames') { ui.musicAllNames = !ui.musicAllNames; redraw(); }
    else if (a === 'flag') { m[el.dataset.k] = !m[el.dataset.k]; save(); redraw(); }
    else if (a === 'devices') { await sync(); try { const { devices } = await import('../app/spotify.js'); mus.devices = await devices(m); } catch (err) { mus.error = err.message; } redraw(); }
    else if (a === 'device') { m.device = el.dataset.id; m.deviceName = mus.devices.find(d => d.id === el.dataset.id)?.name ?? ''; save(); if (m.on) await start(); redraw(); }
    else if (a === 'signout') signOut();
    else if (a === 'extra') setExtra(el.dataset.k, el.dataset.v);
    else if (a === 'amb-pause') toggleAmbience();
    else if (a === 'amb-more') { ui.musicOpen = { ...(ui.musicOpen ?? {}), amb: !ui.musicOpen?.amb }; redraw(); }
    else if (a === 'extrachar') toggleExtraFor(el.dataset.k, el.dataset.v ?? '');
    else if (a === 'amblevel') setAmbLevel(el.dataset.v);
    else if (a === 'ambkind') toggleAmbKind(el.dataset.v);
    else if (a === 'venues') toggleVenues();
    else if (a === 'storyonly') toggleStoryOnly();
    else if (a === 'mix') setMix(el.dataset.v);
    else if (a === 'sound') redraw();
    else if (a === 'playit') { await playChosen(el.dataset.uri); redraw(); }
    else if (a === 'seekbar') { const r = el.querySelector('.mw-music-track').getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); await seekTo(f * (mus.now?.ms ?? 0)); redraw(); }
    else if (a === 'back15') { await seekBy(-15); redraw(); }
    else if (a === 'fwd15') { await seekBy(15); redraw(); }
    else if (a === 'markpeak') { markPeak(); redraw(); }
    else if (a === 'notes') { ui.musicNotes = !ui.musicNotes; redraw(); }
    else if (a === 'remove-ask') { ui.musicRemove = el.dataset.uri; redraw(); }
    else if (a === 'remove-cancel') { ui.musicRemove = null; redraw(); }
    else if (a === 'remove') { const uri = el.dataset.uri; ui.musicRemove = null; await removeSong(uri); if (!m.songs[uri] && ui.musicSong === uri) ui.musicSong = null; redraw(); }
    else if (a === 'untagged') {
        ui.musicUntagged = untaggedText(); redraw();
        const box = ui.panel?.querySelector('.mw-music-copy');
        if (box) { box.focus(); box.select(); box.setSelectionRange(0, box.value.length); try { if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(box.value); else document.execCommand('copy'); } catch { /* the text stays selected to copy by hand */ } }
    }
    return true;
}
export async function musicChange(e, redraw) {
    const el = e.target.closest('[data-music-field]'); if (!el) return false;
    const m = music(), f = el.dataset.musicField;
    if (f === 'clientId') { if (m.clientId === el.value.trim()) return true; m.clientId = el.value.trim(); m.pending = null; ctx().saveSettingsDebounced(); redraw(); }
    else if (f === 'import' && el.files?.[0]) { await importSheet(el.files[0]); el.value = ''; redraw(); }
    else if (f === 'moods') setTag(el.dataset.uri, 'm', el.value);
    else if (f === 'cues') { setTag(el.dataset.uri, 'cue', el.value); redraw(); }
    else if (f === 'cuewords') { setTag(el.dataset.uri, 'cw', el.value); redraw(); }
    else if (f === 'peak') { setTag(el.dataset.uri, 'pk', el.value); redraw(); }
    else if (f === 'year') { setTag(el.dataset.uri, 'yr', el.value); redraw(); }
    else if (f === 'kind') { forceMode(el.value || ''); redraw(); }
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
