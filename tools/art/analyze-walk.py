# Measures how the approved trio walk frames move, frame by frame, so a redraw can be checked against them by numbers
# and by eye. Read-only on the approved art (docs/art/chibi-refresh/approved/walk/<who>-<view>-<0|1|2>.png).
#
#   python3 tools/art/analyze-walk.py                 → docs/art/chibi-refresh/walk-analysis/ (sheets, analysis.json, table)
#   python3 tools/art/analyze-walk.py --candidate DIR → DIR/walk-check/ : the same measures for DIR/<who>-<view>-<i>.png,
#                                                       side by side with the approved ones, and what does not move alike
#
# Parts are found by colour: hair by each character's hair hue, skin by its peach tone. The pivot is the feet
# (manifest: 180, 370 in a 360×400 cell), so every number is in cell pixels and is directly comparable between frames.
# Motion is reported against frame 1, the middle pose of the 0-1-2-1 cycle.
import argparse, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
APPROVED = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'approved', 'walk')
OUT = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'walk-analysis')
WHO = ['set', 'somang', 'horus']
VIEWS = ['front', 'back', 'left', 'right']
try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
except OSError:
    FONT = ImageFont.load_default()
KO = {'set': '세트', 'somang': '소망', 'horus': '호루스', 'front': '정면', 'back': '뒤', 'left': '왼쪽', 'right': '오른쪽'}


def hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6
    h[gg] = (b - r)[gg] / d[gg] + 2
    h[bb] = (r - g)[bb] / d[bb] + 4
    return h / 6, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx


def hue_near(h, c, w):
    return np.minimum(abs(h - c), 1 - abs(h - c)) < w


def masks(im, who):
    a = im[..., 3] > 128
    h, s, v = hsv(im[..., :3] / 255)
    ys = np.nonzero(a.any(1))[0]
    top, bottom = ys.min(), ys.max()
    hgt = bottom - top + 1
    rows = np.arange(im.shape[0])[:, None]
    above_feet = rows < bottom - 0.14 * hgt
    if who == 'set':
        hair = hue_near(h, 0.972, 0.045) & (s > 0.3) & (v < 0.75)
    elif who == 'horus':
        hair = (h > 0.58) & (h < 0.75) & (s > 0.25) & (v < 0.8)
    else:
        hair = hue_near(h, 0.03, 0.05) & (s > 0.2) & (v < 0.72) & (v > 0.08)
    # Horus's short hair ends at the head; the girls' hair falls to the waist, but never as low as the sandals
    hair_end = top + (0.55 if who == 'horus' else 0.86) * hgt
    hair &= a & above_feet & (rows < hair_end)
    skin = (hue_near(h, 0.06, 0.06)) & (s > 0.12) & (s < 0.48) & (v > 0.8) & a
    return a, hair, skin, top, bottom, hgt


def largest(mask):
    # the biggest 4-connected blob (the face among bits of skin)
    from collections import deque
    seen = np.zeros_like(mask); best = None
    H, W = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]: continue
        q = deque([(y, x)]); seen[y, x] = True; pts = []
        while q:
            cy, cx = q.popleft(); pts.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if best is None or len(pts) > len(best): best = pts
    out = np.zeros_like(mask)
    if best:
        yy, xx = zip(*best); out[list(yy), list(xx)] = True
    return out


def measure(path, who, view):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    a, hair, skin, top, bottom, hgt = masks(im, who)
    head_cut = int(top + 0.55 * hgt)  # chibi head and face sit in the top half
    # the face: all skin above the chin line (cheek, ear and face together, so a turn moves its centre);
    # from behind there is no face to measure
    face = skin & (np.arange(im.shape[0])[:, None] < head_cut) if view != 'back' else np.zeros_like(skin)
    r = {'top': int(top), 'bottom': int(bottom), 'height': int(hgt), 'headCut': head_cut}
    if hair.any():
        yy, xx = np.nonzero(hair)
        r['hair'] = {'area': int(hair.sum()), 'cx': round(xx.mean(), 1), 'cy': round(yy.mean(), 1),
                     'left': int(xx.min()), 'right': int(xx.max()), 'lowest': int(yy.max())}
    if face.sum() > 80:
        yy, xx = np.nonzero(face)
        r['face'] = {'area': int(face.sum()), 'cx': round(xx.mean(), 1), 'cy': round(yy.mean(), 1),
                     'left': int(xx.min()), 'right': int(xx.max()), 'top': int(yy.min()), 'bottom': int(yy.max())}
    band = a & ~hair
    b0, b1 = int(top + 0.57 * hgt), int(top + 0.67 * hgt)  # shoulders and chest: the legs and skirt swing below
    cs = [np.nonzero(band[y])[0].mean() for y in range(b0, b1) if band[y].any()]
    r['bodyCx'] = round(float(np.median(cs)), 1) if cs else None
    if 'face' in r and r['bodyCx'] is not None:
        r['faceMinusBody'] = round(r['face']['cx'] - r['bodyCx'], 1)
    feet = a[int(bottom - 0.12 * hgt):bottom + 1]
    fx = np.nonzero(feet.any(0))[0]
    r['feet'] = {'left': int(fx.min()), 'right': int(fx.max())}
    return r, im, a, hair, face


def head_change(im0, im1, cut):
    # share of the head area whose colour changed between two frames (alpha or > 40 per channel)
    A, B = im0[:cut], im1[:cut]
    union = (A[..., 3] > 128) | (B[..., 3] > 128)
    diff = (abs(A - B).max(-1) > 40) & union
    return round(float(diff.sum() / max(union.sum(), 1)), 3), diff


def motion(fr):
    # each frame against the middle pose
    m = {}
    base = fr[1]
    for i in (0, 2):
        f = fr[i]; d = {'topDy': f['top'] - base['top']}
        if 'hair' in f and 'hair' in base:
            for k in ('cx', 'cy'): d['hair' + k.upper()] = round(f['hair'][k] - base['hair'][k], 1)
            d['hairLeft'] = f['hair']['left'] - base['hair']['left']
            d['hairRight'] = f['hair']['right'] - base['hair']['right']
            d['hairLowest'] = f['hair']['lowest'] - base['hair']['lowest']
        if 'face' in f and 'face' in base:
            d['faceCX'] = round(f['face']['cx'] - base['face']['cx'], 1)
            d['faceCY'] = round(f['face']['cy'] - base['face']['cy'], 1)
            d['faceWidth'] = (f['face']['right'] - f['face']['left']) - (base['face']['right'] - base['face']['left'])
        if f.get('bodyCx') is not None and base.get('bodyCx') is not None:
            d['bodyCX'] = round(f['bodyCx'] - base['bodyCx'], 1)
        m[str(i)] = d
    return m


def analyse(folder):
    res = {}
    for who in WHO:
        for view in VIEWS:
            paths = [os.path.join(folder, f'{who}-{view}-{i}.png') for i in range(3)]
            if not all(os.path.exists(p) for p in paths): continue
            got = [measure(p, who, view) for p in paths]
            fr = [g[0] for g in got]
            cut = max(f['headCut'] for f in fr)
            ch = {k: head_change(got[i][1], got[1][1], cut)[0] for k, i in (('0', 0), ('2', 2))}
            res[f'{who}-{view}'] = {'frames': fr, 'motion': motion(fr), 'headChange': ch, '_got': got}
    return res


def outline(mask):
    e = mask.copy()
    e[1:-1, 1:-1] = mask[1:-1, 1:-1] & ~(mask[:-2, 1:-1] & mask[2:, 1:-1] & mask[1:-1, :-2] & mask[1:-1, 2:])
    return e


def sheet(res, who, path, title):
    # one row a view: the three frames with marks, the hair of all three laid over each other, and what changed in
    # the head between each step and the middle pose
    rows = [v for v in VIEWS if f'{who}-{v}' in res]
    W, H = 360, 400
    cv = Image.new('RGBA', (W * 6, H * len(rows) + 36), (236, 232, 226, 255))
    d = ImageDraw.Draw(cv)
    d.text((8, 0), title, fill=(60, 40, 20, 255), font=FONT)
    heads = ['프레임 0', '프레임 1 (가운데)', '프레임 2', '머리카락 윤곽 0빨강 1초록 2파랑', '머리 영역 바뀐 곳 0↔1', '머리 영역 바뀐 곳 2↔1']
    for c, t in enumerate(heads): d.text((c * W + 8, 14), t, fill=(90, 70, 50, 255), font=FONT)
    for r, view in enumerate(rows):
        R = res[f'{who}-{view}']; got = R['_got']; y0 = 36 + r * H
        for i in range(3):
            f, im, a, hair, face = got[i]
            tile = Image.fromarray(im.astype(np.uint8), 'RGBA')
            cv.alpha_composite(tile, (i * W, y0))
            dd = ImageDraw.Draw(cv)
            dd.line([(i * W, y0 + f['top']), (i * W + W - 1, y0 + f['top'])], fill=(0, 120, 255, 255))
            dd.line([(i * W, y0 + f['headCut']), (i * W + W - 1, y0 + f['headCut'])], fill=(0, 120, 255, 90))
            if f.get('bodyCx') is not None:
                bx = i * W + f['bodyCx']; dd.line([(bx, y0 + f['headCut']), (bx, y0 + f['bottom'])], fill=(255, 0, 160, 255), width=2)
            if 'face' in f:
                fc = f['face']; dd.rectangle([i * W + fc['left'], y0 + fc['top'], i * W + fc['right'], y0 + fc['bottom']], outline=(0, 170, 90, 255))
                x, y = i * W + fc['cx'], y0 + fc['cy']; dd.line([(x - 6, y), (x + 6, y)], fill=(0, 170, 90, 255), width=2); dd.line([(x, y - 6), (x, y + 6)], fill=(0, 170, 90, 255), width=2)
            dd.text((i * W + 6, y0 + 4), f'{KO[view]} {i}', fill=(40, 30, 20, 255), font=FONT)
        on = np.zeros((H, W, 4), np.uint8)
        on[..., 3] = (got[1][2].astype(np.uint8)) * 60
        for i, col in enumerate([(220, 30, 30), (20, 160, 40), (30, 70, 230)]):
            o = outline(got[i][3])
            o[1:] |= o[:-1]; o[:, 1:] |= o[:, :-1]  # 2 px so the three outlines can be told apart
            on[o] = (*col, 255)
        cv.alpha_composite(Image.fromarray(on, 'RGBA'), (3 * W, y0))
        cut = max(g[0]['headCut'] for g in got)
        for c, i in ((4, 0), (5, 2)):
            _, diff = head_change(got[i][1], got[1][1], cut)
            base = got[1][1].astype(np.uint8).copy(); base[..., 3] = (base[..., 3] * 0.35).astype(np.uint8)
            base[:cut][diff] = (255, 0, 200, 255)
            cv.alpha_composite(Image.fromarray(base, 'RGBA'), (c * W, y0))
            ImageDraw.Draw(cv).text((c * W + 6, y0 + 4), f'{R["headChange"][str(i)] * 100:.0f}% 바뀜', fill=(120, 0, 90, 255), font=FONT)
    cv.convert('RGB').save(path, optimize=True)


def zoom(res, who, path):
    # the head zone of the three frames at 2× so the hair ends and face turn can be read
    rows = [v for v in VIEWS if f'{who}-{v}' in res]
    crops = []
    for view in rows:
        got = res[f'{who}-{view}']['_got']
        cut = max(g[0]['headCut'] for g in got) + 10
        top = max(0, min(g[0]['top'] for g in got) - 6)
        crops.append([Image.fromarray(g[1][top:cut].astype(np.uint8), 'RGBA').resize((360 * 2, (cut - top) * 2), Image.NEAREST) for g in got])
    Hs = [c[0].height for c in crops]
    cv = Image.new('RGBA', (720 * 3, sum(Hs) + 4 * len(Hs)), (236, 232, 226, 255))
    y = 0
    for c in crops:
        for i, t in enumerate(c): cv.alpha_composite(t, (i * 720, y))
        y += c[0].height + 4
    cv.convert('RGB').save(path, optimize=True)


def strip(res):
    return {k: {kk: vv for kk, vv in v.items() if kk != '_got'} for k, v in res.items()}


def table(res):
    lines = ['| 캐릭터·방향 | 머리 위끝 dy (0/2) | 머리카락 중심 dx (0/2) | 머리카락 끝 아래로 (0/2) | 머리카락 좌우 끝 dx (0/2) | 얼굴 중심 dx,dy (0/2) | 얼굴−몸 중심 (0/1/2) | 머리 영역 바뀐 비율 (0/2) |',
             '|---|---|---|---|---|---|---|---|']
    for k, R in res.items():
        who, view = k.split('-'); m0, m2 = R['motion']['0'], R['motion']['2']; fr = R['frames']
        g = lambda m, key: m.get(key, '–')
        fb = '/'.join(str(f.get('faceMinusBody', '–')) for f in fr)
        lines.append(f"| {KO[who]} {KO[view]} | {g(m0,'topDy')}/{g(m2,'topDy')} | {g(m0,'hairCX')}/{g(m2,'hairCX')} | {g(m0,'hairLowest')}/{g(m2,'hairLowest')} | "
                     f"{g(m0,'hairLeft')},{g(m0,'hairRight')} / {g(m2,'hairLeft')},{g(m2,'hairRight')} | {g(m0,'faceCX')},{g(m0,'faceCY')} / {g(m2,'faceCX')},{g(m2,'faceCY')} | {fb} | "
                     f"{R['headChange']['0']*100:.0f}% / {R['headChange']['2']*100:.0f}% |")
    return '\n'.join(lines)


def check(ref, cand):
    # what a redraw should share with the approved walk: the head changes from step to step about as much, the hair
    # and face move the same way, and the face stays over the body
    out = []
    for k, C in cand.items():
        if k not in ref: continue
        A = ref[k]; who, view = k.split('-')
        s = C['frames'][1]['height'] / A['frames'][1]['height']
        notes = []
        for i in ('0', '2'):
            a, c = A['headChange'][i], C['headChange'][i]
            if c < 0.4 * a: notes.append(f'프레임 {i}: 머리 영역 변화 {c*100:.0f}% (승인 {a*100:.0f}%) — 머리 고정 의심')
            for key, label, tol in (('hairCX', '머리카락 중심 x', 3), ('hairLowest', '머리카락 끝', 4), ('faceCX', '얼굴 중심 x', 3), ('topDy', '머리 위끝', 3)):
                av, cvv = A['motion'][i].get(key), C['motion'][i].get(key)
                if av is None or cvv is None: continue
                want = av * s
                if abs(cvv - want) > max(tol, abs(want) * 0.6) or (abs(want) >= 2 and np.sign(cvv) != np.sign(want)):
                    notes.append(f'프레임 {i}: {label} {cvv:+} (승인 기준 {want:+.1f})')
        fa = [f.get('faceMinusBody') for f in A['frames']]; fc = [f.get('faceMinusBody') for f in C['frames']]
        for i in range(3):
            if fa[i] is not None and fc[i] is not None and abs(fc[i] - fa[i] * s) > 6:
                notes.append(f'프레임 {i}: 얼굴−몸 중심 {fc[i]:+} (승인 기준 {fa[i]*s:+.1f}) — 몸이 얼굴 아래에서 어긋남')
        out.append((f'{KO[who]} {KO[view]}', notes))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--candidate')
    args = ap.parse_args()
    ref = analyse(APPROVED)
    if not args.candidate:
        os.makedirs(OUT, exist_ok=True)
        for who in WHO:
            sheet(ref, who, os.path.join(OUT, f'{who}-walk-marks.png'), f'approved walk — {who}')
            zoom(ref, who, os.path.join(OUT, f'{who}-head-zoom.png'))
        json.dump(strip(ref), open(os.path.join(OUT, 'analysis.json'), 'w'), ensure_ascii=False, indent=1)
        open(os.path.join(OUT, 'table.md'), 'w').write(table(ref) + '\n')
        print('wrote', OUT)
        return
    cand = analyse(args.candidate)
    out = os.path.join(args.candidate, 'walk-check'); os.makedirs(out, exist_ok=True)
    for who in WHO:
        if any(k.startswith(who + '-') for k in cand):
            sheet(cand, who, os.path.join(out, f'{who}-walk-marks.png'), f'candidate walk — {who}')
    json.dump(strip(cand), open(os.path.join(out, 'analysis.json'), 'w'), ensure_ascii=False, indent=1)
    rep = ['# 걷기 비교 — 후보 vs 승인', '', '## 후보 측정', '', table(cand), '', '## 승인과 다르게 움직이는 곳', '']
    for name, notes in check(ref, cand):
        rep.append(f'- **{name}:** ' + ('승인과 같은 범위' if not notes else '; '.join(notes)))
    open(os.path.join(out, 'report.md'), 'w').write('\n'.join(rep) + '\n')
    print('\n'.join(rep))


if __name__ == '__main__':
    main()
