// 모래 아래 잠든 보물 on the maps (core/treasure.js keeps the rules): the sandstone wall's mark in the fallen temple
// (the stone clue), and, with all four clues, a glint in the sand where it lies. Digging it up shows its own card:
// the gold chest (the approved 인연과 유대 chest picture) shakes and opens into light, the rare relic comes up large,
// then the deben, the gold ornament and the 업적 one after another. No new pictures: item icons and UI parts only.

import { itemInfo } from '../../core/bag.js';
import { DATA } from '../../core/data.js';
import { achievement } from '../../core/achieve.js';
import { TREASURE, clueFound, digTreasure, hasClue, isFound, ready, started } from '../../core/treasure.js';
import { getState, saveState } from '../../core/state.js';
import { itemArt } from '../../ui/itemart.js';
import { addThings } from '../../world/things.js';

const CHEST = new URL('../../../data/art/ui/bond/redrawn/36-reward-chest.png', import.meta.url).href;
const anchorOf = (map, id) => (map?.anchors || []).find(a => a.id === id) || null;

// the stone clue: the same mark carved on the fallen temple's sandstone, there once the scrap is read
addThings((mapId, s) => {
    const T = TREASURE();
    if (mapId !== T.map || !started(s) || isFound(s) || hasClue(s, 'stone')) return [];
    const a = anchorOf(DATA.maps[mapId], T.stoneAnchor);
    return a ? [{ id: 'treasure:stone', x: a.x, y: a.y, label: '사암벽의 표시', sprite: 'mural', pose: 'interact', act: async ui => {
        const st = getState(), c = clueFound(st, 'stone');
        if (!c) return;
        await saveState();
        ui.showCard({ tag: '보물지도', title: `단서 「${c.ko}」`, text: `${c.text}\n지도 → 탐사 수첩에서 모은 단서를 볼 수 있어.` });
    } }] : [];
});

// with all four: a glint where it lies
addThings((mapId, s) => {
    const T = TREASURE();
    if (mapId !== T.map || !ready(s)) return [];
    const a = anchorOf(DATA.maps[mapId], T.anchor);
    return a ? [{ id: 'treasure:dig', x: a.x, y: a.y, label: '반짝이는 모래', sprite: 'sparkle', pose: 'pickup', act: ui => { dig(ui); } }] : [];
});

let digging = false;
async function dig(ui) {
    if (digging) return;
    digging = true;
    try {
        const s = getState(), got = digTreasure(s);
        if (!got) return;
        await saveState();
        treasureCard(ui, got);
    } finally { digging = false; }
}

export function treasureCard(ui, got) {
    const T = TREASURE(), a = achievement('treasure');
    const relicId = Object.keys(got.relic || {})[0], relicN = got.relic?.[relicId] || 1;
    const box = document.createElement('div');
    box.className = 'sf_treasure';
    const stage = document.createElement('div'); stage.className = 'sf_treasure_stage';
    const chest = document.createElement('img'); chest.className = 'sf_treasure_chest'; chest.src = CHEST; chest.alt = '';
    const burst = document.createElement('i'); burst.className = 'sf_treasure_burst';
    const relic = document.createElement('div'); relic.className = 'sf_treasure_relic';
    if (relicId) relic.append(itemArt(relicId, 'sf_treasure_art'));
    stage.append(burst, chest, relic);
    const name = document.createElement('p'); name.className = 'sf_treasure_name';
    name.textContent = relicId ? `${itemInfo(relicId)?.ko}${relicN > 1 ? ` ×${relicN}` : ''}` : '';
    const sub = document.createElement('p'); sub.className = 'sf_treasure_sub';
    sub.textContent = relicId && T.relics?.includes(relicId) ? '도감에 없던 희귀 유물' : '희귀 유물 다섯을 이미 다 알아서, 대신 별 조각';
    const rewards = document.createElement('ul'); rewards.className = 'sf_treasure_rewards';
    const row = (k, icon, text) => { const li = document.createElement('li'); li.style.setProperty('--d', k); if (typeof icon === 'string') { const i = document.createElement('span'); i.className = 'sf_treasure_glyph'; i.textContent = icon; li.append(i); } else li.append(icon); li.append(text); rewards.append(li); };
    row(0, '🪙', `데벤 ${got.deben}`);
    let k = 1;
    for (const [id, n] of Object.entries(got.gives || {})) row(k++, itemArt(id, 'sf_treasure_small'), `${itemInfo(id)?.ko}${n > 1 ? ` ×${n}` : ''}`);
    row(k++, '🏅', `업적 「${a?.ko || '숨겨진 길의 발견자'}」 · 칭호 해금`);
    const note = document.createElement('p'); note.className = 'sf_note sf_treasure_note';
    note.textContent = '임무 → 업적에서 칭호를 달 수 있어. 이 발견은 일지와 탐사 수첩에 남았어.';
    box.append(stage, name, sub, rewards, note);
    ui.showCard({ tag: '보물 발견', title: T.ko || '보물', kind: 'treasure', body: box, buttons: [{ label: '가방에 넣기', primary: true }] });
}
