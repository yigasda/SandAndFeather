const sharp=require('sharp'),fs=require('fs'),path=require('path');
const O=__dirname,W=2492,H=887,ox=160,oy=64,ow=2172,oh=724;
(async()=>{
 const src=await sharp(path.join(O,'sources/inner-outpaint.png')).resize(W,H,{fit:'fill'}).removeAlpha().raw().toBuffer();
 const old=await sharp(path.join(O,'../exits-v2/inner-corridor-wide-v1.png')).removeAlpha().raw().toBuffer();
 const M=JSON.parse(fs.readFileSync(path.join(O,'sources/registration.json'))).outputToGenerated;
 function pos(x,y){let d=M[2][0]*x+M[2][1]*y+M[2][2];return [(M[0][0]*x+M[0][1]*y+M[0][2])/d,(M[1][0]*x+M[1][1]*y+M[1][2])/d];}
 let out=Buffer.alloc(W*H*3);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  let p=(y*W+x)*3;
  let [gx,gy]=pos(x,y);
  if(x<ox)gx=x/ox*pos(ox,y)[0];
  if(x>=ox+ow){let q=pos(ox+ow,y)[0];gx=q+(x-ox-ow)/(W-1-ox-ow)*(W-1-q);}
  if(y<oy)gy=y/oy*pos(x,oy)[1];
  gx=Math.max(0,Math.min(W-1,gx));gy=Math.max(0,Math.min(H-1,gy));
  let ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
  for(let c=0;c<3;c++){let sum=0;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)sum+=src[(Math.min(H-1,iy+yy)*W+Math.min(W-1,ix+xx))*3+c]*(xx?fx:1-fx)*(yy?fy:1-fy);out[p+c]=Math.round(sum);}
 }
 await sharp(out,{raw:{width:W,height:H,channels:3}}).png().toFile(path.join(O,'sources/registered-full.png'));
 for(let y=0;y<oh;y++)old.copy(out,((y+oy)*W+ox)*3,y*ow*3,(y+1)*ow*3);
 await sharp(out,{raw:{width:W,height:H,channels:3}}).png().toFile(path.join(O,'inner-corridor-expanded-v3.png'));
})();
