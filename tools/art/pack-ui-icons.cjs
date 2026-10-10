// Reuse item pictures from approved UI concept 05; exclude the sample quantities.
const sharp=require('sharp'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'../..');
(async()=>{
    const out=path.join(root,'data/art/ui');fs.mkdirSync(out,{recursive:true});
    const names=['lotus','bread','fish','potion','scarab','flower','stone','scroll'];
    for(let i=0;i<names.length;i++){
        const col=i<5?i:i-5,row=i<5?0:1;
        await sharp(path.join(root,'docs/art/ui-approved-05.png'))
            .extract({left:Math.round(748+col*84.5),top:254+row*95,width:62,height:55})
            .png().toFile(path.join(out,`item-${names[i]}.png`));
    }
})().catch(e=>{console.error(e);process.exitCode=1;});
