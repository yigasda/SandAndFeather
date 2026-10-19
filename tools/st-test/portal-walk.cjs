// 출입구 왕복 검수(OPUS-HANDOFF "모든 맵 공통: 출입구·착지·왕복 기준"): 화면 터치(조이스틱)만으로, 동행과 함께
//   1. 출구로 걸어 들어가 스틱을 계속 누른 채 도착 → 1.2초 더 눌러도 되돌아가지 않음, 도착 지점이 착지, 출구 트리거 밖
//   2. 도착 뒤 짧게 앞·뒤·좌·우(사람 폭만큼) → 맵이 바뀌지 않음
//   3. 동행이 트리거 밖에 섬
//   4. 일부러 다시 출구로 걸어가면 정상 귀환(같은 입력으로 두 번 넘어가지 않음)
//   5. 저장·다시 불러오기(새로고침 뒤 게임 다시 열기) → 같은 맵·같은 자리
// 양방향 영상과 도착 화면을 out에 남긴다.
//   node tools/st-test/portal-walk.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/maps/portal-02-t1w');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
// [from map, start entry, exit id, to map, landing entry]
const PAIRS = [['desert_buried_temple', 'west', 'temple', 'desert_forecourt_west', 'south'], ['desert_forecourt_west', 'yard', 'south', 'desert_buried_temple', 'temple']];
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
    const errors = []; page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
    const sleep = ms => page.waitForTimeout(ms);
    const W = require('./touch-walk.cjs')(page, cdp);
    const boot = async () => {
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await sleep(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async base => { window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', ledger: 'core/ledger', map: 'world/map', data: 'core/data' })) T[k] = await import(base + 'src/' + f + '.js'); }, BASE);
    };
    const where = () => page.evaluate(() => {
        const p = T.player.player, m = T.win.currentMap(), q = T.player.follower();
        return { map: m.id, x: p.x, y: p.y, inExit: !!m.exitAt(p.x + 0.5, p.y + 0.8), mateInExit: !!m.exitAt(q.x + 0.5, q.y + 0.8) };
    });
    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await boot();
        await page.evaluate(async () => {
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, 'horus'); await T.win.openGame(); window.toastr?.clear();
        });
        let shot = 0;
        for (const [from, at, exitId, to, land] of PAIRS) {
            const name = `${from.replace('desert_', '')} → ${to.replace('desert_', '')}`;
            await page.evaluate(async ([from, at]) => T.win.travel(from, at), [from, at]); await sleep(1200);
            // walk to just before the exit (its middle, a step back toward the start), then push into it and keep pushing
            const ex = await page.evaluate(([from, exitId]) => { const e = T.win.currentMap().d.exits.find(x => x.id === exitId); return { cx: (e.x0 + e.x1) / 2, cy: (e.y0 + e.y1) / 2 }; }, [from, exitId]);
            const me = await where();
            const fx = me.x + 0.5, fy = me.y + 0.8, d = Math.hypot(ex.cx - fx, ex.cy - fy), ux = (ex.cx - fx) / d, uy = (ex.cy - fy) / d;
            // walk (stick) to the landing that belongs to this exit (the way in from it), then on into the exit
            const near = await page.evaluate(([from, exitId]) => T.win.currentMap().d.entries[exitId], [from, exitId]);
            if (near) await W.walkToPoint(near.x, near.y, 90000, 0.4); else await W.walkToPoint(ex.cx - ux * 2 - 0.5, ex.cy - uy * 2 - 0.8, 90000, 0.5);
            const p = await W.padBox();
            const now = await where(), gx = ex.cx - (now.x + 0.5), gy = ex.cy - (now.y + 0.8), gn = Math.hypot(gx, gy) || 1;
            await W.touch('touchStart', p.x, p.y); await W.touch('touchMove', p.x + gx / gn * p.lim, p.y + gy / gn * p.lim);
            await page.waitForFunction(to => T.win.currentMap()?.id === to, to, { timeout: 15000 }).catch(() => {});
            const arrivedAt = await where();
            await sleep(1200);   // still pushing, 1.2 s after arriving
            const held = await where();
            await W.touch('touchEnd'); await sleep(500);
            const entry = await page.evaluate(([to, land]) => T.map.getMap(to).d.entries[land], [to, land]);
            res.push(`  ${name}: 출구 앞 ${now.map.replace('desert_', '')} (${now.x.toFixed(1)}, ${now.y.toFixed(1)}) → 도착 ${arrivedAt.map.replace('desert_', '')} (${arrivedAt.x.toFixed(1)}, ${arrivedAt.y.toFixed(1)})`);
            ok(arrivedAt.map === to && Math.hypot(arrivedAt.x - entry.x, arrivedAt.y - entry.y) < 0.6 && !arrivedAt.inExit, `${name}: 걸어서 도착, 착지 ${land}(${entry.x.toFixed(1)}, ${entry.y.toFixed(1)}) 자리, 트리거 밖`);
            ok(held.map === to && !held.inExit, `${name}: 도착 뒤 1.2초 더 누르고 있어도 되돌아가지 않음 (${held.map.replace('desert_', '')})`);
            await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-${to.replace('desert_', '')}-${land}.png`) });
            // short steps every way
            const back = [];
            for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                await W.touch('touchStart', p.x, p.y); await W.touch('touchMove', p.x + dx * p.lim, p.y + dy * p.lim); await sleep(260); await W.touch('touchEnd'); await sleep(350);
                const w = await where(); if (w.map !== to) back.push(`${dx},${dy}`);
                if (w.map !== to) break;
            }
            ok(!back.length, `${name}: 도착 뒤 짧게 앞·뒤·좌·우로 움직여도 그대로 ${back.join(' ')}`);
            const mate = await where();
            ok(!mate.mateInExit, `${name}: 동행도 트리거 밖`);
        }
        // the return on purpose and save / load: from T1W's landing, walk back into its exit; then reload where she is
        await page.evaluate(async () => T.win.travel('desert_forecourt_west', 'south')); await sleep(1200);
        const ex = await page.evaluate(() => { const e = T.win.currentMap().d.exits.find(x => x.id === 'south'); return { cx: (e.x0 + e.x1) / 2, cy: (e.y0 + e.y1) / 2 }; });
        const p = await W.padBox();
        await W.touch('touchStart', p.x, p.y); await W.touch('touchMove', p.x, p.y + p.lim);
        await page.waitForFunction(() => T.win.currentMap()?.id === 'desert_buried_temple', null, { timeout: 15000 }).catch(() => {});
        await W.touch('touchEnd'); await sleep(1500);
        const ret = await where();
        ok(ret.map === 'desert_buried_temple', `T1W 착지에서 일부러 아래로 걸어가면 02로 돌아감 (${ret.map})`);
        await sleep(800);
        const twice = await where();
        ok(twice.map === 'desert_buried_temple' && !twice.inExit, '같은 입력으로 두 번 넘어가지 않음');
        // reload: fold the game (saves where she is), reload the page, open it again
        await page.evaluate(async () => T.win.foldGame()); await sleep(800);
        const before = await page.evaluate(() => { const s = T.state.getState(); return s.pos; });
        await page.reload({ waitUntil: 'domcontentloaded' }); await boot();
        await page.evaluate(async () => { await T.win.openGame(); window.toastr?.clear(); }); await sleep(2000);
        const after = await where();
        ok(after.map === before.map && Math.hypot(after.x - before.x, after.y - before.y) < 0.05 && !after.inExit, `저장·다시 불러오기: ${after.map.replace('desert_', '')} (${after.x.toFixed(1)}, ${after.y.toFixed(1)}) 그대로, 트리거 밖`);
        await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-after-reload.png`) });
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) { try { fs.renameSync(await v.path(), path.join(OUT, 'portal.webm')); } catch {} }
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
