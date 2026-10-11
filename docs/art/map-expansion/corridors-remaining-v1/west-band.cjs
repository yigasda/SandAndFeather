const s=require('sharp'),fs=require('fs'),path=require('path'),O=__dirname;
(async()=>{const f=path.join(O,'west-expanded.png'),b=await s(path.join(O,'../exits-v2/west-gallery-v1.png')).extract({left:1000,top:36,width:160,height:32}).png().toBuffer();const out=await s(f).composite([{input:b,left:0,top:100},{input:b,left:2332,top:100}]).png().toBuffer();fs.writeFileSync(f,out);})();
