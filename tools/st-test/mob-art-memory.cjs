// 몹 그림 메모리·로딩(사용자 10-19): 예정 배치에 가까운 장면에서 모든 모션(대기·준비 0/1·공격·후딜·가드·피격·소멸)을
// 재생한 뒤의 최대값, 맵 왕복 뒤. 폰 화면(412×900, dpr 2), CPU 4배 느리게(CDP). 세 가지를 나눠 적는다:
//   ① 픽셀 계산 — 지금 쥐고 있는 그림(몹 시트·캐릭터 그림·맵 배경)의 가로 × 세로 × 4 바이트(브라우저가 실제로 얼마나
//     쓰는지와 다를 수 있음: 디코딩을 버리고 다시 하거나, GPU에 올린 사본이 따로 있을 수 있음)
//   ② 측정 — JS 힙(performance.memory), 이 컨테이너 크롬의 렌더러·GPU 프로세스 RSS(ps). 헤드리스·소프트웨어 그리기라
//     실제 폰과 다름
//   ③ 측정 못 함 — 실제 폰 GPU 텍스처 메모리, 브라우저 내부 이미지 캐시, 폰 브라우저의 메모리 한도
//   node tools/st-test/mob-art-memory.cjs [out] [--old <old sprites.json>]   (--old: 이전 묶음으로, art/enemies-old 필요 —
//   mob-art-compare.cjs가 시험 서버에 복사해 둔다)
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const args = process.argv.slice(2), oi = args.indexOf('--old'), OLD = oi >= 0 ? args.splice(oi, 2)[1] : null;
const OUT = path.resolve(args[0] || 'docs/consult/desert/mobs/memory');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };
const log = m => { console.log(m); res.push(m); };
const MB = b => (b / 1048576).toFixed(1);
// the scenes: what the plan puts together (DESERT-REGISTRY: T1 가죽 방패병·봉인 항아리, P2 봉인 방패병 + 왕면 수문장);
// P2 is not in the game yet, so it is stood in T1W
const SCENES = [
    ['T1 예정(가죽 방패병 2 + 봉인 항아리 1)', [['desert_leather_shield', 3, -2], ['desert_leather_shield', -3, -2], ['desert_sealed_jar', 0, -4]]],
    ['P2 예정(봉인 방패병 2 + 왕면 수문장 1)', [['desert_sealed_shield', 3, 1], ['desert_sealed_shield', -3, 1], ['desert_royal_mask_warden', 0, -4]]],
    ['가장 큰 보스(파릉 수문장 1 + 걸음 비석 2)', [['desert_walking_stela', 3, 1], ['desert_walking_stela', -3, 1], ['desert_broken_tomb_warden', 0, -4]]],
];

(async () => {
    const old = OLD ? JSON.parse(fs.readFileSync(OLD, 'utf8')).enemies : null;
    if (old) for (const e of Object.values(old)) for (const v of [e, e.small]) { v.sheets = (v.sheets || [v.file]).map(f => f.replace('art/enemies/', 'art/enemies-old/')); v.file = v.sheets[0]; }
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--enable-precise-memory-info'] } : { args: ['--no-sandbox', '--enable-precise-memory-info'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    // ST's own errors (no model connected, its outside services unreachable) are not the game's, as in common.js
        const errors = []; page.on('pageerror', e => /Internal S|Host not/.test(e.message) || errors.push(e.message));
    const sleep = ms => page.waitForTimeout(ms);
    // the browser's processes (the one Playwright started and its children): renderer, GPU, … RSS in KB
    const procs = () => {
        try {
            const rows = execSync('ps -eo pid,ppid,rss,args --no-headers').toString().trim().split('\n').map(l => { const m = l.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/); return m && { pid: +m[1], ppid: +m[2], rss: +m[3], args: m[4] }; }).filter(Boolean);
            // the browser Playwright started (driven over a pipe), the newest one, and all under it
            const root = Math.max(...rows.filter(r => /remote-debugging-pipe/.test(r.args)).map(r => r.pid));
            const kids = new Set([root]); let grew = true;
            while (grew) { grew = false; for (const r of rows) if (kids.has(r.ppid) && !kids.has(r.pid)) { kids.add(r.pid); grew = true; } }
            const mine = rows.filter(r => kids.has(r.pid) && /chrom/i.test(r.args));
            const kind = r => /--type=renderer/.test(r.args) ? 'renderer' : /--type=gpu-process/.test(r.args) ? 'gpu' : /--type=/.test(r.args) ? 'other' : 'browser';
            const sum = {}; for (const r of mine) sum[kind(r)] = (sum[kind(r)] || 0) + r.rss * 1024;
            return sum;
        } catch { return {}; }
    };
    try {
        await page.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 }); await sleep(2500);
        const save = page.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ });
        if (await save.count()) { await save.first().click(); await sleep(1500); }
        await page.waitForFunction(() => SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
        await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0)); await page.waitForFunction(() => !!SillyTavern.getContext().chatId);
        await page.waitForSelector('#sf_open', { state: 'attached' });
        await page.evaluate(async ([base, old]) => {
            window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', player: 'world/player', heroes: 'core/heroes', field: 'packs/duat/field', ledger: 'core/ledger', data: 'core/data' })) T[k] = await import(base + 'src/' + f + '.js');
            if (old) for (const [k, v] of Object.entries(old)) if (T.data.DATA.sprites.enemies[k]) T.data.DATA.sprites.enemies[k] = v;
            T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, 'horus'); await T.win.openGame(); window.toastr?.clear();
            // ① what the pictures held now take, width × height × 4
            T.pixels = () => {
                const D = T.data.DATA, seen = new Set(), add = (im, cat, sum) => { if (!im || seen.has(im)) return; seen.add(im); sum[cat] = (sum[cat] || 0) + (im.naturalWidth || im.width) * (im.naturalHeight || im.height) * 4; };
                const sum = {};
                for (const [f, im] of Object.entries(D.spriteArt || {})) add(im, f.includes('enemies') ? (f.includes('desert-') ? '사막 몹' : '두아트 몹') : '캐릭터', sum);
                for (const sc of Object.values(D.sceneArt || {})) { add(sc.image, '맵 배경', sum); add(sc.nightImage, '맵 배경', sum); }
                for (const c of document.querySelectorAll('#sf_game canvas')) add(c, '화면 캔버스', sum);
                return sum;
            };
        }, [BASE, old]);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        log(`그림: ${old ? '이전 묶음(확대해 둔 것)' : '지금 묶음(원본 해상도)'} · 폰 412×900 dpr 2 · CPU 4배 느리게 · 로컬 서버(내려받는 시간 없음)`);
        const measure = async label => {
            await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
            const m = await page.evaluate(() => ({ px: T.pixels(), heap: performance.memory?.usedJSHeapSize || 0, art: T.field.testArt() }));
            const p = procs(), pxSum = Object.values(m.px).reduce((a, b) => a + b, 0);
            log(`${label}\n  ① 픽셀 계산 ${MB(pxSum)} MB (${Object.entries(m.px).map(([k, v]) => `${k} ${MB(v)}`).join(', ')}; 사막 몹 시트 ${m.art.files.length}장)\n  ② JS 힙 ${MB(m.heap)} MB · 크롬 RSS ${Object.entries(p).map(([k, v]) => `${k} ${MB(v)}`).join(', ')} MB`);
            return { pxSum, desert: m.px['사막 몹'] || 0, renderer: p.renderer || 0, gpu: p.gpu || 0 };
        };
        const peaks = [];
        for (const [name, list] of SCENES) {
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(800);
            await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; });
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(1500);
            // they stand round her; the first one put timed until its pictures are on screen
            const t0 = Date.now();
            await page.evaluate(list => {
                const p = T.player.player, base = T.data.DATA.desert.enemies.desert_leather_shield, num = { ...base, hp: 999, atk: 0, guard: 0, speed: 0, range: 0, nopush: true, aggro: 4 };
                list.forEach(([k, dx, dy], i) => (i ? T.field.testAdd : T.field.testOnly)(k, p.x + dx, p.y + dy, num));
            }, list);
            const kinds = [...new Set(list.map(l => l[0]))];
            await page.waitForFunction(kinds => kinds.every(k => T.field.testArt().files.some(f => f.includes(k.replace(/_/g, '-')))), kinds, { timeout: 60000 });
            const firstMs = Date.now() - t0;
            await sleep(1200);
            // every motion, each drawn a while (idle loop, warning, strike, open, guard, struck, falling)
            for (const f of [{ st: 'wander' }, { st: 'prepare', t: 0 }, { st: 'prepare', t: 0.45, aim: { dx: 0, dy: 1 } }, { st: 'attack', t: 0.05, aim: { dx: 0, dy: 0.01 }, struck: new Set() }, { st: 'recover', t: 0 }, { st: 'guard', t: 0 }, { st: 'hit', t: 0, stun: 999 }]) {
                await page.evaluate(f => T.field.testSet(o => ({ ...f, struck: new Set(), aim: f.aim || o.aim })), f);
                await sleep(f.st === 'wander' ? 1800 : 350);
            }
            const live = await measure(`${name} — 모든 모션 재생 뒤 (그림이 화면에 보이기까지 ${firstMs} ms)`);
            await page.evaluate(() => T.field.testSet({ st: 'dead', t: 0 })); await sleep(1500);
            await page.screenshot({ path: path.join(OUT, `${old ? 'before' : 'after'}-${peaks.length}.png`) });
            peaks.push({ name, firstMs, ...live });
        }
        // hopping: field → not a field → back three times, then the Duat
        for (let i = 0; i < 3; i++) {
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(1200);
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(2000);
        }
        const hop = await measure('맵 왕복 3번 뒤 T1W(정해 둔 가죽 방패병 1)');
        await page.evaluate(async () => { const s = T.state.getState(); s.duatField = null; await T.win.travel('duat_04', 'bottom'); }); await sleep(2500);
        const duat = await measure('두아트 04');
        ok(duat.desert === 0, '두아트에서는 사막 몹 그림이 남지 않음');
        const best = Math.max(...peaks.map(p => p.desert));
        log(`요약: 사막 몹 그림(픽셀 계산) 장면별 최대 ${peaks.map(p => `${p.name.split('(')[0]} ${MB(p.desert)}`).join(' · ')} MB, 가장 큰 장면 ${MB(best)} MB · 왕복 뒤 ${MB(hop.desert)} MB · 처음 보이기까지 ${peaks.map(p => p.firstMs).join(' / ')} ms`);
        ok(!errors.length, `페이지 오류 없음 ${errors.join('; ')}`);
    } finally {
        fs.writeFileSync(path.join(OUT, `result-${OLD ? 'before' : 'after'}.txt`), res.join('\n') + '\n');
        await context.close(); await browser.close();
    }
    process.exit(fail ? 1 : 0);
})();
