from pathlib import Path
import numpy as np, cv2, json, importlib.util
from PIL import Image, ImageDraw
O=Path(__file__).resolve().parent;P=O.parent;R=P.parents[2]
a=np.array(Image.open(P/'review-horus-idle-v157/horus-idle-front.png').convert('RGBA'));d=a.copy();H,W=a.shape[:2];S=8
hair=np.array(Image.open(P/'horus-hair-guide/targets/idle-front-hair-mask.png'))>128
# Smooth outer contours at the same ear placement. Control points only regularize
# the old one-pixel stair steps and pointed cap; no scaling or translation.
def bez(p):
 t=np.linspace(0,1,80)[:,None];p=np.array(p)
 return (1-t)**3*p[0]+3*(1-t)**2*t*p[1]+3*(1-t)*t*t*p[2]+t**3*p[3]
paths=[[
 [(112,225.5),(102,226),(94,222),(89,216)],
 [(89,216),(83,210),(83,204),(86,197)],
 [(86,197),(88,191),(93,184),(97.5,184.5)],
 [(97.5,184.5),(103,184.5),(109,192),(112,199)]
 ],[
 [(242,225.5),(252,225),(261,218),(266,211)],
 [(266,211),(271,204),(270,196),(266,191)],
 [(266,191),(263,186),(259,183.5),(255,184.5)],
 [(255,184.5),(250,185.5),(245,192),(242,199)]
 ]]
Y,X=np.indices((H,W));changed_area=np.zeros((H,W),bool)
for side,segments in enumerate(paths):
 points=np.concatenate([bez(p) for p in segments]);pts=[tuple(q*S) for q in points]
 high=Image.new('L',(W*S,H*S));ImageDraw.Draw(high).polygon(pts,fill=255)
 mh=np.array(high)>0
 contour=Image.new('L',(W*S,H*S));ImageDraw.Draw(contour).line(pts,fill=255,width=1)
 dist=cv2.distanceTransform((np.array(contour)==0).astype('uint8'),cv2.DIST_L2,5)/S
 # Pressure: 1.4 at the crown, thick through outer/lower arc, tapered at face junction.
 yy,xx=np.indices(mh.shape);fy=yy/S;fx=xx/S
 width=np.interp(fy,[184,190,199,209,217,224],[1.4,1.8,2.8,3.8,4.1,3.5])
 junction=np.clip((112-fx)/6 if side==0 else (fx-242)/6,0,1)
 taper=np.where(fy>215,3.8,1.3)
 width=taper+(width-taper)*junction
 # Do not outline the artificial closure on the face side.
 edgemask=mh&(dist<=width)
 ink=np.array(Image.fromarray((edgemask*255).astype('uint8')).resize((W,H),Image.Resampling.BOX))/255.
 alpha=np.array(high.resize((W,H),Image.Resampling.BOX))
 ink=np.minimum(1.,ink/np.maximum(alpha/255.,1/255.))
 region=(Y>=183)&(Y<226)&((X>=82)&(X<112) if side==0 else (X>=242)&(X<272))&~hair
 # Keep original warm skin and concha; repair old outline or isolated pale fringe
 # only within the narrow outline band, with neighboring original skin colors.
 valid=(a[:,:,0]>225)&(a[:,:,0].astype(int)-a[:,:,1]>20)&(a[:,:,0].astype(int)-a[:,:,2]>30)&region&(a[:,:,3]>128)
 _,lab=cv2.distanceTransformWithLabels((~valid).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
 sy,sx=np.where(valid);lut=np.column_stack([sy,sx]);near=lut[np.clip(lab-1,0,len(lut)-1)]
 col=a[:,:,:3].copy();bad=region&~valid
 ny,nx=near[bad].T;col[bad]=a[ny,nx,:3]
 val=np.rint(col*(1-ink[:,:,None])+np.array([16,12,14])*ink[:,:,None]).astype('uint8')
 d[region,:3]=val[region];d[region,3]=alpha[region]
 interior=region&(ink==0)&valid
 d[interior]=a[interior]
 # Preserve the existing one-pixel paper slit above both ear caps.
 d[region&(a[:,:,3]==0)&(Y<193),3]=0
 changed_area|=region
assert not np.any(d[~changed_area]!=a[~changed_area])
Image.fromarray(d).save(O/'horus-idle-front.png')
Image.fromarray((np.any(d!=a,axis=2)*255).astype('uint8')).save(O/'edit-mask.png')
for bg,n in [('#f5efe3','front'),('#253041','dark')]:
 im=Image.new('RGBA',(W,H),bg);im.alpha_composite(Image.fromarray(d));im.resize((720,800),Image.Resampling.NEAREST).save(O/f'158-horus-{n}.png')
(O/'validation.json').write_text(json.dumps({'base':'review-horus-idle-v157/horus-idle-front.png','outsideEarEditDifference':int(np.count_nonzero(d[~changed_area]!=a[~changed_area])),'hairDifference':int(np.count_nonzero(d[hair]!=a[hair])),'bodyDifference':int(np.count_nonzero(d[226:]!=a[226:])),'walkFilesModified':False},indent=2))
