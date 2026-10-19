"""궁 이펙트 게임용 해상도 후보(사용자 10-19: 원본 보존, 실제 표시 크기에서 비교한 뒤 정함 — 확정 전).

data/art/fx/ult(원본 해상도, 알파 0 여백만 자름)를 1/2·1/3로 줄인 후보를 out에 만든다(게임 데이터는 그대로).
알파를 미리 곱해 줄이고(가장자리가 어두워지지 않게) 되돌린다. 기준점·heightsPerPx도 같은 배율로 바꾼 fx 표를 함께 적는다.
  python3 tools/art/ult-fx-candidates.py <out>      → <out>/half/..., <out>/third/..., <out>/fx.json
"""
import json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')


def shrink(im, k):
    a = np.asarray(im).astype(np.float32); a[..., :3] *= a[..., 3:4] / 255
    w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
    sm = np.stack([np.asarray(Image.fromarray(a[..., c], 'F').resize((w, h), Image.LANCZOS)) for c in range(4)], -1).clip(0, 255)
    rgb = np.where(sm[..., 3:4] > 0, sm[..., :3] * 255 / np.maximum(sm[..., 3:4], 1e-3), 0)
    return Image.fromarray(np.dstack([rgb.clip(0, 255), sm[..., 3]]).round().astype(np.uint8), 'RGBA')


def main(out):
    fx = json.load(open(os.path.join(ROOT, 'data', 'duat.json')))['field']['ult']['fx']
    table = {'full': fx}
    for tag, k in (('half', 1 / 2), ('third', 1 / 3)):
        t = {}
        for who, v in fx.items():
            frames = []
            for f in v['frames']:
                im = shrink(Image.open(os.path.join(ROOT, 'data', f['file'])).convert('RGBA'), k)
                name = f'art/fx/ult-{tag}/' + os.path.basename(f['file'])
                os.makedirs(os.path.join(out, os.path.dirname(name)), exist_ok=True)
                im.save(os.path.join(out, name), optimize=True)
                frames.append({**f, 'file': name, 'w': im.width, 'h': im.height, 'ax': round(f['ax'] * k, 2), 'ay': round(f['ay'] * k, 2)})
            t[who] = {**v, 'frames': frames, 'heightsPerPx': v['heightsPerPx'] / k}
            print(tag, who, [f'{f["w"]}x{f["h"]}' for f in frames][:2])
        table[tag] = t
    json.dump(table, open(os.path.join(out, 'fx.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(sys.argv[1])
