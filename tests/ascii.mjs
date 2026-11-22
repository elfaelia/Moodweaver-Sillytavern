// Every code file must be plain ASCII. Safari on iPhone once misread a curly quote in data/catalogue/story.js
// (1.90.3: "Invalid character '�'") and the whole of Moodweaver failed to load, hanging SillyTavern. Characters
// like ’ “ ✦ are written as \u escapes instead, which mean exactly the same thing to JavaScript.
// Run from the extension folder: node tests/ascii.mjs         (checks)
//                                  node tests/ascii.mjs --fix   (rewrites any non-ASCII characters as \u escapes)
import fs from 'node:fs';
import path from 'node:path';
const fix = process.argv.includes('--fix');
const files = [];
const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'sounds') continue; const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
walk('.');
const esc = s => s.replace(/[^\x00-\x7f]/gu, ch => [...ch].length && ch.length === 2 ? `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}\\u${ch.charCodeAt(1).toString(16).padStart(4, '0')}` : `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`);
let bad = 0;
for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    if (!/[^\x00-\x7f]/.test(s)) continue;
    if (fix) { fs.writeFileSync(f, esc(s)); console.log(`fixed ${f}`); } else { bad++; console.log(`✗ ${f} has non-ASCII characters`); }
}
console.log(fix ? 'done' : `${files.length} files, ${bad} with non-ASCII characters.`);
process.exit(!fix && bad ? 1 : 0);
