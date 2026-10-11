# Lay one sprite over another, both on the same 620×720 canvas and anchor, to see what really differs.
#
#   python3 tools/art/onion.py A.png B.png --out <file.png>            A red, B blue, overlap dark; + changed pixels
#   python3 tools/art/onion.py left.png right.png --flip-b --out …     mirror check: B flipped, so arms, hands and
#                                                                       legs of left and right views can be compared
#   python3 tools/art/onion.py idle.png pose.png --anchor-b 310,450 --anchor-a 310,662 --out …
#                                                                       a pose with a different anchor laid on its
#                                                                       reference (anchors put on the same point)
#
# Three panels: A and B outlines on top of each other (red A, blue B) · B with the pixels that differ from A in red ·
# the silhouette difference only (red = only A, blue = only B). Printed: silhouette change (share of the figure whose
# outline differs), bounding box of each, and how many pixels differ inside the shared figure.
# Uses: frame 0 against frame 1 (a breathing or moving frame must change the OUTLINE, not only the inside);
# left against flipped right; a new pose against the approved reference of the same pose (Somang 180 for sleeping);
# a drawing against the final idle (head shape, arm length).
import argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 18)
except OSError:
    FONT = ImageFont.load_default()


def load(p, flip, anchor, to):
    im = Image.open(p).convert('RGBA')
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT); anchor = (im.width - anchor[0], anchor[1])
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(im, (to[0] - anchor[0], to[1] - anchor[1]), im)
    return out


def edge(m):
    return m & ~(np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('a'); ap.add_argument('b'); ap.add_argument('--out', required=True)
    ap.add_argument('--flip-b', action='store_true')
    ap.add_argument('--anchor-a', default='310,662'); ap.add_argument('--anchor-b')
    o = ap.parse_args()
    aa = tuple(int(v) for v in o.anchor_a.split(',')); ab = tuple(int(v) for v in (o.anchor_b or o.anchor_a).split(','))
    A = load(o.a, False, aa, aa); B = load(o.b, o.flip_b, ab, aa)
    a, b = np.asarray(A), np.asarray(B)
    ma, mb = a[..., 3] > 128, b[..., 3] > 128
    both = ma & mb
    inside = both & (np.abs(a.astype(int) - b.astype(int))[..., :3].max(-1) > 40)
    sil = (ma ^ mb).sum() / max(1, (ma | mb).sum())
    W, H = A.size
    p1 = np.full((H, W, 3), 245, np.uint8); p1[ma | mb] = (222, 214, 200)
    for m, c in ((edge(ma), (220, 30, 30)), (edge(mb), (30, 80, 220))):
        for d in (0, 1): p1[np.roll(m, d, 1)] = c
    p2 = np.full((H, W, 3), 245, np.uint8); p2[mb] = b[mb][:, :3]; p2[inside | (mb & ~ma)] = (230, 0, 0)
    p3 = np.full((H, W, 3), 245, np.uint8); p3[both] = (200, 200, 200); p3[ma & ~mb] = (220, 30, 30); p3[mb & ~ma] = (30, 80, 220)
    s = Image.new('RGB', (W * 3, H + 50), (245, 239, 227)); d = ImageDraw.Draw(s)
    for i, p in enumerate((p1, p2, p3)): s.paste(Image.fromarray(p), (i * W, 50))
    ba, bb = A.getbbox(), B.getbbox()
    txt = f"윤곽 차이 {sil:.1%} · 안쪽 바뀐 픽셀 {inside.sum()} · A {ba} B {bb}"
    d.text((8, 4), f"A(빨강) {o.a.split('/')[-1]}  B(파랑) {o.b.split('/')[-1]}{' (좌우 뒤집음)' if o.flip_b else ''}", fill=(40, 30, 20), font=FONT)
    d.text((8, 26), txt + "  |  겹친 윤곽 · B에서 바뀐 곳(빨강) · 윤곽만 다른 곳", fill=(40, 30, 20), font=FONT)
    s.save(o.out)
    print(txt)
    if sil < 0.03 or ba == bb: print('윤곽이 거의 같다: 프레임이라면 게임에서 한 장처럼 보인다(안쪽만 바뀜). 외곽선이 움직여야 한다')


if __name__ == '__main__':
    main()
