const sharp=require('sharp'),fs=require('fs'),crypto=require('crypto');const R='/workspace/SandAndFeather-git/docs/art/chibi-refresh',P=R+'/sleep-selected-v198';
(async()=>{
 const generated='/workspace/generated_images/exec-3ba8de89-1fb4-4381-88e9-a4dffe16ae1e.png';fs.copyFileSync(generated,P+'/sources/set-arm-local-edit.png');
 const patch=await sharp(generated).resize(230,175).ensureAlpha().raw().toBuffer();
 const svg=Buffer.from('<svg width="620" height="720"><path d="M112 334 L144 326 L149 328 L147 339 L150 352 L158 361 L168 366 L184 368 L186 416 L170 419 L145 405 L118 381 L111 360 Z" fill="white"/></svg>');
 const mask=await sharp(svg).ensureAlpha().raw().toBuffer();let stats=[];
 for(let f=0;f<2;f++){
 const src=R+`/sleep-set-horus-v197/png/set-sleep-${f}.png`,{data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true}),out=Buffer.from(data);let count=0;
 for(let y=326;y<420;y++)for(let x=111;x<187;x++){
  const i=(y*620+x)*4,a=mask[i+3]/255;if(!a)continue;
  const j=((y-290)*230+x-70)*4;
  // The revised crop is applied solely within the exposed raised-arm region.
  for(let c=0;c<3;c++)out[i+c]=Math.round(data[i+c]*(1-a)+patch[j+c]*a); out[i+3]=data[i+3];
  if(out.subarray(i,i+4).compare(data.subarray(i,i+4)))count++;
 }
 const name=`set-sleep-${f}.png`;await sharp(out,{raw:info}).png().toFile(P+'/png/'+name);stats.push({file:name,changedPixels:count,editBounds:[111,326,187,420],outsideEditUnchanged:true,description:'Elbow moved inward below ear; shortened forearm and cuff; hair restored behind old extended arm. Face/ear/front hair lock/torso/legs unchanged.'});
 }
 let m=JSON.parse(fs.readFileSync(P+'/manifest.json'));for(let a of m.files){a.sha256=crypto.createHash('sha256').update(fs.readFileSync(P+'/'+a.path)).digest('hex');if(a.character==='set'&&a.direction==='front'){a.status='awaiting-user-review';a.artApproved=false;a.runtimeEligible=false;a.edit='raised screen-left arm shortened locally';}}
 fs.writeFileSync(P+'/manifest.json',JSON.stringify(m,null,2)+'\n');fs.writeFileSync(P+'/checks/set-arm-only.json',JSON.stringify(stats,null,2)+'\n');console.log(stats);
})();
