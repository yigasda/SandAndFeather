// What really happened in the game, for later features (memories, achievements, research) to read instead of each
// guessing from other records. Two parts, both per chat:
//   s.facts  the latest FACT_MAX done actions in detail: { id, day, kind, lead, with, map, itemId, itemUid, source, n }
//            lead / with / map are taken when the action is done, never filled in later from where she is now
//   s.tally  lifetime counts that are never cut: tally[kind], tally['kind:itemId'], and deben spent / earned.
//            They only count from 0.9.60 on (older saves start at zero)
// Only actions that succeeded are recorded. Mutates only; the caller saves.

import { today } from './ledger.js';

export const FACT_MAX = 200;

export function record(s, kind, { itemId = '', itemUid = '', source = '', n = 1, spent = 0, earned = 0 } = {}) {
    const day = today(s);
    const id = `f${day}_${(s.tally._seq = (s.tally._seq || 0) + 1)}`;
    s.facts.push({ id, day, kind, lead: s.party?.lead || 'somang', with: s.party?.with || '', map: s.pos?.map || '', itemId, itemUid, source, n });
    if (s.facts.length > FACT_MAX) s.facts.splice(0, s.facts.length - FACT_MAX);
    s.tally[kind] = (s.tally[kind] || 0) + n;
    if (itemId) s.tally[`${kind}:${itemId}`] = (s.tally[`${kind}:${itemId}`] || 0) + n;
    if (spent) s.tally.spent = (s.tally.spent || 0) + spent;
    if (earned) s.tally.earned = (s.tally.earned || 0) + earned;
    return id;
}
