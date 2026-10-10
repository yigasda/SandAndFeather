# Party and Somang-card pictures from the user's character illustrations (docs/art/portraits-illust).
# The plain light-grey ground is made transparent by flooding in from the picture's edge through pixels close to
# that ground colour (the line art stops it), so the art sits on any theme's card. Nothing else is touched.
#   data/art/portraits/<who>-illust.png       the whole illustration, cut out
#   data/art/portraits/<who>-illust-head.png  head and shoulders, 500×412, one face scale for the three
import os
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
HEAD = {'somang': (40, 40, 660, 551), 'set': (170, 0, 670, 412), 'horus': (110, 0, 610, 412)}
TOL = 20


def cut(path):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(int)
    h, w = a.shape[:2]
    ground = np.median(a[:4].reshape(-1, 3), axis=0)  # the top rows are plain ground in all three
    near = np.abs(a - ground).max(-1) <= TOL
    bg = np.zeros((h, w), bool)
    q = deque((y, x) for y in range(h) for x in (0, w - 1) if near[y, x])
    q.extend((0, x) for x in range(w) if near[0, x])
    while q:
        y, x = q.popleft()
        if bg[y, x]: continue
        bg[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not bg[ny, nx]:
                q.append((ny, nx))
    # plain ground enclosed by hair (gaps between strands): also clear, if it is a real patch in the upper half
    lab = np.zeros((h, w), int); n = 0
    tight = (np.abs(a - ground).max(-1) <= 10) & ~bg
    for sy, sx in zip(*np.where(tight[: h // 2])):
        if lab[sy, sx]: continue
        n += 1; comp = []; q = deque([(sy, sx)]); lab[sy, sx] = n
        while q:
            y, x = q.popleft(); comp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and tight[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = n; q.append((ny, nx))
        if len(comp) >= 300:
            ys, xs = zip(*comp); bg[list(ys), list(xs)] = True
    alpha = Image.fromarray((~bg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA'); out.putalpha(alpha)
    return out


def main():
    for who, box in HEAD.items():
        full = cut(os.path.join(ROOT, 'docs', 'art', 'portraits-illust', f'{who}.png'))
        full.save(os.path.join(ROOT, 'data', 'art', 'portraits', f'{who}-illust.png'), optimize=True)
        full.crop(box).resize((500, 412), Image.LANCZOS).save(os.path.join(ROOT, 'data', 'art', 'portraits', f'{who}-illust-head.png'), optimize=True)
        print('cut', who)


if __name__ == '__main__':
    main()
