from pathlib import Path
import cv2,numpy as np,json
from PIL import Image
R=Path('/workspace/sand');O=Path('/workspace/horus-all-frame-guides');m=json.loads((O/'manifest.json').read_text());out=O/'clean-diagrams';out.mkdir(exist_ok=True)
# Head masks bounded at manually reviewed chin/neck heights; do not run skin mask over body.
chin={1:403,2:425,3:444,4:443,5:231,6:231,7:231,8:236,9:236,10:237,11:243,12:243,13:243,14:243,15:243,16:243,17:425,18:425,19:403,20:403,21:444,22:444,23:442,24:442,25:543,26:581,27:531,28:573,29:533,30:584,31:541,32:586,33:439,34:418,35:446,36:434,37:447,38:434,39:400,40:400,41:417,42:419,43:613,44:695,45:398,46:405,47:331,48:418,49:421,50:346}
for f in m['frames']:
 a=np.asarray(Image.open(R/f['source']).convert('RGBA'));r,g,b=a[:,:,:3].astype('int16').transpose(2,0,1);alpha=a[:,:,3];h,w=alpha.shape
 mask=((b>r+4)&(b>g-8)&(r<130)&(alpha>100)).astype('uint8')*255
 n,l,s,c=cv2.connectedComponentsWithStats(mask,8);k=1+np.argmax(s[1:,4]);x,y,hw,hh=map(int,s[k,:4]);num=f['number'];back=f['direction']=='up';combat=f['state'].startswith('combat-');front=f['direction']=='down'
 cy=chin.get(num,round(y+hh*1.065));x0=max(0,x-20);x1=min(w,x+hw+20)
 old=np.array(Image.open(O/f['diagram']).convert('RGBA'));ink=old.copy();ink[max(0,y-25):cy,x0:x1,3]=0
 def restore(box):
  xa,ya,xb,yb=[int(t) for t in box];xa=max(0,xa);ya=max(0,ya);xb=min(w,xb);yb=min(h,yb);ink[ya:yb,xa:xb]=old[ya:yb,xa:xb]
 if not back:
  if combat:
   if f['direction']=='right':ex=(.35,.86)
   else:ex=(.12,.68)
   restore((x+hw*ex[0],y+hh*.60,x+hw*ex[1],y+hh*.93))
   mx=.64 if f['direction']=='right' else .34
   restore((x+hw*(mx-.07),y+hh*.95,x+hw*(mx+.07),cy-12))
  elif front:
   restore((x+hw*.18,y+hh*.66,x+hw*.82,y+hh*1.045))
   restore((x+hw*.43,y+hh*1.08,x+hw*.58,cy-12))
  else:
   ex=(.08,.43) if f['direction']=='left' else (.57,.90)
   restore((x+hw*ex[0],y+hh*.64,x+hw*ex[1],y+hh*.88))
   mx=.12 if f['direction']=='left' else .88
   restore((x+hw*(mx-.055),y+hh*.96,x+hw*(mx+.055),cy-12))
 # Preserve objects/raised hands around the face in these views.
 if num==50:restore((346,269,410,350))
 if num==44:restore((427,494,505,660))
 # Facial lines for tilted side sleep and fishing, direct manually defined eye/mouth windows.
 if num in (41,42):
  ink[max(0,y-25):cy,x0:x1,3]=0
  restore((377,337,448,382));restore((439,401,461,416))
 if num==44:
  ink[max(0,y-25):cy,max(x0,506):x1,3]=0
  restore((478,530,550,595));restore((590,566,695,640));restore((565,650,599,675));restore((427,494,505,660))
 # Remove tiny disconnected remnants; never change remaining coordinates.
 Image.fromarray(ink).save(out/Path(f['diagram']).name);f['clean_diagram']='clean-diagrams/'+Path(f['diagram']).name
 f['head_removal']={'method':'bounded manual head region and expression windows','region':[x0,max(0,y-25),x1,cy],'status':'expression-placement draft; not a new appearance template'}
(O/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
