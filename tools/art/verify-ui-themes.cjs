// Runs against the local SillyTavern test host. Restores chat/settings; sends no chat.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out=path.resolve(process.argv[2]||'/tmp/ui-themes');fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({...(require('node:fs').existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox']});
const p=await browser.newPage({viewport:{width:412,height:900},hasTouch:true});
const errors=[],failed=[],generated=[],passed=[],colors={},consoleErrors=[];let saved,stage='boot';
p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
p.on('request',r=>{if(/\/api\/.*\/generate(?:$|\?)/.test(r.url()))generated.push(r.url());});
p.on('pageerror',e=>{if(!/Internal S/.test(e.message))errors.push(e.message);});p.on('response',r=>{if(r.status()>=400&&r.url().includes('SandAndFeather'))failed.push(r.url());});
const last=()=>p.locator('#sf_game .sf_pop_wrap').last();
const close=()=>last().locator('.sf_pop_x:visible,.sf_lotus_hit[data-action="close"]:visible').click();
const images=()=>p.waitForFunction(()=>{const root=document.querySelector('#sf_game'),wrap=[...document.querySelectorAll('#sf_game .sf_pop_wrap')].at(-1);
 if(root?.dataset.uiTheme==='cozy'&&matchMedia('(orientation: landscape)').matches&&wrap){
  if(wrap.dataset.kind==='bond'&&!wrap.classList.contains('sf_lotus_exact'))return false;
  if(wrap.dataset.lotusTab&&!wrap.classList.contains('sf_lotus_menu'))return false;
 }
 return [...document.querySelectorAll('#sf_game .sf_pop img,#sf_game .sf_lotus_scene img')].every(i=>i.complete&&i.naturalWidth>0);});
const bounds=async()=>{await images();const bad=await p.evaluate(()=>[...document.querySelectorAll('#sf_game .sf_pop,#sf_game .sf_lotus_scene,#sf_game .sf_inventory_content,#sf_game .sf_party_gallery')].filter(e=>{const b=e.getBoundingClientRect();return b.x<0||b.right>innerWidth+1||e.scrollWidth>e.clientWidth+2;}).map(e=>e.className));assert.deepEqual(bad,[]);};
const shot=async name=>{await images();await p.locator('#sf_game').screenshot({path:path.join(out,name+'.png')});};
async function init(){
await p.waitForSelector('#sf_open',{state:'attached'});
if(await p.locator('.popup-button-ok').isVisible())await p.locator('.popup-button-ok').click();
await p.waitForSelector('.character_select[data-chid]',{state:'attached'});await p.evaluate(async()=>{const {selectCharacterById}=await import('/script.js');await selectCharacterById(Number(document.querySelector('.character_select[data-chid]').dataset.chid));});await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);
await p.evaluate(async()=>{window.themeTest={};const base='/scripts/extensions/third-party/SandAndFeather/src/';for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',bag:'core/bag'}))themeTest[k]=await import(base+v+'.js');});
}
try{
await p.goto('http://127.0.0.1:8000');await init();
saved=await p.evaluate(()=>{const t=themeTest,c=SillyTavern.getContext();return{chat:c.chatMetadata.sand_feather,theme:t.settings.settings().theme,uiTheme:t.settings.settings().uiTheme,text:document.querySelector('#send_textarea').value,length:c.chat.length};});
await p.evaluate(async()=>{const t=themeTest,s=t.settings.settings();delete s.uiTheme;if(t.settings.settings().uiTheme!=='cozy')throw Error('default');s.uiTheme='invalid';if(t.settings.settings().uiTheme!=='cozy')throw Error('fallback');s.theme='light';t.state.resetState();await t.win.openGame();for(const[id,n]of[['blue_lotus',3],['bread',2],['nile_perch',1],['faience_scarab',1],['limestone',1]])t.bag.give(t.state.getState(),id,n,'dock');await t.win.travel('ombos',{x:24,y:13});});
passed.push('missing/invalid theme falls back to cozy without modifying chat');
const inventory=await p.evaluate(()=>JSON.stringify(themeTest.state.getState().bag));
for(const [i,id]of ['classic','walnut','journal','temple','cozy'].entries()){
await p.setViewportSize({width:412,height:900});await p.locator('.sf_appearance').click();await p.locator(`[role="radio"][data-theme="${id}"]`).click();
assert.equal(await p.locator('#sf_game').getAttribute('data-ui-theme'),id);assert.equal(await p.locator('#sf_ui_theme').inputValue(),id);assert.equal(await p.locator('[role="radio"][aria-checked="true"]').count(),1);await bounds();await shot(`${i+1}-${id}-settings`);
colors[id]=await last().locator('.sf_pop').evaluate(e=>getComputedStyle(e).backgroundColor);await close();
for(const size of [{width:320,height:740},{width:412,height:900},{width:1280,height:900}]){
await p.setViewportSize(size);
const overlap=await p.evaluate(()=>{const a=document.querySelector('.sf_appearance').getBoundingClientRect(),b=document.querySelector('.sf_chips').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});assert(!overlap,`${id} ${size.width} HUD`);
if(size.width===412)await shot(`${i+1}-${id}-world`);
// Verify every approved glyph in its live selected and inactive menu states.
// Cozy uses the approved Lotus PNGs; other themes retain their original menu PNGs and bond bird mask.
const TABS=['world','party','bond','quests','map'];
for(const tab of TABS){
 if(await p.locator('.sf_menu').isVisible())await p.locator('.sf_menu').click();
 const glyphs=await p.locator('.sf_tab i').evaluateAll(async els=>{
  return Promise.all(els.map(async e=>{
   const style=getComputedStyle(e),url=(style.backgroundImage==='none'?style.maskImage:style.backgroundImage).match(/url\(["']?(.*?)["']?\)/)?.[1];
   const img=new Image();img.src=url;await img.decode();
   const a=e.getBoundingClientRect(),b=e.closest('button').getBoundingClientRect();
   return{url,width:img.naturalWidth,height:img.naturalHeight,inside:a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom};
  }));
 });
 assert.equal(glyphs.length,TABS.length);
 for(const [j,g]of glyphs.entries()){
  if(id==='cozy'){
   const [name,width,height]=[['home',51,51],['heart',54,48],['rings',53,48],['scroll',50,54],['map',58,52]][j];
   assert(g.url.includes(`/lotus/icon.${name}.png`),g.url);
   assert(g.width===width&&g.height===height&&g.inside,`${id} ${size.width} ${tab}: clipped or wrong Lotus icon`);continue;
  }
  if(TABS[j]==='bond'){assert(g.url.includes('/bond/redrawn/22-birds-symbol.png'),g.url);assert(g.inside,`${id} ${size.width} ${tab}: clipped bond icon`);continue;}
  assert(g.url.includes(`/menu-icons/${id}/${TABS[j]}.png`),g.url);
  assert(g.width===48&&g.height===48&&g.inside,`${id} ${size.width} ${tab}: clipped or wrong icon`);
 }
 if(size.width===412)await p.locator('.sf_tabs').screenshot({path:path.join(out,`${i+1}-${id}-menu-${tab}.png`)});
 stage=`${id} ${size.width}x${size.height} ${tab}`;await p.locator(`.sf_tab[data-tab="${tab}"]`).click();await bounds();
 assert.equal(await p.locator('.sf_tabs .sf_on').getAttribute('data-tab'),tab);
 if(tab!=='world')await close();
}
await p.locator('.sf_bag').click();await bounds();
assert.equal(await p.locator('.sf_inventory_detail_head').count(),1);
assert.equal(await p.locator('.sf_inventory_detail button,.sf_inventory_detail small').count(),0);
const detailLayout=await p.locator('.sf_inventory_detail').evaluate(e=>{
 const icon=e.querySelector('.sf_inventory_icon_frame'),identity=e.querySelector('.sf_inventory_identity'),description=e.querySelector('.sf_inventory_description');
 const a=icon.getBoundingClientRect(),b=identity.getBoundingClientRect(),c=description.getBoundingClientRect(),outer=e.getBoundingClientRect();
 return a.right<=b.left+1&&c.top>=Math.max(a.bottom,b.bottom)&&b.right<=outer.right&&c.right<=outer.right&&getComputedStyle(icon).borderImageSource!=='none'&&getComputedStyle(description).borderImageSource!=='none';
});assert(detailLayout,`${id} ${size.width}: separate icon/identity/description frames`);
if(size.width===1280)await last().locator('.sf_pop').screenshot({path:path.join(out,`${i+1}-${id}-bag-panel.png`)});
if(size.width===412)await shot(`${i+1}-${id}-bag`);
if(id==='journal')assert.equal(await p.locator('.sf_inventory_grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1);
await close();if(await p.locator('.sf_menu').isVisible())await p.locator('.sf_menu').click();await p.locator('[data-tab="party"]').click();await bounds();if(size.width===412)await shot(`${i+1}-${id}-party`);await close();
await p.locator('.sf_talk').click();await bounds();assert.equal(await last().locator('.sf_portrait').count(),0);if(size.width===412)await shot(`${i+1}-${id}-talk`);await close();
}
await p.setViewportSize({width:412,height:900});await p.locator('.sf_appearance').click();await p.getByLabel('밝기',{exact:true}).selectOption('dark');assert(await p.locator('#sf_game').evaluate(e=>e.classList.contains('sf_dark')));await close();
await p.locator('.sf_bag').click();await bounds();await shot(`${i+1}-${id}-dark`);await close();
await p.evaluate(()=>{themeTest.settings.settings().theme='light';themeTest.win.applyTheme();});
passed.push(`${id}: live choice, settings sync, bag/party/talk at 320/412/1280, dark brightness, no overflow`);
}
assert.equal(new Set(Object.values(colors)).size,5);assert.equal(await p.evaluate(()=>JSON.stringify(themeTest.state.getState().bag)),inventory);
await p.locator('.sf_appearance').click();await p.locator('[data-theme="cozy"][role="radio"]').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#sf_game').getAttribute('data-ui-theme'),'classic');await p.keyboard.press('End');assert.equal(await p.locator('#sf_game').getAttribute('data-ui-theme'),'cozy');await close();passed.push('keyboard radio navigation wraps and supports Home/End');
const savedRequest=p.waitForResponse(r=>r.url().includes('/api/settings/save')&&r.request().method()==='POST'&&r.status()===200);
await p.evaluate(()=>{const el=document.querySelector('#sf_ui_theme');el.value='temple';el.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal(await p.locator('#sf_game').getAttribute('data-ui-theme'),'temple');await savedRequest;
await p.reload();await init();assert.equal(await p.evaluate(()=>themeTest.settings.settings().uiTheme),'temple');await p.evaluate(()=>themeTest.win.openGame());assert.equal(await p.locator('#sf_game').getAttribute('data-ui-theme'),'temple');passed.push('extension drawer applies immediately and selected theme survives full page reload');
assert.equal(await p.evaluate(()=>SillyTavern.getContext().chat.length),saved.length);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(generated,[]);
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed,colors,pageErrors:errors,failedRequests:failed,generationRequests:generated},null,2)+'\n');console.log(JSON.stringify({passed,pageErrors:errors,failedRequests:failed,generationRequests:generated,output:out},null,2));
}catch(error){
const diagnostic=await p.evaluate(()=>({
 theme:document.querySelector('#sf_game')?.dataset.uiTheme,viewport:[innerWidth,innerHeight],
 popups:[...document.querySelectorAll('#sf_game .sf_pop_wrap')].map(e=>({kind:e.dataset.kind,classes:e.className,lotusTab:e.dataset.lotusTab,visible:!!e.getClientRects().length})),
 images:[...document.querySelectorAll('#sf_game .sf_pop img,#sf_game .sf_lotus_scene img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>({src:i.currentSrc||i.src,complete:i.complete,naturalWidth:i.naturalWidth,asset:i.dataset.asset,classes:i.className})),
 fonts:document.fonts.status
})).catch(e=>({diagnosticError:String(e)}));
fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({stage,error:String(error),diagnostic,errors,failed,consoleErrors,passed},null,2)+'\n');
await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.error('THEME_FAILURE',JSON.stringify({stage,diagnostic,errors,failed,consoleErrors}));
throw error;
}finally{
if(saved){const request=p.waitForResponse(r=>r.url().includes('/api/settings/save')&&r.status()===200).catch(()=>{});await p.evaluate(async original=>{const t=themeTest;await t.win.closeGame();Object.assign(t.settings.settings(),{theme:original.theme,uiTheme:original.uiTheme});t.settings.saveSettings();t.win.applyTheme();const c=SillyTavern.getContext();c.chatMetadata.sand_feather=original.chat;await c.saveMetadata();document.querySelector('#send_textarea').value=original.text;},saved).catch(()=>{});await request;}await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
