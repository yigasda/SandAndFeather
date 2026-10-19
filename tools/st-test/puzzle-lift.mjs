// 15 올림 기둥(A안) 순수 검사: 모든 합법 상태(받침 4 × 기둥 자리 4 × 면 4)에서 빛의 끝, 정답 하나, 처음 상태, 대표 오답의 끝.
//   node tools/st-test/puzzle-lift.mjs
import { LIFT, trace, lit, saying, PEDESTAL_NAMES, FACES } from '../../src/packs/puzzle/lift.js';
let fail = 0;
const ok = (c, m) => { console.log(`${c ? '통과' : '실패'} ${m}`); if (!c) fail++; };
const all = [];
for (let p = 0; p < 4; p++) for (const at of LIFT.groove) for (const face of FACES) all.push({ pedestal: p, at, face });
const wins = all.filter(lit);
ok(wins.length === 1 && wins[0].pedestal === 0 && wins[0].at === 'a3' && wins[0].face === 'N', `정답 하나: ${JSON.stringify(wins)}`);
const s0 = trace(LIFT.start);
ok(s0.end.what === '단 앞 턱' && s0.end.level === 'low', `처음: ${saying(s0)}`);
const w1 = trace({ pedestal: 1, at: 'a1', face: 'E' });
ok(w1.climbs.length === 1 && w1.end.level === 'high' && w1.end.x > 1600, `받침 옆면 + 기둥 a1 동쪽: 높아져 동쪽으로 되돌아감 (${saying(w1)})`);
const w2 = trace({ pedestal: 0, at: 'a3', face: 'S' });
ok(w2.end.what === '기둥 돌', `기둥 a3 남쪽 면: 막힌 쪽 (${saying(w2)})`);
const win = trace(wins[0] || {});
const [down, up] = [win.segs.find(s => s.level === 'low' && s.by > s.ay + 50), win.segs.find(s => s.level === 'high')];
ok(down && up && Math.abs(up.ax - down.ax) >= 20, `내려가는 낮은 빛(x ${down?.ax})과 올라오는 높은 빛(x ${up?.ax})이 다른 줄`);
const ends = {}; for (const s of all) { const e = trace(s).end; const k = `${e.level}:${e.what || e.kind}`; ends[k] = (ends[k] || 0) + 1; }
console.log('끝 분포', JSON.stringify(ends));
console.log(fail ? `FAIL (${fail})` : 'ALL PASS');
process.exit(fail ? 1 : 0);
