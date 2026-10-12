// try a pose at given places without a seat card: for each [name, room, [x, y] to stand (feet), pose, [sx, sy, dir]],
// every one of the three sits there (player.holdPose) and the whole phone screen is saved as <name>_<who>.png.
//   node tools/st-test/pose-try.js <out folder> '<json list>' [who,who]
// Use it to find seat places (then put the chosen one in packs/life/rest.js SEATS) before any spot exists.
const { open, sleep, T } = require('./common.js');
const SP = process.argv[2], LIST = JSON.parse(process.argv[3]), WHO = (process.argv[4] || 'somang,set,horus').split(',');
require('fs').mkdirSync(SP, { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click())); await sleep(300);
  for (const [name, room, [x, y], pose, [sx, sy, dir]] of LIST) for (const who of WHO) {
    await p.evaluate(async ([base, who, room, x, y]) => { const s = (await import(base + 'src/core/state.js')).getState(); s.party = { ...(s.party || {}), lead: who, with: '' }; const W = await import(base + 'src/ui/window.js'); await W.travel(room, { x: x - 0.5, y: y - 0.8, dir: 'up' }); }, [base, who, room, x, y]); await sleep(800);
    await p.evaluate(async ([base, pose, sx, sy, dir]) => { const P = await import(base + 'src/world/player.js'); P.holdPose(pose, sx, sy, dir); }, [base, pose, sx, sy, dir]); await sleep(600);
    await p.screenshot({ path: `${SP}/${name}_${who}.png` });
  }
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
  await b.close();
})();
