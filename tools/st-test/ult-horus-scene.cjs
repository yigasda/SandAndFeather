// 호루스 궁 게이지 장면만(사용자 10-20: desert-ult 영상 장면에서 한 번 60초 안에 안 참 — 전체 검사 반복 대신 이 장면만).
// desert-ult.cjs의 영상 장면과 같은 조건: T1W, 앞장 호루스·동행 소망, 가죽 방패병 3(승인 수치), 앞장 체력 99, 화면 터치만
// (조이스틱으로 다가가 스킬, 쿨이면 공격; 다 쓰러지면 셋 다시). 스킬 한 번마다 무엇이 됐는지 남긴다:
//   누름 → 무시(이유) / 착지 때 실제로 다치게 한 수(got)·그때 살아 있던 몹 수 → 충전량(호루스, 소망 몫)
// 60초 안에 안 차면 원인을 가른다: 충전 오류(맞혔는데 충전 없음) · 기회 없음(몹이 다 쓰러져 있음) · 빗나감(몹은 있는데
// 못 맞힘) · 못 누름(바쁨·쿨·쓰러짐) · 앞장 쓰러짐.
//   node tools/st-test/ult-horus-scene.cjs [out] [반복 수(기본 5, 상한 8)]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || '/tmp/ult-horus-scene');
const RUNS = Math.min(8, +(process.argv[3] || 5));
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };
const log = m => { console.log(m); res.push(m); };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
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
        await page.evaluate(async base => { window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', ledger: 'core/ledger', field: 'packs/duat/field' })) T[k] = await import(base + 'src/' + f + '.js'); }, BASE);
        await page.evaluate(async () => { T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; await T.win.openGame(); window.toastr?.clear(); });
        for (let run = 1; run <= RUNS; run++) {
            // the scene, fresh each time: in from 02's west, the next day (the creatures anew), Horus in front with Somang
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(500);
            await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; T.heroes.setLead(s, 'horus'); T.heroes.setWith(s, 'somang'); });
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(900);
            await page.evaluate(() => { T.field.testReset(); T.field.testUlt({ set: 0, horus: 0, somang: 0 }); const r = T.field.fieldState().run; r.hp.horus = 99; r.max.horus = 99; });
            await page.evaluate(() => { const p = T.player.player; for (const [i, [dx, dy]] of [[3, -2], [5, 0], [3, 2]].entries()) (i ? T.field.testAdd : T.field.testOnly)('desert_leather_shield', p.x + dx, p.y + dy, {}); T.field.testEvents(true); });
            const t0 = Date.now(), pad = await W.padBox();
            let ready = null, taps = 0, refills = 0, emptyMs = 0, downMs = 0, last = Date.now();
            const evs = [];
            while (Date.now() - t0 < 60000) {
                const st = await page.evaluate(() => ({ f: T.field.fieldState(), u: T.field.testUlt(), me: { x: T.player.player.x, y: T.player.player.y }, ev: T.field.testEvents(true) }));
                const nowT = Date.now(), dt = nowT - last; last = nowT;
                for (const e of st.ev) evs.push({ ...e, at: (nowT - t0) / 1000 });
                if (st.f.me.down) downMs += dt;
                if (st.u.ready) { ready = (nowT - t0) / 1000; break; }
                const alive = st.f.mobs.filter(o => o.st !== 'dead');
                if (!alive.length) { emptyMs += dt; refills++; await page.evaluate(() => { const p = T.player.player; for (const [i, [dx, dy]] of [[3, -2], [5, 0], [3, 2]].entries()) (i ? T.field.testAdd : T.field.testOnly)('desert_leather_shield', p.x + dx, p.y + dy, {}); }); continue; }
                const o = alive.sort((a, b) => Math.hypot(a.x - st.me.x, a.y - st.me.y) - Math.hypot(b.x - st.me.x, b.y - st.me.y))[0];
                const dx = o.x - st.me.x, dy = o.y - st.me.y, d = Math.hypot(dx, dy);
                if (d > 1.3) { await W.touch('touchStart', pad.x, pad.y); await W.touch('touchMove', pad.x + dx / d * pad.lim, pad.y + dy / d * pad.lim); await sleep(160); await W.touch('touchEnd'); continue; }
                const skOn = await page.evaluate(() => !document.querySelector('.sf_duat_skill').disabled);
                if (skOn) { await W.tapEl('.sf_duat_skill'); taps++; } else await W.tapEl('.sf_talk');
                await sleep(120);
            }
            await sleep(900);   // a leap pressed last lands
            const end = await page.evaluate(() => ({ u: T.field.testUlt(), ev: T.field.testEvents(true), run: T.field.fieldState().run, me: T.field.fieldState().me }));
            for (const e of end.ev) evs.push({ ...e, at: 60 });
            // each 스킬 of his: what it hurt and what it charged (the charge note comes right after the hit note)
            const mine = evs.filter(e => e.who === 'horus' || (e.ev === 'press' && e.what === 'skill') || (e.ev === 'ignored' && e.what === 'skill'));
            const hits = [], ignored = {};
            for (let i = 0; i < evs.length; i++) {
                const e = evs[i];
                if (e.ev === 'ignored' && e.what === 'skill') ignored[e.why] = (ignored[e.why] || 0) + 1;
                if (e.ev === 'skillHit' && e.who === 'horus') {
                    const c = evs.slice(i + 1, i + 3).find(q => q.ev === 'charge' && q.who === 'horus');
                    hits.push({ got: e.got, alive: e.alive, same: e.same, charged: c ? c.amt : 0 });
                }
            }
            const presses = evs.filter(e => e.ev === 'press' && e.what === 'skill').length;
            const chargeHorus = evs.filter(e => e.ev === 'charge' && e.who === 'horus').reduce((a, e) => a + e.amt, 0);
            const shareFromSomang = evs.filter(e => e.ev === 'charge' && e.who === 'somang').length;
            const kills = evs.filter(e => e.ev === 'blow' && e.after === 'dead').length;
            const wrong = hits.filter(h => h.got > 0 && h.same && !h.charged).length;   // hurt something, no charge: a real fault
            const miss = hits.filter(h => h.got === 0 && h.alive > 0).length, none = hits.filter(h => h.alive === 0).length;
            const why = ready ? '' : end.u.g.horus >= 100 ? `게이지는 참, 궁 쿨 ${end.u.cd}초 남음` : wrong ? '충전 오류' : emptyMs > 20000 || none > hits.length / 2 ? '기회 없음(몹이 다 쓰러져 있음)' : downMs > 10000 ? '앞장 쓰러짐' : Object.keys(ignored).length && presses < 3 ? '못 누름' : miss >= hits.length / 2 ? '빗나감' : '가르지 못함';
            log(`  ${run}회: ${ready ? `준비 ${ready.toFixed(1)}초` : `60초 안에 안 참 → ${why}`} · 스킬 탭 ${taps} · 눌림 ${presses} · 무시 ${JSON.stringify(ignored)} · 착지 ${hits.length}번(맞힘 ${hits.filter(h => h.got > 0).length}, 빗나감 ${miss}, 몹 없음 ${none}, 맞혔는데 충전 없음 ${wrong}) · 호루스 스킬 충전 합 ${chargeHorus} · 소망 스킬(몫 들어옴) ${shareFromSomang}번 · 처치 ${kills} · 다시 세움 ${refills} · 몹 없던 시간 ${(emptyMs / 1000).toFixed(1)}초 · 쓰러진 시간 ${(downMs / 1000).toFixed(1)}초 · 끝 게이지 ${JSON.stringify(end.u.g)} 궁 쿨 ${end.u.cd}초 · 체력 ${end.run?.hp?.horus}`);
            ok(ready || why !== '충전 오류', `${run}회: 맞힌 스킬은 모두 충전됨(맞혔는데 충전 없음 ${wrong}번)`);
            fs.writeFileSync(path.join(OUT, `run${run}-events.json`), JSON.stringify(mine, null, 1));
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        await context.close(); await browser.close();
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
