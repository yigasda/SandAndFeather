"""Package generated costume edits; cropping, uniform scaling and previews only."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'docs/art/chibi-refresh';O=D/'review-chest-cloth';O.mkdir(exist_ok=True)
inputs={'idle-source.png':'/workspace/generated_images/exec-b59fcc59-0fe8-4c9a-a08e-f72bb72c1677.png','walk-front-source.png':'/workspace/cloth-inputs/walk-front.png','walk-back-source.png':'/workspace/generated_images/exec-c5a4ed99-fba7-4b23-9cfb-e2a7e581459c.png','walk-left-source.png':'/workspace/cloth-inputs/walk-left.png','walk-right-source.png':'/workspace/generated_images/exec-516fb42f-2049-418d-9bdf-30e9b5f9b838.png'}
for n,p in inputs.items():
 if not (O/n).exists():shutil.copyfile(p,O/n)
dirs=['front','back','left','right'];frames={};entries=[]
def pack(source,cols,W,H,height,yoff):
 im=Image.open(source).convert('RGBA');tiles=[];boxes=[]
 for c in range(cols):
  tile=im.crop((round(c*im.width/cols),0,round((c+1)*im.width/cols),im.height));tiles.append(tile);a=np.array(tile);yy,xx=np.where(a[:,:,3]>8);boxes.append([int(xx.min())-2,int(yy.min())-2,int(xx.max())+3,int(yy.max())+3])
 top=min(b[1] for b in boxes);bottom=max(b[3] for b in boxes);scale=height/(bottom-top);result=[]
 for tile,b in zip(tiles,boxes):
  crop=tile.crop((b[0],top,b[2],bottom));crop=crop.resize((round(crop.width*scale),height),Image.Resampling.LANCZOS)
  cv=Image.new('RGBA',(W,H));cv.alpha_composite(crop,((W-crop.width)//2,yoff));result.append(cv)
 return result
idle=pack(O/'idle-source.png',4,620,720,628,34)
for d,im in zip(dirs,idle):frames[('idle',d,None)]=im
for d in dirs:
 for p,im in enumerate(pack(O/f'walk-{d}-source.png',3,360,400,330,40)):frames[('walk',d,p)]=im
for (state,d,p),im in frames.items():
 n=f'horus-{state}-{d}'+('' if p is None else f'-{p}')+'.png';im.save(O/n);entries.append({'state':state,'view':d,'gameDirection':dict(zip(dirs,['down','up','left','right']))[d],'phase':p,'path':str((O/n).relative_to(ROOT)),'size':list(im.size),'pivot':[310,662] if state=='idle' else [180,370],'referenceVisibleHeight':628 if state=='idle' else 330,'sha256':hashlib.sha256((O/n).read_bytes()).hexdigest()})
bg='#f3f0eb';font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',28)
for state in ['idle','walk']:
 sheet=Image.new('RGBA',(2480,720) if state=='idle' else (1080,1600))
 for r,d in enumerate(dirs):
  if state=='idle':sheet.alpha_composite(frames[(state,d,None)],(620*r,0))
  else:
   for p in range(3):sheet.alpha_composite(frames[(state,d,p)],(360*p,400*r))
 sheet.save(O/f'horus-{state}-sheet.png');preview=Image.new('RGB',sheet.size,bg);preview.paste(sheet,(0,0),sheet);preview.save(O/f'horus-{state}-preview.jpg',quality=96)
front=Image.new('RGB',(1240,790),bg);draw=ImageDraw.Draw(front)
for c,(label,im) in enumerate([('기존 기본 시안',Image.open(D/'approved/idle/horus-front.png').convert('RGBA')),('2차 · 흰 가슴천 추가',frames[('idle','front',None)])]):
 draw.text((310+c*620,12),label,font=font,fill='#49443e',anchor='mt');front.paste(im,(620*c,55),im)
front.save(O/'front-comparison.jpg',quality=96)
previewframes=[]
for p,dx,dy in [(0,1,0),(1,0,-1),(2,-1,0),(1,0,-1)]:
 board=Image.new('RGB',(1440,450),bg);draw=ImageDraw.Draw(board)
 for c,d in enumerate(dirs):
  im=frames[('walk',d,p)];draw.text((180+c*360,8),['앞','뒤','왼쪽','오른쪽'][c],font=font,fill='#49443e',anchor='mt');board.paste(im,(c*360+(dx if c==0 else 0),45+(dy if c==0 else 0)),im)
 previewframes.append(board)
atlas=Image.new('RGB',(5760,450))
for i,im in enumerate(previewframes):atlas.paste(im,(i*1440,0))
palette=atlas.quantize(colors=255);qs=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in previewframes];qs[0].save(O/'horus-walk.gif',save_all=True,append_images=qs[1:],duration=180,loop=0,disposal=2)
(O/'manifest.json').write_text(json.dumps({'status':'second-base-chest-cloth-review','runtimeApplied':False,'approvedBase':'docs/art/chibi-refresh/approved/manifest.json','change':'White linen chest drape from anatomical right shoulder to waistband; generated costume edit, not pixel-identical outside edited region.','cycle':[0,1,2,1],'durationMs':180,'frontOffsetsSourcePx':[[1,0],[0,-1],[-1,0],[0,-1]],'rotationAdded':0,'frames':entries},ensure_ascii=False,indent=2)+'\n')
assert len(entries)==16
for e in entries:
 im=Image.open(ROOT/e['path']);b=im.getbbox();assert im.mode=='RGBA' and b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height
print('16 RGBA frames validated; previews and 4-step GIF exported.')
