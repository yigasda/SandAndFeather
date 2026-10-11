# Is the head in a new pose the same head as the final idle's? Finds the idle's head in the picture at any size and
# tilt (a lying or bowed head is turned), and lays the idle head's outline over it.
#
#   python3 tools/art/head-check.py <png>... [--who horus] [--view right] [--out <folder>]
#       who and view come from the file name (<who>-<view>-…png); a name without a view (sleep) uses front.
#       Head tilt is searched within ±30°; lying pictures (name with "sleep", or --lying) within ±90°.
#   python3 tools/art/head-check.py --guide --who horus --view right --at 300,260 --angle -70 [--size 1.0] --out <folder>
#       a drawing guide instead: the idle's head, faded with a red outline, placed where the new pose's head goes
#       (at = the head's middle on the 620×720 canvas, angle in degrees, + turns clockwise) — draw the pose's head on it
#
# Report per picture: 머리 크기 (the idle head scaled by this much matches: 100 % = the same size), 기울기, 일치도.
#   머리 작음 under 88 %, 머리 큼 over 112 %. Trust the size only from 일치도 0.35 up; under 0.25 the head was not
#   really found. The main use is the sheet: the idle head's outline laid on the drawing, to see shape and size by eye.
# The sheet <name>-head.png: the picture, then the picture with the idle head's outline (red) where it matched, and the
# head cut out of both at the same size side by side. Red outline that hair or skin spills past = a longer or wider
# head than the idle's (Horus's side head drawn long); outline with nothing under it = a smaller head.
import argparse, json, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FINAL = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'final')
VIEWS = ('front', 'back', 'left', 'right')
try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 18)
except OSError:
    FONT = ImageFont.load_default()
SMALL, LARGE, LOST = 0.88, 1.12, 0.25


def idle_head(who, view):
    """the idle's head: the top 45 % of the figure, as the picture and its alpha"""
    im = Image.open(os.path.join(FINAL, who, 'idle', f'{who}-{view}.png')).convert('RGBA')
    b = im.getbbox()
    return im.crop((b[0], b[1], b[2], b[1] + int(0.45 * (b[3] - b[1]))))


def edges(im):
    bg = Image.new('RGBA', im.size, (128, 128, 128, 255)); bg.alpha_composite(im)
    g = np.asarray(bg.convert('L')).astype(np.float32)
    gx = np.zeros_like(g); gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]; gy[1:-1] = g[2:] - g[:-2]
    return np.hypot(gx, gy)


def ncc(big, t, mask):
    """normalised correlation of template t (only where mask) over big: best score and its top-left"""
    H, W = big.shape; h, w = t.shape
    if h > H or w > W: return None
    m = mask.astype(np.float32); n = m.sum()
    tm = (t - (t * m).sum() / n) * m; tn = np.sqrt((tm ** 2).sum()) + 1e-6
    S = (H + h, W + w)
    fb, fb2 = np.fft.rfft2(big, s=S), np.fft.rfft2(big ** 2, s=S)
    corr = np.fft.irfft2(fb * np.fft.rfft2(tm[::-1, ::-1], s=S), s=S)[h - 1:H, w - 1:W]
    mf = np.fft.rfft2(m[::-1, ::-1], s=S)
    s1 = np.fft.irfft2(fb * mf, s=S)[h - 1:H, w - 1:W]; s2 = np.fft.irfft2(fb2 * mf, s=S)[h - 1:H, w - 1:W]
    var = s2 - s1 ** 2 / n
    # flat, empty places (transparent canvas) have almost no variance and would score past 1: leave them out
    score = np.where(var > 0.05 * var.max(), corr / (tn * np.sqrt(np.maximum(var, 1e-3))), -1)
    y, x = np.unravel_index(np.argmax(score), score.shape)
    return float(score[y, x]), int(x), int(y)


def placed(head, size, angle):
    h = head.resize((max(1, round(head.width * size)), max(1, round(head.height * size))), Image.LANCZOS)
    return h.rotate(-angle, resample=Image.BICUBIC, expand=True)


def search(big, head, k, sizes, angles):
    best = None
    b = big[::k, ::k]
    for s in sizes:
        for a in angles:
            h = placed(head, s, a)
            r = ncc(b, edges(h)[::k, ::k], (np.asarray(h)[..., 3] > 128)[::k, ::k])
            if r and (best is None or r[0] > best[0]): best = (r[0], float(s), float(a), (r[1] * k, r[2] * k))
    return best


def find(cand, who, view, lying=False):
    """best size, angle and place of the idle head in cand: coarse at half size, then fine around it"""
    head = idle_head(who, view)
    big = edges(cand)
    # a bowed or turned head tilts a little; only a lying one turns far (searching every angle finds false heads)
    angles = np.arange(-90, 91, 15) if lying else np.arange(-30, 31, 10)
    _, s0, a0, _ = search(big, head, 2, np.arange(0.70, 1.31, 0.05), angles)
    score, s, a, (x, y) = search(big, head, 1, np.arange(s0 - 0.04, s0 + 0.041, 0.01), np.arange(a0 - 10, a0 + 10.1, 2.5))
    return {'size': round(s, 3), 'angle': round(a, 1), 'match': round(score, 3), 'at': [x, y]}


def outline(mask):
    return mask & ~(np.roll(mask, 1, 0) & np.roll(mask, -1, 0) & np.roll(mask, 1, 1) & np.roll(mask, -1, 1))


def sheet(path, who, view, r, out):
    cand = Image.open(path).convert('RGBA')
    h = placed(idle_head(who, view), r['size'], r['angle'])
    lay = Image.new('RGBA', cand.size, (0, 0, 0, 0)); lay.paste(h, tuple(r['at']), h)
    m = np.asarray(lay)[..., 3] > 128
    over = np.asarray(cand).copy(); o = outline(m)
    for d in (0, 1):
        over[np.roll(o, d, 1)] = (230, 0, 0, 255)
    W, H = cand.size
    s = Image.new('RGB', (W * 2, H + 40), (245, 239, 227)); d = ImageDraw.Draw(s)
    s.paste(cand, (0, 40), cand); ov = Image.fromarray(over, 'RGBA'); s.paste(ov, (W, 40), ov)
    d.text((8, 8), f"{os.path.basename(path)} · 머리 {r['size']:.0%} · 기울기 {r['angle']:+.0f}° · 일치도 {r['match']:.2f} · {r['verdict']}  (빨강 = 정지 머리 윤곽)", fill=(40, 30, 20), font=FONT)
    s.save(os.path.join(out, os.path.splitext(os.path.basename(path))[0] + '-head.png'))


def verdict(r):
    if r['match'] < LOST: return '머리를 못 찾음: 눈으로 볼 것'
    if r['size'] < SMALL: return '머리 작음'
    if r['size'] > LARGE: return '머리 큼'
    return '머리 크기 같음'


def who_view(path, who, view):
    m = re.match(r'(set|somang|horus)-([a-z]+)', os.path.basename(path))
    w = who or (m and m.group(1))
    v = view or (m and m.group(2) in VIEWS and m.group(2)) or 'front'
    return w, v


def guide(who, view, at, angle, size, out):
    h = placed(idle_head(who, view), size, angle)
    a = np.asarray(h).copy()
    m = a[..., 3] > 128
    a[..., 3] = (a[..., 3] * 0.55).astype(np.uint8); a[outline(m)] = (230, 0, 0, 230)
    g = Image.new('RGBA', (620, 720), (0, 0, 0, 0)); hh = Image.fromarray(a, 'RGBA')
    g.paste(hh, (at[0] - hh.width // 2, at[1] - hh.height // 2), hh)
    os.makedirs(out, exist_ok=True)
    p = os.path.join(out, f'{who}-{view}-head-guide-{angle:+.0f}.png'); g.save(p); print('→', p)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('png', nargs='*'); ap.add_argument('--who'); ap.add_argument('--view'); ap.add_argument('--out')
    ap.add_argument('--guide', action='store_true'); ap.add_argument('--at'); ap.add_argument('--angle', type=float, default=0)
    ap.add_argument('--size', type=float, default=1.0)
    ap.add_argument('--lying', action='store_true', help='누운 그림: 머리 기울기를 ±90°까지 찾는다')
    a = ap.parse_args()
    if a.guide:
        guide(a.who, a.view or 'front', [int(v) for v in a.at.split(',')], a.angle, a.size, a.out or '.'); return
    res = []
    for p in a.png:
        w, v = who_view(p, a.who, a.view)
        r = find(Image.open(p).convert('RGBA'), w, v, a.lying or 'sleep' in os.path.basename(p)); r['verdict'] = verdict(r); r['file'] = os.path.basename(p); res.append(r)
        print(f"{r['file']}: 머리 {r['size']:.0%} · 기울기 {r['angle']:+.0f}° · 일치도 {r['match']:.2f} → {r['verdict']}")
        if a.out:
            os.makedirs(a.out, exist_ok=True); sheet(p, w, v, r, a.out)
    if a.out:
        json.dump(res, open(os.path.join(a.out, 'head.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
