const { open, sleep, T } = require('./common.js');
const SP = process.argv[2], ACT = process.argv[3] || 'interact'; require('fs').mkdirSync(SP + '/spr', { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T}\n.`); await sleep(1000);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1200);
  for (const who of ['set','somang','horus']) { const url = await p.evaluate(async ([base, who, ACT]) => {
    const { Renderer } = await import(base + 'src/world/render.js'); const { DATA } = await import(base + 'src/core/data.js');
    const cv = document.createElement('canvas'); const r = new Renderer(cv); r.setSprites(DATA.sprites);
    const z = 4, cell = 16 * z * 1.6, dirs = ['down', 'up', 'left', 'right'], ts = [null, 0.05, 0.25, 0.7];
    cv.width = cell * 4 * 4; cv.height = cell * 1.1;
    const g = cv.getContext('2d'); g.fillStyle = '#e9d8b4'; g.fillRect(0, 0, cv.width, cv.height);
    dirs.forEach((dir, di) => ts.forEach((t, k) => {
      const anim = t === null ? { moving: false } : { moving: false, act: { name: ACT, t } };
      r.person(g, who, (di * 4 + k) * cell + cell / 2 - 8 * z, cell - 16 * z - 4, dir, 0, z, anim);
    }));
    return cv.toDataURL();
  }, [base, who, ACT]);
  require('fs').writeFileSync(`${SP}/spr/actsheet_${ACT}_${who}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log('ERR', errs.slice(0, 6)); await b.close();
})();
