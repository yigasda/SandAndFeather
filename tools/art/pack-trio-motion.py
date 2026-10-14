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
ACTIONS = [os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', d, 'manifest.json') for d in ['interaction-somang-v172', 'interaction-set-v174', 'interaction-horus-v176', 'pickup-somang-v178', 'pickup-trio-v182', 'sit-somang-v179', 'sit-trio-v190', 'sleep-trio-v220',
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
        for name in names:
            playback[name] = {'frameMs': pb.get('durationMs') or [800] * len(pb['sequence']), 'loop': bool(pb.get('loop')),
                              **({'hold': True} if pb.get('hold') else {})}
    return frames, playback


# 호루스 새 그림 (2026-10-14, 아스트라 채택 43장, docs/art/horus-redraw-2026-10-14): they take the place of Horus's old
# frames of the same action, direction and frame (user: "그냥 교체해줘"). Nothing is redrawn or warped: each new
# picture is shown at the size the old one was (its alpha height scaled to the old one's), and its anchor sits where the
# old anchor sat relative to the figure (same place from the middle of the alpha box). Fishing gets its rod end again.
# Not in the game yet, so not used here: drink (no such action) and the left combat set (메인2/호루스).
HORUS_V2 = os.path.join(ROOT, 'docs', 'art', 'horus-redraw-2026-10-14')
V2_DIR = {'front': 'down', 'back': 'up', 'left': 'left', 'right': 'right'}


def horus_v2(frames):
    man = json.load(open(os.path.join(HORUS_V2, 'manifest.json')))
    side = json.load(open(os.path.join(HORUS_V2, 'side-walk', 'manifest.json')))   # the side idle and walk (user's sheet)
    sprites = man['sprites'] + [{**s, 'file': 'side-walk/' + s['file']} for s in side['sprites']]
    by_id = {f['id']: i for i, f in enumerate(frames)}
    done = []
    for s in sprites:
        name = os.path.basename(s['file'])[:-4].split('-')   # horus-<view>-<action…>-<frame>, horus-<view>-idle
        if name[-1] == 'idle': name.append('')
        view, act, ph = name[1], '-'.join(name[2:-1]), (int(name[-1]) if name[-1] else None)
        if act in ('drink',) or act.startswith('combat'): continue
        fid = f"horus.idle.{V2_DIR[view]}" if act == 'idle' else f"horus.{act}.{V2_DIR[view]}.{ph}"
        if fid not in by_id: raise SystemExit(f'horus v2: no old frame {fid}')
        old = frames[by_id[fid]]
        path = os.path.join(HORUS_V2, s['file'])
        data = open(path, 'rb').read()
        assert hashlib.sha256(data).hexdigest() == s['sha256'], path
        nb = Image.open(path).getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()
        ob = old['alphaBounds']
        r = (nb[3] - nb[1]) / (ob[3] - ob[1])
        ocx, ncx = (ob[0] + ob[2]) / 2, (nb[0] + nb[2]) / 2
        pivot = [round(ncx + (old['pivot'][0] - ocx) * r, 1), round(nb[1] + (old['pivot'][1] - ob[1]) * r, 1)]
        new = {**old, 'path': os.path.relpath(path, ROOT), 'referenceVisibleHeight': round(old['referenceVisibleHeight'] * r, 2),
               'alphaBounds': list(Image.open(path).getchannel('A').getbbox()), 'pivot': pivot}
        new.pop('tip', None)
        if old.get('tip'):   # the rod's end: the leftmost solid pixel (waiting) / in the top third (pulling), as life-pack does
            a = Image.open(path).getchannel('A'); w, h = a.size; px = a.load(); best = None
            for y in (range(h) if ph == 0 else range(h // 3)):
                for x in range(w):
                    if px[x, y] >= 128:
                        if best is None or x < best[0]: best = (x, y)
                        break
            new['tip'] = list(best)
        frames[by_id[fid]] = new
        done.append(fid)
    print('horus v2:', len(done), 'frames replaced')
    return frames


def main():
    man = json.load(open(os.path.join(SRC, 'manifest.json')))
    if man.get('runtimeEligible') is False:
        raise SystemExit('Final art is approved, but runtime integration is not enabled. Opus must review final/manifest.json and runtime packaging before enabling it.')
    # Both states come from the same final selection.
    cycle = man['walkCycle']
    frames = man['frames']
    assert len(frames) == 48
    for f in frames:
        data = open(os.path.join(ROOT, f['path']), 'rb').read()
        assert hashlib.sha256(data).hexdigest() == f['sha256'], f['id']
    extra, playback = action_frames()
    both = horus_v2(list(frames) + extra); frames, extra = both[:len(frames)], both[len(frames):]
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
    with open(sprites_path, 'w') as fh:
        fh.write(compact(json.dumps(sprites, ensure_ascii=False, indent=1)) + '\n')


def compact(text):
    # the file is written with one-space indents; number lists (rects, offsets) go on one line
    import re
    return re.sub(r'\[\s*(-?[\d.]+(?:,\s*-?[\d.]+)*)\s*\]', lambda m: '[' + ', '.join(x.strip() for x in m.group(1).split(',')) + ']', text)


if __name__ == '__main__':
    main()
