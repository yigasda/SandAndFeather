// 선착장: fishing (a timing bar: pull when the marker is in the green; three casts for 태양 기운 1) and,
// once a game day, pulling something out of the reeds. What comes up follows the hour and the season
// (data/finds.json) and is less likely to be what came up lately.

import { give, itemInfo } from '../../core/bag.js';
import { seasonOf } from '../../core/clock.js';
import { DATA } from '../../core/data.js';
import { canDo, markDone } from '../../core/ledger.js';
import { addXP, didAct } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { itemCard } from '../../ui/items.js';
import { onSpot, onTile, travel } from '../../ui/window.js';
import { holdMate, holdPose, player, poseFrame } from '../../world/player.js';
import { withOf } from '../../core/heroes.js';
import { dropFx, fishLine, showFx } from '../../world/fx.js';
import { hasAct } from './poses.js';
import { josa } from '../../core/ko.js';
import { partNow } from '../../core/rest.js';
import { noteCatch, fishSizes } from '../../core/fishing.js';
import { clueFound } from '../../core/treasure.js';
import { list, para, stack } from '../../ui/kit.js';
import { dateLabel, fromDayNumber } from '../../core/clock.js';

const KEY = 'dock:pull';

export function pickFrom(table, s, recent = []) {
    const season = seasonOf(s.date.month);
    const pool = (table || []).filter(f => (!f.parts?.length || f.parts.includes(partNow(s))) && (!f.seasons?.length || f.seasons.includes(season)));
    const w = pool.map(f => Number(f.weight) * (recent.includes(f.item) ? 0.25 : 1));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let k = 0; k < pool.length; k++) { r -= w[k]; if (r <= 0) return pool[k].item; }
    return pool[0]?.item || null;
}

onSpot('dock', (spot, ui, map) => {
    // 0.9.70: the village's pier only leads down to the dock's own map; fishing is done there
    if (map?.id === 'ombos') { travel('dock_pier', 'path'); return; }
    const s = getState();
    const free = canDo(s, KEY);
    ui.showCard({
        tag: '생활', title: spot.title,
        text: `${spot.text}\n낚시는 태양 기운 1로 세 번 던져. 갈대 사이 건지기는 하루 한 번 공짜야.`,
        buttons: [
            { label: free ? '갈대 사이 건지기' : '오늘은 건졌어', disabled: !free, onClick: () => { pull(ui, map); } },
            { label: '낚시 기록', onClick: () => { recordsCard(ui); } },
            { label: '낚시하기', primary: true, disabled: sunLeft(s) < 1, onClick: () => { fish(ui, map); } },
        ],
    });
});

async function pull(ui, map) {
    const s = getState();
    if (!canDo(s, KEY)) return;
    const id = pickFrom(DATA.finds?.dock, s, s.recent.finds);
    if (!id) { ui.toast('건질 게 없어. data/finds.json을 봐 줘'); return; }
    const [uid] = give(s, id, 1, 'dock');
    markDone(s, KEY);
    s.recent.finds = [...(s.recent.finds || []), id].slice(-4);
    addXP(s, 1);
    const d = didAct(s, 'pull');
    await saveState();
    if (d) ui.toast(d);
    itemCard(ui, map, uid, { fresh: true });
}

// 0.9.70 생활 묶음: fishing, whoever walks in front sits on the end of the pier (the approved fishing pictures: 0 waiting,
// 1 pulling), the line runs from the rod's end to the bobber, the bucket stands beside on the boards and fills as they
// catch (빈 → 조금 → 가득). Pulling: a little jump, a splash, "!" on a bite. Standing up takes the bucket away.
// On the dock's own map (0.9.70, tools/maps/dock.py): the middle of the deck's front edge, the bucket on the boards to
// the right, the bobber out in the water ahead and to the left; the one walking with them stands behind on the boards,
// on the bucket's side, watching (MATE: their feet)
const PIER = { x: 9.45, y: 6.9 }, BUCKET = { x: 10.25, y: 6.75 }, FLOAT = { x: 8.1, y: 7.85 }, MATE = { x: 10.35, y: 5.85 };
const BUCKET_H = 720 / 576 * 1.95, BUCKET_DY = (720 - 662) / 576 * 1.95; // the bucket picture: 620×720, feet line 662, character scale
const bucket = n => showFx(`bucket-${Math.min(2, n)}`, { at: { ...BUCKET }, ms: 0, size: BUCKET_H, dy: BUCKET_DY, fade: false, key: 'bucket' });
onTile(() => { if (player.act?.name !== 'fish') { dropFx('bucket'); fishLine(null); } });

// the fishing bar: a marker runs back and forth, the green part is where a pull catches
async function fish(ui, map) {
    const s = getState();
    if (!spend(s, 1)) { ui.toast('태양 기운이 모자라'); return; }
    await saveState();
    let casts = 3, caught = [], clueLine = ''; // clueLine: the 보물지도 clue, kept on screen through the next casts
    const box = document.createElement('div');
    box.className = 'sf_fish';
    box.innerHTML = '<div class="sf_fish_bar"><i class="sf_fish_zone"></i><b class="sf_fish_mark"></b></div><div class="sf_note sf_fish_msg">찌가 흔들릴 때 당겨.</div>';
    const zone = box.querySelector('.sf_fish_zone'), mark = box.querySelector('.sf_fish_mark'), msg = box.querySelector('.sf_fish_msg');
    let zx = 0, zw = 0, pos = 0, dir = 1, speed = 0.9, raf = 0, last = 0;
    const newZone = () => { zw = 0.14 + Math.random() * 0.1; zx = 0.1 + Math.random() * (0.8 - zw); zone.style.left = `${zx * 100}%`; zone.style.width = `${zw * 100}%`; speed = 0.8 + Math.random() * 0.7; };
    newZone();
    const tick = t => {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
        pos += dir * speed * dt; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
        mark.style.left = `${pos * 100}%`;
        raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    let close;
    const seated = map?.id === 'dock_pier' && hasAct(player.look, 'fish', 'down');
    if (seated) {
        holdPose('fish', PIER.x, PIER.y, 'down'); poseFrame(0); fishLine({ who: 'lead', to: { ...FLOAT } }); bucket(0);
        if (withOf(s)) holdMate(null, MATE.x, MATE.y, 'down');
    }
    let back = 0;
    const pullLine = async () => {
        if (casts <= 0) return false;
        casts--;
        const hit = pos >= zx && pos <= zx + zw;
        if (seated) {
            poseFrame(1, true); clearTimeout(back); back = setTimeout(() => { if (player.act?.name === 'fish') poseFrame(0); }, 700);
            if (hit) { showFx('splash-0', { at: { ...FLOAT }, ms: 750, size: 1.35, dy: 0.3, key: 'splash' }); showFx('bubble-exclaim', { who: 'lead', ms: 900, size: 0.95, key: 'bite' }); }
        }
        if (hit) {
            const id = pickFrom(DATA.finds?.fish, s);
            const [uid] = give(s, id, 1, 'dock'); caught.push(id);
            if (seated) bucket(caught.length);
            const n = noteCatch(s, id, uid);
            msg.textContent = `${itemInfo(id)?.icon || ''} ${josa(itemInfo(id)?.ko || id, '을')} 낚았어!${n ? ` ${n.cm}cm${n.first ? ' · 첫 기록' : n.best ? ' · 새 기록!' : ''}` : ''} 남은 던지기 ${casts}`;
            if (n) { const c = clueFound(s, 'river'); if (c) clueLine = `✦ 보물지도 단서 「${c.ko}」: ${c.text}`; }
            if (clueLine) msg.textContent += `\n${clueLine}`;
        } else msg.textContent = `놓쳤어. 남은 던지기 ${casts}`;
        newZone();
        if (casts <= 0) {
            cancelAnimationFrame(raf);
            if (caught.length) { addXP(s, caught.length); const d = didAct(s, 'fish'); if (d) msg.textContent += `\n${d}`; }
            await saveState();
            msg.textContent += caught.length ? `\n오늘 낚은 것: ${caught.map(id => itemInfo(id)?.ko).join(', ')}` : '\n오늘은 한 마리도 못 낚았어.';
            box.querySelector('.sf_fish_bar').classList.add('sf_off');
            if (seated) fishLine(null);
        }
        return false; // keep the card open
    };
    close = ui.showCard({
        tag: '생활', title: '낚시', body: box, kind: 'fishing',   // sits low, so the one fishing on the pier stays in view
        buttons: [{ label: '닫기', onClick: () => { cancelAnimationFrame(raf); } }, { label: '당기기', primary: true, onClick: () => { pullLine(); return false; } }],
        onClose: () => { cancelAnimationFrame(raf); fishLine(null); },
    });
}

// 낚시 기록: each kind of fish, its best length, how many and when; kept when the fish are sold or eaten
export function recordsCard(ui) {
    const s = getState(), recs = s.fishing.records;
    const ids = Object.keys(fishSizes());
    const got = ids.filter(id => recs[id]);
    ui.showCard({ tag: '생활', title: '낚시 기록', kind: 'fish-records',
        body: stack(
            para(`잡은 물고기 ${got.length}/${ids.length}종 · 모두 ${got.reduce((a, id) => a + recs[id].count, 0)}마리`),
            list(ids.map(id => {
                const r = recs[id], info = itemInfo(id);
                return r ? { item: id, icon: info?.icon, name: `${info?.ko} · 최고 ${r.best}cm`, sub: `${r.count}마리 · 처음 ${dateLabel(fromDayNumber(r.first))} · 마지막 ${dateLabel(fromDayNumber(r.last))}` }
                    : { icon: '❔', name: '???', sub: '아직 낚아 본 적 없어', dim: true };
            })),
            para('낚시로 건진 물고기만 기록돼. 팔거나 요리해도 기록은 남아.', 'sf_note')),
        buttons: [{ label: '닫기', primary: true }] });
}
