// Reuse the approved atlas for the village's shared materials. No new artwork
// or network request: this is the same decoded image as the Duat entrance.
import { DATA } from '../core/data.js';
const cache = new WeakMap();
export function materials() {
    const scene = DATA.sceneArt?.duat;
    if (!scene) return null;
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
// Broad staggered rock shoulders join the entrance to the northern ridge and
// taper back into the eastern bank below it. All faces come from the source.
export function referenceEscarpment(ctx) {
    if(!ctx.m.d.referenceScenes?.includes('duat'))return;
    const a=materials(); if(!a)return;
    const g=ctx.g, image=a.scene.image;
    const rock=(x,y,w,h,quiet=false)=>{
        g.save();g.beginPath();
        [[.04,.18],[.07,.07],[.24,0],[.64,.02],[.88,.09],[.94,.22],[1,.68],[.95,1],[.13,.98],[0,.76]].forEach(([px,py],i)=>i?g.lineTo(x+px*w,y+py*h):g.moveTo(x+px*w,y+py*h));
        g.closePath();g.clip();g.imageSmoothingEnabled=false;
        // Use only unobstructed cap/face samples: the full tall-rock crop
        // also contains the doorway at its lower left.
        if(quiet) g.drawImage(image,662,147,58,98,x,y,w,h);
        else g.drawImage(image,658,147,86,145,x,y,w,h);
        g.drawImage(image,586,80,166,74,x,y,w,h*.32);
        g.restore();
    };
    // Back to front, offset heights instead of a boxed rectangular enclosure.
    rock(614,12,64,102); rock(578,20,59,95,true); rock(542,31,54,99);
    // The original lower bank starts at world (631,261). Carry it down with
    // overlapping sandstone shoulders, narrowing before the riverside grass.
    rock(638,293,40,55);rock(641,331,37,45,true);rock(650,359,28,27);
}
