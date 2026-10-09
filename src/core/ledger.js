// The ledger: what the game has already handled, so nothing happens twice.
// A reply regenerated with an earlier date, then the date coming forward again, must not start the same day twice,
// and an action allowed once a day must not come back because the date went backwards.
//   newDays(s)        → the days that have just begun and were never handled (and marks them handled)
//   canDo(s, key)     → the once-a-day action `key` is free today
//   markDone(s, key)  → it was done today

import { dayNumber } from './clock.js';

const KEEP_DAYS = 90; // older once-a-day marks are dropped

export const today = s => dayNumber(s.date);

// called after the date changed: which day numbers are new. The first time a chat is read nothing is "new".
export function newDays(s) {
    const L = s.ledger, t = today(s);
    if (L.lastDay < 0) { L.lastDay = t; return []; }
    if (t <= L.lastDay) return [];
    const from = L.lastDay + 1;
    L.lastDay = t;
    const out = [];
    for (let n = Math.max(from, t - 30); n <= t; n++) out.push(n); // a long jump is summed up, not replayed day by day
    return out;
}

// done on a later or the same day → not again until the date passes it
export function canDo(s, key) {
    const at = s.ledger.acts[key];
    return at === undefined || today(s) > at;
}
export function markDone(s, key) {
    const t = today(s);
    s.ledger.acts[key] = Math.max(t, s.ledger.acts[key] ?? -1);
    for (const [k, v] of Object.entries(s.ledger.acts)) if (v < t - KEEP_DAYS) delete s.ledger.acts[k];
}
