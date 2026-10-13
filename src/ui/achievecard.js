// 업적 card (임무 탭 → 업적): each achievement locked / reached / reward taken, 받기 once, and its title worn by one of
// the three (one title each, shown under the name in 일행). Counts of actions start from 0.9.60 (the 도감 and secrets
// found before count as they are).

import { ACHIEVEMENTS, claim, claimable, hasReward, progressOf, reached, wear } from '../core/achieve.js';
import { HEROES, HERO_NAME } from '../core/heroes.js';
import { getState, saveState } from '../core/state.js';
import { list, para, stack } from './kit.js';

export function achieveCard(ui, onClose = null) {
    const s = getState();
    let close = () => {}, busy = false;
    const again = () => { close(); achieveCard(ui, onClose); };
    const act = fn => async () => { if (busy) return; busy = true; try { if (fn(getState())) { await saveState(); again(); } } finally { busy = false; } };
    const all = ACHIEVEMENTS(), done = all.filter(a => reached(s, a));
    const rows = all.map(a => {
        const p = progressOf(s, a), ok = p.n >= p.goal, got = Object.hasOwn(s.achieve.claimed, a.id);
        const rw = a.reward ? [a.reward.deben ? `데벤 ${a.reward.deben}` : '', a.reward.xp ? `경험치 ${a.reward.xp}` : ''].filter(Boolean).join(' · ') : '';
        const worn = HEROES.filter(id => s.achieve.worn[id] === a.id);
        const sub = [a.about, ok ? '' : p.goal > 1 ? `${Math.min(p.n, p.goal)}/${p.goal}${a.need?.bestCm || a.need?.explore ? (a.need.bestCm ? 'cm' : '%') : ''}` : '',
            rw ? `보상 ${rw}${got ? ' · 받음' : ''}` : '', a.title ? `칭호 「${a.title}」${worn.length ? ` · ${worn.map(id => HERO_NAME[id]).join('·')} 착용 중` : ''}` : ''].filter(Boolean).join('\n');
        const buttons = [];
        if (claimable(s, a)) buttons.push({ label: '받기', primary: true, onClick: act(st => claim(st, a.id)) });
        return { icon: ok ? (hasReward(a) && !got ? '🎁' : '🏅') : '🔒', name: a.ko, sub, dim: !ok, buttons };
    });
    // titles: one per person, any reached one
    const titles = done.filter(a => a.title);
    const wearRows = HEROES.map(who => ({ icon: '🎖️', name: `${HERO_NAME[who]} · ${titles.find(a => a.id === s.achieve.worn[who])?.title || '칭호 없음'}`,
        sub: titles.length ? '' : '업적을 이루면 칭호가 생겨.',
        buttons: [...titles.filter(a => s.achieve.worn[who] !== a.id).map(a => ({ label: a.title, onClick: act(st => wear(st, who, a.id)) })),
            ...(s.achieve.worn[who] ? [{ label: '떼기', onClick: act(st => wear(st, who, '')) }] : [])] }));
    close = ui.showCard({ title: '업적', kind: 'achieve', wide: true, onClose,
        body: stack(
            para(`이룬 업적 ${done.length}/${all.length}`, 'sf_sub_head'),
            list(rows),
            para('칭호 · 한 사람에 하나씩, 일행 카드 이름 아래에 보여. 능력치나 챗 속 설정은 바뀌지 않아.', 'sf_sub_head'),
            list(wearRows),
            para('행동 횟수(요리·시장·텃밭 등)는 0.9.60부터, 축제의 밤과 두아트 귀환·낚시 기록은 0.9.68부터 센 거야. 도감과 찾은 비밀은 예전 것도 들어가.', 'sf_note')),
        buttons: [{ label: '닫기', primary: true }] });
}
