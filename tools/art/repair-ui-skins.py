# Repairs crops that caught pixels from around the frame in the concept (run after pack-ui-skins.cjs).
# Every visible pixel stays source RGB: a repair only makes background transparent or moves source pixels
# (copy), and each one is written to provenance.json so verify-ui-source-pixels.cjs can replay it.
#   clearGray   transparent where a pixel in rect is grey/white/black/cream (a quantity numeral and its plate);
#               keepGreen spares the item's leaves
#   floodClear  transparent from the image edge inward while the colour stays near one of `colors`
#   copy        source pixels from `from` to `to`, optionally mirrored ('x')
# The action buttons are cut separately (cut-action-buttons.py).
import json, os, re, sys
from collections import deque
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'art', 'ui', 'skins')
REPAIRS = {
    # the quantity "2" of the concept's inventory sits on the item's corner
    'temple/item-lotus': [{'op': 'clearGray', 'rect': [56, 40, 11, 16], 'spread': 64, 'keepGreen': True}],
    'temple/item-scroll': [{'op': 'clearGray', 'rect': [41, 38, 13, 19], 'spread': 64}],
    # the orange row behind the selected entry, and a paper line above it
    'journal/item-lotus': [{'op': 'floodClear', 'colors': [[252, 152, 74], [243, 172, 94], [253, 238, 204]], 'tol': 62}],
    # the white page around the selected slot
    'walnut/selected': [{'op': 'floodClear', 'colors': [[250, 250, 250], [200, 200, 200], [160, 160, 155], [95, 95, 90]], 'tol': 40}],
    # the blank-paper patch over the title shows as a darker box: paper from beside it, same rows
    'temple/header-full': [{'op': 'copy', 'from': [303, 41, 42, 30], 'to': [345, 41]},
                           {'op': 'copy', 'from': [303, 41, 42, 30], 'to': [387, 41], 'flip': 'x'}],
}


def near(c, colors, tol):
    return any(sum((c[i] - k[i]) ** 2 for i in range(3)) <= tol * tol for k in colors)


def apply(im, ops):
    px = im.load()
    w, h = im.size
    for o in ops:
        if o['op'] == 'clearGray':
            x0, y0, rw, rh = o['rect']
            for y in range(y0, min(h, y0 + rh)):
                for x in range(x0, min(w, x0 + rw)):
                    r, g, b, a = px[x, y]
                    if o.get('keepGreen') and g > r + 5:
                        continue
                    if a and max(r, g, b) - min(r, g, b) <= o['spread']:
                        px[x, y] = (r, g, b, 0)
        elif o['op'] == 'floodClear':
            seen, q = set(), deque()
            for x in range(w):
                q.extend([(x, 0), (x, h - 1)])
            for y in range(h):
                q.extend([(0, y), (w - 1, y)])
            while q:
                x, y = q.popleft()
                if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
                    continue
                seen.add((x, y))
                r, g, b, a = px[x, y]
                if a and not near((r, g, b), o['colors'], o['tol']):
                    continue
                px[x, y] = (r, g, b, 0)
                q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
        elif o['op'] == 'copy':
            fx, fy, fw, fh = o['from']
            tx, ty = o['to']
            src = im.crop((fx, fy, fx + fw, fy + fh))
            if o.get('flip') == 'x':
                src = src.transpose(Image.FLIP_LEFT_RIGHT)
            im.paste(src, (tx, ty))
            px = im.load()
    return im


def main():
    prov_path = os.path.join(ROOT, 'provenance.json')
    prov = json.load(open(prov_path))
    for key, ops in REPAIRS.items():
        theme, asset = key.split('/')
        rec = next(r for r in prov if r['theme'] == theme and r['asset'] == asset)
        if rec.get('repairs') == ops and '--force' not in sys.argv:
            continue  # already applied to this pack
        path = os.path.join(ROOT, theme, asset + '.png')
        apply(Image.open(path).convert('RGBA'), ops).save(path)
        rec['repairs'] = ops
        print('repaired', key)
    save_provenance(prov_path, prov)


def save_provenance(path, prov):
    # pixel lists stay on one line each
    s = json.dumps(prov, indent=2)
    s = re.sub(r'\n( *)"pixels": \[(.*?)\n\1\]', lambda m: '\n' + m.group(1) + '"pixels": ' + json.dumps(json.loads('[' + m.group(2) + ']'), separators=(',', ':')), s, flags=re.S)
    with open(path, 'w') as f:
        f.write(s + '\n')


if __name__ == '__main__':
    main()
