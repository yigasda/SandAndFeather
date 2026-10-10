// Isolate the 25 approved glyphs. Never run the old skin packer here: it would
// overwrite the independent 0.9.3/0.9.4 frame repairs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'docs/art/menu-icons-approved.png');
const out = path.join(root, 'data/art/ui/menu-icons');
const themes = ['classic', 'walnut', 'journal', 'temple', 'cozy'];
const names = ['world', 'somang', 'party', 'quests', 'map'];
// Safe cell interiors: no headings, grid lines, labels or neighbouring glyphs.
const columns = [[270, 148], [538, 132], [776, 168], [1058, 132], [1320, 140]];
const rows = [[114, 131], [299, 120], [465, 141], [650, 128], [833, 132]];

(async () => {
    const bytes = fs.readFileSync(source);
    const sourceSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const assets = [];
    for (const [row, theme] of themes.entries()) {
        fs.mkdirSync(path.join(out, theme), { recursive: true });
        for (const [col, name] of names.entries()) {
            const [left, width] = columns[col], [top, height] = rows[row];
            const raw = await sharp(bytes).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer();
            const light = row === 1 || row === 4 || (col === 0 && (row === 0 || row === 3));
            const low = col === 0 && (row === 0 || row === 3) ? 130 : 80;
            let x0 = width, x1 = -1, y0 = height, y1 = -1;
            // Contrast separates the paper/cocoa swatch even in enclosed holes
            // (globe meridians, doorway, scroll marks and spaces between heads).
            for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
                const p = (y * width + x) * 4, green = raw[p + 1];
                const alpha = Math.max(0, Math.min(1, light ? (green - low) / 40 : (190 - green) / 70));
                raw[p + 3] = Math.round(255 * alpha);
                if (raw[p + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
            }
            if (x1 < x0 || x0 === 0 || y0 === 0 || x1 === width - 1 || y1 === height - 1) {
                throw new Error(`${theme}/${name}: empty or clipped silhouette`);
            }
            const isolated = await sharp(raw, { raw: { width, height, channels: 4 } })
                .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
                .resize(44, 44, { fit: 'inside', kernel: 'lanczos3' }).png().toBuffer();
            const meta = await sharp(isolated).metadata();
            // 2px safety margin at 2x resolution; render as a 24px CSS icon.
            const png = await sharp({ create: { width: 48, height: 48, channels: 4, background: '#0000' } })
                .composite([{ input: isolated, left: Math.floor((48 - meta.width) / 2), top: Math.floor((48 - meta.height) / 2) }]).png().toBuffer();
            fs.writeFileSync(path.join(out, theme, `${name}.png`), png);
            assets.push({ theme, name, crop: [left, top, width, height], foregroundBounds: [x0, y0, x1 - x0 + 1, y1 - y0 + 1], size: [48, 48], sha256: crypto.createHash('sha256').update(png).digest('hex') });
        }
    }
    fs.writeFileSync(path.join(out, 'provenance.json'), JSON.stringify({ source: 'docs/art/menu-icons-approved.png', sourceSha256, method: 'contrast alpha extraction, proportional 44px fit, 48px transparent canvas; no new artwork generated', assets }, null, 2) + '\n');
    console.log(`Extracted ${assets.length} approved menu icons`);
})().catch(e => { console.error(e); process.exitCode = 1; });
