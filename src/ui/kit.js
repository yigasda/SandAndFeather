// Small building blocks for the cards packs show: a list of rows with buttons, a line of chips.
//   list([{ icon, name, sub, buttons: [{ label, onClick, disabled, primary }] }]) → element

export function list(rows, empty = '') {
    const box = document.createElement('div');
    box.className = 'sf_list';
    if (!rows.length && empty) { box.innerHTML = '<div class="sf_note"></div>'; box.firstChild.textContent = empty; return box; }
    for (const r of rows) {
        const row = document.createElement('div');
        row.className = `sf_list_row${r.dim ? ' sf_dim' : ''}`;
        row.innerHTML = '<span class="sf_list_icon"></span><span class="sf_list_main"><b></b><small></small></span><span class="sf_list_btns"></span>';
        row.querySelector('.sf_list_icon').textContent = r.icon || '';
        row.querySelector('b').textContent = r.name || '';
        row.querySelector('small').textContent = r.sub || '';
        for (const b of r.buttons || []) {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = `sf_btn sf_small${b.primary ? ' sf_primary' : ''}`;
            el.textContent = b.label;
            el.disabled = !!b.disabled;
            el.addEventListener('click', e => { e.stopPropagation(); b.onClick?.(); });
            row.querySelector('.sf_list_btns').append(el);
        }
        box.append(row);
    }
    return box;
}

export function para(text, cls = 'sf_note') {
    const el = document.createElement('div');
    el.className = cls;
    el.textContent = text;
    return el;
}
export function stack(...els) {
    const box = document.createElement('div');
    box.className = 'sf_stack';
    for (const e of els) if (e) box.append(e);
    return box;
}
// a bar 0..1 with a label: "체력 8/12"
export function bar(label, frac, cls = '') {
    const el = document.createElement('div');
    el.className = `sf_bar ${cls}`;
    el.innerHTML = '<span></span><i><b></b></i>';
    el.querySelector('span').textContent = label;
    el.querySelector('b').style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
    return el;
}
