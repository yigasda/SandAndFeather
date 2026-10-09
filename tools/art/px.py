# a tiny pixel-art toolkit: draw with named colours on a grid, trace an outline, preview, export as letter grids
import math
from PIL import Image

class Pic:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.p = [[None] * w for _ in range(h)]
    def put(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h and c is not None: self.p[y][x] = c
    def get(self, x, y):
        return self.p[y][x] if 0 <= x < self.w and 0 <= y < self.h else None
    def rect(self, x, y, w, h, c):
        for j in range(h):
            for i in range(w): self.put(x + i, y + j, c)
    def ellipse(self, cx, cy, rx, ry, c, shade=None):
        # shade(dx, dy) -> colour, dx dy in -1..1 from the centre
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                dx, dy = (x + .5 - cx) / rx, (y + .5 - cy) / ry
                if dx * dx + dy * dy <= 1: self.put(x, y, shade(dx, dy) if shade else c)
    def blob(self, pts, c):
        for (x, y) in pts: self.put(x, y, c)
    def outline(self, col, inner=False):
        # a line around every filled shape; diagonal gaps closed too for a clean pixel-art edge
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.p[y][x] is not None: continue
                if any(self.get(x + a, y + b) not in (None, col) for a, b in ((1,0),(-1,0),(0,1),(0,-1))): add.append((x, y))
        for x, y in add: self.p[y][x] = col
    def paste(self, other, ox, oy):
        for y in range(other.h):
            for x in range(other.w):
                c = other.p[y][x]
                if c is not None: self.put(ox + x, oy + y, c)

def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)

def preview(pics, path, z=6, bg='#E8CC97', gap=4):
    W = sum(p.w for p in pics) + gap * (len(pics) + 1); H = max(p.h for p in pics) + gap * 2
    img = Image.new('RGBA', (W * z, H * z), hexc(bg))
    x = gap
    for p in pics:
        for j in range(p.h):
            for i in range(p.w):
                c = p.p[j][i]
                if c is None: continue
                for a in range(z):
                    for b in range(z): img.putpixel(((x + i) * z + a, (gap + H - gap * 2 - p.h + j) * z + b), hexc(c))
        x += p.w + gap
    img.save(path)

def to_grid(p):
    # colours → letters; returns { colors, rows }
    letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    cols = {}
    rows = []
    for row in p.p:
        s = ''
        for c in row:
            if c is None: s += '.'; continue
            if c not in cols: cols[c] = letters[len(cols)]
            s += cols[c]
        rows.append(s)
    return {'colors': {v: k for k, v in cols.items()}, 'rows': rows}

def padded(p, m=1):
    q = Pic(p.w + 2 * m, p.h + 2 * m); q.paste(p, m, m); return q
