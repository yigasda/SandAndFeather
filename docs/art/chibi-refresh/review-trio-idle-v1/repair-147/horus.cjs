const s=require('sharp'),fs=require('fs'),O=require('path').resolve(__dirname,'..');(async()=>{let old=await s(require('path').join(require('os').tmpdir(),'sandfeather-idle147-baseline/horus-front.png')).ensureAlpha().raw().toBuffer(),ref=await s(O+'/native/horus-front.png').ensureAlpha().raw().toBuffer(),d=Buffer.alloc(old.length),W=360;
// Approved static Set-based body is already restored in ref. Keep its exact pixels.
ref.copy(d,243*W*4,243*W*4);
// Copy approved static hair, aligning the hairline with the unchanged idle face.
for(let y=0;y<222;y++)for(let x=50;x<305;x++){let k=(y*W+x)*4,r=ref[k],g=ref[k+1],b=ref[k+2];if(ref[k+3]&&r<115&&b>r+2&&b>g){ref.copy(d,((y+16)*W+x)*4,k,k+4);}}
let preserved=0;for(let y=125;y<238;y++){let xs=[];for(let x=80;x<278;x++){let k=(y*W+x)*4;if(old[k+3]>180&&old[k]>190&&old[k+1]>120&&old[k+2]<old[k+1]+20)xs.push(x);}if(!xs.length&&y<230)continue;let lo=xs.length?Math.min(...xs)-6:124,hi=xs.length?Math.max(...xs)+6:229;
for(let x=lo;x<=hi;x++){let k=(y*W+x)*4;if(old[k+3]){old.copy(d,((y+7)*W+x)*4,k,k+4);preserved++;}}}
await s(d,{raw:{width:360,height:400,channels:4}}).png().toFile(O+'/native/horus-front.png');console.log({preservedFacePixels:preserved,faceTranslation:[0,7],faceRescaled:false});
})();
