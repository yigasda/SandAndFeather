# python3 legcut.py <in> <out> <x0> <x1> <from y> <last hem y> <light|pale|dark> [bridge]
# Sitting on a stool seen from behind: the legs hang in front, so they do not show. Only the legs go; the skirt, its
# lining, its hem line, arms and hands stay exactly as they were.
#  - Only columns x0..x1 (where the legs are) change. Each is read from <from y> (a row through the skirt) down past the
#    cloth (light: pale grey cloth, not pink skin; pale: anything but the dark outline, for Horus's kilt whose cream is
#    his skin's; dark: Set's black skirt) and up to 5 px of the dark hem line; below
#    that (never lower than <last hem y>) the column is cleared. From 25 px under <last hem y>, 8 px either side too.
#  - skin (Somang): instead of cutting columns, only the leg pixels go: pink skin and brown shoe (channel spread 48 or
#    more) below <from y> in the columns, and the dark outline joined to them, except outline with cloth right above it
#    (the skirt's own hem line). Nothing is filled in; every skirt pixel stays as it was.
# Always check the result with the removed pixels in red over the original.
import sys
import numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
x0, x1, ys, ylast = map(int, sys.argv[3:7]); kind = sys.argv[7]
skinmode = len(sys.argv) > 8 and sys.argv[8] == 'skin'
a = np.asarray(Image.open(src).convert('RGBA')).copy(); H, W = a.shape[:2]
L = a[..., :3].astype(int).mean(2); A = a[..., 3] > 0
ink = A & (L < 70)
rgbi = a[..., :3].astype(int)
# light: pale cloth, not pink skin (a thigh's pale top highlight would otherwise pass as skirt)
cloth = {'dark': A & (L < 95), 'pale': A & ~ink, 'light': A & ~ink & (rgbi.max(2) - rgbi.min(2) < 52)}[kind]
if skinmode:
    from collections import deque
    sat = rgbi.max(2) - rgbi.min(2)
    span = np.zeros((H, W), bool); span[ys:, x0 - 4:x1 + 5] = True
    legc = span & A & ~ink & (sat >= 48)
    cl = A & ~ink & (sat < 48) & (L > 90)
    hem = np.zeros((H, W), bool)
    for d in range(1, 5): hem[d:] |= cl[:-d]           # cloth within 4 px above
    legs = legc.copy(); q = deque(zip(*np.where(legc)))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < H and 0 <= nx < W and span[ny, nx] and not legs[ny, nx] and A[ny, nx] and (legc[ny, nx] or (ink[ny, nx] and not hem[ny, nx])):
                legs[ny, nx] = True; q.append((ny, nx))
    a[legs, 3] = 0
    a[ylast + 25:, max(0, x0 - 8):x1 + 9, 3] = 0
    print(f'{legs.sum()} leg px removed')
else:
    cut = {}
    for x in range(x0, x1 + 1):
        y = ys
        while y < H and cloth[y, x] and y < ylast: y += 1
        n = 0
        while y < H and ink[y, x] and n < 5 and y < ylast: y += 1; n += 1
        cut[x] = min(y, ylast)
        a[cut[x]:, x, 3] = 0
    # the shoes and the leg outlines just outside the columns, well below the hem
    a[ylast + 25:, max(0, x0 - 8):x1 + 9, 3] = 0
    Image.fromarray(a, 'RGBA').save(out)
