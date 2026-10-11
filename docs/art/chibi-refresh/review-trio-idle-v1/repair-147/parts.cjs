const s=require('sharp'),fs=require('fs');const root=require('path').resolve(__dirname,'../..'),O=root+'/review-trio-idle-v1',B=require('path').join(require('os').tmpdir(),'sandfeather-idle147-baseline'),W=360,H=400;
async function read(p){const {data,info}=await s(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});return{d:data,w:info.width,h:info.height};}
async function save(d,n){await s(d,{raw:{width:W,height:H,channels:4}}).png().toFile(O+'/native/'+n+'.png');}
function put(dst,src,x,y,sx,sy){sx=Math.floor(sx);sy=Math.floor(sy);if(sx<0||sy<0||sx>=src.w||sy>=src.h)return;let j=(sy*src.w+sx)*4,k=(y*W+x)*4;src.d.copy(dst,k,j,j+4);}
(async()=>{
// Horus: approved static input, including the previously approved Set-based body. No new art.
let a=await read(root+'/review-trio-walk-v4/idle-reference/horus-front.png'),d=Buffer.alloc(W*H*4);
for(let y=0;y<H;y++)for(let x=0;x<W;x++)put(d,a,x,y,(x+.5-180)/.5+310,(y+.5-370)/.5+662);
for(let k=0;k<d.length;k+=4)if(d[k+3]<180)d.fill(0,k,k+4);await save(d,'horus-front');
// Set: only legs, original front reference. Compact natural stance; keep hair around it.
a=await read(root+'/review-trio-walk-v4/idle-reference/set-front.png');let old=await read(B+'/set-front.png');d=Buffer.from(old.d);
for(let y=322;y<375;y++)for(let x=135;x<238;x++){let k=(y*W+x)*4;let r=d[k],g=d[k+1],b=d[k+2];if(!(d[k+3]>180&&r>g*1.3&&b>g*1.12))d.fill(0,k,k+4);}
for(let y=322;y<370;y++)for(let x=137;x<238;x++){let sx=317+(x+.5-187)/.5,sy=582+(y-322)*(652-582)/48,j=(Math.floor(sy)*a.w+Math.floor(sx))*4;let r=a.d[j],g=a.d[j+1],b=a.d[j+2];if(a.d[j+3]>180&&!(r>g*1.3&&b>g*1.12)){let dx=x+(x<187?4:-4);put(d,a,dx,y,sx,sy);d[(y*W+dx)*4+3]=255;}}

// Discard isolated source matte specks, retaining the connected character outline.
let seen=new Uint8Array(W*H);for(let p=0;p<W*H;p++){if(seen[p]||d[p*4+3]<180)continue;let q=[p];seen[p]=1;for(let z=0;z<q.length;z++){let t=q[z],x=t%W,y=Math.floor(t/W);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let xx=x+dx,yy=y+dy,k=yy*W+xx;if(xx>=0&&xx<W&&yy>=0&&yy<H&&!seen[k]&&d[k*4+3]>=180){seen[k]=1;q.push(k);}}}if(q.length<65&&q.every(t=>Math.floor(t/W)>=322))for(let t of q)d.fill(0,t*4,t*4+4);}
await save(d,'set-front');
// Somang: actual original straight-legged reference; reduced calf width and a smaller stance.
a=await read(root+'/review-trio-walk-v4/idle-reference/somang-front.png');old=await read(B+'/somang-front.png');d=Buffer.from(old.d);
for(let y=334;y<375;y++)for(let x=132;x<229;x++)d.fill(0,(y*W+x)*4,(y*W+x)*4+4);
for(let y=334;y<370;y++)for(let x=139;x<226;x++){
 let srcCenter=x<181?259:369,dstCenter=x<181?162:200;
 let sx=srcCenter+(x+.5-dstCenter)/.42,sy=602+(y-334)*(662-602)/36;
 if((x<181&&sx>=306)||(x>=181&&sx<322))continue;
 put(d,a,x,y,sx,sy);
}
await save(d,'somang-front');
// Backs: preserve the existing rear leg drawing; separate feet by six pixels, not a wide stance.
for(const who of ['set','horus']){let n=who+'-back',o=await read(B+'/'+n+'.png');d=Buffer.from(o.d);let top=who==='set'?318:314,cx=who==='set'?177:177;
for(let y=top;y<375;y++)for(let x=132;x<225;x++){let k=(y*W+x)*4,r=d[k],g=d[k+1],b=d[k+2];if(!(who==='set'&&r>g*1.3&&b>g*1.12))d.fill(0,k,k+4);}
for(let y=top;y<371;y++)for(let x=134;x<220;x++){let sx=x+(x<cx?3:-3);if(x>=cx-3&&x<cx+3)continue;if((x<cx&&sx>=cx)||(x>=cx&&sx<cx))continue;let j=(y*W+sx)*4,r=o.d[j],g=o.d[j+1],b=o.d[j+2];if(o.d[j+3]&&!(who==='set'&&r>g*1.3&&b>g*1.12))put(d,o,x,y,sx,y);}
await save(d,n);}

// Close only the cut-out seam holes in Somang's copied hair/body junctions.
function inside(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){let [a,b]=p[i],[c,e]=p[j];if((b>y)!==(e>y)&&x<(c-a)*(y-b)/(e-b)+a)yes=!yes;}return yes;}
const masks={left:[[[133,229],[146,227],[150,245],[134,246]]],right:[[[222,225],[230,229],[238,245],[225,246]]],back:[[[119,244],[132,244],[132,255],[119,255]],[[233,243],[246,243],[246,257],[233,257]]]};
for(const [dir,polys]of Object.entries(masks)){let o=await read(B+'/somang-'+dir+'.png');d=Buffer.from(o.d);for(let y=220;y<260;y++)for(let x=115;x<250;x++){let k=(y*W+x)*4;if(d[k+3]>230||!polys.some(p=>inside(x+.5,y+.5,p)))continue;let best=null,dist=1e9;for(let yy=y-12;yy<=y+4;yy++)for(let xx=x-12;xx<=x+12;xx++){let j=(yy*W+xx)*4,r=o.d[j],g=o.d[j+1],b=o.d[j+2];if(o.d[j+3]>230&&r>25&&r<110&&g<85&&b<80){let dd=(x-xx)**2+(y-yy)**2;if(dd<dist){best=j;dist=dd;}}}if(best!==null)o.d.copy(d,k,best,best+4);}await save(d,'somang-'+dir);}
})();
