// A small event bus, so packs added in later stages talk through events instead of calling each other.
//   on('day:start', fn) → off()      emit('day:start', { days })
// Events so far: 'sync' (the tracker was read), 'day:start' (the date moved forward), 'place' (the place changed),
// 'state' (the chat's game was loaded or reset).

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
