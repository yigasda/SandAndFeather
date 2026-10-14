# 전투 그림 비율 맞추기 (0.9.72, user: 세트 비율이 정지·걷기랑 완전 달라, 소망도): the head and the body of every combat
# picture of one character scaled about the neck by one pair of factors (fix/headbody.py: head h, body b), so the
# head : body proportion is the final idle's and walk's. The factors come from the standing combat frames measured
# against the idle (top of the hair → chin, chin → soles; numbers in the folder's README). Nothing is redrawn.
# The neck of each picture: where head-check.py found the idle head (size, tilt, place), carried to the idle's neck
# point; NECK_FIX overrides a frame where that was off (checked on the neck sheet).
#   python3 tools/art/fix/combat-ratio.py <who> <head.json> <out folder> [h b R pad]
#   → <out>/png/<file> (the canvas padded by `pad` on top, so a grown head stays inside), <out>/neck-sheet.png
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')
KO = {'set': '세트', 'somang': '소망', 'horus': '호루스'}
# the idle's neck (where the chin meets the neck, middle of the neck), on the final idle side pictures
IDLE_NECK = {('set', 'right'): (330, 400), ('set', 'left'): (290, 400),
             ('somang', 'right'): (360, 430), ('somang', 'left'): (262, 405)}
# where head-check's match was weak the neck it gives is too high (on the face): moved down onto the neck (px, checked
# on the zoomed neck sheet)
NECK_DY = {'somang-right-combat-anticipation-0.png': 35, 'somang-right-combat-attack-0.png': 15, 'somang-right-combat-hit-0.png': 22,
           'somang-right-combat-spell-0.png': 30, 'somang-right-combat-tired-0.png': 15}
NECK_FIX = {}   # file → (x, y) where the found neck was off


def neck_of(who, view, r):
    idle = Image.open(os.path.join(ROOT, 'docs', 'art', 'chibi-refresh', 'final', who, 'idle', f'{who}-{view}.png'))
    b = idle.getbbox(); tw, th = b[2] - b[0], int(0.45 * (b[3] - b[1]))
    s, a = r['size'], math.radians(r['angle'])
    w, h = tw * s, th * s
    pw = abs(w * math.cos(a)) + abs(h * math.sin(a)); ph = abs(w * math.sin(a)) + abs(h * math.cos(a))
    cx, cy = r['at'][0] + pw / 2, r['at'][1] + ph / 2
    nx, ny = IDLE_NECK[(who, view)]
    dx, dy = (nx - b[0] - tw / 2) * s, (ny - b[1] - th / 2) * s
    return round(cx + dx * math.cos(a) - dy * math.sin(a)), round(cy + dx * math.sin(a) + dy * math.cos(a))


def main():
    who, hj, out = sys.argv[1:4]
    h, b, R, pad = (float(x) for x in sys.argv[4:8]) if len(sys.argv) > 7 else (None, None, 70, 80)
    res = {r['file']: r for r in json.load(open(hj))}
    src = os.path.join(ROOT, '메인2', KO[who])
    files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
    os.makedirs(os.path.join(out, 'png'), exist_ok=True)
    necks, thumbs = {}, []
    for f in files:
        view = 'left' if '-left-' in f else 'right'
        nx, ny = NECK_FIX.get(f) or neck_of(who, view, res[f]); ny += NECK_DY.get(f, 0)
        necks[f] = [nx, ny]
        im = Image.open(os.path.join(src, f)).convert('RGBA')
        bg = Image.new('RGBA', im.size, (233, 216, 180, 255)); bg.alpha_composite(im); d = ImageDraw.Draw(bg)
        d.ellipse([nx - 9, ny - 9, nx + 9, ny + 9], outline=(0, 160, 255), width=4); d.line([(nx - 60, ny), (nx + 60, ny)], fill=(0, 160, 255), width=2)
        d.text((10, 10), f, fill=(0, 0, 0))
        bb = im.getbbox(); thumbs.append(bg.crop((max(0, bb[0] - 20), 0, min(im.width, bb[2] + 20), im.height)))
        if h is not None:
            dst = os.path.join(out, 'png', f)
            big = Image.new('RGBA', (im.width, im.height + int(pad)), (0, 0, 0, 0)); big.paste(im, (0, int(pad))); big.save(dst)
            subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'headbody.py'), dst, dst,
                            str(h), str(b), str(nx), str(ny + int(pad)), str(int(R))], check=True, capture_output=True)
    # the neck sheet: every picture with the neck point found
    W = sum(t.width for t in thumbs[:9]); sheet = Image.new('RGB', (max(W, sum(t.width for t in thumbs[9:])), 2 * thumbs[0].height), (255, 255, 255))
    x = 0
    for t in thumbs[:9]: sheet.paste(t, (x, 0)); x += t.width
    x = 0
    for t in thumbs[9:]: sheet.paste(t, (x, thumbs[0].height)); x += t.width
    sheet.thumbnail((3600, 1600)); sheet.save(os.path.join(out, 'neck-sheet.png'))
    json.dump(necks, open(os.path.join(out, 'necks.json'), 'w'), indent=1)
    print(who, len(files), 'necks', 'fixed' if h is not None else '(sheet only)')


if __name__ == '__main__':
    main()
