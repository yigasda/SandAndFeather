// 두아트 필드 전투 (docs/DUAT-FIELD-COMBAT-PLAN.md): on the Duat maps she and the one walking with her fight the
// creatures that float about, MapleStory-like, right where they are. First the 고대장치 creatures (모래시계 2, 고리 3 on
// duat_04, data/duat.json field.maps). Every creature has the same 10 pictures (tools/art/enemy-pack.py) and the same
// way of fighting (field.timing, each kind's numbers in field.enemies):
//   대기 0·1·2   drifting, coming at her, and the rest after a blow (it may move then, not strike again)
//   준비 0 → 1   the warning: it follows her with its eye, then (준비 1) shakes and its aim is fixed, so she can step aside
//   공격 0       the blow itself: the ring rushes (its picture flies along the fixed line), the hourglass throws sand; it
//               hurts only what it really touches
//   공격 1       0.35 s open after the blow: no guard, she can strike back
//   고유 방어    when struck while it drifts or comes at her it may close up (that first blow lands in full): 1.2 s, what
//               hits it then does 30 %; a 기술 breaks it (full damage, 0.8 s stunned, no counter), else it counters
//               with the whole warning when it opens
//   피격, 소멸   (소멸 is the first approved picture)
// No light is put on its body (user); sparks, shards and rings are drawn beside it, one set for every creature, only
// their colour and size from the creature.
// The 말 걸기 button becomes 공격 there (a place right by her and no creature near still opens with it); 기술 and
// 주문 sit above it (text for now; icons later). Each of the two has their own 체력 (s.duatField.hp), one 공포 for
// both; at 0 체력 (or 공포 full) the leader goes down and is carried back up to Ombos. Leaving the Duat ends the run.
// Two ways of standing down there (user: going straight into the combat pose on arrival looked odd): calm, her
// ordinary standing and walking pictures in all four ways, as in the town; fighting (a creature has seen her, she
// struck or was struck), the combat pictures (looks.<who>.combat: ready standing, the armed walk walking left or right,
// facing left or right). Fighting ends when no awake creature is within 6 tiles for 4 s. So that she does not flicker
// between the two sets, the change happens only when she stands still (or on a button / a hit) and holds 2 s at least.
// Fighting, she also faces up or down (me.vdir: after walking that way, or a creature mostly above or below her): the
// armed front / back pictures (ready, walk, the thrust), and 공격 strikes that way; 기술·주문·피격·지침 have side
// pictures only and keep to the way she faces sideways (me.face).
// Fighting, the one with her leaves her heels and takes a place of their own beside the creature (1.5 tiles from her).

import { DATA, spriteFile } from '../../core/data.js';
import { getState, saveState } from '../../core/state.js';
import { HERO_NAME, leadOf, statsOf, withOf } from '../../core/heroes.js';
import { behind, feet, follower, mateWalk, player } from '../../world/player.js';
import { input } from '../../world/input.js';
import { currentMap, gameMode, onBusy, onDraw, onFrame, onTalkFirst, travel } from '../../ui/window.js';
import { josa } from '../../core/ko.js';

const F = () => DATA.duat?.field || {};
const isDuat = id => /^duat_\d+$/.test(id || '');
const FEAR_MAX = 10, AGGRO = 4, BOLT_LIFT = 0.8, BODY_MID = 0.9;
const FLOAT = 0.35, BOB = 0.08, BOB_S = 1.8, IDLE_LOOP = ['idle-0', 'idle-1', 'idle-2', 'idle-1'];
const SKILL_CD = 6, ATTACK_CD = 0.55, INVULN = 0.6, MATE_SKILL_CD = 8, TIRED_FEAR = 7;
// how long each combat picture shows (s), long enough to be seen (user: only ready, walk and attack were seen)
const SHOW = { anticipation: 0.2, attack: 0.35, hit: 0.45, skill: 0.7, spell: 0.8, jump: 0.45 };
const CALM = 4, HOLD = 2, FIGHT_NEAR = 6, MATE_SPEED = 3.6, MATE_APART = 1.5, VERT = 1.3;
// the shared timings (seconds), a kind may change any of them (enemies.<kind>.timing)
const TIME = { idle: 0.18, prepare: [0.4, 0.3], recover: 0.35, rest: 1.2, hit: 0.3, steady: 0.4, guard: 1.2, guardCd: 6, guardTake: 0.3, stagger: 0.8, die: [0.25, 0.6] };
const timing = o => ({ ...TIME, ...(F().timing || {}), ...(o.e.timing || {}) });
const tune = {};   // tests only: per-kind numbers over the data (e.g. a guard that always comes)
const rand = (a, b) => a + Math.random() * (b - a);
const now = () => performance.now() / 1000;

let mobs = [], bolts = [], pops = [], fx = [], mapId = '', mapObj = null, runObj = null, ui = null;
// what she and the one with her are doing now: { name, at, until, lift, face }
const me = { act: null, face: 'right', vdir: null, cdAttack: 0, cdSkill: 0, hurtAt: -9, shield: 0, down: false, vert: false, target: null };
const mate = { act: null, face: 'right', cd: 0, cdSkill: 0, hurtAt: -9, down: false, shown: false };
// fighting or calm: on (what she shows), since (when it last changed), last (the last time a fight was going on)
const stance = { on: false, since: -9, last: -9 };

// ---- the run
const maxHp = (s, who) => 13 + 3 * (statsOf(s, who)?.strength || 0);
function run(s) {
    if (s.duatField) return s.duatField;
    const lead = leadOf(s), w = withOf(s), hp = {};
    for (const who of [lead, w].filter(Boolean)) hp[who] = maxHp(s, who);
    s.duatField = { v: 1, hp, max: { ...hp }, fear: 0, spells: (statsOf(s, lead)?.faith || 0) > 0 ? F().spells || 3 : 0, cleared: {} };
    return s.duatField;
}
let saveSoon = 0;
const save = () => { clearTimeout(saveSoon); saveSoon = setTimeout(() => saveState(), 1200); };

// ---- the creatures of this map
const solid = (m, x, y) => m.solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
function makeMob(i, kind, x, y) {
    const e = { ...F().enemies[kind], ...(tune[kind] || {}) };
    return { i, kind, e, x, y, hp: e.hp, st: 'wander', t: 0, tx: x, ty: y, wait: rand(0, 1.5), phase: rand(0, 6.28), shownAt: -9, guardAt: 0, steadyAt: 0, restAt: 0 };
}
function spawn(m, s) {
    mobs = []; bolts = []; pops = []; fx = [];
    const want = F().maps?.[m.id] || {}, dead = new Set(run(s).cleared[m.id] || []);
    const away = [...Object.values(m.d.entries || {}), { x: player.x, y: player.y }];
    let i = 0;
    for (const [kind, n] of Object.entries(want)) for (let k = 0; k < n; k++, i++) {
        if (dead.has(i)) continue;
        let x, y, tries = 0;
        do { x = rand(1, m.w - 2); y = rand(1, m.h - 2); tries++; }
        while (tries < 800 && (solid(m, x, y) || away.some(p => Math.hypot(p.x - x, p.y - y) < 5) || mobs.some(o => Math.hypot(o.x - x, o.y - y) < 2)));
        mobs.push(makeMob(i, kind, x, y));
    }
}
const centre = o => ({ x: o.x + 0.5, y: o.y + 0.8 });
function targets(s) {
    const f = feet(), out = [];
    const r = run(s);
    if (!me.down) out.push({ who: leadOf(s), x: f.x, y: f.y, lead: true });
    const w = withOf(s);
    if (w && !mate.down && r.hp[w] > 0) { const p = follower(); out.push({ who: w, x: p.x + 0.5, y: p.y + 0.8, lead: false }); }
    return out;
}
const wall = (x, y) => map().solidRect(x - 0.08, y - 0.08, x + 0.08, y + 0.08);
// a clear line between two points (no wall along it): a shot or a rush only when it can reach
function clearLine(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 0.2);
    for (let k = 1; k < n; k++) if (wall(a.x + (b.x - a.x) * k / n, a.y + (b.y - a.y) * k / n)) return false;
    return true;
}
// the way round walls (user: they stood stuck against a wall): breadth-first over half-tile cells where its body fits,
// at most 14 tiles out; the next point along the way (or null when there is none). Asked again every 0.3 s at most.
const CELL = 0.5, fits = (x, y) => !solid(map(), x - 0.5, y - 0.8);
function wayTo(o, gx, gy) {
    const c = centre(o), t = now();
    if (o.way && t - o.way.at < 0.3 && Math.hypot(o.way.gx - gx, o.way.gy - gy) < 0.6) return o.way.next;
    const m = map(), W = Math.ceil(m.w / CELL), H = Math.ceil(m.h / CELL), R = 28;
    const sx = Math.floor(c.x / CELL), sy = Math.floor(c.y / CELL), tx = Math.floor(gx / CELL), ty = Math.floor(gy / CELL);
    const key = (x, y) => y * W + x, from = new Map([[key(sx, sy), -1]]), q = [[sx, sy]];
    const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && Math.abs(x - sx) <= R && Math.abs(y - sy) <= R && fits((x + 0.5) * CELL, (y + 0.5) * CELL);
    let end = null, best = null, bd = 1e9;
    for (let i = 0; i < q.length && !end; i++) {
        const [x, y] = q[i], d = Math.hypot(x - tx, y - ty);
        if (d < bd) { bd = d; best = [x, y]; }
        if (d <= 1) { end = [x, y]; break; }
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const nx = x + ax, ny = y + ay;
            if (from.has(key(nx, ny)) || !ok(nx, ny) || (ax && ay && (!ok(x + ax, y) || !ok(x, y + ay)))) continue;
            from.set(key(nx, ny), key(x, y)); q.push([nx, ny]);
        }
    }
    end ||= best;   // cannot get there: as close as it can
    const cells = [];
    for (let k = key(end[0], end[1]); k !== -1 && k !== undefined; k = from.get(k)) cells.push(k);
    cells.reverse();
    // the farthest cell of the first few that it can go to in a straight line
    let next = null;
    for (const k of cells.slice(1, 6)) { const p = { x: (k % W + 0.5) * CELL, y: (Math.floor(k / W) + 0.5) * CELL }; if (clearLine(c, p)) next = p; else break; }
    if (!next && cells.length > 1) next = { x: (cells[1] % W + 0.5) * CELL, y: (Math.floor(cells[1] / W) + 0.5) * CELL };
    if (cells.length <= 1) next = { x: gx, y: gy };
    o.way = { at: t, gx, gy, next };
    return next;
}
// the warning: fix whom it means; while 준비 0 its eye follows them, at 준비 1 the line is fixed
function warn(o, p) { o.st = 'prepare'; o.t = 0; o.target = p.who; o.aim = null; }
function aimAt(o, s) {
    const c = centre(o), p = targets(s).find(q => q.who === o.target) || targets(s)[0];
    if (!p) return;
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
    o.look = { dx: dx / d, dy: dy / d };
    if (Math.abs(dx) > 0.1) o.faceR = dx > 0;
}
function stepMob(m, o, dt, s) {
    o.t += dt;
    const T = timing(o), c = centre(o), tg = targets(s).map(p => ({ p, d: Math.hypot(p.x - c.x, p.y - c.y) })).sort((a, b) => a.d - b.d);
    // whom it goes for: the one it already fights (or who last struck it) while they stay in reach, else the nearest
    let near = tg.find(q => q.p.who === o.foe && q.d < AGGRO + 2.5) || tg[0];
    if (near && near.d >= AGGRO && near.p.who !== o.foe) near = null;
    o.foe = near ? near.p.who : (tg[0]?.d < AGGRO ? tg[0].p.who : null);
    const move = (tx, ty, speed) => {
        const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
        if (d < 0.05) return true;
        if (Math.abs(dx) > 0.05) o.faceR = dx > 0;
        let k = Math.min(d, speed * dt) / d, nx = o.x + dx * k, ny = o.y + dy * k;
        // not on top of another creature: a little push away from any within 0.9
        for (const q of mobs) if (q !== o && q.st !== 'dead') { const e = centre(q), ex = c.x - e.x, ey = c.y - e.y, ed = Math.hypot(ex, ey); if (ed < 0.9 && ed > 0.01) { nx += ex / ed * speed * dt * 0.5; ny += ey / ed * speed * dt * 0.5; } }
        let moved = false;
        if (!solid(map(), nx, o.y)) { o.x = nx; moved = true; }
        if (!solid(map(), o.x, ny)) { o.y = ny; moved = true; }
        return !moved;
    };
    // along the way round walls to a point
    const go = (tx, ty, speed) => { const w = wayTo(o, tx, ty); return w ? move(w.x, w.y, speed) : true; };
    switch (o.st) {
        case 'dead': if (o.t > T.die[0] + T.die[1]) o.gone = true; return;
        case 'hit': if (o.t > o.stun) { o.st = 'chase'; o.t = 0; } return;
        case 'guard':   // it opens and strikes back, the whole warning first
            if (o.t > T.guard) { o.t = 0; if (near) warn(o, near.p); else o.st = 'chase'; }
            return;
        case 'prepare':
            if (o.t < T.prepare[0]) { aimAt(o, s); return; }
            if (!o.aim) { aimAt(o, s); o.aim = o.look; }   // 준비 1: the line is fixed now
            if (o.t > T.prepare[0] + T.prepare[1]) {
                o.st = 'attack'; o.t = 0; o.struck = new Set();
                if (o.e.attack === 'shot') shoot(o);
            }
            return;
        case 'attack':
            if (o.e.attack === 'dash') {   // the picture itself flies along the line; hurts whom it really touches
                const d = o.e.dash, v = d.dist / d.time;
                if (o.t <= d.time) {
                    const nx = o.x + o.aim.dx * v * dt, ny = o.y + o.aim.dy * v * dt;
                    if (solid(map(), nx, ny)) o.t = d.time; else { o.x = nx; o.y = ny; }
                    const cc = centre(o);
                    for (const p of targets(s)) if (!o.struck.has(p.who) && Math.hypot(p.x - cc.x, p.y - cc.y) < d.hit) { o.struck.add(p.who); hurt(s, p.who, o.e.atk); }
                    return;
                }
            } else if (o.t <= 0.2) return;
            o.st = 'recover'; o.t = 0;
            return;
        case 'recover':   // open: no guard, she can strike back; then it may move but not strike for a while
            if (o.t > T.recover) { o.st = 'chase'; o.t = 0; o.restAt = now() + T.rest; }
            return;
    }
    // drifting about, or coming at whoever it sees
    if (near) {
        o.st = 'chase';
        const p = near.p, seen = clearLine(c, p);
        if (near.d <= o.e.range && seen && now() >= o.restAt) { warn(o, p); return; }
        const shot = o.e.attack === 'shot', keep = shot ? o.e.range * 0.6 : 0.9;   // the hourglass keeps its distance
        const ax = (c.x - p.x) / (near.d || 1), ay = (c.y - p.y) / (near.d || 1);
        o.orbit ||= Math.random() < 0.5 ? 1 : -1;
        if (now() < o.restAt || (seen && near.d < keep)) {
            // resting after a blow, or too close: step round them at its distance (not standing still)
            const want = shot ? o.e.range * 0.8 : Math.max(1.4, o.e.range * 0.75), a = Math.atan2(ay, ax) + o.orbit * 0.9;
            const gx = p.x + Math.cos(a) * want, gy = p.y + Math.sin(a) * want;
            if (!fits(gx, gy) || move(gx, gy, o.e.speed * 0.6)) o.orbit = -o.orbit;
            o.faceR = p.x > c.x;
            return;
        }
        go(p.x, p.y, o.e.speed);
        return;
    }
    o.st = 'wander';
    if (o.wait > 0) { o.wait -= dt; return; }
    const stuck = go(o.tx, o.ty, o.e.speed * 0.5);
    if (stuck || Math.hypot(o.tx - c.x, o.ty - c.y) < 0.15) {
        for (let k = 0; k < 20; k++) { const tx = c.x + rand(-4, 4), ty = c.y + rand(-4, 4); if (!solid(map(), tx - 0.5, ty - 0.8)) { o.tx = tx; o.ty = ty; break; } }
        o.wait = rand(0.4, 1.6);
    }
}
// sand: a little bunch of grains along the fixed line; it hurts whom it reaches (its own small circle, not the picture)
function shoot(o) {
    const c = centre(o), b = o.e.bolt;
    bolts.push({ x: c.x + o.aim.dx * 0.4, y: c.y + o.aim.dy * 0.4, vx: o.aim.dx * b.speed, vy: o.aim.dy * b.speed, gone: 0, life: b.life, hit: b.hit, atk: o.e.atk, color: o.e.fx?.color, seed: rand(0, 6.28) });
}
function stepBolts(dt, s) {
    for (const b of bolts) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.gone += Math.hypot(b.vx, b.vy) * dt;
        for (const p of targets(s)) if (Math.hypot(p.x - b.x, p.y - b.y) < b.hit) { hurt(s, p.who, b.atk); b.dead = true; break; }
        if (b.gone > b.life || wall(b.x, b.y)) { b.dead = true; burst('shards', b.x, b.y, BOLT_LIFT, '#d9b073', 0.6); }
    }
    bolts = bolts.filter(b => !b.dead);
}

// ---- the shared effects: a few lines of light, flying bits, a ring; each creature only gives its colour and size
function burst(kind, x, y, lift, color, size = 1) {
    const e = { kind, x, y, lift, color, size, at: now(), dur: kind === 'spark' ? 0.3 : kind === 'ring' ? 0.45 : 0.6, a0: rand(0, 6.28) };
    if (kind === 'shards') e.bits = Array.from({ length: Math.round(5 + 4 * size) }, () => ({ a: rand(0, 6.28), v: rand(1.2, 2.6) * size, up: rand(0.8, 1.8), r: rand(0.035, 0.07) * Math.max(0.7, size), c: Math.random() < 0.5 ? '#d8b483' : '#b78a55' }));
    fx.push(e);
}
const STONE = '#d8b483';
function mobFx(o, what) {
    const c = centre(o), col = o.e.fx?.color || '#fff', k = 1.3 * (o.e.fx?.size || 1), y = BODY_MID * (o.e.height || 1);
    if (what === 'hit') { burst('spark', c.x, c.y, y, '#fff6d8', 0.8 * k); burst('shards', c.x, c.y, y, STONE, 0.5 * k); }
    if (what === 'guard') burst('ring', c.x, c.y, y, col, 1.1 * k);
    if (what === 'block') { burst('spark', c.x, c.y, y, col, 1 * k); burst('ring', c.x, c.y, y, col, 0.7 * k); }
    if (what === 'break') { burst('spark', c.x, c.y, y, '#fff6d8', 1.4 * k); burst('ring', c.x, c.y, y, col, 1.6 * k); burst('shards', c.x, c.y, y, STONE, 1.3 * k); }
}

// ---- fighting or calm
const ACTIVE = ['chase', 'prepare', 'attack', 'recover', 'guard', 'hit'];
function nearestMob(from) {
    let best = null, bd = 1e9;
    for (const o of mobs) { if (o.st === 'dead') continue; const c = centre(o), d = Math.hypot(c.x - from.x, c.y - from.y); if (d < bd) { bd = d; best = o; } }
    return best ? { o: best, d: bd } : null;
}
function faceMob() {
    const f = feet(), n = nearestMob(f);
    if (n) {
        const dx = centre(n.o).x - f.x, dy = centre(n.o).y - f.y;
        me.face = dx >= 0 ? 'right' : 'left';
        me.vdir = Math.abs(dy) > Math.abs(dx) * VERT ? (dy > 0 ? 'down' : 'up') : null;
    } else if (player.dir === 'left' || player.dir === 'right') { me.face = player.dir; me.vdir = null; }
    else me.vdir = player.dir;
}
// a button, a hit: fighting at once (she is doing something, so the change does not show as a flicker)
function engage() {
    stance.last = now();
    if (!stance.on) { stance.on = true; stance.since = now(); faceMob(); }
}
function stepStance() {
    const t = now(), f = feet();
    if (mobs.some(o => ACTIVE.includes(o.st) && Math.hypot(centre(o).x - f.x, centre(o).y - f.y) < FIGHT_NEAR)) stance.last = t;
    const want = t - stance.last < CALM;
    if (want !== stance.on && t - stance.since >= HOLD && !player.moving) { stance.on = want; stance.since = t; if (want) faceMob(); }
}
// the one with her, fighting: walks to a place of their own (beside the nearest creature, MATE_APART from her);
// calm again, walks back behind her and is handed back to the trail
function stepMateWalk(dt, s) {
    const w = withOf(s), home = behind();
    let goal = null;
    if (w && stance.on && !mate.down) {
        const f = feet(), o = mateTarget(), reach = F().reach?.[w] || 1.4;
        if (o) {
            // on the creature's other side from her, level with it (so the blow lands where it is seen), else close to level
            const c = centre(o), ps = f.x <= c.x ? -1 : 1;
            for (const [side, dy] of [[-ps, 0], [-ps, 0.35], [-ps, -0.35], [ps, 0.9], [ps, -0.9]]) {
                const gx = c.x + side * reach * 0.95, gy = c.y + dy;
                if (Math.hypot(gx - f.x, gy - f.y) >= MATE_APART && !solid(map(), gx - 0.5, gy - 0.8)) { goal = { x: gx - 0.5, y: gy - 0.8 }; break; }
            }
        }
        if (!goal) { const gx = f.x + (me.face === 'right' ? -1 : 1) * MATE_APART, gy = f.y + 0.4; if (!solid(map(), gx - 0.5, gy - 0.8)) goal = { x: gx - 0.5, y: gy - 0.8 }; }
    }
    if (!goal) { if (!mateWalk.pos) return; goal = home; }
    const cur = mateWalk.pos || { ...home, walkT: 0 };
    const dx = goal.x - cur.x, dy = goal.y - cur.y, d = Math.hypot(dx, dy);
    let moving = false;
    if (d > 0.08) {
        const k = Math.min(d, MATE_SPEED * dt) / d, nx = cur.x + dx * k, ny = cur.y + dy * k;
        if (!solid(map(), nx, cur.y)) { cur.x = nx; moving = true; }
        if (!solid(map(), cur.x, ny)) { cur.y = ny; moving = true; }
        if (moving) cur.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
    cur.moving = moving; cur.walkT = moving ? (cur.walkT || 0) + dt : 0; cur.step = 0;
    mateWalk.pos = cur;
    if (!stance.on && d < 0.15) mateWalk.pos = null;   // back behind her: the trail takes over
}

// ---- hurting and being hurt
function pop(x, y, text, color) { pops.push({ x, y, text, color, at: now() }); }
function hurt(s, who, atk) {
    const r = run(s), lead = who === leadOf(s), st = lead ? me : mate;
    if (now() - st.hurtAt < INVULN || st.down) return;
    engage();
    if (me.shield > now()) { pop(lead ? feet().x : follower().x + 0.5, (lead ? feet().y : follower().y + 0.8) - 2, '막음', '#9fd6ff'); return; }
    const dmg = Math.max(1, atk + Math.round(rand(-1, 1)) - (who === 'set' ? 1 : 0));
    r.hp[who] = Math.max(0, (r.hp[who] ?? 0) - dmg);
    r.fear = Math.min(FEAR_MAX, r.fear + 1);
    st.hurtAt = now(); st.act = { name: 'hit', at: now(), until: now() + SHOW.hit };
    const p = lead ? feet() : { x: follower().x + 0.5, y: follower().y + 0.8 };
    pop(p.x, p.y - 2.1, `-${dmg}`, '#ff6b5a');
    save();
    if (r.hp[who] <= 0) {
        st.down = true; st.act = { name: 'tired', at: now(), until: Infinity };
        if (lead) setTimeout(carried, 900);
    } else if (lead && r.fear >= FEAR_MAX) { me.down = true; me.act = { name: 'tired', at: now(), until: Infinity }; setTimeout(carried, 900); }
}
async function carried() {
    const s = getState();
    if (!s || !isDuat(mapId)) return;
    const w = withOf(s);
    ui?.showCard({ tag: '원정', title: '두아트', text: w ? `${josa(HERO_NAME[w], '가')} 업고 올라왔어. 쉬고 다시 내려가자.` : '겨우 기어서 올라왔어. 쉬고 다시 내려가자.' });
    s.duatField = null;
    await travel('ombos', { x: 36, y: 10.6, dir: 'down' });
}
// a blow on a creature. kind: '' her or her companion's blow, 'skill' a 기술 (it breaks a guard)
function damage(s, o, n, push = 0, from = null, kind = '') {
    if (o.st === 'dead') return;
    const T = timing(o), c = centre(o);
    o.shownAt = now();
    if (from) { const q = targets(s).sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0]; if (q) o.foe = q.who; }
    let st = '';
    if (o.st === 'guard') {
        if (kind === 'skill') { st = 'break'; mobFx(o, 'break'); }
        else { n = Math.max(1, Math.round(n * T.guardTake)); mobFx(o, 'block'); }
    } else mobFx(o, 'hit');
    o.hp -= n;
    pop(c.x, c.y - 2.3, `${n}`, o.st === 'guard' && st !== 'break' ? '#cfe3ea' : '#fff3c4');
    if (o.hp <= 0) {
        o.st = 'dead'; o.t = 0;
        const r = run(s); (r.cleared[mapId] ||= []).push(o.i); save();
        return;
    }
    if (st === 'break') { o.st = 'hit'; o.t = 0; o.stun = T.stagger; o.steadyAt = now() + T.stagger + T.steady; return; }   // no counter
    if (o.st === 'guard') return;
    // the first blow lands in full, then it may close up
    if ((o.st === 'wander' || o.st === 'chase') && now() >= o.guardAt && Math.random() < (o.e.guard || 0)) {
        o.st = 'guard'; o.t = 0; o.guardAt = now() + T.guardCd; mobFx(o, 'guard');
        return;
    }
    // flinch (not in the warning or the blow itself, and not again right after the last flinch)
    if (['wander', 'chase', 'recover'].includes(o.st) && now() >= o.steadyAt) {
        o.st = 'hit'; o.t = 0; o.stun = T.hit; o.steadyAt = now() + T.hit + T.steady;
        if (push && from) { const dx = c.x - from.x, dy = c.y - from.y, d = Math.hypot(dx, dy) || 1, nx = o.x + dx / d * push, ny = o.y + dy / d * push; if (!solid(map(), nx, ny)) { o.x = nx; o.y = ny; } }
    }
}
const power = (s, who) => 3 + Math.floor((statsOf(s, who)?.strength || 0) / 2) + (who === 'set' ? 1 : 0);
// her blow: everything in front of her, from her feet out to her reach, a little to either side (face: left, right,
// or up / down for the thrust from the front / back pictures)
function strike(s, who, from, face, mult = 1, reach = null) {
    reach ??= F().reach?.[who] || 1.4;
    const v = face === 'up' || face === 'down', sign = face === 'right' || face === 'down' ? 1 : -1;
    let hit = 0;
    for (const o of mobs) {
        const c = centre(o), along = ((v ? c.y - from.y : c.x - from.x)) * sign, across = Math.abs(v ? c.x - from.x : c.y - from.y);
        if (o.st !== 'dead' && along > -0.2 && along < reach && across < 0.75) { damage(s, o, power(s, who) * mult, 0.25, from); hit++; me.target = o; }
    }
    return hit;
}

// ---- her buttons
const busy = () => me.act && me.act.until > now();
export function attack() {
    const s = getState();
    if (!s || !isDuat(mapId) || me.down || busy() || me.cdAttack > now()) return;
    engage();
    me.cdAttack = now() + ATTACK_CD;
    me.act = { name: 'anticipation', at: now(), until: now() + SHOW.anticipation };
    setTimeout(() => {
        if (me.down) return;
        me.act = { name: 'attack', at: now(), until: now() + SHOW.attack };
        strike(s, leadOf(s), feet(), me.vdir || me.face);
    }, SHOW.anticipation * 1000);
}
export function skill() {
    const s = getState();
    if (!s || !isDuat(mapId) || me.down || busy() || me.cdSkill > now()) return;
    engage();
    me.cdSkill = now() + SKILL_CD;
    me.act = { name: 'skill', at: now(), until: now() + SHOW.skill };
    useSkill(s, leadOf(s), feet(), me.face, true);
}
// each one's own 기술 (no name is shown, user: "오글거린다"); the one with her uses theirs too (MATE_SKILL_CD)
function useSkill(s, who, f, face, lead) {
    const hits = (g, r, n, push) => { for (const o of mobs) { const c = centre(o); if (o.st !== 'dead' && Math.hypot(c.x - g.x, c.y - g.y) < r) damage(s, o, n, push, g, 'skill'); } };
    if (who === 'set') hits(f, 2, power(s, who) * 2, 0.8);              // 모래폭풍 강타: everything around, twice as hard, pushed away
    else if (who === 'horus') {                                          // 하늘에서 내리꽂기
        if (lead) {   // up, 2.5 tiles ahead, down on everything around where he lands
            const dir = face === 'right' ? 1 : -1, x0 = player.x;
            let x1 = x0;
            for (let k = 1; k <= 25; k++) { const x = x0 + dir * k * 0.1; if (solid(map(), x, player.y)) break; x1 = x; }
            me.act.jump = { x0, x1 };
            setTimeout(() => hits(feet(), 1.2, power(s, who) * 2, 0.5), SHOW.jump * 1000);
        } else {      // the one with her: up and down in their place, onto what is in front
            mate.act.hop = true;
            setTimeout(() => hits({ x: f.x + (face === 'right' ? 0.8 : -0.8), y: f.y }, 1.2, power(s, who) * 2, 0.5), SHOW.jump * 1000);
        }
    } else {                                                             // 엄호: 2 seconds no harm to either, what is close pushed back
        me.shield = now() + 2;
        hits(f, 1.5, 1, 0.5);
    }
}
export function spell() {
    const s = getState();
    if (!s || !isDuat(mapId) || me.down || busy()) return;
    const r = run(s);
    if (r.spells <= 0) { ui?.toast((statsOf(s, leadOf(s))?.faith || 0) > 0 ? '이번 원정의 주문은 다 썼어' : '신앙이 있어야 주문을 쓸 수 있어'); return; }
    r.spells--; engage();
    const heal = 4 + (statsOf(s, leadOf(s))?.faith || 0);
    for (const who of Object.keys(r.hp)) if (r.hp[who] > 0) r.hp[who] = Math.min(r.max[who], r.hp[who] + heal);
    r.fear = Math.max(0, r.fear - 2);
    me.act = { name: 'spell', at: now(), until: now() + SHOW.spell };
    const f = feet(); pop(f.x, f.y - 2.6, `+${heal}`, '#9cf0b0');
    save();
}

// ---- the one walking with her fights by themselves
// whom the one with her fights: the creature she last struck (both on one), else the one nearest her
function mateTarget() {
    const f = feet(), ok = o => o && o.st !== 'dead' && !o.gone && mobs.includes(o) && Math.hypot(centre(o).x - f.x, centre(o).y - f.y) < FIGHT_NEAR;
    if (ok(me.target)) return me.target;
    const n = nearestMob(f);
    return n && n.d < FIGHT_NEAR ? n.o : null;
}
// they strike only standing in their place, facing it, level with it and within reach (no blows at the air)
function stepMate(dt, s) {
    const w = withOf(s);
    if (!w || mate.down || (run(s).hp[w] ?? 0) <= 0 || !stance.on) return;
    if (mate.cd > now() || (mate.act && mate.act.until > now())) return;
    const p = follower(), c = { x: p.x + 0.5, y: p.y + 0.8 }, reach = F().reach?.[w] || 1.4, o = mateTarget();
    if (!o) return;
    const oc = centre(o), dx = oc.x - c.x, dy = oc.y - c.y;
    mate.face = dx >= 0 ? 'right' : 'left';
    if (p.moving || Math.abs(dy) > 0.6 || Math.abs(dx) > reach + 0.2) return;
    if (mate.cdSkill <= now()) {
        mate.cdSkill = now() + MATE_SKILL_CD; mate.cd = now() + 1.2; engage();
        mate.act = { name: 'skill', at: now(), until: now() + SHOW.skill };
        useSkill(s, w, c, mate.face, false);
        return;
    }
    mate.cd = now() + 1.2; engage();
    mate.act = { name: 'attack', at: now(), until: now() + SHOW.attack };
    damage(s, o, Math.max(1, power(s, w) - 1), 0.2, c);
}

// ---- every frame
const map = () => currentMap();
onFrame((dt, m, u) => {
    ui = u;
    const s = getState();
    if (!s) return;
    if (!isDuat(m.id)) {
        if (s.duatField) { s.duatField = null; saveState(); }
        if (mapId) { mapId = ''; mapObj = null; runObj = null; mobs = []; bolts = []; mateWalk.pos = null; stance.on = false; hud(false); }
        return;
    }
    // a new map object each time she arrives (enterMap), or a new run: the creatures of this map again
    if (m !== mapObj || s.duatField !== runObj) {
        mapId = m.id; mapObj = m; runObj = run(s);
        Object.assign(me, { act: null, vdir: null, down: false, shield: 0, target: null }); Object.assign(mate, { act: null, down: false, shown: false, cdSkill: now() + 3 });
        Object.assign(stance, { on: false, since: -9, last: -9 }); mateWalk.pos = null;
        spawn(m, s);
    }
    hud(true, s, m);
    // the way she faces: sideways (me.face), and up or down after walking that way until she walks sideways again
    if (input.dx > 0.2) me.face = 'right'; else if (input.dx < -0.2) me.face = 'left';
    const ax = Math.abs(input.dx), ay = Math.abs(input.dy);
    if (ay > ax * VERT) me.vert = true; else if (ax > ay * VERT) me.vert = false;
    if (player.moving) me.vdir = me.vert ? (input.dy > 0 ? 'down' : 'up') : null;
    stepStance();
    if (stance.on) player.dir = me.vdir || me.face;
    // Horus's dive moves him while the skill plays
    const j = me.act?.jump;
    if (j) { const k = Math.min(1, (now() - me.act.at) / SHOW.jump); player.x = j.x0 + (j.x1 - j.x0) * k; me.act.lift = Math.sin(Math.PI * k) * 1.2; }
    // the one with her, in Horus's dive: up and down where they stand
    if (mate.act?.hop) { const k = Math.min(1, (now() - mate.act.at) / SHOW.jump); mate.act.lift = Math.sin(Math.PI * k) * 1.2; }
    for (const o of mobs) stepMob(m, o, dt, s);
    mobs = mobs.filter(o => !o.gone);
    stepBolts(dt, s);
    stepMateWalk(dt, s);
    stepMate(dt, s);
    pops = pops.filter(p => now() - p.at < 1);
    fx = fx.filter(e => now() - e.at < e.dur);
});
onBusy(() => isDuat(mapId) && (mobs.length > 0 || pops.length > 0 || fx.length > 0));
// 말 걸기 is 공격 down here, unless a place is right by her and nothing is close
onTalkFirst(nearSpot => {
    if (!isDuat(mapId) || gameMode() !== 'open') return false;
    const f = feet(), threat = mobs.some(o => o.st !== 'dead' && Math.hypot(centre(o).x - f.x, centre(o).y - f.y) < 2);
    if (nearSpot && !threat) return false;
    attack();
    return true;
});
window.addEventListener('keydown', e => {
    if (!isDuat(mapId) || gameMode() !== 'open' || e.repeat || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)) return;
    if (e.code === 'KeyJ' || e.code === 'KeyZ') { attack(); e.preventDefault(); }
    else if (e.code === 'KeyK' || e.code === 'KeyX') { skill(); e.preventDefault(); }
    else if (e.code === 'KeyL' || e.code === 'KeyC') { spell(); e.preventDefault(); }
}, true);

// ---- drawing: her and the one with her in their combat pictures, the creatures, sand shots and numbers
const STEP_BOB = 0.09, STEP_S = 0.4;   // without armed walk pictures: the ready pictures, a step bob (tiles up, seconds a step)
const actNow = (st, who, walkT = 0) => {
    const t = now();
    if (st.act && (st.act.until > t || st.down)) return { name: st.act.name, t: t - st.act.at, lift: st.act.lift || 0 };
    if (walkT && DATA.sprites?.looks?.[who]?.combat?.acts?.walk) return { name: 'walk', t: walkT, lift: 0 };
    // 공포 7 and over: standing, the tired picture instead of ready (the fear shows on them)
    if (!walkT && (getState()?.duatField?.fear || 0) >= TIRED_FEAR && DATA.sprites?.looks?.[who]?.combat?.acts?.tired) return { name: 'tired', t: 0, lift: 0 };
    return { name: 'ready', t, lift: walkT ? Math.abs(Math.sin(Math.PI * walkT / STEP_S)) * STEP_BOB : 0 };
};
onDraw(scene => {
    if (!isDuat(mapId) || !isDuat(scene.map?.id)) return;
    const s = getState(); if (!s) return;
    const t = now(), blink = st => t - st.hurtAt < INVULN;
    // her: calm = her ordinary pictures; fighting = the combat ones, all four ways
    if (stance.on) {
        const c = actNow(me, leadOf(s), player.moving ? player.walkT || 0.001 : 0);
        scene.lead.combat = { ...c, face: me.face, blink: blink(me) };
        scene.lead.dir = me.vdir || me.face;
    }
    for (const p of scene.people) if (p.mate) {
        // the one with her takes up the fighting pictures (or puts them down) only while standing, as she does
        if (!p.moving || mate.act) mate.shown = stance.on || mate.down;
        if (!mate.shown) continue;
        // walking up or down: the armed front / back walk; otherwise sideways, the way they face
        if (p.moving && (p.dir === 'left' || p.dir === 'right')) mate.face = p.dir;
        if (!(p.moving && (p.dir === 'up' || p.dir === 'down') && !mate.down)) p.dir = mate.face;
        const mc = actNow(mate, withOf(s), mate.down ? 0 : p.moving ? p.walkT || 0.001 : 0);
        p.combat = { ...mc, face: mate.face, blink: blink(mate) }; p.act = null;
    }
    for (const o of mobs) scene.extra.push({ x: o.x, y: o.y, draw: (g, sx, sy, z, ts) => drawMob(g, o, sx, sy, z, ts) });
    scene.extra.push({ x: 0, y: 1e6, draw: (g, sx, sy, z, ts) => drawTop(g, z, ts, sx, sy) });
});
function drawMob(g, o, sx, sy, z, ts) {
    const d = DATA.sprites?.enemies?.[o.kind];
    if (!d) return;
    const a = (31.2 * z <= d.small.visible + 1 && spriteFile(d.small.file)) ? d.small : spriteFile(d.file) ? d : spriteFile(d.small.file) ? d.small : null;
    const gx = sx + 8 * z, gy = sy + 16 * z, t = now(), T = timing(o);
    // the shadow on the floor: smaller and lighter while it is high
    const bob = Math.sin((t / BOB_S) * Math.PI * 2 + o.phase), warn1 = o.st === 'prepare' && o.t >= T.prepare[0];
    const up = o.st === 'prepare' ? 0.1 * Math.min(1, o.t / T.prepare[0]) : 0;
    g.fillStyle = `rgba(20,12,6,${o.st === 'dead' ? 0.12 : 0.24 - 0.05 * bob})`;
    g.beginPath(); g.ellipse(gx, gy - 0.5 * z, 0.45 * ts * (1 - 0.15 * bob), 0.13 * ts, 0, 0, Math.PI * 2); g.fill();
    if (!a) return;
    const motion = o.st === 'dead' ? 'disappear' : o.st === 'hit' ? 'hit' : o.st === 'guard' ? 'guard'
        : o.st === 'prepare' ? (warn1 ? 'prepare-1' : 'prepare-0')
        : o.st === 'attack' ? 'attack-0' : o.st === 'recover' ? 'attack-1'
        : IDLE_LOOP[Math.floor((t + o.phase) / T.idle) % IDLE_LOOP.length];
    const r = a.frames[motion] || a.frames['idle-0'], k = 31.2 * z / a.visible;   // the atlas has a character's height in `visible` px
    // floating: lifted off the floor and bobbing, except while it warns, strikes, is hit, guards or breaks
    const still = !['wander', 'chase'].includes(o.st);
    const die = o.st === 'dead' ? Math.max(0, o.t - T.die[0]) / T.die[1] : 0;   // the broken picture holds, then sinks away
    const baseY = gy - (FLOAT + up + (still ? 0 : BOB * bob) - Math.min(1, die) * 0.3) * ts;   // the bottom of its body
    const shake = warn1 ? Math.sin(t * 60) * z * 0.6 : 0;
    g.save();
    g.globalAlpha = o.st === 'dead' ? Math.max(0, 1 - die) : 1;
    g.translate(gx + shake, baseY);
    if (o.faceR) g.scale(-1, 1);   // the pictures face left: mirrored to face someone on its right (user: it looked away)
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(DATA.spriteArt[a.file], r[0], r[1], r[2], r[3], -r[4] * k, -r[5] * k, r[2] * k, r[3] * k);
    g.restore();
    // its 체력 as a straight bar over it: hidden while it drifts on its own, shown once it has met them and for a
    // while after a hit (a dot-art bar comes later, user)
    if ((o.st !== 'wander' || t - o.shownAt < 3) && o.st !== 'dead') {
        const w = 0.9 * ts, x = gx - w / 2, y = baseY - (r[5] * k) - 4 * z;
        g.fillStyle = 'rgba(20,12,6,.8)'; g.fillRect(x - z, y - z, w + 2 * z, 4 * z);
        g.fillStyle = '#e8584a'; g.fillRect(x, y, w * Math.max(0, o.hp) / o.e.hp, 2 * z);
    }
    g.imageSmoothingEnabled = false;
}
const SAND = ['#f3dca4', '#e2bd7c', '#c9995a'];
function drawTop(g, z, ts, ox, oy) {
    // ox, oy: where (0, 1e6) landed; the camera is ox, oy − 1e6·ts
    const cx = -ox, cy = -(oy - 1e6 * ts), t = now();
    // sand shots: a small bunch of grains turning about its middle, a few dropping behind, a shadow under it
    for (const b of bolts) {
        const x = b.x * ts - cx, y = (b.y - BOLT_LIFT) * ts - cy, gy = b.y * ts - cy, R = 0.11 * ts, sp = Math.hypot(b.vx, b.vy) || 1;
        g.fillStyle = 'rgba(20,12,6,.18)'; g.beginPath(); g.ellipse(x, gy, R * 1.2, R * 0.4, 0, 0, Math.PI * 2); g.fill();
        for (let i = 0; i < 5; i++) {   // the trail
            const back = (i + 1) * 0.09 * ts, jit = Math.sin(t * 30 + i * 2.1 + b.seed) * 0.03 * ts;
            g.globalAlpha = 0.55 - i * 0.1; g.fillStyle = SAND[i % 3];
            const s2 = Math.max(1, (0.045 - i * 0.006) * ts);
            g.fillRect(x - b.vx / sp * back - s2 / 2 + jit, y - b.vy / sp * back - s2 / 2 - jit, s2, s2);
        }
        g.globalAlpha = 1;
        for (let i = 0; i < 7; i++) {   // the bunch
            const a = b.seed + i * 0.9 + t * 9, rr = R * (0.25 + 0.75 * ((i * 37) % 7) / 7), s2 = Math.max(1.5, (0.05 + 0.02 * (i % 3)) * ts);
            g.fillStyle = SAND[i % 3]; g.fillRect(x + Math.cos(a) * rr - s2 / 2, y + Math.sin(a) * rr * 0.8 - s2 / 2, s2, s2);
        }
    }
    // 엄호: a light ring on the floor round each of the two while it lasts (no light on their bodies, user)
    if (me.shield > t) {
        const s = getState(), w = s && withOf(s), spots = [feet()];
        if (w && !mate.down) { const p = follower(); spots.push({ x: p.x + 0.5, y: p.y + 0.8 }); }
        const k = 0.5 + 0.5 * Math.sin(t * 8);
        g.strokeStyle = '#9fd6ff'; g.lineWidth = Math.max(1, 1.6 * z);
        for (const f of spots) {
            const x = f.x * ts - cx, y = f.y * ts - cy;
            g.globalAlpha = 0.45 + 0.35 * k; g.beginPath(); g.ellipse(x, y - 0.1 * ts, 0.55 * ts, 0.2 * ts, 0, 0, Math.PI * 2); g.stroke();
        }
        g.globalAlpha = 1;
    }
    // the shared effects
    for (const e of fx) {
        const k = (t - e.at) / e.dur, x = e.x * ts - cx, y = (e.y - e.lift) * ts - cy;
        if (k < 0 || k > 1) continue;
        g.globalAlpha = 1 - k;
        if (e.kind === 'spark') {   // a few thin rays out from the middle, quick
            g.strokeStyle = e.color; g.lineCap = 'round';
            for (let i = 0; i < 6; i++) {
                const a = e.a0 + i * Math.PI / 3, r0 = 0.08 * ts * e.size * k, r1 = (0.15 + 0.35 * Math.sqrt(k)) * ts * e.size * (i % 2 ? 0.6 : 1);
                g.lineWidth = Math.max(1, (i % 2 ? 1 : 1.6) * z * (1 - k));
                g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.stroke();
            }
        } else if (e.kind === 'ring') {   // a circle that opens out and fades
            g.strokeStyle = e.color; g.lineWidth = Math.max(1, 2 * z * (1 - k));
            g.beginPath(); g.ellipse(x, y, (0.2 + 0.45 * k) * ts * e.size, (0.2 + 0.45 * k) * ts * e.size * 0.85, 0, 0, Math.PI * 2); g.stroke();
        } else {   // shards: little stone bits thrown out and falling
            for (const p of e.bits) {
                const tt = k * e.dur, px = x + Math.cos(p.a) * p.v * tt * ts * 0.5, py = y + Math.sin(p.a) * p.v * tt * ts * 0.3 - (p.up * tt - 4 * tt * tt) * ts * 0.5, r = p.r * ts;
                g.fillStyle = p.c; g.fillRect(px - r / 2, py - r / 2, r, r);
            }
        }
    }
    g.globalAlpha = 1;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const p of pops) {
        const a = (t - p.at), x = p.x * ts - cx, y = (p.y - a * 0.8) * ts - cy;
        g.font = `800 ${Math.round(7 * z)}px 'Noto Sans KR', sans-serif`;
        g.globalAlpha = Math.max(0, 1 - a); g.lineWidth = 2 * z; g.strokeStyle = 'rgba(30,18,10,.85)';
        g.strokeText(p.text, x, y); g.fillStyle = p.color; g.fillText(p.text, x, y);
    }
    g.globalAlpha = 1;
}

// ---- the HUD down here: 체력 each, 공포, where (a small box right under the hint line, on its left edge), and the 기술 · 주문 buttons over 공격
let el = null;
function hud(show, s, m) {
    const root = document.getElementById('sf_game');
    if (!root) return;
    if (!el) {
        el = { box: document.createElement('div'), btns: document.createElement('div') };
        el.box.className = 'sf_duat_hud';
        el.btns.className = 'sf_duat_btns';
        el.btns.innerHTML = '<button type="button" class="sf_duat_skill">기술</button><button type="button" class="sf_duat_spell">주문<em></em></button>';
        el.btns.querySelector('.sf_duat_skill').addEventListener('click', skill);
        el.btns.querySelector('.sf_duat_spell').addEventListener('click', spell);
    }
    const actions = root.querySelector('.sf_actions'), talk = root.querySelector('.sf_talk');
    if (!show) {
        el.box.remove(); el.btns.remove();
        if (talk?.dataset.duat) { talk.querySelector('span').textContent = '말 걸기'; delete talk.dataset.duat; talk.classList.remove('sf_attack'); }
        return;
    }
    if (!el.box.isConnected) root.append(el.box);
    if (!el.btns.isConnected && actions) actions.append(el.btns);
    if (talk && !talk.dataset.duat) { talk.dataset.duat = '1'; talk.querySelector('span').textContent = '공격'; talk.classList.add('sf_attack'); }
    // right under the hint line (or the chips when there is no hint), whatever the theme puts them
    const hint = root.querySelector('.sf_hint_pill'), chips = root.querySelector('.sf_chip_sun')?.parentElement;
    const above = hint && !hint.hidden ? hint : chips;
    if (above) {
        const top = `${Math.round(above.offsetTop + above.offsetHeight + 6)}px`, left = `${Math.round(above.offsetLeft)}px`;
        if (el.box.style.top !== top) el.box.style.top = top;
        if (el.box.style.left !== left) el.box.style.left = left;
    }
    const r = run(s), t = now(), no = Number(m.id.slice(5));
    const bar = (label, v, max, cls) => `<div class="sf_duat_bar ${cls}"><span>${label} ${v}/${max}</span><i style="width:${Math.round(100 * Math.max(0, v) / max)}%"></i></div>`;
    const html = `<b>${m.d.name || ''} ${no}/7</b>` + Object.keys(r.hp).map(w => bar(HERO_NAME[w], r.hp[w], r.max[w], 'sf_hp')).join('') + bar('공포', r.fear, FEAR_MAX, 'sf_fear');
    if (el.box._html !== html) { el.box.innerHTML = html; el.box._html = html; }
    // 기술: the time left darkens it round like a clock; 주문: how many are left in the corner
    const sk = el.btns.querySelector('.sf_duat_skill'), sp = el.btns.querySelector('.sf_duat_spell');
    const left = Math.max(0, me.cdSkill - t), cd = (left / SKILL_CD).toFixed(3);
    if (sk.style.getPropertyValue('--cd') !== cd) sk.style.setProperty('--cd', cd);
    sk.disabled = left > 0 || me.down;
    const em = sp.querySelector('em'); if (em.textContent !== String(r.spells)) em.textContent = r.spells;
    sp.classList.toggle('sf_empty', r.spells <= 0); sp.disabled = me.down;
}

// for tests: what is going on down here, one creature put by her, numbers over the data
// tests only: turn her a way (left, right, up, down) as walking that way would
export function testFace(d) { if (d === 'left' || d === 'right') { me.face = d; me.vdir = null; } else me.vdir = d; }
export const fieldState = () => ({ map: mapId, mobs: mobs.map(o => ({ kind: o.kind, st: o.st, t: +o.t.toFixed(2), hp: o.hp, x: +o.x.toFixed(2), y: +o.y.toFixed(2) })), me: { act: me.act?.name || '', down: me.down, face: me.face, vdir: me.vdir }, stance: stance.on, mateAt: mateWalk.pos ? { x: +mateWalk.pos.x.toFixed(2), y: +mateWalk.pos.y.toFixed(2) } : null, mate: { act: mate.act?.name || '', down: mate.down }, run: getState()?.duatField });
export function testOnly(kind, x, y, numbers = {}) { tune[kind] = numbers; mobs = [makeMob(99, kind, x, y)]; bolts = []; fx = []; }
