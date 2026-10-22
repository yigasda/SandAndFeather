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

export const DATA = { bond: null, calendar: null, places: null, items: null, finds: null, talk: null, market: null, recipes: null, works: null, duat: null, desert: null, daily: null, adventures: null, lessons: null, festivals: null, records: null, sprites: null, tiles: null, maps: {} };
const FILES = ['bond', 'calendar', 'places', 'items', 'finds', 'talk', 'market', 'recipes', 'works', 'duat', 'desert', 'daily', 'adventures', 'lessons', 'festivals', 'records', 'sprites', 'tiles'];
// the residence behind the Ombos temple door: one map a room or hall (tools/maps/residence.py)
export const RESIDENCE = ['temple_courtyard', 'courtyard_colonnade', 'temple_inner_corridor', 'temple_central_gallery', 'temple_east_gallery',
    'temple_west_gallery', 'room_entrances_wide', 'set_room', 'horus_room', 'somang_room', 'temple_kitchen', 'temple_dining',
    'temple_sanctuary', 'temple_colonnade', 'temple_roof'];
// the desert east of the village, one map a picture (tools/maps/desert.py; only the places built so far)
export const DESERT = ['desert_golden_dunes', 'desert_dry_flats', 'desert_quiet_dunes', 'desert_buried_temple', 'desert_city_gate', 'desert_city_plaza', 'desert_colonnade', 'desert_forecourt_west', 'desert_forecourt_east', 'desert_votive_hall', 'desert_guardian_gate', 'desert_city_dwelling', 'desert_old_sanctuary', 'desert_city_archive', 'desert_wind_basin'];
// the dock below the village, its own picture (tools/maps/dock.py)
export const MAPS = ['ombos', 'ruins', 'dock_pier', ...Array.from({ length: 7 }, (_, i) => `duat_${String(i + 1).padStart(2, '0')}`), ...DESERT, ...RESIDENCE];

export async function loadData() {
    const all = await Promise.all([...FILES.map(f => loadJson(`${f}.json`)), ...MAPS.map(m => loadJson(`maps/${m}.json`))]);
    FILES.forEach((f, k) => { DATA[f] = all[k]; });
    MAPS.forEach((m, k) => { DATA.maps[m] = all[FILES.length + k]; });
    // the character pictures (several MB once decoded) wait until the game window opens: ensureSpriteArt()
    await loadSceneArt();
    return DATA;
}

let spriteArtPromise;
export function ensureSpriteArt() {
    return spriteArtPromise ||= (async () => {
        // the large walking atlas (wide screens) waits until a screen needs it: see spriteFile()
        const files = [...new Set(Object.values(DATA.sprites?.looks || {}).flatMap(d => [d.atlas?.file, d.motion?.small?.file || d.motion?.file]).filter(Boolean))];
        const entries = await Promise.all(files.map(async file => {
            const image = new Image();
            image.src = new URL(file, base).href;
            try { await image.decode(); }
            catch { throw new Error(`data/${file} 스프라이트를 못 불러왔어`); }
            return [file, image];
        }));
        DATA.spriteArt = Object.fromEntries(entries);
    })().catch(error => { spriteArtPromise = null; throw error; });
}

// Keep the approved reference pixels at their original resolution. The renderer
// selects the authored day/night panel; it does not recolour or regenerate it.
// A "lazy" scene (a residence room) is decoded only while she is in it: each is a few MB once decoded.
let sceneArtPromise;
const decode = async file => {
    const image = new Image();
    image.src = new URL(file, base).href;
    try { await image.decode(); }
    catch { throw new Error(`data/${file} 그림을 못 불러왔어`); }
    return image;
};
function loadSceneArt() {
    return sceneArtPromise ||= (async () => {
        const definitions = await loadJson('scene-art.json');
        const entries = await Promise.all(Object.entries(definitions).map(async ([name, definition]) => [name, {
            ...definition,
            image: definition.lazy ? null : await decode(definition.file),
            nightImage: definition.lazy || !definition.nightFile ? null : await decode(definition.nightFile),
        }]));
        DATA.sceneArt = Object.fromEntries(entries);
    })().catch(error => { sceneArtPromise = null; throw error; });
}
// the pictures a map needs, day and its own night; other lazy scenes let go of theirs
export async function ensureSceneArt(mapId) {
    const want = new Set(DATA.maps[mapId]?.referenceScenes || []);
    if (want.has('duat')) want.add('materials'); // the Duat ground borrows that picture's sand and paving
    for (const [name, scene] of Object.entries(DATA.sceneArt || {})) {
        if (!scene.lazy) continue;
        if (!want.has(name)) { scene.image = null; scene.nightImage = null; continue; }
        if (!scene.image) scene.image = await decode(scene.file);
        if (scene.nightFile && !scene.nightImage) scene.nightImage = await decode(scene.nightFile);
    }
}

// a sprite picture loaded on first need (the large trio atlas, a creature's sheets): null until it has decoded
const spriteLoading = new Map();
// let go of sprite pictures no longer needed (a map's creatures when she leaves it), so they do not pile up
export function releaseSprites(files) {
    for (const file of files) { if (DATA.spriteArt) delete DATA.spriteArt[file]; spriteLoading.delete(file); }
}
export function spriteFile(file) {
    if (DATA.spriteArt?.[file]) return DATA.spriteArt[file];
    if (!spriteLoading.has(file)) {
        const image = new Image();
        image.src = new URL(file, base).href;
        // kept only if nobody let it go while it decoded (releaseSprites)
        const loading = image.decode().then(() => { if (spriteLoading.get(file) === loading) DATA.spriteArt[file] = image; }).catch(() => { if (spriteLoading.get(file) === loading) spriteLoading.delete(file); });
        spriteLoading.set(file, loading);
    }
    return null;
}
