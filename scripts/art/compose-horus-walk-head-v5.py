"""Package generated whole-head revisions; crop/scale/layout only, no repainting."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import json, hashlib, shutil

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'docs/art/chibi-refresh'
O = D / 'animations/walk-v5-horus-head-redraw'
O.mkdir(parents=True, exist_ok=True)
DIRS = ['front', 'back', 'left', 'right']
SOURCES = ['exec-04b27616-e4d6-4ef4-b715-476b3742e54c.png', 'exec-61628ce5-1000-4847-9f11-30fbe696869f.png', 'exec-8c5d3cdf-389a-41ad-89a0-2e1c62769ee8.png', 'exec-c2ffea7e-fcc1-4697-b8af-6faebfe1a81e.png']
BG = '#f3f0eb'
FONT = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 23)
frames, entries = {}, []
sheet = Image.new('RGBA', (1080, 1600))
for row, (direction, source) in enumerate(zip(DIRS, SOURCES)):
    src = O / f'{direction}-source.png'
    if not src.exists():
        shutil.copyfile(Path('/workspace/generated_images') / source, src)
    im = Image.open(src).convert('RGBA')
    tiles, boxes = [], []
    for phase in range(3):
        tile = im.crop((round(phase*im.width/3), 0, round((phase+1)*im.width/3), im.height))
        a = np.array(tile)
        yy, xx = np.where(a[:, :, 3] > 8)
        boxes.append((int(xx.min())-2, int(yy.min())-2, int(xx.max())+3, int(yy.max())+3))
        tiles.append(tile)
    top, bottom = min(b[1] for b in boxes), max(b[3] for b in boxes)
    scale = 330 / (bottom-top)
    frames[direction] = []
    for phase, (tile, b) in enumerate(zip(tiles, boxes)):
        crop = tile.crop((b[0], top, b[2], bottom))
        crop = crop.resize((round(crop.width*scale), 330), Image.Resampling.LANCZOS)
        cv = Image.new('RGBA', (360, 400))
        cv.alpha_composite(crop, ((360-crop.width)//2, 40))
        name = f'horus-{direction}-{phase}.png'
        cv.save(O/name)
        frames[direction].append(cv)
        sheet.alpha_composite(cv, (phase*360, row*400))
        entries.append({'path':str((O/name).relative_to(ROOT)), 'view':direction, 'gameDirection':{'front':'down','back':'up','left':'left','right':'right'}[direction], 'phase':phase, 'size':[360,400], 'pivot':[180,370], 'referenceVisibleHeight':330, 'sha256':hashlib.sha256((O/name).read_bytes()).hexdigest()})
sheet.save(O/'horus-walk-sheet.png')
board = Image.new('RGB', (1440, 1720), BG)
draw = ImageDraw.Draw(board)
for c, label in enumerate(['승인된 기본 시안', '걷기 0 · 머리 전체 수정', '걷기 1', '걷기 2']):
    draw.text((180+c*360, 15), label, font=FONT, fill='#49443e', anchor='mt')
for r, direction in enumerate(DIRS):
    idle = Image.open(D/f'skin-tone/horus-v1/horus-idle-{direction}.png').convert('RGBA')
    idle = idle.resize((round(620*330/628), round(720*330/628)), Image.Resampling.LANCZOS)
    board.paste(idle, ((360-idle.width)//2, 65+r*410+22), idle)
    for c, cv in enumerate(frames[direction]):
        board.paste(cv, ((c+1)*360, 65+r*410), cv)
    draw.text((10, 65+r*410), ['앞','뒤','왼쪽','오른쪽'][r], font=FONT, fill='#49443e')
board.save(O/'idle-walk-comparison.jpg', quality=96)

def gif(images, path):
    atlas=Image.new('RGB',(images[0].width*len(images),images[0].height))
    for i,im in enumerate(images): atlas.paste(im,(i*im.width,0))
    pal=atlas.quantize(colors=255)
    qs=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in images]
    qs[0].save(path,save_all=True,append_images=qs[1:],duration=180,loop=0,disposal=2)

horus, trio = [], []
for phase, dx, dy in [(0,1,0),(1,0,-1),(2,-1,0),(1,0,-1)]:
    hb = Image.new('RGB',(1440,440),BG)
    tb = Image.new('RGB',(650,900),BG)
    td = ImageDraw.Draw(tb)
    for r, direction in enumerate(DIRS):
        h=frames[direction][phase]
        if r==0:
            placed=Image.new('RGBA',h.size); placed.alpha_composite(h,(dx,dy)); h=placed
        hb.paste(h,(r*360,40),h)
        ImageDraw.Draw(hb).text((r*360+180,8),['앞','뒤','왼쪽','오른쪽'][r],font=FONT,fill='#49443e',anchor='mt')
        for c, who in enumerate(['set','somang','horus']):
            source=h if who=='horus' else Image.open(D/f'animations/walk-v1/{who}-{direction}-{phase}.png').convert('RGBA')
            tile=source.resize((180,200),Image.Resampling.LANCZOS)
            tb.paste(tile,(65+c*195,55+r*205),tile)
        td.text((8,135+r*205),['앞','뒤','왼쪽','오른쪽'][r],font=FONT,fill='#49443e')
    for c,label in enumerate(['세트','소망','호루스']): td.text((155+c*195,16),label,font=FONT,fill='#49443e',anchor='mt')
    horus.append(hb);trio.append(tb)
gif(horus,O/'horus-four-directions.gif')
gif(trio,O/'trio-walk-preview.gif')
(O/'manifest.json').write_text(json.dumps({'status':'whole-head-revision-review','skinToneStatus':'approved','runtimeApplied':False,'baseIdleFolder':'docs/art/chibi-refresh/skin-tone/horus-v1','method':'Whole-head image-generation edits per direction, then crop and uniform scale per strip; not a pixel-identical head transplant.','sequence':[0,1,2,1],'durationMs':180,'frontOffsetsSourcePx':[[1,0],[0,-1],[-1,0],[0,-1]],'addedRotation':0,'frames':entries},ensure_ascii=False,indent=2)+'\n')
assert len(entries)==12
for e in entries:
    im=Image.open(ROOT/e['path']);b=im.getbbox()
    assert im.mode=='RGBA' and im.size==(360,400) and b[0]>0 and b[1]>0 and b[2]<360 and b[3]<400
print('Validated 12 RGBA frames, sheet, comparison, and GIFs. Source strips preserved.')
