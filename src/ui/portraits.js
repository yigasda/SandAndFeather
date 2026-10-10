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

// 인물 보기: Set and Horus each have three illustrations (data/art/portraits/gallery), one at a time with
// ‹ › buttons, dots, arrow keys and a sideways swipe. Anyone else shows the standing sprite.
const GALLERY = { set: 3, horus: 3 };
function gallery(id) {
    const n = GALLERY[id];
    const box = document.createElement('div'); box.className = 'sf_gallery';
    const figure = document.createElement('figure'); figure.className = 'sf_portrait sf_portrait_full sf_gallery_pic';
    const image = document.createElement('img'); image.decoding = 'async'; figure.append(image);
    const nav = document.createElement('div'); nav.className = 'sf_gallery_nav';
    const prev = document.createElement('button'), next = document.createElement('button'), dots = document.createElement('div');
    prev.type = next.type = 'button'; prev.className = next.className = 'sf_btn sf_small sf_gallery_step';
    prev.textContent = '‹'; next.textContent = '›'; prev.setAttribute('aria-label', '이전 그림'); next.setAttribute('aria-label', '다음 그림');
    dots.className = 'sf_gallery_dots';
    let at = 0;
    const show = k => {
        at = (k + n) % n;
        image.src = new URL(`gallery/${id}-${at + 1}.webp`, base).href;
        image.alt = `${CHARACTER_NAMES[id]} 그림 ${at + 1} / ${n}`;
        [...dots.children].forEach((d, i) => d.setAttribute('aria-current', String(i === at)));
    };
    for (let i = 0; i < n; i++) {
        const d = document.createElement('button'); d.type = 'button'; d.className = 'sf_gallery_dot';
        d.setAttribute('aria-label', `그림 ${i + 1}`); d.addEventListener('click', () => show(i)); dots.append(d);
    }
    prev.addEventListener('click', () => show(at - 1)); next.addEventListener('click', () => show(at + 1));
    let x0 = null;
    figure.addEventListener('pointerdown', e => { x0 = e.clientX; });
    figure.addEventListener('pointerup', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) show(at + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    box.tabIndex = 0;
    box.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); show(at + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    nav.append(prev, dots, next); box.append(figure, nav); show(0);
    return box;
}

export function characterDetail(ui,id) {
    const body=stack(GALLERY[id] ? gallery(id) : portrait(id));
    body.classList.add('sf_character_detail');
    return ui.showCard({title:CHARACTER_NAMES[id],kind:'character',body,buttons:[{label:'돌아가기'}]});
}
