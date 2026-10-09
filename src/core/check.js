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
    const known = (file, where, id) => { if (id && !items[id]) bad(file, `${where}: ${id}가 items.json에 없어`); };
    for (const id of DATA.market?.sells || []) known('market.json', '파는 것', id);
    for (const r of DATA.recipes?.recipes || []) { known('recipes.json', '요리', r.id); for (const n of r.needs || []) known('recipes.json', `${r.id} 재료`, n.id); }
    for (const w of DATA.works?.works || []) for (const id of Object.keys(w.needs || {})) known('works.json', w.id, id);
    for (const id of [...(DATA.duat?.relics || []), ...(DATA.duat?.materials || [])]) known('duat.json', '보상', id);
    for (const e of DATA.duat?.events || []) { known('duat.json', e.id, e.a?.loot); known('duat.json', e.id, e.b?.loot); }
    for (const id of DATA.adventures?.finds || []) known('adventures.json', 'finds', id);
    for (const f of DATA.festivals?.festivals || []) {
        if (!(f.month >= 0 && f.month <= 12 && f.day >= 1 && f.day <= 30)) bad('festivals.json', `${f.id}: month는 0~12, day는 1~30`);
        for (const pr of f.preps || []) for (const id of Object.keys(pr.need?.items || {})) known('festivals.json', `${f.id} ${pr.id}`, id);
    }
    for (const n of DATA.festivals?.nights || []) known('festivals.json', 'nights', n.give);
    for (const [id, it] of Object.entries(items)) if (it.grow) known('items.json', `${id} 수확물`, it.grow.gives);
    for (const [id, m] of Object.entries(DATA.maps)) {
        const file = `maps/${id}.json`;
        const w = m.rows?.[0]?.length;
        if (!w) { bad(file, 'rows가 비어 있어'); continue; }
        m.rows.forEach((r, k) => { if (r.length !== w) bad(file, `rows ${k + 1}번째 줄 길이가 ${r.length}, 첫 줄은 ${w}`); });
        const unknown = new Set(m.rows.join('').split('').filter(c => !m.legend[c]));
        if (unknown.size) bad(file, `legend에 없는 글자: ${[...unknown].join(' ')}`);
        for (const sp of m.spots || []) if (!(sp.x >= 0 && sp.y >= 0 && sp.x < w && sp.y < m.rows.length)) bad(file, `장소 ${sp.id}: 지도 밖에 있어`);
        for (const n of m.npcs || []) if (n.talk && !n.en) bad(file, `사람 ${n.id}: 말을 걸려면 en 이름이 있어야 해`);
        const walk = (x, y) => m.legend[m.rows[y]?.[x]] && !m.legend[m.rows[y][x]].solid;
        for (const a of m.anchors || []) if (!walk(a.x, a.y)) bad(file, `지점 ${a.id}: 걸을 수 없는 칸에 있어`);
        for (const sc of m.secrets || []) if (sc.give) known(file, `비밀 ${sc.id}`, sc.give);
    }
    return out;
}
