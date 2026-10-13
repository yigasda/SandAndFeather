// 도감: every kind of thing Somang has ever had in her bag, and every secret she found, with the day it was first.
// s.codex.found: the kinds she got herself, not bought (state.js 8 → 9 fills it for older saves).
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
// found: kinds she got herself (fished, dug up, found on an adventure, cooked…), not bought at the market. The
// market's 골동품 좌판 only sells what she has found before
const fromBag = s => { for (const it of s.bag.items) { noteCodex(s, 'items', it.id); if (it.from !== 'market') noteCodex(s, 'found', it.id); } };

on('bag:changed', () => { const s = getState(); if (s) fromBag(s); });
// an older save: what is in the bag now counts
on('game:loaded', () => { const s = getState(); if (s?.linked) fromBag(s); });
