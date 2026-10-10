// Pictures of the trio: the approved standing sprites, large.
import { stack } from './kit.js';

const base = new URL('../../data/art/portraits/', import.meta.url);
export const CHARACTER_NAMES = {somang:'소망', set:'세트', horus:'호루스'};

// The approved standing sprite (front), shown large from 인물 보기 and on the Somang card.
export function portrait(id) {
    const box = document.createElement('figure');
    box.className = 'sf_portrait sf_portrait_full';
    const image = document.createElement('img');
    image.src = new URL(`${id}-idle-full.png`, base).href;
    image.alt = `${CHARACTER_NAMES[id] || id} 전신`;
    image.decoding = 'async';
    box.append(image);
    return box;
}

export function characterDetail(ui,id) {
    const body=stack(portrait(id));
    body.classList.add('sf_character_detail');
    return ui.showCard({title:CHARACTER_NAMES[id],kind:'character',body,buttons:[{label:'돌아가기'}]});
}
