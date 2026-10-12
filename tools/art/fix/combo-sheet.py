# 3×3 sheet of bed-pairs.js screenshots (6 pairs, 3 alone) cropped to the bed, with level lines to compare heads.
#   python3 combo-sheet.py <folder of pair_*.png> x0,y0,x1,y1 <out.png> [zoom 2] [line every 24 px]
import sys
from PIL import Image, ImageDraw
d0, box, out = sys.argv[1], tuple(int(v) for v in sys.argv[2].split(',')), sys.argv[3]
z = int(sys.argv[4]) if len(sys.argv) > 4 else 2; step = int(sys.argv[5]) if len(sys.argv) > 5 else 24
cases = [('somang', 'set'), ('somang', 'horus'), ('set', 'somang'), ('horus', 'somang'), ('set', 'horus'), ('horus', 'set'), ('somang', ''), ('set', ''), ('horus', '')]
cw, ch = (box[2] - box[0]) * z, (box[3] - box[1]) * z
sh = Image.new('RGB', (cw * 3, ch * 3)); d = ImageDraw.Draw(sh)
for i, (l, w) in enumerate(cases):
    im = Image.open(f'{d0}/pair_{l}_{w}.png').convert('RGB').crop(box).resize((cw, ch), Image.NEAREST)
    x, y = (i % 3) * cw, (i // 3) * ch; sh.paste(im, (x, y))
    for yy in range(y, y + ch, step): d.line([(x, yy), (x + cw, yy)], fill=(0, 220, 0))
    d.rectangle([x, y, x + 120, y + 14], fill=(0, 0, 0)); d.text((x + 3, y + 1), l + (' + ' + w if w else ''), fill=(255, 255, 255))
sh.save(out)
