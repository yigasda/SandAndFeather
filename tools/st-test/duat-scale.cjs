// Actual SillyTavern game screenshots for A-2; test-only map definitions.
// python3 tools/maps/duat-preview.py && node tools/st-test/duat-scale.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const OUT = path.resolve(process.argv[2] || 'docs/consult/duat-field/scale');
const BASE = '/scripts/extensions/third-party/SandAndFeather/';
const candidates = JSON.parse(fs.readFileSync(path.join(OUT, 'candidates.json')));
fs.mkdirSync(OUT, { recursive: true });
(async () => {
    const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errors = [], checks = [];
    page.on('pageerror', e => { if (!/Internal Server Error/.test(e.message)) errors.push(e.message); });
    try {
        // This is a local working branch. Do not let ST auto-update the checkout
        // while testing; only the test browser's manifest response is changed.
        await page.route('**/SandAndFeather/manifest.json', async route => {
            const response = await route.fetch();
            await route.fulfill({ response, json: { ...await response.json(), auto_update: false } });
        });
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 });
        await page.waitForTimeout(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await page.waitForTimeout(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0));
        await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async ({ base, candidates }) => {
            window.duatScale = {};
            for (const [key, file] of Object.entries({ win: 'ui/window', state: 'core/state', data: 'core/data', player: 'world/player', heroes: 'core/heroes', render: 'world/render', map: 'world/map' }))
                duatScale[key] = await import(base + 'src/' + file + '.js');
            const t = duatScale; t.previewId = candidates.candidates[0].map.id;
            t.saved = structuredClone(SillyTavern.getContext().chatMetadata.sand_feather);
            t.state.resetState();
            const s = t.state.getState(); s.part = 'night'; s.wake = null;
            t.heroes.setLead(s, 'somang'); t.heroes.setWith(s, '');
            for (const c of candidates.candidates) {
                t.data.DATA.maps[c.map.id] = c.map;
                t.data.DATA.sceneArt[c.map.id] = { ...c.scene, image: null, nightImage: null };
            }
            await t.win.openGame();
            window.toastr?.clear();
        }, { base: BASE, candidates });
        await page.waitForTimeout(1000);
        for (const width of [412, 320]) {
            await page.setViewportSize({ width, height: 900 });
            for (const c of candidates.candidates) {
                for (const [spot, [px, py]] of Object.entries(candidates.positions)) {
                    await page.evaluate(async ({ id, size, px, py }) => {
                        duatScale.state.getState().part = 'night';
                        await duatScale.win.travel(id, { x: px / size - .5, y: py / size - .8, dir: 'right' });
                    }, { id: c.map.id, size: c.pixelsPerTile, px, py });
                    await page.waitForTimeout(450);
                    const actual = await page.evaluate(() => ({ map: duatScale.player.player.map, x: duatScale.player.player.x, y: duatScale.player.player.y }));
                    assert.equal(actual.map, c.map.id);
                    assert(Math.abs(actual.x - (px / c.pixelsPerTile - .5)) < .01);
                    assert(Math.abs(actual.y - (py / c.pixelsPerTile - .8)) < .01);
                    await page.screenshot({ path: path.join(OUT, `${c.pixelsPerTile}px-${width}-${spot}.png`) });
                    checks.push({ width, pixelsPerTile: c.pixelsPerTile, spot, sourceFoot: [px, py], actual });
                }
            }
        }
        // Verify the unoccupied background uses the same pixels at day/night.
        const background = await page.evaluate(() => {
            const t = duatScale, id = t.previewId, scene = t.data.DATA.sceneArt[id];
            const map = new t.map.GameMap(t.data.DATA.maps[id]);
            const cv = document.createElement('canvas'), renderer = new t.render.Renderer(cv);
            renderer.setMap(map, 'akhet'); renderer.setSprites(t.data.DATA.sprites);
            cv.width = 600; cv.height = 800; renderer.zoom = 2;
            const shots = [];
            for (const part of ['day', 'night']) {
                renderer.draw({ player: { x: -100, y: -100, dir: 'right', step: 0 }, people: [], part, time: 0 });
                shots.push(renderer.g.getImageData(0, 0, 600, 800).data.slice());
            }
            let changed = 0;
            for (let i = 0; i < shots[0].length; i++) if (shots[0][i] !== shots[1][i]) changed++;
            renderer.release(); return { changed, tintNight: scene.tintNight ?? false };
        });
        fs.writeFileSync(path.join(OUT, 'capture-checks.json'), JSON.stringify({ checks, background, errors, scope: 'A-2 scale preview only; collision, exits and combat not verified' }, null, 2));
        assert.equal(background.changed, 0);
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ captures: checks.length, background, errors }));
    } finally {
        await page.screenshot({ path: path.join(OUT, 'last-screen.png') }).catch(() => {});
        await page.evaluate(async () => {
            if (!window.duatScale) return;
            await duatScale.win.closeGame();
            SillyTavern.getContext().chatMetadata.sand_feather = duatScale.saved;
            await SillyTavern.getContext().saveMetadata();
        }).catch(() => {});
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
