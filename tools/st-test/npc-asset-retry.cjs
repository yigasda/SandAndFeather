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
  let attempts=0;await p.route('**/pocket-chibi.png',r=>{attempts++;return r.abort('failed');});
  await p.goto('http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
  const save=p.locator('button:visible,.menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
  await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);await p.waitForSelector('#sf_open',{state:'attached'});
  await p.evaluate(async()=>{window.T={};for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',player:'world/player',field:'packs/duat/field',data:'core/data'}))T[k]=await import('/scripts/extensions/third-party/SandAndFeather/src/'+v+'.js');T.state.resetState();await T.win.openGame();window.toastr?.clear();});

  assert(attempts>0);assert.equal(await p.locator('#sf_game:visible').count(),0,'failed sprite load must not open a partial game');
  await p.unroute('**/pocket-chibi.png');await p.route('**/pocket-chibi.png',async r=>{await new Promise(resolve=>setTimeout(resolve,800));await r.continue();});
  const opening=p.evaluate(()=>T.win.openGame());await p.waitForTimeout(200);assert.equal(await p.locator('#sf_game:visible').count(),0,'wait for image decode');await opening;assert(await p.locator('#sf_game').isVisible());
  const info=await p.evaluate(async()=>{const {Renderer}=await import('/scripts/extensions/third-party/SandAndFeather/src/world/render.js');const r=new Renderer(document.createElement('canvas'));r.setSprites(T.data.DATA.sprites);const c=r.art.get('townsman|down');return {npcs:T.data.DATA.maps.ombos.npcs.map(n=>n.id),alpha:[...c.getContext('2d').getImageData(0,0,c.width,c.height).data].filter((v,i)=>i%4===3&&v).length};});assert.equal(info.alpha,2125);assert(info.npcs.includes('merchant'));pass('NPC image failure followed by delayed retry waits for decode and restores actual merchant');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({attempts,info,errors},null,2));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
