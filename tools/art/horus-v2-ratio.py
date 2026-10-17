# 새 호루스 비율 맞추기 (2026-10-17, user: "Shy, surprised 같은 비율과 머리 크기로 모든 스프라이트 싹 수정해줘").
# The approved shy and surprised pictures are the measure: head (top of the hair → top of the gold collar) is 41.4 % of
# the whole height. Sheets drawn with a bigger head (front walk, interact, read…: 48–50 %) get their head scaled down
# about the neck (fix/headbody.py, body untouched, nothing redrawn), one factor per source sheet so a sheet stays
# consistent. Sheets already at the measure (shy·surprised, smile, side idle·walk) are left as they are.
# The neck of each picture: found by head-check's search for the head of a standing picture of the same sheet and
# view (the template), carried to the template's neck (the top middle of its gold collar).
# Writes docs/art/horus-redraw-2026-10-14/ratio/: png/ (fixed pictures, same names and canvases), manifest.json
# (factor, neck, head match, source sha) and scale.json (referenceVisibleHeight for pack-trio-motion.py: a standing
# picture's alpha height; any other = its template's fixed height × the head size found).
#   python3 tools/art/horus-v2-ratio.py [--sheet]      (four at a time, about 2 minutes a picture; results kept per picture)
import hashlib, importlib.util, json, math, os, subprocess, sys
import numpy as np
from multiprocessing import Pool
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
R = os.path.join(ROOT, 'docs', 'art', 'horus-redraw-2026-10-14')
OUT = os.path.join(R, 'ratio')
spec = importlib.util.spec_from_file_location('hc', os.path.join(ROOT, 'tools', 'art', 'head-check.py')); hc = importlib.util.module_from_spec(spec); spec.loader.exec_module(hc)
TARGET = 0.586   # head (top of the hair → chin) / height, shy and surprised alike
# per source sheet: the head factor, from its standing picture's head and body (chin read on zoomed strips:
# front walk 1 head 323 / body 160, interact 274/151 front · 259/150 left · 268/158 back, read 281/160, happy 340/233,
# side idle 282/188), factor = TARGET·body / ((1 − TARGET)·head); and the standing template of each view
SHEETS = {
    'walk': (0.701, {'front': 'front-walk-1'}),
    'interact': (0.80, {'front': 'front-interact-0', 'back': 'back-interact-0', 'left': 'left-interact-0', 'right': 'right-interact-0'}),
    'sit': (0.80, {'back': 'back-interact-0', 'left': 'left-interact-0', 'right': 'right-interact-0'}),
    'pickup': (0.80, {'front': 'front-interact-0', 'back': 'back-interact-0', 'left': 'left-interact-0', 'right': 'right-interact-0'}),
    'sleep-front': (0.80, {'front': 'front-interact-0'}),
    'sleep-side': (0.80, {'right': 'right-interact-0'}),
    'life': (0.806, {'front': 'front-read-0', 'back': 'back-cook-0', 'right': 'right-interact-0'}),
    'smile': (0.97, {'front': 'front-happy-0'}),
    'side-idle-walk': (0.944, {'left': 'left-idle-0', 'right': 'right-idle-0'}),
}
KEEP = ('shy-surprise',)
# the chin of each template (rows read on the zoomed strips; right side pictures like their left ones)
CHIN = {'front-walk-1': 343, 'front-interact-0': 293, 'front-read-0': 300, 'front-happy-0': 361, 'left-idle-0': 302, 'right-idle-0': 302,
        'left-interact-0': 280, 'right-interact-0': 280, 'back-interact-0': 288, 'back-cook-0': 290}
STANDING = {'front-walk-0', 'front-walk-1', 'front-walk-2', 'front-interact-0', 'front-interact-1', 'back-interact-0', 'back-interact-1',
            'left-interact-0', 'left-interact-1', 'right-interact-0', 'right-interact-1', 'front-read-0', 'back-cook-0',
            'front-happy-0', 'front-shy-0', 'front-surprised-0', 'left-idle-0', 'right-idle-0',
            'left-walk-0', 'left-walk-1', 'left-walk-2', 'right-walk-0', 'right-walk-1', 'right-walk-2'}
png = lambda n: os.path.join(R, 'png', f'horus-{n}.png')
solid = lambda im: im.getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()


def neck_of_template(n):
    """the chin row (CHIN), across: the middle of the figure in the rows just under it (the neck)"""
    y = CHIN[n]
    a = np.asarray(Image.open(png(n)).convert('RGBA'))[..., 3] >= 128
    xs = np.nonzero(a[y + 4:y + 14].any(0))[0]
    head = np.nonzero(a[:y].any(0))[0]
    xs = xs[(xs > head.min()) & (xs < head.max())]
    return float((xs.min() + xs.max()) / 2), float(y)


def head_of(n):
    im = Image.open(png(n)).convert('RGBA'); b = solid(im)
    return im.crop((b[0], b[1], b[2], b[1] + int(0.45 * (b[3] - b[1])))), b


def find(job):
    n, tpl = job
    out = os.path.join(OUT, 'found', f'{n}.json')
    if os.path.exists(out): return json.load(open(out))
    if n == tpl: r = {'size': 1.0, 'angle': 0.0, 'match': 1.0, 'at': None}
    else:
        head, _ = head_of(tpl); big = hc.edges(Image.open(png(n)).convert('RGBA'))
        angles = np.arange(-90, 91, 15) if 'sleep' in n else np.arange(-30, 31, 10)
        _, s0, a0, _ = hc.search(big, head, 2, np.arange(0.70, 1.31, 0.05), angles)
        sc, s, a, (x, y) = hc.search(big, head, 1, np.arange(s0 - 0.04, s0 + 0.041, 0.01), np.arange(a0 - 10, a0 + 10.1, 2.5))
        r = {'size': round(float(s), 3), 'angle': float(a), 'match': round(float(sc), 3), 'at': [int(x), int(y)]}
    r.update(file=n, template=tpl)
    json.dump(r, open(out, 'w')); return r


def neck(r):
    """the template's neck carried onto this picture by the head found (size, tilt, place)"""
    nx, ny = neck_of_template(r['template'])
    if r['at'] is None: return nx, ny
    head, b = head_of(r['template']); tw, th = head.size
    s, a = r['size'], math.radians(r['angle'])
    w, h = tw * s, th * s
    pw = abs(w * math.cos(a)) + abs(h * math.sin(a)); ph = abs(w * math.sin(a)) + abs(h * math.cos(a))
    cx, cy = r['at'][0] + pw / 2, r['at'][1] + ph / 2
    dx, dy = (nx - b[0] - tw / 2) * s, (ny - b[1] - th / 2) * s
    return cx + dx * math.cos(a) - dy * math.sin(a), cy + dx * math.sin(a) + dy * math.cos(a)


def main():
    man = json.load(open(os.path.join(R, 'manifest.json')))
    os.makedirs(os.path.join(OUT, 'png'), exist_ok=True); os.makedirs(os.path.join(OUT, 'found'), exist_ok=True)
    sheet_of = {s['file'][10:-4]: os.path.basename(s['source'])[:-4] for s in man['sprites']}
    jobs = []
    for n, sh in sorted(sheet_of.items()):
        if sh in SHEETS: jobs.append((n, SHEETS[sh][1][n.split('-')[0]]))
    with Pool(4) as pool:
        found = {r['file']: r for r in pool.imap_unordered(find, jobs)}
    rows, scale = [], {}
    fixed_h = {}
    for n, sh in sorted(sheet_of.items()):
        if 'combat' in n or 'drink' in n: continue
        src = png(n); dst = os.path.join(OUT, 'png', f'horus-{n}.png')
        if sh in KEEP:
            Image.open(src).save(dst); rows.append({'file': n, 'sheet': sh, 'factor': 1.0}); continue
        k = SHEETS[sh][0]; r = found[n]; x, y = neck(r)
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'art', 'fix', 'headbody.py'), src, dst, str(k), '1', str(x), str(y), '60'], check=True)
        rows.append({'file': n, 'sheet': sh, 'factor': k, 'neck': [round(x, 1), round(y, 1)], 'template': r['template'], 'headSize': r['size'], 'match': r['match']})
    for row in rows:
        n = row['file']; dst = os.path.join(OUT, 'png', f'horus-{n}.png')
        row['sha256'] = hashlib.sha256(open(dst, 'rb').read()).hexdigest()
        row['sourceSha256'] = hashlib.sha256(open(png(n), 'rb').read()).hexdigest()
        b = solid(Image.open(dst)); fixed_h[n] = b[3] - b[1]
    for row in rows:
        n = row['file']
        if n in STANDING: scale[n] = fixed_h[n]
        else: scale[n] = round(fixed_h[row['template']] * row['headSize'], 2)
    json.dump({'about': 'tools/art/horus-v2-ratio.py — 새 호루스 머리:키를 shy·surprised(41.4 %)에 맞춤. factor = 목 기준 머리 배율', 'target': TARGET, 'files': rows},
              open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump({'about': 'referenceVisibleHeight of each fixed new Horus picture (horus-v2-ratio.py)', 'referenceVisibleHeight': scale},
              open(os.path.join(OUT, 'scale.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(rows), 'pictures')


if __name__ == '__main__':
    main()
