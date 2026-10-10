// The tabs under the map: 소망 (abilities and 모험 등급), 파티 (who walks with her), 임무 (today's commissions,
// the small adventure's next step, and the journal of things she can bring up in the chat).

import { emit } from '../core/bus.js';
import { DATA } from '../core/data.js';
import { DAILY_NEED, STATS, dailyTasks, lessonList, lessonState, pickLesson, rankInfo } from '../core/progress.js';
import { dropLessonPicks, dropPick, livePicks } from '../core/picks.js';
import { getState, saveState } from '../core/state.js';
import { sunLeft, sunMax } from '../core/sun.js';
import { hint } from '../packs/adventure/engine.js';
import { festivalLine } from '../packs/life/festival.js';
import { bar, list, para, stack } from './kit.js';
import { codexCard } from './codexcard.js';
import { showEvent } from './talk.js';
import { portrait, characterDetail } from './portraits.js';
import { FEATHER } from './icon.js';

export function somangCard(ui, onClose) {
    const s = getState();
    let close = () => {};
    const r = rankInfo(s.stats.xp);
    const opens = { wisdom: '기록 해독, 강 건너 비문', strength: '두아트에서 버티는 체력, 공격', faith: '두아트의 주문' };
    const hero = document.createElement('div'); hero.className = 'sf_character_summary';
    hero.append(portrait('somang'),stack(para('소망','sf_character_name'),para(`모험 등급 ${r.rank}`),
        ...Object.entries(STATS).map(([k,ko])=>para(`${ko} ${s.stats[k]}`,'sf_character_stat'))));
    close = ui.showCard({ title: '소망', onClose, kind:'character-stats', wide:true,
        body: stack(
            hero,
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
            para(`태양 기운 ${sunLeft(s)}/${sunMax()} · 데벤 ${s.bag.deben}`)),
        buttons: [{ label: '도감', onClick: () => { codexCard(ui, onClose); } }, { label: '닫기', primary: true }] });
}

// 파티: who walks with her now, then one card each for 혼자 / 세트 / 호루스 — the name, what walking together
// does, 고르기. A god's card has his mark and 인물 보기, which opens his picture large.
const SIGIL = {
    '': FEATHER,
    // was-scepter: Set-animal head on a staff, forked foot
    set: '<svg class="sf_sigil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8v12.5"/><path d="M12 8c0-1.7.9-2.8 2.4-3.4l4.4-1.3-1.5 2.6-3 .9"/><path d="M13.3 4.8l-.7-2.6M14.9 4.2V1.8"/><path d="M12 20.5l-2.2 2M12 20.5l2.2 2"/></svg>',
    // wedjat: the eye of Horus
    horus: '<svg class="sf_sigil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11c3-3.5 6.5-4.5 9-4.5s5.5 1 8.5 4.5c-3 2.6-6 3.5-8.5 3.5S6 13.6 3 11z"/><circle cx="12" cy="10.8" r="2.1" fill="currentColor"/><path d="M4 6.6c3-2.2 6-3 8.5-3s5.5.8 7.5 2.4"/><path d="M10.6 14.4 9.2 20"/><path d="M13.6 14.2c1 2.2 2.6 3.6 4.6 3.6 1.4 0 2.2-.9 2-1.9-.2-1-1.3-1.2-1.9-.6"/></svg>',
};
export function partyCard(ui, onClose) {
    const s = getState();
    const C = DATA.duat?.companions || {};
    const options = [['', { ko: '혼자', about: '조용히 다니기. 어디든 소망 혼자 걸어.' }], ...Object.entries(C)];
    const now = para('', 'sf_party_now');
    const box = document.createElement('div'); box.className = 'sf_party_choices';
    let changing = false;
    const draw = () => {
        now.textContent = `현재 동행: ${options.find(([id]) => id === s.party.with)?.[1].ko || '혼자'}`;
        box.replaceChildren(...options.map(([id, c]) => {
            const on = s.party.with === id;
            const row = document.createElement('div');
            row.className = `sf_list_row sf_party_choice${on ? ' sf_on' : ''}`;
            row.dataset.companion = id || 'alone';
            row.innerHTML = `<span class="sf_list_icon sf_party_sigil">${SIGIL[id] || ''}</span><span class="sf_list_main"><span class="sf_party_name"><b></b></span><small></small></span><span class="sf_list_btns"></span>`;
            row.querySelector('b').textContent = c.ko;
            row.querySelector('small').textContent = c.about;
            if (id) {
                const look = document.createElement('button');
                look.type = 'button'; look.className = 'sf_btn sf_small sf_party_look'; look.textContent = '인물 보기';
                look.dataset.character = id; look.setAttribute('aria-label', `${c.ko} 인물 보기`);
                look.addEventListener('click', () => characterDetail(ui, id));
                row.querySelector('.sf_party_name').append(look);
            }
            const pick = document.createElement('button');
            pick.type = 'button'; pick.className = `sf_btn sf_small${on ? ' sf_primary' : ''}`;
            pick.textContent = on ? '함께하는 중' : '고르기'; pick.disabled = changing || on;
            pick.addEventListener('click', () => choose(id));
            row.querySelector('.sf_list_btns').append(pick);
            return row;
        }));
    };
    const choose = async id => {
        if (changing) return; changing = true; s.party.with = id; draw();
        try { await saveState(); emit('world:changed', { map: s.pos.map }); }
        finally { changing = false; draw(); }
    };
    draw();
    ui.showCard({ title: '파티', onClose, kind: 'party', wide: true,
        body: stack(now, para('함께 걸으면 혼자는 못 보는 것이 보여. 두아트에도 기본으로 같이 가.'), box) });
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
            (f => f ? para(`축제: ${f}`) : null)(festivalLine(s)),
            picks.length ? para('챗에서 받은 것', 'sf_sub_head') : null,
            picks.length ? list(picks.map(p => ({ icon: p.kind === 'idea' ? '🧭' : '📌', name: p.text,
                sub: p.kind === 'idea' ? '모험 소재 · 다음 AI 모험에 써' : '메모',
                buttons: [{ label: '지우기', onClick: async () => { await dropPick(p.id); close(); questsCard(ui, onClose); } }] }))) : null,
            para('일지 · 원할 때 지금 장면에 꺼내', 'sf_sub_head'),
            list(told.map(e => ({ icon: e.told ? '💬' : '📝', name: e.ko, sub: e.told ? '챗에 꺼냄' : '',
                buttons: e.en ? [{ label: '꺼내기', primary: !e.told, onClick: () => { showEvent(ui, e); } }] : [] })), '아직 적힌 일이 없어.')) });
}
