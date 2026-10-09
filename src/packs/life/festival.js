// 축제의 밤: a few days before a festival (data/festivals.json) a pole goes up in the square before the temple.
// Somang can put three things toward it: food, decorations, an offering. On the festival's evening or night the
// square fills, and the night is as big as what she prepared. Missing it is no failure; it comes again next year.
// Each festival counts once a year (s.fest[`${id}:${year}`]); a regenerate that moves the date cannot replay it.

import { canPay, give, itemInfo, needsText, ofKind, pay } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { dayNumber, monthName } from '../../core/clock.js';
import { josa } from '../../core/ko.js';
import { today } from '../../core/ledger.js';
import { addXP, didAct, journal } from '../../core/progress.js';
import { getState, saveState } from '../../core/state.js';
import { spend, sunLeft } from '../../core/sun.js';
import { list, para, stack } from '../../ui/kit.js';
import { addThings } from '../../world/things.js';

const F = () => DATA.festivals || {};
const NIGHT = ['evening', 'night'];

// the festival whose preparing days or day it is now (this year's, or next year's new year from the last days)
export function festivalNow(s = getState(), ahead = F().prepDays ?? 7) {
    if (!s) return null;
    const t = today(s);
    let best = null;
    for (const f of F().festivals || []) {
        for (const year of [s.date.year, s.date.year + 1]) {
            const at = dayNumber({ year, month: f.month, day: f.day });
            if (at < t || at - t > ahead) continue;
            if (!best || at < best.at) best = { f, at, year, key: `${f.id}:${year}`, left: at - t };
        }
    }
    if (best) best.entry = s.fest[best.key] || { preps: [], done: false };
    return best;
}

// what a prep asks for: { items: { id: n }, kind: { kind: n }, deben }
const needKo = need => [needsText(need.items || {}), ...Object.entries(need.kind || {}).map(([k, n]) => `${{ food: '음식', fish: '물고기', crop: '작물', material: '자재' }[k] || k} ${n}`), need.deben ? `데벤 ${need.deben}` : ''].filter(Boolean).join(', ');
const hasKind = (s, kind = {}) => Object.entries(kind).every(([k, n]) => ofKind(s, k).length >= n);
const canGive = (s, need) => canPay(s, need.items || {}, need.deben || 0) && hasKind(s, need.kind);
function giveUp(s, need) {
    if (!canGive(s, need)) return false;
    for (const [k, n] of Object.entries(need.kind || {})) for (const it of ofKind(s, k).slice(0, n)) s.bag.items = s.bag.items.filter(x => x !== it);
    return pay(s, need.items || {}, need.deben || 0);
}

addThings((mapId, s) => {
    const x = mapId === 'ombos' ? festivalNow(s) : null;
    if (!x || x.entry.done) return [];
    const p = F().at || { x: 24, y: 16 };
    const tonight = x.left === 0 && NIGHT.includes(s.part);
    return [{ id: 'festival', x: p.x, y: p.y, label: tonight ? '축제의 밤' : '축제 준비', sprite: 'banner', act: ui => card(ui) }];
});

function card(ui) {
    const s = getState(), x = festivalNow(s);
    if (!x) return;
    const { f, entry } = x;
    const tonight = x.left === 0 && NIGHT.includes(s.part);
    const when = x.left === 0 ? (tonight ? '오늘 밤이야. 광장에 불이 켜졌어.' : '오늘이야. 저녁이 되면 시작돼.') : `${x.left}일 뒤 · ${monthName(f.month)} ${f.day}일 무렵`;
    const rows = (f.preps || []).map(pr => {
        const done = entry.preps.includes(pr.id);
        return { icon: done ? '✅' : '◻️', name: pr.ko, sub: done ? '준비했어' : `${pr.about} · ${needKo(pr.need || {})}`,
            buttons: done ? [] : [{ label: '내놓기', primary: canGive(s, pr.need || {}), disabled: !canGive(s, pr.need || {}) || sunLeft(s) < 1, onClick: async () => {
                const st = getState(), y = festivalNow(st);
                if (!y || y.key !== x.key || !canGive(st, pr.need || {}) || !spend(st, 1)) return;
                giveUp(st, pr.need || {});
                st.fest[x.key] = { ...y.entry, preps: [...y.entry.preps, pr.id] };
                addXP(st, 1);
                await saveState();
                ui.toast(`${josa(pr.ko, '을')} 준비했어`);
                close(); card(ui);
            } }] };
    });
    const close = ui.showCard({ tag: '축제', title: f.ko, wide: true,
        body: stack(para(f.about, 'sf_pop_text'), para(when, 'sf_sub_head'),
            para(`준비 ${entry.preps.length}/${(f.preps || []).length} · 하나에 태양 기운 1. 준비한 만큼 축제의 밤이 달라져.`), list(rows)),
        buttons: tonight ? [{ label: '닫기' }, { label: '축제에 가기', primary: true, onClick: () => { night(ui); } }] : null });
}

async function night(ui) {
    const s = getState(), x = festivalNow(s);
    if (!x || x.entry.done || x.left !== 0) return;
    const tiers = F().nights || [];
    const n = tiers[Math.min(x.entry.preps.length, tiers.length - 1)] || {};
    s.fest[x.key] = { ...x.entry, done: true };
    // older years are forgotten
    const keys = Object.keys(s.fest);
    if (keys.length > 8) for (const k of keys.slice(0, keys.length - 8)) delete s.fest[k];
    addXP(s, n.xp || 2);
    if (n.deben) s.bag.deben += n.deben;
    if (n.give && itemInfo(n.give)) give(s, n.give, 1, 'festival');
    const d = didAct(s, 'festival');
    journal(s, { ko: `${x.f.ko}: ${n.ko}`, say: `${x.f.ko} 밤 이야기를 꺼낸다.`, en: String(n.en || '').replace('{fest}', x.f.en), marks: [x.f.ko.split(' ')[0]], kind: 'festival' });
    await saveState();
    ui.showCard({ tag: '축제의 밤', title: x.f.ko, text: `${n.ko}${n.give && itemInfo(n.give) ? `\n${josa(itemInfo(n.give).ko, '을')} 받았어.` : ''}${n.deben ? `\n데벤 ${n.deben}` : ''}${d ? `\n${d}` : ''}\n임무 탭 일지에서 이 밤을 챗에 꺼낼 수 있어.` });
}

// one line for the 임무 tab while a festival is near
export function festivalLine(s = getState()) {
    const x = festivalNow(s, (F().prepDays ?? 7) * 2);
    if (!x || x.entry.done) return '';
    const open = x.left <= (F().prepDays ?? 7);
    return `${x.f.ko} · ${x.left ? `${x.left}일 뒤` : '오늘'}${open ? ` · 준비 ${x.entry.preps.length}/${(x.f.preps || []).length} · 신전 앞 광장` : ' · 며칠 전부터 준비할 수 있어'}`;
}
