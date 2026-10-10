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
# back out in the village, on the carpet just below the temple door (ombos.json's exit walks in through that door)
OMBOS_TEMPLE = {'x': 24.9, 'y': 9.75, 'dir': 'down'}

SCENES = {
    'temple_courtyard': {
        'name': '우물 마당', 'day': 'well-courtyard-v1.png', 'night': 'well-courtyard-v1-night.png', 'size': [22, 11],
        'solid': [[0, 0, 22, 2.75], [2.8, 2.75, 16.2, 3.35], [17.8, 2.75, 22, 3.35], [0, 0, 2.45, 3.95], [0, 0, 0.6, 5.9],
                  [0.5, 3.95, 2.9, 6.45], [18.9, 0, 22, 3.65], [21.45, 0, 22, 6.2], [19.2, 4.0, 21.3, 6.8],
                  [9.3, 3.2, 12.7, 6.3], [12.4, 5.0, 13.6, 6.8], [0, 7.6, 1.5, 11], [20.6, 7.6, 22, 11],  # the corner ferns: their pots, under the leaves
                 
                  [0, 8.6, 8.1, 11], [13.9, 8.6, 22, 11], [4.7, 8.2, 5.6, 11], [16.4, 8.2, 17.3, 11]],
        'exits': [[[8.3, 10.25, 13.7, 11], 'ombos', OMBOS_TEMPLE], [[16.2, 0, 17.8, 2.95], 'courtyard_colonnade', 'south'],
                  [[0, 6.45, 0.45, 7.6], 'temple_kitchen', 'door'], [[21.55, 6.8, 22, 7.6], 'temple_dining', 'door']],
        'entry': {'south': [11, 9.6, 'up'], 'north': [17, 3.6, 'down'], 'west': [1.0, 7.05, 'right'], 'east': [21.0, 7.2, 'left']},
        'spawn': 'south',
        'spots': [{'id': 'temple_well', 'x': 10.5, 'y': 6.6, 'label': '우물', 'title': '우물', 'text': '두레박 줄이 축축하다. 마당 사람들이 여기서 물을 긷고 빨래를 한다.'}],
    },
    'courtyard_colonnade': {
        'name': '열린 연못 회랑', 'day': 'courtyard-colonnade-v1.png', 'night': 'courtyard-colonnade-v1-night.png', 'size': [18, 14],
        'solid': [[0, 0, 18, 6.9], [0, 11.6, 6.6, 14], [11.4, 11.6, 18, 14], [5.5, 11.0, 6.6, 14], [11.4, 11.0, 12.5, 14], [0, 0, 0.3, 14]],
        'exits': [[[6.7, 13.3, 11.3, 14], 'temple_courtyard', 'north'], [[17.55, 6.9, 18, 11.6], 'temple_inner_corridor', 'west']],
        'entry': {'south': [9, 11.9, 'up'], 'east': [17.0, 9.2, 'left']},
        'spawn': 'south',
        'spots': [{'id': 'colonnade_pond', 'x': 8.5, 'y': 7.1, 'title': '연못', 'text': '기둥 사이로 연꽃이 떠 있다. 물빛이 천장에 어른거린다.'}],
    },
    'temple_inner_corridor': {
        'name': '안쪽 복도', 'day': 'inner-corridor-wide-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 27, 3.9], [4.5, 0, 8.4, 4.2], [18.9, 0, 21.9, 4.2]],
        'exits': [[[0, 3.9, 0.45, 9], 'courtyard_colonnade', 'east'], [[26.55, 3.9, 27, 9], 'temple_central_gallery', 'south']],
        'entry': {'west': [1.0, 6.5, 'right'], 'east': [26.0, 6.5, 'left']},
        'spawn': 'west',
    },
    'temple_central_gallery': {
        'name': '중앙 회랑', 'day': 'central-gallery-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 12.45, 3.9], [14.35, 0, 27, 3.9], [12.3, 0, 12.6, 3.95], [14.2, 0, 14.5, 3.95], [4.5, 0, 7.5, 4.2],
                  [19.1, 0, 22.2, 4.2], [0, 7.0, 11.9, 9], [15.1, 7.0, 27, 9], [10.8, 6.9, 11.9, 9], [15.1, 6.9, 16.1, 9]],
        'exits': [[[11.9, 8.6, 15.1, 9], 'temple_inner_corridor', 'east'], [[0, 3.9, 0.45, 7.0], 'temple_west_gallery', 'east'],
                  [[26.55, 3.9, 27, 7.0], 'temple_east_gallery', 'west'], [[12.6, 0, 14.2, 3.3], 'room_entrances_wide', 'arch']],
        'entry': {'south': [13.5, 7.9, 'up'], 'west': [1.0, 5.5, 'right'], 'east': [26.0, 5.5, 'left'], 'arch': [13.4, 4.1, 'down']},
        'spawn': 'south',
    },
    'temple_east_gallery': {
        'name': '동쪽 회랑', 'day': 'east-gallery-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 14.9, 3.9], [16.6, 0, 27, 3.9], [4.5, 0, 7.6, 4.2], [26.2, 0, 27, 4.2]],
        'exits': [[[0, 3.9, 0.45, 9], 'temple_central_gallery', 'east'], [[26.55, 4.25, 27, 9], 'room_entrances_wide', 'west'],
                  [[14.95, 0, 16.55, 4.2], 'temple_sanctuary', 'door']],
        'entry': {'west': [1.0, 6.5, 'right'], 'east': [26.0, 6.5, 'left'], 'shrine': [15.75, 4.9, 'down']},
        'spawn': 'west',
        'labels': [{'x': 15.75, 'y': 0.9, 'label': '성소'}],
    },
    'temple_west_gallery': {
        'name': '서쪽 회랑', 'day': 'west-gallery-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 6.65, 3.9], [8.55, 0, 27, 3.9], [1.9, 0, 4.2, 4.2], [17.8, 0, 21.0, 4.2]],
        'exits': [[[26.55, 3.9, 27, 9], 'temple_central_gallery', 'west'], [[0, 3.9, 0.45, 9], 'room_entrances_wide', 'east'],
                  [[6.7, 0, 8.5, 4.2], 'temple_colonnade', 'door']],
        'entry': {'east': [26.0, 6.5, 'left'], 'west': [1.0, 6.5, 'right'], 'stairs': [7.6, 4.9, 'down']},
        'spawn': 'east',
        'labels': [{'x': 7.6, 'y': 0.9, 'label': '열주 계단'}],
    },
    'room_entrances_wide': {
        'name': '방문 회랑', 'day': 'room-entrances-wide-v1.png', 'size': [27, 9],
        'solid': [[0, 0, 2.25, 3.9], [3.55, 0, 12.55, 3.9], [13.85, 0, 23.35, 3.9], [24.65, 0, 27, 3.9],
                  [6.3, 0, 8.6, 4.2], [18.7, 0, 19.7, 4.25]],
        'exits': [[[2.3, 0, 3.5, 4.25], 'set_room', 'door'], [[12.6, 0, 13.8, 4.25], 'somang_room', 'door'],
                  [[23.4, 0, 24.6, 4.25], 'horus_room', 'door'], [[0, 3.9, 0.45, 9], 'temple_east_gallery', 'east'],
                  [[26.55, 3.9, 27, 9], 'temple_west_gallery', 'west'], [[11.2, 8.6, 15.2, 9], 'temple_central_gallery', 'arch']],
        'entry': {'set': [2.9, 4.9, 'down'], 'somang': [13.2, 4.9, 'down'], 'horus': [24.0, 4.9, 'down'],
                  'west': [1.0, 6.5, 'right'], 'east': [26.0, 6.5, 'left'], 'arch': [13.2, 7.8, 'up']},
        'spawn': 'arch',
        'labels': [{'x': 2.9, 'y': 0.75, 'label': '세트 방'}, {'x': 13.2, 'y': 0.75, 'label': '소망 방'}, {'x': 24.0, 'y': 0.75, 'label': '호루스 방'}],
    },
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
            'labels': [{'x': round(l['x'] - 0.5, 2), 'y': round(l['y'] + 0.55, 2), 'label': l['label']} for l in sc.get('labels', [])],
            'note': '안채 안에서는 문과 통로로 걸어 다녀. 마당 아래 큰 문으로 나가면 옴보스야.',
        }
        with open(os.path.join(ROOT, 'data', 'maps', f'{sid}.json'), 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.write('\n')
        art[sid] = {'file': ART + sc['day'], 'fullMap': True, 'lazy': True, 'origin': [0, 0], 'scale': [w * 16 / iw, h * 16 / ih],
                    'day': [0, 0, iw, ih], 'night': [0, 0, iw, ih], 'clip': [[0, 0], [iw, 0], [iw, ih], [0, ih]]}
        if sc.get('night'):
            art[sid]['nightFile'] = ART + sc['night']  # an authored night: no dark filter over it
        else:
            art[sid]['tintNight'] = 'rgba(18,26,70,.30)'  # lamp-lit rooms keep one picture; night dims it less than the village
    with open(os.path.join(ROOT, 'data', 'scene-art.json'), 'w') as f:
        f.write(dump(art) + '\n')
    print('wrote', len(SCENES), 'scenes')


if __name__ == '__main__':
    main()
