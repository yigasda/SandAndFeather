const sharp=require('sharp'),fs=require('fs');
(async()=>{const p='/workspace/SandAndFeather-git/docs/art/chibi-refresh/sleep-side-inhale-v200/png/horus-sleep-side-1.png';let {data}=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});let count=0;
for(let y=0;y<720;y++)for(let x=0;x<620;x++){let i=(y*620+x)*4,r=data[i],g=data[i+1],b=data[i+2];const region=(y>220&&y<400&&x>250&&x<480)||(y>=366&&y<466&&x>247&&x<441)||(y>486&&y<648&&x>290&&x<470);
if(region&&data[i+3]>200&&r>222&&g>135&&b>132&&r-g>16&&b>g-20){data[i+2]=Math.min(255,b+4);count++;}}
await sharp(data,{raw:{width:620,height:720,channels:4}}).png().toFile(p+'.tmp.png');fs.renameSync(p+'.tmp.png',p);console.log({skinPixels:count});})();
