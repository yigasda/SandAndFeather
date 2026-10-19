// 두아트 필드 전투: go down to duat_04 with each lead (and a companion), see the creatures float, wander and come at
// her, hit them (공격, 기술, 주문), get hit, and leave. Saves screenshots (phone, dpr 2) and prints the state.
//   node tools/st-test/duat-field.js <out folder> [set,horus,somang]
const { open, sleep, T } = require('./common.js');
const fs = require('fs'); const OUT = process.argv[2] || '/tmp/duat-field'; fs.mkdirSync(OUT, { recursive: true });
const WHO = (process.argv[3] || 'horus,set,somang').split(',');
const MATE = { horus: 'set', set: 'somang', somang: 'horus' };
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2 });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T.replace('05:48 오후', '11:00 오전')}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  const E = (fn, arg) => p.evaluate(async ([base, src, arg]) => {
    const F = await import(base + 'src/packs/duat/field.js'), P = await import(base + 'src/world/player.js'), S = await import(base + 'src/core/state.js'), W = await import(base + 'src/ui/window.js');
    return eval(src)(F, P, S, W, arg);
  }, [base, fn.toString(), arg]);
  const ok = (c, m) => console.log(c ? 'PASS' : 'FAIL', m);
  for (const lead of WHO) {
    await E((F, P, S, W, a) => { const s = S.getState(); s.party = { ...(s.party || {}), lead: a[0], with: a[1] }; s.duatField = null; return W.travel('duat_04', 'bottom'); }, [lead, MATE[lead]]);
    await sleep(2500);
    let st = await E(F => F.fieldState());
    ok(st.map === 'duat_04' && st.mobs.length === 5, `${lead}: 04에 몹 5 (${st.mobs.map(m => m.kind).join(',')})`);
    await p.screenshot({ path: `${OUT}/${lead}-arrive.png` });
    ok(st.stance === false, `${lead}: 들어오자마자는 평상(일반 그림)`);
    // stand next to the first creature, facing it
    const m0 = st.mobs[0];
    await E((F, P, S, W, m) => { P.player.x = m.x - 1.1; P.player.y = m.y; }, m0);
    await sleep(1800);
    st = await E(F => F.fieldState());
    ok(st.mobs.some(m => ['chase', 'prepare', 'attack', 'recover', 'guard', 'hit'].includes(m.st)), `${lead}: 가까이 가면 다가옴/공격 준비 (${st.mobs.map(m => m.st).join(',')})`);
    await p.screenshot({ path: `${OUT}/${lead}-near.png` });
    const hp0 = st.mobs.reduce((a, m) => a + m.hp, 0);
    for (let k = 0; k < 4; k++) { await E((F, P) => { const m = F.fieldState().mobs.find(o => o.st !== 'dead'); if (m) { P.player.x = m.x - 0.9; P.player.y = m.y; } F.attack(); }); await sleep(150); if (k === 0) await p.screenshot({ path: `${OUT}/${lead}-attack.png` }); await sleep(400); }
    st = await E(F => F.fieldState());
    ok(st.stance === true, `${lead}: 공격하면 전투 자세`);
    const hp1 = st.mobs.reduce((a, m) => a + m.hp, 0);
    ok(hp1 < hp0 || st.mobs.length < 5, `${lead}: 공격으로 몹 체력 줄어듦 ${hp0}→${hp1}`);
    // up and down: the armed front / back walk, and the thrust down onto a creature below her
    await p.keyboard.down('ArrowDown'); await sleep(450); await p.screenshot({ path: `${OUT}/${lead}-walk-down.png` }); await p.keyboard.up('ArrowDown'); await sleep(200);
    st = await E(F => F.fieldState());
    ok(st.stance === true && st.me.vdir === 'down', `${lead}: 전투 중 아래로 걸으면 아래를 봄(vdir ${st.me.vdir})`);
    const hp2 = st.mobs.reduce((a, m) => a + m.hp, 0);
    for (let k = 0; k < 3; k++) { await E((F, P) => { const m = F.fieldState().mobs.find(o => o.st !== 'dead'); if (m) { P.player.x = m.x; P.player.y = m.y - 0.9; } F.testFace('down'); F.attack(); }); await sleep(150); if (k === 0) await p.screenshot({ path: `${OUT}/${lead}-attack-down.png` }); await sleep(400); }
    st = await E(F => F.fieldState());
    ok(st.mobs.reduce((a, m) => a + m.hp, 0) < hp2 || st.mobs.length < 5, `${lead}: 아래 찌르기로 몹 체력 줄어듦`);
    await E(F => F.testFace('right'));
    await E(F => F.skill()); await sleep(200); await p.screenshot({ path: `${OUT}/${lead}-skill.png` }); await sleep(600);
    await E(F => F.spell()); await sleep(200); await p.screenshot({ path: `${OUT}/${lead}-spell.png` });
    await sleep(3000);
    st = await E(F => F.fieldState());
    console.log(lead, JSON.stringify({ me: st.me, mate: st.mate, hp: st.run?.hp, fear: st.run?.fear, spells: st.run?.spells, mobs: st.mobs.map(m => `${m.kind}:${m.st}:${m.hp}`) }));
    await p.screenshot({ path: `${OUT}/${lead}-after.png` });
  }
  // leaving the Duat ends the run
  await E((F, P, S, W) => W.travel('ombos')); await sleep(1500);
  ok(await E((F, P, S) => S.getState().duatField === null), '두아트를 나오면 원정 끝');
  ok(!errs.length, '콘솔 오류 없음 ' + errs.slice(0, 3).join(' | '));
  await b.close();
})();
