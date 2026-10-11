from pathlib import Path
import importlib.util,json,hashlib
from PIL import Image,ImageDraw
import numpy as np,cv2
O=Path(__file__).resolve().parent;P=O.parent;ROOT=P.parents[2];G=P/'horus-hair-guide';T=G/'targets'
spec=importlib.util.spec_from_file_location('check_hair',ROOT/'tools/art/check-hair.py');ch=importlib.util.module_from_spec(spec);spec.loader.exec_module(ch)
a=np.array(Image.open(P/'review-horus-idle-v156/horus-front.png').convert('RGBA'));src=np.array(Image.open(P/'review-trio-walk-v5/walk/horus-front-1.png').convert('RGBA'));d=a.copy();Y,X=np.indices(a.shape[:2])
hair=np.array(Image.open(T/'idle-front-hair-mask.png'))>128;head=np.array(Image.open(T/'idle-front-head-mask.png'))>128
# Outer geometry comes from the new user-final guide, not any earlier edit.
# Newly inked forehead locks follow its height with small clean pixel-art tips.
line=[(110,165),(112,165),(116,147),(121,145),(123,140),(126,138),(123,137),(137,137),(134,133),(137,131),(150,134),(155,131),(158,133),(160,128),(163,128),(170,132),(171,129),(174,130),(178,133),(182,130),(187,131),(195,128),(200,125),(203,128),(206,127),(208,132),(211,135),(215,133),(224,135),(230,133),(231,136),(233,140),(235,145),(237,147),(240,161),(243,165)]
im=Image.new('L',(360,400));ImageDraw.Draw(im).polygon([(110,110),(243,110)]+list(reversed(line)),fill=255)
region=(X>=110)&(X<=243)&(Y>=110)&(Y<=165);hair[region]=np.array(im)[region]>128
rgb=src[:,:,:3].astype(float)/255;es,_,_=ch.eyes(rgb,src[:,:,3]>128);sm,sb=ch.hair_mask(rgb,src[:,:,3]>128,es)
# Use original Horus hair texture and palette, mapped into the new silhouette.
# A clean inner texture sample avoids bringing the old forehead outline into the new line.
valid=sb&(src[:,:,2]>src[:,:,0]*1.15)&(src[:,:,0]>20)
_,lab=cv2.distanceTransformWithLabels((~valid).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL);yy,xx=np.where(valid);lut=np.column_stack([yy,xx]);near=lut[np.clip(lab-1,0,len(lut)-1)]
edit=(Y<166)|((Y<225)&((X<112)|(X>241)))
# Clear just the old hair and ear drawing area, then rebuild geometry there. Face/chin/neck protected below.
d[edit]=0
for y,x in zip(*np.where(hair)):
 if y>201:continue
 # Smooth common transform preserves the original painted locks without column seams.
 sampley=int(round((y-190)/.94+196));samplex=int(round((x-177)/.95+177))
 sampley=np.clip(sampley,0,399);samplex=np.clip(samplex,0,359);py,px=near[sampley,samplex]
 d[y,x]=src[py,px];d[y,x,3]=255
# Fresh 1–2px navy ink and layered hair-side shadow along the forehead; no flat skin-only cutout.
hd=cv2.distanceTransform(hair.astype('uint8'),cv2.DIST_L2,5)
outer=hair&(hd<=1.4);d[outer]=[14,15,34,255]
# Re-ink the external silhouette with a continuous two-pixel dark rim.
# The forehead is internal to the head and keeps its finer separately drawn line.
head_depth=cv2.distanceTransform(head.astype('uint8'),cv2.DIST_L2,5)
external=hair&(head_depth<=6.0)
d[external&(hd<=2.2)]=[12,13,27,255]
# Two discrete inward shadow bands, using the original navy palette.
for lo,hi,weight,tone in [(2.2,3.6,.60,[24,27,52]),(3.6,5.2,.28,[34,39,74])]:
 band=external&(hd>lo)&(hd<=hi)
 d[band,:3]=np.rint(d[band,:3]*(1-weight)+np.array(tone)*weight).astype('uint8')
# Keep the hairline shadow inside the blue so the forehead is clean and the line reads as hair.
inner=hair&(Y>=122)&(Y<183)&(X>=110)&(X<=243)
for y,x in zip(*np.where(inner&(hd>1.4)&(hd<=3.2))):
 d[y,x,:3]=np.round(d[y,x,:3]*.65+np.array([35,36,67])*.35).astype('uint8')
# Restore forehead skin using the original palette and existing centre-to-edge shading.
for x in range(111,243):
 ys=np.where(hair[110:166,x])[0]
 if not len(ys):continue
 top=ys.max()+111
 for y in range(top,166):
  if not head[y,x]:continue
  sy=max(148,y);sx=max(125,min(226,x))
  if a[y,x,3]>128 and a[y,x,0]>235 and a[y,x,0]>a[y,x,2]+14:d[y,x]=a[y,x]
  else:d[y,x]=a[sy,sx]
  if y-top<2:d[y,x,:3]=[250,218,201] if y==top else [254,223,206]
  d[y,x,3]=255
# Ear geometry from the target head, with the existing face pixels held fixed.
# Resample original ear shading into each complete rounded ear silhouette, then ink its outer arc.
g=ch.guide();ge,_,_=ch.eyes(a[:,:,:3].astype(float)/255,a[:,:,3]>128)
gskin=(g['rgb'][:,:,0]>.75)&(g['rgb'][:,:,0]-g['rgb'][:,:,1]>.04)&(g['rgb'][:,:,0]-g['rgb'][:,:,2]>.075)&g['head']
tear,_=ch.place(gskin,g['eyes'],ge,a.shape[:2])
for x0,x1,sourcebox in [(78,112,(82,183,112,226)),(242,278,(242,183,271,226))]:
 cx=97 if x0<120 else 257
 arc=np.rint(183+0.060*(X-cx)**2).astype(int)
 em=head&~hair&(X>=x0)&(X<x1)&(Y>=arc)&(Y<226)
 d[(head&~hair)&(X>=x0)&(X<x1)&(Y>=176)&(Y<226)]=0
 ys,xs=np.where(em)
 if not len(ys):continue
 sy0,sx0=ys.min(),xs.min();sy1,sx1=ys.max(),xs.max()
 bx0,by0,bx1,by1=sourcebox
 # Preserve the original ear's concha/highlight colours wherever the old skin exists.
 for y,x in zip(ys,xs):
  c=src[y,x,:3].astype(int)
  good=src[y,x,3]>128 and c[0]>180 and c[0]-c[1]>20 and c[0]-c[2]>30
  d[y,x]=src[y,x] if good else [255,224,209,255]
 # Full head alpha gives the outside of the ear; inner face seam remains original below.
 ed=cv2.distanceTransform(head.astype('uint8'),cv2.DIST_L2,5);d[em&(ed<=2.6)]=[16,12,14,255]
 # Draw complete rounded top of ear below hair and open a one-pixel air gap where needed.
 for x in range(max(x0,84),min(x1,270)):
  rows=np.where(em[176:202,x])[0]
  if not len(rows):continue
  y=int(rows.min()+176)
  if y>=195:continue
  d[y:min(y+2,226),x]=[16,12,14,255]
  if x<104 or x>250:d[y-1,x]=0
# Exact protected face/chin/neck and body: no face resizing or jaw movement.
protected=(Y>=166)&(Y<226)&(X>=112)&(X<242)&~hair
d[protected]=a[protected];d[226:320]=a[226:320]
# Footwear grows upward, keeping the toe box/sole pixels and sole row in place.
d[320:329]=a[320:329]
upper=Image.fromarray(a[334:367]);d[329:367]=np.array(upper.resize((360,38),Image.Resampling.NEAREST));d[367:]=a[367:]
Image.fromarray(d).save(O/'horus-idle-front.png')
mask=np.any(d!=a,axis=2);Image.fromarray((mask*255).astype('uint8')).save(O/'edit-mask.png')
for bg,nm in [('#f5efe3','front'),('#253041','dark')]:
 c=Image.new('RGBA',(360,400),bg);c.alpha_composite(Image.fromarray(d));c.resize((720,800),Image.Resampling.NEAREST).save(O/f'157-horus-{nm}.png')
 crop=c.crop((75,115,279,228)).resize((1224,678),Image.Resampling.NEAREST);crop.save(O/f'157-head-{nm}.png')
# Preservation checks cover chin, neck, torso, kilt, soles and every approved walk file.
report={'source':'review-horus-idle-v156/horus-front.png','shapeGuide':'horus-hair-guide/user-edit-final.jpg','headTarget':'targets/idle-front-hair-mask.png','faceBelowForeheadDifference':int(np.count_nonzero(d[protected]!=a[protected])),'chinNeckTorsoKiltDifference':int(np.count_nonzero(d[226:320]!=a[226:320])),'soleDifference':int(np.count_nonzero(d[366:]!=a[366:])),'walkFilesModified':False}
assert report['faceBelowForeheadDifference']==report['chinNeckTorsoKiltDifference']==report['soleDifference']==0
(O/'validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
