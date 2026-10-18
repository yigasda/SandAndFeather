# python3 tonematch.py <in> <out> <who> <hair|skin> <reference png> [strength]
# Moves one part's colours (hair or skin, found the way check-sprite / sprite-review find them) onto the reference's
# tones: the part's dark / middle / light tones (hair: the 15 / 50 / 85 % lightness medians, as sprite-review measures;
# skin: skin-check's shadow / base / light) are each shifted in Lab to the reference's, and every pixel of the part is
# shifted by the offset interpolated at its own lightness. Nothing is redrawn: shapes, shading steps and outlines stay,
# only the colour of those pixels moves. strength 1 = all the way (0.5 = half).
import importlib.util, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('cs', os.path.join(HERE, '..', 'check-sprite.py'))
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
spec = importlib.util.spec_from_file_location('sk', os.path.join(HERE, '..', 'skin-check.py'))
sk = importlib.util.module_from_spec(spec); spec.loader.exec_module(sk)


def lab2rgb(lab):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    fy = (L + 16) / 116; fx = fy + a / 500; fz = fy - b / 200
    f = lambda v: np.where(v ** 3 > 0.008856, v ** 3, (v - 16 / 116) / 7.787)
    xyz = np.stack([f(fx) * 0.9505, f(fy), f(fz) * 1.089], -1)
    c = xyz @ np.linalg.inv(np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])).T
    c = np.where(c > 0.0031308, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055, 12.92 * c)
    return np.clip(c * 255, 0, 255)


def largest(m):
    """the biggest 8-connected piece of a mask (the hair; a dark spear shaft of the same blue lies apart from it)"""
    from collections import deque
    lab = np.zeros(m.shape, np.int32); best, size, n = 0, 0, 0
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]: continue
        n += 1; q = deque([(y0, x0)]); lab[y0, x0] = n; c = 0
        while q:
            y, x = q.popleft(); c += 1
            for yy in (y - 1, y, y + 1):
                for xx in (x - 1, x, x + 1):
                    if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; q.append((yy, xx))
        if c > size: best, size = n, c
    return lab == best


def mask_of(im, who, part):
    if part == 'hair':
        m = cs.parts(im, who)['hair'] & (im[..., 3] > 0)
        # HAIR_ONLY_LARGEST=1: pictures holding a dark blue weapon (Horus's spear) keep only the hair's own piece
        return largest(m) if os.environ.get('HAIR_ONLY_LARGEST') else m
    # SKIN_TIGHT=1: only warm, mid-saturated skin (Horus's ivory kilt and gold collar pass skin-check's mask and pulled
    # its tones off: a walk picture went grey); its tones are then taken like the hair's (15 / 50 / 85 % lightness)
    if os.environ.get('SKIN_TIGHT'):
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        mx = np.maximum(np.maximum(r, g), b); sat = (mx - np.minimum(np.minimum(r, g), b)) / np.maximum(mx, 1)
        return (im[..., 3] > 0) & (r >= g) & (g >= b) & (r > 150) & (r - b > 25) & (r - b < 110) & (sat > 0.18) & (sat < 0.5) & (g - b < 45) & (r - g > 18)
    # skin as skin-check measures it (Somang's ivory dress is less saturated than skin)
    p = cs.parts(im, who); _, s, _ = cs.hsv(im[..., :3] / 255)
    return p['skin'] & ~p['outline'] & (s > (0.08 if who == 'horus' else 0.14))


def rows(m, band):
    """the mask only between rows band = (y0, y1); None keeps it all"""
    if band is None: return m
    m = m.copy(); m[:band[0]] = False; m[band[1]:] = False
    return m


def erode(m, n):
    """the mask without its outer n px (thin lines that pass it, like a kilt's fold lines, drop out)"""
    for _ in range(n):
        e = m.copy(); e[1:] &= m[:-1]; e[:-1] &= m[1:]; e[:, 1:] &= m[:, :-1]; e[:, :-1] &= m[:, 1:]; m = e
    return m


def anchors(im, who, part, band=None):
    """three (lightness, Lab tone) anchors, dark to light"""
    m = rows(mask_of(im, who, part), band) & (im[..., 3] >= 250)
    # SKIN_CORE=n: measure only n px inside the mask (every pixel still moves); Horus's kilt fold lines and the edges
    # next to the outline pass SKIN_TIGHT and read as his skin's shadow
    if os.environ.get('SKIN_CORE'): m = erode(m, int(os.environ['SKIN_CORE']))
    lab = cs.lab(im[..., :3][m])
    if part == 'hair' or os.environ.get('SKIN_TIGHT'):
        L = lab[:, 0]; out = []
        for q in (15, 50, 85):
            lo, hi = np.percentile(L, [max(0, q - 7), min(100, q + 7)])
            out.append(np.median(lab[(L >= lo) & (L <= hi)], 0))
        return np.array(out)
    t = sk.tones(im[..., :3][m])
    return cs.lab(np.array([t['shadow'], t['base'], t['light']], np.float32))


def main():
    src, out, who, part, ref = sys.argv[1:6]
    k = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
    im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
    rf = np.asarray(Image.open(ref).convert('RGBA')).astype(np.float32)
    # PART_ROWS="y0,y1,ry0,ry1": one body part at a time (a face, the arms, the legs painted in their own tones on the
    # reference): only rows y0..y1 of the picture move, onto the tones of rows ry0..ry1 of the reference
    pr = [int(v) for v in os.environ['PART_ROWS'].split(',')] if os.environ.get('PART_ROWS') else None
    sb, rb = (pr[:2], pr[2:]) if pr else (None, None)
    a, b = anchors(im, who, part, sb), anchors(rf, who, part, rb)
    order = np.argsort(a[:, 0]); a, b = a[order], b[order]
    m = rows(mask_of(im, who, part), sb)
    lab = cs.lab(im[..., :3][m])
    off = np.stack([np.interp(lab[:, 0], a[:, 0], (b - a)[:, c]) for c in range(3)], -1)
    new = im.copy(); new[..., :3][m] = lab2rgb(lab + k * off)
    Image.fromarray(new.round().astype(np.uint8), 'RGBA').save(out)
    print(part, 'tones before', np.round(a, 1).tolist(), '→ reference', np.round(b, 1).tolist(), f'{int(m.sum())} px')


if __name__ == '__main__':
    main()
