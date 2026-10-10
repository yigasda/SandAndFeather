const sharp=require('sharp'),path=require('path'),fs=require('fs');
const O=__dirname;
(async()=>{
 const strips=[];
 for(const side of ['left','right']){
  const image=await sharp(path.join(O,'sources',side+'-extension.png')).resize(720,887,{fit:'fill'}).removeAlpha().raw().toBuffer();
  const E=JSON.parse(fs.readFileSync(path.join(O,'sources/seam-displacement.json')))[side],out=Buffer.alloc(160*724*3);
  for(let y=0;y<724;y++)for(let x=0;x<160;x++){
   const fade=Math.max(0,1-(side==='left'?159-x:x)/90);
   const gx=Math.max(0,Math.min(719,(side==='left'?x:x+560)+E[y][0]*fade)),gy=Math.max(0,Math.min(886,y+64+E[y][1]*fade)),ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
   for(let c=0;c<3;c++){let v=0;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)v+=image[(Math.min(886,iy+yy)*720+Math.min(719,ix+xx))*3+c]*(xx?fx:1-fx)*(yy?fy:1-fy);out[(y*160+x)*3+c]=Math.round(v);}
  }
  const strip=await sharp(out,{raw:{width:160,height:724,channels:3}}).png().toBuffer();
  strips.push({input:strip,left:side==='left'?0:2332,top:64});
 }
 await sharp(path.join(O,'../corridor-expand-v3/inner-corridor-expanded-v3.png')).composite(strips).png().toFile(path.join(O,'inner-corridor-expanded-v4.png'));
})();
