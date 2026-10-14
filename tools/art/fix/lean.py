# python3 lean.py <in> <out> <degrees> <pivot x> <pivot y> <rows>
# Leans what is above the pivot (the seat / hips) by <degrees> about it (positive = the top goes to the right on
# screen), easing from 0 at the pivot row to the full angle <rows> above it, so the legs and the seat stay where they
# are. Nothing is redrawn: each output pixel is sampled back from the picture (premultiplied bilinear, alpha ≥ 128
# solid, < 40 clear), as the other fix tools do.
import sys, math, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
deg, px, py, R = map(float, sys.argv[3:7])
a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H, W = a.shape[:2]
pm = a.copy(); pm[..., :3] *= pm[..., 3:4] / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
t = np.clip((py - yy) / R, 0, 1); t = t * t * (3 - 2 * t)
th = -math.radians(deg) * t          # back from the output to the source: turn the other way
c, s = np.cos(th), np.sin(th)
dx, dy = xx - px, yy - py
sx = px + c * dx - s * dy; sy = py + s * dx + c * dy
x0 = np.floor(sx).astype(int); y0 = np.floor(sy).astype(int); fx = sx - x0; fy = sy - y0
def g(y, x):
    ok = (y >= 0) & (y < H) & (x >= 0) & (x < W); v = np.zeros((H, W, 4), np.float32); v[ok] = pm[y[ok], x[ok]]; return v
o = (g(y0, x0) * ((1 - fx) * (1 - fy))[..., None] + g(y0, x0 + 1) * (fx * (1 - fy))[..., None]
     + g(y0 + 1, x0) * ((1 - fx) * fy)[..., None] + g(y0 + 1, x0 + 1) * (fx * fy)[..., None])
A = o[..., 3]; rgb = np.where(A[..., None] > 0, o[..., :3] * 255 / np.maximum(A[..., None], 1e-3), 0)
A = np.where(A > 128, 255, np.where(A > 40, A, 0))
Image.fromarray(np.dstack([np.clip(rgb, 0, 255), A]).round().astype(np.uint8), 'RGBA').save(out)
print(f'leaned {deg:+.1f}° about ({px:.0f},{py:.0f}) over {R:.0f} rows')
