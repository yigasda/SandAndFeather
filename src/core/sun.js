// 태양 기운: the day's strength for activities. Walking, looking, talking and bringing things up are free;
// fishing, cooking, study, training, an expedition, a work cost some. It fills when a new game day comes
// (only forward: a date that went back by a regenerate does not fill it again).

import { emit } from './bus.js';
import { today } from './ledger.js';
import { settings } from './settings.js';
import { getState, saveState } from './state.js';

// how much a day holds: 서랍 › 하루 태양 기운 (4–30, default 12)
export const sunMax = () => Math.max(4, Math.min(30, Number(settings().sunMax) || 12));

function fill(s) {
    const t = today(s);
    const max = sunMax();
    if (s.sun.day < 0 || t > s.sun.day) { s.sun.day = t; s.sun.left = max; }
    // the day's size changed (the setting, or a save from when a day held 6): today grows or shrinks by as much
    const was = s.sun.max ?? 6;
    if (was !== max) s.sun.left = Math.max(0, Math.min(max, s.sun.left + (max - was)));
    s.sun.max = max;
    return s.sun.left;
}
export const sunLeft = (s = getState()) => (s ? fill(s) : 0);

// takes n if there is enough → true; the caller saves (or use spendNow)
export function spend(s, n) {
    fill(s);
    if (s.sun.left < n) return false;
    s.sun.left -= n;
    emit('sun:changed', {});
    return true;
}
export async function spendNow(n) {
    const s = getState();
    if (!s || !spend(s, n)) return false;
    await saveState();
    return true;
}
export const sunText = n => `태양 기운 ${n}`;
