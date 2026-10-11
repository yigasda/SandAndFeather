from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,cv2,json
P=Path('/workspace/SandAndFeather-git/docs/art/chibi-refresh');O=P/'review-horus-front-v155';B=P/'review-horus-front-v154'
a=np.array(Image.open(B/'native/horus-front.png').convert('RGBA'));d=a.copy();r=np.array(Image.open(O/'sources/user-aligned.png').convert('RGB'));Y,X=np.indices(a.shape[:2]);mask=np.zeros(a.shape[:2],bool)
# Left contour: keep the phone guide's full dark brush boundary, then fill with sprite palette.
# The supplied close-up closes the small hook/gap directly above the ear.
outer=[(94,116),(80,123),(85,129),(90,134),(84,140),(80,145),(78,151),(78,156),(87,155),(83,159),(83,163),(91,166),(88,174),(87,184),(94,185),(98,189),(104,191),(111,193),(109,162),(110,144),(111,115)]
m=Image.new('L',(360,400));ImageDraw.Draw(m).polygon(outer,fill=255);new=np.array(m)>0
region=(X>=76)&(X<=109)&(Y>=122)&(Y<=191)
oldhair=(a[:,:,2]>a[:,:,0]*1.1)&(a[:,:,0]<110)&(a[:,:,3]>128)
# Remove obsolete outer pixels only within the local contour area.
d[region&~new&(Y<185)]=0
valid=oldhair&(X>99)&(Y<186)
_,labels=cv2.distanceTransformWithLabels((~valid).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
ys,xs=np.where(valid);lut=np.column_stack([ys,xs]);near=lut[np.clip(labels-1,0,len(lut)-1)]
for y,x in zip(*np.where(region&new)):
 if a[y,x,3]>128 and not oldhair[y,x] and y>=185:continue
 if oldhair[y,x] and x>=95:d[y,x]=a[y,x]
 else:
  yy,xx=y-4,x+14
  if not oldhair[yy,xx]:yy,xx=near[y,x]
  d[y,x]=a[yy,xx];d[y,x,3]=255
# Outline follows contour, not the thick gray phone paint.
hairmask=(d[:,:,3]>128)&(d[:,:,2]>d[:,:,0]*1.08)&(d[:,:,0]<112)
dist=cv2.distanceTransform(hairmask.astype('uint8'),cv2.DIST_L2,5)
edge=region&new&(dist<=1.45);d[edge]=[10,11,30,255]
mask|=region
# A smaller number of broad locks at the specified forehead height.
line=[(109,164),(111,153),(116,145),(123,141),(119,137),(146,138),(136,132),(162,135),(155,129),(182,134),(176,128),(199,132),(211,126),(219,135),(232,136),(229,142),(238,146),(242,154),(245,164)]
# Polygon is deliberately non-monotonic in x for pointed overlapping locks.
m=Image.new('L',(360,400));ImageDraw.Draw(m).polygon([(108,110),(246,110)]+list(reversed(line)),fill=255);nh=np.array(m)>0
reg=(X>=109)&(X<=245)&(Y>=117)&(Y<164)
valid=oldhair&(Y<141)&(a[:,:,3]>128)
_,labels=cv2.distanceTransformWithLabels((~valid).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
ys,xs=np.where(valid);lut=np.column_stack([ys,xs]);near=lut[np.clip(labels-1,0,len(lut)-1)]
for y,x in zip(*np.where(reg)):
 if nh[y,x]:
  distance=float(cv2.distanceTransform(oldhair.astype('uint8'),cv2.DIST_L2,5)[y,x])
  if distance<9:
   yy=max(100,y-14);xx=x
   if not oldhair[yy,xx]:yy,xx=near[yy,xx]
   col=a[yy,xx].astype(float)
   weight=max(0,min(1,(distance-3)/6)) if oldhair[y,x] else 0
   d[y,x]=np.round(col*(1-weight)+a[y,x]*weight).astype('uint8')

 else:
  if oldhair[y,x] or a[y,x,3]<128 or a[y,x,0]<240:
   # Same forehead column sampled from clear skin below this boundary.
   d[y,x]=a[max(y,145),min(228,max(125,x))]
  # Restrained stepped skin shading using the existing skin palette.
  depth=0
  for yy in range(y-1,116,-1):
   if nh[yy,x]:break
   depth+=1
  if depth<2:
   d[y,x,:3]=[249,216,199] if depth==0 else [253,221,204]
  d[y,x,3]=255
mask|=reg
# Restore all face and ear pixels at and below the eyebrow line unless part of left contour.
assert not np.any(d[~mask]!=a[~mask])
Image.fromarray(d).save(O/'native/horus-front.png');Image.fromarray(mask.astype('uint8')*255).save(O/'sources/edit-mask.png')
for bg,name in [('#f5efe3','light'),('#253041','dark')]:
 can=Image.new('RGBA',(1440,800),bg)
 for i,z in enumerate([a,d]):can.alpha_composite(Image.fromarray(z).resize((720,800),Image.Resampling.NEAREST),(720*i,0))
 can.save(O/f'previews/155-compare-{name}.png')
 can=Image.new('RGBA',(1308,684),bg)
 for i,z in enumerate([a,d]):can.alpha_composite(Image.fromarray(z).crop((76,110,294,224)).resize((1308,684),Image.Resampling.NEAREST),(0,0)) if i==1 else None
 can.save(O/f'previews/155-head-{name}.png')
print('changed',np.count_nonzero(np.any(d!=a,axis=2)))
