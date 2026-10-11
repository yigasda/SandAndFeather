const sharp=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.cjs');const fs=require('fs');
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
(async()=>{const [src,out,config,report]=process.argv.slice(2);const c=JSON.parse(fs.readFileSync(config));const {data,info}=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});const dst=Buffer.alloc(data.length);let maxDy=0,maxDx=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
 let f=ease((y-c.rise[0])/(c.rise[1]-c.rise[0]))*(1-ease((y-c.fall[0])/(c.fall[1]-c.fall[0])));
 const [hx,hy,rx,ry]=c.head;const h=Math.sqrt(((x-hx)/rx)**2+((y-hy)/ry)**2);let head=1-ease((h-.78)/.22);
 let dy=Math.max(c.amplitude*f,head),cx=c.center[0]+c.slope*(y-c.center[1]);let dx=Math.max(-6,Math.min(6,(x-cx)*.05))*f;
 // Source lookup is an inverse displacement. Every output color is an existing source pixel.
 let sx=Math.round(x-dx),sy=Math.round(y+dy);if(sx<0||sy<0||sx>=info.width||sy>=info.height)continue;
 let di=(y*info.width+x)*4,si=(sy*info.width+sx)*4;data.copy(dst,di,si,si+4);if(data[si+3]>128){maxDy=Math.max(maxDy,sy-y);maxDx=Math.max(maxDx,Math.abs(sx-x));}
 }
 let changed=0,outline=0,pillow=0,feet=0,box=[620,720,0,0];for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){let i=(y*info.width+x)*4;if(!data.subarray(i,i+4).equals(dst.subarray(i,i+4))){changed++;box=[Math.min(box[0],x),Math.min(box[1],y),Math.max(box[2],x+1),Math.max(box[3],y+1)];if((data[i+3]>128)!=(dst[i+3]>128))outline++;if(y<c.pillowLimit)pillow++;if(y>=c.fall[1])feet++;}}
 await sharp(dst,{raw:info}).png().toFile(out);fs.writeFileSync(report,JSON.stringify({source:src,result:out,config:c,changedPixels:changed,outlineChangedPixels:outline,changedBounds:box,maxBodyRisePx:maxDy,maxWidthDisplacementPx:maxDx,pillowRegionChangedPixels:pillow,feetRegionChangedPixels:feet,method:'Coherent chest+shoulders+arms+overlapping hair displacement, 8px rise and small width expansion; face/eye pattern translated1px, pillow hair and feet fixed; original source colors only.'},null,2));console.log(out,changed,'outline',outline,'rise',maxDy,'pillow',pillow);
})();
