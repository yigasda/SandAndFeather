"""Replace only Horus's three front walk poses, preserving all other v1 frames."""
from pathlib import Path
import shutil,json,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
D=Path('docs/art/chibi-refresh/animations');OLD=D/'walk-v1';OUT=D/'walk-v2-horus-front';OUT.mkdir(exist_ok=True)
source=OUT/'horus-front-source.png'
if not source.exists():shutil.copyfile('/workspace/generated_images/exec-8b04e997-543e-44aa-bb49-7f4dba8a601d.png',source)
im=Image.open(source).convert('RGBA');W,H=360,400;scale=330/702;new=[]
for i in range(3):
 tile=im.crop((i*724,0,(i+1)*724,724));a=np.array(tile);yy,xx=np.where(a[:,:,3]>128);l,r=int(xx.min()),int(xx.max())+1
 # A single shared scale and y origin keep head height stable through the cycle.
 crop=tile.crop((l,6,r,708));crop=crop.resize((round(crop.width*scale),330),Image.Resampling.LANCZOS)
 cv=Image.new('RGBA',(W,H));cv.alpha_composite(crop,((W-crop.width)//2,40));cv.save(OUT/f'horus-front-{i}.png');new.append(cv)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22);bg='#f3f0eb';names={'set':'세트','somang':'소망','horus':'호루스'};dirs=['front','back','left','right'];labels=['앞','뒤','왼쪽','오른쪽']
frames={who:[[new[c] if who=='horus' and r==0 else Image.open(OLD/f'{who}-{d}-{c}.png').convert('RGBA') for c in range(3)] for r,d in enumerate(dirs)] for who in names}
row=Image.new('RGBA',(W*3,H))
for c,cv in enumerate(new):row.alpha_composite(cv,(c*W,0))
row.save(OUT/'horus-front-poses.png');jpg=Image.new('RGB',row.size,bg);jpg.paste(row,(0,0),row);jpg.save(OUT/'horus-front-poses.jpg',quality=96)
sheet=Image.new('RGBA',(W*3,H*4))
for r in range(4):
 for c in range(3):sheet.alpha_composite(frames['horus'][r][c],(c*W,r*H))
sheet.save(OUT/'horus-walk-sheet.png')
def savegif(images,path):
 palette=images[0].quantize(colors=255);fs=[x.quantize(palette=palette,dither=Image.Dither.NONE) for x in images];fs[0].save(path,save_all=True,append_images=fs[1:],duration=180,loop=0,disposal=2)
seq=[];single=[]
for phase in [0,1,2,1]:
 board=Image.new('RGB',(650,900),bg);draw=ImageDraw.Draw(board)
 for c,who in enumerate(names):
  draw.text((65+c*195+90,16),names[who],font=font,fill='#49443e',anchor='mt')
  for r in range(4):
   tile=frames[who][r][phase].resize((180,200),Image.Resampling.LANCZOS);board.paste(tile,(65+c*195,55+r*205),tile)
 for r,t in enumerate(labels):draw.text((8,135+r*205),t,font=font,fill='#49443e')
 seq.append(board)
 singleframe=Image.new('RGB',(W,H),bg);singleframe.paste(new[phase],(0,0),new[phase]);single.append(singleframe)
savegif(seq,OUT/'trio-walk-preview.gif');savegif(single,OUT/'horus-front-preview.gif');seq[0].save(OUT/'trio-walk-overview.jpg',quality=96)
checks={}
for who in names:
 for r,d in enumerate(dirs):
  for c in range(3):
   if who=='horus' and r==0:continue
   p=OLD/f'{who}-{d}-{c}.png';assert np.array_equal(np.array(frames[who][r][c]),np.array(Image.open(p).convert('RGBA')));checks[p.name]=hashlib.sha256(p.read_bytes()).hexdigest()
for cv in new:
 b=cv.getbbox();assert b[0]>0 and b[1]>0 and b[2]<W and b[3]<H
(OUT/'manifest.json').write_text(json.dumps({'status':'review','replaces':['horus-front-0','horus-front-1','horus-front-2'],'unchangedFrameSource':'../walk-v1','unchangedFrameCount':33,'sourceSha256':checks,'cell':[W,H],'sharedScale':scale,'headTop':40,'previewSequence':[0,1,2,1],'frameDurationMs':180,'runtimeApplied':False},ensure_ascii=False,indent=2)+'\n')
print('Replaced 3 Horus front frames. Verified 33 other frames unchanged; head top and scale aligned.')
