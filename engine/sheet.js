// The song sheet: turning the music library into spreadsheet rows with dropdowns, and reading a filled-in
// sheet (xlsx or CSV, including exportify.net's CSV) back into tags. No SillyTavern here.
import { BEATS, DYN_GROUPS, ENERGY, cleanPeak, cleanYear, peakText, FAMILIES, HEAT, MEANINGS, MODES, MOMENTS, MOOD_LIST, PLACES, cleanTags, emptyTags, cleanCueWords, cleanCues, labelOf, norm, split } from './music.js';
import { buildXlsx, colName } from './xlsx.js';
import { HEARD_IN } from '../data/catalogue/music.js';

export const TAG_COLS = ['Feeling 1', 'Feeling 2', 'Exact moods', 'Place 1', 'Place 2', 'Moment', 'Dynamic', 'Meaning', 'Heat', 'Energy', 'Character', 'Theme', 'Never during', 'Favourite', 'Off', 'Cues', 'Cue words', 'Sting', 'Peak', 'Year', 'Heard in', 'Notes'];
// Sound (last column): the song's styles, like Spotify's genres (trip hop, dream pop). Exportify CSVs fill it in;
// you can type your own. \u2726 Fits teaches Moodweaver which sounds suit which kind of scene.
export const SONG_COLS = ['Song', 'Artist', 'Album', 'From playlist', "Spotify ID (don't edit)", 'Length', ...TAG_COLS, 'Sound'];
export const PLAYLIST_COLS = ['Playlist', "Spotify ID (don't edit)", 'Songs', ...TAG_COLS];
export const CHAR_COLS = ['Character', 'Default playlist', 'Theme song', 'Notes'];

// ---- Spotify ids ----
// "spotify:track:abc", "https://open.spotify.com/track/abc?si=\u2026" or a bare id \u2192 "spotify:track:abc".
export function trackUri(value) {
    const s = String(value ?? '').trim();
    const m = s.match(/spotify:track:([A-Za-z0-9]{22})/) ?? s.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/([A-Za-z0-9]{22})/) ?? s.match(/^([A-Za-z0-9]{22})$/);
    return m ? `spotify:track:${m[1]}` : '';
}
const minutes = ms => { const s = Math.round((Number(ms) || 0) / 1000); return s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : ''; };

// ---- Tags \u21c4 cells ----
export function tagsToCells(t = emptyTags()) {
    const join = (kind, list) => list.map(id => labelOf(kind, id)).join(', ');
    const never = t.nv.map(v => { const [k, id] = [v.slice(0, v.indexOf(':')), v.slice(v.indexOf(':') + 1)]; return labelOf(k, id); }).join(', ');
    return [labelOf('f', t.f[0] ?? '') || '', join('f', t.f.slice(1)), join('m', t.m), labelOf('p', t.p[0] ?? '') || '', join('p', t.p.slice(1)), join('mo', t.mo), join('d', t.d), join('cm', t.cm ?? []),
        t.h ? labelOf('h', t.h) : '', t.e ? ENERGY.find(e => e.id === t.e)?.label ?? '' : '', t.c.join(', '), t.th ? 'Yes' : '', never, t.fav ? '\u2605' : '', t.off ? 'Off' : '', (t.cue ?? []).join(', '), (t.cw ?? []).join(', '), (t.st ?? []).map(id => BEATS.find(b => b.id === id)?.label ?? id).join(', '), peakText(t.pk), t.yr || '', (t.dg ?? []).map(id => HEARD_IN.find(x => x.id === id)?.label ?? id).join(', '), t.note ?? ''];
}
const lookup = list => { const m = new Map(); for (const x of list) { m.set(norm(x.label), x.id); m.set(norm(x.id), x.id); } return m; };
const MODE_ROWS = MODES.map(x => ({ id: x.id, label: `${x.label} scenes` }));
const FIND = { cm: lookup(MEANINGS), f: lookup(FAMILIES), m: lookup(MOOD_LIST), p: lookup(PLACES), mo: lookup(MOMENTS), d: lookup(DYN_GROUPS), h: lookup(HEAT), k: new Map(MODE_ROWS.map(x => [norm(x.label), x.id])) };
const YES = /^(yes|y|true|x|\u2713|\u2714|\u2605|\u2606|\*|1|on|off)$/i;
// A header row \u2192 where each column is, by name (spaces and case don't matter).
export const headerIndex = row => { const m = new Map(); (row ?? []).forEach((h, i) => { const k = norm(h).replace(/[^a-z0-9]/g, ''); if (k && !m.has(k)) m.set(k, i); }); return m; };
const cellOf = (row, idx, name) => { const i = idx.get(norm(name).replace(/[^a-z0-9]/g, '')); return i === undefined ? '' : String(row[i] ?? '').trim(); };
// characters: the names SillyTavern knows, so "easterman" comes back as "Easterman".
export function cellsToTags(row, idx, characters = [], unknown = new Set()) {
    // A few names have commas of their own ("Toxic, broken & on-off"), so the longest run of pieces that names something wins.
    const t = emptyTags(), take = (kind, cell, into) => {
        const parts = split(cell);
        for (let i = 0; i < parts.length;) {
            let n = Math.min(3, parts.length - i), id = '';
            for (; n > 0; n--) { id = FIND[kind].get(norm(parts.slice(i, i + n).join(', '))); if (id) break; }
            if (id) { into.push(id); i += n; } else { unknown.add(parts[i]); i++; }
        }
    };
    take('f', cellOf(row, idx, 'Feeling 1'), t.f); take('f', cellOf(row, idx, 'Feeling 2'), t.f); take('f', cellOf(row, idx, 'Feeling'), t.f);
    take('m', cellOf(row, idx, 'Exact moods'), t.m);
    take('p', cellOf(row, idx, 'Place 1'), t.p); take('p', cellOf(row, idx, 'Place 2'), t.p); take('p', cellOf(row, idx, 'Place'), t.p);
    take('mo', cellOf(row, idx, 'Moment'), t.mo); take('d', cellOf(row, idx, 'Dynamic'), t.d); take('cm', cellOf(row, idx, 'Meaning'), t.cm);
    const heat = FIND.h.get(norm(cellOf(row, idx, 'Heat'))); if (heat) t.h = heat; else if (cellOf(row, idx, 'Heat')) unknown.add(cellOf(row, idx, 'Heat'));
    const e = cellOf(row, idx, 'Energy').match(/[1-5]/) ?? [String(['still', 'low', 'medium', 'high', 'frantic'].indexOf(norm(cellOf(row, idx, 'Energy'))) + 1)];
    t.e = Number(e[0]) || 0;
    const canon = new Map(characters.map(n => [norm(n), n]));
    t.c = split(cellOf(row, idx, 'Character')).map(v => /^\{\{\s*(char|user)\s*\}\}$/i.test(v) ? `{{${v.replace(/[{}\s]/g, '').toLowerCase()}}}` : norm(v) === 'any' ? 'Any' : canon.get(norm(v)) ?? v);
    t.th = YES.test(cellOf(row, idx, 'Theme')) && !/^off$/i.test(cellOf(row, idx, 'Theme'));
    for (const v of split(cellOf(row, idx, 'Never during'))) {
        const k = ['k', 'f', 'mo', 'h'].find(kind => FIND[kind].has(norm(v)));
        if (k) t.nv.push(`${k}:${FIND[k].get(norm(v))}`); else unknown.add(v);
    }
    t.fav = YES.test(cellOf(row, idx, 'Favourite')) && !/^off$/i.test(cellOf(row, idx, 'Favourite'));
    t.off = YES.test(cellOf(row, idx, 'Off'));
    t.cue = cleanCues(split(cellOf(row, idx, 'Cues')));
    t.cw = cleanCueWords(split(cellOf(row, idx, 'Cue words')));
    for (const v of split(cellOf(row, idx, 'Sting'))) { const b = BEATS.find(x => norm(x.label) === norm(v) || x.id === norm(v)); if (b) t.st.push(b.id); else unknown.add(v); }
    t.pk = cleanPeak(cellOf(row, idx, 'Peak')); t.yr = cleanYear(cellOf(row, idx, 'Year'));
    for (const v of split(cellOf(row, idx, 'Heard in'))) { const h = HEARD_IN.find(x => norm(x.label) === norm(v) || x.id === norm(v)); if (h) t.dg.push(h.id); else unknown.add(v); }
    t.note = cellOf(row, idx, 'Notes');
    return cleanTags(t);
}

// ---- Writing the sheet ----
// lib: { songs: { uri: { n, a, al, ms, pl: [ids] } }, playlists: { id: { name, on } }, tags: { uri: tags }, ptags: { id: tags }, chars: { key: { name, pl, theme } } }
// characters: names for the Character dropdown (SillyTavern's characters and personas).
export function sheetFile(lib, characters = []) {
    const pls = Object.entries(lib.playlists ?? {}).filter(([, p]) => p.on), plName = id => lib.playlists?.[id]?.name ?? '';
    const onIds = new Set(pls.map(([id]) => id));
    const songs = Object.entries(lib.songs ?? {}).filter(([, s]) => (s.pl ?? []).some(id => onIds.has(id)) || lib.tags?.[s.uri]);
    songs.sort((a, b) => plName(a[1].pl?.[0]).localeCompare(plName(b[1].pl?.[0])) || String(a[1].a).localeCompare(String(b[1].a)) || String(a[1].n).localeCompare(String(b[1].n)));
    const charNames = [...new Set(['{{char}}', '{{user}}', 'Any', ...characters])];
    const lists = [['Feelings', FAMILIES.map(x => x.label)], ['Exact moods', MOOD_LIST.map(x => x.label)], ['Places', PLACES.map(x => x.label)], ['Moments', MOMENTS.map(x => x.label)],
        ['Dynamics', DYN_GROUPS.map(x => x.label)], ['Meanings', MEANINGS.map(x => x.label)], ['Heat', HEAT.map(x => x.label)], ['Energy', ENERGY.map(x => x.label)], ['Characters', charNames],
        ['Never during', [...MODE_ROWS.map(x => x.label), ...FAMILIES.map(x => x.label), ...MOMENTS.map(x => x.label), ...HEAT.map(x => x.label)]], ['Yes', ['Yes']], ['Favourite', ['\u2605']], ['Off', ['Off']], ['Stings', BEATS.map(b => b.label)], ['Heard in', HEARD_IN.map(x => x.label)], ['Playlists', pls.map(([, p]) => p.name)]];
    const listCol = Object.fromEntries(lists.map(([name, vals], i) => [name, `Lists!$${colName(i)}$2:$${colName(i)}$${Math.max(2, vals.length + 1)}`]));
    const listRows = Array.from({ length: Math.max(...lists.map(([, v]) => v.length)) + 1 }, (_, r) => lists.map(([name, vals]) => r === 0 ? name : vals[r - 1] ?? ''));
    const tagSource = { 'Feeling 1': 'Feelings', 'Feeling 2': 'Feelings', 'Exact moods': 'Exact moods', 'Place 1': 'Places', 'Place 2': 'Places', Moment: 'Moments', Dynamic: 'Dynamics', Meaning: 'Meanings', Heat: 'Heat', Energy: 'Energy', Character: 'Characters', Theme: 'Yes', 'Never during': 'Never during', Favourite: 'Favourite', Off: 'Off', Sting: 'Stings', 'Heard in': 'Heard in' };
    const tagWidths = [22, 22, 28, 20, 20, 16, 26, 28, 11, 10, 14, 8, 20, 10, 6, 26, 30, 18, 7, 7, 20, 28];
    const dropdowns = (first, rows) => TAG_COLS.map((name, i) => tagSource[name] ? { col: first + i, rows: [2, rows + 1], source: listCol[tagSource[name]] } : null).filter(Boolean);
    const headStyles = (auto, total) => Array.from({ length: total }, (_, i) => i < auto ? 1 : 2);
    const songRows = songs.map(([uri, s]) => [s.n ?? '', s.a ?? '', s.al ?? '', (s.pl ?? []).map(plName).filter(Boolean).join(', '), uri, minutes(s.ms), ...tagsToCells(cleanTags(lib.tags?.[uri] ?? {})), (s.g ?? []).join(', ')]);
    const autoStyle = row => row.map((_, i) => i < 6 ? (i === 4 ? 3 : 0) : 0);
    const nSongs = Math.max(songRows.length + 200, 500);
    const plRows = pls.map(([id, p]) => [p.name, id, Object.values(lib.songs ?? {}).filter(s => (s.pl ?? []).includes(id)).length, ...tagsToCells(cleanTags(lib.ptags?.[id] ?? {}))]);
    const charRows = Object.values(lib.chars ?? {}).map(c => [c.name, plName(c.pl), c.theme ? lib.songs?.[c.theme]?.n ?? '' : '', c.note ?? '']);
    for (const name of characters) if (!charRows.some(r => norm(r[0]) === norm(name))) charRows.push([name, '', '', '']);
    const start = [['Moodweaver song sheet'], ["Sort your songs by picking from the dropdowns. A blank cell always means \"doesn't matter\"."], [],
        ['1. Fill in the YELLOW columns on the Songs and Playlists tabs. The grey columns come from Spotify: please leave them as they are.'],
        ['2. Tags on a playlist (Playlists tab) apply to every song in it. Tag a whole playlist in one row, then only the odd songs that differ.'],
        ['3. Exact moods: pick one, or type several separated by commas (Hunted, Dreading). They count far more than Feeling.'],
        ['4. Character: a name from your SillyTavern list, {{char}} (whoever the main character is), {{user}} (your persona) or Any.'],
        ['5b. Meaning: what the song is about when it is two feelings at once (Laughing through heartbreak, Tender menace). It only counts when someone feels both at once, and then it counts a lot.'],
        ['5c. Cues: short phrases, separated by commas, that nod to the song when the story says them (like a dog, salivat* for I Wanna Be Your Dog). A * means any ending. A cue gives the song a nudge for the next few replies, only when it fits the scene, and not again for 10 minutes after it has played. Cue words: single words or stems from the song\u2019s lyrics and themes (dog*, leash*, collar*, salivat*); any two of them close together in a reply count the same way, so the narrator\u2019s own wording works.'],
        ['5d. Sting: the big story beats this song can crash in on (Violence, Someone bursts in, Reveal, Love confession, First kiss, Death). When the newest reply has that beat, the song jumps in at once, if Stings are on for that character. Peak: where the song\u2019s chorus or drop starts (1:05). When a scene is already at full tilt the song can start there. Blank: Moodweaver estimates it.'],
        ['5f. Heard in: the song is something the characters can hear in the room (a punk show, a club, a house party, a bar, a car stereo, a radio). When the story is there, these songs play first, as if coming from the room.'],
        ['5e. Year: when this recording first came out (not a later reissue). The in-story radio only plays songs from the story\u2019s own era, or earlier.'],
        ['5. Never during: the song is never played in that kind of scene. Theme: plays when that character arrives or has a big moment.'],
        ['6. In Google Sheets you can pick several values in one cell: select a column, Data \u203a Data validation \u203a Allow multiple selections.'],
        ['7. When you are done: download as Microsoft Excel (.xlsx) or CSV, then tap Import song sheet in Moodweaver\u2019s Music tab.'], [],
        [`Exported ${new Date().toISOString().slice(0, 10)} \u00b7 ${songRows.length} songs from ${pls.length} playlists`]];
    return buildXlsx([
        { name: 'Start here', rows: start, styles: [[4]], widths: [130] },
        { name: 'Songs', rows: [SONG_COLS, ...songRows], styles: [headStyles(6, SONG_COLS.length), ...songRows.map(autoStyle)], widths: [30, 22, 20, 18, 26, 7, ...tagWidths, 26], freeze: { row: 1, col: 2 }, lists: dropdowns(6, nSongs) },
        { name: 'Playlists', rows: [PLAYLIST_COLS, ...plRows], styles: [headStyles(3, PLAYLIST_COLS.length), ...plRows.map(r => r.map((_, i) => i === 1 ? 3 : 0))], widths: [28, 26, 7, ...tagWidths], freeze: { row: 1, col: 1 }, lists: dropdowns(3, Math.max(plRows.length + 50, 100)) },
        { name: 'Characters', rows: [CHAR_COLS, ...charRows], styles: [headStyles(0, CHAR_COLS.length)], widths: [20, 26, 30, 40], freeze: { row: 1 }, lists: [{ col: 1, rows: [2, 300], source: listCol.Playlists }] },
        { name: 'Lists', rows: listRows, styles: [lists.map(() => 1)], widths: lists.map(([, v]) => Math.min(30, Math.max(12, ...v.map(s => String(s).length + 2)))), freeze: { row: 1 } },
    ]);
}

// ---- Reading a sheet ----
// tables: { tabName: rows } (one tab for a CSV, named after the file). Returns what to change; app/music.js applies it.
// Songs are found by their Spotify id, or by song and artist when the id is missing or broken.
export function readSheet(tables, lib, characters = [], fileName = '') {
    const out = { tags: {}, ptags: {}, chars: {}, newSongs: {}, sound: {}, songPl: {}, newPlaylist: null, matched: 0, unmatched: [], unknown: new Set() };
    const byTitle = new Map(Object.entries(lib.songs ?? {}).map(([uri, s]) => [`${norm(s.n)}|${norm(String(s.a).split(',')[0])}`, uri]));
    const plByName = new Map(Object.entries(lib.playlists ?? {}).map(([id, p]) => [norm(p.name), id]));
    for (const [tab, rows] of Object.entries(tables)) {
        const idx = headerIndex(rows[0]), has = name => idx.has(norm(name).replace(/[^a-z0-9]/g, ''));
        const body = rows.slice(1).filter(r => r.some(c => String(c ?? '').trim()));
        // exportify.net: Track URI, Track Name, Artist Name(s), Album Name, Duration (ms). Adds the songs as a playlist named after the file.
        if (has('Track URI') && has('Track Name')) {
            const name = String(fileName || tab).replace(/\.(csv|xlsx)$/i, '').replace(/_/g, ' ').trim() || 'Imported songs', id = plByName.get(norm(name)) ?? `csv:${norm(name).replace(/[^a-z0-9]+/g, '-')}`;
            out.newPlaylist = { id, name };
            for (const r of body) {
                const uri = trackUri(cellOf(r, idx, 'Track URI')); if (!uri) continue;
                if (has('Genres')) out.sound[uri] = split(cellOf(r, idx, 'Genres')).slice(0, 8);
                out.newSongs[uri] = { n: cellOf(r, idx, 'Track Name'), a: cellOf(r, idx, 'Artist Name(s)').split(/[,;]/)[0].trim(), al: cellOf(r, idx, 'Album Name'), ms: Number(cellOf(r, idx, 'Duration (ms)')) || 0, pl: [id] };
                if (TAG_COLS.some(c => has(c))) out.tags[uri] = cellsToTags(r, idx, characters, out.unknown);
            }
            continue;
        }
        if (has('Song')) for (const r of body) {
            const uri = trackUri(cellOf(r, idx, "Spotify ID (don't edit)") || cellOf(r, idx, 'Spotify ID') || cellOf(r, idx, 'URI')) || byTitle.get(`${norm(cellOf(r, idx, 'Song'))}|${norm(cellOf(r, idx, 'Artist').split(',')[0])}`);
            if (!uri) { out.unmatched.push(cellOf(r, idx, 'Song')); continue; }
            if (!lib.songs?.[uri]) out.newSongs[uri] = { n: cellOf(r, idx, 'Song'), a: cellOf(r, idx, 'Artist'), al: cellOf(r, idx, 'Album'), ms: 0, pl: [] };
            out.tags[uri] = cellsToTags(r, idx, characters, out.unknown); out.matched++;
            if (has('Sound')) out.sound[uri] = split(cellOf(r, idx, 'Sound')).slice(0, 8);
            // The playlist the song came from: on import it's linked back to your playlist of that name.
            if (has('From playlist') && cellOf(r, idx, 'From playlist')) out.songPl[uri] = cellOf(r, idx, 'From playlist');
        } else if (has('Playlist')) for (const r of body) {
            const id = cellOf(r, idx, "Spotify ID (don't edit)") || plByName.get(norm(cellOf(r, idx, 'Playlist')));
            if (id && lib.playlists?.[id]) out.ptags[id] = cellsToTags(r, idx, characters, out.unknown);
        } else if (has('Character') && has('Default playlist')) for (const r of body) {
            const name = cellOf(r, idx, 'Character'); if (!name) continue;
            const theme = cellOf(r, idx, 'Theme song'), themeUri = theme ? Object.entries(lib.songs ?? {}).find(([, s]) => norm(s.n) === norm(theme))?.[0] ?? '' : '';
            out.chars[norm(name)] = { name, pl: plByName.get(norm(cellOf(r, idx, 'Default playlist'))) ?? '', theme: themeUri, note: cellOf(r, idx, 'Notes') };
        }
    }
    return out;
}
