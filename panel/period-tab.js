// The Period tab (Self section): every 1950s\u201360s period line written for this person's gender, by category, each
// one tappable on or off for them. A line only goes with a reply when something on the cards wakes it and it is
// on here. The top holds how many lines go a reply, three quick presets, and the lines that apply right now.
import { getStoryState, playerName } from '../app/chat.js';
import { bondData, pronounsFor } from '../app/replies.js';
import { settings } from '../app/settings.js';
import { run, ui } from '../app/state.js';
import { MOODS } from '../data/catalogue.js';
import { PERIOD, PERIOD_CATS } from '../data/catalogue/period.js';
import { ERA_LINE_CHOICES, periodEra, periodText } from '../engine/period.js';
import { escapeHtml as esc, shortName } from '../engine/util.js';

// Which of the pair this tab is about: 'n' the character, 'u' your character.
export const periodWho = () => ui.who === 'user' ? 'u' : 'n';
export const periodOff = (ch, k) => new Set(settings().periodOff?.[`char:${ch.avatar}`]?.[k] ?? []);
// The lines written for this person: their gender's own, plus the ones for anyone.
export const periodFor = gender => PERIOD.filter(line => periodText(line, gender));
const GENDER = { he: 'men', she: 'women' };

export function periodView(state, ch) {
    const k = periodWho(), o = k === 'n' ? 'u' : 'n';
    const names = { n: shortName(ch.name), u: shortName(playerName()) }, gender = pronounsFor(ch, bondData(ch))[k];
    const story = getStoryState();
    const era = story?.enabled ? MOODS.filter(m => m.category === 'era' && (story.moods?.[m.id] ?? 0) > 0).sort((a, b) => story.moods[b.id] - story.moods[a.id])[0] : null;
    const lines = periodFor(gender), off = periodOff(ch, k), on = lines.filter(l => !off.has(l.id)).length;
    const fill = text => text.replace(/\{who\}/g, names[k]).replace(/\{other\}/g, names[o]).replace(/\{age\}/g, state.age ? String(state.age) : 'their age');
    const pick = `<label class="mw-field mw-era-lines">Period lines per reply<select data-setting-choice="eraLines" aria-label="Period lines per reply">${ERA_LINE_CHOICES.map(String).map(v => `<option value="${v}" ${settings().eraLines === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`;
    const eraNote = !era ? '<p class="mw-fine mw-period-warn">Switch on the 1950s or 1960s (America) on the Story tab and these lines start going with replies.</p>'
        : !periodEra(era.id) ? `<p class="mw-fine mw-period-warn">The story is set in the ${esc(era.label)}. These lines are written for 1950s\u201360s America, so they only go when that period is on.</p>` : '';
    const presets = `<div class="mw-period-presets" role="group" aria-label="Quick choices for ${esc(names[k])}">
        <button type="button" data-period-preset="all">\u2713 All on</button>
        <button type="button" data-period-preset="apart">\u25d0 Kept apart <span>no job, money, neighbours or going out</span></button>
        <button type="button" data-period-preset="none">\u25cb All off</button></div>`;
    const now = run.eraNow?.avatar === ch.avatar ? run.eraNow.lines.filter(x => x.who === k) : [];
    const nowBox = `<details class="mw-era-now" data-anchor="period-now"><summary><span>Lines about ${esc(names[k])} now</span><small>${now.length ? `${now.length} apply \u00b7 ${now.filter(x => x.sent).length} sent` : 'none'}</small></summary>
        ${now.length ? `<ol class="mw-era-list">${now.map(x => `<li class="${x.sent ? 'is-sent' : ''}"><b>${x.sent ? '\u2713 ' : ''}${esc(x.label)}</b> ${esc(x.text)}</li>`).join('')}</ol>
        <p class="mw-fine">\u2713 went with the latest note. The strongest line always goes; the rest take turns from reply to reply.</p>` : '<p class="mw-fine">Nothing on the cards wakes a line about them right now.</p>'}</details>`;
    const cats = PERIOD_CATS.map(([cat, title]) => {
        const mine = lines.filter(l => l.cat === cat); if (!mine.length) return '';
        const count = mine.filter(l => !off.has(l.id)).length, subs = [...new Set(mine.map(l => l.sub))];
        return `<details class="mw-period-cat" data-anchor="period-${cat}"><summary><span>${esc(title)}</span><small>${count} of ${mine.length} on</small></summary>
            <button type="button" class="mw-period-catbtn" data-period-cat="${cat}" data-period-to="${count ? 'off' : 'on'}">${count ? 'Switch all of these off' : 'Switch all of these on'}</button>
            ${subs.map(sub => `<h4 class="mw-period-sub">${esc(sub)}</h4>${mine.filter(l => l.sub === sub).map(l => {
                const isOn = !off.has(l.id);
                return `<button type="button" class="mw-period-line ${isOn ? 'is-on' : 'is-off'}" data-period-line="${esc(l.id)}" aria-pressed="${isOn}"><b>${isOn ? '\u2713' : '\u25cb'} ${esc(l.label)}${l.world ? ' <i>everyday life</i>' : ''}</b><span>${esc(fill(periodText(l, gender)))}</span></button>`;
            }).join('')}`).join('')}</details>`;
    }).join('');
    return `<section class="mw-period" aria-label="Period lines">
        <div class="mw-summary mw-hero" data-chapter="period"><i class="mw-hero-art" aria-hidden="true"></i><div class="mw-section-label">The era<span>${on} of ${lines.length} lines on for ${esc(names[k])}</span></div><p class="mw-hero-empty">How the world of 1950s\u201360s America treats ${esc(names[k])}${GENDER[gender] ? `, from the lines written for ${GENDER[gender]} and for anyone` : ', from the lines written for anyone (set Man or Woman under Facts \u203a Profile \u203a Gender for more)'}. A line only goes with a reply when something on the cards wakes it. Tap one to switch it off for ${esc(names[k])}.</p></div>
        ${eraNote}${pick}${presets}
        ${nowBox}${cats}</section>`;
}
