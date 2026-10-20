const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=process.argv[2]||'/tmp/door-neutral';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const errors=[];const p=await b.newPage({viewport:{width:844,height:390}});
p.on('pageerror',e=>errors.push(e.message));
await p.route('**/src/ui/window.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(process.env.BASELINE?(await r.text()).replace('doorNeedsNeutral = Math.hypot(input.dx, input.dy) > 0.15;', 'doorNeedsNeutral = true;'):await r.text())+`\nexport const __probe={pause:()=>cancelAnimationFrame(raf),resume:()=>{last=performance.now();raf=requestAnimationFrame(frame)},get:()=>({doorNeedsNeutral,doorArmed,moving,card:cardOpen(),dx:input.dx,dy:input.dy,map:player.map,x:player.x,y:player.y,feet:feet(),exit:map.exitAt(feet().x,feet().y),solidAtFeet:map.solidAt(feet().x,feet().y),overlays:map.open,focus:document.activeElement?.tagName})};`});});
  await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
  const save=p.locator('button:visible,.menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
  await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);await p.waitForSelector('#sf_open',{state:'attached'});
  await p.evaluate(async()=>{window.T={};for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',player:'world/player',field:'packs/duat/field',data:'core/data'}))T[k]=await import('/scripts/extensions/third-party/SandAndFeather/src/'+v+'.js');T.state.resetState();await T.win.openGame();window.toastr?.clear();});
 for(let run=0;run<Number(process.env.REPEATS||1);run++){
 await p.evaluate(()=>T.win.__probe.pause());
 await p.evaluate(async()=>{await T.win.travel('ombos',{x:24.9,y:10.6,dir:'up'});document.activeElement?.blur();});
 const before=await p.evaluate(()=>T.win.__probe.get());
 await p.keyboard.down('ArrowUp');await p.evaluate(()=>T.win.__probe.resume());await p.waitForTimeout(2500);const atHeld=await p.evaluate(()=>T.win.__probe.get());await p.keyboard.up('ArrowUp');
 const after=await p.evaluate(()=>({gate:T.win.__probe.get(),map:T.player.player.map,x:T.player.player.x,y:T.player.player.y}));
 fs.writeFileSync(path.join(out,'result-'+run+'.json'),JSON.stringify({before,atHeld,after,errors},null,2));console.log(JSON.stringify({run,before,atHeld,after,errors}));assert.equal(after.map,'temple_courtyard');console.log('PASS neutral arrival then immediate key must enter temple without another release');
 await p.evaluate(()=>T.win.__probe.pause());await p.keyboard.down('ArrowUp');
 await p.evaluate(async()=>T.win.travel('ombos',{x:24.9,y:10.6,dir:'up'}));
 const held=await p.evaluate(()=>T.win.__probe.get());assert(held.doorNeedsNeutral);
 await p.evaluate(()=>T.win.__probe.resume());await p.waitForTimeout(1500);
 assert.equal(await p.evaluate(()=>T.player.player.map),'ombos');await p.keyboard.up('ArrowUp');await p.waitForTimeout(100);
 assert.equal(await p.evaluate(()=>T.win.__probe.get().doorNeedsNeutral),false);
 console.log('PASS held arrival still requires release; no chained doorway transition');
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
