// 선착장 세부맵 (0.9.70): walking down the Ombos pier takes her to the dock's own map, everything there is reached on
// foot (the fishing place on the deck's front, the way back up), fishing sits on the deck's front edge with the line
// and the bucket, and the stone path at the top goes back to Ombos. Day and night shots, phone sizes 412 / 320.
// Prints PASS/FAIL lines.   node tools/st-test/dock71.js [shots folder]
const { open, sleep, T } = require('./common.js');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp/dock71'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '10:10 오전')}\n.`); await sleep(1200);
  const res = []; const ok = (c, m) => { res.push(`${c ? 'PASS' : 'FAIL'} ${m}`); console.log(res.at(-1)); };
  await p.evaluate(async base => {
    const m = {};
    for (const [k, v] of Object.entries({ win: 'ui/window', st: 'core/state', data: 'core/data', heroes: 'core/heroes', pl: 'world/player', fx: 'world/fx', check: 'core/check', ex: 'core/explore' }))
      m[k] = await import(base + 'src/' + v + '.js');
    window.IT = m;
    await m.win.openGame();
    window.pop = () => [...document.querySelectorAll('#sf_game .sf_pop')].pop();
    window.cardBtn = label => pop() && [...pop().querySelectorAll('button')].find(b => b.textContent.includes(label));
    window.closeAll = () => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click());
    window.S = () => m.st.getState();
  }, base);
  await sleep(1000);
  const E = (fn, arg) => p.evaluate(fn, arg);
  const shot = async name => { await p.screenshot({ path: `${OUT}/${name}.png` }); };
  const hold = async (key, ms) => { await p.keyboard.down(key); await sleep(ms); await p.keyboard.up(key); await sleep(300); };
  const where = () => E(() => ({ map: S().pos.map, x: +(IT.pl.player.x + 0.5).toFixed(2), y: +(IT.pl.player.y + 0.8).toFixed(2) }));

  ok((await E(() => IT.check.checkData())).length === 0, 'checkData 오류 없음');
  // 1. walk down the Ombos pier
  await E(async () => { const s = S(); IT.heroes.setWith(s, 'set'); await IT.win.travel('ombos', { x: 25.0, y: 26.4, dir: 'down' }); });
  await sleep(900);
  await hold('ArrowDown', 1600); await sleep(900);
  const in1 = await where();
  ok(in1.map === 'dock_pier', `옴보스 부두로 내려가면 선착장 세부맵 ${JSON.stringify(in1)}`);
  await shot('arrive');
  // 2. the map's data
  const reach = await E(() => {
    const m = IT.data.DATA.maps.dock_pier;
    return { has: !!m, exits: m.exits.length, spots: m.spots.map(s => s.id) };
  });
  ok(reach.has && reach.exits === 1 && reach.spots.includes('dock'), `세부맵 데이터 ${JSON.stringify(reach)}`);
  // walk to the fishing place: down the steps onto the deck
  await hold('ArrowDown', 2600);
  const deck = await where();
  ok(deck.map === 'dock_pier' && deck.y > 5.6 && deck.y < 7.05 && deck.x > 8 && deck.x < 11, `계단 내려가 부두 앞쪽까지 걸어감 ${JSON.stringify(deck)}`);
  await shot('deck');
  // 3. fishing from the spot
  await p.keyboard.press('e'); await sleep(700);
  const card = await E(() => !!cardBtn('낚시하기'));
  ok(card, '부두 앞에서 말 걸기 → 선착장 카드');
  await E(() => cardBtn('낚시하기').click()); await sleep(700);
  await E(() => { const c = document.querySelector('#sf_game .sf_pop_wrap'); if (c) c.style.opacity = '0.2'; });
  const f = await E(() => ({ act: IT.pl.player.act?.name, line: IT.fx.fxBusy() }));
  ok(f.act === 'fish' && f.line, `부두 끝에 앉아 낚시 ${JSON.stringify(f)}`);
  await shot('fish-day');
  await E(() => { SillyTavern.getContext().chatMetadata.sand_feather.part = 'night'; });
  await sleep(500); await shot('fish-night');
  await E(() => { SillyTavern.getContext().chatMetadata.sand_feather.part = 'day'; });
  // 4. back up the path to Ombos
  await E(() => closeAll()); await sleep(300);
  for (let k = 0; k < 30 && (await where()).map === 'dock_pier'; k++) await hold('ArrowUp', 300);
  await sleep(800);
  const back = await where();
  ok(back.map === 'ombos' && back.y < 28.5, `돌길로 올라가면 옴보스 부두 위 ${JSON.stringify(back)}`);
  ok(await E(() => !IT.fx.fxBusy() && !IT.pl.player.seat), '나오면 줄·양동이·자세 안 남음');
  // 5. it counts as a place seen in Ombos' 탐사
  ok(await E(() => Object.hasOwn(S().explore.seen, 'room:dock_pier')), '탐사 수첩: 선착장 방 본 것으로');
  // phone widths
  await E(async () => { await IT.win.travel('dock_pier', 'path'); }); await sleep(800);
  for (const w of [412, 320]) { await p.setViewportSize({ width: w, height: 860 }); await sleep(700); await shot(`phone-${w}`); }
  ok(errs.length === 0, `콘솔 오류 없음 ${errs.slice(0, 5).join(' | ')}`);
  fs.writeFileSync(`${OUT}/result.txt`, res.join('\n'));
  await b.close();
  process.exit(res.some(r => r.startsWith('FAIL')) ? 1 : 0);
})();
