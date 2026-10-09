// Somang on the map: where she stands, which way she faces, how she walks and what stops her.
// Positions are in tiles (fractions allowed); her feet are a small box near the bottom of her tile.

import { getState } from '../core/state.js';

const SPEED = 4.2; // tiles a second
const FOOT = { x0: 0.22, x1: 0.78, y0: 0.62, y1: 0.96 };

export const player = { map: 'ombos', x: 25, y: 16, dir: 'down', moving: false, step: 0 };
// where she has been lately, so a companion can walk a little behind her
const trail = [];
const TRAIL_GAP = 0.9; // tiles behind her
export function follower() {
    let need = TRAIL_GAP, prev = { x: player.x, y: player.y };
    for (let k = trail.length - 1; k >= 0; k--) {
        const p = trail[k], d = Math.hypot(p.x - prev.x, p.y - prev.y);
        if (d >= need) { const t = need / d; return { x: prev.x + (p.x - prev.x) * t, y: prev.y + (p.y - prev.y) * t, dir: p.dir, moving: player.moving, step: player.step }; }
        need -= d; prev = p;
    }
    return { x: prev.x - (trail.length ? 0 : 0.6), y: prev.y + (trail.length ? 0 : 0.3), dir: player.dir, moving: false, step: 0 };
}

export function placePlayer(map) {
    const s = getState();
    const p = s?.pos;
    if (p && p.map === map.id && Number.isFinite(p.x) && Number.isFinite(p.y) && !blocked(map, p.x, p.y)) Object.assign(player, { map: map.id, x: p.x, y: p.y, dir: p.dir || 'down' });
    else Object.assign(player, { map: map.id, x: map.d.spawn.x, y: map.d.spawn.y, dir: 'down' });
    trail.length = 0;
}
const blocked = (map, x, y) => map.solidAt(x + FOOT.x0, y + FOOT.y0) || map.solidAt(x + FOOT.x1, y + FOOT.y0) || map.solidAt(x + FOOT.x0, y + FOOT.y1) || map.solidAt(x + FOOT.x1, y + FOOT.y1);

// one frame of movement; dx, dy in -1…1. Slides along walls instead of sticking.
export function stepPlayer(map, dx, dy, dt) {
    const len = Math.hypot(dx, dy);
    player.moving = len > 0.15;
    if (!player.moving) return;
    const k = Math.min(1, len) * SPEED * dt / len;
    const nx = player.x + dx * k, ny = player.y + dy * k;
    if (!blocked(map, nx, player.y)) player.x = nx;
    if (!blocked(map, player.x, ny)) player.y = ny;
    player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    player.step += dt * 8;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(last.x - player.x, last.y - player.y) > 0.12) { trail.push({ x: player.x, y: player.y, dir: player.dir }); if (trail.length > 40) trail.shift(); }
}
// the middle of her feet, for "what is near"
export const feet = () => ({ x: player.x + 0.5, y: player.y + 0.8 });

export function rememberPosition() {
    const s = getState();
    if (!s) return false;
    const r = v => Math.round(v * 100) / 100;
    const before = JSON.stringify(s.pos);
    s.pos = { map: player.map, x: r(player.x), y: r(player.y), dir: player.dir };
    return JSON.stringify(s.pos) !== before;
}
