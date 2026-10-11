"""Validate selected48 source PNGs and rebuild downloadable bundles/previews."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, json, zipfile

ROOT=Path(__file__).resolve().parents[2]
O=ROOT/'docs/art/chibi-refresh/final'
M=json.loads((O/'manifest.json').read_text())
for d in ['previews','downloads']: (O/d).mkdir(exist_ok=True)
dirs=['back','front','left','right'];seq=M['walkCycle']['sequence']
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
frames=M['frames'];assert len(frames)==48
for f in frames:
 p=O/f['relativePath'];im=Image.open(p)
 assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'],p
 assert im.mode=='RGBA' and list(im.size)==f['size'],p
 assert list(im.getbbox())==f['alphaBounds'],p
for who in M['characters']:
 assert sum(f['character']==who and f['state']=='idle' for f in frames)==4
 assert sum(f['character']==who and f['state']=='walk' for f in frames)==12

def sprite(who,d,phase=None,k=0):
 if phase is None:
  im=Image.open(O/who/'idle'/f'{who}-{d}.png').convert('RGBA')
  # Same reference-height/pivot mapping as runtime, no per-frame fit-to-bounds.
  s=576/330
  im=im.transform((360,400),Image.Transform.AFFINE,(s,0,310-180*s,0,s,662-370*s),Image.Resampling.NEAREST)
 else:
  im=Image.open(O/who/'walk'/f'{who}-{d}-{phase}.png').convert('RGBA')
  if who=='horus' and d=='front':
   dx,dy=M['walkCycle']['horusDownOffsets'][k]
   cv=Image.new('RGBA',(360,400));cv.alpha_composite(im,(dx,dy));im=cv
 return im

for bg,suffix in [('#f5efe3','light'),('#253041','dark')]:
 cv=Image.new('RGBA',(1440,1290),bg);dr=ImageDraw.Draw(cv)
 for r,who in enumerate(M['characters']):
  for c,d in enumerate(dirs):
   cv.alpha_composite(sprite(who,d),(c*360,r*430+30))
   dr.text((c*360+12,r*430+7),f'{who.upper()} / {d.upper()}',font=font,fill='#45392f' if suffix=='light' else 'white')
 cv.convert('RGB').save(O/'previews'/f'trio-idle-{suffix}.png')

for who in M['characters']:
 pages=[]
 for phase,k in [(None,0)]+[(p,k) for k,p in enumerate(seq)]:
  cv=Image.new('RGBA',(720,860),'#f5efe3');dr=ImageDraw.Draw(cv)
  for r,d in enumerate(dirs):
   x=(r%2)*360;y=(r//2)*430
   cv.alpha_composite(sprite(who,d,phase,k),(x,y+30))
   dr.text((x+12,y+7),f'{who.upper()} / {d.upper()} / '+('IDLE' if phase is None else 'WALK'),font=font,fill='#45392f')
  pages.append(cv.convert('RGB'))
 atlas=Image.new('RGB',(720,860*len(pages)))
 for i,im in enumerate(pages):atlas.paste(im,(0,i*860))
 pal=atlas.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
 pg=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in pages]
 dst=O/'previews'/f'{who}-idle-walk.gif'
 durations=[1200]+[180]*4
 pg[0].save(dst,save_all=True,append_images=pg[1:],duration=durations,loop=0,disposal=2,optimize=False)
 g=Image.open(dst);assert g.n_frames==5
 for i,dur in enumerate(durations):g.seek(i);assert g.info['duration']==dur
 # Direct source contact sheet: all16 poses, with dark background to expose seams.
 cv=Image.new('RGBA',(1440,1720),'#253041');dr=ImageDraw.Draw(cv)
 for r,d in enumerate(dirs):
  for c,phase in enumerate([None,0,1,2]):
   cv.alpha_composite(sprite(who,d,phase,0 if phase is None else phase),(c*360,r*430+30))
   dr.text((c*360+12,r*430+7),d.upper()+' / '+('IDLE' if phase is None else str(phase)),font=font,fill='white')
 cv.convert('RGB').save(O/'previews'/f'{who}-16-poses.png')
 selected=[f for f in frames if f['character']==who]
 cm={**M,'characters':[who],'frameCount':16,'idleFrameCount':4,'walkFrameCount':12,'frames':selected}
 with zipfile.ZipFile(O/'downloads'/f'{who}-16-transparent-png.zip','w',zipfile.ZIP_DEFLATED) as z:
  for f in selected:z.write(O/f['relativePath'],f['relativePath'])
  z.writestr('manifest.json',json.dumps(cm,ensure_ascii=False,indent=2)+'\n')
  z.write(O/'README.md','README.md')
 with zipfile.ZipFile(O/'downloads'/f'{who}-16-transparent-png.zip') as z:
  assert len([n for n in z.namelist() if n.endswith('.png')])==16

# All three characters stay visible: direction rows, character columns.
pages=[]
for phase,k in [(None,0)]+[(p,k%4) for k,p in enumerate(seq*2)]:
 cv=Image.new('RGBA',(1080,1720),'#f5efe3');dr=ImageDraw.Draw(cv)
 for r,d in enumerate(dirs):
  for c,who in enumerate(M['characters']):
   x,y=c*360,r*430
   cv.alpha_composite(sprite(who,d,phase,k),(x,y+30))
   direction={'back':'UP / BACK','front':'DOWN / FRONT','left':'LEFT','right':'RIGHT'}[d]
   dr.text((x+12,y+7),f'{who.upper()} / {direction} / '+('IDLE' if phase is None else 'WALK'),font=font,fill='#45392f')
 pages.append(cv.convert('RGB'))
atlas=Image.new('RGB',(1080,1720*len(pages)))
for i,im in enumerate(pages):atlas.paste(im,(0,i*1720))
pal=atlas.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
pg=[im.quantize(palette=pal,dither=Image.Dither.NONE) for im in pages]
dst=O/'previews/trio-four-directions-idle-walk.gif'
durations=[1200]+[180]*8
pg[0].save(dst,save_all=True,append_images=pg[1:],duration=durations,loop=0,disposal=2,optimize=False)
g=Image.open(dst);assert g.n_frames==9
for i,dur in enumerate(durations):g.seek(i);assert g.info['duration']==dur

with zipfile.ZipFile(O/'downloads/trio-48-transparent-png.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in frames:z.write(O/f['relativePath'],f['relativePath'])
 for name in ['manifest.json','README.md']:z.write(O/name,name)
with zipfile.ZipFile(O/'downloads/trio-48-transparent-png.zip') as z:
 assert len([n for n in z.namelist() if n.endswith('.png')])==48
print('48 current manifest RGBA PNGs verified; character ZIPs16 each, combined ZIP48; three four-direction idle/walk GIFs.')
