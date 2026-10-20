// Isolated ST: portrait/landscape HUD parity, map zoom retention and real touch regression.
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
  await p.goto('http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
  const save=p.locator('button:visible,.menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
  await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);await p.waitForSelector('#sf_open',{state:'attached'});
  await p.evaluate(async()=>{window.T={};for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',player:'world/player',field:'packs/duat/field',data:'core/data'}))T[k]=await import('/scripts/extensions/third-party/SandAndFeather/src/'+v+'.js');T.state.resetState();await T.win.openGame();window.toastr?.clear();});
  if(!process.env.GESTURES_ONLY) for(const [w,h] of [[390,844],[320,740],[412,900],[844,390]]) {
   await p.setViewportSize({width:w,height:h});
   for(const theme of ['classic','walnut','journal','temple','cozy']) {
    await p.evaluate(async theme=>{T.settings.settings().uiTheme=theme;T.win.applyTheme();T.state.getState().party.with='set';await T.win.travel('desert_forecourt_west','yard');T.field.testOnly('desert_leather_shield',0,0,{hp:999,speed:0,range:0});},theme);await p.waitForTimeout(200);
    const check=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),date=r('.sf_date_card'),hp=r('.sf_duat_hud'),rank=r('.sf_chips'),hint=r('.sf_hint_pill');return{aligned:Math.abs(date.left-hp.left)<1,dateAbove:date.bottom<=hp.top,rankAligned:document.querySelector('.sf_hint_pill').hidden||Math.abs(rank.left-hint.left)<1,hintBelow:document.querySelector('.sf_hint_pill').hidden||hint.top>=Math.max(...[...document.querySelectorAll('.sf_chips > *')].map(e=>e.getBoundingClientRect().bottom)),labels:[...document.querySelectorAll('.sf_duat_bar span')].every(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight),visible:['.sf_date_card','.sf_duat_hud','.sf_mini','.sf_menu','.sf_appearance','.sf_bag','.sf_pad','.sf_talk','.sf_duat_btns'].every(s=>{const b=r(s);return b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight}),noOldControls:getComputedStyle(document.querySelector('.sf_side_btns')).display==='none'};});
    assert(Object.values(check).every(Boolean),JSON.stringify({w,h,theme,check}));
    if(w===390||w===844) await p.screenshot({path:path.join(out,`${w}-${theme}-combat.png`)});
    await p.locator('.sf_menu').click();await p.locator('[data-tab="bond"]').click();
    const menu=await p.locator('.sf_menu_window').evaluate(e=>{const nav=e.querySelector('.sf_menu_nav').getBoundingClientRect(),title=e.querySelector('.sf_pop_title').getBoundingClientRect(),scroll=e.querySelector('.sf_pop_scroll');return{navVisible:nav.width>0,navBelow:innerWidth>innerHeight||nav.top>=title.bottom,overflow:scroll.scrollWidth-scroll.clientWidth};});
    assert((w<h?!menu.navVisible:menu.navVisible&&menu.navBelow)&&menu.overflow<3,JSON.stringify({w,theme,menu}));
    if(w===390||w===844) await p.screenshot({path:path.join(out,`${w}-${theme}-menu.png`)});
    await p.locator('.sf_pop_x').last().click();
   }
   pass(`${w}x${h} five themes: home parity, readable HUD, menu art/navigation/bounds`);
  }
  for(const [w,h] of [[390,844],[844,390]]) {
   await p.setViewportSize({width:w,height:h});await p.evaluate(()=>T.win.travel('ombos',{x:24,y:18}));await p.waitForTimeout(200);
   const y=w<h?420:220, a=[w*.4,y], b=[w*.6,y];
   // Start low then choose a distinct user zoom; actual touch input on canvas only.
   await pinch([w*.2,y],[w*.8,y],[w*.48,y],[w*.52,y]);
   const low=(await camera()).zoom;await pinch(a,b,[w*.2,y],[w*.8,y]);const chosen=(await camera()).zoom;assert(chosen>low*1.2);
   for(const map of ['desert_golden_dunes','desert_forecourt_west','set_room','ombos']) {
    await p.evaluate(map=>T.win.travel(map),map);await p.waitForTimeout(180);const z=await camera();assert(Math.abs(z.zoom-Math.max(z.min,Math.min(z.max,chosen)))<.01,JSON.stringify({map,chosen,z}));
    for(const[x,y]of [[0,0],[999,0],[0,999],[999,999]]){await p.evaluate(({x,y})=>Object.assign(T.player.player,{x,y}),{x,y});await p.waitForTimeout(140);const a=await camera(),mw=a.mapWidth*16*a.zoom,mh=a.mapHeight*16*a.zoom;assert(mw<a.width||a.cam.x>=-.01&&a.cam.x+a.width<=mw+.01);assert(mh<a.height||a.cam.y>=-.01&&a.cam.y+a.height<=mh+.01);}
   }
   assert(Math.abs((await camera()).zoom-chosen)<.01);
   await p.evaluate(()=>T.win.travel('ombos',{x:24,y:18}));
   const pad=await center('.sf_pad');await pinch(pad,b,pad,[w*.8,y]);assert.equal((await camera()).zoom,chosen);
   // Canvas + UI never zooms, and touch pad still moves after pinching.
   const pos=await p.evaluate(()=>({...T.player.player}));await touch('touchStart',[[...pad,1]]);await touch('touchMove',[[pad[0]+25,pad[1],1]]);await p.waitForTimeout(350);await touch('touchEnd',[]);assert(await p.evaluate(pos=>Math.hypot(T.player.player.x-pos.x,T.player.player.y-pos.y)>.2,pos));
   await p.evaluate(()=>{T.state.getState().bond.ties=Array.from({length:15},(_,i)=>({id:'scroll-fixture'+i,who:'set',when:'Hathyr 5 · 낮',where:'',title:'함께한 기록 '+i,summary:'격리 시험 기록',origin:'manual',src:[],kind:'gift'}));});await p.locator('.sf_menu').click();await p.locator('[data-tab="bond"]').click();const before=(await camera()).zoom;
   await pinch(a,b,[w*.2,y],[w*.8,y]);assert.equal((await camera()).zoom,before);
   if(w<h){await p.setViewportSize({width:w,height:640});await p.waitForTimeout(200);const scroll=p.locator('.sf_menu_window .sf_pop_scroll');const r=await scroll.boundingBox();await touch('touchStart',[[r.x+r.width*.5,r.y+r.height*.8,1]]);for(let i=1;i<=8;i++){await touch('touchMove',[[r.x+r.width*.5,r.y+r.height*.8-i*25,1]]);await p.waitForTimeout(30)}await touch('touchEnd',[]);await p.waitForTimeout(200);console.log('scroll',await scroll.evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight,action:getComputedStyle(e).touchAction})));await p.screenshot({path:path.join(out,'scroll-diagnostic.png')});assert(await scroll.evaluate(e=>e.scrollTop>0),'portrait menu touch scroll');await p.screenshot({path:path.join(out,'390-menu-touch-scroll.png')});await p.setViewportSize({width:w,height:h});}
   await p.locator('.sf_pop_x').last().click();await p.locator('.sf_menu').click();await p.locator('.sf_menu_fold').click();await p.locator('#sf_chip').click();assert.equal((await camera()).zoom,chosen);
   await p.screenshot({path:path.join(out,`${w}-exploration-zoom.png`)});
   pass(`${w}x${h}: pinch, map round trip with limits, four camera corners, mixed touches, movement, popup exclusion, fold/reopen`);
  }
  assert.deepEqual(errors,[]);pass('no page errors');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
