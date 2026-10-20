// 사막 01: 옴보스 오른쪽 아래 끝 → 사막 01 서쪽 → 다시 옴보스. 대형맵 01 → 04 → 03 → 02와 돌아오기(가장자리 출구).
// 02 돌 문 → 11 → 17과 돌아오기. 폰 화면(412×900), 걸어서 출구를 밟는다.
//   python3 tools/maps/desert.py && node tools/st-test/desert-maps.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/maps');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {});
    const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errors = [], log = [];
    // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
    page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
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
        await page.evaluate(async ({ base }) => {
            window.T = {};
            for (const [key, file] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', map: 'world/map' }))
                T[key] = await import(base + 'src/' + file + '.js');
            T.state.resetState();
            const s = T.state.getState(); s.part = 'day'; s.wake = null;
            T.heroes.setLead(s, 'horus'); T.heroes.setWith(s, 'set');
            await T.win.openGame();
            window.toastr?.clear();
        }, { base: BASE });
        await page.waitForTimeout(1000);
        // walk in one direction until the map changes (or stop)
        const walk = (dx, dy, to) => page.evaluate(({ dx, dy, to }) => {
            const p = T.player.player, from = p.map, map = T.map.getMap(p.map); let n = 0;
            while (p.map === from && n < 4000) {
                const old = [p.x, p.y];
                T.player.stepPlayer(map, dx, dy, 0.015); n++;
                if (map.exitAt(p.x + .5, p.y + .8)) return { from, at: [p.x, p.y], exit: map.exitAt(p.x + .5, p.y + .8).to, steps: n };
                if (Math.hypot(p.x - old[0], p.y - old[1]) < 1e-7) return { from, at: [p.x, p.y], blocked: true, steps: n };
            }
            return { from, at: [p.x, p.y], steps: n };
        }, { dx, dy, to });
        // walk along the floor to a named exit (landings sit GAP inside, so the way out is not always a straight line):
        // a route on a 0.25-tile grid with her own foot box, followed with stepPlayer until the exit is under her feet
        const walkTo = exitId => page.evaluate(exitId => {
            const p = T.player.player, from = p.map, m = T.map.getMap(p.map), e = m.d.exits.find(x => x.id === exitId);
            const S = 0.25, free = (x, y) => !m.solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96), key = (x, y) => x + ',' + y;
            // within one grid step of the exit (an exit along the very edge can be narrower than the grid); the last bit below walks in
            const inExit = (x, y) => { const fx = x * S + 0.5, fy = y * S + 0.8; return fx >= e.x0 - S && fx <= e.x1 + S && fy >= e.y0 - S && fy <= e.y1 + S; };
            const g0 = [Math.round(p.x / S), Math.round(p.y / S)], prev = new Map([[key(...g0), null]]), q = [g0]; let end = null;
            while (q.length && !end) {
                const [x, y] = q.shift();
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    const nx = x + dx, ny = y + dy, k = key(nx, ny);
                    if (prev.has(k) || nx * S < -2 || ny * S < -2 || nx * S > m.w + 1 || ny * S > m.h + 1) continue;
                    if (!free(nx * S, ny * S) || (dx && dy && (!free((x + dx) * S, y * S) || !free(x * S, (y + dy) * S)))) continue;
                    prev.set(k, [x, y]); if (inExit(nx, ny)) { end = [nx, ny]; break; } q.push([nx, ny]);
                }
            }
            if (!end) return { from, at: [p.x, p.y], noRoute: exitId };
            const route = []; for (let c = end; c; c = prev.get(key(...c))) route.unshift([c[0] * S, c[1] * S]);
            let n = 0;
            for (const [tx, ty] of route) {
                while (Math.hypot(tx - p.x, ty - p.y) > 0.05 && n < 20000) {
                    const ox = p.x, oy = p.y;
                    T.player.stepPlayer(m, tx - p.x, ty - p.y, 0.015); n++;
                    if (Math.hypot(p.x - ox, p.y - oy) < 1e-6) break;   // a grid point she cannot stand on exactly: the next one
                    const x = m.exitAt(p.x + .5, p.y + .8); if (x) return { from, at: [p.x, p.y], exit: x.to, steps: n };
                }
            }
            // the last bit: on toward the middle of the exit
            const cx = (e.x0 + e.x1) / 2 - 0.5, cy = (e.y0 + e.y1) / 2 - 0.8;
            for (let i = 0; i < 400; i++) {
                T.player.stepPlayer(m, cx - p.x, cy - p.y, 0.015); n++;
                const x = m.exitAt(p.x + .5, p.y + .8); if (x) return { from, at: [p.x, p.y], exit: x.to, steps: n };
            }
            return { from, at: [p.x, p.y], steps: n };
        }, exitId);
        await page.evaluate(async () => T.win.travel('ombos', { x: 37.5, y: 22.4, dir: 'right' }));
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(OUT, 'ombos-east-edge-412.png') });
        let r = await walk(1, 0); log.push(r);
        await page.waitForFunction(() => T.player.player.map === 'desert_golden_dunes', null, { timeout: 15000 });
        await page.waitForTimeout(1500);
        log.push({ arrived: await page.evaluate(() => ({ map: T.player.player.map, x: T.player.player.x, y: T.player.player.y })) });
        await page.screenshot({ path: path.join(OUT, 'desert_golden_dunes-west-412.png') });
        // a short walk inside: right along the paved path, then back
        r = await walk(1, 0.25); log.push({ inside: r });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(OUT, 'desert_golden_dunes-inside-412.png') });
        await page.evaluate(async () => T.win.travel('desert_golden_dunes', 'west'));
        await page.waitForTimeout(800);
        r = await walkTo('west'); log.push(r);
        await page.waitForFunction(() => T.player.player.map === 'ombos', null, { timeout: 15000 });
        await page.waitForTimeout(1200);
        log.push({ back: await page.evaluate(() => ({ map: T.player.player.map, x: T.player.player.x, y: T.player.player.y })) });
        await page.screenshot({ path: path.join(OUT, 'ombos-back-412.png') });
        // the big maps edge to edge: start at the way in next to the exit, walk out, land on the next map's way in
        const legs = [['desert_golden_dunes', 'east', 'east', 'desert_dry_flats', 'west'], ['desert_dry_flats', 'east', 'east', 'desert_quiet_dunes', 'west'],
            ['desert_quiet_dunes', 'east', 'east', 'desert_buried_temple', 'west'], ['desert_buried_temple', 'west', 'west', 'desert_quiet_dunes', 'east'],
            ['desert_quiet_dunes', 'west', 'west', 'desert_dry_flats', 'east'], ['desert_dry_flats', 'west', 'west', 'desert_golden_dunes', 'east']];
        legs.push(['desert_buried_temple', 'door', 'door', 'desert_city_gate', 'outside'], ['desert_city_gate', 'door', 'door', 'desert_city_plaza', 'east'],
            ['desert_city_plaza', 'east', 'east', 'desert_city_gate', 'door'], ['desert_city_gate', 'outside', 'left', 'desert_buried_temple', 'door'],
            // 02 신전 문 ↔ T1W 석재 마당 아래 끝(착지: 사용자 파란 원)
            // 02 ↔ 15 ↔ T1W (maps/desert-verified-abc934a7; the old 02 ↔ T1W straight way is gone), as in portal-walk.cjs
            ['desert_buried_temple', 'temple', 'temple', 'desert_colonnade', 'south'], ['desert_colonnade', 'south', 'south', 'desert_buried_temple', 'temple'],
            ['desert_colonnade', 'forecourt', 'forecourt', 'desert_forecourt_west', 'east'], ['desert_forecourt_west', 'east', 'east', 'desert_colonnade', 'forecourt']);
        for (const [from, at, exitId, to, land] of legs) {
            await page.evaluate(async ({ from, at }) => T.win.travel(from, at), { from, at });
            await page.waitForTimeout(600);
            // GAP: the landing is not in any exit, and standing there a moment takes her nowhere
            const still = await page.evaluate(({ from, at }) => { const p = T.player.player, m = T.map.getMap(from); return { map: p.map, exit: !!m.exitAt(p.x + .5, p.y + .8) }; }, { from, at });
            if (still.map !== from || still.exit) throw Error(`${from} ${at}: landing in an exit ${JSON.stringify(still)}`);
            // and walking about there, left and right (and up and down) by 1.5 people-widths, never reaches an exit
            const wiggle = await page.evaluate(() => {
                const p = T.player.player, m = T.map.getMap(p.map), x0 = p.x, y0 = p.y, reach = 1.5 * (m.d.actorScale || 1), hit = [];
                for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    p.x = x0; p.y = y0;
                    for (let n = 0; n < 2000 && Math.hypot(p.x - x0, p.y - y0) < reach; n++) {
                        const ox = p.x, oy = p.y; T.player.stepPlayer(m, dx, dy, 0.015);
                        if (m.exitAt(p.x + .5, p.y + .8)) { hit.push([dx, dy]); break; }
                        if (Math.hypot(p.x - ox, p.y - oy) < 1e-6) break;
                    }
                }
                p.x = x0; p.y = y0;
                return hit;
            });
            if (wiggle.length) throw Error(`${from} ${at}: walking about the landing reaches an exit ${JSON.stringify(wiggle)}`);
            log.push({ wiggle: `${from}:${at}`, ok: true });
            r = await walkTo(exitId); log.push(r);
            if (r.exit !== to) throw Error(`${from} ${at}: ${JSON.stringify(r)}`);
            await page.waitForFunction(id => T.player.player.map === id, to, { timeout: 15000 });
            await page.waitForTimeout(1200);
            const e = await page.evaluate(({ to, land }) => { const p = T.player.player, w = T.map.getMap(to).d.entries[land]; return { map: p.map, x: p.x, y: p.y, entry: [w.x, w.y] }; }, { to, land });
            if (Math.hypot(e.x - e.entry[0], e.y - e.entry[1]) > 0.05) throw Error(`${to}: landed ${e.x},${e.y} not at ${land}`);
            log.push({ arrived: e });
            await page.screenshot({ path: path.join(OUT, `${to}-${land}-412.png`) });
        }
        if (errors.length) throw Error(errors.join('; '));
    } finally {
        fs.writeFileSync(path.join(OUT, 'trip.json'), JSON.stringify({ log, errors }, null, 1));
        console.log(JSON.stringify({ log, errors }));
        await browser.close();
    }
})();
