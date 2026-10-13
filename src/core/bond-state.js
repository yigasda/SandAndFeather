// Save-only defaults. No connection, artwork, or inference is run during migration.
export const freshBond = () => ({
    set: { pts: 0, steps: {}, gifts: {} }, horus: { pts: 0, steps: {}, gifts: {} },
    ties: [], cand: [], skip: [], log: [], seq: 0,
    scan: { upTo: -1, chunks: [], carry: null, pending: [], failures: [], job: null },
    alias: { set: ['세트', 'Set', '세트님', '세트 신'], horus: ['호루스', 'Horus', '호루스님', '호루스 신'] },
    options: { precise: true, chunkSize: 24000, notify: false },
});
export function fillBond(s) {
    const fresh = freshBond();
    if (!s.bond || typeof s.bond !== 'object' || Array.isArray(s.bond)) s.bond = fresh;
    const b = s.bond;
    for (const [k, v] of Object.entries(fresh)) if (b[k] === undefined) b[k] = structuredClone(v);
    for (const k of ['set', 'horus', 'scan', 'alias', 'options']) {
        if (!b[k] || typeof b[k] !== 'object' || Array.isArray(b[k])) b[k] = structuredClone(fresh[k]);
        for (const [key, val] of Object.entries(fresh[k])) if (b[k][key] === undefined) b[k][key] = structuredClone(val);
    }
    for (const k of ['ties', 'cand', 'skip', 'log']) if (!Array.isArray(b[k])) b[k] = [];
    // Never trim pending user decisions, including when migrating a larger queue.
    if (!Array.isArray(b.scan.pending)) b.scan.pending = [];
    if (b.cand.length > 60) b.scan.pending.unshift(...b.cand.splice(60));
    return b;
}
