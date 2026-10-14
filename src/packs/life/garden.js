// 텃밭: plots that take a seed and give a crop some game days later. Four plots, two more with each work
// that adds them (data/works.json plots).

import { give, itemInfo, ofKind, takeUid } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { today } from '../../core/ledger.js';
import { record } from '../../core/facts.js';
import { addXP, didAct } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';
import { feel } from './poses.js';
import { showFx } from '../../world/fx.js';

export function plotCount(s) {
    let n = 4;
    for (const w of DATA.works?.works || []) if (s.works[w.id]?.done && w.plots) n += w.plots;
    return n;
}

// a plot ready to pick: its seed's grow { days, gives, count } and how many days are left
const growOf = p => itemInfo(p.seed)?.grow || { days: 2 };
const daysLeft = (s, p) => p.day + growOf(p).days - today(s);

function card(ui) {
    const s = getState();
    const n = plotCount(s);
    while (s.garden.plots.length < n) s.garden.plots.push(null);
    const seeds = ofKind(s, 'seed');
    const rows = s.garden.plots.slice(0, n).map((p, k) => {
        if (!p) return {
            icon: '🟫', name: `${k + 1}번 칸 · 비어 있음`, sub: seeds.length ? '태양 기운 1로 심어' : '시장에서 씨앗을 사 와',
            buttons: seeds.length ? [{ label: '심기', disabled: sunLeft(s) < 1, onClick: () => { close(); pickSeed(ui, k); } }] : [] };
        const g = growOf(p), left = daysLeft(s, p);
        const out = itemInfo(g.gives);
        return left > 0
            ? { icon: '🌱', item: p.seed, name: `${k + 1}번 칸 · ${itemInfo(p.seed)?.ko}`, sub: `${left}일 뒤에 ${out?.ko || ''} ${g.count || 1}개 수확` }
            : { icon: out?.icon || '🌾', item: g.gives, name: `${k + 1}번 칸 · ${out?.ko} 다 자랐어`, sub: `${out?.ko} ${g.count || 1}개`, buttons: [{ label: '수확', primary: true, onClick: async () => {
                // again on the state as it is now: a second tap on the same card finds the plot empty
                const st = getState(), q = st.garden.plots[k];
                if (!q || q.seed !== p.seed || daysLeft(st, q) > 0) return;
                st.garden.plots[k] = null;
                const uids = give(st, g.gives, g.count || 1, 'garden'); addXP(st, 1);
                record(st, 'harvest', { itemId: g.gives, itemUid: uids[0], source: 'garden', n: uids.length });
                await saveState();
                ui.toast(`${out?.ko} ${g.count || 1}개 수확했어`); close(); card(ui);
                feel('happy'); // 0.9.70: a harvest is a happy moment
            } }] };
    });
    const close = ui.showCard({ tag: '생활', title: '텃밭', wide: true, body: stack(para('씨앗은 날이 지나야 자라. 챗에서 하루가 넘어가면 하루가 지나.'), list(rows)) });
}

// which seed goes into plot k: every kind in the bag, with how long it takes and what it gives
function pickSeed(ui, k) {
    const s = getState();
    const kinds = [...new Map(ofKind(s, 'seed').map(x => [x.id, x])).keys()];
    const rows = kinds.map(id => {
        const i = itemInfo(id), g = i.grow || { days: 2 }, out = itemInfo(g.gives);
        return { icon: i.icon, item: id, name: `${i.ko} · ${ofKind(s, 'seed').filter(x => x.id === id).length}개`, sub: `${g.days}일 뒤 ${out?.ko || ''} ${g.count || 1}개`,
            buttons: [{ label: '심기', primary: true, disabled: sunLeft(s) < 1, onClick: async () => {
                const st = getState(), sd = st.bag.items.find(x => x.id === id);
                if (!sd || st.garden.plots[k] || !spend(st, 1)) return;
                takeUid(st, sd.uid); st.garden.plots[k] = { seed: id, day: today(st) };
                record(st, 'plant', { itemId: id, itemUid: sd.uid, source: 'garden' });
                const d = didAct(st, 'plant'); await saveState(); if (d) ui.toast(d); close(); card(ui);
                showFx('seeds-0', { at: 'feet', dy: 0.05, size: 1.05, ms: 1300 }); // seeds scattered at her feet
            } }] };
    });
    const close = ui.showCard({ tag: '생활', title: `텃밭 · ${k + 1}번 칸`, wide: true, body: stack(para('무엇을 심을까? 태양 기운 1.'), list(rows, '씨앗이 없어')),
        buttons: [{ label: '돌아가기', onClick: () => { card(ui); } }] });
}
onSpot('garden', (spot, ui) => card(ui));
