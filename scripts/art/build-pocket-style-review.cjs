const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../..'), out=root+'/docs/art/chibi-refresh/review-pocket-style-v1';fs.mkdirSync(out+'/previews',{recursive:true});fs.mkdirSync(out+'/front',{recursive:true});
const names=['set','somang','horus'],labels=['세트','소망','호루스'];
const source=out+'/generated-front-source.png';
function textSvg(w,h,lines){return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f1ebdf"/>${lines.map(([s,x,y,size=26])=>`<text x="${x}" y="${y}" font-family="Noto Sans CJK KR" font-size="${size}" fill="#3d3129">${s}</text>`).join('')}</svg>`)}
async function bounds(input){const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});let l=info.width,t=info.height,r=0,b=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}return {left:l,top:t,width:r-l+1,height:b-t+1}}
(async()=>{const cuts=[0,690,1390,2076],olds=[],news=[],meta=[];
for(let i=0;i<3;i++){
 const chunk=await sharp(source).extract({left:cuts[i],top:0,width:cuts[i+1]-cuts[i],height:757}).png().toBuffer();const box=await bounds(chunk);const p=out+'/front/'+names[i]+'-front.png';await sharp(chunk).extract(box).png().toFile(p);news.push(p);
 const op=root+'/docs/art/chibi-refresh/approved/idle/'+names[i]+'-front.png';const ob=await bounds(op);olds.push(await sharp(op).extract(ob).png().toBuffer());meta.push({character:names[i],file:'front/'+names[i]+'-front.png',sourceRect:[cuts[i]+box.left,box.top,box.width,box.height],visibleSize:[box.width,box.height],pivot:[box.width/2,box.height]});
}
const comp=[];for(let row=0;row<2;row++)for(let i=0;i<3;i++){
 const input=await sharp(row?news[i]:olds[i]).resize({height:350}).png().toBuffer();const m=await sharp(input).metadata();comp.push({input,left:Math.round(240+i*440-m.width/2),top:row*440+95});
}
await sharp(textSvg(1360,960,[['현재 승인본 · 캐디 기준',24,37],['새 치비 정면 검토본 · 짧은 몸 / 굵은 도트 명암',24,477],...labels.map((s,i)=>[s,215+i*440,925])])).composite(comp).jpeg({quality:93}).toFile(out+'/previews/110_셋소호_정면_그림체비교.jpg');
// Identical map crop, character height and feet positions on both panels. This is a static mockup, not a runtime screenshot.
const map=root+'/docs/art/map-expansion/ombos-upgrade-v1-day.png';const crop={left:570,top:195,width:550,height:530};const mapbuf=await sharp(map).extract(crop).png().toBuffer();const feet=[[210,240],[275,350],[380,240]];const panels=[];
for(let row=0;row<2;row++){
 const layers=[];for(let i=0;i<3;i++){let input=await sharp(row?news[i]:olds[i]).resize({height:65}).png().toBuffer();let m=await sharp(input).metadata();layers.push({input,left:Math.round(feet[i][0]-m.width/2),top:feet[i][1]-65})}
 const composed=await sharp(mapbuf).composite(layers).png().toBuffer();panels.push(await sharp(composed).resize({width:1100}).png().toBuffer());
}
await sharp(textSvg(1100,2240,[['현재 승인본 · 같은 맵 / 같은 표시 높이',20,40],['새 치비 검토본 · 같은 맵 / 같은 표시 높이',20,1160]])).composite([{input:panels[0],left:0,top:60},{input:panels[1],left:0,top:1180}]).jpeg({quality:93}).toFile(out+'/previews/111_셋소호_맵위_동일크기비교.jpg');
fs.writeFileSync(out+'/review.json',JSON.stringify({status:'review-not-approved',date:'2026-10-11',scope:'Three front idle concepts only; no runtime replacement, no side/back/walk generation.',designSources:names.map(x=>'docs/art/chibi-refresh/approved/idle/'+x+'-front.png'),styleSource:'docs/art/sprites/pocket-directions-source.png',generatedSource:'exec-d75bed68-99bf-4c58-ae3d-2e7a472aedd9.png',frames:meta,mapMockup:{background:'docs/art/map-expansion/ombos-upgrade-v1-day.png',crop,visibleHeightInMapPixels:65,feet,previewScale:2,note:'Both versions use identical height and foot positions on actual map image; static art composite, not runtime integration.'}},null,2)+'\n');
console.log(out);
})();
