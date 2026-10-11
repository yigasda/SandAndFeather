# Drawing guides for new poses, made from the final standing sprites: one transparent 620×720 layer per character
# and direction, to lay under a new pose before drawing it, so its size and body proportion match the idle and
# walk from the start (fit-scale.py checks it afterwards).
#
#   python3 tools/art/pose-guide.py   → docs/art/chibi-refresh/pose-guides/
#       <who>-<view>-guide.png   transparent layer: the idle itself, faded, with its outline in red and level lines
#                                for the head top and the feet (the faded picture shows chin, hem and sandals itself)
#       guides-sheet.png         all twelve on paper, with the numbers
#       guides.json              the same numbers (idle canvas px and share of the height)
import importlib.util, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FINAL = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'final')
OUT = os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'pose-guides')
spec = importlib.util.spec_from_file_location('check_sprite', os.path.join(os.path.dirname(__file__), 'check-sprite.py'))
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
try:
    FONT = ImageFont.truetype('/usr/share/fonts/opentype/unifont/unifont.otf', 16)
except OSError:
    FONT = ImageFont.load_default()
WHO, VIEWS = ['set', 'somang', 'horus'], ['front', 'back', 'left', 'right']
KO = {'set': '세트', 'somang': '소망', 'horus': '호루스', 'front': '정면', 'back': '뒤', 'left': '왼쪽', 'right': '오른쪽'}
LINES = [('top', '머리 위끝', (0, 110, 230)), ('bottom', '발끝 (발 기준점)', (0, 110, 230))]


def main():
    os.makedirs(OUT, exist_ok=True)
    data, tiles = {}, []
    for who in WHO:
        for view in VIEWS:
            path = os.path.join(FINAL, who, 'idle', f'{who}-{view}.png')
            im = Image.open(path).convert('RGBA')
            r = cs.measure(path, who, view)[0]
            marks = r['marks']; H = r['H']
            a = np.asarray(im)[..., 3] > 128
            edge = a & ~(np.roll(a, 1, 0) & np.roll(a, -1, 0) & np.roll(a, 1, 1) & np.roll(a, -1, 1))
            layer = np.asarray(im).copy()
            layer[..., 3] = (layer[..., 3].astype(np.float32) * 0.35).astype(np.uint8)   # the idle, faded
            layer[edge] = (230, 0, 0, 220)                                                # its outline
            g = Image.fromarray(layer, 'RGBA'); d = ImageDraw.Draw(g)
            xs = np.nonzero(a.any(0))[0]
            for key, name, col in LINES:
                if key not in marks: continue
                y = marks[key]
                d.line([(xs.min() - 30, y), (xs.max() + 30, y)], fill=(*col, 230), width=2)
                d.text((xs.max() + 34, y - 9), name, fill=(*col, 255), font=FONT)
            g.save(os.path.join(OUT, f'{who}-{view}-guide.png'))
            data[f'{who}-{view}'] = {'canvas': [620, 720], 'pivot': [310, 662], 'referenceVisibleHeight': 576,
                                     'heightPx': H, **{k: int(marks[k]) for k, _, _ in LINES if k in marks},
                                     'hem': int(marks['hem']), 'hemShare': round((marks['hem'] - marks['top']) / H, 3)}
            paper = Image.new('RGBA', im.size, (245, 239, 227, 255)); paper.alpha_composite(g)
            tiles.append((who, view, paper, data[f'{who}-{view}']))
    tw, th = 310, 360
    sheet = Image.new('RGB', (tw * 4, (th + 40) * 3), (250, 248, 244)); d = ImageDraw.Draw(sheet)
    for i, (who, view, paper, info) in enumerate(tiles):
        x, y = (i % 4) * tw, (i // 4) * (th + 40)
        sheet.paste(paper.convert('RGB').resize((tw, th)), (x, y + 40))
        d.text((x + 6, y + 2), f"{KO[who]} {KO[view]} 키 {info['heightPx']}px", fill=(40, 30, 20), font=FONT)
        d.text((x + 6, y + 20), f"머리 위끝 y{info['top']} · 발끝 y{info['bottom']}", fill=(90, 60, 40), font=FONT)
    sheet.save(os.path.join(OUT, 'guides-sheet.png'))
    # which final idles these guides were made from: fit-scale.py warns when the final set has changed since
    man = json.load(open(os.path.join(FINAL, 'manifest.json')))
    data['_source'] = {'proportionRevision': man.get('proportionRevision'), 'skinPaletteRevision': man.get('skinPaletteRevision'),
                       'idleSha256': {f'{f["character"]}-{f["sourceView"]}': f['sha256'] for f in man['frames'] if f['state'] == 'idle'}}
    json.dump(data, open(os.path.join(OUT, 'guides.json'), 'w'), ensure_ascii=False, indent=1)
    print('→', os.path.relpath(OUT))


if __name__ == '__main__':
    main()
