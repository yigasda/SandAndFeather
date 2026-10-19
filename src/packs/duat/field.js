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
// The desert maps that have creatures (data/desert.json, B3 onward) fight the same way with the Duat's shared timings,
// reach and spells and their own creatures, put where the data says (spawnId), not at random. There a creature struck
// down stays down until a game day has passed and she comes into the map again (user: bosses too); the first time each
// one fell and the day it last fell are kept apart (s.desertFight.first / killed), and only her 체력·공포 of the fight
// (s.desertFight.run) end when she leaves. Gone down there, she is back at the map's way in, nothing lost.

import { DATA, releaseSprites, spriteFile } from '../../core/data.js';
import { getState, saveState } from '../../core/state.js';
import { HERO_NAME, leadOf, statsOf, withOf } from '../../core/heroes.js';
import { behind, feet, follower, mateWalk, player } from '../../world/player.js';
import { bindPress, input } from '../../world/input.js';
import { currentMap, gameMode, onBusy, onDraw, onFrame, onTalkFirst, travel } from '../../ui/window.js';
import { josa } from '../../core/ko.js';
import { today } from '../../core/ledger.js';

const isDuat = id => /^duat_\d+$/.test(id || '');
const isDesert = id => !!DATA.desert?.maps?.[id];
const isField = id => isDuat(id) || isDesert(id);
// the numbers: the Duat's own; a desert map the Duat's shared ones (timing, reach, spells) with its own creatures
const F = () => isDesert(mapId) ? { ...(DATA.duat?.field || {}), enemies: DATA.desert.enemies } : DATA.duat?.field || {};
const fight = s => (s.desertFight ||= { run: null, killed: {}, first: {} });
// the fight going on now (체력, 공포, 주문): the Duat's run, or this desert visit's
const runNow = s => (isDesert(mapId) ? s?.desertFight?.run : s?.duatField) || null;
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
// tests only: what happened when (guard up / down, blows: the state just before, the damage, the state after); read, never acted on
// tests only: the 기술 areas lately used, drawn with the creatures' hurt range when testRanges(true) (comparison pictures)
const areas = []; let showRanges = false;
const events = [], note = e => { events.push({ t: +now().toFixed(3), ...e }); if (events.length > 300) events.shift(); };
// what she and the one with her are doing now: { name, at, until, lift, face }
const me = { act: null, face: 'right', vdir: null, cdAttack: 0, cdSkill: 0, cdUlt: 0, hurtAt: -9, shield: 0, down: false, vert: false, target: null };
const mate = { act: null, face: 'right', cd: 0, cdSkill: 0, hurtAt: -9, down: false, shown: false };
// fighting or calm: on (what she shows), since (when it last changed), last (the last time a fight was going on)
const stance = { on: false, since: -9, last: -9 };

// ---- the run
const maxHp = (s, who) => 13 + 3 * (statsOf(s, who)?.strength || 0);
function run(s) {
    if (runNow(s)) return runNow(s);
    const lead = leadOf(s), w = withOf(s), hp = {};
    for (const who of [lead, w].filter(Boolean)) hp[who] = maxHp(s, who);
    const r = { v: 1, hp, max: { ...hp }, fear: 0, spells: (statsOf(s, lead)?.faith || 0) > 0 ? F().spells || 3 : 0, cleared: {} };
    if (isDesert(mapId)) fight(s).run = r; else s.duatField = r;
    return r;
}
let saveSoon = 0;
const save = () => { clearTimeout(saveSoon); saveSoon = setTimeout(() => saveState(), 1200); };

// ---- the creatures of this map
const solid = (m, x, y) => m.solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
function makeMob(i, kind, x, y) {
    const e = { ...F().enemies[kind], ...(tune[kind] || {}) };
    return { i, kind, e, x, y, hp: e.hp, st: 'wander', t: 0, tx: x, ty: y, wait: rand(0, 1.5), phase: rand(0, 6.28), shownAt: -9, guardAt: 0, steadyAt: 0, restAt: 0 };
}
// a creature's sheets (both sizes), and only the kinds this map has kept in memory: the rest let go (사용자 10-19: the
// pictures of maps she has left do not pile up). A kind's sheets load when it is first drawn (drawMob → spriteFile).
const kindFiles = kinds => kinds.flatMap(k => { const d = DATA.sprites?.enemies?.[k]; return d ? [...(d.sheets || [d.file]), ...(d.small?.sheets || [d.small?.file])].filter(Boolean) : []; });
// the 궁 pictures of the two who are here (data/art/fx/ult, original pixels, field.ult.fx): asked for on coming into a
// field so the first 궁 does not wait for them; let go when she leaves the fields
const ultFiles = (whoList = ['set', 'horus', 'somang']) => whoList.flatMap(w => (F().ult?.fx?.[w]?.frames || []).map(f => f.file));
function ultArt(s) { const w = withOf(s), keep = [leadOf(s), w].filter(Boolean); for (const f of ultFiles(keep)) spriteFile(f); releaseSprites(ultFiles().filter(f => !ultFiles(keep).includes(f))); }
function keepArt(kinds) {
    const keep = new Set(kindFiles(kinds));
    releaseSprites(kindFiles(Object.keys(DATA.sprites?.enemies || {})).filter(f => !keep.has(f)));
}
function spawn(m, s) {
    mobs = []; bolts = []; pops = []; fx = [];
    try { spawnHere(m, s); } finally { keepArt([...new Set(mobs.map(o => o.kind))]); }
}
function spawnHere(m, s) {
    if (isDesert(m.id)) {   // where the data puts them; one struck down today stays down
        const f = fight(s), day = today(s);
        DATA.desert.maps[m.id].spawns.forEach((sp, i) => {
            if (f.killed[sp.id] != null && f.killed[sp.id] >= day) return;
            mobs.push(Object.assign(makeMob(i, sp.kind, sp.x, sp.y), { sid: sp.id }));
        });
        return;
    }
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
// 입구 안전구역(사용자 10-19: 입장하자마자 공격받거나 출구가 몹에게 막히지 않게; 착지는 옮기지 않음): on a desert map,
// round each landing and along the way from it to its own exit (the exit of the same name), SAFE_R people-widths wide.
// A creature does not walk or dash into it, does not pick a wandering point in it, and does not start a blow at someone
// in it — unless they struck it from there in the last PROVOKED seconds (no hitting it from shelter for free); it still
// stays out. The Duat's fights are as approved (no zones there).
const SAFE_R = 2.5, PROVOKED = 3;
let safeOf = null;   // [the map object, its zones]
function safeZones() {
    const m = map();
    if (!m || !isDesert(m.id)) return [];
    if (safeOf?.[0] === m) return safeOf[1];
    const r = SAFE_R * (m.d.actorScale || 1), zones = [];
    for (const [k, e] of Object.entries(m.d.entries || {})) {
        const a = { x: e.x + 0.5, y: e.y + 0.8 }, own = (m.d.exits || []).find(x => x.id === k);
        zones.push({ a, b: own ? { x: (own.x0 + own.x1) / 2, y: (own.y0 + own.y1) / 2 } : a, r });
    }
    safeOf = [m, zones];
    return zones;
}
// how deep a point (feet) is inside the zones, in tiles; 0 outside
function safeDepth(p) {
    let d = 0;
    for (const z of safeZones()) {
        const vx = z.b.x - z.a.x, vy = z.b.y - z.a.y, L = vx * vx + vy * vy;
        const t = L ? Math.max(0, Math.min(1, ((p.x - z.a.x) * vx + (p.y - z.a.y) * vy) / L)) : 0;
        d = Math.max(d, z.r - Math.hypot(p.x - z.a.x - t * vx, p.y - z.a.y - t * vy));
    }
    return d;
}
const sheltered = (o, p) => safeDepth(p) > 0 && !(now() - (o.provoked?.[p.who] ?? -99) < PROVOKED);
// a step from (x, y) to (nx, ny) (top-left) that takes its feet deeper into a zone
const intoSafe = (x, y, nx, ny) => { const d1 = safeDepth({ x: nx + 0.5, y: ny + 0.8 }); return d1 > 0 && d1 > safeDepth({ x: x + 0.5, y: y + 0.8 }) - 1e-6; };
function stepMob(m, o, dt, s) {
    o.t += dt;
    const T = timing(o), c = centre(o), tg = targets(s).map(p => ({ p, d: Math.hypot(p.x - c.x, p.y - c.y) })).sort((a, b) => a.d - b.d);
    // how near it notices: AGGRO from its feet's middle (the approved 4), and a kind's own `aggro` on top (data; a boss
    // may watch its whole room). Its reach, keeping its distance and the dash stay from its feet's middle too
    const A = AGGRO + (o.e.aggro || 0);
    // whom it goes for: the one it already fights (or who last struck it) while they stay in reach, else the nearest
    let near = tg.find(q => q.p.who === o.foe && q.d < A + 2.5) || tg[0];
    if (near && near.d >= A && near.p.who !== o.foe) near = null;
    o.foe = near ? near.p.who : (tg[0]?.d < A ? tg[0].p.who : null);
    // it looks at whom it fights, standing too (guarding, struck, open after a blow; user: they faced away), not while
    // its line is fixed or it flies along it; walking, it faces the way it goes (move)
    if (near && o.st !== 'dead' && o.st !== 'attack' && !(o.st === 'prepare' && o.aim)) { const dx = near.p.x - c.x; if (Math.abs(dx) > 0.3) o.faceR = dx > 0; }
    const move = (tx, ty, speed) => {
        const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
        if (d < 0.05) return true;
        if (Math.abs(dx) > 0.05) o.faceR = dx > 0;
        let k = Math.min(d, speed * dt) / d, nx = o.x + dx * k, ny = o.y + dy * k;
        // not on top of another creature: a little push away from any within 0.9
        for (const q of mobs) if (q !== o && q.st !== 'dead') { const e = centre(q), ex = c.x - e.x, ey = c.y - e.y, ed = Math.hypot(ex, ey); if (ed < 0.9 && ed > 0.01) { nx += ex / ed * speed * dt * 0.5; ny += ey / ed * speed * dt * 0.5; } }
        let moved = false;
        if (!solid(map(), nx, o.y) && !intoSafe(o.x, o.y, nx, o.y)) { o.x = nx; moved = true; }
        if (!solid(map(), o.x, ny) && !intoSafe(o.x, o.y, o.x, ny)) { o.y = ny; moved = true; }
        return !moved;
    };
    // along the way round walls to a point
    const go = (tx, ty, speed) => { const w = wayTo(o, tx, ty); return w ? move(w.x, w.y, speed) : true; };
    switch (o.st) {
        case 'dead': if (o.t > T.die[0] + T.die[1]) o.gone = true; return;
        case 'hit': if (o.t > o.stun) { o.st = 'chase'; o.t = 0; } return;
        case 'guard':   // it opens and strikes back, the whole warning first
            if (o.t > T.guard) { o.t = 0; note({ ev: 'guardEnd', mob: o.i }); if (near && !sheltered(o, near.p)) warn(o, near.p); else o.st = 'chase'; }
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
                    if (solid(map(), nx, ny) || intoSafe(o.x, o.y, nx, ny)) o.t = d.time; else { o.x = nx; o.y = ny; }
                    const cc = centre(o);
                    for (const p of targets(s)) if (!o.struck.has(p.who) && !sheltered(o, p) && Math.hypot(p.x - cc.x, p.y - cc.y) < d.hit) { o.struck.add(p.who); hurt(s, p.who, o.e.atk); }
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
        if (near.d <= o.e.range && seen && now() >= o.restAt && !sheltered(o, p)) { warn(o, p); return; }
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
        for (let k = 0; k < 20; k++) { const tx = c.x + rand(-4, 4), ty = c.y + rand(-4, 4); if (!solid(map(), tx - 0.5, ty - 0.8) && !safeDepth({ x: tx, y: ty })) { o.tx = tx; o.ty = ty; break; } }
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
    for (const o of mobs) { if (o.st === 'dead') continue; const d = toTorso(hurtArea(o), from).d; if (d < bd) { bd = d; best = o; } }   // to its torso's edge
    return best ? { o: best, d: bd } : null;
}
// where a creature is from her: the nearest point of its shapes (its torso, what it holds out) and how far
function nearPoint(o, f) {
    const t = toTorso(hurtArea(o), f), fl = frontLine(o);
    if (!fl) return t;
    const x = Math.min(Math.max(f.x, fl.x0), fl.x1), d = Math.hypot(x - f.x, fl.y - f.y);
    return d < t.d ? { d, x, y: fl.y } : t;
}
const WAYS = ['left', 'right', 'up', 'down'];
const wayOf = (dx, dy) => Math.abs(dy) > Math.abs(dx) * VERT ? (dy > 0 ? 'down' : 'up') : dx >= 0 ? 'right' : 'left';
// the way to turn for a blow of this reach (사용자 10-19: 타겟팅): of the creatures her blow can meet one way or
// another, the nearest (its torso or fists rather than only its shield), the way of those nearest to where it is;
// none in reach: toward the nearest one's nearest point (within `far`). → { o, way } or null
function aimWay(f, reach, far = Infinity, ways = WAYS) {
    let best = null;
    for (const o of mobs) {
        if (o.st === 'dead') continue;
        const p = nearPoint(o, f); if (p.d > far) continue;
        // standing within its shape (its torso is over her on the floor): toward its torso's middle
        const a = hurtArea(o), dx = p.d > 0.05 ? p.x - f.x : a.x - f.x, dy = p.d > 0.05 ? p.y - f.y : a.y - f.y, len = Math.hypot(dx, dy) || 1;
        let way = null, wk = -1, rank = 3;
        for (const w of ways) {
            const m = blowMeets(o, f, w, reach); if (!m) continue;
            const v = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[w], dot = (v[0] * dx + v[1] * dy) / len, r = m === 'shield' ? 1 : 0;
            if (r < rank || (r === rank && dot > wk)) { rank = r; wk = dot; way = w; }
        }
        const key = [way ? rank : 3, p.d];
        if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && key[1] < best.key[1])) best = { o, way: way || (ways === WAYS ? wayOf(dx, dy) : dx >= 0 ? 'right' : 'left'), key };
    }
    return best;
}
function faceWay(way) {
    if (way === 'left' || way === 'right') { me.face = way; me.vdir = null; } else me.vdir = way;
    if (stance.on) player.dir = me.vdir || me.face;
}
let held = false;   // tests only: as if the stick were held
function faceMob() {
    if (held) return;   // the stick held: its way (tests: testHold)
    const a = aimWay(feet(), F().reach?.[leadOf(getState())] || 1.4);
    if (a) faceWay(a.way);
    else if (player.dir === 'left' || player.dir === 'right') { me.face = player.dir; me.vdir = null; }
    else me.vdir = player.dir;
}
// 공격 / 기술 with the stick let go: she turns the way her blow meets a creature (else toward the nearest within her
// reach and a step), so she strikes the way she faces it (user: she faced away from it); the stick held, its way
function turnToFoe(reach, ways) {
    if (held || Math.abs(input.dx) > 0.2 || Math.abs(input.dy) > 0.2) return;
    const a = aimWay(feet(), reach, reach + 1, ways);
    if (a) faceWay(a.way);
}
// a button, a hit: fighting at once (she is doing something, so the change does not show as a flicker)
function engage() {
    stance.last = now();
    if (!stance.on) { stance.on = true; stance.since = now(); faceMob(); }
}
function stepStance() {
    const t = now(), f = feet();
    if (mobs.some(o => ACTIVE.includes(o.st) && toTorso(hurtArea(o), f).d < FIGHT_NEAR)) stance.last = t;   // from its torso's edge
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
            // (사용자 10-19: 타겟팅) its shape: level with its torso, their reach from its edge
            const c = hurtArea(o), ps = f.x <= c.x ? -1 : 1;
            for (const [side, dy] of [[-ps, 0], [-ps, 0.35], [-ps, -0.35], [ps, 0.9], [ps, -0.9]]) {
                const gx = c.x + side * (c.r + reach * 0.75), gy = c.y + dy;
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
    let dmg = Math.max(1, atk + Math.round(rand(-1, 1)) - (who === 'set' ? 1 : 0));
    // 소망's lotus ward takes the harm first, as far as it lasts
    const wd = wards[who];
    if (wd && wd.until > now() && wd.left > 0) {
        const take = Math.min(wd.left, dmg); wd.left -= take; dmg -= take;
        const q = lead ? feet() : { x: follower().x + 0.5, y: follower().y + 0.8 };
        if (!dmg) { st.hurtAt = now(); pop(q.x, q.y - 2.1, `막음 ${take}`, '#ffe7a0'); return; }
    }
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
    if (!s || !isField(mapId)) return;
    const w = withOf(s);
    if (isDesert(mapId)) {   // back at this map's way in, the fight over (체력 full again), nothing lost
        const m = DATA.maps[mapId], at = Object.keys(m.entries || {})[0];
        fight(s).run = null;
        await travel(mapId, at);   // the move closes cards: the card after it
        ui?.showCard({ tag: '전투', title: m.name, text: w ? `${josa(HERO_NAME[w], '가')} 부축해서 들어온 곳까지 물러났어.` : '들어온 곳까지 겨우 물러났어.' });
        return;
    }
    ui?.showCard({ tag: '원정', title: '두아트', text: w ? `${josa(HERO_NAME[w], '가')} 업고 올라왔어. 쉬고 다시 내려가자.` : '겨우 기어서 올라왔어. 쉬고 다시 내려가자.' });
    s.duatField = null;
    await travel('ombos', { x: 36, y: 10.6, dir: 'down' });
}
// a blow on a creature. kind: '' her or her companion's blow, 'skill' a 기술 (it breaks a guard)
function damage(s, o, n, push = 0, from = null, kind = '', actor = null) {
    if (o.st === 'dead') return;
    const before = o.st, hp0 = o.hp;
    try { return damage0(s, o, n, push, from, kind, actor); }
    finally { note({ ev: 'blow', by: kind || 'attack', before, after: o.st, dmg: hp0 - o.hp, mob: o.i }); }
}
function damage0(s, o, n, push, from, kind, actor) {
    const T = timing(o), c = centre(o);
    o.shownAt = now();
    if (from) { const q = targets(s).sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0]; if (q) { o.foe = q.who; (o.provoked ||= {})[q.who] = now(); } }
    let st = '';
    if (o.st === 'guard') {
        if (kind === 'skill' || kind === 'ult') { st = 'break'; mobFx(o, 'break'); note({ ev: 'break', mob: o.i }); }
        else { n = Math.max(1, Math.round(n * T.guardTake)); mobFx(o, 'block'); }
    } else if (kind === 'shield') { n = Math.max(1, Math.round(n * T.guardTake)); mobFx(o, 'block'); st = 'shield'; }   // the guard's own rule
    else mobFx(o, 'hit');
    o.hp -= n;
    pop(c.x, c.y - 2.3, `${n}`, (o.st === 'guard' && st !== 'break') || st === 'shield' ? '#cfe3ea' : '#fff3c4');
    if (o.hp <= 0) {
        o.st = 'dead'; o.t = 0;
        // 궁 게이지: the one who felled it, once for this creature (the next day's comes back as a new one), quietly
        if (actor && !o.paid) { o.paid = true; charge(s, actor, U().kill ?? 15); }
        if (o.sid) { const f = fight(s), day = today(s); f.killed[o.sid] = day; f.first[o.sid] ??= day; save(); }   // no reward is decided yet
        else { const r = run(s); (r.cleared[mapId] ||= []).push(o.i); save(); }
        return;
    }
    if (st === 'break') { o.st = 'hit'; o.t = 0; o.stun = T.stagger; o.steadyAt = now() + T.stagger + T.steady; return; }   // no counter
    if (st === 'shield') return;   // stopped on the shield: no flinch, no closing up
    if (o.st === 'guard') return;
    // the first blow lands in full, then it may close up
    if ((o.st === 'wander' || o.st === 'chase') && now() >= o.guardAt && Math.random() < (o.e.guard || 0)) {
        o.st = 'guard'; o.t = 0; o.guardAt = now() + T.guardCd; mobFx(o, 'guard'); note({ ev: 'guard', mob: o.i, until: +(now() + T.guard).toFixed(3) });
        return;
    }
    // flinch (not in the warning or the blow itself, and not again right after the last flinch)
    if (['wander', 'chase', 'recover'].includes(o.st) && now() >= o.steadyAt) {
        o.st = 'hit'; o.t = 0; o.stun = T.hit; o.steadyAt = now() + T.hit + T.steady;
        if (push && from && !o.e.nopush) { const dx = c.x - from.x, dy = c.y - from.y, d = Math.hypot(dx, dy) || 1, nx = o.x + dx / d * push, ny = o.y + dy / d * push; if (!solid(map(), nx, ny)) { o.x = nx; o.y = ny; } }
    }
}
const power = (s, who) => 3 + Math.floor((statsOf(s, who)?.strength || 0) / 2) + (who === 'set' ? 1 : 0);
// her blow: everything in front of her, from her feet out to her reach, a little to either side (face: left, right,
// or up / down for the thrust from the front / back pictures)
function strike(s, who, from, face, mult = 1, reach = null, kind = '', push = 0.25) {
    reach ??= F().reach?.[who] || 1.4;
    let hit = 0;
    for (const o of mobs) {
        if (o.st === 'dead') continue;
        const m = blowMeets(o, from, face, reach);
        if (!m) continue;
        // on the shield alone: blocked as by a guard (사용자 10-19); on the torso or a boss's fists: a blow
        const hp0 = o.hp;
        damage(s, o, Math.round(power(s, who) * mult), m === 'shield' ? 0 : push, from, m === 'shield' && kind !== 'skill' ? 'shield' : kind, who);
        if (o.hp < hp0) hit++;
        me.target = o;
    }
    return hit;
}

// ---- her buttons
const busy = () => me.act && me.act.until > now();
export function attack() {
    const s = getState();
    if (!s || !isField(mapId) || me.down || busy() || me.cdAttack > now()) { if (s && isField(mapId)) note({ ev: 'ignored', what: 'attack', why: me.down ? 'down' : busy() ? `busy:${me.act.name}` : 'cooldown' }); return; }
    engage(); turnToFoe(F().reach?.[leadOf(s)] || 1.4);
    me.cdAttack = now() + ATTACK_CD;
    me.act = { name: 'anticipation', at: now(), until: now() + SHOW.anticipation }; note({ ev: 'press', what: 'attack' });
    setTimeout(() => {
        if (me.down) return;
        me.act = { name: 'attack', at: now(), until: now() + SHOW.attack };
        strike(s, leadOf(s), feet(), me.vdir || me.face);
    }, SHOW.anticipation * 1000);
}
export function skill() {
    const s = getState();
    if (!s || !isField(mapId) || me.down || busy() || me.cdSkill > now()) { if (s && isField(mapId)) note({ ev: 'ignored', what: 'skill', why: me.down ? 'down' : busy() ? `busy:${me.act.name}` : 'cooldown' }); return; }
    engage(); if (leadOf(s) === 'horus') turnToFoe(2.5, ['left', 'right']); else turnToFoe(leadOf(s) === 'set' ? 2 : 1.5);   // his dive goes sideways
    me.cdSkill = now() + SKILL_CD;
    me.act = { name: 'skill', at: now(), until: now() + SHOW.skill }; note({ ev: 'press', what: 'skill', who: leadOf(s) });
    useSkill(s, leadOf(s), feet(), me.face, true);
}
// a creature's size against the people, in tiles: its picture is a character's height (31.2 px at zoom 1, 16 px a
// tile) times the map's actorScale; its shape is given in parts of that height (as drawMob draws it)
const charTiles = () => 31.2 / 16 * (map()?.d?.actorScale || 1);
// its shape (사용자 10-19), measured once a kind on its standing picture (tools/art/desert-mob-pack.py → sprites.json
// enemies.<kind>.hit), the same in every frame; weapons, flashes and empty margins are not in it. Its feet's middle is
// the middle of its body on the ground (the pivot), so:
//   body  — the torso, on the floor an ellipse round its feet's middle: that wide to either side, DEPTH of it to the
//           front and back (a body seen from above-front is wide and shallow; user: a warden was struck from far below)
//   back  — a warden's: its feet's middle is the front of its fists on the ground, the torso stands this far behind
//   front, frontKind — what it holds out in front, from its feet's middle: 'shield' a guard surface (a blow on the shield
//           alone is blocked as by a guard; Horus's 기술 counts it), 'body' part of it (a boss's fists: struck as the torso)
// Every Duat creature has none of it: a point, as before. Tests may put another in its place (testTune … { hit }).
const shape = o => o.e.hit || DATA.sprites?.enemies?.[o.kind]?.hit || {};
const DEPTH = 0.4;
function hurtArea(o) { const h = shape(o), c = centre(o), r = (h.body || 0) * charTiles(); return { x: c.x, y: c.y - (h.back || 0) * charTiles(), r, ry: r * DEPTH }; }
// from p to the torso's edge (0 inside it), and the nearest point of it
function toTorso(a, p) {
    if (!a.r) return { d: Math.hypot(p.x - a.x, p.y - a.y), x: a.x, y: a.y };
    const ex = (p.x - a.x) / a.r, ey = (p.y - a.y) / a.ry;
    if (ex * ex + ey * ey <= 1) return { d: 0, x: p.x, y: p.y };
    let best = { d: Infinity };
    for (let k = 0; k < 96; k++) { const t = k / 96 * Math.PI * 2, x = a.x + Math.cos(t) * a.r, y = a.y + Math.sin(t) * a.ry, d = Math.hypot(p.x - x, p.y - y); if (d < best.d) best = { d, x, y }; }
    return best;
}
// what it holds out, as a line on the floor from its feet's middle forward: { x0, x1, y, kind } or null
function frontLine(o) {
    const h = shape(o); if (!h.front || !h.frontKind) return null;
    const c = centre(o), fx = c.x + (o.faceR ? 1 : -1) * h.front * charTiles();
    return { x0: Math.min(c.x, fx), x1: Math.max(c.x, fx), y: c.y, kind: h.frontKind };
}
// how far from its feet's middle he comes down: past what it holds out or its torso, and his own room (LAND_GAP)
const LAND_GAP = 0.6;
function room(o) { const h = shape(o); return (h.frontKind ? h.front || 0 : h.body || 0) * charTiles() + LAND_GAP; }
// a 기술 around g with reach r: 'torso' / 'body' (a boss's fists) for everyone, 'shield' for Horus only (C안); else null
function touches(o, g, r, horus = false) {
    const a = hurtArea(o);
    if (toTorso(a, g).d < r) return 'torso';
    const f = frontLine(o);
    if (!f || (f.kind === 'shield' && !horus)) return null;
    const px = Math.min(Math.max(g.x, f.x0), f.x1);
    return Math.hypot(px - g.x, f.y - g.y) < r ? f.kind : null;
}
// a blow's reach in front of her (the box the old check used on its middle: from just behind her feet out to reach,
// 0.75 to either side) against its shapes: the torso ellipse, what it holds out. No wall between her and where it lands.
// → 'torso' / 'body' / 'shield' (only the shield in reach) / null
function blowMeets(o, from, face, reach) {
    const v = face === 'up' || face === 'down', sign = face === 'right' || face === 'down' ? 1 : -1;
    const local = (x, y) => ({ along: (v ? y - from.y : x - from.x) * sign, across: v ? x - from.x : y - from.y });
    const inBox = (x, y) => { const l = local(x, y); return l.along > -0.2 && l.along < reach && Math.abs(l.across) < 0.75; };
    const seen = (x, y) => clearLine(from, { x, y });
    // the torso: its middle clamped into the box, measured with the floor squashed so the ellipse is a circle (the box
    // stays a box) — the point of the box nearest it
    const a = hurtArea(o), l = local(a.x, a.y);
    const al = Math.min(Math.max(l.along, -0.2 + 1e-6), reach - 1e-6), ac = Math.min(Math.max(l.across, -0.75 + 1e-6), 0.75 - 1e-6);
    const nx = v ? from.x + ac : from.x + al * sign, ny = v ? from.y + al * sign : from.y + ac;
    if (a.r && Math.hypot((nx - a.x) / a.r, (ny - a.y) / a.ry) <= 1 + 1e-6 && inBox(nx, ny) && seen(nx, ny)) return 'torso';
    if (a.r === 0 && inBox(a.x, a.y) && seen(a.x, a.y)) return 'torso';
    const f = frontLine(o);
    if (f) for (let x = f.x0; x <= f.x1 + 1e-6; x += 0.05) if (inBox(x, f.y) && seen(x, f.y)) return f.kind;
    return null;
}
// the nearest creature ahead on his leap: in front, across no more than his blow's width (plus its torso), no wall
// between, and one he can come down short of before the wall or the leap's end
function leapTarget(f, dir, x0, x1) {
    let best = null, bestAlong = Infinity;
    for (const o of mobs) {
        if (o.st === 'dead') continue;
        const c = centre(o), along = (c.x - f.x) * dir, dy = Math.abs(c.y - f.y);
        const a = hurtArea(o);   // across his blow's width: its torso, or what it holds out on the ground (on its feet's line)
        if (along <= 0 || (Math.abs(a.y - f.y) >= 0.75 + a.ry && (!frontLine(o) || dy >= 0.75)) || !clearLine(f, c)) continue;
        const gx = Math.sqrt(Math.max(0, room(o) ** 2 - dy ** 2));
        if (along - gx > (x1 - x0) * dir + 1e-6) continue;   // too far: his leap ends (or a wall stops it) first
        if (along < bestAlong) { best = o; bestAlong = along; }
    }
    return best;
}
// each one's own 기술 (no name is shown, user: "오글거린다"); the one with her uses theirs too (MATE_SKILL_CD)
function useSkill(s, who, f, face, lead) {
    // what it really hurt (a guard broken counts; nothing for the air): one 스킬, one charge of the 궁 gauge
    const hits = (g, r, n, push) => {
        areas.push({ x: g.x, y: g.y, r, who, at: now() }); if (areas.length > 8) areas.shift();
        let got = 0;
        for (const o of mobs) if (o.st !== 'dead' && touches(o, g, r, who === 'horus')) { const hp0 = o.hp; damage(s, o, n, push, g, 'skill', who); if (o.hp < hp0) got++; }
        chargeSkill(s, who, got);
    };
    if (who === 'set') hits(f, 2, power(s, who) * 2, 0.8);              // 모래폭풍 강타: everything around, twice as hard, pushed away
    else if (who === 'horus') {                                          // 하늘에서 내리꽂기
        if (lead) {   // up, at most 2.5 tiles ahead, down on everything around where he lands
            const dir = face === 'right' ? 1 : -1, x0 = player.x;
            let x1 = x0;
            for (let k = 1; k <= 25; k++) { const x = x0 + dir * k * 0.1; if (solid(map(), x, player.y)) break; x1 = x; }
            // user (A안): not over the nearest one ahead on his way: he comes down just short of it, its body inside his reach
            const o = leapTarget(f, dir, x0, x1);
            if (o) { const c = centre(o), gx = Math.sqrt(Math.max(0, room(o) ** 2 - (c.y - f.y) ** 2)); x1 = c.x - dir * gx - 0.5; if ((x1 - x0) * dir < 0) x1 = x0; }
            me.act.jump = { x0, x1 };
            setTimeout(() => hits(feet(), 1.2, power(s, who) * 2, 0.5), SHOW.jump * 1000);
        } else {      // the one with her: up and down in their place, onto what is in front
            mate.act.hop = true;
            setTimeout(() => hits({ x: f.x + (face === 'right' ? 0.8 : -0.8), y: f.y }, 1.2, power(s, who) * 2, 0.5), SHOW.jump * 1000);
        }
    } else {                                                             // 봉으로 치기 (사용자 10-19: 엄호는 궁 연꽃 방패로)
        // a longer, harder blow in front than her ordinary one; it breaks a guard and pushes
        const k = F().somangSkill || {}, reach = (F().reach?.somang || 1.1) + (k.reach ?? 0.5);
        const way = lead ? me.vdir || me.face : face;
        chargeSkill(s, who, strike(s, who, f, way, k.mult ?? 1.8, reach, 'skill', k.push ?? 0.6));
    }
}
// ---- 궁 (사용자 10-19, 시제품): a gauge each (s.ult), filled by 스킬 that really hurt and by felling; full and its own
// cooldown over → 궁, the gauge empties the moment it goes. Its own blows fill nothing (felling with it does)
const U = () => F().ult || {};
const gauge = s => (s.ult ||= { set: 0, horus: 0, somang: 0 });
// one happening, given out once: the one who did it all of it, their partner a share
function charge(s, who, amt) {
    if (!amt || !s || s !== getState()) return;   // a late blow (Horus's dive) after the chat changed: not into the new one
    const u = U(), g = gauge(s), max = u.max || 100, lead = leadOf(s), w = withOf(s), other = who === lead ? w : who === w ? lead : null;
    g[who] = Math.min(max, (g[who] || 0) + amt);
    if (other) g[other] = Math.min(max, (g[other] || 0) + Math.round(amt * (u.share ?? 0.4)));
    note({ ev: 'charge', who, amt, g: { ...g } });
    save();
}
function chargeSkill(s, who, n) { if (n > 0) { const u = U(); charge(s, who, Math.min(u.skillCap ?? 35, (u.skillFirst ?? 25) + (u.skillEach ?? 5) * (n - 1))); } }
let storms = [], wards = {}, ultShows = [];   // 세트's storm going on, 소망's lotus wards (who → { left, until }), the pictures playing
const ultReady = s => { const u = U(); return (gauge(s)[leadOf(s)] || 0) >= (u.max || 100) && me.cdUlt <= now(); };
export function ult() {
    const s = getState();
    if (!s || !isField(mapId) || me.down || busy() || !ultReady(s)) { if (s && isField(mapId)) note({ ev: 'ignored', what: 'ult', why: me.down ? 'down' : busy() ? `busy:${me.act.name}` : 'not ready' }); return; }
    const who = leadOf(s), u = U(), k = u[who] || {}, f = feet(), w = withOf(s);
    engage();
    gauge(s)[who] = 0; me.cdUlt = now() + (u.cd ?? 12); saveState();   // spent the moment it goes (and kept so)
    me.act = { name: 'skill', at: now(), until: now() + SHOW.skill }; note({ ev: 'press', what: 'ult', who });
    ultShows.push({ who, at: now(), lead: true, x: f.x, y: f.y });
    if (who === 'set') storms.push({ who, lead: true, until: now() + (k.time ?? 3), next: now(), r: k.r ?? 2.6, every: k.every ?? 0.5, n: Math.max(1, Math.round(power(s, who) * (k.mult ?? 0.8))), push: k.push ?? 0.3 });
    else if (who === 'horus') {   // one strong blow round him: each one once
        const n = Math.round(power(s, who) * (k.mult ?? 4));
        areas.push({ x: f.x, y: f.y, r: k.r ?? 3.2, who, at: now() });
        for (const o of mobs) if (o.st !== 'dead' && touches(o, f, k.r ?? 3.2, true)) damage(s, o, n, k.push ?? 1, f, 'ult', who);
    } else {   // 연꽃 방패: each of the two takes up to `ward` of harm (not no harm at all), until it is used up or ends
        const until = now() + (k.time ?? 6);
        for (const x of [who, w]) if (x && !(x === w && mate.down)) wards[x] = { left: k.ward ?? 8, max: k.ward ?? 8, until };
        for (const o of mobs) if (o.st !== 'dead' && touches(o, f, k.r ?? 1.6)) shove(o, f, k.push ?? 0.6);
    }
}
function shove(o, from, d) {
    if (o.e.nopush) return;
    const c = centre(o), dx = c.x - from.x, dy = c.y - from.y, n = Math.hypot(dx, dy) || 1, nx = o.x + dx / n * d, ny = o.y + dy / n * d;
    if (!solid(map(), nx, ny) && !intoSafe(o.x, o.y, nx, ny)) { o.x = nx; o.y = ny; }
}
// the storm goes round 세트 wherever he walks, a blow every `every` seconds
function stepUlt(s) {
    const t = now();
    for (const st of storms) {
        if (t > st.until) continue;
        const lead = st.who === leadOf(s), c = lead ? feet() : { x: follower().x + 0.5, y: follower().y + 0.8 };
        st.x = c.x; st.y = c.y;
        while (st.next <= t && st.next <= st.until) {
            st.next += st.every;
            for (const o of mobs) if (o.st !== 'dead' && touches(o, c, st.r)) damage(s, o, st.n, st.push, c, 'ult', st.who);
        }
    }
    storms = storms.filter(st => t <= st.until);
    for (const [k, v] of Object.entries(wards)) if (t > v.until || v.left <= 0) delete wards[k];
    ultShows = ultShows.filter(u => t - u.at < 3);
}
export function spell() {
    const s = getState();
    if (!s || !isField(mapId) || me.down || busy()) return;
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
    const f = feet(), ok = o => o && o.st !== 'dead' && !o.gone && mobs.includes(o) && toTorso(hurtArea(o), f).d < FIGHT_NEAR;
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
    const oc = hurtArea(o), dx = oc.x - c.x;
    mate.face = dx >= 0 ? 'right' : 'left';
    // their blow as hers: its box against the creature's shapes (a shield alone is guarded)
    const meet = blowMeets(o, c, mate.face, reach + 0.2);
    if (p.moving || !meet) return;
    if (mate.cdSkill <= now()) {
        mate.cdSkill = now() + MATE_SKILL_CD; mate.cd = now() + 1.2; engage();
        mate.act = { name: 'skill', at: now(), until: now() + SHOW.skill };
        useSkill(s, w, c, mate.face, false);
        return;
    }
    mate.cd = now() + 1.2; engage();
    mate.act = { name: 'attack', at: now(), until: now() + SHOW.attack };
    damage(s, o, Math.max(1, power(s, w) - 1), meet === 'shield' ? 0 : 0.2, c, meet === 'shield' ? 'shield' : '', w);
}

// ---- every frame
const map = () => currentMap();
onFrame((dt, m, u) => {
    ui = u;
    const s = getState();
    if (!s) return;
    if (!isDuat(m.id) && s.duatField) { s.duatField = null; saveState(); }
    if (!isDesert(m.id) && s.desertFight?.run) { s.desertFight.run = null; saveState(); }   // the fight's 체력 ends, who fell when stays
    if (!isField(m.id)) {
        if (mapId) { mapId = ''; mapObj = null; runObj = null; mobs = []; bolts = []; mateWalk.pos = null; stance.on = false; hud(false); keepArt([]); storms = []; wards = {}; ultShows = []; releaseSprites(ultFiles()); }
        return;
    }
    // a new map object each time she arrives (enterMap), or a new run: the creatures of this map again
    if (m !== mapObj || (m.id === mapId && runNow(s) !== runObj)) {
        mapId = m.id; mapObj = m; runObj = run(s);
        Object.assign(me, { act: null, vdir: null, down: false, shield: 0, target: null }); Object.assign(mate, { act: null, down: false, shown: false, cdSkill: now() + 3 });
        Object.assign(stance, { on: false, since: -9, last: -9 }); mateWalk.pos = null;
        storms = []; wards = {}; ultShows = [];   // a storm or a ward does not come along to the next map
        spawn(m, s);
        ultArt(s);
    }
    hud(true, s, m);
    // the way she faces: sideways (me.face), and up or down after going that way until she goes sideways again
    if (input.dx > 0.2) me.face = 'right'; else if (input.dx < -0.2) me.face = 'left';
    const ax = Math.abs(input.dx), ay = Math.abs(input.dy);
    if (ay > ax * VERT) me.vert = true; else if (ax > ay * VERT) me.vert = false;
    // by the stick, not by moving: against a wall she still turns the way it is pushed
    if (ax > 0.2 || ay > 0.2) me.vdir = me.vert ? (input.dy > 0 ? 'down' : 'up') : null;
    stepStance();
    if (stance.on) player.dir = me.vdir || me.face;
    // Horus's dive moves him while the skill plays
    const j = me.act?.jump;
    if (j) { const k = Math.min(1, (now() - me.act.at) / SHOW.jump); player.x = j.x0 + (j.x1 - j.x0) * k; me.act.lift = Math.sin(Math.PI * k) * 1.2; }
    // the one with her, in Horus's dive: up and down where they stand
    if (mate.act?.hop) { const k = Math.min(1, (now() - mate.act.at) / SHOW.jump); mate.act.lift = Math.sin(Math.PI * k) * 1.2; }
    for (const o of mobs) stepMob(m, o, dt, s);
    stepUlt(s);
    mobs = mobs.filter(o => !o.gone);
    stepBolts(dt, s);
    stepMateWalk(dt, s);
    stepMate(dt, s);
    pops = pops.filter(p => now() - p.at < 1);
    fx = fx.filter(e => now() - e.at < e.dur);
});
onBusy(() => isField(mapId) && (mobs.length > 0 || pops.length > 0 || fx.length > 0));
// 말 걸기 is 공격 down here, unless a place is right by her and nothing is close
onTalkFirst(nearSpot => {
    if (!isField(mapId) || gameMode() !== 'open') return false;
    const f = feet(), threat = mobs.some(o => o.st !== 'dead' && Math.hypot(centre(o).x - f.x, centre(o).y - f.y) < 2);
    if (nearSpot && !threat) return false;
    attack();
    return true;
});
window.addEventListener('keydown', e => {
    if (!isField(mapId) || gameMode() !== 'open' || e.repeat || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)) return;
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
    if (!walkT && (runNow(getState())?.fear || 0) >= TIRED_FEAR && DATA.sprites?.looks?.[who]?.combat?.acts?.tired) return { name: 'tired', t: 0, lift: 0 };
    return { name: 'ready', t, lift: walkT ? Math.abs(Math.sin(Math.PI * walkT / STEP_S)) * STEP_BOB : 0 };
};
onDraw(scene => {
    if (!isField(mapId) || !isField(scene.map?.id)) return;
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
// is the frame's pixel (fx, fy) opaque — the frame read once, at a quarter of its size (tests whether she is hidden)
const alphaOf = new Map();
function opaque(img, r, fx, fy) {
    if (fx < 0 || fy < 0 || fx >= r[2] || fy >= r[3]) return false;
    const key = `${img.src}|${r[0]},${r[1]}`;
    let a = alphaOf.get(key);
    if (!a) {
        const w = Math.max(1, Math.ceil(r[2] / 4)), h = Math.max(1, Math.ceil(r[3] / 4)), c = document.createElement('canvas');
        c.width = w; c.height = h;
        const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, w, h);
        let d; try { d = cx.getImageData(0, 0, w, h).data; } catch { d = null; }
        a = { w, d };
        if (alphaOf.size > 64) alphaOf.clear();
        alphaOf.set(key, a);
    }
    return !!a.d && a.d[((fy >> 2) * a.w + (fx >> 2)) * 4 + 3] >= 128;
}
function drawMob(g, o, sx, sy, z, ts) {
    const d = DATA.sprites?.enemies?.[o.kind];
    if (!d) return;
    // as large against the people as the map draws them (map.d.actorScale: the desert maps draw people larger)
    const H = 31.2 * z * (map()?.d?.actorScale || 1);
    const gx = sx + 8 * z, gy = sy + 16 * z, t = now(), T = timing(o);
    // the shadow on the floor: smaller and lighter while it is high
    const bob = Math.sin((t / BOB_S) * Math.PI * 2 + o.phase), warn1 = o.st === 'prepare' && o.t >= T.prepare[0];
    const fl = o.e.float === false ? 0 : 1;   // a creature on its feet (data float: false): no lift, no bob, the shadow still
    const up = fl * (o.st === 'prepare' ? 0.1 * Math.min(1, o.t / T.prepare[0]) : 0);
    g.fillStyle = `rgba(20,12,6,${o.st === 'dead' ? 0.12 : 0.24 - 0.05 * bob})`;
    const wide = Math.max(1, (d.height || 1) / 1.3);   // a big one's shadow as big as it is
    g.beginPath(); g.ellipse(gx, gy - 0.5 * z, 0.45 * ts * wide * (1 - 0.15 * bob * fl), 0.13 * ts * wide, 0, 0, Math.PI * 2); g.fill();
    const motion = o.st === 'dead' ? 'disappear' : o.st === 'hit' ? 'hit' : o.st === 'guard' ? 'guard'
        : o.st === 'prepare' ? (warn1 ? 'prepare-1' : 'prepare-0')
        : o.st === 'attack' ? 'attack-0' : o.st === 'recover' ? 'attack-1'
        : IDLE_LOOP[Math.floor((t + o.phase) / T.idle) % IDLE_LOOP.length];
    // a kind's pictures are on its own sheets (one or more, tools/art/desert-mob-pack.py: frame [x, y, w, h, px, py, sheet]);
    // only the sheet this frame is on is asked for, the small set when it is drawn small, the other while that one loads
    const pick = v => { const r = v.frames[motion] || v.frames['idle-0'], img = spriteFile((v.sheets || [v.file])[r[6] || 0]); return img && { a: v, r, img }; };
    const wantSmall = H <= d.small.visible + 1, got = (wantSmall && pick(d.small)) || pick(d) || pick(d.small);
    if (!got) return;
    // drawn from the set it wants: the other set (asked for only to show something while this one loaded) is let go
    // (a kind whose small set would be bigger than its picture shares the big set's sheets: nothing of those let go)
    if (got.a === (wantSmall ? d.small : d)) {
        const used = new Set(got.a.sheets || [got.a.file]), other = wantSmall ? d : d.small;
        releaseSprites((other.sheets || [other.file]).filter(f => !used.has(f)));
    }
    const { a, r, img } = got, k = H / a.visible;   // the atlas has a character's height in `visible` px
    // floating: lifted off the floor and bobbing, except while it warns, strikes, is hit, guards or breaks
    const still = !['wander', 'chase'].includes(o.st);
    const die = o.st === 'dead' ? Math.max(0, o.t - T.die[0]) / T.die[1] : 0;   // the broken picture holds, then sinks away
    const baseY = gy - (fl * (FLOAT + (still ? 0 : BOB * bob)) + up - Math.min(1, die) * 0.3 * fl) * ts;   // the bottom of its body
    const shake = warn1 ? Math.sin(t * 60) * z * 0.6 : 0;
    g.save();
    // 사용자 10-19: a big one hid her whole behind it — drawn see-through (no silhouette) only while one of the two
    // stands behind it with their whole body covered by its picture (사용자: 몸이 100% 겹쳤을 때만): every point of
    // their body's box falls on its opaque pixels
    const toS = p => ({ x: sx + (p.x - o.x) * ts, y: sy + (p.y - o.y) * ts }), ch = charTiles() * ts;
    const people = [feet()]; { const st = getState(); if (st && withOf(st) && !mate.down) { const q = follower(); people.push({ x: q.x + 0.5, y: q.y + 0.8 }); } }
    // against its standing picture (idle-0), one shape whatever it does, so it does not flicker as the frames change
    const ir = a.frames['idle-0'], stand = ir && spriteFile((a.sheets || [a.file])[ir[6] || 0]), [iimg, rr] = stand ? [stand, ir] : [img, r];
    const covered = (X, Y) => opaque(iimg, rr, o.faceR ? rr[4] - (X - gx) / k : (X - gx) / k + rr[4], (Y - baseY) / k + rr[5]);
    o.cover = people.map(p => {   // the share of each one's body box on its opaque pixels (behind it only)
        if (p.y >= centre(o).y) return 0;   // in front of it: drawn over it
        const q = toS(p); let n = 0;
        for (let i = 0; i <= 4; i++) for (let j = 0; j <= 6; j++) if (covered(q.x + (i / 4 - 0.5) * 0.4 * ch, q.y - j / 6 * 0.9 * ch)) n++;
        return n / 35;
    });
    const hidden = o.cover.some(c => c >= 1);
    o.fade = Math.max(0, Math.min(1, (o.fade || 0) + (hidden ? 1 : -1) * 0.12));
    g.globalAlpha = (o.st === 'dead' ? Math.max(0, 1 - die) : 1) * (1 - 0.55 * o.fade);
    g.translate(gx + shake, baseY);
    if (o.faceR) g.scale(-1, 1);   // the pictures face left: mirrored to face someone on its right (user: it looked away)
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, r[0], r[1], r[2], r[3], -r[4] * k, -r[5] * k, r[2] * k, r[3] * k);
    g.restore();
    // its 체력 as a straight bar over it: hidden while it drifts on its own, shown once it has met them and for a
    // while after a hit (a dot-art bar comes later, user)
    if ((o.st !== 'wander' || t - o.shownAt < 3) && o.st !== 'dead') {
        // as wide as it is big (사용자 10-19: 수문장을 키웠으니 체력바도), thicker up to twice
        const big = Math.max(1, (d.height || 1) / 1.5), th = 2 * z * Math.min(2, big);
        const w = 0.9 * ts * big, x = gx - w / 2, y = baseY - (r[5] * k) - th - 2 * z;
        g.fillStyle = 'rgba(20,12,6,.8)'; g.fillRect(x - z, y - z, w + 2 * z, th + 2 * z);
        g.fillStyle = '#e8584a'; g.fillRect(x, y, w * Math.max(0, o.hp) / o.e.hp, th);
    }
    g.imageSmoothingEnabled = false;
}
const SAND = ['#f3dca4', '#e2bd7c', '#c9995a'];
// tests only: green — where a 기술 hurts it (torso), blue — a shield (a blow on it alone is blocked; Horus's 기술 counts it), a green line — a boss's fists (body), the leap's
// landing (magenta ×) and each 기술's reach (orange: Horus, yellow: Set) as circles on the floor
function drawRanges(g, z, ts, cx, cy) {
    const P = (x, y) => [x * ts - cx, y * ts - cy];
    g.save(); g.lineWidth = 2 * z;
    // the entrance safe zones (cyan): round each landing and along to its exit
    for (const zn of safeZones()) {
        const [ax, ay] = P(zn.a.x, zn.a.y), [bx, by] = P(zn.b.x, zn.b.y);
        g.strokeStyle = 'rgba(60,220,255,.9)'; g.fillStyle = 'rgba(60,220,255,.12)'; g.lineCap = 'round';
        g.lineWidth = zn.r * 2 * ts; g.strokeStyle = 'rgba(60,220,255,.14)'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
        g.lineWidth = 2 * z; g.strokeStyle = 'rgba(60,220,255,.9)'; g.beginPath(); g.arc(ax, ay, zn.r * ts, 0, Math.PI * 2); g.stroke();
    }
    for (const o of mobs) {
        if (o.st === 'dead') continue;
        const h = hurtArea(o), [hx, hy] = P(h.x, h.y), c = centre(o), [px, py] = P(c.x, c.y);
        g.strokeStyle = '#30d070'; g.fillStyle = 'rgba(48,208,112,.25)'; g.beginPath(); g.ellipse(hx, hy, Math.max(2 * z, h.r * ts), Math.max(2 * z, h.ry * ts), 0, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = '#ffffff'; g.fillRect(px - 2 * z, py - 2 * z, 4 * z, 4 * z);
        const fl = frontLine(o);
        if (fl) { const [ax] = P(fl.x0, fl.y), [bx] = P(fl.x1, fl.y); g.strokeStyle = fl.kind === 'shield' ? '#3080ff' : '#30d070'; g.lineWidth = 4 * z; g.beginPath(); g.moveTo(ax, py); g.lineTo(bx, py); g.stroke(); g.lineWidth = 2 * z; }
    }
    for (const a of areas.slice(-4)) {
        const [x, y] = P(a.x, a.y);
        g.strokeStyle = a.who === 'set' ? '#ffd030' : '#ff8a20'; g.fillStyle = a.who === 'set' ? 'rgba(255,208,48,.12)' : 'rgba(255,138,32,.14)';
        g.beginPath(); g.arc(x, y, a.r * ts, 0, Math.PI * 2); g.fill(); g.stroke();
        g.strokeStyle = '#ff40d0'; g.beginPath(); g.moveTo(x - 6 * z, y - 6 * z); g.lineTo(x + 6 * z, y + 6 * z); g.moveTo(x + 6 * z, y - 6 * z); g.lineTo(x - 6 * z, y + 6 * z); g.stroke();
    }
    g.restore();
}
// 궁: its picture played once (the approved frames, their own times, field.ult.fx), then what goes on shows on the
// floor: the storm a sand ring round 세트 while it lasts, each lotus ward a gold ring under the one it keeps, as thick
// as what is left of it
function drawUlt(g, z, ts, cx, cy) {
    const s = getState(), t = now(), at = who => (s && who === leadOf(s) ? feet() : { x: follower().x + 0.5, y: follower().y + 0.8 });
    for (const st of storms) {
        const x = st.x * ts - cx, y = st.y * ts - cy, k = 0.5 + 0.5 * Math.sin(t * 6);
        g.save(); g.setLineDash([10 * z, 7 * z]); g.lineDashOffset = -t * 40 * z; g.lineWidth = 3 * z;
        g.strokeStyle = `rgba(226,189,124,${0.55 + 0.3 * k})`; g.beginPath(); g.ellipse(x, y, st.r * ts, st.r * ts * 0.5, 0, 0, Math.PI * 2); g.stroke(); g.restore();
    }
    for (const [who, wd] of Object.entries(wards)) {
        const p = at(who), x = p.x * ts - cx, y = p.y * ts - cy;
        g.save(); g.lineWidth = Math.max(1.5, 5 * z * wd.left / wd.max); g.strokeStyle = 'rgba(255,214,120,.85)';
        g.beginPath(); g.ellipse(x, y - 0.05 * ts, 0.6 * ts, 0.22 * ts, 0, 0, Math.PI * 2); g.stroke(); g.restore();
    }
    for (const u of ultShows) {
        const fx = F().ult?.fx?.[u.who]; if (!fx) continue;
        let el = (t - u.at) * 1000, fr = null;
        for (const f of fx.frames) { if (el < f.ms) { fr = f; break; } el -= f.ms; }
        if (!fr) continue;
        const img = spriteFile(fr.file); if (!img) continue;
        const p = u.who === 'horus' ? u : at(u.who), k = fx.tilesPerPx * ts, x = p.x * ts - cx, y = p.y * ts - cy;
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
        g.drawImage(img, x - fr.ax * k, y - fr.ay * k, fr.w * k, fr.h * k);
    }
}
function drawTop(g, z, ts, ox, oy) {
    // ox, oy: where (0, 1e6) landed; the camera is ox, oy − 1e6·ts
    const cx = -ox, cy = -(oy - 1e6 * ts), t = now();
    if (showRanges) drawRanges(g, z, ts, cx, cy);
    drawUlt(g, z, ts, cx, cy);
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

const mobName = o => DATA.desert?.names?.[o.kind] || o.e.ko || '';
function hudFoe() {
    const f = feet(), near = o => o && o.st !== 'dead' && !o.gone && mobs.includes(o) && toTorso(hurtArea(o), f).d < FIGHT_NEAR;
    if (near(me.target)) return me.target;
    let best = null, bd = FIGHT_NEAR;
    for (const o of mobs) if (ACTIVE.includes(o.st) && near(o)) { const d = toTorso(hurtArea(o), f).d; if (d < bd) { bd = d; best = o; } }
    return best;
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
        el.btns.innerHTML = '<button type="button" class="sf_duat_skill"><i class="fa-solid fa-bolt" aria-hidden="true"></i><span>스킬</span><s></s></button><button type="button" class="sf_duat_spell">주문<em></em></button>';
        // 궁 where 가방 was (가방 is up under the gear now): the lead's picture inside, its rim the gauge
        el.ult = document.createElement('button'); el.ult.type = 'button'; el.ult.className = 'sf_ult'; el.ult.setAttribute('aria-label', '궁'); el.ult.innerHTML = '<b></b>';
        bindPress(el.ult, ult);
        bindPress(el.btns.querySelector('.sf_duat_skill'), skill);
        bindPress(el.btns.querySelector('.sf_duat_spell'), spell);
    }
    const actions = root.querySelector('.sf_actions'), talk = root.querySelector('.sf_talk');
    if (!show) {
        el.box.remove(); el.btns.remove(); el.ult.remove();
        if (talk?.dataset.duat) { talk.querySelector('span').textContent = '말 걸기'; delete talk.dataset.duat; talk.classList.remove('sf_attack'); }
        return;
    }
    if (!el.box.isConnected) root.append(el.box);
    if (!el.btns.isConnected && actions) actions.append(el.btns);
    if (!el.ult.isConnected && actions) actions.insertBefore(el.ult, talk || null);
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
    // the title: the creature she is fighting (사용자 10-19: 맵 이름 말고 몹 이름) — the one she last struck while it is
    // near, else the nearest one coming at her; none about, the place as before
    const foe = hudFoe(), title = foe ? mobName(foe) : `${m.d.name || ''}${isDuat(m.id) ? ` ${no}/7` : ''}`;
    const html = `<b>${title}</b>` + Object.keys(r.hp).map(w => bar(HERO_NAME[w], r.hp[w], r.max[w], 'sf_hp')).join('') + bar('공포', r.fear, FEAR_MAX, 'sf_fear');
    if (el.box._html !== html) { el.box.innerHTML = html; el.box._html = html; }
    // 기술: the time left darkens it round like a clock; 주문: how many are left in the corner
    const sk = el.btns.querySelector('.sf_duat_skill'), sp = el.btns.querySelector('.sf_duat_spell');
    const left = Math.max(0, me.cdSkill - t), cd = (left / SKILL_CD).toFixed(3), sec = left > 0 ? String(Math.ceil(left)) : '';
    if (sk.style.getPropertyValue('--cd') !== cd) sk.style.setProperty('--cd', cd);
    sk.disabled = left > 0 || me.down;
    const secEl = sk.querySelector('s'); if (secEl.textContent !== sec) { secEl.textContent = sec; sk.classList.toggle('sf_cd', !!sec); }
    // 궁: the rim filled as far as the gauge; ready (full and its cooldown over) it glows softly
    const who = leadOf(s), gv = ((gauge(s)[who] || 0) / (U().max || 100)).toFixed(3), ready = ultReady(s);
    if (el.ult.style.getPropertyValue('--g') !== gv) el.ult.style.setProperty('--g', gv);
    if (el.ult.dataset.who !== who) { el.ult.dataset.who = who; el.ult.style.setProperty('--icon', `url(${new URL(`../../../data/art/ui/ult-${who}.png`, import.meta.url).href})`); }
    el.ult.classList.toggle('sf_full', ready); el.ult.disabled = me.down;
    const em = sp.querySelector('em'); if (em.textContent !== String(r.spells)) em.textContent = r.spells;
    sp.classList.toggle('sf_empty', r.spells <= 0); sp.disabled = me.down;
}

// for tests: what is going on down here, one creature put by her, numbers over the data
// tests only: turn her a way (left, right, up, down) as walking that way would
export const testEvents = (clear = false) => { const out = events.slice(); if (clear) events.length = 0; return out; };
export const testNow = () => +now().toFixed(3);
// tests only: the creature pictures in memory now, and what they take decoded (width × height × 4)
export const testArt = () => { const files = kindFiles(Object.keys(DATA.sprites?.enemies || {})).filter(f => DATA.spriteArt?.[f]); return { files, bytes: files.reduce((n, f) => n + DATA.spriteArt[f].naturalWidth * DATA.spriteArt[f].naturalHeight * 4, 0) }; };
export const testTouch = (x, y, r, withFront = false) => mobs.filter(o => o.st !== 'dead').map(o => touches(o, { x, y }, r, withFront));
export const testRanges = (on = true) => { showRanges = on; if (!on) areas.length = 0; };
export const testHurt = () => mobs.filter(o => o.st !== 'dead').map(o => ({ ...hurtArea(o), cx: centre(o).x, faceR: !!o.faceR, tiles: charTiles(), front: frontLine(o) }));
// tests only: a clean start for one check (her and the companion's cooldowns, poses, down, shield; numbers over the data)
export function testReset() {
    Object.assign(me, { act: null, cdAttack: 0, cdSkill: 0, hurtAt: -9, shield: 0, down: false, target: null });
    Object.assign(mate, { act: null, cd: 0, cdSkill: 0, hurtAt: -9, down: false });
    for (const k of Object.keys(tune)) delete tune[k];
    bolts = []; fx = []; pops = []; events.length = 0; areas.length = 0;
}
export const testFade = () => mobs[0]?.fade || 0;
// tests only: someone hit by a creature's blow of `atk` (as a creature's blow does)
export function testHit(who, atk) { const s = getState(); if (s) hurt(s, who, atk); }
// tests only: the 궁 gauges (read, or set some), what is going on with the 궁
export function testUlt(set) { const s = getState(); if (set) Object.assign(gauge(s), set); if (set?.cd === 0) me.cdUlt = 0; return { g: { ...gauge(s) }, ready: ultReady(s), cd: +Math.max(0, me.cdUlt - now()).toFixed(2), storms: storms.length, wards: JSON.parse(JSON.stringify(wards)), shows: ultShows.length }; }
// tests only: how deep a point (feet, tiles) is in this map's entrance safe zones, and the zones
export const testSafe = (x, y) => safeDepth({ x, y });
export const testZones = () => safeZones().map(z => ({ ...z }));
export const testCover = () => mobs[0]?.cover || [];
// tests only: hold the creatures in a state (e.g. { st: "hit", stun: 999 }: one picture, for comparing pictures)
export function testSet(fields) { for (const o of mobs) Object.assign(o, typeof fields === 'function' ? fields(o) : fields); }
export function testMobFace(right) { for (const o of mobs) o.faceR = !!right; }
export function testHold(on = true) { held = !!on; }
export function testFace(d) { if (d === 'left' || d === 'right') { me.face = d; me.vdir = null; } else me.vdir = d; }
export const fieldState = () => ({ map: mapId, mobs: mobs.map(o => ({ kind: o.kind, st: o.st, t: +o.t.toFixed(2), hp: o.hp, x: +o.x.toFixed(2), y: +o.y.toFixed(2) })), me: { act: me.act?.name || '', down: me.down, face: me.face, vdir: me.vdir }, stance: stance.on, mateAt: mateWalk.pos ? { x: +mateWalk.pos.x.toFixed(2), y: +mateWalk.pos.y.toFixed(2) } : null, mate: { act: mate.act?.name || '', down: mate.down }, run: runNow(getState()), fight: getState()?.desertFight || null });
// tests only: numbers over a kind's data for the creatures made from now on (the next time she comes into the map)
export function testTune(kind, numbers = {}) { tune[kind] = numbers; }
// tests only: one more creature beside those there (its pictures kept as a map's would be)
export function testAdd(kind, x, y, numbers = {}) { tune[kind] = numbers; mobs.push(makeMob(mobs.length + 100, kind, x, y)); keepArt([...new Set(mobs.map(o => o.kind))]); }
export function testOnly(kind, x, y, numbers = {}) { tune[kind] = numbers; mobs = [makeMob(99, kind, x, y)]; bolts = []; fx = []; }
