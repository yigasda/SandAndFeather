// Landscape-only presentation of the real party, quest and map cards.
// Approved PNGs are reused unchanged. No controls, state, handlers or canvas are copied.
const base = new URL('../../data/art/ui/lotus/', import.meta.url);
let manifest;
const getManifest = () => manifest ||= fetch(new URL('manifest.json', base)).then(r => {
    if (!r.ok) throw new Error(`Lotus menu: ${r.status}`);
    return r.json();
});
const place = (el, [x, y, right, bottom]) => Object.assign(el.style, {
    left: `${x}px`, top: `${y}px`, width: `${right - x}px`, height: `${bottom - y}px`,
});
const navIds = ['home', 'heart', 'rings', 'scroll', 'map'];
const tabIds = ['world', 'party', 'bond', 'quests', 'map'];
// Same transparent-source bounds as the approved bond scene. These are display
// coordinates, not edits to either source PNG.
const sourceBounds = { 'window.frame': [8, 7, 1835, 844], 'header.lower-rail': [17, 480, 1579, 503] };

export function attachLotusMenu(root, wrap, active) {
    const pop = wrap.querySelector('.sf_pop'), body = wrap.querySelector('.sf_pop_body > .sf_stack');
    const art = document.createElement('div');
    art.className = 'sf_lotus_menu_art'; art.setAttribute('aria-hidden', 'true');
    pop.prepend(art);
    wrap.dataset.lotusTab = active;
    const query = matchMedia('(orientation: landscape)');
    let data, loading, disposed = false, originalChildren = null;

    // Temporary layout groups preserve the original nodes and every event binding.
    // Unwrap them on rotation/theme change so the established portrait DOM returns.
    function groupBody() {
        if (!body || originalChildren || active === 'party') return;
        originalChildren = [...body.childNodes];
        const left = document.createElement('div'), right = document.createElement('div');
        left.className = 'sf_lotus_menu_column'; right.className = 'sf_lotus_menu_column';
        if (active === 'map') {
            left.classList.add('sf_lotus_map_canvas'); right.classList.add('sf_lotus_map_details');
            for (const node of originalChildren) (node.matches?.('.sf_bigmap') ? left : right).append(node);
        } else {
            let journal = false;
            for (const node of originalChildren) {
                if (node.matches?.('.sf_sub_head') && /^(챗에서 받은 것|일지)/.test(node.textContent)) journal = true;
                (journal ? right : left).append(node);
            }
        }
        body.append(left, right);
    }
    function ungroupBody() {
        if (!originalChildren) return;
        body.replaceChildren(...originalChildren); originalChildren = null;
    }
    function decorate() {
        if (!wrap.classList.contains('sf_lotus_menu') || !body) return;
        for (const el of body.querySelectorAll('.sf_list_row, .sf_lotus_map_canvas, .sf_lotus_map_details')) {
            if (el.querySelector(':scope > .sf_lotus_surface')) continue;
            const surface = document.createElement('span'); surface.className = 'sf_lotus_surface';
            surface.setAttribute('aria-hidden', 'true');
            for (const part of ['fill', 'frame', 'corner-ornaments']) {
                const piece = document.createElement('span'); piece.dataset.part = part; surface.append(piece);
            }
            el.prepend(surface);
        }
    }
    function draw() {
        const asset = id => data.assets.find(a => a.id === id);
        const url = id => new URL(asset(id).file.replace(/^assets\//, ''), base).href;
        const layer = (id, box, contain = false) => {
            const crop = sourceBounds[id], sliced = id.startsWith('nav.');
            const el = document.createElement(crop || sliced ? 'div' : 'img');
            el.className = 'sf_lotus_menu_layer'; el.dataset.asset = id; place(el, box);
            if (sliced) {
                el.style.boxSizing = 'border-box'; el.style.border = '12px solid transparent';
                el.style.borderImage = `url("${url(id)}") 12 fill stretch`;
            } else if (crop) {
                const img = document.createElement('img'), [x, y, r, b] = crop, [nw, nh] = asset(id).native_size;
                const sx = (box[2] - box[0]) / (r - x), sy = (box[3] - box[1]) / (b - y);
                el.style.overflow = 'hidden'; img.src = url(id); img.alt = ''; img.draggable = false;
                img.style.cssText = `position:absolute;max-width:none;width:${nw * sx}px;height:${nh * sy}px;left:${-x * sx}px;top:${-y * sy}px;image-rendering:auto;`;
                el.append(img);
            } else {
                el.src = url(id); el.alt = ''; el.draggable = false;
                if (contain) el.style.objectFit = 'contain';
            }
            art.append(el);
        };
        for (const p of data.placements) {
            if (/^(body\.background|header\.|window\.frame|nav\.|icon\.(home|heart|rings|scroll|map|close)$|ornament\.header-lotus)/.test(p.asset_id)) {
                let id = p.asset_id, box = p.bbox;
                const match = /^nav\.(home|heart|rings|scroll|map)\.(frame|face-restored)$/.exec(id);
                if (match) {
                    const selected = tabIds[navIds.indexOf(match[1])] === active;
                    id = `nav.${selected ? 'heart' : match[1] === 'heart' ? 'home' : match[1]}.${match[2]}`;
                    box = [p.bbox[0], selected ? 25 : 34, p.bbox[2], selected ? 109 : 102];
                }
                layer(id, box);
            }
        }
        layer({ party: 'icon.heart', quests: 'icon.scroll', map: 'icon.map' }[active], [70, 32, 157, 108], true);
    }
    function fit() {
        if (disposed) return;
        const wanted = root.dataset.uiTheme === 'cozy' && query.matches;
        if (wanted && !loading) {
            loading = Promise.all([getManifest(), document.fonts.load('400 28px "SF Lotus Noto"'), document.fonts.load('700 32px "SF Lotus Noto"')])
                .then(([m]) => { if (!disposed) { data = m; draw(); fit(); } })
                .catch(e => { if (!disposed) console.error(e); });
        }
        const enabled = wanted && !!data;
        wrap.classList.toggle('sf_lotus_menu', enabled);
        if (enabled) {
            groupBody(); decorate();
            const { width, height } = wrap.getBoundingClientRect();
            const scale = Math.min(width / data.canvas_size[0], height / data.canvas_size[1]);
            pop.style.setProperty('--lotus-menu-scale', scale);
        } else {
            body?.querySelectorAll('.sf_lotus_surface').forEach(el => el.remove());
            ungroupBody(); pop.style.removeProperty('--lotus-menu-scale');
        }
    }
    const resize = new ResizeObserver(fit); resize.observe(wrap);
    const theme = new MutationObserver(fit); theme.observe(root, { attributes: true, attributeFilter: ['data-ui-theme'] });
    const content = new MutationObserver(decorate); if (body) content.observe(body, { childList: true, subtree: true });
    query.addEventListener('change', fit); fit();
    return () => {
        disposed = true; resize.disconnect(); theme.disconnect(); content.disconnect(); query.removeEventListener('change', fit);
        body?.querySelectorAll('.sf_lotus_surface').forEach(el => el.remove());
        ungroupBody(); art.remove(); wrap.classList.remove('sf_lotus_menu'); delete wrap.dataset.lotusTab;
        pop.style.removeProperty('--lotus-menu-scale');
    };
}
