const { open, sleep, T } = require('./common.js');
const SP = process.argv[2], WHO = process.argv[3] || 'set'; require('fs').mkdirSync(SP + '/spr', { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click()));
  await p.evaluate(async ([base, who]) => { const H = await import(base + 'src/core/heroes.js'); const s = (await import(base + 'src/core/state.js')).getState(); H.setLead(s, who); H.setWith(s, ''); }, [base, WHO]);
  const cases = [['up', 28, 19.2], ['left', 29.3, 18.1], ['right', 26.7, 18.1]];
  for (const [name, x, y] of cases) {
    await p.evaluate(async ([base, x, y]) => { const w = await import(base + 'src/ui/window.js'); await w.travel('ombos', { x, y, dir: 'down' }); }, [base, x, y]);
    await sleep(700);
    await p.keyboard.press('e');
    const shots = [];
    for (const ms of [60, 200]) {
      await sleep(ms === 60 ? 60 : 140);
      const st = await p.evaluate(async base => { const pl = (await import(base + 'src/world/player.js')).player; return { look: pl.look, dir: pl.dir, act: pl.act?.name, card: !!document.querySelector('#sf_game .sf_pop') }; }, base);
      await p.screenshot({ path: `${SP}/spr/act_${WHO}_${name}_${ms}.png`, clip: { x: 106, y: 300, width: 200, height: 220 } });
      shots.push(st);
    }
    await sleep(400);
    const card = await p.evaluate(() => document.querySelector('#sf_game .sf_pop .sf_pop_head')?.textContent?.trim().slice(0, 20));
    console.log(name, JSON.stringify(shots), 'card:', card);
    await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click())); await sleep(300);
  }
  console.log('ERR', errs.slice(0, 6)); await b.close();
})();
