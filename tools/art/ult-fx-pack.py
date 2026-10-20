"""궁 이펙트 게임용 프레임(사용자 10-19: 채택본 docs/art/skill-effects/final, 기준점·재생 시간은 manifest).

완전히 투명한(알파 0) 여백만 잘라낸다. 희미한 빛·연기·반투명 테두리(알파 1 이상)는 모두 남긴다. 게임용은 가로·세로
SCALE(½, 사용자 10-20: 실제 폰 크기에서 원본과 비교해 채택)로 줄여 저장한다(알파를 미리 곱해 줄여 가장자리가 어두워지지 않게).
원본 PNG는 그대로 둔다. 화면 크기(heightsPerPx)와 타격 범위(area)는 원본 해상도에서 재고 배율만 바꿔 적으므로, 줄여도
화면에 그려지는 크기·판정·재생 시간(ms)은 원본 때와 같다.
잘린 위치는 기준점(anchor)에 반영해 data/duat.json field.ult.fx.<who>에 적는다:
  frames: [{file, w, h, ax, ay, ms}]  (게임용 그림의 크기·기준점 px, ms = 이 프레임 재생 시간)
  heightsPerPx: 게임용 그림 1px이 캐릭터 키 몇 개로 그려지는지(가장 큰 장면의 또렷한 부분 긴 변 = 캐릭터 키 SPAN배, 시제품 값)
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
SCALE = 1 / 2   # the game's frames to the originals (user 10-20: ½ adopted)


def shrink(im, k):
    """k× smaller, alpha premultiplied first (the edge glow does not darken), Lanczos — as tools/art/ult-fx-candidates.py"""
    a = np.asarray(im).astype(np.float32); a[..., :3] *= a[..., 3:4] / 255
    w, h = max(1, round(im.width * k)), max(1, round(im.height * k))
    sm = np.stack([np.asarray(Image.fromarray(a[..., c], 'F').resize((w, h), Image.LANCZOS)) for c in range(4)], -1).clip(0, 255)
    rgb = np.where(sm[..., 3:4] > 0, sm[..., :3] * 255 / np.maximum(sm[..., 3:4], 1e-3), 0)
    return Image.fromarray(np.dstack([rgb.clip(0, 255), sm[..., 3]]).round().astype(np.uint8), 'RGBA')


def seen(im):
    ys, xs = np.nonzero(np.asarray(im)[..., 3] >= SEEN)
    return max(int(xs.max() - xs.min()) + 1, int(ys.max() - ys.min()) + 1) if len(xs) else 0


def originals():
    """each adopted frame cut to its non-transparent box: (who, frame, piece, ax, ay, ms), original pixels"""
    man = json.load(open(os.path.join(SRC, 'manifest.json')))
    for f in man['files']:
        path = os.path.join(SRC, f['path'])
        assert hashlib.sha256(open(path, 'rb').read()).hexdigest() == f['sha256'], path
        im = Image.open(path).convert('RGBA')
        ys, xs = np.nonzero(np.asarray(im)[..., 3] > 0)   # only fully transparent margin goes
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        piece = im.crop((x0, y0, x1, y1))
        assert np.array_equal(np.asarray(piece), np.asarray(im)[y0:y1, x0:x1])   # the same pixels
        yield WHO[f['character']], f['frame'], piece, f['anchor'][0] - x0, f['anchor'][1] - y0, f['duration_ms']


def main():
    os.makedirs(OUT, exist_ok=True)
    fx, full = {}, {}
    for who, frame, piece, ax, ay, ms in originals():
        full.setdefault(who, []).append((np.asarray(piece)[..., 3], ax, ay, seen(piece)))
        small = shrink(piece, SCALE) if SCALE != 1 else piece
        name = f'art/fx/ult/{who}-{frame}.png'
        small.save(os.path.join(ROOT, 'data', name), optimize=True)
        k = small.width / piece.width
        fx.setdefault(who, {'frames': []})['frames'].append({'file': name, 'w': small.width, 'h': small.height, 'ax': round(ax * k, 2), 'ay': round(ay * k, 2), 'ms': ms})
        print(who, frame, piece.size, '->', small.size)
    for who, v in fx.items():
        hpp = SPAN / max(q[3] for q in full[who])   # measured on the originals
        v['heightsPerPx'] = round(hpp / SCALE, 7)
        if who in FLOOR: v['area'] = area(who, full[who], hpp)
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


def area(who, frames, hpp):
    """frames: (alpha, ax, ay, …) of the originals; hpp: character heights per original px"""
    rx = ry = 0
    for a, ax, ay, *_ in frames:
        ys, xs = np.nonzero(a >= MAIN)
        if not len(xs): continue
        dy = ys - ay
        below = np.percentile(dy[dy > 0], 98) if (dy > 0).any() else 0
        above = np.percentile(-dy[dy < 0], 98) if (dy < 0).any() else 0
        rx = max(rx, np.percentile(np.abs(xs - ax), 98))
        ry = max(ry, (below + above) / 2 if FLOOR[who] == 'both' else below)
    return {'rx': round(float(rx) * hpp, 2), 'ry': round(float(ry) * hpp, 2)}


def only_area():
    p = os.path.join(ROOT, 'data', 'duat.json')
    d = json.load(open(p))
    full = {}
    for who, frame, piece, ax, ay, ms in originals(): full.setdefault(who, []).append((np.asarray(piece)[..., 3], ax, ay, seen(piece)))
    for who, v in d['field']['ult']['fx'].items():
        if who in FLOOR: v['area'] = area(who, full[who], SPAN / max(q[3] for q in full[who])); print(who, v['area'])
    open(p, 'w').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    import sys
    only_area() if '--area' in sys.argv else main()
