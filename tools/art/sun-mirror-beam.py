"""태양거울 광선 맞춤 확인 그림 (OPUS 사막 계획서 16절, 사용자 지시): 몸 프레임 06·07(light_attack) 위에 별도 광선 PNG를 얹는다.
  - 방향: 거울이 보는 쪽으로 수평(사용자 화살표: 그림대로면 정왼쪽). 그림대로면 광선 PNG를 좌우 반전, 몹을 좌우 반전하면
    광선은 원래(왼→오). 회전하지 않는다.
  - 발사점: 사용자가 표시한 점(검은 동그라미, docs/consult/desert/mobs/user-beam-start.jpg)을 프레임 캔버스(440×494) 좌표로
    옮긴 SOCKET. 광선 PNG의 기준점 (0.13, 0.5)을 여기에 맞춘다.
Writes docs/consult/desert/mobs/sun-mirror-beam-origin.png.  python3 tools/art/sun-mirror-beam.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
BEAM = ROOT / 'docs/art/desert-sun-mirror-motion-revisions-2026-10-16/beam.png'
ORIGIN = (0.13, 0.5)                  # beam.png manifest originApproxNormalized
# launch socket per attack frame, canvas px of the art as drawn (facing left); from the user's circles: the outline box of
# each mirrored frame in their screenshot against its alpha box here (scale 1.225), circle centres (312.7, 187.7)·(328.7, 951.7)
SOCKET = {'06_light_attack_0': (222, 299), '07_light_attack_1': (210, 302)}
K = 0.3                               # beam size in this picture only; the game sets its own


def main():
    F = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 22)
    beam = Image.open(BEAM); b = beam.resize((round(beam.width * K), round(beam.height * K)), Image.LANCZOS); bl = ImageOps.mirror(b)
    ox, oy = ORIGIN[0] * b.width, ORIGIN[1] * b.height
    W, H = 900, 620; sheet = Image.new('RGB', (W * 2, H * 2))
    for r, (f, (sx, sy)) in enumerate(SOCKET.items()):
        fr = Image.open(ROOT / f'몹/사막/05_태양거울/{f}.png'); FW = fr.width
        for c, right in enumerate((False, True)):
            cv = Image.new('RGBA', (W, H), (70, 60, 55, 255))
            off = (40, 60) if right else (W - 480, 60)
            cv.alpha_composite(ImageOps.mirror(fr) if right else fr, off)
            cx, cy = off[0] + (FW - sx if right else sx), off[1] + sy
            if right: cv.alpha_composite(b, (round(cx - ox), round(cy - oy)))
            else: cv.alpha_composite(bl, (round(cx - (bl.width - ox)), round(cy - oy)))
            d = ImageDraw.Draw(cv)
            d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], outline=(0, 255, 120), width=2)
            d.text((10, H - 36), f"{f[:2]} · {'오른쪽을 봄(좌우 반전) → 광선 오른쪽' if right else '왼쪽을 봄(그림 그대로) → 광선 왼쪽'} · 초록 ○ = 발사점",
                   fill='white', font=F)
            sheet.paste(cv.convert('RGB'), (c * W, r * H))
    sheet.save(ROOT / 'docs/consult/desert/mobs/sun-mirror-beam-origin.png')


if __name__ == '__main__':
    main()
