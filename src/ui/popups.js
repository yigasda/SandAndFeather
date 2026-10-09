// Cards that open over the map inside the game window: a place, a person, "not yet". Not SillyTavern popups,
// so the map stays behind them and the window keeps its size on a phone.
//   showCard(root, { tag, title, text, body, buttons: [{ label, primary, onClick }], onClose }) → close()
//   toast(root, '…')

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export { esc };

let openCount = 0;
export const cardOpen = () => openCount > 0;

export function showCard(root, { tag = '', title = '', text = '', body = null, buttons = null, wide = false, onClose = null } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'sf_pop_wrap';
    wrap.innerHTML = `
      <div class="sf_pop${wide ? ' sf_pop_wide' : ''}" role="dialog" aria-label="${esc(title)}">
        <div class="sf_pop_head">
          ${tag ? `<span class="sf_tag">${esc(tag)}</span>` : ''}
          <b class="sf_pop_title">${esc(title)}</b>
          <button type="button" class="sf_icon_btn sf_pop_x" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${text ? `<div class="sf_pop_text">${esc(text)}</div>` : ''}
        <div class="sf_pop_body"></div>
        <div class="sf_pop_btns"></div>
      </div>`;
    if (body) wrap.querySelector('.sf_pop_body').append(body);
    else wrap.querySelector('.sf_pop_body').remove();
    const btns = wrap.querySelector('.sf_pop_btns');
    let closed = false;
    const close = () => {
        if (closed) return;
        closed = true; openCount--;
        wrap.remove();
        onClose?.();
    };
    for (const b of buttons || [{ label: '닫기', primary: true }]) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `sf_btn${b.primary ? ' sf_primary' : ''}`;
        el.textContent = b.label;
        el.addEventListener('click', () => { if (b.onClick?.() === false) return; close(); });
        btns.append(el);
    }
    wrap.querySelector('.sf_pop_x').addEventListener('click', close);
    wrap.addEventListener('pointerdown', e => { if (e.target === wrap) close(); });
    openCount++;
    root.append(wrap);
    return close;
}

// closes every card (the window is closing)
export function closeCards(root) {
    root.querySelectorAll('.sf_pop_wrap').forEach(el => el.remove());
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
