"""맵별 검수 그림 (OPUS 사막 계획서 18절 '맵별 검수'): 채택 배경 위에
  빨강 = 사용자 충돌 원본의 경계(알파 128 이상 = 바닥), 파랑 = 게임에 들어간 경계(data/maps의 pixelWalk),
  보라 사각형 = 출입 트리거(발 중심이 들어가면 이동, → 목적지:착지), 초록 = 착지점의 발 상자(FOOT)와 바라보는 방향.
두 경계가 1px이라도 다르면 노랑으로 칠하고 개수를 적는다. 착지마다 발 상자가 바닥 안인지, 발 중심이 출구 트리거
밖인지(도착하자마자 다시 이동하지 않는지) 검사한다.
Writes docs/consult/desert/maps/<id>-overlay.png and prints a table.
  python3 tools/maps/desert-overlay.py [map id …]"""
import json, sys, unicodedata
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/art/map-expansion/desert-connections-review'
FOOT = {'x0': 0.22, 'x1': 0.78, 'y0': 0.62, 'y1': 0.96}   # src/world/player.js
def font(size=22):
    for f in ('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'):
        if Path(f).exists(): return ImageFont.truetype(f, size)
    return ImageFont.load_default()


ARROW = {'up': (0, -1), 'down': (0, 1), 'left': (-1, 0), 'right': (1, 0)}


def walk_mask(pw):
    m = np.zeros((pw['height'], pw['width']), bool)
    for y, row in enumerate(pw['rows']):
        for i in range(0, len(row), 2): m[y, row[i]:row[i + 1]] = True
    return m


def edge(m): return m ^ nd.binary_erosion(m)


def main(ids):
    OUT.mkdir(parents=True, exist_ok=True)
    for ident in ids:
        d = json.loads((ROOT / f'data/maps/{ident}.json').read_text())
        src = d['source']
        art = Image.open(ROOT / unicodedata.normalize('NFC', src['art'])).convert('RGB')
        user = np.asarray(Image.open(ROOT / unicodedata.normalize('NFC', src['collision'])).convert('RGBA'))[..., 3] >= src['floorAlphaAtLeast']
        pw = d['authoredCollision']['pixelWalk']; applied = walk_mask(pw); PX = pw['pixelsPerTile']
        diff = user != applied
        im = np.asarray(art).astype(float) * 0.75
        im[edge(user)] = [255, 40, 40]
        im[edge(applied) & ~edge(user)] = [40, 120, 255]
        im[diff] = [255, 230, 0]
        img = Image.fromarray(im.astype('uint8')); g = ImageDraw.Draw(img); F = font()
        for e in d['exits']:
            box = [e['x0'] * PX, e['y0'] * PX, e['x1'] * PX, e['y1'] * PX]
            g.rectangle(box, outline=(220, 0, 255), width=3)
            g.text((box[0] + 4, box[1] + 4), f"출구 {e['id']} → {e['to']}:{e['at']}", fill=(255, 255, 255), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
        rows = []
        for k, p in d['entries'].items():
            fx0, fx1 = (p['x'] + FOOT['x0']) * PX, (p['x'] + FOOT['x1']) * PX
            fy0, fy1 = (p['y'] + FOOT['y0']) * PX, (p['y'] + FOOT['y1']) * PX
            clear = bool(applied[int(fy0):int(fy1) + 1, int(fx0):int(fx1) + 1].all())
            cx, cy = (p['x'] + 0.5), (p['y'] + 0.8)
            inside = [e['id'] for e in d['exits'] if e['x0'] <= cx <= e['x1'] and e['y0'] <= cy <= e['y1']]
            g.rectangle([fx0, fy0, fx1, fy1], outline=(0, 255, 90), width=3)
            ax, ay = ARROW[p['dir']]; mx, my = (fx0 + fx1) / 2, (fy0 + fy1) / 2
            g.line([mx, my, mx + ax * PX, my + ay * PX], fill=(0, 255, 90), width=3)
            g.text((fx1 + 4, fy0), f'착지 {k}', fill=(0, 255, 90), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
            rows.append(f"  착지 {k}: 발 상자 {'바닥 안' if clear else '막힌 곳에 걸림'}, 출구 트리거 {'안: ' + ','.join(inside) if inside else '밖'}")
        g.text((12, 12), 'DATA OVERLAY (not a game capture)', fill='white', font=F, stroke_width=2, stroke_fill='black')
        img.save(OUT / f'{ident}-overlay.png')
        print(f"{ident}: 원본 {user.shape[1]}×{user.shape[0]} / 적용 {pw['width']}×{pw['height']}, 경계 차이 {int(diff.sum())}px, 출구 {len(d['exits'])}개")
        print('\n'.join(rows))


if __name__ == '__main__':
    ids = sys.argv[1:] or [m for m in json.loads((ROOT / 'tools/maps/desert-registry.json').read_text())['places'] and
                           sorted(p.stem for p in (ROOT / 'data/maps').glob('desert_*.json'))]
    main(ids)
