// A small event bus: packs announce what happened through it. Shared things (the bag, the news, the date)
// are changed only through their own core functions, never by an event.
//   on('day:started', fn) → off()      emit('day:started', { days })
// Names are "area:what happened", and every name is listed here. A new pack adds its own names here first,
// so the list stays the one place to see who says what. An unlisted name is refused with a warning.

export const EVENTS = {
    'clock:synced': 'the date, hour and place were read from the chat or set by hand { ok, byHand, days, tr }',
    'day:started': 'days the ledger had never handled began { days: [dates], from, to }',
    'place:changed': 'the chat moved to another place { from, to }',
    'game:loaded': "a chat's game was loaded or started over { reset }",
    'bag:changed': 'something went into or out of the bag, or changed in it',
    'news:changed': 'what goes to the chat was added or taken out',
    'view:changed': 'a display setting changed (month names, theme)',
    'sun:changed': "today's 태양 기운 went up or down",
    'stats:changed': '지혜, 체력, 신앙 or 모험 경험치 changed { rankUp }',
    'act:done': 'an activity was finished { kind, id } (daily commissions count these)',
    'journal:added': 'something worth telling happened { entry }',
    'world:changed': 'the map changed: an overlay opened, a companion joined, a thing appeared { map }',
    'adventure:changed': 'the small adventure moved on, started or ended',
    'duat:changed': 'a Duat run moved on, started or ended',
    'picks:changed': 'something was taken from a chat message, used, or went away with its reply',
};

const handlers = new Map();
const known = ev => { if (EVENTS[ev]) return true; console.warn(`[SandAndFeather] unlisted event "${ev}": add it to EVENTS in bus.js`); return false; };

export function on(ev, fn) {
    if (!known(ev)) return () => {};
    if (!handlers.has(ev)) handlers.set(ev, new Set());
    handlers.get(ev).add(fn);
    return () => handlers.get(ev)?.delete(fn);
}
export function emit(ev, data) {
    if (!known(ev)) return;
    for (const fn of handlers.get(ev) || []) {
        try { fn(data); } catch (e) { console.error(`[SandAndFeather] ${ev}`, e); }
    }
}
