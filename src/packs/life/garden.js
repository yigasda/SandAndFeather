// 텃밭: plots that take a seed and give a crop some game days later. Four plots, two more with each work
// that adds them (data/works.json plots).

import { give, itemInfo, ofKind, takeUid } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { today } from '../../core/ledger.js';
import { addXP, didAct } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';

export function plotCount(s) {
    let n = 4;
    for (const w of DATA.works?.works || []) if (s.works[w.id]?.done && w.plots) n += w.plots;
    return n;
}

function card(ui) {
    const s = getState();
    const n = plotCount(s);
    while (s.garden.plots.length < n) s.garden.plots.push(null);
    const t = today(s);
    const seeds = ofKind(s, 'seed');
    const rows = s.garden.plots.slice(0, n).map((p, k) => {
        if (!p) return {
            icon: '🟫', name: `${k + 1}번 칸 · 비어 있음`, sub: seeds.length ? '태양 기운 1로 심어' : '시장에서 씨앗을 사 와',
            buttons: seeds.length ? [...new Map(seeds.map(x => [x.id, x])).values()].slice(0, 3).map(sd => ({
                label: `${itemInfo(sd.id).ko} 심기`, disabled: sunLeft(s) < 1, onClick: async () => {
                    if (!spend(s, 1)) return;
                    takeUid(s, sd.uid); s.garden.plots[k] = { seed: sd.id, day: t };
                    const d = didAct(s, 'plant'); await saveState(); if (d) ui.toast(d); close(); card(ui);
                } })) : [] };
        const g = itemInfo(p.seed)?.grow || { days: 2 };
        const left = p.day + g.days - t;
        const out = itemInfo(g.gives);
        return left > 0
            ? { icon: '🌱', name: `${k + 1}번 칸 · ${itemInfo(p.seed)?.ko}`, sub: `${left}일 뒤에 ${out?.ko || ''} 수확` }
            : { icon: out?.icon || '🌾', name: `${k + 1}번 칸 · ${out?.ko} 다 자랐어`, sub: `${out?.ko} ${g.count || 1}개`, buttons: [{ label: '수확', primary: true, onClick: async () => {
                give(s, g.gives, g.count || 1, 'garden'); s.garden.plots[k] = null; addXP(s, 1); await saveState();
                ui.toast(`${out?.ko} ${g.count || 1}개 수확했어`); close(); card(ui);
            } }] };
    });
    const close = ui.showCard({ tag: '생활', title: '텃밭', wide: true, body: stack(para('씨앗은 날이 지나야 자라. 챗에서 하루가 넘어가면 하루가 지나.'), list(rows)) });
}
onSpot('garden', (spot, ui) => card(ui));
