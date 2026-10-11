const sharp=require('sharp'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const O=__dirname,P=path.dirname(O),ROOT=path.resolve(O,'../../../..'),W=360,H=400,dirs=['front','back','left','right'],chars=['set','somang','horus'];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function read(p){return sharp(p).ensureAlpha().raw().toBuffer();}
function bounds(d,w,h){let b=[w,h,0,0];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>128)b=[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x+1),Math.max(b[3],y+1)];return b;}
function components(d){let seen=new Uint8Array(W*H),comps=[];for(let p=0;p<W*H;p++)if(d[p*4+3]>128&&!seen[p]){let q=[p];seen[p]=1;for(let z=0;z<q.length;z++){let n=q[z],x=n%W,y=Math.floor(n/W);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let xx=x+dx,yy=y+dy,t=yy*W+xx;if(xx>=0&&xx<W&&yy>=0&&yy<H&&!seen[t]&&d[t*4+3]>128){seen[t]=1;q.push(t);}}}comps.push(q);}return comps;}
(async()=>{const assembly=JSON.parse(fs.readFileSync(O+'/assembly.json')),frames=[],checks=[];
for(const who of chars)for(const dir of dirs){let name=who+'-'+dir,src=P+'/review-trio-walk-v5/walk/'+name+'-1.png',sp=O+'/native/'+name+'.png',a=await read(src),d=await read(sp),cut=({ 'set-front':322,'set-back':318,'somang-front':324,'somang-back':400,'somang-left':224,'somang-right':224,'horus-front':320,'horus-back':314 }[name]??400),removed=0;
 let recolored=0; a=await read(require('path').join(require('os').tmpdir(),'sandfeather-idle146-original',name+'.png'));
 let protectedChanged=0;for(let k=0;k<cut*W*4;k+=4)if(!d.subarray(k,k+4).equals(a.subarray(k,k+4)))protectedChanged++;
 if(protectedChanged)throw Error(name+' protected pixels changed');
 await sharp(d,{raw:{width:W,height:H,channels:4}}).png().toFile(sp);
 // Common scale preserves the wide Set hair without clipping or changing width.
 // (576/330) * 330 = 576 reference visible height. Use this metadata, not the old 628.
 const scale=576/330,cw=620,ch=720,dst=Buffer.alloc(cw*ch*4);
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){let sx=Math.floor((x+.5-310)/scale+180),sy=Math.floor((y+.5-662)/scale+370);if(sx>=0&&sx<W&&sy>=0&&sy<H)d.copy(dst,(y*cw+x)*4,(sy*W+sx)*4,(sy*W+sx)*4+4);}
 const target=O+'/idle/'+name+'.png';await sharp(dst,{raw:{width:cw,height:ch,channels:4}}).png().toFile(target);
 const b=bounds(dst,cw,ch),nativeBounds=bounds(d,W,H);
 const check={name,protectedNativeRect:[0,0,W,cut],protectedChangedPixels:protectedChanged,removedDetachedPixels:removed,recoloredToApprovedPalette:recolored,nativeBounds,alphaBounds:b,clipping:false};
 if((nativeBounds[0]-180)*scale+310<0||(nativeBounds[2]-180)*scale+310>cw)throw Error(name+' clipping');checks.push(check);
 frames.push({id:who+'.idle.'+({front:'down',back:'up',left:'left',right:'right'}[dir]),character:who,state:'idle',sourceView:dir,gameDirection:{front:'down',back:'up',left:'left',right:'right'}[dir],path:path.relative(ROOT,target),size:[cw,ch],rect:[0,0,cw,ch],pivot:[310,662],referenceVisibleHeight:576,alphaBounds:b,sha256:hash(target),nativePath:path.relative(ROOT,sp),nativeSize:[W,H],nativePivot:[180,370],nativeReferenceVisibleHeight:330,reference:path.relative(ROOT,src),approvalStatus:'review-pending'});
}
const wm=JSON.parse(fs.readFileSync(P+'/review-trio-walk-v5/manifest.json')),sourceChecks=wm.frames.map(f=>({path:f.path,unchanged:hash(ROOT+'/'+f.path)===f.sha256}));if(sourceChecks.some(c=>!c.unchanged))throw Error('Approved walk modified');
fs.writeFileSync(O+'/manifest.json',JSON.stringify({schemaVersion:1,status:'twelve-idle-review-awaiting-user-selection',runtimeEligible:false,idleFrameCount:12,referenceWalkManifest:'docs/art/chibi-refresh/review-trio-walk-v5/manifest.json',sampling:'nearest',sourceToDelivery:{scale:576/330,sourcePivot:[180,370],deliveryPivot:[310,662],referenceVisibleHeight:576,reason:'Use uniform 576/330 scale for all twelve to retain full approved Set hair in 620x720. Do not assume legacy 628.'},frames},null,2)+'\n');
fs.writeFileSync(O+'/validation.json',JSON.stringify({revision:148,rejectedRevision:147,horusRollback:{sourceCommit:'5c0987c',faceTranslation:[0,0],headAndBodyRescaled:false},idleCount:frames.length,approvedWalkHashes:sourceChecks,runtimeModified:false,frames:checks},null,2)+'\n');
for(const who of chars)for(const [bgname,bg] of [['light','#f5efe3'],['dark','#253041']]){
const layers=[];for(let i=0;i<4;i++)layers.push({input:O+'/native/'+who+'-'+dirs[i]+'.png',left:i*W,top:0});await sharp({create:{width:W*4,height:H,channels:4,background:bg}}).composite(layers).png().toFile(O+'/previews/'+who+'-idle-'+bgname+'.png');
const comparisons=[];for(let i=0;i<4;i++){comparisons.push({input:P+'/review-trio-walk-v5/walk/'+who+'-'+dirs[i]+'-1.png',left:i*W,top:0},{input:O+'/native/'+who+'-'+dirs[i]+'.png',left:i*W,top:H});}
await sharp({create:{width:W*4,height:H*2,channels:4,background:bg}}).composite(comparisons).png().toFile(O+'/previews/'+who+'-walk-idle-'+bgname+'.png');
const joints=[];for(let i=0;i<4;i++){let b=await sharp(O+'/native/'+who+'-'+dirs[i]+'.png').extract({left:85,top:215,width:205,height:165}).resize(615,495,{kernel:'nearest'}).png().toBuffer();joints.push({input:b,left:(i%2)*615,top:Math.floor(i/2)*495});}
await sharp({create:{width:1230,height:990,channels:4,background:bg}}).composite(joints).png().toFile(O+'/previews/'+who+'-joints-'+bgname+'.png');
}
const title=Buffer.from('<svg width="1440" height="50"><rect width="1440" height="50" fill="#f5efe3"/><g fill="#483c35" font-family="sans-serif" font-size="23"><text x="135" y="33">FRONT</text><text x="505" y="33">BACK</text><text x="863" y="33">LEFT</text><text x="1220" y="33">RIGHT</text></g></svg>');
let layers=[{input:title,left:0,top:0}];for(let j=0;j<3;j++)layers.push({input:O+'/previews/'+chars[j]+'-idle-light.png',left:0,top:50+j*400});await sharp({create:{width:1440,height:1250,channels:4,background:'#f5efe3'}}).composite(layers).png().toFile(O+'/previews/148-trio-idle-12-review.png');
// Comparison animation: new idle held, then the unmodified approved walk cycle.
for(const who of chars){let pages=[];for(const phase of ['idle',0,1,2,1]){let l=[];for(let i=0;i<4;i++){let p=phase==='idle'?O+'/native/'+who+'-'+dirs[i]+'.png':P+'/review-trio-walk-v5/walk/'+who+'-'+dirs[i]+'-'+phase+'.png';let input=p;if(who==='horus'&&i===0&&phase!=='idle'){const off=phase===0?[1,0]:phase===2?[-1,0]:[0,-1];const padded=await sharp(p).extend({top:1,bottom:1,left:1,right:1,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();input=await sharp(padded).extract({left:1-off[0],top:1-off[1],width:360,height:400}).png().toBuffer();}l.push({input,left:i*W,top:0});}pages.push(await sharp({create:{width:1440,height:400,channels:4,background:'#f5efe3'}}).composite(l).raw().toBuffer());}
await sharp(Buffer.concat(pages),{raw:{width:1440,height:2000,channels:4,pageHeight:400}}).gif({delay:[1000,180,180,180,180],loop:0,effort:7}).toFile(O+'/previews/148-'+who+'-idle-walk-check.gif');}
fs.mkdirSync(O+'/sheets',{recursive:true});
for(const who of chars){const ls=dirs.map((dir,i)=>({input:O+'/idle/'+who+'-'+dir+'.png',left:i*620,top:0}));await sharp({create:{width:2480,height:720,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(ls).png().toFile(O+'/sheets/'+who+'-idle.png');}
let combined=[];for(let i=0;i<5;i++){let ls=[];for(let j=0;j<3;j++){let pg=await sharp(O+'/previews/148-'+chars[j]+'-idle-walk-check.gif',{page:i}).png().toBuffer();ls.push({input:pg,left:0,top:j*400});}combined.push(await sharp({create:{width:1440,height:1200,channels:4,background:'#f5efe3'}}).composite(ls).raw().toBuffer());}
await sharp(Buffer.concat(combined),{raw:{width:1440,height:6000,channels:4,pageHeight:1200}}).gif({delay:[1000,180,180,180,180],loop:0,effort:7}).toFile(O+'/previews/148-trio-idle-walk-check.gif');
console.log(JSON.stringify({idleCount:12,protectedPixelsChanged:checks.reduce((a,c)=>a+c.protectedChangedPixels,0),walkUnchanged:sourceChecks.length,referenceVisibleHeight:576}));
})();
