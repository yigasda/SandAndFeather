// What the chat should hear about: things that happened in the game, one short English line each.
// Each has an id and the chat length when it was made (from). Delivery is read from the chat itself:
//   no bot reply after it yet             → it goes in
//   the first bot reply after it is last  → it still goes in (a swipe or regenerate of that reply must see it too)
//   anything came after that reply        → delivered; it stays out
// So a regenerate never loses it and a new turn never repeats it. Old news is dropped.
// A line can also be only prepared: the game put a sentence in the input box. It goes in only if the message
// Somang actually sends still carries it (marks: words to look for); otherwise it is dropped with that send.

import { find, transact } from './bag.js';
import { emit } from './bus.js';
import { addLines } from './inject.js';
import { today } from './ledger.js';
import { ctx } from './st.js';
import { getState, saveState } from './state.js';

const MAX = 12, OLD_DAYS = 3;

const isBot = m => m && !m.is_user && !m.is_system;

// 'wait' (no reply yet) · 'live' (the reply that carried it is last) · 'done'
export function newsStatus(n, chat = ctx().chat || []) {
    let first = -1;
    for (let j = n.from; j < chat.length; j++) if (isBot(chat[j])) { first = j; break; }
    if (first < 0) return 'wait';
    return first === chat.length - 1 ? 'live' : 'done';
}

// text: English for the prompt; ko: how the game shows it; key: one of a kind (a newer one replaces it)
// prepared: wait for a sent message that has one of `marks`; uid: the bag item it is about (marked talked then)
export async function addNews({ text, ko = '', weight = 5, key = '', prepared = false, marks = [], uid = '', jid = '' }) {
    const s = getState();
    if (!s || !text) return null;
    if (key) s.news = s.news.filter(n => n.key !== key || (!n.prepared && newsStatus(n) === 'done'));
    const n = { id: `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, text, ko, weight, key, from: (ctx().chat || []).length, day: today(s), prepared, marks, uid, jid };
    s.news.push(n);
    prune(s);
    await saveState();
    emit('news:changed', {});
    return n;
}
export async function dropNews(id) {
    const s = getState();
    if (!s) return;
    s.news = id ? s.news.filter(n => n.id !== id) : [];
    await saveState();
    emit('news:changed', {});
}
// delivered and well past, or too old, or too many
function prune(s) {
    const chat = ctx().chat || [];
    s.news = s.news.filter(n => !(newsStatus(n, chat) === 'done' && chat.length - n.from > 6) && today(s) - n.day <= OLD_DAYS);
    if (s.news.length > MAX) s.news = s.news.slice(-MAX);
}
export const pending = (s = getState()) => (s?.news || []).filter(n => !n.prepared && newsStatus(n) !== 'done');
export const prepared = (s = getState()) => (s?.news || []).filter(n => n.prepared);

// a message was sent (index): prepared lines it carries go in from now, the rest are dropped.
// Runs before SillyTavern builds the prompt, so the change is made at once; saving follows.
export function armPrepared(index) {
    const s = getState(), chat = ctx().chat || [];
    if (!s || !s.news.some(n => n.prepared)) return [];
    const i = Number.isInteger(index) && chat[index]?.is_user ? index : chat.findLastIndex(m => m?.is_user);
    const mes = String(chat[i]?.mes || '');
    const armed = [];
    s.news = s.news.filter(n => {
        if (!n.prepared) return true;
        if (i < 0 || !n.marks.some(m => m && mes.includes(m))) return false;
        n.prepared = false;
        n.from = i + 1;
        armed.push(n);
        return true;
    });
    // the bag says "말함" only now that it was really said
    for (const n of armed) if (n.jid) { const e = s.journal.find(j => j.id === n.jid); if (e) e.told = true; }
    const uids = armed.map(n => n.uid).filter(Boolean);
    (uids.length ? transact(d => { for (const u of uids) { const it = find(d, u); if (it) it.talked = true; } }) : saveState())
        .then(() => emit('news:changed', {}));
    return armed;
}

// into the prompt block, newest first when weights tie
addLines(s => pending(s).map((n, k) => ({ text: n.text, weight: n.weight + k / 100 })));
