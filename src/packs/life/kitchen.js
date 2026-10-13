// 부엌: two things into a dish (data/recipes.json). Dishes heal and calm on a Duat run, or go as gifts.
// A need is one thing ({ id }), any of a kind ({ kind }), or one of several ({ any: [...] }, the first one she has, in
// that order: salt before cumin). Each need takes its own bag item, so nothing is used twice.

import { give, itemInfo } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { record } from '../../core/facts.js';
import { addXP, didAct } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';

// which bag items a recipe would use, or null
export function pickFor(s, r) {
    const used = [];
    const free = test => s.bag.items.find(x => !used.includes(x) && test(x));
    for (const n of r.needs) {
        const it = n.any ? n.any.map(id => free(x => x.id === id)).find(Boolean)
            : free(x => (n.id ? x.id === n.id : itemInfo(x.id)?.kind === n.kind));
        if (!it) return null;
        used.push(it);
    }
    return used;
}
const needText = n => (n.any ? n.any.map(id => itemInfo(id)?.ko).join('/') : n.id ? itemInfo(n.id)?.ko : { fish: '물고기 아무거나', crop: '작물 아무거나' }[n.kind] || n.kind);

function card(ui) {
    const s = getState();
    const rows = (DATA.recipes?.recipes || []).map(r => {
        const out = itemInfo(r.id) || {}, use = pickFor(s, r);
        const f = out.food || {};
        return { icon: out.icon, item: r.id, name: out.ko, dim: !use,
            sub: `${r.needs.map(needText).join(' + ')} · ${[f.heal ? `회복 ${f.heal}` : '', f.fear ? `공포 −${f.fear}` : ''].filter(Boolean).join(' ')}${use && r.needs.some(n => n.any) ? ` · 쓸 것: ${use.map(x => itemInfo(x.id)?.ko).join(', ')}` : ''}`,
            buttons: [{ label: '만들기', primary: !!use, disabled: !use || sunLeft(s) < 1, onClick: async () => {
                const st = getState(), u = pickFor(st, r); if (!u || !spend(st, 1)) return;
                st.bag.items = st.bag.items.filter(x => !u.includes(x)); const [uid] = give(st, r.id, 1, 'kitchen'); addXP(st, 1);
                record(st, 'cook', { itemId: r.id, itemUid: uid, source: 'kitchen' });
                const d = didAct(st, 'cook'); await saveState(); ui.toast(d || `${out.ko} 완성 · ${u.map(x => itemInfo(x.id)?.ko).join(', ')} 씀`); close(); card(ui);
            } }] };
    });
    const close = ui.showCard({ tag: '생활', title: '부엌', wide: true, body: stack(para('요리는 태양 기운 1. 음식은 두아트 원정에 챙겨 가거나 꺼내서 선물할 수 있어.'), list(rows)) });
}
onSpot('kitchen', (spot, ui) => card(ui));
