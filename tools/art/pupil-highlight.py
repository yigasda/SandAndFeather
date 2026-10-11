# Horus has no white highlight over his pupils (his final idle shows only the lower glow). This finds small white
# spots sitting inside his gold irises and, with --fix, paints each spot pixel with the iris colour around it.
#
#   python3 tools/art/pupil-highlight.py <png>... [--fix] [--out <folder>]
#
# A spot is a group of near-white pixels (bright, unsaturated) of at most MAX_SPOT pixels whose ring (the pixels
# around it) is mostly iris: gold or the dark pupil. The white of the eye is big and lies against the black
# eyelid line and the skin, so it is never taken. Only the upper part of the figure is searched (the head), and only
# spots in the upper half of their iris: the lower glow (his own, in the idle) stays. Back views and closed eyes have
# no iris to search: pass only pictures with open eyes.
# --out writes <name>-pupil.png: before | after, the eyes enlarged, found pixels in magenta.
import argparse, os
import numpy as np
from PIL import Image, ImageDraw

MAX_SPOT = 40


def hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / np.maximum(d, 1e-6)) % 6, np.where(mx == g, (b - r) / np.maximum(d, 1e-6) + 2, (r - g) / np.maximum(d, 1e-6) + 4)) / 6
    return np.where(d > 0, h, 0), s, mx


def components(mask):
    from collections import deque
    seen = np.zeros_like(mask); out = []
    H, W = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]: continue
        q = deque([(y, x)]); seen[y, x] = True; pts = []
        while q:
            cy, cx = q.popleft(); pts.append((cy, cx))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        out.append(pts)
    return out


def find(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    h, s, v = hsv(a[..., :3] / 255)
    solid = a[..., 3] > 200
    ys = np.nonzero(solid.any(1))[0]
    head = np.zeros_like(solid); head[ys.min():ys.min() + int(0.6 * (ys.max() - ys.min()))] = True
    white = solid & head & (v > 0.86) & (s < 0.28)
    gold = solid & (h > 0.06) & (h < 0.15) & (s > 0.55) & (v > 0.6)
    iris = solid & (((h > 0.05) & (h < 0.16) & (s > 0.45) & (v > 0.35)) | ((v < 0.45) & (h > 0.02) & (h < 0.12) & (s > 0.4)))
    spots = []
    for pts in components(white):
        if len(pts) > MAX_SPOT: continue
        m = np.zeros_like(white)
        for y, x in pts: m[y, x] = True
        ring = np.zeros_like(m)
        for dy in (-2, -1, 0, 1, 2):
            for dx in (-2, -1, 0, 1, 2): ring |= np.roll(np.roll(m, dy, 0), dx, 1)
        ring &= ~m
        if not ring.sum() or (iris & ring).sum() / ring.sum() < 0.7: continue
        # keep the lower glow: only a spot in the upper half of its iris is a highlight to remove
        cy = np.mean([y for y, _ in pts]); cx = np.mean([x for _, x in pts])
        y0, x0 = int(max(0, cy - 30)), int(max(0, cx - 22))
        iy = np.nonzero(gold[y0:int(cy) + 30, x0:int(cx) + 22].any(1))[0] + y0
        if len(iy) and cy < (iy.min() + iy.max()) / 2:
            spots.append((pts, ring & iris))
    return a, spots


def fix(a, spots):
    b = a.copy()
    for pts, ring in spots:
        ry, rx = np.nonzero(ring)
        for y, x in pts:
            d = (ry - y) ** 2 + (rx - x) ** 2
            near = np.argsort(d)[:6]
            b[y, x, :3] = np.median(a[ry[near], rx[near], :3], 0)
    return b


def sheet(a, b, spots, out):
    pts = [p for s in spots for p in s[0]]
    if not pts: return
    ys, xs = zip(*pts)
    x0, y0, x1, y1 = max(0, min(xs) - 40), max(0, min(ys) - 30), min(a.shape[1], max(xs) + 40), min(a.shape[0], max(ys) + 30)
    def crop(arr, mark):
        c = arr[y0:y1, x0:x1].copy()
        if mark:
            for y, x in pts: c[y - y0, x - x0] = (255, 0, 255, 255)
        bg = Image.new('RGBA', (x1 - x0, y1 - y0), (245, 239, 227, 255)); bg.alpha_composite(Image.fromarray(c.astype(np.uint8), 'RGBA'))
        return bg.convert('RGB').resize(((x1 - x0) * 4, (y1 - y0) * 4), Image.NEAREST)
    t = [crop(a, False), crop(a, True), crop(b, False)]
    S = Image.new('RGB', (sum(i.width for i in t) + 20, t[0].height + 24), (245, 239, 227)); d = ImageDraw.Draw(S)
    x = 0
    for lab, i in zip(('전', '찾은 점(분홍)', '후'), t):
        S.paste(i, (x, 24)); d.text((x + 4, 4), lab, fill=(40, 30, 20)); x += i.width + 10
    S.save(out)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('png', nargs='+'); ap.add_argument('--fix', action='store_true'); ap.add_argument('--out')
    o = ap.parse_args()
    if o.out: os.makedirs(o.out, exist_ok=True)
    for p in o.png:
        a, spots = find(Image.open(p))
        n = sum(len(s[0]) for s in spots)
        print(f'{p}: 점 {len(spots)}개, {n}px')
        if not spots: continue
        b = fix(a, spots)
        if o.out: sheet(a, b, spots, os.path.join(o.out, os.path.basename(os.path.dirname(os.path.dirname(os.path.abspath(p)))) + '-' + os.path.splitext(os.path.basename(p))[0] + '-pupil.png'))
        if o.fix: Image.fromarray(b.astype(np.uint8), 'RGBA').save(p)


if __name__ == '__main__':
    main()
