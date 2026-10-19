"""15 열주홀 맵 안 빛 퍼즐 설계안 3개(검토용, 구현 아님): 높이 있는 광선 모델로 모든 합법 상태를 전부 돌려 정답·오답을 확인하고,
실제 채택 그림(사막맵/15_열주홀.png) 위에 임시 도형과 선으로 배치도·정답·대표 오답을 그린다.

좌표: 그림 px. X 오른쪽, Y 바닥 깊이(발이 닿는 그림 y), Z 높이(그림 px). 화면 = (X, Y − Z) — 3/4 그림의 투영이 선형이라
3차원의 곧은 빛은 화면에서도 곧은 선이다(꺾어 맞추지 않음). 판정과 그림은 같은 점 목록을 쓴다.
측정(그림에서 직접): 광원 입구 Z≈60 (화면 1505,500 · 바닥 Y≈560), 받침 청동틀 가운데 Z≈60 (1250,495 · Y≈555), 틀 꼭대기 Z≈80,
단(테라스) 앞 턱: 바닥선 Y=455, 꼭대기 Z=120 (화면 335), 수신부 고리: 뒷벽 Y=420, 가운데 Z=150 (화면 1250,270), 반지름 28.
  python3 tools/puzzle/colonnade_designs.py [out]"""
import itertools, json, math, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
ART = os.path.join(ROOT, '사막맵', '15_열주홀.png')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'consult', 'desert', 'puzzle15')
LOW, HIGH = 60, 150            # 아래 빛 높이(광원·받침), 위 빛 높이(고리)
RING = dict(x=1250, y=420, z=150, r=28)

# ---- the scene: blockers as plan segments with a height band (x0, y0, x1, y1, z0, z1, name)
def box(x0, y0, x1, y1, z0, z1, name):
    return [(x0, y0, x1, y0, z0, z1, name), (x1, y0, x1, y1, z0, z1, name), (x1, y1, x0, y1, z0, z1, name), (x0, y1, x0, y0, z0, z1, name)]

FIXED = [
    (380, 455, 1600, 455, 0, 120, '단 앞 턱'),                    # the terrace front (its riser and both stairs)
    (300, 420, RING['x'] - RING['r'], 420, 120, 1000, '뒷벽'), (RING['x'] + RING['r'], 420, 1640, 420, 120, 1000, '뒷벽'),
    (RING['x'] - RING['r'], 420, RING['x'] + RING['r'], 420, 120, RING['z'] - RING['r'], '고리 아래 벽'),
    (RING['x'] - RING['r'], 420, RING['x'] + RING['r'], 420, RING['z'] + RING['r'], 1000, '고리 위 벽'),
    (300, 300, 300, 800, 0, 1000, '왼쪽 벽'), (1640, 300, 1640, 800, 0, 1000, '오른쪽 벽'), (300, 780, 1640, 780, 0, 1000, '앞쪽 돌무더기'),
    *box(1150, 405, 1205, 440, 120, 260, '고리 틀'), *box(1318, 405, 1360, 440, 120, 260, '고리 틀'),
    *box(915, 405, 1005, 440, 120, 420, '부러진 기둥'),
    *box(1462, 540, 1548, 585, 0, 42, '광원 받침돌'),
    *box(1205, 545, 1295, 585, 0, 32, '반사판 받침'),
]

def hit_seg(px, py, dx, dy, s):
    x0, y0, x1, y1 = s[:4]
    ex, ey = x1 - x0, y1 - y0
    den = dx * ey - dy * ex
    if abs(den) < 1e-9: return None
    t = ((x0 - px) * ey - (y0 - py) * ex) / den
    u = ((x0 - px) * dy - (y0 - py) * dx) / den
    return t if t > 1e-6 and -1e-6 <= u <= 1 + 1e-6 else None

def reflect(dx, dy, ang):
    a = math.radians(ang); nx, ny = -math.sin(a), math.cos(a); k = dx * nx + dy * ny
    rx, ry = dx - 2 * k * nx, dy - 2 * k * ny
    return round(rx, 9), round(ry, 9)

def trace(devices, src=(1490, 560, LOW, -1, 0, 0.0)):
    """devices: dicts {kind, x, y, ...}; a beam is (x, y, z, dx, dy, slope = dz per px). Returns path of 3D points and the end."""
    x, y, z, dx, dy, sl = src
    path = [(x, y, z)]; seen = set()
    for _ in range(30):
        best = None
        for s in FIXED:
            t = hit_seg(x, y, dx, dy, s)
            if t is not None and s[4] <= z + sl * t <= s[5] and (not best or t < best[0]): best = (t, 'wall', s[6])
        # the ring: its face toward the hall, light going away from the viewer (north)
        t = hit_seg(x, y, dx, dy, (RING['x'] - RING['r'], 420, RING['x'] + RING['r'], 420))
        if t is not None and dy < 0 and abs(z + sl * t - RING['z']) <= RING['r'] and (not best or t < best[0]): best = (t, 'ring', '수신부')
        for d in devices:
            for part in parts(d):
                t = hit_seg(x, y, dx, dy, part['seg'])
                if t is None: continue
                zz = z + sl * t
                if part['z0'] <= zz <= part['z1'] and (not best or t < best[0]): best = (t, part['do'], d, part)
        if not best: return path, ('open', '')
        t = best[0]; x, y, z = x + dx * t, y + dy * t, z + sl * t; path.append((x, y, z))
        kind = best[1]
        if kind == 'wall': return path, ('wall', best[2])
        if kind == 'ring': return path, ('ring', '수신부')
        d, part = best[2], best[3]
        if kind == 'block': return path, ('wall', d['name'])
        key = (d['name'], round(x), round(y), round(z), dx, dy)
        if key in seen: return path, ('loop', d['name'])
        seen.add(key)
        if kind == 'mirror':
            # an upright face turns the light in plan and keeps its climb; a tilted one (tilt = rise per px) sends it climbing
            dx, dy = reflect(dx, dy, d['ang'])
            if d.get('tilt') is not None: sl = d['tilt']
        elif kind == 'lift':        # 올림 기둥: the window it came in by, out of the other window, back the way it came
            dx, dy = -dx, -dy; z = HIGH if abs(z - LOW) < abs(z - HIGH) else LOW; sl = 0.0
            path.append((x, y, z))
        elif kind == 'relay':       # 깨우는 그릇: lit low, it sends its own light out high, toward its crown
            path.append((d['x'], d['y'], LOW)); x, y = d['x'], d['y']
            dx, dy = d['out']; z = HIGH; sl = 0.0; path.append((x, y, z))
    return path, ('bounces', '')

DIRS = {'N': (0, -1), 'E': (1, 0), 'S': (0, 1), 'W': (-1, 0)}
def parts(d):
    x, y = d['x'], d['y']
    if d['kind'] == 'mirror':   # a bronze face across (x, y) at its plan angle, ±half, between z0 and z1
        a = math.radians(d['ang']); h = d.get('half', 34); ux, uy = math.cos(a) * h, math.sin(a) * h
        return [dict(seg=(x - ux, y - uy, x + ux, y + uy), z0=d['zc'] - 26, z1=d['zc'] + 26, zc=d['zc'], do='mirror')] + \
            [dict(seg=s[:4], z0=s[4], z1=s[5], do='block') for s in box(x - 30, y - 18, x + 30, y + 18, 0, d.get('post', 32), '')]
    if d['kind'] == 'lift':     # a stone post 64 × 40, 0..180 high; its open face toward d['face'] takes light in at either window
        fx, fy = DIRS[d['face']]; hw, hd = 32, 20
        out = []
        for side, (sx, sy) in DIRS.items():
            if (sx, sy) == (fx, fy):
                seg = (x + sx * hw, y - hd, x + sx * hw, y + hd) if sx else (x - hw, y + sy * hd, x + hw, y + sy * hd)
                out += [dict(seg=seg, z0=LOW - 26, z1=LOW + 26, do='lift'), dict(seg=seg, z0=HIGH - 26, z1=HIGH + 26, do='lift'),
                        dict(seg=seg, z0=0, z1=LOW - 27, do='block'), dict(seg=seg, z0=LOW + 27, z1=HIGH - 27, do='block'), dict(seg=seg, z0=HIGH + 27, z1=185, do='block')]
            else:
                seg = (x + sx * hw, y - hd, x + sx * hw, y + hd) if sx else (x - hw, y + sy * hd, x + hw, y + sy * hd)
                out.append(dict(seg=seg, z0=0, z1=185, do='block'))
        return out
    if d['kind'] == 'relay':    # a bronze bowl on a low drum: catches low light from any side
        return [dict(seg=s[:4], z0=20, z1=95, do='relay') for s in box(x - 30, y - 18, x + 30, y + 18, 0, 0, '')] + \
               [dict(seg=s[:4], z0=0, z1=19, do='block') for s in box(x - 30, y - 18, x + 30, y + 18, 0, 0, '')]   # light out of it starts at its middle
    if d['kind'] == 'tall':     # a tall stand: the post blocks low light, the bronze head sits at the ring's height
        a = math.radians(d['ang']); h = 34; ux, uy = math.cos(a) * h, math.sin(a) * h
        return [dict(seg=(x - ux, y - uy, x + ux, y + uy), z0=HIGH - 26, z1=HIGH + 26, zc=HIGH, do='mirror')] + \
               [dict(seg=s[:4], z0=0, z1=120, do='block') for s in box(x - 12, y - 10, x + 12, y + 10, 0, 0, '')]
    raise ValueError(d)

ANG = {'/': 135, '—': 0, '\\': 45, '|': 90}     # plan angle of the bronze face (y down): / sends west-going light south
def P(ang, tilt=None): return dict(kind='mirror', name='받침 반사판(기존)', x=1250, y=560, zc=LOW, ang=ANG[ang], post=32, tilt=tilt)

# ---------------- 설계안
# A 올림 기둥: 받침(기존, 4방향) + 올림 기둥(신규, 홈 위 4자리 × 4면). 기둥은 들어온 창의 반대 높이 창으로, 온 쪽으로 되돌려 보낸다.
A_SPOTS = {'a1 (처음 자리)': (1000, 560), 'a2 모퉁이': (1000, 725), 'a3 받침 남쪽': (1250, 725), 'a4 광원 남쪽': (1490, 725)}
def A_states():
    for p, (sn, (sx, sy)), face in itertools.product(ANG, A_SPOTS.items(), 'NESW'):
        yield dict(P=p, T=sn, face=face), [P(p), dict(kind='lift', name='올림 기둥', x=sx, y=sy, face=face)]
# B 기울기와 거리: 받침(기존, 4방향 × 기울기 0·1·3) + 기울판(신규, 홈 위 3자리 × 4방향 × 기울기 0·1·3). 기울기 1 = 100 px 가는 동안 30 px 오름.
TILT = {0: 0.0, 1: 0.3, 3: 0.9}
B_SPOTS = {'b1 (처음 자리)': (1000, 560), 'b2 받침 남쪽': (1250, 725), 'b3 모퉁이': (1000, 725)}
def B_states():
    for p, pt, (sn, (sx, sy)), q, qt in itertools.product(ANG, TILT, B_SPOTS.items(), ANG, TILT):
        yield dict(P=p, Pt=pt, Q=sn, q=q, qt=qt), [P(p, TILT[pt]), dict(kind='mirror', name='기울판', x=sx, y=sy, zc=LOW, ang=ANG[q], post=32, tilt=TILT[qt])]
# C 깨우는 그릇: 받침(기존, 4방향) + 바닥 반사판(신규, 고정 자리, 4방향) + 깨우는 그릇(신규, 고정 자리, 왕관 4방향) + 높은 반사판(신규, 고정, 4방향)
def C_states():
    for p, f, crown, h in itertools.product(ANG, ANG, 'NESW', ANG):
        yield dict(P=p, F=f, D=crown, H=h), [P(p), dict(kind='mirror', name='바닥 반사판', x=1000, y=560, zc=LOW, ang=ANG[f], post=32),
                                               dict(kind='relay', name='깨우는 그릇', x=1000, y=725, out=DIRS[crown]),
                                               dict(kind='tall', name='높은 반사판', x=1250, y=725, ang=ANG[h])]

def solve(states):
    res = []
    for st, devs in states:
        path, end = trace(devs)
        res.append((st, path, end))
    return res

def summary(name, res):
    win = [r for r in res if r[2][0] == 'ring']
    ends = {}
    for st, path, end in res: ends[end[1] or end[0]] = ends.get(end[1] or end[0], 0) + 1
    print(f'{name}: 상태 {len(res)}, 정답 {len(win)}', json.dumps(ends, ensure_ascii=False))
    for st, path, end in win: print('   정답', st, [tuple(round(v) for v in p) for p in path])
    return win

# ---------------- drawing
def scr(p): return (p[0], p[1] - p[2])
def font(n):
    for f in ['/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']:
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()

def draw_state(img, devs, path, end, title, note='', new=()):
    im = img.copy().convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(ov); F = font(22); Fs = font(17)
    # existing devices: green outline; proposed: magenta fills
    g.rectangle((1462, 470, 1548, 590), outline=(40, 200, 90, 255), width=3); g.text((1470, 595), '광원(기존)', font=Fs, fill=(40, 120, 60, 255))
    g.ellipse((RING['x'] - 34, 270 - 34, RING['x'] + 34, 270 + 34), outline=(40, 200, 90, 255), width=3); g.text((RING['x'] + 40, 255), '수신부(기존)', font=Fs, fill=(40, 120, 60, 255))
    for d in devs:
        if d['kind'] == 'mirror':
            a = math.radians(d['ang']); ux, uy = math.cos(a) * 34, math.sin(a) * 34; c = (d['x'], d['y'] - d['zc'])
            col = (40, 200, 90, 255) if '기존' in d['name'] else (230, 40, 200, 255)
            if '기존' not in d['name']:
                g.rectangle((d['x'] - 30, d['y'] - 18 - 32, d['x'] + 30, d['y'] + 18), fill=(230, 40, 200, 70), outline=col, width=2)
            g.line((c[0] - ux, c[1] - uy * 0.5, c[0] + ux, c[1] + uy * 0.5), fill=col, width=7)
            lab = d['name'] + (f" 기울기 {[k for k, v in TILT.items() if v == d.get('tilt')][0]}" if d.get('tilt') else '')
            g.text((d['x'] - 60, d['y'] + 22), lab, font=Fs, fill=col)
        elif d['kind'] == 'lift':
            x, y = d['x'], d['y']; col = (230, 40, 200, 255)
            g.rectangle((x - 32, y - 185, x + 32, y + 20), fill=(230, 40, 200, 80), outline=col, width=3)
            fx, fy = DIRS[d['face']]
            for zz in (LOW, HIGH): g.rectangle((x - 12 + fx * 22, y - zz - 10 + fy * 8, x + 12 + fx * 22, y - zz + 10 + fy * 8), fill=(255, 240, 160, 230))
            g.text((x - 50, y + 24), f"올림 기둥({'북동남서'['NESW'.index(d['face'])]}면)", font=Fs, fill=col)
        elif d['kind'] == 'relay':
            x, y = d['x'], d['y']; col = (230, 40, 200, 255)
            g.ellipse((x - 32, y - 60, x + 32, y + 10), fill=(230, 40, 200, 80), outline=col, width=3)
            ox, oy = d['out']; g.line((x, y - 60, x + ox * 40, y - 60 + oy * 20), fill=col, width=5)
            g.text((x - 50, y + 14), '깨우는 그릇', font=Fs, fill=col)
        elif d['kind'] == 'tall':
            x, y = d['x'], d['y']; col = (230, 40, 200, 255)
            g.rectangle((x - 8, y - HIGH, x + 8, y), fill=(230, 40, 200, 110))
            a = math.radians(d['ang']); ux, uy = math.cos(a) * 34, math.sin(a) * 34
            g.line((x - ux, y - HIGH - uy * 0.5, x + ux, y - HIGH + uy * 0.5), fill=col, width=7)
            g.text((x + 20, y - 10), '높은 반사판', font=Fs, fill=col)
    for sx, sy in new: g.ellipse((sx - 26, sy - 10, sx + 26, sy + 10), outline=(230, 40, 200, 255), width=2)
    # the light: the drawn line is the judged line; its shadow on the floor dotted
    pts = [scr(p) for p in path]
    for a, b in zip(path, path[1:]):
        g.line((a[0], a[1], b[0], b[1]), fill=(60, 30, 10, 120), width=2)
    g.line(pts, fill=(255, 250, 170, 255), width=6); g.line(pts, fill=(255, 190, 40, 255), width=2)
    ex, ey = pts[-1]; ok = end[0] == 'ring'
    g.ellipse((ex - 12, ey - 12, ex + 12, ey + 12), fill=(80, 255, 120, 230) if ok else (255, 60, 40, 230))
    g.rectangle((0, 0, im.width, 64), fill=(20, 12, 6, 200))
    g.text((14, 6), title, font=F, fill=(255, 240, 200, 255)); g.text((14, 36), note or ('수신부 점등' if ok else f'끝: {end[1] or end[0]}'), font=Fs, fill=(255, 220, 160, 255))
    return Image.alpha_composite(im, ov).convert('RGB')

def main():
    os.makedirs(OUT, exist_ok=True)
    img = Image.open(ART).convert('RGB')
    out = {}
    for name, gen in (('A', A_states), ('B', B_states), ('C', C_states)):
        res = solve(gen())
        out[name] = (res, summary(name, res))
    json.dump({k: {'states': len(v[0]), 'answers': [w[0] for w in v[1]],
                   'ends': {e: sum(1 for r in v[0] if (r[2][1] or r[2][0]) == e) for e in {r[2][1] or r[2][0] for r in v[0]}}} for k, v in out.items()},
              open(os.path.join(OUT, 'solver.json'), 'w'), ensure_ascii=False, indent=1)
    return img, out



# ---------------- the shortest way from the start (each touch: turn one device one step, or slide the moving one one groove step)
def bfs(start, ops, is_win):
    from collections import deque
    key = lambda s: json.dumps(s, sort_keys=True)
    q = deque([(start, [])]); seen = {key(start)}
    while q:
        s, how = q.popleft()
        if is_win(s): return how
        for name, f in ops:
            n = f(dict(s))
            if n and key(n) not in seen: seen.add(key(n)); q.append((n, how + [name]))
    return None

def nxt(seq, v): return seq[(seq.index(v) + 1) % len(seq)]
ROT = list(ANG)                                   # one touch: / → — → \ → | → /
A_GROOVE = list(A_SPOTS)                          # a1 – a2 – a3 – a4 along one groove
B_GROOVE = ['b1 (처음 자리)', 'b3 모퉁이', 'b2 받침 남쪽']

def devsA(s): sx, sy = A_SPOTS[s['T']]; return [P(s['P']), dict(kind='lift', name='올림 기둥', x=sx, y=sy, face=s['face'])]
def devsB(s): sx, sy = B_SPOTS[s['Q']]; return [P(s['P'], TILT[s['Pt']]), dict(kind='mirror', name='기울판', x=sx, y=sy, zc=LOW, ang=ANG[s['q']], post=32, tilt=TILT[s['qt']])]
def devsC(s): return [P(s['P']), dict(kind='mirror', name='바닥 반사판', x=1000, y=560, zc=LOW, ang=ANG[s['F']], post=32),
                      dict(kind='relay', name='깨우는 그릇', x=1000, y=725, out=DIRS[s['D']]), dict(kind='tall', name='높은 반사판', x=1250, y=725, ang=ANG[s['H']])]
def slide(groove, k, d):
    def f(s):
        i = groove.index(s[k]) + d
        if 0 <= i < len(groove): s[k] = groove[i]; return s
    return f
def turn(k, seq):
    def f(s): s[k] = nxt(seq, s[k]); return s
    return f
TS = [0, 1, 3]
DESIGNS = {
    'A': dict(start=dict(P='\\', T='a1 (처음 자리)', face='E'), devs=devsA,
              ops=[('받침 돌리기', turn('P', ROT)), ('기둥 면 돌리기', turn('face', list('NESW'))), ('기둥 밀기 →', slide(A_GROOVE, 'T', 1)), ('기둥 밀기 ←', slide(A_GROOVE, 'T', -1))]),
    'B': dict(start=dict(P='\\', Pt=0, Q='b1 (처음 자리)', q='|', qt=0), devs=devsB,
              ops=[('받침 돌리기', turn('P', ROT)), ('받침 기울기', turn('Pt', TS)), ('기울판 돌리기', turn('q', ROT)), ('기울판 기울기', turn('qt', TS)),
                   ('기울판 밀기 →', slide(B_GROOVE, 'Q', 1)), ('기울판 밀기 ←', slide(B_GROOVE, 'Q', -1))]),
    'C': dict(start=dict(P='\\', F='|', D='N', H='|'), devs=devsC,
              ops=[('받침 돌리기', turn('P', ROT)), ('바닥 반사판 돌리기', turn('F', ROT)), ('그릇 왕관 돌리기', turn('D', list('NESW'))), ('높은 반사판 돌리기', turn('H', ROT))]),
}
def lit(devs): return trace(devs)[1][0] == 'ring'


# ---------------- review sheets
CROP = (250, 110, 1700, 800)
WRONG = {
    'A': [(dict(P='—', T='a1 (처음 자리)', face='E'), '오답: 기둥이 빛을 높였지만 온 쪽(동쪽)으로 되돌려 받침·광원 위를 넘어 벽에'),
          (dict(P='/', T='a3 받침 남쪽', face='S'), '오답: 기둥을 받침 남쪽에 뒀지만 열린 면이 남쪽 — 빛이 기둥 돌벽에 막힘')],
    'B': [(dict(P='/', Pt=0, Q='b2 받침 남쪽', q='—', qt=3), '오답: 기울기 3 — 너무 가파라 고리 위 벽에 빛자국'),
          (dict(P='\\', Pt=1, Q='b1 (처음 자리)', q='|', qt=0), '오답: 받침에서 바로 기울기 1 — 단 앞 턱에 빛자국(가까워서 덜 오름)')],
    'C': [(dict(P='—', F='/', D='N', H='|'), '오답: 그릇이 깨어 빛을 높였지만 왕관이 북쪽 — 고리 줄이 아닌 뒷벽에'),
          (dict(P='/', F='|', D='N', H='|'), '오답: 받침에서 남쪽으로 보낸 낮은 빛이 높은 반사판 기둥에 막힘')],
}
TITLE = {'A': 'A안 올림 기둥 — 멀어지게 보내야 높이 돌아온다', 'B': 'B안 기울판 — 같은 기울기라도 거리만큼 오른다', 'C': 'C안 깨우는 그릇 — 낮은 길과 높은 길을 따로 잇는다'}

def layout(img, k):
    D = DESIGNS[k]; devs = D['devs'](D['start'])
    path, end = trace(devs)
    im = draw_state(img, devs, path, end, f'{k}안 배치도 — 초록: 기존 장치, 분홍: 신규 제안, 점선: 이동 홈, 하늘색 발자국: 조작 자리', '처음 상태의 빛도 함께')
    g = ImageDraw.Draw(im); Fs = font(17)
    spots = {'A': A_SPOTS, 'B': B_SPOTS}.get(k, {})
    groove = {'A': A_GROOVE, 'B': B_GROOVE}.get(k, [])
    for a, b in zip(groove, groove[1:]):
        (x0, y0), (x1, y1) = spots[a], spots[b]
        n = int(math.hypot(x1 - x0, y1 - y0) / 16)
        for i in range(0, n, 2): g.line((x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, x0 + (x1 - x0) * (i + 1) / n, y0 + (y1 - y0) * (i + 1) / n), fill=(230, 40, 200), width=4)
    for n, (x, y) in spots.items():
        g.ellipse((x - 30, y - 12, x + 30, y + 12), outline=(230, 40, 200), width=3); g.text((x + 34, y - 6), n.split(' ')[0], font=Fs, fill=(230, 40, 200))
    feet = [(1250, 615)] + {'A': [(1000, 610), (1070, 735), (1175, 730), (1420, 735)], 'B': [(1000, 610), (1175, 730), (1070, 735)],
                            'C': [(1000, 610), (1070, 735), (1175, 730)]}[k]
    for x, y in feet: g.ellipse((x - 14, y - 6, x + 14, y + 6), fill=(60, 200, 255), outline=(0, 90, 160))
    return im

def section(k, states):
    """옆에서 본 단면(고리 줄 x = 1250 근처): 가로 = 바닥 깊이 Y, 세로 = 높이 Z. 3/4 화면에서는 이 둘이 같은 화면 y 축으로 합쳐진다."""
    W, H = 1450, 690; im = Image.new('RGB', (W, H), (250, 244, 232)); g = ImageDraw.Draw(im); F = font(20); Fs = font(16)
    X = lambda Y: 80 + (800 - Y) * 2.6; Z = lambda z: H - 80 - z * 2.2
    g.rectangle((0, 0, W, 56), fill=(40, 28, 16)); g.text((14, 14), f'{k}안 옆 단면(고리 앞 줄) — 왼쪽이 화면 아래(앞), 오른쪽이 뒤. 실선 = 판정·그림에 쓰는 같은 빛', font=F, fill=(255, 235, 200))
    g.line((X(800), Z(0), X(455), Z(0)), fill=(120, 90, 50), width=4); g.text((X(760), Z(0) + 8), '홀 바닥 Z 0', font=Fs, fill=(90, 60, 30))
    g.rectangle((X(455), Z(120), X(420), Z(0)), fill=(205, 170, 120), outline=(120, 90, 50)); g.text((X(470) - 20, Z(120) - 30), '단 앞 턱 Z 120', font=Fs, fill=(90, 60, 30))
    g.rectangle((X(420), Z(400), X(405), Z(120)), fill=(185, 150, 105)); g.text((X(420) - 110, Z(260)), '뒷벽', font=Fs, fill=(90, 60, 30))
    g.ellipse((X(420) - 10, Z(178), X(420) + 6, Z(122)), outline=(40, 160, 70), width=4); g.text((X(420) - 140, Z(150) - 8), '고리 Z 122–178', font=Fs, fill=(40, 120, 60))
    g.rectangle((X(585), Z(32), X(545), Z(0)), fill=(205, 170, 120)); g.line((X(560), Z(85), X(560), Z(35)), fill=(40, 160, 70), width=6); g.text((X(600), Z(95)), '받침(기존) 청동틀 Z 35–85', font=Fs, fill=(40, 120, 60))
    for zz, nm in ((LOW, '아래 빛 Z 60'), (HIGH, '위 빛 Z 150')): g.line((X(800), Z(zz), X(780), Z(zz)), fill=(150, 150, 150), width=2); g.text((10, Z(zz) - 9), nm, font=Fs, fill=(110, 110, 110))
    cols = [(240, 150, 20), (220, 60, 50), (150, 60, 200)]
    for i, (st, lab) in enumerate(states):
        path, end = trace(DESIGNS[k]['devs'](st))
        pts = [(X(p[1]), Z(p[2])) for p in path if abs(p[0] - 1250) < 60 or p is path[-1]]
        seg = [p for p in path if abs(p[0] - 1250) < 60]
        if len(seg) >= 2: g.line([(X(p[1]), Z(p[2])) for p in seg], fill=cols[i], width=5 if i == 0 else 3)
        if seg: ex, ey = X(seg[-1][1]), Z(seg[-1][2]); g.ellipse((ex - 8, ey - 8, ex + 8, ey + 8), fill=cols[i])
        g.text((W - 640, 70 + i * 26), '● ' + lab, font=Fs, fill=cols[i])
    g.text((14, H - 44), '화면 y = 바닥 깊이 Y − 높이 Z. 앞뒤로 곧게 가는 빛은 3/4 화면에서 세로 직선, 오르는 빛은 더 긴 세로 직선(같은 직선, 꺾지 않음).', font=Fs, fill=(70, 50, 30))
    return im

def sheet(img, k):
    D = DESIGNS[k]
    win = next(st for st, devs in [(s, D['devs'](s)) for s, _ in {'A': A_states, 'B': B_states, 'C': C_states}[k]()] if lit(devs))
    panels = [layout(img, k)]
    s0 = D['start']; path, end = trace(D['devs'](s0)); panels.append(draw_state(img, D['devs'](s0), path, end, f'{k}안 처음 상태(플레이어가 처음 보는 것)'))
    for st, lab in WRONG[k]:
        path, end = trace(D['devs'](st)); panels.append(draw_state(img, D['devs'](st), path, end, lab))
    path, end = trace(D['devs'](win)); panels.append(draw_state(img, D['devs'](win), path, end, f'{k}안 정답 — 수신부 점등'))
    panels = [p.crop(CROP) for p in panels]
    sec = section(k, [(win, '정답')] + WRONG[k])
    w, h = panels[0].size; sc = 0.62; pw, ph = int(w * sc), int(h * sc)
    out = Image.new('RGB', (pw * 2 + 30, 70 + ph * 3 + 40), (24, 16, 10)); g = ImageDraw.Draw(out)
    g.text((16, 16), TITLE[k], font=font(32), fill=(255, 230, 180))
    for i, p in enumerate(panels):
        out.paste(p.resize((pw, ph), Image.LANCZOS), (10 + (i % 2) * (pw + 10), 70 + (i // 2) * (ph + 10)))
    out.paste(sec.resize((pw, int(sec.height * pw / sec.width)), Image.LANCZOS), (10 + pw + 10, 70 + 2 * (ph + 10)))
    return out, win

if __name__ == '__main__':
    img, _ = main()
    for k in 'ABC':
        sh, win = sheet(img, k); sh.save(os.path.join(OUT, f'design-{k}.png'))
        how = bfs(DESIGNS[k]['start'], DESIGNS[k]['ops'], lambda s: lit(DESIGNS[k]['devs'](s)))
        print(k, '최단', len(how), how)
