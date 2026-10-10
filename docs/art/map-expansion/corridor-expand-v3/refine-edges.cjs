const sharp=require('sharp'),fs=require('fs'),path=require('path'),O=__dirname,W=2492,H=887;
(async()=>{let src=await sharp(path.join(O,'sources/registered-full.png')).removeAlpha().raw().toBuffer(),old=await sharp(path.join(O,'../exits-v2/inner-corridor-wide-v1.png')).removeAlpha().raw().toBuffer(),E=JSON.parse(fs.readFileSync(path.join(O,'sources/edge-registration.json'))),out=Buffer.alloc(W*H*3);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let k=(y*W+x)*3;if(x>=160&&x<2332&&y>=64&&y<788){old.copy(out,k,((y-64)*2172+x-160)*3,((y-64)*2172+x-160)*3+3);continue;}
let sides=[];if(x<160)sides.push([E.left[Math.max(0,Math.min(723,y-64))],160-x]);if(x>=2332)sides.push([E.right[Math.max(0,Math.min(723,y-64))],x-2331]);if(y<64)sides.push([E.top[Math.max(0,Math.min(2171,x-160))],64-y]);if(y>=788)sides.push([E.bottom[Math.max(0,Math.min(2171,x-160))],y-787]);let u=0,v=0;for(let [e,d] of sides){let fade=Math.max(0,1-d/180)/sides.length;u+=e[0]*fade;v+=e[1]*fade;}let gx=Math.max(0,Math.min(W-1,x+u)),gy=Math.max(0,Math.min(H-1,y+v)),ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
for(let c=0;c<3;c++){let sum=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)sum+=src[(Math.min(H-1,iy+dy)*W+Math.min(W-1,ix+dx))*3+c]*(dx?fx:1-fx)*(dy?fy:1-fy);out[k+c]=Math.round(sum);}}
// Only outside the immutable original, match the last few pixels of the join.
for(let y=64;y<788;y++)for(let d=1;d<=24;d++)for(let side of [0,1]){
 const x=side?2331+d:160-d,w=Math.pow(1-d/25,1.6),tilt=y>170&&y<350?-.72*d:0;
 const yy=Math.max(0,Math.min(723,Math.round(y-64+tilt))),q=(yy*2172+(side?2171:0))*3,k=(y*W+x)*3;
 for(let c=0;c<3;c++)out[k+c]=Math.round(out[k+c]*(1-w)+old[q+c]*w);
}
// Continue the two horizontal threshold tile joints across the new right margin.
for(let y=392;y<=452;y++)for(let x=2332;x<W;x++){
 const w=Math.min(1,(y-392)/12,(452-y)/12),q=((y-64)*2172+2171-(x-2332))*3,k=(y*W+x)*3;
 for(let c=0;c<3;c++)out[k+c]=Math.round(out[k+c]*(1-w)+old[q+c]*w);
}
await sharp(out,{raw:{width:W,height:H,channels:3}}).png().toFile(path.join(O,'inner-corridor-expanded-v3.png'));})();
