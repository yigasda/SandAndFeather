// Bounded same-viewport profile; timings are lab measurements, not phone FPS.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const out=process.argv[2]||'/tmp/sf-movement-profile';fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];
for(const [version,dir] of [['0.9.91','/tmp/sf-perf-0991'],['0.9.92','/workspace/landscape-release-final'],['candidate','/workspace/SandAndFeather']]){
 if(process.env.PROFILE_VERSION&&version!==process.env.PROFILE_VERSION)continue;
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await c.newPage(),cdp=await c.newCDPSession(p);
 await p.route('**/scripts/extensions/third-party/SandAndFeather/**',async r=>{const rel=new URL(r.request().url()).pathname.split('/SandAndFeather/')[1];await r.fulfill({path:path.join(dir,decodeURIComponent(rel))});});
  await p.goto(process.env.BASE_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>!!window.SillyTavern?.getContext);await p.waitForTimeout(2500);
  const save=p.locator('button:visible,.menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
  await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);await p.waitForSelector('#sf_open',{state:'attached'});
  await p.evaluate(async()=>{window.T={};for(const[k,v]of Object.entries({win:'ui/window',state:'core/state',settings:'core/settings',player:'world/player',field:'packs/duat/field',data:'core/data'}))T[k]=await import('/scripts/extensions/third-party/SandAndFeather/src/'+v+'.js');T.state.resetState();await T.win.openGame();window.toastr?.clear();});
 await p.evaluate(async()=>{
 const {Renderer}=await import('/scripts/extensions/third-party/SandAndFeather/src/world/render.js');window.P={active:false};const {input}=await import('/scripts/extensions/third-party/SandAndFeather/src/world/input.js');
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel'])window.addEventListener(type,e=>{if(P.active)P.events.push({t:performance.now(),type,dx:input.dx,dy:input.dy});});
 for(const name of ['draw','resize','setSprites']){const orig=Renderer.prototype[name];Renderer.prototype[name]=function(...a){if(name==='draw')window.R=this;const t=performance.now();const v=orig.apply(this,a);if(P.active){P.calls[name]++;if(name==='draw')P.draw.push({t,ms:performance.now()-t,x:T.player.player.x,y:T.player.player.y,dx:input.dx,dy:input.dy,cam:{...this.cam},zoom:this.zoom,width:this.cv.width,height:this.cv.height,mapWidth:this.map.w,mapHeight:this.map.h});}return v;};}
 const rect=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){if(P.active&&this.closest?.('#sf_game'))P.rect++;return rect.call(this);};
 new PerformanceObserver(list=>{if(P.active)P.long.push(...list.getEntries().map(e=>({t:e.startTime,ms:e.duration})));}).observe({type:'longtask'});
 const raf=t=>{if(P.active)P.raf.push(t);requestAnimationFrame(raf)};requestAnimationFrame(raf);
 });
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 for(const map of ['ombos','desert_golden_dunes']){
 if(process.env.PROFILE_MAP&&map!==process.env.PROFILE_MAP)continue;
 const start=await p.evaluate(async id=>{await T.win.travel(id);const m=R.map;let pos=null;outer:for(let y=4;y<m.h-4;y++)for(let x=5;x<m.w-5;x++){let ok=true;for(let dx=-4;dx<=4;dx+=.25)if(m.solidRect(x+dx-.3,y+.5,x+dx+.3,y+.85)||m.exitAt(x+dx,y+.8)){ok=false;break;}if(ok){pos={x,y};break outer;}}if(!pos)throw Error('no safe corridor '+id);await T.win.travel(id,pos);return{...pos,map:m.id};},map);
 await p.waitForTimeout(1500);
 if(process.env.CPU_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 await p.evaluate(()=>Object.assign(P,{active:true,calls:{draw:0,resize:0,setSprites:0},rect:0,draw:[],raf:[],long:[],events:[]}));
 const pad=await p.locator('.sf_pad').boundingBox(),x=pad.x+pad.width/2,y=pad.y+pad.height/2;
 for(let i=0;i<10;i++){await cdp.send('Input.dispatchTouchEvent',{type:i?'touchMove':'touchStart',touchPoints:[{x:x+(i%2?-.35:.35)*pad.width,y,id:1}]});await p.waitForTimeout(600);}
 if(process.env.CPU_PROFILE){const cpu=await cdp.send('Profiler.stop');fs.writeFileSync(path.join(out,version+'-'+map+'.cpuprofile'),JSON.stringify(cpu.profile));}
 const data=await p.evaluate(()=>{P.active=false;return P;});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const q=(a,p)=>{a.sort((a,b)=>a-b);return a[Math.min(a.length-1,Math.floor(a.length*p))]||0;},gaps=a=>a.slice(1).map((t,i)=>t-a[i]);
 const row={version,map,start,calls:data.calls,rect:data.rect,drawMsP95:q(data.draw.map(d=>d.ms),.95),drawGapP95:q(gaps(data.draw.map(d=>d.t)),.95),rafGapP95:q(gaps(data.raf),.95),rafGapMax:q(gaps(data.raf),1),longTasks:data.long.length,movedFrames:data.draw.filter((d,i,a)=>i&&Math.hypot(d.x-a[i-1].x,d.y-a[i-1].y)>.001).length};
 results.push(row);fs.writeFileSync(path.join(out,version+'-'+map+'.json'),JSON.stringify(data));console.log(JSON.stringify(row));fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(results,null,2));
 }
 }finally{await b.close()}
}
})().catch(e=>{console.error(e);process.exitCode=1});
