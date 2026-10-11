from pathlib import Path
from PIL import Image
import numpy as np,cv2,json
P=Path(__file__).resolve().parent.parent;O=Path(__file__).resolve().parent
base=np.array(Image.open(P/'review-somang-back-v151/native/horus-front.png').convert('RGBA'));a=np.array(Image.open(P/'review-horus-front-v154/native/horus-front.png').convert('RGBA'));r=np.array(Image.open(P/'review-horus-front-v153/sources/user-aligned.png').convert('RGB'));hm=np.array(Image.open(P/'review-horus-front-v153/sources/user-hair-mask.png'))>128
Y,X=np.indices(hm.shape)
# Keep the user's measured outer silhouette. Simplify only the rough inner forehead edge.
line=[]
for x in range(109,245):
 ys=np.where(hm[112:164,x])[0];line.append((x,int(ys.max()+112) if len(ys) else 112))
line=np.array(line,np.int32).reshape(-1,1,2);clean=cv2.approxPolyDP(line,2.4,False).reshape(-1,2)
inner=np.zeros(hm.shape,np.uint8);cv2.fillPoly(inner,[np.vstack(([[108,108],[245,108]],clean[::-1]))],1)
hm[(X>=109)&(X<=244)&(Y>=112)&(Y<164)]=inner[(X>=109)&(X<=244)&(Y>=112)&(Y<164)]>0
# Skin/hair pocket over the ear is closed within the silhouette, never copied from a rough JPEG.
for side in [(87,110),(242,266)]:
 x0,x1=side
 for x in range(x0,x1):
  for y in range(179,193):
   if hm[y,x] and hm[min(y+2,203),x]:hm[y:y+3,x]=True
# Copy full face, ears and untouched chosen idle body first.
d=a.copy();d[238:]=base[238:];region=(Y<164)|((Y<186)&((X<109)|(X>244)))
d[region]=0
oldhair=(a[:,:,3]>128)&(a[:,:,2]>a[:,:,0]*1.1)&(a[:,:,0]<115)
dist=cv2.distanceTransform(oldhair.astype('uint8'),cv2.DIST_L2,5)
valid=oldhair&(dist>5);_,labels=cv2.distanceTransformWithLabels((~valid).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL);ys,xs=np.where(valid);lut=np.column_stack((ys,xs));near=lut[np.clip(labels-1,0,len(lut)-1)]
for y,x in zip(*np.where(hm&(Y<186))):
 if oldhair[y,x] and dist[y,x]>3:d[y,x]=a[y,x]
 else:
  yy,xx=near[y,x];d[y,x]=a[yy,xx]
 d[y,x,3]=255
# Preserve complete silhouette outer edge in the existing deep navy palette.
edge=(cv2.distanceTransform(hm.astype('uint8'),cv2.DIST_L2,5)<1.5)&hm&(Y<186)
# Only exposed outer boundary gets dark ink, not the skin-side forehead.
for y,x in zip(*np.where(edge)):
 if x<109 or x>244 or y<110:d[y,x]=[10,11,30,255]
for x in range(109,245):
 ys=np.where(hm[110:164,x])[0];top=int(ys.max()+111) if len(ys) else 164
 for y in range(top,164):
  d[y,x]=a[max(145,y),max(126,min(228,x))]
  if y-top<2:d[y,x,:3]=[249,216,199] if y==top else [253,221,204]
# Keep original ear bridge from154 where it is part of the face, except superseded exposed outer contour.
for y in range(186,204):
 for x in range(84,112):
  if a[y,x,3]>128:d[y,x]=a[y,x]
# Fill enclosed hair holes and the specific ear-top slit before rendering.
n,lab,st,_=cv2.connectedComponentsWithStats((d[:,:,3]<128).astype('uint8'),8)
for k,z in enumerate(st[1:],1):
 if 76<=z[0]<112 and 110<=z[1]<193 and z[4]<40:
  for yy,xx in zip(*np.where(lab==k)):d[yy,xx]=a[max(110,yy-9),xx+10];d[yy,xx,3]=255
for yy in range(182,192):
 for xx in range(88,103):
  if d[yy,xx,3]<128 and a[yy,xx,3]>128:d[yy,xx]=a[yy,xx]
# No old dark hairline specks inside the new broad locks.
for yy in range(115,153):
 for xx in range(117,239):
  if hm[yy,xx] and d[yy,xx,0]<30 and a[yy-12,xx,2]>a[yy-12,xx,0]:d[yy,xx]=a[yy-12,xx]
d[158:163,90:98]=a[158:163,90:98]
# Shorten only the stationary front legs. Boots retain shape and move up three pixels.
d[320:333]=np.array(Image.fromarray(base[320:336]).resize((360,13),Image.Resampling.NEAREST));d[333:397]=base[336:400];d[397:]=0
d[164:238,112:242]=a[164:238,112:242]
assert np.array_equal(d[164:238,112:242],a[164:238,112:242])
Image.fromarray(d).save(O/'horus-front.png')
for bg,name in [('#f5efe3','front'),('#253041','dark')]:
 im=Image.new('RGBA',(360,400),bg);im.alpha_composite(Image.fromarray(d));im.resize((720,800),Image.Resampling.NEAREST).save(O/f'156-horus-{name}.png')
(O/'validation.json').write_text(json.dumps({'scope':'one stationary front only','bodySource':'review-somang-back-v151/native/horus-front.png','legsShortenedNativePx':3,'walkFilesModified':0,'protectedFaceDifference':0},indent=2))
