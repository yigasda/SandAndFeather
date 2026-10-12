const sharp=require('sharp'),fs=require('fs');const r='/workspace/SandAndFeather-git/docs/art/chibi-refresh',p=r+'/sleep-horus-chin-v202';
(async()=>{let a=await sharp(r+'/sleep-front-fix-v201/png/horus-sleep-1.png').ensureAlpha().raw().toBuffer(),o=Buffer.from(a);
const pts=[[220,383],[230,386],[240,388],[250,390],[270,391],[290,392],[310,392],[330,392],[350,391],[370,389],[390,385],[400,381]];
for(let x=228;x<=389;x++){
 let q=0;while(q<pts.length-2&&x>pts[q+1][0])q++;let bottom=pts[q][1]+(x-pts[q][0])/(pts[q+1][0]-pts[q][0])*(pts[q+1][1]-pts[q][1]);const exactBottom=bottom;bottom=Math.ceil(bottom);
 let skin=-1;for(let y=360;y<389;y++){let i=(y*620+x)*4;if(a[i+3]>200&&a[i]>180&&a[i+1]>135&&a[i+2]>140&&a[i]-a[i+1]>10)skin=y;}
 if(skin<0||bottom<skin)continue;
 for(let y=skin+1;y<=bottom;y++){let i=(y*620+x)*4;if(y<=skin+1&&a[i]>50&&a[i+1]>30&&a[i+2]>35)continue;o[i]=5;o[i+1]=5;o[i+2]=5;o[i+3]=Math.round(255*Math.min(1,Math.max(0,exactBottom+1-y)));}
 let gap=false;for(let y=bottom+1;y<=398;y++){let i=(y*620+x)*4;if(a[i+3]<100){o.fill(0,i,i+4);gap=true;continue;}if(gap)break;if(a[i]<85&&a[i+1]<85&&a[i+2]<85){o.fill(0,i,i+4);}else break;}
}
await sharp(o,{raw:{width:620,height:720,channels:4}}).png().toFile(p+'/png/horus-sleep-1.png');
for(const[bg,name]of[['#f5efe3','light'],['#232d3c','dark']]){let c=[];for(let j=0;j<2;j++){let b=await sharp(j?o:a,{raw:{width:620,height:720,channels:4}}).extract({left:200,top:363,width:220,height:60}).flatten({background:bg}).resize(880,240,{kernel:'nearest'}).png().toBuffer();c.push({input:b,left:0,top:j*240})}await sharp({create:{width:880,height:480,channels:3,background:bg}}).composite(c).png().toFile(p+`/previews/chin-before-after-${name}.png`);}
let changed=[];for(let i=0;i<a.length;i+=4)if(!a.subarray(i,i+4).equals(o.subarray(i,i+4)))changed.push([i/4%620,Math.floor(i/4/620)]);fs.writeFileSync(p+'/checks/pixel-diff.json',JSON.stringify({changedPixels:changed.length,bounds:[Math.min(...changed.map(z=>z[0])),Math.min(...changed.map(z=>z[1])),Math.max(...changed.map(z=>z[0])),Math.max(...changed.map(z=>z[1]))],frame0:'not edited',set:'approved PNGs not edited'},null,2));console.log(changed.length);
})();
