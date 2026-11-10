// What each reply changed, kept by the reply itself instead of by its position in the chat.
// SillyTavern 1.19 stamps every reply (and every swipe) with an ISO send_date down to the millisecond,
// so "send_date + the hidden line" names one swipe of one reply. Deleting an older message no longer
// shifts anything, a swipe is a different reply, and fixing a typo in the prose changes nothing.
import { weaveLines } from './weave.js';

function hash(text) {
    let h = 2166136261;
    const s = String(text ?? '');
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36);
}
const stamp = m => String(m?.send_date ?? '').slice(0, 40);
export const weaveKey = m => `w|${stamp(m)}|${hash(weaveLines(m?.mes).join('\n'))}`;

// A swipe that is still being written. SillyTavern moves swipe_id one past the saved swipes and keeps
// the old swipe's text in the message until the new one starts streaming, so for that moment the
// chat still "contains" the reply being replaced. Nothing it did should count.
const pendingSwipe = m => Boolean(m) && !m.is_user && Array.isArray(m.swipes) && typeof m.swipe_id === 'number' && m.swipe_id >= m.swipes.length;
// The chat as it stands for the reply about to be written. type is SillyTavern's generation type.
export function effectiveChat(chat, type = '') {
    const list = Array.isArray(chat) ? chat : [];
    const last = list[list.length - 1];
    if (last && !last.is_user && (type === 'swipe' || pendingSwipe(last))) return list.slice(0, -1);
    return list;
}

// records: oldest first, each { k: key, ... }. Replies at the end that no longer exist (swiped away,
// regenerated, deleted, edited) are undone newest first, as far back as they go. A reply missing from
// further back (an old message deleted to save space) is only forgotten: later replies were built on
// top of it, so pulling it out would undo things that still stand.
export function settle(records, isLive, undo) {
    const out = Array.isArray(records) ? [...records] : [];
    let undone = 0;
    while (out.length && !isLive(out[out.length - 1].k)) { undo(out.pop()); undone++; }
    const kept = out.filter(r => isLive(r.k));
    return { kept, undone, forgot: out.length - kept.length };
}

// Applies { id, delta } changes to target and records [before, after] for each id it moved.
// target: { get(id), set(id, value), pinned(id) }. resolve(name, delta) → id or null.
export function track(target, list, resolve, clamp = (v) => Math.max(0, Math.min(100, v))) {
    const moved = {};
    for (const { name, delta } of list ?? []) {
        const id = resolve(name, delta); if (!id || target.pinned(id) || id in moved) continue;
        const old = target.get(id) ?? 0, value = clamp(old + (old === 0 && delta > 0 ? Math.max(delta, 10) : delta));
        if (value === old) continue;
        moved[id] = [old, value]; target.set(id, value);
    }
    return moved;
}
// Puts back what a record moved, unless the player has moved it since (then it's theirs) or pinned it.
export function untrack(target, moved) {
    const back = [];
    for (const [id, [before, after]] of Object.entries(moved ?? {})) {
        if (target.pinned(id) || (target.get(id) ?? 0) !== after) continue;
        target.set(id, before); back.push(id);
    }
    return back;
}
// What changed between two value maps, as [before, after] pairs.
export function diff(before, after) {
    const out = {};
    for (const id of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
        const a = before?.[id] ?? 0, b = after?.[id] ?? 0;
        if (a !== b) out[id] = [a, b];
    }
    return out;
}
