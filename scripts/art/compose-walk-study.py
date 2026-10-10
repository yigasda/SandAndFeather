"""Export the first walking pose study. Outputs are review assets, not runtime sprites."""
from pathlib import Path
import shutil, json
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path('docs/art/chibi-refresh/animations/walk-v1');ROOT.mkdir(parents=True,exist_ok=True)
sources={'set':'exec-acb3bd01-b6b2-400d-acc9-07e096bfc064.png','somang':'exec-3ecf4ad2-11fc-42bf-9461-524b9c19d735.png','horus':'exec-66399a6b-271e-4197-b162-b886d690994e.png','horus-front-contact':'exec-4c06607e-8fbf-4994-b52e-17b6cfa9c2aa.png'}
for who,src in sources.items():
 dst=ROOT/f'{who}-source.png'
 if not dst.exists():shutil.copyfile(Path('/workspace/generated_images')/src,dst)
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc';font=ImageFont.truetype(FONT,22);small=ImageFont.truetype(FONT,18)
W,H=360,400;bg='#f3f0eb';names={'set':'세트','somang':'소망','horus':'호루스'};directions=['front','back','left','right'];labels=['앞','뒤','왼쪽','오른쪽'];frames={};manifest={'status':'pose-study-review','base':'81 common-body-v2-dress-and-profile approved','cell':[W,H],'directions':directions,'phases':['contact-a','passing','contact-b'],'previewSequence':[0,1,2,1],'frameDurationMs':180,'runtimeApplied':False,'frames':{}}
for who in names:
 im=Image.open(ROOT/f'{who}-source.png').convert('RGBA');frames[who]=[];entries=[]
 sheet=Image.new('RGBA',(W*3,H*4))
 alpha=np.array(im)[:,:,3]>128
 def valley(counts,expected,radius):
  lo=max(0,expected-radius);hi=min(len(counts),expected+radius);return lo+int(np.argmin(counts[lo:hi]))
 ybounds=[0]+[valley(alpha.sum(axis=1),round(r*im.height/4),80) for r in range(1,4)]+[im.height]
 xbounds=[0]+[valley(alpha.sum(axis=0),round(c*im.width/3),35) for c in range(1,3)]+[im.width]
 for row in range(4):
  rows=[]
  for col in range(3):
   tile=im.crop((xbounds[col],ybounds[row],xbounds[col+1],ybounds[row+1]))
   if who=='horus' and row==0 and col==2:tile=Image.open(ROOT/'horus-front-contact-source.png').convert('RGBA')
   alpha=np.array(tile)[:,:,3];ys,xs=np.where(alpha>128);box=(int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1)
   crop=tile.crop(box);scale=min(330/crop.height,340/crop.width);crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
   cv=Image.new('RGBA',(W,H));cv.alpha_composite(crop,((W-crop.width)//2,370-crop.height));rows.append(cv)
   filename=f'{who}-{directions[row]}-{col}.png';cv.save(ROOT/filename);sheet.alpha_composite(cv,(col*W,row*H));entries.append({'file':filename,'direction':directions[row],'phase':col,'pivot':[W//2,370]})
  frames[who].append(rows)
 sheet.save(ROOT/f'{who}-walk-sheet.png');manifest['frames'][who]=entries
 jpg=Image.new('RGB',(W*3+70,H*4+100),bg);draw=ImageDraw.Draw(jpg);draw.text((30,18),names[who]+' · 걷기 1차 동작 시안',font=font,fill='#49443e')
 for c,t in enumerate(['발 내딛기 A','가운데','발 내딛기 B']):draw.text((70+c*W+W//2,57),t,font=small,fill='#49443e',anchor='mt')
 for r in range(4):draw.text((12,100+r*H+160),labels[r],font=small,fill='#49443e')
 jpg.paste(sheet,(70,100),sheet);jpg.save(ROOT/f'{who}-walk-preview.jpg',quality=96)
# Shared palette prevents palette flicker between GIF frames.
sequence=[]
for phase in [0,1,2,1]:
 board=Image.new('RGB',(650,900),bg);draw=ImageDraw.Draw(board)
 for c,who in enumerate(names):
  draw.text((65+c*195+90,16),names[who],font=font,fill='#49443e',anchor='mt')
  for r in range(4):
   tile=frames[who][r][phase].resize((180,200),Image.Resampling.LANCZOS);board.paste(tile,(65+c*195,55+r*205),tile)
 for r,t in enumerate(labels):draw.text((8,135+r*205),t,font=small,fill='#49443e')
 sequence.append(board)
palette=sequence[0].quantize(colors=255);gif=[x.quantize(palette=palette,dither=Image.Dither.NONE) for x in sequence];gif[0].save(ROOT/'trio-walk-preview.gif',save_all=True,append_images=gif[1:],duration=180,loop=0,disposal=2)
sequence[0].save(ROOT/'trio-walk-overview.jpg',quality=96)
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Exported 36 frames, 3 sheets, 4-step GIF preview; runtime untouched.')
