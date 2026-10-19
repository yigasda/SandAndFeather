// The puzzles' fixed data, pure (no state, no drawing), so tools/st-test/puzzle-optics.mjs can check them in node.

// 15 열주홀 반사광 입문 (colonnade.js): the hall flat from above, 100 × 60, x as in the approved picture (art x / 1774 × 100)
export const COLONNADE_OPTICS = {
    source: { x: 86, y: 40, dx: -1, dy: 0 },
    mirrors: [{ id: 'm1', x: 70.4, y: 40, half: 4.2, angles: [135, 0, 45, 90] }],
    receivers: [{ id: 'r1', x: 70.4, y: 8.5, r: 3.4 }],
    // the room's edges and the two column bases on the terrace (left of the light's way)
    walls: [[2, 3, 98, 3], [98, 3, 98, 58], [98, 58, 2, 58], [2, 58, 2, 3],
        [31.5, 6, 36.5, 6], [36.5, 6, 36.5, 13], [36.5, 13, 31.5, 13], [31.5, 13, 31.5, 6],
        [51.5, 6, 56.5, 6], [56.5, 6, 56.5, 13], [56.5, 13, 51.5, 13], [51.5, 13, 51.5, 6]],
};
// where the light ends for each position of the mirror m1 (/ — \ |): the only answer is 2 (\), checked by the test
export const COLONNADE_ANSWERS = { 0: 'wall', 1: 'wall', 2: 'r1', 3: 'wall' };
