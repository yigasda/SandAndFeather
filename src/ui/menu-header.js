import { attachLotusMenu } from './lotus-menu.js';

// Runtime adaptation of the approved original10 handoff (3d68d03c).
// Original header ornaments keep their proportions; only plain connecting strips stretch.
const HEADERS = { classic:[770,96,32,738,360,410], walnut:[797,89,60,770,150,775], journal:[799,84,85,714,355,445], temple:[756,91,195,560,222,535], cozy:[804,84,40,700,360,444] };
const FIT = {"cozy":{"world":{"size":"26.551724137931032px 25.034482758620687px","position":"3.965517241379312px 2.2413793103448274px","visible":[25.034482758620687,22.0]},"party":{"size":"38.72px 29.04px","position":"-0.9200000000000013px 0.3599999999999999px","visible":[32.56,22.0]},"quests":{"size":"23.517241379310345px 25.034482758620687px","position":"6.241379310344827px 2.2413793103448274px","visible":[20.482758620689655,22.0]},"map":{"size":"29.333333333333332px 26.888888888888886px","position":"2.9259259259259274px 1.3703703703703705px","visible":[26.888888888888886,22.0]},"bond":{"size":"34.95582329317269px 15.975903614457831px","position":"0.4538152610441767px 6.0120481927710845px","visible":[34.0,14.883534136546185]}},"classic":{"world":{"size":"25.666666666666664px 23.466666666666665px","position":"4.800000000000001px 2.2666666666666666px","visible":[22.0,22.0]},"party":{"size":"33.0px 26.714285714285715px","position":"1.892857142857144px 1.4285714285714286px","visible":[29.07142857142857,22.0]},"quests":{"size":"28.285714285714285px 26.714285714285715px","position":"2.2857142857142856px 0.6428571428571428px","visible":[22.0,22.0]},"map":{"size":"29.857142857142858px 26.714285714285715px","position":"3.4642857142857153px 0.6428571428571428px","visible":[25.928571428571427,22.0]},"bond":{"size":"34.95582329317269px 15.975903614457831px","position":"0.4538152610441767px 6.0120481927710845px","visible":[34.0,14.883534136546185]}},"walnut":{"world":{"size":"26.967741935483872px 24.129032258064516px","position":"4.516129032258064px 1.5806451612903225px","visible":[24.129032258064516,22.0]},"party":{"size":"31.777777777777775px 27.703703703703702px","position":"3.7407407407407423px -1.0740740740740735px","visible":[28.518518518518515,22.0]},"quests":{"size":"25.79310344827586px 25.79310344827586px","position":"5.482758620689657px 0.7241379310344831px","visible":[25.034482758620687,22.0]},"map":{"size":"32.214285714285715px 26.714285714285715px","position":"3.4642857142857153px -0.1428571428571428px","visible":[25.928571428571427,22.0]},"bond":{"size":"34.95582329317269px 15.975903614457831px","position":"0.4538152610441767px 6.0120481927710845px","visible":[34.0,14.883534136546185]}},"journal":{"world":{"size":"24.0px 24.0px","position":"6.666666666666668px 2.3333333333333335px","visible":[22.666666666666664,22.0]},"party":{"size":"30.799999999999997px 26.4px","position":"3.333333333333334px 0.8000000000000003px","visible":[29.333333333333332,22.0]},"quests":{"size":"23.41935483870968px 25.548387096774196px","position":"8.064516129032258px 0.870967741935484px","visible":[19.870967741935484,22.0]},"map":{"size":"28.599999999999998px 26.4px","position":"4.066666666666668px 0.8000000000000003px","visible":[24.93333333333333,22.0]},"bond":{"size":"34.95582329317269px 15.975903614457831px","position":"0.4538152610441767px 6.0120481927710845px","visible":[34.0,14.883534136546185]}},"temple":{"world":{"size":"25.79310344827586px 24.275862068965516px","position":"5.103448275862069px 2.2413793103448274px","visible":[22.75862068965517,22.0]},"party":{"size":"34.22222222222222px 26.074074074074073px","position":"2.1111111111111125px 2.185185185185185px","visible":[31.777777777777775,22.0]},"quests":{"size":"24.93333333333333px 23.466666666666665px","position":"7.366666666666667px 2.2666666666666666px","visible":[21.266666666666666,22.0]},"map":{"size":"32.56px 28.16px","position":"2.6px 0.3599999999999999px","visible":[25.52,22.0]},"bond":{"size":"34.95582329317269px 15.975903614457831px","position":"0.4538152610441767px 6.0120481927710845px","visible":[34.0,14.883534136546185]}}};
export function refreshMenuHeaders(root) {
    root?.querySelectorAll('.sf_menu_window').forEach(w => w.sfRefreshMenu?.());
}
export function attachMenuHeader(root, wrap, active) {
    const head = wrap.querySelector('.sf_pop_head'), art = document.createElement('div');
    wrap.classList.add('sf_menu_window');
    art.className = 'sf_menu_header_art'; art.setAttribute('aria-hidden', 'true');
    const current = document.createElement('i'); current.className = 'sf_menu_current'; current.setAttribute('aria-hidden', 'true');
    const nav = document.createElement('nav'); nav.className = 'sf_menu_nav'; nav.setAttribute('aria-label', '게임 메뉴');
    const links = [];
    for (const old of root.querySelectorAll('.sf_tabs [data-tab]')) {
        const id = old.dataset.tab, label = old.querySelector('span').textContent;
        const button = document.createElement('button'), icon = document.createElement('i');
        button.type = 'button'; button.className = 'sf_menu_link'; button.dataset.menuTab = id;
        button.title = label; button.setAttribute('aria-label', label); button.setAttribute('aria-current', id === active ? 'page' : 'false');
        icon.setAttribute('aria-hidden', 'true'); button.append(icon); nav.append(button);
        button.addEventListener('click', () => root.dispatchEvent(new CustomEvent('sf:navigate', { detail: id })));
        links.push({ id, icon, source: old.querySelector('i') });
    }
    head.prepend(art, current); head.append(nav);
    function refresh() {
        const theme = HEADERS[root.dataset.uiTheme] ? root.dataset.uiTheme : 'cozy';
        if (theme === 'cozy') {
            // The adopted PNG pieces own the title band; never load the retired full header.
            for (const name of ['frame','paper','button','button-fill','primary','primary-fill','slot','selected'])
                wrap.style.setProperty('--menu-' + name, `var(--skin-${name})`);
            for (const { icon } of links) icon.style.cssText = '';
            current.style.cssText = ''; art.replaceChildren();
            return;
        }
        for (const name of ['frame','paper','button','button-fill','primary','primary-fill','slot','selected']) {
            const file = name === 'frame' && theme === 'temple' ? 'panel' : name === 'selected' && theme === 'journal' ? 'primary' : name;
            wrap.style.setProperty('--menu-' + name, `url("${new URL(`../../data/art/ui/skins/${theme}/${file}.png`, import.meta.url).href}")`);
        }
        for (const { id, icon, source } of links) {
            const cs = getComputedStyle(source), mask = cs.maskImage !== 'none' ? cs.maskImage : cs.backgroundImage;
            icon.style.maskImage = mask; icon.style.maskSize = FIT[theme][id].size; icon.style.maskPosition = FIT[theme][id].position;
            if (id === active) current.style.maskImage = mask;
        }
        const [w,h,left,right,midL,midR] = HEADERS[theme], scale = 44/h, width = head.getBoundingClientRect().width;
        const source = new URL(`../../data/art/ui/skins/${theme}/header-full.png`, import.meta.url).href;
        const lw = left*scale, rw = (w-right)*scale, mw = (midR-midL)*scale;
        const mx = Math.max(lw, Math.min(width-rw-mw, (theme === 'temple' ? width*310/844 : width/2)-mw/2));
        art.replaceChildren();
        function piece(x, size, sx, sw) {
            const holder = document.createElement('span'), img = document.createElement('img');
            holder.style.cssText = `left:${x}px;width:${Math.max(0,size)}px;`;
            img.src = source; img.alt = ''; img.style.cssText = `width:${w*scale}px;left:${-sx*scale}px;`;
            if (sw) { const k = Math.max(0,size)/(sw*scale); img.style.transformOrigin = '0 0'; img.style.transform = `scaleX(${k})`; img.style.left = `${-sx*scale*k}px`; }
            holder.append(img); art.append(holder);
        }
        piece(0,lw,0);
        if (theme === 'classic' || theme === 'walnut') {
            piece(lw,width-rw-lw,theme === 'walnut' ? 80 : left,8); piece(width-rw,rw,right);
            if (theme === 'walnut') {
                const band = document.createElement('span'), img = document.createElement('img');
                band.style.cssText = `left:${mx}px;top:23px;width:${mw}px;height:${27*scale}px;`;
                img.src = source; img.alt = ''; img.style.cssText = `width:${w*scale}px;left:${-midL*scale}px;top:${-35*scale}px;`;
                band.append(img); art.append(band);
            }
        } else { piece(lw,mx-lw,left,8); piece(mx,mw,midL); piece(mx+mw,width-rw-mx-mw,right-8,8); piece(width-rw,rw,right); }
    }
    wrap.sfRefreshMenu = refresh;
    const observer = new ResizeObserver(refresh); observer.observe(head); refresh();
    const detachLotus = ['party', 'quests', 'map'].includes(active) ? attachLotusMenu(root, wrap, active) : null;
    return () => { detachLotus?.(); observer.disconnect(); delete wrap.sfRefreshMenu; };
}

