import sys
sys.path.insert(0, '.')
from px import Pic, preview
LINE = '#3B2A24'
SOIL = ['#9A6E4B', '#B4865E', '#7B5436', '#6A4630']   # base, ridge light, furrow, deep

def soil(alt=0):
    p = Pic(16, 16)
    p.rect(0, 0, 16, 16, SOIL[0])
    # two ridges a tile: the lit top of each, the furrow below it
    for r in (0, 8):
        p.rect(0, r + 1, 16, 1, SOIL[1]); p.rect(0, r + 5, 16, 2, SOIL[2]); p.rect(0, r + 7, 16, 1, SOIL[3])
    for (x, y) in ((3 + alt * 6, 3), (11 - alt * 6, 11)): p.put(x, y, SOIL[2])
    return p

def crop(kind):
    q = Pic(12, 12)
    if kind == 'sprout':
        G = ['#A6D365', '#7DB348', '#4C7E2F']
        q.rect(5, 6, 2, 5, G[1]); q.rect(2, 5, 3, 2, G[0]); q.rect(7, 4, 3, 2, G[0]); q.put(1, 4, G[1]); q.put(10, 3, G[1]); q.rect(5, 10, 2, 1, G[2])
    elif kind == 'leafy':
        G = ['#B2DB6E', '#8CC152', '#6AA03E', '#4C7E2F']
        q.ellipse(6, 7, 4.6, 3.6, None, lambda dx, dy: G[0] if dy < -.3 and dx < .3 else G[1] if dy < .3 else G[2])
        q.ellipse(6, 4.5, 2.6, 2.2, None, lambda dx, dy: G[0] if dy < 0 else G[1])
        q.put(4, 7, G[3]); q.put(8, 7, G[3]); q.put(6, 9, G[3])
    else:  # wheat
        W = ['#F2D67A', '#DDB54E', '#B98E30', '#8E6A22']
        for i, x in enumerate((3, 5, 7, 9)):
            h = 8 - (i % 2)
            q.rect(x, 11 - h + 3, 1, h - 3, W[2])
            q.rect(x - (1 if i < 2 else 0), 11 - h, 2, 3, W[0] if i % 2 else W[1]); q.put(x, 11 - h - 1, W[0])
        q.rect(3, 9, 7, 1, W[3])
    q.outline(LINE)
    return q

def field(kind, w=5, h=3):
    p = Pic(16 * w, 16 * h)
    for j in range(h):
        for i in range(w):
            p.paste(soil((i + j) % 2), i * 16, j * 16)
            p.paste(crop(kind), i * 16 + 2, j * 16 + 1)
    return p

if __name__ == '__main__':
    preview([field('sprout'), field('leafy'), field('wheat')], 'farm.png', z=4)
