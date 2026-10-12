// The chat is the clock. The bot writes a tracker line on its replies
//   <tracker> 🌇 05:48 오후 | 하티르 여드렛날, 2년 | 옴보스 → 서쪽 별채 | ☀️ 맑음 </tracker>
// and the game follows it: date, part of the day and place. No AI call — a regular expression (settings).

import { emit } from './bus.js';
import { EPAG, TIME_RE, dayNumber, fromDayNumber, minutesOf, parseDate, partOfMinutes, partOfWords } from './clock.js';
import { DATA } from './data.js';
import { newDays } from './ledger.js';
import { trackerPattern } from './settings.js';
import { ctx } from './st.js';
import { getState, saveState } from './state.js';

export function trackerRegex() {
    try { return new RegExp(trackerPattern(), 's'); } catch { return null; }
}

// one message's tracker → { raw, time, date, place, weather } (strings, any may be ''), or null.
// The pattern only finds the tracker. Inside it every field is looked for on its own, in any order and with or
// without "|" between them, so a missing or moved field loses only itself. What is not found stays as it was.
// A pattern with named groups time / date / place (older settings) is used as it is.
export function readTracker(text, re = trackerRegex()) {
    if (!re) return null;
    const mt = String(text || '').match(re);
    if (!mt) return null;
    const g = mt.groups || {};
    if ('time' in g || 'date' in g || 'place' in g) {
        return { raw: mt[0], time: (g.time || '').trim(), date: (g.date || '').trim(), place: (g.place || '').trim(), weather: (g.weather || '').trim() };
    }
    const inner = mt.slice(1).find(x => x !== undefined) ?? mt[0];
    return { raw: mt[0].trim(), ...readFields(inner) };
}

const hasPlace = t => !!readPlace(t).place;
const looksDate = t => { const d = parseDate(t); return !!d && (d.month !== undefined || d.day !== undefined); };
export function weatherOf(t) {
    const low = String(t || '').toLowerCase();
    return (DATA.calendar.weather || []).find(w => w.signs.some(sg => low.includes(sg.toLowerCase()))) || null;
}

// the fields of one tracker's inside. A part can hold two fields ("05:48 오후, 하티르 8일").
export function readFields(inner) {
    const parts = String(inner || '').split(/\s*[|｜\n]\s*/).map(x => x.trim()).filter(Boolean);
    const at = (test, skip = []) => parts.findIndex((x, k) => !skip.includes(k) && test(x, k));
    const timeAt = at(x => TIME_RE.test(x));
    const time = timeAt >= 0 ? parts[timeAt].match(TIME_RE)[0].trim() : '';
    const clean = k => (k === timeAt ? parts[k].replace(time, ' ') : parts[k]).replace(/[^\p{L}\p{N}\s,]/gu, ' ').replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '');
    // the date: a part of its own first, else one shared with the place
    let dateAt = at((x, k) => looksDate(clean(k)) && !hasPlace(x));
    if (dateAt < 0) dateAt = at((x, k) => looksDate(clean(k)));
    const date = dateAt >= 0 ? clean(dateAt) : '';
    // the place: a part that names a known place; else a part with an arrow, whose room words still count
    let placeAt = at(x => hasPlace(x), [timeAt]);
    if (placeAt < 0) placeAt = at(x => /→|->/.test(x), [timeAt, dateAt]);
    const place = placeAt >= 0 ? parts[placeAt] : '';
    const weatherAt = at(x => !!weatherOf(x), [timeAt, dateAt, placeAt]);
    return { time, date, place, weather: weatherAt >= 0 ? parts[weatherAt] : '' };
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
        emit('clock:synced', { ok: false });
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
    if (tr.place) {
        const pl = readPlace(tr.place);
        if (pl.place) s.place = pl.place;
        s.room = pl.room || '';
    }
    const w = weatherOf(tr.weather);
    s.weather = w ? w.id : '';
    s.sync = { at: i, raw: tr.raw, ok: true, when: Date.now() };
    s.linked = true;
    const fresh = newDays(s);
    await saveState();
    const days = dayNumber(s.date) - dayNumber(before);
    dayStart(fresh, before, s);
    if (s.place !== placeBefore) emit('place:changed', { from: placeBefore, to: s.place });
    emit('clock:synced', { ok: true, days, tr });
    return { ok: true, days, placeChanged: s.place !== placeBefore };
}

// 'day:started' only for days the ledger had never handled: { days: [dates], from, to }
function dayStart(fresh, before, s) {
    if (fresh.length) emit('day:started', { days: fresh.map(fromDayNumber), from: before, to: s.date });
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
    emit('clock:synced', { ok: s.sync.ok, byHand: true });
}
