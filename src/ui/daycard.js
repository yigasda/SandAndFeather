// 하루 결산 and the calendar. A day closed by the ledger (daylog.js) shows its summary the next time the game
// is open: the stamp, what she did and got, and anything worth telling. The calendar shows each day's stamp;
// tapping a day shows its summary again.

import { itemInfo } from '../core/bag.js';
import { on } from '../core/bus.js';
import { EPAG, dateLabel, daysIn, dayNumber, fromDayNumber, monthName } from '../core/clock.js';
import { ACT_KO, STAMPS, survival } from '../core/daylog.js';
import { today } from '../core/ledger.js';
import { getState, saveState } from '../core/state.js';
import { list, para, stack } from './kit.js';
import { esc } from './popups.js';
import { addTodayButton, gameMode, gameUi, onOpen } from './window.js';

const dayText = n => dateLabel(fromDayNumber(n));

function summaryBody(rec, skipped = 0) {
    const st = STAMPS[rec.stamp] || STAMPS.safe;
    const acts = Object.entries(rec.acts || {}).map(([k, n]) => `${ACT_KO[k] || k}${n > 1 ? ` ${n}` : ''}`);
    const got = {};
    for (const id of rec.got || []) got[id] = (got[id] || 0) + 1;
    const head = document.createElement('div');
    head.className = 'sf_stamp_head';
    head.innerHTML = `<span class="sf_stamp sf_stamp_${esc(rec.stamp)}">${st.icon}</span><b>${esc(st.ko)}</b>`;
    const sums = [rec.deben ? `데벤 ${rec.deben > 0 ? '+' : ''}${rec.deben}` : '', rec.xp > 0 ? `모험 경험치 +${rec.xp}` : '', rec.rankUp ? `모험 등급 ${rec.rankUp}` : ''].filter(Boolean);
    return stack(head,
        acts.length ? para(`한 일 · ${acts.join(', ')}`, 'sf_pop_text') : para('한 일 없이 지나간 하루.', 'sf_pop_text'),
        Object.keys(got).length ? list(Object.entries(got).map(([id, n]) => ({ icon: itemInfo(id)?.icon || '', name: `${itemInfo(id)?.ko || id}${n > 1 ? ` ${n}` : ''}` }))) : null,
        sums.length ? para(sums.join(' · ')) : null,
        rec.lines?.length ? para(rec.lines.join('\n'), 'sf_pop_text') : null,
        skipped ? para(`그 뒤 ${skipped}일은 챗에서 지나갔어.`) : null);
}

export function summaryCard(ui, rec, skipped = 0, onClose = null) {
    const s = getState();
    ui.showCard({ tag: `생존 D+${survival(s)}`, title: `하루 결산 · ${dayText(rec.day)}`, body: summaryBody(rec, skipped), onClose,
        buttons: [{ label: '달력', onClick: () => { calendarCard(ui, fromDayNumber(rec.day)); } }, { label: '닫기', primary: true }] });
}

// the waiting summary, once
async function showWaiting(ui) {
    const s = getState();
    const w = s?.summary;
    if (!w) return;
    s.summary = null;
    await saveState();
    const rec = s.days.find(d => d.day === w.day);
    if (rec) summaryCard(ui, rec, w.skipped);
    else if (w.skipped) ui.showCard({ tag: `생존 D+${survival(s)}`, title: '며칠이 지나갔어', text: `챗에서 ${w.skipped + 1}일이 지나갔어. 오늘은 ${dayText(w.at)}.` });
}
onOpen(ui => showWaiting(ui));
addTodayButton({ label: '달력', onClick: ui => { calendarCard(ui); } });
// the day turned while the game is open: show it now
on('daylog:closed', () => { if (gameMode() === 'open') setTimeout(() => showWaiting(gameUi()), 300); });

// a month of stamps; month and year as the game's calendar has them
export function calendarCard(ui, at = getState()?.date) {
    const s = getState();
    if (!s || !at) return;
    const year = at.year, month = at.month, n = daysIn(month);
    const recs = new Map(s.days.map(d => [d.day, d]));
    const t = today(s);
    const grid = document.createElement('div');
    grid.className = 'sf_cal';
    for (let d = 1; d <= n; d++) {
        const num = dayNumber({ year, month, day: d });
        const rec = recs.get(num);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `sf_cal_day${num === t ? ' sf_on' : ''}${rec ? '' : ' sf_dim'}`;
        b.innerHTML = `<small>${d}</small><span>${rec ? STAMPS[rec.stamp]?.icon || '' : num === t ? '·' : ''}</span>`;
        b.disabled = !rec;
        if (rec) b.addEventListener('click', () => { close(); summaryCard(ui, rec, 0, () => calendarCard(ui, at)); });
        grid.append(b);
    }
    const step = k => {
        let m = month + k, y = year;
        if (m < 0) { m = EPAG; y--; } else if (m > EPAG) { m = 0; y++; }
        if (y < 1) return;
        close(); calendarCard(ui, { year: y, month: m, day: 1 });
    };
    const kept = s.days.filter(d => d.stamp === 'special').length;
    const close = ui.showCard({ tag: `생존 D+${survival(s)}`, title: `${month === EPAG ? '덧붙은 닷새' : monthName(month)} · ${year}년`, wide: true,
        body: stack(grid, para(`☥ 무사 · ✨ 특별한 날 · 🩹 죽을 뻔 · 특별한 날 ${kept}일. 도장을 누르면 그날 결산을 다시 봐.`)),
        buttons: [{ label: '◀', onClick: () => { step(-1); return false; } }, { label: '▶', onClick: () => { step(1); return false; } }, { label: '닫기', primary: true }] });
}
