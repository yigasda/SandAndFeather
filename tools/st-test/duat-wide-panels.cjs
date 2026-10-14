const sharp = require('sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '../../docs/consult/duat-field/scale-wide');
(async () => {
 for (const width of [412, 320]) {
  const w = width * 2, h = 1800, header = 124;
  const labels = ['이전 · 52px', '1 · 44px · 맵 +18%', '2 · 36px · 맵 +44%'];
  const title = Buffer.from(`<svg width="${w*3}" height="${header}"><rect width="100%" height="100%" fill="#f4eddc"/><g font-family="Noto Sans CJK KR,sans-serif" fill="#30241c"><text x="20" y="36" font-size="26">맵 확대 시안 · 실제 게임 캡처 · 미배포</text>${labels.map((t,i)=>`<text x="${w*i+20}" y="94" font-size="32">${t}</text>`).join('')}</g></svg>`);
  for (const spot of ['stairs', 'door', 'entry']) {
   await sharp({create:{width:w*3,height:h+header,channels:4,background:'#f4eddc'}})
    .composite([{input:title,left:0,top:0}, ...[52,44,36].map((size,i)=>({input:path.join(root,`${size}px-${width}-${spot}.png`),left:w*i,top:header}))])
    .png().toFile(path.join(root,`compare-${width}-${spot}.png`));
  }
 }
})().catch(e=>{ console.error(e); process.exitCode=1; });
