// 터치 조이스틱으로 걷기(CDP 터치 → .sf_pad), 검사 스크립트 공용. desert-b1.cjs의 길찾기와 같은 방식: 바닥 0.25칸 격자,
// 캐릭터 발 상자로 막힘 판정(map.solidRect, 움직이는 장치 포함), 50 ms마다 막힘 없이 곧장 닿는 가장 먼 길 점으로 스틱을 민다.
//   const W = require('./touch-walk.cjs')(page, cdp); await W.walkToPoint(x, y)  (타일, 발 기준이 아닌 캐릭터 x, y)
module.exports = (page, cdp) => {
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    const padBox = () => page.evaluate(() => { const r = document.querySelector('.sf_pad').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, lim: r.width / 2 * 0.62 }; });
    const tap = async (x, y) => { await touch('touchStart', x, y); await page.waitForTimeout(60); await touch('touchEnd'); await page.waitForTimeout(250); };
    const tapEl = async (sel, text) => {
        const loc = text ? page.locator(sel, { hasText: text }).first() : page.locator(sel).first();
        const b = await loc.boundingBox(); if (!b) throw new Error('no ' + sel + ' ' + (text || ''));
        await tap(b.x + b.width / 2, b.y + b.height / 2);
    };
    // opts.held: the stick is already down (no new touch: the same thumb goes on from a map change); opts.keep: leave it
    // down at the end. If the map changes on the way it stops there and returns 'map'
    async function walkToPoint(gx, gy, limitMs = 30000, near = 0.3, opts = {}) {
        const route = await page.evaluate(([gx, gy, near]) => {
            const p = T.player.player, m = T.win.currentMap();
            const S = 0.25, free = (x, y) => !m.solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
            const sx = Math.round(p.x / S), sy = Math.round(p.y / S), key = (x, y) => x + ',' + y;
            const prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]]; let end = null;
            if (Math.hypot(sx * S - gx, sy * S - gy) <= near) end = [sx, sy];
            while (q.length && !end) {
                const [x, y] = q.shift();
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    const nx = x + dx, ny = y + dy, k = key(nx, ny);
                    if (prev.has(k) || nx < 0 || ny < 0 || nx * S > m.w || ny * S > m.h) continue;
                    if (!free(nx * S, ny * S) || (dx && dy && (!free(x * S + dx * S, y * S) || !free(x * S, y * S + dy * S)))) continue;
                    prev.set(k, [x, y]);
                    if (Math.hypot(nx * S - gx, ny * S - gy) <= near) { end = [nx, ny]; break; }
                    q.push([nx, ny]);
                }
            }
            if (!end) return null;
            const out = []; for (let c = end; c; c = prev.get(key(...c))) out.unshift([c[0] * S, c[1] * S]);
            return out;
        }, [gx, gy, near]);
        if (!route) return false;
        const p = await padBox(); if (!opts.held) await touch('touchStart', p.x, p.y);
        const t0 = Date.now(), map0 = await page.evaluate(() => T.player.player.map); let i = 0, done = false;
        while (Date.now() - t0 < limitMs) {
            const me = await page.evaluate(() => ({ x: T.player.player.x, y: T.player.player.y, map: T.player.player.map }));
            if (me.map !== map0) { done = 'map'; break; }
            const last = route[route.length - 1];
            if (Math.hypot(last[0] - me.x, last[1] - me.y) < 0.12) { done = true; break; }
            { let bi = i, bd = Infinity; for (let k = i; k < Math.min(route.length, i + 40); k++) { const d = Math.hypot(route[k][0] - me.x, route[k][1] - me.y); if (d < bd) { bd = d; bi = k; } } i = bi; }
            const j = await page.evaluate(([route, i]) => {
                const p = T.player.player, m = T.win.currentMap(), free = (x, y) => !m.solidRect(x + 0.22, y + 0.62, x + 0.78, y + 0.96);
                let best = i;
                for (let j = i; j < Math.min(route.length, i + 12); j++) {
                    const [tx, ty] = route[j], n = Math.ceil(Math.hypot(tx - p.x, ty - p.y) / 0.08); let clear = true;
                    for (let k = 1; k <= n && clear; k++) clear = free(p.x + (tx - p.x) * k / n, p.y + (ty - p.y) * k / n);
                    if (clear) best = j; else break;
                }
                return best;
            }, [route, i]);
            const [tx, ty] = route[j], dx = tx - me.x, dy = ty - me.y, n = Math.hypot(dx, dy) || 1;
            // slow down at the end so she stops where asked
            const k = j === route.length - 1 ? Math.max(0.35, Math.min(1, n / 0.6)) : 1;
            await touch('touchMove', p.x + dx / n * p.lim * k, p.y + dy / n * p.lim * k);
            await page.waitForTimeout(50);
        }
        if (!opts.keep) { await touch('touchEnd'); await page.waitForTimeout(150); }
        return done;
    }
    // turn her to face a way with a short push of the stick
    async function face(dx, dy) {
        const p = await padBox(); await touch('touchStart', p.x, p.y);
        await touch('touchMove', p.x + dx * p.lim * 0.5, p.y + dy * p.lim * 0.5); await page.waitForTimeout(90); await touch('touchEnd'); await page.waitForTimeout(120);
    }
    return { touch, tap, tapEl, padBox, walkToPoint, face };
};
