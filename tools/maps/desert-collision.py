"""Collision pictures for the desert maps the user has not drawn one for (03 고요한 사구, 04 메마른 모래벌판), made the
way the user drew 01 and 02 (사막맵/충돌/): the size of the art, one flat colour (32, 28, 55) where the feet may go,
clear elsewhere, a one-pixel soft edge. Same rules as the user's 02:
  - rocks, bushes, branches, marker stones: cut out along their own outline, small stones too; their cast shadows
    on the sand stay floor;
  - a dune is never climbed: blocked from its foot to the border; a dune in front is blocked from its top outline
    down, sunlit face and all (03: the user's own paint);
  - a cliff: blocked from its sand-side edge to the border.
Objects come from the colour against the sand around them; rock tops the colour of sand and the dunes are traced\nby hand (MAPS).
Writes 사막맵/충돌/<art name>.png and a review picture to docs/consult/desert/maps/<nn>-collision-made.png.
  python3 tools/maps/desert-collision.py"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / '사막맵'
REVIEW = ROOT / 'docs/consult/desert/maps'
COLOUR = (32, 28, 55)

# per map: art file; rock tops traced by hand (source px); dune bodies traced by hand (polygons); cliff
# (x from which each row with rock is rock to the right border, rows 0..y)
MAPS = {
    '03': {'art': '03_고요한사구_06통합.png',
           'tops': [[(115, 535), (125, 527), (145, 520), (160, 515), (175, 507), (185, 505), (205, 505), (220, 511),
                     (240, 517), (250, 523), (252, 535), (252, 545), (115, 545)]],
           # both dune groups painted by the user over our tries, read from their screenshots (file, top left in the
           # picture, keep the rocks inside its box): the top left ("이렇게 수정 하셈") and the bottom right, the
           # whole dune with its sunlit face ("이렇게 수정(사구를 올라갈 수 있으면 안되겠지?)")
           'paint': [('desert-collision/03-user-dunes.png', (0, 0), False),
                     ('desert-collision/03-user-front-dunes.png', (729, 372), True)],
           'dunes': [],
           'cliff': (1430, 470)},
    '04': {'art': '04_메마른모래벌판.png',
           'tops': [[(150, 410), (170, 400), (200, 394), (230, 389), (260, 386), (300, 385), (340, 386), (370, 389),
                     (400, 393), (420, 398), (430, 405), (430, 420), (150, 420)],
                    [(1420, 218), (1440, 212), (1460, 207), (1480, 205), (1500, 206), (1520, 210), (1535, 216),
                     (1535, 230), (1420, 230)]],
           'dunes': [[(0, 0), (820, 0), (850, 20), (900, 38), (1000, 58), (1100, 80), (1150, 100), (1160, 110), (1145, 118),
                      (1120, 128), (1080, 138), (1000, 143), (900, 152), (850, 156), (800, 165), (750, 200), (700, 258),
                      (650, 300), (600, 314), (500, 316), (400, 320), (300, 314), (250, 306), (200, 302), (160, 318),
                      (110, 338), (60, 352), (0, 362)],
                     [(850, 887), (870, 820), (900, 773), (1000, 736), (1100, 705), (1200, 666), (1275, 646), (1300, 642),
                      (1400, 617), (1500, 595), (1600, 580), (1675, 572), (1725, 580), (1774, 595), (1774, 887)]],
           # small blocked pieces that are only sand (a ripple, a sliver at a crest, a dot): cleared
           'sand': [(11, 519), (826, 772), (65, 827)],
           'cliff': None},
}


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def sand_around(a, excl, s):
    """the sand colour at every pixel, from the sand only (normalised blur that leaves out excl)"""
    w = (~excl).astype(float); ws = nd.gaussian_filter(w, s) + 1e-6
    return np.stack([nd.gaussian_filter(a[..., c] * w, s) / ws for c in range(3)], -1)


def pieces(m, least):
    lab, n = nd.label(m)
    if not n: return m
    return np.isin(lab, 1 + np.nonzero(nd.sum(m, lab, range(1, n + 1)) >= least)[0])


def streaks_out(m):
    """long thin dark wind ripples are sand, not stones: drop small pieces much longer than wide"""
    lab, n = nd.label(m)
    for i, sl in enumerate(nd.find_objects(lab), 1):
        ys, xs = np.nonzero(lab[sl] == i)
        if len(ys) > 2500: continue
        ev = np.linalg.eigvalsh(np.cov(np.stack([xs, ys])) + 1e-6 * np.eye(2))
        if ev[1] / ev[0] > 9: m[sl][lab[sl] == i] = False
    return m


def objects(a):
    """rocks, bushes, branches: far from the sand colour around them and not just a darker sand (a shadow)"""
    L = a.mean(-1)
    sand = np.stack([nd.median_filter(a[..., c][::4, ::4], size=25) for c in range(3)], -1).repeat(4, 0).repeat(4, 1)[:a.shape[0], :a.shape[1]]
    for _ in range(2):
        cd = np.linalg.norm(a - sand, axis=-1)
        ch = a / (a.sum(-1, keepdims=True) + 1); cs = sand / (sand.sum(-1, keepdims=True) + 1)
        shadow = (np.linalg.norm(ch - cs, axis=-1) < 0.025) & (L < sand.mean(-1))
        raw = (cd > 38) & ~shadow
        m = nd.binary_opening(nd.binary_fill_holes(nd.binary_closing(raw, disk(3))), disk(1))
        m = streaks_out(pieces(m, 150))
        sand = sand_around(a, nd.binary_dilation(m | raw, disk(4)), 12)
    return m


def dunes(shape, polys):
    """the dune bodies, traced by hand along the foot of the smooth dune faces where the rippled flat sand starts
    (a dune behind) or along the crest (a dune in front)"""
    im = Image.new('L', (shape[1], shape[0]), 0); d = ImageDraw.Draw(im)
    for poly in polys: d.polygon(poly, fill=255)
    return np.asarray(im) > 0


def smooth(block):
    """smooth the outlines a little (padded with the edge, so the border keeps what is next to it)"""
    P = 8; b = np.pad(block, P, mode='edge')
    return nd.binary_opening(nd.binary_closing(b, disk(2)), disk(2))[P:-P, P:-P]


def make(n, spec):
    art = Image.open(SRC / spec['art']).convert('RGB'); a = np.asarray(art).astype(float); h, w = a.shape[:2]
    block = objects(a)
    tops = Image.new('L', (w, h), 0); d = ImageDraw.Draw(tops)
    for poly in spec['tops']: d.polygon(poly, fill=255)
    block |= np.asarray(tops) > 0
    block = nd.binary_fill_holes(block)
    if spec['cliff']:
        x, y = spec['cliff']
        for r in range(y):
            xs = np.nonzero(block[r, x:])[0]
            if len(xs): block[r, x + xs[0]:] = True
        block[:12, x:] |= block[12, x:]   # the cliff reaches the top border
        # the row fill leaves steps under the overhangs: round the cliff foot
        c = np.pad(block[:y + 40, x:], 12, mode='edge')
        block[:y + 40, x:] = nd.binary_opening(nd.binary_closing(c, disk(6)), disk(3))[12:-12, 12:-12]
    rocks = smooth(block)
    block = smooth(block | dunes(block.shape, spec['dunes']))
    lab, _ = nd.label(block)
    for x, y in spec.get('sand', []):
        i = lab[y, x]
        assert i and (lab == i).sum() < 3000, f'{n}: {x},{y} is not a small blocked piece'
        block[lab == i] = False
    for name, (x0, y0), keep in spec.get('paint', []):   # where the user painted the dunes: exactly theirs
        p = np.asarray(Image.open(Path(__file__).parent / name)) > 127
        r = (slice(y0, y0 + p.shape[0]), slice(x0, x0 + p.shape[1]))
        block[r] = p | (rocks[r] if keep else False)   # keep: the rocks inside the painted box stay as they are
    floor = ~block
    # one pixel soft edge, like the user's brush: 4x the picture, blurred, back down
    big = Image.fromarray((floor * 255).astype('uint8')).resize((w * 4, h * 4), Image.NEAREST)
    alpha = np.asarray(big.resize((w, h), Image.BOX)).astype(float)
    alpha = nd.gaussian_filter(alpha, 0.5)
    alpha[floor & (nd.binary_erosion(floor, disk(1)))] = 255
    alpha[~floor & ~nd.binary_dilation(floor, disk(1))] = 0
    rgba = np.zeros((h, w, 4), 'uint8'); rgba[..., :3] = COLOUR; rgba[..., 3] = np.clip(alpha, 0, 255).round()
    Image.fromarray(rgba, 'RGBA').save(SRC / '충돌' / spec['art'])
    o = a.copy(); o[~(rgba[..., 3] >= 128)] *= 0.35
    Image.fromarray(o.astype('uint8')).save(REVIEW / f'{n}-collision-made.png')
    print(n, spec['art'], f'floor {(rgba[..., 3] >= 128).mean() * 100:.1f} %')


if __name__ == '__main__':
    REVIEW.mkdir(parents=True, exist_ok=True)
    for n, spec in MAPS.items(): make(n, spec)
