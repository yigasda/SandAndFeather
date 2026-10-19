// 궁 메모리·첫 발동 끊김·해상도 후보(사용자 10-19). 폰 412×900 dpr 2, CPU 4배 느리게(CDP), T1W에 캐릭터·동행·몹(T1
// 예정: 가죽 방패병 2 + 봉인 항아리 1)·궁을 함께 띄운다. 후보마다 새 페이지:
//   full(원본 해상도, 알파 0 여백만 자름) · half · third (tools/art/ult-fx-candidates.py가 시험 서버에 만든 것, 게임 데이터 아님)
// 앞장 세트(동행 호루스: 두 사람 궁 그림을 들어올 때 미리 불러옴) → 궁, 호루스로 바꿔 → 궁, 소망(미리 안 불러옴) → 궁.
// 궁마다: 누른 뒤 2초의 프레임 간격 최대·50 ms 넘은 수(끊김), 그 뒤 ① 픽셀 계산(그림 종류별) ② JS 힙·크롬 RSS를 적고,
// 같은 순간(누르고 0.35초)의 화면을 남긴다. ③ 실제 폰 GPU·이미지 캐시는 못 잼.
//   node tools/st-test/ult-memory.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/ult/memory');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
fs.mkdirSync(OUT, { recursive: true });
const res = []; let fail = 0;
const log = m => { console.log(m); res.push(m); };
const ok = (c, msg) => { log(`${c ? '통과' : '실패'} ${msg}`); if (!c) fail++; };
const MB = b => (b / 1048576).toFixed(1);

(async () => {
    const table = JSON.parse(fs.readFileSync('/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather/data/fx.json', 'utf8'));
    for (const tag of ['full', 'half', 'third']) {
        const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--enable-precise-memory-info'] } : { args: ['--no-sandbox', '--enable-precise-memory-info'] });
        const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
        const errors = []; page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
        const sleep = ms => page.waitForTimeout(ms);
        const rss = () => {
            try {
                const rows = execSync('ps -eo pid,ppid,rss,args --no-headers').toString().trim().split('\n').map(l => { const m = l.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/); return m && { pid: +m[1], ppid: +m[2], rss: +m[3], args: m[4] }; }).filter(Boolean);
                const root = Math.max(...rows.filter(r => /remote-debugging-pipe/.test(r.args)).map(r => r.pid));
                const kids = new Set([root]); let grew = true;
                while (grew) { grew = false; for (const r of rows) if (kids.has(r.ppid) && !kids.has(r.pid)) { kids.add(r.pid); grew = true; } }
                return rows.filter(r => kids.has(r.pid) && /--type=renderer/.test(r.args)).reduce((a, r) => a + r.rss * 1024, 0);
            } catch { return 0; }
        };
        try {
            await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
            const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
            if (await save.count()) { await save.first().click(); await sleep(1500); }
            await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
            await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
            await page.waitForSelector('#sf_open', { state: 'attached' });
            await page.evaluate(async ([base, fx]) => {
                window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', field: 'packs/duat/field', ledger: 'core/ledger', data: 'core/data' })) T[k] = await import(base + 'src/' + f + '.js');
                T.data.DATA.duat.field.ult.fx = fx;   // this candidate
                T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, 'horus'); await T.win.openGame(); window.toastr?.clear();
                T.pixels = () => {
                    const D = T.data.DATA, seen = new Set(), sum = {}, add = (im, cat) => { if (!im || seen.has(im)) return; seen.add(im); sum[cat] = (sum[cat] || 0) + (im.naturalWidth || im.width) * (im.naturalHeight || im.height) * 4; };
                    for (const [f, im] of Object.entries(D.spriteArt || {})) add(im, f.includes('fx/ult') ? '궁 이펙트' : f.includes('enemies') ? '몹' : '캐릭터');
                    for (const sc of Object.values(D.sceneArt || {})) { add(sc.image, '맵 배경'); add(sc.nightImage, '맵 배경'); }
                    for (const c of document.querySelectorAll('#sf_game canvas')) add(c, '화면 캔버스');
                    return sum;
                };
                // frame gaps while a 궁 plays
                T.gaps = ms => new Promise(done => { const g = []; let last = performance.now(); const t0 = last; const f = t => { g.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else done(g); }; requestAnimationFrame(f); });
            }, [BASE, table[tag]]);
            await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
            await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; });
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(4000);   // the two 궁 pictures are asked for on the way in
            await page.evaluate(() => { const p = T.player.player, n = { hp: 999, atk: 0, speed: 0, range: 0, guard: 0, nopush: true }; T.field.testOnly('desert_leather_shield', p.x + 3, p.y - 1, n); T.field.testAdd('desert_leather_shield', p.x + 3, p.y + 1, n); T.field.testAdd('desert_sealed_jar', p.x - 3, p.y, n); });
            await sleep(2500);
            log(`[${tag}]`);
            let worst = { px: 0 };
            for (const [lead, mate] of [['set', 'horus'], ['horus', 'set'], ['somang', 'set']]) {
                await page.evaluate(([lead, mate]) => { const s = T.state.getState(); T.heroes.setLead(s, lead); T.heroes.setWith(s, mate); T.field.testReset(); T.field.testUlt({ [lead]: 100, cd: 0 }); }, [lead, mate]);
                await sleep(800);
                const gapsP = page.evaluate(() => T.gaps(2000));
                await page.evaluate(() => T.field.ult());
                await sleep(350); await page.screenshot({ path: path.join(OUT, `${tag}-${lead}.png`) });
                const gaps = await gapsP, max = Math.max(...gaps), slow = gaps.filter(x => x > 50).length;
                await sleep(1500);
                const m = await page.evaluate(() => ({ px: T.pixels(), heap: performance.memory?.usedJSHeapSize || 0 })), r = rss(), px = Object.values(m.px).reduce((a, b) => a + b, 0);
                log(`  ${lead} 궁 (동행 ${mate}${lead === 'somang' ? ', 소망 그림은 미리 안 불러옴' : ''}): 프레임 간격 최대 ${max.toFixed(0)} ms, 50 ms 넘은 프레임 ${slow}/${gaps.length} | ① 픽셀 계산 ${MB(px)} MB (${Object.entries(m.px).map(([k, v]) => `${k} ${MB(v)}`).join(', ')}) | ② JS 힙 ${MB(m.heap)} MB, 렌더러 RSS ${MB(r)} MB`);
                if (px > worst.px) worst = { px, lead };
            }
            log(`  → 최대(픽셀 계산) ${MB(worst.px)} MB (${worst.lead} 궁 뒤)`);
            ok(!errors.length, `${tag} 페이지 오류 없음 ${errors.join('; ')}`);
        } finally { await context.close(); await browser.close(); }
    }
    fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
    process.exit(fail ? 1 : 0);
})();
