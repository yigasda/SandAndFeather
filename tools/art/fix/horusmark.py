# put Horus's eye mark (only on his left cheek: his left-facing pictures) onto a picture made by mirroring a right-facing
# one. The mark is copied from his final idle left picture: the pixels under the eye that differ from the skin there,
# placed by the eye: its left end (dark outline) and its bottom (last row of white/iris; the eye shapes differ in height,
# so the bottom, where the mark hangs, is the anchor), scaled by the eye widths.
#   python3 horusmark.py <in png (already facing left)> <out png> x0,y0,x1,y1 eyeBottomRow [scale]
#   box: where to look for the eye's dark outline in <in> (keep the brow out). Idle: eye left 194, bottom 365.
import sys, numpy as np
from PIL import Image
ROOT = __file__.rsplit('/tools/', 1)[0]
IDLE = ROOT + '/docs/art/horus-redraw-2026-10-14/png/horus-left-idle-0.png'
IDLE_EYE_BOX = (180, 318, 270, 372); MARK_BOX = (215, 352, 270, 408); IDLE_BOTTOM = 365
def hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1); d = mx - mn; s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / np.maximum(d, 1e-6)) % 6, np.where(mx == g, (b - r) / np.maximum(d, 1e-6) + 2, (r - g) / np.maximum(d, 1e-6) + 4)) / 6
    return np.where(d > 0, h, 0), s, mx
def eye(a, box):
    x0, y0, x1, y1 = box; _, _, v = hsv(a[..., :3] / 255)
    dk = (a[..., 3] > 200) & (v < 0.2); m = np.zeros_like(dk); m[y0:y1, x0:x1] = dk[y0:y1, x0:x1]
    ys, xs = np.nonzero(m); return xs.min(), ys.min(), xs.max(), ys.max()
src, out, box = sys.argv[1], sys.argv[2], tuple(int(v) for v in sys.argv[3].split(','))
I = np.asarray(Image.open(IDLE).convert('RGBA')).astype(float)
B = np.asarray(Image.open(src).convert('RGBA')).astype(float)
ei, eb = eye(I, IDLE_EYE_BOX), eye(B, box)
bottom = int(sys.argv[4])
k = float(sys.argv[5]) if len(sys.argv) > 5 else (eb[2] - eb[0]) / (ei[2] - ei[0])
# the mark: gold pixels in the box under the idle eye, below the eye outline (the iris is above it)
h, s, v = hsv(I[..., :3] / 255)
gold = (I[..., 3] > 200) & (h > 0.06) & (h < 0.17) & (s > 0.35) & (v > 0.35)
mx0, my0, mx1, my1 = MARK_BOX
mark = np.zeros_like(gold); mark[IDLE_BOTTOM + 1:my1, mx0:mx1] = gold[IDLE_BOTTOM + 1:my1, mx0:mx1]
ys, xs = np.nonzero(mark)
o = B.copy()
for ty in range(int(bottom + (ys.min() - IDLE_BOTTOM) * k) - 1, int(bottom + (ys.max() - IDLE_BOTTOM) * k) + 2):
    for tx in range(int(eb[0] + (xs.min() - ei[0]) * k) - 1, int(eb[0] + (xs.max() - ei[0]) * k) + 2):
        sy = int(round(IDLE_BOTTOM + (ty - bottom) / k)); sx = int(round(ei[0] + (tx - eb[0]) / k))
        if 0 <= sy < I.shape[0] and 0 <= sx < I.shape[1] and mark[sy, sx] and B[ty, tx, 3] > 200:
            o[ty, tx, :3] = I[sy, sx, :3]
Image.fromarray(o.round().astype(np.uint8), 'RGBA').save(out)
print('eye idle', ei, 'eye here', eb, 'scale', round(k, 3), 'mark px', len(ys))
