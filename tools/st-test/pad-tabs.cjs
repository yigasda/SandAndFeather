// 조이스틱과 하단 탭(사용자 10-19): 화면 터치(CDP)로
//   1. 조이스틱 바깥 여유(손가락이 미끄러져도 받는 30px)와 하단 탭이 겹치는 곳을 누르면 탭이 받는다(조이스틱이 가로채지 않음)
//   2. 조이스틱을 잡고 탭 위로 끌고 가서 떼도 탭이 눌리지 않는다(세계 탭 그대로, 카드 안 열림)
//   3. 조이스틱으로 움직이는 동안 다른 손가락으로 공격·스킬을 누르면 둘 다 된다(계속 움직이고, 공격·스킬이 나감)
// 412×900·360×740, dpr 2, T1W(전투 버튼이 있는 맵)
//   node tools/st-test/pad-tabs.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/ui-mock/pad-tabs');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    for (const [W, H] of [[412, 900], [360, 740]]) {
        const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
        const errors = []; page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
        const sleep = ms => page.waitForTimeout(ms);
        // (touchEnd lists the fingers lifted, the others stay down)
        const touches = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id })) });
        const tag = `${W}x${H}`;
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
                T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, null); await T.win.openGame(); window.toastr?.clear();
            }, BASE);
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
            await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; });
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(1500);
            await page.evaluate(() => T.field.testOnly('desert_leather_shield', 0, 0, { hp: 999, speed: 0, range: 0 }));   // out of the way: no fight starting by itself
            const box = sel => page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }, sel);
            const pad = await box('.sf_pad'), tabs = await box('.sf_tabs');
            const tabOn = () => page.evaluate(() => document.querySelector('.sf_tab.sf_on')?.dataset.tab);
            // 1. the overlap of the pad's margin and the tab bar: who takes a touch there
            const pts = [];
            for (let x = pad.x0 - 30; x <= pad.x1 + 30; x += 6) for (let y = tabs.y0 + 2; y <= Math.min(tabs.y1, pad.y1 + 30); y += 4) if (Math.hypot(x - pad.cx, y - pad.cy) <= (pad.x1 - pad.x0) / 2 + 30) pts.push([x, y]);
            const who = await page.evaluate(pts => pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e?.closest('.sf_pad') ? 'pad' : e?.closest('.sf_tabs') ? 'tabs' : e?.className || '?'; }), pts);
            const stolen = who.filter(w => w === 'pad').length;
            ok(stolen === 0, `${tag} 하단 탭과 겹치는 곳(${pts.length}점)은 탭이 받음 — 조이스틱이 가로챈 점 ${stolen}`);
            // 2. hold the pad, drag over a tab, let go there
            const tab2 = await page.evaluate(() => { const b = document.querySelectorAll('.sf_tab')[1].getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
            await touches('touchStart', [[pad.cx, pad.cy, 1]]);
            for (let k = 1; k <= 10; k++) { await touches('touchMove', [[pad.cx + (tab2.x - pad.cx) * k / 10, pad.cy + (tab2.y - pad.cy) * k / 10, 1]]); await sleep(40); }
            await sleep(200); await touches('touchEnd', []); await sleep(500);
            const card = await page.locator('.sf_pop_wrap').count();
            ok(await tabOn() === 'world' && card === 0, `${tag} 조이스틱을 잡고 탭(일행) 위에서 떼도 탭이 안 눌림 (탭 ${await tabOn()}, 카드 ${card})`);
            await page.screenshot({ path: path.join(OUT, `${tag}-drag-over-tab.png`) });
            // 3. moving with the pad (right), the other thumb on 공격 then 스킬
            const atk = await box('.sf_talk'), sk = await box('.sf_duat_skill');
            await page.evaluate(() => T.field.testEvents(true));
            const x0 = await page.evaluate(() => T.player.player.x);
            const hold = [pad.cx + 30, pad.cy, 1];
            await touches('touchStart', [[pad.cx, pad.cy, 1]]); await touches('touchMove', [hold]); await sleep(400);
            res.push('  t0 ' + await page.evaluate(() => T.field.testNow())); await touches('touchStart', [hold, [atk.cx, atk.cy, 2]]); await sleep(80); await touches('touchEnd', [[atk.cx, atk.cy, 2]]); await sleep(1300);   // 공격 is over (its own picture) before 스킬
            const x1 = await page.evaluate(() => T.player.player.x);
            res.push('  t1 ' + await page.evaluate(() => T.field.testNow())); await touches('touchStart', [hold, [sk.cx, sk.cy, 3]]); await sleep(80); await touches('touchEnd', [[sk.cx, sk.cy, 3]]); await sleep(700);
            const x2 = await page.evaluate(() => T.player.player.x);
            await page.screenshot({ path: path.join(OUT, `${tag}-move-and-press.png`) });
            await touches('touchEnd', []); await sleep(300);
            const all = await page.evaluate(() => T.field.testEvents(true)), ev = all.filter(e => e.ev === 'press').map(e => e.what);
            res.push(`  ${tag} 입력 기록: ${all.filter(e => e.ev === 'press' || e.ev === 'ignored').map(e => e.t + ' ' + e.ev + ':' + e.what + (e.why ? '(' + e.why + ')' : '')).join(', ')}`);
            ok(ev.includes('attack') && ev.includes('skill'), `${tag} 움직이는 중 다른 손가락으로 공격·스킬 (${ev.join(', ') || '없음'})`);
            ok(x1 > x0 + 0.5 && x2 > x1 + 0.3, `${tag} 누르는 동안에도 계속 움직임 (x ${x0.toFixed(1)} → ${x1.toFixed(1)} → ${x2.toFixed(1)})`);
            ok(!errors.length, `${tag} 페이지 오류 없음 ${errors.join('; ')}`);
        } finally { await context.close(); }
    }
    await browser.close();
    fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
