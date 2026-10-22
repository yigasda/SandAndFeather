import { attachMenuHeader } from './menu-header.js';

// Cards that open over the map inside the game window: a place, a person, "not yet". Not SillyTavern popups,
// so the map stays behind them and the window keeps its size on a phone.
//   showCard(root, { tag, title, text, body, buttons: [{ label, primary, onClick }], onClose }) → close()
//   toast(root, '…')

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export { esc };

let openCount = 0;
export const cardOpen = () => openCount > 0;

// ST transforms <html>, so a horizontal document scroll also moves its fixed game.
// Browser focus/scroll-into-view can leave a few pixels of scroll after a mobile popup.
function keepGameInViewport(root) {
    if (root.id === 'sf_game' && window.scrollX) {
        window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' });
    }
}

// The title stays at the top and the frame stays round the card; only .sf_pop_scroll scrolls. When the card itself
// scrolled, its frame (a ::before inside it) scrolled away with the content and left the rest of the list unframed.
// modal: a touch beside the card does not close it (the puzzle screen: a stray touch must not end the puzzle)
export function showCard(root, { tag = '', title = '', text = '', body = null, buttons = null, wide = false, kind = '', modal = false, onClose = null } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'sf_pop_wrap';
    if (kind) wrap.dataset.kind = kind;
    // Semantic title artwork for cozy; other themes keep their own title symbols.
    const activeTab = root.querySelector('.sf_tabs [data-tab].sf_on')?.dataset.tab;
    const titleArt = /인연|유대/.test(title) || kind.startsWith('bond') ? 'icon.rings-large'
        : /낚시|선착장/.test(title) || kind.startsWith('fish') ? 'game.43-fishing'
        : /부엌|요리|식사/.test(title) ? 'game.44-cooking'
        : /도감|수첩/.test(title) ? 'icon.notebook'
        : /설정|축제|텃밭/.test(title) || kind === 'appearance' ? 'icon.lotus'
        : /시장|가방|선물/.test(title) || kind === 'inventory' ? 'icon.gift'
        : kind === 'party' || kind.startsWith('character') || kind === 'conversation' ? 'icon.heart'
        : /탐사|지도/.test(title) || (activeTab === 'map' && openCount === 0) ? 'icon.map'
        : /결산|달력|기록/.test(title) ? 'icon.record'
        : 'icon.scroll';
    wrap.style.setProperty('--lotus-title-icon', `url("${new URL(`../../data/art/ui/lotus/${titleArt}.png`, import.meta.url).href}")`);

    wrap.innerHTML = `
      <div class="sf_pop${wide ? ' sf_pop_wide' : ''}" role="dialog" aria-label="${esc(title)}">
        <div class="sf_pop_head">
          ${tag ? `<span class="sf_tag">${esc(tag)}</span>` : ''}
          <b class="sf_pop_title">${esc(title)}</b>
          <button type="button" class="sf_icon_btn sf_pop_x" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="sf_pop_scroll">
          ${tag ? `<div class="sf_pop_tagline"><span class="sf_tag">${esc(tag)}</span></div>` : ''}
          ${text ? `<div class="sf_pop_text">${esc(text)}</div>` : ''}
          <div class="sf_pop_body"></div>
          <div class="sf_pop_btns"></div>
        </div>
      </div>`;
    if (body) wrap.querySelector('.sf_pop_body').append(body);
    else wrap.querySelector('.sf_pop_body').remove();
    const btns = wrap.querySelector('.sf_pop_btns');
    let closed = false, detachMenu = null;
    const close = () => {
        if (closed) return;
        closed = true; openCount--;
        detachMenu?.();
        wrap.remove();
        keepGameInViewport(root);
        onClose?.();
    };
    for (const b of buttons || [{ label: '닫기', primary: true }]) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `sf_btn${b.primary ? ' sf_primary' : ''}`;
        el.textContent = b.label;
        el.disabled = !!b.disabled;
        el.addEventListener('click', () => { if (b.onClick?.() === false) return; close(); });
        btns.append(el);
    }
    wrap.sfClose = close;
    wrap.querySelector('.sf_pop_x').addEventListener('click', close);
    wrap.addEventListener('pointerdown', e => { if (e.target === wrap && !modal) close(); });
    const active = root.querySelector('.sf_tabs [data-tab].sf_on')?.dataset.tab;
    const menu = root.id === 'sf_game' && openCount === 0 && (kind === 'bond' || (active && active !== 'world'));
    openCount++;
    root.append(wrap);
    if (menu) detachMenu = attachMenuHeader(root, wrap, kind === 'bond' ? 'bond' : active);
    keepGameInViewport(root);
    return close;
}

// closes every card (the window is closing)
export function closeCards(root) {
    root.querySelectorAll('.sf_pop_wrap').forEach(el => el.sfClose ? el.sfClose() : el.remove());
    openCount = 0;
}

let toastTimer = null;
export function toast(root, text) {
    let el = root.querySelector('.sf_toast');
    if (!el) { el = document.createElement('div'); el.className = 'sf_toast'; root.append(el); }
    el.textContent = text;
    el.classList.add('sf_show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('sf_show'), 2200);
}
