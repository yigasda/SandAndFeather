// Painting the still world, once per map and season, into two off-screen layers at 16px a tile:
//   ground  tiles, their soft borders, shadows, buildings, things lying or standing low
//   top     what stands over people walking behind it: palm crowns, statues, columns, flagpoles
// Tiles are drawn as small patterns (grains, flagstones, tufts, ripples) so the grid does not show, and where two
// kinds of ground meet the border is softened. The map's "decor" (data/maps/*.json) is drawn here too.

export const T = 16;
export const rnd = (i, j, k = 1) => { const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); };
const smooth = t => t * t * (3 - 2 * t);
// a soft noise, so tones drift across tiles instead of changing at every tile
function vnoise(x, y, k) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
    const a = rnd(xi, yi, k), b = rnd(xi + 1, yi, k), c = rnd(xi, yi + 1, k), d = rnd(xi + 1, yi + 1, k);
    return (a + (b - a) * xf) + ((c + (d - c) * xf) - (a + (b - a) * xf)) * yf;
}

const SAND = ['#E9CC98', '#E4C48E', '#EDD3A3'];
const STONE = ['#E3D5B9', '#DCCDB0', '#E7DAC0'];
const PATH = ['#D8C5A3', '#D1BD9A', '#DDCBAA'];
const ROCK = ['#B99E7B', '#B09472', '#C2A783'];
const BANK = ['#CDB78E', '#C7B189', '#D3BE96'];
const SHADOW = 'rgba(70,45,20,.22)';

const SOFT_EDGE = { sand: 1, path: 1, grass: 1, stone: 1, bank: 1, farm: 1, water: 1 };

export function paintMap(m, S, gr, tp) {
    gr.width = tp.width = m.w * T; gr.height = tp.height = m.h * T;
    const g = gr.getContext('2d'), u = tp.getContext('2d');
    u.clearRect(0, 0, tp.width, tp.height);
    const ctx = { m, S, g, u };
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) tile(ctx, i, j);
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) edges(ctx, i, j);
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) shadows(ctx, i, j);
    for (const b of m.buildings) { buildingShadow(g, b); }
    for (const b of m.buildings) building(ctx, b);
    // decor back to front, so a lower one overlaps the one above it
    for (const d of [...(m.decor || [])].sort((a, b) => a.y - b.y)) DECOR[d.k]?.(ctx, d.x * T, d.y * T, d);
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
        const L = m.legend(i, j);
        if (L.obj === 'palm') palm(ctx, i * T, j * T, i, j);
        if (L.obj === 'lotus') lotus(g, i * T, j * T, i, j);
        if (m.type(i, j) === 'pillar') pillarTop(u, i * T, j * T);
    }
}

// ---------- small tools
const box = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
// a tile in 4×4 blocks of a few tones, following the soft noise
function blocks(g, x, y, i, j, tones, k, scale = 6) {
    for (let by = 0; by < 4; by++) for (let bx = 0; bx < 4; bx++) {
        const n = vnoise((i * 4 + bx) / scale, (j * 4 + by) / scale, k) + (rnd(i * 4 + bx, j * 4 + by, k + 9) - 0.5) * 0.25;
        box(g, x + bx * 4, y + by * 4, 4, 4, tones[n < 0.38 ? 0 : n < 0.66 ? 1 : 2]);
    }
}
const dots = (g, x, y, i, j, k, n, col) => { for (let q = 0; q < n; q++) box(g, x + Math.floor(rnd(i, j, k + q) * 15), y + Math.floor(rnd(i, j, k + q + 20) * 15), 1, 1, col); };

// ---------- tiles
function tile(ctx, i, j) {
    const { m, S, g } = ctx, t = m.type(i, j), x = i * T, y = j * T, n = rnd(i, j);
    const at = (a, b) => m.type(a, b);
    switch (t) {
        case 'grass': {
            blocks(g, x, y, i, j, S.grass, 3, 5);
            for (let q = 0; q < 4; q++) { // tufts
                const a = x + 1 + Math.floor(rnd(i, j, 30 + q) * 13), b = y + 2 + Math.floor(rnd(i, j, 40 + q) * 12);
                box(g, a, b, 1, 2, 'rgba(40,70,25,.35)'); box(g, a + 1, b - 1, 1, 2, 'rgba(40,70,25,.3)'); box(g, a + 1, b - 1, 1, 1, 'rgba(255,255,220,.25)');
            }
            if (rnd(i, j, 50) > 0.9) { const a = x + 3 + Math.floor(rnd(i, j, 51) * 10), b = y + 3 + Math.floor(rnd(i, j, 52) * 10); box(g, a, b, 1, 1, rnd(i, j, 53) > 0.5 ? '#F6F0E0' : '#F2D25A'); }
            break;
        }
        case 'stone': {
            const tone = STONE[Math.floor(n * 3)];
            box(g, x, y, T, T, tone);
            const vx = j % 2 ? 7 : 15; // staggered flagstones
            box(g, x, y + 15, T, 1, '#C3B293'); box(g, x + vx, y, 1, 15, '#C3B293');
            box(g, x, y, T, 1, '#EFE5D0'); box(g, x + (vx + 1) % 16, y + 1, 1, 14, '#EFE5D0');
            if (rnd(i, j, 6) > 0.82) { const a = x + 3 + Math.floor(rnd(i, j, 7) * 8); box(g, a, y + 5, 1, 2, '#C9B898'); box(g, a + 1, y + 7, 1, 2, '#C9B898'); box(g, a + 2, y + 9, 1, 1, '#C9B898'); }
            dots(g, x, y, i, j, 60, 3, 'rgba(150,125,90,.18)');
            break;
        }
        case 'path': {
            blocks(g, x, y, i, j, PATH, 4, 6);
            for (let q = 0; q < 3; q++) { // cobbles
                const a = x + 1 + Math.floor(rnd(i, j, 70 + q) * 12), b = y + 1 + Math.floor(rnd(i, j, 80 + q) * 12);
                box(g, a, b, 3, 2, '#C5B08C'); box(g, a, b, 3, 1, '#E3D3B3'); box(g, a, b + 2, 3, 1, 'rgba(110,85,55,.25)');
            }
            break;
        }
        case 'farm': {
            box(g, x, y, T, T, S.farm[Math.floor(n * 2)]);
            for (let r = 0; r < 4; r++) { box(g, x, y + r * 4 + 2, T, 1, 'rgba(0,0,0,.2)'); box(g, x, y + r * 4 + 1, T, 1, 'rgba(255,230,190,.08)'); }
            if (n > 0.3) for (let q = 0; q < 4; q++) {
                const a = x + 2 + q * 4, b = y + (q % 2 ? 8 : 4);
                box(g, a, b, 1, 3, S.crop); box(g, a - 1, b, 1, 1, S.crop); box(g, a + 1, b - 1, 1, 1, S.crop); box(g, a, b - 1, 1, 1, 'rgba(255,255,200,.35)');
            }
            break;
        }
        case 'water': {
            blocks(g, x, y, i, j, S.water, 5, 4);
            for (let q = 0; q < 2; q++) if (rnd(i, j, 90 + q) > 0.45) {
                const a = x + Math.floor(rnd(i, j, 92 + q) * 11), b = y + 2 + Math.floor(rnd(i, j, 94 + q) * 12);
                box(g, a, b, 4, 1, 'rgba(255,255,255,.16)'); box(g, a + 1, b + 1, 3, 1, 'rgba(0,30,40,.12)');
            }
            break;
        }
        case 'bank': {
            blocks(g, x, y, i, j, BANK, 6, 5);
            box(g, x, y + 11, T, 5, 'rgba(90,70,40,.18)');
            dots(g, x, y, i, j, 100, 3, '#B39C76');
            break;
        }
        case 'dock': {
            const tones = ['#9C7850', '#93704A', '#A58157'];
            for (let r = 0; r < 4; r++) { box(g, x, y + r * 4, T, 4, tones[(r + j + Math.floor(n * 3)) % 3]); box(g, x, y + r * 4 + 3, T, 1, '#6E4F30'); box(g, x + 2, y + r * 4 + 1, 1, 1, '#4E3620'); box(g, x + 13, y + r * 4 + 1, 1, 1, '#4E3620'); }
            if (at(i - 1, j) !== 'dock') box(g, x, y, 2, T, '#5A3F28');
            if (at(i + 1, j) !== 'dock') box(g, x + 14, y, 2, T, '#5A3F28');
            break;
        }
        case 'rock': {
            // a weathered rock surface, now and then a boulder sitting on it
            blocks(g, x, y, i, j, ['#B49A77', '#AE9471', '#B9A07D'], 7, 3);
            if (rnd(i, j, 8) > 0.55) { const a = x + 3 + Math.floor(rnd(i, j, 9) * 9); box(g, a, y + 4, 1, 3, 'rgba(80,60,40,.3)'); box(g, a + 1, y + 7, 2, 1, 'rgba(80,60,40,.3)'); box(g, a + 3, y + 8, 1, 2, 'rgba(80,60,40,.25)'); }
            if (rnd(i, j, 41) > 0.62) {
                const w = 7 + Math.floor(rnd(i, j, 42) * 4), h = 5 + Math.floor(rnd(i, j, 43) * 3), X = x + Math.floor(rnd(i, j, 44) * (16 - w)), Y = y + 1 + Math.floor(rnd(i, j, 45) * (13 - h));
                box(g, X + 1, Y + h, w, 1, 'rgba(60,40,20,.25)');
                box(g, X + 1, Y, w - 2, h, '#C2A784'); box(g, X, Y + 1, w, h - 2, '#C2A784');
                box(g, X + 1, Y, w - 2, 1, '#DCC5A0'); box(g, X + 1, Y + h - 1, w - 2, 1, '#92785A'); box(g, X + w - 1, Y + 1, 1, h - 2, '#9E8464');
            }
            dots(g, x, y, i, j, 140, 2, 'rgba(255,240,215,.25)');
            if (at(i, j + 1) !== 'rock' && j + 1 < m.h) { // a cliff face where the rocks end
                box(g, x, y + 10, T, 6, '#9A7F60');
                for (let q = 0; q < 4; q++) box(g, x + 1 + q * 4 + Math.floor(rnd(i, j, 11 + q) * 2), y + 11, 1, 5, '#866C50');
                box(g, x, y + 10, T, 1, '#CDB592');
            }
            if (at(i, j - 1) !== 'rock' && j > 0) box(g, x, y, T, 1, '#D2BA96');
            if (at(i - 1, j) !== 'rock' && i > 0) { box(g, x, y, 1, T, '#C8AF8B'); box(g, x + 1, y, 1, T, 'rgba(255,240,215,.15)'); }
            if (at(i + 1, j) !== 'rock' && i + 1 < m.w) box(g, x + 14, y, 2, T, '#937A5B');
            break;
        }
        case 'wall': {
            box(g, x, y, T, T, '#CDB48E');
            for (let r = 0; r < 4; r++) {
                box(g, x, y + r * 4 + 3, T, 1, '#B39A74');
                const off = (r + j) % 2 ? 0 : 4;
                for (let c = off; c < T; c += 8) box(g, x + c, y + r * 4, 1, 3, '#B39A74');
                box(g, x, y + r * 4, T, 1, 'rgba(255,245,225,.18)');
            }
            if (at(i, j - 1) !== 'wall') { box(g, x, y, T, 3, '#E4CFA8'); box(g, x, y, T, 1, '#F2E3C6'); box(g, x, y + 3, T, 1, '#A88E6A'); }
            if (at(i, j + 1) !== 'wall') box(g, x, y + 14, T, 2, '#A0855F');
            break;
        }
        case 'fence': {
            blocks(g, x, y, i, j, SAND, 1, 6);
            const h = at(i - 1, j) === 'fence' || at(i + 1, j) === 'fence', v = at(i, j - 1) === 'fence' || at(i, j + 1) === 'fence';
            box(g, x + 5, y + 13, 7, 2, SHADOW);
            if (h || !v) { box(g, x, y + 6, T, 2, '#8A6644'); box(g, x, y + 6, T, 1, '#A88158'); box(g, x, y + 10, T, 1, '#7A5A38'); }
            if (v) { box(g, x + 7, y, 2, T, '#8A6644'); box(g, x + 7, y, 1, T, '#A88158'); }
            box(g, x + 6, y + 3, 4, 11, '#7A5A38'); box(g, x + 6, y + 3, 4, 1, '#A88158'); box(g, x + 9, y + 4, 1, 10, '#5E4329');
            break;
        }
        case 'ditch': {
            blocks(g, x, y, i, j, SAND, 1, 6);
            box(g, x + 3, y, 10, T, '#C4A777'); box(g, x + 5, y, 6, T, '#B29469'); box(g, x + 3, y, 1, T, '#A88D63'); box(g, x + 12, y, 1, T, '#E6CC9E');
            if (n > 0.5) box(g, x + 6, y + 4 + Math.floor(n * 6), 3, 1, '#9E8259');
            break;
        }
        case 'dryearth': {
            box(g, x, y, T, T, n > 0.5 ? '#A98A63' : '#A3845D');
            box(g, x + 2, y + 5, 6, 1, 'rgba(60,40,20,.4)'); box(g, x + 8, y + 5, 1, 5, 'rgba(60,40,20,.4)'); box(g, x + 9, y + 10, 5, 1, 'rgba(60,40,20,.35)'); box(g, x + 4, y + 11, 1, 4, 'rgba(60,40,20,.3)');
            box(g, x + 1, y + 1, 4, 1, 'rgba(255,240,210,.15)');
            break;
        }
        case 'rubble': {
            blocks(g, x, y, i, j, SAND, 1, 6);
            box(g, x + 2, y + 13, 13, 2, SHADOW);
            const stones = [[1, 7, 7, 6, '#BFA785'], [8, 4, 6, 6, '#CDB592'], [6, 9, 8, 5, '#B39B78']];
            for (const [a, b, w, h, c] of stones) { box(g, x + a, y + b, w, h, c); box(g, x + a, y + b, w, 1, '#E2CFAE'); box(g, x + a, y + b + h - 1, w, 1, '#8E7658'); }
            break;
        }
        case 'pillar': {
            box(g, x, y, T, T, STONE[Math.floor(n * 3)]);
            box(g, x + 3, y + 13, 12, 3, SHADOW);
            box(g, x + 3, y + 2, 10, 13, '#E8DCC4'); box(g, x + 3, y + 2, 2, 13, '#F4EADA'); box(g, x + 11, y + 2, 2, 13, '#C9B591');
            box(g, x + 6, y + 3, 1, 11, 'rgba(0,0,0,.08)'); box(g, x + 9, y + 3, 1, 11, 'rgba(0,0,0,.08)');
            box(g, x + 2, y + 13, 12, 2, '#B9A27E');
            break;
        }
        case 'gate': {
            blocks(g, x, y, i, j, SAND, 1, 6);
            box(g, x, y, T, T, '#6E4F30'); box(g, x + 1, y + 1, 14, 14, '#8E6A44');
            box(g, x + 7, y + 1, 2, 14, '#5A3F28'); box(g, x + 1, y + 4, 14, 1, '#6E4F30'); box(g, x + 1, y + 11, 14, 1, '#6E4F30');
            box(g, x + 5, y + 7, 1, 2, '#D9B65A'); box(g, x + 10, y + 7, 1, 2, '#D9B65A');
            break;
        }
        default: { // sand
            blocks(g, x, y, i, j, SAND, 1, 6);
            dots(g, x, y, i, j, 110, 3, '#CDA978');
            dots(g, x, y, i, j, 130, 2, '#F4DFB4');
            if (n > 0.86) { const a = x + 3 + Math.floor(rnd(i, j, 12) * 9), b = y + 4 + Math.floor(rnd(i, j, 13) * 8); box(g, a, b, 2, 1, '#B89A70'); box(g, a, b - 1, 2, 1, '#EAD6AE'); }
            if (rnd(i, j, 14) > 0.8) { const b = y + 3 + Math.floor(rnd(i, j, 15) * 10); box(g, x + 2, b, 5, 1, 'rgba(180,140,90,.25)'); box(g, x + 7, b - 1, 3, 1, 'rgba(180,140,90,.2)'); }
        }
    }
}

// ---------- where two grounds meet
function edges(ctx, i, j) {
    const { m, S, g } = ctx, t = m.type(i, j), x = i * T, y = j * T;
    if (!SOFT_EDGE[t]) return;
    const sides = [[0, -1, 'top'], [0, 1, 'bottom'], [-1, 0, 'left'], [1, 0, 'right']];
    for (const [dx, dy, side] of sides) {
        const a = i + dx, b = j + dy;
        if (a < 0 || b < 0 || a >= m.w || b >= m.h) continue;
        const nt = m.type(a, b);
        if (nt === t) continue;
        // a strip along this side: k is the position along it, d the depth into the tile
        const at = (k, d, w, h, col) => {
            if (side === 'top') box(g, x + k, y + d, w, h, col);
            else if (side === 'bottom') box(g, x + k, y + 15 - d - (h - 1), w, h, col);
            else if (side === 'left') box(g, x + d, y + k, h, w, col);
            else box(g, x + 15 - d - (h - 1), y + k, h, w, col);
        };
        if ((t === 'sand' || t === 'path' || t === 'bank') && nt === 'grass') {
            for (let k = 0; k < 16; k++) { const r = rnd(a * 16 + k, b, 21); if (r > 0.35) at(k, 0, 1, r > 0.75 ? 3 : 2, S.grass[r > 0.6 ? 0 : 1]); }
        } else if (t === 'path' && (nt === 'sand' || nt === 'fence')) {
            for (let k = 0; k < 16; k += 2) if (rnd(i * 16 + k, j, 22) > 0.4) at(k, 0, 2, 1 + Math.floor(rnd(i, j * 16 + k, 23) * 2), SAND[0]);
        } else if (t === 'stone' && nt !== 'wall' && nt !== 'pillar') {
            at(0, 0, 16, 1, '#B5A383');
        } else if (t === 'water') {
            at(0, 0, 16, 3, 'rgba(200,235,225,.28)');
            for (let k = 0; k < 16; k++) if (rnd(i * 16 + k, j, 24) > 0.3) at(k, 0, 1, 1, 'rgba(240,252,248,.75)');
        } else if (t === 'farm') {
            at(0, 0, 16, 1, 'rgba(50,30,15,.35)');
        } else if (t === 'grass' && (nt === 'bank' || nt === 'water')) {
            at(0, 0, 16, 1, 'rgba(40,70,25,.25)');
        }
    }
}

// ---------- shadows of walls, cliffs and palms, down and to the right
function shadows(ctx, i, j) {
    const { m, g } = ctx, t = m.type(i, j), x = i * T, y = j * T;
    const tall = tt => tt === 'wall' || tt === 'rock';
    if (t === 'wall') {
        if (!tall(m.type(i, j + 1)) && j + 1 < m.h) box(g, x + 2, y + 16, 14, 4, SHADOW);
        if (!tall(m.type(i + 1, j)) && i + 1 < m.w) box(g, x + 16, y + 3, 3, 15, SHADOW);
    }
    if (t === 'rock' && !tall(m.type(i, j + 1)) && j + 1 < m.h && m.type(i, j + 1) !== 'water') box(g, x, y + 16, 16, 3, SHADOW);
}
function buildingShadow(g, b) {
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    box(g, x + 4, y + h, w, 5, SHADOW); box(g, x + w, y + 6, 5, h - 1, SHADOW);
}

// ---------- buildings
function building(ctx, b) {
    const { g, u } = ctx;
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    if (b.kind === 'temple') return temple(g, u, x, y, w, h);
    if (b.kind === 'gate') return duatGate(g, x, y, w, h);
    const roof = b.roof || '#B98F5E';
    const wall = '#DCBD8F', line = '#8E6C46';
    if (b.kind === 'stall') return stall(g, u, x, y, w, h, roof);
    // walls of mud brick, a flat roof with a parapet, windows set in, a framed door
    box(g, x, y, w, h, wall);
    for (let r = 10; r < h - 3; r += 4) for (let c = (r / 4) % 2 ? 0 : 6; c < w; c += 12) box(g, x + c + 1, y + r, 5, 1, 'rgba(150,110,70,.18)');
    box(g, x, y, w, 8, roof); box(g, x, y, w, 2, shade(roof, 0.18)); box(g, x, y + 8, w, 2, 'rgba(60,40,20,.25)');
    box(g, x + 3, y + 3, 4, 3, shade(roof, -0.25)); box(g, x + 3, y + 2, 4, 1, shade(roof, 0.1)); // a jar on the roof
    if (w > 48) { box(g, x + w - 14, y + 3, 9, 3, '#C9A46A'); box(g, x + w - 14, y + 3, 9, 1, '#E0C08A'); } // a drying mat
    box(g, x, y + h - 3, w, 3, '#B8976A');
    for (let k = 10; k < w - 14; k += 20) {
        if (Math.abs(k + 3 - w / 2) < 11) continue; // not over the door
        box(g, x + k, y + 14, 7, 6, '#4A3424'); box(g, x + k - 1, y + 13, 9, 1, '#EAD2A8'); box(g, x + k - 1, y + 20, 9, 1, '#B8976A'); box(g, x + k + 3, y + 14, 1, 6, '#6A4C34');
    }
    const dx = x + w / 2 - 7, dy = y + h - 15;
    box(g, dx, dy, 14, 15, '#E6D2AC'); box(g, dx + 2, dy + 2, 10, 13, '#3A2618'); box(g, dx + 2, dy + 2, 10, 2, '#24170E'); box(g, dx - 1, dy - 1, 16, 2, '#C9A97A');
    outline(g, x, y, w, h, line);
}
function stall(g, u, x, y, w, h, roof) {
    // a counter with goods under a striped awning on two posts
    box(g, x + 2, y + 4, 2, h - 2, '#6E4F30'); box(g, x + w - 4, y + 4, 2, h - 2, '#6E4F30');
    box(g, x + 4, y + h - 10, w - 8, 9, '#A07A50'); box(g, x + 4, y + h - 10, w - 8, 1, '#C49A68'); box(g, x + 4, y + h - 2, w - 8, 1, '#6E4F30');
    const goods = ['#D9733A', '#7FA650', '#8E5BA8', '#E0B040', '#C0392B', '#5FA7A3'];
    for (let k = 0; k < (w - 12) / 5; k++) { const c = goods[k % goods.length]; box(g, x + 7 + k * 5, y + h - 14, 4, 4, c); box(g, x + 7 + k * 5, y + h - 14, 2, 1, 'rgba(255,255,255,.4)'); }
    for (let k = 0; k < w; k += 8) { box(g, x + k, y, 4, 8, roof); box(g, x + k + 4, y, 4, 8, '#F2E8DA'); }
    for (let k = 0; k < w; k += 4) box(g, x + k + 1, y + 8, 2, 2, k % 8 < 4 ? roof : '#F2E8DA');
    box(g, x, y, w, 1, 'rgba(255,255,255,.35)'); box(g, x, y + 10, w, 2, 'rgba(60,40,20,.2)');
}
function temple(g, u, x, y, w, h) {
    // two sloping pylons with carved bands and flagpoles, the great door with a winged sun, columns between
    const lime = '#E3D3B3', mid = '#D2BF9C', dark = '#B49C77', carve = '#A48A64';
    box(g, x + 30, y + 10, w - 60, h - 10, '#CBB591');
    for (let k = 0; k < 4; k++) {
        const cx = x + 36 + k * 16 + (k > 1 ? 8 : 0);
        if (Math.abs(cx + 3 - (x + w / 2)) < 14) continue;
        box(g, cx, y + 20, 8, h - 20, '#E6D8BC'); box(g, cx, y + 20, 2, h - 20, '#F2E8D4'); box(g, cx + 6, y + 20, 2, h - 20, '#C4AE88');
        box(g, cx - 2, y + 16, 12, 4, '#7FA650'); box(g, cx - 1, y + 15, 10, 1, '#9CC46A'); box(g, cx - 2, y + 19, 12, 1, '#D9B65A');
    }
    for (const [px, flip] of [[x, false], [x + w - 34, true]]) {
        for (let r = 0; r < h; r++) {
            const inset = Math.floor((h - r) / 8);
            const a = flip ? px : px + inset, ww = 34 - inset;
            box(g, a, y + r, ww, 1, r < 5 ? lime : mid);
        }
        box(g, px + (flip ? 0 : 6), y, 28, 3, '#EFE3CA'); box(g, px + (flip ? 0 : 6), y + 3, 28, 1, dark);
        for (let r = 12; r < h - 8; r += 9) {
            box(g, px + 6, y + r, 22, 1, carve);
            for (let k = 0; k < 5; k++) { const c = px + 8 + k * 4; box(g, c, y + r + 2, 2, 3, rnd(c, r, 3) > 0.5 ? carve : '#B07A5A'); if (rnd(c, r, 4) > 0.6) box(g, c, y + r + 3, 1, 1, '#4F7FB0'); }
        }
        box(g, px + (flip ? 33 : 0), y, 1, h, dark);
        // flagpoles reaching above the roof, on the top layer
        const fx = flip ? px + 6 : px + 26;
        box(u, fx, y - 22, 2, 30, '#7A5A38'); box(u, fx, y - 22, 1, 30, '#A07A50');
        box(u, flip ? fx + 2 : fx - 7, y - 20, 7, 4, flip ? '#C0392B' : '#2F6FB6'); box(u, flip ? fx + 2 : fx - 6, y - 16, 5, 2, flip ? '#A32F23' : '#25599A');
    }
    const dx = x + w / 2 - 10, dy = y + h - 30;
    box(g, dx - 3, dy - 6, 26, 36, '#DCCBA8'); box(g, dx, dy, 20, 30, '#2E1F14'); box(g, dx, dy, 20, 3, '#1E140C');
    box(g, dx - 4, dy - 8, 28, 3, '#E9DCC0');
    box(g, dx + 8, dy - 7, 4, 3, '#E0B040'); box(g, dx + 1, dy - 6, 7, 1, '#4F7FB0'); box(g, dx + 12, dy - 6, 7, 1, '#4F7FB0'); box(g, dx + 3, dy - 5, 5, 1, '#C0392B'); box(g, dx + 12, dy - 5, 5, 1, '#C0392B');
    outline(g, x + 30, y + 10, w - 60, 1, dark);
}
function duatGate(g, x, y, w, h) {
    box(g, x - 5, y - 8, w + 10, h + 8, '#857462');
    for (let k = 0; k < 4; k++) box(g, x - 5 + rnd(x, k, 2) * (w + 6), y - 8 + k * 6, 4, 1, '#6E5F50');
    box(g, x - 5, y - 8, w + 10, 2, '#A29482');
    box(g, x + 3, y + 3, w - 6, h - 3, '#140D09'); box(g, x + 3, y + 3, w - 6, 2, '#6B3FA0'); box(g, x + 3, y + 5, 1, h - 5, 'rgba(120,70,190,.6)'); box(g, x + w - 4, y + 5, 1, h - 5, 'rgba(120,70,190,.6)');
    box(g, x + w / 2 - 2, y - 6, 4, 4, '#D9B65A'); box(g, x + w / 2 - 1, y - 5, 2, 2, '#2B2018');
}
function outline(g, x, y, w, h, col) { box(g, x, y, w, 1, col); box(g, x, y + h - 1, w, 1, col); box(g, x, y, 1, h, col); box(g, x + w - 1, y, 1, h, col); }
function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)));
    return `rgb(${c.join(',')})`;
}

// ---------- palms and lotus
function palm(ctx, x, y, i, j) {
    const { g, u } = ctx;
    box(g, x + 5, y + 13, 10, 3, SHADOW);
    for (let r = 0; r < 11; r++) box(g, x + 7 + (r < 4 ? 1 : 0), y + 5 + r, 3, 1, r % 3 === 0 ? '#5E4329' : '#7A5A38');
    box(g, x + 7, y + 5, 1, 11, '#94704A');
    // the crown, over people walking behind it
    const dk = '#3F6630', md = '#4E7A3A', lt = '#6E9C4E', hi = '#8DB866';
    const fr = [[-1, 3, 7, 2, md], [-2, 5, 4, 2, dk], [10, 3, 7, 2, md], [14, 5, 4, 2, dk], [3, 0, 10, 2, lt], [5, -2, 6, 2, md], [1, 1, 4, 2, lt], [12, 1, 4, 2, lt], [0, 6, 3, 2, dk], [14, 7, 3, 1, dk]];
    for (const [a, b, w, h, c] of fr) box(u, x + a, y + b, w, h, c);
    box(u, x + 4, y + 0, 4, 1, hi); box(u, x + 9, y - 2, 3, 1, hi);
    box(u, x + 6, y + 3, 5, 4, '#365A2A'); box(u, x + 7, y + 6, 1, 2, '#A0522D'); box(u, x + 9, y + 6, 1, 2, '#A0522D'); box(u, x + 8, y + 7, 1, 1, '#B8662F');
}
function lotus(g, x, y, i, j) {
    box(g, x + 2, y + 7, 7, 4, '#5E8C46'); box(g, x + 2, y + 7, 7, 1, '#7FA65E'); box(g, x + 9, y + 3, 5, 3, '#5E8C46');
    box(g, x + 4, y + 4, 4, 3, '#7FA6E0'); box(g, x + 5, y + 3, 2, 1, '#B9CFF2'); box(g, x + 5, y + 6, 2, 1, '#E8C55A');
}
function pillarTop(u, x, y) {
    box(u, x + 1, y - 4, 14, 6, '#D7C7A6'); box(u, x + 1, y - 4, 14, 1, '#F2E8D4'); box(u, x + 2, y + 1, 12, 1, '#B49C77');
    box(u, x + 3, y - 2, 2, 2, '#7FA650'); box(u, x + 11, y - 2, 2, 2, '#7FA650');
}

// ---------- decor: { k, x, y } in data/maps/*.json. Which ones block walking is in map.js (SOLID_DECOR).
const DECOR = {
    // a column with a papyrus capital, two tiles tall
    column(c, x, y) {
        const { g, u } = c;
        box(g, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 2, y + 12, 12, 4, '#BFA985'); box(g, x + 2, y + 12, 12, 1, '#DCCBA8');
        box(u, x + 4, y - 8, 8, 20, '#E8DCC4'); box(u, x + 4, y - 8, 2, 20, '#F5EDDD'); box(u, x + 10, y - 8, 2, 20, '#C9B591');
        for (let r = -4; r < 12; r += 5) box(u, x + 4, y + r, 8, 1, '#D2C2A0');
        box(u, x + 6, y - 2, 1, 2, '#4F7FB0'); box(u, x + 9, y + 3, 1, 2, '#C0392B');
        box(u, x + 1, y - 14, 14, 6, '#7FA650'); box(u, x + 2, y - 15, 12, 1, '#9CC46A'); box(u, x + 1, y - 9, 14, 1, '#D9B65A');
        box(u, x + 3, y - 13, 1, 4, '#5E8C46'); box(u, x + 7, y - 13, 1, 4, '#5E8C46'); box(u, x + 11, y - 13, 1, 4, '#5E8C46');
        box(u, x, y - 17, 16, 3, '#E3D3B3'); box(u, x, y - 17, 16, 1, '#F2E8D4');
    },
    // Set's animal, seated on a plinth: long snout, square ears, forked tail
    statue_set(c, x, y) {
        const { g, u } = c;
        box(g, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 1, y + 9, 14, 7, '#C9B591'); box(g, x + 1, y + 9, 14, 1, '#E3D3B3'); box(g, x + 1, y + 15, 14, 1, '#A48A64');
        box(g, x + 3, y + 11, 3, 1, '#A48A64'); box(g, x + 8, y + 11, 4, 1, '#A48A64');
        const b = '#3A302A', hl = '#5A4C42';
        box(u, x + 5, y + 1, 6, 8, b); box(u, x + 5, y + 1, 1, 8, hl); box(u, x + 4, y + 6, 8, 3, b);
        box(u, x + 6, y - 5, 4, 6, b); box(u, x + 9, y - 3, 4, 2, b); box(u, x + 12, y - 2, 1, 1, b); // head and snout
        box(u, x + 6, y - 8, 1, 3, b); box(u, x + 6, y - 9, 2, 1, b); box(u, x + 8, y - 8, 1, 3, b); box(u, x + 8, y - 9, 2, 1, b); // ears
        box(u, x + 8, y - 3, 1, 1, '#D9B65A'); box(u, x + 5, y + 2, 6, 1, '#D9B65A');
        box(u, x + 3, y + 3, 1, 5, b); box(u, x + 2, y + 2, 1, 1, b); box(u, x + 4, y + 2, 1, 1, b);
    },
    // a falcon on a plinth, for Horus
    statue_falcon(c, x, y) {
        const { g, u } = c;
        box(g, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 1, y + 9, 14, 7, '#C9B591'); box(g, x + 1, y + 9, 14, 1, '#E3D3B3'); box(g, x + 1, y + 15, 14, 1, '#A48A64');
        const b = '#2E3352', w = '#454B78';
        box(u, x + 5, y - 2, 6, 11, b); box(u, x + 4, y + 1, 2, 7, w); box(u, x + 10, y + 1, 2, 7, w); box(u, x + 6, y + 6, 4, 3, '#E8DCC4');
        box(u, x + 6, y - 6, 5, 5, b); box(u, x + 10, y - 4, 2, 2, '#D9B65A'); box(u, x + 8, y - 4, 1, 1, '#E0A83A');
        box(u, x + 7, y - 9, 3, 3, '#E8DCC4'); box(u, x + 7, y - 10, 3, 1, '#C0392B'); // the double crown, small
        box(u, x + 5, y + 8, 6, 1, '#D9B65A');
    },
    // a jackal lying on a chest, for the Duat gate
    jackal(c, x, y) {
        const { g, u } = c;
        box(g, x + 2, y + 13, 14, 3, SHADOW);
        box(g, x + 1, y + 7, 14, 8, '#2B2018'); box(g, x + 1, y + 7, 14, 1, '#D9B65A'); box(g, x + 1, y + 14, 14, 1, '#D9B65A'); box(g, x + 6, y + 9, 4, 3, '#D9B65A');
        const b = '#1A1410';
        box(u, x + 2, y + 2, 10, 5, b); box(u, x + 10, y - 2, 4, 5, b); box(u, x + 13, y, 2, 2, b);
        box(u, x + 10, y - 5, 1, 3, b); box(u, x + 12, y - 5, 1, 3, b); box(u, x + 12, y - 1, 1, 1, '#D9B65A');
        box(u, x + 1, y + 5, 2, 1, b); box(u, x + 10, y + 2, 3, 1, '#D9B65A');
    },
    // a bronze bowl of fire on three legs; the flame moves in render.js
    brazier(c, x, y) {
        const { g, u } = c;
        box(g, x + 4, y + 13, 10, 3, SHADOW);
        box(g, x + 4, y + 9, 1, 6, '#5A3F28'); box(g, x + 11, y + 9, 1, 6, '#5A3F28'); box(g, x + 7, y + 10, 2, 5, '#5A3F28');
        box(u, x + 2, y + 5, 12, 4, '#9C6A2E'); box(u, x + 2, y + 5, 12, 1, '#D9A44A'); box(u, x + 3, y + 9, 10, 1, '#6E4A20');
        box(u, x + 4, y + 3, 8, 2, '#3A2618');
    },
    // still water with a stone rim on its outer sides and lotus pads; pools next to each other join up
    pool(c, x, y, d) {
        const { g, m } = c, i = d.x, j = d.y;
        const same = (a, b) => (m.decor || []).some(e => e.k === 'pool' && e.x === a && e.y === b);
        box(g, x, y, T, T, '#3F8F8B');
        box(g, x + 2, y + 6, 5, 1, 'rgba(255,255,255,.2)'); box(g, x + 8, y + 11, 4, 1, 'rgba(255,255,255,.15)');
        const rim = '#CDB896', rimHi = '#E6D6B8';
        if (!same(i, j - 1)) { box(g, x, y, T, 3, rim); box(g, x, y, T, 1, rimHi); box(g, x, y + 3, T, 2, 'rgba(0,30,40,.25)'); }
        if (!same(i, j + 1)) { box(g, x, y + 13, T, 3, rim); box(g, x, y + 13, T, 1, rimHi); }
        if (!same(i - 1, j)) { box(g, x, y, 3, T, rim); box(g, x + 3, y + 3, 1, 10, 'rgba(0,30,40,.2)'); }
        if (!same(i + 1, j)) box(g, x + 13, y, 3, T, rim);
        if (rnd(i, j, 31) > 0.4) { box(g, x + 5, y + 6, 5, 3, '#5E8C46'); box(g, x + 5, y + 6, 5, 1, '#7FA65E'); if (rnd(i, j, 32) > 0.5) { box(g, x + 6, y + 5, 3, 2, '#E8A0B8'); box(g, x + 7, y + 4, 1, 1, '#F6D0DC'); } }
    },
    // an offering table: bread, fruit, a jar, a lotus
    altar(c, x, y) {
        const { g } = c;
        box(g, x + 1, y + 13, 15, 3, SHADOW);
        box(g, x + 1, y + 7, 14, 7, '#DCCBA8'); box(g, x + 1, y + 7, 14, 1, '#F0E4CC'); box(g, x + 1, y + 13, 14, 1, '#B49C77');
        box(g, x + 3, y + 9, 10, 1, '#C0392B'); box(g, x + 3, y + 10, 10, 1, '#4F7FB0');
        box(g, x + 2, y + 3, 4, 4, '#C98A4A'); box(g, x + 2, y + 3, 4, 1, '#E3A86A');
        box(g, x + 7, y + 4, 3, 3, '#8E5BA8'); box(g, x + 8, y + 3, 2, 2, '#E0B040');
        box(g, x + 11, y + 1, 3, 6, '#B0703A'); box(g, x + 11, y + 1, 3, 1, '#D08A4A');
    },
    // a strip of red stone down the middle of the floor, the procession way
    runner(c, x, y, d) {
        const { g, m } = c;
        const same = (a, b) => (m.decor || []).some(e => e.k === 'runner' && e.x === a && e.y === b);
        box(g, x, y, T, T, '#B8735A'); box(g, x, y, T, 1, '#CC8A6E'); box(g, x, y + 15, T, 1, '#9C5E48');
        if (!same(d.x - 1, d.y)) { box(g, x, y, 2, T, '#D9B65A'); }
        if (!same(d.x + 1, d.y)) { box(g, x + 14, y, 2, T, '#D9B65A'); }
        if ((d.y % 2) === 0) { box(g, x + 6, y + 6, 4, 4, '#D9B65A'); box(g, x + 7, y + 7, 2, 2, '#B8735A'); }
    },
    // a potted palm or papyrus
    plant(c, x, y) {
        const { g, u } = c;
        box(g, x + 4, y + 13, 11, 3, SHADOW);
        box(g, x + 4, y + 8, 8, 7, '#B0703A'); box(g, x + 4, y + 8, 8, 1, '#D08A4A'); box(g, x + 5, y + 14, 6, 1, '#8A5428'); box(g, x + 5, y + 10, 6, 1, '#4F7FB0');
        box(u, x + 7, y + 1, 2, 7, '#4E7A3A'); box(u, x + 3, y - 2, 4, 2, '#5E8C46'); box(u, x + 9, y - 2, 4, 2, '#5E8C46'); box(u, x + 6, y - 4, 4, 2, '#6E9C4E');
        box(u, x + 2, y, 3, 1, '#4E7A3A'); box(u, x + 11, y, 3, 1, '#4E7A3A'); box(u, x + 7, y - 5, 2, 1, '#8DB866');
    },
    // clay jars leaning together
    jars(c, x, y) {
        const { g } = c;
        box(g, x + 2, y + 13, 14, 3, SHADOW);
        for (const [a, b, w, h] of [[2, 5, 5, 9], [7, 3, 6, 11], [11, 8, 4, 6]]) {
            box(g, x + a, y + b, w, h, '#B0703A'); box(g, x + a + 1, y + b - 1, w - 2, 1, '#8A5428'); box(g, x + a, y + b, 1, h, '#C98A4A'); box(g, x + a + w - 1, y + b + 1, 1, h - 1, '#8A5428');
        }
    },
    // baskets and a crate of market goods
    goods(c, x, y) {
        const { g } = c;
        box(g, x + 2, y + 13, 14, 3, SHADOW);
        box(g, x + 1, y + 7, 8, 7, '#A07A50'); box(g, x + 1, y + 7, 8, 1, '#C49A68'); box(g, x + 4, y + 7, 1, 7, '#7A5A38');
        box(g, x + 9, y + 9, 6, 5, '#C9A46A'); box(g, x + 9, y + 9, 6, 1, '#E0C08A');
        box(g, x + 10, y + 7, 2, 2, '#D9733A'); box(g, x + 12, y + 7, 2, 2, '#E0B040'); box(g, x + 2, y + 5, 3, 2, '#7FA650'); box(g, x + 5, y + 5, 3, 2, '#8E5BA8');
    },
    flowers(c, x, y, d) {
        const { g } = c, i = d.x, j = d.y;
        const cols = ['#F2D25A', '#F6F0E0', '#E8A0B8', '#C0392B'];
        for (let q = 0; q < 6; q++) {
            const a = x + 2 + Math.floor(rnd(i, j, 60 + q) * 12), b = y + 3 + Math.floor(rnd(i, j, 70 + q) * 10);
            box(g, a, b + 1, 1, 2, '#4E7A3A'); box(g, a, b, 1, 1, cols[q % cols.length]); box(g, a - 1, b, 1, 1, 'rgba(255,255,255,.25)');
        }
    },
    bush(c, x, y, d) {
        const { g } = c;
        box(g, x + 3, y + 12, 12, 3, SHADOW);
        box(g, x + 2, y + 6, 12, 7, '#6E8A44'); box(g, x + 4, y + 4, 8, 3, '#7FA650'); box(g, x + 3, y + 5, 3, 2, '#8DB866'); box(g, x + 2, y + 11, 12, 2, '#55703A');
        if (rnd(d.x, d.y, 5) > 0.5) { box(g, x + 5, y + 7, 1, 1, '#C0392B'); box(g, x + 10, y + 9, 1, 1, '#C0392B'); }
    },
    reeds(c, x, y, d) {
        const { g, u } = c;
        for (let q = 0; q < 6; q++) {
            const a = x + 1 + q * 2 + Math.floor(rnd(d.x, d.y, q) * 2), h = 7 + Math.floor(rnd(d.x, d.y, q + 9) * 6);
            box(g, a, y + 15 - h, 1, h, q % 2 ? '#6E8A44' : '#55703A');
            if (q % 2) box(u, a, y + 13 - h, 1, 3, '#8E6A44');
        }
    },
    // a small papyrus boat tied up on the water
    skiff(c, x, y) {
        const { g } = c;
        box(g, x - 2, y + 9, 20, 3, 'rgba(0,30,40,.25)');
        box(g, x - 2, y + 6, 20, 4, '#C9A46A'); box(g, x - 3, y + 4, 3, 3, '#C9A46A'); box(g, x + 16, y + 4, 3, 3, '#C9A46A');
        for (let k = 0; k < 20; k += 3) box(g, x - 2 + k, y + 6, 1, 4, '#A8864E');
        box(g, x - 2, y + 6, 20, 1, '#E0C08A'); box(g, x + 7, y + 1, 1, 6, '#6E4F30');
    },
    rocks(c, x, y) {
        const { g } = c;
        box(g, x + 2, y + 12, 14, 4, SHADOW);
        for (const [a, b, w, h] of [[1, 7, 8, 7], [8, 9, 7, 5], [5, 4, 5, 4]]) { box(g, x + a, y + b, w, h, '#B39B78'); box(g, x + a, y + b, w, 1, '#D7C19E'); box(g, x + a + w - 1, y + b + 1, 1, h - 1, '#8E7658'); }
    },
    // a post wrapped in straw, for training
    dummy(c, x, y) {
        const { g, u } = c;
        box(g, x + 5, y + 13, 9, 3, SHADOW);
        box(g, x + 7, y + 6, 2, 9, '#6E4F30');
        box(u, x + 4, y - 2, 8, 9, '#D9B65A'); box(u, x + 4, y - 2, 2, 9, '#EACB7A'); box(u, x + 4, y + 1, 8, 1, '#A8864E'); box(u, x + 4, y + 4, 8, 1, '#A8864E');
        box(u, x + 1, y + 1, 14, 2, '#8E6A44'); box(u, x + 6, y - 5, 4, 3, '#D9B65A');
    },
    // a round target of reeds on a stand
    target(c, x, y) {
        const { g, u } = c;
        box(g, x + 4, y + 13, 10, 3, SHADOW);
        box(g, x + 4, y + 8, 1, 7, '#6E4F30'); box(g, x + 11, y + 8, 1, 7, '#6E4F30');
        box(u, x + 3, y - 1, 10, 10, '#E0C08A'); box(u, x + 2, y + 1, 12, 6, '#E0C08A'); box(u, x + 5, y + 1, 6, 6, '#C0392B'); box(u, x + 4, y + 2, 8, 4, '#C0392B'); box(u, x + 7, y + 3, 2, 2, '#F6F0E0');
    },
    well(c, x, y) {
        const { g, u } = c;
        box(g, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 1, y + 5, 14, 9, '#BFA985'); box(g, x + 1, y + 5, 14, 2, '#DCCBA8'); box(g, x + 3, y + 6, 10, 2, '#1E2A2A');
        for (let k = 0; k < 14; k += 4) box(g, x + 1 + k, y + 9, 1, 5, '#A48A64');
        box(u, x + 2, y - 4, 1, 10, '#6E4F30'); box(u, x + 13, y - 4, 1, 10, '#6E4F30'); box(u, x + 2, y - 4, 12, 1, '#6E4F30'); box(u, x + 7, y - 3, 1, 5, '#C9A46A'); box(u, x + 6, y + 1, 3, 2, '#8A5428');
    },
    // a domed bread oven
    oven(c, x, y) {
        const { g, u } = c;
        box(g, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 2, y + 6, 12, 9, '#B98A5E'); box(g, x + 3, y + 4, 10, 2, '#B98A5E'); box(g, x + 5, y + 3, 6, 1, '#C99A6E');
        box(g, x + 3, y + 5, 3, 3, '#D3A57A'); box(g, x + 6, y + 9, 4, 5, '#2B1A10'); box(g, x + 7, y + 11, 2, 2, '#E07A30');
        box(u, x + 7, y - 3, 2, 3, 'rgba(240,235,225,.35)'); box(u, x + 6, y - 6, 2, 3, 'rgba(240,235,225,.22)');
    },
    // a shaduf: a pole on a post with a bucket, for lifting water
    shaduf(c, x, y) {
        const { g, u } = c;
        box(g, x + 4, y + 13, 10, 3, SHADOW);
        box(g, x + 7, y + 4, 2, 11, '#6E4F30'); box(g, x + 7, y + 4, 1, 11, '#8E6A44');
        for (let k = 0; k < 14; k++) box(u, x - 2 + k, y + 4 - Math.floor(k / 2), 2, 1, '#8E6A44');
        box(u, x - 3, y + 4, 3, 3, '#5A4C42'); box(u, x + 11, y - 2, 1, 7, '#6E4F30'); box(u, x + 10, y + 5, 3, 3, '#8A5428');
    },
    // a mat with dates or fish drying in the sun
    mat(c, x, y, d) {
        const { g } = c;
        box(g, x + 1, y + 4, 14, 9, '#C9A46A'); box(g, x + 1, y + 4, 14, 1, '#E0C08A'); for (let k = 2; k < 14; k += 3) box(g, x + 1 + k, y + 5, 1, 8, '#B08E56');
        const fish = rnd(d.x, d.y, 3) > 0.5;
        for (let q = 0; q < 5; q++) { const a = x + 3 + (q % 3) * 4, b = y + 6 + Math.floor(q / 3) * 4; box(g, a, b, fish ? 3 : 2, fish ? 1 : 2, fish ? '#A8B8C0' : '#7A3A1E'); }
    },
    bench(c, x, y) {
        const { g } = c;
        box(g, x + 1, y + 12, 15, 3, SHADOW);
        box(g, x + 1, y + 7, 14, 4, '#D2C2A0'); box(g, x + 1, y + 7, 14, 1, '#ECE0C8'); box(g, x + 2, y + 11, 3, 3, '#B49C77'); box(g, x + 11, y + 11, 3, 3, '#B49C77');
    },
    // a tall pole with a pennant
    banner(c, x, y, d) {
        const { g, u } = c;
        box(g, x + 7, y + 13, 6, 2, SHADOW);
        box(u, x + 7, y - 14, 2, 28, '#7A5A38'); box(u, x + 7, y - 14, 1, 28, '#A07A50'); box(u, x + 6, y - 15, 4, 1, '#D9B65A');
        const col = d.c || '#C0392B';
        box(u, x + 9, y - 13, 6, 8, col); box(u, x + 9, y - 5, 4, 2, col); box(u, x + 9, y - 13, 6, 1, 'rgba(255,255,255,.3)'); box(u, x + 10, y - 10, 3, 2, '#D9B65A');
    },
    // cloth hanging down a wall
    hanging(c, x, y, d) {
        const { g } = c;
        const col = d.c || '#2F6FB6';
        box(g, x + 3, y + 1, 10, 1, '#6E4F30'); box(g, x + 4, y + 2, 8, 12, col); box(g, x + 4, y + 2, 8, 1, 'rgba(255,255,255,.25)');
        box(g, x + 6, y + 6, 4, 4, '#D9B65A'); box(g, x + 7, y + 7, 2, 2, col); box(g, x + 4, y + 13, 2, 2, col); box(g, x + 7, y + 13, 2, 2, col); box(g, x + 10, y + 13, 2, 2, col);
    },
    // a carved stone slab with a rounded top: the inscription to read
    stele(c, x, y) {
        const { g, u } = c;
        box(g, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 2, y + 12, 12, 3, '#B49C77');
        box(u, x + 4, y - 4, 8, 16, '#D9C9A6'); box(u, x + 5, y - 5, 6, 1, '#D9C9A6'); box(u, x + 4, y - 4, 1, 16, '#EDE1C6'); box(u, x + 11, y - 3, 1, 15, '#B49C77');
        box(u, x + 6, y - 3, 4, 2, '#E0B040');
        for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) box(u, x + 5 + k * 2, y + r * 3, 1, 2, rnd(x + k, r, 2) > 0.5 ? '#8E7458' : '#A48A64');
    },
    // a small shrine with a figure inside
    shrine(c, x, y) {
        const { g, u } = c;
        box(g, x + 2, y + 13, 14, 3, SHADOW);
        box(g, x + 1, y + 11, 14, 4, '#C9B591'); box(g, x + 1, y + 11, 14, 1, '#E3D3B3');
        box(u, x + 2, y - 2, 12, 13, '#DCCBA8'); box(u, x + 1, y - 4, 14, 3, '#E9DCC0'); box(u, x + 1, y - 4, 14, 1, '#F5ECD8');
        box(u, x + 4, y + 1, 8, 10, '#3A2A1E'); box(u, x + 7, y + 3, 2, 2, '#D9B65A'); box(u, x + 6, y + 5, 4, 5, '#D9B65A'); box(u, x + 6, y + 5, 1, 5, '#F0D27A');
        box(u, x + 6, y - 3, 4, 1, '#4F7FB0');
    },
    // a dig: a pit, a rope square on pegs, a basket and a shovel
    dig(c, x, y) {
        const { g } = c;
        box(g, x + 3, y + 4, 10, 8, '#B8955E'); box(g, x + 4, y + 5, 8, 6, '#9C7A48'); box(g, x + 4, y + 5, 8, 1, '#7E5F36');
        box(g, x + 1, y + 2, 1, 1, '#6E4F30'); box(g, x + 14, y + 2, 1, 1, '#6E4F30'); box(g, x + 1, y + 13, 1, 1, '#6E4F30'); box(g, x + 14, y + 13, 1, 1, '#6E4F30');
        box(g, x + 1, y + 2, 14, 1, 'rgba(240,230,200,.7)'); box(g, x + 1, y + 13, 14, 1, 'rgba(240,230,200,.7)');
        box(g, x + 12, y + 9, 3, 3, '#C9A46A'); box(g, x + 1, y + 7, 1, 6, '#8E6A44'); box(g, x, y + 12, 3, 2, '#7E8A90');
    },
    // ruins: a column fallen on its side, in pieces
    fallen(c, x, y) {
        const { g } = c;
        box(g, x + 1, y + 12, 16, 3, SHADOW);
        box(g, x, y + 6, 9, 7, '#E3D6BC'); box(g, x, y + 6, 9, 1, '#F2E8D4'); box(g, x + 8, y + 6, 1, 7, '#C9B591');
        box(g, x + 10, y + 7, 6, 6, '#DCCDB0'); box(g, x + 10, y + 7, 6, 1, '#F2E8D4'); box(g, x + 15, y + 7, 1, 6, '#BFA985');
        for (let k = 2; k < 9; k += 3) box(g, x + k, y + 7, 1, 6, 'rgba(0,0,0,.08)');
    },
    // ruins: a statue broken at the waist
    broken(c, x, y) {
        const { g, u } = c;
        box(g, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 2, y + 9, 12, 6, '#C9B591'); box(g, x + 2, y + 9, 12, 1, '#E3D3B3');
        box(u, x + 4, y + 1, 8, 8, '#BFA985'); box(u, x + 4, y + 1, 2, 8, '#D7C7A6'); box(u, x + 5, y, 3, 1, '#BFA985'); box(u, x + 9, y + 1, 2, 1, '#A48A64');
        box(g, x + 12, y + 12, 3, 2, '#BFA985');
    },
    // ruins: a block with carving on it
    block(c, x, y) {
        const { g } = c;
        box(g, x + 2, y + 12, 15, 3, SHADOW);
        box(g, x + 1, y + 4, 14, 10, '#D2C2A0'); box(g, x + 1, y + 4, 14, 1, '#ECE0C8'); box(g, x + 14, y + 5, 1, 9, '#B49C77');
        for (let k = 0; k < 3; k++) { box(g, x + 3 + k * 4, y + 7, 2, 3, '#A48A64'); box(g, x + 4 + k * 4, y + 11, 1, 1, '#A48A64'); }
    },
};
export const DECOR_KINDS = Object.keys(DECOR);
