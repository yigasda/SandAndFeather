const sharp=require('sharp'),path=require('path');
const O=__dirname,root=path.resolve(O,'..');
const label=(s,w)=>Buffer.from(`<svg width="${w}" height="50"><rect width="100%" height="100%" fill="#f5eddf"/><text x="22" y="33" font-family="sans-serif" font-size="23" fill="#463b30">${s}</text></svg>`);
(async()=>{
 const old=path.join(root,'exits-v2/inner-corridor-wide-v1.png'),now=path.join(O,'inner-corridor-expanded-v3.png');
 const full=await sharp({create:{width:2492,height:887,channels:3,background:'#eee7dc'}}).composite([{input:old,left:160,top:64}]).png().toBuffer();
 const a=await sharp(full).resize(1495,532).png().toBuffer();
 const b=await sharp(now).resize(1495,532).png().toBuffer();
 await sharp({create:{width:1495,height:1164,channels:3,background:'#f5eddf'}}).composite([{input:label('ORIGINAL · 2172 × 724',1495),left:0,top:0},{input:a,left:0,top:50},{input:label('137 · INNER CORRIDOR · 2492 × 887',1495),left:0,top:582},{input:b,left:0,top:632}]).png().toFile(path.join(O,'previews/137-inner-before-after.png'));
 const sprite=await sharp(path.resolve(root,'../chibi-refresh/final/somang/walk/somang-back-1.png')).resize(100,111).png().toBuffer();
 const screen=await sharp(now).composite([{input:sprite,left:94,top:284},{input:sprite,left:2303,top:284}]).png().toBuffer();
 const left=await sharp(screen).extract({left:0,top:180,width:390,height:300}).resize(780,600).png().toBuffer();
 const right=await sharp(screen).extract({left:2102,top:180,width:390,height:300}).resize(780,600).png().toBuffer();
 await sharp({create:{width:1560,height:650,channels:3,background:'#f5eddf'}}).composite([{input:label('STATIC SIZE PREVIEW · NOT IN-GAME · 100 × 111 sprite canvas',1560),top:0,left:0},{input:left,top:50,left:0},{input:right,top:50,left:780}]).png().toFile(path.join(O,'previews/137-entrance-avatar-scale.png'));
 const N=path.join(root,'well-option3-night-v1');
 const day=await sharp(path.join(N,'well-courtyard-option3-day.png')).resize(1512,621).png().toBuffer(),night=await sharp(path.join(N,'well-courtyard-option3-night.png')).resize(1512,621).png().toBuffer();
 await sharp({create:{width:1512,height:1342,channels:3,background:'#f5eddf'}}).composite([{input:label('APPROVED OPTION 3 · DAY · 2160 × 887',1512),left:0,top:0},{input:day,left:0,top:50},{input:label('138 · NIGHT REVIEW · SAME CANVAS',1512),left:0,top:671},{input:night,left:0,top:721}]).png().toFile(path.join(N,'previews/138-well-option3-day-night.png'));
})();
