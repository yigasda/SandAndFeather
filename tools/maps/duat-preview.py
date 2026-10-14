"""A-2 only: two exact-scale live-game previews; no production maps are changed.

python3 tools/maps/duat-preview.py
The browser test loads the generated definitions into its disposable ST chat.
Collision/exits/encounters are intentionally not claimed complete at this checkpoint.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/consult/duat-field/scale'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, default=OUT)
    parser.add_argument('--sizes', type=int, nargs='+', default=[52, 60])
    args = parser.parse_args()
    out = args.out.resolve()
    if any(size <= 0 for size in args.sizes):
        parser.error('sizes must be positive')
    src_dir = ROOT / '세부맵1/두아트'
    manifest = json.loads((src_dir / 'manifest.json').read_text())
    source = manifest['files'][0]
    raw = (src_dir / source['file']).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == source['sha256']
    out.mkdir(parents=True, exist_ok=True)
    (out / 'boundary-source.png').write_bytes(raw)
    definitions = []
    for size in args.sizes:
        name = f'duat_scale_{size}'
        w, h = math.ceil(1024 / size), math.ceil(1536 / size)
        # Map dimensions must be whole tiles. The approved image is not stretched
        # to that grid: use exactly 16/size and block only the padding beyond it.
        outside = [
            [[1024, 0], [w * size, 0], [w * size, h * size], [1024, h * size]],
            [[0, 1536], [w * size, 1536], [w * size, h * size], [0, h * size]],
        ]
        definitions.append({
            'pixelsPerTile': size,
            'map': {
                'id': name, 'name': '경계 동굴 · 배율 시안', 'tile': 16,
                'referenceScenes': [name], 'legend': {'.': {'t': 'sand'}},
                'rows': ['.' * w] * h, 'spots': [], 'exits': [],
                'spawn': {'x': 550 / size - .5, 'y': 1180 / size - .8, 'dir': 'right'},
                'authoredCollision': {'width': w * size, 'height': h * size,
                    'shapes': [{'id': f'padding-{i}', 'polygon': p} for i, p in enumerate(outside)]},
                'note': '배율 비교 시안. 이동 충돌·출구·전투는 미적용.',
            },
            'scene': {
                'file': '../' + (out / 'boundary-source.png').relative_to(ROOT).as_posix(),
                'fullMap': True, 'lazy': True, 'origin': [0, 0],
                'scale': [16 / size, 16 / size],
                'day': [0, 0, 1024, 1536], 'night': [0, 0, 1024, 1536],
                'clip': [[0, 0], [1024, 0], [1024, 1536], [0, 1536]],
            },
        })
    (out / 'candidates.json').write_text(json.dumps({
        'status': 'preview-not-integrated', 'sourceSha256': source['sha256'],
        'positions': {'entry': [550, 1180], 'stairs': [410, 780], 'door': [550, 270]},
        'candidates': definitions,
    }, ensure_ascii=False, indent=2) + '\n')
    print(f'Wrote {out}: source SHA256 verified, sizes {args.sizes}')


if __name__ == '__main__':
    main()
