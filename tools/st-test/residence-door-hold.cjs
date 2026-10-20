// 옴보스 안채 문 회귀(사용자 10-20, 0.9.80 → 0.9.90): 서쪽 회랑에서 방 입구 회랑으로 걸어 들어온 뒤 호루스 방 문으로.
//   A) 스틱을 놓지 않고 그대로 왼쪽으로 밀어 문까지   B) 도착 뒤 한 번 놓았다가 다시 왼쪽으로
// 둘 다 호루스 방으로 가야 한다(0.9.80 동작). 출구 규칙(사용자 10-20): 도착 때 발이 겹친 출구만 벗어날 때까지 막고, 다른
// 출구는 처음부터 — C) 문 안에 도착하면 넘어가지 않고, 벗어났다 다시 들어가면 넘어감, D) 도착 직후 스틱을 유지한 채 들어온
// 출구로 가도 바로 돌아가지 않고, 벗어났다 다시 들어가면 돌아감.
//   node tools/st-test/residence-door-hold.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || '/tmp/residence-door-hold');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const errors = []; page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
    const sleep = ms => page.waitForTimeout(ms);
    const W = require('./touch-walk.cjs')(page, cdp);
    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await sleep(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async base => {
            window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes' })) T[k] = await import(base + 'src/' + f + '.js');
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, 'horus'); await T.win.openGame(); window.toastr?.clear();
        }, BASE);
        const where = () => page.evaluate(() => ({ map: T.player.player.map, x: +T.player.player.x.toFixed(2), y: +T.player.player.y.toFixed(2) }));
        const until = async (id, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await where()).map === id) return true; await sleep(50); } return false; };
        // into the room corridor on foot from the west gallery (its exit at the top left), the stick held up
        const intoCorridor = async () => {
            await page.evaluate(async () => { await T.win.travel('temple_west_gallery'); const p = T.player.player; p.x = 1.3; p.y = 3.9; }); await sleep(700);
            const pad = await W.padBox();
            await W.touch('touchStart', pad.x, pad.y); await W.touch('touchMove', pad.x, pad.y - pad.lim);
            const got = await until('room_entrances_wide', 6000);
            return { pad, got };
        };
        for (const [name, letGo] of [['A 스틱 유지 → 호루스 방 문', false], ['B 놓았다가 → 호루스 방 문', true]]) {
            const { pad, got } = await intoCorridor();
            if (!got) { ok(false, `${name}: 방 입구 회랑에 걸어 들어가지 못함 ${JSON.stringify(await where())}`); await W.touch('touchEnd'); continue; }
            const at = await where();
            if (letGo) { await W.touch('touchEnd'); await sleep(300); }
            // along the walkable way to the middle of Horus's door (feet in it), the thumb on the stick all along in A
            const door = await page.evaluate(() => { const e = T.win.currentMap().exits.find(x => x.to === 'horus_room'); return { x: (e.x0 + e.x1) / 2 - 0.5, y: e.y1 - 0.3 - 0.8 }; });
            await W.walkToPoint(door.x, door.y, 12000, 0.3, { held: !letGo, keep: true });
            const reached = await until('horus_room', 3000), end = await where();
            await W.touch('touchEnd'); await sleep(300);
            ok(reached, `${name}: 도착 ${JSON.stringify(at)} → 끝 ${JSON.stringify(end)}`);
        }
        // C: put down with her feet in Horus's door (as an arrival that lands in an exit): it does not take her; out of it
        // and back in, it does
        await page.evaluate(async () => { const m = await T.win.travel('room_entrances_wide'); });
        await sleep(400);
        const inDoor = await page.evaluate(async () => {
            const m = T.win.currentMap(), e = m.exits.find(x => x.to === 'horus_room');
            const s = T.state.getState(); s.pos = { map: 'room_entrances_wide', x: (e.x0 + e.x1) / 2 - 0.5, y: e.y1 - 0.4 - 0.8, dir: 'down' };
            await T.win.travel('room_entrances_wide', { x: (e.x0 + e.x1) / 2 - 0.5, y: e.y1 - 0.4 - 0.8 });
            return T.win.testDoor?.();
        });
        await sleep(1200);
        const stay = await where();
        ok(stay.map === 'room_entrances_wide', `C 문 안에 도착: 그 문으로 바로 넘어가지 않음 (${JSON.stringify(stay)}, 막힌 출구 ${JSON.stringify(inDoor?.held)})`);
        const pad = await W.padBox();
        await W.touch('touchStart', pad.x, pad.y); await W.touch('touchMove', pad.x, pad.y + pad.lim); await sleep(700);   // down, out of it
        await W.touch('touchMove', pad.x, pad.y - pad.lim);                                                                  // and back up into it
        const backIn = await until('horus_room', 4000); await W.touch('touchEnd'); await sleep(300);
        ok(backIn, `C 벗어났다가 다시 들어가면 정상 이동 (${JSON.stringify(await where())})`);
        // D: just arrived in the corridor, the thumb still on the stick, straight back into the exit she came in by: held
        // (no bounce); out of it and in again: back to the west gallery
        {
            const { pad, got } = await intoCorridor();
            const arrived = await page.evaluate(() => T.win.testDoor?.());
            const back = await page.evaluate(() => { const e = T.win.currentMap().exits.find(x => x.to === 'temple_west_gallery'); return { x: (e.x0 + e.x1) / 2 - 0.5, y: (e.y0 + e.y1) / 2 - 0.8 }; });
            if (got) await W.walkToPoint(back.x, back.y, 4000, 0.2, { held: true, keep: true });
            const held = (await where()).map === 'room_entrances_wide';
            await W.touch('touchMove', pad.x, pad.y + pad.lim); await sleep(600);   // down, out of it
            await W.touch('touchMove', pad.x, pad.y - pad.lim);                       // and up into it again
            const ret = await until('temple_west_gallery', 4000); await W.touch('touchEnd'); await sleep(300);
            ok(got && held, `D 도착 직후 스틱 유지로 들어온 출구에 다시 들어가도 바로 돌아가지 않음 (도착 때 막힌 출구 ${JSON.stringify(arrived?.held)})`);
            ok(ret, `D 그 출구에서 벗어났다가 다시 들어가면 돌아감 (${JSON.stringify(await where())})`);
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        await context.close(); await browser.close();
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
