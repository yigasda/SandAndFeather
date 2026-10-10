// Full-body pictures of the trio for the party and Somang cards: their approved standing sprites.
import { stack } from './kit.js';

const base = new URL('../../data/art/portraits/', import.meta.url);
export const CHARACTER_NAMES = {somang:'소망', set:'세트', horus:'호루스'};

// The approved standing sprite (front), cropped from docs/art/chibi-refresh/approved/idle: the whole of it, or
// (head) down to the shoulders for the party cards. All three share one crop box, so they stand at one scale.
export function portrait(id, {head = false} = {}) {
    const box = document.createElement('figure');
    box.className = `sf_portrait ${head ? 'sf_portrait_head' : 'sf_portrait_full'}`;
    const image = document.createElement('img');
    image.src = new URL(`${id}-idle-${head ? 'head' : 'full'}.png`, base).href;
    image.alt = `${CHARACTER_NAMES[id] || id} ${head ? '얼굴' : '전신'}`;
    image.decoding = 'async';
    box.append(image);
    return box;
}

export function characterDetail(ui,id) {
    const body=stack(portrait(id));
    body.classList.add('sf_character_detail');
    return ui.showCard({title:CHARACTER_NAMES[id],kind:'character',body,buttons:[{label:'돌아가기'}]});
}
