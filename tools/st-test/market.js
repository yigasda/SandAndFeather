// 시장 (0.9.60): the day's draw is kept, deals stay within the discount range, the hour only filters, the 골동품 좌판
// only has what she found herself, quick taps never buy twice, a v8 save upgrades. Prints PASS/FAIL lines.
//   node tools/st-test/market.js
const { open, sleep, T } = require('./common.js');
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 1 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T}\n.`); await sleep(1200);
  const out = await p.evaluate(async base => {
    const I = async v => import(base + 'src/' + v + '.js');
    const [win, st, mk, data, bag, ledger, prog] = await Promise.all(['ui/window', 'core/state', 'packs/life/market', 'core/data', 'core/bag', 'core/ledger', 'core/progress'].map(I));
    await win.openGame();
    const res = []; const ok = (c, m) => res.push(`${c ? 'PASS' : 'FAIL'} ${m}`);
    const s = st.getState(); const M = data.DATA.market;
    s.codex.found = {}; s.market = null; s.bag.deben = 10000; s.part = 'day'; s.wake = null;
    // 1. the same day keeps its draw; the hour only filters
    const a = JSON.stringify(mk.marketToday(s)); s.part = 'night'; const b2 = JSON.stringify(mk.marketToday(s)); s.part = 'dawn';
    ok(a === b2, 'same day, other hour: same draw');
    s.part = 'day'; ok(!mk.shown(s).some(g => g.id === 'eel'), 'no eel shown by day');
    s.part = 'night'; ok(mk.shown(s).some(g => g.id === 'eel') === s.market.stock.includes('eel'), 'eel shown at night when in stock');
    s.part = 'day';
    ok(!s.market.stock.some(id => M.goods.find(g => g.id === id).stall), 'no 골동품 before she found any');
    // 2. many days: discount range, protected goods, nothing twice in a row
    let bad = [], prev = null; const never = M.daily.soldOut.never;
    s.stats.xp = 99999; s.codex.found = { faience_scarab: 1, bronze_mirror: 1, black_sand: 1 };
    const seen = { stall: new Set(), carp: 0, dealsN: [] };
    for (let k = 0; k < 400; k++) {
      s.date.day = (k % 30) + 1; s.date.month = Math.floor(k / 30) % 12; s.date.year = 3 + Math.floor(k / 360);
      const m = mk.marketToday(s);
      if (prev && m.day === prev.day) { bad.push('day not changed'); break; }
      seen.dealsN.push(Object.keys(m.deals).length);
      for (const [id, d] of Object.entries(m.deals)) {
        const g = M.goods.find(x => x.id === id), base0 = mk.basePrice(g), off = base0 - d.price;
        if (off < 1 || off / base0 > 0.25 + 1e-9 || off / base0 < 0.10 - 1e-9 || d.price < 1) bad.push(`deal ${id} ${base0}->${d.price}`);
        if (prev && id in prev.deals) bad.push(`deal twice ${id}`);
      }
      if (m.out && never.includes(m.out)) bad.push(`protected out ${m.out}`);
      if (m.out && prev && m.out === prev.out) bad.push(`out twice ${m.out}`);
      for (const id of m.stock) { const g = M.goods.find(x => x.id === id); if (g.stall) seen.stall.add(id); if (id === 'golden_carp') seen.carp++; }
      if (m.stock.some(id => ['toy_boat', 'croc_tooth', 'ushabti', 'duat_reed'].includes(id))) bad.push('not found but sold');
      prev = JSON.parse(JSON.stringify(m));
    }
    ok(!bad.length, `400 days: deals 10..25 %, protected never out, no repeats ${bad.slice(0, 3).join(' ')}`);
    ok([...seen.stall].every(id => ['faience_scarab', 'bronze_mirror'].includes(id)) && seen.stall.size === 2, `stall only found ones: ${[...seen.stall]}`);
    ok(seen.carp > 40 && seen.carp < 140, `golden carp about 20 % of days: ${seen.carp}/400`);
    ok(Math.min(...seen.dealsN) >= 3 && Math.max(...seen.dealsN) <= 5, `deals per day ${Math.min(...seen.dealsN)}..${Math.max(...seen.dealsN)}`);
    // 3. cheap goods: 2 and 3 deben never get a deal (1 deben off would be over 25 %); 12 deben: 2 or 3 off
    ok(mk.offRange(2) === null && mk.offRange(3) === null && JSON.stringify(mk.offRange(4)) === '[1,1]' && JSON.stringify(mk.offRange(12)) === '[2,3]' && JSON.stringify(mk.offRange(30)) === '[3,7]', 'offRange: real rate 10..25 %, none for 2–3 deben');
    // 4. quick taps: five at once buy one; the stock and deben agree
    s.part = 'night'; s.date.day = 15; s.market = null; let m = mk.marketToday(s);
    if (!m.stock.includes('eel')) { m.stock.push('eel'); m.left.eel = 2; }
    if (m.out === 'eel') m.out = '';
    const d0 = s.bag.deben, n0 = bag.countOf(s, 'eel'), price = mk.priceOf(s, M.goods.find(g => g.id === 'eel'));
    const r = await Promise.all([1, 2, 3, 4, 5].map(() => mk.buy(s, 'eel')));
    ok(r.filter(x => x.ok).length === 1 && s.bag.deben === d0 - price && bag.countOf(s, 'eel') === n0 + 1 && s.market.left.eel === 1, `5 quick taps: ${r.filter(x => x.ok).length} bought, left ${s.market.left.eel}`);
    const r2 = await mk.buy(s, 'eel'), r3 = await mk.buy(s, 'eel');
    ok(r2.ok && !r3.ok && r3.why === 'out' && s.market.left.eel === 0 && bag.countOf(s, 'eel') === n0 + 2, 'stock 2: third one refused');
    s.bag.deben = 1; const r4 = await mk.buy(s, 'cedar_plank'); ok(!r4.ok && r4.why === 'deben' && s.bag.deben === 1, 'not enough deben: nothing changes');
    ok(s.tally.buy >= 2 && s.tally['buy:eel'] >= 2 && s.facts.at(-1).kind === 'buy' && s.facts.at(-1).itemId === 'eel', 'facts and tally recorded');
    // 5. bought ones are not "found"
    const before = 'cedar_plank' in s.codex.found; s.bag.deben = 999; await mk.buy(s, 'cedar_plank');
    ok(!before && !('cedar_plank' in s.codex.found) && 'cedar_plank' in s.codex.items, 'bought: in 도감, not in found');
    // 6. a v8 save upgrades
    const md = SillyTavern.getContext().chatMetadata, key = Object.keys(md).find(k => md[k] === s);
    const old = JSON.parse(JSON.stringify(s)); old.v = 8; delete old.market; delete old.facts; delete old.tally; old.codex = { items: { faience_scarab: 5, honey: 6, nile_perch: 7 }, secrets: {} };
    old.bag.items = [{ uid: 'i1', id: 'toy_boat', from: 'adventure', got: 9 }, { uid: 'i2', id: 'salt', from: 'market', got: 9 }];
    md[key] = old; const up = st.getState();
    ok(up.v === 9 && Array.isArray(up.facts) && up.tally && 'faience_scarab' in up.codex.found && 'nile_perch' in up.codex.found && !('honey' in up.codex.found) && 'toy_boat' in up.codex.found && !('salt' in up.codex.found), 'v8 save → v9, found filled from 도감 and bag');
    return res;
  }, base);
  out.forEach(l => console.log(l));
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
  await b.close();
  process.exit(out.some(l => l.startsWith('FAIL')) ? 1 : 0);
})();
