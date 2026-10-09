// Capture the real mobile game and its renderer at fixed camera positions.
const fs=require('node:fs');
const {chromium}=require('playwright');
const path=require('node:path');
const output=path.resolve(process.argv[3]||'/tmp/sand-feather-art-review');
fs.mkdirSync(output,{recursive:true});
const base='/scripts/extensions/third-party/SandAndFeather/';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});let page;try{
page=await browser.newPage({viewport:{width:412,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>console.error('PAGE ERROR:',e.message));
await page.goto('http://127.0.0.1:8000');await page.waitForSelector('#sf_open',{state:'attached'});
if(await page.locator('.popup-button-ok').isVisible())await page.locator('.popup-button-ok').click();
await page.waitForSelector('.character_select[data-chid]', {state:'attached'});
await page.evaluate(()=>document.querySelector('.character_select[data-chid]').click());
await page.waitForFunction(()=>{const c=SillyTavern.getContext();return !!(c.chatId||c.getCurrentChatId?.());});
await page.evaluate(()=>{window.artCaptureSaved=structuredClone(SillyTavern.getContext().chatMetadata.sand_feather);document.querySelector('#sf_open').click();});await page.locator('#sf_game').waitFor({state:'visible'});
const tag=process.argv[2]||'before';
for(const [name,x,y,part='day'] of [['house',21,18],['market',14,20],['kitchen',30,19],['temple',26,13],['duat',38,13],['duat-night',38,13,'night'],['scribe',11,8]]) {
await page.evaluate(async({base,x,y,part})=>{const w=await import(base+'src/ui/window.js');const s=await import(base+'src/core/state.js');s.getState().part=part;await w.travel('ombos',{x,y});}, {base,x,y,part});
await page.waitForTimeout(200);await page.screenshot({path:path.join(output,`${tag}-${name}.png`)});
}
const map=await page.evaluate(async base=>{const {Renderer}=await import(base+'src/world/render.js');const {getMap}=await import(base+'src/world/map.js');const {DATA}=await import(base+'src/core/data.js');const cv=document.createElement('canvas');const r=new Renderer(cv);r.setMap(getMap(), 'akhet');r.setSprites(DATA.sprites);cv.width=getMap().w*32;cv.height=getMap().h*32;r.zoom=2;r.draw({player:{x:25,y:18,dir:'down',step:0},people:getMap().npcs,part:'day',time:0});return cv.toDataURL();},base);
fs.writeFileSync(path.join(output,`${tag}-map.png`),Buffer.from(map.split(',')[1],'base64'));
const details=await page.evaluate(async base=>{
const {Renderer}=await import(base+'src/world/render.js');const {getMap}=await import(base+'src/world/map.js');const {DATA}=await import(base+'src/core/data.js');
const m=getMap(),gate=m.spots.find(s=>s.id==='duat'),cv=document.createElement('canvas'),r=new Renderer(cv);
r.setMap(m,'akhet');r.setSprites(DATA.sprites);cv.width=640;cv.height=700;r.zoom=3;
return ['day','night'].map(part=>{r.draw({player:{x:gate.x,y:gate.y+1,dir:'up',step:0},people:m.npcs,part,time:0});return {part,url:cv.toDataURL()};});
},base);
for(const {part,url} of details)fs.writeFileSync(path.join(output,`${tag}-duat-detail-${part}.png`),Buffer.from(url.split(',')[1],'base64'));
console.log('Captured',tag,'7 mobile screens, 2 native-renderer closeups and complete map');
}finally{if(page)await page.evaluate(async base=>{if('artCaptureSaved' in window){const w=await import(base+'src/ui/window.js');await w.closeGame();SillyTavern.getContext().chatMetadata.sand_feather=window.artCaptureSaved;await SillyTavern.getContext().saveMetadata();}},base).catch(()=>{});await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
