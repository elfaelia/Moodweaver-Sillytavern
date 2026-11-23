// Building the hidden note sent with each reply, and holding it steady while a reply is written.
import { meterTies } from '../engine/relationships.js';
import { getCast, getState, getStoryState, getUserState, identity, migratePairs, pairExtras, pairId, playerName, resolveRelationName, target } from './chat.js';
import { autoWantsNow, boardMeta, boardSend, bondAxes, bondData, chatSigns, knowledgeNow, bondList, bondOverlaps, liveChat, liveFor, opinionsNow, pronounsFor, reactions, secretsNow, stressNow, userRelation, weaveOf, writes } from './replies.js';
import { stressLines } from '../engine/stress.js';
import { opinionLines } from '../engine/opinions.js';
import { secretLines } from '../engine/secrets.js';
import { settings } from './settings.js';
import { GUIDE_KEY, KEY, PROMPT_KEY, clearNotes, ctx, run, tintLauncher } from './state.js';
import { moodTone } from '../engine/tone.js';
import { boardPromptLines, cleanBoardMeta, feelingId } from '../engine/board.js';
import { bondStanding, cleanDesire, computeBond } from '../engine/bond.js';
import { BY_ID, MOODS, analysed, sectionOf } from '../data/catalogue.js';
import { budgetPrompt } from '../engine/prompt.js';
import { shortName } from '../engine/util.js';
import { knowledgeEntry } from '../engine/state.js';
import { fill as fillDynamic } from '../engine/dynamics.js';
import { DOM_TRAITS, DOM_TURNS, MEDICINE_PAIRS, MEDICINE_ROLES, POWER_PAIRS, POWER_ROLES, ROMANCE_PAIRS, SCENE, SUB_TRAITS, SUB_TURNS, UNDER_ROLES, periodLines } from '../engine/period.js';
import { effectiveChat } from '../engine/ledger.js';
import { coreLink, moodClash, moodLink, roleLink, tieLink } from '../engine/links.js';
import { cleanAge, heightCm } from '../engine/turns.js';
import { cleanMore, meterWeaveNames } from '../engine/meters.js';
import { MOOD_PACE, SHORT_FUSE, temperPace } from '../engine/moodpace.js';
import { droppedIds } from '../engine/overlap.js';
import { renderPreview, renderStatus } from '../panel/render.js';
import { findPatterns } from '../engine/patterns.js';
import { pronounize } from '../engine/pronouns.js';
import { insightLines, litSkills, skillLines, skillsOf } from '../engine/skills.js';
import { checkLines, sideLit } from '../engine/checks.js';
import { stripWeave, weavePrompt } from '../engine/weave.js';
import { aftermathLines, contagionLine } from '../engine/echoes.js';

// The note is built in full right before every reply (forGeneration). Taps in the panel only ask for a preview
// rebuild, and a burst of taps is folded into one, a moment after the last, so the panel stays quick.
let previewTimer = null;
export function syncPrompt(forGeneration = false, chat = null, type = '') {
    clearTimeout(previewTimer); previewTimer = null;
    if (forGeneration) return buildNote(true, chat, type);
    previewTimer = setTimeout(() => { previewTimer = null; void buildNote(false); }, NOTE_SETTLE_MS);
    return Promise.resolve();
}
const NOTE_SETTLE_MS = 1200;
// Straight away, for a chat being opened or a reply that just arrived (not a tap in the panel).
export function syncPromptNow() { clearTimeout(previewTimer); previewTimer = null; return buildNote(false); }
async function buildNote(forGeneration = false, chat = null, type = '') {
    // The note for a reply in progress stays as it was built; redraw it once that reply is done.
    if (!forGeneration && writingNow()) { run.resyncAfter = true; return; }
    const version = ++run.promptVersion;
    const c = ctx(), ch = target(forGeneration), state = getState(ch), id = identity(ch), mine = getUserState(), story = getStoryState(ch);
    if (run.suspended || !state) {
        clearNotes(c);
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
        // Feelings ended by hand in the last few replies, so the board and the scene drop them too.
        const ended = Object.entries(state.cut ?? {}).filter(([id, at]) => !(state.moods?.[id] > 0) && history.length - at < 12 && BY_ID[id]).map(([id]) => BY_ID[id].label.split('/')[0].trim().toLowerCase());
        const split = settings().splitNote !== false;
        const board = boardPromptLines({ send: boardSend(), live: liveNow, char: name, user: player, n, u, stripped: settings().boardStrip, remember: memories && !bond.on, ended, split });
        const react = reactions(ch, history, liveNow), live = (state.wants ?? []).filter(w => !w.done && w.value > 0 && w.text && !react.done.has(w.id));
        // The current dynamic, worked out once. The story is asked to rename it when it shifts, and
        // both-ways or story lines it already says are left out of this note.
        const bondList0 = bond.on ? bondList(ch, history) : [], bd = bond.on && bond.extra ? computeBond(bond, history.length, n, u, bondAxes(ch), bondList0) : null;
        lastDynamic.set(ch.avatar, bd?.dynamic.group ?? '');
        // Wants from the meters (1.79), sent like hand-written ones while they last.
        const autoW = autoWantsNow(ch, history, bd); live.push(...autoW.live);
        // Picks are listed in the hidden line only up to 25 (about 3 tokens each). Past that the line names it in a
        // few words and the closest of your picks is used, so a big pick list costs nothing extra.
        const storyNames = bd && bond.mode === 'story' && !bond.fixed ? { now: bd.dynamic.name.toLowerCase(), pool: bond.pool.length <= 25 ? bond.pool.map(name => fillDynamic(name, n, u)) : [] } : null;
        const covered = new Set(bd?.dynamic.covers ?? []);
        // One idea, one line. Whatever's doubled up is sent once, from the most specific place.
        const dropped = droppedIds(bondOverlaps(ch, history, bond, bondList0, bd));
        const pairDrop = new Set([...covered, ...dropped.shared]), storyDrop = new Set([...covered, ...dropped.story]);
        const zero = (moods, ids) => Object.fromEntries(Object.entries(moods ?? {}).map(([id, v]) => [id, ids.has(id) ? 0 : v]));
        const youRel = dropped.rel.size ? userRelation(state) : null;
        const stateRel = youRel ? { ...state, relationships: state.relationships.map(r => r === youRel ? { ...r, moods: zero(r.moods, dropped.rel) } : r) } : state;
        const stateNote = autoW.live.length ? { ...stateRel, wants: [...(stateRel.wants ?? []), ...autoW.live] } : stateRel;
        const knows = knowledgeNow(ch, history), notice = Object.entries(mine?.enabled ? mine.prefs ?? {} : {}).some(([id, v]) => v && knowledgeEntry(knows[`turn:${id}`]).mode !== 'known');
        // Secrets (1.79): the hidden line names one only when it moves, so it's listed by short title.
        const sec = secretsNow(ch, history), secTitles = sec && (sec.mine.length || sec.yours.length) ? `Secrets: ${[[n, sec.mine], [u, sec.yours]].filter(([, l]) => l.length).map(([who, l]) => `${who}'s: ${l.map(x => x.title).join('; ')}`).join('. ')}.` : null;
        const weave = bond.on ? weavePrompt({ notice, n, u, bond: true, extra: bond.extra, pace: bond.pace, dynamic: storyNames, moods: bm.feed, feelings: state.moodAuto !== false, moodPace: movePace(ch), moodNames: state.moodScope === 'list' ? listedFeelings(state) : null, remember: memories, wants: live.some(w => ['want', 'goal'].includes(w.kind)),
            fears: live.some(w => w.kind === 'fear'), buttons: live.some(w => w.kind === 'button'), suggest: settings().wantSuggest && settings().wantsTab !== false && live.filter(w => w.kind === 'want').length < 3, you: settings().youTrack, stress: settings().stress !== false, secrets: secTitles, desire: bond.desire?.on === true ? cleanDesire(bond.desire).scales : false, meters: meterWeaveNames(cleanMore(bond.more).on), skills: skillPeople(ch, state, mine).some(p => skillsOf(p.st).length), settle: state.moodAuto !== false ? lingering(ch, history, state) : null, split,
            cast: settings().castAuto !== false && bm.feed ? getCast(ch).filter(p => p.inScene && p.state?.enabled !== false).map(p => shortName(p.name)).filter(Boolean) : [] }) : [];
        // Every skill goes as a short names-and-levels line; the full description only when the scene calls for it.
        const skillScene0 = skillScene(ch, history), skillCtx = skillContext(ch, history, [state, mine, story, ...getCast(ch).filter(p => p.inScene).map(p => p.state)], bd);
        const skillFolk = skillPeople(ch, state, mine).map(p => ({ name: p.name, all: skillsOf(p.st), lit: litSkills(p.st, skillScene0.scene, skillScene0.used, 5, skillCtx), mind: mindOf(p.st), moods: p.st.moods ?? {} }));
        // Dice for the skills in play (Settings \u203a What is sent \u203a Dice checks): rolled once per reply, swipes keep them.
        sideLit(skillFolk);
        const dice = settings().diceOn !== false ? checkLines(skillFolk, (history.length * 7919 + (run.diceSalt ?? 0)) | 0, { player: shortName(playerName()) }) : { lines: [], rolls: [] };
        run.rolls = { avatar: ch.avatar, list: dice.rolls };
        const skills = [...skillLines(skillFolk, u, history.length, n), ...insightLines(skillFolk, skillScene0.scene, history.length), ...dice.lines];
        // Pattern breaker: the character's last five replies, read here, no extra request.
        const patterns = story?.enabled && (story.moods?.pattern_breaker ?? 0) > 0 ? findPatterns(history.filter(m => writes(ch)(m) && !m.is_system).slice(-5).map(m => m.mes), { names: [name, player] }) : [];
        // The count is only a report, so a tokenizer that can't be reached falls back to an estimate
        // instead of pausing the whole note for that reply.
        const count = async text => { try { const n = await c.getTokenCountAsync(text); return Number.isFinite(n) ? n : Math.ceil(text.length / 3.6); } catch { return Math.ceil(text.length / 3.6); } };
        const pairs = pairExtras(ch).map(p => pairDrop.size && p.names[0] === name && p.names[1] === player ? { ...p, moods: zero(p.moods, pairDrop) } : p);
        const storyNote = story && [...storyDrop].some(id => story.moods?.[id] > 0) ? { ...story, moods: zero(story.moods, storyDrop) } : story;
        const links = sceneLinks({ ch, state, mine, story, bond, bd, n, u });
        // Aftermath of a strong feeling that just ended, and the player's feeling rubbing off (Settings \u203a What is sent).
        const newestW = [...history].reverse().find(m => m && !m.is_system && writes(ch)(m)), seemsIds = (newestW ? weaveOf(newestW)?.seems ?? [] : []).map(feelingId).filter(Boolean);
        const close = Boolean(bd && (bd.f >= 41 || bd.r >= 41));
        const echoes = [...(settings().aftermath !== false ? aftermathLines(c.chatMetadata?.[KEY]?.applied?.[`char:${ch.avatar}`] ?? [], state, n) : []),
            contagionLine({ seems: seemsIds, st: state, close, n, u, seed: history.length, mode: settings().contagion }),
            // Stress and breaking points, and how they've come to feel about people the scene brings up (1.79).
            ...stressLines(stressNow(ch, history), n), ...opinionLines(opinionsNow(ch, history), n, skillScene0.scene),
            ...(sec ? secretLines({ ...sec, n, u, scene: skillScene0.scene }) : [])].filter(Boolean);
        const result = await budgetPrompt(stateNote, name, settings().tokenBudget, count, { player: { state: mine, name: player, knowledge: knows, condition: settings().youTrack ? react.condition : [] }, story: storyNote, cast: getCast(ch), pairs, board, blendPlan: settings().blendPlan, lit: react, patterns, showsMode: settings().showsMode,
            standing: withLinks(bondStanding({ bond, chatLength: history.length, n, u, axes: bondAxes(ch), list: bondList0 }), links.links), weave, skills, lenses: links.lenses, pronounLine: pronounLine(ch, bond, n, u), signs: chatSigns(ch, bond), seed: history.length, scene: skillScene0.scene, factsWhenRelevant: settings().factsWhenRelevant !== false, turnsWhenRelevant: settings().turnsWhenRelevant !== false, turnsSend: settings().turnsSend, turnsStrong: settings().turnsStrong === true, turnsEvery: settings().turnsEvery, traitFocus: settings().traitFocus !== false, split, echoes });
        if (version !== run.promptVersion || id !== identity(target(forGeneration))) return;
        // Music \u203a "Let the story feel the music": one line on the music's feel, sent fresh (off by default).
        const musicLine = run.musicLine?.() ?? '';
        if (musicLine) { result.prompt = result.prompt ? `${result.prompt}\n${musicLine}` : musicLine; result.tokens = (result.tokens ?? 0) + Math.ceil(musicLine.length / 4); }
        // In-chat, user role. Depth 0 puts the note after the latest chat message.
        // Preset instructions outside chat history can still follow it.
        c.setExtensionPrompt(PROMPT_KEY, result.prompt, 1, settings().depth, false, 1);
        // The guide sits in the prompt above the chat (system role), so it stays the same text reply after reply and
        // can be cached along with everything before it.
        c.setExtensionPrompt(GUIDE_KEY, result.fixed ?? '', 0, 0, false, 0);
        run.promptInfo = result; renderPreview();
    } catch (err) {
        console.error('[Moodweaver] could not build the note', err);
        clearNotes(c);
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
// Low hunger, energy or comfort on the info board make feelings quicker to flare (\u2699 Settings \u203a Panel can turn it off).
const lowNeeds = ch => settings().needsMood === false ? [] : (liveFor(ch)?.needs ?? []).filter(nd => nd.known && nd.value <= 35 && SHORT_FUSE.includes(nd.id)).map(nd => nd.label.toLowerCase());
export const movePace = ch => temperPace(scenePace(ch), getState(ch)?.moods, lowNeeds(ch));
// What the period does to what's switched on, and how the dynamic meets roles and the strongest feeling.
const strongIn = (moods, ids, min = 41) => ids.some(id => (moods?.[id] ?? 0) >= min);
// "Doctor Easterman is he/him; Lamb is she/her." Only the ones that are known.
function pronounLine(ch, bond, n, u) {
    // "they" goes only when chosen (Non-binary under Info \u203a Profile \u203a Gender), not when Auto couldn't tell.
    const g = pronounsFor(ch, bond), word = { he: 'he/him', she: 'she/her', they: 'they/them' };
    const parts = [[n, g.n, bond.pn], [u, g.u, bond.pu]].filter(([, p, set]) => p !== 'they' ? word[p] : set === 'they').map(([name, p]) => `${name} is ${word[p]}`);
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
// Feelings of the desire family, for telling whether a scene is sexual right now.
const DESIRE = MOODS.filter(m => m.category === 'desire').map(m => m.id);
function sceneLinks({ ch, state, mine, story, bond, bd, n, u }) {
    const g = pronounsFor(ch, bond), rel = userRelation(state), relMoods = { ...(bd ? meterTies(bd) : {}), ...(rel && rel.enabled !== false ? rel.moods ?? {} : {}) };
    // 1.86: feelings that became meters (possessive, trusts) are read back from the meters above, so the links still fire.
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
    // Darker tags between them (keeping someone, possessiveness, gaslighting, stalking, contempt) put the character
    // in charge when nothing else has decided it.
    const dyn = bd?.dynamic.key ?? '', on = (moods, ids) => strongIn(moods, ids);
    const tints = [
        on(relMoods, ['captor_of', 'keeps_them']) || on(pairMoods, ['held_by_threat', 'gilded_cage', 'captor_captive']) || ['Captor', 'Gilded cage', 'Closing the circle', 'Guilty captor', 'Fixated captor', 'Conditioning captor', 'Romantic captor', 'Breaking in'].includes(dyn),
        on(relMoods, ['possessive', 'theyre_mine', 'wants_to_own', 'controls']) || on(pairMoods, ['mutually_possessive']) || ['Owned', 'Trophy', 'Claimed', 'Possession', 'Possessive worship'].includes(dyn),
        on(relMoods, ['manipulates']) || on(state.moods, ['gaslighting']) || ['Gaslit', 'Kept small', 'Puppet strings'].includes(dyn),
        on(relMoods, ['stalks', 'watches_over']) || ['Stalker\u2019s courtship', 'Watcher'].includes(dyn),
        on(state.moods, ['domestic_tyrant', 'womaniser', 'judgemental_misogyny']),
    ].filter(Boolean);
    if (!top && tints.length && byMood >= 0) top = 'n';
    // Is the scene sexual right now, and who is leading in it? Their moods first (taking charge against giving way),
    // then the Control meter, then a top or bottom bed role, and only then whoever holds power in general. So a man
    // with a submissive streak who is on top in this scene is read as leading it.
    const heat = Boolean(bd && bd.dynamic.group === 'heat') || strongIn(state.moods, DESIRE) || strongIn(mine?.moods, DESIRE);
    const bedRole = (strongIn(state.moods, DOM_TRAITS) ? 1 : 0) + (strongIn(mine?.moods, SUB_TRAITS) ? 1 : 0) - (strongIn(mine?.moods, DOM_TRAITS) ? 1 : 0) - (strongIn(state.moods, SUB_TRAITS) ? 1 : 0);
    const bedTop = !heat ? '' : Math.abs(byMood) >= 20 ? (byMood > 0 ? 'n' : 'u') : bd && Math.abs(bd.p) >= 30 ? (bd.p > 0 ? 'n' : 'u') : bedRole ? (bedRole > 0 ? 'n' : 'u') : top;
    // What else is in play: something either of them carries, holds, feels, or that sits on the Story tab.
    const carried = new Set(people.flatMap(([, , st]) => (st?.inventory ?? []).filter(i => i?.carried).flatMap(i => String(i.text ?? '').toLowerCase().split(/[^a-z]+/))));
    const scene = Object.fromEntries(Object.entries(SCENE).map(([key, t]) => [key, people.some(([, , st]) => (t.turns ?? []).some(id => (st?.prefs?.[id] ?? 0) > 40) || strongIn(st?.moods, t.moods ?? []) || (t.skills ?? []).some(id => (st?.skills?.[id] ?? 0) >= 5))
        || (t.items ?? '').split(' ').some(w => carried.has(w))
        || [relMoods, yourSide, pairMoods].some(m => strongIn(m, t.ties ?? [])) || strongIn(story?.enabled ? story.moods : {}, t.story ?? [], 1)]));
    // Lines switched off on each person's Period tab.
    const offs = settings().periodOff?.[`char:${ch.avatar}`] ?? {};
    const you = mine?.enabled ? mine : null;
    const eraAll = era ? periodLines({ era, n, u, g, top, bedTop, heat, romance,
        wed: strongIn(pairMoods, ['married', 'engaged', 'arranged_marriage', 'marriage_of_convenience']),
        medicine: scene.medicine || strongIn(relMoods, MEDICINE_ROLES) || strongIn(yourSide, MEDICINE_ROLES) || strongIn(pairMoods, MEDICINE_PAIRS),
        sub: { n: kinky(state, SUB_TRAITS, SUB_TURNS), u: Boolean(you) && kinky(you, SUB_TRAITS, SUB_TURNS) },
        dom: { n: kinky(state, DOM_TRAITS, DOM_TURNS), u: Boolean(you) && kinky(you, DOM_TRAITS, DOM_TURNS) },
        scene, dynGroup: bd?.dynamic.group ?? '', moods: { n: state.moods ?? {}, u: you?.moods ?? {} }, prefs: { n: state.prefs ?? {}, u: you?.prefs ?? {} },
        ties: { n: { ...pairMoods, ...relMoods }, u: { ...pairMoods, ...yourSide } },
        needs: { n: (liveFor(ch)?.needs ?? []).filter(nd => nd.known && nd.value <= 35).map(nd => nd.id), u: [] },
        ages: { n: cleanAge(state.age), u: you ? cleanAge(you.age) : 0 }, heights: { n: heightCm(state.height), u: you ? heightCm(you.height) : 0 },
        off: { n: new Set(offs.n ?? []), u: new Set(offs.u ?? []) }, cap: Number(settings().eraLines) || 3, seed: ctx().chat?.length ?? 0 })
        .map(x => ({ ...x, text: pronounize(x.text, n, u) })) : [];
    // Every period line that applies, with the ones sent marked, for the Period tab's "Lines now".
    run.eraNow = { avatar: ch.avatar, lines: eraAll };
    const lenses = eraAll.filter(x => x.sent).map(x => `- ${x.label}: ${x.text}`);
    const links = [];
    if (bd) {
        const role = roleLink({ ...pairMoods, ...relMoods }, bd.dynamic, n, u); if (role) links.push(pronounize(role, n, u));
        const tie = tieLink({ ...pairMoods, ...relMoods }, { ...pairMoods, ...yourSide }, bd.dynamic, n, u); if (tie) links.push(pronounize(tie, n, u));
        const core = coreLink([...(state.beliefs ?? []), ...(state.core ?? [])].filter(id => (state.moods?.[id] ?? 0) > 0), bd.dynamic, top, n, u); if (core) links.push(pronounize(core, n, u));
        const topMood = MOODS.filter(m => analysed(m) && (state.moods?.[m.id] ?? 0) > 0).sort((a, b) => state.moods[b.id] - state.moods[a.id])[0];
        const mood = topMood ? moodLink({ label: topMood.label, family: topMood.category, value: state.moods[topMood.id] }, bd.dynamic, n) : '';
        if (mood && links.length < 3) links.push(pronounize(mood, n, u));
    }
    // Where their moods don't match right now: one line at most, and only on some replies.
    const word = id => (BY_ID[id]?.label ?? id).split('/')[0].trim().toLowerCase();
    const clash = mine?.enabled ? moodClash({ n: state.moods, u: mine.moods }, { n, u }, word, settings().moodClash, ctx().chat?.length ?? 0) : '';
    if (clash) links.push(pronounize(clash, n, u));
    return { lenses, links };
}
// The feelings on a character's list, as the plain names the hidden line uses (first part of the label).
// Feelings the hidden line keeps raising: named rising in 4 or more of the character's last 8 lines, never lowered,
// and still at clear or above. Read from the chat, so swipes and edits count as they are now.
export function lingering(ch, history, st) {
    const lines = history.filter(m => writes(ch)(m) && !m.is_system).map(weaveOf).filter(Boolean).slice(-8), up = {}, down = new Set();
    for (const w of lines) for (const x of w.moods) { const id = feelingId(x.name); if (!id) continue; if (x.delta > 0) up[id] = (up[id] ?? 0) + 1; else down.add(id); }
    return Object.keys(up).filter(id => up[id] >= 4 && !down.has(id) && (st.moods?.[id] ?? 0) >= 41 && !st.pins?.[id] && BY_ID[id]).map(id => BY_ID[id].label.split('/')[0].trim().toLowerCase());
}
export function listedFeelings(st) {
    const ids = new Set([...(st.loadout ?? []), ...Object.keys(st.moods ?? {}).filter(id => st.moods[id] > 0)]);
    return [...ids].map(id => BY_ID[id]).filter(m => m && analysed(m)).map(m => m.label.split('/')[0].trim().toLowerCase());
}
// ---- Skills ----
// Who can have skills in this reply: the character, your character and the cast in the scene.
// Someone's Mind settings at mild or above, for a mind-reading skill to notice (strongest first).
const mindOf = st => Object.entries(st?.moods ?? {}).filter(([id, v]) => v >= 21 && BY_ID[id] && sectionOf(BY_ID[id]) === 'psyche')
    .map(([id, v]) => { const m = BY_ID[id]; return { label: m.label, words: m.words, v, side: m.light && m.dark ? (st.psyLean?.[id] === 'light' ? 'light' : 'dark') : '' }; }).sort((a, b) => b.v - a.v);
function skillPeople(ch, state, mine) {
    return [{ name: shortName(ch?.name ?? ''), st: state }, { name: shortName(playerName()), st: mine },
        ...getCast(ch).filter(p => p.inScene).map(p => ({ name: shortName(p.name), st: p.state }))].filter(p => p.st?.enabled);
}
// What's happening, as tokens a skill's `when` can match: feel:<mood category> and mind for anyone in the scene
// at mild or above, cat:<fact category> and fact:<id> for facts and settings, dyn:<group> for the dynamic, and
// seems / power when the newest hidden line read the player's feelings or a shift in control.
// The Skills tab's lit list for one person, with the character and you sorted out by who is doing what (sideLit).
export function panelLit(ch, state, who = '') {
    const { scene, used } = skillScene(ch, liveChat()), cx = panelSkillContext(ch), lit = st => litSkills(st, scene, used, 5, cx);
    if (!['char', 'user'].includes(who)) return lit(state);
    const his = who === 'char' ? state : getState(ch), mine = who === 'user' ? state : getUserState();
    if (!his?.enabled || !mine?.enabled) return lit(state);
    const folk = [{ lit: lit(his), moods: his.moods ?? {} }, { lit: lit(mine), moods: mine.moods ?? {} }];
    sideLit(folk);
    return folk[who === 'char' ? 0 : 1].lit;
}
// The same, for the Skills tab: from the saved states and the dynamic the last note worked out.
export const panelSkillContext = (ch, history = liveChat()) => skillContext(ch, history, [getState(ch), getUserState(), getStoryState(ch), ...getCast(ch).filter(p => p.inScene).map(p => p.state)], { dynamic: { group: lastDynamic.get(ch?.avatar) ?? '' } });
function skillContext(ch, history, states, bd) {
    const out = new Set(), newest = [...(history ?? [])].reverse().find(m => m && !m.is_system && writes(ch)(m)), w = newest ? weaveOf(newest) : null;
    if (w?.seems?.length) out.add('seems');
    if (w?.hasPower) out.add('power');
    if (bd?.dynamic?.group) out.add(`dyn:${bd.dynamic.group}`);
    for (const st of states) {
        if (!st?.enabled) continue;
        for (const [id, v] of Object.entries(st.moods ?? {})) {
            const m = BY_ID[id]; if (!m || !(v >= 21)) continue;
            const where = sectionOf(m);
            if (where === 'psyche') out.add('mind');
            else if (m.kind === 'mood' && where === 'mood') out.add(`feel:${m.category}`);
            else if (m.kind === 'state') { out.add(`cat:${m.category}`); out.add(`fact:${id}`); }
            else out.add(`fact:${id}`);
        }
    }
    return out;
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
