// 오벨리스크: stones standing about each map (data/maps/*.json "obelisks"). Walk up to one and wake it once; from
// then on the 지도 tab can take Somang to any woken one, on this map or across the river, at no cost.
// The ones across the river can only be woken by getting there by boat first.

import { DATA } from '../../core/data.js';
import { addXP } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { addMapMarks, addMapPart, travel } from '../../ui/window.js';
import { list } from '../../ui/kit.js';
import { addThings } from '../../world/things.js';

const key = id => `obelisk:${id}`;
const all = () => Object.entries(DATA.maps).flatMap(([mapId, m]) => (m.obelisks || []).map(o => ({ ...o, mapId, mapName: m.name })));
export const awake = (s = getState()) => all().filter(o => s?.flags[key(o.id)]);

addThings((mapId, s) => (DATA.maps[mapId]?.obelisks || []).map(o => {
    const on = !!s.flags[key(o.id)];
    return { id: key(o.id), x: o.x, y: o.y, label: on ? o.ko : `${o.ko} · 잠듦`, sprite: on ? 'obelisk_on' : 'obelisk', act: ui => wake(ui, o, mapId) };
}));

async function wake(ui, o, mapId) {
    const s = getState();
    if (s.flags[key(o.id)]) { goCard(ui, mapId); return; }
    s.flags[key(o.id)] = true;
    addXP(s, 2);
    await saveState();
    ui.showCard({ tag: '탐험', title: o.ko, text: `손을 대자 꼭대기의 금빛이 깨어났다.\n이제 지도 탭에서 깨운 오벨리스크로 바로 갈 수 있어. 깨운 곳 ${awake(s).length}/${all().length}`,
        buttons: [{ label: '닫기' }, { label: '다른 곳으로', primary: awake(s).length > 1, disabled: awake(s).length < 2, onClick: () => { goCard(ui, mapId); } }] });
}

// the woken ones as rows to go to
function rows(ui, here) {
    const s = getState();
    const list0 = awake(s);
    return list0.map(o => ({ icon: '▲', name: o.ko, sub: `${o.mapName} · ${o.about}`,
        buttons: [{ label: '가기', primary: true, onClick: () => { travel(o.mapId, { x: o.x, y: o.y + 1 }); } }] }));
}
function goCard(ui, mapId) {
    ui.showCard({ tag: '오벨리스크', title: '어디로 갈까', body: list(rows(ui, mapId), '아직 깨운 오벨리스크가 없어.') });
}

// in the 지도 tab: where she can go
addMapPart(ui => {
    const s = getState();
    const n = awake(s).length;
    if (!all().length) return null;
    const box = document.createElement('div');
    box.className = 'sf_stack';
    const head = document.createElement('div');
    head.className = 'sf_sub_head';
    head.textContent = `오벨리스크 ${n}/${all().length}${n ? ' · 눌러서 바로 가기' : ' · 가까이 가서 깨워'}`;
    box.append(head);
    if (n) box.append(list(rows(ui)));
    return box;
});
addMapMarks(mapId => (DATA.maps[mapId]?.obelisks || []).map(o => ({ x: o.x, y: o.y, on: !!getState()?.flags[key(o.id)] })));
