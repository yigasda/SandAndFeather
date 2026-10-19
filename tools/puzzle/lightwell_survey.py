"""16 빛 우물 조사표(검토용): 채택 그림(사막맵/16_빛우물.png) 위에 기존 장치를 표시하고, 15 설계안 A·B·C 각각의 16 확장 후보를
임시 도형으로 얹는다. 16은 아직 맵·충돌이 없다: 위치·높이는 그림에서 잰 추정이며 선택 뒤 실측한다.
  python3 tools/puzzle/lightwell_survey.py [out]"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'consult', 'desert', 'puzzle15')
F = lambda n: ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', n)
GREEN, PINK, BLUE = (40, 190, 90), (230, 40, 200), (60, 170, 255)
# measured on the picture (px): the screen point, and a note on height (Z = foot Y − screen y)
EXIST = [
    ('R1 고리 수신부', (380, 200), 55, '뒷벽, 가운데 Z≈100, 반지름≈52', (60, 290)),
    ('벽감(보상)', (530, 215), 60, '빈 칸으로 그려짐 → 닫힘 그림 필요', (470, 300)),
    ('M2 받침(비활성 후보)', (770, 470), 45, '청동틀 Z≈70', (560, 370)),
    ('S1 빈 받침(소켓)', (884, 470), 30, 'M2 옆 빈 그릇', (700, 560)),
    ('M1 받침', (230, 865), 45, '청동틀 Z≈60', None),
    ('중앙 낮은 원반', (512, 690), 150, '높이≈20, 태양 문양', None),
    ('놋쇠 입구(광원 후보)', (512, 770), 22, '위로 열림 — 빛 방향 확인 필요', None),
    ('15에서 내려오는 계단', (512, 1300), 140, '입구', None),
]
IDEAS = {
    'A': [('올림 받침(16)', (770, 520), '봉인석을 S1에 넣으면 M2가 “올림 받침”으로 바뀜 — 어느 받침을 올림으로 쓸지 고르기(S2 후보: M1 옆)', (300, 950))],
    'B': [('기울기 추', (884, 520), '봉인석 = 추: S1에 넣으면 M2가 한 칸 기울어짐. 경로 길이를 골라 같은 기울기로 닿게', None)],
    'C': [('깨우는 원반', (512, 690), '원반이 빛을 받으면 깨어 다시 쏨(빛 활성) + 봉인석이 M2를 깨움(돌 활성): 두 깨우기의 순서', None)],
}

def main():
    os.makedirs(OUT, exist_ok=True)
    im = Image.open(os.path.join(ROOT, '사막맵', '16_빛우물.png')).convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); g = ImageDraw.Draw(ov)
    for name, (x, y), r, note, at in EXIST:
        g.ellipse((x - r, y - r * 0.7, x + r, y + r * 0.7), outline=GREEN + (255,), width=4)
        lx, ly = at or (x + r + 6, y - 22)
        g.rectangle((lx - 4, ly - 2, lx + 12 * max(len(name), len(note)) + 20, ly + 50), fill=(255, 250, 235, 200))
        g.text((lx, ly), name, font=F(24), fill=(20, 110, 50, 255)); g.text((lx, ly + 28), note, font=F(18), fill=(20, 90, 40, 255))
    g.rectangle((0, 0, im.width, 120), fill=(20, 12, 6, 215))
    g.text((14, 10), '16 빛 우물 조사 — 초록: 그림에 있는 장치(추정 위치·높이)', font=F(30), fill=(255, 235, 200, 255))
    g.text((14, 52), '맵·충돌 아직 없음. 선택한 안의 16 장치는 실측 뒤 배치. 15와 같은 자리값을 복사하지 않음', font=F(22), fill=(255, 215, 160, 255))
    g.text((14, 84), '분홍 글은 설계안별 16 확장 후보(원리)', font=F(22), fill=(255, 160, 230, 255))
    y0 = 1380
    for k, items in IDEAS.items():
        for name, (x, y), note, extra in items:
            g.rectangle((x - 26, y - 26, x + 26, y + 26), outline=PINK + (255,), width=4); g.text((x - 20, y - 14), k, font=F(26), fill=PINK + (255,))
            if extra: g.rectangle((extra[0] - 26, extra[1] - 26, extra[0] + 26, extra[1] + 26), outline=PINK + (255,), width=3); g.text((extra[0] - 30, extra[1] + 30), 'S2 후보', font=F(18), fill=PINK + (255,))
        g.rectangle((0, y0, im.width, y0 + 50), fill=(20, 12, 6, 200)); g.text((10, y0 + 10), f'{k}안 16: ' + items[0][2], font=F(19), fill=(255, 190, 240, 255)); y0 += 52
    out = Image.alpha_composite(im, ov).convert('RGB')
    out.resize((out.width * 3 // 4, out.height * 3 // 4), Image.LANCZOS).save(os.path.join(OUT, 'lightwell-16-survey.png'))

if __name__ == '__main__':
    main()
