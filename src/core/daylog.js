// 하루 결산: what each game day held. While a day goes on, what she did, got and lived through is gathered in
// s.daylog; when the ledger starts a new day (never twice, a regenerate cannot replay it) that day is closed
// into s.days with its stamp, and its summary waits to be shown (s.summary).
// Stamps: ☥ 무사 · ✨ 특별한 날 (something worth telling, a new rank) · 🩹 죽을 뻔 (carried back from the Duat)
// Nothing here goes to the prompt.

import { emit, on } from './bus.js';
import { today } from './ledger.js';
import { getState, saveState } from './state.js';

const KEEP = 90;
export const STAMPS = { safe: { icon: '☥', ko: '무사' }, special: { icon: '✨', ko: '특별한 날' }, close: { icon: '🩹', ko: '죽을 뻔' } };
// activity names as the summary says them
export const ACT_KO = { fish: '낚시', cook: '요리', study: '공부', train: '훈련', pray: '신전 일', sell: '팔기', pull: '건지기',
    plant: '심기', read: '기록 해독', seal: '봉인 다루기', clear: '통로 치우기', adventure: '작은 모험', duat: '두아트', festival: '축제' };

const seqOf = uid => Number(String(uid).slice(1)) || 0;

function fresh(s, day = today(s)) {
    return { day, xp0: s.stats.xp, deben0: s.bag.deben, seq0: s.bag.seq, acts: {}, got: [], lines: [], rankUp: 0, close: false };
}
// the open day's record, started when first needed
export function dayLog(s = getState()) {
    if (!s) return null;
    if (!s.daylog || s.daylog.day < 0) { s.daylog = fresh(s); if (s.dayFirst < 0) s.dayFirst = s.daylog.day; }
    return s.daylog;
}
// 생존 D+N: game days since the game first counted one
export const survival = (s = getState()) => Math.max(1, today(s) - (s.dayFirst >= 0 ? s.dayFirst : today(s)) + 1);

// something the day will be remembered by; mutates only, the caller saves
export function noteDay(s, what) {
    const L = dayLog(s);
    if (what === 'close') L.close = true;
}

function stampOf(L) {
    if (L.close) return 'close';
    if (L.lines.length || L.rankUp) return 'special';
    return 'safe';
}
const empty = L => !Object.keys(L.acts).length && !L.got.length && !L.lines.length && !L.rankUp && !L.close;

// the day closes: kept in s.days; a day she did something in gets its summary shown
function close(s, skipped) {
    const L = dayLog(s);
    const rec = { day: L.day, stamp: stampOf(L), acts: L.acts, got: L.got.map(g => g.id), lines: L.lines,
        xp: s.stats.xp - L.xp0, deben: s.bag.deben - L.deben0, rankUp: L.rankUp };
    if (!s.days.some(d => d.day === rec.day)) s.days = [...s.days, rec].slice(-KEEP);
    s.summary = empty(L) ? (skipped ? { day: -1, skipped, at: today(s) } : null) : { day: rec.day, skipped, at: today(s) };
    s.daylog = fresh(s);
}

on('act:done', ({ kind } = {}) => { const s = getState(); if (!s || !kind) return; const L = dayLog(s); L.acts[kind] = (L.acts[kind] || 0) + 1; });
on('journal:added', ({ entry } = {}) => {
    const s = getState(); if (!s || !entry?.ko) return;
    const L = dayLog(s);
    L.lines = [...L.lines, entry.ko].slice(-8);
    if (entry.kind === 'duat') L.acts.duat = (L.acts.duat || 0) + 1;
});
on('stats:changed', d => { const s = getState(); if (s && d?.rankUp) dayLog(s).rankUp = d.rankUp; });
// what came into the bag today: every item newer than the day's first look at the bag
on('bag:changed', () => {
    const s = getState(); if (!s) return;
    const L = dayLog(s);
    for (const it of s.bag.items) if (seqOf(it.uid) > L.seq0 && !L.got.some(g => g.u === it.uid)) L.got.push({ u: it.uid, id: it.id });
    if (L.got.length > 40) L.got = L.got.slice(-40);
});
on('day:started', async ({ days = [] } = {}) => {
    const s = getState(); if (!s) return;
    close(s, Math.max(0, days.length - 1));
    await saveState();
    emit('daylog:closed', { summary: s.summary });
});
on('game:loaded', () => { const s = getState(); if (s?.linked) dayLog(s); });
// the first tracker read moves the date before anything happened: the open day moves with it
on('clock:synced', () => {
    const s = getState(); if (!s?.linked) return;
    if (s.daylog?.day >= 0 && s.daylog.day !== today(s) && empty(s.daylog) && !s.days.length) s.daylog = fresh(s);
    dayLog(s);
});
