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
    // without seams the decoded picture is drawn as it is: no second copy of it in memory
    if (!scene.seams?.length) { panels.set(image, image); return image; }
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
        // Only the part of the picture inside `box` (screen pixels) is drawn: the whole map scaled up every
        // frame was the slow part on phones.
        const inter = (a, b) => { const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]), x1 = Math.min(a[2], b[2]), y1 = Math.min(a[3], b[3]); return x1 > x0 && y1 > y0 ? [x0, y0, x1, y1] : null; };
        const view = inter([0, 0, W, H], [dx, dy, dx + dw, dy + dh]);
        if (!view) continue;
        const nightPicture = part === 'night' && scene.nightImage;
        // Dawn/evening retain the normal world lighting; night is authored.
        // a lamp-lit room keeps one picture and darkens less than the open village (tintNight: its own colour)
        const roomNight = part === 'night' && scene.tintNight && !scene.nightImage ? (typeof scene.tintNight === 'string' ? scene.tintNight : tint) : null;
        const groundShade = part === 'night' ? roomNight : tint;
        // people under an authored night get a lighter shade than the village's, to sit in its lamplight
        const actorShade = part === 'night' && (scene.nightImage || typeof scene.tintNight === 'string') ? 'rgba(24,34,90,.28)' : tint;
        const pw = picture.width || picture.naturalWidth, ph = picture.height || picture.naturalHeight;
        const background = box => {
            const [x0, y0, x1, y1] = box.map(Math.round);
            if (x1 <= x0 || y1 <= y0) return;
            g.drawImage(picture, (x0 - dx) / dw * pw, (y0 - dy) / dh * ph, (x1 - x0) / dw * pw, (y1 - y0) / dh * ph, x0, y0, x1 - x0, y1 - y0);
            // Completed works remain visible above the otherwise untouched atlas.
            // (painted in daylight: under an authored night they take the village's night shade)
            if (scene.fullMap) for (const id of renderer.map.open) for (const c of renderer.map.d.overlays?.[id] || []) {
                const cxs = c.x*16*z-cx, cys = c.y*16*z-cy;
                if (cxs > x1 || cys > y1 || cxs + 16*z < x0 || cys + 16*z < y0) continue;
                g.drawImage(renderer.ground, c.x*16, c.y*16, 16, 16, cxs, cys, 16*z, 16*z);
                if (nightPicture && tint) { g.fillStyle = tint; g.fillRect(cxs, cys, 16*z, 16*z); }
            }
            if (groundShade) { g.fillStyle = groundShade; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
        };
        // People are painted straight onto the screen; only a shade (evening, night) needs them on their own
        // layer first, and then only the box is cleared, shaded and copied.
        const liveActors = (minimumFoot, box) => {
            if (!actorShade) { paintActors(g, minimumFoot); return; }
            const cv = renderer.referenceActors;
            if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
            const ag = cv.getContext('2d');
            const [x0, y0, x1, y1] = [Math.floor(box[0]), Math.floor(box[1]), Math.ceil(box[2]), Math.ceil(box[3])];
            ag.clearRect(x0, y0, x1 - x0, y1 - y0); ag.imageSmoothingEnabled = false;
            ag.save(); ag.beginPath(); ag.rect(x0, y0, x1 - x0, y1 - y0); ag.clip();
            paintActors(ag, minimumFoot);
            ag.globalCompositeOperation = 'source-atop';
            ag.fillStyle = actorShade; ag.fillRect(x0, y0, x1 - x0, y1 - y0);
            ag.restore();
            g.drawImage(cv, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
        };
        g.save();
        g.beginPath(); g.rect(-cx,-cy,renderer.map.w*16*z,renderer.map.h*16*z); g.clip();
        clip(scene.clip);
        background(view); liveActors(-Infinity, view);
        // Restore authored foreground silhouettes over actors behind them. A
        // foreground actor is then redrawn only inside that silhouette's clip.
        for (const o of scene.occluders || []) {
            const foot = oy + o.foot * ky;
            const xs = o.polygon.map(p => ox + p[0]*kx), ys = o.polygon.map(p => oy + p[1]*ky);
            const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
            if (!actors.some(a => (a.y + 1)*16 < foot && (a.x + 2)*16 > left &&
                (a.x - 1)*16 < right && (a.y + 1)*16 > top && (a.y - 2)*16 < bottom)) continue;
            const box = inter(view, [left*z - cx - 1, top*z - cy - 1, right*z - cx + 1, bottom*z - cy + 1]);
            if (!box) continue;
            g.save(); clip(o.polygon); background(box); liveActors(foot, box); g.restore();
        }
        g.restore();
    }
}
