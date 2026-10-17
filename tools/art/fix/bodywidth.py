# python3 bodywidth.py <in> <out> <width scale> <center x> <neck y> <rows>
# the body below the neck narrower (or wider) across only, about the center x; the head and everything above the neck
# stay; the change grows in over <rows> below the neck. Rows keep their height. Nothing is redrawn: each output pixel is
# sampled back from the picture (premultiplied bilinear, alpha ≥ 128 solid, < 40 clear), like the other fix tools.
import sys, numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
w, cx, ny, R = map(float, sys.argv[3:7])
a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H, W = a.shape[:2]
pm = a.copy(); pm[..., :3] *= pm[..., 3:4] / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
t = np.clip((yy - ny) / R, 0, 1); t = t * t * (3 - 2 * t); k = 1 + (w - 1) * t
sx = cx + (xx - cx) / k; sy = yy
x0 = np.floor(sx).astype(int); fx = sx - x0; y0 = sy.astype(int)
def g(y, x):
    ok = (y >= 0) & (y < H) & (x >= 0) & (x < W); v = np.zeros((H, W, 4), np.float32); v[ok] = pm[y[ok], x[ok]]; return v
o = g(y0, x0) * (1 - fx)[..., None] + g(y0, x0 + 1) * fx[..., None]
A = o[..., 3]; rgb = np.where(A[..., None] > 0, o[..., :3] * 255 / np.maximum(A[..., None], 1e-3), 0)
A = np.where(A > 128, 255, np.where(A > 40, A, 0))
Image.fromarray(np.dstack([np.clip(rgb, 0, 255), A]).round().astype(np.uint8), 'RGBA').save(out)
