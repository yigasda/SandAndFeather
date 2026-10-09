// A map from data/maps/*.json: rows of tile letters (legend says what each is and whether it blocks),
// buildings (blocking rectangles), spots (where "말 걸기" does something) and people standing about.

import { DATA } from '../core/data.js';

export class GameMap {
    constructor(data) {
        this.d = data;
        this.id = data.id;
        this.w = data.rows[0].length;
        this.h = data.rows.length;
        this.tile = data.tile || 16;
        this.buildings = data.buildings || [];
        this.spots = data.spots || [];
        this.npcs = (data.npcs || []).map(n => ({ ...n }));
        // blocking cells, worked out once: solid tiles, buildings, people
        this.block = new Uint8Array(this.w * this.h);
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.legend(x, y).solid) this.block[y * this.w + x] = 1;
        for (const b of this.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) this.mark(x, y);
        for (const n of this.npcs) this.mark(n.x, n.y);
    }
    mark(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.block[y * this.w + x] = 1; }
    char(x, y) { return this.d.rows[y]?.[x] ?? 'r'; }
    legend(x, y) { return this.d.legend[this.char(x, y)] || { t: 'sand' }; }
    type(x, y) { return this.legend(x, y).t; }
    solidAt(x, y) { const ix = Math.floor(x), iy = Math.floor(y); return ix < 0 || iy < 0 || ix >= this.w || iy >= this.h || this.block[iy * this.w + ix] === 1; }
    // what is close enough to talk to from (x, y): the nearest spot (its middle) or person (feet to feet) within reach
    nearest(x, y, reach = 1.6) {
        let best = null, dist = reach;
        for (const s of this.spots) { const d = Math.hypot(s.x + 0.5 - x, s.y + 0.5 - y); if (d < dist) { dist = d; best = { kind: 'spot', ...s }; } }
        for (const n of this.npcs) { const d = Math.hypot(n.x + 0.5 - x, n.y + 0.8 - y); if (d < dist) { dist = d; best = { kind: 'npc', ...n }; } }
        return best;
    }
}

const loaded = new Map();
export function getMap(id = 'ombos') {
    if (!loaded.has(id)) { const d = DATA.maps[id]; if (!d) return null; loaded.set(id, new GameMap(d)); }
    return loaded.get(id);
}
