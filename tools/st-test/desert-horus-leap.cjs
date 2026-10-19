// 호루스 기술 A안(사용자 2026-10-19): 진행 방향 도약 경로의 가장 가까운 유효 적 앞에 착지, 피해·반경 1.2·가드 시간 그대로.
//   장면마다 testReset·하루 넘김으로 새 몹, 동행 없음, 서 있는 시험 몹(speed 0, range 0) — 판정은 사건 기록(field.js testEvents)
//   - 근접 1.1칸 / 최대 3.0칸(2.5칸 도약 + 착지 간격) / 넘어선 4.0칸(기존 도약 그대로, 안 맞음)
//   - 큰 적(시험 값: 몸 반경·앞 공간 1.5칸): 중심 2.1칸에 내려도 몸이 반경 안이라 맞음, 몸과 겹치지 않음
//   - 뒤·옆 적은 겨냥하지 않음(기존 도약 그대로) / 벽 너머 적은 겨냥하지 않음, 벽 안에 내리지 않음 / 벽 앞 적은 맞음
//   - 두아트 고대장치(ring): 근접·2.5칸 모두 맞음
//   - 가드 깨기: 호루스·세트 따로 — 가드 중 기술 명중 → break 사건, 가드 풀림(hit), 경직(stun = stagger)
//   - 가드 중 일반 공격 피해 = max(1, round(n × guardTake)) 를 실제 계산과 대조
//   node tools/st-test/desert-horus-leap.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/b3');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west', KIND = 'desert_leather_shield';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };
const log = msg => { console.log(msg); res.push(msg); };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const sleep = ms => page.waitForTimeout(ms);
    const shot = n => page.screenshot({ path: path.join(OUT, n) });
    try {
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
            // the field's own foot box (field.js solid)
            T.solid = (x, y) => T.win.currentMap().solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
        }, BASE);
        // one scene: out (ends the fight), a day on (fresh creatures), the party, in, clean
        const scene = async (lead, map = MAP, entry = 'yard') => {
            await page.evaluate(() => T.field.testReset());
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(900);
            await page.evaluate(lead => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; s.duatField = null; T.heroes.setLead(s, lead); T.heroes.setWith(s, null); }, lead);
            await page.evaluate(async ([m, e]) => T.win.travel(m, e), [map, entry]); await sleep(900);
            await page.evaluate(() => T.field.testReset());
            return page.evaluate(() => { const f = T.field.fieldState(); return !f.me.down && !f.me.act && f.map === T.win.currentMap().id; });
        };
        const put = (kind, dx, dy, n) => page.evaluate(([k, dx, dy, n]) => { const p = T.player.player; T.field.testOnly(k, p.x + dx, p.y + dy, n); T.field.testFace('right'); }, [kind, dx, dy, n]);
        // press the 기술, wait out the leap; where he went, what the events say
        // (she turns to what she is fighting on her own; the case is about where she faces when the button goes down)
        const leap = async () => {
            const x0 = await page.evaluate(() => T.player.player.x); await page.evaluate(() => T.field.testEvents(true));
            await page.evaluate(() => { T.field.testFace('right'); T.field.skill(); }); await sleep(900);
            return page.evaluate(x0 => {
                const p = T.player.player, o = T.field.fieldState().mobs[0], ev = T.field.testEvents(true);
                return { x0, x1: p.x, y: p.y, inWall: T.solid(p.x, p.y), gap: o ? Math.hypot(o.x + 0.5 - (p.x + 0.5), o.y + 0.8 - (p.y + 0.8)) : null, blows: ev.filter(e => e.ev === 'blow'), ev };
            }, x0);
        };
        const STILL = { guard: 0, speed: 0, range: 0 };
        // a standing place in T1W with clear floor 4.5 tiles to the right (the yard landing)
        const cases = [
            ['근접 1.1칸', 1.1, 0, STILL, r => r.blows.length === 1 && r.x1 >= r.x0 && r.gap >= 0.3 && r.gap - 0 < 1.2],
            ['최대 3.0칸(도약 2.5 + 간격 0.6 안)', 3.0, 0, STILL, r => r.blows.length === 1 && r.x1 - r.x0 <= 2.5 + 1e-6 && r.gap < 1.2],
            ['넘어선 4.0칸: 기존 도약(2.5칸), 안 맞음', 4.0, 0, STILL, r => r.blows.length === 0 && Math.abs(r.x1 - r.x0 - 2.5) < 0.05],
            ['큰 적(몸 반경·앞 공간 각 1.5칸 = 캐릭터 키 0.55배) 3.5칸: 몸과 안 겹치고 맞음', 3.5, 0, { ...STILL, body: 0.55, space: 0.55 }, r => r.blows.length === 1 && r.gap >= 1.5 && r.gap - 1.5 < 1.2],
            ['뒤 1.5칸: 겨냥 안 함, 기존 도약', -1.5, 0, STILL, r => r.blows.length === 0 && Math.abs(r.x1 - r.x0 - 2.5) < 0.05],
            ['옆(위아래 1.5칸): 겨냥 안 함, 기존 도약', 1.0, 1.5, STILL, r => Math.abs(r.x1 - r.x0 - 2.5) < 0.05],
        ];
        for (const [name, dx, dy, n, test] of cases) {
            await scene('horus');
            await put(KIND, dx, dy, n); await sleep(150);
            const r = await leap();
            ok(test(r) && !r.inWall, `호루스 ${name}: ${r.x0.toFixed(2)}→${r.x1.toFixed(2)} (${(r.x1 - r.x0).toFixed(2)}칸), 착지-몹 중심 ${r.gap?.toFixed(2)}, 명중 ${r.blows.map(b => `${b.by} ${b.dmg}`).join(',') || '없음'}${r.inWall ? ', 벽 안!' : ''}`);
        }
        // a wall to his right: a standing place in T1W whose floor ends in a wall within 2 tiles to the right
        await scene('horus');
        const spot = await page.evaluate(() => {
            const m = T.win.currentMap();
            for (let y = 3; y < m.h - 3; y += 0.5) for (let x = 3; x < m.w - 6; x += 0.25) {
                if (T.solid(x, y) || T.solid(x - 1, y)) continue;
                let w = null; for (let k = 1; k <= 20; k++) if (T.solid(x + k * 0.1, y)) { w = k * 0.1; break; }
                if (w == null || w < 1.4) continue;
                // the far side of the wall is floor (a creature can stand there)
                let far = null; for (let k = 1; k <= 30; k++) if (!T.solid(x + w + k * 0.1, y) && !T.solid(x + w + k * 0.1 + 0.3, y)) { far = w + k * 0.1 + 0.3; break; }
                if (far != null && far < 4) return { x, y, w, far };
            }
            return null;
        });
        if (!spot) ok(false, '벽 앞 장소를 T1W에서 찾지 못함');
        else {
            log(`벽 장소: 서는 곳 (${spot.x}, ${spot.y}), 오른쪽 벽까지 ${spot.w.toFixed(1)}칸, 벽 너머 바닥 ${spot.far.toFixed(1)}칸`);
            for (const [name, dx, test] of [
                ['벽 너머 적: 겨냥 안 함, 벽 앞까지만 도약, 안 맞음', spot.far, r => r.blows.length === 0 && r.x1 - r.x0 <= spot.w + 1e-6],
                ['벽 앞 적(벽과 호루스 사이): 맞음', Math.min(spot.w - 0.3, 1.2), r => r.blows.length === 1],
            ]) {
                await scene('horus');
                await page.evaluate(([x, y]) => { const p = T.player.player; p.x = x; p.y = y; }, [spot.x, spot.y]);
                await put(KIND, dx, 0, STILL); await sleep(150);
                if (name.startsWith('벽 너머')) await shot('leap-wall-before.png');
                const r = await leap();
                ok(test(r) && !r.inWall, `호루스 ${name}: ${r.x0.toFixed(2)}→${r.x1.toFixed(2)} (${(r.x1 - r.x0).toFixed(2)}칸), 명중 ${r.blows.map(b => `${b.by} ${b.dmg}`).join(',') || '없음'}${r.inWall ? ', 벽 안!' : ''}`);
            }
        }
        // Duat: the ancient device (ring), as the approved Duat checks put it
        for (const dx of [1.1, 2.5]) {
            await scene('horus', 'duat_04', 'bottom');
            await put('ring', dx, 0, STILL); await sleep(150);
            const r = await leap();
            ok(r.blows.length === 1 && !r.inWall, `두아트 duat_04 고대장치 ${dx}칸 앞: ${(r.x1 - r.x0).toFixed(2)}칸 도약, 착지-중심 ${r.gap?.toFixed(2)}, 명중 ${r.blows.map(b => `${b.by} ${b.dmg}`).join(',') || '없음'}`);
        }
        // the guard break, Horus then Set: a still creature that always guards; a full blow → it closes up → the 기술
        for (const lead of ['horus', 'set']) {
            await scene(lead);
            await put(KIND, 1.1, 0, { guard: 1, speed: 0, range: 0 }); await sleep(300);
            const t0 = await page.evaluate(() => T.field.testNow()); await page.evaluate(() => T.field.testEvents(true));
            await page.evaluate(() => T.field.attack());
            await page.waitForFunction(() => T.field.fieldState().mobs[0]?.st === 'guard', null, { timeout: 2000 }).catch(() => {});
            // the 기술 the moment she is free again (the attack shows 0.2 + 0.35 s from the press)
            await page.waitForFunction(t0 => T.field.testNow() - t0 > 0.58, t0, { timeout: 2000 });
            const g0 = await page.evaluate(() => T.field.fieldState().mobs[0]?.st);
            await page.evaluate(() => T.field.skill());
            let st = null;
            for (let i = 0; i < 40 && !st; i++) { await sleep(25); st = await page.evaluate(() => { const o = T.field.fieldState().mobs[0]; return o.st === 'hit' ? o : null; }); }
            await shot(`break-${lead}.png`);
            // 경직: how long it stays struck (a flinch is 0.3 s, a broken guard 0.8 s)
            const h0 = await page.evaluate(() => T.field.testNow()); let h1 = h0;
            while (h1 - h0 < 2 && await page.evaluate(() => T.field.fieldState().mobs[0]?.st === 'hit')) { await sleep(20); h1 = await page.evaluate(() => T.field.testNow()); }
            if (st) st.held = +(h1 - h0).toFixed(2);
            await sleep(300);
            const ev = await page.evaluate(() => T.field.testEvents(true));
            const tl = ev.map(e => `${(e.t - t0).toFixed(2)} ${e.ev}${e.by ? `[${e.by}] ${e.before}→${e.after} 피해 ${e.dmg}` : e.what ? ` ${e.what}${e.why ? ` (${e.why})` : ''}` : ''}`).join(' · ');
            const guard = ev.find(e => e.ev === 'guard'), brk = ev.find(e => e.ev === 'break'), sb = ev.find(e => e.ev === 'blow' && e.by === 'skill');
            ok(g0 === 'guard' && guard && brk && sb && sb.before === 'guard' && sb.after === 'hit' && st && st.held > 0.5 && sb.t < guard.until,
                `${lead === 'horus' ? '호루스' : '세트'} 가드 깨기: 가드 중(${g0}) 기술 명중 → break → 가드 풀림·경직(${st ? `st ${st.st} ${st.held}초 이상 유지` : '경직 못 봄'}), 피해 ${sb?.dmg} · ${tl}`);
        }
        // the guarded ordinary blow: max(1, round(n × guardTake)) against what the game did
        for (const lead of ['set', 'horus']) {
            await scene(lead);
            await put(KIND, 1.1, 0, { guard: 1, speed: 0, range: 0 }); await sleep(300);
            await page.evaluate(() => T.field.testEvents(true));
            await page.evaluate(() => T.field.attack()); await sleep(700);
            await page.evaluate(() => T.field.attack()); await sleep(700);
            const r = await page.evaluate(() => { const ev = T.field.testEvents(true).filter(e => e.ev === 'blow'); return ev; });
            const full = r[0]?.dmg, take = 0.3, want = Math.max(1, Math.round(full * take));
            ok(r.length === 2 && r[1].before === 'guard' && r[1].dmg === want, `${lead === 'horus' ? '호루스' : '세트'} 가드 중 일반 공격: 원래 ${full} → max(1, round(${full}×${take}=${(full * take).toFixed(2)})) = ${want}, 게임 ${r[1]?.dmg}`);
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'horus-leap-result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) fs.renameSync(await v.path(), path.join(OUT, 'horus-leap.webm'));
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
