# Cuts the bag/talk action buttons out of the concept's map (run after pack-ui-skins.cjs, before the CSS draws
# them whole with background-size: contain). Outside the frame's own silhouette goes transparent; a frame-edge
# pixel that is grass takes the frame's outline colour. Everything else stays source RGB.
# Round frames use the circle fitted to their outline (centre x, y, radius in crop pixels); the cozy octagons
# are fitted here against the grass. provenance.json gets the new crop and the recoloured rim pixels.
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from importlib import import_module
save_provenance = import_module('repair-ui-skins').save_provenance

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'art', 'ui', 'skins')
CIRCLES = {
    'classic/action-bag': (50.9, 52.7, 51.4), 'classic/action-talk': (53.3, 56.8, 52.8),
    'walnut/action-bag': (46.1, 44.6, 45.1), 'walnut/action-talk': (54.6, 51.5, 51.1),
    'journal/action-bag': (50.5, 51.9, 48.5), 'journal/action-talk': (49.6, 51.8, 48.6),
    'temple/action-bag': (56.4, 60.9, 57.9), 'temple/action-talk': (61.2, 61.1, 58.2),
}
OCTAGONS = ['cozy/action-bag', 'cozy/action-talk']


def grassy(rgb):
    return (rgb[..., 1] > rgb[..., 0] + 8) & (rgb[..., 1] >= rgb[..., 2])


def shrink(m, n):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(n))) > 0


def grow(m, n):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(n))) > 0


def finish(a, m_in, m_out, rgb, oc, rim_far):
    fix = m_out & grassy(rgb) & ~shrink(m_in, 5)
    if rim_far:
        fix |= m_out & ~m_in & (np.abs(rgb - oc.astype(int)).sum(-1) > 90)
    a[..., 3] = np.where(m_out, 255, 0)
    a[fix, :3] = oc
    ys, xs = np.where(m_out)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    fy, fx = np.where(fix[y0:y1, x0:x1])
    return a[y0:y1, x0:x1], (int(x0), int(y0)), [[int(x), int(y)] for x, y in zip(fx, fy)]


def circle(a, rgb, cx, cy, r):
    h, w = rgb.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - cx, yy - cy)
    lum = rgb @ [.3, .59, .11]
    oc = np.median(rgb[(abs(d - r) < .8) & (lum < 90)], axis=0).astype(np.uint8)
    return finish(a, d <= r, d <= r + 1, rgb, oc, False) + (oc,)


def octagon(a, rgb, key):
    h, w = rgb.shape[:2]
    val = np.where(grassy(rgb), -4.0, 1.0)

    def mask(p):
        x0, y0, x1, y1, tl, tr, br, bl = p
        m = Image.new('L', (w, h), 0)
        ImageDraw.Draw(m).polygon([(x0 + tl, y0), (x1 - tr, y0), (x1, y0 + tr), (x1, y1 - br), (x1 - br, y1), (x0 + bl, y1), (x0, y1 - bl), (x0, y0 + tl)], fill=255)
        return np.asarray(m) > 0
    p = [3, 3, w - 4, h - 4, 15, 15, 15, 15]
    best = val[mask(p)].sum()
    for _ in range(40):
        moved = False
        for i in range(8):
            for dv in (-1, 1):
                q = list(p)
                q[i] += dv
                s = val[mask(q)].sum()
                if s > best:
                    best, p, moved = s, q, True
        if not moved:
            break
    if key == 'cozy/action-talk':
        p[6] = p[7]  # that corner hides behind a crate in the concept: mirror the left one
    m = mask(p)
    m_out = grow(m, 3)
    edge = m_out & ~shrink(m, 5)
    lum = rgb @ [.3, .59, .11]
    ring = edge & ~grassy(rgb)
    oc = np.median(rgb[ring & (lum < np.percentile(lum[ring], 30))], axis=0).astype(np.uint8)
    return finish(a, m, m_out, rgb, oc, True) + (oc,)


def main():
    prov_path = os.path.join(ROOT, 'provenance.json')
    prov = json.load(open(prov_path))
    for key in [*CIRCLES, *OCTAGONS]:
        theme, asset = key.split('/')
        rec = next(r for r in prov if r['theme'] == theme and r['asset'] == asset)
        if 'rimFromOutline' in rec:
            continue  # already cut
        path = os.path.join(ROOT, theme, asset + '.png')
        a = np.asarray(Image.open(path).convert('RGBA')).copy()
        rgb = a[..., :3].astype(int)
        out, (ox, oy), fixed, oc = circle(a, rgb, *CIRCLES[key]) if key in CIRCLES else octagon(a, rgb, key)
        Image.fromarray(out).save(path)
        c = rec['crop']
        rec['crop'] = [c[0] + ox, c[1] + oy, out.shape[1], out.shape[0]]
        rec['cutout'] = True
        rec['rimFromOutline'] = {'color': [int(v) for v in oc], 'pixels': fixed,
                                 'note': 'background pixels on the frame edge take the frame outline colour'}
        print('cut', key, rec['crop'], len(fixed))
    save_provenance(prov_path, prov)


if __name__ == '__main__':
    main()
