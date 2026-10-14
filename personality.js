// Optional writing lenses, not assessments. Good/bad side are how the type comes out in fiction,
// not extra MBTI types or claims that a type makes someone good or bad.
// Under pressure: how each type tends to crack, so coping shows in the story rather than the label.
const MBTI_STRESS = {"ISTJ": "catastrophises and imagines everything going wrong", "ISFJ": "spirals into worst-case thinking and frets", "INFJ": "overindulges in food, sex or spending, or snaps at people", "INTJ": "turns reckless and chases sensation to escape", "ISTP": "gets oddly emotional and touchy about how others see them", "ISFP": "turns harsh, bossy and critical", "INFP": "turns cold and nitpicks everything", "INTP": "gets hypersensitive and takes rejection hard", "ESTP": "gets paranoid and reads dark meaning into everything", "ESFP": "imagines bleak futures and gets suspicious", "ENFP": "fixates on small details and withdraws", "ENTP": "fixates on small worries and aches and withdraws", "ESTJ": "feels unloved and overreacts emotionally", "ESFJ": "goes coldly critical and nitpicky", "ENFJ": "turns cold, blunt and harshly critical", "ENTJ": "feels unappreciated and overreacts emotionally"};
export const PERSONALITY_TYPES = [
    ['ISTJ', 'Practical planner', 'introverted, detail-focused, logic-led and likes structure', 'dependable, thorough and fair', 'rigid, fault-finding and resistant to change'],
    ['ISFJ', 'Quiet supporter', 'introverted, detail-focused, values-led and likes structure', 'attentive, loyal and considerate', 'self-effacing, overprotective and quietly resentful'],
    ['INFJ', 'Reflective idealist', 'introverted, big-picture, values-led and likes structure', 'insightful, principled and encouraging', 'self-righteous, secretive and sure they know what others need'],
    ['INTJ', 'Independent strategist', 'introverted, big-picture, logic-led and likes structure', 'far-sighted, independent and willing to improve a plan', 'dismissive, controlling and convinced their plan is best'],
    ['ISTP', 'Hands-on problem solver', 'introverted, detail-focused, logic-led and goes with the flow', 'resourceful, calm and quick to find a practical fix', 'detached, reckless and impatient with other people’s needs'],
    ['ISFP', 'Quiet individualist', 'introverted, detail-focused, values-led and goes with the flow', 'gentle, observant and true to their values', 'avoidant, touchy and ruled by the feeling of the moment'],
    ['INFP', 'Imaginative idealist', 'introverted, big-picture, values-led and goes with the flow', 'empathetic, imaginative and open to other ways of living', 'escapist, self-absorbed and disappointed that reality won’t match the ideal'],
    ['INTP', 'Curious analyst', 'introverted, big-picture, logic-led and goes with the flow', 'inventive, questioning and honest about what they don’t know', 'pedantic, emotionally distant and stuck analysing instead of acting'],
    ['ESTP', 'Bold improviser', 'outgoing, detail-focused, logic-led and goes with the flow', 'alert, direct and good at thinking on their feet', 'impulsive, domineering and chasing the next thrill'],
    ['ESFP', 'Expressive enthusiast', 'outgoing, detail-focused, values-led and goes with the flow', 'warm, lively and quick to include people', 'attention-hungry, impulsive and unwilling to face consequences'],
    ['ENFP', 'Possibility chaser', 'outgoing, big-picture, values-led and goes with the flow', 'curious, encouraging and good at seeing potential', 'scattered, approval-seeking and quick to abandon commitments'],
    ['ENTP', 'Restless challenger', 'outgoing, big-picture, logic-led and goes with the flow', 'inventive, quick-witted and willing to question assumptions', 'argumentative, opportunistic and treating people like puzzles to win'],
    ['ESTJ', 'Direct organiser', 'outgoing, detail-focused, logic-led and likes structure', 'decisive, reliable and clear about responsibilities', 'bossy, inflexible and judging everyone by their own standards'],
    ['ESFJ', 'Social caretaker', 'outgoing, detail-focused, values-led and likes structure', 'welcoming, dependable and attentive to what people need', 'intrusive, approval-hungry and policing how others should behave'],
    ['ENFJ', 'People-focused guide', 'outgoing, big-picture, values-led and likes structure', 'encouraging, perceptive and good at bringing people together', 'controlling, image-conscious and managing people for their own idea of harmony'],
    ['ENTJ', 'Driven organiser', 'outgoing, big-picture, logic-led and likes structure', 'decisive, strategic and good at turning plans into action', 'ruthless, impatient and treating people as obstacles or resources'],
].map(([id, label, core, positive, negative]) => ({ id, label, core, positive, negative, stress: MBTI_STRESS[id] }));
export const PERSONALITY_BY_ID = Object.fromEntries(PERSONALITY_TYPES.map(t => [t.id, t]));
// wing: the flavour a type lends as someone's wing. stress: how they cope when things go wrong.
const ENNEAGRAM_EXTRA = {
    1: { wing: 'a principled, self-controlled streak', stress: 'gets rigid, critical and quietly resentful; copes by fixing and controlling things' },
    2: { wing: 'a warm, people-pleasing streak', stress: 'gets demanding and hurt at being unappreciated; copes by doing even more for others' },
    3: { wing: 'a polished, image-aware streak', stress: 'goes numb and detached; copes by working harder and polishing the image' },
    4: { wing: 'a moody, individualistic streak', stress: 'clings and fishes for reassurance; copes by sinking into their feelings' },
    5: { wing: 'a private, cerebral streak', stress: 'gets scattered and restless; copes by retreating into their head' },
    6: { wing: 'a loyal, wary streak', stress: 'gets defensive and blaming; copes by seeking reassurance or bracing for betrayal' },
    7: { wing: 'a restless, fun-seeking streak', stress: 'gets critical and picky; copes by distracting themselves with the next thrill' },
    8: { wing: 'a forceful, blunt streak', stress: 'withdraws and broods; copes by taking control and pushing harder' },
    9: { wing: 'an easygoing, conflict-avoiding streak', stress: 'gets anxious and stubborn; copes by numbing out and going along with things' },
};
export const ENNEAGRAM_TYPES = [
    [
        "1",
        "Reformer",
        "needs to live up to their standards",
        "fair, responsible and willing to improve things",
        "critical, resentful and unable to forgive mistakes"
    ],
    [
        "2",
        "Helper",
        "needs to feel wanted through what they give",
        "generous, attentive and able to accept care",
        "intrusive, possessive and making help into a debt"
    ],
    [
        "3",
        "Achiever",
        "needs to feel valuable through success",
        "capable, motivating and honest about effort",
        "image-led, competitive and hiding anything that looks like failure"
    ],
    [
        "4",
        "Individualist",
        "needs a life that feels personally meaningful",
        "emotionally honest, creative and sensitive to nuance",
        "envious, self-absorbed and attached to feeling misunderstood"
    ],
    [
        "5",
        "Investigator",
        "needs understanding and enough space to cope",
        "insightful, independent and generous with knowledge",
        "withdrawn, hoarding time and analysing instead of engaging"
    ],
    [
        "6",
        "Loyalist",
        "needs trust and something dependable to stand on",
        "loyal, questioning and brave despite doubt",
        "suspicious, second-guessing and testing people for betrayal"
    ],
    [
        "7",
        "Enthusiast",
        "needs freedom and possibilities to look forward to",
        "inventive, enthusiastic and able to enjoy the present",
        "scattered, overindulgent and escaping uncomfortable feelings"
    ],
    [
        "8",
        "Challenger",
        "needs control of their own life",
        "direct, protective and willing to share power",
        "domineering, confrontational and treating vulnerability as defeat"
    ],
    [
        "9",
        "Peacemaker",
        "needs inner peace and connection",
        "receptive, steady and able to bridge differences",
        "avoidant, stubbornly passive and losing touch with their own wants"
    ]
].map(([id, label, core, positive, negative]) => ({ id, label, core, positive, negative, ...ENNEAGRAM_EXTRA[id] }));
export const ENNEAGRAM_BY_ID = Object.fromEntries(ENNEAGRAM_TYPES.map(t => [t.id, t]));
export const PERSONALITY_EXPRESSIONS = ['balanced', 'positive', 'negative'];
function cleanType(value, catalogue) {
    return {
        enabled: value?.enabled === true,
        type: catalogue[value?.type] ? String(value.type) : '',
        expression: PERSONALITY_EXPRESSIONS.includes(value?.expression) ? value.expression : 'balanced',
        strength: Math.round(Math.max(0, Math.min(100, Number.isFinite(Number(value?.strength)) ? Number(value.strength) : 50))),
    };
}
export const cleanPersonality = (value = {}) => cleanType(value, PERSONALITY_BY_ID);
// A wing is one of the two neighbouring types: 3w2 or 3w4, 9w8 or 9w1.
export const wingsOf = type => type ? [String(((Number(type) + 7) % 9) + 1), String((Number(type) % 9) + 1)] : [];
export const cleanEnneagram = (value = {}) => {
    const p = cleanType(value, ENNEAGRAM_BY_ID);
    return { ...p, wing: wingsOf(p.type).includes(String(value?.wing)) ? String(value.wing) : '' };
};
export const enneagramName = p => p.type ? `${p.type}${p.wing ? `w${p.wing}` : ''}` : '';
export function activePersonalities(state) {
    if (!state?.enabled) return [];
    return [{ ...cleanPersonality(state.personality), system: 'personality' }, { ...cleanEnneagram(state.enneagram), system: 'enneagram' }]
        .filter(p => p.enabled && p.type && p.strength > 0);
}
export function activePersonality(state) { return activePersonalities(state)[0] ?? null; }
// One line per type, no labels: what drives them, which side shows, and how they crack under pressure.
// opts.isPlayer: the player's own character, so it's about how they come across, not what to make them do.
export function personalityCue(p) {
    const en = p.system === 'enneagram', t = (en ? ENNEAGRAM_BY_ID : PERSONALITY_BY_ID)[p.type];
    if (!t) return '';
    const side = p.expression === 'balanced' ? `good side: ${t.positive}; bad side: ${t.negative}`
        : p.expression === 'positive' ? `mostly their good side: ${t.positive}` : `mostly their bad side: ${t.negative}`;
    const wing = en && p.wing && ENNEAGRAM_BY_ID[p.wing] ? `, with ${ENNEAGRAM_BY_ID[p.wing].wing}` : '';
    return `${en ? `Enneagram ${enneagramName(p)}` : t.id}: ${t.core}${wing}; ${side}; under pressure ${t.stress}`;
}
