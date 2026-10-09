// A small event bus: packs announce what happened through it. Shared things (the bag, the news, the date)
// are changed only through their own core functions, never by an event.
//   on('day:start', fn) → off()      emit('day:start', { days })
// Events so far: 'sync' (the tracker was read), 'day:start' (days never handled before began), 'place' (the place changed),
// 'state' (the chat's game was loaded or reset), 'bag' (the bag changed), 'news' (what goes to the chat changed).

const handlers = new Map();

export function on(ev, fn) {
    if (!handlers.has(ev)) handlers.set(ev, new Set());
    handlers.get(ev).add(fn);
    return () => handlers.get(ev)?.delete(fn);
}
export function emit(ev, data) {
    for (const fn of handlers.get(ev) || []) {
        try { fn(data); } catch (e) { console.error(`[SandAndFeather] ${ev}`, e); }
    }
}
