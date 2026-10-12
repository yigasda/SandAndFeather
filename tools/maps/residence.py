# The Ombos residence: fifteen scenes, each the approved picture as its own walkable map (docs/MAP-RESIDENCE-*.md).
# Coordinates are in tiles of the game map; one tile is about 80 picture pixels in every scene, so Somang keeps one
# size from the well courtyard to the roof. Writes data/maps/<id>.json and the scenes' entries in data/scene-art.json.
#   solid  [x0, y0, x1, y1]  what her feet cannot enter: walls, furniture, the pond, the stairs
#   exits  [x0, y0, x1, y1] → scene, entry   walking into it takes her there (only once she has stepped off the one she came in on)
#   entry  name: [x, y, dir]                 where her feet stand on arrival
# The approved PNGs are read where they are kept (docs/art/map-expansion); nothing is copied or redrawn.
import json, os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
ART = '../docs/art/map-expansion/'
ROOM_DOOR = [9.4, 10.3, 12.6, 11]  # the bottom doorway every 22×11 room shares
# Astra's exit art v2 (docs/RESIDENCE-EXITS-V2.md): the same approved pictures with the ways out drawn in. The corridors'
# ends are passages recessed under the ceiling beside the last column, so each end's way out is the floor in front of
# that passage, not the whole edge; the end column's base stays solid.
V2 = 'exits-v2/'
# Deep doorways (0.9.20 follow-up): she arrives standing inside the doorway's own floor, and the way out is its far end,
# so a passage reads as a place she walks through rather than a strip in front of a wall.
END_W, END_E = [0, 2.9, 0.62, 3.3], [26.38, 2.9, 27, 3.3]
AT_W, AT_E = [0.32, 3.8, 'right'], [26.68, 3.8, 'left']
OPEN_ENDS = [[0, 2.9, 0.62, 3.9], [26.38, 2.9, 27, 3.9]]  # the recess floors behind the end columns
# what stands in front of her inside a deep doorway, drawn again over her (scene-art occluders):
# (front line in tiles, outline in tiles); someone whose feet are above the line is behind it
FRONT_ENDS = [(4.12, [[0, 0], [1.72, 0], [1.72, 4.12], [0.6, 4.12], [0.6, 1.0], [0, 1.0]]),
              (4.12, [[27, 0], [25.28, 0], [25.28, 4.12], [26.4, 4.12], [26.4, 1.0], [27, 1.0]])]
COL_W, COL_E = [0.65, 0, 1.7, 4.1], [25.3, 0, 26.35, 4.1]  # the last column's base at each end
# back out in the village, on the carpet just below the temple door (ombos.json's exit walks in through that door)
OMBOS_TEMPLE = {'x': 24.9, 'y': 9.75, 'dir': 'down'}
# The long corridors, widened (0.9.23, Astra 139-143): each old 2172×724 picture sits untouched at (160, 64) in a
# 2492×887 one, 31×11 tiles. Their old interiors keep their pixels, so the old tile coordinates below are moved
# across (WIDE); the new end passages, wider and deeper, are laid out on the new picture (WIDE_END_*).
WIDE = 'corridors-remaining-v1/'
OLD_K, NEW_KX, NEW_KY = 2172 / 27, 2492 / 31, 887 / 11
def wx(x): return round(0 if x <= 0 else 31 if x >= 27 else (x * OLD_K + 160) / NEW_KX, 2)
def wy(y): return round(0 if y <= 0 else (y * OLD_K + 64) / NEW_KY, 2)
def wrect(r): return [wx(r[0]), wy(r[1]), wx(r[2]), wy(r[3])]
WIDE_END_SOLID = [[0, 0, 0.98, 4.8], [30.02, 0, 31, 4.8],          # the wall blocks at the very ends
                  [2.62, 0, 3.7, 4.88], [27.27, 0, 28.38, 4.88]]   # the last columns
# each end passage: walked into from the corridor floor; its far half is the way out
WIDE_END_OPEN = [[0.98, 3.5, 2.62, 4.7], [28.38, 3.5, 30.02, 4.7]]
WIDE_END_W, WIDE_END_E = [0.98, 3.5, 2.62, 4.0], [28.38, 3.5, 30.02, 4.0]
WIDE_AT_W, WIDE_AT_E = [1.8, 4.45, 'right'], [29.2, 4.45, 'left']
WIDE_END_FRONT = [(4.88, [[2.6, 1.2], [3.72, 1.2], [3.72, 4.88], [2.6, 4.88]]),          # the columns
                  (4.88, [[27.25, 1.2], [28.4, 1.2], [28.4, 4.88], [27.25, 4.88]]),
                  (4.8, [[0, 1.15], [2.65, 1.15], [2.65, 1.85], [0.98, 1.85], [0.98, 4.8], [0, 4.8]]),   # end wall and lintel
                  (4.8, [[31, 1.15], [28.35, 1.15], [28.35, 1.85], [30.02, 1.85], [30.02, 4.8], [31, 4.8]])]


def widen(sc, file, bottom=None):
    # move a corridor written in the old 27×9 tiles onto the widened picture
    old_end = lambda r: r is END_W or r is END_E or r is COL_W or r is COL_E or r in OPEN_ENDS
    sc['day'] = file if '/' in file else WIDE + file
    sc['size'] = [31, 11]
    sc['solid'] = [wrect(r) for r in sc['solid'] if not old_end(r)] + WIDE_END_SOLID + ([[0, bottom, 31, 11]] if bottom else [])
    ex = []
    for r, to, at in sc['exits']:
        if r is END_W: ex.append([WIDE_END_W, to, at]); continue
        if r is END_E: ex.append([WIDE_END_E, to, at]); continue
        n = wrect(r)
        if r[3] >= 9 and bottom: n[3] = bottom  # a way out at the old bottom edge now ends at the new floor's edge
        ex.append([n, to, at])
    sc['exits'] = ex
    sc['entry'] = {k: (WIDE_AT_W if v is AT_W else WIDE_AT_E if v is AT_E else [wx(v[0]), wy(v[1]), v[2]]) for k, v in sc['entry'].items()}
    sc['open'] = WIDE_END_OPEN + [wrect(r) for r in sc.get('open', []) if not old_end(r)]
    sc['front'] = WIDE_END_FRONT + [(wy(f), [[wx(x), wy(y)] for x, y in pts]) for f, pts in sc.get('front', []) if (f, pts) not in FRONT_ENDS]
    return sc


SCENES = {
    'temple_courtyard': {
        # Astra's round-door option 3 (0.9.23): 2160×887, 27×11 tiles, laid out afresh on this picture
        'name': '우물 마당', 'day': 'well-option3-night-v1/well-courtyard-option3-day.png',
        'night': 'well-option3-night-v1/well-courtyard-option3-night.png', 'size': [27, 11],
        'solid': [[5.0, 0, 27, 3.45],                                                     # back ledge and planters
                  [0, 0, 2.0, 6.45], [2.0, 0, 5.0, 4.0], [2.0, 4.0, 2.9, 6.3],           # left arcade: kitchen wall, inner wall, column
                  [2.9, 4.0, 5.1, 5.05], [2.9, 5.0, 4.05, 6.1], [5.0, 3.7, 5.6, 4.8],    # basin, stool, potted fern
                  [22.4, 0, 27, 3.95], [23.3, 3.95, 24.95, 5.7], [24.1, 5.6, 24.95, 6.3], [24.95, 0, 27, 6.45],  # right arcade
                  [22.25, 4.7, 23.9, 6.75], [21.65, 4.0, 22.6, 5.2],                      # bench, potted fern
                  [11.5, 4.35, 14.3, 6.55], [14.4, 5.0, 15.75, 6.85],                     # the well, jar and basket
                  [0, 8.0, 1.0, 11], [0, 9.3, 9.15, 11], [1.8, 9.0, 3.8, 11], [6.85, 8.6, 7.8, 11], [9.15, 9.0, 10.2, 11],  # front wall, left
                  [16.05, 9.0, 27, 11], [18.45, 8.6, 19.45, 11], [25.5, 8.3, 27, 11]],    # front wall, right
        'exits': [[[10.2, 10.44, 16.05, 11], 'ombos', OMBOS_TEMPLE], [[18.6, 2.35, 20.15, 2.75], 'courtyard_colonnade', 'south'],
                  [[0.55, 6.5, 2.1, 6.95], 'temple_kitchen', 'door'], [[24.7, 6.5, 26.4, 6.95], 'temple_dining', 'door']],
        'entry': {'south': [13.09, 9.86, 'up'], 'north': [19.35, 3.2, 'down'], 'west': [1.35, 7.45, 'down'], 'east': [25.6, 7.45, 'down']},
        'open': [[18.6, 2.35, 20.15, 3.45]],  # the passage under the arch, toward the pond
        'front': [(4.55, [[11.45, 3.15], [14.75, 3.15], [14.75, 3.75], [14.5, 3.75], [14.5, 4.9], [14.2, 4.9], [14.2, 3.75], [12.0, 3.75],
                          [12.0, 4.9], [11.65, 4.9], [11.65, 3.75], [11.45, 3.75]]),  # the well's posts and bar
                  (3.5, [[17.2, 0], [18.45, 0], [18.45, 3.5], [17.2, 3.5]]),            # the column left of the arch
                  (3.5, [[20.45, 1.3], [21.85, 1.3], [21.85, 3.5], [20.45, 3.5]]),      # the planter right of it
                  (3.45, [[18.3, 0], [20.45, 0], [20.45, 3.45], [20.15, 3.45], [20.15, 0.9], [19.9, 0.55], [19.35, 0.4], [18.8, 0.55],
                          [18.6, 0.9], [18.6, 3.45], [18.3, 3.45]])],                    # the arch
        'spawn': 'south',
        'spots': [{'id': 'temple_well', 'x': 12.9, 'y': 7.1, 'label': '우물', 'title': '우물', 'text': '두레박 줄이 축축하다. 마당 사람들이 여기서 물을 긷고 빨래를 한다.'}],
    },
    'courtyard_colonnade': {
        'name': '열린 연못 회랑', 'day': V2 + 'courtyard-colonnade-v1.png', 'night': V2 + 'courtyard-colonnade-v1-night.png', 'size': [24, 14],
        # widened on the right (1932 px for 24 tiles, as the 1448 px original was 18); the new arch is walked into going up
        'solid': [[0, 0, 19.05, 6.9], [19.05, 0, 21.5, 4.5], [20.85, 4.5, 21.5, 4.75], [21.5, 0, 24, 6.9], [0, 11.6, 6.6, 14], [11.39, 11.6, 24, 14],
                  [5.5, 11.0, 6.6, 14], [11.39, 11.0, 12.49, 14], [23.2, 11.0, 24, 14], [0, 0, 0.3, 14]],
        'exits': [[[6.7, 13.3, 11.29, 14], 'temple_courtyard', 'north'], [[19.05, 4.5, 21.5, 4.95], 'temple_inner_corridor', 'west']],
        'entry': {'south': [8.99, 11.9, 'up'], 'east': [20.3, 6.2, 'down']},
        'front': [(6.3, [[18.45, 1.6], [22.17, 1.6], [22.17, 6.3], [21.5, 6.3], [21.5, 3.0], [21.2, 2.55], [20.3, 2.3], [19.4, 2.55],
                         [19.07, 3.0], [19.07, 6.3], [18.45, 6.3]])],  # the arch's frame
        'spawn': 'south',
        'spots': [{'id': 'colonnade_pond', 'x': 8.49, 'y': 7.1, 'title': '연못', 'text': '기둥 사이로 연꽃이 떠 있다. 물빛이 천장에 어른거린다.'}],
    },
    'temple_inner_corridor': widen({
        'name': '안쪽 복도', 'day': V2 + 'inner-corridor-wide-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 27, 3.9], [4.5, 0, 8.4, 4.2], [18.9, 0, 21.9, 4.2], COL_W, COL_E],
        'exits': [[END_W, 'courtyard_colonnade', 'east'], [END_E, 'temple_central_gallery', 'south']],
        'entry': {'west': AT_W, 'east': AT_E},
        'front': FRONT_ENDS,
        'open': OPEN_ENDS,
        'spawn': 'west',
    }, 'corridor-expand-v4/inner-corridor-expanded-v4.png', None),
    'temple_central_gallery': widen({
        'name': '중앙 회랑', 'day': V2 + 'central-gallery-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 12.45, 3.9], [14.35, 0, 27, 3.9], [12.3, 0, 12.6, 3.95], [14.2, 0, 14.5, 3.95], [4.5, 0, 7.5, 4.2],
                  [19.1, 0, 22.2, 4.2], [0, 7.0, 11.9, 9], [15.1, 7.0, 27, 9], [10.8, 6.9, 11.9, 9], [15.1, 6.9, 16.1, 9], COL_W, COL_E],
        'exits': [[[11.9, 8.6, 15.1, 9], 'temple_inner_corridor', 'east'], [END_W, 'temple_west_gallery', 'east'],
                  [END_E, 'temple_east_gallery', 'west'], [[12.6, 0, 14.2, 2.1], 'room_entrances_wide', 'arch']],
        'entry': {'south': [13.5, 7.9, 'up'], 'west': AT_W, 'east': AT_E, 'arch': [13.4, 3.4, 'down']},
        'front': FRONT_ENDS + [(3.95, [[11.9, 0.3], [14.95, 0.3], [14.95, 3.95], [14.25, 3.95], [14.25, 1.45], [14.0, 0.95], [13.4, 0.65], [12.8, 0.95], [12.55, 1.45], [12.55, 3.95], [11.9, 3.95]])],
        'open': OPEN_ENDS,
        'spawn': 'south',
    }, 'central-expanded.png', 10.2),
    'temple_east_gallery': widen({
        'name': '동쪽 회랑', 'day': V2 + 'east-gallery-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 14.9, 3.9], [16.6, 0, 27, 3.9], [4.5, 0, 7.6, 4.2], COL_W, COL_E],
        'exits': [[END_W, 'temple_central_gallery', 'east'], [END_E, 'room_entrances_wide', 'west'],
                  [[14.95, 0, 16.55, 2.6], 'temple_sanctuary', 'door']],
        'entry': {'west': AT_W, 'east': AT_E, 'shrine': [15.75, 3.75, 'down']},
        'front': FRONT_ENDS + [(3.95, [[14.4, 0.5], [17.05, 0.5], [17.05, 3.95], [16.5, 3.95], [16.5, 1.6], [15.0, 1.6], [15.0, 3.95], [14.4, 3.95]])],
        'open': OPEN_ENDS,
        'spawn': 'west',
    }, 'east-expanded.png', None),
    'temple_west_gallery': widen({
        'name': '서쪽 회랑', 'day': V2 + 'west-gallery-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 6.65, 3.9], [8.55, 0, 27, 3.9], [1.9, 0, 4.2, 4.2], [17.8, 0, 21.0, 4.2], COL_W, COL_E, [6.6, 0, 7.0, 2.95], [8.25, 0, 8.6, 2.95]],  # + the passage's front posts
        'exits': [[END_E, 'temple_central_gallery', 'west'], [END_W, 'room_entrances_wide', 'east'],
                  [[6.7, 0, 8.5, 2.5], 'temple_colonnade', 'door']],
        'entry': {'east': AT_E, 'west': AT_W, 'stairs': [7.6, 3.75, 'down']},
        'front': FRONT_ENDS + [(3.95, [[5.95, 0.2], [9.2, 0.2], [9.2, 3.95], [8.55, 3.95], [8.55, 1.05], [6.6, 1.05], [6.6, 3.95], [5.95, 3.95]])],
        'open': OPEN_ENDS,
        'spawn': 'east',
    }, 'west-expanded.png', None),
    'room_entrances_wide': widen({
        'name': '방문 회랑', 'day': V2 + 'room-entrances-wide-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 2.25, 3.9], [3.55, 0, 12.55, 3.9], [13.85, 0, 23.35, 3.9], [24.65, 0, 27, 3.9],
                  [6.3, 0, 8.6, 4.2], [18.7, 0, 19.7, 4.25], COL_W, COL_E,
                  [9.85, 7.6, 10.65, 9], [15.75, 7.6, 16.55, 9]],  # the stair's two posts
        'exits': [[[2.3, 0, 3.5, 4.25], 'set_room', 'door'], [[12.6, 0, 13.8, 4.25], 'somang_room', 'door'],
                  [[23.4, 0, 24.6, 4.25], 'horus_room', 'door'], [END_W, 'temple_east_gallery', 'east'],
                  [END_E, 'temple_west_gallery', 'west'], [[11.19, 8.58, 15.29, 9], 'temple_central_gallery', 'arch']],
        'entry': {'set': [2.9, 4.9, 'down'], 'somang': [13.2, 4.9, 'down'], 'horus': [24.0, 4.9, 'down'],
                  'west': AT_W, 'east': AT_E, 'arch': [13.24, 7.46, 'up']},
        'front': FRONT_ENDS,
        'open': OPEN_ENDS,
        'spawn': 'arch',
    }, 'rooms-expanded.png', 10.2),
    'set_room': {
        'name': '세트 방', 'day': 'set-room-v6-single-window-day.png', 'night': 'set-room-v6-single-window-night.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 3.6], [0, 0, 0.8, 11], [21.2, 0, 22, 11], [0.8, 0, 2.5, 4.4], [2.8, 0, 6.0, 4.9], [3.6, 4.0, 4.7, 5.2],
                  [5.9, 0, 6.9, 4.7], [7.8, 4.3, 12.6, 6.0], [14.3, 0, 19.4, 6.9], [15.5, 6.0, 17.5, 7.6], [18.9, 0, 21.2, 4.5],
                  [0.8, 7.1, 2.3, 8.8], [0, 9.0, 9.4, 11], [12.6, 9.0, 22, 11]],
        'exits': [[ROOM_DOOR, 'room_entrances_wide', 'set']], 'entry': {'door': [11, 8.6, 'up']}, 'spawn': 'door',
        'spots': [{'id': 'set_bed', 'x': 18.6, 'y': 7.4, 'title': '세트의 침대', 'text': '붉은 양모가 침대 끝에 걸쳐 있다. 두 사람이 누워도 넉넉하다.'},
                  {'id': 'set_window', 'x': 10.5, 'y': 3.7, 'title': '창밖', 'text': '붉은 사막이 지평선까지 이어진다.'},
                  {'id': 'set_brazier', 'x': 2.6, 'y': 8.2, 'title': '화로', 'text': '석재 받침 위에서 불이 조용히 탄다.'}],
    },
    'horus_room': {
        'name': '호루스의 서쪽 방', 'day': 'horus-room-v2-wide-day.png', 'night': 'horus-room-v2-wide-night.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 3.6], [0, 0, 0.8, 11], [21.2, 0, 22, 11], [0.8, 0, 2.2, 4.4], [2.0, 0, 6.5, 6.9], [3.2, 6.0, 5.3, 7.5],
                  [6.3, 0, 7.6, 4.5], [18.2, 0, 21.2, 4.6], [16.5, 4.3, 20.5, 6.4], [17.7, 5.8, 18.9, 6.9],
                  [0, 9.1, 9.6, 11], [12.4, 9.1, 22, 11]],
        'exits': [[[9.7, 10.3, 12.3, 11], 'room_entrances_wide', 'horus']], 'entry': {'door': [11, 8.6, 'up']}, 'spawn': 'door',
        'spots': [{'id': 'horus_window', 'x': 11.5, 'y': 3.7, 'title': '큰 창', 'text': '낮에는 하늘이, 밤에는 별이 창을 가득 채운다.',
                   'textNight': '창 가득 별이 떠 있다.'},
                  {'id': 'horus_bed', 'x': 6.2, 'y': 7.2, 'title': '호루스의 침대', 'text': '푸른 리넨 이불이 반듯하게 펴져 있다. 두 사람이 누워도 넉넉하다.'},
                  {'id': 'horus_desk', 'x': 18.2, 'y': 7.1, 'title': '기록 책상', 'text': '파피루스와 갈대 펜, 깃털이 가지런히 놓여 있다.'}],
    },
    'somang_room': {
        'name': '소망 방', 'day': 'somang-room-v3-center.png', 'night': 'somang-room-v3-center-night.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 3.6], [0, 0, 0.8, 11], [21.2, 0, 22, 11], [0.8, 0, 1.7, 4.2], [1.7, 0, 5.0, 4.8], [2.6, 4.0, 3.9, 5.1],
                  [13.4, 0, 16.6, 4.8], [17.0, 0, 20.4, 5.0], [20.3, 0, 21.2, 5.0], [8.6, 4.4, 12.2, 6.4],
                  [0.7, 5.6, 3.2, 9.0], [3.2, 7.0, 4.7, 8.6], [19.0, 7.4, 21.2, 9.1], [0, 9.1, 9.3, 11], [12.6, 9.1, 22, 11]],
        'exits': [[ROOM_DOOR, 'room_entrances_wide', 'somang']], 'entry': {'door': [11, 8.6, 'up']}, 'spawn': 'door',
        'spots': [{'id': 'somang_mirror', 'x': 3.4, 'y': 5.6, 'title': '거울과 화장대', 'text': '거울 앞에 화장 도구가 놓여 있다.'},
                  {'id': 'somang_table', 'x': 10.4, 'y': 6.8, 'title': '작업 탁자', 'text': '천과 리본, 작은 물건 상자가 펼쳐져 있다.'}],
    },
    'temple_kitchen': {
        'name': '부엌', 'day': 'temple-kitchen-v2-open-day.png', 'night': 'temple-kitchen-v2-open-night.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 3.7], [0, 0, 0.8, 11], [21.2, 0, 22, 11], [0.8, 0, 7.3, 4.8], [13.3, 0, 19.9, 4.9], [19.9, 0, 21.2, 7.4],
                  [8.5, 4.2, 12.3, 6.4], [0.7, 5.0, 2.6, 8.9], [2.0, 7.6, 8.2, 9.4], [13.7, 7.6, 21.2, 9.4],
                  [0, 9.1, 9.3, 11], [12.6, 9.1, 22, 11]],
        'exits': [[ROOM_DOOR, 'temple_courtyard', 'west']], 'entry': {'door': [11, 8.6, 'up']}, 'spawn': 'door',
        'spots': [{'id': 'kitchen', 'x': 10.4, 'y': 6.7, 'label': '부엌', 'mode': 'life', 'title': '부엌', 'text': '화덕에서 빵 굽는 냄새가 난다.'}],
    },
    'temple_dining': {
        'name': '식사 공간', 'day': 'temple-dining-v2-garden-day.png', 'night': 'temple-dining-v2-garden-night.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 3.9], [0, 0, 0.8, 11], [21.2, 0, 22, 11], [0.8, 0, 6.2, 4.2], [15.8, 0, 21.2, 4.5],
                  [7.0, 4.1, 15.0, 6.4], [10.2, 6.0, 11.8, 7.1], [0, 9.1, 9.3, 11], [12.6, 9.1, 22, 11]],
        'exits': [[ROOM_DOOR, 'temple_courtyard', 'east']], 'entry': {'door': [11, 8.6, 'up']}, 'spawn': 'door',
        'spots': [{'id': 'temple_table', 'x': 15.6, 'y': 6.6, 'title': '식탁', 'text': '낮은 식탁에 방석 세 자리. 나눠 먹을 음식이 놓여 있다.'}],
    },
    'temple_sanctuary': {
        'name': '성소', 'day': 'set-sanctuary-v6-neutral.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 4.45], [0, 0, 0.8, 11], [21.2, 0, 22, 11], [6.0, 0, 7.4, 5.5], [14.6, 0, 16.0, 5.5],
                  [7.6, 0, 14.4, 5.8], [9.3, 0, 12.7, 6.4], [0, 9.1, 9.3, 11], [12.6, 9.1, 22, 11]],
        'exits': [[ROOM_DOOR, 'temple_east_gallery', 'shrine']], 'entry': {'door': [11, 8.6, 'up']}, 'spawn': 'door',
        'spots': [{'id': 'altar', 'x': 10.5, 'y': 6.3, 'label': '제단', 'mode': 'growth', 'title': '세트의 제단', 'text': '세트 동물 석상 앞에 공물과 향로가 놓여 있다.'}],
    },
    'temple_colonnade': {
        'name': '열주 계단', 'day': 'colonnade-stairs-v1.png', 'night': 'colonnade-stairs-v1-night.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 4.9], [1.0, 0, 2.4, 5.9], [11.3, 0, 12.7, 5.9], [4.2, 0, 9.0, 5.4], [13.3, 0, 14.8, 5.4],
                  [14.7, 0, 19.2, 5.75], [19.2, 0, 21.0, 5.5], [21.1, 0, 22, 6.0], [0, 0, 0.3, 11], [21.7, 0, 22, 11],
                  [0, 8.6, 8.4, 11], [13.6, 8.6, 22, 11], [7.2, 8.4, 8.4, 11], [13.6, 8.4, 14.7, 11]],
        'exits': [[[8.5, 10.2, 13.5, 11], 'temple_west_gallery', 'stairs']], 'entry': {'door': [11, 8.0, 'up'], 'stairs': [16.9, 6.4, 'down']},
        'spawn': 'door',
        'spots': [{'id': 'colonnade_seat', 'x': 7.0, 'y': 5.9, 'title': '기둥 사이 쉼터', 'text': '긴 의자에 앉으면 기둥 사이로 정원이 보인다. 머물며 이야기하기 좋은 자리다.'},
                  {'id': 'stairs_up', 'x': 16.4, 'y': 5.9, 'label': '지붕', 'title': '지붕으로 가는 계단', 'text': '넓은 계단이 지붕으로 이어진다.',
                   'climb': {'to': 'temple_roof', 'at': 'stairs', 'glyph': '^', 'name': '지붕으로 올라가기'}}],
    },
    'temple_roof': {
        'name': '지붕', 'day': 'temple-roof-v1-day.png', 'night': 'temple-roof-v1-night.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 4.4], [1.5, 0, 2.5, 4.7], [14.9, 0, 16.7, 4.7], [16.7, 0, 21.1, 5.8], [0, 0, 1.2, 11], [21.1, 0, 22, 11],
                  [1.6, 4.8, 4.9, 6.6], [4.5, 4.6, 6.8, 5.6], [5.8, 5.9, 7.1, 6.9], [0, 8.7, 22, 11]],
        'exits': [], 'entry': {'stairs': [19.0, 6.6, 'down']}, 'spawn': 'stairs',
        'spots': [{'id': 'roof_stars', 'x': 9.5, 'y': 7.0, 'title': '지붕 난간', 'text': '낮은 난간 너머로 마을과 강이 내려다보인다.', 'textNight': '난간에 기대면 별이 쏟아질 듯 가깝다.'},
                  {'id': 'stairs_down', 'x': 18.6, 'y': 6.0, 'label': '계단', 'title': '계단실', 'text': '아래 열주 계단으로 내려가는 문이다.',
                   'climb': {'to': 'temple_colonnade', 'at': 'stairs', 'glyph': 'v', 'name': '아래로 내려가기'}}],
    },
}


def carve(solids, holes):
    # cut each hole (a doorway's floor) out of the solid rectangles, keeping the rest of each as up to four pieces
    for hx0, hy0, hx1, hy1 in holes:
        out = []
        for x0, y0, x1, y1 in solids:
            if hx0 >= x1 or hx1 <= x0 or hy0 >= y1 or hy1 <= y0: out.append([x0, y0, x1, y1]); continue
            if y0 < hy0: out.append([x0, y0, x1, hy0])
            if hy1 < y1: out.append([x0, hy1, x1, y1])
            if x0 < hx0: out.append([x0, max(y0, hy0), hx0, min(y1, hy1)])
            if hx1 < x1: out.append([hx1, max(y0, hy0), x1, min(y1, hy1)])
        solids = out
    return solids


def signs(sc, w, h):
    out = []
    for (x0, y0, x1, y1), to, _ in sc['exits']:
        name = '옴보스' if to == 'ombos' else SCENES[to]['name']
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        box = [x0, y0, x1, y1]
        if x0 <= 1 and x1 <= 3: out.append((2.4, cy, f'← {name}', box))
        elif x1 >= w - 1 and x0 >= w - 3: out.append((w - 2.4, cy, f'{name} →', box))
        elif y0 >= h * 0.75: out.append((cx, h - 0.75, f'↓ {name}', box))
        else: out.append((cx, max(0.75, y0 + 0.6), f'↑ {name}', box))
    return out


def dump(v, pad=''):
    # objects one key a line, number lists on one line, as the file was written by hand
    if isinstance(v, dict):
        inner = pad + '  '
        return '{\n' + ',\n'.join(f'{inner}{json.dumps(k, ensure_ascii=False)}: {dump(x, inner)}' for k, x in v.items()) + '\n' + pad + '}'
    if isinstance(v, list) and any(isinstance(x, dict) for x in v):
        inner = pad + '  '
        return '[\n' + ',\n'.join(inner + dump(x, inner) for x in v) + '\n' + pad + ']'
    return json.dumps(v, ensure_ascii=False, separators=(', ', ': '))


def size_of(path):
    with open(path, 'rb') as f:
        head = f.read(24)
    return int.from_bytes(head[16:20], 'big'), int.from_bytes(head[20:24], 'big')


def main():
    art = json.load(open(os.path.join(ROOT, 'data', 'scene-art.json')))
    for sid, sc in SCENES.items():
        w, h = sc['size']
        sc['solid'] = carve(sc['solid'], sc.get('open', []))
        iw, ih = size_of(os.path.join(ROOT, 'docs', 'art', 'map-expansion', sc['day']))
        if sc.get('night'):
            assert size_of(os.path.join(ROOT, 'docs', 'art', 'map-expansion', sc['night'])) == (iw, ih), sid
        kx, ky = iw / w, ih / h
        poly = lambda r: [[round(r[0] * kx, 1), round(r[1] * ky, 1)], [round(r[2] * kx, 1), round(r[1] * ky, 1)],
                          [round(r[2] * kx, 1), round(r[3] * ky, 1)], [round(r[0] * kx, 1), round(r[3] * ky, 1)]]
        # every arrival must stand clear: her feet box inside the map, off furniture, and off the exits
        for k, (fx, fy, _) in sc['entry'].items():
            box = [(fx + dx, fy + dy) for dx in (-0.28, 0.28) for dy in (-0.18, 0.16)]
            assert all(0 <= x < w and 0 <= y < h for x, y in box), (sid, k, 'outside')
            assert not any(r[0] <= x < r[2] and r[1] <= y < r[3] for r in sc['solid'] for x, y in box), (sid, k, 'blocked')
            assert not any(r[0] <= fx <= r[2] and r[1] <= fy <= r[3] for r, _, _ in sc['exits']), (sid, k, 'on an exit')
        entry = {k: {'x': round(v[0] - 0.5, 2), 'y': round(v[1] - 0.8, 2), 'dir': v[2]} for k, v in sc['entry'].items()}
        spots = []
        for s in sc.get('spots', []):
            s = dict(s); s['x'] -= 0.5; s['y'] -= 0.5  # a spot's tile: its middle is where she stands to use it
            spots.append(s)
        data = {
            'id': sid, 'name': sc['name'], 'tile': 16, 'scene': 'residence', 'referenceScenes': [sid],
            'legend': {'.': {'t': 'stone'}}, 'rows': ['.' * w] * h,
            'authoredCollision': {'width': iw, 'height': ih, 'shapes': [{'id': f's{i}', 'polygon': poly(r)} for i, r in enumerate(sc['solid'])]},
            'exits': [{'x0': r[0], 'y0': r[1], 'x1': r[2], 'y1': r[3], 'to': to, 'at': at} for r, to, at in sc['exits']],
            'entries': entry, 'spawn': entry[sc['spawn']], 'spots': spots,
            # a door's name, drawn centred on (x, y) like a place name
            # a sign on every way out, so each door and passage can be found: where it leads, with an arrow
            # (shown only while she is near that way out: `near` is the exit's box)
            'labels': [{'x': round(lx - 0.5, 2), 'y': round(ly + 0.55, 2), 'label': text, 'near': box} for lx, ly, text, box in signs(sc, w, h)],
            'note': '안채 안에서는 문과 통로로 걸어 다녀. 마당 아래 큰 문으로 나가면 옴보스야.',
        }
        with open(os.path.join(ROOT, 'data', 'maps', f'{sid}.json'), 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.write('\n')
        art[sid] = {'file': ART + sc['day'], 'fullMap': True, 'lazy': True, 'origin': [0, 0], 'scale': [w * 16 / iw, h * 16 / ih],
                    'day': [0, 0, iw, ih], 'night': [0, 0, iw, ih], 'clip': [[0, 0], [iw, 0], [iw, ih], [0, ih]]}
        if sc.get('front'):
            art[sid]['occluders'] = [{'foot': round(f * ky, 1), 'polygon': [[round(x * kx, 1), round(y * ky, 1)] for x, y in pts]}
                                     for f, pts in sc['front']]
        if sc.get('night'):
            art[sid]['nightFile'] = ART + sc['night']  # an authored night: no dark filter over it
        else:
            art[sid]['tintNight'] = 'rgba(18,26,70,.30)'  # lamp-lit rooms keep one picture; night dims it less than the village
    with open(os.path.join(ROOT, 'data', 'scene-art.json'), 'w') as f:
        f.write(dump(art) + '\n')
    print('wrote', len(SCENES), 'scenes')


if __name__ == '__main__':
    main()
