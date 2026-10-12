# Horus on a stool from behind, after legcut: the kilt hem gets one even 5 px outline (the sides' own thickness)
# right under the white kilt, column by column; the thin leg-outline remains along it go.
import sys, numpy as np
from PIL import Image
src,out=sys.argv[1],sys.argv[2]
a=np.asarray(Image.open(src).convert('RGBA')).copy(); A=a[...,3]>0; L=a[...,:3].astype(int).mean(2)
X0,X1=226,378
cb=[]
for x in range(X0,X1+1):
    y=600
    while y>540 and not (A[y,x] and L[y,x]>=150): y-=1
    cb.append(y)
cb=np.array(cb); med=np.array([int(np.median(cb[max(0,i-3):i+4])) for i in range(len(cb))])
cbs=np.where(np.abs(cb-med)>3,med,cb)                  # only stray columns are evened out
dk=np.array([2,2,3],np.uint8)
for i,x in enumerate(range(X0,X1+1)):
    b=cbs[i]
    for y in range(b+1,b+6): a[y,x,:3]=dk; a[y,x,3]=255
    a[b+6:,x,3]=0
    for y in range(b-3,b+1):
        r,g,bb=a[y,x,:3].astype(int)
        if r-g>25 and L[y,x]<150: a[y,x,:3]=dk
Image.fromarray(a,'RGBA').save(out)
