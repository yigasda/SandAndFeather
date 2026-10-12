const sharp=require('sharp'),fs=require('fs');
const r='/workspace/SandAndFeather-git/docs/art/chibi-refresh',p=r+'/sleep-front-fix-v201';
(async()=>{const paint=await sharp(p+'/sources/set-redrawn-guide-body.png').resize(680,300).ensureAlpha().raw().toBuffer();
for(let f=0;f<2;f++){
 const a=await sharp(r+`/sleep-set-horus-v195/png/horus-sleep-${f}.png`).ensureAlpha().raw().toBuffer(),base=await sharp(r+`/sleep-front-body-v199/png/set-sleep-${f}.png`).ensureAlpha().raw().toBuffer(),out=Buffer.from(base),skin=await sharp(p+`/checks/guide-skin-${f}.png`).greyscale().removeAlpha().raw().toBuffer();
 const hair=(buf,i)=>buf[i]<205&&buf[i]>buf[i+1]*1.22&&buf[i+2]>buf[i+1]*1.04;
 let mask=Buffer.alloc(620*720);
 for(let y=508;y<640;y++)for(let x=205;x<421;x++){
  if(x>390&&y<524)continue;
  let i=(y*620+x)*4,j=((y-340)*680+f*340+x-140)*4;
  let nearSkin=false;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(skin[(y+dy)*620+x+dx]>127)nearSkin=true;
  let inside=(y>=535&&a[i+3]>127)||nearSkin;
  if(inside){
   mask[y*620+x]=255;
   if(skin[y*620+x]>127){const edge=(skin[(y-1)*620+x]<128||skin[(y+1)*620+x]<128||skin[y*620+x-1]<128||skin[y*620+x+1]<128);out[i]=250;out[i+1]=edge?190:202;out[i+2]=edge?171:182;out[i+3]=255;}
   else if(y<535){out[i]=34;out[i+1]=10;out[i+2]=10;out[i+3]=255;}
   else{
    // Fresh drawing sampled at its own coordinates, never stretched or row-warped.
    let k=j;
    if(paint[k+3]<200||hair(paint,k)){let best=999;for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){let q=((y+dy-340)*680+f*340+x+dx-140)*4;if(paint[q+3]>240&&!hair(paint,q)&&dx*dx+dy*dy<best){best=dx*dx+dy*dy;k=q;}}}
    for(let c=0;c<3;c++)out[i+c]=paint[k+c];out[i+3]=255;
    // Ink follows the entire guide, including the inner gap of each foot.
    let edge=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(a[((y+dy)*620+x+dx)*4+3]<128)edge=true;
    if(edge){out[i]=34;out[i+1]=10;out[i+2]=10;}
   }
  }else if(base[i+3]>0&&!hair(base,i)){
   if(y<535){if(base[i]>110){const v=paint[j]<100?paint[j]:46;out[i]=v;out[i+1]=v;out[i+2]=v;out[i+3]=255;}}
   else if(paint[j+3]>240&&hair(paint,j)){for(let c=0;c<4;c++)out[i+c]=paint[j+c];}
   else out.fill(0,i,i+4);
  }
 }
 await sharp(out,{raw:{width:620,height:720,channels:4}}).png().toFile(p+`/png/set-sleep-${f}.png`);
 await sharp(mask,{raw:{width:620,height:720,channels:1}}).png().toFile(p+`/checks/redrawn-leg-foot-mask-${f}.png`);
}
})();
