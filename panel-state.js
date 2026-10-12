// Keep UI state outside chat data. A redraw must not move the item being edited.
const views = new Map();
const tracked = '[data-mood], [data-relation-row], [data-custom-row], [data-memory-row], [data-knowledge-row]';
const keyOf = element => {
    if (!element) return '';
    if (element.id) return `#${CSS.escape(element.id)}`;
    const attr = [...element.attributes].find(a => a.name.startsWith('data-'));
    return attr ? `${element.localName}[${attr.name}="${CSS.escape(attr.value)}"]` : element.matches('details') && element.classList.length ? `details.${CSS.escape(element.classList[0])}` : '';
};
export function capturePanel(panel) {
    if (!panel.dataset.view) return;
    const previous = views.get(panel.dataset.view);
    const focused = panel.contains(document.activeElement) ? document.activeElement : null;
    const bounds = panel.getBoundingClientRect();
    const visible = el => el && el.getClientRects().length && el.getBoundingClientRect().bottom > bounds.top && el.getBoundingClientRect().top < bounds.bottom;
    const focusedRow = focused?.closest(tracked);
    const anchor = visible(focusedRow) ? focusedRow : [...panel.querySelectorAll(tracked)].find(visible);
    const searches = Object.fromEntries([...panel.querySelectorAll('input[type="search"]')].map(el => [keyOf(el), el.value]));
    const filtering = Object.values(searches).some(v => v.trim());
    const details = { ...previous?.details };
    for (const el of panel.querySelectorAll('details')) {
        // Search temporarily opens matching groups; don't mistake that for a user choice.
        if (filtering && (el.hasAttribute('data-category') || el.hasAttribute('data-relation-group'))) continue;
        const key = keyOf(el); if (key) details[key] = el.open;
    }
    const snapshot = {
        searches, details, scroll: panel.scrollTop, anchor: keyOf(anchor),
        offset: anchor ? anchor.getBoundingClientRect().top - bounds.top : 0,
        focus: keyOf(focused), start: focused?.selectionStart, end: focused?.selectionEnd,
        nested: [...panel.querySelectorAll('.mw-people, .mw-peers, pre')].map(el => ({ selector: keyOf(el) || `.${el.classList[0]}`, left: el.scrollLeft, top: el.scrollTop })),
    };
    views.delete(panel.dataset.view); views.set(panel.dataset.view, snapshot);
    if (views.size > 100) views.delete(views.keys().next().value);
}
export function savedPanel(view) { return views.get(view); }
export function restorePanelFields(panel, snapshot) {
    if (!snapshot) return;
    for (const [selector, value] of Object.entries(snapshot.searches)) { const el = panel.querySelector(selector); if (el) el.value = value; }
    for (const [selector, open] of Object.entries(snapshot.details)) { const el = panel.querySelector(selector); if (el) el.open = open; }
}
export function restorePanelPosition(panel, snapshot, sameView) {
    if (!snapshot) { panel.scrollTop = 0; return; }
    for (const pos of snapshot.nested) { const el = panel.querySelector(pos.selector); if (el) { el.scrollLeft = pos.left; el.scrollTop = pos.top; } }
    if (sameView && snapshot.focus) {
        const el = panel.querySelector(snapshot.focus);
        if (el && el.getClientRects().length) {
            el.focus({ preventScroll: true });
            if (snapshot.start != null && typeof el.setSelectionRange === 'function') el.setSelectionRange(snapshot.start, snapshot.end);
        }
    }
    panel.scrollTop = snapshot.scroll;
    const anchor = sameView && snapshot.anchor ? panel.querySelector(snapshot.anchor) : null;
    if (anchor?.getClientRects().length) panel.scrollTop += anchor.getBoundingClientRect().top - panel.getBoundingClientRect().top - snapshot.offset;
}
export function restoreGroupOpen(group, snapshot, fallback = false) {
    group.open = snapshot?.details[keyOf(group)] ?? fallback;
}
export function clearPanelSearch(panel, selector) {
    const input = panel.querySelector(selector); if (input) input.value = '';
    const snapshot = views.get(panel.dataset.view);
    if (snapshot && input) snapshot.searches[keyOf(input)] = '';
}
export function rememberGroupChoice(panel, group) {
    capturePanel(panel);
    const snapshot = savedPanel(panel.dataset.view), key = keyOf(group);
    if (snapshot && key) snapshot.details[key] = !group.open;
}
