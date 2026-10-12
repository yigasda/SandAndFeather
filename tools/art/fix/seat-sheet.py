"""Sheet of tools/st-test/seats.js screenshots: one row per seat, Somang · Set · Horus across.
   python3 tools/art/fix/seat-sheet.py <seats.js out folder> <sheet.png> [scale]
Boxes are screenshot px (dpr 2) around each seat, for where seats.js stands; change both together."""
import os, sys
from PIL import Image, ImageDraw, ImageFont

BOXES = {
    'dining': (250, 700, 550, 960),
    'set_table_l': (330, 700, 630, 960),
    'set_table_r': (180, 700, 480, 960),
    'set_desk': (120, 620, 420, 880),
    'horus_desk': (430, 720, 730, 980),
    'somang_mirror': (70, 640, 370, 900),
    'somang_chair': (0, 800, 300, 1060),
}
LABELS = {'dining': '식탁 오른쪽', 'set_table_l': '세트 방 탁자\n왼쪽 방석', 'set_table_r': '세트 방 탁자\n오른쪽 방석', 'set_desk': '세트 책상\n걸상',
          'horus_desk': '호루스 책상\n걸상', 'somang_mirror': '소망 화장대\n걸상', 'somang_chair': '소망 방\n긴 의자'}
WHO = [('somang', '소망'), ('set', '세트'), ('horus', '호루스')]


def font(size):
    for p in ['/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
              '/usr/share/fonts/truetype/nanum/NanumGothic.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def main():
    src, out = sys.argv[1], sys.argv[2]
    k = float(sys.argv[3]) if len(sys.argv) > 3 else 0.6
    rows = [n for n in BOXES if os.path.exists(os.path.join(src, f'seat_{n}_set.png'))]
    w, h = int(300 * k), int(260 * k)
    lab, top = 150, 34
    sheet = Image.new('RGB', (lab + w * 3, top + h * len(rows)), (30, 26, 22))
    d = ImageDraw.Draw(sheet); f = font(18)
    for c, (_, name) in enumerate(WHO): d.text((lab + c * w + 8, 6), name, fill=(255, 235, 200), font=f)
    for r, n in enumerate(rows):
        d.multiline_text((6, top + r * h + h // 2 - 22), LABELS.get(n, n), fill=(255, 235, 200), font=f, spacing=4)
        for c, (who, _) in enumerate(WHO):
            p = os.path.join(src, f'seat_{n}_{who}.png')
            if not os.path.exists(p): continue
            x0, y0, x1, y1 = BOXES[n]
            sheet.paste(Image.open(p).convert('RGB').crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS), (lab + c * w, top + r * h))
    sheet.save(out)
    print(out, sheet.size)


if __name__ == '__main__':
    main()
