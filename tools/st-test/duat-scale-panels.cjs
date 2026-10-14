const sharp=require('sharp');const R=require('node:path').resolve(__dirname,'../../docs/consult/duat-field/scale');
(async()=>{for(const width of [412,320]){
 const W=width*2,H=1800,header=116;
 const title=Buffer.from(`<svg width="${W*2}" height="${header}"><rect width="100%" height="100%" fill="#f4eddc"/><g font-family="Noto Sans CJK KR,sans-serif" fill="#30241c"><text x="20" y="36" font-size="26">시안 · 실제 게임 캡처 · 아직 배포 안 됨</text><text x="20" y="88" font-size="34">1 · 52px/칸 (추천)</text><text x="${W+20}" y="88" font-size="34">2 · 60px/칸</text></g></svg>`);
 for(const spot of ['door','stairs','entry'])await sharp({create:{width:W*2,height:H+header,channels:4,background:'#f4eddc'}}).composite([{input:title,left:0,top:0},{input:`${R}/52px-${width}-${spot}.png`,left:0,top:header},{input:`${R}/60px-${width}-${spot}.png`,left:W,top:header}]).png().toFile(`${R}/compare-${width}-${spot}.png`);
}})();
