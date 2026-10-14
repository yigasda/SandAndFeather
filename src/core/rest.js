// 게임 하루와 쉬기: the game goes on without the chat. The chat's date still names the story's day (what goes to the
// prompt); sleeping in a bed, once half the day's 태양 기운 is spent, starts the next game day: 태양 기운 full, new
// commissions, and the day's 하루 결산. The game day is never behind the chat's (ledger.today is the later of the two),
// so when the chat's date moves on to a night already slept it is not counted again.
// Sitting down to rest gives 태양 기운 1, twice a game day.

import { itemInfo } from './bag.js';
import { emit } from './bus.js';
import { fromDayNumber } from './clock.js';
import { canDo, markDone, newDays, today } from './ledger.js';
import { saveState } from './state.js';
import { sunLeft, sunMax } from './sun.js';

// sleep comes once half the day is spent
export const tired = s => sunLeft(s) <= sunMax() / 2;

// the next game day; false while she is not tired. The caller shows what follows (daylog's 하루 결산 comes on its own).
export async function sleepNow(s) {
    if (!tired(s)) return false;
    const before = { ...s.date };
    if (s.ledger.lastDay < 0) s.ledger.lastDay = today(s);
    s.ledger.gday = today(s) + 1;
    // the screen shows morning until the chat's tracker moves on (then the chat's time of day again)
    s.wake = { part: 'dawn', raw: s.sync.raw };
    const fresh = newDays(s);
    await saveState();
    if (fresh.length) emit('day:started', { days: fresh.map(fromDayNumber), from: before, to: s.date, slept: true });
    emit('sun:changed', {});
    return true;
}

// the time of day the game shows and plays by: the chat's, or morning after she slept until the chat moves on.
// What goes to the prompt keeps the chat's own (s.part).
export const partNow = s => (s?.wake && s.wake.raw === s.sync?.raw ? s.wake.part : s?.part || 'day');

export const SIT_PER_DAY = 2;
const sitKeys = () => Array.from({ length: SIT_PER_DAY }, (_, k) => `rest:sit:${k + 1}`);
export const sitsLeft = s => sitKeys().filter(k => canDo(s, k)).length;
// 태양 기운 +1 → 'rested', or 'full' (nothing to give back, the rest is kept), or 'used' (today's rests are spent);
// a fan in the bag (items.json rest.sun, kept, one of each kind) gives that much more, never past the day's full.
// The caller saves
export const restMore = s => [...new Set(s.bag.items.map(it => it.id))].reduce((a, id) => a + (itemInfo(id)?.rest?.sun || 0), 0);
export function sitRest(s) {
    const k = sitKeys().find(key => canDo(s, key));
    if (!k) return 'used';
    if (sunLeft(s) >= sunMax()) return 'full';
    markDone(s, k);
    s.sun.left = Math.min(sunMax(), s.sun.left + 1 + restMore(s));
    emit('sun:changed', {});
    return 'rested';
}

// eating at the table (0.9.70): one food from the bag is eaten; the first meal of a game day gives 태양 기운 1
// → 'fed', or 'full' (nothing to give back, the day's meal is kept), or 'ate' (today's meal already gave it). The caller
// has taken the food out of the bag and saves
export const ATE_KEY = 'eat:meal';
export function eatMeal(s) {
    if (!canDo(s, ATE_KEY)) return 'ate';
    if (sunLeft(s) >= sunMax()) return 'full';
    markDone(s, ATE_KEY);
    s.sun.left = Math.min(sunMax(), s.sun.left + 1);
    emit('sun:changed', {});
    return 'fed';
}
