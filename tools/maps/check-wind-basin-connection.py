"""Strict preservation and full-foot checks for 02 outer path <-> 10 sandy return.
Run after tools/maps/desert.py. Does not rewrite source art, masks or runtime data.
"""
import copy
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parents[2]
def read(path):
    return json.loads((ROOT / path).read_text())
def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
def canonical(data):
    return hashlib.sha256(json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
def mask_of(data):
    p = data['authoredCollision']['pixelWalk']
    out = np.zeros((p['height'], p['width']), dtype=bool)
    for y, row in enumerate(p['rows']):
        for a, b in zip(row[::2], row[1::2]):
            out[y, a:b] = True
    return out
def safe_of(mask, px):
    radius = math.ceil(.28 * px)
    return nd.minimum_filter(mask.astype('uint8'),
        size=(math.ceil(.18*px) + math.ceil(.16*px) + 1, 2*radius + 1),
        mode='constant', cval=0).astype(bool)
def full_foot(mask, px, x, y):
    left, right = math.floor(x-.28*px), math.ceil(x+.28*px)
    top, bottom = math.floor(y-.18*px), math.ceil(y+.16*px)
    return (0 <= left <= right < mask.shape[1] and 0 <= top <= bottom < mask.shape[0]
            and mask[top:bottom+1, left:right+1].all())

temple = read('data/maps/desert_buried_temple.json')
basin = read('data/maps/desert_wind_basin.json')
scenes = read('data/scene-art.json')
# Compare the entire old map after removing only the new records, not merely the two door IDs.
old = copy.deepcopy(temple)
old['entries'].pop('east')
assert old['exits'][-1]['id'] == 'east'
old['exits'].pop()
assert canonical(old) == 'c33a6f29d52dbad196b8e77af6c8634c469809968584da9643a577a97ef17917', '02 baseline changed beyond its new east route'
old_scenes = copy.deepcopy(scenes)
old_scenes.pop('desert_wind_basin')
# T3/16 is a separately authorized ADDITIVE pair. Accept only that exact new
# scene record; never refresh or weaken the fingerprint of any pre-existing scene.
# check-lightwell-connection.py independently verifies its pixels, geometry and
# the entire inherited runtime. This compatibility also keeps this older checker
# usable on the new branch instead of mistaking the added record for an old edit.
if 'desert_lightwell' in old_scenes:
    assert canonical(old_scenes.pop('desert_lightwell')) == '95ac0f246bf362552e6ff4cf5bce9ebb10116ce3e3ed45da115704eac900331b', 'New lightwell scene differs from its exact approved additive record'
assert canonical(old_scenes) == '430a657ec55ea2f5f7183688e1bd690534095cbe57bebba38566b404e96f3279', 'Existing scene artwork/settings changed'
assert [e['id'] for e in temple['exits']] == ['west', 'door', 'temple', 'east']
assert [e['id'] for e in basin['exits']] == ['west'], '20/discovery stays inactive'
assert set(basin['entries']) == {'west'}
assert basin['spots'] == basin['spawns'] == basin['roam'] == basin['labels'] == []
assert "'desert_wind_basin'" in (ROOT / 'src/core/data.js').read_text()

for data, key, pixels, facing, to, at, box, art_hash, mask_hash, camera, actor in [
    (temple, 'east', (1689,850), 'left', 'desert_wind_basin', 'west', (1760,785,1773,886),
     '8e8e2dc22bbad1dc4afb9e206d424f0b787798cc9cb24b270c521ac67c679d13',
     '2414c66d1313151e1ea47509fa80fdefd886703296a371007ce9ba1a86ab1aee', .6, 1.6),
    (basin, 'west', (210,594), 'right', 'desert_buried_temple', 'east', (3,443,24,566),
     '02254c2ec30e9c845a70aef6e2365b5ed4046dff94e4d9ee34d186d134b819e6',
     '85aed5e5dd6b185a57918663b4e01f0288b54440ee5d81c89c7ede828487bb44', .8, 1.4),
]:
    source = data['source']
    assert source['artSha256'] == art_hash == digest(source['art'])
    assert source['collisionSha256'] == mask_hash == digest(source['collision'])
    assert not source.get('runtimePassages')
    original = np.asarray(Image.open(ROOT / source['collision']).convert('RGBA'))[..., 3] >= 128
    actual = mask_of(data)
    assert np.array_equal(actual, original), 'Every original mask pixel must be preserved, without additions'
    px = data['authoredCollision']['pixelWalk']['pixelsPerTile']
    assert abs(px - 52/1.55*(.44 if key == 'east' else 1)) < 1e-12
    assert data['cameraScale'] == camera and data['actorScale'] == actor and data['walkSpeed'] == 1.6
    p = data['entries'][key]
    assert abs((p['x']+.5)*px-pixels[0]) < 1e-6 and abs((p['y']+.8)*px-pixels[1]) < 1e-6
    assert p['dir'] == facing
    e = next(e for e in data['exits'] if e['id'] == key)
    x0,y0,x1,y1 = box
    assert e['to'] == to and e['at'] == at
    assert e['polygon'] == [[x/px,y/px] for x,y in [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]]
    assert original[y0:y1+1,x0:x1+1].all(), 'Threshold must be entirely on approved floor'
    safe = safe_of(actual, px)
    labels, _ = nd.label(safe)
    x,y = pixels
    assert labels[y,x] != 0
    for target_y in ([800,835,870] if key == 'east' else [480,510,545]):
        target_x = 1760 if key == 'east' else 20
        assert labels[target_y,target_x] == labels[y,x], ('Full-foot lane disconnected', key, target_y)
    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
        assert all(full_foot(actual,px,x+dx*t,y+dy*t) for t in np.linspace(0,1.7472*px,300)), ('Short independent excursion', key, dx,dy)
    gap = .9*actor*px
    mx,my = x-2/math.sqrt(5)*gap,y+1/math.sqrt(5)*gap
    assert all(full_foot(actual,px,x+(mx-x)*t,y+(my-y)*t) for t in np.linspace(0,1,100)), ('Initial companion route', key)
    assert not (x0 <= mx <= x1 and y0 <= my <= y1)

assert digest('docs/art/map-expansion/desert-10.png') == basin['source']['artSha256']
assert scenes['desert_wind_basin']['tintActors'] is False
assert scenes['desert_wind_basin']['tintWorld'] is False
assert not scenes['desert_wind_basin'].get('occluders')
print('PASS: original 02 map and all old scenes preserved; exact original masks/art; full-foot lanes, short moves, follower seed, fixed reciprocal outer-edge route; 20 inactive')

