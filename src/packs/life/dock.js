// 선착장: once a day something can be pulled out of the reeds. What comes up depends on the hour and the season
// (data/finds.json) and is less likely to be what came up lately. The ledger keeps it to once a game day.

import { put, transact } from '../../core/bag.js';
import { seasonOf } from '../../core/clock.js';
import { DATA } from '../../core/data.js';
import { canDo, markDone } from '../../core/ledger.js';
import { getState } from '../../core/state.js';
import { itemCard } from '../../ui/items.js';
import { onSpot } from '../../ui/window.js';

const KEY = 'dock:pull';

function pick(s) {
    const season = seasonOf(s.date.month), recent = s.recent.finds || [];
    const pool = (DATA.finds?.dock || []).filter(f => (!f.parts?.length || f.parts.includes(s.part)) && (!f.seasons?.length || f.seasons.includes(season)));
    const w = pool.map(f => Number(f.weight) * (recent.includes(f.item) ? 0.25 : 1));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let k = 0; k < pool.length; k++) { r -= w[k]; if (r <= 0) return pool[k].item; }
    return pool[0]?.item || null;
}

onSpot('dock', (spot, ui, map) => {
    const s = getState();
    const free = canDo(s, KEY);
    ui.showCard({
        tag: '생활',
        title: spot.title,
        text: free ? spot.text : `${spot.text.split('.')[0]}.\n오늘은 더 걸린 게 없어. 다음 날 다시 와 봐.`,
        buttons: free ? [{ label: '닫기' }, { label: '물에서 건지기', primary: true, onClick: () => { pull(ui, map); } }] : null,
    });
});

async function pull(ui, map) {
    const s = getState();
    if (!canDo(s, KEY)) return;
    const id = pick(s);
    if (!id) { ui.toast('건질 게 없어. data/finds.json을 봐 줘'); return; }
    let uid = null;
    const ok = await transact((d, st) => {
        uid = put(d, st, id, 'dock');
        markDone(st, KEY);
        st.recent.finds = [...(st.recent.finds || []), id].slice(-4);
    });
    if (ok) itemCard(ui, map, uid, { fresh: true });
}
