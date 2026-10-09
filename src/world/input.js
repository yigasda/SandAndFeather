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
    if (!active || typing(e)) return;
    if (MOVE.has(e.code)) { keys.add(e.code); update(); e.preventDefault(); e.stopPropagation(); }
    else if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); onTalk?.(); }
}
function up(e) { if (keys.delete(e.code)) update(); }

export function startInput(talk) {
    onTalk = talk;
    if (active) return;
    active = true;
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
}
export function stopInput() {
    active = false;
    keys.clear(); pad = { x: 0, y: 0 }; update();
    window.removeEventListener('keydown', down, true);
    window.removeEventListener('keyup', up, true);
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
