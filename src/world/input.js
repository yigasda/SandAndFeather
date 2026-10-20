// Movement from the keyboard (arrows / WASD, E or Space to talk) and from the on-screen pad (touch or mouse).
// Only while the game window is open, and never while typing in a text box.

export const input = { dx: 0, dy: 0, talk: false };
const keys = new Set();
let pad = { x: 0, y: 0 };
const update = () => {
    let x = pad.x, y = pad.y;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
    input.dx = Math.max(-1, Math.min(1, x));
    input.dy = Math.max(-1, Math.min(1, y));
};
const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
const MOVE = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS']);

let active = false, onTalk = null;
function down(e) {
    // Popup buttons/radio groups own their keys; arrows must not become movement.
    if (!active || typing(e) || e.target?.closest?.('.sf_pop_wrap')) return;
    if (MOVE.has(e.code)) { keys.add(e.code); update(); e.preventDefault(); e.stopPropagation(); }
    else if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); onTalk?.(); }
}
function up(e) { if (keys.delete(e.code)) update(); }

// leaving the window (another app, another tab) lets go of every key: the keyup would never come
const release = () => { keys.clear(); update(); };
const hidden = () => { if (document.hidden) release(); };

export function startInput(talk) {
    onTalk = talk;
    if (active) return;
    active = true;
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', hidden);
}
export function stopInput() {
    active = false;
    keys.clear(); pad = { x: 0, y: 0 }; update();
    window.removeEventListener('keydown', down, true);
    window.removeEventListener('keyup', up, true);
    window.removeEventListener('blur', release);
    document.removeEventListener('visibilitychange', hidden);
}

// a button pressed by a thumb while the other one holds the pad (사용자 10-19: 이동하면서 공격·스킬): the browser makes no
// click for a second finger, so such a touch counts when it lifts on the button; the first finger and the mouse still
// go by click (never both)
export function bindPress(el, fn) {
    let id = null;
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !e.isPrimary) id = e.pointerId; });
    el.addEventListener('pointerup', e => {
        if (e.pointerId !== id) return;
        id = null;
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && !el.disabled) fn(e);
    });
    el.addEventListener('pointercancel', e => { if (e.pointerId === id) id = null; });
    el.addEventListener('click', fn);
}

// the round pad: drag from its middle; the knob follows up to its rim
export function bindPad(el, knob) {
    let id = null;
    const move = e => {
        const r = el.getBoundingClientRect(), R = r.width / 2;
        let x = e.clientX - (r.left + R), y = e.clientY - (r.top + R);
        const d = Math.hypot(x, y), lim = R * 0.62;
        if (d > lim) { x *= lim / d; y *= lim / d; }
        knob.style.transform = `translate(${x}px, ${y}px)`;
        pad = { x: x / lim, y: y / lim };
        update();
    };
    const end = () => { id = null; knob.style.transform = ''; pad = { x: 0, y: 0 }; update(); };
    el.addEventListener('pointerdown', e => { id = e.pointerId; el.setPointerCapture(id); move(e); e.preventDefault(); });
    el.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
}

// Only two touches that both started on the map can zoom. A pad/button finger
// never joins a pinch, even if it slides over the canvas. No browser page zoom.
export function bindMapZoom(canvas, root, enabled, getZoom, setZoom) {
    const touches = new Map();
    let start = null;
    const reset = () => { touches.clear(); start = null; };
    const pair = () => {
        const pts = [...touches.values()];
        return pts.length === 2 && pts.every(p => p.map) && enabled() ? pts : null;
    };
    const distance = pts => Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    root.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'touch') return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY, map: e.target === canvas });
        const pts = pair();
        start = pts ? { distance: Math.max(1, distance(pts)), zoom: getZoom() } : null;
        if (e.target === canvas) canvas.setPointerCapture(e.pointerId);
    }, true);
    root.addEventListener('pointermove', e => {
        const p = touches.get(e.pointerId);
        if (!p) return;
        p.x = e.clientX; p.y = e.clientY;
        const pts = pair();
        if (!pts) { start = null; return; }
        if (start) {
            e.preventDefault();
            setZoom(start.zoom * distance(pts) / start.distance);
        }
    }, { capture: true, passive: false });
    const end = e => { touches.delete(e.pointerId); start = null; };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) root.addEventListener(ev, end, true);
    window.addEventListener('blur', reset);
    window.addEventListener('resize', reset);
    document.addEventListener('visibilitychange', reset);
}
