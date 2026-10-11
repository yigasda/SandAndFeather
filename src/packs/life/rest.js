// 쉬기와 잠: sit down at a seat to rest (태양 기운 +1, twice a game day), lie down in a bed to end the game day once
// half its 태양 기운 is spent (core/rest.js). Whoever walks in front sits or lies in the picture they have for that
// seat; without one yet they rest where they stand.

import { DATA } from '../../core/data.js';
import { SIT_PER_DAY, sitRest, sitsLeft, sleepNow, tired } from '../../core/rest.js';
import { getState, saveState } from '../../core/state.js';
import { sunLeft, sunMax } from '../../core/sun.js';
import { feet, holdPose, player } from '../../world/player.js';
import { onSpot } from '../../ui/window.js';

// where a pose's anchor goes (tiles), which way she faces there, and which picture. The dining table has a cushion
// on its left, right and front; sitting on the right one she faces left (the table), and so on.
const SEATS = {
    temple_table: [
        { x: 14.25, y: 5.4, dir: 'left', pose: 'sit-floor' },
        { x: 7.65, y: 5.4, dir: 'right', pose: 'sit-floor' },
        { x: 10.95, y: 6.75, dir: 'up', pose: 'sit-floor' },
    ],
    colonnade_seat: [],
};
// the middle of the body lying in bed (her head on the left pillow of Set's bed, which is wide enough for two)
const BEDS = { set_bed: { x: 15.7, y: 3.85, dir: 'down', pose: 'sleep' } };

const hasPose = (pose, dir) => !!DATA.sprites?.looks?.[player.look]?.motion?.acts?.[pose]?.[dir];

function seatFor(id) {
    const f = feet();
    const free = (SEATS[id] || []).filter(p => hasPose(p.pose, p.dir));
    return free.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0] || null;
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
            const p = seatFor(spot.id);
            if (p) holdPose(p.pose, p.x, p.y, p.dir);
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
            const b = BEDS[spot.id];
            if (b && hasPose(b.pose, b.dir)) holdPose(b.pose, b.x, b.y, b.dir);
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
