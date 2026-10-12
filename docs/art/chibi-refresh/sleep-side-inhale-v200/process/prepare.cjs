const sharp=require('sharp'),fs=require('fs');
const r='/workspace/SandAndFeather-git/docs/art/chibi-refresh/',p=r+'sleep-side-inhale-v200/';
(async()=>{for(const d of ['png','previews','checks','process'])fs.mkdirSync(p+d,{recursive:true});
for(const [who,source]of [['set','/workspace/generated_images/exec-d97fa075-96ec-42b7-885a-89a7f6830610.png'],['horus','/workspace/generated_images/exec-147ecf27-b739-48a9-839d-7d3dda393be3.png']]){
 fs.copyFileSync(r+`sleep-selected-v198/png/${who}-sleep-side-0.png`,p+`png/${who}-sleep-side-0.png`);
 let {data,info}=await sharp(source).resize(620,720,{fit:'fill',kernel:'lanczos3'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4){if(data[i+3]<110){data.fill(0,i,i+4);}else data[i+3]=255;}
 await sharp(data,{raw:{width:620,height:720,channels:4}}).png().toFile(p+`png/${who}-sleep-side-1.png`);
}
})();
