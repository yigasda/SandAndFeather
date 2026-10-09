"""OMBOS flat-roof houses. Pixel dimensions exclude the one-pixel outer outline.

The footprint belongs to the map; the renderer anchors the picture at its front
edge and puts the extra roof rows above characters walking behind the building.
Light comes from the upper left. Keep doors human-sized across all three houses.
"""
from px import Pic, preview, padded

LINE = '#493B32'
C = {
    'rim': '#F8EDD2', 'roof': '#EEDCB4', 'roofshade': '#BDA17B',
    'roofsoft': '#DCC69C', 'wall': '#C49A67', 'walllit': '#D2AA77',
    'wallshade': '#AD8358', 'wood': '#8D6949', 'woodlit': '#BC9465',
    'deep': '#392D25', 'stone': '#DDC69E', 'stoneShade': '#B69A73',
    'cream': '#F4E8CD', 'creamShade': '#D9C6A1',
    'clay': '#B96F50', 'claylit': '#D69869', 'clayshade': '#895640',
    'teal': '#57958E', 'tealshade': '#386D6A', 'gold': '#D2A460',
}


def framed(p, x, y, w, h, fill):
    p.rect(x, y, w, h, LINE)
    p.rect(x + 1, y + 1, w - 2, h - 2, fill)


def jar(p, x, y):
    """An outlined clay jar, 8 by 11 pixels, with a visible dark mouth."""
    p.rect(x + 2, y, 4, 2, LINE)
    p.rect(x + 1, y + 2, 6, 2, LINE)
    p.rect(x, y + 4, 8, 5, LINE)
    p.rect(x + 1, y + 9, 6, 2, LINE)
    p.rect(x + 2, y + 2, 4, 7, C['clay'])
    p.rect(x + 1, y + 4, 2, 4, C['claylit'])
    p.rect(x + 6, y + 4, 1, 5, C['clayshade'])
    p.rect(x + 2, y + 9, 4, 1, C['clayshade'])
    p.rect(x + 2, y + 1, 4, 1, C['claylit'])
    p.rect(x + 3, y + 2, 2, 1, C['deep'])


def awning(p, x, y, w, color, shade):
    # Broad top, one short hanging edge, a dark seam underneath. No diagonal walls.
    p.rect(x - 1, y, w + 2, 7, LINE)
    for k in range(w):
        stripe = (k // 4) % 2 == 0
        p.rect(x + k, y + 1, 1, 4, color if stripe else C['cream'])
        p.put(x + k, y + 5, shade if stripe else C['creamShade'])
    p.rect(x, y, w, 1, C['rim'])
    for px in (x - 1, x + w):
        p.rect(px, y + 6, 1, 4, C['wood'])
        p.put(px, y + 6, C['woodlit'])


def scrolls(p, x, y):
    for dx, dy in ((0, 3), (5, 0)):
        framed(p, x + dx, y + dy, 5, 9, C['creamShade'])
        p.rect(x + dx + 1, y + dy + 1, 3, 2, C['rim'])
        p.put(x + dx + 2, y + dy + 2, C['wood'])
        p.rect(x + dx + 1, y + dy + 4, 1, 3, C['cream'])


def house(w=64, h=50, awning_colors=('#70894E', '#465B3B'), kind='house'):
    p = Pic(w, h)
    roof_h = round(h * .52)
    # A single low parapet. Its inside casts a short shadow onto a quiet roof.
    p.rect(0, 0, w, roof_h, C['stoneShade'])
    p.rect(1, 1, w - 2, roof_h - 3, C['rim'])
    p.rect(3, 3, w - 6, roof_h - 7, C['roof'])
    p.rect(3, 3, w - 6, 2, C['roofshade'])
    p.rect(3, 5, 2, roof_h - 9, C['roofsoft'])
    p.rect(w - 3, 2, 1, roof_h - 4, C['wood'])
    p.rect(1, roof_h - 3, w - 2, 2, C['rim'])
    # Vertical sides and three broad material tones, rather than brick noise.
    p.rect(0, roof_h, w, h - roof_h, C['wall'])
    p.rect(0, roof_h, w, 2, C['wallshade'])
    p.rect(0, roof_h + 2, 2, h - roof_h - 2, C['walllit'])
    p.rect(w - 2, roof_h + 2, 2, h - roof_h - 2, C['wallshade'])
    p.rect(0, h - 3, w, 3, C['wallshade'])
    for x in (0, w - 7):
        framed(p, x, h - 7, 7, 7, C['stone'])
        p.rect(x + 1, h - 6, 5, 1, C['rim'])
        p.rect(x + 5, h - 5, 1, 4, C['stoneShade'])
    # Same 12 x 17 opening at every scale. The threshold stays inside the footprint.
    dx, dy = w // 2 - 6, h - 19
    framed(p, dx - 2, dy - 2, 16, 21, C['stone'])
    p.rect(dx - 1, dy - 1, 1, 17, C['rim'])
    p.rect(dx, dy, 12, 17, C['deep'])
    p.rect(dx + 11, dy + 1, 1, 16, C['wood'])
    p.rect(dx - 2, h - 2, 16, 1, C['rim'])
    p.rect(dx - 2, h - 1, 16, 1, C['stoneShade'])
    awning(p, dx - 3, dy - 6, 18, *awning_colors)
    wx, wy = 8, roof_h + 6
    framed(p, wx, wy, 7, 7, C['deep'])
    p.rect(wx - 1, wy - 1, 9, 1, C['stone'])
    p.rect(wx + 3, wy + 1, 1, 5, C['woodlit'])
    p.rect(wx - 1, wy + 7, 9, 1, C['rim'])
    if kind == 'scribe':
        scrolls(p, 10, 8)
        # Small linen sign with one ankh; a shaded reed work bench to the right.
        sx = dx + 17
        framed(p, sx, dy - 3, 8, 16, C['cream'])
        p.rect(sx + 2, dy, 4, 4, C['woodlit'])
        p.rect(sx + 3, dy + 1, 2, 2, C['cream'])
        p.rect(sx + 3, dy + 4, 2, 6, C['woodlit'])
        p.rect(sx + 1, dy + 5, 6, 1, C['woodlit'])
        bx, by = w - 21, h - 25
        for px in (bx, w - 3):
            p.rect(px, by, 2, 24, LINE)
            p.rect(px, by + 2, 1, 20, C['woodlit'])
        p.rect(bx - 1, by - 3, 22, 7, LINE)
        p.rect(bx, by - 2, 20, 3, C['woodlit'])
        p.rect(bx, by + 1, 20, 2, C['wood'])
        for xx in range(bx + 2, w - 2, 4): p.rect(xx, by - 2, 1, 3, C['creamShade'])
        framed(p, bx + 1, h - 10, 17, 6, C['wood'])
        p.rect(bx + 2, h - 9, 15, 2, C['woodlit'])
        scrolls(p, bx + 4, h - 19)
    elif kind == 'kitchen':
        # A low chimney with a dark flue; a clay bread oven at the front wall.
        framed(p, w - 15, 7, 9, 11, C['wallshade'])
        p.rect(w - 14, 8, 7, 3, C['stone'])
        p.rect(w - 12, 9, 3, 1, C['deep'])
        p.rect(w - 14, 12, 2, 5, C['walllit'])
        ox, oy = w - 18, h - 15
        p.ellipse(ox + 5, oy + 6, 6, 7, LINE)
        p.ellipse(ox + 5, oy + 6, 5, 6, C['clay'])
        p.rect(ox, oy + 5, 2, 5, C['claylit'])
        framed(p, ox + 3, oy + 6, 5, 6, C['deep'])
        p.rect(ox - 1, oy + 12, 12, 2, C['stoneShade'])
    else:
        p.rect(w - 14, 15, 8, 2, C['roofsoft'])
        jar(p, w - 16, 6)
        jar(p, w - 18, h - 12)
    p = padded(p)
    p.outline(LINE)
    return p


if __name__ == '__main__':
    preview([house()], 'house5.png', z=3, bg='#DEC394')
