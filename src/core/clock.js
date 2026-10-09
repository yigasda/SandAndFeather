// The Egyptian civil calendar: three seasons of four months of thirty days, then five epagomenal days = 365.
// A day has four parts: dawn (morning) · day (afternoon) · evening · night.
// Names come from data/calendar.json; this file only counts and reads.

import { DATA } from './data.js';
import { settings } from './settings.js';

const cal = () => DATA.calendar;
export const EPAG = 12; // the month index of the five epagomenal days
export const PARTS = ['dawn', 'day', 'evening', 'night'];

export const daysIn = month => (month === EPAG ? 5 : 30);
// day number from the start of year 1, so dates can be compared and counted
export const dayNumber = d => (Math.max(1, d.year) - 1) * 365 + (d.month === EPAG ? 360 : d.month * 30) + (d.day - 1);
export function fromDayNumber(n) {
    const year = Math.floor(n / 365) + 1, r = n - (year - 1) * 365;
    return r >= 360 ? { year, month: EPAG, day: r - 359 } : { year, month: Math.floor(r / 30), day: (r % 30) + 1 };
}
export const addDays = (d, k) => fromDayNumber(dayNumber(d) + k);

export const seasonOf = month => (month === EPAG ? 'epagomenal' : cal().months[month]?.season || 'akhet');
export function monthName(month, style = settings().monthStyle) {
    if (month === EPAG) return style === 'ko' ? cal().epagomenal.ko : cal().epagomenal.en;
    const mo = cal().months[month];
    return style === 'ko' ? mo.ko : mo.en;
}
export const seasonName = (month, lang = 'ko') => cal().seasons[seasonOf(month)][lang];
export const seasonAbout = month => cal().seasons[seasonOf(month)].about;
export const partInfo = part => cal().parts.find(p => p.id === part) || cal().parts[1];

// "Hathyr 9" (or "하티르 9일"), for the game's own screens
export function dateLabel(d, style = settings().monthStyle) {
    if (d.month === EPAG) return style === 'ko' ? `윤일 ${d.day}일` : `Epagomenal Day ${d.day}`;
    return style === 'ko' ? `${monthName(d.month, 'ko')} ${d.day}일` : `${monthName(d.month, 'en')} ${d.day}`;
}
// always English, for the prompt
export function dateLabelEn(d) {
    if (d.month === EPAG) return `Epagomenal Day ${d.day} (${cal().epagomenal.days[d.day - 1]?.en || ''})`;
    return `${monthName(d.month, 'en')} ${d.day}`;
}

// "05:48 오후" → 17:48 → minutes since midnight
export function minutesOf(text) {
    const mt = String(text || '').match(/(\d{1,2}):(\d{2})\s*(오전|오후|AM|PM|am|pm)?/);
    if (!mt) return null;
    let h = Number(mt[1]);
    const pm = /오후|PM|pm/.test(mt[3] || ''), am = /오전|AM|am/.test(mt[3] || '');
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    return (h % 24) * 60 + Number(mt[2]);
}
export function partOfMinutes(min) {
    const h = min / 60;
    for (const p of cal().parts) {
        const inside = p.from < p.to ? h >= p.from && h < p.to : h >= p.from || h < p.to;
        if (inside) return p.id;
    }
    return 'day';
}
// a part named in words ("해질녘", "night") when there is no clock time
export function partOfWords(text) {
    const t = String(text || '').toLowerCase();
    for (const p of cal().parts) if (p.aliases.some(a => t.includes(a.toLowerCase()))) return p.id;
    return null;
}

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// the month a piece of text names: the longest matching name wins ("Hathor" before "Hat…")
function findMonth(text) {
    const t = String(text || '');
    const names = [];
    cal().months.forEach((mo, i) => [mo.en, mo.ko, ...(mo.aliases || [])].forEach(n => names.push([n, i])));
    [cal().epagomenal.en, cal().epagomenal.ko, ...(cal().epagomenal.aliases || [])].forEach(n => names.push([n, EPAG]));
    names.sort((a, b) => b[0].length - a[0].length);
    for (const [n, i] of names) {
        const re = /[가-힣]/.test(n) ? new RegExp(esc(n)) : new RegExp(`\\b${esc(n)}\\b`, 'i');
        const mt = t.match(re);
        if (mt) return { month: i, at: mt.index, len: mt[0].length };
    }
    return null;
}

// "하티르 여드렛날, 2년" · "Hathyr 8, Year 2" · "8 Hathyr" · "Mekhir 18" → { year?, month?, day? }; null when nothing is there
export function parseDate(text) {
    const t = String(text || '');
    const out = {};
    const mo = findMonth(t);
    if (mo) out.month = mo.month;
    // the day: a Korean day word (longest first), else a number next to the month, else "N일"
    const ko = Object.entries(cal().koDays).sort((a, b) => b[0].length - a[0].length).find(([w]) => t.includes(w));
    if (ko) out.day = ko[1];
    else {
        const rest = mo ? t.slice(0, mo.at) + ' ' + t.slice(mo.at + mo.len) : t;
        const dm = rest.match(/(\d{1,2})\s*일/) || (mo ? (t.slice(mo.at + mo.len).match(/^\s*(\d{1,2})(?!\s*년)\b/) || t.slice(0, mo.at).match(/\b(\d{1,2})\s*$/)) : null);
        if (dm) out.day = Number(dm[1]);
    }
    const ym = t.match(/(\d{1,4})\s*년/) || t.match(/\b(?:Year|Y)\s*(\d{1,4})\b/i);
    if (ym) out.year = Number(ym[1]);
    if (out.day !== undefined && out.month !== undefined) out.day = Math.min(Math.max(1, out.day), daysIn(out.month));
    return Object.keys(out).length ? out : null;
}
