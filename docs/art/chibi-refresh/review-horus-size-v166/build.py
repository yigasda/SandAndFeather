from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import json, hashlib, shutil, zipfile

O=Path(__file__).resolve().parent; P=O.parent
I=P/'final-trio-idle-v164'; W=P/'final-trio-v163/walk'
for d in ['idle','native','walk','gifs','checks']: (O/d).mkdir(exist_ok=True)
dirs=['back','front','left','right']; seq=[0,1,2,1]; offsets=[(1,0),(0,-1),(-1,0),(0,-1)]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def resample(im,size,scale,src_anchor,dst_anchor):
 a=np.array(im.convert('RGBA'));yy,xx=np.indices((size[1],size[0]))
 sx=np.floor((xx+.5-dst_anchor[0])/scale+src_anchor[0]).astype(int)
 sy=np.floor((yy+.5-dst_anchor[1])/scale+src_anchor[1]).astype(int)
 ok=(sx>=0)&(sx<im.width)&(sy>=0)&(sy<im.height)
 dst=np.zeros((size[1],size[0],4),np.uint8);dst[ok]=a[sy[ok],sx[ok]]
 return Image.fromarray(dst)
before=Image.open(I/'native/horus-front.png').convert('RGBA')
sole=before.getbbox()[3]
after=resample(before,(360,400),1.05,(180,sole),(180,sole))
assert after.getbbox()[3]==sole
assert after.getbbox()[1]>0
records=[]
for d in dirs:
 name=f'horus-{d}.png';native=O/'native'/name;export=O/'idle'/name
 if d=='front':
  after.save(native)
  resample(after,(620,720),576/330,(180,370),(310,662)).save(export)
  assert Image.open(export).getbbox()[3]==Image.open(I/'idle'/name).getbbox()[3]
 else:
  shutil.copyfile(I/'native'/name,native);shutil.copyfile(I/'idle'/name,export)
  assert sha(export)==sha(I/'idle'/name)
 records.append(dict(path='idle/'+name,source=f'final-trio-idle-v164/native/{name}',sha256=sha(export),nativePath='native/'+name,size=[620,720],pivot=[310,662],referenceVisibleHeight=576,nativeSize=[360,400],nativePivot=[180,370],nativeReferenceVisibleHeight=330,scale=1.05 if d=='front' else 1,alphaBounds=Image.open(export).getbbox()))
walk=[]
for d in dirs:
 for phase in range(3):
  name=f'horus-{d}-{phase}.png';src=Image.open(W/name).convert('RGBA')
  if d=='front':
   foot=src.getbbox()[3]
   dst=resample(src,(360,400),1.05,(180,foot),(180,foot))
   assert dst.getbbox()[3]==foot and dst.getbbox()[1]>0
   dst.save(O/'walk'/name)
  else:
   shutil.copyfile(W/name,O/'walk'/name)
   assert sha(W/name)==sha(O/'walk'/name)
  walk.append(dict(path='walk/'+name,source='final-trio-v163/walk/'+name,sha256=sha(O/'walk'/name),copiedUnchanged=d!='front',scale=1.05 if d=='front' else 1,previousBounds=src.getbbox(),alphaBounds=Image.open(O/'walk'/name).getbbox(),size=[360,400],pivot=[180,370],referenceVisibleHeight=330))
for folder in ['idle','native']:
 for f in (O/folder).glob('*.png'):
  assert sha(f)==sha(P/'review-horus-size-v165'/folder/f.name)

def panel(phase=None,k=0):
 cv=Image.new('RGBA',(720,860),'#f5efe3');dr=ImageDraw.Draw(cv)
 for r,d in enumerate(dirs):
  x=(r%2)*360;y=(r//2)*430
  im=Image.open(O/('native' if phase is None else 'walk')/(f'horus-{d}.png' if phase is None else f'horus-{d}-{phase}.png')).convert('RGBA')
  dx,dy=offsets[k] if phase is not None and d=='front' else (0,0)
  cv.alpha_composite(im,(x+dx,y+30+dy));dr.text((x+10,y+6),f'{d.upper()} / '+('IDLE' if phase is None else 'WALK'),font=font,fill='#45392f')
 return cv.convert('RGB')
def savegif(name,frames,durations):
 atlas=Image.new('RGB',(720,860*len(frames)))
 for k,im in enumerate(frames):atlas.paste(im,(0,k*860))
 palette=atlas.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
 fs=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
 fs[0].save(O/'gifs'/name,save_all=True,append_images=fs[1:],duration=durations,loop=0,disposal=2,optimize=False)
 g=Image.open(O/'gifs'/name);assert g.n_frames==len(fs)
 for k,dur in enumerate(durations):g.seek(k);assert g.info['duration']==dur
frames=[panel(i,k) for k,i in enumerate(seq)]
savegif('166-horus-four-directions-walk.gif',frames,[180]*4)
savegif('166-horus-idle-walk.gif',[panel()]+frames,[1200]+[180]*4)
panel().save(O/'166-horus-four-directions-idle.png')
for bg,name in [('#f5efe3','light'),('#253041','dark')]:
 cv=Image.new('RGBA',(1080,430),bg);dr=ImageDraw.Draw(cv)
 for i,(im,label) in enumerate([(before,'BEFORE'),(after,'FRONT +5%'),(Image.open(I/'native/horus-back.png').convert('RGBA'),'BACK unchanged')]):
  cv.alpha_composite(im,(i*360,30));dr.text((i*360+12,7),label,font=font,fill='#45392f' if name=='light' else 'white')
 cv.convert('RGB').save(O/f'166-size-comparison-{name}.png')
g=Image.open(O/'gifs/166-horus-idle-walk.gif');sheet=Image.new('RGB',(1800,430))
for k in range(5):g.seek(k);sheet.paste(g.convert('RGB').resize((360,430),Image.Resampling.NEAREST),(k*360,0))
sheet.save(O/'checks/gif-frames.png')
for bg,label in [('#f5efe3','light'),('#253041','dark')]:
 cv=Image.new('RGBA',(1440,430),bg);dr=ImageDraw.Draw(cv)
 for j in range(4):
  f=O/'native/horus-front.png' if j==0 else O/'walk'/f'horus-front-{j-1}.png'
  cv.alpha_composite(Image.open(f).convert('RGBA'),(j*360,30))
  dr.text((j*360+12,7),'IDLE +5%' if j==0 else f'WALK {j-1} +5%',font=font,fill='#45392f' if label=='light' else 'white')
 cv.convert('RGB').save(O/f'166-front-idle-walk-{label}.png')
manifest=dict(revision=166,status='requested-size-adjustment-awaiting-visual-review',runtimeModified=False,
 change='Horus front walk0/1/2 uniformly enlarged105% to match165 front idle. Per-frame sole fixed. All four idles unchanged from165; other nine walk PNGs unchanged from163. No repaint.',
 previousBounds=before.getbbox(),newBounds=after.getbbox(),idle=records,walk=walk,
 walkCycle=dict(sequence=seq,durationMs=180,frontOffsets=offsets),idlePreviewHoldMs=1200)
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(O/'166-horus-png-gif.zip','w',zipfile.ZIP_DEFLATED) as z:
 for folder in ['idle','native','walk','gifs']:
  for f in sorted((O/folder).glob('*')):z.write(f,f.relative_to(O))
 for name in ['manifest.json','README.md','166-horus-four-directions-idle.png','166-size-comparison-light.png','166-front-idle-walk-light.png']:
  if (O/name).exists():z.write(O/name,name)
print(json.dumps(dict(before=before.getbbox(),after=after.getbbox(),soleUnchanged=True,walkPngUnchanged=9,idleUnchanged=4,frontWalkScaled=3)))
