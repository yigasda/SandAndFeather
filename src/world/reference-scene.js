// Authored backgrounds use the approved atlas directly, including its ground and
// shadows. Collision remains in the map; actors are still live game sprites.
import { DATA } from '../core/data.js';

// Feather only the four ground seams specified by the map artist. Rock, statue,
// path and shadow interiors keep their original RGB values and full opacity.
// One prepared canvas per decoded picture: dropping a room's picture lets its canvas go too.
// A scene with an authored night (nightFile) shows that picture at night instead of darkening the day.
const panels = new WeakMap();
const pictureOf = (scene, night) => (night && scene.nightImage) || scene.image;
function panel(scene, night) {
    const image = pictureOf(scene, night);
    if (!image) return null;
    const key = night && scene.nightImage ? 'night' : 'day';
    if (panels.has(image)) return panels.get(image);
    const source = scene[key], cv = document.createElement('canvas');
    cv.width = source[2]; cv.height = source[3];
    const g = cv.getContext('2d'); g.drawImage(image, ...source, 0, 0, cv.width, cv.height);
    if (scene.seams?.length) {
        const pixels = g.getImageData(0, 0, cv.width, cv.height);
        for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
            let opacity = 1;
            for (const {a, b, width} of scene.seams) {
                const vx = b[0]-a[0], vy = b[1]-a[1];
                const t = Math.max(0, Math.min(1, ((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)));
                opacity = Math.min(opacity, Math.hypot(x-a[0]-t*vx, y-a[1]-t*vy)/width);
            }
            pixels.data[(y*cv.width+x)*4+3] = Math.round(255*opacity);
        }
        g.putImageData(pixels,0,0);
    }
    panels.set(image, cv); return cv;
}

export function drawReferenceScenes(renderer, { part, tint, cx, cy, z, paintActors, actors }) {
    const g = renderer.g, W = renderer.cv.width, H = renderer.cv.height;
    for (const id of renderer.map.d.referenceScenes || []) {
        const scene = DATA.sceneArt?.[id];
        if (!scene) continue;
        const source = part === 'night' ? scene.night : scene.day;
        const picture = panel(scene, part === 'night');
        if (!picture) continue;
        const [ox, oy] = scene.origin;
        const [kx, ky] = Array.isArray(scene.scale) ? scene.scale : [scene.scale, scene.scale];
        const dx = ox * z - cx, dy = oy * z - cy;
        const dw = source[2] * kx * z, dh = source[3] * ky * z;
        if (dx > W || dy > H || dx + dw < 0 || dy + dh < 0) continue;
        const clip = polygon => {
            g.beginPath();
            polygon.forEach(([x, y], i) => {
                const px = dx + x * kx * z, py = dy + y * ky * z;
                if (i) g.lineTo(px, py); else g.moveTo(px, py);
            });
            g.closePath(); g.clip();
        };
        const background = () => {
            g.drawImage(picture, dx, dy, dw, dh);
            // Completed works remain visible above the otherwise untouched atlas.
            // (painted in daylight: under an authored night they take the village's night shade)
            const nightPicture = part === 'night' && scene.nightImage;
            if (scene.fullMap) for (const id of renderer.map.open) for (const c of renderer.map.d.overlays?.[id] || []) {
                g.drawImage(renderer.ground, c.x*16, c.y*16, 16, 16,
                    c.x*16*z-cx, c.y*16*z-cy, 16*z, 16*z);
                if (nightPicture && tint) { g.fillStyle = tint; g.fillRect(c.x*16*z-cx, c.y*16*z-cy, 16*z, 16*z); }
            }
            // Dawn/evening retain the normal world lighting; night is authored.
            // a lamp-lit room keeps one picture and darkens less than the open village (tintNight: its own colour)
            const night = part === 'night' && scene.tintNight && !scene.nightImage ? (typeof scene.tintNight === 'string' ? scene.tintNight : tint) : null;
            const shade = part === 'night' ? night : tint;
            if (shade) { g.fillStyle = shade; g.fillRect(dx, dy, dw, dh); }
        };
        const liveActors = (minimumFoot = -Infinity) => {
            const cv = renderer.referenceActors;
            if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
            const ag = cv.getContext('2d');
            ag.clearRect(0, 0, W, H); ag.imageSmoothingEnabled = false;
            paintActors(ag, minimumFoot);
            // people under an authored night get a lighter shade than the village's, to sit in its lamplight
            const shade = part === 'night' && (scene.nightImage || typeof scene.tintNight === 'string') ? 'rgba(24,34,90,.28)' : tint;
            if (shade) {
                ag.globalCompositeOperation = 'source-atop';
                ag.fillStyle = shade; ag.fillRect(0, 0, W, H);
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
            const foot = oy + o.foot * ky;
            const xs = o.polygon.map(p => ox + p[0]*kx), ys = o.polygon.map(p => oy + p[1]*ky);
            const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
            if (!actors.some(a => (a.y + 1)*16 < foot && (a.x + 2)*16 > left &&
                (a.x - 1)*16 < right && (a.y + 1)*16 > top && (a.y - 2)*16 < bottom)) continue;
            g.save(); clip(o.polygon); background(); liveActors(foot); g.restore();
        }
        g.restore();
    }
}
