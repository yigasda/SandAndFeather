"""16 빛 우물 설계안 두 가지(15 A안 "올림"의 심화, 구현 아님): 실제 채택 그림(사막맵/16_빛우물.png) 위에 장치·처음 상태·대표 오답·
정답을 임시 도형으로 그리고, 모든 상태를 돌려 정답을 확인하고, 사용자 충돌(사막맵/충돌/16_빛우물.png)로 접근·통행을 검사한다.
  안 X(지금 그림): 돌 하나·그릇 둘. 눈에 띄는 S1→M2는 높아지지만 방향이 틀림, S2→M1이 정답. 돌림판 F는 고리–M1 줄 위.
  안 K(기준 관계 유지): S1→M2가 정답. 돌림판 F는 고리–M2 줄 위, M1은 문서대로 첫 반사판. S2 없음.
규칙(15에서 배운 것 + 16에서 새로)
  - 빛은 곧게, 낮은 빛·높은 빛 두 높이. 높은 빛은 낮은 장치(F, 받침, 원반) 위로 지나간다(15의 받침과 같음).
  - 올림: 낮은 빛을 높여 온 쪽으로 돌려보낸다. 들어온 창 옆의 높은 창에서 나가므로 두 빛은 나란한 두 줄(15와 같음).
  - 고리는 높은 빛이 가운데 유리에 닿아야 켜진다. 낮은 빛은 아래 테두리에 닿는다(15와 같은 규칙).
  - 새로: 받침은 잠들어 있으면 빛을 막고, 옆 그릇에 봉인석이 있으면 깨어나 올림이 된다(안 X: M1·M2 둘 다, 안 K: M2).
  - 돌은 하나, 바닥·손·그릇 중 한 곳에만. 같은 해 무늬가 돌과 그릇에 있고, 돌을 든 동안 빈 그릇이 빛난다(제안).
  - 놋쇠 입구: 그림은 위로 열려 있다. 옆으로 여는 작은 청동 갓(패치 1장, 제안)을 씌워야 빛이 나가는 방향이 그림과 맞는다.
16은 아직 게임 맵으로 등록되지 않았다. 위치·높이는 그림에서 잰 추정이다.
  python3 tools/puzzle/lightwell_design.py [out]"""
import itertools, json, math, os, sys
from collections import deque
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'consult', 'desert', 'puzzle16')
F = lambda n: ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', n)
LOW_Z, HIGH_Z, F_TOP = 60, 100, 45            # drawing heights (estimates): bronze heads, the ring's middle, F's low top
SIDE = 36                                     # a woken pedestal's two windows side by side (picture px)
W, M1, M2, S1, S2, R1, NICHE = (512, 770), (230, 880), (770, 500), (884, 470), (330, 880), (380, 300), (530, 300)
K1_FLOOR = (690, 1010)                        # 봉인석 처음 자리(입구 계단 옆, 제안)
ENTRY = (512, 1250)                           # T2에서 들어오는 계단

VARIANTS = {
    'X': dict(name='안 X 지금 그림(S2→M1 정답)', F=(305, 590), feed=W, bowls={'S1': ('M2', S1), 'S2': ('M1', S2)},
              rotatable={'F': ['고리', 'M1', 'M2', '벽감']}, fixed_first=None),
    'K': dict(name='안 K 기준 유지(S1→M2 정답)', F=(575, 400), feed=M1, bowls={'S1': ('M2', S1)},
              rotatable={'M1': ['F', '고리', 'M2', '벽'], 'F': ['고리', 'M2', 'M1', '벽감']}, fixed_first=M1),
}
POS = {'고리': R1, 'M1': M1, 'M2': M2, '벽감': NICHE, '벽': (60, 700)}

def unit(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]; n = math.hypot(dx, dy); return dx / n, dy / n

def trace(v, st):
    """st: { stone: '바닥'|'S1'|'S2', aims: {device: aim} } → (segs [(a, b, level)], end, lit)"""
    V = VARIANTS[v]; Fp = V['F']; pos = {**POS, 'F': Fp}
    awake = {pedestal for bowl, (pedestal, _) in V['bowls'].items() if st['stone'] == bowl}
    segs, at = [], W
    if V['fixed_first']:                               # K: the mouth lights M1, M1 is turned
        segs.append((W, M1, 'low')); at = M1; aim = st['aims']['M1']
        if aim != 'F':
            tgt = pos[aim]
            if aim == '고리': return segs + [(M1, R1, 'low')], '낮은 빛이 고리 아래 테두리에', False
            if aim == 'M2' and 'M2' in awake:
                ux, uy = unit(M2, M1); a = (M2[0] - uy * SIDE, M2[1] + ux * SIDE)
                return segs + [(M1, M2, 'low'), (a, (M1[0] - uy * SIDE + ux * 120, M1[1] + ux * SIDE + uy * 120), 'high')], '높아져 M1 쪽으로 돌아가 바닥 너머 벽에', False
            return segs + [(M1, tgt, 'low')], f'빛이 {aim}에 막힘', False
    segs.append((at, Fp, 'low'))
    aim = st['aims']['F']; tgt = pos[aim]
    if aim == '고리': return segs + [(Fp, R1, 'low')], '낮은 빛이 고리 아래 테두리에 닿음', False
    if aim == '벽감': return segs + [(Fp, NICHE, 'low')], '낮은 빛이 닫힌 벽감 문에 닿음', False
    if aim not in awake: return segs + [(Fp, tgt, 'low')], f'{aim}이 잠들어 있어 빛을 막음', False
    ux, uy = unit(tgt, Fp); nx, ny = -uy * SIDE, ux * SIDE      # back the way it came, from the window beside
    a = (tgt[0] + nx, tgt[1] + ny)
    # does the line back through F reach the ring? (the ring on the far side of F, on that line)
    far = (Fp[0] + ux * 900 + nx, Fp[1] + uy * 900 + ny)
    rx, ry = R1[0] - a[0], R1[1] - a[1]; along = rx * ux + ry * uy; off = abs(rx * uy - ry * ux)
    if along > 0 and off < 50:
        return segs + [(tgt, Fp, 'low'), (a, (a[0] + ux * along, a[1] + uy * along), 'high')], f'{aim}이 높여 돌려보낸 빛이 F 위를 지나 고리 가운데에 → 점등', True
    return segs + [(tgt, Fp, 'low'), (a, far, 'high')], '높아졌지만 온 쪽으로 돌아가 벽에 닿음', False

def states(v):
    V = VARIANTS[v]
    for stone in ['바닥', *V['bowls']]:
        for combo in itertools.product(*V['rotatable'].values()):
            yield {'stone': stone, 'aims': dict(zip(V['rotatable'], combo))}

# ---- the user's collision: can she reach every device from the stairs, with the new devices standing in the way?
def walk_check(v):
    col = Image.open(os.path.join(ROOT, '사막맵', '충돌', '16_빛우물.png')).getchannel('A')
    S = 8; Wc, Hc = col.width // S, col.height // S
    free = [[col.getpixel((x * S + S // 2, y * S + S // 2)) > 0 for x in range(Wc)] for y in range(Hc)]
    V = VARIANTS[v]; boxes = {'F': (V['F'], 30, 18)}
    if 'S2' in V['bowls']: boxes['S2'] = (S2, 22, 16)
    for n, ((cx, cy), hw, hh) in boxes.items():   # a new device stops feet (as 15's pillar)
        for y in range((cy - hh) // S, (cy + hh) // S + 1):
            for x in range((cx - hw) // S, (cx + hw) // S + 1): free[y][x] = False
    seen = set(); q = deque([(ENTRY[0] // S, ENTRY[1] // S)]); seen.add(q[0])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if 0 <= n[0] < Wc and 0 <= n[1] < Hc and free[n[1]][n[0]] and n not in seen: seen.add(n); q.append(n)
    reach = lambda p, r=70: any(((x * S - p[0]) ** 2 + (y * S - p[1]) ** 2) ** .5 < r for x, y in seen)
    out = {n: reach(p) for n, p in (('F', V['F']), ('M1', M1), ('M2', M2), ('S1', S1), ('봉인석 자리', K1_FLOOR), *([('S2', S2)] if 'S2' in V['bowls'] else []))}
    # nothing new cuts the floor in two: every floor cell reachable without the new devices is still reachable with them
    out['통행'] = len(seen) >= sum(1 for row in free for c in row if c) - 2
    return out

# ---- drawing
def scr(p, z): return (p[0], p[1] - z)
def draw(img, v, st, title, note=None, carrying=False):
    V = VARIANTS[v]; Fp = V['F']
    im = img.convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(ov)
    GREEN, PINK, SUN = (40, 190, 90, 255), (230, 40, 200, 255), (255, 210, 70, 255)
    awake = {p for b, (p, _) in V['bowls'].items() if st['stone'] == b}
    for n, p in (('M1', M1), ('M2', M2)):
        sleeping = n in [p2 for p2, _ in V['bowls'].values()] and n not in awake
        x, y = scr(p, LOW_Z); g.ellipse((x - 34, y - 34, x + 34, y + 34), outline=SUN if n in awake else GREEN, width=6 if n in awake else 3)
        g.text((x + 38, y - 16), f"{n} {'깨어남(올림)' if n in awake else '잠듦' if sleeping else '반사판'}", font=F(22), fill=(255, 230, 120, 255) if n in awake else (20, 110, 50, 255))
    for b, (ped, bp) in V['bowls'].items():
        x, y = scr(bp, 30); new = b == 'S2'
        glow = carrying and st['stone'] != b
        if glow: g.ellipse((x - 30, y - 20, x + 30, y + 20), fill=(255, 230, 120, 110))
        g.ellipse((x - 20, y - 12, x + 20, y + 12), outline=PINK if new else GREEN, width=3)
        g.text((x - 6, y - 9), '☉', font=F(16), fill=SUN)
        if st['stone'] == b: g.ellipse((x - 13, y - 9, x + 13, y + 9), fill=(120, 200, 230, 255)); g.text((x - 6, y - 9), '☉', font=F(16), fill=SUN)
        g.text((x - 40, y + 14), f"{b} 그릇{'(제안)' if new else ''}{' · 빼기' if st['stone'] == b else ''}", font=F(18), fill=PINK if new else (20, 110, 50, 255))
    if st['stone'] == '바닥':
        x, y = K1_FLOOR; g.rounded_rectangle((x - 16, y - 20, x + 16, y + 6), 6, fill=(120, 200, 230, 255), outline=PINK, width=3)
        g.text((x - 6, y - 18), '☉', font=F(16), fill=SUN); g.text((x + 22, y - 14), '봉인석(제안 자리)', font=F(18), fill=PINK)
    # F: a short device (a low disc on a short post) with four notches; the one it aims at bright
    fx, fy = Fp; base = scr(Fp, 0); top = scr(Fp, F_TOP)
    g.rectangle((fx - 6, top[1], fx + 6, base[1]), fill=(150, 110, 70, 230))
    g.ellipse((fx - 26, top[1] - 9, fx + 26, top[1] + 9), fill=(214, 184, 138, 240), outline=PINK, width=3)
    pos = {**POS, 'F': Fp}
    for aim in V['rotatable']['F']:
        ux, uy = unit(Fp, pos[aim]); on = st['aims']['F'] == aim
        g.line((fx + ux * 14, top[1] + uy * 5, fx + ux * 28, top[1] + uy * 10), fill=SUN if on else (110, 80, 50, 255), width=5 if on else 3)
    g.text((fx - 70, base[1] + 6), f"돌림판 F(제안) → {st['aims']['F']}", font=F(18), fill=PINK)
    if 'M1' in V['rotatable']:
        x, y = scr(M1, LOW_Z); ux, uy = unit(M1, pos[st['aims']['M1']]); g.line((x, y, x + ux * 40, y + uy * 40), fill=SUN, width=6)
    x, y = scr(W, 25); g.ellipse((x - 16, y - 10, x + 16, y + 10), outline=GREEN, width=3)
    g.arc((x - 22, y - 30, x + 22, y + 6), 200, 340, fill=PINK, width=4); g.text((x + 22, y - 4), '놋쇠 입구 + 옆으로 여는 갓(제안)', font=F(16), fill=PINK)
    x, y = scr(R1, HIGH_Z); g.ellipse((x - 52, y - 52, x + 52, y + 52), outline=GREEN, width=3)
    nx_, ny_ = scr(NICHE, 85); g.rectangle((nx_ - 60, ny_ - 50, nx_ + 60, ny_ + 40), outline=GREEN, width=3)
    segs, end, lit = trace(v, st)
    for a, b, lv in segs:
        z = LOW_Z if lv == 'low' else HIGH_Z
        if lv == 'high':   # its shadow on the floor (same x, y at height 0), dotted: it is in the air, over F
            n = int(math.hypot(b[0] - a[0], b[1] - a[1]) / 14)
            for i in range(0, n, 2): t0, t1 = i / n, (i + 1) / n; g.line((a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1), fill=(60, 30, 10, 150), width=3)
        g.line((*scr(a, z), *scr(b, z)), fill=(255, 160, 40, 110) if lv == 'low' else (255, 246, 200, 140), width=14 if lv == 'high' else 9)
        g.line((*scr(a, z), *scr(b, z)), fill=(255, 160, 40, 255) if lv == 'low' else (255, 252, 230, 255), width=5 if lv == 'high' else 3)
    for (a0, b0, l0), (a, b, lv) in zip(segs, segs[1:]):
        if lv == 'high' and l0 == 'low': g.line((*scr(b0, LOW_Z), *scr(a, HIGH_Z)), fill=(255, 220, 120, 255), width=6)
    ex, ey = scr(segs[-1][1], LOW_Z if segs[-1][2] == 'low' else HIGH_Z)
    g.ellipse((ex - 16, ey - 16, ex + 16, ey + 16), fill=(80, 255, 120, 230) if lit else (255, 70, 40, 220))
    if lit: g.rectangle((nx_ - 60, ny_ - 50, nx_ + 60, ny_ + 40), fill=(255, 230, 120, 90))
    g.rectangle((0, 0, im.width, 96), fill=(20, 12, 6, 225))
    g.text((14, 8), title, font=F(30), fill=(255, 235, 200, 255)); g.text((14, 52), note or end, font=F(22), fill=(255, 215, 160, 255))
    return Image.alpha_composite(im, ov).convert('RGB')

def sheet(panels, path):
    w, h = panels[0].size; k = 0.45
    s = Image.new('RGB', (int(w * k) * 2 + 30, int(h * k) * 2 + 30), (24, 16, 10))
    for i, p in enumerate(panels): s.paste(p.resize((int(w * k), int(h * k)), Image.LANCZOS), (10 + (i % 2) * (int(w * k) + 10), 10 + (i // 2) * (int(h * k) + 10)))
    s.save(path)

def main():
    os.makedirs(OUT, exist_ok=True)
    img = Image.open(os.path.join(ROOT, '사막맵', '16_빛우물.png'))
    report = {}
    for v in VARIANTS:
        all_ = list(states(v)); wins = [s for s in all_ if trace(v, s)[2]]
        report[v] = {'states': len(all_), 'answers': wins, 'walk': walk_check(v)}
        print(VARIANTS[v]['name'], '상태', len(all_), '정답', wins, '접근', report[v]['walk'])
    json.dump(report, open(os.path.join(OUT, 'solver.json'), 'w'), ensure_ascii=False, indent=1)
    X = [
        draw(img, 'X', {'stone': '바닥', 'aims': {'F': '고리'}}, '① 처음', '고리를 겨누면 낮은 빛이 고리 아래 테두리에 (15의 "낮다")'),
        draw(img, 'X', {'stone': 'S1', 'aims': {'F': 'M2'}}, '② 돌을 S1에, F → M2', 'M2가 높였지만 온 쪽(F 쪽)으로 돌아가 왼쪽 벽에 — 높이는 됐고 방향이 문제', carrying=False),
        draw(img, 'X', {'stone': 'S1', 'aims': {'F': 'M1'}}, '③ F의 눈금: 고리와 M1이 정반대', '고리에서 F를 지나 거꾸로 따라가면 M1. 잠든 M1이 막는다 → 깨울 것은 M1', carrying=False),
        draw(img, 'X', {'stone': 'S2', 'aims': {'F': 'M1'}}, '④ 돌을 빼서 S2에(든 동안 빈 그릇이 빛남)', '낮은 F 위로 높은 빛이 지난다(점선 = 바닥 그림자) → 고리 점등, 벽감 열림'),
    ]
    sheet(X, os.path.join(OUT, 'design-16.png'))
    for i, p in enumerate(X): p.resize((p.width // 2, p.height // 2), Image.LANCZOS).save(os.path.join(OUT, f'16-{i + 1}.png'))
    K = [
        draw(img, 'K', {'stone': '바닥', 'aims': {'M1': 'F', 'F': '고리'}}, 'K① 처음', 'M1 → F → 고리: 낮은 빛이 고리 아래 테두리에'),
        draw(img, 'K', {'stone': '바닥', 'aims': {'M1': 'F', 'F': 'M2'}}, 'K② F → M2', 'M2가 잠들어 있어 막힘 — 옆의 빈 그릇이 눈에 띈다'),
        draw(img, 'K', {'stone': 'S1', 'aims': {'M1': 'F', 'F': '고리'}}, 'K③ 돌을 S1에, F는 고리', 'M2가 깨었지만 빛은 여전히 낮다 — 고리 반대쪽 M2로 보내야(15의 원리)'),
        draw(img, 'K', {'stone': 'S1', 'aims': {'M1': 'F', 'F': 'M2'}}, 'K④ F → M2', 'M2가 높여 돌려보낸 빛이 F 위를 지나 고리 → 점등'),
    ]
    sheet(K, os.path.join(OUT, 'design-16-K.png'))

if __name__ == '__main__':
    main()
