// every seat with each of the three in front, through the real seat card ("앉아 쉬기"): where they sit, which picture.
//   node tools/st-test/seats.js <out folder> [seat names, comma separated]
// Saves seat_<name>_<who>.png (whole phone screen, dpr 2) and prints the pose each got. Then make a sheet with
//   python3 tools/art/fix/seat-sheet.py <out folder> <sheet.png>
const { open, sleep, T } = require('./common.js');
const SP = process.argv[2]; require('fs').mkdirSync(SP, { recursive: true });
// [name, room, where to stand (feet), facing]
const SEATS = [
  ['dining', 'temple_dining', [15.6, 7.0], 'up'],          // the table's one spot is at its right end: the right cushion
  ['set_table_l', 'set_room', [9.6, 6.8], 'up'],
  ['set_table_r', 'set_room', [10.9, 6.8], 'up'],
  ['set_desk', 'set_room', [4.15, 6.0], 'up'],
  ['horus_desk', 'horus_room', [18.3, 7.4], 'up'],
  ['somang_mirror', 'somang_room', [3.2, 5.3], 'up'],
  ['somang_chair', 'somang_room', [4.0, 6.8], 'left'],
];
const ONLY = process.argv[3] ? process.argv[3].split(',') : null;
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  const close = () => p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click()));
  await close(); await sleep(300);
  for (const [name, room, [x, y], dir] of SEATS) {
    if (ONLY && !ONLY.includes(name)) continue;
    for (const who of ['somang', 'set', 'horus']) {
      await sleep(300);
      await p.evaluate(async ([base, who, room, x, y, dir]) => { const s = (await import(base + 'src/core/state.js')).getState(); s.party = { ...(s.party || {}), lead: who, with: '' }; s.sun.left = 3; const W = await import(base + 'src/ui/window.js'); await W.travel(room, { x: x - 0.5, y: y - 0.8, dir }); }, [base, who, room, x, y, dir]); await sleep(900);
      await p.keyboard.press('e'); await sleep(700);
      const title = await p.evaluate(() => [...document.querySelectorAll('#sf_game .sf_pop')].pop()?.innerText.split('\n').slice(0, 2).join(' / '));
      const btn = p.locator('#sf_game .sf_pop button', { hasText: '앉아 쉬기' });
      if (!(await btn.count())) { console.log(name, who, 'NO SEAT CARD:', title); await close(); continue; }
      await btn.click(); await sleep(900);
      await p.screenshot({ path: `${SP}/seat_${name}_${who}.png` });
      const r = await p.evaluate(async base => { const pl = (await import(base + 'src/world/player.js')).player; return { act: pl.act?.name, dir: pl.dir, x: +pl.x.toFixed(2), y: +pl.y.toFixed(2), seat: !!pl.seat }; }, base);
      console.log(name, who, JSON.stringify(r), '|', title);
      await close(); await sleep(200);
      await p.keyboard.down('ArrowDown'); await sleep(300); await p.keyboard.up('ArrowDown'); await sleep(200);
    }
  }
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
  await b.close();
})();
