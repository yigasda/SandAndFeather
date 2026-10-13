// 기록 놀이 (0.9.68): 낚시 최고 기록, 업적·칭호, 지역 탐사율, 보물지도와 보물 발견. Real cards and buttons where a player
// would press them (낚시 당기기, 받기, 칭호, 탐사 수첩, 해독, 사암벽, 보물 조사), the rules straight where the path is long
// (the sun clue from an adventure). Old saves (v11 → v12), rewards given once (double clicks, again, after a reload),
// and every 탐사 place reachable on foot. Prints PASS/FAIL lines.
//   node tools/st-test/records68.js [shots folder]
const { open, sleep, T } = require('./common.js');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp/records68'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 1 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '06:10 오후')}\n.`); await sleep(1200);
  const res = []; const ok = (c, m) => { res.push(`${c ? 'PASS' : 'FAIL'} ${m}`); console.log(res.at(-1)); };
  await p.evaluate(async base => {
    const m = {};
    for (const [k, v] of Object.entries({ win: 'ui/window', st: 'core/state', data: 'core/data', bag: 'core/bag', check: 'core/check', fish: 'core/fishing',
      ach: 'core/achieve', ex: 'core/explore', tr: 'core/treasure', trp: 'packs/world/treasure', things: 'world/things', map: 'world/map', pl: 'world/player', prog: 'core/progress', tabs: 'ui/tabs' })) m[k] = await import(base + 'src/' + v + '.js');
    window.IT = m;
    await m.win.openGame();
    window.pop = () => [...document.querySelectorAll('#sf_game .sf_pop')].pop();
    window.rowBtn = (name, label) => { const r = [...pop().querySelectorAll('.sf_list_row')].find(r => r.querySelector('b').textContent.includes(name)); return r && [...r.querySelectorAll('button')].find(b => b.textContent.includes(label)); };
    window.cardBtn = label => [...pop().querySelectorAll('button')].find(b => b.textContent.includes(label));
    window.closeAll = () => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click());
    window.S = () => m.st.getState();
    window.prep = () => { const s = S(); s.sun.left = 12; for (const x of m.prog.dailyTasks(s)) x.done = true; s.lessons.cur = ''; };
  }, base);
  await sleep(1000);
  const E = (fn, arg) => p.evaluate(fn, arg);
  const goTo = async (map, x, y, dir = 'up') => { await E(() => closeAll()); await sleep(250); await E(async ([map, x, y, dir]) => { await IT.win.travel(map, { x, y, dir }); }, [map, x, y, dir]); await sleep(800); };
  // stand where she can (not blocked) right by (x, y)
  const standBy = async (map, x, y) => {
    for (const [dx, dy] of [[0, 1], [0, 0.4], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [0, 1.5]]) {
      await goTo(map, x + dx, y + dy, dy < 0 ? 'down' : dx > 0 ? 'left' : dx < 0 ? 'right' : 'up');
      if (await E(([x, y]) => Math.abs(IT.pl.player.x - x) < 0.01 && Math.abs(IT.pl.player.y - y) < 0.01, [x + dx, y + dy])) return true;
    }
    return false;
  };
  // stand on the nearest free place by a spot (as a player would walk up to it) and press 말 걸기
  const spot = async (id, map = 'ombos') => {
    const sp = await E(([id, map]) => { const s = IT.data.DATA.maps[map].spots.find(s => s.id === id); return { x: s.x, y: s.y }; }, [id, map]);
    for (const [dx, dy] of [[0, 0.2], [0, 1], [0, -1], [-1, 0], [1, 0], [-1, 1], [1, 1], [0, 1.6], [-1, -1], [1, -1]]) {
      await goTo(map, sp.x + dx, sp.y + dy, dy < 0 ? 'down' : dx > 0 ? 'left' : dx < 0 ? 'right' : 'up');
      if (!(await E(([x, y]) => Math.abs(IT.pl.player.x - x) < 0.01 && Math.abs(IT.pl.player.y - y) < 0.01, [sp.x + dx, sp.y + dy]))) continue; // blocked there: she was put on the spawn
      await p.keyboard.press('e'); await sleep(800);
      if (await E(() => !!pop())) return;
    }
  };
  // one cast: pull when the marker is in the green (hit) or outside it (miss)
  const pull = hit => E(async hit => {
    for (let k = 0; k < 600; k++) {
      const z = pop().querySelector('.sf_fish_zone'), mk = pop().querySelector('.sf_fish_mark');
      const zl = parseFloat(z.style.left), zw = parseFloat(z.style.width), ml = parseFloat(mk.style.left);
      const inside = ml >= zl + 1 && ml <= zl + zw - 1, outside = ml < zl - 4 || ml > zl + zw + 4;
      if (hit ? inside : outside) { cardBtn('당기기').click(); return true; }
      await new Promise(r => setTimeout(r, 8));
    }
    return false;
  }, hit);

  // 0. data
  ok((await E(() => IT.check.checkData())).length === 0, 'checkData: records.json 포함 오류 없음');

  // 1. an old v11 save → v12: bag, uids, deben kept; secrets and woken obelisks found before count for 탐사율
  const mig = await E(() => {
    const md = SillyTavern.getContext().chatMetadata, s = md.sand_feather;
    IT.bag.give(s, 'tilapia', 1, 'dock'); IT.bag.give(s, 'map_scrap', 1, 'adventure');
    const old = JSON.parse(JSON.stringify(s)); old.v = 11; for (const k of ['fishing', 'achieve', 'explore', 'treasure']) delete old[k];
    old.bag.deben = 77; old.codex.secrets = { night_mural: -1, sand_trace: 3 }; old.flags['obelisk:ob_north'] = true; old.flags.garden_hint = true;
    md.sand_feather = old;
    const s2 = IT.st.getState();
    const st = IT.ex.regionStatus(s2, 'ombos');
    return { v: s2.v, deben: s2.bag.deben, uids: s2.bag.items.map(x => x.uid).join() === old.bag.items.map(x => x.uid).join(), f: !!(s2.fishing.records && s2.achieve.claimed && s2.explore.seen && s2.treasure.clues),
      counted: st.points.filter(p => p.seen).map(p => p.key).sort().join(), started: IT.tr.started(s2) };
  });
  ok(mig.v === 12 && mig.deben === 77 && mig.uids && mig.f, `세이브 v11 → v12: 데벤·가방 uid 그대로, 새 기록 칸 생김 (${JSON.stringify({ v: mig.v, deben: mig.deben })})`);
  ok(mig.counted.includes('secret:night_mural') && mig.counted.includes('secret:sand_trace') && mig.counted.includes('obelisk:ob_north'), `예전에 찾은 비밀·깨운 오벨리스크가 탐사율에 들어감: ${mig.counted}`);
  ok(mig.started, '예전에 해독한 지도 조각(garden_hint)이 보물지도 첫 단서로 인정됨');
  // back to a clean game for the rest
  await E(() => { const md = SillyTavern.getContext().chatMetadata, s = md.sand_feather; delete s.flags.garden_hint; delete s.flags['obelisk:ob_north']; s.codex.secrets = {};
    s.fishing = { records: {} }; s.achieve = { claimed: {}, worn: {} }; s.explore = { seen: {}, claimed: {} }; s.treasure = { clues: {}, found: -1, got: null }; s.tally = {}; s.facts = [];
    s.bag.items = []; s.bag.deben = 100; prep(); });

  // 2. 낚시: real casts. Hits give a length once, misses give nothing; 기록 keeps after the fish is gone
  await spot('dock');
  if (!(await E(() => !!pop()))) { await p.screenshot({ path: `${OUT}/debug-dock.png` }); console.log('DEBUG', await E(() => JSON.stringify({ pos: S().pos, cards: document.querySelectorAll('#sf_game .sf_pop').length }))); }
  ok(await E(() => !!cardBtn('낚시 기록')), '선착장 카드에 「낚시 기록」 버튼');
  await E(() => cardBtn('낚시하기').click()); await sleep(500);
  for (const hit of [true, false, true]) { await pull(hit); await sleep(350); }
  const f1 = await E(() => {
    const s = S(), fish = s.bag.items.filter(x => IT.fish.isRecordFish(x.id));
    const sz = IT.fish.fishSizes();
    return { msg: pop().querySelector('.sf_fish_msg').textContent, n: fish.length, cms: fish.map(x => [x.id, x.cm, sz[x.id].min <= x.cm && x.cm <= sz[x.id].max]),
      count: Object.values(s.fishing.records).reduce((a, r) => a + r.count, 0), tally: s.tally.catch || 0, jar: s.bag.items.filter(x => x.id === 'sealed_jar').map(x => x.cm || 0) };
  });
  ok(f1.cms.every(c => c[1] > 0 && c[2]) && f1.count === f1.n && f1.tally === f1.n, `낚은 물고기마다 길이 한 번(범위 안), 기록 마릿수 = 낚은 수: ${JSON.stringify(f1.cms)} count ${f1.count} tally ${f1.tally}`);
  ok(f1.jar.every(c => !c), '물고기가 아닌 것(봉인된 항아리)은 길이·기록 없음');
  ok(/\d+cm/.test(f1.msg) || f1.n === 0, `결과 문구에 길이: ${f1.msg.split('\n')[0]}`);
  await E(() => closeAll()); await sleep(300);
  // all misses: nothing recorded
  await E(() => prep()); await spot('dock'); await E(() => cardBtn('낚시하기').click()); await sleep(500);
  const before = await E(() => S().tally.catch || 0);
  for (let k = 0; k < 3; k++) { await pull(false); await sleep(300); }
  ok(await E(b => (S().tally.catch || 0) === b && Object.values(S().fishing.records).reduce((a, r) => a + r.count, 0) === b, before), '세 번 다 놓치면 기록 없음');
  await E(() => closeAll()); await sleep(300);
  // the same fish again, then sold: the record stays
  const f2 = await E(() => {
    const s = S(); let it = s.bag.items.find(x => IT.fish.isRecordFish(x.id));
    if (!it) { const [uid] = IT.bag.give(s, 'nile_perch', 1, 'dock'); IT.fish.noteCatch(s, 'nile_perch', uid); it = s.bag.items.find(x => x.uid === uid); }
    const rec = JSON.stringify(s.fishing.records), again = IT.fish.noteCatch(s, it.id, it.uid);
    IT.bag.takeUid(s, it.uid);
    return { again, same: JSON.stringify(s.fishing.records) === rec, id: it.id, cm: it.cm, best: s.fishing.records[it.id].best };
  });
  ok(f2.again === null && f2.same && f2.best >= f2.cm, `같은 물고기에 다시 길이 안 붙음, 팔아도(가방에서 빠져도) 기록 그대로: ${f2.id} ${f2.cm}cm best ${f2.best}`);
  // a big one for 월척, then the 기록 card
  await E(() => { const s = S(); const [uid] = IT.bag.give(s, 'nile_perch', 1, 'dock'); const r = Math.random; Math.random = () => 0.99; IT.fish.noteCatch(s, 'nile_perch', uid); Math.random = r; });
  await spot('dock'); await E(() => cardBtn('낚시 기록').click()); await sleep(600);
  const rc = await E(() => [...pop().querySelectorAll('.sf_list_row b')].map(b => b.textContent));
  ok(rc.length === 5 && rc.some(t => /최고 \d+cm/.test(t)) && rc.some(t => t === '???'), `낚시 기록 카드: 5종, 잡은 건 최고 길이, 못 잡은 건 ??? (${rc.join(' / ')})`);
  await p.screenshot({ path: `${OUT}/fish-records.png` });
  await E(() => closeAll()); await sleep(300);

  // 3. 업적: reached from what is kept; 받기 once (double click), a title worn under the name in 일행
  await E(() => { closeAll(); IT.tabs.questsCard(IT.win.gameUi()); }); await sleep(400);
  await E(() => cardBtn('업적').click()); await sleep(500);
  const d0 = await E(() => S().bag.deben);
  await E(() => { const b = rowBtn('첫 낚시', '받기'); b.click(); b.click(); }); await sleep(700);
  const a1 = await E(d0 => ({ deben: S().bag.deben - d0, claimed: S().achieve.claimed.first_catch, again: IT.ach.claim(S(), 'first_catch'), btn: !!rowBtn('첫 낚시', '받기') }), d0);
  ok(a1.deben === 10 && a1.claimed >= 0 && a1.again === null && !a1.btn, `첫 낚시 받기 두 번 눌러도 데벤 +10 한 번, 다시 받기 없음 (${a1.deben})`);
  ok(await E(() => IT.ach.reached(S(), IT.ach.achievement('big_fish'))), '월척(80cm 넘는 물고기) 업적이 낚시 기록에서 바로 이뤄짐');
  ok(await E(() => IT.ach.wear(S(), 'set', 'secrets_five') === false && !S().achieve.worn.set), '못 이룬 업적의 칭호는 못 닮');
  const statsBefore = await E(() => JSON.stringify([S().stats, S().chars]));
  await E(() => { const r = [...pop().querySelectorAll('.sf_list_row')].find(r => r.querySelector('b').textContent.startsWith('소망')); [...r.querySelectorAll('button')].find(b => b.textContent === '초보 낚시꾼').click(); }); await sleep(600);
  await E(() => { const r = [...pop().querySelectorAll('.sf_list_row')].find(r => r.querySelector('b').textContent.startsWith('세트')); [...r.querySelectorAll('button')].find(b => b.textContent === '월척 낚시꾼').click(); }); await sleep(600);
  await p.screenshot({ path: `${OUT}/achievements.png` });
  await E(() => { closeAll(); IT.tabs.partyCard(IT.win.gameUi()); }); await sleep(500);
  const pt = await E(() => [...pop().querySelectorAll('.sf_party_heroes .sf_list_row')].map(r => [r.querySelector('b').textContent, r.querySelector('.sf_party_title')?.textContent || '', r.querySelector('.sf_party_title')?.previousElementSibling?.className || '']));
  ok(pt[0][1] === '「초보 낚시꾼」' && pt[1][1] === '「월척 낚시꾼」' && pt[2][1] === '' && pt[0][2].includes('sf_party_name'), `일행 카드 이름 바로 아래 칭호: ${JSON.stringify(pt.map(x => x.slice(0, 2)))}`);
  ok(await E(s => JSON.stringify([S().stats, S().chars]) === s, statsBefore), '칭호를 달아도 능력치·인물 기록 그대로');
  await p.screenshot({ path: `${OUT}/party-titles.png` });
  await E(() => closeAll()); await sleep(300);

  // 4. 탐사율: every place reachable on foot; first visit only; 25 / 50 once; 100 → 업적·칭호; 강 건너 hidden until there
  const reach = await E(() => {
    const bad = [];
    for (const r of IT.ex.REGIONS()) for (const mapId of r.maps || []) {
      const map = IT.map.getMap(mapId), W = map.w, H = map.h, sp = map.d.spawn || { x: 1, y: 1 };
      const seen = new Set(), q = [[Math.floor(sp.x), Math.floor(sp.y)]];
      const free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !map.solidAt(x + 0.5, y + 0.5);
      while (q.length) { const [x, y] = q.pop(), k = `${x},${y}`; if (seen.has(k) || !free(x, y)) continue; seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
      const rad = IT.ex.EXPLORATION().radius;
      for (const pnt of IT.ex.pointsOf(r)) if (pnt.kind === 'place' && pnt.map === mapId) {
        const okk = [...seen].some(k => { const [x, y] = k.split(',').map(Number); return (pnt.x + 0.5 - (x + 0.5)) ** 2 + (pnt.y + 0.5 - (y + 0.8)) ** 2 <= rad * rad; });
        if (!okk) bad.push(pnt.key);
      }
    }
    return bad;
  });
  ok(reach.length === 0, `탐사 장소가 모두 걸어서 닿는 곳 (못 닿는 곳: ${reach.join(', ') || '없음'})`);
  await goTo('ombos', 25, 29); await sleep(600);
  const e1 = await E(() => { const s = S(); return { seen: Object.keys(s.explore.seen).filter(k => k.startsWith('ombos:')), again: IT.ex.noteWhere(s, 'ombos', 25.5, 29.8) }; });
  ok(e1.seen.includes('ombos:dock') && e1.again.length === 0, `선착장 근처를 걸으면 그 장소가 처음 한 번만 기록: ${e1.seen.join(', ')}`);
  await goTo('temple_kitchen', 9, 7); await sleep(600);
  ok(await E(() => Object.hasOwn(S().explore.seen, 'room:temple_kitchen')), '안채 방(부엌)에 들어가면 방 하나 기록');
  const e2 = await E(async () => {
    const s = S(), d0 = s.bag.deben, early = IT.ex.claimStep(s, 'ruins', 25);
    for (const pnt of IT.ex.pointsOf(IT.ex.regionInfo('ombos'))) if (pnt.kind === 'place') s.explore.seen[pnt.key] = 1;
    return { early, pct: IT.ex.regionPct(s, 'ombos'), d0, open: IT.ex.regionOpen(s, IT.ex.regionInfo('ruins')) };
  });
  ok(e2.early === null && !e2.open, '아직 못 간 강 건너는 보상 없음, 탐사 수첩에도 숨김');
  // 지도 → 탐사 수첩 → 받기 (double click) for 25 and 50
  await E(() => closeAll()); await sleep(200);
  await p.locator('#sf_game .sf_tab[data-tab="map"]').click(); await sleep(700);
  await E(() => [...pop().querySelectorAll('button')].find(b => b.textContent === '탐사 수첩').click()); await sleep(600);
  const ruinsHidden = await E(() => pop().innerText.includes('강 건너 무너진 신전 · 아직 가 본 적 없어') && !pop().innerText.includes('강 건너 무너진 신전 · 0%'));
  ok(ruinsHidden, '탐사 수첩: 강 건너는 「아직 가 본 적 없어」만');
  await E(() => { const b = rowBtn('탐사 25% 보상', '받기'); b.click(); b.click(); }); await sleep(700);
  await E(() => { const b = rowBtn('탐사 50% 보상', '받기'); b.click(); b.click(); }); await sleep(700);
  const e3 = await E(d0 => ({ got: S().bag.deben - d0, again: [IT.ex.claimStep(S(), 'ombos', 25), IT.ex.claimStep(S(), 'ombos', 50)] }), e2.d0);
  ok(e3.got === 10 + 25 && e3.again.every(x => x === null), `옴보스 25·50% 보상 한 번씩, 두 번 눌러도 (데벤 +${e3.got})`);
  await p.screenshot({ path: `${OUT}/explore.png` });
  const e4 = await E(() => {
    const s = S(); for (const sec of IT.data.DATA.maps.ombos.secrets) s.codex.secrets[sec.id] = 1; for (const o of IT.data.DATA.maps.ombos.obelisks) s.flags[`obelisk:${o.id}`] = true;
    return { pct: IT.ex.regionPct(s, 'ombos'), ach: IT.ach.reached(s, IT.ach.achievement('explore_ombos')), wear: IT.ach.wear(s, 'horus', 'explore_ombos') };
  });
  ok(e4.pct === 100 && e4.ach && e4.wear, '옴보스 100% → 「옴보스 탐사 완료」 업적, 칭호 「옴보스의 길잡이」를 달 수 있음');
  await E(() => closeAll()); await sleep(300);

  // 5. 보물지도: nothing before the scrap is read; read it at the 필사실 (real), river (real cast), stone (real, in the fallen temple), sun
  await E(() => { const s = S(); delete s.flags.garden_hint; s.treasure = { clues: {}, found: -1, got: null }; s.bag.items = s.bag.items.filter(x => x.id !== 'map_scrap'); });
  ok(await E(() => IT.tr.clueFound(S(), 'river') === null && !IT.things.thingsOn('ruins').some(t => t.id.startsWith('treasure:'))), '지도 조각을 읽기 전에는 단서도 반짝이도 없음');
  await E(() => { const s = S(); IT.bag.give(s, 'map_scrap', 1, 'adventure'); s.stats.wisdom = 3; prep(); });
  await spot('scriptorium'); await E(() => rowBtn('지도 조각', '해독').click()); await sleep(700);
  ok(await E(() => IT.tr.started(S())), '필사실에서 지도 조각 해독 → 보물지도 시작');
  await E(() => closeAll()); await sleep(300);
  await E(() => prep()); await spot('dock'); await E(() => cardBtn('낚시하기').click()); await sleep(500);
  for (let k = 0; k < 3; k++) { await pull(true); await sleep(300); }
  const r1 = await E(() => ({ msg: pop().querySelector('.sf_fish_msg').textContent, clue: S().treasure.clues.river }));
  ok(r1.clue >= 0 && (r1.msg.match(/보물지도 단서/g) || []).length === 1, `낚시 성공에서 「강줄기」 단서 한 번 (문구 ${(r1.msg.match(/보물지도 단서/g) || []).length}번)`);
  await E(() => closeAll()); await sleep(300);
  const stone = await E(() => { const s = S(); s.works.boat = { done: true }; s.stats.xp = 60; const a = IT.data.DATA.maps.ruins.anchors.find(a => a.id === IT.tr.TREASURE().stoneAnchor); return a; });
  await standBy('ruins', stone.x, stone.y); await p.keyboard.press('e'); await sleep(900);
  const r2 = await E(() => ({ title: pop()?.querySelector('.sf_pop_title')?.textContent || '', clue: S().treasure.clues.stone, gone: !IT.things.thingsOn('ruins').some(t => t.id === 'treasure:stone') }));
  ok(r2.clue >= 0 && r2.title.includes('사암벽') && r2.gone, `무너진 신전 사암벽 조사 → 「사암벽」 단서, 표시는 사라짐 (${r2.title})`);
  await E(() => closeAll()); await sleep(300);
  const r3 = await E(() => { const s = S(); const a = IT.tr.clueFound(s, 'sun'), b = IT.tr.clueFound(s, 'sun'); return { a: !!a, b, ready: IT.tr.ready(s), j: s.journal.filter(e => e.kind === 'treasure').length }; });
  ok(r3.a && r3.b === null && r3.ready && r3.j === 3, `「태양 그림자」 단서 한 번, 네 단서 모두 → 반짝이 (일지 단서 ${r3.j}개)`);
  // the relic: the first rare one not in the 도감 (heart scarab known → 카 조각상)
  const t0 = await E(() => { const s = S(); s.codex.items.heart_scarab = 1; prep(); return { deben: s.bag.deben, xp: s.stats.xp, ka: IT.bag.countOf(s, 'ka_statue'), gold: IT.bag.countOf(s, 'gold_ornament') }; });
  const dig = await E(() => IT.data.DATA.maps.ruins.anchors.find(a => a.id === IT.tr.TREASURE().anchor));
  await standBy('ruins', dig.x, dig.y); await sleep(300);
  await p.keyboard.press('e'); await sleep(120); await p.keyboard.press('e'); await sleep(900);
  await p.screenshot({ path: `${OUT}/treasure-0.9s.png` });
  await sleep(700); await p.screenshot({ path: `${OUT}/treasure-1.6s.png` });
  await sleep(2600); await p.screenshot({ path: `${OUT}/treasure-end.png` });
  const t1 = await E(t0 => { const s = S(); return { kind: pop()?.closest('[data-kind]')?.dataset.kind, deben: s.bag.deben - t0.deben, xp: s.stats.xp - t0.xp, ka: IT.bag.countOf(s, 'ka_statue') - t0.ka, gold: IT.bag.countOf(s, 'gold_ornament') - t0.gold,
    found: s.treasure.found, ach: IT.ach.reached(s, IT.ach.achievement('treasure')), j: s.journal.filter(e => e.kind === 'treasure').length, gone: !IT.things.thingsOn('ruins').some(t => t.id === 'treasure:dig'),
    rows: [...pop().querySelectorAll('.sf_treasure_rewards li')].map(li => li.textContent), name: pop().querySelector('.sf_treasure_name')?.textContent, cards: document.querySelectorAll('#sf_game [data-kind="treasure"]').length }; }, t0);
  ok(t1.kind === 'treasure' && t1.cards === 1, `보물 발견 전용 카드 하나 (e 두 번 눌러도 ${t1.cards}장)`);
  ok(t1.ka === 1 && t1.gold === 1 && t1.deben === 120 && t1.name === '카 조각상', `보상: 도감에 없던 유물 ${t1.name} 1, 황금 장식 1, 데벤 +${t1.deben}`);
  ok(t1.found >= 0 && t1.ach && t1.j === 4 && t1.gone, '찾은 날 기록, 「숨겨진 길의 발견자」 업적, 일지에 보물 발견, 반짝이 사라짐');
  ok(t1.rows.length === 3 && /데벤 120/.test(t1.rows[0]) && /황금 장식/.test(t1.rows[1]) && /숨겨진 길의 발견자/.test(t1.rows[2]), `카드 아래 보상 차례: ${t1.rows.join(' / ')}`);
  const t2 = await E(() => { const md = SillyTavern.getContext().chatMetadata; md.sand_feather = JSON.parse(JSON.stringify(md.sand_feather)); const s = IT.st.getState(); return { again: IT.tr.digTreasure(s), found: s.treasure.found, clue: IT.tr.clueFound(s, 'river'), wear: IT.ach.wear(s, 'somang', 'treasure'), title: IT.ach.titleOf(s, 'somang') }; });
  ok(t2.again === null && t2.found >= 0 && t2.clue === null && t2.wear && t2.title === '숨겨진 길의 발견자', '저장 다시 읽어도 보물은 한 번뿐, 칭호 「숨겨진 길의 발견자」');
  await E(() => closeAll()); await sleep(300);
  await p.locator('#sf_game .sf_tab[data-tab="map"]').click(); await sleep(700);
  await E(() => [...pop().querySelectorAll('button')].find(b => b.textContent === '탐사 수첩').click()); await sleep(600);
  ok(await E(() => pop().innerText.includes('카 조각상') && pop().innerText.includes('신전 뒤 모래에서 찾았어')), '탐사 수첩에 보물 발견 기록');
  await p.screenshot({ path: `${OUT}/explore-treasure.png` });
  // every rare relic known → two star shards instead
  ok(await E(() => { const s = JSON.parse(JSON.stringify(S())); for (const id of IT.tr.TREASURE().relics) s.codex.items[id] = 1; const r = IT.tr.treasureRelic(s); return r.star_shard === 2 && Object.keys(r).length === 1; }), '희귀 유물 다섯을 다 알면 대신 별 조각 2');

  ok(errs.length === 0, `오류 없음 ${errs.slice(0, 3).join(' | ')}`);
  console.log(`\n${res.filter(x => x.startsWith('PASS')).length} PASS, ${res.filter(x => x.startsWith('FAIL')).length} FAIL`);
  await b.close();
})();
