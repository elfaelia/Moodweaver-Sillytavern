// The info board: the status block the roleplay model writes at the top of every reply.
// Moodweaver never changes its HTML (a chat regex styles it). It only reads the latest one back out of
// the chat, shows it as a Sims-style needs panel, and sends the player's edits and the needs that
// matter on to the next reply. No extra model calls: the board is already in the reply.
import { MOODS, BY_ID, SCALED_MOOD_CUES, MERGED_SEARCH_NAMES, analysed } from '../data/catalogue.js';
import { RELATIONSHIP_TAGS } from './relationships.js';
import { MOVED_WORDS } from '../data/catalogue/merged.js';

// The board layout. The optional desire row is off unless selected for this chat.
const boardTemplate = (char, user, includeHorny = false, rows = {}) => `<div class="ihyll-style">
📅 <b>Date:</b> [In-world date: Weekday, Month Day, Year] | [Season] | [Weather Emoji] | [Forecast: Temp (°C/°F)]<br>
🕒 <b>Time:</b> [Scene time (12h AM/PM)]<br>
🗺️ <b>Location:</b> [Location] | <b>Present:</b> [NPCs currently visible] | <b>Activity:</b> [NPC posture/activity]<br>
👔 <b> ${char}’s Outfit:</b> [Current appearance & outfit, short]<br>
👗 <b>${user}’s Outfit:</b> [Current appearance & outfit, short]<br>
🧠 <b>State:</b> [2–5 words for ${char}'s current mood, led by the strongest feelings; ${char}'s own state, not a description of what ${user} said or did]<br>
💎 <b>Physical State:</b> [One short line: injuries, wet, drunk, tired, hungry or other bodily needs right now]${includeHorny ? '<br>\n🦄 <b>Horny:</b> [Current level, including none; one short line]' : ''}${rows.toward ? `<br>\n💞 <b>Toward ${user}:</b> [2–4 words for how ${char} feels about ${user} right now, strongest first]` : ''}${rows.remember ? `<br>\n📌 <b>Remember:</b> [none, unless something just happened between ${char} and ${user} that a later scene needs: one short line of plain fact]` : ''}
</div>`;

// ---- Reading a board back ----
const LABELS = { date: /^date$/, time: /^time$/, location: /^location$/, present: /^present$/, activity: /^activity$/, state: /^state$/, physical: /^physical( state)?$/, horny: /^horny$/, toward: /^toward\b/, remember: /^remember$/ };
const clean = v => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(/^[\s|:–-]+|[\s|]+$/g, '').trim();
export const hasBoard = mes => typeof mes === 'string' && /<b>\s*(Date|Location|State):\s*<\/b>/i.test(mes);
// Old boards leave the prompt. Each one is ~200 tokens of HTML and emoji, and the newest one is
// summarised in Moodweaver's note instead, so a 20-reply context saves thousands of tokens. Every
// board is removed the same way every time, so the chat history the model sees never changes after
// the fact and Claude's prompt cache keeps matching. The saved chat and what you see are untouched.
const BOARD_DIV = /<div[^>]*class=["'][^"']*ihyll-style[^"']*["'][^>]*>[\s\S]*?<\/div>[ \t]*\n?/gi;
const BOARD_LINE = /^[^\n<]{0,6}<b>\s*[^<:]{1,60}:\s*<\/b>.*$/;
export function stripBoard(mes) {
    if (!hasBoard(mes)) return mes;
    let out = mes.replace(BOARD_DIV, '');
    if (hasBoard(out)) {
        // No wrapper div (a preset's own board): drop the run of "<b>Label:</b>" lines.
        const lines = out.split('\n'), start = lines.findIndex(l => /<b>\s*(Date|Time|Location|State):\s*<\/b>/i.test(l));
        let end = start;
        while (end < lines.length && (BOARD_LINE.test(lines[end].trim()) || (end > start && !lines[end].trim() && BOARD_LINE.test(lines[end + 1]?.trim() ?? '')))) end++;
        if (start >= 0) lines.splice(start, end - start);
        out = lines.join('\n');
    }
    return out.replace(/^\s+/, '');
}
// Every "<b>Label:</b> value" runs until the next label, line break or closing div.
// The same reply is read many times (every redraw and every note walks the chat), so each board is
// parsed once and remembered by its text. Callers get their own copy, so changing one can't touch another.
const parsed = new Map();
export function parseBoard(mes) {
    if (!hasBoard(mes)) return null;
    let board = parsed.get(mes);
    if (board === undefined) {
        board = readBoard(mes);
        parsed.set(mes, board);
        if (parsed.size > 600) parsed.delete(parsed.keys().next().value);
    }
    return board && { ...board, outfits: board.outfits.map(o => ({ ...o })) };
}
function readBoard(mes) {
    const start = mes.search(/<div[^>]*ihyll-style|📅|<b>\s*Date:/i);
    const text = mes.slice(Math.max(0, start)).replace(/<br\s*\/?>/gi, '\n');
    const board = { outfits: [] };
    const re = /<b>\s*([^<:]{1,60}?):\s*<\/b>([\s\S]*?)(?=<b>\s*[^<:]{1,60}?:\s*<\/b>|\n|<\/div>|$)/gi;
    for (const [, rawLabel, rawValue] of text.matchAll(re)) {
        const label = rawLabel.trim().toLowerCase(), value = clean(rawValue);
        const outfit = rawLabel.trim().match(/^(.+?)['’]s outfit$/i);
        if (outfit) { board.outfits.push({ name: clean(outfit[1]), text: value }); continue; }
        const key = Object.keys(LABELS).find(k => LABELS[k].test(label));
        if (key && !(key in board)) board[key] = value;
    }
    if (board.date) {
        const parts = board.date.split('|').map(clean).filter(Boolean);
        board.day = parts[0] ?? '';
        board.season = parts.find(p => /winter|spring|summer|autumn|fall/i.test(p)) ?? '';
        board.forecast = clean(parts.find(p => /forecast|°/i.test(p))?.replace(/^forecast:?/i, '') ?? '');
        board.emoji = parts.find(p => p !== board.day && !/[a-z0-9]/i.test(p)) ?? '';
        board.temp = board.forecast.match(/-?\d+\s*°\s*[CF](?:\s*\/\s*-?\d+\s*°\s*[CF])?/)?.[0].replace(/\s+/g, '') ?? '';
    }
    return Object.keys(board).length > 1 || board.outfits.length ? board : null;
}
// The latest board in a chat, newest first. Hidden and player messages don't count.
// The key names this board in this swipe (its send time plus what it says), so fixing a typo in
// the prose keeps it, and a swipe or a different reply gets a new one.
export function latestBoard(chat, lookback = 40) {
    const list = Array.isArray(chat) ? chat : [];
    for (let i = list.length - 1, seen = 0; i >= 0 && seen < lookback; i--, seen++) {
        const m = list[i];
        if (!m || m.is_user || m.is_system || !hasBoard(m.mes)) continue;
        const board = parseBoard(m.mes);
        if (board) return { board, index: i, name: String(m.name ?? ''), key: boardKey(`${m.send_date ?? ''}|${JSON.stringify(board)}`) };
    }
    return null;
}
// The same key for any one message, or '' when it has no board.
export function boardKeyOf(m) {
    if (!m || !hasBoard(m.mes)) return '';
    const board = parseBoard(m.mes);
    return board ? boardKey(`${m.send_date ?? ''}|${JSON.stringify(board)}`) : '';
}
function boardKey(mes) {
    let hash = 2166136261;
    for (let i = 0; i < mes.length; i++) hash = Math.imul(hash ^ mes.charCodeAt(i), 16777619);
    return `${mes.length}:${hash >>> 0}`;
}
// "vindicated, greedy, quietly manic" → three tiles.
const phrases = text => String(text ?? '').split(/[,;]| and (?=[a-z]+ing\b)|·/i).map(clean).filter(p => p && p.length <= 90).slice(0, 8);

// ---- Needs, read from the board's own words ----
// 100 is fully met, 0 is desperate. Words only move a need when they clearly say so.
const NEEDS = [
    ['hunger', 'Hunger', 'stomach growling, distracted by food, shorter temper; eats whatever’s at hand when they can'],
    ['energy', 'Energy', 'heavy-lidded, yawning, slow and sloppy; wants to sit or lie down and dozes if left alone'],
    ['bladder', 'Bladder', 'fidgeting, legs pressed together, distracted; cuts things short to find a toilet, or can’t'],
    ['hygiene', 'Hygiene', 'aware they smell and feel filthy; others notice; wants a wash'],
    ['comfort', 'Comfort', 'keeps shifting against pain, cold, cramp or restraint, and it shortens their temper'],
    ['social', 'Social', 'starved for company: talks to anyone, lingers and clings, or sulks at being left alone'],
    ['fun', 'Fun', 'bored and restless: needles people, picks at things, goes looking for trouble'],
    ['health', 'Health', 'hurt or sick: winces, slows down, the body won’t do everything they want'],
].map(([id, label, cue]) => ({ id, label, cue }));
const NEED_IDS = new Set(NEEDS.map(n => n.id));
// p: read from Physical State only. s: from State only. ps: either.
const RULES = [
    ['hunger', 8, 'p', /starv|famished|ravenous|hasn'?t eaten in days/],
    ['hunger', 30, 'p', /hungry|hunger|stomach (growl|rumbl|empty|cramp)|peckish|empty stomach|hasn'?t eaten|skipped (a )?meal|munchies/],
    ['hunger', 95, 'p', /\b(full|well[- ]fed|sated|stuffed|just ate)\b/],
    ['energy', 10, 'ps', /exhaust|dead on (his|her|their) feet|can'?t keep (his|her|their) eyes open|nodding off|running on fumes|collaps/],
    ['energy', 30, 'ps', /tired|sleepy|drowsy|weary|fatigue|yawn|heavy[- ]lidded|worn out|sluggish|no sleep|sleep[- ]deprived|drained|hungover|coming down|hasn'?t slept/],
    ['energy', 92, 'ps', /well[- ]rested|wide awake|wired|buzzing|alert/],
    ['bladder', 8, 'p', /bursting|about to wet|desperate (to pee|for the (toilet|bathroom|loo))/],
    ['bladder', 30, 'ps', /needs? (the|a) (toilet|bathroom|loo|piss|pee|wee)|needs? to (pee|piss|wee)|has to (pee|piss|go)|holding it|full bladder|bladder|squirming|crossing (his|her|their) legs/],
    ['bladder', 95, 'p', /just (peed|pissed|relieved (himself|herself|themselves))|empty bladder/],
    ['hygiene', 12, 'p', /filthy|caked|covered in (blood|filth|mud|grime|shit|vomit|sick)|reeks|stinks|soaked in (blood|sweat)|blood[- ]spattered|drenched in blood|gore/],
    ['hygiene', 35, 'p', /sweat|grimy|dirty|greasy|unwashed|sticky|muddy|grime|smells? of|blood on|tacky with|needs? a (shower|bath|wash)|hasn'?t (showered|washed|bathed)|\bripe\b|\brank\b|musky/],
    ['hygiene', 95, 'p', /fresh(ly)? (showered|washed|bathed|shaved)|clean[- ]shaven|just (bathed|showered)|fresh (from|out of) the (bath|shower)|scrubbed clean|squeaky clean/],
    ['comfort', 8, 'p', /agony|excruciat|unbearable|screaming pain|white[- ]hot pain/],
    ['comfort', 35, 'p', /pain|ache|aching|sore|stiff|cramp|headache|migraine|throb|\braw\b|tender|freezing|shiver|chilled|\bcold\b|numb|itch|nause|queasy|hungover|overheat|sweltering|dizzy/],
    ['comfort', 35, 'p', /soaked|drenched|soaking|wet through|dripping wet|rain[- ]soaked|wet (clothes|hair)|damp clothes/],
    ['comfort', 30, 'p', /\btied\b|bound|restrained|shackled|cuffed|cramped|chafing|chafed|uncomfortable|kneeling for|hard floor|stiff neck/],
    ['comfort', 35, 'p', /(needs?|craving|dying for) (a |another )?(smoke|cigarette|drink|fix|hit|line)|jonesing|itching for (a )?(smoke|fix|hit|drink)/],
    ['comfort', 92, 'p', /comfortable|cos[yi]|cozy|relaxed|warm and/],
    ['social', 22, 'ps', /lonely|isolated|starved for (company|touch|attention)|desperate for company|abandoned|left alone for/],
    ['social', 40, 'ps', /craving (company|attention|touch)|wants company|touch[- ]starved|missing (him|her|them)|ignored/],
    ['social', 92, 'ps', /socially drained|peopled out|wants? to be left alone/],
    ['fun', 20, 'ps', /bored stiff|bored out of|stir[- ]crazy|nothing to do|climbing the walls/],
    ['fun', 30, 'ps', /bored|tedium|listless|restless|antsy|itching for (trouble|something)/],
    ['fun', 90, 'ps', /thrilled|amused|entertained|delighted|giddy|playful|having fun/],
    ['health', 10, 'p', /dying|bleeding out|gut[- ]shot|stab wound|stabbed|mortal|unconscious|overdos|convuls|shattered/],
    ['health', 38, 'p', /feverish|vomit|throwing up|withdrawals?\b|concussed|bruised ribs|bleed|\bcuts?\b|gash|wound|bruis|split lip|\bburns?\b|burned|burnt|scald|blister|singed|sprain|injur|limp|sick|fever|bitten|fractur|broken|black eye|swollen|concuss|cracked|withdrawal|dope ?sick/],
    ['health', 95, 'p', /unhurt|unharmed|uninjured|healthy|in perfect health/],
];
const HORNY = [
    [92, /can'?t think (of|about) anything else|desperate|feral|ravenous|starving|insatiable|frantic|dripping|throbbing|burning up|out of (his|her|their) mind/],
    [72, /hungry|aching|pent[- ]up|needy|craving|restless|keyed up|hot for|hard\b|wet\b|wants (him|her|them)|hungry for/],
    [42, /interested|simmering|warm|curious|stirring|flicker|tempted|teasing|low hum|idle|smoulder|smolder|hint/],
    [8, /\bspent\b|sated|satisfied|drained|nothing|none|not in the mood|dead below|numb|repulsed|zero|\bcold\b/],
];
const negated = (text, index) => /\b(not|no longer|isn'?t|wasn'?t|without|no)\s+(\w+\s+){0,2}$/.test(String(text).replace(/[’‘]/g, "'").slice(Math.max(0, index - 24), index));
// Reads needs from the State and Physical State lines. Returns { id: { value, source } } for needs the words touch.
// The worst reading wins, so "wired but exhausted" still counts as exhausted.
function needsFromBoard(board) {
    const out = {};
    for (const [line, where] of [[board?.physical, 'p'], [board?.state, 's']]) for (const phrase of phrases(line)) {
        // Boards are written with curly apostrophes (hasn’t), the patterns with straight ones.
        const text = phrase.toLowerCase().replace(/[’‘]/g, "'");
        for (const [id, value, scope, re] of RULES) {
            if (!scope.includes(where)) continue;
            const m = re.exec(text); if (!m || negated(text, m.index)) continue;
            if (!out[id] || value < out[id].value) out[id] = { value, source: phrase };
        }
    }
    return out;
}
function hornyFromBoard(board) {
    const text = String(board?.horny ?? '').toLowerCase().replace(/[’‘]/g, "'");
    if (!text) return null;
    let best = null;
    for (const [value, re] of HORNY) { const m = re.exec(text); if (m && !negated(text, m.index) && (best === null || value > best)) best = value; }
    return best ?? 50;
}
export const needWord = v => v <= 15 ? 'Critical' : v <= 35 ? 'Low' : v <= 65 ? 'Okay' : 'Fine';
const NEED_DEFAULT = 80;

// ---- Needs over in-world time ----
// The board's Date and Time rows give a clock. Between two boards close together in time, needs drain a
// little (hours of holding it fill the bladder, a long night makes them hungry). A bigger gap is a time
// jump: life went on off-screen, so they ate, slept, washed and saw people, and those needs come back up
// unless the reply after the jump says otherwise. Backwards time (a flashback) and boards without a clock
// change nothing. Everything is worked out from the replies still in the chat, so a swipe undoes it.
function boardClock(board) {
    if (!board) return null;
    const t = String(board.time ?? '').toLowerCase();
    let minutes = null;
    const ap = t.match(/(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s*m\b/);
    const h24 = t.match(/\b([01]?\d|2[0-3])[:h]([0-5]\d)\b/);
    if (ap) minutes = ((Number(ap[1]) % 12) + (ap[3] === 'p' ? 12 : 0)) * 60 + Number(ap[2] ?? 0);
    else if (h24) minutes = Number(h24[1]) * 60 + Number(h24[2]);
    else if (/midnight/.test(t)) minutes = 0; else if (/noon|midday/.test(t)) minutes = 720;
    const raw = String(board.date ?? '').split('|')[0].replace(/^\s*[a-z]+day,?\s*/i, '').replace(/(\d)(st|nd|rd|th)\b/gi, '$1').trim();
    const ms = raw && /\d{3,4}/.test(raw) ? Date.parse(raw) : NaN;
    return { minutes, day: Number.isFinite(ms) ? Math.round(ms / 86400000) : null };
}
// Hours from one board to the next; null when it can't be told or time went backwards.
function hoursBetween(a, b) {
    if (a?.minutes == null || b?.minutes == null) return null;
    if (a.day != null && b.day != null) { const h = ((b.day - a.day) * 1440 + b.minutes - a.minutes) / 60; return h < 0 ? null : h; }
    const diff = b.minutes - a.minutes;
    return (diff >= 0 ? diff : diff + 1440) / 60;
}
// Per in-world hour on screen. Comfort and health only change when the story changes them.
const NEED_DRAIN = { hunger: 5, energy: 4, bladder: 12, hygiene: 2, social: 2, fun: 4, comfort: 0, health: 0 };
const NEED_SPEEDS = { gentle: 0.5, normal: 1, harsh: 1.6 };
const cleanNeedOpts = o => ({ drift: o?.drift !== false, speed: NEED_SPEEDS[o?.speed] ? o.speed : 'normal', skips: o?.skips !== false, floor: o?.floor !== false, skipHours: Math.max(1, Math.min(12, Number(o?.skipHours) || 4)) });
const hrs = h => h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : `${Math.round(h * 10) / 10} h`;
// timeline: the character's replies oldest first, [{ index, board, needs: { id: level }, deltas: { id: ±n } }].
function simulateNeeds(timeline = [], options = {}) {
    const o = cleanNeedOpts(options), speed = NEED_SPEEDS[o.speed];
    const values = Object.fromEntries(NEEDS.map(n => [n.id, NEED_DEFAULT])), source = {}, known = {};
    let prev = null;
    for (const step of timeline ?? []) {
        const clock = boardClock(step.board);
        const h = o.drift && prev && clock ? hoursBetween(prev, clock) : null;
        if (h && h > 0) {
            if (h > o.skipHours && o.skips) {
                for (const id of ['hunger', 'energy', 'bladder', 'hygiene', 'social', 'fun']) if (values[id] < 75) { values[id] = 75; source[id] = `${hrs(h)} later: life went on off-screen`; }
                values.comfort = Math.max(values.comfort, Math.round((values.comfort + 80) / 2));
                values.health = Math.min(100, values.health + Math.min(25, Math.floor(h / 8) * 5));
            } else {
                const span = Math.min(h, o.skipHours);
                for (const [id, rate] of Object.entries(NEED_DRAIN)) {
                    if (!rate) continue;
                    const next = Math.round(Math.max(Math.min(values[id], o.floor ? 30 : 0), values[id] - rate * span * speed));
                    if (next < values[id]) { values[id] = next; source[id] = `${hrs(span)} passed`; if (next < 66) known[id] = true; }
                }
            }
        }
        if (clock?.minutes != null) prev = clock;
        const read = step.board ? needsFromBoard(step.board) : {};
        for (const [id, r] of Object.entries(read)) { values[id] = r.value; source[id] = r.source; known[id] = true; }
        for (const [id, v] of Object.entries(step.needs ?? {})) if (id in values) { values[id] = v; source[id] = 'the story'; known[id] = true; }
        for (const [id, d] of Object.entries(step.deltas ?? {})) if (id in values) { values[id] = Math.max(0, Math.min(100, values[id] + d)); source[id] = `the story (${d > 0 ? '+' : ''}${d})`; known[id] = true; }
    }
    return { values, source, known };
}

// ---- Tiles: board phrases matched to the catalogue for an icon and colour ----
let index = null, indexSize = 0;
function catalogueIndex() {
    if (index && indexSize === MOODS.length) return index;
    index = MOODS.filter(m => m.kind !== 'story').flatMap(m => m.label.toLowerCase().split(/\s*\/\s*/).filter(w => w.length > 3).map(word => [word, m]))
        .sort((a, b) => b[0].length - a[0].length);
    indexSize = MOODS.length;
    return index;
}
export function matchMood(phrase) {
    const text = ` ${String(phrase).toLowerCase().replace(/[^a-z' -]/g, ' ')} `;
    for (const [word, m] of catalogueIndex()) if (text.includes(` ${word} `)) return m;
    return null;
}

// ---- Sky: the panel follows the board's time and weather ----
function skyOf(board) {
    if (!board) return { time: '', weather: '' };
    const t = String(board.time ?? '');
    let hour = null;
    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m/i);
    if (m) hour = (Number(m[1]) % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0) + Number(m[2] ?? 0) / 60;
    else if (/midnight/i.test(t)) hour = 0; else if (/noon|midday/i.test(t)) hour = 12;
    else if (/dawn|sunrise/i.test(t)) hour = 6; else if (/dusk|sunset|evening/i.test(t)) hour = 19; else if (/night/i.test(t)) hour = 23;
    const time = hour === null ? '' : hour < 5 || hour >= 21 ? 'night' : hour < 8 ? 'dawn' : hour < 17 ? 'day' : 'dusk';
    const w = `${board.emoji ?? ''} ${board.forecast ?? ''} ${board.date ?? ''}`.toLowerCase();
    const weather = /⛈|🌩|thunder|storm|lightning/.test(w) ? 'storm' : /🌧|☔|🌦|rain|drizzle|shower|downpour/.test(w) ? 'rain'
        : /❄|🌨|☃|snow|sleet|blizzard|flurr/.test(w) ? 'snow' : /🌫|fog|mist|haze|smog/.test(w) ? 'fog'
        : /☁|⛅|🌥|overcast|cloud/.test(w) ? 'cloud' : /☀|🌤|🌙|🌃|🌌|✨|clear|sunny|moonless|starry|stars/.test(w) ? 'clear' : '';
    return { time, weather };
}

// ---- Player edits, saved per chat in metadata.board ----
export const EDIT_FIELDS = ['date', 'time', 'location', 'activity', 'charOutfit', 'userOutfit', 'horny'];
// Editing the scene card is a correction to the board it was made on:
// { text, on: that board's key, pos: that board's place in the chat }. The next reply is told to use it
// and carry it forward, and once a board from a later reply arrives it lets go, so an edit can't freeze
// the time or an outfit for the rest of the chat. Swiping that next reply brings the correction back
// (the corrected board is newest again), and so does swiping or deleting the corrected reply itself.
// Pins from older versions (plain text, on every reply) come in as corrections waiting to be tied to
// whatever board is newest when the chat is next opened (on: '?').
export const NO_BOARD = 'none';
export function cleanBoardMeta(meta) {
    const b = meta && typeof meta === 'object' ? meta : {};
    const t = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
    const list = v => [...new Set((Array.isArray(v) ? v : []).map(x => t(x, 90)).filter(Boolean))].slice(0, 12);
    const fix = {};
    for (const k of EDIT_FIELDS) {
        const f = b.fix?.[k];
        if (f && typeof f === 'object' && t(f.text, 200)) fix[k] = { text: t(f.text, 200), on: t(f.on, 60) || '?', pos: Math.max(-1, Math.round(Number(f.pos ?? -1) || 0)) };
        else if (t(b.pins?.[k], 200)) fix[k] = { text: t(b.pins[k], 200), on: '?', pos: -1 };
    }
    return {
        send: typeof b.send === 'boolean' ? b.send : undefined,
        includeHorny: b.includeHorny === true,
        feed: b.feed !== false, includeToward: b.includeToward === true, includeRemember: b.includeRemember !== false,
        fix,
        needs: Object.fromEntries(Object.entries(b.needs ?? {}).filter(([k]) => NEED_IDS.has(k) || k === 'horny')
            .map(([k, v]) => [k, Math.round(Math.max(0, Math.min(100, Number(v) || 0)))])),
        keep: { state: list(b.keep?.state), physical: list(b.keep?.physical) },
        mute: { state: list(b.mute?.state), physical: list(b.mute?.physical) },
        syncedKey: t(b.syncedKey, 40),
    };
}
// A correction applies until a board from at or after the corrected one's place arrives: while the
// corrected board is still the newest, or after it was swiped away or deleted and nothing has replaced it.
export const fixActive = (f, found) => f.on === '?' || !found || found.key === f.on || found.index < f.pos;
function activeFixes(b, found) {
    return Object.fromEntries(Object.entries(b?.fix ?? {}).filter(([, f]) => fixActive(f, found)).map(([k, f]) => [k, f.text]));
}
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
// What the panel and prompt both work from: the latest board plus the player's edits.
// needSteps: { messageIndex: { hunger: 30 } } from the weave lines still in the chat (1.36.0: read
// from the chat each time, never stored, so a swiped-away reply's needs can't linger).
// opts.pins: false (the default since 1.38) leaves out everything you pinned on the board: corrections,
// kept and cut tiles, and needs you set. They stay saved, so switching pins back on brings them back.
export function liveBoard(found, meta, names = {}, needSteps = {}, opts = {}) {
    const board = found?.board ?? null, b = { ...cleanBoardMeta(meta) };
    if (opts.pins === false) Object.assign(b, { fix: {}, needs: {}, keep: { state: [], physical: [] }, mute: { state: [], physical: [] } });
    b.pins = activeFixes(b, found);
    const outfit = who => board?.outfits.find(o => names[who] && same(o.name, names[who]))?.text ?? board?.outfits[who === 'char' ? 0 : 1]?.text ?? '';
    const field = key => b.pins[key] || (key === 'charOutfit' ? outfit('char') : key === 'userOutfit' ? outfit('user') : board?.[key] ?? '');
    const tiles = kind => {
        const from = phrases(board?.[kind]).filter(p => !b.mute[kind].some(x => same(x, p)));
        return [...from.map(text => ({ text, kept: b.keep[kind].some(x => same(x, text)) })),
            ...b.keep[kind].filter(x => !from.some(p => same(p, x))).map(text => ({ text, kept: true, added: true }))];
    };
    const read = board ? needsFromBoard(board) : {};
    // Whichever is newer wins: the board's words or the need the weave line last reported.
    const steps = Object.entries(needSteps ?? {}).map(([i, v]) => [Number(i), v]).sort((x, y) => y[0] - x[0]);
    const woven = id => { const hit = steps.find(([, v]) => id in v); return hit && hit[0] >= (found?.index ?? -1) ? hit[1][id] : null; };
    // With a timeline, needs are worked out reply by reply, with in-world time in between.
    const sim = Array.isArray(opts.timeline) ? simulateNeeds(opts.timeline, opts.needs) : null;
    const needs = NEEDS.map(n => {
        const pinned = Object.hasOwn(b.needs, n.id);
        if (sim) return { ...n, value: pinned ? b.needs[n.id] : sim.values[n.id], pinned, source: pinned ? '' : sim.source[n.id] ?? '', known: pinned || Boolean(sim.known[n.id]) };
        const w = woven(n.id);
        const value = pinned ? b.needs[n.id] : w ?? read[n.id]?.value ?? NEED_DEFAULT;
        return { ...n, value, pinned, source: pinned || w !== null ? '' : read[n.id]?.source ?? '', known: pinned || w !== null || Boolean(read[n.id]) };
    });
    const hornyRead = board ? hornyFromBoard(board) : null;
    return {
        found: Boolean(board), name: found?.name ?? '', board, meta: b,
        day: b.pins.date || board?.day || '', season: board?.season ?? '', forecast: board?.forecast ?? '', emoji: board?.emoji ?? '', temp: board?.temp ?? '',
        time: field('time'), location: field('location'), present: board?.present ?? '', activity: field('activity'),
        charOutfit: field('charOutfit'), userOutfit: field('userOutfit'), horny: field('horny'),
        state: tiles('state'), physical: tiles('physical'), needs,
        hornyValue: Object.hasOwn(b.needs, 'horny') ? b.needs.horny : hornyRead, hornyPinned: Object.hasOwn(b.needs, 'horny'),
        sky: skyOf(b.pins.time ? { ...board, time: b.pins.time } : board),
    };
}
// Cast members named on the Present line.
export function namedIn(present, name) {
    const text = ` ${String(present ?? '').toLowerCase()} `, full = String(name ?? '').toLowerCase().trim();
    if (!full) return false;
    const first = full.split(/\s+/)[0];
    const word = w => new RegExp(`[^a-z]${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z]`).test(text);
    return word(full) || (first.length > 2 && word(first));
}

// ---- Prompt ----
const pt = v => String(v ?? '').replace(/</g, '‹').replace(/>/g, '›');
const HORNY_CUES = [[81, 'hard to think about anything else'], [61, 'pulling hard at what they say and do'], [21, 'on their mind and colouring how they look at people'], [1, 'barely on their mind'], [0, 'not on their mind at all']];
// What the newest board said, as one line, for when old boards are kept out of the prompt.
// Corrected fields are left to the correction block below, so nothing is said twice.
// The notes as a whole outrank the chat, which is right for feelings but wrong for a record of
// the last board: if the chat has moved on, Opus 5.5 should follow the chat. So this line says so.
function boardContinuity(live, char, user) {
    const b = live?.board; if (!b) return '';
    const pins = live.meta?.pins ?? {}, out = [];
    const add = (key, value, label = '') => { const v = clean(value); if (v && !pins[key]) out.push(label ? `${label}: ${v}` : v); };
    add('date', b.date); add('time', b.time); add('location', b.location); add('present', b.present, 'present'); add('activity', b.activity, 'doing');
    const outfit = who => b.outfits.find(o => same(o.name, who))?.text ?? b.outfits[who === char ? 0 : 1]?.text;
    add('charOutfit', outfit(char), `${char} wears`); add('userOutfit', outfit(user), `${user} wears`);
    add('physical', b.physical, 'body');
    return out.length ? `The last reply's board, taken out of the chat above to save space: ${pt(out.join('; '))}. It's a record of where that reply left things. Start this reply's board from there and change what this reply changes. Where the chat shows something different, the chat is right.` : '';
}
// opts: { send, live, char, user, n, u, stripped, remember }. Returns prompt lines, or [] when there's no board in play.
// remember: the Remember row goes on the board only when the hidden weave line isn't carrying it.
export function boardPromptLines({ send, live, char, user, n, u, stripped = false, remember = false }) {
    if (!send && !live?.found) return [];
    const out = [];
    const includeHorny = live?.meta?.includeHorny === true, toward = live?.meta?.includeToward === true;
    if (send) out.push(`Info board: start every reply with this board, filled in for this moment. Keep the HTML exactly as shown. It's an impersonal snapshot, so don't quote, paraphrase or describe ${u}'s words anywhere in it. After the board, start the third-person limited scene with ${n}'s own answer, decision or physical action.`,
        boardTemplate(char, user, includeHorny, { toward, remember }), includeHorny ? '' : 'Use only these board rows. Omit the old Horny row, including outside the board; don’t move it into Physical State.');
    if (stripped && live?.found) out.push(boardContinuity(live, char, user));
    out.push(`The board reports; it doesn't steer. State names ${n}'s strongest current feelings from these notes and the scene, in a few words. Physical State lists ${n}'s active body settings (injured, wet, drunk and so on), the needs below and what the scene has done to ${n} since.${send && toward ? ` Toward ${u} names ${n}'s strongest feelings about ${u} from the relationship notes and the scene.` : ''}${send && remember ? ` Remember stays none in most replies; fill it only for a confession, promise, betrayal, first time, secret learned or similar turning point.` : ''} Don't invent feelings or needs just to fill a row, and an older board doesn't override newer settings.${includeHorny ? ' Horny reports existing desire, including none; the row itself isn’t a reason to increase it.' : ''}`);
    if (!live) return out;
    const b = live.meta;
    const pins = [['date', 'Date'], ['time', 'Time'], ['location', 'Location'], ['activity', 'Activity'], ['charOutfit', `${char}’s Outfit`], ['userOutfit', `${user}’s Outfit`], ['horny', 'Horny']]
        .filter(([k]) => b.pins[k] && (k !== 'horny' || includeHorny)).map(([k, label]) => `- ${label}: ${pt(b.pins[k])}`);
    const keepState = live.state.filter(t => t.kept).map(t => t.text), keepBody = live.physical.filter(t => t.kept).map(t => t.text);
    if (pins.length) out.push('', `The player corrected the last board. Put these on this reply's board and play them as true now; from here the story can change them like anything else:`, ...pins);
    if (keepState.length || keepBody.length) out.push('', `The player keeps these on the board every reply:`,
        ...(keepState.length ? [`- State includes: ${pt(keepState.join(', '))}`] : []), ...(keepBody.length ? [`- Physical State includes: ${pt(keepBody.join(', '))}`] : []));
    const cut = [...b.mute.state, ...b.mute.physical].filter(p => [live.board?.state, live.board?.physical].some(line => String(line ?? '').toLowerCase().includes(p.toLowerCase())));
    if (cut.length) out.push(`The player cut these. Drop them from the board and the scene: ${pt(cut.join(', '))}.`);
    const needs = live.needs.filter(nd => nd.pinned || (nd.known && nd.value <= 35));
    if (needs.length || (includeHorny && live.hornyPinned)) out.push('', `${n}'s needs right now (keep them off the board unless it already shows them). Low ones nag and leak into mood and choices, and ${n} fixes them with whatever's at hand when the scene allows; a critical one takes over until it's dealt with or something worse wins:`,
        ...needs.map(nd => `- ${nd.label.toLowerCase()} (${needWord(nd.value).toLowerCase()}): ${nd.value > 65 ? 'fully met, so it doesn’t come up' : nd.value > 35 ? 'fine for now; it can show in small ways' : nd.cue}`),
        ...(includeHorny && live.hornyPinned ? [`- horny (set by the player): ${HORNY_CUES.find(([min]) => live.hornyValue >= min)[1]}`] : []));
    const rest = live.needs.filter(nd => nd.known && !nd.pinned && nd.value > 35);
    if (rest.length) out.push(`Other needs: ${rest.map(nd => `${nd.label.toLowerCase()} ${needWord(nd.value).toLowerCase()}`).join(', ')}.`);
    return out;
}

// ---- The board feeding the sliders: free scene reading, no extra request ----
// Words on the board map to catalogue feelings or relationship tags, with a strength.
// "terrified" lands higher than "afraid"; "slightly" and "very" shift it; the first word listed leads.
const WEAK = /\b(slightly|a little|a bit|faintly|mildly|somewhat|vaguely|a touch|hint of)\b/;
const STRONG = /\b(very|deeply|utterly|completely|totally|extremely|wildly|desperately|overwhelm\w*|consumed|incandescent|absolutely|beyond|frantically|violently|so)\b/;
const FEELING_SYNONYMS = { furious: 'angry', enraged: 'angry', livid: 'angry', irate: 'angry', annoyed: 'angry', scared: 'afraid', frightened: 'afraid', fearful: 'afraid',
    nervous: 'anxious', worried: 'anxious', uneasy: 'anxious', tense: 'anxious', panicky: 'afraid', joyful: 'happy', elated: 'happy', cheerful: 'happy', glad: 'happy',
    thrilled: 'excited', eager: 'excited', miserable: 'sad', gloomy: 'sad', sorrowful: 'sad', ashamed: 'ashamed', humiliated: 'embarrassed', mortified: 'embarrassed',
    tender: 'affectionate', loving: 'affectionate', fond: 'affectionate', relaxed: 'calm', serene: 'peaceful', amused: 'entertained', smug: 'smug', wary: 'suspicious',
    frantic: 'desperate', resigned: 'resigned', relief: 'relieved', terror: 'afraid', dread: 'anxious', rage: 'angry', fury: 'angry', grief: 'sad', shame: 'ashamed', guilt: 'guilty',
    jealousy: 'jealous', longing: 'yearning', devotion: 'devoted', panic: 'afraid', elation: 'happy', despair: 'despairing', hopeless: 'despairing', lust: 'horny', hunger: 'yearning', tenderness: 'affectionate', jealous: 'jealous', possessive: 'possessive', obsessive: 'obsessed', lustful: 'horny', aroused: 'horny', exhausted: 'tired',
    coaxing: 'wheedling', cajoling: 'wheedling', remorseful: 'contrite', apologetic: 'contrite', ecstatic: 'euphoric', combative: 'spoiling_for_fight', twitchy: 'strung_out' };
const RELATION_SYNONYMS = { fond: 'likes', wary: 'distrusts', distrustful: 'distrusts', protective: 'protects', attracted: 'finds_attractive', curious: 'intrigued_by',
    trusting: 'trusts', resentful: 'resents', afraid: 'fears', scared: 'fears', frightened: 'fears', annoyed: 'finds_annoying', irritated: 'irritated_by', loving: 'loves',
    adoring: 'idolises', tender: 'cherishes', grateful: 'grateful_to', guilty: 'guilty_toward', hurt: 'hurt_by', betrayed: 'betrayed_by', contemptuous: 'despises',
    disgusted: 'disgusted_by', lustful: 'lusts_after', hungry: 'lusts_after', intrigued: 'intrigued_by', respectful: 'respects', admiring: 'admires', pitying: 'pities',
    worried: 'worries_about', controlling: 'controls', dominant: 'dominates', hostile: 'cant_stand', hateful: 'hates', murderous: 'wants_kill', yearning: 'longs_for',
    obsessive: 'obsessed', smitten: 'smitten', infatuated: 'smitten', devoted: 'devoted', jealous: 'jealous', possessive: 'possessive', suspicious: 'suspicious_of' };
// Everyday board words that aren't option names. [feeling, strength]; strength is where a plain
// mention lands before "very", "slightly" and being listed first adjust it.
const FEELING_WORDS = {
    numb: ['shut_down', 60], hollow: ['shut_down', 60], empty: ['shut_down', 45], unsettled: ['anxious', 45], edgy: ['jumpy', 45], jittery: ['jumpy', 45],
    twitchy: ['jumpy', 45], skittish: ['jumpy', 45], maudlin: ['self_pitying', 60], 'self-loathing': ['ashamed', 85], exasperated: ['frustrated', 45],
    besotted: ['giddy_in_love', 60], smitten: ['giddy_in_love', 60], infatuated: ['limerent', 60], cocky: ['smug', 60], irritable: ['grumpy', 60], cranky: ['grumpy', 60],
    pissed: ['angry', 60], sadistic: ['sadistic_glee', 60], calculating: ['planning', 60], scheming: ['planning', 60], delighted: ['happy', 60], doting: ['indulgent', 60],
    panicked: ['afraid', 85], panicking: ['afraid', 85], shaken: ['shocked', 45], stunned: ['shocked', 60], dazed: ['in_shock', 45], sheepish: ['embarrassed', 35],
    flustered: ['embarrassed', 45], bashful: ['shy', 60], distrustful: ['suspicious', 60], paranoid: ['suspicious', 85], aloof: ['distant', 60], territorial: ['possessive', 60],
    homicidal: ['murderous', 85], unhinged: ['manic', 85], deranged: ['manic', 85], feral: ['feral_energy', 60], repulsed: ['disgusted', 60], scornful: ['contemptuous', 60],
    disdainful: ['contemptuous', 60], patronising: ['condescending', 60], dismissive: ['distant', 45], indifferent: ['unbothered', 60], nonchalant: ['unbothered', 45],
    smouldering: ['heated', 60], giggly: ['giddy', 60], sassy: ['cheeky', 60], mouthy: ['cheeky', 60], bratty: ['cheeky', 60], sarcastic: ['snarky', 60], snide: ['snarky', 60],
    gleeful: ['wicked_delight', 60], vindictive: ['vengeful', 60], 'self-conscious': ['insecure', 60], gentle: ['soft', 60], nurturing: ['caring', 60], watchful: ['vigilant', 60],
    alert: ['vigilant', 45], resolute: ['determined', 60], composed: ['calm', 60], simmering: ['seething', 45], brooding: ['ruminating', 60], haunted: ['ruminating', 60],
    pensive: ['thinking', 45], thoughtful: ['thinking', 45], dreamy: ['head_in_clouds', 60], nostalgic: ['bittersweet', 60], melancholy: ['heavy_hearted', 60],
    melancholic: ['heavy_hearted', 60], depressed: ['despairing', 60], wounded: ['hurt', 60], stung: ['hurt', 35], rejected: ['hurt', 60], abandoned: ['left_behind', 60],
    reckless: ['daring', 60], triumphant: ['vindicated', 60], victorious: ['vindicated', 60], rebellious: ['defiant', 60], stubborn: ['defiant', 45], pouty: ['sulking', 60],
    pouting: ['sulking', 60], sulky: ['sulking', 60], petulant: ['sulking', 60], entitled: ['demanding', 60], begging: ['pleading', 60], dissociated: ['dissociating', 60],
    fragile: ['vulnerable', 60], exposed: ['vulnerable', 45], raw: ['vulnerable', 60], frazzled: ['overwhelmed', 45], stressed: ['anxious', 60], spiraling: ['spiralling', 60],
};
// Phrases first, so "strung out" isn't read as just "out" and "cold fury" isn't read as "cold".
const FEELING_PHRASES = {
    'on edge': ['jumpy', 45], 'cold fury': ['tranquil_fury', 85], 'quiet rage': ['tranquil_fury', 60], 'losing it': ['losing_control', 60], 'out of control': ['losing_control', 60],
    'falling apart': ['losing_control', 85], 'barely holding it together': ['losing_control', 85], 'in love': ['romantic', 60], 'turned on': ['horny', 60], 'pissed off': ['angry', 60],
    'spaced out': ['zoned_out', 60], 'on top of the world': ['euphoric', 85], 'fed up': ['over_it', 60], 'at peace': ['peaceful', 60], 'head over heels': ['giddy_in_love', 85],
    'out for blood': ['bloodthirsty', 85], 'seeing red': ['angry', 85], 'scared stiff': ['afraid', 85], 'self loathing': ['ashamed', 85], 'hates himself': ['ashamed', 85],
    'hates herself': ['ashamed', 85], 'hates themselves': ['ashamed', 85], 'wants revenge': ['vengeful', 60], 'shaken up': ['shocked', 45], 'freaked out': ['afraid', 60],
    'stressed out': ['anxious', 60], 'fondly exasperated': ['fond_exasperation', 60], 'exasperated but fond': ['fond_exasperation', 60], 'hard done by': ['self_pitying', 60],
};
const RELATION_WORDS = {
    amused: ['finds_funny', 60], besotted: ['smitten', 60], indulgent: ['indulges', 60], aroused: ['turned_on_by', 60], horny: ['lusts_after', 60], exasperated: ['irritated_by', 45],
    doting: ['dotes', 60], affectionate: ['cherishes', 60], envious: ['envies', 60], competitive: ['rival', 60], dependent: ['depends', 60], needy: ['depends', 60],
    clingy: ['cant_let_go', 60], submissive: ['submits_to', 60], manipulative: ['manipulates', 60], humiliated: ['humiliated_by', 60], intimidated: ['intimidated_by', 60],
    threatened: ['threatened_by', 60], judgemental: ['judges', 60], judgmental: ['judges', 60], mocking: ['mocks', 60], teasing: ['teases', 60], condescending: ['looks_down', 60],
    patronising: ['looks_down', 60], fascinated: ['fascinated', 60], impressed: ['impressed_by', 60], charmed: ['charmed_by', 60], flustered: ['flustered_by', 60],
    heartbroken: ['heartbroken_over', 60], missing: ['misses', 60], forgiving: ['forgives', 60], apologetic: ['wants_to_apologise', 60], loyal: ['loyal_to', 60],
    safe: ['safe_with', 60], comfortable: ['comfortable_with', 60], vengeful: ['revenge', 60], whipped: ['wrapped', 60], wary: ['suspicious_of', 45], proud: ['proud', 60],
};
const RELATION_PHRASES = {
    'putty in her hands': ['wrapped', 85], 'putty in his hands': ['wrapped', 85], 'putty in their hands': ['wrapped', 85], "can't say no": ['wrapped', 60],
    "can't stay mad": ['cant_stay_angry', 60], 'wants her dead': ['wants_kill', 60], 'wants him dead': ['wants_kill', 60], 'creeped out': ['finds_creepy', 60],
    'soft on': ['cherishes', 60], 'hung up on': ['cant_let_go', 60], 'terrified of losing': ['afraid_to_lose', 85],
};
const SKIP = new Set(['with', 'over', 'them', 'their', 'they’re', 'they\'re', 'thinks', 'finds', 'wants', 'feels', 'about', 'around', 'despite', 'themselves', 'like', 'into', 'from', 'what', 'after', 'other', 'person', 'someone', 'something', 'love', 'more', 'than', 'keep']);
// Board text as the matchers see it: lower case, straight apostrophes, letters only.
const norm = s => ` ${String(s ?? '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z' -]/g, ' ').replace(/\s+/g, ' ').trim()} `;
const PRONOUNS = /\b(her|his|him|hers|their|them|theirs|she|he|they|himself|herself|themselves)\b/g;
const bareOf = s => norm(String(s).replace(/[’‘]/g, "'").toLowerCase().replace(PRONOUNS, ' '));
// "spiraling" finds Spiralling, "patronizing" finds Patronising: the catalogue is spelt the British way.
const british = w => [w.replace(/iz(e|es|ed|ing|ation)$/, 'is$1'), w.replace(/yz(e|es|ed|ing)$/, 'ys$1'), w.replace(/([aeiou])l(ing|ed|er)$/, '$1ll$2'), w.replace(/or$/, 'our')].filter(x => x !== w);
let feelIndex = null, feelPhrases = null, relIndex = null, relPhrases = null, feelSize = 0;
function buildFeelIndex() {
    if (feelIndex && feelSize === MOODS.length) return feelIndex;
    const map = new Map(), phrases = new Map(), byId = Object.fromEntries(MOODS.map(m => [m.id, m]));
    const ok = id => byId[id] && analysed(byId[id]);
    const add = (word, id, value) => { word = word.toLowerCase().replace(/[’‘]/g, "'"); if (word.length > 3 && !SKIP.has(word) && ok(id) && !map.has(word)) map.set(word, { id, value }); };
    const phrase = (text, id, value) => { const k = norm(text).trim(); if (k.includes(' ') && ok(id) && !phrases.has(k)) phrases.set(k, { id, value }); };
    // An option's own name comes first, so "giddy" is Giddy rather than a strong Excited.
    for (const m of MOODS) if (ok(m.id)) for (const part of [m.label, ...m.label.split(/\s*\/\s*/)]) {
        const p = part.toLowerCase().replace(/\s*\(.*\)\s*/, '').trim();
        if (p.includes(' ')) phrase(p, m.id, 60); else add(p.replace(/[^a-z’'-]/g, ''), m.id, 60);
    }
    for (const [id, names] of Object.entries(MERGED_SEARCH_NAMES)) for (const n of names) { if (n.includes(' ')) phrase(n, id, 60); else add(n, id, 60); }
    for (const [text, [id, value]] of Object.entries(FEELING_PHRASES)) phrase(text, id, value);
    // Scaled wording next: its first word carries the strength (terrified → afraid at 85).
    // Where that word is already this option's own name ("heartbroken" for Hurt), it keeps the strength.
    for (const [id, steps] of Object.entries(SCALED_MOOD_CUES)) for (const [min, text] of steps) {
        const word = text.split(/[\s:,;]/)[0].toLowerCase(), value = min >= 81 ? 85 : min >= 41 ? 60 : 35, had = map.get(word);
        if (had?.id === id) had.value = Math.max(had.value, value); else add(word, id, value);
    }
    for (const [word, id] of Object.entries(FEELING_SYNONYMS)) add(word, id, 60);
    for (const [word, [id, value]] of Object.entries(FEELING_WORDS)) add(word, id, value);
    // Each option's own everyday words (the words field in the catalogue), after everything above.
    for (const m of MOODS) for (const w of m.words ?? []) { if (w.includes(' ')) phrase(w, m.id, 60); else add(w, m.id, 60); }
    feelSize = MOODS.length; feelIndex = map;
    feelPhrases = [...phrases.entries()].sort((a, b) => b[0].length - a[0].length);
    return map;
}
function buildRelIndex() {
    if (relIndex) return relIndex;
    const map = new Map(), ids = new Set(RELATIONSHIP_TAGS.map(t => t.id)), phrases = new Map();
    for (const [word, id] of Object.entries(RELATION_SYNONYMS)) if (ids.has(id)) map.set(word, { id, value: 60 });
    for (const [word, [id, value]] of Object.entries(RELATION_WORDS)) if (ids.has(id)) map.set(word, { id, value });
    for (const t of RELATIONSHIP_TAGS) {
        const words = t.label.toLowerCase().replace(/[^a-z’' -]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !SKIP.has(w));
        if (words.length === 1 && !map.has(words[0])) map.set(words[0], { id: t.id, value: 60 });
        // Whole names, with "them"/"their" and a trailing "with", "of", "by"… taken off: "wrapped around her finger".
        const bare = bareOf(t.label).trim(), short = bare.replace(/\s+(with|of|by|to|for|toward|about|on|at)$/, '');
        for (const k of [bare, short]) if (k.includes(' ') && !phrases.has(k)) phrases.set(k, { id: t.id, value: 60 });
    }
    for (const [text, [id, value]] of Object.entries(RELATION_PHRASES)) if (ids.has(id)) phrases.set(bareOf(text).trim(), { id, value });
    relIndex = map; relPhrases = [...phrases.entries()].sort((a, b) => b[0].length - a[0].length);
    return map;
}
function strengthOf(phrase, base, first) {
    const v = STRONG.test(phrase) ? Math.max(base, 85) : WEAK.test(phrase) ? Math.min(base, 30) : base;
    return Math.min(95, v + (first ? 10 : 0));
}
// "giddy, quietly furious, a little scared" → [{ id, value, phrase }]. Each comma-separated piece can
// name up to three things ("tender but terrified"); phrases are matched before single words.
function read(line, lookup, phraseList, bare = false) {
    const out = new Map();
    phrases(line).forEach((phrase, i) => {
        const raw = phrase.toLowerCase().replace(/[’‘]/g, "'");
        let text = bare ? bareOf(phrase) : norm(phrase), hits = 0;
        const take = (hit, at) => {
            // at is the space before the match; the words just before it decide whether it's negated.
            if (!hit || hits >= 3 || negated(text, at + 1)) return;
            const value = strengthOf(raw, hit.value, i === 0 && hits === 0);
            hits++;
            if ((out.get(hit.id)?.value ?? 0) < value) out.set(hit.id, { id: hit.id, value, phrase });
        };
        for (const [key, hit] of phraseList()) {
            const at = text.indexOf(` ${key} `); if (at < 0) continue;
            take(hit, at); text = `${text.slice(0, at)} ${' '.repeat(key.length)} ${text.slice(at + key.length + 2)}`;
        }
        for (const word of text.split(/\s+/).filter(Boolean)) {
            const hit = lookup(word) ?? british(word).map(lookup).find(Boolean);
            if (hit) take(hit, text.indexOf(` ${word} `));
        }
    });
    return [...out.values()];
}
// A feeling named on the weave line: its slider label first ("Clingy / needy", "clingy"), then the
// same words and synonyms the State row uses. Only feelings resolve; traits and story settings never do.
// Everyday feeling words the hidden line uses that matched nothing before, so they were dropped.
const PLAIN_FEELINGS = {
    'turned on': 'horny', 'hot': 'heated', 'hot and bothered': 'heated', 'wanting': 'craving', 'hungry': 'craving', 'hungry for her': 'starved_for_them', 'hungry for him': 'starved_for_them',
    'tempted': 'forbidden_want', 'teased': 'heated', 'teasing': 'playful', 'flirtatious': 'flirty', 'coy': 'shy', 'provoked': 'angry', 'riled': 'angry', 'goaded': 'angry', 'insulted': 'angry',
    'displeased': 'angry', 'vexed': 'angry', 'fascinated': 'curious', 'captivated': 'curious', 'gratified': 'content', 'horrified': 'in_shock', 'appalled': 'disgusted', 'devastated': 'hurt',
    'fixated': 'obsessed', 'awkward': 'embarrassed', 'conflicted': 'confused', 'torn': 'confused', 'surprised': 'shocked', 'startled': 'shocked', 'weary': 'tired', 'touched': 'deeply_moved',
    'unimpressed': 'distant', 'aloof': 'distant', 'menacing': 'smiling_threat', 'threatening': 'smiling_threat', 'cornered': 'afraid', 'trapped': 'helpless', 'superior': 'condescending',
    'haughty': 'condescending', 'arrogant': 'smug', 'controlled': 'controlling', 'in control': 'controlling', 'commanding': 'controlling', 'dominant': 'controlling', 'authoritative': 'controlling',
    'powerful': 'power_drunk', 'submissive': 'vulnerable', 'obedient': 'vulnerable', 'meek': 'vulnerable', 'docile': 'vulnerable', 'compliant': 'vulnerable', 'deferential': 'vulnerable',
    'spoiled': 'demanding', 'spoilt': 'demanding', 'pampered': 'content', 'bratty': 'demanding', 'pouty': 'sulking', 'petulant': 'sulking', 'cagey': 'defensive',
};
let labelIndex = null, labelSize = 0;
export function feelingId(name) {
    const text = String(name ?? '').toLowerCase().replace(/[^a-z’' /-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    if (!labelIndex || labelSize !== MOODS.length) {
        labelIndex = new Map(); labelSize = MOODS.length;
        // Every moodlet's own name and id first, then search aliases, so "giddy" is Giddy and not
        // Excited (which lists Giddy as an alias), and "masking (outward coldness)" is that one.
        const set = key => { key = key?.trim(); if (key && !labelIndex.has(key)) return key; return ''; };
        for (const m of MOODS) if (analysed(m)) for (const key of [m.label.toLowerCase(), m.label.toLowerCase().replace(/[^a-z’' /-]/g, ' ').replace(/\s+/g, ' '), m.id.replace(/_/g, ' ')]) { const k = set(key); if (k) labelIndex.set(k, m.id); }
        for (const m of MOODS) if (analysed(m)) for (const key of [...m.label.toLowerCase().split(/\s*\/\s*/), ...(MERGED_SEARCH_NAMES[m.id] ?? []).map(x => x.toLowerCase())]) { const k = set(key); if (k) labelIndex.set(k, m.id); }
        for (const [word, id] of Object.entries({ ...PLAIN_FEELINGS, ...MOVED_WORDS })) if (BY_ID[id] && analysed(BY_ID[id]) && !labelIndex.has(word)) labelIndex.set(word, id);
        // Its own everyday words last, where the scene words don't already give the feeling another way.
        const index = buildFeelIndex(), phrases = new Set(feelPhrases.map(([k]) => k));
        for (const m of MOODS) if (analysed(m)) for (const w of m.words ?? []) if (!labelIndex.has(w) && !index.has(w) && !(phrases.has(w) && feelPhrases.find(([k]) => k === w)[1].id !== m.id)) labelIndex.set(w, m.id);
    }
    if (labelIndex.has(text)) return labelIndex.get(text);
    const bare = text.replace(/\b(with|for|by|at|about|toward|towards|of|on|her|him|his|them|their|lamb|it)\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (bare !== text && labelIndex.has(bare)) return labelIndex.get(bare);
    for (const word of text.split(' ')) { const hit = buildFeelIndex().get(word) ?? (labelIndex.has(word) ? { id: labelIndex.get(word) } : null); if (hit) return hit.id; }
    return null;
}
// A relationship type named on the weave line's "toward" field: "obsessed with Lamb +5" → obsessed.
export function relationId(name, other = '') {
    const drop = new Set(String(other).toLowerCase().split(/\s+/).filter(Boolean));
    const text = String(name ?? '').toLowerCase().replace(/[^a-z’' -]/g, ' ').split(/\s+/).filter(w => w && !drop.has(w)).join(' ').trim();
    if (!text) return null;
    const exact = RELATIONSHIP_TAGS.find(t => t.label.toLowerCase() === text || t.label.toLowerCase().replace(/\s+(with|of|by|to|for|toward|about|on)$/, '') === text || t.id.replace(/_/g, ' ') === text);
    if (exact) return exact.id;
    // "undone by her tears" is "Undone by their tears": pronouns don't decide the match.
    const bare = s => s.toLowerCase().replace(/[^a-z’' -]/g, ' ').replace(/\b(her|his|him|hers|their|them|theirs|she|he|they)\b/g, ' ').replace(/\s+/g, ' ').trim();
    const plain = bare(text), loose = plain && RELATIONSHIP_TAGS.find(t => bare(t.label) === plain || bare(t.label).replace(/\s+(with|of|by|to|for|toward|about|on)$/, '') === plain);
    if (loose) return loose.id;
    for (const word of text.split(' ')) { const hit = buildRelIndex().get(word); if (hit) return hit.id; }
    return null;
}
export const feelingsFromBoard = board => read(board?.state, w => buildFeelIndex().get(w), () => (buildFeelIndex(), feelPhrases));
// other: the player's name, taken out first so "obsessed with Lamb" reads as Obsessed with.
export function relationsFromBoard(board, other = '') {
    let text = String(board?.toward ?? '');
    for (const word of String(other).toLowerCase().split(/\s+/).filter(w => w.length > 1)) text = text.replace(new RegExp(`\\b${word.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&')}\\b`, 'gi'), ' ');
    return read(text, w => buildRelIndex().get(w), () => (buildRelIndex(), relPhrases), true);
}
// Moves values toward the board's reading. fed remembers what the board itself last set:
// a value still equal to that is the board's to lower or let fade; anything the player set is never lowered.
export function feedValues(moods, pins, fed, readings, fade = 15) {
    const changed = [], seen = new Set();
    for (const { id, value } of readings) {
        seen.add(id);
        if (pins?.[id]) continue;
        const old = moods[id] ?? 0, boardOwned = fed[id] === old;
        let next = old;
        if (value > old) next = Math.round(old + (value - old) * 0.7);
        else if (boardOwned && value < old) next = Math.round(old - (old - value) * 0.5);
        if (next !== old) { moods[id] = next; changed.push(id); }
        if (next === moods[id] && (boardOwned || next !== old)) fed[id] = moods[id];
    }
    for (const id of Object.keys(fed)) {
        if (seen.has(id)) continue;
        if (pins?.[id] || moods[id] !== fed[id]) { delete fed[id]; continue; }
        moods[id] = Math.max(0, moods[id] - fade); changed.push(id);
        if (moods[id] === 0) delete fed[id]; else fed[id] = moods[id];
    }
    return changed;
}
export const isNone = text => !String(text ?? '').trim() || /^(none|nothing|n\/?a|no|—|-|\[.*\])\.?$/i.test(String(text).trim());
// ---- Facts and time, for facts that run their course (engine/moodpace.js) ----
// A fact named outright: "drunk", "nosebleed", "wet" (its label, the label before any bracket, or its id).
// Only the facts that run a course or bring feelings, and only exact names, so a feeling word never lands here.
let factIndex = null;
const factKey = s => String(s ?? '').toLowerCase().replace(/[^a-z’' -]/g, ' ').replace(/\s+/g, ' ').trim();
export function factId(name) {
    if (!factIndex) {
        factIndex = new Map();
        for (const m of MOODS) if (m.kind === 'state' && (m.lasts || m.feels)) for (const key of [m.label, m.label.replace(/\s*\(.*\)\s*$/, ''), m.id.replace(/_/g, ' ')].map(factKey)) if (key && !factIndex.has(key)) factIndex.set(key, m.id);
    }
    return factIndex.get(factKey(name)) ?? null;
}
// Facts a piece of text mentions by name (the board's Physical State line, the hidden line's "you" list).
export function factsIn(text) {
    const t = ` ${factKey(text)} `, out = new Set();
    if (!t.trim()) return out;
    if (!factIndex) factId('');
    for (const [key, id] of factIndex) if (t.includes(` ${key} `)) out.add(id);
    return out;
}
// In-world hours one reply covers, from the info boards before and after it: the clocks when both have one
// (a time skip counts in full, up to two weeks), an hour for a change of place without a clock, else a few
// minutes a reply. Backwards time (a flashback) counts as the few minutes.
export function replyHours(before, after, perReply) {
    const h = before && after ? hoursBetween(boardClock(before), boardClock(after)) : null;
    if (h != null) return Math.min(h, 24 * 14);
    const a = String(before?.location ?? '').split(',')[0].trim().toLowerCase(), b = String(after?.location ?? '').split(',')[0].trim().toLowerCase();
    return a && b && a !== b ? Math.max(1, perReply) : perReply;
}
