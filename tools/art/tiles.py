# ground tiles as 16×16 letter grids; letters are shared colours, some of them change with the season
import sys, json, random
sys.path.insert(0, '.')
from px import Pic, preview

COLORS = {
    # grass
    'g': '#8CC152', 'G': '#A6D365', 'q': '#73A743', 'v': '#C2E58A',
    # sand
    's': '#ECD3A2', 'S': '#F0DCB4', 'd': '#E4C998', 'P': '#DCC08F', 'p': '#F2DEB6',
    # the stone road: cobbles, their lit tops, the gaps
    'c': '#E8DCC2', 'C': '#EBDFC7', 'k': '#DED1B6', 'K': '#E2D5BC',
    # temple floor slabs
    't': '#DDD3BC', 'T': '#E5DBC5', 'u': '#D5CAB3',
    # water: shallow, waves, deep
    'w': '#4F95D0', 'W': '#8CC0EA', 'x': '#3A7CBC', 'X': '#5E9DD6',
    # wet sand by the river
    'b': '#DCC294', 'B': '#C8AA78',
    # desert rock: the plateau top and the cliff face
    'r': '#D8B27E', 'R': '#E8C995', 'y': '#C29A6C', 'Y': '#A9825A', 'z': '#B4855A', 'Z': '#93673F', 'h': '#CB9C6E', 'L': '#5E3F2A',
    # cut stone walls: the cap you look down on, the face of blocks
    'm': '#E9D8B4', 'M': '#F6EAD0', 'i': '#D3BC93', 'e': '#D9BF92', 'E': '#BFA176', 'J': '#9C8058',
    # field soil: base, the lit ridge, the furrow, its shadow
    'o': '#9A6E4B', 'O': '#B4865E', 'n': '#7B5436', 'N': '#6A4630',
}
SEASONS = {
    'akhet': {'g': '#8CC152', 'G': '#A6D365', 'q': '#73A743', 'v': '#C2E58A', 'w': '#5591C2', 'W': '#93C2E6', 'x': '#3F79AF', 'X': '#6199CC'},
    'peret': {'g': '#86C24E', 'G': '#A2D663', 'q': '#69A23E', 'v': '#C6EA8C', 'w': '#4F95D0', 'W': '#8CC0EA', 'x': '#3A7CBC', 'X': '#5E9DD6'},
    'shemu': {'g': '#A9C25A', 'G': '#C4D676', 'q': '#8EA748', 'v': '#DCE79A', 'w': '#5C9FD3', 'W': '#9ACAEE', 'x': '#4486C2', 'X': '#6CA8DA'},
}

def grid(fill):
    return [[fill] * 16 for _ in range(16)]
def put(g, x, y, c):
    if 0 <= x < 16 and 0 <= y < 16: g[y][x] = c
def rows(g): return [''.join(r) for r in g]

def grass(seed):
    r = random.Random(seed); g = grid('g')
    # little blades: a light tip over a darker root, a few to a tile, never touching
    spots = [(3, 4), (11, 3), (7, 9), (2, 12), (12, 12), (9, 14)]
    for (x, y) in r.sample(spots, 3 + seed % 2):
        put(g, x, y + 1, 'q'); put(g, x + 2, y + 1, 'q'); put(g, x + 1, y, 'G'); put(g, x, y, 'v') if r.random() < .5 else None
    return rows(g)

def sand(seed):
    r = random.Random(seed); g = grid('s')
    for (x, y) in r.sample([(4, 3), (12, 6), (6, 12), (13, 13), (2, 8)], 2):
        put(g, x, y, 'd'); put(g, x + 1, y, 'd')
    if seed % 3 == 0:   # a pebble
        x, y = r.choice([(9, 9), (4, 10), (11, 4)])
        put(g, x, y, 'P'); put(g, x + 1, y, 'P'); put(g, x, y - 1, 'p'); put(g, x + 1, y - 1, 'S')
    return rows(g)

def cobble(seed):
    # big rounded paving stones in a running bond: a lit top edge, a shaded foot, soft gaps
    g = grid('k')
    stones = [(0, 0, 8, 8), (8, 0, 8, 8), (-4, 8, 8, 8), (4, 8, 8, 8), (12, 8, 8, 8)] if seed % 2 == 0 else \
             [(-4, 0, 8, 8), (4, 0, 8, 8), (12, 0, 8, 8), (0, 8, 8, 8), (8, 8, 8, 8)]
    for (x, y, w, h) in stones:
        for j in range(h - 1):
            for i in range(w - 1):
                if (i == 0 or i == w - 2) and (j == 0 or j == h - 2): continue
                cx = x + i
                if 0 <= cx < 16: put(g, cx, y + j, 'C' if j == 0 else 'K' if j == h - 2 else 'c')
    if seed % 2 == 0: put(g, 3, 4, 'K'); put(g, 11, 12, 'K')
    return rows(g)

def slab(seed):
    g = grid('t')
    for x in range(16): put(g, x, 15, 'u')
    for y in range(16): put(g, 15, y, 'u')
    for x in range(15): put(g, x, 0, 'T')
    for y in range(15): put(g, 0, y, 'T')
    if seed == 1: put(g, 9, 6, 'u'); put(g, 10, 7, 'u')
    return rows(g)

def water(seed, deep=False):
    r = random.Random(seed); b, hi = ('x', 'X') if deep else ('w', 'W')
    g = grid(b)
    for (x, y) in r.sample([(2, 3), (9, 5), (4, 10), (11, 12), (13, 2)], 2):
        put(g, x, y, hi); put(g, x + 1, y - 1, hi); put(g, x + 2, y - 1, hi); put(g, x + 3, y, hi)
    return rows(g)

def soil(seed):
    g = grid('o')
    for r in (0, 8):
        for x in range(16): put(g, x, r + 1, 'O'); put(g, x, r + 5, 'n'); put(g, x, r + 6, 'n'); put(g, x, r + 7, 'N')
    put(g, 3 + seed * 6, 3, 'n'); put(g, 11 - seed * 6, 11, 'n')
    return rows(g)

def rock_top(seed):
    r = random.Random(seed + 40); g = grid('r')
    # a few cracks and a stone set in the rock, lit from the top left
    x, y = r.choice([(3, 4), (9, 3), (5, 10)])
    for k in range(4): put(g, x + k, y + (k // 2), 'y')
    put(g, x + 4, y + 2, 'y')
    sx, sy = r.choice([(11, 10), (3, 12), (12, 5)])
    for (a, b) in ((0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1)): put(g, sx + a, sy + b, 'y')
    put(g, sx, sy - 1, 'R'); put(g, sx + 1, sy - 1, 'R'); put(g, sx + 2, sy + 2, 'Y'); put(g, sx + 3, sy + 1, 'Y')
    if seed == 2:
        for (a, b) in ((7, 13), (8, 13)): put(g, a, b, 'R')
    return rows(g)

def rock_face(seed):
    # the cliff where the rock ends: a lit, wavy overhang, then rounded columns of rock of uneven width
    r = random.Random(seed + 70); g = grid('z')
    widths = [[5, 4, 3, 4], [3, 5, 4, 4], [4, 3, 5, 4]][seed % 3]
    x = 0
    for w in widths:
        top = 3 + r.randint(0, 1)
        for y in range(top, 15):
            for i in range(w):
                c = 'h' if i == 0 else 'Z' if i == w - 1 else 'z'
                if y == top and (i == 0 or i == w - 1): continue
                put(g, x + i, y, c)
        if r.random() < .6: put(g, x + 1 + r.randint(0, max(0, w - 3)), top + 4 + r.randint(0, 5), 'Z')
        x += w
    for x in range(16):
        put(g, x, 0, 'R'); put(g, x, 1, 'r'); put(g, x, 2, 'r' if (x + seed) % 5 else 'y')
        put(g, x, 3, 'y' if (x + seed) % 4 < 2 else g[3][x])
        put(g, x, 14, 'Z'); put(g, x, 15, 'L')
    return rows(g)

def wall_top(seed):
    g = grid('m')
    for x in range(16): put(g, x, 15, 'i')
    for y in range(16): put(g, 7 + (seed % 2) * 8 if 7 + (seed % 2) * 8 < 16 else 15, y, 'i')
    put(g, 3, 4, 'M'); put(g, 4, 4, 'M'); put(g, 11, 10, 'M')
    return rows(g)

def wall_face(seed):
    # courses of cut blocks, a lit cap along the top, a dark foot
    g = grid('e')
    for x in range(16): put(g, x, 0, 'M'); put(g, x, 1, 'm'); put(g, x, 2, 'i'); put(g, x, 8, 'E'); put(g, x, 14, 'J'); put(g, x, 15, 'L')
    for y in range(3, 8): put(g, (5 + seed * 6) % 16, y, 'E')
    for y in range(9, 14): put(g, (11 + seed * 6) % 16, y, 'E')
    for x in range(16): put(g, x, 3, 'M') if x % 7 else None
    return rows(g)

def bank(seed):
    r = random.Random(seed); g = grid('b')
    for (x, y) in r.sample([(3, 4), (11, 9), (6, 12)], 2): put(g, x, y, 'B'); put(g, x + 1, y, 'B')
    return rows(g)

TILES = {
    'grass': [grass(k) for k in range(4)],
    'sand': [sand(k) for k in range(4)],
    'path': [cobble(k) for k in range(2)],
    'stone': [slab(k) for k in range(2)],
    'water': [water(k) for k in range(3)],
    'deep': [water(k + 7, True) for k in range(3)],
    'bank': [bank(k) for k in range(2)],
    'farm': [soil(k) for k in range(2)],
    'rock': [rock_top(k) for k in range(3)],
    'cliff': [rock_face(k) for k in range(3)],
    'wall': [wall_top(k) for k in range(2)],
    'wallface': [wall_face(k) for k in range(2)],
}

def pic(rws, season='peret'):
    p = Pic(16, 16); cols = {**COLORS, **SEASONS[season]}
    for y, row in enumerate(rws):
        for x, ch in enumerate(row): p.put(x, y, cols[ch])
    return p

if __name__ == '__main__':
    # a sample: rows of each kind side by side, then a little scene
    scene = ['rrrrrrrrrrrrrrrr', 'ffffffffffffffff', 'ssssssssgggggggg', 'sspppppsgggggggg', 'sspppppsgggggggg', 'ssssssssgggggggg', 'bbbbbbbbbbbbbbbb', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'xxxxxxxxxxxxxxxx']
    kinds = {'r': 'rock', 'f': 'cliff', 's': 'sand', 'g': 'grass', 'p': 'path', 'b': 'bank', 'w': 'water', 'x': 'deep', 't': 'stone'}
    big = Pic(16 * 16, 16 * len(scene))
    for j, row in enumerate(scene):
        for i, ch in enumerate(row):
            v = TILES[kinds[ch]]; big.paste(pic(v[(i * 7 + j * 3) % len(v)]), i * 16, j * 16)
    preview([big], 'tiles_scene.png', z=3, gap=0)
    from palm import palm
    from farm import crop
    from px import to_grid
    things = {'palm': to_grid(palm(0)), 'palm_l': to_grid(palm(-2)), 'palm_r': to_grid(palm(2)),
              'crop_akhet': to_grid(crop('sprout')), 'crop_peret': to_grid(crop('leafy')), 'crop_shemu': to_grid(crop('wheat'))}
    import props, buildings
    things.update({k: to_grid(v) for k, v in buildings.build_all().items()})
    things.update({'bush': to_grid(props.bush(0)), 'bush_berry': to_grid(props.bush(1)), 'rocks': to_grid(props.rocks()),
                   'flowers_0': to_grid(props.flowers(0)), 'flowers_1': to_grid(props.flowers(1)), 'flowers_2': to_grid(props.flowers(2)),
                   'bed_0': to_grid(props.bed(0)), 'bed_1': to_grid(props.bed(1)), 'bed_2': to_grid(props.bed(2)),
                   'reeds': to_grid(props.reeds(0)), 'reeds_1': to_grid(props.reeds(3)), 'lily': to_grid(props.lily())})
    json.dump({'colors': COLORS, 'seasons': SEASONS, 'tiles': TILES, 'things': things}, open('tiles_out.json', 'w'), ensure_ascii=False, indent=1)
