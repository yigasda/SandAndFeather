// 전투 버튼 배치 정지 시안(사용자 10-19, 기능 전): 실제 게임 화면(T1W 전투)에서 배치만 화면 위에서 바꿔 찍는다(게임 코드는 그대로).
//   공격: 지금 자리 · 스킬: 공격 위 지금 자리(이름 '기술' → '스킬', 아이콘, 남은 쿨다운) · 주문: 그대로
//   궁: 지금 '가방' 자리(테두리 = 충전 게이지, 가득 차면 은은하게 빛남) · 가방: 오른쪽 위 설정 버튼 아래
//   터치 영역 검사: 버튼끼리, 조이스틱(손가락이 미끄러져도 받는 바깥 30px 포함)·하단 탭·화면 가장자리와 겹치지 않는지
//   node tools/st-test/ui-battle-mock.cjs [out]
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const OUT = path.resolve(process.argv[2] || 'docs/consult/desert/ui-mock');
const BASE = '/scripts/extensions/third-party/SandAndFeather/', MAP = 'desert_forecourt_west';
fs.mkdirSync(OUT, { recursive: true });
let fail = 0; const res = [];
const ok = (c, msg) => { const line = `${c ? '통과' : '실패'} ${msg}`; console.log(line); res.push(line); if (!c) fail++; };

// the mock: CSS and the moved / new elements (only in this page)
const MOCK_CSS = `
#sf_game .sf_mock_ult { position: relative; width: 64px; height: 64px; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  background: conic-gradient(#ffd25e calc(var(--g, 0) * 1turn), #2a1a10 0); box-shadow: 0 0 0 2px #4a2414; }
#sf_game .sf_mock_ult > b { position: absolute; inset: 7px; border-radius: 50%; display: grid; place-items: center; align-content: center; gap: 1px;
  background: radial-gradient(circle at 50% 38%, #5b3a8a, #2a1840 72%); color: #fff4dc; font-size: 13px; font-weight: 900; text-shadow: 0 1px 2px #0008; }
#sf_game .sf_mock_ult > b i { font-size: 16px; color: #ffe6a0; }
#sf_game .sf_mock_ult.sf_full { animation: sfUltGlow 1.8s ease-in-out infinite; }
@keyframes sfUltGlow { 0%,100% { box-shadow: 0 0 0 2px #4a2414, 0 0 6px 2px #ffd36a66; } 50% { box-shadow: 0 0 0 2px #4a2414, 0 0 16px 6px #ffd36acc; } }
#sf_game .sf_mock_ult:not(.sf_full) > b { filter: saturate(.7) brightness(.85); }
#sf_game .sf_duat_skill { display: grid !important; place-items: center; align-content: center; gap: 0; }
#sf_game .sf_duat_skill i { font-size: 14px; color: #ffe6a0; line-height: 1; }
#sf_game .sf_duat_skill s { position: absolute; inset: 0; display: grid; place-items: center; font-size: 19px; font-weight: 900; text-decoration: none; color: #fff; z-index: 2; }
#sf_game .sf_duat_skill.sf_cd { color: transparent; text-shadow: none; }
#sf_game .sf_duat_skill.sf_cd i { visibility: hidden; }
#sf_game .sf_mock_bag { position: absolute; z-index: 4; }
`;

(async () => {
    const browser = await chromium.launch(fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
    for (const [W, H] of [[412, 900], [360, 740]]) {
        const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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
                window.T = {}; for (const [k, f] of Object.entries({ win: 'ui/window', state: 'core/state', heroes: 'core/heroes', ledger: 'core/ledger', field: 'packs/duat/field' })) T[k] = await import(base + 'src/' + f + '.js');
                T.state.resetState(); const s = T.state.getState(); s.part = 'day'; s.wake = null; T.heroes.setLead(s, 'set'); T.heroes.setWith(s, 'horus'); await T.win.openGame(); window.toastr?.clear();
            }, BASE);
            await page.evaluate(async () => T.win.travel('desert_buried_temple', 'west')); await sleep(600);
            await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; });
            await page.evaluate(async m => T.win.travel(m, 'yard'), MAP); await sleep(1500);
            const tag = `${W}x${H}`;
            await page.screenshot({ path: path.join(OUT, `${tag}-0-now.png`) });
            // the mock
            await page.evaluate(css => {
                const root = document.getElementById('sf_game'), st = document.createElement('style'); st.textContent = css; document.head.append(st);
                const bag = root.querySelector('.sf_bag'), gear = root.querySelector('.sf_appearance'), actions = root.querySelector('.sf_actions');
                // 궁 where 가방 was
                const ult = document.createElement('button'); ult.type = 'button'; ult.className = 'sf_mock_ult'; ult.innerHTML = '<b><i class="fa-solid fa-sun"></i>궁</b>';
                actions.insertBefore(ult, bag);
                // 가방 under the gear, the same button, as wide as the gear
                const g = gear.getBoundingClientRect(), r = root.getBoundingClientRect();
                bag.classList.add('sf_mock_bag'); root.append(bag);
                const size = 52;
                Object.assign(bag.style, { width: `${size}px`, height: `${size}px`, right: `${r.right - g.right}px`, top: `${g.bottom - r.top + 8}px` });
                // 스킬: name, icon, time left
                const sk = root.querySelector('.sf_duat_skill'); sk.innerHTML = '<i class="fa-solid fa-bolt"></i>스킬';
            }, MOCK_CSS);
            const stateShot = async (name, g, cd) => {
                await page.evaluate(([g, cd]) => {
                    const ult = document.querySelector('.sf_mock_ult'); ult.style.setProperty('--g', g); ult.classList.toggle('sf_full', g >= 1);
                    const sk = document.querySelector('.sf_duat_skill'); sk.querySelector('s')?.remove(); sk.classList.toggle('sf_cd', !!cd);
                    // the 스킬 really used: the game darkens it round by the time left; the seconds left written over it
                    if (cd) { T.field.skill(); setTimeout(() => sk.insertAdjacentHTML('beforeend', `<s>${cd}</s>`), (6 - cd) * 1000); }
                }, [g, cd]);
                await sleep(cd ? (6 - cd) * 1000 + 300 : 900);
                await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`) });
            };
            await stateShot('1-ult-0', 0, 0);
            await stateShot('2-ult-60-skill-cd', 0.6, 4);
            await stateShot('3-ult-full', 1, 0);
            // touch areas (CSS px): buttons, the pad with its 30 px margin, the tabs, the screen edges
            const rects = await page.evaluate(() => {
                const R = (sel, grow = 0) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { sel, x0: b.left - grow, y0: b.top - grow, x1: b.right + grow, y1: b.bottom + grow }; };
                const game = document.getElementById('sf_game').getBoundingClientRect();
                return { game: { x0: game.left, y0: game.top, x1: game.right, y1: game.bottom }, list: [R('.sf_pad', 30), R('.sf_talk'), R('.sf_mock_ult'), R('.sf_duat_skill'), R('.sf_duat_spell'), R('.sf_mock_bag'), R('.sf_appearance'), R('.sf_tabs'), R('.sf_mini')].filter(Boolean) };
            });
            const names = { '.sf_pad': '조이스틱(+30px)', '.sf_talk': '공격', '.sf_mock_ult': '궁', '.sf_duat_skill': '스킬', '.sf_duat_spell': '주문', '.sf_mock_bag': '가방', '.sf_appearance': '설정', '.sf_tabs': '하단 탭', '.sf_mini': '미니맵' };
            const over = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0;
            const gap = (a, b) => Math.max(Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1), Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1));
            const bad = [], near = [];
            for (let i = 0; i < rects.list.length; i++) for (let j = i + 1; j < rects.list.length; j++) {
                const a = rects.list[i], b = rects.list[j];
                if (over(a, b)) bad.push(`${names[a.sel]}↔${names[b.sel]}`);
                else near.push(`${names[a.sel]}↔${names[b.sel]} ${Math.round(gap(a, b))}px`);
            }
            ok(!bad.length, `${tag} 터치 영역 겹침 없음 ${bad.join(', ')}`);
            const edge = rects.list.filter(r => r.sel !== '.sf_pad' && r.sel !== '.sf_tabs').map(r => [names[r.sel], Math.round(Math.min(r.x0 - rects.game.x0, rects.game.x1 - r.x1, r.y0 - rects.game.y0, rects.game.y1 - r.y1))]);
            ok(edge.every(([, d]) => d >= 4), `${tag} 화면 가장자리에서 4px 이상: ${edge.map(([n, d]) => `${n} ${d}`).join(', ')}`);
            res.push(`  ${tag} 가까운 간격: ${near.filter(s => +s.split(' ').pop().replace('px', '') < 24).join(', ')}`);
            ok(!errors.length, `${tag} 페이지 오류 없음 ${errors.join('; ')}`);
        } finally { await context.close(); }
    }
    await browser.close();
    fs.writeFileSync(path.join(OUT, 'result.txt'), res.join('\n') + '\n');
    console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
    process.exit(fail ? 1 : 0);
})();
