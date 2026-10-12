# python3 faceslim.py <in> <out> cx top eye chin neck mid low L
# narrower, rounder face with a slightly longer chin (front view):
# - rows above `top` untouched; the face narrows about x=cx smoothly to `mid` by `eye` and `low` at the chin, back to 1 by `neck`
# - the chin gets L rows longer: everything above `eye` moves up L, rows eye..chin stretch, the chin row stays
import sys, numpy as np
from PIL import Image
src,out=sys.argv[1],sys.argv[2]
cx,top,eye,chin,neck,mid,low,L=map(float,sys.argv[3:11])
a=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H,W=a.shape[:2]
pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def sm(t): t=np.clip(t,0,1); return t*t*(3-2*t)
# vertical: output row -> source row
e2=eye-L
sy=np.where(yy<e2, yy+L, np.where(yy<chin, chin-(chin-yy)*(chin-eye)/(chin-e2), yy))
def k_of(y):
    k=np.ones_like(y)
    k=np.where(y>top, 1+(mid-1)*sm((y-top)/(eye-top)), k)
    k=np.where(y>eye, mid+(low-mid)*sm((y-eye)/(chin-eye)), k)
    k=np.where(y>chin, low+(1-low)*sm((y-chin)/(neck-chin)), k)
    return k
sx=cx+(xx-cx)/k_of(sy)
x0=np.floor(sx).astype(int); y0=np.floor(sy).astype(int); fx=sx-x0; fy=sy-y0
def g(y,x):
    ok=(y>=0)&(y<H)&(x>=0)&(x<W); v=np.zeros((H,W,4),np.float32); v[ok]=pm[y[ok],x[ok]]; return v
o=(g(y0,x0)*((1-fx)*(1-fy))[...,None]+g(y0,x0+1)*(fx*(1-fy))[...,None]+g(y0+1,x0)*((1-fx)*fy)[...,None]+g(y0+1,x0+1)*(fx*fy)[...,None])
A=o[...,3]; rgb=np.where(A[...,None]>0,o[...,:3]*255/np.maximum(A[...,None],1e-3),0)
A=np.where(A>128,255,np.where(A>40,A,0))
Image.fromarray(np.dstack([np.clip(rgb,0,255),A]).round().astype(np.uint8),'RGBA').save(out)
