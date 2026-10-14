// 시장 새 아이템 53종 (0.9.61): every one of the 100 items is valid and the 53 each have a real use; the rules R1–R6
// work through the real cards (buttons pressed in the game): 부엌 대체 재료와 새 요리, 텃밭 새 씨앗, 제단 향·바치기,
// 필사실 필기구, 두아트 향유·등잔·아마포, 축제 대신 내기와 빗, 앉아 쉬기 부채, 모험 "음식 하나", 시장 진열, 세이브 v9 → v10.
// Prints PASS/FAIL lines.
//   node tools/st-test/items53.js
const { open, sleep, T } = require('./common.js');
const NEW = ['kyphi', 'frankincense', 'myrrh', 'lotus_oil', 'lily_oil', 'kohl', 'cumin', 'coriander', 'garlic', 'leek', 'lentils',
  'chickpeas', 'sesame', 'cucumber', 'watermelon', 'pomegranate', 'linen', 'oil_lamp', 'clay_bowl', 'reed_pen', 'blank_papyrus',
  'faience_beads', 'carnelian_ring', 'copper_bangle', 'doum_fruit', 'carob', 'grapes', 'milk', 'cheese', 'beer_jar', 'wine_jar',
  'garlic_seed', 'cucumber_seed', 'watermelon_seed', 'grape_vine', 'fine_linen', 'reed_mat', 'papyrus_sandals', 'scribe_palette',
  'wooden_comb', 'palm_fan', 'lapis_beads', 'gold_ornament', 'bes_amulet', 'taweret_amulet', 'senet_board', 'lotus_vase',
  'small_chest', 'lentil_soup', 'sesame_bread', 'pomegranate_sweets', 'cucumber_salad', 'watermelon_punch'];
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 1 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  const res = []; const ok = (c, m) => { res.push(`${c ? 'PASS' : 'FAIL'} ${m}`); console.log(res.at(-1)); };
  await p.evaluate(async ([base, NEW]) => {
    const m = {};
    for (const [k, v] of Object.entries({ win: 'ui/window', st: 'core/state', data: 'core/data', bag: 'core/bag', check: 'core/check', ledger: 'core/ledger',
      kitchen: 'packs/life/kitchen', market: 'packs/life/market', fest: 'packs/life/festival', duat: 'packs/duat/duat', engine: 'packs/adventure/engine',
      things: 'world/things', codex: 'ui/codexcard', sun: 'core/sun', prog: 'core/progress' })) m[k] = await import(base + 'src/' + v + '.js');
    window.IT = m; window.NEW = NEW;
    await m.win.openGame();
    // a clean bag for each test: only what is put in
    window.setBag = (ids, deben = 100) => { const s = m.st.getState(); s.bag.items = []; s.bag.deben = deben; for (const id of ids) m.bag.give(s, id, 1, 'dock'); s.sun.left = 12;
      for (const x of m.prog.dailyTasks(s)) x.done = true; s.lessons.cur = ''; };   // no commission or lesson reward mixes into the numbers
    window.n = id => m.bag.countOf(m.st.getState(), id);
    window.pop = () => [...document.querySelectorAll('#sf_game .sf_pop')].pop();
    window.rowBtn = (name, label) => { const r = [...pop().querySelectorAll('.sf_list_row')].find(r => r.querySelector('b').textContent.includes(name)); return r && [...r.querySelectorAll('button')].find(b => b.textContent.includes(label)); };
    window.cardBtn = label => [...pop().querySelectorAll('button')].find(b => b.textContent.includes(label));
    window.closeAll = () => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click());
  }, [base, NEW]);
  await sleep(1200);
  const E = (fn, arg) => p.evaluate(fn, arg);
  const spot = async (id, map = 'ombos') => {
    await E(() => closeAll()); await sleep(250);
    await E(async ([id, map]) => { const D = IT.data.DATA; const sp = D.maps[map].spots.find(s => s.id === id); await IT.win.travel(map, { x: sp.x, y: sp.y + 0.2, dir: 'up' }); }, [id, map]);
    await sleep(700); await p.keyboard.press('e'); await sleep(700);
    if (!(await E(() => !!pop()))) {   // a spot drawn on something solid: from the tile below
      await E(async ([id, map]) => { const sp = IT.data.DATA.maps[map].spots.find(s => s.id === id); await IT.win.travel(map, { x: sp.x, y: sp.y + 1, dir: 'up' }); }, [id, map]);
      await sleep(700); await p.keyboard.press('e'); await sleep(700);
    }
  };
  const click = async (fn, arg) => { const did = await E(fn, arg); await sleep(500); return did; };

  // 1. data: 100 items, checkData clean, the old 47 as they were, each new one used somewhere
  const d1 = await E(() => {
    const D = IT.data.DATA, items = D.items.items;
    const errors = IT.check.checkData();
    const used = id => {
      const i = items[id], why = [];
      for (const r of D.recipes.recipes) { if (r.id === id) why.push('요리'); if (r.needs.some(n => n.id === id || (n.any || []).includes(id))) why.push('재료'); }
      if (i.grow) why.push('씨앗');
      if (Object.values(items).some(x => x.grow?.gives === id)) why.push('수확');
      if (i.food && ['food', 'ingredient'].includes(i.kind)) why.push('날로/두아트');
      if (i.duat) why.push('두아트');
      if (i.offer) why.push('제단');
      if (i.study) why.push('필사실');
      if (i.rest) why.push('쉬기');
      if (i.festival) why.push('축제의 밤');
      for (const f of D.festivals.festivals) for (const pr of f.preps) for (const o of [pr.need, ...(pr.or || [])]) { if (o.items?.[id]) why.push('축제'); if (o.kind?.[i.kind]) why.push('축제 갈래'); }
      if (['jewelry', 'decor', 'incense', 'cosmetic'].includes(i.kind)) why.push('도감');
      if (D.market.goods.some(g => g.id === id)) why.push('시장');
      return [...new Set(why)];
    };
    const unused = NEW.filter(id => used(id).filter(w => w !== '시장').length === 0);
    const notSold = NEW.filter(id => !D.market.goods.some(g => g.id === id));
    return { n: Object.keys(items).length, errors, unused, notSold, missing: NEW.filter(id => !items[id]), uses: Object.fromEntries(NEW.map(id => [id, used(id)])) };
  });
  ok(d1.n === 100 && !d1.missing.length, `items.json 100종 (${d1.n}), 신규 53 모두 있음`);
  ok(!d1.errors.length, `checkData 오류 없음 ${d1.errors.slice(0, 3).join(' | ')}`);
  ok(!d1.unused.length, `신규 53종 모두 쓰임이 있음 ${d1.unused.join(',')}`);
  ok(!d1.notSold.length, `신규 53종 모두 시장 진열에 있음 ${d1.notSold.join(',')}`);
  require('fs').writeFileSync(process.env.USES_OUT || '/dev/null', JSON.stringify(d1.uses, null, 1));

  // 2. 부엌: 대체 재료 (R1), one of each need, never both; the 5 new dishes
  await E(() => setBag(['tilapia', 'cumin']));
  await spot('kitchen');
  await click(() => rowBtn('구운 생선', '만들기').click());
  ok(await E(() => n('grilled_fish') === 1 && n('tilapia') === 0 && n('cumin') === 0 && IT.st.getState().sun.left === 11), '구운 생선: 소금 대신 쿠민 (물고기·쿠민만 씀, 기운 1)');
  await E(() => setBag(['tilapia', 'salt', 'cumin']));
  await spot('kitchen');
  await click(() => rowBtn('구운 생선', '만들기').click());
  ok(await E(() => n('grilled_fish') === 1 && n('salt') === 0 && n('cumin') === 1), '소금과 쿠민이 다 있으면 소금만 씀 (두 번 안 뺌)');
  await E(() => setBag(['lentils', 'leek']));
  await spot('kitchen');
  await click(() => rowBtn('보리죽', '만들기').click());
  ok(await E(() => n('barley_porridge') === 1 && n('lentils') === 0 && n('leek') === 0), '보리죽: 보리 대신 렌틸, 양파 대신 리크');
  const dishes = [['렌틸 수프', 'lentil_soup', ['lentils', 'garlic']], ['참깨빵', 'sesame_bread', ['barley', 'sesame']], ['석류 과자', 'pomegranate_sweets', ['pomegranate', 'doum_fruit']],
    ['오이 냉채', 'cucumber_salad', ['cucumber', 'cheese']], ['수박 화채', 'watermelon_punch', ['watermelon', 'grapes']]];
  for (const [ko, id, need] of dishes) {
    await E(need => setBag(need), need);
    await spot('kitchen');
    await click(ko => rowBtn(ko, '만들기').click(), ko);
    const r = await E(([id, need]) => ({ made: n(id), left: need.map(n).reduce((a, b) => a + b, 0), food: IT.bag.itemInfo(id).food }), [id, need]);
    ok(r.made === 1 && r.left === 0 && (r.food.heal || 0) > 0, `${ko}: ${need.join('+')} → 1개, 재료 다 씀, 회복 ${r.food.heal} 공포 −${r.food.fear || 0}`);
  }
  await E(() => setBag(['tilapia', 'salt']));
  await spot('kitchen');
  await click(() => { const b = rowBtn('구운 생선', '만들기'); b.click(); b.click(); b.click(); });
  ok(await E(() => n('grilled_fish') === 1 && IT.st.getState().sun.left === 11), '만들기 세 번 빠르게 눌러도 한 번');

  // 3. 텃밭: 새 씨앗이 고르는 카드에 다 나오고, 자라는 날이 지나야 거둠, 두 번 눌러도 한 번
  await E(() => { setBag(['garlic_seed', 'cucumber_seed', 'watermelon_seed', 'grape_vine', 'lotus_seed']); const s = IT.st.getState(); s.garden.plots = s.garden.plots.map(() => null); });
  await spot('garden');
  await click(() => rowBtn('1번 칸', '심기').click());
  const seedRows = await E(() => [...pop().querySelectorAll('.sf_list_row b')].map(b => b.textContent));
  ok(seedRows.length === 5, `심을 씨앗 5종이 다 나옴 (${seedRows.join(', ')})`);
  await click(() => rowBtn('포도 묘목', '심기').click());
  const t0 = await E(() => { const s = IT.st.getState(); return { plot: s.garden.plots[0], t: IT.ledger.today(s), vine: n('grape_vine') }; });
  ok(t0.plot?.seed === 'grape_vine' && t0.vine === 0, '포도 묘목을 1번 칸에 심음');
  await E(t => { IT.st.getState().ledger.gday = t + 3; }, t0.t);
  await spot('garden');
  ok(await E(() => !rowBtn('1번 칸', '수확') && pop().innerText.includes('1일 뒤에 포도')), '3일째: 아직 1일 남음');
  await E(t => { IT.st.getState().ledger.gday = t + 4; }, t0.t);
  await spot('garden');
  await click(() => { const b = rowBtn('1번 칸', '수확'); b.click(); b.click(); });
  ok(await E(() => n('grapes') === 3 && IT.st.getState().garden.plots[0] === null), '4일째 수확: 포도 3개, 두 번 눌러도 3개');

  // 4. 제단 (R2): 향 피우고 돕기 (기운 1), 장신구 바치기 하루 한 번
  await E(() => { setBag(['kyphi', 'copper_bangle', 'copper_bangle', 'gold_ornament']); const s = IT.st.getState(); window.f0 = { ...s.stats }; });
  await spot('altar', 'temple_sanctuary');
  await click(() => cardBtn('향 피우고 돕기').click());
  await click(() => rowBtn('키피 향', '피우기').click());
  ok(await E(() => { const s = IT.st.getState(); return n('kyphi') === 0 && s.sun.left === 11 && s.stats.faith === f0.faith + 1 && s.stats.xp >= f0.xp + 4; }), '키피 향: 기운 1로 신전 일 돕기, 신앙 +1, 경험치 +4, 향은 탐');
  await spot('altar', 'temple_sanctuary');
  await click(() => cardBtn('장신구 바치기').click());
  await click(() => { const b = rowBtn('구리 팔찌', '바치기'); b.click(); b.click(); });
  ok(await E(() => { const s = IT.st.getState(); return n('copper_bangle') === 1 && s.stats.faith === f0.faith + 2; }), '구리 팔찌 바치기: 신앙 +1, 두 번 눌러도 하나');
  await spot('altar', 'temple_sanctuary');
  ok(await E(() => cardBtn('오늘은 바쳤어')?.disabled === true), '같은 날 다시 바치기는 막힘');
  await E(t => { IT.st.getState().ledger.gday = t + 5; }, t0.t);
  await spot('altar', 'temple_sanctuary');
  await click(() => cardBtn('장신구 바치기').click());
  await click(() => rowBtn('황금 장식', '바치기').click());
  ok(await E(() => IT.st.getState().stats.faith === f0.faith + 4 && n('gold_ornament') === 0), '다음 날 황금 장식: 신앙 +2');

  // 5. 필사실 (R6): 빈 파피루스 한 장 → 기운 1, 갈대 붓·팔레트는 경험치 +3, 안 닳음
  await E(() => { setBag(['blank_papyrus', 'reed_pen', 'scribe_palette']); window.f1 = { ...IT.st.getState().stats }; });
  await spot('scriptorium');
  await click(() => cardBtn('빈 파피루스에 공부').click());
  ok(await E(() => { const s = IT.st.getState(); return s.sun.left === 11 && s.stats.wisdom === f1.wisdom + 1 && s.stats.xp === f1.xp + 5 && n('blank_papyrus') === 0 && n('reed_pen') === 1 && n('scribe_palette') === 1; }), '빈 파피루스 공부: 기운 1, 지혜 +1, 경험치 2+3, 붓·팔레트 남음');
  await spot('scriptorium');
  ok(await E(() => !cardBtn('빈 파피루스에 공부')), '파피루스를 다 쓰면 그 버튼이 없음');
  await click(() => cardBtn('공부하기').click());
  ok(await E(() => { const s = IT.st.getState(); return s.sun.left === 9 && s.stats.xp === f1.xp + 10; }), '보통 공부: 기운 2, 필기구 경험치 +3');

  // 6. 두아트 (R3·R4): 챙길 것에 향유·등잔·날로 먹는 것, 등잔은 들어갈 때 씀, 향유는 바르기, 남은 건 같은 uid로 돌아옴
  await E(() => { setBag(['lotus_oil', 'oil_lamp', 'cucumber', 'blue_lotus', 'kohl', 'linen']); const s = IT.st.getState(); s.part = 'night'; s.wake = null; delete s.ledger.acts.duat; s.duat = null; window.u0 = Object.fromEntries(s.bag.items.map(x => [x.id, x.uid])); });
  await spot('duat');
  await click(() => cardBtn('기존 원정').click());
  const packRows = await E(() => [...pop().querySelectorAll('.sf_list_row b')].map(b => b.textContent));
  ok(['연꽃 향유', '기름 등잔', '오이', '콜 눈화장', '아마포'].every(x => packRows.includes(x)) && !packRows.includes('푸른 연꽃'), `챙길 수 있는 것: ${packRows.filter(x => !['소망', '세트', '호루스'].includes(x)).join(', ')} (푸른 연꽃은 예전처럼 빠짐)`);
  await click(() => rowBtn('연꽃 향유', '챙기기').click());
  await click(() => rowBtn('기름 등잔', '챙기기').click());
  await click(() => cardBtn('내려가기').click());
  const r6 = await E(() => { const r = IT.st.getState().duat; return { light: r.light, pack: r.pack.map(x => x.id + ':' + x.uid), lamp: n('oil_lamp'), oil: n('lotus_oil') }; });
  ok(r6.light === 1 && r6.pack.length === 1 && r6.pack[0] === 'lotus_oil:' + (await E(() => u0.lotus_oil)) && r6.lamp === 0 && r6.oil === 0, `등잔은 들어가며 씀(light 1), 향유는 같은 uid로 챙김 ${r6.pack}`);
  await E(() => { const r = IT.st.getState().duat; r.doors = ['fight', 'fight']; });
  await spot('duat');
  await click(() => [...pop().querySelectorAll('button')].find(b => /왼쪽/.test(b.textContent)).click());
  ok(await E(() => { const r = IT.st.getState().duat; return r.fear === 0 && r.light === 0 && r.phase === 'fight'; }), '등잔 덕에 첫 갈림길은 공포가 안 오름');
  await E(() => { IT.st.getState().duat.fear = 5; });
  await spot('duat');
  await click(() => cardBtn('연꽃 향유 바르기').click());
  ok(await E(() => { const r = IT.st.getState().duat; return r.fear === 3 && r.pack.length === 0; }), '연꽃 향유 바르기: 공포 5 → 3, 다시 못 씀');
  await E(() => { const r = IT.st.getState().duat; r.phase = 'path'; r.fight = null; });
  await spot('duat');
  await click(() => cardBtn('여기서 올라가기').click());
  ok(await E(() => n('lotus_oil') === 0 && n('oil_lamp') === 0), '쓴 향유·등잔은 돌아오지 않음');
  await E(() => { const s = IT.st.getState(); s.duat = null; delete s.ledger.acts.duat; s.sun.left = 12; });
  await spot('duat');
  await click(() => cardBtn('기존 원정').click());
  await click(() => rowBtn('아마포', '챙기기').click());
  await click(() => rowBtn('오이', '챙기기').click());
  await click(() => cardBtn('내려가기').click());
  await click(() => cardBtn('여기서 올라가기').click());
  ok(await E(() => { const s = IT.st.getState(); const l = s.bag.items.find(x => x.id === 'linen'), c = s.bag.items.find(x => x.id === 'cucumber'); return l?.uid === u0.linen && c?.uid === u0.cucumber && l.from === 'dock'; }), '안 쓴 아마포·오이는 같은 uid·출처로 가방에 돌아옴');
  await E(() => { closeAll(); const s = IT.st.getState(); s.duat = null; s.part = 'day'; });

  // 7. 모험 "음식 하나" (R3): 요리 먼저, 없으면 날로 먹는 것 중 싼 것, 푸른 연꽃은 아님
  const b7 = await E(() => { const s = IT.st.getState(); setBag(['blue_lotus', 'watermelon', 'cucumber']); const a = IT.engine.foodToBring(s)?.id; IT.bag.give(s, 'grilled_fish', 1, 'kitchen'); const c = IT.engine.foodToBring(s)?.id; setBag(['blue_lotus']); return [a, c, IT.engine.foodToBring(s)?.id || '']; });
  ok(b7[0] === 'cucumber' && b7[1] === 'grilled_fish' && b7[2] === '', `음식 하나: 날것 중 싼 오이 / 요리 있으면 요리 / 연꽃만은 없음 (${b7})`);

  // 8. 축제 (R5): 그릇+음식 하나, 장신구(싼 것), 아마포로 대신, 빗은 축제의 밤 경험치
  const fest = async () => { await E(() => closeAll()); await sleep(200); await E(() => { const x = IT.things.thingsOn('ombos').find(t => t.id === 'festival'); x.act(IT.win.gameUi()); }); await sleep(700); };
  await E(() => { const s = IT.st.getState(); s.date = { year: 4, month: 1, day: 12 }; s.ledger.gday = -1; s.fest = {}; s.part = 'day'; setBag(['clay_bowl', 'grilled_fish', 'copper_bangle', 'carnelian_ring', 'linen', 'wooden_comb'], 5); });
  await fest();
  const fb = await E(() => ({ feast: [...rowBtn('잔치 음식', '').parentElement.querySelectorAll('button')].map(b => b.textContent + (b.disabled ? '(x)' : '')), offer: [...rowBtn('신전 제물', '').parentElement.querySelectorAll('button')].map(b => b.textContent) }));
  ok(fb.feast.join() === '도기 그릇으로' && fb.offer.join() === '구리 팔찌로', `대신 내기 버튼: 잔치 [${fb.feast}] 제물 [${fb.offer}]`);
  await click(() => rowBtn('잔치 음식', '도기 그릇으로').click());
  await fest();
  await click(() => { const b = rowBtn('신전 제물', '구리 팔찌로'); b.click(); b.click(); });
  await fest();
  await click(() => rowBtn('연꽃과 등불', '아마포로').click());
  const f8 = await E(() => { const s = IT.st.getState(); const k = Object.keys(s.fest)[0]; return { preps: s.fest[k]?.preps, bag: s.bag.items.map(x => x.id).sort(), deben: s.bag.deben, sun: s.sun.left }; });
  ok(JSON.stringify(f8.preps) === '["feast","offer","decor"]' && f8.bag.join() === 'carnelian_ring,wooden_comb' && f8.deben === 5 && f8.sun === 9, `준비 셋: 그릇+구운 생선, 구리 팔찌(홍옥수 남음), 아마포 · 데벤 그대로 ${f8.bag}`);
  await E(() => { const s = IT.st.getState(); s.date = { year: 4, month: 1, day: 15 }; s.part = 'night'; window.x8 = s.stats.xp; });
  await fest();
  await click(() => cardBtn('축제에 가기').click());
  const n8 = await E(() => ({ xp: IT.st.getState().stats.xp - x8, text: pop().innerText }));
  ok(n8.xp === 10 + 2 && n8.text.includes('나무 빗으로 단장'), `축제의 밤 준비 3: 경험치 10 + 빗 2 = ${n8.xp}`);
  await E(() => { closeAll(); const s = IT.st.getState(); s.part = 'day'; });

  // 9. 앉아 쉬기: 부채가 있으면 기운 +2 (가득 넘지 않음)
  await E(() => { setBag(['palm_fan']); const s = IT.st.getState(); s.sun.left = 5; for (const k of Object.keys(s.ledger.acts)) if (k.startsWith('rest:sit')) delete s.ledger.acts[k]; });
  await E(async () => { closeAll(); await IT.win.travel('temple_dining', { x: 15.2, y: 6.4, dir: 'up' }); }); await sleep(600);
  await p.keyboard.press('e'); await sleep(600);
  await click(() => cardBtn('앉아 쉬기').click());
  ok(await E(() => IT.st.getState().sun.left === 7 && n('palm_fan') === 1), '부채 들고 앉아 쉬기: 기운 5 → 7, 부채 남음');
  await p.keyboard.press('ArrowDown'); await sleep(400);

  // 10. 시장: 300일 동안 53종이 다 들어오는 날이 있음, 장신구는 절반쯤의 날에 1~2종, 업데이트 날 새 상품이 오늘 진열에 더해짐
  const m10 = await E(() => {
    const s = IT.st.getState(), M = IT.data.DATA.market; s.stats.xp = 99999; s.codex.found = {};
    const seen = new Set(), jd = []; let bad = '';
    for (let k = 0; k < 300; k++) {
      s.date = { year: 5 + Math.floor(k / 360), month: Math.floor(k / 30) % 12, day: (k % 30) + 1 }; s.ledger.gday = -1;
      const m = IT.market.marketToday(s); m.stock.forEach(id => seen.add(id));
      const j = m.stock.filter(id => M.goods.find(g => g.id === id).pool === 'jewelry'); jd.push(j.length);
      for (const [id, d] of Object.entries(m.deals)) { const base = IT.market.basePrice(M.goods.find(g => g.id === id)); if ((base - d.price) / base > 0.25 + 1e-9 || (base - d.price) / base < 0.1 - 1e-9) bad = id; }
    }
    // the 0.9.60 day: only the old 34 drawn; opening it now adds the new goods by the same rules, nothing old changes
    s.date = { year: 9, month: 1, day: 1 }; s.ledger.gday = -1;
    const t = IT.ledger.today(s), old = M.goods.slice(0, 34).map(g => g.id);
    s.market = { day: t, stock: old.slice(0, 20), deals: { onion: { pct: 33, price: 2 } }, out: 'bread', left: {}, ids: old };
    const after = IT.market.marketToday(s);
    return { missing: window.NEW.filter(id => !seen.has(id)), days: jd.filter(x => x > 0).length, max: Math.max(...jd), bad,
      topUp: after.stock.slice(0, 20).join() === old.slice(0, 20).join() && after.stock.length > 20 && after.out === 'bread' && after.deals.onion?.price === 2 && after.ids.length === 87 && after.stock.slice(20).every(id => !old.includes(id)) };
  });
  ok(!m10.missing.length, `300일 동안 신규 53종 모두 진열된 날이 있음 ${m10.missing.join(',')}`);
  ok(m10.days > 110 && m10.days < 190 && m10.max <= 2, `장신구 묶음: 300일 중 ${m10.days}일, 하루 최대 ${m10.max}종`);
  ok(!m10.bad, '특가는 10~25 %');
  ok(m10.topUp, '업데이트한 날: 그날 진열·특가·품절은 그대로, 새 상품만 더해짐');
  const sell = await E(async () => {
    const s = IT.st.getState(); setBag(['gold_ornament'], 0); s.part = 'day';
    return IT.bag.itemInfo('gold_ornament').price;
  });
  await spot('market');
  await click(() => cardBtn('팔기로').click());
  await click(() => rowBtn('황금 장식', '팔기').click());
  ok(await E(() => IT.st.getState().bag.deben === 22 && n('gold_ornament') === 0) && sell === 45, '황금 장식(45) 팔기: 22 데벤');
  await E(() => { setBag([], 1000); const s = IT.st.getState(); s.market = null; s.date = { year: 9, month: 2, day: 2 }; s.ledger.gday = -1; });
  const buys = await E(async () => {
    const s = IT.st.getState(), sh = IT.market.shown(s).find(g => g.id === 'lotus_oil');
    if (!sh) return 'skip';
    // This case tests purchase locking and the two-item stock limit, not the random daily sold-out draw.
    if (s.market.out === 'lotus_oil') s.market.out = '';
    const price = IT.market.priceOf(s, sh), d0 = s.bag.deben;
    const r = await Promise.all([1, 2, 3, 4].map(() => IT.market.buy(s, 'lotus_oil')));
    const r2 = await IT.market.buy(s, 'lotus_oil'), r3 = await IT.market.buy(s, 'lotus_oil');
    return r.filter(x => x.ok).length === 1 && r2.ok && !r3.ok && n('lotus_oil') === 2 && s.bag.deben === d0 - price * 2 && s.market.left.lotus_oil === 0 ? 'ok' : JSON.stringify([r, r2, r3, s.bag.deben, d0, price]);
  });
  ok(buys === 'ok' || buys === 'skip', `연꽃 향유(하루 2개): 빠른 네 번에 하나, 두 개 다음은 품절 ${buys}`);

  // 11. 가방·도감: 향신료는 재료 탭, 도감에 향·화장품·장신구·진귀품
  await E(() => { setBag(['cumin', 'lapis_beads', 'senet_board', 'kyphi']); const s = IT.st.getState(); for (const id of ['cumin', 'lapis_beads', 'senet_board', 'kyphi']) s.codex.items[id] = 1; closeAll(); });
  await sleep(300);
  await p.locator('#sf_game .sf_bag').click(); await sleep(800);
  await p.locator('#sf_game .sf_inventory_tabs button', { hasText: '재료' }).click(); await sleep(300);
  const tab = await E(() => [...pop().querySelectorAll('.sf_inventory_slot_name')].map(x => x.textContent));
  ok(tab.join() === '쿠민', `재료 탭: ${tab}`);
  await E(() => { closeAll(); IT.codex.codexCard(IT.win.gameUi()); }); await sleep(600);
  const cx = await E(() => pop().innerText);
  ok(/향·화장품 \d+\/6/.test(cx) && /장신구 \d+\/7/.test(cx) && /진귀품 \d+\/3/.test(cx), `도감 새 줄: ${cx.match(/(향·화장품|장신구|진귀품) \d+\/\d+/g)}`);
  await E(() => closeAll());

  // 12. 세이브 v9 → v10: 그날 이미 정한 0.9.60 시장에 ids가 생김(새 상품은 그날 더해짐), 가방·uid·데벤 그대로
  const sv = await E(() => {
    const md = SillyTavern.getContext().chatMetadata, s = md.sand_feather;
    const old = JSON.parse(JSON.stringify(s)); old.v = 9; old.market = { day: IT.ledger.today(s), stock: ['bread'], deals: {}, out: '', left: {} };
    md.sand_feather = old;
    const s2 = IT.st.getState();
    // 0.9.63 added v11 (인연과 유대) after v10, so an old v9 save now goes on past 10
    return s2.v >= 10 && s2.market.ids?.length === 34 && s2.bag.items.map(x => x.uid).join() === old.bag.items.map(x => x.uid).join() && s2.bag.deben === old.bag.deben;
  });
  ok(sv, '세이브 v9 → v10: 시장 ids 채움, 가방 uid·데벤 그대로');

  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
  await b.close();
  process.exit(res.some(r => r.startsWith('FAIL')) || errs.length ? 1 : 0);
})();
