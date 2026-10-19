// 몹 그림 전후 비교(사용자 10-19: 원본 해상도로 묶고 화면에서만 확대 — 흐려지거나 발이 흔들리지 않는지 실제 화면으로).
//   이전 묶음(old 폴더 + 그때의 sprites.json)과 지금 묶음을 게임과 같은 방식(기준점, H / visible 배율, imageSmoothingQuality
//   high)으로 그려 비교한다. 화면 크기 H(캐릭터 키 하나의 화면 픽셀):
//     140 — 폰 412×900 dpr 2(그리고 PC dpr 1), T1W(카메라 0.8, 캐릭터 1.4배)
//     280 — 넓은 PC 화면 dpr 2(가장 크게 그려지는 경우)
//   보는 것: 불투명 영역의 왼·오른·위·아래 끝(기준점에서, 화면 px) — 발·몸 크기·무기 위치, 경계 선명도(불투명 부분의 밝기
//   기울기 평균), 픽셀 차이. 확대 비교 그림과 실제 게임 화면 캡처(같은 모션으로 고정)를 out에 남긴다.
//   node tools/st-test/mob-art-compare.cjs <old 폴더(art/enemies)> <old sprites.json> [out]
//   (old는 이전 커밋에서: git show 12b1d2f:data/sprites.json, git archive 12b1d2f data/art/enemies)
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const [OLD_DIR, OLD_JSON] = process.argv.slice(2, 4);
const OUT = path.resolve(process.argv[4] || 'docs/consult/desert/mobs/art-compare');
const EXT = '/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather';
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
const KINDS = ['desert_temple_warden', 'desert_royal_mask_warden', 'desert_throne_warden', 'desert_broken_tomb_warden', 'desert_balance_sentinel', 'desert_sealed_shield', 'desert_mask_priest_mantle'];
const MOTIONS = ['idle-0', 'prepare-1', 'attack-0', 'hit', 'disappear'];
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };
const log = m => { console.log(m); res.push(m); };

(async () => {
    // the old sheets next to the new ones, under art/enemies-old (the test server only)
    fs.mkdirSync(path.join(EXT, 'data/art/enemies-old'), { recursive: true });
    for (const f of fs.readdirSync(OLD_DIR)) if (f.startsWith('desert-')) fs.copyFileSync(path.join(OLD_DIR, f), path.join(EXT, 'data/art/enemies-old', f));
    const old = JSON.parse(fs.readFileSync(OLD_JSON, 'utf8')).enemies;
    for (const e of Object.values(old)) for (const v of [e, e.small]) { v.sheets = (v.sheets || [v.file]).map(f => f.replace('art/enemies/', 'art/enemies-old/')); v.file = v.sheets[0]; }
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
        const errors = []; page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
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
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, null); await T.win.openGame(); window.toastr?.clear();
        }, BASE);

        // 1. the same frames drawn as the game draws them, old against new
        const rows = await page.evaluate(async ([old, kinds, motions, base]) => {
            const load = async f => { const im = new Image(); im.src = base + 'data/' + f; await im.decode(); return im; };
            const pick = (d, H) => (H <= d.small.visible + 1 ? d.small : d);   // as drawMob picks
            const out = [], shots = [];
            for (const kind of kinds) for (const H of [140, 280]) for (const mo of motions) {
                const one = async d => {
                    const a = pick(d, H), r = a.frames[mo], img = await load((a.sheets || [a.file])[r[6] || 0]), k = H / a.visible;
                    const W = Math.ceil(Math.max(r[4], r[2] - r[4]) * k * 2 + 8), Hh = Math.ceil(r[3] * k + 8), px = W / 2, py = Math.ceil(r[5] * k + 4);
                    const c = document.createElement('canvas'); c.width = W; c.height = Hh;
                    const g = c.getContext('2d', { willReadFrequently: true });
                    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
                    g.translate(px, py); g.drawImage(img, r[0], r[1], r[2], r[3], -r[4] * k, -r[5] * k, r[2] * k, r[3] * k);
                    const d2 = g.getImageData(0, 0, W, Hh).data;
                    let x0 = W, x1 = -1, y0 = Hh, y1 = -1, grad = 0, n = 0;
                    const L = i => 0.299 * d2[i] + 0.587 * d2[i + 1] + 0.114 * d2[i + 2];
                    for (let y = 1; y < Hh - 1; y++) for (let x = 1; x < W - 1; x++) {
                        const i = (y * W + x) * 4;
                        if (d2[i + 3] >= 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
                        if (d2[i + 3] >= 250 && d2[i + 7] >= 250 && d2[i + W * 4 + 3] >= 250) { grad += Math.abs(L(i + 4) - L(i)) + Math.abs(L(i + W * 4) - L(i)); n++; }
                    }
                    return { c, W, Hh, px, py, box: [x0 - px, x1 - px, y0 - py, y1 - py], sharp: n ? grad / n : 0, k: a.visible, src: (a.sheets || [a.file])[r[6] || 0] };
                };
                const A = await one(old[kind]), B = await one(T.data.DATA.sprites.enemies[kind]);
                // pixel difference on the same canvas size (both centred on the pivot)
                let diff = 0, cnt = 0;
                if (A.W === B.W && A.Hh === B.Hh && A.py === B.py) {
                    const da = A.c.getContext('2d').getImageData(0, 0, A.W, A.Hh).data, db = B.c.getContext('2d').getImageData(0, 0, B.W, B.Hh).data;
                    for (let i = 0; i < da.length; i += 4) if (da[i + 3] || db[i + 3]) { diff += (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) + Math.abs(da[i + 3] - db[i + 3])) / 4; cnt++; }
                }
                out.push({ kind, H, mo, old: { box: A.box, sharp: +A.sharp.toFixed(2), visible: A.k }, now: { box: B.box, sharp: +B.sharp.toFixed(2), visible: B.k }, diff: cnt ? +(diff / cnt).toFixed(2) : null });
                // a side-by-side (old | new) at 1:1 and a 3× crop round the lowest point of the front (fists, feet)
                if (mo === 'idle-0' || mo === 'attack-0') {
                    const W = A.W + B.W + 12, Hh = Math.max(A.Hh, B.Hh), s = document.createElement('canvas'); s.width = W; s.height = Hh + 260;
                    const g = s.getContext('2d'); g.fillStyle = '#d9b97a'; g.fillRect(0, 0, W, s.height);
                    g.drawImage(A.c, 0, 0); g.drawImage(B.c, A.W + 12, 0);
                    g.imageSmoothingEnabled = false;
                    const zx = Math.round(A.px + (A.box[0] + A.box[1]) / 2 - 40), zy = Math.round(A.py + A.box[2] + (A.box[3] - A.box[2]) * 0.7 - 40);   // a 80×80 patch in its lower middle
                    g.drawImage(A.c, zx, zy, 80, 80, 0, Hh + 10, 240, 240);
                    g.drawImage(B.c, zx - A.px + B.px, zy - A.py + B.py, 80, 80, A.W + 12, Hh + 10, 240, 240);
                    g.fillStyle = '#000'; g.font = '14px sans-serif'; g.fillText('이전', 4, 16); g.fillText('지금', A.W + 16, 16);
                    shots.push({ name: `${kind.replace('desert_', '')}-${mo}-H${H}.png`, url: s.toDataURL('image/png') });
                }
            }
            return { out, shots };
        }, [old, KINDS, MOTIONS, BASE]);
        for (const s of rows.shots) fs.writeFileSync(path.join(OUT, s.name), Buffer.from(s.url.split(',')[1], 'base64'));
        log('종 | H | 모션 | 이전 묶음 px/키 → 지금 | 불투명 끝(왼, 오른, 위, 아래; 기준점에서 화면 px) 이전 → 지금 | 경계 선명도 이전 → 지금 | 픽셀 차이(0~255 평균)');
        let worstMove = 0;
        for (const r of rows.out) {
            const move = Math.max(...r.old.box.map((v, i) => Math.abs(v - r.now.box[i])));
            worstMove = Math.max(worstMove, move);
            log(`${r.kind.replace('desert_', '')} | ${r.H} | ${r.mo} | ${r.old.visible} → ${r.now.visible} | ${r.old.box.join(', ')} → ${r.now.box.join(', ')} | ${r.old.sharp} → ${r.now.sharp} | ${r.diff}`);
        }
        ok(worstMove <= 2, `발·몸 끝 위치 차이 최대 ${worstMove} 화면 px (2 이하: 반올림 수준)`);

        // 2. the game screen: a temple warden held in one picture, drawn from the old sheets and then from the new
        await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
        await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; });
        await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(900);
        for (const kind of ['desert_temple_warden', 'desert_broken_tomb_warden']) {
            const base = await page.evaluate(() => T.data.DATA.desert.enemies.desert_leather_shield);
            await page.evaluate(([kind, base]) => { const p = T.player.player; T.field.testOnly(kind, p.x + 1, p.y - 3, { ...base, hp: 999, guard: 0, speed: 0, range: 0, atk: 0, nopush: true }); }, [kind, base]);
            await sleep(400);
            for (const [tag, entry] of [['before', old[kind]], ['after', null]]) {
                await page.evaluate(([kind, entry]) => {
                    T.keep ||= {}; T.keep[kind] ||= T.data.DATA.sprites.enemies[kind];
                    T.data.DATA.sprites.enemies[kind] = entry || T.keep[kind];
                    T.field.testSet({ st: 'hit', t: 0, stun: 999 });
                }, [kind, entry]);
                await page.waitForFunction(kind => { const d = T.data.DATA.sprites.enemies[kind]; return (d.sheets || [d.file]).every(f => !d.frames.hit || T.data.DATA.spriteArt?.[(d.sheets || [d.file])[d.frames.hit[6] || 0]]); }, kind, { timeout: 20000 }).catch(() => {});
                await sleep(800);
                await page.screenshot({ path: path.join(OUT, `game-${kind.replace('desert_', '')}-${tag}.png`) });
            }
        }
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
        await context.close(); await browser.close();
    }
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
