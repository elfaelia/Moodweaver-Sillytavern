// Small helpers used everywhere.


export const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Number.isFinite(Number(v)) ? Number(v) : min));
export const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const text = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
// Full name in headings, a short name everywhere else so the notes don't read like a form.
const TITLES = new Set(['the', 'a', 'an', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'miss', 'dr', 'dr.', 'doctor', 'prof', 'prof.', 'professor', 'sir', 'lady', 'lord', 'madam', 'master', 'mistress',
    'father', 'mother', 'sister', 'brother', 'uncle', 'aunt', 'captain', 'officer', 'detective', 'agent', 'nurse', 'sergeant', 'judge', 'reverend', 'king', 'queen', 'prince', 'princess', 'count', 'countess', 'duke', 'baron']);
export const shortName = full => {
    const words = String(full).trim().split(/\s+/), first = words[0] ?? '';
    if (!TITLES.has(first.toLowerCase())) return first;
    return words.length > 2 ? `${first} ${words.at(-1)}` : words.join(' ');
};
