// The ♫ Music tab: sign in to Spotify, what's playing and why, your playlists, the song sheet and song tags.
// Everything is a tap: chips and big buttons, no sliders or dragging.
import { EXTRAS, ambienceBeds, characterNames, eraEnd, exportSheet, extraChars, extraOn, feedback, finishSignIn, followName, forceMode, importSheet, loadPlaylists, mus, music, nextBest, radioOn, reRoll, setAmbLevel, setExtra, setOn, setTag, signOut, start, sync, thisCharName, toggleExtraFor, toggleLock, togglePlay, togglePlaylist, unlockSound, usableSongs } from '../app/music.js';
import { BED_LABELS, needsTap } from '../app/ambience.js';
import { canReturn, prepareSignIn, redirectFor, signedIn } from '../app/spotify.js';
import { ctx, ui } from '../app/state.js';
import { CHANGE_CHOICES, HOLD_CHOICES, THEME_CHOICES } from '../data/catalogue/music.js';
import { BEATS, DYN_GROUPS, ENERGY, FAMILIES, HEAT, MEANINGS, MODES, MOMENTS, PLACES, cleanTags, describe, emptyTags, labelOf, norm, peakText } from '../engine/music.js';
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
// "This scene is…": what kind of scene Moodweaver thinks it is, and a tap to tell it (holds for 6 replies).
function kindRow(snap) {
    const now = mus.forced?.mode ?? '', seen = snap?.mode ?? '';
    const chipFor = (id, label) => `<button type="button" class="mw-mchip" data-music="kind" data-v="${id}" aria-pressed="${id ? now === id : !now}">${esc(label)}${!now && id && id === seen ? ' ·' : ''}</button>`;
    return `<div class="mw-music-kind"><small>${now ? `This scene is ${esc(MODES.find(x => x.id === now)?.label ?? now)} for ${mus.forced.left} more ${mus.forced.left === 1 ? 'reply' : 'replies'}` : `This scene reads as ${seen ? esc(MODES.find(x => x.id === seen)?.label ?? seen) : 'nothing in particular'} · tap to set it yourself`}</small>
        <div class="mw-mchips">${chipFor('', 'Auto')}${MODES.map(x => chipFor(x.id, x.label)).join('')}</div></div>`;
}
// What the extras are doing right now: the in-story radio, a sting that just hit, and the ambience.
function extrasLines(m) {
    const out = [];
    if (radioOn(m)) {
        const end = eraEnd(), dated = usableSongs(m).filter(x => x.tags?.yr).length;
        out.push(`📻 ${esc(mus.radio.kind[0].toUpperCase() + mus.radio.kind.slice(1))} is playing in the story${end ? ` · songs from ${end} or earlier` : ''}${mus.radio.empty ? ' · no song with a Year fits, so any song plays' : !dated ? ' · no songs have a Year yet, so any song plays' : ''}`);
    }
    if (mus.sting && Date.now() - mus.sting.at < 5 * 60 * 1000) out.push(`⚡ Sting: ${esc(mus.sting.beat.toLowerCase())} → ${esc(mus.sting.name)}`);
    if (extraOn('amb', m) && m.on) {
        const beds = ambienceBeds(mus.latest, m);
        if (beds.length) out.push(`☁ Ambience: ${esc(beds.map(b => BED_LABELS[b] ?? b).join(', '))}${needsTap() ? ' · <button type="button" class="mw-music-quiet mw-music-inline" data-music="sound">Tap to start the ambience</button>' : ''}`);
    }
    return out.map(l => `<p class="mw-music-note">${l}</p>`).join('');
}
const restText = ms => { const min = Math.ceil((ms ?? 0) / 60000); return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m more` : `${min} min more`; };
function nowCard(m, tone) {
    const n = mus.now, snap = mus.latest, playing = Boolean(n?.playing && m.on);
    const why = (mus.why ?? []).filter(Boolean).slice(0, 4);
    // Lyric cues the story just said: one line, so you can see a cue was heard and why it did or didn't play.
    const seen = new Set(), heard = (mus.heard ?? []).filter(h => h.name && !seen.has(norm(h.name)) && seen.add(norm(h.name))).slice(0, 3);
    const heardLine = heard.length ? `<p class="mw-music-note">Heard in the story: ${heard.map(h => `“${esc(h.cue)}” → ${esc(h.name)}${h.uri === mus.now?.uri ? ' (playing)' : h.resting ? ` (resting ${restText(h.restLeft)}: it played for a cue not long ago)` : h.fits ? ' (nudged)' : " (doesn't fit this scene)"}`).join(' · ')}</p>` : '';
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
        <button type="button" class="mw-music-reroll" data-music="reroll"${mus.busy ? ' disabled' : ''}>↻ Re-roll for the story now</button>
        ${heardLine}
        ${extrasLines(m)}
        ${mus.error ? `<p class="mw-music-note is-warn">${esc(mus.error)}</p>` : mus.status ? `<p class="mw-music-note">${esc(mus.status)}</p>` : ''}
        ${n ? `<div class="mw-music-verdict"><button type="button" data-music="fits">✦ Fits</button><button type="button" data-music="nothere">✕ Not here</button><button type="button" data-music="edit-now">✎ Tags</button></div>` : ''}
        ${kindRow(snap)}
        ${why.length ? `<div class="mw-music-why"><small>Picked for</small>${why.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}
        ${snap ? `<p class="mw-music-scene">${esc(describe(snap, snap.name))}</p>` : ''}
        ${mus.loading ? `<p class="mw-music-note">${esc(mus.loading)}</p>` : ''}
    </section>`;
}
// Whose moods pick the music: three little planets, the same orbs as the people at the top of the panel.
function followCard(m, t) {
    const orb = (who, name, tag, tone, two) => `<button type="button" class="mw-music-who" data-music="set" data-k="follow" data-v="${who}" aria-pressed="${m.follow === who}" style="${toneVars(tone)}">
        <span class="mw-music-who-orbs">${two ? `<i style="${toneVars(t.char)}">${esc(followName('char')[0] ?? '')}</i><i style="${toneVars(t.user)}">${esc(followName('user')[0] ?? '')}</i>` : `<i>${esc(who === 'story' ? '✦' : String(name)[0] ?? '')}</i>`}</span>
        <b>${esc(name)}</b><small>${tag}</small></button>`;
    return `<section class="mw-music-follow"><p class="mw-music-label">Music follows</p><div class="mw-music-whos">
        ${orb('char', followName('char'), '{{char}}', t.char)}${orb('user', followName('user'), '{{user}}', t.user)}${orb('both', 'Both', 'their moods', t.char, true)}${orb('story', '✦ Story', 'like a film score', t.char)}</div>
        ${m.follow === 'story' ? '<p class="mw-fine">Story: the music scores the whole scene, like a film. It holds one cue through a scene and changes when the scene does (a new place, kind of scene, someone arriving, heat), not with every passing feeling.</p>' : ''}</section>`;
}
// You may have hundreds of playlists: the ticked ones are lit stars on top, the rest are found by searching (or a
// tap on "Show all"), in one quiet list.
function playlistCard(m) {
    const all = Object.entries(m.playlists).sort((a, b) => a[1].name.localeCompare(b[1].name)), ticked = all.filter(([, p]) => p.on);
    const q = norm(ui.musicPlSearch ?? ''), others = all.filter(([, p]) => !p.on), found = q ? all.filter(([, p]) => norm(p.name).includes(q)) : ui.musicPlAll ? others : [];
    const row = ([id, p]) => `<button type="button" class="mw-music-row" data-music="playlist" data-id="${esc(id)}" aria-pressed="${Boolean(p.on)}"${p.owned ? '' : ' disabled title="Spotify only lets apps read playlists you made. Copy it into a new playlist of your own to use it."'}><span class="mw-music-tick" aria-hidden="true">${p.on ? '✦' : '✧'}</span><span class="mw-music-name">${esc(p.name)}${p.gone ? ' <small>(not found on Spotify)</small>' : ''}</span><small>${p.count ? p.count : ''}</small></button>`;
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
// The tag editor: one section open at a time (a tap on its bar opens it and closes the others), each bar saying
// what is lit inside, so the editor stays short. Bars are big, bright and plainly tappable.
function tagEditor(m, uri) {
    const s = m.songs[uri]; if (!s) return '';
    const t = cleanTags(m.tags[uri] ?? emptyTags()), tag = (k, v, label, on) => chip(`data-music="tag" data-uri="${esc(uri)}" data-k="${k}" data-v="${esc(v)}"`, on, label);
    const open = ui.musicGroup ?? 'feeling';
    const group = (id, title, lit, body) => `<div class="mw-music-group${open === id ? ' is-open' : ''}"><button type="button" class="mw-music-gbar" data-music="group" data-v="${id}" aria-expanded="${open === id}"><b>${title}</b><small>${lit.length ? esc(lit.slice(0, 3).join(', ')) + (lit.length > 3 ? ` +${lit.length - 3}` : '') : 'none'}</small><span aria-hidden="true">${open === id ? '–' : '+'}</span></button>${open === id ? `<div class="mw-mchips">${body}</div>` : ''}</div>`;
    // Names: the chat's two, {{char}}/{{user}}/Any and whoever is already ticked; the rest on request.
    const here = [followName('char'), followName('user')], ticked = t.c.filter(c => !['{{char}}', '{{user}}', 'any'].includes(norm(c)));
    const all = characterNames(), base = [...new Set(['{{char}}', '{{user}}', 'Any', ...here, ...ticked])];
    const names = ui.musicAllNames ? [...new Set([...base, ...all])] : base;
    const neverAll = [...MODES.map(x => [`k:${x.id}`, `${x.label} scenes`]), ...FAMILIES.map(x => [`f:${x.id}`, x.label]), ...MOMENTS.map(x => [`mo:${x.id}`, x.label]), ...HEAT.map(x => [`h:${x.id}`, x.label])];
    const nowOn = mus.now?.uri === uri;
    return `<div class="mw-music-editor${nowOn ? ' is-now' : ''}"><div class="mw-music-editor-head"><span class="mw-music-orb" aria-hidden="true">${nowOn ? '♫' : '♪'}</span><span class="mw-music-dt"><b>${esc(s.n)}</b><small>${nowOn ? 'Playing now · ' : ''}${esc(s.a)}</small></span><button type="button" class="mw-music-quiet" data-music="close-edit">Done</button></div>
        ${group('side', 'Whose song', t.c, names.map(n => tag('c', n, n, t.c.some(c => norm(c) === norm(n)))).join('') + (all.length > base.length ? `<button type="button" class="mw-mchip is-more" data-music="allnames">${ui.musicAllNames ? 'Fewer names' : `All ${all.length} names…`}</button>` : ''))}
        ${group('feeling', 'Feeling', t.f.map(id => labelOf('f', id)), FAMILIES.map(f => tag('f', f.id, f.label, t.f.includes(f.id))).join(''))}
        ${group('meaning', 'Meaning', t.cm.map(id => labelOf('cm', id)), MEANINGS.map(x => tag('cm', x.id, x.label, t.cm.includes(x.id))).join(''))}
        ${group('moment', 'Moment', t.mo.map(id => labelOf('mo', id)), MOMENTS.map(x => tag('mo', x.id, x.label, t.mo.includes(x.id))).join(''))}
        ${group('dynamic', 'Dynamic', t.d.map(id => labelOf('d', id)), DYN_GROUPS.map(x => tag('d', x.id, x.label, t.d.includes(x.id))).join(''))}
        ${group('heat', 'Energy and heat', [t.e ? `energy ${t.e}` : '', t.h ? labelOf('h', t.h) : ''].filter(Boolean), ENERGY.map(x => tag('e', x.id, x.label, t.e === x.id)).join('') + HEAT.map(x => tag('h', x.id, x.label, t.h === x.id)).join(''))}
        ${group('place', 'Place', t.p.map(id => labelOf('p', id)), PLACES.map(x => tag('p', x.id, x.label, t.p.includes(x.id))).join(''))}
        ${group('never', 'Never during', t.nv.map(v => neverAll.find(([k]) => k === v)?.[1] ?? v), neverAll.map(([v, l]) => tag('nv', v, l, t.nv.includes(v))).join(''))}
        ${group('moods', 'Exact moods', t.m.map(id => labelOf('m', id)), `<label class="mw-music-note">Names separated by commas, as in the sheet<input type="text" data-music-field="moods" data-uri="${esc(uri)}" value="${esc(t.m.map(id => labelOf('m', id)).join(', '))}"></label>`)}
        ${group('cues', 'Cues', [...t.cue, ...t.cw], `<label class="mw-music-note">Phrases: each one alone nods to this song when the story says it (like a dog). Separate with commas.<input type="text" data-music-field="cues" data-uri="${esc(uri)}" value="${esc(t.cue.join(', '))}" autocapitalize="off" spellcheck="false"></label><label class="mw-music-note">Theme words: any two of these close together count (dog*, leash*, collar*, salivat*). A * means any ending.<input type="text" data-music-field="cuewords" data-uri="${esc(uri)}" value="${esc(t.cw.join(', '))}" autocapitalize="off" spellcheck="false"></label><p class="mw-fine">When the story cues this song and it fits the scene, it almost always plays next (always on ↻ Re-roll), then rests for 10 minutes.</p>`)}
        ${group('sting', 'Sting, peak and year', [...t.st.map(id => BEATS.find(b => b.id === id)?.label ?? id), t.pk ? `peak ${peakText(t.pk)}` : '', t.yr ? String(t.yr) : ''].filter(Boolean), `<p class="mw-fine">Sting: a big beat this song can cut in on, straight away.</p>${BEATS.map(b => tag('st', b.id, b.label, t.st.includes(b.id))).join('')}<label class="mw-music-note">Peak: where its chorus or drop starts, like 1:05 (empty: Moodweaver finds or guesses it)<input type="text" inputmode="numeric" data-music-field="peak" data-uri="${esc(uri)}" value="${esc(peakText(t.pk))}" placeholder="1:05"></label><label class="mw-music-note">Year it first came out (for the in-story radio)<input type="text" inputmode="numeric" data-music-field="year" data-uri="${esc(uri)}" value="${t.yr || ''}" placeholder="1962"></label>`)}
        <div class="mw-mchips mw-music-flags">${tag('th', '1', '★ Theme song', t.th)}${tag('fav', '1', '♥ Favourite', t.fav)}${tag('off', '1', 'Off (never play)', t.off)}</div>
        ${t.note ? `<p class="mw-fine">${esc(t.note)}</p>` : ''}</div>`;
}
function songsCard(m) {
    const term = norm(ui.musicSearch ?? ''), songs = usableSongs(m);
    const hits = (term ? songs.filter(x => norm(`${x.song.n} ${x.song.a}`).includes(term)) : songs).slice(0, 40);
    const tagged = songs.filter(x => m.tags[x.uri]).length;
    // What's playing sits on top and glows, one tap from its tags.
    const now = mus.now?.uri ? songs.find(x => x.uri === mus.now.uri) ?? (m.songs[mus.now.uri] ? { uri: mus.now.uri, song: m.songs[mus.now.uri] } : null) : null;
    const nowRow = now ? `<div class="mw-music-rows"><button type="button" class="mw-music-row is-song is-now" data-music="edit" data-uri="${esc(now.uri)}" aria-pressed="${ui.musicSong === now.uri}"><span class="mw-music-tick" aria-hidden="true">♫</span><span class="mw-music-name"><b>${esc(now.song.n)}</b><small>Playing now · ${esc(now.song.a)}</small></span></button></div>` : '';
    const body = `${ui.musicSong ? tagEditor(m, ui.musicSong) : ''}
        <input type="search" class="mw-music-search" data-music-field="search" value="${esc(ui.musicSearch ?? '')}" placeholder="✧  Find a song or artist" aria-label="Find a song">
        ${nowRow}
        <div class="mw-music-rows">${hits.filter(x => x.uri !== mus.now?.uri).map(x => `<button type="button" class="mw-music-row is-song" data-music="edit" data-uri="${esc(x.uri)}" aria-pressed="${ui.musicSong === x.uri}"><span class="mw-music-tick" aria-hidden="true">${m.tags[x.uri] ? '✦' : '·'}</span><span class="mw-music-name"><b>${esc(x.song.n)}</b><small>${esc(x.song.a)}</small></span></button>`).join('')}</div>
        ${songs.length > hits.length ? `<p class="mw-music-note">Showing ${hits.length} of ${songs.length}. Search to find others.</p>` : ''}`;
    return drawer('songs', '♪', 'Songs', `${plural(songs.length, 'song')} · ${tagged} with their own tags`, body, ui.musicOpen?.songs || ui.musicSong);
}
function settingsCard(m) {
    const body = `<p class="mw-music-label">Change songs</p><div class="mw-mchips">${CHANGE_CHOICES.map(([v, l]) => choice('change', v, m.change, l)).join('')}</div>
        <p class="mw-music-label">Shortest time before cutting a song</p><div class="mw-mchips">${HOLD_CHOICES.map(([v, l]) => choice('hold', v, m.hold, l)).join('')}</div>
        <p class="mw-music-label">Theme songs play</p><div class="mw-mchips">${THEME_CHOICES.map(([v, l]) => choice('themes', v, m.themes, l)).join('')}</div>
        <p class="mw-music-label">Extras</p><div class="mw-mchips">${chip('data-music="flag" data-k="feel"', m.feel, 'Let the story feel the music')}${chip('data-music="flag" data-k="tell"', m.tell, 'Tell the story the song')}${chip('data-music="flag" data-k="cues"', m.cues, 'Lyric cues')}</div>
        <p class="mw-fine">“Let the story feel the music” adds a few words on the music's feel, never its name (about 15 tokens). “Tell the story the song” gives Claude the song and artist, whatever the era, to score the scene by: never quoted, named or heard by anyone (about 70 tokens). Both are off by default: otherwise the music costs no tokens. “Lyric cues” (on by default, no tokens): when the story says one of a song's cue phrases, that song almost always plays next if it fits the scene, then rests for 10 minutes.</p>
        ${m.tell ? `<p class="mw-music-label">Tell it for</p><div class="mw-mchips">${[[1, 'First reply of a song'], [2, '2 replies'], [3, '3 replies'], [0, 'While it plays']].map(([v, l]) => choice('tellFor', v, Number(m.tellFor), l)).join('')}</div><p class="mw-fine">Short is safest: the song sets the mood as it starts, then the story moves on freely.</p>` : ''}
        <p class="mw-music-label">Playing on</p><p class="mw-music-note">${esc(m.deviceName || 'Whichever Spotify is open')}</p>
        ${mus.devices.length > 1 ? `<div class="mw-mchips">${mus.devices.map(d => chip(`data-music="device" data-id="${esc(d.id)}"`, d.id === m.device, d.name)).join('')}</div>` : ''}
        <div class="mw-music-pair"><button type="button" class="mw-music-quiet" data-music="devices">Find my Spotify devices</button><button type="button" class="mw-music-quiet" data-music="signout">Sign out of Spotify</button></div>`;
    return drawer('settings', '☾', 'Music settings', `${(CHANGE_CHOICES.find(([v]) => v === m.change) ?? [, ''])[1]}`, body, ui.musicOpen?.settings);
}
// ✧ Extras: each one Off, on for Everyone, or on for Only some characters (ticked one by one, saved with them).
const MODE_LABELS = [['off', 'Off'], ['all', 'Everyone'], ['some', 'Only some']];
function extrasCard(m) {
    const me = thisCharName();
    const row = x => {
        const mode = m.extras[x.id] ?? 'off', ticked = extraChars(x.id), others = ticked.filter(n => norm(n) !== norm(me));
        const some = mode === 'some' ? `<div class="mw-mchips">${me ? chip(`data-music="extrachar" data-k="${x.id}"`, ticked.some(n => norm(n) === norm(me)), `${ticked.some(n => norm(n) === norm(me)) ? '✓' : '+'} ${me}`) : ''}${others.map(n => chip(`data-music="extrachar" data-k="${x.id}" data-v="${esc(n)}"`, true, `✓ ${n}`)).join('')}</div>
            <p class="mw-fine">${me ? `Tap ${esc(me)} to switch it on or off for them. ` : ''}It follows each ticked character into every chat. Tap a ticked name to untick it.</p>` : '';
        const level = x.id === 'amb' && mode !== 'off' ? `<p class="mw-music-label">How loud</p><div class="mw-mchips">${[[1, 'Soft'], [2, 'Medium'], [3, 'Loud']].map(([v, l]) => chip(`data-music="amblevel" data-v="${v}"`, Number(m.ambLevel) === v, l)).join('')}</div>` : '';
        return `<div class="mw-music-extra${x.under ? ' is-under' : ''}"><p class="mw-music-label">${esc(x.label)}${extraOn(x.id, m) ? ' <span class="mw-music-lit">· on here</span>' : ''}</p><p class="mw-fine">${esc(x.note)}</p>
            <div class="mw-mchips">${MODE_LABELS.map(([v, l]) => chip(`data-music="extra" data-k="${x.id}" data-v="${v}"`, mode === v, l)).join('')}</div>${some}${level}</div>`;
    };
    const lit = EXTRAS.filter(x => extraOn(x.id, m)).map(x => x.label.toLowerCase());
    return drawer('extras', '✧', 'Extras', lit.length ? `On here: ${esc(lit.join(', '))}` : 'Crossfade, stings, peaks, ambience, radio', EXTRAS.filter(x => !x.under || (m.extras[x.under] ?? 'off') !== 'off').map(row).join(''), ui.musicOpen?.extras);
}
// After picking a song, bring its editor into view.
function toEditor() { requestAnimationFrame(() => ui.panel?.querySelector('.mw-music-editor')?.scrollIntoView({ block: 'start', behavior: 'smooth' })); }
export function musicView() {
    const m = music();
    if (!signedIn(m)) return `<div class="mw-music">${setupCard(m)}<div class="mw-music-drawers">${sheetCard(m)}</div></div>`;
    const t = tones(), lead = m.follow === 'user' ? t.user : t.char;
    return `<div class="mw-music">${nowCard(m, lead)}${followCard(m, t)}<div class="mw-music-drawers">${playlistCard(m)}${songsCard(m)}${sheetCard(m)}${extrasCard(m)}${settingsCard(m)}</div></div>`;
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
    else if (a === 'extrachar') toggleExtraFor(el.dataset.k, el.dataset.v ?? '');
    else if (a === 'amblevel') setAmbLevel(el.dataset.v);
    else if (a === 'sound') redraw();
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
