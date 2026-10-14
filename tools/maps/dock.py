# 선착장 세부맵 (0.9.70): the user's dock picture (세부맵1/선착장-시안4-낮.png, kept byte for byte as
# docs/art/map-expansion/dock-pier-v1-day.png) as its own walkable map, like the residence scenes (tools/maps/residence.py,
# whose writer helpers it uses). Walking down onto the Ombos pier brings her here (ombos.json exit); the stone path at
# the top leads back. Fishing happens on the end of this pier (packs/life/dock.js). One picture, the village's night
# shade over it (no authored night yet). Writes data/maps/dock_pier.json and its data/scene-art.json entry.
#   python3 tools/maps/dock.py
# Coordinates in tiles: 19 × 13 on the 1536 × 1024 picture (one tile ≈ 81 × 79 picture px, the residence's size).
import json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import residence as R

ROOT = R.ROOT
SRC = os.path.join(ROOT, '세부맵1', '선착장-시안4-낮.png')
FILE = 'dock-pier-v1-day.png'
W, H = 19, 13
# back out in the village: on the grass at the top of the Ombos pier, facing the village (player coordinates)
OMBOS_DOCK = {'x': 25.0, 'y': 26.75, 'dir': 'up'}
SOLID = [
    [0, 0, 4.2, 4.0],            # the shade awning, its rug and the two palms on the left
    [4.0, 1.9, 5.1, 2.8],        # flowers under the second palm
    [6.9, 0.4, 7.9, 1.4], [11.3, 0.6, 12.5, 1.5], [11.6, 2.5, 13.2, 3.6],   # bushes on the sand
    [12.4, 0, 19, 1.6], [13.2, 1.6, 19, 13],   # rocks, palms and reeds on the right, the water and the boat below
    [0, 4.0, 6.2, 13],           # the left bank's rocks and reeds, the water
    [6.6, 2.9, 8.25, 4.0], [10.85, 2.9, 12.3, 4.0],   # the low walls and pillars beside the steps
    [6.0, 4.0, 7.75, 5.15],      # lantern post, crate, jar and basket on the left of the deck
    [11.4, 4.0, 13.3, 6.15],     # crate, towel, basket and the post on the right
    [12.6, 6.15, 13.3, 13], [6.2, 7.0, 12.6, 13],   # past the deck's right edge and its front: water
]
EXITS = [[[8.2, 0, 10.7, 0.45], 'ombos', OMBOS_DOCK]]
ENTRY = {'path': [9.45, 1.3, 'down']}
SPOTS = [{'id': 'dock', 'x': 9.45, 'y': 6.4, 'label': '선착장', 'mode': 'life', 'title': '선착장',
          'text': '나일이 발밑에서 출렁인다. 물가 갈대 사이로 뭔가 걸려 있는 게 보인다.'}]


def main():
    dst = os.path.join(ROOT, 'docs', 'art', 'map-expansion', FILE)
    shutil.copyfile(SRC, dst)
    iw, ih = R.size_of(dst)
    kx, ky = iw / W, ih / H
    poly = lambda r: [[round(r[0] * kx, 1), round(r[1] * ky, 1)], [round(r[2] * kx, 1), round(r[1] * ky, 1)],
                      [round(r[2] * kx, 1), round(r[3] * ky, 1)], [round(r[0] * kx, 1), round(r[3] * ky, 1)]]
    for k, (fx, fy, _) in ENTRY.items():
        box = [(fx + dx, fy + dy) for dx in (-0.28, 0.28) for dy in (-0.18, 0.16)]
        assert not any(r[0] <= x < r[2] and r[1] <= y < r[3] for r in SOLID for x, y in box), (k, 'blocked')
        assert not any(r[0] <= fx <= r[2] and r[1] <= fy <= r[3] for r, _, _ in EXITS), (k, 'on an exit')
    entry = {k: {'x': round(v[0] - 0.5, 2), 'y': round(v[1] - 0.8, 2), 'dir': v[2]} for k, v in ENTRY.items()}
    data = {
        'id': 'dock_pier', 'name': '선착장', 'tile': 16, 'scene': 'dock', 'referenceScenes': ['dock_pier'],
        'legend': {'.': {'t': 'sand'}}, 'rows': ['.' * W] * H,
        'authoredCollision': {'width': iw, 'height': ih, 'shapes': [{'id': f's{i}', 'polygon': poly(r)} for i, r in enumerate(SOLID)]},
        'exits': [{'x0': r[0], 'y0': r[1], 'x1': r[2], 'y1': r[3], 'to': to, 'at': at} for r, to, at in EXITS],
        'entries': entry, 'spawn': entry['path'],
        'spots': [{**s, 'x': s['x'] - 0.5, 'y': s['y'] - 0.5} for s in SPOTS],
        'labels': [{'x': 9.45 - 0.5, 'y': 0.75 + 0.55, 'label': '↑ 옴보스', 'near': EXITS[0][0]}],
        'note': '부두 끝에서 낚시해. 위 돌길로 올라가면 옴보스야.',
    }
    with open(os.path.join(ROOT, 'data', 'maps', 'dock_pier.json'), 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    art = json.load(open(os.path.join(ROOT, 'data', 'scene-art.json')))
    art['dock_pier'] = {'file': R.ART + FILE, 'fullMap': True, 'lazy': True, 'origin': [0, 0], 'scale': [W * 16 / iw, H * 16 / ih],
                        'day': [0, 0, iw, ih], 'night': [0, 0, iw, ih], 'clip': [[0, 0], [iw, 0], [iw, ih], [0, ih]], 'tintNight': True}
    with open(os.path.join(ROOT, 'data', 'scene-art.json'), 'w') as f:
        f.write(R.dump(art) + '\n')
    print('wrote dock_pier', iw, ih)


if __name__ == '__main__':
    main()
