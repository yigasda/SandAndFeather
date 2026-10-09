// Authored backgrounds use the approved atlas directly, including its ground and
// shadows. Collision remains in the map; actors are still live game sprites.
import { DATA } from '../core/data.js';

// Feather only the four ground seams specified by the map artist. Rock, statue,
// path and shadow interiors keep their original RGB values and full opacity.
const panels = new WeakMap();
function panel(scene, night) {
    let pair = panels.get(scene);
    if (!pair) { pair = {}; panels.set(scene, pair); }
    const key = night ? 'night' : 'day';
    if (pair[key]) return pair[key];
    const source = scene[key], cv = document.createElement('canvas');
    cv.width = source[2]; cv.height = source[3];
    const g = cv.getContext('2d'); g.drawImage(scene.image, ...source, 0, 0, cv.width, cv.height);
    const pixels = g.getImageData(0, 0, cv.width, cv.height);
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
        let opacity = 1;
        for (const {a, b, width} of scene.seams || []) {
            const vx = b[0]-a[0], vy = b[1]-a[1];
            const t = Math.max(0, Math.min(1, ((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)));
            opacity = Math.min(opacity, Math.hypot(x-a[0]-t*vx, y-a[1]-t*vy)/width);
        }
        pixels.data[(y*cv.width+x)*4+3] = Math.round(255*opacity);
    }
    g.putImageData(pixels,0,0); pair[key]=cv; return cv;
}

export function drawReferenceScenes(renderer, { part, tint, cx, cy, z, paintActors, actors }) {
    const g = renderer.g, W = renderer.cv.width, H = renderer.cv.height;
    for (const id of renderer.map.d.referenceScenes || []) {
        const scene = DATA.sceneArt?.[id];
        if (!scene) continue;
        const source = part === 'night' ? scene.night : scene.day;
        const picture = panel(scene, part === 'night');
        const [ox, oy] = scene.origin, k = scene.scale;
        const dx = ox * z - cx, dy = oy * z - cy;
        const dw = source[2] * k * z, dh = source[3] * k * z;
        if (dx > W || dy > H || dx + dw < 0 || dy + dh < 0) continue;
        const clip = polygon => {
            g.beginPath();
            polygon.forEach(([x, y], i) => {
                const px = dx + x * k * z, py = dy + y * k * z;
                if (i) g.lineTo(px, py); else g.moveTo(px, py);
            });
            g.closePath(); g.clip();
        };
        const background = () => {
            g.drawImage(picture, dx, dy, dw, dh);
            // Dawn/evening retain the normal world lighting; night is authored.
            if (tint && (part !== 'night' || scene.tintNight)) { g.fillStyle = tint; g.fillRect(dx, dy, dw, dh); }
        };
        const liveActors = (minimumFoot = -Infinity) => {
            const cv = renderer.referenceActors;
            if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
            const ag = cv.getContext('2d');
            ag.clearRect(0, 0, W, H); ag.imageSmoothingEnabled = false;
            paintActors(ag, minimumFoot);
            if (tint) {
                ag.globalCompositeOperation = 'source-atop';
                ag.fillStyle = tint; ag.fillRect(0, 0, W, H);
                ag.globalCompositeOperation = 'source-over';
            }
            g.drawImage(cv, 0, 0);
        };
        g.save();
        g.beginPath(); g.rect(-cx,-cy,renderer.map.w*16*z,renderer.map.h*16*z); g.clip();
        clip(scene.clip);
        background(); liveActors();
        // Restore authored foreground silhouettes over actors behind them. A
        // foreground actor is then redrawn only inside that silhouette's clip.
        for (const o of scene.occluders || []) {
            const foot = oy + o.foot * k;
            const xs = o.polygon.map(p => ox + p[0]*k), ys = o.polygon.map(p => oy + p[1]*k);
            const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
            if (!actors.some(a => (a.y + 1)*16 < foot && (a.x + 2)*16 > left &&
                (a.x - 1)*16 < right && (a.y + 1)*16 > top && (a.y - 2)*16 < bottom)) continue;
            g.save(); clip(o.polygon); background(); liveActors(foot); g.restore();
        }
        g.restore();
    }
}
