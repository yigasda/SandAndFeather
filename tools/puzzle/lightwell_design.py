"""16 빛 우물 설계안(15 A안 "올림"의 심화, 구현 아님): 실제 채택 그림(사막맵/16_빛우물.png) 위에 장치·처음 상태·대표 오답·정답을
임시 도형으로 그린다. 계산은 15와 같은 규칙(src/packs/puzzle/lift.js)을 16 자리에 옮긴 작은 해석기로 모든 상태를 돌려 확인한다.

규칙(15에서 배운 것 + 16에서 새로 생긴 것)
  - 빛은 곧게 간다. 낮은 빛·높은 빛 두 높이. 높은 빛은 낮은 장치 위로 지나간다(15).
  - 올림: 낮은 빛을 높은 빛으로 바꿔, 온 쪽으로 돌려보낸다(15의 올림 틀).
  - 고리는 가운데 유리에 높은 빛이 닿아야 켜진다. 낮은 빛은 고리 아래 테두리에 닿는다(15와 같은 규칙).
  - 새로: 받침 M1·M2는 잠들어 있으면 낮은 빛을 막는다. 옆 그릇에 봉인석이 있으면 깨어나 '올림'이 된다.
  - 새로: 봉인석은 하나, 그릇은 둘(S1 기존, S2 제안). 돌은 바닥·손·그릇 중 한 곳에만.
  - 돌림판 F(제안)만 돌린다: 정해진 네 겨냥(고리, M1, M2, 벽감) 중 하나.
16 맵은 아직 게임에 없다(그림·충돌은 저장소에 있음: 사막맵/16_빛우물.png, 사막맵/충돌/16_빛우물.png). 위치·높이는 그림에서 잰 추정이다.
  python3 tools/puzzle/lightwell_design.py [out]"""
import itertools, json, math, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'consult', 'desert', 'puzzle16')
F = lambda n: ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', n)
LOW_Z, HIGH_Z = 60, 100                       # drawing heights (estimates): the bronze heads; the ring's middle
# picture points (x, floor y)
W = (512, 770)                                # 놋쇠 입구(원반 앞): 광원 후보
FP = (305, 590)                               # 돌림판 F(제안): 고리–M1 줄 위
M1, M2 = (230, 880), (770, 500)               # 기존 받침
S1, S2 = (884, 470), (330, 880)               # 기존 그릇 · 제안 그릇(M1 옆)
R1 = (380, 300)                               # 고리(뒷벽)
NICHE = (530, 300)
K1_FLOOR = (690, 1010)                        # 봉인석 처음 자리(입구 계단 옆, 제안)
AIMS = {'고리': R1, 'M1': M1, 'M2': M2, '벽감': NICHE}
SIDE = 36                                     # the woken pedestal's two windows side by side (picture px)
STONE = ['바닥', 'S1', 'S2']

def unit(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]; n = math.hypot(dx, dy); return dx / n, dy / n

def trace(aim, stone):
    """→ (segments [(a, b, level)], end text, lit)"""
    awake = {'M1': stone == 'S2', 'M2': stone == 'S1'}
    segs = [(W, FP, 'low')]
    tgt = AIMS[aim]
    if aim == '고리': return segs + [(FP, R1, 'low')], '낮은 빛이 고리 아래 테두리에 닿음', False
    if aim == '벽감': return segs + [(FP, NICHE, 'low')], '낮은 빛이 닫힌 벽감 문에 닿음', False
    segs.append((FP, tgt, 'low'))
    if not awake[aim]: return segs, f'{aim}이 잠들어 있어 빛을 막음', False
    # the lift: back the way it came, high, from its other window beside the one it took the light in (as in 15, the
    # two lights are two lines), past F, on and on
    ux, uy = unit(tgt, FP); nx, ny = -uy * SIDE, ux * SIDE
    a = (tgt[0] + nx, tgt[1] + ny)
    if aim == 'M1': return segs + [(a, (R1[0] + nx, R1[1] + ny), 'high')], '높은 빛이 F 옆 위로 지나 고리 가운데에 → 점등', True
    return segs + [(a, (FP[0] + ux * 250 + nx, FP[1] + uy * 250 + ny), 'high')], '높아졌지만 온 쪽으로 돌아가 왼쪽 벽에 닿음', False

def scr(p, z): return (p[0], p[1] - z)

def draw(img, aim, stone, title, note=None):
    im = img.convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(ov)
    GREEN, PINK = (40, 190, 90, 255), (230, 40, 200, 255)
    for n, p in (('M1', M1), ('M2', M2)):
        aw = (n == 'M1' and stone == 'S2') or (n == 'M2' and stone == 'S1')
        x, y = scr(p, LOW_Z); g.ellipse((x - 34, y - 34, x + 34, y + 34), outline=(255, 220, 90, 255) if aw else GREEN, width=5 if aw else 3)
        g.text((x + 38, y - 16), f'{n} {"깨어남(올림)" if aw else "잠듦"}', font=F(22), fill=(255, 230, 120, 255) if aw else (20, 110, 50, 255))
    for n, p, new in (('S1 그릇(기존)', S1, False), ('S2 그릇(제안)', S2, True)):
        x, y = scr(p, 30); g.ellipse((x - 20, y - 12, x + 20, y + 12), outline=PINK if new else GREEN, width=3)
        if (n.startswith('S1') and stone == 'S1') or (n.startswith('S2') and stone == 'S2'): g.ellipse((x - 13, y - 9, x + 13, y + 9), fill=(120, 200, 230, 255))
        g.text((x - 40, y + 14), n, font=F(18), fill=PINK if new else (20, 110, 50, 255))
    if stone == '바닥':
        x, y = K1_FLOOR; g.rounded_rectangle((x - 16, y - 20, x + 16, y + 6), 6, fill=(120, 200, 230, 255), outline=PINK, width=3); g.text((x + 22, y - 14), '봉인석 K1(제안 자리)', font=F(18), fill=PINK)
    x, y = scr(FP, LOW_Z); g.rectangle((x - 26, y - 10, x + 26, y + 70), outline=PINK, width=3, fill=(230, 40, 200, 60))
    tx, ty = scr(AIMS[aim], LOW_Z); ux, uy = unit((x, y), (tx, ty)); g.line((x, y, x + ux * 30, y + uy * 30), fill=(255, 200, 60, 255), width=6)
    g.text((x - 70, y + 74), f'돌림판 F(제안) → {aim}', font=F(18), fill=PINK)
    x, y = scr(W, 25); g.ellipse((x - 16, y - 10, x + 16, y + 10), outline=GREEN, width=3); g.text((x + 20, y), '놋쇠 입구 = 광원(해석, 확인 필요)', font=F(16), fill=(20, 110, 50, 255))
    x, y = scr(R1, HIGH_Z); g.ellipse((x - 52, y - 52, x + 52, y + 52), outline=GREEN, width=3)
    x, y = scr(NICHE, 85); g.rectangle((x - 60, y - 50, x + 60, y + 40), outline=GREEN, width=3)
    segs, end, lit = trace(aim, stone)
    for a, b, lv in segs:
        z = LOW_Z if lv == 'low' else HIGH_Z
        g.line((*scr(a, z), *scr(b, z)), fill=(255, 160, 40, 110) if lv == 'low' else (255, 246, 200, 130), width=14 if lv == 'high' else 9)
        g.line((*scr(a, z), *scr(b, z)), fill=(255, 160, 40, 255) if lv == 'low' else (255, 252, 230, 255), width=5 if lv == 'high' else 3)
    for (a0, b0, l0), (a, b, lv) in zip(segs, segs[1:]):   # the climb inside a woken pedestal: from the low window to the high one
        if lv == 'high': g.line((*scr(b0, LOW_Z), *scr(a, HIGH_Z)), fill=(255, 220, 120, 255), width=6)
    ex, ey = scr(segs[-1][1], LOW_Z if segs[-1][2] == 'low' else HIGH_Z)
    g.ellipse((ex - 16, ey - 16, ex + 16, ey + 16), fill=(80, 255, 120, 230) if lit else (255, 70, 40, 220))
    if lit: x, y = scr(NICHE, 85); g.rectangle((x - 60, y - 50, x + 60, y + 40), fill=(255, 230, 120, 90))
    g.rectangle((0, 0, im.width, 96), fill=(20, 12, 6, 225))
    g.text((14, 8), title, font=F(30), fill=(255, 235, 200, 255)); g.text((14, 52), note or end, font=F(24), fill=(255, 215, 160, 255))
    return Image.alpha_composite(im, ov).convert('RGB')

def main():
    os.makedirs(OUT, exist_ok=True)
    img = Image.open(os.path.join(ROOT, '사막맵', '16_빛우물.png'))
    allst = [(a, s) for a, s in itertools.product(AIMS, STONE)]
    wins = [st for st in allst if trace(*st)[2]]
    table = {f'{a}/{s}': trace(a, s)[1] for a, s in allst}
    json.dump({'states': len(allst), 'answers': wins, 'ends': table}, open(os.path.join(OUT, 'solver.json'), 'w'), ensure_ascii=False, indent=1)
    print('상태', len(allst), '정답', wins)
    panels = [
        draw(img, '고리', '바닥', '① 처음', '돌림판이 고리를 겨눔 → 낮은 빛이 고리 아래 테두리에 (15에서 본 "낮다")'),
        draw(img, 'M2', 'S1', '② 눈에 띄는 빈 그릇 S1에 돌', 'M2가 깨어 빛을 높였지만, 온 쪽으로 돌아가 왼쪽 벽에'),
        draw(img, 'M1', 'S1', '③ 돌은 S1 그대로, M1을 겨눔', 'M1은 잠들어 있어 낮은 빛을 막음 — 고리·F·M1이 한 줄인 게 보인다'),
        draw(img, 'M1', 'S2', '④ 돌을 빼서 S2에, F는 M1', '깬 M1이 높여 돌려보낸 빛이 F 위로 지나 고리 → 벽감 열림'),
    ]
    w, h = panels[0].size; k = 0.45
    sheet = Image.new('RGB', (int(w * k) * 2 + 30, int(h * k) * 2 + 30), (24, 16, 10))
    for i, p in enumerate(panels): sheet.paste(p.resize((int(w * k), int(h * k)), Image.LANCZOS), (10 + (i % 2) * (int(w * k) + 10), 10 + (i // 2) * (int(h * k) + 10)))
    sheet.save(os.path.join(OUT, 'design-16.png'))
    for i, p in enumerate(panels): p.resize((w // 2, h // 2), Image.LANCZOS).save(os.path.join(OUT, f'16-{i + 1}.png'))

if __name__ == '__main__':
    main()
