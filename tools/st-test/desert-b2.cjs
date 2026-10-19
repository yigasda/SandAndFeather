// 사막 B2: 15 열주홀 반사광 입문(전용 퍼즐 화면). 터치로만 조작한다(CDP 터치 → 말 걸기 버튼, 퍼즐 그림, 버튼).
//   - 받침 앞에서 말 걸기 → 퍼즐 화면(카드)이 열린다. 열린 동안 조이스틱을 밀어도 캐릭터가 움직이지 않는다
//   - 반사판을 눌러 45°씩: / → — → \ 에서 수신부가 켜지고 "해결" 기록(solvedEver, solvedDay), 보상 수령(claimed)은 비어 있음
//   - 닫으면 맵에 수신부 빛, 다시 열면 그 각도 그대로, 처음으로 → 각도만 처음으로(해결 기록은 남음)
//   - 새 채팅의 퍼즐은 따로, 원래 채팅으로 돌아오면 그대로. 페이지 오류 없음. 영상·캡처
//   node tools/st-test/desert-b2.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/b2');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', PX = 52 / 1.55, ID = 'desert.colonnade.mirror';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? 'PASS' : 'FAIL'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {});
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
        recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).map(s => s.trim()).join(' < ')));
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const tap = async (x, y) => { await touch('touchStart', x, y); await page.waitForTimeout(60); await touch('touchEnd'); await page.waitForTimeout(350); };
    const tapEl = async sel => { const b = await page.locator(sel).first().boundingBox(); await tap(b.x + b.width / 2, b.y + b.height / 2); };
    const tapButton = async label => { const b = await page.locator('.sf_pop_wrap[data-kind="puzzle"] .sf_pop_btns button', { hasText: label }).first().boundingBox(); await tap(b.x + b.width / 2, b.y + b.height / 2); };
    // the mirror on the puzzle picture: puzzle (70.4, 40) of 100 × 60
    const tapMirror = async () => { const b = await page.locator('.sf_puzzle_cv').boundingBox(); await tap(b.x + b.width * 0.704, b.y + b.height * 40 / 60); };
    const pz = () => page.evaluate(id => { const p = T.state.getState().puzzles?.[id]; return p ? JSON.parse(JSON.stringify(p)) : null; }, ID);
    const say = () => page.locator('.sf_puzzle_say').textContent();
    const shot = n => page.screenshot({ path: path.join(OUT, n) });
    const openGameAt = async () => {
        await page.evaluate(async () => { await T.win.openGame(); window.toastr?.clear(); });
        await page.waitForTimeout(800);
    };
    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 });
        await page.waitForTimeout(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await page.waitForTimeout(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0));
        await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async base => {
            window.T = {};
            for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes' })) T[k] = await import(base + 'src/' + f + '.js');
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'horus'); T.heroes.setWith(s, 'set');
        }, BASE);
        await openGameAt();
        // in front of the pedestal
        await page.evaluate(async ([x, y]) => T.win.travel('desert_colonnade', { x, y, dir: 'up' }), [1248 / PX - 0.5, 640 / PX - 0.8]);
        await page.waitForTimeout(1800);
        await shot('1-map-before.png');
        ok(await pz() === null, '처음엔 퍼즐 기록 없음');
        await tapEl('.sf_talk');
        await page.waitForTimeout(800);
        ok(await page.locator('.sf_pop_wrap[data-kind="puzzle"]').count() === 1, '받침 앞 말 걸기(터치) → 퍼즐 화면이 열림');
        await shot('2-screen-open.png');
        // the stick does nothing behind the screen
        const before = await page.evaluate(() => [T.player.player.x, T.player.player.y, T.player.player.map]);
        const pad = await page.evaluate(() => { const r = document.querySelector('.sf_pad').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
        await touch('touchStart', pad[0], pad[1]);
        for (let i = 0; i < 16; i++) { await touch('touchMove', pad[0] - 30, pad[1]); await page.waitForTimeout(50); }
        await touch('touchEnd');
        const after = await page.evaluate(() => [T.player.player.x, T.player.player.y, T.player.player.map]);
        ok(JSON.stringify(before) === JSON.stringify(after) && await page.locator('.sf_pop_wrap[data-kind="puzzle"]').count() === 1, '화면이 열린 동안 조이스틱을 밀어도 캐릭터가 그대로');
        // turn: / → —
        await tapMirror();
        let p = await pz();
        ok(p?.orient?.m1 === 1 && !p.solvedEver, `반사판 한 번 누름: — (빛은 옆으로) ${await say()}`);
        await shot('3-turn-1.png');
        // — → \ : lit
        await tapMirror();
        p = await pz();
        ok(p?.orient?.m1 === 2 && p.solvedEver && p.solvedDay != null && !Object.keys(p.claimed || {}).length, `두 번째: \\ → 수신부 켜짐, 해결 기록(${p.solvedDay}), 보상 수령 없음 · ${await say()}`);
        await shot('4-solved.png');
        await tapButton('닫기');
        await page.waitForTimeout(1200);
        ok(await page.locator('.sf_pop_wrap').count() === 0, '닫기 → 맵으로');
        const lit = await page.evaluate(() => T.win && document.querySelectorAll('.sf_pop_wrap').length === 0);
        await page.evaluate(async ([x, y]) => T.win.travel('desert_colonnade', { x, y, dir: 'up' }), [1248 / PX - 0.5, 640 / PX - 0.8]);
        await page.waitForTimeout(1500);
        await shot('5-map-lit.png');
        // the stick works again
        const b2 = await page.evaluate(() => [T.player.player.x, T.player.player.y]);
        await touch('touchStart', pad[0], pad[1]);
        for (let i = 0; i < 10; i++) { await touch('touchMove', pad[0], pad[1] + 30); await page.waitForTimeout(50); }
        await touch('touchEnd');
        const a2 = await page.evaluate(() => [T.player.player.x, T.player.player.y]);
        ok(lit && Math.hypot(a2[0] - b2[0], a2[1] - b2[1]) > 0.2, '닫은 뒤 조이스틱으로 다시 걷는다');
        // back to the pedestal, reopen: the angle as it was
        await page.evaluate(async ([x, y]) => T.win.travel('desert_colonnade', { x, y, dir: 'up' }), [1248 / PX - 0.5, 640 / PX - 0.8]);
        await page.waitForTimeout(1200);
        await tapEl('.sf_talk');
        await page.waitForTimeout(800);
        ok((await say()).includes('수신부에 빛이 닿았다'), `다시 열면 그 각도 그대로: ${await say()}`);
        await tapButton('처음으로');
        p = await pz();
        ok(p.orient.m1 === 0 && p.solvedEver, `처음으로: 각도만 처음(/), 해결 기록은 남음 · ${await say()}`);
        await shot('6-reset.png');
        await tapButton('닫기');
        await page.waitForTimeout(600);
        // another chat: its own puzzle
        const chatA = await page.evaluate(() => SillyTavern.getContext().chatId);
        await page.evaluate(async () => { await T.win.closeGame(); });
        await page.evaluate(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); });
        await page.waitForFunction(a => SillyTavern.getContext().chatId && SillyTavern.getContext().chatId !== a, chatA, { timeout: 30000 });
        await page.waitForTimeout(1500);
        ok(await pz() === null, '새 채팅의 퍼즐은 따로(기록 없음)');
        await page.evaluate(async a => { await SillyTavern.getContext().openCharacterChat(a); }, chatA);
        await page.waitForFunction(a => SillyTavern.getContext().chatId === a, chatA, { timeout: 30000 });
        await page.waitForTimeout(1500);
        p = await pz();
        ok(p?.solvedEver && p.orient.m1 === 0, `원래 채팅: 해결 기록·각도 그대로 (${JSON.stringify(p?.orient)})`);
        // the chat changes while the screen is open: a touch on the old screen changes neither chat
        await openGameAt();
        await page.evaluate(async ([x, y]) => T.win.travel('desert_colonnade', { x, y, dir: 'up' }), [1248 / PX - 0.5, 640 / PX - 0.8]);
        await page.waitForTimeout(1200);
        await tapEl('.sf_talk');
        await page.waitForTimeout(800);
        const cvBox = await page.locator('.sf_puzzle_cv').boundingBox();
        const aBefore = JSON.stringify((await pz()).orient);
        await page.evaluate(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); });
        await page.waitForFunction(a => SillyTavern.getContext().chatId && SillyTavern.getContext().chatId !== a, chatA, { timeout: 30000 });
        await page.waitForTimeout(1200);
        const still = await page.locator('.sf_pop_wrap[data-kind="puzzle"]').count();
        if (still) await tap(cvBox.x + cvBox.width * 0.704, cvBox.y + cvBox.height * 40 / 60);
        ok(await pz() === null, `채팅이 바뀐 뒤 옛 화면을 눌러도 새 채팅엔 기록이 안 생김 (화면 ${still ? '열려 있다가 눌러서 닫힘' : '이미 닫힘'})`);
        await page.evaluate(async a => { await SillyTavern.getContext().openCharacterChat(a); }, chatA);
        await page.waitForFunction(a => SillyTavern.getContext().chatId === a, chatA, { timeout: 30000 });
        await page.waitForTimeout(1500);
        ok(JSON.stringify((await pz()).orient) === aBefore, `원래 채팅의 각도도 그대로 (${aBefore})`);
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) fs.renameSync(await v.path(), path.join(OUT, 'b2-puzzle.webm'));
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
