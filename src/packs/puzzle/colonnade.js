// 15 매몰 신전의 열주홀 (desert_colonnade): 반사광 입문 (B2). The devices are where the approved picture has them —
// the brass light on the right floor, the reflector on its pedestal in the middle, the ring receiver on the back wall
// of the upper terrace. At the pedestal she opens the puzzle screen (screen.js); there the hall is laid out flat
// from above: x as in the picture (art x / 1774 × 100), the terrace and its back wall at the top. Light source 1,
// mirror 1, receiver 1, no time limit. The mirror turns 45° a touch: / → — → \ → | → /. Only \ sends the light that
// comes in from the right up to the receiver. Solving it lights the receiver on the map; no door or reward is
// attached (none is decided yet), claimed{} stays empty until one is.

import { getState } from '../../core/state.js';
import { addThings } from '../../world/things.js';
import { openPuzzle, savedOrient } from './screen.js';
import { COLONNADE_ANSWERS, COLONNADE_OPTICS } from './defs.js';
import { mirrorEnds, trace } from './optics.js';

const MAP = 'desert_colonnade', PX = 52 / 1.55;   // tools/maps/desert.py: the detail maps' scale
const art = (x, y) => ({ x: x / PX, y: y / PX });  // art px → tiles

export const COLONNADE = {
    id: 'desert.colonnade.mirror', version: 1, title: '열주홀의 반사판', size: [100, 60],
    start: { m1: 0 },
    optics: COLONNADE_OPTICS,
    solvedBy: res => !!res.lit.r1,
    status: (p, res) => res.lit.r1 ? '수신부에 빛이 닿았다.' : p.solvedEver ? '빛이 수신부에서 벗어났다. (이미 한 번 풀었다)' : '반사판을 눌러 돌려 봐.',
    tap(x, y, p) {
        const m = this.optics.mirrors[0];
        if (Math.hypot(x - m.x, y - m.y) > 9) return false;
        p.orient.m1 = ((p.orient.m1 ?? 0) + 1) % m.angles.length;
        return true;
    },
    buttons: (p, turn, mine) => [{ label: '반사판 돌리기', onClick: () => { if (mine()) { p.orient.m1 = ((p.orient.m1 ?? 0) + 1) % 4; turn(true); } return false; } }],
    answers: COLONNADE_ANSWERS,
    draw(g, W, H, p, res) {
        // floor, the terrace (far side) and its back wall
        g.fillStyle = '#d9b47a'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#c99d62'; g.fillRect(0, 0, W, 18);
        g.fillStyle = '#a77c48'; g.fillRect(0, 0, W, 3);
        g.strokeStyle = '#8a6438'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(2, 18); g.lineTo(98, 18); g.stroke();
        g.strokeStyle = 'rgba(120,85,45,.25)'; g.lineWidth = 0.25;
        for (let x = 6; x < W; x += 8) { g.beginPath(); g.moveTo(x, 18); g.lineTo(x, H); g.stroke(); }
        for (let y = 24; y < H; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
        // the two column bases on the terrace
        g.fillStyle = '#b58a55'; for (const x of [31.5, 51.5]) g.fillRect(x, 6, 5, 7);
        // receiver: the ring on the back wall, lit or not (shape changes too, not only colour)
        const r = this.optics.receivers[0], lit = !!res.lit.r1;
        g.lineWidth = 1.1; g.strokeStyle = lit ? '#fff3b0' : '#7a5a2a'; g.beginPath(); g.arc(r.x, r.y, r.r, 0, Math.PI * 2); g.stroke();
        g.fillStyle = lit ? '#ffe680' : '#3b2a16'; g.beginPath(); g.arc(r.x, r.y, r.r * 0.55, 0, Math.PI * 2); g.fill();
        if (lit) { g.strokeStyle = '#ffe680'; g.lineWidth = 0.5; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(r.x + Math.cos(a) * (r.r + 0.8), r.y + Math.sin(a) * (r.r + 0.8)); g.lineTo(r.x + Math.cos(a) * (r.r + 2.4), r.y + Math.sin(a) * (r.r + 2.4)); g.stroke(); } }
        // light source: the brass mouth on the right, open to the left
        const s = this.optics.source;
        g.fillStyle = '#9a6a2a'; g.fillRect(s.x, s.y - 2.6, 7, 5.2);
        g.fillStyle = '#e0b040'; g.beginPath(); g.arc(s.x, s.y, 2.6, Math.PI / 2, Math.PI * 1.5); g.fill();
        // the light
        g.strokeStyle = 'rgba(255,240,170,.95)'; g.lineWidth = 1.2; g.lineCap = 'round';
        g.beginPath(); res.path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        const [ex, ey] = res.path[res.path.length - 1];
        g.fillStyle = 'rgba(255,250,210,.9)'; g.beginPath(); g.arc(ex, ey, 1, 0, Math.PI * 2); g.fill();
        // the mirror on its round pedestal: the bronze face as a bar, a knob on its back
        const m = this.optics.mirrors[0], a = m.angles[p.orient.m1 ?? 0], [ax, ay, bx, by] = mirrorEnds(m, a);
        g.fillStyle = '#5f7f7a'; g.beginPath(); g.arc(m.x, m.y, 6, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#3c2a12'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
        g.strokeStyle = '#d8a84a'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    },
};

// the pedestal on the map: stand in front of it to open the screen; the receiver glows on the map while lit
addThings((mapId, s) => {
    if (mapId !== MAP) return [];
    const lit = !!trace(COLONNADE.optics, savedOrient(s, COLONNADE)).lit.r1;
    const at = art(1248, 605), ring = art(1250, 270);
    return [
        { id: 'puzzle:colonnade', x: at.x - 0.5, y: at.y - 0.8, label: '반사판', sprite: 'none', pose: 'interact', act: ui => openPuzzle(ui, COLONNADE) },
        ...(lit ? [{ id: 'puzzle:colonnade:lit', x: ring.x - 0.5, y: ring.y - 0.5, sprite: 'glow' }] : []),
    ];
});

export const colonnadeSolved = (s = getState()) => !!s?.puzzles?.[COLONNADE.id]?.solvedEver;
