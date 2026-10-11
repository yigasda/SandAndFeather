from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,cv2,importlib.util,json
O=Path(__file__).resolve().parent;P=O.parent;R=P.parents[2]
s=importlib.util.spec_from_file_location('ch',R/'tools/art/check-hair.py');ch=importlib.util.module_from_spec(s);s.loader.exec_module(ch)
a=np.array(Image.open(P/'review-horus-idle-v157/horus-idle-front.png').convert('RGBA'));d=a.copy();H,W=a.shape[:2];Y,X=np.indices((H,W));g=ch.guide();e,_,_=ch.eyes(a[:,:,:3]/255.,a[:,:,3]>128)
_,tr=ch.place(g['head'],g['eyes'],e,(H,W));k=tr['scale'];ang=np.deg2rad(tr['rotationDeg']);M=np.array([[np.cos(ang)*k,-np.sin(ang)*k,tr['shift'][0]],[np.sin(ang)*k,np.cos(ang)*k,tr['shift'][1]]])
# Redraw both ear curves with separate top, outer and lower pressure.
# The donor supplies original native skin shading, never the phone image's pixels.
src=np.array(Image.open(P/'review-trio-walk-v5/walk/horus-front-1.png').convert('RGBA'))
hair=np.array(Image.open(P/'horus-hair-guide/targets/idle-front-hair-mask.png'))>128
region=np.zeros((H,W),bool)
S=8

def bez(p):
 t=np.linspace(0,1,100)[:,None];p=np.array(p)
 return (1-t)**3*p[0]+3*(1-t)**2*t*p[1]+3*(1-t)*t*t*p[2]+t**3*p[3]
paths=[[
 [(112,224.7),(100,226),(90,219),(86,211)],
 [(86,211),(81.5,202),(86,193),(92,188)],
 [(92,188),(94,183.5),(98,183.5),(101,186)],
 [(101,186),(105,188),(110,193),(112,198)]
 ],[
 [(242,224.7),(254,224),(264,216),(268,207)],
 [(268,207),(271,199),(267,190),(261,187)],
 [(261,187),(259,183.5),(254,183.5),(251,187)],
 [(251,187),(248,190),(244,195),(242,200)]
 ]]
for side,segs in enumerate(paths):
 pts=[tuple(q*S) for q in np.concatenate([bez(p) for p in segs])]
 hm=Image.new('L',(W*S,H*S));ImageDraw.Draw(hm).polygon(pts,fill=255)
 cm=Image.new('L',(W*S,H*S));ImageDraw.Draw(cm).line(pts,fill=255,width=1)
 dist=cv2.distanceTransform((np.array(cm)==0).astype('uint8'),cv2.DIST_L2,5)/S
 yy,xx=np.indices((H*S,W*S));fy=yy/S;fx=xx/S
 width=np.interp(fy,[185,190,199,209,217,225],[1.2,1.6,2.9,3.6,3.4,3.1])
 edge=(np.array(hm)>0)&(dist<=width)
 alpha=np.array(hm.resize((W,H),Image.Resampling.BOX))/255.
 ink=np.array(Image.fromarray((edge*255).astype('uint8')).resize((W,H),Image.Resampling.BOX))/255.
 ink=np.minimum(1,ink/np.maximum(alpha,1e-5))
 reg=(Y>=183)&(Y<226)&(((X>=82)&(X<112)) if side==0 else ((X>=242)&(X<273)))&~hair
 valid=(src[:,:,0]>230)&(src[:,:,0].astype(int)-src[:,:,1]>23)&(src[:,:,0].astype(int)-src[:,:,2]>35)&(src[:,:,3]>128)&reg
 _,lab=cv2.distanceTransformWithLabels((~valid).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
 sy,sx=np.where(valid);near=np.column_stack([sy,sx])[np.clip(lab-1,0,len(sy)-1)]
 col=src[:,:,:3].copy();ny,nx=near[reg&~valid].T;col[reg&~valid]=src[ny,nx,:3]
 d[reg,:3]=np.rint(col*(1-ink[:,:,None])+np.array([20,16,17])*ink[:,:,None])[reg].astype('uint8');d[reg,3]=np.rint(alpha[reg]*255).astype('uint8')
 region|=reg
# New asymmetric short locks, following the reference forehead height.
line=[(110,165),(114,157),(118,147),(125,142),(121,140),(133,138),(130,133),(144,138),(139,132),(149,134),(159,139),(155,131),(161,128),(171,137),(172,130),(178,132),(185,135),(183,130),(193,129),(203,126),(210,135),(216,132),(220,136),(229,134),(233,142),(237,147),(240,157),(243,165)]
im=Image.new('L',(W,H));ImageDraw.Draw(im).polygon([(110,112),(243,112)]+list(reversed(line)),fill=255);new=np.array(im)>0
zone=(X>=110)&(X<=243)&(Y>=112)&(Y<=165)
oldhair=hair.copy();hair[zone]=new[zone]
# Original hair palette/texture supplies interior paint; newly draw the ends and their shadow.
src=np.array(Image.open(P/'review-trio-walk-v5/walk/horus-front-1.png').convert('RGBA'))
blue=(a[:,:,2]>a[:,:,0]*1.15)&(a[:,:,2]>a[:,:,1]*1.1)&(a[:,:,2]>45)&(a[:,:,3]>128)&(Y<160)
_,lab=cv2.distanceTransformWithLabels((~blue).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL);sy,sx=np.where(blue);near=np.column_stack([sy,sx])[np.clip(lab-1,0,len(sy)-1)]
ny,nx=near[zone&hair].T;d[zone&hair]=a[ny,nx]
# Fill only newly exposed forehead using neighboring original skin, not phone paint.
skin=(a[:,:,0]>235)&(a[:,:,0].astype(int)-a[:,:,2]>20)&(a[:,:,3]>128)&(X>115)&(X<240)&(Y>130)&(Y<167)
_,lab=cv2.distanceTransformWithLabels((~skin).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL);sy,sx=np.where(skin);near=np.column_stack([sy,sx])[np.clip(lab-1,0,len(sy)-1)]
ny,nx=near[zone&~hair].T;d[zone&~hair]=a[ny,nx]
hd=cv2.distanceTransform(hair.astype('uint8'),cv2.DIST_L2,5)
# A deep navy hair edge and two discrete navy shadow bands keep tips readable.
# Avoid a continuous near-black cutout line against skin.
# Short tapered shadows join each drawn lock to the existing swept hair texture.
for pts in [[(127,136),(120,130),(125,132),(135,138)],[(148,132),(137,122),(147,127),(155,134)],[(168,133),(157,121),(166,127),(172,134)],[(187,131),(180,122),(188,128),(191,133)],[(209,134),(207,125),(212,129),(216,135)],[(231,140),(228,133),(232,135),(237,146)]]:
 patch=Image.new('L',(W,H));ImageDraw.Draw(patch).polygon(pts,fill=255)
 m=(np.array(patch)>0)&zone&hair
 d[m,:3]=np.rint(d[m,:3]*.3+np.array([33,38,69])*.7).astype('uint8')
for lo,hi,tone,weight in [(0,1.8,[25,28,54],1.),(1.8,3,[34,40,73],.9),(3,4.2,[44,51,92],.35)]:
 m=zone&hair&(hd>lo)&(hd<=hi);d[m,:3]=np.rint(d[m,:3]*(1-weight)+np.array(tone)*weight).astype('uint8')
# Outer silhouette unchanged; a stronger charcoal/navy ink band follows original pixel steps.
headmask=np.array(Image.open(P/'horus-hair-guide/targets/idle-front-head-mask.png'))>128
outdepth=cv2.distanceTransform(headmask.astype('uint8'),cv2.DIST_L2,5)
outer=hair&(outdepth<=6)&(Y<182)
d[outer&(hd<=3.8)]=[25,25,27,255]
m=outer&(hd>3.8)&(hd<=6);d[m,:3]=np.rint(d[m,:3]*.45+np.array([28,30,48])*.55).astype('uint8')
allowed=region|zone|outer
assert np.all(d[~allowed]==a[~allowed]);assert np.all(d[226:]==a[226:])
Image.fromarray(d).save(O/'horus-idle-front.png');Image.fromarray((np.any(d!=a,2)*255).astype('uint8')).save(O/'edit-mask.png')
for bg,n in [('#f5efe3','front'),('#253041','dark')]:
 im=Image.new('RGBA',(W,H),bg);im.alpha_composite(Image.fromarray(d));im.resize((720,800),Image.Resampling.NEAREST).save(O/f'159-horus-{n}.png')
(O/'validation.json').write_text(json.dumps({'outsideAllowedDifference':int(np.count_nonzero(d[~allowed]!=a[~allowed])),'lowerFaceNeckBodyDifference':int(np.count_nonzero(d[226:]!=a[226:])),'walkFilesModified':False},indent=2))
