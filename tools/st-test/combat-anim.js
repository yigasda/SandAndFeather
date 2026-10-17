// 전투 그림 움직임 확인: 한 자리에서 옆 정지 → 걷기 → 전투 대기 0-1-2-1 → 예비 → 공격 → 기술 → 주문 → 피격 → 지침을
// 게임 렌더러 배율로 프레임마다 그려 png로 남긴다(움짤은 python으로 묶음). refVH 후보는 <전투 폴더>/refvh.json.
//   node tools/st-test/combat-anim.js <출력 폴더> [zoom]
const { open, sleep, T } = require('./common.js');
const SP = process.argv[2], Z = +(process.argv[3] || 4); require('fs').mkdirSync(SP, { recursive: true });
const SEQ = [['idle'], ['walk', 0.0], ['walk', 0.15], ['walk', 0.3], ['walk', 0.45], ['idle'],
  ['combat-idle-0'], ['combat-idle-1'], ['combat-idle-2'], ['combat-idle-1'], ['combat-idle-0'], ['combat-idle-1'], ['combat-idle-2'], ['combat-idle-1'],
  ['combat-anticipation-0'], ['combat-attack-0'], ['combat-idle-0'], ['combat-skill-0'], ['combat-idle-0'], ['combat-spell-0'], ['combat-idle-0'],
  ['combat-hit-0'], ['combat-idle-0'], ['combat-tired-0'], ['combat-tired-0'], ['idle']];
(async () => {
  const { b, p, slash } = await open({ dpr: 1 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T}\n.`); await sleep(1000);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  for (const side of ['left', 'right']) for (let i = 0; i < SEQ.length; i++) {
    const url = await p.evaluate(async ([base, side, f, z]) => {
      const { Renderer } = await import(base + 'src/world/render.js'); const { DATA } = await import(base + 'src/core/data.js');
      const cv = document.createElement('canvas'); const r = new Renderer(cv); r.setSprites(DATA.sprites);
      const cell = 16 * z * 1.6; cv.width = cell * 3; cv.height = cell * 2;
      const g = cv.getContext('2d'); g.fillStyle = '#e9d8b4'; g.fillRect(0, 0, cv.width, cv.height);
      const x = cv.width / 2 - 8 * z, y = cv.height - 16 * z - 10;
      if (f[0] === 'idle') r.person(g, 'horus', x, y, side, 0, z, { moving: false });
      else if (f[0] === 'walk') r.person(g, 'horus', x, y, side, 0, z, { moving: true, walkT: f[1] });
      else {
        const n = `${side}-${f[0]}`;
        const R = await (await fetch(base + 'docs/art/horus-combat-approved-18-2026-10-15/refvh.json')).json();
        const img = new Image(); img.src = base + `docs/art/horus-combat-approved-18-2026-10-15/png/horus-${n}.png`; await img.decode();
        const c0 = document.createElement('canvas'); c0.width = img.width; c0.height = img.height; const g0 = c0.getContext('2d'); g0.drawImage(img, 0, 0);
        const d = g0.getImageData(0, 0, img.width, img.height).data; let x0 = 1e9, x1 = -1, y1 = -1;
        for (let yy = 0; yy < img.height; yy++) for (let xx = 0; xx < img.width; xx++) if (d[(yy * img.width + xx) * 4 + 3] >= 128) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy); }
        // feet: the middle of the solid pixels in the bottom 4 % rows (the spear tip can reach lower; take the sandals)
        let fx0 = 1e9, fx1 = -1; for (let yy = Math.round(y1 - 0.04 * img.height); yy <= y1; yy++) for (let xx = 0; xx < img.width; xx++) if (d[(yy * img.width + xx) * 4 + 3] >= 128) { fx0 = Math.min(fx0, xx); fx1 = Math.max(fx1, xx); }
        const k = 31.2 * z / R.refVH[n]; const fx = x + 8 * z, fy = y + 16 * z;
        g.fillStyle = 'rgba(40,25,10,.25)'; g.fillRect(x + 4 * z, y + 14 * z, 8 * z, 2 * z);
        g.imageSmoothingEnabled = true; g.drawImage(img, fx - ((fx0 + fx1) / 2) * k, fy - (y1 + 1) * k, img.width * k, img.height * k);
      }
      g.fillStyle = '#000'; g.font = '13px sans-serif'; g.fillText(f[0], 6, 16);
      return cv.toDataURL();
    }, [base, side, SEQ[i], Z]);
    require('fs').writeFileSync(`${SP}/${side}-${String(i).padStart(2, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close(); console.log('done');
})();
