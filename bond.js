// 1.33.0: Sims-style bond meters between a character and the player's character.
// The roleplay model ends each reply with one hidden HTML comment (SillyTavern hides comments in chat):
//   <!-- bond: friendship +2 | romance 0 | feels: wary, drawn | thinks: brave, hiding something -->
// Moodweaver reads it, strips old ones from the prompt so they never pile up, and keeps the totals.
// No extra request is ever made.
export const BOND_RE = /<!--\s*bond:([\s\S]*?)-->/i;
const BOND_RE_ALL = /[ \t]*<!--\s*bond:[\s\S]*?-->[ \t]*\n?/gi;
export const stripBond = text => String(text ?? '').replace(BOND_RE_ALL, '').replace(/\s+$/, '');
export const hasBond = text => typeof text === 'string' && BOND_RE.test(text);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const NONE = /^(none|nothing|n\/?a|-|—|\[.*\])$/i;
export function parseBond(mes) {
    const m = BOND_RE.exec(String(mes ?? '')); if (!m) return null;
    const parts = Object.fromEntries(m[1].split(/[|;\n]/).map(p => p.trim()).filter(Boolean)
        .map(p => { const x = p.match(/^(friendship|romance|feels|thinks)\s*:?\s*(.*)$/i); return x ? [x[1].toLowerCase(), x[2].trim()] : null; }).filter(Boolean));
    const num = v => { const x = String(v ?? '').replace(/[−–]/g, '-').match(/[+-]?\s*\d+/); return x ? clamp(Math.round(Number(x[0].replace(/\s/g, ''))), -10, 10) : 0; };
    const list = v => String(v ?? '').split(',').map(s => s.trim().replace(/^["“']|["”'.]$/g, '')).filter(s => s && !NONE.test(s) && s.length <= 40).slice(0, 3);
    return { f: num(parts.friendship), r: num(parts.romance), feels: list(parts.feels), thinks: list(parts.thinks) };
}

export const FRIEND_LEVELS = [[80, 'Best friends'], [50, 'Good friends'], [20, 'Friends'], [-19, 'Acquaintances'], [-59, 'Disliked'], [-100, 'Enemies']];
export const ROMANCE_LEVELS = [[80, 'Soulmates'], [55, 'In love'], [30, 'Sweethearts'], [10, 'A spark'], [-19, 'No spark'], [-59, 'Turned off'], [-100, 'Repulsed']];
export const levelOf = (levels, v) => levels.find(([min]) => v >= min)?.[1] ?? levels.at(-1)[1];

export function cleanBond(raw = {}, on = true) {
    const b = raw && typeof raw === 'object' ? raw : {};
    const n = v => clamp(Math.round(Number(v) || 0), -100, 100);
    const pin = v => v === null || v === undefined || v === '' ? null : n(v);
    const text = (v, max = 40) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
    const steps = {};
    for (const [i, s] of Object.entries(b.steps ?? {})) if (/^\d+$/.test(i) && s && typeof s === 'object')
        steps[i] = { f: clamp(Math.round(Number(s.f) || 0), -10, 10), r: clamp(Math.round(Number(s.r) || 0), -10, 10), thinks: (Array.isArray(s.thinks) ? s.thinks : []).map(t => text(t)).filter(Boolean).slice(0, 3) };
    const keep = Object.keys(steps).map(Number).sort((a, c) => c - a).slice(0, 120);
    return {
        on: typeof b.on === 'boolean' ? b.on : on,
        base: { f: n(b.base?.f), r: n(b.base?.r) },
        pins: { f: pin(b.pins?.f), r: pin(b.pins?.r) },
        steps: Object.fromEntries(keep.map(i => [i, steps[i]])),
        muted: [...new Set((b.muted ?? []).map(t => text(t).toLowerCase()).filter(Boolean))].slice(0, 30),
        own: [...new Set((b.own ?? []).map(t => text(t)).filter(Boolean))].slice(0, 6),
    };
}
// Totals come from the steps of replies that still exist, so swipes, edits and deletions just work.
export function computeBond(bond, chatLength = Infinity) {
    const steps = Object.entries(bond.steps).map(([i, s]) => [Number(i), s]).filter(([i]) => i < chatLength).sort((a, c) => a[0] - c[0]);
    const total = key => clamp(bond.base[key] + steps.reduce((sum, [, s]) => sum + s[key], 0), -100, 100);
    const f = bond.pins.f ?? total('f'), r = bond.pins.r ?? total('r');
    // Opinions strengthen when repeated and fade when they stop coming up.
    const seen = new Map();
    for (const [, s] of steps) {
        for (const [k, v] of seen) seen.set(k, { ...v, value: v.value - 8 });
        for (const t of s.thinks) { const k = t.toLowerCase(), old = seen.get(k); seen.set(k, { text: t, value: old && old.value > 0 ? Math.min(100, old.value + 20) : 55 }); }
    }
    const thinks = [...bond.own.map(t => ({ text: t, value: 70, own: true })),
        ...[...seen.values()].filter(t => t.value > 0 && !bond.muted.includes(t.text.toLowerCase()) && !bond.own.some(o => o.toLowerCase() === t.text.toLowerCase())).sort((a, c) => c.value - a.value)]
        .slice(0, 6);
    const recent = steps.slice(-5).reverse().map(([i, s]) => ({ index: i, f: s.f, r: s.r }));
    return { f, r, thinks, recent, friend: levelOf(FRIEND_LEVELS, f), romance: levelOf(ROMANCE_LEVELS, r) };
}
// Dragging a meter sets where it stands now; later replies move it from there.
export function setMeter(bond, key, value, chatLength = Infinity) {
    const v = clamp(Math.round(Number(value) || 0), -100, 100);
    const sum = Object.entries(bond.steps).filter(([i]) => Number(i) < chatLength).reduce((s, [, st]) => s + st[key], 0);
    bond.base[key] = clamp(v - sum, -300, 300);
    if (bond.pins[key] !== null) bond.pins[key] = v;
}

const pt = v => String(v ?? '').replace(/</g, '‹').replace(/>/g, '›');
export function bondPromptLines({ bond, n, u, chatLength }) {
    if (!bond?.on) return [];
    const { f, r, thinks, friend, romance } = computeBond(bond, chatLength);
    return [
        `Bond, built up over the whole chat: how ${n} feels about ${u}. Friendship ${f} of 100 (${friend.toLowerCase()}); romance ${r} of 100 (${romance.toLowerCase()}).${thinks.length ? ` What ${n} thinks of ${u}: ${thinks.map(t => pt(t.text)).join(', ')}.` : ''} Let these shape how ${n} treats ${u} alongside the settings above; below zero means dislike or aversion.`,
        `After the reply's last line, add one hidden line in exactly this form: <!-- bond: friendship [change] | romance [change] | feels: [1–3 words] | thinks: [1–3 opinions] -->. Each change is how much this reply moved ${n}'s feelings toward ${u}, from -10 to +10: 0 when nothing shifted, 1 to 3 for ordinary moments, more only for turning points, and negative when things go badly. feels is how ${n} feels toward ${u} right now; thinks is what ${n} believes about ${u}. The player never sees this line, so it isn't part of the story.`,
    ];
}
