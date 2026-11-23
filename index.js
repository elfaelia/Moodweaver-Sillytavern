// Moodweaver's front door (1.90.3). It loads the rest of Moodweaver one file at a time, showing each step in a small
// strip at the top of the screen (only when loading takes over 3 seconds or something fails), so a device that gets stuck shows exactly which file it stopped on. SillyTavern
// doesn't wait for any of this, so a slow file can never hold up its "Initializing\u2026" screen. When everything has
// loaded the strip says so and disappears. The real start-up is main.js.
const FILES = ["engine/rel-pronouns.js", "engine/pronouns.js", "data/catalogue/relationships.js", "engine/relationships.js", "data/catalogue/mood.js", "data/catalogue/trait.js", "data/catalogue/intimacy.js", "data/catalogue/psyche.js", "data/catalogue/state.js", "data/catalogue/story.js", "data/catalogue.js", "engine/stress.js", "data/catalogue/turns.js", "data/catalogue/skills.js", "engine/util.js", "engine/skills.js", "engine/turns.js", "engine/opinions.js", "engine/secrets.js", "app/state.js", "data/catalogue/period.js", "engine/period.js", "engine/links.js", "app/settings.js", "engine/tone.js", "data/catalogue/merged.js", "engine/board.js", "engine/meters.js", "engine/weave.js", "data/catalogue/dynamics.js", "engine/dynamics.js", "engine/bond.js", "engine/personality.js", "engine/state.js", "engine/strength.js", "engine/locale.js", "engine/patterns.js", "engine/prompt.js", "engine/ledger.js", "engine/moodpace.js", "engine/overlap.js", "panel/find.js", "engine/bondread.js", "engine/reader.js", "panel/rows.js", "panel/needs-tab.js", "engine/reactive.js", "panel/wants-tab.js", "panel/personality-tab.js", "panel/sections.js", "app/reader.js", "panel/bonds-tab.js", "panel/scroll-memory.js", "panel/header.js", "app/launcher.js", "panel/settings-sheet.js", "panel/skills-tab.js", "panel/period-tab.js", "panel/relationships-tab.js", "data/catalogue/music.js", "engine/scene-words.js", "engine/music.js", "engine/xlsx.js", "engine/sheet.js", "engine/venues.js", "app/ambience.js", "app/spotify.js", "app/music.js", "panel/music-tab.js", "panel/render.js", "engine/checks.js", "engine/echoes.js", "app/note.js", "engine/mood-meters.js", "engine/auto-wants.js", "app/replies.js", "app/fill-in.js", "engine/cast.js", "app/chat.js", "panel/events.js"];
const t0 = performance.now(), secs = () => ((performance.now() - t0) / 1000).toFixed(1);
let box = null, now = '', lines = [], done = false, loud = false;
function show() {
    // Quiet unless something goes wrong or loading takes more than 3 seconds.
    if (!box && !loud && performance.now() - t0 < 3000) return;
    if (!box) {
        box = document.createElement('div'); box.id = 'moodweaver-loading';
        box.style.cssText = 'position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:2147483647;max-height:45vh;overflow:auto;padding:8px 10px;border-radius:10px;background:#120f1ee8;color:#e9cf8f;font:12px/1.35 ui-monospace,Menlo,monospace;white-space:pre-wrap;pointer-events:none';
        (document.body ?? document.documentElement).append(box);
    }
    box.textContent = ['\u25c6 Moodweaver loading', ...lines.slice(-14), now].filter(Boolean).join('\n');
}
const note = (text, bad = false) => { lines.push(`${secs()}s ${text}`); if (bad) loud = true; show(); };
// Only Moodweaver's own errors belong in the strip. A page error from anywhere else (SillyTavern, another
// extension, a Safari add-on) can't be fixed here, and one from another site's script reaches us only as a bare
// "Script error." with no file, so those are left out. Promise failures carry no file at all, so they are
// shown only while loading, before the rest of the page is busy.
const HOME = new URL('./', import.meta.url).href;
const ours = e => String(e.filename ?? '').startsWith(HOME);
window.addEventListener('error', e => { if (ours(e)) note(`ERROR ${e.message} (${e.filename.slice(HOME.length)}:${e.lineno})`, true); });
// The panel's own handlers report here by name (main.js), so even a muted error still says where it came from.
window.addEventListener('moodweaver-error', e => note(`ERROR ${e.detail}`, true));
window.addEventListener('unhandledrejection', e => { if (!done) note(`ERROR ${String(e.reason?.message ?? e.reason).slice(0, 200)}`, true); });
// A heartbeat: if this line stops counting up, the page itself has frozen.
const beat = setInterval(() => { if (!done) { show(); } }, 1000);
let main = null;
async function load() {
    for (const f of FILES) {
        const start = performance.now(); now = `\u2026 ${f}`; show();
        const tick = setInterval(() => { now = `\u2026 ${f} (${((performance.now() - start) / 1000).toFixed(0)}s)`; show(); }, 1000);
        try { await import(`./${f}`); } catch (err) { clearInterval(tick); now = ''; note(`\u2715 ${f}: ${err?.message ?? err}`, true); return; }
        clearInterval(tick);
        const ms = performance.now() - start; if (ms > 400) note(`slow: ${f} took ${(ms / 1000).toFixed(1)}s`);
    }
    now = '\u2026 starting'; show();
    try { main = await import('./main.js'); } catch (err) { now = ''; note(`\u2715 start: ${err?.message ?? err}`, true); return; }
    done = true; clearInterval(beat); now = '';
    if (box) { note(`\u2713 loaded (${FILES.length + 1} files)`); setTimeout(() => box?.remove(), 2500); }
}
const ready = load();
export async function onDisable() { await ready; main?.onDisable?.(); }
export async function onEnable() { await ready; main?.onEnable?.(); }
