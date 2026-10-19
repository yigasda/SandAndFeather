// The puzzle screen (user: "레이튼 교수처럼"): a device on the map opens its puzzle large on a card over the map, closing
// it is back on the map where she stood. It is a card (ui/popups.js), so while it is open she does not move, the
// map's things are not used and packs that run every frame (the field fights) wait (window.js frame: cardOpen()).
// Only for puzzles of handling (mirrors, glyphs); puzzles of walking (carrying stones, plates) stay on the map.
//   openPuzzle(ui, def) — def: { id, title, version, start: { mirrorId: index }, draw(g, W, H, state, result),
//   tap(x, y, state) → changed?, solvedBy(result) → bool }. The handling (orient) is saved per chat in s.puzzles[id]
//   at every turn, so closing halfway and coming back goes on from there; 처음으로 puts back only the handling.

import { today } from '../../core/ledger.js';
import { getState, saveState } from '../../core/state.js';
import { ctx } from '../../core/st.js';
import { trace } from './optics.js';

// the saved state of one puzzle in this chat (made on first use)
export function puzzleState(s, def) {
    s.puzzles ||= {};
    let p = s.puzzles[def.id];
    // a definition newer than the saved handling: the handling starts again, what was won stays
    if (!p || p.v !== def.version) p = s.puzzles[def.id] = { v: def.version, orient: { ...def.start }, solvedEver: p?.solvedEver || false, solvedDay: p?.solvedDay ?? null, claimed: p?.claimed || {} };
    return p;
}
export const lightOf = (def, p) => trace(def.optics, p.orient);
// what the map shows without making a record (being near is not playing)
export const savedOrient = (s, def) => (s.puzzles?.[def.id]?.v === def.version ? s.puzzles[def.id].orient : def.start);

export function openPuzzle(ui, def, onChange) {
    const s = getState(), chat = ctx().chatId;
    if (!s) return;
    const p = puzzleState(s, def);
    let close = () => {};
    // a touch from a screen opened in another chat (the chat changed under it): ignored, the screen closes
    const mine = () => { if (ctx().chatId === chat && getState() === s) return true; close(); return false; };
    const box = document.createElement('div');
    box.className = 'sf_puzzle';
    box.innerHTML = `<canvas class="sf_puzzle_cv" aria-label="${def.title}"></canvas><div class="sf_puzzle_say" aria-live="polite"></div>`;
    const cv = box.querySelector('canvas'), say = box.querySelector('.sf_puzzle_say');
    const paint = () => {
        const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
        const g = cv.getContext('2d'), res = lightOf(def, p);
        g.setTransform(cv.width / def.size[0], 0, 0, cv.height / def.size[1], 0, 0);
        def.draw(g, def.size[0], def.size[1], p, res);
        say.textContent = def.status(p, res);
    };
    const turn = async changed => {
        if (!changed || !mine()) return;
        p.rev = (p.rev || 0) + 1;
        const res = lightOf(def, p);
        if (def.solvedBy(res) && !p.solvedEver) { p.solvedEver = true; p.solvedDay = today(s); }
        paint();
        await saveState();
        onChange?.(p, res);
    };
    // a touch or click on the picture: the puzzle's own coordinates
    cv.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const r = cv.getBoundingClientRect();
        if (mine()) turn(def.tap((e.clientX - r.left) / r.width * def.size[0], (e.clientY - r.top) / r.height * def.size[1], p));
    });
    close = ui.showCard({ tag: '퍼즐', title: def.title, body: box, wide: true, kind: 'puzzle', modal: true,
        buttons: [...(def.buttons?.(p, changed => turn(changed), mine) || []),
            { label: '처음으로', onClick: () => { if (mine()) { p.orient = { ...def.start }; turn(true); } return false; } },
            { label: '닫기', primary: true }],
        onClose: () => onChange?.(p, lightOf(def, p)) });
    requestAnimationFrame(paint);
}
