// 쉬기와 잠, 줍기: sit at the dining table, stand up, sleep in Set's bed (a new game day), pick something up
const { open, sleep, T } = require('./common.js');
const SP = process.argv[2]; require('fs').mkdirSync(SP + '/spr', { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  const close = () => p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click()));
  await close(); await sleep(300);
  const st = () => p.evaluate(async base => { const s = (await import(base + 'src/core/state.js')).getState(); const pl = (await import(base + 'src/world/player.js')).player; const R = await import(base + 'src/core/rest.js'); const L = await import(base + 'src/core/ledger.js');
    return { sun: s.sun.left, today: L.today(s), gday: s.ledger.gday, part: s.part, partNow: R.partNow(s), act: pl.act?.name, dir: pl.dir, x: +pl.x.toFixed(2), y: +pl.y.toFixed(2), seat: !!pl.seat, pos: s.pos, summary: s.summary }; }, base);
  const card = () => p.evaluate(() => [...document.querySelectorAll('#sf_game .sf_pop')].pop()?.innerText.replace(/\s+/g, ' ').slice(0, 160));
  const shot = (n, clip = { x: 6, y: 200, width: 400, height: 420 }) => p.screenshot({ path: `${SP}/spr/rest_${n}.png`, clip });
  await p.evaluate(async base => { const s = (await import(base + 'src/core/state.js')).getState(); s.sun.left = 3; }, base);
  // sit
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.travel('temple_dining', { x: 15.2, y: 6.4, dir: 'up' }); }, base); await sleep(800);
  await p.keyboard.press('e'); await sleep(700);
  console.log('table card:', await card());
  await p.locator('#sf_game .sf_pop button', { hasText: '앉아 쉬기' }).click(); await sleep(700);
  console.log('sat:', JSON.stringify(await st()));
  await shot('sit');
  await p.keyboard.down('ArrowDown'); await sleep(300); await p.keyboard.up('ArrowDown'); await sleep(300);
  console.log('stood:', JSON.stringify(await st()));
  for (let k = 0; k < 2; k++) { await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.travel('temple_dining', { x: 15.2, y: 6.4, dir: 'up' }); }, base); await sleep(500); await p.keyboard.press('e'); await sleep(600); await p.locator('#sf_game .sf_pop button', { hasText: '앉아 쉬기' }).click(); await sleep(500); await p.keyboard.press('e'); await sleep(300); }
  console.log('after 3 sits:', JSON.stringify(await st()));
  // bed: not tired, then tired
  await p.evaluate(async base => { const s = (await import(base + 'src/core/state.js')).getState(); s.sun.left = 12; }, base);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.travel('set_room', { x: 17.6, y: 6.6, dir: 'up' }); }, base); await sleep(800);
  await p.keyboard.press('e'); await sleep(700);
  console.log('bed full:', await card());
  await close(); await sleep(300);
  await p.evaluate(async base => { const s = (await import(base + 'src/core/state.js')).getState(); s.sun.left = 4; }, base);
  await p.keyboard.press('e'); await sleep(700);
  console.log('bed tired:', await card());
  await p.locator('#sf_game .sf_pop button', { hasText: '잠자기' }).click(); await sleep(700);
  await shot('sleep');
  console.log('lying:', JSON.stringify(await st()));
  await sleep(1600);
  console.log('after sleep:', JSON.stringify(await st()), '| card:', await card());
  await shot('morning', { x: 0, y: 0, width: 412, height: 900 });
  await close(); await sleep(300); await close(); await sleep(300);
  // pickup: a test thing on the ground beside her
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.travel('ombos', { x: 25, y: 22, dir: 'down' }); }, base); await sleep(600);
  await p.evaluate(async base => { const T = await import(base + 'src/world/things.js'); T.addThings(m => m === 'ombos' ? [{ id: 't1', x: 25, y: 23.2, label: '반짝이는 것', sprite: 'sparkle', pose: 'pickup', act: ui => ui.showCard({ title: '주웠다', text: '시험' }) }] : []); }, base);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.travel('ombos', { x: 25, y: 22, dir: 'down' }); }, base); await sleep(600);
  await p.keyboard.press('e'); await sleep(250);
  console.log('pickup:', JSON.stringify(await st()));
  await shot('pickup');
  await sleep(700); console.log('pickup card:', await card());
  console.log('ERR', errs.slice(0, 6)); await b.close();
})();
