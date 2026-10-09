// The chat is the clock. The bot writes a tracker line on its replies
//   <tracker> 🌇 05:48 오후 | 하티르 여드렛날, 2년 | 옴보스 → 서쪽 별채 | ☀️ 맑음 </tracker>
// and the game follows it: date, part of the day and place. No AI call — a regular expression (settings).

import { emit } from './bus.js';
import { EPAG, dayNumber, fromDayNumber, minutesOf, parseDate, partOfMinutes, partOfWords } from './clock.js';
import { DATA } from './data.js';
import { newDays } from './ledger.js';
import { trackerPattern } from './settings.js';
import { ctx } from './st.js';
import { getState, saveState } from './state.js';

export function trackerRegex() {
    try { return new RegExp(trackerPattern(), 's'); } catch { return null; }
}

// one message's tracker → { time, date, place } (strings, any may be ''), or null
export function readTracker(text, re = trackerRegex()) {
    if (!re) return null;
    const mt = String(text || '').match(re);
    if (!mt) return null;
    const g = mt.groups || {};
    return { raw: mt[0], time: (g.time || '').trim(), date: (g.date || '').trim(), place: (g.place || '').trim() };
}

// the newest message that carries a tracker: { i, tr }
export function lastTracker(chat = ctx().chat || []) {
    const re = trackerRegex();
    for (let i = chat.length - 1; i >= 0; i--) {
        const tr = readTracker(chat[i]?.mes, re);
        if (tr) return { i, tr };
    }
    return null;
}

const lc = s => String(s || '').toLowerCase();
// "옴보스 → 서쪽 별채 → 바깥 회랑 문간" → { place: 'ombos', room: '서쪽 별채', rest }
export function readPlace(text) {
    const parts = String(text || '').split(/\s*(?:→|->|>|\/|·|,)\s*/).map(s => s.trim()).filter(Boolean);
    const all = DATA.places.places;
    const hit = s => all.find(p => [p.en, p.ko, p.id, ...(p.aliases || [])].some(n => lc(s).includes(lc(n))));
    let place = null, k = -1;
    for (let j = 0; j < parts.length && !place; j++) { const p = hit(parts[j]); if (p) { place = p.id; k = j; } }
    const room = parts.length > k + 1 ? parts[k + 1] : (k < 0 && parts.length ? parts[0] : '');
    return { place, room };
}
// the room words → English for the prompt, when the table knows them
export function roomEn(room) {
    const r = DATA.places.rooms.find(x => [x.ko, x.en, ...(x.aliases || [])].some(n => lc(room).includes(lc(n))));
    return r ? r.en : '';
}
export const placeInfo = id => DATA.places.places.find(p => p.id === id) || null;

// reads the newest tracker into the chat's game. Returns what changed: { ok, days, placeChanged }
export async function syncFromChat({ force = false } = {}) {
    const s = getState();
    if (!s) return { ok: false };
    const found = lastTracker();
    if (!found) {
        if (s.sync.ok) { s.sync.ok = false; await saveState(); }
        emit('sync', { ok: false });
        return { ok: false };
    }
    const { i, tr } = found;
    if (!force && s.sync.at === i && s.sync.raw === tr.raw) return { ok: true, same: true };
    const before = { ...s.date }, placeBefore = s.place;
    const d = parseDate(tr.date);
    if (d) {
        const next = { year: d.year ?? s.date.year, month: d.month ?? s.date.month, day: d.day ?? s.date.day };
        // a new year the tracker does not spell out: the month went back past Thoth
        if (d.year === undefined && d.month !== undefined && dayNumber({ ...next, year: s.date.year }) < dayNumber(s.date) - 200) next.year = s.date.year + 1;
        s.date = next;
    }
    const min = minutesOf(tr.time);
    s.part = min !== null ? partOfMinutes(min) : (partOfWords(`${tr.time} ${tr.raw}`) || s.part);
    const pl = readPlace(tr.place);
    if (pl.place) s.place = pl.place;
    s.room = pl.room || '';
    s.sync = { at: i, raw: tr.raw, ok: true, when: Date.now() };
    s.linked = true;
    const fresh = newDays(s);
    await saveState();
    const days = dayNumber(s.date) - dayNumber(before);
    dayStart(fresh, before, s);
    if (s.place !== placeBefore) emit('place', { from: placeBefore, to: s.place });
    emit('sync', { ok: true, days, tr });
    return { ok: true, days, placeChanged: s.place !== placeBefore };
}

// 'day:start' only for days the ledger had never handled: { days: [dates], from, to }
function dayStart(fresh, before, s) {
    if (fresh.length) emit('day:start', { days: fresh.map(fromDayNumber), from: before, to: s.date });
}

// by hand, when the chat has no tracker or it read wrong
export async function setByHand({ year, month, day, part, place }) {
    const s = getState();
    if (!s) return;
    const before = { ...s.date };
    if (year) s.date.year = Math.max(1, Number(year));
    if (month !== undefined && month !== null) s.date.month = Math.min(EPAG, Math.max(0, Number(month)));
    if (day) s.date.day = Math.min(s.date.month === EPAG ? 5 : 30, Math.max(1, Number(day)));
    if (part) s.part = part;
    if (place) s.place = place;
    s.linked = true;
    const fresh = newDays(s);
    await saveState();
    dayStart(fresh, before, s);
    emit('sync', { ok: s.sync.ok, byHand: true });
}
