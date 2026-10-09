// 도감: what Somang has come across, kind by kind. A thing never had shows as a question mark; tapping a known one
// shows what it is and the day it first came. Secrets count per map.

import { itemInfo } from '../core/bag.js';
import { dateLabel, fromDayNumber } from '../core/clock.js';
import { DATA } from '../core/data.js';
import { getState } from '../core/state.js';
import { para, stack } from './kit.js';

const KINDS = [['fish', '물고기'], ['food', '요리'], ['crop', '작물'], ['find', '발견한 물건'], ['relic', '유물'], ['record', '기록']];

export function codexCard(ui, onClose = null) {
    const s = getState();
    const all = DATA.items?.items || {};
    const had = s.codex.items || {};
    const detail = para('', 'sf_pop_text sf_codex_detail');
    const show = (title, text) => { detail.textContent = `${title}\n${text}`; };
    const grid = (entries, known, icon, about) => {
        const g = document.createElement('div');
        g.className = 'sf_codex_grid';
        for (const [id, x] of entries) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `sf_codex_cell${known(id) ? '' : ' sf_dim'}`;
            b.textContent = known(id) ? icon(x) : '?';
            b.title = known(id) ? x.ko : '아직 몰라';
            b.addEventListener('click', () => show(known(id) ? x.ko : '아직 몰라', known(id) ? about(id, x) : '아직 만나지 못했어.'));
            g.append(b);
        }
        return g;
    };
    const first = n => (n >= 0 ? `처음: ${dateLabel(fromDayNumber(n))}` : '');
    const parts = [];
    let got = 0, total = 0;
    for (const [kind, ko] of KINDS) {
        const list = Object.entries(all).filter(([, x]) => x.kind === kind);
        if (!list.length) continue;
        const n = list.filter(([id]) => id in had).length;
        got += n; total += list.length;
        parts.push(para(`${ko} ${n}/${list.length}`, 'sf_sub_head'),
            grid(list, id => id in had, x => x.icon || '·', (id, x) => [x.about, first(had[id])].filter(Boolean).join('\n')));
    }
    const secrets = Object.values(DATA.maps).flatMap(m => (m.secrets || []).map(sec => [sec.id, { ...sec, map: m.name }]));
    if (secrets.length) {
        const found = s.codex.secrets || {};
        const n = secrets.filter(([id]) => id in found).length;
        got += n; total += secrets.length;
        parts.push(para(`비밀 ${n}/${secrets.length}`, 'sf_sub_head'),
            grid(secrets, id => id in found, () => '✦', (id, x) => [x.map ? `${x.map} · ${x.text}` : x.text, first(found[id])].filter(Boolean).join('\n')));
    }
    ui.showCard({ tag: `${got}/${total}`, title: '도감', wide: true, onClose,
        body: stack(para('얻어 본 것과 찾은 비밀이 채워져. 칸을 누르면 설명이 나와.'), detail, ...parts) });
}
