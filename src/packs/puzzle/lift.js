// 15 열주홀 빛 퍼즐 A안 "올림 기둥" (사용자 2026-10-19: 맵 안에서 조작, 시제품). Pure: no drawing, no state.
// The hall seen from above in the approved picture's pixels (x across, y the floor's depth where feet stand). Light
// goes straight at one of two heights:
//   low  — the brass mouth's and the pedestal's bronze head's height
//   high — the ring's height, up on the back terrace
// Simple rules that match what the picture shows (no heights in numbers are needed to play):
//   the terrace's front step stops low light and lets high light over; the pedestal turns low light and high light
//   passes over it; the brass mouth's stone stops low light; walls, the ring's stone frame and the columns stop both;
//   the ring takes high light coming at it from the hall.
//   The stone pillar (new, temporary shape) has one open face with a low window and a high window side by side:
//   light into one window comes back out of the other, the way it came, at the other height. The windows are side by
//   side (not one over the other) so the light going in and the light coming back are two lines, not one.
// trace(state) → { segs: [{ ax, ay, bx, by, level }], climbs: [{ ax, ay, bx, by, up }], end: { kind, what, x, y, level } }

export const PEDESTAL_ANGLES = [135, 0, 45, 90];          // / — \ |  (degrees in the picture, y down)
export const PEDESTAL_NAMES = ['/', '—', '\\', '|'];
export const FACES = ['N', 'E', 'S', 'W'];
const DIR = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const SIDE = { N: [1, 0], E: [0, 1], S: [-1, 0], W: [0, -1] }; // along the open face: low window on −SIDE, high on +SIDE

export const LIFT = {
    id: 'desert.colonnade.lift', version: 1,
    source: { x: 1458, y: 560, dx: -1, dy: 0 },             // the brass mouth (picture 1505, 500), open to the west
    pedestal: { x: 1250, y: 560, half: 34 },                 // the bronze head on the pedestal (picture 1250, 495)
    ring: { x: 1250, y: 420, r: 28 },                        // the ring on the back wall (picture 1250, 270)
    pillar: { half: 30, off: 24 },                           // footprint half side; the windows' centres this far apart
    // where the pillar can stand: one groove, a1 – a2 – a3 – a4 (a2 the corner)
    spots: { a1: { x: 1000, y: 574 }, a2: { x: 1000, y: 725 }, a3: { x: 1262, y: 725 }, a4: { x: 1490, y: 725 } },
    groove: ['a1', 'a2', 'a3', 'a4'],
    start: { pedestal: 2, at: 'a1', face: 'E' },
    // [x0, y0, x1, y1, what, stops]: stops 'low' (the step, the mouth's stone) or 'both'
    walls: [
        [380, 455, 1600, 455, '단 앞 턱', 'low'],
        [300, 420, 1222, 420, '뒷벽', 'both'], [1278, 420, 1640, 420, '뒷벽', 'both'],
        [300, 300, 300, 800, '벽', 'both'], [1640, 300, 1640, 800, '벽', 'both'], [300, 780, 1640, 780, '앞쪽 돌무더기', 'both'],
        ...box(1150, 405, 1205, 440, '고리 돌틀', 'both'), ...box(1318, 405, 1360, 440, '고리 돌틀', 'both'),
        ...box(915, 405, 1005, 440, '부러진 기둥', 'both'), ...box(545, 400, 655, 440, '기둥', 'both'),
        ...box(1462, 540, 1548, 585, '광원 받침돌', 'low'),
    ],
};
function box(x0, y0, x1, y1, what, stops) { return [[x0, y0, x1, y0, what, stops], [x1, y0, x1, y1, what, stops], [x1, y1, x0, y1, what, stops], [x0, y1, x0, y0, what, stops]]; }

const EPS = 1e-6;
function hit(px, py, dx, dy, ax, ay, bx, by) {
    const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex;
    if (Math.abs(den) < EPS) return null;
    const t = ((ax - px) * ey - (ay - py) * ex) / den, u = ((ax - px) * dy - (ay - py) * dx) / den;
    return t > EPS && u >= -EPS && u <= 1 + EPS ? t : null;
}
// the pillar's four sides: [ax, ay, bx, by, face]
export function pillarSides(def, st) {
    const c = def.spots[st.at], h = def.pillar.half;
    return [[c.x - h, c.y - h, c.x + h, c.y - h, 'N'], [c.x + h, c.y - h, c.x + h, c.y + h, 'E'], [c.x - h, c.y + h, c.x + h, c.y + h, 'S'], [c.x - h, c.y - h, c.x - h, c.y + h, 'W']];
}

export function trace(state, def = LIFT) {
    const st = { ...def.start, ...state };
    let { x, y, dx, dy } = def.source, level = 'low';
    const segs = [], climbs = [], seen = new Set();
    const c = def.spots[st.at], side = SIDE[st.face];
    for (let n = 0; n < 16; n++) {
        let best = null;
        const take = (t, o) => { if (t != null && (!best || t < best.t)) best = { t, ...o }; };
        for (const w of def.walls) if (w[5] === 'both' || w[5] === level) take(hit(x, y, dx, dy, w[0], w[1], w[2], w[3]), { kind: 'wall', what: w[4] });
        const r = def.ring;
        if (level === 'high' && dy < 0) take(hit(x, y, dx, dy, r.x - r.r, r.y, r.x + r.r, r.y), { kind: 'ring', what: '고리' });
        if (level === 'low') {   // the bronze head turns low light; high light goes over the pedestal
            const p = def.pedestal, a = PEDESTAL_ANGLES[st.pedestal] * Math.PI / 180, ux = Math.cos(a) * p.half, uy = Math.sin(a) * p.half;
            take(hit(x, y, dx, dy, p.x - ux, p.y - uy, p.x + ux, p.y + uy), { kind: 'mirror', a });
        }
        for (const s of pillarSides(def, st)) take(hit(x, y, dx, dy, s[0], s[1], s[2], s[3]), { kind: 'pillar', face: s[4] });
        if (!best) { segs.push({ ax: x, ay: y, bx: x + dx * 2000, by: y + dy * 2000, level }); return { segs, climbs, end: { kind: 'open', what: '', x, y, level } }; }
        const nx = x + dx * best.t, ny = y + dy * best.t;
        segs.push({ ax: x, ay: y, bx: nx, by: ny, level });
        x = nx; y = ny;
        if (best.kind === 'wall') return { segs, climbs, end: { kind: 'wall', what: best.what, x, y, level } };
        if (best.kind === 'ring') return { segs, climbs, end: { kind: 'ring', what: '고리', x, y, level } };
        if (best.kind === 'mirror') {
            const nxn = -Math.sin(best.a), nyn = Math.cos(best.a), k = dx * nxn + dy * nyn;
            dx = Math.round((dx - 2 * k * nxn) * 1e9) / 1e9; dy = Math.round((dy - 2 * k * nyn) * 1e9) / 1e9;
        } else {   // the pillar: a window of the open face takes the light at its own height; anywhere else is stone
            const u = (x - c.x) * side[0] + (y - c.y) * side[1], want = u < 0 ? 'low' : 'high';
            if (best.face !== st.face || want !== level || Math.abs(u) < 2) return { segs, climbs, end: { kind: 'wall', what: '기둥 돌', x, y, level } };
            const u2 = level === 'low' ? u + def.pillar.off : u - def.pillar.off, mx = x + (u2 - u) * side[0], my = y + (u2 - u) * side[1];
            const up = level === 'low';
            climbs.push({ ax: x, ay: y, bx: mx, by: my, up });
            x = mx; y = my; dx = -dx; dy = -dy; level = up ? 'high' : 'low';
        }
        const key = `${Math.round(x)},${Math.round(y)},${dx},${dy},${level}`;
        if (seen.has(key)) return { segs, climbs, end: { kind: 'loop', what: '', x, y, level } };
        seen.add(key);
    }
    return { segs, climbs, end: { kind: 'bounces', what: '', x, y, level } };
}
export const lit = state => trace(state).end.kind === 'ring';
// what she reads where the light stopped (no numbers, user)
export function saying(res) {
    const e = res.end;
    if (e.kind === 'ring') return '고리에 빛이 들어왔다.';
    if (e.what === '단 앞 턱') return '낮은 빛이 단 앞 턱에 막혔다. 고리는 그보다 높은 곳에 있다.';
    if (e.what === '기둥 돌') return '빛이 올림 틀의 막힌 쪽에 부딪혔다.';
    if (e.level === 'high') return `높아진 빛이 ${e.what || '벽'}에 닿았다.`;
    return `빛이 ${e.what || '벽'}에 닿았다.`;
}
