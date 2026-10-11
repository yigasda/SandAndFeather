const { open, sleep, T } = require('./common.js');
const SP = process.argv[2]; require('fs').mkdirSync(SP + '/spr', { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click()));
  const st = () => p.evaluate(async base => { const s = (await import(base + 'src/core/state.js')).getState(); return JSON.stringify({ party: s.party, stats: s.stats, chars: s.chars }); }, base);
  await p.locator('#sf_game .sf_tab[data-tab="party"]').click(); await sleep(800);
  await p.locator('#sf_game [data-lead="set"]').click(); await sleep(700);
  console.log('set solo:', await st());
  await p.screenshot({ path: `${SP}/spr/solo_card.png` });
  await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click())); await sleep(300);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.travel('ombos', { x: 28, y: 19.2, dir: 'up' }); }, base); await sleep(600);
  await p.screenshot({ path: `${SP}/spr/solo_set.png` });
  await p.keyboard.press('e'); await sleep(700);
  console.log('kitchen as Set:', await p.evaluate(() => document.querySelector('#sf_game .sf_pop')?.innerText.replace(/\s+/g, ' ').slice(0, 50)));
  await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click())); await sleep(300);
  // Horus leads with Somang behind
  await p.evaluate(async base => { const H = await import(base + 'src/core/heroes.js'); const s = (await import(base + 'src/core/state.js')).getState(); H.setLead(s, 'horus'); H.setWith(s, 'somang'); }, base);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.travel('ombos', { x: 25, y: 22, dir: 'down' }); }, base); await sleep(600);
  await p.keyboard.down('ArrowRight'); await sleep(900); await p.keyboard.up('ArrowRight'); await sleep(300);
  await p.screenshot({ path: `${SP}/spr/solo_horus.png` });
  console.log('horus+somang:', await st());
  // Duat card companion list as Horus
  await p.evaluate(async base => { const s = (await import(base + 'src/core/state.js')).getState(); s.part = 'night'; }, base);
  const duat = await p.evaluate(async base => { const s = (await import(base + 'src/core/state.js')).getState(); const m = await import(base + 'src/ui/window.js'); return null; }, base);
  await p.locator('#sf_game .sf_tab[data-tab="party"]').click(); await sleep(800);
  await p.screenshot({ path: `${SP}/spr/solo_card2.png` });
  await p.locator('#sf_game [data-detail="horus"]').click(); await sleep(800);
  await p.screenshot({ path: `${SP}/spr/solo_detail.png` });
  console.log('ERR', errs.slice(0, 6)); await b.close();
})();
