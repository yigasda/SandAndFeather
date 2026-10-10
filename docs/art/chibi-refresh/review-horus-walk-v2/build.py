"""Retarget measured approved walk poses onto the approved final sprite pixels."""
from pathlib import Path
from PIL import Image,ImageDraw
from scipy.spatial import Delaunay
import numpy as np,json,hashlib
R=Path(__file__).resolve().parents[4];O=Path(__file__).resolve().parent
A=R/'docs/art/chibi-refresh/approved'
# Neutral source is the cleaned final art, before the rejected v1 walk deformation.
source=R/'docs/art/chibi-refresh/review-horus-walk-v1/frames/horus-front-1.png'
base=Image.open(source).convert('RGBA');arr=np.array(base)
H,W=400,360;Y,X=np.mgrid[:H,:W]
# Approved source coordinates are in 360x400 cells. Remap anatomical proportions once,
# then use the SAME remap for all three approved poses. Timing/offsets come from runtime.
def norm(p):
 p=np.array(p,dtype=float)
 return np.stack([180+(p[...,0]-175)*1.10,236+(p[...,1]-218)*134/148],axis=-1)
def warp(im,src,dst):
 src=np.array(src,float);dst=np.array(dst,float);tri=Delaunay(dst)
 xy=np.stack([X.ravel(),Y.ravel()],axis=1);idx=tri.find_simplex(xy);ok=idx>=0;ids=idx[ok]
 b=np.einsum('nij,nj->ni',tri.transform[ids,:2],xy[ok]-tri.transform[ids,2]);b=np.c_[b,1-b.sum(axis=1)]
 pos=np.einsum('ni,nij->nj',b,src[tri.simplices[ids]])
 pos=np.rint(pos).astype(int);valid=(pos[:,0]>=0)&(pos[:,0]<W)&(pos[:,1]>=0)&(pos[:,1]<H)
 out=np.zeros((H*W,4),np.uint8);out[np.flatnonzero(ok)[valid]]=np.array(im)[pos[valid,1],pos[valid,0]]
 return Image.fromarray(out.reshape(H,W,4))
# Per-pose leg geometry measured on approved front PNGs: thigh, ankle, shoe, sole.
# Left/right refer to image coordinates. Shoes come entirely from the FINAL design.
legs=[
 [[(159,308,15),(158,321,14),(158,329,17),(160,341,20),(161,351,18)],[(184,305,15),(184,326,15),(184,334,19),(183,355,24),(184,366,22)]],
 [[(160,310,16),(159,326,15),(159,334,20),(161,353,23),(162,365,21)],[(195,310,15),(195,325,14),(195,331,17),(195,347,21),(195,355,19)]],
 [[(164,304,15),(164,326,15),(164,334,19),(163,355,24),(163,366,22)],[(191,309,15),(192,321,14),(192,328,17),(192,340,20),(192,351,18)]]]
# Body control mesh: exact neck lock, shoulders, inner arms, palms, waistband, hem.
static=[[90,230],[180,230],[270,230],[90,380],[270,380]]
srcbody=static+[[146,250],[214,250],[151,268],[209,268],[126,296],[234,296],[151,280],[209,280],[131,322],[151,324],[180,324],[209,324],[229,322]]
body_refs=[
 [[145,236],[201,236],[145,255],[202,255],[123,277],[218,277],[150,263],[196,263],[130,312],[149,315],[176,307],[198,307],[215,312]],
 [[147,236],[205,236],[149,255],[205,255],[128,278],[220,278],[153,263],[200,263],[134,312],[154,313],[177,313],[201,313],[218,312]],
 [[144,236],[204,236],[146,255],[204,255],[125,277],[224,277],[150,263],[200,263],[131,312],[148,307],[174,307],[200,315],[219,312]]]
# Remove the legs from the upper-body layer along actual skirt silhouette.
upper=arr.copy();upper[325:]=0
# At skirt edges these rows also contain transparent space only; hidden thigh pixels
# are covered by skirt in the final composite.
upper=Image.fromarray(upper)
poses=[]
for phase in range(3):
 out=Image.new('RGBA',(360,400))
 # Back leg first; forward leg is allowed to overlap exactly as in the approved walk.
 order=[0,1] if phase==0 else [1,0]
 for side in order:
  layer=arr.copy();layer[:313]=0
  if side==0:layer[:,178:]=0
  else:layer[:,:182]=0
  layer=Image.fromarray(layer)
  center=148 if side==0 else 212
  src=[];dst=[]
  # Source rows retain final sandals and skin shading. Final silhouette width varies
  # by row; outside anchors avoid slicing the outline.
  for (sy,sw),(cx,cy,tw) in zip([(313,20),(336,18),(342,22),(360,25),(370,25)],legs[phase][side]):
   src.extend([[center-sw,sy],[center,sy],[center+sw,sy]])
   dst.extend(norm([[cx-tw,cy],[cx,cy],[cx+tw,cy]]).tolist())
  out.alpha_composite(warp(layer,src,dst))
 target=static+norm(body_refs[phase]).tolist()
 body=warp(upper,srcbody,target)
 # Rigid head/collar junction: restore original approved pixels above y245.
 ba=np.array(body);ba[:245]=arr[:245];body=Image.fromarray(ba)
 out.alpha_composite(body)
 out.save(O/'frames'/f'horus-front-{phase}.png');poses.append(out)
# Read real runtime parameters instead of inventing another cycle.
runtime=json.loads((R/'data/sprites.json').read_text())['looks']['horus']['motion']
seq=runtime['sequence'];offsets=runtime['offsets']['down'];ms=runtime['frameMs']
# Match old/new side by side at identical phase; include original whole trio GIF.
bg=(248,243,231);reference=[Image.open(A/f'walk/horus-front-{i}.png').convert('RGBA') for i in range(3)]
newframes=[];comparison=[]
for phase,offset in zip(seq,offsets):
 c=Image.new('RGBA',(360,400),(*bg,255));c.alpha_composite(poses[phase],tuple(offset));newframes.append(c.convert('RGB'))
 c=Image.new('RGBA',(720,440),(*bg,255));d=ImageDraw.Draw(c);d.text((95,12),'APPROVED IN-GAME WALK',fill='#493e36');d.text((450,12),'FINAL ART / SAME POSE',fill='#493e36')
 c.alpha_composite(reference[phase],(offset[0],30+offset[1]));c.alpha_composite(poses[phase],(360+offset[0],30+offset[1]));comparison.append(c.convert('RGB'))
def gif(frames,name,scale=1):
 strip=Image.new('RGB',(frames[0].width*len(frames),frames[0].height))
 for i,f in enumerate(frames):strip.paste(f,(i*f.width,0))
 pal=strip.quantize(colors=256,method=Image.Quantize.MEDIANCUT)
 ps=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
 if scale!=1:ps=[p.resize((p.width*scale,p.height*scale),Image.Resampling.NEAREST) for p in ps]
 ps[0].save(O/name,save_all=True,append_images=ps[1:],duration=[ms]*len(ps),loop=0,disposal=2,optimize=False)
gif(newframes,'133-horus-front-walk.gif');gif(newframes,'133-horus-front-walk-2x.gif',2);gif(comparison,'133-approved-motion-comparison.gif')
sheet=Image.new('RGBA',(1080,400))
for i,p in enumerate(poses):sheet.alpha_composite(p,(i*360,0))
sheet.save(O/'horus-front-walk-sheet.png')
preview=Image.new('RGB',(1080,800),bg)
for i in range(3):
 preview.paste(reference[i],(i*360,0),reference[i]);preview.paste(poses[i],(i*360,400),poses[i])
preview.save(O/'pose-comparison.png')
report={'status':'review-not-approved','source':str(source.relative_to(R)),'reference':'approved/previews/trio-walk-preview.gif and approved/walk/horus-front-{0,1,2}.png','sequence':seq,'duration_ms':ms,'offsets':offsets,'head_difference_pixels':[int(np.any(np.array(p)[:235]!=arr[:235],axis=2).sum()) for p in poses],'redrawn_pixels':0,'method':'piecewise affine retargeting of approved final sprite pixels to measured approved walk landmarks','coordinate_remap':{'center_x':175,'target_center_x':180,'x_scale':1.10,'neck_y':218,'target_neck_y':236,'y_scale':134/148},'approved_leg_landmarks':legs,'runtime_changed':False}
(O/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(report)
