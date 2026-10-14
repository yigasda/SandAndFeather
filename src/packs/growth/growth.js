// 육성: 필사실 (study → 지혜, and decoding records once 지혜 is enough), 훈련장 (→ 체력), 제단 (→ 신앙).
// Across the river: the fallen temple's inscription (a rubbing, with 지혜 2), its shrine (→ 신앙), a dig site.
// What each ability opens: 지혜 reads records, 체력 is staying power in the Duat, 신앙 is the spell there.

import { give, itemInfo, nameOf, takeUid } from '../../core/bag.js';
import { record } from '../../core/facts.js';
import { DATA } from '../../core/data.js';
import { canDo, markDone } from '../../core/ledger.js';
import { STATS, addStat, addXP, didAct, hasSkill, journal, lessonState } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';
import { josa } from '../../core/ko.js';
import { busyPose } from '../life/poses.js';

// one practice: costs `cost`, +1 to the stat, 경험치 2 + more. `use` is an item id that goes into it (a blank papyrus,
// a cake of incense): it is checked and taken on the state as it is now, together with the sun, or nothing happens
async function practise(ui, stat, kind, cost, line, { more = 0, use = '' } = {}) {
    const s = getState();
    const it = use ? s.bag.items.find(x => x.id === use) : null;
    if (use && !it) { ui.toast('가방에 없어'); return; }
    if (!spend(s, cost)) { ui.toast('태양 기운이 모자라'); return; }
    if (it) takeUid(s, it.uid);
    addStat(s, stat, 1); addXP(s, 2 + more);
    record(s, kind, { itemId: use, itemUid: it?.uid || '', source: kind });
    const d = didAct(s, kind);
    await saveState();
    if (kind === 'study') busyPose('read', 'down', { ms: 2600, fx: [{ name: 'bubble-music', size: 0.95, ms: 1400 }] }); // 0.9.70: reading the scroll
    ui.toast(`${line} ${STATS[stat]} ${s.stats[stat]}${more ? ` · 경험치 +${2 + more}` : ''}${d ? ` · ${d}` : ''}`);
}

// 필사실 tools in the bag: study { xp } ones help every time and are kept (one of each kind counts), study { use }
// ones (a blank papyrus) are used up for a cheaper study
const toolXP = s => [...new Set(s.bag.items.map(x => x.id))].reduce((a, id) => a + (itemInfo(id)?.study?.use ? 0 : itemInfo(id)?.study?.xp || 0), 0);
const sheet = s => s.bag.items.find(x => itemInfo(x.id)?.study?.use);

// records in the bag that are not read yet
const unread = s => s.bag.items.filter(it => itemInfo(it.id)?.read && !it.opened);

function scriptorium(ui) {
    const s = getState(), xp = toolXP(s), sh = sheet(s);
    const rows = unread(s).map(it => { const r = itemInfo(it.id).read; return {
        icon: itemInfo(it.id).icon, item: it.id, name: nameOf(it), sub: s.stats.wisdom >= r.need ? '해독할 수 있어' : `지혜 ${josa(r.need, '이')} 있어야 읽혀`,
        buttons: [{ label: '해독', primary: true, disabled: s.stats.wisdom < r.need, onClick: async () => {
            it.opened = true; addXP(s, 3); if (r.flag) s.flags[r.flag] = true; didAct(s, 'read');
            journal(s, { ko: `${josa(nameOf(it), '을')} 해독했다.`, say: `${nameOf(it)}에 적힌 내용을 이야기한다.`, en: `Somang deciphered ${itemInfo(it.id).en}: ${r.ko}`.slice(0, 220), marks: [itemInfo(it.id).ko.split(' ').pop()], kind: 'read' });
            await saveState(); close(); ui.showCard({ tag: '육성', title: `${itemInfo(it.id).icon} 해독`, text: r.ko });
            busyPose('read', 'down', { ms: 2600, fx: [{ name: 'bubble-question', size: 0.95, ms: 1400 }] });
        } }] }; });
    const close = ui.showCard({
        tag: '육성', title: '필사실', wide: true,
        body: stack(para(`지혜 ${s.stats.wisdom} · 공부는 태양 기운 2${xp ? ` · 필기구 덕에 경험치 +${xp}` : ''}${sh ? ` · ${josa(itemInfo(sh.id).ko, '을')} 쓰면 기운 ${2 + (itemInfo(sh.id).study.sun || 0)}` : ''}`),
            list(rows, '해독할 기록이 없어. 젖은 파피루스, 도기 조각, 지도 조각, 두루마리를 찾으면 여기서 읽어.')),
        buttons: [
            ...(sh ? [{ label: `${itemInfo(sh.id).ko}에 공부 · 기운 ${2 + (itemInfo(sh.id).study.sun || 0)}`, disabled: sunLeft(s) < 2 + (itemInfo(sh.id).study.sun || 0),
                onClick: () => { practise(ui, 'wisdom', 'study', 2 + (itemInfo(sh.id).study.sun || 0), '새 파피루스에 또박또박 옮겨 썼다.', { more: toolXP(getState()), use: sh.id }); } }] : []),
            { label: '공부하기', primary: true, disabled: sunLeft(s) < 2, onClick: () => { practise(ui, 'wisdom', 'study', 2, '갈대 펜이 손에 익는다.', { more: toolXP(getState()) }); } }],
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
            ...(kindsOf(s, 'incense').length ? [{ label: '향 피우고 돕기', onClick: () => { incenseCard(spot, ui); } }] : []),
            ...(kindsOf(s, 'jewelry').length ? [{ label: canDo(s, 'altar:offer') ? '장신구 바치기' : '오늘은 바쳤어', disabled: !canDo(s, 'altar:offer'), onClick: () => { offerCard(spot, ui); } }] : []),
            { label: '신전 일 돕기', primary: true, disabled: sunLeft(s) < 2, onClick: () => { practise(ui, 'faith', 'pray', 2, '향을 갈고 제단을 닦았다.'); } }] });
};
// the kinds of a sort of item in the bag, each once
const kindsOf = (s, kind) => [...new Set(s.bag.items.filter(x => itemInfo(x.id)?.kind === kind).map(x => x.id))];
const countIn = (s, id) => s.bag.items.filter(x => x.id === id).length;
// 향 피우기: the temple work with a cake of incense burning costs less (offer.sun) and teaches more (offer.xp)
function incenseCard(spot, ui) {
    const s = getState();
    const close = ui.showCard({ tag: '육성', title: `${spot.title} · 향`, wide: true,
        body: stack(para('향을 하나 피우고 신전 일을 도우면 태양 기운이 덜 들어. 향은 타서 없어져.'), list(kindsOf(s, 'incense').map(id => {
            const i = itemInfo(id), o = i.offer || {}, cost = o.sun ?? 2;
            return { icon: i.icon, item: id, name: `${i.ko} · ${countIn(s, id)}개`, sub: `태양 기운 ${cost} · 신앙 +1 · 경험치 +${2 + (o.xp || 0)}`,
                buttons: [{ label: '피우기', primary: true, disabled: sunLeft(s) < cost, onClick: () => { close(); practise(ui, 'faith', 'pray', cost, `${josa(i.ko, '을')} 피우고 제단을 닦았다.`, { more: o.xp || 0, use: id }); } }] };
        }), '향이 없어')),
        buttons: [{ label: '돌아가기', onClick: () => { shrine(spot, ui); } }] });
}
// 바치기: one piece of jewelry a day goes to the god; 신앙 + offer.faith, 경험치 + offer.xp. Free, but once a game day
function offerCard(spot, ui) {
    const s = getState();
    const close = ui.showCard({ tag: '육성', title: `${spot.title} · 바치기`, wide: true,
        body: stack(para('장신구 하나를 제단에 바쳐. 하루 한 번, 태양 기운은 안 들어. 바친 것은 돌아오지 않아.'), list(kindsOf(s, 'jewelry').map(id => {
            const i = itemInfo(id), o = i.offer || {};
            return { icon: i.icon, item: id, name: `${i.ko} · ${countIn(s, id)}개`, sub: `신앙 +${o.faith || 1}${o.xp ? ` · 경험치 +${o.xp}` : ''} · 값 ${i.price} 데벤`,
                buttons: [{ label: '바치기', primary: true, disabled: !canDo(s, 'altar:offer'), onClick: async () => {
                    const st = getState(), it = st.bag.items.find(x => x.id === id);
                    if (!it || !canDo(st, 'altar:offer')) return;
                    takeUid(st, it.uid); markDone(st, 'altar:offer');
                    addStat(st, 'faith', o.faith || 1); if (o.xp) addXP(st, o.xp);
                    record(st, 'offer', { itemId: id, itemUid: it.uid, source: 'altar' });
                    await saveState(); close();
                    ui.toast(`${josa(i.ko, '을')} 바쳤어. ${STATS.faith} ${st.stats.faith}`);
                } }] };
        }), '바칠 장신구가 없어')),
        buttons: [{ label: '돌아가기', onClick: () => { shrine(spot, ui); } }] });
}
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
