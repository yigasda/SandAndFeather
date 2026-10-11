# Fits a new pose to the final standing sprite: same scale, head in the same place. New action poses (reaching,
# taking, pressing...) come out of image generation at a different size per character and per sheet; this finds,
# for each character, the scale and position at which the new picture's head lies on the final idle's head, and
# redraws it onto the idle canvas (620×720, feet pivot 310,662, reference height 576). Arms and legs move with the
# pose, so the head is the anchor; the feet are only reported.
#
#   python3 tools/art/fit-scale.py SHEET.png [--who set,somang,horus] [--view front] [--out DIR]
#       a sheet with the three characters side by side (left to right in --who order), or one character
#   → DIR/<who>-<view>.png (fitted, transparent), DIR/fit-sheet.png (idle | fitted | idle outline over fitted),
#     DIR/fit.gif (idle ↔ fitted, to see nothing jump), DIR/fit.json (scale, shift, feet offset per character)
import argparse, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FINAL = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'final')
CANVAS, PIVOT = (620, 720), (310, 662)
TOL = 12  # feet within this many idle-canvas px (about 2% of the height) count as the same body
try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
except OSError:
    FONT = ImageFont.load_default()


def idle(who, view):
    return Image.open(os.path.join(FINAL, who, 'idle', f'{who}-{view}.png')).convert('RGBA')


def split(sheet, n):
    # the characters on a sheet: the n biggest separate opaque shapes (found on a quarter-size alpha, so a strand
    # of hair over a neighbour's column does not join them), left to right
    from collections import deque
    k = 4
    small = np.asarray(sheet.resize((sheet.width // k, sheet.height // k)))[..., 3] > 16
    lab = np.zeros(small.shape, int); n_ = 0; sizes = {}
    for y, x in zip(*np.nonzero(small)):
        if lab[y, x]: continue
        n_ += 1; q = deque([(y, x)]); lab[y, x] = n_; cnt = 0
        while q:
            cy, cx = q.popleft(); cnt += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < small.shape[0] and 0 <= nx < small.shape[1] and small[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = n_; q.append((ny, nx))
        sizes[n_] = cnt
    keep = sorted(sorted(sizes, key=sizes.get, reverse=True)[:n], key=lambda i: np.nonzero(lab == i)[1].mean())
    alpha = np.asarray(sheet)[..., 3]
    out = []
    for i in keep:
        # this character's pixels only: its blob (back at full size, grown a little) masks the sheet
        m = np.kron(lab == i, np.ones((k, k), bool))
        m = np.pad(m, ((0, sheet.height - m.shape[0]), (0, sheet.width - m.shape[1])))
        g = m.copy()
        for _ in range(k): g[1:] |= g[:-1]; g[:-1] |= g[1:]; g[:, 1:] |= g[:, :-1]; g[:, :-1] |= g[:, 1:]
        arr = np.asarray(sheet).copy(); arr[~g, 3] = 0
        part = Image.fromarray(arr, 'RGBA'); out.append(part.crop(part.getbbox()))
    return out


def edges(img):
    # a grey edge picture on a mid grey ground: matches line work, not colour or exact shading
    bg = Image.new('RGBA', img.size, (128, 128, 128, 255)); bg.alpha_composite(img)
    g = np.asarray(bg.convert('L')).astype(np.float32)
    gx = np.zeros_like(g); gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]; gy[1:-1] = g[2:] - g[:-2]
    return np.hypot(gx, gy)


def ncc_best(big, tmpl):
    # normalized cross-correlation of tmpl over big (FFT), best position and score
    H, W = big.shape; h, w = tmpl.shape
    if h > H or w > W: return None
    t = tmpl - tmpl.mean(); tn = np.sqrt((t ** 2).sum()) + 1e-6
    F = np.fft.rfft2(big, s=(H + h, W + w)); T = np.fft.rfft2(t[::-1, ::-1], s=(H + h, W + w))
    corr = np.fft.irfft2(F * T, s=(H + h, W + w))[h - 1:H, w - 1:W]
    # local energy of big under the window, for normalising
    c1 = np.cumsum(np.cumsum(np.pad(big, ((1, 0), (1, 0))), 0), 1)
    c2 = np.cumsum(np.cumsum(np.pad(big ** 2, ((1, 0), (1, 0))), 0), 1)
    s1 = c1[h:, w:] - c1[:-h, w:] - c1[h:, :-w] + c1[:-h, :-w]
    s2 = c2[h:, w:] - c2[:-h, w:] - c2[h:, :-w] + c2[:-h, :-w]
    var = np.maximum(s2 - s1 ** 2 / (h * w), 1e-6)
    score = corr / (tn * np.sqrt(var))
    y, x = np.unravel_index(np.argmax(score), score.shape)
    return float(score[y, x]), int(x), int(y)


def fit(cand, ref):
    # the scale at which the candidate's head matches the idle's head, found coarse to fine
    rb = ref.getbbox(); rh = rb[3] - rb[1]
    head_box = (rb[0], rb[1], rb[2], rb[1] + int(0.45 * rh))
    tmpl_full = edges(ref).astype(np.float32)[head_box[1]:head_box[3], head_box[0]:head_box[2]]
    s0 = None
    for step, span, inc in ((4, None, 0.04), (2, 0.04, 0.01), (1, 0.01, 0.0025)):
        scales = np.arange(0.4, 2.6, inc) if s0 is None else np.arange(s0 - span, s0 + span + inc / 2, inc)
        tm = tmpl_full[::step, ::step]
        best = None
        for sc in scales:
            c = cand.resize((max(1, round(cand.width * sc)), max(1, round(cand.height * sc))), Image.LANCZOS)
            r = ncc_best(edges(c)[::step, ::step], tm)
            if r and (best is None or r[0] > best[0]): best = (r[0], float(sc), (r[1] * step, r[2] * step), step)
        s0 = best[1]
    score, s, (mx, my), _ = best
    # place: the matched head lands on the idle's head
    c = cand.resize((round(cand.width * s), round(cand.height * s)), Image.LANCZOS)
    out = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    ox, oy = head_box[0] - mx, head_box[1] - my
    out.alpha_composite(c, (ox, oy)) if ox >= 0 and oy >= 0 else out.paste(c, (ox, oy), c)
    ob = out.getbbox()
    info = {'scale': round(s, 4), 'match': round(score, 3), 'shift': [ox, oy],
            'feetOffsetPx': (ob[3] - 1 - PIVOT[1]) if ob else None,
            'heightRatio': round((ob[3] - ob[1]) / rh, 3) if ob else None}
    # the other way: whole height to the idle's height, feet on the pivot, sideways by the head
    cb = cand.getbbox(); sh = rh / (cb[3] - cb[1])
    c2 = cand.resize((round(cand.width * sh), round(cand.height * sh)), Image.LANCZOS)
    # (padded, so a picture smaller than the idle's head still has room to be searched)
    ph, pw = tmpl_full.shape
    padded = Image.new('RGBA', (c2.width + 2 * pw, c2.height + 2 * ph), (0, 0, 0, 0)); padded.paste(c2, (pw, ph))
    r = ncc_best(edges(padded), tmpl_full)
    out2 = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    b2 = c2.getbbox()
    ox2 = head_box[0] - (r[1] - pw); oy2 = PIVOT[1] + 1 - b2[3]
    r = (r[0], r[1] - pw, r[2] - ph)
    out2.paste(c2, (ox2, oy2), c2)
    info['heightFit'] = {'scale': round(sh, 4), 'headScaleVsIdle': round(sh / s, 3), 'shift': [ox2, oy2],
                         'headTopOffsetPx': (head_box[1] - r[2]) - oy2}
    # how far the pose's head-to-body proportion is from the idle's: the body below the head, head matched
    # verdict: a few pixels off at the feet is scale noise and the feet are set on the pivot; more than that is the
    # pose drawn with a longer or shorter body than the idle, which scaling cannot fix
    off = info['feetOffsetPx']
    if off is not None and abs(off) <= TOL:
        snapped = Image.new('RGBA', CANVAS, (0, 0, 0, 0)); snapped.paste(out, (0, -off), out)
        out = snapped; info['verdict'] = f'맞음 (발 {off:+d}px 보정)'
    else:
        info['verdict'] = f'비율 다름: 머리를 맞추면 발이 {off:+d}px ({off / rh * 100:+.1f}% 키). 몸 길이를 정지에 맞춰 다시 그려야 함'
    return out, out2, info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet')
    ap.add_argument('--who', default='set,somang,horus')
    ap.add_argument('--view', default='front')
    ap.add_argument('--out')
    o = ap.parse_args()
    who = o.who.split(',')
    sheet = Image.open(o.sheet).convert('RGBA')
    parts = split(sheet, len(who)) if len(who) > 1 else [sheet.crop(sheet.getbbox())]
    out = o.out or os.path.join(os.path.dirname(o.sheet), 'fit-' + os.path.splitext(os.path.basename(o.sheet))[0])
    os.makedirs(out, exist_ok=True)
    report, tiles, frames = {}, [], []
    for w, part in zip(who, parts):
        ref = idle(w, o.view)
        fitted, fitted_h, info = fit(part, ref)
        fitted.save(os.path.join(out, f'{w}-{o.view}.png'))
        fitted_h.save(os.path.join(out, f'{w}-{o.view}-height.png'))
        report[w] = info
        print(w, info)
        # sheet tiles: idle, fitted, the idle's outline over the fitted pose
        a = np.asarray(ref)[..., 3] > 128
        e = a & ~(np.roll(a, 1, 0) & np.roll(a, -1, 0) & np.roll(a, 1, 1) & np.roll(a, -1, 1))
        lay = np.zeros((*a.shape, 4), np.uint8); lay[e] = (230, 0, 0, 255)
        bg = lambda: Image.new('RGBA', CANVAS, (245, 239, 227, 255))
        t1 = bg(); t1.alpha_composite(ref)
        t2 = bg(); t2.alpha_composite(fitted)
        t3 = bg(); t3.alpha_composite(fitted); t3.alpha_composite(Image.fromarray(lay, 'RGBA'))
        t4 = bg(); t4.alpha_composite(fitted_h); t4.alpha_composite(Image.fromarray(lay, 'RGBA'))
        for t in (t1, t2, t3, t4):
            ImageDraw.Draw(t).line([(0, PIVOT[1]), (CANVAS[0], PIVOT[1])], fill=(0, 110, 230, 255))
        tiles.append((w, info, [t1, t3, t4]))
        frames.append((t1, t2))
    tw, th = CANVAS[0] // 2, CANVAS[1] // 2
    sheet_img = Image.new('RGB', (tw * 3, (th + 24) * len(tiles)), (250, 248, 244))
    d = ImageDraw.Draw(sheet_img)
    for r, (w, info, ts) in enumerate(tiles):
        y = r * (th + 24)
        d.text((6, y + 4), f"{w} — {info['verdict']} · 정지 | 머리 맞춤 ×{info['scale']} | 키 맞춤 ×{info['heightFit']['scale']}(머리 {info['heightFit']['headScaleVsIdle'] * 100:.0f}%) · 빨강=정지 윤곽", fill=(40, 30, 20), font=FONT)
        for i, t in enumerate(ts): sheet_img.paste(t.convert('RGB').resize((tw, th)), (i * tw, y + 24))
    sheet_img.save(os.path.join(out, 'fit-sheet.png'))
    # gif: the three side by side, idle then fitted
    W = tw * len(frames)
    seq = []
    for k in (0, 1):
        f = Image.new('RGB', (W, th), (245, 239, 227))
        for i, pair in enumerate(frames): f.paste(pair[k].convert('RGB').resize((tw, th)), (i * tw, 0))
        seq.append(f)
    seq[0].save(os.path.join(out, 'fit.gif'), save_all=True, append_images=seq[1:], duration=700, loop=0)
    json.dump({'sheet': os.path.relpath(o.sheet, ROOT), 'view': o.view, 'canvas': CANVAS, 'pivot': PIVOT,
               'referenceVisibleHeight': 576, 'characters': report}, open(os.path.join(out, 'fit.json'), 'w'),
              ensure_ascii=False, indent=1)
    print('→', os.path.relpath(out))


if __name__ == '__main__':
    main()
