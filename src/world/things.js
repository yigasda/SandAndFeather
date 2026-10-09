// Things on the map that come and go: an adventure's beetle, a sparkle to look at, a chest, the boat,
// a secret seen only at night or with a companion. Packs add a source: addThings(fn), fn(mapId, state) →
// [{ id, x, y, label, sprite, act(ui, map) }]. A thing without act is only drawn.

import { getState } from '../core/state.js';

const sources = new Set();
export const addThings = fn => { sources.add(fn); return () => sources.delete(fn); };

export function thingsOn(mapId) {
    const s = getState();
    if (!s) return [];
    const out = [];
    for (const fn of sources) {
        try { for (const t of fn(mapId, s) || []) if (t) out.push(t); } catch (e) { console.error('[SandAndFeather] things', e); }
    }
    return out;
}
