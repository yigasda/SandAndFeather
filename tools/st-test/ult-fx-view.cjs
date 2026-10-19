// 궁 이펙트 해상도 후보를 실제 표시 크기로 나란히(사용자 10-19: 원본 보존, 확정 전). 폰 412×900 dpr 2, T1W, 앞장·동행 + 몹 하나(크기 비교용).
// 후보(full 원본 해상도 · half · third — tools/art/ult-fx-candidates.py가 시험 서버에 만든 것)마다 캐릭터별로 가장 활짝 핀 셋째 장면의
// 한가운데 순간을 멈춰 세우고(testUltFrame) 화면을 찍는다. 줄이지 않은 화면 픽셀 그대로 잘라 붙인다.
// 세트·호루스는 타격 범위(그림의 주된 부분, 희미한 빛 제외)를 겹친 화면도 남긴다(area-<who>.png).
//   node tools/st-test/ult-fx-view.cjs [out]   → out/<tag>-<who>.png, out/sheet-<who>.png (왼쪽부터 full · half · third)
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/ult/view');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west', TAGS = ['full', 'half', 'third'];
fs.mkdirSync(OUT, { recursive: true });

(async () => {
    const table = JSON.parse(fs.readFileSync('/home/user/sillytavern/sillytavern/data/default-user/extensions/SandAndFeather/data/fx.json', 'utf8'));
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
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
        for (const who of ['set', 'horus', 'somang']) {
            for (const tag of TAGS) {
                await page.evaluate(async ([who, fx, m]) => {
                    T.data.DATA.duat.field.ult.fx = fx;
                    const s = T.state.getState(); T.heroes.setLead(s, who); T.heroes.setWith(s, { set: 'horus', horus: 'set', somang: 'set' }[who]);
                    await T.win.travel('desert_buried_temple', 'west');
                    s.ledger.gday = T.ledger.today(s) + 1; await T.win.travel(m, 'yard');   // the 궁 pictures of this table are asked for on the way in
                }, [who, table[tag], MAP]);
                await sleep(2500);
                const ms = await page.evaluate(who => {
                    const fr = T.data.DATA.duat.field.ult.fx[who].frames; let at = 0, best = 0;
                    for (const [i, f] of fr.entries()) { if (i === 2) best = at + f.ms / 2; at += f.ms; }   // the third: each one at its fullest
                    const p = T.player.player; T.field.testOnly('desert_leather_shield', p.x + 2.6, p.y, { hp: 999, atk: 0, speed: 0, range: 0, guard: 0, nopush: true });
                    T.field.testUltFrame(who, best); return best;
                }, who);
                await sleep(1500);
                await page.screenshot({ path: path.join(OUT, `${tag}-${who}.png`) });
                // where it hurts over the picture (yellow 세트, orange 호루스: the main part, not the faint glow), full only
                if (tag === 'full' && who !== 'somang') {
                    // the widest frame of its main part (tools/art/ult-fx-pack.py area: 세트 5th, 호루스 4th), the one the oval is taken from
                    await page.evaluate(([who, i]) => { const fr = T.data.DATA.duat.field.ult.fx[who].frames; let at = 0; for (let k = 0; k < i; k++) at += fr[k].ms; T.field.testRanges(true); T.field.testUltFrame(who, at + fr[i].ms / 2); }, [who, { set: 4, horus: 3 }[who]]); await sleep(120);
                    await page.screenshot({ path: path.join(OUT, `area-${who}.png`) });
                    await page.evaluate(() => T.field.testRanges(false));
                }
                console.log(tag, who, `${Math.round(ms)} ms`);
                await page.evaluate(() => T.field.testUltFrame(null));
            }
            // the three side by side, the screen's own pixels (no scaling), the middle of the screen round her
            execFileSync('python3', ['-c', `
import sys
from PIL import Image
out, who = sys.argv[1], sys.argv[2]
ims = [Image.open(f'{out}/{t}-{who}.png').crop((0, 700, 824, 1450)) for t in ('full', 'half', 'third')]
sh = Image.new('RGB', (824 * 3 + 16, 750), (40, 30, 20))
for i, im in enumerate(ims): sh.paste(im, (i * 832, 0))
sh.save(f'{out}/sheet-{who}.png')
`, OUT, who]);
        }
    } finally { await context.close(); await browser.close(); }
})();
