from PIL import Image,ImageDraw
import numpy as np,cv2,importlib.util
from pathlib import Path
R=Path('/workspace/SandAndFeather-git');P=R/'docs/art/chibi-refresh';O=Path(__file__).resolve().parent/'native';W=P/'review-trio-walk-v5/walk'
s=importlib.util.spec_from_file_location('ch',R/'tools/art/check-hair.py');ch=importlib.util.module_from_spec(s);s.loader.exec_module(ch)
ref=np.array(Image.open(W/'horus-front-1.png').convert('RGBA'));base=np.array(Image.open(P/'review-horus-front-v161/horus-idle-front.png').convert('RGBA'));H,T=ref.shape[:2];Y,X=np.indices((H,T));e1,_,_=ch.eyes(ref[:,:,:3]/255.,ref[:,:,3]>128)
def gray(a):
 rgb=a[:,:,:3]*(a[:,:,3:4]/255)+(1-a[:,:,3:4]/255)*245
 return cv2.cvtColor(rgb.astype('uint8'),cv2.COLOR_RGB2GRAY)
def premwarp(a,mx,my):
 af=a[:,:,3]/255.;v=np.dstack([a[:,:,:3]*af[:,:,None],af*255]);b=cv2.remap(v.astype('float32'),mx.astype('float32'),my.astype('float32'),cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
 b[:,:,:3]/=np.maximum(b[:,:,3:4]/255,1e-6);return np.clip(np.rint(b),0,255).astype('uint8')
all=[]
for i in range(3):
 dst=np.array(Image.open(W/f'horus-front-{i}.png').convert('RGBA'));e,_,_=ch.eyes(dst[:,:,:3]/255.,dst[:,:,3]>128)
 sv=np.subtract(e1[1],e1[0]);dv=np.subtract(e[1],e[0]);k=np.linalg.norm(dv)/np.linalg.norm(sv);angle=np.arctan2(dv[1],dv[0])-np.arctan2(sv[1],sv[0]);A=np.array([[np.cos(angle)*k,-np.sin(angle)*k],[np.sin(angle)*k,np.cos(angle)*k]]);t=np.mean(e,0)-A@np.mean(e1,0);M=np.column_stack([A,t]);inv=cv2.invertAffineTransform(M)
 registered=cv2.warpAffine(ref,M,(T,H));g1=gray(dst);g2=gray(registered)
 f=cv2.calcOpticalFlowFarneback(g1,g2,None,.5,4,31,5,7,1.5,0)
 f=cv2.GaussianBlur(f,(0,0),3);f=np.clip(f,-3,3)
 # Preserve the approved outline in each frame's measured head placement; internal
 # hair shading follows the source frame's nonrigid movement without edge jitter.
 placed=cv2.warpAffine(base[:,:,3],M,(T,H))>128
 edgeDist=cv2.distanceTransform(placed.astype('uint8'),cv2.DIST_L2,5)
 f*=np.clip((edgeDist-2)/12,0,1)[:,:,None]
 if i==1:f[:]=0
 # Coherent deformation obtained from each original head, not an independently moving hair sticker.
 mx=inv[0,0]*(X+f[:,:,0])+inv[0,1]*(Y+f[:,:,1])+inv[0,2];my=inv[1,0]*(X+f[:,:,0])+inv[1,1]*(Y+f[:,:,1])+inv[1,2]
 moved=premwarp(base,mx,my);d=dst.copy();head=my<240;d[head]=moved[head]
 # Literal original frame's eyes/brows, lower face, chin, and full body remain unchanged.
 protected=((mx>117)&(mx<237)&(my>=166)&(my<223))|((mx>112)&(mx<241)&(my>=223))|(my>=240)
 # Avoid a hard boundary in unpainted skin just beside the central face.
 d[protected]=dst[protected]
 assert np.array_equal(d[245:],dst[245:])
 Image.fromarray(d).save(O/f'horus-front-{i}.png')
 cv=Image.new('RGBA',(T,H),'#f5efe3');cv.alpha_composite(Image.fromarray(d));all.append(cv)
 cv.crop((60,42,290,244)).resize((690,606),Image.Resampling.NEAREST).save(O/f'front-{i}-head.png')
sheet=Image.new('RGB',(1440,810),'#f5efe3');dd=ImageDraw.Draw(sheet)
for i,im in enumerate(all):sheet.paste(im.resize((480,533),Image.Resampling.NEAREST),(i*480,20));sheet.paste(im.crop((78,150,278,232)).resize((480,197),Image.Resampling.NEAREST),(i*480,580));dd.text((i*480+10,3),str(i),fill='black')
sheet.save(O/'front-result-sheet.png')
seq=[all[i].resize((720,800),Image.Resampling.NEAREST).convert('RGB') for i in [0,1,2,1]];seq[0].save(O/'front-walk.gif',save_all=True,append_images=seq[1:],duration=180,loop=0,disposal=2)
