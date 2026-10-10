"""Animate existing v2 artwork with tiny placement offsets; do not redraw frames."""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
D=Path('docs/art/chibi-refresh/animations');BASE=D/'walk-v1';FRONT=D/'walk-v2-horus-front';OUT=D/'walk-v4-horus-micro-motion';OUT.mkdir(exist_ok=True)
names={'set':'세트','somang':'소망','horus':'호루스'};directions=['front','back','left','right'];labels=['앞','뒤','왼쪽','오른쪽'];font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22);bg='#f3f0eb'
frames={};hashes={}
for who in names:
 frames[who]=[]
 for d in directions:
  row=[]
  for phase in range(3):
   path=(FRONT if who=='horus' and d=='front' else BASE)/f'{who}-{d}-{phase}.png';row.append(Image.open(path).convert('RGBA'));hashes[str(path.relative_to(D))]=hashlib.sha256(path.read_bytes()).hexdigest()
  frames[who].append(row)
# Whole-frame placement, in the original 360 x 400 review cell. No head rotation.
steps=[(0,1,0),(1,0,-1),(2,-1,0),(1,0,-1)]
trio=[];single=[]
for phase,dx,dy in steps:
 board=Image.new('RGB',(650,900),bg);draw=ImageDraw.Draw(board)
 for c,who in enumerate(names):
  draw.text((65+c*195+90,16),names[who],font=font,fill='#49443e',anchor='mt')
  for r in range(4):
   src=frames[who][r][phase]
   if who=='horus' and r==0:
    placed=Image.new('RGBA',src.size);placed.alpha_composite(src,(dx,dy));src=placed
   tile=src.resize((180,200),Image.Resampling.LANCZOS);board.paste(tile,(65+c*195,55+r*205),tile)
 for r,label in enumerate(labels):draw.text((8,135+r*205),label,font=font,fill='#49443e')
 trio.append(board)
 frame=Image.new('RGB',(360,400),bg);src=frames['horus'][0][phase];frame.paste(src,(dx,dy),src);single.append(frame)
def gif(images,path):
 atlas=Image.new('RGB',(images[0].width*len(images),images[0].height))
 for i,im in enumerate(images):atlas.paste(im,(i*im.width,0))
 pal=atlas.quantize(colors=255);qs=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in images]
 qs[0].save(path,save_all=True,append_images=qs[1:],duration=180,loop=0,disposal=2)
gif(single,OUT/'horus-front-preview.gif');gif(trio,OUT/'trio-walk-preview.gif');trio[0].save(OUT/'trio-walk-overview.jpg',quality=96)
for p in [OUT/'horus-front-preview.gif',OUT/'trio-walk-preview.gif']:
 im=Image.open(p);assert im.n_frames==4;assert im.info['duration']==180
for phase,dx,dy in steps:
 b=frames['horus'][0][phase].getbbox();assert b[0]+dx>0 and b[1]+dy>0 and b[2]+dx<360 and b[3]+dy<400
for path,digest in hashes.items():assert hashlib.sha256((D/path).read_bytes()).hexdigest()==digest
(OUT/'manifest.json').write_text(json.dumps({'status':'review','method':'reuse v2 front PNG artwork; GIF placement only','sourceFramesModified':0,'sourceSha256':hashes,'headRotationDegreesAdded':0,'sourceCell':[360,400],'steps':[{'phase':p,'offset':[x,y],'durationMs':180} for p,x,y in steps],'maxOffsetPerAxisPx':1,'trioDisplayScale':0.5,'runtimeApplied':False},ensure_ascii=False,indent=2)+'\n')
print('Verified 36 source files unchanged; 4 GIF frames; offsets <=1px, no clipping, no added rotation.')
