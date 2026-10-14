// 생활 그림을 게임에서 쓰기 (0.9.70, 메인1 채택본): a feeling shown for a moment by whoever walks in front and the one
// walking with her (기쁨 ♪ · 놀람 ! · 쑥스러움 ♥), and a short busy pose (요리, 읽기) with its effects. Only on the open map;
// someone sitting or lying down keeps that pose. Without a picture for that person the bubble shows alone.

import { on } from '../../core/bus.js';
import { DATA } from '../../core/data.js';
import { withOf } from '../../core/heroes.js';
import { getState } from '../../core/state.js';
import { gameMode } from '../../ui/window.js';
import { showFx } from '../../world/fx.js';
import { matePose, player, showPose } from '../../world/player.js';

export const hasAct = (who, name, dir) => !!DATA.sprites?.looks?.[who]?.motion?.acts?.[name]?.[dir];
const BUBBLE = { happy: 'bubble-music', surprised: 'bubble-exclaim', shy: 'bubble-heart' };

// kind: happy | surprised | shy. lead / mate: who shows it ('only' one of them with lead: false or mate: false)
export function feel(kind, { lead = true, mate = true, ms = 1800 } = {}) {
    if (gameMode() !== 'open') return;
    if (lead && !player.seat) {
        if (hasAct(player.look, kind, 'down')) { showPose(kind, 'down', { ms }); if (kind === 'happy') player.act.hop = performance.now(); }
        showFx(BUBBLE[kind], { who: 'lead', ms, size: 1.1, key: 'feel-lead' });
    }
    const m = withOf(getState());
    if (mate && m && !player.mate) {
        if (hasAct(m, kind, 'down')) matePose(kind, 'down', ms);
        showFx(BUBBLE[kind], { who: 'mate', ms, size: 1.1, key: 'feel-mate' });
    }
}

// a short pose of her own (요리 'cook' facing up, 읽기 'read' facing the viewer) with effects; false when she has none
export function busyPose(name, dir, { ms = 2200, bob = 0, fx = [] } = {}) {
    if (gameMode() !== 'open' || player.seat) return false;
    const has = hasAct(player.look, name, dir);
    if (has) showPose(name, dir, { ms, bob });
    for (const [k, f] of fx.entries()) showFx(f.name, { who: 'lead', ms, key: `busy-${k}`, ...f });   // again: replaces, never stacks
    return has;
}

// 모험 등급이 오르면 기뻐한다
on('stats:changed', ({ rankUp } = {}) => { if (rankUp) feel('happy'); });

