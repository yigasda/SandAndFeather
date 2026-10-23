"""Read-only static invariants for T3 north <-> 16 south.

Run against a complete checkout AFTER its separately authorized desert.py generation:
    python tools/maps/check-lightwell-connection.py [--require-guardian]

This checker never imports the generator/game, writes files, invokes Git, or uses
the network. Exit 0 means ONLY that these static invariants hold. It is not a
gameplay, save/load, combat, foreground, camera, or release-readiness certificate.
Without --require-guardian an intentionally incomplete scaffold is accepted, but
is explicitly labelled NOT PLAYABLE when its guardian definition/spawn is absent.

Preservation baseline: 50399fda9ac5193cd8a033610a1973af7662c80d. Inventory digests
were computed from that commit's complete Git tree, not from generated output.
Do not refresh these baselines merely to make an unexpected change pass.
"""
import argparse
import copy
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd


ROOT = Path(__file__).resolve().parents[2]
BASELINE = '50399fda9ac5193cd8a033610a1973af7662c80d'
PX = 52 / 1.55
ACTOR = 1.4
SHORT_TILES = 1.7472  # 260ms * 4.2 tiles/s * map walkSpeed 1.6
FIRST_DEFEAT = 't3.warden.1'
GUARDIAN_KIND = 'desert_temple_warden'
GATE = 'desert_guardian_gate'
LIGHTWELL = 'desert_lightwell'
GATE_PATH = f'data/maps/{GATE}.json'
LIGHTWELL_PATH = f'data/maps/{LIGHTWELL}.json'

BASE_GATE = '6f578a177f888c4173ad08c1edb2eb0d87559b7c6aa07898de176fd473985af7'
BASE_SCENES = 'e204ba1111243222f321b5cc3576d9d8891aba05ffbc266687643f73760ed45d'
BASE_COMBAT = '468eda37957836d51e1b36d19aa8a98aef28934606d5c16f0d5328e6fa627fc3'
# Each digest is SHA-256(canonical JSON {repository-relative path: Git blob SHA}).
# Counts are independent guards against empty/partial checkouts and omitted files.
BASE_INVENTORIES = {
    'old maps': (39, 'efc95dc8f14661616aaf4feb9eeb832413137b1172b4944bcda0eaf75c1b38cc'),
    'original desert sources': (83, 'cd49ed600e2233d9fa928a0202363e90d70bfb52d3505b059048723a996d839f'),
    'old map artwork': (122, 'a1e18bd189ef460f637014d13360a96e21d450ff2b3614b0232fd930558eb80c'),
}
# These source contracts underpin the feet, follower prediction, and existing
# progression format. The new gate must use the existing first-defeat ledger.
UNCHANGED_BLOBS = {
    "data/sprites.json": "22176ba8e53636c01cd7b8b7923dbec619e3b2a0",
    "data/art/enemies/desert-temple-warden.png": "04b3ac7dcd618e41ce844990678027fdc60cba6b",
    "몹/사막/10_신전수문장/00_idle_0.png": "e89c3fee7d4804c8705a829915efa63064f50b29",
    "몹/사막/10_신전수문장/01_idle_1.png": "5d41e21889bcdd112475ea3037b74b4967a09ee0",
    "몹/사막/10_신전수문장/02_idle_2.png": "0a7ec29e81356cf76e3a968e964130fc78d0ab00",
    "몹/사막/10_신전수문장/03_guard.png": "cf351f48d484e0287437e962d7da13e75f4ab673",
    "몹/사막/10_신전수문장/04_prepare_0.png": "ebfeb2ecd6a70a1c1f05592420e6ff01b5701d1d",
    "몹/사막/10_신전수문장/05_prepare_1.png": "909cfc737c19c08a7789e391b7801c219b24ed83",
    "몹/사막/10_신전수문장/06_crush_0.png": "b24f8f0bd0d149a54552a7336df216a0801758e8",
    "몹/사막/10_신전수문장/07_crush_1.png": "3d89c7b32b7b9f6db18c21825539321fa15d7290",
    "몹/사막/10_신전수문장/08_hit.png": "b91c1bec64be1f3ee1d022cde79de7a65bb10515",
    "몹/사막/10_신전수문장/09_defeat.png": "bec9a4764cf98f002b8716c6d844cf6d89c1d850",
    "몹/사막/10_신전수문장/manifest.json": "e6b84811b345a9929ce038de7fd39e6cd6fedcd8",
    'src/world/player.js': 'f53476aee39535e3312c5757b216c69c67d75e3a',
    'src/core/state.js': 'e8d9f383e497e4f758be83f95ddec8a8674af42b',
    'tools/maps/desert-registry.json': '1640839d46645455bafda412b3f012248c51eefd',
    'tools/maps/desert-mobs.json': '64ae4acb503abec60a45eee3ce5d5fa261ba5b7a',
}
SPECS = [
    {
        'id': GATE, 'entry': 'north', 'to': LIGHTWELL, 'at': 'south',
        'file': 'T3_신전수호문전당.png', 'copy': 'desert-T3.png',
        'art': 'ae87479081fe61acb53ba9f9e3bd51dc8f6079bf6fc1f6346ecd02ce7e0a4633',
        'mask': '35ae344ecc8ee36a6651898ee622ae22e420441ab01e4b34a9f0c2d293c4c786',
        'polygon': [(416, 410), (606, 410), (606, 440), (415, 440)],
        'landing': (512, 535), 'direction': 'down',
        'lanes': [(426, 425), (511, 425), (596, 425)],
        'interior': (512, 780),
    },
    {
        'id': LIGHTWELL, 'entry': 'south', 'to': GATE, 'at': 'north',
        'file': '16_빛우물.png', 'copy': 'desert-16.png',
        'art': '4c989a8bbe359268dc9c04d140e3495b3c673bdec4dcbbdcc73642d0eba2b29b',
        'mask': '736605450ed188fba05d05e5a3c7f3fec4c372f52ec40950777eb3ed5a4e20a2',
        'polygon': [(366, 1510), (658, 1510), (659, 1535), (365, 1535)],
        'landing': (512, 1420), 'direction': 'up',
        'lanes': [(380, 1520), (512, 1520), (646, 1520)],
        'interior': (512, 1050),
    },
]


class CheckFailure(Exception):
    """An invariant failed; unlike assert, this remains active with python -O."""


def require(condition, message):
    if not condition:
        raise CheckFailure(message)


def reject_constant(value):
    raise CheckFailure(f'Non-finite JSON number: {value}')


def unique_object(pairs):
    out = {}
    for key, value in pairs:
        require(key not in out, f'Duplicate JSON key: {key}')
        out[key] = value
    return out


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'),
                      object_pairs_hook=unique_object, parse_constant=reject_constant)


def canonical(value):
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True,
                         separators=(',', ':'), allow_nan=False).encode('utf-8')
    return hashlib.sha256(encoded).hexdigest()


def file_hash(path, algorithm='sha256', git_blob=False):
    path = ROOT / path
    require(path.is_file() and not path.is_symlink(), f'Missing/non-regular file: {path}')
    h = hashlib.new(algorithm)
    if git_blob:
        h.update(f'blob {path.stat().st_size}\0'.encode('ascii'))
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def inventory(paths, ignored=()):
    result = {}
    for path in paths:
        if path.is_dir():
            continue
        relative = path.relative_to(ROOT).as_posix()
        if relative not in ignored:
            result[relative] = file_hash(relative, 'sha1', git_blob=True)
    return result


def check_preservation():
    inventories = {
        'old maps': inventory((ROOT / 'data/maps').rglob('*'),
                              {GATE_PATH, LIGHTWELL_PATH}),
        'original desert sources': inventory((ROOT / '사막맵').rglob('*')),
        'old map artwork': inventory((ROOT / 'docs/art/map-expansion').glob('*'),
                                     {'docs/art/map-expansion/desert-16.png'}),
    }
    for label, actual in inventories.items():
        count, expected = BASE_INVENTORIES[label]
        require(len(actual) == count and canonical(actual) == expected,
                f'{label}: files were added, removed, or changed relative to {BASELINE}')
    for path, expected in UNCHANGED_BLOBS.items():
        require(file_hash(path, 'sha1', git_blob=True) == expected,
                f'Unreviewed change to static-check contract: {path}')


def mask_of(data):
    p = data['authoredCollision']['pixelWalk']
    require(type(p['width']) is int and type(p['height']) is int,
            f"{data['id']}: pixel dimensions must be integers")
    require((p['width'], p['height']) == (1024, 1536),
            f"{data['id']}: original 1024 x 1536 dimensions changed")
    require(p['pixelsPerTile'] == PX, f"{data['id']}: detail scale changed")
    require(len(p['rows']) == p['height'], f"{data['id']}: missing/extra RLE rows")
    mask = np.zeros((p['height'], p['width']), dtype=bool)
    for y, row in enumerate(p['rows']):
        require(isinstance(row, list) and len(row) % 2 == 0,
                f"{data['id']}: malformed RLE row {y}")
        previous = -1
        for start, end in zip(row[::2], row[1::2]):
            require(type(start) is int and type(end) is int
                    and 0 <= start < end <= p['width'] and start > previous,
                    f"{data['id']}: invalid/overlapping/noncanonical RLE run on row {y}")
            mask[y, start:end] = True
            previous = end
    return mask


def runs_of(mask):
    """Independent canonical encoding, not an import of generator code."""
    result = []
    for row in mask:
        padded = np.r_[False, row, False].astype(np.int8)
        result.append(np.flatnonzero(np.diff(padded)).tolist())
    return result


def expected_entry(spec):
    x, y = spec['landing']
    return {'x': x / PX - .5, 'y': y / PX - .8, 'dir': spec['direction']}


def expected_exit(spec):
    xs, ys = zip(*spec['polygon'])
    result = {'id': spec['entry'], 'x0': min(xs) / PX, 'y0': min(ys) / PX,
              'x1': max(xs) / PX, 'y1': max(ys) / PX,
              'to': spec['to'], 'at': spec['at'],
              'polygon': [[x / PX, y / PX] for x, y in spec['polygon']]}
    if spec['id'] == GATE:
        result['requiresFirstDefeat'] = FIRST_DEFEAT
    return result


def expected_source(spec):
    return {'art': f"사막맵/{spec['file']}", 'artSha256': spec['art'],
            'collision': f"사막맵/충돌/{spec['file']}", 'collisionSha256': spec['mask'],
            'floorAlphaAtLeast': 128}


def covers(polygon, point):
    """Inclusive point-in-polygon, independent of the game's polygon helper."""
    x, y = point
    inside = False
    for a, b in zip(polygon, polygon[1:] + polygon[:1]):
        cross = (x - a[0]) * (b[1] - a[1]) - (y - a[1]) * (b[0] - a[0])
        if abs(cross) < 1e-8 and min(a[0], b[0]) <= x <= max(a[0], b[0]) \
                and min(a[1], b[1]) <= y <= max(a[1], b[1]):
            return True
        if (a[1] > y) != (b[1] > y) \
                and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
            inside = not inside
    return inside


def polygons_overlap(a, b):
    """Separating-axis test for the convex thresholds and foot rectangles."""
    for polygon in (a, b):
        for p, q in zip(polygon, polygon[1:] + polygon[:1]):
            nx, ny = -(q[1] - p[1]), q[0] - p[0]
            aa = [x * nx + y * ny for x, y in a]
            bb = [x * nx + y * ny for x, y in b]
            if max(aa) < min(bb) - 1e-8 or max(bb) < min(aa) - 1e-8:
                return False
    return True


def convex_hull(points):
    """Hull of the two endpoint footprints = their continuous swept envelope."""
    points = sorted(set(points))

    def cross(a, b, c):
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

    def half(sequence):
        hull = []
        for point in sequence:
            while len(hull) >= 2 and cross(hull[-2], hull[-1], point) <= 0:
                hull.pop()
            hull.append(point)
        return hull

    return half(points)[:-1] + half(reversed(points))[:-1]


def foot_bounds(point):
    x, y = point
    # player.js FOOT: x .22..78, y .62..96, relative to feet (.5,.8).
    # actorScale affects the visual and companion gap, NOT the player's collider.
    return x - .28 * PX, y - .18 * PX, x + .28 * PX, y + .16 * PX


def foot_polygon(point):
    x0, y0, x1, y1 = foot_bounds(point)
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def full_foot(mask, point):
    x0, y0, x1, y1 = foot_bounds(point)
    # Deliberately conservative: round the far edges outward by at most one
    # pixel, stricter than runtime solidRect's floor/floor endpoint convention.
    left, top, right, bottom = math.floor(x0), math.floor(y0), math.ceil(x1), math.ceil(y1)
    return (0 <= left <= right < mask.shape[1] and 0 <= top <= bottom < mask.shape[0]
            and bool(mask[top:bottom + 1, left:right + 1].all()))


def sweep_positions(start, end):
    """Visit all footprint pixel states, not merely a fixed sampling interval.

    A translated axis-aligned foot changes covered pixels only when one of its
    four edges crosses an integer source-pixel boundary. Test every crossing,
    both endpoints, and one midpoint in every constant-coverage open interval.
    """
    times = {0.0, 1.0}
    for a, b in zip(foot_bounds(start), foot_bounds(end)):
        if a == b:
            continue
        for boundary in range(math.ceil(min(a, b)), math.floor(max(a, b)) + 1):
            t = (boundary - a) / (b - a)
            if 0 < t < 1:
                times.add(t)
    ordered = sorted(times)
    times.update((a + b) / 2 for a, b in zip(ordered, ordered[1:]))
    for t in sorted(times):
        yield (start[0] + (end[0] - start[0]) * t,
               start[1] + (end[1] - start[1]) * t)


def check_path(mask, start, end, label, avoid=()):
    swept = convex_hull(foot_polygon(start) + foot_polygon(end))
    for polygon in avoid:
        require(not polygons_overlap(swept, polygon),
                f'{label}: continuous full-foot sweep touches an exit')
    for point in sweep_positions(start, end):
        require(full_foot(mask, point), f'{label}: blocked full foot at {point}')


def safe_of(mask):
    radius = math.ceil(.28 * PX)
    return nd.minimum_filter(mask.astype(np.uint8),
                             size=(math.ceil(.18 * PX) + math.ceil(.16 * PX) + 1,
                                   2 * radius + 1), mode='constant', cval=0).astype(bool)


def check_geometry(data, spec):
    ident = spec['id']
    require(data['source'] == expected_source(spec),
            f'{ident}: source/mask/threshold changed or runtime floor patch added')
    for key in ('art', 'collision'):
        path = data['source'][key]
        require(file_hash(path) == data['source'][key + 'Sha256'],
                f'{ident}: original {key} bytes changed')
        with Image.open(ROOT / path) as image:
            require(image.size == (1024, 1536), f'{ident}: image dimensions changed')
    require(file_hash(f"docs/art/map-expansion/{spec['copy']}") == spec['art'],
            f'{ident}: runtime art must be a byte-identical copy of adopted artwork')
    with Image.open(ROOT / data['source']['collision']) as image:
        original = np.asarray(image.convert('RGBA'))[..., 3] >= 128
    actual = mask_of(data)
    require(np.array_equal(actual, original),
            f'{ident}: EVERY original collision pixel must be preserved, with no additions')
    require(data['cameraScale'] == .8 and data['actorScale'] == ACTOR
            and data['walkSpeed'] == 1.6, f'{ident}: detail camera/actor/speed changed')
    require(data['entries'][spec['entry']] == expected_entry(spec),
            f'{ident}: source-feet landing or facing changed')
    exits = [e for e in data['exits'] if e['id'] == spec['entry']]
    require(exits == [expected_exit(spec)], f'{ident}: threshold/AABB/destination/gate changed')

    polygon = spec['polygon']
    xs, ys = zip(*polygon)
    covered = 0
    for y in range(min(ys), max(ys) + 1):
        for x in range(min(xs), max(xs) + 1):
            if covers(polygon, (x + .5, y + .5)):
                covered += 1
                require(original[y, x], f'{ident}: blocked polygon pixel ({x},{y})')
    require(covered > 0, f'{ident}: empty polygon coverage')
    raster = Image.new('1', (1024, 1536))
    ImageDraw.Draw(raster).polygon(polygon, fill=1)
    require(not np.any(np.asarray(raster) & ~original),
            f'{ident}: conservative inclusive portal raster crosses blocked pixels')

    all_polygons = [[(x * PX, y * PX) for x, y in e['polygon']] for e in data['exits']]
    landing = spec['landing']
    labels, _ = nd.label(safe_of(original))
    component = labels[landing[1], landing[0]]
    require(component != 0, f'{ident}: landing has no full-foot-connected floor')
    for target in [*spec['lanes'], spec['interior']]:
        require(labels[target[1], target[0]] == component,
                f'{ident}: full-foot approach disconnected at {target}')
        check_path(original, landing, target, f'{ident} approach {target}')
    for target in spec['lanes']:
        require(covers(polygon, target), f'{ident}: approach endpoint does not reach threshold')

    # Current seedTrail's FIRST lower-left choice. A different fallback would
    # need its own evidence; do not silently move the player or the companion.
    gap = .9 * ACTOR * PX
    follower = (landing[0] - 2 * gap / math.sqrt(5), landing[1] + gap / math.sqrt(5))
    check_path(original, landing, follower, f'{ident} companion seed', all_polygons)
    length = SHORT_TILES * PX
    for name, dx, dy in [('up', 0, -1), ('down', 0, 1), ('left', -1, 0), ('right', 1, 0)]:
        target = (landing[0] + dx * length, landing[1] + dy * length)
        check_path(original, landing, target,
                   f'{ident} independent {SHORT_TILES}-tile {name}', all_polygons)
        # Geometric trailing route while the player makes that one excursion:
        # seed -> landing -> same trail, a gap behind. This is a static envelope,
        # NOT a claim that frame sampling, held input, or NPC dynamics were run.
        check_path(original, follower, landing, f'{ident} follower {name} seed', all_polygons)
        follower_end = (landing[0] + dx * max(0, length - gap),
                        landing[1] + dy * max(0, length - gap))
        check_path(original, landing, follower_end, f'{ident} follower {name} trail', all_polygons)
    return original


def check_combat():
    combat = read('data/desert.json')
    old = copy.deepcopy(combat)
    enemy = old['enemies'].pop(GUARDIAN_KIND, None)
    encounter = old['maps'].pop(GATE, None)
    require(canonical(old) == BASE_COMBAT, 'Existing combat definitions/spawns/settings changed')
    if enemy is None and encounter is None:
        return False
    require(isinstance(enemy, dict) and bool(enemy), 'Guardian spawn lacks its enemy definition')
    require(isinstance(encounter, dict) and set(encounter) == {'spawns'},
            'T3 combat config must contain only its single approved encounter')
    spawns = encounter['spawns']
    require(isinstance(spawns, list) and len(spawns) == 1, 'T3 must have exactly one guardian spawn')
    spawn = spawns[0]
    require(set(spawn) == {'id', 'kind', 'x', 'y'} and spawn['id'] == FIRST_DEFEAT
            and spawn['kind'] == GUARDIAN_KIND, 'Guardian identity must match the first-defeat gate')
    require(all(type(spawn[key]) in (int, float) and math.isfinite(spawn[key]) for key in ('x', 'y')),
            'Guardian spawn coordinates must be finite')
    require(spawn['x'] == 512 / PX - .5 and spawn['y'] == 955 / PX - .8,
            'Guardian initial feet must preserve measured arrival visibility at (512,955)')
    require(enemy.get('attack') == 'slam' and 'dash' not in enemy and 'bolt' not in enemy,
            'Guardian must use actual measured compression, not a borrowed dash/projectile')
    require(enemy.get('wander') is False,
            'Unengaged guardian must not wander into the visually protected arrivals')
    mask = mask_of(read(GATE_PATH))
    require(full_foot(mask, (512,955)), 'Guardian spawn full footprint is blocked')
    # Initial balance is provisional; actual hit/frame/timing and victory-to-open
    # behavior belong to the dedicated real-input test, not this static report.
    return True


def main(require_guardian=False):
    check_preservation()
    gate, lightwell = read(GATE_PATH), read(LIGHTWELL_PATH)
    scenes = read('data/scene-art.json')

    require(list(gate['entries']) == ['south', 'north'], 'T3 must preserve south and add only north')
    require([e['id'] for e in gate['exits']] == ['south', 'north'],
            'T3 side holes must remain inactive; preserve old south exit order')
    old_gate = copy.deepcopy(gate)
    old_gate['entries'].pop('north')
    old_gate['exits'].pop()
    require(canonical(old_gate) == BASE_GATE, 'T3 changed beyond its single new north entry/exit')
    require('requiresFirstDefeat' not in gate['exits'][0], 'Existing T3 south escape must remain unrestricted')
    old_scenes = copy.deepcopy(scenes)
    require(LIGHTWELL in old_scenes, 'Lightwell scene is missing')
    scene = old_scenes.pop(LIGHTWELL)
    require(canonical(old_scenes) == BASE_SCENES, 'Existing scene artwork/settings/occluders changed')
    expected_scene = copy.deepcopy(old_scenes[GATE])
    expected_scene['file'] = '../docs/art/map-expansion/desert-16.png'
    require(scene == expected_scene, 'Lightwell scene scale/crop/tint changed or guessed occluders added')

    gate_mask = check_geometry(gate, SPECS[0])
    lightwell_mask = check_geometry(lightwell, SPECS[1])
    expected = copy.deepcopy(old_gate)
    expected.update({'id': LIGHTWELL, 'name': '신전의 빛 우물', 'referenceScenes': [LIGHTWELL],
                     'entries': {'south': expected_entry(SPECS[1])},
                     'spawn': expected_entry(SPECS[1]), 'exits': [expected_exit(SPECS[1])],
                     'source': expected_source(SPECS[1])})
    expected['authoredCollision']['pixelWalk']['rows'] = runs_of(lightwell_mask)
    require(lightwell == expected,
            'Lightwell changed beyond its approved single south return; no reward-niche exit, overlays, or invented content')

    # North and old south must still share real full-foot-connected T3 floor.
    labels, _ = nd.label(safe_of(gate_mask))
    require(labels[535, 512] != 0 and labels[535, 512] == labels[1420, 512],
            'T3 north landing no longer connects to the preserved south approach')

    guardian_present = check_combat()
    print(f'STATIC INVARIANTS OK against {BASELINE}: old maps/scenes/art preserved; '
          'exact source masks; reciprocal polygons; full-foot approaches, follower seed '
          f'and {SHORT_TILES}-tile excursions; first-defeat metadata only on T3 north.')
    if not guardian_present:
        print('NOT PLAYABLE: guardian definition/spawn absent; ordinary play cannot create '
              f'desertFight.first["{FIRST_DEFEAT}"]. Scaffold only.')
    else:
        print('GUARDIAN DATA PRESENT: exact spawn ID and preservation verified; '
              'attack behavior and victory-to-unlock progression are NOT verified here.')
    print('NOT A GAMEPLAY PASS: run pure gate/combat tests and actual bidirectional walking, '
          'held/neutral-input rearm, day-0/permanent unlock, daily respawn, save/load, '
          'follower, camera, and foreground checks before any readiness claim.')
    if require_guardian and not guardian_present:
        return 2
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-guardian', action='store_true',
                        help='Return exit 2 if combat definition/spawn is still absent (not a gameplay proof).')
    args = parser.parse_args()
    try:
        sys.exit(main(args.require_guardian))
    except (CheckFailure, OSError, ValueError, KeyError, TypeError, IndexError) as error:
        print(f'STATIC CHECK FAILED: {error}', file=sys.stderr)
        sys.exit(1)
