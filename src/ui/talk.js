// 말 걸기 → 챗. The chat is the real scene: by default the game only brings something out in it
// ("선착장에서 건진 풍뎅이를 꺼내 보인다" + the bare fact for the prompt), it never moves the RP. Taking the scene to
// where someone stands on the map is a separate choice. Nothing is said for the god; the RP does that.
//   ui = { showCard, toast, fold } from window.js

import { enOf, find, items, nameOf } from '../core/bag.js';
import { DATA } from '../core/data.js';
import { addNews } from '../core/news.js';
import { josa } from '../core/ko.js';
import { getState } from '../core/state.js';

// "{물건:을} 들고 {상대}에게" with the values filled in
function fill(tpl, vals) {
    return String(tpl || '').replace(/\{([^}:]+)(?::([^}]+))?\}/g, (m, k, j) => (k in vals ? (j ? josa(vals[k], j) : vals[k]) : m));
}

// people on this map who can be talked to in the chat
export const talkers = map => map.npcs.filter(n => n.talk);

const tidy = t => String(t).replace(/\s+/g, ' ').replace(/\s+([.,;])/g, '$1').trim();
// the words that show the sent message still carries this: the thing's last word ("풍뎅이"), its full name, the person
function marksOf(name, extra = []) {
    const last = String(name).trim().split(/\s+/).pop();
    return [...new Set([name, last.length >= 2 ? last : '', ...extra].filter(Boolean))];
}

// puts the sentence in the chat's input box and folds the game. The line for the prompt is only prepared:
// it goes in if the message Somang sends still has the thing (or the person) in it (news.js).
async function hand(ui, ko, en, marks, uid = '', jid = '') {
    await addNews({ text: tidy(en), ko, weight: 9, key: 'talk', prepared: true, marks, uid, jid });
    const box = document.getElementById('send_textarea');
    if (box) {
        box.value = box.value.trim() ? `${box.value.trimEnd()}\n${ko}` : ko;
        box.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await ui.fold();
    box?.focus();
}

// the default: bring it out in the scene the chat is already in. Nobody moves; who is there is the RP's business.
export async function showItem(ui, uid, npc = null) {
    const T = DATA.talk || {};
    const it = find(getState().bag, uid);
    if (!it) return;
    const from = T.from?.[it.from] || { ko: '어딘가', got: '얻은', en: '' };
    const ko = fill(npc ? T.showTo : T.show, { 상대: npc?.label || '', 장소: from.ko, 얻은: from.got || '얻은', 물건: nameOf(it) });
    const en = fill(T.line?.show, { item: enOf(it), from: from.en || '' });
    await hand(ui, ko, en, marksOf(nameOf(it)), uid);
}

// something that happened (a journal entry): its sentence into the input box, its fact for the prompt
export async function showEvent(ui, entry) {
    if (!entry?.say || !entry.en) return;
    await hand(ui, entry.say, entry.en, entry.marks?.length ? entry.marks : [entry.say.split(' ')[0]], '', entry.id);
}

// on purpose: take the scene to where that person stands on the map (with a thing, or not)
export async function visit(ui, npc, uid = null) {
    const T = DATA.talk || {};
    const it = uid ? find(getState().bag, uid) : null;
    const from = it ? (T.from?.[it.from] || { ko: '', en: '' }) : null;
    const ko = it
        ? fill(T.visit, { 상대: npc.label, 곳: npc.whereKo || '', 물건: nameOf(it) })
        : fill(T.visitPlain, { 상대: npc.label, 곳: npc.whereKo || '' });
    const en = it
        ? fill(T.line?.visit, { who: npc.en, where: npc.where || '', item: enOf(it), from: from.en || '' })
        : fill(T.line?.visitPlain, { who: npc.en, where: npc.where || '' });
    await hand(ui, ko, en, it ? marksOf(nameOf(it), [npc.label]) : [npc.label, npc.whereKo].filter(Boolean), uid || '');
}

// the card for a person you walked up to: who to talk to; moving the scene is a separate, deliberate choice
export function personCard(ui, npc) {
    if (!npc.talk) { ui.showCard({ title: npc.label, text: npc.text || '' }); return; }
    // newest first, one of each kind
    const seen = new Set();
    const fresh = items().filter(it => !it.talked).reverse().filter(it => !seen.has(it.id) && seen.add(it.id)).slice(0, 3);
    ui.showCard({
        title: npc.label,
        text: fresh.length
            ? `챗의 지금 장면에서 ${npc.label}에게 꺼내 보일 수 있어. 장면을 옮기고 싶을 때만 찾아가기.`
            : `${npc.whereKo || ''}에 있다. 가방에 꺼내 보일 게 없어서 찾아가기만 할 수 있어.`,
        buttons: [
            { label: `${josa(npc.whereKo || '그곳', '으로')} 찾아가기`, onClick: () => { visit(ui, npc); } },
            ...fresh.map(it => ({ label: `${josa(nameOf(it), '을')} 꺼내 보이기`, primary: true, onClick: () => { showItem(ui, it.uid, npc); } })),
        ],
    });
}

// "찾아가기" from a thing's card: to whom
export function pickVisit(ui, map, uid) {
    const list = talkers(map);
    if (!list.length) { ui.toast('여기엔 찾아갈 사람이 없어'); return; }
    ui.showCard({
        title: '누구에게 찾아갈까',
        text: '챗의 장면이 그곳으로 옮겨 가. 지금 장면에서 꺼내려면 닫고 지금 꺼내기를 눌러.',
        buttons: list.map(n => ({ label: `${n.whereKo || ''}의 ${n.label}`.trim(), primary: true, onClick: () => { visit(ui, n, uid); } })),
    });
}

export { josa };
