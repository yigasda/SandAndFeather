// User requested a direct pixel-only correction, preserving the v2 pupils.
const sharp = require('sharp');
const fs = require('fs');
(async () => {
  const dir = 'docs/art/chibi-refresh/directions';
  const { data, info } = await sharp(`${dir}/horus-idle-v2-blue-hair.png`).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  const spots = [[164.8,324.5,4.7,4.2],[277.3,321.3,4.0,4.1],[1240.1,319.4,2.8,3.7],[2025.5,319.3,3.0,3.7]];
  const mask = new Set();
  for (const [cx,cy,rx,ry] of spots) {
    for (let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++) {
      for (let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++) {
        if (((x-cx)/rx)**2+((y-cy)/ry)**2<=1) mask.add(y*info.width+x);
      }
    }
  }
  const values = new Map([...mask].map(p => [p,[55,35,30]]));
  // Harmonic interpolation of the surrounding original pupil colors.
  for(let iter=0;iter<600;iter++) {
    for(const p of mask) {
      const v=values.get(p);
      for(let c=0;c<3;c++) {
        let sum=0;
        for(const n of [p-1,p+1,p-info.width,p+info.width]) sum+=mask.has(n)?values.get(n)[c]:data[n*4+c];
        v[c]=sum/4;
      }
    }
  }
  for(const p of mask) for(let c=0;c<3;c++) out[p*4+c]=Math.round(values.get(p)[c]);
  let changed=0;
  for(let p=0;p<info.width*info.height;p++) {
    if(out[p*4+3]!==data[p*4+3]) throw Error('Alpha changed');
    if([0,1,2].some(c=>out[p*4+c]!==data[p*4+c])) {
      if(!mask.has(p)) throw Error('Pixel outside catchlight mask changed');
      changed++;
    }
  }
  const base=`${dir}/horus-idle-v4-pixel-correction`;
  await sharp(out,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(`${base}.png`);
  await sharp(`${base}.png`).flatten({background:'#f3f0eb'}).jpeg({quality:96}).toFile(`${base}-preview.jpg`);
  await sharp(`${base}.png`).extract({left:100,top:295,width:235,height:70}).resize({width:1410,kernel:'nearest'}).toFile('/workspace/corrected-eyes.png');
  const report={source:'horus-idle-v2-blue-hair.png',width:info.width,height:info.height,changedPixels:changed,maskPixels:mask.size,changedOutsideMask:0,alphaChanges:0,spots};
  fs.writeFileSync(`${base}-verification.json`,JSON.stringify(report,null,2)+'\n');
  console.log(report);
})();
