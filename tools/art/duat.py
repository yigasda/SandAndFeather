"""Duat sandstone outcrop, in the game's native 16px tile scale.

Six broad rocks with different heights, quiet faces and light from upper left.
The existing doorway is painted separately in front of the central recess.
"""
from px import Pic, to_grid, preview

LINE = '#725338'
TOP = '#F7E4B9'
RIM = '#FFEECB'
FACE = '#D4AC72'
LIGHT = '#E6C58C'
SIDE = '#B2895C'
FOOT = '#AC8054'


def polygon(p, points, color):
    """Integer scanline fill, with no antialiasing or new pixel scale."""
    for y in range(min(v[1] for v in points), max(v[1] for v in points) + 1):
        hits = []
        for (x1, y1), (x2, y2) in zip(points, points[1:] + points[:1]):
            if min(y1, y2) <= y + .5 < max(y1, y2):
                hits.append(x1 + (y + .5 - y1) * (x2 - x1) / (y2 - y1))
        hits.sort()
        for a, b in zip(hits[::2], hits[1::2]):
            for x in range(int(a), int(b) + 1): p.put(x, y, color)


def rock(w, h, variant=0):
    p = Pic(w, h)
    cap = max(7, w // 3)
    silhouette = [(5, 1), (w - 9, 1), (w - 9, 3), (w - 4, 3),
                  (w - 2, 8), (w - 2, h - 9), (w - 4, h - 3),
                  (w - 10, h - 1), (6, h - 1), (2, h - 6), (1, 9)]
    polygon(p, silhouette, FACE)
    polygon(p, [(w - 8, 5), (w - 3, 8), (w - 3, h - 8),
                (w - 7, h - 2), (w - 12, h - 2), (w - 10, cap + 6)], SIDE)
    polygon(p, [(3, cap), (7, cap - 1), (6, h - 13), (4, h - 8), (2, h - 12)], LIGHT)
    polygon(p, [(5, 2), (w - 10, 2), (w - 10, 4), (w - 5, 4),
                (w - 4, cap - 2), (w - 10, cap + 1), (8, cap + 3), (2, cap)], TOP)
    p.rect(7, 2, max(1, w - 18), 1, RIM)
    p.rect(7, cap + 2, max(1, w - 19), 1, LIGHT)
    p.rect(8, h - 2, max(1, w - 18), 1, FOOT)
    # At most one short fault on a large face. No stippling or brick texture.
    if variant:
        yy = h // 2 + 3
        p.rect(w - 12, yy, 4, 1, SIDE)
        p.rect(w - 9, yy + 1, 2, 2, SIDE)
    p.outline(LINE)
    return p


def cliff():
    p = Pic(96, 96)
    # Back to front: a low shoulder, central saddle, high right peak and two feet.
    for x, y, w, h, variant in [
        (13, 22, 31, 57, 0), (29, 16, 33, 66, 0),
        (49, 3, 32, 80, 1), (76, 29, 27, 58, 0),
        (2, 47, 26, 46, 0), (72, 58, 26, 36, 1),
    ]:
        p.paste(rock(w, h, variant), x, y)
    return p


if __name__ == '__main__':
    import argparse
    import json
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--write', type=Path)
    mode.add_argument('--check', type=Path)
    parser.add_argument('--preview', type=Path)
    args = parser.parse_args()
    picture = cliff()
    if args.write:
        data = json.loads(args.write.read_text())
        data['things']['duat_cliff'] = to_grid(picture)
        args.write.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    if args.check:
        assert json.loads(args.check.read_text())['things']['duat_cliff'] == to_grid(picture)
        print('Duat cliff matches the generator')
    if args.preview: preview([picture], args.preview, z=4)
