# buildings drawn at three quarters from above: a flat roof you look down on, the front wall with its door and windows
import sys, random
sys.path.insert(0, '.')
from px import Pic, preview, to_grid, padded
LINE = '#3B2A24'
UP = 14   # how far a building's picture rises above its own tiles (the roof's parapet, things on the roof)

ROOF = ['#F0DCB2', '#E3CB9C', '#D2B587', '#BE9C6E']      # roof top: light, base, shade, rim shadow
WALL = ['#EBCB98', '#DDB988', '#C9A271', '#B08A5C']      # front wall: light, base, shade, foot
WOOD = ['#A87A4E', '#8A5E38', '#6E4628']
DARK = '#3A2618'

def window(p, x, y):
    p.rect(x - 1, y - 1, 9, 1, WOOD[0]); p.rect(x, y, 7, 6, DARK); p.rect(x + 3, y, 1, 6, WOOD[1]); p.rect(x, y, 7, 1, '#24170E')
    p.rect(x - 1, y + 6, 9, 1, WALL[0]); p.rect(x - 1, y + 7, 9, 1, WALL[3])

def door(p, x, y, h, awning=None):
    p.rect(x - 2, y - 2, 14, h + 2, WALL[0]); p.rect(x, y, 10, h, DARK); p.rect(x, y, 10, 2, '#24170E'); p.rect(x + 4, y + 2, 1, h - 2, '#2A1B10')
    p.rect(x - 2, y + h, 14, 1, WALL[3])
    if awning:
        a, b = awning
        for k in range(16):
            p.rect(x - 3 + k, y - 7, 1, 4, a if (k // 2) % 2 == 0 else b)
        for k in range(0, 16, 2): p.put(x - 3 + k, y - 3, a if (k // 2) % 2 == 0 else b)
        p.rect(x - 3, y - 8, 16, 1, '#FFF4E0')

def jar(p, x, y):
    p.rect(x, y, 4, 5, '#B0703A'); p.rect(x + 1, y - 1, 2, 1, '#8A5428'); p.put(x, y, '#D08A4A'); p.put(x, y + 1, '#D08A4A')

def house(w, h, seed=0, awning=('#2F6FB6', '#F2E8DA'), roof_things=True, sign=None):
    r = random.Random(seed)
    W, H = w * 16, h * 16 + UP
    p = Pic(W, H)
    roof_h = max(14, int(H * .42))
    # the roof top, seen from above: a raised rim all round, a little shade under the rim at the back
    p.rect(0, 0, W, roof_h, ROOF[0]); p.rect(2, 2, W - 4, roof_h - 4, ROOF[1]); p.rect(2, 2, W - 4, 2, ROOF[3])
    p.rect(0, roof_h - 2, W, 2, ROOF[2])
    if roof_things:
        jar(p, 5, 5); jar(p, 10, 6)
        if W > 56: p.rect(W - 22, 6, 14, 5, '#C9A46A'); p.rect(W - 22, 6, 14, 1, '#E0C08A'); [p.put(W - 20 + k * 3, 8, '#7A3A1E') for k in range(4)]
    # the front wall
    p.rect(0, roof_h, W, H - roof_h, WALL[1]); p.rect(0, roof_h, W, 2, WALL[3]); p.rect(0, roof_h + 2, 2, H - roof_h - 2, WALL[0]); p.rect(W - 2, roof_h + 2, 2, H - roof_h - 2, WALL[2])
    p.rect(0, H - 3, W, 3, WALL[3])
    for k in range(6):   # a few mud bricks showing through
        bx, by = r.randint(4, W - 10), r.randint(roof_h + 5, H - 8)
        p.rect(bx, by, 5, 1, WALL[2])
    dh = min(16, H - roof_h - 5)
    dx = W // 2 - 5
    door(p, dx, H - dh - 2, dh, awning)
    for wx in range(8, W - 14, 22):
        if abs(wx + 3 - W // 2) < 13: continue
        window(p, wx, roof_h + 6)
    if sign: sign(p, dx, H - dh - 2)
    p = padded(p); p.outline(LINE)
    return p

def stall(w, h):
    W, H = w * 16, h * 16 + UP
    p = Pic(W, H)
    # an awning sloping toward us in red and white, on two posts, over a counter of goods
    for k in range(0, W, 8):
        p.rect(k, 0, 4, 12, '#D4612C'); p.rect(k + 4, 0, 4, 12, '#F6EEE0')
        p.rect(k, 12, 4, 2, '#B54E22'); p.rect(k + 4, 12, 4, 2, '#D8CFC0')
    p.rect(0, 0, W, 1, '#FFF8EC')
    for k in range(0, W, 4): p.rect(k + 1, 14, 2, 2, '#D4612C' if k % 8 < 4 else '#F6EEE0')
    p.rect(2, 14, 2, H - 14, WOOD[1]); p.rect(W - 4, 14, 2, H - 14, WOOD[1])
    p.rect(3, H - 12, W - 6, 10, WOOD[0]); p.rect(3, H - 12, W - 6, 2, '#C49A68'); p.rect(3, H - 3, W - 6, 1, WOOD[2])
    goods = [('#D9733A', '#F2A060'), ('#7FA650', '#A8D07A'), ('#8E5BA8', '#B88AD6'), ('#E0B040', '#F6D878'), ('#C0392B', '#E86A5A')]
    for k in range((W - 12) // 9):
        x = 6 + k * 9; c, hi = goods[k % len(goods)]
        p.rect(x, H - 17, 8, 5, '#C9A46A'); p.rect(x, H - 17, 8, 1, '#E0C08A')
        p.rect(x + 1, H - 19, 6, 3, c); p.rect(x + 2, H - 20, 3, 1, hi); p.put(x + 2, H - 19, hi)
    p = padded(p); p.outline(LINE)
    return p

def scroll_sign(p, x, y):
    p.rect(x - 1, y - 12, 12, 7, '#F2E6C8'); p.rect(x - 2, y - 12, 1, 7, WOOD[0]); p.rect(x + 11, y - 12, 1, 7, WOOD[0])
    for k in range(3): p.rect(x + 1, y - 10 + k * 2, 8, 1, '#8E7458')

def oven_vent(p):
    p.rect(p.w - 16, 1, 6, 9, '#B98A5E'); p.rect(p.w - 16, 1, 6, 2, '#D3A57A'); p.rect(p.w - 15, 3, 4, 2, '#2B1A10')

def temple(w, h):
    W, H = w * 16, h * 16 + UP + 10
    p = Pic(W, H)
    lime = ['#F4EAD4', '#E8DABD', '#D6C5A2', '#BFA984', '#A8916C']
    top = UP + 10
    # the hall behind, its roof seen from above
    p.rect(30, top - 4, W - 60, H - top + 4, lime[2]); p.rect(30, top - 4, W - 60, 6, lime[0]); p.rect(30, top + 2, W - 60, 1, lime[3])
    for k in range(4):
        cx = 36 + k * 16 + (8 if k > 1 else 0)
        if abs(cx + 3 - W // 2) < 15: continue
        p.rect(cx, top + 10, 8, H - top - 10, lime[1]); p.rect(cx, top + 10, 2, H - top - 10, lime[0]); p.rect(cx + 6, top + 10, 2, H - top - 10, lime[3])
        p.rect(cx - 2, top + 6, 12, 4, '#7FA650'); p.rect(cx - 1, top + 5, 10, 1, '#A8D07A'); p.rect(cx - 2, top + 9, 12, 1, '#D9B65A')
    # two pylons, sloping, with a cornice, bands and painted figures
    for (px, flip) in ((0, False), (W - 36, True)):
        for r in range(top - 8, H):
            inset = max(0, (H - r) // 9)
            x0 = px if flip else px + inset
            p.rect(x0, r, 36 - inset, 1, lime[1] if r > top - 3 else lime[0])
            p.put(x0 if not flip else x0 + 36 - inset - 1, r, lime[3] if not flip else lime[2])
        p.rect(px + (0 if flip else 7), top - 8, 29, 3, lime[0]); p.rect(px + (0 if flip else 7), top - 5, 29, 2, '#4F7FB0'); p.rect(px + (0 if flip else 7), top - 3, 29, 1, '#D9B65A')
        # one big relief on each pylon: a figure with a raised arm before a sun disc
        fx = px + 13 + (0 if not flip else 2)
        fy = top + 12
        rel = lime[3]
        p.rect(fx + 3, fy, 3, 3, rel); p.rect(fx + 2, fy + 3, 5, 9, rel); p.rect(fx + 3, fy + 12, 1, 7, rel); p.rect(fx + 5, fy + 12, 1, 7, rel)
        p.rect(fx + 7 if not flip else fx - 3, fy + 4, 3, 1, rel); p.rect(fx + 9 if not flip else fx - 4, fy + 1, 1, 3, rel)
        p.ellipse(fx + 4.5, fy - 4, 2.5, 2.5, '#E0B040')
        p.rect(px + 8, H - 10, 22, 1, lime[3]); p.rect(px + 8, top + 3, 22, 1, lime[3])
        # a flagpole in front of each pylon, rising high
        fx = px + 30 if not flip else px + 4
        p.rect(fx, 0, 2, H - 6, WOOD[1]); p.put(fx, 0, '#D9B65A'); p.put(fx + 1, 0, '#D9B65A')
        c = '#2F6FB6' if not flip else '#C0392B'
        if not flip: p.rect(fx - 8, 2, 8, 5, c); p.rect(fx - 6, 7, 6, 2, c); p.rect(fx - 8, 2, 8, 1, '#FFFFFF')
        else: p.rect(fx + 2, 2, 8, 5, c); p.rect(fx + 2, 7, 6, 2, c); p.rect(fx + 2, 2, 8, 1, '#FFFFFF')
    # the great door with the winged sun over it
    dx, dy = W // 2 - 10, H - 32
    p.rect(dx - 4, dy - 9, 28, 41, lime[1]); p.rect(dx - 5, dy - 10, 30, 3, lime[0])
    p.rect(dx, dy, 20, 32, '#2E1F14'); p.rect(dx, dy, 20, 3, '#1E140C')
    p.rect(dx + 8, dy - 8, 4, 3, '#E0B040'); p.rect(dx + 1, dy - 7, 7, 1, '#4F7FB0'); p.rect(dx + 12, dy - 7, 7, 1, '#4F7FB0'); p.rect(dx + 3, dy - 6, 5, 1, '#C0392B'); p.rect(dx + 12, dy - 6, 5, 1, '#C0392B')
    p = padded(p); p.outline(LINE)
    return p

def duat_gate(w, h):
    W, H = w * 16 + 10, h * 16 + UP
    p = Pic(W, H)
    S = ['#A99682', '#8E7C68', '#76654F', '#5E5040']
    p.ellipse(W / 2, H * .55, W / 2 - .5, H * .55, None, lambda dx, dy: S[0] if dx + dy < -.7 else S[1] if dx + dy < .3 else S[2])
    p.rect(0, H - 6, W, 6, S[2])
    p.rect(8, 12, W - 16, H - 12, '#140D09'); p.rect(8, 12, W - 16, 2, '#6B3FA0'); p.rect(8, 14, 1, H - 14, '#5B3590'); p.rect(W - 9, 14, 1, H - 14, '#5B3590')
    p.rect(W // 2 - 2, 4, 4, 4, '#D9B65A'); p.rect(W // 2 - 1, 5, 2, 2, '#2B2018')
    p = padded(p); p.outline(LINE)
    return p

def build_all():
    return {
        'bld_scriptorium': house(6, 4, 1, awning=('#4F7FB0', '#F2E8DA'), sign=scroll_sign),
        'bld_kitchen': house(4, 3, 2, awning=('#D4612C', '#F6EEE0'), sign=lambda p, x, y: oven_vent(p)),
        'bld_houses1': house(4, 2, 3, awning=('#5E8C46', '#F2E8DA')),
        'bld_market': stall(5, 2),
        'bld_temple': temple(8, 5),
        'bld_duat': duat_gate(2, 2),
    }

if __name__ == '__main__':
    b = build_all()
    k = b['bld_kitchen']; oven_vent(k)
    preview(list(b.values()), 'buildings.png', z=3)
