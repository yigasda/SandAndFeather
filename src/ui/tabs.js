// The tabs under the map: 소망 (abilities and 모험 등급), 파티 (who walks with her), 임무 (today's commissions,
// the small adventure's next step, and the journal of things she can bring up in the chat).

import { emit } from '../core/bus.js';
import { DATA } from '../core/data.js';
import { DAILY_NEED, STATS, dailyTasks, lessonList, lessonState, pickLesson, rankInfo } from '../core/progress.js';
import { dropLessonPicks, dropPick, livePicks } from '../core/picks.js';
import { getState, saveState } from '../core/state.js';
import { sunLeft, sunMax } from '../core/sun.js';
import { hint } from '../packs/adventure/engine.js';
import { bar, list, para, stack } from './kit.js';
import { showEvent } from './talk.js';

export function somangCard(ui, onClose) {
    const s = getState();
    let close = () => {};
    const r = rankInfo(s.stats.xp);
    const opens = { wisdom: '기록 해독, 강 건너 비문', strength: '두아트에서 버티는 체력, 공격', faith: '두아트의 주문' };
    close = ui.showCard({ title: '소망', onClose,
        body: stack(
            bar(`모험 등급 ${r.rank} · ${r.next ? `${s.stats.xp}/${r.next}` : '최고'}`, r.frac, 'sf_rank'),
            para(r.rank < 2 ? '등급 2: 두아트 길이 하나 더 길어져' : r.rank < 3 ? '등급 3: 고친 배로 강 건너 신전에 갈 수 있어' : '등급이 오를수록 모험에서 유물이 나와'),
            list(Object.entries(STATS).map(([k, ko]) => ({ icon: { wisdom: '📜', strength: '💪', faith: '🔆' }[k], name: `${ko} ${s.stats[k]}`, sub: opens[k] }))),
            para('배움 목표 · 하나를 골라 이어서 익혀. 날을 건너뛰어도 그대로야', 'sf_sub_head'),
            list(lessonList().map(L => {
                const done = s.lessons.done.includes(L.id), cur = s.lessons.cur === L.id;
                const x = cur ? lessonState(s) : null;
                return { icon: done ? '✅' : cur ? '▶️' : '◻️', name: `${L.ko}${done ? ` · ${L.skill}` : ''}`,
                    sub: done ? '익혔어' : cur ? `지금: ${x.st.ko} ${x.p.n}/${x.st.n}` : `${L.about}\n${L.steps.map(t => t.ko).join(' → ')}`,
                    buttons: done || cur ? [] : [{ label: '이걸 익히기', onClick: async () => { pickLesson(s, L.id); dropLessonPicks(s); await saveState(); close(); somangCard(ui, onClose); } }] };
            })),
            para(`태양 기운 ${sunLeft(s)}/${sunMax()} · 데벤 ${s.bag.deben}`)) });
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
    const picks = livePicks(s).filter(p => p.kind !== 'lesson').reverse();
    const close = ui.showCard({ title: '임무', wide: true, onClose,
        body: stack(
            para('작은 모험', 'sf_sub_head'),
            para(hint(s) || '오늘 모험은 끝났어. 다음 날 새로 생겨.'),
            para(`매일 의뢰 · 넷 중 아무거나 ${DAILY_NEED}개 · 하나에 데벤 ${r.deben || 10}`, 'sf_sub_head'),
            list(daily.map(t => ({ icon: t.done ? '✅' : '◻️', name: t.ko, sub: t.done ? '완료' : '', dim: !t.done && daily.filter(x => x.done).length >= DAILY_NEED })), '오늘 의뢰가 없어.'),
            (x => x ? para(`배움: ${x.L.ko} · ${x.st.ko} ${x.p.n}/${x.st.n}`) : null)(lessonState(s)),
            picks.length ? para('챗에서 받은 것', 'sf_sub_head') : null,
            picks.length ? list(picks.map(p => ({ icon: p.kind === 'idea' ? '🧭' : '📌', name: p.text,
                sub: p.kind === 'idea' ? '모험 소재 · 다음 AI 모험에 써' : '메모',
                buttons: [{ label: '지우기', onClick: async () => { await dropPick(p.id); close(); questsCard(ui, onClose); } }] }))) : null,
            para('일지 · 원할 때 지금 장면에 꺼내', 'sf_sub_head'),
            list(told.map(e => ({ icon: e.told ? '💬' : '📝', name: e.ko, sub: e.told ? '챗에 꺼냄' : '',
                buttons: e.en ? [{ label: '꺼내기', primary: !e.told, onClick: () => { showEvent(ui, e); } }] : [] })), '아직 적힌 일이 없어.')) });
}
