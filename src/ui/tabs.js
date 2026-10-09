// The tabs under the map: 소망 (abilities and 모험 등급), 파티 (who walks with her), 임무 (today's commissions,
// the small adventure's next step, and the journal of things she can bring up in the chat).

import { emit } from '../core/bus.js';
import { DATA } from '../core/data.js';
import { STATS, dailyTasks, rankInfo } from '../core/progress.js';
import { getState, saveState } from '../core/state.js';
import { SUN_MAX, sunLeft } from '../core/sun.js';
import { hint } from '../packs/adventure/engine.js';
import { bar, list, para, stack } from './kit.js';
import { showEvent } from './talk.js';

export function somangCard(ui, onClose) {
    const s = getState();
    const r = rankInfo(s.stats.xp);
    const opens = { wisdom: '기록 해독, 강 건너 비문', strength: '두아트에서 버티는 체력, 공격', faith: '두아트의 주문' };
    ui.showCard({ title: '소망', onClose,
        body: stack(
            bar(`모험 등급 ${r.rank} · ${r.next ? `${s.stats.xp}/${r.next}` : '최고'}`, r.frac, 'sf_rank'),
            para(r.rank < 2 ? '등급 2: 두아트 길이 하나 더 길어져' : r.rank < 3 ? '등급 3: 고친 배로 강 건너 신전에 갈 수 있어' : '등급이 오를수록 모험에서 유물이 나와'),
            list(Object.entries(STATS).map(([k, ko]) => ({ icon: { wisdom: '📜', strength: '💪', faith: '🔆' }[k], name: `${ko} ${s.stats[k]}`, sub: opens[k] }))),
            para(`태양 기운 ${sunLeft(s)}/${SUN_MAX} · 데벤 ${s.bag.deben}`)) });
}

export function partyCard(ui, onClose) {
    const s = getState();
    const C = DATA.duat?.companions || {};
    const set = async id => { s.party.with = id; await saveState(); emit('world:changed', { map: s.pos.map }); close(); partyCard(ui, onClose); };
    const close = ui.showCard({ title: '파티', onClose,
        body: stack(para('함께 걸으면 혼자는 못 보는 것이 보여. 세트는 모래 밑을, 호루스는 높은 곳을 봐. 두아트에도 기본으로 같이 가.'),
            list([['', { ko: '혼자', about: '조용히 다니기' }], ...Object.entries(C)].map(([id, c]) => ({
                icon: s.party.with === id ? '✔' : '', name: c.ko, sub: c.about,
                buttons: [{ label: s.party.with === id ? '함께하는 중' : '고르기', primary: s.party.with === id, disabled: s.party.with === id, onClick: () => set(id) }] })))) });
}

export function questsCard(ui, onClose) {
    const s = getState();
    const daily = dailyTasks(s);
    const r = DATA.daily?.reward || {};
    const told = s.journal.slice().reverse().slice(0, 12);
    ui.showCard({ title: '임무', wide: true, onClose,
        body: stack(
            para('작은 모험', 'sf_sub_head'),
            para(hint(s) || '오늘 모험은 끝났어. 다음 날 새로 생겨.'),
            para(`매일 의뢰 · 하나에 데벤 ${r.deben || 10}`, 'sf_sub_head'),
            list(daily.map(t => ({ icon: t.done ? '✅' : '◻️', name: t.ko, sub: t.done ? '완료' : '' })), '오늘 의뢰가 없어.'),
            para('일지 · 원할 때 지금 장면에 꺼내', 'sf_sub_head'),
            list(told.map(e => ({ icon: e.told ? '💬' : '📝', name: e.ko, sub: e.told ? '챗에 꺼냄' : '',
                buttons: e.en ? [{ label: '꺼내기', primary: !e.told, onClick: () => { showEvent(ui, e); } }] : [] })), '아직 적힌 일이 없어.')) });
}
