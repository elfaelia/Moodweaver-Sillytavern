// Matching a dynamic named in the story's wording. The built-in list is in data/catalogue/dynamics.js.
export { DYNAMIC_GROUPS, ROLE_HOMES } from '../data/catalogue/dynamics.js';

export const fill = (text, n, u) => String(text).replaceAll('{n}', n).replaceAll('{u}', u).replaceAll('{{char}}', n).replaceAll('{{user}}', u);
const norm = s => String(s ?? '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['and', 'the', 'of', 'to', 'on', 'for', 'a', 'an', 'with', 'their', 'them', 'they', 'is', 'in', 'it']);
// The story's own words for the dynamic, matched to a name: the exact name first, then the best overlap
// with names and matching words. rows: [name, test, cue, group, keys]. Returns the row or null.
export function matchDynamic(text, rows, n = '', u = '') {
    const t = norm(text); if (!t) return null;
    const named = rows.find(r => norm(fill(r[0], n, u)) === t || norm(r[0].replace(/\s*\(.*?\)/g, '')) === t);
    if (named) return named;
    const words = t.split(' ').filter(w => w.length > 2 && !STOP.has(w));
    if (!words.length) return null;
    const stem = w => w.replace(/(ing|ed|es|s)$/, '');
    let best = null, score = 0;
    for (const r of rows) {
        const pool = new Set(`${norm(fill(r[0], n, u))} ${norm(r[4] ?? '')}`.split(' ').filter(w => w.length > 2 && !STOP.has(w)).map(stem));
        const hit = words.filter(w => pool.has(stem(w))).length, s = hit / words.length;
        if (hit && s > score) { best = r; score = s; }
    }
    return score >= 0.5 ? best : null;
}
