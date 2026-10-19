// 사막 B1 마무리 (OPUS 사막 계획서 19절 B1, 사용자 보완 지시 3): 02 돌 문 → 11 → 17 → 11 → 02를 화면 터치 조이스틱으로
// 걷는다(CDP 터치 이벤트 → .sf_pad의 pointer 이벤트, 키보드·순간이동 없음). 영상으로 남기고 다음을 검사한다.
//   - 출구 진입·이탈·재진입, 한 번 밟을 때 이동 한 번(맵 바뀜을 매 프레임 기록), 착지에 서 있어도 다시 안 넘어감
//   - 착지 발 상자가 바닥 안이고 출구 밖(모든 착지는 출구에서 사람 폭 3배 이상, 사용자가 찍은 11 문 착지는 2.47배)
//   - 게임 창 닫기(자리 저장) → 새로고침 → 같은 채팅 다시 열기 → 같은 맵·자리, 새 채팅으로 갔다 와도 그대로
//   node tools/st-test/desert-b1.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/b1');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0;
const res = [];
const ok = (c, msg) => { const line = `${c ? 'PASS' : 'FAIL'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {});
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
        recordVideo: { dir: OUT, size: { width: 412, height: 900 } } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).map(s => s.trim()).join(' < ')));

    const boot = async charId => {
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 });
        await page.waitForTimeout(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await page.waitForTimeout(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await selectChar(charId);
    };
    const selectChar = async id => {
        await page.evaluate(id => SillyTavern.getContext().selectCharacterById(id), id);
        await page.waitForFunction(id => String(SillyTavern.getContext().characterId) === String(id) && !!SillyTavern.getContext().chatId, id, { timeout: 30000 });
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.waitForTimeout(800);
    };
    const load = () => page.evaluate(async base => {
        window.T = {};
        for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', map: 'world/map' }))
            T[k] = await import(base + 'src/' + f + '.js');
        // every map change, frame by frame (a second change right after one is a double move)
        T.moves = []; let last = T.player.player.map;
        const watch = () => { const m = T.player.player.map; if (m !== last) { T.moves.push({ from: last, to: m, t: performance.now(), x: T.player.player.x, y: T.player.player.y }); last = m; } requestAnimationFrame(watch); };
        requestAnimationFrame(watch);
    }, BASE);

    // the pad: hold it, push the knob toward a direction, let go
    const padBox = async () => page.evaluate(() => { const r = document.querySelector('.sf_pad').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, lim: r.width / 2 * 0.62 }; });
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const hold = async (dx, dy, ms) => {
        const p = await padBox(); await touch('touchStart', p.x, p.y);
        const n = Math.hypot(dx, dy) || 1, steps = Math.max(1, Math.round(ms / 50));
        for (let i = 0; i < steps; i++) { await touch('touchMove', p.x + dx / n * p.lim, p.y + dy / n * p.lim); await page.waitForTimeout(50); }
        await touch('touchEnd');
    };
    // walk with the pad to a map's exit: a route on the floor (0.25-tile grid, the player's own foot box), the knob pointed
    // at the next corner of it every 50 ms, until the map changes
    const walkTo = async (exitId, limitMs = 40000) => {
        const route = await page.evaluate(exitId => {
            const p = T.player.player, m = T.map.getMap(p.map), e = m.d.exits.find(x => x.id === exitId);
            if (!e) return null;
            const S = 0.25, free = (x, y) => !m.solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
            const gx = Math.round(p.x / S), gy = Math.round(p.y / S), key = (x, y) => x + ',' + y;
            const inExit = (x, y) => { const fx = x * S + 0.5, fy = y * S + 0.8; return fx >= e.x0 && fx <= e.x1 && fy >= e.y0 && fy <= e.y1; };
            const prev = new Map([[key(gx, gy), null]]), q = [[gx, gy]]; let end = null;
            while (q.length && !end) {
                const [x, y] = q.shift();
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    const nx = x + dx, ny = y + dy, k = key(nx, ny);
                    if (prev.has(k) || nx < -2 || ny < -2 || nx * S > m.w + 1 || ny * S > m.h + 1) continue;
                    if (!free(nx * S, ny * S) || (dx && dy && (!free(x * S + dx * S, y * S) || !free(x * S, y * S + dy * S)))) continue;
                    prev.set(k, [x, y]);
                    if (inExit(nx, ny)) { end = [nx, ny]; break; }
                    q.push([nx, ny]);
                }
            }
            if (!end) return null;
            const out = []; for (let c = end; c; c = prev.get(key(...c))) out.unshift([c[0] * S, c[1] * S]);
            return out;
        }, exitId);
        if (!route) return { reached: false, why: 'no route' };
        const from = await page.evaluate(() => T.player.player.map);
        const p = await padBox(); await touch('touchStart', p.x, p.y);
        const t0 = Date.now(); let i = 0, changed = false, last = null, lastT = t0, trace = [];
        while (Date.now() - t0 < limitMs) {
            const me = await page.evaluate(() => ({ x: T.player.player.x, y: T.player.player.y, map: T.player.player.map, moving: T.player.player.moving, card: !!document.querySelector('.sf_pop_wrap'), act: T.player.player.act }));
            if (me.map !== from) { changed = true; break; }
            // the nearest route point ahead of the last one (a shortcut may have passed some without touching them)
            { let bi = i, bd = Infinity; for (let k = i; k < Math.min(route.length, i + 40); k++) { const d = Math.hypot(route[k][0] - me.x, route[k][1] - me.y); if (d < bd) { bd = d; bi = k; } } i = bi; }
            // aim at the farthest route point ahead (up to 3 tiles) that a straight walk reaches without touching a wall
            const j = await page.evaluate(([route, i]) => {
                const p = T.player.player, m = T.map.getMap(p.map);
                const free = (x, y) => !m.solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
                let best = i;
                for (let j = i; j < Math.min(route.length, i + 12); j++) {
                    const [tx, ty] = route[j], n = Math.ceil(Math.hypot(tx - p.x, ty - p.y) / 0.08); let clear = true;
                    for (let k = 1; k <= n && clear; k++) clear = free(p.x + (tx - p.x) * k / n, p.y + (ty - p.y) * k / n);
                    if (clear) best = j; else break;
                }
                return best;
            }, [route, i]);
            const [tx, ty] = route[j];
            const dx = tx - me.x, dy = ty - me.y, n = Math.hypot(dx, dy) || 1;
            await touch('touchMove', p.x + dx / n * p.lim, p.y + dy / n * p.lim);
            if (Date.now() - lastT > 400) { trace.push([+me.x.toFixed(2), +me.y.toFixed(2), i, j, route[j].map(v => +v.toFixed(2)), me.moving, me.card, me.act]); lastT = Date.now(); }
            await page.waitForTimeout(50);
        }
        await touch('touchEnd');
        if (!changed) console.log('stuck trace', JSON.stringify(trace.slice(0, 6).concat(trace.slice(-6))), 'route end', JSON.stringify(route[route.length - 1]));
        return { reached: changed, ms: Date.now() - t0 };
    };
    const where = () => page.evaluate(() => ({ map: T.player.player.map, x: T.player.player.x, y: T.player.player.y }));
    const landing = (map, entry) => page.evaluate(([map, entry]) => {
        const m = T.map.getMap(map), w = m.d.entries[entry], last = T.moves[T.moves.length - 1];
        const p = last && last.to === map ? last : T.player.player;
        const fx = w.x + 0.5, fy = w.y + 0.8;
        return { at: Math.hypot(p.x - w.x, p.y - w.y) < 0.05, floor: !m.solidRect(w.x + 0.22, w.y + 0.62, w.x + 0.78, w.y + 0.96),
            inExit: m.d.exits.filter(e => fx >= e.x0 && fx <= e.x1 && fy >= e.y0 && fy <= e.y1).map(e => e.id) };
    }, [map, entry]);

    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await boot(0);
        await load();
        await page.evaluate(async () => {
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null;
            T.heroes.setLead(s, 'horus'); T.heroes.setWith(s, 'set');
            await T.win.openGame(); window.toastr?.clear();
        });
        await page.waitForTimeout(1000);

        // 1. 02 돌 문: the landing on the stone path below the door; standing still must not move her
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'door'));
        await page.waitForTimeout(2500);
        let L = await landing('desert_buried_temple', 'door');
        let me = await where();
        ok(me.map === 'desert_buried_temple' && L.at && L.floor && !L.inExit.length, `02 돌 문 착지: 바닥 안, 출구 밖 (${JSON.stringify(L)})`);
        ok(me.map === 'desert_buried_temple', '02 돌 문 착지에 가만히 2.5초: 안 넘어감');
        await page.screenshot({ path: path.join(OUT, '1-02-door.png') });
        // step off the door, then into it again with the pad
        await hold(0, 1, 500);
        await page.waitForTimeout(300);
        ok((await where()).map === 'desert_buried_temple', '조이스틱으로 조금 움직여도(아래로 0.5초): 그대로 02');
        let n0 = await page.evaluate(() => T.moves.length);
        const walkStart = n0;
        let r = await walkTo('door');
        await page.waitForTimeout(2500);
        me = await where(); L = await landing('desert_city_gate', 'outside');
        ok(r.reached && me.map === 'desert_city_gate' && L.at && L.floor && !L.inExit.length, `조이스틱으로 02 돌 문 → 11 바깥 착지 (${r.ms} ms, ${JSON.stringify(L)})`);
        ok(await page.evaluate(n0 => T.moves.length - n0, n0) === 1, '한 번 밟아 이동 한 번');
        await page.screenshot({ path: path.join(OUT, '2-11-outside.png') });

        // 2. 11 계단 → 문 → 17 (문틀 가림 아래로 들어감)
        n0 = await page.evaluate(() => T.moves.length);
        r = await walkTo('door');
        await page.waitForTimeout(2500);
        me = await where(); L = await landing('desert_city_plaza', 'east');
        ok(r.reached && me.map === 'desert_city_plaza' && L.at && L.floor && !L.inExit.length, `조이스틱으로 11 문 → 17 동쪽 착지 (${r.ms} ms, ${JSON.stringify(L)})`);
        ok(await page.evaluate(n0 => T.moves.length - n0, n0) === 1, '한 번 밟아 이동 한 번');
        await page.screenshot({ path: path.join(OUT, '3-17-east.png') });

        // 3. 17: stand still, walk away, come back to the same exit (re-entry)
        await page.waitForTimeout(2000);
        ok((await where()).map === 'desert_city_plaza', '17 착지에서 가만히 2초: 안 넘어감');
        await hold(-1, 0, 900);
        await page.waitForTimeout(300);
        n0 = await page.evaluate(() => T.moves.length);
        r = await walkTo('east');
        await page.waitForTimeout(2500);
        me = await where(); L = await landing('desert_city_gate', 'door');
        ok(r.reached && me.map === 'desert_city_gate' && L.at && L.floor && !L.inExit.length, `17에서 물러났다 다시 동쪽 출구 → 11 문 착지 (${JSON.stringify(L)})`);
        ok(await page.evaluate(n0 => T.moves.length - n0, n0) === 1, '한 번 밟아 이동 한 번');
        await page.screenshot({ path: path.join(OUT, '4-11-door.png') });

        // 4. 11 계단 아래로 → 02 돌 문
        n0 = await page.evaluate(() => T.moves.length);
        r = await walkTo('bottom');
        await page.waitForTimeout(2500);
        me = await where();
        ok(r.reached && me.map === 'desert_buried_temple', `조이스틱으로 11 아래 → 02 돌 문 (${r.ms} ms)`);
        ok(await page.evaluate(n0 => T.moves.length - n0, n0) === 1, '한 번 밟아 이동 한 번');
        await page.waitForTimeout(2000);
        ok((await where()).map === 'desert_buried_temple', '02 돌 문 착지에 가만히 2초: 11로 되돌아가지 않음');
        const moves = await page.evaluate(n => T.moves.slice(n).map(m => `${m.from}→${m.to}`), walkStart);
        ok(moves.join(' ') === 'desert_buried_temple→desert_city_gate desert_city_gate→desert_city_plaza desert_city_plaza→desert_city_gate desert_city_gate→desert_buried_temple',
            `조이스틱으로 걸은 동안 맵 바뀜 전체(네 번, 중복 없음): ${moves.join(', ')}`);

        // 5. 저장 → 새로고침 → 같은 채팅 → 같은 맵·자리
        await page.evaluate(async () => T.win.travel('desert_city_plaza', 'east'));
        await page.waitForTimeout(1500);
        await hold(-1, 0.3, 700);
        const before = await where();
        // as a player leaves: the game window closed (window.js closeGame → rememberPosition → saveState)
        await page.evaluate(async () => { await T.win.closeGame(); });
        await page.waitForTimeout(1500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await boot(0);
        await load();
        await page.evaluate(async () => { await T.win.openGame(); window.toastr?.clear(); });
        await page.waitForTimeout(2500);
        let after = await where();
        ok(after.map === before.map && Math.hypot(after.x - before.x, after.y - before.y) < 0.02, `게임 창 닫기(저장) → 새로고침 → 같은 채팅: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
        await page.screenshot({ path: path.join(OUT, '5-reload.png') });

        // 6. 다른 채팅(같은 캐릭터의 새 채팅)으로 갔다 오기: 그 채팅의 게임은 따로, 돌아오면 그대로
        const chatA = await page.evaluate(() => SillyTavern.getContext().chatId);
        await page.evaluate(async () => { await T.win.closeGame(); });
        await page.evaluate(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); });
        await page.waitForFunction(a => SillyTavern.getContext().chatId && SillyTavern.getContext().chatId !== a, chatA, { timeout: 30000 });
        await page.waitForTimeout(1500);
        await page.evaluate(async () => { await T.win.openGame(); window.toastr?.clear(); });
        await page.waitForTimeout(2000);
        const other = await page.evaluate(() => ({ chat: SillyTavern.getContext().chatId, pos: T.state.getState()?.pos, on: T.player.player.map }));
        ok(other.on !== before.map && other.pos?.map !== before.map, `새 채팅(${other.chat})의 게임은 따로: ${other.on} (사막 자리를 가져가지 않음)`);
        await page.evaluate(async () => { await T.win.closeGame(); });
        await page.evaluate(async a => { await SillyTavern.getContext().openCharacterChat(a); }, chatA);
        await page.waitForFunction(a => SillyTavern.getContext().chatId === a, chatA, { timeout: 30000 });
        await page.waitForTimeout(1500);
        await page.evaluate(async () => { await T.win.openGame(); window.toastr?.clear(); });
        await page.waitForTimeout(2500);
        after = await where();
        ok(after.map === before.map && Math.hypot(after.x - before.x, after.y - before.y) < 0.02, `원래 채팅으로 돌아와 같은 맵·자리: ${JSON.stringify(after)}`);
        await page.screenshot({ path: path.join(OUT, '6-back-to-chat.png') });
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        const v = page.video(); await context.close(); await browser.close();
        if (v) fs.renameSync(await v.path(), path.join(OUT, 'b1-joystick.webm'));
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
