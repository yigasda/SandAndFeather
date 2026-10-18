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
    page.on('pageerror', e => { if (!/Internal Server Error|"Internal S"/.test(e.message)) errors.push(e.message); });
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
        await page.evaluate(async () => T.win.travel('ombos', { x: 39.6, y: 22.4, dir: 'right' }));
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(OUT, 'ombos-east-edge-412.png') });
        let r = await walk(1, 0); log.push(r);
        await page.waitForFunction(() => T.player.player.map === 'desert_01', null, { timeout: 15000 });
        await page.waitForTimeout(1500);
        log.push({ arrived: await page.evaluate(() => ({ map: T.player.player.map, x: T.player.player.x, y: T.player.player.y })) });
        await page.screenshot({ path: path.join(OUT, 'desert_01-west-412.png') });
        // a short walk inside: right along the paved path, then back
        r = await walk(1, 0.25); log.push({ inside: r });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(OUT, 'desert_01-inside-412.png') });
        await page.evaluate(async () => T.win.travel('desert_01', 'west'));
        await page.waitForTimeout(800);
        r = await walk(-1, 0); log.push(r);
        await page.waitForFunction(() => T.player.player.map === 'ombos', null, { timeout: 15000 });
        await page.waitForTimeout(1200);
        log.push({ back: await page.evaluate(() => ({ map: T.player.player.map, x: T.player.player.x, y: T.player.player.y })) });
        await page.screenshot({ path: path.join(OUT, 'ombos-back-412.png') });
        // the big maps edge to edge: start at the way in next to the exit, walk out, land on the next map's way in
        const legs = [['desert_01', 'east', 1, 'desert_04', 'west'], ['desert_04', 'east', 1, 'desert_03', 'west'],
            ['desert_03', 'east', 1, 'desert_02', 'west'], ['desert_02', 'west', -1, 'desert_03', 'east'],
            ['desert_03', 'west', -1, 'desert_04', 'east'], ['desert_04', 'west', -1, 'desert_01', 'east']];
        legs.push(['desert_02', 'door', [0, -1], 'desert_11', 'outside'], ['desert_11', 'door', [0, -1], 'desert_17', 'east'],
            ['desert_17', 'east', [1, 0], 'desert_11', 'door'], ['desert_11', 'outside', [-1, 0], 'desert_02', 'door']);
        for (const [from, at, dx, to, land] of legs) {
            await page.evaluate(async ({ from, at }) => T.win.travel(from, at), { from, at });
            await page.waitForTimeout(600);
            r = Array.isArray(dx) ? await walk(dx[0], dx[1]) : await walk(dx, 0); log.push(r);
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
