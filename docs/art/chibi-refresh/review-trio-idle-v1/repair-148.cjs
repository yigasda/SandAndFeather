const s=require('sharp'),fs=require('fs'),O=__dirname,B=require('path').join(require('os').tmpdir(),'sandfeather-idle146-original'),W=360,H=400;
const read=p=>s(p).ensureAlpha().raw().toBuffer(),save=(d,n)=>s(d,{raw:{width:W,height:H,channels:4}}).png().toFile(O+'/native/'+n+'.png');
function inside(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){let[a,b]=p[i],[c,e]=p[j];if((b>y)!==(e>y)&&x<(c-a)*(y-b)/(e-b)+a)yes=!yes;}return yes;}
(async()=>{
fs.mkdirSync(B,{recursive:true});const cp=require('child_process'),path=require('path');for(const who of ['set','somang','horus'])for(const dir of ['front','back','left','right']){const name=who+'-'+dir+'.png';fs.writeFileSync(B+'/'+name,cp.execFileSync('git',['show','5c0987c2a4c4e72144d7022d4de9af66596c1d0d:docs/art/chibi-refresh/review-trio-idle-v1/native/'+name],{cwd:path.resolve(O,'../../../..'),maxBuffer:8*1024*1024}));}

for(const n of fs.readdirSync(B))if(n.endsWith('.png'))fs.copyFileSync(B+'/'+n,O+'/native/'+n);
// Original complete legs, translated as intact pieces; no reference body collage.
for(const [name,top,cx,l,r] of [['set-front',322,187,149,225],['set-back',318,177,141,214],['horus-front',320,176,137,215],['horus-back',314,177,138,216]]){
const a=await read(B+'/'+name+'.png'),d=Buffer.from(a);
for(let y=top;y<373;y++)for(let x=l-3;x<r+3;x++)d.fill(0,(y*W+x)*4,(y*W+x)*4+4);
for(let y=top;y<373;y++)for(let x=l;x<r;x++){let k=(y*W+x)*4,dx=x+(x<cx?-3:3);a.copy(d,(y*W+dx)*4,k,k+4);}
await save(d,name);}
// Somang's own intact legs/shoes, slimmer and closer together. Preserve the hem over them.
let a=await read(B+'/somang-front.png'),d=Buffer.from(a);
const legMask=new Uint8Array(W*H);
for(let x=133;x<229;x++){
 let lastCloth=323;
 for(let y=318;y<=330;y++){let k=(y*W+x)*4;if(a[k+3]>180&&a[k]>145&&a[k]-a[k+1]<30&&a[k+1]-a[k+2]<30)lastCloth=y;}
 let skinStart=lastCloth+3;
 for(let y=skinStart;y<373;y++){let k=(y*W+x)*4;legMask[y*W+x]=1;d.fill(0,k,k+4);}
}
for(let y=324;y<373;y++)for(let x=134;x<228;x++){
 const left=x<181,cx0=left?156:205,cx1=left?162:199,sx=Math.round(cx0+(x-cx1)/.80);
 if(sx<133||sx>=229||!legMask[y*W+sx])continue;
 let j=(y*W+sx)*4,k=(y*W+x)*4;if(a[j+3]&&legMask[y*W+x])a.copy(d,k,j,j+4);
}
// Remove two residual outline stubs left outside the slimmer calves.
for(const [l,r,y] of [[144,147,330],[213,218,330]])for(let x=l;x<r;x++)d.fill(0,(y*W+x)*4,(y*W+x)*4+4);
await save(d,'somang-front');
// Fill the actual long split behind each sleeve, between the hair and upper body.
for(const [dir,poly,shift] of [
 ['left',[[179,226],[191,229],[219,262],[208,267],[191,273],[181,245]],24],
 ['right',[[180,224],[167,229],[145,263],[153,272],[174,272],[181,242]],-24]
]){a=await read(B+'/somang-'+dir+'.png');d=Buffer.from(a);
for(let y=224;y<270;y++)for(let x=130;x<241;x++){let neck=dir==='left'?[[133,229],[146,227],[150,245],[134,246]]:[[222,225],[230,229],[238,245],[225,246]];if(!inside(x+.5,y+.5,poly)&&!inside(x+.5,y+.5,neck))continue;let k=(y*W+x)*4;
 if(a[k+3]>230)continue;
 let sx=x+shift,sy=y,j=(sy*W+sx)*4;
 if(!(a[j+3]>230&&a[j]<170&&a[j+1]<140)){
  let score=1e9;for(let yy=y-15;yy<=y;yy++)for(let xx=x-30;xx<x+31;xx++){let t=(yy*W+xx)*4;if(a[t+3]>230&&a[t]>25&&a[t]<140&&a[t+1]<110&&a[t+2]<105){let dd=(xx-x-shift/2)**2+(yy-y)**2;if(dd<score){score=dd;j=t;}}}
 }
 if(a[j+3])a.copy(d,k,j,j+4);
}
await save(d,'somang-'+dir);}
require('child_process').execFileSync(process.execPath,[O+'/finish-148.cjs'],{stdio:'inherit'});
})();
