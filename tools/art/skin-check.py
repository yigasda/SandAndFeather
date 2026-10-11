# Skin colour check for new poses: is the skin painted with the same colours as the final idle and walk?
#
#   python3 tools/art/skin-check.py <png>... [--who somang] [--view front] [--out <folder>]
#
# The reference is every skin pixel of the character's final idle and three walk frames in the same direction
# (all four directions when the view is not in the file name, e.g. sleeping). For each picture it reports
#   - the base, shadow and highlight tones (the most used skin colour, and the most used one clearly darker / lighter)
#     against the closest final frame's, as ΔE (CIE76, about 2 is just visible, 5 is clearly different)
#   - how much of the skin is painted in a colour that the reference does not use (nearest reference colour ΔE > 4)
# and writes <out>/<name>-skin.png: reference idle | picture | off colours in magenta | tone swatches (ref above, picture below).
# Verdict: 같음 when every tone is within ΔE 3 and under 10 % of the skin is off (ΔE > 4); 조금 다름 up to ΔE 6;
# 다름 beyond that or when 10 % or more is off. The tone that moved is named.
# Only fully opaque, non-outline pixels count. The colour test finds skin by its peach tone, so very pale cloth
# can slip in: look at the magenta picture before believing a 다름.
import argparse, functools, importlib.util, json, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FINAL = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'final')
spec = importlib.util.spec_from_file_location('check_sprite', os.path.join(os.path.dirname(__file__), 'check-sprite.py'))
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
except OSError:
    FONT = ImageFont.load_default()
VIEWS = ['front', 'back', 'left', 'right']
TONES = [('base', '기본', 50), ('shadow', '그림자', 15), ('light', '밝은 쪽', 85)]
OFF, TONE_OK, TONE_FAR, OFF_OK = 4.0, 3.0, 6.0, 0.10


def skin_pixels(path, who):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    p = cs.parts(im, who)
    # check-sprite's skin also takes Somang's ivory dress; real skin is a little more saturated (Horus's cool skin is paler)
    _, s, _ = cs.hsv(im[..., :3] / 255)
    m = p['skin'] & (im[..., 3] >= 250) & ~p['outline'] & (s > (0.08 if who == 'horus' else 0.14))
    return im, m, im[..., :3][m]


def tones(rgb):
    """base: the most used skin colour (the flat fill); shadow / light: the most used colour clearly darker / lighter than it."""
    q = (rgb // 4 * 4).astype(np.int32)
    cols, counts = np.unique(q, axis=0, return_counts=True)
    L = cs.lab(cols.astype(np.float32))[:, 0]
    base = int(np.argmax(counts))
    out = {'base': cols[base] + 2}
    # a skin shadow is at least as saturated as the base; the greyish pink of an ivory dress's folds is not
    S = cs.hsv(cols.astype(np.float32) / 255)[1]
    for key, pick in (('shadow', (L < L[base] - 5) & (S >= 0.95 * S[base])), ('light', L > L[base] + 2)):
        out[key] = cols[pick][np.argmax(counts[pick])] + 2 if pick.any() else cols[base] + 2
    return {k: v.astype(np.float32) for k, v in out.items()}


@functools.lru_cache(None)
def reference(who, view):
    views = [view] if view in VIEWS else VIEWS
    paths = []
    for v in views:
        paths.append(os.path.join(FINAL, who, 'idle', f'{who}-{v}.png'))
        paths += [os.path.join(FINAL, who, 'walk', f'{who}-{v}-{k}.png') for k in range(3)]
    per = [skin_pixels(p, who)[2] for p in paths]
    rgb = np.concatenate(per)
    cols, counts = np.unique(rgb.astype(np.uint8), axis=0, return_counts=True)
    pal = cols[counts >= 3].astype(np.float32)          # colours the finals really use, not stray edge pixels
    return paths[0], [tones(x) for x in per], pal


def nearest_de(rgb, pal):
    La, Lb = cs.lab(rgb), cs.lab(pal)
    best = np.full(len(La), np.inf)
    for i in range(0, len(Lb), 512):
        d = np.linalg.norm(La[:, None, :] - Lb[None, i:i + 512, :], axis=2).min(1)
        best = np.minimum(best, d)
    return best


def check(path, who, view, out):
    ref_path, ref_tones, pal = reference(who, view)
    im, m, rgb = skin_pixels(path, who)
    if len(rgb) < 50:
        return {'file': os.path.basename(path), 'verdict': '피부 없음/못 찾음'}
    ct = tones(rgb)
    # the finals themselves differ a little frame to frame (how much face or leg shows), so each tone is compared
    # with the closest final frame's tone
    de, rt = {}, {}
    for k, _, _ in TONES:
        d = [float(np.linalg.norm(cs.lab(ct[k][None]) - cs.lab(r[k][None]))) for r in ref_tones]
        i = int(np.argmin(d)); de[k], rt[k] = d[i], ref_tones[i][k]
    near = nearest_de(rgb, pal)
    off = float((near > OFF).mean())
    moved = [f'{ko} ΔE {de[k]:.1f}' for k, ko, _ in TONES if de[k] > TONE_OK]
    far = max(de.values()) > TONE_FAR or off >= OFF_OK
    verdict = '같음' if not moved and off < OFF_OK else ('다름' if far else '조금 다름') + ' (' + ', '.join(moved + ([f'팔레트 밖 {off:.0%}'] if off >= OFF_OK else [])) + ')'
    r = {'file': os.path.basename(path), 'who': who, 'view': view if view in VIEWS else 'all', 'skinPixels': int(len(rgb)),
         'toneDeltaE': {k: round(v, 1) for k, v in de.items()},
         'tones': {k: [int(x) for x in ct[k]] for k in ct}, 'referenceTones': {k: [int(x) for x in rt[k]] for k in rt},
         'offPaletteShare': round(off, 3), 'verdict': verdict}
    if out:
        os.makedirs(out, exist_ok=True)
        cand = Image.open(path).convert('RGBA'); ref = Image.open(ref_path).convert('RGBA')
        mark = np.asarray(cand).copy()
        ys, xs = np.nonzero(m)
        bad = near > OFF
        mark[ys[bad], xs[bad]] = (255, 0, 255, 255)
        mark = Image.fromarray(mark, 'RGBA')
        W, H = cand.size
        sheet = Image.new('RGB', (W * 3 + 180, H + 30), (245, 239, 227)); d = ImageDraw.Draw(sheet)
        for i, pic in enumerate([ref, cand, mark]):
            sheet.paste(pic, (i * W, 30), pic)
        d.text((6, 6), f'{r["file"]} · {verdict} · 정지 | 그림 | 팔레트 밖(분홍)', fill=(40, 30, 20), font=FONT)
        for j, (k, ko, _) in enumerate(TONES):
            x, y = W * 3 + 10, 50 + j * 120
            d.rectangle([x, y, x + 70, y + 45], fill=tuple(int(v) for v in rt[k])); d.rectangle([x, y + 47, x + 70, y + 92], fill=tuple(int(v) for v in ct[k]))
            d.text((x + 76, y + 10), ko, fill=(40, 30, 20), font=FONT); d.text((x + 76, y + 56), f'ΔE {de[k]:.1f}', fill=(40, 30, 20), font=FONT)
        sheet.save(os.path.join(out, os.path.splitext(r['file'])[0] + '-skin.png'))
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('png', nargs='+'); ap.add_argument('--who'); ap.add_argument('--view'); ap.add_argument('--out')
    a = ap.parse_args()
    res = []
    for p in a.png:
        m = re.match(r'(set|somang|horus)-(front|back|left|right)?', os.path.basename(p))
        who = a.who or (m and m.group(1)); view = a.view or (m and m.group(2)) or 'all'
        r = check(p, who, view, a.out); res.append(r)
        print(f"{r['file']}: {r['verdict']}  " + ('' if 'toneDeltaE' not in r else
              f"기본 {r['toneDeltaE']['base']} · 그림자 {r['toneDeltaE']['shadow']} · 밝은 쪽 {r['toneDeltaE']['light']} · 팔레트 밖 {r['offPaletteShare']:.0%}"))
    if a.out:
        json.dump(res, open(os.path.join(a.out, 'skin.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
