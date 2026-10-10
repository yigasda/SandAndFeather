// Reuse the approved atlas for the village's shared materials. No new artwork
// or network request: this is the same decoded image as the Duat entrance.
import { DATA } from '../core/data.js';
const cache = new WeakMap();
export function materials() {
    const scene = DATA.sceneArt?.materials;
    if (!scene?.image) return null; // not loaded: no map in play uses it
    if (cache.has(scene)) return cache.get(scene);
    const make = (sx, sy, sw, sh, w, h) => {
        const cv = document.createElement('canvas'); cv.width=w; cv.height=h;
        const g=cv.getContext('2d'); g.imageSmoothingEnabled=false;
        g.drawImage(scene.image,sx,sy,sw,sh,0,0,w,h); return cv;
    };
    const sand=make(34,440,160,88,40,22);
    // Blend patch boundaries to the reference's open-ground colour. Keep the
    // original small chips inside; avoid a visible repeated rectangular patch.
    const g=sand.getContext('2d'), p=g.getImageData(0,0,40,22);
    const base=[244,215,156];
    for(let y=0;y<22;y++) for(let x=0;x<40;x++) {
        const a=Math.min(1,Math.min(x,39-x,y,21-y)/4), i=(y*40+x)*4;
        for(let c=0;c<3;c++) p.data[i+c]=Math.round(base[c]+(p.data[i+c]-base[c])*a);
    }
    g.putImageData(p,0,0);
    const paving=make(88,854,46,34,12,9);
    const result={sand,paving,scene}; cache.set(scene,result); return result;
}
export function referenceGround(g,kind,x,y,w=16,h=16) {
    const a=materials(); if(!a)return false;
    g.save(); g.translate(464,76);
    g.fillStyle=g.createPattern(kind==='path'?a.paving:a.sand,'repeat');
    g.fillRect(x-464,y-76,w,h); g.restore(); return true;
}
