const sharp=require('sharp'),path=require('path'),O=__dirname;
const label=(s,w)=>Buffer.from(`<svg width="${w}" height="42"><rect width="100%" height="100%" fill="#f5eddf"/><text x="18" y="28" font-family="sans-serif" font-size="19" fill="#463b30">${s}</text></svg>`);
(async()=>{let composite=[];for(const [i,folder] of [[0,'../corridor-expand-v3/inner-corridor-expanded-v3.png'],[1,'inner-corridor-expanded-v4.png']]){
 for(const [j,x] of [[0,0],[1,2092]]){let crop=await sharp(path.join(O,folder)).extract({left:x,top:50,width:400,height:440}).resize(600,660).png().toBuffer();composite.push({input:crop,left:j*600,top:i*702+42});}
 composite.push({input:label(i?'139 · CORRECTED ENTRANCE EXTENSIONS':'137 · REJECTED — OVERLAPPING PERSPECTIVE',1200),left:0,top:i*702});}
 await sharp({create:{width:1200,height:1404,channels:3,background:'#f5eddf'}}).composite(composite).png().toFile(path.join(O,'previews/139-entrances-before-after.png'));
 const full=await sharp(path.join(O,'inner-corridor-expanded-v4.png')).resize(1744,621).png().toBuffer();await sharp({create:{width:1744,height:663,channels:3,background:'#f5eddf'}}).composite([{input:label('139 · INNER CORRIDOR · 2492 × 887 · REVIEW',1744),left:0,top:0},{input:full,left:0,top:42}]).png().toFile(path.join(O,'previews/139-inner-corridor-full.png'));
})();
