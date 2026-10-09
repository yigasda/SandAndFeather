// 태양 기운: the day's strength for activities. Walking, looking, talking and bringing things up are free;
// fishing, cooking, study, training, an expedition, a work cost some. It fills when a new game day comes
// (only forward: a date that went back by a regenerate does not fill it again).

import { emit } from './bus.js';
import { today } from './ledger.js';
import { getState, saveState } from './state.js';

export const SUN_MAX = 6;

function fill(s) {
    const t = today(s);
    if (s.sun.day < 0 || t > s.sun.day) { s.sun.day = t; s.sun.left = SUN_MAX; }
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
