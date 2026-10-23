// Pure passage rule checks; no game, browser or save fixture is created here.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
    const source = fs.readFileSync(path.join(__dirname, '../../src/world/exit-rules.js'), 'utf8');
    const { canUseExit } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
    const gate = { requiresFirstDefeat: 't3.warden.1' };
    assert.equal(canUseExit({}, null), true, 'ordinary exits remain unrestricted');
    for (const state of [null, {}, { desertFight: {} }, { desertFight: { first: {} } },
        { desertFight: { killed: { 't3.warden.1': 99 } } },
        { desertFight: { first: { 'other.guardian': 1 } } }]) {
        assert.equal(canUseExit(gate, state), false, 'no matching first defeat stays locked');
    }
    for (const day of [0, 1, 42]) {
        const state = { desertFight: { first: { 't3.warden.1': day }, killed: { 't3.warden.1': day } } };
        assert.equal(canUseExit(gate, state), true, 'day zero also unlocks');
        state.desertFight.killed = {};
        assert.equal(canUseExit(gate, state), true, 'respawn history is independent');
        assert.equal(canUseExit(gate, JSON.parse(JSON.stringify(state))), true, 'JSON save round trip keeps first defeat');
    }
    assert.equal(canUseExit(gate, { desertFight: { first: { 't3.warden.1': null } } }), false);
    console.log('PASS exit rule: absent / unrelated / daily-only locked; permanent first incl day zero; ordinary exits unchanged');
})().catch(error => { console.error(error); process.exitCode = 1; });
