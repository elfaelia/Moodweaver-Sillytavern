// Tonight (2.0): the scene at a glance, the panel's home page. Each person is a star: its core is the strongest
// true feeling and a cooler ring around it is what they let show, so a mask can be seen. The line between the two
// main stars is their dynamic. Low needs and stress circle the character as small moons, side characters sit
// below, and the song turns at the top. Every part is one big tap that opens the page it stands for.
import { getCast, getUserState, playerName } from '../app/chat.js';
import { mus } from '../app/music.js';
import { boardPeople, bondAxes, bondData, bondList, liveChat, liveFor, reactions, stressNow } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { ui } from '../app/state.js';
import { activeMoods } from '../engine/state.js';
import { computeBond } from '../engine/bond.js';
import { level } from '../engine/strength.js';
import { TONES } from '../engine/tone.js';
import { hasBoard, matchMood, parseBoard } from '../engine/board.js';
import { escapeHtml as esc, shortName } from '../engine/util.js';
import { sectionOf } from '../data/catalogue.js';
import { tagLabel } from './rows.js';
import { directBlock } from '../app/direct.js';
import { arcsCard } from './arcs-card.js';
import { lorePeople } from '../app/lore.js';

const NEED_TINT = { hunger: '#e8b36f', energy: '#b8a6e0', bladder: '#9fc6e8', hygiene: '#9fd3c9', comfort: '#e8936f', social: '#ef9fbe', fun: '#efd59c', health: '#e26d7a' };
const tint = m => TONES[m?.category] ?? m?.color ?? '#c9b8f0';

// The leading true feelings and the mask, if any, for one person.
function feelingsOf(st) {
    const all = st?.enabled === false ? [] : activeMoods(st ?? {}).filter(m => sectionOf(m) === 'mood').sort((a, b) => (st.moods[b.id] ?? 0) - (st.moods[a.id] ?? 0));
    const mask = all.find(m => m.category === 'masks'), feel = all.filter(m => m.category !== 'masks');
    return { feel: feel.slice(0, 2), mask, top: feel[0] ?? mask ?? null, value: feel[0] ? st.moods[feel[0].id] : 0 };
}
const word = (st, m) => `${esc(tagLabel(m).toLowerCase())}`;

function star(who, name, st, { moons = [], extra = '', castId = '', small = false, away = false, said = [] } = {}) {
    const f = feelingsOf(st), heard = f.top ? null : said.map(t => matchMood(t)).find(Boolean), core = f.top ? tint(f.top) : heard ? tint(heard) : '#d9d2ea', ring = f.mask ? tint(f.mask) : '';
    const size = small ? 26 : Math.round(34 + Math.min(100, f.value) / 100 * 22);
    const lines = small ? '' : `${f.feel.length ? `<small class="mw-tn-feel" style="--c:${core}">${f.feel.map(m => word(st, m)).join(' \u00b7 ')}${f.feel[0] ? ` <em>${esc(level(st.moods[f.feel[0].id]).toLowerCase())}</em>` : ''}</small>` : said.length ? `<small class="mw-tn-feel" style="--c:${core}">${said.slice(0, 2).map(esc).join(' \u00b7 ')} <em class="mw-tn-src">from the story</em></small>` : '<small class="mw-tn-feel is-quiet">nothing set yet</small>'}
        ${f.mask ? `<small class="mw-tn-mask" style="--c:${ring}">shows: ${word(st, f.mask)}</small>` : ''}${extra}`;
    return `<button type="button" class="mw-tn-star is-${who}${small ? ' is-small' : ''}${away ? ' is-away' : ''}" data-who="${who}"${castId ? ` data-cast-id="${esc(castId)}"` : ''} style="--core:${core};--ring:${ring || 'transparent'};--size:${size}px" aria-label="Open ${esc(name)}">
        <span class="mw-tn-orb" aria-hidden="true">${ring ? '<span class="mw-tn-mask-ring"></span>' : ''}<span class="mw-tn-core"></span>${moons.length ? `<span class="mw-tn-moons">${moons.map((m, i) => `<i style="--c:${m.c};--a:${Math.round(i * 360 / moons.length)}deg" title="${esc(m.t)}"></i>`).join('')}</span>` : ''}</span>
        <b>${esc(shortName(name))}</b>${lines}</button>`;
}


// Passing characters: named on the board's Present line but not in the cast. No page and no state; a faint name
// while they're here. Someone who keeps turning up (on four or more of the last 80 messages' boards) is offered
// for the cast.
const splitPresent = raw => /^(none|no one|nobody|alone|n\/a|-)$/i.test(String(raw ?? '').trim()) ? [] : String(raw ?? '').split(/\s*(?:,|;|&|\band\b)\s*/i).map(x => x.trim()).filter(x => x && x.length <= 40).slice(0, 8);
let seenCache = { key: '', counts: new Map() };
function recurring(chat) {
    const key = `${chat.length}:${chat.at(-1)?.send_date ?? ''}`; if (seenCache.key === key) return seenCache.counts;
    const counts = new Map();
    for (const m of chat.slice(-80)) if (hasBoard(m?.mes)) for (const n of new Set(splitPresent(parseBoard(m.mes)?.present).map(x => x.toLowerCase()))) counts.set(n, (counts.get(n) ?? 0) + 1);
    seenCache = { key, counts }; return counts;
}
function passingRow(ch, live) {
    const people = boardPeople(ch), here = splitPresent(live?.present).filter(n => !people.some(p => p.match(n)));
    if (!here.length) return '';
    const counts = recurring(liveChat());
    return `<div class="mw-tn-passing"><span>Also here</span>${here.map(n => { const often = (counts.get(n.toLowerCase()) ?? 0) >= 4;
        return `<button type="button" class="mw-tn-pass${often ? ' is-often' : ''}" data-board-addcast="${esc(n)}" title="${often ? `${esc(n)} keeps turning up. Tap to add them to the cast` : `Add ${esc(n)} to the cast`}">${often ? '\u2726 ' : ''}${esc(n)}${often ? ' <small>keeps turning up \u00b7 add</small>' : ' <small>\uff0b</small>'}</button>`; }).join('')}</div>`;
}

// Lorebook people whose entries fired for the last reply, offered as side characters (app/lore.js).
function loreRow(ch, live) {
    const here = splitPresent(live?.present).map(n => n.toLowerCase()), lore = lorePeople(ch).filter(n => !here.includes(n.toLowerCase()));
    if (!lore.length) return '';
    return `<div class="mw-tn-passing is-lore"><span>From the lorebook</span>${lore.map(n => `<button type="button" class="mw-tn-pass" data-board-addcast="${esc(n)}" title="Add ${esc(n)} to the cast">\uff0b ${esc(n)}</button>`).join('')}</div>`;
}
// The cast on Tonight: everyone in the scene; the ones off scene fold into one chip once there are more than a few,
// so a big cast never crowds the page.
function castStars(cast) {
    const s = p => star('cast', p.name, p.state, { castId: p.id, small: true, away: !p.inScene });
    const here = cast.filter(p => p.inScene), away = cast.filter(p => !p.inScene);
    if (here.length + away.length <= 6) return [...here, ...away].map(s).join('');
    return `${here.map(s).join('')}<details class="mw-tn-away" data-anchor="tonight-away"><summary><b>${away.length}</b><small>off scene</small></summary><div class="mw-tn-cast">${away.map(s).join('')}</div></details>`;
}
export function tonightView(ch, charState, live = liveFor(ch)) {
    const userState = getUserState(), cast = getCast(ch);
    const where = live?.found ? live.location : '', when = live?.found ? live.time : '';
    // Low needs and stress circle the character.
    const moons = (live?.needs ?? []).filter(n => n.known && n.value <= 35).slice(0, 4).map(n => ({ c: NEED_TINT[n.id] ?? '#c9b8f0', t: `${n.label} low` }));
    const stress = stressNow(ch); if (stress?.level >= 1) moons.push({ c: '#e26d7a', t: `Stress: ${stress.word}` });
    const body = live?.state?.length ? live.state.slice(0, 3).map(t => t.text) : [];
    const you = settings().youTrack !== false ? (reactions(ch).condition ?? []).slice(0, 3) : [];
    // The dynamic between them.
    const bond = bondData(ch), d = bond.on ? computeBond(bond, Infinity, shortName(ch.name), shortName(playerName()), bondAxes(ch), bondList(ch)) : null;
    const dyn = d?.dynamic?.name ?? '', under = d?.under?.name ?? '';
    const a = feelingsOf(charState), b = feelingsOf(userState), ca = a.top ? tint(a.top) : '#d9d2ea', cb = b.top ? tint(b.top) : '#d9d2ea';
    const heat = Math.max(...['heated', 'aroused', 'horny', 'lustful'].map(id => Math.max(charState?.moods?.[id] ?? 0, userState?.moods?.[id] ?? 0)));
    const song = mus.now?.name ? `<button type="button" class="mw-tn-planet${mus.now.playing ? ' is-playing' : ''}" data-dock="music" aria-label="Music: ${esc(mus.now.name)}"><span class="mw-tn-saturn" aria-hidden="true"><i class="mw-tn-ring is-back"></i><i class="mw-tn-ball"></i><i class="mw-tn-ring is-front"></i></span><small>${esc(mus.now.name)}</small></button>` : '';
    const empty = !a.top && !b.top && !body.length;
    return `<section class="mw-tonight" data-sky="${esc(live?.sky?.time ?? '')}" data-weather="${esc(live?.sky?.weather ?? '')}">
        <header class="mw-tn-head"><small>${when ? `The scene \u00b7 ${esc(when)}` : 'The scene'}</small><h3>${esc(where.split(',')[0] || 'This scene')}</h3>${where.includes(',') ? `<p>${esc(where.split(',').slice(1).join(',').trim())}</p>` : ''}</header>
        <div class="mw-tn-stage${heat >= 41 ? ' is-hot' : ''}" style="--ca:${ca};--cb:${cb}">
            <svg class="mw-tn-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="mw-tn-grad" x1="0" x2="1"><stop offset="0" stop-color="${ca}"/><stop offset="1" stop-color="${cb}"/></linearGradient></defs>
                <path class="mw-tn-glow" d="M25 40 Q50 14 75 54"/><path class="mw-tn-path${d ? '' : ' is-off'}" d="M25 40 Q50 14 75 54"/></svg>
            ${song}
            <button type="button" class="mw-tn-bond" data-dock="us" aria-label="Open the two of them"><b>${esc(dyn || (d ? 'Their dynamic' : 'The two of them'))}</b>${under ? `<small>under it: ${esc(under.toLowerCase())}</small>` : d ? '' : '<small>tap to see their bond</small>'}</button>
            ${star('char', ch.name, charState, { moons, said: body })}
            ${star('user', playerName(), userState, { said: you })}
        </div>
        ${`<div class="mw-tn-cast" role="group" aria-label="Side characters">${castStars(cast)}
            <button type="button" class="mw-tn-add" data-action="cast-new" aria-pressed="${ui.castAction === 'adding'}"><span aria-hidden="true">\uff0b</span><small>Side character</small></button></div>
            ${ui.castAction === 'adding' ? '<div class="mw-cast-add mw-new-cast"><input type="text" data-cast-new maxlength="80" aria-label="New side character name" placeholder="Their name"><button data-action="cast-add">Add</button></div>' : ''}`}
        ${passingRow(ch, live)}${loreRow(ch, live)}
        ${directBlock(shortName(ch.name), shortName(playerName()))}
        ${arcsCard(ch)}
        ${(body.length && a.top) || (you.length && b.top) ? `<div class="mw-tn-says">${body.length && a.top ? `<p><span>${esc(shortName(ch.name))}, from the story</span>${body.map(t => `<i>${esc(t)}</i>`).join('')}</p>` : ''}${you.length && b.top ? `<p><span>${esc(shortName(playerName()))}</span>${you.map(t => `<i>${esc(t)}</i>`).join('')}</p>` : ''}</div>` : ''}
        ${empty ? `<div class="mw-tn-start"><p>Nothing's set for this chat yet. Moodweaver can read the card and suggest where ${esc(shortName(ch.name))} starts.</p><button type="button" class="mw-primary" data-action="card-read" data-card-who="char">\u2726 Read the card</button></div>` : ''}
    </section>`;
}
