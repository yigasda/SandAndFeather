# shrink an ear by warping, no holes: outside the face line (u = distance from it, away from the face) the ear is
# pressed toward the line to s of its width and toward row ay to sv of its height; past the ear the hair and the
# background stretch in to fill (k back to 1 between E and E+F). Inside the face nothing moves.
# python3 earwarp.py in out side s sv E F ay hy x,y x,y ...   (face line points top to bottom; hy = ear half height)
import sys, numpy as np
from PIL import Image
src,out,side=sys.argv[1],sys.argv[2],sys.argv[3]
s,sv,E,F,ay,hy=map(float,sys.argv[4:10]); pts=np.array([list(map(float,p.split(','))) for p in sys.argv[10:]])
a=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H,W=a.shape[:2]
pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def sm(t): t=np.clip(t,0,1); return t*t*(3-2*t)
xf=np.interp(yy,pts[:,1],pts[:,0])
sg=-1 if side=='L' else 1
u=(xx-xf)*sg
wy=1-sm((np.abs(yy-ay)-hy)/20)
# output u -> source u: k(u_src)=s up to E, 1 after E+F; integrate
us=np.linspace(0,400,8000); du=us[1]-us[0]
k=s+(1-s)*sm((us-E)/F); uo=np.concatenate([[0],np.cumsum(k[:-1])*du])
usrc=np.where(u>0,np.interp(u,uo,us),u)
usrc=u+(usrc-u)*wy
sx=xf+sg*usrc
wv=sm(u/8)*(1-sm((u-E*s)/F))*wy
sy=ay+(yy-ay)/(1+(sv-1)*wv)
x0=np.floor(sx).astype(int); y0=np.floor(sy).astype(int); fx=sx-x0; fy=sy-y0
def g(y,x):
    ok=(y>=0)&(y<H)&(x>=0)&(x<W); v=np.zeros((H,W,4),np.float32); v[ok]=pm[y[ok],x[ok]]; return v
o=(g(y0,x0)*((1-fx)*(1-fy))[...,None]+g(y0,x0+1)*(fx*(1-fy))[...,None]+g(y0+1,x0)*((1-fx)*fy)[...,None]+g(y0+1,x0+1)*(fx*fy)[...,None])
A=o[...,3]; rgb=np.where(A[...,None]>0,o[...,:3]*255/np.maximum(A[...,None],1e-3),0)
A=np.where(A>128,255,np.where(A>40,A,0))
b=np.dstack([np.clip(rgb,0,255),A]); keep=(u<=0)|(wy<=0); b[keep]=a[keep]
Image.fromarray(b.round().astype(np.uint8),'RGBA').save(out)
