"""Desert maps (사막맵/, approved art 34 places / 40 PNG). One map a picture, the Duat way (tools/maps/duat.py):
the picture is copied byte for byte, the floor is the user's own collision picture.

The collision pictures (사막맵/충돌/, from the user's Google Drive folder '사막맵 충돌') are transparent PNGs the size of
the art: the painted part (one flat colour) is where the feet may go, the clear part is dunes, walls, stones. The
painted edge is soft; a pixel is floor when its alpha is at least ALPHA (half). Nothing is redrawn or resized.

Scale: PX source pixels a tile, 44 % of the Duat's, so the characters stand very small in these wide places (user: "초대형
맵이니까 캐릭터가 ㅈㄴ 작았으면... 두아트처럼", then "44%" after seeing the Duat scale).

Only the places with a collision picture and a decided way in are built (user: one stretch at a time):
  desert_01 황금 사구해 — in from Ombos (the east edge of the village, right of the riverside palms), out on its west
  edge where the paved path starts below the ruined colonnade (user's picture).
Requires shapely and scipy (duat-pixel.py)."""
import hashlib, json, math, shutil
from pathlib import Path
import importlib.util
import numpy as np
from PIL import Image
import residence as R
_spec = importlib.util.spec_from_file_location("duat_pixel", Path(__file__).with_name("duat-pixel.py"))
P = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(P)
ROOT = Path(R.ROOT)
# the Duat's tile (52/1.55 source px) × 0.44: the characters stand at 44 % of their Duat size against the art (user: "44%")
PX = 52 / 1.55 * 0.44
ALPHA = 128
SRC = ROOT / '사막맵'
OUT_ART = ROOT / 'docs/art/map-expansion'
REVIEW = ROOT / 'docs/consult/desert/maps'
# Ombos: the landing when coming back (just inside the east edge, on the grass) and the exit rectangle (tiles of ombos.json)
OMBOS_BACK = {'x': 39.6, 'y': 22.4, 'dir': 'left'}

# id, name, art file, collision file, ways in {name: (source px, facing)}, exits [(name, source box x0,y0,x1,y1, to, at)]
PLACES = [
    ('desert_01', '황금 사구해', '01_황금사구해_닫힘.png', '01.png',
     {'west': ((42, 265), 'right')},
     [('west', (0, 150, 14, 300), 'ombos', OMBOS_BACK)]),
]


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def main():
    manifest = {f['file']: f for f in json.loads((SRC / 'manifest.json').read_text())['files']}
    art = json.loads((ROOT / 'data/scene-art.json').read_text())
    REVIEW.mkdir(parents=True, exist_ok=True)
    for ident, name, file, coll, ways, exits in PLACES:
        src = SRC / file
        assert sha(src) == manifest[file]['sha256'], f'{file}: not the approved picture'
        image = Image.open(src).convert('RGB'); w, h = image.size
        cimg = Image.open(SRC / '충돌' / coll)
        assert cimg.size == (w, h), f'{coll}: collision {cimg.size} is not the art size {(w, h)}'
        mask = np.asarray(cimg.convert('RGBA'))[..., 3] >= ALPHA
        safe = P.safe_centres(mask, PX)
        out_file = f'desert-{ident[7:]}.png'; shutil.copyfile(src, OUT_ART / out_file)
        entries = {}
        for k, ((x, y), facing) in ways.items():
            assert safe[y, x], f'{ident} {k}: landing {x},{y} is not on the floor'
            entries[k] = {'x': x / PX - .5, 'y': y / PX - .8, 'dir': facing}
        # every way in reaches every other and the middle of the floor (the largest piece of it)
        from scipy import ndimage as nd
        lab, n = nd.label(safe); big = np.argmax(np.bincount(lab.ravel())[1:]) + 1
        for k, ((x, y), _) in ways.items():
            assert lab[y, x] == big, f'{ident} {k}: landing is cut off from the main floor'
        ys, xs = np.nonzero(lab == big); mid = (int(xs[len(xs) // 2]), int(ys[len(ys) // 2]))
        first = next(iter(ways.values()))[0]
        route, steps = P.path(safe, first, mid)
        P.review(image, mask, route, REVIEW, int(ident[7:]) if ident[7:].isdigit() else 0)
        ex = [{'id': k, 'x0': b[0] / PX, 'y0': b[1] / PX, 'x1': b[2] / PX, 'y1': b[3] / PX, 'to': to, 'at': at} for k, b, to, at in exits]
        W, H = math.ceil(w / PX), math.ceil(h / PX)
        data = {'id': ident, 'name': name, 'tile': 16, 'scene': 'desert', 'referenceScenes': [ident], 'legend': {'.': {'t': 'sand'}},
                'rows': ['.' * W] * H,
                'authoredCollision': {'width': W * PX, 'height': H * PX, 'shapes': [],
                                      'pixelWalk': {'width': w, 'height': h, 'pixelsPerTile': PX, 'rows': P.runs(mask)}},
                'entries': entries, 'spawn': next(iter(entries.values())), 'exits': ex, 'spots': [], 'spawns': [], 'roam': [], 'labels': [],
                'note': '모래 너머로 옴보스가 보여. 왼쪽 길로 돌아갈 수 있어.',
                'source': {'art': f'사막맵/{file}', 'artSha256': manifest[file]['sha256'], 'collision': f'사막맵/충돌/{coll}',
                           'collisionSha256': sha(SRC / '충돌' / coll), 'floorAlphaAtLeast': ALPHA}}
        (ROOT / f'data/maps/{ident}.json').write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
        art[ident] = {'file': R.ART + out_file, 'fullMap': True, 'lazy': True, 'origin': [0, 0], 'scale': [16 / PX] * 2,
                      'day': [0, 0, w, h], 'night': [0, 0, w, h], 'clip': [[0, 0], [w, 0], [w, h], [0, h]], 'tintActors': False, 'tintWorld': False}
        print(ident, f'{w}x{h} px = {W}x{H} tiles, floor {mask.mean() * 100:.1f} %, path to middle {steps} px')
    (ROOT / 'data/scene-art.json').write_text(R.dump(art) + '\n')


if __name__ == '__main__':
    main()
