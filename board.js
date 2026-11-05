// The info board: the status block the roleplay model writes at the top of every reply.
// Moodweaver never changes its HTML (a chat regex styles it). It only reads the latest one back out of
// the chat, shows it as a Sims-style needs panel, and sends the player's edits and the needs that
// matter on to the next reply. No extra model calls: the board is already in the reply.
import { MOODS, SCALED_MOOD_CUES, MERGED_SEARCH_NAMES, analysed } from './core.js';
import { RELATIONSHIP_TAGS } from './relationships.js';

// The board layout. The optional desire row is off unless selected for this chat.
export const boardTemplate = (char, user, includeHorny = false, rows = {}) => `<div class="ihyll-style">
📅 <b>Date:</b> [In-world date: Weekday, Month Day, Year] | [Season] | [Weather Emoji] | [Forecast: Temp (°C/°F)]<br>
🕒 <b>Time:</b> [Scene time (12h AM/PM)]<br>
🗺️ <b>Location:</b> [Location] | <b>Present:</b> [NPCs currently visible] | <b>Activity:</b> [NPC posture/activity]<br>
👔 <b> ${char}’s Outfit:</b> [Current appearance & outfit, short]<br>
👗 <b>${user}’s Outfit:</b> [Current appearance & outfit, short]<br>
🧠 <b>State:</b> [2–5 words for ${char}'s current mood, led by their strongest feelings; their own state, not a description of what ${user} said or did]<br>
💎 <b>Physical State:</b> [One short line: injuries, wet, drunk, tired, hungry or other bodily needs right now]${includeHorny ? '<br>\n🦄 <b>Horny:</b> [Current level, including none; one short line]' : ''}${rows.toward ? `<br>\n💞 <b>Toward ${user}:</b> [2–4 words for how ${char} feels about ${user} right now, strongest first]` : ''}${rows.remember ? `<br>\n📌 <b>Remember:</b> [none, unless something just happened between ${char} and ${user} that a later scene needs: one short line of plain fact]` : ''}
</div>`;

// ---- Reading a board back ----
const LABELS = { date: /^date$/, time: /^time$/, location: /^location$/, present: /^present$/, activity: /^activity$/, state: /^state$/, physical: /^physical( state)?$/, horny: /^horny$/, toward: /^toward\b/, remember: /^remember$/ };
const clean = v => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(/^[\s|:–-]+|[\s|]+$/g, '').trim();
export const hasBoard = mes => typeof mes === 'string' && /<b>\s*(Date|Location|State):\s*<\/b>/i.test(mes);
// 1.34.0: old boards leave the prompt. Each one is ~200 tokens of HTML and emoji, and the newest one is
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
export function parseBoard(mes) {
    if (!hasBoard(mes)) return null;
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
export function latestBoard(chat, lookback = 40) {
    const list = Array.isArray(chat) ? chat : [];
    for (let i = list.length - 1, seen = 0; i >= 0 && seen < lookback; i--, seen++) {
        const m = list[i];
        if (!m || m.is_user || m.is_system || !hasBoard(m.mes)) continue;
        const board = parseBoard(m.mes);
        if (board) return { board, index: i, name: String(m.name ?? ''), key: boardKey(m.mes) };
    }
    return null;
}
function boardKey(mes) {
    let hash = 2166136261;
    for (let i = 0; i < mes.length; i++) hash = Math.imul(hash ^ mes.charCodeAt(i), 16777619);
    return `${mes.length}:${hash >>> 0}`;
}
// "vindicated, greedy, quietly manic" → three tiles.
export const phrases = text => String(text ?? '').split(/[,;]| and (?=[a-z]+ing\b)|·/i).map(clean).filter(p => p && p.length <= 90).slice(0, 8);

// ---- Needs, read from the board's own words ----
// 100 is fully met, 0 is desperate. Words only move a need when they clearly say so.
export const NEEDS = [
    ['hunger', 'Hunger', 'food keeps pulling at their attention and their temper'],
    ['energy', 'Energy', 'slow, sloppy and fighting to stay awake'],
    ['bladder', 'Bladder', 'fidgety, and cutting things short to find a toilet'],
    ['hygiene', 'Hygiene', 'aware of feeling and smelling filthy, and others notice'],
    ['comfort', 'Comfort', 'pain, cold or stiffness they keep shifting against'],
    ['social', 'Social', 'starved for company, attention or touch'],
    ['fun', 'Fun', 'bored and restless, looking for a thrill or trouble'],
    ['health', 'Health', 'hurt or sick enough that their body won’t do everything they want'],
].map(([id, label, cue]) => ({ id, label, cue }));
export const NEED_IDS = new Set(NEEDS.map(n => n.id));
// p: read from Physical State only. s: from State only. ps: either.
const RULES = [
    ['hunger', 8, 'p', /starv|famished|ravenous|hasn'?t eaten in days/],
    ['hunger', 30, 'p', /hungry|hunger|stomach (growl|rumbl|empty|cramp)|peckish|empty stomach|hasn'?t eaten|skipped (a )?meal/],
    ['hunger', 95, 'p', /\b(full|well[- ]fed|sated|stuffed|just ate)\b/],
    ['energy', 10, 'ps', /exhaust|dead on (his|her|their) feet|can'?t keep (his|her|their) eyes open|nodding off|running on fumes|collaps/],
    ['energy', 30, 'ps', /tired|sleepy|drowsy|weary|fatigue|yawn|heavy[- ]lidded|worn out|sluggish|no sleep|sleep[- ]deprived|drained/],
    ['energy', 92, 'ps', /well[- ]rested|wide awake|wired|buzzing|alert/],
    ['bladder', 8, 'p', /bursting|about to wet|desperate (to pee|for the (toilet|bathroom|loo))/],
    ['bladder', 30, 'p', /needs? (the|a) (toilet|bathroom|loo|piss|pee|wee)|full bladder|bladder/],
    ['hygiene', 12, 'p', /filthy|caked|covered in (blood|filth|mud|grime|shit|vomit|sick)|reeks|stinks|soaked in (blood|sweat)|blood[- ]spattered|drenched in blood|gore/],
    ['hygiene', 35, 'p', /sweat|grimy|dirty|greasy|unwashed|sticky|muddy|grime|smells? of|blood on|tacky with/],
    ['hygiene', 95, 'p', /fresh(ly)? (showered|washed|bathed)|scrubbed clean|squeaky clean/],
    ['comfort', 8, 'p', /agony|excruciat|unbearable|screaming pain|white[- ]hot pain/],
    ['comfort', 35, 'p', /pain|ache|aching|sore|stiff|cramp|headache|migraine|throb|\braw\b|tender|freezing|shiver|chilled|\bcold\b|numb|itch|nause|queasy|hungover|overheat|sweltering|dizzy/],
    ['comfort', 35, 'p', /soaked|drenched|soaking|wet through|dripping wet|rain[- ]soaked|wet (clothes|hair)|damp clothes/],
    ['comfort', 92, 'p', /comfortable|cos[yi]|cozy|relaxed|warm and/],
    ['social', 22, 's', /lonely|isolated|starved for (company|touch|attention)|desperate for company|abandoned/],
    ['social', 40, 's', /craving (company|attention|touch)|wants company|touch[- ]starved/],
    ['social', 92, 's', /socially drained|peopled out|wants? to be left alone/],
    ['fun', 25, 's', /bored|stir[- ]crazy|tedium|listless|restless/],
    ['fun', 90, 's', /thrilled|amused|entertained|delighted|giddy|playful|having fun/],
    ['health', 10, 'p', /dying|bleeding out|gut[- ]shot|stab wound|stabbed|mortal|unconscious|overdos|convuls|shattered/],
    ['health', 38, 'p', /bleed|\bcuts?\b|gash|wound|bruis|split lip|\bburns?\b|burned|burnt|scald|blister|singed|sprain|injur|limp|sick|fever|bitten|fractur|broken|black eye|swollen|concuss|cracked/],
    ['health', 95, 'p', /unhurt|unharmed|uninjured|healthy|in perfect health/],
];
const HORNY = [
    [92, /can'?t think (of|about) anything else|desperate|feral|ravenous|starving|insatiable|frantic|dripping|throbbing|burning up|out of (his|her|their) mind/],
    [72, /hungry|aching|pent[- ]up|needy|craving|restless|keyed up|hot for|hard\b|wet\b|wants (him|her|them)|hungry for/],
    [42, /interested|simmering|warm|curious|stirring|flicker|tempted|teasing|low hum|idle|smoulder|smolder|hint/],
    [8, /\bspent\b|sated|satisfied|drained|nothing|none|not in the mood|dead below|numb|repulsed|zero|\bcold\b/],
];
const negated = (text, index) => /\b(not|no longer|isn'?t|wasn'?t|without|no)\s+(\w+\s+){0,2}$/.test(text.slice(Math.max(0, index - 24), index));
// Reads needs from the State and Physical State lines. Returns { id: { value, source } } for needs the words touch.
// The worst reading wins, so "wired but exhausted" still counts as exhausted.
export function needsFromBoard(board) {
    const out = {};
    for (const [line, where] of [[board?.physical, 'p'], [board?.state, 's']]) for (const phrase of phrases(line)) {
        const text = phrase.toLowerCase();
        for (const [id, value, scope, re] of RULES) {
            if (!scope.includes(where)) continue;
            const m = re.exec(text); if (!m || negated(text, m.index)) continue;
            if (!out[id] || value < out[id].value) out[id] = { value, source: phrase };
        }
    }
    return out;
}
export function hornyFromBoard(board) {
    const text = String(board?.horny ?? '').toLowerCase();
    if (!text) return null;
    let best = null;
    for (const [value, re] of HORNY) { const m = re.exec(text); if (m && !negated(text, m.index) && (best === null || value > best)) best = value; }
    return best ?? 50;
}
export const needWord = v => v <= 15 ? 'Critical' : v <= 35 ? 'Low' : v <= 65 ? 'Okay' : 'Fine';
export const NEED_DEFAULT = 80;

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
export function skyOf(board) {
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
export function cleanBoardMeta(meta) {
    const b = meta && typeof meta === 'object' ? meta : {};
    const t = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
    const list = v => [...new Set((Array.isArray(v) ? v : []).map(x => t(x, 90)).filter(Boolean))].slice(0, 12);
    return {
        send: typeof b.send === 'boolean' ? b.send : undefined,
        includeHorny: b.includeHorny === true,
        feed: b.feed !== false, includeToward: b.includeToward === true, includeRemember: b.includeRemember !== false,
        pins: Object.fromEntries(EDIT_FIELDS.map(k => [k, t(b.pins?.[k], 200)]).filter(([, v]) => v)),
        needs: Object.fromEntries(Object.entries(b.needs ?? {}).filter(([k]) => NEED_IDS.has(k) || k === 'horny')
            .map(([k, v]) => [k, Math.round(Math.max(0, Math.min(100, Number(v) || 0)))])),
        keep: { state: list(b.keep?.state), physical: list(b.keep?.physical) },
        mute: { state: list(b.mute?.state), physical: list(b.mute?.physical) },
        syncedKey: t(b.syncedKey, 40),
        // 1.34.0: needs the weave line reported, by message index: { 12: { hunger: 30 } }.
        needSteps: Object.fromEntries(Object.entries(b.needSteps ?? {}).filter(([i, v]) => /^\d+$/.test(i) && v && typeof v === 'object')
            .sort((a, c) => Number(c[0]) - Number(a[0])).slice(0, 30)
            .map(([i, v]) => [i, Object.fromEntries(Object.entries(v).filter(([k]) => NEED_IDS.has(k)).map(([k, x]) => [k, Math.round(Math.max(0, Math.min(100, Number(x) || 0)))]))])),
    };
}
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
// What the panel and prompt both work from: the latest board plus the player's edits.
export function liveBoard(found, meta, names = {}) {
    const board = found?.board ?? null, b = cleanBoardMeta(meta);
    const outfit = who => board?.outfits.find(o => names[who] && same(o.name, names[who]))?.text ?? board?.outfits[who === 'char' ? 0 : 1]?.text ?? '';
    const field = key => b.pins[key] || (key === 'charOutfit' ? outfit('char') : key === 'userOutfit' ? outfit('user') : board?.[key] ?? '');
    const tiles = kind => {
        const from = phrases(board?.[kind]).filter(p => !b.mute[kind].some(x => same(x, p)));
        return [...from.map(text => ({ text, kept: b.keep[kind].some(x => same(x, text)) })),
            ...b.keep[kind].filter(x => !from.some(p => same(p, x))).map(text => ({ text, kept: true, added: true }))];
    };
    const read = board ? needsFromBoard(board) : {};
    // Whichever is newer wins: the board's words or the need the weave line last reported.
    const steps = Object.entries(b.needSteps).map(([i, v]) => [Number(i), v]).sort((x, y) => y[0] - x[0]);
    const woven = id => { const hit = steps.find(([, v]) => id in v); return hit && hit[0] >= (found?.index ?? -1) ? hit[1][id] : null; };
    const needs = NEEDS.map(n => {
        const pinned = Object.hasOwn(b.needs, n.id), w = woven(n.id);
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
// Pinned fields are left to the "player set these" block below, so nothing is said twice.
export function boardContinuity(live, char, user) {
    const b = live?.board; if (!b) return '';
    const pins = live.meta?.pins ?? {}, out = [];
    const add = (key, value, label = '') => { const v = clean(value); if (v && !pins[key]) out.push(label ? `${label}: ${v}` : v); };
    add('date', b.date); add('time', b.time); add('location', b.location); add('present', b.present, 'present'); add('activity', b.activity, 'doing');
    const outfit = who => b.outfits.find(o => same(o.name, who))?.text ?? b.outfits[who === char ? 0 : 1]?.text;
    add('charOutfit', outfit(char), `${char} wears`); add('userOutfit', outfit(user), `${user} wears`);
    add('physical', b.physical, 'body');
    return out.length ? `Where the last board left things; start from here and change only what the scene changes: ${pt(out.join('; '))}.` : '';
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
    out.push(`The board reports; it doesn't steer. State names ${n}'s strongest current feelings from these notes and the scene, in a few words. Physical State lists their active body settings (injured, wet, drunk and so on), the needs below and what the scene has done to them since.${send && toward ? ` Toward ${u} names ${n}'s strongest feelings about ${u} from the relationship notes and the scene.` : ''}${send && remember ? ` Remember stays none in most replies; fill it only for a confession, promise, betrayal, first time, secret learned or similar turning point.` : ''} Don't invent feelings or needs just to fill a row, and an older board doesn't override newer settings.${includeHorny ? ' Horny reports existing desire, including none; the row itself isn’t a reason to increase it.' : ''}`);
    if (!live) return out;
    const b = live.meta;
    const pins = [['date', 'Date'], ['time', 'Time'], ['location', 'Location'], ['activity', 'Activity'], ['charOutfit', `${char}’s Outfit`], ['userOutfit', `${user}’s Outfit`], ['horny', 'Horny']]
        .filter(([k]) => b.pins[k] && (k !== 'horny' || includeHorny)).map(([k, label]) => `- ${label}: ${pt(b.pins[k])}`);
    const keepState = live.state.filter(t => t.kept).map(t => t.text), keepBody = live.physical.filter(t => t.kept).map(t => t.text);
    if (pins.length || keepState.length || keepBody.length) out.push('', `The player set these. Keep them on the board and play them as true until they change:`, ...pins,
        ...(keepState.length ? [`- State includes: ${pt(keepState.join(', '))}`] : []), ...(keepBody.length ? [`- Physical State includes: ${pt(keepBody.join(', '))}`] : []));
    const cut = [...b.mute.state, ...b.mute.physical].filter(p => [live.board?.state, live.board?.physical].some(line => String(line ?? '').toLowerCase().includes(p.toLowerCase())));
    if (cut.length) out.push(`The player cut these. Drop them from the board and the scene: ${pt(cut.join(', '))}.`);
    const needs = live.needs.filter(nd => nd.pinned || (nd.known && nd.value <= 35));
    if (needs.length || (includeHorny && live.hornyPinned)) out.push('', `${n}'s needs right now. Low ones nag and leak into mood and choices; a critical one takes over until it's dealt with or something worse wins:`,
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
    jealousy: 'jealous', longing: 'yearning', devotion: 'devoted', panic: 'afraid', elation: 'happy', despair: 'hopeless', lust: 'horny', hunger: 'yearning', tenderness: 'affectionate', jealous: 'jealous', possessive: 'possessive', obsessive: 'obsessed', lustful: 'horny', aroused: 'horny', exhausted: 'tired' };
const RELATION_SYNONYMS = { fond: 'likes', wary: 'distrusts', distrustful: 'distrusts', protective: 'protects', attracted: 'finds_attractive', curious: 'intrigued_by',
    trusting: 'trusts', resentful: 'resents', afraid: 'fears', scared: 'fears', frightened: 'fears', annoyed: 'finds_annoying', irritated: 'irritated_by', loving: 'loves',
    adoring: 'idolises', tender: 'cherishes', grateful: 'grateful_to', guilty: 'guilty_toward', hurt: 'hurt_by', betrayed: 'betrayed_by', contemptuous: 'despises',
    disgusted: 'disgusted_by', lustful: 'lusts_after', hungry: 'lusts_after', intrigued: 'intrigued_by', respectful: 'respects', admiring: 'admires', pitying: 'pities',
    worried: 'worries_about', controlling: 'controls', dominant: 'dominates', hostile: 'cant_stand', hateful: 'hates', murderous: 'wants_kill', yearning: 'longs_for',
    obsessive: 'obsessed', smitten: 'smitten', infatuated: 'smitten', devoted: 'devoted', jealous: 'jealous', possessive: 'possessive', suspicious: 'suspicious_of' };
const SKIP = new Set(['with', 'over', 'them', 'their', 'they’re', 'they\'re', 'thinks', 'finds', 'wants', 'feels', 'about', 'around', 'despite', 'themselves', 'like', 'into', 'from', 'what', 'after', 'other', 'person', 'someone', 'something', 'love', 'more', 'than', 'keep']);
let feelIndex = null, relIndex = null, feelSize = 0;
function buildFeelIndex() {
    if (feelIndex && feelSize === MOODS.length) return feelIndex;
    const map = new Map(), byId = Object.fromEntries(MOODS.map(m => [m.id, m]));
    const add = (word, id, value) => { word = word.toLowerCase(); if (word.length > 3 && !SKIP.has(word) && byId[id] && analysed(byId[id]) && !map.has(word)) map.set(word, { id, value }); };
    // Scaled wording first: its first word carries the strength (terrified → afraid at 81).
    for (const [id, steps] of Object.entries(SCALED_MOOD_CUES)) for (const [min, text] of steps) add(text.split(/[\s:,;]/)[0], id, min >= 81 ? 85 : min >= 41 ? 60 : 35);
    for (const [word, id] of Object.entries(FEELING_SYNONYMS)) add(word, id, 60);
    for (const m of MOODS) if (analysed(m)) for (const part of m.label.toLowerCase().split(/\s*\/\s*/)) if (!part.includes(' ')) add(part.replace(/[^a-z’'-]/g, ''), m.id, 60);
    feelSize = MOODS.length; feelIndex = map; return map;
}
function buildRelIndex() {
    if (relIndex) return relIndex;
    const map = new Map(), ids = new Set(RELATIONSHIP_TAGS.map(t => t.id));
    for (const [word, id] of Object.entries(RELATION_SYNONYMS)) if (ids.has(id)) map.set(word, id);
    for (const t of RELATIONSHIP_TAGS) {
        const words = t.label.toLowerCase().replace(/[^a-z’' -]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !SKIP.has(w));
        if (words.length === 1 && !map.has(words[0])) map.set(words[0], t.id);
    }
    relIndex = map; return map;
}
function strengthOf(phrase, base, first) {
    const v = STRONG.test(phrase) ? Math.max(base, 85) : WEAK.test(phrase) ? Math.min(base, 30) : base;
    return Math.min(95, v + (first ? 10 : 0));
}
// "giddy, quietly furious, a little scared" → [{ id, value, phrase }].
function read(line, lookup) {
    const out = new Map();
    phrases(line).forEach((phrase, i) => {
        const text = phrase.toLowerCase(), words = text.replace(/[^a-z’' -]/g, ' ').split(/\s+/);
        for (const word of words) {
            const hit = lookup(word); if (!hit) continue;
            if (negated(text, text.indexOf(word))) continue;
            const value = strengthOf(text, hit.value, i === 0);
            if ((out.get(hit.id)?.value ?? 0) < value) out.set(hit.id, { id: hit.id, value, phrase });
            break;
        }
    });
    return [...out.values()];
}
// A feeling named on the weave line: its slider label first ("Clingy / needy", "clingy"), then the
// same words and synonyms the State row uses. Only feelings resolve; traits and story settings never do.
let labelIndex = null, labelSize = 0;
export function feelingId(name) {
    const text = String(name ?? '').toLowerCase().replace(/[^a-z’' /-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    if (!labelIndex || labelSize !== MOODS.length) {
        labelIndex = new Map(); labelSize = MOODS.length;
        for (const m of MOODS) if (analysed(m)) for (const key of [m.label.toLowerCase(), ...m.label.toLowerCase().split(/\s*\/\s*/), m.id.replace(/_/g, ' '), ...(MERGED_SEARCH_NAMES[m.id] ?? []).map(x => x.toLowerCase())])
            if (key && !labelIndex.has(key.trim())) labelIndex.set(key.trim(), m.id);
    }
    if (labelIndex.has(text)) return labelIndex.get(text);
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
    for (const word of text.split(' ')) { const id = buildRelIndex().get(word); if (id) return id; }
    return null;
}
export const feelingsFromBoard = board => read(board?.state, w => buildFeelIndex().get(w));
export const relationsFromBoard = board => read(board?.toward, w => { const id = buildRelIndex().get(w); return id ? { id, value: 60 } : null; });
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
