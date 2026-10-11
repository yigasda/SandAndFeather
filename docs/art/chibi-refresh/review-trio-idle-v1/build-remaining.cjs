const sharp=require('sharp'),fs=require('fs'),path=require('path');
const O=__dirname,P=path.dirname(O),W=360,H=400,dirs=['front','back','left','right'];
async function read(p){const {data,info}=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {d:data,w:info.width,h:info.height};}
async function save(d,p){await sharp(d,{raw:{width:W,height:H,channels:4}}).png().toFile(p);}
function skin(r,g,b){return r>185&&r-g>15&&g-b>3&&b>90;}
function redHair(r,g,b){return b>g*1.05&&r>g*1.2;}
(async()=>{let report={};
for(const who of ['set','horus']){
 const g=await read(O+'/sources/'+who+'-idle-generated.png');
 const cfg=who==='set'?[
  {gx:320,gy:549,bottom:639,cx:187,top:322,sx:.60,x0:138,x1:233},
  {gx:847,gy:549,bottom:639,cx:177,top:317,sx:.60,x0:135,x1:220},
  {gx:1320,gy:549,bottom:639,cx:171,top:319,sx:.56,x0:110,x1:231},
  {gx:1890,gy:549,bottom:639,cx:177,top:319,sx:.56,x0:119,x1:231}
 ]:[
  {gx:347,gy:570,bottom:667,cx:178,top:320,sx:.48,x0:133,x1:225},
  {gx:828,gy:569,bottom:667,cx:180,top:314,sx:.48,x0:130,x1:229},
  {gx:1275,gy:571,bottom:667,cx:163,top:316,sx:.52,x0:110,x1:222},
  {gx:1850,gy:570,bottom:667,cx:184,top:316,sx:.52,x0:122,x1:244}
 ];
 for(let i=0;i<4;i++){
  const dir=dirs[i],c=cfg[i],a=await read(P+'/review-trio-walk-v5/walk/'+who+'-'+dir+'-1.png'),d=Buffer.from(a.d),newLegMask=new Uint8Array(W*H),sy=(370-c.top)/(c.bottom-c.gy);
  for(let y=c.top;y<H;y++)for(let x=c.x0;x<c.x1;x++){
   let k=(y*W+x)*4,keepHair=who==='set'&&y<356&&a.d[k+3]&&redHair(...a.d.subarray(k,k+3));
   if(who==='set'&&dir==='left'&&x<225&&y>=333)keepHair=false;
   if(who==='set' && y<333 && a.d[k+3]){
     for(let yy=Math.max(c.top,y-2);yy<=Math.min(340,y+2);yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(W-1,x+2);xx++){
      let q=(yy*W+xx)*4,r=a.d[q],gg=a.d[q+1],b=a.d[q+2];
      if(a.d[q+3]>180&&r>80&&r>gg*1.7&&b>gg*1.15)keepHair=true;
     }
   }
   if(!keepHair)d.fill(0,k,k+4);
   const gx=Math.round(c.gx+(x-c.cx)/c.sx),gy=Math.round(c.gy+(y-c.top)/sy);
   if(gx<0||gx>=g.w||gy<0||gy>=g.h)continue;
   let j=(gy*g.w+gx)*4;
   if(g.d[j+3]>180 && !(who==='set'&&redHair(...g.d.subarray(j,j+3)))){g.d.copy(d,k,j,j+4);d[k+3]=255;newLegMask[y*W+x]=1;}
  }
  if(who==='set'){
   const zones={front:[213,332,233,370],back:[132,329,149,370],left:[207,333,230,370],right:[126,329,155,370]};
   let [l,t,r,b]=zones[dir];for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(!newLegMask[y*W+x])d.fill(0,(y*W+x)*4,(y*W+x)*4+4);
  }
  await save(d,O+'/native/'+who+'-'+dir+'.png');report[who+'-'+dir]={method:'preserve approved neutral walk except planted legs; retain Set hair behind legs',...c,sy,protectedRows:[0,c.top]};
 }
}
const g=await read(O+'/sources/somang-other-views-generated.png');
const cfg=[
 {dir:'back',gx:429,gy:444,cx:180,top:249,sx:.55,mode:'back',cut:249,limit:258},
 {dir:'left',gx:1050,gy:382,cx:165,top:225,sx:.54,mode:'side',cut:225,limit:270},
 {dir:'right',gx:1764,gy:382,cx:201,top:226,sx:.54,mode:'side',cut:226,limit:270}
];
for(const c of cfg){const a=await read(P+'/review-trio-walk-v5/walk/somang-'+c.dir+'-1.png'),d=Buffer.alloc(W*H*4),sy=(370-c.top)/(674-c.gy);
 // Generated standing body only; isolate each scanline from the source head/hair.
 const spans={};for(let gy=c.gy;gy<674;gy++){
 let lo=9999,hi=-1;for(let gx=Math.floor(c.gx-160);gx<c.gx+160;gx++){let j=(gy*g.w+gx)*4,r=g.d[j],gg=g.d[j+1],b=g.d[j+2];if(g.d[j+3]>180&&((r>175&&gg>155&&b>135&&r-gg<35)||skin(r,gg,b))){lo=Math.min(lo,gx);hi=Math.max(hi,gx);}}
 // Shoes are below the dress/legs and contain few light pixels. Keep their whole alpha silhouette.
 if(gy>520){lo=c.gx-165;hi=c.gx+165;}
 if(hi<lo){lo=c.gx-60;hi=c.gx+60;}
 spans[gy]=[lo-7,hi+7];
 }
 for(let y=c.top;y<370;y++)for(let x=0;x<W;x++){
 let gx=Math.round(c.gx+(x-c.cx)/c.sx),gy=Math.round(c.gy+(y-c.top)/sy),sp=spans[gy];if(!sp||gx<sp[0]||gx>sp[1])continue;
 let j=(gy*g.w+gx)*4,k=(y*W+x)*4;if(g.d[j+3]>180){g.d.copy(d,k,j,j+4);d[k+3]=255;}
 }
 // Remove generated brown hair fragments from the standing-body layer.
 for(let y=c.top;y<275;y++)for(let x=0;x<W;x++){
  let k=(y*W+x)*4,r=d[k],gg=d[k+1],bb=d[k+2];
  if(Math.abs(x-c.cx)>28&&d[k+3]&&r>70&&r<175&&gg>r*.65&&bb>gg*.75)d.fill(0,k,k+4);
 }
 function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)yes=!yes;}return yes;}
 const bodyPoly=c.dir==='left'?[[153,224],[176,224],[195,241],[210,261],[209,285],[145,299],[111,283],[109,261],[134,246],[139,231]]:[[203,222],[223,225],[233,239],[248,253],[246,280],[220,297],[151,296],[144,273],[156,254],[171,244],[187,226]];
 for(let y=0;y<c.limit;y++)for(let x=0;x<W;x++){
  let k=(y*W+x)*4;if(!a.d[k+3])continue;
  let preserve=y<c.cut;
  if(!preserve){let r=a.d[k],gg=a.d[k+1],bb=a.d[k+2];
   let hair=r<175&&gg<135&&bb<125;
   preserve=hair&&(c.dir==='back'||!inside(x,y,bodyPoly));
  }
  if(preserve)a.d.copy(d,k,k,k+4);
 }
 // Retain the original small neckline where it meets the approved face/curls.
 if(c.dir!=='back')for(let y=c.cut;y<242;y++)for(let x=(c.dir==='left'?143:191);x<(c.dir==='left'?177:224);x++){
  let k=(y*W+x)*4;if(a.d[k+3])a.d.copy(d,k,k,k+4);
 }
 await save(d,O+'/native/somang-'+c.dir+'.png');report['somang-'+c.dir]={method:'approved head, hair, torso and arms preserved; settled lower dress and planted legs',...c,sy,protectedRows:[0,c.cut]};
}
fs.writeFileSync(O+'/assembly.json',JSON.stringify(report,null,2)+'\n');
for(const who of ['set','somang','horus'])for(const [name,bg] of [['light','#f5efe3'],['dark','#253041']]){
 let layers=[];for(let i=0;i<4;i++){layers.push({input:O+'/native/'+who+'-'+dirs[i]+'.png',left:i*W,top:0});}
 await sharp({create:{width:W*4,height:H,channels:4,background:bg}}).composite(layers).png().toFile(O+'/previews/'+who+'-idle-'+name+'.png');
}
})();
