# python3 drawpaste.py <base png> <user drawing on our canvas (register.py)> <out> x0,y0,x1,y1 [--bg r,g,b] [--bridge y]
# The user's drawing decides the SHAPE and the SHADING inside the box; every colour that lands is one of ours.
#  1. classes from the drawing (JPG-smoothed: each mask is blurred and cut at half, so edges are smooth, no stairs):
#     sheet background (--bg, our sheet green) / line (dark) / light (skin, cloth)
#  2. light: the drawing's colour (3x3 median) is matched to the nearest colour of OUR light pixels around the box
#     (arm skin, its shadows, cloth), so the drawn shading (e.g. a pink shadow) comes out in our palette
#  3. edges like ours: inside, the line fades into the light colour over 2 px (40 %, 83 %); outside, one px of line
#     colour at alpha 74 against the background
#  4. --bridge y: from this row down a light pixel the drawing has where ours is not light takes our cloth colour
# Check the result next to the drawing at 6x before sending.
import sys, numpy as np
from PIL import Image, ImageFilter
base, user, out, box = sys.argv[1:5]
arg = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
bg = tuple(int(v) for v in arg('--bg', '120,160,120').split(','))
bridge = int(arg('--bridge', 10**6))
x0, y0, x1, y1 = map(int, box.split(','))
B = np.asarray(Image.open(base).convert('RGBA')).copy(); H, W = B.shape[:2]
Uimg = Image.open(user).convert('RGB')
U = np.asarray(Uimg.filter(ImageFilter.MedianFilter(3))).astype(int)
uL = U.mean(2); d_bg = np.abs(U - np.array(bg)).sum(2)
def smooth(m, r=0.8):
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im) >= 128
ink = smooth(uL < 75)
bgm = smooth((d_bg < 50) & (uL >= 75)) & ~ink
light = ~ink & ~bgm
# our palette: light colours of ours around the box
bL = B[..., :3].astype(int).mean(2); ours_light = (B[..., 3] > 0) & (bL >= 120)
ring = np.zeros((H, W), bool); ring[max(0, y0 - 20):y1 + 20, max(0, x0 - 20):x1 + 20] = True
pal = np.unique(B[ring & ours_light][:, :3], axis=0).astype(int)
cp = B[y0:y1, 250:370]; cloth_px = cp[(cp[..., 3] > 0) & (cp[..., :3].mean(2) > 200)][:, :3]
cloth = np.median(cloth_px, axis=0).astype(np.uint8) if len(cloth_px) else np.array([250, 242, 230], np.uint8)
INK = np.array([12, 3, 2], np.uint8)
col = np.zeros((H, W, 3), np.uint8)
for y in range(y0, y1):
    for x in range(x0, x1):
        if not light[y, x]: continue
        if y >= bridge and not ours_light[y, x]: col[y, x] = cloth; continue
        d = ((pal - U[y, x]) ** 2).sum(1); col[y, x] = pal[d.argmin()]
# distance (px, up to 3) from each pixel to the line
dist = np.full((H, W), 9)
cur = ink.copy()
for k in (1, 2, 3):
    n = cur.copy(); n[1:] |= cur[:-1]; n[:-1] |= cur[1:]; n[:, 1:] |= cur[:, :-1]; n[:, :-1] |= cur[:, 1:]
    dist[(n & ~cur) & (dist == 9)] = k; cur = n
mixw = {1: 0.40, 2: 0.83}
for y in range(y0, y1):
    for x in range(x0, x1):
        if ink[y, x]: B[y, x, :3] = INK; B[y, x, 3] = 255
        elif bgm[y, x]:
            if dist[y, x] == 1: B[y, x, :3] = INK; B[y, x, 3] = 74
            else: B[y, x, 3] = 0
        else:
            c = col[y, x].astype(float); w = mixw.get(int(dist[y, x]), 1.0)
            B[y, x, :3] = np.round(INK * (1 - w) + c * w).astype(np.uint8); B[y, x, 3] = 255
Image.fromarray(B, 'RGBA').save(out)
