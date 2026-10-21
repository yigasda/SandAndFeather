// The approved landscape scene is a coordinate system, not a responsive reinterpretation.
// Existing bond controls remain the authority for actions; this view only presents them.
const textMetrics = document.createElement('canvas').getContext('2d');
const base = new URL('../../data/art/ui/lotus/', import.meta.url);
let manifest;
const getManifest = () => manifest ||= fetch(new URL('manifest.json', base)).then(r => {
    if (!r.ok) throw new Error(`Lotus scene: ${r.status}`);
    return r.json();
});
const place = (el, [x, y, right, bottom]) => Object.assign(el.style, {
    left: `${x}px`, top: `${y}px`, width: `${right - x}px`, height: `${bottom - y}px`,
});
const itemIcons = { blue_lotus: 'icon.lotus', bread: 'icon.cookie', honey: 'icon.honey', dates: 'icon.dates' };
// The generated files include transparent margins. Their alpha>128 bounds reconstruct
// the approved assembly (verified against assembled-bond.png), not a new art crop.
const sourceBounds = { 'window.frame': [8, 7, 1835, 844], 'header.lower-rail': [17, 480, 1579, 503] };

export function lotusBondScene(wrap) {
    const root = wrap.closest('#sf_game'), legacy = wrap.querySelector('.sf_pop');
    const host = document.createElement('div'); host.className = 'sf_lotus_view';
    const scene = document.createElement('div'); scene.className = 'sf_lotus_scene';
    scene.setAttribute('role', 'dialog'); scene.setAttribute('aria-label', '인연과 유대');
    host.append(scene); wrap.append(host);
    let data, model, disposed = false, recordOffset = 0, itemOffset = 0, fontLoad, fontsReady = false;
    const query = matchMedia('(orientation: landscape)');
    function fit() {
        const landscape = root.dataset.uiTheme === 'cozy' && query.matches;
        if (data && landscape && !fontLoad) {
            fontLoad = Promise.all([document.fonts.load('400 28px "SF Lotus Noto"'), document.fonts.load('700 32px "SF Lotus Noto"')])
                .then(() => { if (!disposed) { fontsReady = true; render(); fit(); } }).catch(e => console.error(e));
        }
        const enabled = !!data && fontsReady && landscape;
        wrap.classList.toggle('sf_lotus_exact', enabled);
        host.hidden = !enabled; legacy.inert = enabled;
        if (!enabled) return;
        const { width, height } = wrap.getBoundingClientRect();
        const [w, h] = data.canvas_size, scale = Math.min(width / w, height / h);
        scene.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    const resize = new ResizeObserver(fit); resize.observe(wrap);
    const theme = new MutationObserver(fit); theme.observe(root, { attributes: true, attributeFilter: ['data-ui-theme'] });
    query.addEventListener('change', fit);
    getManifest().then(m => { if (!disposed) { data = m; render(); fit(); } }).catch(e => {
        if (!disposed) { host.remove(); console.error(e); }
    });
    function render() {
        if (!data || !model || disposed) return;
        const focus = scene.contains(document.activeElement) ? document.activeElement.dataset.action : null;
        scene.replaceChildren();
        const asset = id => data.assets.find(a => a.id === id);
        const boxes = id => data.placements.filter(p => (p.id || p.asset_id) === id).map(p => p.bbox);
        const ties = model.ties.slice(recordOffset, recordOffset + 3);
        const slots = model.slots.slice(itemOffset, itemOffset + 4);
        const iconIds = ['icon.lotus', 'icon.cookie', 'icon.honey', 'icon.dates'];
        let rewardIndex = 0;
        for (const [index, p] of data.placements.entries()) {
            let id = p.asset_id, box = [...p.bbox], source;
            if (id.startsWith('tab.')) {
                const selected = id.startsWith('tab.selected');
                if (model.who === 'horus') id = id.replace(selected ? 'selected' : 'neutral', selected ? 'neutral' : 'selected');
            }
            if (/^game\.3[456]-reward/.test(id)) {
                const live = model.stages[rewardIndex++]?.querySelector('img')?.src.split('/').pop()?.replace(/\.png$/, '');
                if (asset(live)) id = live;
            }
            if (iconIds.includes(id)) {
                const slot = slots[iconIds.indexOf(id)];
                if (!slot) continue;
                id = itemIcons[slot.dataset.bondItem];
                // Other inventory items retain their own game identity and artwork.
                if (!id) source = slot.querySelector('img')?.src;
                if (!id && !source) continue;
            }
            if (id === 'gauge.pink') box[2] = box[0] + 101 / 12 * Math.max(0, Math.min(100, model.pts));
            const nineSlice = p.nine_slice || (p.asset_id.startsWith('slot.fishing-style.') ? 16 : 0);
            const crop = sourceBounds[id];
            const el = document.createElement(nineSlice || crop ? 'div' : 'img');
            el.className = 'sf_lotus_layer'; el.dataset.asset = id || 'game-item'; el.dataset.layer = index;
            el.setAttribute('aria-hidden', 'true'); place(el, box);
            const url = source || new URL(asset(id).file.replace(/^assets\//, ''), base).href;
            if (nineSlice) {
                // Identical source slices and destination borders keep paired layers aligned.
                el.style.border = `${nineSlice}px solid transparent`;
                el.style.borderImage = `url("${url}") ${nineSlice} fill stretch`;
            } else if (crop) {
                const img = document.createElement('img'), [x, y, r, b] = crop, [nw, nh] = asset(id).native_size;
                const sx = (box[2] - box[0]) / (r - x), sy = (box[3] - box[1]) / (b - y);
                el.style.overflow = 'hidden'; img.src = url; img.alt = ''; img.draggable = false;
                img.style.cssText = `position:absolute;max-width:none;width:${nw * sx}px;height:${nh * sy}px;left:${-x * sx}px;top:${-y * sy}px;image-rendering:auto;`;
                el.append(img);
            } else {
                el.src = url; el.alt = ''; el.draggable = false;
                if (p.fit === 'contain' || id?.startsWith('game.') || source) { el.style.objectFit = 'contain'; el.style.imageRendering = 'auto'; }
            }
            scene.append(el);
        }
        for (const [i, t] of data.text.entries()) {
            let text = t.text;
            if (i >= 7 && i <= 12) {
                const tie = ties[Math.floor((i - 7) / 2)];
                text = tie ? (i % 2 ? [tie.when, tie.where].filter(Boolean).join(' · ') : tie.summary || tie.title || '') : '';
            }
            if (i === 13) text = `${model.pts} / 100`;
            if (i >= 19 && i <= 22) text = slots[i - 19]?.querySelector('.sf_bond_count')?.textContent || '';
            const el = document.createElement('span'); el.className = 'sf_lotus_text'; el.dataset.text = i;
            el.textContent = text; el.title = text; place(el, t.bbox);
            el.style.fontSize = `${t.size}px`; el.style.fontWeight = t.font.includes('bold') ? '700' : '400';
            // Center the actual ink in the approved text box, rather than the font's
            // ascender/descender line box (which shifts Korean glyphs down several pixels).
            const ctx = textMetrics;
            ctx.font = `${el.style.fontWeight} ${t.size}px "SF Lotus Noto", sans-serif`;
            const metrics = ctx.measureText(text);
            const leading = metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent + metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent;
            if (Number.isFinite(leading)) el.style.paddingBottom = `${Math.max(0, leading)}px`;
            // Ink colors recovered from the approved assembly's text-only difference.
            el.style.color = i === 0 ? '#fff9e9' : i === 30 ? '#fff4e2'
                : i === 23 || (i === 1 && model.who === 'set') || (i === 2 && model.who === 'horus') ? '#fffced'
                : i === 29 ? '#9b6b3d' : [7, 9, 11].includes(i) ? '#805c33' : '#2c2116';
            if (i >= 19 && i <= 22 && metrics.width > t.bbox[2] - t.bbox[0]) {
                el.style.fontSize = `${t.size * (t.bbox[2] - t.bbox[0]) / metrics.width}px`;
            }
            if ([1, 2, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30].includes(i)) el.style.justifyContent = 'center';
            // Approved bright-label shadow: reference reconstruction matches at (1,2), #3c321f.
            if ((i === 1 && model.who === 'set') || i === 23 || i === 30) el.style.textShadow = '1px 2px 0 #3c321f';
            // Compensate browser ink rounding inside the unchanged approved text boxes.
            if ([3, 5, 6, 26].includes(i)) el.style.paddingBottom = `${Math.max(0, leading) + 2}px`;
            scene.append(el);
        }
        function hit(key, label, box, action, target) {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'sf_lotus_hit';
            b.dataset.action = key; b.setAttribute('aria-label', label); b.title = label; place(b, box);
            b.disabled = !!target?.disabled;
            if (target?.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', target.getAttribute('aria-pressed'));
            b.addEventListener('click', () => { if (!b.disabled) action(); }); scene.append(b); return b;
        }
        for (const [i, who] of ['set', 'horus'].entries()) {
            const target = model.tabs[i];
            hit(who, target.textContent, boxes(i ? 'tab.neutral.frame' : 'tab.selected.frame')[0], () => target.click(), target);
        }
        slots.forEach((target, i) => {
            const b = hit(`item-${target.dataset.bondItem}`, target.getAttribute('aria-label'), boxes('slot.fishing-style.frame')[i], () => target.click(), target);
            b.addEventListener('keydown', e => {
                if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                e.preventDefault();
                const next = model.slots[itemOffset + i + (e.key === 'ArrowRight' ? 1 : -1)];
                next?.click();
                if (next) scene.querySelector(`[data-action="item-${next.dataset.bondItem}"]`)?.focus();
            });
        });
        hit('gift', '선물하기', boxes('button.gift.frame')[0], () => model.gift.click(), model.gift);
        ['fishing', 'cooking', 'books', 'explore'].forEach((id, i) => hit(id, ['낚시', '요리', '공부', '탐험'][i], boxes(`activity.${id}.frame`)[0], () => model.activities[i].click()));
        hit('source', '원문 · 관리', boxes('button.source.frame')[0], () => model.manage());
        ties.forEach((tie, i) => hit(`record-${i}`, `${tie.when || ''} ${tie.summary || tie.title || '원문 · 관리'}`, boxes(`panel.record${i + 1}.frame`)[0], () => model.manage(recordOffset + i)));
        hit('memory', '추억 수첩', boxes('button.notebook.frame')[0], () => model.memory.click());
        ['world', 'party', 'bond', 'quests', 'map'].forEach((tab, i) => {
            const target = wrap.querySelector(`[data-menu-tab="${tab}"]`);
            hit(`nav-${tab}`, target?.getAttribute('aria-label') || tab, boxes(`nav.${['home', 'heart', 'rings', 'scroll', 'map'][i]}.frame`)[0], () => target ? target.click() : root.dispatchEvent(new CustomEvent('sf:navigate', { detail: tab })));
        });
        hit('close', '닫기', boxes('nav.close.frame')[0], () => wrap.sfClose());
        const rewards = data.placements.filter(p => /^game\.3[456]-reward/.test(p.asset_id));
        rewards.forEach((p, i) => hit(`reward-${i}`, model.stages[i].getAttribute('aria-label'), [p.bbox[0], p.bbox[1], p.bbox[2], 371], () => model.stages[i].click()));
        // Paging uses existing regions; no extra design elements or fabricated records.
        const records = scene.querySelector('[data-action="source"]');
        records.addEventListener('keydown', e => {
            if (e.key !== 'PageDown' && e.key !== 'PageUp') return;
            e.preventDefault(); recordOffset = Math.max(0, Math.min(model.ties.length - 3, recordOffset + (e.key === 'PageDown' ? 3 : -3))); render();
        });
        scene.onwheel = e => {
            const rect = scene.getBoundingClientRect(), x = (e.clientX - rect.left) * 1842 / rect.width, y = (e.clientY - rect.top) * 854 / rect.height;
            if (x < 710 && y > 272 && y < 710 && model.ties.length > 3) {
                e.preventDefault(); recordOffset = Math.max(0, Math.min(model.ties.length - 3, recordOffset + Math.sign(e.deltaY))); render();
            } else if (x >= 773 && x <= 1443 && y >= 450 && y <= 572 && model.slots.length > 4) {
                e.preventDefault(); itemOffset = Math.max(0, Math.min(model.slots.length - 4, itemOffset + Math.sign(e.deltaY || e.deltaX))); render();
            }
        };
        let touchStart;
        scene.onpointerdown = e => { if (e.pointerType === 'touch') touchStart = { x: e.clientX, y: e.clientY }; };
        scene.onpointerup = e => {
            if (!touchStart) return;
            const start = touchStart; touchStart = null;
            const dx = start.x - e.clientX, dy = start.y - e.clientY;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
            const rect = scene.getBoundingClientRect(), x = (start.x - rect.left) * 1842 / rect.width, y = (start.y - rect.top) * 854 / rect.height;
            if (x >= 773 && x <= 1443 && y >= 450 && y <= 572 && model.slots.length > 4) {
                e.preventDefault(); itemOffset = Math.max(0, Math.min(model.slots.length - 4, itemOffset + Math.sign(dx))); render();
            } else if (x < 710 && y > 272 && y < 710 && model.ties.length > 3) {
                e.preventDefault(); recordOffset = Math.max(0, Math.min(model.ties.length - 3, recordOffset + Math.sign(dy))); render();
            }
        };
        if (focus) [...scene.querySelectorAll('[data-action]')].find(e => e.dataset.action === focus)?.focus({ preventScroll: true });
    }
    return {
        update(next) {
            if (model?.who !== next.who) recordOffset = itemOffset = 0;
            model = next;
            recordOffset = Math.max(0, Math.min(recordOffset, model.ties.length - 3));
            itemOffset = Math.max(0, Math.min(itemOffset, model.slots.length - 4));
            const selected = model.slots.findIndex(e => e.getAttribute('aria-pressed') === 'true');
            if (selected >= 0 && (selected < itemOffset || selected >= itemOffset + 4)) itemOffset = Math.max(0, selected - 3);
            render(); fit();
        },
        dispose() { disposed = true; resize.disconnect(); theme.disconnect(); query.removeEventListener('change', fit); host.remove(); legacy.inert = false; },
    };
}
