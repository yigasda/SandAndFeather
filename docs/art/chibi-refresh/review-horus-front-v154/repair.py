from pathlib import Path
from PIL import Image
import numpy as np,cv2,json
O=Path(__file__).resolve().parent;P=O.parent/'review-horus-front-v153';reports=[]
for folder,name in [('native','horus-front.png')]+[('walk',f'horus-front-{i}.png') for i in range(3)]:
 a=np.array(Image.open(P/folder/name).convert('RGBA'));d=a.copy();mask=np.zeros(a.shape[:2],bool)
 # Hole inside left hair and its accidental black rectangular rim.
 for y in range(158,163):
  for x in range(90,98):d[y,x]=a[y,x+9];d[y,x,3]=255;mask[y,x]=True
 # Exact enclosed alpha component over the left ear. Keep the intact ear/face outline.
 n,lab,st,_=cv2.connectedComponentsWithStats((a[:,:,3]<128).astype('uint8'),8)
 ids=[i for i,z in enumerate(st) if 87<=z[0]<=96 and 183<=z[1]<=193 and z[4]<35]
 for i in ids:
  for y,x in zip(*np.where(lab==i)):d[y,x]=a[y-7,x+5];d[y,x,3]=255;mask[y,x]=True
 Image.fromarray(d).save(O/folder/name)
 n,lab,st,_=cv2.connectedComponentsWithStats((d[:,:,3]<128).astype('uint8'),8)
 holes=[list(map(int,z)) for z in st[1:] if z[0]<120 and z[1]<205 and z[4]<300]
 assert not holes,holes
 assert not np.any(d[~mask]!=a[~mask])
 reports.append({'file':folder+'/'+name,'changedPixels':int(np.count_nonzero(np.any(d!=a,axis=2))),'outsideMaskDifference':0,'leftHeadEnclosedAlphaHoles':holes})
 if folder=='native':
  before=Image.new('RGBA',(408,680),'#f5efe3');before.alpha_composite(Image.fromarray(a).crop((68,125,119,210)).resize((408,680),Image.Resampling.NEAREST));after=Image.new('RGBA',(408,680),'#f5efe3');after.alpha_composite(Image.fromarray(d).crop((68,125,119,210)).resize((408,680),Image.Resampling.NEAREST));c=Image.new('RGBA',(816,680));c.paste(before,(0,0));c.paste(after,(408,0));c.save(O/'previews/154-left-before-after.png')
  for bg,nm in [('#f5efe3','light'),('#253041','dark')]:
   c=Image.new('RGBA',(720,800),bg);c.alpha_composite(Image.fromarray(d).resize((720,800),Image.Resampling.NEAREST));c.save(O/f'previews/154-front-{nm}.png')
  out=np.zeros((720,620,4),np.uint8);scale=576/330
  for yy in range(720):
   for xx in range(620):
    sx=int(np.floor((xx+.5-310)/scale+180));sy=int(np.floor((yy+.5-662)/scale+370))
    if 0<=sx<360 and 0<=sy<400:out[yy,xx]=d[sy,sx]
  Image.fromarray(out).save(O/'idle/horus-front.png')
(O/'validation.json').write_text(json.dumps(reports,indent=2))
print(json.dumps(reports))
