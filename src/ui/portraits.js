// Approved detailed minis: separate from the tiny actors on the map.
import { para, stack } from './kit.js';

const base = new URL('../../data/art/portraits/', import.meta.url);
export const CHARACTER_NAMES = {somang:'소망', set:'세트', horus:'호루스'};

// Full body is the approved standing sprite (front), cropped from docs/art/chibi-refresh/approved/idle;
// the bust keeps the detailed mini and Somang's two expressions.
export function portrait(id, {full = false, expression = 'calm'} = {}) {
    const box = document.createElement('figure');
    box.className = `sf_portrait ${full ? 'sf_portrait_full' : 'sf_portrait_bust'}`;
    const image = document.createElement('img');
    const key = id === 'somang' ? `somang-${expression}` : id;
    image.src = new URL(full ? `${id}-idle-full.png` : `${key}-bust.png`, base).href;
    image.alt = `${CHARACTER_NAMES[id] || id} ${full ? '전신' : '상반신'}${id === 'somang' && !full ? expression === 'smile' ? ' · 활짝 웃는 표정' : ' · 다문 미소' : ''}`;
    image.decoding = 'async';
    box.append(image);
    return box;
}

// Expression choice is presentation only: it does not change the RP or send chat.
export function somangPortrait({full = false} = {}) {
    if (full) return portrait('somang', {full: true}); // the standing sprite has one face
    const box = stack(); box.classList.add('sf_expression_portrait');
    let picture = portrait('somang', {full});
    const controls = document.createElement('div'); controls.className = 'sf_expression_choices';
    controls.setAttribute('role', 'group'); controls.setAttribute('aria-label', '소망 표정');
    for (const [expression,label] of [['calm','다문 미소'],['smile','활짝 웃기']]) {
        const b=document.createElement('button'); b.type='button'; b.className='sf_btn sf_small'; b.textContent=label;
        b.setAttribute('aria-pressed', String(expression === 'calm'));
        b.addEventListener('click',()=>{
            const next=portrait('somang',{full,expression}); picture.replaceWith(next); picture=next;
            for(const btn of controls.children)btn.setAttribute('aria-pressed',String(btn===b));
        }); controls.append(b);
    }
    box.append(picture, controls); return box;
}

export function conversationPortraits(npc) {
    const box=document.createElement('div'); box.className='sf_conversation_art';
    const other=stack(portrait(npc.id),para(npc.label,'sf_portrait_name'));
    box.append(other,stack(somangPortrait(),para('소망','sf_portrait_name')));
    return box;
}

export function characterDetail(ui,id) {
    const body=stack(id==='somang' ? somangPortrait({full:true}) : portrait(id,{full:true}));
    body.classList.add('sf_character_detail');
    return ui.showCard({title:CHARACTER_NAMES[id],kind:'character',body,buttons:[{label:'돌아가기'}]});
}
