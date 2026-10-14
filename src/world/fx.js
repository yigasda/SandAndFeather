// 생활 효과 (0.9.70): the approved effect pictures (data/art/fx, 메인1) shown over the map for a moment: a bubble over
// someone's head, steam over the kitchen board, a splash where the line meets the water, a bucket on the pier.
//   showFx(name, { at: 'head' | 'tip' | 'feet' | { x, y }, who: 'lead' | 'mate', ms, size, dx, dy, rise, bob, fade, key })
// `at` 'head' and 'tip' follow the person while it shows. size: the picture's height in tiles. A `key` replaces the
// effect with the same key (the bucket filling up, the bobber). Pictures load the first time they are wanted.
// The fishing line (fishLine) is drawn from the rod's end (looks.<who>.motion.actTips) to the bobber.

const base = new URL('../../data/art/fx/', import.meta.url);
const pics = new Map();
export function fxPic(name) {
    if (!pics.has(name)) { const im = new Image(); im.src = new URL(`${name}.png`, base).href; pics.set(name, im); }
    const im = pics.get(name);
    return im.complete && im.naturalWidth ? im : null;
}

let list = [];
let line = null; // { who, to: { x, y } } the fishing line from the rod's end to the bobber (tiles)
export function showFx(name, o = {}) {
    fxPic(name);
    if (o.key) list = list.filter(f => f.key !== o.key);
    list.push({ name, at: 'head', who: 'lead', ms: 1400, size: 0.75, dx: 0, dy: 0, rise: 0, bob: 0, fade: true, ...o, t0: performance.now() });
}
export function dropFx(key) { list = list.filter(f => f.key !== key); }
export function clearFx() { list = []; line = null; }
export function fishLine(v) { line = v; }
export const fxBusy = () => list.length > 0 || !!line;
export const fxCount = () => list.length;

// draw: pos(who) → { x, y (feet, tiles), top (the picture's top as drawn, tiles), act: { name, frame }, look, dir } or null; tip(look, act, dir, frame) → [dx, dy] in
// character heights; H: a character's height in tiles; ts: tile size in pixels; cx, cy: the camera
export function drawFx(g, { pos, tip, H, ts, cx, cy }) {
    const now = performance.now();
    list = list.filter(f => !f.ms || now - f.t0 < f.ms);
    const where = (at, who) => {
        if (typeof at === 'object') return at;
        const p = pos(who);
        if (!p) return null;
        if (at === 'feet') return { x: p.x, y: p.y };
        if (at === 'tip') {
            const d = p.act && tip(p.look, p.act.name, p.dir, p.act.frame ?? 0);
            return d ? { x: p.x + d[0] * H, y: p.y + d[1] * H } : null;
        }
        return { x: p.x, y: (p.top ?? p.y - H) + 0.08 };   // head: just over the top of the picture as drawn (sitting is lower)
    };
    if (line) {
        const a = where('tip', line.who);
        if (a) {
            const b = line.to, bob = Math.sin(now / 260) * 0.04;
            g.strokeStyle = 'rgba(250,250,240,.85)'; g.lineWidth = Math.max(1, ts / 26);
            g.beginPath(); g.moveTo(a.x * ts - cx, a.y * ts - cy);
            g.quadraticCurveTo(((a.x + b.x) / 2) * ts - cx, (Math.max(a.y, b.y) + 0.35) * ts - cy, b.x * ts - cx, (b.y + bob) * ts - cy); g.stroke();
            const im = fxPic('bobber-0');
            if (im) { const s = 0.42 * ts; g.drawImage(im, Math.round(b.x * ts - cx - s / 2), Math.round((b.y + bob) * ts - cy - s * 0.7), Math.round(s), Math.round(s)); }
        }
    }
    for (const f of list) {
        const im = fxPic(f.name);
        const p = im && where(f.at, f.who);
        if (!p) continue;
        const t = f.ms ? (now - f.t0) / f.ms : 0;
        const h = f.size * ts, w = h * im.naturalWidth / im.naturalHeight;
        const y = (p.y + f.dy - f.rise * t + (f.bob ? Math.sin((now - f.t0) / 180) * f.bob : 0)) * ts - cy;
        g.save();
        g.globalAlpha = f.fade && f.ms ? Math.min(1, (1 - t) * 4) * Math.min(1, t * 8 + 0.2) : 1;
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
        g.drawImage(im, Math.round((p.x + f.dx) * ts - cx - w / 2), Math.round(y - h), Math.round(w), Math.round(h));
        g.restore();
    }
}
