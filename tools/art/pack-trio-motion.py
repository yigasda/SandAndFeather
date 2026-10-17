# Packs the approved trio idle/walk frames (docs/art/chibi-refresh/final, 48 PNG) into one runtime atlas per character,
# data/art/characters/trio-motion-<who>.png (+ -small for phones), and writes the frame table into data/sprites.json
# (looks.<who>.motion).
# Nothing is redrawn: each frame is the approved picture, scaled with one uniform factor per state so the
# character's visible height is the same standing and walking (idle576 source px, walk 330 → VISIBLE atlas px).
# Approved action sets (ACTIONS) go into the character's atlas as looks.<who>.motion.acts[action][dir][frame].
# The source files and the manifest are read only; the old pocket atlas (townsman) is left alone.
import hashlib, json, os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SRC = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'final')
VISIBLE = 256          # atlas pixels from the top of the head to the feet: ≥ HEIGHT × the largest zoom (8), so it only ever shrinks
HEIGHT = 31.2         # in-game height in logical pixels (a tile is 16); 0.9.16 took it from 24 to 1.3×
SMALL = 125            # the phone atlas: HEIGHT × 4 (a 2x phone screen's zoom), rounded up
PAD = 2
DIRS = ['down', 'up', 'left', 'right']


def scaled(path, k):
    im = Image.open(path).convert('RGBA')
    w, h = round(im.width * k), round(im.height * k)
    # premultiplied downscale so the transparent edge keeps no dark fringe
    import numpy as np
    a = np.asarray(im).astype(np.float32)
    a[..., :3] *= a[..., 3:4] / 255
    small = np.stack([np.asarray(Image.fromarray(a[..., c].astype(np.float32), 'F').resize((w, h), Image.LANCZOS)) for c in range(4)], -1)
    small = np.clip(small, 0, 255)
    rgb = np.where(small[..., 3:4] > 0, small[..., :3] * 255 / np.maximum(small[..., 3:4], 1e-3), 0)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), small[..., 3]]).round().astype(np.uint8), 'RGBA')


def pack(frames, visible, out):
    # each frame scaled once from its approved source to `visible`, cropped to its alpha bounds (+pad), the pivot
    # kept relative to the crop; shelf-packed one row per character and state
    pieces = []
    for f in frames:
        k = visible / f['referenceVisibleHeight']
        im = scaled(os.path.join(ROOT, f['path']), k)
        x0, y0, x1, y1 = f['alphaBounds']
        bx0, by0 = max(0, int(x0 * k) - PAD), max(0, int(y0 * k) - PAD)
        bx1, by1 = min(im.width, int(x1 * k + 0.999) + PAD), min(im.height, int(y1 * k + 0.999) + PAD)
        pieces.append((f, im.crop((bx0, by0, bx1, by1)), [round(f['pivot'][0] * k - bx0, 2), round(f['pivot'][1] * k - by0, 2)]))
    pieces.sort(key=lambda t: (t[0]['character'], t[0]['state']))
    x, y, rh, W, place, key = 0, 0, 0, 0, {}, None
    for f, piece, pivot in pieces:
        k2 = (f['character'], f['state'])
        if k2 != key:
            if key is not None: y += rh + PAD; x = 0; rh = 0
            key = k2
        place[f['id']] = (x, y)
        x += piece.width + PAD; rh = max(rh, piece.height); W = max(W, x)
    atlas = Image.new('RGBA', (W, y + rh), (0, 0, 0, 0))
    for f, piece, pivot in pieces:
        atlas.paste(piece, place[f['id']])
    path = os.path.join(ROOT, 'data', out)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    atlas.save(path, optimize=True)
    print('atlas', out, atlas.size, os.path.getsize(path) // 1024, 'KB')
    tables = {}
    for who in ['set', 'somang', 'horus']:
        idle, walk = {}, {d: [None, None, None] for d in DIRS}
        for f, piece, pivot in pieces:
            if f['character'] != who: continue
            rect = [*place[f['id']], piece.width, piece.height, *pivot]
            if f['state'] == 'idle': idle[f['gameDirection']] = rect
            else: walk[f['gameDirection']][f['phase']] = rect
        acts = {}
        for f, piece, pivot in pieces:
            if f['character'] != who or f['state'] in ('idle', 'walk'): continue
            rect = [*place[f['id']], piece.width, piece.height, *pivot]
            acts.setdefault(f['state'], {}).setdefault(f['gameDirection'], {})[f['phase']] = rect
        acts = {st: {d: [ph[i] for i in sorted(ph)] for d, ph in byd.items()} for st, byd in acts.items()}
        # where an effect hangs off a frame (the fishing rod's end): from the anchor, in character heights
        tips = {}
        for f, piece, pivot in pieces:
            if f['character'] != who or not f.get('tip'): continue
            h = f['referenceVisibleHeight']
            tips.setdefault(f['state'], {}).setdefault(f['gameDirection'], {})[f['phase']] = [round((f['tip'][0] - f['pivot'][0]) / h, 4), round((f['tip'][1] - f['pivot'][1]) / h, 4)]
        tips = {st: {d: [ph[i] for i in sorted(ph)] for d, ph in byd.items()} for st, byd in tips.items()}
        tables[who] = {'file': out, 'visible': visible, 'idle': idle, 'walk': walk, **({'acts': acts} if acts else {}), **({'tips': tips} if tips else {})}
    return tables


# approved action sets packed beside the base 48 (same canvas, pivot and reference height as the idle)
ACTIONS = [os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', d, 'manifest.json') for d in ['interaction-somang-v172', 'interaction-set-v174', 'pickup-somang-v178', 'pickup-trio-v182', 'sit-somang-v179', 'sit-trio-v190', 'sleep-trio-v220',
    # 0.9.70 생활 묶음 (메인1, life-pack.py) and Set/Horus fishing hand-fixed by Opus (fishing-fix)
    'fishing-fix'] + [f'life-v1/{x}' for x in ('cook', 'read', 'happy', 'shy', 'surprised', 'eat', 'fish')]]


def action_frames():
    frames, playback = [], {}
    for mp in ACTIONS:
        am = json.load(open(mp))
        if not am.get('artApproved'): raise SystemExit(f'not approved: {mp}')
        base = os.path.dirname(mp); dmap = am['directionMap']
        names = set()
        for f in am['files']:
            path = os.path.join(base, f['path'])
            data = open(path, 'rb').read()
            assert hashlib.sha256(data).hexdigest() == f['sha256'], path
            bb = Image.open(path).getchannel('A').getbbox()
            # one sitting batch holds several seats (floor, stool, bench): each is its own action, sit-<seat>
            name = f"{am['action']}-{f['seatType']}" if f.get('seatType') else am['action']
            names.add(name)
            frames.append({'id': f"{f['character']}.{name}.{dmap[f['direction']]}.{f['frame']}", 'character': f['character'],
                           'state': name, 'gameDirection': dmap[f['direction']], 'phase': f['frame'],
                           'path': os.path.relpath(path, ROOT), 'referenceVisibleHeight': f.get('referenceVisibleHeight', am['referenceVisibleHeight']),
                           'alphaBounds': list(bb), 'pivot': (f.get('anchor') or am['anchor'])['position'],
                           **({'tip': f['tip']} if f.get('tip') else {})})
        pb = am['playback']
        # a pose that stays (sitting) holds its last frame until she moves; a looping one (sleeping) cycles
        for name in sorted(names):   # sorted: a set's order changes run to run
            playback[name] = {'frameMs': pb.get('durationMs') or [800] * len(pb['sequence']), 'loop': bool(pb.get('loop')),
                              **({'hold': True} if pb.get('hold') else {})}
    return frames, playback


# 새 호루스 (0.9.77): every Horus frame comes from docs/art/horus-redraw-2026-10-14/manifest.json (60 approved pictures,
# the only source; drink and the combat set are not in the game). The old Horus pictures (final, the action folders)
# were deleted after 0.9.77. Sizes (referenceVisibleHeight = the picture px that make one whole Horus tall):
#   standing pictures: their own solid alpha height (alpha ≥ 128), so every one is the same height;
#   a value written in the manifest (sitting 4, sleeping 4, fishing 2, picked by the user against Set and Somang): as is;
#   picking up: the head as tall as the same direction's interact head (head = top of the hair → the neck written in
#   the entry's edits, "목 x,y", + "캔버스 위 Npx");
#   the user's own floor sitting and meal pictures (sides): HORUS_USER (Set's and Somang's same pose, user-approved).
# Anchors are found on the new pictures: standing = the middle of the two feet on the bottom row; the others the same
# body place as the old anchor of that pose (HORUS_ANCHOR, read on zoomed crops 2026-10-17). The rod's end is measured.
HORUS = os.path.join(ROOT, 'docs', 'art', 'horus-redraw-2026-10-14')
HORUS_DIR = {'front': 'down', 'back': 'up', 'left': 'left', 'right': 'right'}
HORUS_SKIP = ('drink', 'combat')
STANDING = ('idle', 'walk', 'interact', 'cook', 'read', 'happy', 'shy', 'surprised')
HORUS_STATE = {'eat-eyes-open': ('eat', 0), 'eat-eyes-closed': ('eat', 1)}
# the user's floor sitting and meal pictures: referenceVisibleHeight (filled in after the user's pick)
HORUS_USER = {'left-sit-floor-0': 1101.0, 'right-sit-floor-0': 1086.0, 'left-eat-eyes-open-0': 1101.0, 'left-eat-eyes-closed-0': 1101.0,
              'right-eat-eyes-open-0': 1086.0, 'right-eat-eyes-closed-0': 1086.0}
# old anchor → the same body place on the new picture (source px of the new picture). Sitting on a bench: the old
# anchor sat 78 px behind and 18 px above the fold behind the knee (old 576 scale), carried at this picture's scale
# so rest.js FOLD stays; stool: the middle of the figure just under the kilt; floor: under the hips (the back of the
# waistband) on the floor, sides 11 px (old scale) above the bottom; the meal frames: their sitting picture's anchor
# moved by how the meal picture lies on it (registered on the feet and hem); sleeping front: between the clasped fists,
# side: on the waistband behind the elbow; frame 1 registered on frame 0's legs; fishing: the kilt's hem between the legs
HORUS_ANCHOR = {
    'right-sit-bench-0': ('fold', 241.75, 437.5, -78, -18), 'left-sit-bench-0': ('fold', 153.5, 418.75, 77.5, -18),
    'back-sit-stool-0': (192.5, 481.5), 'back-sit-floor-0': (490, 1140),
    'right-sit-floor-0': ('floor', 573, 1183), 'left-sit-floor-0': ('floor', 789, 1182),
    'left-eat-eyes-open-0': ('like', 'left-sit-floor-0', -2, 2), 'left-eat-eyes-closed-0': ('like', 'left-sit-floor-0', -1, 2),
    'right-eat-eyes-open-0': ('like', 'right-sit-floor-0', -1, 0), 'right-eat-eyes-closed-0': ('like', 'right-sit-floor-0', -1, 1),
    'front-fish-0': (250, 404), 'front-fish-1': (240, 415),
    'front-sleep-0': (223, 378), 'front-sleep-1': (224, 382), 'right-sleep-0': (282, 538), 'right-sleep-1': (273, 516),
}


def solid_box(path):
    return Image.open(path).getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()


def feet_middle(path):
    """the middle of the two feet: across the solid pixels of the bottom 4 % of the figure, on the bottom row"""
    import numpy as np
    a = np.asarray(Image.open(path).getchannel('A')) >= 128
    ys = np.nonzero(a.any(1))[0]; y0, y1 = ys[0], ys[-1]
    xs = np.nonzero(a[int(y1 - 0.04 * (y1 - y0)):y1 + 1].any(0))[0]
    return [round(float(xs.min() + xs.max()) / 2, 1), float(y1 + 1)]


def neck_y(entry):
    import re
    t = ' '.join(entry.get('edits') or [])
    n = re.search(r'목(?:=깃 위끝)? (\d+),(\d+)', t); c = re.search(r'캔버스 위 (\d+)px', t)
    return int(n.group(2)) + (int(c.group(1)) if c else 0)


def horus_frames(playback):
    man = json.load(open(os.path.join(HORUS, 'manifest.json')))
    by = {e['file'][len('png/horus-'):-4]: e for e in man['sprites']}
    path = lambda n: os.path.join(HORUS, by[n]['file'])
    def rvh(n, state, view):
        e = by[n]
        if e.get('referenceVisibleHeight'): return e['referenceVisibleHeight']
        if state in STANDING: b = solid_box(path(n)); return b[3] - b[1]
        if state == 'pickup':
            ref = f'{view}-interact-0'; rb = solid_box(path(ref)); b = solid_box(path(n))
            return round((neck_y(e) - b[1]) * (rb[3] - rb[1]) / (neck_y(by[ref]) - rb[1]), 1)
        if n in HORUS_USER: return HORUS_USER[n]
        raise SystemExit(f'horus: no size for {n}')
    def anchor(n, h):
        a = HORUS_ANCHOR.get(n)
        if a is None: return feet_middle(path(n))
        if a[0] == 'fold': return [round(a[1] + a[3] * h / 576, 1), round(a[2] + a[4] * h / 576, 1)]
        if a[0] == 'floor': return [a[1], round(a[2] - 11 * h / 576, 1)]
        if a[0] == 'like':
            x, y = anchor(a[1], rvh(a[1], 'sit-floor', None)); return [x + a[2], y + a[3]]
        return list(a)
    frames = []
    for n, e in by.items():
        if any(k in n for k in HORUS_SKIP): continue
        data = open(path(n), 'rb').read()
        assert hashlib.sha256(data).hexdigest() == e['sha256'], n
        view, rest = n.split('-', 1); act, ph = rest.rsplit('-', 1)
        state, ph = HORUS_STATE.get(act, (act, int(ph)))
        d = HORUS_DIR[view]; h = rvh(n, state, view)
        f = {'id': f'horus.idle.{d}' if state == 'idle' else f'horus.{state}.{d}.{ph}', 'character': 'horus', 'state': state,
             'gameDirection': d, 'phase': ph, 'path': os.path.relpath(path(n), ROOT), 'referenceVisibleHeight': h,
             'alphaBounds': list(Image.open(path(n)).getchannel('A').getbbox()), 'pivot': anchor(n, h)}
        if state == 'fish':   # the rod's end: the leftmost solid pixel (waiting) / in the top third (pulling), as life-pack does
            a = Image.open(path(n)).getchannel('A'); w, hh = a.size; px = a.load(); best = None
            for y in (range(hh) if ph == 0 else range(hh // 3)):
                for x in range(w):
                    if px[x, y] >= 128:
                        if best is None or x < best[0]: best = (x, y)
                        break
            f['tip'] = list(best)
        frames.append(f)
    # the meal: frame 0 (eyes open) and 1 (eyes closed) take turns while eating (rest.js eatCard holds one at a time)
    print('horus:', len(frames), 'frames from', os.path.relpath(HORUS, ROOT))
    return frames


# 전투 (두아트 필드 전투): each one's 18 combat pictures (left/right × idle 0-2, anticipation, attack, skill, spell,
# hit, tired) in their own atlas, data/art/characters/trio-combat-<who>[-small].png (the life atlases are near 4096),
# as sprites.json looks.<who>.combat = {file, visible, height, acts{ready,anticipation,…}{left,right}[frames], actPlay,
# small}. The combat idle is the state "ready". Sizes: referenceVisibleHeight written per picture in each manifest
# (user-approved on game-renderer sheets). Anchor: the middle of the two feet on the bottom row (feet_middle), or
# COMBAT_ANCHOR where a weapon reaches lower than the feet.
COMBAT = {'horus': os.path.join(ROOT, 'docs', 'art', 'horus-combat-approved-18-2026-10-15'),
          'set': os.path.join(ROOT, '메인2', '세트'), 'somang': os.path.join(ROOT, '메인2', '소망')}
# Set's trident reaches below the feet in these: the middle of the two sandals (read on zoomed crops 2026-10-17)
COMBAT_ANCHOR = {('set', 'right-combat-idle-0'): [801.5, 677], ('set', 'right-combat-idle-1'): [809.5, 679], ('set', 'right-combat-idle-2'): [803.5, 680],
                 ('set', 'right-combat-skill-0'): [794.5, 787], ('set', 'right-combat-tired-0'): [844, 797], ('set', 'right-combat-hit-0'): [811, 800],
                 ('set', 'left-combat-idle-0'): [799, 680], ('set', 'left-combat-idle-1'): [799, 676], ('set', 'left-combat-idle-2'): [800, 676],
                 ('set', 'left-combat-skill-0'): [796.5, 784], ('set', 'left-combat-tired-0'): [739, 795]}
# Horus's skill is a dive from the air: the anchor puts his head where the same side's idle 0 has it (plan B-2), the
# height of the jump is given in the game
COMBAT_AIR = {('horus', 'skill')}
COMBAT_PLAY = {'ready': {'frameMs': [220, 220, 220, 220], 'seq': [0, 1, 2, 1], 'loop': True},
               'anticipation': {'frameMs': [120]}, 'attack': {'frameMs': [260]}, 'skill': {'frameMs': [450]},
               'spell': {'frameMs': [500]}, 'hit': {'frameMs': [300]}, 'tired': {'frameMs': [800], 'hold': True}}


def combat_frames(who):
    d = COMBAT[who]; m = json.load(open(os.path.join(d, 'manifest.json')))
    out = []
    for e in m.get('sprites') or m.get('files'):
        path = os.path.join(d, e['file'])
        assert hashlib.sha256(open(path, 'rb').read()).hexdigest() == e['sha256'], path
        name = os.path.basename(path)[:-4].split('-', 1)[1]          # left-combat-idle-0
        side, _, motion, ph = name.split('-')
        state = 'ready' if motion == 'idle' else motion
        out.append({'id': f'{who}.combat.{state}.{side}.{ph}', 'character': who, 'state': state, 'gameDirection': side,
                    'phase': int(ph), 'path': os.path.relpath(path, ROOT), 'referenceVisibleHeight': e['referenceVisibleHeight'],
                    'alphaBounds': list(Image.open(path).getchannel('A').getbbox()),
                    'pivot': COMBAT_ANCHOR.get((who, name)) or feet_middle(path)})
    assert len(out) == 18, (who, len(out))
    def head(f):   # top of the hair and the middle of the top fifth of the figure
        b = solid_box(os.path.join(ROOT, f['path'])); a = Image.open(os.path.join(ROOT, f['path'])).getchannel('A').point(lambda v: 255 if v >= 128 else 0)
        t = a.crop((0, b[1], a.width, b[1] + (b[3] - b[1]) // 5)).getbbox()
        return (t[0] + t[2]) / 2, b[1]
    for f in out:
        if (who, f['state']) in COMBAT_AIR:
            idle = next(g for g in out if g['state'] == 'ready' and g['phase'] == 0 and g['gameDirection'] == f['gameDirection'])
            (ix, iy), (hx, hy) = head(idle), head(f); k = f['referenceVisibleHeight'] / idle['referenceVisibleHeight']
            f['pivot'] = [round(hx + (idle['pivot'][0] - ix) * k, 1), round(hy + (idle['pivot'][1] - iy) * k, 1)]
    return out


def main():
    man = json.load(open(os.path.join(SRC, 'manifest.json')))
    if man.get('runtimeEligible') is False:
        raise SystemExit('Final art is approved, but runtime integration is not enabled. Opus must review final/manifest.json and runtime packaging before enabling it.')
    # Both states come from the same final selection.
    cycle = man['walkCycle']
    frames = man['frames']      # Set and Somang; Horus comes from horus_frames()
    assert len(frames) == 32 and all(f['character'] != 'horus' for f in frames)
    for f in frames:
        data = open(os.path.join(ROOT, f['path']), 'rb').read()
        assert hashlib.sha256(data).hexdigest() == f['sha256'], f['id']
    extra, playback = action_frames()
    hf = horus_frames(playback)
    extra += [f for f in hf if f['state'] not in ('idle', 'walk')]
    frames += [f for f in hf if f['state'] in ('idle', 'walk')]
    # one atlas per character: with every action in one picture it would pass 4096 px, past what some phones draw
    big, small = {}, {}
    for who in ['set', 'somang', 'horus']:
        mine = [f for f in frames + extra if f['character'] == who]
        big[who] = pack(mine, VISIBLE, f'art/characters/trio-motion-{who}.png')[who]
        small[who] = pack(mine, SMALL, f'art/characters/trio-motion-{who}-small.png')[who]
    sprites_path = os.path.join(ROOT, 'data', 'sprites.json')
    sprites = json.load(open(sprites_path))
    for who in ['set', 'somang', 'horus']:
        offsets = {d: cycle['defaultOffsets'] for d in DIRS}
        if who == 'horus': offsets['down'] = cycle['horusDownOffsets']
        b = big[who]
        sprites['looks'][who]['motion'] = {
            'file': b['file'], 'visible': b['visible'], 'height': HEIGHT,
            'idle': b['idle'], 'walk': b['walk'], 'sequence': cycle['sequence'], 'frameMs': cycle['previewFrameDurationMs'],
            # whole-sprite shifts while walking, in source walk-cell pixels (330 = the walk cell's visible height)
            'offsets': offsets, 'offsetRef': [f for f in frames if f['state'] == 'walk'][0]['referenceVisibleHeight'],
            # the same frames packed at phone size: drawn nearly 1:1 at a phone's zoom, so they stay crisp
            'small': small[who],
        }
        if b.get('acts'):
            sprites['looks'][who]['motion']['acts'] = b['acts']
            sprites['looks'][who]['motion']['actPlay'] = {k: v for k, v in playback.items() if k in b['acts']}
            if b.get('tips'): sprites['looks'][who]['motion']['actTips'] = b['tips']
    for who in ['set', 'somang', 'horus']:
        cf = combat_frames(who)
        b = pack(cf, VISIBLE, f'art/characters/trio-combat-{who}.png')[who]
        sm = pack(cf, SMALL, f'art/characters/trio-combat-{who}-small.png')[who]
        sprites['looks'][who]['combat'] = {'file': b['file'], 'visible': b['visible'], 'height': HEIGHT, 'acts': b['acts'],
                                           'actPlay': COMBAT_PLAY, 'small': {k: sm[k] for k in ('file', 'visible', 'acts')}}
    with open(sprites_path, 'w') as fh:
        fh.write(compact(json.dumps(sprites, ensure_ascii=False, indent=1)) + '\n')


def compact(text):
    # the file is written with one-space indents; number lists (rects, offsets) go on one line
    import re
    return re.sub(r'\[\s*(-?[\d.]+(?:,\s*-?[\d.]+)*)\s*\]', lambda m: '[' + ', '.join(x.strip() for x in m.group(1).split(',')) + ']', text)


if __name__ == '__main__':
    main()
