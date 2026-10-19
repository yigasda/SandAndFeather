"""Desert maps (사막맵/, approved art 34 places / 40 PNG). One map a picture, the Duat way (tools/maps/duat.py):
the picture is copied byte for byte, the floor is the user's own collision picture.

The collision pictures (사막맵/충돌/, from the user's Google Drive folder '사막맵 충돌') are transparent PNGs the size of
the art: the painted part (one flat colour) is where the feet may go, the clear part is dunes, walls, stones. The
painted edge is soft; a pixel is floor when its alpha is at least ALPHA (half). Nothing is redrawn or resized.

Scale: px_of(id) source pixels a tile, by kind of map (SCALE below).

Only the places with a collision picture and a decided way in are built (user: one stretch at a time):
  desert_golden_dunes 황금 사구해 — in from Ombos (the east edge of the village, right of the riverside palms), out on its west
  edge where the paved path starts below the ruined colonnade (user's picture); its lower right sand leads on east.
  desert_dry_flats 메마른 모래벌판, desert_quiet_dunes 고요한 사구 — the guide's way from 01 to 02, edge to edge (collision pictures made
  by tools/maps/desert-collision.py to the user's rules: user "니가 충돌 만들어 하나하나 내가 그린 퀄리티대로").
  desert_buried_temple 매몰 신전 사막 — in from 03 on its left edge; its lower right stone door goes down to desert_city_gate.
  desert_city_gate 매몰 도시의 출입구 → desert_city_plaza 잊힌 지하 도시의 광장 (detail maps: the Duat's scale, camera 0.8, people ×1.4).
Requires shapely and scipy (duat-pixel.py)."""
import argparse, hashlib, json, math, shutil
from shapely.geometry import Point, Polygon
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
BIG = {'desert_golden_dunes', 'desert_buried_temple', 'desert_quiet_dunes', 'desert_dry_flats'}
SCALE = {'big': 0.44, 'detail': 1.0}
# the guide's place number of each map: the art copy's name (docs/art/map-expansion/desert-NN.png) and review pictures.
# all run under their meaning ids (tools/maps/desert-registry.py); the old desert_01..04, desert_11, desert_17 move in saves
# (src/core/state.js)
NO = {'desert_golden_dunes': '01', 'desert_buried_temple': '02', 'desert_quiet_dunes': '03', 'desert_dry_flats': '04',
      'desert_city_gate': '11', 'desert_city_plaza': '17', 'desert_colonnade': '15',
      'desert_forecourt_west': 'T1W', 'desert_forecourt_east': 'T1E'}
def px_of(ident): return DUAT_PX * SCALE['big' if ident in BIG else 'detail']
# the big maps are wide at 44 %: walking is 1.4 times as quick there, the walking pictures with it (user: "1, 1.4", then "1.25배로 하자", then "1.4로 늘리고")
WALK = {'big': 1.4, 'detail': 1.0}
# the big maps' camera further out (user: "75", then "60%로 카메라") and the people a little larger than their tile so they
# are not specks (user: "캐릭터도 좀만 키우자", then "1.6"); src/world/render.js fitZoom / actorScale
# the detail maps too: camera a little further out and the people larger (user: "사막 세부맵에선 아바타를 좀 키워 그리고
# 카메라가 너무 가까움", then "카메라 0.8 아바타 1.4")
CAMERA = {'big': 0.6, 'detail': 0.8}
ACTOR = {'big': 1.6, 'detail': 1.4}
ALPHA = 128
# every landing at least GAP people-widths (tiles × the map's actorScale) from every exit, so walking about where she
# lands, left or right, never takes her back (user: "좌우로 움직이다가 다시 전 맵으로 돌아가는 일이 없게", "착지랑 출구
# 사이를 좀 더 멀리"); checked below, the build stops when one is closer
GAP = 3
# Parent-registered latest user mark, source pixels. AABB remains in each runtime exit.
EXIT_POLYGONS = {('desert_forecourt_east', 'east'): [(1665,254),(1684,248),(1733,319),(1733,340),(1727,342)]}
# landings the user put by hand (their mark wins over GAP; still at least 2 people-widths): 11 door, the blue mark on the
# stairs below the door ("파란색으로 수정", docs/consult/desert/maps/user-11-door-landing.jpg), 2.47
BY_USER = {('desert_city_gate', 'door'), ('desert_forecourt_west', 'south'), ('desert_forecourt_west', 'east'), ('desert_buried_temple', 'temple')}   # user marks: T1W south/east, 02 temple steps, 11 door
# collision pictures the user did not draw: made by tools/maps/desert-collision.py to the user's 01·02 rules
MADE = {'03_고요한사구_06통합.png', '04_메마른모래벌판.png'}
SRC = ROOT / '사막맵'
OUT_ART = ROOT / 'docs/art/map-expansion'
REVIEW = OUT_ART / 'desert-connections-review'
# what stands in front of her when she walks in under it (scene-art occluders, src/world/reference-scene.js): (foot, polygon),
# art px; whoever's feet are above the foot line is drawn behind the polygon. Outlines from the art's pixels, the way of
# docs/OPUS-HANDOFF.md "가구에 몸 가리기": straight edges measured at 5-6x on the rows they cross, joined as corners
# (user: "지붕 맞춰"). Only the edge against where she can be shown matters; the rest of a polygon is the same stone.
FRONT = {
    # 11: the lintel over the stairway down (its lower edge against the dark opening: 615,291 → 784,338), the left jamb
    # (inner edge x 615 down to its foot at 455-465) and the right jamb (inner edge 784 → 781, its foot at 528), each its own
    # foot so someone on the stairs in front of a jamb's foot is not put behind it (left jamb taken out, then back: user
    # "걍 다 가리게 하자")
    'desert_city_gate': [(530, [[560, 180], [840, 180], [840, 338], [784, 338], [615, 291], [560, 291]]),
                  (460, [[560, 291], [615, 291], [615, 455], [600, 465], [560, 465]]),
                  (528, [[784, 338], [840, 338], [840, 528], [781, 528], [782, 450], [783, 380]])],
    # 17: the two doors the floor runs into. Middle house: the beam's lower edge 583,242 → 620,232 → 664,222 (the rows where
    # it turns dark), the left post's inner edge x 583 to its foot 352, the right post 664-682 to 334. Right house (records):
    # the lintel's lower edge level at 200, the posts' inner edges x 1209 (foot 342) and 1342 (foot 345)
    'desert_city_plaza': [(352, [[545, 170], [720, 170], [720, 222], [664, 222], [620, 232], [583, 242], [545, 242]]),
                  (352, [[545, 242], [583, 242], [583, 352], [545, 352]]),
                  (334, [[664, 222], [682, 222], [682, 334], [664, 334]]),
                  (345, [[1160, 140], [1390, 140], [1390, 200], [1160, 200]]),
                  (342, [[1160, 200], [1209, 200], [1209, 342], [1160, 342]]),
                  (345, [[1342, 200], [1390, 200], [1390, 345], [1342, 345]])],
}
# Ombos: the landing when coming back (just inside the east edge, on the grass) and the exit rectangle (tiles of ombos.json)
OMBOS_BACK = {'x': 37.5, 'y': 22.4, 'dir': 'left'}   # 3.2 tiles from the exit (GAP)

# id, name, art file, collision file, ways in {name: (source px, facing)}, exits [(name, source box x0,y0,x1,y1, to, at)]. The big maps run 01 → 04 → 03 → 02 across their side edges (docs/ASTRA-DESERT-05-20-GUIDE.md
# "01 황금 사구해 → 04 메마른 모래벌판 → 03 고요한 사구 → 02 매몰 신전 사막", no new road drawn). 02's right side (10)
# waits for that place. 02's temple door ↔ T1W (OPUS 사막 계획서 3절 "02 ↔ T1W ↔ T1E ↔ 15", 02 "연결: 03·T1W·11·10";
# ASTRA-DESERT-05-20-GUIDE T1W "양쪽 끝의 02·15 연결", "한쪽 벽을 넘은 큰 모래 경사"): in 02 the doorway of the small
# temple (walkable inside it in the user's collision up to y 310), in T1W the bottom edge of the stone yard below the
# user's blue circle (the landing, 사용자 10-19); T1W's right gate is T1E's lower-left stairs
PLACES = [
    ('desert_golden_dunes', '황금 사구해', '01_황금사구해_닫힘.png', '01.png',
     {'west': ((85, 294), 'right'), 'east': ((1501, 750), 'left')},
     [('west', (0, 150, 14, 300), 'ombos', OMBOS_BACK), ('east', (1572, 676, 1586, 822), 'desert_dry_flats', 'west')]),
    ('desert_dry_flats', '메마른 모래벌판', '04_메마른모래벌판.png', '04_메마른모래벌판.png',
     {'west': ((85, 700), 'right'), 'east': ((1689, 300), 'left')},
     [('west', (0, 366, 14, 884), 'desert_golden_dunes', 'east'), ('east', (1760, 4, 1774, 590), 'desert_quiet_dunes', 'west')]),
    ('desert_quiet_dunes', '고요한 사구', '03_고요한사구_06통합.png', '03_고요한사구_06통합.png',
     {'west': ((85, 430), 'right'), 'east': ((1689, 505), 'left')},
     [('west', (0, 355, 14, 884), 'desert_dry_flats', 'east'), ('east', (1760, 450, 1774, 561), 'desert_buried_temple', 'west')]),
    ('desert_buried_temple', '매몰 신전 사막', '02_매몰신전사막.png', '02_매몰신전사막.png',
     # the west way out only where the paved path meets the edge (user's circle); the door landing on the stone path below
     # the door, GAP from it (it was just inside the door, user's mark, until the GAP rule)
     {'west': ((85, 330), 'right'), 'door': ((1438, 738), 'down'), 'temple': ((903, 390), 'down')},   # temple: the user's blue circle on the temple steps
     [('west', (0, 188, 14, 425), 'desert_quiet_dunes', 'east'), ('door', (1484, 668, 1518, 684), 'desert_city_gate', 'outside'),
      ('temple', (912, 296, 956, 326), 'desert_forecourt_west', 'south')]),
    # 11 매몰 도시의 출입구: 02 오른쪽 아래 야자수 사이 돌 문을 가까이 본 곳 (user: "누가 봐도 여기잖아"); 계단 위 문 → 17
    ('desert_city_gate', '매몰 도시의 출입구', '11_매몰도시출입구.png', '11_매몰도시출입구.png',
     {'outside': ((300, 1350), 'up'), 'door': ((672, 468), 'down')},
     [('left', (0, 335, 14, 1536), 'desert_buried_temple', 'door'), ('bottom', (0, 1522, 644, 1536), 'desert_buried_temple', 'door'),
      ('door', (640, 312, 790, 352), 'desert_city_plaza', 'east')]),
    # 17 잊힌 지하 도시의 광장: 오른쪽 계단 위가 11의 문 (guide: 17 우측 계단); 왼쪽 집 주거실·오른쪽 집 18 기록고는 다음
    ('desert_city_plaza', '잊힌 지하 도시의 광장', '17_지하도시광장.png', '17_지하도시광장.png',
     # the landing inside so all of her and the companion show (the camera stops at the map's right edge), on the walk at
     # the top of the stairs in the user's blue circle ("착지 파란색이 더 안전할 듯"), GAP from the exit.
     # The exit as it was (the user's red mark is the same right edge, "출구는 빨간색")
     {'east': ((1623, 570), 'left')},
     [('east', (1760, 402, 1774, 537), 'desert_city_gate', 'door')]),
    # 15 매몰 신전의 열주홀 (desert_colonnade): 반사광 입문 퍼즐(B2). 장치는 그림 그대로(오른쪽 광원, 가운데 받침 위 반사판,
    # 위층 뒷벽 수신부); 받침 앞 바닥에서 퍼즐 화면을 연다(src/packs/puzzle/colonnade.js). T2·16 출입은 아직 없음:
    # east 시험 착지는 보존. 실제 T1E 왕복은 오른쪽 문 앞 석재 길의 forecourt 착지를 쓴다.
    ('desert_colonnade', '매몰 신전의 열주홀', '15_열주홀.png', '15_열주홀.png',
     {'east': ((1680, 620), 'left'), 'forecourt': ((1570, 620), 'left')},
     [('forecourt', (1710, 580, 1730, 655), 'desert_forecourt_east', 'east')]),
    # T1W 서쪽 제례 앞뜰 (desert_forecourt_west): 가죽 방패병 한 마리 전투(B3, data/desert.json field). 02 ↔ 모래 경사 아래 끝
    # (south); T1E 출입은 오른쪽 문. yard: 석재 마당 왼쪽 착지(시험들이 씀)
    ('desert_forecourt_west', '서쪽 제례 앞뜰', 'T1W_서쪽제례앞뜰.png', 'T1W_서쪽제례앞뜰.png',
     # east: latest user annotation registered by parent to source pixels (1523,241), exit (1434,107,1596,127).
     # south: the user's blue circle on the stone yard (centre about 1273, 795; inside it, 2 people-widths from the exit)
     {'yard': ((900, 650), 'right'), 'south': ((1273, 778), 'up'), 'east': ((1523, 241), 'down')},
     [('south', (1048, 873, 1419, 887), 'desert_buried_temple', 'temple'),
      ('east', (1434, 107, 1596, 127), 'desert_forecourt_east', 'west')]),
    # ASTRA guide: T1W right gate <-> lower-left stairs; right gate <-> 15 right entrance.
    # Land along the paved approach, not at the yard's centre. Entry/exit names match field.js safeZones.
    ('desert_forecourt_east', '동쪽 제례 앞뜰', 'T1E_동쪽제례앞뜰.png', 'T1E_동쪽제례앞뜰.png',
     {'west': ((325, 610), 'up'), 'east': ((1621, 369), 'left')},
     [('west', (222, 748, 399, 772), 'desert_forecourt_west', 'east'),
      ('east', (1665, 248, 1733, 342), 'desert_colonnade', 'forecourt')]),
]


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def main(review_ids=None):
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
        out_file = f'desert-{NO[ident]}.png'; shutil.copyfile(src, OUT_ART / out_file)
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
        if review_ids is None or ident in review_ids:
            P.review(image, mask, route, REVIEW, int(NO[ident]) if NO[ident].isdigit() else NO[ident])
        for k, ((x, y), _) in ways.items():
            for e, (x0, y0, x1, y1), *_ in exits:
                g = math.hypot(max(x0 - x, 0, x - x1), max(y0 - y, 0, y - y1))
                polygon = EXIT_POLYGONS.get((ident, e))
                if polygon: g = Polygon(polygon).distance(Point(x, y))
                need = (2 if (ident, k) in BY_USER else GAP) * (ACTOR['big' if ident in BIG else 'detail']) * PX
                # Keep the historical puzzle-test entry exactly where it was. No portal targets it.
                # Its entire foot is outside the full-width door (30 px centre clearance); real arrivals use forecourt.
                if (ident, k) == ('desert_colonnade', 'east'): need = 30
                # Full-width thresholds follow the real doorway; do not move the landing for GAP.
                # These approaches retain >= 130px centre clearance and are checked with held touch input.
                if (ident, k) in {('desert_colonnade', 'forecourt'), ('desert_forecourt_east', 'west'), ('desert_forecourt_east', 'east')}: need = 130
                # User's new doorway landing is fixed; do not move it for a generic gap rule.
                if (ident, k) == ('desert_forecourt_east', 'east'): need = 90
                assert g >= need, f'{ident} {k}: landing {g:.0f} px from exit {e}, needs {need:.0f} (GAP)'
        ex = [{'id': k, 'x0': b[0] / PX, 'y0': b[1] / PX, 'x1': b[2] / PX, 'y1': b[3] / PX, 'to': to, 'at': at} for k, b, to, at in exits]
        for item in ex:
            polygon = EXIT_POLYGONS.get((ident, item['id']))
            if polygon:
                shape = Polygon(polygon)
                assert shape.is_valid and shape.area > 0
                item['polygon'] = [[x / PX, y / PX] for x, y in polygon]
                item.update(zip(('x0', 'y0', 'x1', 'y1'), [v / PX for v in shape.bounds]))
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
        if ident in FRONT: art[ident]['occluders'] = [{'foot': f, 'polygon': poly} for f, poly in FRONT[ident]]
        print(ident, f'{w}x{h} px = {W}x{H} tiles, floor {mask.mean() * 100:.1f} %, path to middle {steps} px')
    (ROOT / 'data/scene-art.json').write_text(R.dump(art) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--review-only", nargs="*", help="Only write collision review images for these runtime IDs (map generation is unchanged)")
    main(parser.parse_args().review_only)
