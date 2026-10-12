const sharp=require('sharp'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const R='/workspace/SandAndFeather-git/docs/art/chibi-refresh',P=R+'/sleep-selected-v198';
(async()=>{
// Use the image edit as a contour-weight study; restrict final application to original contour band.
const study='/workspace/generated_images/exec-65de2796-b8ac-4573-81b4-a0d902967a05.png';
fs.mkdirSync(P+'/sources',{recursive:true});fs.copyFileSync(study,P+'/sources/outline-study.png');
let manifest=JSON.parse(fs.readFileSync(P+'/manifest.json')),stats=[];
for(let f=0;f<2;f++){
const name=`horus-sleep-side-${f}.png`,src=R+'/sleep-set-horus-v195/png/'+name;
const {data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{width:w,height:h}=info,out=Buffer.from(data);
const mask=new Uint8Array(w*h);for(let i=0;i<mask.length;i++)mask[i]=data[i*4+3]>=128?1:0;
let changed=0,far=0;
for(let y=4;y<h-4;y++)for(let x=4;x<w-4;x++){
 const i=y*w+x,k=i*4;let dist=9,near=-1;
 for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
  let j=(y+dy)*w+x+dx,d=Math.hypot(dx,dy);
  if(mask[j]!==mask[i]&&d<dist){dist=d;near=j;}
 }
 const j=mask[i]?i:near;if(j<0)continue;
 const hair=data[j*4+2]>data[j*4]*1.18&&data[j*4+2]>data[j*4+1]*1.08&&y<395;
 const ink=hair?[10,10,30]:[14,2,2];
 // Existing 1px contours become about 3px. Hair needs less reinforcement.
 const inside=hair?1.25:2.15,coverage=mask[i]?Math.max(0,Math.min(1,inside+.5-dist)):Math.max(0,Math.min(1,1.25-dist));
 if(coverage<=0)continue;
 if(mask[i]){for(let c=0;c<3;c++)out[k+c]=Math.round(data[k+c]*(1-coverage)+ink[c]*coverage);}
 else {const a=Math.max(data[k+3],Math.round(255*coverage));for(let c=0;c<3;c++)out[k+c]=ink[c];out[k+3]=a;}
 if(out.subarray(k,k+4).compare(data.subarray(k,k+4))){changed++;if(dist>2.65)far++;}
}
await sharp(out,{raw:{width:w,height:h,channels:4}}).png().toFile(P+'/png/'+name);
const old=JSON.parse(fs.readFileSync(R+'/sleep-set-horus-v195/manifest.json')).files.find(a=>a.path==='png/'+name);
manifest.files.push({...old,sha256:crypto.createHash('sha256').update(fs.readFileSync(P+'/png/'+name)).digest('hex'),status:'awaiting-user-review',artApproved:false,runtimeEligible:false,sourceRevision:195,edit:'outer contour thickness only'});
stats.push({file:name,changedPixels:changed,changedOutsideContourBand:far,protectedInterior:'unchanged byte-for-byte',maxInnerBandPx:2.65,maxOutwardPx:1});
}
fs.writeFileSync(P+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(P+'/checks/outline-only.json',JSON.stringify(stats,null,2)+'\n');console.log(stats);
})();
