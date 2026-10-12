# python3 narrow.py <in> <out> <scale> <top row> <full row> <hem row>
# narrow frame 1's upper body: one constant factor from under the chin to the hands (shapes keep their angles, no
# bend at the shoulders), then back to full width down the skirt to its hem; legs and head untouched
import sys, numpy as np
from PIL import Image
src,out,s,top,full,hem=sys.argv[1],sys.argv[2],float(sys.argv[3]),int(sys.argv[4]),int(sys.argv[5]),int(sys.argv[6])
a=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); H,W=a.shape[:2]
al=a[...,3]>128; xs0=np.nonzero(al[full])[0]; cx=(xs0.min()+xs0.max())/2
def k(y):
    if y<top or y>=hem: return 1.0
    if y<=full: return s
    return s+(1-s)*(y-full)/(hem-full)
pm=a.copy(); pm[...,:3]*=pm[...,3:4]/255
b=a.copy(); X=np.arange(W,dtype=np.float32)
for y in range(top,hem):
    f=k(y)
    srcx=cx+(X-cx)/f
    o=np.stack([np.interp(srcx,X,pm[y,:,c],left=0,right=0) for c in range(4)],-1)
    A=o[:,3]; rgb=np.where(A[:,None]>0,o[:,:3]*255/np.maximum(A[:,None],1e-3),0)
    A=np.where(A>128,255,np.where(A>40,A,0))
    b[y,:,:3]=np.clip(rgb,0,255); b[y,:,3]=A
Image.fromarray(b.round().astype(np.uint8),'RGBA').save(out)
print('cx',cx)
