// 도감: every kind of thing Somang has ever had in her bag, and every secret she found, with the day it was first.
// Filled from the bag as it changes (so nothing needs to report it) and by world.js for secrets.
// Nothing here goes to the prompt.

import { on } from './bus.js';
import { today } from './ledger.js';
import { getState } from './state.js';

// mutates only; the caller saves
export function noteCodex(s, kind, id) {
    const box = s.codex[kind] ||= {};
    if (!(id in box)) box[id] = today(s);
}
const fromBag = s => { for (const it of s.bag.items) noteCodex(s, 'items', it.id); };

on('bag:changed', () => { const s = getState(); if (s) fromBag(s); });
// an older save: what is in the bag now counts
on('game:loaded', () => { const s = getState(); if (s?.linked) fromBag(s); });
