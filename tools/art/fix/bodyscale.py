# python3 bodyscale.py <in> <out> <body scale> <neck x> <neck y> <rows> <anchor x> <anchor y>
# body bigger, head the same: scale 1 above the neck, smoothly to b over R rows below it, then move the whole picture so
# the anchor (seat-bottom) stays where it was (the head rises by as much as the body grew). Prints the head shift.
import sys, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
b, cx, cy, R, ax, ay = map(float, sys.argv[3:9])
a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H, W = a.shape[:2]
pm = a.copy(); pm[..., :3] *= pm[..., 3:4] / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
def k_of(ys):
    t = np.clip((ys - cy) / R, 0, 1); return 1 + (b - 1) * t * t * (3 - 2 * t)
ys_src = np.linspace(-200, H + 400, 40000); dy_ = ys_src[1] - ys_src[0]
yo = np.cumsum(k_of(ys_src)) * dy_; yo -= np.interp(cy, ys_src, yo) - cy        # warped y of each source y, neck fixed
# whole pixels, so the head is moved, not resampled (the anchor is off by under half a pixel)
shift_y = round(float(np.interp(ay, ys_src, yo) - ay))
shift_x = round(float((cx + (ax - cx) * k_of(np.array([ay]))[0]) - ax))
wy = yy + shift_y                                                                 # final pixel -> warped -> source
sy = np.interp(wy, yo, ys_src); ks = k_of(sy); sx = cx + (xx + shift_x - cx) / ks
x0 = np.floor(sx).astype(int); y0 = np.floor(sy).astype(int); fx = sx - x0; fy = sy - y0
def g(y, x):
    ok = (y >= 0) & (y < H) & (x >= 0) & (x < W); v = np.zeros((H, W, 4), np.float32); v[ok] = pm[y[ok], x[ok]]; return v
o = (g(y0, x0) * ((1 - fx) * (1 - fy))[..., None] + g(y0, x0 + 1) * (fx * (1 - fy))[..., None]
     + g(y0 + 1, x0) * ((1 - fx) * fy)[..., None] + g(y0 + 1, x0 + 1) * (fx * fy)[..., None])
A = o[..., 3]; rgb = np.where(A[..., None] > 0, o[..., :3] * 255 / np.maximum(A[..., None], 1e-3), 0)
A = np.where(A > 128, 255, np.where(A > 40, A, 0))
Image.fromarray(np.dstack([np.clip(rgb, 0, 255), A]).round().astype(np.uint8), 'RGBA').save(out)
print(f'head moves {-shift_x:+d}, {-shift_y:+d} px')
