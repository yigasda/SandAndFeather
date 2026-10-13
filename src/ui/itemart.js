// An item's picture: its own 128×128 icon in data/art/items/<id>.png (approved art, put in as it came), drawn
// smaller in a slot. Items without one yet keep what they had: the shared theme picture (skins/<theme>/item-*,
// swapped by applyTheme) or the emoji. A picture that fails to load falls back to the emoji.
// Loaded lazily, so opening the game does not decode them all.

import { itemInfo } from '../core/bag.js';
import { settings } from '../core/settings.js';

// ids with their own icon (data/art/items/provenance.json): all 47 items
const OWN = new Set(['ancient_seal', 'barley', 'barley_porridge', 'barley_seed', 'black_sand', 'blue_lotus', 'bread',
    'bronze_mirror', 'catfish', 'cedar_plank', 'croc_tooth', 'dates', 'duat_reed', 'duat_scroll', 'eel',
    'faience_scarab', 'feast_garland', 'fig', 'fig_cake', 'fig_seed', 'fish_stew', 'golden_carp', 'grilled_fish',
    'heart_scarab', 'honey', 'honey_bread', 'ka_statue', 'limestone', 'lotus_seed', 'lotus_tea', 'map_scrap',
    'nile_perch', 'onion', 'ostracon', 'pitch', 'reed_bundle', 'salt', 'sealed_jar', 'sealed_letter', 'star_shard',
    'tilapia', 'tomb_rubbing', 'toy_boat', 'ushabti', 'was_shard', 'wedjat', 'wet_papyrus']);
// before 0.9.59 several items shared one theme picture (skins/<theme>/item-*); an item added later without its own
// icon can be given one of those here
const SHARED = {};
const base = new URL('../../data/art/', import.meta.url);

export const hasItemArt = id => OWN.has(id);

// the picture for an item id (an <img>, or a <span> with the emoji)
export function itemArt(id, cls = 'sf_item_art') {
    const emoji = () => { const s = document.createElement('span'); s.className = cls; s.textContent = itemInfo(id)?.icon || '◆'; return s; };
    if (!OWN.has(id) && !SHARED[id]) return emoji();
    const img = document.createElement('img');
    img.className = cls; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    if (OWN.has(id)) { img.dataset.itemId = id; img.src = new URL(`items/${id}.png`, base).href; }
    else { img.dataset.itemArt = SHARED[id]; img.src = new URL(`ui/skins/${settings().uiTheme}/item-${SHARED[id]}.png`, base).href; }
    img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
    return img;
}
