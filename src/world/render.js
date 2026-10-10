// Drawing the world on a canvas. The ground and what stands over it are painted once per map and season into two
// off-screen canvases at 16px a tile (paint.js), then scaled up crisp each frame; people, things, the river's
// shimmer, fire, labels and the light of the hour go on top. People and things use the pictures in data/sprites.json when there is one,
// otherwise the stand-in drawn in code.

import { T, paintMap, rnd } from './paint.js';
import { drawReferenceScenes } from './reference-scene.js';
import { DATA } from '../core/data.js';

// the land changes with the season: the Nile runs high and dark in Akhet, the fields are green in Peret and gold in Shemu
const SEASON = {
    akhet: { water: ['#3F8F8B', '#3A8985', '#47958F'], grass: ['#8FAE62', '#88A65B', '#97B56A'], farm: ['#6E5236', '#674D33'], crop: '#5E9645' },
    peret: { water: ['#5FA7A3', '#58A09C', '#68AFAA'], grass: ['#9DB56A', '#93AC61', '#A6BD72'], farm: ['#7F6140', '#76593B'], crop: '#6DA34D' },
    shemu: { water: ['#7DB8B0', '#76B1A9', '#86BFB7'], grass: ['#B7B26A', '#AFA962', '#C0BA72'], farm: ['#8A6A45', '#80623F'], crop: '#C9A84A' },
};
SEASON.epagomenal = SEASON.shemu;
// sprites drawn flat on the ground, under people
const FLAT = new Set(['prints', 'sluice', 'mural']);
const TINT = { dawn: 'rgba(255,190,150,0.10)', day: null, evening: 'rgba(214,110,40,0.18)', night: 'rgba(16,32,100,0.57)' };

export const MODE = { life: '생활', growth: '육성', duat: '원정', realm: '경영' };


export class Renderer {
    constructor(canvas) {
        this.cv = canvas;
        this.g = canvas.getContext('2d');
        this.ground = document.createElement('canvas');
        this.top = document.createElement('canvas');
        this.referenceActors = document.createElement('canvas');
        this.map = null; this.season = null;
        this.zoom = 2; this.cam = { x: 0, y: 0 };
        this.art = new Map(); // drawn pictures from data/sprites.json, one small canvas each
    }
    // data/sprites.json: people by look and view, things by sprite name; what is missing stays drawn in code
    setSprites(data) {
        this.art.clear();
        const make = (rows, colors, flip = false) => {
            // usually 16×16; a wider or taller one (wings) is centred on the tile and stands on its bottom
            const c = document.createElement('canvas');
            c.width = Math.max(1, ...rows.map(r => String(r).length)); c.height = rows.length;
            const g = c.getContext('2d');
            rows.forEach((r, y) => [...String(r)].forEach((ch, x) => {
                const col = colors?.[ch];
                if (ch === '.' || !col) return;
                g.fillStyle = col; g.fillRect(flip ? c.width - 1 - x : x, y, 1, 1);
            }));
            return c;
        };
        const ok = rows => Array.isArray(rows) && rows.length;
        for (const [look, d] of Object.entries(data?.looks || {})) {
            if (ok(d.down)) this.art.set(`${look}|down`, make(d.down, d.colors));
            if (ok(d.up)) this.art.set(`${look}|up`, make(d.up, d.colors));
            if (ok(d.side)) { this.art.set(`${look}|right`, make(d.side, d.colors)); this.art.set(`${look}|left`, make(d.side, d.colors, true)); }
        }
        for (const [name, d] of Object.entries(data?.things || {})) if (ok(d.rows)) this.art.set(`thing|${name}`, make(d.rows, d.colors));
    }
    setMap(map, season) {
        if (this.map === map && this.season === season) return;
        this.map = map; this.season = season;
        this.paintGround();
    }
    // a phone browser can throw canvas pictures away while the tab is in the background (the GPU memory is
    // taken back); the ground painted once is then blank. Painting it again brings the map back.
    repaint() { if (this.map) this.paintGround(); }
    // folded or closed: give the pictures' memory back (about 10MB on a phone); setMap paints them again on open
    release() {
        for (const c of [this.cv, this.ground, this.top, this.referenceActors]) { c.width = 1; c.height = 1; }
        this.map = null; this.season = null;
    }
    resize() {
        const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        this.cv.width = Math.max(1, Math.round(r.width * dpr));
        this.cv.height = Math.max(1, Math.round(r.height * dpr));
        this.dpr = dpr;
        // about 12 tiles across on a phone, about 18 on a wide screen, always whole pixels
        this.zoom = Math.max(2, Math.min(4, Math.round(r.width / ((r.width < 600 ? 12 : 18) * T)))) * dpr;
    }

    // ---- the still layers: painted once per map and season (paint.js)
    paintGround() { paintMap(this.map, SEASON[this.season] || SEASON.peret, this.ground, this.top, this.season); }

    // ---- people
    person(g, look, x, y, dir, step, z) {
        const P = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(x + a * z, y + b * z, w * z, h * z); };
        const pic = this.art.get(`${look}|${dir}`) || this.art.get(`${look}|down`);
        if (pic) { // a drawn picture: a shadow, and a step makes it bob
            P(4, 14, 8, 2, 'rgba(40,25,10,.25)');
            g.drawImage(pic, x - (pic.width - 16) / 2 * z, y - (pic.height - 16 + Math.floor(step) % 2) * z, pic.width * z, pic.height * z);
            return;
        }
        const L = LOOKS[look] || LOOKS.townsman;
        const leg = Math.floor(step) % 2;
        P(4, 14, 8, 2, 'rgba(40,25,10,.25)');
        if (L.wings) { P(1, 6, 3, 7, L.wings); P(12, 6, 3, 7, L.wings); P(1, 6, 3, 1, L.wingsHi); P(12, 6, 3, 1, L.wingsHi); }
        if (L.longHair && dir !== 'down') P(5, 3, 6, 9, L.hair);
        P(5 + leg, 12, 2, 3, L.skin); P(9 - leg, 12, 2, 3, L.skin);         // legs
        P(4, 7, 8, 6, L.body); if (L.top) P(5, 7, 6, 3, L.top);              // body (and bare chest)
        if (L.collar) P(5, 7, 6, 1, L.collar);
        P(5, 2, 6, 5, L.skin);                                              // head
        P(5, 1, 6, 2, L.hair);
        if (L.spikes) { P(5, 0, 1, 1, L.hair); P(7, 0, 1, 1, L.hair); P(9, 0, 1, 1, L.hair); }
        if (L.longHair && dir === 'down') { P(4, 2, 1, 8, L.hair); P(11, 2, 1, 8, L.hair); }
        if (L.side && dir === 'down') { P(4, 2, 1, 5, L.hair); P(11, 2, 1, 5, L.hair); }
        if (dir === 'down') { P(6, 4, 1, 1, '#2B2018'); P(9, 4, 1, 1, '#2B2018'); }
        if (dir === 'left') P(6, 4, 1, 1, '#2B2018');
        if (dir === 'right') P(9, 4, 1, 1, '#2B2018');
        P(4, 7, 1, 4, L.skin); P(11, 7, 1, 4, L.skin);                       // arms
    }

    // ---- a frame
    draw({ player, people, things = [], part, time, near }) {
        const g = this.g, m = this.map, z = this.zoom, W = this.cv.width, H = this.cv.height, ts = T * z;
        const fullScene = (m.d.referenceScenes || []).map(id => DATA.sceneArt?.[id]).find(s => s?.fullMap);
        g.imageSmoothingEnabled = false;
        // the camera follows her, but never shows past the map's edge
        const mw = m.w * ts, mh = m.h * ts;
        let cx = (player.x + 0.5) * ts - W / 2, cy = (player.y + 0.5) * ts - H / 2;
        cx = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, cx));
        cy = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(mh - H, cy));
        this.cam = { x: cx, y: cy };
        g.fillStyle = '#2a2018'; g.fillRect(0, 0, W, H);
        if (!fullScene) g.drawImage(this.ground, -cx, -cy, mw, mh);
        // the river moves
        g.fillStyle = 'rgba(225,245,240,.55)';
        const i0 = Math.max(0, Math.floor(cx / ts)), i1 = Math.min(m.w, Math.ceil((cx + W) / ts)), j0 = Math.max(0, Math.floor(cy / ts)), j1 = Math.min(m.h, Math.ceil((cy + H) / ts));
        for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
            if (fullScene || m.type(i, j) !== 'water' || rnd(i, j, 5) < 0.55) continue;
            const off = ((time * 3 + rnd(i, j, 6) * 16) % 16);
            g.fillRect(i * ts + off * z - cx, j * ts + (5 + rnd(i, j, 7) * 7) * z - cy, 5 * z, z);
        }
        // things lying on the ground first, then people and standing things back to front
        if (!fullScene) for (const t of things) if (FLAT.has(t.sprite)) this.sprite(g, t, Math.round(t.x * ts - cx), Math.round(t.y * ts - cy), z, time);
        const ppl = [...people, { look: 'somang', x: player.x, y: player.y, dir: player.dir, step: player.moving ? player.step : 0 },
            ...things.filter(t => !FLAT.has(t.sprite)).map(t => ({ thing: t, x: t.x, y: t.y }))];
        ppl.sort((a, b) => a.y - b.y);
        if (!fullScene) for (const p of ppl) {
            if (p.thing) this.sprite(g, p.thing, Math.round(p.x * ts - cx), Math.round(p.y * ts - cy), z, time);
            else this.person(g, p.look, Math.round(p.x * ts - cx), Math.round(p.y * ts - cy), p.dir, p.step, z);
        }
        if (!fullScene) g.drawImage(this.top, -cx, -cy, mw, mh);
        // the hour's light
        const tint = TINT[part];
        if (tint && !fullScene) { g.fillStyle = tint; g.fillRect(0, 0, W, H); }
        drawReferenceScenes(this, {part, tint, cx, cy, z, actors:ppl,
            paintActors: (target, minimumFoot) => {
                if (minimumFoot === -Infinity) for (const t of things) if (FLAT.has(t.sprite))
                    this.sprite(target, t, Math.round(t.x * ts - cx), Math.round(t.y * ts - cy), z, time);
                for (const p of ppl) {
                    if ((p.y + 1) * T < minimumFoot) continue;
                    if (p.thing) this.sprite(target, p.thing, Math.round(p.x * ts - cx), Math.round(p.y * ts - cy), z, time);
                    else this.person(target, p.look, Math.round(p.x * ts - cx), Math.round(p.y * ts - cy), p.dir, p.step, z);
                }
            }
        });
        // place names: the mode in orange, then the name ("생활 시장"), like the mockup
        g.textBaseline = 'middle';
        for (const sp of m.spots) {
            if (!sp.label) continue;
            const tag = MODE[sp.mode] || '';
            g.font = `700 ${Math.round(5.5 * z)}px 'Noto Sans KR', sans-serif`;
            const wt = tag ? g.measureText(tag + ' ').width : 0, wl = g.measureText(sp.label).width, w = wt + wl + 9 * z;
            const x = (sp.x + 0.5) * ts - cx - w / 2, y = (sp.y - 0.55) * ts - cy;
            if (x + w < 0 || x > W || y < -10 * z || y > H + 10 * z) continue;
            g.fillStyle = 'rgba(43,32,24,.62)';
            g.beginPath(); g.roundRect ? g.roundRect(x, y - 5 * z, w, 10 * z, 5 * z) : g.rect(x, y - 5 * z, w, 10 * z); g.fill();
            g.textAlign = 'left';
            if (tag) { g.fillStyle = '#F2A36E'; g.fillText(tag, x + 4.5 * z, y + 0.5 * z); }
            g.fillStyle = '#FBF3EA'; g.fillText(sp.label, x + 4.5 * z + wt, y + 0.5 * z);
        }
        // a soft ring under what she can talk to
        if (near) {
            g.strokeStyle = 'rgba(184,84,31,.85)'; g.lineWidth = Math.max(2, z);
            g.beginPath(); g.ellipse((near.x + 0.5) * ts - cx, (near.y + 0.95) * ts - cy, 6 * z, 2.5 * z, 0, 0, Math.PI * 2); g.stroke();
        }
        // The sealed passage keeps its light inside the existing doorway.
        // A small threshold and inner seam brighten at night, with no village-wide glow.
        for (const b of m.buildings) if (b.glow === 'duat' && !b.artInReference) {
            const bx = b.x * ts - cx, bottom = (b.y + b.h) * ts - cy;
            const night = part === 'night' || part === 'evening';
            g.fillStyle = night ? 'rgba(156,124,191,.65)' : 'rgba(128,104,153,.25)';
            g.fillRect(bx + 6 * z, bottom - 2 * z, (b.w * T - 12) * z, z);
            if (night) {
                g.fillStyle = 'rgba(123,94,155,.25)';
                g.fillRect(bx + 5 * z, bottom - 6 * z, (b.w * T - 10) * z, 4 * z);
            }
        }
        const fires = (m.decor || []).filter(d => d.k === 'brazier');
        // braziers burn
        for (const d of fires) {
            if (d.referenceOwned) continue;
            const fx = d.x * ts - cx, fy = d.y * ts - cy;
            if (fx < -ts || fx > W + ts || fy < -ts * 2 || fy > H + ts) continue;
            const f = Math.floor(time * 8 + d.x * 3) % 3;
            const P = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(fx + a * z, fy + b * z, w * z, h * z); };
            P(4, 1 - f % 2, 8, 3, '#E0702A'); P(5, -1 + (f === 2 ? 1 : 0), 6, 3, '#F2A33A'); P(6 + (f === 1 ? 1 : 0), -3, 3, 3, '#FFD86A'); P(7, -4 - f % 2, 2, 1, '#FFF3C0');
        }
        if (part === 'evening' || part === 'night') for (const d of fires) {
            const fx = (d.x + 0.5) * ts - cx, fy = (d.y + 0.1) * ts - cy, r = ts * (2.4 + 0.15 * Math.sin(time * 6 + d.x));
            const gr = g.createRadialGradient(fx, fy, 0, fx, fy, r);
            gr.addColorStop(0, 'rgba(255,190,90,.45)'); gr.addColorStop(1, 'rgba(255,190,90,0)');
            g.fillStyle = gr; g.fillRect(fx - r, fy - r, r * 2, r * 2);
        }
    }

    // a thing on the map, drawn on its tile (x, y = the tile's top left on screen)
    sprite(g, t, x, y, z, time) {
        const P = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(x + a * z, y + b * z, w * z, h * z); };
        const bob = Math.round(Math.sin(time * 4 + t.x) * 1);
        const pic = this.art.get(`thing|${t.sprite}`);
        if (pic) { g.drawImage(pic, x - (pic.width - 16) / 2 * z, y - (pic.height - 16) * z, pic.width * z, pic.height * z); return; }
        switch (t.sprite) {
            case 'beetle':
                P(5, 13, 6, 1, 'rgba(40,25,10,.2)');
                P(6, 7 + bob, 4, 4, '#2F6FB6'); P(7, 6 + bob, 2, 1, '#1D3F6E'); P(6, 7 + bob, 1, 2, '#7FB2EE'); P(5, 8 + bob, 1, 2, '#2F6FB6'); P(10, 8 + bob, 1, 2, '#2F6FB6');
                if (Math.floor(time * 3) % 2) { P(4, 6 + bob, 2, 1, 'rgba(255,255,255,.7)'); P(10, 6 + bob, 2, 1, 'rgba(255,255,255,.7)'); }
                break;
            case 'falcon':
                P(5, 14, 6, 1, 'rgba(40,25,10,.2)');
                P(6, 6, 4, 6, '#6B5A4A'); P(7, 4, 3, 3, '#3B3028'); P(10, 5, 1, 1, '#E0B040'); P(5, 7, 2, 4, '#4E4136'); P(9, 7, 2, 4, '#4E4136'); P(7, 12, 1, 2, '#E0B040'); P(9, 12, 1, 2, '#E0B040');
                break;
            case 'cat':
                P(4, 14, 8, 1, 'rgba(40,25,10,.2)');
                P(5, 9, 6, 4, '#C9A36A'); P(9, 6, 4, 4, '#C9A36A'); P(9, 5, 1, 1, '#C9A36A'); P(12, 5, 1, 1, '#C9A36A'); P(10, 7, 1, 1, '#2B2018'); P(4, 7 + bob, 1, 3, '#C9A36A'); P(6, 10, 1, 2, '#8A6A45');
                break;
            case 'prints':
                for (let k = 0; k < 3; k++) { P(3 + k * 4, 6 + (k % 2) * 4, 2, 3, 'rgba(90,65,40,.45)'); }
                break;
            case 'chest':
                P(3, 13, 10, 2, 'rgba(40,25,10,.25)'); P(3, 7, 10, 7, '#8E6A44'); P(3, 7, 10, 2, '#6A4C2E'); P(7, 9, 2, 2, '#E0B040');
                break;
            case 'sluice':
                P(3, 4, 2, 11, '#6A4C2E'); P(11, 4, 2, 11, '#6A4C2E'); P(5, t.open ? 4 : 8, 6, 5, '#8E6A44');
                if (t.open) P(5, 11, 6, 4, '#5FA7A3');
                break;
            case 'boat':
                P(1, 9, 14, 3, '#7A5A38'); P(2, 12, 12, 1, '#5A3F28'); P(7, 2, 1, 8, '#5A3F28'); P(8, 3, 4, 5, '#F2E8DA');
                break;
            case 'mural':
                P(2, 3, 12, 10, `rgba(160,190,255,${0.35 + 0.2 * Math.sin(time * 2)})`); P(5, 5, 6, 1, '#E8F0FF'); P(7, 6, 2, 5, '#E8F0FF'); P(4, 10, 8, 1, '#E8F0FF');
                break;
            case 'banner': { // a festival pole with pennants that stir
                const w = Math.round(Math.sin(time * 3 + t.x) * 1);
                P(3, 14, 10, 1, 'rgba(40,25,10,.25)'); P(7, 1, 2, 14, '#6A4C2E');
                P(9, 2 + w, 5, 2, '#D9733A'); P(9, 5, 4, 2, '#2F6FB6'); P(9, 8 - w, 5, 2, '#E0B040');
                P(2, 3 - w, 5, 2, '#5FA7A3'); P(3, 6, 4, 2, '#C0392B');
                P(6, 0, 4, 1, '#E0B040');
                break;
            }
            case 'obelisk': case 'obelisk_on': { // a tall stone, its tip gold and glowing once woken
                const on = t.sprite === 'obelisk_on';
                P(4, 14, 8, 1, 'rgba(40,25,10,.3)'); P(5, 12, 6, 2, '#A89070');
                P(6, 3, 4, 9, '#C9B591'); P(6, 3, 1, 9, '#E2D2B0'); P(9, 3, 1, 9, '#A89070');
                P(7, 5, 2, 1, '#8A7556'); P(7, 7, 2, 1, '#8A7556'); P(7, 9, 1, 1, '#8A7556');
                P(7, 1, 2, 2, on ? '#F2C94C' : '#B8A07E'); P(6, 2, 4, 1, on ? '#E0B040' : '#A89070');
                if (on) { const k = 0.35 + 0.25 * Math.sin(time * 3 + t.x); P(5, 0, 6, 4, `rgba(255,220,120,${k})`); }
                break;
            }
            case 'stone':
                P(2, 7, 12, 8, '#B8A07E'); P(3, 6, 9, 3, '#C9B591'); P(2, 14, 12, 1, 'rgba(40,25,10,.25)');
                break;
            default: { // a sparkle: something to look at
                const k = 0.5 + 0.5 * Math.sin(time * 5 + t.x * 3);
                g.fillStyle = `rgba(255,236,170,${0.55 + 0.45 * k})`;
                P(7, 4, 2, 8, g.fillStyle); P(4, 7, 8, 2, g.fillStyle); P(7, 7, 2, 2, '#FFFFFF');
            }
        }
    }

    // the whole map small, with a dot for her
    minimap(cv, player) {
        const m = this.map, g = cv.getContext('2d');
        g.imageSmoothingEnabled = true;
        g.clearRect(0, 0, cv.width, cv.height);
        const k = Math.min(cv.width / this.ground.width, cv.height / this.ground.height);
        const w = this.ground.width * k, h = this.ground.height * k, ox = (cv.width - w) / 2, oy = (cv.height - h) / 2;
        g.fillStyle = '#2a2018'; g.fillRect(0, 0, cv.width, cv.height);
        const scene = (m.d.referenceScenes || []).map(id => DATA.sceneArt?.[id]).find(s => s?.fullMap);
        if (scene) {
            g.drawImage(scene.image, ...scene.day, ox, oy, w, h);
            for (const id of m.open) for (const c of m.d.overlays?.[id] || [])
                g.drawImage(this.ground,c.x*T,c.y*T,T,T,ox+c.x*T*k,oy+c.y*T*k,T*k,T*k);
        } else g.drawImage(this.ground, ox, oy, w, h);
        g.fillStyle = '#B8541F'; g.strokeStyle = '#FBF3EA'; g.lineWidth = 1.5;
        g.lineWidth = Math.max(1.5, cv.width / 220);
        g.beginPath(); g.arc(ox + (player.x + 0.5) * T * k, oy + (player.y + 0.6) * T * k, Math.max(3.2, cv.width / 90), 0, Math.PI * 2); g.fill(); g.stroke();
    }
}

const LOOKS = {
    somang: { skin: '#F1D2B6', body: '#F4EFE6', hair: '#2B2018', side: true },
    set: { skin: '#F3DCC8', body: '#1E1A18', top: '#F3DCC8', hair: '#7A1E22', longHair: true, collar: '#D9B65A' },
    horus: { skin: '#F6EEE8', body: '#F7F3EC', top: '#F6EEE8', hair: '#1B2440', spikes: true, collar: '#D9B65A', wings: '#5B5E8F', wingsHi: '#8E90B8' },
    townsman: { skin: '#C99A72', body: '#E8E0D0', top: '#C99A72', hair: '#2B2018' },
};
