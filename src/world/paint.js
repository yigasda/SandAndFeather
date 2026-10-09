// Painting the still world, once per map and season, into two off-screen layers at 16px a tile:
//   ground  the land, its edges and shadows, and everything standing on it
//   top     what stands over people walking behind it: palm crowns, statues, columns, flagpoles
// The look follows top-down pixel games like Pokémon: flat land with a small pattern repeated in fixed places, clear
// edges with rounded corners where one kind of land meets another, rocks and walls as raised blocks with a lit top
// and a dark face, water darker the farther from the shore, and a dark outline around every object but never the land.
// Objects (buildings, palms, fences, the map's "decor") are drawn on their own layers first; the outline is traced
// from their shape and then they are laid onto the ground and top layers.

export const T = 16;
export const rnd = (i, j, k = 1) => { const x = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); };

const LINE = '#4A3526';                 // the outline around objects
const SHADOW = 'rgba(70,45,20,.22)';
const SAND = { base: '#EBCF9F', dark: '#DDBE8A', light: '#F4DFB4' };
const PATH = { base: '#E4D6B9', edge: '#B9A27E', light: '#F2E8D4', seam: '#D6C6A6' };
const STONE = { base: '#E6DAC2', seam: '#D2C3A6', light: '#F3EBDA', edge: '#C2AF8E' };
const BANK = { base: '#D9C59B', lip: '#AE9268', dark: '#C6AF84' };
const ROCK = { top: '#C99D6B', topDark: '#B5895A', topLight: '#DDB582', face: '#9C744C', faceDark: '#7E5A38', lip: '#E3BE8C' };
const WALL = { top: '#E2D0AE', topSeam: '#CDB993', face: '#C9AF86', faceSeam: '#AE9269', lip: '#F0E2C6' };
// decor drawn flat on the ground: no outline (a flower bed with an outline turns into a blob)
const FLAT = new Set(['runner', 'flowers', 'mat', 'dig', 'reeds', 'pool', 'bed']);

const box = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const layer = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export function paintMap(m, S, gr, tp) {
    const W = m.w * T, H = m.h * T;
    gr.width = tp.width = W; gr.height = tp.height = H;
    const g = gr.getContext('2d'), u = tp.getContext('2d');
    u.clearRect(0, 0, W, H);
    const og = layer(W, H), ou = layer(W, H); // objects, to be outlined
    const ctx = { m, S, g, s: g, o: og.getContext('2d'), ou: ou.getContext('2d'), u, depth: waterDepth(m) };
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) tile(ctx, i, j);
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) edges(ctx, i, j);
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) shadows(ctx, i, j);
    for (const b of m.buildings) buildingShadow(g, b);
    for (const b of m.buildings) building(ctx, b);
    for (const d of [...(m.decor || [])].sort((a, b) => a.y - b.y)) {
        const flat = d.flat ?? FLAT.has(d.k);
        DECOR[d.k]?.({ m, S, s: g, g: flat ? g : ctx.o, u: flat ? u : ctx.ou }, d.x * T, d.y * T, d);
    }
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
        const L = m.legend(i, j);
        if (L.obj === 'palm') palm(ctx, i * T, j * T, i, j);
        if (L.obj === 'lotus') lotus(g, i * T, j * T);
    }
    withOutline(og, g); withOutline(ou, u);
    og.width = og.height = ou.width = ou.height = 1;
}

// lays an object layer onto a target with a one pixel outline traced around its solid pixels
function withOutline(src, dst) {
    const w = src.width, h = src.height;
    const a = src.getContext('2d').getImageData(0, 0, w, h).data;
    const out = new ImageData(w, h), o = out.data;
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 140;
    const r = parseInt(LINE.slice(1, 3), 16), gg = parseInt(LINE.slice(3, 5), 16), b = parseInt(LINE.slice(5, 7), 16);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (solid(x, y)) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) { const k = (y * w + x) * 4; o[k] = r; o[k + 1] = gg; o[k + 2] = b; o[k + 3] = 255; }
    }
    const lc = layer(w, h);
    lc.getContext('2d').putImageData(out, 0, 0);
    dst.drawImage(lc, 0, 0); dst.drawImage(src, 0, 0);
    lc.width = lc.height = 1;
}

// how far each water tile is from land, 1 at the shore up to 3, for the depth colours
function waterDepth(m) {
    const D = new Uint8Array(m.w * m.h);
    const wet = (i, j) => i < 0 || j < 0 || i >= m.w || j >= m.h || m.type(i, j) === 'water' || m.type(i, j) === 'dock';
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
        if (m.type(i, j) !== 'water') continue;
        let d = 3;
        for (let r = 1; r <= 2 && d === 3; r++) for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) if (!wet(i + a, j + b)) { d = Math.min(d, r); }
        D[j * m.w + i] = d;
    }
    return D;
}
const mix = (a, b, f) => {
    const p = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const A = p(a), B = p(b);
    return `#${A.map((v, q) => Math.round(v + (B[q] - v) * f).toString(16).padStart(2, '0')).join('')}`;
};
const waterTones = S => [mix(S.water[2], '#FFFFFF', 0.28), mix(S.water[1], S.water[2], 0.5), mix(S.water[0], S.water[1], 0.4), mix(S.water[0], '#0C2A33', 0.1)];

// the base colour a kind of land shows, for rounding a neighbour's corner
function baseOf(ctx, t, i, j) {
    switch (t) {
        case 'grass': return ctx.S.grass[1];
        case 'path': return PATH.base;
        case 'stone': return STONE.base;
        case 'bank': return BANK.base;
        case 'farm': return ctx.S.farm[0];
        case 'water': return waterTones(ctx.S)[1];
        default: return SAND.base;
    }
}

// ---------- tiles
function tile(ctx, i, j) {
    const { m, S, g, o } = ctx, t = m.type(i, j), x = i * T, y = j * T, alt = (i + j) % 2;
    const at = (a, b) => (a < 0 || b < 0 || a >= m.w || b >= m.h ? t : m.type(a, b));
    switch (t) {
        case 'grass': {
            box(g, x, y, T, T, S.grass[1]);
            // a tuft in two fixed places, mirrored on every other tile
            const tuft = (a, b) => { box(g, x + a, y + b, 1, 2, S.grass[0]); box(g, x + a + 2, y + b, 1, 2, S.grass[0]); box(g, x + a + 1, y + b - 1, 1, 3, S.grass[0]); box(g, x + a + 1, y + b - 1, 1, 1, S.grass[2]); };
            if (alt) { tuft(3, 4); tuft(10, 11); } else { tuft(10, 3); tuft(3, 11); }
            break;
        }
        case 'stone': {
            const sr = Math.floor(j / 2), off = sr % 2;
            box(g, x, y, T, T, STONE.base);
            if ((i + off) % 2 === 1) box(g, x + 15, y, 1, T, STONE.seam);
            if (j % 2 === 1) box(g, x, y + 15, T, 1, STONE.seam);
            if (j % 2 === 0) box(g, x, y, T, 1, STONE.light);
            break;
        }
        case 'path': {
            box(g, x, y, T, T, PATH.base);
            // paving: a seam across the middle, and down one side offset by row
            box(g, x, y + 7, T, 1, PATH.seam); box(g, x + (j % 2 ? 4 : 11), y, 1, 7, PATH.seam); box(g, x + (j % 2 ? 11 : 4), y + 8, 1, 8, PATH.seam);
            break;
        }
        case 'farm': {
            box(g, x, y, T, T, S.farm[0]);
            for (let r = 0; r < 4; r++) { box(g, x, y + r * 4 + 3, T, 1, S.farm[1]); box(g, x, y + r * 4, T, 1, 'rgba(255,230,190,.1)'); }
            for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) {
                const a = x + 3 + k * 8, b = y + 2 + r * 8;
                box(g, a, b + 1, 3, 3, S.crop); box(g, a + 1, b, 1, 1, S.crop); box(g, a + 1, b + 1, 1, 1, 'rgba(255,255,210,.4)'); box(g, a, b + 4, 3, 1, 'rgba(40,25,10,.25)');
            }
            break;
        }
        case 'water': {
            const tones = waterTones(S), d = ctx.depth[j * m.w + i];
            box(g, x, y, T, T, tones[d]);
            if (alt) box(g, x + 3, y + 5, 5, 1, d === 1 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.15)');
            else box(g, x + 9, y + 11, 4, 1, d === 1 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.15)');
            break;
        }
        case 'bank': {
            box(g, x, y, T, T, BANK.base);
            if (alt) box(g, x + 5, y + 5, 2, 1, BANK.dark); else box(g, x + 11, y + 9, 2, 1, BANK.dark);
            if (at(i, j + 1) === 'water') { box(g, x, y + 13, T, 3, BANK.lip); box(g, x, y + 13, T, 1, BANK.dark); }
            break;
        }
        case 'dock': {
            box(g, x, y, T, T, '#A07C52');
            for (let r = 0; r < 4; r++) { box(g, x, y + r * 4 + 3, T, 1, '#7A5A38'); box(g, x, y + r * 4, T, 1, '#B8925F'); }
            box(g, x + (j % 2 ? 5 : 10), y, 1, T, '#7A5A38');
            if (at(i - 1, j) !== 'dock') { box(o, x, y, 2, T, '#7A5A38'); }
            if (at(i + 1, j) !== 'dock') { box(o, x + 14, y, 2, T, '#7A5A38'); }
            break;
        }
        case 'rock': {
            // a raised block of rock: the lit top while rock goes on below, a dark face where it ends
            const face = at(i, j + 1) !== 'rock';
            if (!face) {
                box(g, x, y, T, T, ROCK.top);
                if (alt) { box(g, x + 3, y + 4, 3, 2, ROCK.topDark); box(g, x + 3, y + 4, 3, 1, ROCK.topLight); box(g, x + 10, y + 11, 2, 1, ROCK.topDark); }
                else { box(g, x + 10, y + 3, 3, 2, ROCK.topDark); box(g, x + 10, y + 3, 3, 1, ROCK.topLight); box(g, x + 4, y + 10, 2, 1, ROCK.topDark); }
                if ((i * 3 + j * 5) % 7 === 0) { box(o, x + 3, y + 5, 9, 6, '#D7B07C'); box(o, x + 4, y + 4, 7, 1, '#D7B07C'); box(o, x + 4, y + 5, 5, 1, '#EBCB98'); box(o, x + 3, y + 10, 9, 1, '#B5895A'); box(ctx.s, x + 4, y + 11, 9, 2, SHADOW); }
                if (at(i, j - 1) !== 'rock') { box(g, x, y, T, 2, ROCK.topLight); box(g, x, y, T, 1, LINE); }
            } else {
                box(g, x, y, T, T, ROCK.face);
                box(g, x, y, T, 3, ROCK.lip); box(g, x, y + 3, T, 1, ROCK.faceDark);
                for (let k = 2; k < T; k += 5) box(g, x + k + (i % 2), y + 5, 1, 9, ROCK.faceDark);
                box(g, x, y + 15, T, 1, LINE);
                if (at(i, j - 1) !== 'rock') box(g, x, y, T, 1, LINE);
            }
            if (at(i - 1, j) !== 'rock') { box(g, x, y, 1, T, LINE); box(g, x + 1, y, 1, T, face ? ROCK.face : ROCK.topLight); }
            if (at(i + 1, j) !== 'rock') { box(g, x + 15, y, 1, T, LINE); box(g, x + 13, y, 2, T, face ? ROCK.faceDark : ROCK.topDark); }
            break;
        }
        case 'wall': {
            // the same raised look in cut stone: a capped top, a face of blocks where the wall ends
            const face = at(i, j + 1) !== 'wall';
            if (!face) {
                box(g, x, y, T, T, WALL.top); box(g, x + 7, y, 1, T, WALL.topSeam);
                if (at(i, j - 1) !== 'wall') { box(g, x, y, T, 2, WALL.lip); box(g, x, y, T, 1, LINE); }
            } else {
                box(g, x, y, T, T, WALL.face);
                box(g, x, y, T, 3, WALL.lip); box(g, x, y + 3, T, 1, WALL.faceSeam);
                box(g, x, y + 9, T, 1, WALL.faceSeam); box(g, x + ((i + j) % 2 ? 4 : 11), y + 4, 1, 5, WALL.faceSeam); box(g, x + ((i + j) % 2 ? 11 : 4), y + 10, 1, 5, WALL.faceSeam);
                box(g, x, y + 15, T, 1, LINE);
                if (at(i, j - 1) !== 'wall') box(g, x, y, T, 1, LINE);
            }
            if (at(i - 1, j) !== 'wall') box(g, x, y, 1, T, LINE);
            if (at(i + 1, j) !== 'wall') { box(g, x + 15, y, 1, T, LINE); box(g, x + 14, y + 1, 1, T - 2, WALL.faceSeam); }
            break;
        }
        case 'stairs': {
            box(g, x, y, T, T, STONE.base);
            for (let r = 0; r < 4; r++) { box(g, x, y + r * 4, T, 1, STONE.light); box(g, x, y + r * 4 + 3, T, 1, STONE.edge); }
            if (at(i - 1, j) !== 'stairs') { box(g, x, y, 2, T, WALL.face); box(g, x, y, 1, T, LINE); }
            if (at(i + 1, j) !== 'stairs') { box(g, x + 14, y, 2, T, WALL.faceSeam); box(g, x + 15, y, 1, T, LINE); }
            break;
        }
        case 'fence': {
            sand(g, x, y, alt);
            const h = at(i - 1, j) === 'fence' || at(i + 1, j) === 'fence', v = at(i, j - 1) === 'fence' || at(i, j + 1) === 'fence';
            box(g, x + 5, y + 13, 7, 2, SHADOW);
            if (h || !v) { box(o, x, y + 6, T, 2, '#9A7450'); box(o, x, y + 6, T, 1, '#B88E62'); }
            if (v) { box(o, x + 7, y, 2, T, '#9A7450'); box(o, x + 7, y, 1, T, '#B88E62'); }
            box(o, x + 6, y + 3, 4, 11, '#8A6644'); box(o, x + 6, y + 3, 4, 1, '#B88E62'); box(o, x + 9, y + 4, 1, 10, '#6E4F30');
            break;
        }
        case 'hedge': {
            // a low clipped hedge; neighbours join into one row, the ends are round
            sand(g, x, y, alt);
            box(g, x + 1, y + 13, 15, 3, SHADOW);
            const L = at(i - 1, j) === 'hedge', R = at(i + 1, j) === 'hedge';
            box(o, x + (L ? 0 : 1), y + 4, T - (L ? 0 : 1) - (R ? 0 : 1), 10, '#5E8C46');
            box(o, x + (L ? 0 : 2), y + 3, T - (L ? 0 : 2) - (R ? 0 : 2), 1, '#5E8C46');
            box(o, x + (L ? 0 : 2), y + 4, T - (L ? 0 : 2) - (R ? 0 : 2), 2, '#7FA65E');
            box(o, x + 3, y + 7, 2, 1, '#8DB866'); box(o, x + 10, y + 9, 2, 1, '#8DB866'); box(o, x + (L ? 0 : 1), y + 11, T - (L ? 0 : 1) - (R ? 0 : 1), 3, '#4A7036');
            break;
        }
        case 'ditch': {
            sand(g, x, y, alt);
            box(g, x + 3, y, 10, T, '#C9AB7A'); box(g, x + 4, y, 8, T, '#B8996A'); box(g, x + 3, y, 1, T, '#9E8059'); box(g, x + 12, y, 1, T, '#E6CC9E');
            break;
        }
        case 'dryearth': {
            box(g, x, y, T, T, '#A98A63');
            box(g, x + 2, y + 5, 6, 1, 'rgba(60,40,20,.35)'); box(g, x + 8, y + 5, 1, 5, 'rgba(60,40,20,.35)'); box(g, x + 9, y + 10, 5, 1, 'rgba(60,40,20,.3)');
            break;
        }
        case 'rubble': {
            sand(g, x, y, alt);
            box(g, x + 2, y + 13, 13, 2, SHADOW);
            for (const [a, b, w, h, c] of [[1, 7, 7, 6, '#C9B08C'], [8, 4, 6, 6, '#D6BE9A'], [6, 9, 8, 5, '#BDA27E']]) { box(o, x + a, y + b, w, h, c); box(o, x + a, y + b, w, 1, '#E8D6B4'); }
            break;
        }
        case 'pillar': {
            box(g, x, y, T, T, STONE.base);
            box(g, x + 3, y + 13, 12, 3, SHADOW);
            box(o, x + 3, y + 2, 10, 13, '#E8DCC4'); box(o, x + 3, y + 2, 2, 13, '#F4EADA'); box(o, x + 11, y + 2, 2, 13, '#C9B591'); box(o, x + 2, y + 13, 12, 2, '#B9A27E');
            const u = ctx.ou;
            box(u, x + 1, y - 4, 14, 6, '#D7C7A6'); box(u, x + 1, y - 4, 14, 1, '#F2E8D4'); box(u, x + 3, y - 2, 2, 2, '#7FA650'); box(u, x + 11, y - 2, 2, 2, '#7FA650');
            break;
        }
        case 'gate': {
            sand(g, x, y, alt);
            box(o, x, y, T, T, '#8E6A44'); box(o, x + 7, y, 2, T, '#6E4F30'); box(o, x, y + 4, T, 1, '#6E4F30'); box(o, x, y + 11, T, 1, '#6E4F30');
            box(o, x + 5, y + 7, 1, 2, '#D9B65A'); box(o, x + 10, y + 7, 1, 2, '#D9B65A');
            break;
        }
        default: sand(g, x, y, alt);
    }
}
// sand: flat, with a little ripple in fixed places
function sand(g, x, y, alt) {
    box(g, x, y, T, T, SAND.base);
    if (alt) { box(g, x + 3, y + 5, 3, 1, SAND.dark); box(g, x + 4, y + 4, 1, 1, SAND.light); }
    else { box(g, x + 10, y + 11, 3, 1, SAND.dark); box(g, x + 11, y + 10, 1, 1, SAND.light); }
}

// ---------- where two kinds of land meet: a clear line, corners cut round
const RIM = { grass: 'rim', path: 'rim', farm: 'rim', stone: 'rim', water: 'shore' };
function edges(ctx, i, j) {
    const { m, S, g } = ctx, t = m.type(i, j), x = i * T, y = j * T;
    if (!RIM[t]) return;
    const raised = nt => nt === 'wall' || nt === 'rock' || nt === 'stairs' || nt === 'pillar' || nt === 'dock' || nt === 'hedge' || nt === 'fence';
    const other = (a, b) => { if (a < 0 || b < 0 || a >= m.w || b >= m.h) return false; const nt = m.type(a, b); return nt !== t && !raised(nt) && !(t === 'stone' && nt === 'stairs'); };
    const up = other(i, j - 1), down = other(i, j + 1), left = other(i - 1, j), right = other(i + 1, j);
    const line = t === 'grass' ? mix(S.grass[0], '#203818', 0.35) : t === 'path' ? PATH.edge : t === 'farm' ? '#4E3520' : t === 'stone' ? STONE.edge : null;
    const inner = t === 'grass' ? S.grass[2] : t === 'path' ? PATH.light : t === 'stone' ? STONE.light : null;
    if (t === 'water') {
        // the shore: a white line of foam and a shallow band
        const foam = 'rgba(245,252,250,.85)';
        if (up) { box(g, x, y, T, 1, foam); box(g, x, y + 1, T, 2, 'rgba(255,255,255,.18)'); }
        if (left) box(g, x, y, 1, T, foam);
        if (right) box(g, x + 15, y, 1, T, foam);
        if (down) box(g, x, y + 15, T, 1, foam);
        return;
    }
    if (up) { box(g, x, y, T, 1, line); if (inner) box(g, x, y + 1, T, 1, inner); }
    if (down) box(g, x, y + 15, T, 1, line);
    if (left) { box(g, x, y, 1, T, line); if (inner) box(g, x + 1, y + 1, 1, T - 1, inner); }
    if (right) box(g, x + 15, y, 1, T, line);
    // round the outer corners: the corner pixels take the neighbour's colour and the line steps in
    const corner = (cx, cy, nb) => {
        const col = baseOf(ctx, nb, 0, 0);
        box(g, x + cx * 14, y + cy * 14, 2, 2, col);
        box(g, x + (cx ? 14 : 1), y + (cy ? 14 : 1), 1, 1, line);
    };
    if (up && left) corner(0, 0, m.type(i - 1, j - 1));
    if (up && right) corner(1, 0, m.type(i + 1, j - 1));
    if (down && left) corner(0, 1, m.type(i - 1, j + 1));
    if (down && right) corner(1, 1, m.type(i + 1, j + 1));
}

// ---------- shadows cast down and to the right by raised blocks
function shadows(ctx, i, j) {
    const { m, g } = ctx, t = m.type(i, j), x = i * T, y = j * T;
    const tall = tt => tt === 'wall' || tt === 'rock';
    if (!tall(t)) return;
    const below = j + 1 < m.h ? m.type(i, j + 1) : 'rock', right = i + 1 < m.w ? m.type(i + 1, j) : 'rock';
    if (!tall(below) && below !== 'water') box(g, x + 2, y + 16, 14, 4, SHADOW);
    if (!tall(right) && right !== 'water') box(g, x + 16, y + 3, 4, 14, SHADOW);
}
function buildingShadow(g, b) {
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    box(g, x + 4, y + h, w, 5, SHADOW); box(g, x + w, y + 6, 5, h - 1, SHADOW);
}

// ---------- buildings, on the object layers so they get the outline
function building(ctx, b) {
    const g = ctx.o, u = ctx.ou;
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    if (b.kind === 'temple') return temple(g, u, x, y, w, h);
    if (b.kind === 'gate') return duatGate(g, x, y, w, h);
    const roof = b.roof || '#B98F5E';
    if (b.kind === 'stall') return stall(g, x, y, w, h, roof);
    // a mud-brick house: a flat roof with a raised rim, the front wall, windows set in, a framed door
    box(g, x, y, w, 9, shade(roof, 0.1)); box(g, x, y, w, 2, shade(roof, 0.32)); box(g, x + 2, y + 3, w - 4, 4, shade(roof, -0.05)); box(g, x, y + 8, w, 1, shade(roof, -0.3));
    box(g, x + 4, y + 3, 4, 3, '#B0703A'); box(g, x + 4, y + 3, 4, 1, '#D08A4A');
    if (w > 48) { box(g, x + w - 15, y + 3, 9, 3, '#C9A46A'); box(g, x + w - 15, y + 3, 9, 1, '#E0C08A'); }
    box(g, x, y + 9, w, h - 9, '#E2C495'); box(g, x, y + 9, w, 2, '#C8A877'); box(g, x, y + h - 3, w, 3, '#CDAE80');
    box(g, x, y + 11, 2, h - 14, '#EED7AE'); box(g, x + w - 2, y + 11, 2, h - 14, '#CDAE80');
    for (let k = 10; k < w - 14; k += 20) {
        if (Math.abs(k + 3 - w / 2) < 11) continue;
        box(g, x + k - 1, y + 14, 9, 8, '#C8A877'); box(g, x + k, y + 15, 7, 6, '#4A3424'); box(g, x + k + 3, y + 15, 1, 6, '#7A5A3A'); box(g, x + k - 1, y + 21, 9, 1, '#F2DDB6');
    }
    const dx = x + w / 2 - 7, dy = y + h - 15;
    box(g, dx, dy, 14, 15, '#F0DDB6'); box(g, dx + 2, dy + 2, 10, 13, '#3A2618'); box(g, dx + 2, dy + 2, 10, 2, '#24170E'); box(g, dx - 1, dy - 1, 16, 2, '#C9A97A');
}
function stall(g, x, y, w, h, roof) {
    // a counter with goods under a striped awning on two posts
    box(g, x + 2, y + 6, 2, h - 6, '#6E4F30'); box(g, x + w - 4, y + 6, 2, h - 6, '#6E4F30');
    box(g, x + 4, y + h - 10, w - 8, 9, '#A07A50'); box(g, x + 4, y + h - 10, w - 8, 1, '#C49A68');
    const goods = ['#D9733A', '#7FA650', '#8E5BA8', '#E0B040', '#C0392B', '#5FA7A3'];
    for (let k = 0; k < (w - 12) / 5; k++) { box(g, x + 7 + k * 5, y + h - 14, 4, 4, goods[k % goods.length]); box(g, x + 7 + k * 5, y + h - 14, 2, 1, 'rgba(255,255,255,.4)'); }
    for (let k = 0; k < w; k += 8) { box(g, x + k, y, 4, 8, roof); box(g, x + k + 4, y, 4, 8, '#F2E8DA'); }
    for (let k = 0; k < w; k += 4) box(g, x + k + 1, y + 8, 2, 2, k % 8 < 4 ? roof : '#F2E8DA');
    box(g, x, y, w, 1, 'rgba(255,255,255,.35)');
}
function temple(g, u, x, y, w, h) {
    // two sloping pylons with carved bands and flagpoles, the great door with a winged sun, columns between
    const lime = '#E8DABD', mid = '#DCCBA8', dark = '#B49C77', carve = 'rgba(164,138,100,.6)';
    box(g, x + 30, y + 10, w - 60, h - 10, '#D2BD98'); box(g, x + 30, y + 10, w - 60, 2, '#E8DABD');
    for (let k = 0; k < 4; k++) {
        const cx = x + 36 + k * 16 + (k > 1 ? 8 : 0);
        if (Math.abs(cx + 3 - (x + w / 2)) < 14) continue;
        box(g, cx, y + 20, 8, h - 20, '#EDE1C8'); box(g, cx, y + 20, 2, h - 20, '#F7EFE0'); box(g, cx + 6, y + 20, 2, h - 20, '#CDB894');
        box(g, cx - 2, y + 16, 12, 4, '#7FA650'); box(g, cx - 1, y + 15, 10, 1, '#9CC46A'); box(g, cx - 2, y + 19, 12, 1, '#D9B65A');
    }
    for (const [px, flip] of [[x, false], [x + w - 34, true]]) {
        for (let r = 0; r < h; r++) {
            const inset = Math.floor((h - r) / 8);
            box(g, flip ? px : px + inset, y + r, 34 - inset, 1, r < 5 ? lime : mid);
        }
        box(g, px + (flip ? 0 : 6), y, 28, 3, '#F3E9D4');
        for (let r = 14; r < h - 10; r += 14) { box(g, px + 8, y + r, 20, 1, carve); for (let k = 0; k < 3; k++) box(g, px + 11 + k * 7, y + r + 3, 3, 5, carve); }
        box(g, flip ? px + 32 : px + 6, y + 3, 2, h - 3, flip ? dark : lime);
        const fx = flip ? px + 6 : px + 26;
        box(u, fx, y - 22, 2, 30, '#7A5A38'); box(u, fx, y - 22, 1, 30, '#A07A50');
        box(u, flip ? fx + 2 : fx - 7, y - 20, 7, 4, flip ? '#C0392B' : '#2F6FB6'); box(u, flip ? fx + 2 : fx - 6, y - 16, 5, 2, flip ? '#A32F23' : '#25599A');
    }
    const dx = x + w / 2 - 10, dy = y + h - 30;
    box(g, dx - 3, dy - 6, 26, 36, '#E3D3B2'); box(g, dx, dy, 20, 30, '#2E1F14'); box(g, dx, dy, 20, 3, '#1E140C');
    box(g, dx - 4, dy - 8, 28, 3, '#F0E5CF');
    box(g, dx + 8, dy - 7, 4, 3, '#E0B040'); box(g, dx + 1, dy - 6, 7, 1, '#4F7FB0'); box(g, dx + 12, dy - 6, 7, 1, '#4F7FB0'); box(g, dx + 3, dy - 5, 5, 1, '#C0392B'); box(g, dx + 12, dy - 5, 5, 1, '#C0392B');
}
function duatGate(g, x, y, w, h) {
    box(g, x - 5, y - 8, w + 10, h + 8, '#8E7C68'); box(g, x - 5, y - 8, w + 10, 2, '#A9967F');
    box(g, x + 3, y + 3, w - 6, h - 3, '#140D09'); box(g, x + 3, y + 3, w - 6, 2, '#6B3FA0'); box(g, x + 3, y + 5, 1, h - 5, '#5B3590'); box(g, x + w - 4, y + 5, 1, h - 5, '#5B3590');
    box(g, x + w / 2 - 2, y - 6, 4, 4, '#D9B65A'); box(g, x + w / 2 - 1, y - 5, 2, 2, '#2B2018');
}
function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)));
    return `rgb(${c.join(',')})`;
}

// ---------- palms and lotus
function palm(ctx, x, y, i, j) {
    const g = ctx.o, u = ctx.ou;
    box(ctx.s, x + 3, y + 12, 13, 4, SHADOW);
    box(g, x + 7, y + 4, 3, 12, '#8A6644'); box(g, x + 7, y + 4, 1, 12, '#A88158');
    for (let r = 5; r < 16; r += 3) box(g, x + 7, y + r, 3, 1, '#6E4F30');
    // the crown: fronds fanning out from the top of the trunk, drooping at their tips
    const dk = '#3F6A30', md = '#55853E', lt = '#7DB058';
    const cx = x + 8, cy = y + 2;
    const fronds = [[180, 10, 0.09], [0, 10, 0.09], [212, 9, 0.06], [328, 9, 0.06], [252, 7, 0.03], [288, 7, 0.03], [150, 7, 0.12], [30, 7, 0.12]];
    for (const [deg, L, droop] of fronds) {
        const a = deg * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
        for (let k = 1; k <= L; k++) {
            const px = Math.round(cx + dx * k), py = Math.round(cy + dy * k + droop * k * k);
            box(u, px - 1, py - 1, k < L - 1 ? 3 : 2, 2, k > L - 3 ? dk : md);
            if (k % 3 === 1 && k < L - 2) box(u, px - 1, py - 1, 1, 1, lt);
        }
    }
    box(u, cx - 2, cy - 1, 4, 3, dk); box(u, cx - 1, cy - 1, 2, 1, md);
    box(u, cx - 2, cy + 2, 1, 2, '#A0522D'); box(u, cx + 1, cy + 2, 1, 2, '#A0522D'); box(u, cx - 1, cy + 3, 2, 1, '#B8662F');
}
function lotus(g, x, y) {
    box(g, x + 2, y + 7, 7, 4, '#5E8C46'); box(g, x + 2, y + 7, 7, 1, '#7FA65E'); box(g, x + 9, y + 3, 5, 3, '#5E8C46');
    box(g, x + 4, y + 4, 4, 3, '#7FA6E0'); box(g, x + 5, y + 3, 2, 1, '#B9CFF2'); box(g, x + 5, y + 6, 2, 1, '#E8C55A');
}

// ---------- decor: { k, x, y } in data/maps/*.json. Which ones block walking is in map.js (SOLID_DECOR).
const DECOR = {
    // a column with a papyrus capital, two tiles tall
    column(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 3, y + 13, 13, 3, SHADOW);
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
        box(c.s, x + 3, y + 13, 13, 3, SHADOW);
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
        box(c.s, x + 3, y + 13, 13, 3, SHADOW);
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
        box(c.s, x + 2, y + 13, 14, 3, SHADOW);
        box(g, x + 1, y + 7, 14, 8, '#2B2018'); box(g, x + 1, y + 7, 14, 1, '#D9B65A'); box(g, x + 1, y + 14, 14, 1, '#D9B65A'); box(g, x + 6, y + 9, 4, 3, '#D9B65A');
        const b = '#1A1410';
        box(u, x + 2, y + 2, 10, 5, b); box(u, x + 10, y - 2, 4, 5, b); box(u, x + 13, y, 2, 2, b);
        box(u, x + 10, y - 5, 1, 3, b); box(u, x + 12, y - 5, 1, 3, b); box(u, x + 12, y - 1, 1, 1, '#D9B65A');
        box(u, x + 1, y + 5, 2, 1, b); box(u, x + 10, y + 2, 3, 1, '#D9B65A');
    },
    // a bronze bowl of fire on three legs; the flame moves in render.js
    brazier(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 4, y + 13, 10, 3, SHADOW);
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
        box(c.s, x + 1, y + 13, 15, 3, SHADOW);
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
        box(c.s, x + 4, y + 13, 11, 3, SHADOW);
        box(g, x + 4, y + 8, 8, 7, '#B0703A'); box(g, x + 4, y + 8, 8, 1, '#D08A4A'); box(g, x + 5, y + 14, 6, 1, '#8A5428'); box(g, x + 5, y + 10, 6, 1, '#4F7FB0');
        box(u, x + 7, y + 1, 2, 7, '#4E7A3A'); box(u, x + 3, y - 2, 4, 2, '#5E8C46'); box(u, x + 9, y - 2, 4, 2, '#5E8C46'); box(u, x + 6, y - 4, 4, 2, '#6E9C4E');
        box(u, x + 2, y, 3, 1, '#4E7A3A'); box(u, x + 11, y, 3, 1, '#4E7A3A'); box(u, x + 7, y - 5, 2, 1, '#8DB866');
    },
    // clay jars leaning together
    jars(c, x, y) {
        const { g } = c;
        box(c.s, x + 2, y + 13, 14, 3, SHADOW);
        for (const [a, b, w, h] of [[2, 5, 5, 9], [7, 3, 6, 11], [11, 8, 4, 6]]) {
            box(g, x + a, y + b, w, h, '#B0703A'); box(g, x + a + 1, y + b - 1, w - 2, 1, '#8A5428'); box(g, x + a, y + b, 1, h, '#C98A4A'); box(g, x + a + w - 1, y + b + 1, 1, h - 1, '#8A5428');
        }
    },
    // baskets and a crate of market goods
    goods(c, x, y) {
        const { g } = c;
        box(c.s, x + 2, y + 13, 14, 3, SHADOW);
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
        box(c.s, x + 3, y + 12, 12, 3, SHADOW);
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
        box(c.s, x - 2, y + 9, 20, 3, 'rgba(0,30,40,.25)');
        box(g, x - 2, y + 6, 20, 4, '#C9A46A'); box(g, x - 3, y + 4, 3, 3, '#C9A46A'); box(g, x + 16, y + 4, 3, 3, '#C9A46A');
        for (let k = 0; k < 20; k += 3) box(g, x - 2 + k, y + 6, 1, 4, '#A8864E');
        box(g, x - 2, y + 6, 20, 1, '#E0C08A'); box(g, x + 7, y + 1, 1, 6, '#6E4F30');
    },
    rocks(c, x, y) {
        const { g } = c;
        box(c.s, x + 2, y + 12, 14, 4, SHADOW);
        for (const [a, b, w, h] of [[1, 7, 8, 7], [8, 9, 7, 5], [5, 4, 5, 4]]) { box(g, x + a, y + b, w, h, '#B39B78'); box(g, x + a, y + b, w, 1, '#D7C19E'); box(g, x + a + w - 1, y + b + 1, 1, h - 1, '#8E7658'); }
    },
    // a post wrapped in straw, for training
    dummy(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 5, y + 13, 9, 3, SHADOW);
        box(g, x + 7, y + 6, 2, 9, '#6E4F30');
        box(u, x + 4, y - 2, 8, 9, '#D9B65A'); box(u, x + 4, y - 2, 2, 9, '#EACB7A'); box(u, x + 4, y + 1, 8, 1, '#A8864E'); box(u, x + 4, y + 4, 8, 1, '#A8864E');
        box(u, x + 1, y + 1, 14, 2, '#8E6A44'); box(u, x + 6, y - 5, 4, 3, '#D9B65A');
    },
    // a round target of reeds on a stand
    target(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 4, y + 13, 10, 3, SHADOW);
        box(g, x + 4, y + 8, 1, 7, '#6E4F30'); box(g, x + 11, y + 8, 1, 7, '#6E4F30');
        box(u, x + 3, y - 1, 10, 10, '#E0C08A'); box(u, x + 2, y + 1, 12, 6, '#E0C08A'); box(u, x + 5, y + 1, 6, 6, '#C0392B'); box(u, x + 4, y + 2, 8, 4, '#C0392B'); box(u, x + 7, y + 3, 2, 2, '#F6F0E0');
    },
    well(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 1, y + 5, 14, 9, '#BFA985'); box(g, x + 1, y + 5, 14, 2, '#DCCBA8'); box(g, x + 3, y + 6, 10, 2, '#1E2A2A');
        for (let k = 0; k < 14; k += 4) box(g, x + 1 + k, y + 9, 1, 5, '#A48A64');
        box(u, x + 2, y - 4, 1, 10, '#6E4F30'); box(u, x + 13, y - 4, 1, 10, '#6E4F30'); box(u, x + 2, y - 4, 12, 1, '#6E4F30'); box(u, x + 7, y - 3, 1, 5, '#C9A46A'); box(u, x + 6, y + 1, 3, 2, '#8A5428');
    },
    // a domed bread oven
    oven(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 2, y + 6, 12, 9, '#B98A5E'); box(g, x + 3, y + 4, 10, 2, '#B98A5E'); box(g, x + 5, y + 3, 6, 1, '#C99A6E');
        box(g, x + 3, y + 5, 3, 3, '#D3A57A'); box(g, x + 6, y + 9, 4, 5, '#2B1A10'); box(g, x + 7, y + 11, 2, 2, '#E07A30');
        box(u, x + 7, y - 3, 2, 3, 'rgba(240,235,225,.35)'); box(u, x + 6, y - 6, 2, 3, 'rgba(240,235,225,.22)');
    },
    // a shaduf: a pole on a post with a bucket, for lifting water
    shaduf(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 4, y + 13, 10, 3, SHADOW);
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
        box(c.s, x + 1, y + 12, 15, 3, SHADOW);
        box(g, x + 1, y + 7, 14, 4, '#D2C2A0'); box(g, x + 1, y + 7, 14, 1, '#ECE0C8'); box(g, x + 2, y + 11, 3, 3, '#B49C77'); box(g, x + 11, y + 11, 3, 3, '#B49C77');
    },
    // a tall pole with a pennant
    banner(c, x, y, d) {
        const { g, u } = c;
        box(c.s, x + 7, y + 13, 6, 2, SHADOW);
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
        box(c.s, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 2, y + 12, 12, 3, '#B49C77');
        box(u, x + 4, y - 4, 8, 16, '#D9C9A6'); box(u, x + 5, y - 5, 6, 1, '#D9C9A6'); box(u, x + 4, y - 4, 1, 16, '#EDE1C6'); box(u, x + 11, y - 3, 1, 15, '#B49C77');
        box(u, x + 6, y - 3, 4, 2, '#E0B040');
        for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) box(u, x + 5 + k * 2, y + r * 3, 1, 2, rnd(x + k, r, 2) > 0.5 ? '#8E7458' : '#A48A64');
    },
    // a small shrine with a figure inside
    shrine(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 2, y + 13, 14, 3, SHADOW);
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
    // a flower bed in neat rows, like a garden tile
    bed(c, x, y, d) {
        const { g } = c;
        const cols = [['#E8A0B8', '#F6D0DC'], ['#F2D25A', '#FBEFA8'], ['#F6F0E0', '#FFFFFF']][(d.x + d.y) % 3];
        box(g, x + 1, y + 1, 14, 14, 'rgba(70,110,40,.35)');
        for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
            const a = x + 2 + k * 5, b = y + 2 + r * 5;
            box(g, a, b + 2, 3, 1, '#4E7A3A'); box(g, a, b, 3, 2, cols[0]); box(g, a + 1, b, 1, 1, cols[1]);
        }
    },
    // ruins: a column fallen on its side, in pieces
    fallen(c, x, y) {
        const { g } = c;
        box(c.s, x + 1, y + 12, 16, 3, SHADOW);
        box(g, x, y + 6, 9, 7, '#E3D6BC'); box(g, x, y + 6, 9, 1, '#F2E8D4'); box(g, x + 8, y + 6, 1, 7, '#C9B591');
        box(g, x + 10, y + 7, 6, 6, '#DCCDB0'); box(g, x + 10, y + 7, 6, 1, '#F2E8D4'); box(g, x + 15, y + 7, 1, 6, '#BFA985');
        for (let k = 2; k < 9; k += 3) box(g, x + k, y + 7, 1, 6, 'rgba(0,0,0,.08)');
    },
    // ruins: a statue broken at the waist
    broken(c, x, y) {
        const { g, u } = c;
        box(c.s, x + 3, y + 13, 13, 3, SHADOW);
        box(g, x + 2, y + 9, 12, 6, '#C9B591'); box(g, x + 2, y + 9, 12, 1, '#E3D3B3');
        box(u, x + 4, y + 1, 8, 8, '#BFA985'); box(u, x + 4, y + 1, 2, 8, '#D7C7A6'); box(u, x + 5, y, 3, 1, '#BFA985'); box(u, x + 9, y + 1, 2, 1, '#A48A64');
        box(g, x + 12, y + 12, 3, 2, '#BFA985');
    },
    // ruins: a block with carving on it
    block(c, x, y) {
        const { g } = c;
        box(c.s, x + 2, y + 12, 15, 3, SHADOW);
        box(g, x + 1, y + 4, 14, 10, '#D2C2A0'); box(g, x + 1, y + 4, 14, 1, '#ECE0C8'); box(g, x + 14, y + 5, 1, 9, '#B49C77');
        for (let k = 0; k < 3; k++) { box(g, x + 3 + k * 4, y + 7, 2, 3, '#A48A64'); box(g, x + 4 + k * 4, y + 11, 1, 1, '#A48A64'); }
    },
};
export const DECOR_KINDS = Object.keys(DECOR);
