// data/*.json, fetched from the extension's own folder whatever it is named.

const base = new URL('../../data/', import.meta.url);
const cache = new Map();

export async function loadJson(name) {
    if (cache.has(name)) return cache.get(name);
    const r = await fetch(new URL(name, base), { cache: 'no-cache' });
    if (!r.ok) throw new Error(`data/${name}: ${r.status}`);
    const j = await r.json();
    cache.set(name, j);
    return j;
}

export const DATA = { calendar: null, places: null, maps: {} };

export async function loadData() {
    const [calendar, places, ombos] = await Promise.all([loadJson('calendar.json'), loadJson('places.json'), loadJson('maps/ombos.json')]);
    DATA.calendar = calendar;
    DATA.places = places;
    DATA.maps.ombos = ombos;
    return DATA;
}
