# shorten the lower legs (knee to foot) of a sitting picture, thighs and clothes untouched:
#   python3 legshorten.py <in> <out> y0 y1 D xcalf xfoot yfoot   (somang bench: 500 580 D 436 400 558)
# The legs are lifted off as a layer: pixels right of xcalf from row y0 down, and right of xfoot from row yfoot down (the
# sandals reach further left than the calves). In that layer the calf rows y0..y1 (plain skin between the knee and
# the ankle strap) are squeezed D rows shorter, smoothly; everything under y1 (strap, sandal) moves up D rows unchanged.
# The layer goes back over the rest of the picture (the skirt hem stays where it was, the feet hang in front of it).
import sys, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
y0, y1, D, xc, xf, yf = map(float, sys.argv[3:9])
a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H, W = a.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
leg = ((xx >= xc) & (yy >= y0)) | ((xx >= xf) & (yy >= yf))
# between xf and xc the thigh's underside and the skirt hem hang over the calf: there the leg starts at the first
# see-through row under them (the calf's own outline below it moves with the calf; the thigh stays)
# (where the calf's outline is joined to the thigh's, there is no gap: there the leg starts under the thigh's bottom
# row, the first see-through row of the columns that have one)
starts = {}
for x in range(int(xf), int(xc)):
    gap = np.nonzero(a[int(y0):int(yf) + 1, x, 3] < 20)[0]
    if len(gap): starts[x] = int(y0) + gap[0]
thigh = int(np.median(list(starts.values()))) if starts else int(yf)
for x in range(int(xf), int(xc)):
    st = min(starts.get(x, thigh), thigh + 2)   # never below the thigh: a later gap would leave calf edge behind
    leg[:st, x] = False; leg[st:, x] = True
L = np.where(leg[..., None], a, 0); base = np.where(leg[..., None], 0, a)
# output row -> source row: identity above y0, the band y0..y1 drawn in y0..y1-D (smoothstep speed-up), then +D
ys = np.linspace(0, H + D + 10, 20000)
def sm(t): t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)
# output rows per source row: 1 outside the band, 1 - c inside it, with 10-row soft ends; c is set so D rows go
R = 10.0
w = sm((ys - y0) / R) * sm((y1 - ys) / R)
c = D / float(np.sum(w) * (ys[1] - ys[0]))
dens = 1 - c * w
dy = ys[1] - ys[0]; yo = np.concatenate([[0], np.cumsum(dens[:-1]) * dy])
sy = np.interp(yy, yo, ys)
pm = L.copy(); pm[..., :3] *= pm[..., 3:4] / 255
y0i = np.floor(sy).astype(int); fy = sy - y0i; xi = xx.astype(int)
def g(y):
    ok = (y >= 0) & (y < H); v = np.zeros((H, W, 4), np.float32); v[ok] = pm[y[ok], xi[ok]]; return v
o = g(y0i) * (1 - fy)[..., None] + g(y0i + 1) * fy[..., None]
A = o[..., 3]; rgb = np.where(A[..., None] > 0, o[..., :3] * 255 / np.maximum(A[..., None], 1e-3), 0)
A = np.where(A > 128, 255, np.where(A > 40, A, 0))
top = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), A]).round().astype(np.uint8), 'RGBA')
res = Image.fromarray(base.astype(np.uint8), 'RGBA'); res.alpha_composite(top)
res.save(out)
print('removed rows', round(float(yo[-1] - ys[-1]) * -1, 1))
