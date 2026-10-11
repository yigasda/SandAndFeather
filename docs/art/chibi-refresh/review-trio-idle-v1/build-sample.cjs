const sharp=require('sharp'),fs=require('fs'),path=require('path');
const root=path.dirname(__dirname)+'/',out=__dirname+'/';
async function read(p){return sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
(async()=>{
const src=await read(root+'review-trio-walk-v5/walk/somang-front-1.png');
const gp=out+'sources/somang-front-idle-generated.png';
const gen=await read(gp),d=Buffer.from(src.data),W=360,H=400;
// Retain the complete approved head, hair, neckline, bow and sleeves.
// Only the lower dress and planted legs come from the generated idle pose.
const sx=.36,sy=99/398,ox=180-589*sx,oy=271-800*sy;
for(let y=282;y<H;y++)for(let x=0;x<W;x++){
 const k=(y*W+x)*4;
 // Hands and cuffs of the original remain intact to y=295.
 if(y<295&&(x<146||x>217))continue;
 const gx=Math.round((x-ox)/sx),gy=Math.round((y-oy)/sy);
 d.fill(0,k,k+4);
 if(gx<0||gx>=gen.info.width||gy<0||gy>=gen.info.height)continue;
 if(y<298 && Math.abs(x-180)>58+(y-296)*1.4)continue;
 const j=(gy*gen.info.width+gx)*4;
 if(gen.data[j+3]>=180) {gen.data.copy(d,k,j,j+4);d[k+3]=255;}
}
// User accepted the sample with slimmer legs: match the walking calves and sandals.
const lower=Buffer.from(d);
for(let y=334;y<H;y++)for(let x=115;x<245;x++){
 const cx=x<181?156:206, sx2=Math.round(cx+(x-cx)/.86);
 const k=(y*W+x)*4;
 d.fill(0,k,k+4);
 if(sx2>=115&&sx2<245 && ((x<181)===(sx2<181)))lower.copy(d,k,(y*W+sx2)*4,(y*W+sx2)*4+4);
}
await sharp(d,{raw:{width:W,height:H,channels:4}}).png().toFile(out+'native/somang-front.png');
})();
