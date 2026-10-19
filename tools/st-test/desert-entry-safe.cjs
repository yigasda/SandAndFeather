// 입구 안전구역(사용자 10-19: T1W 착지에 몹이 다가와 입장하자마자 공격받거나 출구가 막히지 않게, 착지는 옮기지 않음).
// 가죽 방패병은 승인 수치 그대로(data/desert.json). 화면 터치(조이스틱·공격 버튼)로:
//   1. 02 신전 문으로 걸어 들어와(동행 함께) 12초 그대로 — 맞지 않음, 몹이 구역(착지 둘레·출구까지)에 안 들어옴
//   2. 몹을 구역 바로 바깥에 세워 두고 10초 — 공격을 시작하지 않음, 구역에 안 들어옴
//   3. 구역 밖으로 걸어 나가면 — 정상으로 공격받음
//   4. 구역 안에서 먼저 때리면 — 반격(공격 준비)은 오지만 몹은 여전히 구역 밖
// 영상·캡처(시험용 범위 표시: 하늘색 = 안전구역)를 out에 남긴다.
//   node tools/st-test/desert-entry-safe.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/mobs/entry-safe');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
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
    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await sleep(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async base => {
            window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', ledger: 'core/ledger', field: 'packs/duat/field' })) T[k] = await import(base + 'src/' + f + '.js');
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, 'horus'); await T.win.openGame(); window.toastr?.clear();
            // every 50 ms: the deepest any creature's feet went into a safe zone, and her 체력
            T.watch = () => { T.deep = 0; clearInterval(T.watchT); T.watchT = setInterval(() => { for (const o of T.field.fieldState().mobs) T.deep = Math.max(T.deep, T.field.testSafe(o.x + 0.5, o.y + 0.8)); }, 50); };
        }, BASE);
        const hp = () => page.evaluate(() => T.field.fieldState().run?.hp?.set ?? null);
        const deep = () => page.evaluate(() => T.deep);
        // 1. in through 02's temple door, on foot
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'temple')); await sleep(1000);
        await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; });
        const p = await W.padBox();
        // toward the middle of the temple door (it is up and a little right of the steps' landing)
        const v = await page.evaluate(() => { const m = T.win.currentMap(), e = m.d.exits.find(x => x.id === 'temple'), q = T.player.player, dx = (e.x0 + e.x1) / 2 - q.x - 0.5, dy = (e.y0 + e.y1) / 2 - q.y - 0.8, n = Math.hypot(dx, dy); return [dx / n, dy / n]; });
        await W.touch('touchStart', p.x, p.y); await W.touch('touchMove', p.x + v[0] * p.lim, p.y + v[1] * p.lim);
        await page.waitForFunction(() => T.win.currentMap()?.id === 'desert_forecourt_west', null, { timeout: 15000 });
        await W.touch('touchEnd');
        await page.evaluate(() => { T.field.testRanges(true); T.watch(); });
        const h0 = await hp();
        await sleep(1500); await page.screenshot({ path: path.join(OUT, '1-arrived.png') });
        await sleep(10500);
        const z = await page.evaluate(() => T.field.testZones());
        ok((await hp()) === h0 && (await deep()) <= 0, `들어와서 12초: 체력 ${h0} → ${await hp()}, 몹이 구역에 들어간 깊이 ${(await deep()).toFixed(2)}칸 (구역 ${z.length}곳, 반경 ${z[0]?.r.toFixed(1)}칸)`);
        await page.screenshot({ path: path.join(OUT, '2-after-12s.png') });
        // 2–4 her alone (the one with her walks out to fight and takes its attention), in again at the same landing
        await page.evaluate(async () => { const s = T.state.getState(); T.heroes.setWith(s, null); await T.win.travel('desert_buried_temple', 'temple'); });
        await sleep(800);
        await page.evaluate(async () => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; await T.win.travel('desert_forecourt_west', 'south'); });
        await sleep(1200);
        await page.evaluate(() => { T.field.testRanges(true); T.field.testReset(); });
        // 2. one right outside the zone, toward her
        const at = await page.evaluate(() => ({ x: T.player.player.x, y: T.player.player.y }));
        const r = z.find(q => Math.hypot(q.a.x - at.x - 0.5, q.a.y - at.y - 0.8) < 0.5)?.r || 3.5;
        await page.evaluate(([x, y]) => { T.field.testOnly('desert_leather_shield', x, y, {}); T.watch(); T.field.testEvents(true); }, [at.x, at.y - r - 0.6]);
        const h1 = await hp();
        await sleep(10000);
        const ev = await page.evaluate(() => T.field.testEvents(true).filter(e => e.ev === 'prepare' || e.ev === 'hurt').length);
        ok((await hp()) === h1 && (await deep()) <= 0, `구역 바로 밖 몹 10초: 체력 ${h1} → ${await hp()}, 구역 깊이 ${(await deep()).toFixed(3)}칸 (준비·공격 ${ev}번)`);
        await page.screenshot({ path: path.join(OUT, '3-edge.png') });
        // 3. out of the zone toward it: it strikes as usual
        const h2 = await hp();
        await W.walkToPoint(at.x, at.y - r - 2, 15000, 0.4);
        let hurt = false;
        for (let k = 0; k < 40 && !hurt; k++) { await sleep(250); hurt = (await hp()) < h2; }
        ok(hurt, `구역 밖으로 나가면 정상으로 공격받음 (체력 ${h2} → ${await hp()})`);
        await page.screenshot({ path: path.join(OUT, '4-outside.png') });
        // 4. back in, just inside the edge; she strikes it from there: it may come in after her and strike back (no hitting
        //    it from shelter for ever); left alone 3 s, it walks out again and leaves her be
        await W.walkToPoint(at.x, at.y - r + 1.0, 15000, 0.25);
        await page.evaluate(([x, y]) => { T.field.testOnly('desert_leather_shield', x, y, { guard: 0 }); T.watch(); }, [at.x, at.y - r - 0.5]);
        await sleep(400);
        const h4 = await hp();
        await page.evaluate(() => { T.field.testReset(); T.field.testEvents(true); });
        let back = false;
        for (let k = 0; k < 6 && !back; k++) { await W.tapEl('.sf_talk'); await sleep(500); back = (await hp()) < h4 || await page.evaluate(() => T.field.testEvents().some(e => e.ev === 'hurt')); }
        const came = await deep();
        ok(back, `구역 안에서 먼저 때리면 반격을 받음(체력 ${h4} → ${await hp()}, 몹이 구역에 들어온 깊이 ${came.toFixed(2)}칸) — 구역 안에서 일방적으로 계속 때릴 수 없음`);
        await page.screenshot({ path: path.join(OUT, '5-provoked.png') });
        // stop; it goes out again; from then on she is not hurt
        await W.walkToPoint(at.x, at.y, 15000, 0.3);
        await sleep(4000);
        await page.evaluate(() => T.watch());
        const h5 = await hp();
        await sleep(5000);
        ok((await hp()) === h5 && (await deep()) <= 0, `3초 넘게 안 때리면 몹은 구역 밖으로 나가고 더 공격하지 않음 (체력 ${h5} → ${await hp()}, 깊이 ${(await deep()).toFixed(2)}칸)`);
        // 5. the one with her strikes first: it goes for them only; she, in the zone, is not hurt
        await page.evaluate(async () => { const s = T.state.getState(); T.heroes.setWith(s, 'horus'); await T.win.travel('desert_buried_temple', 'temple'); });
        await sleep(800);
        await page.evaluate(async () => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; await T.win.travel('desert_forecourt_west', 'south'); });
        await sleep(1500);
        await page.evaluate(([x, y]) => { T.field.testRanges(true); T.field.testReset(); T.field.testOnly('desert_leather_shield', x, y, { guard: 0 }); T.watch(); }, [at.x + 1, at.y - r - 0.6]);
        await sleep(300);
        const h6 = await hp();
        await page.evaluate(() => { T.field.testEvents(true); T.field.testStrikeBy('horus'); });
        await sleep(6000);
        const evs = await page.evaluate(() => T.field.testEvents(true));
        const targets = evs.filter(e => e.ev === 'hurt').map(e => e.who);
        ok((await hp()) === h6, `동행이 먼저 때리면 몹은 동행에게만 반격 — 구역 안의 세트 체력 ${h6} → ${await hp()} (맞은 쪽: ${[...new Set(targets)].join(', ') || '없음'})`);
        await page.screenshot({ path: path.join(OUT, '6-mate-first.png') });
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) { try { fs.renameSync(await v.path(), path.join(OUT, 'entry-safe.webm')); } catch {} }
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
