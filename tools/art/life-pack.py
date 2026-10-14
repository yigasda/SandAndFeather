# 생활 묶음 (메인1, user-approved; Set/Horus fishing from fishing-fix): copies the approved pictures byte for byte into
# docs/art/chibi-refresh/life-v1/<action>/png and writes one manifest per action in the form pack-trio-motion.py reads
# (anchor = the point that stands on the game position, referenceVisibleHeight = how many of the picture's pixels make a
# standing character's full height, directionMap). The effects and the bucket go to data/art/fx (byte for byte).
# Nothing is redrawn or resized here; the size each picture is shown at comes from referenceVisibleHeight.
#   python3 tools/art/life-pack.py
import hashlib, json, os, shutil, subprocess, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
M1 = os.path.join(ROOT, '메인1')
OUT = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'life-v1')
FX = os.path.join(ROOT, 'data', 'art', 'fx')
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
DMAP = {'front': 'down', 'back': 'up', 'left': 'left', 'right': 'right'}


def feet(path):
    """standing pictures: the middle of the soles (the lowest solid rows), and the bottom row"""
    a = Image.open(path).getchannel('A').point(lambda v: 255 if v >= 128 else 0)
    w, h = a.size; px = a.load()
    rows = [y for y in range(h) if any(px[x, y] for x in range(w))]
    bottom = rows[-1]
    xs = [x for y in range(bottom - max(4, h // 60), bottom + 1) for x in range(w) if px[x, y]]
    return [round((min(xs) + max(xs)) / 2), bottom]


def tip(path, frame):
    """the fishing rod's end: waiting (0) the leftmost solid pixel; pulling (1) the leftmost one in the top third"""
    a = Image.open(path).getchannel('A'); w, h = a.size; px = a.load()
    rows = range(h) if frame == 0 else range(h // 3)
    best = None
    for y in rows:
        for x in range(w):
            if px[x, y] >= 128:
                if best is None or x < best[0]: best = (x, y)
                break
    return list(best)


# who / direction / frame → [source, anchor kind, anchor, referenceVisibleHeight, why]
# referenceVisibleHeight 576 = drawn at the final idle's size (fit-scale ~1.0); others from the head fit or the
# registration on the approved sitting picture they were drawn from (numbers in the README)
ACTS = {
    'cook': [(w, 'back', 0, f'{w}-back-cook-0.png', 'feet', None, 576) for w in ('somang', 'set', 'horus')],
    'read': [(w, 'front', 0, f'{w}-front-read-0.png', 'feet', None, 576) for w in ('somang', 'horus')],
    'happy': [('somang', 'front', 0, 'somang-front-happy-0.png', 'feet', None, 576), ('set', 'front', 0, 'set-front-happy-0.png', 'feet', None, 576),
              ('horus', 'front', 0, 'horus-front-happy-0.png', 'feet', None, round(576 / 1.0475, 1))],
    'shy': [('somang', 'front', 0, 'somang-front-shy-0.png', 'feet', None, 576), ('horus', 'front', 0, 'horus-front-shy-0.png', 'feet', None, 576),
            ('set', 'front', 0, 'set-front-shy-0.png', 'feet', None, round(576 * 1352 / 720, 1))],
    'surprised': [(w, 'front', 0, f'{w}-front-surprised-0.png', 'feet', None, 576) for w in ('somang', 'set', 'horus')],
    # drawn from the approved floor-cushion sitting pictures: the anchor is that picture's seat-bottom, carried over
    'eat': [('somang', 'left', 0, 'somang-left-eat-0.png', 'seat-bottom', [330, 642], 576),
            ('horus', 'right', 0, 'horus-right-eat-0.png', 'seat-bottom', [round((280 - 62) / 1.17, 1), round((652 - 60) / 1.17, 1)], round(576 / 1.17, 1)),
            ('set', 'back', 0, 'set-back-eat-0.png', 'seat-bottom', [round((310 - 25) / 0.93, 1), round((648 - 122) / 0.93, 1)], round(576 / 0.93, 1))],
    'fish': [('somang', 'front', k, f'somang-front-fish-{k}.png', 'seat-bottom', [370, 600], round(576 / 1.0925, 1)) for k in (0, 1)],
}
# head sizes matched to the idle (0.9.70, user: 머리가 정지·걷기랑 안 맞으면 맞춰): measured with head-check.py in the
# game's scale (head size × 576 / referenceVisibleHeight); the head alone is scaled about the neck (fix/headshrink.py),
# the body stays where the sitting picture's registration put it. pad: transparent border first (the head grows past
# the canvas), the anchor moves with it. The 메인1 original stays in <action>/sources/.
FIX = {'horus-right-eat-0.png': {'pad': 0, 'head': [0.86, 250, 325, 70], 'why': '머리 116% → 100%'},
       'set-back-eat-0.png': {'pad': 40, 'head': [1.12, 310, 320, 80], 'why': '머리 88% → 99%'},
       'somang-front-surprised-0.png': {'pad': 0, 'head': [0.96, 300, 455, 50], 'why': '머리 104% → 100%'}}
HEAD = os.path.join(ROOT, 'tools', 'art', 'fix', 'headshrink.py')


def fix(dst, f):
    if f['pad']:
        im = Image.open(dst).convert('RGBA'); n = f['pad']
        big = Image.new('RGBA', (im.width + 2 * n, im.height + 2 * n), (0, 0, 0, 0)); big.paste(im, (n, n)); big.save(dst)
    s, nx, ny, r = f['head']
    subprocess.run([sys.executable, HEAD, dst, dst, str(s), str(nx + f['pad']), str(ny + f['pad']), str(r)], check=True)


PLAY = {'cook': {'sequence': [0], 'loop': False, 'hold': True}, 'read': {'sequence': [0], 'loop': False, 'hold': True},
        'happy': {'sequence': [0], 'loop': False, 'hold': True}, 'shy': {'sequence': [0], 'loop': False, 'hold': True},
        'surprised': {'sequence': [0], 'loop': False, 'hold': True}, 'eat': {'sequence': [0], 'loop': False, 'hold': True},
        'fish': {'sequence': [0, 1], 'durationMs': [800, 800], 'loop': False, 'hold': True}}

EVIDENCE = {'yellow': 'bced46d "add 15 yellow-approved life sprites to 메인1"', 'blue': 'a079fdc "add 3 blue-approved life sprites"',
            'set-shy': 'b2eb756 "approved Set shy arm redraw v224"', 'horus-happy': 'de3ca31 "keep approved Horus happy v226"'}


def main():
    os.makedirs(FX, exist_ok=True)
    for name, rows in ACTS.items():
        d = os.path.join(OUT, name); os.makedirs(os.path.join(d, 'png'), exist_ok=True)
        files = []
        for who, view, fr, src, kind, anchor, rvh in rows:
            s = os.path.join(M1, src); dst = os.path.join(d, 'png', src)
            shutil.copyfile(s, dst)
            assert sha(s) == sha(dst)
            edit = FIX.get(src)
            if edit:
                os.makedirs(os.path.join(d, 'sources'), exist_ok=True); shutil.copyfile(s, os.path.join(d, 'sources', src))
                fix(dst, edit)
                if anchor: anchor = [anchor[0] + edit['pad'], anchor[1] + edit['pad']]
            f = {'path': f'png/{src}', 'character': who, 'direction': view, 'frame': fr,
                 'anchor': {'kind': kind, 'position': anchor or feet(dst)}, 'referenceVisibleHeight': rvh, 'sha256': sha(dst),
                 'source': f'메인1/{src}', 'canvas': list(Image.open(dst).size)}
            if name == 'fish': f['tip'] = tip(dst, fr)
            if edit: f['edits'] = [f"headshrink {edit['head']} pad {edit['pad']}: {edit['why']}"]; f['sourceSha256'] = sha(s)
            files.append(f)
        m = {'action': name, 'status': 'user-approved', 'artApproved': True, 'runtimeEligible': True, 'runtimeOwner': 'opus',
             'directionMap': DMAP, 'referenceVisibleHeight': 576, 'playback': PLAY[name], 'approvalEvidence': EVIDENCE, 'files': files}
        json.dump(m, open(os.path.join(d, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
        print(name, len(files))
    # Set and Horus fishing (fishing-fix): their rod ends
    fm = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'fishing-fix', 'manifest.json')
    m = json.load(open(fm))
    for f in m['files']: f['tip'] = tip(os.path.join(os.path.dirname(fm), f['path']), f['frame'])
    json.dump(m, open(fm, 'w'), ensure_ascii=False, indent=1)
    # effects and the bucket, as they are
    for f in sorted(os.listdir(M1)):
        if f.endswith('.png') and f.split('-')[0] in ('bubble', 'bucket', 'bobber', 'discover', 'flour', 'seeds', 'splash', 'steam', 'water', 'yummy'):
            shutil.copyfile(os.path.join(M1, f), os.path.join(FX, f))
    print('fx', len(os.listdir(FX)))


if __name__ == '__main__':
    main()
