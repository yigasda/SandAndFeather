# Somang on a stool from behind. Her white lower ruffle runs under the outer skirt as a band about 19-24 px tall
# (measured where the legs do not cover it); over the legs only its top shows. The new bottom edge is the outer
# skirt's hem line moved down by that band height, so it follows the skirt's own wave. The hidden lower band is
# filled from the uncovered band at the leg's side (same distance from the bottom), then the dress outline (7 px).
import sys, numpy as np
from PIL import Image
from collections import deque
src, out = sys.argv[1], sys.argv[2]
o=np.asarray(Image.open(src).convert('RGBA')).astype(int); a=o.copy().astype(np.uint8); H,W=o.shape[:2]
L=o[...,:3].mean(2); sat=o[...,:3].max(2)-o[...,:3].min(2); A=o[...,3]>0
# the sides, where the ruffle's bottom shows: traced at 8x
P=[(195,516),(200,519),(207,523),(213,527),(225,528),(232,526),(235,524),(378,525),(380,526),(390,528),(398,527),(402,525),
   (405,523),(410,521),(415,518),(420,516),(424,514)]
xs=np.arange(195,425); bot=np.round(np.interp(xs,[p[0] for p in P],[p[1] for p in P])).astype(int)
# the legs in the original (skin and their outline), flooded from the two thighs
legok=A&((sat>=48)|(L<100)); legok[:499]=False; legok[:,:240]=False; legok[:,:]&=True
leg=np.zeros((H,W),bool); q=deque([(530,280),(530,340)]); leg[530,280]=leg[530,340]=True
while q:
    y,x=q.popleft()
    for ny,nx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
        if 0<=ny<H and 240<=nx<380 and legok[ny,nx] and not leg[ny,nx]: leg[ny,nx]=True; q.append((ny,nx))
# the middle: outer hem + band height
def hem(x):
    y=470
    while y<540 and not (A[y,x] and L[y,x]<100): y+=1
    return y
X0,X1=236,377
hx=np.array([hem(x) for x in range(X0,X1+1)])
hx=np.array([int(np.median(hx[max(0,k-4):k+5])) for k in range(len(hx))])     # one smooth hem, no leg-outline hits
H_=dict(zip(range(X0,X1+1),hx.tolist()))
refL,refR=238,372
T=lambda x: np.interp(x,[X0,X1],[19,24])
def band(rx):
    h=H_[rx]; nb=int(round(h+T(rx))); return [o[y,rx] for y in range(h+1,nb+1)]
BL,BR=band(refL),band(refR)
for i,x in enumerate(xs):
    if X0<=x<=X1:
        h=H_[x]; nb=int(round(h+T(x))); B=BL
        full = 258<=x<=347                        # the legs covered the whole band here
        for y in range(h+1,nb+1):
            if full or leg[y,x] or not A[y,x]:
                a[y,x]=B[min(len(B)-1,int((y-h-1)/(nb-h)*len(B)))]
        bot[i]=nb
b=bot.copy()
ramp=[(38,10,9),(30,6,5),(22,3,2),(16,0,0),(12,0,0),(10,0,0),(10,0,0)]
for x,y in zip(xs,b):
    a[y+1:,x,3]=0
    for k in range(7): a[y+1+k,x,:3]=ramp[k]; a[y+1+k,x,3]=255
a[548:,180:430,3]=0
Image.fromarray(a,'RGBA').save(out)
print('middle bottom', {int(x):int(y) for x,y in zip(xs,b) if X0<=x<=X1 and x%10==0})
