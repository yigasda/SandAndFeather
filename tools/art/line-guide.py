# The final idle's own line drawing of the head (hair edge, cheeks, jaw, ears, brows, eyes), laid in red on a new
# pose at the place and tilt where its head is, at the idle's size. Draw the head to these lines: a square jaw, cheeks
# spread to the sides or a longer face shows at once as skin past or short of the red jaw line.
#
#   python3 tools/art/line-guide.py <png>... --out <folder> [--who set] [--view right]
#       who and view from the file name (<who>-<view>-…); "sleep" = front, "sleep-side" = right
#
# The head is found with head-check (place and tilt); the size is always the idle's (a head never changes size).
# The lines are the idle's dark pixels from the top of the head down to the chin (the face's lowest skin row).
# Two files per picture: <name>-lines.png (the picture faded, red lines; to draw on) and <name>-lines-sheet.png
# (the idle head | the picture with the lines, the head enlarged; to look at).
import argparse, importlib.util, os, re
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(__file__)
FINAL = os.path.join(HERE, '..', '..', 'docs', 'art', 'chibi-refresh', 'final')


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), os.path.join(HERE, name + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m


hc, cs = load('head-check'), load('check-sprite')


def chin(im, who):
    """the lowest row of the face's skin (the biggest skin piece in the top 60 % of the figure)"""
    a = np.asarray(im).astype(np.float32)
    x0, y0, x1, y1 = im.getbbox()
    sk = cs.parts(a, who)['skin'] & (a[..., 3] > 200); sk[y0 + int(0.6 * (y1 - y0)):] = False
    rows = np.nonzero(sk.sum(1) > 0.25 * sk.sum(1).max())[0]
    return int(rows.max()) if len(rows) else y0 + int(0.5 * (y1 - y0))


def who_view(path, who, view):
    m = re.match(r'(set|somang|horus)-([a-z-]+?)-\d+\.png$', os.path.basename(path))
    key = m.group(2) if m else ''
    w = who or (m and m.group(1))
    v = view or next((x for x in ('front', 'back', 'left', 'right') if x in key.split('-')), None) or ('right' if 'side' in key else 'front')
    return w, v, 'sleep' in key


def lines(path, who, view, lying, out):
    cand = Image.open(path).convert('RGBA')
    r = hc.find(cand, who, view, lying=lying)
    head = hc.idle_head(who, view)
    hs = hc.placed(head, r['size'], r['angle'])
    cx, cy = r['at'][0] + hs.width / 2, r['at'][1] + hs.height / 2  # where the idle head's middle landed
    idle = Image.open(os.path.join(FINAL, who, 'idle', f'{who}-{view}.png')).convert('RGBA')
    x0, y0, x1, _ = idle.getbbox()
    hy1 = y0 + head.height
    c = ((x0 + x1) / 2, (y0 + hy1) / 2)          # the idle head crop's middle, as head-check placed it
    a = np.asarray(idle).astype(np.float32)
    _, _, v = cs.hsv(a[..., :3] / 255)
    m = (a[..., 3] > 200) & (v < 0.14)  # the black line work only (dark hair is lighter)
    m[chin(idle, who) + 3:] = False
    L = Image.fromarray((m * 255).astype(np.uint8), 'L').rotate(-r['angle'], resample=Image.NEAREST, center=c)
    lay = Image.new('L', cand.size, 0); lay.paste(L, (round(cx - c[0]), round(cy - c[1])))
    red = np.asarray(lay) > 127
    name = os.path.splitext(os.path.basename(path))[0]
    g = np.asarray(cand).copy(); g[..., 3] = (g[..., 3] * 0.45).astype(np.uint8); g[red] = (230, 0, 0, 255)
    Image.fromarray(g, 'RGBA').save(os.path.join(out, name + '-lines.png'))
    ys, xs = np.nonzero(red)
    bx0, by0, bx1, by1 = max(0, xs.min() - 20), max(0, ys.min() - 20), min(620, xs.max() + 21), min(720, ys.max() + 21)
    p = np.asarray(cand).copy(); p[red] = (230, 0, 0, 255)
    I = Image.new('RGBA', cand.size, (0, 0, 0, 0)); I.paste(idle.rotate(-r['angle'], resample=Image.BICUBIC, center=c), (round(cx - c[0]), round(cy - c[1])))
    def panel(arr):
        im = Image.fromarray(np.asarray(arr)[by0:by1, bx0:bx1].astype(np.uint8), 'RGBA')
        bg = Image.new('RGBA', im.size, (245, 239, 227, 255)); bg.alpha_composite(im)
        return bg.convert('RGB').resize((im.width * 2, im.height * 2), Image.NEAREST)
    pa, pb = panel(I), panel(p)
    s = Image.new('RGB', (pa.width + pb.width + 20, pa.height + 34), (245, 239, 227)); d = ImageDraw.Draw(s)
    s.paste(pa, (0, 34)); s.paste(pb, (pa.width + 20, 34))
    d.text((6, 6), f'{name} · 왼쪽 정지 머리 · 오른쪽 그림 + 정지 선(빨강) · 기울기 {r["angle"]:+.0f}° · 일치도 {r["match"]:.2f}', fill=(40, 30, 20), font=hc.FONT)
    s.save(os.path.join(out, name + '-lines-sheet.png'))
    return r


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('png', nargs='+'); ap.add_argument('--out', required=True)
    ap.add_argument('--who'); ap.add_argument('--view')
    o = ap.parse_args(); os.makedirs(o.out, exist_ok=True)
    for p in o.png:
        w, v, lying = who_view(p, o.who, o.view)
        print(os.path.basename(p), lines(p, w, v, lying, o.out))


if __name__ == '__main__':
    main()
