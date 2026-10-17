// 두아트 몹 한 마리 영상: a ring by her (no companion), 1) it warns, she steps out of its fixed line, it rushes past,
// she strikes back; 2) struck, it closes up (guard), a blow does 30 %, a 기술 breaks it. Records the page and cuts the
// fight out to <out>/duat-mob.mp4 (ffmpeg); prints what happened.
//   node tools/st-test/duat-mob-video.js <out folder> [ring|hourglass]
const { open, sleep, T } = require('./common.js');
const fs = require('fs'), { execFileSync } = require('child_process');
const OUT = process.argv[2] || '/tmp/duat-mob'; fs.mkdirSync(OUT, { recursive: true });
const KIND = process.argv[3] || 'ring';
(async () => {
  const VID = `${OUT}/raw`; fs.rmSync(VID, { recursive: true, force: true });
  const { b, p, errs, slash } = await open({ dpr: 1, video: VID });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  const E = (fn, arg) => p.evaluate(async ([base, src, arg]) => {
    const F = await import(base + 'src/packs/duat/field.js'), P = await import(base + 'src/world/player.js'), S = await import(base + 'src/core/state.js'), W = await import(base + 'src/ui/window.js');
    return eval(src)(F, P, S, W, arg);
  }, [base, fn.toString(), arg]);
  const log = [], note = m => { log.push(`${((Date.now() - tA) / 1000).toFixed(2)}s ${m}`); };
  await E((F, P, S, W) => { const s = S.getState(); s.party = { ...(s.party || {}), lead: 'set', with: null }; s.duatField = null; return W.travel('duat_04', 'bottom'); });
  await sleep(2500);
  // stand in the open middle of the room (the bottom entry is an exit: stepping down there leaves the map)
  await E((F, P, S, W) => {
    const m = W.currentMap(), free = (x, y) => !m.solidRect(x - 1.5, y - 1.6, x + 5, y + 1.6) && !m.exitAt(x, y) && !m.exitAt(x, y + 1.5);
    for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = m.w / 2 + 1 + dx, y = m.h / 2 + dy;
      if (free(x, y)) { P.player.x = x - 0.5; P.player.y = y - 0.8; return; }
    }
  });
  await sleep(600);
  const mob = async () => (await E(F => F.fieldState())).mobs[0];
  const me = () => E((F, P) => ({ x: P.player.x, y: P.player.y }));
  const key = async (k, ms) => { await p.keyboard.down(k); await sleep(ms); await p.keyboard.up(k); };
  // what the creature did, frame by frame, recorded in the page (polling from here misses short states)
  await p.evaluate(async base => { const F = await import(base + 'src/packs/duat/field.js'); window.__mobLog = []; let last = ''; setInterval(() => { const m = F.fieldState().mobs[0]; const s = m ? m.st : 'none'; if (s !== last) { window.__mobLog.push([performance.now(), s, m?.hp]); last = s; } }, 16); }, base);
  const until = async (fn, ms = 6000) => { const end = Date.now() + ms; while (Date.now() < end) { const m = await mob(); if (m && fn(m)) return m; await sleep(30); } return mob(); };
  // walk next to it (her feet a little left of it, same row), facing it
  const close = async () => {
    for (let k = 0; k < 60; k++) {
      const m = await mob(), q = await E((F, P) => P.feet()); if (!m) return;
      const tx = m.x + 0.5 - 1.4, ty = m.y + 0.8, dx = tx - q.x, dy = ty - q.y;
      if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) break;
      const ks = []; if (dx > 0.2) ks.push('ArrowRight'); if (dx < -0.2) ks.push('ArrowLeft'); if (dy > 0.2) ks.push('ArrowDown'); if (dy < -0.2) ks.push('ArrowUp');
      for (const k2 of ks) await p.keyboard.down(k2); await sleep(70); for (const k2 of ks) await p.keyboard.up(k2);
    }
    await key('ArrowRight', 40);
  };
  // 1) 예고 → 회피 → 반격
  let q = await me();
  await E((F, P, S, W, a) => F.testOnly(a.kind, a.x + 3.4, a.y, { hp: 16 }), { kind: KIND, ...q });
  const tA = Date.now();
  note('몹 하나'); await key('ArrowRight', 60);
  let m = await until(m => m.st === 'prepare'); note(`준비 0 (${m.st})`);
  m = await until(m => m.st === 'prepare' && m.t >= 0.4); note('준비 1: 방향 고정 → 아래로 피함');
  const hp0 = (await E(F => F.fieldState())).run.hp.set;
  await key('ArrowDown', 550);
  m = await until(m => m.st === 'attack'); note('공격 0 (돌진/모래)');
  m = await until(m => m.st === 'recover'); note('공격 1: 무방비');
  const hp1 = (await E(F => F.fieldState())).run.hp.set;
  note(`세트 체력 ${hp0}→${hp1} (${hp1 === hp0 ? '피함' : '맞음'})`);
  await close(); note('다가가서 반격');
  for (let k = 0; k < 3; k++) { await E(F => F.attack()); await sleep(480); }
  m = await mob(); note(`반격 뒤 몹 ${m?.st} 체력 ${m?.hp}`);
  await sleep(1500);
  // 2) 방어 → 기술로 파괴
  q = await me();
  await E((F, P, S, W, a) => F.testOnly(a.kind, a.x + 1.6, a.y, { guard: 1, range: 0.1, hp: 30 }), { kind: KIND, ...q });
  note('방어 몹 하나 (시험: 늘 방어, 공격 안 함)'); await sleep(700);
  await close();
  await E(F => F.attack()); await sleep(350); m = await mob(); note(`첫 공격 정상 피해 → ${m.st} 체력 ${m.hp}`);
  await sleep(250); await E(F => F.attack()); await sleep(300); m = await mob(); note(`방어 중 공격 30 % → 체력 ${m.hp}`);
  await sleep(150); await E(F => F.skill()); await sleep(200); m = await mob(); note(`기술 → ${m?.st} (파괴, 0.8초 경직) 체력 ${m?.hp}`);
  await sleep(1600); m = await mob(); note(`그 뒤 ${m?.st}`);
  const tEnd = Date.now();
  const ml = await p.evaluate(() => window.__mobLog); console.log(ml.map(([t, s, h]) => `${(t / 1000).toFixed(2)} ${s} ${h ?? ''}`).join(' | '));
  const tClose = Date.now();
  await p.close(); await b.close();
  const raw = fs.readdirSync(VID).find(f => f.endsWith('.webm'));
  // the recording ends when the page closes: count back from its end to where the fight began
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${VID}/${raw}`]).toString());
  const from = Math.max(0, dur - (tClose - tA) / 1000 - 0.3);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(from), '-to', String(dur - (tClose - tEnd) / 1000 + 0.3), '-i', `${VID}/${raw}`, '-vf', 'crop=320:320:46:260,scale=800:-2:flags=lanczos', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-crf', '20', `${OUT}/duat-mob.mp4`]);
  console.log(log.join('\n'));
  console.log(errs.length ? 'FAIL 콘솔 오류 ' + errs.slice(0, 3).join(' | ') : 'PASS 콘솔 오류 없음');
})();
