# Target lines for Horus's standing front: the user's hair (horus-hair-guide/user-edit-final.jpg, placed by the eyes)
# and a lower body in the walk's proportions. The standing front reads long because its legs show more below the
# kilt than the walk's do; the target keeps the kilt and the soles where they are and gives legs and sandals the walk
# frame's lengths, so the head does not jump between standing and walking.
#
#   python3 tools/art/horus-idle-target.py [IDLE.png] [--walk WALK.png]
#       → docs/art/chibi-refresh/horus-hair-guide/targets/idle-front-*
#   python3 tools/art/horus-idle-target.py --back [IDLE.png] [--walk WALK.png]
#       → .../targets/idle-back-* (legs only; the hair guide is for the front)
# The preview picture is a mechanical cut and stretch to show the shape; it is not art to use.
import argparse, importlib.util, json, os
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location('check_hair', os.path.join(HERE, 'check-hair.py'))
ch = importlib.util.module_from_spec(spec); spec.loader.exec_module(ch)
ART = ch.ART
OUT = os.path.join(ch.GUIDE_DIR, 'targets')


def lower_body(path):
    # rows where the kilt ends (the outline narrows to the legs), where the sandals start, and the sole
    im = np.asarray(Image.open(path).convert('RGBA'))
    a = im[..., 3] > 128
    rgb = im[..., :3].astype(float) / 255
    h, s, v = ch.hsv(rgb)
    shoe = (h > 0.01) & (h < 0.08) & (s > 0.45) & (v >= 0.13) & (v < 0.5) & a
    ys = np.nonzero(a.any(1))[0]; top, bottom = int(ys.min()), int(ys.max())
    H = bottom - top + 1
    width = np.array([(np.ptp(np.nonzero(a[y])[0]) + 1) if a[y].any() else 0 for y in range(a.shape[0])])
    # sandal top: going up from the sole, the last row where the brown fills a good share of the row (a strapped
    # sandal shows a few rows of skin between straps)
    y = last = bottom
    while y > top + 0.7 * H:
        if shoe[y].sum() >= 0.3 * max(width[y], 1): last = y
        elif y < last - 8: break
        y -= 1
    sandal = last
    # legs: the narrow run above the sandals; the kilt starts where the outline widens again
    lw = width[sandal - 2]
    y = sandal - 1
    while y > top and width[y] <= 1.2 * lw: y -= 1
    legs = y + 1
    y = sandal
    return {'top': top, 'kiltEnd': legs - 1, 'legsStart': legs, 'sandalTop': y, 'sole': bottom,
            'legRows': y - legs, 'sandalRows': bottom - y + 1}, im


def lower_body_back(path):
    # from behind the kilt is plain white cloth and the legs plain skin: the kilt ends at its last white row, the
    # legs are the skin rows under it, and the sandals start where the skin falls to under 60% of the legs' width
    im = np.asarray(Image.open(path).convert('RGBA'))
    a = im[..., 3] > 128
    h, s, v = ch.hsv(im[..., :3].astype(float) / 255)
    white = a & (s < 0.12) & (v > 0.85)
    skin = a & (h < 0.12) & (s >= 0.12) & (s < 0.5) & (v > 0.75)
    ys = np.nonzero(a.any(1))[0]; top, bottom = int(ys.min()), int(ys.max())
    H = bottom - top + 1
    y = int(top + 0.75 * H)
    while y < bottom and not (white[y].sum() < 3 and skin[y + 2].sum() > 10): y += 1
    kilt = y  # the kilt's bottom outline row
    full = np.median(skin[kilt + 1:kilt + 9].sum(1))
    y = kilt + 1
    while y < bottom and skin[y].sum() < 0.6 * full: y += 1
    legs = y
    while y < bottom and skin[y].sum() >= 0.6 * full: y += 1
    return {'top': top, 'kiltEnd': kilt, 'legsStart': legs, 'sandalTop': y, 'sole': bottom,
            'legRows': y - legs, 'sandalRows': bottom - y + 1}, im


def collar(rgba):
    # the gold collar's top row and middle: the same on the front and the back, so it anchors one to the other
    a = rgba[..., 3] > 128
    h, s, v = ch.hsv(rgba[..., :3].astype(float) / 255)
    gold = (h > 0.08) & (h < 0.15) & (s > 0.45) & (v > 0.35) & a
    ys = np.nonzero(a.any(1))[0]; top, H = ys.min(), ys.max() - ys.min() + 1
    for y in range(int(top + 0.55 * H), int(top + 0.75 * H)):  # below the eyes, which are gold too
        if gold[y].sum() > 15:
            xs = np.nonzero(gold[y:y + 6].any(0))[0]
            return y, (xs.min() + xs.max()) / 2
    raise SystemExit('목걸이를 못 찾음')


def shift(mask, dy, dx):
    out = np.zeros_like(mask)
    H, W = mask.shape
    ys, xs = np.nonzero(mask)
    ys = ys + dy; xs = xs + dx
    ok = (ys >= 0) & (ys < H) & (xs >= 0) & (xs < W)
    out[ys[ok], xs[ok]] = True
    return out


def back_head(front_path, back_rgba):
    # the user's front head, hair and ears, turned round: mirrored about the collar's middle and set on the back
    # picture by the collar's top. From behind there is no hairline; the outer outline and the ears carry over.
    g = ch.guide()
    rgb, b = ch.load(front_path)
    e, _, _ = ch.eyes(rgb, b)
    head, _ = ch.place(g['head'], g['eyes'], e, b.shape)
    hair, _ = ch.place(g['sil'], g['eyes'], e, b.shape)
    ears, _ = ch.place(g['ears'], g['eyes'], e, b.shape)
    fy, fx = collar(np.asarray(Image.open(front_path).convert('RGBA')))
    by, bx = collar(back_rgba)
    W = b.shape[1]
    s_ = int(round(fx + bx - (W - 1)))
    turn = lambda m: shift(m[:, ::-1], int(by - fy), s_)
    return turn(head), turn(hair), turn(ears)


def head_offset(ref, rgba, cut):
    # how far a walk frame's head sits from the reference's: best overlap of the opaque head above the collar
    a = ref[..., 3] > 128; b = rgba[..., 3] > 128
    a = a[:cut]; best = (0, 0, -1)
    for dy in range(-8, 9):
        for dx in range(-10, 11):
            m = shift(b[:cut + 10], dy, dx)[:cut]
            sc = (a & m).sum() - 0.5 * (a ^ m).sum()
            if sc > best[2]: best = (dy, dx, sc)
    return best[0], best[1]


def back(o):
    I, idle = lower_body_back(o.idle)
    W, walk = lower_body_back(o.walk)
    legs_n = W['legRows']
    sandal_n = I['sole'] - (I['legsStart'] + legs_n) + 1
    new = np.zeros_like(idle)
    new[:I['legsStart']] = idle[:I['legsStart']]
    leg_rows = idle[I['legsStart']:I['sandalTop']]
    keep = np.round(np.linspace(0, len(leg_rows) - 1, legs_n)).astype(int)
    new[I['legsStart']:I['legsStart'] + legs_n] = leg_rows[keep]
    sandal = idle[I['sandalTop']:I['sole'] + 1]
    pick = np.floor(np.linspace(0, len(sandal) - 0.001, sandal_n)).astype(int)
    new[I['legsStart'] + legs_n:I['sole'] + 1] = sandal[pick]
    body = new[..., 3] > 128
    Image.fromarray((body * 255).astype(np.uint8)).save(os.path.join(OUT, 'idle-back-body-mask.png'))
    Image.fromarray(new).save(os.path.join(OUT, 'idle-back-shape-preview.png'))
    k = 3
    st = I['legsStart'] + legs_n
    y0, y1 = I['top'] - 12, I['sole'] + 6
    front = os.path.join(ART, 'review-horus-idle-v156', 'horus-front.png')
    bhead, bhair, bears = back_head(front, idle)
    Image.fromarray((bhead * 255).astype(np.uint8)).save(os.path.join(OUT, 'idle-back-head-mask.png'))
    kb = lambda m: np.kron(m, np.ones((k, k), bool))
    def head_line(hd, hr, er):
        # the hair's outer outline and the ears' outline; the nape is left as drawn
        hd, hr, er = kb(hd), kb(hr), kb(er)
        return ch.edge(hd) & (ch.grow(hr, k) & ~er | er & ~ch.grow(hr, k))
    def tile(rgba, line, heads_=None):
        base = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (245, 239, 227, 255))
        base.alpha_composite(Image.fromarray(rgba))
        big = np.asarray(base.convert('RGB').resize((rgba.shape[1] * k, rgba.shape[0] * k), Image.NEAREST)).copy()
        if line:
            # the lower body from the kilt down, and the head turned round from the user's front
            m = kb(body); ln = ch.edge(m)
            ln[:(I['kiltEnd'] - 4) * k] = False
            big[ch.grow(ln, 1)] = (230, 0, 0)
        if heads_ is not None:
            big[ch.grow(head_line(*heads_), 1)] = (230, 0, 0)
        return Image.fromarray(big[y0 * k:y1 * k, 50 * k:310 * k])
    tiles = [tile(walk, False), tile(idle, True, (bhead, bhair, bears)), tile(new, True, (bhead, bhair, bears))]
    heads = ['채택 걷기 뒤 1 (다리 비율 기준)', '지금 정지 뒤(148) + 빨간 목표선(머리는 정면을 돌린 것)', '다리 모양 미리보기 (기계로 자르고 늘린 것, 그림 아님)']
    tw, th = tiles[0].size
    sheet = Image.new('RGB', (tw * 3, th + 30), (250, 248, 244))
    d = ImageDraw.Draw(sheet)
    xs = np.nonzero(body[st])[0]
    for i, t in enumerate(tiles):
        sheet.paste(t, (i * tw, 30)); d.text((i * tw + 8, 6), heads[i], fill=(40, 30, 20), font=ch.FONT)
        if i:
            y = 30 + (st - y0) * k
            x0 = i * tw + (xs.min() - 50) * k - 12; x1 = i * tw + (xs.max() - 50) * k + 12
            d.line([(x0, y), (x1, y)], fill=(230, 0, 0), width=3)
            d.text((x1 + 6, y - 10), '신발 위는 여기', fill=(230, 0, 0), font=ch.FONT)
    sheet.save(os.path.join(OUT, 'idle-back-target.png'))
    cut = collar(idle)[0]
    frames = []
    for i in range(3):
        wp = os.path.join(ch.WALK, f'horus-back-{i}.png')
        wr = np.asarray(Image.open(wp).convert('RGBA'))
        dy, dx = head_offset(idle, wr, cut)
        hd, hr, er = (shift(m, -dy, -dx) for m in (bhead, bhair, bears))
        Image.fromarray((hd * 255).astype(np.uint8)).save(os.path.join(OUT, f'walk-back-{i}-head-mask.png'))
        t = tile(wr, False, (hd, hr, er))
        t.save(os.path.join(OUT, f'walk-back-{i}-target.png')); frames.append(t)
    seq = [frames[j] for j in (0, 1, 2, 1)]
    seq[0].save(os.path.join(OUT, 'walk-back-target.gif'), save_all=True, append_images=seq[1:], duration=360, loop=0)
    info = {'idle': os.path.relpath(o.idle, ch.ROOT), 'walk': os.path.relpath(o.walk, ch.ROOT), 'idleNow': I, 'walkFrame': W,
            'target': {'kiltEnd': I['kiltEnd'], 'legRows': legs_n, 'sandalTop': st, 'sandalRows': sandal_n, 'sole': I['sole']}}
    json.dump(info, open(os.path.join(OUT, 'idle-back-target.json'), 'w'), ensure_ascii=False, indent=1, default=int)
    print(json.dumps({k_: info[k_] for k_ in ('idleNow', 'walkFrame', 'target')}, ensure_ascii=False, default=int))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--back', action='store_true', help='뒷모습: 148 정지 뒤와 걷기 뒤 1')
    ap.add_argument('idle', nargs='?', default=os.path.join(ART, 'review-horus-idle-v156', 'horus-front.png'))
    ap.add_argument('--walk', default=os.path.join(ch.WALK, 'horus-front-1.png'))
    o = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if o.back:
        if o.idle.endswith(os.path.join('review-horus-idle-v156', 'horus-front.png')):
            o.idle = os.path.join(ART, 'review-trio-idle-v1', 'native', 'horus-back.png')
        if o.walk.endswith('horus-front-1.png'):
            o.walk = os.path.join(ch.WALK, 'horus-back-1.png')
        back(o); return
    I, idle = lower_body(o.idle)
    W, walk = lower_body(o.walk)
    # new lower body: same kilt end and sole; legs as many rows as the walk's, sandals fill the rest
    legs_n = W['legRows']
    sandal_n = I['sole'] - (I['legsStart'] + legs_n) + 1
    new = np.zeros_like(idle)
    new[:I['legsStart']] = idle[:I['legsStart']]
    leg_rows = idle[I['legsStart']:I['sandalTop']]
    keep = np.round(np.linspace(0, len(leg_rows) - 1, legs_n)).astype(int) if legs_n else []
    new[I['legsStart']:I['legsStart'] + legs_n] = leg_rows[keep]
    sandal = idle[I['sandalTop']:I['sole'] + 1]
    pick = np.floor(np.linspace(0, len(sandal) - 0.001, sandal_n)).astype(int)
    new[I['legsStart'] + legs_n:I['sole'] + 1] = sandal[pick]
    body = new[..., 3] > 128
    # the user's hair, placed by the idle's eyes
    g = ch.guide()
    rgb, b = ch.load(o.idle)
    e, top, H = ch.eyes(rgb, b)
    hair, tf = ch.place(g['sil'], g['eyes'], e, b.shape)
    head, _ = ch.place(g['head'], g['eyes'], e, b.shape)
    ears, _ = ch.place(g['ears'], g['eyes'], e, b.shape)
    Image.fromarray((head * 255).astype(np.uint8)).save(os.path.join(OUT, 'idle-front-head-mask.png'))
    Image.fromarray((body * 255).astype(np.uint8)).save(os.path.join(OUT, 'idle-front-body-mask.png'))
    Image.fromarray((hair * 255).astype(np.uint8)).save(os.path.join(OUT, 'idle-front-hair-mask.png'))
    Image.fromarray(new).save(os.path.join(OUT, 'idle-front-shape-preview.png'))
    # sheet: walk frame | current standing with target lines | the shape preview, 3× with lines drawn at that size
    k = 3
    def tile(rgba, lines):
        base = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (245, 239, 227, 255))
        base.alpha_composite(Image.fromarray(rgba))
        big = np.asarray(base.convert('RGB').resize((rgba.shape[1] * k, rgba.shape[0] * k), Image.NEAREST)).copy()
        for m, col, keep in lines:
            mb = np.kron(m, np.ones((k, k), bool))
            ln = ch.edge(mb)
            if keep is not None: ln &= np.kron(keep, np.ones((k, k), bool))
            big[ch.grow(ln, 1)] = col
        return Image.fromarray(big[(I["top"] - 12) * k:(I["sole"] + 6) * k, 50 * k:310 * k])
    red = (230, 0, 0)
    # lines: the user's hair, the ears beside the face, and the target body below the collar. The face and jaw get no
    # line; they stay as drawn.
    rows = np.arange(body.shape[0])[:, None]
    below = np.broadcast_to(rows > np.nonzero(head.any(1))[0].max(), body.shape)
    lines = [(hair, red, None), (head, red, ears), (body, red, below)]
    tiles = [tile(walk, []), tile(idle, lines), tile(new, lines)]
    heads = ['채택 걷기 정면 1 (비율 기준)', '지금 정지 정면(156) + 빨간 목표선', '목표 모양 미리보기 (기계로 자르고 늘린 것, 그림 아님)']
    tw, th = tiles[0].size
    sheet = Image.new('RGB', (tw * 3, th + 30), (250, 248, 244))
    d = ImageDraw.Draw(sheet)
    for i, t in enumerate(tiles):
        sheet.paste(t, (i * tw, 30)); d.text((i * tw + 8, 6), heads[i], fill=(40, 30, 20), font=ch.FONT)
    for i in range(3):
        for key, col in (('kiltEnd', (200, 0, 160)), ('sandalTop', (140, 70, 20)), ('sole', (0, 110, 230))):
            src = (W, I, {**I, 'sandalTop': I['legsStart'] + legs_n})[i]
            y = 30 + (src[key] + 1 - (I['top'] - 12)) * k
            d.line([(i * tw, y), (i * tw + 40, y)], fill=col, width=3)
    # where the sandals should start: across the feet, on the current standing front and on the preview
    st = I['legsStart'] + legs_n
    xs = np.nonzero(body[st])[0]
    for i in (1, 2):
        y = 30 + (st - (I['top'] - 12)) * k
        x0 = i * tw + (xs.min() - 50) * k - 12; x1 = i * tw + (xs.max() - 50) * k + 12
        d.line([(x0, y), (x1, y)], fill=(230, 0, 0), width=3)
        d.text((x1 + 6, y - 10), '신발 위는 여기', fill=(230, 0, 0), font=ch.FONT)
    sheet.save(os.path.join(OUT, 'idle-front-target.png'))
    info = {'idle': os.path.relpath(o.idle, ch.ROOT), 'walk': os.path.relpath(o.walk, ch.ROOT), 'idleNow': I, 'walkFrame': W,
            'target': {'kiltEnd': I['kiltEnd'], 'legRows': legs_n, 'sandalTop': I['legsStart'] + legs_n, 'sandalRows': sandal_n, 'sole': I['sole']},
            'hairTransform': tf}
    json.dump(info, open(os.path.join(OUT, 'idle-front-target.json'), 'w'), ensure_ascii=False, indent=1, default=int)
    print(json.dumps({k: info[k] for k in ('idleNow', 'walkFrame', 'target')}, ensure_ascii=False, default=int))


if __name__ == '__main__':
    main()
