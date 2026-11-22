// Echoes: how feelings carry past their moment, as one or two plain lines in the note.
//   Aftermath: a strong feeling that has just ended leaves a wake for a reply or two (fear leaves shaking hands,
//     rage leaves a short fuse). Only the kinds that would: amusement or boredom simply stop.
//   Contagion: the player's feeling, as the hidden line read it, rubs off on the character, but only when the
//     character has the empathy for it and nothing in the moment shuts it out. A cold or cruel character doesn't
//     catch her fear at all; the dynamic and their own moods decide what they make of it instead.
import { BY_ID, sectionOf } from '../data/catalogue.js';

const pt = v => String(v ?? '').replace(/</g, '\u2039').replace(/>/g, '\u203a');
const lower = m => m.label.split('/')[0].trim().toLowerCase();

// What each kind of feeling leaves behind once it's gone. Kinds that leave nothing aren't listed.
const WAKE = {
    scared: 'an adrenaline crash: unsteady hands, a dry mouth, startling at small sounds, and wanting company, a drink or a locked door',
    angry: 'the shakes of spent adrenaline, a short fuse for a while, and pride or embarrassment about how far it went',
    sad: 'heavy tiredness, swollen eyes or a tight throat, quiet, and being easy to set off again',
    desire: 'a body that still remembers it: warm skin, slower breathing, and a new awareness of the other person',
    cruel: 'a strange calm afterwards: satisfaction, emptiness or a flicker of something like regret, whichever fits who they are',
};
// Feelings in those kinds too light to leave a wake.
const LIGHT = new Set(['butterflies', 'jumpy', 'grumpy', 'huffy', 'indignant', 'mopey', 'snarky', 'petty', 'nitpicking', 'checking_out', 'teasing_cruelly']);
const AFTER_REPLIES = 2, WAS_STRONG = 61, DROP = 30;

// records: the applied records for this chat, newest last ({ m: { id: [before, after] } }). st: the character now.
export function aftermathLines(records = [], st, n) {
    const seen = new Set(), out = [];
    for (const rec of records.slice(-AFTER_REPLIES).reverse()) {
        for (const [id, [before, after]] of Object.entries(rec?.m ?? {})) {
            const m = BY_ID[id], wake = m && WAKE[m.category];
            if (!wake || seen.has(m.category) || LIGHT.has(id) || sectionOf(m) !== 'mood') continue;
            if (!(before >= WAS_STRONG && after <= before - DROP) || (st?.moods?.[id] ?? 0) >= 41) continue;
            seen.add(m.category);
            out.push(`Aftermath: ${pt(n)} was ${pt(lower(m))} a short while ago. It has passed, but it leaves ${wake}. Let it show for a reply or two, in ${pt(n)}'s own way, then fade.`);
        }
    }
    return out.slice(0, 2);
}

// Who has the empathy to catch a feeling. Positive traits and moods add, cold ones take away; a tie of love or
// friendship toward the player helps, and selective empathy only works for someone they're close to.
const WARM = { soft_hearted: 3, sensitive: 2, protector_role: 1, protection_giving: 1, protective_best_friend: 2, gentlemanly: 1, hidden_heart: 1, caring: 2, warm: 2, soft: 2, soft_spot: 1 };
const COLD = { cold_blooded: 4, callous: 3, insensitive: 2, selfish: 1, careless: 1, cold_surgeon: 3, psychopathic: 5, sociopathic: 4, sexual_psychopath: 5, malignant_narcissism: 4, grandiose_narcissist: 2, narcissistic: 2, alexithymic: 3, sadistic_personality: 4,
    detached: 2, numbed_out: 2, calculating_coldness: 3, icy_contempt: 3, dead_eyed: 3, cruel: 2, sadistic_glee: 3 };
// Feelings that spread from one person to another, and how they land on the one who catches them.
const CATCHING = {
    scared: 'a prickle of the same unease, and the urge to make it stop, one way or another',
    sad: 'a heaviness in the chest and a softer voice',
    happy: 'a lift in mood, a smile nobody planned',
    calm: 'breathing slowing to match',
    desire: 'a quickening pulse',
    angry: 'a temper rising to meet it',
    closeness: 'a pull to be nearer',
};

// seems: feeling ids the hidden line read from the player this reply. st: the character. close: friendship or
// romance toward the player at clear or above. seed: the reply number, so it doesn't fire every reply.
export function contagionLine({ seems = [], st, close = false, n, u, seed = 0, mode = 'scene' }) {
    if (mode === 'off' || !st?.enabled || !seems.length) return '';
    const v = id => st.moods?.[id] ?? 0;
    let empathy = 0;
    for (const [id, w] of Object.entries(WARM)) if (v(id) >= 21) empathy += w;
    for (const [id, w] of Object.entries(COLD)) if (v(id) >= 21) empathy -= w;
    if (v('selective_empathy') >= 21) empathy += close ? 3 : -2;
    if (close) empathy += 1;
    if (empathy < 2) return '';
    // Now and then, not every reply, and more often the warmer they are.
    if ((seed * 7) % 10 >= Math.min(6, 1 + empathy)) return '';
    const caught = seems.map(id => BY_ID[id]).find(m => m && CATCHING[m.category]);
    if (!caught) return '';
    return `${pt(u)} seems ${pt(lower(caught))}, and it rubs off: ${pt(n)} feels ${CATCHING[caught.category]}. It's an echo, fainter than ${pt(u)}'s, and ${pt(n)} may not admit it.`;
}
