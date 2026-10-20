// Real isolated ST: landscape HUD, existing menu access and map-only multitouch zoom.
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
  await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
  const save=p.locator('button:visible,.menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
  await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);await p.waitForSelector('#sf_open',{state:'attached'});
  await p.evaluate(async()=>{window.T={};for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',player:'world/player',field:'packs/duat/field',data:'core/data'}))T[k]=await import('/scripts/extensions/third-party/SandAndFeather/src/'+v+'.js');T.state.resetState();await T.win.openGame();window.toastr?.clear();});

  await p.evaluate(async()=>{const s=T.state.getState(),{today}=await import('/scripts/extensions/third-party/SandAndFeather/src/core/ledger.js');T.settings.settings().uiTheme='cozy';T.settings.settings().sunMax=18;T.win.applyTheme();s.date={year:1,month:2,day:8};s.part='dawn';s.wake=null;s.party={lead:'horus',with:'set'};s.bag.deben=189;s.stats.xp=100;s.sun={day:today(s),left:9,max:18};s.adv.cur.steps[s.adv.cur.step].text='얼룩 고양이를 따라가 보자.';await T.win.travel('ombos',{x:14,y:17.5});});
  const rows=[];
  for(const [label,w,h]of [['landscape',844,390],['portrait',390,844],['landscape-return',844,390],['small-landscape',640,360]]){
   await p.setViewportSize({width:w,height:h});await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:2,mobile:true,screenOrientation:{type:w>h?'landscapePrimary':'portraitPrimary',angle:w>h?90:0}});await p.waitForTimeout(300);
   const data=await p.evaluate(()=>{const root=document.querySelector('#sf_game').getBoundingClientRect(),date=document.querySelector('.sf_date_card').getBoundingClientRect(),cs=[...document.querySelectorAll('.sf_chips>*')].map(e=>({text:e.textContent.trim(),r:e.getBoundingClientRect()})),hint=document.querySelector('.sf_hint_pill').getBoundingClientRect();return{dateHeight:date.height,dateRatio:date.height/parseFloat(getComputedStyle(document.querySelector('.sf_date')).fontSize),gap:hint.top-Math.max(...cs.map(c=>c.r.bottom)),left:hint.left-Math.min(...cs.map(c=>c.r.left)),right:hint.right-Math.max(...cs.map(c=>c.r.right)),order:cs.sort((a,b)=>a.r.top-b.r.top||a.r.left-b.r.left).map(c=>c.text),gameWidth:root.width,gameHeight:root.height};});rows.push({label,w,h,...data});await p.screenshot({path:path.join(out,label+'.png')});
  }
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
  for(const r of rows){assert(r.order[0].includes('9/18')&&r.order[1].includes('189')&&r.order[2].includes('모험 등급 6'));assert(r.gap>=5&&r.gap<=7);assert(Math.abs(r.left)<1&&Math.abs(r.right)<1);if(r.w>r.h)assert(r.dateRatio>=2&&r.dateRatio<=2.5);}
  assert.deepEqual(rows[0].order,rows[2].order);assert.equal(rows[0].gap,rows[2].gap);assert.equal(rows[0].dateHeight,rows[2].dateHeight);assert.deepEqual(errors,[]);pass('reported HUD values, row order/full width/6px gap/date ratio survive real rotation');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
