// 육성: 필사실 (study → 지혜, and decoding records once 지혜 is enough), 훈련장 (→ 체력), 제단 (→ 신앙).
// Across the river: the fallen temple's inscription (a rubbing, with 지혜 2), its shrine (→ 신앙), a dig site.
// What each ability opens: 지혜 reads records, 체력 is staying power in the Duat, 신앙 is the spell there.

import { give, itemInfo, nameOf } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { canDo, markDone } from '../../core/ledger.js';
import { STATS, addStat, addXP, didAct, hasSkill, journal, lessonState } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';
import { josa } from '../../core/ko.js';

async function practise(ui, stat, kind, cost, line) {
    const s = getState();
    if (!spend(s, cost)) { ui.toast('태양 기운이 모자라'); return; }
    addStat(s, stat, 1); addXP(s, 2);
    const d = didAct(s, kind);
    await saveState();
    ui.toast(`${line} ${STATS[stat]} ${s.stats[stat]}${d ? ` · ${d}` : ''}`);
}

// records in the bag that are not read yet
const unread = s => s.bag.items.filter(it => itemInfo(it.id)?.read && !it.opened);

function scriptorium(ui) {
    const s = getState();
    const rows = unread(s).map(it => { const r = itemInfo(it.id).read; return {
        icon: itemInfo(it.id).icon, name: nameOf(it), sub: s.stats.wisdom >= r.need ? '해독할 수 있어' : `지혜 ${josa(r.need, '이')} 있어야 읽혀`,
        buttons: [{ label: '해독', primary: true, disabled: s.stats.wisdom < r.need, onClick: async () => {
            it.opened = true; addXP(s, 3); if (r.flag) s.flags[r.flag] = true; didAct(s, 'read');
            journal(s, { ko: `${josa(nameOf(it), '을')} 해독했다.`, say: `${nameOf(it)}에 적힌 내용을 이야기한다.`, en: `Somang deciphered ${itemInfo(it.id).en}: ${r.ko}`.slice(0, 220), marks: [itemInfo(it.id).ko.split(' ').pop()], kind: 'read' });
            await saveState(); close(); ui.showCard({ tag: '육성', title: `${itemInfo(it.id).icon} 해독`, text: r.ko });
        } }] }; });
    const close = ui.showCard({
        tag: '육성', title: '필사실', wide: true,
        body: stack(para(`지혜 ${s.stats.wisdom} · 공부는 태양 기운 2`), list(rows, '해독할 기록이 없어. 젖은 파피루스, 도기 조각, 지도 조각, 두루마리를 찾으면 여기서 읽어.')),
        buttons: [{ label: '공부하기', primary: true, disabled: sunLeft(s) < 2, onClick: () => { practise(ui, 'wisdom', 'study', 2, '갈대 펜이 손에 익는다.'); } }],
    });
}

onSpot('scriptorium', (spot, ui) => scriptorium(ui));
onSpot('training', (spot, ui) => {
    const s = getState();
    ui.showCard({ tag: '육성', title: '훈련장', text: `${spot.text}\n체력 ${s.stats.strength} · 훈련은 태양 기운 2. 체력은 두아트에서 버티는 힘이 돼.`,
        buttons: [{ label: '훈련하기', primary: true, disabled: sunLeft(s) < 2, onClick: () => { practise(ui, 'strength', 'train', 2, '모래 언덕을 세 번 오르내렸다.'); } }] });
});
const sealed = s => s.bag.items.find(it => itemInfo(it.id)?.open && !it.opened);
const shrine = (spot, ui) => {
    const s = getState();
    const x = lessonState(s), canSeal = (x?.st?.act === 'seal' || hasSkill(s, 'seal')) && sealed(s);
    ui.showCard({ tag: '육성', title: spot.title, text: `${spot.text}\n신앙 ${s.stats.faith} · 태양 기운 2. 신앙은 두아트에서 쓰는 주문이 돼.${canSeal ? `\n봉인된 ${josa(nameOf(canSeal), '을')} 제단에서 안정시킬 수 있어.` : ''}`,
        buttons: [
            ...(canSeal ? [{ label: '봉인 안정시키기 · 기운 1', disabled: sunLeft(s) < 1, onClick: async () => {
                if (!spend(s, 1)) return;
                const it = sealed(s), info = itemInfo(it.id);
                it.opened = true; if (info.open.gives) give(s, info.open.gives, 1, it.from); addXP(s, 3);
                const d = didAct(s, 'seal'); await saveState();
                ui.showCard({ tag: '육성', title: '봉인 안정', text: `향 연기 속에서 봉인이 조용히 풀렸다. ${info.open.ko}${d ? `\n${d}` : ''}` });
            } }] : []),
            { label: '신전 일 돕기', primary: true, disabled: sunLeft(s) < 2, onClick: () => { practise(ui, 'faith', 'pray', 2, '향을 갈고 제단을 닦았다.'); } }] });
};
onSpot('altar', shrine);
onSpot('ruins_shrine', shrine);

onSpot('inscription', (spot, ui) => {
    const s = getState();
    const done = s.flags.rubbing;
    ui.showCard({ tag: '육성', title: spot.title,
        text: done ? `${spot.text}\n탁본은 이미 떴어.` : `${spot.text}\n지혜 2가 있으면 어디를 떠야 할지 보여. 태양 기운 1.`,
        buttons: done ? null : [{ label: '탁본 뜨기', primary: true, disabled: s.stats.wisdom < 2 || sunLeft(s) < 1, onClick: async () => {
            if (!spend(s, 1)) return;
            s.flags.rubbing = true; give(s, 'tomb_rubbing', 1, 'ruins'); addXP(s, 3); await saveState();
            ui.toast('무덤 비문 탁본을 떴어. 필사실에서 해독할 수 있어');
        } }] });
});

onSpot('dig', (spot, ui) => {
    const s = getState();
    const free = canDo(s, 'ruins:dig');
    ui.showCard({ tag: '생활', title: spot.title, text: `${spot.text}\n하루 한 번, 태양 기운 1.`,
        buttons: [{ label: free ? '파 보기' : '오늘은 팠어', primary: true, disabled: !free || sunLeft(s) < 1, onClick: async () => {
            if (!spend(s, 1)) return;
            const D = DATA.duat || {};
            const pool = Math.random() < 0.3 ? D.relics : D.materials;
            const id = pool[Math.floor(Math.random() * pool.length)];
            give(s, id, 1, 'ruins'); markDone(s, 'ruins:dig'); addXP(s, 2); await saveState();
            ui.toast(`${itemInfo(id)?.icon || ''} ${josa(itemInfo(id)?.ko, '을')} 찾았어`);
        } }] });
});
