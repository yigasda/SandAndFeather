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
import { onSpot } from '../../ui/window.js';
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
    const pullLine = async () => {
        if (casts <= 0) return false;
        casts--;
        if (pos >= zx && pos <= zx + zw) {
            const id = pickFrom(DATA.finds?.fish, s);
            const [uid] = give(s, id, 1, 'dock'); caught.push(id);
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
        }
        return false; // keep the card open
    };
    close = ui.showCard({
        tag: '생활', title: '낚시', body: box,
        buttons: [{ label: '닫기', onClick: () => { cancelAnimationFrame(raf); } }, { label: '당기기', primary: true, onClick: () => { pullLine(); return false; } }],
        onClose: () => cancelAnimationFrame(raf),
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
