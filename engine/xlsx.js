// Writing and reading the song sheet, with no outside libraries. A spreadsheet file (.xlsx) is a zip of small
// XML files: writing stores them uncompressed, reading also unpacks compressed ones with the browser's own
// DecompressionStream. Only what the song sheet needs: text and numbers, bold coloured headers, column widths,
// frozen header rows and dropdown lists. Runs in Node 18+ too.

// ---- Zip ----
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = bytes => { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const enc = new TextEncoder(), dec = new TextDecoder();
export function zip(files) {
    const parts = [], central = []; let offset = 0;
    for (const f of files) {
        const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
        const head = new DataView(new ArrayBuffer(30));
        head.setUint32(0, 0x04034b50, true); head.setUint16(4, 20, true); head.setUint16(6, 0x0800, true); head.setUint16(8, 0, true);
        head.setUint32(14, crc, true); head.setUint32(18, data.length, true); head.setUint32(22, data.length, true); head.setUint16(26, name.length, true);
        parts.push(new Uint8Array(head.buffer), name, data);
        const c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
        c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
        central.push(new Uint8Array(c.buffer), name);
        offset += 30 + name.length + data.length;
    }
    const size = central.reduce((n, p) => n + p.length, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, offset, true);
    const all = [...parts, ...central, new Uint8Array(end.buffer)], out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
    let at = 0; for (const p of all) { out.set(p, at); at += p.length; }
    return out;
}
async function inflate(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}
export async function unzip(bytes) {
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), out = new Map();
    let end = -1; for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65600); i--) if (v.getUint32(i, true) === 0x06054b50) { end = i; break; }
    if (end < 0) throw new Error('This file is not a spreadsheet (.xlsx) or it is damaged.');
    let p = v.getUint32(end + 16, true); const count = v.getUint16(end + 10, true);
    for (let n = 0; n < count; n++) {
        const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true), nameLen = v.getUint16(p + 28, true), extra = v.getUint16(p + 30, true), note = v.getUint16(p + 32, true), local = v.getUint32(p + 42, true);
        const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
        const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true), raw = bytes.subarray(start, start + size);
        out.set(name, method === 0 ? raw : method === 8 ? await inflate(raw) : new Uint8Array());
        p += 46 + nameLen + extra + note;
    }
    return out;
}

// ---- Writing a workbook ----
const x = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
export const colName = i => { let s = ''; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
// Styles: 0 plain, 1 grey bold header (filled in by Moodweaver), 2 yellow bold header (yours to fill), 3 grey text, 4 bold title.
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font><font><sz val="11"/><color rgb="FF595959"/><name val="Arial"/></font><font><b/><sz val="15"/><name val="Arial"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE699"/></patternFill></fill></fills>
<borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs>
<cellXfs count="5"><xf fontId="0" fillId="0" applyFont="1"/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"><alignment wrapText="1" vertical="center"/></xf><xf fontId="1" fillId="3" applyFont="1" applyFill="1"><alignment wrapText="1" vertical="center"/></xf><xf fontId="2" fillId="2" applyFont="1" applyFill="1"/><xf fontId="3" fillId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
// sheets: [{ name, rows: [[cell\u2026]\u2026], styles?: [[styleIndex\u2026]\u2026] (per cell, row by row), widths?: [n\u2026], freeze?: { row, col },
//           lists?: [{ col, rows: [from, to], source: 'Lists!$A$2:$A$15' }] }]
export function buildXlsx(sheets) {
    const sheetXml = s => {
        const rows = s.rows.map((row, r) => `<row r="${r + 1}">${row.map((v, c) => {
            const st = s.styles?.[r]?.[c] ?? 0, ref = `${colName(c)}${r + 1}`, sAttr = st ? ` s="${st}"` : '';
            if (v === '' || v === null || v === undefined) return st ? `<c r="${ref}"${sAttr}/>` : '';
            return typeof v === 'number' && Number.isFinite(v) ? `<c r="${ref}"${sAttr}><v>${v}</v></c>` : `<c r="${ref}"${sAttr} t="inlineStr"><is><t xml:space="preserve">${x(v)}</t></is></c>`;
        }).join('')}</row>`).join('');
        const f = s.freeze, pane = f ? `<sheetViews><sheetView workbookViewId="0"><pane${f.col ? ` xSplit="${f.col}"` : ''}${f.row ? ` ySplit="${f.row}"` : ''} topLeftCell="${colName(f.col ?? 0)}${(f.row ?? 0) + 1}" activePane="${f.col && f.row ? 'bottomRight' : f.row ? 'bottomLeft' : 'topRight'}" state="frozen"/></sheetView></sheetViews>` : '';
        const cols = s.widths?.length ? `<cols>${s.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
        const dv = s.lists?.length ? `<dataValidations count="${s.lists.length}">${s.lists.map(l => `<dataValidation type="list" allowBlank="1" showErrorMessage="0" showInputMessage="0" sqref="${colName(l.col)}${l.rows[0]}:${colName(l.col)}${l.rows[1]}"><formula1>${x(l.source)}</formula1></dataValidation>`).join('')}</dataValidations>` : '';
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${pane}${cols}<sheetData>${rows}</sheetData>${dv}</worksheet>`;
    };
    const files = [
        { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
        { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
        { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${x(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
        { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
        { name: 'xl/styles.xml', data: STYLES },
        ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s) })),
    ];
    return zip(files);
}

// ---- Reading a workbook ----
const unx = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
const textIn = xml => [...String(xml).matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)].map(m => unx(m[1])).join('');
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const colIndex = ref => { const letters = ref.match(/^[A-Z]+/)?.[0] ?? 'A'; let n = 0; for (const ch of letters) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
// \u2192 { 'Songs': [[cell\u2026]\u2026], \u2026 } with every cell as text.
export async function readXlsx(bytes) {
    const files = await unzip(bytes), get = name => files.has(name) ? dec.decode(files.get(name)) : '';
    const book = get('xl/workbook.xml'); if (!book) throw new Error('This spreadsheet has no workbook inside.');
    const rels = new Map([...get('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)].map(m => [attr(m[0], 'Id'), attr(m[0], 'Target')]));
    const shared = [...get('xl/sharedStrings.xml').matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)].map(m => textIn(m[1]));
    const out = {};
    for (const m of book.matchAll(/<(?:\w+:)?sheet\b[^>]*>/g)) {
        const name = unx(attr(m[0], 'name') ?? ''), target = rels.get(attr(m[0], 'r:id')) ?? '';
        const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`, xml = get(path), rows = [];
        for (const r of xml.matchAll(/<(?:\w+:)?row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?row>)/g)) {
            const index = Number(attr(`<row${r[1]}>`, 'r')) - 1, row = [];
            for (const c of (r[2] ?? '').matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
                const tag = `<c${c[1]}>`, ref = attr(tag, 'r') ?? '', type = attr(tag, 't') ?? 'n', body = c[2] ?? '';
                const v = body.match(/<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1];
                const val = type === 's' ? shared[Number(v)] ?? '' : type === 'inlineStr' ? textIn(body) : type === 'b' ? (v === '1' ? 'TRUE' : 'FALSE') : v !== undefined ? unx(v) : '';
                row[ref ? colIndex(ref) : row.length] = val;
            }
            rows[Number.isFinite(index) && index >= 0 ? index : rows.length] = Array.from(row, v => v ?? '');
        }
        out[name] = Array.from(rows, r => r ?? []);
    }
    return out;
}
// CSV (Google Sheets' "Download as CSV", or exportify.net) \u2192 rows of text.
export function readCsv(text) {
    const rows = []; let row = [], cell = '', quoted = false; const s = String(text).replace(/^\ufeff/, '');
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (quoted) { if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += ch; continue; }
        if (ch === '"') quoted = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => String(c).trim()));
}
