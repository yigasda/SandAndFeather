const sharp=require('sharp'),fs=require('fs'),crypto=require('crypto');const R='/workspace/SandAndFeather-git/docs/art/chibi-refresh',P=R+'/sleep-front-body-v199';
for(const d of ['png','sources','checks','previews','process','review'])fs.mkdirSync(P+'/'+d,{recursive:true});
const sources={horus:'/workspace/generated_images/exec-160969bc-f44c-4b87-aa08-00c42481c66d.png'};
if(process.argv[2])sources.set=process.argv[2];
const hair=(r,g,b)=>r>g*1.22&&b>g*1.04;
(async()=>{let stats=[];for(const [who,src] of Object.entries(sources)){
fs.copyFileSync(src,P+'/sources/'+who+'-body-pair.png');
const rawGen=await sharp(src).resize(680,290).ensureAlpha().raw().toBuffer();
for(let f=0;f<2;f++){
 const gen=Buffer.from(rawGen);
 // Register the newly painted body's vertical landmarks to the 195 underdrawing.
 const map=who==='horus'?(f===0?[[350,350],[390,390],[413,420],[443,451],[451,459],[478,486],[520,524],[624,625],[640,640]]:[[350,350],[389,389],[405,407],[434,438],[444,446],[470,474],[518,521],[624,625],[640,640]]):(f===0?[[350,350],[393,393],[414,426],[444,451],[520,518],[624,619],[640,640]]:[[350,350],[392,392],[407,417],[438,440],[519,513],[624,619],[640,640]]);
 for(let yy=0;yy<290;yy++){
  const y=yy+350;let n=0;while(n<map.length-2&&y>map[n+1][0])n++;
  let sy=map[n][1]+(y-map[n][0])/(map[n+1][0]-map[n][0])*(map[n+1][1]-map[n][1])-350;
  sy=Math.max(0,Math.min(289,sy));const y0=Math.floor(sy),y1=Math.min(289,y0+1),t=sy-y0;
  for(let xx=0;xx<340;xx++)for(let c=0;c<4;c++)gen[(yy*680+f*340+xx)*4+c]=Math.round(rawGen[(y0*680+f*340+xx)*4+c]*(1-t)+rawGen[(y1*680+f*340+xx)*4+c]*t);
 }
 const ref=await sharp(R+`/sleep-set-horus-v195/png/horus-sleep-${f}.png`).ensureAlpha().raw().toBuffer();
 // Use only the underdrawing's leg/foot contour coordinates, never its colour pixels.
 const oldGen=Buffer.from(gen);
 for(let y=535;y<=624;y++){
  const yy=y-350;let sl=999,sr=-1,tl=999,tr=-1;
  for(let x=200;x<421;x++){
   const j=(yy*680+f*340+x-140)*4;
   if(oldGen[j+3]>127&&(who==='horus'||!hair(oldGen[j],oldGen[j+1],oldGen[j+2]))){sl=Math.min(sl,x);sr=Math.max(sr,x);}
   if(ref[(y*620+x)*4+3]>127){tl=Math.min(tl,x);tr=Math.max(tr,x);}
  }
  if(sr-sl<10||tr-tl<10)continue;
  const t=Math.min(1,(y-535)/10),left=sl*(1-t)+tl*t,right=sr*(1-t)+tr*t;
  for(let x=Math.ceil(left);x<=Math.floor(right);x++){
   const sx=sl+(x-left)/(right-left)*(sr-sl),x0=Math.floor(sx),x1=Math.min(479,x0+1),u=sx-x0;
   const k=(yy*680+f*340+x-140)*4,j0=(yy*680+f*340+x0-140)*4,j1=(yy*680+f*340+x1-140)*4;
   for(let c=0;c<4;c++)gen[k+c]=Math.round(oldGen[j0+c]*(1-u)+oldGen[j1+c]*u);
  }
 }
 if(who==='horus'){
  const painted=Buffer.from(gen);
  for(let y=390;y<=639;y++){
   let sl=999,sr=-1,tl=999,tr=-1;const yy=y-350;
   for(let x=140;x<480;x++){
    if(painted[(yy*680+f*340+x-140)*4+3]>127){sl=Math.min(sl,x);sr=Math.max(sr,x);}
    if(ref[(y*620+x)*4+3]>127){tl=Math.min(tl,x);tr=Math.max(tr,x);}
   }
   for(let x=140;x<480;x++){
    const k=(yy*680+f*340+x-140)*4,ri=(y*620+x)*4;
    gen[k+3]=ref[ri+3];if(ref[ri+3]===0||sr<=sl||tr<=tl)continue;
    const sx=Math.max(sl,Math.min(sr,sl+(x-tl)/(tr-tl)*(sr-sl))),x0=Math.floor(sx),x1=Math.min(sr,x0+1),t=sx-x0;
    for(let c=0;c<3;c++)gen[k+c]=Math.round(painted[(yy*680+f*340+x0-140)*4+c]*(1-t)+painted[(yy*680+f*340+x1-140)*4+c]*t);
    // Draw a new continuous dark outline along the traced guide boundary.
    let edge=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(y+dy>=390&&ref[((y+dy)*620+x+dx)*4+3]<128)edge=true;
    if(edge){gen[k]=14;gen[k+1]=2;gen[k+2]=2;}
   }
  }
 }
 const name=`${who}-sleep-${f}.png`,{data,info}=await sharp(R+'/sleep-selected-v198/png/'+name).ensureAlpha().raw().toBuffer({resolveWithObject:true}),out=Buffer.from(data),edit=new Float32Array(620*720);
 if(who==='horus'){
  for(let y=390;y<640;y++)for(let x=140;x<480;x++)edit[y*620+x]=1;
 }else{
  const core=new Uint8Array(620*720);
  for(let y=350;y<640;y++)for(let x=140;x<480;x++){
   const i=(y*620+x)*4,j=((y-350)*680+f*340+x-140)*4;
   // Keep face/ear and all head regions protected. Only body and its old occupied pixels are editable.
   const domain=(y>=395&&x>=195&&x<=465)||(y>=369&&y<427&&x>=175&&x<275)||(y>=365&&y<414&&x>=148&&x<188);
   if(!domain)continue;
   if(y<395&&x>=225)continue;
   const oldBody=data[i+3]>100&&!hair(data[i],data[i+1],data[i+2]);
   const newBody=gen[j+3]>100&&!hair(gen[j],gen[j+1],gen[j+2]);
   if(oldBody||newBody)core[y*620+x]=1;
  }
  for(let y=350;y<640;y++)for(let x=140;x<480;x++){
   let d=9;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(core[(y+dy)*620+x+dx])d=Math.min(d,Math.hypot(dx,dy));
   edit[y*620+x]=Math.max(0,Math.min(1,3-d));
   // Face and ear remain exact originals, including their contours.
   if((y<393&&x>=218)||(y<367&&x>=147&&x<=188))edit[y*620+x]=0;
  }
 }
 let count=0;
 for(let y=350;y<640;y++)for(let x=140;x<480;x++){
  const i=(y*620+x)*4,j=((y-350)*680+f*340+x-140)*4,a=edit[y*620+x];if(!a)continue;
  for(let c=0;c<4;c++)out[i+c]=Math.round(data[i+c]*(1-a)+gen[j+c]*a);
  if(out.subarray(i,i+4).compare(data.subarray(i,i+4)))count++;
 }
 await sharp(out,{raw:info}).png().toFile(P+'/png/'+name);fs.writeFileSync(P+'/checks/'+who+'-'+f+'-body-edit.mask',Buffer.from(edit.map(x=>Math.round(x*255))));
 stats.push({file:name,changedPixels:count,bodySource:'new image edit',bodyGeometryReference:'sleep-set-horus-v195/png/horus-sleep-'+f+'.png',base:'sleep-selected-v198/png/'+name,headAboveY350Unchanged:true});
}}
fs.writeFileSync(P+'/checks/body-edit.json',JSON.stringify(stats,null,2)+'\n');console.log(stats);
})();
