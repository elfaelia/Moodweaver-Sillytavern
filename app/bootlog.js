// A startup log for finding out why a device gets stuck on SillyTavern's "Initializing…" screen (1.90.2).
// For the first minute after the page opens, Moodweaver writes what it has done so far, with timings, and any errors
// the page reports (from any extension), into a text file in SillyTavern's user files on the PC:
//   data/default-user/user/files/moodweaver-startup-iphone.txt   (or -computer / -android)
// Each device writes its own file, so the PC's log never covers the phone's. Nothing leaves the PC.
const t0 = performance.now();
const ua = navigator.userAgent;
const device = /iPhone|iPad|iPod/.test(ua) ? 'iphone' : /Android/.test(ua) ? 'android' : 'computer';
const lines = [];
let timer = 0, open = true, chain = Promise.resolve();
// One write at a time, in order, so a shorter early copy never lands after a longer one.
const queue = () => { chain = chain.then(flush); };
const stamp = () => `${((performance.now() - t0) / 1000).toFixed(2)}s`;
async function flush() {
    timer = 0;
    try {
        const c = globalThis.SillyTavern?.getContext?.(); if (!c?.getRequestHeaders) return;
        const text = [`Moodweaver startup log, ${new Date().toLocaleString()}`, ua, '', ...lines].join('\n');
        const data = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
        await fetch('/api/files/upload', { method: 'POST', headers: c.getRequestHeaders(), body: JSON.stringify({ name: `moodweaver-startup-${device}.txt`, data }), keepalive: data.length < 60000 });
    } catch { /* the log is only a helper */ }
}
export function bootNote(text, now = true) {
    if (!open) return;
    lines.push(`${stamp()}  ${text}`);
    if (now) { clearTimeout(timer); timer = 0; queue(); } else if (!timer) timer = setTimeout(queue, 250);
}
// Is SillyTavern's loading screen still up?
const loaderUp = () => [...document.querySelectorAll('#preloader, #loader, .loader, [id*="load"]')].some(el => el.offsetParent !== null && /initiali[sz]ing|loading/i.test(el.textContent ?? ''));
export function startBootLog() {
    bootNote(`Moodweaver code loaded (${device})`, true);
    window.addEventListener('error', e => bootNote(`PAGE ERROR: ${e.message} at ${String(e.filename ?? '').split('/').slice(-3).join('/')}:${e.lineno}`, true));
    window.addEventListener('unhandledrejection', e => bootNote(`UNHANDLED: ${e.reason?.stack ?? e.reason}`.slice(0, 600), true));
    setTimeout(() => bootNote('about to merge the built-in songs (8s)'), 7900);
    for (const s of [2, 5, 10, 20, 40]) setTimeout(() => bootNote(`check at ${s}s: loading screen ${loaderUp() ? 'STILL UP' : 'gone'}`, true), s * 1000);
    setTimeout(() => { bootNote('log closed', true); open = false; }, 60000);
}
