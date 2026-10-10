// 경영: the map table in the temple office. Pick a work for the village (data/works.json), pay its materials,
// deben and 태양 기운, and some game days later the map itself changes: water in the canal, more field, a boat.

import { canPay, needsText, pay } from '../../core/bag.js';
import { emit, on } from '../../core/bus.js';
import { DATA } from '../../core/data.js';
import { today } from '../../core/ledger.js';
import { addXP, journal, rank } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { list, para, stack } from '../../ui/kit.js';
import { onOpen, onSpot, travel } from '../../ui/window.js';
import { josa } from '../../core/ko.js';

const WORKS = () => DATA.works?.works || [];
export const workDone = (s, id) => !!s.works[id]?.done;

// finishes works whose days have passed; returns the ones that just finished
export function settleWorks(s = getState()) {
    if (!s) return [];
    const t = today(s), out = [];
    for (const w of WORKS()) {
        const st = s.works[w.id];
        if (!st || st.done || t < st.ready) continue;
        st.done = true;
        if (w.overlay) s.flags[`overlay:ombos:${w.overlay}`] = true;
        addXP(s, 5);
        journal(s, { ko: `${josa(w.ko, '가')} 끝났다.`, say: `${josa(w.ko, '가')} 끝난 마을 이야기를 꺼낸다.`, en: `The ${w.id === 'canal' ? 'canal by the Ombos fields runs with Nile water again' : w.id === 'field' ? 'new field beside the canal in Ombos has been ploughed' : 'old boat at the Ombos dock has been repaired and can cross the river'}.`, marks: [w.ko.split(' ')[0]], kind: 'work' });
        out.push(w);
    }
    if (out.length) emit('world:changed', { map: 'ombos' });
    return out;
}

function card(ui) {
    const s = getState();
    const t = today(s);
    const rows = WORKS().map(w => {
        const st = s.works[w.id];
        if (st?.done) return { icon: '✅', name: w.ko, sub: '끝났어', dim: true };
        if (st) return { icon: '🛠️', name: w.ko, sub: `공사 중 · ${Math.max(0, st.ready - t)}일 남음` };
        const blockedBy = w.after && !workDone(s, w.after) ? WORKS().find(x => x.id === w.after)?.ko : '';
        const ok = !blockedBy && canPay(s, w.needs, w.deben) && sunLeft(s) >= w.energy;
        return { icon: '📜', name: w.ko,
            sub: blockedBy ? `${josa(blockedBy, '가')} 먼저 끝나야 해` : `${w.about}\n필요: ${needsText(w.needs)}, 데벤 ${w.deben}, 태양 기운 ${w.energy} · ${w.days}일`,
            buttons: [{ label: '시작', primary: ok, disabled: !ok, onClick: async () => {
                if (!canPay(s, w.needs, w.deben) || !spend(s, w.energy)) return;
                pay(s, w.needs, w.deben);
                s.works[w.id] = { start: t, ready: t + w.days, done: false };
                await saveState(); ui.toast(`${josa(w.ko, '를')} 시작했어. ${w.days}일 뒤에 끝나`); close(); card(ui);
            } }] };
    });
    const close = ui.showCard({ tag: '경영', title: '지도 탁자', wide: true, body: stack(para(`데벤 ${s.bag.deben} · 모험 등급 ${rank(s)}`), list(rows)),
        buttons: [{ label: '닫기' }, { label: '안채로 들어가기', primary: true, onClick: () => { travel('temple_courtyard', 'south'); } }] });
}
// The temple door: the map table for the village's works, and the way into the residence behind it.
// (Provisional while the Ombos picture is being redrawn: the door and its point are set again then.)
onSpot('temple_hall', (spot, ui) => card(ui));

on('clock:synced', async () => { const s = getState(); if (s && settleWorks(s).length) await saveState(); });
onOpen(async ui => { const s = getState(); const done = settleWorks(s); if (done.length) { await saveState(); ui.showCard({ tag: '경영', title: '정비 완료', text: done.map(w => `${josa(w.ko, '가')} 끝났어.`).join('\n') }); } });
