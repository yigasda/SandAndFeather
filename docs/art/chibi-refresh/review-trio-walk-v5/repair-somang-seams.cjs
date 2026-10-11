const s=require('sharp'),fs=require('fs'),path=require('path'),W=360,H=400;
const source=process.argv[2]||path.join(__dirname,'walk'),output=process.argv[3]||path.join(__dirname,'walk'),audit=path.join(__dirname,'seam-repair');fs.mkdirSync(audit,{recursive:true});
const hair=(a,k)=>a[k+3]===255&&a[k]<155&&a[k]>20&&a[k]>a[k+1]*1.1&&a[k+1]>=a[k+2]*.98;
const polys={
front:[[[135,230],[215,230],[235,248],[260,263],[270,264],[270,270],[246,270],[225,256],[205,243],[147,243]],[[115,264],[132,245],[150,233],[180,230],[180,241],[155,245],[134,260],[124,267]],[[91,261],[126,261],[126,269],[91,269]]],
back:[[[110,239],[150,239],[152,250],[123,254],[111,255]]],
left:[[[166,220],[180,220],[185,236],[203,249],[193,252],[179,244]],[[116,241],[141,234],[159,226],[180,218],[180,232],[158,240],[133,250],[120,251]],[[188,242],[200,242],[203,249],[189,249]],[[245,250],[252,250],[253,257],[246,257]]],
right:[[[149,252],[149,245],[184,219],[197,219],[188,234],[164,255]],[[225,234],[253,240],[274,257],[260,259],[245,250],[228,243]],[[99,252],[148,250],[163,241],[179,224],[192,219],[209,225],[224,230],[224,236],[245,247],[250,255],[233,255],[214,244],[207,237],[184,236],[169,250],[147,261],[101,262]]]
};
function inside(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const[a,b]=p[i],[u,v]=p[j];if(((b>y)!=(v>y))&&(x<(u-a)*(y-b)/(v-b)+a))c=!c;}return c;}
(async()=>{let report=[];for(const d of ['front','back','left','right'])for(let i=0;i<3;i++){
 const n=`somang-${d}-${i}.png`,a=await s(path.join(source,n)).ensureAlpha().raw().toBuffer(),out=Buffer.from(a),mask=Buffer.alloc(W*H*4);let edits=0;
 for(let y=218;y<274;y++)for(let x=88;x<278;x++){
 let k=(y*W+x)*4;if(a[k+3]||!polys[d].some(p=>inside(x+.5,y+.5,p)))continue;
 let above=false,below=false,left=false,right=false;for(let z=1;z<=12;z++){above ||= a[((y-z)*W+x)*4+3]>0;below ||= a[((y+z)*W+x)*4+3]>0;if(z<=6){left ||= a[(y*W+x-z)*4+3]>0;right ||= a[(y*W+x+z)*4+3]>0}}if(!(above&&below)&&!(left&&right))continue;
 let near=1e9,best=-1;for(let yy=y-12;yy<=y+12;yy++)for(let xx=x-12;xx<=x+12;xx++){let q=(yy*W+xx)*4,dist=(xx-x)**2+(yy-y)**2;if(hair(a,q)&&dist<near){near=dist;best=q;}}
 if(best<0)throw Error(n+' missing hair source');a.copy(out,k,best,best+4);mask[k]=255;mask[k+3]=255;edits++;
 }
 let seen=new Uint8Array(W*H);for(let p=0;p<W*H;p++)if(!seen[p]&&!out[p*4+3]){let q=[p],edge=false;seen[p]=1;for(let z=0;z<q.length;z++){let t=q[z],x=t%W,y=Math.floor(t/W);if(x===0||x===W-1||y===0||y===H-1)edge=true;for(let v of [x?t-1:-1,x<W-1?t+1:-1,y?t-W:-1,y<H-1?t+W:-1])if(v>=0&&!seen[v]&&!out[v*4+3]){seen[v]=1;q.push(v)}}if(edge||q.length>800||!q.every(t=>Math.floor(t/W)>=218&&Math.floor(t/W)<274))continue;for(let t of q){let x=t%W,y=Math.floor(t/W),best=-1,near=1e9;for(let yy=y-12;yy<=y+12;yy++)for(let xx=x-12;xx<=x+12;xx++){let k=(yy*W+xx)*4,dist=(xx-x)**2+(yy-y)**2;if(hair(a,k)&&dist<near){best=k;near=dist}}if(best>=0){a.copy(out,t*4,best,best+4);mask[t*4]=255;mask[t*4+3]=255;edits++}}}
 await s(out,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(output,n));
 await s(mask,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(audit,n.replace('.png','-mask.png')));
 report.push({file:n,filledTransparentPixels:edits,existingOpaquePixelsChanged:0});
 }fs.writeFileSync(path.join(audit,'report.json'),JSON.stringify(report,null,2));})();
