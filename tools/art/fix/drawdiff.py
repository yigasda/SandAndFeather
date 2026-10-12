# python3 drawdiff.py <base png the user drew on> <user drawing on our canvas (register.py)> <out> <box>[ <box>…] [--bg r,g,b]
# Only what the user CHANGED comes from the drawing; everything else stays the base's own pixels, untouched.
# Changed = the drawing differs from the base flattened on the sheet background (sum |RGB| > 60 after a 1.5 px blur),
# grown by 2 px, inside the boxes (x0,y0,x1,y1). There the drawing's pixel is un-mixed from the sheet background
# (alpha matting: alpha from the distance to the background colour), so soft edges stay soft and no green is left.
import sys, numpy as np
from PIL import Image, ImageFilter
base, user, out = sys.argv[1:4]
bg = (120, 160, 120)
args = [a for a in sys.argv[4:] if a != '--keep-gold']
if '--bg' in args: i = args.index('--bg'); bg = tuple(int(v) for v in args[i + 1].split(',')); del args[i:i + 2]
boxes = [tuple(map(int, b.split(','))) for b in args]
B = Image.open(base).convert('RGBA'); fb = Image.new('RGBA', B.size, bg + (255,)); fb.alpha_composite(B)
Bn = np.asarray(B).copy(); H, W = Bn.shape[:2]
F = np.asarray(fb.convert('RGB')).astype(int)
Uimg = Image.open(user).convert('RGB'); R = np.asarray(Uimg).astype(int)
U = np.asarray(Uimg.filter(ImageFilter.MedianFilter(3))).astype(float)
d = np.clip(np.abs(F - R).sum(2), 0, 255).astype(np.uint8)
ch = np.asarray(Image.fromarray(d).filter(ImageFilter.GaussianBlur(1.5))) > 60
def grow(m, k):
    for _ in range(k):
        n = m.copy(); n[1:] |= m[:-1]; n[:-1] |= m[1:]; n[:, 1:] |= m[:, :-1]; n[:, :-1] |= m[:, 1:]; m = n
    return m
ch = grow(ch, 2)
ch = ~grow(~grow(ch, 4), 4)           # close: holes and nicks inside a changed area belong to it
# the user's real changes are areas, not specks: changed bits under 10 px are registration/JPG noise, keep ours
from collections import deque
seen = np.zeros((H, W), bool)
for y, x in zip(*np.where(ch)):
    if seen[y, x]: continue
    comp = [(y, x)]; seen[y, x] = True; k = 0
    while k < len(comp):
        cy, cx = comp[k]; k += 1
        for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
            if 0 <= ny < H and 0 <= nx < W and ch[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; comp.append((ny, nx))
    if len(comp) < 10:
        for cy, cx in comp: ch[cy, cx] = False
inb = np.zeros((H, W), bool)
for x0, y0, x1, y1 in boxes: inb[y0:y1, x0:x1] = True
ch &= inb
# what the user did not touch stays ours even if the registration is a px or two off there: --keep-gold keeps every
# pixel of the base's gold (and the 2 px around it)
if '--keep-gold' in sys.argv:
    c = Bn[..., :3].astype(int)
    gold = (Bn[..., 3] > 0) & (c[..., 0] - c[..., 2] > 60) & (c[..., 1] - c[..., 2] > 25)
    # the band itself, not a brown speck that happens to match: only big gold areas (over 200 px) count
    seen = np.zeros((H, W), bool); keep = np.zeros((H, W), bool)
    for y, x in zip(*np.where(gold)):
        if seen[y, x]: continue
        comp = [(y, x)]; seen[y, x] = True; k = 0
        while k < len(comp):
            cy, cx = comp[k]; k += 1
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < H and 0 <= nx < W and gold[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; comp.append((ny, nx))
        if len(comp) > 200:
            for cy, cx in comp: keep[cy, cx] = True
    gold = keep
    for _ in range(2):
        n = gold.copy(); n[1:] |= gold[:-1]; n[:-1] |= gold[1:]; n[:, 1:] |= gold[:, :-1]; n[:, :-1] |= gold[:, 1:]; gold = n
    ch &= ~gold
bgv = np.array(bg, float)
a = np.clip(np.abs(U - bgv).sum(2) / 250.0, 0, 1)
# partial alpha only on a real edge (next to the drawing's background); inside, a dark pixel is a solid dark pixel
bgcls = np.abs(U - bgv).sum(2) < 50
near_bg = grow(bgcls, 2)
a = np.where(near_bg, a, np.maximum(a, 1.0))
for y, x in zip(*np.where(ch)):
    al = a[y, x]
    if al < 0.2: Bn[y, x, 3] = 0; continue
    c = np.clip((U[y, x] - (1 - al) * bgv) / al, 0, 255)
    Bn[y, x, :3] = np.round(c).astype(np.uint8); Bn[y, x, 3] = 255 if al >= 0.85 else int(round(al * 255))
Image.fromarray(Bn, 'RGBA').save(out)
print(f'{ch.sum()} px from the drawing, the rest the base as is')
