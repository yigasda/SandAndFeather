# Compares Horus's front hair with the shape the user drew (docs/art/chibi-refresh/horus-hair-guide/user-edit-final.jpg).
# The user's drawing is a phone edit: its outline, spikes, width, height and hairline are the target; its brush marks
# and colours are not. Every frame is matched by the eyes, so the target follows the head wherever a walk frame
# moves it.
#
#   python3 tools/art/check-hair.py CAND.png [CAND.png ...] [--out DIR]
#       → DIR/<name>-hair.png (the user's outline over the candidate, enlarged) and DIR/report.md
#   python3 tools/art/check-hair.py --targets
#       → horus-hair-guide/targets/: the user's outline placed on the adopted front walk frames and the idle front,
#         plus the per-frame head motion table
import argparse, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
ART = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh')
GUIDE_DIR = os.path.join(ART, 'horus-hair-guide')
GUIDE = os.path.join(GUIDE_DIR, 'user-edit-final.jpg')
WALK = os.path.join(ART, 'review-trio-walk-v5', 'walk')
try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
except OSError:
    FONT = ImageFont.load_default()


def hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6
    h[gg] = (b - r)[gg] / d[gg] + 2
    h[bb] = (r - g)[bb] / d[bb] + 4
    return h / 6, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx


def grow(m, n=1):
    for _ in range(n):
        g = m.copy()
        g[1:] |= m[:-1]; g[:-1] |= m[1:]; g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]
        m = g
    return m


def shrink(m, n=1):
    return ~grow(~m, n)


def components(mask):
    from collections import deque
    seen = np.zeros_like(mask); H, W = mask.shape; out = []
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]: continue
        q = deque([(y, x)]); seen[y, x] = True; pts = []
        while q:
            cy, cx = q.popleft(); pts.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        out.append(np.array(pts))
    return sorted(out, key=len, reverse=True)


def load(path):
    im = Image.open(path)
    rgb = np.asarray(im.convert('RGB')).astype(float) / 255
    if im.mode == 'RGBA':
        body = np.asarray(im)[..., 3] > 128
    else:
        # a flat paper background (a screenshot may add a white band): anything clearly away from both the corner
        # colour and the left edge's usual colour is the drawing
        body = np.ones(rgb.shape[:2], bool)
        for bg in (rgb[3, 3], np.median(rgb[:, 2], 0)):
            body &= np.abs(rgb - bg).max(-1) > 0.08
    return rgb, body


def eyes(rgb, body):
    # the two golden irises: a pair of gold blobs of like size, side by side, the highest such pair in the picture
    # (armbands are lower; the cheek mark is small). Works on a whole figure or a head crop.
    h, s, v = hsv(rgb)
    ys = np.nonzero(body.any(1))[0]
    top, H = ys.min(), ys.max() - ys.min() + 1
    gold = (h > 0.08) & (h < 0.15) & (s > 0.55) & (v > 0.6) & body
    blobs = [b for b in components(gold)[:8] if len(b) >= 30]
    cs = [(float(b[:, 1].mean()), float(b[:, 0].mean()), len(b)) for b in blobs]
    best = None
    for i in range(len(cs)):
        for j in range(i + 1, len(cs)):
            a, b = cs[i], cs[j]
            d = abs(a[0] - b[0])
            if d < 10 or abs(a[1] - b[1]) > 0.15 * d or max(a[2], b[2]) > 1.8 * min(a[2], b[2]): continue
            key = (a[1] + b[1]) / 2
            if best is None or key < best[0]: best = (key, sorted([a, b]))
    if best is None: raise SystemExit('눈을 못 찾음')
    return [(x, y) for x, y, _ in best[1]], top, H


def hair_mask(rgb, body, e):
    # the hair silhouette: the blue mass (the brows are separate blue blobs and are left out) plus the dark outline
    # drawn round it, down to eye level (below that the dark line is the face and ears)
    h, s, v = hsv(rgb)
    blue = (h > 0.58) & (h < 0.75) & (s > 0.25) & (v < 0.85) & body
    blue = shrink(grow(blue, 2), 2)
    main = components(blue)[0]
    m = np.zeros_like(blue); m[main[:, 0], main[:, 1]] = True
    m = shrink(grow(m, 2), 2)  # pinholes left by highlights
    eye_y = min(e[0][1], e[1][1])
    rows = np.arange(rgb.shape[0])[:, None]
    # the outline round the hair, however thick: dark pixels reached from the blue through dark pixels. Dark lines
    # that hug skin and not the hair (ears, jaw) are a different outline and are not crossed.
    skin = (h < 0.12) & (s > 0.12) & (s < 0.5) & (v > 0.7) & body  # paper is a pale tint; skin is pinker
    near = max(4, int(round(0.1 * abs(e[1][0] - e[0][0]))))
    dark = (v < 0.5) & (s < 0.6) & body & (rows < eye_y) & ~(grow(skin, near) & ~grow(m, near // 2))
    ring = m.copy()
    while True:
        nxt = ring | (grow(ring, 1) & dark)
        if nxt.sum() == ring.sum(): break
        ring = nxt
    return ring, m


def place(mask, src_eyes, dst_eyes, shape, fill=0):
    # similarity transform from the guide's eyes onto the candidate's, nearest-neighbour resample (a mask or a picture)
    (sx0, sy0), (sx1, sy1) = src_eyes; (dx0, dy0), (dx1, dy1) = dst_eyes
    sv = np.array([sx1 - sx0, sy1 - sy0]); dv = np.array([dx1 - dx0, dy1 - dy0])
    k = np.linalg.norm(dv) / np.linalg.norm(sv)
    ang = np.arctan2(dv[1], dv[0]) - np.arctan2(sv[1], sv[0])
    c, s_ = np.cos(ang) * k, np.sin(ang) * k
    # dst = A·src + t ; invert for sampling
    A = np.array([[c, -s_], [s_, c]])
    t = np.array([(dx0 + dx1) / 2, (dy0 + dy1) / 2]) - A @ np.array([(sx0 + sx1) / 2, (sy0 + sy1) / 2])
    Ai = np.linalg.inv(A)
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    pts = np.stack([xx.ravel() - t[0], yy.ravel() - t[1]])
    sx, sy = Ai @ pts
    sx = np.round(sx).astype(int); sy = np.round(sy).astype(int)
    ok = (sx >= 0) & (sx < mask.shape[1]) & (sy >= 0) & (sy < mask.shape[0])
    out = np.full((shape[0] * shape[1],) + mask.shape[2:], fill, mask.dtype)
    out[ok] = mask[sy[ok], sx[ok]]
    return out.reshape(tuple(shape[:2]) + mask.shape[2:]), {'scale': round(float(k), 4), 'rotationDeg': round(float(np.degrees(ang)), 2),
                                'shift': [round(float(t[0]), 1), round(float(t[1]), 1)]}


def edge(m):
    return m & ~shrink(m, 1)


def dist_to(mask_edge, pts):
    # distance from each point to the nearest pixel of mask_edge (brute force over a few thousand points)
    ey, ex = np.nonzero(mask_edge)
    if not len(ey): return np.full(len(pts), 99.0)
    E = np.stack([ex, ey], 1).astype(float)
    out = np.empty(len(pts))
    for i in range(0, len(pts), 256):
        d = np.sqrt(((pts[i:i + 256, None, :] - E[None]) ** 2).sum(-1))
        out[i:i + 256] = d.min(1)
    return out


def head_mask(rgb, body, e):
    # the whole head as drawn: hair, ears and face down to the gold collar, with the paper gaps the user left between
    # hair and ears (they show as notches in the outline)
    h, s, v = hsv(rgb)
    gold = (h > 0.08) & (h < 0.15) & (s > 0.45) & (v > 0.35) & body
    eye_y = max(e[0][1], e[1][1]); eye_d = abs(e[1][0] - e[0][0])
    collar = rgb.shape[0]
    for y in range(int(eye_y + 0.4 * eye_d), rgb.shape[0]):
        if gold[y].sum() > 0.3 * eye_d: collar = y; break
    rows = np.arange(rgb.shape[0])[:, None]
    head = components(shrink(grow(body & (rows < collar), 1), 1))[0]
    m = np.zeros_like(body); m[head[:, 0], head[:, 1]] = True
    # pale highlights on the face read like paper; only paper that reaches the outside counts as a gap
    outside = ~m
    reach = np.zeros_like(m); reach[0] = outside[0]; reach[-1] = outside[-1]; reach[:, 0] = outside[:, 0]; reach[:, -1] = outside[:, -1]
    while True:
        nxt = reach | (grow(reach, 1) & outside)
        if nxt.sum() == reach.sum(): break
        reach = nxt
    return ~reach


def ear_zone(rgb, body, e):
    # the columns beside the face, where the ears are. The jaw and chin between them were not part of the user's
    # edit, so the target line leaves them to the frame's own drawing.
    h, s, v = hsv(rgb)
    eye_d = abs(e[1][0] - e[0][0])
    y = int(max(e[0][1], e[1][1]) + 0.3 * eye_d)
    cx = (e[0][0] + e[1][0]) / 2
    dark = v[y] < 0.3
    x = int(cx)
    while x > 0 and not dark[x]: x -= 1
    left = x
    x = int(cx)
    while x < len(dark) - 1 and not dark[x]: x += 1
    right = x
    cols = np.arange(rgb.shape[1])[None, :]
    rows = np.arange(rgb.shape[0])[:, None]
    return ((cols < left) | (cols > right)) & (rows > min(e[0][1], e[1][1]) - 0.6 * eye_d)


GUIDE_CACHE = {}


def guide():
    if not GUIDE_CACHE:
        rgb, body = load(GUIDE)
        e, top, H = eyes(rgb, body)
        sil, blue = hair_mask(rgb, body, e)
        h, s, v = hsv(rgb)
        skin = (h < 0.12) & (s > 0.05) & (s < 0.5) & (v > 0.7) & body
        # the outline that faces the paper, and the hairline where the blue meets the forehead and temples
        k = max(2, int(round(0.03 * abs(e[1][0] - e[0][0]))))
        outer = edge(sil) & grow(~body, k)
        hairline = edge(blue) & grow(skin & ~sil, k + 1)
        GUIDE_CACHE.update(rgb=rgb, body=body, sil=sil, blue=blue, eyes=e, outer=outer, hairline=hairline,
                           head=head_mask(rgb, body, e), ears=ear_zone(rgb, body, e))
    return GUIDE_CACHE


def ear_thickness(dark, rim, head, zone, sil, d):
    # dark pixels within 5 px inside the ear's edge, per pixel of edge, per eye distance: the outline's weight
    band = grow(rim, 5) & head & zone & ~grow(sil, 2)
    return round(float((dark & band).sum() / max(rim.sum(), 1) / d), 4)


def user_on(e, shape):
    # the user's drawing moved and scaled onto a frame by the eyes, with its paper as the frame's background
    g = guide()
    user, _ = place((g['rgb'] * 255).astype(np.uint8), g['eyes'], e, shape, fill=0)
    ub = place(g['body'], g['eyes'], e, shape)[0]
    user[~ub] = (245, 239, 227)
    return user, ub


def hair_line_weight(rgb, body, e, sil):
    # dark pixels just inside the hair's outer edge, per pixel of edge, per eye distance: how heavy the outline is
    d = abs(e[1][0] - e[0][0])
    dark = (hsv(rgb)[2] < 0.3) & body
    rim = edge(sil) & grow(~body, 1)
    band = grow(rim, max(4, int(round(0.1 * d)))) & sil
    return float((dark & band).sum() / max(rim.sum(), 1) / d)


def hairline_ink(rgb, body, e, sil, blue):
    # how much near-black sits where the hair meets the forehead. The user's hairline has none to speak of: hair
    # tufts run into skin. A black rim there reads as hair cut out and stuck on.
    d = abs(e[1][0] - e[0][0]); cx = (e[0][0] + e[1][0]) / 2; ey = min(e[0][1], e[1][1])
    h, s, v = hsv(rgb)
    skin = (h < 0.12) & (s > 0.08) & (s < 0.5) & (v > 0.7) & body
    rows = np.arange(rgb.shape[0])[:, None]; cols = np.arange(rgb.shape[1])[None, :]
    zone = grow(blue, 2) & grow(skin, 2) & (rows < ey - 0.35 * d) & (np.abs(cols - cx) < 0.6 * d)
    return float(((v < 0.2) & zone).sum() / max(zone.sum(), 1)), zone & (v < 0.2)


def ear_boxes(ears, e):
    # a box round each ear, from the ear pixels left and right of the eyes' middle
    cx = (e[0][0] + e[1][0]) / 2; d = abs(e[1][0] - e[0][0])
    out = []
    for side in (np.arange(ears.shape[1]) < cx, np.arange(ears.shape[1]) >= cx):
        m = ears & side[None, :]
        ys, xs = np.nonzero(m)
        if not len(ys): out.append(None); continue
        y0, y1 = int(np.percentile(ys, 2)), int(ys.max()); x0, x1 = int(xs.min()), int(xs.max())
        pad = int(0.12 * d)
        out.append((max(0, x0 - pad), max(0, y0 - pad), x1 + pad, y1 + pad))
    return out


def ear_sheet(res, path):
    # the candidate's ears beside the user's drawing moved onto the same frame, 6×: line weight, smoothness, shape
    rgb = res['_draw'][0]; body = res['_draw'][1]
    user = res['_user']
    pic = np.ones((*rgb.shape[:2], 3)) * np.array([245, 239, 227]) / 255
    pic[body] = rgb[body]; pic = Image.fromarray((pic * 255).astype(np.uint8))
    rows = [('후보', pic), ('사용자 그림 (같은 자리에 옮김)', Image.fromarray(user))]
    boxes = [b for b in res['_earBoxes'] if b]
    tiles = [(name, [im.crop(b).resize(((b[2] - b[0]) * 6, (b[3] - b[1]) * 6), Image.NEAREST) for b in boxes]) for name, im in rows]
    w = sum(t.width for _, ts in tiles for t in ts) + 10 * len(boxes) * 2 + 40
    h = max(t.height for _, ts in tiles for t in ts) + 30
    cv = Image.new('RGB', (w, h), (250, 248, 244)); d = ImageDraw.Draw(cv); x = 0
    for name, ts in tiles:
        d.text((x + 6, 4), name + ' 귀 (왼쪽, 오른쪽)', fill=(40, 30, 20), font=FONT)
        for t in ts: cv.paste(t, (x, 26)); x += t.width + 10
        x += 40
    cv.save(path)


def forehead_sheet(res, path):
    # the hairline and the hair round it, candidate beside the user's drawing on the same frame, 5×
    rgb, body = res['_draw'][0], res['_draw'][1]
    e = res['_eyesRaw']; d = abs(e[1][0] - e[0][0]); cx = (e[0][0] + e[1][0]) / 2; ey = min(e[0][1], e[1][1])
    box = (int(cx - 0.95 * d), int(ey - 1.25 * d), int(cx + 0.95 * d), int(ey - 0.05 * d))
    pic = np.ones((*rgb.shape[:2], 3)) * np.array([245, 239, 227]) / 255
    pic[body] = rgb[body]; pic = Image.fromarray((pic * 255).astype(np.uint8))
    k = 5
    tiles = [(n, im.crop(box).resize(((box[2] - box[0]) * k, (box[3] - box[1]) * k), Image.NEAREST))
             for n, im in (('후보', pic), ('사용자 그림 (같은 자리에 옮김)', Image.fromarray(res['_user'])))]
    w = tiles[0][1].width
    cv = Image.new('RGB', (w * 2 + 30, tiles[0][1].height + 28), (250, 248, 244)); d_ = ImageDraw.Draw(cv)
    for i, (n, t) in enumerate(tiles):
        cv.paste(t, (i * (w + 30), 26)); d_.text((i * (w + 30) + 6, 4), n + ' 이마선·머리 외곽선', fill=(40, 30, 20), font=FONT)
    cv.save(path)


EAR_REF = {}


def ear_ref():
    # the user's own ear line, as thickness per eye distance so any picture size compares
    if 'v' not in EAR_REF:
        g = guide()
        d = abs(g['eyes'][1][0] - g['eyes'][0][0])
        dark = (hsv(g['rgb'])[2] < 0.3) & g['body']
        rim = edge(g['head']) & g['ears'] & grow(~g['body'], 1) & ~grow(g['sil'], 2)
        band = grow(rim, max(5, int(round(5 * d / 62)))) & g['head'] & g['ears'] & ~grow(g['sil'], 2)
        EAR_REF['v'] = round(float((dark & band).sum() / max(rim.sum(), 1) / d), 4)
    return EAR_REF['v']


def compare(path):
    g = guide()
    rgb, body = load(path)
    e, top, H = eyes(rgb, body)
    target, tf = place(g['sil'], g['eyes'], e, body.shape)
    target_blue, _ = place(g['blue'], g['eyes'], e, body.shape)
    sil, blue = hair_mask(rgb, body, e)
    outer, _ = place(g['outer'], g['eyes'], e, body.shape)
    hairline, _ = place(g['hairline'], g['eyes'], e, body.shape)
    ce = edge(sil); cbe = edge(blue)
    res = {'path': os.path.relpath(path, ROOT), 'eyes': [[round(x, 1), round(y, 1)] for x, y in e], 'transform': tf, '_eyesRaw': e}
    for name, pts_mask, against in (('outer', outer, ce), ('hairline', hairline, cbe)):
        ys, xs = np.nonzero(pts_mask)
        d = dist_to(against, np.stack([xs, ys], 1).astype(float)) if len(ys) else np.array([0.0])
        res[name] = {'points': int(len(ys)), 'mean': round(float(d.mean()), 2), 'max': round(float(d.max()), 1),
                     'within2px': round(float((d <= 2).mean()), 3)}
        res[name + '_far'] = (xs[d > 3], ys[d > 3]) if len(ys) else ([], [])
    # the hair's own outline: the outermost hair pixels should be the dark line, at least 2 px thick. Hair cut
    # along the target with no line drawn back shows blue at its edge.
    h_, s_, v_ = hsv(rgb)
    dark = (v_ < 0.22) & body
    rim = edge(sil) & grow(~body, 1)
    lined = rim & dark & grow(dark & sil & ~rim, 1)
    res['outlineCover'] = round(float(lined.sum() / max(rim.sum(), 1)), 3)
    res['_bare'] = rim & ~lined
    # ears: the user's ear outline (round, with a gap under the hair) against the candidate's, both ways, so a
    # jagged or squashed ear shows up as well as a misplaced one
    thead, _ = place(g['head'], g['eyes'], e, body.shape)
    tears, _ = place(g['ears'], g['eyes'], e, body.shape)
    chead = head_mask(rgb, body, e)
    T = edge(thead) & tears & ~grow(target, 1)
    Cc = edge(chead) & tears & ~grow(sil, 1)
    ty, tx = np.nonzero(T); cy, cx = np.nonzero(Cc)
    d1 = dist_to(Cc, np.stack([tx, ty], 1).astype(float)) if len(ty) else np.array([0.0])
    d2 = dist_to(T, np.stack([cx, cy], 1).astype(float)) if len(cy) else np.array([0.0])
    res['ears'] = {'within2px': round(float(min((d1 <= 2).mean(), (d2 <= 2).mean())), 3),
                   'max': round(float(max(d1.max(), d2.max())), 1)}
    # the ear's own line: like the hair, the ear's edge should be the thick dark outline, not pale or broken pixels
    erim = edge(chead) & tears & grow(~body, 1) & ~grow(sil, 2)
    elined = erim & dark & grow(dark & chead & ~erim, 1)
    res['earOutline'] = round(float(elined.sum() / max(erim.sum(), 1)), 3)
    # and about as heavy as the user's own ear line (the user wants that brush weight, not the old walk's)
    dark30 = (v_ < 0.3) & body
    res['earThick'] = ear_thickness(dark30, erim, chead, tears, sil, abs(e[1][0] - e[0][0]))
    res['earThickRef'] = ear_ref()
    res['_earBare'] = erim & ~elined
    off = np.zeros_like(body)
    if len(cy): off[cy[d2 > 2], cx[d2 > 2]] = True
    res['_ears'] = (T, off)
    res['_earBoxes'] = ear_boxes(chead & tears & ~grow(sil, 1), e)
    # the hair outline's weight against the user's drawing placed on this same frame
    user, ub = user_on(e, body.shape)
    usil, _ = hair_mask(user.astype(float) / 255, ub, e)
    res['hairWeight'] = round(hair_line_weight(rgb, body, e, sil) * 100, 1)
    res['hairWeightUser'] = round(hair_line_weight(user.astype(float) / 255, ub, e, usil) * 100, 1)
    res['_user'] = user
    ink, inkm = hairline_ink(rgb, body, e, sil, blue)
    uink, _ = hairline_ink(user.astype(float) / 255, ub, e, usil, hair_mask(user.astype(float) / 255, ub, e)[1])
    res['hairlineInk'] = round(ink, 3); res['hairlineInkUser'] = round(uink, 3); res['_ink'] = inkm
    extra = sil & ~grow(target, 2); missing = target & ~grow(sil, 2)
    res['extraPx'] = int(extra.sum()); res['missingPx'] = int(missing.sum())
    res['_draw'] = (rgb, body, target, sil, extra, missing, top, H)
    return res


def draw(res, path):
    rgb, body, target, sil, extra, missing, top, H = res['_draw']
    W = rgb.shape[1]
    pic = np.ones((*rgb.shape[:2], 3)) * np.array([245, 239, 227]) / 255
    pic[body] = rgb[body]
    pic = (pic * 255).astype(np.uint8)
    over = pic.copy()
    over[missing] = (over[missing] * 0.4 + np.array([255, 40, 40]) * 0.6).astype(np.uint8)
    over[extra] = (over[extra] * 0.4 + np.array([40, 120, 255]) * 0.6).astype(np.uint8)
    over[edge(target)] = (230, 0, 0)
    over[grow(res['_bare'], 1) & ~edge(target)] = (255, 150, 0)  # orange: hair edge with no dark outline
    T, off = res['_ears']
    over[grow(off, 1)] = (200, 0, 200)  # magenta: the candidate's ear outline where it leaves the user's ear
    over[grow(res['_earBare'], 1)] = (255, 150, 0)  # orange: ear edge with no dark outline
    over[T] = (230, 0, 0)
    over[grow(res['_ink'], 1)] = (0, 200, 255)  # cyan: black rim along the hairline
    y1 = int(top + 0.62 * H)  # down past the ears
    k = 3
    a = Image.fromarray(pic[:y1]).resize((W * k, y1 * k), Image.NEAREST)
    b = Image.fromarray(over[:y1]).resize((W * k, y1 * k), Image.NEAREST)
    cv = Image.new('RGB', (W * k * 2, y1 * k + 92), (250, 248, 244))
    cv.paste(a, (0, 92)); cv.paste(b, (W * k, 92))
    d = ImageDraw.Draw(cv)
    d.text((8, 6), os.path.basename(res['path']) + ' — 후보 그대로 | 빨간 선 = 사용자 머리 외곽선, 빨강 칠 = 모자람, 파랑 칠 = 넘침', fill=(40, 30, 20), font=FONT)
    d.text((8, 28), f"바깥 외곽선: 평균 {res['outer']['mean']}px, 최대 {res['outer']['max']}px, 2px 안 {res['outer']['within2px'] * 100:.0f}%   "
                    f"이마선: 평균 {res['hairline']['mean']}px, 최대 {res['hairline']['max']}px, 2px 안 {res['hairline']['within2px'] * 100:.0f}%", fill=(120, 0, 60), font=FONT)
    d.text((8, 48), f"모자람 {res['missingPx']}px · 넘침 {res['extraPx']}px · 머리 외곽선 {res['outlineCover'] * 100:.0f}%, 굵기 {res['hairWeight']}(사용자 {res['hairWeightUser']}) · "
                    f"이마선 검은 테두리 {res['hairlineInk'] * 100:.0f}%(사용자 {res['hairlineInkUser'] * 100:.0f}%) · 귀 2px 안 {res['ears']['within2px'] * 100:.0f}%", fill=(120, 0, 60), font=FONT)
    d.text((8, 68), '주황 = 외곽선 없는 가장자리, 하늘색 = 이마선 검은 테두리, 보라 = 귀 어긋남', fill=(120, 0, 60), font=FONT)
    cv.save(path)


OUTLINE_MIN = 0.8  # adopted walk frames measure 86-88%; hair only cut along the line measures ~44%


def verdict(r):
    # every check that fails, not only the first
    bad = []
    if not (r['outer']['within2px'] >= 0.9 and r['outer']['max'] <= 4): bad.append('머리 모양 다름')
    if not (r['hairline']['within2px'] >= 0.85 and r['hairline']['max'] <= 5): bad.append('이마선 위치 다름')
    if r['outlineCover'] < OUTLINE_MIN: bad.append('머리 외곽선 없음 (잘라만 냄)')
    if r['hairWeight'] < 0.75 * r['hairWeightUser']: bad.append('머리 외곽선 얇음')
    if r['hairlineInk'] > r['hairlineInkUser'] + 0.1: bad.append('이마선에 검은 테두리 (오려 붙인 선)')
    if r['ears']['within2px'] < 0.85 or r['ears']['max'] > 4: bad.append('귀 모양 다름')
    if r['earOutline'] < OUTLINE_MIN: bad.append('귀 외곽선 깨짐')
    if r['earThick'] < 0.8 * r['earThickRef']: bad.append('귀 외곽선 얇음')
    return '사용자 모양과 같음' if not bad else '**' + ', '.join(bad) + '**'


def report(results, out):
    L = ['# 호루스 머리 — 사용자 수정본과 비교', '',
         '기준: 사용자 수정본(`docs/art/chibi-refresh/horus-hair-guide/user-edit-final.jpg`)의 머리 외곽선과 이마선. 눈 위치로 프레임마다 맞춘 뒤 잰다.', '',
         '| 파일 | 바깥 외곽선 평균/최대, 2px 안 | 이마선 평균/최대, 2px 안 | 모자람/넘침 px | 머리 외곽선, 굵기 (사용자) | 이마선 검은 테두리 (사용자) | 귀 모양 2px 안, 최대 | 귀 외곽선, 두께 | 판정 |', '|---|---|---|---|---|---|---|---|---|']
    for r in results:
        o, h = r['outer'], r['hairline']
        L.append(f"| [{os.path.basename(r['path'])}]({os.path.splitext(os.path.basename(r['path']))[0]}-hair.png) | "
                 f"{o['mean']}/{o['max']}px, {o['within2px'] * 100:.0f}% | {h['mean']}/{h['max']}px, {h['within2px'] * 100:.0f}% | "
                 f"{r['missingPx']}/{r['extraPx']} | {r['outlineCover'] * 100:.0f}%, {r['hairWeight']} ({r['hairWeightUser']}) | {r['hairlineInk'] * 100:.0f}% ({r['hairlineInkUser'] * 100:.0f}%) | {r['ears']['within2px'] * 100:.0f}%, {r['ears']['max']}px | {r['earOutline'] * 100:.0f}%, 굵기 {r['earThick'] * 100:.1f}/{r['earThickRef'] * 100:.1f} | {verdict(r)} |")
    L += ['', '통과 기준: 바깥 외곽선 90% 이상이 2px 안, 최대 4px. 이마선 85% 이상이 2px 안, 최대 5px.',
          '귀: 사용자 귀 윤곽(동그란 윗부분, 머리카락과 틈)과 후보 귀 윤곽이 서로 85% 이상 2px 안, 최대 4px. 들쭉날쭉하거나 찌그러진 귀는 보라로 표시된다. 귀 가장자리도 머리처럼 검은 외곽선이 80% 이상이어야 하고(흰 점, 끊긴 선은 주황), 굵기(눈 사이 거리 대비)가 사용자 그림 귀 선의 80% 이상이어야 한다. 선 맛(필압, 매끈함)은 숫자로 못 잰다: <이름>-ears.png에서 사용자 그림 귀와 나란히 보고 맞춘다.',
          '머리 외곽선 굵기: 같은 자리에 옮긴 사용자 그림 머리 외곽선 굵기의 75% 이상. 얇은 남색 테두리는 실패한다.',
          '이마선 검은 테두리: 이마와 머리가 만나는 곳의 검은 픽셀 비율이 사용자 그림보다 10%p 넘게 많으면 실패한다. 사용자 이마선은 검은 테두리 없이 머리 갈래가 이마로 내려온다.',
          '이마선과 귀의 선 맛(필압, 잔털 갈래, 매끈함)은 숫자로 못 잰다. <이름>-forehead.png, <이름>-ears.png에서 사용자 그림과 나란히 보고 맞춘다.',
          f'머리 가장자리 {OUTLINE_MIN * 100:.0f}% 이상이 2px 넘는 검은 외곽선이어야 한다. 빨간 선에 맞춰 잘라만 내면 가장자리가 파란 머리색이라 여기서 걸린다(비교 그림의 주황).',
          '숫자를 통과해도 비교 그림을 직접 본다. 최종 판단은 사용자가 한다.']
    open(os.path.join(out, 'report.md'), 'w').write('\n'.join(L) + '\n')


def targets():
    g = guide()
    out = os.path.join(GUIDE_DIR, 'targets'); os.makedirs(out, exist_ok=True)
    frames = [('walk-front-0', os.path.join(WALK, 'horus-front-0.png')), ('walk-front-1', os.path.join(WALK, 'horus-front-1.png')),
              ('walk-front-2', os.path.join(WALK, 'horus-front-2.png'))]
    rows = []; tiles = []; full = []
    for name, p in frames:
        rgb, body = load(p)
        e, top, H = eyes(rgb, body)
        target, tf = place(g['sil'], g['eyes'], e, body.shape)
        tblue, _ = place(g['blue'], g['eyes'], e, body.shape)
        thead, _ = place(g['head'], g['eyes'], e, body.shape)
        tears, _ = place(g['ears'], g['eyes'], e, body.shape)
        Image.fromarray((target * 255).astype(np.uint8)).save(os.path.join(out, f'{name}-hair-mask.png'))
        Image.fromarray((thead * 255).astype(np.uint8)).save(os.path.join(out, f'{name}-head-mask.png'))
        Image.fromarray((tblue * 255).astype(np.uint8)).save(os.path.join(out, f'{name}-hair-blue-mask.png'))
        mid = ((e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2)
        rows.append((name, mid, np.hypot(e[1][0] - e[0][0], e[1][1] - e[0][1]), tf, os.path.relpath(p, ROOT)))
        pic = np.ones((*rgb.shape[:2], 3)) * np.array([245, 239, 227]) / 255
        pic[body] = rgb[body]; pic = (pic * 255).astype(np.uint8)
        # the user's drawing itself, moved and scaled onto this frame by the eyes
        user, _ = place((g['rgb'] * 255).astype(np.uint8), g['eyes'], e, body.shape, fill=0)
        user[~place(g['body'], g['eyes'], e, body.shape)[0]] = (245, 239, 227)
        Image.fromarray(user).save(os.path.join(out, f'{name}-user-placed.png'))
        # head crop, enlarged 3×, with a 2 px red line drawn at the enlarged size
        y0, y1 = int(max(0, top - 8)), int(e[0][1] + 0.9 * abs(e[1][0] - e[0][0]))
        xs = np.nonzero(body[y0:y1].any(0))[0]; x0, x1 = int(max(0, xs.min() - 8)), int(min(body.shape[1], xs.max() + 9))
        k = 3
        big = lambda a: np.kron(a[y0:y1, x0:x1], np.ones((k, k), bool)) if a.dtype == bool else np.asarray(Image.fromarray(a[y0:y1, x0:x1]).resize(((x1 - x0) * k, (y1 - y0) * k), Image.NEAREST))
        # the hair (its edge against face and ears too) and the ears' outline; not the jaw, which the user left as it was
        line = grow(edge(big(target)) | (edge(big(thead)) & big(tears)), 1)
        a = big(user).copy(); a[line] = (230, 0, 0)
        b = big(pic).copy(); b[line] = (230, 0, 0)
        tiles.append((Image.fromarray(a), Image.fromarray(b)))
        # the whole adopted frame with the target line, one file a frame, to hand over as is
        whole = np.asarray(Image.fromarray(pic).resize((pic.shape[1] * k, pic.shape[0] * k), Image.NEAREST)).copy()
        kb = lambda m: np.kron(m, np.ones((k, k), bool))
        whole[grow(edge(kb(target)) | (edge(kb(thead)) & kb(tears)), 2)] = (230, 0, 0)
        ys_, xs_ = np.nonzero(body)
        crop = Image.fromarray(whole).crop(((xs_.min() - 10) * k, (ys_.min() - 10) * k, (xs_.max() + 11) * k, (ys_.max() + 11) * k))
        full.append(crop)
        crop.save(os.path.join(out, f'{name}-target.png'))
    ref = [r for r in rows if r[0] == 'walk-front-1'][0]
    tw = max(t[0].width for t in tiles); th = max(t[0].height for t in tiles)
    sheet = Image.new('RGB', (tw * len(tiles), th * 2 + 60), (250, 248, 244))
    d = ImageDraw.Draw(sheet)
    for i, (a, b) in enumerate(tiles):
        sheet.paste(a, (i * tw, 30)); sheet.paste(b, (i * tw, 60 + th))
        d.text((i * tw + 8, 6), rows[i][0] + ' — 위: 네 수정본을 이 프레임 자리에 옮긴 것', fill=(40, 30, 20), font=FONT)
        d.text((i * tw + 8, 36 + th), '아래: 지금 채택 걷기 + 빨간 선(머리가 와야 할 자리)', fill=(40, 30, 20), font=FONT)
    sheet.save(os.path.join(out, 'walk-front-targets.png'))
    # the walk played 0-1-2-1 with the line on, to see it follow the head
    W_ = max(f.width for f in full); H_ = max(f.height for f in full)
    seq = []
    for i in (0, 1, 2, 1):
        fr = Image.new('RGB', (W_, H_), (245, 239, 227)); fr.paste(full[i], (0, 0)); seq.append(fr)
    seq[0].save(os.path.join(out, 'walk-front-target.gif'), save_all=True, append_images=seq[1:], duration=360, loop=0)
    L = ['| 프레임 | 원본 | 두 눈 가운데 (x, y) | 1번 대비 이동 (x, y) | 눈 사이 거리 | 사용자 수정본→프레임 배율 |', '|---|---|---|---|---|---|']
    data = []
    for name, mid, dist, tf, src in rows:
        dx, dy = mid[0] - ref[1][0], mid[1] - ref[1][1]
        L.append(f'| {name} | `{src}` | {mid[0]:.1f}, {mid[1]:.1f} | {dx:+.1f}, {dy:+.1f} | {dist:.1f} | {tf["scale"]} |')
        data.append({'frame': name, 'source': src, 'eyeMid': [round(mid[0], 1), round(mid[1], 1)], 'fromFrame1': [round(dx, 1), round(dy, 1)],
                     'eyeDistance': round(dist, 1), 'guideTransform': tf})
    open(os.path.join(out, 'head-motion.md'), 'w').write('\n'.join(L) + '\n')
    json.dump(data, open(os.path.join(out, 'head-motion.json'), 'w'), ensure_ascii=False, indent=1)
    print('\n'.join(L))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cands', nargs='*')
    ap.add_argument('--out')
    ap.add_argument('--targets', action='store_true')
    o = ap.parse_args()
    if o.targets: targets(); return
    if not o.cands: ap.error('후보 PNG를 주거나 --targets')
    out = o.out or os.path.join(os.path.dirname(o.cands[0]), 'hair-check')
    os.makedirs(out, exist_ok=True)
    res = []
    for p in o.cands:
        r = compare(p)
        draw(r, os.path.join(out, os.path.splitext(os.path.basename(p))[0] + '-hair.png'))
        ear_sheet(r, os.path.join(out, os.path.splitext(os.path.basename(p))[0] + '-ears.png'))
        forehead_sheet(r, os.path.join(out, os.path.splitext(os.path.basename(p))[0] + '-forehead.png'))
        res.append(r)
        print(os.path.basename(p), '→', verdict(r).strip('*'), f"(바깥 2px 안 {r['outer']['within2px'] * 100:.0f}%, 최대 {r['outer']['max']}px · 이마선 2px 안 {r['hairline']['within2px'] * 100:.0f}%, 최대 {r['hairline']['max']}px)")
    report(res, out)
    print('→', os.path.relpath(out))


if __name__ == '__main__':
    main()
