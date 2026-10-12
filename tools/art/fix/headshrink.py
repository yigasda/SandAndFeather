# python3 headshrink.py <in> <out> <scale> <neck x> <neck y> <rows>
# shrink the head (and the hair around it) about the neck: scale s above the neck, back to 1 over R rows below it
import sys, numpy as np
from PIL import Image
src,out,s,cx,cy,R=sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5]),float(sys.argv[6])
a=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H,W=a.shape[:2]
pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
t=np.clip((yy-cy)/R,0,1); k=s+(1-s)*t*t*(3-2*t)      # smooth from s at the neck to 1 R rows below
sx=cx+(xx-cx)/k; sy=cy+(yy-cy)/k
x0=np.floor(sx).astype(int); y0=np.floor(sy).astype(int); fx=sx-x0; fy=sy-y0
def g(y,x):
    ok=(y>=0)&(y<H)&(x>=0)&(x<W); v=np.zeros((H,W,4),np.float32); v[ok]=pm[y[ok],x[ok]]; return v
o=(g(y0,x0)*((1-fx)*(1-fy))[...,None]+g(y0,x0+1)*(fx*(1-fy))[...,None]+g(y0+1,x0)*((1-fx)*fy)[...,None]+g(y0+1,x0+1)*(fx*fy)[...,None])
A=o[...,3]; rgb=np.where(A[...,None]>0,o[...,:3]*255/np.maximum(A[...,None],1e-3),0)
A=np.where(A>128,255,np.where(A>40,A,0))
b=np.dstack([np.clip(rgb,0,255),A]); b[yy>=cy+R]=a[yy>=cy+R]
Image.fromarray(b.round().astype(np.uint8),'RGBA').save(out)
