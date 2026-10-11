const s=require('sharp'),O=require('path').resolve(__dirname,'../native')+'/';(async()=>{for(const [n,l,r,t]of [['set-back',174,180,321],['set-front',179,190,327],['somang-front',178,184,334]]){let d=await s(O+n+'.png').ensureAlpha().raw().toBuffer();for(let y=t;y<374;y++)for(let x=l;x<r;x++)d.fill(0,(y*360+x)*4,(y*360+x)*4+4);await s(d,{raw:{width:360,height:400,channels:4}}).png().toFile(O+n+'.png');}
const a=await s(O+'set-front.png').ensureAlpha().raw().toBuffer(),d=await s(O+'somang-front.png').ensureAlpha().raw().toBuffer();
for(let y=334;y<348;y++)for(let x=139;x<223;x++)d.fill(0,(y*360+x)*4,(y*360+x)*4+4);
// Actual straight Set calves, placed beneath Somang's existing hem and above her own shoes.
for(let side=0;side<2;side++)for(let y=334;y<348;y++)for(let dx=0;dx<24;dx++){let sx=(side?194:150)+dx,sy=324+Math.floor((y-334)*12/14),x=(side?187:151)+dx,j=(sy*360+sx)*4,k=(y*360+x)*4;if(a[j+3]){a.copy(d,k,j,j+4);}}
await s(d,{raw:{width:360,height:400,channels:4}}).png().toFile(O+'somang-front.png');})();
