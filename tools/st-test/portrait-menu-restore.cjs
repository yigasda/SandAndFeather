const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const out=path.resolve(process.argv[2]||'/tmp/portrait-menu-restore');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:390,height:844}});let saved;const errors=[];p.on('pageerror',e=>{if(!/Internal S/.test(e.message))errors.push(e.message)});
try{if(process.env.BASELINE)for(const file of ['style.css','src/ui/bondcard.js','src/ui/popups.js'])await p.route('**/SandAndFeather/'+file+'*',r=>r.fulfill({contentType:file.endsWith('.css')?'text/css':'text/javascript',body:cp.execFileSync('git',['show','b985e45e:'+file])}));
  await p.route('**/api/horde/text-models',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await p.goto('http://127.0.0.1:8000');
  await p.waitForSelector('#sf_open', { state: 'attached', timeout: 60000 });
  if (await p.locator('.popup-button-ok').isVisible()) await p.locator('.popup-button-ok').click();
  await p.waitForSelector('.character_select[data-chid]', { state: 'attached' });
  await p.evaluate(async () => { const { selectCharacterById } = await import('/script.js'); await selectCharacterById(Number(document.querySelector('.character_select[data-chid]').dataset.chid)); });
  await p.waitForFunction(() => !!SillyTavern.getContext().chatId);
  saved = await p.evaluate(() => ({ state: SillyTavern.getContext().chatMetadata.sand_feather, settings: structuredClone(SillyTavern.getContext().extensionSettings.sand_feather) }));
  await p.evaluate(async () => {
   window.bt = {};
   for (const [k, file] of Object.entries({ win:'ui/window', state:'core/state', settings:'core/settings', bag:'core/bag', bond:'core/bond', ui:'ui/bondcard', scan:'core/bond-scan' })) bt[k] = await import(`/scripts/extensions/third-party/SandAndFeather/src/${file}.js`);
   bt.settings.settings().theme = 'light'; bt.settings.settings().uiTheme = 'cozy';
   bt.settings.settings().conn = { mode:'custom', url:'http://127.0.0.1:8111/v1', model:'fake-bond', fmt:'openai' };
   const s = bt.state.resetState(); s.party.with = 'set';
   await bt.win.openGame();
   bt.close = bt.ui.bondCard(bt.win.gameUi(), 'set');
  });

 const rows=[];
 for(const count of [0,3])for(const theme of ['classic','walnut','journal','temple','cozy'])for(const who of ['set','horus']){
 await p.evaluate(({count,theme,who})=>{const s=bt.state.getState();bt.settings.settings().uiTheme=theme;bt.win.applyTheme();s.bond.ties=Array.from({length:count},(_,i)=>({id:'restore-fixture-'+i,who,when:'Hathyr '+(i+1)+' · 낮',title:['함께 고른 선물','직접 구운 빵','함께 본 밤하늘'][i],summary:'함께 보낸 시간을 기록했다.',origin:'manual',src:[],kind:'activity'}));s.bond[who].pts=12;bt.close();bt.close=bt.ui.bondCard(bt.win.gameUi(),who);},{count,theme,who});
 await p.waitForFunction(()=>[...document.querySelectorAll('[data-kind="bond"] img')].every(i=>i.complete&&i.naturalWidth));await p.waitForTimeout(80);
 const layout=await p.locator('[data-kind="bond"]').evaluate(root=>{const out={};for(const sel of ['.sf_pop','.sf_pop_head','.sf_pop_body','.sf_pop_scroll','.sf_menu_nav','.sf_bond_tabs','.sf_bond_records','.sf_bond_progress','.sf_bond_giftrow','.sf_bond_activity_grid','.sf_bond_memory']){const e=root.querySelector(sel);if(!e){if(sel==='.sf_menu_nav')out[sel]={display:'none'};continue;}const r=e.getBoundingClientRect();out[sel]=sel==='.sf_menu_nav'?{display:getComputedStyle(e).display}:{x:r.x,y:r.y,width:r.width,height:r.height,display:getComputedStyle(e).display};}return out;});
 assert.equal(await p.locator('.sf_bond_record').count(),count);assert.equal(layout['.sf_menu_nav'].display,'none');
 rows.push({count,theme,who,layout});await p.screenshot({path:path.join(out,`${count}-${theme}-${who}.png`)});
 }
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({rows,errors},null,2));assert.deepEqual(errors,[]);
 if(process.env.COMPARE){const baseline=JSON.parse(fs.readFileSync(path.join(process.env.COMPARE,'result.json')));assert.deepEqual(rows,baseline.rows,'All portrait landmarks must match published portrait layout exactly');}
 // Real tab and memory handlers remain usable with the restored CSS.
 await p.locator('.sf_bond_tab').first().click();assert.equal(await p.locator('.sf_bond_tab').first().getAttribute('aria-selected'),'true');
 await p.locator('.sf_bond_memory').click();assert.equal(await p.locator('.sf_pop_wrap').count(),2);await p.locator('.sf_pop_x').last().click();
 console.log('PASS 20 portrait theme/person/record layouts and real tab/memory events'+(process.env.COMPARE?' match original exactly':''));
}finally{if(saved)await p.evaluate(async saved=>{await bt.win.closeGame();const c=SillyTavern.getContext();c.chatMetadata.sand_feather=saved.state;c.extensionSettings.sand_feather=saved.settings;await c.saveMetadata();},saved).catch(()=>{});await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
