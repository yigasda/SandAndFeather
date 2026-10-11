const sharp=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.cjs'),fs=require('fs');
const root='docs/art/chibi-refresh/sleep-set-horus-v194/png';
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
(async()=>{for(const who of ['set','horus'])for(const side of [false,true]){
 const stem=who+'-sleep'+(side?'-side':''); const a=await sharp(root+'/'+stem+'-0.png').ensureAlpha().raw().toBuffer();let b=Buffer.alloc(a.length);
 // Animate this revision's newly drawn whole sprite. No pixels from an idle sprite are used.
 // A continuous field raises shoulders/arms, carries the locks lying on them,
 // and fades out before the skirt hem. Feet remain byte-identical.
 const cx=side?350:310,top=side?394:(who==='set'?396:391),end=side?550:530;
 function field(x,y){
  const hairWeight=who==='set'?(side?1-smooth((x-245)/45):Math.max(1-smooth((x-190)/40),smooth((x-390)/40))):0;
  const regionEnd=end+(who==='set'?70*hairWeight:0);
  const motionTop=top-20*hairWeight;
  const rise=smooth((y-motionTop)/22)*(1-smooth((y-(regionEnd-50))/50));
  const skull=y<top?1:1-smooth((y-top)/22);
  const dx=(who==='horus'&&!side?16:13)*rise*Math.tanh((x-cx)/75);
  return [dx,-8*rise-skull];
 }
 for(let y=0;y<720;y++)for(let x=0;x<620;x++){
  let sx=x,sy=y;for(let it=0;it<5;it++){const [dx,dy]=field(sx,sy);sx=x-dx;sy=y-dy;}
  sx=Math.round(sx);sy=Math.round(sy);if(sx>=0&&sx<620&&sy>=0&&sy<720)a.copy(b,(y*620+x)*4,(sy*620+sx)*4,(sy*620+sx+1)*4);
 }
 await sharp(b,{raw:{width:620,height:720,channels:4}}).png().toFile(root+'/'+stem+'-1.png');
}})();
