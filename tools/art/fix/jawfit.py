# python3 jawfit.py <png> <user picture in source coords (register.py)> <out> [cx,cy]
# move the jaw line onto a target line (the user's drawing), radially about c, lower half only.
# per angle: R_c = current inner edge of the outline, R_t = target. Inside R_t-IN nothing moves; the band
# R_t-IN..R_t takes R_t-IN..R_c; outside, R_t..R_t+M takes R_c..R_t+M (neck/background squeeze or stretch).
# Angles near the horizontal fade out (0..20 and 160..180 degrees).
import sys, numpy as np
from PIL import Image
sys.path.insert(0, __file__.rsplit('/',1)[0])
from contour import flat, rays
src,target,out=sys.argv[1:4]
cx,cy=map(float,sys.argv[4].split(',')) if len(sys.argv)>4 else (308,345)   # inside the face, below the eyes
IN,M=15,22
A=np.arange(0,181,2)
cur=rays(flat(src),(cx,cy),A)
tgt=rays(np.asarray(Image.open(target).convert('RGB')).astype(int),(cx,cy),A)
tgt=np.convolve(np.pad(tgt,2,mode='edge'),np.ones(5)/5,'valid')
cur=np.convolve(np.pad(cur,2,mode='edge'),np.ones(5)/5,'valid')
a=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H,W=a.shape[:2]
pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
dx,dy=xx-cx,yy-cy; r=np.hypot(dx,dy); th=np.degrees(np.arctan2(dy,dx))
low=(th>=0)&(th<=180)
Rc=np.interp(th,A,cur); Rt=np.interp(th,A,tgt)
def sm(t): t=np.clip(t,0,1); return t*t*(3-2*t)
w=sm(np.minimum(th,180-th)/20)*low
rs=np.where(r<Rt-IN, r, np.where(r<Rt, (Rt-IN)+(r-(Rt-IN))*(Rc-(Rt-IN))/IN, np.where(r<Rt+M, Rc+(r-Rt)*(Rt+M-Rc)/M, r)))
rs=r+w*(rs-r)
k=np.where(r>0,rs/np.maximum(r,1e-6),1)
sx=cx+dx*k; sy=cy+dy*k
x0=np.floor(sx).astype(int); y0=np.floor(sy).astype(int); fx=sx-x0; fy=sy-y0
def g(y,x):
    ok=(y>=0)&(y<H)&(x>=0)&(x<W); v=np.zeros((H,W,4),np.float32); v[ok]=pm[y[ok],x[ok]]; return v
o=(g(y0,x0)*((1-fx)*(1-fy))[...,None]+g(y0,x0+1)*(fx*(1-fy))[...,None]+g(y0+1,x0)*((1-fx)*fy)[...,None]+g(y0+1,x0+1)*(fx*fy)[...,None])
Aa=o[...,3]; rgb=np.where(Aa[...,None]>0,o[...,:3]*255/np.maximum(Aa[...,None],1e-3),0)
Aa=np.where(Aa>128,255,np.where(Aa>40,Aa,0))
b=np.dstack([np.clip(rgb,0,255),Aa]); still=np.abs(rs-r)<1e-3; b[still]=a[still]
Image.fromarray(b.round().astype(np.uint8),'RGBA').save(out)
print('max move',float(np.abs(rs-r).max()))
