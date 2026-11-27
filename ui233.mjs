// Lorebook cast: a person's entry fires, they're offered on Scene, added, and Read about them reads their entry.
// usage: node lore202.mjs <ext> <outdir>
import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path';
const [ext, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const here = path.dirname(new URL(import.meta.url).pathname);
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.route('http://mw.test/**', route => { const u = new URL(route.request().url()); const file = u.pathname.startsWith('/ext/') ? path.join(ext, u.pathname.slice(5)) : u.pathname.startsWith('/harness/') ? path.join(here, u.pathname.slice(9)) : path.join(here, 'page.html'); if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' }); route.fulfill({ status: 200, contentType: types[path.extname(file)] ?? 'text/plain', body: fs.readFileSync(file) }); });
await page.goto('http://mw.test/'); await page.waitForFunction(() => globalThis.__loaded === true); await page.waitForTimeout(1200); await page.evaluate(() => document.getElementById('moodweaver-launcher')?.click()); await page.waitForTimeout(800); for (const w of ['user', 'story', 'char']) { await page.evaluate(w => document.querySelector(`#moodweaver-panel [data-who="${w}"]`)?.click(), w); await page.waitForTimeout(400); }
const wait = ms => page.waitForTimeout(ms);
const tap = s => page.evaluate(s => document.querySelector('#moodweaver-panel ' + s)?.click(), s);
const shoot = async name => { const h = await page.evaluate(() => document.querySelector('#moodweaver-panel').scrollHeight); await page.setViewportSize({ width: 402, height: Math.min(h + 40, 6000) }); await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true }); };
await wait(1200);
await page.evaluate(() => { const b = __st.ctx.chatMetadata.moodweaver?.bond?.['char:damien.png']; if (b) b.on = true; });
await page.evaluate(() => [...document.querySelectorAll('#moodweaver-panel button')].find(b => b.textContent.trim() === 'Damien')?.click()); await wait(300);
await tap('[data-dock="char"]'); await wait(400); await tap('[data-tab="state"]'); await wait(600);
await page.evaluate(() => { const i = document.querySelector('#moodweaver-panel [data-profile="eyes"]'); i.value = 'pale grey'; i.dispatchEvent(new Event('change', { bubbles: true })); }); await wait(500);
console.log('saved:', await page.evaluate(() => __st.ctx.chatMetadata.moodweaver.characters['char:damien.png'].eyes));
const note = mine => page.evaluate(async mine => { const { ctx } = globalThis.__st; ctx.chat.push({ name: 'Ellie', is_user: true, mes: mine, send_date: 'u' + ctx.chat.length }); const o = structuredClone(ctx.chat); await globalThis.moodweaverBeforeGeneration(o, 8000, () => {}, 'normal'); ctx.chat.pop(); const all = globalThis.__st.log.prompts.filter(p => p.value).map(p => p.value); return /Eye colour: pale grey/.test(all.at(-1) + all.at(-2) + all.at(-3)); }, mine);
for (let i = 0; i < 8; i++) await page.evaluate(n => __st.ctx.chat.push({ name: 'Ellie', is_user: true, mes: 'hi', send_date: 'x' + n }, { name: 'Damien', is_user: false, mes: 'He nods.', send_date: 'y' + n }), i);
console.log('plain:', await note('We talk about the weather.'));
console.log('eyes:', await note('I look into his eyes and hold his gaze.'));
await page.evaluate(() => document.querySelector('#moodweaver-panel [data-profile="eyes"]')?.scrollIntoView({ block: 'center' }));
await page.screenshot({ path: path.join(out, 'eyes.png') });
console.log('errors', errors); await browser.close();
