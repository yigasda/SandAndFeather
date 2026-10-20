// Isolated ST: compare canvas pixels with/without the merchant, across time and orientation.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.argv[2]||'/tmp/landscape');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const c=await b.newContext({viewport:{width:900,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage(),cdp=await c.newCDPSession(p),errors=[];
 p.on('pageerror',e=>{if(!/Internal S|Host not/.test(e.message))errors.push(e.message)});
 const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id}))});
 const camera=()=>p.evaluate(()=>T.win.testCamera());
 const box=sel=>p.locator(sel).boundingBox();
 const center=async sel=>{const r=await box(sel);return[r.x+r.width/2,r.y+r.height/2]};
 const pinch=async (a,b,aa,bb)=>{await touch('touchStart',[[...a,1],[...b,2]]);for(let i=1;i<=8;i++){await touch('touchMove',[[a[0]+(aa[0]-a[0])*i/8,a[1]+(aa[1]-a[1])*i/8,1],[b[0]+(bb[0]-b[0])*i/8,b[1]+(bb[1]-b[1])*i/8,2]]);await p.waitForTimeout(25)}await touch('touchEnd',[]);await p.waitForTimeout(180)};
 const pass=s=>console.log('PASS '+s);
 try {
  if(process.env.BASELINE)for(const file of ['src/world/render.js','src/ui/hud.js','style.css'])await p.route('**/SandAndFeather/'+file,r=>r.fulfill({contentType:file.endsWith('.css')?'text/css':'text/javascript',body:require('child_process').execFileSync('git',['show','56cd1507:'+file],{encoding:'utf8'})}));
  await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
  const save=p.locator('button:visible,.menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
  await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);await p.waitForSelector('#sf_open',{state:'attached'});
  await p.evaluate(async()=>{window.T={};for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',player:'world/player',field:'packs/duat/field',data:'core/data'}))T[k]=await import('/scripts/extensions/third-party/SandAndFeather/src/'+v+'.js');T.state.resetState();await T.win.openGame();window.toastr?.clear();});
  await p.evaluate(async()=>{
   const {Renderer}=await import('/scripts/extensions/third-party/SandAndFeather/src/world/render.js');
   const draw=Renderer.prototype.draw,person=Renderer.prototype.person;
   Renderer.prototype.draw=function(scene){window.npcScene={renderer:this,scene};return draw.call(this,scene)};
   Renderer.prototype.person=function(...args){if(window.hideMerchant&&args[1]==='townsman')return;return person.apply(this,args)};
   T.state.getState().party={lead:'horus',with:'set'};
  });

  await p.evaluate(async()=>{const s=T.state.getState();s.date={year:1,month:2,day:8};s.part='dawn';s.wake=null;s.adv.cur.steps[s.adv.cur.step].text='얼룩 고양이를 따라가 보자.';await T.win.travel('ombos',{x:14,y:17.5});});await p.waitForTimeout(250);
  const pixels=()=>p.evaluate(()=>{const c=npcScene.renderer.art.get('townsman|down');return [...c.getContext('2d').getImageData(0,0,c.width,c.height).data].filter((v,i)=>i%4===3&&v).length;});
  const original=await pixels(),recovery=[];
  for(const kind of ['main-context','sprite-context','visibility','reopen']){
   await p.evaluate(async kind=>{const r=npcScene.renderer,c=r.art.get('townsman|down');c.width=c.width;
    if(kind==='main-context')r.cv.dispatchEvent(new Event('contextrestored'));
    if(kind==='sprite-context')c.dispatchEvent(new Event('contextrestored'));
    if(kind==='visibility')document.dispatchEvent(new Event('visibilitychange'));
    if(kind==='reopen'){await T.win.closeGame();await T.win.openGame();}
   },kind);await p.waitForTimeout(250);const count=await pixels();recovery.push({kind,original,count});
   await p.screenshot({path:path.join(out,'npc-'+kind+'.png')});
   // Restore the fixture only, so the next failure injection is independent.
   await p.evaluate(()=>npcScene.renderer.setSprites(T.data.DATA.sprites));
  }
  await p.evaluate(()=>{window.rotationEvents=[];window.addEventListener('orientationchange',e=>rotationEvents.push({kind:e.type,trusted:e.isTrusted}));window.addEventListener('resize',e=>rotationEvents.push({kind:e.type,trusted:e.isTrusted}));});
  const style=await p.addStyleTag({content:'#sf_game .sf_chip{font-size:24px!important} #sf_game .sf_hint_pill{font-size:16px!important}'}),rows=[];
  for(const theme of ['classic','walnut','journal','temple','cozy']){
   await p.evaluate(theme=>{T.settings.settings().uiTheme=theme;T.win.applyTheme();},theme);
   for(const [w,h]of [[844,390],[390,844],[640,360],[844,390]]){
    await p.setViewportSize({width:w,height:h});await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:2,mobile:true,screenOrientation:{type:w>h?'landscapePrimary':'portraitPrimary',angle:w>h?90:0}});await p.waitForTimeout(250);
    const r=await p.evaluate(()=>{const cs=[...document.querySelectorAll('.sf_chips > *')].map(e=>e.getBoundingClientRect()),h=document.querySelector('.sf_hint_pill').getBoundingClientRect();const d=document.querySelector('.sf_date_card').getBoundingClientRect();return{hintTop:h.top,chipBottom:Math.max(...cs.map(r=>r.bottom)),hintLeft:h.left,hintRight:h.right,chipLeft:Math.min(...cs.map(r=>r.left)),chipRight:Math.max(...cs.map(r=>r.right)),dateHeight:d.height,dateRatio:d.height/parseFloat(getComputedStyle(document.querySelector('.sf_date')).fontSize),dateSub:getComputedStyle(document.querySelector('.sf_date_sub')).display,order:[...document.querySelectorAll('.sf_chips>*')].sort((a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.top-y.top||x.left-y.left}).map(e=>e.classList.contains('sf_chip_sun')?'sun':e.classList.contains('sf_chip_deben')?'deben':'rank'),viewport:innerWidth};});rows.push({theme,w,h,...r,overlap:r.hintTop<r.chipBottom});if(theme==='cozy')await p.screenshot({path:path.join(out,`panel-${w}-${h}.png`)});
   }
  }
  await p.setViewportSize({width:640,height:360});await p.waitForTimeout(250);const expanded=await p.locator('.sf_hint_pill').evaluate(e=>e.getBoundingClientRect().top);
  await p.evaluate(async()=>{await T.win.closeGame();await T.win.openGame();});await p.waitForTimeout(250);const reopened=await p.evaluate(()=>{const bottom=Math.max(...[...document.querySelectorAll('.sf_chips>*')].map(e=>e.getBoundingClientRect().bottom));return document.querySelector('.sf_hint_pill').getBoundingClientRect().top>=bottom;});
  await style.evaluate(e=>e.remove());await p.waitForTimeout(250);
  const shrunk=await p.evaluate(()=>{const r=document.querySelector('.sf_hint_pill').getBoundingClientRect();return r.top});
  const events=await p.evaluate(()=>rotationEvents);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({recovery,rows,shrunk,reopened,events,errors},null,2));console.log(JSON.stringify({recovery,overlaps:rows.filter(r=>r.overlap),shrunk,errors}));
  assert(recovery.every(r=>r.count===r.original),'static NPC cache must recover with exact original alpha');
  assert(rows.every(r=>!r.overlap&&r.hintRight<=r.viewport+1),'hint must follow wrapped chips');
  for(const r of rows){assert.deepEqual(r.order,['sun','deben','rank']);assert(Math.abs(r.hintLeft-r.chipLeft)<1&&Math.abs(r.hintRight-r.chipRight)<1,JSON.stringify(r));assert(r.hintTop-r.chipBottom>=5&&r.hintTop-r.chipBottom<=7,JSON.stringify(r));if(r.w>r.h){assert(r.dateRatio>=2&&r.dateRatio<=2.5,JSON.stringify(r));assert.equal(r.dateSub,'none');}else assert.equal(r.dateSub,r.theme==='cozy'?'flex':'none');} 
  assert(shrunk<expanded,'hint returns upward after text size normalizes');
  assert(reopened,'wrapped panel must settle after close/open');assert(events.some(e=>e.kind==='orientationchange'&&e.trusted),'real orientation change must fire');
  assert.deepEqual(errors,[]);pass('four NPC recovery paths and five-theme viewport/text reflow sequences');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
