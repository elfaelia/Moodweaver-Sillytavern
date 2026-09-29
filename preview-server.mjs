import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname);
http.createServer(async (req, res) => {
    try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        const file = resolve(root, '.' + (pathname === '/' ? '/preview.html' : pathname));
        if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
        const data = await readFile(file);
        res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' })[extname(file)] || 'text/plain');
        res.end(data);
    } catch { res.writeHead(404); res.end('Not found'); }
}).listen(8768, '127.0.0.1', () => console.log('Moodweaver preview: http://127.0.0.1:8768'));
