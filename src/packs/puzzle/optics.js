// A light ray through a flat puzzle (OPUS 사막 계획서 7절, flat plane only: the puzzle screen, not the map's height).
// Pure: no drawing, no state. trace(def, orient) → { path: [[x,y]…], lit: { receiverId: true }, stop } — the segments
// to draw and what the light reached; the screen draws the path, the game decides solved from lit, nothing else.
//   source  { x, y, dx, dy }                     the ray leaves here, (dx, dy) is turned to a unit vector
//   mirrors [{ id, x, y, half, angles: [deg…] }] a finite segment through (x, y), 2·half long, at angles[orient[id]]
//            (degrees, 0 = along +x, 90 = along +y, y down); both faces reflect (two-sided)
//   receivers [{ id, x, y, r }]                  a circle; light reaching it lights it and stops there
//   walls   [[x0, y0, x1, y1]…]                  segments that stop the light (the room's edges, pillars)
// The nearest hit wins (a receiver behind a wall stays dark). A ray edge-on to a mirror passes it. The path is cut
// at MAX_BOUNCES and MAX_LENGTH; a ray that comes back to a surface it has already left the same way stops as a loop.

const EPS = 1e-6, MAX_BOUNCES = 24, MAX_LENGTH = 10000;
const cross = (ax, ay, bx, by) => ax * by - ay * bx;

// a ray (p + t·d, t > EPS) against the segment a–b: t and u (0..1 along it), or null
function hitSegment(px, py, dx, dy, ax, ay, bx, by) {
    const ex = bx - ax, ey = by - ay, den = cross(dx, dy, ex, ey);
    if (Math.abs(den) < EPS) return null;                       // parallel or edge-on: no hit
    const t = cross(ax - px, ay - py, ex, ey) / den, u = cross(ax - px, ay - py, dx, dy) / den;
    return t > EPS && u >= -EPS && u <= 1 + EPS ? { t, u } : null;
}
function hitCircle(px, py, dx, dy, cx, cy, r) {
    const fx = px - cx, fy = py - cy, b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r, disc = b * b - c;
    if (disc < 0) return null;
    const s = Math.sqrt(disc), t = -b - s > EPS ? -b - s : -b + s;
    return t > EPS ? { t } : null;
}
export function mirrorEnds(m, a) {
    const r = a * Math.PI / 180, ux = Math.cos(r) * m.half, uy = Math.sin(r) * m.half;
    return [m.x - ux, m.y - uy, m.x + ux, m.y + uy];
}

export function trace(def, orient = {}) {
    let len = Math.hypot(def.source.dx, def.source.dy);
    let px = def.source.x, py = def.source.y, dx = def.source.dx / len, dy = def.source.dy / len, total = 0;
    const path = [[px, py]], lit = {}, seen = new Set();
    for (let bounce = 0; bounce <= MAX_BOUNCES; bounce++) {
        let best = null;
        for (const w of def.walls || []) {
            const h = hitSegment(px, py, dx, dy, ...w);
            if (h && (!best || h.t < best.t)) best = { t: h.t, kind: 'wall' };
        }
        for (const m of def.mirrors || []) {
            const a = m.angles[orient[m.id] ?? 0], [ax, ay, bx, by] = mirrorEnds(m, a);
            const h = hitSegment(px, py, dx, dy, ax, ay, bx, by);
            if (h && (!best || h.t < best.t)) best = { t: h.t, kind: 'mirror', m, a };
        }
        for (const r of def.receivers || []) {
            const h = hitCircle(px, py, dx, dy, r.x, r.y, r.r);
            if (h && (!best || h.t < best.t)) best = { t: h.t, kind: 'receiver', r };
        }
        if (!best) { path.push([px + dx * 1e3, py + dy * 1e3]); return { path, lit, stop: 'open' }; }  // a room without walls round it
        const t = Math.min(best.t, MAX_LENGTH - total);
        px += dx * t; py += dy * t; total += t; path.push([px, py]);
        if (total >= MAX_LENGTH) return { path, lit, stop: 'length' };
        if (best.kind === 'wall') return { path, lit, stop: 'wall' };
        if (best.kind === 'receiver') { lit[best.r.id] = true; return { path, lit, stop: 'receiver' }; }
        // a mirror: d' = d − 2(d·n)n with n the unit normal of the face
        const r = best.a * Math.PI / 180, nx = -Math.sin(r), ny = Math.cos(r), k = dx * nx + dy * ny;
        dx -= 2 * k * nx; dy -= 2 * k * ny;
        len = Math.hypot(dx, dy); dx /= len; dy /= len;
        const key = `${best.m.id}|${px.toFixed(3)},${py.toFixed(3)}|${dx.toFixed(3)},${dy.toFixed(3)}`;
        if (seen.has(key)) return { path, lit, stop: 'loop' };
        seen.add(key);
    }
    return { path, lit, stop: 'bounces' };
}
