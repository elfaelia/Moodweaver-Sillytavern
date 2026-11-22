// Fill in a missing hidden line (1.91). Now and then a reply comes back without the weave line at the end,
// so nothing it did reaches Moodweaver. When the newest reply has none, a button sits under it in the chat:
// one tap asks the roleplay model (your main connection, your preset and the whole chat, like a normal
// reply) for only that line, and adds it to the end of the reply, where it's read like any other.
// Settings \u203a What is sent \u203a "Offer to add a missing hidden line" hides the button.
import { members, target } from './chat.js';
import { writingNow } from './note.js';
import { bondData } from './replies.js';
import { settings } from './settings.js';
import { ctx, run } from './state.js';
import { hasWeave } from '../engine/weave.js';

const CHIP = 'mw-fillin';
// Opus 5.5 takes instructions literally: one job, the exact shape, and nothing else to write.
const ASK = '[Moodweaver, out of character: your last reply above ended without its hidden line. Write that line now, for that reply only, exactly as the Moodweaver notes describe: one line starting <!-- weave: and ending -->, with only what that reply changed. Write nothing else: no story, no comments, no explanation.]';
const FOUND = /<!--\s*(?:weave|bond)\s*:[\s\S]*?-->/i;

// Who wrote the newest message, when it's a character's reply that should have had a line.
function missing() {
    const chat = ctx().chat ?? [];
    let i = chat.length - 1;
    while (i >= 0 && chat[i]?.is_system) i--;
    const m = chat[i];
    if (!m || m.is_user || typeof m.mes !== 'string' || !m.mes.trim() || hasWeave(m.mes)) return null;
    // The opening message never has one: only replies to something you wrote count.
    if (!chat.slice(0, i).some(x => x?.is_user && !x.is_system)) return null;
    const writer = ctx().groupId ? members().find(w => w.name === m.name) : target();
    if (!writer || !bondData(writer).on) return null;
    return { i, m };
}

// The model's answer as a clean weave line: the comment itself, or a bare "weave: \u2026" it forgot to wrap.
export function lineFrom(text) {
    const s = String(text ?? '');
    const hit = s.match(FOUND);
    if (hit) return hit[0].replace(/\s+/g, ' ').replace(/^<!--\s*bond\s*:/i, '<!-- weave:');
    const bare = s.match(/(?:^|\n)\s*`*\s*weave\s*:\s*([^\n]+)/i);
    if (bare) { const body = bare[1].replace(/`+\s*$/, '').replace(/-->\s*$/, '').trim(); if (body) return `<!-- weave: ${body} -->`; }
    return '';
}

function clearChips() { for (const node of document.querySelectorAll(`.${CHIP}`)) node.remove(); }

let timer = null;
// The reply whose last try came back without a line, so the redrawn button says so.
const lastFail = { mes: null };
export const queueFillIn = () => { clearTimeout(timer); timer = setTimeout(drawChip, 400); };
function drawChip() {
    if (typeof document === 'undefined') return;
    // A fill-in in progress keeps its own button (its quiet request fires the same events).
    if (run.fillIn) return;
    clearChips();
    if (run.suspended || settings().fillInChip === false || writingNow() || document.body?.dataset?.generating === 'true') return;
    const gap = missing(); if (!gap) return;
    const block = document.querySelector(`#chat .mes[mesid="${gap.i}"] .mes_block`); if (!block) return;
    const box = document.createElement('div');
    box.className = CHIP;
    const failed = lastFail.mes === gap.m.mes;
    box.innerHTML = `<button type="button" class="mw-fillin-btn">\u25c6 ${failed ? 'Try again' : 'Add the hidden line'}</button><small>${failed ? 'The model answered without a hidden line last time. Tap to try again.' : 'This reply came without Moodweaver\u2019s hidden line, so nothing in it has moved their feelings yet.'}</small>`;
    box.querySelector('button').addEventListener('click', () => void fillIn(gap.i, box));
    block.append(box);
}

export async function fillIn(index, box = null) {
    const c = ctx(), m = c.chat?.[index];
    if (!m || run.fillIn || hasWeave(m.mes)) return;
    const before = m.mes, button = box?.querySelector('button'), small = box?.querySelector('small');
    const say = text => { if (small) small.textContent = text; };
    if (button) { button.disabled = true; button.textContent = '\u25c6 Writing the hidden line\u2026'; }
    say('Asking for the line only. The story itself isn\u2019t touched.');
    run.fillIn = true;
    let text = '';
    try {
        text = await c.generateQuietPrompt({ quietPrompt: ASK, responseLength: 600 });
    } catch (err) {
        console.warn('[Moodweaver] fill-in failed', err);
        text = '';
    } finally { run.fillIn = false; }
    // The chat moved on (a swipe, an edit, a new message) while it was being written: leave it alone.
    if (ctx().chat?.[index] !== m || m.mes !== before) { queueFillIn(); return; }
    const line = lineFrom(text);
    if (!line) {
        lastFail.mes = m.mes;
        if (button) { button.disabled = false; button.textContent = '\u25c6 Try again'; }
        say('The model answered without a hidden line. Tap to try again.');
        return;
    }
    m.mes = `${m.mes.replace(/\s+$/, '')}\n\n${line}`;
    if (Array.isArray(m.swipes) && Number.isInteger(m.swipe_id) && typeof m.swipes[m.swipe_id] === 'string') m.swipes[m.swipe_id] = m.mes;
    c.updateMessageBlock?.(index, m);
    await c.saveChatConditional?.();
    // Read like an edited reply: the line moves feelings, meters and the rest straight away.
    await c.eventSource.emit(c.eventTypes.MESSAGE_EDITED, index);
    clearChips();
    globalThis.toastr?.success('Hidden line added to the last reply.', 'Moodweaver', { timeOut: 2500 });
}
