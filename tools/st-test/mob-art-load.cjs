// 사막 몹 그림 불러오기·메모리 측정(사용자 10-19): 폰 화면(412×900, dpr 2), CPU 4배 느리게(CDP). 측정만 하고 기준을 정하지 않는다.
//   - T1W에 들어가 가죽 방패병이 처음 그려질 때까지 걸린 시간, 그때 메모리에 풀린 몹 그림(가로 × 세로 × 4 바이트)과 어느 크기 묶음인지
//   - 큰 몹(신전 수문장 4.2배)을 그 자리에 세웠을 때 같은 값
//   - 맵을 여러 번 오가도 몹 그림이 쌓이지 않는지(필드가 아닌 맵에서 0, 돌아오면 그 맵 몹만)
//   node tools/st-test/mob-art-load.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/mobs/load');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
fs.mkdirSync(OUT, { recursive: true });
const lines = []; let fail = 0;
const log = m => { console.log(m); lines.push(m); };
const ok = (c, m) => { log(`${c ? '통과' : '실패'} ${m}`); if (!c) fail++; };
const MB = b => (b / 1048576).toFixed(1) + ' MB';

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
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
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'somang'); await T.win.openGame(); window.toastr?.clear();
        }, BASE);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        log('조건: 412×900 dpr 2, CPU 4배 느리게, 로컬 서버(네트워크 지연 없음 — 실제 폰은 내려받는 시간이 더해진다)');
        // the first creature drawn on entering T1W
        const firstDraw = async (prep, wantKind) => page.evaluate(async ([prep, wantKind]) => {
            const t0 = performance.now();
            if (prep === 't1w') await T.win.travel('desert_forecourt_west', 'yard');
            else { const p = T.player.player; T.field.testOnly(wantKind, p.x + 4, p.y, { ...T.data.DATA.desert.enemies.desert_leather_shield, hp: 999, speed: 0, range: 0 }); }
            const name = wantKind.replace(/_/g, '-');
            while (performance.now() - t0 < 30000) {
                const a = T.field.testArt();
                if (a.files.some(f => f.includes(name))) return { ms: Math.round(performance.now() - t0), ...a, H: 31.2 * (T.win.currentMap()?.d?.actorScale || 1) };
                await new Promise(r => setTimeout(r, 16));
            }
            return null;
        }, [prep, wantKind]);
        const settled = async () => { await sleep(4000); return page.evaluate(() => T.field.testArt()); };
        let r = await firstDraw('t1w', 'desert_leather_shield'), q = await settled();
        ok(!!r, `T1W 들어가서 가죽 방패병: 처음 보이기까지 ${r?.ms} ms(${r?.files.join(', ')}) → 자리 잡은 뒤 몹 그림 ${q.files.length}장 ${MB(q.bytes)} (${q.files.join(', ')})`);
        r = await firstDraw('boss', 'desert_temple_warden'); q = await settled();
        ok(!!r, `신전 수문장(4.2배) 더하기: 처음 보이기까지 ${r?.ms} ms → 자리 잡은 뒤 몹 그림 ${q.files.length}장 ${MB(q.bytes)} (${q.files.join(', ')})`);
        // hopping: field → not a field → back, three times; then Duat; the pictures held
        const held = [];
        for (let i = 0; i < 3; i++) {
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(1200);
            held.push(['02(필드 아님)', await page.evaluate(() => T.field.testArt())]);
            await page.evaluate(async () => T.win.travel('desert_forecourt_west', 'yard')); await sleep(2500);
            held.push(['T1W', await page.evaluate(() => T.field.testArt())]);
        }
        await page.evaluate(async () => { const s = T.state.getState(); s.duatField = null; await T.win.travel('duat_04', 'bottom'); }); await sleep(2500);
        held.push(['두아트 04', await page.evaluate(() => T.field.testArt())]);
        for (const [where, a] of held) log(`  ${where}: 몹 그림 ${a.files.length}장 ${MB(a.bytes)}`);
        ok(held.filter(([w]) => w.startsWith('02')).every(([, a]) => a.files.length === 0), '필드가 아닌 맵에 가면 사막 몹 그림을 모두 놓는다');
        ok(held.filter(([w]) => w === 'T1W').every(([, a]) => a.files.every(f => f.includes('leather-shield'))), 'T1W에 돌아오면 그 맵 몹(가죽 방패병) 그림만');
        ok(held.at(-1)[1].files.every(f => !f.includes('desert-')), '두아트에서는 사막 몹 그림이 남지 않음');
        // the files themselves
        const sizes = await page.evaluate(() => Object.entries(T.data.DATA.sprites.enemies).map(([k, d]) => [k, d.sheets || [d.file], d.small.sheets || [d.small.file]]));
        log('종별 장 수(큰 / 작은): ' + sizes.map(([k, a, b]) => `${k.replace('desert_', '')} ${a.length}/${b.length}`).join(', '));
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), lines.join('\n') + '\n');
        await context.close(); await browser.close();
    }
    process.exit(fail ? 1 : 0);
})();
