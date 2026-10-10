// Pictures of the trio for the party and Somang cards.
import { stack } from './kit.js';

const base = new URL('../../data/art/portraits/', import.meta.url);
export const CHARACTER_NAMES = {somang:'소망', set:'세트', horus:'호루스'};

// The user's character illustrations, cut out from their plain ground (tools/art/cut-illust-portraits.py):
// head and shoulders for the party and Somang cards, the whole picture when a party card is opened.
export function portrait(id, {head = false} = {}) {
    const box = document.createElement('figure');
    box.className = `sf_portrait ${head ? 'sf_portrait_head' : 'sf_portrait_full'}`;
    const image = document.createElement('img');
    image.src = new URL(`${id}-illust${head ? '-head' : ''}.png`, base).href;
    image.alt = `${CHARACTER_NAMES[id] || id} ${head ? '상반신' : '전신'}`;
    image.decoding = 'async';
    box.append(image);
    return box;
}

export function characterDetail(ui,id) {
    const body=stack(portrait(id));
    body.classList.add('sf_character_detail');
    return ui.showCard({title:CHARACTER_NAMES[id],kind:'character',body,buttons:[{label:'돌아가기'}]});
}
