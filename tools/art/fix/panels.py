# side-by-side comparison for the user: the same crop of several pictures, each with a label on top.
#   python3 panels.py <out.png> x0,y0,x1,y1 "label=path" "label=path" ... [--bg r,g,b] [--zoom 1]
# Transparent pictures are flattened on --bg (default the sheet cream; use a dark one to check edges for halos).
# Show "지금 / 시안들 / 기준(세트 등)" in one row: the user picks by label.
import sys
from PIL import Image, ImageDraw
args = sys.argv[1:]; bg = (245, 239, 227); zoom = 1
if '--bg' in args: i = args.index('--bg'); bg = tuple(int(v) for v in args[i + 1].split(',')); del args[i:i + 2]
if '--zoom' in args: i = args.index('--zoom'); zoom = int(args[i + 1]); del args[i:i + 2]
out, box, items = args[0], tuple(int(v) for v in args[1].split(',')), [a.split('=', 1) for a in args[2:]]
w, h = (box[2] - box[0]) * zoom, (box[3] - box[1]) * zoom
sheet = Image.new('RGB', (w * len(items), h + 20), bg); d = ImageDraw.Draw(sheet)
for i, (lab, p) in enumerate(items):
    im = Image.open(p).convert('RGBA'); t = Image.new('RGBA', im.size, bg + (255,)); t.alpha_composite(im)
    sheet.paste(t.convert('RGB').crop(box).resize((w, h), Image.NEAREST), (i * w, 20)); d.text((i * w + 4, 4), lab, fill=(0, 0, 0) if sum(bg) > 380 else (255, 255, 255))
sheet.save(out)
