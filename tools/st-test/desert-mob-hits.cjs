// 사막 몹 12종 몸 범위 검수(사용자 10-19: 호루스 C안·세트 A안, 몹별 수치는 직접 정하고 묶어서 검수). T1W에서 종마다:
//   호루스 — 몸 범위 밖(앞 몸체 또는 몸통 앞) 안전한 곳에 착지하고 기술이 맞는다
//   세트·소망 — 몸통 기준: 기술이 닿는 최대 거리(발 가운데에서, 세트 2·소망 엄호 1.5)와 모양이 없을 때와의 차이
// 화면 표시(field.js testRanges): 초록 몸통, 파랑 앞 몸체(방패·주먹, 호루스 기술만 인정), 분홍 × 착지, 주황·노랑 기술 범위.
// 몹 능력치는 시험 값(가죽 방패병 데이터에 체력만 크게, 움직이지 않음, 밀려나지 않음). 영상·캡처·결과를 out에 남긴다.
//   node tools/st-test/desert-mob-hits.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/mobs/hits');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
const KINDS = ['desert_sealed_jar', 'desert_walking_stela', 'desert_sun_mirror', 'desert_balance_sentinel', 'desert_mask_priest_mantle', 'desert_mask_priest_shroud',
    'desert_leather_shield', 'desert_sealed_shield', 'desert_royal_mask_warden', 'desert_temple_warden', 'desert_throne_warden', 'desert_broken_tomb_warden'];
const FLOAT = new Set(['desert_sun_mirror', 'desert_balance_sentinel', 'desert_mask_priest_mantle', 'desert_mask_priest_shroud']);
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
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
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; await T.win.openGame(); window.toastr?.clear();
        }, BASE);
        const scene = async lead => {
            await page.evaluate(() => T.field.testReset());
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
            await page.evaluate(lead => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; T.heroes.setLead(s, lead); T.heroes.setWith(s, null); }, lead);
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(700);
            await page.evaluate(() => { T.field.testReset(); T.field.testRanges(true); });
        };
        const put = (kind, dx) => page.evaluate(([kind, dx, fl]) => {
            const base = T.data.DATA.desert.enemies.desert_leather_shield, p = T.player.player;
            T.field.testOnly(kind, p.x + dx, p.y, { ...base, hp: 999, guard: 0, speed: 0, range: 0, nopush: true, float: fl });
            T.field.testFace('right');
        }, [kind, dx, FLOAT.has(kind)]);
        for (const [i, kind] of KINDS.entries()) {
            // the shape in tiles on this map, and where Horus should land
            const sh = await page.evaluate(k => { const h = T.data.DATA.sprites.enemies[k].hit, t = 31.2 / 16 * (T.win.currentMap()?.d?.actorScale || 1.4); return { ...h, t }; }, kind);
            await scene('horus');
            const ahead = (sh.frontKind ? sh.front : sh.body) * sh.t;
            const D = ahead + 0.6 + 1.2;   // a little more than his room: he leaps 1.2 to come down short of it
            await put(kind, D); await sleep(250);
            const x0 = await page.evaluate(() => T.player.player.x); await page.evaluate(() => T.field.testEvents(true));
            await page.evaluate(() => { T.field.testFace('right'); T.field.skill(); }); await sleep(800);
            const h = await page.evaluate(x0 => ({ moved: T.player.player.x - x0, feet: T.player.player.x + 0.5, mob: T.field.testHurt()[0], blows: T.field.testEvents(true).filter(e => e.ev === 'blow').length }), x0);
            await page.screenshot({ path: path.join(OUT, `${String(i).padStart(2, '0')}-${kind}-horus.png`) });
            const edge = h.mob.cx - ahead, clear = edge - h.feet;   // from his feet to the front of its body / what it holds out
            ok(h.blows === 1 && clear >= 0.55, `${kind} 호루스: ${h.moved.toFixed(2)}칸 도약, 앞 몸체까지 ${clear.toFixed(2)}칸 띄우고 착지, ${h.blows ? '명중' : '빗나감'}${sh.frontKind ? ` (${sh.frontKind === 'shield' ? '방패' : '주먹'} 앞)` : ''}`);
            // Set (reach 2) and Somang (엄호, reach 1.5): torso only — how far from its feet's middle the 기술 still touches it
            for (const [who, R] of [['set', 2], ['somang', 1.5]]) {
                await scene(who); await put(kind, R); await sleep(200);
                const reach = await page.evaluate(([kind, R]) => {
                    const p = T.player.player, f = { x: p.x + 0.5, y: p.y + 0.8 }, base = T.data.DATA.desert.enemies.desert_leather_shield; let last = 0;
                    for (let d = 0.3; d <= 14; d += 0.02) { T.field.testOnly(kind, f.x + d - 0.5, p.y, { ...base, hp: 999, guard: 0, speed: 0, range: 0, nopush: true }); if (T.field.testTouch(f.x, f.y, R)[0]) last = d; }
                    return +last.toFixed(2);
                }, [kind, R]);
                await put(kind, Math.max(0.6, reach - 0.05)); await sleep(150);
                await page.evaluate(() => { T.field.testFace('right'); T.field.skill(); }); await sleep(500);
                const blows = await page.evaluate(() => T.field.testEvents(true).filter(e => e.ev === 'blow').length);
                await page.screenshot({ path: path.join(OUT, `${String(i).padStart(2, '0')}-${kind}-${who}.png`) });
                const torso = +((sh.frontKind === 'body' ? Math.max(sh.body, sh.front) : sh.body) * sh.t).toFixed(2);   // its torso's (or fists') near edge from its feet's middle
                ok(Math.abs(reach - (R + torso)) < 0.06 && blows === 1, `${kind} ${who === 'set' ? '세트' : '소망'}(몸통·주먹, 방패 제외): 닿는 거리 ${reach}칸 = ${R} + ${sh.frontKind === 'body' ? '주먹 끝' : '몸통 끝'}(${torso}칸), 그 끝에서 기술 ${blows ? '명중' : '빗나감'}`);
            }
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) fs.renameSync(await v.path(), path.join(OUT, 'hits.webm'));
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
