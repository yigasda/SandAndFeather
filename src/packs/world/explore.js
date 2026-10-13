// 탐사 수첩: 지도 card → how much of each region she has seen (data/records.json exploration, core/explore.js), the 25 · 50 %
// rewards (once a region), and the 보물지도's clues and, once dug up, the treasure's record. Walking notes new places
// only on the tile where she first reaches one (onTile), and saves only then.

import { DATA } from '../../core/data.js';
import { itemInfo } from '../../core/bag.js';
import { dateLabel, fromDayNumber } from '../../core/clock.js';
import { REGIONS, claimStep, noteWhere, regionOpen, regionStatus, stepsOf } from '../../core/explore.js';
import { achievement } from '../../core/achieve.js';
import { LATER_CLUES, TREASURE, clueInfo, hasClue, isFound, ready, started } from '../../core/treasure.js';
import { getState, saveState } from '../../core/state.js';
import { bar, list, para, stack } from '../../ui/kit.js';
import { addMapPart, onTile } from '../../ui/window.js';

const TITLE_OF = { ombos: 'explore_ombos', ruins: 'explore_ruins', temple: 'explore_temple' };

let saving = false;
onTile(async (mapId, x, y, ui) => {
    const s = getState();
    if (!s?.explore) return;
    const before = Object.fromEntries(REGIONS().map(r => [r.id, regionStatus(s, r).pct]));
    const fresh = noteWhere(s, mapId, x, y);
    if (!fresh.length) return;
    // a region passed 25 / 50 / 100 %: one short line, the reward waits in the 탐사 수첩
    for (const r of REGIONS()) {
        const now = regionStatus(s, r).pct;
        const step = [100, ...stepsOf().map(st => st.pct).reverse()].find(p => before[r.id] < p && now >= p);
        if (step === 100) ui.toast(`${r.ko} 탐사 완료! 칭호 「${achievement(TITLE_OF[r.id])?.title || ''}」 · 지도 → 탐사 수첩`);
        else if (step) ui.toast(`${r.ko} 탐사 ${step}% · 지도 → 탐사 수첩에서 보상을 받아`);
    }
    if (saving) return;
    saving = true;
    try { await saveState(); } finally { saving = false; }
});

const kindKo = { place: '장소', room: '방', secret: '비밀', obelisk: '오벨리스크' };

export function exploreCard(ui, onClose = null) {
    const s = getState();
    let close = () => {};
    const rows = [];
    for (const r of REGIONS()) {
        if (!regionOpen(s, r)) { rows.push(para(`${r.ko} · 아직 가 본 적 없어`, 'sf_sub_head'), para('배를 고치고 강을 건너면 여기도 기록돼.')); continue; }
        const st = regionStatus(s, r);
        const by = {};
        for (const p of st.points) { const b = by[p.kind] ||= { n: 0, done: 0, names: [] }; b.n++; if (p.seen) { b.done++; b.names.push(p.ko); } }
        const a = achievement(TITLE_OF[r.id]);
        rows.push(para(`${r.ko} · ${st.pct}%`, 'sf_sub_head'), bar(`${st.done}/${st.total}`, st.total ? st.done / st.total : 0, 'sf_explore_bar'));
        rows.push(list([
            ...Object.entries(by).map(([k, b]) => ({ icon: { place: '📍', room: '🚪', secret: '✨', obelisk: '🔺' }[k], name: `${kindKo[k]} ${b.done}/${b.n}`,
                sub: k === 'secret' ? [...b.names, ...Array(b.n - b.done).fill('???')].join(' · ') : b.done ? b.names.join(' · ') : '아직 없어' })),
            ...stepsOf().map(x => {
                const got = Object.hasOwn(s.explore.claimed, `${r.id}:${x.pct}`), can = !got && st.pct >= x.pct;
                return { icon: got ? '✅' : '🎁', name: `탐사 ${x.pct}% 보상`, sub: [x.deben ? `데벤 ${x.deben}` : '', x.xp ? `경험치 ${x.xp}` : ''].filter(Boolean).join(' · ') + (got ? ' · 받음' : can ? '' : ` · ${x.pct}%가 되면`),
                    dim: !got && !can, buttons: can ? [{ label: '받기', primary: true, onClick: async () => {
                        const st2 = getState(); if (!claimStep(st2, r.id, x.pct)) return;
                        await saveState(); ui.toast(`${r.ko} 탐사 ${x.pct}% 보상을 받았어`); close(); exploreCard(ui, onClose);
                    } }] : [] };
            }),
            { icon: st.pct >= 100 ? '🏅' : '🔒', name: `탐사 100% · ${a?.ko || ''}`, sub: `칭호 「${a?.title || ''}」${st.pct >= 100 ? ' · 해금됨 (임무 → 업적에서 달 수 있어)' : ''}`, dim: st.pct < 100 },
        ]));
    }
    rows.push(...treasurePart(s));
    close = ui.showCard({ title: '탐사 수첩', kind: 'explore', wide: true, onClose,
        body: stack(para('지역마다 처음 가 본 장소·방, 찾은 비밀, 깨운 오벨리스크가 쌓여. 숨은 비밀은 ???로만 보여.'), ...rows),
        buttons: [{ label: '닫기', primary: true }] });
}

// the 보물지도 page: nothing before the scrap is read; then the four marks, then where, then what was found
function treasurePart(s) {
    if (!started(s)) return [];
    const T = TREASURE(), out = [para(`보물지도 · ${T.ko}`, 'sf_sub_head')];
    if (isFound(s)) {
        const g = s.treasure.got || {};
        out.push(list([
            ...Object.entries(g.relic || {}).map(([id, n]) => ({ item: id, name: `${itemInfo(id)?.ko}${n > 1 ? ` ×${n}` : ''}`, sub: '희귀 유물' })),
            ...Object.entries(g.gives || {}).map(([id, n]) => ({ item: id, name: `${itemInfo(id)?.ko}${n > 1 ? ` ×${n}` : ''}`, sub: '상자 안에' })),
            { icon: '🪙', name: `데벤 ${g.deben || 0}` },
        ]), para(`${dateLabel(fromDayNumber(s.treasure.found))}, ${DATA.maps[g.map]?.name || ''} 신전 뒤 모래에서 찾았어.`));
        return out;
    }
    out.push(list(['scrap', ...LATER_CLUES].map(id => {
        const c = clueInfo(id), got = hasClue(s, id);
        return got ? { icon: '🧭', name: `단서 「${c?.ko}」`, sub: c?.text || '' } : { icon: '❔', name: '???', sub: id === 'river' ? '강에서 무언가 걸려 올라올지도' : id === 'stone' ? '오래된 돌벽 어딘가' : '작은 모험 끝에 들을 이야기', dim: true };
    })));
    out.push(para(ready(s) ? `세 표시가 한 곳을 가리킨다: ${DATA.maps[T.map]?.name || ''}, 신전 뒤 모래. 반짝이는 곳을 찾아 조사해 봐.` : `단서 ${LATER_CLUES.filter(id => hasClue(s, id)).length + 1}/4`));
    return out;
}

// 지도 card: the button
addMapPart(ui => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sf_btn sf_explore_open'; b.textContent = '탐사 수첩';
    b.addEventListener('click', () => exploreCard(ui));
    return b;
});
