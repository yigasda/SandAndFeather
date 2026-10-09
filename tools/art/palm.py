import math, sys
sys.path.insert(0, '.')
from px import Pic, preview
LINE = '#3B2A24'
TR = ['#B07E4E', '#946538', '#7A4F2B', '#C99668']
LF = ['#B2DB6E', '#8CC152', '#6AA03E', '#4C7E2F', '#386224']

def frond(p, cx, cy, ang, L, arch, wmax, tone=0):
    # a broad leaf: centre line arching out from the crown, widest a third of the way, pointed at the tip;
    # the upper half lit, the lower half in shade with notches like leaflets
    a = math.radians(ang)
    ux, uy = math.cos(a), math.sin(a)
    nx, ny = -uy, ux                      # the normal; with ux>0 this points down
    if ny < 0 or (abs(ny) < 1e-6 and nx < 0): nx, ny = -nx, -ny   # make "o > 0" the lower side
    steps = int(L * 3)
    for s in range(steps + 1):
        t = s / steps
        bx = cx + ux * L * t
        by = cy + uy * L * t + arch * (t * t * 1.6 - t * .6) * L / 10
        w = wmax * math.sin(math.pi * min(1, t ** .75)) * (1.05 - t * .25)
        notch = (s // 3) % 3 == 0
        o = -w
        while o <= w:
            x, y = bx + nx * o, by + ny * o
            if o > w * .45 and notch and t > .2: o += .5; continue
            if abs(o) < .6: c = LF[2 + tone]
            elif o < 0: c = LF[0 + tone] if o < -w * .4 else LF[1 + tone]
            else: c = LF[2 + tone] if o < w * .6 else LF[3 + tone]
            p.put(x, y, c)
            o += .5

def palm(lean=0):
    p = Pic(50, 50)
    cx, cy = 25 + lean, 16
    for y in range(cy + 1, 48):
        t = (y - cy) / (48 - cy)
        x0 = cx + (25 - cx) * t
        w = 3 + t * 2.2
        for x in range(int(round(x0 - w / 2)), int(round(x0 + w / 2)) + 1):
            rel = (x - (x0 - w / 2)) / max(1, w)
            c = TR[3] if rel < .3 else TR[0] if rel < .72 else TR[1]
            if (y - cy) % 4 == 0: c = TR[2] if rel > .25 else TR[1]
            p.put(x, y, c)
    # each frond drawn and outlined on its own, back to front, so they stay apart
    def one(ang, L, arch, w, tone=0, dy=0):
        q = Pic(p.w, p.h); frond(q, cx, cy + dy, ang, L, arch, w, tone); q.outline(LINE); p.paste(q, 0, 0)
    one(-120, 13, 6, 3.5, 1); one(-60, 13, 6, 3.5, 1)
    one(-160, 19, 9, 3.8); one(-20, 19, 9, 3.8)
    one(152, 13, 6, 3.5, 0, 1); one(28, 13, 6, 3.5, 0, 1)
    p.ellipse(cx, cy, 3.2, 2.6, None, lambda dx, dy: LF[1] if dy < -.2 else LF[2])
    for (x, y, c) in [(cx - 2, cy + 3, '#C0602E'), (cx - 1, cy + 4, '#E08A4A'), (cx + 1, cy + 3, '#C0602E'), (cx + 2, cy + 4, '#D9773A'), (cx, cy + 4, '#A84F24')]:
        p.put(x, y, c)
    p.outline(LINE)
    return p

if __name__ == '__main__':
    preview([palm(0), palm(2), palm(-2)], 'palm.png', z=6)
