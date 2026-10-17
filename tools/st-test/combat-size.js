// 전투 그림 크기 확인: 게임 렌더러로 호루스 옆 정지·걷기를 그리고, 그 옆에 전투 그림을 같은 배율(HEIGHT·zoom/refVH,
// 발 아래 가운데 기준)로 그린다. 전투는 아직 게임에 없으니 refVH 후보(<전투 폴더>/refvh.json)로 그려 본다.
//   node tools/st-test/combat-size.js <출력 폴더> [zoom]
const { open, sleep, T } = require('./common.js');
const SP = process.argv[2], Z = +(process.argv[3] || 4); require('fs').mkdirSync(SP, { recursive: true });
(async () => {
  const { b, p, slash } = await open({ dpr: 1 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T}\n.`); await sleep(1000);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  const names = await p.evaluate(async base => {
    const m = await (await fetch(base + 'docs/art/horus-combat-approved-18-2026-10-15/manifest.json')).json(); return m.sprites.map(s => s.name);
  }, base);
  for (const n of names) {
    const url = await p.evaluate(async ([base, n, z]) => {
      const { Renderer } = await import(base + 'src/world/render.js'); const { DATA } = await import(base + 'src/core/data.js');
      const dir = n.startsWith('left') ? 'left' : 'right';
      const R = await (await fetch(base + 'docs/art/horus-combat-approved-18-2026-10-15/refvh.json')).json();
      const img = new Image(); img.src = base + `docs/art/horus-combat-approved-18-2026-10-15/png/horus-${n}.png`; await img.decode();
      const c0 = document.createElement('canvas'); c0.width = img.width; c0.height = img.height; const g0 = c0.getContext('2d'); g0.drawImage(img, 0, 0);
      const d = g0.getImageData(0, 0, img.width, img.height).data; let x0 = 1e9, x1 = -1, y1 = -1, y0 = 1e9;
      for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (d[(y * img.width + x) * 4 + 3] >= 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const cv = document.createElement('canvas'); const r = new Renderer(cv); r.setSprites(DATA.sprites);
      const cell = 16 * z * 1.6; cv.width = cell * 5; cv.height = cell * 2;
      const g = cv.getContext('2d'); g.fillStyle = '#e9d8b4'; g.fillRect(0, 0, cv.width, cv.height);
      const base_y = cv.height - 16 * z - 6;
      r.person(g, 'horus', cell * 0.5 - 8 * z, base_y, dir, 0, z, { moving: false });
      r.person(g, 'horus', cell * 1.5 - 8 * z, base_y, dir, 0, z, { moving: true, walkT: 0.13 });
      const k = 31.2 * z / R.refVH[n]; const fx = cell * 3.4, fy = base_y + 16 * z;
      g.imageSmoothingEnabled = true; g.drawImage(img, fx - ((x0 + x1) / 2) * k, fy - (y1 + 1) * k, img.width * k, img.height * k);
      g.fillStyle = '#000'; g.font = '12px sans-serif'; g.fillText(`${n}  refVH ${R.refVH[n]}`, 4, 14);
      return cv.toDataURL();
    }, [base, n, Z]);
    require('fs').writeFileSync(`${SP}/${n}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close(); console.log(names.length, 'done');
})();
