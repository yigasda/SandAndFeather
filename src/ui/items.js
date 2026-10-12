// The bag window and the card for one thing in it: look, open it, or take it to someone (talk.js).

import { find, itemInfo, items, nameOf, openItem } from '../core/bag.js';
import { dateLabel, fromDayNumber } from '../core/clock.js';
import { DATA } from '../core/data.js';
import { settings } from '../core/settings.js';
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

const iconBase = new URL('../../data/art/ui/', import.meta.url);
const ICONS = {blue_lotus:'lotus', lotus_seed:'lotus', bread:'bread', honey_bread:'bread', fig_cake:'bread',
    nile_perch:'fish', tilapia:'fish', catfish:'fish', eel:'fish', golden_carp:'fish', grilled_fish:'fish', fish_stew:'fish',
    faience_scarab:'scarab', heart_scarab:'scarab', wet_papyrus:'scroll', sealed_letter:'scroll', map_scrap:'scroll',
    duat_scroll:'scroll', tomb_rubbing:'scroll', limestone:'stone', black_sand:'stone', star_shard:'stone', feast_garland:'flower'};
function itemIcon(info, id) {
    const el = document.createElement(ICONS[id] ? 'img' : 'span'); el.className='sf_item_art';
    if(ICONS[id]){el.dataset.itemArt=ICONS[id];el.src=new URL(`skins/${settings().uiTheme}/item-${ICONS[id]}.png`,iconBase).href;el.alt='';}
    else el.textContent=info.icon || '◆';
    return el;
}

export function bagCard(ui, map) {
    // Retain each item's UID and history. Stacked display never merges saved items.
    const all = items().slice().reverse(), groups = new Map();
    for(const it of all){const key=`${it.id}|${it.opened}|${it.talked}`;
        if(!groups.has(key))groups.set(key,[]);groups.get(key).push(it);}
    const box=document.createElement('div');box.className='sf_inventory';
    const tabs=document.createElement('div');tabs.className='sf_inventory_tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','가방 분류');
    const content=document.createElement('div');content.className='sf_inventory_content';
    const grid=document.createElement('div');grid.className='sf_inventory_grid';
    const detail=document.createElement('div');detail.className='sf_inventory_detail';detail.setAttribute('aria-live','polite');
    content.append(grid,detail);box.append(tabs,content);
    let close=null, selected=null;
    const select=(group,b)=>{
        selected=group; for(const button of grid.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button===b));
        const it=group[0], info=itemInfo(it.id)||{};
        const head=document.createElement('div');head.className='sf_inventory_detail_head';
        const icon=document.createElement('div');icon.className='sf_inventory_icon_frame';icon.append(itemIcon(info,it.id));
        const identity=document.createElement('div');identity.className='sf_inventory_identity';
        const title=document.createElement('b');title.textContent=nameOf(it);
        const count=document.createElement('span');count.className='sf_inventory_count';
        count.append('보유 수량 ');const quantity=document.createElement('strong');quantity.textContent=String(group.length);count.append(quantity);
        identity.append(title,count);head.append(icon,identity);
        const about=document.createElement('p');about.className='sf_inventory_description';about.textContent=it.opened&&info.open?.ko?info.open.ko:info.about||'';
        detail.replaceChildren(head,about);
    };
    const materials=new Set(['material','ingredient','crop','seed']);
    const categories=[['all','전체'],['material','재료'],['food','음식'],['other','기타']];
    const show=category=>{
        grid.replaceChildren();detail.replaceChildren();selected=null;
        const visible=[...groups.values()].filter(g=>{const kind=itemInfo(g[0].id)?.kind;return category==='all'||(category==='material'?materials.has(kind):category==='food'?kind==='food':!materials.has(kind)&&kind!=='food');});
        for(const group of visible){const it=group[0],info=itemInfo(it.id)||{};
            const b=document.createElement('button');b.type='button';b.className='sf_inventory_slot';b.dataset.uid=it.uid;
            b.setAttribute('aria-label',`${nameOf(it)} ${group.length}개`);b.setAttribute('aria-pressed','false');
            const qty=document.createElement('small');qty.textContent=String(group.length);
            const label=document.createElement('span');label.className='sf_inventory_slot_name';label.textContent=nameOf(it);
            b.append(itemIcon(info,it.id),label,qty);
            b.title='선택한 물건을 한 번 더 누르면 자세히 볼 수 있어.';
            b.addEventListener('click',()=>{if(selected===group){close?.();itemCard(ui,map,it.uid);}else select(group,b);});grid.append(b);
            if(!selected)select(group,b);
        }
        if(!visible.length){const note=document.createElement('p');note.className='sf_note';note.textContent=all.length?'이 분류에는 물건이 없어.':'가방이 비어 있어. 선착장 물가를 살펴봐.';detail.append(note);}
        for(let i=visible.length;i<15;i++){const empty=document.createElement('span');empty.className='sf_inventory_slot sf_empty_slot';empty.setAttribute('aria-hidden','true');grid.append(empty);}
    };
    for(const [id,label]of categories){const b=document.createElement('button');b.type='button';b.className='sf_btn sf_small';b.textContent=label;b.dataset.category=id;
        b.setAttribute('aria-pressed',String(id==='all'));b.addEventListener('click',()=>{for(const other of tabs.children)other.setAttribute('aria-pressed',String(other===b));show(id);});tabs.append(b);}
    show('all');close=ui.showCard({title:'가방',kind:'inventory',wide:true,body:box,buttons:[]});
}
