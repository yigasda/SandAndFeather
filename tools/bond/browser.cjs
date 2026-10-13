const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const out = path.resolve(process.argv[2] || 'docs/bond-ui/screenshots'); fs.mkdirSync(out, { recursive: true });
(async () => {
 const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
 const p = await browser.newPage({ viewport: { width: 412, height: 900 } });
 const errors = [], failed = [], passed = [], used = new Set(); let saved;
 p.on('request', r => { if (r.url().includes('/art/ui/bond/') && r.url().endsWith('.png')) used.add(r.url().split('/').pop()); });
 p.on('pageerror', e => { if (!/Internal S/.test(e.message)) errors.push(e.message); });
 p.on('response', r => { if (r.status() >= 400 && r.url().includes('SandAndFeather')) failed.push(r.url()); });
 try {
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
  const modal = () => p.locator('[data-kind="bond"] .sf_pop');
  const images = () => p.waitForFunction(() => [...document.querySelectorAll('[data-kind="bond"] img')].every(i => i.complete && i.naturalWidth));
  await images(); await p.screenshot({ path:path.join(out,'412-empty-real-game.png') });
  await p.evaluate(() => {
   const s=bt.state.getState();
   for(const id of ['feast_garland','bread','tilapia','blue_lotus']) bt.bag.give(s,id,1,'test-fixture');
   // Isolated in-memory display fixture, restored in finally; never written into a user's save.
   s.bond.set.pts=12;
   s.bond.ties=[
    {id:'fixture1',who:'set',when:'Hathyr 5 · 해질녘',where:'',title:'함께 고른 선물',summary:'함께 선물을 고르고 건넸다.',origin:'manual',src:[],kind:'gift'},
    {id:'fixture2',who:'set',when:'Hathyr 3 · 낮',where:'',title:'직접 구운 빵',summary:'직접 구운 빵을 건넸다.',origin:'manual',src:[],kind:'gift'},
    {id:'fixture3',who:'set',when:'Hathyr 1 · 밤',where:'',title:'함께 본 밤하늘',summary:'함께 별을 올려다보았다.',origin:'manual',src:[],kind:'activity'}
   ].reverse();
   bt.close(); bt.close=bt.ui.bondCard(bt.win.gameUi(),'set');
  });
  const sizes=[{width:320,height:900},{width:412,height:900},{width:1280,height:1000}];
  const measurements=[];
  for(const theme of ['classic','walnut','journal','temple','cozy']) for(const brightness of ['light','dark']) for(const size of sizes){
   await p.setViewportSize(size);
   await p.evaluate(({theme,brightness})=>{bt.settings.settings().uiTheme=theme;bt.settings.settings().theme=brightness;bt.win.applyTheme();},{theme,brightness});
   await images(); await p.waitForTimeout(70);
   const bounds=await modal().evaluate(e=>{const b=e.getBoundingClientRect(),scroll=e.querySelector('.sf_pop_scroll'),cols=e.querySelector('.sf_bond_columns');return{x:b.x,right:b.right,width:innerWidth,overflow:e.scrollWidth-e.clientWidth,scrollOverflow:scroll.scrollWidth-scroll.clientWidth,columns:getComputedStyle(cols).gridTemplateColumns,scrollable:scroll.scrollHeight>scroll.clientHeight};});
   assert(bounds.x>=-1&&bounds.right<=size.width+1&&bounds.overflow<=2&&bounds.scrollOverflow<=2,JSON.stringify({theme,brightness,size,bounds}));
   assert.equal(bounds.columns.split(' ').length,size.width>=900?2:1);
   assert(await modal().locator('.sf_bond_tab>span').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height<35)), 'Character names must stay on one line');
   assert.equal(await modal().evaluate(e=>getComputedStyle(e,'::before').clipPath),'none','Outer corners must not inherit another popup clipping mask');
   measurements.push({theme,brightness,width:size.width,...bounds});
   if(theme==='cozy'){
    await modal().locator('.sf_pop_scroll').evaluate(e=>e.scrollTop=0);
    await p.screenshot({path:path.join(out,`${size.width}-${brightness}-game.png`)});
    await modal().screenshot({path:path.join(out,`${size.width}-${brightness}-popup.png`)});
    // A full-content view is explicitly supplemental; actual viewport captures are above.
    if(brightness==='light'){
     await p.setViewportSize({width:size.width,height:1900});await modal().locator('.sf_pop_scroll').evaluate(e=>e.scrollTop=0);
     await modal().screenshot({path:path.join(out,`${size.width}-full-content.png`)});
     await p.setViewportSize(size);
    }
   }
  }
  passed.push('30 theme/brightness/viewport combinations: bounds, no horizontal overflow, mobile 1 column / desktop 2 columns');
  await p.setViewportSize({width:320,height:900});
  await modal().locator('.sf_pop_scroll').evaluate(e=>e.scrollTop=e.scrollHeight);
  assert(await modal().locator('.sf_pop_scroll').evaluate(e=>e.scrollTop>0));
  await p.screenshot({path:path.join(out,'320-scroll-bottom.png')});
  await modal().locator('[data-bond-who="horus"]').click(); await images();
  assert.equal(await modal().locator('[role="progressbar"]').getAttribute('aria-valuenow'),'0');
  assert.equal(await modal().locator('[data-bond-who="horus"]').getAttribute('aria-selected'),'true');
  passed.push('internal scroll and Set/Horus tabs');
  for(const n of [0,12,100]){
   await p.evaluate(n=>{bt.state.getState().bond.horus.pts=n;bt.close();bt.close=bt.ui.bondCard(bt.win.gameUi(),'horus');},n);
   assert.equal(await modal().locator('[role="progressbar"]').getAttribute('aria-valuenow'),String(n));
   assert.equal(await modal().locator('.sf_bond_fill').evaluate(e=>e.style.width),`${n}%`);
  }
  passed.push('gauge 0/12/100 uses saved points');
  await p.evaluate(()=>{const s=bt.state.getState();s.party={lead:'horus',with:'set'};bt.close();bt.close=bt.ui.bondCard(bt.win.gameUi(),'horus');});
  assert(await modal().locator('.sf_bond_give').isDisabled());
  await p.evaluate(()=>{const s=bt.state.getState();s.party={lead:'somang',with:'set'};bt.close();bt.close=bt.ui.bondCard(bt.win.gameUi(),'set');});
  const before=await p.evaluate(()=>bt.state.getState().bag.items.length);
  await modal().locator('.sf_bond_give').click();
  assert.equal(await p.evaluate(()=>bt.state.getState().bag.items.length),before-1);
  await modal().locator('.sf_bond_give').click();
  assert.equal(await p.evaluate(()=>bt.state.getState().bag.items.length),before-1);
  assert(await p.getByText('오늘의 두 번째 선물',{exact:true}).isVisible());
  passed.push('real gift button consumes once; repeat requires confirmation; Somang absent disables');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed,measurements,errors,failed,usedPNG:[...used].sort(),fixture:'Display examples isolated to test metadata, restored after capture'},null,2));
  console.log(JSON.stringify({passed,errors,failed}));
 }finally{
  await p.screenshot({path:path.join(out,'last-screen.png')}).catch(()=>{});
  if(saved)await p.evaluate(async saved=>{await bt.win.closeGame();const c=SillyTavern.getContext();c.chatMetadata.sand_feather=saved.state;c.extensionSettings.sand_feather=saved.settings;await c.saveMetadata();},saved).catch(()=>{});
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
