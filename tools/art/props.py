import sys, math, random
sys.path.insert(0, '.')
from px import Pic, preview, to_grid
LINE = '#3B2A24'

def bush(seed=0):
    p = Pic(18, 15); G = ['#B2DB6E', '#8CC152', '#6AA03E', '#4C7E2F']
    sh = lambda dx, dy: G[0] if dx + dy < -.9 else G[1] if dx + dy < .1 else G[2] if dy < .6 else G[3]
    p.ellipse(6, 8.5, 5, 4.5, None, sh); p.ellipse(12, 8.5, 5, 4.5, None, sh); p.ellipse(9, 5.5, 5.2, 4.2, None, sh)
    if seed % 2: p.put(5, 7, '#E85A6A'); p.put(12, 6, '#E85A6A'); p.put(9, 10, '#E85A6A')
    p.outline(LINE); return p

def rocks():
    p = Pic(18, 13); S = ['#E6D2B0', '#CDB48E', '#AE936E', '#8E7556']
    sh = lambda dx, dy: S[0] if dx + dy < -.8 else S[1] if dx + dy < .2 else S[2] if dy < .5 else S[3]
    p.ellipse(6, 8, 5, 4, None, sh); p.ellipse(12.5, 9, 4, 3, None, sh); p.ellipse(9, 4.5, 3, 2.6, None, sh)
    p.outline(LINE); return p

def tuft(p, x, y, c, hi, shade):
    # a little clump: a fan of leaves with two round blossoms on top
    for (a, b, col) in ((-2, 2, '#6AA03E'), (-1, 2, '#8CC152'), (0, 3, '#6AA03E'), (1, 2, '#8CC152'), (2, 2, '#6AA03E'), (-1, 3, '#5C9238'), (1, 3, '#5C9238'), (0, 2, '#8CC152')):
        p.put(x + a, y + b, col)
    for (bx, by) in ((-1, 0), (2, -1)):
        for (a, b) in ((0, -1), (-1, 0), (1, 0), (0, 1), (-1, -1), (1, 1)):
            p.put(x + bx + a, y + by + b, c if (a, b) not in ((1, 1),) else shade)
        p.put(x + bx, y + by, hi)

COLS = [('#F2D25A', '#FFF6C8', '#D9A82A'), ('#EE6A78', '#FFE0E6', '#C84A58'), ('#F8F4EA', '#FFFFFF', '#D8CFC0'), ('#F59A4A', '#FFE6C8', '#D27A2E'), ('#B88AE6', '#F2E6FF', '#8E64C0')]

def flowers(seed=0):
    r = random.Random(seed); p = Pic(16, 16)
    for (x, y) in r.sample([(4, 4), (11, 3), (6, 11), (12, 10)], 3):
        c = r.choice(COLS); tuft(p, x, y, *c)
    p.outline(LINE); return p

def bed(seed=0):
    p = Pic(16, 16); c = COLS[seed % 3]
    for (x, y) in ((4, 3), (11, 3), (4, 10), (11, 10)): tuft(p, x, y, *c)
    p.outline(LINE); return p

def reeds(seed=0):
    r = random.Random(seed); p = Pic(16, 22)
    for k, x in enumerate((3, 6, 9, 12)):
        h = 13 + r.randint(0, 5)
        for y in range(22 - h, 22): p.put(x, y, '#6E9A44' if y % 3 else '#557F33')
        p.put(x - 1, 22 - h + 3, '#86B852'); p.put(x + 1, 22 - h + 5, '#86B852')
        if k % 2 == 0: p.rect(x - 0, 22 - h - 3, 1, 3, '#8E5E36'); p.put(x, 22 - h - 4, '#B07A48')
    p.outline(LINE); return p

def lily():
    p = Pic(14, 10)
    p.ellipse(6, 5, 5, 3.4, None, lambda dx, dy: '#7FB858' if dy < -.2 else '#5C9238')
    p.put(6, 5, '#3F6E2A'); p.put(7, 5, '#3F6E2A'); p.put(8, 4, '#3F6E2A')
    p.ellipse(9, 3, 2, 1.6, None, lambda dx, dy: '#F6C8D8' if dy < 0 else '#E890B0')
    p.outline('#2C4A60'); return p

if __name__ == '__main__':
    preview([bush(0), bush(1), rocks(), flowers(0), flowers(1), flowers(2), bed(0), bed(1), bed(2), reeds(0), lily()], 'props.png', z=6, bg='#8CC152')
