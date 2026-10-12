# python3 widen.py <in> <out> <scale> r0 r1 r2 r3
import sys, numpy as np
from PIL import Image
src,out,s=sys.argv[1],sys.argv[2],float(sys.argv[3])
r0,r1,r2,r3=[int(v) for v in sys.argv[4:8]]   # ramp up r0→r1, full s until r2, ramp down to 1 at r3
a=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H,W=a.shape[:2]
al=a[...,3]>128; xs0=np.nonzero(al[450])[0]; cx=(xs0.min()+xs0.max())/2
def k(y):
    if y<r0 or y>=r3: return 1.0
    if y<r1: return 1+(s-1)*(y-r0)/(r1-r0)
    if y<=r2: return s
    return s+(1-s)*(y-r2)/(r3-r2)
pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
b=a.copy(); X=np.arange(W,dtype=np.float32)
for y in range(r0,r3):
    f=k(y); srcx=cx+(X-cx)/f
    o=np.stack([np.interp(srcx,X,pm[y,:,c],left=0,right=0) for c in range(4)],-1)
    A=o[:,3]; rgb=np.where(A[:,None]>0,o[:,:3]*255/np.maximum(A[:,None],1e-3),0)
    A=np.where(A>128,255,np.where(A>40,A,0))
    b[y,:,:3]=np.clip(rgb,0,255); b[y,:,3]=A
Image.fromarray(b.round().astype(np.uint8),'RGBA').save(out)
