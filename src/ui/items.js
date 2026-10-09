// The bag window and the card for one thing in it: look, open it, or take it to someone (talk.js).

import { find, itemInfo, items, nameOf, openItem } from '../core/bag.js';
import { dateLabel, fromDayNumber } from '../core/clock.js';
import { DATA } from '../core/data.js';
import { getState } from '../core/state.js';
import { josa, pickVisit, showItem } from './talk.js';

const fromKo = it => DATA.talk?.from?.[it.from]?.ko || '';

export function itemCard(ui, map, uid, { fresh = false } = {}) {
    const it = find(getState().bag, uid), info = it && itemInfo(it.id);
    if (!info) return;
    const buttons = [];
    if (info.open && !it.opened) buttons.push({ label: '열어 보기', onClick: () => { opened(ui, map, uid); } });
    buttons.push({ label: '찾아가기', onClick: () => { pickVisit(ui, map, uid); } });
    buttons.push({ label: fresh ? '보관하기' : '닫기' });
    buttons.push({ label: '지금 꺼내기', primary: true, onClick: () => { showItem(ui, uid); } });
    ui.showCard({
        tag: fresh ? '발견' : '',
        title: `${info.icon || ''} ${nameOf(it)}`.trim(),
        text: `${it.opened && info.open?.ko ? info.open.ko : info.about || ''}${fresh ? '\n가방에 넣었어.' : `\n${dateLabel(fromDayNumber(it.got))}${fromKo(it) ? ` · ${fromKo(it)}` : ''}`}`,
        buttons,
    });
}

async function opened(ui, map, uid) {
    const r = await openItem(uid);
    if (!r) return;
    const s = getState(), it = find(s.bag, uid), info = itemInfo(it.id);
    const gave = r.gave ? find(s.bag, r.gave) : null;
    ui.showCard({
        title: `${info.icon || ''} ${nameOf(it)}`.trim(),
        text: `${info.open.ko}${gave ? `\n가방에 ${josa(nameOf(gave), '이')} 들어왔어.` : ''}`,
        buttons: [
            ...(gave ? [{ label: `${nameOf(gave)} 보기`, onClick: () => { itemCard(ui, map, gave.uid); } }] : []),
            { label: '닫기' },
            { label: '지금 꺼내기', primary: true, onClick: () => { showItem(ui, gave ? gave.uid : uid); } },
        ],
    });
}

export function bagCard(ui, map) {
    const list = items().slice().reverse();
    const box = document.createElement('div');
    box.className = 'sf_bag_list';
    if (!list.length) box.innerHTML = '<div class="sf_note">가방이 비어 있어. 선착장 물가를 살펴봐.</div>';
    let close = null;
    for (const it of list) {
        const info = itemInfo(it.id) || {};
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sf_bag_row';
        b.innerHTML = `<span class="sf_bag_icon"></span><span class="sf_bag_name"></span><span class="sf_bag_meta"></span>`;
        b.querySelector('.sf_bag_icon').textContent = info.icon || '·';
        b.querySelector('.sf_bag_name').textContent = nameOf(it);
        b.querySelector('.sf_bag_meta').textContent = `${dateLabel(fromDayNumber(it.got))}${it.talked ? ' · 말함' : ''}`;
        b.addEventListener('click', () => { close?.(); itemCard(ui, map, it.uid); });
        box.append(b);
    }
    close = ui.showCard({ title: '가방', body: box });
}
