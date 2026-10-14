# python3 headbody.py <in> <out> <head scale> <body scale> <neck x> <neck y> <rows> [width]
# head bigger, body smaller about the neck: scale h above the neck, smoothly to b over R rows below it.
# width (default 1): how much of the change goes across too; 0 = only up and down (the rows move, every row keeps its
# pixels' width: a body shortened without narrowing, 0.9.72 Set combat)
import sys, numpy as np
from PIL import Image
src,out,h,b,cx,cy,R=sys.argv[1],sys.argv[2],*map(float,sys.argv[3:8])
wide=float(sys.argv[8]) if len(sys.argv)>8 else 1.0
a=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H,W=a.shape[:2]
pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
# output row -> source row: integrate 1/k so rows stay continuous
def k_of(ys):
    t=np.clip((ys-cy)/R,0,1); return h+(b-h)*t*t*(3-2*t)
# build inverse map for rows numerically: source y for each output y
ys_src=np.linspace(-200,H+400,20000); dy=ys_src[1]-ys_src[0]
kk=k_of(ys_src); yo=np.cumsum(kk)*dy; yo-=np.interp(cy,ys_src,yo)-cy     # output y of each source y, neck fixed
sy=np.interp(yy,yo,ys_src); ks=1+(k_of(sy)-1)*wide; sx=cx+(xx-cx)/ks
x0=np.floor(sx).astype(int); y0=np.floor(sy).astype(int); fx=sx-x0; fy=sy-y0
def g(y,x):
    ok=(y>=0)&(y<H)&(x>=0)&(x<W); v=np.zeros((H,W,4),np.float32); v[ok]=pm[y[ok],x[ok]]; return v
o=(g(y0,x0)*((1-fx)*(1-fy))[...,None]+g(y0,x0+1)*(fx*(1-fy))[...,None]+g(y0+1,x0)*((1-fx)*fy)[...,None]+g(y0+1,x0+1)*(fx*fy)[...,None])
A=o[...,3]; rgb=np.where(A[...,None]>0,o[...,:3]*255/np.maximum(A[...,None],1e-3),0)
A=np.where(A>128,255,np.where(A>40,A,0))
Image.fromarray(np.dstack([np.clip(rgb,0,255),A]).round().astype(np.uint8),'RGBA').save(out)
