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
  await p.evaluate(async()=>{T.state.getState().party.with='set';await T.win.travel('desert_forecourt_west','yard');T.field.testOnly('desert_leather_shield',0,0,{hp:999,speed:0,range:0});});
  const rows=[];
  for(const theme of ['classic','walnut','journal','temple','cozy'])for(const[w,h]of [[844,390],[390,844],[320,740],[844,390]]){
   await p.setViewportSize({width:w,height:h});await p.evaluate(theme=>{T.settings.settings().uiTheme=theme;T.win.applyTheme();},theme);await p.waitForTimeout(200);
   const r=await p.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect(),date=box('.sf_date_card'),visible=[...document.querySelector('.sf_date_card').children].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect()),hint=box('.sf_hint_pill'),hp=box('.sf_duat_hud'),cs=[...document.querySelectorAll('.sf_chips>*')].map(e=>e.getBoundingClientRect());return{dateToChips:Math.min(...cs.map(x=>x.top))-date.bottom,chipLeft:Math.min(...cs.map(x=>x.left))-hint.left,chipRight:Math.max(...cs.map(x=>x.right))-hint.right,dateCenterError:(Math.min(...visible.map(x=>x.top))+Math.max(...visible.map(x=>x.bottom)))/2-(date.top+date.bottom)/2,hintGap:hint.top-Math.max(...cs.map(x=>x.bottom)),hpGap:hp.top-hint.bottom,hpLeft:hp.left-hint.left,hpRight:hp.right-hint.right,hpText:document.querySelector('.sf_duat_hud').textContent,labels:[...document.querySelectorAll('.sf_duat_bar span')].every(e=>e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight),subtitle:getComputedStyle(document.querySelector('.sf_date_sub')).display};});
   rows.push({theme,w,h,...r});assert(Math.abs(r.dateCenterError)<1,JSON.stringify(rows.at(-1)));assert(r.hintGap>=5&&r.hintGap<=7);assert(r.labels);if(w<h){assert(r.dateToChips>=5&&r.dateToChips<=7,JSON.stringify(rows.at(-1)));assert(Math.abs(r.chipLeft)<1&&Math.abs(r.chipRight)<1);assert(r.hpGap>=5&&r.hpGap<=7,JSON.stringify(rows.at(-1)));assert(Math.abs(r.hpLeft)<1&&Math.abs(r.hpRight)<1);}
   if(theme==='cozy')await p.screenshot({path:path.join(out,`cozy-${w}.png`)});
  }
  await p.setViewportSize({width:320,height:740});await p.addStyleTag({content:'#sf_game .sf_chip{font-size:24px!important} #sf_game .sf_hint_pill{font-size:20px!important}'});await p.waitForTimeout(250);
  const wrapped=await p.evaluate(()=>{const h=document.querySelector('.sf_hint_pill').getBoundingClientRect(),hp=document.querySelector('.sf_duat_hud').getBoundingClientRect();return{gap:hp.top-h.bottom,left:hp.left-h.left,right:hp.right-h.right};});assert(wrapped.gap>=5&&wrapped.gap<=7&&Math.abs(wrapped.left)<1&&Math.abs(wrapped.right)<1,JSON.stringify(wrapped));
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({rows,errors},null,2));assert.deepEqual(errors,[]);pass('five themes: centered date block and portrait status -> hint -> combat HP aligned across rotations');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
