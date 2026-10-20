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
  await p.goto('http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
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
  const rows=[];
  for(const [w,h]of [[390,844],[844,390],[390,844],[844,390]]){
   await p.setViewportSize({width:w,height:h});
   for(const part of ['morning','day','evening','night']){
    await p.evaluate(async part=>{const s=T.state.getState();s.part=part;s.wake=null;await T.win.travel('set_room');await T.win.travel('ombos',{x:13,y:19});},part);await p.waitForTimeout(200);
    const result=await p.evaluate(()=>{
     const {renderer:r,scene}=npcScene,n=T.win.currentMap().npcs.find(n=>n.id==='merchant');
     const compare=()=>{window.hideMerchant=false;r.draw(scene);const yes=r.g.getImageData(0,0,r.cv.width,r.cv.height).data;window.hideMerchant=true;r.draw(scene);const no=r.g.getImageData(0,0,r.cv.width,r.cv.height).data;let diff=0;for(let i=0;i<yes.length;i+=4)if(yes[i]!==no[i]||yes[i+1]!==no[i+1]||yes[i+2]!==no[i+2])diff++;window.hideMerchant=false;r.draw(scene);return diff;};
     const initial=compare();const saved=r.map.d.referenceScenes; r.map.d.referenceScenes=[];const withoutOcclusion=compare();r.map.d.referenceScenes=saved;r.draw(scene);
     return{map:T.win.currentMap().id,npcs:T.win.currentMap().npcs,people:scene.people,part:scene.part,zoom:r.zoom,cam:r.cam,diff:initial,withoutOcclusion};
    });rows.push({w,h,part,...result});console.log(JSON.stringify({w,h,part,diff:result.diff,withoutOcclusion:result.withoutOcclusion,people:result.people.map(p=>p.look)}));
    await p.screenshot({path:path.join(out,`${rows.length}-${w}-${part}.png`)});
   }
  }
  fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(rows,null,2));
  assert(rows.every(r=>r.people.some(p=>p.look==='townsman')),'merchant must enter render list');
  assert(rows.every(r=>r.diff>100),'merchant must contribute visible canvas pixels');
  assert.deepEqual(errors,[]);pass('merchant visible through four orientations, four times, and room round trips');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
