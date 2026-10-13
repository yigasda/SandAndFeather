// An item's picture: its own 128×128 icon in data/art/items/<id>.png (approved art, put in as it came), drawn
// smaller in a slot. Items without one yet keep what they had: the shared theme picture (skins/<theme>/item-*,
// swapped by applyTheme) or the emoji. A picture that fails to load falls back to the emoji.
// Loaded lazily, so opening the game does not decode them all.

import { itemInfo } from '../core/bag.js';
import { settings } from '../core/settings.js';

// ids with their own icon (data/art/items/provenance.json): all 100 items (47 + the market 53 from 0.9.67)
const OWN = new Set(['ancient_seal', 'barley', 'barley_porridge', 'barley_seed', 'beer_jar', 'bes_amulet', 'black_sand',
    'blank_papyrus', 'blue_lotus', 'bread', 'bronze_mirror', 'carnelian_ring', 'carob', 'catfish', 'cedar_plank',
    'cheese', 'chickpeas', 'clay_bowl', 'copper_bangle', 'coriander', 'croc_tooth', 'cucumber', 'cucumber_salad',
    'cucumber_seed', 'cumin', 'dates', 'doum_fruit', 'duat_reed', 'duat_scroll', 'eel', 'faience_beads',
    'faience_scarab', 'feast_garland', 'fig', 'fig_cake', 'fig_seed', 'fine_linen', 'fish_stew', 'frankincense',
    'garlic', 'garlic_seed', 'gold_ornament', 'golden_carp', 'grape_vine', 'grapes', 'grilled_fish', 'heart_scarab',
    'honey', 'honey_bread', 'ka_statue', 'kohl', 'kyphi', 'lapis_beads', 'leek', 'lentil_soup', 'lentils', 'lily_oil',
    'limestone', 'linen', 'lotus_oil', 'lotus_seed', 'lotus_tea', 'lotus_vase', 'map_scrap', 'milk', 'myrrh',
    'nile_perch', 'oil_lamp', 'onion', 'ostracon', 'palm_fan', 'papyrus_sandals', 'pitch', 'pomegranate',
    'pomegranate_sweets', 'reed_bundle', 'reed_mat', 'reed_pen', 'salt', 'scribe_palette', 'sealed_jar',
    'sealed_letter', 'senet_board', 'sesame', 'sesame_bread', 'small_chest', 'star_shard', 'taweret_amulet', 'tilapia',
    'tomb_rubbing', 'toy_boat', 'ushabti', 'was_shard', 'watermelon', 'watermelon_punch', 'watermelon_seed', 'wedjat',
    'wet_papyrus', 'wine_jar', 'wooden_comb']);
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
