const sharp=require('sharp'),fs=require('fs'),path=require('path'),cp=require('child_process');
const O=__dirname,P=path.dirname(O),T='/workspace/walk-v5-check/render';fs.mkdirSync(T,{recursive:true});fs.mkdirSync(path.join(O,'sheets'),{recursive:true});
const chars=['set','somang','horus'],dirs=['front','back','left','right'],seq=[0,1,2,1],offsets=[[1,0],[0,-1],[-1,0],[0,-1]],bg='#f5efe3';
const blank=(w,h,background=bg)=>sharp({create:{width:w,height:h,channels:4,background}});
const label=(w,h,txt)=>Buffer.from(`<svg width="${w}" height="${h}"><text x="12" y="22" font-family="sans-serif" font-size="16" fill="#483b31">${txt}</text></svg>`);
async function sprite(folder,who,d,i,k,scale=1){const pieces=[{input:path.join(folder,`${who}-${d}-${i}.png`),left:who==='horus'&&d==='front'?offsets[k][0]:0,top:who==='horus'&&d==='front'?offsets[k][1]:0}];
 // Padding allows the approved +/-1px whole-cell offsets without clipping the canvas.
 let c=await blank(364,404,'#00000000').composite(pieces.map(p=>({...p,left:p.left+2,top:p.top+2}))).png().toBuffer();
 return sharp(c).extract({left:2,top:2,width:360,height:400}).resize(Math.round(360*scale),Math.round(400*scale),{kernel:'nearest'}).png().toBuffer();}
function gif(name,files){cp.execFileSync('convert',['-delay','18','-dispose','background',...files,'+dither','-colors','256','-loop','0',path.join(O,'previews',name)]);}
(async()=>{
 for(const who of chars){
  const items=[];for(let r=0;r<4;r++)for(let i=0;i<3;i++)items.push({input:path.join(O,`walk/${who}-${dirs[r]}-${i}.png`),left:360*i,top:400*r});
  await blank(1080,1600,'#00000000').composite(items).png().toFile(path.join(O,`sheets/${who}-walk.png`));
  let files=[],compare=[];
  for(let k=0;k<4;k++){
   let layers=[],cmp=[];
   for(let r=0;r<4;r++){
    const n=await sprite(path.join(O,'walk'),who,dirs[r],seq[k],k),old=await sprite(path.join(P,'approved/walk'),who,dirs[r],seq[k],k);
    layers.push({input:n,left:(r%2)*360,top:36+Math.floor(r/2)*400});
    cmp.push({input:old,left:0,top:36+r*400},{input:n,left:360,top:36+r*400});
   }
   layers.push({input:label(720,36,`${who.toUpperCase()} / FRONT - BACK / LEFT - RIGHT`),left:0,top:0});
   cmp.push({input:label(720,36,`${who.toUpperCase()}   ORIGINAL MOTION                       NEW REVIEW`),left:0,top:0});
   let f=path.join(T,`${who}-${k}.png`),c=path.join(T,`${who}-compare-${k}.png`);
   await blank(720,836).composite(layers).png().toFile(f);await blank(720,1636).composite(cmp).png().toFile(c);files.push(f);compare.push(c);
  }
  gif(`${who==='set'?136:who==='somang'?144:135}-${who}-walk.gif`,files);gif(`${who==='set'?136:who==='somang'?144:135}-${who}-original-comparison.gif`,compare);
 }
 let all=[],front=[];
 for(let k=0;k<4;k++){
  let layers=[],fl=[];
  for(let c=0;c<3;c++){
   layers.push({input:label(240,36,chars[c].toUpperCase()),left:c*240,top:0});
   fl.push({input:label(360,36,chars[c].toUpperCase()),left:c*360,top:0});
   for(let r=0;r<4;r++)layers.push({input:await sprite(path.join(O,'walk'),chars[c],dirs[r],seq[k],k,2/3),left:c*240,top:36+r*267});
   fl.push({input:await sprite(path.join(O,'walk'),chars[c],'front',seq[k],k),left:c*360,top:36});
  }
  let f=path.join(T,`all-${k}.png`),ff=path.join(T,`front-${k}.png`);
  await blank(720,1104).composite(layers).png().toFile(f);await blank(1080,436).composite(fl).png().toFile(ff);all.push(f);front.push(ff);
 }
 gif('144-trio-walk.gif',all);gif('144-trio-front.gif',front);
 console.log('36-frame sheets and 8 GIFs assembled from individual PNGs');
})();
