// Optional writing lenses, not assessments. Positive/negative are fictional expressions,
// not extra MBTI types or claims that a type makes someone good or bad.
export const PERSONALITY_TYPES = [
    ['ISTJ', 'Practical planner', 'private, concrete, logical and organised', 'dependable, thorough and fair', 'rigid, fault-finding and resistant to change'],
    ['ISFJ', 'Quiet supporter', 'private, concrete, people-minded and organised', 'attentive, loyal and considerate', 'self-effacing, overprotective and quietly resentful'],
    ['INFJ', 'Reflective idealist', 'private, pattern-minded, people-minded and organised', 'insightful, principled and encouraging', 'self-righteous, secretive and sure they know what others need'],
    ['INTJ', 'Independent strategist', 'private, pattern-minded, logical and organised', 'far-sighted, independent and willing to improve a plan', 'dismissive, controlling and convinced their plan is best'],
    ['ISTP', 'Hands-on problem solver', 'private, concrete, logical and adaptable', 'resourceful, calm and quick to find a practical fix', 'detached, reckless and impatient with other people’s needs'],
    ['ISFP', 'Quiet individualist', 'private, concrete, people-minded and adaptable', 'gentle, observant and true to their values', 'avoidant, touchy and ruled by the feeling of the moment'],
    ['INFP', 'Imaginative idealist', 'private, possibility-minded, people-minded and adaptable', 'empathetic, imaginative and open to other ways of living', 'escapist, self-absorbed and disappointed that reality won’t match the ideal'],
    ['INTP', 'Curious analyst', 'private, possibility-minded, logical and adaptable', 'inventive, questioning and honest about what they don’t know', 'pedantic, emotionally distant and stuck analysing instead of acting'],
    ['ESTP', 'Bold improviser', 'outgoing, concrete, logical and adaptable', 'alert, direct and good at thinking on their feet', 'impulsive, domineering and chasing the next thrill'],
    ['ESFP', 'Expressive enthusiast', 'outgoing, concrete, people-minded and adaptable', 'warm, lively and quick to include people', 'attention-hungry, impulsive and unwilling to face consequences'],
    ['ENFP', 'Possibility chaser', 'outgoing, possibility-minded, people-minded and adaptable', 'curious, encouraging and good at seeing potential', 'scattered, approval-seeking and quick to abandon commitments'],
    ['ENTP', 'Restless challenger', 'outgoing, possibility-minded, logical and adaptable', 'inventive, quick-witted and willing to question assumptions', 'argumentative, opportunistic and treating people like puzzles to win'],
    ['ESTJ', 'Direct organiser', 'outgoing, concrete, logical and organised', 'decisive, reliable and clear about responsibilities', 'bossy, inflexible and judging everyone by their own standards'],
    ['ESFJ', 'Social caretaker', 'outgoing, concrete, people-minded and organised', 'welcoming, dependable and attentive to what people need', 'intrusive, approval-hungry and policing how others should behave'],
    ['ENFJ', 'People-focused guide', 'outgoing, pattern-minded, people-minded and organised', 'encouraging, perceptive and good at bringing people together', 'controlling, image-conscious and managing people for their own idea of harmony'],
    ['ENTJ', 'Driven organiser', 'outgoing, pattern-minded, logical and organised', 'decisive, strategic and good at turning plans into action', 'ruthless, impatient and treating people as obstacles or resources'],
].map(([id, label, core, positive, negative]) => ({ id, label, core, positive, negative }));
export const PERSONALITY_BY_ID = Object.fromEntries(PERSONALITY_TYPES.map(t => [t.id, t]));
export const PERSONALITY_EXPRESSIONS = ['balanced', 'positive', 'negative'];
export function cleanPersonality(value = {}) {
    return {
        enabled: value?.enabled === true,
        type: PERSONALITY_BY_ID[value?.type] ? value.type : '',
        expression: PERSONALITY_EXPRESSIONS.includes(value?.expression) ? value.expression : 'balanced',
        strength: Math.round(Math.max(0, Math.min(100, Number.isFinite(Number(value?.strength)) ? Number(value.strength) : 50))),
    };
}
export function activePersonality(state) {
    const p = cleanPersonality(state?.personality);
    return state?.enabled && p.enabled && p.type && p.strength > 0 ? p : null;
}
export function personalityCue(p) {
    const t = PERSONALITY_BY_ID[p.type];
    if (!t) return '';
    const expression = p.expression === 'balanced' ? `strengths: ${t.positive}; flaws: ${t.negative}` : `${p.expression} expression: ${t[p.expression]}`;
    return `${t.id}, ${t.core}; ${expression}`;
}
