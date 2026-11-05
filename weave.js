// 1.34.0: the weave line. One hidden HTML comment at the end of each reply carries what the roleplay
// model noticed about its own character this turn, so feelings, needs, relationships, meters and
// memories all update from the reply it was already writing. No tool call, no extra request.
//   <!-- weave: moods desperate -10, relieved +20 | needs hunger low | toward obsessed +5 | friendship +1 | romance +2 | trust -3 | power +2 | thinks: stubborn, his | sparked: her defiance | remember: none -->
// Older chats wrote <!-- bond: … --> (1.33.0); both are read, and both are stripped from the prompt.
const LINE = /<!--\s*(?:weave|bond)\s*:([\s\S]*?)-->/i;
const LINE_ALL = /[ \t]*<!--\s*(?:weave|bond)\s*:[\s\S]*?-->[ \t]*\n?/gi;
export const hasWeave = text => typeof text === 'string' && LINE.test(text);
export const stripWeave = text => String(text ?? '').replace(LINE_ALL, '').replace(/\s+$/, '');

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const NONE = /^(none|nothing|n\/?a|no change|no|-|—|\[.*\])\.?$/i;
const num = v => { const x = String(v ?? '').replace(/[−–]/g, '-').match(/[+-]?\s*\d+/); return x ? Math.round(Number(x[0].replace(/\s/g, ''))) : 0; };
const unquote = s => String(s ?? '').trim().replace(/^["“'‘]+|["”'’.]+$/g, '').trim();
// "she's mine to the bone" → "mine to the bone": the chips already read "Easterman thinks Lamb is…".
export const trait = s => unquote(s).replace(/^(?:(?:she|he|they|it|you)(?:['’]s|['’]re|\s+is|\s+are|\s+was)?|is|are)\s+/i, '').replace(/\s+/g, ' ').trim();
// Near-duplicates share a key: "stubborn", "Stubborn!", "so stubborn".
export const traitKey = s => trait(s).toLowerCase().replace(/^(so|very|really|too)\s+/, '').replace(/[^a-z0-9' ]/g, '').trim();
const list = (v, max, len) => NONE.test(String(v ?? '').trim()) ? [] : String(v ?? '').split(/[,;]/).map(unquote).filter(s => s && !NONE.test(s) && s.length <= len).slice(0, max);
// "desperate -10, Clingy / needy +5" → [{ name, delta }]. Entries without a number are skipped.
function changes(v, max = 5) {
    if (NONE.test(String(v ?? '').trim())) return [];
    return String(v ?? '').split(/[,;]/).map(part => {
        const m = part.trim().replace(/[−–]/g, '-').match(/^(.+?)\s*([+-]\s*\d+|\boff|\bgone)\s*$/i);
        // "afraid off" ends a feeling outright: the model only sees strength words, not numbers.
        return m ? { name: unquote(m[1]).toLowerCase(), delta: /off|gone/i.test(m[2]) ? -100 : clamp(num(m[2]), -30, 30) } : null;
    }).filter(x => x && x.name && x.delta).slice(0, max);
}
export const NEED_WORDS = { critical: 10, low: 30, okay: 55, ok: 55, fine: 85, full: 95, met: 90 };
const NEED_NAMES = ['hunger', 'energy', 'bladder', 'hygiene', 'comfort', 'social', 'fun', 'health'];
// "hunger low, energy critical" → { hunger: 30, energy: 10 }
function needs(v) {
    const out = {};
    for (const part of NONE.test(String(v ?? '').trim()) ? [] : String(v ?? '').split(/[,;]/)) {
        const m = part.trim().toLowerCase().match(/^([a-z]+)\s*:?\s*(critical|low|okay|ok|fine|full|met|\d{1,3})\b/);
        if (m && NEED_NAMES.includes(m[1])) out[m[1]] = /\d/.test(m[2]) ? clamp(Number(m[2]), 0, 100) : NEED_WORDS[m[2]];
    }
    return out;
}
// "her defiance, her crying (off)" → [{ text, off }]
const sparks = v => list(v, 3, 60).map(s => ({ text: s.replace(/\s*\((?:off|turn-?off)\)\s*$/i, '').trim(), off: /\((?:off|turn-?off)\)\s*$/i.test(s) })).filter(s => s.text);
const FIELDS = /^(moods?|feelings|needs|toward|friendship|romance|trust|control|power|pull|feels|thinks|sparked|sparks|remember)\b\s*:?\s*([\s\S]*)$/i;
// Fields are split on "|" and read by name, so a missing field or a different order still works.
export function parseWeave(mes) {
    const m = LINE.exec(String(mes ?? '')); if (!m) return null;
    const f = {};
    for (const part of m[1].split('|')) {
        const x = part.trim().match(FIELDS); if (!x) continue;
        const key = x[1].toLowerCase().replace(/^(mood|feelings)$/, 'moods').replace(/^sparks$/, 'sparked');
        f[key] ??= x[2].trim();
    }
    const remember = unquote(f.remember ?? '');
    // "toward" without numbers ("devoted, wary") is read like the old "feels" words.
    const toward = changes(f.toward, 3), feels = list(f.feels, 3, 40);
    if (!toward.length && f.toward && !feels.length) feels.push(...list(f.toward, 3, 40));
    return {
        f: clamp(num(f.friendship), -10, 10), r: clamp(num(f.romance), -10, 10), t: clamp(num(f.trust), -10, 10), p: clamp(num(f.power), -10, 10),
        hasTrust: 'trust' in f, hasPower: 'control' in f || 'power' in f, pRaw: f.control ?? f.power ?? '', lRaw: f.pull ?? '',
        moods: changes(f.moods, 5), hasMoods: 'moods' in f, needs: needs(f.needs), toward, feels,
        thinks: list(f.thinks, 3, 60).map(trait).filter(t => t && t.split(' ').length <= 4),
        sparked: sparks(f.sparked),
        remember: !remember || NONE.test(remember) ? '' : remember.slice(0, 160),
    };
}

// 1.34.1: power names who gained it ("power Lamb +3"), so the direction can't be read backwards.
// A bare signed number from older lines still works: + toward the character, - toward the player.
export function powerChange(raw, charName = '', userName = '') {
    const text = String(raw ?? '').toLowerCase(), size = Math.abs(num(text));
    const names = name => String(name).toLowerCase().split(/\s+/).filter(w => w.length > 2 && !['doctor', 'the', 'mr', 'mrs', 'miss', 'mother', 'father'].includes(w));
    const has = name => names(name).some(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
    if (!size || /\b(even|none|steady|no change)\b/.test(text) && !/\d/.test(text)) return 0;
    if (has(userName) && !has(charName)) return -clamp(size, 0, 10);
    if (has(charName)) return clamp(size, 0, 10);
    return clamp(num(text), -10, 10);
}

// What the line asks for. Opus 5.5 follows a filled-in example more reliably than a template of
// brackets, and it follows instructions literally, so unchanged fields are left out instead of being
// asked for every reply (which invites small invented changes). Values only, never reasons: asking a
// thinking model to write its reasoning into the reply can be refused.
// opts: { n, u, bond, extra (trust & power), moods (feelings, needs, relationship), remember }
export function weavePrompt({ n, u, bond = true, extra = true, moods = true, remember = true }) {
    if (!bond && !moods && !remember) return [];
    const example = [
        ...(moods ? ['moods relieved +15, afraid off', 'needs hunger low', 'toward protective +5'] : []),
        ...(bond ? ['romance +2', ...(extra ? ['trust -1', `control ${n} +1`, `pull ${u} +2`] : []), 'thinks: stubborn', `sparked: ${u}'s defiance`] : []),
        ...(remember ? [`remember: ${u} promised to stay`] : []),
    ];
    return [
        `End every reply with one hidden line that only Moodweaver reads, listing what this reply changed for ${n}. Leave out anything that didn't change; if nothing did, write <!-- weave: none -->. This example shows the shape only, so report this reply's own changes:`,
        `<!-- weave: ${example.join(' | ')} -->`,
        ...(moods ? [`- moods: ${n}'s own feelings that rose or fell, by the names in these notes or a plain feeling word, -30 to +30, or off when one is over (afraid off).`,
            `- needs: hunger, energy, bladder, hygiene, comfort, social, fun or health, each critical, low, okay or fine.`,
            `- toward: ${n}'s feelings about ${u} that moved, by name (obsessed, protective, distrusts), -30 to +30.`] : []),
        ...(bond ? [`- friendship, romance${extra ? ', trust' : ''}: -10 to +10; 1 to 3 for ordinary moments, more only for turning points. Friendship is liking and loyalty, romance is desire and love${extra ? `, trust is believing and relying on ${u}` : ''}.`,
            ...(extra ? [`- control: who gained real control this reply (doors, money, freedom, who decides what happens), 1 to 10, as ${n} +3 or ${u} +3.`,
                `- pull: who gained emotional hold (who needs whom more, who gives way), the same way. Control and pull can move opposite ways in one reply: ${u} can win a demand while ${n} still holds every key.`] : []),
            `- thinks: words that finish "${n} thinks ${u} is…" (stubborn, his, a liar).`,
            `- sparked: something ${u} did that hit one of ${n}'s turn-ons or turn-offs, from these notes or the card; add (off) for a turn-off.`] : []),
        ...(remember ? [`- remember: a turning point between them, in one plain line: a confession, promise, betrayal, first time or secret learned.`] : []),
    ];
}

// Applies ±changes so a swipe or edit of the same reply replaces its own effect instead of stacking.
// target: { get(id), set(id, value), pinned(id) }. resolve(name, delta) → id or null.
// ledger: { index, sig, before, after } for the reply applied last. A value the player moved since
// then is theirs and isn't reverted; pinned values are never touched.
export function applyChanges(target, ledger = {}, index, list = [], resolve) {
    const sig = JSON.stringify(list);
    if (ledger.index === index && ledger.sig === sig) return { changed: [], ledger };
    const changed = [];
    // The same reply swiped or edited, or the newest reply deleted: undo what it did first.
    if (ledger.index !== undefined && ledger.index >= index) for (const [id, before] of Object.entries(ledger.before ?? {})) {
        if (target.pinned(id) || target.get(id) !== ledger.after?.[id]) continue;
        target.set(id, before); changed.push(id);
    }
    const next = { index, sig, before: {}, after: {} };
    // An older reply that's newest again (the newer one was deleted) was applied when it arrived.
    if (ledger.index !== undefined && ledger.index > index) return { changed, ledger: next };
    for (const { name, delta } of list) {
        const id = resolve(name, delta); if (!id || target.pinned(id) || id in next.before) continue;
        const old = target.get(id) ?? 0, value = clamp(old + (old === 0 && delta > 0 ? Math.max(delta, 10) : delta), 0, 100);
        if (value === old) continue;
        next.before[id] = old; next.after[id] = value; target.set(id, value);
        if (!changed.includes(id)) changed.push(id);
    }
    return { changed, ledger: next };
}
