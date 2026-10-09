"""OMBOS building study: shared materials, upper-left light, 1px outlines.

Sizes are map footprints in 16px tiles. Pictures can rise above those footprints;
paint.js already splits the overhang onto the layer above people. Footprints remain separate from picture heights.
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
    W, H = w * 16, h * 16 + 30
    p = Pic(W, H)
    # Recessed back of the booth. An open side separates the front posts from it.
    p.rect(8, 24, W - 16, 20, '#6B503D')
    p.rect(8, 27, W - 16, 7, C['deep'])
    for x in (5, W - 8):
        framed(p, x, 19, 3, H - 19, C['woodlit'])
        p.rect(x + 2, 30, 1, H - 31, C['deep'])
    # Counter: a visible horizontal top, then the lower, darker front board.
    framed(p, 10, H - 21, W - 20, 17, C['wood'])
    p.rect(11, H - 20, W - 22, 9, C['woodlit'])
    p.rect(11, H - 20, W - 22, 2, C['wood'])
    p.rect(10, H - 11, W - 20, 1, C['creamShade'])
    p.rect(11, H - 10, W - 22, 5, C['wood'])
    p.rect(11, H - 6, W - 22, 2, '#6B503D')
    for x in (11, W - 14): p.rect(x, H - 4, 3, 4, LINE)
    produce = [('#70894E', '#A5B970', '#465B3B'),
               ('#A76554', '#CE8B72', '#794C41'),
               ('#DDC69E', '#F4E8CD', '#A88B62')]
    basket_w = (W - 30) // 3
    for i, (body, hi, shade) in enumerate(produce):
        x, y = 13 + i * (basket_w + 2), H - 24
        framed(p, x, y + 3, basket_w, 8, C['woodlit'])
        for dx, dy in ((2, 1), (7, 0), (11, 1), (4, 4), (9, 4)):
            p.ellipse(x + dx + 1, y + dy + 2, 2.5, 3, LINE)
            p.ellipse(x + dx + 1, y + dy + 2, 1.5, 2, body)
            p.put(x + dx, y + dy + 1, hi)
            p.put(x + dx + 1, y + dy + 3, shade)
        p.rect(x + 1, y + 9, basket_w - 2, 1, C['wood'])
    # 26px of canopy top, followed by only 3px of hanging cloth.
    # The broad top shades the empty space above the smaller, inset counter.
    for y in range(27):
        inset = 3 if y < 7 else 2 if y < 16 else 1
        p.rect(inset, y, W - inset * 2, 1, LINE)
        for x in range(inset + 1, W - inset - 1):
            red = (x // 8) % 2 == 0
            p.put(x, y, C['clay'] if red else C['cream'])
    p.rect(4, 0, W - 8, 1, C['rim'])
    for x in range(1, W - 1):
        red = (x // 8) % 2 == 0
        p.rect(x, 26, 1, 3, C['clayshade'] if red else C['creamShade'])
        p.put(x, 29, LINE)
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
    p.rect(tower, 35, W - tower * 2, 4, C['wood'])
    dx, dy = W // 2 - 11, H - 38
    # A projecting lintel, shaded inner jamb and a smaller, recessed opening.
    framed(p, dx - 7, dy - 6, 36, 37, C['stone'])
    p.rect(dx - 6, dy - 5, 34, 3, C['rim'])
    p.rect(dx - 6, dy - 2, 34, 2, C['wood'])
    p.rect(dx - 4, dy, 30, 29, C['wood'])
    p.rect(dx - 3, dy, 3, 29, C['stoneShade'])
    p.rect(dx, dy + 3, 22, 26, C['deep'])
    p.rect(dx + 22, dy, 3, 29, C['rim'])
    p.rect(dx - 6, dy + 1, 2, 28, C['roof'])
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
        for y in range(17, H - 3):
            inset = max(0, (H - 4 - y) // 18)
            width = tower - inset * 2
            p.rect(tx + inset, y, width, 1, LINE)
            p.rect(tx + inset + 1, y, width - 2, 1, C['roof'])
            p.put(tx + inset + 1, y, C['rim'])
            p.rect(tx + tower - inset - 7, y, 6, 1, C['stoneShade'])
            p.put(tx + tower - inset - 2, y, C['wood'])
        # A deep flat top with a low rim, then a thick projecting cornice.
        framed(p, tx + 4, 0, tower - 8, 19, C['rim'])
        p.rect(tx + 7, 3, tower - 14, 11, C['roof'])
        p.rect(tx + 7, 3, tower - 14, 3, C['wood'])
        p.rect(tx + 7, 6, 2, 8, C['stoneShade'])
        p.rect(tx + 5, 15, tower - 10, 2, C['stone'])
        p.rect(tx + 5, 17, tower - 10, 3, C['wood'])
        p.rect(tx + 5, 20, tower - 10, 3, C['teal'])
        p.rect(tx + 5, 23, tower - 10, 1, C['gold'])
        p.rect(tx + 5, 24, tower - 10, 2, C['wood'])
        # A few large incised marks; no dense hieroglyph texture.
        for x, y in ((12, 31), (26, 34), (12, 38)):
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
        p.rect(tx + 1, H - 5, tower - 2, 2, C['wood'])
        p.rect(tx, H - 3, tower, 1, LINE)
    # Three shallow steps, their lit tops visible from the same viewpoint.
    for k in range(3):
        sx = dx - 2 - k * 2
        p.rect(sx, H - 9 + k * 3, 26 + k * 4, 3, C['wood'])
        p.rect(sx, H - 9 + k * 3, 26 + k * 4, 2, C['roof'])
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
