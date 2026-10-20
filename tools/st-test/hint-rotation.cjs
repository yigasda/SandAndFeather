// Isolated ST: adventure hint geometry across rotation and interrupted pinch recovery.
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
  if(process.env.BASELINE) await p.route('**/SandAndFeather/style.css*',r=>r.fulfill({contentType:'text/css',body:require('child_process').execFileSync('git',['show','717fee00:style.css'],{encoding:'utf8'})}));
  await p.goto('http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
  const save=p.locator('button:visible,.menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
  await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);await p.waitForSelector('#sf_open',{state:'attached'});
  await p.evaluate(async()=>{window.T={};for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',player:'world/player',field:'packs/duat/field',data:'core/data'}))T[k]=await import('/scripts/extensions/third-party/SandAndFeather/src/'+v+'.js');T.state.resetState();await T.win.openGame();window.toastr?.clear();});
  const results=[];
  await p.evaluate(async()=>{const s=T.state.getState();s.adv.cur.steps[s.adv.cur.step].text='얼룩 고양이를 따라가 보자.';await T.win.travel('ombos',{x:24,y:18});});
  for(const theme of ['classic','walnut','journal','temple','cozy']) {
   await p.evaluate(theme=>{T.settings.settings().uiTheme=theme;T.win.applyTheme();},theme);
   const rows=[];
   for(const [label,w,h]of [['first-landscape',844,390],['portrait',390,844],['return-landscape',844,390],['portrait-again',390,844],['return-again',844,390]]) {
    await p.setViewportSize({width:w,height:h});await p.waitForTimeout(300);
    rows.push(await p.evaluate(()=>{const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,inline:e.getAttribute('style')};};return{hint:rect('.sf_hint_pill'),chips:rect('.sf_chips'),rank:rect('.sf_chip_rank'),date:rect('.sf_date_card'),mini:rect('.sf_mini')};}));
    await p.screenshot({path:path.join(out,`${theme}-${label}.png`)});
   }
   assert.deepEqual(rows[0],rows[2],`${theme} landscape changed after portrait`);assert.deepEqual(rows[0],rows[4]);assert.deepEqual(rows[1],rows[3]);
   results.push({theme,rows});pass(theme+' event hint rotation stable');
  }
  fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(results,null,2));
  // Two-finger gesture interrupted by rotation must not leave a stale pinch or suppress the next pair.
  for(const [w,h]of [[390,844],[844,390],[390,844]]) {
   await touch('touchStart',[[350,220,1],[500,220,2]]);await p.setViewportSize({width:w,height:h});await touch('touchCancel',[]);await p.waitForTimeout(200);
   const y=w<h?420:220;await pinch([w*.2,y],[w*.8,y],[w*.48,y],[w*.52,y]);const before=(await camera()).zoom;await pinch([w*.4,y],[w*.6,y],[w*.2,y],[w*.8,y]);assert((await camera()).zoom>before*1.2);pass(`${w}x${h} pinch recovers after rotation/cancel`);
  }
  assert.deepEqual(errors,[]);
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
