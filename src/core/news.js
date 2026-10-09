// What the chat should hear about: things that happened in the game, one short English line each.
// Each has an id and the chat length when it was made (from). Delivery is read from the chat itself:
//   no bot reply after it yet             → it goes in
//   the first bot reply after it is last  → it still goes in (a swipe or regenerate of that reply must see it too)
//   anything came after that reply        → delivered; it stays out
// So a regenerate never loses it and a new turn never repeats it. Old news is dropped.

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
export async function addNews({ text, ko = '', weight = 5, key = '' }) {
    const s = getState();
    if (!s || !text) return null;
    if (key) s.news = s.news.filter(n => n.key !== key || newsStatus(n) === 'done');
    const n = { id: `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, text, ko, weight, key, from: (ctx().chat || []).length, day: today(s) };
    s.news.push(n);
    prune(s);
    await saveState();
    emit('news', {});
    return n;
}
export async function dropNews(id) {
    const s = getState();
    if (!s) return;
    s.news = id ? s.news.filter(n => n.id !== id) : [];
    await saveState();
    emit('news', {});
}
// delivered and well past, or too old, or too many
function prune(s) {
    const chat = ctx().chat || [];
    s.news = s.news.filter(n => !(newsStatus(n, chat) === 'done' && chat.length - n.from > 6) && today(s) - n.day <= OLD_DAYS);
    if (s.news.length > MAX) s.news = s.news.slice(-MAX);
}
export const pending = (s = getState()) => (s?.news || []).filter(n => newsStatus(n) !== 'done');

// into the prompt block, newest first when weights tie
addLines(s => pending(s).map((n, k) => ({ text: n.text, weight: n.weight + k / 100 })));
