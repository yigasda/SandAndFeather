// 15 열주홀 빛 퍼즐 A안 "올림 기둥" on the map itself (사용자 2026-10-19: 별도 퍼즐 화면 없이, 시제품). She walks up to a
// device and 말 걸기 shows a small panel of what it can do (돌리기, 면 돌리기, 밀기); the light on the map changes at once.
//   - 받침 반사판 (in the picture): its bronze head turns / — \ |. The head is painted into the approved background, so while
//     the head turns in code a temporary patch covers the painted one (marked as temporary).
//   - 돌기둥 (new, temporary shape): one open face with a low window and a high window side by side (lift.js). It slides
//     along a groove (temporary floor marks) between four places and stops feet like a wall (map.dynamic).
//   - The light: low light thin and amber, high light broad and pale gold, both flowing the way they go, so going out
//     low and coming back high read as two different lights on two lines. Where it stops, a spark.
// Nothing is decided as a door or reward (claimed stays empty). The state is the chat's (s.puzzles[LIFT.id]); the
// path is worked out again from it. The heights used for drawing (LOW_Z, HIGH_Z) are guesses from the picture, not
// measured values; the rules themselves do not use them (lift.js).

import { getState, saveState } from '../../core/state.js';
import { ctx } from '../../core/st.js';
import { today } from '../../core/ledger.js';
import { addThings } from '../../world/things.js';
import { feet, player } from '../../world/player.js';
import { gameUi, onBusy, onDraw, onFrame } from '../../ui/window.js';
import { FACES, LIFT, PEDESTAL_ANGLES, saying, trace } from './lift.js';

const MAP = 'desert_colonnade', PX = 52 / 1.55;          // tools/maps/desert.py: the detail maps' scale (picture px a tile)
const LOW_Z = 60, HIGH_Z = 150, PILLAR_Z = 175;          // drawing heights in picture px: estimates from the picture
const T = (x, y) => ({ x: x / PX, y: y / PX });
const ARROW = { N: '▲', E: '▶', S: '▼', W: '◀' };

// ---- the state
export function liftState(s = getState(), make = false) {
    if (!s) return null;
    const p = s.puzzles?.[LIFT.id];
    if (p?.v === LIFT.version) return p;
    if (!make) return { ...LIFT.start, view: true };
    s.puzzles ||= {};
    return s.puzzles[LIFT.id] = { v: LIFT.version, rev: 0, ...LIFT.start, hint: 0, solvedEver: p?.solvedEver || false, solvedDay: p?.solvedDay ?? null, claimed: p?.claimed || {} };
}
const pillarAt = p => LIFT.spots[p.at];
// the pillar's footprint in tiles (it stops feet)
function pillarBox(p) {
    const c = pillarAt(p), h = LIFT.pillar.half;
    return { x0: (c.x - h) / PX, y0: (c.y - h) / PX, x1: (c.x + h) / PX, y1: (c.y + h) / PX };
}
const footBox = (x, y) => ({ x0: x + 0.22, y0: y + 0.62, x1: x + 0.78, y1: y + 0.96 });
const meets = (a, b) => a.x1 > b.x0 && a.x0 < b.x1 && a.y1 > b.y0 && a.y0 < b.y1;
// the groove's neighbours of where it stands: [{ to, dir }]
function nextSpots(at) {
    const i = LIFT.groove.indexOf(at), out = [];
    for (const j of [i - 1, i + 1]) {
        const to = LIFT.groove[j]; if (!to) continue;
        const a = LIFT.spots[at], b = LIFT.spots[to], dx = b.x - a.x, dy = b.y - a.y;
        out.push({ to, dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N') });
    }
    return out;
}

// ---- the panel by the device
let panel = null, sel = null, anim = null;
const HINTS = [
    '빛이 어디에서 멈추는지 봐. 고리는 단 위 높은 곳에 있어.',
    '올림 틀은 낮은 고리로 들어온 빛을 옆의 높은 고리로 올려, 들어온 쪽으로 돌려보내.',
    '높아진 빛은 받침 위를 지나가. 고리 앞 줄로 높은 빛이 돌아오게 하려면, 빛을 먼저 어느 쪽으로 보내야 할까?',
    '받침으로 빛을 아래쪽으로 보내고, 올림 틀을 받침 바로 아래 홈 자리로 밀어 고리가 위쪽(받침 쪽)을 보게 해 봐.',
];
function closePanel() { panel?.remove(); panel = null; sel = null; }
function openPanel(which) {
    const s = getState();
    if (!s) return;
    sel = { which, s, chat: ctx().chatId };
    showPanel();
}
// a press on a panel opened in another chat or game does nothing and closes it
const mine = () => sel && getState() === sel.s && ctx().chatId === sel.chat;
async function act(fn) {
    if (!mine()) { closePanel(); return; }
    const p = liftState(sel.s, true), was = JSON.stringify([p.pedestal, p.at, p.face]);
    const msg = fn(p);
    if (JSON.stringify([p.pedestal, p.at, p.face]) !== was) {
        p.rev = (p.rev || 0) + 1;
        const res = trace(p);
        if (res.end.kind === 'ring' && !p.solvedEver) { p.solvedEver = true; p.solvedDay = today(sel.s); }
    }
    showPanel(msg);
    await saveState();
}
function showPanel(note = '') {
    const root = document.getElementById('sf_game');
    if (!root || !sel) return;
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'sf_dev';
        panel.addEventListener('pointerdown', e => e.stopPropagation());
        root.append(panel);
    }
    const p = liftState(sel.s), res = trace(p);
    const btns = [];
    if (sel.which === 'pedestal') btns.push(['돌리기', () => act(q => { q.pedestal = (q.pedestal + 1) % 4; })]);
    else {
        btns.push(['면 돌리기', () => act(q => { q.face = FACES[(FACES.indexOf(q.face) + 1) % 4]; })]);
        for (const n of nextSpots(p.at)) btns.push([`${ARROW[n.dir]} 밀기`, () => act(q => push(q, n.to))]);
    }
    btns.push(['힌트', () => act(q => { const h = HINTS[Math.min(q.hint || 0, HINTS.length - 1)]; q.hint = Math.min((q.hint || 0) + 1, HINTS.length); return h; })]);
    // the pillar may go back far from her: the panel then closes and the word is a toast
    btns.push(['처음으로', () => act(q => { Object.assign(q, LIFT.start); unstick(q); gameUi()?.toast('장치를 처음 자리로 돌렸다. 푼 기록은 그대로야.'); return '장치를 처음 자리로 돌렸다.'; })]);
    btns.push(['닫기', closePanel]);
    panel.innerHTML = `<b>${sel.which === 'pedestal' ? '청동 반사판' : '올림 틀 (임시 모양)'}</b><p class="sf_dev_say" aria-live="polite"></p><div class="sf_dev_btns"></div>`;
    panel.querySelector('.sf_dev_say').textContent = note || saying(res);
    const box = panel.querySelector('.sf_dev_btns');
    for (const [label, fn] of btns) {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        b.addEventListener('click', e => { e.stopPropagation(); fn(); });
        box.append(b);
    }
}
// the pillar one place along the groove, if no one stands where it would go
function push(p, to) {
    const next = { ...p, at: to }, b = pillarBox(next);
    if (meets(b, footBox(player.x, player.y))) return '기둥이 갈 자리에 서 있어. 비켜서 밀어야 해.';
    anim = { from: { ...pillarAt(p) }, to: { ...LIFT.spots[to] }, at: performance.now() };
    p.at = to;
    return '';
}
// after 처음으로: she is not left inside the pillar
function unstick(p) {
    const b = pillarBox(p);
    if (meets(b, footBox(player.x, player.y))) { player.x = (b.x0 + b.x1) / 2 - 0.5; player.y = b.y1 + 0.1 - 0.62; }
}

// ---- on the map
addThings((mapId, s) => {
    if (mapId !== MAP) return [];
    const p = liftState(s), c = pillarAt(p), ped = T(LIFT.pedestal.x, 600), pil = T(c.x, c.y);   // the pillar is used from any side
    return [
        { id: 'lift:pedestal', x: ped.x - 0.5, y: ped.y - 0.8, label: '청동 반사판', sprite: 'none', pose: 'interact', act: () => openPanel('pedestal') },
        { id: 'lift:pillar', x: pil.x - 0.5, y: pil.y - 0.8, label: '올림 틀', sprite: 'none', pose: 'interact', act: () => openPanel('pillar') },
    ];
});
onBusy(() => player.map === MAP || !!anim);
onFrame((dt, map) => {
    if (map.id !== MAP) { if (sel) closePanel(); return; }
    const s = getState(), p = liftState(s);
    map.dynamic = s ? [pillarBox(p)] : [];
    if (anim && performance.now() - anim.at > 400) anim = null;
    if (sel) {
        if (!mine()) { closePanel(); return; }
        const f = feet(), d = sel.which === 'pedestal' ? T(LIFT.pedestal.x, 600) : T(pillarAt(p).x, pillarAt(p).y);
        if (Math.hypot(f.x - d.x, f.y - d.y) > 2.8) closePanel();
    }
});

// screen point of a picture point (x, y on the floor) at height z
const at = (ex, ey, sx, sy, ts) => { const cx = ex * ts - sx, cy = ey * ts - sy; return (x, y, z = 0) => [x / PX * ts - cx, (y - z) / PX * ts - cy]; };
onDraw(scene => {
    if (scene.map.id !== MAP) return;
    const s = getState(); if (!s) return;
    const p = liftState(s), res = trace(p), t = performance.now() / 1000;
    const put = (x, y, draw) => { const ex = x / PX - 0.5, ey = y / PX - 0.8; scene.extra.push({ x: ex, y: ey, draw: (g, sx, sy, z, ts) => draw(g, at(ex, ey, sx, sy, ts), z, ts) }); };
    // the groove and its four places (temporary floor marks), under everything
    scene.extra.push({ x: 0, y: -50, draw: (g, sx, sy, z, ts) => {
        const S = at(0, -50, sx, sy, ts);
        g.save(); g.setLineDash([6 * z, 5 * z]); g.strokeStyle = 'rgba(200,60,190,.75)'; g.lineWidth = 2 * z;
        g.beginPath(); LIFT.groove.forEach((k, i) => { const q = LIFT.spots[k], [x, y] = S(q.x, q.y); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
        g.setLineDash([]);
        for (const k of LIFT.groove) { const q = LIFT.spots[k], [x, y] = S(q.x, q.y); g.beginPath(); g.ellipse(x, y, 14 * z, 6 * z, 0, 0, Math.PI * 2); g.stroke(); }
        g.restore();
    } });
    // the pedestal's head: the temporary patch over the painted head, then the head as it is turned
    put(LIFT.pedestal.x, LIFT.pedestal.y + 25, (g, S, z) => {
        const [x0, y0] = S(1196, 532, 0), [x1, y1] = S(1304, 532, 0);
        const [, top] = S(1250, 532, 58);
        g.save();
        g.fillStyle = 'rgba(214,186,140,.92)'; g.fillRect(x0, top, x1 - x0, y0 - top);
        g.setLineDash([3 * z, 3 * z]); g.strokeStyle = 'rgba(200,60,190,.8)'; g.lineWidth = z; g.strokeRect(x0, top, x1 - x0, y0 - top); g.setLineDash([]);
        const a = PEDESTAL_ANGLES[p.pedestal] * Math.PI / 180, h = 30, ux = Math.cos(a) * h, uy = Math.sin(a) * h, c = LIFT.pedestal;
        const quad = [S(c.x - ux, c.y - uy, LOW_Z - 22), S(c.x + ux, c.y + uy, LOW_Z - 22), S(c.x + ux, c.y + uy, LOW_Z + 22), S(c.x - ux, c.y - uy, LOW_Z + 22)];
        g.fillStyle = 'rgba(176,122,52,.95)'; g.strokeStyle = '#4a2c10'; g.lineWidth = 1.5 * z;
        g.beginPath(); quad.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke();
        const [px, py] = S(c.x, c.y, 0), [, pt] = S(c.x, c.y, LOW_Z - 22);
        g.fillStyle = '#6b4a24'; g.fillRect(px - 1.5 * z, pt, 3 * z, py - pt - 8 * z);
        g.restore();
    });
    // the stone pillar (temporary shape): its body, the open face's two windows (low amber, high with the ring's gold)
    const c0 = pillarAt(p), k = anim ? Math.min(1, (performance.now() - anim.at) / 400) : 1;
    const c = anim ? { x: anim.from.x + (anim.to.x - anim.from.x) * k, y: anim.from.y + (anim.to.y - anim.from.y) * k } : c0;
    put(c.x, c.y + LIFT.pillar.half, (g, S, z) => {
        // an open stone frame (temporary shape): four thin posts, a lintel, and on its open face the low window (amber
        // rim) beside the high window (gold rim, like the ring's) — open, so the light going in and out stays seen
        const h = LIFT.pillar.half, H = PILLAR_Z;
        const post = (x, y, w) => { const [a, b] = S(x, y, 0), [, t2] = S(x, y, H); g.fillRect(a - w / 2, t2, w, b - t2); };
        g.save(); g.fillStyle = 'rgba(160,128,88,.9)'; g.strokeStyle = 'rgba(200,60,190,.9)'; g.lineWidth = 1.2 * z;
        for (const [x, y] of [[c.x - h, c.y - h], [c.x + h, c.y - h]]) post(x, y, 4 * z);          // back posts
        const top = [S(c.x - h, c.y - h, H), S(c.x + h, c.y - h, H), S(c.x + h, c.y + h, H), S(c.x - h, c.y + h, H)];
        g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
        g.fillStyle = 'rgba(214,184,138,.95)'; g.fill(); g.stroke();
        const base = [S(c.x - h, c.y - h, 0), S(c.x + h, c.y - h, 0), S(c.x + h, c.y + h, 0), S(c.x - h, c.y + h, 0)];
        g.beginPath(); base.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
        g.fillStyle = 'rgba(150,118,80,.55)'; g.fill(); g.stroke();
        // which way it opens: an arrow on its lintel
        const dir = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[p.face];
        const [ax, ay] = S(c.x, c.y, H), [bx, by] = S(c.x + dir[0] * h * 0.85, c.y + dir[1] * h * 0.85, H);
        g.strokeStyle = '#7a4a10'; g.lineWidth = 3 * z; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
        g.fillStyle = '#7a4a10'; g.beginPath(); g.arc(bx, by, 3.5 * z, 0, Math.PI * 2); g.fill();
        // the two windows on the open face, side by side
        const side = { N: [1, 0], E: [0, 1], S: [-1, 0], W: [0, -1] }[p.face];
        const fx = c.x + dir[0] * h, fy = c.y + dir[1] * h, o = LIFT.pillar.off / 2;
        const [lx, ly] = S(fx - side[0] * o, fy - side[1] * o, LOW_Z), [hx, hy] = S(fx + side[0] * o, fy + side[1] * o, HIGH_Z);
        g.lineWidth = 2.5 * z;
        g.strokeStyle = '#ffae40'; g.beginPath(); g.ellipse(lx, ly, 6 * z, 7 * z, 0, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = '#e8c050'; g.beginPath(); g.ellipse(hx, hy, 7 * z, 8 * z, 0, 0, Math.PI * 2); g.stroke();
        // the light climbing inside, from the low window to the high one
        if (!anim) for (const cl of res.climbs) {
            const [a1, a2] = S(cl.ax, cl.ay, cl.up ? LOW_Z : HIGH_Z), [b1, b2] = S(cl.bx, cl.by, cl.up ? HIGH_Z : LOW_Z);
            const gr = g.createLinearGradient(a1, a2, b1, b2); gr.addColorStop(0, cl.up ? 'rgba(255,170,60,1)' : 'rgba(255,248,210,1)'); gr.addColorStop(1, cl.up ? 'rgba(255,248,210,1)' : 'rgba(255,170,60,1)');
            g.strokeStyle = gr; g.lineWidth = 5 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(a1, a2); g.lineTo(b1, b2); g.stroke();
        }
        g.fillStyle = 'rgba(160,128,88,.9)';
        for (const [x, y] of [[c.x - h, c.y + h], [c.x + h, c.y + h]]) post(x, y, 5 * z);         // front posts
        g.restore();
    });
    if (anim) return;   // the light again once the pillar stands still
    // the light, cut into pieces along the floor's depth so it is drawn in front of or behind what it passes
    let along = 0;
    for (const sg of res.segs) {
        const len = Math.hypot(sg.bx - sg.ax, sg.by - sg.ay), n = Math.max(1, Math.ceil(Math.abs(sg.by - sg.ay) / 18)), z0 = sg.level === 'high' ? HIGH_Z : LOW_Z;
        for (let i = 0; i < n; i++) {
            const f0 = i / n, f1 = (i + 1) / n, x0 = sg.ax + (sg.bx - sg.ax) * f0, y0 = sg.ay + (sg.by - sg.ay) * f0, x1 = sg.ax + (sg.bx - sg.ax) * f1, y1 = sg.ay + (sg.by - sg.ay) * f1;
            const start = along + len * f0, high = sg.level === 'high';
            put((x0 + x1) / 2, Math.max(y0, y1) + 1, (g, S, z) => {
                const [a, b] = S(x0, y0, z0), [c2, d] = S(x1, y1, z0);
                g.save(); g.lineCap = 'round';
                g.strokeStyle = high ? 'rgba(255,244,190,.35)' : 'rgba(255,140,30,.28)'; g.lineWidth = (high ? 12 : 7) * z;
                g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke();
                g.strokeStyle = high ? '#fff6d0' : '#ffa030'; g.lineWidth = (high ? 4 : 2) * z;
                g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke();
                // the flow: bright dashes running the way the light goes
                const k2 = (z / PX) * 16;   // picture px → screen px
                g.setLineDash([10 * z, 26 * z]); g.lineDashOffset = -((t * 90 - start) * k2) % (36 * z);
                g.strokeStyle = high ? '#ffffff' : '#ffe0a0'; g.lineWidth = (high ? 2.5 : 1.5) * z;
                g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke();
                g.restore();
            });
        }
        along += len;
    }
    // where it stops: a spark; at the ring, the ring lit
    const e = res.end, ez = e.level === 'high' ? HIGH_Z : LOW_Z;
    put(e.x, e.y + 2, (g, S, z) => {
        const [x, y] = S(e.x, e.y, ez), lit = e.kind === 'ring', r = (lit ? 26 : 9) * z * (0.85 + 0.15 * Math.sin(t * 6));
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, lit ? 'rgba(255,250,210,.95)' : 'rgba(255,230,170,.9)'); gr.addColorStop(1, 'rgba(255,200,90,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    });
});

// tests only
export const liftTest = { state: () => { const p = liftState(); return { ...p, end: trace(p).end, segs: trace(p).segs.length }; }, panel: () => sel?.which || null, close: closePanel };
