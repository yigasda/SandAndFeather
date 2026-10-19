// 사막 맵 ID가 바뀐 저장 옮기기: 0.9.84의 desert_01..04(저장 12판)와 시험 저장의 desert_11·desert_17(13판)이
// 의미 ID로 옮겨지고(src/core/state.js STEPS 12·13), 게임을 열면 그 맵 그 자리에 선다. 본 장소(explore.seen)도 따라간다.
//   node tools/st-test/desert-save-move.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
let fail = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'} ${msg}`); if (!c) fail++; };
(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {});
    const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
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
        const cases = [[12, 'desert_03', 'desert_quiet_dunes', 50, 30], [12, 'desert_01', 'desert_golden_dunes', 40, 20],
            [13, 'desert_17', 'desert_city_plaza', 38.5, 9], [13, 'desert_11', 'desert_city_gate', 20.66, 11.1]];
        for (const [v, from, to, x, y] of cases) {
            const r = await page.evaluate(async ({ base, v, from, x, y }) => {
                const st = await import(base + 'src/core/state.js'), win = await import(base + 'src/ui/window.js'), pl = await import(base + 'src/world/player.js');
                st.resetState(); const old = structuredClone(st.getState());
                old.v = v; old.pos = { map: from, x, y, dir: 'left' }; old.explore.seen = { [`room:${from}`]: 3, [`${from}:spot`]: 2, 'ombos:well': 1 };
                SillyTavern.getContext().chatMetadata.sand_feather = old;
                const s = st.getState(); await win.openGame(); await new Promise(r => setTimeout(r, 1500));
                return { v: s.v, cur: st.STATE_VERSION, pos: s.pos, seen: Object.keys(s.explore.seen).sort(), on: pl.player.map, xy: [pl.player.x, pl.player.y] };
            }, { base: BASE, v, from, x, y });
            ok(r.v === r.cur && r.pos.map === to && r.on === to && Math.abs(r.xy[0] - x) < 1e-6 && Math.abs(r.xy[1] - y) < 1e-6,
                `저장 ${v}판 ${from} → ${to}, 그 자리(${x}, ${y})에 섬: ${JSON.stringify({ v: r.v, map: r.on, xy: r.xy })}`);
            ok(r.seen.includes(`room:${to}`) && r.seen.includes(`${to}:spot`) && r.seen.includes('ombos:well') && !r.seen.some(k => k.includes(from)),
                `본 장소도 옮겨짐: ${r.seen.join(', ')}`);
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally { await browser.close(); }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
