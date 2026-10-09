// The bag: every pack asks here to add or take things; nobody edits s.bag directly.
// Items are kinds from data/items.json; each one in the bag has its own uid, where and when it was found,
// and whether it was opened. transact() runs several changes together: all of them, or none.

import { emit } from './bus.js';
import { DATA } from './data.js';
import { today } from './ledger.js';
import { getState, saveState } from './state.js';

export const itemInfo = id => DATA.items?.items?.[id] || null;

// several changes as one: fn(draft) changes a copy; if it throws or returns false, nothing changes
export async function transact(fn) {
    const s = getState();
    if (!s) return false;
    const draft = structuredClone(s.bag);
    let ok;
    try { ok = fn(draft, s) !== false; } catch (e) { console.error('[SandAndFeather] bag', e); ok = false; }
    if (!ok) return false;
    s.bag = draft;
    await saveState();
    emit('bag', {});
    return true;
}

// inside a transact(): put one in → its uid
export function put(draft, s, id, from = '') {
    if (!itemInfo(id)) throw new Error(`no item ${id}`);
    const uid = `i${++draft.seq}`;
    draft.items.push({ uid, id, from, got: today(s), opened: false, talked: false });
    return uid;
}
export function take(draft, uid) {
    const k = draft.items.findIndex(it => it.uid === uid);
    if (k < 0) throw new Error(`no ${uid} in the bag`);
    return draft.items.splice(k, 1)[0];
}
export const find = (bag, uid) => bag.items.find(it => it.uid === uid) || null;

export function items() { return getState()?.bag.items || []; }

// its name as it is now: an opened jar is "열린 항아리"
export function nameOf(it) {
    const info = itemInfo(it.id);
    if (!info) return it.id;
    return it.opened && info.open?.ko_name ? info.open.ko_name : info.ko;
}
export function enOf(it) {
    const info = itemInfo(it.id);
    if (!info) return 'something';
    return it.opened && info.open?.en_name ? info.open.en_name : info.en;
}

// open it once: it changes, and may give something else
export async function openItem(uid) {
    let got = null;
    const ok = await transact((d, s) => {
        const it = find(d, uid), info = it && itemInfo(it.id);
        if (!it || it.opened || !info?.open) return false;
        it.opened = true;
        if (info.open.gives) got = put(d, s, info.open.gives, it.from);
    });
    return ok ? { gave: got } : null;
}
