const {chromium}=require('playwright'),fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'../../..');
const OUT=path.resolve(process.env.SF_PREVIEW_OUT || '/tmp/sf-menu-original10-output');
const BASE='/scripts/extensions/third-party/SandAndFeather/';
const PREVIEW_URL=process.env.SF_PREVIEW_URL || 'http://127.0.0.1:8000/';
// This is a destructive SAMPLE fixture for a disposable test instance only.
// It creates a new chat, resets game state, and seeds fake records/inventory.
if(process.env.SF_PREVIEW_DISPOSABLE !== '1') throw new Error('Set SF_PREVIEW_DISPOSABLE=1 only for a disposable SillyTavern test instance.');
const endpoint=new URL(PREVIEW_URL);
if(!['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname)) throw new Error('Sample capture only supports loopback test instances.');
fs.mkdirSync(OUT,{recursive:true});

function buildHeader(theme){
 const table={classic:[770,96,32,738,360,410],walnut:[797,89,60,770,150,775],journal:[799,84,85,714,355,445],temple:[756,91,195,560,222,535],cozy:[804,84,40,700,360,444]};
 const [w,h,left,right,midL,midR]=table[theme],scale=44/h,head=document.querySelector('.sf_pop_head');
 head.querySelector('.source-header')?.remove();
 const art=document.createElement('div');art.className='source-header';art.setAttribute('aria-hidden','true');
 const source=location.origin+'/scripts/extensions/third-party/SandAndFeather/data/art/ui/skins/'+theme+'/header-full.png';
 const midWidth=(midR-midL)*scale,midX=(theme==='temple'?310:422)-midWidth/2;
 function piece(x,width,sx,sw){const wrap=document.createElement('span');wrap.style.cssText=`position:absolute;left:${x}px;top:0;width:${width}px;height:44px;overflow:hidden;`;const img=document.createElement('img');img.src=source;img.style.cssText=`position:absolute;max-width:none;width:${w*scale}px;height:44px;top:0;left:${-sx*scale}px;image-rendering:pixelated;`;if(sw){const factor=width/(sw*scale);img.style.transformOrigin='0 0';img.style.transform=`scaleX(${factor})`;img.style.left=(-sx*scale*factor)+'px';}wrap.append(img);art.append(wrap);}
 const lw=left*scale,rw=(w-right)*scale;
 piece(0,lw,0);
 if(theme==='classic'){piece(lw,844-rw-lw,left,8);piece(844-rw,rw,right);}
 else if(theme==='walnut'){
  piece(lw,844-rw-lw,80,8);piece(844-rw,rw,right);
  const band=document.createElement('span');band.style.cssText=`position:absolute;left:${midX}px;top:23px;width:${midWidth}px;height:${27*scale}px;overflow:hidden;`;const img=document.createElement('img');img.src=source;img.style.cssText=`position:absolute;max-width:none;width:${w*scale}px;height:44px;left:${-midL*scale}px;top:${-35*scale}px;image-rendering:pixelated;`;band.append(img);art.append(band);
 }else{piece(lw,midX-lw,left,8);piece(midX,midWidth,midL);piece(midX+midWidth,844-rw-midX-midWidth,right-8,8);piece(844-rw,rw,right);}
 head.prepend(art);
}

(async()=>{
const b=await chromium.launch({executablePath:process.env.SF_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true,recordVideo:{dir:OUT,size:{width:844,height:390}}});
const start=Date.now(),p=await c.newPage(),video=p.video(),cdp=await c.newCDPSession(p),W=require(ROOT+'/tools/st-test/touch-walk.cjs')(p,cdp);const result={commit:require('child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),clips:[],errors:[]};
p.on('pageerror',e=>result.errors.push(e.message));
try{
await p.goto(PREVIEW_URL,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.SillyTavern?.getContext,null,{timeout:60000});await p.waitForTimeout(2500);
const save=p.locator('button:visible, .menu_button:visible',{hasText:/^Save$/});if(await save.count())await save.first().click();
await p.waitForFunction(()=>SillyTavern.getContext().characters?.length>0);await p.evaluate(()=>SillyTavern.getContext().selectCharacterById(0));await p.waitForFunction(()=>!!SillyTavern.getContext().chatId);
await p.evaluate(async()=>{await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat');});await p.waitForTimeout(1500);
await p.waitForSelector('#sf_open',{state:'attached'});
await p.evaluate(async base=>{window.T={};for(const[k,f]of Object.entries({win:'ui/window',state:'core/state',player:'world/player',heroes:'core/heroes',map:'world/map',data:'core/data'}))T[k]=await import(base+'src/'+f+'.js');T.state.resetState();const s=T.state.getState();s.part='day';T.heroes.setLead(s,'somang');T.heroes.setWith(s,'horus');await T.win.openGame();window.toastr?.clear();},BASE);
await p.addStyleTag({content:fs.readFileSync(__dirname+'/preview.css','utf8')});await p.addStyleTag({content:fs.readFileSync(__dirname+'/components-art.css','utf8')});await p.addStyleTag({content:fs.readFileSync(__dirname+'/original-art.css','utf8')});
await p.evaluate(async base=>{const s=T.state.getState();const {fillBond}=await import(base+'src/core/bond-state.js');const b=fillBond(s);b.horus.pts=12;b.ties=[['강가','강가를 함께 걸으며 이야기를 나누었다.'],['시장','시장에서 마음에 드는 물건을 함께 골랐다.'],['옛 성소','옛 성소로 향하는 길을 함께 걸었다.']].map(([where,summary],i)=>({id:'preview-'+i,who:'horus',when:(i+1)+'일',where,summary,title:summary,src:[],kept:true}));const ids=Object.keys(T.data.DATA.items.items||T.data.DATA.items).filter(id=>['blue_lotus','dates','bread','honey'].includes(id));s.bag.items=ids.map((id,i)=>({uid:'preview-item-'+i,id}));document.querySelector('.sf_tab[data-tab="bond"]').click();},BASE);
await p.waitForSelector('.sf_bond');await p.waitForTimeout(600);
await p.evaluate(()=>{
 const root=document.querySelector('#sf_game'),head=root.querySelector('.sf_pop_wrap[data-kind=bond] .sf_pop_head');
 head.style.backgroundImage='url('+location.origin+'/scripts/extensions/third-party/SandAndFeather/data/art/ui/skins/'+root.dataset.uiTheme+'/header.png)';
 const body=root.querySelector('.sf_bond'),nav=document.createElement('nav');nav.className='integrated-nav';nav.setAttribute('aria-label','메뉴');
 for(const old of root.querySelectorAll('.sf_tabs .sf_tab')){const item=old.cloneNode(true),icon=item.querySelector('i'),cs=getComputedStyle(old.querySelector('i'));for(const prop of ['background-image','background-size','background-repeat','background-position','mask-image','mask-size','mask-repeat','mask-position'])icon.style.setProperty(prop,cs.getPropertyValue(prop));icon.className='';if(cs.maskImage!=='none')icon.style.backgroundColor='currentColor';item.className='sf_btn'+(old.dataset.tab==='bond'?' sf_primary':'');item.setAttribute('aria-selected',String(old.dataset.tab==='bond'));nav.append(item)}
 head.append(nav);const rule=document.createElement('div');rule.className='art-header-rule';head.append(rule);for(const icon of nav.querySelectorAll('i')){const source=icon.style.maskImage&&icon.style.maskImage!=='none'?icon.style.maskImage:icon.style.backgroundImage;icon.style.maskImage=source;icon.style.maskSize='contain';icon.style.maskPosition='center';icon.style.maskRepeat='no-repeat';icon.style.backgroundImage='none';icon.style.backgroundColor='currentColor';}const currentIcon=document.createElement('i');currentIcon.className='current-section-icon';currentIcon.style.maskImage=nav.querySelector('[aria-selected=true] i').style.maskImage;head.prepend(currentIcon);const panel=head.parentElement,frame=getComputedStyle(panel,'::before'),topFrame=document.createElement('div');topFrame.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:500;transform:scaleY(-1);clip-path:inset(70% 0 0);border:14px solid transparent;';topFrame.style.borderImageSource=frame.borderImageSource;topFrame.style.borderImageSlice=frame.borderImageSlice;topFrame.style.borderImageRepeat=frame.borderImageRepeat;topFrame.className='art-top-frame';topFrame.style.borderWidth='10px';panel.append(topFrame);const exit=head.querySelector('.sf_pop_x');exit.textContent='×';exit.title='게임으로 돌아가기';exit.setAttribute('aria-label','메뉴 닫고 게임으로 돌아가기');
 const left=root.querySelector('.sf_bond_left'),right=root.querySelector('.sf_bond_right');const context=document.createElement('span');context.className='selection-context';context.textContent='호루스와의 기록과 교류';root.querySelector('.sf_bond_tabs').append(context);const giftName=document.createElement('span');giftName.className='gift-selection-name';giftName.textContent=root.querySelector('.sf_bond_slot.sf_on').title+' 선택';right.querySelectorAll('.sf_bond_section_head')[1].append(giftName);const mark=document.createElement('small');mark.textContent='기록 3개';mark.style.cssText='display:block;margin-left:auto;font-size:10px;max-width:none';left.querySelector('.sf_bond_section_head').append(mark);
 for(const h of root.querySelectorAll('.sf_bond_section_head'))h.title=h.querySelector('small')?.textContent||'';
});
await p.evaluate(()=>{const icons=[...document.querySelectorAll('.sf_bond_section_head')].filter(h=>['인연의 기록','선물하기','함께하는 활동'].includes(h.querySelector('h3').textContent)).map(h=>h.querySelector('img'));icons.push(document.querySelector('.sf_bond_motto img'));for(const img of icons){const wrap=document.createElement('span');wrap.className='design-semantic-icon';wrap.style.setProperty('--semantic-icon','url("'+img.src+'")');img.replaceWith(wrap);wrap.append(img);}});
await p.evaluate(()=>document.querySelectorAll('.sf_bond_slot.sf_on').forEach(e=>e.classList.remove('sf_on')));
for(const theme of ['cozy','classic','walnut','journal','temple']){
 await p.evaluate(({theme,fit})=>{const root=document.querySelector('#sf_game');root.dataset.uiTheme=theme;for(const name of ['frame','panel','paper','header','button','button-fill','primary','primary-fill','slot','selected','flower'])root.style.setProperty('--art-'+name,'url("'+location.origin+'/scripts/extensions/third-party/SandAndFeather/data/art/ui/skins/'+theme+'/'+(name==='frame'&&theme==='temple'?'panel':name==='selected'&&theme==='journal'?'primary':name)+'.png")');const topFrame=root.querySelector('.art-top-frame');topFrame.style.borderImageSource=root.style.getPropertyValue('--art-frame');topFrame.style.borderImageSlice=getComputedStyle(root).getPropertyValue('--slice-frame');for(const item of root.querySelectorAll('.integrated-nav button')){const source=root.querySelector('.sf_tabs [data-tab="'+item.dataset.tab+'"] i'),cs=getComputedStyle(source),icon=item.querySelector('i');icon.style.maskImage=cs.maskImage!=='none'?cs.maskImage:cs.backgroundImage;icon.style.maskSize=fit[item.dataset.tab].size;icon.style.maskPosition=fit[item.dataset.tab].position;}},{theme,fit:JSON.parse(fs.readFileSync(__dirname+'/icon-fit.json','utf8'))[theme]});
 await p.evaluate(buildHeader, theme);await p.waitForTimeout(100);await p.screenshot({path:OUT+'/'+theme+'-2x.png'});await p.screenshot({path:OUT+'/'+theme+'-844.png',scale:'css'});
 await p.keyboard.press('Tab');await p.evaluate(()=>document.querySelector('.sf_bond_give').focus());await p.screenshot({path:OUT+'/'+theme+'-focus-844.png',scale:'css'});result[theme+'Focus']=await p.evaluate(()=>{const e=document.querySelector('.sf_bond_give'),cs=getComputedStyle(e);return{visible:e.matches(':focus-visible'),outline:cs.outlineStyle,decoration:cs.textDecorationLine}});await p.evaluate(()=>document.activeElement.blur());
 result[theme+'Header']=await p.evaluate(()=>{const h=document.querySelector('.sf_pop_head'),r=h.getBoundingClientRect(),f=getComputedStyle(h.parentElement,'::before');return{left:r.left,right:r.right,height:r.height,frame:f.borderImageSource,slice:f.borderImageSlice,buttons:[...h.querySelectorAll('button')].map(e=>({label:e.dataset.tab||'close',width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}});
 result[theme]=await p.evaluate(()=>Object.fromEntries(['.sf_bond_left','.sf_bond_right','.sf_bond_records','.sf_bond_footer'].map(q=>{const e=document.querySelector(q),r=e.getBoundingClientRect();return[q,{y:r.y,h:r.height,scroll:e.scrollHeight,client:e.clientHeight}]})));
 if(theme==='cozy'){
 // Full host HTML is deliberately not exported: it can contain unrelated chat/user data.
 result.axes=await p.evaluate(()=>{const selectors={group:'.sf_bond_progress',track:'.sf_bond_track',slots:'.sf_bond_slots',cta:'.sf_bond_give',first:'.sf_bond_activity:first-child',third:'.sf_bond_activity:nth-child(3)',last:'.sf_bond_activity:last-child',notebook:'.sf_bond_memory'};return Object.fromEntries(Object.entries(selectors).map(([k,q])=>{const r=document.querySelector(q).getBoundingClientRect();return[k,{left:r.left,right:r.right,width:r.width,top:r.top,bottom:r.bottom}]}));});
}

}
}finally{await c.close();result.video=await video.path();fs.writeFileSync(OUT+'/result.json',JSON.stringify(result,null,2));await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
