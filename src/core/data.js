// data/*.json, fetched from the extension's own folder whatever it is named.
// A file that does not parse says which file and where, in Korean (check.js shows it).

const base = new URL('../../data/', import.meta.url);
const cache = new Map();

export async function loadJson(name) {
    if (cache.has(name)) return cache.get(name);
    const r = await fetch(new URL(name, base), { cache: 'no-cache' });
    if (!r.ok) throw new Error(`data/${name}을 못 불러왔어: ${r.status}`);
    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch (e) {
        const at = Number((String(e.message).match(/position (\d+)/) || [])[1]);
        const line = Number.isFinite(at) ? text.slice(0, at).split('\n').length : 0;
        throw new Error(`data/${name}에 JSON 오류가 있어${line ? `. ${line}번째 줄 근처` : ''}: 쉼표, 따옴표, 괄호 짝을 봐 줘`);
    }
    cache.set(name, j);
    return j;
}

export const DATA = { calendar: null, places: null, items: null, finds: null, talk: null, maps: {} };

export async function loadData() {
    const [calendar, places, items, finds, talk, ombos] = await Promise.all(
        ['calendar.json', 'places.json', 'items.json', 'finds.json', 'talk.json', 'maps/ombos.json'].map(loadJson));
    Object.assign(DATA, { calendar, places, items, finds, talk });
    DATA.maps.ombos = ombos;
    return DATA;
}
