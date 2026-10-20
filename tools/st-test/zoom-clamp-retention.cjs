// Isolated ST: a temporary minimum zoom clamp must not replace the selected preference.
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

  const rows=[];
  for(const [w,h]of [[390,844],[844,390]]){
   await p.setViewportSize({width:w,height:h});await p.evaluate(()=>T.win.travel('desert_golden_dunes'));await p.waitForTimeout(200);const y=w<h?420:220;
   await pinch([w*.2,y],[w*.8,y],[w*.49,y],[w*.51,y]);const chosen=(await camera()).zoom;let clamped=false;
   for(const map of ['set_room','ombos','desert_forecourt_west','desert_golden_dunes']){await p.evaluate(map=>T.win.travel(map),map);await p.waitForTimeout(180);const cam=await camera();assert(Math.abs(cam.zoom-Math.max(cam.min,Math.min(cam.max,chosen)))<.01);clamped ||= cam.min>chosen;rows.push({w,h,map,chosen,...cam});}
   assert(clamped,'test must cross a map requiring a larger minimum');assert(Math.abs((await camera()).zoom-chosen)<.01);pass(`${w}x${h}: low preference survives temporary minimum clamp`);
  }
  fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(rows,null,2));assert.deepEqual(errors,[]);
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
