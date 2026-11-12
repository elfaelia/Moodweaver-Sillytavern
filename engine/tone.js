// The plumbob's colour: what the leading feelings look like at a glance, Sims-style.
// Each moodlet family has a tone. The strongest moodlet lights the top facets, the next strongest of
// another family shades the lower ones, and the glow grows with strength. Pure and cheap: it only reads
// the values already in memory.
import { BY_ID, sectionOf } from '../data/catalogue.js';

export const TONES = {
    happy: '#6fdc8c', bold: '#f2c45a', closeness: '#ff8fb8', attachment: '#b98cff', cold: '#8fcbff', sad: '#6f9bff',
    scared: '#9b8cff', angry: '#ff7a52', cruel: '#e8455e', calm: '#4fd6c2', masks: '#cdd5e6', energy: '#c9bfe8',
    headspace: '#c59cff', desire: '#ff6fcf',
};
export const RESTING = '#7fd18a';
// state.moods → { lead, shade, glow } colours plus the lead's id and strength. Nothing set: the resting green.
export function moodTone(moods = {}) {
    let first = null, second = null;
    for (const [id, v] of Object.entries(moods ?? {})) {
        if (!(v > 0)) continue;
        const m = BY_ID[id]; if (!m || sectionOf(m) !== 'mood' || !TONES[m.category]) continue;
        if (!first || v > first.v) { if (first && first.m.category !== m.category) second = first; first = { m, v }; }
        else if (m.category !== first.m.category && (!second || v > second.v)) second = { m, v };
    }
    if (!first) return { lead: RESTING, shade: RESTING, strength: 0, id: '' };
    return { lead: TONES[first.m.category], shade: second && second.v >= 21 ? TONES[second.m.category] : TONES[first.m.category], strength: first.v, id: first.m.id };
}
