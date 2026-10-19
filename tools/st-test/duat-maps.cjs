// Real game entrance, seven maps, fourteen exits and unchanged Duat lighting.
// python3 tools/maps/duat.py && node tools/st-test/duat-maps.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const OUT = path.resolve(process.argv[2] || 'docs/consult/duat-field/maps');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
const routes = JSON.parse(fs.readFileSync(path.join(OUT, 'paths.json')));
fs.mkdirSync(OUT, { recursive: true });
(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {});
    const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errors = [], checks = [];
    page.on('pageerror', e => { if (!/Internal Server Error/.test(e.message)) errors.push(e.message); });
    try {
        // This is a local working branch. Do not let ST auto-update the checkout
        // while testing; only the test browser's manifest response is changed.
        await page.route('**/SandAndFeather/manifest.json', async route => {
            const response = await route.fetch();
            await route.fulfill({ response, json: { ...await response.json(), auto_update: false } });
        });
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 });
        await page.waitForTimeout(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await page.waitForTimeout(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0));
        await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async ({ base }) => {
            window.duatScale = {};
            for (const [key, file] of Object.entries({ win: 'ui/window', state: 'core/state', data: 'core/data', player: 'world/player', heroes: 'core/heroes', render: 'world/render', map: 'world/map' }))
                duatScale[key] = await import(base + 'src/' + file + '.js');
            const t = duatScale;
            t.saved = structuredClone(SillyTavern.getContext().chatMetadata.sand_feather);
            t.state.resetState();
            const s = t.state.getState(); s.part = 'night'; s.wake = null;
            t.heroes.setLead(s, 'somang'); t.heroes.setWith(s, '');
            await t.win.openGame();
            window.toastr?.clear();
        }, { base: BASE });
        await page.waitForTimeout(1000);
        await page.evaluate(async () => duatScale.win.travel('ombos',{x:36,y:10,dir:'up'}));
        await page.waitForTimeout(200);
        await page.locator('.sf_talk').click();
        await page.getByRole('button',{name:'두아트 들어가기',exact:true}).click();
        await page.waitForFunction(()=>duatScale.player.player.map==='duat_01');
        const walk = async (m, direction) => {
            const result = await page.evaluate(({ m, direction, px }) => {
                const t=duatScale, p=t.player.player, map=t.map.getMap(p.map);
                if(p.map!==m.map) throw Error(`wrong map ${p.map} expected ${m.map}`);
                let steps=0;
                for(const [x,y] of m[direction]) {
                    const tx=x/px-.5, ty=y/px-.8;
                    let n=0;
                    while(Math.hypot(p.x-tx,p.y-ty)>.018) {
                        const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);
                        const old=[p.x,p.y];
                        t.player.stepPlayer(map,dx/d,dy/d,Math.min(.015,d/4.2));
                        if(++n>10000 || Math.hypot(p.x-old[0],p.y-old[1])<1e-7) throw Error(`blocked ${m.map} ${direction} ${p.x},${p.y} -> ${tx},${ty}`);
                        steps++;
                    }
                }
                return {map:p.map,direction,steps,exit:map.exitAt(p.x+.5,p.y+.8)?.id};
            },{m,direction,px:routes.pixelsPerTile});
            assert(result.exit, JSON.stringify(result));
            const expected=direction==='up' ? (m.map==='duat_07'?'ombos':`duat_${String(+m.map.slice(-2)+1).padStart(2,'0')}`) : (m.map==='duat_01'?'ombos':`duat_${String(+m.map.slice(-2)-1).padStart(2,'0')}`);
            await page.waitForFunction(id=>duatScale.player.player.map===id,expected,{timeout:10000});
            checks.push(result);
            await page.waitForTimeout(200);
        };
        for(const m of routes.maps) {
            await page.waitForTimeout(350);
            await page.screenshot({path:path.join(OUT,`${m.map}-412-entry.png`)});
            await walk(m,'up');
        }
        await page.evaluate(async()=>duatScale.win.travel('duat_07','top'));
        await page.waitForTimeout(350);
        for(const m of [...routes.maps].reverse()) await walk(m,'down');
        // 320px captures and all-time lighting, using each map's actual data.
        await page.setViewportSize({width:320,height:900});
        for(const m of routes.maps) {
            await page.evaluate(async id=>duatScale.win.travel(id,'bottom'),m.map);
            await page.waitForTimeout(350);
            await page.screenshot({path:path.join(OUT,`${m.map}-320-entry.png`)});
        }
        const lighting=await page.evaluate(()=>{
            const t=duatScale, result=[];
            for(let i=1;i<=7;i++) {
                const id=`duat_${String(i).padStart(2,'0')}`, m=t.map.getMap(id);
                const r=new t.render.Renderer(document.createElement('canvas'));
                r.setMap(m,'akhet');r.setSprites(t.data.DATA.sprites);r.cv.width=600;r.cv.height=800;r.zoom=2;
                let reference;
                for(const part of ['day','dawn','evening','night']) {
                    r.draw({player:{...m.d.spawn,look:'somang',step:0},people:[],part,time:0});
                    const pixels=r.g.getImageData(0,0,600,800).data.slice();
                    if(!reference) reference=pixels;
                    result.push({id,part,changed:pixels.reduce((n,v,k)=>n+(v!==reference[k]),0)});
                }
                r.release();
            }
            return result;
        });
        assert(lighting.every(x=>x.changed===0),JSON.stringify(lighting));
        const collision=await page.evaluate(()=>{
            const m=duatScale.map.getMap('duat_02'), px=52/1.55;
            const samples=[['upper water',450,600,true],['lower water',650,975,true],['bridge',500,850,false],['left stairs',280,555,false],['right stairs',845,391,false],['right pillar',765,310,true],['mural pots',185,550,true]];
            return samples.map(([name,x,y,expected])=>({name,expected,blocked:m.solidAt(x/px,y/px)}));
        });
        assert(collision.every(x=>x.expected===x.blocked),JSON.stringify(collision));
        const exploration=await page.evaluate(async()=>{
            const e=await import('/scripts/extensions/third-party/SandAndFeather/src/core/explore.js');
            return e.regionStatus(duatScale.state.getState(),'duat');
        });
        assert.equal(exploration.done,7);
        assert.deepEqual(errors,[]);
        fs.writeFileSync(path.join(OUT,'verification.json'),JSON.stringify({checks,lighting,collision,exploration,errors},null,2));
        console.log(JSON.stringify({walkedExits:checks.length,explored:exploration.done,errors}));
    } finally {
        await page.screenshot({path:path.join(OUT,'last-screen.png')}).catch(()=>{});
        await page.evaluate(async()=>{if(window.duatScale){await duatScale.win.closeGame();SillyTavern.getContext().chatMetadata.sand_feather=duatScale.saved;await SillyTavern.getContext().saveMetadata();}}).catch(()=>{});
        await browser.close();
    }
})().catch(e=>{console.error(e);process.exitCode=1});
