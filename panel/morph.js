// Redraw by difference (2.0.40). The panel is still built as one piece of HTML, but instead of throwing the old
// page away and building every part again, the new HTML is laid over the old one and only what differs is
// changed: a tapped moon, a count, a chip. Everything else stays exactly as it was on screen, so a tap costs the
// phone a few changes instead of a whole tab, glows and fades don't restart, and the scroll never moves.

// Rows and groups are matched by these, so a row that moved (a new chip at the front, a re-sorted list) is
// moved, not rebuilt.
const KEYS = ['id', 'data-mood', 'data-relation-row', 'data-skill-row', 'data-memory-row', 'data-knowledge-row', 'data-jump', 'data-category',
    'data-relation-group', 'data-skill-group', 'data-peer', 'data-tab', 'data-dock', 'data-anchor', 'data-bond-kind', 'data-moon', 'data-range-moon', 'data-pill'];
// Classes the panel adds by itself after drawing, kept through a redraw.
const LIVE_CLASSES = ['mw-tapglow'];

const keyOf = el => {
    if (el.nodeType !== 1) return '';
    for (const k of KEYS) { const v = el.getAttribute(k); if (v != null) return `${k}=${v}`; }
    return '';
};
const same = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && keyOf(a) === keyOf(b)));

function syncAttributes(a, b) {
    for (const { name } of [...a.attributes]) {
        if (b.hasAttribute(name)) continue;
        if (name === 'open' && a.tagName === 'DETAILS') continue; // what's open stays as you left it
        a.removeAttribute(name);
    }
    for (const { name, value } of [...b.attributes]) {
        if (name === 'open' && a.tagName === 'DETAILS') continue;
        if (name === 'class') {
            const live = LIVE_CLASSES.filter(c => a.classList.contains(c));
            const want = live.length ? `${value} ${live.join(' ')}`.trim() : value;
            if (a.getAttribute('class') !== want) a.setAttribute('class', want);
            continue;
        }
        if (a.getAttribute(name) !== value) a.setAttribute(name, value);
    }
}

function morphNode(a, b) {
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    // A page sliding in from the side (a new tab) is drawn fresh, so its slide plays.
    if (b.getAttribute('data-anim')) { a.replaceWith(b); return; }
    const focused = a === document.activeElement;
    if (a.tagName === 'SELECT') {
        const pick = [...b.options].find(o => o.hasAttribute('selected'))?.value;
        syncAttributes(a, b); morphChildren(a, b);
        if (!focused && pick !== undefined && a.value !== pick) a.value = pick;
        return;
    }
    syncAttributes(a, b);
    if (a.tagName === 'INPUT') {
        if (!focused) {
            const v = b.getAttribute('value') ?? ''; if (a.type !== 'checkbox' && a.type !== 'radio' && a.value !== v) a.value = v;
            const on = b.hasAttribute('checked'); if (a.checked !== on) a.checked = on;
        }
        return;
    }
    if (a.tagName === 'TEXTAREA') { if (!focused && a.value !== b.value) a.value = b.value; return; }
    morphChildren(a, b);
}

export function morphChildren(oldParent, newParent) {
    let at = oldParent.firstChild;
    for (const next of [...newParent.childNodes]) {
        if (at && same(at, next)) { const here = at; at = at.nextSibling; morphNode(here, next); continue; }
        const k = keyOf(next);
        if (k) {
            let found = at?.nextSibling;
            while (found && !(found.nodeType === 1 && same(found, next))) found = found.nextSibling;
            if (found) { oldParent.insertBefore(found, at); morphNode(found, next); continue; }
        }
        oldParent.insertBefore(next, at);
    }
    while (at) { const gone = at; at = at.nextSibling; gone.remove(); }
}
