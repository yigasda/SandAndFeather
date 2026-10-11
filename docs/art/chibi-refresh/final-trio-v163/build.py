from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import shutil,json,hashlib,zipfile
O=Path(__file__).resolve().parent;P=O.parent
for d in ['walk','idle','gifs','sheets','checks']: (O/d).mkdir(exist_ok=True)
chars=['set','somang','horus'];dirs=['back','front','left','right'];labels=['UP / BACK','DOWN / FRONT','LEFT','RIGHT'];seq=[0,1,2,1];offsets=[(1,0),(0,-1),(-1,0),(0,-1)];bg='#f5efe3'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
manifest={'revision':163,'status':'user-approved-art-awaiting-runtime-integration','runtimeModified':False,'walkFrameCount':36,'walkCycle':{'sequence':seq,'durationMs':180,'horusFrontWholeSpriteOffsets':offsets},'directionMap':{'front':'down','back':'up','left':'left','right':'right'},'frames':[],'idle':[],'approval':'User accepted 162 front/back and explicitly kept rear view unchanged; bundle with previously accepted Set/Somang and Horus side frames.'}
for who in chars:
 for direction in dirs:
  for i in range(3):
   name=f'{who}-{direction}-{i}.png';source=P/'review-trio-walk-v5/walk'/name
   if who=='horus' and direction in ['front','back']:source=P/'review-horus-motion-v162/native'/name
   dst=O/'walk'/name;shutil.copyfile(source,dst);assert source.read_bytes()==dst.read_bytes();im=Image.open(dst);assert im.size==(360,400)
   manifest['frames'].append({'path':'walk/'+name,'source':str(source.relative_to(P)),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'size':[360,400],'copiedUnchanged':True})
for who,direction,source in [('set','front',P/'selected-front-idle-v150/set-front.png'),('somang','front',P/'selected-front-idle-v150/somang-front.png'),('horus','front',P/'review-horus-front-v161/horus-idle-front.png'),('horus','back',P/'review-horus-motion-v162/native/horus-idle-back.png')]:
 dst=O/'idle'/f'{who}-{direction}.png';shutil.copyfile(source,dst);manifest['idle'].append({'path':'idle/'+dst.name,'source':str(source.relative_to(P)),'size':list(Image.open(dst).size),'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'copiedUnchanged':True})
def sprite(who,direction,i,k):
 im=Image.open(O/'walk'/f'{who}-{direction}-{i}.png').convert('RGBA');c=Image.new('RGBA',(360,400),bg);dx,dy=offsets[k] if who=='horus' and direction=='front' else (0,0);c.alpha_composite(im,(dx,dy));return c.convert('RGB')
def savegif(name,frames):
 palette=Image.new('RGB',(frames[0].width,frames[0].height*4),bg)
 for k,im in enumerate(frames):palette.paste(im,(0,k*im.height))
 pal=palette.quantize(colors=256,method=Image.Quantize.MEDIANCUT);fs=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in frames];fs[0].save(O/'gifs'/name,save_all=True,append_images=fs[1:],duration=180,loop=0,disposal=2,optimize=False)
 g=Image.open(O/'gifs'/name);assert g.n_frames==4
 for j in range(4):g.seek(j);assert g.info['duration']==180
for who in chars:
 frames=[];sheet=Image.new('RGBA',(1080,1600),(0,0,0,0))
 for r,d in enumerate(dirs):
  for i in range(3):sheet.alpha_composite(Image.open(O/'walk'/f'{who}-{d}-{i}.png').convert('RGBA'),(i*360,r*400))
 sheet.save(O/'sheets'/f'{who}-walk.png')
 for k,i in enumerate(seq):
  cv=Image.new('RGB',(720,860),bg);dr=ImageDraw.Draw(cv)
  for r,d in enumerate(dirs):
   x=(r%2)*360;y=(r//2)*430;cv.paste(sprite(who,d,i,k),(x,y+30));dr.text((x+12,y+6),f'{who.upper()} / {labels[r]}',font=font,fill='#3d3031')
  frames.append(cv)
 savegif(f'163-{who}-four-directions.gif',frames)
for r,d in enumerate(dirs):
 frames=[]
 for k,i in enumerate(seq):
  cv=Image.new('RGB',(1080,430),bg);dr=ImageDraw.Draw(cv)
  for c,who in enumerate(chars):cv.paste(sprite(who,d,i,k),(360*c,30));dr.text((360*c+12,5),f'{who.upper()} / {labels[r]}',font=font,fill='#3d3031')
  frames.append(cv)
 savegif(f'163-trio-{d}.gif',frames)
frames=[]
for k,i in enumerate(seq):
 cv=Image.new('RGB',(1080,1720),bg);dr=ImageDraw.Draw(cv)
 for r,d in enumerate(dirs):
  for c,who in enumerate(chars):cv.paste(sprite(who,d,i,k),(c*360,r*430+30));dr.text((c*360+12,r*430+5),f'{who.upper()} / {labels[r]}',font=font,fill='#3d3031')
 frames.append(cv)
savegif('163-trio-four-directions.gif',frames);frames[1].save(O/'163-trio-four-directions.png')
# Inspect every original frame through a PNG contact sheet, not by cutting a GIF.
all36=Image.new('RGB',(2160,1600),bg)
for c,who in enumerate(chars):
 im=Image.open(O/'sheets'/f'{who}-walk.png');cv=Image.new('RGBA',im.size,bg);cv.alpha_composite(im);all36.paste(cv.resize((720,1067),Image.Resampling.NEAREST),(c*720,0))
all36.crop((0,0,2160,1067)).save(O/'checks/36-frame-review.png')
# Actual saved GIF first/second/third beat comparison.
g=Image.open(O/'gifs/163-trio-four-directions.gif');rev=Image.new('RGB',(1620,860),bg)
for i in range(3):g.seek(i);im=g.convert('RGB').resize((540,860),Image.Resampling.NEAREST);rev.paste(im,(i*540,0))
rev.save(O/'checks/gif-review.png')
old=json.loads((P/'review-trio-walk-v5/manifest.json').read_text());lookup={Path(f['path']).name:f for f in old['frames']};idl=json.loads((P/'selected-front-idle-v150/manifest.json').read_text())['frames'];idlookup={f['character']:f for f in idl}
for f in manifest['frames']:
 src=lookup[Path(f['path']).name]
 for k in ['id','character','state','sourceView','gameDirection','phase','rect','pivot','referenceVisibleHeight']:f[k]=src[k]
 f['alphaBounds']=Image.open(O/f['path']).getbbox();f['approvalStatus']='user-approved'
for f in manifest['idle']:
 who=Path(f['path']).name.split('-')[0];f['pivot']=[180,370] if who=='horus' else idlookup[who]['pivot'];f['referenceVisibleHeight']=330 if who=='horus' else idlookup[who]['referenceVisibleHeight'];f['alphaBounds']=Image.open(O/f['path']).getbbox()
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(O/'163-final-trio.zip','w',zipfile.ZIP_DEFLATED) as z:
 for d in ['walk','idle','gifs','sheets']:
  for f in (O/d).iterdir():z.write(f,f.relative_to(O))
 if (O/'README.md').exists():z.write(O/'README.md','README.md')
 if (O/'checks/front-161/report.md').exists():z.write(O/'checks/front-161/report.md','checks/front-161-report.md')
 z.write(O/'manifest.json','manifest.json');z.write(O/'163-trio-four-directions.png','163-trio-four-directions.png')
print('36 unchanged walk PNGs, 4 selected idle PNGs, 8 GIFs; source bytes and GIF frames/durations verified.')
