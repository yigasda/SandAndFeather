// 사막 B3: T1W 서쪽 제례 앞뜰의 가죽 방패병 한 마리와 실제로 싸운다. 화면 터치만(조이스틱 = CDP 터치, 공격·기술 버튼 터치).
//   - 맵에 들어오면 정해 둔 자리(t1w.shield.1)에 한 마리, 가까이 가면 다가와 준비 → 돌진(공격) → 후딜, 맞으면 피격,
//     방패(가드) 중 일반 공격은 30 %, 기술은 가드를 깸
//   - 쓰러뜨리면 그날 기록(killed)과 최초 처치(first), 같은 날 다시 들어오면 없음, 게임 하루 뒤 다시 들어오면 다시 있음(최초 처치는 그대로)
//   - 쓰러지면 들어온 곳(착지)으로, 체력은 다시 가득, 쓰러뜨린 기록은 그대로. 페이지 오류 없음. 영상·캡처
//   node tools/st-test/desert-b3.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/b3');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west', SID = 't1w.shield.1';
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
    const touch = (type, x, y, id = 1) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id }] });
    const tapEl = async sel => { const b = await page.locator(sel).first().boundingBox(); if (!b) return false; await touch('touchStart', b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(50); await touch('touchEnd'); return true; };
    const fs_ = () => page.evaluate(() => T.field.fieldState());
    const shot = n => page.screenshot({ path: path.join(OUT, n) });
    const pad = async () => page.evaluate(() => { const r = document.querySelector('.sf_pad').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, lim: r.width / 2 * 0.62 }; });
    const enter = async at => { await page.evaluate(async ([m, at]) => T.win.travel(m, at), [MAP, at]); await page.waitForTimeout(1500); };
    const today = () => page.evaluate(async base => (await import(base + 'src/core/ledger.js')).today(T.state.getState()), BASE);
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
            for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', field: 'packs/duat/field' })) T[k] = await import(base + 'src/' + f + '.js');
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'horus'); T.heroes.setWith(s, 'set');
            await T.win.openGame(); window.toastr?.clear();
        }, BASE);
        await page.waitForTimeout(800);

        // 1. in: one creature where the data puts it
        await page.evaluate(async ([m, at]) => T.win.travel(m, at), [MAP, 'yard']);
        await page.waitForTimeout(150);
        let st = await fs_();
        ok(st.map === MAP && st.mobs.length === 1 && st.mobs[0].kind === 'desert_leather_shield' && Math.hypot(st.mobs[0].x - 38.25, st.mobs[0].y - 14.1) < 1, `T1W 착지, 가죽 방패병 1 (정해 둔 자리 38.25, 14.1 근처: ${st.mobs[0]?.x}, ${st.mobs[0]?.y}, ${st.mobs[0]?.st})`);
        await page.waitForTimeout(1300);
        await shot('1-in.png');

        // 2. the fight: walk at it with the stick; when close, face it and tap 공격; 기술 when it guards
        const seen = new Set(), P = await pad();
        let hurt = 0, guardHit = null, broke = false, t0 = Date.now(), held = false, lastHp = null, strikes = 0;
        // every state it goes through, looked at in the page every 25 ms (the dash is 0.36 s, a flinch 0.3 s: the loop
        // below looks only every half second or so and missed them)
        await page.evaluate(() => { T.seen = new Set(); T.seenTimer = setInterval(() => { const o = T.field.fieldState().mobs[0]; if (o) T.seen.add(o.st); }, 25); });
        const hp0 = (await fs_()).run.hp.horus;
        while (Date.now() - t0 < 60000) {
            st = await fs_();
            const o = st.mobs[0];
            if (!o) break;
            seen.add(o.st);
            if (o.st === 'dead') { await page.waitForTimeout(1200); break; }
            const me = await page.evaluate(() => ({ x: T.player.player.x, y: T.player.player.y }));
            const dx = o.x - me.x, dy = o.y - me.y, d = Math.hypot(dx, dy);
            if (st.run.hp.horus < (lastHp ?? hp0)) hurt++;
            lastHp = st.run.hp.horus;
            if (st.me.down) break;
            if (d > 1.5 || Math.abs(dy) > 0.6) {   // walk to it (level with it, a step to its left)
                const tx = o.x - 1.2 - me.x, ty = o.y - me.y, n = Math.hypot(tx, ty) || 1;
                if (!held) { await touch('touchStart', P.x, P.y); held = true; }
                await touch('touchMove', P.x + tx / n * P.lim, P.y + ty / n * P.lim);
                await page.waitForTimeout(80);
                continue;
            }
            if (held) { await touch('touchMove', P.x + Math.sign(dx) * P.lim * 0.5, P.y); await page.waitForTimeout(60); await touch('touchEnd'); held = false; }
            if (o.st === 'guard' && !broke && !(await page.locator('.sf_duat_skill').isDisabled())) {
                const before = o.hp;
                await tapEl('.sf_duat_skill'); await page.waitForTimeout(450);
                const after = (await fs_()).mobs[0];
                if (after && after.st === 'hit' && before - after.hp >= 4) { broke = true; await shot('4-guard-broken.png'); }
                continue;
            }
            const before = o.hp, wasGuard = o.st === 'guard';
            await tapEl('.sf_talk'); strikes++;
            await page.waitForTimeout(300);
            const after = (await fs_()).mobs[0];
            if (wasGuard && after && after.hp < before && guardHit === null) { guardHit = before - after.hp; await shot('3-guard.png'); }
            if (strikes === 2) await shot('2-fight.png');
            await page.waitForTimeout(350);
        }
        if (held) await touch('touchEnd');
        for (const x of await page.evaluate(() => { clearInterval(T.seenTimer); return [...T.seen]; })) seen.add(x);
        st = await fs_();
        const f = st.fight, day = await today();
        ok(['chase', 'prepare', 'attack', 'recover'].every(x => seen.has(x)), `다가옴·준비·돌진·후딜을 다 보임 (${[...seen].join(', ')})`);
        ok(seen.has('hit'), '맞으면 피격');
        ok(hurt > 0, `돌진에 맞아 체력이 줆(${hurt}번)`);
        console.log(`  (걸어서 싸운 동안 가드 ${seen.has('guard') ? '나옴' : '안 나옴'}: 가드는 아래에서 따로 확인)`);
        ok(f.killed[SID] === day && f.first[SID] === day && st.mobs.length === 0, `쓰러뜨림: 그날 기록 ${f.killed[SID]}, 최초 처치 ${f.first[SID]} (오늘 ${day})`);
        await shot('5-won.png');

        // 3. same day again: none; a game day later: back, the first defeat kept
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west'));
        await page.waitForTimeout(800);
        await enter('yard');
        ok((await fs_()).mobs.length === 0, '같은 날 다시 들어오면 없음');
        await page.evaluate(async base => { const L = await import(base + 'src/core/ledger.js'); const s = T.state.getState(); s.ledger.gday = L.today(s) + 1; }, BASE);
        await page.waitForTimeout(400);
        st = await fs_();
        ok(st.mobs.length === 0, '맵 안에서 날이 바뀌어도 눈앞에서 살아나지 않음');
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west'));
        await page.waitForTimeout(800);
        await enter('yard');
        st = await fs_();
        ok(st.mobs.length === 1 && st.fight.first[SID] === day && st.mobs[0].hp === 34, `하루 뒤 다시 들어오면 다시 있음(체력 가득), 최초 처치 ${st.fight.first[SID]} 그대로`);

        // the guard, made sure (tests only: guard every time it can): the first blow lands in full, then it closes up;
        // a blow on the guard does 30 %, a 기술 breaks it (full damage, stunned)
        // (alone, so only her blows count, and it does not strike back, so it is struck while it comes at her)
        await page.evaluate(() => { const s = T.state.getState(); T.heroes.setLead(s, 'set'); T.heroes.setWith(s, null); });
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west'));   // leaving ends the fight: a fresh one (체력 full, 공포 0) next
        await page.waitForTimeout(600);
        await page.evaluate(async base => { const L = await import(base + 'src/core/ledger.js'); const s = T.state.getState(); s.ledger.gday = L.today(s) + 1; }, BASE);
        await enter('yard');
        // Set leads here: his 기술 lands at once (Horus's leaps ahead first). Tests only: one shield soldier put right in
        // front of her that does not walk and guards whenever it can (guard 1, speed 0), so only the guard rule is measured
        const stand = () => page.evaluate(() => { const p = T.player.player; T.field.testOnly('desert_leather_shield', p.x + 1.1, p.y, { guard: 1, speed: 0, range: 0 }); T.field.testFace('right'); });
        await stand(); await page.waitForTimeout(200);
        const g0 = (await fs_()).mobs[0].hp;
        // the blow lands 0.2 s after the touch and the guard stays 1.2 s; the next blow may come 0.55 s after the last
        await tapEl('.sf_talk'); await page.waitForTimeout(580);
        const g = (await fs_()).mobs[0], full = g0 - g.hp;
        await tapEl('.sf_talk'); await page.waitForTimeout(260);
        const g1 = (await fs_()).mobs[0];
        ok(g.st === 'guard' && full >= 3, `첫 타는 다 들어가고(${full}) 방패를 올림(${g.st})`);
        ok(g.hp - g1.hp === Math.max(1, Math.round(full * 0.3)), `방패 중 일반 공격은 30 %: ${g.hp - g1.hp} (첫 타 ${full})`);
        await shot('3-guard.png');
        // a new one the same way: a full blow, it closes up, and the 기술 (as soon as her blow is over) breaks it
        await page.waitForTimeout(900);
        // (the first one's counter may still be landing on her: she cannot strike while she flinches, 0.45 s)
        await stand(); await page.waitForTimeout(700);
        await tapEl('.sf_talk'); await page.waitForTimeout(600);
        const g2 = (await fs_()).mobs[0];
        await tapEl('.sf_duat_skill'); await page.waitForTimeout(150);
        const g3 = (await fs_()).mobs[0];
        ok(g2.st === 'guard' && g3.st === 'hit' && g2.hp - g3.hp >= 2 * full - 1, `기술은 방패를 깸: 피해 ${g2.hp - g3.hp}(일반 ${full}의 두 배), 경직(${g3.st})`);
        await shot('4-guard-broken.png');
        await page.evaluate(() => { const s = T.state.getState(); T.heroes.setLead(s, 'horus'); T.heroes.setWith(s, 'set'); });
        // a fresh one (a day on) for the next part, with its own numbers again (the guard test's stand-still numbers
        // stayed on the kind and the next one never struck)
        await page.evaluate(() => T.field.testTune('desert_leather_shield', {}));
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west'));
        await page.waitForTimeout(600);
        await page.evaluate(async base => { const L = await import(base + 'src/core/ledger.js'); const s = T.state.getState(); s.ledger.gday = L.today(s) + 1; }, BASE);
        await enter('yard');

        // 4. going down: back at the way in, 체력 full again, who fell stays
        await page.evaluate(() => { const r = T.field.fieldState().fight.run; r.hp.horus = 1; });
        const P2 = await pad(); let t1 = Date.now(), down = false; held = false;
        while (Date.now() - t1 < 40000) {
            st = await fs_();
            if (st.me.down) { down = true; break; }
            const o = st.mobs[0]; if (!o) break;
            const me = await page.evaluate(() => ({ x: T.player.player.x, y: T.player.player.y }));
            const tx = o.x - me.x, ty = o.y - me.y, n = Math.hypot(tx, ty) || 1;
            if (n > 1.2) { if (!held) { await touch('touchStart', P2.x, P2.y); held = true; } await touch('touchMove', P2.x + tx / n * P2.lim, P2.y + ty / n * P2.lim); }
            else if (held) { await touch('touchEnd'); held = false; }
            await page.waitForTimeout(100);
        }
        if (held) await touch('touchEnd');
        await page.waitForTimeout(500);
        await shot('6-down.png');
        await page.waitForTimeout(2000);
        st = await fs_();
        const at = await page.evaluate(() => [T.player.player.x, T.player.player.y]);
        const yard = await page.evaluate(async base => { const D = await import(base + 'src/core/data.js'); return D.DATA.maps.desert_forecourt_west.entries.yard; }, BASE);
        ok(down && Math.hypot(at[0] - yard.x, at[1] - yard.y) < 0.05 && st.fight.run === null && st.fight.first[SID] === day,
            `쓰러지면 들어온 곳(착지)으로, 그 싸움(체력 1)은 끝(다음 싸움은 체력 가득으로 새로), 최초 처치 그대로`);
        ok(await page.locator('.sf_pop_wrap').count() === 1, '물러났다는 카드');
        await shot('7-back.png');
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) fs.renameSync(await v.path(), path.join(OUT, 'b3-fight.webm'));
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
