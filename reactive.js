import { pronounize } from './pronouns.js';
// 1.40.0: cravings and combos, built on Lit.
// Craving: a strong turn-on that hasn't been lit for a while starts pulling the character toward it.
// Combo: two things at once (something lit, a feeling, a pressed button, a meter) fire a bigger effect.
// Pure functions; everything is worked out from the replies still in the chat, so swipes undo it.

// history: one Set of lit turn-on ids per reply with a hidden line, oldest first.
// Strong turn-ons crave after 8 quiet replies, intense and above after 5. At most three at once.
export function cravingsFrom(prefs = {}, history = [], { min = 4 } = {}) {
    if (history.length < min) return [];
    const out = [];
    for (const [id, v] of Object.entries(prefs ?? {})) {
        if (!(v >= 61)) continue;
        let last = -1; for (let i = history.length - 1; i >= 0; i--) if (history[i].has(id)) { last = i; break; }
        const gap = history.length - 1 - last, need = v >= 81 ? 5 : 8;
        if (gap >= need) out.push({ id, gap, value: v });
    }
    return out.sort((a, b) => b.value - a.value || b.gap - a.gap).slice(0, 3);
}

const any = (set, ids) => ids.some(id => set.has(id));
const feel = (moods, ids, min = 41) => ids.some(id => (moods?.[id] ?? 0) >= min);
// ctx: { lit: Set (turn-ons lit last reply), litTraits: Set, moods, pressed, blocked, desire: { a, h } | null,
// needsLow: Set, more: { ob, fa, ... }, cravingMet: Set }. Each combo: name, test, what Claude reads.
export const COMBOS = [
    ['Craving met', c => c.cravingMet.size > 0, (n, u) => `something ${n} has been craving finally happened: relief and greed at once, and ${n} wants more of it right now`],
    ['Claim', c => any(c.lit, ['defiance', 'rebelliousness', 'stubbornness', 'a_struggle', 'being_ignored']) && feel(c.moods, ['possessive', 'controlling', 'jealous', 'power_drunk', 'reasserting', 'domineering']),
        (n, u) => `${n} needs to put ${u} back in ${u}'s place, right now: closer, firmer, final`],
    ['Undone', c => any(c.lit, ['crying', 'vulnerability', 'helplessness', 'trembling_people', 'begging']) && feel(c.moods, ['guilty', 'contrite', 'affectionate', 'devoted', 'lovesick', 'worshipful', 'soft', 'indulgent']),
        (n, u) => `every resolve breaks: ${n} gives ${u} whatever makes it stop`],
    ['Feeding on it', c => any(c.lit, ['crying', 'screams', 'being_feared', 'begging', 'trembling_people', 'watching_break']) && feel(c.moods, ['sadistic_glee', 'cruel', 'toying', 'predatory', 'bloodthirsty', 'power_drunk', 'breaking_them']),
        (n, u) => `${u}'s fear and pain feed it: ${n} leans in, slows down, makes it last`],
    ['Mine', c => c.lit.size > 0 && feel(c.moods, ['jealous', 'possessive'], 61), (n, u) => `want and jealousy fuse: ${n} needs to mark ${u} so nobody could mistake whose ${u} is`],
    ['Hate-heat', c => (c.desire?.a ?? 0) >= 61 && feel(c.moods, ['angry', 'resentful', 'contemptuous', 'seething', 'icy_contempt']),
        (n, u) => `anger and want in the same hands: rough and fast, and ${n} won't admit which one it is`],
    ['Good', c => any(c.lit, ['obedience', 'submissiveness', 'good_manners', 'surrender', 'being_pet_named']) && feel(c.moods, ['affectionate', 'indulgent', 'proud_of_them', 'caretaker', 'fond_exasperation']),
        (n, u) => `${n} rewards ${u}: praise, softness, a treat, the leash let out an inch`],
    ['Rush', c => any(c.lit, ['mortal_danger', 'danger', 'killers', 'hoplophilia', 'erotophonophilia', 'blood_on_others', 'gun_play', 'knife_play']) && feel(c.moods, ['horny', 'heated', 'adrenaline_high', 'thrill_of_chase']),
        (n, u) => `danger and desire blur into one rush: reckless, breathless, wanting`],
    ['Keeping', c => any(c.lit, ['vulnerability', 'crying', 'bandaged', 'brokenness', 'helplessness', 'captives']) && feel(c.moods, ['possessive_tenderness', 'protective', 'caretaker', 'keeping_vigil', 'watching_over']),
        (n, u) => `care tightens into keeping: ${n} tends ${u} and quietly closes every way out`],
    ['Snap', c => c.pressed && feel(c.moods, ['tired', 'sleep_deprived', 'strung_out', 'frustrated', 'hangry', 'overwhelmed', 'comedown']),
        (n, u) => `the hot button lands on a frayed ${n}: the reaction comes out doubled, nothing left to hold it with`],
    ['Wounded', c => c.blocked && feel(c.moods, ['hurt', 'insecure', 'wounded_pride', 'desperate_for_approval', 'humiliated_rage']),
        (n, u) => `being thwarted lands as a personal wound: ${n} sulks, lashes out or begs`],
    ['Breaking point', c => c.needsLow.size > 0 && (c.pressed || feel(c.moods, ['angry', 'desperate'], 61)), (n, u) => `${n}'s body and temper give out together: whatever ${n} was holding back comes out`],
    ['Into the obsession', c => c.lit.size > 0 && ((c.more?.ob ?? 0) >= 61 || (c.more?.fa ?? 0) >= 61), (n, u) => `it goes straight into the obsession: ${n} stops to study it and will replay it for days`],
    // 1.44.0: three for the newer turn-ons.
    ['Clinical heat', c => any(c.lit, ['hospital_gowns', 'clinical_voice', 'gurneys', 'being_experimented_on', 'being_studied', 'medplay_giving', 'clinical_scent', 'paperwork', 'glazed_eyes', 'sickliness']) && ((c.desire?.a ?? 0) >= 41 || feel(c.moods, ['horny', 'heated', 'curious'])),
        (n, u) => `the clinic and the want run together: ${n} keeps the professional voice and lets ${n}'s hands say the rest`],
    ['Taking the bait', c => any(c.lit, ['brattiness', 'defiance', 'rebelliousness', 'being_teased']) && feel(c.moods, ['playful', 'indulgent', 'fond_exasperation', 'smug', 'flirty', 'toying']),
        (n, u) => `${n} takes the bait on purpose: lets ${u} push, then settles it in a way ${u} will remember`],
    ['Something to keep', c => any(c.lit, ['keepsakes', 'polaroids', 'tape_recordings', 'shutter_clicks', 'writing_on_skin', 'posing_someone']) && (feel(c.moods, ['possessive', 'obsessed', 'predatory']) || (c.more?.ob ?? 0) >= 41),
        (n, u) => `${n} wants something to keep from this: a picture, a recording, a mark, a small thing slipped into a pocket`],
    ['Shame spiral', c => (c.desire?.a ?? 0) >= 41 && (c.desire?.h ?? 0) >= 61, (n, u) => `wanting it makes ${n} hate ${u} for it: cruelty or coldness right after the want`],
];
// custom: [{ id, a, b, name, text }] where a and b are 'turn:id' (lit last reply), 'trait:id' (lit),
// 'mood:id' (at clear or above), 'button' (a hot button went off) or 'need:id' (low).
export const comboToken = (token, c) => {
    const [kind, id] = String(token).split(':');
    return kind === 'turn' ? c.lit.has(id) : kind === 'trait' ? c.litTraits.has(id) : kind === 'mood' ? (c.moods?.[id] ?? 0) >= 41
        : kind === 'button' ? c.pressed : kind === 'need' ? c.needsLow.has(id) : false;
};
export function findCombos(ctx, custom = [], n = 'they', u = 'them') {
    const c = { lit: new Set(), litTraits: new Set(), moods: {}, pressed: false, blocked: false, desire: null, needsLow: new Set(), more: {}, cravingMet: new Set(), ...ctx };
    const mine = (custom ?? []).filter(x => x?.a && x?.b && x?.name && comboToken(x.a, c) && comboToken(x.b, c)).map(x => ({ name: x.name, text: x.text || x.name, own: true }));
    const built = COMBOS.filter(([, test]) => test(c)).map(([name, , text]) => ({ name, text: pronounize(text(n, u), n, u) }));
    return [...mine, ...built].slice(0, 2);
}
export function cleanCombos(list = []) {
    const t = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
    const ok = v => /^(turn|trait|mood|need):[a-z0-9_]+$/.test(v) || v === 'button';
    return (Array.isArray(list) ? list : []).map(x => ({ id: t(x?.id, 40) || Math.random().toString(36).slice(2, 10), a: t(x?.a, 60), b: t(x?.b, 60), name: t(x?.name, 40), text: t(x?.text, 160) }))
        .filter(x => ok(x.a) && ok(x.b) && x.name).slice(0, 20);
}
