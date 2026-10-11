from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,cv2,json,hashlib,shutil
P=Path('/workspace/SandAndFeather-git/docs/art/chibi-refresh');O=P/'review-horus-front-v155';B=P/'review-horus-front-v154';W=P/'review-trio-walk-v5/walk'
head=np.array(Image.open(O/'native/horus-front.png').convert('RGBA'));edit=np.array(Image.open(O/'sources/edit-mask.png'))>0
# Remove one detached pin-tip inside the forehead; keep the broad connected hair mass.
blue=(head[:,:,2]>head[:,:,0]*1.08)&(head[:,:,0]<112)&(head[:,:,3]>128)
n,lab,st,_=cv2.connectedComponentsWithStats(blue.astype('uint8'),8)
for i,z in enumerate(st[1:],1):
 if z[4]<=2 and 112<z[0]<240 and 125<z[1]<155:
  for y,x in zip(*np.where(lab==i)):head[y,x]=head[y+3,x];edit[y,x]=True
reports=[]
for direction in ['front','back','left','right']:
 for i in range(3):
  name=f'horus-{direction}-{i}.png';a=np.array(Image.open(W/name).convert('RGBA'));d=a.copy()
  if direction=='front':
   b=np.array(Image.open(B/'walk'/name).convert('RGBA'));d[:238]=b[:238];d[edit]=head[edit]
   # Reduce visible leg height by 2 native pixels; shoes translated intact.
   # Distribute the removal in the skin strip, with each half's own hem/shoe landmarks.
   bands={0:[(321,325),(314,328)],1:[(318,327),(318,327)],2:[(314,328),(321,325)]}[i]
   for (x0,x1),(y0,y1) in zip([(0,180),(180,360)],bands):
    h=y1-y0;d[y0:y1-2,x0:x1]=np.array(Image.fromarray(a[y0:y1,x0:x1]).resize((x1-x0,h-2),Image.Resampling.NEAREST))
    d[y1-2:398,x0:x1]=a[y1:,x0:x1];d[398:,x0:x1]=0
   protected=np.zeros(a.shape[:2],bool);protected[164:238,112:242]=True
   assert not np.any(d[protected]!=b[protected])
   reports.append({'file':name,'bodySource':'review-trio-walk-v5/walk/'+name,'shorteningPx':2,'protectedFaceDifference':int(np.count_nonzero(d[protected]!=b[protected]))})
  else:reports.append({'file':name,'unchangedFromApproved':True})
  Image.fromarray(d).save(O/'walk'/name)
  if direction!='front':shutil.copyfile(W/name,O/'walk'/name)
# User now requests the earlier walking front body, replacing the 131 idle body.
native=np.array(Image.open(O/'walk/horus-front-1.png'));Image.fromarray(native).save(O/'native/horus-front.png')
scale=576/330;yy,xx=np.indices((720,620));sx=np.floor((xx+.5-310)/scale+180).astype(int);sy=np.floor((yy+.5-662)/scale+370).astype(int);valid=(sx>=0)&(sx<360)&(sy>=0)&(sy<400);idle=np.zeros((720,620,4),np.uint8);idle[valid]=native[sy[valid],sx[valid]];Image.fromarray(idle).save(O/'idle/horus-front.png')
# All frames on both backgrounds, with native-scale motion input separate from GIF quantization.
for bg,tag in [('#f5efe3','light'),('#253041','dark')]:
 sheet=Image.new('RGBA',(1080,1600),bg)
 for row,direction in enumerate(['front','back','left','right']):
  for i in range(3):sheet.alpha_composite(Image.open(O/f'walk/horus-{direction}-{i}.png'),(i*360,row*400))
 sheet.save(O/f'previews/155-all-12-{tag}.png')
 comp=Image.new('RGBA',(1440,800),bg)
 for i,f in enumerate([B/'native/horus-front.png',O/'native/horus-front.png']):comp.alpha_composite(Image.open(f).resize((720,800),Image.Resampling.NEAREST),(i*720,0))
 comp.save(O/f'previews/155-compare-{tag}.png')
 cr=Image.new('RGBA',(1068,672),bg);cr.alpha_composite(Image.fromarray(native).crop((76,112,254,224)).resize((1068,672),Image.Resampling.NEAREST));cr.save(O/f'previews/155-head-{tag}.png')
# Alpha holes within the exact disputed left hair/ear area, in each front.
for i in range(3):
 a=np.array(Image.open(O/f'walk/horus-front-{i}.png'));n,l,st,_=cv2.connectedComponentsWithStats((a[:,:,3]<128).astype('uint8'),8)
 holes=[list(map(int,z)) for z in st[1:] if 75<=z[0]<113 and 110<=z[1]<204 and z[4]<300]
 assert not holes,holes
 reports.append({'file':f'horus-front-{i}.png','leftHairEarAlphaHoles':holes})
(O/'validation.json').write_text(json.dumps(reports,indent=2));m=json.loads((B/'manifest.json').read_text());m['revision']=155;m['scope']='12 walking PNGs: front 3 edited; back/left/right 9 unchanged approved. One front body preview. Back/side haircut redesign remains pending.';m['files']=[]
for folder in ['idle','walk']:
 for f in sorted((O/folder).glob('*.png')):m['files'].append({'path':str(f.relative_to(O)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
(O/'manifest.json').write_text(json.dumps(m,indent=2))
print('Created 12 walking PNGs, native/front body preview, and inspection sheets.')
