// Music: song tags, the scene snapshot and the song picker. Plain rules, no SillyTavern and no Spotify here,
// so it runs in Node too. app/music.js feeds it the scene and plays what it picks. Nothing here costs tokens.
import moodSection from '../data/catalogue/mood.js';
import stateSection from '../data/catalogue/state.js';
import { DYNAMIC_GROUPS } from '../data/catalogue/dynamics.js';
import { COMBOS, HEARD_IN, HIGHS, ROMANCE_MOODS, ENERGY, ENERGY_PUSH, FAMILY_ENERGY, GOOD_ENOUGH, HEAT, LIGHT_DESIRE, LINEUP, MODES, MOMENTS, POINTS, SEX_FACTS, SWEET_MOODS, WORD_MOMENTS } from '../data/catalogue/music.js';
import { BEATS as BEAT_LIST, readScene } from './scene-words.js';

// ---- The names the sheet and the panel use ----
const FAMILY_ROWS = moodSection.filter(g => g.kind === 'mood');
export const FAMILIES = FAMILY_ROWS.map(g => ({ id: g.id, label: g.name }));
export const MOOD_LIST = FAMILY_ROWS.flatMap(g => g.rows.map(r => ({ id: r.id, label: r.label, family: g.id })));
const MOOD_FAMILY = Object.fromEntries(MOOD_LIST.map(m => [m.id, m.family]));
export const PLACES = (stateSection.find(g => g.id === 'setting')?.rows ?? []).map(r => ({ id: r.id, label: r.label }));
const PLACE_IDS = new Set(PLACES.map(p => p.id));
export const DYN_GROUPS = DYNAMIC_GROUPS.map(([id, label]) => ({ id, label }));
export { MOMENTS, HEAT, ENERGY, MODES };
const DYN_IDS = new Set(DYN_GROUPS.map(g => g.id)), HEARD_IDS = new Set(HEARD_IN.map(x => x.id));
export { HEARD_IN };

// Names are compared without case, accents, quotes or extra spaces ("Dealer's flat" = "Dealer’s flat").
export const norm = s => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').toLowerCase().replace(/\s+/g, ' ').trim();
const byName = list => { const m = new Map(); for (const x of list) { m.set(norm(x.label), x.id); m.set(norm(x.id), x.id); } return m; };
const NAMES = { cm: byName(COMBOS), f: byName(FAMILIES), m: byName(MOOD_LIST), p: byName(PLACES), mo: byName(MOMENTS), d: byName(DYN_GROUPS), h: byName(HEAT) };
const LABEL = { f: Object.fromEntries(FAMILIES.map(x => [x.id, x.label])), m: Object.fromEntries(MOOD_LIST.map(x => [x.id, x.label])), p: Object.fromEntries(PLACES.map(x => [x.id, x.label])),
    mo: Object.fromEntries(MOMENTS.map(x => [x.id, x.label])), d: Object.fromEntries(DYN_GROUPS.map(x => [x.id, x.label])), h: Object.fromEntries(HEAT.map(x => [x.id, x.label])), cm: Object.fromEntries(COMBOS.map(x => [x.id, x.label])),
    k: Object.fromEntries(MODES.map(x => [x.id, `${x.label} scenes`])) };
export const labelOf = (kind, id) => LABEL[kind]?.[id] ?? id;
// A cell can hold several values: "Hunted, Dreading" (Google Sheets' multiple choice joins them the same way).
export const split = cell => String(cell ?? '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
// Meanings (two feelings at once), with each side's labels turned into mood ids and family ids.
const MOOD_BY_LABEL = new Map(MOOD_LIST.map(m => [norm(m.label), m.id]));
export const MEANINGS = COMBOS.map(c => {
    const side = list => ({ fam: new Set(list.filter(x => x.startsWith('f:')).map(x => x.slice(2))), ids: new Set(list.filter(x => !x.startsWith('f:')).map(x => MOOD_BY_LABEL.get(norm(x))).filter(Boolean)) });
    return { id: c.id, label: c.label, a: side(c.a), b: side(c.b) };
});
const MEANING_IDS = new Set(MEANINGS.map(c => c.id));
// Which Meanings one person's feelings hold right now (31 or more on each side, from two different feelings).
export function meaningsOf(moods = {}) {
    const on = Object.entries(moods).filter(([id, v]) => MOOD_FAMILY[id] && v >= 31).map(([id]) => id), out = new Set();
    const hit = (side, id) => side.ids.has(id) || side.fam.has(MOOD_FAMILY[id]);
    for (const c of MEANINGS) if (on.some(x => hit(c.a, x) && on.some(y => y !== x && hit(c.b, y)))) out.add(c.id);
    return out;
}

// ---- Tags ----
// One song's (or one playlist's) tags. Character names are kept as typed (compared without case);
// {{char}} and {{user}} stand for whoever the main character and your persona are in the chat.
// nv (Never during) holds 'f:<family>', 'mo:<moment>', 'h:<heat>' and 'k:<kind of scene>' (✗ Not here adds these).
export const emptyTags = () => ({ f: [], m: [], p: [], mo: [], d: [], cm: [], h: '', e: 0, c: [], th: false, nv: [], fav: false, off: false, cue: [], cw: [], st: [], pk: 0, yr: 0, dg: [], note: '' });
const ids = (list, ok) => [...new Set((Array.isArray(list) ? list : []).filter(x => typeof x === 'string' && ok(x)))];
export function cleanTags(t = {}) {
    return {
        f: ids(t.f, x => Boolean(LABEL.f[x])), cm: ids(t.cm, x => MEANING_IDS.has(x)), m: ids(t.m, x => Boolean(MOOD_FAMILY[x])), p: ids(t.p, x => PLACE_IDS.has(x)), mo: ids(t.mo, x => Boolean(LABEL.mo[x])), d: ids(t.d, x => DYN_IDS.has(x)),
        h: LABEL.h[t.h] ? t.h : '', e: [1, 2, 3, 4, 5].includes(Number(t.e)) ? Number(t.e) : 0,
        c: [...new Set((Array.isArray(t.c) ? t.c : []).map(x => String(x).trim()).filter(Boolean).slice(0, 12))],
        th: t.th === true, nv: ids(t.nv, x => /^(f|mo|h|k):/.test(x)), fav: t.fav === true, off: t.off === true, cue: cleanCues(t.cue), cw: cleanCueWords(t.cw), st: ids(t.st, x => BEAT_IDS.has(x)), pk: cleanPeak(t.pk), yr: cleanYear(t.yr), dg: ids(t.dg, x => HEARD_IDS.has(x)), note: String(t.note ?? '').slice(0, 300),
    };
}
// ---- Stings, peaks and years ----
// st: the big story beats this song can sting (engine/scene-words.js BEATS). pk: where the song's peak starts, in
// seconds (the chorus or drop to jump to when a scene is at full tilt). yr: the year the recording first came out,
// for the in-story radio. "1:05", "65" and "65s" all read as 65 seconds.
export { BEATS } from './scene-words.js';
const BEAT_IDS = new Set(BEAT_LIST.map(b => b.id));
export function cleanPeak(v) {
    if (typeof v === 'number') return v > 0 && v < 1800 ? Math.round(v) : 0;
    const m = String(v ?? '').trim().match(/^(\d{1,2}):(\d{2})$|^(\d{1,4})\s*s?$/i); if (!m) return 0;
    const sec = m[3] !== undefined ? Number(m[3]) : Number(m[1]) * 60 + Number(m[2]); return sec > 0 && sec < 1800 ? sec : 0;
}
export const cleanYear = v => { const y = Number(String(v ?? '').match(/\b(1[89]\d\d|20\d\d)\b/)?.[1] ?? v); return y >= 1880 && y <= 2100 ? y : 0; };
export const peakText = sec => sec ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '';
// ---- Lyric cues ----
// Short phrases that nod to a song when the story says them ("like a dog" → I Wanna Be Your Dog). Lower case, 1 to 4
// words, up to 8 per song; a trailing * means any ending ("salivat*").
export const cleanCues = list => [...new Set((Array.isArray(list) ? list : []).map(x => String(x).toLowerCase().replace(/[^a-z0-9'*\s-]/g, ' ').replace(/\s+/g, ' ').trim()).filter(x => x.replace(/\*/g, '').length >= 3 && x.split(' ').length <= 5))].slice(0, 8);
const cueRe = new Map();
const cueRegex = c => {
    if (!cueRe.has(c)) cueRe.set(c, new RegExp(`(?<![a-z0-9'])${c.split(' ').map(w => w.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*$/, "[a-z']*").replace(/\*/g, '')).join("[\\s,.;:!?\"'-]+")}(?![a-z0-9])`, 'i'));
    return cueRe.get(c);
};
// Theme words: single words or stems from the song's lyrics and themes (dog*, leash*, salivat*, collar*). Any two
// different ones within CUE_NEAR words of each other (about a sentence) count, one of them not an everyday word, so the narrator's own wording works ("his mouth is
// watering like a dog under a dinner table"). Words that turn up in nearly every reply never count.
export const CUE_NEAR = 15;
const CUE_STOP = new Set(('love heart eye eyes dark darkness night kiss hand hands girl girls boy boys man men woman women baby time life die dies died dying dead death cold light look looks looked feel feels felt want wants wanted need needs know say says said smile smiles tear tears cry cries cried breath breathe skin lip lips mouth body head face hair voice room bed door wall walls floor window chair table '
    + 'doctor doctors nurse patient patients hospital ward needle syringe clinic facility cell experiment test file notes chart pill pills medicine sedative strap straps restraint restraints the and you your his her him she he it its this that with for from').split(' '));
// Everyday prose words. A pair of theme words needs at least one word that isn't one of these, so "step closer" or
// "rain on the glass" never sets a song off, while "dog" with "watering" does.
const CUE_COMMON = new Set('a about above ache aches across act after afternoon again against age ago air all almost alone along already also always am among an and anger animal another answer any anyone anything apart appear are arm arms around as ash ask asleep at ate away back bad bag ball bar bare barely be bear beat beautiful became because become been before began begin behind being believe bell belly below beneath beside best better between big bird bit bite bites bitter black blank blind blink blood blow blue board boat bone book books boot boots born both bottle bottom bound box brain bread break breakfast breath breathing bright bring broke broken brother brown bruise brush brushes build bulb burn burning burns busy but button buy buzz buzzing by call calm came can candle candles car care careful carefully carry case catch caught ceiling center chance change cheap cheek cheeks chest chew child children chill chin choose church cigarette circle city clean clear click climb clock close closed closer closes cloth clothes cloud clouds coat coffee cold collar color colour come comes coming cool corner corridor could count country course cover crack cross crowd cruel cup curl curtain cut dad dance danger dark darkness day dear deep desk did different dim dinner dirt dirty do does dog done door doors down drank draw drawn dream dress drew drink drinks drive drop dry dull dust each ear early ears earth easy eat eats edge eight either else empty end enough even evening ever every everyone everything exam examine examined examines except eye face faces fact fail fall false family far fast fat father fear feet fell few field fill final finally find fine finger fingers fingertip fingertips finish fire first fish fist five flat flesh flew floor flower fly fog fold follow food foot for force forehead forget fork forward found four free freezing fresh friend from front full fun funny game garden gave gaze gazes gently get gift give glad glance glances glass glow go god goes gold gone good got grab grabs gray great green grew grey grip grips ground group grow guess gun had half hall hallway hand hang happen happy hard hardly has hat have he hear heard heartbeat heat heavy held hell help her here hers herself hide high hill him himself hip hips his hit hold holds hole home hope horse hot hour hours house how however huge hum humming hundred hunger hungry hurt hurts idea if ill in inch inside instead into iron is it its itself jacket job join just keep kept key keys kid kind king knee knees knew knife lady laid lake lamp land language large last late laugh lay lead lean leaned leans learn least leave led left leg legs less let letter letters lick licks lie lift light lights like line lip list listen little live lock locks long loose lose lost lot loud low lower lunch made make many mark marks matter may me meal mean meat meet member memory middle might mile milk mind minute minutes miss mist mister moment moments money month moon more morning most mother move moves much music must my name names napkin near nearly neck never new next nice nine no nod nods noise none nor nose not note nothing notice now number observation observe observed observes observing of off offer office often oh oil ok old on once one only open opens or order other our out outside over own page pages pain paint pair pale palm palms paper part party pass past path pay pen people perhaps person photograph pick picture piece pink place plain plan plant plate play please pocket point poor pour pours power present press presses pretty procedure pull pulls pulse push pushes put question quick quiet quietly quite race radio rain raise ran rather reach reaches read ready real really reason record red remember rest rests ribs rich ride right ring rise river road rock roll roof rope rose rough round row run rush sad safe same sand sat save saw scene scent school sea seat second seconds see seem seen send sense set seven shade shadow shadows shake shaking shall shape share sharp she sheet shine ship shirt shiver shoe shoes shook shop short should shoulder shoulders shout show shut side sigh sighs sight sign silence silent silver simple simply since sing single sip sips sister sit sits six size sky sleep sleeve slip slow slowly small smell smells smoke smokes smooth snow so soft softly some someone something sometimes son song soon sore sorry sort sound south space speak special spend spine spoke spoon spot spread spring square stair stairs stand stands star stare stares stars start state stay steady step steps stick still sting stings stomach stone stood stop store storm story straight strange street stroke strokes strong study subject subjects such sudden suddenly sugar summer sun supper sure surface swallow swallows sweat sweet swing take taken talk tall taste tastes tea teach tears teeth tell ten tender than thank that the their them then there these they thick thin thing think third this those though thought three threw throat through throw thumb tick ticking tie tight till tilt tilts tiny tired to today together told tomorrow tongue tonight too took top touch touches toward towards town trace traces track train tray tree tremble trembling trip trouble true trust truth try tune turn turned turns twice two under understand unlock until up upon us use used usual very view visit voice voices waist wait wake walk walked walks wall walls warm warmth was wash watch watches watching water wave way we wear weather week weight well went were wet what wheel when where whether which while whiskey whisper white who whole whose why wide wild will win wind window windows wine wing winter wire wise wish with within without woke wonder wood word words work world worry would wrist wrists write wrong yard year yellow yes yesterday yet you young'.split(' '));
// A plural counts as its word (dogs is as everyday as dog), but a theme word written with its own ending (watering,
// drooling) was chosen for that form and isn't an everyday word.
// Everyday words of roleplay prose on top of the plain list: on their own they say nothing about a song.
for (const w of 'pin pinned pins pinning pull pulled pulling forgot forgotten forgetting something anything nothing everything someone little small give gives gave given sign signs follow follows followed watch watched change changed changes world past memory memories remember remembered glass house wing grab grabbed press pressed hold holding held kiss kissed touch touched'.split(' ')) CUE_COMMON.add(w);
// A word with a * counts as everyday when an everyday word starts with it (someth* → something, pull* → pull).
const CUE_COMMON_LIST = [...CUE_COMMON];
const cueCommon = w => {
    const s = w.replace('*', '');
    if (CUE_COMMON.has(s)) return true;
    if (w.endsWith('*')) return s.length <= 8 && CUE_COMMON_LIST.some(c => c.startsWith(s));
    return /[^s]s$/.test(s) && CUE_COMMON.has(s.slice(0, -1));
};
export const cleanCueWords = list => [...new Set((Array.isArray(list) ? list : []).map(x => String(x).toLowerCase().trim().replace(/[^a-z'*-]/g, ''))
    .filter(x => /^[a-z][a-z'-]*\*?$/.test(x) && x.replace('*', '').length >= 3 && !CUE_STOP.has(x.replace('*', ''))))].slice(0, 16);
// A short stem (beg*, moth*) would catch began or mother, so under 5 letters a * only adds the usual endings.
const cueWordHit = (w, tok) => {
    if (w.endsWith('*') && w.length > 5) return tok.startsWith(w.slice(0, -1));
    w = w.replace('*', '');
    return tok === w || tok === `${w}s` || tok === `${w}es` || tok === `${w}'s` || tok === `${w}ed` || tok === `${w}d` || tok === `${w}ing` || tok === `${w}${w.at(-1)}ing` || tok === `${w}${w.at(-1)}ed`;
};
// The songs whose cues the text says: [{ uri, cue }]. A phrase counts alone; theme words count in pairs.
export function cueHits(songs, text) {
    const t = String(text ?? '').replace(/[\u2018\u2019]/g, "'"); if (!t.trim()) return [];
    const toks = t.toLowerCase().match(/[a-z][a-z'-]*/g) ?? [], at = new Map();
    toks.forEach((w, i) => { const k = w.replace(/'s$/, ''); for (const x of new Set([w, k])) { if (!at.has(x)) at.set(x, []); at.get(x).push(i); } });
    const uniq = [...at.keys()], out = [];
    for (const s of songs) {
        // A one-word phrase that's an everyday word ("just") proves nothing on its own.
        const phrase = (s.tags?.cue ?? []).find(c => (c.includes(' ') || !cueCommon(c)) && cueRegex(c).test(t));
        if (phrase) { out.push({ uri: s.uri, cue: phrase, strength: 3 }); continue; }
        const found = [];
        for (const w of s.tags?.cw ?? []) { const pos = uniq.filter(tok => cueWordHit(w, tok)).flatMap(tok => at.get(tok)); if (pos.length) found.push([w, pos]); }
        if (found.length < 2) continue;
        let pair = null;
        for (let a = 0; a < found.length && !pair; a++) for (let b = a + 1; b < found.length && !pair; b++) {
            const [x, y] = [found[a][0].replace('*', ''), found[b][0].replace('*', '')];
            if (x.startsWith(y) || y.startsWith(x) || (cueCommon(found[a][0]) && cueCommon(found[b][0]))) continue; // draw + drawn is one word; two everyday words prove nothing
            if (found[a][1].some(p => found[b][1].some(q => p !== q && Math.abs(p - q) <= CUE_NEAR))) pair = [`${x} + ${y}`, cueCommon(found[a][0]) || cueCommon(found[b][0]) ? 1 : 2];
        }
        if (pair) out.push({ uri: s.uri, cue: pair[0], strength: pair[1] });
    }
    return out;
}
export const hasTags = t => Boolean(t && (t.f?.length || t.cm?.length || t.m?.length || t.p?.length || t.mo?.length || t.d?.length || t.h || t.e || t.c?.length || t.th || t.nv?.length || t.fav || t.off || t.cue?.length || t.cw?.length || t.st?.length || t.pk || t.yr || t.dg?.length));
// A song's own tags on top of its playlists': lists add up, a song's own Heat, Energy and Off win.
export function mergeTags(own, ...fromPlaylists) {
    const all = [...fromPlaylists.filter(Boolean), own].filter(Boolean), out = emptyTags();
    for (const t of all) {
        for (const k of ['f', 'm', 'p', 'mo', 'd', 'cm', 'c', 'nv', 'cue', 'cw', 'st', 'dg']) out[k] = [...new Set([...out[k], ...(t[k] ?? [])])];
        if (t.h) out.h = t.h; if (t.e) out.e = t.e; if (t.pk) out.pk = t.pk; if (t.yr) out.yr = t.yr; if (t.th) out.th = true; if (t.fav) out.fav = true; if (t.off) out.off = true;
    }
    return out;
}

// ---- The scene snapshot ----
// input: {
//   people: [{ name, role: 'char' | 'user', weight, moods: { id: value } }]  whose moods count (weight 1 or 0.5)
//   who: names and tokens the scene is about, e.g. ['Easterman', '{{char}}']
//   facts: { id: value } for everyone in the scene (places, bedroom facts…)
//   dyn: main dynamic group, under: second dynamic group, meters: { hu, … }, horny: 0-100 or null
//   night: the board says it's late, replies: how many replies the chat has, appear: names that just entered the scene
//   everyone: [{ names: [name, token…], moods }] for everyone in the scene; a song tagged for one of them matches
//   that person's own moods, even when the music follows someone else (heat counts both of you, whoever the music follows)
//   texts: [{ text, weight }] the newest reply and your last message, read for what is actually happening }
const LIGHT = new Set(LIGHT_DESIRE), SWEET = new Set(SWEET_MOODS), ROM = new Set(ROMANCE_MOODS), ROM_MO = new Set(['romance', 'longing', 'slow_dance']), GRIM = new Set(['captivity', 'experiment', 'hunted', 'violence', 'conditioning', 'stalking', 'grief', 'breakdown']);
export function snapshot(input = {}) {
    const moodVal = {};
    for (const p of input.people ?? []) for (const [id, v] of Object.entries(p.moods ?? {})) {
        if (!MOOD_FAMILY[id] || !(v > 0)) continue;
        moodVal[id] = Math.max(moodVal[id] ?? 0, v * (p.weight ?? 1));
    }
    const top = Object.entries(moodVal).filter(([, v]) => v >= 21).sort((a, b) => b[1] - a[1]);
    const famScore = {};
    for (const [id, v] of top.slice(0, 6)) famScore[MOOD_FAMILY[id]] = (famScore[MOOD_FAMILY[id]] ?? 0) + v;
    const fams = Object.entries(famScore).sort((a, b) => b[1] - a[1]).map(([f]) => f);
    const facts = new Set(Object.entries(input.facts ?? {}).filter(([, v]) => v >= 21).map(([id]) => id));
    const places = new Set([...facts].filter(id => PLACE_IDS.has(id)));
    const night = Boolean(input.night) || facts.has('late_night');
    // Energy: the strongest moods' families, then the places.
    const weighed = top.slice(0, 4);
    let energy = weighed.length ? weighed.reduce((s, [id, v]) => s + (FAMILY_ENERGY[MOOD_FAMILY[id]] ?? 2.5) * v, 0) / weighed.reduce((s, [, v]) => s + v, 0) : 2.5;
    for (const id of places) energy += ENERGY_PUSH[id] ?? 0;
    // Desire counts for everyone in the scene: a foreplay scene is one whoever the music follows. Light desire (a flirt,
    // a shy want) counts half, so a giggly confession with a little want in it doesn't read as foreplay.
    const all = [...top, ...(input.everyone ?? []).flatMap(p => Object.entries(p.moods ?? {}).filter(([, v]) => v > 0))];
    const desires = all.filter(([id]) => MOOD_FAMILY[id] === 'desire').map(([id, v]) => LIGHT.has(id) ? v / 2 : v).sort((a, b) => b - a);
    const desire = desires[0] ?? 0, desireSum = (desires[0] ?? 0) + (desires[1] ?? 0);
    const sweetMood = Math.max(0, ...all.filter(([id]) => SWEET.has(id)).map(([, v]) => v));
    const horny = Number.isFinite(input.horny) ? input.horny : 0;
    const words = readScene(input.texts ?? []);
    // Slow burn starts early: one desire feeling at 31+, or two that add up to 55+, either of you.
    let heat = SEX_FACTS.some(id => facts.has(id)) || (horny >= 81 && desire >= 61) || words.on.has('sex') ? 'sex' : desire >= 31 || desireSum >= 55 || horny >= 41 || words.on.has('intimate') ? 'slow' : '';
    // Sweet or intimate? What pulls towards bed against what's sweet, playful or wholesome. Sweet wins a tie.
    const heatPull = words.score.intimate + desire / 20 + Math.max(0, horny - 20) / 25;
    const sweetPull = words.score.sweet + words.score.confess + words.score.flirt * 0.5 + sweetMood / 20;
    const sweet = sweetPull >= 2 && (words.on.has('sweet') || words.on.has('confess') || sweetMood >= 41 || words.score.flirt >= 2);
    if (heat === 'slow' && sweet && sweetPull >= heatPull) heat = '';
    // 1.89: Romantic or erotic? Love, longing, a slow dance or an earnest kiss against the pull to bed. Romance wins a
    // tie too, but never once the story is plainly sex.
    const romMood = Math.max(0, ...all.filter(([id]) => ROM.has(id)).map(([, v]) => v));
    const romPull = words.score.romantic + words.score.slowdance + words.score.confess * 0.5 + romMood / 20;
    const romantic = romPull >= 2 && (words.on.has('romantic') || words.on.has('slowdance') || romMood >= 41);
    if (heat === 'slow' && romantic && romPull >= heatPull && words.score.sex < 1) heat = '';
    // You can say what kind of scene this is in the Music tab; Intimate then means at least a slow burn.
    if (input.force === 'intimate' && !heat) heat = 'slow';
    if (input.force && input.force !== 'intimate' && heat === 'slow') heat = '';
    const snap = { moodVal, top: top.map(([id]) => id), fams, places, facts, night, heat, dyn: input.dyn || '', under: input.under || '', meters: input.meters ?? {}, replies: input.replies ?? 99,
        story: false, who: [...new Set((input.who ?? []).map(norm).filter(Boolean))], moodBy: moodsBy(input.everyone), appear: (input.appear ?? []).map(norm), energy: Math.max(1, Math.min(5, Math.round(energy))), moments: new Set(), words: words.score, mode: '', sweet: sweet && !heat, romantic: romantic && !heat, pull: { heat: Math.round(heatPull * 10) / 10, sweet: Math.round(sweetPull * 10) / 10, rom: Math.round(romPull * 10) / 10 } };
    const moments = new Set();
    for (const mo of MOMENTS) {
        const hit = mo.moods.some(id => (moodVal[id] ?? 0) >= 41) || mo.places.some(id => places.has(id)) || (mo.dyn.length && (mo.dyn.includes(snap.dyn) || mo.dyn.includes(snap.under)));
        if (hit && (!mo.test || mo.test(snap))) moments.add(mo.id);
        else if (!mo.moods.length && !mo.places.length && !mo.dyn.length && mo.test?.(snap)) moments.add(mo.id);
    }
    // What the story's words say is happening adds its moments (a kiss is foreplay whatever the moods say).
    for (const [kind, mo] of Object.entries(WORD_MOMENTS)) if (words.on.has(kind)) moments.add(mo);
    if (heat === 'slow') moments.add('seduction');
    if (heat) { moments.delete('sleep'); moments.delete('party'); }
    if (heat || !snap.sweet) for (const mo of ['love_confession', 'flirting', 'sweet_moment']) if (!words.on.has(Object.keys(WORD_MOMENTS).find(k => WORD_MOMENTS[k] === mo))) moments.delete(mo);
    if (snap.sweet && !heat && words.score.confess >= 1) moments.add('love_confession');
    // A love confession is Sweet, not the sad kind of Confession, unless sadness leads.
    if (moments.has('love_confession') && snap.fams[0] !== 'sad') moments.delete('confession');
    if (heat === 'sex') moments.delete('seduction');
    for (const id of moments) energy += ENERGY_PUSH[id] ?? 0;
    if (heat) energy = Math.min(energy, heat === 'sex' ? 4 : 3.4);
    snap.moments = moments; snap.energy = Math.max(1, Math.min(5, Math.round(energy)));
    // Meanings: each person on their own, and the blend the music follows.
    snap.meanings = new Set([...meaningsOf(moodVal), ...Object.values(snap.moodBy).flatMap(x => [...meaningsOf(x)])]);
    snap.mode = input.force && MODE_BY_ID[input.force] ? input.force : modeOf(snap); snap.forced = Boolean(input.force && MODE_BY_ID[input.force]);
    return snap;
}
// The kind of scene, which leads the pick: a song made for another kind of scene drops right down the list.
// Intimate beats danger beats sorrow beats sweet beats tender beats dark beats party. Sweet only counts when the
// scene really reads sweet (words or sweet moods, see snapshot), and never while cruelty or fear leads the moods.
export function modeOf(snap) {
    if (snap.heat) return 'intimate';
    const has = list => list.some(mo => snap.moments.has(mo)), lead = snap.fams[0];
    // Action beats Danger when it's a fight, chase or job and fear isn't what leads.
    if (has(['chase', 'fight', 'heist']) && lead !== 'scared' && !snap.moments.has('hunted')) return 'action';
    for (const mode of MODES) {
        if (mode.id === 'intimate') continue;
        if (mode.id === 'sweet') { if (snap.sweet && !['cruel', 'scared', 'angry'].includes(lead) && (!snap.romantic || snap.pull.sweet >= snap.pull.rom)) return 'sweet'; continue; }
        if (mode.id === 'romantic') { if (snap.romantic && !['cruel', 'scared', 'angry'].includes(lead)) return 'romantic'; continue; }
        // A deal is Tense when there's unease in it (fear in the moods, a hand near a gun), else it's Street.
        if (mode.id === 'tense') { if (has(['standoff', 'waiting']) || (snap.moments.has('deal') && (snap.fams.slice(0, 3).includes('scared') || (snap.words.standoff ?? 0) >= 1))) return 'tense'; continue; }
        if (has(mode.moments)) return mode.id;
    }
    return '';
}
const MODE_BY_ID = Object.fromEntries(MODES.map(m => [m.id, m]));
// Is this song made for that kind of scene? Its Moment, Heat or Feeling says so.
export function fitsMode(tags, mode, snap = null) {
    const m = MODE_BY_ID[mode]; if (!m) return true;
    if (mode === 'intimate') {
        // 1.89: a love song with no heat and nothing sexual about it is Romantic, not Erotic.
        if (!tags.h && tags.mo.some(x => ROM_MO.has(x)) && !tags.mo.includes('seduction') && tags.f[0] !== 'desire') return false;
        if (tags.h || tags.f.includes('desire') || tags.mo.includes('seduction') || tags.m.some(id => MOOD_FAMILY[id] === 'desire')) return true;
        // A song whose only tie to intimacy is Afterglow (a hushed piano piece for lying together after) fits the
        // afterglow, not foreplay or sex while the heat is still building.
        return tags.mo.includes('afterglow') && (!snap || snap.moments?.has('afterglow') || !snap.heat);
    }
    // Romantic: its moments (Romance, Longing, Slow dance), or an older sheet's love song with no heat.
    if (mode === 'romantic') {
        if (tags.h === 'sex') return false;
        if (tags.mo.some(x => m.moments.includes(x))) return true;
        if (tags.h || tags.mo.some(x => GRIM.has(x))) return false;
        return tags.d.includes('romance') && ['closeness', 'attachment'].includes(tags.f[0]);
    }
    // Sweet: its moments, or a romance song with no heat and a warm feeling (so older sheets work too).
    if (mode === 'sweet') {
        if (tags.h) return false;
        if (tags.mo.some(x => m.moments.includes(x))) return true;
        if (tags.mo.some(x => GRIM.has(x)) || ['cruel', 'scared', 'angry'].includes(tags.f[0])) return false;
        if (!m.families.includes(tags.f[0]) || tags.f.slice(0, 2).some(f => ['scared', 'cruel', 'angry', 'cold'].includes(f)) || tags.mo.some(x => ['party', 'grief', 'breakdown'].includes(x))) return false;
        return tags.d.includes('romance') || tags.m.some(id => SWEET.has(id) && !LIGHT.has(id));
    }
    return tags.mo.some(x => m.moments.includes(x)) || (!tags.mo.length && tags.f.slice(0, 2).some(f => m.families.includes(f)));
}
// Each person's own feelings (21 or more), under every name and token they go by.
function moodsBy(everyone = []) {
    const out = {};
    for (const p of everyone) {
        const moods = Object.fromEntries(Object.entries(p.moods ?? {}).filter(([id, v]) => MOOD_FAMILY[id] && v >= 21));
        for (const n of p.names ?? []) if (norm(n)) out[norm(n)] = moods;
    }
    return out;
}
// What the snapshot says, in a few words, for the Now playing card.
export function describe(snap, whoName = '') {
    return [whoName, snap.mode ? MODE_BY_ID[snap.mode]?.label : '', snap.places.size ? labelOf('p', [...snap.places][0]) : '', [...snap.moments].map(id => labelOf('mo', id))[0] ?? '', snap.fams[0] ? labelOf('f', snap.fams[0]) : '', snap.heat === 'sex' ? 'Sex scene' : '', `energy ${snap.energy}`].filter(Boolean).join(' · ');
}
// The things a ✓ Fits or ✗ Not here tap remembers about a scene.
export const learnKeys = snap => [snap.mode ? `k:${snap.mode}` : '', ...[...snap.places].map(p => `p:${p}`), ...[...snap.moments].map(m => `mo:${m}`), snap.fams[0] ? `f:${snap.fams[0]}` : '', snap.heat ? `h:${snap.heat}` : ''].filter(Boolean);

// ---- Scoring ----
const blocked = (nv, snap) => nv.some(x => {
    const [k, id] = [x.slice(0, x.indexOf(':')), x.slice(x.indexOf(':') + 1)];
    return k === 'f' ? snap.fams.slice(0, 2).includes(id) : k === 'mo' ? snap.moments.has(id) : k === 'h' ? snap.heat === id : k === 'k' ? snap.mode === id : false;
});
// Sounds that don't belong under sex: the old-time pop of the 1940s to early 60s (Spotify's genres, or a year
// before 1964 when the song has none), except a slow, sultry one led by desire (Fever); and in a sex scene, any
// bright, fast pop led by happiness.
const OLD_POP = /\b(adult standards|doo-?wop|swing|big band|rockabilly|rock (?:and|n|'n') roll|bubblegum|girl group|easy listening|brill building|merseybeat|traditional pop|vocal jazz|crooner|lounge|exotica|british invasion|beat music|sunshine pop|novelty)\b/i;
export function wrongForHeat(tags, g = [], heat = '') {
    const old = (g ?? []).length ? g.some(x => OLD_POP.test(x)) : Boolean(tags.yr && tags.yr < 1964);
    if (old && !(tags.f[0] === 'desire' && tags.e && tags.e <= 2)) return true;
    return heat === 'sex' && tags.f[0] === 'happy' && tags.e >= 4;
}
// opts: { recent: Set of uris, learn: { key: n } for this song, themeOn: 'big' | 'always' | 'off', radio: the in-story radio is on }
export function scoreSong(tags, snap, opts = {}) {
    if (tags.off || blocked(tags.nv, snap)) return { score: -Infinity, why: [] };
    // Hard lines: a sex song never plays outside an intimate scene, and a bright, happy song with nothing
    // sultry about it never plays in one (no "It's My Party" for foreplay).
    if (tags.h === 'sex' && !snap.heat) return { score: -Infinity, why: [] };
    const bright = ['happy', 'energy'].includes(tags.f[0]) && !tags.f.includes('desire') && !tags.h && !tags.mo.includes('seduction');
    if (snap.heat && bright) return { score: -Infinity, why: [] };
    // 1.80: old-time pop (crooners, doo-wop, swing, rockabilly) and bright upbeat pop sound wrong under foreplay and
    // sex, whatever their tags say, unless it's the in-story radio or you said ✦ Fits for it in this heat.
    if (snap.heat && !opts.radio && !((opts.learn?.[`h:${snap.heat}`] ?? 0) > 0) && wrongForHeat(tags, opts.g, snap.heat)) return { score: -Infinity, why: [] };
    let score = 0; const why = [], add = (n, w) => { score += n; if (w && n > 0) why.push(w); };
    if (snap.mode) { if (fitsMode(tags, snap.mode, snap)) add(POINTS.modeFit, MODE_BY_ID[snap.mode].label); else add(snap.mode === 'intimate' ? POINTS.modeMissIntimate : POINTS.modeMiss); }
    // Character: whose side the song is on. The person the music follows counts most; the other one of you in the
    // scene still counts (a song about Lamb's devotion plays while following Easterman, matched to Lamb's moods).
    const chars = tags.c.map(norm), anyone = !chars.length || chars.includes('any');
    const mine = anyone ? null : chars.some(c => snap.who.includes(c)), here = anyone ? [] : chars.filter(c => snap.moodBy?.[c]);
    if (mine === true) add(POINTS.char, tags.c.find(c => snap.who.includes(norm(c))));
    else if (here.length) add(POINTS.charScene, tags.c.find(c => norm(c) === here[0]));
    else if (mine === false) add(POINTS.otherChar);
    const feel = here.length ? Object.assign({}, ...here.map(c => snap.moodBy[c]), mine ? snap.moodVal : {}) : snap.moodVal;
    const moods = tags.m.filter(id => (feel[id] ?? 0) >= 21).slice(0, POINTS.moodMax);
    for (const id of moods) add(POINTS.mood, labelOf('m', id));
    if (snap.fams[0] && tags.f.includes(snap.fams[0])) add(POINTS.family1, moods.length ? '' : labelOf('f', snap.fams[0]));
    if (snap.fams[1] && tags.f.includes(snap.fams[1])) add(POINTS.family2);
    const place = tags.p.find(id => snap.places.has(id)); if (place) add(POINTS.place, labelOf('p', place));
    // Meaning: both halves felt at once, by the person the song is about when it names one.
    const meaning = tags.cm.find(id => here.length ? here.some(c => meaningsOf(snap.moodBy[c]).has(id)) || (mine && snap.meanings.has(id)) : snap.meanings.has(id));
    if (meaning) add(POINTS.meaning, labelOf('cm', meaning));
    const moment = tags.mo.find(id => snap.moments.has(id)); if (moment) add(POINTS.moment, labelOf('mo', moment));
    const dynW = snap.story ? POINTS.dynamic * 2 : POINTS.dynamic;
    if (snap.dyn && tags.d.includes(snap.dyn)) add(dynW, labelOf('d', snap.dyn)); else if (snap.under && tags.d.includes(snap.under)) add(dynW / 2);
    // Story: a song about the two of them (tagged for both) carries a scene between them, like a love theme.
    if (snap.story && here.length + (mine ? 1 : 0) >= 2) add(POINTS.both, 'the two of them');
    if (tags.h && tags.h === snap.heat) add(POINTS.heat, labelOf('h', tags.h)); else if (tags.h && snap.heat) add(POINTS.heatNear); else if (tags.h === 'slow') add(POINTS.slowOutside);
    if (tags.e) { const d = Math.abs(tags.e - snap.energy); add(d === 0 ? POINTS.energySame : d === 1 ? POINTS.energyNear : POINTS.energyFar * (d - 1)); }
    if (tags.fav) add(POINTS.favourite);
    if (opts.recent?.has(opts.uri)) add(POINTS.recent);
    // Lyric cue: the story just said one of this song's phrases. A nudge, never a takeover, and only when the song
    // also fits this kind of scene (app/music.js keeps the cooldown).
    const cued = opts.cued?.get?.(opts.uri);
    const cueOn = Boolean(cued && (!snap.mode || fitsMode(tags, snap.mode, snap))); if (cueOn) add(POINTS.cue, `“${cued}”`);
    if (tags.th && mine === true && opts.themeOn !== 'off') {
        const appears = snap.appear.some(a => chars.includes(a)), big = (snap.moodVal[snap.top[0]] ?? 0) >= 81;
        if (appears || (opts.themeOn === 'always' ? true : big)) add(POINTS.theme, 'theme');
    }
    // Sounds like the songs you said fit this kind of scene (Spotify's genres: trip hop, dream pop…).
    if (opts.sound && opts.g?.length) {
        const best = Math.max(...opts.g.map(g => opts.sound[norm(g)] ?? 0)), worst = Math.min(...opts.g.map(g => opts.sound[norm(g)] ?? 0));
        const s = best > 0 ? Math.min(POINTS.soundMax, best * POINTS.sound) : Math.max(-POINTS.soundMax, worst * POINTS.sound);
        if (s) add(s, s > 0 ? `sounds like ${opts.g.find(g => (opts.sound[norm(g)] ?? 0) === best)}` : '');
    }
    if (opts.learn) {
        const keys = learnKeys(snap); let l = 0;
        for (const k of keys) l += opts.learn[k] ?? 0;
        if (l) add(Math.max(POINTS.notHereMin, Math.min(POINTS.fitsMax, l)), l > 0 ? 'you said it fits' : '');
    }
    return { score: Math.round(score * 10) / 10, why, cue: cueOn };
}
// songs: [{ uri, tags (merged), learn }] → best first, unplayable ones left out.
export function rank(songs, snap, opts = {}) {
    const sound = opts.sound?.[snap.mode || 'any'];
    const list = songs.map(s => ({ uri: s.uri, fits: fitsMode(s.tags, snap.mode, snap), ...scoreSong(s.tags, snap, { ...opts, uri: s.uri, learn: s.learn, g: s.g, sound }) })).filter(x => x.score > -Infinity).sort((a, b) => b.score - a.score);
    // A song the story just echoed (and that fits the scene) joins the front-runners: half a point behind the best,
    // so it's a real chance, not a certainty.
    const best = list.find(x => !x.cue)?.score;
    if (best !== undefined && list.some(x => x.cue)) { for (const x of list) if (x.cue) x.score = Math.max(x.score, Math.round((best - 0.5) * 10) / 10); list.sort((a, b) => b.score - a.score); }
    return list;
}
// One pick from the songs within a point of the best, more often the higher ones. rng is Math.random unless a test passes its own.
export function pick(ranked, rng = Math.random) {
    if (!ranked.length) return null;
    const best = ranked[0].score, near = ranked.filter(x => x.score >= best - 1).slice(0, 12);
    const weights = near.map(x => x.score - (best - 1) + 0.5), total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < near.length; i++) { r -= weights[i]; if (r <= 0) return near[i]; }
    return near.at(-1);
}
// The pick, then the best of the rest, so Spotify keeps playing fitting songs by itself.
export function lineup(ranked, first, size = LINEUP) {
    if (!first) return [];
    // Songs for the same kind of scene and close behind the pick first, so Spotify never wanders off on its own.
    const out = [first.uri, ...ranked.filter(x => x.uri !== first.uri && (x.fits || !first.fits) && x.score >= Math.max(first.score - 3, GOOD_ENOUGH)).slice(0, size - 1).map(x => x.uri)];
    // Never let the music run dry: fill up with the rest of this kind of scene's songs, best first, then go round
    // them again (a repeat beats silence). Only when no song at all fits this kind do the next best others fill in.
    const kind = ranked.filter(x => x.fits || !first.fits).map(x => x.uri);
    for (const u of kind) { if (out.length >= size) break; if (!out.includes(u)) out.push(u); }
    if (out.length < size && kind.length) for (let i = 0; out.length < size && i < size * 2; i++) { const u = kind[i % kind.length]; if (u !== out.at(-1)) out.push(u); }
    for (const x of ranked) { if (out.length >= size) break; if (!out.includes(x.uri)) out.push(x.uri); }
    return out;
}
export { GOOD_ENOUGH };

// ---- When the music changes ----
// A real shift between two snapshots. Mood families only count once they've held for two replies, which
// app/music.js handles by passing the family it has seen twice (famHeld).
export function shiftOf(before, now, famHeld = now.fams[0]) {
    if (!before) return { big: true, any: true, why: 'start' };
    const same = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
    if (before.who.join('|') !== now.who.join('|')) return { big: true, any: true, why: 'someone else' };
    if (before.mode !== now.mode) return { big: true, any: true, why: 'scene kind', mode: true };
    if (!same(before.places, now.places)) return { big: true, any: true, why: 'new place' };
    if (!same(before.moments, now.moments)) return { big: true, any: true, why: 'new moment' };
    if (before.heat !== now.heat) return { big: true, any: true, why: 'heat' };
    if (Math.abs(before.energy - now.energy) >= 2) return { big: true, any: true, why: 'energy' };
    // Story (film score): a cue holds through the scene; only a new scene (place, kind, people, heat) changes it.
    if (now.story) return { big: false, any: before.fams[0] !== now.fams[0], why: before.fams[0] !== now.fams[0] ? 'small' : '' };
    if (famHeld && before.fams[0] !== famHeld) return { big: true, any: true, why: 'feeling' };
    if (before.energy !== now.energy || before.fams[0] !== now.fams[0] || before.dyn !== now.dyn) return { big: false, any: true, why: 'small' };
    return { big: false, any: false, why: '' };
}
