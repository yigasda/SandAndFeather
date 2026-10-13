// 시장: what is on sale comes from data/market.json goods, at the item's price × the good's mul. Each game day the
// stock is settled once, the first time the market is looked at that day (s.market): what came in today (a rare fish,
// the festival garlands, a few things on the 골동품 좌판), today's deals, at most one thing sold out, and how many
// are left of the goods sold by the piece. Opening the card again, reloading or regenerating the chat never draws
// it again. The hour only decides what shows (eels in the evening), never what was drawn.
// Selling: anything but records, at half the item's price (never the market's price, so a deal bought cannot be sold
// back at a profit).

import { give, itemInfo, nameOf, takeUid } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { record } from '../../core/facts.js';
import { today } from '../../core/ledger.js';
import { didAct, rank } from '../../core/progress.js';
import { partNow } from '../../core/rest.js';
import { getState, saveState } from '../../core/state.js';
import { list, para, stack } from '../../ui/kit.js';
import { onSpot } from '../../ui/window.js';
import { festivalNow } from './festival.js';

const M = () => DATA.market || {};
const sellPrice = id => Math.floor((itemInfo(id)?.price || 0) / 2);
export const basePrice = g => Math.max(1, Math.round((itemInfo(g.id)?.price || 0) * (g.mul || 1)));
const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

// the discounts in whole deben that keep the real rate inside the range (10–25 % by default): a 12 deben dish can be 2 or
// 3 off, a 3 deben onion none at all (1 deben would already be 33 %)
export function offRange(price, [p0, p1] = M().daily?.discount || [10, 25]) {
    const lo = Math.max(1, Math.ceil(price * p0 / 100 - 1e-9)), hi = Math.floor(price * p1 / 100 + 1e-9);
    return lo <= hi ? [lo, hi] : null;
}

// today's market, settled once per game day. Mutates s.market; the caller saves
export function marketToday(s) {
    const t = today(s);
    if (s.market?.day === t) return s.market;
    const prev = s.market || {};
    const d = M().daily || {}, goods = M().goods || [];
    const found = s.codex?.found || {};
    const fest = !!festivalNow(s);
    // what came in today (the hour is not looked at here)
    const stall = goods.filter(g => g.stall && found[g.id] !== undefined);
    const [lo, hi] = d.stallPerDay || [1, 2];
    const onStall = new Set(pick(stall, Math.min(stall.length, rint(lo, hi))).map(g => g.id));
    const stock = goods.filter(g => (!g.stall || onStall.has(g.id)) && (!g.found || g.stall || found[g.id] !== undefined)
        && (!g.rank || rank(s) >= g.rank) && (!g.festival || fest) && (g.chance === undefined || Math.random() < g.chance)).map(g => g.id);
    const left = {};
    for (const g of goods) if (g.stock && stock.includes(g.id)) left[g.id] = g.stock;
    // deals: about one in eight of what is in, 3 to 5, never yesterday's, only where a whole-deben discount fits the range
    const D = d.deals || { per: 8, min: 3, max: 5 };
    const priceOfId = id => basePrice(goods.find(g => g.id === id));
    const can = stock.filter(id => !(prev.deals && id in prev.deals) && offRange(priceOfId(id), d.discount));
    const deals = {};
    for (const id of pick(can, Math.max(D.min, Math.min(D.max, Math.round(stock.length / D.per))))) {
        const price = priceOfId(id), [lo, hi] = offRange(price, d.discount), off = rint(lo, hi);
        deals[id] = { pct: Math.round(off / price * 100), price: price - off };
    }
    // sold out: at most one, now and then, never what must always be there, never yesterday's
    const so = d.soldOut || {};
    const out = Math.random() < (so.chance ?? 0.3)
        ? pick(stock.filter(id => !(so.never || []).includes(id) && !(id in deals) && id !== prev.out), 1)[0] || '' : '';
    s.market = { day: t, stock, deals, out, left };
    return s.market;
}

// what shows now: today's stock, those for this hour
export function shown(s) {
    const m = marketToday(s), part = partNow(s);
    return (M().goods || []).filter(g => m.stock.includes(g.id) && (!g.parts || g.parts.includes(part)));
}
export const priceOf = (s, g) => s.market?.deals?.[g.id]?.price ?? basePrice(g);

// one purchase: everything is checked again on the state as it is now, then changed in one go (deben, what is left,
// the item), so quick taps never pay twice or give two
let busy = false;
export async function buy(s, id) {
    if (busy) return { ok: false, why: 'busy' };
    busy = true;
    try {
        const m = marketToday(s), g = (M().goods || []).find(x => x.id === id);
        if (!g || !shown(s).includes(g)) return { ok: false, why: 'gone' };
        if (m.out === id) return { ok: false, why: 'out' };
        if (id in m.left && m.left[id] <= 0) return { ok: false, why: 'out' };
        const price = priceOf(s, g);
        if (s.bag.deben < price) return { ok: false, why: 'deben' };
        s.bag.deben -= price;
        if (id in m.left) m.left[id]--;
        const [uid] = give(s, id, 1, 'market');
        record(s, 'buy', { itemId: id, itemUid: uid, source: 'market', spent: price });
        await saveState();
        return { ok: true, price };
    } finally { busy = false; }
}

let lastTab = 'all';
function card(ui, tab = 'buy') {
    const s = getState();
    const reopen = t => () => { close(); card(ui, t); };
    let body;
    if (tab === 'buy') {
        const m = marketToday(s), list0 = shown(s);
        const cats = (M().categories || []).filter(c => list0.some(g => g.cat === c.id));
        if (lastTab !== 'all' && !cats.some(c => c.id === lastTab)) lastTab = 'all';
        const row = g => {
            const i = itemInfo(g.id) || {}, deal = m.deals[g.id], out = m.out === g.id || (g.id in m.left && m.left[g.id] <= 0);
            const price = priceOf(s, g);
            const tags = [deal ? `특가 −${deal.pct}% (${basePrice(g)}→${price})` : `${price} 데벤`, g.id in m.left && !out ? `남은 ${m.left[g.id]}` : '', i.about || ''].filter(Boolean);
            return { icon: i.icon, item: g.id, name: i.ko, sub: tags.join(' · '), dim: out,
                buttons: [{ label: out ? '품절' : '사기', primary: !out, disabled: out || s.bag.deben < price, onClick: async () => {
                    const r = await buy(getState(), g.id);
                    if (r.ok) { ui.toast(`${i.ko} 샀어 · 남은 데벤 ${getState().bag.deben}`); reopen('buy')(); }
                    else if (r.why !== 'busy') { ui.toast({ out: '다 팔렸어', deben: '데벤이 모자라', gone: '지금은 없어' }[r.why]); reopen('buy')(); }
                } }] };
        };
        const tabs = document.createElement('div');
        tabs.className = 'sf_inventory_tabs sf_market_tabs'; tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', '시장 분류');
        for (const [id, ko] of [['all', '전체'], ...cats.map(c => [c.id, c.ko])]) {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'sf_btn sf_small'; b.textContent = ko;
            b.setAttribute('aria-pressed', String(id === lastTab));
            b.addEventListener('click', () => { lastTab = id; reopen('buy')(); });
            tabs.append(b);
        }
        const deals = list0.filter(g => m.deals[g.id]);
        const goods = lastTab === 'all' ? list0 : list0.filter(g => g.cat === lastTab);
        body = stack(para(`가진 데벤 ${s.bag.deben}`, 'sf_money'), tabs,
            lastTab === 'all' && deals.length ? para('오늘의 상품', 'sf_sub_head') : null,
            lastTab === 'all' && deals.length ? list(deals.map(row)) : null,
            lastTab === 'all' && deals.length ? para('전체 상품', 'sf_sub_head') : null,
            list(goods.map(row), '지금은 파는 게 없어'));
    } else {
        body = stack(para(`가진 데벤 ${s.bag.deben}`, 'sf_money'), list(s.bag.items.filter(it => itemInfo(it.id)?.kind !== 'record' && sellPrice(it.id) > 0).slice().reverse().map(it => ({
            icon: itemInfo(it.id)?.icon, item: it.id, name: nameOf(it), sub: `${sellPrice(it.id)} 데벤에 팔 수 있어`,
            buttons: [{ label: '팔기', onClick: async () => {
                const st = getState(), x = st.bag.items.find(y => y.uid === it.uid);
                if (!x) return;
                const got = sellPrice(x.id);
                takeUid(st, x.uid); st.bag.deben += got; record(st, 'sell', { itemId: x.id, itemUid: x.uid, source: 'market', earned: got });
                const d = didAct(st, 'sell'); await saveState();
                ui.toast(d || `${got} 데벤 받았어`); reopen('sell')();
            } }] })), '팔 물건이 없어'));
    }
    const close = ui.showCard({
        tag: '생활', title: tab === 'buy' ? '시장' : '시장 · 팔기', wide: true, body,
        buttons: [{ label: tab === 'buy' ? '팔기로' : '사기로', onClick: () => { card(ui, tab === 'buy' ? 'sell' : 'buy'); } }, { label: '닫기', primary: true }],
    });
    // the chosen tab in view (the row scrolls sideways on a narrow screen)
    const on = document.querySelector('#sf_game .sf_market_tabs [aria-pressed="true"]');
    if (on) on.parentElement.scrollLeft = on.offsetLeft - on.parentElement.offsetLeft - 8;
    if (tab === 'buy' && s.market) saveState();   // today's draw is kept even if nothing is bought
}
onSpot('market', (spot, ui) => card(ui));
