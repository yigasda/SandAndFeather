const s=require('sharp'),fs=require('fs'),O=__dirname;
(async()=>{const sequence=[0,1,2,1],dirs=['front','back','left','right'];let frames=[];
for(const phase of sequence){let composite=[];for(let j=0;j<4;j++){const dir=dirs[j];let input=await s(`${O}/walk/horus-${dir}-${phase}.png`).png().toBuffer();let dx=0,dy=0;if(dir==='front'){[dx,dy]=phase===0?[1,0]:phase===2?[-1,0]:[0,-1];}
composite.push({input,left:(j%2)*360+4+dx,top:Math.floor(j/2)*400+4+dy});}
frames.push(await s({create:{width:728,height:808,channels:4,background:'#f5efe3'}}).composite(composite).raw().toBuffer());}
await s(Buffer.concat(frames),{raw:{width:728,height:808*4,channels:4,pageHeight:808}}).gif({delay:[180,180,180,180],loop:0,effort:5}).toFile(O+'/previews/155-horus-walk-4directions.gif');
for(const dir of dirs){const pages=[];for(const phase of sequence){const[dx,dy]=dir==='front'?(phase===0?[1,0]:phase===2?[-1,0]:[0,-1]):[0,0];pages.push(await s({create:{width:368,height:408,channels:4,background:'#f5efe3'}}).composite([{input:`${O}/walk/horus-${dir}-${phase}.png`,left:4+dx,top:4+dy}]).raw().toBuffer());}await s(Buffer.concat(pages),{raw:{width:368,height:408*4,channels:4,pageHeight:408}}).gif({delay:[180,180,180,180],loop:0,effort:5}).toFile(`${O}/previews/155-horus-${dir}.gif`);}
})();
