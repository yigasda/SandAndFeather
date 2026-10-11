// 게임 하루: sleep with something done (하루 결산 shows), then the chat reaching that night does not count it again
const { open, sleep, T } = require('./common.js');
const SP = process.argv[2];
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 1 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click()));
  const st = () => p.evaluate(async base => { const s = (await import(base + 'src/core/state.js')).getState(); const L = await import(base + 'src/core/ledger.js'); const R = await import(base + 'src/core/rest.js');
    return { chatDay: s.date.day, today: L.today(s), gday: s.ledger.gday, lastDay: s.ledger.lastDay, sun: s.sun.left, part: s.part, partNow: R.partNow(s), days: s.days.length, daily: s.daily.day }; }, base);
  console.log('start', JSON.stringify(await st()));
  await p.evaluate(async base => { const { emit } = await import(base + 'src/core/bus.js'); const s = (await import(base + 'src/core/state.js')).getState(); s.sun.left = 2; emit('act:done', { kind: 'fish' }); }, base);
  const r = await p.evaluate(async base => { const R = await import(base + 'src/core/rest.js'); const s = (await import(base + 'src/core/state.js')).getState(); return R.sleepNow(s); }, base); await sleep(900);
  console.log('slept', r, JSON.stringify(await st()), '| card:', await p.evaluate(() => [...document.querySelectorAll('#sf_game .sf_pop')].pop()?.innerText.replace(/\s+/g, ' ').slice(0, 80)));
  await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click()));
  const again = await p.evaluate(async base => { const R = await import(base + 'src/core/rest.js'); const s = (await import(base + 'src/core/state.js')).getState(); return R.sleepNow(s); }, base);
  console.log('sleep again (sun full):', again);
  // the chat moves to the next day: the night was slept already
  await slash(`/sendas name=Seraphina ${T.replace('여드렛날', '아흐렛날').replace('05:48 오후', '07:10 오전')}\n.`); await sleep(2500);
  console.log('chat next day', JSON.stringify(await st()));
  await slash(`/sendas name=Seraphina ${T.replace('여드렛날', '열흘날').replace('05:48 오후', '07:10 오전')}\n.`); await sleep(2500);
  console.log('chat day after', JSON.stringify(await st()));
  console.log('ERR', errs.slice(0, 6)); await b.close();
})();
