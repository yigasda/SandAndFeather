# Checks a candidate sprite against the adopted picture it should match: body proportions, drawing style, colours
# and transparency. Meant to run before a candidate goes to the user, so a changed body (a stick neck, long straight
# legs, small shoes) or a different outline is caught by numbers first.
#
#   python3 tools/art/check-sprite.py --ref REF.png --cand CAND.png [--pose same|walk|free] [--out DIR]
#   python3 tools/art/check-sprite.py --ref-dir REFS --cand-dir CANDS [--pose ...] [--out DIR]
#       pairs files by <who>-<view>; a walk frame <who>-<view>-<0|1|2>.png is checked against <who>-<view>.png
#
# Both pictures are scaled to the same visible height, so every length is a share of that height (%H) and the two
# sizes need not match. --pose says how alike the poses are:
#   same  standing like the reference — every measure is judged
#   walk  a walking frame — legs and hem swing, so their lengths are shown but not judged
#   free  sitting, lying, another action — only head, face, style, colour and transparency are judged
#
# Parts are found by colour: skin by its peach tone, shoes by dark saturated brown, hair by the character's hue
# (from the file name), outline by very dark pixels. Everything else that is opaque counts as clothing.
import argparse, json, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
except OSError:
    FONT = ImageFont.load_default()
KO_WHO = {'set': '세트', 'somang': '소망', 'horus': '호루스'}
KO_VIEW = {'front': '정면', 'back': '뒤', 'left': '왼쪽', 'right': '오른쪽'}


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


def hue_near(h, c, w):
    return np.minimum(abs(h - c), 1 - abs(h - c)) < w


def lab(rgb):
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]).T
    xyz /= np.array([0.9505, 1.0, 1.089])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def who_view(path):
    m = re.match(r'(set|somang|horus)-(front|back|left|right)', os.path.basename(path))
    return (m.group(1), m.group(2)) if m else (None, None)


def parts(im, who):
    a = im[..., 3] > 128
    h, s, v = hsv(im[..., :3] / 255)
    outline = a & (v < 0.13)
    if who == 'set':
        hair = hue_near(h, 0.972, 0.045) & (s > 0.3) & (v < 0.75)
    elif who == 'horus':
        hair = (h > 0.58) & (h < 0.75) & (s > 0.25) & (v < 0.8)
    else:
        hair = hue_near(h, 0.03, 0.05) & (s > 0.2) & (v < 0.72) & (v >= 0.13)
    skin = hue_near(h, 0.06, 0.06) & (s > 0.1) & (s < 0.5) & (v > 0.72) & a
    shoe = hue_near(h, 0.045, 0.035) & (s > 0.45) & (v >= 0.13) & (v < 0.5) & a
    ys = np.nonzero(a.any(1))[0]
    top, bottom = int(ys.min()), int(ys.max())
    H = bottom - top + 1
    rows = np.arange(im.shape[0])[:, None]
    # Somang's hair and sandals share a brown, and her hair never reaches the sandals
    hair &= a & ((rows < top + 0.86 * H) if who not in ('set', 'horus') else True)
    shoe &= rows > top + 0.7 * H
    cloth = a & ~outline & ~hair & ~skin & ~shoe
    return dict(a=a, outline=outline, hair=hair, skin=skin, shoe=shoe, cloth=cloth, top=top, bottom=bottom, H=H)


def largest(mask):
    # the biggest 4-connected blob, by repeated dilation from each seed (pictures are small)
    lab_ = np.zeros(mask.shape, int); n = 0; best, size = 0, 0
    for y, x in zip(*np.nonzero(mask)):
        if lab_[y, x]: continue
        n += 1; cur = np.zeros_like(mask); cur[y, x] = True
        while True:
            g = cur.copy()
            g[1:] |= cur[:-1]; g[:-1] |= cur[1:]; g[:, 1:] |= cur[:, :-1]; g[:, :-1] |= cur[:, 1:]
            g &= mask
            if g.sum() == cur.sum(): break
            cur = g
        lab_[cur] = n
        if cur.sum() > size: best, size = n, cur.sum()
    return lab_ == best if best else np.zeros_like(mask)


def blobs(mask):
    # 4-connected components as (ys, xs) arrays; for small masks only
    from collections import deque
    seen = np.zeros_like(mask); H, W = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]: continue
        q = deque([(y, x)]); seen[y, x] = True; pts = []
        while q:
            cy, cx = q.popleft(); pts.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        yy, xx = zip(*pts)
        yield np.array(yy), np.array(xx)


def reach_border(free):
    # transparent pixels reachable from the picture edge; the rest of the transparent pixels are holes in the body
    out = np.zeros_like(free)
    out[0] = free[0]; out[-1] = free[-1]; out[:, 0] = free[:, 0]; out[:, -1] = free[:, -1]
    while True:
        g = out.copy()
        g[1:] |= out[:-1]; g[:-1] |= out[1:]; g[:, 1:] |= out[:, :-1]; g[:, :-1] |= out[:, 1:]
        g &= free
        if g.sum() == out.sum(): return out
        out = g


def runs(seq):
    # lengths of runs of equal (±6 per channel) colour along one row
    if len(seq) < 2: return []
    same = (abs(np.diff(seq.astype(int), axis=0)).max(-1) <= 6)
    out, n = [], 1
    for s in same:
        if s: n += 1
        else: out.append(n); n = 1
    out.append(n)
    return out


def outline_width(p):
    # how many dark pixels the silhouette edge has, counted inward from the left and right edge of each row
    o, a = p['outline'], p['a']; ws = []
    for y in range(p['top'], p['bottom'] + 1):
        xs = np.nonzero(a[y])[0]
        if len(xs) < 6: continue
        for x0, step in ((xs.min(), 1), (xs.max(), -1)):
            n, x = 0, x0
            while 0 <= x < a.shape[1] and o[y, x]: n += 1; x += step
            # a long dark run is dark fill (a black skirt, hair shadow), not the outline
            if n and n <= 0.03 * p['H']: ws.append(n)
    return float(np.median(ws)) if ws else 0.0


def band_frac(mask, y, x0, x1, a):
    seg = a[y, x0:x1]
    return mask[y, x0:x1].sum() / max(seg.sum(), 1)


def measure(path, who, view):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    p = parts(im, who)
    a, skin, top, bottom, H = p['a'], p['skin'], p['top'], p['bottom'], p['H']
    r = {'path': path, 'size': list(im.shape[1::-1]), 'top': top, 'bottom': bottom, 'H': H}
    xs = np.nonzero(a.any(0))[0]
    r['cx'] = round(float(xs.mean()), 1)
    marks = {'top': top, 'bottom': bottom}
    rows = np.arange(im.shape[0])[:, None]
    # face: the biggest skin blob in the head part; its widest row is the cheek line
    if view != 'back':
        face = largest(skin & (rows < top + 0.62 * H))
        if face.sum() > 60:
            fy, fx = np.nonzero(face)
            widths = face.sum(1)
            cheek = int(np.argmax(widths))
            fcx = float(fx[fy == cheek].mean())
            fw = int(widths[cheek])
            r['face'] = {'width': fw, 'cx': round(fcx, 1), 'cheekY': cheek}
            # chin: going down from the cheeks, the face skin narrows to the chin; the first row that stays under a third of the face width
            # is the chin. Below the line under the chin, a narrow column of skin (under a fifth of the face width) is
            # the neck; a wider patch is the neckline of the clothes and does not count.
            fl, fr = int(fx[fy == cheek].min()), int(fx[fy == cheek].max())
            w = lambda y: int(skin[y, fl:fr + 1].sum())
            # (eyes and brows also cut the skin row, but only for a few rows; the chin stays cut)
            y = cheek; hold = max(3, int(0.012 * H))
            while y < bottom and not all(w(y + i) < 0.3 * fw for i in range(hold)): y += 1
            chin = y
            # the rest of the chin's curve and the line under it
            lim = y + max(4, 0.02 * H)
            while y < min(bottom, lim) and not (0.08 * fw <= w(y) < 0.2 * fw): y += 1
            n0 = y; nw = []
            while y < bottom and 0.08 * fw <= w(y) < 0.2 * fw: nw.append(w(y)); y += 1
            if not nw: y = n0
            r['chin'] = chin; r['neck'] = len(nw); r['neckWidth'] = int(np.median(nw)) if nw else 0
            marks['chin'] = chin
            if nw: marks['neck'] = y
    # hair spread
    if p['hair'].any():
        hy, hx = np.nonzero(p['hair'])
        r['hairWidth'] = int(hx.max() - hx.min() + 1); r['hairLowest'] = int(hy.max())
    # shoes and legs, walking up from the sole. Only the columns over the feet count, so hands beside a skirt do not
    # pass for legs. Each row is shoe (the brown leads), leg (skin leads) or clothing. A strapped sandal shows skin
    # between straps, so a short run of skin between shoe rows still belongs to the shoe.
    cnt = (p['shoe'] & ~p['hair']).sum(1)
    low = np.arange(len(cnt)) > top + 0.7 * H
    soles = np.nonzero(low & (cnt >= max(2, 0.5 * cnt[low].max())))[0] if cnt[low].any() else np.array([], int)
    shoe_top = hem = bottom; leg_rows = []
    if len(soles) and soles.max() >= bottom - 0.05 * H:
        sm = p['shoe'][int(soles.min()):bottom + 1]
        cols = np.nonzero(sm.any(0))[0]
        x0, x1 = int(cols.min()), int(cols.max()) + 1
        def kind(y):
            sh, sk, cl = p['shoe'][y, x0:x1].sum(), skin[y, x0:x1].sum(), p['cloth'][y, x0:x1].sum()
            if sh >= max(sk, cl, 2): return 'S'
            if sk >= 2 and sk >= 0.6 * cl: return 'K'
            if sh + sk + cl == 0: return 'O'  # outline only
            return 'C'
        kinds = {y: kind(y) for y in range(int(top + 0.55 * H), bottom + 1)}
        gap = 0.03 * H
        y = int(soles.max()); shoe_top = y; run = 0
        while y > top + 0.55 * H:
            k = kinds[y]
            if k == 'S': shoe_top = y; run = 0
            elif k in 'KO': run += 1
            else: break
            if run > gap: break
            y -= 1
        y = shoe_top - 1
        # the shoe's top edge can read as clothing for a row or two
        t = 0
        while y > top + 0.55 * H and kinds[y] not in 'KO' and t < max(3, 0.01 * H): y -= 1; t += 1
        if kinds.get(y) not in ('K', 'O'): y = shoe_top - 1
        while y > top + 0.55 * H and kinds[y] in 'KO':
            if kinds[y] == 'K': leg_rows.append(y)
            y -= 1
        hem = y
        sh = p['shoe'][shoe_top:bottom + 1, x0:x1]
        scols = np.nonzero(sh.any(0))[0] + x0
        r['shoeH'] = bottom - shoe_top + 1
        r['shoeW'] = int(scols.max() - scols.min() + 1)
        # each shoe's own width: the brown columns split where they part
        r['shoeEach'] = int(np.median([len(g) for g in np.split(scols, np.nonzero(np.diff(scols) > 3)[0] + 1)]))
        marks['shoe'] = shoe_top
    r['hem'] = int(hem); marks['hem'] = int(hem)
    r['leg'] = len(leg_rows)
    if leg_rows:
        w = [skin[y].sum() for y in leg_rows]
        segs = [len(np.split(np.nonzero(skin[y])[0], np.nonzero(np.diff(np.nonzero(skin[y])[0]) > 2)[0] + 1)) for y in leg_rows]
        r['legWidth'] = round(float(np.median(w)) / max(1, np.median(segs)), 1)
    # skirt: its width just above the hem, by outline rather than colour (a white kilt reads close to skin)
    band = range(max(top, int(hem - 0.06 * H)), hem + 1)
    ws = []
    cx = int(round(r['cx']))
    for y in band:
        # the opaque run that holds the body's middle; hair beside it is not skirt
        row = a[y] & ~p['hair'][y]
        if not row[cx]: continue
        l = cx; rr = cx
        while l > 0 and row[l - 1]: l -= 1
        while rr < len(row) - 1 and row[rr + 1]: rr += 1
        ws.append(rr - l + 1)
    if ws: r['skirtWidth'] = int(max(ws))
    # style
    r['outlineW'] = outline_width(p)
    cols = {}
    for k in ('hair', 'skin', 'cloth', 'shoe'):
        m = p[k] & (im[..., 3] > 250)
        # a part that barely shows (clothes seen from behind long hair) has no colour worth comparing
        if m.sum() > max(30, 0.03 * a.sum()): cols[k] = np.median(im[..., :3][m], 0).tolist()
    edge = p['a'] & ~(np.roll(p['a'], 1, 0) & np.roll(p['a'], -1, 0) & np.roll(p['a'], 1, 1) & np.roll(p['a'], -1, 1))
    m = edge & p['outline']
    if m.sum() > 30: cols['outline'] = np.median(im[..., :3][m], 0).tolist()
    r['colours'] = {k: [round(c) for c in v] for k, v in cols.items()}
    # transparency
    alpha = im[..., 3]
    inner = p['a'] & np.roll(p['a'], 2, 0) & np.roll(p['a'], -2, 0) & np.roll(p['a'], 2, 1) & np.roll(p['a'], -2, 1)
    r['semiInside'] = int(((alpha < 250) & inner).sum())
    # an enclosed transparent area is fine between an arm and the body, or behind a loose lock of hair: the artist
    # drew a dark line round it. A thin gap whose sides are plain fill colour is a seam left by compositing.
    enclosed = (alpha < 128) & ~reach_border(alpha < 128)
    dark = hsv(im[..., :3] / 255)[2] < 0.3
    holes = np.zeros_like(enclosed); r['holes'] = 0; r['seams'] = []
    for comp in blobs(enclosed):
        ys, xs = comp
        thick = len(ys) / max(ys.max() - ys.min() + 1, xs.max() - xs.min() + 1)
        if thick >= 3 or len(ys) < 4: continue
        m = np.zeros_like(enclosed); m[ys, xs] = True
        rim = (np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)) & ~m & p['a']
        if rim.any() and dark[rim].mean() >= 0.5: continue
        holes |= m; r['holes'] += len(ys)
        r['seams'].append([int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())])
    light_edge = edge & (hsv(im[..., :3] / 255)[2] > 0.9) & (hsv(im[..., :3] / 255)[1] < 0.12)
    r['lightEdge'] = round(float(light_edge.sum() / max(edge.sum(), 1)), 3)
    r['marks'] = marks
    return r, im, p, holes


# what each measure means, how to show it, the allowed gap, and the poses it is judged in
CHECKS = [
    ('headH', '머리 높이 (위끝→턱)', 'pct', 4.0, 'same walk free'),
    ('faceW', '얼굴 폭', 'pct', 3.0, 'same walk free'),
    ('hairW', '머리카락 폭', 'pct', 6.0, 'same walk free'),
    ('neck', '보이는 목 길이', 'pct', 0.8, 'same walk'),
    ('neckW', '목 폭', 'pct', 2.0, 'same walk'),
    ('hemY', '치맛단 높이 (위끝→치맛단)', 'pct', 3.0, 'same'),
    ('leg', '치마 아래 다리 길이', 'pct', 2.0, 'same'),
    ('legW', '다리 한 쪽 폭', 'pct', 1.2, 'same'),
    ('shoeH', '신발 높이', 'pct', 1.5, 'same'),
    ('shoeEach', '신발 한 짝 폭', 'pct', 2.5, 'same'),
    ('skirtW', '치맛단 폭 (옆에 붙은 손도 같이 잰다)', 'pct', 8.0, 'same'),
    ('outlineW', '바깥 외곽선 두께', 'pct', 0.6, 'same walk free'),
]


def derive(r):
    H = r['H']; d = {}
    if 'chin' in r:
        d['headH'] = (r['chin'] - r['top']) / H
        d['neck'] = r['neck'] / H
        if r['neck'] >= 0.008 * H: d['neckW'] = r['neckWidth'] / H  # too short a neck has no width worth comparing
    if 'face' in r: d['faceW'] = r['face']['width'] / H
    if 'hairWidth' in r: d['hairW'] = r['hairWidth'] / H
    d['hemY'] = (r['hem'] - r['top']) / H
    d['leg'] = r['leg'] / H
    if 'legWidth' in r: d['legW'] = r['legWidth'] / H
    if 'shoeH' in r: d['shoeH'] = r['shoeH'] / H; d['shoeEach'] = r['shoeEach'] / H
    if 'skirtWidth' in r: d['skirtW'] = r['skirtWidth'] / H
    d['outlineW'] = r['outlineW'] / H
    return d


def fmt(kind, v):
    if v is None: return '–'
    return f'{v * 100:.1f}%H' if kind == 'pct' else f'{v:.0f}' if kind == 'rel' else f'{v:.2f}'


def compare(R, C, pose):
    dr, dc = derive(R), derive(C)
    rows, bad = [], []
    for key, name, kind, tol, poses in CHECKS:
        a, b = dr.get(key), dc.get(key)
        judged = pose in poses.split()
        if a is None or b is None:
            rows.append((name, fmt(kind, a), fmt(kind, b), '–', '측정 안 됨' if judged else '판정 안 함')); continue
        diff = (b - a) / a if kind == 'rel' else b - a
        over = abs(diff * 100 if kind == 'pct' else diff) > tol
        shown = f'{diff * 100:+.0f}%' if kind == 'rel' else f'{diff * 100:+.1f}%H' if kind == 'pct' else f'{diff:+.2f}'
        verdict = ('**다름**' if over else '같은 범위') if judged else '판정 안 함 (자세가 다름)'
        rows.append((name, fmt(kind, a), fmt(kind, b), shown, verdict))
        if judged and over: bad.append(name)
    # colours by part, as CIE76 ΔE
    for k, name in (('hair', '머리카락'), ('skin', '피부'), ('cloth', '옷'), ('shoe', '신발'), ('outline', '외곽선')):
        a, b = R['colours'].get(k), C['colours'].get(k)
        if a is None or b is None: continue
        de = float(np.linalg.norm(lab(np.array(a, float)) - lab(np.array(b, float))))
        over = de > 12
        rows.append((f'{name} 색', f'rgb{tuple(a)}', f'rgb{tuple(b)}', f'ΔE {de:.0f}', '**다름**' if over else '같은 범위'))
        if over: bad.append(f'{name} 색')
    # transparency is judged on the candidate alone
    if C['holes'] > 20:
        where = ', '.join(f'({a},{b})-({c},{d})' for a, b, c, d in C['seams'][:6])
        rows.append(('합성 틈 (몸 안 가는 투명 줄)', f'{R["holes"]}px', f'{C["holes"]}px', where, '**있음**')); bad.append('합성 틈')
    else:
        rows.append(('합성 틈 (몸 안 가는 투명 줄)', f'{R["holes"]}px', f'{C["holes"]}px', '', '없음'))
    semi = C['semiInside'] / max(C['H'] ** 2 * 0.4, 1)
    rows.append(('몸 안 반투명 픽셀', f'{R["semiInside"]}px', f'{C["semiInside"]}px', '', '**많음**' if semi > 0.01 else '정상'))
    if semi > 0.01: bad.append('반투명 픽셀')
    rows.append(('가장자리 흰 픽셀 비율', f'{R["lightEdge"] * 100:.1f}%', f'{C["lightEdge"] * 100:.1f}%', '',
                  '**후광 의심**' if C['lightEdge'] > R['lightEdge'] + 0.05 else '정상'))
    if C['lightEdge'] > R['lightEdge'] + 0.05: bad.append('흰 후광')
    return rows, bad


def scaled(im, r, H):
    k = H / r['H']
    pic = Image.fromarray(im.astype(np.uint8), 'RGBA')
    pic = pic.resize((max(1, round(pic.width * k)), max(1, round(pic.height * k))), Image.NEAREST)
    return pic, k


MARK = {'top': ((0, 110, 230), '위끝'), 'chin': ((0, 160, 80), '턱'), 'neck': ((230, 120, 0), '목 끝'),
        'hem': ((200, 0, 160), '치맛단'), 'shoe': ((140, 70, 20), '신발 위'), 'bottom': ((0, 110, 230), '발끝')}


def sheet(R, Ri, Rp, C, Ci, Cp, Ch, title, path):
    # left to right: reference and candidate at one height with the measured lines (light background), the same on
    # dark, the reference silhouette laid over the candidate, then neck and legs enlarged
    T = 520
    rp, rk = scaled(Ri, R, T); cp, ck = scaled(Ci, C, T)
    def crop(pic, r, k):
        cx = r['cx'] * k; y0 = r['top'] * k
        return pic.crop((int(cx - 260), int(y0 - 20), int(cx + 260), int(y0 + T + 20))), (cx - 260, y0 - 20)
    rc, ro = crop(rp, R, rk); cc, co = crop(cp, C, ck)
    W, Hh = 520, T + 40
    cv = Image.new('RGBA', (W * 5, Hh + 60), (250, 248, 244, 255))
    d = ImageDraw.Draw(cv)
    d.text((8, 4), title, fill=(40, 30, 20, 255), font=FONT)
    heads = ['기준', '후보', '기준 · 후보 (어두운 바탕)', '후보 위에 기준 윤곽(빨강)', '목·다리 2배']
    for i, t in enumerate(heads): d.text((i * W + 8, 26), t, fill=(90, 70, 50, 255), font=FONT)
    y0 = 50
    for i, (pic, r, k, o) in enumerate(((rc, R, rk, ro), (cc, C, ck, co))):
        cv.alpha_composite(pic, (i * W, y0))
        for key, yy in r['marks'].items():
            col, name = MARK[key]; y = y0 + yy * k - o[1]
            d.line([(i * W, y), (i * W + W - 1, y)], fill=(*col, 200))
            d.text((i * W + W - 70, y - 16), name, fill=(*col, 255), font=FONT)
    dark = Image.new('RGBA', (W, Hh), (34, 30, 40, 255))
    half = lambda p: p.resize((W // 2, Hh // 2 * 2 // 2 * 1), Image.NEAREST) if False else p.resize((W // 2, Hh // 2), Image.NEAREST)
    dark.alpha_composite(half(rc), (0, Hh // 4)); dark.alpha_composite(half(cc), (W // 2, Hh // 4))
    cv.alpha_composite(dark, (2 * W, y0))
    ov = cc.copy()
    ra = np.asarray(rc)[..., 3] > 128
    e = ra & ~(np.roll(ra, 1, 0) & np.roll(ra, -1, 0) & np.roll(ra, 1, 1) & np.roll(ra, -1, 1))
    e |= np.roll(e, 1, 1)
    # align the two at the feet: both crops start 20 px above the top at the same height, so they already line up
    lay = np.zeros((*e.shape, 4), np.uint8); lay[e] = (230, 20, 20, 255)
    base = Image.new('RGBA', ov.size, (250, 248, 244, 255)); base.alpha_composite(ov)
    base.alpha_composite(Image.fromarray(lay, 'RGBA'))
    cv.alpha_composite(base, (3 * W, y0))
    # neck (top two) and legs (bottom two), reference then candidate, each enlarged twice
    th = Hh // 4
    for j, (part_of, rk_) in enumerate((('neck', 0), ('neck', 1), ('legs', 0), ('legs', 1))):
        pic, r, k, o = ((rc, R, rk, ro), (cc, C, ck, co))[rk_]
        if part_of == 'neck':
            mid = r.get('chin', r['top'] + 0.6 * r['H']) * k - o[1]
        else:
            mid = ((r['hem'] + r['bottom']) / 2) * k - o[1]
        part = pic.crop((W // 4, int(mid - th / 4), W * 3 // 4, int(mid + th / 4))).resize((W, th), Image.NEAREST)
        bg = Image.new('RGBA', part.size, (250, 248, 244, 255)); bg.alpha_composite(part)
        cv.alpha_composite(bg, (4 * W, y0 + j * th))
        ImageDraw.Draw(cv).text((4 * W + 6, y0 + j * th + 2), ('기준 ' if rk_ == 0 else '후보 ') + ('목' if part_of == 'neck' else '다리·신발'), fill=(200, 0, 120, 255), font=FONT)
    if Ch.any():
        hy, hx = np.nonzero(Ch)
        d.text((W + 8, Hh + 30), f'합성 틈 {len(hy)}px', fill=(200, 0, 0, 255), font=FONT)
    cv.convert('RGB').save(path)


def check(ref, cand, pose, out):
    who, view = who_view(cand)
    if who is None: who, view = who_view(ref)
    R, Ri, Rp, _ = measure(ref, who, view)
    C, Ci, Cp, Ch = measure(cand, who, view)
    rows, bad = compare(R, C, pose)
    name = os.path.splitext(os.path.basename(cand))[0]
    title = f'{KO_WHO.get(who, who)} {KO_VIEW.get(view, view)} — {name} · 자세 {pose} · 기준 {os.path.relpath(ref)}'
    sheet(R, Ri, Rp, C, Ci, Cp, Ch, title, os.path.join(out, f'{name}-check.png'))
    return {'name': name, 'ref': os.path.relpath(ref), 'cand': os.path.relpath(cand), 'pose': pose,
            'rows': rows, 'bad': bad, 'ref_raw': R, 'cand_raw': C}


def pairs(ref_dir, cand_dir):
    refs = {}
    for f in sorted(os.listdir(ref_dir)):
        w, v = who_view(f)
        if w and f.endswith('.png'): refs.setdefault((w, v), os.path.join(ref_dir, f))
    for f in sorted(os.listdir(cand_dir)):
        w, v = who_view(f)
        if w and f.endswith('.png') and (w, v) in refs:
            yield refs[(w, v)], os.path.join(cand_dir, f), bool(re.search(r'-[0-2]\.png$', f))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ref'); ap.add_argument('--cand')
    ap.add_argument('--ref-dir'); ap.add_argument('--cand-dir')
    ap.add_argument('--pose', choices=['same', 'walk', 'free'])
    ap.add_argument('--out')
    o = ap.parse_args()
    if o.ref and o.cand:
        jobs = [(o.ref, o.cand, False)]
        out = o.out or os.path.join(os.path.dirname(o.cand), 'sprite-check')
    elif o.ref_dir and o.cand_dir:
        jobs = list(pairs(o.ref_dir, o.cand_dir))
        out = o.out or os.path.join(o.cand_dir, 'sprite-check')
    else:
        ap.error('--ref 와 --cand, 또는 --ref-dir 와 --cand-dir')
    os.makedirs(out, exist_ok=True)
    res = [check(r, c, o.pose or ('walk' if walk else 'same'), out) for r, c, walk in jobs]
    lines = ['# 스프라이트 검사', '',
             '`tools/art/check-sprite.py`가 만든 결과. 두 그림을 같은 키로 맞춘 뒤 비교했다. %H는 그림 키에 대한 비율이다.', '',
             '| 파일 | 자세 | 결과 |', '|---|---|---|']
    for r in res:
        lines.append(f'| [{r["name"]}]({r["name"]}-check.png) | {r["pose"]} | ' +
                     ('기준과 같은 범위' if not r['bad'] else '**다름: ' + ', '.join(r['bad']) + '**') + ' |')
    for r in res:
        lines += ['', f'## {r["name"]}', '', f'기준 `{r["ref"]}` · 후보 `{r["cand"]}` · 자세 {r["pose"]}', '',
                  '| 항목 | 기준 | 후보 | 차이 | 판정 |', '|---|---|---|---|---|']
        lines += [f'| {" | ".join(x)} |' for x in r['rows']]
    lines += ['', '숫자는 큰 실수를 잡는 그물이다. 통과해도 비교 그림을 눈으로 보고, 최종 판단은 사용자가 한다.']
    open(os.path.join(out, 'report.md'), 'w').write('\n'.join(lines) + '\n')
    json.dump([{k: v for k, v in r.items()} for r in res], open(os.path.join(out, 'report.json'), 'w'),
              ensure_ascii=False, indent=1, default=lambda x: x.tolist() if hasattr(x, 'tolist') else str(x))
    for r in res:
        print(r['name'], '→', '같은 범위' if not r['bad'] else '다름: ' + ', '.join(r['bad']))
    print('→', os.path.relpath(out))


if __name__ == '__main__':
    main()
