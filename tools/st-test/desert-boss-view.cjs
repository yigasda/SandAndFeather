// 큰 몹 화면 가독성(사용자 10-19): 수문장 체력바가 몸 크기만큼, 전투 상자 제목이 싸우는 몹 이름, 수문장 뒤로 들어간
// 캐릭터(앞장·동행)가 가려지지 않게 수문장을 반투명으로(실루엣 없음). 신전 수문장 옆을 지나 뒤로 돌아 나오는 영상.
//   node tools/st-test/desert-boss-view.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/mobs/boss-view');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const sleep = ms => page.waitForTimeout(ms);
    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await sleep(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async base => {
            window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', field: 'packs/duat/field', ledger: 'core/ledger', data: 'core/data' })) T[k] = await import(base + 'src/' + f + '.js');
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; await T.win.openGame(); window.toastr?.clear();
            T.solid = (x, y) => T.win.currentMap().solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
        }, BASE);
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
        await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, null); /* her alone: the one with her would stand behind it too */ });
        await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(900);
        // an open floor about 7 × 6 tiles round her
        const at = await page.evaluate(() => {
            const p = T.player.player;
            for (let r = 0; r < 30; r += 0.5) for (let a = 0; a < 6.28; a += 0.3) {
                const x = Math.round((p.x + Math.cos(a) * r) * 4) / 4, y = Math.round((p.y + Math.sin(a) * r) * 4) / 4;
                let open = true;
                for (let dx = -4; dx <= 4 && open; dx += 0.5) for (let dy = -6; dy <= 2 && open; dy += 0.5) if (T.solid(x + dx, y + dy)) open = false;
                if (open) { p.x = x; p.y = y; return { x, y }; }
            }
            return null;
        });
        ok(!!at, '수문장을 세울 트인 바닥');
        const base = await page.evaluate(() => T.data.DATA.desert.enemies.desert_leather_shield);
        await page.evaluate(([x, y, base]) => T.field.testOnly('desert_temple_warden', x, y - 2.5, { ...base, hp: 60, atk: 0, guard: 0, speed: 0, range: 0, nopush: true, aggro: 4 }), [at.x, at.y, base]);
        await sleep(500);
        // in front: hit it once (the bar shows, the title is its name)
        await page.evaluate(() => T.field.attack()); await sleep(900);
        const title = await page.evaluate(() => document.querySelector('.sf_duat_hud b')?.textContent || '');
        ok(title === '신전 수문장', `전투 상자 제목 = 몹 이름 (${title})`);
        await page.screenshot({ path: path.join(OUT, '1-front.png') });
        // round its side to behind it, slowly (as walking), and out the other side (video)
        const path0 = [];
        for (let k = 0; k <= 20; k++) path0.push([at.x - 3.5 + k * 0.05, at.y - k * 0.2]);
        for (let k = 1; k <= 30; k++) path0.push([at.x - 2.5 + k * 0.17, at.y - 4]);
        for (let k = 1; k <= 20; k++) path0.push([at.x + 2.6 + k * 0.05, at.y - 4 + k * 0.2]);
        for (const [x, y] of path0) { await page.evaluate(([x, y]) => { const p = T.player.player; p.x = x; p.y = y; }, [x, y]); await sleep(80); }
        // stations (사용자: only when her whole body is covered): right behind its body, and behind its picture's edge
        const stay = async (x, y, name) => { await page.evaluate(([x, y]) => { const p = T.player.player; p.x = x; p.y = y; }, [x, y]); await sleep(900); await page.screenshot({ path: path.join(OUT, name) }); console.log(name, JSON.stringify(await page.evaluate(() => T.field.testCover()))); return page.evaluate(() => T.field.testFade()); };
        const full = await stay(at.x, at.y - 4.6, '2-behind.png');
        ok(full > 0.9, `몸 전체가 수문장 뒤에 가려지면 반투명(${full.toFixed(2)})`);
        const edge = await stay(at.x - 2.6, at.y - 4, '3-edge.png');
        ok(edge < 0.1, `그림 가장자리에 일부만 걸치면 그대로(${edge.toFixed(2)})`);
        const out = await stay(at.x + 3.6, at.y, '4-out.png');
        ok(out < 0.1, `빠져나오면 그대로(${out.toFixed(2)})`);
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) { try { fs.renameSync(await v.path(), path.join(OUT, 'boss-view.webm')); } catch {} }
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
