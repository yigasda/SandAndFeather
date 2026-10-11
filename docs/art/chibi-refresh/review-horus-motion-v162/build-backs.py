from PIL import Image,ImageDraw
import numpy as np,cv2,importlib.util
from pathlib import Path
R=Path('/workspace/SandAndFeather-git');P=R/'docs/art/chibi-refresh';O=Path(__file__).resolve().parent/'native';W=P/'review-trio-walk-v5/walk';T=P/'horus-hair-guide/targets'
base=np.array(Image.open(P/'review-trio-idle-v1/native/horus-back.png').convert('RGBA'));gen=np.array(Image.open(O.parent/'painted-back-source.png').convert('RGB'));H,WW=base.shape[:2];Y,X=np.indices((H,WW))
M=np.array([[202/1240,0,75-60*202/1240],[0,176/1015,42-15*176/1015]],float);rgb=cv2.warpAffine(gen,M,(WW,H),flags=cv2.INTER_AREA,borderValue=(245,239,227));srcmask=np.min(rgb,2)<160
target=np.array(Image.open(T/'idle-back-head-mask.png'))>128
# Match painted outer locks to guide geometry by moving their contours, not cutting off the paint.
cx,cy=176,154;angles=np.linspace(-np.pi,np.pi,1440,endpoint=False);rr=np.arange(0,240,.25);xx=np.rint(cx+np.cos(angles[:,None])*rr).astype(int);yy=np.rint(cy+np.sin(angles[:,None])*rr).astype(int);valid=(xx>=0)&(xx<WW)&(yy>=0)&(yy<H);xx=np.clip(xx,0,WW-1);yy=np.clip(yy,0,H-1)
rs=np.max(np.where(srcmask[yy,xx]&valid,rr,0),1);rt=np.max(np.where(target[yy,xx]&valid,rr,0),1)
a=np.arctan2(Y-cy,X-cx);idx=((a+np.pi)/(2*np.pi)*1440).astype(int)%1440;r=np.hypot(X-cx,Y-cy);ratio=rs[idx]/np.maximum(rt[idx],1)
# Place drawn contour at the specified silhouette while keeping central crown shading stable.
rad=r+(ratio-1)*r*np.clip(r/np.maximum(rt[idx],1),0,1)**1.3
mx=cx+np.cos(a)*rad;my=cy+np.sin(a)*rad;paint=cv2.remap(rgb,mx.astype('float32'),my.astype('float32'),cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(245,239,227))
# Keep the target crown silhouette and join it into the unchanged original ear/nape silhouette.
target=cv2.morphologyEx(target.astype('uint8'),cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_CROSS,(3,3))).astype(bool)
orig=base[:,:,3]>128
signed=lambda m: cv2.distanceTransform(m.astype('uint8'),cv2.DIST_L2,5)-cv2.distanceTransform((~m).astype('uint8'),cv2.DIST_L2,5)
v=np.clip((182-Y)/18,0,1);shape=(signed(target)*v+signed(orig)*(1-v))>0
# Paint background samples exposed by the contour deformation with adjacent indigo pigment.
good=(paint[:,:,2]>paint[:,:,0]*1.25)&(paint[:,:,2]>paint[:,:,1]*1.12)&(np.max(paint,2)<180)&shape
bad=shape&~good&(Y<182)
_,labels=cv2.distanceTransformWithLabels((~good).astype('uint8'),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
gy,gx=np.where(good);near=np.column_stack([gy,gx])[np.clip(labels-1,0,len(gy)-1)];ny,nx=near[bad].T;paint[bad]=paint[ny,nx]
# Deliberately ink the complete newly painted perimeter, with an indigo inner shadow.
dist=cv2.distanceTransform(shape.astype('uint8'),cv2.DIST_L2,5)
paint[shape&(dist<2.2)&(Y<182)]=[25,27,42]
# Blend color only inside solid hair. Never blend alpha across incompatible silhouettes.
b=base.copy();zone=Y<182;opacity=np.clip((182-Y)/15,0,1)
b[zone,:3]=np.rint(base[zone,:3]*(1-opacity[zone,None])+paint[zone]*opacity[zone,None]).astype('uint8')
b[zone,3]=shape[zone]*255
b[zone&~orig&shape,:3]=paint[zone&~orig&shape]
# Ear and neck pixels below the hair roots stay literal original pixels.
# Repaint shortened standing legs and taller sandals within fixed skirt and sole anchors.
legs=base[314:332].copy();shoe=base[332:370].copy();b[314:326]=np.array(Image.fromarray(legs).resize((360,12),Image.Resampling.NEAREST));b[326:370]=np.array(Image.fromarray(shoe).resize((360,44),Image.Resampling.NEAREST))
# Tidy strap curvature after increasing sandal height, keeping two separate shoes.
Image.fromarray(b).save(O/'horus-idle-back.png')
ref=np.array(Image.open(W/'horus-back-1.png').convert('RGBA'))
def gray(a):return cv2.cvtColor((a[:,:,:3]*(a[:,:,3:4]/255)+(1-a[:,:,3:4]/255)*245).astype('uint8'),cv2.COLOR_RGB2GRAY)
def warp(a,mx,my):
 af=a[:,:,3]/255.;v=np.dstack([a[:,:,:3]*af[:,:,None],af*255]);d=cv2.remap(v.astype('float32'),mx.astype('float32'),my.astype('float32'),cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT);d[:,:,:3]/=np.maximum(d[:,:,3:4]/255,1e-6);return np.clip(np.rint(d),0,255).astype('uint8')
# Transfer each original frame's crown movement into new painted locks, preserve native ears/nape and body.
results=[b]
for i in range(3):
 dst=np.array(Image.open(W/f'horus-back-{i}.png').convert('RGBA'));tm=np.array(Image.open(T/f'walk-back-{i}-head-mask.png'))>128
 dy=np.where(tm)[0].min()-np.where(target)[0].min();reg=cv2.warpAffine(base,np.array([[1,0,0],[0,1,dy]],float),(360,400));f=cv2.calcOpticalFlowFarneback(gray(dst),gray(reg),None,.5,4,31,5,7,1.5,0);f=cv2.GaussianBlur(f,(0,0),4);f=np.clip(f,-2,2)
 # At the outer contour guide placement is fixed; original nonrigid movement animates inner locks.
 edgeDist=cv2.distanceTransform(tm.astype('uint8'),cv2.DIST_L2,5);weight=np.clip((edgeDist-3)/20,0,1)
 mx=X+f[:,:,0]*weight;my=Y-dy+f[:,:,1]*weight
 moved=warp(b,mx,my);d=dst.copy();region=Y<182+dy;w=np.clip((182+dy-Y)/12,0,1)
 d[region,:3]=np.rint(dst[region,:3]*(1-w[region,None])+moved[region,:3]*w[region,None]).astype('uint8');d[region,3]=moved[region,3]; extra=region&(dst[:,:,3]<128)&(moved[:,:,3]>128);d[extra,:3]=moved[extra,:3]
 assert np.array_equal(d[195:],dst[195:])
 Image.fromarray(d).save(O/f'horus-back-{i}.png');results.append(d)
sheet=Image.new('RGB',(1440,820),'#f5efe3')
for i,d in enumerate(results):
 cv=Image.new('RGBA',(360,400),'#f5efe3');cv.alpha_composite(Image.fromarray(d));sheet.paste(cv.resize((360,400),Image.Resampling.NEAREST),(i*360,15));sheet.paste(cv.crop((65,40,290,235)).resize((360,312),Image.Resampling.NEAREST),(i*360,450));ImageDraw.Draw(sheet).text((i*360+5,2),'IDLE' if i==0 else f'WALK {i-1}',fill='black')
 cv.resize((720,800),Image.Resampling.NEAREST).save(O/('back-idle-preview.png' if i==0 else f'back-{i-1}-preview.png'))
sheet.save(O/'back-result-sheet.png')
