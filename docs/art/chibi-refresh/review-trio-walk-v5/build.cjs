const sharp=require('sharp'),fs=require('fs'),path=require('path');
const O=__dirname,P=path.dirname(O),W=360,H=400;
const refs=JSON.parse(fs.readFileSync(path.join(P,'walk-analysis/analysis.json')));
const dirs=['front','back','left','right'];
function rgba(d,w,h){return {data:d,w,h};}
async function read(p){const {data,info}=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});return rgba(data,info.width,info.height);}
function box(a){let x0=a.w,y0=a.h,x1=0,y1=0;for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++)if(a.data[(y*a.w+x)*4+3]>128){x0=Math.min(x0,x);x1=Math.max(x1,x+1);y0=Math.min(y0,y);y1=Math.max(y1,y+1);}return [x0,y0,x1,y1];}
function skin(r,g,b){let mx=Math.max(r,g,b),mn=Math.min(r,g,b);return r>205&&g>145&&b>115&&r>g&&g>=b&&(mx-mn)/mx>.12&&(mx-mn)/mx<.48;}
function hair(r,g,b,who){if(who==='horus')return b>r*1.16&&b>g*1.05&&r<155;if(who==='set')return r>45&&r>g*1.35&&b>g*1.25&&r<215;return r>g*1.10&&g>b*.99&&r<184&&r>23;}
function hairMask(a,who){let m=new Uint8Array(a.w*a.h),core=new Uint8Array(m.length),b=box(a);
 for(let y=0;y<b[3]-(who==='set'?.06:.14)*(b[3]-b[1]);y++)for(let x=0;x<a.w;x++){let p=y*a.w+x,k=p*4;if(a.data[k+3]&&hair(...a.data.subarray(k,k+3),who))core[p]=m[p]=1;}
 for(let y=1;y<a.h-1;y++)for(let x=1;x<a.w-1;x++){let p=y*a.w+x,k=p*4;if(!a.data[k+3]||Math.max(...a.data.subarray(k,k+3))>85)continue;for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){let q=(y+yy)*a.w+x+xx;if(q>=0&&q<core.length&&core[q])m[p]=1;}}
 return m;}
function bodyMask(a,who,cut,remove=false){
 let m=new Uint8Array(a.w*a.h),b=box(a),height=b[3]-b[1];
 let hairEnd=who==='set'?b[3]-.15*height:cut+.095*height;
 let bx=[];for(let y=Math.ceil(cut);y<a.h;y++)for(let x=0;x<a.w;x++){let k=(y*a.w+x)*4;if(a.data[k+3]&&skin(...a.data.subarray(k,k+3)))bx.push(x);}
 let center=bx.reduce((v,x)=>v+x,0)/bx.length||a.w/2;
 for(let y=Math.ceil(cut);y<a.h;y++){
  let lo=a.w,hi=-1;
  for(let x=0;x<a.w;x++){
   let k=(y*a.w+x)*4,r=a.data[k],g=a.data[k+1],bb=a.data[k+2];if(!a.data[k+3])continue;
   let skinSeed=skin(r,g,bb),white=r>135&&g>125&&bb>110&&Math.max(r,g,bb)-Math.min(r,g,bb)<45;
   let gold=r>100&&r>g*1.15&&g>bb*1.6;
   let skirt=who==='set'&&r>30&&r<100&&Math.max(r,g,bb)-Math.min(r,g,bb)<14;
   if((y>hairEnd&&r>25&&r>g*1.45&&bb<g*.90&&Math.abs(x-center)<a.w*.25)||skinSeed||white||gold||skirt){lo=Math.min(lo,x);hi=Math.max(hi,x);}
  }
  if(hi>=lo)for(let x=Math.max(0,lo-2);x<=Math.min(a.w-1,hi+2);x++)m[y*a.w+x]=1;
 }
 if(remove){let d=m.slice();for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++)if(m[y*a.w+x])for(let dy=-3;dy<=3;dy++)for(let dx=-2;dx<=2;dx++){let xx=x+dx,yy=y+dy;if(xx>=0&&xx<a.w&&yy>=cut&&yy<a.h)d[yy*a.w+xx]=1;}return d;}
 return m;
}
function largest(mask,w,h){let seen=new Uint8Array(w*h),best=[];for(let n=0;n<mask.length;n++){if(!mask[n]||seen[n])continue;let q=[n];seen[n]=1;for(let k=0;k<q.length;k++){let p=q[k],x=p%w,y=Math.floor(p/w);for(let t of [x? p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(t>=0&&mask[t]&&!seen[t]){seen[t]=1;q.push(t);}}if(q.length>best.length)best=q;}return best;}
function faceInfo(a){let b=box(a),m=new Uint8Array(a.w*a.h);for(let y=b[1];y<b[1]+(b[3]-b[1])*.63;y++)for(let x=0;x<a.w;x++){let p=y*a.w+x,k=p*4;if(a.data[k+3]>128&&skin(...a.data.subarray(k,k+3)))m[p]=1;}let pts=largest(m,a.w,a.h),xs=pts.map(p=>p%a.w),ys=pts.map(p=>Math.floor(p/a.w));return {cx:xs.reduce((s,v)=>s+v,0)/xs.length,cy:ys.reduce((s,v)=>s+v,0)/ys.length,bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],bottom:Math.max(...ys)+3};}
function neck(a,who,dir){if(dir!=='back')return faceInfo(a).bottom;let b=box(a);for(let y=Math.round(b[1]+(b[3]-b[1])*.43);y<b[3];y++){let n=0;for(let x=Math.round(a.w*.30);x<a.w*.70;x++){let k=(y*a.w+x)*4,r=a.data[k],g=a.data[k+1],bb=a.data[k+2];if(a.data[k+3]>128&&r>105&&r>g*1.15&&g>bb*1.3)n++;}if(n>10)return y;}return b[1]+(b[3]-b[1])*.55;}
function clean(a){for(let k=0;k<a.data.length;k+=4){if(a.data[k+3]<128)a.data.fill(0,k,k+4);else a.data[k+3]=255;}
 let m=new Uint8Array(a.w*a.h);for(let p=0;p<m.length;p++)m[p]=a.data[p*4+3]>0;
 let keep=new Uint8Array(m.length);for(let p of largest(m,a.w,a.h))keep[p]=1;
 for(let p=0;p<m.length;p++)if(!keep[p])a.data.fill(0,p*4,p*4+4);
 return a;}
function overlay(dst,src,dx=0,dy=0,mask=null){for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){let xx=x+dx,yy=y+dy;if(xx<0||xx>=dst.w||yy<0||yy>=dst.h)continue;let p=y*src.w+x,k=p*4;if(src.data[k+3]&&(!mask||mask[p]))src.data.copy(dst.data,(yy*dst.w+xx)*4,k,k+4);}}
async function save(a,p){await sharp(a.data,{raw:{width:a.w,height:a.h,channels:4}}).png().toFile(p);}
(async()=>{
let report=fs.existsSync(path.join(O,'assembly.json'))?JSON.parse(fs.readFileSync(path.join(O,'assembly.json'))):{};for(const who of (process.argv.slice(2).length?process.argv.slice(2):['horus','set','somang'])){
 const sp=path.join(O,`sources/${who}.png`);if(!fs.existsSync(sp))continue;
 const meta=await sharp(sp).metadata();
 for(let row=0;row<4;row++){
  const dir=dirs[row],reference=refs[`${who}-${dir}`],curr=[],gen=[];
  for(let i=0;i<3;i++){
   curr.push(await read(path.join(P,`review-trio-walk-v4/walk/${who}-${dir}-${i}.png`)));
   let left=Math.round(i*meta.width/3),right=Math.round((i+1)*meta.width/3),top=Math.round(row*meta.height/4),bottom=Math.round((row+1)*meta.height/4);
   const {data,info}=await sharp(sp).extract({left,top,width:right-left,height:bottom-top}).ensureAlpha().raw().toBuffer({resolveWithObject:true});gen.push(clean(rgba(data,info.width,info.height)));
  }
  let cb=box(curr[1]),cn=Math.round(neck(curr[1],who,dir)),gb=box(gen[1]),gn=neck(gen[1],who,dir);
  let factor=who==='horus'?.95:1;
  let targetTop=cn-(cn-cb[1])*factor,sc=(cn-targetTop)/(gn-gb[1]);
  let cfi=dir==='back'?{cx:reference.frames[1].hair.cx}:faceInfo(curr[1]);
  // Set's old head was left of its chest. Align the neutral face to the current chest.
  let anchor=cfi.cx;
  if(who==='set'&&dir==='front')anchor+=6;
  if(who==='horus'&&dir==='front')anchor+=4;
  if(who==='set'&&dir==='left')anchor-=5;
  if(who==='set'&&dir==='right')anchor+=2;
  if(who==='somang'&&dir==='right')anchor+=5;
  for(let i=0;i<3;i++){
   let g=gen[i],b=box(g),ni=neck(g,who,dir),fi=dir==='back'?{cx:(b[0]+b[2])/2}:faceInfo(g);
   let mot=i===1?{topDy:0,faceCX:0,hairCX:0}:reference.motion[String(i)];
   let desiredTop=Math.round(targetTop+mot.topDy*factor),nheight=cn-desiredTop;
   // Common head width; per-pose vertical fitting anchors chin and measured crown.
   let sx=sc*(who==='set'&&dir==='left'?.96:1)*(who==='somang'&&dir==='back'&&i===2?.98:1)*(who==='somang'&&dir==='right'&&i===2?1.024:1),sy=nheight/(ni-b[1]),out=rgba(Buffer.alloc(W*H*4),W,H);
   let desiredCX=anchor+(dir==='back'?mot.hairCX:mot.faceCX)*factor;
   if(who==='set'&&dir==='back'&&i===0)desiredCX+=3;
   let dx=desiredCX-fi.cx*sx,dy=desiredTop-b[1]*sy;
   let gbm=bodyMask(g,who,ni,true);
   let head=rgba(Buffer.alloc(W*H*4),W,H);
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    let hairBend=(who==='horus'&&dir==='front'&&i===0)?3*Math.max(0,Math.min(1,(178-y)/55)):0;
    if(who==='set'&&dir==='right'&&i!==1){let bb=fi.bounds,dist=Math.hypot(Math.max(bb[0]*sx+dx-x,0,x-bb[2]*sx-dx),Math.max(bb[1]*sy+dy-y,0,y-bb[3]*sy-dy));hairBend=(i===0?-5:-3.5)*Math.min(1,dist/30);}
    let faceDip=(who==='somang'&&dir==='right'&&i===2)?3.5*Math.max(0,1-Math.abs(y-(fi.cy*sy+dy))/40):0;
    let yy=(y-dy-faceDip)/sy,xx=(x-dx-hairBend)/sx,ix=Math.round(xx),iy=Math.round(yy);
    if(ix<0||ix>=g.w||iy<0||iy>=g.h)continue;
    let k=(iy*g.w+ix)*4;
    let allow=iy<ni;
    if(!allow&&who!=='horus')allow=!gbm[iy*g.w+ix];
    if(allow&&g.data[k+3])g.data.copy(head.data,(y*W+x)*4,k,k+4);
   }
   let old=curr[i],bm=bodyMask(old,who,cn,true);
   if(who==='horus')for(let y=cn;y<H;y++)for(let x=0;x<W;x++)bm[y*W+x]=1;
   // Hair behind body, then all surviving original body pixels, then the upper face/hair.
   if(who==='set'){
    // Restore the existing hair immediately behind the preserved body. The
    // generated body cutout is wider than the retained body in a few poses;
    // leaving that region empty exposes the preview background as a halo.
    let under=new Uint8Array(W*H);
    for(let y=cn;y<H;y++)for(let x=0;x<W;x++)if(bm[y*W+x]&&old.data[(y*W+x)*4+3]){
     for(let yy=Math.max(cn,y-8);yy<=Math.min(H-1,y+8);yy++)for(let xx=Math.max(0,x-8);xx<=Math.min(W-1,x+8);xx++)under[yy*W+xx]=1;
    }
    overlay(out,old,0,0,under);
   }
   overlay(out,head);overlay(out,old,0,0,bm);
   let upper=new Uint8Array(W*H);upper.fill(1,0,cn*W);overlay(out,head,0,0,upper);
   if(who==='set'){
    // Fill enclosed, small cutout holes at the neck using adjacent actual hair
    // colors. Natural open spaces between locks and below the feet stay clear.
    let seen=new Uint8Array(W*H);
    for(let p=0;p<W*H;p++)if(!seen[p]&&!out.data[p*4+3]){
     let q=[p],edge=false;seen[p]=1;
     for(let z=0;z<q.length;z++){let t=q[z],x=t%W,y=Math.floor(t/W);if(x===0||y===0||x===W-1||y===H-1)edge=true;
      for(let n of [x?t-1:-1,x<W-1?t+1:-1,y?t-W:-1,y<H-1?t+W:-1])if(n>=0&&!seen[n]&&!out.data[n*4+3]){seen[n]=1;q.push(n);}}
     if(edge||q.length>150||!q.every(t=>t%W>80&&t%W<280&&Math.floor(t/W)>=cn-2&&Math.floor(t/W)<cn+45))continue;
     for(let t of q){let x=t%W,y=Math.floor(t/W),best=-1,bd=1e9;for(let yy=Math.max(0,y-16);yy<=Math.min(H-1,y+16);yy++)for(let xx=Math.max(0,x-16);xx<=Math.min(W-1,x+16);xx++){let k=(yy*W+xx)*4,dist=(xx-x)**2+(yy-y)**2;if(out.data[k+3]&&hair(...out.data.subarray(k,k+3),'set')&&dist<bd){best=k;bd=dist;}}if(best>=0)out.data.copy(out.data,t*4,best,best+4);}
    }
   }
   await save(out,path.join(O,`walk/${who}-${dir}-${i}.png`));
   report[`${who}-${dir}-${i}`]={currentNeck:cn,generatedNeck:ni,scaleX:sx,scaleY:sy,headTop:desiredTop,faceAnchor:desiredCX,originalMotion:mot};
  }
 }
}
fs.writeFileSync(path.join(O,'assembly.json'),JSON.stringify(report,null,2));
})();
