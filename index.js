import { CATEGORIES, MOODS, RECIPES, activeMoods, freshState, extendCatalogue, level, escapeHtml as esc, clamp, budgetPrompt, parseAnalysis, blendAnalysis, sceneData, analysisMessages, fingerprint } from './core.js';

const KEY = 'moodweaver';
const PROMPT_KEY = 'moodweaver-state';
const ctx = () => SillyTavern.getContext();
const defaults = { tokenBudget: 500, depth: 1, sceneMessages: 8, sceneChars: 12000, outputTokens: 800, baselines: {}, promptVersion: 2 };
let panel, selectedAvatar = '', pending = null, promptVersion = 0, suspended = false;
let promptInfo = { prompt: '', tokens: 0, omitted: 0 }, status = '', search = '';
const generationSnapshots = new Map();
const openCategories = new Set();

function settings() {
    const c = ctx();
    c.extensionSettings[KEY] ??= structuredClone(defaults);
    const saved = c.extensionSettings[KEY];
    // The v2 prompt explains each strength tier in words, so the old 320 default is too tight.
    if ((saved.promptVersion ?? 1) < 2) { if ((saved.tokenBudget ?? 320) === 320) saved.tokenBudget = 500; saved.promptVersion = 2; }
    return Object.assign(saved, {
        tokenBudget: clamp(saved.tokenBudget ?? 500, 160, 1500),
        depth: clamp(saved.depth ?? 1, 0, 10),
        sceneMessages: clamp(c.extensionSettings[KEY].sceneMessages ?? 8, 2, 30),
        sceneChars: clamp(c.extensionSettings[KEY].sceneChars ?? 12000, 2000, 40000),
        outputTokens: clamp(c.extensionSettings[KEY].outputTokens ?? 800, 300, 4000),
        baselines: c.extensionSettings[KEY].baselines ?? {},
    });
}
function members() {
    const c = ctx();
    if (c.groupId) {
        const group = c.groups.find(g => String(g.id) === String(c.groupId));
        return c.characters.filter(ch => group?.members?.includes(ch.avatar));
    }
    return c.characters[c.characterId] ? [c.characters[c.characterId]] : [];
}
function target(forGeneration = false) {
    const c = ctx(), choices = members();
    if (forGeneration && c.characters[c.characterId] && choices.includes(c.characters[c.characterId])) return c.characters[c.characterId];
    return choices.find(ch => ch.avatar === selectedAvatar) ?? choices[0];
}
function identity(ch = target()) {
    return `${ctx().groupId || ''}/${ctx().chatId || ''}/${ch?.avatar || ''}`;
}
function getState(ch = target()) {
    const c = ctx();
    if (!ch || !c.chatId) return null;
    c.chatMetadata[KEY] ??= { version: 1, characters: {} };
    const key = `char:${ch.avatar}`;
    const state = c.chatMetadata[KEY].characters[key] ??= freshState(settings().baselines[key]);
    return extendCatalogue(state);
}
function profiles() {
    try { return ctx().ConnectionManagerRequestService.getSupportedProfiles(); } catch { return []; }
}
async function persist(state) {
    if (state) state.revision = (state.revision || 0) + 1;
    try { await ctx().saveMetadata(); } catch { status = 'Could not save chat metadata. Try again before switching chats.'; renderStatus(); }
}
async function syncPrompt(forGeneration = false) {
    const version = ++promptVersion;
    const c = ctx(), ch = target(forGeneration), state = getState(ch), id = identity(ch);
    if (suspended || !state?.enabled) {
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        promptInfo = { prompt: '', tokens: 0, omitted: 0 }; renderPreview(); return;
    }
    try {
        const result = await budgetPrompt(state, String(ch.name).slice(0, 100), settings().tokenBudget, text => c.getTokenCountAsync(text));
        if (version !== promptVersion || id !== identity(target(forGeneration))) return;
        // In-chat, user role. Depth 1 sits just before your latest message, so your own words stay the last thing
        // the model reads and the mood reads as standing context rather than a fresh request.
        c.setExtensionPrompt(PROMPT_KEY, result.prompt, 1, settings().depth, false, 1);
        promptInfo = result; renderPreview();
    } catch {
        c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        promptInfo = { prompt: '', tokens: 0, omitted: 0 };
        renderPreview();
        status = 'Token counting failed; mood injection is paused until it succeeds.'; renderStatus();
    }
}
function renderPreview() {
    if (!panel) return;
    const count = panel.querySelector('[data-token-count]');
    if (count) count.textContent = `${promptInfo.tokens} counted tokens · ${promptInfo.selectedIds?.length || 0} active states sent`;
    const preview = panel.querySelector('[data-preview]');
    if (preview) preview.textContent = promptInfo.prompt || 'No mood directions are being sent.';
    const audit = panel.querySelector('[data-audit]');
    if (audit) audit.textContent = `Every active mood is sent, grouped under the same strength words shown on the sliders. Numbers are not sent.\nFormat: ${promptInfo.compact ? 'compact (moods on one line per band)' : 'full'} · user role · depth ${settings().depth}${promptInfo.overBudget ? `\n${promptInfo.overBudget} tokens above the ${promptInfo.target}-token target; nothing was dropped.` : ''}`;
    const last = panel.querySelector('[data-last-prompt]');
    if (last) {
        const snapshot = generationSnapshots.get(identity());
        last.textContent = snapshot ? `${snapshot.at}\n${snapshot.prompt || '(No mood injection)'}` : 'No generation prepared for this chat/character since this page loaded.';
    }
    const warning = panel.querySelector('[data-budget-warning]');
    if (warning) {
        warning.hidden = !promptInfo.overBudget;
        warning.textContent = `Full blend kept: ${promptInfo.tokens} tokens (${promptInfo.overBudget} above target). Details are in “What is sent to the model?”`;
    }
}
function renderStatus() {
    if (panel?.querySelector('[data-status]')) panel.querySelector('[data-status]').textContent = status;
}
function cancelAnalysis() {
    pending?.controller.abort();
}
async function analyse(ch = target(), force = false) {
    const state = getState(ch), c = ctx();
    if (suspended || !state || !state.enabled || pending) return;
    if (!state.profile) { status = 'Choose an analyser connection profile first.'; renderStatus(); return; }
    const snapshot = identity(ch), revision = state.revision, metadata = c.chatMetadata;
    const fp = fingerprint(c.chat), userCount = c.chat.filter(m => m.is_user && !m.is_system).length;
    if (!force && (fp === state.lastFingerprint || (state.lastUserCount >= 0 && userCount > state.lastUserCount && userCount - state.lastUserCount < state.interval))) return;
    const controller = new AbortController();
    pending = { controller, snapshot };
    const timer = setTimeout(() => controller.abort(), 45000);
    status = 'Reading the scene…'; render();
    try {
        const service = c.ConnectionManagerRequestService;
        // No fallback to the main model: a missing or invalid profile is an error.
        const response = await service.sendRequest(state.profile,
            analysisMessages(sceneData(c.chat, ch, state, settings())), settings().outputTokens,
            { stream: false, signal: controller.signal, extractData: true, includePreset: false, includeInstruct: true });
        if (controller.signal.aborted || metadata !== ctx().chatMetadata || snapshot !== identity(ch) || revision !== state.revision || fp !== fingerprint(ctx().chat)) {
            status = 'Scene or controls changed; the old analysis was discarded.'; return;
        }
        const result = parseAnalysis(response?.content ?? '');
        state.history = [...(state.history || []).slice(-9), { moods: { ...state.moods }, reason: state.reason, updatedAt: state.updatedAt }];
        state.moods = blendAnalysis(state, result);
        state.reason = result.reason; state.updatedAt = Date.now(); state.lastFingerprint = fp; state.lastUserCount = userCount;
        await persist(state);
        status = 'Moods updated. Pinned levels were kept.';
    } catch (error) {
        status = controller.signal.aborted ? 'Analysis stopped or timed out. Previous moods kept.' : (error.message || 'Analysis failed. Previous moods kept.');
    } finally {
        clearTimeout(timer); pending = null;
        await syncPrompt(); render();
    }
}

globalThis.moodweaverBeforeGeneration = async (_chat, _contextSize, _abort, type) => {
    if (suspended || ['quiet', 'impersonate'].includes(type)) {
        ++promptVersion; ctx().setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1); return;
    }
    const ch = target(true), state = getState(ch);
    if (state?.enabled && state.mode === 'dynamic' && !['swipe', 'regenerate', 'continue'].includes(type)) await analyse(ch);
    await syncPrompt(true);
    generationSnapshots.set(identity(ch), { at: new Date().toLocaleString(), prompt: promptInfo.prompt });
    if (generationSnapshots.size > 20) generationSnapshots.delete(generationSnapshots.keys().next().value);
    renderPreview();
};

function row(m, state) {
    const value = state.moods[m.id], pin = state.pins[m.id];
    return `<div class="mw-mood" data-mood="${m.id}" style="--mw-accent:${m.color}">
        <div class="mw-row-head"><label for="mw-${m.id}">${m.label}</label><span data-level="${m.id}">${level(value)}</span>
        <output for="mw-${m.id}" data-value="${m.id}">${value}%</output>
        <button type="button" class="mw-pin ${pin ? 'is-pinned' : ''}" data-pin="${m.id}" aria-pressed="${pin}" aria-label="${pin ? 'Unpin' : 'Pin'} ${m.label}" title="Pin this exact level in dynamic mode">${pin ? '◆' : '◇'}</button></div>
        <input id="mw-${m.id}" type="range" min="0" max="100" step="1" value="${value}" data-slider="${m.id}" style="--mw-fill:${value}%" aria-valuetext="${value} percent, ${level(value)}">
        <small>${m.cue}</small></div>`;
}
function render() {
    if (!panel) return;
    const scroll = panel.scrollTop;
    const advancedOpen = panel.querySelector('.mw-advanced:not(.mw-inspector)')?.open;
    const tuningOpen = panel.querySelector('.mw-tuning')?.open;
    const inspectorOpen = panel.querySelector('.mw-inspector')?.open;
    panel.querySelectorAll('details[data-category]').forEach(d => d.open ? openCategories.add(d.dataset.category) : openCategories.delete(d.dataset.category));
    const ch = target(), state = getState(ch), allProfiles = profiles();
    const active = state ? activeMoods(state) : [];
    panel.innerHTML = `<div class="mw-top"><div class="mw-brand"><span class="mw-diamond">◆</span><div><span class="mw-eyebrow">A LITTLE INNER WEATHER</span><h2>Moodweaver</h2></div></div><button class="mw-close" data-action="close" aria-label="Close Moodweaver">×</button></div>
    ${!state ? '<div class="mw-empty">Open a character chat to start weaving a mood.</div>' : `
    <div class="mw-context"><label>Character<select data-field="character" aria-label="Character">${members().map(m => `<option value="${esc(m.avatar)}" ${m.avatar === ch.avatar ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
        <label class="mw-toggle"><input type="checkbox" data-field="enabled" ${state.enabled ? 'checked' : ''}> Enabled</label></div>
    <div class="mw-chat-name" title="${esc(ctx().chatId)}">This chat · ${esc(ctx().chatId)}</div>
    <div class="mw-mode" role="group" aria-label="Mood mode"><button data-mode="manual" aria-pressed="${state.mode === 'manual'}">☷ &nbsp; Manual</button><button data-mode="dynamic" aria-pressed="${state.mode === 'dynamic'}">✧ &nbsp; Dynamic</button></div>
    <p class="mw-explainer">${state.mode === 'manual' ? 'Set the feeling. Mix as many shades as you like.' : 'The scene shapes the feeling. Pin any mood to keep your say.'}</p>
    <div class="mw-summary"><div class="mw-section-label">${active.length ? 'THE CURRENT BLEND' : 'A CLEAN SLATE'}<span>${active.length} active</span></div>
        <div class="mw-chips">${active.length ? active.map(m => `<button data-jump="${m.id}" class="mw-chip" style="--mw-accent:${m.color}" title="Adjust ${m.label}"><span>${state.pins[m.id] ? '◆ ' : ''}${m.label}</span><b>${state.moods[m.id]}</b><i style="width:${state.moods[m.id]}%"></i></button>`).join('') : '<p>No mood directions yet. Start with a blend or move a slider.</p>'}</div>
        <p data-budget-warning class="mw-fine" hidden></p>
        ${state.reason ? `<div class="mw-observation">${esc(state.reason)}<small>Last scene read · ${esc(new Date(state.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</small></div>` : ''}</div>
    ${state.mode === 'dynamic' ? `<div class="mw-dynamic"><label>Scene analyser<select data-field="profile"><option value="">Choose a connection profile…</option>${state.profile && !allProfiles.some(p => p.id === state.profile) ? '<option selected value="'+esc(state.profile)+'">Unavailable profile — choose another</option>' : ''}${allProfiles.map(p => `<option value="${esc(p.id)}" ${p.id === state.profile ? 'selected' : ''}>${esc(p.name)} · [${esc(p.model)}]</option>`).join('')}</select></label>
        <p class="mw-fine">Uses the actual model shown in brackets. Sends recent chat text and a short character excerpt to that profile. Your roleplay connection stays selected. One extra request per scene read; provider charges apply.</p>
        <div class="mw-actions"><button data-action="analyse" ${pending || !state.profile || !state.enabled ? 'disabled' : ''}>✧ Read scene now</button>${pending ? '<button data-action="cancel">Stop</button>' : ''}<button data-action="undo" ${!state.history?.length ? 'disabled' : ''}>Undo last read</button></div>
        <details class="mw-tuning"><summary>Emotional rhythm</summary><label>Sensitivity <output>${state.sensitivity}%</output><input aria-label="Sensitivity" type="range" min="10" max="100" value="${state.sensitivity}" data-field="sensitivity"></label>
        <label>Inertia <output>${state.inertia}%</output><input aria-label="Inertia" type="range" min="0" max="95" value="${state.inertia}" data-field="inertia"></label>
        <p class="mw-fine">Higher sensitivity allows stronger reactions. Higher inertia makes changes slower. Mood carryover advances on successful scene reads, not real-world time.</p>
        <label>Fade absent moods toward zero by <input aria-label="Fade rate" type="number" min="0" max="20" data-field="decay" value="${state.decay}"> points per read, before inertia</label>
        <label>Read every <input aria-label="Read interval" type="number" min="1" max="10" data-field="interval" value="${state.interval}"> new user turns</label></details></div>` : ''}
    <div class="mw-tools"><input class="mw-search" type="search" placeholder="Find a feeling…" aria-label="Search moods" value="${esc(search)}"><select data-field="recipe" aria-label="Add a starter blend"><option value="">＋ Add a starter blend</option>${Object.keys(RECIPES).map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="mw-scale"><span>Off</span><span>Faint</span><span>Subtle</span><span>Mild</span><span>Clear</span><span>Strong</span><span>Intense</span></div>
    <div class="mw-categories">${CATEGORIES.map(([id, name, icon, color]) => {
        const list = MOODS.filter(m => m.category === id), n = list.filter(m => state.moods[m.id]).length;
        return `<details data-category="${id}" style="--mw-accent:${color}" ${openCategories.has(id) ? 'open' : ''}><summary><span class="mw-category-icon">${icon}</span><span>${name}</span><small>${n ? `${n} active` : list.length}</small></summary><div class="mw-category-body">${list.map(m => row(m, state)).join('')}</div></details>`;
    }).join('')}</div><p class="mw-no-results" hidden>No matching feelings.</p>
    <details class="mw-inspector mw-advanced"><summary>What is sent to the model?</summary>
        <p class="mw-fine">Exact Moodweaver contribution, not the whole SillyTavern prompt. Character cards, presets, lore and chat history can also influence the reply.</p>
        <label class="mw-toggle"><input type="checkbox" data-field="sceneBreathing" ${state.sceneBreathing !== false ? 'checked' : ''}> Give scenes breathing room</label>
        <p class="mw-fine">Moods are sent as words, not numbers: each one goes under its strength band (Faint, Subtle, Mild, Clear, Strong, Intense) with a line saying how much a feeling that strong actually does. Faint ones barely register; intense ones can take over. Any moods can be mixed, including opposites. Pins lock values; they don’t add importance.</p>
        <div data-token-count class="mw-token-count"></div><pre data-audit></pre>
        <b>Current prepared injection</b><pre data-preview></pre>
        <b>Last generation preparation</b><pre data-last-prompt></pre>
        <p class="mw-fine">The last preparation is kept in memory for this chat and character. It records what this extension queued, not proof of a completed API request. Use SillyTavern’s message prompt inspector for the complete assembled prompt.</p></details>
    <details class="mw-advanced"><summary>Prompt, budgets & character defaults</summary>
        <p class="mw-fine">Saved separately for each chat and character. Save this setup as a character default to seed their future chats; existing chats keep their own blend.</p>
        <div class="mw-actions"><button data-action="baseline">Save character default</button><button data-action="reset">Clear unpinned moods</button></div>
        <label>Mood prompt token target <input type="number" data-setting="tokenBudget" min="160" max="1500" value="${settings().tokenBudget}"> tokens</label>
        <label>Injection depth <input type="number" data-setting="depth" min="0" max="10" value="${settings().depth}"> messages from the end</label>
        <label>Recent messages for analyser <input type="number" data-setting="sceneMessages" min="2" max="30" value="${settings().sceneMessages}"></label>
        <label>Scene text cap <input type="number" data-setting="sceneChars" min="2000" max="40000" step="1000" value="${settings().sceneChars}"> characters</label>
        <label>Analyser output cap <input type="number" data-setting="outputTokens" min="300" max="4000" step="100" value="${settings().outputTokens}"> tokens</label>
        <p class="mw-fine">Settings apply globally. Over the token target, moods get squashed onto one line per band; nothing is ever dropped. Depth 1 places the mood just before your latest message; 0 puts it after. A large blend can exceed this target; the inspector shows the full count. Analyser caps remain limits. Counts use SillyTavern’s selected tokenizer; provider counts may differ.</p></details>`}
    <div data-status role="status" class="mw-status">${esc(status)}</div><div class="mw-footer">Small shifts. Complicated feelings. · v1.4.0</div>`;
    if (advancedOpen && panel.querySelector('.mw-advanced:not(.mw-inspector)')) panel.querySelector('.mw-advanced:not(.mw-inspector)').open = true;
    if (tuningOpen && panel.querySelector('.mw-tuning')) panel.querySelector('.mw-tuning').open = true;
    if (inspectorOpen && panel.querySelector('.mw-inspector')) panel.querySelector('.mw-inspector').open = true;
    filterRows(); renderPreview(); panel.scrollTop = scroll;
}
function filterRows() {
    const term = search.trim().toLowerCase();
    let shown = 0;
    panel.querySelectorAll('[data-category]').forEach(d => {
        let count = 0;
        d.querySelectorAll('[data-mood]').forEach(row => {
            row.hidden = !row.textContent.toLowerCase().includes(term); if (!row.hidden) count++;
        });
        d.hidden = count === 0; shown += count;
        d.open = term ? count > 0 : openCategories.has(d.dataset.category);
    });
    const none = panel.querySelector('.mw-no-results'); if (none) none.hidden = shown > 0;
}
async function changeState(mutator) {
    const s = getState(); if (!s) return;
    mutator(s); await persist(s); await syncPrompt(); render();
}
function openPanel() {
    if (suspended) return;
    render(); if (!panel.open) panel.show(); void syncPrompt();
}
function setup() {
    if (document.getElementById('moodweaver-panel')) return;
    settings();
    panel = document.createElement('dialog'); panel.id = 'moodweaver-panel'; panel.className = 'mw-panel';
    panel.setAttribute('aria-label', 'Moodweaver character moods'); document.body.append(panel);
    const launcher = document.createElement('button'); launcher.id = 'moodweaver-launcher'; launcher.innerHTML = '<span>◆</span> Moods';
    launcher.title = 'Open Moodweaver'; launcher.setAttribute('aria-controls', panel.id); launcher.onclick = openPanel; document.body.append(launcher);
    const settingsHost = document.querySelector('#extensions_settings2') ?? document.querySelector('#extensions_settings');
    if (settingsHost) {
        const entry = document.createElement('div'); entry.className = 'mw-settings-entry';
        entry.innerHTML = '<b>◆ Moodweaver</b><p>Character moods, blended your way.</p><button class="menu_button">Open mood panel</button>';
        entry.querySelector('button').onclick = openPanel; settingsHost.append(entry);
    }
    panel.addEventListener('input', e => {
        if (e.target.matches('.mw-search')) { search = e.target.value; filterRows(); return; }
        if (e.target.dataset.slider) {
            const id = e.target.dataset.slider, value = Number(e.target.value);
            panel.querySelector(`[data-value="${id}"]`).textContent = `${value}%`;
            panel.querySelector(`[data-level="${id}"]`).textContent = level(value);
            e.target.style.setProperty('--mw-fill', `${value}%`); e.target.setAttribute('aria-valuetext', `${value} percent, ${level(value)}`);
        }
    });
    panel.addEventListener('change', async e => {
        const input = e.target;
        if (input.dataset.slider) {
            await changeState(s => { s.moods[input.dataset.slider] = Number(input.value); if (s.mode === 'dynamic') s.pins[input.dataset.slider] = true; }); return;
        }
        if (input.dataset.setting) { settings()[input.dataset.setting] = Number(input.value); settings(); ctx().saveSettingsDebounced(); await syncPrompt(); render(); return; }
        const field = input.dataset.field;
        if (field === 'character') { selectedAvatar = input.value; status = ''; render(); await syncPrompt(); return; }
        if (field === 'recipe') { if (RECIPES[input.value]) await changeState(s => { for (const [k, v] of Object.entries(RECIPES[input.value])) if (!s.pins[k]) s.moods[k] = v; }); return; }
        if (field) await changeState(s => {
            s[field] = ['enabled', 'sceneBreathing'].includes(field) ? input.checked : field === 'profile' ? input.value : Number(input.value);
            if (['profile', 'interval'].includes(field)) { s.lastFingerprint = ''; s.lastUserCount = -1; }
            if (field === 'inertia') s[field] = clamp(s[field], 0, 95);
            if (field === 'sensitivity') s[field] = clamp(s[field], 10, 100);
            if (field === 'decay') s[field] = clamp(s[field], 0, 20);
            if (field === 'interval') s[field] = clamp(s[field], 1, 10);
        });
    });
    panel.addEventListener('click', async e => {
        const button = e.target.closest('button'); if (!button) return;
        if (button.dataset.mode) { await changeState(s => { s.mode = button.dataset.mode; }); return; }
        if (button.dataset.pin) { await changeState(s => { s.pins[button.dataset.pin] = !s.pins[button.dataset.pin]; }); return; }
        if (button.dataset.jump) {
            search = ''; panel.querySelector('.mw-search').value = ''; filterRows();
            const row = panel.querySelector(`[data-mood="${button.dataset.jump}"]`), category = row.closest('details');
            category.open = true; openCategories.add(category.dataset.category); row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.querySelector('input').focus(); return;
        }
        switch (button.dataset.action) {
            case 'close': panel.close(); document.getElementById('moodweaver-launcher').focus(); break;
            case 'cancel': cancelAnalysis(); break;
            case 'analyse': await analyse(target(), true); break;
            case 'reset': await changeState(s => { for (const m of MOODS) if (!s.pins[m.id]) s.moods[m.id] = 0; s.reason = ''; }); break;
            case 'undo': await changeState(s => {
                const previous = s.history.pop(); if (!previous) return;
                for (const m of MOODS) if (!s.pins[m.id]) s.moods[m.id] = previous.moods[m.id] ?? 0;
                s.reason = previous.reason; s.updatedAt = previous.updatedAt;
            }); break;
            case 'baseline': {
                settings().baselines[`char:${target().avatar}`] = freshState(getState()); ctx().saveSettingsDebounced();
                status = 'Default saved for this character’s future chats.'; renderStatus(); break;
            }
        }
    });
    const c = ctx();
    c.eventSource.on(c.eventTypes.CHAT_CHANGED, () => {
        cancelAnalysis(); selectedAvatar = ''; status = '';
        ++promptVersion; c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
        render(); void syncPrompt();
    });
    c.eventSource.on(c.eventTypes.GENERATION_STOPPED, cancelAnalysis);
    c.eventSource.on(c.eventTypes.GENERATION_ENDED, () => { void syncPrompt(); });
    c.eventSource.on(c.eventTypes.GENERATION_AFTER_COMMANDS, (type, _args, dryRun) => {
        if (['quiet', 'impersonate'].includes(type)) { ++promptVersion; c.setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1); }
        else if (dryRun) return syncPrompt(true);
    });
    for (const event of ['CONNECTION_PROFILE_CREATED', 'CONNECTION_PROFILE_DELETED', 'CONNECTION_PROFILE_UPDATED']) {
        if (c.eventTypes[event]) c.eventSource.on(c.eventTypes[event], () => { if (panel.open) render(); });
    }
    render(); void syncPrompt();
}
// jQuery ready also works when installed after APP_READY has fired.
if (typeof jQuery === 'function') jQuery(setup); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true }); else setup();

export { analyse, getState, syncPrompt };

export function onDisable() {
    suspended = true; ++promptVersion; cancelAnalysis();
    ctx().setExtensionPrompt(PROMPT_KEY, '', 1, 0, false, 1);
    panel?.close();
    for (const node of document.querySelectorAll('#moodweaver-panel, #moodweaver-launcher, .mw-settings-entry')) node.hidden = true;
}
export function onEnable() {
    suspended = false;
    if (!panel) setup();
    for (const node of document.querySelectorAll('#moodweaver-panel, #moodweaver-launcher, .mw-settings-entry')) node.hidden = false;
    void syncPrompt();
}
