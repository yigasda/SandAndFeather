// 시장: buy from data/market.json at the item's price, sell anything but records at half.

import { give, itemInfo, nameOf, takeUid } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { didAct } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';

const sellPrice = id => Math.floor((itemInfo(id)?.price || 0) / 2);

function card(ui, tab = 'buy') {
    const s = getState();
    const reopen = t => () => { close(); card(ui, t); };
    const rows = tab === 'buy'
        ? (DATA.market?.sells || []).map(id => { const i = itemInfo(id) || {}; return {
            icon: i.icon, name: i.ko, sub: `${i.price} 데벤 · ${i.about || ''}`,
            buttons: [{ label: '사기', primary: true, disabled: s.bag.deben < i.price, onClick: async () => {
                if (s.bag.deben < i.price) return;
                s.bag.deben -= i.price; give(s, id, 1, 'market'); await saveState();
                ui.toast(`${i.ko} 샀어 · 남은 데벤 ${s.bag.deben}`); reopen('buy')();
            } }] }; })
        : s.bag.items.filter(it => itemInfo(it.id)?.kind !== 'record' && sellPrice(it.id) > 0).slice().reverse().map(it => ({
            icon: itemInfo(it.id)?.icon, name: nameOf(it), sub: `${sellPrice(it.id)} 데벤에 팔 수 있어`,
            buttons: [{ label: '팔기', onClick: async () => {
                const got = sellPrice(it.id);
                takeUid(s, it.uid); s.bag.deben += got; const d = didAct(s, 'sell'); await saveState();
                ui.toast(d || `${got} 데벤 받았어`); reopen('sell')();
            } }] }));
    const close = ui.showCard({
        tag: '생활', title: '시장', wide: true,
        body: stack(para(`가진 데벤 ${s.bag.deben}`, 'sf_money'), list(rows, tab === 'buy' ? '파는 게 없어' : '팔 물건이 없어')),
        buttons: [{ label: tab === 'buy' ? '팔기로' : '사기로', onClick: () => { card(ui, tab === 'buy' ? 'sell' : 'buy'); } }, { label: '닫기', primary: true }],
    });
}
onSpot('market', (spot, ui) => card(ui));
