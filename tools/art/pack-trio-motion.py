# Packs the approved trio idle/walk frames (docs/art/chibi-refresh/approved, 48 PNG) into one runtime atlas,
# data/art/characters/trio-motion.png, and writes the frame table into data/sprites.json (looks.<who>.motion).
# Nothing is redrawn: each frame is the approved picture, scaled with one uniform factor per state so the
# character's visible height is the same standing and walking (idle 628 source px, walk 330 → VISIBLE atlas px).
# The source files and the manifest are read only; the old pocket atlas (townsman) is left alone.
import hashlib, json, os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SRC = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'approved')
OUT = os.path.join(ROOT, 'data', 'art', 'characters', 'trio-motion.png')
VISIBLE = 192          # atlas pixels from the top of the head to the feet (enough for an 8x phone zoom)
HEIGHT = 24            # in-game height in logical pixels (a tile is 16)
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


def main():
    man = json.load(open(os.path.join(SRC, 'manifest.json')))
    cycle = man['walkCycle']
    frames = man['frames']
    for f in frames:
        data = open(os.path.join(ROOT, f['path']), 'rb').read()
        assert hashlib.sha256(data).hexdigest() == f['sha256'], f['id']
    # crop each frame to its alpha bounds (+pad) after scaling; keep the pivot relative to the crop
    pieces = []
    for f in frames:
        k = VISIBLE / f['referenceVisibleHeight']
        im = scaled(os.path.join(ROOT, f['path']), k)
        x0, y0, x1, y1 = f['alphaBounds']
        bx0, by0 = max(0, int(x0 * k) - PAD), max(0, int(y0 * k) - PAD)
        bx1, by1 = min(im.width, int(x1 * k + 0.999) + PAD), min(im.height, int(y1 * k + 0.999) + PAD)
        piece = im.crop((bx0, by0, bx1, by1))
        pivot = [round(f['pivot'][0] * k - bx0, 2), round(f['pivot'][1] * k - by0, 2)]
        pieces.append((f, piece, pivot))
    # shelf pack: one row per character and state
    pieces.sort(key=lambda t: (t[0]['character'], t[0]['state']))
    rows, x, y, rh, W = [], 0, 0, 0, 0
    place = {}
    key = None
    for f, piece, pivot in pieces:
        k2 = (f['character'], f['state'])
        if k2 != key:
            if key is not None: y += rh + PAD; x = 0; rh = 0
            key = k2
        place[f['id']] = (x, y)
        x += piece.width + PAD; rh = max(rh, piece.height); W = max(W, x)
    H = y + rh
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for f, piece, pivot in pieces:
        atlas.paste(piece, place[f['id']])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    atlas.save(OUT, optimize=True)
    # the frame table
    sprites_path = os.path.join(ROOT, 'data', 'sprites.json')
    sprites = json.load(open(sprites_path))
    for who in ['set', 'somang', 'horus']:
        idle, walk = {}, {d: [None, None, None] for d in DIRS}
        for f, piece, pivot in pieces:
            if f['character'] != who: continue
            rect = [*place[f['id']], piece.width, piece.height, *pivot]
            if f['state'] == 'idle': idle[f['gameDirection']] = rect
            else: walk[f['gameDirection']][f['phase']] = rect
        offsets = {d: cycle['defaultOffsets'] for d in DIRS}
        if who == 'horus': offsets['down'] = cycle['horusDownOffsets']
        sprites['looks'][who]['motion'] = {
            'file': 'art/characters/trio-motion.png', 'visible': VISIBLE, 'height': HEIGHT,
            'idle': idle, 'walk': walk, 'sequence': cycle['sequence'], 'frameMs': cycle['previewFrameDurationMs'],
            # whole-sprite shifts while walking, in source walk-cell pixels (330 = the walk cell's visible height)
            'offsets': offsets, 'offsetRef': man['frames'][1]['referenceVisibleHeight'],
        }
    with open(sprites_path, 'w') as fh:
        fh.write(compact(json.dumps(sprites, ensure_ascii=False, indent=1)) + '\n')
    print('atlas', atlas.size, os.path.getsize(OUT) // 1024, 'KB')


def compact(text):
    # the file is written with one-space indents; number lists (rects, offsets) go on one line
    import re
    return re.sub(r'\[\s*(-?[\d.]+(?:,\s*-?[\d.]+)*)\s*\]', lambda m: '[' + ', '.join(x.strip() for x in m.group(1).split(',')) + ']', text)


if __name__ == '__main__':
    main()
