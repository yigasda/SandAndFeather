from PIL import Image,ImageDraw
import cv2,numpy as np,importlib.util
from pathlib import Path
R=Path('/workspace/SandAndFeather-git');O=R/'docs/art/chibi-refresh/review-horus-front-v161';P=O.parent
s=importlib.util.spec_from_file_location('ch',R/'tools/art/check-hair.py');ch=importlib.util.module_from_spec(s);s.loader.exec_module(ch)
a=np.array(Image.open(P/'review-horus-five-v160/horus-front-option-1.png').convert('RGBA'));gen=np.array(Image.open(O/'painted-cleanup-source.png').convert('RGB'))
e,_,_=ch.eyes(a[:,:,:3]/255.,a[:,:,3]>128);ge,_,_=ch.eyes(gen/255.,np.min(gen,2)<200)
sv=np.subtract(ge[1],ge[0]);dv=np.subtract(e[1],e[0]);k=np.linalg.norm(dv)/np.linalg.norm(sv);ang=np.arctan2(dv[1],dv[0])-np.arctan2(sv[1],sv[0]);A=np.array([[np.cos(ang)*k,-np.sin(ang)*k],[np.sin(ang)*k,np.cos(ang)*k]]);t=np.mean(e,axis=0)-A@np.mean(ge,axis=0);M=np.column_stack((A,t));rgb=cv2.warpAffine(gen,M,(360,400),flags=cv2.INTER_AREA,borderValue=(245,239,227))
# Flood only the actual connected outside background, not light skin.
bg=(np.min(gen,2)>205).astype('uint8');n,labels,stats,cents=cv2.connectedComponentsWithStats(bg,8);outside=labels==labels[0,0];alpha=cv2.warpAffine((~outside).astype(float),M,(360,400),flags=cv2.INTER_LINEAR)
# Local painted repairs only. No user screenshot pixels are used.
mask=Image.new('L',(360,400));draw=ImageDraw.Draw(mask)
regions=[[(110,153),(120,153),(122,161),(114,166),(114,183),(109,188),(108,163)],[(235,153),(244,153),(251,168),(249,188),(243,190),(242,168)],[(82,180),(108,178),(113,190),(112,202),(105,194),(96,189),(88,193),(82,198)],[(245,180),(268,177),(276,192),(273,201),(264,193),(254,192),(245,200)],[(241,211),(268,211),(274,217),(261,229),(240,231),(235,224)]]
for points in regions:draw.polygon(points,fill=255)
m=np.array(mask)>0
# Blend at internal patch edges to original skin/hair; preserve drawn boundary cores.
dist=cv2.distanceTransform(m.astype('uint8'),cv2.DIST_L2,5);w=np.minimum(dist/2,1)
d=a.copy();d[m,:3]=np.rint(a[m,:3]*(1-w[m,None])+rgb[m]*w[m,None]).astype('uint8');d[m,3]=np.rint(a[m,3]*(1-w[m])+alpha[m]*255*w[m]).astype('uint8')
# Remove opaque cream artifacts outside ears from the old generator's rectangular patch.
cream=(d[:,:,0]>215)&(d[:,:,1]>210)&(d[:,:,2]>190)&(np.max(d[:,:,:3].astype(int),2)-np.min(d[:,:,:3].astype(int),2)<35)
Y,X=np.indices((400,360));zone=((X<111)|(X>245))&(Y>175)&(Y<231)
n,lab=cv2.connectedComponents((cream&zone).astype('uint8'),8)
for label in range(1,n):
 pts=lab==label
 if np.any(pts&((a[:,:,3]==0)|((Y==176)&zone))):d[pts,3]=0;m|=pts
# Finish the lower-right hair tip: close a one-pixel hole and remove isolated hook.
d[168,274]=[30,30,33,255]; d[168,275,3]=0; d[169,276:,3]=0
# Clean cream antialias remnants along the dark temple exterior.
for yy in range(176,185):
 for xx in list(range(80,88))+list(range(263,268)):
  if d[yy,xx,3]>0 and min(d[yy,xx,:3])>110:
   d[yy,xx,:3]=[30,30,33]
assert np.array_equal(d[235:],a[235:])
Image.fromarray(d).save(O/'horus-idle-front.png');Image.fromarray(rgb).save('/workspace/161-aligned.png')
for name,arr,bgc in [('161-front',d,'#f5efe3'),('161-dark',d,'#253041'),('161-before',a,'#f5efe3')]:
 cv=Image.new('RGBA',(360,400),bgc);cv.alpha_composite(Image.fromarray(arr));cv.resize((1080,1200),Image.Resampling.NEAREST).save(O/f'{name}.png')
 if name=='161-front':cv.crop((72,47,282,245)).resize((1050,990),Image.Resampling.NEAREST).save(O/'161-head.png')
 cv.crop((78,150,278,233)).resize((1000,415),Image.Resampling.NEAREST).save('/workspace/'+name+'-detail.png')
print('Changed pixels:',np.any(a!=d,2).sum())
