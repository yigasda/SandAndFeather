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
  await p.goto('http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
  const save=p.locator('button:visible,.menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
  await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);await p.waitForSelector('#sf_open',{state:'attached'});
  await p.evaluate(async()=>{window.T={};for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',player:'world/player',field:'packs/duat/field',data:'core/data'}))T[k]=await import('/scripts/extensions/third-party/SandAndFeather/src/'+v+'.js');T.state.resetState();await T.win.openGame();window.toastr?.clear();});
  for(const [w,h]of [[900,412],[740,360],[640,360]]){
   await p.setViewportSize({width:w,height:h});
   for(const theme of ['classic','walnut','journal','temple','cozy']){
    await p.evaluate(async theme=>{T.settings.settings().uiTheme=theme;T.win.applyTheme();const s=T.state.getState();s.party.with='set';await T.win.travel('desert_forecourt_west','yard');T.field.testOnly('desert_leather_shield',0,0,{hp:999,speed:0,range:0});},theme);await p.waitForTimeout(350);
    const check=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(),date=r('.sf_date_card'),hp=r('.sf_duat_hud'),rank=r('.sf_chips'),hint=r('.sf_hint_pill'),mini=r('.sf_mini'),pad=r('.sf_pad');return{aligned:Math.abs(date.left-hp.left)<1,dateAbove:date.bottom<=hp.top,rankAligned:document.querySelector('.sf_hint_pill').hidden||Math.abs(rank.left-hint.left)<1,hintBelow:document.querySelector('.sf_hint_pill').hidden||hint.top>=Math.max(...[...document.querySelectorAll('.sf_chips > *')].map(e=>e.getBoundingClientRect().bottom)),labels:[...document.querySelectorAll('.sf_duat_bar span')].every(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight),visible:['.sf_date_card','.sf_duat_hud','.sf_mini','.sf_menu','.sf_appearance','.sf_bag','.sf_pad','.sf_talk','.sf_duat_btns'].every(s=>{const b=r(s);return b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight}),safe:hp.bottom<pad.top&&mini.bottom<r('.sf_menu').top&&r('.sf_chips').right<=mini.left,bagIcon:getComputedStyle(document.querySelector('.sf_bag i')).opacity==='1'};});
    assert(Object.values(check).every(Boolean),JSON.stringify({w,h,theme,check}));
    for(const tab of ['party','bond','quests','map']){await p.locator('.sf_menu').click();await p.locator(`[data-tab="${tab}"]`).click();assert(await p.locator('.sf_pop_wrap').count());await p.locator('.sf_pop_wrap').last().locator('.sf_pop_x').click();}
    if(w===900&&theme==='cozy')await p.screenshot({path:path.join(out,'combat.png')});
   }
   pass(`${w}x${h}: five themes, HUD columns/labels/bounds, four menu destinations`);
  }
  await p.setViewportSize({width:900,height:412});await p.evaluate(()=>T.win.travel('ombos',{x:24,y:18}));await p.waitForTimeout(200);await p.screenshot({path:path.join(out,'exploration.png')});
  const z=(await camera()).zoom;await pinch([350,220],[500,220],[300,220],[550,220]);assert((await camera()).zoom>z*1.5);pass('map-only two-finger pinch zooms in');
  let before=(await camera()).zoom;const pad=await center('.sf_pad');await pinch(pad,[500,220],pad,[600,220]);assert.equal((await camera()).zoom,before);pass('joystick plus map finger does not zoom');
  await p.locator('.sf_menu').click();await p.locator('[data-tab="party"]').click();
  before=(await camera()).zoom;await pinch([350,220],[500,220],[300,220],[550,220]);assert.equal((await camera()).zoom,before);await p.locator('.sf_pop_x').last().click();pass('popup touches never zoom the map');
  before=(await camera()).zoom;await touch('touchStart',[[350,220,1],[500,220,2]]);await touch('touchCancel',[]);await touch('touchStart',[[350,220,1]]);await touch('touchMove',[[300,220,1]]);await touch('touchEnd',[]);assert.equal((await camera()).zoom,before);pass('cancel clears pinch state');
  for(const map of ['ombos','set_room','desert_golden_dunes','desert_forecourt_west']){
   await p.evaluate(map=>T.win.travel(map),map);await p.waitForTimeout(200);
   await pinch([300,220],[600,220],[445,220],[455,220]);const a=await camera();assert(Math.abs(a.zoom-a.min)<0.01,JSON.stringify({map,a}));
   for(const[x,y]of [[0,0],[999,999]]){await p.evaluate(({x,y})=>Object.assign(T.player.player,{x,y}),{x,y});await p.waitForTimeout(180);const a=await camera(),mw=a.mapWidth*16*a.zoom,mh=a.mapHeight*16*a.zoom;assert(mw<a.width||a.cam.x>=-0.01&&a.cam.x+a.width<=mw+.01);assert(mh<a.height||a.cam.y>=-.01&&a.cam.y+a.height<=mh+.01);}
  }
  pass('four map sizes clamp zoom-out and both camera edges');
  await p.setViewportSize({width:412,height:900});await p.evaluate(()=>T.win.travel('ombos',{x:24,y:18}));assert(await p.locator('.sf_menu').isVisible());await p.locator('.sf_menu').click();assert(await p.locator('.sf_tabs').isVisible());await p.locator('[data-tab="party"]').click();await p.locator('.sf_pop_x').last().click();pass('portrait menu opens existing destinations');
  await p.setViewportSize({width:900,height:412});await p.locator('.sf_menu').click();await p.locator('.sf_menu_fold').click();assert(await p.locator('#sf_chip').isVisible());await p.locator('#sf_chip').click();await p.locator('.sf_menu').click();await p.locator('.sf_menu_close').click();assert(!await p.locator('#sf_game').isVisible());pass('landscape menu fold/reopen/close work');
  assert.deepEqual(errors,[]);pass('no game page errors');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
