# an ordinary flat-roofed house, after Astra's study: straight side walls, one thin parapet, a short shade
# inside it, the roof one step lighter than the front wall (about 55:45), a door the size of a person under an
# awning, a threshold on the ground. Light from the top left; a one pixel outline.
import sys, random
sys.path.insert(0, '.')
from px import Pic, preview, padded
LINE = '#493B32'
C = {
    'rim': '#F8EDD2', 'roof': '#EEDCB4', 'roofshade': '#DCC69C', 'roofspeck': '#E4D0A6',
    'wall': '#C49A67', 'walllit': '#D2AA77', 'wallshade': '#B08A5A', 'wallfoot': '#A47F52',
    'deep': '#4A3526', 'wood': '#8D6949', 'woodlit': '#A9845F', 'sill': '#EEDCB4', 'stone': '#D9C49C',
}

def house(w=64, h=48, seed=0, awning=('#4E8C6A', '#F4EBD8'), windows=1, roof_things=('jar',)):
    r = random.Random(seed)
    p = Pic(w, h)
    RH = round(h * .55)                    # roof and parapet
    # the roof: a thin lit parapet all round, a short shade inside the back and left parapets
    p.rect(0, 0, w, RH, C['roof'])
    p.rect(0, 0, w, 2, C['rim']); p.rect(0, 0, 2, RH, C['rim']); p.rect(w - 2, 0, 2, RH, C['rim']); p.rect(0, RH - 2, w, 2, C['rim'])
    p.rect(2, 2, w - 4, 3, C['roofshade']); p.rect(2, 2, 2, RH - 4, C['roofshade'])
    for k in range(3): p.rect(r.randint(8, w - 14), r.randint(8, RH - 6), 3, 1, C['roofspeck'])
    if 'jar' in roof_things:
        x, y = w - 14, 8
        p.rect(x + 2, y + 6, 6, 2, C['roofshade'])
        p.rect(x, y + 1, 6, 6, '#B86E3E'); p.rect(x + 1, y, 4, 1, '#8A5230'); p.rect(x, y + 1, 2, 4, '#D08A55'); p.rect(x + 5, y + 2, 1, 5, '#8A5230')
    # the front wall: one step darker, straight sides, lit along the left edge, a darker foot with corner blocks
    p.rect(0, RH, w, h - RH, C['wall'])
    p.rect(0, RH, w, 1, C['wallshade'])
    p.rect(0, RH + 1, 2, h - RH - 1, C['walllit']); p.rect(w - 2, RH + 1, 2, h - RH - 1, C['wallshade'])
    p.rect(0, h - 3, w, 3, C['wallfoot'])
    for x0 in (0, w - 7): p.rect(x0, h - 6, 7, 6, C['stone']); p.rect(x0, h - 6, 7, 1, C['rim']); p.rect(x0 + 6, h - 5, 1, 5, C['wallshade'])
    # the door, the size of a person: a lit frame, a dark inside, an awning over it, a threshold
    dw, dh = 12, 16
    dx, dy = w // 2 - dw // 2, h - dh
    p.rect(dx - 2, dy - 2, dw + 4, dh + 2, C['stone']); p.rect(dx - 2, dy - 2, dw + 4, 1, C['rim'])
    p.rect(dx, dy, dw, dh, C['deep'])
    p.rect(dx + 8, dy + 2, 3, dh - 2, C['wood']); p.rect(dx + 8, dy + 2, 1, dh - 2, C['woodlit'])
    a, b = awning
    ax, aw = dx - 4, dw + 8
    for k in range(aw):                                    # the awning's top, seen from above, then its short hem
        col = a if (k // 3) % 2 == 0 else b
        p.rect(ax + k, dy - 7, 1, 3, col)
        p.put(ax + k, dy - 4, a if (k // 3) % 2 == 0 and k % 2 == 0 else C['deep'] if k % 2 else b)
    p.rect(ax, dy - 8, aw, 1, '#FFF8EA')
    p.rect(dx, dy - 3, dw, 2, C['deep'])                   # the shade under the awning
    for k in range(windows):
        wx = 8 if k == 0 else w - 16
        p.rect(wx - 1, RH + 5, 8, 1, C['stone']); p.rect(wx, RH + 6, 6, 6, C['deep']); p.rect(wx + 3, RH + 6, 1, 6, C['wood']); p.rect(wx - 1, RH + 12, 8, 1, C['stone'])
    p = padded(p); p.outline(LINE)
    return p

if __name__ == '__main__':
    preview([house(), house(96, 64, 1, ('#4F7FB0', '#F4EBD8'), 2), house(64, 56, 2, ('#B96F50', '#F4EBD8'))], 'house5.png', z=4, bg='#DEC394')
