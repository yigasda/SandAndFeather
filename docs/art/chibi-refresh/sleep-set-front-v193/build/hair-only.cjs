const sharp=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.cjs'),fs=require('fs');
(async()=>{for(let n=0;n<2;n++){
const base='docs/art/chibi-refresh/sleep-set-v192/png/set-sleep-'+n+'.png',src='/workspace/actions193/registered'+n+'.png';let a=await sharp(base).ensureAlpha().raw().toBuffer(),b=await sharp(src).ensureAlpha().raw().toBuffer();let pm=fs.readFileSync('/workspace/actions193/protect'+n+'.mask'),hm=fs.readFileSync('/workspace/actions193/newhair'+n+'.mask'),out=Buffer.alloc(a.length);
// Restrict changes to generated hair; preserve this same frame's original non-hair exactly.
// A slight uniform hair registration refinement keeps the newly spread outer tips on the existing canvas.
for(let y=0;y<720;y++)for(let x=0;x<620;x++){
 let sx=Math.round(310+(x-310)/.965),sy=Math.round(350+(y-350)/.965),k=(y*620+x)*4,j=(sy*620+sx)*4;
 if(sx>=0&&sx<620&&sy>=0&&sy<720&&hm[sy*620+sx])b.copy(out,k,j,j+4);
 if(pm[y*620+x])a.copy(out,k,k,k+4);
}
await sharp(out,{raw:{width:620,height:720,channels:4}}).png().toFile('docs/art/chibi-refresh/sleep-set-front-v193/png/set-sleep-'+n+'.png');
}})();
