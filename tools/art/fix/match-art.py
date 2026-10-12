# find a piece of one map picture in another (the same furniture redrawn in another room, maybe smaller), to carry
# places over: e.g. Horus's bed is Set's bed at 91 %, so Set's bed places map straight onto it.
#   python3 match-art.py <picture A> x0,y0,x1,y1 <picture B> sx0,sy0,sx1,sy1 [--tiles 22] [--scales 0.85,1.10]
# Boxes are in TILES (the room pictures are 22 tiles wide, 1774 px: 80.6 px a tile). The first box is the piece in A
# (pick something both drawings share: headboard and pillows, not the blanket colour); the second is where to look
# in B. Prints the correlation (0.9+ is the same drawing), the scale and the formula A tile -> B tile.
# For people lying on it, keep their head the same distance above the anchor (sprites are not scaled):
#   bx = (ax - x0) * s + bx0 ;  by = (ay - d - y0) * s + by0 + d   (d = head height above the anchor, ~0.75 tile)
import argparse, numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('a'); ap.add_argument('abox'); ap.add_argument('b'); ap.add_argument('bbox')
ap.add_argument('--tiles', type=float, default=22); ap.add_argument('--scales', default='0.85,1.10')
o = ap.parse_args()
A = Image.open(o.a).convert('L'); B = np.asarray(Image.open(o.b).convert('L')).astype(float); T = A.width / o.tiles
x0, y0, x1, y1 = (float(v) for v in o.abox.split(',')); sx0, sy0, sx1, sy1 = (float(v) for v in o.bbox.split(','))
t = A.crop((int(x0 * T), int(y0 * T), int(x1 * T), int(y1 * T)))
lo, hi = (float(v) for v in o.scales.split(','))
best = None
for s in np.arange(lo, hi + 1e-9, 0.01):
    tt = np.asarray(t.resize((int(t.width * s), int(t.height * s)))).astype(float); tt = (tt - tt.mean()) / tt.std(); h, w = tt.shape
    for y in range(int(sy0 * T), int(sy1 * T) - h, 2):
        for x in range(int(sx0 * T), int(sx1 * T) - w, 2):
            c = B[y:y + h, x:x + w]; v = (((c - c.mean()) / (c.std() + 1e-6)) * tt).mean()
            if best is None or v > best[0]: best = (v, s, x / T, y / T)
v, s, bx, by = best
print(f'correlation {v:.3f}  scale {s:.2f}  A ({x0},{y0}) -> B ({bx:.3f},{by:.3f})')
print(f'bx = (ax - {x0}) * {s:.2f} + {bx:.3f} ;  by = (ay - {y0}) * {s:.2f} + {by:.3f}')
