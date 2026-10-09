// Looks over data/*.json after loading and lists what is wrong, in Korean, by file and entry,
// so a hand edit that breaks something says where instead of failing quietly.

import { DATA } from './data.js';

export function checkData() {
    const out = [];
    const bad = (file, what) => out.push(`data/${file} · ${what}`);
    const items = DATA.items?.items || {};
    for (const [id, it] of Object.entries(items)) {
        if (!it.ko || !it.en) bad('items.json', `${id}: ko와 en 이름이 다 있어야 해`);
        if (it.open?.gives && !items[it.open.gives]) bad('items.json', `${id}: 열면 나오는 ${it.open.gives}가 목록에 없어`);
    }
    const parts = new Set((DATA.calendar?.parts || []).map(p => p.id));
    const seasons = new Set(Object.keys(DATA.calendar?.seasons || {}));
    for (const [where, list] of Object.entries(DATA.finds || {})) {
        if (where.startsWith('_')) continue;
        if (!Array.isArray(list)) { bad('finds.json', `${where}: 목록이어야 해`); continue; }
        list.forEach((f, k) => {
            const tag = `${where} ${k + 1}번째`;
            if (!items[f.item]) bad('finds.json', `${tag}: ${f.item}가 items.json에 없어`);
            if (!(Number(f.weight) > 0)) bad('finds.json', `${tag}: weight는 0보다 큰 숫자`);
            for (const p of f.parts || []) if (!parts.has(p)) bad('finds.json', `${tag}: 시간대 ${p}는 없어. ${[...parts].join(', ')} 중에서`);
            for (const s of f.seasons || []) if (!seasons.has(s)) bad('finds.json', `${tag}: 계절 ${s}는 없어. ${[...seasons].join(', ')} 중에서`);
        });
    }
    for (const [id, m] of Object.entries(DATA.maps)) {
        const file = `maps/${id}.json`;
        const w = m.rows?.[0]?.length;
        if (!w) { bad(file, 'rows가 비어 있어'); continue; }
        m.rows.forEach((r, k) => { if (r.length !== w) bad(file, `rows ${k + 1}번째 줄 길이가 ${r.length}, 첫 줄은 ${w}`); });
        const unknown = new Set(m.rows.join('').split('').filter(c => !m.legend[c]));
        if (unknown.size) bad(file, `legend에 없는 글자: ${[...unknown].join(' ')}`);
        for (const sp of m.spots || []) if (!(sp.x >= 0 && sp.y >= 0 && sp.x < w && sp.y < m.rows.length)) bad(file, `장소 ${sp.id}: 지도 밖에 있어`);
        for (const n of m.npcs || []) if (n.talk && !n.en) bad(file, `사람 ${n.id}: 말을 걸려면 en 이름이 있어야 해`);
    }
    return out;
}
