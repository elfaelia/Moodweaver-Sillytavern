// Building the hidden note sent with each reply, and holding it steady while a reply is written.
import { getCast, getState, getStoryState, getUserState, identity, migratePairs, pairExtras, pairId, playerName, resolveRelationName, target } from './chat.js';
import { boardMeta, boardSend, bondAxes, bondData, chatSigns, knowledgeNow, bondList, bondOverlaps, liveChat, liveFor, pronounsFor, reactions, userRelation, weaveOf, writes } from './replies.js';
import { settings } from './settings.js';
import { KEY, PROMPT_KEY, ctx, run, tintLauncher } from './state.js';
import { moodTone } from '../engine/tone.js';
import { boardPromptLines, cleanBoardMeta } from '../engine/board.js';
import { bondStanding, cleanDesire, computeBond } from '../engine/bond.js';
import { BY_ID, MOODS, analysed } from '../data/catalogue.js';
import { budgetPrompt } from '../engine/prompt.js';
import { shortName } from '../engine/util.js';
import { knowledgeEntry } from '../engine/state.js';
import { fill as fillDynamic } from '../engine/dynamics.js';
import { DOM_TRAITS, DOM_TURNS, MEDICINE_PAIRS, MEDICINE_ROLES, MONEY_ROLES, MONEY_STANDING, POWER_PAIRS, POWER_ROLES, ROMANCE_PAIRS, SUB_TRAITS, SUB_TURNS, UNDER_ROLES, LENS_TRIGGERS, eraLenses } from '../engine/era-lenses.js';
import { effectiveChat } from '../engine/ledger.js';
import { coreLink, moodLink, roleLink, tieLink } from '../engine/links.js';
import { cleanAge } from '../engine/turns.js';
import { cleanMore, meterWeaveNames } from '../engine/meters.js';
import { MOOD_PACE, SHORT_FUSE, temperPace } from '../engine/moodpace.js';
import { droppedIds } from '../engine/overlap.js';
import { renderPreview, renderStatus } from '../panel/render.js';
import { findPatterns } from '../engine/patterns.js';
import { pronounize } from '../engine/pronouns.js';
import { litSkills, skillLines, skillsOf } from '../engine/skills.js';
import { stripWeave, weavePrompt } from '../engine/weave.js';

export async function syncPrompt(forGeneration = false, chat = null, type = '') {
    // The note for a reply in progress stays as it was built; redraw it once that reply is done.
    if (!forGeneration && writingNow()) { run.resyncAfter = true; return; }
    const version = ++run.promptVersion;
    const c = ctx(), ch = target(forGeneration), state = getState(ch), id = identity(ch), mine = getUserState(), story = getStoryState(ch);
    if (run.suspended || !state) {
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        run.promptInfo = { prompt: '', tokens: 0, omitted: 0 }; renderPreview(); return;
    }
    if (!forGeneration) tintLauncher(moodTone(state.moods).lead);
    try {
        migratePairs(ch);
        const name = String(ch.name).slice(0, 100), player = playerName().slice(0, 100);
        // Always the real chat (the generation copy has boards stripped and skips hidden messages), minus a
        // swipe in progress: the reply being replaced must not shape the one replacing it.
        const history = effectiveChat(c.chat ?? [], type);
        const n = shortName(name), u = shortName(player), bond = bondData(ch), bm = cleanBoardMeta(boardMeta());
        const memories = settings().boardMemories;
        const liveNow = liveFor(ch, history);
        const board = boardPromptLines({ send: boardSend(), live: liveNow, char: name, user: player, n, u, stripped: settings().boardStrip, remember: memories && !bond.on });
        const react = reactions(ch, history, liveNow), live = (state.wants ?? []).filter(w => !w.done && w.value > 0 && w.text && !react.done.has(w.id));
        // The current dynamic, worked out once. The story is asked to rename it when it shifts, and
        // both-ways or story lines it already says are left out of this note.
        const bondList0 = bond.on ? bondList(ch, history) : [], bd = bond.on && bond.extra ? computeBond(bond, history.length, n, u, bondAxes(ch), bondList0) : null;
        lastDynamic.set(ch.avatar, bd?.dynamic.group ?? '');
        // Picks are listed in the hidden line only up to 25 (about 3 tokens each). Past that the line names it in a
        // few words and the closest of your picks is used, so a big pick list costs nothing extra.
        const storyNames = bd && bond.mode === 'story' && !bond.fixed ? { now: bd.dynamic.name.toLowerCase(), pool: bond.pool.length <= 25 ? bond.pool.map(name => fillDynamic(name, n, u)) : [] } : null;
        const covered = new Set(bd?.dynamic.covers ?? []);
        // One idea, one line. Whatever's doubled up is sent once, from the most specific place.
        const dropped = droppedIds(bondOverlaps(ch, history, bond, bondList0, bd));
        const pairDrop = new Set([...covered, ...dropped.shared]), storyDrop = new Set([...covered, ...dropped.story]);
        const zero = (moods, ids) => Object.fromEntries(Object.entries(moods ?? {}).map(([id, v]) => [id, ids.has(id) ? 0 : v]));
        const youRel = dropped.rel.size ? userRelation(state) : null;
        const stateNote = youRel ? { ...state, relationships: state.relationships.map(r => r === youRel ? { ...r, moods: zero(r.moods, dropped.rel) } : r) } : state;
        const knows = knowledgeNow(ch, history), notice = Object.entries(mine?.enabled ? mine.prefs ?? {} : {}).some(([id, v]) => v && knowledgeEntry(knows[`turn:${id}`]).mode !== 'known');
        const weave = bond.on ? weavePrompt({ notice, n, u, bond: true, extra: bond.extra, pace: bond.pace, dynamic: storyNames, moods: bm.feed, feelings: state.moodAuto !== false, moodPace: movePace(ch), moodNames: state.moodScope === 'list' ? listedFeelings(state) : null, remember: memories, wants: live.some(w => ['want', 'goal'].includes(w.kind)),
            fears: live.some(w => w.kind === 'fear'), buttons: live.some(w => w.kind === 'button'), suggest: settings().wantSuggest && settings().wantsTab !== false && live.filter(w => w.kind === 'want').length < 3, you: settings().youTrack, desire: bond.desire?.on === true ? cleanDesire(bond.desire).scales : false, meters: meterWeaveNames(cleanMore(bond.more).on), skills: skillPeople(ch, state, mine).some(p => skillsOf(p.st).length) }) : [];
        // Skills go only when the scene calls for them.
        const skillScene0 = skillScene(ch, history), skills = skillLines(skillPeople(ch, state, mine).map(p => ({ name: p.name, lit: litSkills(p.st, skillScene0.scene, skillScene0.used) })), u);
        // Pattern breaker: the character's last five replies, read here, no extra request.
        const patterns = story?.enabled && (story.moods?.pattern_breaker ?? 0) > 0 ? findPatterns(history.filter(m => writes(ch)(m) && !m.is_system).slice(-5).map(m => m.mes), { names: [name, player] }) : [];
        // The count is only a report, so a tokenizer that can't be reached falls back to an estimate
        // instead of pausing the whole note for that reply.
        const count = async text => { try { const n = await c.getTokenCountAsync(text); return Number.isFinite(n) ? n : Math.ceil(text.length / 3.6); } catch { return Math.ceil(text.length / 3.6); } };
        const pairs = pairExtras(ch).map(p => pairDrop.size && p.names[0] === name && p.names[1] === player ? { ...p, moods: zero(p.moods, pairDrop) } : p);
        const storyNote = story && [...storyDrop].some(id => story.moods?.[id] > 0) ? { ...story, moods: zero(story.moods, storyDrop) } : story;
        const links = sceneLinks({ ch, state, mine, story, bond, bd, n, u });
        const result = await budgetPrompt(stateNote, name, settings().tokenBudget, count, { player: { state: mine, name: player, knowledge: knows, condition: settings().youTrack ? react.condition : [] }, story: storyNote, cast: getCast(ch), pairs, board, blendPlan: settings().blendPlan, lit: react, patterns, showsMode: settings().showsMode,
            standing: withLinks(bondStanding({ bond, chatLength: history.length, n, u, axes: bondAxes(ch), list: bondList0 }), links.links), weave, skills, lenses: links.lenses, pronounLine: pronounLine(ch, bond, n, u), signs: chatSigns(ch, bond) });
        if (version !== run.promptVersion || id !== identity(target(forGeneration))) return;
        // In-chat, user role. Depth 0 puts the note after the latest chat message.
        // Preset instructions outside chat history can still follow it.
        c.setExtensionPrompt(PROMPT_KEY, result.prompt, 1, settings().depth, false, 1);
        run.promptInfo = result; renderPreview();
    } catch (err) {
        console.error('[Moodweaver] could not build the note', err);
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        run.promptInfo = { prompt: '', tokens: 0, omitted: 0 };
        renderPreview();
        run.status = `The mood note couldn't be built, so nothing was sent this time: ${err?.message ?? err}`; renderStatus();
    }
}
// True while a reply is being written. SillyTavern also marks <body data-generating> for exactly that
// time, so if our own end-of-reply event were ever missed, this still lets go.
export function writingNow() {
    if (!run.generating) return false;
    if (typeof document === 'undefined' || document.body?.dataset?.generating === 'true') return true;
    run.generating = false; clearTimeout(run.genTimer); return false;
}
export function startGenerating() {
    run.generating = true; clearTimeout(run.genTimer);
    // GENERATION_ENDED always follows, but never hold the note forever if something swallows it.
    run.genTimer = setTimeout(stopGenerating, 10 * 60 * 1000);
    run.genTimer?.unref?.(); // only matters under Node's test runner
}
export function stopGenerating() {
    const was = run.generating; run.generating = false; clearTimeout(run.genTimer);
    if (was && run.resyncAfter) { run.resyncAfter = false; void syncPrompt(); }
}
// ---- The story moves moods ----
// The hidden line at the end of each reply moves feelings for free. This card switches it on or off per
// character, sets how fast it moves and fades, and shows (and can undo) what the last reply did.
export const FEELINGS_COUNT = MOODS.filter(analysed).length;
// The dynamic group each character's last note was sent with, so the next reply's fading can follow it.
export const lastDynamic = new Map();
// One pace per character and chat, set on the Moods card (or the Bonds tab): feelings, meters and desire all move at it.
export const scenePace = ch => MOOD_PACE[ctx().chatMetadata?.[KEY]?.bond?.[`char:${ch?.avatar}`]?.pace] ?? MOOD_PACE.steady;
// The pace this character's feelings actually move at: the chat's pace, shifted by their temper (volatile swings
// harder, stoic holds steadier; engine/moodpace.js).
// Low hunger, energy or comfort on the info board make feelings quicker to flare (⚙ Settings › Panel can turn it off).
const lowNeeds = ch => settings().needsMood === false ? [] : (liveFor(ch)?.needs ?? []).filter(nd => nd.known && nd.value <= 35 && SHORT_FUSE.includes(nd.id)).map(nd => nd.label.toLowerCase());
export const movePace = ch => temperPace(scenePace(ch), getState(ch)?.moods, lowNeeds(ch));
// What the period does to what's switched on, and how the dynamic meets roles and the strongest feeling.
const strongIn = (moods, ids, min = 41) => ids.some(id => (moods?.[id] ?? 0) >= min);
// "Doctor Easterman is he/him; Lamb is she/her." Only the ones that are known.
function pronounLine(ch, bond, n, u) {
    const g = pronounsFor(ch, bond), word = { he: 'he/him', she: 'she/her' };
    const parts = [[n, g.n], [u, g.u]].filter(([, p]) => word[p]).map(([name, p]) => `${name} is ${word[p]}`);
    return parts.length ? `${parts.join('; ')}.` : '';
}
// The links go right under the dynamic they talk about.
function withLinks(standing, links) {
    if (!links.length) return standing;
    const at = standing.findIndex(line => line.startsWith('their dynamic'));
    return at < 0 ? [...standing, ...links] : [...standing.slice(0, at + 1), ...links, ...standing.slice(at + 1)];
}
// Feelings that show someone leading right now, or giving way (catering to her, eager to please, yielding).
const LEADING_MOODS = ['demanding', 'commanding', 'taking_charge', 'controlling', 'assertive', 'power_drunk', 'bratty_defiance', 'dominant_hunger', 'in_control', 'territorial'];
const YIELDING_MOODS = ['submissive_longing', 'fawning', 'performing_obedience', 'wants_to_be_taken', 'indulgent', 'melting', 'worshipful', 'wants_praise', 'pleading', 'cowed', 'desperate_for_approval', 'devotion_quiet', 'helpful', 'soft'];
const HARSH_MOODS = ['controlling', 'commanding', 'punitive', 'paternalistic_control', 'contemptuous', 'icy_contempt', 'dismissive', 'clinical_cruelty', 'judgemental_misogyny', 'domestic_tyrant'];
function sceneLinks({ ch, state, mine, story, bond, bd, n, u }) {
    const g = pronounsFor(ch, bond), rel = userRelation(state), relMoods = rel && rel.enabled !== false ? rel.moods ?? {} : {};
    const pair = ctx().chatMetadata?.[KEY]?.pairs?.[pairId(`char:${ch.avatar}`, 'user')], pairMoods = pair && pair.enabled !== false ? pair.moods ?? {} : {};
    const cname = String(ch?.name ?? '').toLowerCase(), side = (mine?.relationships ?? []).find(r => r.target === '{{char}}' || resolveRelationName(r.target).toLowerCase() === cname);
    const yourSide = side && side.enabled !== false ? side.moods ?? {} : {};
    const era = story?.enabled ? MOODS.filter(m => m.category === 'era' && (story.moods?.[m.id] ?? 0) > 0).sort((a, b) => story.moods[b.id] - story.moods[a.id])[0]?.id : '';
    // Who holds the power, for the Power line. Roles they've set between them decide it first, then the Control
    // meter, then who's leading by mood right now (his giving way, or her demanding, tips it to her). Only after
    // that do the period's defaults (a marriage, an age gap) or the dynamic's kind put the man on top, and never
    // against the moods: a period line is pressure from the world, not who they are.
    const leads = st => Math.max(0, ...LEADING_MOODS.map(id => st?.moods?.[id] ?? 0).filter(v => v >= 41)), yields = st => Math.max(0, ...YIELDING_MOODS.map(id => st?.moods?.[id] ?? 0).filter(v => v >= 41));
    const byMood = Math.max(leads(state), yields(mine)) - Math.max(leads(mine), yields(state));
    let top = '';
    if (strongIn(relMoods, POWER_ROLES) || strongIn(yourSide, UNDER_ROLES)) top = 'n';
    else if (strongIn(relMoods, UNDER_ROLES) || strongIn(yourSide, POWER_ROLES)) top = 'u';
    else if (bd && Math.abs(bd.p) >= 30) top = bd.p > 0 ? 'n' : 'u';
    else if (Math.abs(byMood) >= 20) top = byMood > 0 ? 'n' : 'u';
    else if (byMood < 0) top = '';
    else if (strongIn(pairMoods, POWER_PAIRS)) top = g.u === 'he' && g.n !== 'he' ? 'u' : 'n';
    else if (bd && ['power', 'captor'].includes(bd.dynamic.group)) top = 'n';
    const romance = Boolean(bd && (bd.r >= 30 || ['romance', 'heat'].includes(bd.dynamic.group))) || strongIn(pairMoods, ROMANCE_PAIRS) || strongIn(state.moods, ['horny', 'heated', 'craving', 'desperate_for_it']);
    const people = [[n, g.n, state], [u, g.u, mine]];
    const kinky = (st, traits, turns) => strongIn(st?.moods, traits) || turns.some(id => (st?.prefs?.[id] ?? 0) > 40);
    const manSub = people.find(([, gen, st]) => gen === 'he' && kinky(st, SUB_TRAITS, SUB_TURNS))?.[0] ?? '';
    const womanDom = people.find(([, gen, st]) => gen === 'she' && kinky(st, DOM_TRAITS, DOM_TURNS))?.[0] ?? '';
    // Darker, gendered tags that colour the Power line in an older period (and count as power on their own).
    const dyn = bd?.dynamic.key ?? '', on = (moods, ids) => strongIn(moods, ids);
    const tints = [
        (on(relMoods, ['captor_of', 'keeps_them']) || on(pairMoods, ['held_by_threat', 'gilded_cage', 'captor_captive']) || ['Captor', 'Gilded cage', 'Closing the circle', 'Guilty captor', 'Fixated captor', 'Conditioning captor', 'Romantic captor', 'Breaking in'].includes(dyn)) && 'trapped',
        (on(state.moods, ['male_gaze', 'female_gaze', 'leering', 'checking_out'])) && 'gaze',
        (on(relMoods, ['possessive', 'theyre_mine', 'wants_to_own', 'controls']) || on(pairMoods, ['mutually_possessive']) || ['Owned', 'Trophy', 'Claimed', 'Possession', 'Possessive worship'].includes(dyn)) && 'possessive',
        (on(relMoods, ['manipulates']) || on(state.moods, ['gaslighting']) || ['Gaslit', 'Kept small', 'Puppet strings'].includes(dyn)) && 'gaslight',
        (on(relMoods, ['stalks', 'watches_over']) || ['Stalker’s courtship', 'Watcher'].includes(dyn)) && 'stalking',
        (on(state.moods, ['domestic_tyrant', 'womaniser', 'judgemental_misogyny'])) && 'contempt',
    ].filter(Boolean);
    if (!top && tints.length && byMood >= 0) top = 'n';
    // Harsh only when whoever holds power is in that kind of mood right now.
    const harshIn = st => MOODS.some(m => (st?.moods?.[m.id] ?? 0) >= 41 && (['angry', 'cruel', 'cold'].includes(m.category) || HARSH_MOODS.includes(m.id)));
    const harsh = top === 'n' ? harshIn(state) : top === 'u' ? harshIn(mine) : false;
    // A lens shows when something on either person's cards, between them or on the Story tab touches it.
    const carried = new Set(people.flatMap(([, , st]) => (st?.inventory ?? []).filter(i => i?.carried).flatMap(i => String(i.text ?? '').toLowerCase().split(/[^a-z]+/))));
    const touched = Object.fromEntries(Object.entries(LENS_TRIGGERS).map(([key, t]) => [key, people.some(([, , st]) => (t.turns ?? []).some(id => (st?.prefs?.[id] ?? 0) > 40) || strongIn(st?.moods, t.moods ?? []) || (t.skills ?? []).some(id => (st?.skills?.[id] ?? 0) >= 5))
        || (t.items ?? '').split(' ').some(w => carried.has(w))
        || [relMoods, yourSide, pairMoods].some(m => strongIn(m, t.ties ?? [])) || strongIn(story?.enabled ? story.moods : {}, t.story ?? [], 1)]));
    const lenses = era ? eraLenses({ era, n, u, gn: g.n, gu: g.u, top, harsh, romance, manSub, womanDom, tints, ...touched,
        cap: Number(settings().eraLines) || 3, seed: ctx().chat?.length ?? 0, moods: { n: state.moods ?? {}, u: mine?.enabled ? mine.moods ?? {} : {} },
        ages: cleanAge(state.age) && cleanAge(mine?.age) ? { n: cleanAge(state.age), u: cleanAge(mine.age) } : null,
        medicine: touched.medicine || strongIn(relMoods, MEDICINE_ROLES) || strongIn(yourSide, MEDICINE_ROLES) || strongIn(pairMoods, MEDICINE_PAIRS),
        money: touched.money || strongIn(relMoods, MONEY_ROLES) || strongIn(yourSide, MONEY_ROLES) || strongIn(state.moods, MONEY_STANDING) || strongIn(mine?.moods, MONEY_STANDING) }).map(l => pronounize(l, n, u)) : [];
    const links = [];
    if (bd) {
        const role = roleLink({ ...pairMoods, ...relMoods }, bd.dynamic, n, u); if (role) links.push(pronounize(role, n, u));
        const tie = tieLink({ ...pairMoods, ...relMoods }, { ...pairMoods, ...yourSide }, bd.dynamic, n, u); if (tie) links.push(pronounize(tie, n, u));
        const core = coreLink((state.core ?? []).filter(id => (state.moods?.[id] ?? 0) > 0), bd.dynamic, top, n, u); if (core) links.push(pronounize(core, n, u));
        const topMood = MOODS.filter(m => analysed(m) && (state.moods?.[m.id] ?? 0) > 0).sort((a, b) => state.moods[b.id] - state.moods[a.id])[0];
        const mood = topMood ? moodLink({ label: topMood.label, family: topMood.category, value: state.moods[topMood.id] }, bd.dynamic, n) : '';
        if (mood && links.length < 3) links.push(pronounize(mood, n, u));
    }
    return { lenses, links };
}
// The feelings on a character's list, as the plain names the hidden line uses (first part of the label).
export function listedFeelings(st) {
    const ids = new Set([...(st.loadout ?? []), ...Object.keys(st.moods ?? {}).filter(id => st.moods[id] > 0)]);
    return [...ids].map(id => BY_ID[id]).filter(m => m && analysed(m)).map(m => m.label.split('/')[0].trim().toLowerCase());
}
// ---- Skills ----
// Who can have skills in this reply: the character, your character and the cast in the scene.
function skillPeople(ch, state, mine) {
    return [{ name: shortName(ch?.name ?? ''), st: state }, { name: shortName(playerName()), st: mine },
        ...getCast(ch).filter(p => p.inScene).map(p => ({ name: shortName(p.name), st: p.state }))].filter(p => p.st?.enabled);
}
// What calls for a skill: your latest message and the character's last reply (or more, by the Look back setting),
// plus whatever the newest reply's hidden line says was used. Read from the chat each time, so swipes undo it.
export function skillScene(ch, history = liveChat()) {
    const chat = (history ?? []).filter(m => m && !m.is_system), mine = writes(ch);
    const lastUser = [...chat].reverse().find(m => m.is_user), replies = chat.filter(m => mine(m));
    const scene = [lastUser, ...replies.slice(-settings().skillLookback)].filter(Boolean).map(m => stripWeave(m.mes)).join('\n');
    const newest = replies.at(-1), used = (newest ? weaveOf(newest)?.used ?? [] : []).join(', ');
    return { scene, used };
}
