// 일반 공격 판정(사용자 10-19): 캐릭터 앞의 공격 범위(발 바로 뒤에서 사거리까지, 좌우 0.75칸 — 길이·방향·피해 그대로)와
// 몹의 피격 도형(몸통 원, 방패 = 방어 표면, 수문장 주먹 = 몸)이 겹치는지. 세트·호루스·소망 × 항아리(일반)·가죽 방패병·신전 수문장.
//   정면 몸통 끝 — 중심이 사거리 밖이어도 몸이 닿으면 맞음(전부 피해)      빈 공간 — 몸 끝보다 더 멀면 안 맞음(공격이 늘지 않음)
//   방패만 닿음 — 막힘(가드 규칙: max(1, round(피해 × 0.3)), 움찔 없음)     주먹만 닿음(수문장) — 몸이라 전부 피해
//   옆 — 좌우 폭 안이면 맞음, 밖이면 안 맞음      뒤 — 안 맞음      벽 — 벽 너머는 안 맞음, 벽 앞은 맞음
// 몹 능력치는 시험 값(가죽 방패병 데이터, 체력만 큼, 움직이지 않음, 가드 안 함, 밀려나지 않음). 영상·결과를 out에 남긴다.
//   node tools/st-test/desert-strike.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/mobs/strike');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
const KINDS = { desert_sealed_jar: '항아리', desert_leather_shield: '가죽 방패병', desert_temple_warden: '신전 수문장' };
const WHO = { set: '세트', horus: '호루스', somang: '소망' };
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
            T.solid = (x, y) => T.win.currentMap().solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
        }, BASE);
        const scene = async lead => {
            await page.evaluate(() => T.field.testReset());
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
            await page.evaluate(lead => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; T.heroes.setLead(s, lead); T.heroes.setWith(s, null); }, lead);
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(700);
            await page.evaluate(() => { T.field.testReset(); T.field.testRanges(true); });
        };
        // one blow at a creature dx ahead, dy across (her feet's middle to its feet's middle); → the blow's event or null
        const blow = (kind, dx, dy = 0, at = null) => page.evaluate(async ([kind, dx, dy, at]) => {
            const p = T.player.player; if (at) { p.x = at[0]; p.y = at[1]; }
            const base = T.data.DATA.desert.enemies.desert_leather_shield;
            T.field.testReset(); T.field.testRanges(true);
            T.field.testOnly(kind, p.x + dx, p.y + dy, { ...base, hp: 999, guard: 0, speed: 0, range: 0, nopush: true });
            T.field.testFace('right'); T.field.testEvents(true); T.field.attack();
            await new Promise(r => setTimeout(r, 650));
            return T.field.testEvents(true).find(e => e.ev === 'blow') || null;
        }, [kind, dx, dy, at]);
        let shot = 0;
        for (const lead of ['set', 'horus', 'somang']) {
            await scene(lead);
            const info = await page.evaluate(lead => ({ reach: T.data.DATA.duat.field.reach[lead], t: 31.2 / 16 * (T.win.currentMap().d.actorScale || 1), power: null }), lead);
            for (const [kind, ko] of Object.entries(KINDS)) {
                const h = await page.evaluate(k => T.data.DATA.sprites.enemies[k].hit, kind);
                const R = info.reach, r = h.body * info.t, fr = (h.front || 0) * info.t;
                const name = `${WHO[lead]}→${ko}`;
                // 정면: the torso's near edge just inside her reach, its middle beyond
                let e = await blow(kind, R + r - 0.1);
                const full = e?.dmg;
                ok(e && e.by === 'attack' && R + r - 0.1 > R, `${name} 정면 몸통 끝(중심 ${(R + r - 0.1).toFixed(2)}칸 > 사거리 ${R}): 맞음 ${e?.dmg ?? '-'}`);
                await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-${lead}-${kind}-front.png`) });
                // 빈 공간: a little further than the torso's edge (and than a shield or fists)
                e = await blow(kind, Math.max(R + r, R + fr) + 0.35);
                ok(!e, `${name} 빈 공간(몸·앞 몸체 끝보다 0.35칸 멀리): 안 맞음`);
                if (h.frontKind === 'shield') {
                    // only the shield in reach: the torso beyond, the shield's face inside
                    const d = Math.min(R + fr - 0.15, R + r + 0.6);
                    e = await blow(kind, d);
                    ok(e && e.by === 'shield' && e.dmg === Math.max(1, Math.round(full * 0.3)), `${name} 방패만 닿음(중심 ${d.toFixed(2)}칸): 막힘 ${e?.dmg ?? '-'} = max(1, round(${full}×0.3))`);
                    await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-${lead}-${kind}-shield.png`) });
                } else if (h.frontKind === 'body') {
                    const d = R + fr - 0.15;
                    e = await blow(kind, d);
                    ok(e && e.by === 'attack' && e.dmg === full, `${name} 주먹만 닿음(중심 ${d.toFixed(2)}칸): 몸이라 전부 ${e?.dmg ?? '-'}`);
                    await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-${lead}-${kind}-fist.png`) });
                }
                // 옆: across inside 0.75 + its torso, and outside
                e = await blow(kind, Math.min(R, 0.8), 0.75 + r - 0.15);
                ok(e && e.by === 'attack', `${name} 옆(좌우 ${(0.75 + r - 0.15).toFixed(2)}칸, 몸통이 폭에 걸침): 맞음`);
                e = await blow(kind, Math.min(R, 0.8), 0.75 + r + 0.3);
                ok(!e, `${name} 옆 밖(좌우 ${(0.75 + r + 0.3).toFixed(2)}칸): 안 맞음`);
                // 뒤
                e = await blow(kind, -(r + Math.max(0, fr - 0) + 0.6));
                ok(!e, `${name} 뒤: 안 맞음`);
            }
        }
        // 벽: along the line her blow travels (from her feet's middle), a wall inside her reach and floor beyond it; a big
        // creature beyond (the stela: its torso reaches back through the wall into her reach) is not struck through it
        const spot = await page.evaluate(() => {
            const m = T.win.currentMap(), wall = (x, y) => m.solidRect(x - 0.08, y - 0.08, x + 0.08, y + 0.08);
            for (let y = 3; y < m.h - 3; y += 0.25) for (let x = 3; x < m.w - 4; x += 0.1) {
                if (T.solid(x, y) || T.solid(x - 1.3, y)) continue;               // she stands here, and 1.3 back
                const fx = x + 0.5, fy = y + 0.8;
                let w = null, t = null;
                for (let k = 1; k <= 6; k++) if (wall(fx + k * 0.1, fy)) { w = k * 0.1; break; }
                if (w == null || w < 0.3) continue;
                for (let k = 1; k <= 16; k++) if (!wall(fx + w + k * 0.1, fy)) { t = k * 0.1; break; }
                if (t == null || w + t > 2.0) continue;   // the stela's torso (≈1.3) reaches back through it into every reach
                if (T.solid(x + w + t + 0.2, y)) continue;                          // a creature can stand beyond
                return { x, y, w, t };
            }
            return null;
        });
        if (!spot) ok(false, 'T1W에서 사거리 안의 얇은 벽(그 너머 바닥)을 찾지 못함');
        else for (const lead of ['set', 'horus', 'somang']) {
            await scene(lead);
            const beyond = spot.w + spot.t + 0.2;
            let e = await blow('desert_walking_stela', beyond, 0, [spot.x, spot.y]);
            const shape = await page.evaluate(() => T.field.testHurt()[0]);
            ok(!e, `${WHO[lead]} 벽 너머(벽 ${spot.w.toFixed(1)}칸 앞, 두께 ${spot.t.toFixed(1)}칸, 몹 ${beyond.toFixed(2)}칸, 몸통 반경 ${shape.r.toFixed(2)}): 안 맞음`);
            await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-${lead}-wall.png`) });
            await page.evaluate(([x, y]) => { const p = T.player.player; p.x = x - 1.3; p.y = y; }, [spot.x, spot.y]);
            e = await blow('desert_walking_stela', 0.6);
            ok(e && e.by === 'attack', `${WHO[lead]} 벽 앞(같은 쪽, 몹 0.6칸): 맞음`);
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) { try { fs.renameSync(await v.path(), path.join(OUT, 'strike.webm')); } catch {} }
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
