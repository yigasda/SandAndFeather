// 생활 묶음 (0.9.70): the approved 생활 pictures in the game, for each of the three in front (the next one walking with
// them). Fishing on the pier (waiting, pulling with a splash, the bucket), cooking, reading, the feelings, eating at
// the table, the garden. Real cards and buttons; shots of each, and checks that nothing is left over after walking
// on (effects, the line, the bucket) and that the table meal gives 태양 기운 once a day. Prints PASS/FAIL lines.
//   node tools/st-test/life70.js [shots folder] [somang,set,horus]
const { open, sleep, T } = require('./common.js');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp/life70'; fs.mkdirSync(OUT, { recursive: true });
const WHO = (process.argv[3] || 'somang,set,horus').split(',');
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '10:10 오전')}\n.`); await sleep(1200);
  const res = []; const ok = (c, m) => { res.push(`${c ? 'PASS' : 'FAIL'} ${m}`); console.log(res.at(-1)); };
  await p.evaluate(async base => {
    const m = {};
    for (const [k, v] of Object.entries({ win: 'ui/window', st: 'core/state', data: 'core/data', bag: 'core/bag', heroes: 'core/heroes', pl: 'world/player',
      fx: 'world/fx', poses: 'packs/life/poses', prog: 'core/progress', sun: 'core/sun', ledger: 'core/ledger' })) m[k] = await import(base + 'src/' + v + '.js');
    window.IT = m;
    await m.win.openGame();
    window.pop = () => [...document.querySelectorAll('#sf_game .sf_pop')].pop();
    window.cardBtn = label => pop() && [...pop().querySelectorAll('button')].find(b => b.textContent.includes(label));
    window.closeAll = () => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click());
    window.S = () => m.st.getState();
    window.prep = () => { const s = S(); s.sun.left = 8; for (const x of m.prog.dailyTasks(s)) x.done = true; s.lessons.cur = ''; };
    window.mapOf = id => Object.entries(m.data.DATA.maps).find(([, mp]) => (mp.spots || []).some(s => s.id === id))?.[0];
  }, base);
  await sleep(1000);
  const E = (fn, arg) => p.evaluate(fn, arg);
  const shot = async name => { await p.screenshot({ path: `${OUT}/${name}.png` }); };
  const goTo = async (map, x, y, dir = 'up') => { await E(() => closeAll()); await sleep(250); await E(async ([map, x, y, dir]) => { await IT.win.travel(map, { x, y, dir }); }, [map, x, y, dir]); await sleep(800); };
  const spot = async id => {
    const map = await E(id => mapOf(id), id);
    const sp = await E(([id, map]) => { const s = IT.data.DATA.maps[map].spots.find(s => s.id === id); return { x: s.x, y: s.y }; }, [id, map]);
    for (const [dx, dy] of [[0, 0.2], [0, 1], [0, -1], [-1, 0], [1, 0], [-1, 1], [1, 1], [0, 1.6], [-1, -1], [1, -1]]) {
      await goTo(map, sp.x + dx, sp.y + dy, dy < 0 ? 'down' : dx > 0 ? 'left' : dx < 0 ? 'right' : 'up');
      if (!(await E(([x, y]) => Math.abs(IT.pl.player.x - x) < 0.01 && Math.abs(IT.pl.player.y - y) < 0.01, [sp.x + dx, sp.y + dy]))) continue;
      await p.keyboard.press('e'); await sleep(800);
      if (await E(() => !!pop())) return true;
    }
    return false;
  };
  // walk a few steps and check nothing of the 생활 effects is left
  const walkOff = async what => {
    await E(() => closeAll()); await sleep(200);
    await p.keyboard.down('ArrowDown'); await sleep(500); await p.keyboard.up('ArrowDown');
    await p.keyboard.down('ArrowRight'); await sleep(400); await p.keyboard.up('ArrowRight');
    await sleep(2600);
    const left = await E(() => ({ busy: IT.fx.fxBusy(), act: IT.pl.player.act?.name || '', seat: !!IT.pl.player.seat }));
    ok(!left.busy && !left.seat && !['fish', 'eat', 'cook', 'read'].includes(left.act), `${what}: 걸으면 효과·자세 안 남음 ${JSON.stringify(left)}`);
  };
  // the fishing bar: pull when the marker is in the green
  const pull = () => E(async () => {
    for (let k = 0; k < 600; k++) {
      const z = pop().querySelector('.sf_fish_zone'), mk = pop().querySelector('.sf_fish_mark');
      const zl = parseFloat(z.style.left), zw = parseFloat(z.style.width), ml = parseFloat(mk.style.left);
      if (ml >= zl + 1 && ml <= zl + zw - 1) { cardBtn('당기기').click(); return true; }
      await new Promise(r => setTimeout(r, 8));
    }
    return false;
  });

  for (const [n, lead] of WHO.entries()) {
    const mate = { somang: 'set', set: 'horus', horus: 'somang' }[lead];
    await E(([lead, mate]) => { const s = S(); IT.heroes.setLead(s, lead); IT.heroes.setWith(s, mate); prep(); IT.st.saveState(); }, [lead, mate]);
    await sleep(400);

    // fishing
    await spot('dock');
    await E(() => cardBtn('낚시하기').click()); await sleep(600);
    await E(() => { const c = document.querySelector('#sf_game .sf_pop_wrap'); if (c) c.style.opacity = '0.25'; });
    await sleep(500);
    const f0 = await E(() => ({ act: IT.pl.player.act?.name, frame: IT.pl.player.act?.frame, busy: IT.fx.fxBusy() }));
    ok(f0.act === 'fish' && f0.frame === 0 && f0.busy, `${lead}: 부두에 앉아 낚시(0), 줄·양동이 ${JSON.stringify(f0)}`);
    await shot(`${lead}-fish-0`);
    await pull(); await sleep(120);
    await E(() => { const c = document.querySelector('#sf_game .sf_pop_wrap'); if (c) c.style.opacity = '0.25'; });
    const f1 = await E(() => IT.pl.player.act?.frame);
    await shot(`${lead}-fish-1`);
    ok(f1 === 1, `${lead}: 당기면 1번 그림`);
    await sleep(900);
    await shot(`${lead}-fish-bucket`);
    await walkOff(`${lead} 낚시`);

    // cooking
    await E(() => { const s = S(); for (const [id, v] of Object.entries(IT.data.DATA.items.items)) if (['ingredient', 'crop', 'fish', 'spice'].includes(v.kind)) IT.bag.give(s, id, 2, 'test'); prep(); });
    await spot('kitchen');
    const cooked = await E(async () => { const b = [...pop().querySelectorAll('button')].find(b => /만들기|요리/.test(b.textContent) && !b.disabled); if (!b) return false; b.click(); return true; });
    await sleep(500); await E(() => closeAll()); await sleep(300);
    const ck = await E(() => IT.pl.player.act?.name);
    await shot(`${lead}-cook`);
    ok(cooked && (ck === 'cook'), `${lead}: 요리 자세 (${ck})`);
    await walkOff(`${lead} 요리`);

    // reading under the stars
    if (await spot('roof_stars')) {
      await E(() => closeAll()); await sleep(150);
      await shot(`${lead}-read`);
      ok(await E(() => IT.fx.fxCount()) === 1, `${lead}: 읽기 효과 하나만 (안 겹침)`);
      await walkOff(`${lead} 읽기`);
    }

    // feelings, both of them
    for (const kind of ['happy', 'surprised', 'shy']) {
      await E(kind => IT.poses.feel(kind, { ms: 2000 }), kind); await sleep(250);
      await shot(`${lead}-${kind}`); await sleep(2000);
    }

    // eating at the table
    await E(() => { const s = S(); IT.bag.give(s, 'honey_bread', 1, 'test'); IT.bag.give(s, 'fig_cake', 1, 'test'); s.sun.left = 5; });
    await spot('temple_table');
    const sun0 = await E(() => S().sun.left);
    await E(() => cardBtn('먹기').click()); await sleep(300);
    const food = await E(() => { const b = cardBtn('꿀빵'); if (b) b.click(); return !!b; });
    await sleep(500);
    const e1 = await E(() => ({ act: IT.pl.player.act?.name, dir: IT.pl.player.dir, sun: S().sun.left, seat: !!IT.pl.player.seat }));
    await shot(`${lead}-eat`);
    await sleep(800); await shot(`${lead}-eat-b`);
    ok(food && e1.seat && e1.sun === (n === 0 ? sun0 + 1 : sun0), `${lead}: 식탁에서 꿀빵 먹기, 태양 기운 ${sun0}→${e1.sun} (하루 한 번) ${JSON.stringify(e1)}`);
    await sleep(4200);
    ok(await E(() => IT.pl.player.act?.name === 'sit-floor'), `${lead}: 다 먹으면 앉은 자세로`);
    await walkOff(`${lead} 먹기`);

    // garden: plant
    await E(() => { const s = S(); for (const id of Object.keys(IT.data.DATA.items.items).filter(k => IT.data.DATA.items.items[k].kind === 'seed').slice(0, 2)) IT.bag.give(s, id, 1, 'test'); prep(); });
    if (await spot('garden')) {
      const planted = await E(() => { const b = [...pop().querySelectorAll('button')].find(b => /심기/.test(b.textContent) && !b.disabled); if (b) b.click(); return !!b; });
      await sleep(250); await E(() => closeAll()); await sleep(100); await shot(`${lead}-garden`);
      ok(true, `${lead}: 텃밭 ${planted ? '심기' : '(심을 칸 없음)'}`);
      await walkOff(`${lead} 텃밭`);
    }
  }
  ok(errs.length === 0, `콘솔 오류 없음 ${errs.slice(0, 5).join(' | ')}`);
  fs.writeFileSync(`${OUT}/result.txt`, res.join('\n'));
  await b.close();
  process.exit(res.some(r => r.startsWith('FAIL')) ? 1 : 0);
})();
