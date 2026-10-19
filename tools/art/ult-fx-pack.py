"""궁 이펙트 게임용 프레임(사용자 10-19: 채택본 docs/art/skill-effects/final, 기준점·재생 시간은 manifest).

완전히 투명한(알파 0) 여백만 잘라낸다. 희미한 빛·연기·반투명 테두리(알파 1 이상)는 모두 남기고, 원본 해상도 그대로
(축소 없음 — 게임용 해상도는 실제 표시 크기에서 확인받은 뒤 정한다). 원본 PNG는 그대로 둔다.
잘린 위치는 기준점(anchor)에 반영해 data/duat.json field.ult.fx.<who>에 적는다:
  frames: [{file, w, h, ax, ay, ms}]  (ax, ay = 잘린 그림 안의 기준점 px, ms = 이 프레임 재생 시간)
  tilesPerPx: 원본 1px이 몇 칸으로 그려지는지(궁 범위에 맞춘 시제품 값 — 수치 확정 전)
  python3 tools/art/ult-fx-pack.py
"""
import hashlib, json, os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(ROOT, 'docs', 'art', 'skill-effects', 'final')
OUT = os.path.join(ROOT, 'data', 'art', 'fx', 'ult')
WHO = {'Set': 'set', 'Horus': 'horus', 'Somang': 'somang'}
# how big it is drawn (prototype): the widest frame's body spans this many tiles — Set's storm and Horus's shock wave a
# little wider than their reach (field.ult.<who>.r), Somang's lotus round the two of them
SPAN = {'set': 2.6 * 2.2, 'horus': 3.2 * 2.2, 'somang': 3.2}


def main():
    man = json.load(open(os.path.join(SRC, 'manifest.json')))
    os.makedirs(OUT, exist_ok=True)
    fx = {}
    for f in man['files']:
        who = WHO[f['character']]
        path = os.path.join(SRC, f['path'])
        assert hashlib.sha256(open(path, 'rb').read()).hexdigest() == f['sha256'], path
        im = Image.open(path).convert('RGBA')
        a = np.asarray(im)[..., 3]
        ys, xs = np.nonzero(a > 0)   # only fully transparent margin goes
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        piece = im.crop((x0, y0, x1, y1))
        assert np.array_equal(np.asarray(piece), np.asarray(im)[y0:y1, x0:x1])   # the same pixels
        name = f'art/fx/ult/{who}-{f["frame"]}.png'
        piece.save(os.path.join(ROOT, 'data', name), optimize=True)
        fx.setdefault(who, {'frames': []})['frames'].append({'file': name, 'w': x1 - x0, 'h': y1 - y0, 'ax': f['anchor'][0] - x0, 'ay': f['anchor'][1] - y0, 'ms': f['duration_ms']})
        print(who, f['frame'], (x1 - x0, y1 - y0))
    for who, v in fx.items():
        v['tilesPerPx'] = round(SPAN[who] / max(fr['w'] for fr in v['frames']), 6)
    p = os.path.join(ROOT, 'data', 'duat.json')
    d = json.load(open(p))
    d['field'].setdefault('ult', {})['fx'] = fx
    open(p, 'w').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
