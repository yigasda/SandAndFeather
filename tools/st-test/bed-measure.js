// put one person on a bed at a given place and take the screen with and without them: the difference is exactly
// that person (no follower, no camera move), to measure where the head lands (top of hair, chin) in screen px.
//   node tools/st-test/bed-measure.js <out folder> '<json list of [who, [x, y, dir], name]>' [room]
//   e.g. '[["horus",[15.7,3.9,"down"],"h"],["set",[15.7,3.85,"down"],"s"]]'
// Saves s_<name>.png and s_<name>_empty.png. Diff them (sum of |a-b| > 40) and take the bbox. The top of the bed
// view can cut off a high head: then compare chins/eyes, or work it out from the numbers
// (1 source px of a sprite = 31.2 / referenceVisibleHeight / 16 tiles; 1 tile = ~66.7 screenshot px at dpr 2).
const { open, sleep, T } = require('./common.js');
const SP = process.argv[2], CFG = JSON.parse(process.argv[3]), ROOM = process.argv[4] || 'set_room';
require('fs').mkdirSync(SP, { recursive: true });
(async () => {
  const { b, p } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash0(p, base);
  for (const [who, pl, name] of CFG) {
    await p.evaluate(async ([base, who, room]) => { const s = (await import(base + 'src/core/state.js')).getState(); s.party = { ...(s.party || {}), lead: who === 'somang' ? 'set' : 'somang', with: who }; const W = await import(base + 'src/ui/window.js'); await W.travel(room, { x: 13, y: 7.5, dir: 'up' }); }, [base, who, ROOM]); await sleep(700);
    await p.evaluate(async ([base, pl]) => { const P = await import(base + 'src/world/player.js'); P.holdMate('sleep', pl[0], pl[1], pl[2]); P.player.mate.at = -1e9; }, [base, pl]); await sleep(400);
    await p.screenshot({ path: `${SP}/s_${name}.png` });
    await p.evaluate(async base => { const P = await import(base + 'src/world/player.js'); P.player.mate = null; }, base); await sleep(400);
    await p.screenshot({ path: `${SP}/s_${name}_empty.png` });
  }
  await b.close();
})();
async function slash0(p, base) {
  await p.evaluate(async s => { await SillyTavern.getContext().executeSlashCommandsWithOptions(s); }, `/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  await p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click())); await sleep(300);
}
