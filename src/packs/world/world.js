// The world's own things: secrets that show only at some hours, seasons or with a companion; the companion
// walking with Somang; the repaired boat that crosses to the fallen temple, and the boat back.

import { give, itemInfo } from '../../core/bag.js';
import { seasonOf } from '../../core/clock.js';
import { DATA } from '../../core/data.js';
import { noteCodex } from '../../core/codex.js';
import { canDo, markDone } from '../../core/ledger.js';
import { addXP, didAct, journal, lessonState, rank } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend } from '../../core/sun.js';
import { addThings } from '../../world/things.js';
import { onSpot, travel } from '../../ui/window.js';
import { josa } from '../../core/ko.js';

const shows = (sec, s) => {
    const w = sec.when || {};
    if (w.parts && !w.parts.includes(s.part)) return false;
    if (w.seasons && !w.seasons.includes(seasonOf(s.date.month))) return false;
    if (w.with && s.party.with !== w.with) return false;
    return sec.daily ? canDo(s, `secret:${sec.id}`) : !s.flags[`secret:${sec.id}`];
};

addThings((mapId, s) => (DATA.maps[mapId]?.secrets || []).filter(sec => shows(sec, s)).map(sec => ({
    id: `secret:${sec.id}`, x: sec.x, y: sec.y, label: sec.ko, sprite: sec.id.includes('mural') ? 'mural' : 'sparkle',
    act: async ui => {
        const st = getState();
        if (sec.daily) markDone(st, `secret:${sec.id}`); else st.flags[`secret:${sec.id}`] = true;
        noteCodex(st, 'secrets', sec.id);
        if (sec.give) give(st, sec.give, 1, mapId === 'ruins' ? 'ruins' : 'adventure');
        addXP(st, sec.xp || 2);
        if (!sec.daily) journal(st, { ko: `${josa(sec.ko, '을')} 찾았다.`, say: `${sec.ko} 이야기를 꺼낸다.`, en: `Somang found ${sec.en || sec.ko}.`, marks: [sec.ko.split(' ').pop()], kind: 'secret' });
        await saveState();
        ui.showCard({ tag: '발견', title: sec.ko, text: `${sec.text}${sec.give ? `\n가방에 ${josa(itemInfo(sec.give)?.ko, '이')} 들어왔어.` : ''}` });
    },
})));

// 짐 다루기: a collapsed passage behind the temple, there while that lesson is at its last step
addThings((mapId, s) => {
    const x = lessonState(s);
    if (mapId !== 'ombos' || x?.st?.act !== 'clear' || s.flags.passage) return [];
    return [{ id: 'passage', x: 34, y: 8, label: '무너진 통로', sprite: 'stone', act: ui => {
        const st = getState();
        ui.showCard({ tag: '육성', title: '무너진 통로', text: `신전 뒤 통로가 돌무더기로 막혀 있다. 체력 ${st.stats.strength} · 태양 기운 2.`, buttons: [{ label: '닫기' }, { label: '돌 치우기', primary: true, disabled: st.stats.strength < 1, onClick: async () => {
            if (!spend(st, 2)) { ui.toast('태양 기운이 모자라'); return; }
            st.flags.passage = true; give(st, 'was_shard', 1, 'adventure'); addXP(st, 4);
            const d = didAct(st, 'clear'); await saveState();
            ui.showCard({ tag: '육성', title: '통로가 열렸다', text: `돌을 하나씩 들어 옮기자 좁은 통로가 드러났다. 바닥에 와스 지팡이 조각이 떨어져 있다.${d ? `\n${d}` : ''}` });
        } }] });
    } }];
});

// the boat across the river, once it is repaired
addThings((mapId, s) => (mapId === 'ombos' && s.works.boat?.done ? [{
    id: 'boat', x: 27, y: 29, label: '고친 배', sprite: 'boat',
    act: ui => {
        if (rank(getState()) < 3) { ui.showCard({ title: '고친 배', text: '배는 다 고쳤어. 강 건너까지 가려면 모험 등급 3이 필요해.' }); return; }
        ui.showCard({ title: '고친 배', text: '강 건너 무너진 신전까지 노를 저어 갈까?', buttons: [{ label: '닫기' }, { label: '건너가기', primary: true, onClick: () => { travel('ruins'); } }] });
    },
}] : []));
onSpot('ruins_dock', (spot, ui) => ui.showCard({ title: '배', text: '옴보스로 돌아갈까?', buttons: [{ label: '닫기' }, { label: '돌아가기', primary: true, onClick: () => { travel('ombos', { x: 25, y: 28 }); } }] }));

// the companion's name for the prompt-free parts of the game
export const companion = s => (s.party.with ? DATA.duat?.companions?.[s.party.with] : null);
