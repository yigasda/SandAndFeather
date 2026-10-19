// 겨냥(사용자 10-19: 타겟팅은 다른 몹도 이상해): 사막 몹 12종 × 세트·호루스·소망, 스틱을 뗀 채 공격.
//   네 방향·네 대각선에 몸 끝이 사거리에 걸치게 세우고 — 그쪽으로 돌아서 치고(공격이 닿음), 그림이 그쪽을 보고,
//   몹이 그를 봄(가로로 0.3칸 넘게 떨어졌을 때)
//   사거리 + 1칸 안이지만 닿지 않는 곳 — 그쪽으로 돌기만 함(헛치기, 맞지 않음)
//   동행(호루스·소망·세트)이 그 몹을 실제로 침 — 몸통 높이에서 사거리 안에 서서
// 몹 능력치는 시험 값(가죽 방패병 데이터, 체력만 큼, 움직이지 않음, 가드 안 함, 밀려나지 않음, 알아채는 거리 +4칸(겨냥 시험은 +6칸: 파릉 수문장의 주먹 끝 바깥까지) — 수문장 종별 데이터 전). 결과·캡처를 out에 남긴다.
//   node tools/st-test/desert-target.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/mobs/target');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
const DEPTH = 0.4;   // field.js: the torso's depth on the floor, a part of its width
const WHO = { set: '세트', horus: '호루스', somang: '소망' }, MATE = { set: 'horus', horus: 'somang', somang: 'set' };
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 } });
    const page = await context.newPage();
    // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
    const errors = [];
    page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
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
        const scene = async (lead, mate = null) => {
            await page.evaluate(() => T.field.testReset());
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
            await page.evaluate(([lead, mate]) => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; T.heroes.setLead(s, lead); T.heroes.setWith(s, mate); }, [lead, mate]);
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(700);
            await page.evaluate(() => { T.field.testReset(); T.field.testRanges(true); });
            // an open place: nothing in the way for 8 tiles each way
            await page.evaluate(() => {
                const m = T.win.currentMap(), wall = (x, y) => m.solidRect(x - 0.08, y - 0.08, x + 0.08, y + 0.08);
                const open = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => { for (let k = 0; k <= 80; k++) if (wall(x + 0.5 + dx * k * 0.1, y + 0.8 + dy * k * 0.1)) return false; return true; });
                for (let r = 0; r < 30; r += 0.5) for (let a = 0; a < 6.28; a += 0.3) {
                    const p = T.player.player, x = Math.round((p.x + Math.cos(a) * r) * 4) / 4, y = Math.round((p.y + Math.sin(a) * r) * 4) / 4;
                    if (!T.solid(x, y) && open(x, y)) { p.x = x; p.y = y; return; }
                }
            });
        };
        // the creature's feet's middle at (dx, dy) from hers, she facing away; the stick let go, 공격
        const press = (kind, dx, dy, away) => page.evaluate(async ([kind, dx, dy, away]) => {
            const p = T.player.player, base = T.data.DATA.desert.enemies.desert_leather_shield;
            T.field.testReset(); T.field.testRanges(true); T.field.testHold(false);
            T.field.testOnly(kind, p.x + dx, p.y + dy, { ...base, hp: 999, guard: 0, speed: 0, range: 0, nopush: true, aggro: 6 });
            await new Promise(r => setTimeout(r, 120));   // it has looked at her
            T.field.testFace(away); T.field.testEvents(true); T.field.attack();
            await new Promise(r => setTimeout(r, 650));
            const st = T.field.fieldState(), h = T.field.testHurt()[0], f = { x: p.x + 0.5, y: p.y + 0.8 };
            return { blow: T.field.testEvents(true).find(e => e.ev === 'blow') || null, way: st.me.vdir || st.me.face, dir: p.dir, faceR: h.faceR, cx: h.cx, ty: h.y, py: f.y + dy, fx: f.x, fy: f.y };
        }, [kind, dx, dy, away]);
        const V = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
        const towards = (r, dx, dy) => { const v = V[r.way]; return v[0] * dx + v[1] * dy > 0 || v[0] * (r.cx - r.fx) + v[1] * (r.ty - r.fy) > 0; };
        const kinds = await page.evaluate(() => Object.keys(T.data.DATA.sprites.enemies).filter(k => k.startsWith('desert_')));
        let shot = 0;
        for (const lead of ['set', 'horus', 'somang']) {
            await scene(lead);
            const R = await page.evaluate(lead => T.data.DATA.duat.field.reach[lead], lead), t = await page.evaluate(() => 31.2 / 16 * (T.win.currentMap().d.actorScale || 1));
            for (const kind of kinds) {
                const h = await page.evaluate(k => T.data.DATA.sprites.enemies[k].hit, kind), ko = await page.evaluate(k => T.data.DATA.sprites.enemies[k].source.split('_').pop(), kind);
                const rx = h.body * t, ry = rx * DEPTH, back = (h.back || 0) * t, fr = (h.front || 0) * t, fk = !!h.frontKind;
                const half = rx * Math.sqrt(Math.max(0, 1 - (Math.max(0, back - 0.75) / ry) ** 2));
                // how far its feet's middle can be that way and still be met (as desert-strike.cjs)
                const E = { side: Math.max(R + half, fk ? R + fr : 0), up: Math.max(R - back + ry, fk ? R : 0), down: Math.max(R + back + ry, fk ? R : 0) };
                const spots = [
                    ['왼쪽', -(E.side - 0.15), 0, 'right'], ['오른쪽', E.side - 0.15, 0, 'left'], ['위', 0, -(E.up - 0.1), 'down'], ['아래', 0, E.down - 0.1, 'up'],
                    ['왼쪽 위', -(E.side * 0.6), -(E.up * 0.6), 'right'], ['오른쪽 위', E.side * 0.6, -(E.up * 0.6), 'left'],
                    ['왼쪽 아래', -(E.side * 0.6), E.down * 0.6, 'right'], ['오른쪽 아래', E.side * 0.6, E.down * 0.6, 'left'],
                ];
                // can any of her four blows meet it there (worked out here: its torso ellipse, what it holds out toward
                // her on its feet's line, her blow's box from just behind her feet to her reach, 0.75 to either side)
                const reachable = (dx, dy) => {
                    const pts = [];
                    for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) if (i * i + j * j <= 100) pts.push([dx + rx * i / 10, dy - back + ry * j / 10]);
                    if (fk) for (let k = 0; k <= 40; k++) pts.push([dx - Math.sign(dx || 1) * fr * k / 40, dy]);
                    return Object.entries(V).some(([, v]) => pts.some(([x, y]) => { const al = v[0] * x + v[1] * y, ac = v[0] ? y : x; return al > -0.2 && al < R && Math.abs(ac) < 0.75; }));
                };
                const bad = [];
                for (const [where, dx, dy, away] of spots) {
                    const r = await press(kind, dx, dy, away);
                    const why = [], can = reachable(dx, dy);
                    if (!r.blow && can) why.push('안 맞음');
                    if (r.blow && !can) why.push('닿을 수 없는데 맞음');
                    if (!towards(r, dx, dy)) why.push(`반대로 돎(${r.way})`);
                    if (r.dir !== r.way) why.push(`그림 ${r.dir} ≠ ${r.way}`);
                    if (Math.abs(r.fx - r.cx) > 0.3 && r.faceR !== r.fx > r.cx) why.push('몹이 딴 데 봄');
                    if (why.length) bad.push(`${where}(${dx.toFixed(1)}, ${dy.toFixed(1)}): ${why.join(', ')}`);
                    if (where === '왼쪽 아래') await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-${lead}-${kind}.png`) });
                }
                ok(!bad.length, `${WHO[lead]}→${ko} 여덟 방향(손 뗀 채): 돌아서 침(닿는 곳이면)·그림 방향·몹이 봄 ${bad.join(' / ')}`);
                // within her reach and a step, but out of her blow: she turns to it, no blow
                const r = await press(kind, -(E.side + 0.6), 0, 'right');
                ok(!r.blow && r.way === 'left' && r.dir === 'left', `${WHO[lead]}→${ko} 닿지 않는 왼쪽(${(E.side + 0.6).toFixed(1)}칸): 돌기만(${r.way}), 안 맞음`);
            }
        }
        // the one with her strikes it for real: stands level with its torso, in reach
        for (const [lead, mate] of [['set', 'horus'], ['horus', 'somang'], ['somang', 'set']]) {
            await scene(lead, mate);
            const bad = [];
            for (const kind of kinds) {
                const r = await page.evaluate(async kind => {
                    const p = T.player.player, base = T.data.DATA.desert.enemies.desert_leather_shield;
                    T.field.testReset(); T.field.testRanges(true);
                    const h = T.data.DATA.sprites.enemies[kind].hit, t = 31.2 / 16 * (T.win.currentMap().d.actorScale || 1);
                    T.field.testOnly(kind, p.x + 2.2 + Math.max(h.body, h.front || 0) * t, p.y, { ...base, hp: 999, guard: 0, speed: 0, range: 0, nopush: true, aggro: 6 });
                    T.field.testEvents(true);
                    for (let k = 0; k < 60; k++) { await new Promise(r => setTimeout(r, 100)); if (T.field.testEvents().some(e => e.ev === 'blow')) break; }
                    return { blow: T.field.testEvents(true).find(e => e.ev === 'blow') || null, st: T.field.fieldState() };
                }, kind);
                if (!r.blow) bad.push(`${kind.replace('desert_', '')}(동행 ${JSON.stringify(r.st.mateAt)}, ${r.st.stance ? '전투' : '평상'})`);
                if (kind.includes('temple') || kind.includes('jar')) await page.screenshot({ path: path.join(OUT, `${String(shot++).padStart(2, '0')}-mate-${mate}-${kind}.png`) });
            }
            ok(!bad.length, `동행 ${WHO[mate]}(앞장 ${WHO[lead]}): 12종 모두 6초 안에 실제로 침 ${bad.join(', ')}`);
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        await context.close(); await browser.close();
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
