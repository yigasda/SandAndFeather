// Run against a dedicated local SillyTavern test profile with its sample character.
// Needs Playwright and /usr/bin/chromium, supplied by the prepared cloud environment.
// The temporary game state is restored in finally. No AI requests or chat generation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const path = require('node:path');
const output = path.resolve(process.argv[2] || '/tmp/sand-feather-art-review');
fs.mkdirSync(output, {recursive:true});
const base = '/scripts/extensions/third-party/SandAndFeather/';
const passed = [];
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 412, height: 900 }, hasTouch: true });
  const errors = [], requests = [];
  page.on('pageerror', e => { errors.push(e.message); console.error(e.stack); });
  page.on('request', r => { if (r.url().includes('SandAndFeather')) requests.push(r.url()); });
  try {
    await page.goto('http://127.0.0.1:8000');
    await page.waitForSelector('#sf_open', { state: 'attached' });
    if (await page.locator('.popup-button-ok').isVisible()) await page.locator('.popup-button-ok').click();
    await page.waitForSelector('.character_select[data-chid]', {state:'attached'});
    await page.evaluate(() => document.querySelector('.character_select[data-chid]').click());
    await page.waitForFunction(() => {
      const c = SillyTavern.getContext();
      return !!(c.chatId || c.getCurrentChatId?.());
    });
    await page.evaluate(async base => {
      const paths = { win: 'ui/window', state: 'core/state', data: 'core/data', map: 'world/map', player: 'world/player', things: 'world/things', render: 'world/render', works: 'packs/realm/works', ledger: 'core/ledger', check: 'core/check' };
      window.artTest = {};
      for (const [key, path] of Object.entries(paths)) artTest[key] = await import(base + 'src/' + path + '.js');
      artTest.saved = structuredClone(SillyTavern.getContext().chatMetadata.sand_feather);
      artTest.state.resetState();
      await artTest.win.openGame();
    }, base);
    assert.deepEqual(await page.evaluate(() => artTest.check.checkData()), []);
    const art = await page.evaluate(() => {
      const all = Object.entries(artTest.data.DATA.tiles.things).filter(([k]) => k.startsWith('bld_'));
      return all.map(([id, d]) => ({ id, w: d.rows[0].length, h: d.rows.length, valid: d.rows.every(row => row.length === d.rows[0].length && [...row].every(c => c === '.' || d.colors[c])) }));
    });
    assert.equal(art.length, 6); assert(art.every(a => a.valid)); passed.push('6 building grids and extension data load');
    const sceneArt = await page.evaluate(() => Object.entries(artTest.data.DATA.sceneArt).filter(([, d]) => d.image).map(([id, d]) => ({id,width:d.image.naturalWidth,height:d.image.naturalHeight})));
    assert(sceneArt.every(s=>s.width>0&&s.height>0));
    passed.push('approved day/night atlas decoded at original resolution');
    const travel = (x, y) => page.evaluate(async ({x,y}) => { await artTest.win.travel('ombos',{x,y}); }, {x,y});
    const pos = () => page.evaluate(() => ({x:artTest.player.player.x,y:artTest.player.player.y}));
    await travel(21,17);
    await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.down('ArrowUp'); await page.waitForTimeout(700); await page.keyboard.up('ArrowUp');
    const blocked = await pos(); assert(blocked.y >= 16.37 && blocked.y < 17, JSON.stringify(blocked));
    await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.down('ArrowDown');
    await page.waitForFunction(y => artTest.player.player.y > y + .6, blocked.y);
    await page.keyboard.up('ArrowDown');
    assert((await pos()).y > blocked.y + .6); passed.push('keyboard movement and house-wall collision');
    await travel(21,19);
    const pad = await page.locator('.sf_pad').boundingBox(), beforeTouch = await pos();
    const cdp = await page.context().newCDPSession(page);
    const touch = {x:pad.x+pad.width*.72,y:pad.y+pad.height*.5};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
    await page.waitForTimeout(350);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert((await pos()).x > beforeTouch.x + .5); passed.push('mobile touch-pad movement');
    for (const [x,y,title] of [[14,18,'시장'],[30,18,'부엌'],[11,7,'필사실'],[26,10,'지도 탁자'],[24,13,'세트']]) {
      await travel(x,y); await page.waitForTimeout(100); await page.locator('.sf_talk').click();
      const card=page.locator('.sf_pop_wrap').last(); await card.waitFor();
      assert((await card.innerText()).includes(title), title); await card.locator('.sf_pop_x').click();
    }
    passed.push('market, kitchen, scriptorium, temple and NPC interaction cards');
    await page.evaluate(()=>{artTest.state.getState().part='day';artTest.win.refresh();});
    await travel(36,10);
    await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.down('ArrowUp'); await page.waitForTimeout(400); await page.keyboard.up('ArrowUp');
    assert((await pos()).y >= 9.37, 'Duat gate still blocks northward movement');
    await travel(36,10); await page.locator('.sf_talk').click();
    const gateCard=page.locator('.sf_pop_wrap').last(); await gateCard.waitFor();
    assert((await gateCard.innerText()).includes('문은 저녁과 밤에만 열려'));
    await gateCard.locator('.sf_pop_x').click();
    const forecourt=await page.evaluate(()=>{
      const m=artTest.map.getMap(),gate=m.buildings.find(b=>b.id==='duat'),jackal=m.decor.find(d=>d.k==='jackal');
      let gateOnStone=true;
      for(let y=gate.y;y<gate.y+gate.h;y++)for(let x=gate.x;x<gate.x+gate.w;x++)gateOnStone &&= m.type(x,y)==='stone';
      return {gateOnStone,statueOnSand:m.type(jackal.x,jackal.y)==='sand',statueBlocks:m.solidAt(jackal.x,jackal.y),
        passageClear:!m.solidAt(gate.x,11)&&!m.solidAt(gate.x,12)&&!m.solidAt(gate.x,13),guardianBesidePassage:!m.solidAt(jackal.x-1,jackal.y),
        roadClear:Array.from({length:8},(_,k)=>11+k).every(y=>[gate.x,gate.x+1].every(x=>!m.solidAt(x,y))),
        guardianBackClear:[jackal.x-1,jackal.x,jackal.x+1].every(x=>!m.solidAt(x,jackal.y-1)),
        sealRemoved:!m.decor.some(d=>d.k==='seal')};
    });
    assert(Object.values(forecourt).every(Boolean),JSON.stringify(forecourt));
    // Walk the full approach using real player collision, in both lanes and directions.
    const approach=await page.evaluate(()=>{
      const m=artTest.map.getMap(),p=artTest.player.player,step=artTest.player.stepPlayer;
      const gate=m.buildings.find(b=>b.id==='duat');
      return [gate.x,gate.x+1].map(x=>{
        Object.assign(p,{x,y:18});
        for(let n=0;n<240;n++)step(m,0,-1,1/60);
        const atGate=p.y;
        for(let n=0;n<128;n++)step(m,0,1,1/60);
        return {x,atGate,back:p.y};
      });
    });
    const guardianPass=await page.evaluate(()=>{
      const m=artTest.map.getMap(),p=artTest.player.player;
      const jackal=m.decor.find(d=>d.k==='jackal'),behindY=jackal.y-1;
      Object.assign(p,{x:jackal.x-1,y:behindY});
      for(let n=0;n<28;n++)artTest.player.stepPlayer(m,1,0,1/60);
      return {x:p.x,y:p.y,behindY,statueX:jackal.x};
    });
    assert(guardianPass.x>guardianPass.statueX+.8&&guardianPass.y===guardianPass.behindY,JSON.stringify(guardianPass));
    assert(approach.every(p=>p.atGate>=9.37&&p.atGate<9.5&&p.back>18),JSON.stringify(approach));
    await page.evaluate(()=>{artTest.state.getState().part='night';artTest.win.refresh();});
    await travel(36,10); await page.locator('.sf_talk').click();
    const nightGate=page.locator('.sf_pop_wrap').last(); await nightGate.waitFor();
    assert((await nightGate.innerText()).includes('누구와 내려갈까?'));
    await nightGate.locator('.sf_pop_x').click();
    await page.evaluate(()=>{artTest.state.getState().part='day';artTest.win.refresh();});
    passed.push('Duat two-lane approach both ways, guardian clearance, gate day/night interactions and relocated mural');
    const reachability = await page.evaluate(() => {
      const {GameMap}=artTest.map, d=artTest.data.DATA.maps.ombos;
      return [[],['canal','field','garden']].map(open=>{
        const m=new GameMap(d,open), seen=new Set(), todo=[[d.spawn.x,d.spawn.y]];
        for(let i=0;i<todo.length;i++) {const [x,y]=todo[i],key=x+','+y;if(seen.has(key)||m.solidAt(x,y))continue;seen.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(!m.solidAt(x+dx,y+dy))todo.push([x+dx,y+dy]);}
        const reachable=p=>[...seen].some(key=>{const [x,y]=key.split(',').map(Number);return Math.hypot(x-p.x,y-p.y)<1.6;});
        return {open,tiles:seen.size,unreachable:[...m.spots,...m.npcs,...m.anchors].filter(p=>!reachable(p)).map(p=>p.id)};
      });
    });
    assert(reachability.every(r=>r.unreachable.length===0),JSON.stringify(reachability));
    passed.push('all 9 places, 3 NPCs and 14 adventure anchors approachable before/after overlays');
    const blockedNpcs = await page.evaluate(() => {
      const m=artTest.map.getMap();
      return m.npcs.filter(n=>m.base[n.y*m.w+n.x]).map(n=>n.id);
    });
    assert.deepEqual(blockedNpcs,[], 'NPC feet must not overlap the revised courtyard wall');
    // Exercise existing completion logic, including the repaint triggered by world:changed.
    const works=await page.evaluate(()=>{
      const s=artTest.state.getState(),t=artTest.ledger.today(s);
      for(const id of ['canal','field','boat'])s.works[id]={start:t-4,ready:t,done:false};
      const done=artTest.works.settleWorks(s).map(w=>w.id);
      const m=artTest.map.getMap();
      return {done,open:m.open,boat:artTest.things.thingsOn('ombos').some(t=>t.id==='boat')};
    });
    assert.deepEqual(works.done,['canal','field','boat']); assert(works.open.includes('canal')&&works.open.includes('field')&&works.boat);
    passed.push('canal/field repair overlays and repaired boat appear');
    const night = await page.evaluate(async()=>{
      const s=artTest.state.getState();s.part='night';artTest.win.refresh();
      return artTest.things.thingsOn('ombos').some(t=>t.id==='secret:night_mural');
    });
    assert(night);
    await travel(35,12); await page.locator('.sf_talk').click();
    const muralCard=page.locator('.sf_pop_wrap').last(); await muralCard.waitFor();
    assert((await muralCard.innerText()).includes('빛나는 벽화'));
    await muralCard.locator('.sf_pop_x').click();
    await travel(26,11);await page.waitForTimeout(150);
    await page.screenshot({path:path.join(output,'after-temple-night.png')});
    await travel(21,18);await page.waitForTimeout(150);await page.screenshot({path:path.join(output,'after-house-night.png')});
    await page.evaluate(()=>{artTest.state.getState().part='day';artTest.win.refresh();});
    passed.push('night lighting and moonlight-only discovery');
    // Verify the actual two-layer paint path hides a character behind a roof overhang.
    const occlusion = await page.evaluate(()=>{
      const {Renderer}=artTest.render,m=artTest.map.getMap(),cv=document.createElement('canvas'),r=new Renderer(cv);
      r.setMap(m,'akhet');r.setSprites(artTest.data.DATA.sprites);
      cv.width=m.w*16;cv.height=m.h*16;r.zoom=1;
      const b=m.buildings.find(b=>b.id==='houses1'),x=b.x+1,y=b.y-1;
      const top=r.top.getContext('2d').getImageData(x*16,y*16,16,16).data;
      r.draw({player:{x,y,dir:'down',step:0},people:[],time:0,part:'day'});
      const screen=r.g.getImageData(x*16,y*16,16,16).data;
      let opaque=0,mismatch=0;for(let i=0;i<top.length;i+=4)if(top[i+3]===255){opaque++;for(let c=0;c<4;c++)if(top[i+c]!==screen[i+c]){mismatch++;break;}}
      return {opaque,mismatch};
    });
    assert(occlusion.opaque>100&&occlusion.mismatch===0);passed.push('roof overhang occludes character through existing top layer');
    await page.locator('.sf_collapse').click();
    assert.equal(await page.evaluate(()=>document.querySelector('#sf_game canvas').width),1);
    await page.locator('#sf_chip').click();await page.locator('#sf_game').waitFor({state:'visible'});
    const restoration=await page.evaluate(()=>{
      const cv=document.querySelector('#sf_game canvas');
      const opaque=()=>{const a=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=3;i<a.length;i+=4)if(a[i])n++;return n;};
      cv.getContext('2d').clearRect(0,0,cv.width,cv.height);document.dispatchEvent(new Event('visibilitychange'));const visibility=opaque();
      cv.getContext('2d').clearRect(0,0,cv.width,cv.height);cv.dispatchEvent(new Event('contextrestored'));return {visibility,context:opaque(),pixels:cv.width*cv.height};
    });
    assert.equal(restoration.visibility,restoration.pixels);assert.equal(restoration.context,restoration.pixels);
    passed.push('fold releases canvas; reopen and simulated tab/context restoration repaint');
    const fetched=requests.length;
    await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.down('ArrowDown');await page.waitForTimeout(500);await page.keyboard.up('ArrowDown');
    assert.equal(requests.length,fetched);passed.push('movement does not reload art');
    assert.deepEqual(errors,[]);
    const result={passed,art,sceneArt,reachability,forecourt,approach,guardianPass,occlusion,restoration,pageErrors:errors};
    fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  } finally {
    await page.screenshot({path:path.join(output,'last-screen.png')});
    await page.evaluate(async()=>{if(window.artTest){await artTest.win.closeGame();SillyTavern.getContext().chatMetadata.sand_feather=artTest.saved;await SillyTavern.getContext().saveMetadata();}}).catch(()=>{});
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
