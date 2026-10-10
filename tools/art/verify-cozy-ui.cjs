// Real ST UI regression. Dedicated test chat only; never clicks Send or calls AI.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out=path.resolve(process.argv[2]||'/tmp/cozy-ui');fs.mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const p=await browser.newPage({viewport:{width:412,height:900},hasTouch:true});const errors=[],failed=[],passed=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().includes('SandAndFeather'))failed.push(r.url());});
const last=()=>p.locator('.sf_pop_wrap').last();
const close=async()=>{await last().locator('.sf_pop_x').click();};
const images=async()=>{await p.waitForFunction(()=>[...document.querySelectorAll('#sf_game .sf_pop img')].every(i=>i.complete&&i.naturalWidth>0));};
const capture=async name=>{await images();await p.locator('#sf_game').screenshot({path:path.join(out,name+'.png')});};
const bounds=async()=>{const a=await p.evaluate(()=>[...document.querySelectorAll('#sf_game .sf_pop')].map(el=>{const b=el.getBoundingClientRect();return{x:b.x,right:b.right,width:innerWidth,overflow:el.scrollWidth-el.clientWidth};}));assert(a.every(b=>b.x>=0&&b.right<=b.width+1&&b.overflow<=2),JSON.stringify(a));};
try{
await p.goto('http://127.0.0.1:8000');await p.waitForSelector('#sf_open',{state:'attached'});
if(await p.locator('.popup-button-ok').isVisible())await p.locator('.popup-button-ok').click();
await p.waitForSelector('.character_select[data-chid]',{state:'attached'});await p.evaluate(async()=>{const {selectCharacterById}=await import('/script.js');await selectCharacterById(Number(document.querySelector('.character_select[data-chid]').dataset.chid));});await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);
await p.evaluate(async()=>{window.cozyTest={};const base='/scripts/extensions/third-party/SandAndFeather/src/';
for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',data:'core/data',settings:'core/settings',bag:'core/bag',player:'world/player',check:'core/check'}))cozyTest[k]=await import(base+v+'.js');
const t=cozyTest,ctx=SillyTavern.getContext();t.saved=structuredClone(ctx.chatMetadata.sand_feather);t.text=document.querySelector('#send_textarea').value;t.chatLength=ctx.chat.length;t.theme=t.settings.settings().theme;t.uiTheme=t.settings.settings().uiTheme;t.settings.settings().uiTheme='cozy';
t.state.resetState();await t.win.openGame();const s=t.state.getState();for(const[id,n]of[['blue_lotus',3],['bread',2],['nile_perch',1],['faience_scarab',1],['honey_bread',1],['limestone',1],['wet_papyrus',1],['sealed_jar',1],['reed_bundle',1]])t.bag.give(s,id,n,'dock');
t.inventory=JSON.stringify(s.bag.items);await t.win.travel('ombos',{x:25,y:13});});
assert.deepEqual(await p.evaluate(()=>cozyTest.check.checkData()),[]);
await capture('01-world-mobile');
const hud=await p.evaluate(()=>{const b=s=>document.querySelector(s).getBoundingClientRect();return{dateBottom:b('.sf_date_card').bottom,chipsTop:b('.sf_chips').top,chipsBottom:b('.sf_chips').bottom,hintTop:b('.sf_hint_pill').top};});
assert(hud.dateBottom<=hud.chipsTop&&hud.chipsBottom<=hud.hintTop,JSON.stringify(hud));passed.push('cozy HUD loads, status rows do not overlap');
await p.locator('.sf_bag').click();assert.equal(await p.locator('.sf_inventory_slot[aria-pressed]').count(),9);await capture('02-inventory-mobile');await bounds();
await p.getByRole('button',{name:'푸른 연꽃 3개',exact:true}).click();assert((await p.locator('.sf_inventory_detail').innerText()).includes('보유 수량 3'));
await p.locator('[data-category="food"]').click();assert.equal(await p.locator('.sf_inventory_slot[aria-pressed]').count(),1);
await p.locator('[data-category="other"]').click();assert.equal(await p.locator('.sf_inventory_slot[aria-pressed]').count(),4);
assert.equal(await p.evaluate(()=>JSON.stringify(cozyTest.state.getState().bag.items)),await p.evaluate(()=>cozyTest.inventory));
assert.equal(await p.locator('.sf_inventory_detail button,.sf_inventory_detail small').count(),0);
assert.equal(await p.locator('.sf_inventory_icon_frame > *').count(),1);
await p.locator('.sf_inventory_slot[aria-pressed="true"]').click();assert((await last().innerText()).includes('지금 꺼내기'));await close();passed.push('inventory groups/filter/detail retain individual UID/history and existing item actions');
await p.locator('[data-tab="party"]').click();await capture('03-party-mobile');await bounds();
for(const id of ['somang','set','horus']){await p.locator(`[data-character="${id}"]`).click();await images();assert.equal(await last().locator('.sf_portrait_full').count(),1);await bounds();if(id==='set')await capture('04-set-full');await close();}
const setRow=last().locator('.sf_list_row').filter({has:p.locator('b',{hasText:/^세트$/})});await setRow.getByRole('button',{name:'고르기'}).click();
assert.equal(await p.evaluate(()=>cozyTest.state.getState().party.with),'set');await close();passed.push('party portraits open full body views; companion selection still works');
await p.locator('[data-tab="somang"]').click();await images();assert((await last().locator('.sf_portrait img').getAttribute('src')).includes('somang-illust-head'));
await capture('05-somang-character');await bounds();await close();passed.push('Somang character screen retains stats/lessons and shows her illustration');
await p.evaluate(async()=>{cozyTest.state.getState().party.with='';await cozyTest.win.travel('ombos',{x:24,y:13});});
await p.waitForTimeout(150);await p.locator('.sf_talk').click();assert.equal(await last().getAttribute('data-kind'),'conversation');await images();await capture('06-conversation-calm');
assert.equal(await last().locator('.sf_portrait').count(),0);assert.equal(await last().getByRole('button',{name:'활짝 웃기',exact:true}).count(),0);
assert.equal(await p.evaluate(()=>document.querySelector('#send_textarea').value),await p.evaluate(()=>cozyTest.text));passed.push('conversation card has no portraits or expression buttons and sends no chat');await close();
await p.evaluate(()=>cozyTest.win.travel('ombos',{x:28,y:13}));await p.waitForTimeout(150);await p.locator('.sf_talk').click();await images();
assert.equal(await last().locator('.sf_portrait').count(),0);await capture('11-horus-conversation');await close();
await p.setViewportSize({width:320,height:740});await p.locator('[data-tab="somang"]').click();await images();
const scrollBox=await last().locator('.sf_pop').boundingBox(),cdp=await p.context().newCDPSession(p);
const x=scrollBox.x+scrollBox.width/2,y=Math.min(620,scrollBox.y+scrollBox.height-70);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*23}]});await p.waitForTimeout(20);}
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);
assert(await last().locator('.sf_pop').evaluate(el=>el.scrollTop>50));await close();passed.push('mobile finger swipe scrolls the character screen');
for(const size of [{width:320,height:740},{width:360,height:800},{width:740,height:420},{width:1280,height:900}]){
 await p.setViewportSize(size);await p.waitForTimeout(150);
 for(const tab of ['party','somang','quests','map']){await p.locator(`[data-tab="${tab}"]`).click();await images();await bounds();if(size.width===1280&&tab==='party')await capture('08-party-desktop');await close();}
 await p.locator('.sf_bag').click();await images();await bounds();await close();
}
passed.push('320/360 mobile, landscape, desktop: all tabs and bag stay within screen with scrolling');
await p.setViewportSize({width:412,height:900});await p.evaluate(()=>{cozyTest.settings.settings().theme='light';cozyTest.win.applyTheme();});await capture('09-world-light');
await p.evaluate(()=>{cozyTest.settings.settings().theme='dark';cozyTest.win.applyTheme();});await p.locator('.sf_bag').click();await capture('10-inventory-dark');await close();passed.push('light and dark variants remain readable');
await p.evaluate(()=>cozyTest.win.travel('ombos',{x:24,y:13}));await p.waitForTimeout(150);await p.locator('.sf_talk').click();await last().getByRole('button',{name:/으로 찾아가기/}).click();
await p.waitForFunction(()=>!document.querySelector('#sf_chip').hidden);assert((await p.locator('#send_textarea').inputValue()).length>0);assert.equal(await p.evaluate(()=>SillyTavern.getContext().chat.length),await p.evaluate(()=>cozyTest.chatLength));
passed.push('visit prepares chat input and folds game without sending a message');
assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed,hud,pageErrors:errors,failedRequests:failed},null,2)+'\n');console.log(JSON.stringify({passed,hud,pageErrors:errors,failedRequests:failed,output:out},null,2));
}finally{await p.evaluate(async()=>{const t=window.cozyTest;if(!t?.win)return;await t.win.closeGame();t.settings.settings().theme=t.theme;t.settings.settings().uiTheme=t.uiTheme;t.win.applyTheme();const c=SillyTavern.getContext();c.chatMetadata.sand_feather=t.saved;await c.saveMetadata();document.querySelector('#send_textarea').value=t.text;}).catch(()=>{});await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
