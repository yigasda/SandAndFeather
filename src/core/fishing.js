// 낚시 기록: each fish caught on the line gets its length once (data/records.json fish.sizes), kept on that fish in the
// bag (item.cm) and in s.fishing.records[id] = { best, count, first, last }. Selling or eating the fish keeps the record.
// Only fish really caught on the line count: a missed pull, the reeds, or a sealed jar on the hook do not.
// Mutates only; the caller saves.

import { DATA } from './data.js';
import { record } from './facts.js';
import { today } from './ledger.js';

export const fishSizes = () => DATA.records?.fish?.sizes || {};
export const isRecordFish = id => !!fishSizes()[id];

// a length in whole cm: small ones are common, big ones rare (skew)
export function lengthFor(id, r = Math.random()) {
    const z = fishSizes()[id];
    if (!z) return 0;
    return Math.round(z.min + (z.max - z.min) * Math.pow(Math.min(1, Math.max(0, r)), z.skew || 1));
}

// she caught this fish (already in the bag as uid) → { cm, best: a new best for its kind, first: the first of its kind }
export function noteCatch(s, id, uid) {
    if (!isRecordFish(id)) return null;
    const it = s.bag.items.find(x => x.uid === uid);
    if (!it || it.cm) return null; // one length per fish, given once
    const cm = lengthFor(id);
    it.cm = cm;
    const day = today(s), rec = s.fishing.records[id];
    const first = !rec, best = !rec || cm > rec.best;
    s.fishing.records[id] = { best: best ? cm : rec.best, count: (rec?.count || 0) + 1, first: rec?.first ?? day, last: day, bestDay: best ? day : rec.bestDay ?? rec.first };
    record(s, 'catch', { itemId: id, itemUid: uid, source: 'dock' });
    return { cm, best, first };
}

export const bestCm = s => Math.max(0, ...Object.values(s.fishing?.records || {}).map(r => r.best || 0));
