// 가죽 방패병 몸 반경 비교(결정용, 합격/불합격 아님): T1W에서 안마다 같은 장면을 찍는다. 화면 표시(field.js testRanges):
// 초록 = 기술이 들어가는 몸통, 파랑 = 방패 앞면(실선이면 기술 판정에 넣음), 분홍 × = 호루스 착지, 주황 원 = 호루스 기술 범위 1.2,
// 노랑 원 = 세트 기술 범위 2. 값은 캐릭터 키에 대한 비율(그림 실측: 몸통 반폭 35/256, 몸통 가운데가 발 가운데보다 뒤로
// 31/256, 방패 앞 끝이 앞으로 134/256). 세트의 닿는 거리는 발 가운데 기준으로 잰다. 비교를 위해 맞아도 밀려나지 않게 한다(nopush, 시험 값).
//   node tools/st-test/desert-shield-ranges.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/b3/shield-ranges');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west', KIND = 'desert_leather_shield';
fs.mkdirSync(OUT, { recursive: true });
const TORSO = { body: 35 / 256, bodyBack: 31 / 256 }, FRONT = 134 / 256;
const VARIANTS = [
    ['0 지금(몸 반경 0)', {}],
    ['A 몸통만 · 방패 앞에 착지', { ...TORSO, space: FRONT + 0.01, guardFront: FRONT }],
    ['B 몸통만 · 몸통에 닿도록 방패 위에 착지', { ...TORSO, space: 0.2, guardFront: FRONT }],
    ['C 몸통 + 방패 앞면(기술만) · 방패 앞에 착지', { ...TORSO, space: FRONT + 0.01, guardFront: FRONT, shieldHit: true }],
];
const lines = [];
(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const sleep = ms => page.waitForTimeout(ms);
    await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
    const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
    if (await save.count()) { await save.first().click(); await sleep(1500); }
    await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
    await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
    await page.waitForSelector('#sf_open', { state: 'attached' });
    await page.evaluate(async base => {
        window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', field: 'packs/duat/field', ledger: 'core/ledger' })) T[k] = await import(base + 'src/' + f + '.js');
        T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; await T.win.openGame(); window.toastr?.clear();
    }, BASE);
    const scene = async lead => {
        await page.evaluate(() => T.field.testReset());
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(800);
        await page.evaluate(lead => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; T.heroes.setLead(s, lead); T.heroes.setWith(s, null); }, lead);
        await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(900);
        await page.evaluate(() => { T.field.testReset(); T.field.testRanges(true); });
    };
    const put = (dx, n) => page.evaluate(([dx, n, k]) => { const p = T.player.player; T.field.testOnly(k, p.x + dx, p.y, { guard: 0, speed: 0, range: 0, nopush: true, ...n }); T.field.testFace('right'); }, [dx, n, KIND]);
    for (const [i, [name, v]] of VARIANTS.entries()) {
        // Horus: the enemy 3 tiles ahead, the 기술
        await scene('horus'); await put(3.0, v); await sleep(200);
        const x0 = await page.evaluate(() => T.player.player.x); await page.evaluate(() => T.field.testEvents(true));
        await page.evaluate(() => { T.field.testFace('right'); T.field.skill(); }); await sleep(700);
        const r = await page.evaluate(x0 => { const ev = T.field.testEvents(true).filter(e => e.ev === 'blow'); const h = T.field.testHurt()[0]; return { moved: T.player.player.x - x0, hit: ev.length, feet: T.player.player.x + 0.5, h }; }, x0);
        await page.screenshot({ path: path.join(OUT, `${i}-horus.png`) });
        const shieldEdge = r.h.cx - FRONT * r.h.tiles, overlap = Math.max(0, Math.min(r.feet + 0.45, r.h.cx) - Math.max(r.feet - 0.45, shieldEdge));   // his picture ≈ ±0.45 tiles, the shield from its edge to its feet's middle
        // Set: how far from its feet's middle the 기술 (reach 2) still touches it, straight in front
        await scene('set'); await put(2.4, v); await sleep(150);
        const reach = await page.evaluate(([k, n]) => {
            const p = T.player.player, f = { x: p.x + 0.5, y: p.y + 0.8 }; let last = 0;
            for (let d = 1.0; d <= 4.0; d += 0.02) { T.field.testOnly(k, f.x + d - 0.5, p.y, { guard: 0, speed: 0, range: 0, ...n }); if (T.field.testTouch(f.x, f.y, 2)[0]) last = d; }
            T.field.testOnly(k, f.x + 2.4 - 0.5, p.y, { guard: 0, speed: 0, range: 0, ...n });
            return +last.toFixed(2);
        }, [KIND, v]);
        await page.evaluate(() => { T.field.testFace('right'); T.field.skill(); }); await sleep(500);
        const setHit = await page.evaluate(() => T.field.testEvents(true).filter(e => e.ev === 'blow').length);
        await page.screenshot({ path: path.join(OUT, `${i}-set.png`) });
        const line = `${name}: 호루스 ${r.moved.toFixed(2)}칸 도약, ${r.hit ? '명중' : '빗나감'}, 방패 앞 끝과의 간격 ${(shieldEdge - r.feet).toFixed(2)}칸, 호루스 그림과 방패 그림 겹침 약 ${overlap.toFixed(2)}칸 · 세트 기술이 닿는 최대 거리(발 가운데) ${reach}칸, 2.4칸에서 ${setHit ? '명중' : '빗나감'}`;
        console.log(line); lines.push(line);
    }
    console.log('페이지 오류', errors.length ? errors : '없음');
    fs.writeFileSync(path.join(OUT, 'result.txt'), lines.join('\n') + '\n');
    await browser.close();
})();
