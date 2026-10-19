"""궁 이펙트 게임용 프레임(사용자 10-19: 채택본 docs/art/skill-effects/final, 기준점·재생 시간은 manifest).

완전히 투명한(알파 0) 여백만 잘라낸다. 희미한 빛·연기·반투명 테두리(알파 1 이상)는 모두 남기고, 원본 해상도 그대로
(축소 없음 — 게임용 해상도는 실제 표시 크기에서 확인받은 뒤 정한다). 원본 PNG는 그대로 둔다.
잘린 위치는 기준점(anchor)에 반영해 data/duat.json field.ult.fx.<who>에 적는다:
  frames: [{file, w, h, ax, ay, ms}]  (ax, ay = 잘린 그림 안의 기준점 px, ms = 이 프레임 재생 시간)
  heightsPerPx: 원본 1px이 캐릭터 키 몇 개로 그려지는지(가장 큰 장면의 또렷한 부분 긴 변 = 캐릭터 키 SPAN배, 시제품 값)
  python3 tools/art/ult-fx-pack.py           (--area: 타격 범위 area만 다시 계산)
"""
import hashlib, json, os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(ROOT, 'docs', 'art', 'skill-effects', 'final')
OUT = os.path.join(ROOT, 'data', 'art', 'fx', 'ult')
WHO = {'Set': 'set', 'Horus': 'horus', 'Somang': 'somang'}
# how big it is drawn (prototype; user 10-19: about four times a character): what is plainly seen (alpha 64 and up, not the
# faint haze round it) of the largest frame spans this many character heights on its longer side — so on any map it
# keeps to the people's size (Somang's lotus ring round the two of them)
SPAN, SEEN = 4, 64


def seen(im):
    ys, xs = np.nonzero(np.asarray(im)[..., 3] >= SEEN)
    return max(int(xs.max() - xs.min()) + 1, int(ys.max() - ys.min()) + 1) if len(xs) else 0


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
        fx.setdefault(who, {'frames': []})['frames'].append({'file': name, 'w': x1 - x0, 'h': y1 - y0, 'ax': f['anchor'][0] - x0, 'ay': f['anchor'][1] - y0, 'ms': f['duration_ms'], 'seen': seen(piece)})
        print(who, f['frame'], (x1 - x0, y1 - y0))
    for who, v in fx.items():
        v['heightsPerPx'] = round(SPAN / max(fr.pop('seen') for fr in v['frames']), 7)
        if who in FLOOR: v['area'] = area(who, v)
    p = os.path.join(ROOT, 'data', 'duat.json')
    d = json.load(open(p))
    d['field'].setdefault('ult', {})['fx'] = fx
    open(p, 'w').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')


# where 세트's storm and 호루스's shock wave hurt (user 10-19): the main part of the picture as drawn — alpha MAIN and up,
# not the faint glow or after-light round it — as an oval on the floor round the anchor, in character heights:
#   rx: how far out to either side (98th percentile of its pixels, over the frames: the widest),
#   ry: how deep — the storm is a flat whirl on the ground (half its whole height round the anchor); the shock wave's
#       ground ring is what lies below the anchor (above it the wings rise, height not floor)
MAIN, FLOOR = 160, {'set': 'both', 'horus': 'below'}


def area(who, v):
    rx = ry = 0
    for f in v['frames']:
        a = np.asarray(Image.open(os.path.join(ROOT, 'data', f['file'])).convert('RGBA'))[..., 3]
        ys, xs = np.nonzero(a >= MAIN)
        if not len(xs): continue
        dy = ys - f['ay']
        below = np.percentile(dy[dy > 0], 98) if (dy > 0).any() else 0
        above = np.percentile(-dy[dy < 0], 98) if (dy < 0).any() else 0
        rx = max(rx, np.percentile(np.abs(xs - f['ax']), 98))
        ry = max(ry, (below + above) / 2 if FLOOR[who] == 'both' else below)
    return {'rx': round(float(rx) * v['heightsPerPx'], 2), 'ry': round(float(ry) * v['heightsPerPx'], 2)}


def only_area():
    p = os.path.join(ROOT, 'data', 'duat.json')
    d = json.load(open(p))
    for who, v in d['field']['ult']['fx'].items():
        if who in FLOOR: v['area'] = area(who, v); print(who, v['area'])
    open(p, 'w').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    import sys
    only_area() if '--area' in sys.argv else main()
