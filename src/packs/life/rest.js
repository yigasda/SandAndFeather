// 쉬기와 잠: sit down at a seat to rest (태양 기운 +1, twice a game day), lie down in a bed to end the game day once
// half its 태양 기운 is spent (core/rest.js). Whoever walks in front sits or lies in the picture they have for that
// seat; without one yet they rest where they stand.

import { DATA } from '../../core/data.js';
import { SIT_PER_DAY, sitRest, sitsLeft, sleepNow, tired } from '../../core/rest.js';
import { getState, saveState } from '../../core/state.js';
import { sunLeft, sunMax } from '../../core/sun.js';
import { feet, holdMate, holdPose, player } from '../../world/player.js';
import { leadOf, withOf } from '../../core/heroes.js';
import { onSpot } from '../../ui/window.js';

// where a pose's anchor goes (tiles), which way she faces there, and which picture. The dining table has a cushion
// on its left, right and front; sitting on the right one she faces left (the table), and so on.
// a long-seat place for each of the three: the pictures stand differently (Set's sits a little further back on the
// seat, 0.9.48 long chair). Every one sits with the fold behind the knee right on the seat's front outline (`edge`,
// tiles: the line where the cushion's top meets its front, measured on the room picture; the user drew it), so the
// thigh lies on the seat and the shins hang down its front. FOLD: how far that fold is below the anchor on each
// sit-bench picture (measured, tiles)
const FOLD = { somang: -0.023, set: 0.023, horus: 0.061 };
// `seat`: [left, right] of the cushion (tiles) when it is long enough for two; then the one walking with her sits on
// it too, facing her (user: on a long seat they face each other), see pairOn
// `y`: the anchor's height (Set's 0.04 higher); with `edge` it is not used: each one's fold goes on the edge
const bench = (x, y, dir, edge = null, seat = null) => ['somang', 'set', 'horus'].map(who => ({ x: who === 'set' ? +(x + (dir === 'left' ? 0.16 : -0.16)).toFixed(2) : x,
    y: edge != null ? +(edge - FOLD[who]).toFixed(2) : who === 'set' ? +(y - 0.04).toFixed(2) : y, dir, pose: 'sit-bench', who, edge, seat }));
const SEATS = {
    temple_table: [{ x: 14.25, y: 5.4, dir: 'left', pose: 'sit-floor' }],
    // the left cushion has its own spot: from the table's one spot (its right end) it was never the nearest
    temple_table_left: [{ x: 7.65, y: 5.4, dir: 'right', pose: 'sit-floor' }],
    // the front cushion has its own place: from the table's one spot (its right end) it was never the nearest
    temple_table_mid: [{ x: 10.95, y: 6.75, dir: 'up', pose: 'sit-floor' }],
    // Set's room: the low table has a cushion on each side; the desk has a stool (sitting there she faces the desk)
    set_table: [
        { x: 8.4, y: 5.35, dir: 'right', pose: 'sit-floor' },
        { x: 12.3, y: 5.35, dir: 'left', pose: 'sit-floor' },
    ],
    set_desk: [{ x: 4.15, y: 4.45, dir: 'up', pose: 'sit-stool' }],
    horus_desk: [{ x: 18.3, y: 5.95, dir: 'up', pose: 'sit-stool' }],
    somang_mirror: [{ x: 3.1, y: 4.3, dir: 'up', pose: 'sit-stool' }],
    // the long cushioned chair against the left wall of her room: sitting there she looks right, into the room, on the
    // seat's front edge with the legs hanging over it (the user's sketch). Each picture stands differently: one place each
    somang_chair: [
        { x: 2.68, y: 7.16, dir: 'right', pose: 'sit-bench', who: 'somang' },
        { x: 2.52, y: 7.12, dir: 'right', pose: 'sit-bench', who: 'set' },
        { x: 2.68, y: 7.16, dir: 'right', pose: 'sit-bench', who: 'horus' },
    ],
    // 0.9.50: every other seat in the pictures. Low stools and benches take the long-chair picture (side on); the
    // benches along the corridor walls face the room, but until a front-facing sitting picture comes she sits on them
    // side on, looking along the corridor
    // the stool left of her round work table: Horus's thighs are shorter, so he sits further right to put his knees on
    // the stool's front edge (user: his legs hung in the middle of the stool)
    somang_table: bench(9.25, 5.75, 'right').map(p => (p.who === 'horus' ? { ...p, x: 9.4 } : p)),   // a stool: one only
    // the stone bench by the courtyard's right wall, seen at an angle: the seat on the middle of its top, picked by the
    // user from preview sheets over her sketch (0953-user-well-bench.png). All three in the same place
    temple_well_bench: ['somang', 'set', 'horus'].map(who => ({ x: 22.95, y: 5.38, dir: 'left', pose: 'sit-bench', who })),
    roof_rug: [                                         // the roof's rug: the long cushions and the red pouf by the low table
        { x: 3.9, y: 6.1, dir: 'right', pose: 'sit-floor' },
        { x: 6.4, y: 6.55, dir: 'up', pose: 'sit-floor' },
    ],
    colonnade_seat: bench(6.2, 4.9, 'right', 4.69, [5.75, 8.55]),
    inner_bench: bench(7.3, 4.55, 'right', 4.36, [6.92, 9.12]),
    central_bench: bench(7.3, 4.5, 'right', 4.36, [6.92, 9.15]),
    east_bench: bench(7.3, 4.55, 'right', 4.36, [6.88, 9.28]),
    // too short for two facing each other (their knees would meet): the one walking with her stands by
    west_bench: bench(20.6, 4.4, 'right', 4.17),          // the line: where the blue cushion's top turns to its front (user)
    rooms_bench: bench(8.85, 4.55, 'right', 4.48),
    // the little bench inside the temple's front yard; the one walking with her stands on the paving right of the stall
    // (user), not behind it
    ombos_bench: bench(19.8, 10.6, 'right', 10.46).map(p => ({ ...p, stand: [22.0, 11.5] })),
};
// the middle of the body lying in bed. Set's bed (and Horus's, the same bed) is wide enough for two: Somang takes the right pillow, Set and Horus
// the left. Sleeping together, the one on the left lies on the side facing the other (the right); the right one
// lies on the back. Set and Horus together: Set on the left on the side, Horus on the right pillow.
// y: set so every head sits at the same height on the pillows (the pictures stand differently on their canvases;
// measured in the game: the middle of the head, hair top to chin, lined up with Set's)
const BEDS = {
    set_bed: {
        somang: { x: 17.55, y: 3.98, dir: 'down', pose: 'sleep' },
        set: { x: 15.7, y: 3.85, dir: 'down', pose: 'sleep' },
        horus: { x: 15.7, y: 3.9, dir: 'down', pose: 'sleep' },
        right: { x: 17.3, y: 3.9, dir: 'down', pose: 'sleep' },     // Horus on the right pillow (with Set)
        side: { x: 15.7, y: 3.85, dir: 'right', pose: 'sleep' },     // Set on the side
        sideHorus: { x: 15.7, y: 3.9, dir: 'right', pose: 'sleep' },
    },
    // Horus's bed is the same bed drawn at 91 % (matched on the headboard and pillows): Set's places carried over,
    // heads kept the same distance above the anchor (0.75 tile) so they land on the smaller pillows
    horus_bed: {
        somang: { x: 5.32, y: 4.15, dir: 'down', pose: 'sleep' },
        set: { x: 3.56, y: 4.03, dir: 'down', pose: 'sleep' },
        horus: { x: 3.56, y: 4.08, dir: 'down', pose: 'sleep' },
        right: { x: 5.02, y: 4.08, dir: 'down', pose: 'sleep' },
        side: { x: 3.56, y: 4.03, dir: 'right', pose: 'sleep' },
        sideHorus: { x: 3.56, y: 4.08, dir: 'right', pose: 'sleep' },
    },
};
export const bedPlace = (id, who, side = false) => (side ? (who === 'horus' ? BEDS[id]?.sideHorus : BEDS[id]?.side) : BEDS[id]?.[who]) || BEDS[id]?.set;
// two in the bed: where each lies. The right pillow is Somang's; without her, Horus's
export function bedPair(id, lead, mate) {
    const b = BEDS[id];
    if (!b || !mate) return { lead: bedPlace(id, lead) };
    const right = lead === 'somang' || mate === 'somang' ? 'somang' : 'horus';
    const at = who => (who === right ? (who === 'somang' ? b.somang : b.right) : who === 'horus' ? b.sideHorus : b.side);
    return { lead: at(lead), mate: at(mate) };
}

const hasPoseOf = (look, pose, dir) => !!DATA.sprites?.looks?.[look]?.motion?.acts?.[pose]?.[dir];
const hasPose = (pose, dir) => hasPoseOf(player.look, pose, dir);

function seatFor(id) {
    const f = feet();
    const free = (SEATS[id] || []).filter(p => (!p.who || p.who === player.look) && hasPose(p.pose, p.dir));
    return free.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0] || null;
}
// two on the courtyard's stone bench (user's sketch, 0957-user-well-pair.jpg): seen at an angle, the one who sat down
// lower and nearer, the companion up and behind. Each one sits on the seat's front edge like on the long chair: the
// fold behind the knee (measured on each picture) right on the top's front outline (22.26, 4.717)-(22.988, 5.833), the
// thigh on the stone, the shins down the front. [lead, companion] anchors by `${lead}+${companion}`, set pair by pair
const WELL_DUO = {
    'somang+set': [[23.24, 5.59], [22.9, 4.98]],
    'somang+horus': [[23.24, 5.59], [22.71, 4.94]],
    'set+somang': [[23.27, 5.55], [22.87, 5.02]],
    'set+horus': [[23.27, 5.55], [22.71, 4.94]],
    'horus+somang': [[23.07, 5.51], [22.9, 5.07]],
    'horus+set': [[23.07, 5.51], [22.93, 5.03]],
};
const DUO = { temple_well_bench: WELL_DUO };
const MATE_REACH = 8;
// facing each other on a long seat: each one at their own height (the fold behind the knee on the front outline) and
// as close as their legs allow: how far each one's knees and feet reach in front of the anchor (measured on the
// sit-bench pictures, tiles) and a little room between the two pairs of feet. The two are put in the middle of the
// cushion, she on the side she faces from; each one's seat stays at least SEAT_IN from the cushion's ends
const LEGS = { somang: 0.79, set: 0.98, horus: 0.64 }, KNEE_GAP = 0.12, SEAT_IN = 0.15;
function pairOn(p, lead, mate) {
    const gap = LEGS[lead] + LEGS[mate] + KNEE_GAP, [a, b] = p.seat, mid = (a + b) / 2, s = p.dir === 'right' ? 1 : -1;
    if (b - a - 2 * SEAT_IN < gap || !hasPoseOf(mate, 'sit-bench', p.dir === 'right' ? 'left' : 'right')) return null;
    return [{ ...p, x: +(mid - s * gap / 2).toFixed(2) },
        { ...p, who: mate, dir: p.dir === 'right' ? 'left' : 'right', x: +(mid + s * gap / 2).toFixed(2), y: +(p.edge - FOLD[mate]).toFixed(2) }];
}
// no seat for them: they stand a step away, turned toward her, never right in front of her. At a desk (she faces up)
// beside it; on a seat she sits on side on, on the floor ahead of her knees and a little nearer the viewer
const STAND_SIDE = 1.6, STAND_AHEAD = 1.5, STAND_DOWN = 0.9;
function standMate(p) {
    if (p.stand) return holdMate(null, p.stand[0], p.stand[1], p.dir === 'right' ? 'left' : 'right');   // a place set for that seat
    if (p.dir === 'up' || p.dir === 'down') return holdMate(null, p.x + STAND_SIDE, p.y + 0.7, 'left');   // anchor: feet 0.2 above
    const s = p.dir === 'right' ? 1 : -1;
    holdMate(null, p.x + s * STAND_AHEAD, p.y + STAND_DOWN + 0.2, p.dir === 'right' ? 'left' : 'right');
}
// the one walking with her sits too: the nearest other seat place of this room (the set places, nothing new), one
// they have the picture for and not where she sits; none within a few tiles and they stay standing
function mateSeat(spotId, mine, mate) {
    const room = Object.values(DATA.maps || {}).find(m => (m.spots || []).some(s => s.id === spotId));
    const ids = room ? room.spots.map(s => s.id).filter(id => SEATS[id]) : [spotId];
    const places = ids.flatMap(id => SEATS[id]).filter(p => (!p.who || p.who === mate) && hasPoseOf(mate, p.pose, p.dir)
        && Math.hypot(p.x - mine.x, p.y - mine.y) > 0.6);
    const d = p => Math.hypot(p.x - mine.x, p.y - mine.y);
    return places.sort((a, b) => d(a) - d(b)).find(p => d(p) <= MATE_REACH) || null;
}

function seatCard(spot, ui) {
    const s = getState();
    const left = sitsLeft(s);
    ui.showCard({
        tag: '쉬기', title: spot.title,
        text: `${spot.text}\n앉아 쉬면 태양 기운 1을 되찾아. 하루 ${SIT_PER_DAY}번까지(오늘 ${left}번 남음).`,
        buttons: [{ label: '닫기' }, { label: '앉아 쉬기', primary: true, onClick: async () => {
            const st = getState();
            const r = sitRest(st);
            await saveState();
            const mate = withOf(st);
            let p = seatFor(spot.id), m = null;
            const duo = p && mate && DUO[spot.id]?.[`${player.look}+${mate}`];
            if (duo && hasPoseOf(mate, p.pose, p.dir)) {         // a seat for two: both places set for this pair
                m = { ...p, who: mate, x: duo[1][0], y: duo[1][1] }; p = { ...p, x: duo[0][0], y: duo[0][1] };
            }
            const two = p?.seat && mate && pairOn(p, p.who, mate);
            if (two) [p, m] = two;
            if (p) holdPose(p.pose, p.x, p.y, p.dir);
            if (p && mate && !m) m = mateSeat(spot.id, p, mate);
            if (m) holdMate(m.pose, m.x, m.y, m.dir);
            else if (p && mate) standMate(p);
            ui.toast(r === 'rested' ? `잠깐 쉬었어. 태양 기운 ${sunLeft(st)}/${sunMax()}` : r === 'full' ? '태양 기운이 가득해. 그냥 앉아 있자' : '오늘은 충분히 쉬었어');
        } }],
    });
}

function bedCard(spot, ui) {
    const s = getState();
    const ok = tired(s);
    ui.showCard({
        tag: '잠', title: spot.title,
        text: `${spot.text}\n태양 기운이 절반 이하로 남으면 잘 수 있어(지금 ${sunLeft(s)}/${sunMax()}). 자고 나면 새 하루야. 채팅의 날짜는 그대로야.`,
        buttons: [{ label: '닫기' }, { label: ok ? '잠자기' : '아직 졸리지 않아', primary: ok, disabled: !ok, onClick: () => {
            // the one walking with her lies down beside her, if both have the picture for where they lie
            const st0 = getState(), pair = bedPair(spot.id, leadOf(st0), withOf(st0));
            const b = pair.lead, m = pair.mate;
            if (b && hasPose(b.pose, b.dir)) holdPose(b.pose, b.x, b.y, b.dir);
            if (m && hasPoseOf(withOf(st0), m.pose, m.dir)) holdMate(m.pose, m.x, m.y, m.dir);
            ui.toast('잘 자…');
            setTimeout(async () => {
                const st = getState();
                if (!(await sleepNow(st))) return;
                // a day she did something in shows its 하루 결산 by itself (daylog); an empty one just turns to morning
                if (!st.summary) ui.toast(`새 아침이야. 태양 기운 ${sunLeft(st)}/${sunMax()}`);
            }, 1400);
        } }],
    });
}

for (const id of Object.keys(SEATS)) onSpot(id, seatCard);
for (const id of Object.keys(BEDS)) onSpot(id, bedCard);
