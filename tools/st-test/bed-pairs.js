// every way to sleep in a bed: 6 pairs (lead + companion) and 3 alone, through the real bed card ("잠자기").
//   node tools/st-test/bed-pairs.js <out folder> [room] [x,y to stand: next to the bed spot]
//   defaults: set_room 17.6,6.6 (Set's bed). Horus's bed: horus_room 6.0,7.7
// Saves pair_<lead>_<with>.png (whole phone screen, dpr 2), prints where each lies and checks both get up.
// Then make a sheet: python3 tools/art/fix/combo-sheet.py <out folder> x0,y0,x1,y1 <sheet.png>
// (box in screenshot px around the bed: Set's bed 342,690,632,850, Horus's bed 140,680,440,900; the camera follows
//  where you stand, so look at one screenshot first if you change x,y)
const { open, sleep, T } = require('./common.js');
const SP = process.argv[2], ROOM = process.argv[3] || 'set_room';
const [SX, SY] = (process.argv[4] || '17.6,6.6').split(',').map(Number);
require('fs').mkdirSync(SP, { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  const close = () => p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click()));
  await close(); await sleep(300);
  for (const [lead, w] of [['somang', 'set'], ['somang', 'horus'], ['set', 'somang'], ['horus', 'somang'], ['set', 'horus'], ['horus', 'set'], ['somang', ''], ['set', ''], ['horus', '']]) {
    await p.evaluate(async ([base, lead, w, room, x, y]) => { const s = (await import(base + 'src/core/state.js')).getState(); s.party = { ...(s.party || {}), lead, with: w }; s.sun.left = 3; const W = await import(base + 'src/ui/window.js'); await W.travel(room, { x, y, dir: 'up' }); }, [base, lead, w, ROOM, SX, SY]); await sleep(900);
    await p.keyboard.press('e'); await sleep(700);
    await p.locator('#sf_game .sf_pop button', { hasText: '잠자기' }).click(); await sleep(400);
    await p.screenshot({ path: `${SP}/pair_${lead}_${w}.png` });
    console.log(lead, w, JSON.stringify(await p.evaluate(async base => { const pl = (await import(base + 'src/world/player.js')).player; return { act: pl.act?.name, dir: pl.dir, mate: pl.mate && { dir: pl.mate.dir, name: pl.mate.name } }; }, base)));
    await sleep(1600); await close(); await sleep(300); await close(); await sleep(300);
    await p.keyboard.down('ArrowDown'); await sleep(300); await p.keyboard.up('ArrowDown'); await sleep(300);
    console.log('  after getting up mate:', await p.evaluate(async base => (await import(base + 'src/world/player.js')).player.mate, base));
  }
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
  await b.close();
})();
