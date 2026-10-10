// A map from data/maps/*.json: rows of tile letters (legend says what each is and whether it blocks),
// buildings (blocking rectangles), spots (fixed places), people standing about, decor, and overlays: groups of tiles
// that change once something is done (a canal filled, a garden opened). Which overlays are open is in the chat's
// game (state.flags['overlay:<map>:<id>']), so the same map can look different in two chats.

import { DATA } from '../core/data.js';

// decor (data/maps/*.json "decor": [{ k, x, y }]) that stands in the way; flowers, mats, reeds and the like do not.
// An entry can say "solid": true or false to change it.
export const SOLID_DECOR = new Set(['seal', 'column', 'statue_set', 'statue_falcon', 'jackal', 'brazier', 'pool', 'altar', 'plant', 'jars', 'goods', 'rocks', 'dummy', 'target', 'well', 'oven', 'shaduf', 'bench', 'banner', 'fallen', 'broken', 'block', 'stele', 'shrine']);
import { getState } from '../core/state.js';
import { inPolygon } from './geometry.js';

// Which time of the story the game is in. The residence keeps one set of rooms for every era; a spot, door or
// person can say which eras it belongs to ("eras": ["now"]) so the first-meeting starts can leave out what was not
// there yet (Horus living in the west room, Somang's things). Today every saved game is in 'now'.
export const eraOf = (s = getState()) => s?.era || 'now';
const inEra = (o, era) => !o.eras || o.eras.includes(era);

export class GameMap {
    constructor(data, open = [], era = 'now') {
        this.d = data;
        this.id = data.id;
        this.open = open;
        this.era = era;
        // the rows with the open overlays applied
        const rows = data.rows.map(r => r.split(''));
        for (const id of open) for (const c of data.overlays?.[id] || []) if (rows[c.y]?.[c.x] !== undefined) rows[c.y][c.x] = c.c;
        this.rows = rows.map(r => r.join(''));
        this.w = this.rows[0].length;
        this.h = this.rows.length;
        this.tile = data.tile || 16;
        this.buildings = data.buildings || [];
        this.spots = (data.spots || []).filter(o => inEra(o, era));
        this.npcs = (data.npcs || []).filter(o => inEra(o, era)).map(n => ({ ...n }));
        // walking into an exit's box (her feet's middle) takes her to another map's entry
        this.exits = (data.exits || []).filter(o => inEra(o, era));
        this.labels = (data.labels || []).filter(o => inEra(o, era));
        this.anchors = data.anchors || [];
        this.decor = data.decor || [];
        this.authored = data.authoredCollision;
        this.shapes = (this.authored?.shapes || []).filter(s => !s.untilOverlay || !open.includes(s.untilOverlay));
        this.changedCells = new Map();
        for (const id of open) for (const c of data.overlays?.[id] || []) this.changedCells.set(`${c.x},${c.y}`, c.c);
        this.block = new Uint8Array(this.w * this.h);
        if (this.authored) {
            // Keep a coarse occupancy grid for navigation, but use the exact
            // illustrated footprints for the moving player's feet.
            for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
                if (this.authoredSolidAt(x+.5, y+.8)) this.mark(x, y);
        } else {
            for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.legend(x, y).solid) this.block[y * this.w + x] = 1;
            for (const b of this.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) this.mark(x, y);
            for (const d of this.decor) if (d.solid ?? SOLID_DECOR.has(d.k)) this.mark(d.x, d.y);
        }
        this.base = this.block.slice(); // without people, who can step aside
        this.setAway([]);
    }
    mark(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.block[y * this.w + x] = 1; }
    char(x, y) { return this.rows[y]?.[x] ?? 'r'; }
    legend(x, y) { return this.d.legend[this.char(x, y)] || { t: 'sand' }; }
    type(x, y) { return this.legend(x, y).t; }
    authoredSolidAt(x, y) {
        const c = this.changedCells.get(`${Math.floor(x)},${Math.floor(y)}`);
        if (c && this.d.legend[c]?.solid) return true;
        const px = x / this.w * this.authored.width, py = y / this.h * this.authored.height;
        return this.shapes.some(s => inPolygon(px, py, s.polygon));
    }
    solidAt(x, y) {
        const ix = Math.floor(x), iy = Math.floor(y);
        if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return true;
        return this.authored ? this.authoredSolidAt(x, y) || this.npcCells.has(`${ix},${iy}`) : this.block[iy*this.w+ix] === 1;
    }
    // a person who left their place (walking with Somang) no longer blocks it
    setAway(ids) {
        this.block.set(this.base);
        this.npcCells = new Set();
        for (const n of this.npcs) if (!ids.includes(n.id)) { this.mark(n.x, n.y); this.npcCells.add(`${n.x},${n.y}`); }
    }
    anchor(id) { return this.anchors.find(a => a.id === id) || null; }
    exitAt(fx, fy) { return this.exits.find(e => fx >= e.x0 && fx <= e.x1 && fy >= e.y0 && fy <= e.y1) || null; }
    // what is close enough to use from (x, y): the nearest spot (its middle), person or thing (feet to feet)
    nearest(x, y, things = [], away = [], reach = 1.6) {
        let best = null, dist = reach;
        const take = (d, o) => { if (d < dist) { dist = d; best = o; } };
        for (const s of this.spots) take(Math.hypot(s.x + 0.5 - x, s.y + 0.5 - y), { kind: 'spot', ...s });
        for (const n of this.npcs) if (!away.includes(n.id)) take(Math.hypot(n.x + 0.5 - x, n.y + 0.8 - y), { kind: 'npc', ...n });
        for (const t of things) if (t.act) take(Math.hypot(t.x + 0.5 - x, t.y + 0.8 - y) - 0.15, { kind: 'thing', ...t });
        return best;
    }
}

export const openOverlays = (id, s = getState()) => Object.keys(DATA.maps[id]?.overlays || {}).filter(o => !o.startsWith('_') && s?.flags[`overlay:${id}:${o}`]);

const loaded = new Map();
// the map as the chat's game has it now; a new object when an overlay opened, so the renderer repaints
export function getMap(id = 'ombos') {
    const d = DATA.maps[id];
    if (!d) return null;
    const open = openOverlays(id), era = eraOf();
    const key = `${id}|${open.join(',')}|${era}`;
    if (!loaded.has(key)) loaded.set(key, new GameMap(d, open, era));
    return loaded.get(key);
}
