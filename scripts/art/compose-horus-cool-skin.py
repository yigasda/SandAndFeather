"""Export generated skin-tone edit studies. Only crops/scales/composes; does not recolor artwork."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,shutil,json,hashlib
D=Path('docs/art/chibi-refresh');O=D/'skin-tone/horus-v1';O.mkdir(parents=True,exist_ok=True)
for name,p in [('idle-source.png','exec-6d3e0a96-5183-496a-af91-8098f444cd6a.png'),('walk-source.png','exec-37f84664-7812-4df2-89e5-de43231f70d9.png')]:
 if not (O/name).exists():shutil.copyfile(Path('/workspace/generated_images')/p,O/name)
dirs=['front','back','left','right'];mapping={'front':'down','back':'up','left':'left','right':'right'};frames={'idle':[],'walk':[]};entries=[]
for state,cols,rows,W,H,y0,y1,target,dy in [('idle',4,1,620,720,72,632,628,34),('walk',3,4,360,400,37,359,330,40)]:
 im=Image.open(O/f'{state}-source.png').convert('RGBA');scale=target/(y1-y0);sheet=Image.new('RGBA',(cols*W,rows*H))
 for r in range(rows):
  row=[]
  for c in range(cols):
   tile=im.crop((round(c*im.width/cols),round(r*im.height/rows),round((c+1)*im.width/cols),round((r+1)*im.height/rows)));a=np.array(tile);yy,xx=np.where(a[:,:,3]>128);left,right=int(xx.min()),int(xx.max())+1
   # Identical y window and scale per state preserve small gait height differences.
   crop=tile.crop((left,y0,right,y1)).resize((round((right-left)*scale),target),Image.Resampling.LANCZOS)
   cv=Image.new('RGBA',(W,H));cv.alpha_composite(crop,((W-crop.width)//2,dy));view=dirs[c if state=='idle' else r];phase=None if state=='idle' else c
   name=f'horus-{state}-{view}'+('' if phase is None else f'-{phase}')+'.png';cv.save(O/name);row.append(cv);sheet.alpha_composite(cv,(c*W,r*H))
   entries.append({'state':state,'view':view,'gameDirection':mapping[view],'phase':phase,'path':str(O/name),'size':[W,H],'pivot':[310,662] if state=='idle' else [180,370],'referenceVisibleHeight':target,'sha256':hashlib.sha256((O/name).read_bytes()).hexdigest()})
  frames[state].append(row)
 sheet.save(O/f'horus-{state}-sheet.png');jpg=Image.new('RGB',sheet.size,'#f3f0eb');jpg.paste(sheet,(0,0),sheet);jpg.save(O/f'horus-{state}-preview.jpg',quality=96)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',30);bg='#f3f0eb'
before=Image.open(D/'directions/common-body-v2-dress-and-profile/horus-front.png').convert('RGBA');after=frames['idle'][0][0]
comparison=Image.new('RGB',(1240,790),bg);draw=ImageDraw.Draw(comparison)
for x,t,im in [(0,'기존 피부톤',before),(620,'반 톤 밝게 · 노란기 완화',after)]:
 draw.text((x+310,16),t,font=font,fill='#49443e',anchor='mt');comparison.paste(im,(x,60),im)
comparison.save(O/'skin-comparison.jpg',quality=96)
# Retain the approved 1 source-pixel placement timing.
images=[];trio=[];small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',22)
for phase,dx,dy in [(0,1,0),(1,0,-1),(2,-1,0),(1,0,-1)]:
 cv=Image.new('RGB',(360,400),bg);src=frames['walk'][0][phase];cv.paste(src,(dx,dy),src);images.append(cv)
 board=Image.new('RGB',(650,900),bg);draw=ImageDraw.Draw(board)
 for c,who in enumerate(['set','somang','horus']):
  draw.text((65+c*195+90,16),{'set':'세트','somang':'소망','horus':'호루스'}[who],font=small,fill='#49443e',anchor='mt')
  for r,d in enumerate(dirs):
   source=frames['walk'][r][phase] if who=='horus' else Image.open(D/f'animations/walk-v1/{who}-{d}-{phase}.png').convert('RGBA')
   if who=='horus' and r==0:
    placed=Image.new('RGBA',source.size);placed.alpha_composite(source,(dx,dy));source=placed
   tile=source.resize((180,200),Image.Resampling.LANCZOS);board.paste(tile,(65+c*195,55+r*205),tile)
 for r,t in enumerate(['앞','뒤','왼쪽','오른쪽']):draw.text((8,135+r*205),t,font=small,fill='#49443e')
 trio.append(board)
def gif(images,path):
 atlas=Image.new('RGB',(images[0].width*len(images),images[0].height))
 for i,im in enumerate(images):atlas.paste(im,(i*im.width,0))
 pal=atlas.quantize(colors=255);qs=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in images];qs[0].save(path,save_all=True,append_images=qs[1:],duration=180,loop=0,disposal=2)
gif(images,O/'horus-front-preview.gif');gif(trio,O/'trio-walk-preview.gif')
(O/'manifest.json').write_text(json.dumps({'status':'skin-tone-revision-review','supersedesAppearanceRequest':'Horus skin half-tone lighter with neutral-cool undertone','method':'image-generation edit, then crop and uniform resize; not pixel-identical outside skin','runtimeApplied':False,'approvedMotionSettingsPreserved':{'sequence':[0,1,2,1],'durationMs':180,'horusDownOffsetsSourcePx':[[1,0],[0,-1],[-1,0],[0,-1]],'addedRotation':0},'frames':entries},ensure_ascii=False,indent=2)+'\n')
assert len(entries)==16
for e in entries:
 im=Image.open(e['path']);b=im.getbbox();assert im.mode=='RGBA' and b[0]>0 and b[1]>0 and b[2]<im.width and b[3]<im.height
print('16 skin-tone revision frames exported. Previous approved sources untouched. Motion settings preserved.')
