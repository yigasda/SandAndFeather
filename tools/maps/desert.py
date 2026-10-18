"""Desert maps (사막맵/, approved art 34 places / 40 PNG). One map a picture, the Duat way (tools/maps/duat.py):
the picture is copied byte for byte, the floor is the user's own collision picture.

The collision pictures (사막맵/충돌/, from the user's Google Drive folder '사막맵 충돌') are transparent PNGs the size of
the art: the painted part (one flat colour) is where the feet may go, the clear part is dunes, walls, stones. The
painted edge is soft; a pixel is floor when its alpha is at least ALPHA (half). Nothing is redrawn or resized.

Scale: px_of(id) source pixels a tile, by kind of map (SCALE below).

Only the places with a collision picture and a decided way in are built (user: one stretch at a time):
  desert_01 황금 사구해 — in from Ombos (the east edge of the village, right of the riverside palms), out on its west
  edge where the paved path starts below the ruined colonnade (user's picture); its lower right sand leads on east.
  desert_04 메마른 모래벌판, desert_03 고요한 사구 — the guide's way from 01 to 02, edge to edge (collision pictures made
  by tools/maps/desert-collision.py to the user's rules: user "니가 충돌 만들어 하나하나 내가 그린 퀄리티대로").
  desert_02 매몰 신전 사막 — in from 03 on its left edge; its lower right stone door goes down to desert_11.
  desert_11 매몰 도시의 출입구 → desert_17 잊힌 지하 도시의 광장 (detail maps, the Duat's scale until the user picks theirs).
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
# Two kinds of desert map, two scales (user: "사막 세부맵이랑 대형맵은 비율 다르게 해야돼"). The four 대형맵 (01 황금 사구해,
# 02 매몰 신전 사막, 03 고요한 사구, 04 메마른 모래벌판; docs/ASTRA-DESERT-05-20-GUIDE.md "대형맵 네 곳") show a whole region,
# so the characters stand at 44 % of their Duat size against the art (user: "44%"). The 세부맵 (every other place: a
# building's approach, a hall, a room) are drawn closer; until the user picks their scale they take the Duat's own.
DUAT_PX = 52 / 1.55
BIG = {'desert_01', 'desert_02', 'desert_03', 'desert_04'}
SCALE = {'big': 0.44, 'detail': 1.0}
def px_of(ident): return DUAT_PX * SCALE['big' if ident in BIG else 'detail']
# the big maps are wide at 44 %: walking is 1.4 times as quick there, the walking pictures with it (user: "1, 1.4", then "1.25배로 하자", then "1.4로 늘리고")
WALK = {'big': 1.4, 'detail': 1.0}
# the big maps' camera further out (user: "75", then "60%로 카메라") and the people a little larger than their tile so they
# are not specks (user: "캐릭터도 좀만 키우자", then "1.6"); src/world/render.js fitZoom / actorScale
CAMERA = {'big': 0.6, 'detail': 1.0}
ACTOR = {'big': 1.6, 'detail': 1.0}
ALPHA = 128
# collision pictures the user did not draw: made by tools/maps/desert-collision.py to the user's 01·02 rules
MADE = {'03_고요한사구_06통합.png', '04_메마른모래벌판.png'}
SRC = ROOT / '사막맵'
OUT_ART = ROOT / 'docs/art/map-expansion'
REVIEW = ROOT / 'docs/consult/desert/maps'
# Ombos: the landing when coming back (just inside the east edge, on the grass) and the exit rectangle (tiles of ombos.json)
OMBOS_BACK = {'x': 39.6, 'y': 22.4, 'dir': 'left'}

# id, name, art file, collision file, ways in {name: (source px, facing)}, exits [(name, source box x0,y0,x1,y1, to, at)]. The big maps run 01 → 04 → 03 → 02 across their side edges (docs/ASTRA-DESERT-05-20-GUIDE.md
# "01 황금 사구해 → 04 메마른 모래벌판 → 03 고요한 사구 → 02 매몰 신전 사막", no new road drawn). 02's temple door
# (T1W), its lower right stone exit (11) and its right side (10) wait for those places.
PLACES = [
    ('desert_01', '황금 사구해', '01_황금사구해_닫힘.png', '01.png',
     {'west': ((42, 265), 'right'), 'east': ((1556, 750), 'left')},
     [('west', (0, 150, 14, 300), 'ombos', OMBOS_BACK), ('east', (1572, 676, 1586, 822), 'desert_04', 'west')]),
    ('desert_04', '메마른 모래벌판', '04_메마른모래벌판.png', '04_메마른모래벌판.png',
     {'west': ((44, 700), 'right'), 'east': ((1730, 300), 'left')},
     [('west', (0, 366, 14, 884), 'desert_01', 'east'), ('east', (1760, 4, 1774, 590), 'desert_03', 'west')]),
    ('desert_03', '고요한 사구', '03_고요한사구_06통합.png', '03_고요한사구_06통합.png',
     {'west': ((44, 430), 'right'), 'east': ((1730, 505), 'left')},
     [('west', (0, 355, 14, 884), 'desert_04', 'east'), ('east', (1760, 450, 1774, 561), 'desert_02', 'west')]),
    ('desert_02', '매몰 신전 사막', '02_매몰신전사막.png', '02_매몰신전사막.png',
     # the west way out only where the paved path meets the edge, the door landing just inside the door (user's circle and mark)
     {'west': ((44, 330), 'right'), 'door': ((1486, 684), 'down')},
     [('west', (0, 188, 14, 425), 'desert_03', 'east'), ('door', (1484, 668, 1518, 684), 'desert_11', 'outside')]),
    # 11 매몰 도시의 출입구: 02 오른쪽 아래 야자수 사이 돌 문을 가까이 본 곳 (user: "누가 봐도 여기잖아"); 계단 위 문 → 17
    ('desert_11', '매몰 도시의 출입구', '11_매몰도시출입구.png', '11_매몰도시출입구.png',
     {'outside': ((300, 1350), 'up'), 'door': ((710, 390), 'down')},
     [('left', (0, 335, 14, 1536), 'desert_02', 'door'), ('bottom', (0, 1522, 644, 1536), 'desert_02', 'door'),
      ('door', (640, 312, 790, 340), 'desert_17', 'east')]),
    # 17 잊힌 지하 도시의 광장: 오른쪽 계단 위가 11의 문 (guide: 17 우측 계단); 왼쪽 집 주거실·오른쪽 집 18 기록고는 다음
    ('desert_17', '잊힌 지하 도시의 광장', '17_지하도시광장.png', '17_지하도시광장.png',
     {'east': ((1725, 505), 'left')},
     [('east', (1760, 402, 1774, 537), 'desert_11', 'door')]),
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
        PX = px_of(ident)
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
                'walkSpeed': WALK['big' if ident in BIG else 'detail'],
                'cameraScale': CAMERA['big' if ident in BIG else 'detail'], 'actorScale': ACTOR['big' if ident in BIG else 'detail'],
                'entries': entries, 'spawn': next(iter(entries.values())), 'exits': ex, 'spots': [], 'spawns': [], 'roam': [], 'labels': [],
                # no map-card text: nothing the user did not write (user: "안내 문구는 또 뭐야")
                'note': '',
                'source': {'art': f'사막맵/{file}', 'artSha256': manifest[file]['sha256'], 'collision': f'사막맵/충돌/{coll}',
                           'collisionSha256': sha(SRC / '충돌' / coll), 'floorAlphaAtLeast': ALPHA,
                           **({'collisionMadeBy': 'tools/maps/desert-collision.py'} if coll in MADE else {})}}
        (ROOT / f'data/maps/{ident}.json').write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
        art[ident] = {'file': R.ART + out_file, 'fullMap': True, 'lazy': True, 'origin': [0, 0], 'scale': [16 / PX] * 2,
                      'day': [0, 0, w, h], 'night': [0, 0, w, h], 'clip': [[0, 0], [w, 0], [w, h], [0, h]], 'tintActors': False, 'tintWorld': False}
        print(ident, f'{w}x{h} px = {W}x{H} tiles, floor {mask.mean() * 100:.1f} %, path to middle {steps} px')
    (ROOT / 'data/scene-art.json').write_text(R.dump(art) + '\n')


if __name__ == '__main__':
    main()
