// 반사광 해석기 순수 검사 (퍼즐 기믹 전달서 3·11절): node만으로, 게임·ST 없이.
//   node tools/st-test/puzzle-optics.mjs
import { trace } from '../../src/packs/puzzle/optics.js';
import { COLONNADE_ANSWERS, COLONNADE_OPTICS } from '../../src/packs/puzzle/defs.js';

let fail = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} ${m}`); if (!c) fail++; };
const end = r => r.stop === 'receiver' ? Object.keys(r.lit)[0] : r.stop;
const box = [[0, 0, 100, 0], [100, 0, 100, 60], [100, 60, 0, 60], [0, 60, 0, 0]];

// 15: every legal position, the answer table, one answer only
const D = COLONNADE_OPTICS;
for (let i = 0; i < D.mirrors[0].angles.length; i++) {
    const r = trace(D, { m1: i });
    ok(end(r) === COLONNADE_ANSWERS[i], `15 반사판 ${i}(${D.mirrors[0].angles[i]}°): ${end(r)} — 해답표 ${COLONNADE_ANSWERS[i]}, 길이 ${r.path.length - 1}개`);
}
ok(Object.values(COLONNADE_ANSWERS).filter(v => v === 'r1').length === 1, '15 정답은 하나(2, \\)');
// determinism: same input, same path (as after a save and a reload)
ok(JSON.stringify(trace(D, { m1: 2 })) === JSON.stringify(trace(JSON.parse(JSON.stringify(D)), JSON.parse(JSON.stringify({ m1: 2 })))), '같은 상태면 같은 선분(저장·불러오기 뒤에도)');
// the nearest hit: a wall between mirror and receiver keeps it dark
const blocked = trace({ ...D, walls: [...D.walls, [60, 25, 80, 25]] }, { m1: 2 });
ok(blocked.stop === 'wall' && !blocked.lit.r1, '수신부 앞에 벽: 벽에서 멈추고 수신부는 꺼짐');
// a receiver nearer than a wall behind it lights
const near = trace({ ...D, walls: [...D.walls, [60, 5, 80, 5]] }, { m1: 2 });
ok(near.lit.r1, '수신부 뒤 벽은 상관없음(가까운 쪽이 먼저)');
// normal: the reflection does not depend on the normal's sign or length of d
const a = trace({ source: { x: 90, y: 30, dx: -5, dy: 0 }, mirrors: [{ id: 'm', x: 50, y: 30, half: 5, angles: [45] }], receivers: [], walls: box });
ok(Math.abs(a.path[2][0] - 50) < 1e-9 && Math.abs(a.path[2][1] - 0) < 1e-9, '반사 공식 d − 2(d·n)n: 왼쪽 빛이 \\ 에서 위로(방향 벡터 길이 무관)');
// edge-on and parallel: no hit, the light goes past
const e = trace({ source: { x: 90, y: 30, dx: -1, dy: 0 }, mirrors: [{ id: 'm', x: 50, y: 30, half: 5, angles: [0] }], receivers: [], walls: box });
ok(e.stop === 'wall' && Math.abs(e.path[1][0]) < 1e-9, '평행(옆면)으로 오는 빛은 거울을 지나 벽까지');
// a ray along the very end of a mirror: counted as hitting it (ends belong to the mirror)
const tip = trace({ source: { x: 90, y: 30 + 5 * Math.SQRT1_2, dx: -1, dy: 0 }, mirrors: [{ id: 'm', x: 50, y: 30, half: 5, angles: [45] }], receivers: [], walls: box });
ok(tip.path.length === 3, '거울 끝점에 닿는 빛도 반사(끝점 포함)');
// a loop between two facing mirrors stops (loop or bounce limit), never counted as solved
const loop = trace({ source: { x: 50, y: 30, dx: 1, dy: 0 }, mirrors: [{ id: 'a', x: 80, y: 30, half: 5, angles: [90] }, { id: 'b', x: 20, y: 30, half: 5, angles: [90] }], receivers: [{ id: 'r', x: 50, y: 50, r: 2 }], walls: box });
ok(['loop', 'bounces'].includes(loop.stop) && !loop.lit.r, `마주 본 두 거울 사이 빛은 끝남(${loop.stop}), 해결 아님`);
// without walls: a finite line, flagged
const open = trace({ source: { x: 0, y: 0, dx: 1, dy: 0 }, mirrors: [], receivers: [], walls: [] });
ok(open.stop === 'open' && open.path.length === 2, '벽이 없는 장면: 무한선 대신 끝난 선과 open 표시');
console.log(`\n${fail ? 'FAIL' : 'ALL PASS'} (${fail} failed)`);
process.exit(fail ? 1 : 0);
