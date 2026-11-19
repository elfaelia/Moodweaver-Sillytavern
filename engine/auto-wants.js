// Wants from the meters (1.79): when a Bonds meter runs strong, the character wants something that follows from
// it (Obsession → to know where you are every hour). Character only, behind Settings (Wants tab › "Wants from
// the meters"), at most two at a time, the strongest meters first. When the hidden line marks one done it goes,
// and the same meter can't bring it back for REST messages. Nothing is stored: it's read from the meters and the
// chat each time, so a swipe takes it with it. Data and pure functions.
const AT = 61, REST = 40;
// key (a minus for the low side of a two-sided meter): want. {u} is your persona; "they" is the character.
export const METER_WANTS = {
    r: 'to hear {u} say it first', t: 'to tell {u} the thing no one else knows', 't-': 'to catch {u} in a lie',
    ob: 'to know where {u} is and who with, every hour', po: 'to make it plain to everyone that {u} is taken', je: 'to get {u} away from whoever is circling',
    pr: 'to get {u} somewhere safe and keep {u} there', re: 'to have {u} beside them in something that matters', 're-': 'to put {u} in their place',
    fa: 'to find out what {u} is hiding', pe: 'to show {u} off', 'pe-': 'to make {u} pay for not being who they seemed', de: 'to make sure {u} never leaves',
    hu: 'to hurt {u}, once, and see what happens', op: 'to let {u} see the worst of them and stay', gu: 'to make it right with {u}', co: 'to see how far {u} will go',
    kn: 'to use what they know about {u}', ca: 'to look after {u} properly, whether {u} likes it or not', di: 'to have {u} keep the rules without being told',
    lu: 'to get {u} into bed', rs: 'to make {u} feel what they felt', ly: 'to prove to {u} they can be counted on', gd: 'to teach {u} something that lasts',
    cd: 'to have {u} obey without thinking', cl: 'to find out what is really wrong with {u}', se: 'to keep {u} from finding out', ap: 'to have {u} make a good impression in public',
    fe: 'to get away from {u}', ri: 'to beat {u} where it counts', sh: 'to make {u} forget what they saw', dv: 'to give {u} whatever {u} asks for',
    rt: 'to keep their hands off {u}', sw: 'to bring {u} round to their way of seeing it', cm: 'to keep {u} in on it and quiet', uw: 'to be good enough for {u}',
    pa: 'to make {u} give up on them', ex: 'to get one straight answer out of {u}', hi: 'to take {u} back somewhere from when they were young',
    sc: 'to give something up for {u} without {u} knowing', os: 'to get proof {u} feels it too', pt: 'to make the big decisions for {u}',
    gr: 'to make {u} feel special, and theirs alone', pl: 'to make {u} laugh until {u} can’t stop', pi: 'to see {u} win something big', ts: 'to see if {u} stays when pushed',
};
// values: { r: 72, ob: 80, re: -65, ... } (base and extra meters together). replies: [[pos, weave]] oldest first.
// manual: the wants already written by hand, so one that's there already isn't doubled. match(text, list) → item.
export function autoWants({ values = {}, u = 'them', replies = [], manual = [], match = () => null, now = 0 }) {
    const fill = t => t.replace(/\{u\}/g, u);
    const cand = Object.entries(values).flatMap(([k, v]) => v >= AT && METER_WANTS[k] ? [{ key: k, v }] : v <= -AT && METER_WANTS[`${k}-`] ? [{ key: `${k}-`, v: -v }] : [])
        .map(c => ({ ...c, id: `auto:${c.key}`, kind: 'want', text: fill(METER_WANTS[c.key]), value: Math.min(100, Math.round(c.v)), auto: true }));
    const done = [];
    for (const c of cand) {
        let at = -1;
        for (const [pos, w] of replies) for (const x of w.wants ?? []) if (x.status === 'done' && match(x.text, [c])) at = pos;
        if (at >= 0 && now - at < REST) done.push({ ...c, at });
    }
    const gone = new Set(done.map(c => c.key));
    const live = cand.filter(c => !gone.has(c.key) && !match(c.text, manual.filter(w => !w.done))).sort((a, b) => b.v - a.v).slice(0, 2);
    return { live, done: done.filter(c => now - c.at < 12) };
}
