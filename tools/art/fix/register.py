# Lay a picture the user edited (a phone screenshot or JPG of one of our sheets, any zoom) back onto our sprite canvas.
#   python3 register.py <user picture> <our png it was drawn on> <out png> [--bg r,g,b] [--rows 0,0.45] [--scales 1.2,2.4]
# Finds the zoom and the offset by comparing the part of the picture the user did not touch (--rows: a band of the
# user picture, as fractions of its height; the hair and the forehead are a safe default for face edits) with our png
# flattened on the sheet background (--bg). Writes the user picture resampled into our canvas (same size as our png,
# background where the screenshot does not reach) and prints the zoom, the offset and the mean error (under ~6 is a
# good fit; check unedited features line up, e.g. with contour.rays on both). The result is for READING shapes only
# (where a line is, how dark): its colours carry JPG noise and the sheet background, so never paste it as is.
import argparse, numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('user'); ap.add_argument('ours'); ap.add_argument('out')
ap.add_argument('--bg', default='245,239,227'); ap.add_argument('--rows', default='0,0.45'); ap.add_argument('--scales', default='1.0,2.6')
o = ap.parse_args()
bg = tuple(int(v) for v in o.bg.split(','))
ours = Image.open(o.ours).convert('RGBA'); flat = Image.new('RGBA', ours.size, bg + (255,)); flat.alpha_composite(ours)
R = np.asarray(flat.convert('L')).astype(float); H, W = R.shape
U0 = Image.open(o.user).convert('RGB')
r0, r1 = (float(v) for v in o.rows.split(','))
s0, s1 = (float(v) for v in o.scales.split(','))
UL = U0.convert('L'); cache = {}
def small(f):
    if f not in cache: cache[f] = np.asarray(UL.resize((round(U0.width / f), round(U0.height / f)), Image.BILINEAR)).astype(float)
    return cache[f]
def score(f, ox, oy, step=1):
    u = small(f); h, w = u.shape
    a, b = int(h * r0), int(h * r1)
    ys, xs = slice(a, b, step), slice(0, w, step)
    y0, x0 = oy + a, ox
    if y0 < 0 or x0 < 0 or oy + b > H or ox + w > W: return 1e9
    return np.abs(u[ys, xs] - R[y0:oy + b:step, x0:ox + w:step]).mean()
best = (1e9,)
for f in np.arange(s0, s1, 0.02):
    w, h = round(U0.width / f), round(U0.height / f)
    for oy in range(-int(h * r0), H - int(h * r1), 4):
        for ox in range(0, W - w + 1, 4):
            e = score(f, ox, oy, 3)
            if e < best[0]: best = (e, f, ox, oy)
e, f, ox, oy = best
for f2 in np.arange(f - 0.02, f + 0.021, 0.005):
    for oy2 in range(oy - 4, oy + 5):
        for ox2 in range(ox - 4, ox + 5):
            e2 = score(f2, ox2, oy2)
            if e2 < best[0]: best = (e2, f2, ox2, oy2)
e, f, ox, oy = best
can = Image.new('RGB', ours.size, bg); can.paste(U0.resize((round(U0.width / f), round(U0.height / f)), Image.LANCZOS), (ox, oy))
can.save(o.out)
print(f'zoom {f:.3f}  user (0,0) -> ours ({ox},{oy})  mean error {e:.2f}')
