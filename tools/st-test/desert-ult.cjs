// 스킬·궁 시제품(사용자 10-19). 규칙 검사(게임 함수로, 정확한 숫자) + 실제 전투 영상(화면 터치).
//   게이지: 스킬이 실제로 다치게 한 수만큼(빗나감 0, 한 번에 상한), 처치 보너스는 개체마다 한 번(일반 공격 처치 포함),
//   짝은 일부(한 번만), 궁 타격은 충전 없음(궁 처치 보너스는 지급), 발동 순간 소모 → 다시 충전, 맵 이동·교대로
//   그대로, 저장·다시 불러오기·채팅 전환에서 중복 없음. 소망 연꽃 방패는 흡수(무적 아님).
//   영상: 앞장 세트·호루스·소망 각각(동행 함께), T1W에서 가죽 방패병 3(승인 수치), 조이스틱·스킬·공격·궁 버튼 터치만.
//   스킬 몇 번·몇 초 만에 궁이 준비되는지 적는다. (영상용으로만 앞장 체력을 99로: 자동 조작은 잘 못 피함)
//   node tools/st-test/desert-ult.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/ult');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
const WHO = { set: '세트', horus: '호루스', somang: '소망' }, MATE = { set: 'horus', horus: 'somang', somang: 'set' };
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };
const log = m => { console.log(m); res.push(m); };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
    const errors = []; page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
    const sleep = ms => page.waitForTimeout(ms);
    const W = require('./touch-walk.cjs')(page, cdp);
    const boot = async () => {
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await sleep(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async base => { window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', ledger: 'core/ledger', field: 'packs/duat/field', data: 'core/data' })) T[k] = await import(base + 'src/' + f + '.js'); }, BASE);
    };
    const into = async (lead, mate = MATE[lead]) => {
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(500);
        await page.evaluate(([lead, mate]) => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; T.heroes.setLead(s, lead); T.heroes.setWith(s, mate); }, [lead, mate]);
        await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(900);
        await page.evaluate(() => T.field.testReset());
    };
    const U = () => page.evaluate(() => T.field.testUlt());
    const G = async who => (await U()).g[who];
    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await boot();
        await page.evaluate(async () => { T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; await T.win.openGame(); window.toastr?.clear(); });
        const num = await page.evaluate(() => T.data.DATA.duat.field.ult);
        const shield = { hp: 999, speed: 0, range: 0, guard: 0, nopush: true, aggro: 4 };
        // ---- the rules, exactly (game functions)
        await into('set');
        await page.evaluate(() => T.field.testUlt({ set: 0, horus: 0, somang: 0 }));
        // a 스킬 at the air: nothing
        await page.evaluate(() => { const p = T.player.player; T.field.testOnly('desert_leather_shield', p.x + 8, p.y, { hp: 999, speed: 0, range: 0, guard: 0, nopush: true }); T.field.skill(); });
        await sleep(300);
        ok((await G('set')) === 0 && (await G('horus')) === 0, `빗나간 스킬: 충전 없음 (세트 ${await G('set')}, 동행 ${await G('horus')})`);
        // one creature: skillFirst to him, a share to the one with him
        await page.evaluate(sh => { const p = T.player.player; T.field.testReset(); T.field.testOnly('desert_leather_shield', p.x + 1, p.y, sh); T.field.skill(); }, shield);
        await sleep(300);
        const one = await U();
        ok(one.g.set === num.skillFirst && one.g.horus === Math.round(num.skillFirst * num.share), `스킬이 한 마리: 세트 ${one.g.set}(=${num.skillFirst}), 호루스 ${one.g.horus}(=${num.skillFirst}×${num.share}) — 한 번만`);
        // four at once: capped
        await page.evaluate(sh => { const p = T.player.player; T.field.testReset(); T.field.testUlt({ set: 0, horus: 0 }); T.field.testOnly('desert_leather_shield', p.x + 1, p.y, sh); for (const [dx, dy] of [[-1, 0], [0, 1], [0.6, -0.6]]) T.field.testAdd('desert_leather_shield', p.x + dx, p.y + dy, sh); T.field.skill(); }, shield);
        await sleep(300);
        const four = await U();
        ok(four.g.set === num.skillCap, `스킬이 네 마리: ${four.g.set} = 상한 ${num.skillCap} (${num.skillFirst} + ${num.skillEach}×3 = ${num.skillFirst + num.skillEach * 3}에서 잘림)`);
        // ordinary blows: nothing; felling with one: the kill bonus, once
        await page.evaluate(() => { const p = T.player.player; T.field.testReset(); T.field.testUlt({ set: 0, horus: 0 }); T.field.testOnly('desert_leather_shield', p.x + 1, p.y, { hp: 9, speed: 0, range: 0, guard: 0, nopush: true }); T.field.testHold(true); T.field.testFace('right'); });
        await page.evaluate(() => T.field.attack()); await sleep(700);
        const g1 = await G('set');
        for (let k = 0; k < 4; k++) { await page.evaluate(() => { T.field.testReset(); T.field.attack(); }); await sleep(700); }
        const dead = await page.evaluate(() => T.field.fieldState().mobs.every(o => o.st === 'dead'));
        const g2 = await G('set');
        await page.evaluate(() => { T.field.testReset(); T.field.attack(); }); await sleep(700);   // at the fallen one: no more
        ok(g1 === 0 && dead && g2 === num.kill && (await G('set')) === num.kill, `일반 공격: 충전 없음(${g1}), 일반 공격으로 쓰러뜨림 → 처치 보너스 ${g2}(=${num.kill}) 한 번`);
        await page.evaluate(() => T.field.testHold(false));
        // the 궁: only full; spent the moment it goes; its blows fill nothing, its kill does
        await page.evaluate(() => { const p = T.player.player; T.field.testReset(); T.field.testUlt({ set: 60, horus: 0, cd: 0 }); T.field.testOnly('desert_leather_shield', p.x + 1, p.y, { hp: 999, speed: 0, range: 0, guard: 0, nopush: true }); T.field.ult(); });
        await sleep(200);
        ok((await G('set')) === 60 && (await U()).storms === 0, '게이지가 덜 찼을 때 궁: 안 나감, 게이지 그대로');
        // (alone here: the one with him would use his own 스킬 meanwhile and fill both, rightly)
        await page.evaluate(() => { const s = T.state.getState(); T.heroes.setWith(s, null); T.field.testReset(); T.field.testUlt({ set: 100, horus: 0, cd: 0 }); T.field.ult(); });
        const fired = await U();
        await sleep(3400);
        const after = await U();
        ok(fired.g.set === 0 && fired.storms === 1 && after.g.set === 0 && after.g.horus === 0, `세트 궁: 발동 순간 0으로, 모래폭풍 3초 동안 친 것으로는 충전 없음 (세트 ${after.g.set}, 호루스 ${after.g.horus})`);
        const ticks = await page.evaluate(() => T.field.testEvents(true).filter(e => e.ev === 'blow' && e.by === 'ult').length);
        ok(ticks >= 6 && ticks <= 7, `모래폭풍: 0.5초마다 친 횟수 ${ticks} (3초 → 6~7번, 프레임 수와 무관)`);
        // charging again while it goes on (no "nothing while it lasts")
        await page.evaluate(() => { const s = T.state.getState(); T.heroes.setWith(s, 'horus'); const p = T.player.player; T.field.testReset(); T.field.testUlt({ set: 100, horus: 0, cd: 0 }); T.field.ult(); T.field.testReset(); T.field.skill(); });
        await sleep(400);
        ok((await G('set')) === num.skillFirst, `궁이 이어지는 중에 스킬: 다시 충전됨 (${await G('set')})`);
        await sleep(3000);
        // the 궁 felling: the kill bonus
        await page.evaluate(() => { const p = T.player.player; T.field.testReset(); T.field.testUlt({ set: 100, horus: 0, cd: 0 }); T.field.testOnly('desert_leather_shield', p.x + 1, p.y, { hp: 3, speed: 0, range: 0, guard: 0, nopush: true }); T.field.ult(); });
        await sleep(1200);
        ok((await G('set')) === num.kill && (await G('horus')) === Math.round(num.kill * num.share), `궁으로 쓰러뜨림: 처치 보너스 세트 ${await G('set')}, 호루스 ${await G('horus')}`);
        await sleep(2400);
        // Horus's 궁: each one once
        await into('horus');
        await page.evaluate(() => { const p = T.player.player; T.field.testReset(); T.field.testUlt({ horus: 100, cd: 0 }); T.field.testOnly('desert_leather_shield', p.x + 1.5, p.y, { hp: 999, speed: 0, range: 0, guard: 0, nopush: true }); T.field.testAdd('desert_leather_shield', p.x - 1.5, p.y, { hp: 999, speed: 0, range: 0, guard: 0, nopush: true }); T.field.testEvents(true); T.field.ult(); });
        await sleep(1500);
        const hb = await page.evaluate(() => T.field.testEvents(true).filter(e => e.ev === 'blow' && e.by === 'ult').map(e => e.mob));
        ok(hb.length === 2 && new Set(hb).size === 2, `호루스 궁(충격파): 두 마리에 한 번씩 (${hb.join(', ')})`);
        // Somang's 궁: a ward that takes harm (not no harm): 8 each, then harm goes through
        await into('somang');
        await page.evaluate(() => { T.field.testReset(); T.field.testUlt({ somang: 100, cd: 0 }); const p = T.player.player; T.field.testOnly('desert_leather_shield', p.x + 2, p.y, { hp: 999, speed: 0, range: 0, guard: 0, nopush: true }); T.field.ult(); });
        const w0 = await U();
        const hp0 = await page.evaluate(() => T.field.fieldState().run.hp.somang);
        ok(w0.wards.somang?.left === num.somang.ward && w0.wards.set?.left === num.somang.ward, `소망 궁(연꽃 방패): 소망·세트 각자 흡수 ${num.somang.ward}`);
        // a blow of 5 (±1): the ward takes it all; the next takes what is left and the rest goes through
        await page.evaluate(() => T.field.testHit('somang', 5)); await sleep(700);
        const w1 = await U(), hp1 = await page.evaluate(() => T.field.fieldState().run.hp.somang);
        await page.evaluate(() => T.field.testHit('somang', 5)); await sleep(700);
        const w2 = await U(), hp2 = await page.evaluate(() => T.field.fieldState().run.hp.somang);
        ok(hp1 === hp0 && w1.wards.somang.left < num.somang.ward && hp2 < hp0 && !w2.wards.somang, `연꽃 방패는 흡수: 첫 타 다 막음(체력 ${hp0} → ${hp1}, 남은 흡수 ${w1.wards.somang?.left}), 다음 타 남은 만큼 막고 나머지 들어옴(체력 → ${hp2}), 방패 끝`);
        // the old 2 s no-harm is gone (not on top of the ward), and the companion's ward is its own
        ok(!w0.shield && !w1.shield && w1.wards.set?.left === num.somang.ward, `옛 2초 무적 없음(궁 직후 ${w0.shield ? '켜짐' : '꺼짐'}), 소망이 맞아도 세트 방패 그대로 ${w1.wards.set?.left}`);
        const hs0 = await page.evaluate(() => T.field.fieldState().run.hp.set);
        await page.evaluate(() => T.field.testHit('set', 5)); await sleep(700);
        const w3 = await U(), hs1 = await page.evaluate(() => T.field.fieldState().run.hp.set);
        ok(hs1 === hs0 && w3.wards.set?.left < num.somang.ward, `동행(세트) 방패는 따로 줄어듦: 체력 ${hs0} → ${hs1}, 남은 흡수 ${w3.wards.set?.left}`);
        // how long it lasts is the ward's own time, not how long the lotus picture plays
        await page.evaluate(() => { T.field.testReset(); T.field.testUlt({ somang: 100, cd: 0 }); T.field.ult(); });
        const play = await page.evaluate(() => T.data.DATA.duat.field.ult.fx.somang.frames.reduce((a, f) => a + f.ms, 0) / 1000);
        await sleep((num.somang.time - 0.5) * 1000); const wa = await U();
        await sleep(1000); const wb = await U();
        ok(!!wa.wards.somang && !wb.wards.somang, `연꽃 방패 지속 ${num.somang.time}초(그림 재생 ${play.toFixed(2)}초와 따로): ${num.somang.time - 0.5}초에 ${wa.wards.somang ? '있음' : '없음'}, ${num.somang.time + 0.5}초에 ${wb.wards.somang ? '있음' : '없음'}`);
        // ---- moving about, swapping, saving, another chat
        await into('set');
        await page.evaluate(() => T.field.testUlt({ set: 40, horus: 30, somang: 20 }));
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
        await page.evaluate(() => { const s = T.state.getState(); T.heroes.setLead(s, 'horus'); T.heroes.setWith(s, 'set'); });
        await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(900);
        const moved = await U();
        ok(moved.g.set === 40 && moved.g.horus === 30 && moved.g.somang === 20, `맵 이동·앞장 교대 뒤 그대로 (${JSON.stringify(moved.g)})`);
        await page.evaluate(async () => T.win.foldGame()); await sleep(1500);
        await page.reload({ waitUntil: 'domcontentloaded' }); await boot();
        await page.evaluate(async () => { await T.win.openGame(); window.toastr?.clear(); }); await sleep(1500);
        const back = await U();
        ok(back.g.set === 40 && back.g.horus === 30 && back.g.somang === 20, `저장·다시 불러오기: 같은 값 (${JSON.stringify(back.g)}), 더해지지 않음`);
        // another chat: its own gauges; back: these again
        const chats = await page.evaluate(() => SillyTavern.getContext().characters.length);
        if (chats > 1) {
            await page.evaluate(() => SillyTavern.getContext().selectCharacterById(1)); await sleep(2500);
            const other = await page.evaluate(() => { const s = T.state.getState(); return s ? (s.ult || null) : 'none'; });
            await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await sleep(2500);
            const again = await page.evaluate(() => T.state.getState()?.ult || null);
            ok(JSON.stringify(other) !== JSON.stringify(back.g) && again?.set === 40, `채팅 전환: 다른 채팅은 따로(${JSON.stringify(other)}), 돌아오면 그대로(${JSON.stringify(again)})`);
        } else log('  (채팅이 하나뿐이라 채팅 전환 검사는 미실행)');
        // ---- the video: each lead, three shield soldiers as approved, touches only
        await page.evaluate(async () => { await T.win.openGame(); window.toastr?.clear(); });
        for (const lead of ['set', 'horus', 'somang']) {
            await into(lead);
            await page.evaluate(() => T.field.testUlt({ set: 0, horus: 0, somang: 0 }));
            await page.evaluate(lead => { const r = T.field.fieldState().run; r.hp[lead] = 99; r.max[lead] = 99; }, lead);
            await page.evaluate(() => { const p = T.player.player; for (const [i, [dx, dy]] of [[3, -2], [5, 0], [3, 2]].entries()) (i ? T.field.testAdd : T.field.testOnly)('desert_leather_shield', p.x + dx, p.y + dy, {}); T.field.testEvents(true); });
            const t0 = Date.now(); let skills = 0, readyAt = null, ultAt = null;
            // what the game did in this fight (read and cleared each turn: the event list keeps only the last 300)
            const tally = {}; const count = evs => { for (const e of evs) { const k = e.ev === 'charge' ? `charge:${e.who}` : e.ev === 'ignored' ? `ignored:${e.what}(${e.why})` : e.ev === 'press' ? `press:${e.what}` : e.ev === 'blow' ? `blow:${e.by || 'attack'}` : e.ev; tally[k] = (tally[k] || 0) + (e.ev === 'charge' ? e.amt : 1); } };
            const pad = await W.padBox();
            while (Date.now() - t0 < 60000) {
                const st = await page.evaluate(() => ({ f: T.field.fieldState(), u: T.field.testUlt(), me: { x: T.player.player.x, y: T.player.player.y }, ev: T.field.testEvents(true) }));
                count(st.ev);
                if (st.u.ready && !readyAt) { readyAt = Date.now(); log(`  ${WHO[lead]}: 궁 준비까지 스킬 ${skills}번, ${((readyAt - t0) / 1000).toFixed(1)}초 (게이지 ${JSON.stringify(st.u.g)})`); }
                if (st.u.ready) { await W.tapEl('.sf_ult'); ultAt = Date.now(); await sleep(2500); await page.screenshot({ path: path.join(OUT, `ult-${lead}.png`) }); break; }
                const alive = st.f.mobs.filter(o => o.st !== 'dead');
                if (!alive.length) { await page.evaluate(() => { const p = T.player.player; for (const [i, [dx, dy]] of [[3, -2], [5, 0], [3, 2]].entries()) (i ? T.field.testAdd : T.field.testOnly)('desert_leather_shield', p.x + dx, p.y + dy, {}); }); continue; }
                const o = alive.sort((a, b) => Math.hypot(a.x - st.me.x, a.y - st.me.y) - Math.hypot(b.x - st.me.x, b.y - st.me.y))[0];
                const dx = o.x - st.me.x, dy = o.y - st.me.y, d = Math.hypot(dx, dy);
                if (d > 1.3) { await W.touch('touchStart', pad.x, pad.y); await W.touch('touchMove', pad.x + dx / d * pad.lim, pad.y + dy / d * pad.lim); await sleep(160); await W.touch('touchEnd'); continue; }
                const skOn = await page.evaluate(() => !document.querySelector('.sf_duat_skill').disabled);
                if (skOn) { await W.tapEl('.sf_duat_skill'); skills++; } else await W.tapEl('.sf_talk');
                await sleep(120);
            }
            if (!readyAt) {   // why not: the presses, what was let pass, what charged whom, how the fight went
                const end = await page.evaluate(() => ({ u: T.field.testUlt(), run: T.field.fieldState().run, me: T.field.fieldState().me, mobs: T.field.fieldState().mobs.map(o => `${o.st}:${o.hp}`) }));
                log(`    준비 안 됨: 스킬 버튼 ${skills}번 · 게이지 ${JSON.stringify(end.u.g)} · ${JSON.stringify(tally)} · 체력 ${JSON.stringify(end.run?.hp)} · 앞장 ${JSON.stringify(end.me)} · 몹 ${end.mobs.join(',')}`);
            }
            ok(!!ultAt, `${WHO[lead]}: 궁 버튼으로 발동 (${readyAt ? ((readyAt - t0) / 1000).toFixed(1) + '초' : '준비 안 됨'})`);
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) { try { fs.renameSync(await v.path(), path.join(OUT, 'ult.webm')); } catch {} }
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
