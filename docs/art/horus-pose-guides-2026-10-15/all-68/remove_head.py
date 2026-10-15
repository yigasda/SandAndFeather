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
 old=np.array(Image.open(O/f['diagram']).convert('RGBA'));ink=old.copy()
 hair=(l==k).astype('uint8')*255
 # Convex hull of hair, then facial component, limited by reviewed neck boundary.
 yy,xx=np.where(hair>0);head=np.zeros_like(hair);cv2.fillConvexPoly(head,cv2.convexHull(np.column_stack((xx,yy)).astype('int32')),255)
 roi=np.zeros_like(hair);roi[max(0,int(y+hh*.4)):cy,x0:x1]=255
 skin=((r>160)&(g>95)&(b>75)&(r>g+5)&(g>b)&(r-b<135)&(alpha>100)&(roi>0)).astype('uint8')*255
 skin=cv2.morphologyEx(skin,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8));nn,ll,ss,cc=cv2.connectedComponentsWithStats(skin,8);face=np.zeros_like(skin)
 if nn>1 and not back:
  kk=1+np.argmax(ss[1:,4]);yy,xx=np.where(ll==kk);cv2.fillConvexPoly(face,cv2.convexHull(np.column_stack((xx,yy)).astype('int32')),255)
 rad=max(5,round(hw*.025));ker=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*rad+1,)*2)
 head=cv2.dilate(np.maximum(head,face),ker);head[cy:]=0
 ink[:,:,3][head>0]=0
 if not back:
  inside=cv2.erode(face,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(rad*2+1,)*2))
  inside[cv2.dilate(hair,np.ones((7,7),np.uint8))>0]=0
  ink[:,:,3][inside>0]=old[:,:,3][inside>0]
 # Front and rear have no overlapping weapon: clear residual ears/hair dots explicitly.
 if back:
  ink[max(0,y-25):cy,x0:x1,3]=0
  if num==20:ink[350:cy,470:520]=old[350:cy,470:520]
 if front and num!=44:
  saved=ink.copy();ink[max(0,y-25):cy,x0:x1,3]=0
  xa=int(x+hw*.16);xb=int(x+hw*.84)
  ink[max(0,y):cy,xa:xb]=saved[max(0,y):cy,xa:xb]
 # Keep untouched props whose outlines meet head masking boundary.
 def restore(box):
  xa,ya,xb,yb=map(int,box);ink[ya:yb,xa:xb]=old[ya:yb,xa:xb]
 if num==50:restore((346,269,410,350))
 if num==44:restore((427,494,505,660))
 # Remove tiny disconnected remnants; never change remaining coordinates.
 Image.fromarray(ink).save(out/Path(f['diagram']).name);f['clean_diagram']='clean-diagrams/'+Path(f['diagram']).name
 f['head_removal']={'method':'bounded manual head region and expression windows','region':[x0,max(0,y-25),x1,cy],'status':'expression-placement draft; not a new appearance template'}
(O/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
