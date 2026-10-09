// A map from data/maps/*.json: rows of tile letters (legend says what each is and whether it blocks),
// buildings (blocking rectangles), spots (fixed places), people standing about, decor, and overlays: groups of tiles
// that change once something is done (a canal filled, a garden opened). Which overlays are open is in the chat's
// game (state.flags['overlay:<map>:<id>']), so the same map can look different in two chats.

import { DATA } from '../core/data.js';

// decor (data/maps/*.json "decor": [{ k, x, y }]) that stands in the way; flowers, mats, reeds and the like do not.
// An entry can say "solid": true or false to change it.
export const SOLID_DECOR = new Set(['column', 'statue_set', 'statue_falcon', 'jackal', 'brazier', 'pool', 'altar', 'plant', 'jars', 'goods', 'rocks', 'dummy', 'target', 'well', 'oven', 'shaduf', 'bench', 'banner', 'fallen', 'broken', 'block', 'stele', 'shrine']);
import { getState } from '../core/state.js';

export class GameMap {
    constructor(data, open = []) {
        this.d = data;
        this.id = data.id;
        this.open = open;
        // the rows with the open overlays applied
        const rows = data.rows.map(r => r.split(''));
        for (const id of open) for (const c of data.overlays?.[id] || []) if (rows[c.y]?.[c.x] !== undefined) rows[c.y][c.x] = c.c;
        this.rows = rows.map(r => r.join(''));
        this.w = this.rows[0].length;
        this.h = this.rows.length;
        this.tile = data.tile || 16;
        this.buildings = data.buildings || [];
        this.spots = data.spots || [];
        this.npcs = (data.npcs || []).map(n => ({ ...n }));
        this.anchors = data.anchors || [];
        this.decor = data.decor || [];
        this.block = new Uint8Array(this.w * this.h);
        for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.legend(x, y).solid) this.block[y * this.w + x] = 1;
        for (const b of this.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) this.mark(x, y);
        for (const d of this.decor) if (d.solid ?? SOLID_DECOR.has(d.k)) this.mark(d.x, d.y);
        this.base = this.block.slice(); // without people, who can step aside
        for (const n of this.npcs) this.mark(n.x, n.y);
    }
    mark(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.block[y * this.w + x] = 1; }
    char(x, y) { return this.rows[y]?.[x] ?? 'r'; }
    legend(x, y) { return this.d.legend[this.char(x, y)] || { t: 'sand' }; }
    type(x, y) { return this.legend(x, y).t; }
    solidAt(x, y) { const ix = Math.floor(x), iy = Math.floor(y); return ix < 0 || iy < 0 || ix >= this.w || iy >= this.h || this.block[iy * this.w + ix] === 1; }
    // a person who left their place (walking with Somang) no longer blocks it
    setAway(ids) {
        this.block.set(this.base);
        for (const n of this.npcs) if (!ids.includes(n.id)) this.mark(n.x, n.y);
    }
    anchor(id) { return this.anchors.find(a => a.id === id) || null; }
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
    const open = openOverlays(id);
    const key = `${id}|${open.join(',')}`;
    if (!loaded.has(key)) loaded.set(key, new GameMap(d, open));
    return loaded.get(key);
}
