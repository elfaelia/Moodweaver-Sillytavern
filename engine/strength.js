// One strength scale for everything: the tier names on the sliders and what each tier means.


export const level = v => v <= 0 ? 'Off' : tierOf(v).name;
// Strength words match the sliders. Numbers never reach the roleplay model; each band gets
// one plain line saying how much a feeling at that strength actually does.
// One strength scale for everything, worded so it works for feelings, facts, the player's character and the story alike.
export const TIERS = [
    { min: 100, name: 'Maximum', text: 'full force in nearly every line, through words, body and choices, taken as far as it goes. Other maximums run at full force beside it, fused, not taking turns or watering each other down' },
    { min: 91, name: 'Overwhelming', text: 'dominates their voice and the main action; they can barely act against it, and the scene is changed by it' },
    { min: 81, name: 'Intense', text: 'shows in most of what they say, do and think, and decides where the scene goes' },
    { min: 61, name: 'Strong', text: 'shows several times and decides at least one real choice' },
    { min: 41, name: 'Clear', text: 'shows plainly at least once and shapes something they say or do' },
    { min: 21, name: 'Mild', text: 'a light, steady tint: it changes how things are said and noticed more than what happens' },
    { min: 11, name: 'Subtle', text: 'one small tell or passing thought' },
    { min: 1, name: 'Faint', text: 'a flicker at most; it can stay unseen' },
];
export const tierOf = (v, tiers = TIERS) => tiers.find(t => v >= t.min) ?? null;
