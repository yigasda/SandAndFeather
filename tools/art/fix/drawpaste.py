# python3 drawpaste.py <base png> <user drawing on our canvas (register.py)> <out> x0,y0,x1,y1 [--bg r,g,b] [--bridge y]
# The user's drawing decides the SHAPE and the SHADING inside the box; every colour that lands is one of ours.
#  1. classes from the drawing (JPG-smoothed: each mask is blurred and cut at half, so edges are smooth, no stairs):
#     sheet background (--bg, our sheet green) / line (dark) / light (skin, cloth)
#  2. light: the drawing's own colour (the user's shading), smoothed over light neighbours only; the line is only the
#     drawing's dark core (JPG blur thickens lines)
#  3. edges like ours: inside, the line fades into the light colour over 2 px (40 %, 83 %); outside, one px of line
#     colour at alpha 74 against the background
#  4. --bridge y: from this row down a light pixel the drawing has where ours is not light takes our cloth colour
# --direct: instead, the drawing's own pixels un-mixed from the sheet background (alpha matting); use when the
#   drawing is our own art (same scale, same palette) with the user's lines and shading on it.
# Check the result next to the drawing at 6x before sending.
import sys, numpy as np
from PIL import Image, ImageFilter
base, user, out, box = sys.argv[1:5]
arg = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
bg = tuple(int(v) for v in arg('--bg', '120,160,120').split(','))
bridge = int(arg('--bridge', 10**6))
x0, y0, x1, y1 = map(int, box.split(','))
B = np.asarray(Image.open(base).convert('RGBA')).copy(); H, W = B.shape[:2]
src_all = B.copy()
Uimg = Image.open(user).convert('RGB')
U = np.asarray(Uimg.filter(ImageFilter.MedianFilter(3))).astype(int)
uL = U.mean(2); d_bg = np.abs(U - np.array(bg)).sum(2)
def smooth(m, r=0.8):
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im) >= 128
ink = smooth(uL < 35)                        # the line's dark core only: JPG blur would thicken it
bgm = smooth((d_bg < 50) & (uL >= 35)) & ~ink
light = ~ink & ~bgm
# our palette: light colours of ours around the box
bL = B[..., :3].astype(int).mean(2); ours_light = (B[..., 3] > 0) & (bL >= 120)
ring = np.zeros((H, W), bool); ring[max(0, y0 - 20):y1 + 20, max(0, x0 - 20):x1 + 20] = True
pal = np.unique(B[ring & ours_light][:, :3], axis=0).astype(int)
cp = B[y0:y1, 250:370]; cloth_px = cp[(cp[..., 3] > 0) & (cp[..., :3].mean(2) > 200)][:, :3]
cloth = np.median(cloth_px, axis=0).astype(np.uint8) if len(cloth_px) else np.array([250, 242, 230], np.uint8)
INK = np.array([12, 3, 2], np.uint8)
col = np.zeros((H, W, 3), np.uint8)
# light: the drawing's own colour (its shading), JPG noise smoothed with light neighbours only (5x5), never the line
# or background bleeding in; where ours is the same light thing (cloth below --bridge) ours is kept
U0 = np.asarray(Uimg).astype(float)
L0 = U0.mean(2); lightU = (L0 >= 120) & (np.abs(U0 - np.array(bg)).sum(2) >= 50)
for y in range(y0, y1):
    for x in range(x0, x1):
        if not light[y, x]: continue
        if y >= bridge:
            col[y, x] = B[y, x, :3] if ours_light[y, x] else cloth; continue
        ys, xs = slice(max(0, y - 2), y + 3), slice(max(0, x - 2), x + 3)
        m = lightU[ys, xs]
        col[y, x] = np.round(U0[ys, xs][m].mean(0)) if m.any() else U[y, x]
# distance (px, up to 3) from each pixel to the line
dist = np.full((H, W), 9)
cur = ink.copy()
for k in (1, 2, 3):
    n = cur.copy(); n[1:] |= cur[:-1]; n[:-1] |= cur[1:]; n[:, 1:] |= cur[:, :-1]; n[:, :-1] |= cur[:, 1:]
    dist[(n & ~cur) & (dist == 9)] = k; cur = n
mixw = {1: 0.40, 2: 0.83}
for y in range(y0, y1):
    for x in range(x0, x1):
        if ink[y, x]:
            u = U[y, x]
            B[y, x, :3] = u if (u.max() - u.min()) >= 35 else INK; B[y, x, 3] = 255   # dark gold/brown keeps its colour
        elif bgm[y, x]:
            if dist[y, x] == 1: B[y, x, :3] = INK; B[y, x, 3] = 74
            else: B[y, x, 3] = 0
        else:
            c = col[y, x].astype(float); w = mixw.get(int(dist[y, x]), 1.0)
            B[y, x, :3] = np.round(INK * (1 - w) + c * w).astype(np.uint8); B[y, x, 3] = 255
if '--direct' in sys.argv:
    # the drawing's own pixels, un-mixed from the sheet background: alpha from how far a pixel is from the background
    # colour, colour = (pixel - (1 - alpha) * background) / alpha. Soft edges stay soft, no green fringe, no stairs.
    Bd = src_all.copy()
    bgv = np.array(bg, float); C = U.astype(float)
    a = np.clip(np.abs(C - bgv).sum(2) / 250.0, 0, 1)
    for y in range(y0, y1):
        for x in range(x0, x1):
            al = a[y, x]
            if al < 0.2: Bd[y, x, 3] = 0; continue
            c = np.clip((C[y, x] - (1 - al) * bgv) / al, 0, 255)
            Bd[y, x, :3] = np.round(c).astype(np.uint8); Bd[y, x, 3] = 255 if al >= 0.85 else int(round(al * 255))
    B = Bd
Image.fromarray(B, 'RGBA').save(out)
