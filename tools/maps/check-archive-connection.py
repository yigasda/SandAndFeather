"""Bounded static regression for the 17 plaza / 18 archive doorway (run after desert.py)."""
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
def mask_of(data):
    p = data['authoredCollision']['pixelWalk']
    out = np.zeros((p['height'], p['width']), dtype=bool)
    for y, row in enumerate(p['rows']):
        for a, b in zip(row[::2], row[1::2]):
            out[y, a:b] = True
    return out
def safe_of(mask, px):
    x = math.ceil(.28 * px)
    return nd.minimum_filter(mask.astype('uint8'),
        size=(math.ceil(.18*px) + math.ceil(.16*px) + 1, 2*x + 1),
        mode='constant', cval=0).astype(bool)

archive = read('data/maps/desert_city_archive.json')
plaza = read('data/maps/desert_city_plaza.json')
scene = read('data/scene-art.json')['desert_city_archive']
source = archive['source']
assert source['artSha256'] == '9b94310e04a93a9dc9e1230ed51e073d6cfc4611c3ce4b2967a48b252509d1ab'
assert source['collisionSha256'] == '84975e2b0aea877d62af70ffec5ab0fa2ba5be9160f369931576e008e9f43d32'
assert digest(source['art']) == source['artSha256'] == digest('docs/art/map-expansion/desert-18.png')
assert digest(source['collision']) == source['collisionSha256']
original = np.asarray(Image.open(ROOT / source['collision']).convert('RGBA'))[..., 3] >= 128
actual = mask_of(archive)
expected = original.copy()
expected[627:663, 779:993] = True
assert np.array_equal(actual, expected), 'Only the measured under-lintel rectangle may add floor'
assert int((actual & ~original).sum()) == 7013 and not np.any(original & ~actual)
assert source['runtimePassages'][0]['box'] == [779, 627, 993, 663]
labels, _ = nd.label(original)
assert labels[590, 887] != labels[750, 887], 'Source mask disconnect must remain documented'
safe = safe_of(actual, archive['authoredCollision']['pixelWalk']['pixelsPerTile'])
labels, _ = nd.label(safe)
assert labels[590, 887] and labels[590, 887] == labels[790, 887]
for x in [802, 887, 973]:
    assert np.all(safe[590:792, x]), ('Full feet must pass the doorway at each lane', x)
for x, y in [(760,720), (1010,720), (600,430), (1000,180)]:
    assert not actual[y, x], ('Posts, table and shelves remain solid', x, y)
assert scene['occluders'] == [{'foot':802, 'polygon':[[744,627],[1028,627],[1028,662],[744,662]]}]
assert archive['cameraScale'] == plaza['cameraScale'] == .8
assert archive['actorScale'] == plaza['actorScale'] == 1.4
assert archive['walkSpeed'] == plaza['walkSpeed'] == 1.6
assert scene['tintActors'] is False and scene['tintWorld'] is False

# No change to the plaza floor, approved east arrival, dwelling arrival or original thresholds.
plaza_original = np.asarray(Image.open(ROOT / plaza['source']['collision']).convert('RGBA'))[..., 3] >= 128
assert np.array_equal(mask_of(plaza), plaza_original)
plaza_safe = safe_of(plaza_original, plaza['authoredCollision']['pixelWalk']['pixelsPerTile'])
for x in [1246, 1278, 1318]:
    assert np.all(plaza_safe[307:416, x]), ('Plaza full-foot approach', x)
assert [e['id'] for e in plaza['exits']] == ['east','dwelling','archive']
# Exact approved baseline records, not just their names.
assert {k: plaza['entries'][k] for k in ['east', 'dwelling']} == {"east":{"x":47.877884615384616,"y":16.190384615384616,"dir":"left"},"dwelling":{"x":18.129807692307693,"y":11.123076923076923,"dir":"down"}}
assert plaza['exits'][:2] == [{"id":"east","x0":52.28269230769231,"y0":12.817307692307693,"x1":52.84903846153846,"y1":15.350961538461538,"to":"desert_forecourt_east","at":"south","polygon":[[52.28269230769231,12.817307692307693],[52.84903846153846,12.817307692307693],[52.84903846153846,15.350961538461538],[52.28269230769231,15.350961538461538]]},{"id":"dwelling","x0":17.586538461538463,"y0":9.001923076923077,"x1":19.255769230769232,"y1":9.449038461538462,"to":"desert_city_dwelling","at":"south","polygon":[[17.586538461538463,9.001923076923077],[18.927884615384617,9.001923076923077],[19.255769230769232,9.449038461538462],[17.586538461538463,9.449038461538462]]}]
for data, entry, pixels, dest, at in [
    (archive, 'south', (887,590), 'desert_city_plaza', 'archive'),
    (plaza, 'archive', (1278,415), 'desert_city_archive', 'south'),
]:
    px = data['authoredCollision']['pixelWalk']['pixelsPerTile']
    p = data['entries'][entry]
    assert abs((p['x'] + .5)*px - pixels[0]) < 1e-6
    assert abs((p['y'] + .8)*px - pixels[1]) < 1e-6
    ex = next(e for e in data['exits'] if e['id'] == entry)
    assert ex['to'] == dest and ex['at'] == at
    expected_polygon = ([(779,782),(993,782),(993,802),(779,802)] if entry == 'south'
                        else [(1228,300),(1333,300),(1333,315),(1220,315)])
    assert ex['polygon'] == [[x/px, y/px] for x, y in expected_polygon]
    assert p['dir'] == ('up' if entry == 'south' else 'down')
print('PASS: exact 7,013-pixel additive aperture, original assets/floor preserved, full-foot lanes, solid posts/furniture, reciprocal exits and fixed landings')
