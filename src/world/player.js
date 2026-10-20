// Somang on the map: where she stands, which way she faces, how she walks and what stops her.
// Positions are in tiles (fractions allowed); her feet are a small box near the bottom of her tile.

import { getState } from '../core/state.js';
import { containsExit } from './map.js';

const SPEED = 4.2; // tiles a second
export const FOOT = { x0: 0.22, x1: 0.78, y0: 0.62, y1: 0.96 };

// moving: her position changed this frame (pushing into a wall is standing); walkT: seconds walked since she
// started, for the walking poses (it keeps going through turns and starts again at 0 when she stops)
export const player = { map: 'ombos', x: 25, y: 16, dir: 'down', moving: false, step: 0, walkT: 0 };
// where she has been lately, so a companion can walk a little behind her
const trail = [];
const TRAIL_GAP = 0.9; // tiles behind her
let gap = TRAIL_GAP;   // the people drawn larger on a map (map.d.actorScale) keep that much further apart; set as she walks
// a pack can walk the companion on its own for a while (두아트 전투: a place of their own to fight from); follower()
// then returns mateWalk.pos ({ x, y, dir, moving, step, walkT }) instead of the place behind her
export const mateWalk = { pos: null };
export function follower() { return mateWalk.pos || behind(); }
export function behind() {
    let need = gap, prev = { x: player.x, y: player.y };
    for (let k = trail.length - 1; k >= 0; k--) {
        const p = trail[k], d = Math.hypot(p.x - prev.x, p.y - prev.y);
        if (d >= need) { const t = need / d; return { x: prev.x + (p.x - prev.x) * t, y: prev.y + (p.y - prev.y) * t, dir: p.dir, moving: player.moving, step: player.step, walkT: player.walkT }; }
        need -= d; prev = p;
    }
    return { x: prev.x - (trail.length ? 0 : 0.6), y: prev.y + (trail.length ? 0 : 0.3), dir: player.dir, moving: false, step: 0, walkT: 0 };
}

export function placePlayer(map) {
    const s = getState();
    const p = s?.pos;
    if (p && p.map === map.id && Number.isFinite(p.x) && Number.isFinite(p.y) && !blocked(map, p.x, p.y)) Object.assign(player, { map: map.id, x: p.x, y: p.y, dir: p.dir || 'down' });
    else Object.assign(player, { map: map.id, x: map.d.spawn.x, y: map.d.spawn.y, dir: 'down' });
    player.seat = null; player.act = null; player.mate = null;
    stand();
    trail.length = 0; mateWalk.pos = null;
    seedTrail(map);
}
const blocked = (m, x, y) => m.solidRect(x+FOOT.x0,y+FOOT.y0,x+FOOT.x1,y+FOOT.y1);

// Seed a real, collision-safe route so the first movement sample cannot collapse the companion onto her.
// Keep the familiar lower-left preference, then try other directions without moving the player's landing.
function seedTrail(map) {
    gap = TRAIL_GAP * (map.d?.actorScale || 1);
    const safe = (x, y) => !blocked(map, x, y)
        && !(map.exits || []).some(e => containsExit(e, x + 0.5, y + 0.8));
    const base = Math.atan2(1, -2);
    for (const distance of [gap, gap * 0.85, gap * 0.7]) {
        for (let j = 0; j < 16; j++) {
            const turn = j % 2 ? (j + 1) / 2 : -j / 2, a = base + turn * Math.PI / 8;
            const dx = Math.cos(a) * distance, dy = Math.sin(a) * distance;
            const steps = Math.ceil(distance / 0.08), route = [];
            for (let k = 0; k <= steps; k++) {
                const t = 1 - k / steps, x = player.x + dx * t, y = player.y + dy * t;
                if (!safe(x, y)) break;
                route.push({ x, y, dir: player.dir });
            }
            if (route.length === steps + 1) { trail.push(...route); return; }
        }
    }
    // No safe separate route in a cramped placement: never invent an offset through a wall or exit.
    trail.push({ x: player.x, y: player.y, dir: player.dir });
}

// standing still: the idle picture, and the next walk starts on its first pose
export function stand() { player.moving = false; player.walkT = 0; }
// an action picture (looks.somang.motion.acts): turns her to face (tx, ty) and plays it once; walking ends it
export function playAct(name, tx, ty) {
    const f = feet(), dx = tx - f.x, dy = ty - f.y;
    if (Math.hypot(dx, dy) > 0.05) player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    player.act = { name, at: performance.now() };
}
// a short pose shown one way (the 생활 pictures: 기쁨, 놀람, 쑥스러움, 읽기, 요리): she turns to dir, shows it for ms (0: until
// she moves), then turns back the way she was facing. frame: show that frame of it and stay there (낚시 0 / 1)
export function showPose(name, dir, { ms = 1500, frame = null, bob = 0 } = {}) {
    if (player.posePrev == null) player.posePrev = player.dir;
    const now = performance.now();
    Object.assign(player, { dir, moving: false, walkT: 0, act: { name, at: now, frame, bob, until: ms ? now + ms : 0 } });
}
// the pose's frame now; hop: a quick jump up (the line pulled)
export function poseFrame(i, hop = false) { if (player.act) { player.act.frame = i; if (hop) player.act.hop = performance.now(); } }
// a short pose over: her own idle again, facing the way she was
export function endPose() {
    if (player.posePrev != null) { player.dir = player.posePrev; player.posePrev = null; }
    if (player.act?.until !== undefined) player.act = null;
}
// the one walking with her shows a pose too (they turn to dir for ms): { name, dir, at, until, frame }
export function matePose(name, dir, ms = 1500) { const now = performance.now(); player.mateAct = { name, dir, at: now, until: now + ms, frame: null }; }
// a pose that stays (sitting, lying down): she is put where the pose's anchor goes (sx, sy: the seat, or the
// middle of the bed), facing dir; the first step (or getUp) stands her up where she was
export function holdPose(name, sx, sy, dir) {
    if (!player.seat) player.seat = { x: player.x, y: player.y, dir: player.dir };
    Object.assign(player, { x: sx - 0.5, y: sy - 1, dir, moving: false, walkT: 0, act: { name, at: performance.now() } });
}
// the companion sitting or lying down beside her: { x, y, dir, name, at }, the same anchor rules as holdPose
export function holdMate(name, sx, sy, dir) { player.mate = { x: sx - 0.5, y: sy - 1, dir, name, at: performance.now() }; }
export function getUp() {
    player.mate = null; player.mateAct = null;
    if (player.posePrev != null) { player.posePrev = null; }
    if (!player.seat) return false;
    Object.assign(player, { x: player.seat.x, y: player.seat.y, dir: player.seat.dir, act: null, seat: null });
    return true;
}
// one frame of movement; dx, dy in -1…1. Slides along walls instead of sticking.
export function stepPlayer(map, dx, dy, dt) {
    const len = Math.hypot(dx, dy);
    if (len <= 0.15) { stand(); return; }
    getUp();
    // a map may set its own pace (the wide desert maps: map.d.walkSpeed, tools/maps/desert.py); the walking pictures keep step
    const pace = map.d?.walkSpeed || 1;
    gap = TRAIL_GAP * (map.d?.actorScale || 1);
    const k = Math.min(1, len) * SPEED * pace * dt / len;
    const nx = player.x + dx * k, ny = player.y + dy * k, x0 = player.x, y0 = player.y;
    if (!blocked(map, nx, player.y)) player.x = nx;
    if (!blocked(map, player.x, ny)) player.y = ny;
    player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    // sliding along a wall still walks; pressed flat against it she stands, facing the way pressed
    player.moving = Math.hypot(player.x - x0, player.y - y0) > 1e-4;
    if (!player.moving) { player.walkT = 0; return; }
    player.act = null; player.posePrev = null;
    player.walkT += dt * pace;
    player.step += dt * 8 * pace;
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
    const at = player.seat || player; // seated or lying, she is kept where she stood
    s.pos = { map: player.map, x: r(at.x), y: r(at.y), dir: at.dir };
    return JSON.stringify(s.pos) !== before;
}
