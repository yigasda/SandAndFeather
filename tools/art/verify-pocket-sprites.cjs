// Real SillyTavern integration; no AI calls, restores the dedicated test chat.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {chromium} = require('playwright');
const out = path.resolve(process.argv[2] || '/tmp/pocket-sprites');
fs.mkdirSync(out, {recursive:true});
(async () => {
    const browser = await chromium.launch({executablePath:'/usr/bin/chromium', args:['--no-sandbox']});
    const p = await browser.newPage({viewport:{width:412,height:900},hasTouch:true});
    const errors = [], failed = []; p.on('pageerror', e => errors.push(e.message));
    p.on('response', r => { if (r.status() >= 400 && r.url().includes('SandAndFeather')) failed.push(r.url()); });
    try {
        await p.goto('http://127.0.0.1:8000'); await p.waitForSelector('#sf_open',{state:'attached'});
        if (await p.locator('.popup-button-ok').isVisible()) await p.locator('.popup-button-ok').click();
        await p.waitForSelector('.character_select[data-chid]',{state:'attached'});
        await p.evaluate(() => document.querySelector('.character_select[data-chid]').click());
        await p.waitForFunction(() => !!SillyTavern.getContext().chatId);
        const result = await p.evaluate(async () => {
            const base = '/scripts/extensions/third-party/SandAndFeather/src/'; window.spriteTest = {};
            for (const [k,v] of Object.entries({win:'ui/window',state:'core/state',data:'core/data',render:'world/render',map:'world/map',check:'core/check'}))
                spriteTest[k] = await import(base+v+'.js');
            const t = spriteTest; t.saved = structuredClone(SillyTavern.getContext().chatMetadata.sand_feather);
            t.state.resetState(); await t.win.openGame();
            const {DATA} = t.data, {Renderer} = t.render;
            const c = document.createElement('canvas'), r = new Renderer(c); r.setSprites(DATA.sprites);
            const looks = ['set','somang','horus','townsman'], dirs = ['down','left','right','up'];
            const frames = [];
            for (const look of looks) for (const dir of dirs) {
                const pic = r.art.get(`${look}|${dir}`), g = pic.getContext('2d');
                const d = g.getImageData(0,0,pic.width,pic.height).data;
                let visible = 0, bottom = -1, corners = [];
                for (let y=0;y<64;y++) for (let x=0;x<64;x++) if (d[(y*64+x)*4+3] > 16) { visible++;bottom=y; }
                for(const [x,y] of [[0,0],[63,0],[0,63],[63,63]])corners.push(d[(y*64+x)*4+3]);
                frames.push({look,dir,width:pic.width,height:pic.height,scale:r.artScale.get(`${look}|${dir}`),visible,bottom,corners});
            }
            // All views are explicit, including the asymmetric eye marking.
            const left = r.art.get('horus|left'), right = r.art.get('horus|right');
            const mirror = document.createElement('canvas'); mirror.width=mirror.height=64;
            const mg=mirror.getContext('2d');mg.translate(64,0);mg.scale(-1,1);mg.drawImage(right,0,0);
            const a=left.getContext('2d').getImageData(0,0,64,64).data,b=mg.getImageData(0,0,64,64).data;
            const asymmetry=a.reduce((n,v,i)=>n+(v!==b[i]),0);
            const board=document.createElement('canvas');board.width=640;board.height=672;
            const bg=board.getContext('2d');bg.fillStyle='#eee8dd';bg.fillRect(0,0,640,672);
            bg.fillStyle='#49392d';bg.font='16px sans-serif';
            dirs.forEach((dir,col)=>bg.fillText(dir,col*160+56,22));
            looks.forEach((look,row)=>{bg.fillStyle='#49392d';bg.fillText(look,8,49+row*156);dirs.forEach((dir,col)=>r.person(bg,look,col*160+32,76+row*156,dir,0,6));});
            const valid=t.check.checkData();
            const old=DATA.sprites.looks.horus.atlas.frames.left;
            DATA.sprites.looks.horus.atlas.frames.left=[250,250,64,64];
            const invalid=t.check.checkData();DATA.sprites.looks.horus.atlas.frames.left=old;
            const map=new t.map.GameMap(DATA.maps.ombos);
            r.setMap(map,'akhet');c.width=1344;c.height=1088;r.zoom=2;
            r.draw({player:{x:25,y:18,dir:'down',step:0},people:map.npcs.map(n=>({...n,dir:'down',step:0})),part:'day',time:0});
            return {frames,asymmetry,valid,invalid,board:board.toDataURL(),map:c.toDataURL()};
        });
        assert.deepEqual(result.valid, []);
        assert.equal(result.frames.length,16);
        assert(result.frames.every(f=>f.width===64&&f.height===64&&f.scale===20/64&&f.visible>900&&f.visible<3500&&f.bottom===63&&f.corners.every(a=>a===0)),JSON.stringify(result.frames));
        assert(result.asymmetry>300);
        assert(result.invalid.some(s=>s.includes('horus left')&&s.includes('이미지 밖')));
        for(const key of ['board','map']){fs.writeFileSync(path.join(out,`${key}.png`),Buffer.from(result[key].split(',')[1],'base64'));delete result[key];}
        await p.evaluate(()=>spriteTest.win.travel('ombos',{x:12,y:18}));
        await p.waitForTimeout(200);await p.locator('#sf_game').screenshot({path:path.join(out,'merchant-mobile.png')});
        await p.locator('.sf_talk').click();
        const merchant = p.locator('.sf_pop_wrap').last(); await merchant.waitFor();
        assert((await merchant.innerText()).includes('상인'));
        await merchant.locator('.sf_pop_x').click();
        await p.evaluate(()=>spriteTest.win.travel('ombos',{x:25,y:13}));
        await p.waitForTimeout(200);await p.locator('#sf_game').screenshot({path:path.join(out,'trio-mobile.png')});
        assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
        fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({...result,pageErrors:errors,failedRequests:failed},null,2)+'\n');
        console.log(JSON.stringify({frames:result.frames.length,asymmetry:result.asymmetry,validation:result.valid,pageErrors:errors,failedRequests:failed,output:out}));
    } finally {
        await p.evaluate(async()=>{if(window.spriteTest?.win){await spriteTest.win.closeGame();SillyTavern.getContext().chatMetadata.sand_feather=spriteTest.saved;await SillyTavern.getContext().saveMetadata();}}).catch(()=>{});
        await browser.close();
    }
})().catch(e=>{console.error(e);process.exitCode=1;});
