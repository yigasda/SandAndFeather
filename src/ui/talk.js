// 말 걸기 → 챗. The game sets the scene and hands over: one English line about where Somang goes and what she
// brings goes into the prompt (news.js), and a first sentence goes into the chat's input box to edit and send.
// What the god says or feels is left to the RP.
//   ui = { showCard, toast, fold } from window.js

import { enOf, find, items, nameOf, transact } from '../core/bag.js';
import { DATA } from '../core/data.js';
import { addNews } from '../core/news.js';
import { applyInjection } from '../core/inject.js';
import { getState } from '../core/state.js';

// 을/를, 이/가… after a Korean word: the first form after a final consonant
function josa(word, pair) {
    const [a, b] = { '을': ['을', '를'], '를': ['을', '를'], '이': ['이', '가'], '가': ['이', '가'], '은': ['은', '는'], '는': ['은', '는'], '과': ['과', '와'], '와': ['과', '와'] }[pair] || [pair, pair];
    const c = String(word).trim().slice(-1).charCodeAt(0);
    const has = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : false;
    return word + (has ? a : b);
}
// "{물건:을} 들고 {상대}에게" with the values filled in
function fill(tpl, vals) {
    return String(tpl || '').replace(/\{([^}:]+)(?::([^}]+))?\}/g, (m, k, j) => (k in vals ? (j ? josa(vals[k], j) : vals[k]) : m));
}

// people on this map who can be talked to in the chat
export const talkers = map => map.npcs.filter(n => n.talk);

export async function startTalk(ui, npc, uid = null) {
    const T = DATA.talk || {};
    const s = getState();
    const it = uid ? find(s.bag, uid) : null;
    const from = it ? (T.from?.[it.from] || { ko: '', en: '' }) : null;
    const en = it
        ? fill(T.line?.withItem, { who: npc.en, where: npc.where || '', item: enOf(it), from: from.en || '' })
        : fill(T.line?.plain, { who: npc.en, where: npc.where || '' });
    const ko = it
        ? fill(T.withItem, { 상대: npc.label, 장소: from.ko || '어딘가', 물건: nameOf(it) })
        : fill(T.plain, { 상대: npc.label, 장소: npc.whereKo || '' });
    await addNews({ text: en.replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1'), ko, weight: 9, key: 'talk' });
    if (it) await transact(d => { const x = find(d, uid); if (x) x.talked = true; });
    applyInjection();
    const box = document.getElementById('send_textarea');
    if (box) {
        box.value = box.value.trim() ? `${box.value.trimEnd()}\n${ko}` : ko;
        box.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await ui.fold();
    box?.focus();
}

// the card for a person you walked up to
export function personCard(ui, npc, map) {
    if (!npc.talk) { ui.showCard({ title: npc.label, text: npc.text || '' }); return; }
    const fresh = items().filter(it => !it.talked).slice(-3).reverse();
    ui.showCard({
        title: npc.label,
        text: `${npc.whereKo || ''}에 있다. 말을 걸면 이 장면이 챗으로 이어져.`,
        buttons: [
            ...fresh.map(it => ({ label: `${josa(nameOf(it), '을')} 들고 가기`, onClick: () => { startTalk(ui, npc, it.uid); } })),
            { label: '말 걸기', primary: true, onClick: () => { startTalk(ui, npc); } },
        ],
    });
}

// "이 일로 말 걸기": to whom
export function pickTalker(ui, map, uid) {
    const list = talkers(map);
    if (!list.length) { ui.toast('여기엔 말 걸 사람이 없어'); return; }
    ui.showCard({
        title: '누구에게 갈까',
        buttons: list.map(n => ({ label: `${n.label}에게`, primary: true, onClick: () => { startTalk(ui, n, uid); } })),
    });
}

export { josa };
