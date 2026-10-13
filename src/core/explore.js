// 지역 탐사율 (data/records.json exploration): per region, how much of it she has seen. A region counts its maps'
// named places (spots and anchors, seen once she first comes within radius tiles), its rooms (seen on first entering),
// its secrets (the 도감) and its obelisks (woken). Secrets and obelisks found before 0.9.68 count as they are.
// Seeing is written once per point, on the first visit only (never every frame). Mutates only; the caller saves.

import { DATA } from './data.js';
import { today } from './ledger.js';
import { addXP } from './progress.js';

export const EXPLORATION = () => DATA.records?.exploration || {};
export const REGIONS = () => EXPLORATION().regions || [];
export const regionInfo = id => REGIONS().find(r => r.id === id) || null;

// every point of a region: { key, kind: place|room|secret|obelisk, map, ko, x, y }
export function pointsOf(r) {
    const out = [];
    for (const mapId of r.maps || []) {
        const m = DATA.maps[mapId];
        if (!m) continue;
        for (const id of r.points || []) { const sp = (m.spots || []).find(x => x.id === id); if (sp) out.push({ key: `${mapId}:${id}`, kind: 'place', map: mapId, ko: sp.title || sp.label || sp.name || id, x: sp.x, y: sp.y }); }
        if (r.anchors) for (const a of m.anchors || []) out.push({ key: `${mapId}:${a.id}`, kind: 'place', map: mapId, ko: a.ko || a.id, x: a.x, y: a.y });
        for (const sec of m.secrets || []) out.push({ key: `secret:${sec.id}`, kind: 'secret', map: mapId, ko: sec.ko, id: sec.id });
        for (const o of m.obelisks || []) out.push({ key: `obelisk:${o.id}`, kind: 'obelisk', map: mapId, ko: o.ko, id: o.id });
    }
    for (const mapId of r.rooms || []) if (DATA.maps[mapId]) out.push({ key: `room:${mapId}`, kind: 'room', map: mapId, ko: DATA.maps[mapId].name || mapId });
    return out;
}
export const isSeen = (s, p) => (p.kind === 'secret' ? Object.hasOwn(s.codex?.secrets || {}, p.id)
    : p.kind === 'obelisk' ? !!s.flags?.[`obelisk:${p.id}`] : Object.hasOwn(s.explore?.seen || {}, p.key));

export function regionStatus(s, id) {
    const r = typeof id === 'string' ? regionInfo(id) : id;
    if (!r) return { total: 0, done: 0, pct: 0, points: [] };
    const points = pointsOf(r).map(p => ({ ...p, seen: isSeen(s, p) }));
    const done = points.filter(p => p.seen).length, total = points.length;
    return { r, total, done, pct: total ? Math.floor((done / total) * 100) : 0, points };
}
export const regionPct = (s, id) => regionStatus(s, id).pct;
// a region she cannot reach yet (강 건너) shows nothing until she has stood on one of its maps
export const regionOpen = (s, r) => !r.locked || Object.hasOwn(s.explore?.seen || {}, `map:${r.locked}`);

// where she stands now (tiles, her feet) → the keys seen for the first time (empty most of the time)
const near = (p, x, y, rad) => Number.isFinite(p.x) && Number.isFinite(p.y) && (p.x + 0.5 - x) ** 2 + (p.y + 0.5 - y) ** 2 <= rad * rad;
export function noteWhere(s, mapId, x, y) {
    const fresh = [], seen = s.explore.seen, day = today(s), rad = EXPLORATION().radius || 2.5;
    if (!Object.hasOwn(seen, `map:${mapId}`)) { seen[`map:${mapId}`] = day; fresh.push(`map:${mapId}`); }
    for (const r of REGIONS()) {
        if (r.rooms?.includes(mapId) && !Object.hasOwn(seen, `room:${mapId}`)) { seen[`room:${mapId}`] = day; fresh.push(`room:${mapId}`); }
        if (!r.maps?.includes(mapId)) continue;
        for (const p of pointsOf(r)) if (p.kind === 'place' && p.map === mapId && !Object.hasOwn(seen, p.key) && near(p, x, y, rad)) { seen[p.key] = day; fresh.push(p.key); }
    }
    return fresh;
}

// 25 · 50 %: a small reward each, once a region → the reward, or null
export const stepsOf = () => Object.entries(EXPLORATION().steps || {}).map(([pct, rw]) => ({ pct: Number(pct), ...rw })).sort((a, b) => a.pct - b.pct);
export const stepClaimable = (s, id, pct) => regionPct(s, id) >= pct && !Object.hasOwn(s.explore.claimed, `${id}:${pct}`);
export function claimStep(s, id, pct) {
    const st = stepsOf().find(x => x.pct === pct);
    if (!st || !regionInfo(id) || !stepClaimable(s, id, pct)) return null;
    s.explore.claimed[`${id}:${pct}`] = today(s);
    if (st.deben) s.bag.deben += st.deben;
    if (st.xp) addXP(s, st.xp);
    return st;
}
