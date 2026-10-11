import cv2,numpy as np,json
from pathlib import Path
from PIL import Image
P=Path('/workspace/SandAndFeather-git/docs/art/chibi-refresh');O=Path(__file__).resolve().parent
a=np.array(Image.open(P/'review-trio-walk-v5/walk/horus-front-1.png').convert('RGBA'));r=np.array(Image.open(O/'sources/user-aligned.png').convert('RGB'))
# User-drawn silhouette and actual color pixels, registered using unchanged facial features.
y,x=np.indices((400,360));dark=(r.max(2)<112);blue=(r[:,:,2]>r[:,:,0]*1.14)&(r[:,:,2]>r[:,:,1]*.98)&(r[:,:,0]<100)
sel=((dark|blue)&(y<205)).astype('uint8');n,lab,stats,_=cv2.connectedComponentsWithStats(sel,8);idx=lab[70,176];hair=lab==idx
# Forehead follows user's hair/skin boundary, but cleans brush artifacts into existing skin shades.
skin=(r[:,:,0]>175)&(r[:,:,0]-r[:,:,2]>18)&(r[:,:,1]>115)&(y<164)&(y>103)&(x>101)&(x<250)
# The untouched face begins below forehead. Fill the entire new upper-head foreground only.
patch=(hair|skin)&(y<204);lowerhair=hair&(y>=164)
base=a.copy();base[(y<164)]=0
# Phone drawing defines geometry only. Re-render inside that fixed mask using the original hair texture/palette.
origHair=(a[:,:,2]>a[:,:,0]*1.12)&(a[:,:,0]<115)&(a[:,:,3]>128)&(y<203)
_,ol=cv2.connectedComponents(origHair.astype('uint8'),8);origHair=ol==ol[80,175]
base[origHair]=0
_,nearest=cv2.distanceTransformWithLabels((~origHair).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
ys,xs=np.where(origHair);lut=np.column_stack([ys,xs]);take=lut[np.clip(nearest-1,0,len(lut)-1)]
texture=a[take[:,:,0],take[:,:,1],:3].copy()
# Keep original interior pixels where present; use nearest original hair only where silhouette expanded.
texture[origHair]=a[origHair,:3]
border=cv2.distanceTransform(hair.astype('uint8'),cv2.DIST_L2,5)
texture[border<1.5]=[9,10,31]
base[hair,:3]=texture[hair];base[hair,3]=255
colors=a[140:161,135:218,:3].reshape(-1,3);u,c=np.unique(colors,axis=0,return_counts=True);mode=u[c.argmax()];print('skin mode',mode)
# Clean forehead: reuse the finished original hairline/skin shading at the user's raised height.
# Hand-brushed scallops are not the finish. Eyes/brows at y>=164 stay in place.
for yy in range(113,164):
 for xx in range(108,247):
  lateral=max(0,min(1,(xx-108)/22,(247-xx)/22))
  vertical=1 if yy<141 else (164-yy)/23
  off=int(round(6*lateral*vertical));syy=yy+off
  base[yy,xx]=a[syy,xx]
# Close the missing left-temple bridge using the original hair behind the ear.
bridge=np.zeros((400,360),dtype=np.uint8)
cv2.fillPoly(bridge,[np.array([[90,176],[108,176],[108,189],[98,184],[88,187]])],1)
for yy,xx in zip(*np.where(bridge)):
 if base[yy,xx,3]>128:continue
 if a[yy,xx,3]>128:base[yy,xx]=a[yy,xx]
 else:
  syy,sxx=take[yy,xx];base[yy,xx]=a[syy,sxx]
 base[yy,xx,3]=255
# Preserve original below the brow line, except user hair side locks.
# Clear obsolete hair outside user silhouette above brow; keep all lower face pixels unchanged.
Image.fromarray(base).save(O/'sources/front-head-master.png');Image.fromarray((hair*255).astype('uint8')).save(O/'sources/user-hair-mask.png')
# Whole exact final body, already normalized in original reference file.
ref=Image.open(P/'review-trio-walk-v4/idle-reference/horus-front.png').convert('RGBA');rr=np.array(ref);body=np.zeros_like(a);scale=330/628
for yy in range(400):
 for xx in range(360):
  sx=int(np.floor((xx+.5-180)/scale+310));sy=int(np.floor((yy+.5-370)/scale+662))
  if 0<=sx<620 and 0<=sy<720:body[yy,xx]=rr[sy,sx]
# Body is coherent neck-to-soles final original; anchor collar under existing chin.
# Its original neck begins at y239, same baseline as existing sprite.
idle=base.copy();idle[238:]=body[238:]
Image.fromarray(idle).save(O/'native/horus-front.png')
# Each approved walking body stays in its own existing pose. Preserve head phase offsets.
reports=[]
for i in range(3):
 b=np.array(Image.open(P/f'review-trio-walk-v5/walk/horus-front-{i}.png').convert('RGBA'));d=b.copy()
 # Hair in all three fronts uses same cell landmarks; preserve original lower face in each.
 d[y<164]=base[y<164];d[(y<204)&((x<108)|(x>242))]=base[(y<204)&((x<108)|(x>242))];d[origHair]=base[origHair];d[hair]=base[hair];d[bridge>0]=base[bridge>0]
 Image.fromarray(d).save(O/f'walk/horus-front-{i}.png');reports.append({'frame':i,'unchangedBelowY':204,'differenceBelow204':int(np.count_nonzero(d[204:]!=b[204:]))})
Image.fromarray(np.concatenate([np.array(Image.open(O/'native/horus-front.png')),np.array(Image.open(O/'walk/horus-front-1.png'))],axis=1)).save(O/'previews/front-pair.png')
(O/'sources/front-validation.json').write_text(json.dumps({'hairSource':'user-edit.jpg','registration':'alignment.json','walkingBodyUnchanged':reports,'idleBodySource':'review-trio-walk-v4/idle-reference/horus-front.png','note':'Body of walk preserved at this stage. Forehead colors cleaned; User mask/positions retained; phone paint excluded. Original hair texture/palette used inside fixed outline.'},indent=2))
