// Real production guardian + actual CDP input. No HP/stat/AI/first-defeat overrides.
// Isolated save setup and explicit phase placements are recorded; continuous portal
// width walks start only AFTER this preflight and use their existing no-teleport contract.
const fs = require('node:fs');
const path = require('node:path');
const MAP = 'desert_guardian_gate', WELL = 'desert_lightwell', SID = 't3.warden.1';
module.exports = async ({ page, W, boot, where, ok, OUT, BASE }) => {
    const log = { fixture: 'isolated reset save; standard Set alone for first tell, then Set + Horus; production guardian unchanged', phases: [], combat: [] };
    const check = (condition, message) => { ok(condition, 'guardian: ' + message); if (!condition) throw new Error('guardian: ' + message); };
    const ensure = (condition, message) => { if (!condition) check(false, message); };
    const snapshot = async name => {
        const state = await page.evaluate(sid => ({ map: T.player.player.map,
            first: T.state.getState().desertFight?.first?.[sid] ?? null,
            killed: T.state.getState().desertFight?.killed?.[sid] ?? null,
            day: T.ledger.today(T.state.getState()), field: T.field.fieldState(),
            slam: T.field.testSlam?.() || [], events: T.field.testEvents() }), SID);
        log.phases.push({ name, ...state });
        fs.writeFileSync(path.join(OUT, 'guardian-preflight.json'), JSON.stringify(log, null, 2));
        return state;
    };
    const shot = name => page.screenshot({ path: path.join(OUT, 'guardian-' + name + '.png') });
    const neutral = async () => { await W.touch('touchEnd'); await page.waitForTimeout(180); };
    const enter = async (map, entry) => {
        await neutral(); await page.evaluate(async ([m, e]) => T.win.travel(m, e), [map, entry]);
        await page.waitForTimeout(800);
    };
    const walkExit = async (map, id, target) => {
        const dest = await page.evaluate(id => {
            const e = T.win.currentMap().d.exits.find(e => e.id === id);
            return { x: (e.x0 + e.x1) / 2 - .5, y: (e.y0 + e.y1) / 2 - .8 };
        }, id);
        const result = await W.walkToPoint(dest.x, dest.y, 45000, .12, { avoidExits: true });
        await page.waitForTimeout(500);
        const position = await where();
        check(position.map === target, `${map}/${id} actual touch reaches ${target} (${result})`);
        return position;
    };
    const reload = async () => {
        await neutral(); await page.evaluate(async () => T.state.saveState());
        await page.reload({ waitUntil: 'domcontentloaded' }); await boot();
        await page.evaluate(async () => T.win.openGame()); await page.waitForTimeout(900);
    };
    try {
        const config = await page.evaluate(() => ({ enemy: T.data.DATA.desert.enemies.desert_temple_warden,
            spawns: T.data.DATA.desert.maps.desert_guardian_gate?.spawns,
            gate: T.data.DATA.maps.desert_guardian_gate.exits.find(e => e.id === 'north') }));
        log.productionConfig = config;
        check(config.enemy?.attack === 'slam' && config.spawns?.length === 1 && config.spawns[0].id === SID,
            'production guardian definition and stable spawn ID, not a test-only creature');
        check(config.gate?.requiresFirstDefeat === SID, 'north gate requires existing permanent first-defeat record');

        // Explicit north fixture checks the locked door without first walking through a boss.
        await enter(MAP, 'north');
        let state = await snapshot('locked-before');
        check(state.first === null && state.field.mobs.length === 1, 'fresh save: alive guardian and no first defeat');
        await walkExit(MAP, 'north', MAP);
        const pad = await W.padBox(); await W.touch('touchStart', pad.x, pad.y);
        await W.touch('touchMove', pad.x, pad.y - pad.lim); await page.waitForTimeout(1000); await neutral();
        state = await snapshot('locked-held-input');
        check(state.map === MAP && state.first === null, 'locked threshold stays in T3 under held input');
        await shot('01-locked');
        await reload(); state = await snapshot('locked-reloaded');
        check(state.map === MAP && state.first === null, 'save/reload does not invent a first defeat');

        // A second explicit placement isolates the existing south retreat from the north lock.
        await enter(MAP, 'south');
        await walkExit(MAP, 'south', 'desert_votive_hall');
        check((await snapshot('south-retreat')).first === null, 'south retreat works before defeat');
        await walkExit('desert_votive_hall', 'north', MAP);
        await shot('02-south-return');
        // The run already has both standard party HP pools. Temporarily leave
        // the companion out so its automatic attacks cannot interrupt the tell.
        await page.evaluate(() => T.heroes.setWith(T.state.getState(), null));

        // Observe one genuine tell/impact before attacking. Standard party, unmodified boss.
        let held = false, firstImpact = false, preparedShot = false, impactShot = false;
        const started = Date.now(), combatPad = await W.padBox();
        while (Date.now() - started < 35000) {
            const s = await page.evaluate(() => ({ field: T.field.fieldState(), slam: T.field.testSlam(),
                p: { x: T.player.player.x, y: T.player.player.y }, events: T.field.testEvents() }));
            const mob = s.field.mobs.find(o => o.kind === 'desert_temple_warden' && o.st !== 'dead');
            ensure(!s.field.me.down, 'leader remains standing while observing telegraph');
            if (s.events.some(e => e.ev === 'slamImpact')) { firstImpact = true; break; }
            ensure(!!mob, 'guardian remains alive for observed first attack');
            const slam = s.slam[0], area = slam?.area;
            ensure(!!area && Number.isFinite(area.x) && Number.isFinite(area.y), 'read-only measured slam area available');
            if (mob.st === 'prepare' || mob.st === 'attack' || mob.st === 'recover') {
                if (held) { await neutral(); held = false; }
                if (mob.st === 'prepare' && !preparedShot) { await shot('03-telegraph'); preparedShot = true; }
            } else {
                const dx = area.x - .5 - s.p.x, dy = area.y - .8 - s.p.y, distance = Math.hypot(dx, dy);
                if (distance > .15) {
                    if (!held) { await W.touch('touchStart', combatPad.x, combatPad.y); held = true; }
                    await W.touch('touchMove', combatPad.x + dx / distance * combatPad.lim, combatPad.y + dy / distance * combatPad.lim);
                } else if (held) { await neutral(); held = false; }
            }
            await page.waitForTimeout(50);
        }
        if (held) await neutral();
        check(firstImpact, 'real guardian performed its telegraphed production slam');
        await shot('04-impact'); impactShot = true;
        state = await snapshot('first-impact');
        log.combat.push({ preparedShot, impactShot });
        const impact = state.events.find(e => e.ev === 'slamImpact');
        const sameAttack = state.events.filter(e => e.sid === SID && e.seq === impact.seq);
        const warning = sameAttack.find(e => e.ev === 'slamWarn');
        const lock = sameAttack.find(e => e.ev === 'slamLock');
        const start = sameAttack.find(e => e.ev === 'slamStart');
        check(warning && lock && start && impact.frame === 'attack-1', 'tell, aim lock and impact-frame events all observed');
        check(lock.t - warning.t >= config.enemy.timing.prepare[0] - .06
            && start.t - lock.t >= config.enemy.timing.prepare[1] - .06
            && impact.t - start.t >= config.enemy.slam.impact - .06,
            'actual impact waits through both telegraph frames and attack-0');
        check(JSON.stringify(lock.area) === JSON.stringify(impact.area)
            && sameAttack.filter(e => e.ev === 'slamImpact').length === 1,
            'locked visible contact patch is unchanged and impacts once');
        check(impact.hits.some(h => h.who === 'set' && h.damage > 0), 'standing inside measured hands takes real damage');
        for (const hit of impact.hits) check(Number.isFinite(hit.x) && Number.isFinite(hit.y)
            && ((hit.x - impact.area.x) / impact.area.rx) ** 2 + ((hit.y - impact.area.y) / impact.area.ry) ** 2 <= 1 + 1e-9,
            `impact target ${hit.who} is inside the exact visible ellipse`);

        // One actual dodge after the next aim lock: moving cannot drag the
        // fixed attack patch after the player, and an outside point takes no hit.
        await page.waitForFunction(seq => T.field.testEvents().some(e => e.ev === 'slamLock' && e.seq > seq), impact.seq, { timeout: 15000 });
        const dodge = await page.evaluate(() => ({ lock: T.field.testEvents().filter(e => e.ev === 'slamLock').at(-1),
            hp: T.field.fieldState().run.hp.set, p: T.player.feet() }));
        const dodgePad = await W.padBox();
        const dodgeDirection = dodge.p.x >= dodge.lock.area.x ? 1 : -1;
        await W.touch('touchStart', dodgePad.x, dodgePad.y);
        await W.touch('touchMove', dodgePad.x + dodgeDirection * dodgePad.lim, dodgePad.y);
        await page.waitForTimeout(420); await W.touch('touchEnd');
        await page.waitForFunction(seq => T.field.testEvents().some(e => e.ev === 'slamImpact' && e.seq === seq), dodge.lock.seq, { timeout: 5000 });
        const dodged = await page.evaluate(seq => ({ impact: T.field.testEvents().find(e => e.ev === 'slamImpact' && e.seq === seq),
            hp: T.field.fieldState().run.hp.set, p: T.player.feet() }), dodge.lock.seq);
        check(JSON.stringify(dodged.impact.area) === JSON.stringify(dodge.lock.area)
            && !dodged.impact.hits.some(h => h.who === 'set') && dodged.hp === dodge.hp,
            'actual sideways dodge after lock avoids damage; area does not home');
        check(((dodged.p.x - dodge.lock.area.x) / dodge.lock.area.rx) ** 2
            + ((dodged.p.y - dodge.lock.area.y) / dodge.lock.area.ry) ** 2 > 1,
            'dodged feet are outside impact ellipse');
        await shot('04b-dodged'); await snapshot('actual-dodge');
        await page.evaluate(() => T.heroes.setWith(T.state.getState(), 'horus'));

        // Walk into strike reach and press actual attack/skill controls until the
        // normal damage0 death path persists the spawn's first/killed records.
        const fightStart = Date.now(); let presses = 0, skillPresses = 0;
        while (Date.now() - fightStart < 90000) {
            const s = await page.evaluate(sid => ({ field: T.field.fieldState(),
                first: T.state.getState().desertFight?.first?.[sid] ?? null,
                p: { x: T.player.player.x, y: T.player.player.y },
                hurt: T.field.testHurt(), slam: T.field.testSlam(), blow: T.field.testBlow() }), SID);
            if (s.first !== null) break;
            ensure(!s.field.me.down, 'standard leader survives actual fight');
            const mob = s.field.mobs.find(o => o.kind === 'desert_temple_warden' && o.st !== 'dead');
            ensure(!!mob, 'guardian exists until normal first-defeat event');
            const a = s.hurt[0], at = s.slam[0]?.area || a;
            const close = s.blow.mobs.some(o => o.meets && o.seen);
            if (!close) {
                const dx = at.x - .5 - s.p.x, dy = at.y - .8 - s.p.y, distance = Math.hypot(dx, dy) || 1;
                await W.touch('touchStart', combatPad.x, combatPad.y);
                await W.touch('touchMove', combatPad.x + dx / distance * combatPad.lim, combatPad.y + dy / distance * combatPad.lim);
                await page.waitForTimeout(150); await neutral();
                // Neutral input lets the existing attack auto-facing choose the nearest valid shape.
            }
            const skill = page.locator('.sf_duat_skill');
            if (mob.st === 'guard' && await skill.count() && !(await skill.isDisabled())) {
                await W.tapEl('.sf_duat_skill'); skillPresses++;
            } else { await W.tapEl('.sf_talk'); presses++; }
            await page.waitForTimeout(320);
        }
        await neutral(); state = await snapshot('defeated');
        const firstDay = state.first;
        check(firstDay !== null && state.killed === state.day && presses > 0,
            `actual attack presses ${presses}, skills ${skillPresses}; first=${firstDay}, killed=${state.killed}`);
        check(state.field.mobs.every(o => o.st === 'dead'), 'normal death state, no live guardian');
        const afterDeathHp = JSON.stringify(state.field.run?.hp);
        const impacts = state.events.filter(e => e.ev === 'slamImpact').length;
        await page.waitForTimeout(1800); state = await snapshot('after-defeat-wait');
        check(JSON.stringify(state.field.run?.hp) === afterDeathHp && state.events.filter(e => e.ev === 'slamImpact').length === impacts,
            'no delayed slam or damage after defeat');
        await shot('05-defeated');

        // First clear really opens the threshold; do not set the flag directly.
        const north = await page.evaluate(() => T.data.DATA.maps.desert_guardian_gate.entries.north);
        check(await W.walkToPoint(north.x, north.y, 45000, .15, { avoidExits: true }), 'walk from battle to north landing');
        await walkExit(MAP, 'north', WELL); await shot('06-lightwell-first-arrival');
        await walkExit(WELL, 'south', MAP); state = await snapshot('same-day-return');
        check(state.first === firstDay && state.field.mobs.length === 0, 'same-day return has no respawn and keeps first defeat');

        await reload(); state = await snapshot('unlocked-reloaded');
        check(state.first === firstDay && state.field.mobs.length === 0, 'actual save/reload keeps permanent unlock and same-day defeat');
        await walkExit(MAP, 'north', WELL);

        // Only advance the isolated test save's game clock. Never touch either kill history.
        await page.evaluate(() => { const s = T.state.getState(); s.ledger.gday = T.ledger.today(s) + 1; });
        await walkExit(WELL, 'south', MAP); state = await snapshot('next-day-respawn');
        check(state.first === firstDay && state.killed === firstDay && state.day > firstDay
            && state.field.mobs.length === 1 && state.field.mobs[0].hp === config.enemy.hp,
            'next-day production respawn at full HP does not erase first defeat');
        await walkExit(MAP, 'north', WELL);
        await reload(); state = await snapshot('respawn-day-unlocked-reloaded');
        check(state.first === firstDay, 'permanent first defeat also survives reload on respawn day');
        await walkExit(WELL, 'south', MAP);
        await shot('07-permanently-unlocked');
        const unchanged = await page.evaluate(config => JSON.stringify(T.data.DATA.desert.enemies.desert_temple_warden) === JSON.stringify(config.enemy)
            && JSON.stringify(T.data.DATA.desert.maps.desert_guardian_gate.spawns) === JSON.stringify(config.spawns), config);
        check(unchanged, 'production guardian definition/spawn unchanged throughout all test phases');
        log.result = 'PASS actual production defeat + persistence preflight; continuous widths follow separately';
    } finally {
        await W.touch('touchEnd').catch(() => {});
        fs.writeFileSync(path.join(OUT, 'guardian-preflight.json'), JSON.stringify(log, null, 2));
    }
};
