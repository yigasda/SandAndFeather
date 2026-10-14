// Walk all 31 residence exits through the real player movement and map transitions.
// node tools/st-test/residence-exits.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const OUT = path.resolve(process.argv[2] || 'work/residence-exits');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';

fs.mkdirSync(OUT, { recursive: true });
(async () => {
    const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
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
        const plans=await page.evaluate(()=>{
            const t=duatScale, result=[];
            for(const id of t.data.RESIDENCE){
                const map=t.map.getMap(id),spawn=map.d.spawn, scale=10, w=Math.ceil(map.w*scale)+40,h=Math.ceil(map.h*scale)+40;
                const ox=spawn.x-Math.floor(spawn.x*scale)/scale,oy=spawn.y-Math.floor(spawn.y*scale)/scale;
                const sx=Math.round((spawn.x-ox)*scale),sy=Math.round((spawn.y-oy)*scale),start=sy*w+sx;
                const prev=new Int32Array(w*h).fill(-1),q=new Int32Array(w*h);prev[start]=start;q[0]=start;let head=0,tail=1;
                const found=new Map();
                while(head<tail&&found.size<map.exits.length){
                    const k=q[head++],y=Math.floor(k/w),x=k%w,px=x/scale+ox,py=y/scale+oy;
                    const ex=map.exitAt(px+.5,py+.8),ei=map.exits.indexOf(ex);
                    if(ei>=0&&!found.has(ei))found.set(ei,k);
                    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
                        const xx=x+dx,yy=y+dy,kk=yy*w+xx,fx=xx/scale+ox,fy=yy/scale+oy;
                        if(xx<0||yy<0||xx>=w||yy>=h||prev[kk]>=0||map.solidRect(fx+.22,fy+.62,fx+.78,fy+.96))continue;
                        // Check the midpoint too, so thin walls cannot be skipped.
                        if(map.solidRect((fx+px)/2+.22,(fy+py)/2+.62,(fx+px)/2+.78,(fy+py)/2+.96))continue;
                        prev[kk]=k;q[tail++]=kk;
                    }
                }
                if(found.size!==map.exits.length)throw Error(`${id}: reachable ${found.size}/${map.exits.length}`);
                for(const [ei,end] of found){let k=end,route=[];while(true){route.push([k%w/scale+ox,Math.floor(k/w)/scale+oy]);if(k===start)break;k=prev[k];}route.reverse();result.push({id,ei,to:map.exits[ei].to,route});}
            }
            return result;
        });
        assert.equal(plans.length,31);
        for(const plan of plans){
            await page.evaluate(async id=>duatScale.win.travel(id),plan.id);
            await page.waitForTimeout(80);
            await page.evaluate(plan=>{
                const t=duatScale,p=t.player.player,map=t.map.getMap(plan.id);
                for(const [x,y] of plan.route){let n=0;while(Math.hypot(p.x-x,p.y-y)>.005){const dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy),old=[p.x,p.y];t.player.stepPlayer(map,dx/d,dy/d,Math.min(.008,d/4.2));if(++n>200||Math.hypot(p.x-old[0],p.y-old[1])<1e-8)throw Error(`blocked ${plan.id} exit ${plan.ei}`);}}
                if(map.exitAt(p.x+.5,p.y+.8)?.to!==plan.to)throw Error('wrong exit');
            },plan);
            await page.waitForFunction(id=>duatScale.player.player.map===id,plan.to,{timeout:10000});
            checks.push({map:plan.id,exit:plan.ei,to:plan.to,walked:plan.route.length});
        }
        assert.deepEqual(errors,[]);
        fs.writeFileSync(path.join(OUT,'verification.json'),JSON.stringify({checks,errors},null,2));
        console.log(JSON.stringify({walkedExits:checks.length,errors}));
    } finally {
        await page.screenshot({path:path.join(OUT,'last-screen.png')}).catch(()=>{});
        await page.evaluate(async()=>{if(window.duatScale){await duatScale.win.closeGame();SillyTavern.getContext().chatMetadata.sand_feather=duatScale.saved;await SillyTavern.getContext().saveMetadata();}}).catch(()=>{});
        await browser.close();
    }
})().catch(e=>{console.error(e);process.exitCode=1});
