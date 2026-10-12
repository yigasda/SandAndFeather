// 부엌: two things into a dish (data/recipes.json). Dishes heal and calm on a Duat run, or go as gifts.

import { give, itemInfo } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { addXP, didAct } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';

// which bag items a recipe would use, or null
function pickFor(s, r) {
    const used = [];
    for (const n of r.needs) {
        const it = s.bag.items.find(x => !used.includes(x) && (n.id ? x.id === n.id : itemInfo(x.id)?.kind === n.kind));
        if (!it) return null;
        used.push(it);
    }
    return used;
}
const needText = n => (n.id ? itemInfo(n.id)?.ko : { fish: '물고기 아무거나', crop: '작물 아무거나' }[n.kind] || n.kind);

function card(ui) {
    const s = getState();
    const rows = (DATA.recipes?.recipes || []).map(r => {
        const out = itemInfo(r.id) || {}, use = pickFor(s, r);
        const f = out.food || {};
        return { icon: out.icon, name: out.ko, dim: !use,
            sub: `${r.needs.map(needText).join(' + ')} · ${[f.heal ? `회복 ${f.heal}` : '', f.fear ? `공포 −${f.fear}` : ''].filter(Boolean).join(' ')}`,
            buttons: [{ label: '만들기', primary: !!use, disabled: !use || sunLeft(s) < 1, onClick: async () => {
                const u = pickFor(s, r); if (!u || !spend(s, 1)) return;
                s.bag.items = s.bag.items.filter(x => !u.includes(x)); give(s, r.id, 1, 'kitchen'); addXP(s, 1);
                const d = didAct(s, 'cook'); await saveState(); ui.toast(d || `${out.ko} 완성`); close(); card(ui);
            } }] };
    });
    const close = ui.showCard({ tag: '생활', title: '부엌', wide: true, body: stack(para('요리는 태양 기운 1. 음식은 두아트 원정에 챙겨 가거나 꺼내서 선물할 수 있어.'), list(rows)) });
}
onSpot('kitchen', (spot, ui) => card(ui));
