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


def dilate(m, n):
    for _ in range(n):
        e = m.copy(); e[1:] |= m[:-1]; e[:-1] |= m[1:]; e[:, 1:] |= m[:, :-1]; e[:, :-1] |= m[:, 1:]; m = e
    return m


def anchors(im, who, part, band=None):
    """three (lightness, Lab tone) anchors, dark to light"""
    m = rows(mask_of(im, who, part), band) & (im[..., 3] >= 250)
    # SKIN_CORE=n: measure only n px inside the mask (every pixel still moves); Horus's kilt fold lines and the edges
    # next to the outline pass SKIN_TIGHT and read as his skin's shadow
    if os.environ.get('SKIN_CORE'): m = erode(m, int(os.environ['SKIN_CORE']))
    lab = cs.lab(im[..., :3][m])
    # SKIN_PLAIN=1: the skin's own colour only, the less pink half of the mask (a side face's blush covers much of it
    # and pulled the shift to red: Somang's side combat pictures came out flushed); all three anchors the same
    if part == 'skin' and os.environ.get('SKIN_PLAIN'):
        p = np.median(lab[lab[:, 1] <= np.percentile(lab[:, 1], 50)], 0)
        return np.array([p - [0.01, 0, 0], p, p + [0.01, 0, 0]])
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
    # TONE_FROM=png: measure the picture's tones on another picture of the same motion (Set's back pickup 1 shows only
    # a sliver of hand, whose median came out as a highlight and pulled the skin pink)
    tf = np.asarray(Image.open(os.environ['TONE_FROM']).convert('RGBA')).astype(np.float32) if os.environ.get('TONE_FROM') else im
    a, b = anchors(tf, who, part, sb), anchors(rf, who, part, rb)
    order = np.argsort(a[:, 0]); a, b = a[order], b[order]
    m = rows(mask_of(im, who, part), sb)
    # SKIN_SPREAD=n: move every warm light pixel within n px of the skin mask too (measured on the mask as before);
    # pale skin (Somang's) is only partly inside SKIN_TIGHT and moving only those pixels left the face blotchy
    if part == 'skin' and os.environ.get('SKIN_SPREAD'):
        n = int(os.environ['SKIN_SPREAD']); R, G, B = im[..., 0], im[..., 1], im[..., 2]
        sat = (R - B) / np.maximum(R, 1)
        warm = (im[..., 3] > 0) & (R >= G) & (G >= B) & (R > 140) & (sat > 0.11) & (R - B < 120)   # the ivory dress is under 0.1
        m = rows(dilate(m, n) & warm, sb)
    lab = cs.lab(im[..., :3][m])
    off = np.stack([np.interp(lab[:, 0], a[:, 0], (b - a)[:, c]) for c in range(3)], -1)
    # TONE_FLAT=1: one shift for every pixel (the middle tone's); with three, small lightness steps in a softly
    # shaded face got different shifts and the face came out blotchy (Somang's side combat pictures)
    if os.environ.get('TONE_FLAT'): off = np.broadcast_to((b - a)[1], lab.shape)
    new = im.copy(); new[..., :3][m] = lab2rgb(lab + k * off)
    # SKIN_SOFT=1 (with TONE_FLAT): instead of a hard mask, every pixel in the rows moves by the one shift times how
    # skin-like it is (light, warm, a little saturated), so there is no edge between moved and unmoved pixels
    # (Somang's pale skin came out in patches with a hard mask)
    # HAIR_SOFT=1 (with TONE_FLAT): the hair moves by one shift (its middle tone's) times how hair-like each pixel is
    # (dark, not yellow), inside the hair mask grown by 3 px; the wooden stick (yellower) and light pixels fade out, so
    # no pixel breaks against its neighbour (Somang)
    if part == 'hair' and os.environ.get('HAIR_SOFT'):
        sh = (b - a)[1]; lab_all = cs.lab(im[..., :3].reshape(-1, 3)).reshape(im.shape[:2] + (3,))
        L, B_ = lab_all[..., 0], lab_all[..., 2]
        # HAIR_HUE=deg: hair-like = hue angle (Lab a/b) under deg, fading out over 10 degrees, instead of "not yellow"
        # (Set's red hair and its highlights have b* 10–20; gold and skin lie at higher angles), with some colour in it
        # (the black skirt's near-grey pixels have any angle)
        if os.environ.get('HAIR_HUE'):
            A_ = lab_all[..., 1]; ang = np.degrees(np.arctan2(B_, A_))
            hue = np.clip((float(os.environ['HAIR_HUE']) + 10 - ang) / 10, 0, 1) * np.clip((ang + 40) / 10, 0, 1) \
                * np.clip((np.hypot(A_, B_) - 6) / 6, 0, 1)
        else: hue = np.clip((14 - B_) / 5, 0, 1)
        w = dilate(mask_of(im, who, part), 3) * hue * np.clip((55 - L) / 10, 0, 1) * (im[..., 3] > 0)
        # HAIR_INK=1: the lightness shift fades to nothing toward black (L / the hair's middle L), so the dark ink lines
        # keep their weight (Horus's hair moves +5 L and its black outline went grey)
        sh = np.broadcast_to(sh, lab_all.shape).copy()
        if os.environ.get('HAIR_INK'): sh[..., 0] *= np.clip(L / a[1][0], 0, 1)
        new = im.copy(); new[..., :3] = np.where(w[..., None] > 0, lab2rgb(lab_all + k * w[..., None] * sh), im[..., :3])
        m = w > 0
    if part == 'skin' and os.environ.get('SKIN_SOFT'):
        sh = (b - a)[1]; R, G, B = im[..., 0], im[..., 1], im[..., 2]
        L = cs.lab(im[..., :3].reshape(-1, 3)).reshape(im.shape[:2] + (3,))[..., 0]
        sat = (R - B) / np.maximum(R, 1)
        # SKIN_SATMIN=s: skin starts at saturation s instead of 0.09 (Horus's ivory kilt is 0.08–0.1 with warm folds and
        # moved with his skin; his skin is 0.2)
        smin = float(os.environ.get('SKIN_SATMIN', 0.09))
        w = np.clip((L - 55) / 12, 0, 1) * np.clip((sat - smin) / 0.07, 0, 1) * np.clip((R - G + 4) / 8, 0, 1) * (im[..., 3] > 0)
        # SKIN_SATMAX=s: and not much more saturated than skin (Set's and Horus's gold collar and bands are 0.6 and moved
        # with the skin), fading out over 0.08 above s
        if os.environ.get('SKIN_SATMAX'): w = w * np.clip((float(os.environ['SKIN_SATMAX']) + 0.08 - sat) / 0.08, 0, 1)
        # SKIN_GROW=1: only the skin-like areas next to the skin itself (the skin mask without its outer 3 px, grown
        # through skin-like pixels): Horus's warm kilt folds and the gold spear tip's light faces are skin-like but stand
        # apart from his skin behind the outline, and moved with it
        if os.environ.get('SKIN_GROW'):
            # at most 12 px out (the kilt meets the belly without an outline, so its folds joined through the waist)
            ok = w > 0; s_ = erode(mask_of(im, who, 'skin'), 3) & ok
            for _ in range(3): s_ = dilate(s_, 4) & ok
            w = w * s_
        if sb is not None:   # PART_FEATHER=n: the part fades in and out over n rows round its band, so two parts meet without a seam
            n = int(os.environ.get('PART_FEATHER', 0)); y = np.arange(im.shape[0])[:, None]
            if n: w = w * np.clip((y - (sb[0] - n / 2)) / n, 0, 1) * np.clip(((sb[1] + n / 2) - y) / n, 0, 1)
            else: w = rows(w > 0, sb) * w
        lab_all = cs.lab(im[..., :3].reshape(-1, 3)).reshape(im.shape[:2] + (3,))
        new = im.copy(); new[..., :3] = np.where(w[..., None] > 0, lab2rgb(lab_all + k * w[..., None] * sh), im[..., :3])
        m = w > 0
    Image.fromarray(new.round().astype(np.uint8), 'RGBA').save(out)
    print(part, 'tones before', np.round(a, 1).tolist(), '→ reference', np.round(b, 1).tolist(), f'{int(m.sum())} px')


if __name__ == '__main__':
    main()
