// 사막 B3 진단(합격/불합격 아님): 장면마다 따로 초기화하고 시작 조건을 먼저 검사한 뒤, 가드 시작·끝, 버튼 누름(무시된 이유),
// 맞은 시각, 맞기 직전 몹 상태, 실제 피해, 맞은 뒤 상태를 시간순으로 적는다(field.js testEvents).
//   S1 가드 규칙: 세트, 동행 없음, 서 있는 시험 몹(guard 1, speed 0, range 0) — 승인 두아트 검사(duat-mob-video.js)와 같은 조건
//   S2 같은 조건, 호루스
//   S3 호루스 기술의 도착 거리: 몹 1.1·2.5칸 앞에서 기술
//   S4 실제 전투: 호루스 + 세트, 데이터 그대로의 가죽 방패병(걷고 반격, 가드 40 %), 가드가 보이면 기술
//   node tools/st-test/desert-b3-diag.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west', KIND = 'desert_leather_shield';
(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
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
        T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; await T.win.openGame();
    }, BASE);
    // one scene: out of the field (ends the fight), a day on (a fresh creature), the party, back in, clean, then check
    const scene = async (lead, mate) => {
        await page.evaluate(() => T.field.testReset());   // test numbers off before a creature is made
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(1200);   // late blows/carried done by now
        await page.evaluate(([lead, mate]) => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; T.heroes.setLead(s, lead); T.heroes.setWith(s, mate); }, [lead, mate]);
        await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(1000);
        await page.evaluate(() => T.field.testReset());
        const c = await page.evaluate(() => { const f = T.field.fieldState(), r = f.run, m = f.mobs[0]; return { down: f.me.down, act: f.me.act, hp: r && Object.entries(r.hp).map(([k, v]) => `${k}${v}/${r.max[k]}`).join(' '), full: r && Object.keys(r.hp).every(k => r.hp[k] === r.max[k]), fear: r?.fear, mobs: f.mobs.length, mob: m && `${m.kind} ${m.st} 체력${m.hp}`, mate: T.state.getState().party?.with || null }; });
        const okStart = !c.down && c.full && c.fear === 0 && c.mate === mate;
        console.log(`  시작 조건 ${okStart ? 'OK' : 'NG'}: ${JSON.stringify(c)}`);
        return okStart;
    };
    const timeline = async (t0) => (await page.evaluate(() => T.field.testEvents(true))).map(e => {
        const t = (e.t - t0).toFixed(2);
        if (e.ev === 'blow') return `${t} 맞음[${e.by}] ${e.before}→${e.after} 피해 ${e.dmg}`;
        if (e.ev === 'guard') return `${t} 가드 시작(끝 ${(e.until - t0).toFixed(2)})`;
        if (e.ev === 'guardEnd') return `${t} 가드 끝`;
        if (e.ev === 'press') return `${t} 누름 ${e.what}${e.who ? `(${e.who})` : ''}`;
        if (e.ev === 'ignored') return `${t} 무시 ${e.what} (${e.why})`;
        return `${t} ${JSON.stringify(e)}`;
    }).join('\n    ');
    const put = (dx, n) => page.evaluate(([dx, n, k]) => { const p = T.player.player; T.field.testOnly(k, p.x + dx, p.y, n); T.field.testFace('right'); }, [dx, n, KIND]);
    const now = () => page.evaluate(() => T.field.testNow());
    // S1 / S2: the guard rule, a still creature that always guards
    const ONLY4 = process.argv.includes('--s4');
    for (const lead of ONLY4 ? [] : ['set', 'horus']) {
        console.log(`\nS${lead === 'set' ? 1 : 2} 가드 규칙 (${lead}, 동행 없음, 서 있는 시험 몹)`);
        await scene(lead, null);
        await put(1.1, { guard: 1, speed: 0, range: 0 }); await sleep(200);
        const t0 = await now(); await page.evaluate(() => T.field.testEvents(true));
        await page.evaluate(() => T.field.attack()); await sleep(600);             // full blow → it closes up
        await page.evaluate(() => T.field.attack()); await sleep(300);             // a blow on the guard
        await page.evaluate(() => T.field.skill()); await sleep(900);              // the 기술 as soon as she may
        console.log('    ' + await timeline(t0));
    }
    // S3: where Horus's 기술 lands
    console.log('\nS3 호루스 기술 도착 거리 (동행 없음, 서 있는 시험 몹, 가드 없음)');
    for (const dx of ONLY4 ? [] : [1.1, 2.5]) {
        await scene('horus', null);
        await put(dx, { guard: 0, speed: 0, range: 0 }); await sleep(200);
        const x0 = await page.evaluate(() => T.player.player.x), t0 = await now(); await page.evaluate(() => T.field.testEvents(true));
        await page.evaluate(() => T.field.skill()); await sleep(900);
        const x1 = await page.evaluate(() => T.player.player.x);
        console.log(`  몹 ${dx}칸 앞: 호루스 ${x0.toFixed(2)} → ${x1.toFixed(2)} (${(x1 - x0).toFixed(2)}칸 이동), 몹 ${(x0 + dx).toFixed(2)}\n    ` + (await timeline(t0) || '(맞은 것 없음)'));
    }
    // S4: the real fight
    for (let round = 1; round <= (ONLY4 ? 2 : 1); round++) {
    console.log(`\nS4 실제 전투 ${round} (호루스 + 세트, 데이터 그대로)`);
    await scene('horus', 'set');
    console.log('  데이터:', JSON.stringify(await page.evaluate(k => { const D = T.field.fieldState(); return D.mobs[0] && { st: D.mobs[0].st, hp: D.mobs[0].hp }; }, KIND)));
    const t0 = await now(); await page.evaluate(() => T.field.testEvents(true));
    const end = Date.now() + 45000;
    while (Date.now() < end) {
        const f = await page.evaluate(() => ({ f: T.field.fieldState(), p: [T.player.player.x, T.player.player.y] }));
        const o = f.f.mobs[0]; if (!o || o.st === 'dead' || f.f.me.down) break;
        const dx = o.x - f.p[0], dy = o.y - f.p[1];
        if (Math.abs(dx) > 1.5 || Math.abs(dy) > 0.6) { await page.evaluate(([x, y]) => { const p = T.player.player; p.x = x; p.y = y; }, [o.x - 1.2, o.y]); await sleep(120); continue; }   // stand by it (walking was shown in desert-b3)
        await page.evaluate(() => T.field.testFace('right'));
        if (o.st === 'guard') await page.evaluate(() => T.field.skill()); else await page.evaluate(() => T.field.attack());
        await sleep(250);
    }
    console.log('    ' + await timeline(t0));
    }
    console.log('\n페이지 오류', errors.length ? errors : '없음');
    await browser.close();
})();
