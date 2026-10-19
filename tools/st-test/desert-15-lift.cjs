// 15 열주홀 빛 퍼즐 A안 "올림 틀" 맵 안 시제품: 터치만으로 걷고(조이스틱), 장치 앞에서 말 걸기 → 작은 장치 창의 버튼.
// 별도 퍼즐 화면 없이 같은 맵에서 빛이 바뀌는 것을 영상으로 남기고 검사한다.
//   1 처음: 낮은 빛이 단 앞 턱에 막힘   2 힌트   3 받침을 돌려 빛을 틀(a1)으로 → 높아져 온 쪽(동쪽)으로 돌아감(오답에서 배움)
//   4 틀을 홈 따라 받침 아래(a3)로, 고리를 북쪽으로   5 받침이 빛을 남쪽으로 → 높은 빛이 받침 위를 지나 고리 점등(해결 기록)
//   6 처음으로: 장치만 처음, 해결 기록 유지, 캐릭터가 틀 안에 갇히지 않음   7 틀은 발을 막음, 다시 걷기   8 새 채팅은 따로
//   node tools/st-test/desert-15-lift.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/puzzle15/play');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', PX = 52 / 1.55, ID = 'desert.colonnade.lift';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };
const T2 = (x, y) => [x / PX - 0.5, y / PX - 0.8];   // picture point where her feet should be → her x, y

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
        recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const W = require('./touch-walk.cjs')(page, cdp);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).map(s => s.trim()).join(' < ')));
    const shot = n => page.screenshot({ path: path.join(OUT, n) });
    const st = () => page.evaluate(() => T.lift.liftTest.state());
    const say = () => page.locator('.sf_dev_say').textContent().catch(() => '');
    const talk = async () => { await W.tapEl('.sf_talk'); await page.waitForTimeout(700); };
    const btn = async label => { await W.tapEl('.sf_dev_btns button', label); await page.waitForTimeout(450); };
    const go = async (x, y) => { const [tx, ty] = T2(x, y); return W.walkToPoint(tx, ty); };
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
            for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', lift: 'packs/puzzle/colonnade-lift' })) T[k] = await import(base + 'src/' + f + '.js');
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'horus'); T.heroes.setWith(s, 'set');
            await T.win.openGame(); window.toastr?.clear();
        }, BASE);
        await page.evaluate(async () => T.win.travel('desert_colonnade', 'east'));
        await page.waitForTimeout(1500);
        ok(!(await page.evaluate(id => !!T.state.getState().puzzles?.[id], ID)), '들어와 둘러보기만 하면 퍼즐 기록이 생기지 않음');

        // 1 the pedestal: the light as it is
        ok(await go(1250, 625), '조이스틱으로 받침 앞까지 걸어감');
        await W.face(0, -1); await talk();
        ok(await page.locator('.sf_dev').count() === 1 && (await say()).includes('단 앞 턱'), `말 걸기 → 맵 위 작은 장치 창(화면 전환 없음): ${await say()}`);
        await shot('1-start.png');
        // 2 a hint
        await btn('힌트');
        ok((await say()).includes('멈추는지'), `힌트 1: ${await say()}`);
        // 3 turn the pedestal: south, then the side → into the pillar at a1 → back east, high
        await btn('돌리기'); await btn('돌리기');
        let s = await st();
        ok(s.pedestal === 0 && s.end.level === 'low', `받침 두 번: 빛이 남쪽으로 (${await say()})`);
        await shot('2-south.png');
        await btn('돌리기');
        s = await st();
        ok(s.pedestal === 1 && s.end.level === 'high', `받침 한 번 더: 빛이 틀에 들어가 높아져서 온 쪽으로 돌아감 (${await say()})`);
        await page.waitForTimeout(1200); await shot('3-lifted-back.png');
        // 4 the pillar: down the groove, then right, under the pedestal
        ok(await go(1000, 640), '틀 앞으로 걸어감');
        await W.face(0, -1); await talk();
        ok((await page.locator('.sf_dev b').textContent()).includes('올림 틀'), '틀에 말 걸기 → 틀 창');
        await btn('▼ 밀기');
        s = await st();
        ok(s.at === 'a2', `틀을 홈 따라 아래로 (${s.at})`);
        await page.waitForTimeout(600);
        ok(await go(1000, 790) || await go(1000, 780), '틀 아래쪽으로 돌아감(틀이 길을 막아 돌아서)');
        await W.face(0, -1); await talk();
        await btn('▶ 밀기');
        s = await st();
        ok(s.at === 'a3', `틀을 오른쪽으로, 받침 아래 자리로 (${s.at})`);
        await page.waitForTimeout(600);
        ok(await go(1205, 735), '틀 옆으로 걸어감');
        await W.face(1, 0); await talk();
        for (let i = 0; i < 3; i++) await btn('면 돌리기');
        s = await st();
        ok(s.face === 'N', `틀 고리를 북쪽으로 (${s.face}) — 빛: ${await say()}`);
        await shot('4-pillar-set.png');
        // 5 back to the pedestal: light south → into the pillar → high, over the pedestal → the ring
        ok(await go(1250, 625), '다시 받침 앞으로');
        await W.face(0, -1); await talk();
        for (let i = 0; i < 3; i++) await btn('돌리기');
        s = await st();
        const saved = await page.evaluate(id => JSON.parse(JSON.stringify(T.state.getState().puzzles[id])), ID);
        ok(s.end.kind === 'ring' && saved.solvedEver && saved.solvedDay != null && !Object.keys(saved.claimed).length, `받침이 빛을 남쪽으로 → 틀에서 높아져 받침 위를 지나 고리 점등, 해결 기록(${saved.solvedDay}), 보상 없음 · ${await say()}`);
        await W.walkToPoint(...T2(1150, 640)); await page.waitForTimeout(1500); await shot('5-solved.png');
        // 6 처음으로 by the pillar: only the devices go back, the record stays; she is not shut in the stone
        ok(await go(1205, 735), '틀 옆으로');
        await W.face(1, 0); await talk();
        await btn('처음으로');
        s = await st();
        const saved2 = await page.evaluate(id => JSON.parse(JSON.stringify(T.state.getState().puzzles[id])), ID);
        const inside = await page.evaluate(() => { const p = T.player.player, m = T.win.currentMap(); return m.solidRect(p.x + 0.22, p.y + 0.62, p.x + 0.78, p.y + 0.96); });
        const toast = await page.locator('.sf_toast, .sf_pop_toast, [class*=toast]').allTextContents().catch(() => []);
        ok(s.at === 'a1' && s.pedestal === 2 && s.face === 'E' && saved2.solvedEver && !inside, `처음으로: 장치만 처음 자리, 해결 기록 유지, 캐릭터 막힘 없음 · ${toast.join(' ').trim()}`);
        await page.waitForTimeout(800); await shot('6-reset.png');
        if (await page.locator('.sf_dev').count()) await btn('닫기');
        // 7 the pillar stops feet; walking still works
        const blocked = await page.evaluate(() => { const m = T.win.currentMap(), b = m.dynamic[0]; return !!b && m.solidRect((b.x0 + b.x1) / 2 - 0.2, (b.y0 + b.y1) / 2 - 0.2, (b.x0 + b.x1) / 2 + 0.2, (b.y0 + b.y1) / 2 + 0.2); });
        const moved = await go(1400, 650);
        ok(blocked && moved, '틀 자리는 발을 막고, 조이스틱으로 계속 걸음');
        // 8 another chat: its own
        const chatA = await page.evaluate(() => SillyTavern.getContext().chatId);
        await page.evaluate(async () => { await T.win.closeGame(); await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); });
        await page.waitForFunction(a => SillyTavern.getContext().chatId && SillyTavern.getContext().chatId !== a, chatA, { timeout: 30000 });
        await page.waitForTimeout(1200);
        ok(!(await page.evaluate(id => !!T.state.getState()?.puzzles?.[id], ID)), '새 채팅에는 이 퍼즐 기록이 없음');
        await page.evaluate(async a => { await SillyTavern.getContext().openCharacterChat(a); }, chatA);
        await page.waitForFunction(a => SillyTavern.getContext().chatId === a, chatA, { timeout: 30000 });
        await page.waitForTimeout(1200);
        ok(await page.evaluate(id => !!T.state.getState()?.puzzles?.[id]?.solvedEver, ID), '원래 채팅: 해결 기록 그대로');
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) fs.renameSync(await v.path(), path.join(OUT, 'play.webm'));
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
