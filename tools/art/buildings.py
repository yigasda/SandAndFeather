"""OMBOS building study: shared materials, upper-left light, 1px outlines.

Sizes are map footprints in 16px tiles. Pictures can rise above those footprints;
paint.js already splits the overhang onto the layer above people. No map edits.
"""
from px import Pic, preview, to_grid, padded
from house5 import C, LINE, house as flat_house, framed

UP = 14


def finish(p):
    p = padded(p)
    p.outline(LINE)
    return p


def house(w, h, kind='house'):
    rise = {'house': 18, 'scribe': 10, 'kitchen': 12}
    colors = {'house': ('#70894E', '#465B3B'),
              'scribe': (C['stone'], C['stoneShade']),
              'kitchen': (C['clay'], C['clayshade'])}
    return flat_house(w * 16, h * 16 + rise[kind], awning_colors=colors[kind], kind=kind)


def stall(w, h):
    W, H = w * 16, h * 16 + UP
    p = Pic(W, H)
    # Posts and the recessed, shaded space beneath the canopy.
    p.rect(4, 18, W - 8, 17, C['wood'])
    p.rect(5, 19, W - 10, 7, C['deep'])
    for x in (3, W - 6):
        framed(p, x, 14, 3, H - 14, C['woodlit'])
    # Three baskets, with a broad tabletop visible around them.
    framed(p, 7, H - 14, W - 14, 11, C['wood'])
    p.rect(8, H - 13, W - 16, 4, C['woodlit'])
    p.rect(8, H - 9, W - 16, 1, C['creamShade'])
    p.rect(8, H - 4, W - 16, 1, C['deep'])
    produce = [('#70894E', '#A5B970', '#465B3B'),
               ('#A76554', '#CE8B72', '#794C41'),
               ('#DDC69E', '#F4E8CD', '#A88B62')]
    basket_w = (W - 22) // 3
    for i, (body, hi, shade) in enumerate(produce):
        x, y = 10 + i * (basket_w + 2), H - 21
        framed(p, x, y + 3, basket_w, 7, C['woodlit'])
        p.rect(x + 1, y + 8, basket_w - 2, 1, C['wood'])
        for dx, dy in ((2, 1), (7, 0), (12, 1), (4, 4), (10, 4)):
            p.ellipse(x + dx + 2, y + dy + 2, 3, 3, LINE)
            p.ellipse(x + dx + 2, y + dy + 2, 2, 2, body)
            p.put(x + dx + 1, y + dy + 1, hi)
            p.put(x + dx + 2, y + dy + 3, shade)
        p.rect(x + 1, y + 8, basket_w - 2, 1, C['woodlit'])
    # The canvas has a broad top plane and a short shaded hem, not a curtain.
    for y in range(19):
        inset = 2 if y < 5 else 1 if y < 12 else 0
        p.rect(inset, y, W - inset * 2, 1, LINE)
        for x in range(inset + 1, W - inset - 1):
            red = (x // 8) % 2 == 0
            p.put(x, y, C['clay'] if red else C['cream'])
    p.rect(3, 0, W - 6, 1, C['rim'])
    for x in range(1, W - 1):
        red = (x // 8) % 2 == 0
        p.put(x, 18, C['clayshade'] if red else C['creamShade'])
        p.put(x, 19, LINE)
        if x % 4 in (1, 2): p.put(x, 20, C['clay'] if red else C['cream'])
    return finish(p)


def ankh(p, x, y, color):
    p.rect(x + 2, y, 5, 5, color)
    p.rect(x + 3, y + 1, 3, 3, C['roof'])
    p.rect(x + 4, y + 5, 1, 12, color)
    p.rect(x, y + 7, 9, 2, color)


def temple(w, h):
    W, H = w * 16, h * 16 + UP
    p = Pic(W, H)
    tower = 43
    # Lower central gateway, visibly separate from the tall flanking pylons.
    framed(p, tower - 2, 27, W - tower * 2 + 4, H - 27, C['stone'])
    p.rect(tower, 28, W - tower * 2, 7, C['roof'])
    p.rect(tower, 28, W - tower * 2, 1, C['rim'])
    p.rect(tower, 35, W - tower * 2, 2, C['stoneShade'])
    dx, dy = W // 2 - 11, H - 35
    framed(p, dx - 4, dy - 5, 30, 36, C['roof'])
    p.rect(dx - 3, dy - 4, 28, 2, C['rim'])
    p.rect(dx - 2, dy - 1, 26, 31, C['stoneShade'])
    p.rect(dx, dy, 22, 29, C['deep'])
    p.rect(dx + 20, dy + 1, 2, 28, C['wood'])
    # Winged sun: two quiet teal wings and one gold disc.
    cx, sy = W // 2, 43
    for step in range(4):
        p.rect(cx - 17 + step * 2, sy + step, 12 - step * 2, 1, C['teal'])
        p.rect(cx + 5, sy + step, 12 - step * 2, 1, C['teal'])
    p.ellipse(cx, sy + 2, 4, 4, C['wood'])
    p.ellipse(cx, sy + 1, 3, 3, C['gold'])
    p.put(cx - 1, sy - 1, C['rim'])
    # Pylons taper gently. Unlike houses, these intentionally have sloped sides.
    for tx in (0, W - tower):
        for y in range(11, H - 3):
            inset = max(0, (H - 4 - y) // 18)
            width = tower - inset * 2
            p.rect(tx + inset, y, width, 1, LINE)
            p.rect(tx + inset + 1, y, width - 2, 1, C['roof'])
            p.put(tx + inset + 1, y, C['rim'])
            p.rect(tx + tower - inset - 4, y, 3, 1, C['stone'])
        # One thin parapet round a small visible flat top.
        framed(p, tx + 5, 0, tower - 10, 13, C['rim'])
        p.rect(tx + 7, 2, tower - 14, 7, C['roof'])
        p.rect(tx + 7, 2, tower - 14, 2, C['wood'])
        p.rect(tx + 7, 4, 1, 5, C['stoneShade'])
        p.rect(tx + 6, 10, tower - 12, 2, C['stone'])
        p.rect(tx + 5, 13, tower - 10, 3, C['teal'])
        p.rect(tx + 5, 16, tower - 10, 1, C['gold'])
        for x in range(tx + 8, tx + tower - 6, 7): p.rect(x, 13, 2, 2, C['tealshade'])
        # A few large incised marks; no dense hieroglyph texture.
        for x, y in ((12, 24), (26, 28), (12, 33)):
            p.rect(tx + x, y, 3, 3, C['stoneShade'])
            p.rect(tx + x, y + 3, 3, 1, C['rim'])
        ankh(p, tx + 17, 43, C['stoneShade'])
        p.rect(tx + 10, 41, 1, 33, C['stoneShade'])
        p.rect(tx + 31, 24, 1, 50, C['stoneShade'])
        p.rect(tx + 29, 24, 5, 2, C['stoneShade'])
        for y in (66, 71): p.rect(tx + 20, y, 4, 2, C['stoneShade'])
        p.rect(tx + 1, H - 13, tower - 2, 10, C['stone'])
        p.rect(tx + 1, H - 13, tower - 2, 1, C['rim'])
        for x in range(tx + 2, tx + tower - 2, 10): p.rect(x, H - 12, 1, 9, C['stoneShade'])
        p.rect(tx, H - 3, tower, 1, LINE)
    # Three shallow steps, their lit tops visible from the same viewpoint.
    for k in range(3):
        sx = dx - 2 - k * 2
        p.rect(sx, H - 6 + k * 2, 26 + k * 4, 2, C['stoneShade'])
        p.rect(sx, H - 6 + k * 2, 26 + k * 4, 1, C['rim'])
    return finish(p)


def duat_gate(w, h):
    # Keep the familiar rectangular gateway; only align stone, outline and light.
    W, H = w * 16 + 10, h * 16 + 8
    p = Pic(W, H)
    framed(p, 0, 0, W, H, C['stoneShade'])
    p.rect(1, 1, W - 2, 5, C['stone'])
    p.rect(1, 1, W - 2, 1, C['rim'])
    p.rect(1, 7, W - 2, 2, C['wood'])
    p.rect(8, 11, W - 16, H - 11, C['deep'])
    p.rect(8, 11, W - 16, 2, '#6B5685')
    p.rect(8, 13, 1, H - 13, '#6B5685')
    p.rect(W - 9, 13, 1, H - 13, '#6B5685')
    p.rect(1, 9, 2, H - 10, C['stone'])
    p.rect(W - 4, 9, 3, H - 10, C['wood'])
    p.rect(W // 2 - 3, 2, 6, 5, LINE)
    p.rect(W // 2 - 2, 3, 4, 3, C['gold'])
    p.put(W // 2, 4, C['deep'])
    return finish(p)


def build_all():
    return {
        'bld_scriptorium': house(6, 4, 'scribe'),
        'bld_kitchen': house(4, 3, 'kitchen'),
        'bld_houses1': house(4, 2),
        'bld_market': stall(5, 2),
        'bld_temple': temple(8, 5),
        'bld_duat': duat_gate(2, 2),
    }


if __name__ == '__main__':
    import argparse
    import json
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    target = parser.add_mutually_exclusive_group()
    target.add_argument('--write', type=Path, help='Update only building entries in an existing tiles.json')
    target.add_argument('--check', type=Path, help='Fail if saved building data differs from the generator')
    parser.add_argument('--preview', type=Path, help='Optional 3x contact sheet')
    args = parser.parse_args()
    buildings = build_all()
    if args.write:
        data = json.loads(args.write.read_text())
        data['things'].update({k: to_grid(v) for k, v in buildings.items()})
        args.write.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    if args.check:
        saved = json.loads(args.check.read_text())['things']
        changed = [k for k, v in buildings.items() if saved.get(k) != to_grid(v)]
        if changed:
            parser.exit(1, 'Building data needs regeneration: ' + ', '.join(changed) + '\n')
        print(f'{len(buildings)} building grids match the generator')
    if args.preview:
        preview(list(buildings.values()), str(args.preview), z=3, bg='#DEC394')
