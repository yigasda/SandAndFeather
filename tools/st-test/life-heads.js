// 생활 동작 머리 크기 (0.9.70): the game's own renderer draws each life picture next to that character's idle in the
// same direction, at the game's scale, with a line across the idle's head top and chin, so a head drawn smaller or
// larger than the idle's shows at a glance.   node tools/st-test/life-heads.js <folder>
const { open, sleep, T } = require('./common.js');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp/life-heads'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p } = await open({ dpr: 1 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash0(p, `/sendas name=Seraphina ${T}\n.`); await sleep(1000);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  const acts = process.argv[3] ? process.argv[3].split(',') : ['happy', 'shy', 'surprised', 'read', 'cook', 'eat', 'fish'];
  for (const who of (process.argv[4] || 'somang,set,horus').split(',')) {
    const url = await p.evaluate(async ([base, who, acts]) => {
      const { Renderer } = await import(base + 'src/world/render.js'); const { DATA } = await import(base + 'src/core/data.js');
      const m = DATA.sprites.looks[who].motion;
      const list = [];
      for (const a of acts) for (const [dir, fr] of Object.entries(m.acts[a] || {})) fr.forEach((_, i) => list.push([a, dir, i]));
      const cv = document.createElement('canvas'); const r = new Renderer(cv); r.setSprites(DATA.sprites);
      const z = 5, ts = 16 * z, cell = ts * 2.2;
      cv.width = cell * 2 * list.length; cv.height = ts * 3.2;
      const g = cv.getContext('2d'); g.fillStyle = '#e9d8b4'; g.fillRect(0, 0, cv.width, cv.height);
      list.forEach(([a, dir, i], k) => {
        const x0 = k * cell * 2, y = ts * 2.4;
        r.motionPerson(g, who, x0 + cell * 0.5 - ts / 2, y - ts, dir, z, { moving: false });
        r.motionPerson(g, who, x0 + cell * 1.5 - ts / 2, y - ts, dir, z, { moving: false, act: { name: a, t: 0, frame: i } });
        g.fillStyle = '#000'; g.font = '14px sans-serif'; g.fillText(`${a} ${dir} ${i}`, x0 + 6, 16);
      });
      return cv.toDataURL();
    }, [base, who, acts]);
    fs.writeFileSync(`${OUT}/${who}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
})();
function slash0(p, s) { return p.evaluate(async s => { await SillyTavern.getContext().executeSlashCommandsWithOptions(s); }, s); }
